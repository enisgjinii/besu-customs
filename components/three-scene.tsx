"use client";

import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, Decal, useTexture, TransformControls } from "@react-three/drei";
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

// UV Texture Compositor Component
function TextureCompositor({ scene }: { scene: THREE.Group }) {
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
  const [canvas] = useState(() => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 2048;
    return c;
  });
  const [texture] = useState(() => new THREE.CanvasTexture(canvas));

  const selectedLayerRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);

  // 1. Compose layers onto the canvas whenever they change
  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background with white to ensure model takes base color (tinted)
    // instead of being invisible if texture was transparent
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Check if we have any layers
    const activeLayers = textureLayers.filter(l => l.visible);

    // Always update texture even if empty (to ensure white background)
    texture.needsUpdate = true;

    if (activeLayers.length === 0) {
      return;
    }

    let imagesLoaded = 0;
    activeLayers.forEach(layer => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = layer.imageUrl!;

      const draw = () => {
        // Position is now UV coordinates (0-1)
        const u = layer.position ? layer.position[0] : 0.5;
        const v = layer.position ? layer.position[1] : 0.5;

        const x = u * canvas.width;
        // Invert V for canvas (0 at top) vs UV (0 at bottom)
        const y = (1 - v) * canvas.height;

        // Scale relative to canvas size
        const scale = layer.scale ? layer.scale[0] : 0.3;
        const width = canvas.width * scale;
        const height = width * (img.height / img.width);

        const angle = layer.rotation ? layer.rotation[2] : 0;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();

        imagesLoaded++;
        if (imagesLoaded === activeLayers.length) {
          texture.needsUpdate = true;
        }
      };

      img.onload = draw;
      if (img.complete && img.src.startsWith('data:')) {
        draw();
      }
    });

  }, [textureLayers, canvas, texture]);

  // 2. Apply the dynamic texture to the model
  useEffect(() => {
    if (!scene) return;

    texture.flipY = false;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.transparent = false; // Opaque to ensure visibility
        material.needsUpdate = true;
      }
    });
  }, [scene, texture]);

  // 1. Texture Compositor Fix for Dragging
  const { camera, raycaster, gl, controls } = useThree();

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // ... existing pointer down logic ...
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.uv) {
          const layers = useConfiguratorStore.getState().textureLayers;
          // Reverse check to pick topmost visible layer at this UV? 
          // For now simple last-added logic:
          if (layers.length > 0) {
            const topLayer = layers[layers.length - 1];
            selectedLayerRef.current = topLayer.id;
            isDraggingRef.current = true;
            if (controls) (controls as any).enabled = false; // Disable controls
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !selectedLayerRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        updateTextureLayer(selectedLayerRef.current, {
          position: [uv.x, uv.y, 0]
        });
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        selectedLayerRef.current = null;
        if (controls) (controls as any).enabled = true; // Re-enable controls
      }
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [scene, camera, gl, updateTextureLayer, controls]);

  return null;
}

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

function Model({
  url,
  onLoad,
  onError,
  onSectionsExtracted,
  onUVMapExtracted,
}: {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onSectionsExtracted?: (sections: MaterialSection[]) => void;
  onUVMapExtracted?: (uvMap: string | null) => void;
}) {
  const { scene } = useGLTF(url);
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const sections = useConfiguratorStore((s) => s.sections); // Add sections subscription
  const globalCustomTexture = useConfiguratorStore((s) => s.globalCustomTexture);
  const perfConfig = useMobilePerformance();

  // ... refs ...
  const onSectionsExtractedRef = useRef(onSectionsExtracted);
  const onUVMapExtractedRef = useRef(onUVMapExtracted);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onSectionsExtractedRef.current = onSectionsExtracted;
    onUVMapExtractedRef.current = onUVMapExtracted;
    onLoadRef.current = onLoad;
  }, [onSectionsExtracted, onUVMapExtracted, onLoad]);

  useEffect(() => {
    if (scene) {
      // ... (existing clone logic) ...
      const cloned = scene.clone(true);
      const box = new THREE.Box3().setFromObject(cloned);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;

      cloned.position.sub(center.multiplyScalar(scale));
      cloned.scale.setScalar(scale);

      setClonedScene(cloned);

      // ... extract sections ...
      setTimeout(() => {
        if (cloned) {
          const sections = extractSectionsFromThreeModel(cloned, url);
          onSectionsExtractedRef.current?.(sections);
          onLoadRef.current?.();
        }
      }, 0);
    }
  }, [scene, url]);

  // Sync Sections Colors to 3D Mesh Materials
  useEffect(() => {
    if (!clonedScene || sections.length === 0) return;

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Try to find matching section by ID (child.uuid) or Name
        // Assuming extractSections matched them previously
        const section = sections.find(s => s.id === child.uuid || s.name === child.name);

        if (section && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (section.color) {
            mat.color.set(section.color);
          }
          // We ignore customTexture here because TextureCompositor handles it globally via maps
          mat.needsUpdate = true;
        }
      }
    });
  }, [clonedScene, sections]);

  // Legacy Global Texture logic (keep as fallback or remove if confusing)
  // ...

  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={modelRef}>
      {showBoundingBox && modelRef.current && <BoundingBoxHelper object={modelRef.current} />}
      {clonedScene && <primitive object={clonedScene} />}
      {/* Texture Compositor for Multi-layer drawing */}
      {clonedScene && <TextureCompositor scene={clonedScene} />}
    </group>
  );
}

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
export function ThreeScene() {
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
    setModelLoading(true);
    setModelError(null);

    getBestModelUrl(currentModelUrl, 'auto')
      .then(({ url, quality }) => {
        console.log(`📦 Loading ${quality} quality: ${url}`);
        setModelUrl(url);
      })
      .catch((error) => {
        console.error("Failed to determine model URL:", error);
        setModelUrl(currentModelUrl);
      });
  }, [currentModelUrl, setModelLoading, setModelError]);

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

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        <CameraViewLock />

        {modelUrl && (
          <Suspense fallback={null}>
            <Model
              url={modelUrl}
              onLoad={handleModelLoad}
              onError={handleModelError}
              onSectionsExtracted={handleSectionsExtracted}
              onUVMapExtracted={handleUVMapExtracted}
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
useGLTF.preload;
