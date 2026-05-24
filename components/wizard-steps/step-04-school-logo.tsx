"use client";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Check,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import { trimImageContent } from "@/lib/texture-utils";
import { useRef, useState, useMemo } from "react";
import { getPatternsByCategory, type Pattern } from "@/lib/patterns";
import { cn } from "@/lib/utils";
import {
  getCenterFrontLogoPosition,
  resolveCenterFrontLogoPlacementFromImage,
} from "@/lib/logo-positioning";
import { WizardStepShell } from "@/components/wizard-step-layout";

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
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);
  const completeUVMask = useConfiguratorStore((state) => state.completeUVMask);
  const centerFrontUvAnchor = useConfiguratorStore(
    (state) => state.centerFrontUvAnchor,
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

        const trimmed = await trimImageContent(result);
        result = trimmed.dataUrl;

        const newId = uuidv4();
        const preset = await resolveCenterFrontLogoPlacementFromImage({
          modelUrl: currentModelUrl,
          imageUrl: result,
          uvMapUrl: completeUVMask || completeUVMap,
          centerFrontUvAnchor,
        });
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
          position: preset.position,
          rotation: preset.rotation,
          scale: preset.scale,
          flipX: false,
        });
        setSelectedTextureLayerId(newId);
        setPlacementMode(false);
        setPendingLayer(null);
        uploadLockRef.current = false;
        toast.success(
          "Logo added to the front. Use the controls below to move or resize it.",
        );
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = "";
  };

  // Handle selecting a predefined school logo
  const handleLogoSelect = async (logo: Pattern) => {
    // Immediately add to center chest instead of placement mode
    // This restores the "easier" workflow users preferred
    const newId = uuidv4();
    const trimmed = await trimImageContent(logo.thumbnail);
    const imageUrl = trimmed.dataUrl;
    const preset = await resolveCenterFrontLogoPlacementFromImage({
      modelUrl: currentModelUrl,
      imageUrl,
      uvMapUrl: completeUVMask || completeUVMap,
      centerFrontUvAnchor,
    });
    addTextureLayer({
      id: newId,
      name: logo.name,
      type: "image",
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      order: textureLayers.length,
      imageUrl,
      position: preset.position,
      rotation: preset.rotation,
      scale: preset.scale,
      flipX: false,
    });

    setSelectedTextureLayerId(newId);
    toast.success(`Added "${logo.name}" to model`);
  };

  const moveLogo = (layerId: string, deltaX: number, deltaY: number) => {
    const layer = textureLayers.find((item) => item.id === layerId);
    const [x, y, z] = layer?.position ?? [0.5, 0.35, 0];

    updateTextureLayer(layerId, {
      position: [
        Math.min(0.95, Math.max(0.05, x + deltaX)),
        Math.min(0.95, Math.max(0.05, y + deltaY)),
        z,
      ],
    });
  };

  const logos = textureLayers.filter((l) => l.type === "image");

  return (
    <WizardStepShell
      title="Add Logo"
      description="Choose or upload a logo. It will be added to the front automatically."
    >

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
              className="w-full h-10 md:h-11 border border-transparent hover:border-primary/20 transition-all font-medium text-xs shadow-sm bg-muted/50 hover:bg-muted"
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
            <p className="text-[9px] text-muted-foreground text-center mt-1 md:block hidden">
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
              <div className="max-h-[210px] min-h-[132px] overflow-y-auto pr-1 -mr-1 md:max-h-[44dvh] md:min-h-[160px] md:pr-1 md:-mr-1">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {filteredLogos.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => handleLogoSelect(logo)}
                      className={cn(
                        "group relative aspect-square rounded-md md:rounded-lg overflow-hidden border transition-all active:scale-95 bg-white shadow-sm min-h-10 min-w-10",
                        selectedLogoId === logo.id
                          ? "border-primary ring-2 ring-primary ring-offset-1"
                          : "border-border/40 hover:border-primary/50 hover:shadow-md",
                      )}
                      title={logo.name}
                    >
                      <div className="absolute inset-0 p-1 md:p-1.5 flex items-center justify-center">
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
          <div className="space-y-2 md:max-h-[140px] md:overflow-y-auto md:pr-1">
            {logos.map((layer) => (
              <div
                key={layer.id}
                className="p-2 rounded-lg md:p-2.5 md:rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-sm"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  {layer.imageUrl && (
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-muted/30 p-1 border flex-shrink-0">
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs md:text-sm font-medium truncate block">
                      {layer.name}
                    </span>
                    <span className="hidden md:block text-[10px] text-muted-foreground">
                      Use arrows to move. Use sliders for size and rotation.
                    </span>
                  </div>
                </div>
                <div className="mb-2 rounded-lg border bg-muted/20 p-2">
                  <div className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                    Move logo
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 md:h-11 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveLogo(layer.id, 0, -0.03);
                      }}
                      aria-label="Move logo up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <div />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 md:h-11 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveLogo(layer.id, -0.03, 0);
                      }}
                      aria-label="Move logo left"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 md:h-11 px-2 text-[10px]"
                      onClick={async (event) => {
                        event.stopPropagation();
                        const preset = layer.imageUrl
                          ? await resolveCenterFrontLogoPlacementFromImage({
                              modelUrl: currentModelUrl,
                              imageUrl: layer.imageUrl,
                              uvMapUrl: completeUVMask || completeUVMap,
                              centerFrontUvAnchor,
                            })
                          : getCenterFrontLogoPosition(currentModelUrl);
                        updateTextureLayer(layer.id, {
                          position: preset.position,
                          rotation: preset.rotation,
                          scale: preset.scale,
                        });
                      }}
                    >
                      Center
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 md:h-11 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveLogo(layer.id, 0.03, 0);
                      }}
                      aria-label="Move logo right"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 md:h-11 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveLogo(layer.id, 0, 0.03);
                      }}
                      aria-label="Move logo down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div />
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
    </WizardStepShell>
  );
}
