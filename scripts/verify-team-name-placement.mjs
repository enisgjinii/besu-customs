#!/usr/bin/env node
/**
 * Local verification for front-chest team name placement fix.
 * Run: npx tsx scripts/verify-team-name-placement.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { extractTeamNameFromPrompt, normalizeUniformTeamName, resolveChestTextLayerDefaults } =
  await import(join(root, "lib/team-text-placement.ts"));

const MICHAEL_PROMPT =
  "Make a jersey about Michael Jackson, and show him doing the moonwalk. Also, please put the team name Michael on the front. Also, please add space and stars to the background to make it look epic.";

const cases = [
  {
    label: "Michael Baptiste test prompt (Jun 18)",
    prompt: MICHAEL_PROMPT,
    expected: "Michael",
  },
  {
    label: "team name is Lakers",
    prompt: "Create a jersey for team name is Lakers with flames",
    expected: "Lakers",
  },
  {
    label: "team name Lakers on the front",
    prompt: "team name Lakers on the front with gold trim",
    expected: "Lakers",
  },
  {
    label: "put the team name Bulls on the front",
    prompt: "put the team name Bulls on the front",
    expected: "Bulls",
  },
  {
    label: "team called the Galactic",
    prompt: "uniform for a team called the Galactic with space theme",
    expected: "Galactic",
  },
  {
    label: "no team name (should not extract)",
    prompt: "Make a jersey about Michael Jackson with stars",
    expected: null,
  },
];

const results = cases.map(({ label, prompt, expected }) => {
  const extracted = extractTeamNameFromPrompt(prompt);
  const normalized = extracted ? normalizeUniformTeamName(extracted) : null;
  const pass = extracted === expected;
  return { label, prompt, expected, extracted, normalized, pass };
});

const michaelCase = results[0];
const chestLayer = michaelCase.extracted
  ? resolveChestTextLayerDefaults({
      text: normalizeUniformTeamName(michaelCase.extracted),
      modelUrl: "/models/basketball-jersey-top-and-long-shorts.glb",
      order: 1,
      namePrefix: "Team Name",
    })
  : null;

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    michaelPromptExtractsTeamName: michaelCase.pass,
    chestLayerPosition: chestLayer?.position ?? null,
    chestLayerName: chestLayer?.name ?? null,
  },
  michaelPrompt: MICHAEL_PROMPT,
  results,
  chestLayerPreview: chestLayer
    ? {
        name: chestLayer.name,
        text: chestLayer.text,
        position: chestLayer.position,
        fontSize: chestLayer.fontSize,
        note: "Position [0.5, Y, 0] = center chest on UV map (front panel, not back).",
      }
    : null,
};

const outPath = join(root, "docs/client-deliverables/team-name-fix/verification-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log("Team name placement verification");
console.log("================================");
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.label}`);
  console.log(`      expected: ${r.expected ?? "(none)"}`);
  console.log(`      got:      ${r.extracted ?? "(none)"}${r.normalized ? ` → ${r.normalized}` : ""}`);
}
console.log("");
if (chestLayer) {
  console.log("Front chest layer preview (Michael case):");
  console.log(`  ${chestLayer.name}`);
  console.log(`  position: [${chestLayer.position.join(", ")}]`);
  console.log(`  fontSize: ${chestLayer.fontSize}`);
}
console.log("");
console.log(`Report written to ${outPath}`);
process.exit(report.summary.failed > 0 ? 1 : 0);
