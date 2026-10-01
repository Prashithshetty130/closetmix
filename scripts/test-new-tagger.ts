import fs from 'fs';
import path from 'path';
import { analyzeGarmentImage } from '../src/lib/ai/tagger';

async function main() {
  const baseDir = 'public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items';
  const folders = fs.readdirSync(baseDir);

  for (const f of folders) {
    const itemDir = path.join(baseDir, f);
    const files = fs.readdirSync(itemDir);
    const displayFile = files.find(x => x.startsWith('display_'));
    if (!displayFile) continue;

    const buf = fs.readFileSync(path.join(itemDir, displayFile));
    const result = await analyzeGarmentImage(buf, displayFile);
    console.log(`\nItem ${f}:`);
    console.log(`  Name: ${result.name}`);
    console.log(`  Category: ${result.category} | Subcategory: ${result.subcategory}`);
    console.log(`  Color: ${result.primaryColor} (${result.primaryColorHex})`);
    console.log(`  Material: ${result.material} | Formality: ${result.formality}`);
  }
}

main().catch(console.error);
