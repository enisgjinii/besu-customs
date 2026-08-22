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
  assert.equal(parser.wantsConceptBoard("three different basketball uniforms"), true);
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
      front: "https://example.supabase.co/storage/v1/object/public/designer-assets/generated/direct-ai.png",
      back: "https://example.supabase.co/storage/v1/object/public/designer-assets/generated/direct-ai.png",
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

test("concept board prompt asks for three labeled uniforms", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "Michael Jackson theme white black gray",
    teamName: "MICHAEL",
    style: "modern",
    view: "front",
    sport: "Basketball",
    mode: "generate",
    layout: "board",
  });
  assert.match(prompt, /CONCEPT BOARD MODE/i);
  assert.match(prompt, /THREE distinct labeled designs/i);
  assert.match(prompt, /MICHAEL/);
  assert.match(prompt, /sleeveless/i);
});

test("API refinement requires previous direct render", () => {
  const needsPrevious = (mode, previous) => (mode === "refine" || mode === "color_variation") && !previous;
  assert.equal(needsPrevious("refine", undefined), true);
  assert.equal(needsPrevious("color_variation", "https://x"), false);
  assert.equal(needsPrevious("generate", undefined), false);
});

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
