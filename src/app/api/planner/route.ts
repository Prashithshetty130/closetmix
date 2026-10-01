import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const scheduleSchema = z.object({
  outfitId: z.string(),
  date: z.string(), // YYYY-MM-DD or ISO string
  notes: z.string().optional(),
});

// GET: Fetch calendar schedule
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entries = await prisma.calendarEntry.findMany({
      where: { userId: user.id },
      include: {
        outfit: {
          include: {
            items: {
              include: { clothingItem: true },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, entries });
  } catch (error: any) {
    console.error("Fetch calendar error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch calendar" }, { status: 500 });
  }
}

// POST: Schedule an outfit to a calendar day
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { outfitId, date, notes } = parsed.data;

    // Verify outfit belongs to user
    const outfit = await prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit || outfit.userId !== user.id) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    const targetDate = new Date(date);

    const entry = await prisma.calendarEntry.create({
      data: {
        userId: user.id,
        outfitId,
        date: targetDate,
        notes: notes || null,
      },
      include: {
        outfit: {
          include: {
            items: {
              include: { clothingItem: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error("Create calendar entry error:", error);
    return NextResponse.json({ error: error.message || "Failed to schedule outfit" }, { status: 500 });
  }
}
