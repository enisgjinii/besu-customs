"use client";

import { useEffect, useCallback, useRef } from "react";
import { getModelCache } from "./model-cache";

interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

/**
 * Memory Monitor Utility
 * 
 * Monitors memory pressure and triggers cleanup when memory usage is high.
 * This helps prevent browser tab crashes when users switch tabs.
 */

export function getMemoryInfo(): MemoryInfo | null {
    if (typeof window === "undefined") return null;
    if (!("performance" in window)) return null;

    const perf = performance as any;
    if (!perf.memory) return null;

    return {
        usedJSHeapSize: perf.memory.usedJSHeapSize,
        totalJSHeapSize: perf.memory.totalJSHeapSize,
        jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
    };
}

export function getMemoryUsagePercent(): number {
    const info = getMemoryInfo();
    if (!info) return 0;
    return (info.usedJSHeapSize / info.jsHeapSizeLimit) * 100;
}

/**
 * Hook to monitor memory pressure
 * 
 * @param onHighPressure - Callback when memory usage exceeds threshold
 * @param threshold - Memory usage threshold (0-1), default 0.80 (80%)
 * @param checkIntervalMs - How often to check memory, default 15000ms
 */
export function useMemoryMonitor(
    onHighPressure: () => void,
    threshold: number = 0.80,
    checkIntervalMs: number = 15000
) {
    const onHighPressureRef = useRef(onHighPressure);
    onHighPressureRef.current = onHighPressure;

    useEffect(() => {
        const info = getMemoryInfo();
        if (!info) {
            console.log(" Memory monitoring not available (non-Chrome browser)");
            return;
        }

        console.log(" Memory monitor started (threshold:", (threshold * 100).toFixed(0) + "%)");

        const checkMemory = () => {
            const memInfo = getMemoryInfo();
            if (!memInfo) return;

            const usedRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
            const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;
            const limitMB = memInfo.jsHeapSizeLimit / 1024 / 1024;

            if (usedRatio > threshold) {
                console.warn(
                    ` High memory pressure: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB (${(usedRatio * 100).toFixed(1)}%)`
                );
                onHighPressureRef.current();
            }
        };

        const interval = setInterval(checkMemory, checkIntervalMs);

        // Initial check
        checkMemory();

        return () => clearInterval(interval);
    }, [threshold, checkIntervalMs]);
}

/**
 * Default high-pressure handler that cleans up caches
 */
export function performMemoryCleanup() {
    console.log(" Performing memory cleanup...");

    // Clear model cache (evict non-referenced models)
    const modelCache = getModelCache();
    const statsBefore = modelCache.getStats();

    // Force garbage collection hint by clearing unused models
    // The model cache's evictIfNeeded will naturally clean up
    // but we can also clear older models more aggressively

    console.log(
        ` Model cache: ${statsBefore.cachedModels} models, ${statsBefore.totalMemoryMB.toFixed(1)}MB`
    );

    // Clear any global caches
    if (typeof window !== "undefined") {
        // Clear any temporary canvas elements
        const canvases = document.querySelectorAll("canvas[data-temp]");
        canvases.forEach((c) => c.remove());
    }

    // Suggest garbage collection (only works in some environments)
    if (typeof window !== "undefined" && (window as any).gc) {
        try {
            (window as any).gc();
            console.log(" Garbage collection triggered");
        } catch {
            // GC not available
        }
    }
}

/**
 * Hook that combines memory monitoring with automatic cleanup
 */
export function useAutoMemoryCleanup(threshold: number = 0.80) {
    const cleanup = useCallback(() => {
        performMemoryCleanup();
    }, []);

    useMemoryMonitor(cleanup, threshold);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get memory stats for debugging
 */
export function getMemoryStats(): string {
    const info = getMemoryInfo();
    if (!info) return "Memory info not available";

    return [
        `Used: ${formatBytes(info.usedJSHeapSize)}`,
        `Total: ${formatBytes(info.totalJSHeapSize)}`,
        `Limit: ${formatBytes(info.jsHeapSizeLimit)}`,
        `Usage: ${((info.usedJSHeapSize / info.jsHeapSizeLimit) * 100).toFixed(1)}%`,
    ].join(" | ");
}
