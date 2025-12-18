"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center } from "@react-three/drei";
import { useConfiguratorStore, MaterialSection } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
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
          }
        } else if (layer.type === "text" && layer.text) {
          // Text Rendering with Curving Support
          const u = layer.position?.[0] ?? 0.5;
          const v = layer.position?.[1] ?? 0.5;
          // Rotation Z is used for both orientation AND curvature by convention in our UI
          // For simplicity, let's say "rotation" determines the baseline angle,
          // but we need a separate "curvature" parameter.
          // In Step 06, we mapped "Curvature Slider" to rotation[2].
          // BUT, we also want normal rotation.
          // Let's interpret layer.rotation[2] as the curvature angle (in radians) only if we set a flag,
          // or we handle "curve" as a separate property.
          // Looking at step-06-text.tsx: rotation: [0, 0, textCurvature]
          // So currently rotation controls curvature. We need to distinguish actual rotation vs curvature.
          // For now, let's assume rotation[2] IS curvature (as per user request "curving up and down").

          // To allow BOTH rotation and curvature, we should probably add a `curvature` prop to TextureLayer.
          // Checking Step 06 again: It sets `rotation: [0, 0, radians]`.
          // So the slider controls Z rotation, but the Label says "Curve".
          // This means the user intention is Curvature.
          // Let's treat rotation[2] as Curvature Angle (Theta).

          const curvatureAngle = layer.rotation?.[2] ?? 0; // In radians
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

          // Shadow
          ctx.shadowColor = "rgba(0,0,0,0.1)";
          ctx.shadowBlur = Math.max(2, fontSize * 0.02);
          ctx.shadowOffsetY = Math.max(1, fontSize * 0.01);

          if (Math.abs(curvatureAngle) < 0.05) {
            // Straight text if angle is negligible
            ctx.fillText(layer.text, x, y);
          } else {
            // Curved text
            // Radius depends on how "curved" we want it.
            // Let's assume the angle covers the whole text width.
            const textWidth = ctx.measureText(layer.text).width;
            // Arc length s = r * theta => r = s / theta
            // Avoid division by zero
            const r = textWidth / Math.abs(curvatureAngle);

            ctx.save();
            ctx.translate(x, y);

            // If curving up (positive angle) or down (negative)
            // For standard "Arch", let's move center of circle down.
            // If angle > 0 (Smile/U-shape), center is above? No, usually "Arc" means rainbow shape.
            // Let's follow standard convention: +Angle = Rainbow (Arch up), -Angle = Smile (Arch down)?
            // Or vice versa. Let's try: + = rainbow (bulge up).
            // This means center of circle is BELOW text.
            // Wait, standard text path:
            // If curvature is positive, we want A shape. Center is below.
            // If curvature is negative, we want U shape. Center is above.

            // Actually, let's stick to the slider in Step 6: -45 to +45 deg.
            // Let's say + is Arch (Rainbow). Center is below text (y + r).
            // Rotation per char = angle / length.

            // Calculate Start Angle
            // We want the text centered at angle -90 (top of circle) if we define 0 as right.
            // Let's align characters along the arc.

            // Direction factor: 1 for Arch (Rainbow), -1 for Smile
            const direction = curvatureAngle > 0 ? -1 : 1;
            const radius = Math.abs(r);

            // Rotate entire context to orient the arc if needed?
            // For now, assume fixed horizontal baseline for the arc center.

            // We want the text centered at (0,0) of current translate.
            // So we go down/up by radius to find circle center.
            const cy = direction * radius;

            // Pre-calculate angles for each char
            // For improved spacing, use cumulative width
            const chars = layer.text.split("");
            const totalWidth = textWidth;
            // Initial angle offset to center the text
            // Arc length = totalWidth. Total Angle = totalWidth / radius.
            const totalArcAngle = totalWidth / radius;
            let currentAngle = -totalArcAngle / 2;

            chars.forEach((char) => {
              const charWidth = ctx.measureText(char).width;
              // Angle for half this char
              const charAngle = (charWidth / radius) / 2;
              const theta = currentAngle + charAngle;

              ctx.save();
              // Move to pixel on arc
              // x = r * sin(theta)
              // y = r * cos(theta) -- relative to center
              // But we are using Canvas coords where Y is down.
              // Let's effectively rotate around the circle center.

              // Move to Circle Center
              ctx.translate(0, cy);
              // Rotate to char position
              ctx.rotate(direction * theta);
              // Move back out to radius
              ctx.translate(0, -direction * radius);

              ctx.fillText(char, 0, 0);
              ctx.restore();

              currentAngle += (charWidth / radius);
            });

            ctx.restore();
          }

          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      });

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
  }, [textureLayers, canvas, texture, CANVAS_SIZE]);

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
  const { raycaster, gl, controls } = useThree();
  const { camera } = useThree();
  const selectedLayerRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<{ u: number; v: number }>({ u: 0, v: 0 });

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!clonedScene) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(clonedScene, true);

      if (intersects.length > 0 && intersects[0].uv) {
        // Find visible draggable layers (excluding patterns)
        const activeLayers = useConfiguratorStore
          .getState()
          .textureLayers.filter(
            (l) => l.visible && l.type !== "pattern" && !l.locked,
          );

        if (activeLayers.length > 0) {
          const targetLayer = activeLayers[activeLayers.length - 1];
          if (targetLayer) {
            selectedLayerRef.current = targetLayer.id;
            isDraggingRef.current = true;

            const currentU = targetLayer.position?.[0] ?? 0.5;
            const currentV = targetLayer.position?.[1] ?? 0.5;
            dragOffsetRef.current = {
              u: currentU - intersects[0].uv.x,
              v: currentV + intersects[0].uv.y,
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

      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        const newU = uv.x + dragOffsetRef.current.u;
        const newV = dragOffsetRef.current.v - uv.y;

        updateTextureLayer(selectedLayerRef.current, {
          position: [newU, newV, 0],
        });
      }
    };

    const handlePointerUp = () => {
      // Log final position when dropping a layer - useful for capturing coordinates
      if (selectedLayerRef.current) {
        const store = useConfiguratorStore.getState();
        const layer = store.textureLayers.find(
          (l) => l.id === selectedLayerRef.current,
        );
        if (layer) {
          const modelUrl = store.currentModelUrl;
          console.log("📍 LAYER POSITION CAPTURED:");
          console.log("  Layer:", layer.name);
          console.log("  Model:", modelUrl);
          console.log("  Position:", layer.position);
          console.log("  Scale:", layer.scale);
          console.log("");
          console.log("📋 COPY THIS TO lib/logo-positioning.ts:");
          console.log(`  // Model: ${modelUrl?.split("/").pop() || "unknown"}`);
          console.log(`  leftChest: {`);
          console.log(
            `    position: [${layer.position?.[0]?.toFixed(4)}, ${layer.position?.[1]?.toFixed(4)}, 0],`,
          );
          console.log(
            `    scale: [${layer.scale?.[0]?.toFixed(2)}, ${layer.scale?.[1]?.toFixed(2)}, 1],`,
          );
          console.log(`    rotation: [0, 0, 0],`);
          console.log(`  },`);
        }
      }
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
  }, [clonedScene, camera, gl, updateTextureLayer, controls, raycaster]);

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
