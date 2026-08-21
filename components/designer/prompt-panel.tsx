"use client";

import { ColorControl } from "./color-control";
import { generateConceptSet, isGenerationInFlight } from "@/lib/designer/generation-client";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignStyle } from "@/lib/designer/types";
import { cn } from "@/lib/utils";
import {
  Alert,
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const STYLES = ["modern", "minimal", "geometric", "retro", "aggressive"] as const;

export function PromptPanel() {
  const s = useDesignerStore();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function uploadLogo(file: File) {
    setError("");
    setLogoBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/designer/logo", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Logo upload failed.");
      s.setLogo(data.assetUrl);
    } catch (e) {
      if (file.size <= 2 * 1024 * 1024) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read logo file."));
          reader.readAsDataURL(file);
        });
        s.setLogo(dataUrl);
        toast.message("Logo saved.");
      } else {
        const message = e instanceof Error ? e.message : "Logo upload failed.";
        setError(message);
        toast.error(message);
      }
    } finally {
      setLogoBusy(false);
    }
  }

  async function generate() {
    if (busy || isGenerationInFlight()) return;
    setError("");
    setBusy(true);
    setStage("Generating…");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const result = await generateConceptSet({
        state: useDesignerStore.getState(),
        signal: abortRef.current.signal,
        onProgress: ({ conceptIndex, conceptCount }) => {
          if (conceptIndex && conceptCount) setStage(`${conceptIndex}/${conceptCount}`);
        },
      });
      setMockMode(result.mock);
      s.setConcepts(result.concepts);
      s.setStep(2);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      const message = e instanceof Error ? e.message : "Generation failed.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  const canGenerate = !busy && Boolean(s.teamName.trim()) && s.prompt.trim().length >= 8;

  return (
    <section className="flex w-full min-w-0 flex-col gap-3">
      {mockMode ? (
        <Alert status="accent" className="py-2">
          <Alert.Content><Alert.Title className="text-xs">Preview mode</Alert.Title></Alert.Content>
        </Alert>
      ) : null}

      <TextField fullWidth name="team" value={s.teamName} onChange={(value) => s.patch({ teamName: value.toUpperCase().slice(0, 60) })}>
        <Label>Team</Label>
        <Input placeholder="GALACTIC" maxLength={60} className="min-h-11" autoComplete="organization" />
      </TextField>

      <TextField fullWidth name="design" value={s.prompt} onChange={(value) => s.patch({ prompt: value })}>
        <Label>Design</Label>
        <TextArea
          placeholder="Sleeveless basketball uniform, space theme, moon, comets, premium pro look"
          rows={4}
          maxLength={800}
          className="min-h-[116px]"
        />
      </TextField>

      <button
        type="button"
        onClick={() => setShowOptions((open) => !open)}
        className="self-start text-[12px] font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        {showOptions ? "Hide options" : "Options"}
      </button>

      {showOptions ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-3">
          <TextField fullWidth name="inspiration" value={s.inspiration} onChange={(value) => s.patch({ inspiration: value })}>
            <Label>Inspiration</Label>
            <Input placeholder="Optional" maxLength={400} className="min-h-11" />
          </TextField>

          <Select fullWidth selectedKey={s.style} onSelectionChange={(key) => key && s.patch({ style: String(key) as DesignStyle })}>
            <Label>Style</Label>
            <Select.Trigger className="min-h-11 w-full"><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover>
              <ListBox>
                {STYLES.map((style) => (
                  <ListBox.Item key={style} id={style} textValue={style} className="capitalize">
                    {style}<ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium">Colors</span>
              <button
                type="button"
                role="switch"
                aria-checked={s.colorsEnabled}
                aria-label="Use guide colors"
                onClick={() => s.patch({ colorsEnabled: !s.colorsEnabled })}
                className={cn(
                  "relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                  s.colorsEnabled ? "bg-foreground" : "bg-foreground/20",
                )}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", s.colorsEnabled ? "translate-x-[18px]" : "translate-x-0.5")} />
              </button>
            </div>
            {s.colorsEnabled ? (
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <ColorControl label="primary" value={s.colors.primary} onChange={(value) => s.patch({ colors: { ...s.colors, primary: value } })} />
                <ColorControl label="secondary" value={s.colors.secondary} onChange={(value) => s.patch({ colors: { ...s.colors, secondary: value } })} />
                <ColorControl label="accent" value={s.colors.accent} onChange={(value) => s.patch({ colors: { ...s.colors, accent: value } })} />
              </div>
            ) : null}
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadLogo(file);
                event.target.value = "";
              }}
            />
            {s.logoUrl ? (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.logoUrl} alt="Logo" className="size-10 rounded-lg bg-[#f7f7f5] object-contain" />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">Logo added</span>
                <Button size="sm" variant="ghost" className="min-h-9 px-2" onPress={() => s.setLogo(undefined)}>Remove</Button>
              </div>
            ) : (
              <Button fullWidth size="sm" variant="outline" className="min-h-10" isPending={logoBusy} onPress={() => fileRef.current?.click()}>
                {logoBusy ? <Spinner size="sm" /> : null}
                Logo
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <Alert status="danger" className="py-2">
          <Alert.Content><Alert.Title className="text-xs">{error}</Alert.Title></Alert.Content>
        </Alert>
      ) : null}

      <Button fullWidth size="sm" isPending={busy} isDisabled={!canGenerate} onPress={generate} className="min-h-12 font-semibold">
        {({ isPending }) => (
          <>
            {isPending ? <Spinner size="sm" color="current" /> : null}
            <span>{isPending ? stage || "Generating…" : "Generate 4 concepts"}</span>
          </>
        )}
      </Button>
    </section>
  );
}
