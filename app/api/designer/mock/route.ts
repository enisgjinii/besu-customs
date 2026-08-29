import { NextRequest } from "next/server";

/**
 * Deterministic preview renderer used when DESIGNER_MOCK_AI=true.
 *
 * It exists so the full customer journey (four concepts, selection, refinement,
 * colour variation, roster, export, checkout) can be exercised repeatedly in QA
 * without spending image-model credits. The seed is derived from the design brief,
 * so each of the four art directions renders a visibly different uniform while a
 * refinement or recolour of the same concept keeps its garment identity.
 *
 * These are NOT the production image-model renders.
 */

const HEX = /^#[0-9a-f]{6}$/i;
// Sleeveless basketball silhouette: shoulder straps with deeply cut-in armholes.
const JERSEY =
  "M132 6 C164 52 236 52 268 6 L296 8 C316 14 330 30 338 54 C316 98 306 152 306 212 L306 470 L94 470 L94 212 C94 152 84 98 62 54 C70 30 84 14 104 8 Z";
const SHORTS =
  "M56 0 H344 L358 210 C358 258 348 292 344 300 H224 L200 150 L176 300 H56 C52 292 42 258 42 210 Z";

function safeColor(value: string | null, fallback: string) {
  return value && HEX.test(value) ? value : fallback;
}

function seedValue(seed: string) {
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  return hash;
}

function motif(variant: number, secondary: string, accent: string, clip: string) {
  const shade = `<g clip-path="url(#${clip})">`;
  if (variant === 0) {
    return `${shade}
      <circle cx="300" cy="120" r="86" fill="${secondary}" opacity=".9"/>
      <circle cx="272" cy="100" r="18" fill="${accent}" opacity=".35"/>
      <circle cx="330" cy="150" r="11" fill="${accent}" opacity=".3"/>
      <path d="M-40 400 C120 300 260 320 420 220" fill="none" stroke="${secondary}" stroke-width="34" stroke-linecap="round" opacity=".85"/>
      <path d="M-40 452 C120 356 260 372 420 274" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" opacity=".8"/>
      <g fill="${accent}" opacity=".85">
        <circle cx="96" cy="196" r="5"/><circle cx="150" cy="150" r="3.5"/><circle cx="118" cy="300" r="4"/>
        <circle cx="322" cy="330" r="4.5"/><circle cx="240" cy="250" r="3"/>
      </g>
    </g>`;
  }
  if (variant === 1) {
    return `${shade}
      <g fill="${secondary}">
        <path d="M-60 470 L120 -20 L220 -20 L40 470 Z"/>
        <path d="M120 470 L300 -20 L360 -20 L180 470 Z" opacity=".85"/>
      </g>
      <g fill="${accent}" opacity=".9">
        <path d="M76 470 L256 -20 L280 -20 L100 470 Z"/>
        <path d="M232 470 L412 -20 L426 -20 L246 470 Z"/>
      </g>
    </g>`;
  }
  if (variant === 2) {
    return `${shade}
      <rect x="52" y="-20" width="58" height="520" fill="${secondary}"/>
      <rect x="292" y="-20" width="58" height="520" fill="${secondary}"/>
      <rect x="114" y="-20" width="12" height="520" fill="${accent}" opacity=".9"/>
      <rect x="276" y="-20" width="12" height="520" fill="${accent}" opacity=".9"/>
      <rect x="-20" y="352" width="460" height="30" fill="${secondary}" opacity=".55"/>
      <rect x="-20" y="392" width="460" height="10" fill="${accent}" opacity=".7"/>
    </g>`;
  }
  return `${shade}
    <rect x="-20" y="248" width="460" height="9" fill="${accent}" opacity=".9"/>
    <rect x="-20" y="264" width="460" height="4" fill="${secondary}" opacity=".8"/>
    <path d="M330 -20 L372 -20 L372 500 L330 500 Z" fill="${secondary}" opacity=".5"/>
  </g>`;
}

function garment(
  path: string,
  clip: string,
  variant: number,
  primary: string,
  secondary: string,
  accent: string,
) {
  return `
    <clipPath id="${clip}"><path d="${path}"/></clipPath>
    <path d="${path}" fill="${primary}"/>
    ${motif(variant, secondary, accent, clip)}
    <path d="${path}" fill="none" stroke="${accent}" stroke-width="5" opacity=".65"/>
    <path d="${path}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>`;
}

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const primary = safeColor(params.get("primary"), "#101820");
  const secondary = safeColor(params.get("secondary"), "#00A3FF");
  const accent = safeColor(params.get("accent"), "#FFFFFF");
  const seed = params.get("seed") || "besu";
  const team = (params.get("team") || "TEAM").replace(/[^A-Za-z0-9 .'-]/g, "").slice(0, 18).toUpperCase();
  const requested = params.get("variant");
  const explicit = requested ? Number(requested) : Number.NaN;
  const variant = Number.isInteger(explicit) && explicit >= 0 && explicit <= 3
    ? explicit
    : seedValue(seed) % 4;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1024" width="1536" height="1024" role="img" aria-label="${team} uniform preview">
  <rect width="1536" height="1024" fill="#f4f3ef"/>
  <g font-family="Helvetica, Arial, sans-serif" font-weight="700" fill="#8b8b85" font-size="26" letter-spacing="4">
    <text x="330" y="70" text-anchor="middle">FRONT</text>
    <text x="1108" y="70" text-anchor="middle">BACK</text>
  </g>

  <g transform="translate(130,110)">
    ${garment(JERSEY, `fj-${variant}`, variant, primary, secondary, accent)}
    <text x="200" y="300" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800"
      font-size="${team.length > 10 ? 42 : 56}" fill="${accent}" letter-spacing="2"
      stroke="rgba(0,0,0,.35)" stroke-width="1.5">${team}</text>
  </g>
  <g transform="translate(130,610)">
    ${garment(SHORTS, `fs-${variant}`, variant, primary, secondary, accent)}
  </g>

  <g transform="translate(908,110)">
    ${garment(JERSEY, `bj-${variant}`, variant, primary, secondary, accent)}
    <text x="200" y="150" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700"
      font-size="34" fill="${accent}" letter-spacing="3">PLAYER</text>
    <text x="200" y="330" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800"
      font-size="150" fill="${accent}" stroke="rgba(0,0,0,.35)" stroke-width="2">24</text>
  </g>
  <g transform="translate(908,610)">
    ${garment(SHORTS, `bs-${variant}`, variant, primary, secondary, accent)}
  </g>

  <text x="768" y="988" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="600"
    font-size="22" fill="#a8a8a0" letter-spacing="2">DETERMINISTIC PREVIEW RENDER — QA MODE</text>
</svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}
