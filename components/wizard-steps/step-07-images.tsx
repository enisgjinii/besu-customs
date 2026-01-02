"use client";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

        // Store as pending and enable placement mode
        setPendingLayer({
          type: "image",
          imageUrl: result,
          name: file.name,
          scale: [0.35, 0.35, 1],
          rotation: [0, 0, 0],
        });
        setPlacementMode(true);
        isUploadingRef.current = false;
        toast.info("Click anywhere on the model to place the image");
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = "";
  };

  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Upload Images</h2>
        <p className="text-sm text-muted-foreground">
          Personalize with your own logos and graphics
        </p>
      </div>

      {/* Upload Zone */}
      {isPlacementMode ? (
        <div className="p-6 bg-primary/5 border-2 border-primary/20 border-dashed rounded-xl text-center animate-pulse">
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
        <div className="space-y-4">
          <label className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/5 hover:bg-muted/10 rounded-xl transition-all cursor-pointer">
            <div className="bg-background p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Click to Upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG recommended
            </p>
            <Input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
          </label>

          {/* Smart Feature Card */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
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
            <Switch
              id="auto-bg-switch"
              checked={autoRemoveBg}
              onCheckedChange={setAutoRemoveBg}
            />
          </div>
        </div>
      )}

      {/* Layers List */}
      {layers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Your Uploads ({layers.length})
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="group relative flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedTextureLayerId(layer.id)}
              >
                <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
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
        </div>
      )}
    </div>
  );
}
