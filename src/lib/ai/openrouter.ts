import { ClothingTagSchema, ClothingTagResult } from "./tagger";

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

/**
 * Returns the effective OpenRouter API key from custom override, user preference, or env.
 */
export function getOpenRouterKey(customKey?: string): string | undefined {
  if (customKey && customKey.trim().length > 10 && customKey.startsWith("sk-or-")) {
    return customKey.trim();
  }
  const envKey = process.env.OPENROUTER_API_KEY?.trim();
  if (envKey && envKey.length > 10 && envKey.startsWith("sk-or-")) {
    return envKey;
  }
  return undefined;
}

export function isOpenRouterConfigured(customKey?: string): boolean {
  return !!getOpenRouterKey(customKey);
}

/**
 * Analyzes a garment image buffer using OpenRouter's vision models (Gemini 2.5 Flash / Claude / GPT-4o).
 */
export async function analyzeGarmentWithOpenRouter(
  imageBuffer: Buffer,
  fileNameHint?: string,
  customKey?: string
): Promise<ClothingTagResult | null> {
  const apiKey = getOpenRouterKey(customKey);
  if (!apiKey) return null;

  try {
    const base64Image = imageBuffer.toString("base64");
    const dataUri = `data:image/png;base64,${base64Image}`;

    const promptText = `You are an elite luxury digital wardrobe cataloguer and fashion stylist.
Analyze this uploaded clothing/fashion item image carefully.
${fileNameHint ? `Filename hint: "${fileNameHint}".` : ""}

CRITICAL CATEGORY RULES:
1. "SHOES": Any footwear, sneakers, loafers, dress shoes, boots, sandals, heels.
2. "TOP":
   - BUTTON-DOWN SHIRTS: If the garment has a collar and buttons down the front placket, ALWAYS categorize as subcategory "Button-Down Shirt" or "Oxford Shirt". NEVER call a collared button-front shirt a T-shirt.
   - T-SHIRTS: If the garment is collarless with a circular/crew or V neckline and no front buttons, ALWAYS categorize as subcategory "Crewneck T-Shirt", "Oversized T-Shirt", or "Graphic T-Shirt".
   - POLO SHIRTS: Collared with a short 2-3 button placket. Use subcategory "Polo Shirt".
   - SWEATERS / KNITS: Knitted fabric. Use subcategory "Crewneck Sweater" or "Knit Cardigan".
3. "BOTTOM": Pants, jeans, trousers, chinos, cargo pants, shorts, skirts.
4. "OUTERWEAR": Coats, blazers, jackets, trenches, overshirts. (DO NOT categorize shoes or basic shirts as outerwear!).
5. "DRESS": One-piece dresses, jumpsuits, rompers.
6. "BAG": Backpacks, totes, crossbody bags, clutches.
7. "ACCESSORY": Belts, hats, scarves, jewelry, watches, ties.

Output a valid JSON object matching this schema:
{
  "name": "Specific, elegant name (e.g. 'Men\\'s Cognac Leather Derby Shoes', 'Sky Blue Oxford Button-Down', 'Slate Grey Crewneck T-Shirt')",
  "category": "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "SHOES" | "BAG" | "ACCESSORY",
  "subcategory": "Specific garment type (e.g. 'Crewneck T-Shirt', 'Derby Shoes', 'Chino Trousers', 'Tailored Blazer')",
  "primaryColor": "Accurate dominant color (e.g. 'White', 'Charcoal Grey', 'Sky Blue', 'Mocha Brown')",
  "primaryColorHex": "Hex color code e.g. '#9C6A3C'",
  "pattern": "Solid" | "Striped" | "Plaid" | "Floral" | "Graphic" | "Polka Dot" | "Houndstooth" | "Geometric" | "Animal Print" | "Abstract",
  "material": "Cotton" | "Denim" | "Wool" | "Linen" | "Silk" | "Leather" | "Knit" | "Corduroy" | "Synthetic / Polyester" | "Other",
  "fit": "Slim" | "Regular" | "Relaxed" | "Oversized" | "Tailored" | "Cropped" | "Skinny",
  "season": "All-Season" | "Summer" | "Winter" | "Spring/Fall",
  "formality": "Casual" | "Smart Casual" | "Business Casual" | "Formal" | "Athletic",
  "faceDetected": false,
  "stylingNotes": "Short 1-2 sentence tip on what colors/pieces pair best with this item.",
  "box_2d": [ymin, xmin, ymax, xmax] // normalized 0 to 1000 of ONLY this single garment. Exclude model face/skin/body, extraneous clothing (e.g. shirt above pants or shoes below trousers), and floor shadows.
}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Closetmix AI Digital Wardrobe",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 450,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: dataUri } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[OpenRouter Vision] API error ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsedJson = JSON.parse(rawContent);
    const validated = ClothingTagSchema.safeParse(parsedJson);
    if (validated.success) {
      return validated.data;
    } else {
      // Fallback with defaults if partial fields
      return {
        name: parsedJson.name || `${parsedJson.primaryColor || "Neutral"} ${parsedJson.subcategory || parsedJson.category || "Garment"}`,
        category: ["TOP", "BOTTOM", "DRESS", "OUTERWEAR", "SHOES", "BAG", "ACCESSORY"].includes(parsedJson.category)
          ? parsedJson.category
          : "TOP",
        subcategory: parsedJson.subcategory || "Classic Staple",
        primaryColor: parsedJson.primaryColor || "Neutral",
        primaryColorHex: parsedJson.primaryColorHex?.startsWith("#") ? parsedJson.primaryColorHex : "#888888",
        pattern: parsedJson.pattern || "Solid",
        material: parsedJson.material || "Cotton",
        fit: parsedJson.fit || "Regular",
        season: parsedJson.season || "All-Season",
        formality: parsedJson.formality || "Casual",
        faceDetected: Boolean(parsedJson.faceDetected),
        stylingNotes: parsedJson.stylingNotes || "Pairs cleanly with neutral foundations.",
        box_2d: Array.isArray(parsedJson.box_2d) && parsedJson.box_2d.length === 4 ? parsedJson.box_2d : undefined,
      };
    }
  } catch (error) {
    console.warn("[OpenRouter Vision] Failed to analyze garment, using local fallback:", error);
    return null;
  }
}

/**
 * Generates editorial stylist analysis and color theory explanation for an outfit.
 */
export async function generateStylistAnalysisWithOpenRouter(params: {
  items: Array<{ slot: string; name: string; category: string; primaryColor: string; material?: string }>;
  occasion: string;
  weather?: { temperatureC: number; condition: string } | null;
  mood: string;
  gender?: "male" | "female";
  customKey?: string;
}): Promise<{
  stylingExplanation: string;
  colorHarmony: string;
  proportionNote: string;
  confidenceScore: number;
} | null> {
  const apiKey = getOpenRouterKey(params.customKey);
  if (!apiKey) return null;

  try {
    const itemsDescription = params.items.map((i) => `${i.slot}: ${i.name} (${i.primaryColor})`).join(", ");
    const weatherDesc = params.weather ? `${params.weather.temperatureC}°C, ${params.weather.condition}` : "Mild";

    const hasOuterwear = params.items.some((i) => i.category === "OUTERWEAR");
    const isFemale = params.gender === "female";

    const promptText = `You are a high-fashion editorial stylist for ${isFemale ? "Vogue and Harper's Bazaar (Womenswear)" : "GQ and Esquire (Menswear)"}.
Analyze this outfit composition:
- Items: ${itemsDescription}
- Occasion: ${params.occasion}
- Aesthetic Mood: ${params.mood}
- Live Weather: ${weatherDesc}
- Has Outerwear Layer: ${hasOuterwear ? "Yes" : "No (Two-piece / direct top & bottom composition)"}
- Fashion Aesthetic: ${isFemale ? "WOMENSWEAR (curate with chic feminine proportions, elegant silhouette drape, and sophisticated styling)" : "MENSWEAR (curate with sharp masculine tailoring, structured proportions, and modern gentleman aesthetics)"}

CRITICAL STYLING RULES:
1. Deliver styling advice calibrated specifically for ${isFemale ? "WOMENSWEAR" : "MENSWEAR"}.
2. ${!hasOuterwear ? 'There is NO outerwear in this outfit. NEVER describe this outfit as "layered" or use the word "layering" or "layers". Instead describe the clean two-piece silhouette, drape, texture pairing, and color harmony.' : 'Highlight the dimensional outerwear layering and proportion balance.'}

Provide:
1. stylingExplanation: 2 concise, engaging sentences explaining why this outfit works aesthetically.
2. colorHarmony: 1 short sentence on color theory (e.g. "Warm earthy tones balanced by crisp neutral sneakers").
3. proportionNote: 1 short sentence on silhouette proportion (e.g. "Relaxed structured top with tapered tailored leg").
4. confidenceScore: integer from 88 to 98.

Return JSON:
{
  "stylingExplanation": string,
  "colorHarmony": string,
  "proportionNote": string,
  "confidenceScore": number
}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Closetmix AI Digital Wardrobe",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: promptText }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      stylingExplanation: parsed.stylingExplanation || "A balanced, refined ensemble tailored for the setting.",
      colorHarmony: parsed.colorHarmony || "Complementary contrast with neutral anchors.",
      proportionNote: parsed.proportionNote || "Balanced structured and fluid proportions.",
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 94,
    };
  } catch (error) {
    console.warn("[OpenRouter Stylist] Failed to generate rationale, using heuristics:", error);
    return null;
  }
}
