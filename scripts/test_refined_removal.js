const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function refinedRemoveBackground(inputBuffer, options = {}) {
  let workingBuffer = inputBuffer;

  // Optional bounding box crop to isolate garment from model head/shoes
  if (options.boundingBox && Array.isArray(options.boundingBox) && options.boundingBox.length === 4) {
    try {
      const meta = await sharp(workingBuffer).metadata();
      const [ymin, xmin, ymax, xmax] = options.boundingBox;
      const left = Math.max(0, Math.floor((xmin / 1000) * meta.width));
      const top = Math.max(0, Math.floor((ymin / 1000) * meta.height));
      const width = Math.min(meta.width - left, Math.ceil(((xmax - xmin) / 1000) * meta.width));
      const height = Math.min(meta.height - top, Math.ceil(((ymax - ymin) / 1000) * meta.height));
      if (width > 20 && height > 20) {
        workingBuffer = await sharp(workingBuffer).extract({ left, top, width, height }).toBuffer();
      }
    } catch (cropErr) {
      console.warn('Bounding box crop failed, using full image:', cropErr.message);
    }
  }

  const { data, info } = await sharp(workingBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const totalPixels = width * height;

  if (width < 10 || height < 10) {
    return sharp(workingBuffer).png().toBuffer();
  }

  // 1. Sample 4 corner patches (7x7 pixels each = 196 sample pixels)
  const patchSamples = [];
  const patchSize = Math.min(8, Math.floor(Math.min(width, height) / 8));
  
  const corners = [
    { x0: 0, y0: 0 },
    { x0: width - patchSize, y0: 0 },
    { x0: 0, y0: height - patchSize },
    { x0: width - patchSize, y0: height - patchSize },
  ];

  for (const c of corners) {
    for (let dy = 0; dy < patchSize; dy++) {
      for (let dx = 0; dx < patchSize; dx++) {
        const idx = ((c.y0 + dy) * width + (c.x0 + dx)) * 4;
        patchSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
  }

  const avgBg = patchSamples
    .reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0])
    .map((v) => v / patchSamples.length);

  const bgVariance =
    patchSamples.reduce(
      (acc, c) =>
        acc +
        Math.sqrt(
          Math.pow(c[0] - avgBg[0], 2) +
            Math.pow(c[1] - avgBg[1], 2) +
            Math.pow(c[2] - avgBg[2], 2)
        ),
      0
    ) / patchSamples.length;

  const isLightBackdrop = avgBg[0] > 215 && avgBg[1] > 215 && avgBg[2] > 215;
  const baseTolerance = Math.max(20, Math.min(32, 18 + bgVariance * 0.6));

  // 2. Edge-connected BFS Flood-Fill
  const visited = new Uint8Array(totalPixels); // 1 = background, 0 = foreground
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  const isBackgroundPixel = (pIdx, py) => {
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];
    
    // Direct color distance to corner background
    const dist = Math.sqrt(
      Math.pow(r - avgBg[0], 2) +
        Math.pow(g - avgBg[1], 2) +
        Math.pow(b - avgBg[2], 2)
    );

    if (dist <= baseTolerance) return true;

    // Floor shadow detection for studio photography on light backdrops
    if (isLightBackdrop && py > height * 0.35) {
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const saturationDelta = maxC - minC;

      // Achromatic floor shadow: very low color saturation and light-to-mid grey
      if (saturationDelta <= 14 && minC >= 155 && dist <= 125) {
        return true;
      }
    }

    return false;
  };

  // Seed boundary pixels
  for (let x = 0; x < width; x++) {
    const topIdx = x * 4;
    if (isBackgroundPixel(topIdx, 0)) {
      visited[x] = 1;
      queue[qTail++] = x;
    }
    const botP = (height - 1) * width + x;
    const botIdx = botP * 4;
    if (isBackgroundPixel(botIdx, height - 1)) {
      visited[botP] = 1;
      queue[qTail++] = botP;
    }
  }
  for (let y = 0; y < height; y++) {
    const leftP = y * width;
    if (!visited[leftP] && isBackgroundPixel(leftP * 4, y)) {
      visited[leftP] = 1;
      queue[qTail++] = leftP;
    }
    const rightP = y * width + (width - 1);
    if (!visited[rightP] && isBackgroundPixel(rightP * 4, y)) {
      visited[rightP] = 1;
      queue[qTail++] = rightP;
    }
  }

  // BFS Propagation
  while (qHead < qTail) {
    const p = queue[qHead++];
    const px = p % width;
    const py = Math.floor(p / width);

    // 4-way neighbors
    if (px > 0) {
      const np = p - 1;
      if (!visited[np] && isBackgroundPixel(np * 4, py)) {
        visited[np] = 1;
        queue[qTail++] = np;
      }
    }
    if (px < width - 1) {
      const np = p + 1;
      if (!visited[np] && isBackgroundPixel(np * 4, py)) {
        visited[np] = 1;
        queue[qTail++] = np;
      }
    }
    if (py > 0) {
      const np = p - width;
      if (!visited[np] && isBackgroundPixel(np * 4, py - 1)) {
        visited[np] = 1;
        queue[qTail++] = np;
      }
    }
    if (py < height - 1) {
      const np = p + width;
      if (!visited[np] && isBackgroundPixel(np * 4, py + 1)) {
        visited[np] = 1;
        queue[qTail++] = np;
      }
    }
  }

  // 3. Smooth Alpha Matting using 3x3 Neighborhood Anti-Aliasing
  const output = Buffer.alloc(totalPixels * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const idx = p * 4;

      output[idx] = data[idx];
      output[idx + 1] = data[idx + 1];
      output[idx + 2] = data[idx + 2];

      if (visited[p] === 1) {
        output[idx + 3] = 0;
      } else {
        // Count foreground neighbors in 3x3 window
        let fgNeighbors = 0;
        let totalWindow = 0;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            totalWindow++;
            if (visited[ny * width + nx] === 0) {
              fgNeighbors++;
            }
          }
        }

        const ratio = fgNeighbors / totalWindow;
        if (ratio >= 0.88) {
          output[idx + 3] = 255; // 100% Solid interior
        } else if (ratio >= 0.65) {
          output[idx + 3] = 225; // Gentle inner edge
        } else if (ratio >= 0.45) {
          output[idx + 3] = 175; // Mid transition
        } else if (ratio >= 0.28) {
          output[idx + 3] = 110; // Outer feather
        } else {
          output[idx + 3] = 45;  // Subtle subpixel rim
        }
      }
    }
  }

  // 4. Auto-trim transparent borders with clean 4% studio margin
  return sharp(output, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 10 })
    .extend({
      top: Math.max(12, Math.round(height * 0.04)),
      bottom: Math.max(12, Math.round(height * 0.04)),
      left: Math.max(12, Math.round(width * 0.04)),
      right: Math.max(12, Math.round(width * 0.04)),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ quality: 95, compressionLevel: 7 })
    .toBuffer();
}

module.exports = { refinedRemoveBackground };

// Run test on all 6 items
const items = [
  { id: '9895665c-41b1-475e-b619-7b663e6c5de4', name: 'White Sneakers', box: null },
  { id: 'a2ab582d-0050-4be4-9410-f57bd61d6e98', name: 'Tan Leather Shoes', box: null },
  { id: 'a26fe6ee-76e9-497f-83a4-adc0ab5c33b0', name: 'Black Cargo Pants', box: null },
  { id: 'ed783d52-6212-4c5a-875f-5950006b565c', name: 'Khaki Chinos', box: [108, 237, 796, 731] },
  { id: 'c3fdee83-4086-4caf-81b5-84725c7db54c', name: 'Sky Blue Shirt', box: null },
  { id: '83014de4-d710-4bcc-985d-035923fbb213', name: 'Slate Grey Top', box: [18, 0, 878, 1000] },
];

async function run() {
  for (const item of items) {
    const p = `public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/${item.id}/display_${item.id}.webp`;
    if (!fs.existsSync(p)) continue;
    const buf = fs.readFileSync(p);
    const cutout = await refinedRemoveBackground(buf, { boundingBox: item.box });
    const outPath = `public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/${item.id}/cutout_${item.id}.png`;
    fs.writeFileSync(outPath, cutout);
    const meta = await sharp(cutout).metadata();
    console.log('Saved refined cutout for', item.name, ':', meta.width, 'x', meta.height);
  }
}

run().catch(console.error);
