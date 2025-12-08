"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Link2, Link2Off } from "lucide-react";
import { ColorPickerModal } from "@/components/color-picker-modal";

export function Step02Colors() {
    const sections = useConfiguratorStore((state) => state.sections);
    const updateSection = useConfiguratorStore((state) => state.updateSection);
    const updateAllSections = useConfiguratorStore((state) => state.updateAllSections);

    // Local state
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Select first section by default
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

    // Standard Nike-like Team Colors
    const PRESET_COLORS = [
        "#FFFFFF", "#000000", "#1C1C1C", "#808080",
        "#C0C0C0", "#00274C", "#0047AB", "#4169E1",
        "#87CEEB", "#B22222", "#DC143C", "#FF0000",
        "#FF4500", "#FFA500", "#FFD700", "#FFFF00",
        "#006400", "#228B22", "#32CD32", "#90EE90",
        "#4B0082", "#800080", "#EE82EE", "#FF1493",
        "#692D1B", "#A0522D", "#F5F5DC", "#D2B48C"
    ];

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-none space-y-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Select Part</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-muted-foreground hover:text-primary px-2"
                        onClick={handleApplyToAll}
                    >
                        Apply Color to All
                    </Button>
                </div>

                {/* Horizontal Section List */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient-right">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSectionId(section.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0 text-xs font-medium",
                                activeSectionId === section.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary/20"
                                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            <div
                                className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: section.color }}
                            />
                            {section.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-h-0">
                <h2 className="text-sm font-semibold">Choose Color</h2>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 pb-4">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                className={cn(
                                    "aspect-square rounded-full border shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                    activeSection?.color === color && "ring-2 ring-primary ring-offset-2 scale-110"
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Hex Input could go here if needed, but presets are preferred for mobile */}
        </div>
    );
}
