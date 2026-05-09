import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODELS = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
} as const;

type GeminiModel = keyof typeof GEMINI_MODELS;

const getGeminiApiUrl = (model: GeminiModel) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS[model]}:generateContent`;

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

    const upstream = await fetch(`${getGeminiApiUrl(model)}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
