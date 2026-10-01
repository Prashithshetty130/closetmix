import { NextResponse } from "next/server";
import { createGuestSession } from "@/lib/auth";

export async function POST() {
  try {
    const guestUser = await createGuestSession();
    return NextResponse.json({
      success: true,
      user: {
        id: guestUser.id,
        name: guestUser.name,
        isGuest: true,
        preferences: guestUser.preferences,
      },
    });
  } catch (error: any) {
    console.error("Guest session creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize guest session" },
      { status: 500 }
    );
  }
}
