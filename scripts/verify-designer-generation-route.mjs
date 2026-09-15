import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app/api/designer/generate/route.ts"), "utf8");
const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

assert.match(source, /export const maxDuration = 300;/,
  "the generation route must allow complex GPT Image renders to finish");
assert.match(source, /const OPENAI_IMAGE_TIMEOUT_MS = 240_000;/,
  "the OpenAI timeout must leave storage headroom inside the function budget");
assert.equal(
  vercelConfig.functions["app/api/designer/generate/route.ts"].maxDuration,
  300,
  "Vercel must not override the generation route with the old 120-second ceiling",
);

const parsedAt = source.indexOf("const parsed = schema.safeParse(rawInput)");
const duplicateAt = source.indexOf("const duplicate = requests.get(input.requestId)");
const rateLimitAt = source.indexOf("if (recent.length >= MAX_GENERATIONS_PER_MINUTE)");
const reserveAt = source.indexOf("requests.set(input.requestId, { at: now });");

assert.ok(parsedAt >= 0, "generation input must be schema-validated");
assert.ok(duplicateAt > parsedAt, "idempotency must be checked after validation");
assert.ok(rateLimitAt > duplicateAt, "duplicate retries must not consume another rate-limit slot");
assert.ok(reserveAt > rateLimitAt, "request id must only be reserved after validation and rate limiting");

assert.match(
  source,
  /catch \{\s*return NextResponse\.json\(\s*\{ error: "Please check the design details\.", code: "invalid_input" \}/s,
  "malformed JSON must return a client error instead of a server error",
);

const clearCalls = [...source.matchAll(/clearPendingRequest\(input\.requestId\);/g)];
assert.ok(clearCalls.length >= 2, "failed generation paths must release the pending request id");

const upstreamFailure = source.indexOf("if (!upstream.ok)");
const upstreamClear = source.indexOf("clearPendingRequest(input.requestId);", upstreamFailure);
const upstreamReturn = source.indexOf("return NextResponse.json({ error: message, code }, { status });", upstreamFailure);
assert.ok(upstreamFailure >= 0 && upstreamClear > upstreamFailure && upstreamClear < upstreamReturn,
  "OpenAI failures must release request id before returning");

const catchAt = source.lastIndexOf("} catch (error) {");
const catchClear = source.indexOf("clearPendingRequest(input.requestId);", catchAt);
assert.ok(catchAt >= 0 && catchClear > catchAt, "exceptions/timeouts/storage failures must release request id");

console.log(JSON.stringify({
  passed: 10,
  failed: 0,
  checks: [
    "schema validation precedes request accounting",
    "idempotency precedes rate limiting",
    "request reservation happens after guards",
    "malformed JSON returns 400 invalid_input",
    "failed paths clear pending request ids",
    "OpenAI non-2xx responses are retryable",
    "exceptions/timeouts/storage failures are retryable",
    "route budget supports complex image renders",
    "upstream timeout leaves storage headroom",
    "Vercel duration matches the route budget",
  ],
}, null, 2));
