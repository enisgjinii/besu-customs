/**
 * Applies a visual "sketch" effect to an image data URL using edge detection.
 * Returns a new data URL representing the line drawing.
 */
export async function generateSketchEffect(
    dataUrl: string,
    width: number = 800,
    height: number = 800
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // 1. Draw original image
            // Fit to canvas
            ctx.drawImage(img, 0, 0, width, height);

            // 2. Get pixel data
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const w = width;
            const h = height;

            // 3. Create a grayscale buffer
            // We'll use a Float32Array to store grayscale values for simpler math
            const gray = new Float32Array(w * h);

            for (let i = 0; i < data.length; i += 4) {
                // Luminance formula: 0.299R + 0.587G + 0.114B
                const brightness =
                    0.299 * data[i] +
                    0.587 * data[i + 1] +
                    0.114 * data[i + 2];
                gray[i / 4] = brightness;
            }

            // 4. Sobel Edge Detection
            // We'll calculate magnitude of gradients
            const edges = new Float32Array(w * h);

            // Sobel kernels
            // Gx: [-1, 0, 1], [-2, 0, 2], [-1, 0, 1]
            // Gy: [-1, -2, -1], [0, 0, 0], [1, 2, 1]

            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    const i = y * w + x;

                    // Neighbors
                    const tl = gray[(y - 1) * w + (x - 1)];
                    const t = gray[(y - 1) * w + x];
                    const tr = gray[(y - 1) * w + (x + 1)];
                    const l = gray[y * w + (x - 1)];
                    const r = gray[y * w + (x + 1)];
                    const bl = gray[(y + 1) * w + (x - 1)];
                    const b = gray[(y + 1) * w + x];
                    const br = gray[(y + 1) * w + (x + 1)];

                    const gx = (-1 * tl) + (1 * tr) + (-2 * l) + (2 * r) + (-1 * bl) + (1 * br);
                    const gy = (-1 * tl) + (-2 * t) + (-1 * tr) + (1 * bl) + (2 * b) + (1 * br);

                    // Magnitude
                    let mag = Math.sqrt(gx * gx + gy * gy);

                    // Thresholding / enhancing
                    // Invert: edges should be black, background white.
                    // High magnitude (edge) -> subtract from 255. 
                    // But we want a "sketch" look, so we want mostly white.

                    edges[i] = mag;
                }
            }

            // 5. Write back to ImageData as inverted grayscale
            // High edge magnitude -> Dark pixel (Lower value)
            // Low edge magnitude -> White pixel (Higher value)

            for (let i = 0; i < w * h; i++) {
                const edgeVal = edges[i];

                // Intensity scaling. You can tweak '2' or '3' to make edges darker/striking.
                // We want: if edgeVal is high, output is low (black).
                // Let's invert: 255 - edgeVal
                let val = 255 - (edgeVal * 1.5); // 1.5 multiplier for contrast

                if (val < 0) val = 0;
                if (val > 255) val = 255;

                // Make it binary-ish for "ink" look? 
                // Or keep grayscale for softness. Let's keep grayscale but push whites.
                if (val > 240) val = 255; // Clean up background noise

                const idx = i * 4;
                data[idx] = val;     // R
                data[idx + 1] = val; // G
                data[idx + 2] = val; // B
                data[idx + 3] = 255; // Alpha
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = (e) => reject(e);
    });
}
