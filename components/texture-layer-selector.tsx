"use client";

import { useConfiguratorStore } from "@/lib/store";
import { X, Image as ImageIcon, Type } from "lucide-react";
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

  const renderChip = (layer: (typeof textureLayers)[number], mobile = false) => (
    <div
      key={layer.id}
      className={`flex shrink-0 items-center rounded-full border pr-0.5 ${
        selectedTextureLayerId === layer.id
          ? "border-primary/70 bg-primary/10"
          : "border-border/60 bg-background"
      }`}
    >
      <button
        onClick={() => setSelectedTextureLayerId(layer.id)}
        className={`flex items-center ${mobile ? "h-6 gap-1 px-2 text-[9px]" : "h-7 gap-1.5 px-2.5 text-[10px]"} ${
          selectedTextureLayerId === layer.id
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {layer.type === "text" ? (
          <Type className={mobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
        ) : (
          <ImageIcon className={mobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
        )}
        <span className={mobile ? "max-w-[54px] truncate" : "max-w-[100px] truncate"}>
          {layer.name || layer.type}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeTextureLayer(layer.id);
        }}
        className={`inline-flex items-center justify-center rounded-full text-destructive/90 transition-colors hover:bg-red-500 hover:text-white ${
          mobile ? "h-4 w-4" : "h-5 w-5"
        }`}
        title="Remove"
        aria-label={`Remove ${layer.name || layer.type}`}
      >
        <X className={mobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
      </button>
    </div>
  );

  // Mobile: very compact bar
  if (isMobile) {
    return (
      <div className="flex items-center gap-1.5 border-b border-border/40 bg-background/90 px-2 py-1 backdrop-blur">
        <div className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
          Layers {textureLayers.length}
        </div>
        <div className="flex flex-1 gap-1 overflow-x-auto no-scrollbar">
          {textureLayers.map((layer) => renderChip(layer, true))}
        </div>
      </div>
    );
  }

  // Desktop: compact polished bar with visible inline delete controls
  return (
    <div className="flex items-center gap-2 border-b border-border/40 bg-background/90 px-2.5 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        Active
        <span className="ml-1 rounded-full bg-background px-1.5 py-0.5 text-[9px] text-foreground">
          {textureLayers.length}
        </span>
      </div>

      <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
        {textureLayers.map((layer) => renderChip(layer))}
      </div>
    </div>
  );
}
