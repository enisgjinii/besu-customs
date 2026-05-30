"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Check,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Crosshair,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import { trimImageContent } from "@/lib/texture-utils";
import { useRef, useState, useMemo, useCallback } from "react";
import { getPatternsByCategory, type Pattern } from "@/lib/patterns";
import { cn } from "@/lib/utils";
import {
  getLogoPreset,
  resolveCenterFrontLogoPlacementFromImage,
  type LogoPlacementArea,
} from "@/lib/logo-positioning";
import {
  WizardEmptyState,
  WizardSection,
  WizardStepShell,
} from "@/components/wizard-step-layout";

type LogoTab = "browse" | "adjust";

const PLACEMENT_OPTIONS: {
  id: LogoPlacementArea;
  label: string;
  hint: string;
}[] = [
  { id: "centerFront", label: "Center chest", hint: "Main front logo" },
  { id: "leftChest", label: "Left chest", hint: "Classic school spot" },
  { id: "rightChest", label: "Right chest", hint: "Opposite side" },
  { id: "back", label: "Back", hint: "Upper back area" },
];

function GarmentPlacementPreview({
  placement,
  hasLogo,
}: {
  placement: LogoPlacementArea;
  hasLogo: boolean;
}) {
  const markerClass =
    "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-primary bg-primary/30 shadow-sm";

  const markerPositions: Record<LogoPlacementArea, string> = {
    centerFront: "left-1/2 top-[38%]",
    leftChest: "left-[62%] top-[38%]",
    rightChest: "left-[38%] top-[38%]",
    back: "left-1/2 top-[42%]",
    leftSleeve: "left-[78%] top-[52%]",
    rightSleeve: "left-[22%] top-[52%]",
  };

  return (
    <div className="relative mx-auto w-full max-w-[140px]">
      <div className="relative aspect-[3/4] rounded-t-[38%] rounded-b-xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-muted/50 to-muted/10">
        <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-foreground/10" />
        <div className="absolute inset-x-4 bottom-3 h-8 rounded-lg bg-foreground/5" />
        {hasLogo && (
          <span
            className={cn(markerClass, markerPositions[placement])}
            aria-hidden
          />
        )}
        {!hasLogo && (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-[8px] text-muted-foreground">
            Logo preview
          </div>
        )}
      </div>
      <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
        Front garment guide
      </p>
    </div>
  );
}

export function Step04SchoolLogo() {
  const addTextureLayer = useConfiguratorStore((state) => state.addTextureLayer);
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setPlacementMode = useConfiguratorStore((state) => state.setPlacementMode);
  const setPendingLayer = useConfiguratorStore((state) => state.setPendingLayer);
  const isPlacementMode = useConfiguratorStore((state) => state.isPlacementMode);
  const selectedTextureLayerId = useConfiguratorStore(
    (state) => state.selectedTextureLayerId,
  );
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );
  const removeTextureLayer = useConfiguratorStore(
    (state) => state.removeTextureLayer,
  );
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);
  const completeUVMask = useConfiguratorStore((state) => state.completeUVMask);
  const centerFrontUvAnchor = useConfiguratorStore(
    (state) => state.centerFrontUvAnchor,
  );

  const uploadLockRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LogoTab>("browse");
  const [activePlacement, setActivePlacement] =
    useState<LogoPlacementArea>("centerFront");
  const [isUploading, setIsUploading] = useState(false);

  const schoolLogos = useMemo(() => getPatternsByCategory("school-logos"), []);

  const filteredLogos = useMemo(() => {
    if (!searchQuery.trim()) return schoolLogos;
    const q = searchQuery.toLowerCase();
    return schoolLogos.filter(
      (logo) =>
        logo.name.toLowerCase().includes(q) ||
        logo.description?.toLowerCase().includes(q),
    );
  }, [schoolLogos, searchQuery]);

  const logos = useMemo(
    () => textureLayers.filter((layer) => layer.type === "image"),
    [textureLayers],
  );

  const selectedLayer = useMemo(
    () =>
      logos.find((layer) => layer.id === selectedTextureLayerId) ??
      logos[logos.length - 1] ??
      null,
    [logos, selectedTextureLayerId],
  );

  const addLogoLayer = useCallback(
    async (params: {
      name: string;
      imageUrl: string;
      placement?: LogoPlacementArea;
    }) => {
      const trimmed = await trimImageContent(params.imageUrl);
      const imageUrl = trimmed.dataUrl;
      const placement = params.placement ?? "centerFront";

      let preset =
        placement === "centerFront"
          ? await resolveCenterFrontLogoPlacementFromImage({
              modelUrl: currentModelUrl,
              imageUrl,
              uvMapUrl: completeUVMask || completeUVMap,
              centerFrontUvAnchor,
            })
          : getLogoPreset(currentModelUrl, placement);

      const newId = uuidv4();
      addTextureLayer({
        id: newId,
        name: params.name,
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
      setActivePlacement(placement);
      setActiveTab("adjust");
      setPlacementMode(false);
      setPendingLayer(null);

      return newId;
    },
    [
      addTextureLayer,
      centerFrontUvAnchor,
      completeUVMap,
      completeUVMask,
      currentModelUrl,
      setPendingLayer,
      setPlacementMode,
      setSelectedTextureLayerId,
      textureLayers.length,
    ],
  );

  const processUploadedFile = useCallback(
    async (file: File) => {
      if (uploadLockRef.current) return;
      uploadLockRef.current = true;
      setIsUploading(true);

      try {
        const result = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (typeof event.target?.result === "string") {
              resolve(event.target.result);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        let imageUrl = result;
        if (isMobile()) {
          imageUrl = await compressImageForMobile(result, 512, 0.85);
        }

        await addLogoLayer({ name: file.name, imageUrl });
        toast.success("Logo added to your design");
      } catch (error) {
        console.error("Logo upload failed", error);
        toast.error("Could not upload logo. Try a PNG or JPG under 5 MB.");
      } finally {
        uploadLockRef.current = false;
        setIsUploading(false);
      }
    },
    [addLogoLayer],
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
    e.target.value = "";
  };

  const handleLogoSelect = async (logo: Pattern) => {
    setSelectedLogoId(logo.id);
    const trimmed = await trimImageContent(logo.thumbnail);
    await addLogoLayer({
      name: logo.name,
      imageUrl: trimmed.dataUrl,
    });
    toast.success(`Added "${logo.name}"`);
  };

  const startTapToPlace = async (imageUrl: string, name: string) => {
    const trimmed = await trimImageContent(imageUrl);
    setPendingLayer({
      name,
      type: "image",
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      imageUrl: trimmed.dataUrl,
      scale: [0.25, 0.25, 1],
      rotation: [0, 0, 0],
      flipX: false,
    });
    setPlacementMode(true);
    toast.message("Tap the 3D model to place your logo");
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

  const applyPlacement = async (
    layerId: string,
    placement: LogoPlacementArea,
  ) => {
    const layer = textureLayers.find((item) => item.id === layerId);
    if (!layer?.imageUrl) return;

    setActivePlacement(placement);

    const preset =
      placement === "centerFront"
        ? await resolveCenterFrontLogoPlacementFromImage({
            modelUrl: currentModelUrl,
            imageUrl: layer.imageUrl,
            uvMapUrl: completeUVMask || completeUVMap,
            centerFrontUvAnchor,
          })
        : getLogoPreset(currentModelUrl, placement);

    updateTextureLayer(layerId, {
      position: preset.position,
      rotation: preset.rotation,
      scale: preset.scale,
    });

    toast.success(`Moved to ${PLACEMENT_OPTIONS.find((p) => p.id === placement)?.label ?? placement}`);
  };

  const handleRemoveLogo = (layerId: string) => {
    removeTextureLayer(layerId);
    if (logos.length <= 1) {
      setActiveTab("browse");
    }
    toast.success("Logo removed");
  };

  return (
    <WizardStepShell
      title="Logo"
      description="Pick from the library or upload your own. Adjust placement on the garment in the next tab."
      action={
        logos.length > 0 ? (
          <Badge variant="secondary" className="text-[10px]">
            {logos.length} on design
          </Badge>
        ) : null
      }
    >
      {isPlacementMode ? (
        <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crosshair className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Tap to place</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Touch anywhere on the 3D model to position your logo.
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
          >
            Cancel placement
          </Button>
        </div>
      ) : (
        <>
          {/* Preview strip */}
          <div className="overflow-hidden rounded-xl border bg-muted/15">
            <div className="grid grid-cols-2 gap-px bg-border">
              <div className="bg-background p-3">
                <p className="mb-2 text-[10px] font-medium text-muted-foreground">
                  Selected logo
                </p>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-3">
                  {selectedLayer?.imageUrl ? (
                    <img
                      src={selectedLayer.imageUrl}
                      alt={selectedLayer.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center text-[10px] text-muted-foreground">
                      <ImagePlus className="h-5 w-5 opacity-40" />
                      <span>No logo yet</span>
                    </div>
                  )}
                </div>
                {selectedLayer && (
                  <p className="mt-2 truncate text-center text-[10px] font-medium">
                    {selectedLayer.name}
                  </p>
                )}
              </div>
              <div className="bg-background p-3">
                <p className="mb-2 text-[10px] font-medium text-muted-foreground">
                  Placement
                </p>
                <GarmentPlacementPreview
                  placement={activePlacement}
                  hasLogo={!!selectedLayer}
                />
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as LogoTab)}
            className="gap-3"
          >
            <TabsList className="grid h-9 w-full grid-cols-2">
              <TabsTrigger value="browse" className="text-xs">
                1. Choose logo
              </TabsTrigger>
              <TabsTrigger
                value="adjust"
                className="text-xs"
                disabled={logos.length === 0}
              >
                2. Place &amp; adjust
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-0 space-y-4">
              {/* Upload zone */}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
                  isUploading
                    ? "border-muted bg-muted/30"
                    : "border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10",
                )}
              >
                {isUploading ? (
                  <>
                    <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                    <span className="text-sm font-medium">Processing upload…</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-105">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">Upload your logo</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        PNG, JPG, or WebP · tap to browse files
                      </p>
                    </div>
                  </>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </button>

              {schoolLogos.length > 0 && (
                <WizardSection
                  title="School library"
                  count={filteredLogos.length}
                  className="p-0 border-0 bg-transparent shadow-none"
                >
                  <div className="space-y-3 rounded-xl border bg-card p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search logos…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-xs"
                      />
                    </div>

                    <div className="max-h-[min(280px,40dvh)] overflow-y-auto pr-0.5">
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {filteredLogos.map((logo) => (
                          <button
                            key={logo.id}
                            type="button"
                            onClick={() => handleLogoSelect(logo)}
                            className={cn(
                              "group flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all active:scale-[0.98]",
                              selectedLogoId === logo.id
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/60 hover:border-primary/40",
                            )}
                          >
                            <div className="relative aspect-square p-2">
                              <img
                                src={logo.thumbnail}
                                alt={logo.name}
                                className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                                loading="lazy"
                              />
                              {selectedLogoId === logo.id && (
                                <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="border-t bg-muted/20 px-2 py-1.5">
                              <p className="truncate text-[10px] font-medium leading-tight">
                                {logo.name}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {filteredLogos.length === 0 && (
                        <WizardEmptyState
                          title="No logos found"
                          description={`Nothing matched "${searchQuery}". Try a different search.`}
                        />
                      )}
                    </div>
                  </div>
                </WizardSection>
              )}
            </TabsContent>

            <TabsContent value="adjust" className="mt-0 space-y-4">
              {logos.length === 0 ? (
                <WizardEmptyState
                  title="No logos yet"
                  description="Choose or upload a logo first, then fine-tune placement here."
                />
              ) : (
                <>
                  {/* Layer picker */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Your logos</Label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {logos.map((layer) => (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => setSelectedTextureLayerId(layer.id)}
                          className={cn(
                            "flex shrink-0 items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors",
                            selectedLayer?.id === layer.id
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/30",
                          )}
                        >
                          {layer.imageUrl && (
                            <div className="h-8 w-8 overflow-hidden rounded-md border bg-white p-0.5">
                              <img
                                src={layer.imageUrl}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            </div>
                          )}
                          <span className="max-w-[88px] truncate text-[10px] font-medium">
                            {layer.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedLayer && (
                    <>
                      {/* Quick placement */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Quick placement</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Snap the selected logo to a common spot on the garment.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {PLACEMENT_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                applyPlacement(selectedLayer.id, option.id)
                              }
                              className={cn(
                                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                                activePlacement === option.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                              )}
                            >
                              <p className="text-[11px] font-medium">{option.label}</p>
                              <p className="mt-0.5 text-[9px] text-muted-foreground">
                                {option.hint}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fine movement */}
                      <div className="rounded-xl border bg-muted/15 p-3">
                        <p className="mb-2 text-xs font-medium">Fine-tune position</p>
                        <div className="mx-auto grid max-w-[180px] grid-cols-3 gap-1">
                          <div />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-full"
                            onClick={() => moveLogo(selectedLayer.id, 0, -0.03)}
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <div />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-full"
                            onClick={() => moveLogo(selectedLayer.id, -0.03, 0)}
                            aria-label="Move left"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-1 text-[9px]"
                            onClick={() =>
                              applyPlacement(selectedLayer.id, "centerFront")
                            }
                          >
                            Center
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-full"
                            onClick={() => moveLogo(selectedLayer.id, 0.03, 0)}
                            aria-label="Move right"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <div />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-full"
                            onClick={() => moveLogo(selectedLayer.id, 0, 0.03)}
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <div />
                        </div>
                      </div>

                      {/* Size / rotation */}
                      <div className="rounded-xl border bg-card p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                          <Layers className="h-3.5 w-3.5" />
                          Size &amp; rotation
                        </div>
                        <LayerControls layerId={selectedLayer.id} compact sliderOnly />
                      </div>

                      {/* Extra actions */}
                      <div className="grid grid-cols-2 gap-2">
                        {selectedLayer.imageUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 text-xs"
                            onClick={() =>
                              startTapToPlace(
                                selectedLayer.imageUrl!,
                                selectedLayer.name,
                              )
                            }
                          >
                            <Crosshair className="mr-1.5 h-3.5 w-3.5" />
                            Tap to place
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleRemoveLogo(selectedLayer.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Remove logo
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </WizardStepShell>
  );
}
