import { prisma } from "../src/lib/prisma";
import { createGuestSession, purgeUserData } from "../src/lib/auth";
import { removeBackground } from "../src/lib/ai/background-removal";
import { analyzeGarmentImage, ClothingTagSchema } from "../src/lib/ai/tagger";
import { processAndSaveImage } from "../src/lib/storage";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

async function runPhase2Tests() {
  console.log("==================================================");
  console.log("🧪 STARTING PHASE 2 AUTOMATED PIPELINE TEST SUITE");
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
    // TEST 1: Background Removal Algorithm
    console.log("--- 1. Testing Background Removal & Transparent Cutout ---");
    // Create an artificial image with a light grey background and a dark navy square (simulating a navy garment)
    const testImageBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }, // light background
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 200,
              height: 200,
              channels: 4,
              background: { r: 25, g: 40, b: 70, alpha: 1 }, // dark navy garment
            },
          })
            .png()
            .toBuffer(),
          top: 100,
          left: 100,
        },
      ])
      .jpeg()
      .toBuffer();

    const cutoutBuffer = await removeBackground(testImageBuffer);
    const cutoutMeta = await sharp(cutoutBuffer).metadata();
    assert(cutoutMeta.format === "png", "Cutout is converted to PNG format");
    assert(cutoutMeta.channels === 4, "Cutout includes RGBA alpha channel for transparency");
    assert(cutoutMeta.hasAlpha === true, "Cutout confirms transparency support");

    // TEST 2: AI Garment Tagging & Zod Schema Validation
    console.log("\n--- 2. Testing AI Garment Tagging & Schema Compliance ---");
    const tagResult = await analyzeGarmentImage(testImageBuffer, "dark_navy_blazer.jpg");
    assert(!!tagResult.name, "Garment has descriptive name");
    assert(tagResult.category === "OUTERWEAR", "Category correctly identified as OUTERWEAR");
    assert(typeof tagResult.primaryColorHex === "string", "Primary color hex code present");
    assert(tagResult.primaryColorHex.startsWith("#"), "Color hex begins with #");
    assert(typeof tagResult.faceDetected === "boolean", "Face detection privacy flag present");

    // Strictly validate against Zod Schema
    const validated = ClothingTagSchema.safeParse(tagResult);
    assert(validated.success === true, "AI response strictly complies with Zod ClothingTagSchema");

    // TEST 3: User Session & Full Storage Ingestion
    console.log("\n--- 3. Testing Full Storage Ingestion with Cutouts ---");
    const guestUser = await createGuestSession();
    const processedUpload = await processAndSaveImage(
      guestUser.id,
      testImageBuffer,
      "navy_blazer.jpg",
      "image/jpeg"
    );

    assert(processedUpload.processedImageUrl.includes("cutout_"), "Processed image URL points to cutout PNG");
    assert(processedUpload.thumbnailUrl.includes("thumb_"), "Thumbnail URL points to WebP thumbnail");

    // Verify files on disk
    const diskItemDir = path.join(process.cwd(), "public", "uploads", guestUser.id, "items", processedUpload.itemId);
    const diskFiles = await fs.readdir(diskItemDir);
    assert(diskFiles.some((f) => f.startsWith("cutout_")), "Cutout file exists on storage disk");
    assert(diskFiles.some((f) => f.startsWith("display_")), "Display WebP file exists on storage disk");
    assert(diskFiles.some((f) => f.startsWith("thumb_")), "Thumbnail WebP file exists on storage disk");

    // TEST 4: Batch Persistence to Database
    console.log("\n--- 4. Testing Wardrobe Item Database Insertion ---");
    const createdItem = await prisma.clothingItem.create({
      data: {
        id: processedUpload.itemId,
        userId: guestUser.id,
        name: tagResult.name,
        originalImageUrl: processedUpload.originalImageUrl,
        processedImageUrl: processedUpload.processedImageUrl,
        thumbnailUrl: processedUpload.thumbnailUrl,
        category: tagResult.category,
        subcategory: tagResult.subcategory,
        primaryColor: tagResult.primaryColor,
        primaryColorHex: tagResult.primaryColorHex,
        pattern: tagResult.pattern,
        material: tagResult.material,
        fit: tagResult.fit,
        season: tagResult.season,
        formality: tagResult.formality,
        notes: tagResult.stylingNotes,
      },
    });

    assert(createdItem.id === processedUpload.itemId, "Clothing item persisted with matching ID");
    assert(createdItem.category === "OUTERWEAR", "Category matched in database record");

    // TEST 5: Querying & Tag Updates
    console.log("\n--- 5. Testing Tag Modification & Category Filtering ---");
    const filteredItems = await prisma.clothingItem.findMany({
      where: {
        userId: guestUser.id,
        category: "OUTERWEAR",
      },
    });
    assert(filteredItems.length === 1, "Filter by category returns correct item");

    // Update tags
    const updatedItem = await prisma.clothingItem.update({
      where: { id: createdItem.id },
      data: {
        isFavorite: true,
        primaryColor: "Deep Midnight Navy",
      },
    });
    assert(updatedItem.isFavorite === true, "Item tag updated to favorite");
    assert(updatedItem.primaryColor === "Deep Midnight Navy", "Primary color tag updated");

    // CLEANUP
    console.log("\n--- 6. Cleanup Test Data ---");
    await purgeUserData(guestUser.id);
    const remaining = await prisma.user.findUnique({ where: { id: guestUser.id } });
    assert(remaining === null, "Cleaned up test user session");

    console.log("\n==================================================");
    console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 2 TESTS PASSED!`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ PHASE 2 TEST SUITE ENCOUNTERED AN ERROR:", error);
    process.exit(1);
  }
}

runPhase2Tests().then(() => process.exit(0));
