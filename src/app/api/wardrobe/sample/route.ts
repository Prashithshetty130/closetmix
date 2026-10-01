import { NextResponse } from "next/server";
import { getCurrentUser, createGuestSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// 10 curated staple capsule items
const SAMPLE_CAPSULE = [
  {
    name: "Classic Oatmeal Wool Blazer",
    category: "OUTERWEAR",
    subcategory: "Tailored Blazer",
    primaryColor: "Oatmeal Beige",
    primaryColorHex: "#d8cbb5",
    pattern: "Solid",
    material: "Wool",
    fit: "Tailored",
    season: "Fall/Winter",
    formality: "Smart Casual",
    notes: "Versatile layering staple with structured shoulders.",
    colorRgb: { r: 216, g: 203, b: 181 },
  },
  {
    name: "Crisp Oxford Cotton Shirt",
    category: "TOP",
    subcategory: "Button-Down Shirt",
    primaryColor: "Powder Blue",
    primaryColorHex: "#99badd",
    pattern: "Solid",
    material: "Cotton",
    fit: "Regular",
    season: "All-Season",
    formality: "Smart Casual",
    notes: "Breathable staple that tucks cleanly into trousers.",
    colorRgb: { r: 153, g: 186, b: 221 },
  },
  {
    name: "Heavyweight Black Boxy Tee",
    category: "TOP",
    subcategory: "Crewneck T-Shirt",
    primaryColor: "Black",
    primaryColorHex: "#18181b",
    pattern: "Solid",
    material: "Cotton",
    fit: "Relaxed",
    season: "All-Season",
    formality: "Casual",
    notes: "280gsm heavyweight cotton with drop-shoulder silhouette.",
    colorRgb: { r: 24, g: 24, b: 27 },
  },
  {
    name: "Silk Minimalist Slip Top",
    category: "TOP",
    subcategory: "Camisole Top",
    primaryColor: "Ivory",
    primaryColorHex: "#f5f5f0",
    pattern: "Solid",
    material: "Silk",
    fit: "Slim",
    season: "Summer",
    formality: "Smart Casual",
    notes: "Subtle sheen for evening dates or warm afternoons.",
    colorRgb: { r: 245, g: 245, b: 240 },
  },
  {
    name: "Straight-Leg Selvedge Denim",
    category: "BOTTOM",
    subcategory: "Denim Jeans",
    primaryColor: "Indigo Blue",
    primaryColorHex: "#1e3a8a",
    pattern: "Solid",
    material: "Denim",
    fit: "Regular",
    season: "All-Season",
    formality: "Casual",
    notes: "13oz Japanese selvedge denim with clean mid-rise cut.",
    colorRgb: { r: 30, g: 58, b: 138 },
  },
  {
    name: "Pleated Relaxed Trousers",
    category: "BOTTOM",
    subcategory: "Tailored Trousers",
    primaryColor: "Charcoal Grey",
    primaryColorHex: "#374151",
    pattern: "Solid",
    material: "Wool",
    fit: "Relaxed",
    season: "All-Season",
    formality: "Business Casual",
    notes: "Double-pleated front with fluid drape.",
    colorRgb: { r: 55, g: 65, b: 81 },
  },
  {
    name: "Italian Leather Chelsea Boots",
    category: "SHOES",
    subcategory: "Chelsea Boots",
    primaryColor: "Espresso Brown",
    primaryColorHex: "#3e2723",
    pattern: "Solid",
    material: "Leather",
    fit: "Tailored",
    season: "Fall/Winter",
    formality: "Smart Casual",
    notes: "Goodyear-welted with sleek almond toe.",
    colorRgb: { r: 62, g: 39, b: 35 },
  },
  {
    name: "Minimalist Low-Top Leather Sneakers",
    category: "SHOES",
    subcategory: "Sneakers",
    primaryColor: "White",
    primaryColorHex: "#ffffff",
    pattern: "Solid",
    material: "Leather",
    fit: "Regular",
    season: "All-Season",
    formality: "Casual",
    notes: "Clean monochrome white profile suited for any casual or smart look.",
    colorRgb: { r: 245, g: 245, b: 245 },
  },
  {
    name: "Structured Leather Tote Bag",
    category: "BAG",
    subcategory: "Tote Bag",
    primaryColor: "Cognac Tan",
    primaryColorHex: "#8d4925",
    pattern: "Solid",
    material: "Leather",
    fit: "Regular",
    season: "All-Season",
    formality: "Smart Casual",
    notes: "Fits a 15-inch laptop with minimalist brass hardware.",
    colorRgb: { r: 141, g: 73, b: 37 },
  },
  {
    name: "Reversible Cashmere Scarf",
    category: "ACCESSORY",
    subcategory: "Wool Scarf",
    primaryColor: "Camel",
    primaryColorHex: "#c19a6b",
    pattern: "Solid",
    material: "Wool",
    fit: "Regular",
    season: "Winter",
    formality: "Smart Casual",
    notes: "100% Mongolian cashmere with frayed eyelash fringe.",
    colorRgb: { r: 193, g: 154, b: 107 },
  },
];

export async function POST() {
  try {
    let session = await getCurrentUser();
    let userId = session?.id;

    if (!userId) {
      const guest = await createGuestSession();
      userId = guest.id;
    }

    const createdItems = [];

    for (const item of SAMPLE_CAPSULE) {
      const itemId = `sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userDir = path.join(process.cwd(), "public", "uploads", userId, "items", itemId);
      await fs.mkdir(userDir, { recursive: true });

      // Generate aesthetic garment mockup visual with sharp
      const visualBuffer = await sharp({
        create: {
          width: 600,
          height: 600,
          channels: 4,
          background: { r: item.colorRgb.r, g: item.colorRgb.g, b: item.colorRgb.b, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const displayPath = path.join(userDir, `display_${itemId}.webp`);
      const thumbPath = path.join(userDir, `thumb_${itemId}.webp`);
      const cutoutPath = path.join(userDir, `cutout_${itemId}.png`);

      await sharp(visualBuffer).webp({ quality: 85 }).toFile(displayPath);
      await sharp(visualBuffer).resize(360, 360).webp({ quality: 80 }).toFile(thumbPath);
      await fs.writeFile(cutoutPath, visualBuffer);

      const relBase = `/uploads/${userId}/items/${itemId}`;
      const clothingRecord = await prisma.clothingItem.create({
        data: {
          id: itemId,
          userId,
          name: item.name,
          originalImageUrl: `${relBase}/display_${itemId}.webp`,
          processedImageUrl: `${relBase}/cutout_${itemId}.png`,
          thumbnailUrl: `${relBase}/thumb_${itemId}.webp`,
          category: item.category,
          subcategory: item.subcategory,
          primaryColor: item.primaryColor,
          primaryColorHex: item.primaryColorHex,
          pattern: item.pattern,
          material: item.material,
          fit: item.fit,
          season: item.season,
          formality: item.formality,
          notes: item.notes,
          wearCount: Math.floor(Math.random() * 4),
          lastWornAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 86400000), // some worn recently, some >30 days
        },
      });

      createdItems.push(clothingRecord);
    }

    return NextResponse.json({
      success: true,
      message: "Sample starter capsule loaded successfully!",
      count: createdItems.length,
      items: createdItems,
    });
  } catch (error: any) {
    console.error("Load sample capsule error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load sample capsule" },
      { status: 500 }
    );
  }
}
