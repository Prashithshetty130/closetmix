import { prisma } from "../src/lib/prisma";

async function main() {
  const items = await prisma.clothingItem.findMany();
  console.log(`Found ${items.length} items in DB:`);
  for (const item of items) {
    console.log({
      id: item.id,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      primaryColor: item.primaryColor,
      primaryColorHex: item.primaryColorHex,
      originalImageUrl: item.originalImageUrl,
      processedImageUrl: item.processedImageUrl,
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
