"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export function Step04SchoolLogo() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);
    const removeTextureLayer = useConfiguratorStore((state) => state.removeTextureLayer);

    const updateTextureLayer = useConfiguratorStore((state) => state.updateTextureLayer);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (keep existing) ...
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
                    // Center in UV space
                    position: [0.5, 0.5, 0],
                    rotation: [0, 0, 0],
                    scale: [0.3, 0.3, 0.3], // Reasonable default size
                });
                toast.success("Logo added to scene");
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const logos = textureLayers.filter(l => l.type === "image");

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose Your School Logo</h2>
                <p className="text-sm text-muted-foreground">
                    Upload a logo. Use the sliders to resize/rotate, and drag on the 3D model to position.
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
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium">Click to upload logo</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG supported</span>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium">Active Logos</h3>
                {logos.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No logos added yet.</p>
                )}
                {logos.map((layer) => (
                    <div key={layer.id} className="p-3 rounded-md border bg-card space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {layer.imageUrl && (
                                    <img src={layer.imageUrl} alt={layer.name} className="w-8 h-8 object-contain rounded bg-muted/50 p-0.5" />
                                )}
                                <span className="text-sm font-medium truncate max-w-[120px]">{layer.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeTextureLayer(layer.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-1 gap-4 px-1">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Size</span>
                                    <span>{Math.round((layer.scale?.[0] || 0.3) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.05" max="1.0" step="0.01"
                                    value={layer.scale?.[0] || 0.3}
                                    onChange={(e) => {
                                        const s = parseFloat(e.target.value);
                                        updateTextureLayer(layer.id, { scale: [s, s, s] });
                                    }}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Rotation</span>
                                    <span>{Math.round(((layer.rotation?.[2] || 0) * 180) / Math.PI)}°</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max={Math.PI * 2} step="0.1"
                                    value={layer.rotation?.[2] || 0}
                                    onChange={(e) => {
                                        const r = parseFloat(e.target.value);
                                        updateTextureLayer(layer.id, { rotation: [0, 0, r] });
                                    }}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
