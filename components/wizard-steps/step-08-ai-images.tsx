"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { TextureLayerSelector } from "@/components/texture-layer-selector";

export function Step08AIImages() {
    const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
    const textureLayers = useConfiguratorStore((state) => state.textureLayers);

    // Helper to remove background (improved multi-corner detection)
    const processImageWithTransparency = async (imageUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(imageUrl);
                    return;
                }
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const w = canvas.width;
                const h = canvas.height;

                // Sample background color from all 4 corners
                const getPixel = (x: number, y: number) => {
                    const i = (y * w + x) * 4;
                    return [data[i], data[i + 1], data[i + 2]];
                };

                const corners = [
                    getPixel(0, 0),           // top-left
                    getPixel(w - 1, 0),         // top-right
                    getPixel(0, h - 1),         // bottom-left
                    getPixel(w - 1, h - 1)        // bottom-right
                ];

                // Average the corner colors
                const rBg = Math.round(corners.reduce((s, c) => s + c[0], 0) / 4);
                const gBg = Math.round(corners.reduce((s, c) => s + c[1], 0) / 4);
                const bBg = Math.round(corners.reduce((s, c) => s + c[2], 0) / 4);

                // Higher tolerance for better background removal
                const tolerance = 60;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const diff = Math.abs(r - rBg) + Math.abs(g - gBg) + Math.abs(b - bBg);

                    if (diff < tolerance * 3) {
                        // Gradual transparency based on how close to background
                        const alpha = Math.min(255, Math.max(0, (diff / (tolerance * 3)) * 255));
                        data[i + 3] = alpha;
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => resolve(imageUrl);
        });
    };

    // Listen for generated images from the AIImageGenerator component
    useEffect(() => {
        const handleGeneratedImage = async (e: Event) => {
            const customEvent = e as CustomEvent;
            console.log("AI Image Event captured in wizard", customEvent.detail);

            const data = customEvent.detail;
            if (!data || !data.url) return;

            toast.info("Processing image (removing background)...");

            try {
                const processedUrl = await processImageWithTransparency(data.url);

                addTextureLayer({
                    id: uuidv4(),
                    name: `AI Gen ${new Date().toLocaleTimeString()}`,
                    type: "image",
                    visible: true,
                    locked: false,
                    opacity: 1,
                    blendMode: "normal",
                    order: textureLayers.length,
                    imageUrl: processedUrl,
                    position: [0.5, 0.35, 0], // Chest area (center X, upper Y)
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    flipX: false,
                });
                toast.success("AI Image added (Background Removed)");
            } catch (err) {
                console.error("Failed to process image", err);
                toast.error("Failed to process image");
            }
        };

        window.addEventListener('generated-image-available', handleGeneratedImage);
        return () => {
            window.removeEventListener('generated-image-available', handleGeneratedImage);
        };
    }, [addTextureLayer, textureLayers.length]);

    return (
        <div className="space-y-6">
            {/* Texture Layer Selector - Shows what's selected */}
            {textureLayers.length > 0 && <TextureLayerSelector />}

            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Generate with AI</h2>
                <p className="text-sm text-muted-foreground">
                    Create unique designs using AI. Images will be automatically added with background removed.
                </p>
            </div>

            <div className="border rounded-xl p-4 bg-muted/10">
                <AIImageGenerator />
            </div>
        </div>
    );
}
