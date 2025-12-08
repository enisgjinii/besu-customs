"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export function Step08AIImages() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);

    const [removeBackground, setRemoveBackground] = useState(false);

    // Listen for generated images from the AIImageGenerator component
    useEffect(() => {
        const handleGeneratedImage = (e: Event) => {
            const customEvent = e as CustomEvent;
            // In the previous code, this was intercepted by UV editor. 
            // Now capture it here to add as a layer.
            console.log("AI Image Event captured in wizard", customEvent.detail);

            const data = customEvent.detail;
            if (!data || !data.url) return;

            // NOTE: Actual "Remove Background" processing would happen here or in the API integration.
            // Since we don't have a live backend for that right now, we assume the image comes as is.
            // If the user checked "Remove Background", we would ideally call another service.
            if (removeBackground) {
                toast.info("Background removal requested (simulation)");
            }

            addTextureLayer({
                id: uuidv4(),
                name: `AI Gen ${new Date().toLocaleTimeString()}`,
                type: "image",
                visible: true,
                locked: false,
                opacity: 1,
                blendMode: "normal",
                order: textureLayers.length,
                imageUrl: data.url,
                position: [0, 0, 0.1],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            });
            toast.success("AI Image added to scene");
        };

        window.addEventListener('generated-image-available', handleGeneratedImage);
        return () => {
            window.removeEventListener('generated-image-available', handleGeneratedImage);
        };
    }, [addTextureLayer, textureLayers.length, removeBackground]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Generate with AI</h2>
                <p className="text-sm text-muted-foreground">
                    Create unique designs using AI.
                </p>
            </div>

            <div className="flex items-center space-x-2 py-2">
                <Switch id="remove-bg" checked={removeBackground} onCheckedChange={setRemoveBackground} />
                <Label htmlFor="remove-bg">Remove Background (Beta)</Label>
            </div>

            <div className="border rounded-xl p-4 bg-muted/10">
                <AIImageGenerator />
            </div>
        </div>
    );
}
