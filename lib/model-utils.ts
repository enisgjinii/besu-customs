import * as THREE from "three";
import type { MaterialSection } from "./store";

export function extractSections(scene: THREE.Group): MaterialSection[] {
  const sections: MaterialSection[] = [];
  const processedMaterials = new Set<string>();

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          const materialId = material.uuid;

          if (!processedMaterials.has(materialId)) {
            processedMaterials.add(materialId);

            const originalName = material.name || `Material ${sections.length + 1}`;
            const name = getUserFriendlyName(originalName);
            const category = categorizeMaterial(originalName);

            sections.push({
              id: materialId,
              name,
              originalName,
              category,
              color: `#${material.color.getHexString()}`,
              roughness: material.roughness,
              metalness: material.metalness,
              wireframe: material.wireframe,
              customTexture: undefined,
            });
          }
        }
      });
    }
  });

  return sections;
}

export function getUserFriendlyName(name: string): string {
  const lowerName = name.toLowerCase();

  // Remove trailing numbers and any text that follows them (like _2473, _2456_Name, etc.)
  // This regex matches underscore followed by 1 or more digits, optionally followed by anything until end of string
  let cleanedName = name.replace(/_\d+.*$/, '').trim();
  
  // Also handle cases where there might be spaces before numbers
  cleanedName = cleanedName.replace(/\s+\d+.*$/, '').trim();
  
  const lowerCleanedName = cleanedName.toLowerCase();

  // Front/Back detection
  if (lowerCleanedName.includes("front") && !lowerCleanedName.includes("back")) {
    return "Front Panel";
  }
  if (lowerCleanedName.includes("back") && !lowerCleanedName.includes("front")) {
    return "Back Panel";
  }
  if (lowerCleanedName.includes("left") && !lowerCleanedName.includes("right")) {
    return "Left Side";
  }
  if (lowerCleanedName.includes("right") && !lowerCleanedName.includes("left")) {
    return "Right Side";
  }

  // Common clothing terms - be more specific with matching
  if (lowerCleanedName.includes("sleeve") && !lowerCleanedName.includes("sleeveless")) {
    return "Sleeve";
  }
  if ((lowerCleanedName.includes("collar") || lowerCleanedName.includes("neck")) && 
      !lowerCleanedName.includes("collar stay") && !lowerCleanedName.includes("collarbone")) {
    return "Collar/Neck";
  }
  if (lowerCleanedName.includes("hood") && !lowerCleanedName.includes("hooded")) {
    return "Hood";
  }
  if (lowerCleanedName.includes("pocket") && !lowerCleanedName.includes("pocketless")) {
    return "Pocket";
  }
  if (lowerCleanedName.includes("logo") || lowerCleanedName.includes("emblem")) {
    return "Logo/Emblem";
  }
  if ((lowerCleanedName.includes("number") || lowerCleanedName.includes("num")) && 
      !lowerCleanedName.includes("numberless")) {
    return "Number";
  }
  if (lowerCleanedName.includes("stripe") || lowerCleanedName.includes("strip")) {
    return "Stripe";
  }
  if (lowerCleanedName.includes("trim") || lowerCleanedName.includes("piping")) {
    return "Trim/Piping";
  }
  if (lowerCleanedName.includes("button") && !lowerCleanedName.includes("buttonless")) {
    // More specific button matching
    if (lowerCleanedName.includes("buttonhole")) {
      return "Buttonhole";
    }
    return "Button";
  }
  if (lowerCleanedName.includes("topstitch")) {
    return "Topstitch";
  }
  if (lowerCleanedName.includes("strap")) {
    return "Strap";
  }
  if (lowerCleanedName.includes("brim")) {
    return "Brim";
  }

  // Body parts
  if ((lowerCleanedName.includes("body") || lowerCleanedName.includes("main")) && 
      !lowerCleanedName.includes("bodyless") && !lowerCleanedName.includes("mainly")) {
    // More specific body matching
    if (lowerCleanedName.includes("main body")) {
      return "Main Body";
    }
    if (lowerCleanedName.includes("body")) {
      return "Body";
    }
    return "Main";
  }
  if ((lowerCleanedName.includes("chest") || lowerCleanedName.includes("torso")) && 
      !lowerCleanedName.includes("chest pocket")) {
    return "Chest/Torso";
  }
  if (lowerCleanedName.includes("arm") && !lowerCleanedName.includes("armor")) {
    return "Arm";
  }
  if ((lowerCleanedName.includes("leg") || lowerCleanedName.includes("pant")) && 
      !lowerCleanedName.includes("legend")) {
    return "Leg/Pant";
  }

  // Generic fallbacks
  if (lowerCleanedName.includes("panel") && !lowerCleanedName.includes("paneling")) {
    return "Panel";
  }
  if ((lowerCleanedName.includes("part") || lowerCleanedName.includes("section")) && 
      !lowerCleanedName.includes("partial")) {
    return "Section";
  }

  // If we can't determine a better name, use a cleaner version
  const finalCleaned = cleanedName.replace(/^Material\s+\d+/i, "").trim();
  return finalCleaned || `Material ${cleanedName}`;
}

export function categorizeMaterial(name: string): MaterialSection["category"] {
  // Remove trailing numbers and any text that follows them for categorization
  const cleanedName = name.replace(/_\d+.*$/, '').trim();
  const lowerName = cleanedName.toLowerCase();

  // Front/Back categorization
  if (lowerName.includes("front") || lowerName.includes("back")) {
    return "Body";
  }

  if (lowerName.includes("body") || lowerName.includes("main") || lowerName.includes("chest") || lowerName.includes("torso")) {
    return "Body";
  }
  if (
    lowerName.includes("panel") ||
    lowerName.includes("door") ||
    lowerName.includes("hood") ||
    lowerName.includes("sleeve") ||
    lowerName.includes("arm")
  ) {
    return "Panels";
  }
  if (
    lowerName.includes("trim") ||
    lowerName.includes("pipe") ||
    lowerName.includes("edge") ||
    lowerName.includes("piping") ||
    lowerName.includes("collar") ||
    lowerName.includes("neck") ||
    lowerName.includes("pocket") ||
    lowerName.includes("stripe") ||
    lowerName.includes("logo") ||
    lowerName.includes("number")
  ) {
    return "Piping/Trim";
  }

  return "Other";
}

function createGradientTexture(gradient: MaterialSection["gradient"]): THREE.CanvasTexture | null {
  if (!gradient?.enabled) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let gradientObj: CanvasGradient;

  if (gradient.type === "linear") {
    const angle = (gradient.angle || 90) * (Math.PI / 180);
    const x1 = 256 + Math.cos(angle) * 256;
    const y1 = 256 + Math.sin(angle) * 256;
    const x2 = 256 - Math.cos(angle) * 256;
    const y2 = 256 - Math.sin(angle) * 256;
    gradientObj = ctx.createLinearGradient(x1, y1, x2, y2);
  } else {
    gradientObj = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  }

  const stops = gradient.stops || gradient.colors.map((_, i) => i / (gradient.colors.length - 1));
  gradient.colors.forEach((color, i) => {
    gradientObj.addColorStop(stops[i] || i / (gradient.colors.length - 1), color);
  });

  ctx.fillStyle = gradientObj;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

export function applyMaterialUpdates(
  scene: THREE.Group,
  sections: MaterialSection[],
) {
  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          const section = sectionMap.get(material.uuid);

          if (section) {
            // Apply custom texture if available
            if (section.customTexture) {
              const loader = new THREE.TextureLoader();
              loader.load(section.customTexture, (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = false;
                material.map = texture;
                material.needsUpdate = true;
              });
            } else if (section.gradient?.enabled) {
              // Apply gradient texture
              const gradientTexture = createGradientTexture(section.gradient);
              if (gradientTexture) {
                material.map = gradientTexture;
                material.color.set("#ffffff"); // Set to white to show texture properly
                material.needsUpdate = true;
              }
            } else {
              // Use base color if no texture or gradient
              material.map = null;
              material.color.set(section.color);
            }

            material.roughness = section.roughness;
            material.metalness = section.metalness;
            material.wireframe = section.wireframe;
            material.needsUpdate = true;
          }
        }
      });
    }
  });
}

export function getMeshByMaterialId(
  scene: THREE.Group,
  materialId: string,
): THREE.Mesh | null {
  let foundMesh: THREE.Mesh | null = null;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (material.uuid === materialId) {
          foundMesh = child;
        }
      });
    }
  });

  return foundMesh;
}