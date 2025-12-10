"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { PatternSelector } from "@/components/pattern-selector";

export function Step04SchoolLogo() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);
    const removeTextureLayer = useConfiguratorStore((state) => state.removeTextureLayer);

    const updateTextureLayer = useConfiguratorStore((state) => state.updateTextureLayer);

    // Preset position for school logos - left chest area
    const SCHOOL_LOGO_PRESET = {
        position: [0.0676, 0.3833, 0] as [number, number, number],
        scale: [0.15, 0.15, 1] as [number, number, number],
    };

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
                    // Auto-position at left chest for school logos
                    position: SCHOOL_LOGO_PRESET.position,
                    rotation: [0, 0, 0],
                    scale: SCHOOL_LOGO_PRESET.scale,
                });
                toast.success("Logo added at chest position");
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
                    Select a school logo from the list below, or upload your own custom logo.
                </p>
            </div>

            {/* PRESET SCHOOL LOGOS */}
            <div>
                <Label className="mb-2 block">Select School Logo</Label>
                <div className="h-[300px]">
                    <PatternSelector lockedCategory="school-logos" className="h-full border-none shadow-none p-0" />
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or Upload Custom</span>
                </div>
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

            {/* Active Layers List */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium">Active Logos</h3>
                {logos.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No logos added yet.</p>
                )}
                {logos.map((layer) => (
                    <div key={layer.id} className="p-3 rounded-md border bg-card space-y-3">
                        <div className="flex items-center gap-3">
                            {layer.imageUrl && (
                                <img src={layer.imageUrl} alt={layer.name} className="w-8 h-8 object-contain rounded bg-muted/50 p-0.5" />
                            )}
                            <span className="text-sm font-medium truncate flex-1">{layer.name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                onClick={() => removeTextureLayer(layer.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                        {/* Unified Controls */}
                        <LayerControls layerId={layer.id} />
                    </div>
                ))}
            </div>
        </div>
    );
}
