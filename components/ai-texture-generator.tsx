"use client";

import { useState, useCallback, useEffect } from "react";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useConfiguratorStore } from "@/lib/store";
import { Loader2, Sparkles, Layers, Check, Image as ImageIcon } from "lucide-react";
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
    textureUrl,
    texture,
    normalMapUrl,
    roughnessMapUrl,
    isGenerating,
    error,
    progress,
    generateTexture,
    applyToScene,
  } = useRunwareAI();

  const handlePresetClick = (preset: string) => {
    if (selectedPreset === preset) {
      setSelectedPreset(null);
      setPrompt("");
    } else {
      setSelectedPreset(preset);
      setPrompt(preset);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !uvMap) return;

    // Construct augmented prompt
    let finalPrompt = prompt.trim();
    if (style && style !== "photorealistic") {
      finalPrompt += `, ${style} style`;
    }
    if (seamless) {
      finalPrompt += ", seamless tileable pattern, texture map";
    }

    const result = await generateTexture({
      prompt: finalPrompt,
      uvMap,
      strength: 0.85,
      generatePbr,
    });

    if (result) {
      onTextureGenerated?.(result.texture, result.imageUrl);
    }
  }, [prompt, style, seamless, generatePbr, uvMap, generateTexture, onTextureGenerated]);

  useEffect(() => {
    if (texture && scene) {
      applyToScene(scene);
    }
  }, [texture, scene, applyToScene]);

  const canGenerate = prompt.trim() && uvMap && !isGenerating;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
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
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Advanced Texture
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
      {textureUrl && (
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
              <TabsTrigger value="normal" disabled={!normalMapUrl} className="text-xs">Normal</TabsTrigger>
              <TabsTrigger value="roughness" disabled={!roughnessMapUrl} className="text-xs">Roughness</TabsTrigger>
            </TabsList>

            <div className="mt-2 aspect-square rounded-lg overflow-hidden border bg-muted/30 relative group">
              <TabsContent value="color" className="m-0 h-full">
                <img src={textureUrl} alt="Color Map" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center backdrop-blur-sm">Base Color</div>
              </TabsContent>

              <TabsContent value="normal" className="m-0 h-full">
                {normalMapUrl ? (
                  <>
                    <img src={normalMapUrl} alt="Normal Map" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center backdrop-blur-sm">Normal (Bump)</div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No Normal Map</div>
                )}
              </TabsContent>

              <TabsContent value="roughness" className="m-0 h-full">
                {roughnessMapUrl ? (
                  <>
                    <img src={roughnessMapUrl} alt="Roughness Map" className="w-full h-full object-cover" />
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
