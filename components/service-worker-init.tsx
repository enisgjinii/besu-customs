"use client";

import { useEffect } from "react";
import { ServiceWorkerManager } from "@/lib/service-worker-manager";

export function ServiceWorkerInit() {
  useEffect(() => {
    // Register service worker for model caching
    if (typeof window !== "undefined") {
      ServiceWorkerManager.getInstance()
        .register()
        .catch(() => {});
    }
  }, []);

  return null; // This component doesn't render anything
}
