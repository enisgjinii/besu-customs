"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useConfiguratorStore } from "@/lib/store";
import {
  Palette,
  Paintbrush,
  Camera,
  ChevronUp,
  X,
  Download,
  Grid3x3,
  RotateCcw,
  Play,
  FileImage,
  Film,
  Package2,
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

// Lazy load heavy components to improve initial render
const MaterialEditor = dynamic(
  () => import("./material-editor").then((mod) => ({ default: mod.MaterialEditor })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-32 bg-muted rounded" />
  }
);

const UVTextureEditor = dynamic(
  () => import("./uv-texture-editor").then((mod) => ({ default: mod.UVTextureEditor })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-32 bg-muted rounded" />
  }
);

type TabType = "materials" | "texture" | "export" | null;

export function MobileBottomNav() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Memoized store selectors to prevent unnecessary re-renders
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
  const completeUVMap = useConfiguratorStore(
    (state) =>
      (state as unknown as { completeUVMap: string | null }).completeUVMap,
  );
  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const sections = useConfiguratorStore((state) => state.sections);
  
  // Memoize derived state
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId),
    [sections, selectedSectionId]
  );

  // Memoized callbacks to prevent child re-renders
  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab((currentTab) => {
      if (currentTab === tab) {
        setIsExpanded((expanded) => !expanded);
        return currentTab;
      } else {
        setIsExpanded(true);
        return tab;
      }
    });
  }, []);

  const closePanel = useCallback(() => {
    setIsExpanded(false);
    setTimeout(() => setActiveTab(null), 300);
  }, []);

  const handleScreenshot = useCallback(() => {
    // Use the canvas element directly for Babylon.js
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      alert("Canvas not found");
      return;
    }

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
      alert("Failed to capture screenshot. Please try again.");
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    const controls = cameraControlsRef as {
      reset: (enableTransition: boolean) => void;
    } | null;
    if (controls) {
      controls.reset(true);
    }
  }, [cameraControlsRef]);

  const handleDownloadUVMap = useCallback(() => {
    if (!completeUVMap) {
      alert("UV Map not available yet");
      return;
    }

    const link = document.createElement("a");
    link.download = `uv-map-${Date.now()}.png`;
    link.href = completeUVMap;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [completeUVMap]);

  const handleStartRecording = useCallback(() => {
    // TODO: Implement screen recording
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      alert("Screen recording would start here. This is a placeholder.");
    }, 1000);
  }, []);

  // Memoize toggle handlers
  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate(!autoRotate);
  }, [autoRotate, setAutoRotate]);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      data-tour="mobile-nav"
      style={{ transform: 'translateZ(0)' }} /* Hardware acceleration */
    >
      {/* Expanded Panel - Only render content when expanded for performance */}
      <div
        className={`bg-card border-t border-border/50 transition-transform duration-200 ease-out overflow-hidden will-change-transform ${
          isExpanded ? "max-h-[70vh]" : "max-h-0"
        }`}
        style={{ transform: 'translateZ(0)' }}
      >
        <div className="overflow-y-auto max-h-[70vh] pb-4 overscroll-contain">
          {/* Header */}
          <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 p-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {activeTab === "materials" && "Materials"}
              {activeTab === "texture" && "Texture & UV Map"}
              {activeTab === "export" && "Export & Controls"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={closePanel}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === "materials" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Select Model
                  </label>
                  <Select
                    value={selectedProductId || ""}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a model..." />
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
                <MaterialEditor />
              </div>
            )}

            {activeTab === "texture" && (
              <div className="space-y-4">
                <UVTextureEditor />
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-3">
                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetCamera}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset View
                    </Button>
                    <Button
                      variant={autoRotate ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAutoRotate(!autoRotate)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {autoRotate ? "Stop" : "Rotate"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={toggleGrid}>
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      {showGrid ? "Hide" : "Show"} Grid
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScreenshot}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Screenshot
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleScreenshot}
                  >
                    <FileImage className="h-4 w-4" />
                    Take Screenshot
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleStartRecording}
                    disabled={isRecording}
                  >
                    <Film className="h-4 w-4" />
                    {isRecording ? "Recording..." : "Record Video"}
                  </Button>
                </div>

                <div className="text-[10px] text-muted-foreground px-2 py-1 bg-yellow-500/5 rounded">
                  Full export options available on desktop
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Hardware accelerated */}
      <div 
        className="bg-card/95 backdrop-blur-sm border-t border-border/50 px-2 py-2 flex items-center justify-around shadow-lg"
        style={{ transform: 'translateZ(0)' }}
      >
        <button
          onClick={() => handleTabClick("materials")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors duration-150 touch-manipulation ${activeTab === "materials"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground active:text-foreground active:bg-secondary/50"
            }`}
        >
          <Palette className="w-5 h-5" />
          <span className="text-[10px] font-medium">Materials</span>
        </button>

        <button
          onClick={() => handleTabClick("texture")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors duration-150 touch-manipulation ${activeTab === "texture"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground active:text-foreground active:bg-secondary/50"
            }`}
        >
          <Paintbrush className="w-5 h-5" />
          <span className="text-[10px] font-medium">Texture</span>
        </button>

        <button
          onClick={() => handleTabClick("export")}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors duration-150 touch-manipulation ${activeTab === "export"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground active:text-foreground active:bg-secondary/50"
            }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-medium">Export</span>
        </button>

        {isExpanded && (
          <button
            onClick={closePanel}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-muted-foreground active:text-foreground active:bg-secondary/50 transition-colors duration-150 touch-manipulation"
          >
            <ChevronUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Close</span>
          </button>
        )}
      </div>
    </div>
  );
}
