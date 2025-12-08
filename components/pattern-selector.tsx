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
    // Add pattern as a background layer (Order 0)
    // Remove existing pattern layer if any to avoid stacking multiple patterns
    // Identify pattern layer by type='pattern' or user metadata

    // Logic: If there is already a layer with type='pattern', replace it or remove it.
    // For now, let's just add it. The compositor renders in order.
    // Ideally, we want one pattern layer.

    // We can assume we want to Clear old patterns?
    // Let's iterate and mark 'pattern' type.
    // But TextureLayer interface might not have 'pattern' subtype. We used 'image'.
    // We'll use 'image' and maybe a consistent ID prefix?
    // Or we rely on 'order: 0'.

    const patternId = `pattern-${Date.now()}`;

    addTextureLayer({
      id: patternId,
      name: pattern.name,
      type: 'pattern', // Pattern is a texture map layer
      visible: true,
      locked: false,
      opacity: 0.8, // Slightly transparent to blend?
      blendMode: 'multiply', // Blend with base color
      order: 0, // Always at bottom
      imageUrl: pattern.thumbnail,
      position: [0.5, 0.5, 0], // Center
      rotation: [0, 0, 0],
      scale: [1, 1, 1], // Full coverage? We might need logic to 'tile' or 'stretch'.
      // For SVGs in lib/patterns, they seem to be 100x100 squares. 
      // We probably want to scale them up to cover the texture (2048x2048).
      // Scale 20x?
    });

  }, [addTextureLayer]); // No fabricCanvas dependency

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
