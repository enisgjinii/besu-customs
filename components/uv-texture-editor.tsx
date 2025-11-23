"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Type, Image as ImageIcon, Trash2, Download, Map, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";

export function UVTextureEditor() {
  const completeUVMap = useConfiguratorStore((s) => s.completeUVMap);
  const setGlobalCustomTexture = useConfiguratorStore(
    (s) => s.setGlobalCustomTexture,
  );
  const setFabricCanvas = useConfiguratorStore((s) => s.setFabricCanvas);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  // Text controls
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(48);
  const [hasSelection, setHasSelection] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Real-time update to 3D model
  const updateTexture = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Skip updates during 3D drag to prevent flickering
    if ((canvas as any)._suppress3DDrag) {
      return;
    }

    // Clear previous timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    // Debounce updates for performance
    updateTimerRef.current = setTimeout(() => {
      // Create a temporary canvas for the flipped export
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width || 4096;
      tempCanvas.height = canvas.height || 4096;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Save current background
      const originalBg = canvas.backgroundImage;

      // Temporarily replace UV wireframe with white background for clean export
      canvas.backgroundImage = null;
      canvas.backgroundColor = 'white';
      canvas.renderAll();

      // Flip both X and Y axes before export
      tempCtx.translate(tempCanvas.width, tempCanvas.height);
      tempCtx.scale(-1, -1);

      // Draw the Fabric canvas content
      tempCtx.drawImage(canvas.getElement(), 0, 0);

      const dataUrl = tempCanvas.toDataURL('image/png', 1);

      // Restore UV wireframe background for editing view
      canvas.backgroundImage = originalBg;
      canvas.renderAll();

      setGlobalCustomTexture(dataUrl);
      console.log("🔄 UV texture updated and flipped for 3D (text & images on white background)");
    }, 300);
  }, [setGlobalCustomTexture]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasContainerRef.current || !completeUVMap) return;

    // Prevent double initialization (React Strict Mode issue)
    if (isInitializingRef.current || fabricCanvasRef.current) {
      console.log("⚠️ Skipping duplicate initialization");
      return;
    }

    // Clear any existing canvas elements first
    const container = canvasContainerRef.current;
    const existingCanvas = container.querySelector('#fabric-canvas');
    if (existingCanvas) {
      console.log("🧹 Removing existing canvas element");
      existingCanvas.remove();
    }

    isInitializingRef.current = true;
    let mounted = true;

    const loadFabric = async () => {
      if (!mounted || fabricCanvasRef.current) return;
      console.log("🎨 Initializing Fabric.js canvas with UV map:", completeUVMap);

      // Dynamic import to avoid SSR issues
      const { Canvas, FabricImage } = await import("fabric");

      // Calculate container width to fit canvas proportionally
      const containerWidth = canvasContainerRef.current!.clientWidth - 32; // Account for padding
      const displaySize = Math.min(containerWidth, 800); // Max 800px display

      // Create canvas element
      const canvasEl = document.createElement("canvas");
      canvasEl.id = "fabric-canvas";
      canvasContainerRef.current!.appendChild(canvasEl);

      // Initialize Fabric canvas at high resolution (matches UV map)
      const canvas = new Canvas(canvasEl, {
        width: 4096,
        height: 4096,
        backgroundColor: "#ffffff",
      });

      // Set CSS dimensions for display (keeps 2048x2048 render resolution)
      canvas.setDimensions({
        width: displaySize,
        height: displaySize
      }, {
        cssOnly: true
      });

      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      console.log("✅ Fabric canvas initialized at 4096x4096, displayed at", displaySize, "px");

      // Load UV map as background
      try {
        const img = await FabricImage.fromURL(completeUVMap);
        console.log("✅ UV map image loaded:", img.width, "x", img.height);

        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );

        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        });

        canvas.backgroundImage = img;
        canvas.renderAll();
        setIsLoaded(true);
        console.log("✅ UV map set as background");
        updateTexture();
      } catch (error) {
        console.error("❌ Failed to load UV map:", error);
      }

      // Handle selection changes
      canvas.on("selection:created", () => setHasSelection(true));
      canvas.on("selection:updated", () => setHasSelection(true));
      canvas.on("selection:cleared", () => setHasSelection(false));

      // Real-time updates on any change
      canvas.on("object:modified", updateTexture);
      canvas.on("object:moving", updateTexture);
      canvas.on("object:scaling", updateTexture);
      canvas.on("object:rotating", updateTexture);
      canvas.on("object:added", updateTexture);
      canvas.on("object:removed", updateTexture);
    };

    loadFabric();

    // Cleanup
    return () => {
      mounted = false;
      console.log("🧹 Cleaning up Fabric canvas");
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.log("Canvas already disposed");
        }
        fabricCanvasRef.current = null;
        setFabricCanvas(null);
      }
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      if (canvasContainerRef.current) {
        const canvasEl = canvasContainerRef.current.querySelector('#fabric-canvas');
        if (canvasEl) {
          canvasEl.remove();
        }
      }
      setIsLoaded(false);
      // Reset initialization flag after cleanup
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    };
  }, [completeUVMap, updateTexture]);

  const handleAddText = useCallback(async () => {
    if (!newText.trim() || !fabricCanvasRef.current) return;

    const { IText } = await import("fabric");
    const canvas = fabricCanvasRef.current;

    const text = new IText(newText, {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: "Arial",
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setNewText("");
    updateTexture();
  }, [newText, fontSize, textColor, updateTexture]);

  const handleAddImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const { FabricImage } = await import("fabric");
    const canvas = fabricCanvasRef.current;

    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target?.result as string).then((img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        updateTexture();
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  }, [updateTexture]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const activeObjects = canvas.getActiveObjects();

    if (activeObjects.length > 0) {
      activeObjects.forEach((obj: any) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      updateTexture();
    }
  }, [updateTexture]);

  const handleDuplicate = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      activeObject.clone((cloned: any) => {
        cloned.set({
          left: activeObject.left + 20,
          top: activeObject.top + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        updateTexture();
      });
    }
  }, [updateTexture]);

  const handleDownload = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Temporarily remove UV wireframe but keep white background
    const originalBg = canvas.backgroundImage;

    canvas.backgroundImage = undefined;
    canvas.renderAll();

    // Export flipped version for correct 3D texture orientation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width!;
    tempCanvas.height = canvas.height!;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Flip the canvas both horizontally (X) and vertically (Y)
    tempCtx.translate(tempCanvas.width, tempCanvas.height);
    tempCtx.scale(-1, -1);

    // Draw the Fabric canvas content
    tempCtx.drawImage(canvas.getElement(), 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png', 1);

    // Restore UV wireframe for editing view
    canvas.backgroundImage = originalBg;
    canvas.renderAll();

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "uv-texture.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleClear = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    // Remove all objects except background
    canvas.getObjects().forEach((obj: any) => {
      canvas.remove(obj);
    });
    canvas.renderAll();
    updateTexture();
  }, [updateTexture]);

  if (!completeUVMap) {
    return (
      <Card className="p-8 text-center">
        <Map className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          No UV map available
        </p>
        <p className="text-xs text-muted-foreground">
          Load a 3D model to extract UV maps
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Add Text
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Enter text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddText()}
            />
            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(v[0])}
                min={12}
                max={200}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>
            <Button onClick={handleAddText} className="w-full" size="sm" disabled={!isLoaded}>
              <Type className="h-4 w-4 mr-2" />
              Add Text
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Add Image
          </h3>
          <Input
            type="file"
            accept="image/*"
            onChange={handleAddImage}
            className="cursor-pointer"
            disabled={!isLoaded}
          />
        </div>

        {hasSelection && (
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold mb-3">Selected Object</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleDuplicate}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline" className="flex-1" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleClear} variant="outline" className="flex-1" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </Card>

      {/* Fabric.js Canvas */}
      <Card className="p-4">
        <div
          ref={canvasContainerRef}
          className="relative border rounded-md bg-gray-50 w-full flex items-center justify-center overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🎨 Drag, resize, rotate objects • Double-click text to edit • Real-time 3D preview
        </p>
      </Card>
    </div>
  );
}
