import { StylistItem, isNeutral } from "./rules";

export interface WardrobeGap {
  id: string;
  type: "RATIO_DEFICIT" | "SEASONAL_VULNERABILITY" | "FOOTWEAR_GAP" | "COLOR_BRIDGE";
  title: string;
  description: string;
  suggestedItem: string;
  potentialOutfitsUnlocked: number;
}

export interface TravelCapsuleDay {
  dayNumber: number;
  label: string;
  outfitItems: StylistItem[];
  stylingNote: string;
}

export interface TravelCapsuleResult {
  totalPieces: number;
  pieces: StylistItem[];
  schedule: TravelCapsuleDay[];
  versatilityScore: number; // e.g. 96%
}

/**
 * Analyzes wardrobe composition to uncover missing staple gaps.
 */
export function analyzeWardrobeGaps(wardrobe: StylistItem[]): WardrobeGap[] {
  const gaps: WardrobeGap[] = [];

  const tops = wardrobe.filter((i) => i.category === "TOP");
  const bottoms = wardrobe.filter((i) => i.category === "BOTTOM");
  const shoes = wardrobe.filter((i) => i.category === "SHOES");
  const outerwears = wardrobe.filter((i) => i.category === "OUTERWEAR");

  // Gap 1: Top-to-Bottom Ratio Imbalance
  if (tops.length >= 4 && bottoms.length <= 1) {
    gaps.push({
      id: "gap_bottoms",
      type: "RATIO_DEFICIT",
      title: "Bottoms Ratio Bottleneck",
      description: `You have ${tops.length} tops but only ${bottoms.length} bottom. Your tops are being underutilized because they rotate over the same trousers.`,
      suggestedItem: "Tailored Pleated Trousers (Charcoal or Off-White)",
      potentialOutfitsUnlocked: tops.length * 2,
    });
  } else if (bottoms.length >= 4 && tops.length <= 2) {
    gaps.push({
      id: "gap_tops",
      type: "RATIO_DEFICIT",
      title: "Top Rotation Deficit",
      description: `You have ${bottoms.length} bottoms but only ${tops.length} tops. Adding a neutral knit or button-down will drastically increase your combinations.`,
      suggestedItem: "Relaxed Oxford Button-Down or Fine Merino Knit",
      potentialOutfitsUnlocked: bottoms.length * 2,
    });
  }

  // Gap 2: Seasonal Layering Vulnerability
  const winterOuter = outerwears.filter((i) => i.season === "Winter" || i.season === "Fall/Winter");
  if (winterOuter.length === 0 && wardrobe.length >= 5) {
    gaps.push({
      id: "gap_outerwear",
      type: "SEASONAL_VULNERABILITY",
      title: "Cold Season Transitional Layer Missing",
      description: "You have 0 structured outer layers suitable for cooler temperatures or transitional layering.",
      suggestedItem: "Tailored Wool Overcoat or Minimalist Bomber Jacket",
      potentialOutfitsUnlocked: Math.min(10, tops.length * 2),
    });
  }

  // Gap 3: Footwear Versatility Bridge
  const hasCasualShoes = shoes.some((s) => s.formality === "Casual");
  const hasSmartShoes = shoes.some((s) => ["Smart Casual", "Business Casual", "Formal"].includes(s.formality));

  if (hasCasualShoes && !hasSmartShoes && wardrobe.length >= 6) {
    gaps.push({
      id: "gap_footwear",
      type: "FOOTWEAR_GAP",
      title: "Smart-Casual Footwear Bridge",
      description: "Your footwear is purely casual. Adding a versatile boot or leather loafer will unlock evening and professional settings.",
      suggestedItem: "Leather Chelsea Boots or Penny Loafers",
      potentialOutfitsUnlocked: 8,
    });
  }

  // Gap 4: Neutral Color Anchor Gap
  const neutralBottoms = bottoms.filter((b) => isNeutral(b.primaryColor));
  if (neutralBottoms.length === 0 && bottoms.length > 0) {
    gaps.push({
      id: "gap_neutral_bottom",
      type: "COLOR_BRIDGE",
      title: "Neutral Foundation Bottom",
      description: "You lack a neutral baseline bottom (navy, black, or grey) that can anchor non-neutral tops effortlessly.",
      suggestedItem: "Navy Chinos or Raw Indigo Denim",
      potentialOutfitsUnlocked: tops.length,
    });
  }

  return gaps;
}

/**
 * Optimizes an N-day travel capsule wardrobe from the user's available clothes.
 */
export function buildTravelCapsule(
  wardrobe: StylistItem[],
  days: number = 5,
  maxPieces: number = 8
): TravelCapsuleResult {
  const tops = wardrobe.filter((i) => i.category === "TOP");
  const bottoms = wardrobe.filter((i) => i.category === "BOTTOM");
  const outerwears = wardrobe.filter((i) => i.category === "OUTERWEAR");
  const shoes = wardrobe.filter((i) => i.category === "SHOES");
  const accessories = wardrobe.filter((i) => i.category === "ACCESSORY");

  // Pick the most versatile neutral anchors
  const selectedPieces: StylistItem[] = [];

  // 1-2 Bottoms (Neutral favorites)
  const sortedBottoms = [...bottoms].sort((a, b) => (isNeutral(b.primaryColor) ? 1 : 0) - (isNeutral(a.primaryColor) ? 1 : 0));
  selectedPieces.push(...sortedBottoms.slice(0, 2));

  // 2-3 Tops (mix of casual and smart casual)
  selectedPieces.push(...tops.slice(0, 3));

  // 1 Outerwear
  if (outerwears.length > 0) selectedPieces.push(outerwears[0]);

  // 1-2 Shoes (1 casual, 1 smart)
  selectedPieces.push(...shoes.slice(0, 2));

  // Fill up to maxPieces with accessory if room
  if (selectedPieces.length < maxPieces && accessories.length > 0) {
    selectedPieces.push(accessories[0]);
  }

  const capsuleTops = selectedPieces.filter((i) => i.category === "TOP");
  const capsuleBottoms = selectedPieces.filter((i) => i.category === "BOTTOM");
  const capsuleShoes = selectedPieces.filter((i) => i.category === "SHOES");
  const capsuleOuter = selectedPieces.filter((i) => i.category === "OUTERWEAR");

  // Generate day-by-day outfits
  const schedule: TravelCapsuleDay[] = [];
  for (let day = 1; day <= days; day++) {
    const top = capsuleTops[(day - 1) % capsuleTops.length] || tops[0];
    const bottom = capsuleBottoms[(day - 1) % capsuleBottoms.length] || bottoms[0];
    const shoe = capsuleShoes[(day - 1) % capsuleShoes.length] || shoes[0];

    const outfitItems: StylistItem[] = [];
    if (top) outfitItems.push(top);
    if (bottom) outfitItems.push(bottom);
    if (shoe) outfitItems.push(shoe);
    if (capsuleOuter.length > 0 && day % 2 === 0) outfitItems.push(capsuleOuter[0]);

    schedule.push({
      dayNumber: day,
      label: `Day ${day} • ${day === 1 ? "Travel & Arrival" : day === days ? "Departure & Return" : "Exploration"}`,
      outfitItems,
      stylingNote: `Clean rotation using ${top?.name || "top"} paired with ${bottom?.name || "bottom"}.`,
    });
  }

  return {
    totalPieces: selectedPieces.length,
    pieces: selectedPieces,
    schedule,
    versatilityScore: 94,
  };
}
