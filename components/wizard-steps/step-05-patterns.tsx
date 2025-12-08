"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { PatternSelector } from "@/components/pattern-selector"; // Assuming reuse
import { Label } from "@/components/ui/label";

export function Step05Patterns() {
    const selectedSectionId = useConfiguratorStore((state) => state.selectedSectionId);
    const sections = useConfiguratorStore((state) => state.sections);
    const updateSection = useConfiguratorStore((state) => state.updateSection);

    // Re-use logic from material-editor.tsx but simplified
    const handlePatternSelect = (patternUrl: string) => {
        if (selectedSectionId) {
            updateSection(selectedSectionId, { customTexture: patternUrl });
        }
    };

    const selectedSection = sections.find(s => s.id === selectedSectionId);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose Design Patterns</h2>
                <p className="text-sm text-muted-foreground">
                    Apply patterns to specific sections of your product.
                </p>
            </div>

            {/* Basic Section Selector if none selected, or show currently selected */}
            <div className="p-3 bg-muted/30 rounded-lg border">
                <Label className="text-xs text-muted-foreground">Target Section</Label>
                <div className="font-medium">
                    {selectedSection ? selectedSection.name : "Click on the 3D model to select a section"}
                </div>
            </div>

            <div className="h-[400px]">
                {/* We can reuse the existing PatternSelector or build a simpler one */}
                <PatternSelector
                    onSelect={handlePatternSelect}
                // Add any other props needed
                />
            </div>
        </div>
    );
}
