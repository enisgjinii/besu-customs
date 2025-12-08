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

// UV Texture Compositor Component - RESTORED for Patterns
function TextureCompositor({ scene }: { scene: THREE.Group }) {
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  // We only care about PATTERNS here
  const patternLayers = textureLayers.filter(l => l.type === 'pattern');

  const [canvas] = useState(() => {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 2048;
    return c;
  });
  const [texture] = useState(() => new THREE.CanvasTexture(canvas));

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill white (neutral) - Color comes from Material.color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const activePatterns = patternLayers.filter(l => l.visible);

    if (activePatterns.length === 0) {
      texture.needsUpdate = true;
      return;
    }

    // Draw Patterns
    activePatterns.forEach(layer => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = layer.imageUrl!;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true;
      };
      // Handle data uri sync load if needed
      if (img.complete && img.src.startsWith('data:')) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true;
      }
    });
    texture.needsUpdate = true;

  }, [patternLayers, canvas, texture]);

  // Apply Texture to Material
  useEffect(() => {
    if (!scene) return;
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    const hasPattern = patternLayers.some(l => l.visible);

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (hasPattern) {
          mat.map = texture;
        } else {
          mat.map = null; // Clear map if no patterns
        }
        mat.needsUpdate = true;
      }
    });
  }, [scene, texture, patternLayers]);

  return null;
}

// Decal Component with userData for Raycasting
function LayerDecal({ layer, targetMesh }: { layer: TextureLayer; targetMesh: THREE.Mesh }) {
  const texture = useTexture(layer.imageUrl!);
  const { gl } = useThree();

  useEffect(() => {
    if (texture) {
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
    }
  }, [texture, gl]);

  const meshRef = useRef<THREE.Mesh>(null);

  // Basic Decal setup
  return (
    <Decal
      position={new THREE.Vector3(...(layer.position || [0, 0, 1]))}
      rotation={new THREE.Euler(...(layer.rotation || [0, 0, 0]))}
      scale={new THREE.Vector3(...(layer.scale || [0.3, 0.3, 1]))}
      mesh={targetMesh} // Target the passed mesh
    >
      <meshStandardMaterial
        ref={meshRef}
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-1 - (layer.order || 0)}
        depthTest={true}
        depthWrite={false}
        userData={{ isDecal: true, layerId: layer.id }} // CRITICAL: Identity for raycaster
      />
    </Decal>
  );
}

// ... (CameraViewLock is fine)

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

function Model({ url, onLoad, onError, onSectionsExtracted }: any) {
  const { scene } = useGLTF(url) as GLTF;
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group>(null);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const sections = useConfiguratorStore((s) => s.sections);
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

  // Find the primary mesh to stick decals to (or stick to all?)
  // Usually stick to the specific mesh that was hit. But for simplicity, stick to 'Body' if found, or first Mesh.
  // Actually, we can just iterate layers and stick them to a "Target Mesh" if we saved it.
  // If not, we scan children.

  const meshes: THREE.Mesh[] = [];
  if (clonedScene) {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
  }
  // Use first mesh as default target for decals for now (fallback)
  const targetMesh = meshes.length > 0 ? meshes[0] : null;

  return (
    <group ref={modelRef}>
      {showBoundingBox && modelRef.current && <BoundingBoxHelper object={modelRef.current} />}
      {clonedScene && <primitive object={clonedScene} />}

      {/* 1. Patterns via Texture Map (Base Layer) */}
      {clonedScene && <TextureCompositor scene={clonedScene} />}

      {/* 2. Images/Logos via Decals (Overlay Layer - Untinted) */}
      {targetMesh && textureLayers.map((layer) => (
        layer.visible && layer.imageUrl && layer.type !== 'pattern' && (
          <LayerDecal key={layer.id} layer={layer} targetMesh={targetMesh} />
        )
      ))}
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
