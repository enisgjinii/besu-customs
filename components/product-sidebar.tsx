"use client"

import { useConfiguratorStore } from "@/lib/store"
import { Package } from "lucide-react"

export function ProductSidebar() {
  const products = useConfiguratorStore((state) => state.products)
  const selectedProductId = useConfiguratorStore((state) => state.selectedProductId)
  const setSelectedProduct = useConfiguratorStore((state) => state.setSelectedProduct)
  const setCurrentModelUrl = useConfiguratorStore((state) => state.setCurrentModelUrl)

  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId)
    const product = products.find((p) => p.id === productId)
    if (product?.modelUrl) {
      setCurrentModelUrl(product.modelUrl)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Products
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            className={`w-full text-left px-4 py-3 text-sm border-b border-border/30 transition-colors ${
              selectedProductId === product.id ? "bg-accent text-accent-foreground" : "hover:bg-secondary/50"
            }`}
          >
            <div className="font-medium">{product.title}</div>
            {product.modelUrl && <div className="text-xs text-muted-foreground mt-1">Model linked</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
