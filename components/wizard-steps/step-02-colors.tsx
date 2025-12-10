"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link2, RotateCcw } from "lucide-react";

export function Step02Colors() {
    const sections = useConfiguratorStore((state) => state.sections);
    const updateSection = useConfiguratorStore((state) => state.updateSection);
    const updateAllSections = useConfiguratorStore((state) => state.updateAllSections);

    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

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

    // Compact color palette
    const PRESET_COLORS = [
        "#FFFFFF", "#000000", "#1C1C1C", "#808080", "#C0C0C0",
        "#00274C", "#0047AB", "#4169E1", "#87CEEB", "#B22222",
        "#DC143C", "#FF0000", "#FF4500", "#FFA500", "#FFD700",
        "#006400", "#228B22", "#32CD32", "#4B0082", "#800080",
    ];

    return (
        <div className="space-y-2">
            {/* Section pills - horizontal scroll */}
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSectionId(section.id)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full border transition-all whitespace-nowrap flex-shrink-0 text-[10px] font-medium",
                            activeSectionId === section.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        )}
                    >
                        <div
                            className="w-2.5 h-2.5 rounded-full border border-white/30"
                            style={{ backgroundColor: section.color }}
                        />
                        {section.name}
                    </button>
                ))}
            </div>

            {/* Color grid - compact */}
            <div className="grid grid-cols-10 gap-1">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={cn(
                            "aspect-square rounded-full border transition-all",
                            activeSection?.color === color 
                                ? "ring-2 ring-primary ring-offset-1 scale-110" 
                                : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            {/* Inline color picker + actions */}
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={activeSection?.color || "#ffffff"}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <Input
                    type="text"
                    value={activeSection?.color || "#ffffff"}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                            handleColorChange(val);
                        }
                    }}
                    className="flex-1 h-8 text-xs font-mono uppercase"
                    placeholder="#000000"
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleApplyToAll}
                    title="Apply to all"
                >
                    <Link2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => updateAllSections({ color: "#ffffff" })}
                    title="Reset all"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
