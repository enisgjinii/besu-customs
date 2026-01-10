"use client";

import { useState, useCallback, useEffect } from "react";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useGeminiAI } from "@/hooks/use-gemini-ai";
import { useHitemAI } from "@/hooks/use-hitem-ai";
import { useConfiguratorStore } from "@/lib/store";
import { Loader2, Sparkles, Layers, Check, Image as ImageIcon, Box, User, Hash } from "lucide-react";
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
  onTextureGenerated?: (
    texture: THREE.Texture,
    url: string,
    options?: { normalMapUrl?: string | null; roughnessMapUrl?: string | null }
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
  "carbon fiber"
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
  image?: { src?: string } | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
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
  const [style, setStyle] = useState("photorealistic");
  const [generatePbr, setGeneratePbr] = useState(true);
  const [seamless, setSeamless] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Player info for back of jersey
  const [includePlayerInfo, setIncludePlayerInfo] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

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

  const {
    textureUrl: googleUrl,
    texture: googleTexture,
    normalMapUrl: googleNormalUrl,
    roughnessMapUrl: googleRoughnessUrl,
    isGenerating: isGoogleGenerating,
    error: googleError,
    progress: googleProgress,
    generateTexture: generateGoogle,
    applyToScene: applyGoogle,
  } = useGeminiAI();

  const [provider, setProvider] = useState<"runware" | "hitem" | "google">("runware");
  // For Hitem generated textures (persistent state for preview)
  const [hitemTexture, setHitemTexture] = useState<THREE.Texture | null>(null);
  const [hitemTextureUrl, setHitemTextureUrl] = useState<string | null>(null);
  const [hitemMaps, setHitemMaps] = useState<{ normal?: string; roughness?: string }>({});

  const isGenerating = isRunwareGenerating || isHitemGenerating || isGoogleGenerating;
  const progress = isRunwareGenerating ? runwareProgress : (isGoogleGenerating ? googleProgress : hitemProgress);
  const error = runwareError || hitemError || googleError;

  useEffect(() => {
    if (provider === "google" && generatePbr) {
      setGeneratePbr(false);
    }
  }, [provider, generatePbr]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !uvMap) return;

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
      : "Do not add any names, numbers, letters, words, logos, or watermarks anywhere on the jersey; keep all panels free of typography";

    const uvDiscipline =
      "Respect the provided UV layout: map artwork cleanly to front, back, sleeves, collar, and shorts without stretching across seams; keep orientation upright and symmetric";

    const baseTextureNote =
      "Flat 2D jersey texture for sublimation; no lighting, shading, or baked shadows";

    // For Google AI, we call it directly with advanced options
    if (provider === "google") {
      // Build clean prompt for Google Gemini
      const googlePrompt = [
        prompt.trim(),
        seamless ? "seamless tileable pattern" : null,
        uvDiscipline,
        textGuardrail,
        "Use the UV image as strict placement guide for each jersey panel",
        baseTextureNote,
      ]
        .filter(Boolean)
        .join(". ");

      console.log("🎨 Calling Google Gemini Pro with advanced settings:", {
        prompt: googlePrompt,
        model: "pro",
        resolution: "2K",
      });

      const googleResult = await generateGoogle({
        prompt: googlePrompt,
        uvMap,
        generatePbr: false, // PBR handled locally if needed
        model: "pro", // Use Pro model for best quality
        aspectRatio: "1:1",
        resolution: "2K", // Higher resolution for better textures
        textureStyle: "realistic", // Professional realistic style
      });

      if (googleResult && onTextureGenerated) {
        await onTextureGenerated(googleResult.texture, googleResult.imageUrl, {
          normalMapUrl: googleResult.normalMapUrl,
          roughnessMapUrl: googleResult.roughnessMapUrl,
        });
      }
      return;
    }

    // For Runware and Hitem, generate base with Runware first
    const shouldApplyStyle = style && style !== "photorealistic";
    const finalPromptParts = [
      prompt.trim(),
      shouldApplyStyle ? `${style} style` : null,
      seamless ? "seamless tileable pattern, texture map" : null,
      uvDiscipline,
      textGuardrail,
      baseTextureNote,
    ].filter(Boolean);

    const finalPrompt = finalPromptParts.join(". ");

    const negativeTextPrompt = wantsPersonalization
      ? "watermark, duplicate text, extra numbers, random letters, gibberish typography, double numbers"
      : "numbers, letters, names, jersey number, typography, text overlay, watermark, brand logo, digits";

    const runwareResult = await generateRunware({
      prompt: finalPrompt,
      uvMap,
      strength: 0.85,
      generatePbr: generatePbr && provider === "runware", // Only gen local PBR if Runware is final
      negativePrompt: negativeTextPrompt,
    });

    if (!runwareResult) return;

    if (provider === "runware") {
      if (onTextureGenerated) {
        await onTextureGenerated(runwareResult.texture, runwareResult.imageUrl, {
          normalMapUrl: runwareResult.normalMapUrl,
          roughnessMapUrl: runwareResult.roughnessMapUrl,
        });
      }
    } else {
      // Chain to Hitem3D
      try {
        const imgRes = await fetch(runwareResult.imageUrl);
        const imgBlob = await imgRes.blob();

        const hitemResult = await generateHitem({
          image: imgBlob,
          prompt: finalPrompt,
        });

        if (hitemResult) {
          setHitemTexture(hitemResult.texture);
          setHitemTextureUrl(hitemResult.coverUrl || runwareResult.imageUrl);

          const hitemNormalSrc = extractTextureSrc(hitemResult.normalMap);
          const hitemRoughnessSrc = extractTextureSrc(hitemResult.roughnessMap);

          setHitemMaps({
            normal: hitemNormalSrc || undefined,
            roughness: hitemRoughnessSrc || undefined,
          });

          if (onTextureGenerated) {
            await onTextureGenerated(
              hitemResult.texture,
              hitemResult.coverUrl || runwareResult.imageUrl,
              {
                normalMapUrl: hitemNormalSrc,
                roughnessMapUrl: hitemRoughnessSrc,
              },
            );
          }

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
  }, [prompt, style, seamless, generatePbr, uvMap, provider, includePlayerInfo, playerName, jerseyNumber, generateRunware, generateHitem, generateGoogle, onTextureGenerated, scene]);

  // Display var helpers
  const currentTextureUrl = provider === "runware" ? runwareUrl : (provider === "google" ? googleUrl : hitemTextureUrl);
  const currentNormalUrl = provider === "runware" ? runwareNormalUrl : (provider === "google" ? googleNormalUrl : hitemMaps.normal);
  const currentRoughnessUrl = provider === "runware" ? runwareRoughnessUrl : (provider === "google" ? googleRoughnessUrl : hitemMaps.roughness);

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
      } else if (provider === "google" && googleTexture) {
        applyGoogle(scene);
      }
      // Hitem texture is applied in handleGenerate, but we can re-apply if scene changes
      // or just rely on manual application.
    }
  }, [runwareTexture, googleTexture, provider, scene, applyRunware, applyGoogle]);

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
          <button
            onClick={() => setProvider("google")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5",
              provider === "google" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Google AI
          </button>
        </div>

        {provider === "hitem" && (
          <div className="text-[10px] text-muted-foreground px-1 bg-blue-50/50 p-2 rounded border border-blue-100">
            <strong>Note:</strong> Hitem3D generates a base using Runware, then enhances it into a 3D texture.
          </div>
        )}

        {provider === "google" && (
          <div className="text-[10px] text-muted-foreground px-1 bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-2 rounded border border-blue-100">
            <strong>🍌 Nano Banana Pro:</strong> Uses Gemini 3 Pro Image Preview with advanced "Thinking" for professional 2K texture generation.
          </div>
        )}

        {/* Style Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Style</Label>
            <Select
              value={style}
              onValueChange={setStyle}
              disabled={isGenerating || provider === "google"}
            >
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
            {provider === "google" && (
              <p className="text-[10px] text-muted-foreground">Google AI ignores style to improve reliability.</p>
            )}
          </div>

          <div className="space-y-2 flex flex-col justify-end pb-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="pbr-mode"
                checked={generatePbr}
                onCheckedChange={setGeneratePbr}
                disabled={isGenerating || provider === "google"}
              />
              <Label htmlFor="pbr-mode" className="text-sm cursor-pointer">Generate PBR</Label>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {provider === "google" ? "PBR maps are disabled for Google AI generation." : "Adds depth (Normal/Roughness maps) to the texture."}
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

        {/* Player Info for Back of Jersey */}
        <div className="space-y-3 p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <Label htmlFor="player-info-toggle" className="text-sm font-medium">
                Include Name & Number
              </Label>
            </div>
            <Switch
              id="player-info-toggle"
              checked={includePlayerInfo}
              onCheckedChange={setIncludePlayerInfo}
              disabled={isGenerating}
            />
          </div>

          {includePlayerInfo && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="player-name" className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Player Name
                </Label>
                <Input
                  id="player-name"
                  placeholder="SMITH"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  disabled={isGenerating}
                  className="h-9 uppercase"
                  maxLength={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jersey-number" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Number
                </Label>
                <Input
                  id="jersey-number"
                  placeholder="23"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  disabled={isGenerating}
                  className="h-9"
                  maxLength={3}
                />
              </div>
              <p className="col-span-2 text-[10px] text-muted-foreground">
                AI will incorporate these into the texture design for the jersey back.
              </p>
            </div>
          )}
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
