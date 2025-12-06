"use client";

import React, { useState, useCallback, memo, useRef } from "react";
import { useConfiguratorStore } from "@/lib/store";
import {
  Palette,
  Paintbrush,
  Camera,
  ChevronDown,
  X,
  Grid3x3,
  RotateCcw,
  Play,
  FileImage,
  Film,
  Pause,
  Info,
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
  () => import("./material-editor").then((mod) => ({ default: mod.MaterialEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-4">
        <div className="h-8 bg-muted rounded-lg mobile-skeleton" />
        <div className="h-24 bg-muted rounded-lg mobile-skeleton" />
        <div className="h-16 bg-muted rounded-lg mobile-skeleton" />
      </div>
    )
  }
);

const UVTextureEditor = dynamic(
  () => import("./uv-texture-editor").then((mod) => ({ default: mod.UVTextureEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-4">
        <div className="h-8 bg-muted rounded-lg mobile-skeleton" />
        <div className="aspect-square bg-muted rounded-lg mobile-skeleton" />
      </div>
    )
  }
);

type TabType = "materials" | "texture" | "export" | null;

// Memoized nav button component
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
      className={`mobile-nav-item ${isActive ? "active" : "text-muted-foreground"}`}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
});

export function MobileBottomNav() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [panelHeight, setPanelHeight] = useState(60); // percentage
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // Store selectors
  const products = useConfiguratorStore((state) => state.products);
  const selectedProductId = useConfiguratorStore((state) => state.selectedProductId);
  const setSelectedProduct = useConfiguratorStore((state) => state.setSelectedProduct);
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
  const autoRotate = useConfiguratorStore((state) => state.autoRotate);
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  const cameraControlsRef = useConfiguratorStore((state) => state.cameraControlsRef);
  const setMobilePanelOpen = useConfiguratorStore((state) => state.setMobilePanelOpen);
  const setMobilePanelHeight = useConfiguratorStore((state) => state.setMobilePanelHeight);

  // Handle tab click
  const handleTabClick = useCallback((tab: TabType) => {
    if (activeTab === tab && isExpanded) {
      setIsExpanded(false);
      setMobilePanelOpen(false);
      setMobilePanelHeight(0);
      setTimeout(() => setActiveTab(null), 300);
    } else {
      setActiveTab(tab);
      setIsExpanded(true);
      setPanelHeight(60);
      setMobilePanelOpen(true);
      setMobilePanelHeight(60);
    }
  }, [activeTab, isExpanded, setMobilePanelOpen, setMobilePanelHeight]);

  // Close panel
  const closePanel = useCallback(() => {
    setIsExpanded(false);
    setMobilePanelOpen(false);
    setMobilePanelHeight(0);
    setTimeout(() => setActiveTab(null), 300);
  }, [setMobilePanelOpen, setMobilePanelHeight]);

  // Handle drag to resize panel
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = panelHeight;
  }, [panelHeight]);

  const handleDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartY.current === 0) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY.current - clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(85, Math.max(30, dragStartHeight.current + deltaPercent));
    
    setPanelHeight(newHeight);
    setMobilePanelHeight(newHeight);
  }, [setMobilePanelHeight]);

  const handleDragEnd = useCallback(() => {
    dragStartY.current = 0;
    
    // Snap to close if dragged down enough
    if (panelHeight < 35) {
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
    const controls = cameraControlsRef as { reset?: (enableTransition: boolean) => void } | null;
    if (controls?.reset) {
      controls.reset(true);
    }
  }, [cameraControlsRef]);

  // Get tab title
  const getTabTitle = useCallback((tab: TabType) => {
    switch (tab) {
      case "materials": return "Materials & Colors";
      case "texture": return "Texture Editor";
      case "export": return "Export & Controls";
      default: return "";
    }
  }, []);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={closePanel}
          style={{ transform: 'translateZ(0)' }}
        />
      )}

      {/* Expanded Panel */}
      <div
        ref={panelRef}
        className={`fixed left-0 right-0 bottom-0 bg-card border-t border-border/50 rounded-t-2xl z-50 mobile-sheet ${
          isExpanded ? "mobile-panel-enter" : "mobile-panel-exit pointer-events-none"
        }`}
        style={{ 
          height: isExpanded ? `${panelHeight}vh` : '0',
          maxHeight: '85vh',
          transform: 'translateZ(0)',
        }}
      >
        {/* Drag Handle */}
        <div 
          className="w-full py-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
        >
          <div className="mobile-sheet-handle" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border/30">
          <h3 className="font-semibold text-base">{getTabTitle(activeTab)}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={closePanel}
            className="h-9 w-9 p-0 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto thin-scrollbar overscroll-contain" style={{ height: 'calc(100% - 60px)' }}>
          {activeTab === "materials" && (
            <div className="p-4 space-y-4">
              {/* Model Selector */}
              <div className="card-mobile">
                <label className="section-header-mobile block mb-2">
                  Select Model
                </label>
                <Select
                  value={selectedProductId || ""}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Choose a 3D model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="py-3">
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
            <div className="p-4">
              <UVTextureEditor />
            </div>
          )}

          {activeTab === "export" && (
            <div className="p-4 space-y-4">
              {/* Quick Actions */}
              <div className="card-mobile">
                <h4 className="section-header-mobile">View Controls</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="btn-mobile justify-start"
                    onClick={handleResetCamera}
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Reset View</span>
                  </Button>
                  <Button
                    variant={autoRotate ? "default" : "outline"}
                    className="btn-mobile justify-start"
                    onClick={() => setAutoRotate(!autoRotate)}
                  >
                    {autoRotate ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span>{autoRotate ? "Stop" : "Rotate"}</span>
                  </Button>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    className="btn-mobile justify-start"
                    onClick={toggleGrid}
                  >
                    <Grid3x3 className="w-5 h-5" />
                    <span>{showGrid ? "Hide" : "Show"} Grid</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="btn-mobile justify-start"
                    onClick={handleScreenshot}
                  >
                    <Camera className="w-5 h-5" />
                    <span>Screenshot</span>
                  </Button>
                </div>
              </div>

              {/* Export Options */}
              <div className="card-mobile">
                <h4 className="section-header-mobile">Export</h4>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="btn-mobile w-full justify-start"
                    onClick={handleScreenshot}
                  >
                    <FileImage className="w-5 h-5" />
                    <span>Save as Image</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="btn-mobile w-full justify-start"
                    disabled={isRecording}
                  >
                    <Film className="w-5 h-5" />
                    <span>{isRecording ? "Recording..." : "Record Video"}</span>
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  For advanced export options like 4K images and model files, use the desktop version.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div 
        className="bg-card/95 backdrop-blur-md border-t border-border/50 px-2 py-2 flex items-center justify-around shadow-lg pb-safe relative z-50"
        style={{ transform: 'translateZ(0)' }}
      >
        <NavButton
          icon={Palette}
          label="Materials"
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
        {isExpanded && (
          <NavButton
            icon={ChevronDown}
            label="Close"
            isActive={false}
            onClick={closePanel}
          />
        )}
      </div>
    </div>
  );
}
