# BESU Direct AI Uniform Designer

Production customer flow for Besu Customs: the customer describes a uniform and AI renders the finished sportswear concept directly. There is no public flat 2D texture-placement workflow. Four distinct direct AI renders are generated, one is selected, then the selected render can be refined/recolored before roster, export, and Shopify checkout.

## Customer journey

1. **Product** — choose jersey, shorts, or coordinated uniform.
2. **AI Brief** — Team Name + uniform description (+ optional inspiration, logo reference, guide colors). CTA: **Generate 4 Direct AI Uniforms**.
3. **Concepts** — compare four finished AI-rendered uniform concepts: Cosmic Energy, Velocity Cut, Heritage Court, and Elite Minimal. A concept must be selected before continuing.
4. **Refine AI** — ask AI to modify the selected finished uniform or recolor it while preserving the design identity.
5. **Roster** — players, sizes, numbers, quantities.
6. **Order** — customer details, PNG/SVG/PDF/ZIP export, Shopify `besu:checkout`.

Refine, Roster, and Order are locked until `selectedConceptId` exists. Selecting a concept stores its direct AI render URL and design ID for downstream refinement/export/checkout.

## Direct AI generation contract

`lib/designer/openai-service.ts` explicitly requires the image model to create a **finished wearable uniform visualization**, not a flat sublimation graphic, UV map, print sheet, template, pattern swatch, or isolated artwork.

For a basketball uniform the AI must render:

- sleeveless basketball jersey + matching shorts;
- front and back product presentations in the same image;
- realistic sportswear construction, seams, trims, and fabric;
- the supplied team name on the front jersey chest;
- a clean player-name/number area on the back;
- no person, mannequin, hanger, stadium, watermark, fake sponsor, or random branding.

The four concept directions are intentionally different:

- **Cosmic Energy** — galactic motion, nebula/comet energy and angular premium basketball styling.
- **Velocity Cut** — aggressive diagonals, speed lines and modern pro-court geometry.
- **Heritage Court** — retro-modern championship structure and classic basketball proportions.
- **Elite Minimal** — luxury negative space, precise trim geometry and restrained pro-team styling.

The generation endpoint permits up to 12 generation requests per minute per IP. A fresh four-concept set consumes four requests, leaving bounded capacity for regeneration and AI refinement/color variations.

## Architecture

| Area | Location |
| --- | --- |
| UI shell | `components/designer/` |
| Direct AI preview | `components/designer/garment-canvas.tsx` |
| Concept selection | `components/designer/concept-panel.tsx` |
| State | `lib/designer/store.ts` |
| Four-concept generation | `lib/designer/generation-client.ts` |
| Direct AI prompt contract | `lib/designer/openai-service.ts` |
| Generate/edit API | `app/api/designer/generate/route.ts` |
| Storage | `lib/designer/storage-service.ts` |
| Shopify | `lib/designer/shopify-service.ts` |
| Export | `lib/designer/export-service.ts` |

Legacy 3D/template utilities remain in the repository for older/admin routes, but the public AI designer no longer composes generated artwork into an SVG garment silhouette.

## AI modes

- `generate` — create a new finished uniform product render.
- `refine` — edit the selected previous direct uniform render according to a natural-language correction.
- `color_variation` — keep garment cut, composition, motifs, panels, trims, and visual identity while recoloring the finished render.

## Logo reference

The uploaded logo is retained with the design/order. During direct generation the AI is instructed to reserve a clean crest location rather than inventing a fake logo. The source logo file remains available for production handoff.

## Shopify

Checkout posts `{ type: "besu:checkout", payload }` to the parent iframe. The payload includes the selected direct AI design ID, render URLs, roster metadata, product handles, and variant IDs. Base64 logo data is not sent in Shopify properties.

## Exports

PNG / SVG / PDF / ZIP remain available. The SVG export is a wrapper around the raster AI render and is not represented as editable vector uniform artwork.

## Environment

```text
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DESIGNER_ASSETS_BUCKET=designer-assets
DESIGNER_MOCK_AI=false
NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN=
```

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test:designer
pnpm build
```

`pnpm test:designer` verifies both the direct-AI prompt contract and the four-selectable-concepts flow.

### Bryant acceptance scenario

1. Select **Basketball Uniform**.
2. Team: **GALACTIC**.
3. Brief: *sleeveless basketball uniform jersey + shorts, outer space with moon and comets, premium NBA-style presentation*.
4. Generate exactly **4 visually different finished AI uniform renders**.
5. Each render must visibly show the actual uniform product rather than a flat print graphic.
6. Each uniform must show jersey + shorts with front/back presentation.
7. Confirm Refine / Roster / Order remain locked until one AI uniform is selected.
8. Select one render and confirm the full AI image becomes the main preview.
9. Apply black / electric blue / white and confirm AI keeps the selected uniform composition while recoloring it.
10. Ask AI for a targeted refinement and confirm it edits the previous render rather than starting from a flat template.
11. Confirm roster/order/export/Shopify retain the selected design ID and render URL.
