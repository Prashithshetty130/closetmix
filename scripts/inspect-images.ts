import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function main() {
  const baseDir = 'public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items';
  const folders = fs.readdirSync(baseDir);
  console.log(`Checking ${folders.length} items in ${baseDir}:`);

  for (const f of folders) {
    const itemDir = path.join(baseDir, f);
    const files = fs.readdirSync(itemDir);
    const displayFile = files.find(x => x.startsWith('display_'));
    if (!displayFile) continue;
    const fullPath = path.join(itemDir, displayFile);
    const meta = await sharp(fullPath).metadata();
    console.log(`Item ${f}: file=${displayFile}, width=${meta.width}, height=${meta.height}, ratio=${((meta.width||1)/(meta.height||1)).toFixed(2)}`);
  }
}

main().catch(console.error);
