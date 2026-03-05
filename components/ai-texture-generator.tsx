"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGeminiAI } from "@/hooks/use-gemini-ai";
import { useConfiguratorStore } from "@/lib/store";
import {
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
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
import { toast } from "sonner";

interface AITextureGeneratorProps {
  scene?: THREE.Object3D;
  onTextureGenerated?: (
    texture: THREE.Texture,
    url: string,
    options?: { normalMapUrl?: string | null; roughnessMapUrl?: string | null },
  ) => void | Promise<void>;
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
  "carbon fiber",
];

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "hand-painted", label: "Hand Painted" },
  { value: "cartoon", label: "Cartoon / Anime" },
  { value: "abstract", label: "Abstract Art" },
  { value: "fabric", label: "Fabric / Textile" },
];

type TextureWithOptionalSrc = THREE.Texture & {
  source?: { data?: { src?: string } };
  image?:
    | { src?: string }
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement;
};

const extractTextureSrc = (texture?: THREE.Texture | null): string | null => {
  if (!texture) return null;
  const tex = texture as TextureWithOptionalSrc;
  const sourceSrc = tex.source?.data?.src;
  if (typeof sourceSrc === "string" && sourceSrc.length > 0) {
    return sourceSrc;
  }

  if (typeof tex.image === "string") {
    return tex.image;
  }

  if (tex.image && typeof (tex.image as { src?: string }).src === "string") {
    return (tex.image as { src?: string }).src || null;
  }

  return null;
};

export function AITextureGenerator({
  scene,
  onTextureGenerated,
  className,
}: AITextureGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Player info for back of jersey
  const [includePlayerInfo, setIncludePlayerInfo] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  // Debug options specifically for soccer jersey crew neck
  const soccerJerseyDebug = useConfiguratorStore((s) => s.soccerJerseyDebug);
  const setSoccerJerseyDebug = useConfiguratorStore(
    (s) => s.setSoccerJerseyDebug,
  );

  const uvMap = useConfiguratorStore((s) => s.completeUVMap);
  const uvMask = useConfiguratorStore((s) => s.completeUVMask);
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);

  // Check if current model is soccer jersey crew neck
  const isSoccerJerseyCrewNeck =
    currentModelUrl?.includes("soccer-jersey-crew-neck.glb") ||
    currentModelUrl?.includes("soccer-jersey-crew-neck_FIXED.glb") ||
    false;

  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const generationIdRef = useRef(0);
  const generationContextRef = useRef<{
    modelUrl: string | null;
    uvMap: string | null;
    uvMask: string | null;
  }>({
    modelUrl: currentModelUrl ?? null,
    uvMap: uvMap ?? null,
    uvMask: uvMask ?? null,
  });

  useEffect(() => {
    generationContextRef.current = {
      modelUrl: currentModelUrl ?? null,
      uvMap: uvMap ?? null,
      uvMask: uvMask ?? null,
    };
    // Invalidate any in-flight generation when model/UV context changes.
    generationIdRef.current += 1;
    setGeneratedPreviewUrl(null);
  }, [currentModelUrl, uvMap, uvMask]);

  const {
    textureUrl: googleUrl,
    isGenerating: isGoogleGenerating,
    error: googleError,
    progress: googleProgress,
    generateTexture: generateGoogle,
  } = useGeminiAI();

  const isGenerating = isGoogleGenerating;
  const progress = googleProgress;
  const error = googleError;

  const handleGenerate = useCallback(async () => {
    // Prefer the filled UV mask to avoid wireframe lines leaking into generated textures.
    const uvGuide = uvMask || uvMap;
    if (!uvGuide) {
      toast.error("UV guide is not ready yet.");
      return;
    }

    const requestGenerationId = ++generationIdRef.current;
    const requestModelUrl = currentModelUrl ?? null;
    const requestUvMap = uvMap;
    const requestUvMask = uvMask ?? null;
    generationContextRef.current = {
      modelUrl: requestModelUrl,
      uvMap: requestUvMap,
      uvMask: requestUvMask,
    };
    setGeneratedPreviewUrl(null);

    const isCurrentGeneration = () => {
      const latest = generationContextRef.current;
      return (
        requestGenerationId === generationIdRef.current &&
        latest.modelUrl === requestModelUrl &&
        latest.uvMap === requestUvMap &&
        latest.uvMask === requestUvMask
      );
    };

    const modelUrl = (currentModelUrl || "").toLowerCase();
    const modelType =
      modelUrl.includes("baseball-caps") ||
      modelUrl.includes("baseball-cap") ||
      modelUrl.includes("snapback") ||
      modelUrl.includes("hat")
      ? "baseball cap"
      : modelUrl.includes("duffle")
        ? "duffle-bag"
        : modelUrl.includes("jersey") || modelUrl.includes("short")
          ? "jersey and shorts"
          : modelUrl.includes("hoodie")
            ? "hoodie"
            : modelUrl.includes("bag") || modelUrl.includes("backpack")
              ? "bag"
              : "sportswear";

    const modelGuard =
      modelType === "baseball cap"
        ? "This design is for a baseball cap only: crown panels, brim, button, and strap. Ignore any request to generate jerseys, shorts, sleeves, or torso panels."
        : modelType === "duffle-bag"
          ? "This design is for a DUFFLE BAG only: barrel body panels, circular end caps, handles, straps, and zipper flap. This is NOT a jersey — ignore any mention of sleeves, torso panels, shorts, or apparel."
          : modelType === "bag"
            ? "This design is for a bag only. Ignore any request to generate jerseys, shorts, or apparel."
            : modelType === "hoodie"
              ? "This design is for a hoodie only. Ignore any request to generate shorts."
              : modelType === "jersey and shorts"
                ? "This design is for jersey and shorts."
                : "Match the current product type only.";

    const cleanName = playerName.trim().toUpperCase();
    const cleanNumber = jerseyNumber.trim().replace(/\D/g, "").slice(0, 3);
    const wantsPersonalization =
      includePlayerInfo && (cleanName.length > 0 || cleanNumber.length > 0);

    const textGuardrail = wantsPersonalization
      ? [
          cleanName
            ? `Place the player name "${cleanName}" once across the upper back`
            : null,
          cleanNumber
            ? `Place a single jersey number "${cleanNumber}" centered on the back`
            : null,
          "Do not add any other names, numbers, letters, words, or watermarks anywhere else on the garment",
        ]
          .filter(Boolean)
          .join(". ")
      : modelType === "duffle-bag"
        ? "Do not add any names, numbers, letters, words, logos, or watermarks anywhere on the bag; keep all panels free of typography"
        : "Do not add any names, numbers, letters, words, logos, or watermarks anywhere on the jersey; keep all panels free of typography";

    const basePrompt =
      prompt.trim().length > 0
        ? prompt.trim()
        : "Create a premium sports design with balanced composition.";
    const googlePrompt = [
      basePrompt,
      modelGuard,
      textGuardrail,
      "Use the provided UV map as strict placement guide.",
      "Keep output as flat 2D texture only (no lighting, no shadows).",
      "Fill all UV islands with design and keep style coherent.",
      "Do not add watermarks or extra text.",
    ]
      .filter(Boolean)
      .join(" ");

    console.log("🎨 Calling Google Gemini Pro with advanced settings:", {
      prompt: googlePrompt,
      model: "pro",
      resolution: "4K",
    });

    const result = await generateGoogle({
      prompt: googlePrompt,
      uvMap: uvGuide,
      generatePbr: false,
      model: "pro",
      aspectRatio: "1:1",
      resolution: "4K",
      textureStyle: "realistic",
      productType: modelType,
    });
    if (!result) return;

    if (!isCurrentGeneration()) {
      console.warn("Skipping stale AI generation before apply callback");
      return;
    }
    setGeneratedPreviewUrl(result.imageUrl);

    if (onTextureGenerated) {
      await onTextureGenerated(result.texture, result.imageUrl, {
        normalMapUrl: result.normalMapUrl,
        roughnessMapUrl: result.roughnessMapUrl,
      });
    }
  }, [
    prompt,
    uvMap,
    uvMask,
    includePlayerInfo,
    playerName,
    jerseyNumber,
    generateGoogle,
    onTextureGenerated,
    currentModelUrl,
  ]);

  // Display var helpers
  const currentTextureUrl = generatedPreviewUrl || googleUrl;

  const handlePresetClick = (preset: string) => {
    if (selectedPreset === preset) {
      setSelectedPreset(null);
      setPrompt("");
    } else {
      setSelectedPreset(preset);
      setPrompt(preset);
    }
  };

  // NOTE: Direct applyGoogle(scene) removed — texture application is handled
  // exclusively by the TextureCompositor via texture layers in the store.
  // The onTextureGenerated callback adds the AI texture as a layer, and
  // TextureCompositor composes & applies it to all materials.

  const canGenerate = !!(uvMap || uvMask) && !isGenerating; // UV guide is required

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-3">
        {/* Pattern Input */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">Style & Prompt</Label>
          <Input
            placeholder="Describe style (e.g. vintage, metallic)..."
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSelectedPreset(null);
            }}
            disabled={isGenerating}
            className="h-8 text-xs"
          />
        </div>

        {/* Compact Presets - Horizontal Scroll */}
        <div>
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {PATTERN_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={isGenerating}
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 text-[10px] rounded-full border transition-all whitespace-nowrap",
                  selectedPreset === preset
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "bg-background border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Player Info Toggle */}
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="player-info-toggle"
              className="text-xs font-medium flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Add Name & Number
            </Label>
            <Switch
              id="player-info-toggle"
              checked={includePlayerInfo}
              onCheckedChange={setIncludePlayerInfo}
              disabled={isGenerating}
              className="scale-75 origin-right"
            />
          </div>

          {includePlayerInfo && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Input
                placeholder="NAME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                disabled={isGenerating}
                className="h-7 text-xs uppercase"
                maxLength={20}
              />
              <Input
                placeholder="00"
                value={jerseyNumber}
                onChange={(e) =>
                  setJerseyNumber(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                disabled={isGenerating}
                className="h-7 text-xs"
                maxLength={3}
              />
            </div>
          )}
        </div>

        {/* Collapsible Debug Options */}
        {isSoccerJerseyCrewNeck && (
          <details className="text-xs border-t pt-2 group">
            <summary className="font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1.5 select-none list-none">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span>Soccer Jersey Fixes</span>
              <div className="ml-auto opacity-50 group-open:rotate-180 transition-transform">
                ▼
              </div>
            </summary>

            <div className="pt-2 space-y-3 bg-muted/30 p-2 rounded mt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px]">Flip Y</span>
                  <Switch
                    checked={soccerJerseyDebug.flipY}
                    onCheckedChange={(c) => setSoccerJerseyDebug({ flipY: c })}
                    className="scale-75 origin-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]">Back Tex</span>
                  <Switch
                    checked={soccerJerseyDebug.useBackTexture}
                    onCheckedChange={(c) =>
                      setSoccerJerseyDebug({ useBackTexture: c })
                    }
                    className="scale-75 origin-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] block text-muted-foreground">
                  Back Transform
                </span>
                <Select
                  value={soccerJerseyDebug.backTransform}
                  onValueChange={(v: any) =>
                    setSoccerJerseyDebug({ backTransform: v })
                  }
                >
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mirrorX">Mirror X</SelectItem>
                    <SelectItem value="mirrorY">Mirror Y</SelectItem>
                    <SelectItem value="rotate180">Rotate 180</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-1 border-t border-border/50">
                <span className="text-[10px] font-medium block">
                  UV Alignment
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Compact UV Sliders */}
                  {[
                    "uvOffsetX",
                    "uvOffsetY",
                    "uvRepeatX",
                    "uvRepeatY",
                    "uvRotation",
                  ].map((key) => {
                    const val =
                      (soccerJerseyDebug[
                        key as keyof typeof soccerJerseyDebug
                      ] as number) ?? 0;
                    const label = key.replace("uv", "");
                    const min = key.includes("Repeat")
                      ? 0.5
                      : key.includes("Rotation")
                        ? -180
                        : -1;
                    const max = key.includes("Repeat")
                      ? 2
                      : key.includes("Rotation")
                        ? 180
                        : 1;
                    const step = key.includes("Rotation") ? 1 : 0.01;

                    return (
                      <div key={key} className="space-y-0.5">
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                          <span>{label}</span>
                          <span>
                            {val.toFixed(key.includes("Rotation") ? 0 : 2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={val}
                          onChange={(e) =>
                            setSoccerJerseyDebug({
                              [key]: parseFloat(e.target.value),
                            })
                          }
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </details>
        )}
      </div>

      {/* Generate Button - Full Width Bottom */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full h-9 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm transition-all duration-300"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            {progress || "Generating..."}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-3 w-3" />
            Generate Design
          </>
        )}
      </Button>

      {/* Error + Retry */}
      {error && (
        <div className="p-2 bg-destructive/10 text-destructive rounded border border-destructive/20 space-y-1.5">
          <p className="text-[10px] leading-tight text-center">
            AI is not okay right now. Please try again.
          </p>
          <p className="text-[9px] leading-tight text-center opacity-90">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full text-[10px]"
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Result Preview - Compact */}
      {currentTextureUrl && (
        <div className="pt-2 border-t">
          <div className="aspect-square rounded-md overflow-hidden border bg-muted/30 relative max-h-[160px] mx-auto">
            <img
              src={currentTextureUrl}
              alt="Result"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AITextureGenerator;
