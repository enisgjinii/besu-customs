"use client";

import { useState, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ALL_PATTERNS,
  PATTERN_CATEGORIES,
  getPatternsByCategory,
  type Pattern,
  type PatternCategory
} from "@/lib/patterns";
import { Paintbrush, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternSelectorProps {
  onPatternSelect?: (pattern: Pattern) => void;
  className?: string;
  lockedCategory?: PatternCategory;
}

export function PatternSelector({ onPatternSelect, className, lockedCategory }: PatternSelectorProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PatternCategory>(lockedCategory || "school-logos");

  const setGlobalCustomTexture = useConfiguratorStore((s) => s.setGlobalCustomTexture);
  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);

  const applyPatternToCanvas = useCallback(async (pattern: Pattern) => {
    // Remove existing pattern layer if any to avoid stacking
    const existingPatterns = textureLayers.filter(l => l.type === 'pattern');
    // We can't batch remove easily with current store, but we can iterate.
    // Ideally store has 'removeTextureLayers(ids[])'. 
    // For now, we manually remove. Note: calling remove multiple times might trigger re-renders.
    // Better: Add 'replaceTextureLayer' or just add new one with same ID? 
    // No, ID should be unique.

    // Let's use a fixed ID for the pattern layer? 
    // If we use "global-pattern-layer" as ID, we can just update it or add it if missing?
    // But 'addTextureLayer' generates a new entry.
    // We need "upsert" or just check if exists.

    const PATTERN_LAYER_ID = "main-pattern-layer";
    const existing = textureLayers.find(l => l.id === PATTERN_LAYER_ID);

    if (existing) {
      // Update existing
      useConfiguratorStore.getState().updateTextureLayer(PATTERN_LAYER_ID, {
        name: pattern.name,
        imageUrl: pattern.thumbnail,
        // Reset transforms if needed? Or keep user edits?
        // User says "patterns... cover the entire product".
        // So we should probably reset to full coverage.
        position: [0.5, 0.5, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0]
      });
    } else {
      // Create new
      addTextureLayer({
        id: PATTERN_LAYER_ID,
        name: pattern.name,
        type: 'pattern',
        visible: true,
        locked: false,
        opacity: 0.9,
        blendMode: 'multiply',
        order: -1, // Ensure it is behind everything (Logos are usually order >= 0)
        imageUrl: pattern.thumbnail,
        position: [0.5, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    }
  }, [addTextureLayer, textureLayers]);

  const handlePatternClick = useCallback((pattern: Pattern) => {
    setSelectedPattern(pattern.id);
    applyPatternToCanvas(pattern);
    onPatternSelect?.(pattern);
  }, [applyPatternToCanvas, onPatternSelect]);

  const currentPatterns = getPatternsByCategory(activeCategory);

  const showTabs = !lockedCategory;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          {/* Header removed to be flexible */}
          <p className="text-xs text-muted-foreground">
            {lockedCategory ? "Select a logo below" : "Select a pattern category"}
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </div>

      {showTabs && (
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as PatternCategory)}
          className="w-full"
        >
          <TabsList className="w-full flex flex-wrap h-auto p-1 mb-4 gap-1 bg-muted/50">
            {PATTERN_CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex-1 min-w-[70px] flex flex-col items-center gap-1 py-2 px-2 text-[10px] leading-tight data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                <span className="font-semibold text-xs truncate w-full text-center">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Render Content for each tab if tabs are shown */}
          <ScrollArea className="h-[400px] pr-2 -mr-2">
            {PATTERN_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <CategoryGrid categoryId={category.id} selectedPattern={selectedPattern} onSelect={handlePatternClick} />
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      )}

      {!showTabs && (
        <ScrollArea className="h-[400px] pr-2 -mr-2">
          <CategoryGrid categoryId={activeCategory} selectedPattern={selectedPattern} onSelect={handlePatternClick} />
        </ScrollArea>
      )}
    </Card>
  );
}

// Helper component for grid to reduce duplication
function CategoryGrid({ categoryId, selectedPattern, onSelect }: { categoryId: string, selectedPattern: string | null, onSelect: (p: Pattern) => void }) {
  const patterns = getPatternsByCategory(categoryId as PatternCategory);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
      {patterns.map((pattern) => (
        <button
          key={pattern.id}
          onClick={() => onSelect(pattern)}
          className={cn(
            "flex flex-col rounded-lg overflow-hidden border bg-card transition-all hover:shadow-md text-left group",
            selectedPattern === pattern.id
              ? "border-primary ring-1 ring-primary"
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="aspect-square w-full relative bg-muted/20">
            <img
              src={pattern.thumbnail}
              alt={pattern.name}
              className="w-full h-full object-cover"
            />
            {/* Selected checkmark overlay */}
            {selectedPattern === pattern.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Text below image */}
          <div className="p-2 border-t border-border/50 bg-background group-hover:bg-muted/30 transition-colors">
            <span className="text-xs font-semibold block truncate">
              {pattern.name}
            </span>
            <span className="text-[10px] text-muted-foreground truncate block">
              {pattern.description}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
