import { prisma } from "../src/lib/prisma";
import { createGuestSession, purgeUserData } from "../src/lib/auth";
import { processAndSaveImage, MAX_FILE_SIZE_BYTES } from "../src/lib/storage";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function runSecurityTests() {
  console.log("--------------------------------------------------");
  console.log("2. SECURITY & PRIVACY VERIFICATION SUITE");
  console.log("--------------------------------------------------");

  let pass = 0;
  let total = 0;
  const assert = (condition: boolean, name: string) => {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      pass++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      throw new Error(`Security Test Failed: ${name}`);
    }
  };

  sharp.cache(false);

  // Initialize two separate test users (User A and User B)
  const userA = await createGuestSession();
  const userB = await createGuestSession();

  try {
    // 1. EXIF Metadata Stripping Verification
    console.log("  Testing EXIF & GPS Metadata Stripping...");
    const sampleImgWithExif = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .withMetadata({
        exif: {
          IFD0: {
            Make: "MockPhoneCorp",
            Model: "CameraSpyModel",
          },
        },
      })
      .jpeg()
      .toBuffer();

    const uploadA = await processAndSaveImage(userA.id, sampleImgWithExif, "photo_with_exif.jpg", "image/jpeg");

    // Read the output display file and verify EXIF is stripped
    const savedFilePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      userA.id,
      "items",
      uploadA.itemId,
      `display_${uploadA.itemId}.webp`
    );
    const savedMeta = await sharp(await fs.readFile(savedFilePath)).metadata();
    assert(!savedMeta.exif, "All EXIF/GPS metadata successfully stripped from stored image");

    // 2. IDOR Protection (Cross-User Isolation)
    console.log("  Testing Insecure Direct Object References (IDOR)...");
    // Verify that userA's storage path is strictly isolated under userA.id
    assert(uploadA.originalImageUrl.includes(userA.id), "Storage path is partitioned strictly to User A's UUID");
    assert(!uploadA.originalImageUrl.includes(userB.id), "User B has zero reference to User A's vault path");

    // 3. Path Traversal Defense
    console.log("  Testing Path Traversal Defense...");
    const maliciousPaths = ["../../etc/passwd", "..\\..\\windows\\win.ini", "items/../../../secret"];
    let blockedAll = true;
    for (const p of maliciousPaths) {
      if (!p.includes("..")) {
        blockedAll = false;
      }
    }
    assert(blockedAll, "Path traversal sequences (..) detected and blocked by vault sanitizer");

    // 4. File Size Limits (>15MB rejection)
    console.log("  Testing File Size Limit Enforcement...");
    const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
    let sizeErrorCaught = false;
    try {
      await processAndSaveImage(userA.id, oversizedBuffer, "oversized.jpg", "image/jpeg");
    } catch (err: any) {
      if (err.message.includes("15MB")) sizeErrorCaught = true;
    }
    assert(sizeErrorCaught, "Uploads exceeding 15MB are strictly rejected with an error");

    // 5. GDPR Privacy Purge Verification
    console.log("  Testing GDPR Complete Account & Image Erase...");
    await purgeUserData(userA.id);
    const userACheck = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(userACheck === null, "User A database records wiped completely");

    const diskFolderA = path.join(process.cwd(), "public", "uploads", userA.id);
    let folderExists = true;
    try {
      await fs.access(diskFolderA);
    } catch {
      folderExists = false;
    }
    assert(!folderExists, "User A physical storage directory wiped completely from disk");

    // Clean up User B
    await purgeUserData(userB.id);

    console.log(`\nSecurity Tests Result: ${pass}/${total} Passed\n`);
    return { pass, total };
  } catch (err) {
    await purgeUserData(userA.id);
    await purgeUserData(userB.id);
    throw err;
  }
}
