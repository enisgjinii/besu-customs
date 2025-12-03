"use client";

import { useEffect } from "react";
import { ServiceWorkerManager } from "@/lib/service-worker-manager";

export function ServiceWorkerInit() {
  useEffect(() => {
    // Register service worker for model caching
    if (typeof window !== 'undefined') {
      ServiceWorkerManager.getInstance()
        .register()
        .then((success) => {
          if (success) {
            console.log('✅ Service Worker registered for model caching');
          }
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);
  
  return null; // This component doesn't render anything
}
