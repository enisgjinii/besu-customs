/**
 * Renders each deterministic preview variant so they can be eyeballed during QA.
 * Run: node scripts/qa-mock-preview.mjs [baseUrl] [outDir]
 */
import { launch, createPage, sleep } from "./lib/cdp.mjs";

const base = process.argv[2] || "http://localhost:3200";
const outDir = process.argv[3] || "/tmp/mock-variants";

const session = await launch();
const page = createPage(session);
await page.init();
await page.viewport(1536, 1024);

for (const variant of [0, 1, 2, 3]) {
  const url = `${base}/api/designer/mock?primary=%230A0A0A&secondary=%2300A3FF&accent=%23FFFFFF&seed=s${variant}&variant=${variant}&team=GALACTIC`;
  await session.send("Page.navigate", { url });
  await sleep(1200);
  console.log(await page.screenshot(`${outDir}/variant-${variant}.png`));
}

await session.browser.close();
