export type PrintingMethod = "sublimated" | "embroidered";

export interface PriceConfig {
  sublimated: number;
  embroidered?: number;
}

// Map of partial product ID matches to their price configuration
// Keys are matched against product.id.toLowerCase()
// We use spaced keys to match normalized IDs (dashes replaced by spaces)
export const PRICING_RULES: Record<string, PriceConfig> = {
  // Basketball
  "basketball jersey and shorts": { sublimated: 49, embroidered: 69 },
  "basketball jersey top and long shorts": { sublimated: 49, embroidered: 69 },
  "basketball shooting shirt": { sublimated: 35, embroidered: 45 },
  "basketball jersey": { sublimated: 35, embroidered: 45 }, // Fallback for just jersey

  // Baseball
  "baseball jersey": { sublimated: 45, embroidered: 55 },
  "baseball pants": { sublimated: 35, embroidered: 45 }, // Standalone pants - estimated
  "baseball caps": { sublimated: 20 }, // Cap estimate

  // Volleyball
  "volleyball": { sublimated: 35 },

  // Soccer
  "soccer jersey": { sublimated: 35 },
  "soccer": { sublimated: 35 },

  // Flag Football
  "flag football": { sublimated: 35 },

  // Track & Field
  "track and field": { sublimated: 35 },

  // Bags
  "backpack": { sublimated: 50 },
  "duffle bag": { sublimated: 65 },
  "duffle": { sublimated: 65 },

  // Generic Apparel
  "hoodie": { sublimated: 45 },
  "long pants": { sublimated: 45 },
  "polo": { sublimated: 35 },
  "short": { sublimated: 30 },

  // Defaults
  "default": { sublimated: 35, embroidered: 45 }
};

export function getProductPrice(productId: string | null, method: PrintingMethod): number {
  if (!productId) return 0;

  // Normalize ID: lowercase and replace dashes with spaces to handle both formats
  // e.g. "Basketball-Jersey" -> "basketball jersey"
  const id = productId.toLowerCase().replace(/-/g, " ");

  // Sort rules by key length (descending) to match specific rules first
  const sortedKeys = Object.keys(PRICING_RULES)
    .filter(key => key !== "default")
    .sort((a, b) => b.length - a.length);

  let config = PRICING_RULES["default"];

  // Find specific rule
  for (const key of sortedKeys) {
    if (id.includes(key)) {
      config = PRICING_RULES[key];
      break;
    }
  }

  // Check if embroidered is allowed for this product
  if (method === "embroidered") {
    return config.embroidered ?? config.sublimated;
  }

  return config.sublimated;
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
  const id = productId.toLowerCase().replace(/-/g, " ");

  // Explicitly allowing embroidery ONLY for categories with embroidered pricing
  for (const [key, rule] of Object.entries(PRICING_RULES)) {
    if (key === "default") continue;
    if (id.includes(key)) {
      return rule.embroidered !== undefined;
    }
  }

  // Fallback exclusions
  if (id.includes("volleyball") || id.includes("soccer") || id.includes("flag football") || id.includes("bag") || id.includes("pack") || id.includes("track")) {
    return false;
  }

  return true;
}
