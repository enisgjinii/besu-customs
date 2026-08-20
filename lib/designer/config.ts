/**
 * Server-only designer AI configuration.
 * Never import this module from client components.
 */

export function getOpenAiConfig() {
  // Strip accidental wrapping quotes from .env / .env.local values.
  const apiKey = (process.env.OPENAI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  const imageModel = (process.env.OPENAI_IMAGE_MODEL || "gpt-image-1").trim().replace(/^["']|["']$/g, "");
  const mockAi = process.env.DESIGNER_MOCK_AI === "true";
  return { apiKey, imageModel, mockAi };
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
