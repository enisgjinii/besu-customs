
export interface PBRMaps {
  albedo: string;
  normal: string;
  displacement: string;
  roughness: string;
  ao: string;
}

/**
 * PBR Map Generation Utility
 * Generates Normal, Displacement, Roughness, and Ambient Occlusion maps
 * from a single texture image using canvas manipulation.
 */

// Helper to get image data from an image source
const getImageData = (img: HTMLImageElement | HTMLCanvasElement): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');
  
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
};

// Helper to create a data URL from image data
const toDataURL = (imageData: ImageData): string => {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

// Convert RGB to grayscale (luminance)
const getLuminance = (r: number, g: number, b: number): number => {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const generatePBRMaps = async (imageUrl: string): Promise<PBRMaps> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const inputData = getImageData(img);
        const width = inputData.width;
        const height = inputData.height;
        
        // Initialize map data buffers
        const normalData = new ImageData(width, height);
        const displacementData = new ImageData(width, height);
        const roughnessData = new ImageData(width, height);
        const aoData = new ImageData(width, height);
        
        // Loop through pixels
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            
            const r = inputData.data[i];
            const g = inputData.data[i + 1];
            const b = inputData.data[i + 2];
            const luminance = getLuminance(r, g, b);
            
            // --- Displacement / Height Map ---
            // Simple grayscale of the image
            // Invert if needed, but standard is white = high, black = low
            displacementData.data[i] = luminance;
            displacementData.data[i + 1] = luminance;
            displacementData.data[i + 2] = luminance;
            displacementData.data[i + 3] = 255;
            
            // --- Roughness Map ---
            // High contrast version of inverted luminance usually works as a base
            // Shiny parts (white in diffuse) -> often smoother (black in roughness)
            // But for general textures, we might want to keep it simple.
            // Let's assume brighter = smoother for now (specular map style), then invert for roughness
            // Actually, for generic textures like stone/wood: dark crevices are rough, light tops are smooth?
            // Let's do a simple inversion of luminance with contrast
            const roughVal = Math.min(255, Math.max(0, (255 - luminance) * 1.2)); 
            roughnessData.data[i] = roughVal;
            roughnessData.data[i + 1] = roughVal;
            roughnessData.data[i + 2] = roughVal;
            roughnessData.data[i + 3] = 255;
            
            // --- Ambient Occlusion (AO) Map ---
            // Approximated by invert luminance (darker areas = more occluded)
            // heavily blurred later? For pixel-by-pixel, just high contrast darkness
            const aoVal = Math.min(255, Math.max(0, luminance + 50)); 
            aoData.data[i] = aoVal;
            aoData.data[i + 1] = aoVal;
            aoData.data[i + 2] = aoVal;
            aoData.data[i + 3] = 255;
          }
        }
        
        // --- Normal Map Generation (Sobel Filter) ---
        // Need to access neighbors, so second loop
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            
            // Get neighbors (wrapping)
            const xLeft = (x - 1 + width) % width;
            const xRight = (x + 1) % width;
            const yUp = (y - 1 + height) % height;
            const yDown = (y + 1) % height;
            
            // Helper to get luminance at x,y
            const getLum = (nx: number, ny: number) => {
              const idx = (ny * width + nx) * 4;
              return getLuminance(inputData.data[idx], inputData.data[idx+1], inputData.data[idx+2]);
            };
            
            // Sobel operator
            const tl = getLum(xLeft, yUp);
            const t  = getLum(x, yUp);
            const tr = getLum(xRight, yUp);
            const l  = getLum(xLeft, y);
            const r  = getLum(xRight, y);
            const bl = getLum(xLeft, yDown);
            const b  = getLum(x, yDown);
            const br = getLum(xRight, yDown);
            
            const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
            const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
            const strength = 1.0; // Normal map strength
            
            const dz = 255.0 / strength;
            
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Normalize to 0-1 range then map to 0-255
            // X: -1 to 1 -> 0 to 255. (x + 1) * 0.5 * 255
            const nx = (dx / len) * 0.5 + 0.5;
            const ny = (dy / len) * 0.5 + 0.5;
            const nz = (dz / len) * 0.5 + 0.5;
            
            normalData.data[i] = Math.floor(nx * 255);
            normalData.data[i + 1] = Math.floor(ny * 255);
            normalData.data[i + 2] = Math.floor(nz * 255);
            normalData.data[i + 3] = 255;
          }
        }
        
        // Resolve all
        resolve({
          albedo: imageUrl,
          normal: toDataURL(normalData),
          displacement: toDataURL(displacementData),
          roughness: toDataURL(roughnessData),
          ao: toDataURL(aoData)
        });
        
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
};
