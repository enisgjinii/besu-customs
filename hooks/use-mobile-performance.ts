"use client";

import { useState, useEffect, useMemo } from "react";

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

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

  const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;

  // Check for low-end device indicators
  const deviceMemory = (navigator as any).deviceMemory || 4; // GB
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
  
  // Detect GPU capabilities (rough estimate)
  let gpuTier = "high";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Check for known low-end GPUs
        if (/Mali-4|Mali-T|Adreno 3|Adreno 4|PowerVR SGX|Intel HD Graphics [2-4]/i.test(renderer)) {
          gpuTier = "low";
        } else if (/Mali-G5|Adreno 5|Intel UHD/i.test(renderer)) {
          gpuTier = "medium";
        }
      }
    }
    canvas.remove();
  } catch (e) {
    // Ignore errors
  }

  const isLowEndDevice = 
    deviceMemory <= 2 || 
    hardwareConcurrency <= 2 || 
    gpuTier === "low" ||
    isSlowConnection;

  const isMediumDevice = 
    deviceMemory <= 4 || 
    hardwareConcurrency <= 4 || 
    gpuTier === "medium";

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
      maxTextureSize: 512, // Reduced from 1024 to prevent context loss
      uvCanvasSize: 512,
      antialias: false,
      shadowsEnabled: false,
      maxLights: 2,
      targetFPS: 30,
      debounceMs: 500,
      enablePostProcessing: false,
      hardwareScaling: 2.0, // Increased to reduce GPU load
    };
  }

  if (isMobile && !isTablet) {
    return {
      isMobile: true,
      isLowEndDevice: false,
      pixelRatio,
      maxTextureSize: 1024, // Reduced from 2048 to prevent context loss
      uvCanvasSize: 1024,
      antialias: false, // Disabled to reduce GPU load
      shadowsEnabled: false,
      maxLights: 2, // Reduced from 3 to save memory
      targetFPS: 60,
      debounceMs: 200,
      enablePostProcessing: false,
      hardwareScaling: 1.25, // Slight upscaling to reduce GPU load
    };
  }

  if (isTablet || isMediumDevice) {
    return {
      isMobile: true,
      isLowEndDevice: false,
      pixelRatio,
      maxTextureSize: 2048, // Reduced from 4096 to prevent context loss
      uvCanvasSize: 2048,
      antialias: false, // Disabled to reduce GPU load
      shadowsEnabled: false, // Disabled to prevent context loss
      maxLights: 3,
      targetFPS: 60,
      debounceMs: 150,
      enablePostProcessing: false, // Disabled to save memory
      hardwareScaling: 1.0, // Full resolution
    };
  }

  // Desktop / high-end
  return {
    isMobile: false,
    isLowEndDevice: false,
    pixelRatio: Math.min(basePixelRatio, 2),
    maxTextureSize: 2048, // Reduced from 4096 to be safer
    uvCanvasSize: 2048,
    antialias: true,
    shadowsEnabled: false, // Disabled to prevent context loss
    maxLights: 4,
    targetFPS: 60,
    debounceMs: 100,
    enablePostProcessing: false, // Disabled to save memory
    hardwareScaling: 1,
  };
}

export function useMobilePerformance(): MobilePerformanceConfig {
  const [config, setConfig] = useState<MobilePerformanceConfig>(() => detectDeviceCapabilities());

  useEffect(() => {
    // Re-detect on resize (handles orientation changes)
    const handleResize = () => {
      setConfig(detectDeviceCapabilities());
    };

    // Debounce resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 250);
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
  delay: number
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
