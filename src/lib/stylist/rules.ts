export interface StylistItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  primaryColorHex: string;
  secondaryColor?: string | null;
  pattern: string;
  material: string;
  fit: string;
  season: string;
  formality: string;
  processedImageUrl: string;
  thumbnailUrl: string;
}

export interface StylingRulesResult {
  isValid: boolean;
  score: number; // 0 to 100
  reasons: string[];
  colorHarmony: string;
}

// Neutral color names that pair well with virtually all color palettes
export const NEUTRAL_COLORS = [
  "black",
  "white",
  "off-white",
  "ivory",
  "grey",
  "gray",
  "heather grey",
  "charcoal",
  "beige",
  "oatmeal",
  "camel",
  "tan",
  "cream",
  "navy",
  "navy blue",
  "indigo",
  "denim",
];

// Formality mapping for distance calculations
export const FORMALITY_LEVELS: Record<string, number> = {
  Athletic: 1,
  Casual: 2,
  "Smart Casual": 3,
  "Business Casual": 4,
  Formal: 5,
};

/**
 * Checks if a color name or hex is considered a neutral anchor.
 */
export function isNeutral(colorName: string): boolean {
  const norm = colorName.toLowerCase().trim();
  return NEUTRAL_COLORS.some((n) => norm.includes(n));
}

/**
 * Validates whether a wardrobe has the minimum necessary items to construct full outfits.
 */
export function validateWardrobeSufficiency(items: StylistItem[]): {
  isSufficient: boolean;
  missingSlots: string[];
  suggestion: string;
} {
  const categories = new Set(items.map((i) => i.category));
  const hasTops = categories.has("TOP");
  const hasBottoms = categories.has("BOTTOM");
  const hasDresses = categories.has("DRESS");
  const hasShoes = categories.has("SHOES");

  const missing: string[] = [];
  if (!hasTops && !hasDresses) missing.push("Tops or Dresses");
  if (!hasBottoms && !hasDresses) missing.push("Bottoms");
  if (!hasShoes) missing.push("Shoes");

  if (items.length < 3 || missing.length > 0) {
    return {
      isSufficient: false,
      missingSlots: missing,
      suggestion: `Your closet needs at least ${missing.join(" and ")} to create cohesive outfits. Upload photos of these pieces or load the starter capsule.`,
    };
  }

  return { isSufficient: true, missingSlots: [], suggestion: "" };
}

/**
 * Evaluates pattern clash between items.
 * Rule: At most 1 loud/bold pattern in an outfit (e.g. floral with solid, striped with solid).
 */
export function evaluatePatternMixing(items: StylistItem[]): {
  passes: boolean;
  notes: string;
} {
  const loudPatterns = items.filter(
    (i) => i.pattern && !["solid", "plain"].includes(i.pattern.toLowerCase())
  );

  if (loudPatterns.length > 1) {
    return {
      passes: false,
      notes: `Pattern clash: Multiple patterned pieces (${loudPatterns
        .map((p) => `${p.name} [${p.pattern}]`)
        .join(" + ")}) compete visually. Pair patterned garments with solid anchors.`,
    };
  }

  return {
    passes: true,
    notes: loudPatterns.length === 1
      ? `Balanced pattern contrast with solid neutrals.`
      : `Clean, minimalist solid composition.`,
  };
}

/**
 * Evaluates formality cohesion across all garments in the outfit.
 * Rule: Adjacent formality levels (e.g. Casual + Smart Casual) are great for contemporary styling,
 * but opposing extremes (Athletic sweatpants with Formal blazer or Oxford dress shoes) clash.
 */
export function evaluateFormalityHarmony(
  items: StylistItem[],
  targetFormality?: string
): {
  score: number;
  explanation: string;
} {
  const levels = items.map((i) => FORMALITY_LEVELS[i.formality] || 2);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const diff = maxLevel - minLevel;

  if (diff >= 3) {
    return {
      score: 55,
      explanation: "High formality dissonance between garments (e.g. athletic gear mixed with formal tailoring).",
    };
  }

  if (targetFormality && FORMALITY_LEVELS[targetFormality]) {
    const target = FORMALITY_LEVELS[targetFormality];
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    const targetDiff = Math.abs(avg - target);

    if (targetDiff <= 0.6) {
      return { score: 95, explanation: `Accurately aligned with your requested ${targetFormality} aesthetic.` };
    }
  }

  return { score: 90, explanation: "Cohesive formality spectrum with natural sartorial harmony." };
}

/**
 * Evaluates color theory harmony.
 */
export function evaluateColorHarmony(items: StylistItem[]): {
  harmonyType: string;
  score: number;
  explanation: string;
} {
  const nonNeutral = items.filter((i) => !isNeutral(i.primaryColor));

  // Case 1: All neutrals (Classic monochromatic / minimalist)
  if (nonNeutral.length === 0) {
    return {
      harmonyType: "Tonal Neutral / Monochromatic",
      score: 95,
      explanation: "Effortless luxury tonal harmony using timeless neutrals.",
    };
  }

  // Case 2: One statement pop of color anchored by neutrals
  if (nonNeutral.length === 1) {
    return {
      harmonyType: "Statement Accent Harmony",
      score: 96,
      explanation: `The ${nonNeutral[0].primaryColor} acts as a focal statement balanced by clean neutral foundations.`,
    };
  }

  // Case 3: Multiple non-neutral colors
  const colorNames = nonNeutral.map((i) => i.primaryColor.toLowerCase());
  const uniqueHues = Array.from(new Set(colorNames));

  if (uniqueHues.length === 1) {
    return {
      harmonyType: "Monochromatic Hue",
      score: 93,
      explanation: `Refined monochromatic palette playing with nuanced shades of ${uniqueHues[0]}.`,
    };
  }

  return {
    harmonyType: "Balanced Complementary Harmony",
    score: 90,
    explanation: `Harmonious interplay of complementary and analogous chromatic tones.`,
  };
}

/**
 * Filters items for weather appropriateness.
 */
export function filterItemsForWeather(
  items: StylistItem[],
  tempC: number,
  isRaining: boolean
): StylistItem[] {
  return items.filter((item) => {
    // If cold (<12°C), exclude light summer-only items
    if (tempC < 12 && item.season === "Summer") return false;

    // If hot (>25°C), exclude heavy winter wool/insulation
    if (tempC > 25 && item.season === "Winter") return false;

    // If hot (>26°C), exclude heavy jackets
    if (tempC > 26 && item.category === "OUTERWEAR") return false;

    return true;
  });
}
