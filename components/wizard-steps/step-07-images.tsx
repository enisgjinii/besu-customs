"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";

export function Step07Images() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);
    const removeTextureLayer = useConfiguratorStore((state) => state.removeTextureLayer);

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
                    position: [0, 0, 1], // Front Decal
                    rotation: [0, 0, 0],
                    scale: [0.3, 0.3, 1],
                });
                toast.success("Image added to scene");
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const layers = textureLayers.filter(l => l.type === "image" && !l.name.startsWith("Text:"));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Add Images</h2>
                <p className="text-sm text-muted-foreground">
                    Upload any other images or graphics you want to add.
                </p>
            </div>

            <div className="p-4 border-2 border-dashed rounded-xl hover:bg-accent/50 transition-colors text-center cursor-pointer relative">
                <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-2 py-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <ImageIcon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium">Click to upload image</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG, SVG supported</span>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-medium">Your Images</h3>
                {layers.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No images added yet.</p>
                )}
                {layers.map((layer) => (
                    <div key={layer.id} className="p-3 rounded-md border bg-card space-y-3">
                        <div className="flex items-center gap-3">
                            {layer.imageUrl && (
                                <img src={layer.imageUrl} alt={layer.name} className="w-8 h-8 object-contain rounded bg-muted/50 p-0.5" />
                            )}
                            <span className="text-sm font-medium truncate flex-1">{layer.name}</span>
                        </div>

                        <LayerControls layerId={layer.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}
