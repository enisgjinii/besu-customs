"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/react";
import { Check, Layers3 } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import { AI_MASTER_BOARD } from "@/lib/designer/typography";
import { ApprovedLogoOverlay } from "./approved-logo-overlay";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function ConceptPanel() {
  const s = useDesignerStore();
  const reduceMotion = useReducedMotion();

  if (!s.concepts.length) {
    return (
      <section className="py-6 text-center">
        <p className="m-0 text-[12px] font-medium text-muted">Generate a design first</p>
        <Button size="sm" variant="ghost" className="mt-2 min-h-9" onPress={() => s.setStep(1)}>
          Back
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-semibold">
            {s.selectedConceptId ? "Direction selected" : "Choose a direction"}
          </p>
          <p className="m-0 mt-0.5 text-[9.5px] leading-snug text-muted">
            Every option uses the same GPT Image 2 render standard with exactly one front kit and one matching back kit.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/[0.04] px-2 py-1 text-[9px] font-semibold text-muted">
          <Layers3 className="size-3" aria-hidden />
          {s.concepts.length} concepts
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2" data-concept-grid="true">
        {s.concepts.map((concept, index) => {
          const active = s.selectedConceptId === concept.id;
          return (
            <motion.button
              key={concept.id}
              type="button"
              aria-pressed={active}
              title={concept.direction}
              onClick={() => s.selectConcept(concept.id)}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.995 }}
              transition={{ duration: reduceMotion ? 0 : 0.16, ease }}
              data-concept-card={concept.id}
              data-selected={active ? "true" : "false"}
              className={cn(
                "group overflow-hidden rounded-[16px] border bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.025)] transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                active
                  ? "border-[#181816] shadow-[0_5px_18px_rgba(0,0,0,0.08)] ring-1 ring-[#181816]"
                  : "border-black/[0.06] hover:border-black/[0.13] hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)]",
              )}
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#f4f3ef]">
                <svg
                  viewBox={`0 0 ${AI_MASTER_BOARD.width} ${AI_MASTER_BOARD.height}`}
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label={`Concept ${index + 1} of ${s.concepts.length}: ${concept.label} uniform for ${s.teamName || "your team"}`}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-[1.01]"
                >
                  <rect width={AI_MASTER_BOARD.width} height={AI_MASTER_BOARD.height} fill="#f4f3ef" />
                  <image
                    href={concept.assetUrl}
                    x="0"
                    y="0"
                    width={AI_MASTER_BOARD.width}
                    height={AI_MASTER_BOARD.height}
                    preserveAspectRatio="none"
                  />
                  <ApprovedLogoOverlay view="board" logoUrl={s.logoUrl} />
                </svg>
                <span className="absolute left-2 top-2 rounded-full border border-black/[0.06] bg-white/90 px-2 py-1 text-[8.5px] font-bold backdrop-blur">
                  FRONT + BACK
                </span>
                {active ? (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#181816] text-white shadow-sm">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                ) : null}
              </div>

              <div className="px-2.5 pb-2.5 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-[9px] font-bold tabular-nums text-muted">0{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold tracking-[-0.01em]">{concept.label}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[8.5px] font-medium text-muted">Same master · AI wordmark</span>
                  <span className="flex shrink-0 -space-x-0.5" aria-label="Concept palette">
                    {Object.values(concept.colors).map((color) => (
                      <span
                        key={color}
                        className="size-3 rounded-full border border-white ring-1 ring-black/[0.06]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {s.selectedConceptId ? (
        <div className="rounded-xl border border-emerald-600/10 bg-emerald-500/[0.055] px-3 py-2.5">
          <p className="m-0 text-[10px] font-semibold text-emerald-800">Ready to refine</p>
          <p className="m-0 mt-0.5 text-[9.5px] leading-snug text-emerald-800/70">Color changes and refinements will edit this exact master instead of generating a new design.</p>
        </div>
      ) : null}

      <Button fullWidth size="sm" variant="ghost" className="min-h-10 rounded-xl text-muted" onPress={() => s.setStep(1)}>
        Generate a new set
      </Button>
    </section>
  );
}
