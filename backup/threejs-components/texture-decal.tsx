"use client";

import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { 
  Vector3, 
  Euler, 
  Mesh, 
  TextureLoader,
  Texture,
  MeshPhysicalMaterial,
  Material
} from "three";
import { DecalGeometry } from "three-stdlib";

interface TextureDecalProps {
  textureUrl: string;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  mesh: Mesh;
}

export function TextureDecal({
  textureUrl,
  position,
  rotation,
  scale,
  mesh,
}: TextureDecalProps) {
  const decalRef = useRef<Mesh | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!mesh || !(mesh instanceof Mesh)) return;

    console.log(" Creating decal at position:", position);

    // Load texture
    const loader = new TextureLoader();
    loader.load(
      textureUrl,
      (texture: Texture) => {
        console.log(" Decal texture loaded");

        // Create decal geometry
        const decalGeometry = new DecalGeometry(
          mesh,
          position,
          rotation,
          scale,
        );

        // Create decal material
        const material = new MeshPhysicalMaterial({
          map: texture,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          wireframe: false,
        });

        // Create decal mesh
        const decalMesh = new Mesh(decalGeometry, material);
        decalMesh.renderOrder = 1;

        // Add to scene
        if (decalRef.current) {
          scene.remove(decalRef.current);
          decalRef.current.geometry.dispose();
          if (Array.isArray(decalRef.current.material)) {
            decalRef.current.material.forEach((mat: Material) => mat.dispose());
          } else {
            (decalRef.current.material as Material).dispose();
          }
        }

        scene.add(decalMesh);
        decalRef.current = decalMesh;

        console.log("🎨 Decal applied to model");
      },
      undefined,
      (error: unknown) => {
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
