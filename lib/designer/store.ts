"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDesignerProduct } from "./products";
import type {
  ActivePiece,
  DesignConcept,
  DesignerState,
  DesignerStep,
  GarmentType,
  GarmentView,
  GenerationVersion,
  RosterPlayer,
} from "./types";

export const DESIGNER_FONT_FAMILY = "Open Sans, ui-sans-serif, system-ui, sans-serif";

function createInitialState(): DesignerState {
  const product = getDesignerProduct("basketball-uniform");
  return {
    activeStep: 0,
    productId: product?.id || "basketball-uniform",
    style: "modern",
    sport: product?.sport || "Basketball",
    garmentType: product?.garmentType || "uniform",
    view: "front",
    activePiece: "jersey",
    prompt: "",
    inspiration: "",
    correction: "",
    teamName: "",
    font: DESIGNER_FONT_FAMILY,
    colors: { primary: "#101820", secondary: "#d4af37", accent: "#ffffff" },
    colorsEnabled: false,
    artwork: {},
    concepts: [],
    selectedConceptId: undefined,
    transforms: {
      front: { scale: 1, x: 0, y: 0, rotation: 0 },
      back: { scale: 1, x: 0, y: 0, rotation: 0 },
    },
    textTransforms: {
      front: { scale: 1, x: 0, y: 0 },
      back: { scale: 1, x: 0, y: 0 },
    },
    logoUrl: undefined,
    logoTransform: { scale: 1, x: 0, y: 0 },
    history: [],
    roster: [],
    previewPlayerId: undefined,
    customer: { name: "", email: "", phone: "", notes: "" },
  };
}

const initial = createInitialState();

type Actions = {
  patch: (value: Partial<DesignerState>) => void;
  setStep: (step: DesignerStep) => void;
  selectProduct: (productId: string) => void;
  setGarment: (garmentType: GarmentType) => void;
  setView: (view: GarmentView) => void;
  setActivePiece: (piece: ActivePiece) => void;
  setTransform: (value: Partial<DesignerState["transforms"]["front"]>) => void;
  setTextTransform: (value: Partial<DesignerState["textTransforms"]["front"]>) => void;
  setLogoTransform: (value: Partial<DesignerState["logoTransform"]>) => void;
  setLogo: (logoUrl: string | undefined) => void;
  setConcepts: (concepts: DesignConcept[]) => void;
  selectConcept: (conceptId: string) => void;
  addVersion: (version: GenerationVersion) => void;
  restoreVersion: (version: GenerationVersion) => void;
  addPlayer: () => void;
  updatePlayer: (id: string, value: Partial<RosterPlayer>) => void;
  removePlayer: (id: string) => void;
  setPreviewPlayer: (id: string | undefined) => void;
  reset: () => void;
};

export const useDesignerStore = create<DesignerState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      patch: (value) => set(value),
      setStep: (activeStep) => set({ activeStep }),
      selectProduct: (productId) => {
        const product = getDesignerProduct(productId);
        if (!product) return;
        set({
          productId: product.id,
          sport: product.sport,
          garmentType: product.garmentType,
          activePiece: product.garmentType === "shorts" ? "shorts" : "jersey",
          concepts: [],
          selectedConceptId: undefined,
          artwork: {},
          designId: undefined,
        });
      },
      setGarment: (garmentType) =>
        set({
          garmentType,
          activePiece: garmentType === "shorts" ? "shorts" : "jersey",
        }),
      setView: (view) => set({ view }),
      setActivePiece: (activePiece) => set({ activePiece }),
      setTransform: (value) =>
        set((s) => ({
          transforms: {
            ...s.transforms,
            [s.view]: { ...s.transforms[s.view], ...value },
          },
        })),
      setTextTransform: (value) =>
        set((s) => ({
          textTransforms: {
            ...s.textTransforms,
            [s.view]: { ...s.textTransforms[s.view], ...value },
          },
        })),
      setLogoTransform: (value) =>
        set((s) => ({ logoTransform: { ...s.logoTransform, ...value } })),
      setLogo: (logoUrl) => set({ logoUrl, logoTransform: { scale: 1, x: 0, y: 0 } }),
      setConcepts: (concepts) => set({ concepts, selectedConceptId: undefined, artwork: {}, designId: undefined }),
      selectConcept: (conceptId) =>
        set((s) => {
          const concept = s.concepts.find((item) => item.id === conceptId);
          if (!concept) return s;
          return {
            selectedConceptId: concept.id,
            artwork: { front: concept.assetUrl, back: concept.assetUrl },
            colors: concept.colors,
            colorsEnabled: true,
            designId: concept.designId,
            correction: "",
          };
        }),
      addVersion: (version) =>
        set((s) => ({
          artwork: { ...s.artwork, [version.view]: version.assetUrl },
          designId: s.designId || version.id,
          colors: version.colors,
          history: [version, ...s.history].slice(0, 12),
          correction: "",
        })),
      restoreVersion: (v) =>
        set((s) => ({
          garmentType: v.garmentType,
          view: v.view,
          colors: v.colors,
          artwork: { ...s.artwork, [v.view]: v.assetUrl },
          designId: s.designId || v.id,
        })),
      addPlayer: () =>
        set((s) => {
          const player: RosterPlayer = {
            id: crypto.randomUUID(),
            name: "",
            number: "",
            topSize: "M",
            shortsSize: "M",
            quantity: 1,
          };
          return {
            roster: [...s.roster, player],
            previewPlayerId: s.previewPlayerId || player.id,
          };
        }),
      updatePlayer: (id, value) =>
        set((s) => ({ roster: s.roster.map((p) => (p.id === id ? { ...p, ...value } : p)) })),
      removePlayer: (id) =>
        set((s) => {
          const roster = s.roster.filter((p) => p.id !== id);
          return {
            roster,
            previewPlayerId: s.previewPlayerId === id ? roster[0]?.id : s.previewPlayerId,
          };
        }),
      setPreviewPlayer: (previewPlayerId) => set({ previewPlayerId }),
      reset: () => set(createInitialState()),
    }),
    {
      name: "besu-2d-designer-v5",
      version: 7,
      migrate: (persisted) => {
        const source = (persisted || {}) as Partial<DesignerState>;
        const fresh = createInitialState();
        return {
          ...fresh,
          ...source,
          productId: source.productId || fresh.productId,
          inspiration: source.inspiration || "",
          colorsEnabled: typeof source.colorsEnabled === "boolean" ? source.colorsEnabled : false,
          activePiece: source.activePiece || fresh.activePiece,
          activeStep: ([0, 1, 2, 3, 4, 5] as const).includes(source.activeStep as DesignerStep)
            ? (source.activeStep as DesignerStep)
            : 0,
          concepts: Array.isArray(source.concepts) ? source.concepts.slice(0, 4) : [],
          selectedConceptId: source.selectedConceptId,
          colors: { ...fresh.colors, ...(source.colors || {}) },
          transforms: {
            ...fresh.transforms,
            ...(source.transforms || {}),
            front: { ...fresh.transforms.front, ...(source.transforms?.front || {}) },
            back: { ...fresh.transforms.back, ...(source.transforms?.back || {}) },
          },
          textTransforms: {
            ...fresh.textTransforms,
            ...(source.textTransforms || {}),
            front: { ...fresh.textTransforms.front, ...(source.textTransforms?.front || {}) },
            back: { ...fresh.textTransforms.back, ...(source.textTransforms?.back || {}) },
          },
          logoTransform: { ...fresh.logoTransform, ...(source.logoTransform || {}) },
          artwork: source.artwork && typeof source.artwork === "object" ? source.artwork : {},
          history: Array.isArray(source.history) ? source.history.slice(0, 12) : [],
          roster: Array.isArray(source.roster) ? source.roster : [],
          customer: { ...fresh.customer, ...(source.customer || {}) },
          font: DESIGNER_FONT_FAMILY,
        } as DesignerState;
      },
      partialize: (s) =>
        Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== "function")) as DesignerState,
    },
  ),
);

export function getPreviewPlayer(state: DesignerState): RosterPlayer | undefined {
  if (state.previewPlayerId) {
    const match = state.roster.find((p) => p.id === state.previewPlayerId);
    if (match) return match;
  }
  return state.roster[0];
}
