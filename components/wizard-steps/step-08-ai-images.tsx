"use client";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { AITextureGenerator } from "@/components/ai-texture-generator";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { analyzeUvLayoutFromDataUrl } from "@/lib/uv-layout-analyzer";
import { generateTestPattern, visualizeTransformations, generateComparisonGrid } from "@/lib/uv-debug-helper";
import { loadImage } from "@/lib/texture-utils";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import * as THREE from "three";
import {
  Sparkles,
  Download,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
  const applyTextureToBack = useConfiguratorStore((state) => state.applyTextureToBack);
  const setApplyTextureToBack = useConfiguratorStore((state) => state.setApplyTextureToBack);
  const backTextureTransform = useConfiguratorStore((state) => state.backTextureTransform);
  const setBackTextureTransform = useConfiguratorStore((state) => state.setBackTextureTransform);
  const bakeBackFlipIntoTexture = useConfiguratorStore((state) => state.bakeBackFlipIntoTexture);
  const setBakeBackFlipIntoTexture = useConfiguratorStore((state) => state.setBakeBackFlipIntoTexture);
  const backUvSide = useConfiguratorStore((state) => state.backUvSide);
  const setBackUvSide = useConfiguratorStore((state) => state.setBackUvSide);

  const [showUVMap, setShowUVMap] = useState(false);
  const [isGeneratingDebug, setIsGeneratingDebug] = useState(false);
  const applyGenerationRef = useRef(0);
  const applyContextRef = useRef<{
    modelUrl: string | null;
    uvMap: string | null;
  }>({
    modelUrl: currentModelUrl ?? null,
    uvMap: completeUVMap ?? null,
  });

  useEffect(() => {
    applyContextRef.current = {
      modelUrl: currentModelUrl ?? null,
      uvMap: completeUVMap ?? null,
    };
    applyGenerationRef.current += 1;
  }, [currentModelUrl, completeUVMap]);

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

  const bakeBackFlipIntoUvTexture = useCallback(
    async (
      src: string,
      opts: {
        uvTemplateDataUrl: string;
        // The image already went through transformTexture(flipY: true)
        srcWasFlipY: boolean;
        backSide: "left" | "right";
        transform: "mirrorX" | "mirrorY" | "rotate180" | "none";
      },
    ) => {
      if (!src || !opts.uvTemplateDataUrl) return src;
      if (opts.transform === "none") return src;

      try {
        const analysis = await analyzeUvLayoutFromDataUrl(opts.uvTemplateDataUrl, {
          maxSize: 384,
          threshold: 215,
          dilationPasses: 1,
          minComponentPixels: 35,
          maxIslands: 28,
        });

        const islands = analysis?.islands ?? [];
        const torsoCandidates = islands
          .filter((i) => i.cy < 0.6)
          .filter((i) => (opts.backSide === "left" ? i.cx < 0.5 : i.cx > 0.5))
          .sort((a, b) => b.w * b.h - a.w * a.h);

        const backIsland = torsoCandidates[0];
        if (!backIsland) return src;

        // If src image was flipped vertically already, map UV-template bounds to src bounds.
        const bounds = {
          x1: backIsland.x1,
          y1: opts.srcWasFlipY ? 1 - backIsland.y2 : backIsland.y1,
          x2: backIsland.x2,
          y2: opts.srcWasFlipY ? 1 - backIsland.y1 : backIsland.y2,
        };

        // IMPORTANT: Some UV wireframes connect the left/right torso outlines into one cluster,
        // producing a bounding box that spans both sides. When baking we must never touch the
        // front side, so we hard-clip to the chosen half.
        const halfX1 = opts.backSide === "left" ? 0 : 0.5;
        const halfX2 = opts.backSide === "left" ? 0.5 : 1;
        bounds.x1 = Math.max(bounds.x1, halfX1);
        bounds.x2 = Math.min(bounds.x2, halfX2);

        // Also clamp to a reasonable torso band (avoid shorts/other pieces).
        bounds.y1 = Math.max(0, Math.min(1, bounds.y1));
        bounds.y2 = Math.max(0, Math.min(1, bounds.y2));

        if (bounds.x2 - bounds.x1 < 0.02 || bounds.y2 - bounds.y1 < 0.02) {
          return src;
        }

        return await new Promise<string>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              if (!w || !h) {
                resolve(src);
                return;
              }

              const x = Math.max(0, Math.floor(bounds.x1 * w));
              const y = Math.max(0, Math.floor(bounds.y1 * h));
              const rw = Math.max(1, Math.floor((bounds.x2 - bounds.x1) * w));
              const rh = Math.max(1, Math.floor((bounds.y2 - bounds.y1) * h));

              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(src);
                return;
              }

              // Draw original
              ctx.drawImage(img, 0, 0, w, h);

              // Extract region
              const region = document.createElement("canvas");
              region.width = rw;
              region.height = rh;
              const rctx = region.getContext("2d");
              if (!rctx) {
                resolve(src);
                return;
              }
              rctx.drawImage(canvas, x, y, rw, rh, 0, 0, rw, rh);

              // Clear original region
              ctx.clearRect(x, y, rw, rh);

              // Draw transformed region back
              ctx.save();
              ctx.translate(x, y);

              switch (opts.transform) {
                case "mirrorY": {
                  // Vertical flip
                  ctx.translate(0, rh);
                  ctx.scale(1, -1);
                  break;
                }
                case "rotate180": {
                  ctx.translate(rw, rh);
                  ctx.scale(-1, -1);
                  break;
                }
                case "mirrorX":
                default: {
                  // Horizontal mirror
                  ctx.translate(rw, 0);
                  ctx.scale(-1, 1);
                  break;
                }
              }

              ctx.drawImage(region, 0, 0, rw, rh);
              ctx.restore();

              resolve(canvas.toDataURL("image/png"));
            } catch (e) {
              console.warn("Failed to bake back flip into texture", e);
              resolve(src);
            }
          };
          img.onerror = () => resolve(src);
          img.src = src;
        });
      } catch (e) {
        console.warn("Failed to analyze UV layout for baking", e);
        return src;
      }
    },
    [],
  );

  /**
   * Bake a horizontal flip into the FRONT panel UV region.
   * This corrects models whose front UVs are horizontally mirrored.
   */
  const bakeFrontFlipIntoUvTexture = useCallback(
    async (
      src: string,
      opts: {
        uvTemplateDataUrl: string;
        srcWasFlipY: boolean;
        frontSide: "left" | "right";
        transform?: "mirrorX" | "mirrorY" | "rotate180" | "none";
      },
    ) => {
      if (!src || !opts.uvTemplateDataUrl) return src;
      if (opts.transform === "none") return src;

      try {
        const analysis = await analyzeUvLayoutFromDataUrl(opts.uvTemplateDataUrl, {
          maxSize: 384,
          threshold: 215,
          dilationPasses: 1,
          minComponentPixels: 35,
          maxIslands: 28,
        });

        const islands = analysis?.islands ?? [];
        // Find top-left or top-right torso island (front panel)
        const torsoCandidates = islands
          .filter((i) => i.cy < 0.6)
          .filter((i) => (opts.frontSide === "left" ? i.cx < 0.5 : i.cx > 0.5))
          .sort((a, b) => b.w * b.h - a.w * a.h);

        const frontIsland = torsoCandidates[0];
        if (!frontIsland) return src;

        // Map bounds
        const bounds = {
          x1: frontIsland.x1,
          y1: opts.srcWasFlipY ? 1 - frontIsland.y2 : frontIsland.y1,
          x2: frontIsland.x2,
          y2: opts.srcWasFlipY ? 1 - frontIsland.y1 : frontIsland.y2,
        };

        // Clip to chosen half
        const halfX1 = opts.frontSide === "left" ? 0 : 0.5;
        const halfX2 = opts.frontSide === "left" ? 0.5 : 1;
        bounds.x1 = Math.max(bounds.x1, halfX1);
        bounds.x2 = Math.min(bounds.x2, halfX2);
        bounds.y1 = Math.max(0, Math.min(1, bounds.y1));
        bounds.y2 = Math.max(0, Math.min(1, bounds.y2));

        if (bounds.x2 - bounds.x1 < 0.02 || bounds.y2 - bounds.y1 < 0.02) {
          return src;
        }

        return await new Promise<string>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              if (!w || !h) {
                resolve(src);
                return;
              }

              const x = Math.max(0, Math.floor(bounds.x1 * w));
              const y = Math.max(0, Math.floor(bounds.y1 * h));
              const rw = Math.max(1, Math.floor((bounds.x2 - bounds.x1) * w));
              const rh = Math.max(1, Math.floor((bounds.y2 - bounds.y1) * h));

              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(src);
                return;
              }

              // Draw original
              ctx.drawImage(img, 0, 0, w, h);

              // Extract region
              const region = document.createElement("canvas");
              region.width = rw;
              region.height = rh;
              const rctx = region.getContext("2d");
              if (!rctx) {
                resolve(src);
                return;
              }
              rctx.drawImage(canvas, x, y, rw, rh, 0, 0, rw, rh);

              // Clear original region
              ctx.clearRect(x, y, rw, rh);

              // Draw transformed region back
              ctx.save();
              ctx.translate(x, y);

              switch (opts.transform ?? "mirrorX") {
                case "mirrorY": {
                  ctx.translate(0, rh);
                  ctx.scale(1, -1);
                  break;
                }
                case "rotate180": {
                  ctx.translate(rw, rh);
                  ctx.scale(-1, -1);
                  break;
                }
                case "mirrorX":
                default: {
                  ctx.translate(rw, 0);
                  ctx.scale(-1, 1);
                  break;
                }
              }

              ctx.drawImage(region, 0, 0, rw, rh);
              ctx.restore();

              resolve(canvas.toDataURL("image/png"));
            } catch (e) {
              console.warn("Failed to bake front flip into texture", e);
              resolve(src);
            }
          };
          img.onerror = () => resolve(src);
          img.src = src;
        });
      } catch (e) {
        console.warn("Failed to analyze UV layout for front baking", e);
        return src;
      }
    },
    [],
  );

  /**
   * Bake a flip into an arbitrary region defined by UV bounds.
   */
  const bakeRegionFlipIntoUvTexture = useCallback(
    async (
      src: string,
      opts: {
        bounds: { x1: number; y1: number; x2: number; y2: number };
        srcWasFlipY: boolean;
        transform: "mirrorX" | "mirrorY" | "rotate180" | "none";
      },
    ) => {
      if (!src || opts.transform === "none") return src;

      const bounds = {
        x1: opts.bounds.x1,
        y1: opts.srcWasFlipY ? 1 - opts.bounds.y2 : opts.bounds.y1,
        x2: opts.bounds.x2,
        y2: opts.srcWasFlipY ? 1 - opts.bounds.y1 : opts.bounds.y2,
      };

      bounds.x1 = Math.max(0, Math.min(1, bounds.x1));
      bounds.y1 = Math.max(0, Math.min(1, bounds.y1));
      bounds.x2 = Math.max(0, Math.min(1, bounds.x2));
      bounds.y2 = Math.max(0, Math.min(1, bounds.y2));

      if (bounds.x2 - bounds.x1 < 0.02 || bounds.y2 - bounds.y1 < 0.02) {
        return src;
      }

      return await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            if (!w || !h) {
              resolve(src);
              return;
            }

            const x = Math.max(0, Math.floor(bounds.x1 * w));
            const y = Math.max(0, Math.floor(bounds.y1 * h));
            const rw = Math.max(1, Math.floor((bounds.x2 - bounds.x1) * w));
            const rh = Math.max(1, Math.floor((bounds.y2 - bounds.y1) * h));

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(src);
              return;
            }

            ctx.drawImage(img, 0, 0, w, h);

            const region = document.createElement("canvas");
            region.width = rw;
            region.height = rh;
            const rctx = region.getContext("2d");
            if (!rctx) {
              resolve(src);
              return;
            }

            rctx.drawImage(canvas, x, y, rw, rh, 0, 0, rw, rh);
            ctx.clearRect(x, y, rw, rh);

            ctx.save();
            ctx.translate(x, y);

            switch (opts.transform) {
              case "mirrorY": {
                ctx.translate(0, rh);
                ctx.scale(1, -1);
                break;
              }
              case "rotate180": {
                ctx.translate(rw, rh);
                ctx.scale(-1, -1);
                break;
              }
              case "mirrorX":
              default: {
                ctx.translate(rw, 0);
                ctx.scale(-1, 1);
                break;
              }
            }

            ctx.drawImage(region, 0, 0, rw, rh);
            ctx.restore();

            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            console.warn("Failed to bake region flip into texture", e);
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      });
    },
    [],
  );

  const detectTorsoSides = useCallback(
    async (
      uvTemplateDataUrl: string | null,
      fallbackBackSide: "left" | "right",
    ): Promise<{ frontSide: "left" | "right"; backSide: "left" | "right" }> => {
      const fallback: { frontSide: "left" | "right"; backSide: "left" | "right" } = {
        frontSide: fallbackBackSide === "right" ? "left" : "right",
        backSide: fallbackBackSide,
      };

      if (!uvTemplateDataUrl) return fallback;

      try {
        const analysis = await analyzeUvLayoutFromDataUrl(uvTemplateDataUrl, {
          maxSize: 384,
          threshold: 215,
          dilationPasses: 1,
          minComponentPixels: 35,
          maxIslands: 28,
        });

        const islands = analysis?.islands ?? [];
        const torsoIslands = islands.filter((i) => i.cy < 0.6);

        const leftArea = torsoIslands
          .filter((i) => i.cx < 0.5)
          .reduce((sum, i) => sum + i.w * i.h, 0);
        const rightArea = torsoIslands
          .filter((i) => i.cx >= 0.5)
          .reduce((sum, i) => sum + i.w * i.h, 0);

        if (leftArea <= 0 && rightArea <= 0) return fallback;

        const areaRatio = rightArea > 0 ? leftArea / rightArea : 0;
        if (areaRatio > 0.83 && areaRatio < 1.2) {
          return fallback;
        }

        const backSide: "left" | "right" = rightArea >= leftArea ? "right" : "left";
        const frontSide: "left" | "right" = backSide === "right" ? "left" : "right";
        return { backSide, frontSide };
      } catch (e) {
        return fallback;
      }
    },
    [],
  );

  // Handle new AI Texture Generator result
  const handleGeneratedTexture = useCallback(async (
    texture: THREE.Texture,
    url: string,
    options?: { normalMapUrl?: string | null; roughnessMapUrl?: string | null }
  ) => {
    const requestApplyId = applyGenerationRef.current;
    const requestModelUrl = currentModelUrl ?? null;
    const requestUvMap = completeUVMap ?? null;
    const isCurrentApplyContext = () => {
      const latest = applyContextRef.current;
      return (
        requestApplyId === applyGenerationRef.current &&
        latest.modelUrl === requestModelUrl &&
        latest.uvMap === requestUvMap
      );
    };

    if (!isCurrentApplyContext()) {
      console.warn("Skipping stale AI texture apply");
      return;
    }
    const finalPatternUrl = url;
    const normalMapUrl = options?.normalMapUrl ?? null;
    const roughnessMapUrl = options?.roughnessMapUrl ?? null;

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
      imageUrl: finalPatternUrl,
      position: [0.5, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      flipX: false,
    });

    // Apply PBR maps if provided
    if (normalMapUrl) {
      useConfiguratorStore.getState().setGlobalNormalMap(normalMapUrl);
    } else {
      useConfiguratorStore.getState().setGlobalNormalMap(null);
    }

    if (roughnessMapUrl) {
      useConfiguratorStore.getState().setGlobalRoughnessMap(roughnessMapUrl);
    } else {
      useConfiguratorStore.getState().setGlobalRoughnessMap(null);
    }

    setSelectedTextureLayerId(newId);
    toast.success("AI Pattern added successfully!");
  }, [
    addTextureLayer,
    textureLayers.length,
    setSelectedTextureLayerId,
    completeUVMap,
    currentModelUrl,
  ]);

  const handleGenerateTestPattern = async () => {
    if (!completeUVMap) {
      toast.error("No UV map available for test pattern");
      return;
    }

    setIsGeneratingDebug(true);
    try {
      const pattern = await generateTestPattern(completeUVMap, {
        width: 2048,
        height: 2048,
        showGrid: true,
        showLabels: true,
        showUvWireframe: true,
      });

      const newId = uuidv4();
      addTextureLayer({
        id: newId,
        name: "🔧 Debug Test Pattern",
        type: "pattern",
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        order: textureLayers.length,
        imageUrl: pattern.url,
        position: [0.5, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        flipX: false,
      });

      setSelectedTextureLayerId(newId);
      toast.success("Test pattern applied! Check directional markers.");
    } catch (error) {
      console.error("Failed to generate test pattern", error);
      toast.error("Failed to generate test pattern");
    } finally {
      setIsGeneratingDebug(false);
    }
  };

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
    <div className="space-y-4">
      <section className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight">AI Design</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose one way to create your design, then fine-tune it from the
              saved layers below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              {completeUVMap ? "UV guide ready" : "Preparing UV guide"}
            </div>
            <div className="rounded-full border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              {aiLayers.length} saved
            </div>
          </div>
        </div>

        <details className="group mt-4 rounded-xl border bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-medium text-foreground">
            <span>Optional tools</span>
            <span className="text-muted-foreground transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>

          <div className="space-y-4 border-t px-3 py-3">
            {completeUVMap ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">UV reference</p>
                    <p className="text-[10px] text-muted-foreground">
                      Use this if you want to inspect placement before generating.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setShowUVMap((prev) => !prev)}
                    >
                      {showUVMap ? "Hide" : "Preview"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={handleDownloadUVMap}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>

                {showUVMap && (
                  <div className="overflow-hidden rounded-xl border bg-background">
                    <img
                      src={completeUVMap}
                      alt="UV Map"
                      className="max-h-[160px] w-full object-contain"
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={handleGenerateTestPattern}
                  disabled={isGeneratingDebug}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  {isGeneratingDebug ? "Creating test grid..." : "Generate test grid"}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed px-3 py-3 text-[10px] text-muted-foreground">
                UV tools will appear after the current product finishes loading.
              </div>
            )}

            <div className="space-y-3 rounded-xl border bg-background px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="back-texture" className="text-xs font-medium">
                    Apply generated texture to the back
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Turn this on only when you want the AI texture mirrored onto
                    the rear panel.
                  </p>
                </div>
                <Switch
                  id="back-texture"
                  checked={applyTextureToBack}
                  onCheckedChange={setApplyTextureToBack}
                  className="scale-75 origin-right"
                />
              </div>

              {applyTextureToBack && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">
                      Back transform
                    </Label>
                    <Select
                      value={backTextureTransform}
                      onValueChange={(value) =>
                        setBackTextureTransform(
                          value as "mirrorX" | "mirrorY" | "rotate180" | "none",
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mirrorX">Mirror left/right</SelectItem>
                        <SelectItem value="mirrorY">Flip up/down</SelectItem>
                        <SelectItem value="rotate180">Rotate 180</SelectItem>
                        <SelectItem value="none">No transform</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">
                      Back UV side
                    </Label>
                    <Select
                      value={backUvSide}
                      onValueChange={(value) => setBackUvSide(value as "left" | "right")}
                      disabled={!bakeBackFlipIntoTexture}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                <div>
                  <Label htmlFor="bake-back-fix" className="text-xs font-medium">
                    Bake UV correction into texture
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Helps when the back panel is flipped on certain models.
                  </p>
                </div>
                <Switch
                  id="bake-back-fix"
                  checked={bakeBackFlipIntoTexture}
                  onCheckedChange={setBakeBackFlipIntoTexture}
                  disabled={!applyTextureToBack}
                  className="scale-75 origin-right"
                />
              </div>
            </div>
          </div>
        </details>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Full garment texture</h3>
            <p className="text-xs text-muted-foreground">
              Generate a complete texture that follows the current UV layout.
            </p>
          </div>
        </div>
        <AITextureGenerator onTextureGenerated={handleGeneratedTexture} />
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Placed graphic</h3>
            <p className="text-xs text-muted-foreground">
              Generate a single image, review it, then place it on the design.
            </p>
          </div>
        </div>
        <AIImageGenerator />
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Saved AI layers</h3>
            <p className="text-xs text-muted-foreground">
              Select a layer to adjust it or reorder it with the layer controls.
            </p>
          </div>
          <div className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {aiLayers.length}
          </div>
        </div>

        {aiLayers.length > 0 ? (
          <div className="space-y-2">
            {aiLayers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors hover:border-primary/40"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setSelectedTextureLayerId(layer.id)}
                >
                  <div className="h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                    {layer.imageUrl && (
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{layer.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Click to edit this layer
                    </p>
                  </div>
                </button>

                <LayerControls layerId={layer.id} compact />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center">
            <p className="text-xs font-medium">No AI layers yet</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Generate a texture or graphic above and it will show up here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
