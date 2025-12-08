"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Link2, Link2Off } from "lucide-react";
import { useState } from "react";
import { ColorPickerModal } from "@/components/color-picker-modal";

export function Step02Colors() {
    const sections = useConfiguratorStore((state) => state.sections);
    const updateSection = useConfiguratorStore((state) => state.updateSection);
    const updateAllSections = useConfiguratorStore(
        (state) => state.updateAllSections
    );

    // Local state for the color picker
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    const handleColorClick = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setIsColorPickerOpen(true);
    };

    const handleColorChange = (color: string) => {
        if (activeSectionId) {
            updateSection(activeSectionId, { color });
        }
    };

    const handleApplyToAll = () => {
        if (activeSectionId) {
            const activeSection = sections.find((s) => s.id === activeSectionId);
            if (activeSection) {
                // Apply color to all sections that are not "custom texture" locked ideally, 
                // but for now simple apply to all
                updateAllSections({ color: activeSection.color });
            }
        }
    };

    const activeSection = sections.find((s) => s.id === activeSectionId);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="space-y-2 flex-shrink-0">
                <h2 className="text-lg font-semibold">Choose Your Colors</h2>
                <p className="text-sm text-muted-foreground">
                    Customize the colors of each part of your product.
                </p>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-[calc(100vh-280px)] pr-4">
                    <div className="space-y-3 pb-4">
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                                onClick={() => handleColorClick(section.id)}
                            >
                                <span className="text-sm font-medium truncate flex-1 mr-4">
                                    {section.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-full border shadow-sm ring-1 ring-border/20"
                                        style={{ backgroundColor: section.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {isColorPickerOpen && activeSection && (
                <ColorPickerModal
                    isOpen={isColorPickerOpen}
                    onClose={() => setIsColorPickerOpen(false)}
                    currentColor={activeSection.color}
                    onColorChange={handleColorChange}
                    title={`Color: ${activeSection.name}`}
                    // Add custom footer actions for "Apply to All"
                    footer={
                        <div className="flex items-center justify-between w-full pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleApplyToAll}
                                className="w-full"
                            >
                                Apply to All Sections
                            </Button>
                        </div>
                    }
                />
            )}
        </div>
    );
}
