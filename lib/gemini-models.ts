/**
 * Gemini image generation model IDs.
 *
 * GA models (May 2026) are preferred; preview IDs are kept as fallbacks until
 * Google shuts them down (June 25, 2026).
 *
 * @see https://ai.google.dev/gemini-api/docs/changelog
 */
export const GEMINI_IMAGE_MODELS = {
  flash: {
    primary: "gemini-3.1-flash-image",
    fallback: "gemini-3.1-flash-image-preview",
    /** Faster model used when primary requests time out on serverless. */
    fast: "gemini-2.5-flash-image",
  },
  pro: {
    primary: "gemini-3-pro-image",
    fallback: "gemini-3-pro-image-preview",
    fast: "gemini-2.5-flash-image",
  },
} as const;

export type GeminiImageModelKey = keyof typeof GEMINI_IMAGE_MODELS;

export function resolveGeminiImageModelIds(model: GeminiImageModelKey): string[] {
  const entry = GEMINI_IMAGE_MODELS[model];
  const ids =
    model === "flash"
      ? [entry.fast, entry.primary, entry.fallback]
      : [entry.primary, entry.fallback, entry.fast];
  return [...new Set(ids)];
}

export function getGeminiImageModelLabel(model: GeminiImageModelKey): string {
  return model === "pro" ? "Gemini 3 Pro Image" : "Gemini 3.1 Flash Image";
}
