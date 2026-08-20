"use client";

import { buildColorVariationCorrection, type GenerationMode } from "@/lib/designer/openai-service";
import type { DesignConcept, DesignerColors, DesignerState, GarmentView, GenerationVersion } from "@/lib/designer/types";

export const LOADING_STAGES = ["Preparing brief…", "Generating kit artwork…", "Saving design…"] as const;
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
  onProgress?: (progress: GenerateProgress) => void;
  signal?: AbortSignal;
};

let inFlightRequestId: string | null = null;
export function isGenerationInFlight() { return Boolean(inFlightRequestId); }

function friendlyError(code?: string, fallback?: string) {
  const messages: Record<string, string> = {
    missing_openai_key: "AI generation is not configured yet. Add the production OpenAI key, or enable mock mode for local testing.",
    storage_not_configured: "Artwork storage is not configured yet. Add the Supabase URL, service key, and assets bucket.",
    invalid_previous_asset: "This artwork revision is no longer available. Generate the side again before requesting a correction.",
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

async function generateOne(state: DesignerState, view: GarmentView, mode: GenerationMode, colors: DesignerColors | undefined, correction: string | undefined, requestId: string, signal?: AbortSignal) {
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
      previousAssetUrl: mode === "generate" && !correction ? undefined : state.artwork[view] || undefined,
      inspiration: state.inspiration || undefined,
      hasLogo: Boolean(state.logoUrl),
      requestId,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(friendlyError(data.code, data.error));
  return data as { id: string; assetUrl: string; createdAt: string; mock?: boolean; colors?: DesignerColors | null };
}

async function generateKitUnlocked(options: GenerateOptions): Promise<GenerateResult> {
  const mode = options.mode || "generate";
  const views = options.views || (["front", "back"] as GarmentView[]);
  const versions: GenerationVersion[] = [];
  let resolvedColors = options.colors || options.state.colors;
  options.onProgress?.({ stage: LOADING_STAGES[0] });
  const primaryView = views.includes("front") ? "front" : views[0];
  options.onProgress?.({ stage: LOADING_STAGES[1], view: primaryView });
  const correction = mode === "color_variation" ? buildColorVariationCorrection(resolvedColors) : options.correction;
  const data = await generateOne(options.state, primaryView, mode, resolvedColors, correction, crypto.randomUUID(), options.signal);
  if (data.colors) resolvedColors = data.colors;
  options.onProgress?.({ stage: LOADING_STAGES[2], view: primaryView });
  for (const view of views) {
    versions.push({
      id: view === primaryView ? data.id : `${data.id}-${view}`,
      prompt: options.state.prompt,
      correction: correction || undefined,
      colors: resolvedColors,
      assetUrl: data.assetUrl,
      createdAt: data.createdAt,
      garmentType: options.state.garmentType,
      view,
      mode,
    });
  }
  return { versions, mock: Boolean(data.mock), colors: resolvedColors };
}

export async function generateUniformKit(options: GenerateOptions): Promise<GenerateResult> {
  if (inFlightRequestId) throw new Error(friendlyError("duplicate"));
  const batchId = crypto.randomUUID();
  inFlightRequestId = batchId;
  try { return await generateKitUnlocked(options); }
  finally { if (inFlightRequestId === batchId) inFlightRequestId = null; }
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
      options.onProgress?.({ stage: LOADING_STAGES[1], conceptIndex: index + 1, conceptCount: CONCEPT_DIRECTIONS.length, conceptLabel: preset.label });
      const conceptState: DesignerState = {
        ...options.state,
        prompt: `${baseBrief}\n\nART DIRECTION ${index + 1}/4 — ${preset.label}: ${preset.direction}\nMake this composition clearly different from the other proposed directions.`,
        artwork: {},
        designId: undefined,
      };
      const result = await generateKitUnlocked({ state: conceptState, mode: "generate", views: ["front", "back"], signal: options.signal });
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
