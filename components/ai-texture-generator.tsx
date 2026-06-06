"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGeminiAI } from "@/hooks/use-gemini-ai";
import { useConfiguratorStore } from "@/lib/store";
import {
  Loader2,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillToggle } from "@/components/ui/pill-toggle";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  extractTeamNameFromPrompt,
  normalizeUniformTeamName,
} from "@/lib/team-text-placement";
import * as THREE from "three";
import { toast } from "sonner";

interface AITextureGeneratorProps {
  scene?: THREE.Object3D;
  onTextureGenerated?: (
    texture: THREE.Texture,
    url: string,
    options?: {
      normalMapUrl?: string | null;
      roughnessMapUrl?: string | null;
      teamName?: string | null;
    },
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

const CORRECTION_PREFIX =
  "Revise the current uniform design using these corrections:";

type GenerationMode = "flash" | "premium";

const GENERATION_MODE_CONFIG: Record<
  GenerationMode,
  {
    label: string;
    shortLabel: string;
    description: string;
    model: "flash" | "pro";
    resolution: "1K" | "4K";
  }
> = {
  flash: {
    label: "Flash",
    shortLabel: "Fast draft",
    description: "Lower latency preview using Gemini Flash.",
    model: "flash",
    resolution: "1K",
  },
  premium: {
    label: "Premium",
    shortLabel: "Best quality",
    description: "Higher-detail generation using Gemini Pro. Slower but better.",
    model: "pro",
    resolution: "4K",
  },
};

export function AITextureGenerator({
  onTextureGenerated,
  className,
}: AITextureGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("premium");

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

  const handleGenerate = useCallback(async (mode: "new" | "correction" = "new") => {
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
    const detectedTeamName =
      modelType === "jersey and shorts"
        ? normalizeUniformTeamName(extractTeamNameFromPrompt(prompt) ?? "")
        : "";
    const wantsPersonalization =
      includePlayerInfo && (cleanName.length > 0 || cleanNumber.length > 0);

    const teamIdentityGuardrail = detectedTeamName
      ? [
          `Team identity: the team name is "${detectedTeamName}".`,
          `Create an original team logo or monogram inspired by the user's theme; do not copy an existing sports logo.`,
          `Reserve a clean, readable front-chest wordmark zone for "${detectedTeamName}" that fits within the jersey torso from shoulder to shoulder.`,
          "Small matching logo marks may appear on the waistband, short leg, or back neck only when they improve the uniform.",
        ].join(" ")
      : null;

    const typographyGuardrail = [
      wantsPersonalization
        ? [
            cleanName
              ? `Place the player name "${cleanName}" once across the upper back`
              : null,
            cleanNumber
              ? `Place a single jersey number "${cleanNumber}" centered on the back`
              : null,
          ]
            .filter(Boolean)
            .join(". ")
        : null,
      modelType === "duffle-bag"
        ? "Do not add names, numbers, letters, words, logos, or watermarks anywhere on the bag."
        : detectedTeamName
          ? `Do not add random text, unrelated words, watermarks, or oversized typography. The only front text should be the "${detectedTeamName}" team identity.`
          : "Do not add any names, numbers, letters, words, logos, or watermarks anywhere on the jersey; keep all panels free of typography.",
    ]
      .filter(Boolean)
      .join(" ");

    const trimmedPrompt = prompt.trim();
    const trimmedCorrection = correctionPrompt.trim();
    const basePrompt =
      mode === "correction" && trimmedCorrection.length > 0
        ? [
            trimmedPrompt || "Use the current generated uniform as the design direction.",
            `${CORRECTION_PREFIX} ${trimmedCorrection}`,
            "Preserve the same team identity unless the correction explicitly changes it.",
          ].join(" ")
        : trimmedPrompt.length > 0
          ? trimmedPrompt
          : "Create a premium sports design with balanced composition.";
    const googlePrompt = [
      basePrompt,
      modelGuard,
      teamIdentityGuardrail,
      typographyGuardrail,
      "Use the provided UV map as strict placement guide.",
      "Keep output as flat 2D texture only (no lighting, no shadows).",
      "Fill all UV islands with design and keep style coherent.",
      "Do not add watermarks or extra text beyond the allowed team/player identity.",
    ]
      .filter(Boolean)
      .join(" ");

    const selectedGenerationMode = GENERATION_MODE_CONFIG[generationMode];

    console.log("Calling Gemini texture generation:", {
      prompt: googlePrompt,
      mode: generationMode,
      model: selectedGenerationMode.model,
      resolution: selectedGenerationMode.resolution,
    });

    const result = await generateGoogle({
      prompt: googlePrompt,
      uvMap: uvGuide,
      generatePbr: false,
      model: selectedGenerationMode.model,
      aspectRatio: "1:1",
      resolution: selectedGenerationMode.resolution,
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
        teamName: detectedTeamName || null,
      });
    }

    if (mode === "correction") {
      setShowCorrectionForm(false);
      setCorrectionPrompt("");
    }
  }, [
    prompt,
    correctionPrompt,
    uvMap,
    uvMask,
    includePlayerInfo,
    playerName,
    jerseyNumber,
    generationMode,
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
      {!uvMap && !uvMask && (
        <div className="rounded-xl border border-dashed px-3 py-2 text-[10px] text-muted-foreground">
          The garment UV guide is still loading. Texture generation will unlock
          once it is ready.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="ai-texture-prompt" className="text-xs font-medium">
          Describe the overall look
        </Label>
        <Textarea
          id="ai-texture-prompt"
          placeholder="Example: black base with silver geometric side panels and a subtle carbon fiber texture."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setSelectedPreset(null);
          }}
          disabled={isGenerating}
          className="min-h-[92px] resize-none text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          This option creates a full texture mapped across the entire product.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Generation mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(GENERATION_MODE_CONFIG) as Array<
            [GenerationMode, (typeof GENERATION_MODE_CONFIG)[GenerationMode]]
          >).map(([modeKey, modeConfig]) => {
            const isActive = generationMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => setGenerationMode(modeKey)}
                disabled={isGenerating}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/8 shadow-sm"
                    : "border-border bg-background hover:border-primary/30",
                  isGenerating && "cursor-not-allowed opacity-60",
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {modeConfig.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {modeConfig.resolution}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {modeConfig.shortLabel}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                  {modeConfig.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground">
          Quick ideas
        </p>
        <div className="flex flex-wrap gap-2">
          {PATTERN_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isGenerating}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                selectedPreset === preset
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label
              htmlFor="player-info-toggle"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <User className="h-3.5 w-3.5" />
              Add player name and number
            </Label>
            <p className="text-[10px] text-muted-foreground">
              Optional. The AI will place them on the back area only.
            </p>
          </div>
          <PillToggle
            checked={includePlayerInfo}
            onCheckedChange={setIncludePlayerInfo}
            disabled={isGenerating}
          />
        </div>

        {includePlayerInfo && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Input
              placeholder="NAME"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              disabled={isGenerating}
              className="h-8 text-xs uppercase"
              maxLength={20}
            />
            <Input
              placeholder="00"
              value={jerseyNumber}
              onChange={(e) =>
                setJerseyNumber(e.target.value.replace(/\D/g, "").slice(0, 3))
              }
              disabled={isGenerating}
              className="h-8 text-xs"
              maxLength={3}
            />
          </div>
        )}
      </div>

      {isSoccerJerseyCrewNeck && (
        <details className="group rounded-xl border bg-muted/20 px-3 py-2.5 text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Soccer jersey fixes
            <span className="ml-auto text-muted-foreground transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>

          <div className="mt-3 space-y-3 rounded-lg border bg-background p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px]">Flip Y</span>
                <PillToggle
                  checked={soccerJerseyDebug.flipY}
                  onCheckedChange={(checked) =>
                    setSoccerJerseyDebug({ flipY: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]">Back texture</span>
                <PillToggle
                  checked={soccerJerseyDebug.useBackTexture}
                  onCheckedChange={(checked) =>
                    setSoccerJerseyDebug({ useBackTexture: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground">
                Back transform
              </span>
              <Select
                value={soccerJerseyDebug.backTransform}
                onValueChange={(value: any) =>
                  setSoccerJerseyDebug({ backTransform: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
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

            <div className="space-y-2 border-t pt-3">
              <span className="block text-[10px] font-medium">UV alignment</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "uvOffsetX",
                  "uvOffsetY",
                  "uvRepeatX",
                  "uvRepeatY",
                  "uvRotation",
                ].map((key) => {
                  const value =
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
                          {value.toFixed(key.includes("Rotation") ? 0 : 2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) =>
                          setSoccerJerseyDebug({
                            [key]: parseFloat(e.target.value),
                          })
                        }
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </details>
      )}

      <Button
        onClick={() => handleGenerate("new")}
        disabled={!canGenerate}
        className="h-10 w-full text-sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress || "Generating..."}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {generationMode === "premium"
              ? "Generate premium full texture"
              : "Generate flash full texture"}
          </>
        )}
      </Button>

      {currentTextureUrl && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold">Need changes?</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                Describe what to fix and generate a corrected AI version.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-3 text-[10px]"
              onClick={() => setShowCorrectionForm((value) => !value)}
              disabled={isGenerating}
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              Make corrections
            </Button>
          </div>

          {showCorrectionForm && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="ai-correction-prompt" className="text-[10px] font-medium">
                What should change?
              </Label>
              <Textarea
                id="ai-correction-prompt"
                value={correctionPrompt}
                onChange={(event) => setCorrectionPrompt(event.target.value)}
                disabled={isGenerating}
                placeholder="Example: make the eagle larger, reduce the red, and put more blue on the shorts."
                className="min-h-[76px] resize-none text-xs"
              />
              <Button
                type="button"
                className="h-9 w-full text-xs"
                disabled={!canGenerate || correctionPrompt.trim().length < 3}
                onClick={() => handleGenerate("correction")}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Correcting...
                  </>
                ) : (
                  "Generate corrected version"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 min-w-max text-xs font-semibold">⚠ Error:</div>
            <div className="flex-1">
              <p className="text-xs leading-snug">{error}</p>
              <div className="mt-1.5 space-y-1 text-[10px] opacity-75">
                {error.includes("quota") && (
                  <>
                    <p>💡 Try using Gemini Flash instead (lower cost)</p>
                    <p>💡 Wait a few minutes and try again</p>
                  </>
                )}
                {error.includes("Authentication") && (
                  <>
                    <p>💡 Check your API key in .env file</p>
                    <p>💡 Restart the dev server after updating keys</p>
                  </>
                )}
                {error.includes("temporarily unavailable") && (
                  <p>💡 Gemini service is down. Please try again in a moment.</p>
                )}
                {error.includes("Invalid request") && (
                  <p>💡 Try simplifying your prompt or using a preset pattern</p>
                )}
                {!error.includes("quota") &&
                  !error.includes("Authentication") &&
                  !error.includes("unavailable") &&
                  !error.includes("Invalid") && (
                    <p>💡 Check browser console (F12) for detailed error logs</p>
                  )}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={() => handleGenerate("new")}
            disabled={isGenerating || !canGenerate}
          >
            Try Again
          </Button>
        </div>
      )}

      {currentTextureUrl && (
        <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
          <p className="text-xs font-medium">Latest preview</p>
          <div className="relative mx-auto aspect-square max-h-[180px] overflow-hidden rounded-lg border bg-background">
            <img
              src={currentTextureUrl}
              alt="Result"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AITextureGenerator;
