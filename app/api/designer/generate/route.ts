import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildArtworkPrompt } from "@/lib/designer/openai-service";
import { assertStorageConfiguration, storeGeneratedAsset } from "@/lib/designer/storage-service";

export const maxDuration = 120;
const schema = z.object({
  garmentType: z.enum(["jersey", "shorts", "uniform"]), designDescription: z.string().trim().min(8).max(800),
  teamName: z.string().trim().min(1).max(60), colors: z.object({ primary: z.string().regex(/^#[0-9a-f]{6}$/i), secondary: z.string().regex(/^#[0-9a-f]{6}$/i), accent: z.string().regex(/^#[0-9a-f]{6}$/i) }),
  style: z.string().trim().min(1).max(40).default("modern"), view: z.enum(["front", "back"]), correction: z.string().trim().max(400).optional(), previousAssetUrl: z.string().url().max(2000).optional(), requestId: z.string().uuid(),
}).superRefine((value, ctx) => {
  if (value.correction && !value.previousAssetUrl) ctx.addIssue({ code: "custom", path: ["previousAssetUrl"], message: "A previous artwork URL is required for a correction." });
});
const requests = new Map<string, { at: number; response?: unknown }>();
const usage = new Map<string, number[]>();
const REQUEST_TTL = 15 * 60_000;
const USAGE_TTL = 60_000;

function cleanup(now: number) {
  for (const [key, entry] of requests) if (now - entry.at > REQUEST_TTL) requests.delete(key);
  for (const [key, entries] of usage) {
    const active = entries.filter((time) => now - time < USAGE_TTL);
    if (active.length) usage.set(key, active); else usage.delete(key);
  }
  if (requests.size > 2000) {
    const oldest = [...requests.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, requests.size - 2000);
    for (const [key] of oldest) requests.delete(key);
  }
}

function isAllowedAssetUrl(value: string) {
  try {
    const asset = new URL(value);
    const storage = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
    return asset.protocol === "https:" && Boolean(storage && asset.hostname === storage.hostname && asset.port === storage.port && asset.pathname.startsWith("/storage/v1/object/public/"));
  } catch { return false; }
}

async function requestOpenAiImage(input: z.infer<typeof schema>, signal: AbortSignal) {
  const prompt = buildArtworkPrompt(input);
  const base = { model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1", prompt, size: "1024x1024", quality: "medium", background: "transparent", output_format: "png" };
  if (input.correction && input.previousAssetUrl) {
    if (!isAllowedAssetUrl(input.previousAssetUrl)) throw new Error("The previous artwork URL is not a permitted storage asset.");
    const previous = await fetch(input.previousAssetUrl, { signal, cache: "no-store" });
    if (!previous.ok) throw new Error("The previous design could not be loaded for correction.");
    const bytes = await previous.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("The previous design is too large to edit.");
    if (!previous.headers.get("content-type")?.toLowerCase().startsWith("image/png")) throw new Error("The previous design is not a PNG asset.");
    const form = new FormData();
    form.append("model", base.model); form.append("prompt", prompt); form.append("size", base.size);
    form.append("quality", base.quality); form.append("background", base.background); form.append("output_format", base.output_format);
    form.append("image", new Blob([bytes], { type: previous.headers.get("content-type") || "image/png" }), "previous-design.png");
    return fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form, signal });
  }
  return fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(base), signal });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now(); cleanup(now); const recent = usage.get(ip) || [];
  if (recent.length >= 5) return NextResponse.json({ error: "Too many generations. Try again in one minute.", code: "rate_limit" }, { status: 429 });
  usage.set(ip, [...recent, now]);
  try {
    const input = schema.parse(await req.json());
    const duplicate = requests.get(input.requestId);
    if (duplicate?.response) return NextResponse.json(duplicate.response);
    if (duplicate) return NextResponse.json({ error: "This design is already generating.", code: "duplicate" }, { status: 409 });
    requests.set(input.requestId, { at: now });
    const id = crypto.randomUUID();
    if (process.env.DESIGNER_MOCK_AI === "true") {
      const mock = { id, assetUrl: `/api/designer/mock?primary=${encodeURIComponent(input.colors.primary)}&secondary=${encodeURIComponent(input.colors.secondary)}`, createdAt: new Date().toISOString(), mock: true };
      requests.set(input.requestId, { at: now, response: mock }); return NextResponse.json(mock);
    }
    if (!process.env.OPENAI_API_KEY?.trim()) throw Object.assign(new Error("AI generation is not configured. Set OPENAI_API_KEY or enable DESIGNER_MOCK_AI for development."), { code: "missing_openai_key", status: 503 });
    assertStorageConfiguration();
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 110_000);
    let upstream: Response;
    try { upstream = await requestOpenAiImage(input, controller.signal); } finally { clearTimeout(timeout); }
    if (!upstream.ok) { const e = await upstream.json().catch(() => ({})) as { error?: { message?: string; code?: string } }; const status = upstream.status === 429 ? 429 : upstream.status === 400 ? 400 : upstream.status === 401 ? 502 : 502; return NextResponse.json({ error: e.error?.message || "Image generation failed.", code: e.error?.code || "upstream_error" }, { status }); }
    const data = await upstream.json() as { data?: { b64_json?: string }[] }; const encoded = data.data?.[0]?.b64_json;
    if (!encoded) throw new Error("The image service returned no artwork.");
    const stored = await storeGeneratedAsset(Uint8Array.from(Buffer.from(encoded, "base64")), id);
    const response = { id, assetUrl: stored.url, storagePath: stored.path, createdAt: new Date().toISOString(), mock: false };
    requests.set(input.requestId, { at: now, response }); return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check the design details.", fields: error.flatten().fieldErrors, code: "invalid_input" }, { status: 400 });
    if (error instanceof Error && error.name === "AbortError") return NextResponse.json({ error: "Generation timed out. Please try a simpler request.", code: "timeout" }, { status: 504 });
    const typed = error as Error & { code?: string; status?: number };
    const status = typed.status || 500;
    if (status >= 500) console.error("Designer generation failed", { code: typed.code || "generation_failed", message: typed.message || "Unknown error" });
    return NextResponse.json({ error: typed.message || "Generation failed.", code: typed.code || "generation_failed" }, { status });
  }
}
