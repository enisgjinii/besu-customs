"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Canvas, IText, Image as FabricImage } from "fabric";
import { useConfiguratorStore } from "@/lib/store";
import { Layers, Download, Type, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function UVEditor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState("Arial");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const uvMaps = useConfiguratorStore((state) => state.uvMaps);
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);

  // Use complete UV map if no section is selected, otherwise use section-specific UV map
  const uvMapUrl = selectedSectionId
    ? uvMaps.get(selectedSectionId)
    : completeUVMap;

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // Apply texture to model - direct version without callback closure issues
  const applyTextureToModel = () => {
    // Get fresh values from store
    const currentSectionId = useConfiguratorStore.getState().selectedSectionId;
    const currentSections = useConfiguratorStore.getState().sections;
    const currentUvMaps = useConfiguratorStore.getState().uvMaps;
    const currentCompleteUvMap = (useConfiguratorStore.getState() as any)
      .completeUVMap;
    const currentUvMapUrl = currentSectionId
      ? currentUvMaps.get(currentSectionId)
      : currentCompleteUvMap;

    console.log("🎯 applyTextureToModel called:", {
      hasFabricCanvas: !!fabricCanvasRef.current,
      currentSectionId,
      hasUvMapUrl: !!currentUvMapUrl,
      mode: currentSectionId ? "single-section" : "complete-model",
    });

    if (!fabricCanvasRef.current || !currentUvMapUrl) {
      console.warn("⚠️ Cannot apply: missing requirements", {
        hasFabricCanvas: !!fabricCanvasRef.current,
        hasUvMapUrl: !!currentUvMapUrl,
      });
      return;
    }

    // Create a temporary canvas to composite UV map + overlays
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Set canvas size to match fabric canvas
    tempCanvas.width = fabricCanvasRef.current.width || 1024;
    tempCanvas.height = fabricCanvasRef.current.height || 1024;

    console.log(
      "📏 Canvas dimensions:",
      tempCanvas.width,
      "x",
      tempCanvas.height,
    );

    // Load and draw the UV map base
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      console.log("🖼️ UV map base image loaded", {
        width: img.width,
        height: img.height,
        canvasWidth: tempCanvas.width,
        canvasHeight: tempCanvas.height,
      });

      // Draw UV map as base layer
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

      // Get fabric canvas with text/images (without background)
      const originalBackground = fabricCanvasRef.current!.backgroundImage;
      fabricCanvasRef.current!.backgroundImage = undefined;
      fabricCanvasRef.current!.renderAll();

      // Draw text/images on top
      const overlayDataUrl = fabricCanvasRef.current!.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });

      console.log("🎨 Overlay extracted", {
        length: overlayDataUrl.length,
        hasObjects: fabricCanvasRef.current!.getObjects().length > 0,
        objectCount: fabricCanvasRef.current!.getObjects().length,
      });

      // Restore background
      fabricCanvasRef.current!.backgroundImage = originalBackground;
      fabricCanvasRef.current!.renderAll();

      // Draw overlay on temp canvas
      const overlayImg = new Image();
      overlayImg.onload = () => {
        console.log("✨ Overlay image loaded, drawing composite");
        tempCtx.drawImage(overlayImg, 0, 0);

        // Export final composite
        const finalDataUrl = tempCanvas.toDataURL("image/png", 1.0);

        console.log("🎨 Final composite created", {
          dataUrlLength: finalDataUrl.length,
          isValidDataUrl: finalDataUrl.startsWith("data:image/png"),
          sectionId: currentSectionId,
          applyMode: currentSectionId ? "single-section" : "all-sections",
        });

        if (currentSectionId) {
          // Apply to specific section
          const targetSection = currentSections.find(
            (s) => s.id === currentSectionId,
          );
          console.log("📦 Applying to single section:", {
            name: targetSection?.name,
            id: targetSection?.id,
          });

          useConfiguratorStore
            .getState()
            .updateSection(currentSectionId, { customTexture: finalDataUrl });
        } else {
          // Apply to ALL sections (complete model) - update all at once
          console.log("🌍 Applying to ALL sections (complete model texture)", {
            totalSections: currentSections.length,
            texturePreview: finalDataUrl.substring(0, 50) + "...",
          });

          // Update all sections in a single state update for efficiency
          const updatedSections = currentSections.map((section) => ({
            ...section,
            customTexture: finalDataUrl,
          }));

          console.log("📝 Batch updating all sections with texture", {
            updatedCount: updatedSections.length,
            firstSectionHasTexture: !!updatedSections[0]?.customTexture,
            textureLength: updatedSections[0]?.customTexture?.length,
          });

          useConfiguratorStore.getState().setSections(updatedSections);

          // Immediate verification
          const immediateCheck = useConfiguratorStore.getState().sections;
          console.log("🔍 Immediate check after setSections:", {
            sectionsCount: immediateCheck.length,
            hasTextures: immediateCheck.filter((s) => s.customTexture).length,
            firstSection: {
              id: immediateCheck[0]?.id,
              name: immediateCheck[0]?.name,
              hasTexture: !!immediateCheck[0]?.customTexture,
              textureLength: immediateCheck[0]?.customTexture?.length || 0,
            },
          });
        }

        console.log("✅ Texture update dispatched to store");

        // Verify update
        setTimeout(() => {
          const updatedSections = useConfiguratorStore.getState().sections;
          const sectionsWithTexture = updatedSections.filter(
            (s) => s.customTexture,
          );
          console.log("✅ Update complete (delayed check):", {
            totalSections: updatedSections.length,
            sectionsWithTexture: sectionsWithTexture.length,
            sectionNames: sectionsWithTexture.map((s) => s.name),
            allSections: updatedSections.map((s) => ({
              name: s.name,
              hasTexture: !!s.customTexture,
              textureLen: s.customTexture?.length || 0,
            })),
          });
        }, 100);
      };
      overlayImg.src = overlayDataUrl;
    };
    img.onerror = (err) => {
      console.error("❌ Failed to load UV map image:", err);
    };
    img.src = currentUvMapUrl;
  };

  // Debounced version for automatic updates
  const applyToModel = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      applyTextureToModel();
    }, 300);
  }, []);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (fabricCanvasRef.current || !canvasRef.current) return;

    const canvasSize = Math.min(window.innerWidth - 100, 600);
    const canvas = new Canvas(canvasRef.current, {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Apply to model when objects are modified
    const handleModification = () => {
      applyToModel();
    };

    canvas.on("object:modified", handleModification);
    canvas.on("object:added", handleModification);
    canvas.on("object:removed", handleModification);
    canvas.on("object:moving", handleModification);
    canvas.on("object:scaling", handleModification);
    canvas.on("object:rotating", handleModification);
    canvas.on("text:changed", handleModification);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [applyToModel]);

  // Load UV map as background
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

        // Get actual image dimensions
        const imgWidth = img.width || 1024;
        const imgHeight = img.height || 1024;

        // Resize fabric canvas to match UV map dimensions for proper texture mapping
        fabricCanvasRef.current.setDimensions({
          width: imgWidth,
          height: imgHeight,
        });

        img.set({
          selectable: false,
          evented: false,
          opacity: 0.5, // Semi-transparent so text/images stand out
          scaleX: 1,
          scaleY: 1,
        });

        fabricCanvasRef.current.backgroundImage = img;
        fabricCanvasRef.current.renderAll();
        setIsExtracting(false);

        console.log("📐 UV Map loaded:", {
          uvMapSize: `${imgWidth}x${imgHeight}`,
          canvasSize: `${fabricCanvasRef.current.width}x${fabricCanvasRef.current.height}`,
        });
      })
      .catch((err) => {
        console.error("Error loading UV map:", err);
        setIsExtracting(false);
      });
  }, [uvMapUrl]);

  const handleAddText = () => {
    if (!newText.trim() || !fabricCanvasRef.current) return;

    const text = new IText(newText, {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: fontFamily,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    setNewText("");

    console.log("✏️ Text added to canvas");
    console.log("📍 Current selectedSectionId:", selectedSectionId);
    console.log("🗺️ Current uvMapUrl:", uvMapUrl ? "exists" : "missing");

    // Trigger immediate application
    setTimeout(() => {
      console.log("⏰ Calling applyToModel after text add");
      applyToModel();
    }, 100);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!fabricCanvasRef.current) return;

      FabricImage.fromURL(event.target?.result as string, {
        crossOrigin: "anonymous",
      }).then((img) => {
        if (!fabricCanvasRef.current) return;

        img.set({
          left: 50,
          top: 50,
          scaleX: 0.5,
          scaleY: 0.5,
        });

        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();

        console.log("🖼️ Image added to canvas, will apply to model");
        // Trigger immediate application
        applyToModel();
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleClearAll = () => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj) => {
      fabricCanvasRef.current?.remove(obj);
    });
    fabricCanvasRef.current.renderAll();
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;

    const link = document.createElement("a");
    link.href = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
    });
    link.download = selectedSectionId
      ? `uv-map-${selectedSection?.name || selectedSectionId}.png`
      : "uv-map-complete.png";
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-3">
        {!selectedSectionId && sections.length > 0 && (
          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-md">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Complete Model Mode: Changes will apply to entire 3D model
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">UV Map Editor</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteSelected}
              disabled={!uvMapUrl}
              className="h-8 px-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            {uvMapUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="h-8 px-3"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Add Text */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Add Text</Label>
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter text..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAddText()}
            />
            <Button
              size="sm"
              onClick={handleAddText}
              disabled={!newText.trim() || !uvMapUrl}
              className="h-8 px-3"
              title="Add text"
            >
              <Type className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Text Properties */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(val) => setFontSize(val[0])}
                min={12}
                max={120}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Color</Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-full"
              />
            </div>
          </div>
        </div>

        {/* Add Image */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Add Image</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!uvMapUrl}
            className="w-full h-8"
            title="Upload image"
          >
            <ImageIcon className="w-3.5 h-3.5 mr-2" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddImage}
          />
        </div>

        {uvMapUrl && (
          <Button
            size="sm"
            onClick={() => {
              console.log("🔘 Apply button clicked");
              applyTextureToModel();
            }}
            className="w-full h-8"
          >
            Apply to 3D Model
          </Button>
        )}

        {selectedSectionId ? (
          <p className="text-[10px] text-muted-foreground">
            Editing:{" "}
            <span className="font-medium">{selectedSection?.name}</span> • Drag
            & resize elements
          </p>
        ) : sections.length > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            Complete model editing • Changes apply to entire 3D model
          </p>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-secondary/10 relative">
        {isExtracting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">
                Extracting UV Map...
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-full">
          {uvMapUrl ? (
            <div className="max-w-full">
              <canvas
                ref={canvasRef}
                className="shadow-md rounded-sm border border-border max-w-full h-auto"
                style={{ maxHeight: "60vh" }}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground px-4">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs mb-1">
                {sections.length === 0
                  ? "Load a 3D model to extract UV maps"
                  : "Select a material to edit its texture"}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                UV maps are extracted automatically when materials are loaded
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      {uvMapUrl && (
        <div className="p-2 bg-green-500/10 text-[10px] text-green-600 dark:text-green-400 border-t border-border/50">
          {selectedSectionId
            ? "Changes applied to selected section automatically"
            : "Changes applied to entire model automatically"}
        </div>
      )}
    </div>
  );
}
