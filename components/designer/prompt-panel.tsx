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
import { Sparkles, Upload, X } from "lucide-react";
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
        toast.message("Logo saved for this design session.");
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
    setStage("Preparing four direct AI renders…");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const result = await generateConceptSet({
        state: useDesignerStore.getState(),
        signal: abortRef.current.signal,
        onProgress: ({ conceptIndex, conceptCount, conceptLabel }) => {
          if (conceptIndex && conceptCount) {
            setStage(`Rendering ${conceptIndex}/${conceptCount} · ${conceptLabel || "AI concept"}`);
          }
        },
      });
      setMockMode(result.mock);
      s.setConcepts(result.concepts);
      s.setStep(2);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      const message = e instanceof Error ? e.message : "Direct AI generation failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  const needsTeam = !s.teamName.trim();
  const needsBrief = s.prompt.trim().length < 8;
  const canGenerate = !busy && !needsTeam && !needsBrief;

  return (
    <section className="flex w-full flex-col gap-3">
      {mockMode ? (
        <Alert status="accent" className="py-2">
          <Alert.Indicator />
          <Alert.Content><Alert.Title className="text-xs">Preview mode — direct AI renders are simulated (DESIGNER_MOCK_AI).</Alert.Title></Alert.Content>
        </Alert>
      ) : null}

      <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" />
          <p className="m-0 text-[12px] font-semibold">Direct AI uniform generation</p>
        </div>
        <p className="m-0 mt-1 text-[11px] leading-snug text-muted">
          AI renders four finished uniform concepts directly — jersey + shorts, front + back. No flat 2D texture or template step.
        </p>
      </div>

      <TextField fullWidth className="w-full" name="team" value={s.teamName} onChange={(value) => s.patch({ teamName: value.toUpperCase().slice(0, 60) })}>
        <Label>Team name</Label>
        <Input placeholder="GALACTIC" maxLength={60} className="min-h-11" autoComplete="organization" />
      </TextField>

      <TextField fullWidth className="w-full" name="design" value={s.prompt} onChange={(value) => s.patch({ prompt: value })}>
        <Label>Tell AI what the uniform should look like</Label>
        <TextArea placeholder="Sleeveless basketball uniform with jersey and shorts, outer space theme, moon, comets, aggressive premium NBA-style graphics" rows={4} maxLength={800} />
      </TextField>

      <TextField fullWidth className="w-full" name="inspiration" value={s.inspiration} onChange={(value) => s.patch({ inspiration: value })}>
        <Label>Visual inspiration (optional)</Label>
        <Input placeholder="Neon nebula energy, sharp side panels, premium pro-team look" maxLength={400} className="min-h-11" />
      </TextField>

      <Select fullWidth className="w-full" selectedKey={s.style} onSelectionChange={(key) => key && s.patch({ style: String(key) as DesignStyle })}>
        <Label>Style bias</Label>
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

      <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[12px] font-semibold">Guide colors (optional)</p>
            <p className="m-0 mt-0.5 text-[11px] text-muted">Leave off to let AI explore different palettes.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={s.colorsEnabled}
            aria-label="Enable guide colors"
            onClick={() => s.patch({ colorsEnabled: !s.colorsEnabled })}
            className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25", s.colorsEnabled ? "bg-foreground" : "bg-foreground/20")}
          >
            <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform", s.colorsEnabled ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
        {s.colorsEnabled ? (
          <div className="mt-2.5 flex gap-1.5">
            <ColorControl label="primary" value={s.colors.primary} onChange={(value) => s.patch({ colors: { ...s.colors, primary: value } })} />
            <ColorControl label="secondary" value={s.colors.secondary} onChange={(value) => s.patch({ colors: { ...s.colors, secondary: value } })} />
            <ColorControl label="accent" value={s.colors.accent} onChange={(value) => s.patch({ colors: { ...s.colors, accent: value } })} />
          </div>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Logo reference (optional)</p>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); event.target.value = ""; }} />
        {s.logoUrl ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.logoUrl} alt="Uploaded logo reference" className="size-11 rounded-lg bg-[#f7f7f5] object-contain" />
            <div className="min-w-0 flex-1"><p className="m-0 text-[12px] font-semibold">Logo reference saved</p><p className="m-0 text-[11px] text-muted">AI reserves a crest position; the real file stays attached to the order.</p></div>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Remove logo" className="size-10" onPress={() => s.setLogo(undefined)}><X className="size-4" /></Button>
          </div>
        ) : (
          <Button fullWidth size="sm" variant="outline" className="min-h-11" isPending={logoBusy} onPress={() => fileRef.current?.click()}>
            {logoBusy ? <Spinner size="sm" /> : <Upload className="size-4" />} Upload logo reference
          </Button>
        )}
      </div>

      {needsTeam ? <p className="m-0 text-[11px] text-muted">Enter a team name before generating.</p> : null}
      {!needsTeam && needsBrief ? <p className="m-0 text-[11px] text-muted">Describe the uniform in at least 8 characters.</p> : null}

      {error ? (
        <Alert status="danger" className="py-2"><Alert.Indicator /><Alert.Content><Alert.Title className="text-xs">{error}</Alert.Title></Alert.Content></Alert>
      ) : null}

      <Button fullWidth size="sm" isPending={busy} isDisabled={!canGenerate} onPress={generate} className={cn("min-h-11 font-semibold", "sticky bottom-0 z-10")}>
        {({ isPending }) => <>{isPending ? <Spinner size="sm" color="current" /> : <Sparkles className="size-4" />}{isPending ? stage || "Rendering uniforms…" : "Generate 4 Direct AI Uniforms"}</>}
      </Button>
    </section>
  );
}
