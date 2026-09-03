import type { DesignerColors } from "./types";

const NAMED_COLORS: Record<string, string> = {
  black: "#0D0D0D",
  white: "#FFFFFF",
  gray: "#6B6B6B",
  grey: "#6B6B6B",
  silver: "#C0C0C0",
  purple: "#6B2D8B",
  violet: "#5A189A",
  orange: "#FF6600",
  red: "#C8102E",
  blue: "#0033A0",
  navy: "#0A1628",
  gold: "#D4AF37",
  yellow: "#F5C518",
  green: "#006341",
  teal: "#0D9488",
  pink: "#E11D8F",
  maroon: "#6B1E2A",
};

const EDIT_PREFIX =
  /^(make|add|remove|change|update|edit|give|turn|recolor|replace|move|darken|lighten|keep|use only|show only|without|swap|tweak|fix|rename|set)\b/i;

const FRESH_REQUEST =
  /\b(show me|create|generate|design me|new (uniform|design|kit)|three different|3 different|four different|4 different)\b/i;

const TEAM_PATTERNS = [
  /(?:change|update|set|rename)(?: the)? team(?: name)?(?: to|:)\s+["']?([A-Za-z0-9][A-Za-z0-9 &.'-]{0,58})/i,
  /team called\s+["']?([A-Za-z0-9][A-Za-z0-9 &.'-]{0,58})/i,
  /team name[:\s]+["']?([A-Za-z0-9][A-Za-z0-9 &.'-]{0,58})/i,
  /\bfor the\s+([A-Z][A-Za-z0-9&.'-]{1,28})\b/,
  /\bteam\s+["']([A-Za-z0-9][A-Za-z0-9 &.'-]{0,58})["']/,
] as const;

const VISUAL_EDIT_TAIL =
  /\s+(?:and\s+(?:add|make|remove|change|update|recolor|replace|move|give|use)|then|also)\b.*$/i;

function cleanTeamName(value: string | undefined) {
  return value
    ?.replace(VISUAL_EDIT_TAIL, "")
    .replace(/[.,!?:;]+$/, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 60);
}

export function extractExplicitTeamName(prompt: string): string | undefined {
  for (const pattern of TEAM_PATTERNS) {
    const name = cleanTeamName(prompt.match(pattern)?.[1]);
    if (name && name.length >= 2) return name;
  }
  return undefined;
}

export function extractTeamName(prompt: string, existing?: string): string {
  const explicit = extractExplicitTeamName(prompt);
  if (explicit) return explicit;
  const current = cleanTeamName(existing);
  if (current) return current;
  return "CUSTOM";
}

/** A pure wording change is handled instantly by the SVG layer and should not spend an AI edit. */
export function isTeamNameOnlyEdit(prompt: string): boolean {
  const trimmed = prompt.trim();
  // Do not accidentally classify a combined visual request as a free typography-only update.
  // Names such as "Rock and Roll" remain valid because only concrete edit continuations are rejected.
  if (VISUAL_EDIT_TAIL.test(trimmed)) return false;
  return /^\s*(?:please\s+)?(?:change|update|set|rename)(?:\s+the)?\s+team(?:\s+name)?\s+(?:to|:)\s+["']?[A-Za-z0-9][A-Za-z0-9 &.'-]{1,58}["']?[.!]?\s*$/i.test(trimmed);
}

export function extractColors(prompt: string): DesignerColors | undefined {
  const found: string[] = [];
  const lower = prompt.toLowerCase();
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    if (new RegExp(`\\b${name}\\b`).test(lower) && !found.includes(hex)) found.push(hex);
    if (found.length >= 3) break;
  }
  if (found.length < 2) return undefined;
  return {
    primary: found[0],
    secondary: found[1],
    accent: found[2] || "#FFFFFF",
  };
}

/**
 * Decides whether a studio prompt starts a fresh concept set or refines the selection.
 * With nothing selected there is no design to edit, so the prompt always starts a new set.
 */
export function isFreshGenerateRequest(prompt: string, hasSelection: boolean): boolean {
  if (!hasSelection) return true;
  const trimmed = prompt.trim();
  if (EDIT_PREFIX.test(trimmed)) return false;
  return FRESH_REQUEST.test(trimmed);
}
