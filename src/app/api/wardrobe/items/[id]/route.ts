import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteItemFiles } from "@/lib/storage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = await prisma.clothingItem.findUnique({
      where: { id },
      include: {
        outfitItems: {
          include: { outfit: true },
        },
      },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch item" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = await prisma.clothingItem.findUnique({ where: { id } });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.clothingItem.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : item.name,
        category: body.category !== undefined ? body.category : item.category,
        subcategory: body.subcategory !== undefined ? body.subcategory : item.subcategory,
        primaryColor: body.primaryColor !== undefined ? body.primaryColor : item.primaryColor,
        primaryColorHex: body.primaryColorHex !== undefined ? body.primaryColorHex : item.primaryColorHex,
        secondaryColor: body.secondaryColor !== undefined ? body.secondaryColor : item.secondaryColor,
        secondaryColorHex: body.secondaryColorHex !== undefined ? body.secondaryColorHex : item.secondaryColorHex,
        pattern: body.pattern !== undefined ? body.pattern : item.pattern,
        material: body.material !== undefined ? body.material : item.material,
        fit: body.fit !== undefined ? body.fit : item.fit,
        season: body.season !== undefined ? body.season : item.season,
        formality: body.formality !== undefined ? body.formality : item.formality,
        isFavorite: body.isFavorite !== undefined ? body.isFavorite : item.isFavorite,
        notes: body.notes !== undefined ? body.notes : item.notes,
        wearCount: body.wearCount !== undefined ? body.wearCount : item.wearCount,
        lastWornAt: body.lastWornAt !== undefined ? new Date(body.lastWornAt) : item.lastWornAt,
        processedImageUrl: body.processedImageUrl !== undefined ? body.processedImageUrl : item.processedImageUrl,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const item = await prisma.clothingItem.findUnique({ where: { id } });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete database item (cascades to OutfitItem relations)
    await prisma.clothingItem.delete({ where: { id } });

    // Delete image files from disk
    await deleteItemFiles(user.id, id);

    return NextResponse.json({ success: true, message: "Garment deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete item" }, { status: 500 });
  }
}
