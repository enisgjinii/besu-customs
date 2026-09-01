"use client";

import { buildColorVariationCorrection, type GenerationMode } from "@/lib/designer/openai-service";
import type { ArtworkLayout, DesignConcept, DesignerColors, DesignerState, GarmentView, GenerationVersion } from "@/lib/designer/types";

export const LOADING_STAGES = ["Preparing AI edit…", "Rendering uniform…", "Saving AI render…"] as const;
const MAX_CONCEPT_BASE_BRIEF = 460;

export const CONCEPT_DIRECTIONS = [
  { id: "cosmic-energy", label: "Cosmic Energy", direction: "Bold galactic basketball graphics, sweeping nebula motion, comet trails, star fields, dramatic angular panels, premium NBA-inspired energy." },
  { id: "velocity-cut", label: "Velocity Cut", direction: "Fast aggressive court aesthetic with sharp diagonal cuts, speed lines, layered geometric panels, high-energy modern professional basketball styling." },
  { id: "heritage-court", label: "Heritage Court", direction: "Retro-modern basketball identity with structured side panels, vintage court geometry, restrained texture, classic championship uniform proportions." },
  { id: "elite-minimal", label: "Elite Minimal", direction: "Luxury minimal basketball kit with clean negative space, precise trim geometry, premium tonal panels, subtle asymmetry and modern pro-team sophistication." },
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

export async function generateConceptSet(options: {
  state: DesignerState;
  onProgress?: (progress: GenerateProgress) => void;
  signal?: AbortSignal;
}): Promise<{ concepts: DesignConcept[]; mock: boolean }> {
  if (inFlightRequestId) throw new Error(friendlyError("duplicate"));
  const batchId = crypto.randomUUID();
  inFlightRequestId = batchId;
  const concepts: DesignConcept[] = [];
  let mock = false;

  try {
    const baseBrief = options.state.prompt.trim().slice(0, MAX_CONCEPT_BASE_BRIEF);
    for (let index = 0; index < CONCEPT_DIRECTIONS.length; index += 1) {
      const preset = CONCEPT_DIRECTIONS[index];
      options.onProgress?.({
        stage: LOADING_STAGES[1],
        conceptIndex: index + 1,
        conceptCount: CONCEPT_DIRECTIONS.length,
        conceptLabel: preset.label,
      });

      const conceptState: DesignerState = {
        ...options.state,
        prompt: `${baseBrief}\n\nART DIRECTION ${index + 1}/4 — ${preset.label}: ${preset.direction}\nRender a finished wearable uniform concept. Make this composition clearly different from the other proposed directions.`,
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
      concepts.push({
        id: preset.id,
        label: preset.label,
        direction: preset.direction,
        prompt: conceptState.prompt,
        assetUrl: primary.assetUrl,
        colors: result.colors,
        colorsEnabled: options.state.colorsEnabled,
        createdAt: primary.createdAt,
        designId: primary.id,
      });
    }
    return { concepts, mock };
  } finally {
    if (inFlightRequestId === batchId) inFlightRequestId = null;
  }
}

export const CONCEPT_COUNT = CONCEPT_DIRECTIONS.length;

