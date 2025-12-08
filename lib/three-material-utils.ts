"use client";

import * as THREE from "three";
import type { MaterialSection } from "./store";

/**
 * Three.js Material Utilities
 * Handles material extraction, application, and UV mapping
 */

// Parse material name to get display name
function parseMaterialName(name: string): string {
  // Common specific overrides
  const overrides: Record<string, string> = {
    "fabric_front": "Front Body",
    "fabric_back": "Back Body",
    "fabric_sleeve_l": "Left Sleeve",
    "fabric_sleeve_r": "Right Sleeve",
    "collar_1": "Collar",
    "trim_neck": "Neck Trim",
  };

  const lowerName = name.toLowerCase();

  // Check strict overrides first
  if (overrides[lowerName]) return overrides[lowerName];

  // Logic to clean up technical names
  let displayName = name
    // Remove "generated", "instance", "clone" often found in 3D exports
    .replace(/(generated|instance|clone|copy)/gi, "")
    // Remove common prefixes
    .replace(/^(mat_|material_|mtl_|mesh_|obj_)/i, "")
    // Remove common suffixes like .001, _001
    .replace(/[._-]\d{3,}$/i, "")
    // Replace separators with spaces
    .replace(/[._-]/g, " ")
    // Split camelCase (e.g., "FrontBody" -> "Front Body")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Split numbers from text (e.g., "Sleeve2" -> "Sleeve 2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2");

  // Filter out redundant technical terms
  displayName = displayName.replace(/\b(lambert|phong|standard|pbr|blinn)\b/gi, "").trim();

  // Capitalize first letter of each word
  displayName = displayName
    .split(/\s+/)
    .filter(Boolean) // remove empty strings
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Final cleanup for dangling numbers or known short codes
  displayName = displayName
    .replace(/\bL\b/g, "Left")
    .replace(/\bR\b/g, "Right")
    .replace(/\bF\b/g, "Front")
    .replace(/\bB\b/g, "Back");

  return displayName || "Part";
}

// Extract material sections from a Three.js scene
export function extractSectionsFromThreeModel(
  scene: THREE.Object3D,
  modelUrl: string
): MaterialSection[] {
  const sections: MaterialSection[] = [];
  const processedMaterials = new Set<string>();

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (!material.name || processedMaterials.has(material.name)) {
          return;
        }

        processedMaterials.add(material.name);

        // Get color from material
        let color = "#ffffff";
        if (material instanceof THREE.MeshStandardMaterial && material.color) {
          color = "#" + material.color.getHexString();
        }

        const section: MaterialSection = {
          id: material.name,
          name: parseMaterialName(material.name),
          originalName: material.name,
          category: "Other",
          color,
          roughness:
            material instanceof THREE.MeshStandardMaterial
              ? material.roughness
              : 0.5,
          metalness:
            material instanceof THREE.MeshStandardMaterial
              ? material.metalness
              : 0,
          wireframe: material.wireframe || false,
        };

        sections.push(section);
      });
    }
  });

  console.log(
    `📋 Extracted ${sections.length} material sections from Three.js model`
  );
  return sections;
}

// Apply material sections to a Three.js scene
export function applyMaterialsToThreeModel(
  scene: THREE.Object3D,
  sections: MaterialSection[]
): void {
  if (sections.length === 0) return;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material, index) => {
        const section = sections.find(
          (s) =>
            s.originalName === material.name ||
            s.id === material.name ||
            material.name.includes(s.originalName)
        );

        if (!section) return;

        // Clone material to avoid affecting other meshes
        if (!(material as any).__cloned) {
          const clonedMaterial = material.clone();
          (clonedMaterial as any).__cloned = true;

          if (Array.isArray(child.material)) {
            child.material[index] = clonedMaterial;
          } else {
            child.material = clonedMaterial;
          }
        }

        const targetMaterial = Array.isArray(child.material)
          ? child.material[index]
          : child.material;

        if (targetMaterial instanceof THREE.MeshStandardMaterial) {
          // Apply color
          if (section.color && !section.customTexture && !section.gradient?.enabled) {
            targetMaterial.color = new THREE.Color(section.color);
            targetMaterial.map = null;
          }

          // Apply custom texture
          if (section.customTexture) {
            const loader = new THREE.TextureLoader();
            const texture = loader.load(section.customTexture);
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            targetMaterial.map = texture;
            // PRESERVE original color - blend with texture instead of replacing with white
            if (section.color) {
              targetMaterial.color = new THREE.Color(section.color);
              // Add subtle emissive to maintain color vibrancy
              const baseColor = new THREE.Color(section.color);
              if (baseColor.getHex() !== 0xffffff) {
                targetMaterial.emissive = baseColor.clone().multiplyScalar(0.12);
              }
            } else {
              targetMaterial.color = new THREE.Color(0xffffff);
            }
          }

          // Apply gradient
          if (section.gradient?.enabled && !section.customTexture && section.gradient.type) {
            const gradientTexture = createGradientTexture({
              enabled: section.gradient.enabled,
              type: section.gradient.type,
              colors: section.gradient.colors,
              angle: section.gradient.angle,
              stops: section.gradient.stops,
            });
            targetMaterial.map = gradientTexture;
            targetMaterial.color = new THREE.Color(0xffffff);
          }

          // Apply material properties
          if (section.roughness !== undefined) {
            targetMaterial.roughness = section.roughness;
          }
          if (section.metalness !== undefined) {
            targetMaterial.metalness = section.metalness;
          }
          if (section.wireframe !== undefined) {
            targetMaterial.wireframe = section.wireframe;
          }

          // Enable double-sided rendering
          targetMaterial.side = THREE.DoubleSide;

          targetMaterial.needsUpdate = true;
        }
      });
    }
  });
}

// Create gradient texture
function createGradientTexture(gradient: {
  enabled: boolean;
  type: "linear" | "radial";
  colors: string[];
  angle?: number;
  stops?: number[];
}): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  let gradientObj: CanvasGradient;

  if (gradient.type === "radial") {
    gradientObj = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
  } else {
    const angle = ((gradient.angle || 90) * Math.PI) / 180;
    const x1 = size / 2 - (Math.cos(angle) * size) / 2;
    const y1 = size / 2 - (Math.sin(angle) * size) / 2;
    const x2 = size / 2 + (Math.cos(angle) * size) / 2;
    const y2 = size / 2 + (Math.sin(angle) * size) / 2;
    gradientObj = ctx.createLinearGradient(x1, y1, x2, y2);
  }

  const stops =
    gradient.stops ||
    gradient.colors.map((_, i) => i / (gradient.colors.length - 1));

  gradient.colors.forEach((color, i) => {
    gradientObj.addColorStop(stops[i] || i / (gradient.colors.length - 1), color);
  });

  ctx.fillStyle = gradientObj;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Extract UV map from Three.js model
export function extractUVMapFromThreeModel(
  scene: THREE.Object3D,
  width: number = 2048,
  height: number = 2048
): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Draw UV wireframe
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;

  let hasUVs = false;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry;
      const uvAttribute = geometry.getAttribute("uv");
      const indexAttribute = geometry.getIndex();

      if (!uvAttribute) return;

      hasUVs = true;

      if (indexAttribute) {
        // Indexed geometry
        for (let i = 0; i < indexAttribute.count; i += 3) {
          const a = indexAttribute.getX(i);
          const b = indexAttribute.getX(i + 1);
          const c = indexAttribute.getX(i + 2);

          const uvA = new THREE.Vector2(
            uvAttribute.getX(a),
            uvAttribute.getY(a)
          );
          const uvB = new THREE.Vector2(
            uvAttribute.getX(b),
            uvAttribute.getY(b)
          );
          const uvC = new THREE.Vector2(
            uvAttribute.getX(c),
            uvAttribute.getY(c)
          );

          ctx.beginPath();
          ctx.moveTo(uvA.x * width, (1 - uvA.y) * height);
          ctx.lineTo(uvB.x * width, (1 - uvB.y) * height);
          ctx.lineTo(uvC.x * width, (1 - uvC.y) * height);
          ctx.closePath();
          ctx.stroke();
        }
      } else {
        // Non-indexed geometry
        for (let i = 0; i < uvAttribute.count; i += 3) {
          const uvA = new THREE.Vector2(
            uvAttribute.getX(i),
            uvAttribute.getY(i)
          );
          const uvB = new THREE.Vector2(
            uvAttribute.getX(i + 1),
            uvAttribute.getY(i + 1)
          );
          const uvC = new THREE.Vector2(
            uvAttribute.getX(i + 2),
            uvAttribute.getY(i + 2)
          );

          ctx.beginPath();
          ctx.moveTo(uvA.x * width, (1 - uvA.y) * height);
          ctx.lineTo(uvB.x * width, (1 - uvB.y) * height);
          ctx.lineTo(uvC.x * width, (1 - uvC.y) * height);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  });

  if (!hasUVs) {
    console.warn("⚠️ No UV data found in model");
    return null;
  }

  return canvas.toDataURL("image/png");
}

// Create scaled texture from URL
export async function createScaledTextureFromUrl(
  url: string,
  maxSize: number = 2048
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.anisotropy = 16;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}
