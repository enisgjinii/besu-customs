/**
 * AI-Powered Background Removal
 * Uses @imgly/background-removal for professional-grade background removal
 * https://www.npmjs.com/package/@imgly/background-removal
 *
 * Features:
 * - Uses IMG.LY CDN for fast model delivery
 * - Multiple quality presets (small model for mobile)
 * - Progress tracking with download progress
 * - Result caching
 */

import {
  removeBackground as imglyRemoveBackground,
  preload,
  Config,
} from "@imgly/background-removal";

// Quality presets for different use cases
export type QualityPreset = "fast" | "balanced" | "quality" | "ultra";

export interface RemovalOptions {
  /** Quality preset - higher quality = slower processing */
  quality?: QualityPreset;
  /** Progress callback (0-100) */
  onProgress?: (progress: number) => void;
  /** Enable result caching */
  useCache?: boolean;
  /** Output format */
  outputFormat?: "png" | "webp";
  /** Timeout in ms (default 180000 = 3 minutes) */
  timeout?: number;
}

export interface RemovalResult {
  /** Processed image as data URL */
  dataUrl: string;
  /** Processing time in ms */
  processingTime: number;
  /** Whether result was from cache */
  fromCache: boolean;
  /** Original image dimensions */
  originalSize: { width: number; height: number };
}

// Simple in-memory cache for processed images
const resultCache = new Map<string, string>();
const MAX_CACHE_SIZE = 10;

// Generate a simple hash for cache key
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 1000); i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Quality preset configurations - using smaller models for faster loading
const qualityConfigs: Record<QualityPreset, Partial<Config>> = {
  fast: {
    // Smallest model (~44MB) - best for mobile
    model: "isnet_quint8",
    output: {
      format: "image/png",
      quality: 0.8,
    },
  },
  balanced: {
    // Medium model (~88MB) - good balance
    model: "isnet_fp16",
    output: {
      format: "image/png",
      quality: 0.9,
    },
  },
  quality: {
    // Full model (~176MB) - best quality
    model: "isnet",
    output: {
      format: "image/png",
      quality: 0.95,
    },
  },
  ultra: {
    model: "isnet",
    output: {
      format: "image/png",
      quality: 1.0,
    },
  },
};

/**
 * Get image dimensions from a data URL or blob
 */
const getImageDimensions = (
  source: string | Blob,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      if (typeof source !== "string") {
        URL.revokeObjectURL(img.src);
      }
    };
    img.onerror = reject;
    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
};

/**
 * Convert various input formats to Blob
 */
const toBlob = async (input: string | Blob | File): Promise<Blob> => {
  if (input instanceof Blob) {
    return input;
  }

  // Handle data URL
  if (input.startsWith("data:")) {
    const response = await fetch(input);
    return response.blob();
  }

  // Handle remote URL
  const response = await fetch(input, { mode: "cors" });
  return response.blob();
};

/**
 * Convert Blob to data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Advanced AI-powered background removal
 * Uses IMG.LY CDN for model delivery (default, no publicPath needed)
 */
export const removeBackgroundAdvanced = async (
  input: string | Blob | File,
  options: RemovalOptions = {},
): Promise<RemovalResult> => {
  const {
    quality = "fast",
    onProgress,
    useCache = true,
    outputFormat = "png",
    timeout = 180000, // 3 minute timeout
  } = options;

  const startTime = performance.now();

  // Generate cache key if caching enabled
  let cacheKey = "";
  if (useCache && typeof input === "string") {
    cacheKey = `${hashString(input)}_${quality}`;
    const cached = resultCache.get(cacheKey);
    if (cached) {
      const dimensions = await getImageDimensions(cached);
      return {
        dataUrl: cached,
        processingTime: 0,
        fromCache: true,
        originalSize: dimensions,
      };
    }
  }

  // Get original dimensions
  const originalSize = await getImageDimensions(
    input instanceof Blob ? input : input,
  );

  // Convert to blob for processing
  const inputBlob = await toBlob(input);

  // Get quality configuration
  const config = qualityConfigs[quality];

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Background removal timed out after ${timeout / 1000}s. Try again on a faster connection.`,
        ),
      );
    }, timeout);
  });

  try {
    // Process with @imgly/background-removal
    // Uses IMG.LY CDN by default (no publicPath = uses their CDN)
    const resultBlob = await Promise.race([
      imglyRemoveBackground(inputBlob, {
        ...config,
        output: {
          format: outputFormat === "webp" ? "image/webp" : "image/png",
          quality: config.output?.quality ?? 0.9,
        },
        progress: (key: string, current: number, total: number) => {
          if (onProgress) {
            const progress = Math.round((current / total) * 100);
            onProgress(progress);
          }
        },
      }),
      timeoutPromise,
    ]);

    // Convert result to data URL
    const dataUrl = await blobToDataUrl(resultBlob);

    // Cache the result
    if (useCache && cacheKey) {
      if (resultCache.size >= MAX_CACHE_SIZE) {
        const firstKey = resultCache.keys().next().value;
        if (firstKey) resultCache.delete(firstKey);
      }
      resultCache.set(cacheKey, dataUrl);
    }

    const processingTime = performance.now() - startTime;

    return {
      dataUrl,
      processingTime,
      fromCache: false,
      originalSize,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Simple wrapper - returns just the data URL
 */
export const removeBackground = async (
  input: string | Blob | File,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const result = await removeBackgroundAdvanced(input, {
    quality: "fast",
    onProgress,
  });
  return result.dataUrl;
};

/**
 * Remove background with fast preset (mobile-optimized, smallest model)
 */
export const removeBackgroundFast = async (
  input: string | Blob | File,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const result = await removeBackgroundAdvanced(input, {
    quality: "fast",
    onProgress,
  });
  return result.dataUrl;
};

/**
 * Remove background with ultra quality (for final exports)
 */
export const removeBackgroundUltra = async (
  input: string | Blob | File,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const result = await removeBackgroundAdvanced(input, {
    quality: "ultra",
    onProgress,
  });
  return result.dataUrl;
};

/**
 * Clear the background removal cache
 */
export const clearBackgroundRemovalCache = (): void => {
  resultCache.clear();
};

/**
 * Check if the browser supports background removal
 */
export const isBackgroundRemovalSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  if (typeof WebAssembly === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return ctx !== null;
  } catch {
    return false;
  }
};

/**
 * Preload the background removal model
 * Call this early to reduce first-use latency
 */
export const preloadBackgroundRemovalModel = async (
  quality: QualityPreset = "fast",
): Promise<void> => {
  try {
    const config = qualityConfigs[quality];
    await preload({ model: config.model });
  } catch (error) {
    console.warn("Failed to preload background removal model:", error);
  }
};
