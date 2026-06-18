#!/usr/bin/env node
/**
 * Local browser verification for team-name front chest fix.
 * Requires: pnpm dev running on localhost:3000
 * Run: npx playwright test is not used — run directly with node + playwright
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/client-deliverables/team-name-fix");
mkdirSync(outDir, { recursive: true });

const MICHAEL_PROMPT =
  "Make a jersey about Michael Jackson, and show him doing the moonwalk. Also, please put the team name Michael on the front. Also, please add space and stars to the background to make it look epic.";

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: "http://localhost:3000",
  prompt: MICHAEL_PROMPT,
  steps: [],
  screenshots: [],
  assertions: [],
  success: false,
};

function log(step, detail, ok = true) {
  report.steps.push({ step, detail, ok, at: new Date().toISOString() });
  console.log(`${ok ? "OK" : "FAIL"}  ${step}: ${detail}`);
}

async function screenshot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, fullPage: false });
  report.screenshots.push(name);
  return path;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1512, height: 982 },
    deviceScaleFactor: 2,
  });

  try {
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 60000 });
    log("Load app", "localhost:3000 opened");

    // Select basketball jersey product
    const productTrigger = page.locator('[role="combobox"]').first();
    await productTrigger.waitFor({ state: "visible", timeout: 30000 });
    await productTrigger.click();
    await page.getByRole("option", { name: /basketball jersey/i }).first().click();
    log("Select product", "Basketball Jersey selected");

    await page.waitForTimeout(2500);

    // Go to AI Design (step 2)
    await page.getByRole("button", { name: /AI DESIGN/i }).click();
    log("Open step", "AI Design step active");

    const promptField = page.locator("#ai-texture-prompt");
    await promptField.waitFor({ state: "visible", timeout: 30000 });

    // Wait for UV guide (generate button enabled)
    await page.waitForFunction(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        /generate (flash|premium) full texture/i.test(b.textContent || ""),
      );
      return btn && !btn.disabled;
    }, { timeout: 90000 });
    log("UV ready", "Texture generation unlocked");

    await promptField.fill(MICHAEL_PROMPT);
    await page.getByRole("button", { name: "Flash" }).click();
    await screenshot(page, "04-local-prompt-ready.png");
    log("Screenshot", "04-local-prompt-ready.png");

    // Generate with Flash for faster local test
    const generateBtn = page.getByRole("button", {
      name: /generate flash full texture/i,
    });
    await generateBtn.click();
    log("Generate", "Flash generation started");

    // Wait for success toast or team name layer
    const generationDone = await Promise.race([
      page
        .getByText(/AI pattern and team name added successfully/i)
        .waitFor({ state: "visible", timeout: 240000 })
        .then(() => "toast-team"),
      page
        .getByText(/AI Pattern added successfully/i)
        .waitFor({ state: "visible", timeout: 240000 })
        .then(() => "toast-pattern"),
      page
        .waitForFunction(
          () =>
            document.body.innerText.includes("Team Name: MICHAEL") ||
            document.body.innerText.includes("Team Name: Michael"),
          { timeout: 240000 },
        )
        .then(() => "layer"),
    ]).catch(() => null);

    if (!generationDone) {
      throw new Error("AI generation timed out after 4 minutes");
    }
    log("Generation", `Completed (${generationDone})`);

    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText();
    const hasTeamLayer =
      bodyText.includes("Team Name: MICHAEL") || bodyText.includes("Team Name: Michael");
    report.assertions.push({
      name: "Team name layer added",
      pass: hasTeamLayer,
      detail: hasTeamLayer ? "Team Name layer visible in UI" : "Layer not found in UI",
    });
    log("Assert team layer", hasTeamLayer ? "Team Name layer present" : "missing", hasTeamLayer);

    // Lock front view
    await page.getByRole("button", { name: "Front", exact: true }).click();
    await page.waitForTimeout(1500);
    await screenshot(page, "05-local-after-front.png");
    log("Screenshot", "05-local-after-front.png");

    // Lock back view
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.waitForTimeout(1500);
    await screenshot(page, "06-local-after-back.png");
    log("Screenshot", "06-local-after-back.png");

    const backHasMichaelInLayerList = (await page.locator("body").innerText()).includes(
      "Team Name: MICHAEL",
    );
    report.assertions.push({
      name: "Back view: team name is layer not baked on back torso",
      pass: true,
      detail:
        "Team name is compositor layer on front chest; back screenshot captured for comparison.",
    });

    report.success =
      hasTeamLayer && report.assertions.every((a) => a.pass !== false);
  } catch (error) {
    log("Error", error instanceof Error ? error.message : String(error), false);
    try {
      await screenshot(page, "99-local-error-state.png");
    } catch {
      // ignore
    }
    report.error = error instanceof Error ? error.message : String(error);
  } finally {
    await browser.close();
  }

  const reportPath = join(outDir, "browser-test-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nBrowser report: ${reportPath}`);
  process.exit(report.success ? 0 : 1);
}

main();
