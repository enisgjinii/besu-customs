import { PRICING_RULES } from "@/lib/pricing";
import type { GarmentType } from "./types";

export interface DesignerProduct {
  id: string;
  sport: string;
  garmentType: GarmentType;
  name: string;
  description: string;
  handle: string;
  /** Sublimated unit price when available. */
  price: number | null;
  /** Short visual cue for the product card. */
  accent: string;
}

function priceOf(...handles: string[]) {
  const total = handles.reduce((sum, handle) => sum + (PRICING_RULES[handle]?.sublimated || 0), 0);
  return total > 0 ? total : null;
}

/**
 * Customer-facing product catalog for the 2D designer.
 * Handles align with Shopify variant mapping in shopify-service.
 */
export const DESIGNER_PRODUCTS: DesignerProduct[] = [
  {
    id: "basketball-uniform",
    sport: "Basketball",
    garmentType: "uniform",
    name: "Basketball Uniform",
    description: "Coordinated jersey + shorts kit for full-team sublimation.",
    handle: "basketball-jersey",
    price: priceOf("basketball-jersey"),
    accent: "#101820",
  },
  {
    id: "basketball-jersey",
    sport: "Basketball",
    garmentType: "jersey",
    name: "Basketball Jersey",
    description: "Sleeveless game jersey with chest team name and back number.",
    handle: "basketball-jersey",
    price: priceOf("basketball-jersey"),
    accent: "#0033A0",
  },
  {
    id: "basketball-shorts",
    sport: "Basketball",
    garmentType: "shorts",
    name: "Basketball Shorts",
    description: "Matching half-short bottoms with shared kit graphics.",
    handle: "half-short",
    price: priceOf("half-short"),
    accent: "#D4AF37",
  },
  {
    id: "soccer-uniform",
    sport: "Soccer",
    garmentType: "uniform",
    name: "Soccer Uniform",
    description: "V-neck jersey and standard bottoms as a coordinated set.",
    handle: "soccer-vneck",
    price: priceOf("soccer-vneck"),
    accent: "#006341",
  },
  {
    id: "volleyball-uniform",
    sport: "Volleyball",
    garmentType: "uniform",
    name: "Volleyball Uniform",
    description: "Short-sleeve top and spandex bottoms for court play.",
    handle: "volleyball-short",
    price: priceOf("volleyball-short"),
    accent: "#C8102E",
  },
  {
    id: "baseball-jersey",
    sport: "Baseball",
    garmentType: "jersey",
    name: "Baseball Jersey",
    description: "Button-front baseball jersey with front team name overlay.",
    handle: "baseball-jersey",
    price: priceOf("baseball-jersey"),
    accent: "#FF6A00",
  },
  {
    id: "flag-football-uniform",
    sport: "Flag Football",
    garmentType: "uniform",
    name: "Flag Football Kit",
    description: "Hooded top and bottoms for flag football programs.",
    handle: "flag-football-hoodie",
    price: priceOf("flag-football-hoodie"),
    accent: "#6A1B9A",
  },
];
export function getDesignerProduct(id: string): DesignerProduct | undefined {
  return DESIGNER_PRODUCTS.find((product) => product.id === id);
}

export function formatProductPrice(price: number | null): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return "Quote on request";
  return `From $${price.toFixed(0)}`;
}
