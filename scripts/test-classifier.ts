import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface ColorInfo {
  name: string;
  hex: string;
}

function detectColor(r: number, g: number, b: number): ColorInfo {
  const hex = `#${[r, g, b].map(x => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')).join('')}`;
  
  if (r < 45 && g < 45 && b < 45) return { name: "Black", hex };
  if (r > 215 && g > 215 && b > 215) return { name: "White / Off-White", hex };
  if (r > 195 && g > 185 && b > 165) return { name: "Sand / Khaki / Beige", hex };
  if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && Math.abs(r - b) < 18) {
    if (r < 100) return { name: "Charcoal Grey", hex };
    if (r < 170) return { name: "Slate Grey", hex };
    return { name: "Heather Grey", hex };
  }
  if (b > r + 25 && b > g + 15) {
    if (b > 160 && r < 140) return { name: "Sky Blue", hex };
    return { name: "Navy Blue", hex };
  }
  if (r > 120 && g > 75 && b < 70) {
    if (r > 160 && g > 120) return { name: "Tan / Camel", hex };
    return { name: "Cognac Brown", hex };
  }
  if (g > r + 15 && g > b + 15) return { name: "Olive Green", hex };
  if (r > g + 35 && r > b + 35) return { name: "Rust / Burgundy", hex };
  
  return { name: "Neutral", hex };
}

async function classifyGarment(itemId: string) {
  const file = `public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items/${itemId}/display_${itemId}.webp`;
  const { data, info } = await sharp(file).resize(240, 240, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 1. Sample border pixels
  const borderColors: Array<[number, number, number]> = [];
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 15))) {
    let idx = (0 * width + x) * 4;
    borderColors.push([data[idx], data[idx+1], data[idx+2]]);
    idx = ((height - 1) * width + x) * 4;
    borderColors.push([data[idx], data[idx+1], data[idx+2]]);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 15))) {
    let idx = (y * width + 0) * 4;
    borderColors.push([data[idx], data[idx+1], data[idx+2]]);
    idx = (y * width + (width - 1)) * 4;
    borderColors.push([data[idx], data[idx+1], data[idx+2]]);
  }
  const avgBg = borderColors.reduce((acc, c) => [acc[0]+c[0], acc[1]+c[1], acc[2]+c[2]], [0,0,0]).map(v => v / borderColors.length);

  // 2. Collect foreground pixels (dist > 32 from avgBg)
  const fgPixels: Array<[number, number, number]> = [];
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const dist = Math.sqrt((r - avgBg[0])**2 + (g - avgBg[1])**2 + (b - avgBg[2])**2);
      if (dist > 32) {
        fgPixels.push([r, g, b]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Foreground dominant color
  let fgR = 0, fgG = 0, fgB = 0;
  if (fgPixels.length > 0) {
    const sum = fgPixels.reduce((acc, c) => [acc[0]+c[0], acc[1]+c[1], acc[2]+c[2]], [0,0,0]);
    fgR = Math.round(sum[0] / fgPixels.length);
    fgG = Math.round(sum[1] / fgPixels.length);
    fgB = Math.round(sum[2] / fgPixels.length);
  } else {
    fgR = avgBg[0]; fgG = avgBg[1]; fgB = avgBg[2];
  }

  const color = detectColor(fgR, fgG, fgB);

  // Aspect ratio of foreground bounding box
  const fgW = Math.max(1, maxX - minX);
  const fgH = Math.max(1, maxY - minY);
  const ratio = fgW / fgH;

  let category: string;
  let subcategory: string;
  let material: string;
  let formality: string;
  let season: string;

  if (ratio > 1.35) {
    category = "SHOES";
    subcategory = color.name.includes("White") ? "Minimalist Leather Sneakers" : "Classic Leather Shoes";
    material = "Leather";
    formality = color.name.includes("White") ? "Casual" : "Smart Casual";
    season = "All-Season";
  } else if (ratio < 0.68) {
    category = "BOTTOM";
    subcategory = color.name.includes("Blue") ? "Denim Jeans" : (color.name.includes("Khaki") || color.name.includes("Sand")) ? "Chino Trousers" : "Cargo / Tailored Pants";
    material = color.name.includes("Blue") ? "Denim" : "Cotton";
    formality = "Casual";
    season = "All-Season";
  } else {
    // 0.68 <= ratio <= 1.35
    category = "TOP";
    subcategory = color.name.includes("Blue") ? "Button-Down Shirt" : (color.name.includes("Tan") || color.name.includes("Brown")) ? "Overshirt / Jacket" : "Casual Crewneck Top";
    material = "Cotton";
    formality = "Smart Casual";
    season = "All-Season";
  }

  const name = `${color.name} ${subcategory}`;
  console.log({
    itemId: itemId.slice(0, 8),
    ratio: ratio.toFixed(2),
    detectedColor: color.name,
    hex: color.hex,
    name,
    category,
    subcategory,
  });
}

async function main() {
  const folders = fs.readdirSync('public/uploads/5df1b9d0-cc78-4d14-a006-9230ded9d808/items');
  for (const f of folders) {
    await classifyGarment(f);
  }
}

main().catch(console.error);
