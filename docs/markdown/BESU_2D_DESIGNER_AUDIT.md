# Besu Customs 2D Designer — Repository Audit

Date: 2026-08-01
Branch: `main`

## Current stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Zustand with IndexedDB/localStorage persistence for configurator state.
- Supabase for models, authentication/admin users, and available object storage.
- Vercel standalone deployment and serverless API routes.
- Three.js/React Three Fiber, Fabric/Konva and GLB utilities power the current 3D route.
- Gemini, Runware, Meshy and Hitem endpoints support the legacy generation/retexture flow.

## Important directories

- `app/`: customer route, admin/auth pages, API routes and deployment entry points.
- `components/`: configurator wizard, 3D scene, roster, reusable UI primitives.
- `lib/`: Zustand state, Supabase, pricing, Shopify mappings, export/email utilities.
- `data/shopify` and `data/csv`: Shopify iframe integration and product/variant source data.
- `docs/sql`: Supabase schema and model migrations.

## Reusable modules

- `components/roster-input.tsx`: player names, numbers and top/short sizes.
- `lib/pricing.ts`: quantity and pricing calculations.
- `lib/shopify-variants.ts`: product/size to Shopify variant mapping and embed detection.
- `app/api/send-design/route.ts` and `lib/prepare-production-email-files.ts`: production delivery.
- Supabase auth/admin, product records, error handling, responsive primitives and Vercel config.

## Legacy modules to retire after verification

- `components/three-scene.tsx`, GLB loaders, camera/material/PBR/UV helpers.
- Gemini, Runware, Meshy and 3D-only hooks/routes.
- 3D screenshot/UV export paths and 3D-only controls.

They remain in the feature branch during the migration so admin operations and rollback are not broken.

## Shopify integration

The final legacy wizard step posts `besu:checkout` messages to the parent Shopify iframe. It resolves variant IDs through `lib/shopify-variants.ts` and sends line-item metadata. The new designer preserves this message contract and adds compact production URLs/IDs rather than image payloads.

## Storage and database

Supabase is configured for models/auth. No Cloudflare R2 integration exists in the repository. The new server storage adapter therefore uses a private/public Supabase Storage bucket named `designer-assets`; deployments must create this bucket or set `DESIGNER_ASSETS_BUCKET`.

## Environment variables

Existing: Supabase URL/anon/service role, SMTP, Gemini, Runware, Meshy, Google OAuth and Vercel runtime variables. New: `OPENAI_API_KEY`, optional `OPENAI_IMAGE_MODEL`, `DESIGNER_ASSETS_BUCKET`, and `DESIGNER_MOCK_AI`.

Local Vercel variables are pulled into separate ignored development, preview and production env files.

## Deployment architecture

Vercel hosts the Next.js standalone app and API routes. Supabase hosts database/auth and is the selected generated-asset store. Shopify embeds the app and receives checkout messages. SMTP delivers production packs.

## Risks

- Supabase bucket creation/policies must be validated before production.
- Serverless in-memory rate limiting/idempotency is best-effort; production should use durable Redis/database records.
- AI-generated artwork is raster. SVG export embeds the raster and is explicitly labeled non-editable.
- Existing Shopify metadata varies by product; a real theme/cart test remains required.
- Removing legacy dependencies before route/import verification could break admin tooling.

## Production-readiness update

- The tracked `client_google.json` credential file was removed and replaced by `client_google.example.json`. The previously committed Google OAuth client secret must be rotated in Google Cloud because removal from Git does not invalidate it.
- `.gitignore` now excludes real OAuth JSON, credential JSON, private keys, and environment files.
- The generation route keeps OpenAI access server-only, validates the request with Zod, bounds in-memory request/rate-limit maps, restricts correction assets to the configured Supabase host, and only enables mock mode when `DESIGNER_MOCK_AI=true`.
- Supabase uploads validate configuration, PNG content, size, bucket errors, and the returned public URL.
- Persisted designer state migrated from v3 to v4 with fresh front/back transform objects and a safe reset path.
- Checkout validates both artwork sides, roster names/numbers/quantities/sizes, customer identity/email, and iframe embedding before posting `besu:checkout`.
- Production ZIP export contains both sides as PNG/SVG, a PDF order pack, and configuration JSON.

## Remaining validation

- OpenAI billing/model access must be enabled for a real generation test.
- The Supabase hostname and bucket must be reachable from the deployment before real uploads can be validated.
- A client-owned Shopify theme/cart sandbox test remains required to confirm variant handling and parent-frame checkout behavior.
- Vercel production access settings and the final client alias should be confirmed by the project owner.

## Implementation plan

1. Replace the home route with the isolated 2D designer and persistent state.
2. Add flat SVG jersey/short templates, safe clipping, front/back views and editing controls.
3. Add validated server-only GPT Image generation/editing plus Supabase storage and mock mode.
4. Add generation history, roster/customer/order steps, exports and Shopify message compatibility.
5. Run type/build and responsive browser tests, validate the storage bucket and perform a Shopify sandbox checkout before production deployment.
