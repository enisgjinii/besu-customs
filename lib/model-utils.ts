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
            } else {
              // Use base color if no texture
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
