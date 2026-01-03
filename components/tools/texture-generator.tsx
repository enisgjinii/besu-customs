"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import {
    OrbitControls,
    Stage,
    Sphere,
    Box,
    Cylinder,
    Plane,
    useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { Copy, Download, Loader2, Sparkles, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { generatePBRMaps, PBRMaps } from "@/lib/pbr-utils";
import { cn } from "@/lib/utils";

// --- 3D Scene Components ---

function TextureMesh({
    shape,
    maps,
    displacementScale,
    tiling,
}: {
    shape: "sphere" | "cube" | "cylinder" | "plane";
    maps: PBRMaps | null;
    displacementScale: number;
    tiling: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    // create textures from data URLs
    const textures = useLoader(
        THREE.TextureLoader,
        maps
            ? [maps.albedo, maps.normal, maps.displacement, maps.roughness, maps.ao]
            : ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII="] // White pixel fallback
    );

    const [albedoMap, normalMap, displacementMap, roughnessMap, aoMap] = Array.isArray(textures)
        ? textures
        : [null, null, null, null, null];

    useEffect(() => {
        if (!albedoMap) return;
        [albedoMap, normalMap, displacementMap, roughnessMap, aoMap].forEach((tex) => {
            if (tex) {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(tiling, tiling);
                tex.needsUpdate = true;
            }
        });
    }, [tiling, albedoMap, normalMap, displacementMap, roughnessMap, aoMap]);

    if (!maps) {
        // Render a simple wireframe placeholder if no maps generated yet
        return (
            <Sphere args={[1, 32, 32]}>
                <meshStandardMaterial color="#e5e7eb" wireframe />
            </Sphere>
        );
    }

    const materialProps = {
        map: albedoMap,
        normalMap: normalMap,
        displacementMap: displacementMap,
        displacementScale: displacementScale,
        roughnessMap: roughnessMap,
        aoMap: aoMap,
        side: THREE.DoubleSide,
    };

    return (
        <group>
            {shape === "sphere" && (
                <Sphere ref={meshRef} args={[1, 128, 128]}>
                    <meshStandardMaterial {...materialProps} />
                </Sphere>
            )}
            {shape === "cube" && (
                <Box ref={meshRef} args={[1.5, 1.5, 1.5, 64, 64, 64]}>
                    <meshStandardMaterial {...materialProps} />
                </Box>
            )}
            {shape === "cylinder" && (
                <Cylinder ref={meshRef} args={[1, 1, 2, 64, 64]}>
                    <meshStandardMaterial {...materialProps} />
                </Cylinder>
            )}
            {shape === "plane" && (
                <Plane ref={meshRef} args={[2, 2, 128, 128]} rotation={[-Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial {...materialProps} />
                </Plane>
            )}
        </group>
    );
}

// --- Main Component ---

export function TextureGenerator() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMaps, setGeneratedMaps] = useState<PBRMaps | null>(null);
    const [selectedShape, setSelectedShape] = useState<"sphere" | "cube" | "cylinder" | "plane">("sphere");
    const [displacementScale, setDisplacementScale] = useState(0.05);
    const [tiling, setTiling] = useState(1);
    const [activeTab, setActiveTab] = useState("preview");

    const generateTexture = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsGenerating(true);
        setGeneratedMaps(null);

        try {
            // 1. Generate Image from API
            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: "seamless texture, flat lighting, top down view, " + prompt,
                    width: 1024,
                    height: 1024,
                    numberResults: 1,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.images?.[0]?.imageURL) {
                throw new Error(data.error || "Failed to generate image");
            }

            const imageUrl = data.images[0].imageURL;

            // 2. Generate PBR Maps
            toast.message("Generating PBR maps...");

            // We need to fetch the blob to pass to our PBR generator (to avoid some CORS issues if img elem is tricky, 
            // but generatePBRMaps handles url with crossOrigin anonymous if server supports it. Runware usually does.)
            // Let's pass the URL directly.

            const maps = await generatePBRMaps(imageUrl);
            setGeneratedMaps(maps);
            toast.success("Texture generated successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate texture");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadMap = (dataUrl: string, name: string) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAll = () => {
        if (!generatedMaps) return;
        Object.entries(generatedMaps).forEach(([key, url]) => {
            downloadMap(url, `texture-${key}`);
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] min-h-[600px]">
            {/* Left Panel: Controls */}
            <div className="lg:col-span-1 space-y-6 flex flex-col">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            AI Texture Generator
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Generate seamless PBR textures from text prompts.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Texture Prompt</Label>
                            <Textarea
                                placeholder="Describe your texture (e.g., weathered brick wall, mossy rocks, hexagon sci-fi tiles)..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="resize-none h-32"
                            />
                        </div>

                        <Button
                            onClick={generateTexture}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Maps...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Texture
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {generatedMaps && (
                    <div className="bg-card border rounded-xl p-6 shadow-sm flex-1 overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Generated Maps</h3>
                            <Button variant="outline" size="sm" onClick={downloadAll}>
                                <Download className="w-4 h-4 mr-2" /> Download All
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(generatedMaps).map(([name, url]) => (
                                <div key={name} className="space-y-2">
                                    <div className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                                        <img src={url} alt={name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => downloadMap(url, `texture-${name}`)}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium capitalize text-center text-muted-foreground">{name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: 3D Preview */}
            <div className="lg:col-span-2 bg-muted/30 rounded-xl border overflow-hidden flex flex-col relative">
                <div className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur border p-2 rounded-lg flex items-center gap-2 shadow-sm">
                    <Button
                        variant={selectedShape === 'sphere' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedShape('sphere')}
                        title="Sphere"
                    >
                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                    </Button>
                    <Button
                        variant={selectedShape === 'cube' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedShape('cube')}
                        title="Cube"
                    >
                        <div className="w-4 h-4 border-2 border-current" />
                    </Button>
                    <Button
                        variant={selectedShape === 'cylinder' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedShape('cylinder')}
                        title="Cylinder"
                    >
                        <div className="w-3 h-4 border-2 border-current rounded-[1px]" />
                    </Button>
                    <Button
                        variant={selectedShape === 'plane' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedShape('plane')}
                        title="Plane"
                    >
                        <div className="w-4 h-4 border-2 border-current transform skew-x-12" />
                    </Button>
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-10 bg-background/90 backdrop-blur border p-4 rounded-lg flex items-center gap-8 shadow-sm">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span>Displacement</span>
                            <span>{displacementScale.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[displacementScale]}
                            min={0}
                            max={0.2}
                            step={0.01}
                            onValueChange={([v]) => setDisplacementScale(v)}
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span>Tiling</span>
                            <span>{tiling}x</span>
                        </div>
                        <Slider
                            value={[tiling]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={([v]) => setTiling(v)}
                        />
                    </div>
                </div>

                <div className="flex-1 h-full w-full">
                    <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
                        <Suspense fallback={null}>
                            <Stage environment="city" intensity={0.5}>
                                <TextureMesh
                                    shape={selectedShape}
                                    maps={generatedMaps}
                                    displacementScale={displacementScale}
                                    tiling={tiling}
                                />
                            </Stage>
                            <OrbitControls makeDefault />
                        </Suspense>
                    </Canvas>
                </div>
            </div>
        </div>
    );
}
