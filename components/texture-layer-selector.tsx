"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, Type, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export function TextureLayerSelector() {
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const selectedTextureLayerId = useConfiguratorStore(
    (state) => state.selectedTextureLayerId,
  );
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );
  const removeTextureLayer = useConfiguratorStore(
    (state) => state.removeTextureLayer,
  );

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (textureLayers.length === 0) return null;

  // On mobile, show a minimal compact bar that doesn't take much space
  if (isMobile) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/30 border-b border-border/30">
        <span className="text-[9px] text-muted-foreground font-medium shrink-0">
          Layers ({textureLayers.length}):
        </span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
          {textureLayers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setSelectedTextureLayerId(layer.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap transition-colors ${
                selectedTextureLayerId === layer.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border/50 text-muted-foreground"
              }`}
            >
              {layer.type === "text" ? (
                <Type className="w-2.5 h-2.5" />
              ) : (
                <ImageIcon className="w-2.5 h-2.5" />
              )}
              <span className="truncate max-w-[50px]">
                {layer.name || layer.type}
              </span>
              {selectedTextureLayerId === layer.id && (
                <X
                  className="w-2.5 h-2.5 ml-0.5 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTextureLayer(layer.id);
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: slightly more spacious but still compact
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border-b border-border/30">
      <span className="text-[10px] text-muted-foreground font-medium shrink-0">
        Active Designs ({textureLayers.length}):
      </span>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
        {textureLayers.map((layer) => (
          <div key={layer.id} className="relative flex-shrink-0">
            <Button
              variant={selectedTextureLayerId === layer.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTextureLayerId(layer.id)}
              className={`text-[10px] h-7 gap-1 px-2 ${
                selectedTextureLayerId === layer.id ? "" : "text-muted-foreground"
              }`}
            >
              {layer.type === "text" ? (
                <Type className="w-2.5 h-2.5" />
              ) : (
                <ImageIcon className="w-2.5 h-2.5" />
              )}
              <span className="truncate max-w-[80px]">
                {layer.name || `${layer.type}`}
              </span>
            </Button>
            {selectedTextureLayerId === layer.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTextureLayer(layer.id);
                }}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 shadow-sm z-10"
                title="Remove"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
