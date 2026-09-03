/**
 * Behavioural verification for the hybrid BESU designer flow.
 * Executes the real store/generation hook against a stubbed generation API.
 * Run: node scripts/verify-hybrid-designer-flow.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createLoader, ROOT } from "./lib/ts-loader.mjs";

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => void memory.set(key, String(value)),
  removeItem: (key) => void memory.delete(key),
  clear: () => memory.clear(),
};

const toasts = [];
const load = createLoader({
  stubs: {
    sonner: {
      toast: {
        error: (message) => toasts.push(["error", message]),
        success: (message) => toasts.push(["success", message]),
        message: (message) => toasts.push(["message", message]),
      },
    },
  },
});

const { useDesignerStore } = load("lib/designer/store.ts");
const { useGenerationSession } = load("lib/designer/generation-session.ts");
const hook = load("hooks/use-designer-generation.ts");
const { STEP_INDEX } = load("components/designer/designer-steps.ts");
const { buildArtworkPrompt } = load("lib/designer/openai-service.ts");
const shopify = load("lib/designer/shopify-service.ts");

const BRIEF =
  "Sleeveless basketball uniform jersey and matching shorts for GALACTIC. Outer-space theme with a moon, comets and dynamic cosmic energy. Premium professional basketball presentation with black, electric blue and white.";

function installFetchRecorder() {
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    const identity = body.previousAssetUrl
      ? new URL(body.previousAssetUrl).searchParams.get("variant")
      : String(body.conceptIndex ?? "");
    return {
      ok: true,
      json: async () => ({
        id: `asset-${calls.length}`,
        assetUrl: `http://localhost:3000/api/designer/mock?variant=${identity}&call=${calls.length}`,
        createdAt: new Date().toISOString(),
        mock: true,
        colors: body.colors || null,
      }),
    };
  };
  return calls;
}

function seedBrief() {
  useDesignerStore.getState().reset();
  useGenerationSession.getState().reset();
  toasts.length = 0;
  useDesignerStore.getState().patch({ teamName: "GALACTIC", prompt: BRIEF, conceptCount: 4 });
}

await test("four concepts use four requests and remain unselected until Choose", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  const state = useDesignerStore.getState();

  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map((call) => call.conceptIndex), [0, 1, 2, 3]);
  assert.equal(new Set(calls.map((call) => call.designDescription)).size, 4);
  assert.equal(state.concepts.length, 4);
  assert.equal(new Set(state.concepts.map((concept) => concept.assetUrl)).size, 4);
  assert.equal(state.selectedConceptId, undefined);
  assert.deepEqual(state.artwork, {});
  assert.equal(state.activeStep, STEP_INDEX.concepts);
  assert.ok(STEP_INDEX.refine > state.activeStep);
  assert.ok(STEP_INDEX.order > state.activeStep);
});

await test("selected front/back views derive from the same master concept", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  const target = useDesignerStore.getState().concepts[2];
  useDesignerStore.getState().selectConcept(target.id);
  const state = useDesignerStore.getState();

  assert.equal(state.selectedConceptId, target.id);
  assert.equal(state.artwork.front, target.assetUrl);
  assert.equal(state.artwork.back, target.assetUrl);
  assert.equal(state.designId, target.designId);
});

await test("refinement edits the selected master instead of regenerating a concept set", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  const selected = useDesignerStore.getState().concepts[0];
  useDesignerStore.getState().selectConcept(selected.id);
  const baseline = useDesignerStore.getState().artwork.front;
  const before = calls.length;

  await hook.refineCurrent("Make the comet motif sharper.");
  assert.equal(calls.length, before + 1);
  assert.equal(calls.at(-1).mode, "refine");
  assert.equal(calls.at(-1).previousAssetUrl, baseline);
  assert.equal(useDesignerStore.getState().selectedConceptId, selected.id);
  assert.equal(useDesignerStore.getState().designId, selected.designId);
});

await test("color variation is one reference-image edit and preserves concept identity", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  const selected = useDesignerStore.getState().concepts[1];
  useDesignerStore.getState().selectConcept(selected.id);
  const baseline = useDesignerStore.getState().artwork.front;
  const palette = { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" };
  const before = calls.length;

  await hook.refineCurrent("Apply this palette.", palette);
  assert.equal(calls.length, before + 1);
  assert.equal(calls.at(-1).mode, "color_variation");
  assert.equal(calls.at(-1).previousAssetUrl, baseline);
  assert.deepEqual(calls.at(-1).colors, palette);
  assert.equal(useDesignerStore.getState().selectedConceptId, selected.id);
});

await test("team-name-only changes are deterministic and spend no image call", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);
  const before = calls.length;

  await hook.submitStudioPrompt("Change team name to Besu Elite");
  assert.equal(calls.length, before, "typography-only change must not call image generation");
  assert.equal(useDesignerStore.getState().teamName, "Besu Elite");
  assert.ok(toasts.some(([, message]) => /no AI regeneration needed/i.test(message)));
});

await test("combined team-name and visual edits keep exact name while refining artwork", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);
  const baseline = useDesignerStore.getState().artwork.front;
  const before = calls.length;

  await hook.submitStudioPrompt("Change team name to Besu Elite and add flames");
  assert.equal(calls.length, before + 1);
  assert.equal(calls.at(-1).mode, "refine");
  assert.equal(calls.at(-1).previousAssetUrl, baseline);
  assert.equal(useDesignerStore.getState().teamName, "Besu Elite");
});

await test("AI prompt is artwork-only and withholds the literal customer wordmark", () => {
  const prompt = buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: BRIEF,
    teamName: "GALACTIC",
    style: "aggressive",
    view: "front",
    sport: "Basketball",
    mode: "generate",
  });

  assert.match(prompt, /FINISHED UNIFORM VISUALIZATION/i);
  assert.match(prompt, /1536x1024 landscape master board/i);
  assert.match(prompt, /LEFT half is the FRONT/i);
  assert.match(prompt, /RIGHT half is the BACK/i);
  assert.match(prompt, /same physical uniform/i);
  assert.match(prompt, /draw NO customer typography/i);
  assert.match(prompt, /pseudo-letters/i);
  assert.match(prompt, /zero rendered typography/i);
  assert.doesNotMatch(prompt, /GALACTIC/i);
});

await test("roster and checkout keep exact player data separate from master artwork", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF, 4);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);
  const store = useDesignerStore.getState();
  store.addPlayer();
  const player = useDesignerStore.getState().roster[0];
  store.updatePlayer(player.id, { name: "Bryant", number: "24", topSize: "L", shortsSize: "L", quantity: 1 });
  useDesignerStore.getState().patch({ customer: { name: "Michael", email: "michael@example.com", phone: "", notes: "" } });

  const state = useDesignerStore.getState();
  assert.deepEqual(shopify.validateCheckout(state), []);
  const payload = shopify.buildDesignerCheckoutPayload(state);
  assert.equal(payload.items[0].properties["Team name"], state.teamName);
  assert.equal(payload.items[0].properties["Player name"], "Bryant");
  assert.equal(payload.items[0].properties["Player number"], "24");
  assert.equal(payload.context.artwork.front, payload.context.artwork.back);
});

await test("desktop/mobile presentation uses responsive fixed-view UI without pan/zoom dependency", () => {
  const canvas = fs.readFileSync(path.join(ROOT, "components/designer/garment-canvas.tsx"), "utf8");
  const concepts = fs.readFileSync(path.join(ROOT, "components/designer/concept-panel.tsx"), "utf8");
  assert.match(canvas, /md:/, "canvas must retain responsive desktop breakpoints");
  assert.match(canvas, /\["front", "back"\]/, "front/back must be one-click controls");
  assert.doesNotMatch(canvas, /onWheel|onPointerMove|dragBoundFunc|zoom/i);
  assert.match(concepts, /grid-cols-2/, "concept choices must stay compact on mobile and desktop");
  assert.match(concepts, /aspect-\[3\/2\]/, "concept cards must preserve the standardized master-board aspect ratio");
  assert.match(concepts, /w-full/, "concept cards must fit the available viewport width");
});

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
