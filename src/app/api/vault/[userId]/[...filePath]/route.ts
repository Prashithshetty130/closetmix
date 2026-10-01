import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

interface RouteParams {
  params: Promise<{
    userId: string;
    filePath: string[];
  }>;
}

export async function GET(req: Request, context: RouteParams) {
  try {
    const { userId, filePath } = await context.params;
    const currentUser = await getCurrentUser();

    // IDOR Protection: Only the authorized user can access their private wardrobe vault
    if (!currentUser || currentUser.id !== userId) {
      return new NextResponse("Forbidden: Access to private wardrobe photos is restricted to the item owner.", {
        status: 403,
      });
    }

    // Path Traversal Security: Prevent directory traversal (../)
    const sanitizedSubPath = filePath.join(path.sep);
    if (sanitizedSubPath.includes("..")) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    const absolutePath = path.join(process.cwd(), "public", "uploads", userId, sanitizedSubPath);

    try {
      const fileBuffer = await fs.readFile(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();
      let contentType = "application/octet-stream";

      if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=86400, stale-while-revalidate=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return new NextResponse("Image not found", { status: 404 });
    }
  } catch (error) {
    console.error("Vault image fetch error:", error);
    return new NextResponse("Server error", { status: 500 });
  }
}
