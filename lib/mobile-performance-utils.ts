/**
 * Mobile Performance Utilities for Text and Image Rendering
 * Optimizes texture sizes, caching, and rendering based on device capabilities
 */

// Detect device capabilities
export const isMobile = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export const isLowEndDevice = () => {
  if (typeof window === "undefined") return false;

  // Check for low RAM (< 4GB)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) return true;

  // Check for slow CPU
  const cores = navigator.hardwareConcurrency || 1;
  if (cores < 4) return true;

  return false;
};

export const getOptimalCanvasSize = () => {
  if (typeof window === "undefined") return 2048;

  const mobile = isMobile();
  const lowEnd = isLowEndDevice();

  if (lowEnd) return 1024; // Low-end devices: 1024x1024
  if (mobile) return 1536; // Mid-range mobile: 1536x1536
  return 2048; // Desktop: 2048x2048
};

export const getOptimalImageQuality = () => {
  if (typeof window === "undefined") return 1.0;

  const mobile = isMobile();
  const lowEnd = isLowEndDevice();

  if (lowEnd) return 0.7; // 70% quality
  if (mobile) return 0.85; // 85% quality
  return 1.0; // 100% quality
};

// Debounce helper for frequent updates
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Image compression for mobile
export const compressImageForMobile = async (
  dataUrl: string,
  maxWidth: number = 1024,
  quality: number = 0.85,
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Scale down if needed
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = (height / width) * maxWidth;
          width = maxWidth;
        } else {
          width = (width / height) * maxWidth;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", {
        alpha: true,
        willReadFrequently: false,
      });

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png", quality));
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// Throttle helper for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memory-efficient image cache
export class MobileImageCache {
  private cache: Map<string, HTMLImageElement>;
  private maxSize: number;
  private accessOrder: string[];

  constructor(maxSize: number = 20) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  get(url: string): HTMLImageElement | undefined {
    const img = this.cache.get(url);
    if (img) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter((u) => u !== url);
      this.accessOrder.push(url);
    }
    return img;
  }

  set(url: string, img: HTMLImageElement): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(url)) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(url, img);
    this.accessOrder = this.accessOrder.filter((u) => u !== url);
    this.accessOrder.push(url);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }
}

// Optimize font loading for mobile
export const preloadFonts = (fonts: string[]) => {
  if (typeof window === "undefined") return;

  // Limit fonts on mobile to reduce memory
  const mobile = isMobile();
  const fontsToLoad = mobile ? fonts.slice(0, 10) : fonts;

  fontsToLoad.forEach((font) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.crossOrigin = "anonymous";
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(
      / /g,
      "+",
    )}&display=swap`;
    document.head.appendChild(link);
  });
};

// Canvas optimization settings
export const getCanvasContextSettings = () => {
  const mobile = isMobile();
  const lowEnd = isLowEndDevice();

  return {
    alpha: true,
    desynchronized: !lowEnd, // Disable on low-end for stability
    willReadFrequently: false,
    antialias: !lowEnd, // Disable antialiasing on low-end
  };
};

// Batch texture updates for mobile
export class TextureUpdateBatcher {
  private updates: Map<string, () => void>;
  private rafId: number | null = null;

  constructor() {
    this.updates = new Map();
  }

  schedule(key: string, updateFn: () => void): void {
    this.updates.set(key, updateFn);

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  flush(): void {
    this.updates.forEach((fn) => fn());
    this.updates.clear();
    this.rafId = null;
  }

  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates.clear();
  }
}

// Performance monitoring
export const measurePerformance = (label: string, fn: () => void) => {
  if (process.env.NODE_ENV !== "production") {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(` ${label}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

/**
 * Simple canvas-based background removal
 * Makes white/light-colored backgrounds transparent
 * Works well for AI-generated images that typically have white/uniform backgrounds
 */
export const removeBackground = async (
  dataUrl: string,
  threshold: number = 240, // Pixels brighter than this become transparent
  edgeFeather: number = 5, // Feather edges for smoother transition
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Pass 1: Find edge pixels and mark background pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness (simple luminance)
        const brightness = (r + g + b) / 3;

        // Check if pixel is close to white/light gray (likely background)
        const isBackground =
          brightness > threshold &&
          Math.abs(r - g) < 20 &&
          Math.abs(g - b) < 20 &&
          Math.abs(r - b) < 20;

        if (isBackground) {
          // Make background transparent
          data[i + 3] = 0;
        } else {
          // Keep foreground opaque
          // Apply edge softening based on how close to threshold
          const distanceFromThreshold = threshold - brightness;
          if (
            distanceFromThreshold < edgeFeather * 10 &&
            distanceFromThreshold > 0
          ) {
            // Feather the edge
            const alpha = Math.min(
              255,
              (distanceFromThreshold / (edgeFeather * 10)) * 255,
            );
            data[i + 3] = Math.round(alpha);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};
