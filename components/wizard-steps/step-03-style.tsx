"use client";

import { useConfiguratorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";

const STYLE_PRESETS = [
  {
    id: "style-1",
    name: "Classic Varsity",
    colors: { Body: "#1e3a8a", Sleeves: "#f3f4f6", Cuffs: "#1e3a8a" },
  },
  {
    id: "style-2",
    name: "Midnight",
    colors: { Body: "#111111", Sleeves: "#222222", Cuffs: "#000000" },
  },
  {
    id: "style-3",
    name: "Retro 90s",
    colors: { Body: "#f59e0b", Sleeves: "#3b82f6", Cuffs: "#ec4899" },
  },
  {
    id: "style-4",
    name: "Forest",
    colors: { Body: "#166534", Sleeves: "#14532d", Cuffs: "#fca5a5" },
  },
  {
    id: "style-5",
    name: "Urban",
    colors: { Body: "#9ca3af", Sleeves: "#4b5563", Cuffs: "#1f2937" },
  },
  {
    id: "style-6",
    name: "Crimson",
    colors: { Body: "#dc2626", Sleeves: "#991b1b", Cuffs: "#ffffff" },
  },
  {
    id: "style-7",
    name: "Golden",
    colors: { Body: "#1d4ed8", Sleeves: "#1d4ed8", Cuffs: "#fbbf24" },
  },
  {
    id: "style-8",
    name: "Arctic",
    colors: { Body: "#e0f2fe", Sleeves: "#bae6fd", Cuffs: "#0ea5e9" },
  },
];

export function Step03Style() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const sections = useConfiguratorStore((s) => s.sections);
  const updateSection = useConfiguratorStore((s) => s.updateSection);

  const handleApplyStyle = (preset: (typeof STYLE_PRESETS)[0]) => {
    setSelectedStyle(preset.id);
    const bodyColor = preset.colors["Body"];

    Object.entries(preset.colors).forEach(([key, color]) => {
      const matchingSections = sections.filter((s) =>
        s.name.toLowerCase().includes(key.toLowerCase()),
      );
      matchingSections.forEach((s) => updateSection(s.id, { color }));
    });

    // Apply body color to all if no specific matches
    if (bodyColor) {
      sections.forEach((s) => {
        const hasMatch = Object.keys(preset.colors).some((key) =>
          s.name.toLowerCase().includes(key.toLowerCase()),
        );
        if (!hasMatch) updateSection(s.id, { color: bodyColor });
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Quick Styles</h2>
          <p className="text-sm text-muted-foreground">
            Apply preset color schemes
          </p>
        </div>
        <button
          onClick={() => {
            // Reset sections to white
            sections.forEach((s) => updateSection(s.id, { color: "#ffffff" }));
            setSelectedStyle(null);
          }}
          className="text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 px-3 py-1.5 rounded-lg"
        >
          Clear Style
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApplyStyle(preset)}
            className={cn(
              "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all active:scale-95 min-h-24",
              selectedStyle === preset.id
                ? "border-primary ring-2 ring-primary bg-primary/10"
                : "border-border hover:border-primary/50",
            )}
          >
            {/* Color preview */}
            <div className="flex gap-1 mb-2">
              {Object.values(preset.colors).map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              {preset.name}
            </span>
            {selectedStyle === preset.id && (
              <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
