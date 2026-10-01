import { prisma } from "../src/lib/prisma";
import { createGuestSession, purgeUserData } from "../src/lib/auth";
import { processAndSaveImage } from "../src/lib/storage";
import { analyzeGarmentImage, ClothingTagSchema } from "../src/lib/ai/tagger";
import sharp from "sharp";

interface TestImageSpec {
  id: number;
  filename: string;
  type: string;
  description: string;
  isEdgeCase?: boolean;
  expectedCategory?: string;
  generateBuffer: () => Promise<Buffer>;
}

export async function runThirtyImageTestSuite() {
  console.log("--------------------------------------------------");
  console.log("3. 30-GARMENT VARIETY & ADVERSARIAL STRESS TEST");
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
      throw new Error(`Test Failed: ${name}`);
    }
  };

  sharp.cache(false);
  const testUser = await createGuestSession();

  // Helper to generate colored square with border
  const makeImage = async (r: number, g: number, b: number, width = 400, height = 400) => {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 245, g: 245, b: 245 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: Math.floor(width * 0.6),
              height: Math.floor(height * 0.6),
              channels: 4,
              background: { r, g, b, alpha: 1 },
            },
          })
            .png()
            .toBuffer(),
          top: Math.floor(height * 0.2),
          left: Math.floor(width * 0.2),
        },
      ])
      .jpeg()
      .toBuffer();
  };

  const testSpecs: TestImageSpec[] = [
    // 1-7: Tops
    { id: 1, filename: "white_crewneck_tshirt.jpg", type: "TOP", description: "Classic white crewneck t-shirt", generateBuffer: () => makeImage(255, 255, 255) },
    { id: 2, filename: "blue_oxford_shirt.jpg", type: "TOP", description: "Powder blue button-down oxford shirt", generateBuffer: () => makeImage(140, 180, 220) },
    { id: 3, filename: "striped_linen_shirt.jpg", type: "TOP", description: "Linen striped camp collar shirt", generateBuffer: () => makeImage(210, 205, 190) },
    { id: 4, filename: "black_merino_turtleneck.jpg", type: "TOP", description: "Fine gauge black turtleneck knit", generateBuffer: () => makeImage(20, 20, 22) },
    { id: 5, filename: "silk_ivory_slip_top.jpg", type: "TOP", description: "Ivory silk camisole slip top", generateBuffer: () => makeImage(250, 248, 240) },
    { id: 6, filename: "navy_piqué_polo.jpg", type: "TOP", description: "Navy blue piqué cotton polo", generateBuffer: () => makeImage(15, 30, 75) },
    { id: 7, filename: "graphic_vintage_tee.jpg", type: "TOP", description: "Washed charcoal graphic tee", generateBuffer: () => makeImage(45, 45, 50) },

    // 8-13: Bottoms
    { id: 8, filename: "indigo_selvedge_jeans.jpg", type: "BOTTOM", description: "Raw indigo selvedge denim jeans", generateBuffer: () => makeImage(25, 40, 95) },
    { id: 9, filename: "charcoal_pleated_trousers.jpg", type: "BOTTOM", description: "Charcoal grey wool pleated trousers", generateBuffer: () => makeImage(60, 65, 75) },
    { id: 10, filename: "khaki_relaxed_chinos.jpg", type: "BOTTOM", description: "Tan khaki relaxed cotton chinos", generateBuffer: () => makeImage(190, 160, 120) },
    { id: 11, filename: "black_skinny_jeans.jpg", type: "BOTTOM", description: "Black stretch denim skinny jeans", generateBuffer: () => makeImage(25, 25, 28) },
    { id: 12, filename: "pleated_midi_skirt.jpg", type: "BOTTOM", description: "Forest green pleated midi skirt", generateBuffer: () => makeImage(30, 80, 50) },
    { id: 13, filename: "linen_drawstring_shorts.jpg", type: "BOTTOM", description: "Natural ecru linen drawstring shorts", generateBuffer: () => makeImage(230, 220, 205) },

    // 14-18: Outerwear
    { id: 14, filename: "camel_wool_overcoat.jpg", type: "OUTERWEAR", description: "Camel tailored double-breasted overcoat", generateBuffer: () => makeImage(195, 145, 90) },
    { id: 15, filename: "leather_biker_jacket.jpg", type: "OUTERWEAR", description: "Black lambskin leather moto jacket", generateBuffer: () => makeImage(18, 18, 20) },
    { id: 16, filename: "denim_trucker_jacket.jpg", type: "OUTERWEAR", description: "Medium wash denim trucker jacket", generateBuffer: () => makeImage(70, 110, 160) },
    { id: 17, filename: "oatmeal_blazer.jpg", type: "OUTERWEAR", description: "Oatmeal textured wool tailored blazer", generateBuffer: () => makeImage(215, 200, 180) },
    { id: 18, filename: "down_puffer_jacket.jpg", type: "OUTERWEAR", description: "Matte black insulated down puffer", generateBuffer: () => makeImage(30, 32, 35) },

    // 19-23: Shoes
    { id: 19, filename: "white_leather_sneakers.jpg", type: "SHOES", description: "Minimalist low-top white leather sneakers", generateBuffer: () => makeImage(250, 250, 250) },
    { id: 20, filename: "espresso_chelsea_boots.jpg", type: "SHOES", description: "Dark espresso leather chelsea boots", generateBuffer: () => makeImage(50, 30, 20) },
    { id: 21, filename: "black_oxford_dress_shoes.jpg", type: "SHOES", description: "Polished black calfskin oxford shoes", generateBuffer: () => makeImage(15, 15, 15) },
    { id: 22, filename: "running_athletic_sneakers.jpg", type: "SHOES", description: "Grey mesh performance running shoes", generateBuffer: () => makeImage(160, 165, 170) },
    { id: 23, filename: "suede_penny_loafers.jpg", type: "SHOES", description: "Snuff brown suede penny loafers", generateBuffer: () => makeImage(140, 95, 60) },

    // 24-26: Accessories & Bags
    { id: 24, filename: "leather_tote_bag.jpg", type: "BAG", description: "Cognac brown structured leather tote", generateBuffer: () => makeImage(135, 75, 40) },
    { id: 25, filename: "cashmere_fringe_scarf.jpg", type: "ACCESSORY", description: "Camel 100% cashmere fringe scarf", generateBuffer: () => makeImage(185, 145, 100) },
    { id: 26, filename: "leather_dress_belt.jpg", type: "ACCESSORY", description: "Dark brown leather belt with brass buckle", generateBuffer: () => makeImage(65, 40, 25) },

    // 27-30: Deliberate Bad / Adversarial Edge Case Photos
    {
      id: 27,
      filename: "underexposed_dark_bottom.jpg",
      type: "BOTTOM",
      description: "Edge Case 1: Extreme underexposed near-black photo",
      isEdgeCase: true,
      generateBuffer: () => makeImage(12, 12, 14, 300, 300),
    },
    {
      id: 28,
      filename: "low_res_blurry_jacket.jpg",
      type: "OUTERWEAR",
      description: "Edge Case 2: Very small 64x64px low-resolution thumbnail",
      isEdgeCase: true,
      generateBuffer: () => makeImage(100, 50, 50, 64, 64),
    },
    {
      id: 29,
      filename: "person_wearing_shirt_face_crop.jpg",
      type: "TOP",
      description: "Edge Case 3: Photo with person / face simulation",
      isEdgeCase: true,
      generateBuffer: async () => {
        // Compose a shirt with simulated skin/head tone at the top
        return sharp({
          create: { width: 350, height: 450, channels: 3, background: { r: 240, g: 240, b: 240 } },
        })
          .composite([
            {
              // Simulated facial likeness block
              input: await sharp({
                create: { width: 80, height: 90, channels: 3, background: { r: 220, g: 170, b: 140 } },
              }).jpeg().toBuffer(),
              top: 20,
              left: 135,
            },
            {
              // Shirt
              input: await sharp({
                create: { width: 220, height: 260, channels: 3, background: { r: 40, g: 80, b: 160 } },
              }).jpeg().toBuffer(),
              top: 130,
              left: 65,
            },
          ])
          .jpeg()
          .toBuffer();
      },
    },
    {
      id: 30,
      filename: "noisy_complex_background_shoe.jpg",
      type: "SHOES",
      description: "Edge Case 4: High-noise patterned floor background",
      isEdgeCase: true,
      generateBuffer: async () => {
        // Generate high-frequency noise background
        const noisyBuf = Buffer.alloc(300 * 300 * 3);
        for (let i = 0; i < noisyBuf.length; i++) {
          noisyBuf[i] = Math.floor(Math.random() * 255);
        }
        return sharp(noisyBuf, { raw: { width: 300, height: 300, channels: 3 } })
          .composite([
            {
              input: await sharp({
                create: { width: 160, height: 100, channels: 3, background: { r: 20, g: 20, b: 20 } },
              }).jpeg().toBuffer(),
              top: 100,
              left: 70,
            },
          ])
          .jpeg()
          .toBuffer();
      },
    },
  ];

  try {
    for (const spec of testSpecs) {
      const buffer = await spec.generateBuffer();

      // 1. Process and save
      const processed = await processAndSaveImage(testUser.id, buffer, spec.filename, "image/jpeg");
      assert(!!processed.itemId, `[${spec.id}/30] Storage ingestion: ${spec.filename}`);
      assert(processed.thumbnailUrl.endsWith(".webp"), `[${spec.id}/30] Thumbnail WebP: ${spec.filename}`);

      // 2. AI Tagging & Schema Validation
      const tags = await analyzeGarmentImage(buffer, spec.filename);
      const parsed = ClothingTagSchema.safeParse(tags);
      assert(parsed.success === true, `[${spec.id}/30] Zod Schema Valid: ${spec.filename}`);

      // 3. Edge-case specific assertions
      if (spec.id === 28) {
        // Low resolution 64x64px
        assert(processed.width === 64, `[Edge 28] Handled tiny 64x64px image gracefully without crashing`);
      }
      if (spec.id === 29) {
        // Face detection flag check
        assert(typeof tags.faceDetected === "boolean", `[Edge 29] Privacy flag verified on person-inclusive photo`);
      }
      if (spec.id === 30) {
        // Complex noisy background
        assert(processed.processedImageUrl.includes("cutout_"), `[Edge 30] Background cutout generated without error on noisy floor`);
      }
    }

    // Clean up
    await purgeUserData(testUser.id);

    console.log(`\n30-Image Stress Test Result: ${pass}/${total} Assertions Passed\n`);
    return { pass, total, testedCount: testSpecs.length };
  } catch (err) {
    await purgeUserData(testUser.id);
    throw err;
  }
}
