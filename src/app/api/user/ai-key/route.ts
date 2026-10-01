import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const keySchema = z.object({
  apiKey: z.string().trim().optional(),
});

// GET: Check if OpenRouter or Gemini API key is configured
export async function GET() {
  try {
    const user = await getCurrentUser();
    let userKey: string | undefined;

    if (user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { preferences: true },
      });
      if (dbUser?.preferences) {
        try {
          const parsed = JSON.parse(dbUser.preferences);
          userKey = parsed.openrouterApiKey || parsed.geminiApiKey;
        } catch {}
      }
    }

    const envKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    const hasUserKey = !!(userKey && userKey.length > 5);
    const hasEnvKey = !!(envKey && envKey.trim().length > 5 && !envKey.includes("your-"));

    const activeKey = userKey || (hasEnvKey ? envKey : undefined);
    const keyPreview = activeKey ? `${activeKey.slice(0, 7)}...${activeKey.slice(-4)}` : undefined;
    const provider = activeKey?.startsWith("sk-or-") ? "OpenRouter" : "Gemini";

    return NextResponse.json({
      success: true,
      hasKey: !!activeKey,
      source: hasUserKey ? "user" : hasEnvKey ? "env" : "none",
      provider,
      keyPreview,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check AI key" }, { status: 500 });
  }
}

// POST: Save, validate, or clear user's OpenRouter or Gemini API key
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = keySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const apiKey = parsed.data.apiKey?.trim();

    // If clearing key
    if (!apiKey) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      let currentPrefs: Record<string, any> = {};
      if (dbUser?.preferences) {
        try {
          currentPrefs = JSON.parse(dbUser.preferences);
        } catch {}
      }
      delete currentPrefs.geminiApiKey;
      delete currentPrefs.openrouterApiKey;

      await prisma.user.update({
        where: { id: user.id },
        data: { preferences: JSON.stringify(currentPrefs) },
      });

      return NextResponse.json({
        success: true,
        message: "AI API key removed. Using built-in computer vision.",
        hasKey: false,
      });
    }

    // Validate key against OpenRouter or Gemini
    const isOpenRouter = apiKey.startsWith("sk-or-");

    if (isOpenRouter) {
      try {
        const testRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!testRes.ok) {
          const errText = await testRes.text();
          return NextResponse.json(
            { error: `OpenRouter rejected this key (Status ${testRes.status}): ${errText}` },
            { status: 400 }
          );
        }
      } catch (netErr: any) {
        return NextResponse.json(
          { error: "Could not reach OpenRouter API to validate key: " + netErr.message },
          { status: 400 }
        );
      }
    } else {
      // Validate key against Gemini API before saving
      try {
        const testRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "ping" }] }],
            }),
          }
        );

        if (!testRes.ok) {
          return NextResponse.json(
            { error: `Gemini API rejected this key (Status ${testRes.status}): Please check that your key is valid and has Gemini API enabled.` },
            { status: 400 }
          );
        }
      } catch (netErr: any) {
        return NextResponse.json(
          { error: "Could not reach Google Gemini API to validate key: " + netErr.message },
          { status: 400 }
        );
      }
    }

    // Save to user preferences
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    let currentPrefs: Record<string, any> = {};
    if (dbUser?.preferences) {
      try {
        currentPrefs = JSON.parse(dbUser.preferences);
      } catch {}
    }

    if (isOpenRouter) {
      currentPrefs.openrouterApiKey = apiKey;
    } else {
      currentPrefs.geminiApiKey = apiKey;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(currentPrefs) },
    });

    return NextResponse.json({
      success: true,
      message: `${isOpenRouter ? "OpenRouter" : "Gemini"} API key successfully connected and verified!`,
      hasKey: true,
      provider: isOpenRouter ? "OpenRouter" : "Gemini",
      keyPreview: `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`,
    });
  } catch (error: any) {
    console.error("Save AI key error:", error);
    return NextResponse.json({ error: error.message || "Failed to update AI key" }, { status: 500 });
  }
}
