"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  Sparkles,
  Download,
  Check,
  X,
  RotateCw,
  ZoomIn,
  AlertCircle,
  User,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { useConfiguratorStore } from "@/lib/store";
import { removeBackgroundAdvanced } from "@/lib/background-removal";
import { Switch } from "@/components/ui/switch";

/**
 * Client-side image upscaling using canvas with high-quality bicubic interpolation.
 * Upscales the image to targetSize x targetSize for crisp 3D texture mapping.
 */
function upscaleImage(dataUrl: string, targetSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Use two-pass upscaling for better quality (avoids aliasing)
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;

        // If already at target size or larger, skip
        if (srcW >= targetSize && srcH >= targetSize) {
          resolve(dataUrl);
          return;
        }

        // Two-pass upscale: first to 2x, then to target (reduces artifacts)
        const midSize = Math.min(targetSize, Math.max(srcW, srcH) * 2);
        
        // Pass 1: intermediate upscale
        const mid = document.createElement("canvas");
        mid.width = midSize;
        mid.height = midSize;
        const midCtx = mid.getContext("2d");
        if (!midCtx) { resolve(dataUrl); return; }
        midCtx.imageSmoothingEnabled = true;
        midCtx.imageSmoothingQuality = "high";
        midCtx.drawImage(img, 0, 0, midSize, midSize);

        // Pass 2: final size
        const final = document.createElement("canvas");
        final.width = targetSize;
        final.height = targetSize;
        const finalCtx = final.getContext("2d");
        if (!finalCtx) { resolve(dataUrl); return; }
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = "high";
        finalCtx.drawImage(mid, 0, 0, targetSize, targetSize);

        resolve(final.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for upscaling"));
    img.src = dataUrl;
  });
}

export function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    imageURL: string;
    imageUUID: string;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [imageScale, setImageScale] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [usage, setUsage] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null);
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);

  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);

  // Player info for jersey design
  const [includePlayerInfo, setIncludePlayerInfo] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);
    setPreviewMode(false);
    setGenerationWarning(null);

    const cleanName = playerName.trim().toUpperCase();
    const cleanNumber = jerseyNumber.trim().replace(/\D/g, "").slice(0, 3);
    const wantsPersonalization =
      includePlayerInfo && (cleanName.length > 0 || cleanNumber.length > 0);

    const promptWithGuards = (() => {
      let finalPrompt = prompt.trim();

      // Add quality boosters for consistent high-quality output
      const qualityPrefix =
        "Ultra high quality, professional sports jersey texture design, seamless pattern, 8K detail, sharp edges, vibrant colors, production-ready sublimation print, ";

      finalPrompt = qualityPrefix + finalPrompt;

      if (wantsPersonalization) {
        if (cleanName) {
          finalPrompt += `, featuring player name "${cleanName}" on the back`;
        }
        if (cleanNumber) {
          finalPrompt += `, with jersey number "${cleanNumber}" centered on the back`;
        }
        finalPrompt +=
          ", no extra text or numbers anywhere else, clean professional layout";
      } else {
        finalPrompt +=
          ", no names, numbers, letters, or text anywhere on the design, no watermarks, no logos, clean professional design";
      }

      // Add negative guidance as part of the prompt
      finalPrompt +=
        ". Avoid: blurry, low quality, distorted, jpeg artifacts, pixelated, noisy";

      return finalPrompt;
    })();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: promptWithGuards,
          width: 1024,
          height: 1024,
          numberResults: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.images && data.images.length > 0) {
        // Only store ONE image, show preview mode
        setGeneratedImage(data.images[0]);
        setPreviewMode(true);
        setImageScale(100);
        setImageRotation(0);
        setGenerationWarning(null);
        toast.success("Image generated! Review and apply when ready.");
      }

      if (data.usage) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Error:", error);
      const warningMessage =
        error instanceof Error ? error.message : "AI output not okay. Please try again.";
      setGenerationWarning(warningMessage);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate image",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyImage = async () => {
    if (!generatedImage) return;

    const toastId = toast.loading("Processing AI image... 0%");

    // Apply AI background removal to make the image blend better with garments
    let processedUrl = generatedImage.imageURL;
    try {
      // Fetch the image and convert to blob for processing
      const response = await fetch(generatedImage.imageURL);
      const blob = await response.blob();

      toast.loading("AI removing background... 10%", { id: toastId });

      // Use @imgly/background-removal with ultra quality for complete removal
      const result = await removeBackgroundAdvanced(blob, {
        quality: "ultra",
        onProgress: (progress) => {
          toast.loading(`AI removing background... ${Math.round(progress * 0.7 + 10)}%`, {
            id: toastId,
          });
        },
      });
      processedUrl = result.dataUrl;
      console.log(
        `✅ Background removed from AI image in ${(result.processingTime / 1000).toFixed(1)}s`,
      );
    } catch (error) {
      console.warn("Background removal failed, using original image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Background removal failed";
      toast.error(
        errorMessage.includes("timed out")
          ? "Timed out. Try again on WiFi."
          : "Background removal failed, using original",
        { id: toastId },
      );
    }

    // Upscale image to 2048x2048 for crisp texture mapping on 3D model
    toast.loading("Upscaling for 3D quality... 85%", { id: toastId });
    try {
      processedUrl = await upscaleImage(processedUrl, 2048);
      console.log("✅ Image upscaled to 2048px for 3D model");
    } catch (err) {
      console.warn("Upscale failed, using current resolution:", err);
    }

    // Dispatch event for other components to pick up
    const storageData = {
      url: processedUrl,
      timestamp: Date.now(),
      scale: imageScale / 100,
      rotation: imageRotation,
    };

    localStorage.setItem(
      "latest_generated_ai_image",
      JSON.stringify(storageData),
    );

    console.log(
      "🎨 AI Image Generator: Dispatching generated-image-available event",
      storageData,
    );
    window.dispatchEvent(
      new CustomEvent("generated-image-available", {
        detail: storageData,
      }),
    );

    toast.success("AI Image applied with background removed!", { id: toastId });
    setPreviewMode(false);
    setGeneratedImage(null);
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setPreviewMode(false);
    handleGenerate();
  };

  const handleDiscard = () => {
    setGeneratedImage(null);
    setPreviewMode(false);
    toast.info("Image discarded");
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage.imageURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="space-y-3" data-tour="ai-generator">
      {/* Prompt Input */}
      {!previewMode && (
        <>
          <div className="space-y-1.5">
            <Label
              htmlFor="ai-prompt"
              className="flex items-center gap-2 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Describe your design
            </Label>
            <Input
              id="ai-prompt"
              placeholder="A futuristic sports jersey design..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleGenerate();
                }
              }}
              disabled={loading}
              className="text-sm h-9"
            />

            <details className="pt-1 group">
              <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground select-none list-none flex items-center justify-between">
                <span>Prompt Examples</span>
                <span className="opacity-60 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {[
                  "Electric blue and black carbon fiber racing stripes",
                  "Bold red and gold geometric panels with metallic accents",
                  "Neon green cyber circuit pattern on dark background",
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="px-2 py-0.5 text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground rounded-full border border-transparent hover:border-primary/30 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Player Info for Jersey Design */}
          <div className="space-y-3 p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <Label htmlFor="design-player-info-toggle" className="text-sm font-medium">
                  Include Name & Number
                </Label>
              </div>
              <Switch
                id="design-player-info-toggle"
                checked={includePlayerInfo}
                onCheckedChange={setIncludePlayerInfo}
                disabled={loading}
              />
            </div>

            {includePlayerInfo && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="design-player-name" className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Player Name
                  </Label>
                  <Input
                    id="design-player-name"
                    placeholder="SMITH"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    disabled={loading}
                    className="h-9 uppercase"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="design-jersey-number" className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Number
                  </Label>
                  <Input
                    id="design-jersey-number"
                    placeholder="23"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    disabled={loading}
                    className="h-9"
                    maxLength={3}
                  />
                </div>
                <p className="col-span-2 text-[10px] text-muted-foreground">
                  AI will include name/number in the generated design.
                </p>
              </div>
            )}
          </div>

          {/* Usage Information */}
          {usage && (
            <div
              className={`text-[10px] p-2 rounded-md ${usage.remaining === 0
                ? "text-destructive bg-destructive/10 border border-destructive/20"
                : "text-muted-foreground bg-secondary/20"
                }`}
            >
              <div className="flex items-center gap-1">
                {usage.remaining === 0 ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>
                  {usage.used}/{usage.limit} used ({usage.remaining} left)
                </span>
              </div>
            </div>
          )}

          {generationWarning && (
            <div className="p-2 rounded-md border border-destructive/25 bg-destructive/10 space-y-1">
              <p className="text-[10px] text-destructive text-center leading-tight">
                AI is not okay right now. Please try again.
              </p>
              <p className="text-[9px] text-destructive/90 text-center leading-tight">
                {generationWarning}
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full text-xs h-9"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </>
      )}

      {/* Preview Mode - Single Image with Controls */}
      {previewMode && generatedImage && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-center">
            Preview - Adjust size & rotation before applying
          </div>

          {/* Image Preview */}
          <div className="relative rounded-lg overflow-hidden border bg-card">
            <div
              className="aspect-square w-full flex items-center justify-center bg-muted/20 p-4"
              style={{ minHeight: "150px" }}
            >
              <Image
                src={generatedImage.imageURL}
                alt="Generated AI Image"
                width={256}
                height={256}
                className="object-contain max-h-[200px]"
                style={{
                  transform: `scale(${imageScale / 100}) rotate(${imageRotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
              />
            </div>
          </div>

          {/* Size Control */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Size</span>
              <Slider
                value={[imageScale]}
                min={25}
                max={200}
                step={5}
                onValueChange={([val]) => setImageScale(val)}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-10 text-right">
                {imageScale}%
              </span>
            </div>
          </div>

          {/* Rotation Control */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Rotate</span>
              <Slider
                value={[imageRotation]}
                min={0}
                max={360}
                step={15}
                onValueChange={([val]) => setImageRotation(val)}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground w-10 text-right">
                {imageRotation}°
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              className="flex-1 h-8 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Discard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="flex-1 h-8 text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1 h-8 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={handleApplyImage}
              className="flex-1 h-8 text-xs bg-primary"
            >
              <Check className="w-3 h-3 mr-1" />
              Apply to Design
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
