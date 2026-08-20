"use client";

import { Button, Chip } from "@heroui/react";
import { Check, Images, RefreshCcw } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

export function ConceptPanel() {
  const s = useDesignerStore();

  if (!s.concepts.length) {
    return (
      <section className="rounded-xl bg-[#f7f7f5] px-3 py-4 text-center ring-1 ring-border/60">
        <Images className="mx-auto size-5 text-muted" />
        <p className="m-0 mt-2 text-[12px] font-semibold">No concepts generated yet</p>
        <p className="m-0 mt-1 text-[11px] text-muted">Return to the brief and create four directions first.</p>
        <Button size="sm" className="mt-3 min-h-11" onPress={() => s.setStep(1)}>Back to Brief</Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="m-0 text-[12px] font-semibold">Choose one direction</p>
          <p className="m-0 mt-0.5 text-[11px] text-muted">These are separate compositions, not color variations.</p>
        </div>
        <Chip size="sm" variant="secondary">4 concepts</Chip>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {s.concepts.map((concept, index) => {
          const active = s.selectedConceptId === concept.id;
          return (
            <button
              key={concept.id}
              type="button"
              aria-pressed={active}
              onClick={() => s.selectConcept(concept.id)}
              className={cn(
                "group overflow-hidden rounded-2xl border bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                active ? "border-foreground ring-2 ring-foreground/15" : "border-border/80 hover:border-foreground/30",
              )}
            >
              <div className="relative aspect-square overflow-hidden bg-[#f4f4f2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={concept.assetUrl} alt={`${concept.label} uniform concept`} className="h-full w-full object-contain p-1" />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold shadow-sm">0{index + 1}</span>
                {active ? (
                  <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-foreground text-white shadow-sm"><Check className="size-4" /></span>
                ) : null}
              </div>
              <div className="p-2.5">
                <p className="m-0 text-[12px] font-semibold text-foreground">{concept.label}</p>
                <p className="m-0 mt-1 line-clamp-3 text-[10px] leading-snug text-muted">{concept.direction}</p>
                <div className="mt-2 flex gap-1">
                  {Object.values(concept.colors).map((color) => (
                    <span key={color} className="size-3 rounded-full border border-border" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {s.selectedConceptId ? (
        <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
          <p className="m-0 text-[12px] font-semibold">Concept selected</p>
          <p className="m-0 mt-1 text-[11px] text-muted">This artwork is now loaded into the jersey + shorts preview and will be the base for refinement.</p>
        </div>
      ) : (
        <p className="m-0 text-center text-[11px] text-muted">Select one concept to continue.</p>
      )}

      <Button fullWidth size="sm" variant="outline" className="min-h-11" onPress={() => s.setStep(1)}>
        <RefreshCcw className="size-4" /> Generate another set
      </Button>
    </section>
  );
}
