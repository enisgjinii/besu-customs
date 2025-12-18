/**
 * Extracts dominant colors from an image URL using canvas and k-means clustering.
 * @param imageUrl URL of the image to analyze
 * @param maxColors Maximum number of colors to extract (default 5)
 * @returns Promise resolving to an array of hex color strings
 */
export async function extractColors(
    imageUrl: string,
    maxColors: number = 5
): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Resize image for faster processing (max 100x100)
                const maxSize = 100;
                let width = img.width;
                let height = img.height;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const pixels: number[][] = [];

                // Sample pixels (step by 4 to skip alpha and some pixels for speed)
                for (let i = 0; i < data.length; i += 4 * 5) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    // Ignore transparent or nearly transparent pixels
                    if (a < 128) continue;

                    pixels.push([r, g, b]);
                }

                if (pixels.length === 0) {
                    resolve(["#FFFFFF"]); // Default to white if no pixels
                    return;
                }

                // Simple k-means clustering
                // 1. Initialize centroids
                const centroids = [];
                for (let i = 0; i < maxColors; i++) {
                    centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
                }

                // 2. Iterate (limit iterations for speed)
                for (let iter = 0; iter < 10; iter++) {
                    const clusters: number[][][] = Array.from({ length: maxColors }, () => []);

                    // Assign pixels to nearest centroid
                    for (const pixel of pixels) {
                        let minDist = Infinity;
                        let clusterIndex = 0;

                        for (let i = 0; i < maxColors; i++) {
                            const dist = Math.sqrt(
                                Math.pow(pixel[0] - centroids[i][0], 2) +
                                Math.pow(pixel[1] - centroids[i][1], 2) +
                                Math.pow(pixel[2] - centroids[i][2], 2)
                            );
                            if (dist < minDist) {
                                minDist = dist;
                                clusterIndex = i;
                            }
                        }
                        clusters[clusterIndex].push(pixel);
                    }

                    // Recalculate centroids
                    for (let i = 0; i < maxColors; i++) {
                        if (clusters[i].length === 0) continue;

                        let sumR = 0, sumG = 0, sumB = 0;
                        for (const p of clusters[i]) {
                            sumR += p[0];
                            sumG += p[1];
                            sumB += p[2];
                        }

                        centroids[i] = [
                            Math.round(sumR / clusters[i].length),
                            Math.round(sumG / clusters[i].length),
                            Math.round(sumB / clusters[i].length)
                        ];
                    }
                }

                const hexColors = centroids.map(rgb => {
                    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
                });

                // Remove duplicates and return
                resolve(Array.from(new Set(hexColors)));
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = (err) => {
            reject(new Error("Failed to load image for color extraction"));
        };
    });
}
