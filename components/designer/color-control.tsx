"use client";

import { useState } from "react";
import {
  Button,
  ColorSwatchPicker,
  Input,
  Label,
  Popover,
  TextField,
} from "@heroui/react";

const swatches = ["#000000", "#FFFFFF", "#D4AF37", "#C8102E", "#0033A0", "#006341", "#FF6A00", "#6A1B9A"];

export function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);

  function apply(next: string) {
    if (/^#[0-9a-f]{6}$/i.test(next)) {
      onChange(next.toUpperCase());
      setDraft(next.toUpperCase());
    }
  }

  return (
    <Popover>
      <Button
        variant="outline"
        size="sm"
        className="min-h-11 min-w-0 w-full justify-start rounded-xl border border-black/[0.08] bg-white px-2 text-foreground hover:bg-[#f7f7f5] sm:px-2.5"
        onPress={() => setDraft(value.toUpperCase())}
      >
        <span
          className="size-4 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: value }}
        />
        <span className="min-w-0 truncate text-[10px] font-medium capitalize min-[380px]:text-[11px] sm:text-[12px]">{label}</span>
      </Button>
      <Popover.Content className="w-[min(250px,calc(100vw-24px))] p-0">
        <Popover.Dialog className="p-3">
          <Popover.Heading className="mb-2 text-xs font-semibold capitalize">{label}</Popover.Heading>
          <ColorSwatchPicker
            size="sm"
            variant="square"
            value={value}
            aria-label={`${label} color presets`}
            onChange={(color) => apply(color.toString("hex"))}
            className="mb-3"
          >
            {swatches.map((color) => (
              <ColorSwatchPicker.Item key={color} color={color} aria-label={`${label} ${color}`}>
                <ColorSwatchPicker.Swatch />
                <ColorSwatchPicker.Indicator />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <TextField fullWidth className="min-w-0" name="hex" value={draft} onChange={(v) => setDraft(v.toUpperCase())}>
              <Label>Hex</Label>
              <Input maxLength={7} className="min-h-11" />
            </TextField>
            <Button size="sm" className="min-h-11 px-3.5" onPress={() => apply(draft)}>
              Set
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
