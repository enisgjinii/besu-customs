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

export function sanitizeOverlayText(value: string, maxLength: number): string {
  return value
    .replace(/[^\w\s'&.-]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}
