/**
 * Advanced AI-Powered Background Removal
 * Uses @imgly/background-removal for professional-grade background removal
 * Features:
 * - Multiple quality presets
 * - Progress tracking
 * - Result caching
 * - Mobile optimization
 * - Edge refinement options
 */

import { removeBackground as imglyRemoveBackground, Config } from "@imgly/background-removal";

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
    /** Custom ONNX model path (optional) */
    modelPath?: string;
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
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

// Quality preset configurations
const qualityConfigs: Record<QualityPreset, Partial<Config>> = {
    fast: {
        model: "isnet_quint8",
        output: {
            format: "image/png",
            quality: 0.8,
        },
    },
    balanced: {
        model: "isnet_fp16",
        output: {
            format: "image/png",
            quality: 0.9,
        },
    },
    quality: {
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
const getImageDimensions = (source: string | Blob): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
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
 * Uses neural networks for professional-grade results
 */
export const removeBackgroundAdvanced = async (
    input: string | Blob | File,
    options: RemovalOptions = {}
): Promise<RemovalResult> => {
    const {
        quality = "balanced",
        onProgress,
        useCache = true,
        outputFormat = "png",
    } = options;

    const defaultConfig: Partial<Config> = {
        publicPath: "/imgly-background-removal/package/dist/", // Use local assets
        debug: process.env.NODE_ENV === "development",
    };

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
        input instanceof Blob ? input : input
    );

    // Convert to blob for processing
    const inputBlob = await toBlob(input);

    // Get quality configuration
    const config = qualityConfigs[quality];

    // Process with @imgly/background-removal
    const resultBlob = await imglyRemoveBackground(inputBlob, {
        ...defaultConfig,
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
    });

    // Convert result to data URL
    const dataUrl = await blobToDataUrl(resultBlob);

    // Cache the result
    if (useCache && cacheKey) {
        // Manage cache size
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
};

/**
 * Simple wrapper for easy migration from old implementation
 * Returns just the data URL for backward compatibility
 */
export const removeBackground = async (
    input: string | Blob | File,
    onProgress?: (progress: number) => void
): Promise<string> => {
    const result = await removeBackgroundAdvanced(input, {
        quality: "balanced",
        onProgress,
    });
    return result.dataUrl;
};

/**
 * Remove background with fast preset (mobile-optimized)
 */
export const removeBackgroundFast = async (
    input: string | Blob | File,
    onProgress?: (progress: number) => void
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
    onProgress?: (progress: number) => void
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
 * (requires WebAssembly and modern browser features)
 */
export const isBackgroundRemovalSupported = (): boolean => {
    if (typeof window === "undefined") return false;

    // Check for WebAssembly support
    if (typeof WebAssembly === "undefined") return false;

    // Check for canvas support
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
    quality: QualityPreset = "balanced"
): Promise<void> => {
    // Create a tiny 1x1 transparent image to trigger model loading
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await imglyRemoveBackground(blob, {
                        ...qualityConfigs[quality],
                        publicPath: "/imgly-background-removal/package/dist/",
                        debug: process.env.NODE_ENV === "development",
                    });
                } catch {
                    // Ignore errors during preload
                }
            }
            resolve();
        });
    });
};
