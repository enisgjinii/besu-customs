# Besu Customs AI Design Generation Workflow

Client-facing technical brief  
Prepared: June 2, 2026

## Executive Summary

Besu Customs includes an AI Design step that generates a complete print-ready texture for the selected product. The workflow uses the product's UV layout as a placement guide, sends a controlled prompt and UV reference to Google's Gemini image-generation API, then applies the generated artwork back onto the 3D product preview.

The current implementation offers two explicit generation modes in Step 2:

- Flash: fast draft generation using Gemini Flash
- Premium: slower, higher-detail generation using Gemini Pro

This gives customers a clear tradeoff between speed and quality without hiding model behavior behind one button.

## Where It Runs In The App

The AI workflow is located in Step 2: AI Design.

User flow:

1. The customer selects a product in Step 1.
2. The app loads the product's 3D model and extracts or loads the matching UV guide.
3. The customer opens Step 2: AI Design.
4. The customer describes the visual direction, such as colors, pattern style, theme, and optional player name or number.
5. The customer chooses either Flash or Premium generation mode.
6. The app generates a full 2D texture map and applies it to the 3D product preview.

## How The AI Generation Works

The generation pipeline is controlled and product-aware.

1. Product context is detected

The app identifies whether the selected item is a jersey, shorts, hoodie, cap, bag, or duffle bag. This prevents the AI from creating the wrong kind of layout. For example, a baseball cap prompt is guarded so the AI does not generate jersey panels or shorts.

2. The UV guide is used as a strict placement reference

The app sends the AI a UV guide or filled UV mask. This tells the model where each product panel exists in the flat texture image. The AI is instructed to keep the exact same UV island positions, preserve the empty white space, and paint only inside the valid product areas.

3. The prompt is enhanced before generation

The customer's prompt is combined with production rules:

- Create a flat 2D texture map only.
- Do not add 3D lighting, shadows, mockups, watermarks, or unwanted typography.
- Fill all UV islands with coherent artwork.
- Keep the design aligned with the selected product type.
- Preserve the product's layout and panel boundaries.

4. The selected generation mode is requested

If the customer selects Flash, the app requests Gemini Flash at 1K resolution for faster draft output.

If the customer selects Premium, the app requests Gemini 3 Pro Image at 4K resolution. This is the highest-quality path currently configured in the app and is intended for polished design output rather than quick drafts.

5. The generated image is loaded as a texture

After the AI returns the generated artwork, the app loads it as a Three.js texture with correct color handling and UV-safe settings. The result is applied to the 3D product preview.

6. The texture is stored as a design layer

The generated texture is added to the configurator's layer system. This keeps it compatible with the rest of the customization workflow, including later edits, corrections, previews, and exports.

## Model And Quality Configuration

Flash mode:

- Gemini 2.5 Flash Image
- Internal model id: `gemini-2.5-flash-image`
- Used for fast draft generation
- Requested resolution: 1K

Premium mode:

- Gemini 3 Pro Image Preview
- Internal model id: `gemini-3-pro-image-preview`
- Used for premium full-texture generation
- Requested resolution: 4K

Fallback behavior:

- If Premium is unavailable, times out, or hits temporary capacity limits, the system can retry with Gemini 2.5 Flash Image
- Requested fallback resolution: 1K

Why this setup:

- Gemini 2.5 Flash Image is useful for quick concept iteration and lower-latency previews.
- Gemini 3 Pro Image is optimized for higher-quality image-generation and editing workflows.
- 4K output improves detail and sharpness for full-product artwork.
- The fallback keeps the workflow usable if the premium model is temporarily unavailable.

## Security And API Key Handling

The Gemini generation call is handled through a server-side API route. This is important because the API key should not be exposed in the browser.

Security controls:

- The client does not call Google directly.
- The server route reads the API key from environment variables.
- Requests are normalized before being sent upstream.
- Upstream errors are handled and returned safely.
- No API secrets are hardcoded into client-side JavaScript.

Recommended production environment variables:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- Optional: `GEMINI_UPSTREAM_TIMEOUT_MS` for hosting environments that support longer AI requests

## Quality Controls Built Into The Prompt

The prompt enforces production-oriented output rules:

- Flat albedo texture only
- No lighting, shadows, highlights, or mockup rendering
- No UV wireframe lines in the final artwork
- No unwanted text, logos, signatures, or watermarks
- No movement or reshaping of UV islands
- Vibrant colors suitable for sportswear design
- Coherent design continuity across product panels
- Product-specific layout protection for caps, bags, hoodies, jerseys, and shorts

These controls reduce common AI image failures such as distorted product shapes, fake lighting, random text, or artwork that does not align with the 3D model.

## Correction Workflow

After a texture is generated, the customer can request changes using the correction workflow.

Examples:

- Make the side panels red.
- Add more contrast to the sleeves.
- Remove the pattern from the back.
- Make the design more minimal.

The correction prompt is combined with the original direction and the current product rules. This allows the AI to revise the design while preserving the same product context.

## Expected Client Experience

What clients should expect:

- Flash generation is intended for quick iteration and concept exploration.
- Premium generation may take longer than Flash generation.
- Output quality is intentionally prioritized over speed.
- The first result may still need creative iteration, especially for complex designs.
- Text and numbers can be generated, but the app uses guardrails to avoid random typography.
- Generated AI artwork should be reviewed before final production use.

What the system is designed to prevent:

- Wrong product layouts
- Random extra text or logos
- Broken UV alignment
- Mockup-style lighting baked into the texture
- Low-resolution texture output for final-quality generation

## Operational Notes

The premium AI workflow depends on third-party model availability and API response times. If the premium model is unavailable, the system can retry with the lower-latency fallback model so the user is not blocked.

For production deployments, the hosting platform should support long-running AI requests. The API route is configured for extended execution, but the actual limit depends on the deployment plan and platform configuration.

## Current Implementation Files

The main implementation points are:

- `components/ai-texture-generator.tsx`
- `hooks/use-gemini-ai.ts`
- `app/api/gemini/generate-texture/route.ts`
- `lib/gemini-models.ts`

## References

- Google Gemini image generation documentation: https://ai.google.dev/gemini-api/docs/image-generation
- Google Vertex AI Gemini 3 Pro Image documentation: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image
- Google SynthID information: https://support.google.com/gemini/answer/16722517
