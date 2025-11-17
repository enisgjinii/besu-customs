"use client";

import { useEffect } from "react";
import {
  Scene,
  AbstractMesh,
  Mesh,
  Vector3,
  StandardMaterial,
  Texture,
  MeshBuilder,
} from "@babylonjs/core";
import { useConfiguratorStore } from "@/lib/store";

interface BabylonDecalsProps {
  scene: Scene;
  rootMesh: AbstractMesh;
}

export function BabylonDecals({ scene, rootMesh }: BabylonDecalsProps) {
  const decals = useConfiguratorStore((s) => s.decals);

  useEffect(() => {
    if (!scene || !rootMesh || decals.length === 0) return;

    console.log(`🎯 Applying ${decals.length} decals to model`);

    // Clean up old decals
    const oldDecals = scene.meshes.filter((m) => m.name.startsWith("decal_"));
    oldDecals.forEach((d) => d.dispose());

    // Create new decals
    decals.forEach((decal) => {
      try {
        // Find target mesh
        let targetMesh: Mesh | null = null;
        
        if (decal.meshUuid) {
          // Try to find by UUID
          const found = scene.getMeshByUniqueId(parseInt(decal.meshUuid));
          if (found instanceof Mesh) {
            targetMesh = found;
          }
        }
        
        // If not found, use root mesh or first child
        if (!targetMesh) {
          const meshes = rootMesh.getChildMeshes(false);
          if (meshes.length > 0 && meshes[0] instanceof Mesh) {
            targetMesh = meshes[0] as Mesh;
          } else if (rootMesh instanceof Mesh) {
            targetMesh = rootMesh;
          }
        }

        if (!targetMesh) {
          console.warn("No target mesh found for decal");
          return;
        }

        // Create a simple plane for the decal
        const decalPlane = MeshBuilder.CreatePlane(
          `decal_${decal.id}`,
          {
            size: decal.scale.x,
            sideOrientation: Mesh.DOUBLESIDE,
          },
          scene,
        );

        // Position the decal
        decalPlane.position = new Vector3(
          decal.position.x,
          decal.position.y,
          decal.position.z,
        );

        // Rotate the decal
        decalPlane.rotation = new Vector3(
          decal.rotation.x,
          decal.rotation.y,
          decal.rotation.z,
        );

        // Create material with texture
        const decalMaterial = new StandardMaterial(
          `decalMat_${decal.id}`,
          scene,
        );
        
        const texture = new Texture(decal.textureUrl, scene);
        texture.hasAlpha = true;
        decalMaterial.diffuseTexture = texture;
        decalMaterial.opacityTexture = texture;
        decalMaterial.backFaceCulling = false;
        
        decalPlane.material = decalMaterial;

        // Make it slightly in front of the model
        decalPlane.position.z += 0.01;

        console.log(`✅ Decal applied: ${decal.id}`);
      } catch (error) {
        console.error(`❌ Failed to apply decal ${decal.id}:`, error);
      }
    });

    // Cleanup function
    return () => {
      const decalsToClean = scene.meshes.filter((m) =>
        m.name.startsWith("decal_"),
      );
      decalsToClean.forEach((d) => {
        if (d.material) d.material.dispose();
        d.dispose();
      });
    };
  }, [decals, scene, rootMesh]);

  return null;
}
