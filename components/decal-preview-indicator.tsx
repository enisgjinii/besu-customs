"use client";

import { useEffect, useRef } from "react";
import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  PointerEventTypes,
} from "@babylonjs/core";
import { useConfiguratorStore } from "@/lib/store";

interface DecalPreviewIndicatorProps {
  scene: Scene;
  rootMesh: Mesh | null;
}

export function DecalPreviewIndicator({
  scene,
  rootMesh,
}: DecalPreviewIndicatorProps) {
  const lastDecalTexture = useConfiguratorStore((s) => s.lastDecalTexture);
  const decalPlacementSize = useConfiguratorStore((s) => s.decalPlacementSize);
  const decalPlacementAngle = useConfiguratorStore(
    (s) => s.decalPlacementAngle,
  );
  
  const previewDecalRef = useRef<Mesh | null>(null);
  const previewMaterialRef = useRef<StandardMaterial | null>(null);

  const ensureOutwardNormal = (
    sourceNormal: Vector3,
    targetMesh: Mesh | null,
    surfacePoint: Vector3,
  ) => {
    let adjustedNormal = sourceNormal.clone();

    if (targetMesh?.getBoundingInfo()) {
      const center = targetMesh.getBoundingInfo().boundingSphere.centerWorld;
      const centerToPoint = surfacePoint.subtract(center);
      if (centerToPoint.lengthSquared() > 0) {
        const dot = Vector3.Dot(adjustedNormal, centerToPoint);
        if (dot < 0) {
          adjustedNormal = adjustedNormal.negate();
        }
      }
    }

    return adjustedNormal.normalize();
  };

  useEffect(() => {
    if (!scene || !rootMesh || !lastDecalTexture) {
      // Clean up preview decal if it exists
      if (previewDecalRef.current) {
        previewDecalRef.current.dispose();
        previewDecalRef.current = null;
      }
      if (previewMaterialRef.current) {
        previewMaterialRef.current.dispose();
        previewMaterialRef.current = null;
      }
      return;
    }

    // Create the preview material once (reused for all preview decals)
    if (!previewMaterialRef.current) {
      const previewMaterial = new StandardMaterial("decalPreviewMaterial", scene);
      previewMaterial.emissiveColor = new Color3(0, 1, 1); // Cyan
      previewMaterial.alpha = 0.5;
      previewMaterial.disableLighting = true;
      previewMaterial.wireframe = true;
      previewMaterial.zOffset = -1;
      previewMaterialRef.current = previewMaterial;
    }

    // Get all valid target meshes
    const getValidMeshes = () => {
      const meshes = rootMesh.getChildMeshes(false) as Mesh[];
      meshes.push(rootMesh as Mesh);
      return meshes.filter((m) => m instanceof Mesh && m.getTotalVertices() > 0);
    };

    const validMeshes = getValidMeshes();

    // Update preview position on pointer move
    const observer = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        // Pick against valid meshes only (not decals or preview)
        const pick = scene.pick(
          scene.pointerX,
          scene.pointerY,
          (mesh) => {
            return validMeshes.includes(mesh as Mesh) && 
                   !mesh.name?.startsWith("decal_") && 
                   mesh.name !== "decalPreview";
          }
        );

        if (pick?.hit && pick.pickedPoint && pick.pickedMesh && pick.pickedMesh instanceof Mesh) {
          let normal = pick.getNormal(true);
          if (!normal) return;

          const position = pick.pickedPoint;
          normal = ensureOutwardNormal(normal, pick.pickedMesh, position);

          const offsetPosition = position.add(normal.scale(0.003));
          const targetMesh = pick.pickedMesh;

          // Remove old preview decal
          if (previewDecalRef.current) {
            previewDecalRef.current.dispose();
            previewDecalRef.current = null;
          }

          // Create new preview decal at cursor position
          const decalDepth = Math.max(0.01, decalPlacementSize * 0.12);
          const decalSize = new Vector3(
            decalPlacementSize,
            decalPlacementSize,
            decalDepth,
          );

          const previewDecal = MeshBuilder.CreateDecal(
            "decalPreview",
            targetMesh,
            {
              position: offsetPosition,
              normal: normal,
              size: decalSize,
              angle: decalPlacementAngle,
            }
          );

          if (previewDecal && previewMaterialRef.current) {
            previewDecal.material = previewMaterialRef.current;
            previewDecal.isPickable = false;
            previewDecalRef.current = previewDecal;
          }
        } else {
          // Hide preview if not hovering over mesh
          if (previewDecalRef.current) {
            previewDecalRef.current.dispose();
            previewDecalRef.current = null;
          }
        }
      }
    });

    // Cleanup
    return () => {
      scene.onPointerObservable.remove(observer);
      if (previewDecalRef.current) {
        previewDecalRef.current.dispose();
        previewDecalRef.current = null;
      }
      if (previewMaterialRef.current) {
        previewMaterialRef.current.dispose();
        previewMaterialRef.current = null;
      }
    };
  }, [scene, rootMesh, lastDecalTexture, decalPlacementSize, decalPlacementAngle]);

  return null;
}
