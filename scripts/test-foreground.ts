import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function testItem(f: string) {
  const baseDir = 'public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items';
  const itemDir = path.join(baseDir, f);
  const files = fs.readdirSync(itemDir);
  const displayFile = files.find(x => x.startsWith('display_'));
  if (!displayFile) return;

  const fullPath = path.join(itemDir, displayFile);
  const { data, info } = await sharp(fullPath).resize(200, 200, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Border pixels
  const borderColors: Array<[number, number, number]> = [];
  for (let x = 0; x < info.width; x++) {
    const idx1 = (0 * info.width + x) * 4;
    borderColors.push([data[idx1], data[idx1+1], data[idx1+2]]);
    const idx2 = ((info.height - 1) * info.width + x) * 4;
    borderColors.push([data[idx2], data[idx2+1], data[idx2+2]]);
  }
  for (let y = 0; y < info.height; y++) {
    const idx1 = (y * info.width + 0) * 4;
    borderColors.push([data[idx1], data[idx1+1], data[idx1+2]]);
    const idx2 = (y * info.width + (info.width - 1)) * 4;
    borderColors.push([data[idx2], data[idx2+1], data[idx2+2]]);
  }

  const avgBg = borderColors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]).map(v => Math.round(v / borderColors.length));

  // Find non-background pixels (distance > 30 from avgBg)
  let fgPixels: Array<[number, number, number]> = [];
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const dist = Math.sqrt((r - avgBg[0])**2 + (g - avgBg[1])**2 + (b - avgBg[2])**2);
      if (dist > 35) {
        fgPixels.push([r, g, b]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const fgBoxWidth = maxX - minX;
  const fgBoxHeight = maxY - minY;
  const fgRatio = fgBoxHeight > 0 ? (fgBoxWidth / fgBoxHeight) : 0;

  // Foreground average color
  let fgAvg = [0, 0, 0];
  if (fgPixels.length > 0) {
    fgAvg = fgPixels.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]).map(v => Math.round(v / fgPixels.length));
  }

  console.log(`\nItem: ${f}`);
  console.log(`  Border Avg RGB: [${avgBg.join(', ')}]`);
  console.log(`  Foreground Count: ${fgPixels.length} / ${info.width * info.height} (${Math.round(fgPixels.length / (info.width * info.height) * 100)}%)`);
  console.log(`  Foreground Bounding Box: [${minX}, ${minY}, ${maxX}, ${maxY}], w=${fgBoxWidth}, h=${fgBoxHeight}, ratio=${fgRatio.toFixed(2)}`);
  console.log(`  Foreground Avg RGB: [${fgAvg.join(', ')}] -> Hex: #${fgAvg.map(c => c.toString(16).padStart(2, '0')).join('')}`);
}

async function main() {
  const folders = fs.readdirSync('public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items');
  for (const f of folders) {
    await testItem(f);
  }
}

main().catch(console.error);
