"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { TextureLayerSelector } from "@/components/texture-layer-selector";

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
                    position: [0.5, 0.35, 0], // Chest position
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
        <div className="space-y-3">
            {/* Texture Layer Selector - Shows what's selected */}
            {textureLayers.length > 0 && <TextureLayerSelector />}

            {/* Compact upload button */}
            <Button variant="outline" className="w-full h-10 relative" asChild>
                <label className="cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload Image</span>
                    <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                    />
                </label>
            </Button>

            {/* Image layers list */}
            {layers.length > 0 && (
                <div className="space-y-1.5">
                    {layers.map((layer) => (
                        <div key={layer.id} className="p-1.5 rounded border bg-card">
                            <div className="flex items-center gap-2 mb-1.5">
                                {layer.imageUrl && (
                                    <img src={layer.imageUrl} alt={layer.name} className="w-6 h-6 object-contain rounded bg-muted/50" />
                                )}
                                <span className="text-xs font-medium truncate flex-1">{layer.name}</span>
                            </div>
                            <LayerControls layerId={layer.id} compact />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
