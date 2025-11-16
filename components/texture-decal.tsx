"use client";

import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DecalGeometry } from "three-stdlib";

interface TextureDecalProps {
  textureUrl: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  mesh: THREE.Mesh;
}

export function TextureDecal({
  textureUrl,
  position,
  rotation,
  scale,
  mesh,
}: TextureDecalProps) {
  const decalRef = useRef<THREE.Mesh | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!mesh || !textureUrl) return;

    console.log("🎯 Creating decal at position:", position);

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      textureUrl,
      (texture) => {
        console.log("✅ Decal texture loaded");

        // Create decal geometry
        const decalGeometry = new DecalGeometry(
          mesh,
          position,
          rotation,
          scale,
        );

        // Create decal material
        const decalMaterial = new THREE.MeshPhysicalMaterial({
          map: texture,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          wireframe: false,
        });

        // Create decal mesh
        const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
        decalMesh.renderOrder = 1;

        // Add to scene
        if (decalRef.current) {
          scene.remove(decalRef.current);
          decalRef.current.geometry.dispose();
          if (Array.isArray(decalRef.current.material)) {
            decalRef.current.material.forEach((mat) => mat.dispose());
          } else {
            decalRef.current.material.dispose();
          }
        }

        scene.add(decalMesh);
        decalRef.current = decalMesh;

        console.log("🎨 Decal applied to model");
      },
      undefined,
      (error) => {
        console.error("❌ Error loading decal texture:", error);
      },
    );

    return () => {
      if (decalRef.current) {
        scene.remove(decalRef.current);
        decalRef.current.geometry.dispose();
        if (Array.isArray(decalRef.current.material)) {
          decalRef.current.material.forEach((mat) => mat.dispose());
        } else {
          decalRef.current.material.dispose();
        }
      }
    };
  }, [textureUrl, position, rotation, scale, mesh, scene]);

  return null;
}
