import * as THREE from "three";

/**
 * Texture Utilities for Client-Side PBR Generation
 * 
 * Generates Normal and Roughness maps from a base color image
 * using standard image processing algorithms (Sobel operator).
 */

/**
 * Generates a Normal Map from an image element.
 * 
 * @param image The source image element
 * @param strength Strength of the normal effect (default: 1.0)
 * @returns Promise resolving to a base64 data URL of the normal map
 */
export async function generateNormalMap(
    image: HTMLImageElement,
    strength: number = 1.0
): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            resolve("");
            return;
        }

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const outputData = ctx.createImageData(width, height);
        const output = outputData.data;

        const getGrayscale = (x: number, y: number) => {
            // Clamp coordinates
            const cx = Math.max(0, Math.min(width - 1, x));
            const cy = Math.max(0, Math.min(height - 1, y));
            const idx = (cy * width + cx) * 4;
            // Perceived brightness: 0.299R + 0.587G + 0.114B
            return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Sobel filter kernels
                // X: -1 0 1
                //    -2 0 2
                //    -1 0 1
                // Y:  1  2  1
                //     0  0  0
                //    -1 -2 -1

                const tl = getGrayscale(x - 1, y - 1);
                const t = getGrayscale(x, y - 1);
                const tr = getGrayscale(x + 1, y - 1);
                const l = getGrayscale(x - 1, y);
                const r = getGrayscale(x + 1, y);
                const bl = getGrayscale(x - 1, y + 1);
                const b = getGrayscale(x, y + 1);
                const br = getGrayscale(x + 1, y + 1);

                const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
                const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

                // Scale strength
                const dz = 1.0 / strength;

                const len = Math.sqrt(dX * dX + dY * dY + dz * dz);

                // Normalize to 0-1 range then to 0-255
                const nx = ((dX / len) * 0.5 + 0.5) * 255;
                const ny = ((dY / len) * 0.5 + 0.5) * 255;
                const nz = ((dz / len) * 0.5 + 0.5) * 255;

                const i = (y * width + x) * 4;
                output[i] = nx;
                output[i + 1] = ny;
                output[i + 2] = nz; // Blue channel is Z (up)
                output[i + 3] = 255;
            }
        }

        ctx.putImageData(outputData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
    });
}

/**
 * Generates a Roughness Map from an image element.
 * Inverts the grayscale: Light areas (often highlights) become dark (smooth),
 * Dark areas become light (rough). This is a heuristic.
 * 
 * @param image The source image element
 * @returns Promise resolving to a base64 data URL of the roughness map
 */
export async function generateRoughnessMap(
    image: HTMLImageElement
): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            resolve("");
            return;
        }

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Get brightness
            const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

            // Invert brightness for roughness
            // High brightness (white) -> Low Roughness (0 - smooth)
            // Low brightness (black) -> High Roughness (255 - rough)
            // We can tune this curve. Let's make it not fully smooth or fully rough.

            // Simple Inversion
            let roughness = 255 - brightness;

            // Constrast stretch to make it more interesting
            roughness = (roughness - 128) * 1.2 + 128;
            roughness = Math.max(0, Math.min(255, roughness));

            data[i] = roughness;     // R
            data[i + 1] = roughness; // G
            data[i + 2] = roughness; // B
            data[i + 3] = 255;       // Alpha
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
    });
}

/**
 * Loads an image from a URL into an HTMLImageElement
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
    });
}
