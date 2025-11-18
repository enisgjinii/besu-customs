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
  Color3,
  ActionManager,
  ExecuteCodeAction,
} from "@babylonjs/core";
import { useConfiguratorStore } from "@/lib/store";

interface BabylonDecalsProps {
  scene: Scene;
  rootMesh: AbstractMesh;
}

export function BabylonDecals({ scene, rootMesh }: BabylonDecalsProps) {
  const decals = useConfiguratorStore((s) => s.decals);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);

  useEffect(() => {
    if (!scene || !rootMesh) {
      return;
    }

    console.log(`🎯 Rendering ${decals.length} decals`);

    // Clean up old decal meshes
    const oldDecals = scene.meshes.filter((m) => m.name.startsWith("decal_"));
    oldDecals.forEach((d) => {
      if (d.material) d.material.dispose();
      d.dispose();
    });

    if (decals.length === 0) return;

    // Get all meshes to apply decals to
    const meshes = rootMesh.getChildMeshes(false);
    meshes.push(rootMesh);

    // Create new decals
    decals.forEach((decal) => {
      try {
        // Find target mesh
        let targetMesh: Mesh | null = null;

        if (decal.meshUuid) {
          const found = scene.getMeshByUniqueId(parseInt(decal.meshUuid));
          if (found instanceof Mesh) {
            targetMesh = found;
          }
        }

        // Fallback to first valid mesh
        if (!targetMesh) {
          const validMeshes = meshes.filter(
            (m) => m instanceof Mesh && m.getTotalVertices() > 0
          ) as Mesh[];
          if (validMeshes.length > 0) {
            targetMesh = validMeshes[0];
          }
        }

        if (!targetMesh) {
          console.warn("No target mesh found for decal");
          return;
        }

        // Use the exact position and normal from pickInfo (stored at click time)
        const position = new Vector3(
          decal.position.x,
          decal.position.y,
          decal.position.z,
        );
        
        const normal = new Vector3(
          decal.normal.x,
          decal.normal.y,
          decal.normal.z,
        );
        
        console.log('🎨 Rendering decal', decal.id, 'with normal:', normal, 'position:', position);

        // Create decal size with shallow depth so it stays on garment surface
        const width = Math.max(0.1, decal.scale.x);
        const height = Math.max(0.1, decal.scale.y);
        const depth = Math.max(0.02, decal.scale.z || Math.min(width, height) * 0.2);
        const decalSize = new Vector3(width, height, depth);

        // Create the decal mesh - exactly like Babylon playground
        const decalMesh = MeshBuilder.CreateDecal(
          `decal_${decal.id}`,
          targetMesh,
          {
            position: position,
            normal: normal,
            size: decalSize,
            angle: decal.rotation?.z || 0,
          }
        );

        if (!decalMesh) {
          console.error(`Failed to create decal mesh for ${decal.id}`);
          return;
        }

        // Create decal material - like Babylon playground
        const decalMaterial = new StandardMaterial(
          `decalMat_${decal.id}`,
          scene,
        );

        const texture = new Texture(
          decal.textureUrl,
          scene,
          false,
          true,
          Texture.TRILINEAR_SAMPLINGMODE,
        );
        texture.hasAlpha = true;

        decalMaterial.diffuseTexture = texture;
        decalMaterial.diffuseTexture.hasAlpha = true;
        decalMaterial.zOffset = -3; // Push decal forward more
        decalMaterial.backFaceCulling = true; // Only show front face
        
        decalMesh.material = decalMaterial;
        decalMesh.isPickable = true;
        decalMesh.metadata = { decalId: decal.id };

        // Make decal clickable
        decalMesh.actionManager = new ActionManager(scene);
        decalMesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            setSelectedDecal(decal.id);
          }),
        );

        console.log(`✅ Decal created: ${decal.id} at`, position);
      } catch (error) {
        console.error(`❌ Failed to create decal ${decal.id}:`, error);
      }
    });

    // Cleanup
    return () => {
      const decalsToClean = scene.meshes.filter((m) =>
        m.name.startsWith("decal_"),
      );
      decalsToClean.forEach((d) => {
        if (d.material) d.material.dispose();
        d.dispose();
      });
    };
  }, [decals, scene, rootMesh, setSelectedDecal]);

  return null;
}
