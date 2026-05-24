"use client";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PillToggle } from "@/components/ui/pill-toggle";
import { Upload, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import {
  removeBackgroundAdvanced,
  removeBackgroundFast,
} from "@/lib/background-removal";
import { useRef, useState } from "react";
import { resolveCenterFrontLogoPlacementFromImage } from "@/lib/logo-positioning";
import { trimImageContent } from "@/lib/texture-utils";
import { WizardStepShell, WizardSection } from "@/components/wizard-step-layout";

export function Step07Images() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );
  const updateTextureLayer = useConfiguratorStore(
    (state) => state.updateTextureLayer,
  );

  const setPlacementMode = useConfiguratorStore(
    (state) => state.setPlacementMode,
  );
  const setPendingLayer = useConfiguratorStore(
    (state) => state.setPendingLayer,
  );
  const isPlacementMode = useConfiguratorStore(
    (state) => state.isPlacementMode,
  );

  // Track if upload is in progress to prevent duplicate uploads
  const isUploadingRef = useRef(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Track pending upload
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    result: string;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent duplicate uploads
    if (isUploadingRef.current) return;

    const file = e.target.files?.[0];
    if (file) {
      isUploadingRef.current = true;

      const reader = new FileReader();
      reader.onload = async (event) => {
        let result = event.target?.result as string;

        // Auto remove background if enabled using AI
        if (autoRemoveBg) {
          setIsProcessing(true);
          setBgRemovalProgress(0);
          const toastId = toast.loading("AI removing background... 0%");
          try {
            // Use fast model (smallest) on mobile for faster download
            const removalResult = await removeBackgroundAdvanced(result, {
              quality: isMobile() ? "fast" : "balanced",
              onProgress: (progress) => {
                setBgRemovalProgress(progress);
                toast.loading(`AI removing background... ${progress}%`, {
                  id: toastId,
                });
              },
            });
            result = removalResult.dataUrl;
            toast.success(
              `Background removed in ${(removalResult.processingTime / 1000).toFixed(1)}s`,
              { id: toastId },
            );
          } catch (error) {
            console.error("Background removal failed:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Background removal failed";
            toast.error(
              errorMessage.includes("timed out")
                ? "Timed out. Try again on WiFi."
                : "Background removal failed, using original image",
              { id: toastId },
            );
          } finally {
            setIsProcessing(false);
            setBgRemovalProgress(0);
          }
        }

        if (isMobile()) {
          result = await compressImageForMobile(result, 1024, 0.85);
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
          type: "image",
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal",
          order: textureLayers.length,
          imageUrl: result,
          name: file.name,
          position: preset.position,
          scale: preset.scale,
          rotation: preset.rotation,
          flipX: false,
        });
        setSelectedTextureLayerId(newId);
        setPlacementMode(false);
        setPendingLayer(null);
        isUploadingRef.current = false;
        toast.success(
          "Image added to the center front. Use the controls below to adjust it.",
        );
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = "";
  };

  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);
  const completeUVMask = useConfiguratorStore((state) => state.completeUVMask);
  const centerFrontUvAnchor = useConfiguratorStore(
    (state) => state.centerFrontUvAnchor,
  );

  // Function to manually remove background from existing layer using AI
  const handleRemoveBackground = async (layerId: string) => {
    const layer = textureLayers.find((l) => l.id === layerId);
    if (layer?.imageUrl) {
      setIsProcessing(true);
      setBgRemovalProgress(0);
      const toastId = toast.loading("AI removing background... 0%");
      try {
        const removalResult = await removeBackgroundAdvanced(layer.imageUrl, {
          quality: isMobile() ? "fast" : "balanced",
          onProgress: (progress) => {
            setBgRemovalProgress(progress);
            toast.loading(`AI removing background... ${progress}%`, {
              id: toastId,
            });
          },
        });
        updateTextureLayer(layerId, { imageUrl: removalResult.dataUrl });
        toast.success(
          `Background removed in ${(removalResult.processingTime / 1000).toFixed(1)}s`,
          { id: toastId },
        );
      } catch (error) {
        console.error("Background removal failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Background removal failed";
        toast.error(
          errorMessage.includes("timed out")
            ? "Timed out. Try again on WiFi."
            : "Background removal failed",
          { id: toastId },
        );
      } finally {
        setIsProcessing(false);
        setBgRemovalProgress(0);
      }
    }
  };

  // Filter to only show non-text, non-AI images
  const layers = textureLayers.filter(
    (l) =>
      l.type === "image" &&
      !l.name.startsWith("Text:") &&
      !l.name.startsWith("AI"),
  );

  return (
    <WizardStepShell
      title="Upload Images"
      description="Personalize with your own logos and graphics."
    >

      {/* Upload Zone */}
      {isPlacementMode ? (
        <div className="p-3 md:p-6 bg-primary/5 border border-primary/20 border-dashed rounded-lg text-center animate-pulse">
          <Wand2 className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-base font-medium text-primary mb-1">
            Placement Mode Active
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Tap anywhere on the 3D model to place your image
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setPlacementMode(false);
              setPendingLayer(null);
            }}
            className="w-full sm:w-auto"
          >
            Cancel Placement
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="group relative flex items-center gap-3 p-3 border border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/5 hover:bg-muted/10 rounded-lg transition-all cursor-pointer">
            <div className="bg-background p-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">Upload file</p>
              <p className="text-xs text-muted-foreground">PNG, JPG recommended</p>
            </div>
            <Input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
          </label>

          {/* Smart Feature Card */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="bg-white dark:bg-indigo-950 p-2 rounded-lg shadow-sm mt-0.5">
                <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="auto-bg-switch"
                  className="text-sm font-semibold cursor-pointer"
                >
                  Magic Removal
                </Label>
                <span className="text-xs text-muted-foreground">
                  Optional: Remove background with AI
                </span>
              </div>
            </div>
          <PillToggle
            checked={autoRemoveBg}
            onCheckedChange={setAutoRemoveBg}
          />
          </div>
        </div>
      )}

      {/* Layers List */}
      {layers.length > 0 && (
        <WizardSection title="Your Uploads" count={layers.length}>
          <div className="grid gap-2 md:grid-cols-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="group relative flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                  {layer.imageUrl ? (
                    <img
                      src={layer.imageUrl}
                      alt={layer.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1">
                    {layer.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 px-2 text-[10px] bg-secondary/50 hover:bg-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBackground(layer.id);
                      }}
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      Clean BG
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <LayerControls layerId={layer.id} compact sliderOnly />
                </div>
              </div>
            ))}
          </div>
        </WizardSection>
      )}
    </WizardStepShell>
  );
}
