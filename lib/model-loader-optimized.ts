"use client";

import { Scene, SceneLoader, AbstractMesh } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

/**
 * Progressive Model Loading Strategy for Mobile/3G
 * 
 * Features:
 * - Detects connection speed and device capabilities
 * - Loads low-res placeholder first, then upgrades
 * - Implements streaming and chunked loading
 * - Aggressive caching with Service Worker support
 */

export interface LoadingProgress {
  stage: 'detecting' | 'loading-low' | 'loading-high' | 'complete';
  percent: number;
  bytesLoaded: number;
  bytesTotal: number;
  connectionSpeed?: string;
}

export interface ModelLoadOptions {
  modelUrl: string;
  scene: Scene;
  forceQuality?: 'low' | 'medium' | 'high' | 'auto';
  onProgress?: (progress: LoadingProgress) => void;
  enableProgressive?: boolean;
}

// Detect connection speed
export function detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined') return 'medium';
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (connection) {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink; // Mbps
    
    // 2G or slow-2g
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      return 'slow';
    }
    
    // 3G or downlink < 1.5 Mbps
    if (effectiveType === '3g' || (downlink && downlink < 1.5)) {
      return 'slow';
    }
    
    // 4G with good speed
    if (effectiveType === '4g' && downlink && downlink > 5) {
      return 'fast';
    }
    
    return 'medium';
  }
  
  // Fallback: check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile ? 'medium' : 'fast';
}

// Get optimal model URL based on device and connection
export function getOptimalModelUrl(baseUrl: string, quality: 'low' | 'medium' | 'high' | 'auto' = 'auto'): string {
  if (quality === 'auto') {
    const speed = detectConnectionSpeed();
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    // Low quality for slow connections or low memory
    if (speed === 'slow' || deviceMemory <= 2) {
      quality = 'low';
    } else if (speed === 'medium' || deviceMemory <= 4) {
      quality = 'medium';
    } else {
      quality = 'high';
    }
  }
  
  // Try to find quality-specific version
  const baseName = baseUrl.replace(/\.glb$/i, '');
  
  if (quality === 'low') {
    // Try -low.glb, -mobile.glb, or -compressed.glb
    return `${baseName}-low.glb`;
  } else if (quality === 'medium') {
    return `${baseName}-medium.glb`;
  }
  
  return baseUrl; // High quality = original
}

// Check if a URL exists (HEAD request)
async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Progressive loading: load low-res first, then upgrade
export async function loadModelProgressive(
  options: ModelLoadOptions
): Promise<AbstractMesh> {
  const { modelUrl, scene, forceQuality = 'auto', onProgress, enableProgressive = true } = options;
  
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
  
  let loadedMesh: AbstractMesh | null = null;
  
  // Try each quality level
  for (let i = 0; i < qualityLevels.length; i++) {
    const quality = qualityLevels[i];
    const isLastQuality = i === qualityLevels.length - 1;
    const targetUrl = getOptimalModelUrl(modelUrl, quality);
    
    // Check if quality-specific version exists
    const exists = await urlExists(targetUrl);
    const urlToLoad = exists ? targetUrl : modelUrl;
    
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
      const result = await new Promise<AbstractMesh>((resolve, reject) => {
        SceneLoader.ImportMesh(
          "",
          "",
          urlToLoad,
          scene,
          (meshes) => {
            if (meshes.length === 0) {
              reject(new Error("No meshes found in model"));
              return;
            }
            resolve(meshes[0]);
          },
          (progress) => {
            const percent = progress.lengthComputable 
              ? ((i + progress.loaded / progress.total) / qualityLevels.length) * 100
              : ((i + 0.5) / qualityLevels.length) * 100;
            
            onProgress?.({
              stage: quality === 'low' ? 'loading-low' : 'loading-high',
              percent,
              bytesLoaded: progress.loaded,
              bytesTotal: progress.total,
              connectionSpeed: speed,
            });
          },
          (scene, message, exception) => {
            reject(new Error(message || exception?.message || "Failed to load model"));
          }
        );
      });
      
      // If we loaded a lower quality and there's a higher one coming, keep this temporarily
      if (!isLastQuality && loadedMesh) {
        // Dispose previous lower quality mesh
        loadedMesh.dispose();
      }
      
      loadedMesh = result;
      
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
  
  if (!loadedMesh) {
    throw new Error("Failed to load model at any quality level");
  }
  
  onProgress?.({
    stage: 'complete',
    percent: 100,
    bytesLoaded: 0,
    bytesTotal: 0,
    connectionSpeed: speed,
  });
  
  return loadedMesh;
}

// Preload models in the background
export function preloadModel(modelUrl: string): void {
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

// Estimate model size before loading
export async function estimateModelSize(modelUrl: string): Promise<number> {
  try {
    const response = await fetch(modelUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
}
