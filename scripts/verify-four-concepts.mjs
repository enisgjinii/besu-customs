/**
 * Behavioural verification of the public four-concept customer flow.
 *
 * These tests execute the real production modules — the designer store, the generation
 * client and the generation hook that the UI actually calls — against a stubbed network.
 * They are written to fail if the four-concept infrastructure exists but the production
 * flow does not use it, which is the regression this suite previously could not detect.
 *
 * Run: node scripts/verify-four-concepts.mjs
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

// The store persists to localStorage in the browser; give it an in-memory equivalent here.
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
    sonner: { toast: { error: (m) => toasts.push(["error", m]), success: (m) => toasts.push(["success", m]), message: (m) => toasts.push(["message", m]) } },
  },
});

const { useDesignerStore } = load("lib/designer/store.ts");
const { useGenerationSession } = load("lib/designer/generation-session.ts");
const generationClient = load("lib/designer/generation-client.ts");
const hook = load("hooks/use-designer-generation.ts");
const { STEP_INDEX } = load("components/designer/designer-steps.ts");
const shopify = load("lib/designer/shopify-service.ts");

const BRIEF =
  "Sleeveless basketball uniform jersey and matching shorts for GALACTIC. Outer-space theme with a moon, comets and dynamic cosmic energy. Premium professional basketball presentation with black, electric blue and white.";

/** Records every generation request and answers like the mock-mode API route. */
function installFetchRecorder() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
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

function resetDesigner() {
  useDesignerStore.getState().reset();
  useGenerationSession.getState().reset();
  toasts.length = 0;
}

function seedBrief() {
  resetDesigner();
  useDesignerStore.getState().patch({ teamName: "GALACTIC", prompt: BRIEF });
}

// ---------------------------------------------------------------------------
// Fresh generation
// ---------------------------------------------------------------------------

await test("the production hook exposes exactly one canonical fresh-generation entry point", () => {
  assert.equal(typeof hook.generateConcepts, "function", "generateConcepts must be exported");
  assert.equal(hook.generateBoard, undefined, "the retired single-board entry point must be gone");
  assert.equal(
    generationClient.generateStudioBoard,
    undefined,
    "the retired single-board generator must be gone so it cannot be wired up again",
  );
});

await test("fresh generation issues one request per concept direction", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF);

  assert.equal(calls.length, 4, `expected 4 generation requests, received ${calls.length}`);
  for (const call of calls) {
    assert.equal(call.mode, "generate");
    assert.equal(call.layout, "kit");
    assert.equal(call.previousAssetUrl, undefined, "a fresh concept must not edit a previous render");
  }
  assert.deepEqual(
    calls.map((call) => call.conceptIndex),
    [0, 1, 2, 3],
    "each concept must be tagged with its position in the set",
  );
  const briefs = new Set(calls.map((call) => call.designDescription));
  assert.equal(briefs.size, 4, "each concept must be asked for a different art direction");
});

await test("fresh generation stores four distinct concepts with complete metadata", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);

  const { concepts } = useDesignerStore.getState();
  assert.equal(concepts.length, 4, `expected 4 stored concepts, found ${concepts.length}`);
  assert.deepEqual(
    concepts.map((concept) => concept.id),
    ["cosmic-energy", "velocity-cut", "heritage-court", "elite-minimal"],
  );
  assert.deepEqual(
    concepts.map((concept) => concept.label),
    ["Cosmic Energy", "Velocity Cut", "Heritage Court", "Elite Minimal"],
  );
  for (const concept of concepts) {
    for (const field of ["id", "label", "direction", "prompt", "assetUrl", "colors", "createdAt", "designId"]) {
      assert.ok(concept[field] !== undefined && concept[field] !== "", `concept ${concept.id} is missing ${field}`);
    }
    assert.equal(typeof concept.colorsEnabled, "boolean");
  }
  assert.equal(new Set(concepts.map((c) => c.assetUrl)).size, 4, "concepts must not share one render");
  assert.equal(new Set(concepts.map((c) => c.designId)).size, 4, "each concept needs its own design id");
});

await test("fresh generation never auto-selects a concept and leaves downstream steps locked", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);

  const state = useDesignerStore.getState();
  assert.equal(state.selectedConceptId, undefined, "no concept may be selected automatically");
  assert.equal(state.artwork.front, undefined, "artwork must stay empty until the customer chooses");
  assert.equal(state.artwork.back, undefined);
  assert.equal(state.designId, undefined, "designId must stay empty until the customer chooses");
  assert.deepEqual(state.history, []);
  assert.equal(
    state.activeStep,
    STEP_INDEX.concepts,
    "the customer must land on the Choose step, not past it",
  );
  for (const step of ["refine", "roster", "order"]) {
    assert.ok(STEP_INDEX[step] > state.activeStep, `${step} must be downstream of Choose`);
  }
});

await test("refine, roster and order are unreachable without a selection", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);

  const before = { ...useDesignerStore.getState().artwork };
  toasts.length = 0;
  await hook.refineCurrent("Make the blue more electric.");
  assert.deepEqual(useDesignerStore.getState().artwork, before, "refinement must be refused without a selection");
  assert.ok(
    toasts.some(([, message]) => /choose one of the concepts/i.test(message)),
    "the customer must be told to choose a concept first",
  );

  const errors = shopify.validateCheckout(useDesignerStore.getState());
  assert.ok(errors.some((e) => /Generate artwork/i.test(e)), "checkout must be blocked without a selected design");
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

await test("selecting a concept promotes exactly that concept into the live design", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);

  const store = useDesignerStore.getState();
  const target = store.concepts[2];
  store.selectConcept(target.id);

  const state = useDesignerStore.getState();
  assert.equal(state.selectedConceptId, target.id);
  assert.equal(state.artwork.front, target.assetUrl);
  assert.equal(state.artwork.back, target.assetUrl);
  assert.equal(state.designId, target.designId);
  assert.deepEqual(state.colors, target.colors);
  assert.equal(state.concepts.length, 4, "the other concepts must remain available");
});

await test("switching selection replaces the previous concept without leaking its state", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);

  const concepts = useDesignerStore.getState().concepts;
  useDesignerStore.getState().selectConcept(concepts[0].id);
  const first = { ...useDesignerStore.getState() };
  useDesignerStore.getState().selectConcept(concepts[3].id);
  const second = useDesignerStore.getState();

  assert.equal(second.selectedConceptId, concepts[3].id);
  assert.equal(second.artwork.front, concepts[3].assetUrl);
  assert.notEqual(second.artwork.front, first.artwork.front);
  assert.equal(second.designId, concepts[3].designId);
  assert.deepEqual(second.history, [], "version history must not carry over from the previous concept");
  assert.equal(second.correction, "");
});

// ---------------------------------------------------------------------------
// Refinement and colour variation
// ---------------------------------------------------------------------------

await test("refinement edits the selected render and keeps the concept identity", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  const selected = useDesignerStore.getState().concepts[0];
  useDesignerStore.getState().selectConcept(selected.id);
  const baseline = useDesignerStore.getState().artwork.front;

  await hook.refineCurrent("Add a moon detail near the lower jersey.");

  const refineCall = calls.at(-1);
  assert.equal(refineCall.mode, "refine", "the request must be an edit, not a new generation");
  assert.equal(refineCall.previousAssetUrl, baseline, "the selected render must be supplied as the edit source");
  assert.match(refineCall.correction, /moon detail/i);

  const state = useDesignerStore.getState();
  assert.notEqual(state.artwork.front, baseline, "artwork must advance to the refined render");
  assert.equal(state.selectedConceptId, selected.id, "refinement must not change the selected direction");
  assert.equal(state.designId, selected.designId, "the selected design id must survive refinement");
  assert.equal(state.history.length, 1, "the refined version must be recorded");
});

await test("colour variation recolours the current render without starting a new design", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  const selected = useDesignerStore.getState().concepts[1];
  useDesignerStore.getState().selectConcept(selected.id);

  const previous = useDesignerStore.getState().artwork.front;
  const palette = { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" };
  await hook.refineCurrent("Apply this palette.", palette);

  const call = calls.at(-1);
  assert.equal(call.mode, "color_variation");
  assert.equal(call.previousAssetUrl, previous, "the recolour must edit the current render");
  assert.deepEqual(call.colors, palette);
  assert.match(call.correction, /#00A3FF/i);
  assert.deepEqual(useDesignerStore.getState().colors, palette);
  assert.equal(useDesignerStore.getState().selectedConceptId, selected.id);
});

await test("a follow-up studio prompt refines instead of regenerating once a concept is chosen", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);
  const countAfterSet = calls.length;

  await hook.submitStudioPrompt("Make the blue more electric and reduce the amount of white.");

  assert.equal(calls.length, countAfterSet + 1, "an edit must cost one request, not a new four-concept set");
  assert.equal(calls.at(-1).mode, "refine");
  assert.equal(useDesignerStore.getState().concepts.length, 4, "the concept set must be preserved");
});

await test("an explicit request for a new set regenerates four concepts", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);
  const countAfterSet = calls.length;

  await hook.submitStudioPrompt("Generate a completely new uniform design set with a lightning theme.");

  assert.equal(calls.length, countAfterSet + 4, "a fresh set must cost four requests");
  assert.equal(useDesignerStore.getState().selectedConceptId, undefined, "a new set must clear the old selection");
});

// ---------------------------------------------------------------------------
// Downstream: roster, checkout, cost safety
// ---------------------------------------------------------------------------

await test("the selected design survives roster entry and reaches the checkout payload", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  const selected = useDesignerStore.getState().concepts[0];
  useDesignerStore.getState().selectConcept(selected.id);
  await hook.refineCurrent("Add a moon detail near the lower jersey.");
  const refined = useDesignerStore.getState().artwork.front;

  const store = useDesignerStore.getState();
  store.addPlayer();
  const first = useDesignerStore.getState().roster[0];
  store.updatePlayer(first.id, { name: "Bryant", number: "24", topSize: "XL", shortsSize: "XL", quantity: 2 });
  useDesignerStore.getState().addPlayer();
  const second = useDesignerStore.getState().roster[1];
  useDesignerStore.getState().updatePlayer(second.id, { name: "Carter", number: "8", topSize: "L", shortsSize: "M", quantity: 3 });
  useDesignerStore.getState().patch({
    customer: { name: "Michael", email: "michael@example.com", phone: "", notes: "Rush" },
  });

  const state = useDesignerStore.getState();
  assert.equal(state.roster.length, 2, "roster rows must not merge");
  assert.deepEqual(shopify.validateCheckout(state), [], "a complete order must pass validation");

  const payload = shopify.buildDesignerCheckoutPayload(state);
  assert.equal(payload.designId, selected.designId, "the selected design id must reach checkout");
  assert.equal(payload.context.artwork.front, refined, "checkout must carry the refined render, not the original");
  assert.equal(payload.items.length, 2);
  assert.deepEqual(payload.items.map((item) => item.quantity), [2, 3]);
  for (const item of payload.items) {
    assert.ok(item.variant_id, "every line item needs a mapped Shopify variant id");
    assert.equal(item.properties["_Design ID"], selected.designId);
    assert.equal(item.properties["Front artwork URL"], refined);
  }
  assert.deepEqual(payload.items.map((i) => i.properties["Player number"]), ["24", "8"]);
  assert.doesNotMatch(JSON.stringify(payload), /data:image|base64/i, "no inline artwork may enter Shopify properties");
});

await test("an unmapped size blocks checkout", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);
  const store = useDesignerStore.getState();
  store.addPlayer();
  const player = useDesignerStore.getState().roster[0];
  useDesignerStore.getState().updatePlayer(player.id, { name: "Bryant", number: "24", topSize: "4XL", quantity: 1 });
  useDesignerStore.getState().patch({ customer: { name: "Michael", email: "michael@example.com", phone: "", notes: "" } });

  const errors = shopify.validateCheckout(useDesignerStore.getState());
  assert.ok(errors.length > 0, "an unmapped size must block checkout");
});

await test("changing product resets the design so a stale concept cannot be ordered", async () => {
  seedBrief();
  installFetchRecorder();
  await hook.generateConcepts(BRIEF);
  useDesignerStore.getState().selectConcept(useDesignerStore.getState().concepts[0].id);

  useDesignerStore.getState().selectProduct("basketball-jersey");
  const state = useDesignerStore.getState();
  assert.deepEqual(state.concepts, []);
  assert.equal(state.selectedConceptId, undefined);
  assert.equal(state.designId, undefined);
  assert.deepEqual(state.artwork, {});
});

await test("a concurrent generation request is refused so a set cannot be double-charged", async () => {
  seedBrief();
  const calls = installFetchRecorder();
  await Promise.all([hook.generateConcepts(BRIEF), hook.generateConcepts(BRIEF)]);
  assert.equal(calls.length, 4, `a duplicate submit must not add requests (saw ${calls.length})`);
  assert.equal(useDesignerStore.getState().concepts.length, 4);
});

// ---------------------------------------------------------------------------
// Prompt contract and single-source wiring
// ---------------------------------------------------------------------------

await test("the AI prompt contract still demands a finished wearable uniform", () => {
  const { buildArtworkPrompt } = load("lib/designer/openai-service.ts");
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
  assert.match(prompt, /sleeveless jersey plus matching shorts/i);
  assert.match(prompt, /FRONT and BACK presentations/i);
  assert.match(prompt, /GALACTIC/);
  for (const forbidden of [
    /flat sublimation texture, UV map/i,
    /No person, body, mannequin, hanger, stadium/i,
  ]) {
    assert.match(prompt, forbidden);
  }
  assert.doesNotMatch(prompt, /THREE distinct labeled designs/i, "the retired three-design board wording must be gone");
});

await test("both customer entry points route through the canonical generation flow", () => {
  const promptPanel = fs.readFileSync(path.join(ROOT, "components/designer/prompt-panel.tsx"), "utf8");
  const promptBar = fs.readFileSync(path.join(ROOT, "components/designer/studio-prompt-bar.tsx"), "utf8");
  const generationHook = fs.readFileSync(path.join(ROOT, "hooks/use-designer-generation.ts"), "utf8");

  assert.match(promptPanel, /generateConcepts\(/, "the brief panel must call the canonical flow");
  assert.match(promptBar, /submitPrompt\(/, "the studio bar must call the canonical router");
  assert.match(generationHook, /generateConceptSet/, "the hook must use the four-concept generator");
  assert.doesNotMatch(promptPanel, /generateStudioBoard|generateBoard/);
  assert.doesNotMatch(promptBar, /generateStudioBoard|generateBoard/);
  assert.doesNotMatch(generationHook, /generateStudioBoard/);
});

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
