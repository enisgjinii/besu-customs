"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ImagePlus, Plus, SendHorizontal, Sparkles, X } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useDesignerGeneration } from "@/hooks/use-designer-generation";
import { useDesignerStore } from "@/lib/designer/store";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Three Galactic uniforms, space theme, moon and comets, black purple white",
  "Fireballs basketball kit, orange and black flames, NBA look, number 24",
  "Make it sleeveless with a cleaner NBA cut",
];

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
        {!hasArtwork && !busy ? (
          <div className="mb-2 hidden gap-1.5 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
            {SUGGESTIONS.slice(0, 2).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="shrink-0 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-medium text-muted ring-1 ring-black/[0.06] backdrop-blur-md hover:text-foreground"
              >
                {suggestion.length > 52 ? `${suggestion.slice(0, 52)}…` : suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <AnimatePresence>
          {attachOpen ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              className="mb-2 flex items-center gap-2 rounded-2xl bg-white/90 p-2 ring-1 ring-black/[0.06] backdrop-blur-md"
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
                className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-medium hover:bg-black/[0.04]"
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
                className="ml-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-black/[0.05]"
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
          className="flex items-end gap-1.5 rounded-[22px] bg-white/92 p-1.5 shadow-[0_12px_40px_rgba(24,24,22,0.12)] ring-1 ring-black/[0.08] backdrop-blur-xl"
        >
          <button
            type="button"
            aria-label="Add logo"
            onClick={() => setAttachOpen((open) => !open)}
            className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-black/[0.05] hover:text-foreground"
          >
            <Plus className="size-5" />
          </button>

          <label className="sr-only" htmlFor="studio-prompt">
            Uniform prompt
          </label>
          <textarea
            id="studio-prompt"
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
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-5 text-foreground outline-none placeholder:text-muted disabled:opacity-70"
          />

          <button
            type="submit"
            disabled={!canSend}
            aria-label={hasArtwork ? "Update design" : "Generate design"}
            className={cn(
              "mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
              canSend ? "bg-[#181816] text-white" : "bg-black/[0.06] text-muted",
            )}
          >
            {busy ? <Spinner size="sm" color="current" /> : hasArtwork ? <Sparkles className="size-4" /> : <SendHorizontal className="size-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
