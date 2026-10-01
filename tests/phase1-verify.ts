import { prisma } from "../src/lib/prisma";
import { registerUser, loginUser, createGuestSession, upgradeGuestUser, purgeUserData } from "../src/lib/auth";
import { processAndSaveImage } from "../src/lib/storage";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

async function runPhase1Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING PHASE 1 AUTOMATED VERIFICATION SUITE");
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
    // TEST 1: Database Connectivity
    console.log("--- 1. Testing Database & Prisma Connectivity ---");
    const userCount = await prisma.user.count();
    assert(typeof userCount === "number", "Prisma can connect and query database");

    // TEST 2: Guest Session Initialization
    console.log("\n--- 2. Testing Guest Session Creation ---");
    const guestUser = await createGuestSession();
    assert(guestUser.isGuest === true, "Guest user has isGuest = true");
    assert(!!guestUser.id, "Guest user has valid UUID");
    console.log(`   Guest User ID: ${guestUser.id}`);

    // TEST 3: Image Processing & Storage Pipeline
    console.log("\n--- 3. Testing Image Pipeline & Metadata Stripping ---");
    // Generate a dummy RGB JPEG with sample metadata in memory
    const sampleImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 50, g: 100, b: 150 },
      },
    })
      .jpeg()
      .toBuffer();

    const uploadResult = await processAndSaveImage(
      guestUser.id,
      sampleImageBuffer,
      "test_jacket.jpg",
      "image/jpeg"
    );

    assert(!!uploadResult.itemId, "Upload generates a valid itemId");
    assert(uploadResult.originalImageUrl.includes(guestUser.id), "Image path is isolated to user ID");
    assert(uploadResult.thumbnailUrl.endsWith(".webp"), "Thumbnail is converted to WebP format");

    // Verify files on disk
    const diskDir = path.join(process.cwd(), "public", "uploads", guestUser.id, "items", uploadResult.itemId);
    const files = await fs.readdir(diskDir);
    assert(files.length >= 2, `Both display image and thumbnail exist on disk (Found ${files.length} files)`);

    // Disable sharp in-memory file caching to prevent Windows EBUSY file locks
    sharp.cache(false);

    // Verify thumbnail dimensions
    const thumbPath = path.join(diskDir, `thumb_${uploadResult.itemId}.webp`);
    const thumbBuffer = await fs.readFile(thumbPath);
    const thumbMeta = await sharp(thumbBuffer).metadata();
    assert(thumbMeta.width === 360 && thumbMeta.height === 360, "Thumbnail is exactly 360x360");

    // TEST 4: Linking Item in Database
    console.log("\n--- 4. Testing Clothing Item DB Record ---");
    const clothingItem = await prisma.clothingItem.create({
      data: {
        userId: guestUser.id,
        name: "Test Wool Blazer",
        originalImageUrl: uploadResult.originalImageUrl,
        processedImageUrl: uploadResult.processedImageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        category: "OUTERWEAR",
        subcategory: "Tailored Blazer",
        primaryColor: "Navy Blue",
        primaryColorHex: "#1b2a4a",
        pattern: "Solid",
        material: "Wool",
        fit: "Tailored",
        season: "Fall/Winter",
        formality: "Business Casual",
      },
    });
    assert(clothingItem.category === "OUTERWEAR", "Clothing item record created with correct category");

    // TEST 5: Guest Upgrade to Permanent Account
    console.log("\n--- 5. Testing Guest to Permanent Account Upgrade ---");
    const testEmail = `test_curator_${Date.now()}@vestiq.internal`;
    const upgradedUser = await upgradeGuestUser(
      guestUser.id,
      testEmail,
      "SecurePass123!",
      "Elena Vance"
    );
    assert(upgradedUser.isGuest === false, "Upgraded user isGuest is false");
    assert(upgradedUser.email === testEmail, "Upgraded user has linked email");

    // Verify clothes are preserved
    const userItems = await prisma.clothingItem.findMany({ where: { userId: upgradedUser.id } });
    assert(userItems.length === 1, "Garments preserved after guest upgrade");

    // TEST 6: Authentication Login Verification
    console.log("\n--- 6. Testing Password Verification / Login ---");
    const loggedInUser = await loginUser(testEmail, "SecurePass123!");
    assert(loggedInUser.id === upgradedUser.id, "Login verifies password hash and returns correct user");

    let failedLoginCaught = false;
    try {
      await loginUser(testEmail, "WrongPassword!");
    } catch {
      failedLoginCaught = true;
    }
    assert(failedLoginCaught, "Invalid password properly rejected");

    // TEST 7: Privacy & Account Purge (GDPR)
    console.log("\n--- 7. Testing Privacy Purge (Complete Account & Storage Erase) ---");
    await purgeUserData(upgradedUser.id);

    // Verify DB record deleted
    const purgedUser = await prisma.user.findUnique({ where: { id: upgradedUser.id } });
    assert(purgedUser === null, "User completely deleted from database");

    // Verify items deleted
    const remainingItems = await prisma.clothingItem.findMany({ where: { userId: upgradedUser.id } });
    assert(remainingItems.length === 0, "All wardrobe items cascade deleted");

    // Verify storage directory deleted
    const userStorageDir = path.join(process.cwd(), "public", "uploads", upgradedUser.id);
    let dirExists = true;
    try {
      await fs.access(userStorageDir);
    } catch {
      dirExists = false;
    }
    assert(!dirExists, "User physical storage folder purged from disk");

    console.log("\n==================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ TEST SUITE ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  }
}

runPhase1Tests().then(() => process.exit(0));
