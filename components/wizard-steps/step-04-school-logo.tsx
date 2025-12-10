"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { PatternSelector } from "@/components/pattern-selector";
import { getSchoolLogoPosition } from "@/lib/logo-positioning";

export function Step04SchoolLogo() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);
    const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const logoPreset = getSchoolLogoPosition(currentModelUrl);
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
                    position: logoPreset.position,
                    rotation: logoPreset.rotation,
                    scale: logoPreset.scale,
                });
                toast.success("Logo added");
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    const logos = textureLayers.filter(l => l.type === "image");

    return (
        <div className="space-y-3">
            {/* School logos grid - compact */}
            <div className="h-[140px]">
                <PatternSelector lockedCategory="school-logos" className="h-full border-none shadow-none p-0" />
            </div>

            {/* Upload button */}
            <Button variant="outline" size="sm" className="w-full h-8 relative" asChild>
                <label className="cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-3 h-3" />
                    <span className="text-xs">Upload Custom Logo</span>
                    <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                    />
                </label>
            </Button>

            {/* Active logos list */}
            {logos.length > 0 && (
                <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Active Logos</span>
                    {logos.map((layer) => (
                        <div key={layer.id} className="p-1.5 rounded border bg-card">
                            <div className="flex items-center gap-2 mb-1.5">
                                {layer.imageUrl && (
                                    <img src={layer.imageUrl} alt={layer.name} className="w-6 h-6 object-contain rounded bg-muted/50" />
                                )}
                                <span className="text-xs font-medium truncate flex-1">{layer.name}</span>
                            </div>
                            <LayerControls layerId={layer.id} compact />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
