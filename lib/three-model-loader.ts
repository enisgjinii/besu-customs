"use client";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { detectConnectionSpeed, getOptimalModelUrl, type LoadingProgress } from "./model-loader-optimized";

/**
 * Three.js Model Loader with Progressive Loading
 * Compatible with the mobile optimization system
 */

export interface ThreeModelLoadOptions {
  modelUrl: string;
  forceQuality?: 'low' | 'medium' | 'high' | 'auto';
  onProgress?: (progress: LoadingProgress) => void;
  enableProgressive?: boolean;
}

// Initialize loaders
let gltfLoader: GLTFLoader | null = null;
let dracoLoader: DRACOLoader | null = null;

function initializeLoaders() {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    
    // Setup Draco decoder for compressed models
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  
  return gltfLoader;
}

// Check if URL is already encoded
function isUrlEncoded(url: string): boolean {
  try {
    return decodeURIComponent(url) !== url;
  } catch {
    return false;
  }
}

// Check if a URL exists
async function urlExists(url: string): Promise<boolean> {
  try {
    const urlToFetch = isUrlEncoded(url) ? url : encodeURI(url);
    const response = await fetch(urlToFetch, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Load a GLTF model with progressive loading support
 */
export async function loadThreeModelProgressive(
  options: ThreeModelLoadOptions
): Promise<GLTF> {
  const { modelUrl, forceQuality = 'auto', onProgress, enableProgressive = true } = options;
  
  const loader = initializeLoaders();
  const speed = detectConnectionSpeed();
  
  onProgress?.({
    stage: 'detecting',
    percent: 0,
    bytesLoaded: 0,
    bytesTotal: 0,
    connectionSpeed: speed,
  });
  
  // Determine quality levels to try
  let qualityLevels: Array<'low' | 'medium' | 'high'> = [];
  
  if (forceQuality !== 'auto') {
    qualityLevels = [forceQuality];
  } else if (speed === 'slow') {
    qualityLevels = enableProgressive ? ['low', 'medium'] : ['low'];
  } else if (speed === 'medium') {
    qualityLevels = enableProgressive ? ['medium', 'high'] : ['medium'];
  } else {
    qualityLevels = ['high'];
  }
  
  let loadedModel: GLTF | null = null;
  
  // Try each quality level
  for (let i = 0; i < qualityLevels.length; i++) {
    const quality = qualityLevels[i];
    const isLastQuality = i === qualityLevels.length - 1;
    const targetUrl = getOptimalModelUrl(modelUrl, quality);
    
    // Check if quality-specific version exists
    const exists = await urlExists(targetUrl);
    const urlToLoad = exists ? targetUrl : modelUrl;
    
    // Only encode if not already encoded
    const finalUrl = isUrlEncoded(urlToLoad) ? urlToLoad : encodeURI(urlToLoad);
    
    console.log(`📦 Loading ${quality} quality model: ${urlToLoad}`);
    
    onProgress?.({
      stage: quality === 'low' ? 'loading-low' : 'loading-high',
      percent: (i / qualityLevels.length) * 100,
      bytesLoaded: 0,
      bytesTotal: 0,
      connectionSpeed: speed,
    });
    
    try {
      // Load the model
      const result = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          finalUrl,
          (gltf) => {
            resolve(gltf);
          },
          (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percent = ((i + progressEvent.loaded / progressEvent.total) / qualityLevels.length) * 100;
              
              onProgress?.({
                stage: quality === 'low' ? 'loading-low' : 'loading-high',
                percent,
                bytesLoaded: progressEvent.loaded,
                bytesTotal: progressEvent.total,
                connectionSpeed: speed,
              });
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
      
      // If we loaded a lower quality and there's a higher one coming, keep this temporarily
      if (!isLastQuality && loadedModel) {
        // Dispose previous lower quality model
        loadedModel.scene.traverse((child) => {
          if ((child as any).geometry) {
            (child as any).geometry.dispose();
          }
          if ((child as any).material) {
            const material = (child as any).material;
            if (Array.isArray(material)) {
              material.forEach(m => m.dispose());
            } else {
              material.dispose();
            }
          }
        });
      }
      
      loadedModel = result;
      
      // If this is not the last quality, continue to next
      if (!isLastQuality) {
        console.log(`✓ ${quality} quality loaded, upgrading...`);
        continue;
      }
      
    } catch (error) {
      console.error(`Failed to load ${quality} quality:`, error);
      
      // If this was the last attempt, throw
      if (isLastQuality) {
        throw error;
      }
      
      // Otherwise, try next quality level
      continue;
    }
  }
  
  if (!loadedModel) {
    throw new Error("Failed to load model at any quality level");
  }
  
  onProgress?.({
    stage: 'complete',
    percent: 100,
    bytesLoaded: 0,
    bytesTotal: 0,
    connectionSpeed: speed,
  });
  
  return loadedModel;
}

/**
 * Preload a model in the background
 */
export function preloadThreeModel(modelUrl: string): void {
  if (typeof window === 'undefined') return;
  
  const speed = detectConnectionSpeed();
  
  // Only preload on fast connections
  if (speed === 'slow') {
    console.log('⏭️ Skipping preload on slow connection');
    return;
  }
  
  const targetUrl = getOptimalModelUrl(modelUrl, 'auto');
  
  // Use link preload
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'fetch';
  link.href = targetUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  
  console.log(`🔄 Preloading model: ${targetUrl}`);
}

/**
 * Cleanup loaders
 */
export function disposeLoaders() {
  if (dracoLoader) {
    dracoLoader.dispose();
    dracoLoader = null;
  }
  gltfLoader = null;
}
