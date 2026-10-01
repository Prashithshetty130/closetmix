import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeWardrobeGaps, buildTravelCapsule } from "@/lib/stylist/gap-analysis";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const days = parseInt(searchParams.get("days") || "5", 10);
    const maxPieces = parseInt(searchParams.get("pieces") || "8", 10);

    const rawItems = await prisma.clothingItem.findMany({
      where: { userId: user.id },
      orderBy: { wearCount: "desc" },
    });

    const stylistItems = rawItems.map((item) => ({
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

    // If travel capsule mode requested
    if (mode === "capsule") {
      const capsule = buildTravelCapsule(stylistItems, days, maxPieces);
      return NextResponse.json({ success: true, capsule });
    }

    // Standard Insights Mode
    const gaps = analyzeWardrobeGaps(stylistItems);

    // Compute distribution metrics
    const categoryDistribution: Record<string, number> = {};
    const formalityDistribution: Record<string, number> = {};
    let totalWears = 0;

    rawItems.forEach((item) => {
      categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
      formalityDistribution[item.formality] = (formalityDistribution[item.formality] || 0) + 1;
      totalWears += item.wearCount;
    });

    const mostWorn = rawItems.slice(0, 3);
    const unworn = rawItems.filter((i) => i.wearCount === 0 || !i.lastWornAt);

    return NextResponse.json({
      success: true,
      totalGarments: rawItems.length,
      totalWears,
      categoryDistribution,
      formalityDistribution,
      gaps,
      mostWorn,
      unwornCount: unworn.length,
      unwornItems: unworn.slice(0, 6),
    });
  } catch (error: any) {
    console.error("Insights API error:", error);
    return NextResponse.json({ error: error.message || "Failed to load insights" }, { status: 500 });
  }
}
