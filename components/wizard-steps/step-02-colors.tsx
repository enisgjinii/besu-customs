"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link2, RotateCcw, Loader2 } from "lucide-react";

export function Step02Colors() {
    const sections = useConfiguratorStore((state) => state.sections);
    const modelLoading = useConfiguratorStore((state) => state.modelLoading);
    const sectionsLoading = useConfiguratorStore((state) => state.sectionsLoading);
    const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
    const updateSection = useConfiguratorStore((state) => state.updateSection);
    const updateAllSections = useConfiguratorStore((state) => state.updateAllSections);

    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Reset active section when model changes
    useEffect(() => {
        setActiveSectionId(null);
    }, [currentModelUrl]);

    // Auto-select first section when sections load
    useEffect(() => {
        if (!activeSectionId && sections.length > 0) {
            setActiveSectionId(sections[0].id);
        }
    }, [sections, activeSectionId]);

    const handleColorChange = (color: string) => {
        if (activeSectionId) {
            updateSection(activeSectionId, { color });
        }
    };

    const handleApplyToAll = () => {
        if (activeSectionId) {
            const activeSection = sections.find((s) => s.id === activeSectionId);
            if (activeSection) {
                updateAllSections({ color: activeSection.color });
            }
        }
    };

    const activeSection = sections.find((s) => s.id === activeSectionId);

    // Full color palette - more colors
    const PRESET_COLORS = [
        // Row 1: Neutrals
        "#FFFFFF", "#F5F5F5", "#E0E0E0", "#C0C0C0", "#808080", "#404040", "#1C1C1C", "#000000",
        // Row 2: Blues
        "#E3F2FD", "#90CAF9", "#42A5F5", "#1E88E5", "#1565C0", "#0D47A1", "#00274C", "#001529",
        // Row 3: Reds
        "#FFEBEE", "#EF9A9A", "#EF5350", "#E53935", "#C62828", "#B71C1C", "#8B0000", "#5C0000",
        // Row 4: Greens
        "#E8F5E9", "#A5D6A7", "#66BB6A", "#43A047", "#2E7D32", "#1B5E20", "#004D00", "#003300",
        // Row 5: Yellows/Oranges
        "#FFF8E1", "#FFE082", "#FFD54F", "#FFC107", "#FF9800", "#F57C00", "#E65100", "#BF360C",
        // Row 6: Purples/Pinks
        "#F3E5F5", "#CE93D8", "#AB47BC", "#8E24AA", "#6A1B9A", "#4A148C", "#FF4081", "#C51162",
    ];

    // Show loading state
    if (modelLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading model...</span>
            </div>
        );
    }

    // Show empty state if no model selected
    if (!currentModelUrl) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                Select a model first to customize colors
            </div>
        );
    }

    // Show loading state if sections are being fetched
    if (sectionsLoading || sections.length === 0) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading color sections...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3 md:space-y-4 w-full">
            {/* Section pills - horizontal scroll with touch-friendly sizing */}
            <div className="w-full">
                <div className="overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="inline-flex gap-1.5 md:gap-2 pb-2 pr-4">
                        {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSectionId(section.id)}
                            className={cn(
                                "inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-full border transition-all whitespace-nowrap text-[10px] md:text-xs font-medium touch-manipulation min-h-[36px] md:min-h-[44px]",
                                activeSectionId === section.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:border-primary/50 active:scale-95"
                            )}
                        >
                            <div
                                className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-white/30 shadow-inner flex-shrink-0"
                                style={{ backgroundColor: section.color }}
                            />
                            <span className="max-w-[100px] md:max-w-[140px] truncate">{section.name}</span>
                        </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Color grid - auto-sizing responsive grid */}
            <div className="w-full">
                <div className="grid grid-cols-6 md:grid-cols-8 gap-2 md:gap-3 auto-rows-fr">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={cn(
                                "aspect-square rounded-full border transition-all touch-manipulation w-full",
                                activeSection?.color?.toUpperCase() === color.toUpperCase()
                                    ? "ring-2 ring-primary ring-offset-1 md:ring-offset-2 scale-110 border-primary shadow-lg" 
                                    : "border-border/30 hover:scale-105 active:scale-95 hover:border-primary/50 hover:shadow-md"
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={color}
                        />
                    ))}
                </div>
            </div>

            {/* Custom color picker + actions - responsive layout */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-3 border-t mt-2">
                {/* Color picker and hex input row */}
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative">
                        <input
                            type="color"
                            value={activeSection?.color || "#ffffff"}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="w-14 h-14 md:w-12 md:h-12 rounded-xl cursor-pointer border-2 border-border shadow-sm hover:border-primary transition-colors"
                            style={{ padding: '4px' }}
                        />
                        <div 
                            className="absolute inset-0 rounded-xl pointer-events-none border-2 border-white/20"
                            style={{ margin: '6px' }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Custom Color</label>
                        <Input
                            type="text"
                            value={activeSection?.color || "#ffffff"}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                    handleColorChange(val);
                                }
                            }}
                            className="h-10 md:h-11 text-sm md:text-base font-mono uppercase font-semibold"
                            placeholder="#000000"
                        />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="default"
                        className="flex-1 md:flex-none h-11 px-4 gap-2 font-medium"
                        onClick={handleApplyToAll}
                    >
                        <Link2 className="w-4 h-4" />
                        <span className="text-xs md:text-sm">Apply to All</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0"
                        onClick={() => updateAllSections({ color: "#ffffff" })}
                        title="Reset all colors to white"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
