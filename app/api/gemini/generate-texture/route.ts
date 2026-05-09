import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_MODELS = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
} as const;

type GeminiModel = keyof typeof GEMINI_MODELS;

const getGeminiApiUrl = (model: GeminiModel) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[model]}:generateContent`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeInlineData(part: Record<string, unknown>): Record<string, unknown> {
  const inlineData =
    (isRecord(part.inlineData) && part.inlineData) ||
    (isRecord(part.inline_data) && part.inline_data) ||
    null;

  if (!inlineData) {
    return part;
  }

  const normalizedInlineData: Record<string, unknown> = { ...inlineData };

  if (typeof inlineData.mime_type === "string" && typeof inlineData.mimeType !== "string") {
    normalizedInlineData.mimeType = inlineData.mime_type;
  }

  const normalizedPart = { ...part };
  normalizedPart.inlineData = normalizedInlineData;
  delete normalizedPart.inline_data;

  return normalizedPart;
}

function normalizeImageConfig(config: Record<string, unknown>): Record<string, unknown> {
  const normalizedConfig: Record<string, unknown> = { ...config };

  const legacyImageConfig =
    (isRecord(config.imageConfig) && config.imageConfig) ||
    (isRecord(config.image_config) && config.image_config) ||
    (isRecord(config.responseFormat) && isRecord(config.responseFormat.image)
      ? (config.responseFormat.image as Record<string, unknown>)
      : null) ||
    (isRecord(config.response_format) && isRecord(config.response_format.image)
      ? (config.response_format.image as Record<string, unknown>)
      : null);

  if (legacyImageConfig) {
    const normalizedImageConfig: Record<string, unknown> = { ...legacyImageConfig };

    if (
      typeof legacyImageConfig.aspect_ratio === "string" &&
      typeof legacyImageConfig.aspectRatio !== "string"
    ) {
      normalizedImageConfig.aspectRatio = legacyImageConfig.aspect_ratio;
    }

    if (
      typeof legacyImageConfig.image_size === "string" &&
      typeof legacyImageConfig.imageSize !== "string"
    ) {
      normalizedImageConfig.imageSize = legacyImageConfig.image_size;
    }

    normalizedConfig.imageConfig = normalizedImageConfig;
  }

  if (Array.isArray(config.response_modalities) && !Array.isArray(config.responseModalities)) {
    normalizedConfig.responseModalities = config.response_modalities;
  }

  if (
    typeof config.max_output_tokens === "number" &&
    typeof config.maxOutputTokens !== "number"
  ) {
    normalizedConfig.maxOutputTokens = config.max_output_tokens;
  }

  if (isRecord(config.thinking_config) && !isRecord(config.thinkingConfig)) {
    normalizedConfig.thinkingConfig = config.thinking_config;
  }

  delete normalizedConfig.response_format;
  delete normalizedConfig.responseFormat;
  delete normalizedConfig.response_modalities;
  delete normalizedConfig.image_config;
  delete normalizedConfig.max_output_tokens;
  delete normalizedConfig.thinking_config;

  return normalizedConfig;
}

function normalizeGeminiRequestBody(requestBody: Record<string, unknown>): Record<string, unknown> {
  const normalizedRequestBody: Record<string, unknown> = { ...requestBody };

  if (Array.isArray(requestBody.contents)) {
    normalizedRequestBody.contents = requestBody.contents.map((content) => {
      if (!isRecord(content) || !Array.isArray(content.parts)) {
        return content;
      }

      return {
        ...content,
        parts: content.parts.map((part) => (isRecord(part) ? normalizeInlineData(part) : part)),
      };
    });
  }

  if (isRecord(requestBody.generationConfig)) {
    normalizedRequestBody.generationConfig = normalizeImageConfig(requestBody.generationConfig);
  }

  return normalizedRequestBody;
}

async function parseErrorResponse(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const text = await response.text().catch(() => "");
  return text ? { raw: text } : {};
}

function extractErrorMessage(
  errorData: Record<string, unknown>,
  fallbackStatus: number,
): string {
  const error =
    typeof errorData.error === "object" && errorData.error !== null
      ? (errorData.error as Record<string, unknown>)
      : null;

  const message =
    typeof error?.message === "string"
      ? error.message
      : typeof errorData.message === "string"
        ? errorData.message
        : typeof errorData.raw === "string"
          ? errorData.raw
          : "";

  return message || `Gemini API error: ${fallbackStatus}`;
}

function shouldSuggestFallback(status: number, message: string, model: GeminiModel): boolean {
  if (model !== "pro") return false;

  const normalized = message.toLowerCase();
  return (
    status === 429 ||
    normalized.includes("quota") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("rate limit")
  );
}

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            message:
              "Gemini API key not configured. Set GOOGLE_API_KEY or GEMINI_API_KEY on the server.",
          },
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      model?: GeminiModel;
      requestBody?: Record<string, unknown>;
    };

    const model: GeminiModel = body.model === "flash" ? "flash" : "pro";
    const requestBody = body.requestBody;

    if (!requestBody) {
      return NextResponse.json(
        { error: { message: "Missing Gemini request body." } },
        { status: 400 },
      );
    }

    const normalizedRequestBody = normalizeGeminiRequestBody(requestBody);

    const upstream = await fetch(`${getGeminiApiUrl(model)}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedRequestBody),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errorData = await parseErrorResponse(upstream);
      const message = extractErrorMessage(errorData, upstream.status);

      console.error("Gemini upstream error", {
        status: upstream.status,
        model: GEMINI_MODELS[model],
        message,
        errorData,
      });

      return NextResponse.json(
        {
          error: {
            message,
            status: upstream.status,
            code:
              typeof (errorData.error as Record<string, unknown> | undefined)?.status === "string"
                ? ((errorData.error as Record<string, unknown>).status as string)
                : undefined,
          },
          fallbackRecommended: shouldSuggestFallback(
            upstream.status,
            message,
            model,
          ),
        },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected Gemini proxy failure";

    console.error("Gemini proxy failure", { message, error });

    return NextResponse.json(
      {
        error: {
          message,
        },
      },
      { status: 500 },
    );
  }
}
