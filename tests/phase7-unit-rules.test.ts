import {
  validateWardrobeSufficiency,
  evaluateColorHarmony,
  evaluatePatternMixing,
  evaluateFormalityHarmony,
  filterItemsForWeather,
  isNeutral,
  NEUTRAL_COLORS,
  StylistItem,
} from "../src/lib/stylist/rules";
import { ClothingTagSchema } from "../src/lib/ai/tagger";
import { z } from "zod";

export async function runUnitTests() {
  console.log("--------------------------------------------------");
  console.log("1. UNIT TESTS: FASHION RULES & JSON SCHEMA");
  console.log("--------------------------------------------------");

  let pass = 0;
  let total = 0;
  const assert = (condition: boolean, name: string) => {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      pass++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      throw new Error(`Failed: ${name}`);
    }
  };

  // 1. Color Theory Heuristics
  assert(isNeutral("Navy Blue") === true, "Navy Blue recognized as neutral anchor");
  assert(isNeutral("Charcoal Grey") === true, "Charcoal recognized as neutral anchor");
  assert(isNeutral("Oatmeal Beige") === true, "Oatmeal Beige recognized as neutral anchor");
  assert(isNeutral("Electric Neon Lime") === false, "Neon Lime recognized as non-neutral");

  // 2. Pattern Mixing
  const baseItem: StylistItem = {
    id: "1",
    name: "Base",
    category: "TOP",
    subcategory: "T-Shirt",
    primaryColor: "White",
    primaryColorHex: "#ffffff",
    pattern: "Solid",
    material: "Cotton",
    fit: "Regular",
    season: "Summer",
    formality: "Casual",
    processedImageUrl: "",
    thumbnailUrl: "",
  };

  const solidPants: StylistItem = { ...baseItem, id: "2", category: "BOTTOM", pattern: "Solid" };
  const stripedPants: StylistItem = { ...baseItem, id: "3", category: "BOTTOM", pattern: "Striped" };
  const floralTop: StylistItem = { ...baseItem, id: "4", pattern: "Floral" };

  const solidEval = evaluatePatternMixing([baseItem, solidPants]);
  assert(solidEval.passes === true, "Solid + Solid pattern mixing passes");

  const singlePatternEval = evaluatePatternMixing([floralTop, solidPants]);
  assert(singlePatternEval.passes === true, "Bold Floral + Solid pants passes");

  const clashEval = evaluatePatternMixing([floralTop, stripedPants]);
  assert(clashEval.passes === false, "Floral + Striped clash correctly rejected");

  // 3. Formality Cohesion
  const gymShorts: StylistItem = { ...baseItem, id: "5", category: "BOTTOM", formality: "Athletic" };
  const tuxedoJacket: StylistItem = { ...baseItem, id: "6", category: "OUTERWEAR", formality: "Formal" };
  const smartChinos: StylistItem = { ...baseItem, id: "7", category: "BOTTOM", formality: "Smart Casual" };
  const casualTee: StylistItem = { ...baseItem, id: "8", formality: "Casual" };

  const extremeDiff = evaluateFormalityHarmony([gymShorts, tuxedoJacket]);
  assert(extremeDiff.score <= 60, "Athletic with Formal penalized heavily (score <= 60)");

  const harmoniousDiff = evaluateFormalityHarmony([casualTee, smartChinos]);
  assert(harmoniousDiff.score >= 88, "Casual with Smart Casual scores high (score >= 88)");

  // 4. Weather Thresholds
  const summerLinen: StylistItem = { ...baseItem, id: "9", season: "Summer" };
  const winterCoat: StylistItem = { ...baseItem, id: "10", category: "OUTERWEAR", season: "Winter" };

  const filteredForChilly = filterItemsForWeather([summerLinen, winterCoat], 8, false);
  assert(!filteredForChilly.some((i) => i.id === "9"), "Summer linen excluded in 8°C cold weather");
  assert(filteredForChilly.some((i) => i.id === "10"), "Winter coat retained in 8°C cold weather");

  const filteredForHot = filterItemsForWeather([summerLinen, winterCoat], 30, false);
  assert(!filteredForHot.some((i) => i.id === "10"), "Winter coat excluded in 30°C heat");
  assert(filteredForHot.some((i) => i.id === "9"), "Summer linen retained in 30°C heat");

  // 5. JSON Schema Validation (Zod)
  const validJson = {
    name: "Classic Charcoal Wool Overcoat",
    category: "OUTERWEAR",
    subcategory: "Tailored Coat",
    primaryColor: "Charcoal",
    primaryColorHex: "#374151",
    pattern: "Solid",
    material: "Wool",
    fit: "Tailored",
    season: "Winter",
    formality: "Smart Casual",
    faceDetected: false,
    stylingNotes: "Structured shoulders pair cleanly over knits.",
  };

  const parsedValid = ClothingTagSchema.safeParse(validJson);
  assert(parsedValid.success === true, "Valid garment JSON passes Zod schema validation");

  // Malformed Hex code check
  const badHex = { ...validJson, primaryColorHex: "blue_not_hex" };
  const parsedBadHex = ClothingTagSchema.safeParse(badHex);
  assert(parsedBadHex.success === false, "Malformed hex code correctly rejected by Zod schema");

  // Invalid Category Enum check
  const badCategory = { ...validJson, category: "INVALID_SPACESUIT" };
  const parsedBadCategory = ClothingTagSchema.safeParse(badCategory);
  assert(parsedBadCategory.success === false, "Invalid category enum correctly rejected by Zod schema");

  console.log(`\nUnit Tests Result: ${pass}/${total} Passed\n`);
  return { pass, total };
}
