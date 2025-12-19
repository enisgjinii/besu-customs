"use client";

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < breakpoint);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

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
