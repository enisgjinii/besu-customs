"use client";

import { useEffect, useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { ModelsSyncService } from "@/lib/models-sync-service";

export function useModelsSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { products, updateProduct } = useConfiguratorStore();

  // Sync products from database on mount
  useEffect(() => {
    syncProducts();
  }, []);

  // Listen for model updates from admin panel
  useEffect(() => {
    const handleModelsUpdated = () => {
      syncProducts();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("modelsUpdated", handleModelsUpdated);
      return () =>
        window.removeEventListener("modelsUpdated", handleModelsUpdated);
    }
  }, []);

  const syncProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/models/sync");
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }

      const { products: activeProducts } = await response.json();

      // Update store with active products
      // Note: This would require updating the store to accept dynamic products
      // For now, we'll just log what would be updated
      console.log("Would update store with products:", activeProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync models");
      console.error("Models sync error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    syncProducts,
    products,
  };
}

// Hook to check if a model is active
export function useModelStatus(modelUrl: string) {
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkModelStatus();
  }, [modelUrl]);

  const checkModelStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/models?active=true`);
      if (response.ok) {
        const { models } = await response.json();
        const activeUrls = new Set(models.map((m: any) => m.file_path));
        setIsActive(activeUrls.has(modelUrl));
      }
    } catch (error) {
      console.error("Failed to check model status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isActive, isLoading, checkModelStatus };
}
