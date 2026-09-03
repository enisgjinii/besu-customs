/**
 * BESU AI designer verification harness.
 * Run: node scripts/verify-designer-2d.mjs
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "..");

function loadTypeScriptModule(relativePath, dependencies = {}) {
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const requireDependency = (specifier) => {
    if (specifier in dependencies) return dependencies[specifier];
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const resolved = path.normalize(path.join(path.dirname(sourcePath), specifier + (specifier.endsWith(".ts") ? "" : ".ts")));
      const alt = resolved.endsWith(".ts") ? resolved : resolved + ".ts";
      const file = fs.existsSync(alt) ? alt : resolved.replace(/\.ts$/, "") + ".tsx";
      if (fs.existsSync(file) || fs.existsSync(alt)) {
        return loadTypeScriptModule(path.relative(root, fs.existsSync(alt) ? alt : file), dependencies);
      }
    }
    throw new Error(`Unexpected dependency in ${relativePath}: ${specifier}`);
  };
  new Function("require", "module", "exports", compiled)(requireDependency, module, module.exports);
  return module.exports;
}

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) }); }
}

const openai = loadTypeScriptModule("lib/designer/openai-service.ts");
const parser = loadTypeScriptModule("lib/designer/brief-parser.ts");
const typography = loadTypeScriptModule("lib/designer/typography.ts");
const pathMock = Object.assign(path, { default: path });
const storage = loadTypeScriptModule("lib/designer/storage-service.ts", {
  path: pathMock,
  "node:path": pathMock,
  "node:fs/promises": { mkdir: async () => {}, writeFile: async () => {} },
});

test("brief parser preserves exact team wording and recognizes text-only edits", () => {
  assert.equal(
    parser.extractTeamName("Show me a basketball uniform for a team called St. Agnes", ""),
    "St. Agnes",
  );
  assert.equal(parser.extractTeamName("change team name to Besu Elite", "OLD"), "Besu Elite");
  assert.equal(parser.isTeamNameOnlyEdit("Change team name to Besu Elite"), true);
  assert.equal(parser.isTeamNameOnlyEdit("Change team name to Besu Elite and add flames"), false);
  assert.deepEqual(
    parser.extractColors("using the colors white black and gray"),
    { primary: "#0D0D0D", secondary: "#FFFFFF", accent: "#6B6B6B" },
  );
  assert.equal(parser.isFreshGenerateRequest("make the trim thinner", true), false);
  assert.equal(parser.isFreshGenerateRequest("Generate a completely new uniform design", true), true);
});

test("AI prompt creates one standardized front-left/back-right master concept", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "GALACTIC basketball uniform, outer space moon and comets",
    teamName: "GALACTIC",
    style: "aggressive",
    view: "front",
    sport: "Basketball",
    mode: "generate",
  });
  assert.match(prompt, /1536x1024 landscape master board/i);
  assert.match(prompt, /LEFT half is the FRONT/i);
  assert.match(prompt, /RIGHT half is the BACK/i);
  assert.match(prompt, /same physical uniform/i);
  assert.match(prompt, /same scale, camera height, lighting, cut/i);
  assert.match(prompt, /front centered near x=384/i);
  assert.match(prompt, /back centered near x=1152/i);
});

test("AI prompt never asks the image model to paint customer wording", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "GALACTIC basketball uniform with GALACTIC on the chest, black blue white",
    inspiration: "Use the GALACTIC identity with premium energy",
    teamName: "GALACTIC",
    style: "modern",
    view: "front",
    sport: "Basketball",
    mode: "generate",
    hasLogo: true,
  });
  assert.doesNotMatch(prompt, /GALACTIC/i, "the literal customer wordmark must not reach the image prompt");
  assert.match(prompt, /draw NO customer typography/i);
  assert.match(prompt, /NO.*team name/i);
  assert.match(prompt, /pseudo-letters/i);
  assert.match(prompt, /fake writing/i);
  assert.match(prompt, /reserve a calm, low-detail chest area/i);
  assert.match(prompt, /reserve a calm player-name zone/i);
  assert.match(prompt, /approved uploaded logo is composited by the application/i);
  assert.match(prompt, /NO manufacturer, sponsor or third-party brand mark/i);
  assert.match(prompt, /Do not invent a team crest/i);
  assert.match(prompt, /zero rendered typography/i);
});

test("color variation is an edit with geometry lock, not a redesign", () => {
  const colors = { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" };
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "GALACTIC space kit",
    teamName: "GALACTIC",
    style: "modern",
    view: "front",
    mode: "color_variation",
    colors,
    correction: openai.buildColorVariationCorrection(colors),
  });
  assert.match(prompt, /COLOR VARIATION MODE/i);
  assert.match(prompt, /LOCK THE DESIGN GEOMETRY/i);
  assert.match(prompt, /Only remap the existing design/i);
  assert.match(prompt, /Do not add, remove, move, rotate, resize or reinterpret/i);
  assert.match(prompt, /Preserve the blank front chest typography zone/i);
  assert.match(prompt, /#00A3FF/);
  assert.doesNotMatch(prompt, /GALACTIC/i);
});

test("refinement keeps front/back synchronized and typography zones blank", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "GALACTIC space kit",
    teamName: "GALACTIC",
    style: "modern",
    view: "front",
    mode: "refine",
    correction: "make the comet motif sharper",
  });
  assert.match(prompt, /REFINEMENT MODE/i);
  assert.match(prompt, /supplied master uniform board/i);
  assert.match(prompt, /Change only what this instruction requires/i);
  assert.match(prompt, /Keep front and back synchronized/i);
  assert.match(prompt, /blank back player-name\/number zones/i);
  assert.doesNotMatch(prompt, /GALACTIC/i);
});

test("deterministic typography preserves literal text and separates front/back roles", () => {
  assert.equal(typography.normalizeExactOverlayText("St. Agnes & Co.", 60), "St. Agnes & Co.");
  assert.equal(typography.normalizeExactOverlayText("Müller 24", 60), "Müller 24");
  assert.deepEqual(typography.allowedTypographyRoles("front"), ["teamName"]);
  assert.deepEqual(typography.allowedTypographyRoles("back"), ["playerName", "number"]);

  const front = typography.getTypographyPlacement("teamName", "St. Agnes", "board");
  const backName = typography.getTypographyPlacement("playerName", "Bryant", "board");
  const backNumber = typography.getTypographyPlacement("number", "24", "board");
  assert.equal(front.text, "St. Agnes");
  assert.equal(backName.text, "Bryant");
  assert.equal(backNumber.text, "24");
  assert.ok(front.x < typography.AI_MASTER_BOARD.viewWidth, "team name must stay in front/left half");
  assert.ok(backName.x > typography.AI_MASTER_BOARD.viewWidth, "player name must stay in back/right half");
  assert.ok(backNumber.x > typography.AI_MASTER_BOARD.viewWidth, "number must stay in back/right half");
});

test("production canvas uses deterministic SVG typography and true front/back crops", () => {
  const canvas = fs.readFileSync(path.join(root, "components/designer/garment-canvas.tsx"), "utf8");
  const overlay = fs.readFileSync(path.join(root, "components/designer/uniform-typography-overlay.tsx"), "utf8");
  const concepts = fs.readFileSync(path.join(root, "components/designer/concept-panel.tsx"), "utf8");
  assert.match(canvas, /AI_MASTER_BOARD\.viewWidth/);
  assert.match(canvas, /sourceX = s\.view === "front" \? 0 : -AI_MASTER_BOARD\.viewWidth/);
  assert.match(canvas, /UniformTypographyOverlay/);
  assert.match(canvas, /\["front", "back"\]/);
  assert.match(overlay, /data-deterministic-typography="true"/);
  assert.match(overlay, /role="teamName"/);
  assert.match(overlay, /role="playerName"/);
  assert.match(overlay, /role="number"/);
  assert.match(concepts, /view="board"/);
  assert.doesNotMatch(canvas, /onWheel|onPointerMove|dragBoundFunc|zoom/i, "preview should not require manual zoom/drag");
});

test("Shopify payload still carries exact team/player data separately from AI artwork", () => {
  const variants = loadTypeScriptModule("lib/shopify-variants.ts");
  const checkout = loadTypeScriptModule("lib/designer/shopify-service.ts", { "../shopify-variants": variants });
  const state = {
    designId: "design-galactic",
    productId: "basketball-uniform",
    garmentType: "uniform",
    sport: "Basketball",
    style: "aggressive",
    teamName: "St. Agnes",
    colors: { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" },
    artwork: {
      front: "https://app.example.com/api/designer/asset/2026-09-01/master.png",
      back: "https://app.example.com/api/designer/asset/2026-09-01/master.png",
    },
    logoUrl: "data:image/png;base64,AAAA",
    roster: [{ name: "Bryant", number: "24", topSize: "M", shortsSize: "L", quantity: 1 }],
    customer: { name: "QA", email: "qa@example.com", phone: "", notes: "" },
  };
  const payload = checkout.buildDesignerCheckoutPayload(state);
  const serialized = JSON.stringify(payload);
  assert.equal(payload.items[0].properties["Team name"], "St. Agnes");
  assert.equal(payload.items[0].properties["Player name"], "Bryant");
  assert.equal(payload.items[0].properties["Player number"], "24");
  assert.match(payload.items[0].properties["Front artwork URL"], /^https:\/\//);
  assert.doesNotMatch(serialized, /data:image|base64,AAAA/i);
});

test("designer asset URLs remain restricted to app assets or inline PNGs", () => {
  assert.equal(
    storage.isAllowedDesignerAssetUrl(
      "https://app.example.com/api/designer/asset/2026-09-01/test.png",
      "https://app.example.com",
    ),
    true,
  );
  assert.equal(
    storage.isAllowedDesignerAssetUrl("data:image/png;base64,iVBORw0KGgo=", "https://app.example.com"),
    true,
  );
  assert.equal(storage.isAllowedDesignerAssetUrl("https://evil.example.com/asset.png", "https://app.example.com"), false);
});

test("serverless storage returns inline PNG data URLs instead of disk paths", async () => {
  const saved = { VERCEL: process.env.VERCEL };
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
  try {
    process.env.VERCEL = "1";
    const stored = await storage.storeGeneratedAsset(png, "test-inline-asset", {
      publicOrigin: "https://app.example.com",
    });
    assert.equal(stored.inline, true);
    assert.match(stored.url, /^data:image\/png;base64,/);
  } finally {
    if (saved.VERCEL === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = saved.VERCEL;
  }
});

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
