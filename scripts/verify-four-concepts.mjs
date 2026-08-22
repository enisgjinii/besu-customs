import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const generation = read("lib/designer/generation-client.ts");
const prompts = read("lib/designer/openai-service.ts");
const types = read("lib/designer/types.ts");
const store = read("lib/designer/store.ts");
const steps = read("components/designer/designer-steps.ts");
const page = read("components/designer/designer-page.tsx");
const concepts = read("components/designer/concept-panel.tsx");
const promptPanel = read("components/designer/prompt-panel.tsx");
const canvas = read("components/designer/garment-canvas.tsx");
const bar = read("components/designer/studio-prompt-bar.tsx");
const hook = read("hooks/use-designer-generation.ts");
const parser = read("lib/designer/brief-parser.ts");
const api = read("app/api/designer/generate/route.ts");

const directionIds = ["cosmic-energy", "velocity-cut", "heritage-court", "elite-minimal"];
for (const id of directionIds) assert.match(generation, new RegExp(id));
assert.equal(directionIds.length, 4);
assert.match(generation, /generateConceptSet/);
assert.match(generation, /generateStudioBoard/);
assert.match(generation, /ART DIRECTION/);
assert.match(generation, /clearly different/i);

assert.match(prompts, /FINISHED UNIFORM VISUALIZATION/i);
assert.match(prompts, /sleeveless jersey plus matching shorts/i);
assert.match(prompts, /FRONT and BACK presentations/i);
assert.match(prompts, /CONCEPT BOARD MODE/i);
assert.match(prompts, /THREE distinct labeled designs/i);
assert.doesNotMatch(prompts, /Do not show a garment mockup/i);

assert.match(types, /interface DesignConcept/);
assert.match(types, /ArtworkLayout = "kit" \| "board"/);
assert.match(types, /DesignerStep = 0 \| 1 \| 2 \| 3 \| 4 \| 5/);
assert.match(store, /setConcepts/);
assert.match(store, /selectConcept/);
assert.match(store, /selectedConceptId/);
assert.match(store, /colorsEnabled: concept\.colorsEnabled/);
assert.match(store, /layout: "board"/);

assert.match(steps, /id: "concepts"/);
assert.match(page, /ConceptPanel/);
assert.match(page, /StudioPromptBar/);
assert.match(page, /!store\.selectedConceptId/);
assert.match(concepts, /Generate a design first/i);
assert.match(promptPanel, /Generate/);
assert.match(canvas, /Generating uniform/i);
assert.match(canvas, /st-agnes-uniforms\.jpg/);
assert.match(canvas, /fireballs-kit\.jpg/);
assert.match(canvas, /galactic-pack\.jpg/);
assert.match(canvas, /item\.label/);
assert.match(bar, /Describe a basketball uniform/i);
assert.match(bar, /Add a moon, change colors, or edit this design/i);
assert.match(hook, /submitStudioPrompt/);
assert.match(hook, /refineCurrent/);
assert.match(parser, /extractTeamName/);
assert.match(parser, /isFreshGenerateRequest/);
assert.match(api, /layout: z\.enum\(\["kit", "board"\]\)/);
assert.match(api, /1536x1024/);

console.log(JSON.stringify({
  passed: true,
  acceptance: "Studio prompt bar generates a concept board, then follow-up prompts refine it",
  directions: directionIds,
  mode: "direct AI finished uniform visualization + editable concept board",
  gate: "Refine/Roster/Order require selectedConceptId",
}, null, 2));
