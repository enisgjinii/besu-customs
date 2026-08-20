# Besu Customs 2D Designer — Repository Audit

Date: 2026-08-20  
Branch: working tree (2D AI completion)

## Current stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, HeroUI.
- Zustand persistence for designer state (no secrets).
- Supabase Storage for generated artwork / logos.
- OpenAI Images API (`gpt-image-1` default) server-only.
- Shopify parent-iframe `besu:checkout` handoff.
- Legacy Three.js / Gemini / Meshy routes retained for admin/rollback; not loaded on `/`.

## 2D AI architecture (shipped)

- Template registry: `lib/designer/templates.ts` (normalized bounds, masks, front/back contracts).
- Typography: `lib/designer/typography.ts` — team name front-only; player name/number back-only.
- Prompt + modes: `lib/designer/openai-service.ts` (`generate` | `refine` | `color_variation`).
- API: `app/api/designer/generate`, `app/api/designer/logo`, mock opt-in only.
- Customer steps: Product → Design → Refine → Roster → Order.

## Reusable commerce modules

- Roster validation, Shopify variant mapping, export PNG/SVG/PDF/ZIP, pricing catalog hooks.

## Environment

Required for real AI: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DESIGNER_ASSETS_BUCKET`.  
Optional: `OPENAI_IMAGE_MODEL`, `DESIGNER_MOCK_AI=true` (local only), `NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN`.

## External blockers

- OpenAI billing / image model access on the deployment key.
- Supabase `designer-assets` bucket public-read + server write.
- Shopify theme sandbox receiving `besu:checkout`.
- Owner confirmation of production domain / Vercel protection.

## Verification commands

`pnpm typecheck && pnpm lint && pnpm test:designer && pnpm build`
