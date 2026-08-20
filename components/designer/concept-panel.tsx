"use client";

import { Button, Chip } from "@heroui/react";
import { Check, Images, RefreshCcw, Sparkles } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

export function ConceptPanel() {
  const s = useDesignerStore();

  if (!s.concepts.length) {
    return (
      <section className="rounded-xl bg-[#f7f7f5] px-3 py-4 text-center ring-1 ring-border/60">
        <Images className="mx-auto size-5 text-muted" />
        <p className="m-0 mt-2 text-[12px] font-semibold">No AI uniforms generated yet</p>
        <p className="m-0 mt-1 text-[11px] text-muted">Return to the AI brief and generate four finished uniform renders.</p>
        <Button size="sm" className="mt-3 min-h-11" onPress={() => s.setStep(1)}>Back to AI Brief</Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" />
          <p className="m-0 text-[12px] font-semibold">Choose one direct AI uniform</p>
        </div>
        <p className="m-0 mt-1 text-[11px] leading-snug text-muted">
          Each card is a finished AI-rendered uniform concept, not a flat 2D pattern or recolor.
        </p>
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
                <img src={concept.assetUrl} alt={`${concept.label} direct AI uniform`} className="h-full w-full object-contain p-1" />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold shadow-sm">AI 0{index + 1}</span>
                {active ? (
                  <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-foreground text-white shadow-sm"><Check className="size-4" /></span>
                ) : null}
              </div>
              <div className="p-2.5">
                <p className="m-0 text-[12px] font-semibold text-foreground">{concept.label}</p>
                <p className="m-0 mt-1 line-clamp-3 text-[10px] leading-snug text-muted">{concept.direction}</p>
                {concept.colorsEnabled ? (
                  <div className="mt-2 flex gap-1">
                    {Object.values(concept.colors).map((color) => (
                      <span key={color} className="size-3 rounded-full border border-border" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                ) : (
                  <span className="mt-2 inline-block text-[9px] font-medium uppercase tracking-wide text-muted">AI-selected palette</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {s.selectedConceptId ? (
        <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
          <p className="m-0 text-[12px] font-semibold">AI uniform selected</p>
          <p className="m-0 mt-1 text-[11px] text-muted">This finished render is now the source image for AI refinement, recoloring, roster, export, and checkout.</p>
        </div>
      ) : (
        <p className="m-0 text-center text-[11px] text-muted">Select one AI uniform to continue.</p>
      )}

      <Button fullWidth size="sm" variant="outline" className="min-h-11" onPress={() => s.setStep(1)}>
        <RefreshCcw className="size-4" /> Generate four new AI uniforms
      </Button>
    </section>
  );
}
