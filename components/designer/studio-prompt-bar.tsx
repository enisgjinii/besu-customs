"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImagePlus, Plus, SendHorizontal, Sparkles, X } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useDesignerGeneration } from "@/hooks/use-designer-generation";
import { CONCEPT_COUNT_OPTIONS, type ConceptCount } from "@/lib/designer/generation-client";
import { getDesignerProduct } from "@/lib/designer/products";
import { getPrePrompts } from "@/lib/designer/pre-prompts";
import { useDesignerStore } from "@/lib/designer/store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PromptChipSlider } from "./prompt-chip-slider";
import { cn } from "@/lib/utils";

const surface =
  "relative border border-black/[0.08] bg-white";

const chip =
  "relative border border-black/[0.08] bg-white";

export function StudioPromptBar() {
  const s = useDesignerStore();
  const { busy, stage, submitPrompt, uploadLogo } = useDesignerGeneration();
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();
  const hasArtwork = Boolean(s.artwork.front || s.artwork.back);
  const canSend = !busy && draft.trim().length >= 8;
  const product = getDesignerProduct(s.productId);
  const suggestions = getPrePrompts(product, hasArtwork ? 4 : 6);

  function resize() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }

  async function send(value = draft) {
    const next = value.trim();
    if (!next || busy) return;
    setDraft("");
    if (areaRef.current) {
      areaRef.current.style.height = "auto";
    }
    setAttachOpen(false);
    await submitPrompt(next);
  }

  function setCount(count: ConceptCount) {
    s.patch({ conceptCount: count });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-2.5 pb-[max(10px,env(safe-area-inset-bottom,0px))] sm:px-3 md:px-6 md:pb-5">
      <div className="pointer-events-auto w-full max-w-[720px]">
        {!busy ? (
          <div className="mb-2 flex items-center gap-1.5">
            <div
              role="radiogroup"
              aria-label="Concept count"
              className={cn(chip, "flex shrink-0 gap-0.5 rounded-full p-0.5")}
            >
              {CONCEPT_COUNT_OPTIONS.map((count) => {
                const active = s.conceptCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${count} concept${count === 1 ? "" : "s"}`}
                    onClick={() => setCount(count)}
                    className={cn(
                      "min-h-7 min-w-7 rounded-full px-2 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
                      active ? "bg-[#181816] text-white" : "text-muted hover:text-foreground",
                    )}
                  >
                    {count}
                  </button>
                );
              })}
            </div>

            <PromptChipSlider enhancedFrom="sm" ariaLabel="Quick prompt suggestions">
              {suggestions.map((suggestion) => (
                <Tooltip key={suggestion.id} delayDuration={120}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="listitem"
                      onClick={() => void send(suggestion.prompt)}
                      aria-label={suggestion.prompt}
                      className={cn(
                        chip,
                        "shrink-0 snap-start rounded-full px-3 py-1.5 text-[11px] font-medium text-foreground/70 hover:border-black/[0.14] hover:text-foreground",
                      )}
                    >
                      {suggestion.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-[min(360px,70vw)] rounded-xl border border-white/10 bg-[#181816] px-3.5 py-2.5 text-[12px] font-medium leading-snug text-white"
                  >
                    {suggestion.prompt}
                  </TooltipContent>
                </Tooltip>
              ))}
            </PromptChipSlider>
          </div>
        ) : null}

        <AnimatePresence>
          {attachOpen ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
              className={cn(surface, "mb-2 flex items-center gap-1.5 rounded-2xl p-1.5")}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadLogo(file);
                  event.target.value = "";
                  setAttachOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-medium hover:bg-black/[0.03]"
              >
                <ImagePlus className="size-4" />
                {s.logoUrl ? "Replace logo" : "Add logo"}
              </button>
              {s.logoUrl ? (
                <button
                  type="button"
                  onClick={() => s.setLogo(undefined)}
                  className="min-h-10 rounded-xl px-3 text-[12px] font-medium text-muted hover:text-foreground"
                >
                  Remove
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Close attachments"
                onClick={() => setAttachOpen(false)}
                className="ml-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-black/[0.04]"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className={cn(surface, "flex items-end gap-1 rounded-[22px] p-1 sm:gap-1.5 sm:rounded-[26px] sm:p-1.5")}
        >
          <button
            type="button"
            aria-label="Add logo"
            onClick={() => setAttachOpen((open) => !open)}
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/55 hover:bg-black/[0.04] hover:text-foreground sm:size-10"
          >
            <Plus className="size-5" />
          </button>

          <label className="sr-only" htmlFor="studio-prompt">
            Uniform prompt
          </label>
          <textarea
            id="studio-prompt"
            data-studio-prompt
            ref={areaRef}
            rows={1}
            value={draft}
            disabled={busy}
            maxLength={800}
            placeholder={
              busy
                ? stage || "Generating…"
                : hasArtwork
                  ? "Edit artwork… or rename the team wordmark"
                  : "Describe a uniform… team, colors, theme"
            }
            onChange={(event) => {
              setDraft(event.target.value);
              resize();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            className="max-h-28 min-h-9 flex-1 resize-none border-0 bg-transparent p-0 py-2 text-[14px] leading-5 text-foreground outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-foreground/40 disabled:opacity-70 sm:min-h-10 sm:py-2.5"
          />

          <button
            type="submit"
            disabled={!canSend}
            aria-label={hasArtwork ? "Update design" : "Generate design"}
            className={cn(
              "mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors sm:size-10",
              canSend
                ? "border-[#181816] bg-[#181816] text-white"
                : "border-black/[0.08] bg-transparent text-foreground/30",
            )}
          >
            {busy ? <Spinner size="sm" color="current" /> : hasArtwork ? <Sparkles className="size-4" /> : <SendHorizontal className="size-4" />}
          </button>
        </form>

        <div className="mt-1.5 flex items-center justify-center gap-2 text-[9px] font-semibold tracking-wide text-foreground/35 sm:mt-2 sm:text-[10px] md:text-[11px]">
          <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />GPT Image 2 artwork</span>
          <span aria-hidden>·</span>
          <span>Team text in artwork</span>
        </div>
      </div>
    </div>
  );
}
