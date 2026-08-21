"use client";

import { useDesignerStore } from "@/lib/designer/store";

export function GarmentCanvas() {
  const s = useDesignerStore();
  const artwork = s.artwork.front || s.artwork.back;

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
          aria-label="Uniform preview"
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
            />
          ) : (
            <g opacity="0.7">
              <rect x="260" y="190" width="680" height="520" rx="46" fill="#ffffff" stroke="#deded8" strokeWidth="4" strokeDasharray="16 14" />
            </g>
          )}
        </svg>

        {!artwork ? (
          <p className="pointer-events-none absolute m-0 text-[12px] font-medium text-muted">Preview</p>
        ) : null}
      </div>
    </section>
  );
}
