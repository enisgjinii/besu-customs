"use client";

import { useState, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PATTERN_CATEGORIES,
  getPatternsByCategory,
  type Pattern,
  type PatternCategory,
} from "@/lib/patterns";
import { getSchoolLogoPosition } from "@/lib/logo-positioning";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternSelectorProps {
  onPatternSelect?: (pattern: Pattern) => void;
  className?: string;
  lockedCategory?: PatternCategory;
}

// Include school-logos in the main pattern selector
const FILTERED_CATEGORIES = PATTERN_CATEGORIES;

export function PatternSelector({
  onPatternSelect,
  className,
  lockedCategory,
}: PatternSelectorProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PatternCategory>(
    lockedCategory || "gallery",
  );

  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);

  const applyPatternToCanvas = useCallback(
    async (pattern: Pattern) => {
      // Regular patterns: Full coverage
      const PATTERN_LAYER_ID = "main-pattern-layer";
      const existing = textureLayers.find((l) => l.id === PATTERN_LAYER_ID);

      if (existing) {
        updateTextureLayer(PATTERN_LAYER_ID, {
          name: pattern.name,
          imageUrl: pattern.thumbnail,
          position: [0.5, 0.5, 0],
          scale: [1, 1, 1],
          rotation: [0, 0, 0],
        });
      } else {
        addTextureLayer({
          id: PATTERN_LAYER_ID,
          name: pattern.name,
          type: "pattern",
          visible: true,
          locked: false,
          opacity: 0.9,
          blendMode: "multiply",
          order: -1,
          imageUrl: pattern.thumbnail,
          position: [0.5, 0.5, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });
      }
    },
    [addTextureLayer, textureLayers, updateTextureLayer],
  );

  const handlePatternClick = useCallback(
    (pattern: Pattern) => {
      setSelectedPattern(pattern.id);
      applyPatternToCanvas(pattern);
      onPatternSelect?.(pattern);
    },
    [applyPatternToCanvas, onPatternSelect],
  );

  const currentPatterns = getPatternsByCategory(activeCategory);
  const categoriesToShow = lockedCategory
    ? [{ id: lockedCategory, name: lockedCategory }]
    : FILTERED_CATEGORIES;
  const showTabs = !lockedCategory && categoriesToShow.length > 1;

  return (
    <Card className={cn("p-0 border-0 shadow-none bg-transparent", className)}>
      {showTabs && (
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as PatternCategory)}
          className="w-full space-y-2"
        >
          <div className="w-full overflow-x-auto pb-1 no-scrollbar -mx-2 px-2 md:-mx-1 md:px-1">
            <TabsList className="flex h-8 w-max gap-1.5 bg-transparent p-0 md:h-9">
              {categoriesToShow.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:px-4 md:text-xs"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div>
            {categoriesToShow.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="mt-0"
              >
                <CategoryGrid
                  categoryId={category.id}
                  selectedPattern={selectedPattern}
                  onSelect={handlePatternClick}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      )}

      {!showTabs && (
        <div className="overflow-visible">
          <CategoryGrid
            categoryId={activeCategory}
            selectedPattern={selectedPattern}
            onSelect={handlePatternClick}
          />
        </div>
      )}
      {/* Remove Pattern Action */}
      <div className="mt-2 flex justify-center">
        <button
          onClick={() => {
            const removeTextureLayer =
              useConfiguratorStore.getState().removeTextureLayer;
            removeTextureLayer("main-pattern-layer");
            setSelectedPattern(null);
          }}
          className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-full hover:bg-destructive/10"
        >
          <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center opacity-70 group-hover:opacity-100">
            <span className="h-0.5 w-2 bg-current rounded-full" />
          </div>
          Remove Pattern
        </button>
      </div>
    </Card>
  );
}

// Compact grid for patterns with improved image rendering
function CategoryGrid({
  categoryId,
  selectedPattern,
  onSelect,
}: {
  categoryId: string;
  selectedPattern: string | null;
  onSelect: (p: Pattern) => void;
}) {
  const patterns = getPatternsByCategory(categoryId as PatternCategory);
  return (
    <div className="overflow-visible md:max-h-[55vh] md:overflow-y-auto md:pr-1">
      <div className="grid grid-cols-4 gap-2 pb-1 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-md border transition-all active:scale-95 md:rounded-lg",
              selectedPattern === pattern.id
                ? "border-primary ring-2 ring-primary ring-offset-1 md:ring-offset-2 ring-offset-background"
                : "border-border/50 hover:border-primary/50",
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div className="absolute inset-0 bg-muted/10">
              <img
                src={pattern.thumbnail}
                alt={pattern.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                style={{
                  imageRendering: "auto",
                }}
                loading="lazy"
              />
              {/* Overlay with Name on Hover (Desktop) or Selected (Mobile) */}
              <div className="absolute inset-x-0 bottom-0 py-1 bg-black/60 backdrop-blur-[1px] translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform">
                <p className="text-[8px] md:text-[9px] text-white text-center font-medium truncate px-1">
                  {pattern.name}
                </p>
              </div>

              {selectedPattern === pattern.id && (
                <div className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-4 h-4 md:w-5 md:h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm z-10">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
