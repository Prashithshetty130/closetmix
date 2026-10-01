import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function testFloodFill(itemId: string) {
  const file = `public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/${itemId}/display_${itemId}.webp`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 1. Sample border pixels to detect background color
  const borderSamples: Array<[number, number, number]> = [];
  const sample = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    borderSamples.push([data[idx], data[idx+1], data[idx+2]]);
  };

  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
    sample(0, y);
    sample(width - 1, y);
  }

  const avgBg = borderSamples.reduce((acc, c) => [acc[0]+c[0], acc[1]+c[1], acc[2]+c[2]], [0,0,0]).map(v => v / borderSamples.length);

  // Check border color variance - if background is too noisy/textured, we shouldn't aggressive flood fill
  const variance = borderSamples.reduce((acc, c) => {
    const d = Math.sqrt((c[0]-avgBg[0])**2 + (c[1]-avgBg[1])**2 + (c[2]-avgBg[2])**2);
    return acc + d;
  }, 0) / borderSamples.length;

  console.log(`\nItem ${itemId}:`);
  console.log(`  Size: ${width}x${height}, AvgBg: [${avgBg.map(Math.round).join(',')}], Border Variance: ${variance.toFixed(1)}`);

  // 2. BFS Flood-Fill from the 4 outer borders
  const visited = new Uint8Array(width * height); // 1 = background, 0 = foreground/unvisited
  const queue: number[] = [];

  const colorTolerance = Math.max(22, Math.min(48, 18 + variance * 0.8));

  const isBgColor = (idx: number) => {
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const dist = Math.sqrt((r - avgBg[0])**2 + (g - avgBg[1])**2 + (b - avgBg[2])**2);
    return dist <= colorTolerance;
  };

  // Seed boundary pixels that match background
  for (let x = 0; x < width; x++) {
    const topIdx = (0 * width + x) * 4;
    if (isBgColor(topIdx)) {
      visited[x] = 1;
      queue.push(x); // y = 0
    }
    const botIdx = ((height - 1) * width + x) * 4;
    if (isBgColor(botIdx)) {
      const p = (height - 1) * width + x;
      visited[p] = 1;
      queue.push(p);
    }
  }

  for (let y = 0; y < height; y++) {
    const leftIdx = (y * width + 0) * 4;
    if (isBgColor(leftIdx) && visited[y * width] === 0) {
      visited[y * width] = 1;
      queue.push(y * width);
    }
    const rightIdx = (y * width + (width - 1)) * 4;
    if (isBgColor(rightIdx) && visited[y * width + (width - 1)] === 0) {
      visited[y * width + (width - 1)] = 1;
      queue.push(y * width + (width - 1));
    }
  }

  // BFS propagation
  let head = 0;
  while (head < queue.length) {
    const p = queue[head++];
    const px = p % width;
    const py = Math.floor(p / width);

    // 4-neighborhood
    const neighbors = [
      px > 0 ? p - 1 : -1,
      px < width - 1 ? p + 1 : -1,
      py > 0 ? p - width : -1,
      py < height - 1 ? p + width : -1,
    ];

    for (const np of neighbors) {
      if (np >= 0 && visited[np] === 0) {
        const nidx = np * 4;
        if (isBgColor(nidx)) {
          visited[np] = 1;
          queue.push(np);
        }
      }
    }
  }

  const bgPixelsCount = queue.length;
  const totalPixels = width * height;
  const bgRatio = bgPixelsCount / totalPixels;
  console.log(`  Flood-filled background pixels: ${bgPixelsCount} / ${totalPixels} (${(bgRatio*100).toFixed(1)}%)`);

  // Build cutout buffer
  const outData = Buffer.from(data);
  for (let p = 0; p < totalPixels; p++) {
    const idx = p * 4;
    if (visited[p] === 1) {
      outData[idx + 3] = 0; // transparent
    } else {
      outData[idx + 3] = 255; // 100% SOLID foreground! Never semi-transparent inside garment!
    }
  }

  const outPath = `scripts/test_cutout_${itemId.slice(0, 8)}.png`;
  await sharp(outData, { raw: { width, height, channels: 4 } }).png().toFile(outPath);
  console.log(`  Saved test cutout to ${outPath}`);
}

async function main() {
  const folders = fs.readdirSync('public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items');
  for (const f of folders) {
    await testFloodFill(f);
  }
}

main().catch(console.error);
