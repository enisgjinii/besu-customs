"use client";

import React, { useState, useCallback, memo, useRef } from "react";
import { useConfiguratorStore } from "@/lib/store";
import {
  Palette,
  Paintbrush,
  Camera,
  X,
  Grid3x3,
  RotateCcw,
  Play,
  FileImage,
  Pause,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

// Lazy load heavy components
const MaterialEditor = dynamic(
  () =>
    import("./material-editor").then((mod) => ({
      default: mod.MaterialEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2 p-3">
        <div className="h-6 bg-muted rounded mobile-skeleton" />
        <div className="h-16 bg-muted rounded mobile-skeleton" />
      </div>
    ),
  },
);

const UVTextureEditor = dynamic(
  () =>
    import("./uv-texture-editor").then((mod) => ({
      default: mod.UVTextureEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2 p-3">
        <div className="h-6 bg-muted rounded mobile-skeleton" />
        <div className="aspect-square bg-muted rounded mobile-skeleton" />
      </div>
    ),
  },
);

type TabType = "materials" | "texture" | "export" | null;

// Compact nav button component
const NavButton = memo(function NavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl transition-all duration-150 min-w-[56px] sm:min-w-[64px] min-h-[48px] active:scale-95 ${
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground active:bg-accent/50"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className="text-[9px] sm:text-[10px] font-medium">{label}</span>
    </button>
  );
});

export function MobileBottomNav() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(40); // percentage - more compact default
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // Store selectors
  const products = useConfiguratorStore((state) => state.products);
  const selectedProductId = useConfiguratorStore(
    (state) => state.selectedProductId,
  );
  const setSelectedProduct = useConfiguratorStore(
    (state) => state.setSelectedProduct,
  );
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
  const autoRotate = useConfiguratorStore((state) => state.autoRotate);
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  const cameraControlsRef = useConfiguratorStore(
    (state) => state.cameraControlsRef,
  );
  const setMobilePanelOpen = useConfiguratorStore(
    (state) => state.setMobilePanelOpen,
  );
  const setMobilePanelHeight = useConfiguratorStore(
    (state) => state.setMobilePanelHeight,
  );

  // Handle tab click
  const handleTabClick = useCallback(
    (tab: TabType) => {
      if (activeTab === tab && isExpanded) {
        setIsExpanded(false);
        setMobilePanelOpen(false);
        setMobilePanelHeight(0);
        setTimeout(() => setActiveTab(null), 200);
      } else {
        setActiveTab(tab);
        setIsExpanded(true);
        setPanelHeight(40);
        setMobilePanelOpen(true);
        setMobilePanelHeight(40);
      }
    },
    [activeTab, isExpanded, setMobilePanelOpen, setMobilePanelHeight],
  );

  // Close panel
  const closePanel = useCallback(() => {
    setIsExpanded(false);
    setMobilePanelOpen(false);
    setMobilePanelHeight(0);
    setTimeout(() => setActiveTab(null), 200);
  }, [setMobilePanelOpen, setMobilePanelHeight]);

  // Handle drag to resize panel
  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragStartY.current = e.clientY;
      dragStartHeight.current = panelHeight;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [panelHeight],
  );

  const handleDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartY.current === 0) return;

      const deltaY = dragStartY.current - e.clientY;
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newHeight = Math.min(
        75,
        Math.max(25, dragStartHeight.current + deltaPercent),
      );

      setPanelHeight(newHeight);
      setMobilePanelHeight(newHeight);
    },
    [setMobilePanelHeight],
  );

  const handleDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = 0;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    // Snap to close if dragged down enough
    if (panelHeight < 30) {
      closePanel();
    }
  }, [panelHeight, closePanel]);

  // Screenshot handler
  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    try {
      const dataURL = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `model-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Screenshot failed:", error);
    }
  }, []);

  // Reset camera handler
  const handleResetCamera = useCallback(() => {
    const controls = cameraControlsRef as {
      reset?: (enableTransition: boolean) => void;
    } | null;
    if (controls?.reset) {
      controls.reset(true);
    }
  }, [cameraControlsRef]);

  // Get tab title
  const getTabTitle = useCallback((tab: TabType) => {
    switch (tab) {
      case "materials":
        return "Colors";
      case "texture":
        return "Texture";
      case "export":
        return "Controls";
      default:
        return "";
    }
  }, []);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ transform: "translateZ(0)" }}
    >
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closePanel}
          style={{ transform: "translateZ(0)" }}
        />
      )}

      {/* Expanded Panel */}
      <div
        ref={panelRef}
        className={`fixed left-0 right-0 bottom-0 bg-card/98 backdrop-blur-lg border-t border-border/40 rounded-t-2xl z-50 shadow-xl ${
          isExpanded
            ? "mobile-panel-enter"
            : "mobile-panel-exit pointer-events-none"
        }`}
        style={{
          height: isExpanded ? `${panelHeight}vh` : "0",
          maxHeight: "75vh",
          transform: "translateZ(0)",
        }}
      >
        {/* Drag Handle - Enhanced */}
        <div
          className="w-full py-3 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handleDragStart}
          onPointerMove={handleDrag}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Drag to resize
            </span>
          </div>
        </div>

        {/* Header - Compact */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30">
          <h3 className="font-semibold text-sm">{getTabTitle(activeTab)}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={closePanel}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto thin-scrollbar overscroll-contain"
          style={{
            height: "calc(100% - 52px)",
            touchAction: "pan-y",
          }}
        >
          {activeTab === "materials" && (
            <div className="p-3 space-y-3 pb-4">
              {/* Model Selector - Compact */}
              <div className="rounded-xl border border-border/30 bg-background/40 p-2.5">
                <label className="block mb-1.5 text-xs font-medium text-muted-foreground">
                  Model
                </label>
                <Select
                  value={selectedProductId || ""}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger className="w-full h-10 text-sm rounded-lg">
                    <SelectValue placeholder="Choose model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem
                        key={product.id}
                        value={product.id}
                        className="py-2"
                      >
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Material Editor */}
              <MaterialEditor />
            </div>
          )}

          {activeTab === "texture" && (
            <div className="p-3">
              <UVTextureEditor />
            </div>
          )}

          {activeTab === "export" && (
            <div className="p-3 space-y-3 pb-4">
              {/* Quick Actions - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1.5 h-20 sm:h-16 rounded-xl p-2 active:scale-95 transition-transform"
                  onClick={handleResetCamera}
                >
                  <RotateCcw className="w-6 h-6 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-[10px] font-medium">
                    Reset View
                  </span>
                </Button>
                <Button
                  variant={autoRotate ? "default" : "outline"}
                  className="flex flex-col items-center gap-1.5 h-20 sm:h-16 rounded-xl p-2 active:scale-95 transition-transform"
                  onClick={() => setAutoRotate(!autoRotate)}
                >
                  {autoRotate ? (
                    <Pause className="w-6 h-6 sm:w-5 sm:h-5" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-5 sm:h-5" />
                  )}
                  <span className="text-xs sm:text-[10px] font-medium">
                    {autoRotate ? "Stop" : "Auto Spin"}
                  </span>
                </Button>
                <Button
                  variant={showGrid ? "default" : "outline"}
                  className="flex flex-col items-center gap-1.5 h-20 sm:h-16 rounded-xl p-2 active:scale-95 transition-transform"
                  onClick={toggleGrid}
                >
                  <Grid3x3 className="w-6 h-6 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-[10px] font-medium">
                    Grid
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1.5 h-20 sm:h-16 rounded-xl p-2 active:scale-95 transition-transform"
                  onClick={handleScreenshot}
                >
                  <FileImage className="w-6 h-6 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-[10px] font-medium">
                    Save Image
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar - Compact */}
      <div
        className="bg-card/98 backdrop-blur-lg border-t border-border/40 px-2 sm:px-4 py-2 flex items-center justify-around pb-safe relative z-50"
        style={{
          transform: "translateZ(0)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <NavButton
          icon={Palette}
          label="Colors"
          isActive={activeTab === "materials"}
          onClick={() => handleTabClick("materials")}
        />
        <NavButton
          icon={Paintbrush}
          label="Texture"
          isActive={activeTab === "texture"}
          onClick={() => handleTabClick("texture")}
        />
        <NavButton
          icon={Camera}
          label="Export"
          isActive={activeTab === "export"}
          onClick={() => handleTabClick("export")}
        />
      </div>
    </div>
  );
}
