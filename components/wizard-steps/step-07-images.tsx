"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";

export function Step07Images() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                addTextureLayer({
                    id: uuidv4(),
                    name: file.name,
                    type: "image",
                    visible: true,
                    locked: false,
                    opacity: 1,
                    blendMode: "normal",
                    order: textureLayers.length,
                    imageUrl: result,
                    position: [0.5, 0.5, 0],
                    rotation: [0, 0, 0],
                    scale: [0.3, 0.3, 1],
                });
                toast.success("Image added");
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const layers = textureLayers.filter(l => l.type === "image" && !l.name.startsWith("Text:"));

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">Add Images</h2>
                <p className="text-xs text-muted-foreground">
                    Upload images or graphics to add.
                </p>
            </div>

            {/* Compact upload area */}
            <div className="p-3 border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors text-center cursor-pointer relative">
                <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                />
                <div className="flex items-center justify-center gap-3 py-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <ImageIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                        <span className="font-medium text-sm block">Upload image</span>
                        <span className="text-[10px] text-muted-foreground">PNG, JPG, SVG</span>
                    </div>
                </div>
            </div>

            {/* Compact image layers list */}
            <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">Your Images</h3>
                {layers.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No images added yet.</p>
                )}
                {layers.map((layer) => (
                    <div key={layer.id} className="p-2 rounded-md border bg-card space-y-2">
                        <div className="flex items-center gap-2">
                            {layer.imageUrl && (
                                <img src={layer.imageUrl} alt={layer.name} className="w-7 h-7 object-contain rounded bg-muted/50 p-0.5" />
                            )}
                            <span className="text-sm font-medium truncate flex-1">{layer.name}</span>
                        </div>
                        <LayerControls layerId={layer.id} compact />
                    </div>
                ))}
            </div>
        </div>
    );
}
