"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { PatternSelector } from "@/components/pattern-selector"; // Assuming reuse
import { Label } from "@/components/ui/label";

export function Step05Patterns() {
    const selectedSectionId = useConfiguratorStore((state) => state.selectedSectionId);
    const sections = useConfiguratorStore((state) => state.sections);
    const updateSection = useConfiguratorStore((state) => state.updateSection);

    // Pattern selection is handled internally by PatternSelector via TextureLayers
    // We don't need to update section.customTexture anymore

    const selectedSection = sections.find(s => s.id === selectedSectionId);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose Design Patterns</h2>
                <p className="text-sm text-muted-foreground">
                    Select a pattern to apply to the product.
                </p>
            </div>

            <div className="h-[400px]">
                <PatternSelector />
            </div>
        </div>
    );
}
