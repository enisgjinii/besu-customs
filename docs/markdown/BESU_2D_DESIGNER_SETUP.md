# BESU Hybrid AI Uniform Designer

Production customer flow for Besu Customs: AI creates the garment artwork/design system, while BESU renders exact customer typography and approved logos deterministically in SVG. Four distinct master concepts are generated, one is selected, then that same master render can be refined or recolored before roster, export, and Shopify checkout.

## Customer journey

1. **Product** — choose jersey, shorts, or coordinated uniform.
2. **AI Brief** — team name + visual uniform description (+ optional inspiration, logo reference, guide colors).
3. **Concepts** — compare 1–4 finished master concepts. Four-concept mode uses Cosmic Energy, Velocity Cut, Heritage Court, and Elite Minimal as creative directions only; all use the same quality/presentation contract.
4. **Refine AI** — edit the selected master image instead of regenerating from scratch.
5. **Roster** — player names, sizes, numbers, quantities. Back typography is rendered separately from AI artwork.
6. **Order** — customer details, PNG/SVG/PDF/ZIP export, Shopify `besu:checkout`.

Refine, Roster, and Order are locked until `selectedConceptId` exists. Selecting a concept keeps one master render URL/design ID for downstream edit/reference workflows.

## Hybrid generation contract

`lib/designer/openai-service.ts` requires one **1536×1024 master uniform board**:

- FRONT is fixed in the left half; BACK is fixed in the right half;
- both views use the same garment cut, scale, camera, lighting, colors, trims, piping, gradients, panels, motifs and seam logic;
- basketball uses sleeveless jersey + matching shorts;
- the render is a professional ecommerce/product presentation, not a flat texture, UV map, sketch or random sample;
- the image model renders **no team name, player name, player number, labels, pseudo-text, fake letters, sponsors or invented logos**;
- calm typography-safe regions are reserved on the front chest and back name/number areas;
- an uploaded approved logo is composited by BESU, not hallucinated by the image model.

The exact team-name literal is removed from the visual prompt before it reaches the image model. `components/designer/uniform-typography-overlay.tsx` then renders customer wording as deterministic SVG using fixed front/back placement rules from `lib/designer/typography.ts`.

## Front/back presentation

`components/designer/garment-canvas.tsx` crops the same master concept into a true FRONT or BACK view. The user switches views with one click; no manual pan/zoom is required. The same SVG typography layer is used in previews and production exports, so the visible customer wording matches the order data.

## AI modes

- `generate` — create a new master concept from the visual brief.
- `refine` — edit the selected master render and keep every unmentioned element stable.
- `color_variation` — edit the selected master render with a geometry lock; only the palette should change.
- team-name-only edits — update the deterministic SVG instantly without another AI image call.

## Architecture

| Area | Location |
| --- | --- |
| UI shell | `components/designer/` |
| Master preview + front/back crop | `components/designer/garment-canvas.tsx` |
| Deterministic typography/logo layer | `components/designer/uniform-typography-overlay.tsx` |
| Typography placement | `lib/designer/typography.ts` |
| Concept selection | `components/designer/concept-panel.tsx` |
| State | `lib/designer/store.ts` |
| 1–4 concept generation | `lib/designer/generation-client.ts` |
| AI prompt contract | `lib/designer/openai-service.ts` |
| Generate/edit API | `app/api/designer/generate/route.ts` |
| Storage | `lib/designer/storage-service.ts` |
| Shopify | `lib/designer/shopify-service.ts` |
| Export | `lib/designer/export-service.ts` |

## Shopify and exports

The existing checkout handoff remains `{ type: "besu:checkout", payload }`. Team name, player name and player number continue to be separate structured order properties; AI artwork URLs remain the master image references.

PNG/SVG/PDF/ZIP remain available. Production capture now exports true front/back crops and includes deterministic SVG typography. The base AI art is still raster content inside the SVG wrapper.

## Environment

```text
OPENAI_API_KEY=
DESIGNER_MOCK_AI=false
NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN=
```

`OPENAI_API_KEY` remains server-only. The image model is deliberately hard-pinned in server code to `gpt-image-2`; there is no environment override or fallback model.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test:designer
pnpm build
```

`pnpm test:designer` verifies the no-AI-typography prompt contract, fixed master-board front/back rules, exact SVG typography, edit-based color preservation, four-concept selection flow, Shopify payload integrity and storage rules. `.github/workflows/designer-quality.yml` runs the same lint/type/test/build gate for designer changes.

The repository also keeps `scripts/qa-designer-flow.mjs` for browser-level desktop/tablet/mobile flow verification.

### Bryant / Michael acceptance scenario

1. Select **Basketball Uniform** and enter the team wording exactly as it should print.
2. Describe the visual theme without relying on AI to spell customer text.
3. Generate four concepts and confirm all four use the same professional presentation, proportions and front-left/back-right layout.
4. Confirm no concept contains AI-generated fake words, numbers, sponsor marks or invented logos.
5. Confirm the team name is crisp and exact on the front chest because it is SVG, not AI pixels.
6. Select a concept and switch Front/Back without dragging or zooming.
7. Add a roster player and confirm player name/number render only on the back.
8. Apply a new palette and confirm the edit uses the selected master render as reference and preserves design geometry.
9. Apply a targeted visual refinement and confirm front/back remain one synchronized design system.
10. Export front/back and confirm exact typography is present in the production SVG/PNG/PDF/ZIP.
11. Confirm Shopify retains the selected design ID, master artwork URL, team name, player name and player number as separate structured data.
