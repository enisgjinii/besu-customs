"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ColorControl } from "./color-control";
import { useDesignerGeneration } from "@/hooks/use-designer-generation";
import { isGenerationInFlight, CONCEPT_COUNT_OPTIONS } from "@/lib/designer/generation-client";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignStyle } from "@/lib/designer/types";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { useRef, useState } from "react";
import { getDesignerProduct } from "@/lib/designer/products";
import { getPrePrompts } from "@/lib/designer/pre-prompts";

const STYLES = ["modern", "minimal", "geometric", "retro", "aggressive"] as const;
const ease = [0.22, 1, 0.36, 1] as const;

export function PromptPanel() {
  const s = useDesignerStore();
  const { busy, stage, error, mockMode, generateConcepts, uploadLogo } = useDesignerGeneration();
  const [logoBusy, setLogoBusy] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();
  const canGenerate = !busy && !isGenerationInFlight() && Boolean(s.teamName.trim()) && s.prompt.trim().length >= 8;
  const product = getDesignerProduct(s.productId);
  const suggestions = getPrePrompts(product, 6);

  function applySuggestion(prompt: string) {
    const teamMatch = prompt.match(/(?:team|called)\s+([A-Za-z][A-Za-z0-9\s.'-]{1,30})/i);
    const team = teamMatch?.[1]?.trim().replace(/\s+(uniform|kit|jersey|shorts).*$/i, "");
    s.patch({
      prompt,
      ...(team ? { teamName: team.slice(0, 60) } : {}),
    });
  }

  return (
    <section className="flex w-full min-w-0 flex-col gap-3">
      {mockMode ? <p className="m-0 text-[10px] font-medium text-muted">Preview mode</p> : null}

      <TextField fullWidth name="team" value={s.teamName} onChange={(value) => s.patch({ teamName: value.slice(0, 60) })}>
        <Label>Team</Label>
        <Input placeholder="GALACTIC" maxLength={60} className="min-h-11" autoComplete="organization" />
      </TextField>
      <div className="-mt-1 flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white/70 px-3 py-2.5">
        <div className="min-w-0">
          <p className="m-0 text-[10.5px] font-semibold">AI-integrated wordmark</p>
          <p className="m-0 mt-0.5 text-[9.5px] leading-snug text-muted">GPT Image 2 places the team name directly on the front chest — no floating text layer.</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-700">IN ARTWORK</span>
      </div>

      <TextField fullWidth name="design" value={s.prompt} onChange={(value) => s.patch({ prompt: value })}>
        <Label>Design</Label>
        <TextArea
          placeholder="Space theme, moon, comets, premium pro look"
          rows={4}
          maxLength={800}
          className="min-h-[112px]"
        />
      </TextField>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Quick prompts</span>
        <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              title={suggestion.prompt}
              onClick={() => applySuggestion(suggestion.prompt)}
              className="min-h-8 rounded-full bg-black/[0.035] px-3 text-[10px] font-medium text-foreground hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowOptions((open) => !open)}
        aria-expanded={showOptions}
        className="self-start rounded-md py-1 text-[11px] font-medium text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 hover:text-foreground"
      >
        {showOptions ? "Less" : "More"}
      </button>

      <AnimatePresence initial={false}>
        {showOptions ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, height: 0, y: -3 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0, y: -3 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-xl bg-black/[0.025] p-3">
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
                  <span className="text-[11px] font-medium">Colors</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={s.colorsEnabled}
                    aria-label="Use guide colors"
                    onClick={() => s.patch({ colorsEnabled: !s.colorsEnabled })}
                    className={cn(
                      "relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                      s.colorsEnabled ? "bg-[#181816]" : "bg-black/15",
                    )}
                  >
                    <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-transform", s.colorsEnabled ? "translate-x-[18px]" : "translate-x-0.5")} />
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
                    if (!file) return;
                    setLogoBusy(true);
                    void uploadLogo(file).finally(() => setLogoBusy(false));
                    event.target.value = "";
                  }}
                />
                {s.logoUrl ? (
                  <div className="flex items-center gap-2 rounded-lg bg-white/70 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logoUrl} alt="Logo" className="size-9 rounded-md object-contain" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">Logo</span>
                    <Button size="sm" variant="ghost" className="min-h-8 px-2 text-[11px]" onPress={() => s.setLogo(undefined)}>Remove</Button>
                  </div>
                ) : (
                  <Button fullWidth size="sm" variant="outline" className="min-h-10 rounded-lg" isPending={logoBusy} onPress={() => fileRef.current?.click()}>
                    {logoBusy ? <Spinner size="sm" /> : null}
                    Logo
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error ? <p role="alert" className="m-0 text-[11px] font-medium text-danger">{error}</p> : null}

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Concepts</span>
        <div
          role="radiogroup"
          aria-label="How many concepts to generate"
          className="grid grid-cols-4 gap-1.5 rounded-xl bg-black/[0.035] p-1"
        >
          {CONCEPT_COUNT_OPTIONS.map((count) => {
            const active = s.conceptCount === count;
            return (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => s.patch({ conceptCount: count })}
                className={cn(
                  "min-h-9 rounded-lg text-[12px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                  active ? "bg-[#181816] text-white" : "text-muted hover:text-foreground",
                  busy && "opacity-50",
                )}
              >
                {count}
              </button>
            );
          })}
        </div>
        <p className="m-0 text-[10px] text-muted">
          {s.conceptCount === 1
            ? "Faster — one design, then refine."
            : `${s.conceptCount} directions to compare and pick from.`}
        </p>
      </div>

      <Button
        fullWidth
        size="sm"
        isPending={busy}
        isDisabled={!canGenerate}
        onPress={() => void generateConcepts(s.prompt, s.conceptCount)}
        className="min-h-12 rounded-xl font-semibold"
      >
        {({ isPending }) => (
          <>
            {isPending ? <Spinner size="sm" color="current" /> : null}
            <span>
              {isPending
                ? stage || "Generating…"
                : s.conceptCount === 1
                  ? "Generate with GPT Image 2"
                  : `Generate ${s.conceptCount} with GPT Image 2`}
            </span>
          </>
        )}
      </Button>
    </section>
  );
}
