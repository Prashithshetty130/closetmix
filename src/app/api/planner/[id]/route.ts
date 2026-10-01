import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entry = await prisma.calendarEntry.findUnique({
      where: { id },
      include: {
        outfit: {
          include: { items: true },
        },
      },
    });

    if (!entry || entry.userId !== user.id) {
      return NextResponse.json({ error: "Calendar entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const wasWorn = body.wasWorn !== undefined ? Boolean(body.wasWorn) : entry.wasWorn;

    // If newly marked as worn, increment counters
    if (wasWorn && !entry.wasWorn) {
      const now = new Date();
      await prisma.outfit.update({
        where: { id: entry.outfitId },
        data: { wearCount: { increment: 1 }, lastWornAt: now },
      });

      const itemIds = entry.outfit.items.map((i) => i.clothingItemId);
      await prisma.clothingItem.updateMany({
        where: { id: { in: itemIds } },
        data: { wearCount: { increment: 1 }, lastWornAt: now },
      });
    }

    const updated = await prisma.calendarEntry.update({
      where: { id },
      data: {
        wasWorn,
        notes: body.notes !== undefined ? body.notes : entry.notes,
      },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    console.error("Update calendar entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entry = await prisma.calendarEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== user.id) {
      return NextResponse.json({ error: "Calendar entry not found" }, { status: 404 });
    }

    await prisma.calendarEntry.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Calendar entry deleted" });
  } catch (error: any) {
    console.error("Delete calendar entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete entry" }, { status: 500 });
  }
}
