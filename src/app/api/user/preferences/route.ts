import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const preferencesSchema = z.object({
  gender: z.enum(["male", "female"]).optional(),
  preferredColors: z.array(z.string()).optional(),
  excludedColors: z.array(z.string()).optional(),
  styles: z.array(z.string()).optional(),
  fitPreference: z.string().optional(),
});

// GET: Retrieve user styling & gender preferences
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({
        success: true,
        preferences: { gender: "male" },
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true },
    });

    let currentPrefs: Record<string, any> = { gender: "male" };
    if (dbUser?.preferences) {
      try {
        currentPrefs = { ...currentPrefs, ...JSON.parse(dbUser.preferences) };
      } catch {}
    }

    return NextResponse.json({
      success: true,
      preferences: currentPrefs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// POST: Save or update user styling & gender preferences
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true },
    });

    let currentPrefs: Record<string, any> = {};
    if (dbUser?.preferences) {
      try {
        currentPrefs = JSON.parse(dbUser.preferences);
      } catch {}
    }

    const updatedPrefs = {
      ...currentPrefs,
      ...parsed.data,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(updatedPrefs) },
    });

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save preferences" },
      { status: 500 }
    );
  }
}
