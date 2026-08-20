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
        className="absolute inset-2 flex min-h-0 items-center justify-center overflow-hidden rounded-[18px] bg-white ring-1 ring-border/60 sm:inset-6 sm:rounded-[24px]"
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
              <circle cx="600" cy="415" r="62" fill="#f4f4f2" />
            </g>
          )}
        </svg>

        {!artwork ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-center max-[360px]:px-8">
            <div className="max-w-[320px]">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-foreground text-white shadow-sm sm:size-12">
                <Sparkles className="size-4 sm:size-5" />
              </span>
              <p className="m-0 mt-2.5 text-[13px] font-semibold text-foreground sm:text-[15px]">Direct AI Uniform Designer</p>
              <p className="m-0 mt-1 text-[10px] leading-snug text-muted sm:text-[12px]">
                Describe the kit, generate four finished uniforms, then choose your direction.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute left-3 right-14 top-3 z-20 sm:left-1/2 sm:right-auto sm:top-8 sm:-translate-x-1/2">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold shadow-sm ring-1 ring-border/60 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-2 sm:text-[11px]">
          <Sparkles className="size-3.5 shrink-0" />
          <span className="truncate">
            {selectedConcept ? `Direct AI · ${selectedConcept.label}` : artwork ? "Direct AI render" : "Direct AI mode"}
          </span>
        </div>
      </div>

      {artwork ? (
        <div
          className="absolute z-20 flex gap-1.5 sm:flex-col"
          style={{
            bottom: "max(10px, env(safe-area-inset-bottom, 0px))",
            right: "max(10px, env(safe-area-inset-right, 0px))",
          }}
        >
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
        </div>
      ) : null}

      {artwork ? (
        <p className="pointer-events-none absolute inset-x-24 bottom-4 z-10 m-0 hidden text-center text-[10px] font-medium text-muted sm:block sm:bottom-6">
          AI-generated finished uniform render
        </p>
      ) : null}
    </section>
  );
}
