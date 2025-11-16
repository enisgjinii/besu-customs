"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useConfiguratorStore } from "@/lib/store";

export function DecalPlacer() {
  const { gl, camera, scene, size } = useThree();
  const addDecal = useConfiguratorStore((s) => s.addDecal);
  const lastDecalTexture = useConfiguratorStore((s) => s.lastDecalTexture);
  const enabledRef = useRef(true);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

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
      const hit = intersects.find((i) => i.object instanceof THREE.Mesh);
      if (!hit || !(hit.object instanceof THREE.Mesh)) return;

      const obj = hit.object as THREE.Mesh;
      const point = hit.point.clone();

      // Compute world-space normal
      const normal = hit.face?.normal.clone();
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld);
      const worldNormal = normal
        ? normal.applyMatrix3(normalMatrix).normalize()
        : new THREE.Vector3(0, 0, 1);

      // Orientation to align decal Z-axis with surface normal
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        worldNormal,
      );
      const euler = new THREE.Euler().setFromQuaternion(quat, "XYZ");

      const scale = new THREE.Vector3(0.3, 0.3, 0.3);

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
