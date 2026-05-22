"use client";

import { useConfiguratorStore } from "@/lib/store";
import { X, Image as ImageIcon, Type, Trash2 } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-breakpoint";

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
  const clearTextureLayers = useConfiguratorStore(
    (state) => state.clearTextureLayers,
  );

  const { isMobile } = useBreakpoint();

  if (textureLayers.length === 0) return null;

  const handleClearAll = () => {
    clearTextureLayers();
    setSelectedTextureLayerId(null);
  };

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
        className={`flex items-center ${mobile ? "h-10 gap-1.5 px-2.5 text-[10px]" : "h-9 gap-1.5 px-2.5 text-[11px]"} ${
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
        <span className={mobile ? "max-w-[80px] truncate" : "max-w-[120px] truncate"}>
          {layer.name || layer.type}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeTextureLayer(layer.id);
        }}
        className={`inline-flex items-center justify-center rounded-full text-destructive/90 transition-colors hover:bg-red-500 hover:text-white ${
          mobile ? "h-8 w-8" : "h-7 w-7"
        }`}
        title="Remove"
        aria-label={`Remove ${layer.name || layer.type}`}
      >
        <X className={mobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    </div>
  );

  // Mobile: very compact bar
  if (isMobile) {
    return (
      <div className="flex items-center gap-2 border-b border-border/40 bg-background/90 px-2 py-1.5 backdrop-blur">
        <div className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          Layers {textureLayers.length}
        </div>
        <button
          onClick={handleClearAll}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-destructive/90 transition-colors hover:bg-red-500 hover:text-white"
          title="Clear all layers"
          aria-label="Clear all layers"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
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

      <button
        onClick={handleClearAll}
        className="inline-flex h-6 items-center gap-1 rounded-full border border-red-200 px-2 text-[10px] font-medium text-destructive/90 transition-colors hover:bg-red-500 hover:text-white dark:border-red-900/40"
        title="Clear all layers"
        aria-label="Clear all layers"
      >
        <Trash2 className="h-3 w-3" />
        Clear
      </button>

      <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
        {textureLayers.map((layer) => renderChip(layer))}
      </div>
    </div>
  );
}
