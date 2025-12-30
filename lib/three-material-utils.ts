"use client";

import * as THREE from "three";
import type { MaterialSection } from "./store";

/**
 * Three.js Material Utilities
 * Handles material extraction, application, and UV mapping
 */

// Parse material name to get display name
function parseMaterialName(name: string, modelUrl?: string): string {
  const lowerName = name.toLowerCase();

  // Model-specific overrides
  if (modelUrl) {
    if (modelUrl.includes("basketball-jersey-top-and-long-shorts") || modelUrl.includes("basketball-jersey-and-shorts")) {
      // Buttons should be hidden
      if (lowerName.includes("button")) return "HIDDEN";

      // Specific Fabric mappings based on ID
      if (name.includes("2842")) return "Pants Waist Trim";
      if (name.includes("2845")) return "Back of Shorts";
      if (name.includes("2848")) return "Front of Shorts";

      // Jersey parts
      if (lowerName.includes("body_f") || lowerName.includes("front")) return "Front of Jersey";
      if (lowerName.includes("body_b") || lowerName.includes("back")) return "Back of Jersey";

      // "Ble" matches usually indicate trim/binding in some exports or it might be the 4th fabric
      // If the user said "Ble", and we have a 4th fabric "66694", let's name it carefully or generic
      if (name.includes("66694")) return "Inner Waist";

      // Catch-all for "Ble" if it appears as a name
      if (lowerName.includes("ble")) return "Jersey Sleeve & Collar Trim";

      if (lowerName.includes("fabric_1") || lowerName === "fabric 1") return "Shorts";
      if (lowerName.includes("waist")) return "Waistband"; // Keep existing waistband mapping
    }

    // Volleyball specific
    if (modelUrl.includes("volleyball")) {
      if (lowerName.includes("body")) return "Body";
      if (lowerName.includes("sleeve")) return "Sleeves";
    }
  }

  // Common specific overrides
  const overrides: Record<string, string> = {
    fabric_front: "Front Body",
    fabric_back: "Back Body",
    fabric_sleeve_l: "Left Sleeve",
    fabric_sleeve_r: "Right Sleeve",
    collar_1: "Collar",
    trim_neck: "Neck Trim",
    "fabric 1": "Main Body",
    fabric_1: "Main Body",
    "fabic 1": "Main Body",
    material: "Base",
    default_button: "Button",
  };

  // Check strict overrides first
  if (overrides[lowerName]) return overrides[lowerName];

  // Logic to clean up technical names
  let displayName = name
    // Remove "generated", "instance", "clone" often found in 3D exports
    .replace(/(generated|instance|clone|copy)/gi, "")
    // Remove common prefixes
    .replace(/^(mat_|material_|mtl_|mesh_|obj_)/i, "")
    // Remove common suffixes like .001, _001 or _2542 (variable length)
    .replace(/[._-]\d+$/i, "")
    // Replace separators with spaces
    .replace(/[._-]/g, " ")
    // Split camelCase (e.g., "FrontBody" -> "Front Body")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Split numbers from text (e.g., "Sleeve2" -> "Sleeve 2")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2");

  // Filter out redundant technical terms
  displayName = displayName
    .replace(/\b(lambert|phong|standard|pbr|blinn)\b/gi, "")
    .trim();

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
  modelUrl: string,
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

        const sectionName = parseMaterialName(material.name, modelUrl);

        // Skip hidden sections
        if (sectionName === "HIDDEN") return;

        // Determine category based on name and model
        let category = "Other";
        if (modelUrl?.includes("basketball-jersey")) {
          if (sectionName.includes("Jersey") || sectionName.includes("Sleeve") || sectionName.includes("Collar")) {
            category = "Jersey";
          } else if (sectionName.includes("Shorts") || sectionName.includes("Waist") || sectionName.includes("Pants")) {
            category = "Shorts";
          }
        }

        const section: MaterialSection = {
          id: material.name,
          name: sectionName,
          originalName: material.name,
          category,
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
    `📋 Extracted ${sections.length} material sections from Three.js model`,
  );
  return sections;
}

// Apply material sections to a Three.js scene
export function applyMaterialsToThreeModel(
  scene: THREE.Object3D,
  sections: MaterialSection[],
): void {
  if (sections.length === 0) return;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material, index) => {
        // Try to find section by material name first
        let section = sections.find(
          (s) =>
            s.originalName === material.name ||
            s.id === material.name ||
            material.name.includes(s.originalName),
        );

        // If not found by material name, try to find by mesh name (for volleyball models)
        if (!section && child.name) {
          section = sections.find(
            (s) =>
              s.originalName === child.name ||
              child.name.includes(s.originalName) ||
              s.originalName.includes(child.name),
          );
        }

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
          if (
            section.color &&
            !section.customTexture &&
            !section.gradient?.enabled &&
            !section.trimDesign
          ) {
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
                targetMaterial.emissive = baseColor
                  .clone()
                  .multiplyScalar(0.12);
              }
            } else {
              targetMaterial.color = new THREE.Color(0xffffff);
            }
          }

          // Apply gradient
          if (
            section.gradient?.enabled &&
            !section.customTexture &&
            section.gradient.type
          ) {
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

          // Apply trim design (highest priority - overrides other textures)
          if (section.trimDesign && section.trimDesign !== "none") {
            const trimTexture = createTrimDesignTexture(
              section.trimDesign,
              section.color || "#ffffff",
              section.trimColor || "#000000",
            );
            targetMaterial.map = trimTexture;
            targetMaterial.color = new THREE.Color(0xffffff);
            console.log(
              `🎨 Applied trim "${section.trimDesign}" to section "${section.name}"`,
            );
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

          // Fix Z-Fighting for overlapping geometry (Trims/Collars/Stitching)
          const isTrim =
            /trim|collar|stitch|seam|detail|piping/i.test(section.name) ||
            /trim|collar|stitch|seam|detail|piping/i.test(
              section.originalName,
            );

          if (isTrim) {
            targetMaterial.polygonOffset = true;
            targetMaterial.polygonOffsetFactor = -1.0;
            targetMaterial.polygonOffsetUnits = -1.0;
          }

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
      size / 2,
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
    gradientObj.addColorStop(
      stops[i] || i / (gradient.colors.length - 1),
      color,
    );
  });

  ctx.fillStyle = gradientObj;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Create trim design texture
function createTrimDesignTexture(
  trimDesign: string,
  baseColor: string,
  trimColor: string,
  size: number = 512,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Fill with base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Apply trim pattern
  ctx.strokeStyle = trimColor;
  ctx.fillStyle = trimColor;
  ctx.lineWidth = Math.max(4, size * 0.01); // Responsive line width

  switch (trimDesign) {
    case "solid":
      // Simple solid color overlay
      ctx.fillStyle = trimColor;
      ctx.fillRect(0, 0, size, size);
      break;

    case "dashed":
      // Horizontal dashed lines
      const dashSize = size * 0.04;
      const gapSize = size * 0.02;
      ctx.setLineDash([dashSize, gapSize]);
      ctx.lineWidth = size * 0.02;
      for (let y = 0; y < size; y += size * 0.08) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
      break;

    case "dotted":
      // Dotted pattern
      ctx.setLineDash([]);
      const dotRadius = size * 0.015;
      const dotSpacing = size * 0.08;
      for (let x = dotSpacing; x < size; x += dotSpacing) {
        for (let y = dotSpacing; y < size; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case "wave":
      // Wavy lines
      ctx.setLineDash([]);
      ctx.lineWidth = size * 0.015;
      const waveSpacing = size * 0.12;
      for (let y = 0; y < size; y += waveSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= size; x += size * 0.02) {
          const waveY = y + Math.sin((x / size) * Math.PI * 6) * (size * 0.03);
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      break;

    case "double":
      // Double parallel lines
      ctx.setLineDash([]);
      ctx.lineWidth = size * 0.01;
      const doubleSpacing = size * 0.16;
      const doubleGap = size * 0.04;
      for (let y = 0; y < size; y += doubleSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.moveTo(0, y + doubleGap);
        ctx.lineTo(size, y + doubleGap);
        ctx.stroke();
      }
      break;

    case "gradient":
      // Gradient effect
      const gradient = ctx.createLinearGradient(0, 0, size, 0);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, trimColor);
      gradient.addColorStop(1, baseColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      break;

    case "embossed":
      // Embossed effect with shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = size * 0.008;
      ctx.shadowOffsetX = size * 0.004;
      ctx.shadowOffsetY = size * 0.004;
      ctx.fillStyle = trimColor;
      ctx.fillRect(0, 0, size, size);
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      break;

    case "shadow":
      // Subtle shadow effect
      ctx.shadowColor = trimColor;
      ctx.shadowBlur = size * 0.02;
      ctx.fillStyle = baseColor;
      const inset = size * 0.01;
      ctx.fillRect(inset, inset, size - inset * 2, size - inset * 2);
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      break;

    default:
      // Fallback to solid
      ctx.fillStyle = trimColor;
      ctx.fillRect(0, 0, size, size);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  console.log(`🎨 Generated trim texture: ${trimDesign} (${size}x${size})`);
  return texture;
}

// Extract UV map from Three.js model
export function extractUVMapFromThreeModel(
  scene: THREE.Object3D,
  width: number = 2048,
  height: number = 2048,
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
            uvAttribute.getY(a),
          );
          const uvB = new THREE.Vector2(
            uvAttribute.getX(b),
            uvAttribute.getY(b),
          );
          const uvC = new THREE.Vector2(
            uvAttribute.getX(c),
            uvAttribute.getY(c),
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
            uvAttribute.getY(i),
          );
          const uvB = new THREE.Vector2(
            uvAttribute.getX(i + 1),
            uvAttribute.getY(i + 1),
          );
          const uvC = new THREE.Vector2(
            uvAttribute.getX(i + 2),
            uvAttribute.getY(i + 2),
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
  maxSize: number = 2048,
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
      reject,
    );
  });
}
