"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { LockKeyhole, Sparkles, Type } from "lucide-react";
import { ColorControl } from "./color-control";
import { useDesignerGeneration } from "@/hooks/use-designer-generation";
import { COLOR_VARIATION_PRESETS } from "@/lib/designer/openai-service";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";
import { Button, Input, Spinner, TextArea, TextField, Label } from "@heroui/react";

const ease = [0.22, 1, 0.36, 1] as const;

const QUICK_REFINES = [
  { label: "Cleaner", prompt: "Reduce decorative clutter and keep the same design language, layout and palette." },
  { label: "More dynamic", prompt: "Increase visual energy and movement without changing the core motif, layout or garment structure." },
  { label: "Sharper trim", prompt: "Make piping and trim geometry cleaner, more precise and production-ready without redesigning the uniform." },
  { label: "More premium", prompt: "Polish the same concept with more refined spacing, material detail and professional sportswear finishing." },
] as const;

export function RefinePanel() {
  const s = useDesignerStore();
  const { busy, stage, error, refineCurrent } = useDesignerGeneration();
  const reduceMotion = useReducedMotion();
  const hasArtwork = Boolean(s.artwork.front || s.artwork.back);
  const [teamDraft, setTeamDraft] = useState<string | null>(null);
  const visibleTeamName = teamDraft ?? s.teamName;

  if (!hasArtwork) {
    return (
      <section className="py-6 text-center">
        <p className="m-0 text-[12px] font-medium text-muted">Generate a design first</p>
        <Button size="sm" variant="ghost" className="mt-2 min-h-9" onPress={() => s.setStep(1)}>Back</Button>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <div className="rounded-[14px] border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-black/[0.04]">
              <Type className="size-3.5" aria-hidden />
            </span>
            <div>
              <p className="m-0 text-[10.5px] font-semibold">Team wordmark</p>
              <p className="m-0 mt-0.5 text-[9px] text-muted">Exact app typography · never AI-spelled</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8.5px] font-bold text-emerald-700">EXACT TEXT</span>
        </div>
        <TextField fullWidth name="refine-team-name" value={visibleTeamName} onChange={(value) => setTeamDraft(value.slice(0, 60))}>
          <Label>Team name</Label>
          <Input maxLength={60} className="min-h-10" />
        </TextField>
        <Button
          fullWidth
          size="sm"
          variant="outline"
          className="mt-2 min-h-10 rounded-xl font-semibold"
          isDisabled={visibleTeamName.trim().length < 2 || visibleTeamName.trim() === s.teamName.trim()}
          onPress={() => {
            const next = visibleTeamName.trim().slice(0, 60);
            s.patch({ teamName: next });
            setTeamDraft(null);
          }}
        >
          Update wordmark
        </Button>
        <p className="mb-0 mt-2 text-[9px] leading-snug text-muted">Updates instantly without regenerating the uniform. The same exact wording is carried into SVG, PNG and PDF exports.</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="m-0 text-[11px] font-semibold">Color variation</p>
          <span className="flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-1 text-[8.5px] font-semibold text-muted">
            <LockKeyhole className="size-2.5" aria-hidden />
            DESIGN LOCKED
          </span>
        </div>
        <p className="mb-2.5 mt-0 text-[9.5px] leading-snug text-muted">Recolors edit the selected master image. Panels, motifs, piping and geometry stay in place.</p>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COLOR_VARIATION_PRESETS.map((preset) => (
            <motion.button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => void refineCurrent("Apply this palette.", preset.colors)}
              whileTap={reduceMotion || busy ? undefined : { scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.15, ease }}
              className="flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-2.5 text-[10px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-40"
            >
              <span className="flex shrink-0 -space-x-0.5" aria-hidden>
                {Object.values(preset.colors).map((color) => (
                  <span key={color} className="size-3 rounded-full ring-1 ring-white" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span>{preset.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <ColorControl label="primary" value={s.colors.primary} onChange={(value) => s.patch({ colors: { ...s.colors, primary: value } })} />
          <ColorControl label="secondary" value={s.colors.secondary} onChange={(value) => s.patch({ colors: { ...s.colors, secondary: value } })} />
          <ColorControl label="accent" value={s.colors.accent} onChange={(value) => s.patch({ colors: { ...s.colors, accent: value } })} />
        </div>

        <Button
          fullWidth
          size="sm"
          variant="outline"
          className="mt-2 min-h-10 rounded-xl font-semibold"
          isDisabled={busy}
          isPending={busy}
          onPress={() => void refineCurrent("Apply this palette.", s.colors)}
        >
          {busy ? <Spinner size="sm" /> : null}
          Recolor only
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-3.5" aria-hidden />
          <p className="m-0 text-[11px] font-semibold">Artwork refinement</p>
        </div>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {QUICK_REFINES.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={busy}
              onClick={() => s.patch({ correction: item.prompt })}
              className="min-h-8 rounded-full bg-black/[0.035] px-3 text-[9.5px] font-semibold text-foreground/70 transition-colors hover:bg-black/[0.06] hover:text-foreground disabled:opacity-40"
            >
              {item.label}
            </button>
          ))}
        </div>

        <TextField fullWidth name="correction" value={s.correction} onChange={(value) => s.patch({ correction: value })}>
          <Label>Change artwork</Label>
          <TextArea placeholder="Sharper comets, thinner trim, darker shorts" rows={3} maxLength={400} className="min-h-[94px]" />
        </TextField>

        <Button
          fullWidth
          size="sm"
          className="mt-2 min-h-11 rounded-xl font-semibold"
          isDisabled={busy || s.correction.trim().length < 4}
          isPending={busy}
          onPress={() => void refineCurrent(s.correction)}
        >
          {busy ? <Spinner size="sm" color="current" /> : null}
          <span>{busy ? stage || "Updating…" : "Refine with GPT Image 2"}</span>
        </Button>
      </div>

      {error ? <p role="alert" className="m-0 text-[11px] font-medium text-danger">{error}</p> : null}

      {s.history.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="m-0 text-[11px] font-semibold">Versions</p>
            <span className="text-[9px] font-medium text-muted">Tap to restore</span>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {s.history.map((version, index) => {
              const active = version.assetUrl === s.artwork[version.view];
              return (
                <motion.button
                  type="button"
                  key={`${version.id}-${version.view}`}
                  onClick={() => s.restoreVersion(version)}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className={cn(
                    "min-w-[92px] overflow-hidden rounded-[10px] border border-black/[0.06] bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                    active && "border-foreground ring-1 ring-foreground",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={version.assetUrl}
                    alt={`Version ${s.history.length - index}`}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[4/3] w-full rounded-md bg-[#f7f7f5] object-contain"
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
