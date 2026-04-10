"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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
        ` Background removed from AI image in ${(result.processingTime / 1000).toFixed(1)}s`,
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
      console.log(" Image upscaled to 2048px for 3D model");
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
      " AI Image Generator: Dispatching generated-image-available event",
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
      {!previewMode && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ai-prompt" className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Describe the graphic
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder="Example: fierce panther head with chrome outlines and electric blue highlights."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loading) {
                  handleGenerate();
                }
              }}
              disabled={loading}
              className="min-h-[92px] resize-none text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Creates a single graphic you can preview, resize, rotate, and then
              place on the garment.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                "Mascot emblem with bold outlines",
                "Minimal chest badge with stitched look",
                "Lightning bolt symbol with metallic edges",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label
                  htmlFor="design-player-info-toggle"
                  className="flex items-center gap-2 text-xs font-medium"
                >
                  <User className="h-3.5 w-3.5" />
                  Add player name and number
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Optional. Useful when the graphic should already include player
                  personalization.
                </p>
              </div>
              <Switch
                id="design-player-info-toggle"
                checked={includePlayerInfo}
                onCheckedChange={setIncludePlayerInfo}
                disabled={loading}
                className="scale-75 origin-right"
              />
            </div>

            {includePlayerInfo && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="design-player-name"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    <User className="h-3 w-3" />
                    Player Name
                  </Label>
                  <Input
                    id="design-player-name"
                    placeholder="SMITH"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    disabled={loading}
                    className="h-8 uppercase text-xs"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="design-jersey-number"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    <Hash className="h-3 w-3" />
                    Number
                  </Label>
                  <Input
                    id="design-jersey-number"
                    placeholder="23"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    disabled={loading}
                    className="h-8 text-xs"
                    maxLength={3}
                  />
                </div>
              </div>
            )}
          </div>

          {usage && (
            <div
              className={`rounded-lg border px-3 py-2 text-[10px] ${
                usage.remaining === 0
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1">
                {usage.remaining === 0 ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>
                  {usage.used}/{usage.limit} used ({usage.remaining} left)
                </span>
              </div>
            </div>
          )}

          {generationWarning && (
            <div className="space-y-1 rounded-lg border border-destructive/25 bg-destructive/10 p-3">
              <p className="text-[10px] leading-tight text-destructive">
                AI is not okay right now. Please try again.
              </p>
              <p className="text-[10px] leading-tight text-destructive/90">
                {generationWarning}
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="h-10 w-full text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate graphic
              </>
            )}
          </Button>
        </>
      )}

      {previewMode && generatedImage && (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
          <div>
            <p className="text-xs font-medium">Preview</p>
            <p className="text-[10px] text-muted-foreground">
              Adjust the graphic before placing it on the garment.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card">
            <div
              className="flex aspect-square w-full items-center justify-center bg-muted/20 p-4"
              style={{ minHeight: "150px" }}
            >
              <Image
                src={generatedImage.imageURL}
                alt="Generated AI Image"
                width={256}
                height={256}
                className="max-h-[200px] object-contain"
                style={{
                  transform: `scale(${imageScale / 100}) rotate(${imageRotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Size</span>
              <Slider
                value={[imageScale]}
                min={25}
                max={200}
                step={5}
                onValueChange={([val]) => setImageScale(val)}
                className="flex-1"
              />
              <span className="w-10 text-right text-[10px] text-muted-foreground">
                {imageScale}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RotateCw className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Rotate</span>
              <Slider
                value={[imageRotation]}
                min={0}
                max={360}
                step={15}
                onValueChange={([val]) => setImageRotation(val)}
                className="flex-1"
              />
              <span className="w-10 text-right text-[10px] text-muted-foreground">
                {imageRotation}°
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              className="h-8 flex-1 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="h-8 flex-1 text-xs"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Regenerate
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 flex-1 text-xs"
            >
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={handleApplyImage}
              className="h-8 flex-1 text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              Apply graphic
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
