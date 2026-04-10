import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useConfiguratorStore } from "@/lib/store";
import {
  Copy,
  FlipHorizontal,
  RotateCw,
  Trash2,
  ZoomIn,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LayerControlsProps {
  layerId: string;
  compact?: boolean;
  sliderOnly?: boolean;
}

export function LayerControls({
  layerId,
  compact = false,
  sliderOnly = false,
}: LayerControlsProps) {
  const layer = useConfiguratorStore((s) =>
    s.textureLayers.find((l) => l.id === layerId),
  );
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
  const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
  const moveLayer = useConfiguratorStore((s) => s.moveLayer);

  if (!layer) return null;

  const scale = layer.scale?.[0] || 1;
  const rotation = layer.rotation?.[2] || 0;
  const flipX = layer.flipX || false;

  // Quick size adjustment functions
  const increaseSize = () => {
    const newScale = Math.min(3, scale + 0.1);
    updateTextureLayer(layerId, { scale: [newScale, newScale, newScale] });
  };

  const decreaseSize = () => {
    const newScale = Math.max(0.05, scale - 0.1);
    updateTextureLayer(layerId, { scale: [newScale, newScale, newScale] });
  };

  const handleDuplicate = () => {
    addTextureLayer({
      ...layer,
      id: uuidv4(),
      name: `${layer.name} (Copy)`,
      position: layer.position
        ? [
            layer.position[0] + 0.05,
            layer.position[1] - 0.05,
            layer.position[2],
          ]
        : [0.55, 0.45, 0],
    });
  };

  return (
    <div
      className={cn(
        "bg-muted/30 rounded-md",
        compact ? "p-1.5 space-y-1.5" : "p-2 space-y-2",
      )}
    >
      {/* Size controls with +/- buttons for easier mobile adjustment */}
      <div className="flex items-center gap-2">
        <ZoomIn className="w-3 h-3 text-muted-foreground shrink-0" />
        {!sliderOnly && (
          <Button
            variant="outline"
            size="icon"
            onClick={decreaseSize}
            className="h-8 w-8 touch-manipulation"
          >
            <Minus className="w-4 h-4" />
          </Button>
        )}
        <Slider
          value={[scale * 100]}
          min={5}
          max={300}
          step={5}
          onValueChange={([val]) =>
            updateTextureLayer(layerId, {
              scale: [val / 100, val / 100, val / 100],
            })
          }
          className="flex-1 cursor-pointer"
        />
        {!sliderOnly && (
          <Button
            variant="outline"
            size="icon"
            onClick={increaseSize}
            className="h-8 w-8 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <span className="text-[9px] text-muted-foreground w-10 text-right">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Rotation */}
      <div className="flex items-center gap-2">
        <RotateCw className="w-3 h-3 text-muted-foreground shrink-0" />
        <Slider
          value={[rotation * (180 / Math.PI)]}
          min={0}
          max={360}
          step={5}
          onValueChange={([val]) =>
            updateTextureLayer(layerId, {
              rotation: [0, 0, val * (Math.PI / 180)],
            })
          }
          className="flex-1"
        />
        <span className="text-[9px] text-muted-foreground w-8 text-right">
          {Math.round(rotation * (180 / Math.PI))}°
        </span>
      </div>

      {/* Arrange Controls */}
      <div className="grid grid-cols-4 gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => moveLayer(layerId, "front")}
          className="h-8 w-full touch-manipulation"
          title="Bring to Front"
        >
          <ChevronsUp className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => moveLayer(layerId, "forward")}
          className="h-8 w-full touch-manipulation"
          title="Bring Forward"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => moveLayer(layerId, "backward")}
          className="h-8 w-full touch-manipulation"
          title="Send Backward"
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => moveLayer(layerId, "back")}
          className="h-8 w-full touch-manipulation"
          title="Send to Back"
        >
          <ChevronsDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant={flipX ? "default" : "outline"}
          size="icon"
          onClick={() => updateTextureLayer(layerId, { flipX: !flipX })}
          className="h-8 w-8 touch-manipulation"
          title="Flip Horizontal"
        >
          <FlipHorizontal className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDuplicate}
          className="h-8 w-8 touch-manipulation"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            // Add confirmation on mobile for better UX
            if (window.innerWidth < 768) {
              if (
                !confirm("Delete this design? This action cannot be undone.")
              ) {
                return;
              }
            }
            try {
              removeTextureLayer(layerId);
              console.log(" Layer deleted successfully:", layerId);
              toast.success("Design deleted");
            } catch (error) {
              console.error(" Failed to delete layer:", error);
              toast.error("Failed to delete design");
            }
          }}
          className="h-8 w-8 ml-auto touch-manipulation mobile-delete-btn md:h-6 md:w-6"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
        </Button>
      </div>
    </div>
  );
}
