"use client";

import { useEffect, useState, useRef } from "react";
import { Canvas, IText, Image as FabricImage } from "fabric";
import { useConfiguratorStore } from "@/lib/store";
import { Type, ImageIcon, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Vector3 } from "@babylonjs/core";

export function DecalEditor() {
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState("Arial");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addDecal = useConfiguratorStore((state) => state.addDecal);
  const clearDecals = useConfiguratorStore((state) => state.clearDecals);
  const setLastDecalTexture = useConfiguratorStore(
    (s) => s.setLastDecalTexture,
  );

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 256, // Reduced from 512
      height: 256, // Reduced from 512
      backgroundColor: "#ffffff",
      renderOnAddRemove: false, // Disable auto-render
    });

    fabricCanvasRef.current = fabricCanvas;

    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const addTextToCanvas = () => {
    if (!fabricCanvasRef.current || !newText.trim()) return;

    const text = new IText(newText, {
      left: 256,
      top: 256,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: fontFamily,
      originX: "center",
      originY: "center",
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    setNewText("");
  };

  const addImageToCanvas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      FabricImage.fromURL(imgUrl, {
        crossOrigin: "anonymous",
      }).then((img) => {
        if (!fabricCanvasRef.current) return;

        img.set({
          left: 256,
          top: 256,
          originX: "center",
          originY: "center",
        });

        // Scale image to fit canvas
        const maxSize = 200;
        const scale = Math.min(
          maxSize / (img.width || 1),
          maxSize / (img.height || 1),
        );
        img.scale(scale);

        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    activeObjects.forEach((obj) => fabricCanvasRef.current?.remove(obj));
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = "#ffffff";
    fabricCanvasRef.current.renderAll();
  };

  const applyDecalToModel = () => {
    if (!fabricCanvasRef.current) {
      console.warn("No canvas to create decal from");
      return;
    }

    // Export canvas as texture with reduced quality to prevent memory issues
    const textureUrl = fabricCanvasRef.current.toDataURL({
      format: "jpeg",
      quality: 0.8,
      multiplier: 2,
    });

    console.log("🎯 Creating decal from canvas texture");

    // Remember last texture for click-to-place
    setLastDecalTexture(textureUrl);

    // Create decal at default position (front of model)
    const decalData = {
      id: `decal-${Date.now()}`,
      textureUrl,
      position: new Vector3(0, 0, 1), // Front of model
      rotation: new Vector3(0, 0, 0), // Babylon uses Vector3 for rotation
      scale: new Vector3(0.5, 0.5, 0.5), // Adjust as needed
    };

    addDecal(decalData);
    console.log("✅ Decal added to model");
  };

  const downloadTexture = () => {
    if (!fabricCanvasRef.current) return;

    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: "jpeg",
      quality: 0.8,
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.download = "decal-texture.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Decal Designer</h3>
        <Button variant="outline" size="sm" onClick={clearDecals}>
          Clear All Decals
        </Button>
      </div>

      {/* Canvas */}
      <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
        <canvas ref={canvasRef} />
      </div>

      {/* Text Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTextToCanvas()}
          />
          <Button onClick={addTextToCanvas} size="icon">
            <Type className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Font Size</Label>
            <Slider
              value={[fontSize]}
              onValueChange={([val]) => setFontSize(val)}
              min={10}
              max={100}
              step={1}
            />
            <span className="text-sm text-gray-500">{fontSize}px</span>
          </div>
          <div>
            <Label>Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Font Family</Label>
          <select
            className="w-full px-3 py-2 border rounded"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
          </select>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={addImageToCanvas}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={deleteSelected} className="flex-1">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
        <Button variant="outline" onClick={clearCanvas} className="flex-1">
          Clear Canvas
        </Button>
      </div>

      {/* Apply Decal */}
      <Button onClick={applyDecalToModel} className="w-full" size="lg">
        Apply Decal to Model
      </Button>

      {/* Download */}
      <Button variant="outline" onClick={downloadTexture} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Download Texture
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Create text or add images, then click &quot;Apply Decal to Model&quot; to project
        onto your 3D model
      </p>
    </div>
  );
}
