"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { Sparkles } from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignStyle } from "@/lib/designer/types";

const SPORTS = ["Basketball", "Soccer", "Volleyball", "Baseball", "Flag Football"] as const;
const STYLES = ["modern", "minimal", "geometric", "retro", "aggressive"] as const;

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
      generation_timeout: "Generation took too long. Try a simpler brief or try again.",
      upstream_error: "The image service could not complete this request. Try again in a moment.",
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

  return (
    <section className="flex w-full flex-col gap-2">
      {mockMode && (
        <Alert status="accent" className="py-1.5">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title className="text-xs">Preview mode — artwork is simulated.</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <Select
        fullWidth
        className="w-full"
        selectedKey={s.sport}
        onSelectionChange={(key) => key && s.patch({ sport: String(key) })}
      >
        <Label>Sport</Label>
        <Select.Trigger className="w-full">
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
        <Select.Trigger className="w-full">
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
          rows={2}
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

      {needsTeam && (
        <p className="text-[10px] text-muted">Set a team name in Text before generating.</p>
      )}

      {error && (
        <Alert status="danger" className="py-1.5">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title className="text-xs">{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}

      <div className="flex gap-1">
        <Chip
          size="sm"
          variant={s.artwork.front ? "primary" : "secondary"}
          color={s.artwork.front ? "success" : "default"}
        >
          {s.artwork.front ? "Front ✓" : "Front"}
        </Chip>
        <Chip
          size="sm"
          variant={s.artwork.back ? "primary" : "secondary"}
          color={s.artwork.back ? "success" : "default"}
        >
          {s.artwork.back ? "Back ✓" : "Back"}
        </Chip>
      </div>

      <Button
        fullWidth
        size="sm"
        isPending={busy}
        isDisabled={busy || s.prompt.trim().length < 8 || needsTeam}
        onPress={generate}
        className="min-h-8"
      >
        {({ isPending }) => (
          <>
            {isPending ? <Spinner size="sm" color="current" /> : <Sparkles className="size-3.5" />}
            {isPending
              ? "Creating…"
              : s.artwork[s.view]
                ? `Revise ${s.view}`
                : `Generate ${s.view}`}
          </>
        )}
      </Button>
    </section>
  );
}
