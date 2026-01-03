"use client";

import { useState, useCallback, useRef } from "react";
import * as THREE from "three";

/**
 * Runware AI 3D Texture Generation Hook
 * 
 * Generates textures directly onto 3D model UV maps, similar to HexaGen/Leonardo.ai
 * The AI paints textures that align with the model's UV layout.
 */

export interface TextureGenerationOptions {
  /** Text prompt describing the desired texture */
  prompt: string;
  /** UV map image (base64 or data URL) - the AI will paint onto this */
  uvMap: string;
  /** Negative prompt */
  negativePrompt?: string;
  /** Output resolution */
  width?: number;
  height?: number;
  /** Inference steps */
  steps?: number;
  /** Guidance scale */
  guidanceScale?: number;
  /** How much to transform the UV map (0.5-0.95) */
  strength?: number;
  /** Seed for reproducibility */
  seed?: number;
}

export interface GenerationResult {
  imageUrl: string;
  texture: THREE.Texture;
  seed?: number;
}

export interface UseRunwareAIReturn {
  textureUrl: string | null;
  texture: THREE.Texture | null;
  isGenerating: boolean;
  error: string | null;
  progress: string | null;
  generateTexture: (options: TextureGenerationOptions) => Promise<GenerationResult | null>;
  applyToScene: (scene: THREE.Object3D, filter?: (name: string) => boolean) => void;
  clearTexture: () => void;
}

const RUNWARE_API = "https://api.runware.ai/v1";
const MODEL_ID = "civitai:101055@128078"; // SDXL

export function useRunwareAI(): UseRunwareAIReturn {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const loaderRef = useRef(new THREE.TextureLoader());

  // Convert data URL to base64
  const toBase64 = (dataUrl: string): string => {
    if (dataUrl.startsWith("data:")) {
      return dataUrl.split(",")[1] || dataUrl;
    }
    return dataUrl;
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
        reject
      );
    });
  }, []);

  // Generate texture using img2img on UV map
  const generateTexture = useCallback(async (
    options: TextureGenerationOptions
  ): Promise<GenerationResult | null> => {
    const apiKey = process.env.NEXT_PUBLIC_RUNWARE_API_KEY || process.env.NEXT_PUBLIC_RUNWARE_AI;

    if (!apiKey) {
      setError("API key not configured. Set NEXT_PUBLIC_RUNWARE_AI in .env");
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setProgress("Preparing UV map...");

    try {
      const {
        prompt,
        uvMap,
        negativePrompt = "blurry, low quality, distorted, watermark, text, human, person, mannequin, 3D render, perspective",
        width = 1024,
        height = 1024,
        steps = 30,
        guidanceScale = 7.5,
        strength = 0.85,
        seed,
      } = options;

      // Build prompt optimized for UV texture generation
      const fullPrompt = [
        prompt,
        "seamless texture map",
        "UV unwrapped texture",
        "flat 2D texture",
        "professional quality",
        "high resolution",
        "clean edges",
      ].join(", ");

      setProgress("Generating texture with AI...");

      // Use img2img with UV map as seed image
      const requestBody: Record<string, unknown> = {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        positivePrompt: fullPrompt,
        negativePrompt,
        model: MODEL_ID,
        seedImage: toBase64(uvMap),
        strength,
        width,
        height,
        steps,
        CFGScale: guidanceScale,
        numberResults: 1,
        outputFormat: "PNG",
        outputType: "URL",
      };

      if (seed !== undefined) {
        requestBody.seed = seed;
      }

      const response = await fetch(RUNWARE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify([requestBody]),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || err.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data?.data?.[0] || data?.[0];

      if (!result?.imageURL) {
        throw new Error("No image in response");
      }

      setProgress("Loading texture...");
      const tex = await loadTexture(result.imageURL);

      setTextureUrl(result.imageURL);
      setTexture(tex);
      setProgress(null);

      return {
        imageUrl: result.imageURL,
        texture: tex,
        seed: result.seed,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      setProgress(null);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [loadTexture]);

  // Apply texture to scene
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
        cloned.needsUpdate = true;

        if (Array.isArray(child.material)) {
          child.material[idx] = cloned;
        } else {
          child.material = cloned;
        }
      });
    });
  }, [texture]);

  // Clear texture
  const clearTexture = useCallback(() => {
    texture?.dispose();
    setTextureUrl(null);
    setTexture(null);
    setError(null);
    setProgress(null);
  }, [texture]);

  return {
    textureUrl,
    texture,
    isGenerating,
    error,
    progress,
    generateTexture,
    applyToScene,
    clearTexture,
  };
}

export default useRunwareAI;
