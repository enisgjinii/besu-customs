"use client";

import { useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { generateNormalMap, generateRoughnessMap, loadImage } from "@/lib/texture-utils";

/**
 * Gemini AI Texture Generation Hook
 *
 * Uses Google's Gemini 3 Pro Image Preview model to generate textures
 * based on a text prompt and the 3D model's UV map.
 */

export interface GeminiTextureOptions {
  /** Text prompt describing the desired texture */
  prompt: string;
  /** UV map image (base64 or data URL) */
  uvMap: string;
  /** Whether to generate PBR maps (Normal, Roughness) locally */
  generatePbr?: boolean;
}

export interface GeminiGenerationResult {
  imageUrl: string;
  texture: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey) {
      setError("Google API Key not configured. Set NEXT_PUBLIC_GOOGLE_API_KEY in .env");
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setProgress("Preparing request...");

    // Reset previous maps
    setNormalMap(null);
    setRoughnessMap(null);
    setNormalMapUrl(null);
    setRoughnessMapUrl(null);

    try {
      const { prompt, uvMap, generatePbr = true } = options;

      // Enhance prompt for texture generation
      const enhancedPrompt = `
        Generate a high-quality, seamless texture based on this UV map.
        Description: ${prompt}.
        The output should be a flat texture map that fits perfectly onto the provided UV layout.
        Do not add shadows or lighting effects, just the albedo/color map.
      `.trim();

      const mimeType = getMimeType(uvMap);
      const base64Image = toBase64(uvMap);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: enhancedPrompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      setProgress("Generating with Google Gemini...");

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract image from response
      // Gemini 3 Pro Image Preview returns the generated image in the response candidates
      // The exact format for Image Output typically involves base64 data in the parts
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      
      let generatedImageBase64: string | null = null;
      let generatedImageMimeType = "image/png";

      for (const part of parts) {
        if (part.inline_data) {
          generatedImageBase64 = part.inline_data.data;
          generatedImageMimeType = part.inline_data.mime_type || "image/png";
          break;
        }
      }

      if (!generatedImageBase64) {
        // Fallback or error check - sometimes it might refuse
        if (candidate?.finishReason === "SAFETY") {
          throw new Error("Generation blocked by safety filters. Please try a different prompt.");
        }
        throw new Error("No image generated in the response.");
      }

      const imageUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`;

      setProgress("Loading texture...");
      const tex = await loadTexture(imageUrl);

      setTextureUrl(imageUrl);
      setTexture(tex);

      let normMap: THREE.Texture | undefined;
      let roughMap: THREE.Texture | undefined;
      let normUrl: string | undefined;
      let roughUrl: string | undefined;

      // PBR Generation (Local)
      if (generatePbr) {
        setProgress("Generating PBR maps...");
        try {
          const imgElement = await loadImage(imageUrl);

          // Normal Map
          const normalDataUrl = await generateNormalMap(imgElement, 2.0);
          normUrl = normalDataUrl;
          normMap = await loadTexture(normalDataUrl);
          normMap.colorSpace = THREE.LinearSRGBColorSpace;

          // Roughness Map
          const roughnessDataUrl = await generateRoughnessMap(imgElement);
          roughUrl = roughnessDataUrl;
          roughMap = await loadTexture(roughnessDataUrl);
          roughMap.colorSpace = THREE.LinearSRGBColorSpace;

          setNormalMap(normMap);
          setNormalMapUrl(normalDataUrl);
          setRoughnessMap(roughMap);
          setRoughnessMapUrl(roughnessDataUrl);
        } catch (pbrErr) {
          console.warn("PBR generation failed:", pbrErr);
        }
      }

      setProgress(null);

      return {
        imageUrl,
        texture: tex,
        normalMap: normMap,
        roughnessMap: roughMap,
        normalMapUrl: normUrl,
        roughnessMapUrl: roughUrl
      };

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gemini Generation failed";
      setError(msg);
      setProgress(null);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [loadTexture]);

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
