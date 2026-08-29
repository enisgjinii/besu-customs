"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/react";
import { Check } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
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
    <section className="flex flex-col gap-2.5">
      <p className="m-0 text-[11px] font-medium text-muted">
        {s.selectedConceptId
          ? "Selected. Continue to refine this design."
          : `Pick one of ${s.concepts.length} concepts to continue.`}
      </p>

      {/* Two columns so all four concepts are visible together without scrolling the choice step. */}
      <div className="grid grid-cols-2 gap-2" data-concept-grid="true">
        {s.concepts.map((concept, index) => {
          const active = s.selectedConceptId === concept.id;
          return (
            <motion.button
              key={concept.id}
              type="button"
              aria-pressed={active}
              onClick={() => s.selectConcept(concept.id)}
              whileTap={reduceMotion ? undefined : { scale: 0.995 }}
              transition={{ duration: reduceMotion ? 0 : 0.16, ease }}
              data-concept-card={concept.id}
              data-selected={active ? "true" : "false"}
              className={cn(
                "overflow-hidden rounded-[14px] bg-black/[0.025] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                active ? "ring-2 ring-[#181816]" : "hover:bg-black/[0.04]",
              )}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#f4f3ef]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={concept.assetUrl}
                  alt={`Concept ${index + 1} of ${s.concepts.length}: ${concept.label} uniform for ${s.teamName || "your team"}`}
                  loading={index > 0 ? "lazy" : "eager"}
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
              <div className={cn("flex items-center gap-1.5 px-2.5 py-2", active && "bg-white")}>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold tracking-[-0.01em]">{concept.label}</span>
                {active ? (
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#181816] px-1.5 py-0.5 text-[9.5px] font-semibold text-white">
                    <Check className="size-2.5" aria-hidden />
                    Selected
                  </span>
                ) : null}
              </div>
            </motion.button>
          );
        })}
      </div>

      <Button fullWidth size="sm" variant="ghost" className="min-h-10 rounded-xl text-muted" onPress={() => s.setStep(1)}>
        New set
      </Button>
    </section>
  );
}
