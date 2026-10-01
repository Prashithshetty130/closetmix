import {
  StylistItem,
  validateWardrobeSufficiency,
  evaluateColorHarmony,
  evaluatePatternMixing,
  evaluateFormalityHarmony,
  filterItemsForWeather,
} from "./rules";
import { WeatherData } from "../weather";
import { isOpenRouterConfigured, generateStylistAnalysisWithOpenRouter } from "../ai/openrouter";

export interface OutfitGenerationRequest {
  wardrobe: StylistItem[];
  occasion?: string;
  weather?: WeatherData | null;
  mood?: string;
  gender?: "male" | "female";
  colorExclusions?: string[];
  buildAroundItemId?: string | null;
  lockedItemIds?: string[];
  currentOutfitItemIds?: string[];
  seed?: number;
}

export interface GeneratedOutfitSlot {
  slot: "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "SHOES" | "BAG" | "ACCESSORY";
  item: StylistItem;
  isLocked: boolean;
}

export interface GeneratedOutfit {
  id: string;
  name: string;
  occasion: string;
  weatherSuitability: string;
  confidenceScore: number;
  stylingExplanation: string;
  colorHarmony: string;
  proportionNote: string;
  items: GeneratedOutfitSlot[];
}

export interface GenerationResult {
  success: boolean;
  outfits?: GeneratedOutfit[];
  error?: string;
  coldStartSuggestion?: string;
}

/**
 * Seed-based pseudo-random array shuffler (Fisher-Yates with LCG).
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s = 123456789;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = Math.floor((s / 2147483647) * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Main Outfit Generator combining deterministic fashion heuristics
 * with intelligent rotation, diversity sampling, and locked item preservation.
 */
export async function generateOutfitOptions(
  req: OutfitGenerationRequest
): Promise<GenerationResult> {
  const {
    wardrobe,
    occasion = "Casual",
    weather,
    mood = "Effortless",
    gender = "male",
    colorExclusions = [],
    buildAroundItemId,
    lockedItemIds = [],
    currentOutfitItemIds = [],
    seed = Date.now(),
  } = req;

  // 1. Minimum Wardrobe Sufficiency Check
  const check = validateWardrobeSufficiency(wardrobe);
  if (!check.isSufficient) {
    return {
      success: false,
      error: "INSUFFICIENT_WARDROBE",
      coldStartSuggestion: check.suggestion,
    };
  }

  // 2. Pre-filter by Color Exclusions (do not exclude explicitly locked items)
  const filteredWardrobe = wardrobe.filter((item) => {
    if (lockedItemIds.includes(item.id) || item.id === buildAroundItemId) return true;
    const colorLower = item.primaryColor.toLowerCase();
    for (const exc of colorExclusions) {
      if (exc && colorLower.includes(exc.toLowerCase())) return false;
    }
    return true;
  });

  // 3. Weather Filter
  const temp = weather ? weather.temperatureC : 20;
  const isRaining = weather ? weather.isRaining : false;
  const weatherFiltered = filterItemsForWeather(filteredWardrobe, temp, isRaining);

  // Group garments by category
  const tops = weatherFiltered.filter((i) => i.category === "TOP");
  const bottoms = weatherFiltered.filter((i) => i.category === "BOTTOM");
  const dresses = weatherFiltered.filter((i) => i.category === "DRESS");
  const shoes = weatherFiltered.filter((i) => i.category === "SHOES");
  const outerwears = weatherFiltered.filter((i) => i.category === "OUTERWEAR");
  const bags = weatherFiltered.filter((i) => i.category === "BAG");
  const accessories = weatherFiltered.filter((i) => i.category === "ACCESSORY");

  // Fallbacks if weather filters were too aggressive
  const effectiveTops = tops.length > 0 ? tops : wardrobe.filter((i) => i.category === "TOP");
  const effectiveBottoms = bottoms.length > 0 ? bottoms : wardrobe.filter((i) => i.category === "BOTTOM");
  const effectiveShoes = shoes.length > 0 ? shoes : wardrobe.filter((i) => i.category === "SHOES");
  const effectiveOuterwears = outerwears.length > 0 ? outerwears : wardrobe.filter((i) => i.category === "OUTERWEAR");
  const effectiveBags = bags.length > 0 ? bags : wardrobe.filter((i) => i.category === "BAG");
  const effectiveAccessories = accessories.length > 0 ? accessories : wardrobe.filter((i) => i.category === "ACCESSORY");

  // Seeded shuffle of individual categories so regenerations rotate through items fairly
  const shuffledTops = seededShuffle(effectiveTops, seed);
  const shuffledBottoms = seededShuffle(effectiveBottoms, seed + 101);
  const shuffledShoes = seededShuffle(effectiveShoes, seed + 202);
  const shuffledOuterwears = seededShuffle(effectiveOuterwears, seed + 303);

  interface CandidateOutfit {
    items: StylistItem[];
    score: number;
    sortKey: number;
    colorNote: string;
    patternNote: string;
    isIdenticalToCurrent: boolean;
  }

  const candidates: CandidateOutfit[] = [];

  // Helper to evaluate a combination
  const evaluateCombination = (combo: StylistItem[]): CandidateOutfit | null => {
    // Check if buildAroundItemId is respected
    if (buildAroundItemId && !combo.some((i) => i.id === buildAroundItemId)) {
      return null;
    }

    // Check if locked items are respected
    if (lockedItemIds.length > 0 && !lockedItemIds.every((lid) => combo.some((i) => i.id === lid))) {
      return null;
    }

    const patternEval = evaluatePatternMixing(combo);
    if (!patternEval.passes) return null;

    const colorEval = evaluateColorHarmony(combo);
    const formalityEval = evaluateFormalityHarmony(combo, occasion);

    let baseScore = Math.round(colorEval.score * 0.45 + formalityEval.score * 0.4 + 15);
    if (baseScore > 98) baseScore = 98;
    if (baseScore < 82) baseScore = 82;

    // Check similarity with currently displayed outfit
    const comboIds = new Set(combo.map((i) => i.id));
    const currentIds = new Set(currentOutfitItemIds);
    let overlapCount = 0;
    for (const cid of comboIds) {
      if (currentIds.has(cid)) overlapCount++;
    }
    const isIdenticalToCurrent =
      currentOutfitItemIds.length > 0 &&
      overlapCount === currentOutfitItemIds.length &&
      combo.length === currentOutfitItemIds.length;

    // Calculate sort key:
    // 1. Demote identical to current outfit so new looks always lead
    // 2. Add slight random jitter (+/- 2.5) based on seed so ties shuffle naturally
    // 3. Reward combinations with diversity
    let sortKey = baseScore;
    if (isIdenticalToCurrent) {
      sortKey -= 35; // Strongly prioritize alternative outfits on Regenerate
    } else if (currentOutfitItemIds.length > 0) {
      // Bonus if it provides fresh unlocked items
      sortKey += 3;
    }

    // Pseudo-random tie-breaker
    const pseudoRandom = ((seed % 97) + candidates.length * 17) % 7;
    sortKey += (pseudoRandom - 3.5);

    return {
      items: combo,
      score: baseScore,
      sortKey,
      colorNote: colorEval.explanation,
      patternNote: patternEval.notes,
      isIdenticalToCurrent,
    };
  };

  // Generate Combinations:
  // Case A: 2-Piece Core (Top + Bottom + Shoes) — both unlayered and layered with Outerwear
  for (const t of shuffledTops) {
    for (const b of shuffledBottoms) {
      for (const s of shuffledShoes) {
        // Core look (Clean 3-piece)
        const coreCombo = [t, b, s];
        if (effectiveAccessories.length > 0 && candidates.length % 3 === 0) {
          coreCombo.push(effectiveAccessories[candidates.length % effectiveAccessories.length]);
        }
        if (effectiveBags.length > 0 && candidates.length % 4 === 0) {
          coreCombo.push(effectiveBags[candidates.length % effectiveBags.length]);
        }

        const evalCore = evaluateCombination(coreCombo);
        if (evalCore) {
          candidates.push(evalCore);
        }

        // Layered look (with Outerwear / Overshirt)
        if (shuffledOuterwears.length > 0) {
          for (const ow of shuffledOuterwears) {
            const layeredCombo = [t, b, s, ow];
            const evalLayered = evaluateCombination(layeredCombo);
            if (evalLayered) {
              candidates.push(evalLayered);
            }
          }
        }

        if (candidates.length >= 60) break;
      }
      if (candidates.length >= 60) break;
    }
    if (candidates.length >= 60) break;
  }

  // Case B: Dress + Shoes
  if (dresses.length > 0 && candidates.length < 30) {
    const shuffledDresses = seededShuffle(dresses, seed + 404);
    for (const d of shuffledDresses) {
      for (const s of shuffledShoes) {
        const dressCombo = [d, s];
        if (shuffledOuterwears.length > 0) {
          dressCombo.push(shuffledOuterwears[0]);
        }
        if (effectiveBags.length > 0) {
          dressCombo.push(effectiveBags[0]);
        }

        const evalDress = evaluateCombination(dressCombo);
        if (evalDress) {
          candidates.push(evalDress);
        }
      }
    }
  }

  // Sort candidates by sortKey descending
  candidates.sort((a, b) => b.sortKey - a.sortKey);

  // Diverse 4-Outfit Selection:
  // Ensure the top 4 candidates don't just repeat the exact same garments
  const selectedCandidates: CandidateOutfit[] = [];
  const seenCombos = new Set<string>();

  const getComboSignature = (items: StylistItem[]) =>
    items
      .map((i) => i.id)
      .sort()
      .join("|");

  for (const cand of candidates) {
    const sig = getComboSignature(cand.items);
    if (!seenCombos.has(sig)) {
      seenCombos.add(sig);
      selectedCandidates.push(cand);
    }
    if (selectedCandidates.length >= 4) break;
  }

  // Fallback if no combinations passed strict filters
  if (selectedCandidates.length === 0) {
    const rawCombo: StylistItem[] = [];
    if (effectiveTops[0]) rawCombo.push(effectiveTops[0]);
    if (effectiveBottoms[0]) rawCombo.push(effectiveBottoms[0]);
    if (effectiveShoes[0]) rawCombo.push(effectiveShoes[0]);
    if (effectiveOuterwears[0]) rawCombo.push(effectiveOuterwears[0]);

    selectedCandidates.push({
      items: rawCombo,
      score: 88,
      sortKey: 88,
      colorNote: "Clean complementary contrast with neutral base.",
      patternNote: "Balanced solid silhouette.",
      isIdenticalToCurrent: false,
    });
  }

  const results: GeneratedOutfit[] = selectedCandidates.map((cand, idx) => {
    const slots: GeneratedOutfitSlot[] = cand.items.map((it) => ({
      slot: it.category as any,
      item: it,
      isLocked: lockedItemIds.includes(it.id) || it.id === buildAroundItemId,
    }));

    const hasOuterwear = cand.items.some((it) => it.category === "OUTERWEAR");
    const hasDress = cand.items.some((it) => it.category === "DRESS");
    const topItem = cand.items.find((it) => it.category === "TOP");
    const isTShirt =
      topItem &&
      (topItem.subcategory.toLowerCase().includes("t-shirt") ||
        topItem.subcategory.toLowerCase().includes("tee") ||
        topItem.name.toLowerCase().includes("t-shirt") ||
        topItem.name.toLowerCase().includes("tee"));

    // Select dynamic titles based strictly on garments present
    let titleOptions: string[];
    if (hasOuterwear) {
      titleOptions = [
        `Effortless Layered Composition`,
        `The Layered ${occasion} Silhouette`,
        `Refined Dimensional Overcoat Edit`,
        `Modern Textured Layering`,
        `The Tailored ${occasion} Ensemble`,
      ];
    } else if (hasDress) {
      titleOptions = [
        `The Statement ${occasion} Dress`,
        `Curated One-Piece Silhouette`,
        `Refined ${mood} Minimalist`,
        `The Elegant ${occasion} Edit`,
      ];
    } else if (isTShirt) {
      titleOptions = [
        `Elevated Casual T-Shirt Uniform`,
        `The Modern Tee & Tailored Line`,
        `Refined ${mood} Minimalist`,
        `Curated Contemporary Two-Piece`,
        `The Tailored ${occasion} Edit`,
        `Clean Essential Contrast`,
      ];
    } else {
      titleOptions = [
        `The Tailored ${occasion} Edit`,
        `Refined ${mood} Ensemble`,
        `Contemporary Silhouette in Neutral`,
        `Curated Modern Minimalist`,
        `Signature Two-Piece Line`,
        `Essential Modern Classic`,
      ];
    }

    const outfitTitle = titleOptions[idx % titleOptions.length];

    const weatherNote = weather
      ? `Calibrated for ${weather.temperatureC}°C (${weather.condition}).`
      : "Adapted for mild transitional weather.";

    const stylingText = hasOuterwear
      ? `${cand.colorNote} ${cand.patternNote} Layered balance calibrated specifically for a ${gender === "female" ? "chic feminine" : "tailored masculine"} ${occasion.toLowerCase()} setting.`
      : `${cand.colorNote} ${cand.patternNote} Clean modern two-piece architecture tailored for a ${gender === "female" ? "contemporary womenswear" : "refined menswear"} ${occasion.toLowerCase()} setting.`;

    const proportionText = hasOuterwear
      ? gender === "female"
        ? "Fluid outerwear drape counterbalanced by tailored foundational lines."
        : "Structured masculine outerwear counterbalancing a tailored line."
      : isTShirt
      ? gender === "female"
        ? "Clean drape of the tee paired with balanced fluid trouser proportions."
        : "Clean drape of the tee paired with balanced structured trousers."
      : gender === "female"
      ? "Elegant elongated silhouette accentuating clean waistline and fluid drape."
      : "Structured masculine shoulder line balanced by tailored trouser taper.";

    return {
      id: `outfit_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
      name: outfitTitle,
      occasion,
      weatherSuitability: weatherNote,
      confidenceScore: cand.score,
      stylingExplanation: stylingText,
      colorHarmony: cand.colorNote,
      proportionNote: proportionText,
      items: slots,
    };
  });

  // If OpenRouter is available, asynchronously enrich the #1 featured outfit with high-fashion AI reasoning
  if (results.length > 0 && isOpenRouterConfigured()) {
    try {
      const topOutfit = results[0];
      const aiAnalysis = await generateStylistAnalysisWithOpenRouter({
        items: topOutfit.items.map((s) => ({
          slot: s.slot,
          name: s.item.name,
          category: s.item.category,
          primaryColor: s.item.primaryColor,
        })),
        occasion,
        weather: weather ? { temperatureC: weather.temperatureC, condition: weather.condition } : null,
        mood,
        gender,
      });

      if (aiAnalysis) {
        topOutfit.stylingExplanation = aiAnalysis.stylingExplanation;
        topOutfit.colorHarmony = aiAnalysis.colorHarmony;
        topOutfit.proportionNote = aiAnalysis.proportionNote;
        topOutfit.confidenceScore = aiAnalysis.confidenceScore;
      }
    } catch (err) {
      console.warn("[Stylist AI] OpenRouter enrichment skipped:", err);
    }
  }

  return {
    success: true,
    outfits: results,
  };
}
