"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Type } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";

export function Step06Text() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);
    const removeTextureLayer = useConfiguratorStore((state) => state.removeTextureLayer);

    const [textInput, setTextInput] = useState("");

    const handleAddText = () => {
        if (!textInput.trim()) return;

        // Generate a simple text image via canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // High res canvas for sharp text
        const fontSize = 100;
        ctx.font = `bold ${fontSize}px Arial`;
        const textMetrics = ctx.measureText(textInput);
        canvas.width = textMetrics.width + 40; // padding
        canvas.height = fontSize * 1.5;

        // Redraw with correct size
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = "black"; // Default black text
        ctx.textBaseline = "middle";
        ctx.fillText(textInput, 20, canvas.height / 2);

        const dataUrl = canvas.toDataURL("image/png");

        addTextureLayer({
            id: uuidv4(),
            name: `Text: ${textInput}`,
            type: "image", // Treat generated text as an image layer for decal
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: "normal",
            order: textureLayers.length,
            imageUrl: dataUrl,
            position: [0, 0, 0.1],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
        });

        setTextInput("");
        toast.success("Text added to scene");
    };

    const textLayers = textureLayers.filter(l => l.name.startsWith("Text:"));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Add Your Text</h2>
                <p className="text-sm text-muted-foreground">
                    Type text to add it to your product.
                </p>
            </div>

            <div className="flex gap-2">
                <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                />
                <Button onClick={handleAddText}>
                    <Type className="w-4 h-4 mr-2" />
                    Add
                </Button>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-medium">Text Layers</h3>
                {textLayers.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No text added yet.</p>
                )}
                {textLayers.map((layer) => (
                    <div key={layer.id} className="p-3 rounded-md border bg-card space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20">
                                T
                            </div>
                            <span className="text-sm font-medium truncate flex-1">{layer.name.replace("Text: ", "")}</span>
                        </div>

                        <LayerControls layerId={layer.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}
