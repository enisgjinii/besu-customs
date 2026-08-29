/**
 * Browser QA harness for the BESU Customs AI Designer.
 *
 * Drives the real application in a real Chromium browser through the full customer journey
 * (product -> brief -> four concepts -> explicit selection -> refinement -> colour variation
 * -> roster -> order -> exports -> Shopify handoff), captures the client evidence
 * screenshots, sweeps the responsive breakpoints and records console/network health.
 *
 * Run against a dev server started with DESIGNER_MOCK_AI=true:
 *   node scripts/qa-designer-flow.mjs http://localhost:3200
 */
import fs from "node:fs";
import path from "node:path";
import { launch, createPage, sleep } from "./lib/cdp.mjs";

const BASE = process.argv[2] || "http://localhost:3200";
const EVIDENCE = path.resolve(
  import.meta.dirname,
  "..",
  "docs/client-deliverables/final-besu-ai-designer/evidence",
);
const RESULT = path.join(EVIDENCE, "..", "qa-results.json");

const TEAM = "GALACTIC";
const BRIEF =
  "Sleeveless basketball uniform jersey and matching shorts for GALACTIC. Outer-space theme with a moon, comets and dynamic cosmic energy. Premium professional basketball presentation with black, electric blue and white.";

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: 1440, height: 900, mobile: false },
  { id: "laptop", label: "Laptop", width: 1280, height: 800, mobile: false },
  { id: "tablet-portrait", label: "Tablet portrait", width: 820, height: 1180, mobile: true },
  { id: "tablet-landscape", label: "Tablet landscape", width: 1180, height: 820, mobile: true },
  { id: "mobile", label: "Mobile", width: 390, height: 844, mobile: true },
  { id: "mobile-small", label: "Small mobile", width: 360, height: 800, mobile: true },
  { id: "mobile-375", label: "Mobile 375", width: 375, height: 812, mobile: true },
];

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason instanceof Error ? reason.stack : reason);
});

const checks = [];
const screenshots = [];
function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}
async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
  }
}

const session = await launch();
const page = createPage(session);
await page.init();

/** Reads live designer state out of the running app. */
const state = () =>
  page.evaluate(`
    const raw = localStorage.getItem("besu-direct-ai-designer-v1");
    return raw ? JSON.parse(raw).state : null;
  `);

async function shot(name) {
  const file = path.join(EVIDENCE, name);
  await sleep(500);
  await page.screenshot(file);
  screenshots.push(name);
  console.log(`      shot ${name}`);
  return file;
}

async function openStep(label) {
  await page.clickText('nav[aria-label="Designer sections"] button', label, { exact: true });
  await sleep(500);
}

/**
 * Opens a roster size dropdown through the real widget and picks an option.
 * The row is located from the player's own name input so rows cannot be confused.
 */
async function selectSize(playerId, which, value) {
  const marker = `data-qa-size-${which.toLowerCase()}`;
  const index = which === "Shorts" ? 1 : 0;
  const found = await page.evaluate(`
    const nameInput = document.querySelector('input[name="name-${playerId}"]');
    if (!nameInput) return false;
    const row = nameInput.closest("div.rounded-xl") || nameInput.closest("div").parentElement.parentElement;
    const triggers = [...row.querySelectorAll("button[aria-haspopup='listbox']")];
    const target = triggers[${index}];
    if (!target) return false;
    document.querySelectorAll("[${marker}]").forEach((el) => el.removeAttribute(${JSON.stringify(marker)}));
    target.setAttribute(${JSON.stringify(marker)}, "1");
    return true;
  `);
  if (!found) throw new Error(`no ${which} size control for player ${playerId}`);
  await page.click(`[${marker}]`);
  await sleep(500);
  await page.waitFor("[role='option']", 8000);
  await page.clickText("[role='option']", value, { exact: true });
  await sleep(400);
  await page.evaluate(`
    document.querySelectorAll("[${marker}]").forEach((el) => el.removeAttribute(${JSON.stringify(marker)}));
    return true;
  `);
}

async function resetApp() {
  await page.goto(BASE);
  await page.evaluate(`localStorage.clear(); return true;`);
  await page.goto(BASE);
}

// ===========================================================================
// Desktop: full Bryant acceptance scenario
// ===========================================================================
await page.viewport(1440, 900);
await resetApp();

await check("designer shell renders on the public route", async () => {
  await page.waitFor("[data-designer-shell]");
  return page.evaluate(`return document.querySelector("[data-designer-shell]").dataset.designerShell;`);
});

await check("product step lists production products and basketball uniform is selected", async () => {
  const info = await page.evaluate(`
    const buttons = [...document.querySelectorAll('section button[aria-pressed]')];
    return {
      count: buttons.length,
      selected: buttons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.innerText.split("\\n")[0]),
    };
  `);
  if (info.count < 8) throw new Error(`only ${info.count} products offered`);
  if (!info.selected.length) throw new Error("no product selected by default");
  return `${info.count} products, default "${info.selected[0]}"`;
});
await shot("01-desktop-initial-product.png");

await check("product change resets any prior design state", async () => {
  await page.clickText("section button[aria-pressed]", "Basketball Jersey");
  const jersey = await state();
  if (jersey.garmentType !== "jersey") throw new Error(`garmentType stayed ${jersey.garmentType}`);
  await page.clickText("section button[aria-pressed]", "Basketball Uniform");
  const uniform = await state();
  if (uniform.garmentType !== "uniform") throw new Error("could not return to the uniform product");
  if (uniform.concepts.length || uniform.selectedConceptId) throw new Error("stale concepts survived a product change");
  return "jersey <-> uniform switch clears concepts";
});

await check("brief step accepts the team name and design brief", async () => {
  await openStep("Brief");
  await page.waitFor('input[autocomplete="organization"]');
  await page.type('input[autocomplete="organization"]', TEAM);
  await page.type("aside textarea", BRIEF);
  const stored = await state();
  if (stored.teamName !== TEAM) throw new Error(`team stored as ${stored.teamName}`);
  if (!stored.prompt.includes("Outer-space")) throw new Error("brief not stored");
  return `team ${stored.teamName}, ${stored.prompt.length} char brief`;
});
await shot("02-desktop-ai-brief.png");

const beforeGeneration = page.generationRequests();
await check("generating produces four separate AI concept requests", async () => {
  await page.clickText("aside button", "Generate 4 concepts");
  await page.waitForCondition(
    `(JSON.parse(localStorage.getItem("besu-direct-ai-designer-v1")||"{}").state||{}).concepts?.length === 4`,
    240_000,
    "four concepts stored",
  );
  const issued = page.generationRequests() - beforeGeneration;
  if (issued !== 4) throw new Error(`the browser issued ${issued} generation requests, expected 4`);
  return `${issued} requests issued`;
});

await check("four visually distinct concepts are shown together in the Choose step", async () => {
  await page.waitFor("[data-concept-card]", 20_000);
  await sleep(900);
  const info = await page.evaluate(`
    const cards = [...document.querySelectorAll("[data-concept-card]")];
    return {
      cards: cards.length,
      labels: cards.map((c) => c.innerText.replace(/\\n/g, " ").trim()),
      urls: [...new Set(cards.map((c) => c.querySelector("img")?.getAttribute("src")))],
      alts: cards.map((c) => c.querySelector("img")?.getAttribute("alt") || ""),
      loaded: cards.every((c) => { const i = c.querySelector("img"); return i && i.complete && i.naturalWidth > 0; }),
      visible: cards.filter((c) => c.getBoundingClientRect().height > 40).length,
    };
  `);
  if (info.cards !== 4) throw new Error(`${info.cards} concept cards rendered`);
  if (info.urls.length !== 4) throw new Error("concept cards share a render");
  if (!info.loaded) throw new Error("a concept image failed to load");
  if (info.alts.some((alt) => !alt)) throw new Error("a concept image is missing alt text");
  const current = await state();
  if (current.activeStep !== 2) throw new Error(`landed on step ${current.activeStep} instead of Choose`);
  return `${info.cards} cards (${info.visible} visible), 4 unique renders`;
});
await shot("03-desktop-four-concepts.png");
// The choice step is the headline evidence, so also capture the grid itself at 2x.
await page.screenshotElement("[data-concept-grid]", path.join(EVIDENCE, "03a-desktop-four-concepts-detail.png"));
screenshots.push("03a-desktop-four-concepts-detail.png");

await check("no concept is auto-selected and Refine/Roster/Order are locked", async () => {
  const current = await state();
  if (current.selectedConceptId) throw new Error(`concept ${current.selectedConceptId} was auto-selected`);
  if (current.artwork.front || current.designId) throw new Error("artwork/designId set before any selection");
  const locked = await page.evaluate(`
    const tabs = [...document.querySelectorAll('nav[aria-label="Designer sections"] button')];
    return tabs.filter((t) => ["Refine","Roster","Order"].includes(t.innerText.trim()))
      .map((t) => ({ label: t.innerText.trim(), disabled: t.disabled, aria: t.getAttribute("aria-disabled") }));
  `);
  const open = locked.filter((tab) => !tab.disabled);
  if (open.length) throw new Error(`unlocked without selection: ${open.map((t) => t.label).join(", ")}`);
  if (locked.some((tab) => tab.aria !== "true")) throw new Error("locked tabs are missing aria-disabled");
  return "Refine, Roster and Order disabled with aria-disabled=true";
});
await shot("04-desktop-concepts-no-selection-locked.png");

await check("selecting a concept updates the preview, designId and unlocks downstream steps", async () => {
  const target = (await state()).concepts[0];
  await page.click(`[data-concept-card="${target.id}"]`);
  await sleep(700);
  const current = await state();
  if (current.selectedConceptId !== target.id) throw new Error("selection was not stored");
  if (current.artwork.front !== target.assetUrl) throw new Error("preview artwork does not match the chosen concept");
  if (current.designId !== target.designId) throw new Error("designId does not match the chosen concept");
  const ui = await page.evaluate(`
    const card = document.querySelector('[data-concept-card="${target.id}"]');
    const tabs = [...document.querySelectorAll('nav[aria-label="Designer sections"] button')];
    return {
      pressed: card.getAttribute("aria-pressed"),
      marked: card.dataset.selected,
      unlocked: tabs.filter((t) => ["Refine","Roster","Order"].includes(t.innerText.trim())).every((t) => !t.disabled),
      previewSrc: document.querySelector("#production-canvas image")?.getAttribute("href") || "",
    };
  `);
  if (ui.pressed !== "true" || ui.marked !== "true") throw new Error("selected card has no selected state");
  if (!ui.unlocked) throw new Error("downstream steps stayed locked after selection");
  if (ui.previewSrc !== target.assetUrl) throw new Error("main preview did not update");
  return `${target.label} selected, preview + designId updated, downstream unlocked`;
});
await shot("05-desktop-selected-concept.png");

await check("switching selection swaps cleanly with no stale state", async () => {
  const concepts = (await state()).concepts;
  await page.click(`[data-concept-card="${concepts[3].id}"]`);
  await sleep(600);
  const current = await state();
  if (current.selectedConceptId !== concepts[3].id) throw new Error("second selection did not apply");
  if (current.artwork.front !== concepts[3].assetUrl) throw new Error("artwork did not follow the new selection");
  if (current.history.length) throw new Error("version history leaked across selections");
  await page.click(`[data-concept-card="${concepts[0].id}"]`);
  await sleep(600);
  const back = await state();
  if (back.selectedConceptId !== concepts[0].id) throw new Error("could not switch back");
  return "selection switches both directions without leaking artwork or history";
});

const selectedBeforeRefine = await state();
await check("natural-language refinement edits the selected render", async () => {
  await openStep("Refine");
  await page.waitFor("aside textarea");
  await page.type("aside textarea", "Add a moon detail near the lower jersey and sharpen the comet trails.");
  await page.clickText("aside button", "Update");
  await page.waitForCondition(
    `(JSON.parse(localStorage.getItem("besu-direct-ai-designer-v1")||"{}").state||{}).history?.length >= 1`,
    240_000,
    "refined version recorded",
  );
  const current = await state();
  if (current.artwork.front === selectedBeforeRefine.artwork.front) throw new Error("artwork did not advance");
  if (current.selectedConceptId !== selectedBeforeRefine.selectedConceptId) throw new Error("refinement changed the selected concept");
  if (current.designId !== selectedBeforeRefine.designId) throw new Error("refinement changed the designId");
  const refineRequest = page.requests.filter((r) => r.url.includes("/api/designer/generate")).length;
  return `history ${current.history.length}, designId preserved, ${refineRequest} total generation calls`;
});
await shot("06-desktop-refinement.png");

await check("colour variation recolours the current design without restarting it", async () => {
  const before = await state();
  await page.clickText("aside button", "Black / Electric Blue / White");
  await page.waitForCondition(
    `(JSON.parse(localStorage.getItem("besu-direct-ai-designer-v1")||"{}").state||{}).history?.length >= ${before.history.length + 1}`,
    240_000,
    "colour variation recorded",
  );
  const current = await state();
  if (current.colors.secondary.toLowerCase() !== "#00a3ff") throw new Error(`palette is ${JSON.stringify(current.colors)}`);
  if (current.selectedConceptId !== before.selectedConceptId) throw new Error("colour variation changed the concept");
  const identityKept = new URL(current.artwork.front).searchParams.get("variant") ===
    new URL(before.artwork.front).searchParams.get("variant");
  if (!identityKept) throw new Error("the recolour produced a different garment identity");
  return `palette ${Object.values(current.colors).join(" / ")}, garment identity preserved`;
});
await shot("07-desktop-color-variation.png");

await check("roster supports add, edit, second player and delete", async () => {
  await openStep("Roster");
  await page.clickText("aside button", "Add player");
  await sleep(400);
  let roster = (await state()).roster;
  if (roster.length !== 1) throw new Error("first player was not added");

  await page.type(`input[name="name-${roster[0].id}"]`, "Bryant");
  await page.type(`input[name="number-${roster[0].id}"]`, "24");
  await page.clickText("aside button", "Add player");
  await sleep(400);
  roster = (await state()).roster;
  if (roster.length !== 2) throw new Error("second player was not added");
  await page.type(`input[name="name-${roster[1].id}"]`, "Carter");
  await page.type(`input[name="number-${roster[1].id}"]`, "8");
  await sleep(300);

  const ids = (await state()).roster.map((p) => p.id);
  await page.type(`input[name="qty-${ids[0]}"]`, "2");
  await sleep(300);
  await selectSize(ids[0], "Top", "XL");
  await selectSize(ids[0], "Shorts", "XL");
  await selectSize(ids[1], "Top", "L");
  await selectSize(ids[1], "Shorts", "M");
  await sleep(300);
  const after = await state();
  const bryant = after.roster.find((p) => p.name === "Bryant");
  const carter = after.roster.find((p) => p.name === "Carter");
  if (!bryant || !carter) throw new Error(`roster names stored as ${after.roster.map((p) => p.name).join(", ")}`);
  if (bryant.number !== "24" || carter.number !== "8") throw new Error("player numbers were not stored");
  if (bryant.quantity !== 2) throw new Error(`quantity stored as ${bryant.quantity}`);
  if (after.roster.length !== 2) throw new Error("roster rows merged");
  if (bryant.topSize !== "XL" || bryant.shortsSize !== "XL") {
    throw new Error(`Bryant sizes stored as ${bryant.topSize}/${bryant.shortsSize}`);
  }
  if (carter.topSize === bryant.topSize && carter.shortsSize === bryant.shortsSize) {
    throw new Error("the second player did not get independent sizes");
  }
  return `Bryant #24 ${bryant.topSize}/${bryant.shortsSize} x${bryant.quantity}, Carter #8 ${carter.topSize}/${carter.shortsSize} x${carter.quantity}`;
});
await shot("08-desktop-roster.png");

await check("deleting a roster row removes only that row", async () => {
  const before = (await state()).roster;
  await page.evaluate(`
    const cards = [...document.querySelectorAll("aside .rounded-xl")];
    const buttons = [...document.querySelectorAll("aside button")].filter((b) => b.innerText.trim() === "Remove");
    if (!buttons.length) throw new Error("no Remove control");
    buttons[buttons.length - 1].setAttribute("data-qa-remove", "1");
    return true;
  `);
  await page.click("[data-qa-remove]");
  await sleep(500);
  const after = (await state()).roster;
  if (after.length !== before.length - 1) throw new Error(`roster went from ${before.length} to ${after.length}`);
  if (!after.some((p) => p.name === "Bryant")) throw new Error("the wrong row was deleted");
  await page.clickText("aside button", "Add player");
  await sleep(300);
  const restored = (await state()).roster;
  await page.type(`input[name="name-${restored[1].id}"]`, "Carter");
  await page.type(`input[name="number-${restored[1].id}"]`, "8");
  await page.type(`input[name="qty-${restored[1].id}"]`, "3");
  await sleep(300);
  return `deleted one row, roster now ${(await state()).roster.length}`;
});

await check("order review captures customer details and validates the order", async () => {
  await openStep("Order");
  await page.waitFor('input[autocomplete="name"]');
  await page.type('input[autocomplete="name"]', "Michael Bryant");
  await page.type('input[autocomplete="email"]', "michael@besucustoms.com");
  await page.type('input[autocomplete="tel"]', "+1 555 0123");
  await page.type("aside textarea", "Rush order for the GALACTIC season opener.");
  await sleep(400);
  const current = await state();
  if (current.customer.email !== "michael@besucustoms.com") throw new Error("customer email not stored");
  const totals = await page.evaluate(`return document.querySelector("aside").innerText.replace(/\\n+/g, " | ");`);
  return totals.slice(0, 120);
});
await shot("09-desktop-order-review.png");

await check("export panel offers PNG, SVG, PDF and ZIP for the current design", async () => {
  await page.clickText('[aria-label="Order panel"] *', "Files");
  await sleep(700);
  const buttons = await page.evaluate(`
    const list = [...document.querySelectorAll("aside button")].map((b) => ({ label: b.innerText.trim().toUpperCase(), disabled: b.disabled }));
    return list.filter((b) => ["PNG","SVG","PDF","ZIP"].includes(b.label));
  `);
  if (buttons.length !== 4) throw new Error(`found ${buttons.length} export formats`);
  const disabled = buttons.filter((b) => b.disabled).map((b) => b.label);
  if (disabled.length) throw new Error(`export disabled for ${disabled.join(", ")}`);
  return buttons.map((b) => b.label).join(", ");
});
await shot("10-desktop-export-options.png");

await check("PNG export renders the current design at the preview's aspect ratio", async () => {
  const result = await page.evaluate(`
    const svg = document.querySelector("#production-canvas svg");
    if (!svg) throw new Error("preview canvas missing");
    const href = svg.querySelector("image").getAttribute("href");
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const response = await fetch(href, { cache: "no-store" });
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });
    clone.querySelector("image").setAttribute("href", dataUrl);
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error("raster step failed")); image.src = url; });
    const canvas = document.createElement("canvas");
    const box = xml.match(/viewBox="0 0 ([\\d.]+) ([\\d.]+)"/);
    canvas.width = 2400;
    canvas.height = Math.round(2400 * Number(box[2]) / Number(box[1]));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL("image/png");
    URL.revokeObjectURL(url);
    return { width: canvas.width, height: canvas.height, bytes: png.length, artwork: href };
  `);
  if (result.height < 1400 || result.height > 1800) throw new Error(`raster is ${result.width}x${result.height}, aspect looks wrong`);
  const current = await state();
  if (result.artwork !== current.artwork.front) throw new Error("export used a stale render");
  return `${result.width}x${result.height} raster from the current render`;
});

// ---------------------------------------------------------------------------
// Shopify handoff: run the designer inside a same-origin parent frame
// ---------------------------------------------------------------------------
await check("Shopify checkout posts a besu:checkout payload carrying the current design", async () => {
  // The designer only posts to a parent frame. Reuse the app's own origin as that parent so
  // window.parent differs from window and the real postMessage path executes.
  await page.goto(BASE);
  await page.evaluate(`
    window.__besu = [];
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "besu:checkout") window.__besu.push(event.data);
    });
    document.body.replaceChildren();
    document.body.style.margin = "0";
    const frame = document.createElement("iframe");
    frame.id = "app";
    frame.src = "/";
    frame.style.cssText = "width:1440px;height:900px;border:0";
    document.body.appendChild(frame);
    await new Promise((resolve) => { frame.onload = resolve; setTimeout(resolve, 15000); });
    return true;
  `);
  await sleep(9000);
  await page.waitForCondition(
    `document.getElementById("app")?.contentDocument?.querySelector("[data-designer-shell]")`,
    45_000,
    "designer booted inside the parent frame",
  );

  const result = await page.evaluate(`
    const frame = document.getElementById("app");
    const doc = frame.contentDocument;
    const tabs = [...doc.querySelectorAll('nav[aria-label="Designer sections"] button')];
    const order = tabs.find((t) => t.innerText.trim() === "Order");
    if (!order) throw new Error("order tab missing inside the frame");
    if (order.disabled) throw new Error("order tab is locked inside the frame");
    order.click();
    await new Promise((r) => setTimeout(r, 900));
    const toggle = [...doc.querySelectorAll('[aria-label="Order panel"] *')].find((n) => n.innerText && n.innerText.trim() === "Files");
    if (toggle) { toggle.click(); await new Promise((r) => setTimeout(r, 900)); }
    const submit = [...doc.querySelectorAll("aside button")].find((b) => b.innerText.trim() === "Add to Shopify");
    if (!submit) throw new Error("Add to Shopify button missing");
    if (submit.disabled) return { blocked: true, reason: doc.querySelector('[role="alert"]')?.innerText || "validation blocked" };
    submit.click();
    await new Promise((r) => setTimeout(r, 1200));
    const messages = window.__besu;
    if (!messages.length) throw new Error("no besu:checkout message was posted");
    const payload = messages[0].payload;
    return {
      blocked: false,
      designId: payload.designId,
      frontArtwork: payload.context.artwork.front,
      items: payload.items.length,
      variantIds: payload.items.map((i) => i.variant_id),
      quantities: payload.items.map((i) => i.quantity),
      players: payload.items.map((i) => i.properties["Player name"] + "#" + i.properties["Player number"]),
      hasBase64: /data:image|base64/i.test(JSON.stringify(payload)),
      designIdOnItems: payload.items.every((i) => i.properties["_Design ID"] === payload.designId),
      note: payload.note,
    };
  `);

  if (result.blocked) throw new Error(`checkout blocked: ${result.reason}`);
  if (!result.designId) throw new Error("payload lost the design id");
  if (result.hasBase64) throw new Error("payload contains inline image data");
  if (!result.designIdOnItems) throw new Error("line items disagree with the payload design id");
  if (result.variantIds.some((id) => !id)) throw new Error("a line item has no mapped Shopify variant");
  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(
    path.join(EVIDENCE, "..", "shopify-payload-sample.json"),
    JSON.stringify({ ...result, capturedAt: new Date().toISOString() }, null, 2),
  );
  return `designId ${result.designId}, ${result.items} items ${JSON.stringify(result.quantities)}, variants ${result.variantIds.join(", ")}`;
});

// ===========================================================================
// Accessibility spot checks
// ===========================================================================
await page.goto(BASE);
await check("keyboard focus reaches the concept cards and prompt input", async () => {
  const reachable = await page.evaluate(`
    const focusable = [...document.querySelectorAll('button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.offsetParent !== null);
    document.querySelector("#studio-prompt").focus();
    const promptFocused = document.activeElement.id === "studio-prompt";
    return { count: focusable.length, promptFocused };
  `);
  if (!reachable.promptFocused) throw new Error("prompt input cannot take focus");
  if (reachable.count < 10) throw new Error(`only ${reachable.count} focusable controls`);
  return `${reachable.count} focusable controls, prompt focusable`;
});

await check("interactive controls expose labels and state", async () => {
  const audit = await page.evaluate(`
    const buttons = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
    const unlabelled = buttons.filter((b) => !(b.innerText || "").trim() && !b.getAttribute("aria-label"));
    const images = [...document.querySelectorAll("img")].filter((i) => i.offsetParent !== null && i.getAttribute("alt") === null);
    const inputs = [...document.querySelectorAll("input, textarea")].filter((el) => el.offsetParent !== null);
    const unlabelledInputs = inputs.filter((el) => {
      if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
      if (el.id && document.querySelector('label[for="' + el.id + '"]')) return false;
      return !el.closest("label");
    });
    return {
      buttons: buttons.length,
      unlabelled: unlabelled.length,
      imagesWithoutAlt: images.length,
      inputs: inputs.length,
      unlabelledInputs: unlabelledInputs.map((el) => el.name || el.id || el.tagName),
    };
  `);
  if (audit.unlabelled) throw new Error(`${audit.unlabelled} buttons have no accessible name`);
  if (audit.imagesWithoutAlt) throw new Error(`${audit.imagesWithoutAlt} images have no alt attribute`);
  if (audit.unlabelledInputs.length) throw new Error(`unlabelled inputs: ${audit.unlabelledInputs.join(", ")}`);
  return `${audit.buttons} buttons and ${audit.inputs} inputs all labelled`;
});

await check("reduced motion is honoured", async () => {
  await session.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await page.goto(BASE);
  await page.waitFor("[data-designer-shell]");
  const ok = await page.evaluate(`return Boolean(document.querySelector("[data-designer-shell]"));`);
  await session.send("Emulation.setEmulatedMedia", { features: [] });
  if (!ok) throw new Error("shell failed to render with reduced motion");
  return "shell renders with prefers-reduced-motion: reduce";
});

// ===========================================================================
// Responsive sweep — rebuild the flow state, then capture each breakpoint
// ===========================================================================
async function buildFlowState() {
  await page.evaluate(`localStorage.clear(); return true;`);
  await page.goto(BASE);
  await openStep("Brief");
  await page.waitFor('input[autocomplete="organization"]');
  await page.type('input[autocomplete="organization"]', TEAM);
  await page.type("aside textarea", BRIEF);
  await page.clickText("aside button", "Generate 4 concepts");
  await page.waitForCondition(
    `(JSON.parse(localStorage.getItem("besu-direct-ai-designer-v1")||"{}").state||{}).concepts?.length === 4`,
    240_000,
    "four concepts for responsive sweep",
  );
}

const responsive = [];
await page.viewport(1440, 900);
await buildFlowState();
const flowSnapshot = await page.evaluate(`return localStorage.getItem("besu-direct-ai-designer-v1");`);

for (const viewport of VIEWPORTS) {
  await page.viewport(viewport.width, viewport.height, viewport.mobile);
  await page.evaluate(`localStorage.setItem("besu-direct-ai-designer-v1", ${JSON.stringify(flowSnapshot)}); return true;`);
  await page.goto(BASE);
  await openStep("Choose");
  await sleep(700);

  const conceptsView = await page.evaluate(`
    const cards = [...document.querySelectorAll("[data-concept-card]")];
    const bar = document.querySelector("#studio-prompt");
    const tabs = [...document.querySelectorAll('nav[aria-label="Designer sections"] button')];
    const canvas = document.querySelector("#production-canvas");
    const small = [...document.querySelectorAll("aside button")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 32).length;
    return {
      cards: cards.length,
      cardsReadable: cards.every((c) => c.getBoundingClientRect().width > 120 && c.getBoundingClientRect().height > 80),
      promptVisible: Boolean(bar) && bar.getBoundingClientRect().width > 120 && bar.getBoundingClientRect().bottom <= window.innerHeight + 2,
      tabsVisible: tabs.length,
      canvasVisible: Boolean(canvas) && canvas.getBoundingClientRect().height > 120,
      smallTouchTargets: small,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  `);

  const row = {
    viewport: `${viewport.label} ${viewport.width}x${viewport.height}`,
    concepts: conceptsView.cards,
    overflow: conceptsView.overflow,
    promptVisible: conceptsView.promptVisible,
    canvasVisible: conceptsView.canvasVisible,
    cardsReadable: conceptsView.cardsReadable,
    smallTouchTargets: conceptsView.smallTouchTargets,
  };
  responsive.push(row);

  await check(`${viewport.label} (${viewport.width}x${viewport.height}) renders the Choose step correctly`, async () => {
    if (conceptsView.cards !== 4) throw new Error(`${conceptsView.cards} concept cards`);
    if (conceptsView.overflow > 1) throw new Error(`horizontal overflow of ${conceptsView.overflow}px`);
    if (!conceptsView.promptVisible) throw new Error("prompt bar not visible in the viewport");
    if (!conceptsView.canvasVisible) throw new Error("garment preview collapsed");
    if (!conceptsView.cardsReadable) throw new Error("concept cards too small to read");
    if (conceptsView.smallTouchTargets > 0) throw new Error(`${conceptsView.smallTouchTargets} controls under 32px tall`);
    return `4 cards, no overflow, ${conceptsView.tabsVisible} tabs reachable`;
  });

  if (viewport.id === "tablet-portrait") await shot("11-tablet-four-concepts.png");
  if (viewport.id === "mobile") await shot("14-mobile-four-concepts.png");
  if (viewport.id === "mobile-375") await shot("18-mobile-375-four-concepts.png");
  if (viewport.id === "laptop") await shot("19-laptop-four-concepts.png");
  if (viewport.id === "tablet-landscape") await shot("20-tablet-landscape-four-concepts.png");
  if (viewport.id === "mobile-small") await shot("21-mobile-small-four-concepts.png");

  // Selected-concept view for the primary tablet and mobile breakpoints.
  if (viewport.id === "tablet-portrait" || viewport.id === "mobile") {
    const target = (await state()).concepts[0];
    await page.click(`[data-concept-card="${target.id}"]`);
    await sleep(800);
    await shot(viewport.id === "tablet-portrait" ? "12-tablet-selected-concept.png" : "15-mobile-selected-concept.png");
  }
}

// Mobile-specific screens
await page.viewport(390, 844, true);
await page.evaluate(`localStorage.clear(); return true;`);
await page.goto(BASE);
await shot("13-mobile-initial.png");

await page.evaluate(`localStorage.setItem("besu-direct-ai-designer-v1", ${JSON.stringify(flowSnapshot)}); return true;`);
await page.goto(BASE);
await openStep("Choose");
await sleep(500);
const mobileTarget = (await state()).concepts[0];
await page.click(`[data-concept-card="${mobileTarget.id}"]`);
await sleep(700);

await check("mobile roster form is usable", async () => {
  await openStep("Roster");
  await page.clickText("aside button", "Add player");
  await sleep(400);
  const roster = (await state()).roster;
  await page.type(`input[name="name-${roster[0].id}"]`, "Bryant");
  await page.type(`input[name="number-${roster[0].id}"]`, "24");
  await sleep(300);
  const layout = await page.evaluate(`
    const inputs = [...document.querySelectorAll("aside input")].filter((i) => i.offsetParent !== null);
    return {
      inputs: inputs.length,
      minHeight: Math.min(...inputs.map((i) => i.getBoundingClientRect().height)),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  `);
  if (layout.overflow > 1) throw new Error(`overflow ${layout.overflow}px`);
  if (layout.minHeight < 36) throw new Error(`smallest input is ${layout.minHeight}px tall`);
  return `${layout.inputs} inputs, min height ${Math.round(layout.minHeight)}px, no overflow`;
});
await shot("16-mobile-roster.png");

await check("mobile order step is usable", async () => {
  await page.type('input[name="qty-' + (await state()).roster[0].id + '"]', "2");
  await openStep("Order");
  await page.waitFor('input[autocomplete="name"]');
  await page.type('input[autocomplete="name"]', "Michael Bryant");
  await page.type('input[autocomplete="email"]', "michael@besucustoms.com");
  await sleep(400);
  const layout = await page.horizontalOverflow();
  if (layout.overflow > 1) throw new Error(`overflow ${layout.overflow}px`);
  return `no overflow at ${layout.width}px`;
});
await shot("17-mobile-order.png");

// ===========================================================================
// Console / network health
// ===========================================================================
const noisyConsole = page.consoleErrors.filter((line) => !/favicon|Download the React DevTools/i.test(line));
const noisyNetwork = page.failedRequests.filter((line) => !/favicon/i.test(line));

record("no uncaught page exceptions", page.pageExceptions.length === 0, page.pageExceptions.slice(0, 3).join(" | "));
record("no unexpected console errors", noisyConsole.length === 0, noisyConsole.slice(0, 3).join(" | "));
record("no failed network requests", noisyNetwork.length === 0, noisyNetwork.slice(0, 3).join(" | "));

const failed = checks.filter((c) => !c.ok);
const summary = {
  ranAt: new Date().toISOString(),
  baseUrl: BASE,
  mode: "DESIGNER_MOCK_AI=true (deterministic preview renderer)",
  browser: session.browser.version,
  passed: checks.length - failed.length,
  failed: failed.length,
  checks,
  responsive,
  screenshots,
  totalGenerationRequests: page.generationRequests(),
  consoleErrors: noisyConsole,
  failedRequests: noisyNetwork,
  pageExceptions: page.pageExceptions,
};

fs.mkdirSync(path.dirname(RESULT), { recursive: true });
fs.writeFileSync(RESULT, JSON.stringify(summary, null, 2));
console.log(`\n${summary.passed} passed, ${summary.failed} failed. Results: ${RESULT}`);
await session.browser.close();
if (failed.length) process.exitCode = 1;
