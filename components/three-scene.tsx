"use client";

import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, useProgress, Decal, useTexture } from "@react-three/drei";
import { useConfiguratorStore, TextureLayer, MaterialSection } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import { ClearCacheButton } from "@/components/clear-cache-button";
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

// Decal Component
function DraggableDecal({
  layer,
  isSelected,
}: {
  layer: TextureLayer;
  isSelected?: boolean;
}) {
  const texture = useTexture(layer.imageUrl!);

  // Position, rotation, scale defaults
  const pos: [number, number, number] = layer.position || [0, 0, 0.1];
  const rot: [number, number, number] = layer.rotation || [0, 0, 0];
  const scale: [number, number, number] = layer.scale || [1, 1, 1];

  return (
    <Decal
      position={pos}
      rotation={rot}
      scale={scale}
      map={texture}
      debug={isSelected}
    >
      <meshStandardMaterial
        transparent
        polygonOffset
        polygonOffsetFactor={-1}
        map={texture}
        toneMapped={false}
        depthTest={true}
        depthWrite={false}
      />
    </Decal>
  );
}

// Decal Manager Component - using Portal to render inside target mesh
function DecalManager({ scene }: { scene: THREE.Group }) {
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const [targetMesh, setTargetMesh] = useState<THREE.Mesh | null>(null);

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
        <DraggableDecal
          key={layer.id}
          layer={layer}
          isSelected={false} // Selection logic deferred
        />
      ))}
    </>,
    targetMesh
  );
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

  const sections = useConfiguratorStore((s) => s.sections);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const globalCustomTexture = useConfiguratorStore((s) => s.globalCustomTexture);
  const perfConfig = useMobilePerformance();

  // Clone scene on first load
  useEffect(() => {
    if (!scene) return;
    clonedScene.current = scene.clone(true);

    // Extract stuff
    const extractedSections = extractSectionsFromThreeModel(clonedScene.current, url);
    onSectionsExtracted?.(extractedSections);

    const uvMap = extractUVMapFromThreeModel(clonedScene.current, 2048, 2048);
    onUVMapExtracted?.(uvMap);

    console.log("✅ Model cloned and sections extracted");
  }, [scene, url, onSectionsExtracted, onUVMapExtracted]);

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
      const targetSize = 4;
      const scale = maxDim > 0 ? targetSize / maxDim : 1;
      group.scale.setScalar(scale);

      const cameraDistance = targetSize * 2;
      camera.position.set(cameraDistance, cameraDistance * 0.5, cameraDistance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    onLoad?.();
  }, [scene, camera, onLoad]);

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
