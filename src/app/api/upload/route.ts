import { NextResponse } from "next/server";
import { getCurrentUser, createGuestSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processAndSaveImage, ALLOWED_MIME_TYPES } from "@/lib/storage";
import { analyzeGarmentImage } from "@/lib/ai/tagger";

export async function POST(req: Request) {
  try {
    let session = await getCurrentUser();
    let userId = session?.id;
    let isGuest = session?.isGuest ?? true;

    if (!userId) {
      const newGuest = await createGuestSession();
      userId = newGuest.id;
      isGuest = newGuest.isGuest;
    }

    // Check for user-configured Gemini API Key in preferences or header
    let userApiKey: string | undefined = req.headers.get("x-gemini-api-key") || undefined;
    if (!userApiKey && userId) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { preferences: true },
        });
        if (dbUser?.preferences) {
          const parsed = JSON.parse(dbUser.preferences);
          if (parsed.geminiApiKey) userApiKey = parsed.geminiApiKey;
        }
      } catch {}
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      // Check for single "file" fallback
      const singleFile = formData.get("file") as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No image files provided" }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 images can be uploaded in a single batch" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const mimeType = file.type || "image/jpeg";
        const name = file.name || "garment.jpg";

        // Validate MIME type
        const isSupported =
          ALLOWED_MIME_TYPES.some((t) => mimeType.toLowerCase().includes(t.replace("image/", ""))) ||
          name.toLowerCase().match(/\.(jpe?g|png|webp|heic|heif)$/);

        if (!isSupported) {
          errors.push({ name, error: "Unsupported file format. Use JPG, PNG, WEBP, or HEIC." });
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // AI Vision Analysis and Tag Extraction (extracts category, tags, and garment bounding box)
        const tags = await analyzeGarmentImage(buffer, name, userApiKey);

        const processed = await processAndSaveImage(userId, buffer, name, mimeType, {
          box_2d: tags.box_2d as [number, number, number, number] | undefined,
        });

        results.push({
          ...processed,
          tags,
        });
      } catch (fileErr: any) {
        console.error(`Failed to process upload ${file.name}:`, fileErr);
        errors.push({ name: file.name, error: fileErr.message || "Failed to process image" });
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, isGuest },
      uploads: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process file uploads" },
      { status: 500 }
    );
  }
}
