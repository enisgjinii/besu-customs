import { Button } from "@/components/ui/button";
import { getLogoPreset, LogoPreset } from "@/lib/logo-positioning";
import { ArrowLeft, Box, Shirt } from "lucide-react";

interface PlacementSelectorProps {
    modelUrl: string | null;
    onSelect: (preset: LogoPreset) => void;
    onCancel: () => void;
}

export function PlacementSelector({
    modelUrl,
    onSelect,
    onCancel,
}: PlacementSelectorProps) {
    const handleSelect = (
        placement:
            | "leftChest"
            | "rightChest"
            | "back"
            | "leftSleeve"
            | "rightSleeve"
            | "centerFront", // Added center front
    ) => {
        // Special handling for center front (often not a standard preset key in some systems, but useful)
        if (placement === "centerFront") {
            // Use a modified version of left chest but centered X
            const base = getLogoPreset(modelUrl, "leftChest");
            onSelect({
                ...base,
                position: [0.5, base.position[1], base.position[2]]
            });
            return;
        }

        const preset = getLogoPreset(modelUrl, placement as any);
        onSelect(preset);
    };

    return (
        <div className="space-y-3 animation-fade-in p-1 bg-muted/20 rounded-lg border border-dashed border-primary/20">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                    Select Placement
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={onCancel}
                >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Cancel
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Front Options */}
                <Button
                    variant="outline"
                    className="h-auto py-2 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary"
                    onClick={() => handleSelect("leftChest")}
                >
                    <div className="relative w-8 h-8 rounded border bg-background flex items-center justify-center">
                        <Shirt className="w-5 h-5 opacity-20" />
                        <div className="absolute top-[30%] right-[30%] w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                    <span className="text-[10px] font-medium">Left Chest</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-2 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary"
                    onClick={() => handleSelect("rightChest")}
                >
                    <div className="relative w-8 h-8 rounded border bg-background flex items-center justify-center">
                        <Shirt className="w-5 h-5 opacity-20" />
                        <div className="absolute top-[30%] left-[30%] w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                    <span className="text-[10px] font-medium">Right Chest</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-2 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary"
                    onClick={() => handleSelect("centerFront")}
                >
                    <div className="relative w-8 h-8 rounded border bg-background flex items-center justify-center">
                        <Shirt className="w-5 h-5 opacity-20" />
                        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                    <span className="text-[10px] font-medium">Center Front</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-auto py-2 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary"
                    onClick={() => handleSelect("back")}
                >
                    <div className="relative w-8 h-8 rounded border bg-background flex items-center justify-center">
                        <Shirt className="w-5 h-5 opacity-20" />
                        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/50 rounded-sm" />
                    </div>
                    <span className="text-[10px] font-medium">Back</span>
                </Button>
            </div>
        </div>
    );
}
