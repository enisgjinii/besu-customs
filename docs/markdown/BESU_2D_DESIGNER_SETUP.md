# BESU 2D AI Designer

Production customer flow for Besu Customs: AI-first 2D sports uniform design with deterministic typography, roster, exports, and Shopify checkout handoff. Legacy 3D routes remain available under admin/review paths and are not loaded on the public home route.

## Customer journey

1. **Product** — choose jersey, shorts, or coordinated uniform (name, description, price when available).
2. **Design** — Team Name + Design Description (+ optional inspiration, logo, guide colors). CTA: **Generate My Uniform** (front + back kit).
3. **Refine** — Try Different Colors (preserves concept), free-text refinement, version history. Advanced placement is secondary.
4. **Roster** — players, sizes, quantities; select a preview player for the back view.
5. **Order** — checklist, customer details, PNG/SVG/PDF/ZIP export, Shopify `besu:checkout`.

Mandatory Colors/Patterns wizard steps are removed from this AI journey. Color utilities remain for optional guide colors and variation presets.

## Architecture

| Area | Location |
| --- | --- |
| UI shell | `components/designer/` |
| State | `lib/designer/store.ts` (Zustand + persist, no secrets) |
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

## AI modes

- `generate` — new kit artwork (optional colors; otherwise palette from brief).
- `refine` — edit previous asset with correction text; previous design kept on failure.
- `color_variation` — same composition, new palette (includes Black / Electric Blue / White preset).

Server keys: `OPENAI_API_KEY`, optional `OPENAI_IMAGE_MODEL` (default `gpt-image-1`). Never use `NEXT_PUBLIC_` for OpenAI. Do not rename Gemini env vars.

`DESIGNER_MOCK_AI=true` is an explicit local/dev opt-in only. Production does not silently fall back to mock when the key is missing.

## Templates / adding a garment

1. Add a `GarmentTemplate` in `lib/designer/templates.ts` with silhouette, design mask, and normalized bounds (`teamName` front-only; `playerName`/`number` back-only).
2. Register it and wire `resolveTemplate()` for the sport/piece/view.
3. Add a catalog entry in `lib/designer/products.ts` and Shopify mapping in `lib/designer/shopify-service.ts` if needed.
4. Extend `assertTypographyContract` coverage via `pnpm test:designer`.

## Shopify

Checkout posts `{ type: "besu:checkout", payload }` to the parent iframe. Payload includes design ID, artwork **URLs**, roster metadata, product handles, and variant IDs — not giant base64. Local data-URL logos are omitted from Shopify properties until stored as HTTPS URLs.

Set `NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN` to the HTTPS storefront origin. Production blocks checkout when it is missing.

## Exports

PNG / SVG / PDF / ZIP. SVG may embed raster AI artwork (labeled non-editable). Deterministic text remains SVG text (vector). Design is recoverable from configuration/`designId` + stored asset URLs before checkout.

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

See also `docs/markdown/BESU_2D_DESIGNER_SETUP.md`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test:designer
pnpm build
```

Acceptance scenario (Bryant): Team **Galactic**, brief *basketball uniform jersey+shorts, outer space moon/comets*, then color variation **black / electric blue / white**. Confirm front team name, no team name on back, coordinated jersey/shorts via piece toggle.
