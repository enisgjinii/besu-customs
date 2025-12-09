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
    const [textColor, setTextColor] = useState("#000000");

    const handleAddText = () => {
        if (!textInput.trim()) return;

        addTextureLayer({
            id: uuidv4(),
            name: `Text: ${textInput}`,
            type: "text", // Dynamic text layer
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: "normal", // Usually normal for text
            order: textureLayers.length + 1, // On top of patterns/logos
            text: textInput,
            textColor: textColor,
            fontSize: 100, // Base font size relative to canvas 2048
            position: [0.5, 0.5, 0], // Center UV
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
        });

        setTextInput("");
        toast.success("Text added to scene");
    };

    const textLayers = textureLayers.filter(l => l.type === "text" || l.name.startsWith("Text:"));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Add Your Text</h2>
                <p className="text-sm text-muted-foreground">
                    Type text to add it to your product.
                </p>
            </div>

            <div className="flex gap-2 items-center">
                <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 p-0 border rounded cursor-pointer"
                    title="Text Color"
                />
                <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                    className="flex-1"
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
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20" style={{ color: layer.textColor }}>
                                T
                            </div>
                            <span className="text-sm font-medium truncate flex-1">{layer.text || layer.name}</span>
                        </div>

                        <LayerControls layerId={layer.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}
