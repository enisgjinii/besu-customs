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
  Separator,
  Spinner,
  TextArea,
  TextField,
  Label,
} from "@heroui/react";
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
      const message = e instanceof Error ? e.message : "Update failed.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  if (!hasArtwork) {
    return (
      <section className="py-4 text-center">
        <p className="m-0 text-[13px] font-medium text-muted">Choose a concept first</p>
        <Button size="sm" className="mt-3 min-h-10" onPress={() => s.setStep(2)}>Back</Button>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div>
        <p className="mb-2 text-[12px] font-medium">Colors</p>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_VARIATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={busy}
              onClick={() => void runMode("color_variation", preset.colors)}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-border/80 bg-white px-2.5 text-left text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:opacity-50"
            >
              <span className="flex shrink-0 gap-1">
                {Object.values(preset.colors).map((color) => (
                  <span key={color} className="size-3 rounded-full border border-border" style={{ backgroundColor: color }} />
                ))}
              </span>
              <span className="min-w-0 truncate">{preset.label}</span>
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
          className="mt-2 min-h-10"
          isDisabled={busy}
          isPending={busy}
          onPress={() => void runMode("color_variation", s.colors)}
        >
          {busy ? <Spinner size="sm" /> : null}
          Apply colors
        </Button>
      </div>

      <Separator />

      <TextField fullWidth name="correction" value={s.correction} onChange={(value) => s.patch({ correction: value })}>
        <Label>Change</Label>
        <TextArea placeholder="Sharper comets, thinner trim, darker shorts" rows={3} maxLength={400} className="min-h-[96px]" />
      </TextField>

      <Button
        fullWidth
        size="sm"
        className="min-h-11 font-semibold"
        isDisabled={busy || s.correction.trim().length < 4}
        isPending={busy}
        onPress={() => void runMode("refine")}
      >
        {busy ? <Spinner size="sm" color="current" /> : null}
        <span>{busy ? stage || "Updating…" : "Update"}</span>
      </Button>

      {error ? (
        <Alert status="danger" className="py-2">
          <Alert.Content><Alert.Title className="text-xs">{error}</Alert.Title></Alert.Content>
        </Alert>
      ) : null}

      {s.history.length > 0 ? (
        <>
          <Separator />
          <p className="m-0 text-[12px] font-medium">History · {s.history.length}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {s.history.map((version, index) => (
              <button
                type="button"
                key={`${version.id}-${version.view}`}
                onClick={() => s.restoreVersion(version)}
                className={cn(
                  "min-w-[96px] rounded-lg border border-border bg-background p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                  version.assetUrl === s.artwork[version.view] ? "border-foreground" : "hover:border-foreground/25",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={version.assetUrl} alt={`Version ${s.history.length - index}`} className="block aspect-[4/3] w-full rounded-md bg-[#f7f7f5] object-contain" />
                <span className="mt-1 block text-[10px] font-medium">v{s.history.length - index}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
