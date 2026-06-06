import { getCenterFrontLogoPosition } from "@/lib/logo-positioning";
import type { TextureLayer } from "@/lib/store";

const DEFAULT_TEAM_NAME = "Besu";
const DEFAULT_FONT_FAMILY = "Oswald";
const DEFAULT_TEXT_COLOR = "#ffffff";
const TARGET_CHEST_WIDTH_UV = 0.3;

function sanitizeTeamName(value: string): string {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/^the\s+/i, "")
    .trim();
}

export function extractTeamNameFromPrompt(prompt: string): string | null {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) return null;

  const patterns = [
    /\bteam\s+(?:called|named)\s+["']?(?:the\s+)?([a-z0-9][a-z0-9 '&.-]{1,40}?)(?=\s+(?:using|with|featuring|inspired|based|for|and|like|including)\b|[,.;!?]|$)/i,
    /\bteam\s+name\s+(?:is|:)\s+["']?(?:the\s+)?([a-z0-9][a-z0-9 '&.-]{1,40}?)(?=\s+(?:using|with|featuring|inspired|based|for|and|like|including)\b|[,.;!?]|$)/i,
    /\bfor\s+(?:a|the)\s+team\s+["']?(?:the\s+)?([a-z0-9][a-z0-9 '&.-]{1,40}?)(?=\s+(?:using|with|featuring|inspired|based|and|like|including)\b|[,.;!?]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedPrompt.match(pattern);
    const candidate = match?.[1] ? sanitizeTeamName(match[1]) : "";
    if (candidate.length >= 2) return candidate;
  }

  return null;
}

export function normalizeUniformTeamName(value: string): string {
  return sanitizeTeamName(value)
    .replace(/[^a-z0-9 '&.-]/gi, "")
    .slice(0, 28)
    .trim()
    .toUpperCase();
}

export function estimateChestTextFontSize(text: string): number {
  const normalized = normalizeUniformTeamName(text) || DEFAULT_TEAM_NAME.toUpperCase();
  const estimatedAverageGlyphWidth = 0.62;
  const targetPixelsAtBaseCanvas = TARGET_CHEST_WIDTH_UV * 512;
  const estimatedSize =
    targetPixelsAtBaseCanvas / Math.max(normalized.length * estimatedAverageGlyphWidth, 1);

  return Math.round(Math.min(54, Math.max(28, estimatedSize)));
}

export function resolveChestTextLayerDefaults(params: {
  text: string;
  modelUrl: string | null;
  centerFrontUvAnchor?: [number, number, number] | null;
  order: number;
  id?: string;
  namePrefix?: string;
  textColor?: string;
}): TextureLayer {
  const displayText = params.text.trim() || DEFAULT_TEAM_NAME;
  const preset = getCenterFrontLogoPosition(params.modelUrl);
  const position = params.centerFrontUvAnchor ?? preset.position;

  return {
    id: params.id ?? crypto.randomUUID(),
    name: `${params.namePrefix ?? "Text"}: ${displayText}`,
    type: "text",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    order: params.order,
    text: displayText,
    textColor: params.textColor ?? DEFAULT_TEXT_COLOR,
    strokeColor: "rgba(0,0,0,0.82)",
    strokeWidth: 3,
    fontSize: estimateChestTextFontSize(displayText),
    fontFamily: DEFAULT_FONT_FAMILY,
    position,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    flipX: false,
  };
}

export const DEFAULT_CHEST_TEXT_VALUE = DEFAULT_TEAM_NAME;
