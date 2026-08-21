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
    <section className="relative h-full w-full overflow-hidden rounded-2xl bg-white ring-1 ring-border/60 md:rounded-none md:bg-[#f4f4f2] md:ring-0">
      <div
        id="production-canvas"
        className="absolute inset-0 flex min-h-0 items-center justify-center overflow-hidden bg-white md:inset-6 md:rounded-[24px] md:ring-1 md:ring-border/60"
      >
        <svg
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Direct AI uniform concept preview"
          className="h-full w-full"
        >
          <rect x="0" y="0" width="1200" height="900" fill="#f7f7f5" />
          {artwork ? (
            <image
              href={artwork}
              x="58"
              y="34"
              width="1084"
              height="832"
              preserveAspectRatio="xMidYMid meet"
              transform={`translate(${600 - 600 * previewScale} ${450 - 450 * previewScale}) scale(${previewScale})`}
            />
          ) : (
            <g opacity="0.8">
              <rect x="260" y="190" width="680" height="520" rx="46" fill="#ffffff" stroke="#deded8" strokeWidth="4" strokeDasharray="16 14" />
              <circle cx="600" cy="410" r="58" fill="#f0f0ed" />
            </g>
          )}
        </svg>

        {!artwork ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
            <div className="max-w-[280px]">
              <span className="mx-auto flex size-9 items-center justify-center rounded-full bg-foreground text-white md:size-12">
                <Sparkles className="size-4 md:size-5" />
              </span>
              <p className="m-0 mt-2 text-[13px] font-semibold md:text-[15px]">Create your uniform</p>
              <p className="m-0 mt-1 text-[10px] leading-snug text-muted md:text-[12px]">
                Describe it, generate four AI concepts, then choose one.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Desktop-only context badge and zoom controls. Mobile stays visually clean. */}
      <div className="pointer-events-none absolute left-1/2 top-8 z-20 hidden -translate-x-1/2 md:block">
        <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-[11px] font-semibold shadow-sm ring-1 ring-border/60 backdrop-blur-sm">
          <Sparkles className="size-3.5" />
          {selectedConcept ? `Direct AI · ${selectedConcept.label}` : artwork ? "Direct AI render" : "Direct AI mode"}
        </div>
      </div>

      {artwork ? (
        <div
          className="absolute z-20 hidden flex-col gap-1.5 md:flex"
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
    </section>
  );
}
