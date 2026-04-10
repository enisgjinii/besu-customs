"use client";

/**
 * Service Worker Manager
 * Handles registration and communication with service worker for model caching
 */

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Update is available; activates on next reload.
            }
          });
        }
      });

      return true;
    } catch {
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const success = await this.registration.unregister();
      return success;
    } catch {
      return false;
    }
  }

  async clearCache(): Promise<boolean> {
    if (!this.registration || !this.registration.active) {
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };

      this.registration!.active!.postMessage({ type: "CLEAR_CACHE" }, [
        messageChannel.port2,
      ]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  async getCacheSize(): Promise<number> {
    if (!("caches" in window)) {
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  async getCacheInfo(): Promise<
    { name: string; size: number; count: number }[]
  > {
    if (!("caches" in window)) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const info = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        let size = 0;

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            size += blob.size;
          }
        }

        info.push({
          name,
          size,
          count: requests.length,
        });
      }

      return info;
    } catch {
      return [];
    }
  }

  isSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator;
  }

  isRegistered(): boolean {
    return this.registration !== null;
  }
}

// Auto-register on import (client-side only)
if (typeof window !== "undefined") {
  ServiceWorkerManager.getInstance().register().catch(() => {});
}
