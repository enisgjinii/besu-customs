# Besu 2D Designer setup

Required server environment variables:

```text
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DESIGNER_ASSETS_BUCKET=designer-assets
```

Optional:

```text
OPENAI_IMAGE_MODEL=gpt-image-2
DESIGNER_MOCK_AI=true
```

When `OPENAI_API_KEY` is absent, the endpoint automatically returns deterministic mock artwork so the complete UI can be tested without API cost. Set `DESIGNER_MOCK_AI=true` to force mock mode even when a key exists.

The `designer-assets` Supabase Storage bucket must exist and permit public reads, while writes remain server-only through the service-role key. Never expose that key to the browser.

Before production release, validate OpenAI billing/model access, bucket policy, front/back generation, PNG/PDF downloads, the raster limitation of SVG exports, SMTP delivery, and a Shopify sandbox checkout.
