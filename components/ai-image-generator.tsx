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
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Sparkles,
  Download,
  Paintbrush,
  Key,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useConfiguratorStore } from "@/lib/store";

export function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    Array<{ imageURL: string; imageUUID: string }>
  >([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [usage, setUsage] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null);
  const [userApiMode, setUserApiMode] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");

  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (userApiMode && !userApiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (userApiMode && userApiKey.trim()) {
        headers["x-user-api-key"] = userApiKey.trim();
      }

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

      setGeneratedImages(data.images);
      if (data.usage) {
        setUsage(data.usage);
      } else {
        setUsage(null);
      }
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate image",
      );
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
    <div className="space-y-4" data-tour="ai-generator">
      <div className="space-y-2">
        <Label htmlFor="ai-prompt" className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          Describe the image you want to generate...
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
          data-tour="ai-prompt"
          className="text-sm"
        />
      </div>

      {/* User API Mode Toggle */}
      <div className="flex items-center justify-between p-2 border rounded-lg bg-card">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4" />
          <Label htmlFor="user-api-mode" className="text-xs font-medium">
            Use My API Key
          </Label>
        </div>
        <Switch
          id="user-api-mode"
          checked={userApiMode}
          onCheckedChange={setUserApiMode}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* User API Key Input */}
      {userApiMode && (
        <div className="space-y-2">
          <Label
            htmlFor="user-api-key"
            className="flex items-center gap-2 text-xs"
          >
            <Key className="w-3 h-3" />
            Enter your Runware API key...
          </Label>
          <Input
            id="user-api-key"
            type="password"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
            disabled={loading}
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            Your API key will be used for image generation (3 uses per day)
          </p>
        </div>
      )}

      {/* Usage Information */}
      {usage && (
        <div
          className={`text-[10px] p-2 rounded-md ${
            usage.remaining === 0
              ? "text-destructive bg-destructive/10 border border-destructive/20"
              : "text-muted-foreground bg-secondary/20"
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            {usage.remaining === 0 ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span className="font-medium">
              {userApiMode ? "Your API Usage" : "System API Usage"}
            </span>
          </div>
          <div>
            {usage.used}/{usage.limit} calls used ({usage.remaining} remaining)
          </div>
          {usage.remaining === 0 && (
            <div className="text-[10px] text-destructive mt-1">
              Limit reached! Switch to system API or wait until tomorrow.
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={
          loading ||
          !prompt.trim() ||
          (userApiMode && !userApiKey.trim()) ||
          (usage?.remaining === 0 && userApiMode)
        }
        className="w-full text-xs h-8"
        data-tour="ai-generate"
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

      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm">Generated Images</Label>

          {/* Material Section Selector */}
          <div className="space-y-2">
            <Label htmlFor="material-section" className="text-xs">
              Apply to Material Section
            </Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger id="material-section" className="text-xs h-8">
                <SelectValue placeholder="Select a section..." />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem
                    key={section.id}
                    value={section.id}
                    className="text-xs"
                  >
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            {generatedImages.map((image, index) => (
              <div
                key={image.imageUUID}
                className="relative group rounded-md overflow-hidden border bg-card"
              >
                <Image
                  src={image.imageURL}
                  alt={`Generated ${index + 1}`}
                  width={512}
                  height={512}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleApplyToModel(image.imageURL)}
                    disabled={!selectedSection}
                    className="text-xs h-7 px-2"
                  >
                    <Paintbrush className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(image.imageURL, index)}
                    className="text-xs h-7 px-2"
                  >
                    <Download className="w-3 h-3 mr-1" />
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
