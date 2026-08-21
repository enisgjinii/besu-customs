"use client";

import { Button } from "@heroui/react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

export function ConceptPanel() {
  const s = useDesignerStore();

  if (!s.concepts.length) {
    return (
      <section className="py-4 text-center">
        <p className="m-0 text-[13px] font-medium text-muted">No concepts yet</p>
        <Button size="sm" className="mt-3 min-h-10" onPress={() => s.setStep(1)}>
          Back
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {s.concepts.map((concept, index) => {
          const active = s.selectedConceptId === concept.id;
          return (
            <button
              key={concept.id}
              type="button"
              aria-pressed={active}
              onClick={() => s.selectConcept(concept.id)}
              className={cn(
                "overflow-hidden rounded-xl border bg-white text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                active ? "border-foreground" : "border-border/80 hover:border-foreground/30",
              )}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#f4f4f2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={concept.assetUrl} alt={`Concept ${index + 1}`} className="h-full w-full object-contain p-2" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border/60 px-3 py-2.5">
                <span className="min-w-0 truncate text-[12px] font-semibold">{index + 1}. {concept.label}</span>
                {active ? <span className="shrink-0 text-[11px] font-medium">Selected</span> : null}
              </div>
            </button>
          );
        })}
      </div>

      <Button fullWidth size="sm" variant="outline" className="min-h-10" onPress={() => s.setStep(1)}>
        New concepts
      </Button>
    </section>
  );
}
