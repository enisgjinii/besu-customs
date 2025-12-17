"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Image as ImageIcon, Type } from "lucide-react";
import Image from "next/image";

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

  if (textureLayers.length === 0) return null;

  return (
    <Card className="p-3 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-100">
          Active Designs ({textureLayers.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {textureLayers.map((layer) => (
            <div key={layer.id} className="relative">
              <Button
                variant={
                  selectedTextureLayerId === layer.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedTextureLayerId(layer.id)}
                className={`text-xs h-8 gap-1 ${
                  selectedTextureLayerId === layer.id
                    ? "ring-2 ring-amber-400"
                    : ""
                }`}
              >
                {layer.type === "text" ? (
                  <Type className="w-3 h-3" />
                ) : (
                  <ImageIcon className="w-3 h-3" />
                )}
                <span className="truncate max-w-[100px]">
                  {layer.name || `${layer.type}`}
                </span>
              </Button>
              {selectedTextureLayerId === layer.id && (
                <button
                  onClick={() => removeTextureLayer(layer.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        {selectedTextureLayerId && (
          <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-2">
            💡 Selected:{" "}
            {textureLayers.find((l) => l.id === selectedTextureLayerId)?.name}
          </div>
        )}
      </div>
    </Card>
  );
}
