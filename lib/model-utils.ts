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

            const name = material.name || `Material ${sections.length + 1}`;
            const category = categorizeMaterial(name);

            sections.push({
              id: materialId,
              name,
              originalName: name,
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

function categorizeMaterial(name: string): MaterialSection["category"] {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("body") || lowerName.includes("main")) {
    return "Body";
  }
  if (
    lowerName.includes("panel") ||
    lowerName.includes("door") ||
    lowerName.includes("hood")
  ) {
    return "Panels";
  }
  if (
    lowerName.includes("trim") ||
    lowerName.includes("pipe") ||
    lowerName.includes("edge")
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
