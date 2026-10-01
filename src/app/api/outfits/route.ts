import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveOutfitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  occasion: z.string(),
  weatherSuitability: z.string().optional(),
  confidenceScore: z.number().default(90),
  stylingExplanation: z.string(),
  itemIds: z.array(z.string()).min(2, "Outfit must contain at least 2 items"),
  slotMapping: z.record(z.string(), z.string()).optional(), // itemId -> slot
});

// GET: Fetch saved outfits for user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const outfits = await prisma.outfit.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: { clothingItem: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, outfits });
  } catch (error: any) {
    console.error("Fetch saved outfits error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch outfits" }, { status: 500 });
  }
}

// POST: Save outfit
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = saveOutfitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { name, occasion, weatherSuitability, confidenceScore, stylingExplanation, itemIds, slotMapping } = parsed.data;

    // Verify all items belong to user
    const userItems = await prisma.clothingItem.findMany({
      where: { id: { in: itemIds }, userId: user.id },
    });

    if (userItems.length !== itemIds.length) {
      return NextResponse.json({ error: "Some items were not found in your wardrobe" }, { status: 400 });
    }

    const outfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        name,
        occasion,
        weatherSuitability: weatherSuitability || "Mild transitional weather",
        confidenceScore,
        stylingExplanation,
        items: {
          create: userItems.map((it) => ({
            clothingItemId: it.id,
            slot: (slotMapping && slotMapping[it.id]) || it.category,
            isLocked: false,
          })),
        },
      },
      include: {
        items: {
          include: { clothingItem: true },
        },
      },
    });

    return NextResponse.json({ success: true, outfit });
  } catch (error: any) {
    console.error("Save outfit error:", error);
    return NextResponse.json({ error: error.message || "Failed to save outfit" }, { status: 500 });
  }
}
