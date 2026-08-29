# BESU Customs AI Uniform Designer — Final QA Report

| | |
| --- | --- |
| Date | 29 August 2026 |
| Branch | `main` |
| Verified commit | `3a15d54` — `fix: ask for the concept choice in the canvas instead of the example gallery` |
| Verdict | **Pass — ready for client review.** Two items remain open: live Shopify storefront confirmation, and a recommended deterministic team-name composite. |

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
| `node scripts/qa-designer-flow.mjs http://localhost:3200` | Pass — 32 browser checks, 0 failures (preview renderer) |
| `BESU_QA_LIVE=1 node scripts/qa-designer-flow.mjs http://localhost:3300` | Pass — 32 browser checks, 0 failures (live image model) |
| `node scripts/build-client-report.mjs` | Pass — client PDF generated and page-by-page inspected |

Raw command summaries are recorded in `command-output.json`.

## Browser QA

- Harness: `scripts/qa-designer-flow.mjs` (dependency-free Chrome DevTools Protocol driver in `scripts/lib/cdp.mjs`)
- Browser: HeadlessChrome 152
- Mode: run twice — once with `DESIGNER_MOCK_AI=true` (the deterministic preview renderer, so the
  journey can be repeated without consuming image-model credits) and once against the **live
  production image model**, which is reported under *Live production image-model run* below.
- Result: **32 passed, 0 failed** in both modes
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

## Live production image-model run

The identical journey was also driven end to end against the **live production image model**
(`gpt-image-1`, `DESIGNER_MOCK_AI=false`) on the GALACTIC brief:

```
BESU_QA_LIVE=1 node scripts/qa-designer-flow.mjs http://localhost:3300
```

Result: **32 passed, 0 failed** — the same 32 checks as the mocked run, including the responsive
sweep across all seven viewports and the `besu:checkout` capture. Results in `live-qa-results.json`,
evidence prefixed `live-`.

Confirmed on real model output: one brief produced four independent finished uniform renders; the
four directions are genuinely different; all four appeared together in the Choose step with nothing
pre-selected; explicit selection promoted one render to the full preview; refinement edited the
selected render while preserving its identity; and recolouring re-applied the palette to the same
design. Each render satisfies the generation contract — sleeveless jersey with matching shorts,
front and back in one render, realistic construction, team wordmark on the chest, clean number area
on the back, and no models, mannequins, hangers, backgrounds or watermarks.

A second live run on a black-and-orange flame brief (evidence `22`–`26`) confirms the four
directions behave consistently across different briefs and colour systems.

### Two live-output defects found and corrected

Both are image-model behaviours the preview renderer could not expose.

1. **Third-party brand marks.** Some renders added a sportswear manufacturer mark to an otherwise
   blank chest or shorts panel — unacceptable on a customer's uniform. The prompt now carries an
   explicit absolute prohibition naming the marks that actually appeared, positioned as the final
   instruction. Re-verified clean on fresh live renders, inspected at zoom.
2. **Team-name spelling drift.** The chest wordmark lost or substituted a letter — `GALACTIE` on
   generation, `CALACTIC` after a recolour. The wordmark is now spelled out character by character
   with its letter count asserted, and every edit mode instructs the model to carry the existing
   wordmark over rather than re-letter it.

**Generation is now reliable** — all four concepts spell `GALACTIC` correctly across runs.
**The recolour path can still drift one letter** (observed `GALACTIG`), because editing makes the
model redraw the lettering and no prompt wording fully prevents that. Both prompt constraints are
locked in by assertions in `scripts/verify-designer-2d.mjs`.

**Recommended fix, not yet implemented:** stop asking the image model to draw the team name —
generate the garment without the wordmark and composite the text deterministically from the
team-name field, so it is always pixel-correct.

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

Plus the complete live-image-model capture set, same journey and viewports, prefixed `live-`:

```
live-01-desktop-initial-product.png          live-13-mobile-initial.png
live-02-desktop-ai-brief.png                 live-14-mobile-four-concepts.png
live-03-desktop-four-concepts.png            live-15-mobile-selected-concept.png
live-03a-desktop-four-concepts-detail.png    live-16-mobile-roster.png
live-04-desktop-concepts-no-selection-locked.png  live-17-mobile-order.png
live-05-desktop-selected-concept.png         live-18-mobile-375-four-concepts.png
live-06-desktop-refinement.png               live-19-laptop-four-concepts.png
live-07-desktop-color-variation.png          live-20-tablet-landscape-four-concepts.png
live-08-desktop-roster.png                   live-21-mobile-small-four-concepts.png
live-09-desktop-order-review.png             live-11-tablet-four-concepts.png
live-10-desktop-export-options.png           live-12-tablet-selected-concept.png
```

## External blockers

1. **Live Shopify order not placed.** The `besu:checkout` payload was captured and verified from a
   real browser and a real parent frame using the production code path. Creating an actual cart
   requires the production storefront and its credentials, so the storefront listener still needs to
   be confirmed against this payload before go-live.
2. **The chest wordmark can still drift a letter when a design is recoloured.** Generation spells it
   reliably; the recolour path redraws the lettering and occasionally substitutes one character. The
   recommended remedy is the deterministic wordmark composite described above.
3. **Image-model output varies between briefs.** The journey was verified on two live briefs, but
   generative output is not deterministic, so individual renders differ run to run. This is inherent
   to the product, not a defect.
4. **Image-model billing must be active** in the deployment environment for production generation.
   The endpoint returns a clear customer-facing message if it is not.
5. **SVG export is a raster image in an SVG wrapper**, because the designer produces direct raster
   AI renders. It is not redrawable vector uniform artwork and is not described as such.

## Deliverables

| File | Contents |
| --- | --- |
| `BESU-Customs-AI-Designer-Final-Verification.pdf` | Long-form client verification and delivery report |
| `EMAIL_TO_MICHAEL.txt` | Email-ready delivery message |
| `FINAL_QA_REPORT.md` | This report |
| `qa-results.json` | Machine-readable browser QA results (preview renderer) |
| `live-qa-results.json` | Machine-readable browser QA results (live image model) |
| `command-output.json` | Automated command results |
| `shopify-payload-sample.json` | Captured `besu:checkout` payload |
| `evidence/` | Screenshot evidence |
