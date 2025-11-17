"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  Raycaster,
  Vector2,
  Vector3,
  Matrix3,
  Quaternion,
  Euler,
  Mesh,
  Object3D,
} from "three";
import { useConfiguratorStore } from "@/lib/store";

export function DecalPlacer() {
  const { gl, camera, scene, size } = useThree();
  const addDecal = useConfiguratorStore((s) => s.addDecal);
  const lastDecalTexture = useConfiguratorStore((s) => s.lastDecalTexture);
  const enabledRef = useRef(true);
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!enabledRef.current) return;
      if (!lastDecalTexture) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.current.set(x, y);
      raycaster.current.setFromCamera(mouse.current, camera);

      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true,
      );
      const hit = intersects.find(
        (i: { object: Object3D }) => i.object instanceof Mesh,
      );
      if (!hit || !(hit.object instanceof Mesh)) return;

      const obj = hit.object as Mesh;
      const point = hit.point.clone();

      // Compute world-space normal
      const normal = hit.face?.normal.clone();
      const normalMatrix = new Matrix3().getNormalMatrix(obj.matrixWorld);
      const worldNormal = normal
        ? normal.applyMatrix3(normalMatrix).normalize()
        : new Vector3(0, 0, 1);

      // Orientation to align decal Z-axis with surface normal
      const quat = new Quaternion().setFromUnitVectors(
        new Vector3(0, 0, 1),
        worldNormal,
      );
      const euler = new Euler().setFromQuaternion(quat, "XYZ");

      const scale = new Vector3(0.3, 0.3, 0.3);

      addDecal({
        id: `decal-${Date.now()}`,
        textureUrl: lastDecalTexture,
        meshUuid: obj.uuid,
        position: point,
        rotation: euler,
        scale,
      });
    };

    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [gl, camera, scene, size, addDecal, lastDecalTexture]);

  return null;
}
