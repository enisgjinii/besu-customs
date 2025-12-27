"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";

export function Step08AIImages() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );

  // Helper to remove background (improved multi-corner detection)
  const processImageWithTransparency = async (
    imageUrl: string,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
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

        // Sample background color from all 4 corners and edges
        const getPixel = (x: number, y: number) => {
          const i = (y * w + x) * 4;
          return [data[i], data[i + 1], data[i + 2]];
        };

        // Sample more points for better background detection
        const samplePoints = [
          getPixel(0, 0), // top-left
          getPixel(w - 1, 0), // top-right
          getPixel(0, h - 1), // bottom-left
          getPixel(w - 1, h - 1), // bottom-right
          getPixel(Math.floor(w / 2), 0), // top-center
          getPixel(Math.floor(w / 2), h - 1), // bottom-center
          getPixel(0, Math.floor(h / 2)), // left-center
          getPixel(w - 1, Math.floor(h / 2)), // right-center
        ];

        // Average the sample colors
        const rBg = Math.round(samplePoints.reduce((s, c) => s + c[0], 0) / samplePoints.length);
        const gBg = Math.round(samplePoints.reduce((s, c) => s + c[1], 0) / samplePoints.length);
        const bBg = Math.round(samplePoints.reduce((s, c) => s + c[2], 0) / samplePoints.length);

        // Higher tolerance for better background removal
        const tolerance = 80;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const diff =
            Math.abs(r - rBg) + Math.abs(g - gBg) + Math.abs(b - bBg);

          if (diff < tolerance * 3) {
            // Gradual transparency based on how close to background
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

  // Listen for generated images from the AIImageGenerator component
  // Only adds when user explicitly clicks "Apply to Design"
  useEffect(() => {
    const handleGeneratedImage = async (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("AI Image Event captured in wizard", customEvent.detail);

      const data = customEvent.detail;
      if (!data || !data.url) return;

      toast.info("Processing image...");

      try {
        let processedUrl = await processImageWithTransparency(data.url);

        // Compress images on mobile for better performance
        if (isMobile()) {
          processedUrl = await compressImageForMobile(processedUrl, 1024, 0.85);
        }

        // Use scale and rotation from the preview if provided
        const scale = data.scale || 0.5;
        const rotation = data.rotation || 0;

        const newId = uuidv4();
        addTextureLayer({
          id: newId,
          name: `AI Design`,
          type: "image",
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal",
          order: textureLayers.length,
          imageUrl: processedUrl,
          position: [0.5, 0.35, 0], // Center chest position
          rotation: [0, 0, rotation * (Math.PI / 180)],
          scale: [scale, scale, 1],
          flipX: false,
        });
        
        setSelectedTextureLayerId(newId);
        toast.success("AI Image added! Adjust size and position as needed.");
      } catch (err) {
        console.error("Failed to process image", err);
        toast.error("Failed to process image");
      }
    };

    window.addEventListener("generated-image-available", handleGeneratedImage);
    return () => {
      window.removeEventListener(
        "generated-image-available",
        handleGeneratedImage,
      );
    };
  }, [addTextureLayer, textureLayers.length, setSelectedTextureLayerId]);

  // Get AI-generated layers
  const aiLayers = textureLayers.filter((l) => l.name.startsWith("AI"));

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Generate with AI</h2>
        <p className="text-xs text-muted-foreground">
          Create unique designs. Preview before applying.
        </p>
      </div>

      <div className="border rounded-lg p-3 bg-muted/10">
        <AIImageGenerator />
      </div>

      {/* Show AI layers with controls */}
      {aiLayers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            AI Designs ({aiLayers.length})
          </span>
          <div className="max-h-[100px] overflow-y-auto space-y-1.5">
            {aiLayers.map((layer) => (
              <div 
                key={layer.id} 
                className="p-2 rounded-lg border bg-card"
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
                  <span className="text-xs font-medium truncate flex-1">{layer.name}</span>
                </div>
                <LayerControls layerId={layer.id} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
