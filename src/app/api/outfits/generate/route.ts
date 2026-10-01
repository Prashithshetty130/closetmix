import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOutfitOptions } from "@/lib/stylist/generator";
import { getCityWeather } from "@/lib/weather";
import { z } from "zod";

const generateSchema = z.object({
  occasion: z.string().default("Casual"),
  gender: z.enum(["male", "female"]).optional(),
  city: z.string().optional(),
  manualTempC: z.number().optional(),
  mood: z.string().default("Effortless"),
  colorExclusions: z.array(z.string()).default([]),
  buildAroundItemId: z.string().optional().nullable(),
  lockedItemIds: z.array(z.string()).default([]),
  currentOutfitItemIds: z.array(z.string()).optional(),
  seed: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { occasion, city, manualTempC, mood, colorExclusions, buildAroundItemId, lockedItemIds, currentOutfitItemIds, seed } = parsed.data;

    // Resolve gender preference: body parameter overrides user profile preference, default to "male"
    let effectiveGender: "male" | "female" = parsed.data.gender || "male";
    if (!parsed.data.gender && user.id) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { preferences: true },
        });
        if (dbUser?.preferences) {
          const p = JSON.parse(dbUser.preferences);
          if (p.gender === "female" || p.gender === "male") {
            effectiveGender = p.gender;
          }
        }
      } catch {}
    }

    // 1. Fetch user wardrobe items
    const rawItems = await prisma.clothingItem.findMany({
      where: { userId: user.id },
    });

    const wardrobe = rawItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      primaryColor: item.primaryColor,
      primaryColorHex: item.primaryColorHex,
      secondaryColor: item.secondaryColor,
      pattern: item.pattern,
      material: item.material,
      fit: item.fit,
      season: item.season,
      formality: item.formality,
      processedImageUrl: item.processedImageUrl,
      thumbnailUrl: item.thumbnailUrl,
    }));

    // 2. Fetch or mock weather
    let weather = null;
    if (city && city.trim() !== "") {
      weather = await getCityWeather(city);
    } else {
      weather = await getCityWeather("New York");
    }

    if (manualTempC !== undefined) {
      weather.temperatureC = manualTempC;
    }

    // 3. Generate outfit options with gender preference
    const result = await generateOutfitOptions({
      wardrobe,
      occasion,
      weather,
      mood,
      colorExclusions,
      buildAroundItemId,
      lockedItemIds,
      currentOutfitItemIds,
      seed,
      gender: effectiveGender,
    });

    return NextResponse.json({
      success: result.success,
      weather,
      outfits: result.outfits,
      error: result.error,
      coldStartSuggestion: result.coldStartSuggestion,
    });
  } catch (error: any) {
    console.error("Outfit generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate outfits" }, { status: 500 });
  }
}
