"use client";

import { useState, useEffect, useRef } from "react";
import { getModelCache, releaseModel, GLTFResult } from "@/lib/model-cache";

interface UseCachedGLTFResult {
  gltf: GLTFResult | null;
  loading: boolean;
  error: Error | null;
  progress: number;
}

/**
 * Custom hook for loading GLTF models with caching
 * 
 * Benefits over useGLTF:
 * - Persistent cache across component unmounts
 * - Memory management with LRU eviction
 * - Reference counting to prevent premature disposal
 * - Progress tracking
 */
export function useCachedGLTF(url: string | null): UseCachedGLTFResult {
  const [gltf, setGltf] = useState<GLTFResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      setGltf(null);
      setLoading(false);
      setError(null);
      setProgress(0);
      return;
    }

    // Track current URL to handle race conditions
    currentUrlRef.current = url;
    
    const cache = getModelCache();
    
    // Check if already cached (instant load)
    if (cache.has(url)) {
      setLoading(true);
      setProgress(100);
      
      cache.load(url).then((loadedGltf) => {
        if (currentUrlRef.current === url) {
          setGltf(loadedGltf);
          setLoading(false);
          setError(null);
        }
      });
      return;
    }

    // Load from network
    setLoading(true);
    setProgress(0);
    setError(null);

    cache.load(url, (percent) => {
      if (currentUrlRef.current === url) {
        setProgress(percent);
      }
    })
      .then((loadedGltf) => {
        if (currentUrlRef.current === url) {
          setGltf(loadedGltf);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (currentUrlRef.current === url) {
          console.error("Failed to load model:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    // Cleanup: release reference when URL changes or component unmounts
    return () => {
      if (url) {
        releaseModel(url);
      }
    };
  }, [url]);

  return { gltf, loading, error, progress };
}

/**
 * Preload hook - call this to preload models before they're needed
 */
export function usePreloadModels(urls: string[]): void {
  useEffect(() => {
    const cache = getModelCache();
    urls.forEach((url) => {
      if (url) {
        cache.preload(url);
      }
    });
  }, [urls]);
}
