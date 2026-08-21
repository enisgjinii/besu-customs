"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useDesignerStore } from "@/lib/designer/store";

const ease = [0.22, 1, 0.36, 1] as const;

export function GarmentCanvas() {
  const s = useDesignerStore();
  const artwork = s.artwork.front || s.artwork.back;
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative h-full w-full overflow-hidden rounded-[20px] bg-[#f8f8f5] ring-1 ring-black/[0.05] md:rounded-[28px]">
      <motion.div
        id="production-canvas"
        className="absolute inset-0 flex min-h-0 items-center justify-center overflow-hidden bg-[#f8f8f5]"
        initial={reduceMotion ? false : { opacity: 0.85, scale: 0.998 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
      >
        <svg
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Uniform preview"
          className="h-full w-full"
        >
          <rect x="0" y="0" width="1200" height="900" fill="#f8f8f5" />

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
            <g fill="none" stroke="#c9c7c0" strokeWidth="3" opacity="0.48">
              <path d="M360 274 430 228h92l45 50 45-50h92l70 46-43 101-55-24v292H458V351l-55 24-43-101Z" />
              <path d="M490 642h220l34 146H456l34-146Z" />
              <path d="M535 228c8 38 37 59 65 59s57-21 65-59" />
            </g>
          )}
        </svg>
      </motion.div>
    </section>
  );
}
