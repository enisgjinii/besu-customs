"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ColorControl } from "./color-control";
import { generateConceptSet, isGenerationInFlight } from "@/lib/designer/generation-client";
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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const STYLES = ["modern", "minimal", "geometric", "retro", "aggressive"] as const;
const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ease = [0.22, 1, 0.36, 1] as const;

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
  const reduceMotion = useReducedMotion();

  useEffect(() => () => abortRef.current?.abort(), []);

  async function readLogoLocally(file: File) {
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read logo file."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadLogo(file: File) {
    setError("");

    if (!LOGO_TYPES.has(file.type)) {
      const message = "Use PNG, JPG or WebP.";
      setError(message);
      toast.error(message);
      return;
    }

    setLogoBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/designer/logo", { method: "POST", body: form });
      const data = (await response.json().catch(() => ({}))) as { assetUrl?: string; error?: string };
      if (!response.ok || !data.assetUrl) throw new Error(data.error || "Logo upload failed.");
      s.setLogo(data.assetUrl);
    } catch (uploadError) {
      if (file.size <= 2 * 1024 * 1024) {
        try {
          s.setLogo(await readLogoLocally(file));
          toast.message("Logo saved.");
        } catch (readError) {
          const message = readError instanceof Error ? readError.message : "Logo upload failed.";
          setError(message);
          toast.error(message);
        }
      } else {
        const message = uploadError instanceof Error ? uploadError.message : "Logo upload failed.";
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
    } catch (generationError) {
      if (generationError instanceof Error && generationError.name === "AbortError") return;
      const message = generationError instanceof Error ? generationError.message : "Generation failed.";
      setError(message);
      toast.error(message);
    } finally {
      abortRef.current = null;
      setBusy(false);
      setStage("");
    }
  }

  const canGenerate = !busy && Boolean(s.teamName.trim()) && s.prompt.trim().length >= 8;

  return (
    <section className="flex w-full min-w-0 flex-col gap-3">
      {mockMode ? <p className="m-0 text-[10px] font-medium text-muted">Preview mode</p> : null}

      <TextField fullWidth name="team" value={s.teamName} onChange={(value) => s.patch({ teamName: value.toUpperCase().slice(0, 60) })}>
        <Label>Team</Label>
        <Input placeholder="GALACTIC" maxLength={60} className="min-h-11" autoComplete="organization" />
      </TextField>

      <TextField fullWidth name="design" value={s.prompt} onChange={(value) => s.patch({ prompt: value })}>
        <Label>Design</Label>
        <TextArea
          placeholder="Space theme, moon, comets, premium pro look"
          rows={4}
          maxLength={800}
          className="min-h-[112px]"
        />
      </TextField>

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
                    if (file) void uploadLogo(file);
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

      <Button fullWidth size="sm" isPending={busy} isDisabled={!canGenerate} onPress={generate} className="min-h-12 rounded-xl font-semibold">
        {({ isPending }) => (
          <>
            {isPending ? <Spinner size="sm" color="current" /> : null}
            <span>{isPending ? stage || "Generating…" : "Generate"}</span>
          </>
        )}
      </Button>
    </section>
  );
}
