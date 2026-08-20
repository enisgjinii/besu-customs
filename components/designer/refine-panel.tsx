"use client";

import { ColorControl } from "./color-control";
import { ArtworkControls } from "./artwork-controls";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
      const message =
        e instanceof Error ? e.message : "Could not update the design. Previous version kept.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  if (!hasArtwork) {
    return (
      <section className="rounded-xl bg-[#f7f7f5] px-3 py-4 text-center ring-1 ring-border/60">
        <p className="m-0 text-[12px] font-semibold">Generate a design first</p>
        <p className="m-0 mt-1 text-[11px] text-muted">
          Refinement and color variations unlock after AI creates your kit.
        </p>
        <Button size="sm" className="mt-3 min-h-11" onPress={() => s.setStep(1)}>
          Back to Design
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Try different colors
        </p>
        <div className="flex flex-col gap-1.5">
          {COLOR_VARIATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => void runMode("color_variation", preset.colors)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-white px-3 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                "disabled:opacity-50",
              )}
            >
              <span className="flex gap-1">
                {Object.values(preset.colors).map((color) => (
                  <span
                    key={color}
                    className="size-3.5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="flex-1 text-[12px] font-semibold">{preset.label}</span>
              <Palette className="size-3.5 text-muted" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          <ColorControl
            label="primary"
            value={s.colors.primary}
            onChange={(value) => s.patch({ colors: { ...s.colors, primary: value } })}
          />
          <ColorControl
            label="secondary"
            value={s.colors.secondary}
            onChange={(value) => s.patch({ colors: { ...s.colors, secondary: value } })}
          />
          <ColorControl
            label="accent"
            value={s.colors.accent}
            onChange={(value) => s.patch({ colors: { ...s.colors, accent: value } })}
          />
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
          {busy ? <Spinner size="sm" /> : <Palette className="size-4" />}
          Apply custom colors
        </Button>
      </div>

      <Separator />

      <TextField
        fullWidth
        name="correction"
        value={s.correction}
        onChange={(value) => s.patch({ correction: value })}
      >
        <Label>Refine concept</Label>
        <TextArea
          placeholder="Keep the space theme but make comets sharper and panels more angular"
          rows={2}
          maxLength={400}
        />
      </TextField>

      <Button
        fullWidth
        size="sm"
        className="min-h-11 font-semibold"
        isDisabled={busy || s.correction.trim().length < 4}
        isPending={busy}
        onPress={() => void runMode("refine")}
      >
        {busy ? <Spinner size="sm" color="current" /> : <Sparkles className="size-4" />}
        {busy ? stage || "Updating…" : "Refine design"}
      </Button>

      {error && (
        <Alert status="danger" className="py-2">
          <Alert.Content>
            <Alert.Title className="text-xs">{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      {s.history.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-1.5">
            <History className="size-4 text-muted" />
            <span className="text-xs font-semibold">Version history</span>
            <Chip size="sm">{`${s.history.length}/12`}</Chip>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {s.history.map((version, index) => (
              <button
                type="button"
                key={`${version.id}-${version.view}`}
                onClick={() => s.restoreVersion(version)}
                className={cn(
                  "min-h-11 min-w-[72px] rounded-xl border border-border bg-background p-1.5 text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                  version.assetUrl === s.artwork[version.view]
                    ? "border-foreground/45 ring-1 ring-foreground/15"
                    : "hover:border-foreground/25",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={version.assetUrl}
                  alt={`Version ${s.history.length - index}`}
                  className="block h-[52px] w-full rounded-md bg-[rgba(15,23,42,0.06)] object-cover"
                />
                <span className="mt-1 block truncate text-[11px] font-semibold">
                  {version.view} · v{s.history.length - index}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <Separator />

      <Button
        fullWidth
        size="sm"
        variant="outline"
        className="min-h-11"
        onPress={() => setShowAdvanced((open) => !open)}
      >
        {showAdvanced ? "Hide advanced placement" : "Advanced placement"}
      </Button>

      {showAdvanced ? <ArtworkControls /> : null}
    </section>
  );
}
