import { AbstractMesh, Mesh, VertexBuffer } from "@babylonjs/core";

/**
 * Extract a UV wireframe map from the entire Babylon model (all meshes combined)
 * Returns a PNG data URL sized width x height
 */
export function extractCompleteUVMapBabylon(
  rootMesh: AbstractMesh,
  width = 1024,
  height = 1024,
): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;

  // white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;

  const meshes = rootMesh.getChildMeshes(false);
  meshes.push(rootMesh);

  let hasUVs = false;

  for (const m of meshes) {
    if (!(m instanceof Mesh)) continue;

    const uvs = m.getVerticesData(VertexBuffer.UVKind);
    const indices = m.getIndices();

    if (!uvs || uvs.length === 0) continue;
    hasUVs = true;

    ctx.strokeStyle = "#666";
    ctx.beginPath();

    if (indices && indices.length > 0) {
      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 2;
        const i2 = indices[i + 1] * 2;
        const i3 = indices[i + 2] * 2;

        const u1 = uvs[i1] * width;
        const v1 = (1 - uvs[i1 + 1]) * height;
        const u2 = uvs[i2] * width;
        const v2 = (1 - uvs[i2 + 1]) * height;
        const u3 = uvs[i3] * width;
        const v3 = (1 - uvs[i3 + 1]) * height;

        ctx.moveTo(u1, v1);
        ctx.lineTo(u2, v2);
        ctx.lineTo(u3, v3);
        ctx.lineTo(u1, v1);
      }
    } else {
      for (let i = 0; i < uvs.length; i += 6) {
        const u1 = uvs[i] * width;
        const v1 = (1 - uvs[i + 1]) * height;
        const u2 = uvs[i + 2] * width;
        const v2 = (1 - uvs[i + 3]) * height;
        const u3 = uvs[i + 4] * width;
        const v3 = (1 - uvs[i + 5]) * height;

        ctx.moveTo(u1, v1);
        ctx.lineTo(u2, v2);
        ctx.lineTo(u3, v3);
        ctx.lineTo(u1, v1);
      }
    }

    ctx.stroke();
  }

  if (!hasUVs) return null;
  return canvas.toDataURL("image/png");
}
