"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  Download,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { aiService, type AIImageProvider } from "@/lib/ai-service";

type AIGenerationParams = {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  num_images: number;
  style_preset?: string;
  seed?: number;
};

type AIGenerationResult = {
  id: string;
  url: string;
  model: string;
  provider: AIImageProvider;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function AIImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<AIImageProvider>("openrouter");
  const [generationParams, setGenerationParams] = useState<AIGenerationParams>({
    prompt: "",
    negative_prompt: "",
    width: 1024,
    height: 1024,
    num_images: 1,
  });
  const [generatedImages, setGeneratedImages] = useState<AIGenerationResult[]>(
    [],
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!generationParams.prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    setIsGenerating(true);

    try {
      // Mock generation if no API key
      if (!apiKey) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
        const mockImage: AIGenerationResult = {
          id: `mock-${Date.now()}`,
          url: "https://picsum.photos/1024/1024", // Placeholder image
          model: "mock-model",
          provider: "openrouter",
          metadata: {
            prompt: generationParams.prompt,
            negative_prompt: generationParams.negative_prompt,
          },
          created_at: new Date().toISOString(),
        };
        setGeneratedImages((prev) => [mockImage, ...prev]);
        setSelectedImage(mockImage.id);
        toast.success("Mock image generated (No API Key provided)");
      } else {
        aiService.initialize(apiKey, provider);

        const result = await aiService.generateImage({
          ...generationParams,
        });

        setGeneratedImages((prev) => [result, ...prev]);
        setSelectedImage(result.id);
      }
    } catch (error) {
      console.error("Generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ai-generated-${prompt.substring(0, 20).toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      const newImage = {
        id: `uploaded-${Date.now()}`,
        url: imageUrl,
        model: "uploaded",
        provider: "upload" as AIImageProvider,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setGeneratedImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage.id);
    };
    reader.readAsDataURL(file);
  };

  const handleUseFor3D = (imageUrl: string) => {
    // TODO: Implement 3D model application logic
    console.log("Applying image to 3D model:", imageUrl);
    // This would typically involve:
    // 1. Sending the image to your 3D model processing endpoint
    // 2. Updating the 3D preview with the new texture
  };

  const selectedImageData = generatedImages.find(
    (img) => img.id === selectedImage,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Image Generator</CardTitle>
            <CardDescription>
              Generate custom images using AI and apply them to your 3D models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Select
                  value={provider}
                  onValueChange={(value: AIImageProvider) => setProvider(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="dalle">DALL-E</SelectItem>
                    <SelectItem value="flux">Flux</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="A beautiful landscape with mountains and a lake..."
                value={generationParams.prompt}
                onChange={(e) =>
                  setGenerationParams({
                    ...generationParams,
                    prompt: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="negative-prompt">
                  Negative Prompt (Optional)
                </Label>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm text-muted-foreground hover:text-foreground h-auto p-0"
                >
                  {showSettings ? "Hide Settings" : "Advanced Settings"}
                </Button>
              </div>
              <Textarea
                id="negative-prompt"
                placeholder="blurry, low quality, distorted..."
                value={generationParams.negative_prompt}
                onChange={(e) =>
                  setGenerationParams({
                    ...generationParams,
                    negative_prompt: e.target.value,
                  })
                }
                rows={2}
              />
            </div>

            {showSettings && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">
                      Width: {generationParams.width}px
                    </Label>
                    <Slider
                      id="width"
                      min={256}
                      max={2048}
                      step={64}
                      value={[generationParams.width]}
                      onValueChange={(value: number[]) =>
                        setGenerationParams({
                          ...generationParams,
                          width: value[0],
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">
                      Height: {generationParams.height}px
                    </Label>
                    <Slider
                      id="height"
                      min={256}
                      max={2048}
                      step={64}
                      value={[generationParams.height]}
                      onValueChange={(value: number[]) =>
                        setGenerationParams({
                          ...generationParams,
                          height: value[0],
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-images">
                    Number of Images: {generationParams.num_images}
                  </Label>
                  <Slider
                    id="num-images"
                    min={1}
                    max={4}
                    step={1}
                    value={[generationParams.num_images]}
                    onValueChange={(value: number[]) =>
                      setGenerationParams({
                        ...generationParams,
                        num_images: value[0],
                      })
                    }
                  />
                </div>
                {provider === "flux" && (
                  <div className="space-y-2">
                    <Label htmlFor="style-preset">Style Preset</Label>
                    <Select
                      value={generationParams.style_preset}
                      onValueChange={(value) =>
                        setGenerationParams({
                          ...generationParams,
                          style_preset: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photographic">
                          Photographic
                        </SelectItem>
                        <SelectItem value="digital-art">Digital Art</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="comic-book">Comic Book</SelectItem>
                        <SelectItem value="fantasy-art">Fantasy Art</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Image
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !generationParams.prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {generatedImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Images</CardTitle>
              <CardDescription>Click on an image to select it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group cursor-pointer border-2 rounded-md overflow-hidden transition-all ${selectedImage === img.id
                      ? "border-primary ring-2 ring-primary"
                      : "border-transparent"
                      }`}
                    onClick={() => setSelectedImage(img.id)}
                  >
                    <img
                      src={img.url}
                      alt={String(
                        (img.metadata as Record<string, unknown>).prompt ||
                        "Generated image",
                      )}
                      className="w-full h-32 object-cover"
                    />
                    {selectedImage === img.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(
                              img.url,
                              String(
                                (img.metadata as Record<string, unknown>)
                                  .prompt || "ai-generated",
                              ),
                            );
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>3D Preview</CardTitle>
            <CardDescription>
              Preview how your image will look on the 3D model
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] bg-muted/20 rounded-md">
            {selectedImageData ? (
              <div className="relative w-full h-full">
                <img
                  src={selectedImageData.url}
                  alt="3D preview"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleUseFor3D(selectedImageData.url)}
                  >
                    <Check className="h-4 w-4" />
                    Apply to 3D Model
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p>Generate or upload an image to see the 3D preview</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" disabled={!selectedImageData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset View
            </Button>
            <Button
              size="sm"
              disabled={!selectedImageData}
              onClick={() =>
                selectedImageData && handleUseFor3D(selectedImageData.url)
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Apply to 3D Model
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation Details</CardTitle>
            <CardDescription>
              Information about the selected image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedImageData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium capitalize">
                    {selectedImageData.provider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{selectedImageData.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated:</span>
                  <span className="font-medium">
                    {new Date(selectedImageData.created_at).toLocaleString()}
                  </span>
                </div>
                {Boolean(
                  (selectedImageData.metadata as Record<string, unknown>)
                    .prompt,
                ) && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-muted-foreground mb-1">Prompt:</p>
                      <p className="text-sm bg-muted/20 p-2 rounded">
                        {String(
                          (selectedImageData.metadata as Record<string, unknown>)
                            .prompt,
                        )}
                      </p>
                    </div>
                  )}
                {Boolean(
                  (selectedImageData.metadata as Record<string, unknown>)
                    .negative_prompt,
                ) && (
                    <div className="mt-2">
                      <p className="text-muted-foreground text-sm mb-1">
                        Negative Prompt:
                      </p>
                      <p className="text-xs bg-muted/20 p-2 rounded line-clamp-3">
                        {String(
                          (selectedImageData.metadata as Record<string, unknown>)
                            .negative_prompt,
                        )}
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm">
                Select an image to view its details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
