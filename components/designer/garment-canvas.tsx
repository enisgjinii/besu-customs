"use client";

import { absoluteBounds, resolveTemplate, type TemplatePiece } from "@/lib/designer/templates";
import {
  fitTextToBounds,
  sanitizeOverlayText,
  shouldRenderPlayerTypography,
  shouldRenderTeamName,
} from "@/lib/designer/typography";
import { getPreviewPlayer, useDesignerStore } from "@/lib/designer/store";
import type { ArtworkTransform, GarmentView } from "@/lib/designer/types";
import { cn } from "@/lib/utils";
import { Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";

function TeamText({ piece, view }: { piece: TemplatePiece; view: GarmentView }) {
  const s = useDesignerStore();
  if (piece !== "jersey") return null;

  const template = resolveTemplate({ sport: s.sport, piece: "jersey", view });
  const t = s.textTransforms[view];
  const preview = getPreviewPlayer(s);
  const team = sanitizeOverlayText(s.teamName || "YOUR TEAM", 60);
  const playerName = sanitizeOverlayText(preview?.name || "PLAYER", 18);
  const number = (preview?.number || "00").replace(/\D/g, "").slice(0, 3) || "00";

  const teamBounds = absoluteBounds(template, "teamName");
  const nameBounds = absoluteBounds(template, "playerName");
  const numberBounds = absoluteBounds(template, "number");
  const safe = absoluteBounds(template, "safePrint");

  return (
    <g clipPath={`url(#text-safe-${view})`} transform={`translate(${t.x} ${t.y})`}>
      {shouldRenderTeamName(view) && teamBounds ? (
        <text
          x={teamBounds.x + teamBounds.width / 2}
          y={teamBounds.y + teamBounds.height * 0.72}
          textAnchor="middle"
          fill={s.colors.accent}
          stroke={s.colors.primary}
          strokeWidth="3"
          paintOrder="stroke"
          fontFamily={s.font}
          fontWeight="900"
          fontSize={fitTextToBounds(team, teamBounds, { minSize: 18, maxSize: 58 }) * t.scale}
        >
          {team}
        </text>
      ) : null}

      {shouldRenderPlayerTypography(view) && nameBounds && numberBounds ? (
        <>
          <text
            x={nameBounds.x + nameBounds.width / 2}
            y={nameBounds.y + nameBounds.height * 0.75}
            textAnchor="middle"
            fill={s.colors.accent}
            stroke={s.colors.primary}
            strokeWidth="2"
            paintOrder="stroke"
            fontFamily={s.font}
            fontWeight="800"
            fontSize={
              fitTextToBounds(playerName, nameBounds, { minSize: 14, maxSize: 36, charWidthRatio: 0.58 }) *
              t.scale
            }
          >
            {playerName}
          </text>
          <text
            x={numberBounds.x + numberBounds.width / 2}
            y={numberBounds.y + numberBounds.height * 0.78}
            textAnchor="middle"
            fill={s.colors.accent}
            stroke={s.colors.primary}
            strokeWidth="5"
            paintOrder="stroke"
            fontFamily={s.font}
            fontWeight="900"
            fontSize={fitTextToBounds(number, numberBounds, { minSize: 48, maxSize: 160, charWidthRatio: 0.7 }) * t.scale}
          >
            {number}
          </text>
        </>
      ) : null}

      {safe ? (
        <rect
          x={safe.x}
          y={safe.y}
          width={safe.width}
          height={safe.height}
          rx="8"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeDasharray="10 9"
          opacity=".35"
        />
      ) : null}
    </g>
  );
}

function LogoOverlay({ piece, view }: { piece: TemplatePiece; view: GarmentView }) {
  const s = useDesignerStore();
  if (!s.logoUrl) return null;
  if (view === "back") return null;
  if (piece === "shorts") return null;

  const template = resolveTemplate({ sport: s.sport, piece, view: "front" });
  const logoBounds = absoluteBounds(template, "logo");
  if (!logoBounds) return null;
  const lt = s.logoTransform;
  const size = Math.min(logoBounds.width, logoBounds.height) * lt.scale;

  return (
    <image
      href={s.logoUrl}
      x={logoBounds.x + logoBounds.width / 2 - size / 2 + lt.x}
      y={logoBounds.y + logoBounds.height / 2 - size / 2 + lt.y}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      opacity=".95"
    />
  );
}

function GarmentPiece({ piece, view }: { piece: TemplatePiece; view: GarmentView }) {
  const s = useDesignerStore();
  const template = resolveTemplate({ sport: s.sport, piece, view });
  const t = s.transforms[view];
  // Always use one shared kit graphic so front/back never diverge visually.
  const art = s.artwork.front || s.artwork.back;
  const artBounds = absoluteBounds(template, "artwork");
  const clipId = `${piece}-clip-${view}`;
  const textClipId = `text-safe-${view}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={template.designMaskPath} />
        </clipPath>
        {piece === "jersey" ? (
          <clipPath id={textClipId}>
            {(() => {
              const safe = absoluteBounds(template, "safePrint");
              if (!safe) return <rect x="250" y="245" width="300" height="285" rx="8" />;
              return <rect x={safe.x} y={safe.y} width={safe.width} height={safe.height} rx="8" />;
            })()}
          </clipPath>
        ) : null}
        <linearGradient id={`${piece}-shine-${view}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
      </defs>

      <path
        d={template.silhouettePath}
        fill={s.colors.primary}
        stroke="#151515"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      <g clipPath={`url(#${clipId})`}>
        {piece === "jersey" ? (
          <path d="M85 120h150l65 560H85zM565 120h150v560H500z" fill={s.colors.secondary} opacity=".9" />
        ) : (
          <path d="M205 185h74l58 480H205zm316 0h74v480H463z" fill={s.colors.secondary} />
        )}
        {art && artBounds ? (
          <image
            href={art}
            x={artBounds.x}
            y={artBounds.y}
            width={artBounds.width}
            height={artBounds.height}
            preserveAspectRatio="xMidYMid slice"
            opacity=".94"
            transform={`translate(${t.x} ${t.y}) rotate(${t.rotation} 400 420) translate(${400 - 400 * t.scale} ${420 - 420 * t.scale}) scale(${t.scale})`}
          />
        ) : null}
        <path d={template.silhouettePath} fill={`url(#${piece}-shine-${view})`} />
      </g>

      {template.accentPaths?.map((path, index) => (
        <path key={index} d={path} fill="none" stroke={s.colors.accent} strokeWidth="10" />
      ))}

      <LogoOverlay piece={piece} view={view} />
      <TeamText piece={piece} view={view} />
    </g>
  );
}

function SidePreview({
  view,
  piece,
  label,
  previewScale,
  onDragTransform,
}: {
  view: GarmentView;
  piece: TemplatePiece;
  label: string;
  previewScale: number;
  onDragTransform: (next: Partial<ArtworkTransform>) => void;
}) {
  const s = useDesignerStore();
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    transform: ArtworkTransform;
    unitsPerPixel: number;
  } | null>(null);

  const template = resolveTemplate({ sport: s.sport, piece, view });
  const pad = 48;
  const viewBoxWidth = template.viewBox.width + pad * 2;
  const viewBoxHeight = template.viewBox.height + pad * 2;
  const viewBox = `${template.viewBox.minX - pad} ${template.viewBox.minY - pad} ${viewBoxWidth} ${viewBoxHeight}`;
  const hasArtwork = Boolean(s.artwork[view] || s.artwork.front || s.artwork.back);

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <p className="m-0 shrink-0 pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${label} ${piece} design preview`}
          className={cn(
            "h-full w-full touch-none select-none transition-transform duration-200 ease-out",
            dragging && "cursor-grabbing",
          )}
          data-artwork-draggable={hasArtwork ? "true" : "false"}
          onPointerDown={(event) => {
            if (!hasArtwork || event.button > 0) return;
            const rect = event.currentTarget.getBoundingClientRect();
            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              transform: s.transforms[view],
              unitsPerPixel: viewBoxWidth / Math.max(rect.width, 1) / previewScale,
            };
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            onDragTransform({
              x: clamp(drag.transform.x + (event.clientX - drag.startX) * drag.unitsPerPixel, -120, 120),
              y: clamp(drag.transform.y + (event.clientY - drag.startY) * drag.unitsPerPixel, -120, 120),
            });
          }}
          onPointerUp={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) {
              dragRef.current = null;
              setDragging(false);
            }
          }}
          onPointerCancel={(event) => {
            if (dragRef.current?.pointerId === event.pointerId) {
              dragRef.current = null;
              setDragging(false);
            }
          }}
          style={{
            cursor: hasArtwork ? (dragging ? "grabbing" : "grab") : "default",
            transform: `scale(${previewScale})`,
            transformOrigin: "center center",
            filter: "drop-shadow(0 16px 28px rgba(28, 25, 23, 0.10))",
          }}
        >
          <GarmentPiece piece={piece} view={view} />
        </svg>
      </div>
    </div>
  );
}

export function GarmentCanvas() {
  const s = useDesignerStore();
  const [previewScale, setPreviewScale] = useState(1);

  const piece: TemplatePiece =
    s.garmentType === "shorts"
      ? "shorts"
      : s.garmentType === "uniform"
        ? s.activePiece
        : "jersey";

  const hasArtwork = Boolean(s.artwork.front || s.artwork.back);
  const isRefineStep = s.activeStep === 2;

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function nudgeZoom(delta: number) {
    setPreviewScale((current) => clamp(Number((current + delta).toFixed(2)), 0.7, 1.5));
  }

  /** Keep front/back artwork placement synced so the shared kit stays aligned. */
  function syncTransform(next: Partial<ArtworkTransform>) {
    const front = { ...s.transforms.front, ...next };
    const back = { ...s.transforms.back, ...next };
    s.patch({
      transforms: { front, back },
      view: s.view,
    });
  }

  return (
    <section className="relative h-full w-full overflow-hidden">
      <div
        id="production-canvas"
        className="absolute inset-x-2 top-3 bottom-[4.5rem] flex min-h-0 gap-2 max-md:gap-1 sm:inset-x-6 sm:top-4 sm:bottom-20 sm:gap-4"
      >
        <SidePreview
          view="front"
          piece={piece}
          label="Front"
          previewScale={previewScale}
          onDragTransform={syncTransform}
        />
        <SidePreview
          view="back"
          piece={piece}
          label="Back"
          previewScale={previewScale}
          onDragTransform={syncTransform}
        />
      </div>

      {hasArtwork && isRefineStep ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-10 mx-auto max-w-[280px] text-center text-[11px] font-medium text-muted sm:bottom-24">
          Drag artwork to reposition · placement syncs on both sides
        </p>
      ) : null}

      {s.garmentType === "uniform" ? (
        <div
          className="absolute z-20"
          style={{
            bottom: "max(12px, env(safe-area-inset-bottom, 0px))",
            left: "max(10px, env(safe-area-inset-left, 0px))",
          }}
        >
          <ToggleButtonGroup
            size="sm"
            selectionMode="single"
            isDetached
            disallowEmptySelection
            selectedKeys={new Set([s.activePiece])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next === "jersey" || next === "shorts") s.setActivePiece(next);
            }}
            className="gap-0.5 rounded-full bg-white/95 p-1 shadow-sm ring-1 ring-border/60 backdrop-blur-sm"
            aria-label="Garment piece"
          >
            <ToggleButton id="jersey" className="min-h-10 rounded-full px-3 text-[12px] font-semibold">
              Jersey
            </ToggleButton>
            <ToggleButton id="shorts" className="min-h-10 rounded-full px-3 text-[12px] font-semibold">
              Shorts
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      ) : null}

      <div
        className="absolute z-20 flex flex-col gap-1.5"
        style={{
          bottom: "max(12px, env(safe-area-inset-bottom, 0px))",
          right: "max(10px, env(safe-area-inset-right, 0px))",
        }}
      >
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Zoom in preview"
          className="size-10 rounded-full bg-white/95 text-foreground shadow-sm ring-1 ring-border/50 backdrop-blur-sm"
          onPress={() => nudgeZoom(0.12)}
          isDisabled={previewScale >= 1.5}
        >
          <Plus className="size-4" strokeWidth={1.75} />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Zoom out preview"
          className="size-10 rounded-full bg-white/95 text-foreground shadow-sm ring-1 ring-border/50 backdrop-blur-sm"
          onPress={() => nudgeZoom(-0.12)}
          isDisabled={previewScale <= 0.7}
        >
          <Minus className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </section>
  );
}
