"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Center } from "@react-three/drei";
import { useConfiguratorStore, MaterialSection, TextureLayer } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import {
  MobileImageCache,
} from "@/lib/mobile-performance-utils";
import { useDebounce } from "@/hooks/use-mobile-performance";
import {
  extractSectionsFromThreeModel,
  applyMaterialsToThreeModel,
  extractUVMapFromThreeModel,
} from "@/lib/three-material-utils";
import { analyzeModel, printModelAnalysis } from "@/lib/model-analyzer";
import { useCachedGLTF } from "@/hooks/use-cached-gltf";
import { getModelCache } from "@/lib/model-cache";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { useAutoMemoryCleanup } from "@/lib/memory-monitor";

// Bounding Box Helper Component
function BoundingBoxHelper({ object }: { object: THREE.Object3D }) {
  const boxRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!boxRef.current || !object) return;
    const box = new THREE.Box3().setFromObject(object);
    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      boxRef.current.position.copy(center);
      boxRef.current.scale.set(size.x, size.y, size.z);
    }
  }, [object]);

  return (
    <mesh ref={boxRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// UV Texture Compositor Component - Handles ALL layer types (patterns, images, text)
// Renders textures directly onto the model surface (no floating elements)
function TextureCompositor({ scene }: { scene: THREE.Group }) {
  // Consolidated store subscriptions to reduce re-renders
  const {
    textureLayers,
    selectedTextureLayerId,
    setActiveLayerBounds,
    globalCustomTexture,
    globalNormalMap,
    globalRoughnessMap,
    globalAOMap,
    globalDisplacementMap,
    applyTextureToBack,
    sections,
    backTextureTransform,
    bakeBackFlipIntoTexture,
  } = useConfiguratorStore(useShallow((s) => ({
    textureLayers: s.textureLayers,
    selectedTextureLayerId: s.selectedTextureLayerId,
    setActiveLayerBounds: s.setActiveLayerBounds,
    globalCustomTexture: s.globalCustomTexture,
    globalNormalMap: s.globalNormalMap,
    globalRoughnessMap: s.globalRoughnessMap,
    globalAOMap: s.globalAOMap,
    globalDisplacementMap: s.globalDisplacementMap,
    applyTextureToBack: s.applyTextureToBack,
    sections: s.sections,
    backTextureTransform: s.backTextureTransform,
    bakeBackFlipIntoTexture: s.bakeBackFlipIntoTexture,
  })));
  const perfConfig = useMobilePerformance();

  // Debounce texture layers to prevent rapid re-renders
  const debouncedLayers = useDebounce(textureLayers, perfConfig.debounceMs);

  // Use optimal canvas size based on device performance
  const CANVAS_SIZE = perfConfig.uvCanvasSize;

  const [canvas] = useState(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_SIZE;
    c.height = CANVAS_SIZE;
    return c;
  });

  // Back-side canvas (mirrored horizontally). We keep a separate canvas so we can flip
  // without relying on UV repeat/offset tricks (which can break on some models).
  const [backCanvas] = useState(() => {
    const c = document.createElement("canvas");
    c.width = CANVAS_SIZE;
    c.height = CANVAS_SIZE;
    return c;
  });
  const [texture] = useState(() => {
    const tex = new THREE.CanvasTexture(canvas);
    // Enable smooth filtering for better quality
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 16; // Max anisotropic filtering for sharp textures at angles
    return tex;
  });

  // Back-side texture variant. Uses a separate canvas (backCanvas) that mirrors the main
  // canvas, so we can reliably correct back-panel orientation across different UV layouts.
  const [backTexture] = useState(() => {
    const tex = new THREE.CanvasTexture(backCanvas);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 16;
    return tex;
  });

  // Track loaded images with LRU eviction to prevent memory leaks
  const imageCache = useRef<MobileImageCache>(new MobileImageCache(30));

  // Control icons removed as per UX request (moved to bottom panel only)
  const drawControlIcon = () => { }; // No-op

  useEffect(() => {
    const ctx = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false,
    });
    if (!ctx) return;

    // Adjust image smoothing based on performance mode
    ctx.imageSmoothingEnabled = !perfConfig.isLowEndDevice;
    ctx.imageSmoothingQuality = perfConfig.isLowEndDevice ? "low" : "high";

    // Get visible layers sorted by order (use debounced layers for performance)
    const visibleLayers = debouncedLayers
      .filter((l) => l.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const baseLayer: TextureLayer | null = globalCustomTexture
      ? {
        id: "__global_texture_layer",
        name: "Global Texture",
        type: "pattern",
        visible: true,
        locked: true,
        opacity: 1,
        blendMode: "normal",
        order: Number.MIN_SAFE_INTEGER,
        imageUrl: globalCustomTexture,
      }
      : null;

    const layersToRender = baseLayer
      ? [baseLayer, ...visibleLayers]
      : visibleLayers;

    // Check if we have stripe layers (only stripes need transparent background)
    const hasStripeLayer = layersToRender.some((l) =>
      l.name?.includes("Side Stripe"),
    );

    // Clear canvas - white background for most layers (including images)
    // Only use transparent for side stripes which need to blend with material colors
    if (hasStripeLayer) {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    if (layersToRender.length === 0) {
      texture.needsUpdate = true;
      return;
    }

    // Process each layer
    let pendingImages = 0;
    let processedImages = 0;

    const renderAllLayers = () => {
      // Check if we have stripe layers (only stripes need transparent background)
      const hasStripeLayer = layersToRender.some((l) =>
        l.name?.includes("Side Stripe"),
      );

      // Clear canvas - white for most layers, transparent for stripes
      if (hasStripeLayer) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }

      // Track bounds for selected layer
      let selectedLayerBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null = null;

      layersToRender.forEach((layer) => {
        ctx.save();

        // Set opacity and blend mode
        ctx.globalAlpha = layer.opacity ?? 1;
        switch (layer.blendMode) {
          case "multiply":
            ctx.globalCompositeOperation = "multiply";
            break;
          case "screen":
            ctx.globalCompositeOperation = "screen";
            break;
          case "overlay":
            ctx.globalCompositeOperation = "overlay";
            break;
          case "add":
            ctx.globalCompositeOperation = "lighter";
            break;
          default:
            ctx.globalCompositeOperation = "source-over";
        }

        if (layer.type === "pattern" && layer.imageUrl) {
          // Pattern: Draw full canvas with smooth scaling
          const img = imageCache.current.get(layer.imageUrl);
          if (img && img.complete) {
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
          }
        } else if (layer.type === "image" && layer.imageUrl) {
          // Image: Draw at UV position with scale
          const img = imageCache.current.get(layer.imageUrl);
          if (img && img.complete) {
            const u = layer.position?.[0] ?? 0.5;
            const v = layer.position?.[1] ?? 0.5;
            const scaleX = layer.scale?.[0] ?? 0.3;
            const scaleY = layer.scale?.[1] ?? 0.3;
            const rotation = layer.rotation?.[2] ?? 0;

            // Calculate pixel position (UV 0-1 to canvas coords)
            // Since texture.flipY = false, use direct UV mapping
            const imgWidth = CANVAS_SIZE * scaleX;
            const imgHeight = CANVAS_SIZE * scaleY;
            const x = u * CANVAS_SIZE;
            const y = v * CANVAS_SIZE;

            ctx.translate(x, y);
            ctx.rotate(rotation);
            if (layer.flipX) ctx.scale(-1, 1);
            ctx.drawImage(
              img,
              -imgWidth / 2,
              -imgHeight / 2,
              imgWidth,
              imgHeight,
            );

            // Track bounds if selected
            if (layer.id === selectedTextureLayerId) {
              selectedLayerBounds = {
                x: x - imgWidth / 2,
                y: y - imgHeight / 2,
                width: imgWidth,
                height: imgHeight,
              };
            }
          }
        } else if (layer.type === "text" && layer.text) {
          // Text Rendering with Rotation and Curving Support
          const u = layer.position?.[0] ?? 0.5;
          const v = layer.position?.[1] ?? 0.5;
          const rotation = layer.rotation?.[2] ?? 0;
          const scaleMultiplier = layer.scale?.[0] ?? 1;
          const baseFontSize = (layer.fontSize ?? 100) * (CANVAS_SIZE / 512);
          const fontSize = baseFontSize * scaleMultiplier;
          const fontFamily = layer.fontFamily || "Arial";

          const x = u * CANVAS_SIZE;
          const y = v * CANVAS_SIZE;

          ctx.font = `bold ${fontSize}px ${fontFamily}, Arial, sans-serif`;
          ctx.fillStyle = layer.textColor || "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Measure text for selection bounds
          const textMetrics = ctx.measureText(layer.text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize * 1.2;

          // Shadow
          ctx.shadowColor = "rgba(0,0,0,0.1)";
          ctx.shadowBlur = Math.max(2, fontSize * 0.02);
          ctx.shadowOffsetY = Math.max(1, fontSize * 0.01);

          // Apply rotation transform (like images)
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);
          if (layer.flipX) ctx.scale(-1, 1);

          // Check if this should be curved text (large rotation values indicate curvature intent)
          const isCurvedText = Math.abs(rotation) > Math.PI / 4; // > 45 degrees = curved

          if (!isCurvedText) {
            // Simple rotated text
            ctx.fillText(layer.text, 0, 0);
          } else {
            // Curved text for large rotation values
            const curvatureAngle = rotation;
            const r = textWidth / Math.abs(curvatureAngle);
            const direction = curvatureAngle > 0 ? -1 : 1;
            const radius = Math.abs(r);
            const cy = direction * radius;

            const chars = layer.text.split("");
            const totalWidth = textWidth;
            const totalArcAngle = totalWidth / radius;
            let currentAngle = -totalArcAngle / 2;

            chars.forEach((char) => {
              const charWidth = ctx.measureText(char).width;
              const charAngle = charWidth / radius / 2;
              const theta = currentAngle + charAngle;

              ctx.save();
              ctx.translate(0, cy);
              ctx.rotate(direction * theta);
              ctx.translate(0, -direction * radius);
              ctx.fillText(char, 0, 0);
              ctx.restore();

              currentAngle += charWidth / radius;
            });
          }

          ctx.restore();

          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;

          // Track bounds if selected
          if (layer.id === selectedTextureLayerId) {
            selectedLayerBounds = {
              x: x - textWidth / 2 - 10,
              y: y - textHeight / 2 - 10,
              width: textWidth + 20,
              height: textHeight + 20,
            };
          }
        }
        ctx.restore();
      });

      const padding = 15;
      const controlSize = Math.max(30, CANVAS_SIZE * 0.025);

      // Draw selection handles if a layer is selected
      if (selectedLayerBounds !== null && selectedTextureLayerId) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        // Explicit type to avoid TypeScript narrowing issues
        const b: { x: number; y: number; width: number; height: number } =
          selectedLayerBounds;

        // Draw selection border (dashed blue line)
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(
          b.x - padding,
          b.y - padding,
          b.width + padding * 2,
          b.height + padding * 2,
        );
        ctx.setLineDash([]);

        // Controls removed - only showing selection border
        /*
        // Draw corner control icons directly on the texture
        // Top-left: Duplicate
        drawControlIcon(
          ctx,
          b.x - padding,
          b.y - padding,
          "duplicate",
          controlSize,
        );

        // Top-right: Rotate
        drawControlIcon(
          ctx,
          b.x + b.width + padding,
          b.y - padding,
          "rotate",
          controlSize,
        );

        // Bottom-left: Delete
        drawControlIcon(
          ctx,
          b.x - padding,
          b.y + b.height + padding,
          "delete",
          controlSize,
        );

        // Bottom-right: Resize
        drawControlIcon(
          ctx,
          b.x + b.width + padding,
          b.y + b.height + padding,
          "resize",
          controlSize,
        );
        */

        ctx.restore();
      }

      if (selectedLayerBounds && selectedTextureLayerId) {
        setActiveLayerBounds({
          layerId: selectedTextureLayerId,
          canvasSize: CANVAS_SIZE,
          padding,
          controlSize,
          bounds: selectedLayerBounds,
        });
      } else {
        setActiveLayerBounds(null);
      }

      // Update the back canvas using the chosen transform.
      // This avoids UV repeat/offset artifacts and keeps the front canvas unchanged.
      const backCtx = backCanvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
      });
      if (backCtx) {
        backCtx.setTransform(1, 0, 0, 1, 0, 0);
        backCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        switch (backTextureTransform) {
          case "none": {
            backCtx.drawImage(canvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            break;
          }
          case "mirrorY": {
            // Flip vertically
            backCtx.translate(0, CANVAS_SIZE);
            backCtx.scale(1, -1);
            backCtx.drawImage(canvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            break;
          }
          case "rotate180": {
            backCtx.translate(CANVAS_SIZE, CANVAS_SIZE);
            backCtx.scale(-1, -1);
            backCtx.drawImage(canvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            break;
          }
          case "mirrorX":
          default: {
            // Mirror horizontally
            backCtx.translate(CANVAS_SIZE, 0);
            backCtx.scale(-1, 1);
            backCtx.drawImage(canvas, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            break;
          }
        }
      }

      texture.needsUpdate = true;
      backTexture.needsUpdate = true;
    };

    // Load all images first
    layersToRender.forEach((layer) => {
      const url = layer.imageUrl;
      if (!url) return;

      if (imageCache.current.has(url)) {
        const img = imageCache.current.get(url)!;
        if (img.complete) return;
      }

      pendingImages++;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCache.current.set(url, img);
        processedImages++;
        if (processedImages >= pendingImages) {
          renderAllLayers();
        }
      };
      img.onerror = () => {
        processedImages++;
        if (processedImages >= pendingImages) {
          renderAllLayers();
        }
      };
      img.src = url;
      imageCache.current.set(url, img);

      // Handle data URIs that load synchronously
      if (img.complete) {
        processedImages++;
      }
    });

    // If no images to load, render immediately
    if (pendingImages === 0 || processedImages >= pendingImages) {
      renderAllLayers();
    }
  }, [
    debouncedLayers,
    selectedTextureLayerId,
    canvas,
    texture,
    CANVAS_SIZE,
    perfConfig.isLowEndDevice,
    setActiveLayerBounds,
    globalCustomTexture,
  ]);

  useEffect(() => {
    return () => {
      setActiveLayerBounds(null);
    };
  }, [setActiveLayerBounds]);

  // Cleanup: dispose texture and clear image cache on unmount
  useEffect(() => {
    return () => {
      texture.dispose();
      backTexture.dispose();
      imageCache.current.clear();
      console.log('🧹 TextureCompositor cleanup: disposed texture and cleared image cache');
    };
  }, [texture, backTexture]);

  // Apply Texture to Material
  useEffect(() => {
    if (!scene) return;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    backTexture.flipY = false;
    backTexture.colorSpace = THREE.SRGBColorSpace;

    const hasRenderableTexture =
      !!globalCustomTexture || debouncedLayers.some((l) => l.visible);

    // Load PBR maps if available
    const loader = new THREE.TextureLoader();
    const normalTex = globalNormalMap ? loader.load(globalNormalMap) : null;
    const roughnessTex = globalRoughnessMap ? loader.load(globalRoughnessMap) : null;
    const aoTex = globalAOMap ? loader.load(globalAOMap) : null;
    const dispTex = globalDisplacementMap ? loader.load(globalDisplacementMap) : null;

    // Helper to detect back jersey materials
    const isBackJerseyMaterial = (name: string): boolean => {
      const lowerName = name.toLowerCase();
      return (
        lowerName.includes('body_b') ||
        lowerName.includes('body_back') ||
        lowerName.includes('_back') ||
        lowerName.includes('back_body') ||
        lowerName.includes('backbody') ||
        lowerName === 'back'
      );
    };

    // Prefer store-derived semantic labels when available (more reliable than mesh/material naming).
    const isBackJerseySection = (materialName: string): boolean => {
      if (!sections || sections.length === 0) return false;
      const section = sections.find((s) => s.id === materialName || s.originalName === materialName);
      if (!section) return false;

      // Only treat Jersey category as "back flip" target.
      if (section.category !== "Jersey") return false;

      const name = (section.name || "").toLowerCase();
      const original = (section.originalName || "").toLowerCase();
      return (
        name.includes("back") ||
        original.includes("body_b") ||
        original.includes("body_back") ||
        original.includes("_back")
      );
    };

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return;

        const materialName = m.name || child.name || "";

        // Check if this is a back material
        const isBack =
          isBackJerseySection(m.name || "") ||
          isBackJerseyMaterial(materialName);
        const shouldApplyTexture =
          hasRenderableTexture && (!isBack || applyTextureToBack);

        if (shouldApplyTexture) {
          // Apply same texture to all materials - AI texture is designed for full UV layout
          m.map = bakeBackFlipIntoTexture ? texture : isBack ? backTexture : texture;

          // Don't use alphaTest - it was making transparent areas invisible
          m.transparent = false;
          m.alphaTest = 0;

          // Apply PBR maps
          if (normalTex) {
            m.normalMap = normalTex;
            m.normalScale.set(1, 1);
          } else {
            m.normalMap = null;
          }

          if (roughnessTex) {
            m.roughnessMap = roughnessTex;
          } else {
            m.roughnessMap = null;
          }

          if (aoTex) {
            m.aoMap = aoTex;
          } else {
            m.aoMap = null;
          }

          if (dispTex) {
            m.displacementMap = dispTex;
            m.displacementScale = 0.05; // Gentle displacement
          } else {
            m.displacementMap = null;
          }
        } else {
          m.map = null;
          // Clear PBR if no layers or is back material
          m.normalMap = null;
          m.roughnessMap = null;
          m.aoMap = null;
          m.displacementMap = null;
        }

        m.needsUpdate = true;
      });
    });

    return () => {
      normalTex?.dispose();
      roughnessTex?.dispose();
      aoTex?.dispose();
      dispTex?.dispose();
    };
  }, [
    scene,
    texture,
    backTexture,
    debouncedLayers,
    globalCustomTexture,
    globalNormalMap,
    globalRoughnessMap,
    globalAOMap,
    globalDisplacementMap,
    applyTextureToBack,
    bakeBackFlipIntoTexture,
  ]);

  // Expose canvas to global for UV map capture (email export)
  useEffect(() => {
    (window as any).__uvMapCanvas = canvas;
    return () => {
      (window as any).__uvMapCanvas = null;
    };
  }, [canvas]);

  return null;
}

// CameraViewLock - Handles locked camera views

// ...

// Camera View Lock Component
function CameraViewLock() {
  const { camera, controls } = useThree();
  const lockedView = useConfiguratorStore((s) => s.lockedView);

  useEffect(() => {
    if (lockedView && controls) {
      if (typeof (controls as any).setAzimuthalAngle === "function") {
        const c = controls as any;
        switch (lockedView) {
          case "Front":
            c.setAzimuthalAngle(0);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Back":
            c.setAzimuthalAngle(Math.PI);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Left":
            c.setAzimuthalAngle(-Math.PI / 2);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Right":
            c.setAzimuthalAngle(Math.PI / 2);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Top":
            c.setAzimuthalAngle(0);
            c.setPolarAngle(0.1); // Slightly off to avoid gimbal lock
            break;
          case "Bottom":
            c.setAzimuthalAngle(0);
            c.setPolarAngle(Math.PI - 0.1); // Slightly off to avoid gimbal lock
            break;
          // Diagonal views for comprehensive coverage
          case "Front-Left":
            c.setAzimuthalAngle(-Math.PI / 4);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Front-Right":
            c.setAzimuthalAngle(Math.PI / 4);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Back-Left":
            c.setAzimuthalAngle((-Math.PI * 3) / 4);
            c.setPolarAngle(Math.PI / 2);
            break;
          case "Back-Right":
            c.setAzimuthalAngle((Math.PI * 3) / 4);
            c.setPolarAngle(Math.PI / 2);
            break;
        }
        c.update();
      }
    }
  }, [lockedView, controls]);

  return null;
}

function Model({
  url,
  onLoad,
  onSectionsExtracted,
  customSections,
  customAutoRotate,
}: {
  url: string;
  onLoad?: () => void;
  onSectionsExtracted?: (sections: MaterialSection[]) => void;
  customSections?: MaterialSection[];
  customAutoRotate?: boolean;
}) {
  // Use cached GLTF loader for faster loading and memory management
  const { gltf, loading: gltfLoading, error: gltfError } = useCachedGLTF(url);
  const scene = gltf?.scene ?? null;

  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const storeAutoRotate = useConfiguratorStore((s) => s.autoRotate);
  const storeSections = useConfiguratorStore((s) => s.sections);

  // Use custom props if provided, otherwise fallback to store
  const autoRotate =
    customAutoRotate !== undefined ? customAutoRotate : storeAutoRotate;
  const sections = customSections || storeSections;

  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);

  const onSectionsExtractedRef = useRef(onSectionsExtracted);
  const onLoadRef = useRef(onLoad);

  // Log cache stats on load
  useEffect(() => {
    if (gltf && !gltfLoading) {
      const stats = getModelCache().getStats();
      console.log(
        `📊 Model cache: ${stats.cachedModels} models, ${stats.totalMemoryMB.toFixed(1)} MB`,
      );
    }
  }, [gltf, gltfLoading]);

  // Handle loading errors
  useEffect(() => {
    if (gltfError) {
      console.error("❌ Model loading error:", gltfError);
    }
  }, [gltfError]);

  // Clone logic ... (simplified for this edit, assume similar to before)
  useEffect(() => {
    if (scene) {
      const cloned = scene.clone(true);
      const box = new THREE.Box3().setFromObject(cloned);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;
      cloned.position.sub(center.multiplyScalar(scale));
      cloned.scale.setScalar(scale);

      setClonedScene(cloned);

      setTimeout(() => {
        const extracted = extractSectionsFromThreeModel(cloned, url);
        onSectionsExtractedRef.current?.(extracted);
        onLoadRef.current?.();

        // Analyze model structure (meshes, materials, UVs)
        const analysis = analyzeModel(cloned);
        printModelAnalysis(analysis);
        // Store analysis for debugging
        (window as any).__modelAnalysis = analysis;
        console.log("💡 Access model analysis via: window.__modelAnalysis");

        // Extract UV map and store it for AI design section
        const uvMapDataUrl = extractUVMapFromThreeModel(cloned, 1024, 1024);
        if (uvMapDataUrl) {
          useConfiguratorStore.getState().setCompleteUVMap(uvMapDataUrl);
          console.log("🗺️ UV map extracted and stored");
        }

        // Ensure materials are ready for decals
        cloned.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const m = node as THREE.Mesh;
            m.castShadow = true;
            m.receiveShadow = true;
            // Ensure unique materials for unique colors? clone materials?
            // GLTF loader usually shares materials. Cloning scene clones materials?
            // Typically yes if strict, but let's ensure.
          }
        });
      }, 0);
    }
  }, [scene, url]);

  // Sync Colors - Base Layer
  useEffect(() => {
    if (!clonedScene || sections.length === 0) return;

    console.log(
      "🎨 Applying materials with trim support to model, sections:",
      sections.length,
    );
    applyMaterialsToThreeModel(clonedScene, sections);
  }, [clonedScene, sections]);

  // Simplified interaction - drag to reposition textures on model surface
  // Also handles clicks on control icons using UV-space proximity
  const { raycaster, gl, controls } = useThree();
  const { camera } = useThree();
  const selectedLayerRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const isRotatingRef = useRef(false);
  const dragOffsetRef = useRef<{ u: number; v: number }>({ u: 0, v: 0 });
  const resizeStartRef = useRef<{
    scale: number;
    startU: number;
    startV: number;
    centerU: number;
    centerV: number;
  }>({ scale: 1, startU: 0, startV: 0, centerU: 0.5, centerV: 0.5 });
  const rotateStartRef = useRef<{
    rotation: number;
    startAngle: number;
    centerU: number;
    centerV: number;
  }>({ rotation: 0, startAngle: 0, centerU: 0.5, centerV: 0.5 });

  // Get store functions for control actions
  const duplicateTextureLayer = useConfiguratorStore(
    (s) => s.duplicateTextureLayer,
  );
  const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (s) => s.setSelectedTextureLayerId,
  );

  // --- Pinch to Zoom / Scale for Mobile ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (gl.domElement) {
      canvasRef.current = gl.domElement;
    }
  }, [gl]);

  const pinchStartScaleRef = useRef<number>(1);
  const selectedLayerId = useConfiguratorStore((s) => s.selectedTextureLayerId);
  const getLayer = (id: string) =>
    useConfiguratorStore.getState().textureLayers.find((l) => l.id === id);

  usePinchZoom(canvasRef, {
    enabled: !!selectedLayerId,
    onPinchStart: () => {
      if (selectedLayerId && controls) {
        // Disable camera controls during pinch interaction
        (controls as any).enabled = false;

        const layer = getLayer(selectedLayerId);
        if (layer) {
          // Store initial scale (average of x/y or just x)
          pinchStartScaleRef.current =
            layer.scale?.[0] ?? (layer.type === "text" ? 1 : 0.3);
        }
      }
    },
    onPinch: ({ scale }: { scale: number }) => {
      if (selectedLayerId) {
        // Calculate new scale based on pinch delta
        const layer = getLayer(selectedLayerId);
        if (!layer) return;

        const initial = pinchStartScaleRef.current;
        // Apply sensitivity factor to make it feel 1:1
        let newScale = initial * scale;

        // Clamp limits
        if (layer.type === "text") {
          newScale = Math.min(Math.max(newScale, 0.5), 5.0);
        } else {
          newScale = Math.min(Math.max(newScale, 0.05), 2.0);
        }

        updateTextureLayer(selectedLayerId, {
          scale: [newScale, newScale, 1],
          // For text, we might also want to scale fontSize visually if we weren't using scale transform
          // But our texture compositor uses scale for text too.
        });
      }
    },
    onPinchEnd: () => {
      if (controls) {
        (controls as any).enabled = true;
      }
    },
  });

  // Check if UV click is on a control icon (works in UV space 0-1)
  // Must match EXACTLY how TextureCompositor draws controls on canvas
  // Control clicks disabled - always return null
  const checkControlClickUV = (clickU: number, clickV: number) => {
    return null;
  };

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!clonedScene) return;

      // Handle Placement Mode (Click to Place)
      const store = useConfiguratorStore.getState();
      if (store.isPlacementMode && store.pendingLayer) {
        const rect = gl.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        const intersects = raycaster.intersectObject(clonedScene, true);
        const hit = intersects.find((i) => i.uv);

        if (hit?.uv) {
          const newId = uuidv4();
          // Merge pending layer with clicked position
          store.addTextureLayer({
            ...(store.pendingLayer as any),
            id: newId,
            position: [hit.uv.x, hit.uv.y, 0],
            // Ensure essential defaults if missing
            visible: true,
            opacity: 1,
            blendMode: "normal",
            order: store.textureLayers.length,
            scale: store.pendingLayer.scale || [0.35, 0.35, 1],
            rotation: store.pendingLayer.rotation || [0, 0, 0],
          });

          store.setPlacementMode(false);
          store.setPendingLayer(null);
          toast.success("Placed successfully!");
        }
        return; // Stop propagation
      }

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(clonedScene, true);
      const hit = intersects.find((i) => i.uv);

      if (hit?.uv) {
        const uv = hit.uv;

        // First check if clicking on a control icon
        const hitU = uv.x;
        const hitV = uv.y;

        const controlClicked = checkControlClickUV(hitU, hitV);
        console.log(
          "🎯 Control clicked:",
          controlClicked,
          "at UV:",
          hitU.toFixed(3),
          hitV.toFixed(3),
        );

        if (controlClicked) {
          const store = useConfiguratorStore.getState();
          const selectedLayerId = store.selectedTextureLayerId;

          if (selectedLayerId) {
            const layer = store.textureLayers.find(
              (l) => l.id === selectedLayerId,
            );
            console.log(
              "🎮 Processing control:",
              controlClicked,
              "for layer:",
              layer?.name,
            );

            switch (controlClicked) {
              case "duplicate":
                duplicateTextureLayer(selectedLayerId);
                console.log("📋 Layer duplicated!");
                break;
              case "rotate":
                // Start rotate dragging mode
                if (layer) {
                  isRotatingRef.current = true;
                  selectedLayerRef.current = selectedLayerId;
                  const centerU = layer.position?.[0] ?? 0.5;
                  const centerV = layer.position?.[1] ?? 0.5;
                  const startAngle = Math.atan2(hitV - centerV, hitU - centerU);
                  rotateStartRef.current = {
                    rotation: layer.rotation?.[2] ?? 0,
                    startAngle: startAngle,
                    centerU: centerU,
                    centerV: centerV,
                  };
                  if (controls) (controls as any).enabled = false;
                  console.log("🔄 Started rotating...");
                }
                break;
              case "delete":
                removeTextureLayer(selectedLayerId);
                console.log("🗑️ Layer deleted!");
                break;
              case "resize":
                // Start resize dragging mode
                if (layer) {
                  isResizingRef.current = true;
                  selectedLayerRef.current = selectedLayerId;
                  const centerU = layer.position?.[0] ?? 0.5;
                  const centerV = layer.position?.[1] ?? 0.5;
                  resizeStartRef.current = {
                    scale: layer.scale?.[0] ?? 1,
                    startU: hitU,
                    startV: hitV,
                    centerU: centerU,
                    centerV: centerV,
                  };
                  if (controls) (controls as any).enabled = false;
                  console.log("📐 Started resizing...");
                }
                break;
            }
          }
          return; // Don't start drag when clicking controls
        }

        // Otherwise handle layer selection/dragging
        const activeLayers = useConfiguratorStore
          .getState()
          .textureLayers.filter(
            (l) => l.visible && l.type !== "pattern" && !l.locked,
          );

        if (activeLayers.length > 0) {
          const nearest = activeLayers.reduce(
            (
              acc: {
                layer: (typeof activeLayers)[number] | null;
                dist: number;
              },
              layer,
            ) => {
              const layerU = layer.position?.[0] ?? 0.5;
              const layerV = layer.position?.[1] ?? 0.5;
              // Compare in same UV space (direct mapping, no flip)
              const dist = Math.hypot(layerU - hitU, layerV - hitV);

              // Calculate dynamic threshold based on layer type and scale
              let threshold = 0.15; // Default fallback
              if (layer.type === "image") {
                const s = Math.max(
                  layer.scale?.[0] ?? 0.35,
                  layer.scale?.[1] ?? 0.35,
                );
                threshold = (s / 2) * 1.2; // 20% buffer around image
              } else if (layer.type === "text") {
                // Text scale is usually 1, but covers less area than full box usually
                // Use a reasonable hit radius for text
                threshold = 0.2 * (layer.scale?.[0] ?? 1);
              }

              if (dist < threshold && dist < acc.dist) {
                return { layer, dist };
              }
              return acc;
            },
            { layer: null, dist: Infinity },
          );

          // Only select if we actually hit something within threshold
          // REMOVED dangerous fallback that always selected *something*
          const targetLayer = nearest.layer;

          if (targetLayer) {
            // Select the layer
            setSelectedTextureLayerId(targetLayer.id);
            selectedLayerRef.current = targetLayer.id;
            isDraggingRef.current = true;

            const currentU = targetLayer.position?.[0] ?? 0.5;
            const currentV = targetLayer.position?.[1] ?? 0.5;
            // Store offset in raycast UV space (direct mapping)
            dragOffsetRef.current = {
              u: currentU - hitU,
              v: currentV - hitV,
            };

            if (controls) (controls as any).enabled = false;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Check if any interaction mode is active
      const isAnyInteraction =
        isDraggingRef.current || isResizingRef.current || isRotatingRef.current;
      if (!isAnyInteraction || !selectedLayerRef.current || !clonedScene)
        return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObject(clonedScene, true);
      const hit = intersects.find((i) => i.uv);

      if (hit?.uv) {
        const uv = hit.uv;
        const hitU = uv.x;
        const hitV = uv.y;

        // Handle resize dragging
        if (isResizingRef.current) {
          const { scale, startU, startV, centerU, centerV } =
            resizeStartRef.current;

          // Calculate distance from center at start and now
          const startDist = Math.hypot(startU - centerU, startV - centerV);
          const currentDist = Math.hypot(hitU - centerU, hitV - centerV);

          // Scale proportionally
          if (startDist > 0.01) {
            const scaleFactor = currentDist / startDist;
            const newScale = Math.max(0.1, Math.min(3, scale * scaleFactor));

            updateTextureLayer(selectedLayerRef.current, {
              scale: [newScale, newScale, 1],
            });
          }
          return;
        }

        // Handle rotate dragging
        if (isRotatingRef.current) {
          const { rotation, startAngle, centerU, centerV } =
            rotateStartRef.current;
          const currentAngle = Math.atan2(hitV - centerV, hitU - centerU);
          const deltaAngle = currentAngle - startAngle;
          const newRotation = rotation + deltaAngle;

          console.log("🔄 Rotating:", {
            currentAngle: ((currentAngle * 180) / Math.PI).toFixed(1) + "°",
            startAngle: ((startAngle * 180) / Math.PI).toFixed(1) + "°",
            deltaAngle: ((deltaAngle * 180) / Math.PI).toFixed(1) + "°",
            newRotation: ((newRotation * 180) / Math.PI).toFixed(1) + "°",
          });

          updateTextureLayer(selectedLayerRef.current, {
            rotation: [0, 0, newRotation],
          });
          return;
        }

        // Handle position dragging
        if (isDraggingRef.current) {
          const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
          const newU = clamp01(hitU + dragOffsetRef.current.u);
          const newV = clamp01(hitV + dragOffsetRef.current.v);

          updateTextureLayer(selectedLayerRef.current, {
            position: [newU, newV, 0],
          });
        }
      }
    };

    const handlePointerUp = () => {
      if (isResizingRef.current) {
        console.log("📐 Resize complete!");
      }
      if (isRotatingRef.current) {
        console.log("🔄 Rotate complete!");
      }
      isDraggingRef.current = false;
      isResizingRef.current = false;
      isRotatingRef.current = false;
      selectedLayerRef.current = null;
      if (controls) (controls as any).enabled = true;
    };

    const handlePointerCancel = () => {
      handlePointerUp(); // Treat cancel as up (reset state)
    };

    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    gl.domElement.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);

      // Safety: ensure controls are enabled when effect cleans up
      if (controls) (controls as any).enabled = true;
    };
  }, [
    clonedScene,
    camera,
    gl,
    updateTextureLayer,
    controls,
    raycaster,
    setSelectedTextureLayerId,
    duplicateTextureLayer,
    removeTextureLayer,
  ]);

  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={modelRef}>
      {showBoundingBox && modelRef.current && (
        <BoundingBoxHelper object={modelRef.current} />
      )}

      <Center>
        {clonedScene && <primitive object={clonedScene} />}

        {/* All texture layers (patterns, images, text) rendered directly on UV map */}
        {clonedScene && <TextureCompositor scene={clonedScene} />}
      </Center>
    </group>
  );
}

// ... rest of SceneSetup, CameraControlsHandler, ThreeScene ...

// Scene setup component
function SceneSetup() {
  const { gl, scene } = useThree();
  const { theme } = useTheme();
  const backgroundColor = useConfiguratorStore((s) => s.backgroundColor);
  const perfConfig = useMobilePerformance();

  useEffect(() => {
    scene.background = new THREE.Color("#ffffff"); // Force white for now
    gl.setPixelRatio(Math.min(window.devicePixelRatio, perfConfig.pixelRatio));
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    gl.outputColorSpace = THREE.SRGBColorSpace;

    if (!perfConfig.isLowEndDevice && perfConfig.shadowsEnabled) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }, [gl, scene, theme, backgroundColor, perfConfig]);

  return null;
}

// Camera controls handler
function CameraControlsHandler() {
  const { camera, controls } = useThree();
  const setCameraControlsRef = useConfiguratorStore(
    (s) => s.setCameraControlsRef,
  );
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);

  useEffect(() => {
    setCameraControlsRef(camera as any);
  }, [camera, setCameraControlsRef]);

  useEffect(() => {
    if (currentModelUrl && controls) {
      // Reset Logic
    }
  }, [currentModelUrl, camera, controls]);

  return null;
}

// Main Three.js Scene Component
export function ThreeScene({
  customSections,
  customAutoRotate,
}: {
  customSections?: MaterialSection[];
  customAutoRotate?: boolean;
}) {
  const [initError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const modelLoading = useConfiguratorStore((s) => s.modelLoading);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const setSections = useConfiguratorStore((s) => s.setSections);
  const isPlacementMode = useConfiguratorStore((s) => s.isPlacementMode);
  const perfConfig = useMobilePerformance();

  // Monitor memory pressure and cleanup automatically
  useAutoMemoryCleanup(0.80);

  // Check if mobile for camera positioning
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!currentModelUrl) {
      setModelUrl(null);
      return;
    }
    // Direct load, skipping connection check optimization
    setModelUrl(currentModelUrl);
    setModelError(null);
  }, [currentModelUrl, setModelError]);

  const handleModelLoad = useCallback(() => {
    setModelLoading(false);
  }, [setModelLoading]);

  const handleSectionsExtracted = useCallback(
    (extractedSections: MaterialSection[]) => {
      // Check if sections already came from API (better human-readable names)
      const state = useConfiguratorStore.getState();
      const {
        sections: currentSections,
        sectionsFromApi,
        sectionsLoading,
      } = state;

      // If API is still loading, wait a bit and retry
      if (sectionsLoading) {
        console.log("⏳ Waiting for API sections to load...");
        setTimeout(() => {
          const newState = useConfiguratorStore.getState();
          if (newState.sectionsFromApi && newState.sections.length > 0) {
            // API sections loaded - merge colors
            console.log(
              "🔄 Merging extracted colors into API sections (after wait)",
            );
            const mergedSections = newState.sections.map((apiSection) => {
              const extracted = extractedSections.find(
                (e) =>
                  e.id === apiSection.id ||
                  e.originalName === apiSection.originalName ||
                  e.id === apiSection.originalName,
              );
              if (
                extracted &&
                extracted.color &&
                extracted.color !== "#ffffff"
              ) {
                return { ...apiSection, color: extracted.color };
              }
              return apiSection;
            });
            setSections(mergedSections, true);
          } else {
            // API didn't return sections, use extracted
            console.log("📋 Using extracted sections (API returned nothing)");
            setSections(extractedSections, false);
          }
        }, 500); // Wait 500ms for API
        return;
      }

      if (sectionsFromApi && currentSections.length > 0) {
        // API sections exist - merge colors from extracted sections into API sections
        // This preserves API names while getting actual colors from the model
        console.log("🔄 Merging extracted colors into API sections");
        const mergedSections = currentSections.map((apiSection) => {
          const extracted = extractedSections.find(
            (e) =>
              e.id === apiSection.id ||
              e.originalName === apiSection.originalName ||
              e.id === apiSection.originalName,
          );
          if (extracted && extracted.color && extracted.color !== "#ffffff") {
            return { ...apiSection, color: extracted.color };
          }
          return apiSection;
        });
        setSections(mergedSections, true); // Keep the fromApi flag
      } else {
        // No API sections yet, use extracted ones
        console.log("📋 Using extracted sections (no API sections available)");
        setSections(extractedSections, false);
      }
    },
    [setSections],
  );

  // WebGL Check
  useEffect(() => {
    // ... check code
  }, []);

  if (initError) return <div>Error: {initError}</div>;

  // Adjust camera position based on screen size to account for bottom navigation
  const cameraPosition: [number, number, number] = isMobile
    ? [0, 2, 8]
    : [0, 1.2, 8];

  return (
    <div
      className="w-full h-full relative"
      style={{ cursor: isPlacementMode ? "crosshair" : "auto" }}
    >
      <Canvas
        shadows={!perfConfig.isLowEndDevice && perfConfig.shadowsEnabled}
        dpr={[1, Math.min(perfConfig.pixelRatio, 2)]}
        camera={{
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: perfConfig.antialias,
          alpha: true,
          powerPreference: perfConfig.isLowEndDevice
            ? "low-power"
            : "high-performance",
          preserveDrawingBuffer: true,
        }}
        style={{ touchAction: "none" }}
      >
        <SceneSetup />
        <CameraControlsHandler />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          enableRotate={!useConfiguratorStore.getState().lockedView}
          minDistance={0.5}
          maxDistance={20}
        />
        <CameraViewLock />

        {modelUrl && (
          <Suspense fallback={null}>
            <Model
              url={modelUrl}
              onLoad={handleModelLoad}
              onSectionsExtracted={handleSectionsExtracted}
              customSections={customSections}
              customAutoRotate={customAutoRotate}
            />
          </Suspense>
        )}

        {!perfConfig.isLowEndDevice && <Environment preset="studio" />}
      </Canvas>

      {/* Loading Transition Overlay */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-background z-20 transition-opacity duration-700 ease-in-out ${modelLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        <Spinner className="text-primary w-12 h-12 mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading 3D Model...
        </p>
      </div>

      {/* Empty State Overlay - Moved inside ThreeScene to ensure it respects loading */}
      {!modelUrl && !modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-[320px]">
          <div className="text-center px-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Select a Product
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
              Use the bottom bar to start customizing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
// Preload
// useGLTF.preload(url); // Removed to prevent ReferenceError if url is undefined or method differs
