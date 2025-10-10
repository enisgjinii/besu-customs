"use client";

import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useConfiguratorStore } from "@/lib/store";
import { extractSections, applyMaterialUpdates } from "@/lib/model-utils";
import { extractUVMapForMaterial, extractCompleteUVMap } from "@/lib/uv-utils";
import * as THREE from "three";

export function ModelLoader({ controlsRef }: { controlsRef?: unknown }) {
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );

  // Use placeholder cube if no model
  const effectiveUrl = currentModelUrl || "/placeholder-model.glb";

  return <Model url={effectiveUrl} controlsRef={controlsRef} />;
}

function Model({ url, controlsRef }: { url: string; controlsRef?: unknown }) {
  const setSections = useConfiguratorStore((state) => state.setSections);
  const setUVMap = useConfiguratorStore((state) => state.setUVMap);
  const setCompleteUVMap = useConfiguratorStore(
    (state) =>
      (state as unknown as { setCompleteUVMap: (url: string | null) => void })
        .setCompleteUVMap,
  );
  const groupRef = useRef<THREE.Group>(null);

  // Load placeholder cube if URL doesn't exist
  const isPlaceholder = url === "/placeholder-model.glb";

  useEffect(() => {
    if (isPlaceholder && groupRef.current) {
      // Create a simple cube as placeholder
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: "#3b82f6",
        roughness: 0.5,
        metalness: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);

      groupRef.current.clear();
      groupRef.current.add(cube);

      // Extract sections from placeholder
      const newSections = extractSections(groupRef.current);
      setSections(newSections);

      // Extract complete UV map from entire model
      const completeUV = extractCompleteUVMap(groupRef.current);
      if (completeUV) {
        setCompleteUVMap(completeUV);
      }

      // Extract UV maps for each material section
      newSections.forEach((section) => {
        const uvMapUrl = extractUVMapForMaterial(groupRef.current!, section.id);
        if (uvMapUrl) {
          setUVMap(section.id, uvMapUrl);
        }
      });
    }
  }, [isPlaceholder, setSections, setUVMap, setCompleteUVMap]);

  if (isPlaceholder) {
    return <group ref={groupRef} />;
  }

  return <LoadedModel url={url} controlsRef={controlsRef} />;
}

function LoadedModel({
  url,
  controlsRef,
}: {
  url: string;
  controlsRef?: unknown;
}) {
  const { scene } = useGLTF(url);
  const sections = useConfiguratorStore((state) => state.sections);
  const setSections = useConfiguratorStore((state) => state.setSections);
  const setUVMap = useConfiguratorStore((state) => state.setUVMap);
  const setCompleteUVMap = useConfiguratorStore(
    (state) =>
      (state as unknown as { setCompleteUVMap: (url: string | null) => void })
        .setCompleteUVMap,
  );
  const setModelLoading = useConfiguratorStore(
    (state) => state.setModelLoading,
  );
  const setModelError = useConfiguratorStore((state) => state.setModelError);
  const clonedScene = useRef(scene.clone());

  useEffect(() => {
    // refresh cloned scene when url changes
    clonedScene.current = scene.clone();
  }, [url, scene]);

  // Extract sections on load and fit model to view
  useEffect(() => {
    setModelLoading(true);
    setModelError(null);

    try {
      const newSections = extractSections(clonedScene.current);
      setSections(newSections);

      // Extract complete UV map from entire model
      const completeUV = extractCompleteUVMap(clonedScene.current);
      if (completeUV) {
        setCompleteUVMap(completeUV);
      }

      // Extract UV maps for each material section from all meshes
      newSections.forEach((section) => {
        const uvMapUrl = extractUVMapForMaterial(
          clonedScene.current,
          section.id,
        );
        if (uvMapUrl) {
          setUVMap(section.id, uvMapUrl);
        }
      });

      // Aggressive centering: compute bounding box and force center to origin
      const box = new THREE.Box3().setFromObject(clonedScene.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);

      // Force model center to exact origin (0, 0, 0)
      clonedScene.current.position.set(-center.x, -center.y, -center.z);

      // Scale to fit nicely in viewport (2.5 units for bigger models)
      if (maxDim > 0) {
        const desiredSize = 2.5; // larger target for bigger models
        const scale = desiredSize / maxDim;
        clonedScene.current.scale.setScalar(scale);

        // Recalculate center after scaling
        const scaledBox = new THREE.Box3().setFromObject(clonedScene.current);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        // Apply correction to ensure perfect centering
        clonedScene.current.position.sub(scaledCenter);
      }

      // Lock controls to center with tighter constraints
      if (
        controlsRef &&
        (
          controlsRef as {
            current?: {
              target: { set: (x: number, y: number, z: number) => void };
              minDistance: number;
              maxDistance: number;
              update: () => void;
            };
          }
        ).current
      ) {
        const controls = (
          controlsRef as {
            current: {
              target: { set: (x: number, y: number, z: number) => void };
              minDistance: number;
              maxDistance: number;
              update: () => void;
            };
          }
        ).current;
        controls.target.set(0, 0, 0);
        controls.minDistance = 0.5;
        controls.maxDistance = 8;
        controls.update();
      }

      setModelLoading(false);
    } catch (err) {
      console.warn("Fit-to-view failed:", err);
      setModelError(
        err instanceof Error ? err.message : "Failed to load model",
      );
      setModelLoading(false);
    }
  }, [
    url,
    setSections,
    setUVMap,
    setCompleteUVMap,
    controlsRef,
    setModelLoading,
    setModelError,
  ]);

  // Apply material updates
  useEffect(() => {
    applyMaterialUpdates(clonedScene.current, sections);
  }, [sections]);

  return <primitive object={clonedScene.current} />;
}
