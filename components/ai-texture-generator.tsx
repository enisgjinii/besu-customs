"use client";

import { useState, useCallback, useEffect } from "react";
import { useRunwareAI } from "@/hooks/use-runware-ai";
import { useGeminiAI } from "@/hooks/use-gemini-ai";
import { useHitemAI } from "@/hooks/use-hitem-ai";
import { useConfiguratorStore } from "@/lib/store";
import { analyzeUvLayoutFromDataUrl } from "@/lib/uv-layout-analyzer";
import { normalizeUvMapForAI, restoreNormalizedTextureToOriginalUV } from "@/lib/uv-map-normalization";
import { ensureUvIslandCoverage } from "@/lib/uv-coverage";
import {
  Loader2,
  Sparkles,
  Layers,
  Check,
  Image as ImageIcon,
  Box,
  User,
  Hash,
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
  const [uvOnlyMode, setUvOnlyMode] = useState(true); // Always start with UV-only mode enabled

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
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);

  // Check if current model is soccer jersey crew neck
  const isSoccerJerseyCrewNeck =
    currentModelUrl?.includes("soccer-jersey-crew-neck.glb") ||
    currentModelUrl?.includes("soccer-jersey-crew-neck_FIXED.glb") ||
    false;

  const [uvAnalysisSummary, setUvAnalysisSummary] = useState<string | null>(
    null,
  );
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);

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

  const loadTextureFromUrl = useCallback((imageUrl: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        imageUrl,
        (tex) => {
          tex.flipY = false;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = 16;
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        () => reject(new Error("Failed to load processed AI texture")),
      );
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uvMap) return;
    setGeneratedPreviewUrl(null);

    const modelUrl = (currentModelUrl || "").toLowerCase();
    const modelType = modelUrl.includes("baseball-caps")
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

    const uvDiscipline =
      "Respect the provided UV layout: map artwork cleanly to the correct panels without stretching across seams; keep orientation upright and symmetric";

    const baseTextureNote =
      modelType === "duffle-bag"
        ? "Flat 2D duffle bag texture for sublimation printing; no lighting, shading, or baked shadows"
        : "Flat 2D jersey texture for sublimation; no lighting, shading, or baked shadows";

    const partHints =
      modelType === "baseball cap"
        ? "UV guide for cap: crown panels are large curved islands; brim is a long curved shell; strap and button are small islands. Keep motifs aligned across crown panels; keep brim clean and avoid tiny details on strap/button."
        : modelType === "duffle-bag"
          ? "UV guide for duffle bag: The LARGE rectangular island is the main barrel body that wraps around the cylindrical bag. Two ROUND/OVAL islands are the end caps (left and right ends). Thin LONG rectangles are handles and shoulder strap. A MEDIUM rectangle is the top zipper panel/flap. Small rectangles are strap pads and reinforcement patches. Keep the main motif on the barrel body with seamless horizontal wrap; end caps should have centered circular designs that complement the body."
          : "UV guide: large torso panels, side strips, trims, and small bands. Keep flow vertical and mirrored. Avoid splitting key motifs across seams.";

    const flowHints =
      modelType === "baseball cap"
        ? "Use a primary motif across crown panels, with a cleaner treatment on the brim. Keep strap/button simple."
        : modelType === "duffle-bag"
          ? "The barrel body wraps horizontally around the bag — design must tile/flow seamlessly left-to-right so the seam is invisible. End cap designs should radiate from center outward. Handles and straps should have simple bold accents that complement the main barrel motif."
          : "Use large-scale motifs on main panels, smaller repeats on side strips, subtle details on trims; keep all panels consistent in palette and flow";

    const consistencyHints =
      modelType === "duffle-bag"
        ? "The barrel body is the hero surface — it should carry the primary design with strong visual impact. Both end caps must match each other and complement the barrel. The zipper panel should coordinate with the barrel. Handles/straps should use accent colors from the main palette. The overall bag must look like a cohesive premium product — not random patterns on each piece."
        : "Front + back large torso panels must match stylistically: same palette, same centerline flow, same motif scale. If you place an emblem/animal, keep it centered within the large torso panels and ensure it still looks correct when UV shells are mirrored. The overall design must look like a cohesive brand identity — not random patterns on each panel";

    const trimHints =
      modelType === "duffle-bag"
        ? "Handles and straps should be solid color or simple bold stripe — avoid complex motifs on narrow pieces to prevent distortion. Strap pads and reinforcement patches should be solid accent colors. The zipper panel can have a subtle pattern or clean accent stripe. Never leave any UV island blank or white — every piece must have intentional design."
        : "Keep thin trim/strap/waistband islands simple (solid color or clean stripes). Avoid complex icons on thin strips to prevent distortion. Never leave any panel blank or white — every area must have intentional design";

    const uvLineGuard =
      "Do not render the UV wireframe/black outline lines; the final image must be clean artwork only";

    const safetyGuard =
      "Safety: no nudity, no people, no faces, no violence, no hate symbols, no weapons. No brand logos or copyrighted characters.";

    const uvAutoAnalysis = uvAnalysisSummary
      ? `Auto UV analysis: ${uvAnalysisSummary}`
      : null;

    const uvOnlyPrompt =
      modelType === "baseball cap"
        ? "Create an ultra-premium, award-winning baseball cap texture using the UV map as the STRICT placement guide. Build three layers of material depth: (1) primary bold motif across crown panels, (2) secondary micro-pattern for visual richness, (3) subtle fabric weave texture for realism. Keep motifs centered and perfectly symmetric across crown panels with clean mirrored flow. Use premium technical aesthetics: precision lines, controlled color gradients, refined edge detailing, rich material feel. Preserve safe margins near seams; never split key motifs across crown seams. Keep brim bold and clean, strap/button minimal with solid or clean stripe accents. Every UV island must be filled with intentional design — no blank areas."
        : modelType === "duffle-bag"
          ? "Create an ultra-premium, award-winning DUFFLE BAG texture. CRITICAL: The reference UV map image shows the EXACT shapes and positions of each bag piece as gray outlines on white background. You MUST paint your design ONLY within these existing outlined shapes — do NOT create new shapes, do NOT move or resize any shapes, do NOT add extra pieces. Keep the white space between shapes completely empty/white. Fill each existing shape with bold, cohesive design: the large body panels get the primary motif, round/oval shapes get centered complementary designs, thin rectangles (handles/straps) get simple bold accents, and small pieces get solid accent colors. Use premium technical aesthetics with vibrant colors suitable for sublimation printing."
          : "Create an ultra-premium, award-winning sportswear texture using the UV map as the STRICT placement guide. Build three layers of material depth: (1) primary bold motif on main panels, (2) secondary micro-pattern for visual richness, (3) subtle fabric weave texture for realism. Keep motifs centered and perfectly symmetric on large panels, with clean mirrored vertical flow. Use premium technical aesthetics: precision lines, controlled color gradients, refined edge detailing, rich material feel. Preserve safe margins near seams; never split key motifs across seams or thin strips. Use quieter, simplified treatments on trims/straps/waistbands (solid or clean stripe accents). Front and back panels must feel like a cohesive design — same palette, same visual language. Every UV island must be filled with intentional design — no blank or white areas.";

    // Always use UV-guided generation, but incorporate user prompt if provided
    const effectivePrompt = prompt.trim()
      ? `${uvOnlyPrompt} Style notes: ${prompt.trim()}`
      : uvOnlyPrompt;

    // Build clean prompt for Google Gemini
    const googlePrompt = [
      effectivePrompt,
      "seamless tileable pattern, production-quality sublimation print",
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
      modelType === "duffle-bag"
        ? "Use the UV image as strict placement guide for each duffle bag piece — barrel body, end caps, handles, zipper panel"
        : "Use the UV image as strict placement guide for each jersey panel",
      baseTextureNote,
      "CRITICAL: Paint ONLY within the existing UV island outlines from the reference image. Do NOT create, add, move, or reshape any shapes. Keep white space between islands empty. Every existing shape must be completely filled with design — no blank areas within shapes. The output must have the EXACT same layout as the reference UV map.",
      "Color accuracy: use rich, vibrant, saturated colors that will reproduce well in sublimation printing — avoid washed-out or muted tones",
    ]
      .filter(Boolean)
      .join(". ");

    console.log("🎨 Calling Google Gemini Pro with advanced settings:", {
      prompt: googlePrompt,
      model: "pro",
      resolution: "2K",
    });

    // Some models use UVs packed into a tiny central region.
    // Normalize UV guide for AI readability, then map the result back to raw UV space.
    const normalizedUV = await normalizeUvMapForAI(uvMap);

    const googleResult = await generateGoogle({
      prompt: googlePrompt,
      uvMap: normalizedUV.normalizedUvMapUrl,
      generatePbr: false,
      model: "pro", // Always use Gemini 3 Pro for best quality
      aspectRatio: "1:1",
      resolution: "2K", // High resolution for professional textures
      textureStyle: "realistic",
      productType: modelType,
      // Pass debug options for soccer jersey crew neck
      debugOptions: isSoccerJerseyCrewNeck
        ? {
            flipY: soccerJerseyDebug.flipY,
            backTransform: soccerJerseyDebug.backTransform,
            applyToBack: soccerJerseyDebug.applyToBack,
            useBackTexture: soccerJerseyDebug.useBackTexture,
          }
        : undefined,
    });

    if (googleResult && onTextureGenerated) {
      let finalImageUrl = googleResult.imageUrl;
      let finalTexture = googleResult.texture;

      if (normalizedUV.transform) {
        finalImageUrl = await restoreNormalizedTextureToOriginalUV(
          finalImageUrl,
          normalizedUV.transform,
        );
      }

      const coverageResult = await ensureUvIslandCoverage({
        textureUrl: finalImageUrl,
        uvMapUrl: uvMap,
      });
      finalImageUrl = coverageResult.imageUrl;

      if (finalImageUrl !== googleResult.imageUrl) {
        try {
          finalTexture = await loadTextureFromUrl(finalImageUrl);
        } catch (e) {
          console.warn("Failed to load corrected texture, using original", e);
        }
      }

      setGeneratedPreviewUrl(finalImageUrl);

      await onTextureGenerated(finalTexture, finalImageUrl, {
        normalMapUrl: googleResult.normalMapUrl,
        roughnessMapUrl: googleResult.roughnessMapUrl,
      });
    }
  }, [
    prompt,
    uvMap,
    includePlayerInfo,
    playerName,
    jerseyNumber,
    generateGoogle,
    onTextureGenerated,
    currentModelUrl,
    uvAnalysisSummary,
    isSoccerJerseyCrewNeck,
    soccerJerseyDebug,
    loadTextureFromUrl,
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

  const canGenerate = uvMap && !isGenerating; // UV map is required, prompt is optional

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

      {/* Error */}
      {error && (
        <div className="p-1.5 bg-destructive/10 text-destructive text-[10px] rounded border border-destructive/20 text-center">
          {error}
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
