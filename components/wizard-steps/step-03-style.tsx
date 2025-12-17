"use client";

import { useConfiguratorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, Sparkles, Box } from "lucide-react";
import { useState } from "react";
import { ThreeScene } from "../three-scene";

// --- PRESET DATA ---
const STYLE_PRESETS = [
  {
    id: "style-1",
    name: "Classic Varsity",
    description: "Timeless athletic",
    colors: { Body: "#1e3a8a", Sleeves: "#f3f4f6", Cuffs: "#1e3a8a" },
    patternId: null,
  },
  {
    id: "style-2",
    name: "Midnight Stealth",
    description: "All black",
    colors: { Body: "#111111", Sleeves: "#222222", Cuffs: "#000000" },
    patternId: "carbon-fiber",
  },
  {
    id: "style-3",
    name: "Retro 90s",
    description: "Bold geometric",
    colors: { Body: "#f59e0b", Sleeves: "#3b82f6", Cuffs: "#ec4899" },
    patternId: "abstract-geo",
  },
  {
    id: "style-4",
    name: "Forest Ranger",
    description: "Earthy tones",
    colors: { Body: "#166534", Sleeves: "#14532d", Cuffs: "#fca5a5" },
    patternId: "camo-woodland",
  },
  {
    id: "style-5",
    name: "Urban Concrete",
    description: "Street style",
    colors: { Body: "#9ca3af", Sleeves: "#4b5563", Cuffs: "#1f2937" },
    patternId: "concrete-texture",
  },
  {
    id: "style-6",
    name: "Crimson Tide",
    description: "Aggressive red",
    colors: { Body: "#dc2626", Sleeves: "#991b1b", Cuffs: "#ffffff" },
    patternId: "flames",
  },
  {
    id: "style-7",
    name: "Golden State",
    description: "Royal Gold",
    colors: { Body: "#1d4ed8", Sleeves: "#1d4ed8", Cuffs: "#fbbf24" },
    patternId: null,
  },
  {
    id: "style-8",
    name: "Arctic Freeze",
    description: "Cool gradients",
    colors: { Body: "#e0f2fe", Sleeves: "#bae6fd", Cuffs: "#0ea5e9" },
    patternId: "ice-shards",
  },
  {
    id: "style-9",
    name: "Neon Cyber",
    description: "Futuristic glow",
    colors: { Body: "#2e1065", Sleeves: "#c026d3", Cuffs: "#22d3ee" },
    patternId: "circuit-board",
  },
  {
    id: "style-10",
    name: "Minimalist Luxe",
    description: "Clean premium",
    colors: { Body: "#f8fafc", Sleeves: "#f1f5f9", Cuffs: "#64748b" },
    patternId: "subtle-weave",
  },
];

// Simple SVG Preview Component
function StylePreviewIcon({
  colors,
  hasPattern,
}: {
  colors: Record<string, string>;
  hasPattern: boolean;
}) {
  const bodyColor = colors["Body"] || "#cccccc";
  const sleeveColor = colors["Sleeves"] || "#aaaaaa";
  const cuffColor = colors["Cuffs"] || "#888888";

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 pointer-events-none">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {hasPattern && (
            <pattern
              id={`pattern-${bodyColor.replace("#", "")}`}
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="2" fill="rgba(255,255,255,0.15)" />
              <circle cx="7" cy="7" r="1" fill="rgba(0,0,0,0.1)" />
            </pattern>
          )}
        </defs>

        {/* T-Shirt Body */}
        <path
          d="M25 25 L75 25 L85 40 L70 50 L70 90 L30 90 L30 50 L15 40 Z"
          fill={bodyColor}
        />
        {hasPattern && (
          <path
            d="M25 25 L75 25 L85 40 L70 50 L70 90 L30 90 L30 50 L15 40 Z"
            fill={`url(#pattern-${bodyColor.replace("#", "")})`}
          />
        )}

        {/* Sleeves */}
        <path d="M25 25 L15 40 L30 50 L30 25 Z" fill={sleeveColor} />
        <path d="M75 25 L85 40 L70 50 L70 25 Z" fill={sleeveColor} />

        {/* Collar */}
        <path
          d="M40 25 Q50 35 60 25"
          stroke={cuffColor}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Cuff accents */}
        <rect x="28" y="85" width="44" height="5" rx="2" fill={cuffColor} />

        {/* Outline */}
        <path
          d="M25 25 L75 25 L85 40 L70 50 L70 90 L30 90 L30 50 L15 40 Z"
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function StyleCard({
  preset,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: {
  preset: (typeof STYLE_PRESETS)[0];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  // Get global sections to find the structure
  const globalSections = useConfiguratorStore((s) => s.sections);

  // Compute local sections for this specific card
  const localSections = globalSections.map((section) => {
    let newColor = section.color;
    Object.entries(preset.colors).some(([key, color]) => {
      if (section.name.toLowerCase().includes(key.toLowerCase())) {
        newColor = color;
        return true;
      }
      return false;
    });
    return { ...section, color: newColor };
  });

  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden border bg-card transition-all hover:shadow-lg text-left h-full",
        isSelected
          ? "border-primary ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-xl z-10"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="aspect-square w-full relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* Show 3D ONLY when hovered - prevents too many WebGL contexts */}
        {isHovered ? (
          <div className="absolute inset-0 animate-in fade-in duration-300">
            <ThreeScene
              customSections={
                localSections.length > 0 ? localSections : undefined
              }
              customAutoRotate={true}
            />
          </div>
        ) : (
          <StylePreviewIcon
            colors={preset.colors}
            hasPattern={!!preset.patternId}
          />
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1 z-20">
            <Check className="w-3 h-3" />
            Active
          </div>
        )}

        {/* Hover hint for non-hovered cards */}
        {!isHovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
              <Box className="w-3 h-3" />
              <span>View 3D</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 border-t mt-auto relative z-20 bg-card">
        <h3 className="font-semibold text-sm truncate">{preset.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {preset.description}
        </p>
      </div>
    </button>
  );
}

// --- MAIN COMPONENT ---
export function Step03Style() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  const sections = useConfiguratorStore((s) => s.sections);
  const updateSection = useConfiguratorStore((s) => s.updateSection);
  const addTextureLayer = useConfiguratorStore((s) => s.addTextureLayer);

  const handleApplyStyle = (preset: (typeof STYLE_PRESETS)[0]) => {
    setSelectedStyle(preset.id);

    let bodyApplied = false;
    const bodyColor = preset.colors["Body"];

    Object.entries(preset.colors).forEach(([key, color]) => {
      const matchingSections = sections.filter((s) =>
        s.name.toLowerCase().includes(key.toLowerCase()),
      );
      matchingSections.forEach((s) => updateSection(s.id, { color }));
      if (key === "Body" && matchingSections.length > 0) bodyApplied = true;
    });

    if (!bodyApplied && bodyColor && sections.length > 0) {
      sections.forEach((s) => updateSection(s.id, { color: bodyColor }));
    }

    if (preset.patternId) {
      const patternUrl = `https://placehold.co/1024x1024/png?text=${preset.patternId}`;
      const patternId = `style-pattern-${Date.now()}`;
      addTextureLayer({
        id: patternId,
        name: preset.name + " Pattern",
        type: "pattern",
        visible: true,
        locked: false,
        opacity: 0.8,
        blendMode: "multiply",
        order: 0,
        imageUrl: patternUrl,
        position: [0.5, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Step 3: Choose Your Style</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Hover over a card to preview it in 3D.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {STYLE_PRESETS.map((preset) => (
          <StyleCard
            key={preset.id}
            preset={preset}
            isSelected={selectedStyle === preset.id}
            isHovered={hoveredStyle === preset.id}
            onSelect={() => handleApplyStyle(preset)}
            onHover={() => setHoveredStyle(preset.id)}
            onLeave={() => setHoveredStyle(null)}
          />
        ))}
      </div>
    </div>
  );
}
