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
}

export function PatternSelector({ onPatternSelect, className }: PatternSelectorProps) {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PatternCategory>("college");

  const setGlobalCustomTexture = useConfiguratorStore((s) => s.setGlobalCustomTexture);
  const fabricCanvas = useConfiguratorStore((s) => s.fabricCanvas);

  const applyPatternToCanvas = useCallback(async (pattern: Pattern) => {
    if (!fabricCanvas) {
      console.warn("No fabric canvas available");
      return;
    }

    try {
      const { FabricImage } = await import("fabric");

      // Convert SVG data URL to full-size pattern image
      const img = await FabricImage.fromURL(pattern.thumbnail);

      // Scale to fill canvas as a tiled pattern or stretched background
      const canvas = fabricCanvas;
      const canvasWidth = canvas.width || 2048;
      const canvasHeight = canvas.height || 2048;

      // Scale the pattern to fill the canvas
      const scaleX = canvasWidth / (img.width || 100);
      const scaleY = canvasHeight / (img.height || 100);

      // Check for existing pattern and remove it
      const objects = canvas.getObjects();
      const existingPattern = objects.find((obj: any) => obj.id === 'background-pattern');
      if (existingPattern) {
        canvas.remove(existingPattern);
      }

      img.set({
        id: 'background-pattern', // Tag as pattern for easy removal
        scaleX: scaleX,
        scaleY: scaleY,
        left: 0,
        top: 0,
        selectable: true,
        evented: true,
        // Controls will be applied by canvas object:added event
      });

      // Add to canvas and send to back
      canvas.add(img);
      // Fabric.js v6: use sendObjectToBack instead of sendToBack
      if (typeof canvas.sendObjectToBack === 'function') {
        canvas.sendObjectToBack(img);
      } else if (typeof canvas.sendToBack === 'function') {
        canvas.sendToBack(img);
      }
      canvas.renderAll();

      // Fire modified event to trigger texture update
      canvas.fire('object:modified', { target: img });

      console.log(`✅ Applied pattern: ${pattern.name}`);
    } catch (error) {
      console.error("Failed to apply pattern:", error);
    }
  }, [fabricCanvas]);

  const handlePatternClick = useCallback((pattern: Pattern) => {
    setSelectedPattern(pattern.id);
    applyPatternToCanvas(pattern);
    onPatternSelect?.(pattern);
  }, [applyPatternToCanvas, onPatternSelect]);

  const currentPatterns = getPatternsByCategory(activeCategory);

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg">Step 1: Choose Your Style</h3>
          <p className="text-xs text-muted-foreground">Select a base design pattern for your jersey</p>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </div>

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

        <ScrollArea className="h-[400px] pr-2 -mr-2">
          {PATTERN_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
                {getPatternsByCategory(category.id).map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => handlePatternClick(pattern)}
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
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
