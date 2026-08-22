import type { ArtworkLayout, DesignerColors, GarmentType, GarmentView } from "./types";

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
  inspiration?: string;
  hasLogo?: boolean;
  layout?: ArtworkLayout;
}

const DIRECT_RENDER_RULE =
  "Create the FINISHED UNIFORM VISUALIZATION directly. Do not return a flat sublimation texture, UV map, isolated print graphic, pattern sheet, fabric swatch, template, or technical artwork. The result must visibly show the actual wearable uniform product.";

const PRESENTATION_RULE =
  "Present the uniform as a premium ecommerce concept board on a clean transparent or neutral studio background. No person, body, mannequin, hanger, stadium, crowd, hands, props, watermark, brand logo, or unrelated scenery. Show the garment large, centered, clean, and easy to compare.";

const QUALITY_RULE =
  "Use realistic sportswear construction, believable fabric, professional cut-and-sew details, crisp trims, clean seams, premium sublimation graphics, balanced proportions, and polished commercial product-design rendering.";

function paletteClause(colors?: DesignerColors) {
  if (!colors) {
    return "Invent a cohesive professional team-uniform palette matching the brief, with three dominant colors and strong contrast.";
  }
  return `Use this palette as the dominant color system: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
}

function kitClause(garmentType: GarmentType, sport?: string, layout?: ArtworkLayout) {
  const sportLabel = sport || "sports";
  if (layout === "board") {
    return [
      "CONCEPT BOARD MODE: Create one landscape custom-sportswear presentation, like a professional jersey design pitch.",
      `Show THREE distinct labeled designs side by side (Design 1, Design 2, Design 3).`,
      garmentType === "shorts"
        ? `Each column shows finished ${sportLabel} shorts as a product flat.`
        : garmentType === "jersey"
          ? `Each column shows a finished sleeveless ${sportLabel} jersey as a product flat, with a small back view if space allows.`
          : `Each column is a complete coordinated ${sportLabel} uniform: sleeveless jersey plus matching shorts as product flats. Include a small back-of-jersey view in each column when space allows.`,
      "Same team identity on every design, but clearly different graphic concepts, paneling, motifs, and color emphasis.",
      "Label each column with a short design name that fits the brief. No person, mannequin, hanger, or stadium.",
    ].join(" ");
  }
  if (garmentType === "uniform") {
    return `Render a complete coordinated ${sportLabel} uniform: sleeveless jersey plus matching shorts. Show FRONT and BACK presentations in the same image, clearly separated, with the jersey and shorts visible in both presentations. The front and back must be unmistakably the same design system.`;
  }
  if (garmentType === "shorts") {
    return `Render finished ${sportLabel} shorts as a product concept, showing front and back views in the same image.`;
  }
  return `Render a finished sleeveless ${sportLabel} jersey as a product concept, showing front and back views in the same image.`;
}

function typographyClause(teamName: string, layout?: ArtworkLayout) {
  return [
    `Team name: ${teamName}.`,
    `Render the exact team name \"${teamName}\" prominently on the FRONT jersey chest when a jersey is present.`,
    layout === "board"
      ? "Use a single clear player number (23 unless the brief specifies another number) on each jersey. Do not invent player names."
      : "Keep the BACK visually clean with a clear player-name and number zone. Do not invent player names or numbers during initial concept generation.",
    "Do not add any other words, slogans, fake brands, sponsor marks, watermarks, or random typography.",
  ].join(" ");
}

function modeClause(input: GenerateDesignInput) {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  if (mode === "color_variation") {
    return [
      "COLOR VARIATION MODE: Edit the previous direct uniform render.",
      "Preserve the exact garment cut, front/back presentation, graphic composition, motifs, panel layout, trims, and visual identity.",
      "Only change the uniform colors to the requested palette. Do not redesign the kit.",
      input.correction ? `Palette direction: ${input.correction}.` : "",
    ].filter(Boolean).join(" ");
  }
  if (mode === "refine") {
    return [
      "REFINEMENT MODE: Edit the previous direct uniform render, not a flat texture.",
      input.correction
        ? `Requested visual revision: ${input.correction}. Keep all unmentioned parts of the uniform and presentation consistent.`
        : "Improve the selected uniform render while preserving its identity and layout.",
    ].join(" ");
  }
  return "Generate a new finished uniform concept from scratch based on the brief.";
}

function garmentFitClause(sport?: string) {
  const label = (sport || "Basketball").toLowerCase();
  if (label === "basketball") {
    return "For basketball, the jersey must be sleeveless with authentic basketball proportions. Avoid soccer sleeves, T-shirt sleeves, hoodies, warmups, or fashion-model styling unless explicitly requested.";
  }
  if (label === "soccer") {
    return "For soccer, use short sleeves and authentic soccer jersey proportions unless the brief asks otherwise.";
  }
  if (label === "volleyball") {
    return "For volleyball, use short sleeves and athletic volleyball proportions unless the brief asks otherwise.";
  }
  if (label === "baseball") {
    return "For baseball, use a button-front or classic baseball jersey silhouette unless the brief asks otherwise.";
  }
  if (label === "track") {
    return "For track and field, use a racing tank or short-sleeve race top with athletic proportions unless the brief asks otherwise.";
  }
  if (label === "training") {
    return "For training apparel, match the requested garment (hoodie or polo) with clean team branding and wearable proportions.";
  }
  if (label === "flag football") {
    return "For flag football, use a hooded or athletic jersey silhouette suited to flag football kits unless the brief asks otherwise.";
  }
  return `Match authentic ${sport || "sports"} garment proportions for the selected product.`;
}

export function buildArtworkPrompt(input: GenerateDesignInput): string {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  return [
    DIRECT_RENDER_RULE,
    kitClause(input.garmentType, input.sport, input.layout),
    `Design brief: ${input.designDescription.trim()}`,
    input.inspiration?.trim() ? `Visual inspiration: ${input.inspiration.trim()}.` : "",
    `Style direction: ${input.style}.`,
    paletteClause(input.colors),
    typographyClause(input.teamName, input.layout),
    input.hasLogo
      ? "Reserve a tasteful crest/logo position on the front chest, but do not invent a logo; the real uploaded logo is handled separately by the application."
      : "",
    modeClause({ ...input, mode }),
    QUALITY_RULE,
    PRESENTATION_RULE,
    garmentFitClause(input.sport),
    input.layout === "board"
      ? "Return one landscape concept-board image containing the labeled uniform designs."
      : "Return one direct AI product-render image of the uniform concept.",
  ].filter(Boolean).join(" ");
}

export function buildColorVariationCorrection(colors: DesignerColors): string {
  return `Same direct uniform render and same design, recolored to primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
}

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
