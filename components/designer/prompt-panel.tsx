"use client";

import { useState } from "react";
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
import { Sparkles } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignStyle, GarmentType } from "@/lib/designer/types";
import { ColorControl } from "./color-control";
import { cn } from "@/lib/utils";

const SPORTS = ["Basketball", "Soccer", "Volleyball", "Baseball", "Flag Football"] as const;
const STYLES = ["modern", "minimal", "geometric", "retro", "aggressive"] as const;
const GARMENTS: { id: GarmentType; label: string; sublabel: string }[] = [
  { id: "jersey", label: "Jersey", sublabel: "Top" },
  { id: "shorts", label: "Shorts", sublabel: "Bottom" },
  { id: "uniform", label: "Uniform", sublabel: "Kit" },
];

export function PromptPanel() {
  const s = useDesignerStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mockMode, setMockMode] = useState(false);

  function friendlyError(code?: string, fallback?: string) {
    const messages: Record<string, string> = {
      missing_openai_key:
        "AI generation is not configured yet. Add the production OpenAI key, or enable mock mode for local testing.",
      storage_not_configured:
        "Artwork storage is not configured yet. Add the Supabase URL, service key, and assets bucket.",
      invalid_previous_asset:
        "This artwork revision is no longer available. Generate the side again before requesting a correction.",
      rate_limited: "Generation is temporarily busy. Wait a moment and try again.",
      rate_limit: "Generation is temporarily busy. Wait a moment and try again.",
      insufficient_quota:
        "OpenAI billing or image credits are not active for this deployment.",
      generation_timeout: "Generation took too long. Try a simpler brief or try again.",
      timeout: "Generation took too long. Try a simpler brief or try again.",
      upstream_error: "The image service could not complete this request. Try again in a moment.",
      body_too_large: "That request is too large. Shorten the brief or correction and try again.",
      invalid_input: "Please check the design details and try again.",
    };
    return (code && messages[code]) || fallback || "Artwork generation failed. Please try again.";
  }

  async function generate() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/designer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentType: s.garmentType,
          designDescription: s.prompt,
          teamName: s.teamName,
          colors: s.colors,
          style: s.style,
          view: s.view,
          correction: s.correction || undefined,
          previousAssetUrl: s.artwork[s.view],
          requestId: crypto.randomUUID(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(friendlyError(data.code, data.error));
      setMockMode(Boolean(data.mock));
      s.addVersion({
        id: data.id,
        prompt: s.prompt,
        correction: s.correction || undefined,
        colors: s.colors,
        assetUrl: data.assetUrl,
        createdAt: data.createdAt,
        garmentType: s.garmentType,
        view: s.view,
      });
      s.setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Artwork generation failed. Please try again.");
    } finally {
      setBusy(false);
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
            <Alert.Title className="text-xs">Preview mode — artwork is simulated.</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Garment
        </p>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Garment type">
          {GARMENTS.map((garment) => {
            const active = s.garmentType === garment.id;
            return (
              <button
                key={garment.id}
                type="button"
                onClick={() => s.setGarment(garment.id)}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center rounded-xl px-1.5 py-1.5 text-center transition-colors ring-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25",
                  active
                    ? "bg-foreground text-white ring-foreground"
                    : "bg-white text-foreground ring-border/70 hover:ring-foreground/20",
                )}
              >
                <span className="text-[12px] font-semibold leading-none">{garment.label}</span>
                <span
                  className={cn(
                    "mt-0.5 text-[10px]",
                    active ? "text-white/75" : "text-muted",
                  )}
                >
                  {garment.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          fullWidth
          className="w-full"
          selectedKey={s.sport}
          onSelectionChange={(key) => key && s.patch({ sport: String(key) })}
        >
          <Label>Sport</Label>
          <Select.Trigger className="min-h-11 w-full">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SPORTS.map((sport) => (
                <ListBox.Item key={sport} id={sport} textValue={sport}>
                  {sport}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

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
      </div>

      <TextField
        fullWidth
        className="w-full"
        name="team"
        value={s.teamName}
        onChange={(value) => s.patch({ teamName: value.toUpperCase().slice(0, 60) })}
      >
        <Label>Team name</Label>
        <Input placeholder="BESU ELITE" maxLength={60} className="min-h-11" />
      </TextField>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Colors
        </p>
        <div className="flex gap-1.5">
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
      </div>

      <TextField
        fullWidth
        className="w-full"
        name="design"
        value={s.prompt}
        onChange={(value) => s.patch({ prompt: value })}
      >
        <Label>Brief</Label>
        <TextArea
          placeholder="Black uniform with angular gold side panels"
          rows={3}
          maxLength={800}
        />
      </TextField>

      {s.artwork[s.view] && (
        <TextField
          fullWidth
          className="w-full"
          name="correction"
          value={s.correction}
          onChange={(value) => s.patch({ correction: value })}
        >
          <Label>{`Correction · ${s.view}`}</Label>
          <TextArea
            placeholder="Keep the layout but make the side pattern smaller"
            rows={2}
            maxLength={400}
          />
        </TextField>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip
          size="sm"
          variant={s.artwork.front ? "primary" : "secondary"}
          color={s.artwork.front ? "success" : "default"}
        >
          {s.artwork.front ? "Front ready" : "Front needed"}
        </Chip>
        <Chip
          size="sm"
          variant={s.artwork.back ? "primary" : "secondary"}
          color={s.artwork.back ? "success" : "default"}
        >
          {s.artwork.back ? "Back ready" : "Back needed"}
        </Chip>
      </div>

      {needsTeam && (
        <p className="m-0 text-[11px] text-muted">Enter a team name before generating.</p>
      )}
      {!needsTeam && needsBrief && (
        <p className="m-0 text-[11px] text-muted">Add a short design brief (8+ characters).</p>
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
        className="min-h-11 font-semibold"
      >
        {({ isPending }) => (
          <>
            {isPending ? <Spinner size="sm" color="current" /> : <Sparkles className="size-4" />}
            {isPending
              ? "Creating artwork…"
              : s.artwork[s.view]
                ? `Revise ${s.view}`
                : `Generate ${s.view}`}
          </>
        )}
      </Button>
    </section>
  );
}
