"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import { applyMaterialUpdates, extractSections } from "@/lib/model-utils";
import { useConfiguratorStore, MaterialSection } from "@/lib/store";
import { TextureDecal } from "@/components/texture-decal";
import {
  EntranceAnimation,
  useCameraEntrance,
  ParticleEffect,
} from "@/components/entrance-animation";

// Preload frequently used models for faster loading
useGLTF.preload("/models/Backpack.glb");

type Props = { controlsRef?: React.RefObject<unknown> };

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
  controlsRef?: React.RefObject<unknown>;
}) {
  const setSections = useConfiguratorStore((s) => s.setSections);
  const setUVMap = useConfiguratorStore((s) => s.setUVMap);
  const setCompleteUVMap = useConfiguratorStore((s) => s.setCompleteUVMap);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const sections = useConfiguratorStore((s) => s.sections);
  const decals = useConfiguratorStore((s) => s.decals);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const entranceAnimation = useConfiguratorStore((s) => s.entranceAnimation);
  const enableEntranceAnimation = useConfiguratorStore(
    (s) => s.enableEntranceAnimation,
  );
  const { invalidate } = useThree();
  const defaultMeshRef = useRef<THREE.Mesh | null>(null);

  // Use camera entrance animation
  useCameraEntrance(enableEntranceAnimation ? entranceAnimation : "fadeIn");

  const gltf = useGLTF(url) as unknown as GLTF & {
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
      // Don't clear sections immediately - preserve them until we have new ones
      // setSections([]);

      try {
        const resp = await fetch(
          `/api/materials?model=${encodeURIComponent(url)}`,
        );
        if (!mounted) return;

        if (!resp.ok) {
          // No precomputed materials - fall back to extracting sections from the model client-side
          const clientSections = extractSections(clonedScene.current, url);
          if (!mounted) return;
          setSections(clientSections);

          try {
            applyMaterialUpdates(clonedScene.current, clientSections);
          } catch (e) {
            console.debug("applyMaterialUpdates failed (clientSections):", e);
          }

          return;
        }

        const json = await resp.json();
        if (!json?.sections) {
          // If the API returned no sections, also fall back to client extraction
          console.warn(
            "Precomputed response had no sections, falling back to client-side extraction",
          );
          const clientSections = extractSections(clonedScene.current, url);
          if (!mounted) return;
          setSections(clientSections);

          try {
            applyMaterialUpdates(clonedScene.current, clientSections);
          } catch (e) {
            console.debug("applyMaterialUpdates failed (clientSections):", e);
          }

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

        // Special handling for volleyball models - create individual materials for each mesh/material
        const isVolleyballModel = url.includes("Volleyball");

        let mappedSections: MaterialSection[];

        if (isVolleyballModel) {
          // For volleyball short sleeve tops, we want individual control over each mesh
          // even when they share the same underlying material
          const meshNameMap = new Map<string, THREE.Mesh>();

          // Collect all meshes by name
          clonedScene.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name) {
              meshNameMap.set(child.name, child);
            }
          });

          mappedSections = (json.sections as MaterialSection[]).map(
            (section) => {
              // Handle combined sections (like Arm Sleeves) - collect material IDs
              if (
                section.combinedOriginalNames &&
                section.combinedOriginalNames.length > 1
              ) {
                const materialIds: string[] = [];

                // Create unique materials for each mesh in the combined section
                section.combinedOriginalNames.forEach((originalName) => {
                  const mesh = meshNameMap.get(originalName);
                  if (mesh) {
                    // Create a unique material for this mesh by cloning its current material
                    const originalMaterial =
                      mesh.material as THREE.MeshStandardMaterial;
                    const newMaterial = originalMaterial.clone();
                    newMaterial.name = `${originalName}_unique`;

                    // Replace the mesh's material with the new unique material
                    mesh.material = newMaterial;
                    materialIds.push(newMaterial.uuid);
                  }
                });

                if (materialIds.length > 0) {
                  return {
                    ...section,
                    id: materialIds[0], // Use first material as primary ID
                    combinedMaterialIds: materialIds, // Store all material IDs
                  };
                }
              }

              // First, try to find a mesh with this name
              const mesh = meshNameMap.get(section.originalName);
              if (mesh) {
                // Create a unique material for this mesh by cloning its current material
                const originalMaterial =
                  mesh.material as THREE.MeshStandardMaterial;
                const newMaterial = originalMaterial.clone();
                newMaterial.name = `${section.originalName}_unique`;

                // Replace the mesh's material with the new unique material
                mesh.material = newMaterial;

                return {
                  ...section,
                  id: newMaterial.uuid,
                  // Name is already renamed in the API response
                };
              }

              // If no mesh found with this name, try to find by material name (for long sleeve tops)
              const material = materialNameMap.get(section.originalName);
              if (material) {
                return {
                  ...section,
                  id: material.uuid,
                  // Name is already renamed in the API response
                };
              }

              // If neither found, keep the section but log a warning
              console.warn(
                `Neither mesh nor material found for section: ${section.name} (${section.originalName})`,
              );
              return section;
            },
          );
        } else {
          // Normal mapping logic for other models
          mappedSections = (json.sections as MaterialSection[]).map(
            (section) => {
              // Handle combined sections (like zipper stoppers)
              if (
                section.combinedOriginalNames &&
                section.combinedOriginalNames.length > 1
              ) {
                // Find all materials that match the combined original names
                const matchingMaterials: string[] = [];
                section.combinedOriginalNames.forEach(
                  (originalName: string) => {
                    const material = materialNameMap.get(originalName);
                    if (material) {
                      matchingMaterials.push(material.uuid);
                    }
                  },
                );

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
        }

        // Merge with existing sections to preserve customTexture
        // IMPORTANT: Get the LATEST state right before setting, not at the start of load()
        // This prevents race conditions where UV editor updates happen during model loading
        const existingSections = useConfiguratorStore.getState().sections;

        // Build a map of existing textures by originalName
        const existingTextureMap = new Map<string, string>();
        const existingByOriginalName = new Map<string, MaterialSection>();

        existingSections.forEach((s) => {
          existingByOriginalName.set(s.originalName, s);
          if (s.customTexture) {
            existingTextureMap.set(s.originalName, s.customTexture);
          }
        });

        // Merge mapped sections with existing data, preserving customTexture and other user changes
        const mergedSections = mappedSections.map((section) => {
          const existing = existingByOriginalName.get(section.originalName);
          if (existing) {
            // Preserve user-modified fields from existing section
            const merged = {
              ...section, // New structure from JSON (id, name, etc.)
              customTexture: existing.customTexture, // Preserve texture
              color: existing.color, // Preserve color changes
              roughness: existing.roughness, // Preserve material changes
              metalness: existing.metalness,
              wireframe: existing.wireframe,
              gradient: existing.gradient,
            };
            return merged;
          }
          return section;
        });

        setSections(mergedSections);

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
        const controls = controlsRef.current as {
          target: { set: (x: number, y: number, z: number) => void };
          update: () => void;
        };
        controls.target.set(0, 0, 0);
        controls.update();
      }
    } catch (err) {
      console.warn("Fit-to-view failed:", err);
    }
  }, [url, controlsRef]);

  useEffect(() => {
    if (!clonedScene.current) return;

    console.log(`🔄 Model Loader: Sections changed, count=${sections.length}`);

    if (sections.length === 0) {
      console.log("⚠️ Model Loader: No sections, skipping material update");
      return;
    }

    // Log sections with custom textures
    const sectionsWithTextures = sections.filter((s) => s.customTexture);
    console.log(
      `🖼️ Model Loader: ${sectionsWithTextures.length} sections have custom textures`,
    );
    sectionsWithTextures.forEach((s) => {
      console.log(
        `  - ${s.name}: texture length = ${s.customTexture?.length || 0}`,
      );
    });

    try {
      // Re-map section IDs to current material UUIDs by matching originalName
      // This is necessary because material UUIDs can change between renders
      const materialsByOriginalName = new Map<
        string,
        THREE.MeshStandardMaterial
      >();
      clonedScene.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial && mat.name) {
              materialsByOriginalName.set(mat.name, mat);
            }
          });
        }
      });

      console.log(
        `🎭 Model Loader: Found ${materialsByOriginalName.size} materials in scene`,
      );

      // Create remapped sections with current material UUIDs
      const remappedSections = sections.map((section: MaterialSection) => {
        const currentMaterial = materialsByOriginalName.get(
          section.originalName,
        );
        if (currentMaterial) {
          return { ...section, id: currentMaterial.uuid };
        }
        return section;
      });

      console.log(`⚙️ Model Loader: Applying material updates...`);
      applyMaterialUpdates(clonedScene.current, remappedSections);
      console.log(`✅ Model Loader: Material updates applied`);

      // Force Three.js to re-render the scene
      invalidate();
    } catch (e) {
      console.error("❌ Model Loader: Material update error:", e);
    }
  }, [sections]);

  // Get the main mesh from the scene for decal projection
  useEffect(() => {
    if (!clonedScene.current) return;
    clonedScene.current.traverse((child) => {
      if (child instanceof THREE.Mesh && !defaultMeshRef.current) {
        defaultMeshRef.current = child;
      }
    });
  }, [clonedScene]);

  return (
    <>
      {enableEntranceAnimation ? (
        <EntranceAnimation animationType={entranceAnimation}>
          <primitive object={clonedScene.current} />
          {decals.map((decal) => {
            let targetMesh: THREE.Mesh | null = null;
            if (decal.meshUuid) {
              clonedScene.current.traverse((child) => {
                if (
                  !targetMesh &&
                  child instanceof THREE.Mesh &&
                  child.uuid === decal.meshUuid
                ) {
                  targetMesh = child;
                }
              });
            }
            if (!targetMesh) return null;

            return (
              <TextureDecal
                key={decal.id}
                textureUrl={decal.textureUrl}
                position={decal.position}
                rotation={decal.rotation}
                scale={decal.scale}
                mesh={targetMesh}
              />
            );
          })}
        </EntranceAnimation>
      ) : (
        <>
          <primitive object={clonedScene.current} />
          {decals.map((decal) => {
            let targetMesh: THREE.Mesh | null = null;
            if (decal.meshUuid) {
              clonedScene.current.traverse((child) => {
                if (
                  !targetMesh &&
                  child instanceof THREE.Mesh &&
                  child.uuid === decal.meshUuid
                ) {
                  targetMesh = child;
                }
              });
            }
            if (!targetMesh) return null;

            return (
              <TextureDecal
                key={decal.id}
                textureUrl={decal.textureUrl}
                position={decal.position}
                rotation={decal.rotation}
                scale={decal.scale}
                mesh={targetMesh}
              />
            );
          })}
        </>
      )}
      {enableEntranceAnimation && <ParticleEffect />}
    </>
  );
}

export default ModelLoader;
