import { Button } from "@/components/ui/button";
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

    const handleRemove = () => {
        removeTextureLayer(layerId);
    };

    return (
        <div className={cn(
            "bg-secondary/20 rounded-lg space-y-2",
            compact ? "p-2 text-xs" : "p-2.5 text-sm"
        )}>
            {/* Compact sliders in a row on mobile */}
            <div className="grid grid-cols-2 gap-2">
                {/* Size */}
                <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                        <span className="flex items-center gap-1">
                            <ZoomIn className="w-3 h-3" />
                            Size
                        </span>
                        <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.05"
                        max="2.0"
                        step="0.01"
                        value={scale}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateTextureLayer(layerId, { scale: [val, val, val] });
                        }}
                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                {/* Rotation */}
                <div className="space-y-1">
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                        <span className="flex items-center gap-1">
                            <RotateCw className="w-3 h-3" />
                            Rotate
                        </span>
                        <span>{Math.round((rotation * 180) / Math.PI)}°</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={Math.PI * 2}
                        step="0.1"
                        value={rotation}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateTextureLayer(layerId, { rotation: [0, 0, val] });
                        }}
                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
            </div>

            {/* Compact action buttons */}
            <div className="flex items-center gap-1.5">
                <Button
                    variant={flipX ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateTextureLayer(layerId, { flipX: !flipX })}
                    className="flex-1 h-7 text-[10px] px-2"
                >
                    <FlipHorizontal className="w-3 h-3 mr-1" />
                    Flip
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicate}
                    className="flex-1 h-7 text-[10px] px-2"
                >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="h-7 w-7 p-0"
                    title="Delete"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
