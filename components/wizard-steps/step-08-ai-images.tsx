"use client";
import { useConfiguratorStore } from "@/lib/store";
import { AIImageGenerator } from "@/components/ai-image-generator";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { LayerControls } from "@/components/layer-controls";
import {
  compressImageForMobile,
  isMobile,
} from "@/lib/mobile-performance-utils";
import { generatePBRMaps } from "@/lib/pbr-utils";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useMeshyAI } from "@/hooks/use-meshy-ai";
import {
  Sparkles,
  Map,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Wand2,
  Zap,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// AI Provider types
type AIProvider = "runware" | "meshy";

export function Step08AIImages() {
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (state) => state.setSelectedTextureLayerId,
  );
  const completeUVMap = useConfiguratorStore((state) => state.completeUVMap);
  const setGlobalNormalMap = useConfiguratorStore((s) => s.setGlobalNormalMap);
  const setGlobalRoughnessMap = useConfiguratorStore((s) => s.setGlobalRoughnessMap);
  const setGlobalAOMap = useConfiguratorStore((s) => s.setGlobalAOMap);
  const setGlobalDisplacementMap = useConfiguratorStore((s) => s.setGlobalDisplacementMap);

  // AI Hooks
  const runwareAI = useRunwareAI();
  const meshyAI = useMeshyAI();

  const [showUVMap, setShowUVMap] = useState(true);
  const [uvMapLoading, setUvMapLoading] = useState(false);

  // AI Provider selection
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("runware");

  // UV-based AI generation state
  const [uvPrompt, setUvPrompt] = useState("");
  const [uvGenerating, setUvGenerating] = useState(false);

  // Get current progress from active provider
  const currentProgress = selectedProvider === "meshy"
    ? meshyAI.progress || `${meshyAI.progressPercent}%`
    : runwareAI.progress;

  // Handle UV-based AI generation
  const handleGenerateOnUV = async () => {
    if (!uvPrompt.trim()) {
      toast.error("Please enter a design prompt");
      return;
    }

    if (!completeUVMap) {
      toast.error("No UV map available. Load a 3D model first.");
      return;
    }

    setUvGenerating(true);
    const providerName = selectedProvider === "meshy" ? "Meshy AI" : "Runware AI";
    const toastId = toast.loading(`Generating with ${providerName}...`);

    try {
      console.log(`Generating with ${providerName} using UV map guidance...`);

      let result: { imageUrl: string; pbrMaps?: { metallic?: string; normal?: string; roughness?: string } } | null = null;

      if (selectedProvider === "meshy") {
        // Use Meshy AI
        const meshyResult = await meshyAI.generateTexture({
          prompt: uvPrompt,
          uvMap: completeUVMap,
          enablePbr: true,
          enableOriginalUv: true,
          aiModel: "latest",
        });

        if (meshyResult) {
          result = {
            imageUrl: meshyResult.imageUrl,
            pbrMaps: meshyResult.pbrMaps,
          };
        }
      } else {
        // Use Runware AI
        const runwareResult = await runwareAI.generateTexture({
          prompt: uvPrompt,
          uvMap: completeUVMap,
          strength: 0.85,
        });

        if (runwareResult) {
          result = { imageUrl: runwareResult.imageUrl };
        }
      }

      if (!result) {
        throw new Error("Failed to generate texture");
      }

      let generatedUrl = result.imageUrl;

      // For Meshy, we need to proxy the image to avoid CORS issues with PBR generation
      if (selectedProvider === "meshy") {
        toast.loading("Downloading generated texture...", { id: toastId });

        // Download via proxy and convert to blob URL for local use
        const proxyUrl = `/api/meshy/image-proxy?url=${encodeURIComponent(result.imageUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          throw new Error("Failed to download generated texture");
        }

        const blob = await response.blob();
        generatedUrl = URL.createObjectURL(blob);
        console.log("Proxied Meshy image to blob URL:", generatedUrl);
      }

      // Generate PBR Maps (use Meshy's if available, otherwise generate locally)
      let maps;
      if (result.pbrMaps?.normal && result.pbrMaps?.roughness) {
        toast.loading("Using Meshy PBR maps...", { id: toastId });
        maps = {
          normal: result.pbrMaps.normal,
          roughness: result.pbrMaps.roughness,
          ao: null,
          displacement: null,
        };
      } else {
        toast.loading("Generating PBR maps (Normal, Roughness)...", { id: toastId });
        maps = await generatePBRMaps(generatedUrl);
      }

      // Store PBR maps globally
      setGlobalNormalMap(maps.normal);
      setGlobalRoughnessMap(maps.roughness);
      if (maps.ao) setGlobalAOMap(maps.ao);
      if (maps.displacement) setGlobalDisplacementMap(maps.displacement);

      // Add as a full pattern layer (covers entire UV)
      const newId = uuidv4();
      addTextureLayer({
        id: newId,
        name: `AI UV Pattern (${providerName})`,
        type: "pattern",
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal",
        order: textureLayers.length,
        imageUrl: generatedUrl,
        position: [0.5, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        flipX: false,
      });

      setSelectedTextureLayerId(newId);
      toast.success(`AI pattern generated with ${providerName}!`, { id: toastId });
      setUvPrompt("");

    } catch (error) {
      console.error("UV AI generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Generation failed",
        { id: toastId },
      );
    } finally {
      setUvGenerating(false);
    }
  };

  // Listen for generated images from the AIImageGenerator component
  // Background is already removed by the advanced AI in the generator
  useEffect(() => {
    const handleGeneratedImage = async (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("AI Image Event captured in wizard", customEvent.detail);

      const data = customEvent.detail;
      if (!data || !data.url) return;

      try {
        let processedUrl = data.url;

        // Compress images on mobile for better performance
        if (isMobile()) {
          toast.info("Optimizing for mobile...");
          processedUrl = await compressImageForMobile(processedUrl, 1024, 0.85);
        }

        // Use scale and rotation from the preview if provided
        const scale = data.scale || 0.5;
        const rotation = data.rotation || 0;

        const newId = uuidv4();
        addTextureLayer({
          id: newId,
          name: `AI Design`,
          type: "image",
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal",
          order: textureLayers.length,
          imageUrl: processedUrl,
          position: [0.5, 0.35, 0], // Center chest position
          rotation: [0, 0, rotation * (Math.PI / 180)],
          scale: [scale, scale, 1],
          flipX: false,
        });

        setSelectedTextureLayerId(newId);
        toast.success("AI Image added! Adjust size and position as needed.");
      } catch (err) {
        console.error("Failed to process image", err);
        toast.error("Failed to process image");
      }
    };

    window.addEventListener("generated-image-available", handleGeneratedImage);
    return () => {
      window.removeEventListener(
        "generated-image-available",
        handleGeneratedImage,
      );
    };
  }, [addTextureLayer, textureLayers.length, setSelectedTextureLayerId]);

  // Get AI-generated layers
  const aiLayers = textureLayers.filter((l) => l.name.startsWith("AI"));

  const handleDownloadUVMap = () => {
    if (!completeUVMap) {
      toast.error("No UV map available");
      return;
    }

    const link = document.createElement("a");
    link.href = completeUVMap;
    link.download = `uv-map-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("UV map downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">AI Generation</h2>
        <p className="text-sm text-muted-foreground">
          Create unique patterns and designs with AI
        </p>
      </div>

      {/* UV Map Reference Section */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Map className="w-4 h-4 text-indigo-500" />
            UV Map Reference
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowUVMap(!showUVMap)}
            >
              {showUVMap ? (
                <EyeOff className="w-3 h-3 mr-1" />
              ) : (
                <Eye className="w-3 h-3 mr-1" />
              )}
              {showUVMap ? "Hide" : "Show"}
            </Button>
            {completeUVMap && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDownloadUVMap}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>

        {showUVMap && (
          <div className="p-4">
            {completeUVMap ? (
              <div className="space-y-3">
                <div className="relative rounded-lg border bg-muted/20 overflow-hidden">
                  <img
                    src={completeUVMap}
                    alt="UV Map"
                    className="w-full max-h-[200px] object-contain"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                    UV Map Template
                  </div>
                </div>

                {/* AI Generate on UV Section */}
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-3 rounded-lg border border-purple-200/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Wand2 className="w-3.5 h-3.5" />
                      AI Generate Pattern
                    </h4>

                    {/* Provider Selector */}
                    <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 rounded-full p-0.5 border">
                      <button
                        onClick={() => setSelectedProvider("runware")}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${selectedProvider === "runware"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                      >
                        <Zap className="w-3 h-3" />
                        Runware
                      </button>
                      <button
                        onClick={() => setSelectedProvider("meshy")}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${selectedProvider === "meshy"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                      >
                        <Brain className="w-3 h-3" />
                        Meshy AI
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Describe your pattern (e.g., geometric flames, abstract waves)..."
                      value={uvPrompt}
                      onChange={(e) => setUvPrompt(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !uvGenerating &&
                        handleGenerateOnUV()
                      }
                      disabled={uvGenerating}
                      className="text-sm h-9"
                    />

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        "geometric flames",
                        "abstract waves",
                        "camouflage",
                        "galaxy nebula",
                        "tiger stripes",
                        "honeycomb",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setUvPrompt(suggestion)}
                          className="px-2 py-0.5 text-[10px] bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 rounded-full border border-purple-200/50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateOnUV}
                    disabled={uvGenerating || !uvPrompt.trim()}
                    className={`w-full h-9 text-xs ${selectedProvider === "meshy"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      }`}
                  >
                    {uvGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        {currentProgress || "Generating..."}
                      </>
                    ) : (
                      <>
                        {selectedProvider === "meshy" ? (
                          <Brain className="w-3.5 h-3.5 mr-2" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 mr-2" />
                        )}
                        Generate with {selectedProvider === "meshy" ? "Meshy AI" : "Runware"}
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground text-center">
                    {selectedProvider === "meshy"
                      ? "Meshy AI generates advanced 3D textures with PBR maps"
                      : "Runware provides fast AI texture generation"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Map className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No UV map available</p>
                <p className="text-xs mt-1">
                  Select a 3D model first to extract its UV map
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-1">
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/30 border-b">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Design Generator
            </h3>
          </div>
          <div className="p-4">
            <AIImageGenerator />
          </div>
        </div>
      </div>

      {/* Show AI layers with controls */}
      {aiLayers.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Generated Designs ({aiLayers.length})
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {aiLayers.map((layer) => (
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1">
                    {layer.name}
                  </p>
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <span className="truncate">
                      AI Generated • High Quality
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <LayerControls layerId={layer.id} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
