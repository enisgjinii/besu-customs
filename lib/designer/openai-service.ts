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

const MASTER_BOARD_RULE =
  "MASTER CONCEPT LAYOUT: output exactly one 1536x1024 landscape master board. The LEFT half is the FRONT presentation and the RIGHT half is the BACK presentation. Keep both garments at the same scale, camera height, lighting, cut, material, trim widths and proportions. Front and back must unmistakably be the same physical uniform and the same design system: continue matching colors, patterns, gradients, piping, side panels, motifs and seam logic around the garment instead of inventing a separate back design. Keep the front centered near x=384 and the back centered near x=1152, with neither view crossing the center line or being cropped.";

const TYPOGRAPHY_SAFE_RULE =
  "TYPOGRAPHY-SAFE ARTWORK ONLY: draw NO customer typography. Do not draw any team name, player name, player number, slogan, sponsor, label, caption, wordmark, letters, numbers, pseudo-letters, fake writing, glyph-like marks or random text anywhere on the garment or background. On the FRONT jersey reserve a calm, low-detail chest area centered around the upper-middle chest for the app to place the exact team name later. On the BACK jersey reserve a calm player-name zone across the upper back and a larger low-detail number zone below it. These reserved regions are intentional parts of the composition and must remain free of lettering in generation and every edit.";

const PRESENTATION_RULE =
  "Present the master board as a premium ecommerce uniform design sheet on a clean transparent or neutral studio background. No person, body, mannequin, hanger, stadium, crowd, hands, props, labels, callouts, watermark, border titles or unrelated scenery. Use the same neutral presentation standard for every concept so concepts differ by art direction, never by render quality or garment proportions.";

const QUALITY_RULE =
  "PRODUCTION-READY STANDARD: use realistic sportswear construction, believable performance fabric, crisp cut-and-sew details, intentional trim geometry, clean seams, premium sublimation graphics, balanced negative space, controlled gradients, coherent piping and polished commercial product-design rendering. Avoid unfinished sketches, noisy AI texture, warped seams, asymmetrical accidents, muddy details, impossible panels or arbitrary decorative clutter.";

const NO_THIRD_PARTY_MARKS_RULE =
  "ABSOLUTE FINAL REQUIREMENT: draw NO manufacturer, sponsor or third-party brand mark of any kind. Do not add a Nike swoosh, Adidas stripes, Jordan jumpman, Under Armour, Puma, New Balance, Champion, Reebok, league badge, invented apparel logo, monogram, chest tag, sleeve badge, hem tab or shorts-leg mark. Do not invent a team crest either. The application composites approved logos and all exact typography separately. The AI output must contain only non-text garment artwork.";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The image model must never receive the exact customer wordmark as something it could paint.
 * We still keep the team name in application state for deterministic SVG typography, but replace
 * that literal when it appears inside the visual brief/inspiration/correction.
 */
export function sanitizeArtworkInstruction(value: string | undefined, teamName: string): string {
  const source = (value || "").trim();
  if (!source) return "";
  const literal = teamName.trim();
  if (!literal || literal.toUpperCase() === "CUSTOM") return source;
  return source.replace(new RegExp(escapeRegex(literal), "gi"), "the team");
}

function paletteClause(colors?: DesignerColors) {
  if (!colors) {
    return "Invent one cohesive professional team-uniform palette matching the visual brief, with three dominant colors and strong usable contrast.";
  }
  return `Use this palette as the dominant color system: primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
}

function kitClause(garmentType: GarmentType, sport?: string) {
  const sportLabel = sport || "sports";
  if (garmentType === "uniform") {
    return `Render a complete coordinated ${sportLabel} uniform in BOTH halves: jersey plus matching shorts in the front presentation and the same jersey plus matching shorts in the back presentation. Keep jersey and shorts fully visible, vertically aligned, and identically scaled across both halves.`;
  }
  if (garmentType === "shorts") {
    return `Render finished ${sportLabel} shorts only, front on the left and back on the right, with matched cut, panel geometry and scale.`;
  }
  return `Render a finished ${sportLabel} jersey only, front on the left and back on the right, with matched cut, panel geometry and scale.`;
}

function typographyZoneLockClause() {
  return "Preserve the blank front chest typography zone and the blank back player-name/number zones exactly as functional negative space. Never fill those zones with text-like detail during an edit.";
}

function modeClause(input: GenerateDesignInput) {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  const correction = sanitizeArtworkInstruction(input.correction, input.teamName);
  if (mode === "color_variation") {
    return [
      "COLOR VARIATION MODE: edit the supplied master uniform board; do not regenerate a new concept.",
      "LOCK THE DESIGN GEOMETRY. Preserve the exact garment cut, front/back positions, camera, motif shapes, motif locations, panel boundaries, gradient boundaries, piping paths, trim widths, seam logic, negative space and overall visual identity.",
      "Only remap the existing design to the requested palette. Do not add, remove, move, rotate, resize or reinterpret design elements.",
      typographyZoneLockClause(),
      correction ? `Palette direction: ${correction}.` : "",
    ].filter(Boolean).join(" ");
  }
  if (mode === "refine") {
    return [
      "REFINEMENT MODE: edit the supplied master uniform board instead of starting over.",
      correction
        ? `Requested visual revision: ${correction}. Change only what this instruction requires and keep every unmentioned part of the master concept stable.`
        : "Polish the selected concept while preserving its identity, composition and front/back correspondence.",
      "Keep front and back synchronized: if a requested visual change affects a shared panel, trim, gradient, piping path or motif language, apply the corresponding change coherently to both views.",
      typographyZoneLockClause(),
    ].filter(Boolean).join(" ");
  }
  return "Generate one new master uniform concept from scratch. Treat this as a single coherent product system, not two unrelated garment ideas.";
}

function garmentFitClause(sport?: string) {
  const label = (sport || "Basketball").toLowerCase();
  if (label === "basketball") {
    return "For basketball, use a sleeveless jersey with authentic basketball proportions and coordinated basketball shorts. Avoid soccer sleeves, T-shirt sleeves, hoodies, warmups or fashion-model styling unless explicitly requested.";
  }
  if (label === "soccer") {
    return "For soccer, use short sleeves and authentic soccer jersey proportions unless the brief asks otherwise.";
  }
  if (label === "volleyball") {
    return "For volleyball, use athletic volleyball proportions appropriate to the selected product unless the brief asks otherwise.";
  }
  if (label === "baseball") {
    return "For baseball, use a button-front or classic baseball jersey silhouette unless the brief asks otherwise.";
  }
  if (label === "track") {
    return "For track and field, use a racing tank or short-sleeve race top with athletic proportions unless the brief asks otherwise.";
  }
  if (label === "training") {
    return "For training apparel, match the selected garment with clean teamwear construction and wearable proportions.";
  }
  if (label === "flag football") {
    return "For flag football, use an athletic silhouette suited to flag football kits unless the brief asks otherwise.";
  }
  return `Match authentic ${sport || "sports"} garment proportions for the selected product.`;
}

export function buildArtworkPrompt(input: GenerateDesignInput): string {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  const artworkBrief = sanitizeArtworkInstruction(input.designDescription, input.teamName);
  const inspiration = sanitizeArtworkInstruction(input.inspiration, input.teamName);
  return [
    DIRECT_RENDER_RULE,
    MASTER_BOARD_RULE,
    kitClause(input.garmentType, input.sport),
    `Visual design brief (artwork only): ${artworkBrief}`,
    inspiration ? `Visual inspiration (art direction only, never copy typography): ${inspiration}.` : "",
    `Style direction: ${input.style}.`,
    paletteClause(input.colors),
    TYPOGRAPHY_SAFE_RULE,
    input.hasLogo
      ? "Reserve one small clean crest/logo placement on the upper FRONT chest, but leave it empty; the approved uploaded logo is composited by the application after AI generation."
      : "",
    modeClause({ ...input, mode }),
    QUALITY_RULE,
    PRESENTATION_RULE,
    garmentFitClause(input.sport),
    NO_THIRD_PARTY_MARKS_RULE,
    "Return exactly one 1536x1024 master product-render board with front-left/back-right and zero rendered typography.",
  ].filter(Boolean).join(" ");
}

export function buildColorVariationCorrection(colors: DesignerColors): string {
  return `Keep the same master uniform board and exact design geometry; only recolor the existing artwork to primary ${colors.primary}, secondary ${colors.secondary}, accent ${colors.accent}.`;
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
