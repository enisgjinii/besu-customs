"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Spinner } from "@heroui/react";
import { useDesignerStore } from "@/lib/designer/store";
import { useGenerationSession } from "@/lib/designer/generation-session";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const PLACEHOLDERS = [
  {
    id: "st-agnes",
    src: "/designer/placeholders/st-agnes-uniforms.jpg",
    label: "St. Agnes",
    prompt: "St. Agnes boys and girls uniforms, black and light blue, front and back jersey views",
  },
  {
    id: "custom-flames",
    src: "/designer/placeholders/custom-flames.png",
    label: "Custom flames",
    prompt: "Three Custom basketball jerseys, black and orange flame designs, number 24",
  },
  {
    id: "fireballs-board",
    src: "/designer/placeholders/fireballs-board.jpg",
    label: "Fireballs",
    prompt: "Fireballs basketball kit, orange and black flames, NBA look, number 24",
  },
] as const;

export function GarmentCanvas() {
  const s = useDesignerStore();
  const artwork = s.artwork.front || s.artwork.back;
  const { busy, stage, kind } = useGenerationSession();
  const reduceMotion = useReducedMotion();
  const [activePlaceholder, setActivePlaceholder] = useState(0);
  const current = PLACEHOLDERS[activePlaceholder] || PLACEHOLDERS[0];

  return (
    <section className="relative h-full w-full overflow-hidden rounded-[20px] bg-[#f8f8f5] ring-1 ring-black/[0.05] md:rounded-[28px]">
      <motion.div
        id="production-canvas"
        className="absolute inset-0 flex min-h-0 items-center justify-center overflow-hidden bg-[#f8f8f5]"
        initial={reduceMotion ? false : { opacity: 0.85, scale: 0.998 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
      >
        {artwork ? (
          <svg
            viewBox="0 0 1536 1024"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Uniform preview"
            className="h-full w-full"
          >
            <rect x="0" y="0" width="1536" height="1024" fill="#f8f8f5" />
            <image
              href={artwork}
              x="48"
              y="36"
              width="1440"
              height="860"
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 flex flex-col bg-white">
            <div className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={current.id}
                  src={current.src}
                  alt={`${current.label} example uniform board`}
                  initial={reduceMotion ? false : { opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease }}
                  className="absolute inset-0 h-full w-full object-contain object-center p-3 pb-20 md:p-5 md:pb-24"
                  draggable={false}
                />
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent md:h-32" />
            </div>

            <div className="absolute inset-x-0 bottom-[76px] z-10 px-3 md:bottom-[84px] md:px-5">
              <div className="mx-auto flex max-w-[640px] gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {PLACEHOLDERS.map((item, index) => {
                  const active = index === activePlaceholder;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePlaceholder(index)}
                      aria-pressed={active}
                      className={cn(
                        "relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg bg-white ring-1 transition-shadow md:h-14 md:w-[88px]",
                        active ? "ring-2 ring-[#181816]" : "ring-black/10 hover:ring-black/25",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.label}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mx-auto mt-2 max-w-[640px] text-[11px] font-medium text-muted md:text-[12px]">
                Example · {current.label}. Type below to generate your own board.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {busy ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#f8f8f5]/72 px-6 pb-20 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 px-6 py-5 shadow-[0_12px_40px_rgba(24,24,22,0.08)] ring-1 ring-black/[0.06]">
              <Spinner size="sm" />
              <p className="m-0 text-[13px] font-semibold tracking-[-0.01em]">
                {stage || (kind === "refine" ? "Updating uniform…" : "Generating uniform…")}
              </p>
              <p className="m-0 text-[11px] text-muted">This usually takes a little while.</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
