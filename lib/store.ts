// Clean Zustand store for the configurator. Single, self-contained file.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Model } from "./models-service";

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
  type: "text" | "image";
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "add";
  order: number;
  dataUrl?: string;
  text?: string;
  textColor?: string;
  fontSize?: number;
  imageUrl?: string;
}

export interface CameraState {
  position?: [number, number, number];
  target?: [number, number, number];
  zoom?: number;
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
  selectedSectionId: string | null;
  highlightedSectionId: string | null;
  linkedSections: Set<string>;
  setSections: (sections: MaterialSection[]) => void;
  updateSection: (id: string, updates: Partial<MaterialSection>) => void;
  updateAllSections: (updates: Partial<MaterialSection>) => void;
  setSelectedSection: (id: string | null) => void;
  setHighlightedSection: (id: string | null) => void;
  toggleSectionLink: (sectionId: string) => void;
  clearSectionLinks: () => void;
  recentColors: string[];
  addRecentColor: (color: string) => void;
  // Product updates
  updateProduct: (id: string, updates: Partial<Product>) => void;

  // UV map management
  uvMaps: Map<string, string>;
  setUVMap: (sectionId: string, uvMapUrl: string | null) => void;
  completeUVMap: string | null;
  setCompleteUVMap: (url: string | null) => void;

  // Global texture apply
  globalCustomTexture: string | null;
  setGlobalCustomTexture: (url: string | null) => void;

  // Texture layers management
  textureLayers: TextureLayer[];
  addTextureLayer: (layer: TextureLayer) => void;
  updateTextureLayer: (id: string, updates: Partial<TextureLayer>) => void;
  removeTextureLayer: (id: string) => void;
  reorderTextureLayers: (layers: TextureLayer[]) => void;
  clearTextureLayers: () => void;

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
      modelUrl: "/models/baseball-caps.glb",
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
      modelUrl: "/models/basketball-shooting-shirt-long-sleeve-without-hoodie.glb",
      category: "Jerseys",
    },
    {
      id: "basketball-shirt-hoodie",
      title: "Basketball Shooting Shirt with Hoodie",
      modelUrl: "/models/basketball-shooting-shirt-short-sleeve-with-hoodie.glb",
      category: "Jerseys",
    },
    {
      id: "basketball-shirt-short",
      title: "Basketball Shooting Shirt Short Sleeve",
      modelUrl: "/models/basketball-shooting-shirt-short-sleeve-without-a-hoodie.glb",
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
      modelUrl: "/models/polo-shirts-long-sleeve.glb",
      category: "Polos",
    },
    {
      id: "polo-short",
      title: "Polo Shirts Short Sleeve",
      modelUrl: "/models/polo-shirts-short-sleeve.glb",
      category: "Polos",
    },
    {
      id: "soccer-crew",
      title: "Soccer Jersey Crew Neck",
      modelUrl: "/models/soccer-jersey-crew-neck.glb",
      category: "Soccer",
    },
    {
      id: "soccer-vneck",
      title: "Soccer Jersey V-Neck",
      modelUrl: "/models/soccer-jersey-v-neck.glb",
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
      modelUrl: "/models/track-and-field-top-crop-top.glb",
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
      modelUrl: "/models/track-and-field-top-tank-top.glb",
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
      modelUrl: "/models/volleyball-shorts-spandex.glb",
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

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
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
      // Optimistically set selection and model
      set({ selectedProductId: id, currentModelUrl: product.modelUrl });

      // Try to fetch precomputed material sections for this model
      (async () => {
        try {
          const resp = await fetch(
            `/api/materials?model=${encodeURIComponent(product.modelUrl!)}`,
          );
          if (resp.ok) {
            const json = await resp.json();
            if (json?.sections) {
              // Populate sections from precomputed file
              set({ sections: json.sections });
              return;
            }
          }
        } catch {
          // ignore and fall back to client extraction
        }
        // No precomputed sections — leave sections empty so ModelLoader will extract
        set({ sections: [] });
      })();
    } else set({ selectedProductId: id });
  },

  currentModelUrl: null,
  setCurrentModelUrl: (url: string | null) => set({ currentModelUrl: url }),

  sections: [],
  selectedSectionId: null,
  highlightedSectionId: null,
  linkedSections: new Set<string>(),
  setSections: (sections: MaterialSection[]) => {
    console.log("🏪 Store.setSections called:", {
      count: sections.length,
      withTextures: sections.filter((s) => s.customTexture).length,
      sampleSection: sections[0]
        ? {
          id: sections[0].id,
          name: sections[0].name,
          hasTexture: !!sections[0].customTexture,
          textureLength: sections[0].customTexture?.length || 0,
        }
        : null,
    });
    return set({ sections });
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

  // Global texture apply
  globalCustomTexture: null,
  setGlobalCustomTexture: (url: string | null) =>
    set({ globalCustomTexture: url }),

  // Texture layers management
  textureLayers: [],
  addTextureLayer: (layer: TextureLayer) =>
    set((state) => ({ textureLayers: [...state.textureLayers, layer] })),
  updateTextureLayer: (id: string, updates: Partial<TextureLayer>) =>
    set((state) => ({
      textureLayers: state.textureLayers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer,
      ),
    })),
  removeTextureLayer: (id: string) =>
    set((state) => ({
      textureLayers: state.textureLayers.filter((layer) => layer.id !== id),
    })),
  reorderTextureLayers: (layers: TextureLayer[]) =>
    set({ textureLayers: layers }),
  clearTextureLayers: () => set({ textureLayers: [] }),

  // Scene controls
  showGrid: false,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  showBoundingBox: false,
  toggleBoundingBox: () => set((state) => ({ showBoundingBox: !state.showBoundingBox })),
  backgroundColor: "#f0f0f0",
  setBackgroundColor: (color: string) => set({ backgroundColor: color }),
  backgroundImage: null,
  setBackgroundImage: (image: string | null) => set({ backgroundImage: image }),
  backgroundVideo: null,
  setBackgroundVideo: (video: string | null) => set({ backgroundVideo: video }),
  isVideoPlaying: false,
  setIsVideoPlaying: (playing: boolean) => set({ isVideoPlaying: playing }),
  cameraControlsRef: null,
  setCameraControlsRef: (ref: unknown | null) =>
    set({ cameraControlsRef: ref }),
  autoRotate: false,
  setAutoRotate: (enabled: boolean) => set({ autoRotate: enabled }),
  glRef: null,
  setGlRef: (ref: unknown | null) => set({ glRef: ref }),

  // Fabric.js integration
  fabricCanvas: null,
  setFabricCanvas: (canvas: any | null) => set({ fabricCanvas: canvas }),
  enable3DTextureInteraction: true,
  setEnable3DTextureInteraction: (enabled: boolean) => set({ enable3DTextureInteraction: enabled }),

  // Model loading
  modelLoading: false,
  setModelLoading: (loading: boolean) => set({ modelLoading: loading }),
  modelError: null,
  setModelError: (err: string | null) => set({ modelError: err }),

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
  setMobilePanelHeight: (height: number) => set({ mobilePanelHeight: height }),

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
      { sections: state.sections, productId: state.selectedProductId },
      null,
      2,
    );
  },
  importPreset: (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.sections) set({ sections: data.sections });
    } catch (err) {
      console.error("Failed to import preset:", err);
    }
  },
  // ensure the store stays valid
}));

export default useConfiguratorStore;
