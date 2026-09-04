"use client";

import type { GarmentView } from "@/lib/designer/types";

interface ApprovedLogoOverlayProps {
  view: GarmentView | "board";
  logoUrl?: string;
}

/**
 * Approved customer logos remain deterministic app-composited assets.
 * Team wording is now integrated by GPT Image 2 into the front garment itself.
 */
export function ApprovedLogoOverlay({ view, logoUrl }: ApprovedLogoOverlayProps) {
  if (!logoUrl || view === "back") return null;
  return (
    <image
      href={logoUrl}
      x="520"
      y="210"
      width="60"
      height="60"
      preserveAspectRatio="xMidYMid meet"
      data-approved-logo="true"
      pointerEvents="none"
      aria-hidden="true"
    />
  );
}
