"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Image as ImageIcon,
  Type,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface TextureLayer {
  id: string;
  name: string;
  type: "text" | "image" | "decal";
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "add";
  order: number;
  dataUrl?: string;
  text?: string;
  textColor?: string;
  fontSize?: number;
  imageUrl?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

export function TextureLayers() {
  const layers = useConfiguratorStore((s) => s.textureLayers);
  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
  const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
  const reorderTextureLayers = useConfiguratorStore(
    (s) => s.reorderTextureLayers,
  );
  const setLastDecalTexture = useConfiguratorStore(
    (s) => s.setLastDecalTexture,
  );

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [newLayerName, setNewLayerName] = useState("");

  // Add new text layer
  const addTextLayer = () => {
    const newLayer: TextureLayer = {
      id: `layer-${Date.now()}`,
      name: newLayerName || `Text Layer ${layers.length + 1}`,
      type: "text",
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: "normal",
      order: layers.length,
      text: "",
      textColor: "#000000",
      fontSize: 60,
    };
    addTextureLayer(newLayer);
    setSelectedLayerId(newLayer.id);
    setNewLayerName("");
  };

  // Add new image layer
  const addImageLayer = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      const newLayer: TextureLayer = {
        id: `layer-${Date.now()}`,
        name: file.name || `Image Layer ${layers.length + 1}`,
        type: "image",
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: "normal",
        order: layers.length,
        imageUrl: imgUrl,
        dataUrl: imgUrl,
      };
      addTextureLayer(newLayer);
      setSelectedLayerId(newLayer.id);
    };
    reader.readAsDataURL(file);
  };

  // Update layer properties
  const updateLayer = (id: string, updates: Partial<TextureLayer>) => {
    updateTextureLayer(id, updates);
  };

  // Toggle layer visibility
  const toggleVisibility = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      updateLayer(id, { visible: !layer.visible });
    }
  };

  // Toggle layer lock
  const toggleLock = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      updateLayer(id, { locked: !layer.locked });
    }
  };

  // Delete layer
  const deleteLayer = (id: string) => {
    removeTextureLayer(id);
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Duplicate layer
  const duplicateLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      const newLayer: TextureLayer = {
        ...layer,
        id: `layer-${Date.now()}`,
        name: `${layer.name} Copy`,
        order: layers.length,
      };
      addTextureLayer(newLayer);
    }
  };

  // Move layer up/down
  const moveLayer = (id: string, direction: "up" | "down") => {
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const newLayers = [...layers];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newLayers.length) return;

    [newLayers[index], newLayers[targetIndex]] = [
      newLayers[targetIndex],
      newLayers[index],
    ];

    // Update order property
    newLayers.forEach((layer, i) => {
      layer.order = i;
    });

    reorderTextureLayers(newLayers);
  };

  // Apply layer to model
  const applyLayerToModel = (layer: TextureLayer) => {
    if (!layer.visible) return;

    if (layer.type === "text" && layer.text) {
      // Generate text decal
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, 1024, 1024);
      ctx.fillStyle = layer.textColor || "#000000";
      ctx.font = `bold ${(layer.fontSize || 60) * 2}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = (layer.opacity || 100) / 100;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(layer.text, 512, 512);

      const dataUrl = canvas.toDataURL("image/png");
      setLastDecalTexture(dataUrl);
    } else if (layer.type === "image" && layer.imageUrl) {
      setLastDecalTexture(layer.imageUrl);
    }
  };

  // Render combined preview
  const renderCombinedPreview = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Sort by order (bottom to top)
    const sortedLayers = [...layers]
      .filter((l) => l.visible)
      .sort((a, b) => a.order - b.order);

    // Clear canvas
    ctx.clearRect(0, 0, 1024, 1024);

    sortedLayers.forEach((layer) => {
      ctx.globalAlpha = (layer.opacity || 100) / 100;

      if (layer.type === "text" && layer.text) {
        ctx.fillStyle = layer.textColor || "#000000";
        ctx.font = `bold ${(layer.fontSize || 60) * 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(layer.text, 512, 512);
      }
    });

    return canvas.toDataURL("image/png");
  };

  // Apply all visible layers
  const applyAllLayers = () => {
    const combinedDataUrl = renderCombinedPreview();
    if (combinedDataUrl) {
      setLastDecalTexture(combinedDataUrl);
      console.log("🎯 Combined layers ready: click on model to place");
    }
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLayers(newExpanded);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Texture Layers
          </h3>
          <Badge variant="secondary">{layers.length} layers</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Create and manage texture layers
        </p>
      </div>

      {/* Layer List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {layers.length === 0 ? (
            <Card className="p-8 text-center">
              <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No layers yet. Add your first layer to get started.
              </p>
            </Card>
          ) : (
            layers
              .slice()
              .reverse()
              .map((layer, index) => {
                const isExpanded = expandedLayers.has(layer.id);
                const isSelected = selectedLayerId === layer.id;

                return (
                  <Card
                    key={layer.id}
                    className={`transition-all ${
                      isSelected ? "ring-2 ring-primary" : "hover:bg-accent/50"
                    } ${!layer.visible ? "opacity-60" : ""}`}
                  >
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(layer.id)}
                    >
                      <div
                        className="p-3 cursor-pointer"
                        onClick={() => setSelectedLayerId(layer.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {layer.type === "text" ? (
                              <Type className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <ImageIcon className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium truncate">
                              {layer.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {layer.blendMode}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisibility(layer.id);
                              }}
                            >
                              {layer.visible ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLock(layer.id);
                              }}
                            >
                              {layer.locked ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <Separator />
                        <div className="p-3 space-y-3">
                          {/* Layer Controls */}
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">
                                Opacity: {layer.opacity}%
                              </Label>
                              <Slider
                                value={[layer.opacity]}
                                onValueChange={(value) =>
                                  updateLayer(layer.id, { opacity: value[0] })
                                }
                                min={0}
                                max={100}
                                step={1}
                                className="mt-1"
                                disabled={layer.locked}
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Blend Mode</Label>
                              <Select
                                value={layer.blendMode}
                                onValueChange={(value) =>
                                  updateLayer(layer.id, {
                                    blendMode:
                                      value as TextureLayer["blendMode"],
                                  })
                                }
                                disabled={layer.locked}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="multiply">
                                    Multiply
                                  </SelectItem>
                                  <SelectItem value="screen">Screen</SelectItem>
                                  <SelectItem value="overlay">
                                    Overlay
                                  </SelectItem>
                                  <SelectItem value="add">Add</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {layer.type === "text" && (
                              <>
                                <div>
                                  <Label className="text-xs">Text</Label>
                                  <Input
                                    value={layer.text || ""}
                                    onChange={(e) =>
                                      updateLayer(layer.id, {
                                        text: e.target.value,
                                      })
                                    }
                                    placeholder="Enter text..."
                                    className="h-8 text-xs"
                                    disabled={layer.locked}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Font Size</Label>
                                    <Input
                                      type="number"
                                      value={layer.fontSize || 60}
                                      onChange={(e) =>
                                        updateLayer(layer.id, {
                                          fontSize: Number(e.target.value),
                                        })
                                      }
                                      className="h-8 text-xs"
                                      disabled={layer.locked}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Color</Label>
                                    <Input
                                      type="color"
                                      value={layer.textColor || "#000000"}
                                      onChange={(e) =>
                                        updateLayer(layer.id, {
                                          textColor: e.target.value,
                                        })
                                      }
                                      className="h-8"
                                      disabled={layer.locked}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <Separator />

                          {/* Layer Actions */}
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyLayerToModel(layer);
                              }}
                              disabled={!layer.visible}
                            >
                              Apply
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layer.id, "up");
                              }}
                              disabled={index === layers.length - 1}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layer.id, "down");
                              }}
                              disabled={index === 0}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateLayer(layer.id);
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLayer(layer.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4 space-y-3 border-t">
        {layers.length > 0 && (
          <Button
            onClick={applyAllLayers}
            className="w-full"
            size="lg"
            disabled={layers.filter((l) => l.visible).length === 0}
          >
            <Layers className="w-4 h-4 mr-2" />
            Apply All Layers
          </Button>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Add New Layer</Label>
          <Input
            placeholder="Layer name (optional)"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            className="h-9 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={addTextLayer}
              className="w-full"
              size="sm"
            >
              <Type className="w-4 h-4 mr-2" />
              Add Text
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) addImageLayer(file);
                };
                input.click();
              }}
              className="w-full"
              size="sm"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          💡 Click on model to place your layers
        </p>
      </div>
    </div>
  );
}
