"use client";

import { useDesignerStore } from "@/lib/designer/store";
import { Button } from "@heroui/react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function GarmentCanvas() {
  const s = useDesignerStore();
  const [previewScale, setPreviewScale] = useState(1);
  const artwork = s.artwork.front || s.artwork.back;
  const selectedConcept = useMemo(
    () => s.concepts.find((concept) => concept.id === s.selectedConceptId),
    [s.concepts, s.selectedConceptId],
  );

  function nudgeZoom(delta: number) {
    setPreviewScale((current) => clamp(Number((current + delta).toFixed(2)), 0.75, 1.5));
  }

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#f4f4f2]">
      <div
        id="production-canvas"
        className="absolute inset-3 flex min-h-0 items-center justify-center overflow-hidden rounded-[24px] bg-white ring-1 ring-border/60 sm:inset-6"
      >
        <svg
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Direct AI uniform concept preview"
          className="h-full w-full"
        >
          <rect x="0" y="0" width="1200" height="900" rx="36" fill="#f7f7f5" />
          {artwork ? (
            <image
              href={artwork}
              x="70"
              y="40"
              width="1060"
              height="820"
              preserveAspectRatio="xMidYMid meet"
              transform={`translate(${600 - 600 * previewScale} ${450 - 450 * previewScale}) scale(${previewScale})`}
            />
          ) : (
            <g>
              <rect x="270" y="210" width="660" height="480" rx="42" fill="#ffffff" stroke="#deded8" strokeWidth="4" strokeDasharray="14 14" />
              <text x="600" y="420" textAnchor="middle" fill="#171717" fontFamily="Open Sans, sans-serif" fontSize="32" fontWeight="700">
                Direct AI Uniform Designer
              </text>
              <text x="600" y="470" textAnchor="middle" fill="#737373" fontFamily="Open Sans, sans-serif" fontSize="22">
                Describe the uniform, generate four concepts, then choose one.
              </text>
              <text x="600" y="510" textAnchor="middle" fill="#737373" fontFamily="Open Sans, sans-serif" fontSize="20">
                AI will render the finished jersey + shorts directly.
              </text>
            </g>
          )}
        </svg>
      </div>

      <div
        className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 sm:top-8"
      >
        <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-[11px] font-semibold shadow-sm ring-1 ring-border/60 backdrop-blur-sm">
          <Sparkles className="size-3.5" />
          {selectedConcept ? `Direct AI · ${selectedConcept.label}` : artwork ? "Direct AI render" : "Direct AI mode"}
        </div>
      </div>

      {artwork ? (
        <div
          className="absolute z-20 flex flex-col gap-1.5"
          style={{
            bottom: "max(12px, env(safe-area-inset-bottom, 0px))",
            right: "max(10px, env(safe-area-inset-right, 0px))",
          }}
        >
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Zoom in"
            className="size-10 rounded-full bg-white/95 shadow-sm ring-1 ring-border/60"
            onPress={() => nudgeZoom(0.1)}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Zoom out"
            className="size-10 rounded-full bg-white/95 shadow-sm ring-1 ring-border/60"
            onPress={() => nudgeZoom(-0.1)}
          >
            <Minus className="size-4" />
          </Button>
        </div>
      ) : null}

      {artwork ? (
        <p className="pointer-events-none absolute inset-x-6 bottom-4 z-10 m-0 text-center text-[10px] font-medium text-muted sm:bottom-6">
          This is the AI-generated finished uniform render — not a flat 2D texture.
        </p>
      ) : null}
    </section>
  );
}
