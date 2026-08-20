/**
 * Designer unit verification harness (no Jest/Vitest required).
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
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
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
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

// --- Prompt builder ---
const openai = loadTypeScriptModule("lib/designer/openai-service.ts");

test("prompt builder suppresses text and mockups", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "basketball uniform jersey+shorts, outer space moon/comets",
    teamName: "Galactic",
    style: "aggressive",
    view: "front",
    sport: "Basketball",
    mode: "generate",
  });
  assert.match(prompt, /Do not include any text/i);
  assert.match(prompt, /Do not show a garment mockup/i);
  assert.match(prompt, /Galactic/);
  assert.match(prompt, /outer space moon\/comets/);
  assert.doesNotMatch(prompt, /render the team name/i);
});

test("color variation preserves composition instruction", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "uniform",
    designDescription: "space kit",
    teamName: "Galactic",
    style: "modern",
    view: "back",
    mode: "color_variation",
    colors: { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" },
    correction: openai.buildColorVariationCorrection({
      primary: "#0A0A0A",
      secondary: "#00A3FF",
      accent: "#FFFFFF",
    }),
  });
  assert.match(prompt, /COLOR VARIATION MODE/i);
  assert.match(prompt, /#00A3FF/);
  assert.match(prompt, /Preserve the existing composition/i);
});

test("refinement mode includes targeted revision", () => {
  const prompt = openai.buildArtworkPrompt({
    garmentType: "jersey",
    designDescription: "space kit",
    teamName: "Galactic",
    style: "modern",
    view: "front",
    mode: "refine",
    correction: "sharper comets",
  });
  assert.match(prompt, /REFINEMENT MODE/i);
  assert.match(prompt, /sharper comets/);
});

// --- Templates + typography ---
const templates = loadTypeScriptModule("lib/designer/templates.ts", {
  "./types": loadTypeScriptModule("lib/designer/types.ts"),
});
const typography = loadTypeScriptModule("lib/designer/typography.ts", {
  "./templates": templates,
  "./types": loadTypeScriptModule("lib/designer/types.ts"),
});

test("template registry resolves basketball jersey front/back and shorts", () => {
  const front = templates.resolveTemplate({ sport: "Basketball", piece: "jersey", view: "front" });
  const back = templates.resolveTemplate({ sport: "Basketball", piece: "jersey", view: "back" });
  const shorts = templates.resolveTemplate({ sport: "Basketball", piece: "shorts", view: "front" });
  assert.ok(front.bounds.teamName);
  assert.equal(back.bounds.teamName, undefined);
  assert.ok(back.bounds.playerName);
  assert.ok(back.bounds.number);
  assert.ok(shorts.bounds.artwork);
});

test("front/back typography rules", () => {
  assert.deepEqual(typography.allowedTypographyRoles("front"), ["teamName"]);
  assert.deepEqual(typography.allowedTypographyRoles("back"), ["playerName", "number"]);
  assert.equal(typography.shouldRenderTeamName("front"), true);
  assert.equal(typography.shouldRenderTeamName("back"), false);
  assert.equal(typography.shouldRenderPlayerTypography("back"), true);
  assert.equal(typography.shouldRenderPlayerTypography("front"), false);
});

test("fitTextToBounds shrinks long team names", () => {
  const short = typography.fitTextToBounds("ABC", { width: 300, height: 80 });
  const long = typography.fitTextToBounds("GALACTIC WARRIORS UNITED", { width: 300, height: 80 });
  assert.ok(long < short);
  assert.ok(long >= 14);
});

test("typography contract holds for all templates", () => {
  for (const template of templates.listTemplates()) {
    templates.assertTypographyContract(template);
  }
});

// --- Shopify serialization ---
const variants = loadTypeScriptModule("lib/shopify-variants.ts");
const checkout = loadTypeScriptModule("lib/designer/shopify-service.ts", {
  "../shopify-variants": variants,
});

test("Shopify payload uses URLs not base64 and includes design id", () => {
  const state = {
    designId: "design-galactic",
    productId: "basketball-uniform",
    garmentType: "uniform",
    sport: "Basketball",
    style: "aggressive",
    teamName: "GALACTIC",
    colors: { primary: "#0A0A0A", secondary: "#00A3FF", accent: "#FFFFFF" },
    artwork: {
      front: "https://example.supabase.co/storage/v1/object/public/designer-assets/generated/front.png",
      back: "https://example.supabase.co/storage/v1/object/public/designer-assets/generated/back.png",
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

// --- API validation schema (inline mirror of critical rules) ---
test("API refinement requires previous asset conceptually", () => {
  const needsPrevious = (mode, previous) =>
    (mode === "refine" || mode === "color_variation") && !previous;
  assert.equal(needsPrevious("refine", undefined), true);
  assert.equal(needsPrevious("color_variation", "https://x"), false);
  assert.equal(needsPrevious("generate", undefined), false);
});

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: results.filter((r) => r.ok).length, failed: failed.length, results }, null, 2));
if (failed.length) {
  process.exitCode = 1;
}
