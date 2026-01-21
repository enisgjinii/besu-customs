"use client";

import { useState, useCallback, useEffect } from "react";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useGeminiAI } from "@/hooks/use-gemini-ai";
import { useHitemAI } from "@/hooks/use-hitem-ai";
import { useConfiguratorStore } from "@/lib/store";
import { analyzeUvLayoutFromDataUrl } from "@/lib/uv-layout-analyzer";
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
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uvOnlyMode, setUvOnlyMode] = useState(true); // Always start with UV-only mode enabled

  // Player info for back of jersey
  const [includePlayerInfo, setIncludePlayerInfo] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  // Debug options specifically for soccer jersey crew neck
  const soccerJerseyDebug = useConfiguratorStore((s) => s.soccerJerseyDebug);
  const setSoccerJerseyDebug = useConfiguratorStore((s) => s.setSoccerJerseyDebug);

  const uvMap = useConfiguratorStore((s) => s.completeUVMap);
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);

  // Check if current model is soccer jersey crew neck
  const isSoccerJerseyCrewNeck = currentModelUrl?.includes("soccer-jersey-crew-neck.glb") || false;

  const [uvAnalysisSummary, setUvAnalysisSummary] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!uvMap) {
        setUvAnalysisSummary(null);
        return;
      }
      try {
        const analysis = await analyzeUvLayoutFromDataUrl(uvMap, {
          maxSize: 384,
          threshold: 215,
          dilationPasses: 1,
          minComponentPixels: 35,
          maxIslands: 28,
        });
        if (!cancelled) {
          setUvAnalysisSummary(analysis?.summary ?? null);
          if (analysis?.summary) {
            console.log("🧩 UV layout summary:", analysis.summary);
          }
        }
      } catch (e) {
        if (!cancelled) setUvAnalysisSummary(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [uvMap]);

  const {
    textureUrl: googleUrl,
    texture: googleTexture,
    isGenerating: isGoogleGenerating,
    error: googleError,
    progress: googleProgress,
    generateTexture: generateGoogle,
    applyToScene: applyGoogle,
  } = useGeminiAI();

  const provider = "google"; // Force Google AI only
  const isGenerating = isGoogleGenerating;
  const progress = googleProgress;
  const error = googleError;

  const handleGenerate = useCallback(async () => {
    if (!uvMap) return;

    const modelUrl = (currentModelUrl || "").toLowerCase();
    const modelType = modelUrl.includes("baseball-caps")
      ? "baseball cap"
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
      : "Do not add any names, numbers, letters, words, logos, or watermarks anywhere on the jersey; keep all panels free of typography";

    const uvDiscipline =
      "Respect the provided UV layout: map artwork cleanly to the correct panels without stretching across seams; keep orientation upright and symmetric";

    const baseTextureNote =
      "Flat 2D jersey texture for sublimation; no lighting, shading, or baked shadows";

    const partHints =
      modelType === "baseball cap"
        ? "UV guide for cap: crown panels are large curved islands; brim is a long curved shell; strap and button are small islands. Keep motifs aligned across crown panels; keep brim clean and avoid tiny details on strap/button."
        : "UV guide: large torso panels, side strips, trims, and small bands. Keep flow vertical and mirrored. Avoid splitting key motifs across seams.";

    const flowHints =
      modelType === "baseball cap"
        ? "Use a primary motif across crown panels, with a cleaner treatment on the brim. Keep strap/button simple."
        : "Use large-scale motifs on main panels, smaller repeats on side strips, subtle details on trims; keep all panels consistent in palette and flow";

    const consistencyHints =
      "Front + back large torso panels must match stylistically: same palette, same centerline flow, same motif scale. If you place an emblem/animal, keep it centered within the large torso panels and ensure it still looks correct when UV shells are mirrored";

    const trimHints =
      "Keep thin trim/strap/waistband islands simple (solid color or clean stripes). Avoid complex icons on thin strips to prevent distortion";

    const uvLineGuard =
      "Do not render the UV wireframe/black outline lines; the final image must be clean artwork only";

    const safetyGuard =
      "Safety: no nudity, no people, no faces, no violence, no hate symbols, no weapons. No brand logos or copyrighted characters.";

    const uvAutoAnalysis = uvAnalysisSummary
      ? `Auto UV analysis: ${uvAnalysisSummary}`
      : null;

    const uvOnlyPrompt =
      modelType === "baseball cap"
        ? "Create an ultra-premium, advanced baseball cap texture using the UV map as the only placement guide. Build layered material depth: primary motif, secondary micro-pattern, and subtle fabric weave. Keep motifs centered and symmetric across crown panels with clean mirrored flow. Use high-end technical aesthetics: precision lines, controlled gradients, refined edge detailing. Preserve safe margins near seams; avoid splitting key motifs across crown seams. Keep brim clean and bold, and keep strap/button minimal (solid or clean stripe accents)."
        : "Create an ultra-premium, advanced sportswear texture using the UV map as the only placement guide. Build layered material depth: primary motif, secondary micro-pattern, and subtle fabric weave. Keep motifs centered and symmetric on large panels, with clean mirrored flow. Use high-end technical aesthetics: precision lines, controlled gradients, refined edge detailing. Preserve safe margins near seams; avoid splitting key motifs across seams or thin strips. Use quieter, simplified treatments on trims/straps/waistbands (solid or clean stripe accents).";

    // Always use UV-guided generation, but incorporate user prompt if provided
    const effectivePrompt = prompt.trim() 
      ? `${uvOnlyPrompt} Style notes: ${prompt.trim()}`
      : uvOnlyPrompt;

    // Build clean prompt for Google Gemini
    const googlePrompt = [
      effectivePrompt,
      "seamless tileable pattern",
      modelGuard,
      uvDiscipline,
      uvAutoAnalysis,
      partHints,
      flowHints,
      consistencyHints,
      trimHints,
      uvLineGuard,
      textGuardrail,
      safetyGuard,
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
      generatePbr: false,
      model: "pro", // Always use Gemini 3 Pro for best quality
      aspectRatio: "1:1",
      resolution: "2K", // High resolution for professional textures
      textureStyle: "realistic",
      // Pass debug options for soccer jersey crew neck
      debugOptions: isSoccerJerseyCrewNeck ? {
        flipY: soccerJerseyDebug.flipY,
        backTransform: soccerJerseyDebug.backTransform,
        applyToBack: soccerJerseyDebug.applyToBack,
        useBackTexture: soccerJerseyDebug.useBackTexture,
      } : undefined,
    });

    if (googleResult && onTextureGenerated) {
      await onTextureGenerated(googleResult.texture, googleResult.imageUrl, {
        normalMapUrl: googleResult.normalMapUrl,
        roughnessMapUrl: googleResult.roughnessMapUrl,
      });
    }
  }, [prompt, uvMap, includePlayerInfo, playerName, jerseyNumber, generateGoogle, onTextureGenerated, currentModelUrl, uvAnalysisSummary, isSoccerJerseyCrewNeck, soccerJerseyDebug]);

  // Display var helpers
  const currentTextureUrl = googleUrl;

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
    if (scene && googleTexture) {
      applyGoogle(scene);
    }
  }, [googleTexture, scene, applyGoogle]);

  const canGenerate = uvMap && !isGenerating; // UV map is required, prompt is optional

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-3">
        {/* AI Provider Info */}
        <div className="text-center p-2 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-100">
          <div className="text-xs font-medium text-blue-700 mb-1">🤖 Google AI Gemini 3 Pro + UV Auto-Design</div>
          <div className="text-[10px] text-muted-foreground">Always uses UV map guidance for intelligent texture generation</div>
        </div>

        {/* Pattern Input - Optional when UV mode is active */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Custom Style Notes (Optional)</Label>
          <Input
            placeholder="Add extra style details (e.g., weathered, metallic, vintage)..."
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSelectedPreset(null);
            }}
            disabled={isGenerating}
            className="h-9"
          />
          <div className="text-[10px] text-muted-foreground">
            AI will create advanced patterns using UV map guidance. Add style notes to customize the look.
          </div>
        </div>

        {/* Pattern Presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Style Presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {PATTERN_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={isGenerating}
                className={cn(
                  "px-2 py-1 text-[10px] rounded-full border transition-all",
                  selectedPreset === preset
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Presets are applied with UV-guided placement for optimal results
          </div>
        </div>

        {/* Player Info for Back of Jersey */}
        <div className="space-y-2 p-2 bg-amber-50/50 rounded-lg border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <Label htmlFor="player-info-toggle" className="text-xs font-medium">
                Add Name & Number
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label htmlFor="player-name" className="text-[10px] text-muted-foreground">
                  Player Name
                </Label>
                <Input
                  id="player-name"
                  placeholder="SMITH"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  disabled={isGenerating}
                  className="h-8 text-xs uppercase"
                  maxLength={20}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="jersey-number" className="text-[10px] text-muted-foreground">
                  Number
                </Label>
                <Input
                  id="jersey-number"
                  placeholder="23"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  disabled={isGenerating}
                  className="h-8 text-xs"
                  maxLength={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Debug Options for Soccer Jersey Crew Neck */}
        {isSoccerJerseyCrewNeck && (
          <div className="space-y-3 p-3 bg-red-50/50 rounded-lg border border-red-200/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <Label className="text-sm font-medium text-red-700">
                Soccer Jersey Debug Options
              </Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Flip Y Debug */}
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-flip-y" className="text-xs">
                  Flip Y Texture
                </Label>
                <Switch
                  id="debug-flip-y"
                  checked={soccerJerseyDebug.flipY}
                  onCheckedChange={(checked) => setSoccerJerseyDebug({ flipY: checked })}
                  disabled={isGenerating}
                />
              </div>

              {/* Apply to Back Debug */}
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-apply-back" className="text-xs">
                  Apply to Back
                </Label>
                <Switch
                  id="debug-apply-back"
                  checked={soccerJerseyDebug.applyToBack}
                  onCheckedChange={(checked) => setSoccerJerseyDebug({ applyToBack: checked })}
                  disabled={isGenerating}
                />
              </div>

              {/* Use Back Texture Debug */}
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-back-texture" className="text-xs">
                  Use Back Texture
                </Label>
                <Switch
                  id="debug-back-texture"
                  checked={soccerJerseyDebug.useBackTexture}
                  onCheckedChange={(checked) => setSoccerJerseyDebug({ useBackTexture: checked })}
                  disabled={isGenerating}
                />
              </div>

              {/* Back Transform Debug */}
              <div className="space-y-1">
                <Label className="text-xs">Back Transform</Label>
                <Select
                  value={soccerJerseyDebug.backTransform}
                  onValueChange={(value: "none" | "mirrorX" | "mirrorY" | "rotate180") => setSoccerJerseyDebug({ backTransform: value })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mirrorX">Mirror X</SelectItem>
                    <SelectItem value="mirrorY">Mirror Y</SelectItem>
                    <SelectItem value="rotate180">Rotate 180°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-[10px] text-red-600 bg-red-100/50 p-2 rounded">
              <strong>Debug Mode:</strong> These options only affect the Soccer Jersey Crew Neck model. 
              Try different combinations to fix texture mapping issues.
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress || "Generating..."}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Design
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 text-center">
          {error}
        </div>
      )}

      {/* Result Preview */}
      {currentTextureUrl && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground">Generated Texture</h4>
          </div>

          <div className="aspect-square rounded-lg overflow-hidden border bg-muted/30 relative">
            <img src={currentTextureUrl} alt="Generated Texture" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center backdrop-blur-sm">
              AI Generated Design
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AITextureGenerator;
