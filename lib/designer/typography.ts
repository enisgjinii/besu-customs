import type { NormalizedBounds } from "./templates";
import type { GarmentView } from "./types";

export interface FitTextOptions {
  minSize?: number;
  maxSize?: number;
  /** Average glyph width as a fraction of font size. */
  charWidthRatio?: number;
  /** Height usage of the bound box. */
  heightRatio?: number;
}

/**
 * Deterministic font-size that fits `text` inside absolute (or normalized-scaled) bounds.
 * Used for team name (front) and player name/number (back) — never rely on AI for typography.
 */
export function fitTextToBounds(
  text: string,
  bounds: { width: number; height: number },
  options: FitTextOptions = {},
): number {
  const {
    minSize = 14,
    maxSize = 160,
    charWidthRatio = 0.62,
    heightRatio = 0.82,
  } = options;
  const trimmed = text.trim() || " ";
  const byWidth = bounds.width / Math.max(trimmed.length * charWidthRatio, 1);
  const byHeight = bounds.height * heightRatio;
  return Math.max(minSize, Math.min(maxSize, Math.min(byWidth, byHeight)));
}

export function fitTextToNormalizedBounds(
  text: string,
  bounds: NormalizedBounds,
  viewBoxWidth: number,
  viewBoxHeight: number,
  options?: FitTextOptions,
): number {
  return fitTextToBounds(
    text,
    {
      width: bounds.width * viewBoxWidth,
      height: bounds.height * viewBoxHeight,
    },
    options,
  );
}

export type TypographyRole = "teamName" | "playerName" | "number";

/**
 * Front/back placement rules:
 * - teamName → FRONT ONLY
 * - playerName + number → BACK ONLY
 */
export function allowedTypographyRoles(view: GarmentView): TypographyRole[] {
  if (view === "front") return ["teamName"];
  return ["playerName", "number"];
}

export function shouldRenderTeamName(view: GarmentView): boolean {
  return view === "front";
}

export function shouldRenderPlayerTypography(view: GarmentView): boolean {
  return view === "back";
}

/**
 * Preserve the customer-entered spelling/case exactly. Only invisible control characters are
 * removed so SVG/XML cannot be corrupted. We intentionally do not uppercase, transliterate or
 * replace punctuation here — the app, not the image model, owns the final customer wording.
 */
export function normalizeExactOverlayText(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Kept for older call sites; new deterministic overlays should prefer normalizeExactOverlayText. */
export function sanitizeOverlayText(value: string, maxLength: number): string {
  return normalizeExactOverlayText(value, maxLength);
}

export const AI_MASTER_BOARD = {
  width: 1536,
  height: 1024,
  viewWidth: 768,
} as const;

export type TypographySpace = "view" | "board";

const LOCAL_TYPOGRAPHY_BOUNDS: Record<TypographyRole, { x: number; y: number; width: number; height: number }> = {
  // These coordinates match the fixed front-left/back-right composition required in the AI prompt.
  teamName: { x: 194, y: 292, width: 380, height: 86 },
  playerName: { x: 194, y: 276, width: 380, height: 70 },
  number: { x: 238, y: 360, width: 292, height: 205 },
};

export function getTypographyBounds(role: TypographyRole, space: TypographySpace = "view") {
  const base = LOCAL_TYPOGRAPHY_BOUNDS[role];
  const backRole = role === "playerName" || role === "number";
  const offsetX = space === "board" && backRole ? AI_MASTER_BOARD.viewWidth : 0;
  return { ...base, x: base.x + offsetX };
}

export function getTypographyPlacement(
  role: TypographyRole,
  value: string,
  space: TypographySpace = "view",
) {
  const maxLength = role === "number" ? 3 : role === "playerName" ? 18 : 60;
  const text = normalizeExactOverlayText(value, maxLength);
  const bounds = getTypographyBounds(role, space);
  const fontSize = fitTextToBounds(text || " ", bounds, {
    minSize: role === "number" ? 44 : 18,
    maxSize: role === "number" ? 150 : role === "teamName" ? 60 : 46,
    charWidthRatio: role === "number" ? 0.56 : 0.6,
    heightRatio: role === "number" ? 0.78 : 0.72,
  });
  return {
    text,
    bounds,
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    fontSize,
  };
}
