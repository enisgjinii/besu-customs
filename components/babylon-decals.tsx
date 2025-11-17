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
  Ray,
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

        // Compute a robust hit point and normal using a raycast toward the mesh
        const meshCenter = targetMesh
          .getBoundingInfo()
          .boundingSphere.centerWorld.clone();
        const guessDir = meshCenter
          .subtract(
            new Vector3(decal.position.x, decal.position.y, decal.position.z),
          )
          .normalize();
        const origin = new Vector3(
          decal.position.x,
          decal.position.y,
          decal.position.z,
        ).add(guessDir.scale(-0.2));
        const ray = new Ray(origin, guessDir, 1000);
        const pick = scene.pickWithRay(ray, (m) => m === targetMesh, false);

        let hitPoint = new Vector3(
          decal.position.x,
          decal.position.y,
          decal.position.z,
        );
        let hitNormal = new Vector3(0, 0, 1);
        if (pick?.hit && pick.pickedPoint) {
          hitPoint = pick.pickedPoint.clone();
          const n = pick.getNormal(true);
          if (n) hitNormal = n.normalize();
        }

        // Use CreateDecal for proper surface projection
        const size = new Vector3(
          Math.max(0.3, decal.scale.x),
          Math.max(0.3, decal.scale.y),
          0.3, // Projection depth
        );

        const angle = decal.rotation?.z ?? 0;
        const decalMesh = MeshBuilder.CreateDecal(
          `decal_${decal.id}`,
          targetMesh,
          {
            position: hitPoint,
            normal: hitNormal,
            size,
            angle,
          },
        );

        // Decal material with proper visibility
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
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = Texture.CLAMP_ADDRESSMODE;

        decalMaterial.diffuseTexture = texture;
        decalMaterial.opacityTexture = texture;
        decalMaterial.specularColor = new Color3(0, 0, 0);
        decalMaterial.emissiveColor = new Color3(1, 1, 1);
        decalMaterial.useAlphaFromDiffuseTexture = true;
        decalMaterial.backFaceCulling = false;
        decalMaterial.needDepthPrePass = true;
        // @ts-ignore
        decalMaterial.zOffset = -5;

        decalMesh.material = decalMaterial;
        decalMesh.renderingGroupId = 1;
        decalMesh.isPickable = true;

        // Add click interaction to select decal
        decalMesh.actionManager = new ActionManager(scene);
        decalMesh.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            setSelectedDecal(decal.id);
          })
        );

        // Store decal data on mesh for position tracking
        (decalMesh as any).decalData = decal;

        console.log(`✅ Decal projected: ${decal.id}`);
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
  }, [decals, scene, rootMesh, setSelectedDecal]);

  return null;
}
