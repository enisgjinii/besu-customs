"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ColorControl } from "./color-control";
import { useDesignerGeneration } from "@/hooks/use-designer-generation";
import { COLOR_VARIATION_PRESETS } from "@/lib/designer/openai-service";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";
import { Button, Spinner, TextArea, TextField, Label } from "@heroui/react";

const ease = [0.22, 1, 0.36, 1] as const;

export function RefinePanel() {
  const s = useDesignerStore();
  const { busy, stage, error, refineCurrent } = useDesignerGeneration();
  const reduceMotion = useReducedMotion();
  const hasArtwork = Boolean(s.artwork.front || s.artwork.back);

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
      <div>
        <p className="mb-2 text-[11px] font-medium text-muted">Colors</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COLOR_VARIATION_PRESETS.map((preset) => (
            <motion.button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => void refineCurrent("Apply this palette.", preset.colors)}
              whileTap={reduceMotion || busy ? undefined : { scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.15, ease }}
              className="flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-black/[0.035] px-2.5 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-40"
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
          className="mt-2 min-h-10 rounded-xl"
          isDisabled={busy}
          isPending={busy}
          onPress={() => void refineCurrent("Apply this palette.", s.colors)}
        >
          {busy ? <Spinner size="sm" /> : null}
          Apply
        </Button>
      </div>

      <div>
        <TextField fullWidth name="correction" value={s.correction} onChange={(value) => s.patch({ correction: value })}>
          <Label>Change</Label>
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
          <span>{busy ? stage || "Updating…" : "Update"}</span>
        </Button>
      </div>

      {error ? <p role="alert" className="m-0 text-[11px] font-medium text-danger">{error}</p> : null}

      {s.history.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-medium text-muted">Versions</p>
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
                    "min-w-[88px] overflow-hidden rounded-lg bg-black/[0.025] p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                    active && "ring-1 ring-foreground",
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
