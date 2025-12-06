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
  const [activeCategory, setActiveCategory] = useState<PatternCategory>("abstract");
  
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
      
      img.set({
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
        <Paintbrush className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Pattern Library</h3>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </div>

      <Tabs 
        value={activeCategory} 
        onValueChange={(v) => setActiveCategory(v as PatternCategory)}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto p-1 mb-4 gap-1">
          {PATTERN_CATEGORIES.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex flex-col items-center gap-1 py-2 px-2 text-[10px] leading-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="font-semibold text-xs truncate w-full text-center">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {PATTERN_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            <ScrollArea className="h-[300px] pr-2">
              <div className="grid grid-cols-3 gap-2">
                {getPatternsByCategory(category.id).map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => handlePatternClick(pattern)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg group",
                      selectedPattern === pattern.id
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={pattern.thumbnail}
                      alt={pattern.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay with name */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                      <span className="text-white text-xs font-medium px-2 text-center truncate max-w-full">
                        {pattern.name}
                      </span>
                    </div>

                    {/* Selected checkmark */}
                    {selectedPattern === pattern.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Click a pattern to apply it to your design
      </p>
    </Card>
  );
}
