"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Label,
  ListBox,
  Select,
  Separator,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { Focus, History, RotateCcw } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

type Layer = "artwork" | "text";

const FONTS = [
  { id: "Inter, sans-serif", label: "Athletic sans" },
  { id: "Impact, sans-serif", label: "Impact" },
  { id: "Georgia, serif", label: "Classic serif" },
  { id: "monospace", label: "Block mono" },
];

export function ArtworkControls({ forcedLayer }: { forcedLayer?: Layer }) {
  const s = useDesignerStore();
  const [layerState, setLayer] = useState<Layer>("artwork");
  const layer = forcedLayer ?? layerState;
  const artwork = s.transforms[s.view];
  const text = s.textTransforms[s.view];
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
    <section className="flex flex-col gap-2">
      {!forcedLayer ? (
        <div className="flex items-center justify-between gap-1.5">
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
          >
            <ToggleButton id="artwork" className="rounded-full text-[11px] font-bold">Artwork</ToggleButton>
            <ToggleButton id="text" className="rounded-full text-[11px] font-bold">Type</ToggleButton>
          </ToggleButtonGroup>
          <Chip size="sm" className="capitalize">{s.view}</Chip>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
            {layer === "artwork" ? "Artwork layer" : "Type layer"}
          </p>
          <Chip size="sm" className="capitalize">{s.view}</Chip>
        </div>
      )}

      {layer === "text" && (
        <Select
          fullWidth
          selectedKey={s.font}
          onSelectionChange={(key) => key && s.patch({ font: String(key) })}
        >
          <Label>Font</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {FONTS.map((font) => (
                <ListBox.Item key={font.id} id={font.id} textValue={font.label}>
                  {font.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}

      <div className="flex flex-col gap-1.5">
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
              <Label className="text-[11px] font-bold">{row.label}</Label>
              <span className="text-[11px] text-muted">{row.text}</span>
            </div>
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        ))}
      </div>

      <div className="flex gap-1">
        <Button fullWidth size="sm" variant="outline" className="min-h-8" onPress={reset}>
          <RotateCcw className="size-3" />
          Reset
        </Button>
        <Button fullWidth size="sm" variant="outline" className="min-h-8" onPress={safeFit}>
          <Focus className="size-3" />
          Safe fit
        </Button>
      </div>

      {s.history.length > 0 && (
        <>
          <Separator className="my-0.5" />
          <div className="flex items-center gap-1.5">
            <History className="size-4" />
            <span className="text-xs font-bold">Versions</span>
            <Chip size="sm">{`${s.history.length}/8`}</Chip>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {s.history.map((version, index) => (
              <button
                type="button"
                key={version.id}
                onClick={() => s.restoreVersion(version)}
                className={cn(
                  "min-w-16 rounded-lg border border-border bg-background p-1 text-left transition-colors",
                  version.id === s.designId
                    ? "border-foreground/40"
                    : "hover:border-foreground/20",
                )}
              >
                {/* Dynamic designer asset URLs (blob/CDN) — next/image not suitable */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={version.assetUrl}
                  alt={`Version ${s.history.length - index}`}
                  className="block h-[46px] w-[54px] rounded bg-[rgba(15,23,42,0.06)] object-cover"
                />
                <span className="block truncate text-xs font-bold">v{s.history.length - index}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
