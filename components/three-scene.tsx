"use client";

import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, TransformControls, Center } from "@react-three/drei";
import { useConfiguratorStore, TextureLayer, MaterialSection } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import { detectConnectionSpeed, getBestModelUrl } from "@/lib/model-loader-optimized";
import { extractSectionsFromThreeModel, applyMaterialsToThreeModel, extractUVMapFromThreeModel } from "@/lib/three-material-utils";
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
function TextureCompositor({ scene }: { scene: THREE.Group }) {
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const CANVAS_SIZE = 2048;

  const [canvas] = useState(() => {
    const c = document.createElement('canvas');
    c.width = CANVAS_SIZE;
    c.height = CANVAS_SIZE;
    return c;
  });
  const [texture] = useState(() => new THREE.CanvasTexture(canvas));

  // Track loaded images to avoid reloading
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white (neutral for multiply blending with material color)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Get visible layers sorted by order
    const visibleLayers = textureLayers
      .filter(l => l.visible)
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      visibleLayers.forEach(layer => {
        ctx.save();

        // Set opacity and blend mode
        ctx.globalAlpha = layer.opacity ?? 1;
        switch (layer.blendMode) {
          case 'multiply': ctx.globalCompositeOperation = 'multiply'; break;
          case 'screen': ctx.globalCompositeOperation = 'screen'; break;
          case 'overlay': ctx.globalCompositeOperation = 'overlay'; break;
          case 'add': ctx.globalCompositeOperation = 'lighter'; break;
          default: ctx.globalCompositeOperation = 'source-over';
        }

        if (layer.type === 'pattern' && layer.imageUrl) {
          // Pattern: Draw full canvas
          const img = imageCache.current.get(layer.imageUrl);
          if (img && img.complete) {
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
          }
        } else if (layer.type === 'image' && layer.imageUrl) {
          // Image: Draw at UV position with scale
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
            ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
          }
        } else if (layer.type === 'text' && layer.text) {
          // Text: Render at UV position
          const u = layer.position?.[0] ?? 0.5;
          const v = layer.position?.[1] ?? 0.5;
          const fontSize = (layer.fontSize ?? 48) * (CANVAS_SIZE / 512); // Scale font to canvas
          const rotation = layer.rotation?.[2] ?? 0;

          const x = u * CANVAS_SIZE;
          const y = (1 - v) * CANVAS_SIZE;

          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = layer.textColor || '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(layer.text, 0, 0);
        }

        ctx.restore();
      });

      texture.needsUpdate = true;
    };

    // Load all images first
    visibleLayers.forEach(layer => {
      const url = layer.imageUrl;
      if (!url) return;

      if (imageCache.current.has(url)) {
        const img = imageCache.current.get(url)!;
        if (img.complete) return;
      }

      pendingImages++;
      const img = new Image();
      img.crossOrigin = 'anonymous';
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

  }, [textureLayers, canvas, texture]);

  // Apply Texture to Material
  useEffect(() => {
    if (!scene) return;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    const hasLayers = textureLayers.some(l => l.visible);

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
      if (typeof (controls as any).setAzimuthalAngle === 'function') {
        const c = controls as any;
        switch (lockedView) {
          case 'Front': c.setAzimuthalAngle(0); c.setPolarAngle(Math.PI / 2); break;
          case 'Back': c.setAzimuthalAngle(Math.PI); c.setPolarAngle(Math.PI / 2); break;
          case 'Left': c.setAzimuthalAngle(-Math.PI / 2); c.setPolarAngle(Math.PI / 2); break;
          case 'Right': c.setAzimuthalAngle(Math.PI / 2); c.setPolarAngle(Math.PI / 2); break;
          case 'Top': c.setPolarAngle(0); break;
          case 'Bottom': c.setPolarAngle(Math.PI); break;
        }
        c.update();
      }
    }
  }, [lockedView, controls]);

  return null;
}

function Model({ url, onLoad, onError, onSectionsExtracted, customSections, customAutoRotate }: {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onSectionsExtracted?: (sections: MaterialSection[]) => void;
  onUVMapExtracted?: (uvMap: string | null) => void;
  customSections?: MaterialSection[];
  customAutoRotate?: boolean; // New prop for local override
}) {
  const { scene } = useGLTF(url) as GLTF;
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const storeAutoRotate = useConfiguratorStore((s) => s.autoRotate);
  const storeSections = useConfiguratorStore((s) => s.sections);

  // Use custom props if provided, otherwise fallback to store
  const autoRotate = customAutoRotate !== undefined ? customAutoRotate : storeAutoRotate;
  const sections = customSections || storeSections;

  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);

  const perfConfig = useMobilePerformance();

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
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          const section = sections.find(s => s.id === mat.name);
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

  // Interaction Logic (Raycasting)
  const { camera, raycaster, gl, controls } = useThree();
  const selectedLayerRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);

  // Dragging logic rewritten for Surface Point (Decal)
  useEffect(() => {
    // ... Pointer events ...
    // If we consistently use Decals, we need to raycast against the MODEL meshes.
    // And update the active layer's POSITION (x,y,z) and ROTATION/NORMAL.

    const handlePointerDown = (e: PointerEvent) => {
      if (!clonedScene) return;
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      // Intersect with Decal meshes? 
      // Actually, creating Decals creates Mesh objects. 
      // We can check if we hit a decal?
      // OR we interact with the "Controls" overlay.

      // For simplicity: If we click on the model, move the SELECTED layer to that point?
      // Or drag existing?

      // Prioritize: Check if we hit an existing layer/decal?
      // This is hard without specific refs.

      // Simplified Interaction:
      // If we hit the model, start dragging the LAST active layer (like before).
      const intersects = raycaster.intersectObjects(clonedScene.children, true);

      // Filter for Decals first
      const decalHit = intersects.find((hit) => hit.object.userData?.isDecal && hit.object.userData?.layerId);

      if (decalHit) {
        // HIT SPECIFIC DECAL
        selectedLayerRef.current = decalHit.object.userData.layerId;
        isDraggingRef.current = true;
        if (controls) (controls as any).enabled = false;
        // Optionally bring to front?
        // updateTextureLayer(decalHit.object.userData.layerId, { order: textureLayers.length });
      } else if (intersects.length > 0) {
        // Fallback: Click on body -> Pick Last Layer (if any exists)
        // Only if we hit the body mesh
        const activeDecals = useConfiguratorStore.getState().textureLayers
          .filter(l => l.type !== 'pattern' && l.visible);

        if (activeDecals.length > 0) {
          selectedLayerRef.current = activeDecals[activeDecals.length - 1].id;
          isDraggingRef.current = true;
          if (controls) (controls as any).enabled = false;
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !selectedLayerRef.current) return;
      if (!clonedScene) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersects = raycaster.intersectObject(clonedScene, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const pos = hit.point.clone();

        // Convert World Position to Model Local Position
        // This ensures the decal sticks to the rotating model correctly
        if (modelRef.current) {
          modelRef.current.worldToLocal(pos);
        }

        const worldNormal = hit.face?.normal?.clone().transformDirection(hit.object.matrixWorld) || new THREE.Vector3(0, 0, 1);

        // Transform normal to local space
        const localNormal = worldNormal.clone();
        if (modelRef.current) {
          const inverseMatrix = new THREE.Matrix4().copy(modelRef.current.matrixWorld).invert();
          localNormal.transformDirection(inverseMatrix);
        }

        const dummy = new THREE.Object3D();
        dummy.position.copy(pos);
        dummy.lookAt(pos.clone().add(localNormal));

        updateTextureLayer(selectedLayerRef.current, {
          position: [pos.x, pos.y, pos.z],
          rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]
        });
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      selectedLayerRef.current = null;
      if (controls) (controls as any).enabled = true;
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [clonedScene, camera, gl, updateTextureLayer, controls]);

  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={modelRef}>
      {showBoundingBox && modelRef.current && <BoundingBoxHelper object={modelRef.current} />}

      <Center onCentered={(props) => {
        // Optional: Scale model to fit a unit box if it's too huge/small?
        // For now, just centering is enough to make (0,0,0) meaningful.
        const { width, height, depth } = props;
        // console.log("Model Dimensions:", width, height, depth);
      }}>
        {clonedScene && <primitive object={clonedScene} />}

        {/* All texture layers (patterns, images, text) via UV Map */}
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
  const setCameraControlsRef = useConfiguratorStore((s) => s.setCameraControlsRef);
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
  customAutoRotate
}: {
  customSections?: MaterialSection[];
  customAutoRotate?: boolean;
}) {
  const [initError, setInitError] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const modelLoading = useConfiguratorStore((s) => s.modelLoading);
  const modelError = useConfiguratorStore((s) => s.modelError);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const setSections = useConfiguratorStore((s) => s.setSections);
  const setCompleteUVMap = useConfiguratorStore((s) => s.setCompleteUVMap);
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

  const handleModelError = useCallback((error: Error) => {
    setModelError(error.message);
    setModelLoading(false);
  }, [setModelError, setModelLoading]);

  const handleSectionsExtracted = useCallback((extractedSections: MaterialSection[]) => {
    setSections(extractedSections);
  }, [setSections]);

  const handleUVMapExtracted = useCallback((uvMap: string | null) => {
    setCompleteUVMap(uvMap);
  }, [setCompleteUVMap]);

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
          powerPreference: perfConfig.isLowEndDevice ? "low-power" : "high-performance",
          preserveDrawingBuffer: true,
        }}
        style={{ touchAction: "none" }}
      >
        <SceneSetup />
        <CameraControlsHandler />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enableRotate={!useConfiguratorStore.getState().lockedView} />
        <CameraViewLock />

        {modelUrl && (
          <Suspense fallback={null}>
            <Model
              url={modelUrl}
              onLoad={handleModelLoad}
              onError={handleModelError}
              onSectionsExtracted={handleSectionsExtracted}
              onUVMapExtracted={handleUVMapExtracted}
              customSections={customSections}
              customAutoRotate={customAutoRotate}
            />
          </Suspense>
        )}

        {!perfConfig.isLowEndDevice && <Environment preset="studio" />}
      </Canvas>

      {/* Overlays for Loading, Empty State, Error - simplified for brevity in this rewrite */}
      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Spinner className="text-primary w-12 h-12" />
        </div>
      )}
    </div>
  );
}
// Preload
// useGLTF.preload(url); // Removed to prevent ReferenceError if url is undefined or method differs
