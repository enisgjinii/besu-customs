"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";

export function ProductSidebar() {
  const setCurrentModelUrl = useConfiguratorStore(
    (state) => state.setCurrentModelUrl,
  );
  const [models, setModels] = useState<{ name: string; url: string }[]>([]);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );

  function prettyName(filename: string) {
    // Remove extension
    let name = filename.replace(/\.glb$/i, "");
    // Replace underscores, multiple spaces, dashes with single space
    name = name.replace(/[_.\-]+/g, " ");
    name = name.replace(/\s+/g, " ").trim();
    // Title case (simple)
    name = name
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
    return name;
  }

  useEffect(() => {
    let canceled = false;
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (!canceled && Array.isArray(data)) {
          // sort and set
          const sorted = data
            .slice()
            .sort((a: { name: string }, b: { name: string }) => {
              const na = prettyName(a.name).toLowerCase();
              const nb = prettyName(b.name).toLowerCase();
              return na < nb ? -1 : na > nb ? 1 : 0;
            });
          setModels(sorted);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch models:", err);
      });

    return () => {
      canceled = true;
    };
  }, []);

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
        {models.length > 0 ? (
          <div className="space-y-1.5">
            {models.map((m) => {
              const display = prettyName(m.name);
              const isSelected = currentModelUrl === m.url;
              const handleModelClick = () => {
                console.log("ProductSidebar: loading model URL", m.url);
                setCurrentModelUrl(m.url);
              };

              return (
                <button
                  key={m.url}
                  onClick={handleModelClick}
                  title={display}
                  className={`group block text-left w-full text-sm px-3 py-3 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-medium shadow-md"
                      : "hover:bg-secondary/80 text-foreground hover:shadow-sm"
                  }`}
                >
                  <span className="truncate block">{display}</span>
                  {isSelected && (
                    <span className="text-xs opacity-80 mt-0.5 block">
                      Currently loaded
                    </span>
                  )}
                </button>
              );
            })}
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
