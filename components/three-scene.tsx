"use client";

import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, useProgress, Decal, useTexture } from "@react-three/drei";
import { useConfiguratorStore, TextureLayer, MaterialSection } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import { detectConnectionSpeed, getBestModelUrl, type LoadingProgress } from "@/lib/model-loader-optimized";
import { extractSectionsFromThreeModel, applyMaterialsToThreeModel, extractUVMapFromThreeModel } from "@/lib/three-material-utils";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

// Loading progress component
function LoadingProgress({ onProgress }: { onProgress: (progress: LoadingProgress) => void }) {
  const { progress, active } = useProgress();
  const speed = detectConnectionSpeed();
  const onProgressRef = useRef(onProgress);
  const previousProgressRef = useRef<number>(-1);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    if (active && progress !== previousProgressRef.current) {
      previousProgressRef.current = progress;
      queueMicrotask(() => {
        onProgressRef.current({
          stage: progress < 50 ? 'loading-low' : 'loading-high',
          percent: progress,
          bytesLoaded: 0,
          bytesTotal: 0,
          connectionSpeed: speed,
        });
      });
    }
  }, [progress, active, speed]);

  return null;
}

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

// Interactive Decal with drag/scale/rotate support
function DraggableDecal({
  layer,
  isSelected,
  onSelect,
}: {
  layer: TextureLayer;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const texture = useTexture(layer.imageUrl!);
  const meshRef = useRef<THREE.Mesh>(null);
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);

  // Improve texture quality
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // Position, rotation, scale defaults  
  const pos: [number, number, number] = layer.position || [0, 0, 0.5];
  const rot: [number, number, number] = layer.rotation || [0, 0, 0];
  const scl: [number, number, number] = layer.scale || [0.5, 0.5, 0.5];

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <Decal
      ref={meshRef}
      position={pos}
      rotation={rot}
      scale={scl}
      map={texture}
      onClick={handleClick}
    >
      <meshStandardMaterial
        transparent
        polygonOffset
        polygonOffsetFactor={-1}
        map={texture}
        toneMapped={false}
        depthTest={true}
        depthWrite={false}
        opacity={isSelected ? 1 : 0.95}
      />
    </Decal>
  );
}

// Decal Manager Component - using Portal to render inside target mesh
function DecalManager({ scene }: { scene: THREE.Group }) {
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const [targetMesh, setTargetMesh] = useState<THREE.Mesh | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!scene) return;
    // Find the best mesh to attach decals to (largest by bounding sphere)
    let maxRadius = 0;
    let bestMesh: THREE.Mesh | null = null;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
        const radius = child.geometry.boundingSphere?.radius || 0;
        if (radius > maxRadius) {
          maxRadius = radius;
          bestMesh = child;
        }
      }
    });

    if (bestMesh) setTargetMesh(bestMesh);
  }, [scene]);

  // If no mesh found, we can't project
  if (!targetMesh) return <group />;

  const decalLayers = textureLayers.filter(
    (layer) => layer.type === "image" && layer.visible && layer.imageUrl
  );

  return createPortal(
    <>
      {decalLayers.map((layer) => (
        <Suspense key={layer.id} fallback={null}>
          <DraggableDecal
            layer={layer}
            isSelected={layer.id === selectedLayerId}
            onSelect={() => setSelectedLayerId(layer.id === selectedLayerId ? null : layer.id)}
          />
        </Suspense>
      ))}
    </>,
    targetMesh
  );
}

// Camera View Lock Component
function CameraViewLock() {
  const lockedView = useConfiguratorStore((s) => s.lockedView);
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!lockedView || !controls) return;

    const orbitControls = controls as any; // OrbitControls type
    const distance = 5;

    // Position camera based on view
    const positions: Record<string, [number, number, number]> = {
      "Front": [0, 0, distance],
      "Back": [0, 0, -distance],
      "Left": [-distance, 0, 0],
      "Right": [distance, 0, 0],
      "Top": [0, distance, 0],
      "Bottom": [0, -distance, 0],
    };

    const pos = positions[lockedView];
    if (pos) {
      camera.position.set(pos[0], pos[1], pos[2]);
      camera.lookAt(0, 0, 0);

      // Disable rotation when locked
      if (orbitControls.enableRotate !== undefined) {
        orbitControls.enableRotate = false;
      }
    }

    return () => {
      // Re-enable rotation when unlocked
      if (orbitControls.enableRotate !== undefined) {
        orbitControls.enableRotate = true;
      }
    };
  }, [lockedView, camera, controls]);

  return null;
}

// Model component
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
  const { scene } = useGLTF(url) as GLTF & { scene: THREE.Group };
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const clonedScene = useRef<THREE.Group | null>(null);

  // Use refs for callbacks to prevent setState during render issues
  const onSectionsExtractedRef = useRef(onSectionsExtracted);
  const onUVMapExtractedRef = useRef(onUVMapExtracted);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onSectionsExtractedRef.current = onSectionsExtracted;
    onUVMapExtractedRef.current = onUVMapExtracted;
    onLoadRef.current = onLoad;
  }, [onSectionsExtracted, onUVMapExtracted, onLoad]);

  const sections = useConfiguratorStore((s) => s.sections);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const globalCustomTexture = useConfiguratorStore((s) => s.globalCustomTexture);
  const perfConfig = useMobilePerformance();

  // Clone scene on first load
  useEffect(() => {
    if (!scene) return;
    clonedScene.current = scene.clone(true);

    // Use setTimeout to defer state updates to next tick
    setTimeout(() => {
      if (clonedScene.current) {
        const extractedSections = extractSectionsFromThreeModel(clonedScene.current, url);
        onSectionsExtractedRef.current?.(extractedSections);

        const uvMap = extractUVMapFromThreeModel(clonedScene.current, 2048, 2048);
        onUVMapExtractedRef.current?.(uvMap);
      }
    }, 0);

    console.log("✅ Model cloned and sections extracted");
  }, [scene, url]);

  // Center and scale model
  useEffect(() => {
    if (!modelRef.current || !clonedScene.current) return;

    const group = modelRef.current;
    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);
    group.rotation.set(0, 0, 0);

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    group.add(clonedScene.current);
    group.updateMatrixWorld(true);

    const boundingBox = new THREE.Box3().setFromObject(group);
    if (!boundingBox.isEmpty()) {
      const boxCenter = new THREE.Vector3();
      const boxSize = new THREE.Vector3();
      boundingBox.getCenter(boxCenter);
      boundingBox.getSize(boxSize);

      clonedScene.current.position.sub(boxCenter);

      const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
      const targetSize = 5;
      const scale = maxDim > 0 ? targetSize / maxDim : 1;
      group.scale.setScalar(scale);

      const cameraDistance = targetSize * 1.0; // Tighter zoom (was 1.5)
      camera.position.set(cameraDistance, cameraDistance * 0.4, cameraDistance); // Lower angle slightly
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    onLoadRef.current?.();
  }, [scene, camera]);

  // Apply materials
  useEffect(() => {
    if (!clonedScene.current || sections.length === 0) return;
    applyMaterialsToThreeModel(clonedScene.current, sections);
  }, [sections]);

  // Apply global texture
  useEffect(() => {
    if (!clonedScene.current || !globalCustomTexture) return;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(globalCustomTexture);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = perfConfig.isLowEndDevice ? 4 : 16;

    clonedScene.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            const originalColor = material.color.clone();
            material.map = texture;
            material.color = originalColor;
            if (originalColor.getHex() !== 0xffffff) {
              material.emissive = originalColor.clone().multiplyScalar(0.15);
            }
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [globalCustomTexture, perfConfig.isLowEndDevice]);

  // Auto-rotation
  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={modelRef}>
      {showBoundingBox && modelRef.current && <BoundingBoxHelper object={modelRef.current} />}
      {/* Helper to render decals inside the cloned scene's main mesh */}
      {clonedScene.current && <DecalManager scene={clonedScene.current} />}
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
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
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
    setLoadingProgress({
      stage: 'detecting',
      percent: 0,
      bytesLoaded: 0,
      bytesTotal: 0,
      connectionSpeed: detectConnectionSpeed(),
    });

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
    setLoadingProgress(null);
  }, [setModelLoading]);

  const handleModelError = useCallback((error: Error) => {
    setModelError(error.message);
    setModelLoading(false);
    setLoadingProgress(null);
  }, [setModelError, setModelLoading]);

  const handleSectionsExtracted = useCallback((extractedSections: MaterialSection[]) => {
    // Reuse logic for API fetching if needed, for now just set
    setSections(extractedSections);
  }, [setSections]);

  const handleUVMapExtracted = useCallback((uvMap: string | null) => {
    setCompleteUVMap(uvMap);
  }, [setCompleteUVMap]);

  const handleProgress = useCallback((progress: LoadingProgress) => {
    setLoadingProgress(progress);
  }, []);

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
        <LoadingProgress onProgress={handleProgress} />

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
