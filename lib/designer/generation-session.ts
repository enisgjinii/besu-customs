"use client";

import { create } from "zustand";

export type GenerationKind = "generate" | "refine" | "color_variation" | "";

type GenerationSession = {
  busy: boolean;
  stage: string;
  error: string;
  mockMode: boolean;
  kind: GenerationKind;
  start: (kind: GenerationKind, stage?: string) => void;
  setStage: (stage: string) => void;
  succeed: (mockMode: boolean) => void;
  fail: (error: string) => void;
  clearError: () => void;
  reset: () => void;
};

const idle = {
  busy: false,
  stage: "",
  error: "",
  mockMode: false,
  kind: "" as GenerationKind,
};

export const useGenerationSession = create<GenerationSession>((set) => ({
  ...idle,
  start: (kind, stage = "Generating…") => set({ busy: true, stage, error: "", kind }),
  setStage: (stage) => set({ stage }),
  succeed: (mockMode) => set({ ...idle, mockMode }),
  fail: (error) => set({ busy: false, stage: "", error, kind: "" }),
  clearError: () => set({ error: "" }),
  reset: () => set(idle),
}));
