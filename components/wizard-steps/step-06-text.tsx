"use client";
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

import { cn } from "@/lib/utils";

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

  const setPlacementMode = useConfiguratorStore((state) => state.setPlacementMode);
  const setPendingLayer = useConfiguratorStore((state) => state.setPendingLayer);
  const isPlacementMode = useConfiguratorStore((state) => state.isPlacementMode);

  const handleAddText = () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text");
      return;
    }

    // Set pending layer and enable placement mode
    setPendingLayer({
      type: "text",
      text: textInput,
      name: `Text: ${textInput}`,
      textColor: textColor,
      fontSize: 80,
      fontFamily: "Roboto",
      scale: [1, 1, 1],
      rotation: [0, 0, 0]
    });
    setPlacementMode(true);
    setTextInput(""); // Clear input
    toast.info("Click anywhere on the model to place the text");
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
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Add Text</h2>
        <p className="text-xs text-muted-foreground">
          Personalize with names and numbers
        </p>
      </div>

      {/* Input Area */}
      {isPlacementMode ? (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-3 animate-pulse">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Tap to Place</p>
            <p className="text-xs text-muted-foreground">Touch anywhere on the 3D model</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlacementMode(false);
              setPendingLayer(null);
            }}
            className="h-8 text-xs bg-background"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 p-1.5 bg-card border rounded-xl shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="relative flex-1">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              onKeyDown={(e) => e.key === "Enter" && handleAddText()}
              className="h-10 text-base border-0 shadow-none focus-visible:ring-0 px-2 bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1.5 pr-1">
            <div className="h-6 w-px bg-border mx-1" />
            <div className="relative group">
              <div
                className="w-8 h-8 rounded-full border shadow-sm cursor-pointer overflow-hidden transition-transform active:scale-95"
                style={{ backgroundColor: textColor }}
              />
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <Button
              onClick={handleAddText}
              size="icon"
              className="h-9 w-9 rounded-lg shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Text Layers */}
      {textLayers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">Active Text Layers</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{textLayers.length}</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {textLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => {
                  setSelectedTextId(layer.id);
                  setSelectedTextureLayerId(layer.id);
                }}
                className={cn(
                  "group relative rounded-xl border transition-all duration-200 overflow-hidden",
                  selectedTextId === layer.id
                    ? "bg-card border-primary shadow-md ring-1 ring-primary/20"
                    : "bg-muted/20 border-transparent hover:bg-muted/40"
                )}
              >
                {/* Card Header / Summary */}
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-10 h-10 rounded-lg border bg-current flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                    style={{
                      color: layer.textColor,
                      backgroundColor: layer.textColor === "#ffffff" ? "#f3f4f6" : "#ffffff",
                      borderColor: layer.textColor === "#ffffff" ? "#e5e7eb" : "transparent"
                    }}
                  >
                    <span style={{ fontFamily: layer.fontFamily }}>Aa</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm" style={{ fontFamily: layer.fontFamily }}>{layer.text}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {layer.fontFamily} • {layer.fontSize}px
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteText(layer.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Expanded Controls */}
                {selectedTextId === layer.id && (
                  <div className="px-3 pb-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px w-full bg-border/50 mb-3" />

                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Typeface</label>
                      <Select
                        value={layer.fontFamily || "Roboto"}
                        onValueChange={(val) =>
                          updateTextureLayer(layer.id, { fontFamily: val })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
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
                    </div>

                    {/* Size & Color */}
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Size</label>
                          <span className="text-[10px] font-mono">{layer.fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => decreaseSize(layer.id, layer.fontSize || 80)}
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
                            className="h-6 w-6 shrink-0"
                            onClick={() => increaseSize(layer.id, layer.fontSize || 80)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Color</label>
                        <div className="relative w-9 h-9">
                          <div
                            className="w-full h-full rounded-md border shadow-sm cursor-pointer"
                            style={{ backgroundColor: layer.textColor }}
                          />
                          <input
                            type="color"
                            value={layer.textColor}
                            onChange={(e) => updateTextureLayer(layer.id, { textColor: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Position */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Position</label>
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
                                ? "secondary" // Highlight active
                                : "outline"
                            }
                            onClick={() =>
                              updateTextureLayer(layer.id, {
                                position: pos as [number, number, number],
                              })
                            }
                            className={cn(
                              "text-[9px] h-7 px-0 transition-all",
                              layer.position?.[0] === pos[0] && layer.position?.[1] === pos[1] && "bg-primary/10 text-primary border-primary/20"
                            )}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {textLayers.length === 0 && (
        <div className="py-8 text-center bg-muted/10 rounded-xl border border-dashed border-muted-foreground/20">
          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
            <span className="font-serif italic text-lg">Aa</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Start by typing a name or number above
          </p>
        </div>
      )}
    </div>
  );
}
