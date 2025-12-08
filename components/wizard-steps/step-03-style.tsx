"use client";

import { useConfiguratorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { PATTERN_CATEGORIES, getPatternsByCategory } from "@/lib/patterns";

// Temporary preset data structure
// In a real app, this would come from a database or config file
const STYLE_PRESETS = [
    {
        id: "style-1",
        name: "Classic Varsity",
        description: "Timeless athletic look",
        thumbnail: "https://placehold.co/400x500/2563eb/ffffff/png?text=Varsity",
        colors: { "Body": "#1e3a8a", "Sleeves": "#f3f4f6", "Cuffs": "#1e3a8a" },
        patternId: null // Solid
    },
    {
        id: "style-2",
        name: "Midnight Stealth",
        description: "All black everything",
        thumbnail: "https://placehold.co/400x500/000000/333333/png?text=Stealth",
        colors: { "Body": "#111111", "Sleeves": "#111111", "Cuffs": "#111111" },
        patternId: "carbon-fiber"
    },
    {
        id: "style-3",
        name: "Retro 90s",
        description: "Bold geometric vibes",
        thumbnail: "https://placehold.co/400x500/f59e0b/ffffff/png?text=Retro+90s",
        colors: { "Body": "#f59e0b", "Sleeves": "#3b82f6", "Cuffs": "#ec4899" },
        patternId: "abstract-geo"
    },
    {
        id: "style-4",
        name: "Forest Ranger",
        description: "Natural earthy tones",
        thumbnail: "https://placehold.co/400x500/166534/ffffff/png?text=Ranger",
        colors: { "Body": "#166534", "Sleeves": "#14532d", "Cuffs": "#fca5a5" },
        patternId: "camo-woodland"
    },
    {
        id: "style-5",
        name: "Urban Concrete",
        description: "Modern street style",
        thumbnail: "https://placehold.co/400x500/9ca3af/ffffff/png?text=Urban",
        colors: { "Body": "#9ca3af", "Sleeves": "#4b5563", "Cuffs": "#1f2937" },
        patternId: "concrete-texture"
    },
    {
        id: "style-6",
        name: "Crimson Tide",
        description: "Aggressive red energy",
        thumbnail: "https://placehold.co/400x500/dc2626/ffffff/png?text=Crimson",
        colors: { "Body": "#dc2626", "Sleeves": "#991b1b", "Cuffs": "#ffffff" },
        patternId: "flames"
    },
    {
        id: "style-7",
        name: "Golden State",
        description: "Championship colors",
        thumbnail: "https://placehold.co/400x500/fbbf24/1d4ed8/png?text=Gold",
        colors: { "Body": "#1d4ed8", "Sleeves": "#1d4ed8", "Cuffs": "#fbbf24" },
        patternId: null
    },
    {
        id: "style-8",
        name: "Arctic Freeze",
        description: "Cool blue gradients",
        thumbnail: "https://placehold.co/400x500/e0f2fe/0ea5e9/png?text=Arctic",
        colors: { "Body": "#e0f2fe", "Sleeves": "#bae6fd", "Cuffs": "#0ea5e9" },
        patternId: "ice-shards"
    },
    {
        id: "style-9",
        name: "Neon Cyber",
        description: "Futuristic glow",
        thumbnail: "https://placehold.co/400x500/c026d3/22d3ee/png?text=Cyber",
        colors: { "Body": "#2e1065", "Sleeves": "#c026d3", "Cuffs": "#22d3ee" },
        patternId: "circuit-board"
    },
    {
        id: "style-10",
        name: "Minimalist Luxe",
        description: "Clean and premium",
        thumbnail: "https://placehold.co/400x500/f8fafc/94a3b8/png?text=Luxe",
        colors: { "Body": "#f8fafc", "Sleeves": "#f1f5f9", "Cuffs": "#64748b" },
        patternId: "subtle-weave"
    }
];

export function Step03Style() {
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    const sections = useConfiguratorStore((s) => s.sections);
    const updateSection = useConfiguratorStore((s) => s.updateSection);
    const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);
    const textureLayers = useConfiguratorStore((s) => s.textureLayers);

    const handleApplyStyle = (preset: typeof STYLE_PRESETS[0]) => {
        setSelectedStyle(preset.id);

        // 1. Apply Colors
        // Iterate sections and apply colors based on name mapping
        // This is a naive mapping, assuming 'Body', 'Sleeves', 'Cuffs' exist in Material Names
        Object.entries(preset.colors).forEach(([key, color]) => {
            // Find sections that match or contain the key
            const matchingSections = sections.filter(s => s.name.toLowerCase().includes(key.toLowerCase()));
            matchingSections.forEach(s => updateSection(s.id, { color }));

            // Fallback: If no match, maybe apply to all if it's "Body"?
            if (key === 'Body' && matchingSections.length === 0) {
                // Try 'Main', 'Base', etc?
                // Or just apply to the first section?
            }
        });

        // 2. Apply Pattern
        if (preset.patternId) {
            // Find pattern URL from lib 
            // Simplified lookup
            const patternUrl = `https://placehold.co/1024x1024/png?text=${preset.patternId}`; // Placeholder for pattern texture

            const patternId = `style-pattern-${Date.now()}`;

            // Remove existing patterns?
            // Ideally yes.

            addTextureLayer({
                id: patternId,
                name: preset.name + " Pattern",
                type: 'pattern',
                visible: true,
                locked: false,
                opacity: 0.8,
                blendMode: 'multiply',
                order: 0,
                imageUrl: patternUrl,
                position: [0.5, 0.5, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold">Step 4: Choose Your Style</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Select a preset configuration to jumpstart your design.
                    (This simulates choosing a specific 'Model' variation).
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {STYLE_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => handleApplyStyle(preset)}
                        className={cn(
                            "group relative flex flex-col rounded-xl overflow-hidden border bg-card transition-all hover:shadow-lg text-left",
                            selectedStyle === preset.id
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50"
                        )}
                    >
                        <div className="aspect-[3/4] w-full relative bg-muted">
                            {/* Placeholder for 3D Model View */}
                            <img
                                src={preset.thumbnail}
                                alt={preset.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Overlay Badge */}
                            {selectedStyle === preset.id && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Selected
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="p-3">
                            <h3 className="font-bold text-sm truncate">{preset.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
