import {
  Scene,
  AbstractMesh,
  Mesh,
  StandardMaterial,
  PBRMaterial,
  Material,
  Texture,
  Color3,
  DynamicTexture,
} from "@babylonjs/core";
import type { MaterialSection } from "./store";
import { parseMaterialName } from "./material-name-parser";

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
  size = 512,
): Texture | null {
  if (!gradient.enabled || gradient.colors.length < 2) return null;

  // size parameter passed in for device-based scaling
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
  size = 512,
): Texture | null {
  // size parameter passed in for device-based scaling
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

// Helper function to find matching section with improved logic
function findMatchingSection(
  mesh: Mesh,
  material: Material,
  sectionMap: Map<string, MaterialSection>,
  sections: MaterialSection[],
): MaterialSection | null {
  // Strategy 1: Direct material name match
  let section = sectionMap.get(material.name);
  if (section) return section;

  // Strategy 2: Direct mesh name match
  section = sectionMap.get(mesh.name);
  if (section) return section;

  // Strategy 3: Match by originalName
  for (const sectionData of sections) {
    if (
      sectionData.originalName === material.name ||
      sectionData.originalName === mesh.name
    ) {
      return sectionData;
    }
  }

  // Strategy 4: Check combined sections
  for (const sectionData of sections) {
    if (sectionData.combinedOriginalNames) {
      if (
        sectionData.combinedOriginalNames.includes(material.name) ||
        sectionData.combinedOriginalNames.includes(mesh.name)
      ) {
        return sectionData;
      }
    }
  }

  // Strategy 5: Partial name matching (case-insensitive)
  const materialNameLower = (material.name || "").toLowerCase();
  const meshNameLower = mesh.name.toLowerCase();

  for (const sectionData of sections) {
    const sectionNameLower = sectionData.originalName.toLowerCase();
    if (
      materialNameLower.includes(sectionNameLower) ||
      sectionNameLower.includes(materialNameLower) ||
      meshNameLower.includes(sectionNameLower) ||
      sectionNameLower.includes(meshNameLower)
    ) {
      return sectionData;
    }
  }

  return null;
}

// Apply materials to model based on sections
export async function createScaledTextureFromUrl(
  scene: Scene,
  url: string,
  maxSize: number,
): Promise<Texture> {
  return new Promise((resolve, reject) => {
    // If already a data URL (base64), use it directly but enforce scaling
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let { width, height } = img;
      const maxDim = Math.max(width, height);
      if (maxSize && maxDim > maxSize) {
        const scale = maxSize / maxDim;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png", 0.9);
        const tex = new Texture(
          dataUrl,
          scene,
          false,
          false,
          Texture.TRILINEAR_SAMPLINGMODE,
        );
        tex.hasAlpha = true;
        resolve(tex);
      } else {
        const tex = new Texture(url, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
        tex.hasAlpha = true;
        resolve(tex);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

export function applyMaterialsToModel(
  rootMesh: AbstractMesh,
  sections: MaterialSection[],
  scene: Scene,
  maxTextureSize = 4096,
): void {
  console.log("🎨 Applying materials to model, sections:", sections.length);

  // Create a map of sections by material name and ID
  const sectionMap = new Map<string, MaterialSection>();
  for (const section of sections) {
    sectionMap.set(section.originalName, section);
    sectionMap.set(section.id, section);
    sectionMap.set(section.name, section);
  }

  // Traverse all meshes
  const meshes = rootMesh.getChildMeshes(false);
  meshes.push(rootMesh);

  let appliedCount = 0;
  let skippedCount = 0;

  meshes.forEach((mesh) => {
    if (!(mesh instanceof Mesh)) return;

    let material = mesh.material as Material | null;
    if (!material) {
      material = new StandardMaterial(`${mesh.name}_material`, scene);
      mesh.material = material;
    }

    const section = findMatchingSection(
      mesh,
      material as any,
      sectionMap,
      sections,
    );
    if (!section) {
      skippedCount++;
      return;
    }

    const isPBR = material instanceof PBRMaterial;

    // Clear existing color textures that would override base color
    if (isPBR) {
      const pbr = material as PBRMaterial;
      if (pbr.albedoTexture) {
        try {
          pbr.albedoTexture.dispose();
        } catch {}
        pbr.albedoTexture = null as any;
      }
    } else {
      const std = material as StandardMaterial;
      if (std.diffuseTexture) {
        try {
          std.diffuseTexture.dispose();
        } catch {}
        std.diffuseTexture = null as any;
      }
    }

    // Apply texture/gradient/solid color
    if (section.customTexture) {
      console.log(
        `[BabylonMaterial] Applying customTexture to ${section.name}`,
      );
      // Do NOT invert Y here — textures coming from the UV editor are pre-flipped.
      const tex = new Texture(section.customTexture, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
      tex.hasAlpha = true;
      if (isPBR) {
        const pbr = material as PBRMaterial;
        pbr.albedoTexture = tex;
        pbr.albedoColor = new Color3(1, 1, 1);
        pbr.useAlphaFromAlbedoTexture = true;
      } else {
        const std = material as StandardMaterial;
        std.diffuseTexture = tex;
        std.diffuseColor = new Color3(1, 1, 1);
      }
    } else if (section.trimDesign && section.trimDesign !== "none") {
      const tex = createTrimDesignTexture(
        scene,
        section.trimDesign,
        section.color,
        "#ffffff",
        Math.min(512, maxTextureSize),
      );
      if (tex) {
        if (isPBR) {
          const pbr = material as PBRMaterial;
          pbr.albedoTexture = tex;
          pbr.albedoColor = new Color3(1, 1, 1);
        } else {
          const std = material as StandardMaterial;
          std.diffuseTexture = tex;
          std.diffuseColor = new Color3(1, 1, 1);
        }
      }
    } else if (section.gradient?.enabled) {
      const tex = createGradientTexture(scene, section.gradient, Math.min(512, maxTextureSize));
      if (tex) {
        if (isPBR) {
          const pbr = material as PBRMaterial;
          pbr.albedoTexture = tex;
          pbr.albedoColor = new Color3(1, 1, 1);
        } else {
          const std = material as StandardMaterial;
          std.diffuseTexture = tex;
          std.diffuseColor = new Color3(1, 1, 1);
        }
      }
    } else {
      const color = hexToColor3(section.color);
      if (isPBR) {
        const pbr = material as PBRMaterial;
        pbr.albedoColor = new Color3(color.r, color.g, color.b);
        pbr.emissiveColor = new Color3(0, 0, 0);
        pbr.alpha = 1;
      } else {
        const std = material as StandardMaterial;
        std.diffuseColor = new Color3(color.r, color.g, color.b);
        std.emissiveColor = new Color3(0, 0, 0);
        std.ambientColor = new Color3(0, 0, 0);
        std.specularColor = new Color3(0.2, 0.2, 0.2);
        std.alpha = 1;
        std.backFaceCulling = true;
        std.useAlphaFromDiffuseTexture = false;
      }
    }

    // Roughness/metalness
    if (isPBR) {
      const pbr = material as PBRMaterial;
      if (section.roughness !== undefined) pbr.roughness = section.roughness;
      if (section.metalness !== undefined) pbr.metallic = section.metalness;
    } else {
      const std = material as StandardMaterial;
      std.specularPower = (1 - (section.roughness ?? 0.5)) * 128;
      std.specularColor = new Color3(
        section.metalness ?? 0.5,
        section.metalness ?? 0.5,
        section.metalness ?? 0.5,
      );
    }

    // Wireframe
    (material as any).wireframe = section.wireframe ?? false;

    material.markDirty();
    mesh.refreshBoundingInfo();
    mesh.computeWorldMatrix(true);
    appliedCount++;
  });

  console.log(
    `✅ Finished applying materials: ${appliedCount} applied, ${skippedCount} skipped out of ${meshes.length} meshes`,
  );

  scene.render();
  requestAnimationFrame(() => scene.render());
  setTimeout(() => scene.render(), 10);
  setTimeout(() => scene.render(), 50);
}

// Extract sections from model
export function extractSectionsFromModel(
  rootMesh: AbstractMesh,
  modelUrl: string,
): MaterialSection[] {
  const sections: MaterialSection[] = [];
  const processedMaterials = new Set<string>();

  const meshes = rootMesh.getChildMeshes(false);
  meshes.push(rootMesh);

  meshes.forEach((mesh) => {
    if (!(mesh instanceof Mesh)) return;

    let material = mesh.material as Material | null;
    if (!material) {
      material = new StandardMaterial(`${mesh.name}_material`, mesh.getScene());
      mesh.material = material;
    }

    const materialName = (material.name || mesh.name || "Unnamed").toString();
    if (processedMaterials.has(materialName)) return;
    processedMaterials.add(materialName);

    const parsed = parseMaterialName(materialName);

    const isPBR = material instanceof PBRMaterial;
    const baseColor: Color3 | undefined = isPBR
      ? (material as PBRMaterial).albedoColor
      : (material as StandardMaterial).diffuseColor;

    let hexColor: string;
    if (
      baseColor &&
      (baseColor.r !== baseColor.g ||
        baseColor.g !== baseColor.b ||
        baseColor.r < 0.7 ||
        baseColor.r > 0.9)
    ) {
      hexColor = `#${Math.round(baseColor.r * 255)
        .toString(16)
        .padStart(2, "0")}${Math.round(baseColor.g * 255)
        .toString(16)
        .padStart(2, "0")}${Math.round(baseColor.b * 255)
        .toString(16)
        .padStart(2, "0")}`;
    } else {
      hexColor = parsed.defaultColor;
    }

    const std = material as StandardMaterial;
    const pbr = material as PBRMaterial;
    const section: MaterialSection = {
      id: materialName,
      name: parsed.displayName,
      originalName: materialName,
      category: parsed.category,
      color: hexColor,
      roughness: isPBR
        ? typeof pbr.roughness === "number"
          ? pbr.roughness
          : 0.5
        : typeof std.specularPower === "number"
          ? 1 - std.specularPower / 128
          : 0.5,
      metalness: isPBR
        ? typeof pbr.metallic === "number"
          ? pbr.metallic
          : 0.5
        : std.specularColor
          ? std.specularColor.r
          : 0.5,
      wireframe: !!(material as any).wireframe,
    };

    sections.push(section);
  });

  sections.sort((a, b) => {
    const priorityA = parseMaterialName(a.originalName).priority;
    const priorityB = parseMaterialName(b.originalName).priority;
    return priorityA - priorityB;
  });

  return sections;
}
