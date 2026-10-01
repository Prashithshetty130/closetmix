import { prisma } from "../src/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { removeBackground } from "../src/lib/ai/background-removal";
import { analyzeGarmentImage } from "../src/lib/ai/tagger";

async function main() {
  const items = await prisma.clothingItem.findMany();
  console.log(`Starting immediate reprocess for ${items.length} items...`);

  for (const item of items) {
    console.log(`\nReprocessing: ${item.id} (current: ${item.name}, cat: ${item.category})`);
    const cleanOriginalUrl = item.originalImageUrl.replace(/^\//, "");
    const originalDiskPath = path.join(process.cwd(), "public", cleanOriginalUrl);

    try {
      const imageBuffer = await fs.readFile(originalDiskPath);

      // Generate new clean cutout
      const newCutout = await removeBackground(imageBuffer);
      const cleanCutoutUrl = item.processedImageUrl.replace(/^\//, "");
      const cutoutDiskPath = path.join(process.cwd(), "public", cleanCutoutUrl);
      await fs.writeFile(cutoutDiskPath, newCutout);
      console.log(`  Saved new cutout (${newCutout.length} bytes) to ${cutoutDiskPath}`);

      // Re-tag item
      const tags = await analyzeGarmentImage(imageBuffer, item.name);
      console.log(`  New tags: name="${tags.name}", cat=${tags.category}, sub=${tags.subcategory}, color="${tags.primaryColor}" (${tags.primaryColorHex})`);

      const updated = await prisma.clothingItem.update({
        where: { id: item.id },
        data: {
          name: tags.name,
          category: tags.category,
          subcategory: tags.subcategory,
          primaryColor: tags.primaryColor,
          primaryColorHex: tags.primaryColorHex,
          secondaryColor: tags.secondaryColor || null,
          secondaryColorHex: tags.secondaryColorHex || null,
          pattern: tags.pattern,
          material: tags.material,
          fit: tags.fit,
          season: tags.season,
          formality: tags.formality,
          notes: tags.stylingNotes || item.notes,
        },
      });
      console.log(`  DB updated successfully!`);
    } catch (err) {
      console.error(`  Failed on ${item.id}:`, err);
    }
  }

  console.log("\nAll items successfully reprocessed!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
