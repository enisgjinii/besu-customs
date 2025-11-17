"use client";

import React, { useEffect, useRef, useMemo } from "react";
import {
  Mesh,
  Material,
  Group,
  MeshStandardMaterial,
  Box3,
  Vector3,
  Euler,
  Texture,
  TextureLoader,
  SRGBColorSpace,
  Color,
} from "three";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import { extractSections } from "@/lib/model-utils";
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
  const sections = useConfiguratorStore((state) => state.sections);
  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const highlightedSectionId = useConfiguratorStore(
    (state) => state.highlightedSectionId,
  );
  const decals = useConfiguratorStore((state) => state.decals);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const entranceAnimation = useConfiguratorStore((s) => s.entranceAnimation);
  const enableEntranceAnimation = useConfiguratorStore(
    (s) => s.enableEntranceAnimation,
  );
  const { invalidate } = useThree();
  const defaultMeshRef = useRef<Mesh | null>(null);

  // Use camera entrance animation
  useCameraEntrance(enableEntranceAnimation ? entranceAnimation : "fadeIn");

  const gltf = useGLTF(url) as unknown as GLTF & {
    nodes: Record<string, Mesh>;
    materials: Record<string, Material>;
  };
  const scene = useMemo(
    () => gltf?.scene ?? gltf.scenes?.[0] ?? new Group(),
    [gltf],
  );
  const clonedScene = useRef<Group>(scene.clone());

  useEffect(() => {
    // Dispose old scene before cloning new one
    if (clonedScene.current) {
      clonedScene.current.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }

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

          // Material updates removed to prevent WebGL context loss

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

          // Material updates removed to prevent WebGL context loss

          return;
        }

        // Map sections to actual materials in the model
        const materialsInModel: MeshStandardMaterial[] = [];
        clonedScene.current.traverse((child) => {
          if (child instanceof Mesh && child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((material) => {
              if (material instanceof MeshStandardMaterial) {
                materialsInModel.push(material);
              }
            });
          }
        });

        // Create a mapping based on material names
        const materialNameMap = new Map<string, MeshStandardMaterial>();

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
          const meshNameMap = new Map<string, Mesh>();

          // Collect all meshes by name
          clonedScene.current.traverse((child) => {
            if (child instanceof Mesh && child.name) {
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
                      mesh.material as MeshStandardMaterial;
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
                const originalMaterial = mesh.material as MeshStandardMaterial;
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

        // Material updates removed to prevent WebGL context loss
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
      const box = new Box3().setFromObject(clonedScene.current);
      const size = new Vector3();
      box.getSize(size);
      const center = new Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      clonedScene.current.position.set(-center.x, -center.y, -center.z);

      if (maxDim > 0) {
        const desiredSize = 2.5;
        const scale = desiredSize / maxDim;
        clonedScene.current.scale.setScalar(scale);

        const scaledBox = new Box3().setFromObject(clonedScene.current);
        const scaledCenter = new Vector3();
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

    try {
      // Re-map section IDs to current material UUIDs by matching originalName
      const materialsByOriginalName = new Map<string, MeshStandardMaterial>();
      clonedScene.current.traverse((child) => {
        if (child instanceof Mesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof MeshStandardMaterial && mat.name) {
              materialsByOriginalName.set(mat.name, mat);
            }
          });
        }
      });

      console.log(
        `🎭 Model Loader: Found ${materialsByOriginalName.size} materials in scene`,
      );

      // Apply material properties from sections to actual Three.js materials
      sections.forEach((section) => {
        const material = materialsByOriginalName.get(section.originalName);
        if (!material) {
          console.warn(
            `⚠️ Model Loader: No material found for section ${section.originalName}`,
          );
          return;
        }

        // Apply highlighting if this section is highlighted
        const isHighlighted = highlightedSectionId === section.id;
        const isSelected = selectedSectionId === section.id;

        if (isHighlighted || isSelected) {
          // Create a bright emissive color for highlighting
          material.emissive = new Color(0xffff00);
          material.emissiveIntensity = isHighlighted ? 0.3 : 0.1;
        } else {
          // Reset emissive for non-highlighted sections
          material.emissive = new Color(0x000000);
          material.emissiveIntensity = 0;
        }

        // Apply color if no custom texture or gradient is enabled
        if (
          section.color &&
          !section.customTexture &&
          !section.gradient?.enabled
        ) {
          material.color.set(section.color);
          console.log(
            `🎨 Applied color ${section.color} to material ${section.originalName}`,
          );
        }

        // Apply gradient if enabled
        if (section.gradient?.enabled && !section.customTexture) {
          // Create a simple gradient texture using canvas
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext("2d")!;

          if (section.gradient.type === "linear") {
            const angle = ((section.gradient.angle || 90) * Math.PI) / 180;
            const x1 = 128 - Math.cos(angle) * 128;
            const y1 = 128 - Math.sin(angle) * 128;
            const x2 = 128 + Math.cos(angle) * 128;
            const y2 = 128 + Math.sin(angle) * 128;

            const gradient = context.createLinearGradient(x1, y1, x2, y2);
            section.gradient!.colors.forEach((color, index) => {
              const stop =
                section.gradient!.stops?.[index] ??
                index / (section.gradient!.colors.length - 1);
              gradient.addColorStop(stop, color);
            });

            context.fillStyle = gradient;
          } else {
            // Radial gradient
            const gradient = context.createRadialGradient(
              128,
              128,
              0,
              128,
              128,
              128,
            );
            section.gradient!.colors.forEach((color, index) => {
              const stop =
                section.gradient!.stops?.[index] ??
                index / (section.gradient!.colors.length - 1);
              gradient.addColorStop(stop, color);
            });

            context.fillStyle = gradient;
          }

          context.fillRect(0, 0, 256, 256);

          // Create texture from canvas
          const texture = new Texture(canvas);
          texture.needsUpdate = true;
          texture.colorSpace = SRGBColorSpace;

          material.map = texture;
          console.log(
            `🌈 Applied gradient to material ${section.originalName}`,
          );
        }

        // Apply custom texture if available
        if (section.customTexture) {
          // Dispose of existing texture if any
          if (material.map) {
            material.map.dispose();
          }

          const texture = new TextureLoader().load(section.customTexture);
          texture.colorSpace = SRGBColorSpace;
          material.map = texture;
          console.log(
            `🖼️ Applied custom texture to material ${section.originalName}`,
          );
        }

        // Apply other material properties
        if (section.roughness !== undefined) {
          material.roughness = section.roughness;
        }
        if (section.metalness !== undefined) {
          material.metalness = section.metalness;
        }
        if (section.wireframe !== undefined) {
          material.wireframe = section.wireframe;
        }

        // Mark material as needing update
        material.needsUpdate = true;
      });

      // Force Three.js to re-render the scene
      invalidate();
    } catch (e) {
      console.error("❌ Model Loader: Material update error:", e);
    }
  }, [sections, invalidate]);

  // Get the main mesh from the scene for decal projection
  useEffect(() => {
    if (!clonedScene.current) return;
    clonedScene.current.traverse((child) => {
      if (child instanceof Mesh && !defaultMeshRef.current) {
        defaultMeshRef.current = child;
      }
    });
  }, [clonedScene]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clonedScene.current) {
        clonedScene.current.traverse((child) => {
          if (child instanceof Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.map) mat.map.dispose();
                mat.dispose();
              });
            } else if (child.material) {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  return (
    <>
      {enableEntranceAnimation ? (
        <EntranceAnimation animationType={entranceAnimation}>
          <primitive object={clonedScene.current} />
          {decals.map((decal) => {
            let targetMesh: Mesh | null = null;
            if (decal.meshUuid) {
              clonedScene.current.traverse((child) => {
                if (
                  !targetMesh &&
                  child instanceof Mesh &&
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
            let targetMesh: Mesh | null = null;
            if (decal.meshUuid) {
              clonedScene.current.traverse((child) => {
                if (
                  !targetMesh &&
                  child instanceof Mesh &&
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
