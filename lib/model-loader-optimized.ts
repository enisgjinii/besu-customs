"use client";

/**
 * Progressive Model Loading Strategy for Mobile/3G
 * Using Three.js GLTFLoader
 *
 * Features:
 * - Detects connection speed and device capabilities
 * - Loads low-res placeholder first, then upgrades
 * - Implements streaming and chunked loading
 * - Aggressive caching with Service Worker support
 */

export interface LoadingProgress {
  stage: "detecting" | "loading-low" | "loading-high" | "complete";
  percent: number;
  bytesLoaded: number;
  bytesTotal: number;
  connectionSpeed?: string;
}

export interface ModelLoadOptions {
  modelUrl: string;
  forceQuality?: "low" | "medium" | "high" | "auto";
  onProgress?: (progress: LoadingProgress) => void;
  enableProgressive?: boolean;
}

// Detect connection speed
export function detectConnectionSpeed(): "slow" | "medium" | "fast" {
  if (typeof navigator === "undefined") return "medium";

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink; // Mbps

    // 2G or slow-2g
    if (effectiveType === "2g" || effectiveType === "slow-2g") {
      return "slow";
    }

    // 3G or downlink < 1.5 Mbps
    if (effectiveType === "3g" || (downlink && downlink < 1.5)) {
      return "slow";
    }

    // 4G with good speed
    if (effectiveType === "4g" && downlink && downlink > 5) {
      return "fast";
    }

    return "medium";
  }

  // Fallback: check if mobile
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  return isMobile ? "medium" : "fast";
}

// Get optimal model URL based on device and connection
export function getOptimalModelUrl(
  baseUrl: string,
  quality: "low" | "medium" | "high" | "auto" = "auto",
): string {
  if (quality === "auto") {
    const speed = detectConnectionSpeed();
    const deviceMemory = (navigator as any).deviceMemory || 4;

    // Low quality for slow connections or low memory
    if (speed === "slow" || deviceMemory <= 2) {
      quality = "low";
    } else if (speed === "medium" || deviceMemory <= 4) {
      quality = "medium";
    } else {
      quality = "high";
    }
  }

  // Decode URL if it's encoded, then work with the clean path
  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(baseUrl);
  } catch {
    decodedUrl = baseUrl;
  }
  const baseName = decodedUrl.replace(/\.glb$/i, "");

  if (quality === "low") {
    return `${baseName}-low.glb`;
  } else if (quality === "medium") {
    return `${baseName}-medium.glb`;
  }

  return baseUrl; // High quality = original
}

// Check if URL is already encoded
function isUrlEncoded(url: string): boolean {
  try {
    return decodeURIComponent(url) !== url;
  } catch {
    return false;
  }
}

// Check if a URL exists (HEAD request)
async function urlExists(url: string): Promise<boolean> {
  try {
    // Only encode if not already encoded
    const urlToFetch = isUrlEncoded(url) ? url : encodeURI(url);
    const response = await fetch(urlToFetch, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

// Preload models in the background
export function preloadModel(modelUrl: string): void {
  if (typeof window === "undefined") return;

  const speed = detectConnectionSpeed();

  // Only preload on fast connections
  if (speed === "slow") {
    console.log("⏭ Skipping preload on slow connection");
    return;
  }

  const targetUrl = getOptimalModelUrl(modelUrl, "auto");

  // Use link preload
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
  link.href = targetUrl;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);

  console.log(` Preloading model: ${targetUrl}`);
}

// Estimate model size before loading
export async function estimateModelSize(modelUrl: string): Promise<number> {
  try {
    const response = await fetch(modelUrl, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    return 0;
  }
}

// Get the best URL to load based on quality and availability
export async function getBestModelUrl(
  modelUrl: string,
  forceQuality: "low" | "medium" | "high" | "auto" = "auto",
): Promise<{ url: string; quality: string }> {
  const speed = detectConnectionSpeed();

  // Determine quality levels to try
  let qualityLevels: Array<"low" | "medium" | "high"> = [];

  if (forceQuality !== "auto") {
    qualityLevels = [forceQuality];
  } else if (speed === "slow") {
    qualityLevels = ["low", "medium", "high"];
  } else if (speed === "medium") {
    qualityLevels = ["medium", "high"];
  } else {
    qualityLevels = ["high"];
  }

  // Try each quality level
  for (const quality of qualityLevels) {
    const targetUrl = getOptimalModelUrl(modelUrl, quality);
    const exists = await urlExists(targetUrl);

    if (exists) {
      return { url: targetUrl, quality };
    }
  }

  // Fallback to original URL
  return { url: modelUrl, quality: "high" };
}
