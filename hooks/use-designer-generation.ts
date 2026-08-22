"use client";

import { toast } from "sonner";
import {
  extractColors,
  extractTeamName,
  isFreshGenerateRequest,
  wantsConceptBoard,
} from "@/lib/designer/brief-parser";
import {
  generateStudioBoard,
  generateUniformKit,
  isGenerationInFlight,
} from "@/lib/designer/generation-client";
import { useGenerationSession } from "@/lib/designer/generation-session";
import { useDesignerStore } from "@/lib/designer/store";
import type { ArtworkLayout, DesignerColors } from "@/lib/designer/types";

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

export async function generateBoard(prompt: string, layout: ArtworkLayout) {
  const session = useGenerationSession.getState();
  if (session.busy || isGenerationInFlight()) return;
  const trimmed = prompt.trim();
  if (trimmed.length < 8) {
    toast.error("Add a bit more detail so AI can design the uniform.");
    return;
  }

  const parsedTeam = extractTeamName(trimmed, useDesignerStore.getState().teamName);
  const parsedColors = extractColors(trimmed);
  useDesignerStore.getState().patch({
    prompt: trimmed,
    teamName: parsedTeam,
    layout,
    ...(parsedColors && !useDesignerStore.getState().colorsEnabled
      ? { colors: parsedColors, colorsEnabled: true }
      : {}),
  });

  session.start("generate", "Rendering uniform…");
  const signal = nextAbort().signal;

  try {
    const result = await generateStudioBoard({
      state: useDesignerStore.getState(),
      layout,
      signal,
      onProgress: ({ stage, conceptIndex, conceptCount }) => {
        if (conceptIndex && conceptCount) session.setStage(`${conceptIndex}/${conceptCount}`);
        else session.setStage(stage);
      },
    });
    const store = useDesignerStore.getState();
    store.setConcepts([result.concept]);
    store.selectConcept(result.concept.id);
    store.patch({ layout });
    store.setStep(3);
    session.succeed(result.mock);
  } catch (generationError) {
    if (generationError instanceof Error && generationError.name === "AbortError") return;
    const message = generationError instanceof Error ? generationError.message : "Generation failed.";
    session.fail(message);
    toast.error(message);
  }
}

export async function refineCurrent(correction: string, colors?: DesignerColors) {
  const session = useGenerationSession.getState();
  if (session.busy || isGenerationInFlight()) return;
  const store = useDesignerStore.getState();
  const hasArtwork = Boolean(store.artwork.front || store.artwork.back);
  if (!hasArtwork) {
    toast.error("Generate a uniform first, then describe what to change.");
    return;
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
  } catch (generationError) {
    if (generationError instanceof Error && generationError.name === "AbortError") return;
    useDesignerStore.getState().patch({ artwork: previousArtwork, colors: previousColors });
    const message = generationError instanceof Error ? generationError.message : "Update failed.";
    session.fail(message);
    toast.error(message);
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

  const store = useDesignerStore.getState();
  const hasArtwork = Boolean(store.artwork.front || store.artwork.back);
  if (isFreshGenerateRequest(prompt, hasArtwork)) {
    const layout: ArtworkLayout = wantsConceptBoard(prompt) || !hasArtwork ? "board" : store.layout || "board";
    await generateBoard(prompt, layout);
    return;
  }
  await refineCurrent(prompt);
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
    generateBoard,
    refineCurrent,
    uploadLogo: uploadDesignerLogo,
  };
}
