"use client";

/**
 * Client-side generation helper: staged labels, duplicate guard, front+back kit generation.
 * Keeps previous artwork on failure.
 */

import {
  buildColorVariationCorrection,
  type GenerationMode,
} from "@/lib/designer/openai-service";
import type { DesignerColors, DesignerState, GarmentView, GenerationVersion } from "@/lib/designer/types";

export const LOADING_STAGES = [
  "Preparing brief…",
  "Generating kit artwork…",
  "Saving design…",
] as const;

export type GenerateResult = {
  versions: GenerationVersion[];
  mock: boolean;
  colors: DesignerColors;
};

export type GenerateProgress = {
  stage: (typeof LOADING_STAGES)[number];
  view?: GarmentView;
};

type GenerateOptions = {
  state: DesignerState;
  mode?: GenerationMode;
  views?: GarmentView[];
  colors?: DesignerColors;
  correction?: string;
  onProgress?: (progress: GenerateProgress) => void;
  signal?: AbortSignal;
};

let inFlightRequestId: string | null = null;

export function isGenerationInFlight() {
  return Boolean(inFlightRequestId);
}

function friendlyError(code?: string, fallback?: string) {
  const messages: Record<string, string> = {
    missing_openai_key:
      "AI generation is not configured yet. Add the production OpenAI key, or enable mock mode for local testing.",
    storage_not_configured:
      "Artwork storage is not configured yet. Add the Supabase URL, service key, and assets bucket.",
    invalid_previous_asset:
      "This artwork revision is no longer available. Generate the side again before requesting a correction.",
    rate_limited: "Generation is temporarily busy. Wait a moment and try again.",
    duplicate: "A design is already generating. Please wait for it to finish.",
    insufficient_quota: "OpenAI billing or image credits are not active for this deployment.",
    generation_timeout: "Generation took too long. Try a simpler brief or try again.",
    upstream_error: "The image service could not complete this request. Try again in a moment.",
    body_too_large: "That request is too large. Shorten the brief or correction and try again.",
    invalid_input: "Please check the design details and try again.",
  };
  return (code && messages[code]) || fallback || "Artwork generation failed. Please try again.";
}

async function generateOne(
  state: DesignerState,
  view: GarmentView,
  mode: GenerationMode,
  colors: DesignerColors | undefined,
  correction: string | undefined,
  requestId: string,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/designer/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      garmentType: state.garmentType,
      designDescription: state.prompt,
      teamName: state.teamName,
      colors: state.colorsEnabled || mode === "color_variation" ? colors || state.colors : undefined,
      style: state.style,
      view,
      sport: state.sport,
      mode,
      correction: correction || undefined,
      previousAssetUrl:
        mode === "generate" && !correction ? undefined : state.artwork[view] || undefined,
      inspiration: state.inspiration || undefined,
      hasLogo: Boolean(state.logoUrl),
      requestId,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(friendlyError(data.code, data.error));
  return data as {
    id: string;
    assetUrl: string;
    createdAt: string;
    mock?: boolean;
    colors?: DesignerColors | null;
  };
}

export async function generateUniformKit(options: GenerateOptions): Promise<GenerateResult> {
  if (inFlightRequestId) {
    throw new Error(friendlyError("duplicate"));
  }

  const mode = options.mode || "generate";
  const views = options.views || (["front", "back"] as GarmentView[]);
  const batchId = crypto.randomUUID();
  inFlightRequestId = batchId;

  const versions: GenerationVersion[] = [];
  let mock = false;
  let resolvedColors = options.colors || options.state.colors;

  try {
    options.onProgress?.({ stage: LOADING_STAGES[0] });

    // Generate once, then apply the same artwork to every requested view so front/back match.
    const primaryView = views.includes("front") ? "front" : views[0];
    options.onProgress?.({ stage: LOADING_STAGES[1], view: primaryView });

    const correction =
      mode === "color_variation"
        ? buildColorVariationCorrection(resolvedColors)
        : options.correction;

    const data = await generateOne(
      options.state,
      primaryView,
      mode,
      resolvedColors,
      correction,
      crypto.randomUUID(),
      options.signal,
    );

    mock = Boolean(data.mock);
    if (data.colors) resolvedColors = data.colors;

    options.onProgress?.({ stage: LOADING_STAGES[2], view: primaryView });

    const createdAt = data.createdAt;
    for (const view of views) {
      versions.push({
        id: view === primaryView ? data.id : `${data.id}-${view}`,
        prompt: options.state.prompt,
        correction: correction || undefined,
        colors: resolvedColors,
        assetUrl: data.assetUrl,
        createdAt,
        garmentType: options.state.garmentType,
        view,
        mode,
      });
    }

    return { versions, mock, colors: resolvedColors };
  } finally {
    if (inFlightRequestId === batchId) inFlightRequestId = null;
  }
}
