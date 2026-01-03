"use client";

import { useState, useCallback, useEffect } from "react";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useConfiguratorStore } from "@/lib/store";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
];

export function AITextureGenerator({
  scene,
  onTextureGenerated,
  className,
}: AITextureGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const uvMap = useConfiguratorStore((s) => s.completeUVMap);

  const {
    textureUrl,
    texture,
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

    const result = await generateTexture({
      prompt: prompt.trim(),
      uvMap,
      strength: 0.85,
    });

    if (result) {
      onTextureGenerated?.(result.texture, result.imageUrl);
    }
  }, [prompt, uvMap, generateTexture, onTextureGenerated]);

  useEffect(() => {
    if (texture && scene) {
      applyToScene(scene);
    }
  }, [texture, scene, applyToScene]);

  const canGenerate = prompt.trim() && uvMap && !isGenerating;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Pattern Input */}
      <Input
        placeholder="Describe your pattern (e.g., geometric flames, abstract waves)..."
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setSelectedPreset(null);
        }}
        disabled={isGenerating}
      />

      {/* Pattern Presets */}
      <div className="flex flex-wrap gap-2">
        {PATTERN_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            disabled={isGenerating}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              selectedPreset === preset
                ? "bg-purple-100 border-purple-300 text-purple-700"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            )}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress || "Generating..."}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate & Apply Pattern
          </>
        )}
      </Button>

      {/* Help Text */}
      <p className="text-xs text-center text-muted-foreground">
        AI will create a seamless pattern that covers the entire garment
      </p>

      {/* Error */}
      {error && (
        <p className="text-sm text-center text-destructive">{error}</p>
      )}

      {/* Result Preview */}
      {textureUrl && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Generated Pattern</p>
          <div className="aspect-square rounded-lg overflow-hidden border">
            <img src={textureUrl} alt="Pattern" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}

export default AITextureGenerator;
