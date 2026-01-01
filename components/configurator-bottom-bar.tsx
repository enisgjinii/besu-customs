"use client";

import { useConfiguratorStore } from "@/lib/store";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Layers,
  RotateCcw,
  Type,
  Image,
  Palette,
  Sparkles,
  Shirt,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const VIEW_ANGLES = ["Front", "Back", "Left", "Right", "Top", "Bottom"];

const MODES = [
  { id: "colors", label: "Colors", icon: Palette },
  { id: "logos", label: "Logos", icon: Shirt },
  { id: "patterns", label: "Patterns", icon: Sparkles },
  { id: "text", label: "Text", icon: Type },
  { id: "images", label: "Images", icon: Image },
  { id: "view", label: "View", icon: Layers }, // Using Layers icon for "View" or "360" concept if available, or just keeping it consistent
];

export function ConfiguratorBottomBar() {
  const sections = useConfiguratorStore((s) => s.sections);
  const selectedSectionId = useConfiguratorStore((s) => s.selectedSectionId);
  const setSelectedSection = useConfiguratorStore((s) => s.setSelectedSection);
  const updateSection = useConfiguratorStore((s) => s.updateSection);
  const updateAllSections = useConfiguratorStore((s) => s.updateAllSections);
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
  const clearTextureLayers = useConfiguratorStore((s) => s.clearTextureLayers);
  const setGlobalCustomTexture = useConfiguratorStore(
    (s) => s.setGlobalCustomTexture,
  ); // For full texture coverage
  const products = useConfiguratorStore((s) => s.products);
  const selectedProductId = useConfiguratorStore((s) => s.selectedProductId);
  const setSelectedProduct = useConfiguratorStore((s) => s.setSelectedProduct);
  const setProducts = useConfiguratorStore((s) => s.setProducts);
  const lockedView = useConfiguratorStore((s) => s.lockedView);
  const setLockedView = useConfiguratorStore((s) => s.setLockedView);

  const [menuOpen, setMenuOpen] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeMode, setActiveMode] = useState<string>("colors");
  const [textInput, setTextInput] = useState("");

  const handleAddText = () => {
    if (!textInput.trim()) return;

    // Create a high-quality canvas for readable text
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Transparent background
      ctx.clearRect(0, 0, 1024, 512);

      // Draw text in contrasting color
      ctx.fillStyle =
        currentSection?.color && currentSection.color !== "#ffffff"
          ? "#ffffff"
          : "#000000";
      ctx.font = "bold 180px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textInput, 512, 256);

      const dataUrl = canvas.toDataURL("image/png");

      // Use UV coordinates for position (0-1)
      // Default to center of texture map
      const pos: [number, number, number] = [0.5, 0.5, 0];
      const rot: [number, number, number] = [0, 0, 0];

      // Add as a texture layer
      addTextureLayer({
        id: `text-${Date.now()}`,
        name: textInput,
        type: "image",
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        order: textureLayers.length,
        imageUrl: dataUrl,
        position: pos,
        rotation: rot,
        scale: [0.3, 0.3, 1], // Relative to texture size
      });
      setTextInput("");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/models?active=true");
        if (response.ok) {
          const { models } = await response.json();
          if (models?.length > 0) {
            setProducts(
              models.map((m: any) => ({
                id: m.id,
                title: m.name,
                modelUrl: m.file_path,
                category: m.category,
              })),
            );
          }
        }
        setProductsLoaded(true);
      } catch {
        setProductsLoaded(true);
      }
    };
    if (!productsLoaded && products.length === 0) loadProducts();
  }, [productsLoaded, products.length, setProducts]);

  const currentIndex = sections.findIndex((s) => s.id === selectedSectionId);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentSection = sections[effectiveIndex];

  const handleColorSelect = (hex: string) => {
    if (currentSection) updateSection(currentSection.id, { color: hex });
  };

  const handleAddImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Use UV coordinates (0-1)
        const pos: [number, number, number] = [0.5, 0.5, 0];
        const rot: [number, number, number] = [0, 0, 0];

        // Add as a texture layer
        addTextureLayer({
          id: `layer-${Date.now()}`,
          name: file.name,
          type: "image",
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal",
          order: textureLayers.length,
          imageUrl: e.target?.result as string,
          position: pos,
          rotation: rot,
          scale: [0.3, 0.3, 1],
        });
      };
      reader.readAsDataURL(file);
    },
    [addTextureLayer, textureLayers.length],
  );

  const selectedColorName = currentSection
    ? COLOR_PALETTE.find(
      (c) => c.hex.toLowerCase() === currentSection.color?.toLowerCase(),
    )?.name || "Custom"
    : "";

  if (!mounted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-black/10 dark:border-white/10 py-4 px-4">
        <div className="text-center text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-black/10 dark:border-white/10 py-4 px-4"
      >
        <div className="max-w-md mx-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
            Select a product to start
          </p>
          <Select
            value={selectedProductId || ""}
            onValueChange={setSelectedProduct}
          >
            <SelectTrigger className="w-full h-12 text-base">
              <SelectValue placeholder="Choose your apparel..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-black/10 dark:border-white/10"
    >
      {/* Mode Tabs */}
      <div className="flex items-center justify-center gap-1 px-2 py-2 border-b border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeMode === mode.id
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-white border border-gray-200 dark:border-gray-700 text-gray-600 hover:border-black"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {mode.label}
            </motion.button>
          );
        })}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="ml-2 flex items-center gap-1 px-3 py-1.5 border border-black/20 rounded-full text-xs font-medium"
        >
          <Menu className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* View Lock for placement modes */}
      {["logos", "text", "images"].includes(activeMode) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="flex items-center justify-center gap-1 px-4 py-2 border-b border-black/5"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            Lock View:
          </span>
          {VIEW_ANGLES.map((view) => (
            <motion.button
              key={view}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setLockedView(lockedView === view ? null : view)}
              className={`w-6 h-6 rounded text-xs font-medium ${lockedView === view
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-white border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}
            >
              {view[0]}
            </motion.button>
          ))}
          {lockedView && (
            <button
              onClick={() => setLockedView(null)}
              className="ml-1 p-1 text-gray-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Layer counter and Clear All button */}
          {textureLayers.length > 0 && (
            <>
              <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {textureLayers.length} layer
                {textureLayers.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => {
                  clearTextureLayers();
                  setGlobalCustomTexture(null);
                }}
                className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear All
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* Mode Content */}
      <AnimatePresence mode="wait">
        {activeMode === "colors" && (
          <motion.div
            key="colors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {/* Section Navigation */}
            <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-black/5">
              <button
                onClick={() =>
                  effectiveIndex > 0 &&
                  setSelectedSection(sections[effectiveIndex - 1].id)
                }
                disabled={effectiveIndex === 0}
                className="p-1 text-gray-400 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center min-w-[100px]">
                <span className="text-sm font-medium">
                  {currentSection?.name}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  {effectiveIndex + 1}/{sections.length}
                </span>
              </div>
              <button
                onClick={() =>
                  effectiveIndex < sections.length - 1 &&
                  setSelectedSection(sections[effectiveIndex + 1].id)
                }
                disabled={effectiveIndex === sections.length - 1}
                className="p-1 text-gray-400 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Color Swatches */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <motion.button
                    key={c.hex}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleColorSelect(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 ${currentSection?.color?.toLowerCase() ===
                      c.hex.toLowerCase()
                      ? "border-black ring-2 ring-black/20"
                      : "border-gray-200 dark:border-gray-700"
                      }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedColorName}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    currentSection?.color &&
                    updateAllSections({ color: currentSection.color })
                  }
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-full"
                >
                  <Layers className="w-3 h-3" /> Apply to All
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {activeMode === "logos" && (
          <motion.div
            key="logos"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-4"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {lockedView
                  ? `Upload logo to ${lockedView} view:`
                  : "Lock a view above first"}
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg cursor-pointer hover:bg-black/80">
                <Image className="w-4 h-4" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAddImage(file);
                  }}
                />
              </label>
              {textureLayers.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {textureLayers.length} layer(s)
                </p>
              )}
            </div>
          </motion.div>
        )}

        {activeMode === "patterns" && (
          <motion.div
            key="patterns"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-4"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
              Choose a pattern:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                "Abstract",
                "Animal",
                "Camo",
                "Sports",
                "Stripes",
                "Geometric",
                "League",
                "Custom",
              ].map((p) => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Generate distinct placeholder patterns for now
                    const canvas = document.createElement("canvas");
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, 512, 512);
                      ctx.fillStyle = "#000000";
                      ctx.globalAlpha = 0.2;

                      if (p === "Stripes") {
                        for (let i = 0; i < 512; i += 40)
                          ctx.fillRect(i, 0, 20, 512);
                      } else if (p === "Geometric") {
                        for (let i = 0; i < 512; i += 40) {
                          for (let j = 0; j < 512; j += 40) {
                            if ((i + j) % 80 === 0) ctx.fillRect(i, j, 20, 20);
                          }
                        }
                      } else if (p === "Camo") {
                        // Simple noise/blobs
                        for (let i = 0; i < 20; i++) {
                          ctx.beginPath();
                          ctx.arc(
                            Math.random() * 512,
                            Math.random() * 512,
                            50,
                            0,
                            Math.PI * 2,
                          );
                          ctx.fill();
                        }
                      } else {
                        // Default noise
                        for (let i = 0; i < 100; i++)
                          ctx.fillRect(
                            Math.random() * 512,
                            Math.random() * 512,
                            40,
                            40,
                          );
                      }

                      addTextureLayer({
                        id: `pattern-${Date.now()}`,
                        name: p,
                        type: "image", // Treat pattern as image layer for now
                        visible: true,
                        locked: false,
                        opacity: 0.5,
                        blendMode: "multiply",
                        order: 0, // Bottom
                        imageUrl: canvas.toDataURL(),
                        position: [0.5, 0.5, 0],
                        rotation: [0, 0, 0],
                        scale: [1, 1, 1], // Full coverage relative to canvas
                      });
                    }
                  }}
                  className="px-2 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:border-black"
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ... rest of render ... */}

        {activeMode === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-4"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {lockedView
                  ? `Add text to ${lockedView}:`
                  : "Lock a view above"}
              </p>
              <input
                type="text"
                placeholder="Enter your text..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-black mb-2"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddText}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg"
              >
                Add Text
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeMode === "images" && (
          <motion.div
            key="images"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-4"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {lockedView
                  ? `Upload image to ${lockedView}:`
                  : "Lock a view above"}
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg cursor-pointer hover:bg-black/80">
                <Image className="w-4 h-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAddImage(file);
                  }}
                />
              </label>
            </div>
          </motion.div>
        )}

        {activeMode === "view" && (
          <motion.div
            key="view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-4"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
              Rotate View:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {VIEW_ANGLES.map((view) => (
                <motion.button
                  key={view}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLockedView(view)}
                  className={`px-4 py-2 text-xs font-medium border rounded-lg hover:border-black ${lockedView === view
                      ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                      : "bg-white dark:bg-black text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                    }`}
                >
                  {view}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLockedView(null)}
                className="px-4 py-2 text-xs font-medium border border-gray-200 dark:border-gray-800 rounded-lg text-red-500 hover:border-red-500"
              >
                Reset
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 bg-white dark:bg-black border-t border-black/10 dark:border-white/10 shadow-lg"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Export Design</h3>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    placeholder="my-custom-design"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                    Image Format
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["PNG", "JPG", "SVG", "PDF"].map((f) => (
                      <button
                        key={f}
                        className="px-3 py-2 text-xs font-medium border rounded-lg hover:border-black"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full px-3 py-2 text-xs font-medium border rounded-lg hover:border-black">
                  Export MP4
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
