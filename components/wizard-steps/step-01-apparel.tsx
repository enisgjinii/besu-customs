"use client";
import {
  useConfiguratorStore,
  getFallbackProducts,
  type MaterialSection,
} from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/lib/store";
import { useEffect, useState, useCallback, useRef } from "react";
import { getModelCache } from "@/lib/model-cache";
import { supportsEmbroidery, getProductPrice, PrintingMethod } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Step01Apparel() {
  const products = useConfiguratorStore((state) => state.products);
  const setProducts = useConfiguratorStore((state) => state.setProducts);
  const selectedProductId = useConfiguratorStore(
    (state) => state.selectedProductId,
  );
  const setSelectedProduct = useConfiguratorStore(
    (state) => state.setSelectedProduct,
  );
  const setCurrentModelUrl = useConfiguratorStore(
    (state) => state.setCurrentModelUrl,
  );
  const sections = useConfiguratorStore((state) => state.sections);
  const sectionsFromApi = useConfiguratorStore((state) => state.sectionsFromApi);
  const setSections = useConfiguratorStore((state) => state.setSections);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const printingMethod = useConfiguratorStore((state) => state.printingMethod);
  const setPrintingMethod = useConfiguratorStore(
    (state) => state.setPrintingMethod,
  );
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousModelRef = useRef<string | null>(null);
  const previousSectionsRef = useRef<MaterialSection[] | null>(null);
  const previousSectionsFromApiRef = useRef(false);

  // Preview model on hover (with debounce to prevent flicker)
  const handleProductHover = useCallback(
    (product: Product) => {
      if (product.modelUrl) {
        // Preload the model
        getModelCache().preload(product.modelUrl);

        // Clear any pending hover timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // Store current model before preview (if not already stored)
        if (!previousModelRef.current && currentModelUrl) {
          previousModelRef.current = currentModelUrl;
          previousSectionsRef.current = sections;
          previousSectionsFromApiRef.current = sectionsFromApi;
        }

        // Debounce the preview to prevent rapid switching
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredProductId(product.id);
          // Temporarily show this model
          setCurrentModelUrl(product.modelUrl!);
        }, 150);
      }
    },
    [currentModelUrl, sections, sectionsFromApi, setCurrentModelUrl],
  );

  // Restore previous model when hover ends (if not selected)
  const handleProductLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredProductId(null);

    // Restore the originally selected model
    if (previousModelRef.current && selectedProductId) {
      const selectedProduct = products.find((p) => p.id === selectedProductId);
      if (selectedProduct?.modelUrl) {
        setCurrentModelUrl(selectedProduct.modelUrl);
        if (previousSectionsRef.current) {
          setSections(
            previousSectionsRef.current,
            previousSectionsFromApiRef.current,
          );
        }
      }
    }
    previousModelRef.current = null;
    previousSectionsRef.current = null;
    previousSectionsFromApiRef.current = false;
  }, [selectedProductId, products, setCurrentModelUrl, setSections]);

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
            setProductsLoaded(true);
            return;
          }
        }
        // API returned empty or failed - use fallback products
        console.log("Using fallback products - API returned empty or unavailable");
        setProducts(getFallbackProducts());
        setProductsLoaded(true);
      } catch (error) {
        console.error("Failed to load active products:", error);
        // Use fallback products on error
        setProducts(getFallbackProducts());
        setProductsLoaded(true);
      }
    };

    if (!productsLoaded && products.length === 0) {
      loadActiveProducts();
    }
  }, [productsLoaded, products.length, setProducts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Choose Apparel</h2>
          <p className="text-sm text-muted-foreground">
            Select a product to customize
          </p>
        </div>
      </div>

      <Select
        value={selectedProductId || ""}
        onValueChange={setSelectedProduct}
        onOpenChange={handleDropdownOpen}
      >
        <SelectTrigger className="w-full h-12 text-base">
          <SelectValue placeholder="Select a product..." />
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px]"
          onMouseLeave={handleProductLeave}
        >
          {Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category} className="py-1">
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground bg-muted/50 uppercase tracking-wide">
                {category}
              </div>
              {items.map((product) => (
                <SelectItem
                  key={product.id}
                  value={product.id}
                  className={`text-sm py-3 px-3 ${hoveredProductId === product.id ? "bg-accent" : ""}`}
                  onMouseEnter={() => handleProductHover(product)}
                  onFocus={() => handleProductHover(product)}
                >
                  <div className="flex justify-between items-center w-full gap-4">
                    <span className="font-medium">{product.title}</span>
                    <span className="text-muted-foreground font-normal">
                      {supportsEmbroidery(product.title) ? "From " : ""}
                      ${getProductPrice(product.title, "sublimated")}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {!selectedProductId && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm"> Select an apparel to start customizing</p>
        </div>
      )}

      {selectedProductId && (
        <div className="pt-4 border-t border-border/50">
          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-1">Printing Method</h3>
            <p className="text-xs text-muted-foreground">Select how your design should be applied</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sublimated Option */}
            <button
              onClick={() => setPrintingMethod("sublimated")}
              className={cn(
                "flex flex-col items-center justify-between rounded-md border-2 p-4 transition-all h-full text-left",
                printingMethod === "sublimated"
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="mb-2 text-center w-full">
                <div className="font-semibold">Sublimated</div>
                <div className="text-xs text-muted-foreground mt-1">Ink infused into fabric</div>
              </div>
              <div className="text-sm font-bold text-primary">
                ${getProductPrice(selectedProductId, "sublimated")}
              </div>
            </button>

            {/* Embroidered Option */}
            {supportsEmbroidery(selectedProductId) ? (
              <button
                onClick={() => setPrintingMethod("embroidered")}
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 p-4 transition-all h-full text-left",
                  printingMethod === "embroidered"
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="mb-2 text-center w-full">
                  <div className="font-semibold">Embroidered/Tackle Twill</div>
                  <div className="text-xs text-muted-foreground mt-1">Stitched design</div>
                </div>
                <div className="text-sm font-bold text-primary">
                  ${getProductPrice(selectedProductId, "embroidered")}
                </div>
              </button>
            ) : (
              <div className="opacity-50 pointer-events-none grayscale flex flex-col items-center justify-between rounded-md border-2 border-muted bg-muted/50 p-4 h-full">
                <div className="mb-2 text-center w-full">
                  <div className="font-semibold text-muted-foreground">Embroidered</div>
                  <div className="text-xs text-muted-foreground mt-1">Not available</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
