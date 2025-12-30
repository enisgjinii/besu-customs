"use client";
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
import { Sparkles } from "lucide-react";

export function Step08AIImages() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );

  // Improved background removal using flood-fill from corners
  // This provides much better edge detection than simple color matching
  const processImageWithTransparency = async (
    imageUrl: string,
  ): Promise<string> => {
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

        // Get pixel color at position
        const getPixel = (x: number, y: number) => {
          const i = (y * w + x) * 4;
          return [data[i], data[i + 1], data[i + 2], data[i + 3]];
        };

        // Set pixel alpha
        const setAlpha = (x: number, y: number, alpha: number) => {
          const i = (y * w + x) * 4;
          data[i + 3] = alpha;
        };

        // Color difference check
        const colorMatch = (c1: number[], c2: number[], tolerance: number) => {
          return (
            Math.abs(c1[0] - c2[0]) <= tolerance &&
            Math.abs(c1[1] - c2[1]) <= tolerance &&
            Math.abs(c1[2] - c2[2]) <= tolerance
          );
        };

        // Sample background colors from all 4 corners with edge averaging
        const corners = [
          getPixel(0, 0),
          getPixel(w - 1, 0),
          getPixel(0, h - 1),
          getPixel(w - 1, h - 1),
        ];

        // Add edge samples for better background detection
        const edgeSamples = [
          getPixel(Math.floor(w / 2), 0),
          getPixel(Math.floor(w / 2), h - 1),
          getPixel(0, Math.floor(h / 2)),
          getPixel(w - 1, Math.floor(h / 2)),
        ];

        // Combine corners and edges
        const allSamples = [...corners, ...edgeSamples];

        // Find the most common background color (mode)
        const colorKey = (c: number[]) => `${c[0]}_${c[1]}_${c[2]}`;
        const colorCounts = new Map<string, { color: number[]; count: number }>();

        for (const sample of allSamples) {
          const key = colorKey(sample);
          const existing = colorCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorCounts.set(key, { color: sample, count: 1 });
          }
        }

        // Use the most frequent corner color as background
        let bgColor = corners[0];
        let maxCount = 0;
        colorCounts.forEach((value) => {
          if (value.count > maxCount) {
            maxCount = value.count;
            bgColor = value.color;
          }
        });

        // Use flood-fill from corners to mark background pixels
        const visited = new Set<number>();
        const bgPixels = new Set<number>();
        const tolerance = 50; // Per-channel tolerance
        const stack: [number, number][] = [];

        // Start flood-fill from each corner
        const startPoints: [number, number][] = [
          [0, 0],
          [w - 1, 0],
          [0, h - 1],
          [w - 1, h - 1],
        ];

        for (const [sx, sy] of startPoints) {
          const startColor = getPixel(sx, sy);
          if (!colorMatch(startColor, bgColor, tolerance)) continue;

          stack.push([sx, sy]);

          while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            const idx = y * w + x;

            if (x < 0 || x >= w || y < 0 || y >= h) continue;
            if (visited.has(idx)) continue;
            visited.add(idx);

            const pixel = getPixel(x, y);
            if (!colorMatch(pixel, bgColor, tolerance)) continue;

            bgPixels.add(idx);

            // Add 4-connected neighbors
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
          }
        }

        // Apply transparency to background pixels with smooth edges
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;

            if (bgPixels.has(idx)) {
              // Check if this is an edge pixel (has non-bg neighbor)
              const isEdge = [
                [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
              ].some(([nx, ny]) => {
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) return false;
                return !bgPixels.has(ny * w + nx);
              });

              if (isEdge) {
                // Semi-transparent edge for anti-aliasing
                setAlpha(x, y, 64);
              } else {
                // Fully transparent background
                setAlpha(x, y, 0);
              }
            }
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">AI Generation</h2>
        <p className="text-sm text-muted-foreground">
          Create unique patterns and designs with AI
        </p>
      </div>

      <div className="p-1">
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Design Generator
            </h3>
          </div>
          <div className="p-4">
            <AIImageGenerator />
          </div>
        </div>
      </div>

      {/* Show AI layers with controls */}
      {aiLayers.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Generated Designs ({aiLayers.length})
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {aiLayers.map((layer) => (
              <div
                key={layer.id}
                className="group relative flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                  {layer.imageUrl ? (
                    <img
                      src={layer.imageUrl}
                      alt={layer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1">{layer.name}</p>
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <span className="truncate">AI Generated • High Quality</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <LayerControls layerId={layer.id} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
