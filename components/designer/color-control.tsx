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
        className="min-h-8 min-w-0 flex-1 justify-start rounded-full px-2"
        onPress={() => setDraft(value.toUpperCase())}
      >
        <span
          className="mr-1.5 size-3.5 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: value }}
        />
        <span className="truncate text-[11px] font-bold capitalize">{label}</span>
      </Button>
      <Popover.Content className="w-[200px] p-0">
        <Popover.Dialog className="p-2.5">
          <Popover.Heading className="mb-1.5 text-xs font-extrabold capitalize">{label}</Popover.Heading>
          <ColorSwatchPicker
            size="sm"
            variant="square"
            value={value}
            onChange={(color) => {
              apply(color.toString("hex"));
            }}
            className="mb-3"
          >
            {swatches.map((color) => (
              <ColorSwatchPicker.Item key={color} color={color}>
                <ColorSwatchPicker.Swatch />
                <ColorSwatchPicker.Indicator />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
          <div className="flex gap-1.5">
            <TextField
              fullWidth
              name="hex"
              value={draft}
              onChange={(v) => setDraft(v.toUpperCase())}
            >
              <Label>Hex</Label>
              <Input maxLength={7} />
            </TextField>
            <Button
              size="sm"
              className="mt-auto min-h-9 self-end px-3"
              onPress={() => apply(draft)}
            >
              Set
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
