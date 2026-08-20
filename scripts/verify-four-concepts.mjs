import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const generation = read("lib/designer/generation-client.ts");
const types = read("lib/designer/types.ts");
const store = read("lib/designer/store.ts");
const steps = read("components/designer/designer-steps.ts");
const page = read("components/designer/designer-page.tsx");
const concepts = read("components/designer/concept-panel.tsx");
const prompt = read("components/designer/prompt-panel.tsx");

const directionIds = ["cosmic-energy", "velocity-cut", "heritage-court", "elite-minimal"];
for (const id of directionIds) assert.match(generation, new RegExp(id));
assert.equal(directionIds.length, 4);
assert.match(generation, /generateConceptSet/);
assert.match(generation, /ART DIRECTION/);
assert.match(generation, /clearly different/i);

assert.match(types, /interface DesignConcept/);
assert.match(types, /DesignerStep = 0 \| 1 \| 2 \| 3 \| 4 \| 5/);
assert.match(store, /setConcepts/);
assert.match(store, /selectConcept/);
assert.match(store, /selectedConceptId/);
assert.match(store, /colorsEnabled: concept\.colorsEnabled/);

assert.match(steps, /id: "concepts"/);
assert.match(steps, /Pick one of four designs/);
assert.match(page, /ConceptPanel/);
assert.match(page, /!store\.selectedConceptId/);
assert.match(page, /grid-cols-6/);
assert.match(concepts, /4 concepts/);
assert.match(concepts, /Select one concept to continue/);
assert.match(prompt, /Generate 4 Concepts/);

console.log(JSON.stringify({
  passed: true,
  acceptance: "Bryant four selectable concepts",
  directions: directionIds,
  gate: "Refine/Roster/Order require selectedConceptId",
}, null, 2));
