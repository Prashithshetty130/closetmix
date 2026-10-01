import { NextResponse } from "next/server";
import { getCurrentUser, purgeUserData } from "@/lib/auth";

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await purgeUserData(user.id);
    return NextResponse.json({
      success: true,
      message: "Account, digital wardrobe, and all personal image data purged successfully.",
    });
  } catch (error: any) {
    console.error("Purge user data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to purge user data" },
      { status: 500 }
    );
  }
}
