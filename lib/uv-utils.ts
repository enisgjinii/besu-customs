import * as THREE from "three";

/**
 * Extract UV map from a mesh and render it to a canvas (optimized)
 */
export function extractUVMap(
  mesh: THREE.Mesh,
  width = 1024,
  height = 1024,
): string | null {
  const geometry = mesh.geometry;

  if (!geometry.attributes.uv) {
    console.warn("Mesh has no UV coordinates");
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { 
    alpha: true,
    willReadFrequently: false 
  });

  if (!ctx) return null;

  // Fill with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Draw UV wireframe with optimized settings
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;

  const uvAttribute = geometry.attributes.uv;
  const indexAttribute = geometry.index;

  // Batch drawing for better performance
  ctx.beginPath();

  if (indexAttribute) {
    // Indexed geometry
    for (let i = 0; i < indexAttribute.count; i += 3) {
      const i1 = indexAttribute.getX(i);
      const i2 = indexAttribute.getX(i + 1);
      const i3 = indexAttribute.getX(i + 2);

      const u1 = uvAttribute.getX(i1) * width;
      const v1 = (1 - uvAttribute.getY(i1)) * height;
      const u2 = uvAttribute.getX(i2) * width;
      const v2 = (1 - uvAttribute.getY(i2)) * height;
      const u3 = uvAttribute.getX(i3) * width;
      const v3 = (1 - uvAttribute.getY(i3)) * height;

      ctx.moveTo(u1, v1);
      ctx.lineTo(u2, v2);
      ctx.lineTo(u3, v3);
      ctx.lineTo(u1, v1);
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < uvAttribute.count; i += 3) {
      const u1 = uvAttribute.getX(i) * width;
      const v1 = (1 - uvAttribute.getY(i)) * height;
      const u2 = uvAttribute.getX(i + 1) * width;
      const v2 = (1 - uvAttribute.getY(i + 1)) * height;
      const u3 = uvAttribute.getX(i + 2) * width;
      const v3 = (1 - uvAttribute.getY(i + 2)) * height;

      ctx.moveTo(u1, v1);
      ctx.lineTo(u2, v2);
      ctx.lineTo(u3, v3);
      ctx.lineTo(u1, v1);
    }
  }

  ctx.stroke();

  return canvas.toDataURL("image/png");
}

/**
 * Extract UV map from all meshes with a specific material ID (optimized)
 * This combines UV maps from multiple meshes that share the same material
 */
export function extractUVMapForMaterial(
  scene: THREE.Group,
  materialId: string,
  width = 1024,
  height = 1024,
): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { 
    alpha: true,
    willReadFrequently: false 
  });

  if (!ctx) return null;

  // Fill with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Draw UV wireframe with optimized settings
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;

  let hasUVs = false;
  
  // Batch drawing for better performance
  ctx.beginPath();

  // Traverse all meshes in the scene
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        // Only process meshes with the matching material
        if (material.uuid === materialId) {
          const geometry = child.geometry;

          if (!geometry.attributes.uv) {
            return;
          }

          hasUVs = true;
          const uvAttribute = geometry.attributes.uv;
          const indexAttribute = geometry.index;

          if (indexAttribute) {
            // Indexed geometry
            for (let i = 0; i < indexAttribute.count; i += 3) {
              const i1 = indexAttribute.getX(i);
              const i2 = indexAttribute.getX(i + 1);
              const i3 = indexAttribute.getX(i + 2);

              const u1 = uvAttribute.getX(i1) * width;
              const v1 = (1 - uvAttribute.getY(i1)) * height;
              const u2 = uvAttribute.getX(i2) * width;
              const v2 = (1 - uvAttribute.getY(i2)) * height;
              const u3 = uvAttribute.getX(i3) * width;
              const v3 = (1 - uvAttribute.getY(i3)) * height;

              ctx.moveTo(u1, v1);
              ctx.lineTo(u2, v2);
              ctx.lineTo(u3, v3);
              ctx.lineTo(u1, v1);
            }
          } else {
            // Non-indexed geometry
            for (let i = 0; i < uvAttribute.count; i += 3) {
              const u1 = uvAttribute.getX(i) * width;
              const v1 = (1 - uvAttribute.getY(i)) * height;
              const u2 = uvAttribute.getX(i + 1) * width;
              const v2 = (1 - uvAttribute.getY(i + 1)) * height;
              const u3 = uvAttribute.getX(i + 2) * width;
              const v3 = (1 - uvAttribute.getY(i + 2)) * height;

              ctx.moveTo(u1, v1);
              ctx.lineTo(u2, v2);
              ctx.lineTo(u3, v3);
              ctx.lineTo(u1, v1);
            }
          }
        }
      });
    }
  });

  if (!hasUVs) {
    console.warn("No UV coordinates found for material:", materialId);
    return null;
  }

  ctx.stroke();
  return canvas.toDataURL("image/png");
}

/**
 * Extract UV map from the entire 3D model (all meshes combined, optimized)
 */
export function extractCompleteUVMap(
  scene: THREE.Group,
  width = 1024,
  height = 1024,
): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { 
    alpha: true,
    willReadFrequently: false 
  });

  if (!ctx) return null;

  // Fill with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Use different colors for different materials (lighter colors for better visibility)
  const colors = [
    "#666666",
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f093fb",
    "#4facfe",
    "#feca57",
  ];
  let colorIndex = 0;
  const materialColors = new Map<string, string>();

  let hasUVs = false;
  
  // Optimized rendering settings
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;

  // Traverse all meshes in the scene
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        const geometry = child.geometry;

        if (!geometry.attributes.uv) {
          return;
        }

        hasUVs = true;

        // Assign a color to this material if not already assigned
        if (!materialColors.has(material.uuid)) {
          materialColors.set(material.uuid, colors[colorIndex % colors.length]);
          colorIndex++;
        }

        ctx.strokeStyle = materialColors.get(material.uuid)!;

        const uvAttribute = geometry.attributes.uv;
        const indexAttribute = geometry.index;

        // Batch drawing for this material
        ctx.beginPath();

        if (indexAttribute) {
          // Indexed geometry
          for (let i = 0; i < indexAttribute.count; i += 3) {
            const i1 = indexAttribute.getX(i);
            const i2 = indexAttribute.getX(i + 1);
            const i3 = indexAttribute.getX(i + 2);

            const u1 = uvAttribute.getX(i1) * width;
            const v1 = (1 - uvAttribute.getY(i1)) * height;
            const u2 = uvAttribute.getX(i2) * width;
            const v2 = (1 - uvAttribute.getY(i2)) * height;
            const u3 = uvAttribute.getX(i3) * width;
            const v3 = (1 - uvAttribute.getY(i3)) * height;

            ctx.moveTo(u1, v1);
            ctx.lineTo(u2, v2);
            ctx.lineTo(u3, v3);
            ctx.lineTo(u1, v1);
          }
        } else {
          // Non-indexed geometry
          for (let i = 0; i < uvAttribute.count; i += 3) {
            const u1 = uvAttribute.getX(i) * width;
            const v1 = (1 - uvAttribute.getY(i)) * height;
            const u2 = uvAttribute.getX(i + 1) * width;
            const v2 = (1 - uvAttribute.getY(i + 1)) * height;
            const u3 = uvAttribute.getX(i + 2) * width;
            const v3 = (1 - uvAttribute.getY(i + 2)) * height;

            ctx.moveTo(u1, v1);
            ctx.lineTo(u2, v2);
            ctx.lineTo(u3, v3);
            ctx.lineTo(u1, v1);
          }
        }

        ctx.stroke();
      });
    }
  });

  if (!hasUVs) {
    console.warn("No UV coordinates found in the model");
    return null;
  }

  return canvas.toDataURL("image/png");
}

/**
 * Create a texture from a data URL
 */
export function createTextureFromDataURL(
  dataUrl: string,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      dataUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}
