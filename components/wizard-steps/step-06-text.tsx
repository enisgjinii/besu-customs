"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Type, Plus } from "lucide-react";
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
        <div className="space-y-3">
            {/* Compact input row */}
            <div className="flex gap-1.5 items-center">
                <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 p-0 border rounded cursor-pointer shrink-0"
                />
                <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                    className="flex-1 h-8 text-sm"
                />
                <Button onClick={handleAddText} size="icon" className="h-8 w-8 shrink-0">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Text layers list */}
            {textLayers.length > 0 && (
                <div className="space-y-1.5">
                    {textLayers.map((layer) => (
                        <div key={layer.id} className="p-1.5 rounded border bg-card">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Type className="w-3 h-3 shrink-0" style={{ color: layer.textColor }} />
                                <span className="text-xs font-medium truncate">{layer.text || layer.name}</span>
                            </div>
                            <LayerControls layerId={layer.id} compact />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
