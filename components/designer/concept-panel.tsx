"use client";

import { Button } from "@heroui/react";
import { Check, Images, RefreshCcw } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

export function ConceptPanel() {
  const s = useDesignerStore();

  if (!s.concepts.length) {
    return (
      <section className="rounded-2xl bg-[#f7f7f5] px-4 py-5 text-center ring-1 ring-border/60">
        <Images className="mx-auto size-5 text-muted" />
        <p className="m-0 mt-2 text-[13px] font-semibold">No AI uniforms yet</p>
        <p className="mx-auto mt-1 max-w-[280px] text-[11px] leading-snug text-muted">
          Go back to the brief and generate four designs.
        </p>
        <Button size="sm" className="mt-3 min-h-11" onPress={() => s.setStep(1)}>
          Back to AI Brief
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="m-0 text-[12px] leading-relaxed text-muted">
        Pick the uniform you like. You can refine colors and details in the next step.
      </p>

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
                "overflow-hidden rounded-2xl border bg-white text-left transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                active
                  ? "border-foreground shadow-sm ring-2 ring-foreground/10"
                  : "border-border/80 hover:border-foreground/30",
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f4f4f2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={concept.assetUrl}
                  alt={`${concept.label} AI uniform`}
                  className="h-full w-full object-contain p-2"
                />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold shadow-sm">
                  Option {index + 1}
                </span>
                {active ? (
                  <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-foreground text-white shadow-sm">
                    <Check className="size-4" />
                  </span>
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="m-0 text-[13px] font-semibold">{concept.label}</p>
                  <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
                    {concept.direction}
                  </p>
                </div>
                <span className={cn("shrink-0 text-[11px] font-semibold", active ? "text-foreground" : "text-muted")}> 
                  {active ? "Selected" : "Choose"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!s.selectedConceptId ? (
        <p className="m-0 text-center text-[11px] font-medium text-muted">Choose one option to continue.</p>
      ) : null}

      <Button fullWidth size="sm" variant="outline" className="min-h-11" onPress={() => s.setStep(1)}>
        <RefreshCcw className="size-4" /> Generate new options
      </Button>
    </section>
  );
}
