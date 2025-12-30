"use client";
import { useConfiguratorStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import { getModelCache } from "@/lib/model-cache";

export function Step01Apparel() {
  const products = useConfiguratorStore((state) => state.products);
  const setProducts = useConfiguratorStore((state) => state.setProducts);
  const selectedProductId = useConfiguratorStore(
    (state) => state.selectedProductId,
  );
  const setSelectedProduct = useConfiguratorStore(
    (state) => state.setSelectedProduct,
  );
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Preload model on hover for faster switching
  const handleProductHover = useCallback((product: Product) => {
    if (product.modelUrl) {
      getModelCache().preload(product.modelUrl);
    }
  }, []);

  // Preload first few models when dropdown opens
  const handleDropdownOpen = useCallback(
    (open: boolean) => {
      if (open && products.length > 0) {
        // Preload first 3 models for instant switching
        const modelsToPreload = products
          .filter((p) => p.modelUrl)
          .slice(0, 3)
          .map((p) => p.modelUrl!);

        modelsToPreload.forEach((url) => {
          getModelCache().preload(url);
        });
      }
    },
    [products],
  );

  // Group products by category
  const groupedProducts = products
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .reduce(
      (map: Record<string, Product[]>, p: Product) => {
        const key = p.category || "Other";
        if (!map[key]) map[key] = [];
        map[key].push(p);
        return map;
      },
      {} as Record<string, Product[]>,
    );

  // Load active products on mount
  useEffect(() => {
    const loadActiveProducts = async () => {
      try {
        const response = await fetch("/api/models?active=true");
        if (response.ok) {
          const { models } = await response.json();
          if (models && models.length > 0) {
            const activeProducts = models.map((model: any) => ({
              id: model.id,
              title: model.name,
              modelUrl: model.file_path,
              category: model.category || undefined,
            }));
            setProducts(activeProducts);
          }
        }
        setProductsLoaded(true);
      } catch (error) {
        console.error("Failed to load active products:", error);
        setProductsLoaded(true);
      }
    };

    if (!productsLoaded && products.length === 0) {
      loadActiveProducts();
    }
  }, [productsLoaded, products.length, setProducts]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Choose Apparel</h2>
        <p className="text-sm text-muted-foreground">
          Select a product to customize
        </p>
      </div>

      <Select
        value={selectedProductId || ""}
        onValueChange={setSelectedProduct}
        onOpenChange={handleDropdownOpen}
      >
        <SelectTrigger className="w-full h-12 text-base">
          <SelectValue placeholder="Select a product..." />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="py-1">
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground bg-muted/50 uppercase tracking-wide">
                {category}
              </div>
              {items.map((product) => (
                <SelectItem
                  key={product.id}
                  value={product.id}
                  className="text-sm py-3 px-3"
                  onMouseEnter={() => handleProductHover(product)}
                  onFocus={() => handleProductHover(product)}
                >
                  {product.title}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {!selectedProductId && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">👆 Select an apparel to start customizing</p>
        </div>
      )}
    </div>
  );
}
