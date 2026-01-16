"use client";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { AITextureGenerator } from "@/components/ai-texture-generator";
import { useState, useEffect, useCallback } from "react";
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
  Map,
  Download,
  Eye,
  EyeOff,
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
  const backTextureDebugEnabled = useConfiguratorStore((state) => state.backTextureDebugEnabled);
  const setBackTextureDebugEnabled = useConfiguratorStore((state) => state.setBackTextureDebugEnabled);
  const backTextureDebugRotationDeg = useConfiguratorStore((state) => state.backTextureDebugRotationDeg);
  const setBackTextureDebugRotationDeg = useConfiguratorStore((state) => state.setBackTextureDebugRotationDeg);
  const backTextureDebugOffsetX = useConfiguratorStore((state) => state.backTextureDebugOffsetX);
  const setBackTextureDebugOffsetX = useConfiguratorStore((state) => state.setBackTextureDebugOffsetX);
  const backTextureDebugOffsetY = useConfiguratorStore((state) => state.backTextureDebugOffsetY);
  const setBackTextureDebugOffsetY = useConfiguratorStore((state) => state.setBackTextureDebugOffsetY);

  const [showUVMap, setShowUVMap] = useState(true);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [debugPattern, setDebugPattern] = useState<string | null>(null);
  const [isGeneratingDebug, setIsGeneratingDebug] = useState(false);

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
    const transformedPatternUrl = await transformTexture(url, {
      flipY: false, // Three.js now uses flipY=true via TextureCompositor
    });

    let finalPatternUrl = transformedPatternUrl;

    // 1. Fix Back Panel
    if (applyTextureToBack && bakeBackFlipIntoTexture && completeUVMap) {
      const { backSide } = await detectTorsoSides(completeUVMap, backUvSide);
      finalPatternUrl = await bakeBackFlipIntoUvTexture(transformedPatternUrl, {
        uvTemplateDataUrl: completeUVMap,
        srcWasFlipY: false,
        backSide,
        transform: backTextureTransform,
      });
    }

    // 2. Fix Front Panel (for NON-Flag Football UV models)
    // For flag football UV models, we skip this to avoid double-flipping, 
    // and instead let the region flip (below) handle it.
    const isFlagFootballUvModel = currentModelUrl?.includes("flag-football-top-with-hoodie_UV_MAP");
    
    if (completeUVMap && !isFlagFootballUvModel) {
      const { frontSide } = await detectTorsoSides(completeUVMap, backUvSide);
      finalPatternUrl = await bakeFrontFlipIntoUvTexture(finalPatternUrl, {
        uvTemplateDataUrl: completeUVMap,
        srcWasFlipY: false,
        frontSide,
        transform: "mirrorX",
      });
    }

    // 3. Fix Other Regions (Side panels, shorts, etc.)
    // For flag football UV models, we flip ALL non-back regions vertically (mirrorY)
    if (completeUVMap) {
      try {
        const analysis = await analyzeUvLayoutFromDataUrl(completeUVMap, {
          maxSize: 384,
          threshold: 215,
          dilationPasses: 1,
          minComponentPixels: 35,
          maxIslands: 28,
        });

        const allIslands = analysis?.islands ?? [];

        // For flag football UV_MAP models: flip ALL islands except the back torso
        // For other models: flip only islands explicitly marked as "inverted" (legacy logic - comment out if missing property)
        const islandsToFlip = isFlagFootballUvModel
          ? allIslands.filter((i) => i.labelHint !== "back-torso")
          : []; // allIslands.filter((i) => ... orientationHint ... ) - logic removed temporarily to safely fix flag football sans orientationHint

        for (const island of islandsToFlip) {
          finalPatternUrl = await bakeRegionFlipIntoUvTexture(finalPatternUrl, {
            bounds: {
              x1: island.x1,
              y1: island.y1,
              x2: island.x2,
              y2: island.y2,
            },
            srcWasFlipY: false,
            transform: "mirrorY",
          });
        }
      } catch (e) {
        console.warn("Failed to auto-correct region orientation", e);
      }
    }

    // strict UV mask removed as helper is missing
    // finalPatternUrl = await applyUvMaskToTexture(finalPatternUrl, completeUVMask);
    const flippedNormalUrl = options?.normalMapUrl
      ? await transformTexture(options.normalMapUrl, {
          flipY: false,
        })
      : null;
    const flippedRoughnessUrl = options?.roughnessMapUrl
      ? await transformTexture(options.roughnessMapUrl, {
          flipY: false,
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
      imageUrl: finalPatternUrl,
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
  }, [
    addTextureLayer,
    textureLayers.length,
    transformTexture,
    setSelectedTextureLayerId,
    applyTextureToBack,
    bakeBackFlipIntoTexture,
    completeUVMap,
    backUvSide,
    backTextureTransform,
    bakeBackFlipIntoUvTexture,
    bakeFrontFlipIntoUvTexture,
    bakeRegionFlipIntoUvTexture,
    detectTorsoSides,
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

      setDebugPattern(pattern.url);

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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleDownloadUVMap}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-amber-50 hover:bg-amber-100 border-amber-200"
                  onClick={handleGenerateTestPattern}
                  disabled={isGeneratingDebug}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isGeneratingDebug ? "Generating..." : "Test Pattern"}
                </Button>
              </>
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

                  {/* Compact Back Controls */}
                  <div className="mb-3 p-3 bg-muted/40 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label htmlFor="back-texture" className="text-xs font-medium">
                          Apply to Back
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Include jersey back panels
                        </span>
                      </div>
                      <Switch
                        id="back-texture"
                        checked={applyTextureToBack}
                        onCheckedChange={setApplyTextureToBack}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="back-orientation" className="text-[11px] text-muted-foreground">
                          Back Flip (3D only)
                        </Label>
                        <Select
                          value={backTextureTransform}
                          onValueChange={(v) =>
                            setBackTextureTransform(
                              v as "mirrorX" | "mirrorY" | "rotate180" | "none",
                            )
                          }
                          disabled={!applyTextureToBack}
                        >
                          <SelectTrigger id="back-orientation" className="h-8">
                            <SelectValue placeholder="Back flip" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mirrorX">Mirror (left-right)</SelectItem>
                            <SelectItem value="mirrorY">Flip (up-down)</SelectItem>
                            <SelectItem value="rotate180">Rotate 180°</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="back-uv-side" className="text-[11px] text-muted-foreground">
                          Back Panel Side (UV)
                        </Label>
                        <Select
                          value={backUvSide}
                          onValueChange={(v) => setBackUvSide(v as "left" | "right")}
                          disabled={!applyTextureToBack || !bakeBackFlipIntoTexture}
                        >
                          <SelectTrigger id="back-uv-side" className="h-8">
                            <SelectValue placeholder="Back side" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label htmlFor="bake-back-fix" className="text-xs font-medium">
                          Bake Back Fix (UV export)
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Only flips the back UV half (does not touch front)
                        </span>
                      </div>
                      <Switch
                        id="bake-back-fix"
                        checked={bakeBackFlipIntoTexture}
                        onCheckedChange={setBakeBackFlipIntoTexture}
                        disabled={!applyTextureToBack}
                      />
                    </div>

                    {/* Debug-only real-time tweak controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label htmlFor="back-debug" className="text-xs font-medium">
                          Back Debug Controls
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Rotate/offset back only (disable Bake Back Fix)
                        </span>
                      </div>
                      <Switch
                        id="back-debug"
                        checked={backTextureDebugEnabled}
                        onCheckedChange={setBackTextureDebugEnabled}
                        disabled={!applyTextureToBack || bakeBackFlipIntoTexture}
                      />
                    </div>

                    {applyTextureToBack && backTextureDebugEnabled && !bakeBackFlipIntoTexture && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <Label className="text-[11px] text-muted-foreground col-span-1">
                            Rotate
                          </Label>
                          <div className="col-span-2">
                            <Slider
                              value={[backTextureDebugRotationDeg]}
                              min={-180}
                              max={180}
                              step={1}
                              onValueChange={(v) => setBackTextureDebugRotationDeg(v[0] ?? 0)}
                            />
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {backTextureDebugRotationDeg}°
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-center">
                          <Label className="text-[11px] text-muted-foreground col-span-1">
                            Offset X
                          </Label>
                          <div className="col-span-2">
                            <Slider
                              value={[backTextureDebugOffsetX]}
                              min={-0.25}
                              max={0.25}
                              step={0.005}
                              onValueChange={(v) => setBackTextureDebugOffsetX(v[0] ?? 0)}
                            />
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {backTextureDebugOffsetX.toFixed(3)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 items-center">
                          <Label className="text-[11px] text-muted-foreground col-span-1">
                            Offset Y
                          </Label>
                          <div className="col-span-2">
                            <Slider
                              value={[backTextureDebugOffsetY]}
                              min={-0.25}
                              max={0.25}
                              step={0.005}
                              onValueChange={(v) => setBackTextureDebugOffsetY(v[0] ?? 0)}
                            />
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {backTextureDebugOffsetY.toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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
