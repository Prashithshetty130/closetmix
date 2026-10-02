import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { removeBackground } from "@/lib/ai/background-removal";
import { analyzeGarmentImage } from "@/lib/ai/tagger";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's saved Gemini API key if present
    let userApiKey: string | undefined;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { preferences: true },
      });
      if (dbUser?.preferences) {
        const parsed = JSON.parse(dbUser.preferences);
        userApiKey = parsed.geminiApiKey;
      }
    } catch {}

    const body = await req.json().catch(() => ({}));
    const { itemIds } = body as { itemIds?: string[] };

    const where: any = { userId: user.id };
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      where.id = { in: itemIds };
    }

    const items = await prisma.clothingItem.findMany({ where });
    const reprocessed = [];

    for (const item of items) {
      try {
        let imageBuffer: Buffer;

        if (item.originalImageUrl.startsWith("data:")) {
          const parts = item.originalImageUrl.split(",");
          imageBuffer = Buffer.from(parts[1] || "", "base64");
        } else {
          // Path to the original or display image on local disk
          const cleanOriginalUrl = item.originalImageUrl.replace(/^\//, "");
          const originalDiskPath = path.join(process.cwd(), "public", cleanOriginalUrl);
          try {
            imageBuffer = await fs.readFile(originalDiskPath);
          } catch (readErr) {
            console.warn(`Could not read original image at ${originalDiskPath}, skipping item ${item.id}`);
            continue;
          }
        }

        // 1. Re-tag using computer vision / OpenRouter vision
        const newTags = await analyzeGarmentImage(imageBuffer, item.name, userApiKey);

        // 2. Generate new high-precision studio cutout
        const newCutoutBuffer = await removeBackground(imageBuffer, {
          box_2d: newTags.box_2d as [number, number, number, number] | undefined,
        });

        const newCutoutDataUrl = `data:image/png;base64,${newCutoutBuffer.toString("base64")}`;
        let updatedProcessedUrl = newCutoutDataUrl;

        // If not on Vercel, also attempt disk write if relative path
        if (!process.env.VERCEL && !item.processedImageUrl.startsWith("data:")) {
          try {
            const cleanCutoutUrl = item.processedImageUrl.replace(/^\//, "");
            const cutoutDiskPath = path.join(process.cwd(), "public", cleanCutoutUrl);
            await fs.writeFile(cutoutDiskPath, newCutoutBuffer);
            updatedProcessedUrl = item.processedImageUrl;
          } catch {}
        }

        // 3. Update database record
        const updatedItem = await prisma.clothingItem.update({
          where: { id: item.id },
          data: {
            name: newTags.name,
            processedImageUrl: updatedProcessedUrl,
            category: newTags.category,
            subcategory: newTags.subcategory,
            primaryColor: newTags.primaryColor,
            primaryColorHex: newTags.primaryColorHex,
            secondaryColor: newTags.secondaryColor || null,
            secondaryColorHex: newTags.secondaryColorHex || null,
            pattern: newTags.pattern,
            material: newTags.material,
            fit: newTags.fit,
            season: newTags.season,
            formality: newTags.formality,
            notes: newTags.stylingNotes || item.notes,
          },
        });

        reprocessed.push(updatedItem);
      } catch (itemErr) {
        console.error(`Error reprocessing item ${item.id}:`, itemErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: reprocessed.length,
      items: reprocessed,
    });
  } catch (error: any) {
    console.error("Reprocess API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reprocess wardrobe items" },
      { status: 500 }
    );
  }
}
