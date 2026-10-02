import sharp from "sharp";
import { removeBackground } from "../src/lib/ai/background-removal";

async function run() {
  console.log("=== TESTING STUDIO BACKGROUND REMOVAL & CUTOUT ENGINE ===");

  // 1. Create a simulated garment photo (white/light grey background with a blue sweater)
  const w = 500, h = 600;
  const bgR = 240, bgG = 242, bgB = 245;

  const rawBg = await sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: bgR, g: bgG, b: bgB }
    }
  }).raw().toBuffer();

  const buffer = Buffer.from(rawBg);

  // Draw garment in the center (from x: 120 to 380, y: 100 to 500)
  for (let y = 100; y < 500; y++) {
    for (let x = 120; x < 380; x++) {
      const idx = (y * w + x) * 3;
      buffer[idx] = 40;     // Dark Navy R
      buffer[idx + 1] = 60; // G
      buffer[idx + 2] = 120;// B
    }
  }

  // Add a white patch INSIDE the garment (e.g. white graphic / stripes from x: 200 to 300, y: 200 to 250)
  for (let y = 200; y < 250; y++) {
    for (let x = 200; x < 300; x++) {
      const idx = (y * w + x) * 3;
      buffer[idx] = 255;
      buffer[idx + 1] = 255;
      buffer[idx + 2] = 255;
    }
  }

  const jpegInput = await sharp(buffer, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log(`Input image created: ${w}x${h} JPEG (${jpegInput.length} bytes)`);

  const t0 = Date.now();
  const cutoutPng = await removeBackground(jpegInput);
  const elapsed = Date.now() - t0;

  console.log(`Background removal completed in ${elapsed}ms! Output PNG size: ${cutoutPng.length} bytes`);

  const cutoutMeta = await sharp(cutoutPng).metadata();
  console.log(`Output metadata: ${cutoutMeta.width}x${cutoutMeta.height}, channels: ${cutoutMeta.channels}, format: ${cutoutMeta.format}`);

  if (cutoutMeta.channels !== 4) {
    throw new Error(`Expected 4 channels (RGBA), got ${cutoutMeta.channels}`);
  }

  // Check raw alpha channel of the output
  const { data: rawData, info } = await sharp(cutoutPng).raw().toBuffer({ resolveWithObject: true });
  let transparentPixels = 0;
  let solidPixels = 0;
  let preservedWhitePixels = 0;

  for (let i = 0; i < rawData.length; i += 4) {
    const a = rawData[i + 3];
    if (a === 0) {
      transparentPixels++;
    } else if (a > 200) {
      solidPixels++;
      // Check if white pixels inside garment were preserved
      if (rawData[i] > 240 && rawData[i + 1] > 240 && rawData[i + 2] > 240) {
        preservedWhitePixels++;
      }
    }
  }

  console.log(`Transparent backdrop pixels: ${transparentPixels} / ${info.width * info.height} (${((transparentPixels / (info.width * info.height)) * 100).toFixed(1)}%)`);
  console.log(`Solid garment pixels: ${solidPixels}`);
  console.log(`Inner white detail pixels preserved: ${preservedWhitePixels}`);

  if (transparentPixels === 0) {
    throw new Error("Cutout failed: 0 transparent pixels found!");
  }
  if (solidPixels === 0) {
    throw new Error("Cutout failed: 0 garment pixels preserved!");
  }
  if (preservedWhitePixels === 0) {
    throw new Error("Cutout failed: Inner white graphic/stripes were mistakenly erased!");
  }

  console.log("✓ CUTOUT ENGINE VALIDATION: PASSED WITH FLYING COLORS!\n");
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
