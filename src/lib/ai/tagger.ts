import { z } from "zod";
import sharp from "sharp";

export const ClothingTagSchema = z.object({
  name: z.string().describe("Descriptive name of the garment, e.g. 'Oatmeal Wool Trench Coat'"),
  category: z.enum(["TOP", "BOTTOM", "DRESS", "OUTERWEAR", "SHOES", "BAG", "ACCESSORY"]),
  subcategory: z.string().describe("Specific subcategory, e.g. 'Crewneck T-Shirt', 'Chinos', 'Ankle Boots'"),
  primaryColor: z.string().describe("Dominant color name, e.g. 'Navy Blue', 'Forest Green', 'Beige'"),
  primaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe("Approximated 6-character hex code"),
  secondaryColor: z.string().optional().describe("Secondary color name if present"),
  secondaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  pattern: z.enum([
    "Solid",
    "Striped",
    "Plaid",
    "Floral",
    "Graphic",
    "Polka Dot",
    "Houndstooth",
    "Geometric",
    "Animal Print",
    "Abstract",
  ]),
  material: z.enum([
    "Cotton",
    "Denim",
    "Wool",
    "Linen",
    "Silk",
    "Leather",
    "Knit",
    "Corduroy",
    "Synthetic / Polyester",
    "Other",
  ]),
  fit: z.enum(["Slim", "Regular", "Relaxed", "Oversized", "Tailored", "Cropped", "Skinny"]),
  season: z.enum(["All-Season", "Summer", "Winter", "Spring/Fall"]),
  formality: z.enum(["Casual", "Smart Casual", "Business Casual", "Formal", "Athletic"]),
  faceDetected: z.boolean().describe("True if a human face or personal likeness was detected"),
  stylingNotes: z.string().describe("Stylist tips on pairing this item"),
  box_2d: z.array(z.number()).length(4).optional().describe("Normalized bounding box [ymin, xmin, ymax, xmax] 0-1000 of ONLY the primary garment"),
});

export type ClothingTagResult = z.infer<typeof ClothingTagSchema>;

/**
 * Intelligent Fallback Heuristic Classifier:
 * Analyzes foreground-isolated pixel colors, aspect ratio, and silhouette geometry
 * to detect category, subcategory, primary color, material, and fit even without an external API key.
 */
export async function fallbackHeuristicTagging(
  imageBuffer: Buffer,
  fileNameHint?: string
): Promise<ClothingTagResult> {
  try {
    const { data, info } = await sharp(imageBuffer)
      .resize(250, 250, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    // 1. Sample perimeter border pixels to determine backdrop color
    const borderSamples: Array<[number, number, number]> = [];
    const stepX = Math.max(1, Math.floor(width / 16));
    const stepY = Math.max(1, Math.floor(height / 16));

    for (let x = 0; x < width; x += stepX) {
      let idx = (0 * width + x) * 4;
      borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      idx = ((height - 1) * width + x) * 4;
      borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    for (let y = 0; y < height; y += stepY) {
      let idx = (y * width + 0) * 4;
      borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      idx = (y * width + (width - 1)) * 4;
      borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }

    const avgBg = borderSamples
      .reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0])
      .map((v) => v / borderSamples.length);

    // 2. Isolate foreground pixels strictly (color distance > 32 from average border backdrop)
    const fgPixels: Array<[number, number, number]> = [];
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const dist = Math.sqrt(
          Math.pow(r - avgBg[0], 2) +
            Math.pow(g - avgBg[1], 2) +
            Math.pow(b - avgBg[2], 2)
        );

        if (dist > 30) {
          fgPixels.push([r, g, b]);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // 3. Compute true foreground color (ignoring the 70% white/neutral background)
    let fgR = 0;
    let fgG = 0;
    let fgB = 0;

    if (fgPixels.length > 0) {
      const sum = fgPixels.reduce(
        (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
        [0, 0, 0]
      );
      fgR = Math.round(sum[0] / fgPixels.length);
      fgG = Math.round(sum[1] / fgPixels.length);
      fgB = Math.round(sum[2] / fgPixels.length);
    } else {
      // Fallback to center 50% box
      const startX = Math.floor(width * 0.25);
      const endX = Math.floor(width * 0.75);
      const startY = Math.floor(height * 0.25);
      const endY = Math.floor(height * 0.75);
      let count = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          fgR += data[idx];
          fgG += data[idx + 1];
          fgB += data[idx + 2];
          count++;
        }
      }
      if (count > 0) {
        fgR = Math.round(fgR / count);
        fgG = Math.round(fgG / count);
        fgB = Math.round(fgB / count);
      }
    }

    const hex = (c: number) =>
      Math.min(255, Math.max(0, Math.round(c)))
        .toString(16)
        .padStart(2, "0");
    const primaryHex = `#${hex(fgR)}${hex(fgG)}${hex(fgB)}`;

    // 4. Nuanced Color Classification
    let colorName = "Neutral";
    if (fgR < 48 && fgG < 48 && fgB < 48) {
      colorName = "Black";
    } else if (
      Math.abs(fgR - fgG) < 12 &&
      Math.abs(fgG - fgB) < 12 &&
      Math.abs(fgR - fgB) < 12
    ) {
      if (fgR > 200) colorName = "White / Off-White";
      else if (fgR < 95) colorName = "Charcoal Grey";
      else if (fgR < 165) colorName = "Slate Grey";
      else colorName = "Heather Grey";
    } else if (fgR > 218 && fgG > 218 && fgB > 218) {
      colorName = "White / Off-White";
    } else if (fgB > fgR + 22 && fgB > fgG + 14) {
      if (fgB > 155 && fgR < 145) colorName = "Sky Blue";
      else colorName = "Navy Blue";
    } else if (fgG > fgR + 15 && fgG > fgB + 15) {
      colorName = "Olive Green";
    } else if (fgR > fgG + 35 && fgR > fgB + 35) {
      colorName = "Burgundy / Rust";
    } else if (fgR > 180 && fgG > 170 && fgB > 145) {
      colorName = "Sand / Khaki / Beige";
    } else if (fgR > 135 && fgG > 100 && fgB < 95) {
      colorName = "Tan / Camel";
    } else if (fgR > 95 && fgG > 60 && fgR > fgB + 20) {
      colorName = "Mocha / Cognac Brown";
    } else if (Math.abs(fgR - fgG) < 22 && fgR > fgB + 15) {
      colorName = "Taupe / Stone Neutral";
    }

    // 5. Bounding box & Aspect Ratio Geometry
    const fgW = Math.max(1, maxX - minX);
    const fgH = Math.max(1, maxY - minY);
    const ratio = fgW / fgH;

    // Check filename hints
    const fn = (fileNameHint || "").toLowerCase();

    let category: "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "SHOES" | "BAG" | "ACCESSORY" = "TOP";
    let subcategory = "Classic Crewneck";
    let material: any = "Cotton";
    let formality: any = "Smart Casual";
    let season: any = "All-Season";
    let fit: any = "Regular";

    if (fn.match(/pant|jean|trouser|chino|cargo|short|skirt|bottom/)) {
      category = "BOTTOM";
      subcategory = fn.includes("jean")
        ? "Denim Jeans"
        : fn.includes("cargo")
        ? "Cargo Trousers"
        : fn.includes("chino")
        ? "Chino Pants"
        : "Tailored Trousers";
      material = fn.includes("jean") ? "Denim" : "Cotton";
    } else if (fn.match(/shoe|boot|sneaker|loafer|heel|trainer|runner|footwear/)) {
      category = "SHOES";
      subcategory = fn.includes("boot")
        ? "Leather Boots"
        : fn.includes("loafer")
        ? "Classic Loafers"
        : "Minimalist Sneakers";
      material = "Leather";
    } else if (fn.match(/jacket|coat|blazer|cardigan|outerwear|hoodie|parka/)) {
      category = "OUTERWEAR";
      subcategory = fn.includes("blazer")
        ? "Tailored Blazer"
        : fn.includes("hoodie")
        ? "Relaxed Hoodie"
        : "Outer Jacket";
      material = fn.includes("blazer") ? "Wool" : "Cotton";
      season = "Winter";
    } else if (fn.match(/dress|gown|robe/)) {
      category = "DRESS";
      subcategory = "Midi Dress";
      material = "Linen";
      season = "Summer";
    } else if (fn.match(/bag|tote|backpack|clutch|crossbody/)) {
      category = "BAG";
      subcategory = "Leather Tote";
      material = "Leather";
    } else if (fn.match(/belt|scarf|hat|watch|tie/)) {
      category = "ACCESSORY";
      subcategory = "Leather Belt";
      material = "Leather";
    } else {
      // Geometric Classification based on silhouette ratio:
      if (ratio > 1.32) {
        // Wide and low horizontal profile -> Footwear / Shoes
        category = "SHOES";
        subcategory =
          colorName.includes("White")
            ? "Minimalist Leather Sneakers"
            : colorName.includes("Brown") || colorName.includes("Tan") || colorName.includes("Black")
            ? "Classic Leather Shoes"
            : "Casual Sneakers";
        material = "Leather";
        formality = colorName.includes("White") ? "Casual" : "Smart Casual";
      } else if (ratio < 0.68) {
        // Tall, vertical elongated silhouette -> Pants / Bottoms
        category = "BOTTOM";
        subcategory =
          colorName.includes("Blue")
            ? "Denim Jeans"
            : colorName.includes("Sand") || colorName.includes("Khaki")
            ? "Chino Trousers"
            : colorName.includes("Black")
            ? "Cargo / Tailored Pants"
            : "Tailored Trousers";
        material = colorName.includes("Blue") ? "Denim" : "Cotton";
        formality = colorName.includes("Blue") ? "Casual" : "Smart Casual";
      } else {
        // Balanced ratio 0.68 to 1.32 -> Top / Shirt
        category = "TOP";
        subcategory =
          colorName.includes("Blue") || colorName.includes("White")
            ? "Button-Down Shirt"
            : colorName.includes("Tan") || colorName.includes("Brown")
            ? "Classic Knitwear"
            : "Crewneck T-Shirt";
        material = "Cotton";
        formality = "Casual";
      }
    }

    return {
      name: `${colorName} ${subcategory}`,
      category,
      subcategory,
      primaryColor: colorName,
      primaryColorHex: primaryHex,
      pattern: "Solid",
      material,
      fit,
      season,
      formality,
      faceDetected: false,
      stylingNotes: `Pairs effortlessly with neutral contrast tones for a refined ${formality.toLowerCase()} silhouette.`,
    };
  } catch (err) {
    console.warn("[Tagger] Fallback heuristic encountered issue:", err);
    return {
      name: "Neutral Garment",
      category: "TOP",
      subcategory: "Casual Piece",
      primaryColor: "Neutral",
      primaryColorHex: "#888888",
      pattern: "Solid",
      material: "Cotton",
      fit: "Regular",
      season: "All-Season",
      formality: "Smart Casual",
      faceDetected: false,
      stylingNotes: "Versatile styling piece.",
    };
  }
}

import { analyzeGarmentWithOpenRouter, isOpenRouterConfigured, getOpenRouterKey } from "./openrouter";

/**
 * Main AI Garment Analysis function.
 * Prioritizes OpenRouter multimodal vision (Gemini 2.5 Flash), then Google Gemini direct API,
 * then executes intelligent computer vision heuristic fallback.
 */
export async function analyzeGarmentImage(
  imageBuffer: Buffer,
  fileNameHint?: string,
  customApiKey?: string
): Promise<ClothingTagResult> {
  // 1. Try OpenRouter Vision if OpenRouter key is present
  if (isOpenRouterConfigured(customApiKey)) {
    const openRouterResult = await analyzeGarmentWithOpenRouter(imageBuffer, fileNameHint, customApiKey);
    if (openRouterResult) {
      return openRouterResult;
    }
  }

  // 2. Try direct Google Gemini API if Gemini key is present
  const geminiKey = (customApiKey && customApiKey.startsWith("AIzaSy") ? customApiKey : process.env.GEMINI_API_KEY)?.trim();

  if (geminiKey && geminiKey !== "" && geminiKey !== "your-gemini-api-key-here") {
    try {
      const optimizedBuffer = await sharp(imageBuffer)
        .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const base64Image = optimizedBuffer.toString("base64");

      const prompt = `You are a world-class luxury fashion archivist and personal stylist.
Analyze this garment photo and output ONLY a JSON object strictly matching this format:
{
  "name": "Concise editorial title, e.g. 'Oatmeal Wool Trench Coat'",
  "category": "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "SHOES" | "BAG" | "ACCESSORY",
  "subcategory": "e.g. Crewneck T-Shirt, Chinos, Ankle Boots, Oversized Blazer",
  "primaryColor": "e.g. Navy Blue, Forest Green, Ivory, Charcoal",
  "primaryColorHex": "#rrggbb (valid 6-digit hex code)",
  "secondaryColor": "Secondary color or null",
  "secondaryColorHex": "#rrggbb or null",
  "pattern": "Solid" | "Striped" | "Plaid" | "Floral" | "Graphic" | "Polka Dot" | "Houndstooth" | "Geometric" | "Animal Print" | "Abstract",
  "material": "Cotton" | "Denim" | "Wool" | "Linen" | "Silk" | "Leather" | "Knit" | "Corduroy" | "Synthetic / Polyester" | "Other",
  "fit": "Slim" | "Regular" | "Relaxed" | "Oversized" | "Tailored" | "Cropped" | "Skinny",
  "season": "All-Season" | "Summer" | "Winter" | "Spring/Fall",
  "formality": "Casual" | "Smart Casual" | "Business Casual" | "Formal" | "Athletic",
  "faceDetected": true/false (true if a human face or personal body was detected in the frame),
  "stylingNotes": "1-2 concise sentences on styling harmony"
}

PRIVACY & SAFETY:
If a human face or personal likeness is visible in the frame, set "faceDetected": true. Do NOT evaluate or describe the person. Analyze only the garment itself. Return ONLY raw JSON without markdown code fences.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsedJson = JSON.parse(cleanedText);
          return ClothingTagSchema.parse(parsedJson);
        }
      }
    } catch (err) {
      console.warn("Gemini direct tagging error, falling back:", err);
    }
  }

  // 3. Fallback: Local High-Performance Computer Vision Heuristic
  return fallbackHeuristicTagging(imageBuffer, fileNameHint);
}
