"use client";

import { useState, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function PatternSelector({
  onPatternSelect,
  className,
  lockedCategory,
}: PatternSelectorProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PatternCategory>(
    lockedCategory || "school-logos",
  );

  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);

  const applyPatternToCanvas = useCallback(
    async (pattern: Pattern) => {
      const isSchoolLogo = pattern.category === "school-logos";

      if (isSchoolLogo) {
        // Get smart position based on current model type
        const logoPreset = getSchoolLogoPosition(currentModelUrl);

        // School logos: Add as image layer at detected chest position
        const LOGO_LAYER_ID = `school-logo-${pattern.id}`;
        const existing = textureLayers.find((l) => l.id === LOGO_LAYER_ID);

        if (existing) {
          // Already added, just make sure it's visible
          useConfiguratorStore.getState().updateTextureLayer(LOGO_LAYER_ID, {
            visible: true,
          });
        } else {
          // Add new school logo at smart chest position
          addTextureLayer({
            id: LOGO_LAYER_ID,
            name: pattern.name,
            type: "image",
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: "normal",
            order: textureLayers.length + 1,
            imageUrl: pattern.thumbnail,
            position: logoPreset.position,
            rotation: logoPreset.rotation,
            scale: logoPreset.scale,
          });

          console.log("🏫 SCHOOL LOGO ADDED with smart positioning:", {
            name: pattern.name,
            modelUrl: currentModelUrl,
            position: logoPreset.position,
            scale: logoPreset.scale,
          });
        }
      } else {
        // Regular patterns: Full coverage as before
        const PATTERN_LAYER_ID = "main-pattern-layer";
        const existing = textureLayers.find((l) => l.id === PATTERN_LAYER_ID);

        if (existing) {
          useConfiguratorStore.getState().updateTextureLayer(PATTERN_LAYER_ID, {
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
      }
    },
    [addTextureLayer, textureLayers],
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

  const showTabs = !lockedCategory;

  return (
    <Card className={cn("p-2", className)}>
      {showTabs && (
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as PatternCategory)}
          className="w-full"
        >
          <TabsList className="w-full flex flex-wrap h-auto p-0.5 mb-2 gap-0.5 bg-muted/50">
            {PATTERN_CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex-1 min-w-[50px] py-1 px-1.5 text-[9px] data-[state=active]:bg-background data-[state=active]:text-primary transition-all"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-full pr-1 -mr-1">
            {PATTERN_CATEGORIES.map((category) => (
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
          </ScrollArea>
        </Tabs>
      )}

      {!showTabs && (
        <ScrollArea className="h-full pr-1 -mr-1">
          <CategoryGrid
            categoryId={activeCategory}
            selectedPattern={selectedPattern}
            onSelect={handlePatternClick}
          />
        </ScrollArea>
      )}
    </Card>
  );
}

// Compact grid for patterns/logos
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
    <div className="grid grid-cols-4 gap-1 pb-1">
      {patterns.map((pattern) => (
        <button
          key={pattern.id}
          onClick={() => onSelect(pattern)}
          className={cn(
            "rounded overflow-hidden border transition-all",
            selectedPattern === pattern.id
              ? "border-primary ring-1 ring-primary"
              : "border-border/50 hover:border-primary/50",
          )}
        >
          <div className="aspect-square w-full relative bg-muted/10">
            <img
              src={pattern.thumbnail}
              alt={pattern.name}
              className="w-full h-full object-cover"
            />
            {selectedPattern === pattern.id && (
              <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
