"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Image as ImageIcon, Type, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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

  const [isExpanded, setIsExpanded] = useState(false);

  if (textureLayers.length === 0) return null;

  return (
    <Card className="border border-border bg-card overflow-hidden text-left py-0 gap-0 rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-[10px] md:text-xs font-semibold text-foreground flex items-center gap-2">
          <span>Active ({textureLayers.length})</span>
          {selectedTextureLayerId && !isExpanded && (
            <span className="text-[10px] font-normal text-muted-foreground truncate max-w-[120px]">
              — {textureLayers.find(l => l.id === selectedTextureLayerId)?.name}
            </span>
          )}
        </h3>
        {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 md:px-3 md:pb-3 space-y-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {textureLayers.map((layer) => (
              <div key={layer.id} className="relative flex-shrink-0">
                <Button
                  variant={
                    selectedTextureLayerId === layer.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedTextureLayerId(layer.id)}
                  className={`text-[10px] h-7 gap-1 px-2 ${selectedTextureLayerId === layer.id
                    ? ""
                    : "text-muted-foreground"
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
      )}
    </Card>
  );
}
