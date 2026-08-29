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
    id: "fireballs-kit",
    src: "/designer/placeholders/fireballs-kit.jpg",
    label: "Fireballs kit",
    prompt: "Fireballs basketball uniform, black and orange flames, front and back jersey and shorts, number 24",
  },
  {
    id: "galactic-pack",
    src: "/designer/placeholders/galactic-pack.jpg",
    thumb: "/designer/placeholders/galactic-1.jpg",
    label: "Galactic pack",
    prompt: "Three Galactic basketball uniforms, space theme, moon and comets, black purple white, number 24",
  },
] as const;

export function GarmentCanvas() {
  const s = useDesignerStore();
  const artwork = s.artwork.front || s.artwork.back;
  const awaitingChoice = s.concepts.length > 0 && !s.selectedConceptId;
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
        ) : awaitingChoice ? (
          // Concepts exist but none is chosen yet. Showing the inspiration gallery here would read as
          // the customer's own result, so the canvas asks for the choice instead.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white px-6 text-center">
            <p className="m-0 text-[13px] font-semibold tracking-[-0.01em] md:text-[15px]">
              {s.concepts.length} concepts ready
            </p>
            <p className="m-0 max-w-[22rem] text-[11.5px] leading-snug text-muted md:text-[12.5px]">
              Pick the direction you like best and it will open here at full size, ready to refine.
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex bg-white">
            <aside className="relative z-10 flex w-[92px] shrink-0 flex-col items-stretch gap-3 self-center py-4 pl-3 md:w-[108px] md:gap-3.5 md:pl-4">
              {PLACEHOLDERS.map((item, index) => {
                const active = index === activePlaceholder;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePlaceholder(index)}
                    aria-pressed={active}
                    className="flex w-full flex-col items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
                  >
                    <span
                      className={cn(
                        "relative block h-14 w-full overflow-hidden rounded-lg bg-white ring-1 transition-shadow md:h-16",
                        active ? "ring-2 ring-[#181816]" : "ring-black/10 hover:ring-black/25",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={"thumb" in item && item.thumb ? item.thumb : item.src}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </span>
                    <span
                      className={cn(
                        "w-full truncate text-center text-[10px] font-semibold leading-tight tracking-[-0.01em] md:text-[11px]",
                        active ? "text-foreground" : "text-muted",
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </aside>

            <div className="relative min-h-0 min-w-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={current.id}
                  src={current.src}
                  alt={`${current.label} example uniform board`}
                  initial={reduceMotion ? false : { opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease }}
                  className="absolute inset-0 h-full w-full object-contain object-center p-3 pb-24 md:p-5 md:pb-28"
                  draggable={false}
                />
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent md:h-32" />
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
