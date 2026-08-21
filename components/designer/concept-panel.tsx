"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function ConceptPanel() {
  const s = useDesignerStore();
  const reduceMotion = useReducedMotion();

  if (!s.concepts.length) {
    return (
      <section className="py-6 text-center">
        <p className="m-0 text-[12px] font-medium text-muted">Nothing yet</p>
        <Button size="sm" variant="ghost" className="mt-2 min-h-9" onPress={() => s.setStep(1)}>
          Back
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2.5">
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
            className={cn(
              "overflow-hidden rounded-[14px] bg-black/[0.025] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
              active ? "ring-1 ring-[#181816]" : "hover:bg-black/[0.04]",
            )}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#f4f3ef]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={concept.assetUrl}
                alt={`Concept ${index + 1}`}
                loading={index > 0 ? "lazy" : "eager"}
                decoding="async"
                draggable={false}
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <div className={cn("px-3 py-2.5", active && "bg-white")}>
              <span className="block truncate text-[12px] font-semibold tracking-[-0.01em]">{concept.label}</span>
            </div>
          </motion.button>
        );
      })}

      <Button fullWidth size="sm" variant="ghost" className="min-h-10 rounded-xl text-muted" onPress={() => s.setStep(1)}>
        New set
      </Button>
    </section>
  );
}
