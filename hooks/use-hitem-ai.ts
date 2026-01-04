"use client";

import { useState, useCallback } from "react";
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toast } from "sonner";

export interface HitemTextureOptions {
    image: File | Blob; // Input image (style reference)
    prompt?: string; // Optional prompt (unused by Hitem but good for UI consistency)
    meshUrl?: string; // Optional target mesh URL
}

export interface HitemGenerationResult {
    glTFUrl: string;
    coverUrl: string;
    texture: THREE.Texture;
    normalMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
    metalnessMap?: THREE.Texture;
    // Extracted URLs for UI preview
    textureUrl?: string;
    normalMapUrl?: string;
    roughnessMapUrl?: string;
}

export interface UseHitemAIReturn {
    isGenerating: boolean;
    progress: number;
    error: string | null;
    generateTexture: (options: HitemTextureOptions) => Promise<HitemGenerationResult | null>;
}

// Helper to get URL from texture
const getTextureUrl = (tex: THREE.Texture): string | undefined => {
    if (tex.image) {
        const img = tex.image as HTMLImageElement;
        if (img.src) return img.src;
        if (tex.image instanceof ImageBitmap) {
            // Create canvas to get data URL if needed, or skip
            // For now, simple return undefined if no src
        }
    }
    return undefined;
};

export function useHitemAI(): UseHitemAIReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const generateTexture = useCallback(async (options: HitemTextureOptions): Promise<HitemGenerationResult | null> => {
        setIsGenerating(true);
        setProgress(0);
        setError(null);

        try {
            // 1. Get Token
            // We can't cache it easily here without a provider, so we fetch it each time or letting the browser cache request
            const tokenRes = await fetch("/api/hitem/token", { method: "POST" });
            if (!tokenRes.ok) throw new Error("Failed to get Hitem3D token");
            const tokenData = await tokenRes.json();
            const token = tokenData.data.accessToken;

            if (!token) throw new Error("No access token received");

            // 2. Submit Task
            const formData = new FormData();
            formData.append("images", options.image);

            // Use Type 3 (Image to 3D All-in-One) if no mesh provided, or Type 2 if mesh provided
            const requestType = options.meshUrl ? "2" : "3";

            formData.append("request_type", requestType);
            formData.append("format", "2"); // GLB
            formData.append("model", "hitem3dv2.0"); // or latest
            formData.append("face", "200000"); // Valid range 10w-200w (100000-2000000)
            formData.append("resolution", "512"); // Valid values: 512, 1024, 1536

            if (options.meshUrl) {
                formData.append("mesh_url", options.meshUrl);
            }

            const createRes = await fetch("/api/hitem/create", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            });

            if (!createRes.ok) {
                const err = await createRes.json();
                throw new Error(err.msg || "Failed to create Hitem task");
            }

            const createData = await createRes.json();
            console.log("Hitem3D Create Response:", createData);

            if (createData.code !== 200) {
                throw new Error(createData.msg || `Hitem3D Error ${createData.code}`);
            }

            const taskId = createData.data?.task_id;

            if (!taskId) {
                throw new Error("No task ID received from Hitem3D");
            }

            console.log("Hitem3D Task Created:", taskId);

            // 3. Poll for result
            let attempts = 0;
            const maxAttempts = 120; // 4 minutes (2s interval)

            const poll = async (): Promise<any> => {
                if (attempts >= maxAttempts) throw new Error("Generation timed out");
                attempts++;

                // Update progress (fake it a bit or use API response if available)
                setProgress(Math.min(95, Math.floor((attempts / maxAttempts) * 100)));

                const queryRes = await fetch(`/api/hitem/query?task_id=${taskId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!queryRes.ok) throw new Error("Failed to query task status");

                const queryData = await queryRes.json();
                const state = queryData.data?.state;

                console.log("Hitem3D Poll:", state);

                if (state === "success") {
                    return queryData.data;
                } else if (state === "failed" || state === "failure") { // Check exact failure string
                    throw new Error(queryData.msg || "Generation failed");
                } else {
                    // "running", "queueing", etc.
                    await new Promise(r => setTimeout(r, 2000));
                    return poll();
                }
            };

            const resultData = await poll();
            setProgress(100);

            const glbUrl = resultData.url;
            const coverUrl = resultData.cover_url;

            // 4. Load GLB and extract texture
            return new Promise((resolve, reject) => {
                const loader = new GLTFLoader();
                loader.load(glbUrl, (gltf: any) => {
                    let texture: THREE.Texture | null = null;
                    let normalMap: THREE.Texture | undefined;
                    let roughnessMap: THREE.Texture | undefined;
                    let metalnessMap: THREE.Texture | undefined;

                    // Traverse to find the first mesh with a texture
                    gltf.scene.traverse((child: any) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh;
                            const mat = mesh.material;
                            if (mat) { // Handle single material or array
                                const material = Array.isArray(mat) ? mat[0] : mat;
                                if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
                                    if (material.map && !texture) {
                                        texture = material.map;
                                        (texture.source.data as any).crossOrigin = "anonymous"; // Ensure CORS
                                        // Clone to detach from material
                                        texture = texture.clone();
                                        texture.needsUpdate = true;
                                    }
                                    if (material instanceof THREE.MeshStandardMaterial) {
                                        if (material.normalMap && !normalMap) normalMap = material.normalMap.clone();
                                        if (material.roughnessMap && !roughnessMap) roughnessMap = material.roughnessMap.clone();
                                        if (material.metalnessMap && !metalnessMap) metalnessMap = material.metalnessMap.clone();
                                    }
                                }
                            }
                        }
                    });

                    if (texture) {
                        resolve({
                            glTFUrl: glbUrl,
                            coverUrl: coverUrl || getTextureUrl(texture!) || "",
                            texture: texture!,
                            normalMap,
                            roughnessMap,
                            metalnessMap,
                            textureUrl: getTextureUrl(texture!),
                            normalMapUrl: normalMap ? getTextureUrl(normalMap) : undefined,
                            roughnessMapUrl: roughnessMap ? getTextureUrl(roughnessMap) : undefined
                        });
                    } else {
                        // If no texture found (e.g. vertex colors?), just return the GLB url
                        // But we need a texture for our app workflow.
                        // Maybe we can render the model to a texture? No, too complex.
                        // We'll warn if no texture.
                        toast.warning("Generated model has no texture map.");
                        // Construct a placeholder texture?
                        resolve({
                            glTFUrl: glbUrl,
                            coverUrl,
                            texture: new THREE.Texture(), // Empty
                        });
                    }
                }, undefined, (err: any) => {
                    console.error("Failed to load generated GLB", err);
                    reject(new Error("Failed to load generated 3D model"));
                });
            });

        } catch (err) {
            console.error("Hitem3D Error:", err);
            const msg = err instanceof Error ? err.message : "Unknown error";
            setError(msg);
            toast.error(msg);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        isGenerating,
        progress,
        error,
        generateTexture,
    };
}
