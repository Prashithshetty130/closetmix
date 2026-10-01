import { prisma } from "../src/lib/prisma";
import { createGuestSession, purgeUserData } from "../src/lib/auth";
import {
  validateWardrobeSufficiency,
  evaluateColorHarmony,
  evaluatePatternMixing,
  evaluateFormalityHarmony,
  StylistItem,
} from "../src/lib/stylist/rules";
import { generateOutfitOptions } from "../src/lib/stylist/generator";
import { getCityWeather } from "../src/lib/weather";

async function runPhase4Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING PHASE 4 OUTFIT ENGINE TEST SUITE");
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
    // TEST 1: Cold-Start / Insufficient Wardrobe Validator
    console.log("--- 1. Testing Wardrobe Sufficiency & Cold Start Detection ---");
    const tinyWardrobe: StylistItem[] = [
      {
        id: "t1",
        name: "White Tee",
        category: "TOP",
        subcategory: "T-Shirt",
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
    ];

    const checkInsufficient = validateWardrobeSufficiency(tinyWardrobe);
    assert(checkInsufficient.isSufficient === false, "Tiny wardrobe flagged as insufficient");
    assert(checkInsufficient.missingSlots.includes("Bottoms"), "Correctly identifies missing Bottoms");
    assert(checkInsufficient.missingSlots.includes("Shoes"), "Correctly identifies missing Shoes");

    // TEST 2: Fashion Theory Rules - Pattern Mixing
    console.log("\n--- 2. Testing Fashion Theory Rules - Pattern Mixing ---");
    const floralTop: StylistItem = {
      ...tinyWardrobe[0],
      id: "f1",
      name: "Floral Silk Blouse",
      pattern: "Floral",
    };
    const plaidPants: StylistItem = {
      ...tinyWardrobe[0],
      id: "p1",
      category: "BOTTOM",
      name: "Tartan Plaid Trousers",
      pattern: "Plaid",
    };
    const solidPants: StylistItem = {
      ...tinyWardrobe[0],
      id: "s1",
      category: "BOTTOM",
      name: "Solid Navy Chinos",
      pattern: "Solid",
    };

    const clashTest = evaluatePatternMixing([floralTop, plaidPants]);
    assert(clashTest.passes === false, "Detected and prevented pattern clash (Floral + Plaid)");

    const harmonyTest = evaluatePatternMixing([floralTop, solidPants]);
    assert(harmonyTest.passes === true, "Allowed single bold pattern paired with solid neutral");

    // TEST 3: Fashion Theory Rules - Formality Matrix
    console.log("\n--- 3. Testing Fashion Theory Rules - Formality Matrix ---");
    const gymShorts: StylistItem = {
      ...tinyWardrobe[0],
      id: "g1",
      category: "BOTTOM",
      name: "Running Shorts",
      formality: "Athletic",
    };
    const formalBlazer: StylistItem = {
      ...tinyWardrobe[0],
      id: "b1",
      category: "OUTERWEAR",
      name: "Tuxedo Blazer",
      formality: "Formal",
    };

    const dissonance = evaluateFormalityHarmony([gymShorts, formalBlazer]);
    assert(dissonance.score <= 60, "Severe formality clash penalized (<60 score)");

    // TEST 4: Fashion Theory Rules - Color Harmony
    console.log("\n--- 4. Testing Color Theory Harmony Scoring ---");
    const neutralCombo: StylistItem[] = [
      { ...tinyWardrobe[0], primaryColor: "Ivory", primaryColorHex: "#fffff0" },
      { ...solidPants, primaryColor: "Navy Blue", primaryColorHex: "#000080" },
    ];
    const colorResult = evaluateColorHarmony(neutralCombo);
    assert(colorResult.score >= 90, "Tonal Neutral combination receives high score (>=90)");
    assert(!!colorResult.harmonyType, "Color harmony type classified");

    // TEST 5: Real-Time Weather Integration (Open-Meteo)
    console.log("\n--- 5. Testing Real-Time Weather Client ---");
    const weather = await getCityWeather("Tokyo");
    assert(typeof weather.temperatureC === "number", "Fetched numeric temperature");
    assert(typeof weather.isRaining === "boolean", "Fetched precipitation boolean");
    assert(weather.city.includes("Tokyo"), "Resolved city name correctly");
    console.log(`   Weather in ${weather.city}: ${weather.temperatureC}°C, ${weather.condition}`);

    // TEST 6: Multi-Piece Outfit Generation & Constraint Enforcement
    console.log("\n--- 6. Testing Outfit Generation Engine ---");
    const fullWardrobe: StylistItem[] = [
      {
        id: "w_top_white",
        name: "Linen Camp Shirt",
        category: "TOP",
        subcategory: "Shirt",
        primaryColor: "White",
        primaryColorHex: "#ffffff",
        pattern: "Solid",
        material: "Linen",
        fit: "Relaxed",
        season: "Summer",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "w_top_black",
        name: "Black Turtleneck",
        category: "TOP",
        subcategory: "Knit",
        primaryColor: "Black",
        primaryColorHex: "#000000",
        pattern: "Solid",
        material: "Wool",
        fit: "Slim",
        season: "Winter",
        formality: "Smart Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "w_bot_chinos",
        name: "Olive Relaxed Chinos",
        category: "BOTTOM",
        subcategory: "Chinos",
        primaryColor: "Olive Green",
        primaryColorHex: "#556b2f",
        pattern: "Solid",
        material: "Cotton",
        fit: "Relaxed",
        season: "All-Season",
        formality: "Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "w_shoe_boots",
        name: "Chelsea Boots",
        category: "SHOES",
        subcategory: "Boots",
        primaryColor: "Cognac Brown",
        primaryColorHex: "#8b4513",
        pattern: "Solid",
        material: "Leather",
        fit: "Tailored",
        season: "All-Season",
        formality: "Smart Casual",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
      },
      {
        id: "w_shoe_sneakers",
        name: "White Minimalist Sneakers",
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
    ];

    // Case A: Generation with Color Exclusion "black"
    const genExclusion = await generateOutfitOptions({
      wardrobe: fullWardrobe,
      occasion: "Casual",
      colorExclusions: ["black"],
      weather,
    });

    assert(genExclusion.success === true, "Outfits generated successfully");
    assert(genExclusion.outfits!.length > 0, "Returned at least 1 valid outfit");

    const containsBlack = genExclusion.outfits!.some((outfit) =>
      outfit.items.some((slot) => slot.item.primaryColor.toLowerCase().includes("black"))
    );
    assert(!containsBlack, "Color exclusion respected: zero black items in generated outfits");

    // Case B: Generation with "Build Around Item" (Anchor item)
    const genBuildAround = await generateOutfitOptions({
      wardrobe: fullWardrobe,
      occasion: "Smart Casual",
      buildAroundItemId: "w_shoe_boots",
      weather,
    });

    const allHaveBoots = genBuildAround.outfits!.every((outfit) =>
      outfit.items.some((slot) => slot.item.id === "w_shoe_boots")
    );
    assert(allHaveBoots, "Build around item respected: all outfits anchor the Chelsea Boots");

    // Case C: Lock Item & Regeneration
    const firstOutfit = genBuildAround.outfits![0];
    const lockedId = "w_shoe_boots";
    const genRegen = await generateOutfitOptions({
      wardrobe: fullWardrobe,
      occasion: "Smart Casual",
      lockedItemIds: [lockedId],
      weather,
    });

    const regenHasLocked = genRegen.outfits!.every((outfit) =>
      outfit.items.some((slot) => slot.item.id === lockedId)
    );
    assert(regenHasLocked, "Locked item pinned across regeneration");

    // TEST 7: Outfit Database Persistence & Wear Logging
    console.log("\n--- 7. Testing Outfit Persistence & Wear Logging ---");
    const testUser = await createGuestSession();

    // Create clothing items in DB
    const dbTop = await prisma.clothingItem.create({
      data: {
        userId: testUser.id,
        name: "Test Oxford Shirt",
        originalImageUrl: "/mock.webp",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
        category: "TOP",
        subcategory: "Shirt",
        primaryColor: "White",
        primaryColorHex: "#ffffff",
        pattern: "Solid",
        material: "Cotton",
        fit: "Regular",
        season: "All-Season",
        formality: "Casual",
        wearCount: 0,
      },
    });

    const dbBottom = await prisma.clothingItem.create({
      data: {
        userId: testUser.id,
        name: "Test Denim Jeans",
        originalImageUrl: "/mock.webp",
        processedImageUrl: "/mock.png",
        thumbnailUrl: "/mock.webp",
        category: "BOTTOM",
        subcategory: "Jeans",
        primaryColor: "Blue",
        primaryColorHex: "#0000ff",
        pattern: "Solid",
        material: "Denim",
        fit: "Regular",
        season: "All-Season",
        formality: "Casual",
        wearCount: 0,
      },
    });

    // Save Outfit
    const savedOutfit = await prisma.outfit.create({
      data: {
        userId: testUser.id,
        name: "The Weekend Denim Edit",
        occasion: "Casual",
        weatherSuitability: "Mild 18°C",
        confidenceScore: 94,
        stylingExplanation: "Timeless white and blue contrast.",
        items: {
          create: [
            { clothingItemId: dbTop.id, slot: "TOP", isLocked: false },
            { clothingItemId: dbBottom.id, slot: "BOTTOM", isLocked: false },
          ],
        },
      },
      include: { items: true },
    });

    assert(savedOutfit.items.length === 2, "Outfit persisted with 2 constituent items");

    // Log Wear on Outfit (+1)
    await prisma.outfit.update({
      where: { id: savedOutfit.id },
      data: { wearCount: { increment: 1 }, lastWornAt: new Date() },
    });
    await prisma.clothingItem.updateMany({
      where: { id: { in: [dbTop.id, dbBottom.id] } },
      data: { wearCount: { increment: 1 }, lastWornAt: new Date() },
    });

    const refreshedTop = await prisma.clothingItem.findUnique({ where: { id: dbTop.id } });
    assert(refreshedTop!.wearCount === 1, "Constituent garment wear count incremented to 1");

    // Clean up
    await purgeUserData(testUser.id);

    console.log("\n==================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 4 TESTS PASSED!`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 4 TEST SUITE ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  }
}

runPhase4Tests().then(() => process.exit(0));
