/**
 * Gemini image generation model IDs.
 *
 * Google currently exposes Gemini 3 Pro Image as the highest-quality image
 * generation model and Gemini 2.5 Flash Image as the lower-latency fallback.
 *
 * @see https://ai.google.dev/gemini-api/docs/changelog
 */
export const GEMINI_IMAGE_MODELS = {
  flash: {
    primary: "gemini-2.5-flash-image",
    fallback: "gemini-2.5-flash-image",
    fast: "gemini-2.5-flash-image",
  },
  pro: {
    primary: "gemini-3-pro-image-preview",
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
  return model === "pro" ? "Gemini 3 Pro Image" : "Gemini 2.5 Flash Image";
}
