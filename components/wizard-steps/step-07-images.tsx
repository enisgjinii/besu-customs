"use client";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import { useRef, useState } from "react";

// Helper to remove background from images
const removeBackground = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample background color from edges
      const getPixel = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        return [data[i], data[i + 1], data[i + 2]];
      };

      const samplePoints = [
        getPixel(0, 0),
        getPixel(w - 1, 0),
        getPixel(0, h - 1),
        getPixel(w - 1, h - 1),
        getPixel(Math.floor(w / 2), 0),
        getPixel(Math.floor(w / 2), h - 1),
        getPixel(0, Math.floor(h / 2)),
        getPixel(w - 1, Math.floor(h / 2)),
      ];

      const rBg = Math.round(
        samplePoints.reduce((s, c) => s + c[0], 0) / samplePoints.length,
      );
      const gBg = Math.round(
        samplePoints.reduce((s, c) => s + c[1], 0) / samplePoints.length,
      );
      const bBg = Math.round(
        samplePoints.reduce((s, c) => s + c[2], 0) / samplePoints.length,
      );

      const tolerance = 80;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const diff = Math.abs(r - rBg) + Math.abs(g - gBg) + Math.abs(b - bBg);

        if (diff < tolerance * 3) {
          const alpha = Math.min(
            255,
            Math.max(0, (diff / (tolerance * 3)) * 255),
          );
          data[i + 3] = alpha;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imageUrl);
  });
};

export function Step07Images() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );

  // Track if upload is in progress to prevent duplicate uploads
  const isUploadingRef = useRef(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent duplicate uploads
    if (isUploadingRef.current) return;

    const file = e.target.files?.[0];
    if (file) {
      isUploadingRef.current = true;

      const reader = new FileReader();
      reader.onload = async (event) => {
        let result = event.target?.result as string;

        // Auto remove background if enabled
        if (autoRemoveBg) {
          toast.info("Removing background...");
          result = await removeBackground(result);
        }

        if (isMobile()) {
          result = await compressImageForMobile(result, 1024, 0.85);
        }

        const newId = uuidv4();
        addTextureLayer({
          id: newId,
          name: file.name,
          type: "image",
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal",
          order: textureLayers.length,
          imageUrl: result,
          // Center of chest position for better initial placement
          position: [0.5, 0.35, 0],
          rotation: [0, 0, 0],
          scale: [0.35, 0.35, 1], // Larger initial size for easier adjustment
        });
        setSelectedTextureLayerId(newId);
        toast.success("Image added to center - drag to position");

        // Reset upload flag after a short delay
        setTimeout(() => {
          isUploadingRef.current = false;
        }, 500);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = "";
  };

  // Function to manually remove background from existing layer
  const handleRemoveBackground = async (layerId: string) => {
    const layer = textureLayers.find((l) => l.id === layerId);
    if (layer?.imageUrl) {
      toast.info("Removing background...");
      const processed = await removeBackground(layer.imageUrl);
      updateTextureLayer(layerId, { imageUrl: processed });
      toast.success("Background removed!");
    }
  };

  // Filter to only show non-text, non-AI images
  const layers = textureLayers.filter(
    (l) =>
      l.type === "image" &&
      !l.name.startsWith("Text:") &&
      !l.name.startsWith("AI"),
  );

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">Add Images</h2>
        <p className="text-xs text-muted-foreground">
          Upload custom images for your design
        </p>
      </div>

      {/* Auto Remove Background Toggle */}
      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">Auto Remove Background</span>
        </div>
        <button
          onClick={() => setAutoRemoveBg(!autoRemoveBg)}
          className={`w-10 h-5 rounded-full transition-colors ${autoRemoveBg ? "bg-primary" : "bg-muted"
            }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${autoRemoveBg ? "translate-x-5" : "translate-x-0.5"
              }`}
          />
        </button>
      </div>

      {/* Upload */}
      <Button variant="outline" className="w-full h-10 relative" asChild>
        <label className="cursor-pointer flex items-center justify-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="text-sm">Upload Image</span>
          <Input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
          />
        </label>
      </Button>

      {/* Layers with improved controls */}
      {layers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            Images ({layers.length}) - Tap to edit
          </span>
          <div className="max-h-[150px] overflow-y-auto space-y-1.5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="p-2 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {layer.imageUrl && (
                    <img
                      src={layer.imageUrl}
                      alt={layer.name}
                      className="w-8 h-8 object-contain rounded bg-muted/50"
                    />
                  )}
                  <span className="text-xs font-medium truncate flex-1">
                    {layer.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBackground(layer.id);
                    }}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Remove BG
                  </Button>
                </div>
                <LayerControls layerId={layer.id} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {layers.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No images added yet. Upload an image to get started.
        </p>
      )}
    </div>
  );
}
