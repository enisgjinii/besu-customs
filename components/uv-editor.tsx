"use client";

import type React from "react";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, IText, Image as FabricImage, FabricObject } from "fabric";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ImageIcon,
  Type,
  Download,
  Trash2,
  Undo2,
  Redo2,
  Layers,
  Map,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  RotateCw,
} from "lucide-react";
import { UVMapViewer } from "./uv-map-viewer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UVEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showUVMap, setShowUVMap] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showUVWireframe, setShowUVWireframe] = useState(true);
  const [textProperties, setTextProperties] = useState({
    fontSize: 40,
    fontFamily: "Arial",
    color: "#000000",
  });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const uvMaps = useConfiguratorStore((state) => state.uvMaps);
  const completeUVMap = useConfiguratorStore(
    (state) =>
      (state as unknown as { completeUVMap: string | null }).completeUVMap,
  );

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  // Use complete UV map if no section is selected, otherwise use section-specific UV map
  const uvMapUrl = selectedSectionId
    ? uvMaps.get(selectedSectionId)
    : completeUVMap;

  // Real-time texture update - debounced
  const applyToModelRealtime = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedSectionId) {
      console.log("applyToModelRealtime: skipping - no canvas or section", {
        hasCanvas: !!fabricCanvasRef.current,
        selectedSectionId
      });
      return;
    }

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce the update to avoid too many renders (tuned down for near-instant feedback)
    updateTimeoutRef.current = setTimeout(() => {
      if (!fabricCanvasRef.current) return;
      
      console.log("Applying texture to model...");
      const dataUrl = (fabricCanvasRef.current as any).toDataURL({
        multiplier: 1,
        format: "png",
        quality: 0.9,
        withoutTransform: false,
        enableRetinaScaling: false,
      });

      console.log("Texture generated, updating section:", selectedSectionId);
      updateSection(selectedSectionId, { customTexture: dataUrl });
    }, 120); // 120ms debounce for snappier updates
  }, [selectedSectionId, updateSection]);

  // Initialize Fabric.js canvas once when the DOM canvas exists
  useEffect(() => {
    // Only initialize when a canvas element is present and we haven't created Fabric yet
    if (fabricCanvasRef.current || !canvasRef.current) return;

    // Responsive canvas size
    const canvasSize = Math.min(window.innerWidth - 100, 600);
    const canvas = new Canvas(canvasRef.current, {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Save state and apply to model on object modification
    const handleModification = () => {
      saveState();
      applyToModelRealtime();
    };

    canvas.on("object:modified", handleModification);
    canvas.on("object:added", handleModification);
    canvas.on("object:removed", handleModification);
    canvas.on("object:moving", handleModification);
    canvas.on("object:scaling", handleModification);
    canvas.on("object:rotating", handleModification);
    // Also trigger on text changes
    canvas.on("text:changed", handleModification);

    return () => {
      // Dispose only on unmount
      canvas.dispose();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [applyToModelRealtime, uvMapUrl]);

  // Load UV map as background when available (optimized)
  useEffect(() => {
    if (!fabricCanvasRef.current || !uvMapUrl) return;

    setIsExtracting(true);
    
    // Clear any existing background first
    fabricCanvasRef.current.backgroundImage = undefined;
    fabricCanvasRef.current.renderAll();

    FabricImage.fromURL(uvMapUrl, {
      crossOrigin: "anonymous",
    })
      .then((img) => {
        if (!fabricCanvasRef.current) return;

        img.set({
          selectable: false,
          evented: false,
          opacity: showUVWireframe ? 0.3 : 0,
          scaleX: fabricCanvasRef.current.width! / (img.width || 1),
          scaleY: fabricCanvasRef.current.height! / (img.height || 1),
        });

        fabricCanvasRef.current.backgroundImage = img;
        fabricCanvasRef.current.renderAll();
        setIsExtracting(false);
        
        // Save initial state and apply to model
        saveState();
        applyToModelRealtime();
      })
      .catch((err) => {
        console.error("Failed to load UV map:", err);
        setIsExtracting(false);
      });
  }, [uvMapUrl, showUVWireframe, applyToModelRealtime]);

  const saveState = () => {
    if (!fabricCanvasRef.current) return;
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    setHistory((prev) => [...prev.slice(0, historyStep + 1), json]);
    setHistoryStep((prev) => prev + 1);
  };

  const undo = () => {
    if (historyStep > 0 && fabricCanvasRef.current) {
      setHistoryStep((prev) => prev - 1);
      fabricCanvasRef.current.loadFromJSON(history[historyStep - 1], () => {
        fabricCanvasRef.current?.renderAll();
        applyToModelRealtime();
      });
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && fabricCanvasRef.current) {
      setHistoryStep((prev) => prev + 1);
      fabricCanvasRef.current.loadFromJSON(history[historyStep + 1], () => {
        fabricCanvasRef.current?.renderAll();
        applyToModelRealtime();
      });
    }
  };

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new IText("Edit Text", {
      left: 100,
      top: 100,
      fontSize: textProperties.fontSize,
      fill: textProperties.color,
      fontFamily: textProperties.fontFamily,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (FabricImage as any).fromURL(imgUrl, (img: any) => {
        if (!fabricCanvasRef.current) return;

        // Scale image to fit within canvas while maintaining aspect ratio
        const maxSize = fabricCanvasRef.current.width! * 0.4;
        if (img.width > img.height) {
          img.scaleToWidth(maxSize);
        } else {
          img.scaleToHeight(maxSize);
        }

        img.set({
          left: 100,
          top: 100,
        });

        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
    // Reset file input to allow uploading the same file again
    e.target.value = "";
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj) => {
      if (obj !== fabricCanvasRef.current?.backgroundImage) {
        fabricCanvasRef.current?.remove(obj);
      }
    });
    fabricCanvasRef.current.backgroundColor = "#ffffff";
    fabricCanvasRef.current.renderAll();
    applyToModelRealtime();
  };

  const applyToModel = () => {
    if (!fabricCanvasRef.current || !selectedSectionId) return;

    console.log("Applying high-res texture to model...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataUrl = (fabricCanvasRef.current as any).toDataURL({
      multiplier: 2, // Higher resolution
      format: "png",
      quality: 1,
      withoutTransform: false,
      enableRetinaScaling: false,
    });

    console.log("High-res texture generated, length:", dataUrl.length);
    updateSection(selectedSectionId, { customTexture: dataUrl });
  };

  const exportTexture = () => {
    if (!fabricCanvasRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataUrl = (fabricCanvasRef.current as any).toDataURL({
      multiplier: 2, // Export in higher resolution
      format: "png",
      quality: 1,
    });

    const link = document.createElement("a");
    link.download = `texture-${selectedSection?.name || "export"}.png`;
    link.href = dataUrl;
    link.click();
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  const zoomIn = () => {
    if (!fabricCanvasRef.current) return;
    const zoom = fabricCanvasRef.current.getZoom();
    fabricCanvasRef.current.setZoom(zoom * 1.1);
    fabricCanvasRef.current.renderAll();
  };

  const zoomOut = () => {
    if (!fabricCanvasRef.current) return;
    const zoom = fabricCanvasRef.current.getZoom();
    fabricCanvasRef.current.setZoom(zoom * 0.9);
    fabricCanvasRef.current.renderAll();
  };

  const resetZoom = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setZoom(1);
    fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvasRef.current.renderAll();
  };

  const rotateSelected = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + 15);
      fabricCanvasRef.current.renderAll();
      applyToModelRealtime();
    }
  };

  const toggleUVWireframe = () => {
    setShowUVWireframe(!showUVWireframe);
  };

  // Show complete UV map if no section is selected
  const isCompleteView = !selectedSection && completeUVMap;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 p-2 border-b">
        <div className="text-sm font-medium">
          {selectedSection ? `${selectedSection.name}` : 'UV Texture Editor'}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleUVWireframe}
            className="h-7 px-2"
            title={showUVWireframe ? "Hide UV Grid" : "Show UV Grid"}
          >
            {showUVWireframe ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUVMap(true)}
            className="h-7 px-2 gap-1"
          >
            <Map className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">View</span>
          </Button>
        </div>
      </div>

      
      {showUVMap && uvMapUrl && (
        <UVMapViewer
          uvMapUrl={uvMapUrl}
          sectionName={selectedSection?.name}
          onClose={() => setShowUVMap(false)}
        />
      )}

      <div className="p-3 border-t space-y-2.5">
        {/* Text Properties */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs gap-2"
            >
              <Type className="w-3.5 h-3.5" />
              Text Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Font Size</Label>
                <Slider
                  value={[textProperties.fontSize]}
                  onValueChange={(v) =>
                    setTextProperties({ ...textProperties, fontSize: v[0] })
                  }
                  min={12}
                  max={120}
                  step={2}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {textProperties.fontSize}px
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Font Family</Label>
                <select
                  className="w-full h-8 px-2 text-xs border rounded-md"
                  value={textProperties.fontFamily}
                  onChange={(e) =>
                    setTextProperties({ ...textProperties, fontFamily: e.target.value })
                  }
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={textProperties.color}
                  onChange={(e) =>
                    setTextProperties({ ...textProperties, color: e.target.value })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Main Tools */}
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={addText}
            className="h-8 px-2 text-xs"
          >
            <Type className="w-3.5 h-3.5 mr-1" />
            Text
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={addImage}
            className="h-8 px-2 text-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1" />
            Image
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={deleteSelected}
            className="h-8 px-2 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>

        {/* Transform Tools */}
        <div className="grid grid-cols-4 gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={rotateSelected}
            className="h-8 px-1"
            title="Rotate 15°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            className="h-8 px-1"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            className="h-8 px-1"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetZoom}
            className="h-8 px-1"
            title="Reset View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* History Controls */}
        <div className="grid grid-cols-4 gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={historyStep <= 0}
            className="h-8 px-1"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="h-8 px-1"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearCanvas}
            className="h-8 px-1"
            title="Clear All"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportTexture}
            className="h-8 px-1"
            title="Export"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>

        {!isCompleteView && selectedSectionId && (
          <Button
            size="sm"
            onClick={applyToModel}
            className="w-full h-9 text-xs font-medium"
          >
            Apply High-Res to Model
          </Button>
        )}

        {!isCompleteView && selectedSectionId && (
          <p className="text-[10px] text-muted-foreground text-center">
            Changes apply automatically • Click for final render
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <div className="flex-1 overflow-auto p-2 bg-secondary/10 relative">
        {isExtracting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Extracting UV Map...</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center min-h-full">
          {uvMapUrl ? (
            <canvas
              ref={canvasRef}
              className="shadow-md rounded-sm border border-border max-w-full h-auto"
            />
          ) : (
            <div className="text-center text-muted-foreground px-4">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs">
                {sections.length === 0
                  ? "Load a 3D model"
                  : "Select a material or wait for UV extraction"}
              </p>
            </div>
          )}
        </div>
      </div>

      {!uvMapUrl && !isCompleteView && (
        <div className="p-2 bg-muted/30 text-[10px] text-muted-foreground border-t border-border/50">
          {completeUVMap
            ? "Select a material to edit"
            : "UV map will be extracted automatically"}
        </div>
      )}

      {isCompleteView && (
        <div className="p-2 bg-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400 border-t border-border/50">
          Complete UV map. Select a material to edit specific textures.
        </div>
      )}
    </div>
  );
}
