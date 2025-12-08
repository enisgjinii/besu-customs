"use client";

import { useConfiguratorStore, Product } from "@/lib/store";
import { ChevronLeft, ChevronRight, ChevronDown, Menu, X, Layers, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Predefined color palette (Nike-style)
const COLOR_PALETTE = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#ffffff" },
  { name: "Wolf Grey", hex: "#a8a8a8" },
  { name: "Light Bone", hex: "#d4cfc4" },
  { name: "University Red", hex: "#ba0c2f" },
  { name: "Purple", hex: "#7b5ea7" },
  { name: "Midnight Navy", hex: "#1e3a5f" },
  { name: "Royal Blue", hex: "#4169e1" },
  { name: "Total Orange", hex: "#ff6b35" },
  { name: "Pink Foam", hex: "#f5b5c8" },
  { name: "Aurora Green", hex: "#3dd6d0" },
  { name: "Pollen", hex: "#d4a84b" },
];

// View angles for locking camera
const VIEW_ANGLES = [
  { name: "Front", icon: "F" },
  { name: "Back", icon: "B" },
  { name: "Left", icon: "L" },
  { name: "Right", icon: "R" },
  { name: "Top", icon: "T" },
  { name: "Bottom", icon: "↓" },
];

export function ConfiguratorBottomBar() {
  const sections = useConfiguratorStore((s) => s.sections);
  const selectedSectionId = useConfiguratorStore((s) => s.selectedSectionId);
  const setSelectedSection = useConfiguratorStore((s) => s.setSelectedSection);
  const updateSection = useConfiguratorStore((s) => s.updateSection);
  const updateAllSections = useConfiguratorStore((s) => s.updateAllSections);

  // Product selection
  const products = useConfiguratorStore((s) => s.products);
  const selectedProductId = useConfiguratorStore((s) => s.selectedProductId);
  const setSelectedProduct = useConfiguratorStore((s) => s.setSelectedProduct);
  const setProducts = useConfiguratorStore((s) => s.setProducts);

  const [menuOpen, setMenuOpen] = useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/models?active=true");
        if (response.ok) {
          const { models } = await response.json();
          if (models && models.length > 0) {
            const activeProducts = models.map((model: any) => ({
              id: model.id,
              title: model.name,
              modelUrl: model.file_path,
              category: model.category || undefined,
            }));
            setProducts(activeProducts);
          }
        }
        setProductsLoaded(true);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProductsLoaded(true);
      }
    };

    if (!productsLoaded && products.length === 0) {
      loadProducts();
    }
  }, [productsLoaded, products.length, setProducts]);

  // Current section index
  const currentIndex = sections.findIndex((s) => s.id === selectedSectionId);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentSection = sections[effectiveIndex];

  const handlePrev = () => {
    if (effectiveIndex > 0) {
      setSelectedSection(sections[effectiveIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (effectiveIndex < sections.length - 1) {
      setSelectedSection(sections[effectiveIndex + 1].id);
    }
  };

  const handleColorSelect = (hex: string) => {
    if (currentSection) {
      updateSection(currentSection.id, { color: hex });
    }
  };

  const handleApplyToAll = () => {
    if (currentSection?.color) {
      updateAllSections({ color: currentSection.color });
    }
  };

  // Find currently selected color name
  const selectedColorName = currentSection
    ? COLOR_PALETTE.find((c) => c.hex.toLowerCase() === currentSection.color?.toLowerCase())?.name || "Custom"
    : "";

  // Product not selected - show product selector
  if (sections.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10 py-4 px-4">
        <div className="max-w-md mx-auto">
          <p className="text-xs text-gray-500 mb-2 text-center">Select a product to start</p>
          <Select
            value={selectedProductId || ""}
            onValueChange={setSelectedProduct}
          >
            <SelectTrigger className="w-full h-12 text-base">
              <SelectValue placeholder="Choose your product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/10">
      {/* View Lock Buttons */}
      <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-black/5 bg-gray-50">
        <span className="text-xs text-gray-500 mr-2">View:</span>
        {VIEW_ANGLES.map((view) => (
          <button
            key={view.name}
            onClick={() => setActiveView(activeView === view.name ? null : view.name)}
            className={`w-7 h-7 rounded text-xs font-medium transition-all ${activeView === view.name
              ? "bg-black text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-black"
              }`}
            title={view.name}
          >
            {view.icon}
          </button>
        ))}
        {activeView && (
          <button
            onClick={() => setActiveView(null)}
            className="ml-2 p-1 text-gray-400 hover:text-black"
            title="Free rotate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
        {/* Product Dropdown */}
        <button
          onClick={() => setProductSelectorOpen(!productSelectorOpen)}
          className="flex items-center gap-1 text-gray-600 hover:text-black transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${productSelectorOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Section Selector */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={effectiveIndex === 0}
            className="p-1 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[120px]">
            <span className="text-sm font-medium text-black">
              {currentSection?.name || "Section"}
            </span>
            <span className="text-sm text-gray-400 ml-2">
              {effectiveIndex + 1} / {sections.length}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={effectiveIndex === sections.length - 1}
            className="p-1 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 border border-black/20 rounded-full text-sm font-medium hover:bg-black/5 transition-colors"
        >
          <Menu className="w-4 h-4" />
          Menu
        </button>
      </div>

      {/* Product Selector Overlay */}
      {productSelectorOpen && (
        <div className="px-4 py-3 bg-gray-50 border-b border-black/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Switch Product</span>
            <button onClick={() => setProductSelectorOpen(false)} className="text-gray-400 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Select
            value={selectedProductId || ""}
            onValueChange={(v) => {
              setSelectedProduct(v);
              setProductSelectorOpen(false);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Color Swatches */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color.hex}
              onClick={() => handleColorSelect(color.hex)}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${currentSection?.color?.toLowerCase() === color.hex.toLowerCase()
                ? "border-black ring-2 ring-black/20"
                : "border-gray-200"
                }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>

        {/* Color Name + Apply to All */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-xs text-gray-500">{selectedColorName}</span>
          <button
            onClick={handleApplyToAll}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-black text-white rounded-full hover:bg-black/80 transition-colors"
          >
            <Layers className="w-3 h-3" />
            Apply to All
          </button>
        </div>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-black/10 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-black">Export Design</h3>
              <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="my-custom-design"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Image Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {["PNG", "JPG", "SVG", "PDF"].map((format) => (
                    <button
                      key={format}
                      className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Video (Spinning Product)</label>
                <button className="w-full px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-colors">
                  Export MP4
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
