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
 * Customer-facing product catalog for the AI designer.
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
    id: "basketball-shooting-shirt",
    sport: "Basketball",
    garmentType: "jersey",
    name: "Shooting Shirt",
    description: "Warm-up / shooting shirt for practice and sideline looks.",
    handle: "basketball-shirt-short",
    price: priceOf("basketball-shirt-short"),
    accent: "#00A3FF",
  },
  {
    id: "soccer-uniform",
    sport: "Soccer",
    garmentType: "uniform",
    name: "Soccer Uniform",
    description: "V-neck jersey and shorts as a coordinated set.",
    handle: "soccer-jersey-shorts",
    price: priceOf("soccer-jersey-shorts"),
    accent: "#006341",
  },
  {
    id: "soccer-jersey",
    sport: "Soccer",
    garmentType: "jersey",
    name: "Soccer Jersey",
    description: "V-neck soccer jersey with team crest zone and number.",
    handle: "soccer-vneck",
    price: priceOf("soccer-vneck"),
    accent: "#0D9488",
  },
  {
    id: "volleyball-uniform",
    sport: "Volleyball",
    garmentType: "uniform",
    name: "Volleyball Uniform",
    description: "Short-sleeve top and spandex bottoms for court play.",
    handle: "volleyball-jersey-shorts",
    price: priceOf("volleyball-jersey-shorts"),
    accent: "#C8102E",
  },
  {
    id: "volleyball-jersey",
    sport: "Volleyball",
    garmentType: "jersey",
    name: "Volleyball Jersey",
    description: "Short-sleeve volleyball jersey for school and club teams.",
    handle: "volleyball-short",
    price: priceOf("volleyball-short"),
    accent: "#E11D8F",
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
    id: "baseball-uniform",
    sport: "Baseball",
    garmentType: "uniform",
    name: "Baseball Uniform",
    description: "Jersey + pants set for full baseball programs.",
    handle: "baseball-jersey-pants",
    price: priceOf("baseball-jersey-pants"),
    accent: "#C45C26",
  },
  {
    id: "flag-football-uniform",
    sport: "Flag Football",
    garmentType: "uniform",
    name: "Flag Football Kit",
    description: "Hooded top and bottoms for flag football programs.",
    handle: "flag-football-jersey-shorts",
    price: priceOf("flag-football-jersey-shorts"),
    accent: "#6A1B9A",
  },
  {
    id: "track-tank",
    sport: "Track",
    garmentType: "jersey",
    name: "Track Tank",
    description: "Lightweight track tank for meets and training.",
    handle: "track-tank",
    price: priceOf("track-tank"),
    accent: "#5B8C5A",
  },
  {
    id: "track-uniform",
    sport: "Track",
    garmentType: "uniform",
    name: "Track Kit",
    description: "Tank + mid shorts for track and field programs.",
    handle: "track-mid-shorts",
    price: priceOf("track-tank", "track-mid-shorts"),
    accent: "#2F6B4F",
  },
  {
    id: "team-hoodie",
    sport: "Training",
    garmentType: "jersey",
    name: "Team Hoodie",
    description: "Custom team hoodie for travel and warm-ups.",
    handle: "hoodie",
    price: priceOf("hoodie"),
    accent: "#334155",
  },
  {
    id: "team-polo",
    sport: "Training",
    garmentType: "jersey",
    name: "Team Polo",
    description: "Short-sleeve polo for coaches and staff kits.",
    handle: "polo-short",
    price: priceOf("polo-short"),
    accent: "#1D4ED8",
  },
];

export function getDesignerProduct(id: string): DesignerProduct | undefined {
  return DESIGNER_PRODUCTS.find((product) => product.id === id);
}

export function formatProductPrice(price: number | null): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return "Quote on request";
  return `From $${price.toFixed(0)}`;
}

export function groupDesignerProductsBySport() {
  const groups = new Map<string, DesignerProduct[]>();
  for (const product of DESIGNER_PRODUCTS) {
    const list = groups.get(product.sport) || [];
    list.push(product);
    groups.set(product.sport, list);
  }
  return [...groups.entries()];
}
