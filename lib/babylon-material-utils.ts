import {
  Scene,
  AbstractMesh,
  Mesh,
  StandardMaterial,
  Texture,
  Color3,
  DynamicTexture,
} from "@babylonjs/core";
import type { MaterialSection } from "./store";

// Import Color3 constructor for default values
const defaultColor = new Color3(0.8, 0.8, 0.8);

// Convert hex color to Babylon Color3
export function hexToColor3(hex: string): Color3 {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return new Color3(1, 1, 1);
  return new Color3(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  );
}

// Create gradient texture
function createGradientTexture(
  scene: Scene,
  gradient: NonNullable<MaterialSection["gradient"]>,
): Texture | null {
  if (!gradient.enabled || gradient.colors.length < 2) return null;

  const size = 512;
  const dynamicTexture = new DynamicTexture(
    "gradientTexture",
    { width: size, height: size },
    scene,
    false,
  );

  const ctx = dynamicTexture.getContext();
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
    // Linear gradient
    const angle = (gradient.angle || 0) * (Math.PI / 180);
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

  dynamicTexture.update();
  return dynamicTexture;
}

// Create trim design texture
function createTrimDesignTexture(
  scene: Scene,
  trimDesign: string,
  baseColor: string,
  trimColor: string,
): Texture | null {
  const size = 512;
  const dynamicTexture = new DynamicTexture(
    "trimTexture",
    { width: size, height: size },
    scene,
    false,
  );

  const ctx = dynamicTexture.getContext();
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 8;

  switch (trimDesign) {
    case "stripes-horizontal":
      for (let i = 0; i < size; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
      break;
    case "stripes-vertical":
      for (let i = 0; i < size; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();
      }
      break;
    case "stripes-diagonal":
      for (let i = -size; i < size * 2; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
      }
      break;
    case "checkerboard":
      const squareSize = 64;
      for (let x = 0; x < size; x += squareSize) {
        for (let y = 0; y < size; y += squareSize) {
          if ((x / squareSize + y / squareSize) % 2 === 0) {
            ctx.fillStyle = trimColor;
            ctx.fillRect(x, y, squareSize, squareSize);
          }
        }
      }
      break;
    case "dots":
      ctx.fillStyle = trimColor;
      for (let x = 20; x < size; x += 40) {
        for (let y = 20; y < size; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
  }

  dynamicTexture.update();
  return dynamicTexture;
}

// Apply materials to model based on sections
export function applyMaterialsToModel(
  rootMesh: AbstractMesh,
  sections: MaterialSection[],
  scene: Scene,
): void {
  console.log("🎨 Applying materials to model, sections:", sections.length);

  // Create a map of sections by material name and ID
  const sectionMap = new Map<string, MaterialSection>();
  sections.forEach((section) => {
    sectionMap.set(section.originalName, section);
    sectionMap.set(section.id, section);
    sectionMap.set(section.name, section); // Also map by display name
  });
  
  console.log("🗺️ Section map keys:", Array.from(sectionMap.keys()));

  // Traverse all meshes
  const meshes = rootMesh.getChildMeshes(false);
  meshes.push(rootMesh);

  meshes.forEach((mesh) => {
    if (!(mesh instanceof Mesh)) return;

    // Get or create material
    let material = mesh.material as StandardMaterial;
    if (!material) {
      console.log(`Creating new material for mesh: ${mesh.name}`);
      material = new StandardMaterial(`${mesh.name}_material`, scene);
      mesh.material = material;
    }

    // Find matching section - try multiple strategies
    let section = sectionMap.get(material.name); // Try material name first
    
    if (!section) {
      section = sectionMap.get(mesh.name); // Try mesh name
    }
    
    if (!section) {
      // Try to find by originalName matching material name
      for (const [, sectionData] of sectionMap.entries()) {
        if (sectionData.originalName === material.name || sectionData.originalName === mesh.name) {
          section = sectionData;
          break;
        }
      }
    }

    if (!section) {
      // Check combined sections
      for (const [, sectionData] of sectionMap.entries()) {
        if (
          sectionData.combinedOriginalNames &&
          (sectionData.combinedOriginalNames.includes(material.name) ||
            sectionData.combinedOriginalNames.includes(mesh.name))
        ) {
          section = sectionData;
          break;
        }
      }
    }

    if (!section) {
      console.log(`⚠️ No section found for mesh: ${mesh.name}, material: ${material.name}`);
      console.log(`   Available section keys:`, Array.from(sectionMap.keys()).slice(0, 5));
      return;
    }

    console.log(`🎯 Applying material to: ${mesh.name} (${material.name}), color: ${section.color}`);

    // Dispose old texture if exists
    if (material.diffuseTexture) {
      const oldTexture = material.diffuseTexture;
      material.diffuseTexture = null;
      oldTexture.dispose();
    }

    // Apply custom texture if available
    if (section.customTexture) {
      console.log(`📸 Applying custom texture to ${section.name}`);
      
      const texture = new Texture(
        section.customTexture,
        scene,
        false,
        true,
        Texture.TRILINEAR_SAMPLINGMODE,
        () => {
          console.log(`✅ Custom texture loaded for ${section.name}`);
        },
        (message) => {
          console.error(`❌ Failed to load texture for ${section.name}:`, message);
        },
      );
      
      texture.hasAlpha = false;
      material.diffuseTexture = texture;
      material.diffuseColor = new Color3(1, 1, 1); // White to show texture properly
    } else if (section.trimDesign && section.trimDesign !== "none") {
      // Apply trim design
      const trimTexture = createTrimDesignTexture(
        scene,
        section.trimDesign,
        section.color,
        "#ffffff",
      );
      if (trimTexture) {
        material.diffuseTexture = trimTexture;
        material.diffuseColor = new Color3(1, 1, 1);
      }
    } else if (section.gradient?.enabled) {
      // Apply gradient
      const gradientTexture = createGradientTexture(scene, section.gradient);
      if (gradientTexture) {
        material.diffuseTexture = gradientTexture;
        material.diffuseColor = new Color3(1, 1, 1);
      }
    } else {
      // Apply solid color - make sure no texture is blocking it
      const existingTexture = material.diffuseTexture;
      if (existingTexture) {
        material.diffuseTexture = null;
        try {
          (existingTexture as Texture).dispose();
        } catch (e) {
          console.warn("Could not dispose texture:", e);
        }
      }
      
      const newColor = hexToColor3(section.color);
      
      // FORCE color update by creating new Color3 instance
      material.diffuseColor = new Color3(newColor.r, newColor.g, newColor.b);
      material.emissiveColor = new Color3(0, 0, 0);
      material.ambientColor = new Color3(0, 0, 0);
      material.specularColor = new Color3(0.2, 0.2, 0.2);
      material.alpha = 1.0;
      material.backFaceCulling = true;
      
      // Force material properties
      material.useAlphaFromDiffuseTexture = false;
      material.transparencyMode = null;
      
      console.log(`  ✓ Set color to ${section.color} (RGB: ${newColor.r.toFixed(2)}, ${newColor.g.toFixed(2)}, ${newColor.b.toFixed(2)})`);
      console.log(`  ✓ Material diffuseColor is now: (${material.diffuseColor.r.toFixed(2)}, ${material.diffuseColor.g.toFixed(2)}, ${material.diffuseColor.b.toFixed(2)})`);
    }

    // Apply material properties
    material.specularPower = (1 - (section.roughness ?? 0.5)) * 128;
    material.specularColor = new Color3(
      section.metalness ?? 0.5,
      section.metalness ?? 0.5,
      section.metalness ?? 0.5,
    );
    
    // Wireframe
    material.wireframe = section.wireframe ?? false;
    
    // CRITICAL: Force material and mesh to update
    material.markDirty();
    material.freeze(); // Freeze to force update
    material.unfreeze(); // Then unfreeze
    mesh.refreshBoundingInfo();
    mesh.computeWorldMatrix(true);
    
    console.log(`  ✅ Material updated and forced refresh`);
  });

  console.log(`✅ Finished applying materials to ${meshes.length} meshes`);
  
  // Force scene to render multiple times to ensure visual update
  scene.render();
  requestAnimationFrame(() => scene.render());
  setTimeout(() => scene.render(), 10);
  setTimeout(() => scene.render(), 50);

  console.log("✅ Materials applied successfully");
}

// Extract sections from model
export function extractSectionsFromModel(
  rootMesh: AbstractMesh,
  modelUrl: string,
): MaterialSection[] {
  console.log("🔍 Extracting sections from model");

  const sections: MaterialSection[] = [];
  const processedMaterials = new Set<string>();

  const meshes = rootMesh.getChildMeshes(false);
  meshes.push(rootMesh);

  meshes.forEach((mesh) => {
    if (!(mesh instanceof Mesh)) return;

    let material = mesh.material as StandardMaterial;
    
    // Create material if it doesn't exist
    if (!material) {
      console.log(`Creating material for mesh during extraction: ${mesh.name}`);
      material = new StandardMaterial(`${mesh.name}_material`, mesh.getScene());
      mesh.material = material;
    }

    const materialName = material.name || mesh.name || "Unnamed";
    
    if (processedMaterials.has(materialName)) return;
    processedMaterials.add(materialName);

    // Get current color
    const color = material.diffuseColor || new Color3(0.8, 0.8, 0.8);
    const hexColor = `#${Math.round(color.r * 255)
      .toString(16)
      .padStart(2, "0")}${Math.round(color.g * 255)
      .toString(16)
      .padStart(2, "0")}${Math.round(color.b * 255)
      .toString(16)
      .padStart(2, "0")}`;

    const section: MaterialSection = {
      id: materialName, // Use material name as ID for easier matching
      name: materialName,
      originalName: materialName,
      category: "Other",
      color: hexColor,
      roughness: material.specularPower ? 1 - material.specularPower / 128 : 0.5,
      metalness: material.specularColor ? material.specularColor.r : 0.5,
      wireframe: material.wireframe || false,
    };

    sections.push(section);
    console.log(`📋 Extracted section: ${materialName}, color: ${hexColor}`);
  });

  console.log(`✅ Extracted ${sections.length} sections`);
  return sections;
}
