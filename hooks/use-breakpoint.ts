"use client";

import { useEffect, useMemo, useState } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

function readMatches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
  const isTablet = useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  );
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isLargeDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const isTouch = useMediaQuery("(hover: none), (pointer: coarse)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return useMemo(
    () => ({
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      isTouch,
      prefersReducedMotion,
    }),
    [isDesktop, isLargeDesktop, isMobile, isTablet, isTouch, prefersReducedMotion],
  );
}
