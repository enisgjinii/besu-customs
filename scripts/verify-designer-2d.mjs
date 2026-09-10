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
  assert.match(prompt, /EXACTLY TWO coordinated uniform presentations total/i);
  assert.match(prompt, /one FRONT kit in the LEFT half/i);
  assert.match(prompt, /one BACK kit in the RIGHT half/i);
  assert.match(prompt, /Do NOT create extra jerseys, duplicate kits, alternate colorways/i);
  assert.match(prompt, /68–72% of the canvas height/i);
  assert.match(prompt, /FRONT kit near x=384/i);
  assert.match(prompt, /BACK kit near x=1152/i);
  assert.match(prompt, /same physical uniform/i);
});

test("AI prompt reserves app typography zones and forbids all generated text", () => {
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
  assert.match(prompt, /APP TYPOGRAPHY SAFE ZONES/i);
  assert.match(prompt, /FRONT upper-chest wordmark region/i);
  assert.match(prompt, /BACK upper-name region and large central-number region/i);
  assert.match(prompt, /render NO readable text, letters, numbers, pseudo-text/i);
  assert.match(prompt, /approved uploaded logo is composited by the application/i);
  assert.match(prompt, /NO manufacturer, sponsor or third-party brand mark/i);
  assert.doesNotMatch(prompt, /exactly once as "GALACTIC"/i);
  assert.doesNotMatch(prompt, /single exact FRONT team wordmark/i);
});

test("color variation is an edit with geometry and typography-safe-zone lock", () => {
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
  assert.match(prompt, /Preserve the typography safe zones/i);
  assert.match(prompt, /application adds exact customer typography/i);
  assert.match(prompt, /#00A3FF/);
});

test("refinement keeps front/back synchronized without asking AI to re-letter", () => {
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
  assert.match(prompt, /Preserve the typography safe zones/i);
  assert.doesNotMatch(prompt, /exactly spelled "GALACTIC"/i);
});

test("deterministic typography preserves exact spelling and correct front/back roles", () => {
  assert.equal(typography.normalizeExactOverlayText("  St. Agnes  ", 60), "St. Agnes");
  assert.deepEqual(typography.allowedTypographyRoles("front"), ["teamName"]);
  assert.deepEqual(typography.allowedTypographyRoles("back"), ["playerName", "number"]);
  const backName = typography.getTypographyPlacement("playerName", "O'Neil", "board");
  assert.equal(backName.text, "O'Neil");
  assert.ok(backName.x > typography.AI_MASTER_BOARD.viewWidth, "back text must be placed in the right board half");
});

test("exact customer typography overlay exists while approved logo stays separately composited", () => {
  const overlayPath = path.join(root, "components/designer/uniform-typography-overlay.tsx");
  const overlay = fs.readFileSync(overlayPath, "utf8");
  const logoOverlay = fs.readFileSync(path.join(root, "components/designer/approved-logo-overlay.tsx"), "utf8");
  assert.equal(fs.existsSync(overlayPath), true);
  assert.match(overlay, /data-deterministic-typography="true"/);
  assert.match(overlay, /data-exact-customer-text="true"/);
  assert.match(overlay, /teamName/);
  assert.match(overlay, /playerName/);
  assert.match(overlay, /playerNumber/);
  assert.doesNotMatch(overlay, /<rect/i, "exact typography must not use floating label plates");
  assert.match(logoOverlay, /data-approved-logo="true"/);
  assert.match(logoOverlay, /view === "back"/);
});

test("production canvas uses fitted true front/back crops plus exact typography", () => {
  const canvas = fs.readFileSync(path.join(root, "components/designer/garment-canvas.tsx"), "utf8");
  const concepts = fs.readFileSync(path.join(root, "components/designer/concept-panel.tsx"), "utf8");
  assert.match(canvas, /data-master-crop=\{s\.view\}/);
  assert.match(canvas, /data-fitted-uniform-view="true"/);
  assert.match(canvas, /boardViewBox/);
  assert.match(canvas, /x="56"/);
  assert.match(canvas, /width="656"/);
  assert.match(canvas, /ApprovedLogoOverlay/);
  assert.match(canvas, /UniformTypographyOverlay/);
  assert.match(canvas, /coordinateSpace="board"/);
  assert.match(canvas, /getPreviewPlayer/);
  assert.match(canvas, /\["front", "back"\]/);
  assert.match(concepts, /UniformTypographyOverlay/);
  assert.doesNotMatch(canvas, /onWheel|onPointerMove|dragBoundFunc|zoom/i, "preview should not require manual zoom/drag");
});

test("jsPDF export is compact, landscape, and serializes the production SVG views", () => {
  const source = fs.readFileSync(path.join(root, "lib/designer/export-service.ts"), "utf8");
  assert.match(source, /new jsPDF\(\{ orientation: "landscape", unit: "mm", format: "a4", compress: true \}\)/);
  assert.match(source, /serializeDesignerSvg/);
  assert.match(source, /drawPreviewCard\(doc, "Front"/);
  assert.match(source, /drawPreviewCard\(doc, "Back"/);
  assert.match(source, /DESIGN SUMMARY/);
  assert.match(source, /ROSTER & ORDER/);
  assert.match(source, /buildOrderBreakdown\(state, "sublimated"\)/);
  assert.match(source, /Estimated total/);
  assert.match(source, /PRODUCTION NOTES/);
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
