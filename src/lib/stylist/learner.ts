import { prisma } from "../prisma";

export interface UserTasteProfile {
  likedColorPairs: Array<[string, string]>;
  dislikedColorPairs: Array<[string, string]>;
  favoriteSubcategories: string[];
  dislikedCategories: string[];
  preferredFormalities: string[];
}

/**
 * Computes a user's evolving taste profile based on liked/disliked outfits and saves.
 */
export async function computeUserTasteProfile(userId: string): Promise<UserTasteProfile> {
  const feedbacks = await prisma.outfitFeedback.findMany({
    where: { userId },
    include: {
      outfit: {
        include: {
          items: {
            include: { clothingItem: true },
          },
        },
      },
    },
  });

  const likedPairs: Array<[string, string]> = [];
  const dislikedPairs: Array<[string, string]> = [];
  const subcategoryWeights: Record<string, number> = {};
  const formalityWeights: Record<string, number> = {};

  for (const fb of feedbacks) {
    const items = fb.outfit.items.map((i) => i.clothingItem);
    const weight = fb.liked ? 1 : -1;

    // Track subcategory and formality frequency
    for (const item of items) {
      subcategoryWeights[item.subcategory] = (subcategoryWeights[item.subcategory] || 0) + weight;
      formalityWeights[item.formality] = (formalityWeights[item.formality] || 0) + weight;
    }

    // Track color pairing affinity
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const c1 = items[i].primaryColor.toLowerCase();
        const c2 = items[j].primaryColor.toLowerCase();
        if (c1 !== c2) {
          const pair: [string, string] = [c1, c2].sort() as [string, string];
          if (fb.liked) likedPairs.push(pair);
          else dislikedPairs.push(pair);
        }
      }
    }
  }

  const favoriteSubcategories = Object.entries(subcategoryWeights)
    .filter(([_, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([sub]) => sub);

  const preferredFormalities = Object.entries(formalityWeights)
    .filter(([_, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => f);

  return {
    likedColorPairs: likedPairs,
    dislikedColorPairs: dislikedPairs,
    favoriteSubcategories,
    dislikedCategories: [],
    preferredFormalities,
  };
}
