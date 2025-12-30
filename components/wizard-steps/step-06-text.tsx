"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Popular Google Fonts
const FONT_FAMILIES = [
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Oswald",
  "Poppins",
  "Bebas Neue",
  "Anton",
  "Lobster",
  "Pacifico",
  "Bangers",
  "Permanent Marker",
  "Russo One",
  "Righteous",
  "Orbitron",
  "Press Start 2P",
  "Inter",
  "Outfit",
  "Space Grotesk",
];

export function Step06Text() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );
  const removeTextureLayer = useConfiguratorStore(
    (state) => state.removeTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );

  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Load Google Fonts
  useEffect(() => {
    const link = document.getElementById(
      "google-fonts-link",
    ) as HTMLLinkElement;
    if (!link) {
      const newLink = document.createElement("link");
      newLink.id = "google-fonts-link";
      newLink.rel = "stylesheet";
      newLink.href = `https://fonts.googleapis.com/css2?family=${FONT_FAMILIES.map((f) => f.replace(/ /g, "+")).join("&family=")}&display=swap`;
      document.head.appendChild(newLink);
    }
  }, []);

  const handleAddText = () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text");
      return;
    }

    const newId = uuidv4();
    const newLayer = {
      id: newId,
      name: `Text: ${textInput}`,
      type: "text" as const,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal" as const,
      order: textureLayers.length + 1,
      text: textInput,
      textColor: textColor,
      fontSize: 80,
      fontFamily: "Roboto",
      // Center of chest position
      position: [0.5, 0.35, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [0.5, 0.5, 1] as [number, number, number],
    };
    addTextureLayer(newLayer);
    setSelectedTextId(newId);
    setSelectedTextureLayerId(newId);
    setTextInput("");
    toast.success("Text added to center - drag to position");
  };

  const handleDeleteText = (id: string) => {
    // Add confirmation on mobile for better UX
    if (window.innerWidth < 768) {
      if (!confirm("Delete this text? This action cannot be undone.")) {
        return;
      }
    }

    try {
      removeTextureLayer(id);
      if (selectedTextId === id) {
        setSelectedTextId(null);
      }
      console.log("✅ Text layer deleted successfully:", id);
      toast.success("Text removed");
    } catch (error) {
      console.error("❌ Failed to delete text layer:", error);
      toast.error("Failed to delete text");
    }
  };

  const textLayers = textureLayers.filter((l) => l.type === "text");
  const selectedLayer = textLayers.find((l) => l.id === selectedTextId);

  // Size adjustment helpers
  const increaseSize = (layerId: string, currentSize: number) => {
    updateTextureLayer(layerId, { fontSize: Math.min(200, currentSize + 10) });
  };

  const decreaseSize = (layerId: string, currentSize: number) => {
    updateTextureLayer(layerId, { fontSize: Math.max(20, currentSize - 10) });
  };

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">Add Text</h2>
        <p className="text-xs text-muted-foreground">
          Add custom text to your design
        </p>
      </div>

      {/* Quick Add */}
      <div className="flex gap-2">
        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter text..."
          onKeyDown={(e) => e.key === "Enter" && handleAddText()}
          className="h-9 text-sm flex-1"
        />
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="w-9 h-9 p-0.5 border rounded cursor-pointer shrink-0"
        />
        <Button
          onClick={handleAddText}
          size="icon"
          className="h-9 w-9 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Layers */}
      {textLayers.length > 0 && (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {textLayers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => {
                setSelectedTextId(layer.id);
                setSelectedTextureLayerId(layer.id);
              }}
              className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                selectedTextId === layer.id
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0 border"
                    style={{ backgroundColor: layer.textColor }}
                  />
                  <span className="text-xs font-medium truncate">
                    {layer.text}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 hover:bg-destructive/10 touch-manipulation mobile-delete-btn md:h-6 md:w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteText(layer.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive md:w-3 md:h-3" />
                </Button>
              </div>

              {selectedTextId === layer.id && (
                <div className="mt-2 pt-2 border-t space-y-2">
                  {/* Font */}
                  <Select
                    value={layer.fontFamily || "Roboto"}
                    onValueChange={(val) =>
                      updateTextureLayer(layer.id, { fontFamily: val })
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs"
                      style={{ fontFamily: layer.fontFamily }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem
                          key={font}
                          value={font}
                          style={{ fontFamily: font }}
                          className="text-sm"
                        >
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Color + Size with +/- buttons */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={layer.textColor || "#000000"}
                      onChange={(e) =>
                        updateTextureLayer(layer.id, {
                          textColor: e.target.value,
                        })
                      }
                      className="w-8 h-8 p-0.5 border rounded cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        decreaseSize(layer.id, layer.fontSize || 80)
                      }
                      className="h-7 w-7"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Slider
                      value={[layer.fontSize || 80]}
                      onValueChange={(v) =>
                        updateTextureLayer(layer.id, { fontSize: v[0] })
                      }
                      min={20}
                      max={200}
                      step={5}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        increaseSize(layer.id, layer.fontSize || 80)
                      }
                      className="h-7 w-7"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground w-10">
                      {layer.fontSize}px
                    </span>
                  </div>

                  {/* Quick Position Buttons */}
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { label: "Top", pos: [0.5, 0.15, 0] },
                      { label: "Chest", pos: [0.5, 0.35, 0] },
                      { label: "Mid", pos: [0.5, 0.5, 0] },
                      { label: "Left", pos: [0.25, 0.35, 0] },
                      { label: "Right", pos: [0.75, 0.35, 0] },
                    ].map(({ label, pos }) => (
                      <Button
                        key={label}
                        size="sm"
                        variant={
                          layer.position?.[0] === pos[0] &&
                          layer.position?.[1] === pos[1]
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          updateTextureLayer(layer.id, {
                            position: pos as [number, number, number],
                          })
                        }
                        className="text-[9px] h-6 px-1"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {textLayers.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No text added yet. Enter text above to get started.
        </p>
      )}
    </div>
  );
}
