import type { GarmentType, GarmentView } from "./types";

/** Normalized rectangle in template space (0–1 relative to viewBox). */
export interface NormalizedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TemplatePiece = "jersey" | "shorts";

export interface GarmentTemplate {
  id: string;
  piece: TemplatePiece;
  view: GarmentView;
  label: string;
  /** SVG path for silhouette (absolute viewBox units). */
  silhouettePath: string;
  /** Clip path for print artwork (absolute viewBox units). */
  designMaskPath: string;
  viewBox: { minX: number; minY: number; width: number; height: number };
  /** Optional sleeve/side accent paths. */
  accentPaths?: string[];
  bounds: {
    artwork: NormalizedBounds;
    /** Front chest — team name ONLY. Never defined for back templates. */
    teamName?: NormalizedBounds;
    /** Back — player name. */
    playerName?: NormalizedBounds;
    /** Back — player number. */
    number?: NormalizedBounds;
    /** Optional logo / crest zone (front). */
    logo?: NormalizedBounds;
    /** Safe print dashed guide (absolute rect for canvas). */
    safePrint: NormalizedBounds;
  };
}

const CANVAS = { minX: 0, minY: 0, width: 800, height: 800 };

const SLEEVELESS_JERSEY =
  "M245 155 315 80Q335 135 400 150Q465 135 485 80l70 75-30 135 30 360H245l30-360z";
const SLEEVED_JERSEY =
  "M190 155 315 80Q335 135 400 150Q465 135 485 80l125 75 105 105-95 95-50-58 5 353H225l5-353-50 58-95-95z";
const SHORTS_PATH = "M205 185h390l-24 470-145 12-26-242-26 242-145-12z";

function abs(bounds: NormalizedBounds, vb = CANVAS) {
  return {
    x: vb.minX + bounds.x * vb.width,
    y: vb.minY + bounds.y * vb.height,
    width: bounds.width * vb.width,
    height: bounds.height * vb.height,
  };
}

/** Basketball jersey — front (team name + logo on chest). */
const basketballJerseyFront: GarmentTemplate = {
  id: "basketball-jersey-front",
  piece: "jersey",
  view: "front",
  label: "Basketball Jersey · Front",
  silhouettePath: SLEEVELESS_JERSEY,
  designMaskPath: SLEEVELESS_JERSEY,
  viewBox: CANVAS,
  accentPaths: ["M320 82Q336 132 400 145Q464 132 480 82"],
  bounds: {
    artwork: { x: 0.17, y: 0.08, width: 0.66, height: 0.9 },
    teamName: { x: 0.28, y: 0.32, width: 0.44, height: 0.12 },
    logo: { x: 0.38, y: 0.46, width: 0.24, height: 0.18 },
    safePrint: { x: 0.31, y: 0.3, width: 0.38, height: 0.36 },
  },
};

/** Basketball jersey — back (player name + number only; NO team name). */
const basketballJerseyBack: GarmentTemplate = {
  id: "basketball-jersey-back",
  piece: "jersey",
  view: "back",
  label: "Basketball Jersey · Back",
  silhouettePath: SLEEVELESS_JERSEY,
  designMaskPath: SLEEVELESS_JERSEY,
  viewBox: CANVAS,
  accentPaths: ["M320 82Q336 132 400 145Q464 132 480 82"],
  bounds: {
    artwork: { x: 0.17, y: 0.08, width: 0.66, height: 0.9 },
    playerName: { x: 0.28, y: 0.28, width: 0.44, height: 0.1 },
    number: { x: 0.3, y: 0.42, width: 0.4, height: 0.28 },
    safePrint: { x: 0.31, y: 0.3, width: 0.38, height: 0.36 },
  },
};

const basketballShortsFront: GarmentTemplate = {
  id: "basketball-shorts-front",
  piece: "shorts",
  view: "front",
  label: "Basketball Shorts · Front",
  silhouettePath: SHORTS_PATH,
  designMaskPath: SHORTS_PATH,
  viewBox: CANVAS,
  bounds: {
    artwork: { x: 0.22, y: 0.2, width: 0.56, height: 0.65 },
    logo: { x: 0.42, y: 0.28, width: 0.16, height: 0.14 },
    safePrint: { x: 0.29, y: 0.27, width: 0.42, height: 0.48 },
  },
};

const basketballShortsBack: GarmentTemplate = {
  id: "basketball-shorts-back",
  piece: "shorts",
  view: "back",
  label: "Basketball Shorts · Back",
  silhouettePath: SHORTS_PATH,
  designMaskPath: SHORTS_PATH,
  viewBox: CANVAS,
  bounds: {
    artwork: { x: 0.22, y: 0.2, width: 0.56, height: 0.65 },
    safePrint: { x: 0.29, y: 0.27, width: 0.42, height: 0.48 },
  },
};

/** Sleeved jersey variants for non-basketball sports. */
const sleevedJerseyFront: GarmentTemplate = {
  ...basketballJerseyFront,
  id: "sleeved-jersey-front",
  label: "Jersey · Front",
  silhouettePath: SLEEVED_JERSEY,
  designMaskPath: SLEEVED_JERSEY,
};

const sleevedJerseyBack: GarmentTemplate = {
  ...basketballJerseyBack,
  id: "sleeved-jersey-back",
  label: "Jersey · Back",
  silhouettePath: SLEEVED_JERSEY,
  designMaskPath: SLEEVED_JERSEY,
};

export const TEMPLATE_REGISTRY: Record<string, GarmentTemplate> = {
  [basketballJerseyFront.id]: basketballJerseyFront,
  [basketballJerseyBack.id]: basketballJerseyBack,
  [basketballShortsFront.id]: basketballShortsFront,
  [basketballShortsBack.id]: basketballShortsBack,
  [sleevedJerseyFront.id]: sleevedJerseyFront,
  [sleevedJerseyBack.id]: sleevedJerseyBack,
};

export function listTemplates(): GarmentTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

export function getTemplateById(id: string): GarmentTemplate | undefined {
  return TEMPLATE_REGISTRY[id];
}

/**
 * Resolve the active template for sport + piece + view.
 * Coordinates are always template-relative; React must not hardcode print bounds.
 */
export function resolveTemplate(input: {
  sport: string;
  piece: TemplatePiece;
  view: GarmentView;
}): GarmentTemplate {
  const sleeveless = input.sport === "Basketball" || input.sport === "Volleyball";
  if (input.piece === "shorts") {
    return input.view === "front" ? basketballShortsFront : basketballShortsBack;
  }
  if (sleeveless) {
    return input.view === "front" ? basketballJerseyFront : basketballJerseyBack;
  }
  return input.view === "front" ? sleevedJerseyFront : sleevedJerseyBack;
}

/** Pieces to render for a garment selection. */
export function piecesForGarment(garmentType: GarmentType): TemplatePiece[] {
  if (garmentType === "jersey") return ["jersey"];
  if (garmentType === "shorts") return ["shorts"];
  return ["jersey", "shorts"];
}

export function absoluteBounds(template: GarmentTemplate, key: keyof GarmentTemplate["bounds"]) {
  const bounds = template.bounds[key];
  if (!bounds) return null;
  return abs(bounds, template.viewBox);
}

/** Assert front/back typography contract for tests and runtime guards. */
export function assertTypographyContract(template: GarmentTemplate) {
  if (template.view === "front") {
    if (template.piece === "jersey" && !template.bounds.teamName) {
      throw new Error(`${template.id}: front jersey must define teamName bounds.`);
    }
    if (template.bounds.playerName || template.bounds.number) {
      throw new Error(`${template.id}: front templates must not define playerName/number.`);
    }
  }
  if (template.view === "back") {
    if (template.bounds.teamName) {
      throw new Error(`${template.id}: back templates must NEVER define teamName bounds.`);
    }
    if (template.piece === "jersey" && (!template.bounds.playerName || !template.bounds.number)) {
      throw new Error(`${template.id}: back jersey must define playerName and number bounds.`);
    }
  }
}

for (const template of listTemplates()) assertTypographyContract(template);
