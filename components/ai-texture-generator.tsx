"use client";

import { useState, useCallback, useEffect } from "react";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useHitemAI } from "@/hooks/use-hitem-ai";
import { useConfiguratorStore } from "@/lib/store";
import { Loader2, Sparkles, Layers, Check, Image as ImageIcon, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import * as THREE from "three";

interface AITextureGeneratorProps {
  scene?: THREE.Object3D;
  onTextureGenerated?: (texture: THREE.Texture, url: string) => void;
  className?: string;
}

// Pattern presets
const PATTERN_PRESETS = [
  "geometric flames",
  "abstract waves",
  "camouflage",
  "galaxy nebula",
  "tiger stripes",
  "honeycomb",
  "floral damask",
  "carbon fiber"
];

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "hand-painted", label: "Hand Painted" },
  { value: "cartoon", label: "Cartoon / Anime" },
  { value: "abstract", label: "Abstract Art" },
  { value: "fabric", label: "Fabric / Textile" },
];

export function AITextureGenerator({
  scene,
  onTextureGenerated,
  className,
}: AITextureGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [generatePbr, setGeneratePbr] = useState(true);
  const [seamless, setSeamless] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const uvMap = useConfiguratorStore((s) => s.completeUVMap);

  const {
    textureUrl: runwareUrl,
    texture: runwareTexture,
    normalMapUrl: runwareNormalUrl,
    roughnessMapUrl: runwareRoughnessUrl,
    isGenerating: isRunwareGenerating,
    error: runwareError,
    progress: runwareProgress,
    generateTexture: generateRunware,
    applyToScene: applyRunware,
  } = useRunwareAI();

  const {
    isGenerating: isHitemGenerating,
    progress: hitemProgress,
    error: hitemError,
    generateTexture: generateHitem,
  } = useHitemAI();

  const [provider, setProvider] = useState<"runware" | "hitem">("runware");
  // For Hitem generated textures (persistent state for preview)
  const [hitemTexture, setHitemTexture] = useState<THREE.Texture | null>(null);
  const [hitemTextureUrl, setHitemTextureUrl] = useState<string | null>(null);
  const [hitemMaps, setHitemMaps] = useState<{ normal?: string; roughness?: string }>({});

  const isGenerating = isRunwareGenerating || isHitemGenerating;
  const progress = isRunwareGenerating ? runwareProgress : hitemProgress;
  const error = runwareError || hitemError;

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !uvMap) return;

    // 1. Generate Base with Runware (Always needed as input for Hitem if no image upload)
    let finalPrompt = prompt.trim();
    if (style && style !== "photorealistic") {
      finalPrompt += `, ${style} style`;
    }
    if (seamless) {
      finalPrompt += ", seamless tileable pattern, texture map";
    }

    const runwareResult = await generateRunware({
      prompt: finalPrompt,
      uvMap,
      strength: 0.85,
      generatePbr: generatePbr && provider === "runware", // Only gen local PBR if Runware is final
    });

    if (!runwareResult) return;

    if (provider === "runware") {
      onTextureGenerated?.(runwareResult.texture, runwareResult.imageUrl);
    } else {
      // 2. Chain to Hitem3D
      // We need to convert the Runware Image URL to a Blob/File
      try {
        // Proxy fetch if needed, but the URL is likely remote.
        // Runware URLs are public.
        const imgRes = await fetch(runwareResult.imageUrl);
        const imgBlob = await imgRes.blob();

        const hitemResult = await generateHitem({
          image: imgBlob,
          prompt: finalPrompt,
        });

        if (hitemResult) {
          setHitemTexture(hitemResult.texture);
          setHitemTextureUrl(hitemResult.coverUrl || runwareResult.imageUrl);
          setHitemMaps({
            // @ts-ignore - Assuming source.data.src exists on loaded texture if it's an image
            normal: hitemResult.normalMap?.source?.data?.src || hitemResult.normalMap?.image?.src,
            // @ts-ignore
            roughness: hitemResult.roughnessMap?.source?.data?.src || hitemResult.roughnessMap?.image?.src
          });

          onTextureGenerated?.(hitemResult.texture, hitemResult.coverUrl || runwareResult.imageUrl);

          // Apply Hitem texture to scene
          if (scene) {
            scene.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                if (m.material instanceof THREE.MeshStandardMaterial) {
                  m.material.map = hitemResult.texture;
                  if (hitemResult.normalMap) m.material.normalMap = hitemResult.normalMap;
                  if (hitemResult.roughnessMap) m.material.roughnessMap = hitemResult.roughnessMap;
                  m.material.needsUpdate = true;
                }
              }
            });
          }
        }
      } catch (e) {
        console.error("Hitem Chain Error", e);
      }
    }
  }, [prompt, style, seamless, generatePbr, uvMap, provider, generateRunware, generateHitem, onTextureGenerated, scene]);

  // Display var helpers
  const currentTextureUrl = provider === "runware" ? runwareUrl : hitemTextureUrl;
  const currentNormalUrl = provider === "runware" ? runwareNormalUrl : hitemMaps.normal;
  const currentRoughnessUrl = provider === "runware" ? runwareRoughnessUrl : hitemMaps.roughness;

  const handlePresetClick = (preset: string) => {
    if (selectedPreset === preset) {
      setSelectedPreset(null);
      setPrompt("");
    } else {
      setSelectedPreset(preset);
      setPrompt(preset);
    }
  };

  useEffect(() => {
    if (scene) {
      if (provider === "runware" && runwareTexture) {
        applyRunware(scene);
      }
      // Hitem texture is applied in handleGenerate, but we can re-apply if scene changes
      // or just rely on manual application.
    }
  }, [runwareTexture, provider, scene, applyRunware]);

  const canGenerate = prompt.trim() && uvMap && !isGenerating;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
        {/* Provider Selector */}
        <div className="flex p-1 bg-muted rounded-lg">
          <button
            onClick={() => setProvider("runware")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5",
              provider === "runware" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Standard
          </button>
          <button
            onClick={() => setProvider("hitem")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5",
              provider === "hitem" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Box className="w-3.5 h-3.5" />
            Advanced 3D
          </button>
        </div>

        {provider === "hitem" && (
          <div className="text-[10px] text-muted-foreground px-1 bg-blue-50/50 p-2 rounded border border-blue-100">
            <strong>Note:</strong> Hitem3D generates a base using Runware, then enhances it into a 3D texture.
          </div>
        )}

        {/* Style Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Style</Label>
            <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col justify-end pb-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="pbr-mode"
                checked={generatePbr}
                onCheckedChange={setGeneratePbr}
                disabled={isGenerating}
              />
              <Label htmlFor="pbr-mode" className="text-sm cursor-pointer">Generate PBR</Label>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Adds depth (Normal/Roughness maps) to the texture.
            </p>
          </div>
        </div>

        {/* Pattern Input */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input
            placeholder="Describe your texture (e.g., weathered red leather, gold honeycomb)..."
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSelectedPreset(null);
            }}
            disabled={isGenerating}
            className="h-10"
          />
        </div>

        {/* Pattern Presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {PATTERN_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={isGenerating}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-all",
                  selectedPreset === preset
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300 transform active:scale-95"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress || "Generating..."}
            {provider === "hitem" && isRunwareGenerating && " (Base)"}
            {provider === "hitem" && hitemProgress > 0 && ` (3D: ${hitemProgress}%)`}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate {provider === "hitem" ? "Advanced 3D" : "Advanced"} Texture
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 text-center">
          {error}
        </div>
      )}

      {/* Result Preview & Layers */}
      {currentTextureUrl && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Generated Maps</h4>
            {generatePbr && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center">
                <Check className="w-3 h-3 mr-1" /> PBR Ready
              </span>
            )}
          </div>

          <Tabs defaultValue="color" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-7">
              <TabsTrigger value="color" className="text-xs">Color</TabsTrigger>
              <TabsTrigger value="normal" disabled={!currentNormalUrl} className="text-xs">Normal</TabsTrigger>
              <TabsTrigger value="roughness" disabled={!currentRoughnessUrl} className="text-xs">Roughness</TabsTrigger>
            </TabsList>

            <div className="mt-2 aspect-square rounded-lg overflow-hidden border bg-muted/30 relative group">
              <TabsContent value="color" className="m-0 h-full">
                <img src={currentTextureUrl} alt="Color Map" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center backdrop-blur-sm">Base Color</div>
              </TabsContent>

              <TabsContent value="normal" className="m-0 h-full">
                {currentNormalUrl ? (
                  <>
                    <img src={currentNormalUrl} alt="Normal Map" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center backdrop-blur-sm">Normal (Bump)</div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No Normal Map</div>
                )}
              </TabsContent>

              <TabsContent value="roughness" className="m-0 h-full">
                {currentRoughnessUrl ? (
                  <>
                    <img src={currentRoughnessUrl} alt="Roughness Map" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center backdrop-blur-sm">Roughness</div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No Roughness Map</div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default AITextureGenerator;
