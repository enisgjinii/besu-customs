import { create } from "zustand";

export interface MaterialSection {
  id: string;
  name: string;
  originalName: string;
  category: "Body" | "Panels" | "Piping/Trim" | "Other";
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  customTexture?: string; // base64 data URL
  gradient?: {
    enabled: boolean;
    type: "linear" | "radial";
    colors: string[];
    angle?: number; // for linear gradients (0-360)
    stops?: number[]; // color stop positions (0-1)
  };
}

export interface Product {
  id: string;
  title: string;
  modelUrl?: string;
}

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export interface ConfigPreset {
  name: string;
  sections: MaterialSection[];
  camera?: CameraPreset;
}

interface ConfiguratorState {
  // Products
  products: Product[];
  selectedProductId: string | null;
  setSelectedProduct: (id: string) => void;

  // Model
  currentModelUrl: string | null;
  setCurrentModelUrl: (url: string | null) => void;

  // Sections
  sections: MaterialSection[];
  selectedSectionId: string | null;
  linkedSections: Set<string>; // IDs of sections linked to the selected section
  setSections: (sections: MaterialSection[]) => void;
  updateSection: (id: string, updates: Partial<MaterialSection>) => void;
  setSelectedSection: (id: string | null) => void;
  toggleSectionLink: (sectionId: string) => void;
  clearSectionLinks: () => void;

  // UV map state
  uvMaps: Map<string, string>; // sectionId -> base64 UV map image
  setUVMap: (sectionId: string, uvMapUrl: string) => void;
  completeUVMap: string | null; // Complete UV map of entire model
  setCompleteUVMap: (uvMapUrl: string | null) => void;

  // Scene controls
  showGrid: boolean;
  toggleGrid: () => void;
  cameraControlsRef: unknown;
  setCameraControlsRef: (ref: unknown) => void;
  autoRotate: boolean;
  setAutoRotate: (enabled: boolean) => void;
  glRef: unknown;
  setGlRef: (ref: unknown) => void;
  // Loading / error state for model loading
  modelLoading: boolean;
  setModelLoading: (loading: boolean) => void;
  modelError: string | null;
  setModelError: (err: string | null) => void;

  // Recent colors
  recentColors: string[];
  addRecentColor: (color: string) => void;

  // Presets
  presets: ConfigPreset[];
  savePreset: (name: string, camera?: CameraPreset) => void;
  loadPreset: (preset: ConfigPreset) => void;
  exportPreset: () => string;
  importPreset: (json: string) => void;
}

// Real products with 3D models
const generateProducts = (): Product[] => {
  return [
    {
      id: "baseball-caps",
      title: "Baseball Caps",
      modelUrl: "/models/Baseball caps.glb",
    },
    {
      id: "baseball-pants",
      title: "Baseball Pants",
      modelUrl: "/models/Baseball pants.glb",
    },
    {
      id: "basketball-jersey-long",
      title: "Basketball Jersey Top Long Pants",
      modelUrl: "/models/Basketball jersey top long pants.glb",
    },
    {
      id: "basketball-jersey",
      title: "Basketball Jersey",
      modelUrl: "/models/Basketball jersey.glb",
    },
    {
      id: "basketball-shirt-long",
      title: "Basketball Shooting Shirt Long Sleeve",
      modelUrl:
        "/models/basketball shooting shirt long sleeve without hoodie.glb",
    },
    {
      id: "basketball-shirt-hoodie",
      title: "Basketball Shooting Shirt with Hoodie",
      modelUrl:
        "/models/basketball shooting shirt short sleeve with hoodie.glb",
    },
    {
      id: "basketball-shirt-short",
      title: "Basketball Shooting Shirt Short Sleeve",
      modelUrl:
        "/models/basketball shooting shirt, short sleeve without a hoodie.glb",
    },
    {
      id: "duffle-bag-01",
      title: "Duffle Bag 01",
      modelUrl: "/models/Duffle bag_01.glb",
    },
    {
      id: "duffle-bag",
      title: "Duffle Bag",
      modelUrl: "/models/Duffle Bag.glb",
    },
    {
      id: "flag-football-hoodie",
      title: "Flag Football Top with Hoodie",
      modelUrl: "/models/Flag football top with hoodie.glb",
    },
    {
      id: "half-short",
      title: "Half Short",
      modelUrl: "/models/Half short.glb",
    },
    { id: "hoodie", title: "Hoodie", modelUrl: "/models/Hoodie.glb" },
    {
      id: "long-pants",
      title: "Long Pants",
      modelUrl: "/models/long pants.glb",
    },
    {
      id: "polo-long",
      title: "Polo Shirts Long Sleeve",
      modelUrl: "/models/Polo shirts long sleeve.glb",
    },
    {
      id: "polo-short",
      title: "Polo Shirts Short Sleeve",
      modelUrl: "/models/Polo shirts short sleeve.glb",
    },
    {
      id: "soccer-crew",
      title: "Soccer Jersey Crew Neck",
      modelUrl: "/models/Soccer jersey crew neck.glb",
    },
    {
      id: "soccer-vneck",
      title: "Soccer Jersey V-Neck",
      modelUrl: "/models/Soccer jersey v-neck.glb",
    },
    {
      id: "standard-bottom",
      title: "Standard Bottom Cut Cuffed",
      modelUrl: "/models/Standard bottom cut, cuffed.glb",
    },
    {
      id: "track-compression",
      title: "Track & Field Compression Shorts",
      modelUrl: "/models/Track and field compression shorts.glb",
    },
    {
      id: "track-mid-shorts",
      title: "Track & Field Mid-Length Shorts",
      modelUrl: "/models/Track and field mid-len gth shorts.glb",
    },
    {
      id: "track-split-shorts",
      title: "Track & Field Split Shorts",
      modelUrl: "/models/Track and field split shorts.glb",
    },
    {
      id: "track-crop",
      title: "Track & Field Crop Top",
      modelUrl: "/models/Track and field top crop top.glb",
    },
    {
      id: "track-short-sleeve",
      title: "Track & Field Short Sleeve",
      modelUrl: "/models/Track and field top short sleeve.glb",
    },
    {
      id: "track-tank",
      title: "Track & Field Tank Top",
      modelUrl: "/models/Track and field top tank top.glb",
    },
    {
      id: "volleyball-long",
      title: "Volleyball Long Sleeve Tops",
      modelUrl: "/models/Volleyball long sleeve tops.glb",
    },
    {
      id: "volleyball-short",
      title: "Volleyball Short Sleeve Tops",
      modelUrl: "/models/Volleyball short sleeve tops.glb",
    },
    {
      id: "volleyball-spandex-4",
      title: "Volleyball Shorts Spandex 4",
      modelUrl: "/models/Volleyball shorts spandex 4.glb",
    },
    {
      id: "volleyball-spandex-shorts",
      title: "Volleyball Shorts Spandex",
      modelUrl: "/models/Volleyball shorts spandex.glb",
    },
    {
      id: "volleyball-spandex",
      title: "Volleyball Spandex",
      modelUrl: "/models/Volleyball spandex.glb",
    },
  ];
};

const products = generateProducts();

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  // Products
  products,
  selectedProductId: products[0]?.id || null,
  setSelectedProduct: (id) => {
    const product = get().products.find((p) => p.id === id);
    if (product?.modelUrl) {
      set({ selectedProductId: id, currentModelUrl: product.modelUrl });
    }
  },

  // Model
  currentModelUrl: products[0]?.modelUrl || null,
  setCurrentModelUrl: (url) => set({ currentModelUrl: url }),

  // Sections
  sections: [],
  selectedSectionId: null,
  linkedSections: new Set(),
  setSections: (sections) => set({ sections }),
  updateSection: (id, updates) =>
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
  setSelectedSection: (id) => set({ selectedSectionId: id }),
  toggleSectionLink: (sectionId) =>
    set((state) => {
      const newLinked = new Set(state.linkedSections);
      if (newLinked.has(sectionId)) {
        newLinked.delete(sectionId);
      } else {
        newLinked.add(sectionId);
      }
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
  uvMaps: new Map(),
  setUVMap: (sectionId, uvMapUrl) =>
    set((state) => {
      const newMaps = new Map(state.uvMaps);
      newMaps.set(sectionId, uvMapUrl);
      return { uvMaps: newMaps };
    }),
  completeUVMap: null,
  setCompleteUVMap: (uvMapUrl) => set({ completeUVMap: uvMapUrl }),

  // Scene controls
  showGrid: false,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  cameraControlsRef: null,
  setCameraControlsRef: (ref: unknown) => set({ cameraControlsRef: ref }),
  autoRotate: false, // Changed from true to false - model should not auto-rotate by default
  setAutoRotate: (enabled: boolean) => set({ autoRotate: enabled }),
  glRef: null,
  setGlRef: (ref: unknown) => set({ glRef: ref }),
  modelLoading: false,
  setModelLoading: (loading: boolean) => set({ modelLoading: loading }),
  modelError: null,
  setModelError: (err: string | null) => set({ modelError: err }),

  // Recent colors
  recentColors: [],
  addRecentColor: (color) =>
    set((state) => {
      const filtered = state.recentColors.filter(
        (c) => c.toLowerCase() !== color.toLowerCase(),
      );
      const newRecent = [color, ...filtered].slice(0, 8); // Keep only 8 most recent
      return { recentColors: newRecent };
    }),

  // Presets
  presets: [],
  savePreset: (name, camera) =>
    set((state) => ({
      presets: [...state.presets, { name, sections: state.sections, camera }],
    })),
  loadPreset: (preset) => set({ sections: preset.sections }),
  exportPreset: () => {
    const state = get();
    return JSON.stringify(
      {
        sections: state.sections,
        productId: state.selectedProductId,
      },
      null,
      2,
    );
  },
  importPreset: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.sections) {
        set({ sections: data.sections });
      }
    } catch (error) {
      console.error("Failed to import preset:", error);
    }
  },
}));
