import type { DesignerColors, GarmentType, GarmentView } from "./types";

export type GenerationMode = "generate" | "refine" | "color_variation";

export interface GenerateDesignInput {
  garmentType: GarmentType;
  designDescription: string;
  teamName: string;
  colors?: DesignerColors;
  style: string;
  view: GarmentView;
  sport?: string;
  mode?: GenerationMode;
  correction?: string;
  previousAssetUrl?: string;
  /** Optional inspiration notes (not rendered as text on garment). */
  inspiration?: string;
  /** Whether the client will overlay a logo separately. */
  hasLogo?: boolean;
}

const NO_TEXT_RULE =
  "Do not include any text, letters, numbers, team names, player names, monograms, logos, signatures, watermarks, brand marks, or copyrighted symbols. Typography is added deterministically by the application after generation.";

const NO_MOCKUP_RULE =
  "Do not show a garment mockup, jersey body, shorts silhouette, person, mannequin, body, hanger, scenery, stadium, external shadows, folds, seams, or product photography. Return only the isolated sublimation graphic on a transparent background.";

const PRINT_RULE =
  "Centered printable composition with clear shapes, strong color separation, clean vector-like edges, high resolution, and print-ready contrast suitable for full-dye sublimation.";

function paletteClause(colors?: DesignerColors) {
  if (!colors) {
    return "Invent a cohesive sport-uniform palette that matches the brief; keep it to three dominant colors with clear primary, secondary, and accent roles.";
  }
  return `Palette only: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}. Constrain every visible color to this palette.`;
}

function kitClause(garmentType: GarmentType, sport?: string) {
  const sportLabel = sport || "sports";
  if (garmentType === "uniform") {
    return `Design a coordinated ${sportLabel} uniform graphic system that reads as one jersey+shorts kit: shared motifs, matching geometry, and consistent visual language across top and bottom panels.`;
  }
  if (garmentType === "shorts") {
    return `Design a ${sportLabel} shorts panel graphic that can coordinate with a matching jersey.`;
  }
  return `Design a ${sportLabel} jersey panel graphic suitable for sublimation.`;
}

function viewClause(view: GarmentView) {
  // Front and back share one kit graphic; typography is overlaid by the app.
  if (view === "front" || view === "back") {
    return "Compose one shared sublimation graphic for the full jersey kit (usable on both FRONT and BACK). Keep motifs, geometry, and palette consistent. Leave clear center chest/back space for deterministic text overlays — do not draw team names, player names, numbers, or logos.";
  }
  return "";
}

function modeClause(input: GenerateDesignInput) {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  if (mode === "color_variation") {
    return [
      "COLOR VARIATION MODE: Preserve the existing composition, motifs, panel layout, and graphic structure exactly.",
      "Only recolor the design to the new palette. Do not invent new shapes, scenery, or text.",
      input.correction ? `Palette direction: ${input.correction}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (mode === "refine") {
    return [
      "REFINEMENT MODE: Revise the previous artwork.",
      input.correction
        ? `Targeted revision: ${input.correction}. Preserve the existing composition unless the revision explicitly changes it.`
        : "Preserve the existing composition and improve clarity, contrast, and print readiness.",
    ].join(" ");
  }
  return "";
}

/**
 * Builds the server-side image prompt.
 * Team/player typography is intentionally excluded so misspellings never become production text.
 */
export function buildArtworkPrompt(input: GenerateDesignInput): string {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  return [
    `Create one clean isolated sublimation-print graphic for a ${input.garmentType} in a ${input.view} printable layout.`,
    kitClause(input.garmentType, input.sport),
    viewClause(input.view),
    `Team context (DO NOT RENDER AS TEXT): ${input.teamName}.`,
    input.designDescription.trim(),
    input.inspiration?.trim() ? `Inspiration (visual mood only, no literal logos): ${input.inspiration.trim()}.` : "",
    `Style: ${input.style}.`,
    paletteClause(input.colors),
    modeClause({ ...input, mode }),
    input.hasLogo ? "Reserve a small clear crest zone on the front chest for a separately uploaded logo overlay." : "",
    PRINT_RULE,
    NO_MOCKUP_RULE,
    NO_TEXT_RULE,
    "Return only the isolated artwork graphic.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildColorVariationCorrection(colors: DesignerColors): string {
  return `Same design, recolored to primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
}

/** Preset used by the Bryant acceptance scenario and quick-try UI. */
export const COLOR_VARIATION_PRESETS: { id: string; label: string; colors: DesignerColors }[] = [
  {
    id: "galactic-night",
    label: "Black / Electric Blue / White",
    colors: { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" },
  },
  {
    id: "classic-gold",
    label: "Black / Gold / White",
    colors: { primary: "#101820", secondary: "#D4AF37", accent: "#FFFFFF" },
  },
  {
    id: "court-red",
    label: "Navy / Red / White",
    colors: { primary: "#0033A0", secondary: "#C8102E", accent: "#FFFFFF" },
  },
];
