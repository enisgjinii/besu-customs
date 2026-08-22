"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImagePlus, Plus, SendHorizontal, Sparkles, X } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useDesignerGeneration } from "@/hooks/use-designer-generation";
import { getDesignerProduct } from "@/lib/designer/products";
import { getPrePrompts } from "@/lib/designer/pre-prompts";
import { useDesignerStore } from "@/lib/designer/store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const liquidGlass =
  "relative overflow-hidden border-0 bg-white/35 shadow-[0_8px_32px_rgba(24,24,22,0.1),inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/25";

const liquidGlassChip =
  "relative overflow-hidden border-0 bg-white/35 shadow-[0_4px_16px_rgba(24,24,22,0.06),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/25";

function GlassSheen() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 h-1/2 w-1/2 rounded-full bg-white/40 blur-2xl"
      />
    </>
  );
}

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
  const suggestions = getPrePrompts(product, hasArtwork ? 3 : 4);

  function resize() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
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

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] md:px-6 md:pb-5">
      <div className="pointer-events-auto w-full max-w-[720px]">
        {!busy ? (
          <div className="mb-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((suggestion) => {
              return (
                <Tooltip key={suggestion.id} delayDuration={120}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => void send(suggestion.prompt)}
                      aria-label={suggestion.prompt}
                      className={cn(
                        liquidGlassChip,
                        "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-foreground/70 hover:text-foreground",
                      )}
                    >
                      <GlassSheen />
                      <span className="relative z-10">{suggestion.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-[min(360px,70vw)] rounded-xl border-0 bg-[#181816]/92 px-3.5 py-2.5 text-[12px] font-medium leading-snug text-white shadow-[0_12px_32px_rgba(24,24,22,0.22)] backdrop-blur-md"
                  >
                    {suggestion.prompt}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ) : null}

        <AnimatePresence>
          {attachOpen ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              className={cn(liquidGlass, "mb-2.5 flex items-center gap-2 rounded-[20px] p-2")}
            >
              <GlassSheen />
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
                className="relative z-10 flex min-h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-medium hover:bg-white/35"
              >
                <ImagePlus className="size-4" />
                {s.logoUrl ? "Replace logo" : "Add logo"}
              </button>
              {s.logoUrl ? (
                <button
                  type="button"
                  onClick={() => s.setLogo(undefined)}
                  className="relative z-10 min-h-10 rounded-xl px-3 text-[12px] font-medium text-muted hover:text-foreground"
                >
                  Remove
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Close attachments"
                onClick={() => setAttachOpen(false)}
                className="relative z-10 ml-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-white/40"
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
          className={cn(liquidGlass, "flex items-end gap-1.5 rounded-[26px] p-1.5")}
        >
          <GlassSheen />
          <button
            type="button"
            aria-label="Add logo"
            onClick={() => setAttachOpen((open) => !open)}
            className="relative z-10 mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-foreground/55 hover:bg-white/40 hover:text-foreground"
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
                  ? "Add a moon, change colors, or edit this design…"
                  : "Describe a basketball uniform… team, colors, theme"
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
            className="relative z-10 max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent p-0 py-2.5 text-[14px] leading-5 text-foreground shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-foreground/40 disabled:opacity-70"
          />

          <button
            type="submit"
            disabled={!canSend}
            aria-label={hasArtwork ? "Update design" : "Generate design"}
            className={cn(
              "relative z-10 mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              canSend
                ? "bg-[#181816]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md"
                : "bg-white/40 text-foreground/35",
            )}
          >
            {busy ? <Spinner size="sm" color="current" /> : hasArtwork ? <Sparkles className="size-4" /> : <SendHorizontal className="size-4" />}
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-foreground/40 md:text-[11px]">
          All designs are generated by AI and may need review before production.
        </p>
      </div>
    </div>
  );
}
