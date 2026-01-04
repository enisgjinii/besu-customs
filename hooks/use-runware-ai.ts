"use client";

import { useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { generateNormalMap, generateRoughnessMap, loadImage } from "@/lib/texture-utils";

/**
 * Runware AI 3D Texture Generation Hook
 * 
 * Generates textures directly onto 3D model UV maps.
 * Now supports client-side PBR map generation (Normal, Roughness).
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
  /** Whether to generate PBR maps (Normal, Roughness) */
  generatePbr?: boolean;
}

export interface GenerationResult {
  imageUrl: string;
  texture: THREE.Texture;
  seed?: number;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
}

export interface UseRunwareAIReturn {
  textureUrl: string | null;
  texture: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  normalMapUrl: string | null;
  roughnessMapUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  progress: string | null;
  generateTexture: (options: TextureGenerationOptions) => Promise<GenerationResult | null>;
  applyToScene: (scene: THREE.Object3D, filter?: (name: string) => boolean) => void;
  clearTexture: () => void;
}

const RUNWARE_API = "https://api.runware.ai/v1";
// Use Turbo model for speed, or SDXL for quality. 
// "runware:100@1" is Runware's highly optimized fast model (approx 2s).
// "civitai:101055@128078" is SDXL (better quality, slower ~8s).
// Let's stick with SDXL for quality as requested "Advanced".
const MODEL_ID = "civitai:101055@128078";

export function useRunwareAI(): UseRunwareAIReturn {
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
        (err) => reject(new Error("Failed to load texture"))
      );
    });
  }, []);

  // Generate texture using img2img on UV map
  const generateTexture = useCallback(async (
    options: TextureGenerationOptions
  ): Promise<GenerationResult | null> => {

    // Check for API key in either variable
    const apiKey = process.env.NEXT_PUBLIC_RUNWARE_API_KEY || process.env.NEXT_PUBLIC_RUNWARE_AI;

    if (!apiKey) {
      setError("API key not configured. Set NEXT_PUBLIC_RUNWARE_API_KEY in .env");
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setProgress("Preparing UV map...");

    // Reset previous maps
    setNormalMap(null);
    setRoughnessMap(null);
    setNormalMapUrl(null);
    setRoughnessMapUrl(null);

    try {
      const {
        prompt,
        uvMap,
        negativePrompt = "blurry, low quality, distorted, watermark, text, human, person, mannequin, 3D render, perspective, shadows, lighting",
        width = 1024,
        height = 1024,
        steps = 25, // Slightly lower steps for speed, SDXL is good at 25
        guidanceScale = 7.5,
        strength = 0.85,
        seed,
        generatePbr = true,
      } = options;

      // Build prompt optimized for UV texture generation
      // Adding "seamless" and "texture" keywords significantly helps
      const fullPrompt = [
        prompt,
        "seamless texture",
        "tiling pattern",
        "flat 2D texture map",
        "top down view",
        "high quality material",
        "8k resolution",
        "material preview"
      ].join(", ");

      setProgress("Generating AI texture...");

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

      const imageUrl = result.imageURL;

      setProgress("Loading texture...");
      const tex = await loadTexture(imageUrl);

      setTextureUrl(imageUrl);
      setTexture(tex);

      let normMap: THREE.Texture | undefined;
      let roughMap: THREE.Texture | undefined;
      let normUrl: string | undefined;
      let roughUrl: string | undefined;

      // PBR Generation
      if (generatePbr) {
        setProgress("Generating PBR maps...");
        try {
          // Load image for processing
          const imgElement = await loadImage(imageUrl);

          // Generate Normal Map
          const normalDataUrl = await generateNormalMap(imgElement, 2.0); // 2.0 strength
          normUrl = normalDataUrl;
          normMap = await loadTexture(normalDataUrl);
          // Normal maps need specific encoding
          normMap.colorSpace = THREE.LinearSRGBColorSpace;

          // Generate Roughness Map
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
          // Don't fail the whole process if PBR fails
        }
      }

      setProgress(null);

      return {
        imageUrl,
        texture: tex,
        seed: result.seed,
        normalMap: normMap,
        roughnessMap: roughMap,
        normalMapUrl: normUrl,
        roughnessMapUrl: roughUrl
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
        cloned.color = new THREE.Color(0xffffff); // Reset color to white so texture shows true colors

        // Apply PBR maps if available
        if (normalMap) {
          cloned.normalMap = normalMap;
          cloned.normalScale = new THREE.Vector2(1, 1);
        }

        if (roughnessMap) {
          cloned.roughnessMap = roughnessMap;
          cloned.roughness = 1.0; // Let map control roughness
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

  // Clear texture
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

export default useRunwareAI;
