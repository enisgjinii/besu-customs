"use client";

import { ColorControl } from "./color-control";
import { LOADING_STAGES } from "./designer-steps";
import { generateUniformKit, isGenerationInFlight } from "@/lib/designer/generation-client";
import { COLOR_VARIATION_PRESETS } from "@/lib/designer/openai-service";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignerColors } from "@/lib/designer/types";
import { cn } from "@/lib/utils";
import {
  Alert,
  Button,
  Chip,
  Separator,
  Spinner,
  TextArea,
  TextField,
  Label,
} from "@heroui/react";
import { History, Palette, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function RefinePanel() {
  const s = useDesignerStore();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<(typeof LOADING_STAGES)[number] | "">("");
  const [error, setError] = useState("");
  const hasArtwork = Boolean(s.artwork.front || s.artwork.back);

  async function runMode(mode: "refine" | "color_variation", colors?: DesignerColors) {
    if (busy || isGenerationInFlight() || !hasArtwork) return;
    setError("");
    setBusy(true);
    setStage(LOADING_STAGES[0]);
    const previousArtwork = { ...s.artwork };
    const previousColors = { ...s.colors };

    try {
      const nextColors = colors || s.colors;
      if (colors) s.patch({ colors: nextColors, colorsEnabled: true });

      const result = await generateUniformKit({
        state: { ...useDesignerStore.getState(), colors: nextColors, colorsEnabled: true },
        mode,
        colors: nextColors,
        correction: mode === "refine" ? s.correction : undefined,
        views: ["front", "back"],
        onProgress: ({ stage: next }) => setStage(next),
      });

      for (const version of result.versions) s.addVersion(version);
      s.patch({ colors: result.colors, colorsEnabled: true });
    } catch (e) {
      s.patch({ artwork: previousArtwork, colors: previousColors });
      const message = e instanceof Error ? e.message : "Could not update the direct AI render. Previous version kept.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  if (!hasArtwork) {
    return (
      <section className="rounded-2xl bg-[#f7f7f5] px-4 py-5 text-center ring-1 ring-border/60">
        <p className="m-0 text-[13px] font-semibold">Generate a direct AI uniform first</p>
        <p className="mx-auto mt-1 max-w-[280px] text-[11px] leading-snug text-muted">
          Refinement and color variations unlock after you select one of the four AI renders.
        </p>
        <Button size="sm" className="mt-3 min-h-11 max-[360px]:w-full" onPress={() => s.setStep(1)}>
          Back to Brief
        </Button>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 shrink-0" />
          <p className="m-0 text-[12px] font-semibold">Direct AI refinement</p>
        </div>
        <p className="m-0 mt-1 text-[11px] leading-snug text-muted">
          Every change edits the selected finished uniform render directly.
        </p>
      </div>

      <div className="min-w-0">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Quick color directions</p>
        <div className="grid grid-cols-1 gap-1.5 min-[430px]:grid-cols-2">
          {COLOR_VARIATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => void runMode("color_variation", preset.colors)}
              className={cn(
                "flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-border/80 bg-white px-3 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:opacity-50",
              )}
            >
              <span className="flex shrink-0 gap-1">
                {Object.values(preset.colors).map((color) => (
                  <span key={color} className="size-3.5 rounded-full border border-border" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{preset.label}</span>
              <Palette className="size-3.5 shrink-0 text-muted" />
            </button>
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
          className="mt-2 min-h-11"
          isDisabled={busy}
          isPending={busy}
          onPress={() => void runMode("color_variation", s.colors)}
        >
          {busy ? <Spinner size="sm" /> : <Palette className="size-4 shrink-0" />}
          <span className="truncate">Apply custom colors with AI</span>
        </Button>
      </div>

      <Separator />

      <TextField fullWidth name="correction" value={s.correction} onChange={(value) => s.patch({ correction: value })}>
        <Label>Tell AI what to change</Label>
        <TextArea
          placeholder="Keep this exact uniform but make the comets sharper, trim thinner, and shorts graphics more aggressive"
          rows={3}
          maxLength={400}
          className="min-h-[104px]"
        />
      </TextField>

      <Button
        fullWidth
        size="sm"
        className="min-h-12 font-semibold"
        isDisabled={busy || s.correction.trim().length < 4}
        isPending={busy}
        onPress={() => void runMode("refine")}
      >
        {busy ? <Spinner size="sm" color="current" /> : <Sparkles className="size-4 shrink-0" />}
        <span className="truncate">{busy ? stage || "Updating AI render…" : "Refine with AI"}</span>
      </Button>

      {error ? (
        <Alert status="danger" className="py-2">
          <Alert.Content><Alert.Title className="text-xs">{error}</Alert.Title></Alert.Content>
        </Alert>
      ) : null}

      {s.history.length > 0 ? (
        <>
          <Separator />
          <div className="flex items-center gap-1.5">
            <History className="size-4 shrink-0 text-muted" />
            <span className="text-xs font-semibold">AI render history</span>
            <Chip size="sm">{`${s.history.length}/12`}</Chip>
          </div>
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {s.history.map((version, index) => (
              <button
                type="button"
                key={`${version.id}-${version.view}`}
                onClick={() => s.restoreVersion(version)}
                className={cn(
                  "min-h-11 min-w-[112px] snap-start rounded-xl border border-border bg-background p-1.5 text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                  version.assetUrl === s.artwork[version.view] ? "border-foreground/45 ring-1 ring-foreground/15" : "hover:border-foreground/25",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={version.assetUrl}
                  alt={`AI render version ${s.history.length - index}`}
                  className="block aspect-[4/3] w-full rounded-md bg-[rgba(15,23,42,0.06)] object-contain"
                />
                <span className="mt-1 block truncate text-[11px] font-semibold">AI v{s.history.length - index}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
