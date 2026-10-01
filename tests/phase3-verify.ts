import { prisma } from "../src/lib/prisma";
import { createGuestSession, purgeUserData } from "../src/lib/auth";
import { deleteItemFiles } from "../src/lib/storage";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

async function runPhase3Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING PHASE 3 WARDROBE UI & FILTER TEST SUITE");
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

  sharp.cache(false);

  try {
    // TEST 1: Create Guest User Session
    console.log("--- 1. Initializing User Session for Wardrobe Testing ---");
    const testUser = await createGuestSession();
    assert(!!testUser.id, "Session user created successfully");

    // TEST 2: Seed 4 Distinct Test Garments
    console.log("\n--- 2. Seeding Multi-Category Test Garments ---");
    const itemIds = ["test_top_1", "test_bottom_1", "test_shoes_1", "test_jacket_1"];
    const seeded = [];

    const mockGarments = [
      {
        id: itemIds[0],
        userId: testUser.id,
        name: "Linen Striped Camp Shirt",
        originalImageUrl: `/uploads/${testUser.id}/items/${itemIds[0]}/display.webp`,
        processedImageUrl: `/uploads/${testUser.id}/items/${itemIds[0]}/cutout.png`,
        thumbnailUrl: `/uploads/${testUser.id}/items/${itemIds[0]}/thumb.webp`,
        category: "TOP",
        subcategory: "Short-Sleeve Shirt",
        primaryColor: "Ecru / White",
        primaryColorHex: "#fdfbf7",
        pattern: "Striped",
        material: "Linen",
        fit: "Relaxed",
        season: "Summer",
        formality: "Casual",
        wearCount: 5,
        lastWornAt: new Date(Date.now() - 5 * 86400000), // worn 5 days ago
      },
      {
        id: itemIds[1],
        userId: testUser.id,
        name: "Pleated Charcoal Wool Trousers",
        originalImageUrl: `/uploads/${testUser.id}/items/${itemIds[1]}/display.webp`,
        processedImageUrl: `/uploads/${testUser.id}/items/${itemIds[1]}/cutout.png`,
        thumbnailUrl: `/uploads/${testUser.id}/items/${itemIds[1]}/thumb.webp`,
        category: "BOTTOM",
        subcategory: "Tailored Trousers",
        primaryColor: "Charcoal Grey",
        primaryColorHex: "#374151",
        pattern: "Solid",
        material: "Wool",
        fit: "Relaxed",
        season: "All-Season",
        formality: "Smart Casual",
        wearCount: 0,
        lastWornAt: new Date(Date.now() - 40 * 86400000), // unworn >30 days!
      },
      {
        id: itemIds[2],
        userId: testUser.id,
        name: "Derby Shoes in Black Calfskin",
        originalImageUrl: `/uploads/${testUser.id}/items/${itemIds[2]}/display.webp`,
        processedImageUrl: `/uploads/${testUser.id}/items/${itemIds[2]}/cutout.png`,
        thumbnailUrl: `/uploads/${testUser.id}/items/${itemIds[2]}/thumb.webp`,
        category: "SHOES",
        subcategory: "Derby Shoes",
        primaryColor: "Black",
        primaryColorHex: "#000000",
        pattern: "Solid",
        material: "Leather",
        fit: "Tailored",
        season: "All-Season",
        formality: "Formal",
        wearCount: 2,
        isFavorite: true,
        lastWornAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        id: itemIds[3],
        userId: testUser.id,
        name: "Vintage Suede Bomber Jacket",
        originalImageUrl: `/uploads/${testUser.id}/items/${itemIds[3]}/display.webp`,
        processedImageUrl: `/uploads/${testUser.id}/items/${itemIds[3]}/cutout.png`,
        thumbnailUrl: `/uploads/${testUser.id}/items/${itemIds[3]}/thumb.webp`,
        category: "OUTERWEAR",
        subcategory: "Bomber Jacket",
        primaryColor: "Caramel Brown",
        primaryColorHex: "#8B5A2B",
        pattern: "Solid",
        material: "Leather",
        fit: "Regular",
        season: "Fall/Winter",
        formality: "Casual",
        wearCount: 1,
        lastWornAt: new Date(Date.now() - 45 * 86400000), // unworn >30 days!
      },
    ];

    for (const g of mockGarments) {
      const created = await prisma.clothingItem.create({ data: g });
      seeded.push(created);
    }
    assert(seeded.length === 4, "4 distinct test garments created in database");

    // TEST 3: Category Filtering
    console.log("\n--- 3. Testing Category Filter ---");
    const tops = await prisma.clothingItem.findMany({
      where: { userId: testUser.id, category: "TOP" },
    });
    assert(tops.length === 1 && tops[0].name.includes("Linen"), "Category filter TOP returns Linen Shirt");

    const bottoms = await prisma.clothingItem.findMany({
      where: { userId: testUser.id, category: "BOTTOM" },
    });
    assert(bottoms.length === 1 && bottoms[0].name.includes("Trousers"), "Category filter BOTTOM returns Trousers");

    // TEST 4: Search Query Matching
    console.log("\n--- 4. Testing Multi-Field Search ---");
    const searchLinen = await prisma.clothingItem.findMany({
      where: {
        userId: testUser.id,
        OR: [
          { name: { contains: "linen" } },
          { material: { contains: "linen" } },
        ],
      },
    });
    assert(searchLinen.length === 1, "Search for 'linen' matches Linen Shirt");

    const searchCharcoal = await prisma.clothingItem.findMany({
      where: {
        userId: testUser.id,
        OR: [
          { name: { contains: "charcoal" } },
          { primaryColor: { contains: "charcoal" } },
        ],
      },
    });
    assert(searchCharcoal.length === 1, "Search for 'charcoal' matches Charcoal Trousers");

    // TEST 5: Unworn >30 Days Filter
    console.log("\n--- 5. Testing 'Unworn >30 Days' Filter ---");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const unwornItems = await prisma.clothingItem.findMany({
      where: {
        userId: testUser.id,
        OR: [
          { lastWornAt: null },
          { lastWornAt: { lt: thirtyDaysAgo } },
        ],
      },
    });
    assert(unwornItems.length === 2, "Unworn filter correctly flags 2 items unworn for >30 days");

    // TEST 6: Favorite Status Toggle
    console.log("\n--- 6. Testing Favorite Status Toggle ---");
    const itemToFav = mockGarments[0].id;
    const toggled = await prisma.clothingItem.update({
      where: { id: itemToFav },
      data: { isFavorite: true },
    });
    assert(toggled.isFavorite === true, "Item favorite toggled to true");

    const favList = await prisma.clothingItem.findMany({
      where: { userId: testUser.id, isFavorite: true },
    });
    assert(favList.length === 2, "Favorites filter returns 2 favorited items");

    // TEST 7: Log Wear (+1)
    console.log("\n--- 7. Testing Wear Logging (+1 Wear Count) ---");
    const initialWear = mockGarments[0].wearCount;
    const nowTimestamp = new Date();
    const loggedWear = await prisma.clothingItem.update({
      where: { id: itemToFav },
      data: {
        wearCount: initialWear + 1,
        lastWornAt: nowTimestamp,
      },
    });
    assert(loggedWear.wearCount === initialWear + 1, "Wear count incremented by 1");
    assert(loggedWear.lastWornAt !== null, "Last worn timestamp refreshed");

    // TEST 8: Single Item Deletion & Cascade Clean
    console.log("\n--- 8. Testing Single Garment Deletion ---");
    await prisma.clothingItem.delete({ where: { id: itemIds[0] } });
    const checkDeleted = await prisma.clothingItem.findUnique({ where: { id: itemIds[0] } });
    assert(checkDeleted === null, "Single garment deleted cleanly from database");

    const remainingCount = await prisma.clothingItem.count({ where: { userId: testUser.id } });
    assert(remainingCount === 3, "Remaining 3 garments intact in digital wardrobe");

    // CLEANUP
    console.log("\n--- 9. Cleanup Test Data ---");
    await purgeUserData(testUser.id);
    const checkUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(checkUser === null, "Test user and all wardrobe records completely purged");

    console.log("\n==================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 3 TESTS PASSED!`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 3 TEST SUITE ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  }
}

runPhase3Tests().then(() => process.exit(0));
