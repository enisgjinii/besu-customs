"use client";

import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useConfiguratorStore } from "@/lib/store";

export function ConfiguratorHeader() {
    const products = useConfiguratorStore((s) => s.products);
    const selectedProductId = useConfiguratorStore((s) => s.selectedProductId);

    const selectedProduct = products.find((p) => p.id === selectedProductId);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-black/5">
            {/* Left: Logo + Product Info */}
            <div className="flex items-center gap-4">
                <div className="h-8 w-8">
                    <NextImage
                        src="/LOGO-gg.png"
                        alt="Besu"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-sm font-semibold text-black leading-tight">
                        {selectedProduct?.title || "Select a Product"}
                    </h1>
                    {selectedProduct && (
                        <p className="text-xs text-gray-500">Custom Design</p>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-black">
                    <Share2 className="w-5 h-5" />
                </Button>
                <Button className="h-9 px-5 bg-black text-white hover:bg-black/90 rounded-full text-sm font-medium">
                    finish
                </Button>
            </div>
        </header>
    );
}
