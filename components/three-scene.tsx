"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import {
  useConfiguratorStore,
  MaterialSection,
} from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { LayerControlsOverlay } from "@/components/layer-controls-overlay";
import { useTheme } from "next-themes";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import { extractSectionsFromThreeModel } from "@/lib/three-material-utils";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

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
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const selectedTextureLayerId = useConfiguratorStore(
    (s) => s.selectedTextureLayerId,
  );
  const setActiveLayerBounds = useConfiguratorStore(
    (s) => s.setActiveLayerBounds,
  );
  const perfConfig = useMobilePerformance();

  // Use optimal canvas size based on device performance
  const CANVAS_SIZE = perfConfig.uvCanvasSize;

  const [canvas] = useState(() => {
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

  // Track loaded images to avoid reloading
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Helper function to draw a control icon
  const drawControlIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    iconType: "copy" | "rotate" | "delete" | "resize",
    size: number,
  ) => {
    const radius = size / 2;

    // Draw circular background
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = size * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Draw border based on icon type
    const colors: Record<string, string> = {
      copy: "#8b5cf6",
      rotate: "#3b82f6",
      delete: "#ef4444",
      resize: "#3b82f6",
    };
    ctx.strokeStyle = colors[iconType];
    ctx.lineWidth = size * 0.08;
    ctx.stroke();

    // Draw icon (simplified shapes)
    ctx.strokeStyle = colors[iconType];
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const iconSize = size * 0.4;

    if (iconType === "copy") {
      // Two overlapping rectangles
      const rectSize = iconSize * 0.7;
      ctx.strokeRect(x - rectSize / 2, y - rectSize / 2, rectSize, rectSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        x - rectSize / 2 + rectSize * 0.3,
        y - rectSize / 2 - rectSize * 0.3,
        rectSize,
        rectSize,
      );
      ctx.strokeRect(
        x - rectSize / 2 + rectSize * 0.3,
        y - rectSize / 2 - rectSize * 0.3,
        rectSize,
        rectSize,
      );
    } else if (iconType === "rotate") {
      // Circular arrow
      ctx.beginPath();
      ctx.arc(x, y, iconSize * 0.5, -Math.PI * 0.7, Math.PI * 0.5);
      ctx.stroke();
      // Arrow head
      const arrowX = x + iconSize * 0.5;
      const arrowY = y;
      ctx.beginPath();
      ctx.moveTo(arrowX - iconSize * 0.2, arrowY - iconSize * 0.15);
      ctx.lineTo(arrowX, arrowY);
      ctx.lineTo(arrowX - iconSize * 0.15, arrowY + iconSize * 0.2);
      ctx.stroke();
    } else if (iconType === "delete") {
      // Trash icon
      const trashW = iconSize * 0.6;
      const trashH = iconSize * 0.7;
      ctx.beginPath();
      ctx.moveTo(x - trashW / 2, y - trashH / 2 + trashH * 0.15);
      ctx.lineTo(x + trashW / 2, y - trashH / 2 + trashH * 0.15);
      ctx.stroke();
      // Trash body
      ctx.beginPath();
      ctx.moveTo(x - trashW / 2 + trashW * 0.1, y - trashH / 2 + trashH * 0.15);
      ctx.lineTo(x - trashW / 2 + trashW * 0.2, y + trashH / 2);
      ctx.lineTo(x + trashW / 2 - trashW * 0.2, y + trashH / 2);
      ctx.lineTo(x + trashW / 2 - trashW * 0.1, y - trashH / 2 + trashH * 0.15);
      ctx.stroke();
      // Lid
      ctx.beginPath();
      ctx.moveTo(x - trashW * 0.2, y - trashH / 2);
      ctx.lineTo(x + trashW * 0.2, y - trashH / 2);
      ctx.stroke();
    } else if (iconType === "resize") {
      // Diagonal arrows
      ctx.beginPath();
      ctx.moveTo(x - iconSize * 0.4, y - iconSize * 0.4);
      ctx.lineTo(x + iconSize * 0.4, y + iconSize * 0.4);
      ctx.stroke();
      // Arrow heads
      ctx.beginPath();
      ctx.moveTo(x - iconSize * 0.4, y - iconSize * 0.15);
      ctx.lineTo(x - iconSize * 0.4, y - iconSize * 0.4);
      ctx.lineTo(x - iconSize * 0.15, y - iconSize * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + iconSize * 0.4, y + iconSize * 0.15);
      ctx.lineTo(x + iconSize * 0.4, y + iconSize * 0.4);
      ctx.lineTo(x + iconSize * 0.15, y + iconSize * 0.4);
      ctx.stroke();
    }

    ctx.restore();
  };

  useEffect(() => {
    const ctx = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false,
    });
    if (!ctx) return;

    // Adjust image smoothing based on performance mode
    ctx.imageSmoothingEnabled = !perfConfig.isLowEndDevice;
    ctx.imageSmoothingQuality = perfConfig.isLowEndDevice ? "low" : "high";

    // Clear canvas with white (neutral for multiply blending with material color)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Get visible layers sorted by order
    const visibleLayers = textureLayers
      .filter((l) => l.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (visibleLayers.length === 0) {
      texture.needsUpdate = true;
      return;
    }

    // Process each layer
    let pendingImages = 0;
    let processedImages = 0;

    const renderAllLayers = () => {
      // Clear and re-render all layers in order
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Track bounds for selected layer
      let selectedLayerBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null = null;

      visibleLayers.forEach((layer) => {
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
          // Image: Draw at UV position with scale - smooth rendering
          const img = imageCache.current.get(layer.imageUrl);
          if (img && img.complete) {
            const u = layer.position?.[0] ?? 0.5;
            const v = layer.position?.[1] ?? 0.5;
            const scaleX = layer.scale?.[0] ?? 0.3;
            const scaleY = layer.scale?.[1] ?? 0.3;
            const rotation = layer.rotation?.[2] ?? 0;

            // Calculate pixel position (UV 0-1 to canvas coords)
            const imgWidth = CANVAS_SIZE * scaleX;
            const imgHeight = CANVAS_SIZE * scaleY;
            const x = u * CANVAS_SIZE;
            const y = (1 - v) * CANVAS_SIZE; // Flip V for canvas (top-left origin)

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
          // Text Rendering with Curving Support
          const u = layer.position?.[0] ?? 0.5;
          const v = layer.position?.[1] ?? 0.5;
          const curvatureAngle = layer.rotation?.[2] ?? 0;
          const scaleMultiplier = layer.scale?.[0] ?? 1;
          const baseFontSize = (layer.fontSize ?? 100) * (CANVAS_SIZE / 512);
          const fontSize = baseFontSize * scaleMultiplier;
          const fontFamily = layer.fontFamily || "Arial";

          const x = u * CANVAS_SIZE;
          const y = (1 - v) * CANVAS_SIZE;

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

          if (Math.abs(curvatureAngle) < 0.05) {
            // Straight text if angle is negligible
            ctx.fillText(layer.text, x, y);
          } else {
            // Curved text
            const r = textWidth / Math.abs(curvatureAngle);

            ctx.save();
            ctx.translate(x, y);

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

            ctx.restore();
          }

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

        // Draw corner control icons
        // Top-left: Duplicate (copy)
        drawControlIcon(ctx, b.x - padding, b.y - padding, "copy", controlSize);

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

      texture.needsUpdate = true;
    };

    // Load all images first
    visibleLayers.forEach((layer) => {
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
    textureLayers,
    selectedTextureLayerId,
    canvas,
    texture,
    CANVAS_SIZE,
    perfConfig.isLowEndDevice,
    setActiveLayerBounds,
  ]);

  useEffect(() => {
    return () => {
      setActiveLayerBounds(null);
    };
  }, [setActiveLayerBounds]);

  // Apply Texture to Material
  useEffect(() => {
    if (!scene) return;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    const hasLayers = textureLayers.some((l) => l.visible);

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (hasLayers) {
          mat.map = texture;
        } else {
          mat.map = null;
        }
        mat.needsUpdate = true;
      }
    });
  }, [scene, texture, textureLayers]);

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
            c.setPolarAngle(0);
            break;
          case "Bottom":
            c.setPolarAngle(Math.PI);
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
  const { scene } = useGLTF(url) as GLTF;
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
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((mat) => {
          const section = sections.find(
            (s) =>
              s.originalName === mat.name ||
              s.id === mat.name ||
              mat.name.includes(s.originalName),
          );
          if (section && mat instanceof THREE.MeshStandardMaterial) {
            if (section.color) {
              mat.color.set(section.color);
            }
            // Remove map if we are using Decals, unless it's a specific pattern map?
            // For now, assume Decals replace the need for baked map for Images/Logos.
            // If we have "Patterns", we might set map here.
            // But to fix "Color Over Image", we relying on Decals.
            // mat.map = null; // Removed as patterns will use mat.map
            mat.transparent = false;
            mat.side = THREE.DoubleSide;
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [clonedScene, sections]);

  // Simplified interaction - drag to reposition textures on model surface
  // Also handles clicks on control icons using UV-space proximity
  const { raycaster, gl, controls } = useThree();
  const { camera } = useThree();
  const selectedLayerRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<{ u: number; v: number }>({ u: 0, v: 0 });

  // Get store functions for control actions
  const duplicateTextureLayer = useConfiguratorStore(
    (s) => s.duplicateTextureLayer,
  );
  const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (s) => s.setSelectedTextureLayerId,
  );

  // Check if UV click is on a control icon (works in UV space 0-1)
  // Must match EXACTLY how TextureCompositor draws controls on canvas
  const checkControlClickUV = (
    clickU: number,
    clickV: number,
  ): string | null => {
    const store = useConfiguratorStore.getState();
    const selectedLayerId = store.selectedTextureLayerId;

    console.log(`🔍 checkControlClickUV: click=(${clickU.toFixed(3)}, ${clickV.toFixed(3)}), selectedId=${selectedLayerId}`);

    if (!selectedLayerId) {
      console.log("⚠️ No selected layer, skipping control check");
      return null;
    }

    const layer = store.textureLayers.find((l) => l.id === selectedLayerId);
    if (!layer || !layer.visible) {
      console.log("⚠️ Layer not found or not visible");
      return null;
    }

    // Convert click UV to canvas pixel coordinates (matching TextureCompositor)
    // Raycast UV: u=0 left, u=1 right, v=0 bottom, v=1 top
    // Canvas: x=0 left, x=CANVAS_SIZE right, y=0 top, y=CANVAS_SIZE bottom
    // TextureCompositor uses: x = u * CANVAS_SIZE, y = (1 - v) * CANVAS_SIZE
    const activeBounds = store.activeLayerBounds;
    const CANVAS_SIZE = activeBounds?.canvasSize ?? 4096;
    const clickX = clickU * CANVAS_SIZE;

    let padding = activeBounds?.padding ?? 15;
    let controlSize =
      activeBounds?.controlSize ?? Math.max(30, CANVAS_SIZE * 0.025);
    // drawControlIcon draws a circle with radius=controlSize/2.
    // Use a forgiving hit area since raycast UVs can be noisy.
    let hitRadius = Math.max((controlSize / 2) * 1.8, controlSize * 0.9);

    let bx: number;
    let by: number;
    let bw: number;
    let bh: number;

    if (activeBounds && activeBounds.layerId === selectedLayerId) {
      bx = activeBounds.bounds.x;
      by = activeBounds.bounds.y;
      bw = activeBounds.bounds.width;
      bh = activeBounds.bounds.height;
    } else {
      // Fall back to approximated geometry
      const layerU = layer.position?.[0] ?? 0.5;
      const layerV = layer.position?.[1] ?? 0.5;
      const layerX = layerU * CANVAS_SIZE;
      const layerY = (1 - layerV) * CANVAS_SIZE;

      let halfWidth: number;
      let halfHeight: number;

      if (layer.type === "image") {
        const scaleX = layer.scale?.[0] ?? 0.3;
        const scaleY = layer.scale?.[1] ?? 0.3;
        halfWidth = (CANVAS_SIZE * scaleX) / 2;
        halfHeight = (CANVAS_SIZE * scaleY) / 2;
      } else if (layer.type === "text" && layer.text) {
        const scaleMultiplier = layer.scale?.[0] ?? 1;
        const baseFontSize = (layer.fontSize ?? 100) * (CANVAS_SIZE / 512);
        const fontSize = baseFontSize * scaleMultiplier;
        halfWidth = (layer.text.length * fontSize * 0.6) / 2 + 10;
        halfHeight = (fontSize * 1.2) / 2 + 10;
      } else {
        halfWidth = 100;
        halfHeight = 50;
      }

      bx = layerX - halfWidth;
      by = layerY - halfHeight;
      bw = halfWidth * 2;
      bh = halfHeight * 2;
      hitRadius = controlSize * 1.5;
    }

    const controls_px = {
      copy: { x: bx - padding, y: by - padding },
      rotate: { x: bx + bw + padding, y: by - padding },
      delete: { x: bx - padding, y: by + bh + padding },
      resize: { x: bx + bw + padding, y: by + bh + padding },
    };

    console.log(
      `📍 Layer: "${layer.name}" bounds=(${bx.toFixed(0)}, ${by.toFixed(
        0,
      )}, ${bw.toFixed(0)}, ${bh.toFixed(0)}) [canvas=${CANVAS_SIZE}]`,
    );
    console.log(`📏 Hit radius: ${hitRadius.toFixed(0)}px`);

    const testClick = (clickY: number): string | null => {
      console.log(
        `🖱️ Click at canvas(${clickX.toFixed(0)}, ${clickY.toFixed(0)})`,
      );

      let nearest: { name: string; dist: number } | null = null;

      // Check distance to each control in pixel space
      for (const [name, pos] of Object.entries(controls_px)) {
        const dist = Math.hypot(clickX - pos.x, clickY - pos.y);
        console.log(
          `  → ${name}: pos=(${pos.x.toFixed(0)}, ${pos.y.toFixed(
            0,
          )}), dist=${dist.toFixed(0)}px (need < ${hitRadius.toFixed(0)})`,
        );
        if (!nearest || dist < nearest.dist) {
          nearest = { name, dist };
        }
        if (dist < hitRadius) {
          console.log(`🎯 HIT! Control: ${name}`);
          return name;
        }
      }

      // If click is within the selection border, snap to nearest control
      const withinSelection =
        clickX >= bx - padding - controlSize &&
        clickX <= bx + bw + padding + controlSize &&
        clickY >= by - padding - controlSize &&
        clickY <= by + bh + padding + controlSize;

      if (withinSelection && nearest && nearest.dist < hitRadius * 2) {
        console.log(`🎯 SNAP HIT! Control: ${nearest.name}`);
        return nearest.name;
      }

      return null;
    };

    // Some models deliver raycast UVs with V flipped relative to our compositor.
    // Try both mappings; accept the first one that hits.
    const clickY_flipped = (1 - clickV) * CANVAS_SIZE;
    const clickY_unflipped = clickV * CANVAS_SIZE;

    return testClick(clickY_flipped) ?? testClick(clickY_unflipped);
  };

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!clonedScene) return;

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

        if (controlClicked) {
          const store = useConfiguratorStore.getState();
          const selectedLayerId = store.selectedTextureLayerId;

          if (selectedLayerId) {
            switch (controlClicked) {
              case "copy":
                duplicateTextureLayer(selectedLayerId);
                console.log("📋 Layer duplicated!");
                break;
              case "rotate":
                const layer = store.textureLayers.find(
                  (l) => l.id === selectedLayerId,
                );
                if (layer) {
                  const currentRotation = layer.rotation?.[2] ?? 0;
                  updateTextureLayer(selectedLayerId, {
                    rotation: [0, 0, currentRotation + Math.PI / 12],
                  });
                  console.log("🔄 Layer rotated!");
                }
                break;
              case "delete":
                removeTextureLayer(selectedLayerId);
                console.log("🗑️ Layer deleted!");
                break;
              case "resize":
                const resizeLayer = store.textureLayers.find(
                  (l) => l.id === selectedLayerId,
                );
                if (resizeLayer) {
                  const currentScaleX = resizeLayer.scale?.[0] ?? 1;
                  const currentScaleY = resizeLayer.scale?.[1] ?? 1;
                  updateTextureLayer(selectedLayerId, {
                    scale: [currentScaleX * 1.1, currentScaleY * 1.1, 1],
                  });
                  console.log("📐 Layer scaled up!");
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
              acc: { layer: (typeof activeLayers)[number] | null; dist: number },
              layer,
            ) => {
              const layerU = layer.position?.[0] ?? 0.5;
              const layerV = layer.position?.[1] ?? 0.5;
              // Compare in same UV space (no flip needed - both are raw UV)
              const dist = Math.hypot(layerU - hitU, (1 - layerV) - hitV);
              if (dist < acc.dist) return { layer, dist };
              return acc;
            },
            { layer: null, dist: Infinity },
          );

          const targetLayer = nearest.layer ?? activeLayers[activeLayers.length - 1];

          if (targetLayer) {
            // Select the layer
            setSelectedTextureLayerId(targetLayer.id);
            selectedLayerRef.current = targetLayer.id;
            isDraggingRef.current = true;

            const currentU = targetLayer.position?.[0] ?? 0.5;
            const currentV = targetLayer.position?.[1] ?? 0.5;
            // Store offset in raycast UV space
            // Layer V needs to be converted: canvas V = 1 - layer V
            // Raycast V matches canvas Y direction after (1-v) transform
            dragOffsetRef.current = {
              u: currentU - hitU,
              v: (1 - currentV) - hitV,
            };

            if (controls) (controls as any).enabled = false;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || !selectedLayerRef.current || !clonedScene)
          return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        const intersects = raycaster.intersectObject(clonedScene, true);
        const hit = intersects.find((i) => i.uv);

        if (hit?.uv) {
          const uv = hit.uv;
          const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
          const newU = clamp01(uv.x + dragOffsetRef.current.u);
          // Convert back from raycast V to layer V
          // raycast V + offset = canvas-space V, then 1 - that = layer V
          const newV = clamp01(1 - (uv.y + dragOffsetRef.current.v));

          updateTextureLayer(selectedLayerRef.current, {
            position: [newU, newV, 0],
          });
        }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      selectedLayerRef.current = null;
      if (controls) (controls as any).enabled = true;
    };

    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    gl.domElement.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
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

  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const modelLoading = useConfiguratorStore((s) => s.modelLoading);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const setSections = useConfiguratorStore((s) => s.setSections);
  const perfConfig = useMobilePerformance();

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

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={!perfConfig.isLowEndDevice && perfConfig.shadowsEnabled}
        dpr={[1, Math.min(perfConfig.pixelRatio, 2)]}
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

      {/* Layer Controls Overlay - shows when a texture layer is selected */}
      <LayerControlsOverlay />

      {/* Overlays for Loading, Empty State, Error - simplified for brevity in this rewrite */}
      {/* Overlays for Loading, Empty State, Error */}
      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Spinner className="text-primary w-12 h-12" />
        </div>
      )}

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
