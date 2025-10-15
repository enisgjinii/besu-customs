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

            const originalName =
              material.name || `Material ${sections.length + 1}`;
            const name = getUserFriendlyName(originalName);
            const category = categorizeMaterial(originalName);

            sections.push({
              id: materialId,
              name,
              originalName,
              category,
              color: `#${material.color.getHexString()}`,
              // Use fixed values for roughness and metalness since we removed the UI controls
              roughness: 0.5,
              metalness: 0.5,
              // Set wireframe to false since we removed the UI control
              wireframe: false,
              customTexture: undefined,
            });
          }
        }
      });
    }
  });

  // Special handling for baseball jerseys to reorder sections
  return reorderBaseballJerseySections(sections);
}

/**
 * Reorder sections for baseball jerseys to ensure front comes before back
 * and apply specific naming rules
 * @param sections Array of material sections
 * @returns Reordered array of material sections
 */
function reorderBaseballJerseySections(sections: MaterialSection[]): MaterialSection[] {
  // Check if this might be a baseball jersey by looking at section names
  const isBaseballJersey = sections.some(section => 
    (section.originalName?.toLowerCase().includes('baseball') && 
    section.originalName?.toLowerCase().includes('jersey')) ||
    section.name.toLowerCase().includes('baseball jersey') ||
    sections.some(s => s.originalName?.includes('Body_B') || s.originalName?.includes('Body_F'))
  );
  
  if (!isBaseballJersey) {
    return sections;
  }
  
  // Create a new array to avoid mutating the original
  const updatedSections = [...sections];
  
  // Apply specific naming rules for baseball jersey materials
  updatedSections.forEach(section => {
    // Handle Body materials with specific naming
    if (section.originalName?.includes('Body_F')) {
      section.name = 'Front';
    } else if (section.originalName?.includes('Body_B')) {
      section.name = 'Back';
    }
    
    // Handle Button materials with specific naming
    if (section.originalName?.includes('Button_1')) {
      section.name = 'All Buttons';
    } else if (section.originalName?.includes('Default_Button_3683977')) {
      section.name = 'Top Button';
    } else if (section.originalName?.includes('Default_Button_3683978')) {
      section.name = 'Button Stitching Color';
    }
    
    // Keep collar and sleeve names as is (they should already be correct)
    if (section.originalName?.includes('Collar')) {
      section.name = 'Collar';
    } else if (section.originalName?.includes('Sleeve')) {
      section.name = 'Sleeve';
    }
  });
  
  // Create the specific order: Front, Back, All Buttons, Top Button, Button Stitching Color, Collar, Sleeve
  const orderedSections: MaterialSection[] = [];
  
  // Add Front
  const frontSection = updatedSections.find(section => section.name === 'Front');
  if (frontSection) orderedSections.push(frontSection);
  
  // Add Back
  const backSection = updatedSections.find(section => section.name === 'Back');
  if (backSection) orderedSections.push(backSection);
  
  // Add All Buttons
  const allButtonsSection = updatedSections.find(section => section.name === 'All Buttons');
  if (allButtonsSection) orderedSections.push(allButtonsSection);
  
  // Add Top Button
  const topButtonSection = updatedSections.find(section => section.name === 'Top Button');
  if (topButtonSection) orderedSections.push(topButtonSection);
  
  // Add Button Stitching Color
  const buttonStitchingSection = updatedSections.find(section => section.name === 'Button Stitching Color');
  if (buttonStitchingSection) orderedSections.push(buttonStitchingSection);
  
  // Add Collar
  const collarSection = updatedSections.find(section => section.name === 'Collar');
  if (collarSection) orderedSections.push(collarSection);
  
  // Add Sleeve
  const sleeveSection = updatedSections.find(section => section.name === 'Sleeve');
  if (sleeveSection) orderedSections.push(sleeveSection);
  
  // Add any remaining sections that weren't specifically ordered
  const remainingSections = updatedSections.filter(section => 
    !orderedSections.includes(section)
  );
  
  return [...orderedSections, ...remainingSections];
}

export function getUserFriendlyName(name: string): string {
  // Remove all numbers and underscores, then clean up extra spaces
  let cleanedName = name.replace(/[_\d]+/g, " ").trim();
  // Replace multiple spaces with single space
  cleanedName = cleanedName.replace(/\s+/g, " ").trim();

  const lowerCleanedName = cleanedName.toLowerCase();

  // Handle Baseball Jersey specific naming
  if (name.includes('Body_F')) {
    return "Front";
  }
  if (name.includes('Body_B')) {
    return "Back";
  }
  if (name.includes('Button_1')) {
    return "All Buttons";
  }
  if (name.includes('Default_Button_3683977')) {
    return "Top Button";
  }
  if (name.includes('Default_Button_3683978')) {
    return "Button Stitching Color";
  }
  if (name.includes('Collar')) {
    return "Collar";
  }
  if (name.includes('Sleeve')) {
    return "Sleeve";
  }

  // Handle Baseball Jersey -> baseball jersey renaming
  if (lowerCleanedName.includes("baseball") && lowerCleanedName.includes("pants")) {
    // Replace "pants" with "jersey"
    cleanedName = cleanedName.replace(/pants/gi, "jersey");
  }

  // Specific matching for common clothing terms - prioritize these
  if (lowerCleanedName.includes("topstitch")) {
    return "Stitching"; // Changed from "Topstitch" to "Stitching" per requirements
  }
  if (
    lowerCleanedName.includes("strap") &&
    !lowerCleanedName.includes("strapless")
  ) {
    return "Strap";
  }
  if (lowerCleanedName.includes("brim")) {
    return "Brim";
  }
  if (lowerCleanedName.includes("button")) {
    // More specific button matching
    if (lowerCleanedName.includes("buttonhole")) {
      return "Buttonhole";
    }
    if (lowerCleanedName.includes("button 1")) {
      return "All Buttons";
    }
    if (lowerCleanedName.includes("button 2")) {
      return "Top Button";
    }
    if (lowerCleanedName.includes("button 3")) {
      return "Button Stitching Color";
    }
    return "Button";
  }
  if (
    (lowerCleanedName.includes("main") && lowerCleanedName.includes("body")) ||
    lowerCleanedName.includes("main body")
  ) {
    return "Main Body";
  }
  if (
    lowerCleanedName.includes("front") &&
    lowerCleanedName.includes("panel")
  ) {
    return "Front Panel";
  }
  if (lowerCleanedName.includes("back") && lowerCleanedName.includes("panel")) {
    return "Back Panel";
  }
  if (lowerCleanedName.includes("front")) {
    return "Front";
  }
  if (lowerCleanedName.includes("back")) {
    return "Back";
  }
  if (lowerCleanedName.includes("panel")) {
    return "Panel";
  }
  if (lowerCleanedName.includes("body")) {
    return "Body";
  }
  if (lowerCleanedName.includes("main")) {
    return "Main";
  }
  if (
    lowerCleanedName.includes("trim") ||
    lowerCleanedName.includes("piping")
  ) {
    return "Trim";
  }
  if (
    lowerCleanedName.includes("logo") ||
    lowerCleanedName.includes("emblem")
  ) {
    return "Logo";
  }
  if (lowerCleanedName.includes("pocket")) {
    return "Pocket";
  }
  if (
    lowerCleanedName.includes("collar") ||
    lowerCleanedName.includes("neck")
  ) {
    return "Collar";
  }
  if (lowerCleanedName.includes("sleeve")) {
    return "Sleeve";
  }
  if (lowerCleanedName.includes("hood")) {
    return "Hood";
  }
  if (
    lowerCleanedName.includes("stripe") ||
    lowerCleanedName.includes("strip")
  ) {
    return "Stripe";
  }
  if (lowerCleanedName.includes("number") || lowerCleanedName.includes("num")) {
    return "Number";
  }

  // If we still have a reasonable name, use it (but make it more presentable)
  if (cleanedName.length > 0) {
    // If it's not too long, clean it up and use it
    if (cleanedName.length <= 25) {
      // Remove common prefixes
      cleanedName = cleanedName.replace(/^default\s+/i, "");
      cleanedName = cleanedName.replace(/^cap\s+/i, "");
      cleanedName = cleanedName.replace(/^special\s+/i, "");
      cleanedName = cleanedName.replace(/^simple\s+/i, "");
      cleanedName = cleanedName.replace(/^basic\s+/i, "");

      // Capitalize first letter of each word
      return (
        cleanedName.replace(/\b\w/g, (char) => char.toUpperCase()).trim() ||
        "Material"
      );
    }
    // For longer names, try to extract key words
    const words = cleanedName.split(" ");
    if (words.length > 1) {
      // Take the last significant word
      for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i].toLowerCase();
        if (
          word.length > 2 &&
          !["the", "and", "for", "with", "part", "detail", "design"].includes(
            word,
          )
        ) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
      }
    }
  }

  // Fallback
  return "Material";
}

export function categorizeMaterial(name: string): MaterialSection["category"] {
  // Remove trailing numbers and any text that follows them for categorization
  const cleanedName = name.replace(/_\d+.*$/, "").trim();
  const lowerName = cleanedName.toLowerCase();

  // Special handling for baseball jersey to ensure proper categorization
  if (name.includes('Body_F') || name.includes('Body_B') || 
      lowerName.includes("front") || lowerName.includes("back")) {
    return "Body";
  }
  
  if (name.includes('Button')) {
    return "Other";
  }
  
  if (name.includes('Collar')) {
    return "Piping/Trim";
  }
  
  if (name.includes('Sleeve')) {
    return "Panels";
  }

  // Special handling for baseball jersey to ensure proper categorization
  if (lowerName.includes("baseball") && lowerName.includes("jersey")) {
    // Front/Back categorization for baseball jersey
    if (lowerName.includes("front")) {
      return "Body";
    }
    if (lowerName.includes("back")) {
      return "Body";
    }
    // Keep other materials in their appropriate categories
  }

  // Front/Back categorization
  if (lowerName.includes("front") || lowerName.includes("back")) {
    return "Body";
  }

  if (
    lowerName.includes("body") ||
    lowerName.includes("main") ||
    lowerName.includes("chest") ||
    lowerName.includes("torso")
  ) {
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

function createGradientTexture(
  gradient: MaterialSection["gradient"],
): THREE.CanvasTexture | null {
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

            material.roughness = section.roughness ?? 0.5;
            material.metalness = section.metalness ?? 0.5;
            // Always set wireframe to false since we removed the UI control
            material.wireframe = false;
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
