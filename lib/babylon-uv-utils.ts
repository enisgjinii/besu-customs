import { AbstractMesh, Mesh, VertexBuffer } from "@babylonjs/core";

/**
 * Extract a UV wireframe map from the entire Babylon model (all meshes combined)
 * Returns a PNG data URL sized width x height
 */
export function extractCompleteUVMapBabylon(
  rootMesh: AbstractMesh,
  width = 2048,
  height = 2048,
): string | null {
  // Safety check: ensure mesh is valid
  if (!rootMesh || rootMesh.isDisposed()) {
    console.warn("⚠️ Cannot extract UV map from disposed or invalid mesh");
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
    desynchronized: true // Faster rendering
  });
  if (!ctx) return null;

  // Balanced quality settings for speed
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";

  // Soft gradient background for a more friendly look
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f8f9fa");
  gradient.addColorStop(1, "#e9ecef");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Safely get child meshes
  const meshes = rootMesh.getChildMeshes(false);
  meshes.push(rootMesh);

  let hasUVs = false;

  for (const m of meshes) {
    if (!(m instanceof Mesh)) continue;

    // Skip disposed or invalid meshes
    if (m.isDisposed() || !m.isEnabled()) continue;

    const uvs = m.getVerticesData(VertexBuffer.UVKind);
    const indices = m.getIndices();

    if (!uvs || uvs.length === 0) continue;
    hasUVs = true;

    // Use colorful fills with subtle borders
    const meshHue = (meshes.indexOf(m) * 137.5) % 360; // Golden angle for color distribution

    if (indices && indices.length > 0) {
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 2;
        const i2 = indices[i + 1] * 2;
        const i3 = indices[i + 2] * 2;

        // Bounds check to prevent out-of-range access
        if (i1 + 1 >= uvs.length || i2 + 1 >= uvs.length || i3 + 1 >= uvs.length) {
          continue;
        }

        const u1 = uvs[i1] * width;
        const v1 = uvs[i1 + 1] * height;
        const u2 = uvs[i2] * width;
        const v2 = uvs[i2 + 1] * height;
        const u3 = uvs[i3] * width;
        const v3 = uvs[i3 + 1] * height;

        // Validate UV coordinates are finite numbers
        if (!isFinite(u1) || !isFinite(v1) || !isFinite(u2) ||
          !isFinite(v2) || !isFinite(u3) || !isFinite(v3)) {
          continue;
        }

        // Fill triangle with soft color
        ctx.fillStyle = `hsla(${meshHue}, 70%, 85%, 0.6)`;
        ctx.beginPath();
        ctx.moveTo(u1, v1);
        ctx.lineTo(u2, v2);
        ctx.lineTo(u3, v3);
        ctx.closePath();
        ctx.fill();

        // Draw border
        ctx.strokeStyle = `hsla(${meshHue}, 60%, 50%, 0.8)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < uvs.length; i += 6) {
        // Bounds check
        if (i + 5 >= uvs.length) {
          continue;
        }

        const u1 = uvs[i] * width;
        const v1 = uvs[i + 1] * height;
        const u2 = uvs[i + 2] * width;
        const v2 = uvs[i + 3] * height;
        const u3 = uvs[i + 4] * width;
        const v3 = uvs[i + 5] * height;

        // Validate UV coordinates are finite numbers
        if (!isFinite(u1) || !isFinite(v1) || !isFinite(u2) ||
          !isFinite(v2) || !isFinite(u3) || !isFinite(v3)) {
          continue;
        }

        // Fill triangle with soft color
        ctx.fillStyle = `hsla(${meshHue}, 70%, 85%, 0.6)`;
        ctx.beginPath();
        ctx.moveTo(u1, v1);
        ctx.lineTo(u2, v2);
        ctx.lineTo(u3, v3);
        ctx.closePath();
        ctx.fill();

        // Draw border
        ctx.strokeStyle = `hsla(${meshHue}, 60%, 50%, 0.8)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  if (!hasUVs) return null;

  return canvas.toDataURL("image/png");
}
