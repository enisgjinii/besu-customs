export type PrintingMethod = "sublimated" | "embroidered";

export interface PriceConfig {
  sublimated: number;
  embroidered?: number;
}

// Updated pricing based on user specifications:
// Basketball: Jersey $35/$45, Jersey+Shorts $49/$69
// Baseball: Jersey $45/$55, Jersey+Pants $80/$100
// Volleyball/Soccer/Flag Football: Jersey $35, Jersey+Shorts $49
// Backpacks $50, Duffles $65
export const PRICING_RULES: Record<string, PriceConfig> = {
  // Basketball - Jersey only (shooting shirts etc)
  "basketball-shirt-short": { sublimated: 35, embroidered: 45 },
  "basketball-shirt-long": { sublimated: 35, embroidered: 45 },
  "basketball-shirt-hoodie": { sublimated: 35, embroidered: 45 },

  // Basketball - Jersey WITH Shorts (sets)
  "basketball-jersey": { sublimated: 49, embroidered: 69 },
  "basketball-top-long": { sublimated: 49, embroidered: 69 },

  // Baseball - Jersey only
  "baseball-jersey": { sublimated: 45, embroidered: 55 },
  "baseball-caps": { sublimated: 20 },

  // Baseball - Jersey WITH Pants (set - needs new product ID if exists)
  "baseball-jersey-pants": { sublimated: 80, embroidered: 100 },
  "baseball-pants": { sublimated: 35, embroidered: 45 },

  // Volleyball - Jersey only
  "volleyball-short": { sublimated: 35 },
  "volleyball-long": { sublimated: 35 },
  "volleyball-spandex": { sublimated: 35 },
  "volleyball-spandex-4": { sublimated: 35 },
  "volleyball-spandex-alt": { sublimated: 35 },

  // Volleyball - Jersey WITH Shorts (set - needs new product ID if exists)
  "volleyball-jersey-shorts": { sublimated: 49 },

  // Soccer - Jersey only
  "soccer-crew": { sublimated: 35 },
  "soccer-vneck": { sublimated: 35 },

  // Soccer - Jersey WITH Shorts (set - needs new product ID if exists)
  "soccer-jersey-shorts": { sublimated: 49 },

  // Flag Football - Jersey only
  "flag-football-hoodie": { sublimated: 35 },

  // Flag Football - Jersey WITH Shorts (set - needs new product ID if exists)
  "flag-football-jersey-shorts": { sublimated: 49 },

  // Track & Field
  "track-compression": { sublimated: 35 },
  "track-mid-shorts": { sublimated: 35 },
  "track-split-shorts": { sublimated: 35 },
  "track-crop": { sublimated: 35 },
  "track-short-sleeve": { sublimated: 35 },
  "track-tank": { sublimated: 35 },

  // Bags
  "backpack": { sublimated: 50 },
  "duffle-bag": { sublimated: 65 },

  // Generic Apparel
  "hoodie": { sublimated: 45 },
  "long-pants": { sublimated: 45 },
  "polo-short": { sublimated: 35 },
  "polo-long": { sublimated: 35 },
  "half-short": { sublimated: 30 },
  "standard-bottom": { sublimated: 30 },

  // Defaults fallback
  "default": { sublimated: 35, embroidered: 45 }
};

export function getProductPrice(productId: string | null, method: PrintingMethod): number {
  if (!productId) return 0;

  // Debug logging
  console.log("[PRICING] productId:", productId, "method:", method);

  // 1. Try exact match first
  if (PRICING_RULES[productId]) {
    const config = PRICING_RULES[productId];
    const price = method === "embroidered" ? (config.embroidered ?? config.sublimated) : config.sublimated;
    console.log("[PRICING] ✓ Exact match:", productId, "-> $" + price);
    return price;
  }

  // 2. Normalize ID to kebab-case for matching
  const idKey = productId.toLowerCase().trim().replace(/\s+/g, "-");
  console.log("[PRICING] Normalized:", idKey);

  if (PRICING_RULES[idKey]) {
    const config = PRICING_RULES[idKey];
    const price = method === "embroidered" ? (config.embroidered ?? config.sublimated) : config.sublimated;
    console.log("[PRICING] ✓ Normalized match:", idKey, "-> $" + price);
    return price;
  }

  // 3. Partial match: check if normalized ID contains any of our keys
  const sortedKeys = Object.keys(PRICING_RULES)
    .filter(key => key !== "default")
    .sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (idKey.includes(key)) {
      const config = PRICING_RULES[key];
      const price = method === "embroidered" ? (config.embroidered ?? config.sublimated) : config.sublimated;
      console.log("[PRICING] ✓ Partial match:", key, "in", idKey, "-> $" + price);
      return price;
    }
  }

  // 4. Default fallback
  console.log("[PRICING] ⚠ No match, using default");
  const defaultConfig = PRICING_RULES["default"];
  const price = method === "embroidered"
    ? defaultConfig.embroidered ?? defaultConfig.sublimated
    : defaultConfig.sublimated;
  console.log("[PRICING] Default price: $" + price);
  return price;
}

export function calculateTotalPrice(
  productId: string | null,
  method: PrintingMethod,
  quantity: number
): number {
  const unitPrice = getProductPrice(productId, method);
  return unitPrice * quantity;
}

// Helper to check if a product supports embroidery
export function supportsEmbroidery(productId: string | null): boolean {
  if (!productId) return false;

  // Check exact rule first
  if (PRICING_RULES[productId]) {
    return PRICING_RULES[productId].embroidered !== undefined;
  }

  const idKey = productId.toLowerCase().trim().replace(/\s+/g, "-");

  if (PRICING_RULES[idKey]) {
    return PRICING_RULES[idKey].embroidered !== undefined;
  }

  // Partial check
  for (const key of Object.keys(PRICING_RULES)) {
    if (key !== "default" && idKey.includes(key)) {
      return PRICING_RULES[key].embroidered !== undefined;
    }
  }

  // Fallback exclusions (sublimation only categories)
  if (idKey.includes("volleyball") || idKey.includes("soccer") || idKey.includes("flag") || idKey.includes("track") || idKey.includes("bag")) {
    return false;
  }

  return true;
}
