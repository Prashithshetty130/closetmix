import { NextResponse } from "next/server";
import { getCurrentUser, upgradeGuestUser } from "@/lib/auth";
import { z } from "zod";

const upgradeSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.isGuest) {
      return NextResponse.json(
        { error: "Only active guest sessions can be upgraded" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = upgradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const user = await upgradeGuestUser(currentUser.id, email, password, name);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upgrade guest account" },
      { status: 400 }
    );
  }
}
