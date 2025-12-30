"use client";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import { useRef, useState, useMemo } from "react";
import { getPatternsByCategory, type Pattern } from "@/lib/patterns";
import { cn } from "@/lib/utils";

export function Step04SchoolLogo() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setPlacementMode = useConfiguratorStore((state) => state.setPlacementMode);
  const setPendingLayer = useConfiguratorStore((state) => state.setPendingLayer);
  const isPlacementMode = useConfiguratorStore((state) => state.isPlacementMode);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );

  // Track if upload is in progress
  const uploadLockRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);

  // Get school logos from patterns library
  const schoolLogos = useMemo(() => getPatternsByCategory("school-logos"), []);

  // Filter logos by search
  const filteredLogos = useMemo(() => {
    if (!searchQuery.trim()) return schoolLogos.slice(0, 50); // Show first 50 by default
    const q = searchQuery.toLowerCase();
    return schoolLogos.filter(logo =>
      logo.name.toLowerCase().includes(q) ||
      logo.description?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [schoolLogos, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent duplicate uploads
    if (uploadLockRef.current) return;

    const file = e.target.files?.[0];
    if (file) {
      uploadLockRef.current = true;

      const reader = new FileReader();
      reader.onload = async (event) => {
        let result = event.target?.result as string;

        // Compress on mobile for better performance
        if (isMobile()) {
          result = await compressImageForMobile(result, 512, 0.85);
        }

        // Store as pending and enable placement mode
        setPendingLayer({
          type: "image",
          imageUrl: result,
          name: file.name,
          scale: [0.35, 0.35, 1],
          rotation: [0, 0, 0]
        });
        setPlacementMode(true);
        uploadLockRef.current = false;
        toast.info("Click anywhere on the model to place the logo");
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = "";
  };

  // Handle selecting a predefined school logo
  const handleLogoSelect = (logo: Pattern) => {
    setSelectedLogoId(logo.id);

    // Enter placement mode with this logo
    setPendingLayer({
      type: "image",
      imageUrl: logo.thumbnail,
      name: logo.name,
      scale: [0.3, 0.3, 1],
      rotation: [0, 0, 0]
    });
    setPlacementMode(true);
    toast.info(`Click on the model to place "${logo.name}"`);
  };

  const logos = textureLayers.filter((l) => l.type === "image");

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Add Logo</h2>
        <p className="text-xs text-muted-foreground">
          Select a school logo or upload your own
        </p>
      </div>

      {isPlacementMode ? (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center animate-pulse">
          <p className="text-sm font-medium text-primary mb-1">Placement Mode Active</p>
          <p className="text-xs text-muted-foreground mb-2">Click on the model to place your logo</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlacementMode(false);
              setPendingLayer(null);
              setSelectedLogoId(null);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          {/* Upload custom logo button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 relative"
            asChild
          >
            <label className="cursor-pointer flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Custom Logo</span>
              <Input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
            </label>
          </Button>

          {/* School Logos Section */}
          {schoolLogos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  School Logos ({schoolLogos.length})
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search logos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {/* Logo grid */}
              <div className="max-h-[150px] overflow-y-auto rounded-lg border bg-muted/20 p-1.5">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {filteredLogos.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => handleLogoSelect(logo)}
                      className={cn(
                        "relative aspect-square rounded-lg border-2 overflow-hidden transition-all active:scale-95 bg-white",
                        selectedLogoId === logo.id
                          ? "border-primary ring-2 ring-primary"
                          : "border-transparent hover:border-primary/50"
                      )}
                      title={logo.name}
                    >
                      <img
                        src={logo.thumbnail}
                        alt={logo.name}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                      {selectedLogoId === logo.id && (
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {filteredLogos.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No logos found matching "{searchQuery}"
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Active logos with improved controls */}
      {logos.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            Active Logos ({logos.length}) - Tap to edit
          </span>
          <div className="max-h-[100px] overflow-y-auto space-y-1.5">
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
                  <span className="text-xs font-medium truncate flex-1">
                    {layer.name}
                  </span>
                </div>
                <LayerControls layerId={layer.id} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {logos.length === 0 && !isPlacementMode && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No logos added yet. Select or upload a logo to get started.
        </p>
      )}
    </div>
  );
}

