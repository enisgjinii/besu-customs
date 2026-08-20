# BESU 2D Designer setup

The root route is the client-facing 2D designer. The legacy 3D/admin routes remain available and should be tested separately before removing old dependencies.

## Required environment

Set these values in Vercel and in a local ignored `.env.local` file. Never prefix server secrets with `NEXT_PUBLIC_`.

```text
OPENAI_API_KEY=                         # server-only
NEXT_PUBLIC_SUPABASE_URL=https://...    # public project URL
SUPABASE_SERVICE_ROLE_KEY=              # server-only; never expose to the browser
DESIGNER_ASSETS_BUCKET=designer-assets
```

Optional:

```text
OPENAI_IMAGE_MODEL=gpt-image-1
DESIGNER_MOCK_AI=true                   # development/testing only
NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=false
```

`OPENAI_IMAGE_MODEL` defaults to `gpt-image-1`, which supports transparent PNG image generation/editing. Set a different model only after validating its image API parameters and account access.

## Supabase Storage

1. In Supabase Storage, create a bucket named `designer-assets`, or set `DESIGNER_ASSETS_BUCKET` to a different bucket name.
2. Enable public read access for that bucket so generated artwork can be shown in the preview, exports, and Shopify metadata.
3. Keep writes server-only. The app uploads through `SUPABASE_SERVICE_ROLE_KEY`; do not put that key in client code or `NEXT_PUBLIC_*` variables.
4. The server writes PNG files at `generated/YYYY-MM-DD/<id>.png` with `image/png` content type and a one-year cache policy.
5. Test a real upload and public read before enabling client checkout.

The app returns a clear configuration error when the Supabase URL, service-role key, bucket, public policy, or upload response is invalid.

## Shopify checkout

The active 2D designer does not require Shopify API credentials in the Next.js environment. Checkout uses the existing parent iframe `besu:checkout` message contract and sends compact design IDs, Supabase artwork URLs, roster metadata, product handles, and variant IDs. Set `NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN` to the HTTPS storefront origin that hosts the iframe. Production checkout is intentionally blocked when this origin is missing or invalid, so customer/order data is not posted to an unknown parent frame. A real Shopify theme/cart sandbox is still required for final cart behavior sign-off.

## Mock mode

Run the local app with mock generation when OpenAI billing or Supabase is not ready:

```bash
DESIGNER_MOCK_AI=true pnpm dev
```

Mock mode is explicit. Production does not silently fall back to mock artwork when `OPENAI_API_KEY` is missing.

## Real AI/storage mode

1. Set `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the bucket name.
2. Leave `DESIGNER_MOCK_AI` unset or set it to `false`.
3. Generate front artwork and confirm the response contains a Supabase public asset URL.
4. Generate back artwork, then test a correction using the generated asset URL.
5. Confirm the public asset loads in a clean browser session and in an iframe.

## Production readiness checklist

- [ ] No OAuth JSON, API key, service-role key, SMTP password, or `.env*` file is tracked.
- [ ] Any previously exposed credential has been rotated.
- [ ] OpenAI billing/model access is active and the image model is enabled.
- [ ] Supabase bucket exists, public reads work, and server-only writes work.
- [ ] Front and back artwork generation and correction work.
- [ ] Long team/player names remain inside safe print boundaries.
- [ ] Roster, customer, and size validation blocks incomplete orders.
- [ ] PNG, SVG, PDF, and ZIP exports are downloaded and opened successfully.
- [ ] Shopify iframe receives and handles `besu:checkout`.
- [ ] `NEXT_PUBLIC_SHOPIFY_PARENT_ORIGIN` is set to the approved HTTPS Shopify storefront origin.
- [ ] Vercel production deployment is READY and the intended alias is accessible to the client.
- [ ] A Shopify sandbox/cart test and a clean mobile browser test are complete.

## Known limitations

- Serverless in-memory idempotency/rate limiting is best-effort and resets between instances; use durable storage/rate limiting for high-volume production traffic.
- SVG exports preserve the layout but can contain raster artwork, so they are not guaranteed to be fully editable vector files.
- Shopify checkout requires the designer to be embedded in an iframe; standalone use reports a clear submission error.
- Real AI generation remains dependent on OpenAI billing and Supabase network/storage availability.
