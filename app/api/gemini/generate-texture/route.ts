import { NextRequest, NextResponse } from "next/server";
import {
  type GeminiImageModelKey,
  resolveGeminiImageModelIds,
} from "@/lib/gemini-models";

export const maxDuration = 300;

const GEMINI_UPSTREAM_TIMEOUT_MS =
  Number(process.env.GEMINI_UPSTREAM_TIMEOUT_MS) || 290_000;

const getGeminiApiUrl = (modelId: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

function shouldRetryWithFallbackModel(status: number, message: string): boolean {
  if (status === 404) return true;

  const normalized = message.toLowerCase();
  return (
    normalized.includes("not found") ||
    normalized.includes("not supported for generatecontent") ||
    normalized.includes("is not found for api version")
  );
}

async function callGeminiUpstream(
  modelId: string,
  apiKey: string,
  requestBody: Record<string, unknown>,
): Promise<
  | { kind: "success"; data: unknown }
  | { kind: "error"; response: Response; errorData: Record<string, unknown>; message: string }
  | { kind: "timeout" }
> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEMINI_UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(getGeminiApiUrl(modelId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
      signal: abortController.signal,
    });

    if (upstream.ok) {
      const data = await upstream.json();
      return { kind: "success", data };
    }

    const errorData = await parseErrorResponse(upstream);
    const message = extractErrorMessage(errorData, upstream.status);

    return {
      kind: "error",
      response: upstream,
      errorData,
      message,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { kind: "timeout" };
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

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

function shouldSuggestFallback(
  status: number,
  message: string,
  model: GeminiImageModelKey,
): boolean {
  if (model !== "pro") return false;

  const normalized = message.toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    normalized.includes("high demand") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("try again later") ||
    normalized.includes("quota") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("rate limit")
  );
}

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            message:
              "Gemini API key not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY on the server.",
          },
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      model?: GeminiImageModelKey;
      requestBody?: Record<string, unknown>;
    };

    const model: GeminiImageModelKey = body.model === "pro" ? "pro" : "flash";
    const requestBody = body.requestBody;

    if (!requestBody) {
      return NextResponse.json(
        { error: { message: "Missing Gemini request body." } },
        { status: 400 },
      );
    }

    const normalizedRequestBody = normalizeGeminiRequestBody(requestBody);
    const modelIds = resolveGeminiImageModelIds(model);

    let lastErrorResponse: Response | null = null;
    let lastErrorData: Record<string, unknown> = {};
    let lastMessage = "";
    let lastModelId = modelIds[0];

    for (const modelId of modelIds) {
      lastModelId = modelId;

      const result = await callGeminiUpstream(modelId, apiKey, normalizedRequestBody);

      if (result.kind === "success") {
        return NextResponse.json(result.data, { status: 200 });
      }

      if (result.kind === "timeout") {
        lastMessage =
          "Gemini request timed out before returning an image. Please retry with a simpler prompt.";
        lastErrorResponse = null;

        console.error("Gemini upstream timeout", { model: modelId });
        break;
      }

      lastErrorResponse = result.response;
      lastErrorData = result.errorData;
      lastMessage = result.message;

      console.error("Gemini upstream error", {
        status: result.response.status,
        model: modelId,
        message: lastMessage,
        errorData: lastErrorData,
      });

      if (!shouldRetryWithFallbackModel(result.response.status, lastMessage)) {
        break;
      }
    }

    if (lastErrorResponse) {
      return NextResponse.json(
        {
          error: {
            message: lastMessage,
            status: lastErrorResponse.status,
            code:
              typeof (lastErrorData.error as Record<string, unknown> | undefined)?.status ===
              "string"
                ? ((lastErrorData.error as Record<string, unknown>).status as string)
                : undefined,
          },
          fallbackRecommended: shouldSuggestFallback(
            lastErrorResponse.status,
            lastMessage,
            model,
          ),
        },
        { status: lastErrorResponse.status },
      );
    }

    if (lastMessage) {
      return NextResponse.json(
        {
          error: {
            message: lastMessage,
            status: 504,
            code: "UPSTREAM_TIMEOUT",
          },
          fallbackRecommended: true,
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        error: {
          message: `Gemini request failed for model ${lastModelId}.`,
        },
      },
      { status: 502 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          error: {
            message: "Gemini request timed out before returning an image. Please retry with a simpler prompt.",
            status: 504,
            code: "UPSTREAM_TIMEOUT",
          },
          fallbackRecommended: true,
        },
        { status: 504 },
      );
    }

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
