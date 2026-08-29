# BESU Customs AI Uniform Designer — Final QA Report

| | |
| --- | --- |
| Date | 29 August 2026 |
| Branch | `main` |
| Verified commit | `3a15d54` — `fix: ask for the concept choice in the canvas instead of the example gallery` |
| Verdict | **Pass — ready for client review.** One external item remains (live Shopify storefront confirmation). |

## Scope

End-to-end verification of the public customer journey:

```
Product → Brief → Choose (4 concepts) → Refine → Roster → Order / export / Shopify handoff
```

Verification was done by driving the running application in a real browser, not by reading source.

## Root cause corrected

Fresh customer generation was routed through a single-render helper. It produced one render, stored
it as a single concept, selected that concept automatically, and advanced the customer past the
Choose step — so the concept-selection experience never ran, even though a complete four-direction
generator existed in the codebase. The existing verification scripts asserted only that the
four-concept generator *existed in the source*, so they could not detect that production never
called it.

All fresh generation now runs through one canonical four-concept path that stores four concepts and
selects none. The retired single-collage helper and its conflicting "three labeled designs" prompt
mode were removed so the path cannot be reintroduced.

Two further defects were found and fixed while verifying:

1. Raster exports drew the landscape render onto a fixed portrait canvas, distorting PNG, PDF and
   ZIP output. Export height is now derived from the render's own proportions.
2. The step navigation overflowed the page by 16 px at 360 px width, because the horizontally
   scrolling tab strip was sized to its own content. The scroll container and content row are now
   separate elements.

The Choose step was also changed to a two-column grid so all four concepts are visible at once, and
the main canvas now asks for the choice instead of showing the inspiration gallery while concepts
are awaiting selection.

## Commands run

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass — `tsc --noEmit`, no type errors |
| `npm run lint` | Pass — ESLint with `--max-warnings=0`, no errors or warnings |
| `npm run test:designer` | Pass — 3 suites, 25 named assertions, 0 failures |
| `npm run build` | Pass — Next.js production build succeeded |
| `git diff --check` | Clean |
| `node scripts/qa-designer-flow.mjs http://localhost:3200` | Pass — 32 browser checks, 0 failures |
| `node scripts/build-client-report.mjs` | Pass — client PDF generated and page-by-page inspected |

Raw command summaries are recorded in `command-output.json`.

## Browser QA

- Harness: `scripts/qa-designer-flow.mjs` (dependency-free Chrome DevTools Protocol driver in `scripts/lib/cdp.mjs`)
- Browser: HeadlessChrome 152
- Mode: `DESIGNER_MOCK_AI=true` — the deterministic preview renderer, so the full journey could be
  repeated without consuming image-model credits. The four-concept generation and selection
  behaviour was then confirmed a second time on **live production image-model output** (evidence
  `22`–`26`).
- Result: **32 passed, 0 failed**
- Generation requests issued across the whole run: 10 (one fresh set of 4, plus refinement and
  colour variation) — no duplicate or runaway requests
- Console errors: 0 · Uncaught page exceptions: 0 · Failed network requests: 0

Full per-check results are recorded in `qa-results.json`.

### Scenario verified (Bryant final acceptance)

Product Basketball Uniform · Team GALACTIC · full cosmic brief.

1. Four independent generation requests issued from one brief — measured, not assumed.
2. Four concepts stored, four unique renders and design IDs, all four rendered together.
3. No concept auto-selected; artwork and design ID unset; Refine / Roster / Order disabled with
   `aria-disabled="true"`.
4. Explicit selection promoted that concept to preview, artwork and working design ID, and unlocked
   downstream steps.
5. Selection switched in both directions with no stale artwork or history leaking through.
6. Natural-language refinement edited the selected render, supplying the previous render as the edit
   source and preserving the selected concept and its design ID.
7. Black / electric-blue / white colour variation recoloured the current design without restarting it.
8. Roster: Bryant #24 XL/XL, second player Carter #8 with different sizes and quantity, plus edit and
   delete of a single row without affecting others.
9. Order review captured customer details and validated.
10. PNG, SVG, PDF and ZIP offered for the current design; PNG verified to rasterise at the preview's
    aspect ratio.
11. `besu:checkout` payload captured from a real parent frame: correct design ID, external artwork
    URLs, two line items with mapped Shopify variant IDs, correct quantities and player data, design
    ID on every line item, and no inline base64 image data.

## Viewports

All seven were tested on the Choose step. Every one: 4 concepts rendered, **0 px** horizontal
overflow, prompt bar reachable inside the viewport, garment preview not collapsed, concept cards
readable, and no interactive control under 32 px tall.

| Viewport | Size |
| --- | --- |
| Desktop | 1440 × 900 |
| Laptop | 1280 × 800 |
| Tablet portrait | 820 × 1180 |
| Tablet landscape | 1180 × 820 |
| Mobile | 390 × 844 |
| Small mobile | 360 × 800 |
| Mobile narrow | 375 × 812 |

Mobile roster entry and mobile order review were verified separately as usable.

## Accessibility spot checks

Keyboard focus reaches the concept cards and the prompt input; all visible buttons have accessible
names; all visible images have alt text; all visible inputs are labelled; the reduced-motion
preference is honoured; locked steps set `aria-disabled="true"` and are not focusable; concept cards
expose `aria-pressed` alongside a visible selected badge.

This was a release-blocker check, not a full accessibility audit.

## Live production image-model confirmation

Separately from the mocked regression run, the delivered build was run against the live production
image model on a black-and-orange flame brief. Confirmed on real model output:

- One brief produced four independent finished uniform renders.
- The four directions are genuinely different — a flowing comet sweep, sharp multi-blade cuts, full
  traditional flames, and a restrained single-flame minimal treatment — not four near-duplicates.
- All four appeared together in the Choose step, and explicit selection promoted one render to the
  full preview with no trace of the previously viewed concept.
- Each render satisfies the generation contract: sleeveless jersey with matching shorts, front and
  back in one render, realistic construction with visible fabric, panel seams and ribbed neckline and
  armhole trims, team wordmark and number on the chest, large clean number on the back, and no
  models, mannequins, hangers, backgrounds, watermarks or invented sponsor marks.

Evidence: `22-live-ai-concept-1-cosmic-energy.png`, `23-live-ai-concept-2-velocity-cut.png`,
`24-live-ai-concept-3-heritage-court.png`, `25-live-ai-concept-4-elite-minimal.png`,
`26-live-ai-concept-choice-grid.png`.

This live confirmation covers generation, the four directions and selection. It was not re-run for
every downstream step, and image-model output naturally varies between briefs.

## Evidence

`evidence/` — 27 PNG screenshots captured from the final build:

```
01-desktop-initial-product.png
02-desktop-ai-brief.png
03-desktop-four-concepts.png
03a-desktop-four-concepts-detail.png
04-desktop-concepts-no-selection-locked.png
05-desktop-selected-concept.png
06-desktop-refinement.png
07-desktop-color-variation.png
08-desktop-roster.png
09-desktop-order-review.png
10-desktop-export-options.png
11-tablet-four-concepts.png
12-tablet-selected-concept.png
13-mobile-initial.png
14-mobile-four-concepts.png
15-mobile-selected-concept.png
16-mobile-roster.png
17-mobile-order.png
18-mobile-375-four-concepts.png
19-laptop-four-concepts.png
20-tablet-landscape-four-concepts.png
21-mobile-small-four-concepts.png
22-live-ai-concept-1-cosmic-energy.png      (live production image model)
23-live-ai-concept-2-velocity-cut.png       (live production image model)
24-live-ai-concept-3-heritage-court.png     (live production image model)
25-live-ai-concept-4-elite-minimal.png      (live production image model)
26-live-ai-concept-choice-grid.png          (live production image model)
```

## External blockers

1. **Live Shopify order not placed.** The `besu:checkout` payload was captured and verified from a
   real browser and a real parent frame using the production code path. Creating an actual cart
   requires the production storefront and its credentials, so the storefront listener still needs to
   be confirmed against this payload before go-live.
2. **The repeatable regression run used the deterministic preview renderer.** It verifies the
   workflow, state handling, gating, exports and order payloads. Live image-model output was
   confirmed separately for generation, the four directions and selection, but was not re-run for
   every downstream step, and model output naturally varies between briefs.
3. **Image-model billing must be active** in the deployment environment for production generation.
   The endpoint returns a clear customer-facing message if it is not.
4. **SVG export is a raster image in an SVG wrapper**, because the designer produces direct raster
   AI renders. It is not redrawable vector uniform artwork and is not described as such.

## Deliverables

| File | Contents |
| --- | --- |
| `BESU-Customs-AI-Designer-Final-Verification.pdf` | Long-form client verification and delivery report |
| `EMAIL_TO_MICHAEL.txt` | Email-ready delivery message |
| `FINAL_QA_REPORT.md` | This report |
| `qa-results.json` | Machine-readable browser QA results |
| `command-output.json` | Automated command results |
| `shopify-payload-sample.json` | Captured `besu:checkout` payload |
| `evidence/` | Screenshot evidence |
