import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const outfit = await prisma.outfit.findUnique({ where: { id } });
    if (!outfit || outfit.userId !== user.id) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    await prisma.outfit.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Outfit deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete outfit" }, { status: 500 });
  }
}

// POST: Log wear for the outfit and all its constituent items
export async function POST(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const outfit = await prisma.outfit.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!outfit || outfit.userId !== user.id) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    const now = new Date();

    // Increment outfit wear count
    await prisma.outfit.update({
      where: { id },
      data: {
        wearCount: { increment: 1 },
        lastWornAt: now,
      },
    });

    // Increment wear count on all items in the outfit
    const itemIds = outfit.items.map((i) => i.clothingItemId);
    await prisma.clothingItem.updateMany({
      where: { id: { in: itemIds } },
      data: {
        wearCount: { increment: 1 },
        lastWornAt: now,
      },
    });

    return NextResponse.json({ success: true, message: "Logged wear for outfit and items" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log wear" }, { status: 500 });
  }
}
