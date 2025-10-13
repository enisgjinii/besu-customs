"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Download, Paintbrush } from "lucide-react";
import { toast } from "sonner";
import { useConfiguratorStore } from "@/lib/store";

export function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ imageURL: string; imageUUID: string }>>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [usage, setUsage] = useState<{ limit: number; used: number; remaining: number } | null>(null);
  
  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);

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
      if (data.usage) {
        setUsage(data.usage);
      }
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
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleApplyToModel = async (imageURL: string) => {
    if (!selectedSection) {
      toast.error("Please select a material section first");
      return;
    }

    try {
      // Convert image URL to base64
      const response = await fetch(imageURL);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        updateSection(selectedSection, { customTexture: base64data });
        toast.success("Texture applied to model!");
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error applying texture:", error);
      toast.error("Failed to apply texture");
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

      {/* Usage Information */}
      {usage && (
        <div className="text-xs text-muted-foreground bg-secondary/20 p-2 rounded-md">
          API Usage: {usage.used}/{usage.limit} calls used ({usage.remaining} remaining)
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim() || (usage?.remaining === 0)}
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
          
          {/* Material Section Selector */}
          <div className="space-y-2">
            <Label htmlFor="material-section" className="text-xs">
              Apply to Material Section
            </Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger id="material-section">
                <SelectValue placeholder="Select a section..." />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            {generatedImages.map((image, index) => (
              <div
                key={image.imageUUID}
                className="relative group rounded-lg overflow-hidden border bg-card"
              >
                <Image
                  src={image.imageURL}
                  alt={`Generated ${index + 1}`}
                  width={512}
                  height={512}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleApplyToModel(image.imageURL)}
                    disabled={!selectedSection}
                  >
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
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
