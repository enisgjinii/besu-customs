"use client";

import { useState, useCallback, useRef } from "react";
import * as THREE from "three";

/**
 * Meshy AI Retexture Hook
 * 
 * Uses Meshy's Retexture API to generate advanced AI textures
 * directly onto 3D model UV maps with PBR support.
 */

export interface MeshyTextureOptions {
    /** Text prompt describing the desired texture style */
    prompt: string;
    /** UV map image (base64 or data URL) - used as style reference */
    uvMap: string;
    /** Reference image URL for style guidance (optional) */
    styleImageUrl?: string;
    /** Enable PBR maps generation */
    enablePbr?: boolean;
    /** Use original UV mapping */
    enableOriginalUv?: boolean;
    /** AI model version: "latest", "meshy-5", "meshy-4" */
    aiModel?: "latest" | "meshy-5" | "meshy-4";
}

export interface MeshyGenerationResult {
    imageUrl: string;
    texture: THREE.Texture;
    taskId: string;
    pbrMaps?: {
        metallic?: string;
        normal?: string;
        roughness?: string;
    };
}

export interface UseMeshyAIReturn {
    textureUrl: string | null;
    texture: THREE.Texture | null;
    isGenerating: boolean;
    error: string | null;
    progress: string | null;
    progressPercent: number;
    generateTexture: (options: MeshyTextureOptions) => Promise<MeshyGenerationResult | null>;
    applyToScene: (scene: THREE.Object3D, filter?: (name: string) => boolean) => void;
    clearTexture: () => void;
}

// Polling interval for checking task status
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 120; // 4 minutes max

export function useMeshyAI(): UseMeshyAIReturn {
    const [textureUrl, setTextureUrl] = useState<string | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [progressPercent, setProgressPercent] = useState(0);

    const loaderRef = useRef(new THREE.TextureLoader());
    const abortControllerRef = useRef<AbortController | null>(null);

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

    // Poll task status
    const pollTaskStatus = useCallback(async (taskId: string): Promise<{
        status: string;
        progress: number;
        textureUrl?: string;
        pbrMaps?: { metallic?: string; normal?: string; roughness?: string };
        error?: string;
    }> => {
        const response = await fetch(`/api/meshy/task/${taskId}`);

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Failed to check task status: ${response.status}`);
        }

        return response.json();
    }, []);

    // Generate texture using Meshy AI
    const generateTexture = useCallback(async (
        options: MeshyTextureOptions
    ): Promise<MeshyGenerationResult | null> => {
        // Cancel any previous generation
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsGenerating(true);
        setError(null);
        setProgress("Preparing UV map...");
        setProgressPercent(0);

        try {
            const {
                prompt,
                uvMap,
                styleImageUrl,
                enablePbr = true,
                enableOriginalUv = true,
                aiModel = "latest",
            } = options;

            // Convert UV map to base64 if needed
            let uvBase64 = uvMap;
            if (uvMap.startsWith("data:")) {
                // Already a data URL, keep as is for the API
                uvBase64 = uvMap;
            }

            setProgress("Creating retexture task...");

            // Create the retexture task via our API route
            const createResponse = await fetch("/api/meshy/retexture", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    imageStyleUrl: styleImageUrl || uvBase64,
                    enablePbr,
                    enableOriginalUv,
                    aiModel,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!createResponse.ok) {
                const err = await createResponse.json().catch(() => ({}));
                throw new Error(err.error || `Failed to create task: ${createResponse.status}`);
            }

            const { taskId } = await createResponse.json();
            console.log("Meshy task created:", taskId);

            setProgress("AI is generating texture...");

            // Poll for completion
            let attempts = 0;
            while (attempts < MAX_POLL_ATTEMPTS) {
                if (abortControllerRef.current.signal.aborted) {
                    throw new Error("Generation cancelled");
                }

                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

                const status = await pollTaskStatus(taskId);
                setProgressPercent(status.progress);

                if (status.status === "SUCCEEDED") {
                    setProgress("Loading texture...");

                    if (!status.textureUrl) {
                        throw new Error("No texture URL in completed task");
                    }

                    const tex = await loadTexture(status.textureUrl);

                    setTextureUrl(status.textureUrl);
                    setTexture(tex);
                    setProgress(null);
                    setProgressPercent(100);

                    return {
                        imageUrl: status.textureUrl,
                        texture: tex,
                        taskId,
                        pbrMaps: status.pbrMaps,
                    };
                } else if (status.status === "FAILED") {
                    throw new Error(status.error || "Texture generation failed");
                } else if (status.status === "CANCELED") {
                    throw new Error("Task was cancelled");
                }

                // Update progress message
                if (status.status === "PENDING") {
                    setProgress(`Waiting in queue... (${status.progress}%)`);
                } else {
                    setProgress(`Generating texture... (${status.progress}%)`);
                }

                attempts++;
            }

            throw new Error("Generation timed out");
        } catch (err) {
            if ((err as Error).name === "AbortError") {
                setError("Generation cancelled");
            } else {
                const msg = err instanceof Error ? err.message : "Generation failed";
                setError(msg);
            }
            setProgress(null);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, [loadTexture, pollTaskStatus]);

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
        abortControllerRef.current?.abort();
        texture?.dispose();
        setTextureUrl(null);
        setTexture(null);
        setError(null);
        setProgress(null);
        setProgressPercent(0);
    }, [texture]);

    return {
        textureUrl,
        texture,
        isGenerating,
        error,
        progress,
        progressPercent,
        generateTexture,
        applyToScene,
        clearTexture,
    };
}

export default useMeshyAI;
