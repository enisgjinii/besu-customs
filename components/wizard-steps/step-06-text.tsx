"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";

// Font options
const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
  { value: "Impact", label: "Impact" },
  { value: "Comic Sans MS", label: "Comic Sans" },
  { value: "Trebuchet MS", label: "Trebuchet" },
  { value: "Arial Black", label: "Arial Black" },
];

export function Step06Text() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const updateTextureLayer = useConfiguratorStore((state) => state.updateTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);

    const [textInput, setTextInput] = useState("");
    const [textColor, setTextColor] = useState("#000000");
    const [fontSize, setFontSize] = useState(100);
    const [fontFamily, setFontFamily] = useState("Arial");
    const [textCurvature, setTextCurvature] = useState(0);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

    const handleAddText = () => {
        if (!textInput.trim()) return;

        const newLayer = {
            id: uuidv4(),
            name: `Text: ${textInput}`,
            type: "text" as const,
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: "normal" as const,
            order: textureLayers.length + 1,
            text: textInput,
            textColor: textColor,
            fontSize: fontSize,
            position: [0.5, 0.35, 0] as [number, number, number], // Higher position (chest area)
            rotation: [0, 0, textCurvature] as [number, number, number], // Use rotation Z for curvature
            scale: [1, 1, 1] as [number, number, number],
        };

        addTextureLayer(newLayer);
        setSelectedTextId(newLayer.id);
        setTextInput("");
        toast.success("Text added! Edit properties below");
    };

    const textLayers = textureLayers.filter(l => l.type === "text");
    const selectedLayer = textLayers.find(l => l.id === selectedTextId);

    return (
        <div className="space-y-4">
            {/* Quick Add Section */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold">Quick Add Text</Label>
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <Input
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Enter text..."
                            onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                            className="h-9 text-sm"
                        />
                    </div>
                    <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-9 p-1 border rounded cursor-pointer shrink-0"
                    />
                    <Button onClick={handleAddText} size="icon" className="h-9 w-9 shrink-0">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Text Properties (for new or selected text) */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                <Label className="text-sm font-semibold">Text Properties</Label>
                
                {/* Font Family */}
                <div className="space-y-1">
                    <Label className="text-xs">Font</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FONT_FAMILIES.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                    {font.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">Size: {fontSize}px</Label>
                    </div>
                    <Slider
                        value={[fontSize]}
                        onValueChange={(v) => setFontSize(v[0])}
                        min={20}
                        max={300}
                        step={5}
                        className="w-full"
                    />
                </div>

                {/* Text Curvature */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs">
                            Curve: {textCurvature > 0 ? '↑' : textCurvature < 0 ? '↓' : '-'} {Math.abs(textCurvature)}°
                        </Label>
                    </div>
                    <Slider
                        value={[textCurvature]}
                        onValueChange={(v) => setTextCurvature(v[0])}
                        min={-45}
                        max={45}
                        step={2}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Curve up (+) or down (-)</p>
                </div>
            </div>

            {/* Text Layers List */}
            {textLayers.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Your Text Layers ({textLayers.length})</Label>
                    <div className="space-y-2">
                        {textLayers.map((layer) => (
                            <div 
                                key={layer.id}
                                onClick={() => setSelectedTextId(layer.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedTextId === layer.id
                                        ? "bg-primary/10 border-primary"
                                        : "bg-card border-border hover:bg-muted/50"
                                }`}
                            >
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                            className="w-3 h-3 rounded flex-shrink-0"
                                            style={{ backgroundColor: layer.textColor }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{layer.text || layer.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {layer.fontSize}px • {fontFamily}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedTextId === layer.id && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateTextureLayer(layer.id, { opacity: 0 });
                                                setSelectedTextId(null);
                                                toast.success("Text removed");
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                                
                                {/* Show controls when selected */}
                                {selectedTextId === layer.id && (
                                    <div className="mt-2 pt-2 border-t space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={layer.textColor || "#000000"}
                                                onChange={(e) => updateTextureLayer(layer.id, { textColor: e.target.value })}
                                                className="w-8 h-8 p-1 border rounded cursor-pointer"
                                            />
                                            <Slider
                                                value={[layer.fontSize || 100]}
                                                onValueChange={(v) => updateTextureLayer(layer.id, { fontSize: v[0] })}
                                                min={20}
                                                max={300}
                                                step={5}
                                                className="flex-1"
                                            />
                                            <span className="text-xs text-muted-foreground w-10 text-right pt-1">
                                                {layer.fontSize}px
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
