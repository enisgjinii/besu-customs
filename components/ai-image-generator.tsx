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
} from "lucide-react";
import { toast } from "sonner";
import { useConfiguratorStore } from "@/lib/store";
import { removeBackgroundAdvanced } from "@/lib/background-removal";

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

  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);
    setPreviewMode(false);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          width: 512,
          height: 512,
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
        toast.success("Image generated! Review and apply when ready.");
      }

      if (data.usage) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate image",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApplyImage = async () => {
    if (!generatedImage) return;

    const toastId = toast.loading("AI removing background... 0%");

    // Apply AI background removal to make the image blend better with garments
    let processedUrl = generatedImage.imageURL;
    try {
      // Fetch the image and convert to blob for processing
      const response = await fetch(generatedImage.imageURL);
      const blob = await response.blob();

      // Use advanced AI background removal
      const result = await removeBackgroundAdvanced(blob, {
        quality: "balanced",
        onProgress: (progress) => {
          toast.loading(`AI removing background... ${progress}%`, { id: toastId });
        },
      });
      processedUrl = result.dataUrl;
      console.log(`✅ Background removed from AI image in ${(result.processingTime / 1000).toFixed(1)}s`);
      toast.success(`Background removed!`, { id: toastId });
    } catch (error) {
      console.warn("Background removal failed, using original image:", error);
      const errorMessage = error instanceof Error ? error.message : "Background removal failed";
      toast.error(errorMessage.includes("timed out")
        ? "Timed out. Try again on WiFi."
        : "Background removal failed, using original",
        { id: toastId }
      );
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

            {/* Prompt Examples */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "Futuristic orange and black cobra pattern",
                "Minimalist geometric lines",
                "Flame gradient effects",
                "Abstract wave design",
                "Lightning bolt pattern",
                "Galaxy space theme"
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
