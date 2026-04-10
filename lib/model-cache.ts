"use client";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Use a generic GLTF type that works with both three-stdlib and @types/three
interface GLTFResult {
  scene: THREE.Group;
  scenes: THREE.Group[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: { [key: string]: any };
  parser: any;
  userData: any;
}

/**
 * Model Cache System for Three.js
 *
 * Provides:
 * - LRU cache for loaded GLTF models
 * - Memory management to prevent GC during editing
 * - Preloading support for faster model switching
 * - Automatic cleanup of old models when memory is constrained
 */

interface CachedModel {
  gltf: GLTFResult;
  url: string;
  lastAccessed: number;
  size: number; // Estimated memory size in bytes
  refCount: number; // Number of active references
}

interface CacheConfig {
  maxModels: number;
  maxMemoryMB: number;
  preloadEnabled: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxModels: 10,
  maxMemoryMB: 200,
  preloadEnabled: true,
};

class ModelCache {
  private cache: Map<string, CachedModel> = new Map();
  private config: CacheConfig;
  private gltfLoader: GLTFLoader | null = null;
  private dracoLoader: DRACOLoader | null = null;
  private loadingPromises: Map<string, Promise<GLTFResult>> = new Map();
  private totalMemory: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private initializeLoaders(): GLTFLoader {
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
      );
      this.dracoLoader.setDecoderConfig({ type: "js" });
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }
    return this.gltfLoader;
  }

  /**
   * Estimate memory size of a GLTF model
   */
  private estimateModelSize(gltf: GLTFResult): number {
    let size = 0;

    gltf.scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;

        // Geometry size
        if (mesh.geometry) {
          const geo = mesh.geometry;
          if (geo.attributes.position) {
            size += geo.attributes.position.array.byteLength;
          }
          if (geo.attributes.normal) {
            size += geo.attributes.normal.array.byteLength;
          }
          if (geo.attributes.uv) {
            size += geo.attributes.uv.array.byteLength;
          }
          if (geo.index) {
            size += geo.index.array.byteLength;
          }
        }

        // Material textures
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat) => {
            if ((mat as THREE.MeshStandardMaterial).map) {
              const tex = (mat as THREE.MeshStandardMaterial).map;
              if (tex?.image) {
                // Estimate texture memory (width * height * 4 bytes for RGBA)
                const img = tex.image as { width?: number; height?: number };
                size += (img.width || 1024) * (img.height || 1024) * 4;
              }
            }
          });
        }
      }
    });

    return size;
  }

  /**
   * Normalize URL for cache key
   */
  private normalizeUrl(url: string): string {
    try {
      // Handle encoded URLs
      const decoded = decodeURIComponent(url);
      return decoded.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Evict least recently used models to free memory
   */
  private evictIfNeeded(): void {
    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;

    // Check if we need to evict
    if (
      this.cache.size <= this.config.maxModels &&
      this.totalMemory <= maxMemoryBytes
    ) {
      return;
    }

    // Sort by last accessed (oldest first), but skip models with active references
    const entries = Array.from(this.cache.entries())
      .filter(([, cached]) => cached.refCount === 0)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Evict until we're under limits
    for (const [key, cached] of entries) {
      if (
        this.cache.size <= this.config.maxModels &&
        this.totalMemory <= maxMemoryBytes
      ) {
        break;
      }

      console.log(` Evicting cached model: ${key}`);
      this.disposeModel(cached.gltf);
      this.totalMemory -= cached.size;
      this.cache.delete(key);
    }
  }

  /**
   * Dispose of a GLTF model's resources
   */
  private disposeModel(gltf: GLTFResult): void {
    gltf.scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;

        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat) => {
            // Dispose textures
            Object.values(mat).forEach((value) => {
              if (value instanceof THREE.Texture) {
                value.dispose();
              }
            });
            mat.dispose();
          });
        }
      }
    });
  }

  /**
   * Load a model (from cache or network)
   */
  async load(
    url: string,
    onProgress?: (percent: number) => void,
  ): Promise<GLTFResult> {
    const cacheKey = this.normalizeUrl(url);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(` Cache hit: ${url}`);
      cached.lastAccessed = Date.now();
      cached.refCount++;
      return cached.gltf;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      console.log(`⏳ Waiting for existing load: ${url}`);
      return existingPromise;
    }

    // Load from network
    console.log(` Loading model: ${url}`);
    const loader = this.initializeLoaders();

    // Encode URL if needed
    const encodedUrl = this.isUrlEncoded(url) ? url : encodeURI(url);

    const loadPromise = new Promise<GLTFResult>((resolve, reject) => {
      loader.load(
        encodedUrl,
        (gltf) => {
          // Cast to our generic type
          const result: GLTFResult = {
            scene: gltf.scene,
            scenes: gltf.scenes,
            animations: gltf.animations,
            cameras: gltf.cameras,
            asset: gltf.asset,
            parser: gltf.parser,
            userData: gltf.userData,
          };

          const size = this.estimateModelSize(result);

          // Add to cache
          this.cache.set(cacheKey, {
            gltf: result,
            url,
            lastAccessed: Date.now(),
            size,
            refCount: 1,
          });
          this.totalMemory += size;

          console.log(
            ` Cached model: ${url} (${(size / 1024 / 1024).toFixed(2)} MB)`,
          );

          // Evict old models if needed
          this.evictIfNeeded();

          this.loadingPromises.delete(cacheKey);
          resolve(result);
        },
        (progress) => {
          if (progress.lengthComputable && onProgress) {
            onProgress((progress.loaded / progress.total) * 100);
          }
        },
        (error) => {
          this.loadingPromises.delete(cacheKey);
          reject(error);
        },
      );
    });

    this.loadingPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Check if URL is already encoded
   */
  private isUrlEncoded(url: string): boolean {
    try {
      return decodeURIComponent(url) !== url;
    } catch {
      return false;
    }
  }

  /**
   * Release a reference to a cached model
   */
  release(url: string): void {
    const cacheKey = this.normalizeUrl(url);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.refCount > 0) {
      cached.refCount--;
    }
  }

  /**
   * Preload a model in the background
   */
  preload(url: string): void {
    if (!this.config.preloadEnabled) return;

    const cacheKey = this.normalizeUrl(url);
    if (this.cache.has(cacheKey) || this.loadingPromises.has(cacheKey)) {
      return; // Already cached or loading
    }

    console.log(` Preloading: ${url}`);
    this.load(url).catch((err) => {
      console.warn(` Preload failed for ${url}:`, err);
    });
  }

  /**
   * Preload multiple models
   */
  preloadMany(urls: string[]): void {
    urls.forEach((url) => this.preload(url));
  }

  /**
   * Check if a model is cached
   */
  has(url: string): boolean {
    return this.cache.has(this.normalizeUrl(url));
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cachedModels: number;
    totalMemoryMB: number;
    models: string[];
  } {
    return {
      cachedModels: this.cache.size,
      totalMemoryMB: this.totalMemory / 1024 / 1024,
      models: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all cached models
   */
  clear(): void {
    for (const [, cached] of this.cache) {
      this.disposeModel(cached.gltf);
    }
    this.cache.clear();
    this.totalMemory = 0;
    console.log(" Model cache cleared");
  }

  /**
   * Dispose loaders
   */
  dispose(): void {
    this.clear();
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
    }
    this.gltfLoader = null;
  }
}

// Singleton instance
let modelCacheInstance: ModelCache | null = null;

/**
 * Get the global model cache instance
 */
export function getModelCache(): ModelCache {
  if (!modelCacheInstance) {
    modelCacheInstance = new ModelCache({
      maxModels: 15,
      maxMemoryMB: 300,
      preloadEnabled: true,
    });
  }
  return modelCacheInstance;
}

// Export the GLTFResult type for use in hooks
export type { GLTFResult };

/**
 * Hook-friendly function to load a model with caching
 */
export async function loadCachedModel(
  url: string,
  onProgress?: (percent: number) => void,
): Promise<GLTFResult> {
  return getModelCache().load(url, onProgress);
}

/**
 * Preload models for faster switching
 */
export function preloadModels(urls: string[]): void {
  getModelCache().preloadMany(urls);
}

/**
 * Release a model reference (call when component unmounts)
 */
export function releaseModel(url: string): void {
  getModelCache().release(url);
}

export { ModelCache };
