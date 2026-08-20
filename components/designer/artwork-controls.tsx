"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Label,
  Separator,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { Focus, History, RotateCcw } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

type Layer = "artwork" | "text";

export function ArtworkControls({ forcedLayer }: { forcedLayer?: Layer }) {
  const s = useDesignerStore();
  const [layerState, setLayer] = useState<Layer>("artwork");
  const layer = forcedLayer ?? layerState;
  const artwork = s.transforms[s.view];
  const text = s.textTransforms[s.view];
  const hasArtwork = Boolean(s.artwork[s.view]);
  const rows = layer === "artwork" ? [
    { key: "scale" as const, label: "Scale", value: artwork.scale, min: .55, max: 1.35, step: .01, text: `${Math.round(artwork.scale * 100)}%` },
    { key: "x" as const, label: "Horizontal", value: artwork.x, min: -100, max: 100, step: 1, text: `${artwork.x}px` },
    { key: "y" as const, label: "Vertical", value: artwork.y, min: -100, max: 100, step: 1, text: `${artwork.y}px` },
    { key: "rotation" as const, label: "Rotation", value: artwork.rotation, min: -12, max: 12, step: 1, text: `${artwork.rotation}°` },
  ] : [
    { key: "scale" as const, label: "Text size", value: text.scale, min: .65, max: 1.25, step: .01, text: `${Math.round(text.scale * 100)}%` },
    { key: "x" as const, label: "Horizontal", value: text.x, min: -35, max: 35, step: 1, text: `${text.x}px` },
    { key: "y" as const, label: "Vertical", value: text.y, min: -55, max: 55, step: 1, text: `${text.y}px` },
  ];

  function update(key: "scale" | "x" | "y" | "rotation", value: number) {
    if (layer === "artwork") s.setTransform({ [key]: value });
    else if (key !== "rotation") s.setTextTransform({ [key]: value });
  }

  function reset() {
    if (layer === "artwork") s.setTransform({ scale: 1, x: 0, y: 0, rotation: 0 });
    else s.setTextTransform({ scale: 1, x: 0, y: 0 });
  }

  function safeFit() {
    if (layer === "artwork") s.setTransform({ scale: .82, x: 0, y: 0, rotation: 0 });
    else s.setTextTransform({ scale: .9, x: 0, y: 0 });
  }

  return (
    <section className="flex flex-col gap-3">
      {!forcedLayer ? (
        <div className="flex items-center justify-between gap-2">
          <ToggleButtonGroup
            size="sm"
            selectionMode="single"
            isDetached
            disallowEmptySelection
            selectedKeys={new Set([layer])}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as Layer | undefined;
              if (next) setLayer(next);
            }}
            className="gap-0.5 rounded-full"
            aria-label="Placement layer"
          >
            <ToggleButton id="artwork" className="min-h-10 rounded-full px-3 text-[12px] font-medium">
              Artwork
            </ToggleButton>
            <ToggleButton id="text" className="min-h-10 rounded-full px-3 text-[12px] font-medium">
              Type
            </ToggleButton>
          </ToggleButtonGroup>
          <Chip size="sm" className="capitalize">{s.view}</Chip>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {layer === "artwork" ? "Artwork layer" : "Type layer"}
          </p>
          <Chip size="sm" className="capitalize">{s.view}</Chip>
        </div>
      )}

      {layer === "artwork" && !hasArtwork ? (
        <div className="rounded-xl bg-[#f7f7f5] px-3 py-3 ring-1 ring-border/60">
          <p className="m-0 text-[12px] font-semibold text-foreground">No artwork on this view yet</p>
          <p className="m-0 mt-1 text-[11px] leading-snug text-muted">
            Generate a design first, then drag on the canvas or use the sliders below.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <Slider
            key={row.key}
            className="w-full"
            value={row.value}
            minValue={row.min}
            maxValue={row.max}
            step={row.step}
            aria-label={`${layer} ${row.label}`}
            onChange={(value) => update(row.key, Array.isArray(value) ? value[0] : value)}
          >
            <div className="flex w-full items-center justify-between">
              <Label className="text-[12px] font-medium">{row.label}</Label>
              <span className="tabular-nums text-[12px] text-muted">{row.text}</span>
            </div>
            <Slider.Track className="mt-2">
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        ))}
      </div>

      <div className="flex gap-2">
        <Button fullWidth size="sm" variant="outline" className="min-h-11" onPress={reset}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
        <Button fullWidth size="sm" variant="outline" className="min-h-11" onPress={safeFit}>
          <Focus className="size-3.5" />
          Safe fit
        </Button>
      </div>

      {s.history.length > 0 && (
        <>
          <Separator className="my-0.5" />
          <div className="flex items-center gap-1.5">
            <History className="size-4 text-muted" />
            <span className="text-xs font-semibold">Versions</span>
            <Chip size="sm">{`${s.history.length}/8`}</Chip>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {s.history.map((version, index) => (
              <button
                type="button"
                key={version.id}
                onClick={() => s.restoreVersion(version)}
                className={cn(
                  "min-h-11 min-w-[72px] rounded-xl border border-border bg-background p-1.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                  version.assetUrl === s.artwork[version.view]
                    ? "border-foreground/45 ring-1 ring-foreground/15"
                    : "hover:border-foreground/25",
                )}
              >
                {/* Dynamic designer asset URLs (blob/CDN) — next/image not suitable */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={version.assetUrl}
                  alt={`Version ${s.history.length - index}`}
                  className="block h-[52px] w-full rounded-md bg-[rgba(15,23,42,0.06)] object-cover"
                />
                <span className="mt-1 block truncate text-[11px] font-semibold">
                  v{s.history.length - index}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
