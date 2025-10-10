import * as THREE from "three"

/**
 * Extract UV map from a mesh and render it to a canvas
 */
export function extractUVMap(mesh: THREE.Mesh, width = 1024, height = 1024): string | null {
  const geometry = mesh.geometry

  if (!geometry.attributes.uv) {
    console.warn("Mesh has no UV coordinates")
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) return null

  // Fill with white background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  // Draw UV wireframe
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 1

  const uvAttribute = geometry.attributes.uv
  const indexAttribute = geometry.index

  if (indexAttribute) {
    // Indexed geometry
    for (let i = 0; i < indexAttribute.count; i += 3) {
      const i1 = indexAttribute.getX(i)
      const i2 = indexAttribute.getX(i + 1)
      const i3 = indexAttribute.getX(i + 2)

      const u1 = uvAttribute.getX(i1) * width
      const v1 = (1 - uvAttribute.getY(i1)) * height
      const u2 = uvAttribute.getX(i2) * width
      const v2 = (1 - uvAttribute.getY(i2)) * height
      const u3 = uvAttribute.getX(i3) * width
      const v3 = (1 - uvAttribute.getY(i3)) * height

      ctx.beginPath()
      ctx.moveTo(u1, v1)
      ctx.lineTo(u2, v2)
      ctx.lineTo(u3, v3)
      ctx.closePath()
      ctx.stroke()
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < uvAttribute.count; i += 3) {
      const u1 = uvAttribute.getX(i) * width
      const v1 = (1 - uvAttribute.getY(i)) * height
      const u2 = uvAttribute.getX(i + 1) * width
      const v2 = (1 - uvAttribute.getY(i + 1)) * height
      const u3 = uvAttribute.getX(i + 2) * width
      const v3 = (1 - uvAttribute.getY(i + 2)) * height

      ctx.beginPath()
      ctx.moveTo(u1, v1)
      ctx.lineTo(u2, v2)
      ctx.lineTo(u3, v3)
      ctx.closePath()
      ctx.stroke()
    }
  }

  return canvas.toDataURL("image/png")
}

/**
 * Create a texture from a data URL
 */
export function createTextureFromDataURL(dataUrl: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader()
    loader.load(
      dataUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.flipY = false
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}
