# BESU 2D AI Designer

Production customer flow for Besu Customs: AI-first 2D sports uniform design with four-direction concept selection, deterministic typography, roster, exports, and Shopify checkout handoff. Legacy 3D routes remain available under admin/review paths and are not loaded on the public home route.

## Customer journey

1. **Product** — choose jersey, shorts, or coordinated uniform (name, description, price when available).
2. **Brief** — Team Name + Design Description (+ optional inspiration, logo, guide colors). CTA: **Generate 4 Concepts**.
3. **Concepts** — compare four intentionally different art directions: Cosmic Energy, Velocity Cut, Heritage Court, and Elite Minimal. A concept must be selected before continuing.
4. **Refine** — Try Different Colors (preserves the selected concept), free-text refinement, version history. Advanced placement is secondary.
5. **Roster** — players, sizes, quantities; select a preview player for the back view.
6. **Order** — checklist, customer details, PNG/SVG/PDF/ZIP export, Shopify `besu:checkout`.

Refine, Roster, and Order are locked until `selectedConceptId` exists. Selecting a concept loads its artwork into both coordinated front/back views, keeps the original palette mode (AI-selected palette or guide colors), and sets the selected design ID for downstream export/checkout.

## Four-concept generation

`lib/designer/generation-client.ts` owns the concept set. One customer brief is expanded into four deliberately different art-direction prompts and generated as four separate stored assets. The concepts are not recolors of a single composition.

The directions are:

- **Cosmic Energy** — galactic motion, comet trails, nebula energy and angular premium basketball panels.
- **Velocity Cut** — aggressive diagonals, speed lines and modern pro-court geometry.
- **Heritage Court** — retro-modern championship structure and classic basketball proportions.
- **Elite Minimal** — luxury negative space, precise trim geometry and restrained pro-team styling.

The generation endpoint currently permits five generation requests per minute per IP. A fresh four-concept set consumes four requests, leaving one immediate request within that window. Regeneration should therefore be treated as a new set rather than silently firing duplicate requests.

## Architecture

| Area | Location |
| --- | --- |
| UI shell | `components/designer/` |
| Concept selection | `components/designer/concept-panel.tsx` |
| State | `lib/designer/store.ts` (Zustand + persist, no secrets) |
| Concept generation | `lib/designer/generation-client.ts` |
| Templates | `lib/designer/templates.ts` (normalized bounds + masks) |
| Typography | `lib/designer/typography.ts` (`fitTextToBounds`, front/back rules) |
| OpenAI prompts | `lib/designer/openai-service.ts` |
| OpenAI config | `lib/designer/config.ts` (server-only) |
| Generate API | `app/api/designer/generate/route.ts` |
| Logo upload | `app/api/designer/logo/route.ts` |
| Storage | `lib/designer/storage-service.ts` (Supabase) |
| Shopify | `lib/designer/shopify-service.ts` |
| Export | `lib/designer/export-service.ts` |

The home route dynamically imports only the 2D designer (`ssr: false`). Three.js / GLB / HDR are not pulled into the pure 2D session.

## Front / back rules

- **Team name** is deterministic and placed on the **FRONT only**, fitted to chest bounds from the template registry.
- **Back** shows roster **player name + number** for the selected preview player.
- AI prompts forbid text/logos/mannequins/scenery so misspellings never become production typography.
- Basketball uses the sleeveless jersey template.

## AI modes

- `generate` — new kit artwork; used independently for each of the four concept directions.
- `refine` — edit the selected previous asset with correction text; previous design kept on failure.
- `color_variation` — same selected composition, new palette (includes Black / Electric Blue / White preset).

Server keys: `OPENAI_API_KEY`, optional `OPENAI_IMAGE_MODEL` (default `gpt-image-1`). Never use `NEXT_PUBLIC_` for OpenAI. Do not rename Gemini env vars.

`DESIGNER_MOCK_AI=true` is an explicit local/dev opt-in only. Production does not silently fall back to mock when the key is missing. Mock mode can validate the workflow but may not visually demonstrate four distinct AI compositions because mock artwork is deterministic.

## Templates / adding a garment

1. Add a `GarmentTemplate` in `lib/designer/templates.ts` with silhouette, design mask, and normalized bounds (`teamName` front-only; `playerName`/`number` back-only).
2. Register it and wire `resolveTemplate()` for the sport/piece/view.
3. Add a catalog entry in `lib/designer/products.ts` and Shopify mapping in `lib/designer/shopify-service.ts` if needed.
4. Extend verification coverage via `pnpm test:designer`.

## Shopify

Checkout posts `{ type: "besu:checkout", payload }` to the parent iframe. Payload includes the **selected concept's** design ID, artwork URLs, roster metadata, product handles, and variant IDs — not giant base64. Local data-URL logos are omitted from Shopify properties until stored as HTTPS URLs.

Set `NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN` to the HTTPS storefront origin. Production blocks checkout when it is missing.

## Exports

PNG / SVG / PDF / ZIP. SVG may embed raster AI artwork (labeled non-editable). Deterministic text remains SVG text (vector). The selected design is recoverable from configuration/`designId` + stored asset URLs before checkout.

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

`pnpm test:designer` includes the dedicated `verify-four-concepts.mjs` acceptance harness.

### Bryant acceptance scenario

1. Select **Basketball Uniform**.
2. Team: **GALACTIC**.
3. Brief: *basketball uniform jersey + shorts, outer space with moon and comets*.
4. Generate exactly **4 distinct concepts**.
5. Confirm all four are independently selectable and visibly different in production AI mode.
6. Confirm **Refine / Roster / Order are unavailable until one concept is selected**.
7. Select one concept and confirm its artwork appears on the coordinated jersey + shorts preview.
8. Apply **black / electric blue / white** as a color variation and confirm the composition is preserved.
9. Confirm team name appears on front only; player name + number appear on back only.
10. Confirm export and Shopify checkout use the selected concept's design ID and artwork URLs.
