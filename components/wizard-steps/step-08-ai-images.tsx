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
      console.warn("Skipping stale AI texture apply before transform");
      return;
    }

    const transformedPatternUrl = await transformTexture(url, {
      flipY: false, // Three.js now uses flipY=true via TextureCompositor
    });
    if (!isCurrentApplyContext()) {
      console.warn("Skipping stale AI texture apply after transform");
      return;
    }

    let finalPatternUrl = transformedPatternUrl;

    const isFlippedUvModel =
      (currentModelUrl?.includes("flag-football-top-with-hoodie_UV_MAP") &&
      !currentModelUrl?.toLowerCase().includes(
        "flag-football-top-with-hoodie_uv_map_v2.glb",
      )) || currentModelUrl?.includes("track-and-field-top-short-sleeve.glb");
    const backTransformForBake = currentModelUrl?.toLowerCase().includes(
      "flag-football-top-with-hoodie_uv_map_v2.glb",
    )
      ? "none"
      : backTextureTransform;

    // 1. Fix Back Panel
    if (applyTextureToBack && bakeBackFlipIntoTexture && completeUVMap) {
      const { backSide } = await detectTorsoSides(completeUVMap, backUvSide);
      if (!isCurrentApplyContext()) {
        console.warn("Skipping stale AI texture apply after back-side detection");
        return;
      }
      finalPatternUrl = await bakeBackFlipIntoUvTexture(transformedPatternUrl, {
        uvTemplateDataUrl: completeUVMap,
        srcWasFlipY: false,
        backSide,
        transform: backTransformForBake,
      });
      if (!isCurrentApplyContext()) {
        console.warn("Skipping stale AI texture apply after back bake");
        return;
      }
    }

    // 2. Fix Front Panel (for NON-Flag Football UV models)
    // For flag football UV models, we skip this to avoid double-flipping, 
    // and instead let the region flip (below) handle it.
    if (completeUVMap && !isFlippedUvModel) {
      const { frontSide } = await detectTorsoSides(completeUVMap, backUvSide);
      if (!isCurrentApplyContext()) {
        console.warn("Skipping stale AI texture apply after front-side detection");
        return;
      }
      finalPatternUrl = await bakeFrontFlipIntoUvTexture(finalPatternUrl, {
        uvTemplateDataUrl: completeUVMap,
        srcWasFlipY: false,
        frontSide,
        transform: "mirrorX",
      });
      if (!isCurrentApplyContext()) {
        console.warn("Skipping stale AI texture apply after front bake");
        return;
      }
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
        const islandsToFlip = isFlippedUvModel
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
          if (!isCurrentApplyContext()) {
            console.warn("Skipping stale AI texture apply during region bake");
            return;
          }
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
    if (!isCurrentApplyContext()) {
      console.warn("Skipping stale AI texture apply after normal map transform");
      return;
    }
    const flippedRoughnessUrl = options?.roughnessMapUrl
      ? await transformTexture(options.roughnessMapUrl, {
          flipY: false,
        })
      : null;
    if (!isCurrentApplyContext()) {
      console.warn("Skipping stale AI texture apply after roughness map transform");
      return;
    }

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
    <div className="space-y-4">
      {/* Reference & Controls Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">AI Texture Studio</h2>
            {completeUVMap && (
                <div className="flex gap-1">
                     <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setShowUVMap(!showUVMap)}
                    >
                      {showUVMap ? "Hide UV" : "Show UV"}
                    </Button>
                     <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={handleDownloadUVMap}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      UV
                    </Button>
                </div>
            )}
        </div>

        {/* UV Map Reference - Collapsible / Compact */}
        {showUVMap && completeUVMap && (
          <div className="rounded-lg border bg-muted/20 overflow-hidden relative mb-2">
            <img
                src={completeUVMap}
                alt="UV Map"
                className="w-full max-h-[120px] object-contain opacity-80"
            />
             <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
                 <Button
                  variant="secondary"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={handleGenerateTestPattern}
                  disabled={isGeneratingDebug}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generate Test Grid
                </Button>
             </div>
          </div>
        )}

        {/* Advanced Model Settings (Back Panel, etc) */}
        <details className="text-xs group border rounded-lg bg-card mb-4">
             <summary className="px-3 py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-between select-none list-none">
                 <span>Advanced Model Settings</span>
                 <span className="opacity-50 group-open:rotate-180 transition-transform">▼</span>
             </summary>
             <div className="px-3 pb-3 pt-1 space-y-3 border-t bg-muted/30">
                 <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label htmlFor="back-texture" className="text-xs font-medium">Apply to Back</Label>
                        <span className="text-[10px] text-muted-foreground">Include rear design</span>
                      </div>
                      <Switch
                        id="back-texture"
                        checked={applyTextureToBack}
                        onCheckedChange={setApplyTextureToBack}
                        className="scale-75 origin-right"
                      />
                 </div>

                 {applyTextureToBack && (
                     <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                         <div className="space-y-1">
                             <Label className="text-[10px]">Back Flip (3D)</Label>
                            <Select
                              value={backTextureTransform}
                              onValueChange={(v) =>
                                setBackTextureTransform(
                                  v as "mirrorX" | "mirrorY" | "rotate180" | "none",
                                )
                              }
                            >
                              <SelectTrigger className="h-7 text-[10px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mirrorX">Mirror (L-R)</SelectItem>
                                <SelectItem value="mirrorY">Flip (U-D)</SelectItem>
                                <SelectItem value="rotate180">Rotate 180</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px]">Back Side (UV)</Label>
                            <Select
                              value={backUvSide}
                              onValueChange={(v) => setBackUvSide(v as "left" | "right")}
                              disabled={!bakeBackFlipIntoTexture}
                            >
                              <SelectTrigger className="h-7 text-[10px]">
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
                 
                 {/* Bake Fix Toggle */}
                  <div className="flex items-center justify-between pt-1">
                      <Label htmlFor="bake-back-fix" className="text-[10px] text-muted-foreground">Bake UV Layout Fix</Label>
                      <Switch
                        id="bake-back-fix"
                        checked={bakeBackFlipIntoTexture}
                        onCheckedChange={setBakeBackFlipIntoTexture}
                         disabled={!applyTextureToBack}
                        className="scale-75 origin-right"
                      />
                 </div>
             </div>
        </details>
      </div>

       {/* Texture Generators */}
       <div className="space-y-4">
            <div>
                 <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-purple-600">
                    <Wand2 className="w-3.5 h-3.5" />
                    AI Design Generator
                 </h3>
                 <div className="pl-1">
                    <AITextureGenerator onTextureGenerated={handleGeneratedTexture} />
                 </div>
            </div>
            
            <div className="pt-3 border-t">
                 <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-indigo-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    Image Generator
                 </h3>
                  <div className="pl-1">
                    <AIImageGenerator />
                 </div>
            </div>
       </div>

      {/* Generated Layers List - Compact */}
      {aiLayers.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Designs ({aiLayers.length})
          </h3>
          <div className="grid gap-2 grid-cols-2">
            {aiLayers.map((layer) => (
              <div
                key={layer.id}
                className="group relative flex items-center gap-2 p-1.5 rounded-lg border bg-card hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="w-8 h-8 rounded bg-muted flex-shrink-0 overflow-hidden border">
                  {layer.imageUrl && (
                    <img
                      src={layer.imageUrl}
                      alt={layer.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{layer.name}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity px-1">
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
