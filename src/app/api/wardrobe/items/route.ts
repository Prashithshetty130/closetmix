import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  originalImageUrl: z.string(),
  processedImageUrl: z.string(),
  thumbnailUrl: z.string(),
  category: z.string(),
  subcategory: z.string(),
  primaryColor: z.string(),
  primaryColorHex: z.string(),
  secondaryColor: z.string().optional().nullable(),
  secondaryColorHex: z.string().optional().nullable(),
  pattern: z.string(),
  material: z.string(),
  fit: z.string(),
  season: z.string(),
  formality: z.string(),
  notes: z.string().optional().nullable(),
});

const batchSaveSchema = z.object({
  items: z.array(saveItemSchema),
});

// GET: Fetch all items for current user
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const formality = searchParams.get("formality");
    const season = searchParams.get("season");
    const search = searchParams.get("search");

    const where: any = { userId: user.id };
    if (category && category !== "ALL") where.category = category;
    if (formality && formality !== "ALL") where.formality = formality;
    if (season && season !== "ALL") where.season = season;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subcategory: { contains: search } },
        { primaryColor: { contains: search } },
        { material: { contains: search } },
      ];
    }

    const items = await prisma.clothingItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Fetch wardrobe items error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch wardrobe" }, { status: 500 });
  }
}

// POST: Batch save or single save reviewed items
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Check if batch or single
    let itemsToSave: z.infer<typeof saveItemSchema>[] = [];
    if (Array.isArray(body.items)) {
      const parsed = batchSaveSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
      }
      itemsToSave = parsed.data.items;
    } else {
      const parsed = saveItemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
      }
      itemsToSave = [parsed.data];
    }

    const createdItems = [];
    for (const item of itemsToSave) {
      const created = await prisma.clothingItem.create({
        data: {
          id: item.id,
          userId: user.id,
          name: item.name,
          originalImageUrl: item.originalImageUrl,
          processedImageUrl: item.processedImageUrl,
          thumbnailUrl: item.thumbnailUrl,
          category: item.category,
          subcategory: item.subcategory,
          primaryColor: item.primaryColor,
          primaryColorHex: item.primaryColorHex,
          secondaryColor: item.secondaryColor || null,
          secondaryColorHex: item.secondaryColorHex || null,
          pattern: item.pattern,
          material: item.material,
          fit: item.fit,
          season: item.season,
          formality: item.formality,
          notes: item.notes || null,
        },
      });
      createdItems.push(created);
    }

    return NextResponse.json({ success: true, count: createdItems.length, items: createdItems });
  } catch (error: any) {
    console.error("Save wardrobe items error:", error);
    return NextResponse.json({ error: error.message || "Failed to save items" }, { status: 500 });
  }
}
