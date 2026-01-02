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
  const setPlacementMode = useConfiguratorStore(
    (state) => state.setPlacementMode,
  );
  const setPendingLayer = useConfiguratorStore(
    (state) => state.setPendingLayer,
  );
  const isPlacementMode = useConfiguratorStore(
    (state) => state.isPlacementMode,
  );
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
    if (!searchQuery.trim()) return schoolLogos; // Show ALL logos
    const q = searchQuery.toLowerCase();
    return schoolLogos.filter(
      (logo) =>
        logo.name.toLowerCase().includes(q) ||
        logo.description?.toLowerCase().includes(q),
    );
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
          rotation: [0, 0, 0],
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
    // Immediately add to center chest instead of placement mode
    // This restores the "easier" workflow users preferred
    const newId = uuidv4();
    addTextureLayer({
      id: newId,
      name: logo.name,
      type: "image",
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      order: textureLayers.length,
      imageUrl: logo.thumbnail,
      position: [0.5, 0.35, 0], // Center chest
      rotation: [0, 0, 0],
      scale: [0.3, 0.3, 1],
      flipX: false,
    });

    setSelectedTextureLayerId(newId);
    toast.success(`Added "${logo.name}" to model`);
  };

  const logos = textureLayers.filter((l) => l.type === "image");

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold">Add Logo</h2>
        <p className="text-xs text-muted-foreground">
          Choose a school logo or upload your own
        </p>
      </div>

      {isPlacementMode ? (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-3 animate-pulse">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Tap to Place</p>
            <p className="text-xs text-muted-foreground">
              Touch anywhere on the 3D model
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlacementMode(false);
              setPendingLayer(null);
              setSelectedLogoId(null);
            }}
            className="h-8 text-xs bg-background"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          {/* Upload custom logo button - Compact Card Style */}
          <div className="relative group">
            <Button
              variant="secondary"
              size="sm"
              className="w-full h-10 border border-transparent hover:border-primary/20 transition-all font-medium text-xs shadow-sm bg-muted/50 hover:bg-muted"
              asChild
            >
              <label className="cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Logo</span>
                <Input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
              </label>
            </Button>
            <p className="text-[9px] text-muted-foreground text-center mt-1">
              supports png, jpg, webp
            </p>
          </div>

          <div className="h-px bg-border/50" />

          {/* School Logos Section */}
          {schoolLogos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold">School Library</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {schoolLogos.length} logos
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs border-0 bg-muted/40 focus-visible:bg-background transition-colors rounded-lg focus-visible:ring-1"
                />
              </div>

              {/* Logo grid - Taller for better browsing */}
              <div className="max-h-[40vh] min-h-[150px] overflow-y-auto pr-1 -mr-1">
                <div className="grid grid-cols-4 xs:grid-cols-5 gap-2">
                  {filteredLogos.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => handleLogoSelect(logo)}
                      className={cn(
                        "group relative aspect-square rounded-lg overflow-hidden border transition-all active:scale-95 bg-white shadow-sm",
                        selectedLogoId === logo.id
                          ? "border-primary ring-2 ring-primary ring-offset-1"
                          : "border-border/40 hover:border-primary/50 hover:shadow-md",
                      )}
                      title={logo.name}
                    >
                      <div className="absolute inset-0 p-1.5 flex items-center justify-center">
                        <img
                          src={logo.thumbnail}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>

                      {selectedLogoId === logo.id && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center shadow-sm z-10">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {filteredLogos.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs">
                      No logos found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Active logos with improved controls */}
      {logos.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">
            Active Logos
          </span>
          <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
            {logos.map((layer) => (
              <div
                key={layer.id}
                className="p-2.5 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-sm"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {layer.imageUrl && (
                    <div className="w-10 h-10 rounded-lg bg-muted/30 p-1 border flex-shrink-0">
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate block">
                      {layer.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Tap to edit position
                    </span>
                  </div>
                </div>
                <LayerControls layerId={layer.id} compact sliderOnly />
              </div>
            ))}
          </div>
        </div>
      )}

      {logos.length === 0 && !isPlacementMode && (
        <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
          Select or upload a logo to get started.
        </p>
      )}
    </div>
  );
}
