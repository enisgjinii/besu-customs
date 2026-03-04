import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Model } from "./models-service";
import { idbStorage } from "./indexed-db-storage";

// Animation types for model entrance
export type EntranceAnimationType =
  | "fadeIn"
  | "scaleUp"
  | "rotateIn"
  | "slideIn"
  | "bounce"
  | "spin"
  | "dropIn"
  | "zoomRotate"
  | "glow"
  | "particleReveal";

export type Category =
  | "Jerseys"
  | "Shorts"
  | "Bags"
  | "Hoodies"
  | "Polos"
  | "Soccer"
  | "Track & Field"
  | "Volleyball"
  | "Caps"
  | "Baseball"
  | "Other";

export type PrintingMethod = "sublimated" | "embroidered";

export interface Product {
  id: string;
  title: string;
  modelUrl?: string;
  category?: Category | string;
}

export interface MaterialSection {
  id: string;
  name: string;
  originalName: string;
  // Use explicit categories but allow custom category strings
  category:
  | "Jersey"
  | "Panels"
  | "Piping/Trim"
  | "Other"
  | "Trim Options DEMO"
  | "Long Sleeve Shooting Shirt"
  | "Basketball Shooting Shirt with Hoodie"
  | "Basketball Shooting Shirt Short Sleeve"
  | "Duffle Bag"
  | "Backpack"
  | "Jersey & Shorts"
  | "Hoodie & Zipper"
  | "Half Size Shorts"
  | string;
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  customTexture?: string; // base64 data URL
  trimDesign?: string; // For trim line designs
  trimColor?: string; // Color for trim lines
  combinedOriginalNames?: string[]; // For combined sections like stoppers
  combinedMaterialIds?: string[]; // Material UUIDs for combined sections
  gradient?: {
    enabled: boolean;
    type?: "linear" | "radial";
    angle?: number;
    colors: string[];
    stops?: number[];
  } | null;
}
export interface TextureLayer {
  id: string;
  name: string;
  type: "text" | "image" | "pattern";
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "add";
  order: number;
  dataUrl?: string;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  imageUrl?: string;
  // 3D Transform properties for Decals
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  flipX?: boolean;
  targetMeshId?: string; // The specific mesh this layer is attached to
}

export interface CameraState {
  position?: [number, number, number];
  target?: [number, number, number];
  zoom?: number;
}

export interface ActiveLayerBounds {
  layerId: string;
  canvasSize: number;
  padding: number;
  controlSize: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ConfiguratorState {
  products: Product[];
  selectedProductId: string | null;
  setSelectedProduct: (id: string) => void;
  setProducts: (products: Product[]) => void;
  refreshProducts: () => Promise<void>;
  currentModelUrl: string | null;
  setCurrentModelUrl: (url: string | null) => void;
  sections: MaterialSection[];
  sectionsFromApi: boolean; // Track if sections came from API (better names)
  sectionsLoading: boolean; // Track if API sections are being fetched
  selectedSectionId: string | null;
  highlightedSectionId: string | null;
  linkedSections: Set<string>;
  setSections: (sections: MaterialSection[], fromApi?: boolean) => void;
  updateSection: (id: string, updates: Partial<MaterialSection>) => void;
  updateAllSections: (updates: Partial<MaterialSection>) => void;
  setSelectedSection: (id: string | null) => void;
  setHighlightedSection: (id: string | null) => void;
  toggleSectionLink: (sectionId: string) => void;
  clearSectionLinks: () => void;
  recentColors: string[];
  addRecentColor: (color: string) => void;
  // Section color picker (global control)
  sectionColorPickerOpen: boolean;
  sectionColorPickerSectionId: string | null;
  openSectionColorPicker: (sectionId: string) => void;
  closeSectionColorPicker: () => void;
  // Product updates
  updateProduct: (id: string, updates: Partial<Product>) => void;

  // UV map management
  uvMaps: Map<string, string>;
  setUVMap: (sectionId: string, uvMapUrl: string | null) => void;
  completeUVMap: string | null;
  setCompleteUVMap: (url: string | null) => void;
  completeUVMask: string | null;
  setCompleteUVMask: (url: string | null) => void;

  // Global texture apply
  globalCustomTexture: string | null;
  setGlobalCustomTexture: (url: string | null) => void;

  globalNormalMap: string | null;
  setGlobalNormalMap: (url: string | null) => void;
  globalRoughnessMap: string | null;
  setGlobalRoughnessMap: (url: string | null) => void;
  globalAOMap: string | null;
  setGlobalAOMap: (url: string | null) => void;
  globalDisplacementMap: string | null;
  setGlobalDisplacementMap: (url: string | null) => void;

  // Back texture option - allows users to exclude back from AI texture
  applyTextureToBack: boolean;
  setApplyTextureToBack: (apply: boolean) => void;

  /**
   * Controls how the generated/composited texture is transformed on the BACK materials.
   * Different models export back UVs with different orientation.
   */
  backTextureTransform: "mirrorX" | "mirrorY" | "rotate180" | "none";
  setBackTextureTransform: (
    mode: "mirrorX" | "mirrorY" | "rotate180" | "none",
  ) => void;

  /**
   * Debug options for soccer jersey models (crew neck and v-neck)
   */
  soccerJerseyDebug: {
    flipY: boolean;
    backTransform: "mirrorX" | "mirrorY" | "rotate180" | "none";
    applyToBack: boolean;
    useBackTexture: boolean;
    // UV transform controls for fine-tuning texture alignment
    uvOffsetX: number; // -1 to 1
    uvOffsetY: number; // -1 to 1
    uvRepeatX: number; // 0.1 to 2
    uvRepeatY: number; // 0.1 to 2
    uvRotation: number; // degrees -180 to 180
  };
  setSoccerJerseyDebug: (options: {
    flipY?: boolean;
    backTransform?: "mirrorX" | "mirrorY" | "rotate180" | "none";
    applyToBack?: boolean;
    useBackTexture?: boolean;
    uvOffsetX?: number;
    uvOffsetY?: number;
    uvRepeatX?: number;
    uvRepeatY?: number;
    uvRotation?: number;
  }) => void;

  /**
   * If enabled, we bake the back correction into the generated UV texture image itself
   * (useful when the modeler authored mirrored back UVs and you want the exported
   * texture file to look correct outside this app).
   */
  bakeBackFlipIntoTexture: boolean;
  setBakeBackFlipIntoTexture: (enabled: boolean) => void;

  /**
   * Which side the back torso UV island sits on in the UV template image.
   * Only used when baking back flip into the generated texture.
   */
  backUvSide: "left" | "right";
  setBackUvSide: (side: "left" | "right") => void;

  /**
   * Debug-only: real-time tweak controls for the back texture sampling.
   * These affect only back materials (via backTexture) and are meant for diagnosing UV orientation.
   */
  backTextureDebugEnabled: boolean;
  setBackTextureDebugEnabled: (enabled: boolean) => void;
  backTextureDebugRotationDeg: number; // -180..180
  setBackTextureDebugRotationDeg: (deg: number) => void;
  backTextureDebugOffsetX: number; // -0.25..0.25
  setBackTextureDebugOffsetX: (x: number) => void;
  backTextureDebugOffsetY: number; // -0.25..0.25
  setBackTextureDebugOffsetY: (y: number) => void;

  currentStep: number;
  setStep: (step: number) => void;

  // Texture layers management
  textureLayers: TextureLayer[];
  selectedTextureLayerId: string | null;
  addTextureLayer: (layer: TextureLayer) => void;
  updateTextureLayer: (id: string, updates: Partial<TextureLayer>) => void;
  removeTextureLayer: (id: string) => void;
  duplicateTextureLayer: (id: string) => void;
  reorderTextureLayers: (layers: TextureLayer[]) => void;
  moveLayer: (
    id: string,
    direction: "forward" | "backward" | "front" | "back",
  ) => void;
  clearTextureLayers: () => void;
  setSelectedTextureLayerId: (id: string | null) => void;
  activeLayerBounds: ActiveLayerBounds | null;
  setActiveLayerBounds: (bounds: ActiveLayerBounds | null) => void;

  // Scene controls
  showGrid: boolean;
  toggleGrid: () => void;
  showBoundingBox: boolean;
  toggleBoundingBox: () => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
  backgroundVideo: string | null;
  setBackgroundVideo: (video: string | null) => void;
  isVideoPlaying: boolean;
  setIsVideoPlaying: (playing: boolean) => void;
  cameraControlsRef: unknown | null;
  setCameraControlsRef: (ref: unknown | null) => void;
  autoRotate: boolean;
  setAutoRotate: (enabled: boolean) => void;
  lockedView: string | null;
  setLockedView: (view: string | null) => void;
  glRef: unknown | null;
  setGlRef: (ref: unknown | null) => void;

  // Fabric.js integration for 3D interaction
  fabricCanvas: any | null;
  setFabricCanvas: (canvas: any | null) => void;
  enable3DTextureInteraction: boolean;
  setEnable3DTextureInteraction: (enabled: boolean) => void;

  // Model loading
  modelLoading: boolean;
  setModelLoading: (loading: boolean) => void;
  modelError: string | null;
  setModelError: (err: string | null) => void;

  // Placement Mode
  isPlacementMode: boolean;
  setPlacementMode: (enabled: boolean) => void;
  pendingLayer: Partial<TextureLayer> | null;
  setPendingLayer: (layer: Partial<TextureLayer> | null) => void;

  // Entrance Animation Settings
  entranceAnimation: EntranceAnimationType;
  setEntranceAnimation: (animation: EntranceAnimationType) => void;
  enableEntranceAnimation: boolean;
  setEnableEntranceAnimation: (enabled: boolean) => void;

  // Mobile panel state
  mobilePanelOpen: boolean;
  mobilePanelHeight: number;
  setMobilePanelOpen: (open: boolean) => void;
  setMobilePanelHeight: (height: number) => void;

  // Presets
  presets: Array<{
    name: string;
    sections: MaterialSection[];
    camera?: CameraState;
    productId?: string | null;
  }>;
  savePreset: (name: string, camera?: CameraState) => void;
  loadPreset: (preset: {
    name: string;
    sections: MaterialSection[];
    camera?: CameraState;
    productId?: string | null;
  }) => void;
  deletePreset: (name: string) => void;
  exportPreset: () => string;
  importPreset: (json: string) => void;
  resetAllCustomizations: () => void;

  // Delivery notes for orders
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;

  // Roster management (Source of Truth for player data)
  roster: {
    teamName: string;
    players: Array<{
      id: string;
      nameOnJersey: string;
      jerseyNumber: string;
      sizes: { top: string; shorts: string };
    }>;
  };
  setRoster: (roster: ConfiguratorState["roster"]) => void;

  // Printing Method
  printingMethod: PrintingMethod;
  setPrintingMethod: (method: PrintingMethod) => void;
}

// Generate all possible products (for fallback and reference)
// Only includes models that actually exist in public/models/
function generateAllProducts(): Product[] {
  return [
    {
      id: "backpack",
      title: "Backpack",
      modelUrl: "/models/Backpack.glb",
      category: "Bags",
    },
    {
      id: "baseball-caps",
      title: "Baseball Caps",
      modelUrl: "/models/baseball-caps_UV_FIX.glb",
      category: "Caps",
    },
    {
      id: "baseball-jersey",
      title: "Baseball Jersey",
      modelUrl: "/models/Baseball-Jersey.glb",
      category: "Baseball",
    },
    {
      id: "basketball-jersey",
      title: "Basketball Jersey and Shorts",
      modelUrl: "/models/basketball-jersey-and-shorts.glb",
      category: "Jerseys",
    },
    {
      id: "basketball-top-long",
      title: "Basketball Jersey Top And Long Shorts",
      modelUrl: "/models/basketball-jersey-top-and-long-shorts.glb",
      category: "Jerseys",
    },
    {
      id: "basketball-shirt-long",
      title: "Basketball Shooting Shirt Long Sleeve",
      modelUrl:
        "/models/basketball-shooting-shirt-long-sleeve-without-hoodie.glb",
      category: "Jerseys",
    },
    {
      id: "basketball-shirt-hoodie",
      title: "Basketball Shooting Shirt with Hoodie",
      modelUrl:
        "/models/basketball-shooting-shirt-short-sleeve-with-hoodie.glb",
      category: "Jerseys",
    },
    {
      id: "basketball-shirt-short",
      title: "Basketball Shooting Shirt Short Sleeve",
      modelUrl:
        "/models/basketball-shooting-shirt-short-sleeve-without-a-hoodie.glb",
      category: "Jerseys",
    },
    {
      id: "duffle-bag",
      title: "Duffle Bag",
      modelUrl: "/models/duffle-bag.glb",
      category: "Bags",
    },
    {
      id: "flag-football-hoodie",
      title: "Flag Football Jersey with Hoodie",
      modelUrl: "/models/flag-football-top-with-hoodie.glb",
      category: "Hoodies",
    },
    {
      id: "half-short",
      title: "Half Size Shorts",
      modelUrl: "/models/half-short.glb",
      category: "Shorts",
    },
    {
      id: "hoodie",
      title: "Hoodie",
      modelUrl: "/models/Hoodie.glb",
      category: "Hoodies",
    },
    {
      id: "long-pants",
      title: "Long Pants",
      modelUrl: "/models/long-pants.glb",
      category: "Shorts",
    },
    {
      id: "polo-long",
      title: "Polo Shirts Long Sleeve",
      modelUrl: "/models/polo-shirts-long-sleeve_FIXED.glb",
      category: "Polos",
    },
    {
      id: "polo-short",
      title: "Polo Shirts Short Sleeve",
      modelUrl: "/models/polo-shirts-short-sleeve_FIXED.glb",
      category: "Polos",
    },
    {
      id: "soccer-crew",
      title: "Soccer Jersey Crew Neck",
      modelUrl: "/models/soccer-jersey-crew-neck_FIXED.glb",
      category: "Soccer",
    },
    {
      id: "soccer-vneck",
      title: "Soccer Jersey V-Neck",
      modelUrl: "/models/soccer_jersey_v_neck_COMBINED_FIXED.glb",
      category: "Soccer",
    },
    {
      id: "standard-bottom",
      title: "Standard Bottom Cut, Cuffed",
      modelUrl: "/models/standard-bottom-cut-cuffed.glb",
      category: "Shorts",
    },
    {
      id: "track-compression",
      title: "Track & Field Compression Shorts",
      modelUrl: "/models/track-and-field-compression-shorts.glb",
      category: "Track & Field",
    },
    {
      id: "track-mid-shorts",
      title: "Track & Field Mid-Length Shorts",
      modelUrl: "/models/track-and-field-mid-len-gth-shorts.glb",
      category: "Track & Field",
    },
    {
      id: "track-split-shorts",
      title: "Track & Field Split Shorts",
      modelUrl: "/models/track-and-field-split-shorts.glb",
      category: "Track & Field",
    },
    {
      id: "track-crop",
      title: "Track & Field Crop Top",
      modelUrl: "/models/track-and-field-top-crop-top_FIXED.glb",
      category: "Track & Field",
    },
    {
      id: "track-short-sleeve",
      title: "Track & Field Short Sleeve",
      modelUrl: "/models/track-and-field-top-short-sleeve.glb",
      category: "Track & Field",
    },
    {
      id: "track-tank",
      title: "Track & Field Tank Top",
      modelUrl: "/models/track-and-field-top-tank-top_FIXED.glb",
      category: "Track & Field",
    },
    {
      id: "volleyball-long",
      title: "Volleyball Long Sleeve Tops",
      modelUrl: "/models/volleyball-long-sleeve-tops.glb",
      category: "Volleyball",
    },
    {
      id: "volleyball-short",
      title: "Volleyball Short Sleeve Tops",
      modelUrl: "/models/volleyball-short-sleeve-tops.glb",
      category: "Volleyball",
    },
    {
      id: "volleyball-spandex-4",
      title: "Volleyball Shorts Spandex 4",
      modelUrl: "/models/volleyball-shorts-spandex-4.glb",
      category: "Volleyball",
    },
    {
      id: "volleyball-spandex",
      title: "Volleyball Shorts Spandex",
      modelUrl: "/models/volleyball-shorts-spandex_FIXED.glb",
      category: "Volleyball",
    },
    {
      id: "volleyball-spandex-alt",
      title: "Volleyball Spandex",
      modelUrl: "/models/volleyball-spandex.glb",
      category: "Volleyball",
    },
  ];
}

// Export fallback products for components that need them
export function getFallbackProducts(): Product[] {
  return generateAllProducts().filter((p) => {
    // Filter out inactive models (like "long-pants" which was set to inactive)
    return p.id !== "long-pants";
  });
}

// Start with empty products and load active ones from Supabase
const initialProducts: Product[] = [];

// Function to load active products from Supabase
const loadActiveProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch("/api/models?active=true");
    if (response.ok) {
      const { models } = await response.json();
      return models.map((model: Model) => ({
        id: model.id,
        title: model.name,
        modelUrl: model.file_path,
        category: model.category || undefined,
      }));
    }
  } catch (error) {
    console.error("Failed to load active products:", error);
  }

  // Fallback to all products if API fails
  return generateAllProducts().filter((p) => {
    // Filter out inactive models (like "long-pants" which was set to inactive)
    return p.id !== "long-pants";
  });
};

export const useConfiguratorStore = create<ConfiguratorState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      selectedProductId: null, // Start with no model selected
      setProducts: (products: Product[]) => set({ products }),
      refreshProducts: async () => {
        try {
          const activeProducts = await loadActiveProducts();
          set({
            products: activeProducts,
            // Don't auto-select any model on refresh
            selectedProductId: null,
            currentModelUrl: null,
          });
        } catch (error) {
          console.error("Failed to refresh products:", error);
        }
      },
      setSelectedProduct: (id: string) => {
        const product = get().products.find((p) => p.id === id) ?? null;
        if (product?.modelUrl) {
          // Clear sections and set model URL - sections will be loaded from API
          set({
            selectedProductId: id,
            currentModelUrl: product.modelUrl,
            sections: [],
            sectionsFromApi: false,
            sectionsLoading: true, // Start loading
            completeUVMap: null, // Clear old UV map immediately
            completeUVMask: null, // Clear old UV mask immediately
          });

          // Try to fetch precomputed material sections for this model
          (async () => {
            try {
              const resp = await fetch(
                `/api/materials?model=${encodeURIComponent(product.modelUrl!)}`,
              );
              if (resp.ok) {
                const json = await resp.json();
                if (json?.sections && json.sections.length > 0) {
                  // Populate sections from API - these have better names
                  console.log(
                    "📋 Loaded sections from API:",
                    json.sections.length,
                  );
                  set({
                    sections: json.sections,
                    sectionsFromApi: true,
                    sectionsLoading: false,
                  });
                  return;
                }
              }
            } catch (err) {
              console.warn("⚠️ Failed to fetch sections from API:", err);
            }
            // No precomputed sections — leave sections empty so ModelLoader will extract
            // sectionsFromApi stays false
            set({ sectionsLoading: false });
          })();
        } else set({ selectedProductId: id });
      },

      currentModelUrl: null,
      setCurrentModelUrl: (url: string | null) =>
        set({ currentModelUrl: url, completeUVMap: null, completeUVMask: null }),

      sections: [],
      sectionsFromApi: false,
      sectionsLoading: false,
      selectedSectionId: null,
      highlightedSectionId: null,
      linkedSections: new Set<string>(),
      setSections: (sections: MaterialSection[], fromApi?: boolean) => {
        return set({ sections, sectionsFromApi: fromApi ?? false });
      },
      updateSection: (id: string, updates: Partial<MaterialSection>) =>
        set((state) => {
          const idsToUpdate = state.linkedSections.has(id)
            ? [id, ...Array.from(state.linkedSections)]
            : [id];

          return {
            sections: state.sections.map((s) =>
              idsToUpdate.includes(s.id) ? { ...s, ...updates } : s,
            ),
          };
        }),
      updateAllSections: (updates: Partial<MaterialSection>) => {
        set((state) => ({
          sections: state.sections.map((s) => ({ ...s, ...updates })),
        }));
      },
      setSelectedSection: (id: string | null) => set({ selectedSectionId: id }),
      setHighlightedSection: (id: string | null) =>
        set({ highlightedSectionId: id }),
      toggleSectionLink: (sectionId: string) =>
        set((state) => {
          const newLinked = new Set(state.linkedSections);
          if (newLinked.has(sectionId)) newLinked.delete(sectionId);
          else newLinked.add(sectionId);
          return { linkedSections: newLinked };
        }),
      clearSectionLinks: () => set({ linkedSections: new Set() }),

      // Product updates
      updateProduct: (id: string, updates: Partial<Product>) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      // UV map management
      uvMaps: new Map<string, string>(),
      setUVMap: (sectionId: string, uvMapUrl: string | null) =>
        set((state) => {
          const newMaps = new Map(state.uvMaps);
          if (uvMapUrl === null) newMaps.delete(sectionId);
          else newMaps.set(sectionId, uvMapUrl);
          return { uvMaps: newMaps };
        }),
      completeUVMap: null,
      setCompleteUVMap: (url: string | null) => set({ completeUVMap: url }),
      completeUVMask: null,
      setCompleteUVMask: (url: string | null) => set({ completeUVMask: url }),

      // Global texture apply
      globalCustomTexture: null,
      setGlobalCustomTexture: (url: string | null) =>
        set({ globalCustomTexture: url }),

      globalNormalMap: null,
      setGlobalNormalMap: (url: string | null) => set({ globalNormalMap: url }),
      globalRoughnessMap: null,
      setGlobalRoughnessMap: (url: string | null) => set({ globalRoughnessMap: url }),
      globalAOMap: null,
      setGlobalAOMap: (url: string | null) => set({ globalAOMap: url }),
      globalDisplacementMap: null,
      setGlobalDisplacementMap: (url: string | null) => set({ globalDisplacementMap: url }),

      // Back texture option - default true (apply to back)
      applyTextureToBack: true,
      setApplyTextureToBack: (apply: boolean) =>
        set((state) => ({
          applyTextureToBack: apply,
          // Automatically enable Bake Back Fix whenever we turn on Apply-to-Back,
          // ensuring the fix is applied by default for users.
          bakeBackFlipIntoTexture: apply ? true : state.bakeBackFlipIntoTexture,
        })),

      // Back texture orientation - default mirrorX (most common for jersey backs)
      backTextureTransform: "mirrorX",
      setBackTextureTransform: (mode) => set({ backTextureTransform: mode }),

      // Soccer jersey debug options
      soccerJerseyDebug: {
        flipY: false,
        backTransform: "none",
        applyToBack: true,
        useBackTexture: false,
        // UV transform defaults - centered with no scale
        uvOffsetX: 0,
        uvOffsetY: 0,
        uvRepeatX: 1,
        uvRepeatY: 1,
        uvRotation: 0,
      },
      setSoccerJerseyDebug: (options) =>
        set((state) => ({
          soccerJerseyDebug: { ...state.soccerJerseyDebug, ...options },
        })),

      // Back UV baking (enabled by default)
      bakeBackFlipIntoTexture: true,
      setBakeBackFlipIntoTexture: (enabled: boolean) =>
        set({ bakeBackFlipIntoTexture: enabled }),
      backUvSide: "right",
      setBackUvSide: (side) => set({ backUvSide: side }),

      // Debug back texture controls
      backTextureDebugEnabled: false,
      setBackTextureDebugEnabled: (enabled) =>
        set({ backTextureDebugEnabled: enabled }),
      backTextureDebugRotationDeg: 0,
      setBackTextureDebugRotationDeg: (deg) =>
        set({ backTextureDebugRotationDeg: deg }),
      backTextureDebugOffsetX: 0,
      setBackTextureDebugOffsetX: (x) => set({ backTextureDebugOffsetX: x }),
      backTextureDebugOffsetY: 0,
      setBackTextureDebugOffsetY: (y) => set({ backTextureDebugOffsetY: y }),

      currentStep: 0,
      setStep: (step: number) => set({ currentStep: step }),

      // Printing Method
      printingMethod: "sublimated",
      setPrintingMethod: (method: PrintingMethod) => set({ printingMethod: method }),

      // Texture layers management
      textureLayers: [],
      selectedTextureLayerId: null,
      addTextureLayer: (layer: TextureLayer) => {

        // Auto-rotate camera to front when adding image/logo layers
        if (layer.type === "image") {
          const state = get();
          // Set view to Front so user sees where logo is placed
          if (state.setLockedView) {
            state.setLockedView("Front");
            // Clear the lock after a moment so user can rotate freely
            setTimeout(() => {
              state.setLockedView(null);
            }, 100);
          }
        }

        set((state) => ({
          textureLayers: [...state.textureLayers, layer],
          selectedTextureLayerId: layer.id,
        }));
      },
      updateTextureLayer: (id: string, updates: Partial<TextureLayer>) =>
        set((state) => ({
          textureLayers: state.textureLayers.map((layer) =>
            layer.id === id ? { ...layer, ...updates } : layer,
          ),
        })),
      removeTextureLayer: (id: string) =>
        set((state) => ({
          textureLayers: state.textureLayers.filter((layer) => layer.id !== id),
          selectedTextureLayerId:
            state.selectedTextureLayerId === id
              ? null
              : state.selectedTextureLayerId,
        })),
      duplicateTextureLayer: (id: string) =>
        set((state) => {
          const layerToClone = state.textureLayers.find((l) => l.id === id);
          if (!layerToClone) return {};

          const newId = crypto.randomUUID();
          const position: [number, number, number] = layerToClone.position
            ? [...layerToClone.position]
            : [0.5, 0.5, 0];

          // Slight offset so it's visible it was duplicated
          position[0] = Math.min(Math.max(position[0] + 0.05, 0), 1);
          position[1] = Math.min(Math.max(position[1] + 0.05, 0), 1);

          const newLayer: TextureLayer = {
            ...layerToClone,
            id: newId,
            name: `${layerToClone.name} (Copy)`,
            position,
          };

          return {
            textureLayers: [...state.textureLayers, newLayer],
          };
        }),
      reorderTextureLayers: (layers: TextureLayer[]) =>
        set({ textureLayers: layers }),
      moveLayer: (
        id: string,
        direction: "forward" | "backward" | "front" | "back",
      ) =>
        set((state) => {
          // 1. Sort current layers by order to establish baseline
          const sortedLayers = [...state.textureLayers].sort(
            (a, b) => (a.order || 0) - (b.order || 0),
          );

          // 2. Find index of target layer
          const index = sortedLayers.findIndex((l) => l.id === id);
          if (index === -1) return {};

          // 3. Modify array based on direction
          const layer = sortedLayers[index];
          const newLayers = [...sortedLayers];

          if (direction === "back") {
            // Move to start
            newLayers.splice(index, 1);
            newLayers.unshift(layer);
          } else if (direction === "front") {
            // Move to end
            newLayers.splice(index, 1);
            newLayers.push(layer);
          } else if (direction === "backward") {
            // Swap with previous
            if (index > 0) {
              [newLayers[index - 1], newLayers[index]] = [
                newLayers[index],
                newLayers[index - 1],
              ];
            }
          } else if (direction === "forward") {
            // Swap with next
            if (index < newLayers.length - 1) {
              [newLayers[index], newLayers[index + 1]] = [
                newLayers[index + 1],
                newLayers[index],
              ];
            }
          }

          // 4. Re-assign order values to ensure consistency
          const updatedLayers = newLayers.map((l, i) => ({ ...l, order: i }));

          return { textureLayers: updatedLayers };
        }),
      clearTextureLayers: () =>
        set({ textureLayers: [], selectedTextureLayerId: null }),
      setSelectedTextureLayerId: (id: string | null) =>
        set({ selectedTextureLayerId: id }),
      activeLayerBounds: null,
      setActiveLayerBounds: (bounds: ActiveLayerBounds | null) =>
        set((state) => {
          const prev = state.activeLayerBounds;
          if (!prev && !bounds) return {};
          if (
            prev &&
            bounds &&
            prev.layerId === bounds.layerId &&
            prev.canvasSize === bounds.canvasSize &&
            prev.padding === bounds.padding &&
            prev.controlSize === bounds.controlSize &&
            prev.bounds.x === bounds.bounds.x &&
            prev.bounds.y === bounds.bounds.y &&
            prev.bounds.width === bounds.bounds.width &&
            prev.bounds.height === bounds.bounds.height
          ) {
            return {};
          }
          return { activeLayerBounds: bounds };
        }),

      // Scene controls
      showGrid: false,
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      showBoundingBox: false,
      toggleBoundingBox: () =>
        set((state) => ({ showBoundingBox: !state.showBoundingBox })),
      backgroundColor: "#f0f0f0",
      setBackgroundColor: (color: string) => set({ backgroundColor: color }),
      backgroundImage: null,
      setBackgroundImage: (image: string | null) =>
        set({ backgroundImage: image }),
      backgroundVideo: null,
      setBackgroundVideo: (video: string | null) =>
        set({ backgroundVideo: video }),
      isVideoPlaying: false,
      setIsVideoPlaying: (playing: boolean) => set({ isVideoPlaying: playing }),
      cameraControlsRef: null,
      setCameraControlsRef: (ref: unknown | null) =>
        set({ cameraControlsRef: ref }),
      autoRotate: false,
      setAutoRotate: (enabled: boolean) => set({ autoRotate: enabled }),
      lockedView: null,
      setLockedView: (view: string | null) => set({ lockedView: view }),
      glRef: null,
      setGlRef: (ref: unknown | null) => set({ glRef: ref }),

      // Fabric.js integration
      fabricCanvas: null,
      setFabricCanvas: (canvas: any | null) => set({ fabricCanvas: canvas }),
      enable3DTextureInteraction: true,
      setEnable3DTextureInteraction: (enabled: boolean) =>
        set({ enable3DTextureInteraction: enabled }),

      // Model loading
      modelLoading: false,
      setModelLoading: (loading: boolean) => set({ modelLoading: loading }),
      modelError: null,
      setModelError: (err: string | null) => set({ modelError: err }),

      // Placement Mode
      isPlacementMode: false,
      setPlacementMode: (enabled: boolean) => set({ isPlacementMode: enabled }),
      pendingLayer: null,
      setPendingLayer: (layer: Partial<TextureLayer> | null) =>
        set({ pendingLayer: layer }),

      // Entrance Animation Settings
      entranceAnimation: "zoomRotate" as EntranceAnimationType,
      setEntranceAnimation: (animation: EntranceAnimationType) =>
        set({ entranceAnimation: animation }),
      enableEntranceAnimation: true,
      setEnableEntranceAnimation: (enabled: boolean) =>
        set({ enableEntranceAnimation: enabled }),

      // Mobile panel state
      mobilePanelOpen: false,
      mobilePanelHeight: 0,
      setMobilePanelOpen: (open: boolean) => set({ mobilePanelOpen: open }),
      setMobilePanelHeight: (height: number) =>
        set({ mobilePanelHeight: height }),

      // Recent colors
      recentColors: [],
      addRecentColor: (color: string) =>
        set((state) => ({
          recentColors: [
            color,
            ...state.recentColors.filter(
              (c) => c.toLowerCase() !== color.toLowerCase(),
            ),
          ].slice(0, 8),
        })),

      // Section color picker (global control so modal can render at top-level)
      sectionColorPickerOpen: false,
      sectionColorPickerSectionId: null,
      openSectionColorPicker: (sectionId: string) =>
        set({
          sectionColorPickerOpen: true,
          sectionColorPickerSectionId: sectionId,
        }),
      closeSectionColorPicker: () =>
        set({
          sectionColorPickerOpen: false,
          sectionColorPickerSectionId: null,
        }),

      // Presets
      presets: [],
      savePreset: (name: string, camera?: CameraState) =>
        set((state) => ({
          presets: [
            ...state.presets,
            {
              name,
              sections: state.sections,
              camera,
              productId: state.selectedProductId,
            },
          ],
        })),
      loadPreset: (preset: {
        name: string;
        sections: MaterialSection[];
        camera?: CameraState;
      }) => set({ sections: preset.sections }),
      deletePreset: (name: string) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.name !== name),
        })),
      exportPreset: () => {
        const state = get();
        return JSON.stringify(
          {
            sections: state.sections,
            productId: state.selectedProductId,
            deliveryNotes: state.deliveryNotes,
          },
          null,
          2,
        );
      },
      importPreset: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (data.sections) set({ sections: data.sections });
          if (data.deliveryNotes) set({ deliveryNotes: data.deliveryNotes });
        } catch (err) {
          console.error("Failed to import preset:", err);
        }
      },
      // Reset all customizations
      resetAllCustomizations: () => {
        const state = get();
        // Keep the current model but reset all customizations
        const currentModel = state.currentModelUrl;
        const currentProductId = state.selectedProductId;

        // Reset sections to default colors
        const resetSections = state.sections.map((s) => ({
          ...s,
          color: "#ffffff",
          customTexture: undefined,
          gradient: undefined,
          trimDesign: undefined,
        }));

        set({
          sections: resetSections,
          textureLayers: [],
          globalCustomTexture: null,
          linkedSections: new Set(),
          selectedSectionId: null,
          backgroundColor: "#f0f0f0",
          backgroundImage: null,
          backgroundVideo: null,
          recentColors: [],
          deliveryNotes: "",
        });

        console.log("🔄 Reset all customizations");
      },

      // Delivery notes
      deliveryNotes: "",
      setDeliveryNotes: (notes: string) => set({ deliveryNotes: notes }),

      // Roster management
      roster: { teamName: "", players: [] },
      setRoster: (roster) => set({ roster }),

      // ensure the store stays valid
    }),
    {
      name: "besu-configurator-storage",
      version: 1,
      // Migrate persisted state so that users who already had Apply-to-Back enabled
      // also get Bake Back Fix enabled by default going forward.
      migrate: (persistedState, fromVersion) => {
        if (!persistedState) return persistedState;
        try {
          const state = persistedState as Partial<ConfiguratorState> & {
            applyTextureToBack?: boolean;
            bakeBackFlipIntoTexture?: boolean;
          };
          if (state.applyTextureToBack && !state.bakeBackFlipIntoTexture) {
            return { ...state, bakeBackFlipIntoTexture: true } as any;
          }
        } catch (e) {
          // If migration fails, return persisted state unchanged
          console.warn("Failed to migrate persisted store for bakeBackFlipIntoTexture", e);
        }
        return persistedState;
      },
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        // Only persist essential fields, excluding large data URLs
        textureLayers: state.textureLayers.map((l) => ({
          ...l,
          // Don't persist large data URLs (can be MB each)
          imageUrl: l.imageUrl?.startsWith("data:") ? undefined : l.imageUrl,
          dataUrl: undefined, // Always exclude dataUrl
        })),
        // Don't persist globalCustomTexture (can be MB)
        // globalCustomTexture: state.globalCustomTexture,
        sections: state.sections.map((s) => ({
          ...s,
          // Don't persist custom textures on sections
          customTexture: undefined,
        })),
        selectedProductId: state.selectedProductId,
        currentModelUrl: state.currentModelUrl,
        deliveryNotes: state.deliveryNotes,
        roster: state.roster,
      }),
    },
  ),
);

export default useConfiguratorStore;
