import fs from 'fs';
import sharp from 'sharp';

async function testSmoothedCutout() {
  const itemId = '075dc57c-fd4e-4547-a6bc-12b6de2280f6';
  const file = `public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/${itemId}/display_${itemId}.webp`;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const totalPixels = width * height;

  // Border samples
  const borderSamples: Array<[number, number, number]> = [];
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
    let idx = x * 4;
    borderSamples.push([data[idx], data[idx+1], data[idx+2]]);
    idx = ((height - 1) * width + x) * 4;
    borderSamples.push([data[idx], data[idx+1], data[idx+2]]);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
    let idx = y * width * 4;
    borderSamples.push([data[idx], data[idx+1], data[idx+2]]);
    idx = (y * width + (width - 1)) * 4;
    borderSamples.push([data[idx], data[idx+1], data[idx+2]]);
  }
  const avgBg = borderSamples.reduce((acc, c) => [acc[0]+c[0], acc[1]+c[1], acc[2]+c[2]], [0,0,0]).map(v => v / borderSamples.length);
  const variance = borderSamples.reduce((acc, c) => acc + Math.sqrt((c[0]-avgBg[0])**2 + (c[1]-avgBg[1])**2 + (c[2]-avgBg[2])**2), 0) / borderSamples.length;

  const colorTolerance = Math.max(22, Math.min(48, 18 + variance * 0.8));
  const visited = new Uint8Array(totalPixels);
  const queue: number[] = [];

  const isBgColor = (idx: number) => {
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    return Math.sqrt((r - avgBg[0])**2 + (g - avgBg[1])**2 + (b - avgBg[2])**2) <= colorTolerance;
  };

  for (let x = 0; x < width; x++) {
    if (isBgColor(x * 4)) { visited[x] = 1; queue.push(x); }
    const bp = (height - 1) * width + x;
    if (isBgColor(bp * 4)) { visited[bp] = 1; queue.push(bp); }
  }
  for (let y = 0; y < height; y++) {
    const lp = y * width;
    if (isBgColor(lp * 4) && !visited[lp]) { visited[lp] = 1; queue.push(lp); }
    const rp = y * width + (width - 1);
    if (isBgColor(rp * 4) && !visited[rp]) { visited[rp] = 1; queue.push(rp); }
  }

  let head = 0;
  while (head < queue.length) {
    const p = queue[head++];
    const px = p % width;
    const py = Math.floor(p / width);
    const neighbors = [
      px > 0 ? p - 1 : -1,
      px < width - 1 ? p + 1 : -1,
      py > 0 ? p - width : -1,
      py < height - 1 ? p + width : -1,
    ];
    for (const np of neighbors) {
      if (np >= 0 && visited[np] === 0 && isBgColor(np * 4)) {
        visited[np] = 1;
        queue.push(np);
      }
    }
  }

  // Create 1-channel alpha mask
  const rawMask = Buffer.alloc(totalPixels);
  for (let p = 0; p < totalPixels; p++) {
    rawMask[p] = visited[p] === 1 ? 0 : 255;
  }

  // Slight blur on the mask for anti-aliased edge
  const smoothedMask = await sharp(rawMask, { raw: { width, height, channels: 1 } })
    .blur(0.6)
    .raw()
    .toBuffer();

  // Combine RGB from original + smoothed alpha
  const outRgba = Buffer.alloc(totalPixels * 4);
  for (let p = 0; p < totalPixels; p++) {
    const srcIdx = p * 4;
    outRgba[srcIdx] = data[srcIdx];       // Red unchanged
    outRgba[srcIdx + 1] = data[srcIdx + 1]; // Green unchanged
    outRgba[srcIdx + 2] = data[srcIdx + 2]; // Blue unchanged
    outRgba[srcIdx + 3] = smoothedMask[p];  // Anti-aliased alpha
  }

  const outBuffer = await sharp(outRgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
  fs.writeFileSync(`scripts/smoothed_${itemId.slice(0, 8)}.png`, outBuffer);
  console.log('Successfully saved smoothed cutout! Size:', outBuffer.length);
}

testSmoothedCutout().catch(console.error);
