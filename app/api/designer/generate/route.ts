import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertOpenAiConfigured, getOpenAiConfig } from "@/lib/designer/config";
import { buildArtworkPrompt, type GenerationMode } from "@/lib/designer/openai-service";
import { assertStorageConfiguration, isLocalDesignerAssetUrl, prefersLocalAssetStorage, storeGeneratedAsset } from "@/lib/designer/storage-service";

export const maxDuration = 120;
const MAX_BODY_BYTES = 24_576;
const MAX_GENERATIONS_PER_MINUTE = 12;

const colorsSchema = z.object({
  primary: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondary: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
});

const schema = z
  .object({
    garmentType: z.enum(["jersey", "shorts", "uniform"]),
    designDescription: z.string().trim().min(8).max(800),
    teamName: z.string().trim().min(1).max(60),
    colors: colorsSchema.optional(),
    style: z.enum(["modern", "minimal", "geometric", "retro", "aggressive"]).default("modern"),
    view: z.enum(["front", "back"]),
    sport: z.string().trim().max(40).optional(),
    mode: z.enum(["generate", "refine", "color_variation"]).default("generate"),
    correction: z.string().trim().max(400).optional(),
    previousAssetUrl: z.string().url().max(2000).optional(),
    inspiration: z.string().trim().max(400).optional(),
    hasLogo: z.boolean().optional(),
    layout: z.enum(["kit"]).default("kit"),
    // Position of this render inside a four-direction concept set, when applicable.
    conceptIndex: z.number().int().min(0).max(3).optional(),
    requestId: z.string().uuid(),
  })
  .superRefine((value, ctx) => {
    const mode: GenerationMode = value.mode;
    if ((mode === "refine" || mode === "color_variation") && !value.previousAssetUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["previousAssetUrl"],
        message: "A previous artwork URL is required for refinement or color variation.",
      });
    }
    if (mode === "color_variation" && !value.colors) {
      ctx.addIssue({
        code: "custom",
        path: ["colors"],
        message: "Colors are required for a color variation.",
      });
    }
    if (value.correction && mode === "generate" && !value.previousAssetUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["previousAssetUrl"],
        message: "A previous artwork URL is required for a correction.",
      });
    }
  });

const requests = new Map<string, { at: number; response?: unknown }>();
const usage = new Map<string, number[]>();
const REQUEST_TTL = 15 * 60_000;
const USAGE_TTL = 60_000;

function cleanup(now: number) {
  for (const [key, entry] of requests) if (now - entry.at > REQUEST_TTL) requests.delete(key);
  for (const [key, entries] of usage) {
    const active = entries.filter((time) => now - time < USAGE_TTL);
    if (active.length) usage.set(key, active);
    else usage.delete(key);
  }
  if (requests.size > 2000) {
    const oldest = [...requests.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, requests.size - 2000);
    for (const [key] of oldest) requests.delete(key);
  }
}

function isAllowedAssetUrl(value: string, origin?: string) {
  try {
    const asset = new URL(value);
    if (origin && isLocalDesignerAssetUrl(value, origin)) return true;
    const storage = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/^["']|["']$/g, ""))
      : null;
    return (
      asset.protocol === "https:" &&
      Boolean(
        storage &&
          asset.hostname === storage.hostname &&
          asset.port === storage.port &&
          asset.pathname.startsWith("/storage/v1/object/public/"),
      )
    );
  } catch {
    return false;
  }
}

function isAllowedMockAssetUrl(value: string, origin: string) {
  try {
    const asset = new URL(value);
    return asset.origin === origin && asset.pathname === "/api/designer/mock";
  } catch {
    return false;
  }
}

function mockSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function mockIdentity(previousAssetUrl?: string) {
  if (!previousAssetUrl) return null;
  try {
    const params = new URL(previousAssetUrl).searchParams;
    const seed = params.get("seed");
    if (!seed) return null;
    return { seed, variant: params.get("variant") || "" };
  } catch {
    return null;
  }
}

function toError(code: string, message: string, status = 500) {
  return Object.assign(new Error(message), { code, status });
}

async function requestOpenAiImage(
  input: z.infer<typeof schema>,
  signal: AbortSignal,
  origin: string,
) {
  const { imageModel } = getOpenAiConfig();
  const prompt = buildArtworkPrompt({
    garmentType: input.garmentType,
    designDescription: input.designDescription,
    teamName: input.teamName,
    colors: input.colors,
    style: input.style,
    view: input.view,
    sport: input.sport,
    mode: input.mode,
    correction: input.correction,
    previousAssetUrl: input.previousAssetUrl,
    inspiration: input.inspiration,
    hasLogo: input.hasLogo,
    layout: input.layout,
  });

  // Landscape: every concept render shows the front and back presentation side by side.
  const size = "1536x1024";

  const base = {
    model: imageModel,
    prompt,
    size,
    quality: "medium",
    background: "transparent",
    output_format: "png",
  };

  const needsEdit =
    Boolean(input.previousAssetUrl) &&
    (input.mode === "refine" || input.mode === "color_variation" || Boolean(input.correction));

  if (needsEdit && input.previousAssetUrl) {
    if (!isAllowedAssetUrl(input.previousAssetUrl, origin)) {
      throw toError("invalid_previous_asset", "The previous artwork URL is not a permitted storage asset.", 400);
    }
    const previous = await fetch(input.previousAssetUrl, { signal, cache: "no-store" });
    if (!previous.ok) throw toError("invalid_previous_asset", "The previous design could not be loaded for correction.", 400);
    const bytes = await previous.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      throw toError("invalid_previous_asset", "The previous design is too large to edit.", 400);
    }
    if (!previous.headers.get("content-type")?.toLowerCase().startsWith("image/png")) {
      throw toError("invalid_previous_asset", "The previous design is not a PNG asset.", 400);
    }
    const form = new FormData();
    form.append("model", base.model);
    form.append("prompt", prompt);
    form.append("size", base.size);
    form.append("quality", base.quality);
    form.append("background", base.background);
    form.append("output_format", base.output_format);
    form.append(
      "image",
      new Blob([bytes], { type: previous.headers.get("content-type") || "image/png" }),
      "previous-design.png",
    );
    return fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
      signal,
    });
  }

  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(base),
    signal,
  });
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "The design request is too large.", code: "body_too_large" }, { status: 413 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  cleanup(now);
  const recent = usage.get(ip) || [];
  // One concept set uses four requests. Keep a bounded budget for regeneration + refinement.
  if (recent.length >= MAX_GENERATIONS_PER_MINUTE) {
    return NextResponse.json({ error: "Too many generations. Try again in one minute.", code: "rate_limited" }, { status: 429 });
  }
  usage.set(ip, [...recent, now]);

  try {
    const input = schema.parse(await req.json());
    const duplicate = requests.get(input.requestId);
    if (duplicate?.response) return NextResponse.json(duplicate.response);
    if (duplicate) {
      return NextResponse.json({ error: "This design is already generating.", code: "duplicate" }, { status: 409 });
    }
    requests.set(input.requestId, { at: now });

    const id = crypto.randomUUID();
    const { mockAi } = assertOpenAiConfigured();

    if (mockAi) {
      if (
        input.previousAssetUrl &&
        !isAllowedMockAssetUrl(input.previousAssetUrl, req.nextUrl.origin) &&
        !isAllowedAssetUrl(input.previousAssetUrl, req.nextUrl.origin)
      ) {
        throw toError("invalid_previous_asset", "The previous mock artwork URL is not valid.", 400);
      }
      const colors = input.colors || { primary: "#101820", secondary: "#00A3FF", accent: "#FFFFFF" };
      // An edit inherits the garment identity of the render it is editing, so refinements and
      // recolours visibly keep the selected concept instead of becoming a new design.
      const inherited = mockIdentity(input.previousAssetUrl);
      const identity = inherited || {
        seed: mockSeed(input.designDescription),
        variant: String(input.conceptIndex ?? ""),
      };
      const mock = {
        id,
        assetUrl: `${req.nextUrl.origin}/api/designer/mock?primary=${encodeURIComponent(colors.primary)}&secondary=${encodeURIComponent(colors.secondary)}&accent=${encodeURIComponent(colors.accent)}&view=${input.view}&seed=${identity.seed}&variant=${identity.variant}&rev=${id.slice(0, 8)}&team=${encodeURIComponent(input.teamName.slice(0, 18))}`,
        createdAt: new Date().toISOString(),
        mock: true,
        mode: input.mode,
        colors,
        prompt: buildArtworkPrompt({ ...input, colors }),
      };
      requests.set(input.requestId, { at: now, response: mock });
      return NextResponse.json(mock);
    }

    if (!prefersLocalAssetStorage()) {
      try {
        assertStorageConfiguration();
      } catch (error) {
        if (process.env.NODE_ENV !== "development") throw error;
      }
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);
    let upstream: Response;
    try {
      upstream = await requestOpenAiImage(input, controller.signal, req.nextUrl.origin);
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      const e = (await upstream.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
      const upstreamMessage = e.error?.message || "";
      const billingBlocked =
        e.error?.code === "insufficient_quota" || /billing|credit|quota/i.test(upstreamMessage);
      const invalidKey =
        upstream.status === 401 || /incorrect api key|invalid.?api.?key|authentication/i.test(upstreamMessage);
      const code = billingBlocked
        ? "insufficient_quota"
        : invalidKey
          ? "invalid_openai_key"
          : upstream.status === 429
            ? "rate_limited"
            : e.error?.code || "upstream_error";
      const message =
        code === "insufficient_quota"
          ? "OpenAI image generation is not available because billing or credits are not active."
          : code === "invalid_openai_key"
            ? "OpenAI rejected the API key. Update OPENAI_API_KEY in .env / .env.local (no quotes), then restart the dev server."
            : code === "rate_limited"
              ? "Too many generation requests. Please wait a moment and try again."
              : e.error?.message || "Image generation failed.";
      const status =
        upstream.status === 429
          ? 429
          : upstream.status === 400
            ? 400
            : invalidKey
              ? 401
              : 502;
      return NextResponse.json({ error: message, code }, { status });
    }

    const data = (await upstream.json()) as { data?: { b64_json?: string }[] };
    const encoded = data.data?.[0]?.b64_json;
    if (!encoded) throw new Error("The image service returned no artwork.");

    const stored = await storeGeneratedAsset(Uint8Array.from(Buffer.from(encoded, "base64")), id, {
      publicOrigin: req.nextUrl.origin,
    });
    const response = {
      id,
      assetUrl: stored.url,
      storagePath: stored.path,
      createdAt: new Date().toISOString(),
      mock: false,
      localAsset: Boolean(stored.local),
      mode: input.mode,
      colors: input.colors || null,
    };
    requests.set(input.requestId, { at: now, response });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please check the design details.", fields: error.flatten().fieldErrors, code: "invalid_input" },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Generation timed out. Please try a simpler request.", code: "generation_timeout" },
        { status: 504 },
      );
    }
    const typed = error as Error & { code?: string; status?: number };
    const status = typed.status || 500;
    if (status >= 500) {
      console.error("Designer generation failed", {
        code: typed.code || "generation_failed",
        message: typed.message || "Unknown error",
      });
    }
    return NextResponse.json(
      { error: typed.message || "Generation failed.", code: typed.code || "generation_failed" },
      { status },
    );
  }
}
