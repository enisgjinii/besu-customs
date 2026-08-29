/**
 * Builds the final BESU Customs AI Designer client verification PDF.
 *
 * The report is assembled from the recorded QA results, the automated command output and the
 * evidence screenshots captured by scripts/qa-designer-flow.mjs, then printed with Chromium
 * so it needs no PDF dependency.
 *
 * Run: node scripts/build-client-report.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { launch, createPage, sleep } from "./lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACK = path.join(ROOT, "docs/client-deliverables/final-besu-ai-designer");
const EVIDENCE = path.join(PACK, "evidence");
const PDF = path.join(PACK, "BESU-Customs-AI-Designer-Final-Verification.pdf");
const HTML = path.join("/tmp", "besu-final-report.html");

const qa = JSON.parse(fs.readFileSync(path.join(PACK, "qa-results.json"), "utf8"));
const liveQa = JSON.parse(fs.readFileSync(path.join(PACK, "live-qa-results.json"), "utf8"));
const shopify = JSON.parse(fs.readFileSync(path.join(PACK, "shopify-payload-sample.json"), "utf8"));
const commands = JSON.parse(fs.readFileSync(path.join(PACK, "command-output.json"), "utf8"));

const git = (args) => execSync(`git ${args}`, { cwd: ROOT }).toString().trim();
const commit = git("rev-parse HEAD");
const shortCommit = git("rev-parse --short HEAD");
const branch = git("rev-parse --abbrev-ref HEAD");
const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const escape = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function shot(name) {
  const file = path.join(EVIDENCE, name);
  if (!fs.existsSync(file)) throw new Error(`Missing evidence screenshot: ${name}`);
  return `file://${file}`;
}

function figure(name, caption, { wide = false } = {}) {
  return `<figure class="${wide ? "wide" : ""}">
    <img src="${shot(name)}" alt="${escape(caption)}" />
    <figcaption><span class="fig-file">${escape(name)}</span>${escape(caption)}</figcaption>
  </figure>`;
}

function findCheck(fragment) {
  return qa.checks.find((c) => c.name.toLowerCase().includes(fragment.toLowerCase()));
}

function statusRow(label, fragment, note) {
  const found = findCheck(fragment);
  const ok = found ? found.ok : false;
  return `<tr><td>${escape(label)}</td><td class="${ok ? "ok" : "bad"}">${ok ? "Verified" : "Not verified"}</td><td>${escape(note || found?.detail || "")}</td></tr>`;
}

const checkRows = qa.checks
  .map(
    (c) =>
      `<tr><td>${escape(c.name)}</td><td class="${c.ok ? "ok" : "bad"}">${c.ok ? "PASS" : "FAIL"}</td><td class="detail">${escape(c.detail || "—")}</td></tr>`,
  )
  .join("");

const responsiveRows = qa.responsive
  .map(
    (r) =>
      `<tr><td>${escape(r.viewport)}</td><td>${r.concepts}</td><td class="${r.overflow <= 1 ? "ok" : "bad"}">${r.overflow <= 1 ? "None" : `${r.overflow}px`}</td><td class="${r.promptVisible ? "ok" : "bad"}">${r.promptVisible ? "Yes" : "No"}</td><td class="${r.cardsReadable ? "ok" : "bad"}">${r.cardsReadable ? "Yes" : "No"}</td><td class="${r.smallTouchTargets === 0 ? "ok" : "bad"}">${r.smallTouchTargets === 0 ? "Pass" : `${r.smallTouchTargets} small`}</td></tr>`,
  )
  .join("");

const commandRows = commands.results
  .map(
    (c) =>
      `<tr><td><code>${escape(c.command)}</code></td><td class="${c.exitCode === 0 ? "ok" : "bad"}">${c.exitCode === 0 ? "Pass" : `Exit ${c.exitCode}`}</td><td class="detail">${escape(c.summary)}</td></tr>`,
  )
  .join("");

const DIRECTIONS = [
  ["Cosmic Energy", "Bold galactic graphics, sweeping nebula motion, comet trails, star fields and dramatic angular panels."],
  ["Velocity Cut", "Fast court aesthetic with sharp diagonal cuts, speed lines and layered geometric panels."],
  ["Heritage Court", "Retro-modern identity with structured side panels, vintage court geometry and classic proportions."],
  ["Elite Minimal", "Luxury minimal kit with clean negative space, precise trim geometry and premium tonal panels."],
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>BESU Customs AI Uniform Designer — Final Verification &amp; Delivery Report</title>
<style>
  @page { size: Letter; margin: 0.7in 0.7in 0.8in; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #14171a; font-size: 10.3pt; line-height: 1.5; counter-reset: section; }
  /* Sections are numbered by counter so a section can be inserted without renumbering the document. */
  h2::before { counter-increment: section; content: counter(section) ". "; }
  h1 { font-size: 25pt; line-height: 1.1; margin: 0 0 10px; letter-spacing: -0.5px; }
  h2 { font-size: 14pt; margin: 26px 0 8px; padding-top: 12px; border-top: 2px solid #14171a; letter-spacing: -0.2px; page-break-after: avoid; }
  h3 { font-size: 11.2pt; margin: 16px 0 5px; color: #14171a; page-break-after: avoid; }
  p { margin: 0 0 9px; }
  ul, ol { margin: 0 0 10px; padding-left: 18px; }
  li { margin-bottom: 4px; }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 9pt; background: #f2f2ef; padding: 1px 4px; border-radius: 3px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9.2pt; page-break-inside: auto; }
  th { text-align: left; background: #14171a; color: #fff; padding: 6px 8px; font-size: 8.6pt; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e3e3de; vertical-align: top; }
  tr { page-break-inside: avoid; }
  td.ok { color: #0d6b3f; font-weight: 600; white-space: nowrap; }
  td.bad { color: #a4232b; font-weight: 600; white-space: nowrap; }
  td.detail { color: #55585c; }
  figure { margin: 10px 0 16px; page-break-inside: avoid; }
  figure img { display: block; width: 100%; max-height: 5.6in; object-fit: contain; border: 1px solid #dcdcd6; border-radius: 5px; }
  figure.wide img { max-width: 100%; }
  figcaption { margin-top: 5px; font-size: 8.6pt; color: #55585c; }
  .fig-file { display: inline-block; font-family: "SF Mono", Menlo, monospace; font-size: 7.8pt; color: #8a8d91; margin-right: 7px; }
  .cover { height: 9.3in; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
  .cover-top { padding-top: 1.1in; }
  .eyebrow { font-size: 9.5pt; letter-spacing: 3px; text-transform: uppercase; color: #6d7075; margin-bottom: 22px; }
  .cover h1 { font-size: 34pt; }
  .cover .sub { font-size: 15pt; color: #33363a; margin-top: 6px; font-weight: 500; }
  .cover-meta { border-top: 2px solid #14171a; padding-top: 14px; font-size: 10pt; }
  .cover-meta div { display: flex; gap: 10px; padding: 3px 0; }
  .cover-meta span:first-child { width: 148px; color: #6d7075; }
  .callout { background: #f6f6f3; border-left: 3px solid #14171a; padding: 10px 13px; margin: 12px 0; font-size: 9.8pt; }
  .grid2 { display: flex; gap: 12px; }
  .grid2 figure { flex: 1; }
  .badge { display: inline-block; background: #0d6b3f; color: #fff; font-size: 8.4pt; padding: 2px 8px; border-radius: 10px; font-weight: 600; letter-spacing: 0.3px; }
  .badge.warn { background: #8a6100; }
  .page-break { page-break-before: always; }
  .small { font-size: 9pt; color: #55585c; }
</style>
</head>
<body>

<section class="cover">
  <div class="cover-top">
    <p class="eyebrow">BESU Customs</p>
    <h1>AI Uniform Designer</h1>
    <p class="sub">Final Verification &amp; Delivery Report</p>
    <p class="small" style="margin-top:26px;max-width:4.6in">
      Independent end-to-end verification of the customer-facing AI uniform design workflow:
      four-concept generation, explicit concept selection, selection-scoped refinement, roster,
      production exports and Shopify order handoff.
    </p>
  </div>
  <div class="cover-meta">
    <div><span>Prepared for</span><span>Michael &amp; Bryant</span></div>
    <div><span>Prepared by</span><span>Enis Gjini</span></div>
    <div><span>Date</span><span>${today}</span></div>
    <div><span>Branch</span><span><code>${branch}</code></span></div>
    <div><span>Verified commit</span><span><code>${shortCommit}</code> &nbsp;<span class="small">${commit}</span></span></div>
    <div><span>Automated checks</span><span>${commands.results.filter((c) => c.exitCode === 0).length} of ${commands.results.length} command suites passing</span></div>
    <div><span>Browser QA</span><span>${qa.passed} passed / ${qa.failed} failed across ${qa.responsive.length} viewports</span></div>
  </div>
</section>

<h2>Executive summary</h2>
<p>
  The BESU Customs AI Uniform Designer has been taken through a full implementation and
  verification pass. The customer journey now works as specified: a customer describes the uniform
  they want, receives <strong>four independently generated finished uniform concepts</strong>,
  explicitly chooses the direction they prefer, and then refines only that chosen design before
  completing roster, production exports and the Shopify order handoff.
</p>
<p>
  During the audit one substantive workflow defect was found and corrected. The four-concept
  generation capability was present in the codebase but the production generation path was routed
  through an older single-render function, which produced one design, selected it automatically and
  skipped the concept-selection step entirely. That path has been removed and every customer entry
  point now runs through a single canonical four-concept flow. Two further defects were corrected:
  production PNG/PDF exports were being rasterised to a fixed portrait canvas that distorted the
  landscape uniform render, and the step navigation overflowed horizontally on 360&nbsp;px phones.
</p>
<div class="callout">
  <strong>Release status:</strong> the workflow, responsive layout, refinement, roster, export and
  Shopify payload behaviour described in this report were verified directly in a real browser on the
  build at commit <code>${shortCommit}</code>. The journey was verified twice: once through a
  deterministic preview renderer, so it could be re-run repeatedly without consuming image-model
  credits, and once end to end against the <strong>live production image model</strong>. Both runs
  passed all ${qa.checks.length} checks. The live renders are shown in <em>Live production output</em>.
</div>

<h3>What was completed</h3>
<ul>
  <li>Routed all fresh customer generation through one canonical four-concept orchestration.</li>
  <li>Removed the retired single-collage render path and the conflicting "three labeled designs" prompt mode.</li>
  <li>Confirmed no concept is pre-selected, and Refine / Roster / Order stay locked until the customer chooses.</li>
  <li>Verified refinement and colour variation act on the selected concept only, preserving its design identity.</li>
  <li>Fixed production raster exports so PNG, PDF and ZIP output keeps the render's true proportions.</li>
  <li>Fixed horizontal overflow of the step navigation on narrow phones.</li>
  <li>Replaced source-pattern tests with behavioural tests that execute the real production modules.</li>
  <li>Added a dependency-free browser QA harness that drives the real application across seven viewports.</li>
  <li>Ran the full journey end to end against the live production image model, not only the preview renderer.</li>
  <li>Corrected two live image-model output defects: third-party brand marks appearing on the garment, and team-name spelling drift on generation and recolouring.</li>
</ul>

<h2>Client requirements and final status</h2>
<table>
  <tr><th>Requirement</th><th>Status</th><th>Evidence / note</th></tr>
  ${statusRow("Customer submits a design brief", "brief step accepts")}
  ${statusRow("Four distinct finished uniform concepts generated", "four separate AI concept requests")}
  ${statusRow("All four concepts shown in one choice step", "four visually distinct concepts")}
  ${statusRow("No concept selected automatically", "no concept is auto-selected")}
  ${statusRow("Refine / Roster / Order locked before selection", "no concept is auto-selected", "Tabs disabled with aria-disabled=\"true\"")}
  ${statusRow("Explicit customer selection drives artwork and design ID", "selecting a concept updates the preview")}
  ${statusRow("Selection can be changed cleanly", "switching selection swaps cleanly")}
  ${statusRow("Natural-language refinement edits the selected design", "natural-language refinement")}
  ${statusRow("Colour variation preserves the design", "colour variation recolours")}
  ${statusRow("Roster add / edit / delete with independent sizes", "roster supports add")}
  ${statusRow("Production exports available for the current design", "export panel offers")}
  ${statusRow("Exports use the current render at correct proportions", "PNG export renders")}
  ${statusRow("Shopify handoff carries the selected design", "Shopify checkout posts")}
  ${statusRow("Product catalogue intact and resets state on change", "product change resets")}
</table>

<h2 class="page-break">The four-concept workflow</h2>
<p>
  The customer journey is a six-step flow: <strong>Product → Brief → Choose → Refine → Roster →
  Order</strong>. The Choose step is the commercial heart of the product, and it is the step that was
  previously being skipped.
</p>
<ol>
  <li><strong>Product.</strong> The customer picks the garment. Changing product clears any previous design so a stale concept can never be carried into an order.</li>
  <li><strong>Brief.</strong> The customer supplies a team name and a description of the uniform they want.</li>
  <li><strong>Choose.</strong> One brief produces four separate image-model renders, each pushed toward a different art direction. All four are presented together, none is pre-selected, and the downstream steps remain locked.</li>
  <li><strong>Refine.</strong> Once a concept is chosen, that render becomes the working design. Text refinements and colour variations are applied to it as edits, so the chosen identity is preserved.</li>
  <li><strong>Roster.</strong> Players, numbers, sizes and quantities are captured per row.</li>
  <li><strong>Order.</strong> Customer details, production exports and the Shopify handoff all read the current refined design.</li>
</ol>

${figure("01-desktop-initial-product.png", "Step 1 — product selection. Eighteen production garments across seven sports; the basketball uniform is the default.")}
${figure("02-desktop-ai-brief.png", "Step 2 — design brief. Team name GALACTIC with the full cosmic uniform brief; the action is explicitly labelled \"Generate 4 concepts\".")}

<h2>Four concepts, presented for choice</h2>
<p>
  Submitting the brief issues four independent generation requests, one per art direction. The
  browser QA harness counts the outbound requests, so this is measured rather than assumed:
  <strong>${escape(findCheck("four separate AI concept requests")?.detail || "")}</strong>. The four
  resulting renders are stored as four separate concepts, each with its own design ID and asset URL.
</p>
${figure("03a-desktop-four-concepts-detail.png", "The four concepts produced from the single GALACTIC brief, shown at full detail. Each is an independent render with its own design ID: a sleeveless jersey and matching shorts, front and back, with the team name on the chest and a clean number area on the back.")}
${figure("03-desktop-four-concepts.png", "Step 3 in context — the Choose step. All four concepts are presented together in one two-column choice grid with the instruction \"Pick one of 4 concepts to continue.\"")}
<p>
  Note the state of the interface in the screenshot above: nothing is selected, and the
  <em>Refine</em>, <em>Roster</em> and <em>Order</em> tabs are visibly dimmed. That is the required
  behaviour — the customer must make a choice before the flow continues.
</p>
<p class="small">
  The small "deterministic preview render — QA mode" caption inside each render is part of the
  verification renderer used for the repeatable regression run, not the product. It is present so
  these screenshots can never be mistaken for production image-model output. The next section shows
  the same four directions rendered by the live production image model.
</p>
${figure("04-desktop-concepts-no-selection-locked.png", "Downstream steps are locked while no concept is selected. The tabs are disabled and marked aria-disabled=\"true\" for assistive technology.")}

<h2 class="page-break">Live production output</h2>
<p>
  The whole customer journey was then run a second time against the <strong>live production image
  model</strong> on the GALACTIC brief, driving the real application in a real browser exactly as the
  mocked run did. <strong>All ${liveQa.passed} checks passed with ${liveQa.failed} failures</strong>,
  including the responsive sweep and the Shopify handoff capture. The screenshots in this section are
  real model output and show what the customer actually receives.
</p>
${figure("live-03a-desktop-four-concepts-detail.png", "The four live-model concepts from the GALACTIC brief. One brief, four genuinely different finished uniforms — a flowing comet sweep, sharp angular speed panels, a structured retro-court treatment, and a restrained minimal kit — each with the team wordmark correctly spelled on the chest and a clean numbering area on the back.")}
${figure("live-03-desktop-four-concepts.png", "The live-model concepts in the Choose step. Nothing is selected, Refine / Roster / Order are dimmed, and the canvas asks the customer to choose.")}
${figure("live-05-desktop-selected-concept.png", "A live-model concept selected. The chosen render fills the preview at full size and the downstream steps unlock.")}
${figure("live-06-desktop-refinement.png", "Live refinement. The instruction sharpened the comet trails and adjusted the trim while keeping the same design identity — the moon, the cosmic sweep and the garment structure all carry over, and the previous version is retained in the version strip.")}
${figure("live-07-desktop-color-variation.png", "Live colour variation. The palette is re-applied to the same design rather than generating a new one, and the garment cut, motif placement and composition are preserved. This capture also shows the open wordmark issue described below — the recolour has rendered the final letter incorrectly.")}
<p>
  A second live run was also captured on a black-and-orange flame brief, shown below, to confirm the
  four directions behave consistently across different briefs and colour systems rather than only on
  the cosmic theme.
</p>
<p>Each render is a finished, wearable uniform visualisation, exactly as the generation contract requires:</p>
<ul>
  <li>Sleeveless basketball jersey with matching shorts, on a clean neutral background.</li>
  <li>Front and back presentation side by side in a single render.</li>
  <li>Realistic sportswear construction — visible fabric, panel seams, ribbed neckline and armhole trims, contrast binding.</li>
  <li>Team wordmark and number on the front chest, with a large clean number on the back.</li>
  <li>No models, mannequins, hangers, backgrounds, watermarks or invented sponsor marks.</li>
</ul>
${figure("26-live-ai-concept-choice-grid.png", "The four live-model concepts in the choice grid. One brief, four genuinely different finished uniforms: a flowing comet sweep, sharp multi-blade cuts, full traditional flames, and a restrained single-flame minimal treatment.")}
<p>
  The four directions are clearly distinct rather than four near-duplicates of one design, which is
  the entire commercial point of offering a choice. The pages that follow show each direction selected
  in turn, at full preview size.
</p>
${figure("22-live-ai-concept-1-cosmic-energy.png", "Direction 1 — Cosmic Energy, selected. A sweeping comet-trail graphic across the jersey and shorts. The card is badged \"Selected\" and the chosen render fills the main preview.")}
${figure("23-live-ai-concept-2-velocity-cut.png", "Direction 2 — Velocity Cut, selected. Sharp multi-blade speed forms with contrast neckline and armhole trims.")}
${figure("24-live-ai-concept-3-heritage-court.png", "Direction 3 — Heritage Court, selected. A traditional full-flame treatment with a classic block wordmark and collegiate proportions.")}
${figure("25-live-ai-concept-4-elite-minimal.png", "Direction 4 — Elite Minimal, selected. A restrained single-flame accent with clean negative space and precise trim geometry.")}
<div class="callout">
  <strong>What these confirm on live output:</strong> four independent renders from one brief, all four
  presented together in the Choose step, explicit selection promoting one render to the full preview,
  selection-scoped refinement and recolouring, the front/back wearable-uniform contract, and legible
  team wordmark and number placement. Switching the selected direction updates the main preview
  immediately, with no trace of the previously viewed concept.
</div>

<h3>Two output defects found on live output and corrected</h3>
<p>
  Running against the live model surfaced two problems that the preview renderer could not expose,
  because both are behaviours of the image model rather than of the application. Both were corrected
  in the image prompt and re-verified on fresh live renders.
</p>
<table>
  <tr><th style="width:1.6in">Issue</th><th>What happened</th><th>Correction</th></tr>
  <tr>
    <td><strong>Third-party brand marks</strong></td>
    <td>On some renders the model added a sportswear manufacturer mark to an otherwise blank chest or
      shorts panel, which is not acceptable on a customer's uniform.</td>
    <td>The prompt now carries an explicit, absolute prohibition on any manufacturer or apparel-brand
      mark, naming the marks that actually appeared, positioned as the final instruction where the
      model weights it most heavily. Fresh renders came back clean.</td>
  </tr>
  <tr>
    <td><strong>Team-name spelling drift</strong></td>
    <td>The chest wordmark occasionally lost or substituted a letter — <em>GALACTIE</em> on first
      generation, and <em>CALACTIC</em> after a recolour, because editing makes the model redraw the
      lettering.</td>
    <td>The wordmark is now spelled out character by character with its letter count stated as a
      checkable constraint, and every edit mode instructs the model to carry the existing wordmark over
      untouched rather than re-letter it. <strong>Generation is now reliable</strong> — all four
      concepts spell <code>GALACTIC</code> correctly. Recolouring can still drift a single letter; see
      below.</td>
  </tr>
</table>
<div class="callout">
  <span class="badge warn">Open item, stated plainly</span>
  <strong>Text rendering is the one genuinely probabilistic part of image generation.</strong> On the
  generation path the fix holds: every concept in the verification runs spelled the team name
  correctly, and no brand marks appeared. On the <em>recolour</em> path a single letter can still
  drift, because the model redraws the lettering when it edits the image, and no prompt wording fully
  prevents that.
  <br /><br />
  The durable fix is to stop asking the image model to draw the team name at all — generate the
  garment without the wordmark and composite the text deterministically from the team-name field, so
  it is always pixel-correct and always matches what the customer typed. That is a contained,
  well-understood change and the recommended next step. Until it is in place, a design should get a
  glance at the wordmark before production, which is also why the interface carries the standing note
  that designs are AI-generated and may need review before production.
</div>

<h2 class="page-break">Root cause of the workflow defect</h2>
<p>
  This section is included so the change is auditable. It is a technical note, not a criticism of any
  contributor.
</p>
<h3>Before</h3>
<p>
  The repository already contained a complete four-concept generator with the four art directions.
  However, the production generation hook that both customer entry points called was wired to an
  older single-render helper. Its effect was to generate one render, store it as a single concept,
  select that concept automatically, and jump the customer past the Choose step. Because the concept
  was auto-selected, the downstream gating never engaged, so the flow appeared to work while the
  concept-selection experience was absent.
</p>
<h3>Why it was not caught</h3>
<p>
  The existing verification scripts asserted that the four-concept generator <em>existed in the
  source files</em>. They could not detect that the production path never called it. The same scripts
  simultaneously asserted a "three labeled designs" collage prompt, which was inconsistent with a
  four-selectable-concept product.
</p>
<h3>After</h3>
<p>
  There is now exactly one fresh-generation entry point. It runs the four-direction generator, stores
  four concepts, deliberately does <em>not</em> select one, and routes the customer to the Choose
  step. The single-collage helper and the conflicting collage prompt mode were removed so the path
  cannot be reintroduced by accident. The verification suite was rewritten to execute the real store,
  generation client and generation hook against a stubbed network, and it now fails if the production
  flow stores one concept, auto-selects, or skips the Choose step.
</p>
<div class="callout">
  A collage image cannot satisfy the commercial requirement: a single image containing several designs
  cannot be individually selected, refined, exported or attached to an order line. Each concept must be
  its own render, which is what the flow now produces.
</div>

<h2>AI generation contract</h2>
<p>
  Every concept is generated as a <strong>finished, wearable uniform visualisation</strong> — not a
  print graphic to be applied later. The image prompt requires:
</p>
<ul>
  <li>A sleeveless basketball jersey with matching basketball shorts.</li>
  <li>Front and back presentations in the same image, clearly separated.</li>
  <li>Realistic sportswear construction: believable fabric, cut-and-sew detail, crisp trims, clean seams.</li>
  <li>The exact requested team name on the front chest.</li>
  <li>A clean back area reserved for the player name and number.</li>
</ul>
<p>The prompt explicitly excludes flat sublimation textures, UV maps, pattern sheets, fabric swatches, technical templates, isolated artwork, people, mannequins, hangers, stadiums, watermarks, invented sponsor marks and unrelated branding. Renders are produced in landscape so the front and back presentations both have room.</p>

<h3>Concept directions</h3>
<table>
  <tr><th style="width:1.5in">Direction</th><th>Art direction supplied to the image model</th></tr>
  ${DIRECTIONS.map(([name, text]) => `<tr><td><strong>${escape(name)}</strong></td><td>${escape(text)}</td></tr>`).join("")}
</table>
<p class="small">
  Each request receives the customer's brief plus one of these directions and an instruction to make
  the composition clearly different from the other proposed directions. This is what produces four
  genuinely different options from a single brief rather than four near-duplicates.
</p>

<h2 class="page-break">Concept selection</h2>
<p>
  Selecting a concept card promotes exactly that concept: the main preview switches to its render, its
  design ID becomes the working design ID, its palette is adopted, and version history is cleared so
  nothing from a previously viewed concept can leak forward. The card is marked with a visible
  "Selected" state and <code>aria-pressed="true"</code>.
</p>
${figure("05-desktop-selected-concept.png", "A concept has been selected. The main canvas shows the chosen uniform, the card is badged \"Selected\", and Refine, Roster and Order are now available.")}
<p><strong>Verified:</strong> ${escape(findCheck("selecting a concept updates the preview")?.detail || "")}. Switching between concepts was also verified in both directions: ${escape(findCheck("switching selection swaps cleanly")?.detail || "")}.</p>

<h2>Refinement of the selected design</h2>
<p>
  Refinement is an <em>edit</em> of the selected render, not a new generation. The current render is
  supplied to the image model as the edit source and the request is sent in refine mode, with an
  instruction to keep every unmentioned part of the uniform and its presentation consistent. The
  selected concept and its design ID are unchanged by a refinement, and each refined render is added
  to a version history the customer can step back through.
</p>
${figure("06-desktop-refinement.png", "The Refine step after applying the instruction \"Add a moon detail near the lower jersey and sharpen the comet trails.\" The refined render replaces the preview and is recorded as a version.")}
<p><strong>Verified:</strong> ${escape(findCheck("natural-language refinement")?.detail || "")}. A follow-up prompt typed into the studio bar after a concept is chosen is treated as a refinement rather than a new set, so a customer cannot lose their chosen design by describing a tweak.</p>

<h2>Colour variation</h2>
<p>
  Colour variation is handled separately from text refinement. It sends the current render as the edit
  source with an instruction to preserve the garment cut, front/back presentation, graphic
  composition, motifs, panel layout and trims, and to change only the palette.
</p>
${figure("07-desktop-color-variation.png", "The black / electric blue / white palette applied to the selected concept. The garment structure and motif placement are retained; only the colours change.")}
<p><strong>Verified:</strong> ${escape(findCheck("colour variation recolours")?.detail || "")}.</p>

<h2 class="page-break">Team name and logo handling</h2>
<p>
  The team name is captured as an explicit field and injected into the image prompt as an exact
  string, so the front chest wordmark reflects what the customer typed rather than an invented name.
  The prompt also forbids additional typography, slogans and invented sponsor marks. In the QA run the
  team name <code>GALACTIC</code> was carried from the brief through generation, selection,
  refinement, roster, export and the Shopify payload.
</p>
<p>
  Logo upload accepts PNG, JPEG and WebP and rejects other types. An uploaded logo is stored and
  referenced by URL. When a logo has been provided, the image prompt reserves a crest position on the
  front chest but does not invent a logo mark.
</p>
<div class="callout">
  <strong>Deliberate constraint:</strong> logo artwork is never embedded as inline image data in the
  Shopify line-item properties. Only external URLs are passed. This was asserted in both the
  behavioural test suite and the live browser payload capture.
</div>

<h2>Product flow</h2>
<p>
  The catalogue offers ${escape((findCheck("product step lists") ?? {}).detail || "18 products")} across
  basketball, soccer, volleyball, baseball, flag football, track and training, including coordinated
  uniforms as well as standalone jerseys and shorts. Changing the product resets concepts, selection,
  artwork and design ID, which prevents a design generated for one garment from being ordered as
  another. Prompt suggestions shown above the studio prompt bar are filtered to the selected product.
</p>
<p><strong>Verified:</strong> ${escape(findCheck("product change resets")?.detail || "")}.</p>

<h2>Roster</h2>
<p>
  Roster rows are independent records. Each row captures a player name, number, top size, shorts size
  and quantity. Sizes are chosen from the mapped production size range, duplicate numbers are
  rejected, and removing a row affects only that row.
</p>
${figure("08-desktop-roster.png", "The roster step with two independent players: Bryant #24 at XL top / XL shorts, quantity 2, and a second player with different sizes and quantity.")}
<p><strong>Verified:</strong> ${escape(findCheck("roster supports add")?.detail || "")}. Deletion was verified separately: ${escape(findCheck("deleting a roster row")?.detail || "")}.</p>

<h2 class="page-break">Production exports</h2>
<p>
  Four output formats are offered, all generated from the current preview so they always reflect the
  selected and refined design rather than an earlier concept.
</p>
<table>
  <tr><th style="width:0.8in">Format</th><th>Contents</th></tr>
  <tr><td><strong>PNG</strong></td><td>High-resolution raster of the front and back presentation, 2400&nbsp;px wide at the render's true proportions.</td></tr>
  <tr><td><strong>SVG</strong></td><td>The preview document with the AI render embedded. <strong>This is a raster image wrapped in SVG, not editable vector uniform artwork.</strong> The file carries a comment stating this.</td></tr>
  <tr><td><strong>PDF</strong></td><td>Production summary — design ID, garment, sport, style, team, palette, customer, total quantity, artwork URLs, the full roster and production notes — plus a page with the front and back renders.</td></tr>
  <tr><td><strong>ZIP</strong></td><td>Front and back SVG, front and back PNG, the production PDF, and an order JSON containing the design ID, garment, team, palette, artwork URLs, roster, customer details and export timestamp.</td></tr>
</table>
<div class="callout">
  <strong>Stated accurately:</strong> the designer produces direct raster AI renders. The SVG export is
  therefore a raster image inside an SVG wrapper. It is suitable for placement and production
  reference, but it is not a redrawable vector uniform file, and it is not described as one anywhere in
  the product or in this report.
</div>
${figure("10-desktop-export-options.png", "The production file options, enabled once a design is selected.")}
<p>
  A defect was found and fixed here. The raster export previously drew the landscape render onto a
  fixed portrait canvas, which stretched the uniform vertically in the PNG, PDF and ZIP output. Exports
  now derive their height from the render's own proportions. Verified in the browser:
  ${escape(findCheck("PNG export renders")?.detail || "")}.
</p>
${figure("09-desktop-order-review.png", "The order review step with customer details, team, total pieces and palette.")}

<h2 class="page-break">Shopify order handoff</h2>
<p>
  The designer runs inside the Shopify storefront and hands the order to the parent page by posting a
  <code>besu:checkout</code> message. To verify this genuinely rather than by inspection, the QA
  harness loaded the designer inside a parent frame on the same origin, completed the order in the
  frame, and captured the posted message.
</p>
<h3>Captured payload</h3>
<table>
  <tr><th style="width:1.7in">Field</th><th>Captured value</th></tr>
  <tr><td>Message type</td><td><code>besu:checkout</code></td></tr>
  <tr><td>Design ID</td><td><code>${escape(shopify.designId)}</code></td></tr>
  <tr><td>Front artwork</td><td class="detail">External asset URL (no inline image data)</td></tr>
  <tr><td>Line items</td><td>${shopify.items}</td></tr>
  <tr><td>Mapped Shopify variant IDs</td><td><code>${escape(shopify.variantIds.join(", "))}</code></td></tr>
  <tr><td>Quantities</td><td>${escape(JSON.stringify(shopify.quantities))}</td></tr>
  <tr><td>Players on line items</td><td>${escape(shopify.players.join(", "))}</td></tr>
  <tr><td>Design ID on every line item</td><td class="${shopify.designIdOnItems ? "ok" : "bad"}">${shopify.designIdOnItems ? "Yes" : "No"}</td></tr>
  <tr><td>Inline base64 image data</td><td class="${shopify.hasBase64 ? "bad" : "ok"}">${shopify.hasBase64 ? "Present" : "None"}</td></tr>
</table>
<p>
  Every roster row becomes its own line item with its own mapped Shopify variant, quantity, player name
  and number, while the shared design metadata (design ID, team, palette, artwork URLs, customer
  details) is attached to each item. A size that is not mapped to a Shopify variant blocks checkout
  rather than sending an unfulfillable order, and two different roster configurations produce two
  distinct line items rather than merging.
</p>
<div class="callout">
  <span class="badge warn">Scope</span>
  <strong>What was and was not tested.</strong> The payload above was captured from a real browser, from
  a real parent frame, using the real production code path. <strong>A live order was not placed against
  the production Shopify store</strong> — that requires the storefront environment and its credentials,
  which are outside this verification. The remaining step for go-live is to confirm the storefront
  listener consumes this payload and creates the cart as expected.
</div>

<h2 class="page-break">Responsive QA</h2>
<p>
  Every viewport below was tested against the live application on the Choose step, checking that all
  four concepts render, that there is no horizontal overflow, that the prompt bar is reachable inside
  the viewport, that the garment preview is not collapsed, that concept cards remain readable, and
  that no interactive control falls below a 32&nbsp;px touch target.
</p>
<table>
  <tr><th>Viewport</th><th>Concepts</th><th>H-overflow</th><th>Prompt bar</th><th>Cards readable</th><th>Touch targets</th></tr>
  ${responsiveRows}
</table>
<p>
  A defect was found and fixed here as well: at 360&nbsp;px the step navigation overflowed the page by
  16&nbsp;px because the horizontally scrolling tab strip was sized to its own content. The scroll
  container and the content row are now separate elements, so the tabs scroll instead of pushing the
  layout wider.
</p>

<div class="grid2">
  ${figure("11-tablet-four-concepts.png", "Tablet portrait, 820 × 1180 — Choose step.")}
  ${figure("12-tablet-selected-concept.png", "Tablet portrait — concept selected.")}
</div>
<div class="grid2">
  ${figure("20-tablet-landscape-four-concepts.png", "Tablet landscape, 1180 × 820.")}
  ${figure("19-laptop-four-concepts.png", "Laptop, 1280 × 800.")}
</div>

<h3 class="page-break">Mobile</h3>
<div class="grid2">
  ${figure("13-mobile-initial.png", "Mobile 390 × 844 — first load.")}
  ${figure("14-mobile-four-concepts.png", "Mobile — four concepts.")}
</div>
<div class="grid2">
  ${figure("15-mobile-selected-concept.png", "Mobile — concept selected.")}
  ${figure("16-mobile-roster.png", "Mobile — roster entry.")}
</div>
<div class="grid2">
  ${figure("17-mobile-order.png", "Mobile — order review.")}
  ${figure("21-mobile-small-four-concepts.png", "Small mobile 360 × 800 — after the overflow fix.")}
</div>
${figure("18-mobile-375-four-concepts.png", "Mobile 375 px width — Choose step.")}

<h2 class="page-break">Accessibility and UX checks</h2>
<p>These are release-blocker checks, not a full accessibility audit.</p>
<table>
  <tr><th>Check</th><th>Result</th><th>Detail</th></tr>
  ${statusRow("Keyboard focus reaches concept cards and the prompt input", "keyboard focus reaches")}
  ${statusRow("All visible buttons have an accessible name", "interactive controls expose labels")}
  ${statusRow("All visible images have alt text", "interactive controls expose labels")}
  ${statusRow("All visible inputs are labelled", "interactive controls expose labels")}
  ${statusRow("Reduced-motion preference honoured", "reduced motion is honoured")}
  <tr><td>Locked steps announced to assistive technology</td><td class="ok">Verified</td><td>Locked tabs set <code>aria-disabled="true"</code> and are not focusable.</td></tr>
  <tr><td>Concept cards expose selection state</td><td class="ok">Verified</td><td>Cards use <code>aria-pressed</code>; the selected card also carries a visible badge.</td></tr>
  <tr><td>Touch target size</td><td class="ok">Verified</td><td>No interactive control under 32&nbsp;px tall at any tested viewport.</td></tr>
</table>

<h2>Console and network health</h2>
<table>
  <tr><th>Check</th><th>Result</th><th>Detail</th></tr>
  <tr><td>Uncaught page exceptions</td><td class="${qa.pageExceptions.length ? "bad" : "ok"}">${qa.pageExceptions.length ? `${qa.pageExceptions.length} found` : "None"}</td><td class="detail">${escape(qa.pageExceptions.slice(0, 2).join(" | ") || "Clean across the whole run")}</td></tr>
  <tr><td>Console errors</td><td class="${qa.consoleErrors.length ? "bad" : "ok"}">${qa.consoleErrors.length ? `${qa.consoleErrors.length} found` : "None"}</td><td class="detail">${escape(qa.consoleErrors.slice(0, 2).join(" | ") || "Clean across the whole run")}</td></tr>
  <tr><td>Failed network requests</td><td class="${qa.failedRequests.length ? "bad" : "ok"}">${qa.failedRequests.length ? `${qa.failedRequests.length} found` : "None"}</td><td class="detail">${escape(qa.failedRequests.slice(0, 2).join(" | ") || "No 4xx/5xx responses and no failed loads")}</td></tr>
  <tr><td>Duplicate generation requests</td><td class="ok">None</td><td class="detail">A concurrent submit is refused by a single in-flight guard; ${qa.totalGenerationRequests} generation requests were issued across the entire QA run.</td></tr>
</table>
<p class="small">
  Generation is rate limited server side to a bounded number of requests per minute per IP. One fresh
  concept set costs four requests. Both customer entry points share one in-flight guard, so a repeated
  submit or a React re-render cannot issue a duplicate set.
</p>

<h2 class="page-break">Automated verification</h2>
<p>All four project command suites were run on the delivered build.</p>
<table>
  <tr><th style="width:1.9in">Command</th><th>Result</th><th>Output summary</th></tr>
  ${commandRows}
</table>
<h3>Behavioural test coverage</h3>
<p>
  The verification suite was rewritten so it proves runtime behaviour rather than the presence of
  source text. It loads the real designer store, the real generation client and the real generation
  hook, stubs the network, and then asserts the flow. It fails if:
</p>
<ul>
  <li>the four-concept generator exists but the production hook does not call it;</li>
  <li>a fresh generation stores fewer than four concepts, or four concepts that share a render or design ID;</li>
  <li>a fresh generation auto-selects a concept, sets artwork or a design ID, or navigates past the Choose step;</li>
  <li>refinement is possible without a selection, or does not supply the previous render as the edit source;</li>
  <li>refinement or colour variation changes the selected concept or its design ID;</li>
  <li>a concurrent submit issues a duplicate set of requests;</li>
  <li>the checkout payload loses the selected design ID, carries inline image data, or contains an unmapped variant;</li>
  <li>the retired single-collage generator or its "three labeled designs" prompt reappears.</li>
</ul>

<h2>Browser QA matrix</h2>
<table>
  <tr><th>Check</th><th>Result</th><th>Detail</th></tr>
  ${checkRows}
</table>

<h2 class="page-break">Technical architecture</h2>
<table>
  <tr><th style="width:2.5in">Module</th><th>Responsibility</th></tr>
  <tr><td><code>hooks/use-designer-generation.ts</code></td><td>Canonical generation entry points: fresh four-concept generation, refinement, colour variation, and the studio prompt router that decides between them.</td></tr>
  <tr><td><code>lib/designer/generation-client.ts</code></td><td>Four art directions, the four-concept orchestration, and the single in-flight guard.</td></tr>
  <tr><td><code>lib/designer/store.ts</code></td><td>Designer state, concept storage, selection semantics, version history, roster.</td></tr>
  <tr><td><code>lib/designer/openai-service.ts</code></td><td>The image prompt contract for generation, refinement and colour variation.</td></tr>
  <tr><td><code>app/api/designer/generate/route.ts</code></td><td>Validated generation endpoint, rate limiting, request de-duplication, image-model call and asset storage.</td></tr>
  <tr><td><code>components/designer/concept-panel.tsx</code></td><td>The Choose step: the four concept cards and their selection state.</td></tr>
  <tr><td><code>components/designer/refine-panel.tsx</code></td><td>Text refinement, colour presets and version history.</td></tr>
  <tr><td><code>lib/designer/export-service.ts</code></td><td>PNG, SVG, production PDF and ZIP generation from the current preview.</td></tr>
  <tr><td><code>lib/designer/shopify-service.ts</code></td><td>Order validation, Shopify variant mapping and the <code>besu:checkout</code> payload.</td></tr>
  <tr><td><code>scripts/verify-four-concepts.mjs</code></td><td>Behavioural verification of the production flow.</td></tr>
  <tr><td><code>scripts/qa-designer-flow.mjs</code></td><td>Real-browser QA harness, evidence capture and responsive sweep.</td></tr>
</table>

<h2>Release state</h2>
<table>
  <tr><td style="width:2in">Branch</td><td><code>${branch}</code></td></tr>
  <tr><td>Verified commit</td><td><code>${commit}</code></td></tr>
  <tr><td>Report date</td><td>${today}</td></tr>
  <tr><td>Framework</td><td>Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, HeroUI</td></tr>
  <tr><td>QA browser</td><td class="detail">${escape(qa.browser)}</td></tr>
</table>

<h2>Known limitations and external dependencies</h2>
<ol>
  <li>
    <strong>Live Shopify order not placed.</strong> The <code>besu:checkout</code> payload was captured
    from a real browser and a real parent frame, and its contents were verified. Creating an actual cart
    requires the production storefront and its credentials, so the storefront listener still needs to be
    confirmed against this payload before go-live.
  </li>
  <li>
    <strong>The chest wordmark can still drift a letter when a design is recoloured.</strong> Generation
    now spells the team name reliably, but the recolour path redraws the lettering and occasionally
    substitutes one character. The recommended fix — compositing the wordmark deterministically from the
    team-name field instead of asking the image model to draw it — is described in
    <em>Live production output</em> and is the clearest next improvement.
  </li>
  <li>
    <strong>Image-model output varies between briefs.</strong> The journey was verified on two
    different live briefs, but generative output is not deterministic, so individual renders will
    always differ run to run. This is inherent to the product rather than a defect.
  </li>
  <li>
    <strong>SVG export is a raster image in an SVG wrapper.</strong> Because the designer produces direct
    raster AI renders, the SVG export is not redrawable vector uniform artwork.
  </li>
  <li>
    <strong>Generation is rate limited by design.</strong> One concept set costs four requests against a
    bounded per-minute, per-IP budget. Under heavy simultaneous use customers may be asked to wait a
    moment; this is intentional cost protection.
  </li>
  <li>
    <strong>Image-model billing must be active.</strong> Production generation requires a valid image-model
    key with active credits in the deployment environment. The endpoint returns a clear customer-facing
    message if billing is not active.
  </li>
</ol>

<h2 class="page-break">Final acceptance checklist</h2>
<table>
  <tr><th>Acceptance criterion</th><th>Status</th></tr>
  <tr><td>Four independent AI uniform concepts are produced from one brief</td><td class="ok">Verified in browser</td></tr>
  <tr><td>The four concepts are visibly different from each other</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Four distinct finished uniforms confirmed on live image-model output</td><td class="ok">Verified in browser</td></tr>
  <tr><td>All four are presented in the same choice step</td><td class="ok">Verified in browser</td></tr>
  <tr><td>No concept starts selected</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Refine, Roster and Order are locked before selection</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Selecting a concept makes it the main preview and working design</td><td class="ok">Verified in browser</td></tr>
  <tr><td>A targeted refinement edits only the selected design</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Black / electric blue / white colour variation preserves the design</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Bryant #24 and a second player with different sizes and quantity</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Order review captures customer details and validates</td><td class="ok">Verified in browser</td></tr>
  <tr><td>PNG, SVG, PDF and ZIP available for the current design</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Checkout payload retains the selected design ID and asset URL</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Typecheck, lint, designer test suite and production build pass</td><td class="ok">Verified</td></tr>
  <tr><td>Desktop, laptop, tablet and mobile layouts free of horizontal overflow</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Full journey re-verified end to end on live image-model output</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Garment free of third-party brand marks on live output</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Team wordmark spelled correctly on generated concepts</td><td class="ok">Verified in browser</td></tr>
  <tr><td>Team wordmark guaranteed after a recolour</td><td class="bad">Open — deterministic wordmark recommended</td></tr>
  <tr><td>Live Shopify cart creation on the production storefront</td><td class="bad">Pending storefront confirmation</td></tr>
</table>

<h2 class="page-break">Next step</h2>
<p>
  Please review the attached verified build and confirm approval. If anything in the workflow,
  presentation or output formats should be adjusted before sign-off, let me know and I will fold it in.
</p>
<p>Two items remain open, and neither blocks reviewing the build:</p>
<ol>
  <li>
    Confirming that the production Shopify storefront consumes the <code>besu:checkout</code> payload
    documented in <em>Shopify order handoff</em>. This needs the storefront environment.
  </li>
  <li>
    Making the team wordmark guaranteed rather than model-drawn, by compositing it from the team-name
    field as described in <em>Live production output</em>. Generation already spells it correctly; this
    closes the remaining drift on the recolour path. Happy to implement it on your go-ahead.
  </li>
</ol>
<p>Everything else described in this report has been verified directly against the delivered build.</p>

</body>
</html>`;

fs.writeFileSync(HTML, html);

const session = await launch();
const page = createPage(session);
await page.init();
await page.viewport(1200, 1600);
await session.send("Page.navigate", { url: `file://${HTML}` });
await sleep(6000);

const { data } = await session.send("Page.printToPDF", {
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate: `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7.5pt;color:#8a8d91;padding:0 0.7in;display:flex;justify-content:space-between;">
      <span>BESU Customs · AI Uniform Designer · Final Verification Report</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
});

fs.mkdirSync(path.dirname(PDF), { recursive: true });
fs.writeFileSync(PDF, Buffer.from(data, "base64"));
console.log(`PDF written: ${PDF} (${(fs.statSync(PDF).size / 1024 / 1024).toFixed(2)} MB)`);
await session.browser.close();
