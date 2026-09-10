"use client";

import { toast } from "sonner";
import {
  extractColors,
  extractExplicitTeamName,
  extractTeamName,
  isFreshGenerateRequest,
  isTeamNameOnlyEdit,
} from "@/lib/designer/brief-parser";
import {
  CONCEPT_COUNT,
  clampConceptCount,
  generateConceptSet,
  generateUniformKit,
  isGenerationInFlight,
  type ConceptCount,
} from "@/lib/designer/generation-client";
import { useGenerationSession } from "@/lib/designer/generation-session";
import { useDesignerStore } from "@/lib/designer/store";
import { STEP_INDEX } from "@/components/designer/designer-steps";
import type { DesignerColors, DesignerStep } from "@/lib/designer/types";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
let abortController: AbortController | null = null;

function nextAbort() {
  abortController?.abort();
  abortController = new AbortController();
  return abortController;
}

async function readLogoLocally(file: File) {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadDesignerLogo(file: File) {
  const session = useGenerationSession.getState();
  if (!LOGO_TYPES.has(file.type)) {
    const message = "Use PNG, JPG or WebP.";
    session.fail(message);
    toast.error(message);
    return;
  }

  try {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/designer/logo", { method: "POST", body: form });
    const data = (await response.json().catch(() => ({}))) as { assetUrl?: string; error?: string };
    if (!response.ok || !data.assetUrl) throw new Error(data.error || "Logo upload failed.");
    useDesignerStore.getState().setLogo(data.assetUrl);
  } catch (uploadError) {
    if (file.size <= 2 * 1024 * 1024) {
      try {
        useDesignerStore.getState().setLogo(await readLogoLocally(file));
        toast.message("Logo saved.");
      } catch (readError) {
        const message = readError instanceof Error ? readError.message : "Logo upload failed.";
        session.fail(message);
        toast.error(message);
      }
    } else {
      const message = uploadError instanceof Error ? uploadError.message : "Logo upload failed.";
      session.fail(message);
      toast.error(message);
    }
  }
}

/**
 * The single canonical entry point for a fresh customer generation.
 *
 * Every public surface routes through this so there is exactly one fresh-generation behaviour:
 * N distinct finished uniform concepts (1–4), then Choose — or, for a single design, Refine.
 */
export async function generateConcepts(prompt: string, countOverride?: ConceptCount) {
  const session = useGenerationSession.getState();
  if (session.busy || isGenerationInFlight()) return;
  const trimmed = prompt.trim();
  if (trimmed.length < 8) {
    toast.error("Add a bit more detail so AI can design the uniform.");
    return;
  }

  const parsedTeam = extractTeamName(trimmed, useDesignerStore.getState().teamName);
  const parsedColors = extractColors(trimmed);
  const count = clampConceptCount(
    countOverride ?? useDesignerStore.getState().conceptCount ?? CONCEPT_COUNT,
  );
  useDesignerStore.getState().patch({
    prompt: trimmed,
    teamName: parsedTeam,
    layout: "kit",
    conceptCount: count,
    ...(parsedColors && !useDesignerStore.getState().colorsEnabled
      ? { colors: parsedColors, colorsEnabled: true }
      : {}),
  });

  session.start(
    "generate",
    count === 1 ? "Rendering design…" : `Rendering concept 1/${count}…`,
  );
  const signal = nextAbort().signal;

  try {
    const result = await generateConceptSet({
      state: useDesignerStore.getState(),
      count,
      signal,
      onProgress: ({ stage, conceptIndex, conceptCount }) => {
        if (conceptIndex && conceptCount) {
          session.setStage(
            conceptCount === 1
              ? "Rendering design…"
              : `Rendering concept ${conceptIndex}/${conceptCount}…`,
          );
        } else session.setStage(stage);
      },
    });

    const store = useDesignerStore.getState();
    store.setConcepts(result.concepts);
    if (result.concepts.length === 1) {
      store.selectConcept(result.concepts[0].id);
      store.setStep(STEP_INDEX.refine as DesignerStep);
    } else {
      store.setStep(STEP_INDEX.concepts as DesignerStep);
    }
    session.succeed(result.mock);
  } catch (generationError) {
    if (generationError instanceof Error && generationError.name === "AbortError") return;
    const message = generationError instanceof Error ? generationError.message : "Generation failed.";
    session.fail(message);
    toast.error(message);
  }
}

export async function refineCurrent(correction: string, colors?: DesignerColors): Promise<boolean> {
  const session = useGenerationSession.getState();
  if (session.busy || isGenerationInFlight()) return false;
  const store = useDesignerStore.getState();
  const hasArtwork = Boolean(store.artwork.front || store.artwork.back);
  if (!store.selectedConceptId || !hasArtwork) {
    toast.error("Choose one of the concepts first, then describe what to change.");
    return false;
  }

  session.start(colors ? "color_variation" : "refine", "Updating uniform…");
  const signal = nextAbort().signal;
  const previousArtwork = { ...store.artwork };
  const previousColors = { ...store.colors };
  const nextColors = colors || store.colors;
  if (colors) store.patch({ colors: nextColors, colorsEnabled: true });
  else store.patch({ correction });

  try {
    const result = await generateUniformKit({
      state: { ...useDesignerStore.getState(), colors: nextColors, colorsEnabled: true },
      mode: colors ? "color_variation" : "refine",
      colors: nextColors,
      correction: colors ? undefined : correction,
      layout: store.layout,
      views: ["front"],
      signal,
      onProgress: ({ stage }) => session.setStage(stage),
    });
    const latest = useDesignerStore.getState();
    for (const version of result.versions) latest.addVersion(version);
    latest.patch({ colors: result.colors, colorsEnabled: true, layout: store.layout });
    session.succeed(result.mock);
    return true;
  } catch (generationError) {
    if (generationError instanceof Error && generationError.name === "AbortError") return false;
    useDesignerStore.getState().patch({ artwork: previousArtwork, colors: previousColors });
    const message = generationError instanceof Error ? generationError.message : "Update failed.";
    session.fail(message);
    toast.error(message);
    return false;
  }
}

export async function submitStudioPrompt(raw: string) {
  const prompt = raw.trim();
  const session = useGenerationSession.getState();
  if (session.busy || isGenerationInFlight()) return;
  if (prompt.length < 8) {
    toast.error("Add a bit more detail so AI can design the uniform.");
    return;
  }

  let store = useDesignerStore.getState();
  const explicitTeam = extractExplicitTeamName(prompt);
  let previousTeamName: string | undefined;
  if (explicitTeam && explicitTeam !== store.teamName) {
    previousTeamName = store.teamName;
    store.patch({ teamName: explicitTeam });
    store = useDesignerStore.getState();

    // Team wording is an app-owned SVG layer. Renaming it must be instant, exact and free: no
    // image-model edit is needed, and the selected garment artwork stays byte-for-byte unchanged.
    if (store.selectedConceptId && isTeamNameOnlyEdit(prompt)) {
      return;
    }
  }

  // A concept must be selected before a prompt is treated as an edit; otherwise there is
  // no single master design to refine and the prompt starts a fresh set.
  const hasSelection = Boolean(store.selectedConceptId) && Boolean(store.artwork.front || store.artwork.back);
  if (isFreshGenerateRequest(prompt, hasSelection)) {
    await generateConcepts(prompt);
    return;
  }
  const updated = await refineCurrent(prompt);
  if (!updated && previousTeamName !== undefined) {
    useDesignerStore.getState().patch({ teamName: previousTeamName });
  }
}

export function useDesignerGeneration() {
  const session = useGenerationSession();
  return {
    busy: session.busy,
    stage: session.stage,
    error: session.error,
    mockMode: session.mockMode,
    kind: session.kind,
    submitPrompt: submitStudioPrompt,
    generateConcepts,
    refineCurrent,
    uploadLogo: uploadDesignerLogo,
  };
}
