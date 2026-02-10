"use client";

import { useState, useEffect, useMemo, useRef } from "react";

export interface MobilePerformanceConfig {
  isMobile: boolean;
  isLowEndDevice: boolean;
  pixelRatio: number;
  maxTextureSize: number;
  uvCanvasSize: number;
  antialias: boolean;
  shadowsEnabled: boolean;
  maxLights: number;
  targetFPS: number;
  debounceMs: number;
  enablePostProcessing: boolean;
  hardwareScaling: number;
}

// Cache GPU tier to avoid re-creating WebGL context on every call
let _cachedGpuTier: string | null = null;
function detectGpuTier(): string {
  if (_cachedGpuTier !== null) return _cachedGpuTier;
  _cachedGpuTier = "high";
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension(
        "WEBGL_debug_renderer_info",
      );
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(
          debugInfo.UNMASKED_RENDERER_WEBGL,
        );
        if (
          /Mali-4|Mali-T|Adreno 3|Adreno 4|PowerVR SGX|Intel HD Graphics [2-4]/i.test(
            renderer,
          )
        ) {
          _cachedGpuTier = "low";
        } else if (/Mali-G5|Adreno 5|Intel UHD/i.test(renderer)) {
          _cachedGpuTier = "medium";
        }
      }
    }
    canvas.remove();
  } catch (e) {
    // Ignore errors
  }
  return _cachedGpuTier;
}

// Detect device capabilities
function detectDeviceCapabilities(): MobilePerformanceConfig {
  if (typeof window === "undefined") {
    // SSR fallback - assume desktop
    return {
      isMobile: false,
      isLowEndDevice: false,
      pixelRatio: 1,
      maxTextureSize: 4096,
      uvCanvasSize: 4096,
      antialias: true,
      shadowsEnabled: true,
      maxLights: 4,
      targetFPS: 60,
      debounceMs: 100,
      enablePostProcessing: true,
      hardwareScaling: 1,
    };
  }

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth < 768;

  const isTablet =
    /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;

  // Check for low-end device indicators
  const deviceMemory = (navigator as any).deviceMemory || 4; // GB
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection;
  // User requested to remove slow connection checks to force high quality
  const isSlowConnection = false;

  // Detect GPU capabilities (cached - avoids creating WebGL context every time)
  const gpuTier = detectGpuTier();

  const isLowEndDevice =
    deviceMemory <= 2 ||
    hardwareConcurrency <= 2 ||
    gpuTier === "low" ||
    isSlowConnection;

  const isMediumDevice =
    deviceMemory <= 4 || hardwareConcurrency <= 4 || gpuTier === "medium";

  // Calculate optimal pixel ratio - allow higher ratios for better quality on capable devices
  const basePixelRatio = Math.min(window.devicePixelRatio || 1, 3); // Allow up to 3x for retina displays
  let pixelRatio = basePixelRatio;

  if (isLowEndDevice) {
    pixelRatio = Math.min(basePixelRatio, 1.5); // Increased from 1 for better quality
  } else if (isMobile && !isTablet) {
    pixelRatio = Math.min(basePixelRatio, 2); // Allow full 2x for standard mobile
  } else if (isTablet) {
    pixelRatio = Math.min(basePixelRatio, 2.5); // Higher for tablets
  }

  // Configure based on device type
  if (isLowEndDevice) {
    return {
      isMobile: true,
      isLowEndDevice: true,
      pixelRatio,
      maxTextureSize: 1024,
      uvCanvasSize: 1024,
      antialias: false,
      shadowsEnabled: false,
      maxLights: 2,
      targetFPS: 30,
      debounceMs: 500,
      enablePostProcessing: false,
      hardwareScaling: 1.5, // Reduced from 2 for sharper rendering
    };
  }

  if (isMobile && !isTablet) {
    return {
      isMobile: true,
      isLowEndDevice: false,
      pixelRatio: Math.min(pixelRatio, 2), // Cap at 2x for visual fidelity
      maxTextureSize: 4096, // Allow high res textures
      uvCanvasSize: 4096,
      antialias: true,
      shadowsEnabled: true, // Enable shadows for "High Quality" look
      maxLights: 4,
      targetFPS: 60,
      debounceMs: 200,
      enablePostProcessing: true, // Enable post processing (Bloom etc)
      hardwareScaling: 1.0,
    };
  }

  if (isTablet || isMediumDevice) {
    return {
      isMobile: true,
      isLowEndDevice: false,
      pixelRatio,
      maxTextureSize: 4096,
      uvCanvasSize: 4096,
      antialias: true, // Enable for smooth edges
      shadowsEnabled: true,
      maxLights: 4,
      targetFPS: 60,
      debounceMs: 150,
      enablePostProcessing: true,
      hardwareScaling: 1.0, // Full resolution
    };
  }

  // Desktop / high-end
  return {
    isMobile: false,
    isLowEndDevice: false,
    pixelRatio: Math.min(basePixelRatio, 2),
    maxTextureSize: 4096,
    uvCanvasSize: 4096,
    antialias: true,
    shadowsEnabled: true,
    maxLights: 4,
    targetFPS: 60,
    debounceMs: 100,
    enablePostProcessing: true,
    hardwareScaling: 1,
  };
}

export function useMobilePerformance(): MobilePerformanceConfig {
  const [config, setConfig] = useState<MobilePerformanceConfig>(() =>
    detectDeviceCapabilities(),
  );
  const prevConfigRef = useRef(config);

  useEffect(() => {
    // Re-detect on resize (handles orientation changes)
    const handleResize = () => {
      const newConfig = detectDeviceCapabilities();
      // Only trigger re-render if config actually changed (shallow compare key fields)
      const prev = prevConfigRef.current;
      if (
        prev.isMobile !== newConfig.isMobile ||
        prev.isLowEndDevice !== newConfig.isLowEndDevice ||
        prev.pixelRatio !== newConfig.pixelRatio ||
        prev.uvCanvasSize !== newConfig.uvCanvasSize
      ) {
        prevConfigRef.current = newConfig;
        setConfig(newConfig);
      }
    };

    // Debounce resize handler (500ms to avoid thrashing during resize drag)
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 500);
    };

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return config;
}

// Utility hook for debouncing updates
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utility to throttle function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastCall = useMemo(() => ({ time: 0 }), []);

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.time >= delay) {
        lastCall.time = now;
        return callback(...args);
      }
    }) as T;
  }, [callback, delay, lastCall]);
}

// Check if device supports WebGL 2
export function checkWebGL2Support(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    canvas.remove();
    return !!gl;
  } catch (e) {
    return false;
  }
}

// Get recommended engine options based on device
export function getEngineOptions(config: MobilePerformanceConfig) {
  // Use high-performance mode for non-low-end mobile devices for better quality
  const powerPref = config.isLowEndDevice
    ? "low-power"
    : config.isMobile && !config.antialias
      ? "default"
      : "high-performance";

  return {
    preserveDrawingBuffer: false,
    stencil: config.antialias, // Enable stencil when antialiasing is on for better edge quality
    antialias: config.antialias,
    powerPreference: powerPref,
    doNotHandleContextLost: false,
    failIfMajorPerformanceCaveat: false,
    desynchronized: config.isLowEndDevice, // Only use desync on low-end for performance
    adaptToDeviceRatio: false, // We handle this manually
    premultipliedAlpha: true, // Better alpha blending
    alpha: true, // Enable transparency
  } as const;
}
