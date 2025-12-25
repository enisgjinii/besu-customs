"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import { getSchoolLogoPosition } from "@/lib/logo-positioning";
import { compressImageForMobile, isMobile } from "@/lib/mobile-performance-utils";

// Predefined school logos - no need for PatternSelector duplication
const SCHOOL_LOGOS = [
  { id: "logo-1", name: "Eagles", url: "/logos/eagles.png" },
  { id: "logo-2", name: "Tigers", url: "/logos/tigers.png" },
  { id: "logo-3", name: "Bears", url: "/logos/bears.png" },
  { id: "logo-4", name: "Lions", url: "/logos/lions.png" },
  { id: "logo-5", name: "Hawks", url: "/logos/hawks.png" },
  { id: "logo-6", name: "Wolves", url: "/logos/wolves.png" },
];

export function Step04SchoolLogo() {
  const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
  const setSelectedTextureLayerId = useConfiguratorStore((state) => state.setSelectedTextureLayerId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const logoPreset = getSchoolLogoPosition(currentModelUrl);
      const reader = new FileReader();
      reader.onload = async (event) => {
        let result = event.target?.result as string;
        
        // Compress on mobile for better performance
        if (isMobile()) {
          result = await compressImageForMobile(result, 512, 0.85);
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
          scale: [0.25, 0.25, 1], // Larger initial size for easier adjustment
        });
        setSelectedTextureLayerId(newId);
        toast.success("Logo added to center - drag to position");
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const logos = textureLayers.filter((l) => l.type === "image");

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">Add Logo</h2>
        <p className="text-xs text-muted-foreground">Upload your team or school logo</p>
      </div>

      {/* Upload button */}
      <Button variant="outline" size="sm" className="w-full h-10 relative" asChild>
        <label className="cursor-pointer flex items-center justify-center gap-2">
          <Upload className="w-4 h-4" />
          <span className="text-sm">Upload Logo Image</span>
          <Input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
          />
        </label>
      </Button>

      {/* Active logos with improved controls */}
      {logos.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            Active Logos ({logos.length}) - Tap to edit
          </span>
          <div className="max-h-[120px] overflow-y-auto space-y-1.5">
            {logos.map((layer) => (
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

      {logos.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No logos added yet. Upload an image to get started.
        </p>
      )}
    </div>
  );
}
