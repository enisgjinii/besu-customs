"use client";

import { buildColorVariationCorrection, type GenerationMode } from "@/lib/designer/openai-service";
import type { ArtworkLayout, DesignConcept, DesignerColors, DesignerState, GarmentView, GenerationVersion } from "@/lib/designer/types";

export const LOADING_STAGES = ["Preparing AI reference…", "Rendering uniform…", "Saving AI render…"] as const;
const MAX_CONCEPT_BASE_BRIEF = 460;
// High-quality 1536x1024 renders are intentionally serialized. Running multiple GPT Image calls
// at once can queue one behind another upstream until it hits the route timeout; worse, one failed
// request rejects the whole concept set and discards the successful siblings from the client.
export const CONCEPT_GENERATION_CONCURRENCY = 1 as const;

/**
 * The four options change composition language only. Render quality, product cut, proportions,
 * camera and front/back presentation are standardized server-side for every direction.
 * IDs and labels are retained for compatibility with saved/shareable designer state.
 */
export const CONCEPT_DIRECTIONS = [
  {
    id: "cosmic-energy",
    label: "Cosmic Energy",
    direction: "Translate only the user's requested theme into sweeping directional movement, layered visual rhythm and one strong focal motif. Do not introduce a new theme that was not requested.",
  },
  {
    id: "velocity-cut",
    label: "Velocity Cut",
    direction: "Use precise angular panel relationships, controlled diagonal cuts, disciplined piping and geometric structure derived from the requested theme. Keep it intentional rather than busy.",
  },
  {
    id: "heritage-court",
    label: "Heritage Court",
    direction: "Use a restrained retro-sport composition with confident symmetry, classic side-panel logic and modernized trim proportions while expressing the requested theme through subtle graphic treatment.",
  },
  {
    id: "elite-minimal",
    label: "Elite Minimal",
    direction: "Use premium negative space, tonal layering, precise trim geometry and a small number of high-impact details. Keep the requested theme recognizable through elegant abstraction rather than extra decoration.",
  },
] as const;

export type GenerateResult = { versions: GenerationVersion[]; mock: boolean; colors: DesignerColors };
export type GenerateProgress = {
  stage: (typeof LOADING_STAGES)[number];
  view?: GarmentView;
  conceptIndex?: number;
  conceptCount?: number;
  conceptLabel?: string;
};

type GenerateOptions = {
  state: DesignerState;
  mode?: GenerationMode;
  views?: GarmentView[];
  colors?: DesignerColors;
  correction?: string;
  layout?: ArtworkLayout;
  conceptIndex?: number;
  onProgress?: (progress: GenerateProgress) => void;
  signal?: AbortSignal;
};

let inFlightRequestId: string | null = null;
export function isGenerationInFlight() { return Boolean(inFlightRequestId); }

function friendlyError(code?: string, fallback?: string) {
  const messages: Record<string, string> = {
    missing_openai_key: "AI generation is not configured yet. Add the production OpenAI key, or enable mock mode for local testing.",
    storage_not_configured: "AI render storage failed. Try generating again.",
    invalid_previous_asset: "This AI uniform render is no longer available. Generate or select a uniform again before requesting an edit.",
    rate_limited: "Direct AI generation is temporarily busy. Wait a moment and try again.",
    duplicate: "An AI uniform is already rendering. Please wait for it to finish.",
    insufficient_quota: "OpenAI billing or image credits are not active for this deployment.",
    generation_timeout: "The uniform render took too long. Try a simpler brief or try again.",
    upstream_error: "The image service could not complete this uniform render. Try again in a moment.",
    body_too_large: "That request is too large. Shorten the brief or correction and try again.",
    invalid_input: "Please check the AI uniform brief and try again.",
  };
  return (code && messages[code]) || fallback || "Direct AI uniform generation failed. Please try again.";
}

async function generateOne(
  state: DesignerState,
  view: GarmentView,
  mode: GenerationMode,
  colors: DesignerColors | undefined,
  correction: string | undefined,
  requestId: string,
  signal?: AbortSignal,
  layout?: ArtworkLayout,
  conceptIndex?: number,
) {
  const response = await fetch("/api/designer/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      garmentType: state.garmentType,
      designDescription: state.prompt,
      // The server uses teamName to request one integrated FRONT chest wordmark from GPT Image 2.
      // Player name/number remain separate roster data and are not generated into the master artwork.
      teamName: state.teamName,
      colors: state.colorsEnabled || mode === "color_variation" ? colors || state.colors : undefined,
      style: state.style,
      view,
      sport: state.sport,
      mode,
      correction: correction || undefined,
      previousAssetUrl: mode === "generate" && !correction ? undefined : state.artwork.front || state.artwork.back || undefined,
      inspiration: state.inspiration || undefined,
      hasLogo: Boolean(state.logoUrl),
      layout: layout || state.layout || "kit",
      conceptIndex,
      requestId,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(friendlyError(data.code, data.error));
  return data as { id: string; assetUrl: string; createdAt: string; mock?: boolean; colors?: DesignerColors | null };
}

async function generateKitUnlocked(options: GenerateOptions): Promise<GenerateResult> {
  const mode = options.mode || "generate";
  // One master image always contains both standardized views. `view` remains in the API/state for
  // backward compatibility and for production preview/export focus.
  const primaryView: GarmentView = options.views?.[0] || "front";
  let resolvedColors = options.colors || options.state.colors;

  options.onProgress?.({ stage: LOADING_STAGES[0], view: primaryView });
  const correction = mode === "color_variation" ? buildColorVariationCorrection(resolvedColors) : options.correction;

  options.onProgress?.({ stage: LOADING_STAGES[1], view: primaryView });
  const data = await generateOne(
    options.state,
    primaryView,
    mode,
    resolvedColors,
    correction,
    crypto.randomUUID(),
    options.signal,
    options.layout || options.state.layout,
    options.conceptIndex,
  );
  if (data.colors) resolvedColors = data.colors;

  options.onProgress?.({ stage: LOADING_STAGES[2], view: primaryView });
  const version: GenerationVersion = {
    id: data.id,
    prompt: options.state.prompt,
    correction: correction || undefined,
    colors: resolvedColors,
    assetUrl: data.assetUrl,
    createdAt: data.createdAt,
    garmentType: options.state.garmentType,
    view: primaryView,
    mode,
  };

  return { versions: [version], mock: Boolean(data.mock), colors: resolvedColors };
}

export async function generateUniformKit(options: GenerateOptions): Promise<GenerateResult> {
  if (inFlightRequestId) throw new Error(friendlyError("duplicate"));
  const batchId = crypto.randomUUID();
  inFlightRequestId = batchId;
  try {
    return await generateKitUnlocked(options);
  } finally {
    if (inFlightRequestId === batchId) inFlightRequestId = null;
  }
}

export type ConceptCount = 1 | 2 | 3 | 4;
export const CONCEPT_COUNT = CONCEPT_DIRECTIONS.length as ConceptCount;
export const CONCEPT_COUNT_OPTIONS = [1, 2, 3, 4] as const satisfies readonly ConceptCount[];

export function clampConceptCount(value: unknown): ConceptCount {
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return CONCEPT_COUNT;
}

export async function generateConceptSet(options: {
  state: DesignerState;
  count?: ConceptCount;
  onProgress?: (progress: GenerateProgress) => void;
  signal?: AbortSignal;
}): Promise<{ concepts: DesignConcept[]; mock: boolean }> {
  if (inFlightRequestId) throw new Error(friendlyError("duplicate"));
  const batchId = crypto.randomUUID();
  inFlightRequestId = batchId;
  const count = clampConceptCount(options.count ?? options.state.conceptCount ?? CONCEPT_COUNT);
  const directions = CONCEPT_DIRECTIONS.slice(0, count);
  const concepts = new Array<DesignConcept>(count);
  let mock = false;

  try {
    const baseBrief = options.state.prompt.trim().slice(0, MAX_CONCEPT_BASE_BRIEF);
    // Render one direction at a time. This avoids upstream contention for multi-concept requests
    // and keeps progress/order deterministic without changing single-concept behaviour.
    for (let offset = 0; offset < directions.length; offset += CONCEPT_GENERATION_CONCURRENCY) {
      const batch = directions.slice(offset, offset + CONCEPT_GENERATION_CONCURRENCY);
      await Promise.all(
        batch.map(async (preset, batchIndex) => {
          const index = offset + batchIndex;
          options.onProgress?.({
            stage: LOADING_STAGES[1],
            conceptIndex: index + 1,
            conceptCount: count,
            conceptLabel: count === 1 ? "Design" : preset.label,
          });

          const conceptState: DesignerState = {
            ...options.state,
            prompt:
              count === 1
                ? `${baseBrief}\n\nRender one finished wearable master uniform concept from this brief.`
                : `${baseBrief}\n\nCREATIVE DIRECTION ${index + 1}/${count} — ${preset.label}: ${preset.direction}\nThis direction changes design language only. Keep the same professional render standard, garment proportions and front/back master-board layout used by every concept in the set.`,
            artwork: {},
            designId: undefined,
          };

          const result = await generateKitUnlocked({
            state: conceptState,
            mode: "generate",
            views: ["front"],
            layout: "kit",
            conceptIndex: index,
            signal: options.signal,
          });
          mock = mock || result.mock;
          const primary = result.versions[0];
          concepts[index] = {
            id: count === 1 ? "single-design" : preset.id,
            label: count === 1 ? "Your design" : preset.label,
            direction: count === 1 ? "Client brief" : preset.direction,
            prompt: conceptState.prompt,
            assetUrl: primary.assetUrl,
            colors: result.colors,
            colorsEnabled: options.state.colorsEnabled,
            createdAt: primary.createdAt,
            designId: primary.id,
          };
        }),
      );
    }
    return { concepts, mock };
  } finally {
    if (inFlightRequestId === batchId) inFlightRequestId = null;
  }
}
