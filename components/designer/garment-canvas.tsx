"use client";

import { useDesignerStore } from "@/lib/designer/store";

const sleevelessJersey = "M245 155 315 80Q335 135 400 150Q465 135 485 80l70 75-30 135 30 360H245l30-360z";
const sleevedJersey = "M190 155 315 80Q335 135 400 150Q465 135 485 80l125 75 105 105-95 95-50-58 5 353H225l5-353-50 58-95-95z";
const shortsPath = "M205 185h390l-24 470-145 12-26-242-26 242-145-12z";

function TeamText() {
  const s = useDesignerStore();
  const t = s.textTransforms[s.view];
  const firstPlayer = s.roster[0];
  const team = (s.teamName || "YOUR TEAM").slice(0, 60);
  const frontSize = Math.max(20, Math.min(58, 260 / Math.max(team.length * 0.62, 1))) * t.scale;
  const playerName = (firstPlayer?.name || "PLAYER").slice(0, 18).toUpperCase();
  const number = (firstPlayer?.number || "00").slice(0, 3);
  return (
    <g clipPath="url(#text-safe)" transform={`translate(${t.x} ${t.y})`}>
      {s.view === "front" ? (
        <text
          x="400"
          y="360"
          textAnchor="middle"
          fill={s.colors.accent}
          stroke={s.colors.primary}
          strokeWidth="3"
          paintOrder="stroke"
          fontFamily={s.font}
          fontWeight="900"
          fontSize={frontSize}
        >
          {team}
        </text>
      ) : (
        <>
          <text
            x="400"
            y="315"
            textAnchor="middle"
            fill={s.colors.accent}
            stroke={s.colors.primary}
            strokeWidth="2"
            paintOrder="stroke"
            fontFamily={s.font}
            fontWeight="800"
            fontSize={Math.min(34, 210 / Math.max(playerName.length * 0.58, 1)) * t.scale}
          >
            {playerName}
          </text>
          <text
            x="400"
            y="520"
            textAnchor="middle"
            fill={s.colors.accent}
            stroke={s.colors.primary}
            strokeWidth="5"
            paintOrder="stroke"
            fontFamily={s.font}
            fontWeight="900"
            fontSize={150 * t.scale}
          >
            {number}
          </text>
        </>
      )}
    </g>
  );
}

function JerseyPiece() {
  const s = useDesignerStore();
  const t = s.transforms[s.view];
  const art = s.artwork[s.view];
  const sleeveless = s.sport === "Basketball" || s.sport === "Volleyball";
  const path = sleeveless ? sleevelessJersey : sleevedJersey;
  return (
    <g>
      <defs>
        <clipPath id="jersey-clip">
          <path d={path} />
        </clipPath>
        <clipPath id="text-safe">
          <rect x="250" y="245" width="300" height="285" rx="8" />
        </clipPath>
        <linearGradient id="jersey-shine" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <path d={path} fill={s.colors.primary} stroke="#151515" strokeWidth="7" strokeLinejoin="round" />
      <g clipPath="url(#jersey-clip)">
        <path d="M85 120h150l65 560H85zM565 120h150v560H500z" fill={s.colors.secondary} opacity=".9" />
        {art && (
          <image
            href={art}
            x="135"
            y="60"
            width="530"
            height="730"
            preserveAspectRatio="xMidYMid slice"
            opacity=".94"
            transform={`translate(${t.x} ${t.y}) rotate(${t.rotation} 400 420) translate(${400 - 400 * t.scale} ${420 - 420 * t.scale}) scale(${t.scale})`}
          />
        )}
        <path d={path} fill="url(#jersey-shine)" />
      </g>
      <path
        d="M320 82Q336 132 400 145Q464 132 480 82"
        fill="none"
        stroke={s.colors.accent}
        strokeWidth="10"
      />
      <rect
        x="250"
        y="245"
        width="300"
        height="285"
        rx="8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeDasharray="10 9"
        opacity=".85"
      />
      <TeamText />
    </g>
  );
}

function ShortsPiece({ y = 0 }: { y?: number }) {
  const s = useDesignerStore();
  const t = s.transforms[s.view];
  const art = s.artwork[s.view];
  return (
    <g transform={`translate(0 ${y}) scale(.9) translate(44 0)`}>
      <defs>
        <clipPath id="shorts-clip">
          <path d={shortsPath} />
        </clipPath>
      </defs>
      <path d={shortsPath} fill={s.colors.primary} stroke="#151515" strokeWidth="7" strokeLinejoin="round" />
      <g clipPath="url(#shorts-clip)">
        <path d="M205 185h74l58 480H205zm316 0h74v480H463z" fill={s.colors.secondary} />
        {art && (
          <image
            href={art}
            x="180"
            y="160"
            width="440"
            height="520"
            preserveAspectRatio="xMidYMid slice"
            opacity=".9"
            transform={`translate(${t.x} ${t.y}) rotate(${t.rotation} 400 420) translate(${400 - 400 * t.scale} ${420 - 420 * t.scale}) scale(${t.scale})`}
          />
        )}
      </g>
      <path
        d="M235 220h330l-20 385-116 10-29-205-29 205-116-10z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeDasharray="10 9"
        opacity=".85"
      />
    </g>
  );
}

export function GarmentCanvas() {
  const s = useDesignerStore();
  const viewBox =
    s.garmentType === "uniform"
      ? "100 0 600 1130"
      : s.garmentType === "shorts"
        ? "150 120 500 600"
        : "150 0 500 730";

  return (
    <section className="relative h-full w-full overflow-hidden bg-transparent">
      <div
        id="production-canvas"
        className="relative grid h-full place-items-center px-6 pb-6 pt-14 sm:px-16 sm:pb-8 sm:pt-16"
      >
        <svg
          viewBox={viewBox}
          role="img"
          aria-label={`${s.garmentType} ${s.view} design preview`}
          className="h-full w-full max-h-full max-w-[520px] sm:max-w-[600px]"
          style={{ filter: "drop-shadow(0 24px 36px rgba(28, 25, 23, 0.12))" }}
        >
          {s.garmentType !== "shorts" && <JerseyPiece />}
          {s.garmentType !== "jersey" && (
            <ShortsPiece y={s.garmentType === "uniform" ? 500 : 0} />
          )}
        </svg>
      </div>
    </section>
  );
}
