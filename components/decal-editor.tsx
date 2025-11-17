"use client";

import { useState, useRef } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Type, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DecalEditor() {
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(60);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setLastDecalTexture = useConfiguratorStore(
    (s) => s.setLastDecalTexture,
  );

  // Generate text as PNG data URL
  const createTextDecal = () => {
    if (!newText.trim()) return;

    // Create canvas to render text
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear with transparency
    ctx.clearRect(0, 0, 1024, 1024);

    // Draw text with better quality
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize * 2}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Add text shadow for better visibility
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(newText, 512, 512);

    const dataUrl = canvas.toDataURL("image/png");
    console.log("🎯 Text decal ready: click on model to place");
    setLastDecalTexture(dataUrl);
    setNewText("");
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      console.log("🎯 Image decal ready: click on model to place");
      setLastDecalTexture(imgUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">Add Text or Image</h3>
        <p className="text-sm text-muted-foreground">
          Create a decal and click on the 3D model to place it
        </p>
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTextDecal()}
            className="flex-1"
          />
          <Button
            onClick={createTextDecal}
            size="lg"
            disabled={!newText.trim()}
          >
            <Type className="h-5 w-5 mr-2" />
            Add Text
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Font Size: {fontSize}px</Label>
            <Input
              type="range"
              min="20"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <Label>Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Or upload an image</p>
      </div>

      {/* Image Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-5 w-5 mr-2" />
          Upload Image
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4 border-t">
        💡 After clicking "Add Text" or "Upload Image", click anywhere on the 3D
        model to place your decal
      </p>
    </div>
  );
}
