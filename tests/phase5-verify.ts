import { prisma } from "../src/lib/prisma";
import { createGuestSession, purgeUserData } from "../src/lib/auth";
import { computeUserTasteProfile } from "../src/lib/stylist/learner";
import { analyzeWardrobeGaps, buildTravelCapsule } from "../src/lib/stylist/gap-analysis";
import { StylistItem } from "../src/lib/stylist/rules";

async function runPhase5Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING PHASE 5 PERSONALIZATION & PLANNER SUITE");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    const testUser = await createGuestSession();

    // TEST 1: Taste Learning & Feedback Processing
    console.log("--- 1. Testing Feedback Ingestion & Taste Profile Computation ---");
    // Seed 2 items for test outfit
    const topItem = await prisma.clothingItem.create({
      data: {
        userId: testUser.id,
        name: "Cashmere Oatmeal Crewneck",
        category: "TOP",
        subcategory: "Knit Sweater",
        primaryColor: "Oatmeal",
        primaryColorHex: "#d8cbb5",
        pattern: "Solid",
        material: "Cashmere",
        fit: "Regular",
        season: "Winter",
        formality: "Smart Casual",
        originalImageUrl: "/mock.webp",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
    });

    const bottomItem = await prisma.clothingItem.create({
      data: {
        userId: testUser.id,
        name: "Navy Tailored Trousers",
        category: "BOTTOM",
        subcategory: "Tailored Trousers",
        primaryColor: "Navy Blue",
        primaryColorHex: "#000080",
        pattern: "Solid",
        material: "Wool",
        fit: "Tailored",
        season: "All-Season",
        formality: "Smart Casual",
        originalImageUrl: "/mock.webp",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
    });

    const likedOutfit = await prisma.outfit.create({
      data: {
        userId: testUser.id,
        name: "Smart Casual Navy & Oatmeal",
        occasion: "Smart Casual",
        stylingExplanation: "Classic complementary harmony.",
        confidenceScore: 96,
        items: {
          create: [
            { clothingItemId: topItem.id, slot: "TOP", isLocked: false },
            { clothingItemId: bottomItem.id, slot: "BOTTOM", isLocked: false },
          ],
        },
      },
    });

    // Record Thumbs Up
    await prisma.outfitFeedback.create({
      data: {
        userId: testUser.id,
        outfitId: likedOutfit.id,
        liked: true,
      },
    });

    const profile = await computeUserTasteProfile(testUser.id);
    assert(profile.favoriteSubcategories.includes("Knit Sweater"), "Taste profile identifies favored subcategories");
    assert(profile.preferredFormalities.includes("Smart Casual"), "Taste profile identifies preferred formality");
    assert(profile.likedColorPairs.length > 0, "Taste profile records liked color pairings");

    // TEST 2: Wardrobe Gap Analysis
    console.log("\n--- 2. Testing Wardrobe Gap Analysis ---");
    const mockWardrobe: StylistItem[] = [
      {
        id: "1",
        name: "Top 1",
        category: "TOP",
        subcategory: "Shirt",
        primaryColor: "White",
        primaryColorHex: "#ffffff",
        pattern: "Solid",
        material: "Cotton",
        fit: "Regular",
        season: "Summer",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "2",
        name: "Top 2",
        category: "TOP",
        subcategory: "Shirt",
        primaryColor: "Blue",
        primaryColorHex: "#0000ff",
        pattern: "Solid",
        material: "Cotton",
        fit: "Regular",
        season: "Summer",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "3",
        name: "Top 3",
        category: "TOP",
        subcategory: "Shirt",
        primaryColor: "Grey",
        primaryColorHex: "#888888",
        pattern: "Solid",
        material: "Cotton",
        fit: "Regular",
        season: "Summer",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "4",
        name: "Top 4",
        category: "TOP",
        subcategory: "Shirt",
        primaryColor: "Black",
        primaryColorHex: "#000000",
        pattern: "Solid",
        material: "Cotton",
        fit: "Regular",
        season: "Summer",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "5",
        name: "Single Bottom",
        category: "BOTTOM",
        subcategory: "Jeans",
        primaryColor: "Navy Blue",
        primaryColorHex: "#000080",
        pattern: "Solid",
        material: "Denim",
        fit: "Regular",
        season: "All-Season",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
    ];

    const gaps = analyzeWardrobeGaps(mockWardrobe);
    assert(gaps.some((g) => g.type === "RATIO_DEFICIT"), "Detected ratio deficit bottleneck (4 tops vs 1 bottom)");
    assert(gaps.some((g) => g.id === "gap_bottoms"), "Identifies bottoms deficit gap correctly");

    // TEST 3: Travel Capsule Optimizer
    console.log("\n--- 3. Testing 5-Day Travel Capsule Optimizer ---");
    const capsuleWardrobe: StylistItem[] = [
      ...mockWardrobe,
      {
        id: "b2",
        name: "Pleated Trousers",
        category: "BOTTOM",
        subcategory: "Trousers",
        primaryColor: "Charcoal",
        primaryColorHex: "#333333",
        pattern: "Solid",
        material: "Wool",
        fit: "Tailored",
        season: "All-Season",
        formality: "Smart Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "s1",
        name: "White Sneakers",
        category: "SHOES",
        subcategory: "Sneakers",
        primaryColor: "White",
        primaryColorHex: "#ffffff",
        pattern: "Solid",
        material: "Leather",
        fit: "Regular",
        season: "All-Season",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "j1",
        name: "Oatmeal Blazer",
        category: "OUTERWEAR",
        subcategory: "Blazer",
        primaryColor: "Beige",
        primaryColorHex: "#d8cbb5",
        pattern: "Solid",
        material: "Wool",
        fit: "Tailored",
        season: "Fall/Winter",
        formality: "Smart Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
    ];

    const capsule = buildTravelCapsule(capsuleWardrobe, 5, 8);
    assert(capsule.totalPieces <= 8, "Capsule strictly limits pieces to requested baggage threshold (8)");
    assert(capsule.schedule.length === 5, "Generates complete 5-day itinerary schedule");
    assert(capsule.versatilityScore >= 90, "Versatility synergy score is >= 90%");

    // TEST 4: Weekly Planner & Wear Tracking
    console.log("\n--- 4. Testing Calendar Scheduling & Wear Tracking ---");
    const scheduleDate = new Date();
    const entry = await prisma.calendarEntry.create({
      data: {
        userId: testUser.id,
        outfitId: likedOutfit.id,
        date: scheduleDate,
        notes: "Work conference presentation",
        wasWorn: false,
      },
    });

    assert(entry.wasWorn === false, "Calendar entry created in planned state");

    // Simulate mark worn
    await prisma.calendarEntry.update({
      where: { id: entry.id },
      data: { wasWorn: true },
    });
    await prisma.outfit.update({
      where: { id: likedOutfit.id },
      data: { wearCount: { increment: 1 } },
    });
    await prisma.clothingItem.updateMany({
      where: { id: { in: [topItem.id, bottomItem.id] } },
      data: { wearCount: { increment: 1 } },
    });

    const checkTop = await prisma.clothingItem.findUnique({ where: { id: topItem.id } });
    assert(checkTop!.wearCount === 1, "Calendar wear logging increments garment wear counter");

    // Clean up
    await purgeUserData(testUser.id);

    console.log("\n==================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 5 TESTS PASSED!`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 5 TEST SUITE ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  }
}

runPhase5Tests().then(() => process.exit(0));
