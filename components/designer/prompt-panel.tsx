"use client";

import { ColorControl } from "./color-control";
import { LOADING_STAGES } from "./designer-steps";
import { generateUniformKit, isGenerationInFlight } from "@/lib/designer/generation-client";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignStyle } from "@/lib/designer/types";
import { cn } from "@/lib/utils";
import {
  Alert,
  Button,
  Chip,
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
  const [stage, setStage] = useState<(typeof LOADING_STAGES)[number] | "">(LOADING_STAGES[0]);
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
      // Local fallback so design work continues when storage is unavailable.
      if (file.size <= 2 * 1024 * 1024) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read logo file."));
          reader.readAsDataURL(file);
        });
        s.setLogo(dataUrl);
        toast.message("Logo stored locally for preview. Configure Supabase to persist logos for checkout.");
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
    setStage(LOADING_STAGES[0]);
    const previousArtwork = { ...s.artwork };
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const result = await generateUniformKit({
        state: useDesignerStore.getState(),
        mode: "generate",
        views: ["front", "back"],
        onProgress: ({ stage: next }) => setStage(next),
        signal: abortRef.current.signal,
      });
      setMockMode(result.mock);
      for (const version of result.versions) s.addVersion(version);
      if (result.colors) s.patch({ colors: result.colors, colorsEnabled: true });
      s.setStep(2);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      // Keep previous design on failure.
      s.patch({ artwork: previousArtwork });
      const message = e instanceof Error ? e.message : "Artwork generation failed. Please try again.";
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
      {mockMode && (
        <Alert status="accent" className="py-2">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title className="text-xs">Preview mode — artwork is simulated (DESIGNER_MOCK_AI).</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <TextField
        fullWidth
        className="w-full"
        name="team"
        value={s.teamName}
        onChange={(value) => s.patch({ teamName: value.toUpperCase().slice(0, 60) })}
      >
        <Label>Team name</Label>
        <Input placeholder="GALACTIC" maxLength={60} className="min-h-11" autoComplete="organization" />
      </TextField>

      <TextField
        fullWidth
        className="w-full"
        name="design"
        value={s.prompt}
        onChange={(value) => s.patch({ prompt: value })}
      >
        <Label>Design description</Label>
        <TextArea
          placeholder="Basketball uniform jersey and shorts, outer space with moon and comets"
          rows={3}
          maxLength={800}
        />
      </TextField>

      <TextField
        fullWidth
        className="w-full"
        name="inspiration"
        value={s.inspiration}
        onChange={(value) => s.patch({ inspiration: value })}
      >
        <Label>Inspiration (optional)</Label>
        <Input placeholder="Neon nebula energy, clean geometric panels" maxLength={400} className="min-h-11" />
      </TextField>

      <Select
        fullWidth
        className="w-full"
        selectedKey={s.style}
        onSelectionChange={(key) => key && s.patch({ style: String(key) as DesignStyle })}
      >
        <Label>Style</Label>
        <Select.Trigger className="min-h-11 w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {STYLES.map((style) => (
              <ListBox.Item key={style} id={style} textValue={style} className="capitalize">
                {style}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="rounded-xl bg-[#f7f7f5] p-3 ring-1 ring-border/55">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[12px] font-semibold">Guide colors (optional)</p>
            <p className="m-0 mt-0.5 text-[11px] text-muted">
              Off by default — AI invents a palette from your brief.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={s.colorsEnabled}
            aria-label="Enable guide colors"
            onClick={() => s.patch({ colorsEnabled: !s.colorsEnabled })}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
              s.colorsEnabled ? "bg-foreground" : "bg-foreground/20",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
                s.colorsEnabled ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
        {s.colorsEnabled ? (
          <div className="mt-2.5 flex gap-1.5">
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
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Logo (optional)</p>
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
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.logoUrl} alt="Uploaded logo" className="size-11 rounded-lg object-contain bg-[#f7f7f5]" />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12px] font-semibold">Logo ready</p>
              <p className="m-0 text-[11px] text-muted">Placed on front only · replace anytime</p>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Remove logo"
              className="size-10"
              onPress={() => s.setLogo(undefined)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            fullWidth
            size="sm"
            variant="outline"
            className="min-h-11"
            isPending={logoBusy}
            onPress={() => fileRef.current?.click()}
          >
            {logoBusy ? <Spinner size="sm" /> : <Upload className="size-4" />}
            Upload logo
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip
          size="sm"
          variant={s.artwork.front || s.artwork.back ? "primary" : "secondary"}
          color={s.artwork.front || s.artwork.back ? "success" : "default"}
        >
          {s.artwork.front || s.artwork.back ? "Kit ready" : "Kit pending"}
        </Chip>
      </div>

      {needsTeam && <p className="m-0 text-[11px] text-muted">Enter a team name before generating.</p>}
      {!needsTeam && needsBrief && (
        <p className="m-0 text-[11px] text-muted">Add a short design description (8+ characters).</p>
      )}

      {error && (
        <Alert status="danger" className="py-2">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title className="text-xs">{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <Button
        fullWidth
        size="sm"
        isPending={busy}
        isDisabled={!canGenerate}
        onPress={generate}
        className={cn("min-h-11 font-semibold", "sticky bottom-0 z-10")}
      >
        {({ isPending }) => (
          <>
            {isPending ? <Spinner size="sm" color="current" /> : <Sparkles className="size-4" />}
            {isPending ? stage || "Creating artwork…" : "Generate My Uniform"}
          </>
        )}
      </Button>
    </section>
  );
}
