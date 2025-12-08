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
                    // Initial position at center of screen/model effectively
                    position: [0, 0, 0.1],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                });
                toast.success("Logo added to scene");
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = "";
    };

    const logos = textureLayers.filter(l => l.type === "image");

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Choose Your School Logo</h2>
                <p className="text-sm text-muted-foreground">
                    Upload your school logo to place on the product. Drag and drop on the 3D model to position it.
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

            <div className="space-y-3">
                <h3 className="text-sm font-medium">Active Logos</h3>
                {logos.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No logos added yet.</p>
                )}
                {logos.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
                        <div className="flex items-center gap-3">
                            {layer.imageUrl && (
                                <img src={layer.imageUrl} alt={layer.name} className="w-8 h-8 object-contain rounded bg-muted/50 p-0.5" />
                            )}
                            <span className="text-sm truncate max-w-[150px]">{layer.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeTextureLayer(layer.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
