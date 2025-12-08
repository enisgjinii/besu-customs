"use strict";
import { useConfiguratorStore } from "@/lib/store";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Product } from "@/lib/store";
import { useEffect, useState } from "react";

export function Step01Apparel() {
    const products = useConfiguratorStore((state) => state.products);
    const setProducts = useConfiguratorStore((state) => state.setProducts);
    const selectedProductId = useConfiguratorStore(
        (state) => state.selectedProductId
    );
    const setSelectedProduct = useConfiguratorStore(
        (state) => state.setSelectedProduct
    );
    const [productsLoaded, setProductsLoaded] = useState(false);

    // Group products by category
    const groupedProducts = products
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .reduce((map: Record<string, Product[]>, p: Product) => {
            const key = p.category || "Other";
            if (!map[key]) map[key] = [];
            map[key].push(p);
            return map;
        }, {} as Record<string, Product[]>);

    // Load active products on mount (reusing logic from unified-sidebar)
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
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose Your Apparel</h2>
                <p className="text-sm text-muted-foreground">
                    Select the base product model you want to customize.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Product Category</label>
                    <Select
                        value={selectedProductId || ""}
                        onValueChange={setSelectedProduct}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a product..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {Object.entries(groupedProducts).map(([category, items]) => (
                                <div key={category} className="py-1">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30">
                                        {category}
                                    </div>
                                    {items.map((product) => (
                                        <SelectItem key={product.id} value={product.id} className="cursor-pointer">
                                            {product.title}
                                        </SelectItem>
                                    ))}
                                </div>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
