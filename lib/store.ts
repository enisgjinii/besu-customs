import { create } from "zustand"

export interface MaterialSection {
  id: string
  name: string
  originalName: string
  category: "Body" | "Panels" | "Piping/Trim" | "Other"
  color: string
  roughness: number
  metalness: number
  wireframe: boolean
  customTexture?: string // base64 data URL
}

export interface Product {
  id: string
  title: string
  modelUrl?: string
}

export interface CameraPreset {
  position: [number, number, number]
  target: [number, number, number]
}

export interface ConfigPreset {
  name: string
  sections: MaterialSection[]
  camera?: CameraPreset
}

interface ConfiguratorState {
  // Products
  products: Product[]
  selectedProductId: string | null
  setSelectedProduct: (id: string) => void

  // Model
  uploadedModel: File | null
  currentModelUrl: string | null
  setUploadedModel: (file: File | null) => void
  setCurrentModelUrl: (url: string | null) => void

  // Sections
  sections: MaterialSection[]
  selectedSectionId: string | null
  setSections: (sections: MaterialSection[]) => void
  updateSection: (id: string, updates: Partial<MaterialSection>) => void
  setSelectedSection: (id: string | null) => void

  // UV map state
  uvMaps: Map<string, string> // sectionId -> base64 UV map image
  setUVMap: (sectionId: string, uvMapUrl: string) => void

  // Scene controls
  showGrid: boolean
  toggleGrid: () => void
  // Loading / error state for model loading
  modelLoading: boolean
  setModelLoading: (loading: boolean) => void
  modelError: string | null
  setModelError: (err: string | null) => void

  // Presets
  presets: ConfigPreset[]
  savePreset: (name: string, camera?: CameraPreset) => void
  loadPreset: (preset: ConfigPreset) => void
  exportPreset: () => string
  importPreset: (json: string) => void
}

// Generate 34 placeholder products
const generatePlaceholderProducts = (): Product[] => {
  return Array.from({ length: 34 }, (_, i) => ({
    id: `product-${i + 1}`,
    title: `Product ${i + 1}`,
    modelUrl: undefined,
  }))
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  // Products
  products: generatePlaceholderProducts(),
  selectedProductId: null,
  setSelectedProduct: (id) => set({ selectedProductId: id }),

  // Model
  uploadedModel: null,
  currentModelUrl: null,
  setUploadedModel: (file) => set({ uploadedModel: file, currentModelUrl: null }),
  setCurrentModelUrl: (url) => set({ currentModelUrl: url, uploadedModel: null }),

  // Sections
  sections: [],
  selectedSectionId: null,
  setSections: (sections) => set({ sections }),
  updateSection: (id, updates) =>
    set((state) => ({
      sections: state.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  setSelectedSection: (id) => set({ selectedSectionId: id }),

  // Product updates
  updateProduct: (id: string, updates: Partial<Product>) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  // UV map management
  uvMaps: new Map(),
  setUVMap: (sectionId, uvMapUrl) =>
    set((state) => {
      const newMaps = new Map(state.uvMaps)
      newMaps.set(sectionId, uvMapUrl)
      return { uvMaps: newMaps }
    }),

  // Scene controls
  showGrid: false,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  cameraControlsRef: null,
  setCameraControlsRef: (ref: any) => set({ cameraControlsRef: ref }),
  modelLoading: false,
  setModelLoading: (loading: boolean) => set({ modelLoading: loading }),
  modelError: null,
  setModelError: (err: string | null) => set({ modelError: err }),

  // Presets
  presets: [],
  savePreset: (name, camera) =>
    set((state) => ({
      presets: [...state.presets, { name, sections: state.sections, camera }],
    })),
  loadPreset: (preset) => set({ sections: preset.sections }),
  exportPreset: () => {
    const state = get()
    return JSON.stringify(
      {
        sections: state.sections,
        productId: state.selectedProductId,
      },
      null,
      2,
    )
  },
  importPreset: (json) => {
    try {
      const data = JSON.parse(json)
      if (data.sections) {
        set({ sections: data.sections })
      }
    } catch (error) {
      console.error("Failed to import preset:", error)
    }
  },
}))
