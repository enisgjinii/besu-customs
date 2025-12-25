"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { compressImageForMobile, isMobile } from "@/lib/mobile-performance-utils";

export function Step07Images() {
  const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore((state) => state.setSelectedTextureLayerId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        let result = event.target?.result as string;
        if (isMobile()) {
          result = await compressImageForMobile(result, 1024, 0.85);
        }
        
        const newId = uuidv4();
        addTextureLayer({
          id: newId,
          name: file.name,
          type: "image",
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal",
          order: textureLayers.length,
          imageUrl: result,
          // Center of chest position for better initial placement
          position: [0.5, 0.35, 0],
          rotation: [0, 0, 0],
          scale: [0.35, 0.35, 1], // Larger initial size for easier adjustment
        });
        setSelectedTextureLayerId(newId);
        toast.success("Image added to center - drag to position");
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Filter to only show non-text, non-AI images
  const layers = textureLayers.filter(
    (l) => l.type === "image" && !l.name.startsWith("Text:") && !l.name.startsWith("AI")
  );

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">Add Images</h2>
        <p className="text-xs text-muted-foreground">Upload custom images for your design</p>
      </div>

      {/* Upload */}
      <Button variant="outline" className="w-full h-10 relative" asChild>
        <label className="cursor-pointer flex items-center justify-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="text-sm">Upload Image</span>
          <Input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
          />
        </label>
      </Button>

      {/* Layers with improved controls */}
      {layers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            Images ({layers.length}) - Tap to edit
          </span>
          <div className="max-h-[120px] overflow-y-auto space-y-1.5">
            {layers.map((layer) => (
              <div 
                key={layer.id} 
                className="p-2 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {layer.imageUrl && (
                    <img 
                      src={layer.imageUrl} 
                      alt={layer.name} 
                      className="w-8 h-8 object-contain rounded bg-muted/50" 
                    />
                  )}
                  <span className="text-xs font-medium truncate flex-1">{layer.name}</span>
                </div>
                <LayerControls layerId={layer.id} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {layers.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No images added yet. Upload an image to get started.
        </p>
      )}
    </div>
  );
}
