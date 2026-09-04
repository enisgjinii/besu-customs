/**
 * Server-only designer AI configuration.
 * Never import this module from client components.
 */

/**
 * BESU intentionally uses one image model only.
 * Keeping this as a code constant prevents a stale Vercel/local env override from silently
 * downgrading generation or edit quality.
 */
export const DESIGNER_IMAGE_MODEL = "gpt-image-2" as const;

export function getOpenAiConfig() {
  // Strip accidental wrapping quotes from .env / .env.local values.
  const apiKey = (process.env.OPENAI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  const mockAi = process.env.DESIGNER_MOCK_AI === "true";
  return { apiKey, imageModel: DESIGNER_IMAGE_MODEL, mockAi };
}

export function assertOpenAiConfigured() {
  const { apiKey, mockAi } = getOpenAiConfig();
  if (mockAi) return { mockAi: true as const, apiKey: "" };
  if (!apiKey) {
    const error = Object.assign(
      new Error(
        "AI generation is not configured. Set OPENAI_API_KEY or enable DESIGNER_MOCK_AI for development.",
      ),
      { code: "missing_openai_key", status: 503 },
    );
    throw error;
  }
  return { mockAi: false as const, apiKey };
}
