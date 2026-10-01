import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const feedbackSchema = z.object({
  outfitId: z.string(),
  liked: z.boolean(),
  comment: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { outfitId, liked, comment } = parsed.data;

    // Check outfit exists
    const outfit = await prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit) {
      return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
    }

    const feedback = await prisma.outfitFeedback.create({
      data: {
        userId: user.id,
        outfitId,
        liked,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: error.message || "Failed to record feedback" }, { status: 500 });
  }
}
