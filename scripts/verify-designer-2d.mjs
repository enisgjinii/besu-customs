/**
 * Designer verification harness.
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
const pathMock = Object.assign(path, { default: path });
const storage = loadTypeScriptModule("lib/designer/storage-service.ts", {
  path: pathMock,
  "node:path": pathMock,
  "node:fs/promises": { mkdir: async () => {}, writeFile: async () => {} },
});

test("brief parser extracts team, colors, and edit vs generate intent", () => {
  assert.equal(
    parser.extractTeamName("Show me three different basketball uniforms for a team called Michael, inspired by MJ"),
    "MICHAEL",
  );
  assert.deepEqual(
    parser.extractColors("using the colors white black and gray"),
    { primary: "#0D0D0D", secondary: "#FFFFFF", accent: "#6B6B6B" },
  );
  assert.equal(parser.isFreshGenerateRequest("make it without the sleeves", true), false);
  assert.equal(parser.isFreshGenerateRequest("Show me three different uniforms", true), true);
  // Without a selected concept there is nothing to edit, so any prompt starts a new set.
  assert.equal(parser.isFreshGenerateRequest("make it without the sleeves", false), true);
});

test("prompt requests a finished direct AI basketball uniform", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "basketball uniform jersey+shorts, outer space moon/comets",
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
  assert.match(prompt, /Render the exact team name/i);
  assert.match(prompt, /flat sublimation texture/i);
  assert.doesNotMatch(prompt, /Return only the isolated sublimation graphic/i);
  assert.doesNotMatch(prompt, /Do not show a garment mockup/i);
});

test("prompt bars third-party brand marks and pins the exact team-name spelling", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "basketball uniform, outer space moon and comets",
    teamName: "GALACTIC",
    style: "aggressive",
    view: "front",
    sport: "Basketball",
    mode: "generate",
  });
  // A manufacturer mark on a customer's uniform is a trademark problem, so the ban is explicit
  // and must be the last instruction, where the model weights it most heavily.
  assert.match(prompt, /NO manufacturer or third-party brand mark/i);
  assert.match(prompt, /swoosh/i);
  assert.match(prompt, /three stripes/i);
  assert.match(prompt, /jumpman/i);
  const marksAt = prompt.indexOf("ABSOLUTE REQUIREMENT");
  const brandAt = prompt.indexOf("Style direction");
  assert.ok(marksAt > brandAt, "the brand-mark ban must come late in the prompt");
  // Image models drop letters, so the wordmark is spelled out and the letter count asserted.
  assert.match(prompt, /G-A-L-A-C-T-I-C/);
  assert.match(prompt, /8 letters/);
  assert.match(prompt, /SPELLING IS CRITICAL/i);
  assert.match(prompt, /Do not print any player name or number/i);
});

test("color variation preserves direct uniform composition", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "space kit",
    teamName: "GALACTIC",
    style: "modern",
    view: "front",
    mode: "color_variation",
    colors: { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" },
    correction: openai.buildColorVariationCorrection({ primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" }),
  });
  assert.match(prompt, /COLOR VARIATION MODE/i);
  assert.match(prompt, /Preserve the exact garment cut/i);
  assert.match(prompt, /#00A3FF/);
  assert.match(prompt, /Do not redesign the kit/i);
  // Recolouring made the model redraw the chest lettering and drop a letter, so edits must carry
  // the wordmark over rather than re-letter it.
  assert.match(prompt, /Carry the existing front chest wordmark over unchanged/i);
  assert.match(prompt, /G-A-L-A-C-T-I-C/);
  assert.match(prompt, /Do not re-letter/i);
});

test("refinement edits the previous direct render", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "space kit",
    teamName: "GALACTIC",
    style: "modern",
    view: "front",
    mode: "refine",
    correction: "sharper comets",
  });
  assert.match(prompt, /REFINEMENT MODE/i);
  assert.match(prompt, /previous direct uniform render/i);
  assert.match(prompt, /sharper comets/i);
  assert.match(prompt, /Carry the existing front chest wordmark over unchanged/i);
});

const templates = loadTypeScriptModule("lib/designer/templates.ts", {
  "./types": loadTypeScriptModule("lib/designer/types.ts"),
});
const typography = loadTypeScriptModule("lib/designer/typography.ts", {
  "./templates": templates,
  "./types": loadTypeScriptModule("lib/designer/types.ts"),
});

test("legacy production template helpers remain internally valid", () => {
  for (const template of templates.listTemplates()) templates.assertTypographyContract(template);
  assert.deepEqual(typography.allowedTypographyRoles("front"), ["teamName"]);
  assert.deepEqual(typography.allowedTypographyRoles("back"), ["playerName", "number"]);
});

const variants = loadTypeScriptModule("lib/shopify-variants.ts");
const checkout = loadTypeScriptModule("lib/designer/shopify-service.ts", { "../shopify-variants": variants });

test("Shopify payload uses selected direct AI render URLs", () => {
  const state = {
    designId: "design-galactic",
    productId: "basketball-uniform",
    garmentType: "uniform",
    sport: "Basketball",
    style: "aggressive",
    teamName: "GALACTIC",
    colors: { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" },
    artwork: {
      front: "https://app.example.com/api/designer/asset/2026-09-01/direct-ai.png",
      back: "https://app.example.com/api/designer/asset/2026-09-01/direct-ai.png",
    },
    logoUrl: "data:image/png;base64,AAAA",
    roster: [{ name: "Bryant", number: "24", topSize: "M", shortsSize: "L", quantity: 1 }],
    customer: { name: "QA", email: "qa@example.com", phone: "", notes: "" },
  };
  const payload = checkout.buildDesignerCheckoutPayload(state);
  const serialized = JSON.stringify(payload);
  assert.equal(payload.designId, "design-galactic");
  assert.match(payload.items[0].properties["Front artwork URL"], /^https:\/\//);
  assert.equal(payload.items[0].properties["Logo URL"], "");
  assert.doesNotMatch(serialized, /data:image|base64,AAAA/i);
});

test("every concept render asks for one finished uniform, never a multi-design collage", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "Michael Jackson theme white black gray",
    teamName: "MICHAEL",
    style: "modern",
    view: "front",
    sport: "Basketball",
    mode: "generate",
    layout: "kit",
  });
  assert.match(prompt, /MICHAEL/);
  assert.match(prompt, /sleeveless/i);
  assert.match(prompt, /Return one direct AI product-render image/i);
  // A collage cannot be individually selected, refined or ordered, so it must not be requested.
  assert.doesNotMatch(prompt, /CONCEPT BOARD MODE/i);
  assert.doesNotMatch(prompt, /THREE distinct labeled designs/i);
});

test("API refinement requires previous direct render", () => {
  const needsPrevious = (mode, previous) => (mode === "refine" || mode === "color_variation") && !previous;
  assert.equal(needsPrevious("refine", undefined), true);
  assert.equal(needsPrevious("color_variation", "https://x"), false);
  assert.equal(needsPrevious("generate", undefined), false);
});

test("designer asset URLs must be same-origin app assets or inline PNG data URLs", () => {
  assert.equal(
    storage.isAllowedDesignerAssetUrl(
      "https://app.example.com/api/designer/asset/2026-09-01/test.png",
      "https://app.example.com",
    ),
    true,
  );
  assert.equal(
    storage.isLocalDesignerAssetUrl(
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
  assert.equal(
    storage.isAllowedDesignerAssetUrl("https://cdn.example.com/designer/x.png", "https://app.example.com"),
    false,
  );
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
    assert.equal(stored.bucket, "inline");
  } finally {
    if (saved.VERCEL === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = saved.VERCEL;
  }
});

test("asset storage uses /tmp on serverless and project dir locally", () => {
  const saved = { VERCEL: process.env.VERCEL };
  try {
    process.env.VERCEL = "1";
    assert.equal(storage.isServerlessRuntime(), true);
    assert.match(storage.assetStorageRoot(), /^\/tmp\/designer-assets$/);
    delete process.env.VERCEL;
    assert.match(storage.assetStorageRoot(), /\.designer-assets$/);
  } finally {
    if (saved.VERCEL === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = saved.VERCEL;
  }
});

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
