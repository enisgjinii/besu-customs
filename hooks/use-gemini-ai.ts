"use client";

import { useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { generateNormalMap, generateRoughnessMap, loadImage } from "@/lib/texture-utils";

/**
 * 
 * s
 * Advanced Gemini AI Texture Generation Hook
 *
 * Uses Google's Nano Banana image generation models:
 * - gemini-3.1-flash-image-preview: Latest high-efficiency image model with improved quality and 4K support
 * - gemini-3-pro-image-preview: Nano Banana Pro with "Thinking" for professional 4K textures
 * 
 * Features:
 * - Native image generation with UV-aware mapping
 * - Up to 4K resolution output (Pro model)
 * - Aspect ratio control
 * - Professional texture prompting
 * - Advanced reasoning for complex compositions
 * 
 * API Reference: https://ai.google.dev/gemini-api/docs/image-generation
 */

export interface GeminiTextureOptions {
  /** Text prompt describing the desired texture */
  prompt: string;
  /** UV map image (base64 or data URL) */
  uvMap: string;
  /** Whether to generate PBR maps (Normal, Roughness) locally */
  generatePbr?: boolean;
  /** Model to use: "flash" (fast) or "pro" (highest quality with thinking) */
  model?: "flash" | "pro";
  /** Aspect ratio for the generated image */
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";
  /** Image resolution - only for Pro model */
  resolution?: "1K" | "2K" | "4K";
  /** Texture style preset */
  textureStyle?: "realistic" | "stylized" | "fabric" | "metallic" | "organic";
  /** Product type for context-aware prompt (e.g. "duffle-bag", "baseball cap") */
  productType?: string;
  /** Optional debug options for specific models */
  debugOptions?: {
    flipY?: boolean;
    backTransform?: "mirrorX" | "mirrorY" | "rotate180" | "none";
    applyToBack?: boolean;
    useBackTexture?: boolean;
  };
}

export interface GeminiGenerationResult {
  imageUrl: string;
  texture: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  modelUsed: string;
  resolution: string;
}

export interface UseGeminiAIReturn {
  textureUrl: string | null;
  texture: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  normalMapUrl: string | null;
  roughnessMapUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  progress: string | null;
  generateTexture: (options: GeminiTextureOptions) => Promise<GeminiGenerationResult | null>;
  applyToScene: (scene: THREE.Object3D, filter?: (name: string) => boolean) => void;
  clearTexture: () => void;
}

// Latest Gemini models for image generation (Nano Banana family)
const GEMINI_MODELS = {
  // Nano Banana 2 - Latest all-around image model optimized for speed and high-volume use cases
  flash: "gemini-3.1-flash-image-preview",
  // Nano Banana Pro - Gemini 3 Pro Image Preview with advanced reasoning, up to 4K
  pro: "gemini-3-pro-image-preview",
} as const;

// Professional texture generation prompt templates
const TEXTURE_STYLE_PROMPTS: Record<string, string> = {
  realistic: "photorealistic, high-fidelity, accurate material representation",
  stylized: "stylized, artistic interpretation, bold colors and patterns",
  fabric: "textile texture, woven fabric details, thread patterns visible",
  metallic: "metallic surface, reflective qualities, brushed or polished finish",
  organic: "natural organic texture, subtle variations, living material feel",
};

export function useGeminiAI(): UseGeminiAIReturn {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const [normalMapUrl, setNormalMapUrl] = useState<string | null>(null);
  const [normalMap, setNormalMap] = useState<THREE.Texture | null>(null);

  const [roughnessMapUrl, setRoughnessMapUrl] = useState<string | null>(null);
  const [roughnessMap, setRoughnessMap] = useState<THREE.Texture | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const loaderRef = useRef(new THREE.TextureLoader());

  const buildGeminiRequestBody = useCallback(
    (
      enhancedPrompt: string,
      uvMap: string,
      resolution: GeminiTextureOptions["resolution"],
    ): Record<string, unknown> => {
      const mimeType = getMimeType(uvMap);
      const base64Image = toBase64(uvMap);

      return {
        contents: [
          {
            parts: [
              { text: enhancedPrompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_modalities: ["TEXT", "IMAGE"],
          temperature: 0.6,
          maxOutputTokens: 16384,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      };
    },
    [],
  );

  const parseGeminiErrorMessage = useCallback(
    (errorData: unknown, status: number): string => {
      if (!errorData || typeof errorData !== "object") {
        return `API Error ${status}: Unable to connect to Gemini service`;
      }

      const record = errorData as Record<string, unknown>;
      
      // Try nested error object first
      const nestedError =
        typeof record.error === "object" && record.error !== null
          ? (record.error as Record<string, unknown>)
          : null;

      // Try to get message from various paths
      let message =
        typeof nestedError?.message === "string"
          ? nestedError.message
          : typeof record.message === "string"
            ? record.message
            : "";

      // Check for error details in nested structures
      if (!message && nestedError?.details) {
        const details = Array.isArray(nestedError.details)
          ? nestedError.details[0]
          : nestedError.details;
        if (typeof details === "object" && details !== null) {
          const detail = details as Record<string, unknown>;
          message =
            typeof detail.description === "string"
              ? detail.description
              : typeof detail.message === "string"
                ? detail.message
                : "";
        }
      }

      // Fallback messages based on HTTP status
      if (!message) {
        switch (status) {
          case 400:
            message = "Invalid request to Gemini API. Check your prompt or settings.";
            break;
          case 401:
          case 403:
            message = "Authentication failed. Check your API key configuration.";
            break;
          case 429:
            message = "API quota exceeded. Please try again later or use Gemini Flash (lower cost).";
            break;
          case 500:
          case 502:
          case 503:
            message = "Gemini service is temporarily unavailable. Please try again later.";
            break;
          default:
            message = `Gemini API error: ${status}`;
        }
      }

      return message;
    },
    [],
  );

  // Convert data URL to base64 (strip prefix)
  const toBase64 = (dataUrl: string): string => {
    if (dataUrl.startsWith("data:")) {
      return dataUrl.split(",")[1] || dataUrl;
    }
    return dataUrl;
  };

  // Get MIME type from data URL
  const getMimeType = (dataUrl: string): string => {
    if (dataUrl.startsWith("data:")) {
      return dataUrl.substring(5, dataUrl.indexOf(";"));
    }
    return "image/png"; // Default
  };

  // Load texture with proper UV settings
  const loadTexture = useCallback((url: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      loaderRef.current.load(
        url,
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
        (err) => reject(new Error("Failed to load Gemini texture"))
      );
    });
  }, []);

  const generateTexture = useCallback(async (
    options: GeminiTextureOptions
  ): Promise<GeminiGenerationResult | null> => {
    setIsGenerating(true);
    setError(null);
    setProgress("Initializing Gemini AI...");

    // Reset previous maps and dispose textures to avoid memory leaks
    setNormalMap((prev) => {
      prev?.dispose();
      return null;
    });
    setRoughnessMap((prev) => {
      prev?.dispose();
      return null;
    });
    setNormalMapUrl(null);
    setRoughnessMapUrl(null);

    const selectedModel: "flash" | "pro" = options.model === "flash" ? "flash" : "pro";
    const normalizedResolution: GeminiTextureOptions["resolution"] =
      selectedModel === "flash"
        ? "1K"
        : (options.resolution ?? "2K");
    const {
      prompt,
      uvMap,
      generatePbr = false,
      aspectRatio = "1:1",
      textureStyle = "realistic",
      productType,
    } = options;

    try {
      // Build professional texture generation prompt
      const styleModifier = TEXTURE_STYLE_PROMPTS[textureStyle] || TEXTURE_STYLE_PROMPTS.realistic;
      
      const enhancedPrompt = `
You are a world-class professional texture artist. Generate a PERFECT, production-ready texture map.

STEP 1 — DEEP UV MAP ANALYSIS (do this FIRST, before generating anything):
Carefully study the attached reference image. It is the UV layout/unwrap of a 3D ${productType === "duffle-bag" ? "duffle bag" : productType === "baseball cap" ? "baseball cap" : "sportswear"} model.
- Count the EXACT number of shapes (UV islands) visible in the image
- Note each shape's EXACT position on the canvas (top-left, center, bottom-right, etc.)
- Note each shape's EXACT proportions (tall/narrow, wide/short, circular, triangular, etc.)
- Note the EXACT size of each shape relative to the canvas
- Note all the white/empty gaps between shapes — these MUST remain empty
- The shapes are shown as gray/dark filled regions or outlines on a white background

STEP 2 — GENERATE THE TEXTURE:
Now paint your design ONLY within the shapes you identified in Step 1.

${productType === "duffle-bag" ? "PRODUCT: This is a DUFFLE BAG. The shapes represent the bag's body panels, end caps, handles, straps, and zipper flap." : productType === "baseball cap" ? "PRODUCT: This is a BASEBALL CAP. The shapes represent crown panels, brim, button, and strap." : "PRODUCT: This is sportswear. The shapes represent garment panels (front, back, sleeves, sides, trims)."}

TEXTURE DESCRIPTION: ${prompt}

STYLE: ${styleModifier}

RESOLUTION: ${normalizedResolution} (${normalizedResolution === "4K" ? "4096x4096" : normalizedResolution === "2K" ? "2048x2048" : "1024x1024"})
ASPECT RATIO: ${aspectRatio}

ABSOLUTE REQUIREMENTS (follow ALL precisely):
1. Output a FLAT 2D texture map (albedo/diffuse ONLY) — absolutely NO 3D lighting, NO shadows, NO highlights, NO shading, NO ambient occlusion baked in
2. The output image MUST have the EXACT SAME number of shapes, in the EXACT SAME positions, with the EXACT SAME sizes and proportions as the reference UV map
3. Paint ONLY inside the existing UV island outlines — do NOT invent, add, move, reshape, merge, or split any islands
4. Keep ALL white/empty space BETWEEN UV islands completely white/empty — do NOT fill gaps between shapes
5. Each UV island must have coherent, complete texture coverage — no blank/white areas WITHIN the shapes
6. Colors must be vibrant, saturated, and production-quality (suitable for dye-sublimation printing)
7. Maintain visual continuity and consistent style across ALL UV islands
8. The design must be symmetric where the product is symmetric
9. Transitions between panels should feel natural when the 3D model is assembled
10. Do NOT render any UV wireframe lines, guidelines, or grid — output CLEAN artwork only, but the shape boundaries must match the reference exactly

QUALITY CHECKLIST:
${productType === "duffle-bag" ? `- Barrel body: Main design surface, bold motif that wraps seamlessly around the cylinder
- End caps: Centered radial designs complementing the barrel body
- Handles/Straps: Simple bold accents, solid or clean stripe
- Zipper panel: Clean complementary treatment
- Strap pads: Solid accent colors
- Color palette: Maximum 5-7 colors, cohesive and vibrant
- Pattern scale: Appropriate for bag size (not too small, not too large)` : `- Front panel: Main design, centered composition, eye-catching
- Back panel: Complementary design, cohesive with front
- Sleeves: Matching accent pattern, properly scaled
- Side panels: Consistent with main design flow
- Trims/bands: Simple, clean treatment (solid or subtle accent)
- Color palette: Maximum 5-7 colors, cohesive and vibrant
- Pattern scale: Appropriate for garment size (not too small, not too large)`}

OUTPUT: First think carefully about the UV layout analysis (Step 1), then generate the texture image (Step 2). The final image must be pixel-perfect in matching the reference UV map's shape positions and proportions.
      `.trim();

      const requestBody = buildGeminiRequestBody(
        enhancedPrompt,
        uvMap,
        normalizedResolution,
      );

      const modelName = GEMINI_MODELS[selectedModel];
      setProgress(
        `Generating with ${selectedModel === "pro" ? "Gemini 3 Pro" : "Gemini 3.1 Flash Image"} (${normalizedResolution})...`,
      );

      console.log(" Gemini Advanced Request:", {
        endpoint: "/api/gemini/generate-texture",
        model: modelName,
        resolution: normalizedResolution,
        aspectRatio,
        textureStyle,
        promptLength: enhancedPrompt.length,
      });

      const response = await fetch("/api/gemini/generate-texture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          requestBody,
        }),
      });

      if (!response.ok) {
        let errorData: unknown = null;
        let rawText = "";

        try {
          rawText = await response.text();
          errorData = rawText ? JSON.parse(rawText) : null;
        } catch {
          // If JSON parsing fails, try to extract useful info from text
          console.warn("Failed to parse error response as JSON:", rawText);
        }

        const errorMessage = parseGeminiErrorMessage(errorData, response.status);
        const fallbackRecommended =
          !!errorData &&
          typeof errorData === "object" &&
          Boolean((errorData as Record<string, unknown>).fallbackRecommended);

        console.warn("❌ Gemini API request failed", {
          status: response.status,
          statusText: response.statusText,
          model: modelName,
          message: errorMessage,
          fallbackRecommended,
          rawErrorData: errorData,
          rawText: rawText.substring(0, 500), // First 500 chars of raw response
        });

        if (fallbackRecommended && selectedModel === "pro") {
          setProgress("Gemini Pro quota exceeded. Retrying with Gemini Flash (1K)...");

          return await generateTexture({
            ...options,
            model: "flash",
            resolution: "1K",
          });
        }

        const normalizedError = errorMessage.toLowerCase();
        if (normalizedError.includes("quota") || response.status === 429) {
          throw new Error("API quota exceeded. Please try again later or switch to Gemini Flash model (lower cost).");
        }
        if (normalizedError.includes("not found") || response.status === 404) {
          throw new Error(`Model ${modelName} not available. Try switching to Gemini Flash.`);
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please check your API key in the .env file.");
        }
        throw new Error(errorMessage || `Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(" Gemini API Response:", {
        hasCandidates: !!data?.candidates,
        candidateCount: data?.candidates?.length,
        finishReason: data?.candidates?.[0]?.finishReason,
        partsCount: data?.candidates?.[0]?.content?.parts?.length,
      });

      // Extract image from response
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let generatedImageBase64: string | null = null;
      let generatedImageMimeType = "image/png";
      let thoughtText: string | null = null;

      // Process all parts - collect final image (skip thought images)
      for (const part of parts) {
        // Collect any text reasoning (for debugging)
        if (part.text && !part.thought) {
          thoughtText = part.text;
        }

        // Skip thought/intermediate images - we want the final output
        if (part.thought === true) {
          console.log(" Skipping thought image...");
          continue;
        }

        // Check for inline_data (handles both camelCase and snake_case)
        const inline = part.inline_data || part.inlineData;
        if (inline?.data) {
          generatedImageBase64 = inline.data;
          generatedImageMimeType = inline.mime_type || inline.mimeType || "image/png";
          console.log(" Found generated image:", {
            mimeType: generatedImageMimeType,
            dataLength: generatedImageBase64?.length,
            hasThoughtSignature: !!part.thought_signature,
          });
          // Don't break - we want the LAST non-thought image (final output)
        }

        // Fallback: image as data URL in text
        if (typeof part.text === "string" && !part.thought) {
          const dataUrlMatch = part.text.match(/^data:([^;]+);base64,(.+)$/);
          if (dataUrlMatch) {
            generatedImageMimeType = dataUrlMatch[1] || "image/png";
            generatedImageBase64 = dataUrlMatch[2];
            console.log(" Found image in text as data URL");
          }
        }
      }

      if (thoughtText) {
        console.log(" Model reasoning:", thoughtText.substring(0, 200) + "...");
      }

      if (!generatedImageBase64) {
        // Log detailed error info for debugging
        const finishReason = candidate?.finishReason || candidate?.finish_reason;
        const blockReason = data?.promptFeedback?.blockReason;
        const safetyRatings = candidate?.safetyRatings || data?.promptFeedback?.safetyRatings;
        
        console.error(" No image in response:", {
          finishReason,
          blockReason,
          safetyRatings,
          partsCount: parts.length,
          partTypes: parts.map((p: Record<string, unknown>) => ({
            hasText: !!p.text,
            hasInlineData: !!(p.inline_data || p.inlineData),
            isThought: p.thought,
          })),
        });

        if (finishReason === "SAFETY" || blockReason) {
          throw new Error(
            `Generation blocked by safety filters. Reason: ${blockReason || finishReason}. Try a different prompt.`
          );
        }

        if (finishReason === "STOP" && parts.length === 0) {
          throw new Error(
            "Gemini returned no content. The model may not support this type of request. Try simplifying your prompt."
          );
        }

        throw new Error(
          `Gemini did not return an image (finish: ${finishReason || "unknown"}). Try a simpler prompt or different model.`
        );
      }

      const imageUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`;

      setProgress("Processing texture...");
      const tex = await loadTexture(imageUrl);

      setTextureUrl(imageUrl);
      setTexture((prev) => {
        if (prev && prev !== tex) prev.dispose();
        return tex;
      });

      let normMap: THREE.Texture | undefined;
      let roughMap: THREE.Texture | undefined;
      let normUrl: string | undefined;
      let roughUrl: string | undefined;

      // PBR Generation (Local) - only if requested
      if (generatePbr) {
        setProgress("Generating PBR maps (Normal + Roughness)...");
        try {
          const imgElement = await loadImage(imageUrl);

          // Normal Map - stronger for fabric textures
          const normalStrength = textureStyle === "fabric" ? 3.0 : 2.0;
          const normalDataUrl = await generateNormalMap(imgElement, normalStrength);
          normUrl = normalDataUrl;
          normMap = await loadTexture(normalDataUrl);
          normMap.colorSpace = THREE.LinearSRGBColorSpace;

          // Roughness Map
          const roughnessDataUrl = await generateRoughnessMap(imgElement);
          roughUrl = roughnessDataUrl;
          roughMap = await loadTexture(roughnessDataUrl);
          roughMap.colorSpace = THREE.LinearSRGBColorSpace;

          setNormalMap((prev) => {
            if (prev && prev !== normMap) prev.dispose();
            return normMap ?? null;
          });
          setNormalMapUrl(normalDataUrl);
          setRoughnessMap((prev) => {
            if (prev && prev !== roughMap) prev.dispose();
            return roughMap ?? null;
          });
          setRoughnessMapUrl(roughnessDataUrl);
          
          console.log(" PBR maps generated successfully");
        } catch (pbrErr) {
          console.warn(" PBR generation failed:", pbrErr);
        }
      }

      setProgress(null);
      console.log(" Gemini texture generation complete!", {
        model: GEMINI_MODELS[selectedModel],
        resolution: normalizedResolution,
        hasPbr: !!normMap,
      });

      return {
        imageUrl,
        texture: tex,
        normalMap: normMap,
        roughnessMap: roughMap,
        normalMapUrl: normUrl,
        roughnessMapUrl: roughUrl,
        modelUsed: modelName,
        resolution: normalizedResolution,
      };

    } catch (err) {
      let msg = "Failed to generate texture";
      let errorDetails = "";
      const fallbackModel: "flash" | "pro" = options.model === "flash" ? "flash" : "pro";
      const fallbackResolution: GeminiTextureOptions["resolution"] =
        fallbackModel === "flash"
          ? "1K"
          : (options.resolution ?? "2K");

      if (err instanceof Error) {
        msg = err.message;
        errorDetails = err.stack || "";
      } else if (typeof err === "object" && err !== null) {
        msg = JSON.stringify(err);
      }

      console.error(" Gemini texture generation failed:", {
        message: msg,
        details: errorDetails,
        model: fallbackModel,
        resolution: fallbackResolution,
      });

      setError(msg);
      setProgress(null);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [buildGeminiRequestBody, loadTexture, parseGeminiErrorMessage]);

  const applyToScene = useCallback((
    scene: THREE.Object3D,
    filter?: (name: string) => boolean
  ) => {
    if (!texture) return;

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];

      materials.forEach((mat, idx) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        if (filter && !filter(mat.name)) return;

        const cloned = mat.clone();
        cloned.map = texture;
        cloned.color = new THREE.Color(0xffffff);

        if (normalMap) {
          cloned.normalMap = normalMap;
          cloned.normalScale = new THREE.Vector2(1, 1);
        }

        if (roughnessMap) {
          cloned.roughnessMap = roughnessMap;
          cloned.roughness = 1.0;
        }

        cloned.needsUpdate = true;

        if (Array.isArray(child.material)) {
          child.material[idx] = cloned;
        } else {
          child.material = cloned;
        }
      });
    });
  }, [texture, normalMap, roughnessMap]);

  const clearTexture = useCallback(() => {
    texture?.dispose();
    normalMap?.dispose();
    roughnessMap?.dispose();

    setTextureUrl(null);
    setTexture(null);
    setNormalMap(null);
    setRoughnessMap(null);
    setNormalMapUrl(null);
    setRoughnessMapUrl(null);

    setError(null);
    setProgress(null);
  }, [texture, normalMap, roughnessMap]);

  return {
    textureUrl,
    texture,
    normalMap,
    roughnessMap,
    normalMapUrl,
    roughnessMapUrl,
    isGenerating,
    error,
    progress,
    generateTexture,
    applyToScene,
    clearTexture,
  };
}
