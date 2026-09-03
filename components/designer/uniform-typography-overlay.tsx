"use client";

import type { DesignerColors, GarmentType, GarmentView } from "@/lib/designer/types";
import {
  getTypographyBounds,
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
  logoUrl?: string;
}

function TypographyPlate({
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
  const { bounds } = placement;
  const isNumber = role === "number";

  return (
    <g data-typography-role={role} data-deterministic-typography="true">
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        rx={isNumber ? 20 : 16}
        fill={colors.primary}
        fillOpacity={isNumber ? 0.72 : 0.78}
      />
      <text
        x={placement.x}
        y={placement.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={fontFamily}
        fontSize={placement.fontSize}
        fontWeight={role === "number" ? 900 : 800}
        letterSpacing={role === "number" ? "0" : "0.02em"}
        fill={colors.accent}
        stroke={colors.primary}
        strokeWidth={role === "number" ? 8 : 5}
        paintOrder="stroke fill"
        strokeLinejoin="round"
      >
        {placement.text}
      </text>
    </g>
  );
}

function FrontLogo({ logoUrl, space }: { logoUrl: string; space: TypographySpace }) {
  const teamBounds = getTypographyBounds("teamName", space);
  const size = 62;
  return (
    <image
      href={logoUrl}
      x={teamBounds.x + teamBounds.width - size * 0.75}
      y={teamBounds.y - size - 12}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      data-approved-logo="true"
    />
  );
}

/**
 * Customer typography is intentionally composited after the AI render. This is the only layer
 * allowed to draw team/player wording, which keeps spelling deterministic across generation,
 * refinements, recolours, previews and exports.
 */
export function UniformTypographyOverlay({
  view,
  garmentType,
  teamName,
  playerName = "",
  playerNumber = "",
  fontFamily,
  colors,
  logoUrl,
}: UniformTypographyOverlayProps) {
  const hasJersey = garmentType !== "shorts";
  if (!hasJersey) return null;

  const board = view === "board";
  const showFront = board || view === "front";
  const showBack = board || view === "back";
  const frontSpace: TypographySpace = board ? "board" : "view";
  const backSpace: TypographySpace = board ? "board" : "view";

  return (
    <g pointerEvents="none" aria-hidden="true" data-uniform-typography-overlay="true">
      {showFront ? (
        <>
          <TypographyPlate role="teamName" value={teamName} space={frontSpace} fontFamily={fontFamily} colors={colors} />
          {logoUrl ? <FrontLogo logoUrl={logoUrl} space={frontSpace} /> : null}
        </>
      ) : null}
      {showBack ? (
        <>
          <TypographyPlate role="playerName" value={playerName} space={backSpace} fontFamily={fontFamily} colors={colors} />
          <TypographyPlate role="number" value={playerNumber} space={backSpace} fontFamily={fontFamily} colors={colors} />
        </>
      ) : null}
    </g>
  );
}
