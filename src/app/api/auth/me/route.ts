import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Auth /me error:", error);
    return NextResponse.json({ authenticated: false, user: null, error: "Failed to verify session" }, { status: 500 });
  }
}
