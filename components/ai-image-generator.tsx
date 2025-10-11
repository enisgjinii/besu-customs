"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";

export function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ imageURL: string; imageUUID: string }>>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      setGeneratedImages(data.images);
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageURL: string, index: number) => {
    try {
      const response = await fetch(imageURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-generated-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-prompt" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Image Generator
        </Label>
        <Input
          id="ai-prompt"
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleGenerate();
            }
          }}
          disabled={loading}
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Image
          </>
        )}
      </Button>

      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <Label>Generated Images</Label>
          <div className="grid gap-3">
            {generatedImages.map((image, index) => (
              <div
                key={image.imageUUID}
                className="relative group rounded-lg overflow-hidden border bg-card"
              >
                <img
                  src={image.imageURL}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(image.imageURL, index)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
