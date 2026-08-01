"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignerState, DesignerStep, GarmentType, GarmentView, GenerationVersion, RosterPlayer } from "./types";

const transform = { scale: 1, x: 0, y: 0, rotation: 0 };
const textTransform = { scale: 1, x: 0, y: 0 };
const initial: DesignerState = {
  activeStep: 0, style: "modern", sport: "Basketball",
  garmentType: "jersey", view: "front", prompt: "", correction: "", teamName: "",
  font: "Inter, sans-serif", colors: { primary: "#101820", secondary: "#d4af37", accent: "#ffffff" },
  artwork: {}, transforms: { front: transform, back: transform }, textTransforms: { front: textTransform, back: textTransform }, history: [], roster: [],
  customer: { name: "", email: "", phone: "", notes: "" },
};

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
  addVersion: (version) => set((s) => ({ artwork: { ...s.artwork, [version.view]: version.assetUrl }, designId: version.id, history: [version, ...s.history].slice(0, 8), correction: "" })),
  restoreVersion: (v) => set((s) => ({ garmentType: v.garmentType, view: v.view, prompt: v.prompt, colors: v.colors, artwork: { ...s.artwork, [v.view]: v.assetUrl }, designId: v.id })),
  addPlayer: () => set((s) => ({ roster: [...s.roster, { id: crypto.randomUUID(), name: "", number: "", topSize: "M", shortsSize: "M", quantity: 1 }] })),
  updatePlayer: (id, value) => set((s) => ({ roster: s.roster.map((p) => p.id === id ? { ...p, ...value } : p) })),
  removePlayer: (id) => set((s) => ({ roster: s.roster.filter((p) => p.id !== id) })),
  reset: () => set(initial),
}), { name: "besu-2d-designer-v3", version: 3, partialize: (s) => Object.fromEntries(Object.entries(s).filter(([,v]) => typeof v !== "function")) as DesignerState }));
