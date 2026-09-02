"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PromptChipSliderProps = {
  children: ReactNode;
  className?: string;
  /** Show nav arrows + progress rail from this breakpoint up. */
  enhancedFrom?: "sm" | "md";
  ariaLabel?: string;
};

export function PromptChipSlider({
  children,
  className,
  enhancedFrom = "sm",
  ariaLabel = "Prompt suggestions",
}: PromptChipSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [thumb, setThumb] = useState({ left: 0, width: 100 });
  const [overflows, setOverflows] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const hasOverflow = maxScroll > 4;
    setOverflows(hasOverflow);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < maxScroll - 4);

    if (!hasOverflow) {
      setThumb({ left: 0, width: 100 });
      return;
    }

    const width = Math.max(18, (el.clientWidth / el.scrollWidth) * 100);
    const left = (el.scrollLeft / maxScroll) * (100 - width);
    setThumb({ left, width });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  function scrollBy(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(160, el.clientWidth * 0.72);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  const enhanced = enhancedFrom === "md" ? "md" : "sm";

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <div
        className={cn(
          "relative",
          overflows && enhanced === "sm" && "sm:px-9",
          overflows && enhanced === "md" && "md:px-9",
        )}
      >
        {overflows ? (
          <>
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#efeee9] to-transparent",
                enhanced === "sm" ? "hidden sm:block" : "hidden md:block",
              )}
            />
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#efeee9] to-transparent",
                enhanced === "sm" ? "hidden sm:block" : "hidden md:block",
              )}
            />
          </>
        ) : null}

        <button
          type="button"
          aria-label="Previous prompts"
          disabled={!canPrev}
          onClick={() => scrollBy(-1)}
          className={cn(
            "absolute left-0 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.08] bg-white text-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
            enhanced === "sm" ? "hidden sm:flex" : "hidden md:flex",
            canPrev ? "opacity-100 hover:border-black/[0.14]" : "pointer-events-none opacity-0",
          )}
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          ref={trackRef}
          role="list"
          aria-label={ariaLabel}
          className={cn(
            "flex gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            enhanced === "sm" ? "snap-x snap-mandatory sm:snap-proximity" : "snap-x snap-mandatory md:snap-proximity",
          )}
        >
          {children}
        </div>

        <button
          type="button"
          aria-label="Next prompts"
          disabled={!canNext}
          onClick={() => scrollBy(1)}
          className={cn(
            "absolute right-0 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-black/[0.08] bg-white text-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
            enhanced === "sm" ? "hidden sm:flex" : "hidden md:flex",
            canNext ? "opacity-100 hover:border-black/[0.14]" : "pointer-events-none opacity-0",
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {overflows ? (
        <div
          className={cn(
            "relative mt-1.5 h-1 overflow-hidden rounded-full border border-black/[0.06] bg-black/[0.03]",
            enhanced === "sm" ? "hidden sm:block" : "hidden md:block",
          )}
          aria-hidden
        >
          <div
            className="absolute top-0 h-full rounded-full bg-[#181816]/75 transition-[left,width] duration-200 ease-out"
            style={{ left: `${thumb.left}%`, width: `${thumb.width}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
