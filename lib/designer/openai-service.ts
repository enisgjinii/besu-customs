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
  "MASTER CONCEPT LAYOUT: output exactly one 1536x1024 landscape master board containing EXACTLY TWO coordinated uniform presentations total — one FRONT kit in the LEFT half and one BACK kit in the RIGHT half. If the product is a uniform, each presentation contains exactly one jersey plus exactly one matching pair of shorts. Do NOT create extra jerseys, duplicate kits, alternate colorways, third/fourth uniforms, cropped garments at the canvas edges, or repeated front/back views. Keep a clear empty center gutter. Center the complete FRONT kit near x=384 and the complete BACK kit near x=1152. Each complete kit should occupy about 68–72% of the canvas height with generous clean margin above, below and to the sides, so neither kit touches the frame or center line. Keep both presentations at the same scale, camera height, lighting, cut, material, trim widths and proportions. Front and back must unmistakably be the same physical uniform and the same design system: continue matching colors, patterns, gradients, piping, side panels, motifs and seam logic around the garment instead of inventing a separate back design.";

const PRESENTATION_RULE =
  "Present the master board as a premium ecommerce uniform design sheet on a clean transparent or neutral studio background. No person, body, mannequin, hanger, stadium, crowd, hands, props, labels, callouts, watermark, border titles or unrelated scenery. Use the same neutral presentation standard for every concept so concepts differ by art direction, never by render quality or garment proportions.";

const QUALITY_RULE =
  "PRODUCTION-READY STANDARD: use realistic sportswear construction, believable performance fabric, crisp cut-and-sew details, intentional trim geometry, clean seams, premium sublimation graphics, balanced negative space, controlled gradients, coherent piping and polished commercial product-design rendering. Avoid unfinished sketches, noisy AI texture, warped seams, asymmetrical accidents, muddy details, impossible panels or arbitrary decorative clutter.";

const NO_GENERATED_TEXT_RULE =
  "ABSOLUTE FINAL REQUIREMENT: render NO readable text, letters, numbers, pseudo-text, fake writing or random glyphs anywhere on the garment or background. Draw NO manufacturer, sponsor or third-party brand mark of any kind: no Nike swoosh, Adidas stripes, Jordan jumpman, Under Armour, Puma, New Balance, Champion, Reebok, league badge, invented apparel logo, monogram, chest tag, sleeve badge, hem tab or shorts-leg mark. Do not invent a team crest. Customer team/player wording and approved logos are composited deterministically by the application after AI generation.";

const TYPOGRAPHY_SAFE_ZONE_RULE =
  "APP TYPOGRAPHY SAFE ZONES: the application will add exact customer typography after this render. Keep the FRONT upper-chest wordmark region visually usable and uncluttered while still continuing the garment design beneath it. Keep the BACK upper-name region and large central-number region visually usable and free of focal motifs. Do not place generated wording, numbers, badges or glyph-like decoration in those areas. These are fabric design zones, not blank rectangles, labels, plaques or UI panels.";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keep the free-form visual brief from asking the image model to draw customer wording.
 * Exact customer text is owned by the deterministic SVG layer instead.
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

function typographyLockClause() {
  return "Preserve the typography safe zones and keep them free of generated text, numbers, pseudo-writing, badges and focal motifs. The application adds exact customer typography after the image edit.";
}

function modeClause(input: GenerateDesignInput) {
  const mode = input.mode || (input.correction ? "refine" : "generate");
  const correction = sanitizeArtworkInstruction(input.correction, input.teamName);
  if (mode === "color_variation") {
    return [
      "COLOR VARIATION MODE: edit the supplied master uniform board; do not regenerate a new concept.",
      "LOCK THE DESIGN GEOMETRY. Preserve the exact garment cut, front/back positions, camera, motif shapes, motif locations, panel boundaries, gradient boundaries, piping paths, trim widths, seam logic, negative space and overall visual identity.",
      "Only remap the existing design to the requested palette. Do not add, remove, move, rotate, resize or reinterpret design elements.",
      typographyLockClause(),
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
      typographyLockClause(),
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
    TYPOGRAPHY_SAFE_ZONE_RULE,
    input.hasLogo
      ? "Reserve one small clean crest/logo placement on the upper FRONT chest and leave that logo position free of generated marks because the approved uploaded logo is composited by the application after AI generation."
      : "",
    modeClause({ ...input, mode }),
    QUALITY_RULE,
    PRESENTATION_RULE,
    garmentFitClause(input.sport),
    NO_GENERATED_TEXT_RULE,
    "Return exactly one 1536x1024 master product-render board with only the required front-left/back-right coordinated kits, no generated wording or numbers, no third-party marks, and no duplicate garments.",
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
