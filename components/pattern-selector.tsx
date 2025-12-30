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
import { Check, Sparkles } from "lucide-react";
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
    <Card className={cn("p-2", className)}>
      {showTabs && (
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as PatternCategory)}
          className="w-full"
        >
          <TabsList className="w-full flex flex-wrap h-auto p-0.5 mb-2 gap-0.5 bg-muted/50">
            {categoriesToShow.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex-1 min-w-[50px] py-1 px-1.5 text-[9px] data-[state=active]:bg-background data-[state=active]:text-primary transition-all"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="overflow-visible">
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
      <div className="mt-2 text-center">
        <button
          onClick={() => {
            const removeTextureLayer = useConfiguratorStore.getState().removeTextureLayer;
            removeTextureLayer("main-pattern-layer");
            setSelectedPattern(null);
          }}
          className="text-xs text-muted-foreground hover:text-destructive underline decoration-dotted underline-offset-4"
        >
          Remove Pattern Only
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
    <div className="max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-1">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern)}
            className={cn(
              "rounded-lg overflow-hidden border-2 transition-all active:scale-95",
              selectedPattern === pattern.id
                ? "border-primary ring-2 ring-primary"
                : "border-border/50 hover:border-primary/50",
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div className="aspect-square w-full relative bg-muted/10">
              <img
                src={pattern.thumbnail}
                alt={pattern.name}
                className="w-full h-full object-cover"
                style={{
                  imageRendering: "auto",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                }}
                loading="lazy"
              />
              {selectedPattern === pattern.id && (
                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="px-1 py-0.5 bg-background/80 text-[8px] text-center truncate">
              {pattern.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
