"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-breakpoint";

export function useIsMobile(breakpoint: number = 768) {
  const isMobile = useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkMobile = () => setScreenWidth(window.innerWidth);

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile, screenWidth };
}

// Get optimal grid columns based on screen width
export function getColorGridCols(screenWidth: number): number {
  if (screenWidth < 360) return 6;
  if (screenWidth < 400) return 7;
  if (screenWidth < 480) return 8;
  return 8;
}

// Get optimal color button size based on screen width
export function getColorButtonSize(screenWidth: number): number {
  if (screenWidth < 360) return 32;
  if (screenWidth < 400) return 36;
  if (screenWidth < 480) return 40;
  return 44;
}
