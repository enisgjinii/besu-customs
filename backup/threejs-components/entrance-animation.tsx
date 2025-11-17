"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { 
  Group, 
  Object3D, 
  Mesh, 
  MeshStandardMaterial, 
  Color,
  AdditiveBlending,
  Points,
  PointsMaterial,
  BufferGeometry,
  BufferAttribute
} from "three";
import { useFrame } from "@react-three/fiber";
import { useConfiguratorStore } from "@/lib/store";

// Animation types for model entrance
export type EntranceAnimationType =
  | "fadeIn"
  | "scaleUp"
  | "rotateIn"
  | "slideIn"
  | "bounce"
  | "spin"
  | "dropIn"
  | "zoomRotate"
  | "glow"
  | "particleReveal";

interface EntranceAnimationProps {
  children: React.ReactNode;
  animationType: EntranceAnimationType;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

export function EntranceAnimation({
  children,
  animationType,
  duration = 2000,
  delay = 0,
  onComplete,
}: EntranceAnimationProps) {
  const groupRef = useRef<Group>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const startTime = useRef<number>(Date.now() + delay);
  const modelLoading = useConfiguratorStore((state) => state.modelLoading);

  // Reset animation when model changes
  useEffect(() => {
    if (!modelLoading) {
      setIsAnimating(true);
      startTime.current = Date.now() + delay;
    }
  }, [modelLoading, delay]);

  useFrame(() => {
    if (!groupRef.current || !isAnimating) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Easing functions
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeOutBounce = (t: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    };

    const easedProgress = easeOutCubic(progress);

    switch (animationType) {
      case "fadeIn":
        groupRef.current.traverse((child: Object3D) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshStandardMaterial;
            if (material.transparent !== undefined) {
              material.transparent = true;
              material.opacity = easedProgress;
              material.needsUpdate = true;
            }
          }
        });
        break;

      case "scaleUp":
        const scale = easeOutBack(easedProgress);
        groupRef.current.scale.setScalar(scale);
        groupRef.current.traverse((child: Object3D) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshStandardMaterial;
            if (material.transparent !== undefined) {
              material.transparent = true;
              material.opacity = easedProgress;
              material.needsUpdate = true;
            }
          }
        });
        break;

      case "rotateIn":
        const rotateProgress = easeOutBack(easedProgress);
        groupRef.current.rotation.y = (1 - rotateProgress) * Math.PI * 0.5;
        groupRef.current.scale.setScalar(easedProgress);
        break;

      case "slideIn":
        const slideProgress = easeOutCubic(easedProgress);
        groupRef.current.position.x = (1 - slideProgress) * 5;
        groupRef.current.traverse((child: Object3D) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshStandardMaterial;
            if (material.transparent !== undefined) {
              material.transparent = true;
              material.opacity = slideProgress;
              material.needsUpdate = true;
            }
          }
        });
        break;

      case "bounce":
        const bounceProgress = easeOutBounce(easedProgress);
        groupRef.current.position.y = bounceProgress * 2;
        groupRef.current.scale.setScalar(bounceProgress);
        break;

      case "spin":
        const spinProgress = easedProgress;
        groupRef.current.rotation.y = spinProgress * Math.PI * 1;
        groupRef.current.rotation.x = spinProgress * Math.PI * 0.25;
        groupRef.current.scale.setScalar(easedProgress);
        break;

      case "dropIn":
        const dropProgress = easeOutBounce(easedProgress);
        groupRef.current.position.y = 5 * (1 - dropProgress);
        groupRef.current.rotation.y = dropProgress * Math.PI * 0.25;
        groupRef.current.scale.setScalar(dropProgress);
        break;

      case "zoomRotate":
        const zoomRotateProgress = easeOutBack(easedProgress);
        groupRef.current.scale.setScalar(zoomRotateProgress);
        groupRef.current.rotation.y = (1 - zoomRotateProgress) * Math.PI * 0.5;
        groupRef.current.rotation.x = (1 - zoomRotateProgress) * Math.PI * 0.25;
        break;

      case "glow":
        const glowProgress = easedProgress;
        groupRef.current.scale.setScalar(glowProgress);
        groupRef.current.traverse((child: Object3D) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshStandardMaterial;
            material.emissive = new Color(0x4a90e2);
            material.emissiveIntensity = (1 - glowProgress) * 0.5;
            material.needsUpdate = true;
          }
        });
        break;

      case "particleReveal":
        const revealProgress = easedProgress;
        let meshIndex = 0;
        groupRef.current.traverse((child: Object3D) => {
          if (child instanceof Mesh) {
            const delay = meshIndex * 0.1;
            const childProgress = Math.max(
              0,
              Math.min(1, (progress - delay) / (1 - delay)),
            );
            const childScale = easeOutBack(childProgress);
            child.scale.setScalar(childScale);

            const material = child.material as MeshStandardMaterial;
            if (material.transparent !== undefined) {
              material.transparent = true;
              material.opacity = childProgress;
              material.needsUpdate = true;
            }
            meshIndex++;
          }
        });
        break;
    }

    if (progress >= 1) {
      setIsAnimating(false);
      // Reset any modified properties
      groupRef.current.traverse((child: Object3D & { material?: MeshStandardMaterial }) => {
        if (child instanceof Mesh) {
          const material = child.material as MeshStandardMaterial;
          material.transparent = false;
          material.opacity = 1;
          material.emissive = new Color(0x000000);
          material.emissiveIntensity = 0;
          material.needsUpdate = true;
          child.scale.setScalar(1);
        }
      });
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.scale.setScalar(1);

      onComplete?.();
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Particle effect for enhanced entrance
interface ParticleEffectProps {
  position?: [number, number, number];
  count?: number;
  duration?: number;
}

export function ParticleEffect({
  position = [0, 0, 0],
  count = 50,
  duration = 2000,
}: ParticleEffectProps) {
  const particlesRef = useRef<Points>(null);
  const startTime = useRef<number>(Date.now());

  useFrame(() => {
    if (!particlesRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    if (
      particlesRef.current.geometry.attributes.position &&
      particlesRef.current.geometry.attributes.color
    ) {
      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      const colors = particlesRef.current.geometry.attributes.color
        .array as Float32Array;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const particleProgress = Math.random() * progress;

        // Expand particles outward
        const radius = particleProgress * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i3] = position[0] + radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] =
          position[1] + radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = position[2] + radius * Math.cos(phi);

        // Fade out particles
        const opacity = 1 - particleProgress;
        colors[i3] = 0.3; // R
        colors[i3 + 1] = 0.6; // G
        colors[i3 + 2] = 1; // B
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.color.needsUpdate = true;

      const material = particlesRef.current.material as PointsMaterial;
      material.opacity = 1 - progress;
      material.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position[0];
      positions[i * 3 + 1] = position[1];
      positions[i * 3 + 2] = position[2];

      colors[i * 3] = 0.3;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 1;
    }

    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("color", new BufferAttribute(colors, 3));
    return geo;
  }, [count, position]);

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={1}
        blending={AdditiveBlending}
      />
    </points>
  );
}

// Camera animation for dramatic entrance
export function useCameraEntrance(animationType: EntranceAnimationType) {
  const controlsRef = useConfiguratorStore(
    (state) => state.cameraControlsRef,
  ) as React.RefObject<unknown>;
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!controlsRef?.current) return;

    const controls = controlsRef.current as {
      object: { position: { set: (x: number, y: number, z: number) => void } };
      update: () => void;
    };
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      switch (animationType) {
        case "fadeIn":
        case "scaleUp":
          // Gentle camera approach
          const distance = 8 - 3 * easedProgress;
          controls.object.position.set(distance, 2, distance);
          break;

        case "rotateIn":
        case "zoomRotate":
          // Circular camera movement
          const angle = (1 - easedProgress) * Math.PI * 0.5;
          const currentDistance = 5 + 3 * (1 - easedProgress);
          controls.object.position.set(
            Math.cos(angle) * currentDistance,
            2 + Math.sin(progress * Math.PI) * 0.25,
            Math.sin(angle) * currentDistance,
          );
          break;

        case "dropIn":
        case "bounce":
          // Camera moves from above
          controls.object.position.set(
            3 * (1 - easedProgress),
            8 - 6 * easedProgress,
            5 * (1 - easedProgress) + 3 * easedProgress,
          );
          break;

        default:
          // Gentle camera approach
          const defaultDistance = 8 - 3 * easedProgress;
          controls.object.position.set(defaultDistance, 2, defaultDistance);
      }

      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animate();
  }, [animationType, controlsRef]);

  return isAnimating;
}
