import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useConfiguratorStore } from "@/lib/store";
import { Copy, FlipHorizontal, RotateCw, Trash2, ZoomIn } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

interface LayerControlsProps {
    layerId: string;
    compact?: boolean;
}

export function LayerControls({ layerId, compact = false }: LayerControlsProps) {
    const layer = useConfiguratorStore((s) => s.textureLayers.find((l) => l.id === layerId));
    const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
    const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
    const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);

    if (!layer) return null;

    const scale = layer.scale?.[0] || 1;
    const rotation = layer.rotation?.[2] || 0;
    const flipX = layer.flipX || false;

    const handleDuplicate = () => {
        addTextureLayer({
            ...layer,
            id: uuidv4(),
            name: `${layer.name} (Copy)`,
            position: layer.position ? [layer.position[0] + 0.05, layer.position[1] - 0.05, layer.position[2]] : [0.55, 0.45, 0],
        });
    };

    return (
        <div className={cn(
            "bg-muted/30 rounded-md",
            compact ? "p-1.5 space-y-1.5" : "p-2 space-y-2"
        )}>
            {/* Sliders row */}
            <div className="flex items-center gap-3">
                {/* Size */}
                <div className="flex-1 flex items-center gap-2">
                    <ZoomIn className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Slider
                        value={[scale * 100]}
                        min={5}
                        max={200}
                        step={1}
                        onValueChange={([val]) => updateTextureLayer(layerId, { scale: [val / 100, val / 100, val / 100] })}
                        className="flex-1"
                    />
                    <span className="text-[9px] text-muted-foreground w-8 text-right">{Math.round(scale * 100)}%</span>
                </div>

                {/* Rotation */}
                <div className="flex-1 flex items-center gap-2">
                    <RotateCw className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Slider
                        value={[rotation * (180 / Math.PI)]}
                        min={0}
                        max={360}
                        step={5}
                        onValueChange={([val]) => updateTextureLayer(layerId, { rotation: [0, 0, val * (Math.PI / 180)] })}
                        className="flex-1"
                    />
                    <span className="text-[9px] text-muted-foreground w-6 text-right">{Math.round(rotation * (180 / Math.PI))}°</span>
                </div>
            </div>

            {/* Action buttons - icon only on mobile */}
            <div className="flex items-center gap-1">
                <Button
                    variant={flipX ? "default" : "outline"}
                    size="icon"
                    onClick={() => updateTextureLayer(layerId, { flipX: !flipX })}
                    className="h-6 w-6"
                >
                    <FlipHorizontal className="w-3 h-3" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDuplicate}
                    className="h-6 w-6"
                >
                    <Copy className="w-3 h-3" />
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeTextureLayer(layerId)}
                    className="h-6 w-6 ml-auto"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
