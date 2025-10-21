"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { extractUVMapForMaterial, extractCompleteUVMap } from "@/lib/uv-utils";
import { applyMaterialUpdates } from "@/lib/model-utils";
import { useConfiguratorStore, MaterialSection } from "@/lib/store";

// Preload frequently used models for faster loading
useGLTF.preload("/models/Backpack.glb");

type Props = { controlsRef?: React.RefObject<OrbitControls> };

export function ModelLoader({ controlsRef }: Props) {
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);

  // Don't render anything if no model is selected
  if (!currentModelUrl) {
    return null;
  }

  return <Model url={currentModelUrl} controlsRef={controlsRef} />;
}

function Model({
  url,
  controlsRef,
}: {
  url: string;
  controlsRef?: React.RefObject<OrbitControls>;
}) {
  const setSections = useConfiguratorStore((s) => s.setSections);
  const setUVMap = useConfiguratorStore((s) => s.setUVMap);
  const setCompleteUVMap = useConfiguratorStore((s) => s.setCompleteUVMap);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const sections = useConfiguratorStore((s) => s.sections);

  const gltf = useGLTF(url) as GLTF & {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
  };
  const scene = useMemo(
    () => gltf?.scene ?? gltf.scenes?.[0] ?? new THREE.Group(),
    [gltf],
  );
  const clonedScene = useRef<THREE.Group>(scene.clone());

  useEffect(() => {
    clonedScene.current = scene.clone();
  }, [scene, url]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setModelLoading(true);
      setModelError(null);
      setSections([]);

      try {
        const resp = await fetch(
          `/api/materials?model=${encodeURIComponent(url)}`,
        );
        if (!mounted) return;

        if (!resp.ok) {
          setSections([]);
          setModelError("No precomputed materials found for this model");
          return;
        }

        const json = await resp.json();
        if (!json?.sections) {
          setSections([]);
          setModelError("No precomputed materials found for this model");
          return;
        }

        // Map sections to actual materials in the model
        const materialsInModel: THREE.MeshStandardMaterial[] = [];
        clonedScene.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((material) => {
              if (material instanceof THREE.MeshStandardMaterial) {
                materialsInModel.push(material);
              }
            });
          }
        });

        // Create a mapping based on material names
        const materialNameMap = new Map<string, THREE.MeshStandardMaterial>();

        // Map materials by their actual names from the 3D model
        materialsInModel.forEach((material) => {
          // Three.js materials have a 'name' property that corresponds to the material name in the GLB file
          if (material.name) {
            materialNameMap.set(material.name, material);
          }
        });

        // Update section IDs to match material UUIDs
        const mappedSections = (json.sections as MaterialSection[]).map(
          (section) => {
            // Handle combined sections (like zipper stoppers)
            if (
              section.combinedOriginalNames &&
              section.combinedOriginalNames.length > 1
            ) {
              // Find all materials that match the combined original names
              const matchingMaterials: string[] = [];
              section.combinedOriginalNames.forEach((originalName: string) => {
                const material = materialNameMap.get(originalName);
                if (material) {
                  matchingMaterials.push(material.uuid);
                }
              });

              return {
                ...section,
                id: matchingMaterials[0] || section.id, // Use first material as primary ID
                combinedMaterialIds: matchingMaterials, // Store all material IDs
              };
            }

            // Find material by original name from the material name map
            const material = materialNameMap.get(section.originalName);

            if (material) {
              return { ...section, id: material.uuid };
            }

            // If no material found, keep the section but log a warning
            console.warn(
              `Material not found for section: ${section.name} (${section.originalName})`,
            );
            return section;
          },
        );

        setSections(mappedSections);

        try {
          const completeUV = extractCompleteUVMap(clonedScene.current);
          if (completeUV) setCompleteUVMap(completeUV);
        } catch (e) {
          console.debug("Failed to extract complete UV:", e);
        }

        for (const section of mappedSections) {
          try {
            const uv = extractUVMapForMaterial(clonedScene.current, section.id);
            if (uv) setUVMap(section.id, uv);
          } catch {
            // ignore
          }
        }

        try {
          applyMaterialUpdates(clonedScene.current, mappedSections);
        } catch (e) {
          console.debug("applyMaterialUpdates failed:", e);
        }
      } catch (err: unknown) {
        console.warn("ModelLoader: failed to fetch precomputed sections:", err);
        setSections([]);
        setModelError(
          err instanceof Error ? err.message : "Failed to load model materials",
        );
      } finally {
        if (mounted) setModelLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [
    url,
    setSections,
    setUVMap,
    setCompleteUVMap,
    setModelLoading,
    setModelError,
  ]);

  useEffect(() => {
    try {
      const box = new THREE.Box3().setFromObject(clonedScene.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      clonedScene.current.position.set(-center.x, -center.y, -center.z);

      if (maxDim > 0) {
        const desiredSize = 2.5;
        const scale = desiredSize / maxDim;
        clonedScene.current.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(clonedScene.current);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);
        clonedScene.current.position.sub(scaledCenter);
      }

      if (controlsRef?.current) {
        const controls = controlsRef.current;
        if (controls.target && typeof controls.target.set === "function") {
          controls.target.set(0, 0, 0);
        }
        if (typeof controls.update === "function") controls.update();
      }
    } catch (err) {
      console.warn("Fit-to-view failed:", err);
    }
  }, [url, controlsRef]);

  useEffect(() => {
    try {
      applyMaterialUpdates(clonedScene.current, sections);
    } catch (e) {
      console.error("Failed to apply material updates:", e);
    }
  }, [sections]);

  return <primitive object={clonedScene.current} />;
}

export default ModelLoader;
