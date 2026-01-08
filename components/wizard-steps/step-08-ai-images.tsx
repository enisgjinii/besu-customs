"use client";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { AITextureGenerator } from "@/components/ai-texture-generator";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import * as THREE from "three";
import {
  Sparkles,
  Map,
  Download,
  Eye,
  EyeOff,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// AI Provider types
// Removed as we strictly use Runware now

export function Step08AIImages() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);

  const [showUVMap, setShowUVMap] = useState(true);

  const transformTexture = useCallback(
    async (
      src: string,
      options: { flipX?: boolean; flipY?: boolean; rotateDegrees?: number } = {
        flipY: true,
      },
    ) => {
      if (!src) return src;
      const {
        flipX = false,
        flipY = true,
        rotateDegrees = 0,
      } = options;
      const normalizedRotation = ((rotateDegrees % 360) + 360) % 360;
      if (!flipX && !flipY && normalizedRotation === 0) return src;

      return new Promise<string>((resolve) => {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const baseWidth = img.naturalWidth || img.width;
              const baseHeight = img.naturalHeight || img.height;
              if (!baseWidth || !baseHeight) {
                resolve(src);
                return;
              }

              const needsSwap = normalizedRotation === 90 || normalizedRotation === 270;
              const canvas = document.createElement("canvas");
              canvas.width = needsSwap ? baseHeight : baseWidth;
              canvas.height = needsSwap ? baseWidth : baseHeight;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(src);
                return;
              }

              ctx.translate(canvas.width / 2, canvas.height / 2);
              if (normalizedRotation !== 0) {
                ctx.rotate((normalizedRotation * Math.PI) / 180);
              }
              ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
              ctx.drawImage(
                img,
                -baseWidth / 2,
                -baseHeight / 2,
                baseWidth,
                baseHeight,
              );
              resolve(canvas.toDataURL("image/png"));
            } catch (error) {
              console.warn("Failed to transform texture", error);
              resolve(src);
            }
          };
          img.onerror = () => resolve(src);
          img.src = src;
        } catch (err) {
          console.warn("Failed to prep texture transform", err);
          resolve(src);
        }
      });
    },
    [],
  );

  // Handle new AI Texture Generator result
  const handleGeneratedTexture = useCallback(async (
    texture: THREE.Texture,
    url: string,
    options?: { normalMapUrl?: string | null; roughnessMapUrl?: string | null }
  ) => {
    const transformedPatternUrl = await transformTexture(url, {
      flipY: true,
    });
    const flippedNormalUrl = options?.normalMapUrl
      ? await transformTexture(options.normalMapUrl, {
        flipY: true,
      })
      : null;
    const flippedRoughnessUrl = options?.roughnessMapUrl
      ? await transformTexture(options.roughnessMapUrl, {
        flipY: true,
      })
      : null;

    const newId = uuidv4();
    addTextureLayer({
      id: newId,
      name: "AI Advanced Pattern",
      type: "pattern",
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      order: textureLayers.length,
      imageUrl: transformedPatternUrl,
      position: [0.5, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      flipX: false,
    });

    // Apply PBR maps if provided
    if (flippedNormalUrl) {
      useConfiguratorStore.getState().setGlobalNormalMap(flippedNormalUrl);
    } else {
      useConfiguratorStore.getState().setGlobalNormalMap(null);
    }

    if (flippedRoughnessUrl) {
      useConfiguratorStore.getState().setGlobalRoughnessMap(flippedRoughnessUrl);
    } else {
      useConfiguratorStore.getState().setGlobalRoughnessMap(null);
    }

    setSelectedTextureLayerId(newId);
    toast.success("AI Pattern added successfully!");
  }, [addTextureLayer, textureLayers.length, transformTexture, setSelectedTextureLayerId]);

  // Listen for generated images from the AIImageGenerator component
  // Background is already removed by the advanced AI in the generator
  useEffect(() => {
    const handleGeneratedImage = async (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("AI Image Event captured in wizard", customEvent.detail);

      const data = customEvent.detail;
      if (!data || !data.url) return;

      try {
        let processedUrl = data.url;

        // Compress images on mobile for better performance
        if (isMobile()) {
          toast.info("Optimizing for mobile...");
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

  const handleDownloadUVMap = () => {
    if (!completeUVMap) {
      toast.error("No UV map available");
      return;
    }

    const link = document.createElement("a");
    link.href = completeUVMap;
    link.download = `uv-map-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("UV map downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">AI Generation</h2>
        <p className="text-sm text-muted-foreground">
          Create unique patterns and designs with AI
        </p>
      </div>

      {/* UV Map Reference Section */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Map className="w-4 h-4 text-indigo-500" />
            UV Map Reference
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowUVMap(!showUVMap)}
            >
              {showUVMap ? (
                <EyeOff className="w-3 h-3 mr-1" />
              ) : (
                <Eye className="w-3 h-3 mr-1" />
              )}
              {showUVMap ? "Hide" : "Show"}
            </Button>
            {completeUVMap && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDownloadUVMap}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>

        {showUVMap && (
          <div className="p-4">
            {completeUVMap ? (
              <div className="space-y-3">
                <div className="relative rounded-lg border bg-muted/20 overflow-hidden">
                  <img
                    src={completeUVMap}
                    alt="UV Map"
                    className="w-full max-h-[200px] object-contain"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                    UV Map Template
                  </div>
                </div>

                {/* AI Generate on UV Section (New Component) */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-3">
                    <Wand2 className="w-3.5 h-3.5" />
                    AI Advanced Texture Generator
                  </h4>
                  <AITextureGenerator
                    onTextureGenerated={handleGeneratedTexture}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Map className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No UV map available</p>
                <p className="text-xs mt-1">
                  Select a 3D model first to extract its UV map
                </p>
              </div>
            )}
          </div>
        )}
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
                  <p className="text-sm font-medium truncate mb-1">
                    {layer.name}
                  </p>
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <span className="truncate">
                      AI Generated • High Quality
                    </span>
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
