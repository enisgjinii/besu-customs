"use client";

import type { DesignerColors, GarmentType, GarmentView } from "@/lib/designer/types";
import {
  getTypographyPlacement,
  type TypographyRole,
  type TypographySpace,
} from "@/lib/designer/typography";

interface UniformTypographyOverlayProps {
  view: GarmentView | "board";
  garmentType: GarmentType;
  teamName: string;
  playerName?: string;
  playerNumber?: string;
  fontFamily: string;
  colors: DesignerColors;
  coordinateSpace?: TypographySpace;
}

function TypographyText({
  role,
  value,
  space,
  fontFamily,
  colors,
}: {
  role: TypographyRole;
  value: string;
  space: TypographySpace;
  fontFamily: string;
  colors: DesignerColors;
}) {
  const placement = getTypographyPlacement(role, value, space);
  if (!placement.text) return null;

  const isNumber = role === "number";
  return (
    <text
      x={placement.x}
      y={placement.y}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily={fontFamily}
      fontSize={placement.fontSize}
      fontWeight={isNumber ? 900 : 800}
      letterSpacing={isNumber ? "0" : "0.02em"}
      fill={colors.accent}
      stroke={colors.primary}
      strokeWidth={isNumber ? 7 : 4.5}
      paintOrder="stroke fill"
      strokeLinejoin="round"
      data-typography-role={role}
      data-deterministic-typography="true"
      data-exact-customer-text="true"
    >
      {placement.text}
    </text>
  );
}

/**
 * Exact customer wording is rendered by the application after GPT Image 2 creates the garment art.
 * This keeps team/player spelling deterministic through generate, refine, recolor, preview and export.
 */
export function UniformTypographyOverlay({
  view,
  garmentType,
  teamName,
  playerName = "",
  playerNumber = "",
  fontFamily,
  colors,
  coordinateSpace = "view",
}: UniformTypographyOverlayProps) {
  if (garmentType === "shorts") return null;

  const showFront = view === "board" || view === "front";
  const showBack = view === "board" || view === "back";

  return (
    <g pointerEvents="none" aria-hidden="true" data-uniform-typography-overlay="true">
      {showFront ? (
        <TypographyText
          role="teamName"
          value={teamName}
          space={coordinateSpace}
          fontFamily={fontFamily}
          colors={colors}
        />
      ) : null}
      {showBack ? (
        <>
          <TypographyText
            role="playerName"
            value={playerName}
            space={coordinateSpace}
            fontFamily={fontFamily}
            colors={colors}
          />
          <TypographyText
            role="number"
            value={playerNumber}
            space={coordinateSpace}
            fontFamily={fontFamily}
            colors={colors}
          />
        </>
      ) : null}
    </g>
  );
}
