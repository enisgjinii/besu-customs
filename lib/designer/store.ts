"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignerState, DesignerStep, GarmentType, GarmentView, GenerationVersion, RosterPlayer } from "./types";

export const DESIGNER_FONT_FAMILY = "Open Sans, ui-sans-serif, system-ui, sans-serif";

function createInitialState(): DesignerState {
  return {
    activeStep: 0, style: "modern", sport: "Basketball",
    garmentType: "jersey", view: "front", prompt: "", correction: "", teamName: "",
    font: DESIGNER_FONT_FAMILY, colors: { primary: "#101820", secondary: "#d4af37", accent: "#ffffff" },
    artwork: {},
    transforms: { front: { scale: 1, x: 0, y: 0, rotation: 0 }, back: { scale: 1, x: 0, y: 0, rotation: 0 } },
    textTransforms: { front: { scale: 1, x: 0, y: 0 }, back: { scale: 1, x: 0, y: 0 } },
    history: [], roster: [], customer: { name: "", email: "", phone: "", notes: "" },
  };
}

const initial = createInitialState();

type Actions = {
  patch: (value: Partial<DesignerState>) => void;
  setStep: (step: DesignerStep) => void;
  setGarment: (garmentType: GarmentType) => void; setView: (view: GarmentView) => void;
  setTransform: (value: Partial<DesignerState["transforms"]["front"]>) => void;
  setTextTransform: (value: Partial<DesignerState["textTransforms"]["front"]>) => void;
  addVersion: (version: GenerationVersion) => void; restoreVersion: (version: GenerationVersion) => void;
  addPlayer: () => void; updatePlayer: (id: string, value: Partial<RosterPlayer>) => void; removePlayer: (id: string) => void;
  reset: () => void;
};

export const useDesignerStore = create<DesignerState & Actions>()(persist((set) => ({
  ...initial,
  patch: (value) => set(value),
  setStep: (activeStep) => set({ activeStep }),
  setGarment: (garmentType) => set({ garmentType }), setView: (view) => set({ view }),
  setTransform: (value) => set((s) => ({ transforms: { ...s.transforms, [s.view]: { ...s.transforms[s.view], ...value } } })),
  setTextTransform: (value) => set((s) => ({ textTransforms: { ...s.textTransforms, [s.view]: { ...s.textTransforms[s.view], ...value } } })),
  // A design ID identifies the whole order. Each generated image has its own version ID.
  addVersion: (version) => set((s) => ({ artwork: { ...s.artwork, [version.view]: version.assetUrl }, designId: s.designId || version.id, history: [version, ...s.history].slice(0, 8), correction: "" })),
  restoreVersion: (v) => set((s) => ({ garmentType: v.garmentType, view: v.view, prompt: v.prompt, colors: v.colors, artwork: { ...s.artwork, [v.view]: v.assetUrl }, designId: s.designId || v.id })),
  addPlayer: () => set((s) => ({ roster: [...s.roster, { id: crypto.randomUUID(), name: "", number: "", topSize: "M", shortsSize: "M", quantity: 1 }] })),
  updatePlayer: (id, value) => set((s) => ({ roster: s.roster.map((p) => p.id === id ? { ...p, ...value } : p) })),
  removePlayer: (id) => set((s) => ({ roster: s.roster.filter((p) => p.id !== id) })),
  reset: () => set(createInitialState()),
}), {
  name: "besu-2d-designer-v4",
  version: 5,
  migrate: (persisted) => {
    const source = (persisted || {}) as Partial<DesignerState>;
    const fresh = createInitialState();
    return {
      ...fresh,
      ...source,
      colors: { ...fresh.colors, ...(source.colors || {}) },
      transforms: { ...fresh.transforms, ...(source.transforms || {}), front: { ...fresh.transforms.front, ...(source.transforms?.front || {}) }, back: { ...fresh.transforms.back, ...(source.transforms?.back || {}) } },
      textTransforms: { ...fresh.textTransforms, ...(source.textTransforms || {}), front: { ...fresh.textTransforms.front, ...(source.textTransforms?.front || {}) }, back: { ...fresh.textTransforms.back, ...(source.textTransforms?.back || {}) } },
      artwork: source.artwork && typeof source.artwork === "object" ? source.artwork : {},
      history: Array.isArray(source.history) ? source.history.slice(0, 8) : [],
      roster: Array.isArray(source.roster) ? source.roster : [],
      customer: { ...fresh.customer, ...(source.customer || {}) },
      font: DESIGNER_FONT_FAMILY,
    } as DesignerState;
  },
  partialize: (s) => Object.fromEntries(Object.entries(s).filter(([,v]) => typeof v !== "function")) as DesignerState,
}));
