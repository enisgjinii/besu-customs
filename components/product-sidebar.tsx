"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/store";

export function ProductSidebar() {
  const products = useConfiguratorStore((state) => state.products);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const setCurrentModelUrl = useConfiguratorStore(
    (state) => state.setCurrentModelUrl,
  );

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const cats = Array.from(
      new Set(products.map((p) => p.category || "Other")),
    );
    const map: Record<string, boolean> = {};
    cats.forEach((c) => (map[c] = false));
    setCollapsed(map);
  }, [products]);

  const grouped = products.reduce(
    (map: Record<string, Product[]>, p) => {
      const key = p.category || "Other";
      if (!map[key]) map[key] = [];
      map[key].push(p as Product);
      return map;
    },
    {} as Record<string, Product[]>,
  );

  return (
    <div className="h-full flex flex-col bg-card w-full">
      <div className="p-4 border-b border-border/50 bg-gradient-to-b from-card to-card/50 flex-shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Models
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Select a 3D model to customize
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        {products.length > 0 ? (
          <div className="space-y-2">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-1">
                <button
                  onClick={() =>
                    setCollapsed((s) => ({ ...s, [category]: !s[category] }))
                  }
                  className="w-full text-left px-3 py-2 rounded-md font-semibold bg-muted/40"
                >
                  {category} ({items.length})
                </button>

                {!collapsed[category] && (
                  <div className="mt-2 space-y-1">
                    {items.map((p) => {
                      const isSelected = currentModelUrl === p.modelUrl;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setCurrentModelUrl(p.modelUrl || null)}
                          title={p.title}
                          className={`group block text-left w-full text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-medium shadow-md"
                              : "hover:bg-secondary/80 text-foreground hover:shadow-sm"
                          }`}
                        >
                          <span className="truncate block">{p.title}</span>
                          {isSelected && (
                            <span className="text-xs opacity-80 mt-0.5 block">
                              Currently loaded
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-12">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No models available</p>
            <p className="text-xs mt-1">Upload a model to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
