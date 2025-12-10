"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Type } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";

export function Step06Text() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);

    const [textInput, setTextInput] = useState("");
    const [textColor, setTextColor] = useState("#000000");

    const handleAddText = () => {
        if (!textInput.trim()) return;

        addTextureLayer({
            id: uuidv4(),
            name: `Text: ${textInput}`,
            type: "text",
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: "normal",
            order: textureLayers.length + 1,
            text: textInput,
            textColor: textColor,
            fontSize: 100,
            position: [0.5, 0.5, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
        });

        setTextInput("");
        toast.success("Text added");
    };

    const textLayers = textureLayers.filter(l => l.type === "text" || l.name.startsWith("Text:"));

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">Add Your Text</h2>
                <p className="text-xs text-muted-foreground">
                    Type text to add it to your product.
                </p>
            </div>

            {/* Compact input row */}
            <div className="flex gap-2 items-center">
                <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-9 h-9 p-0 border rounded cursor-pointer shrink-0"
                    title="Text Color"
                />
                <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                    className="flex-1 h-9 text-sm"
                />
                <Button onClick={handleAddText} size="sm" className="h-9 px-3">
                    <Type className="w-4 h-4 mr-1.5" />
                    Add
                </Button>
            </div>

            {/* Compact text layers list */}
            <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">Text Layers</h3>
                {textLayers.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No text added yet.</p>
                )}
                {textLayers.map((layer) => (
                    <div key={layer.id} className="p-2 rounded-md border bg-card space-y-2">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center font-bold text-xs ring-1 ring-primary/20" 
                                style={{ color: layer.textColor }}
                            >
                                T
                            </div>
                            <span className="text-sm font-medium truncate flex-1">{layer.text || layer.name}</span>
                        </div>
                        <LayerControls layerId={layer.id} compact />
                    </div>
                ))}
            </div>
        </div>
    );
}
