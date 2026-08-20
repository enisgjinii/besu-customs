import { NextRequest } from "next/server";
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("primary") || "#101820";
  const s = req.nextUrl.searchParams.get("secondary") || "#d4af37";
  const a = req.nextUrl.searchParams.get("accent") || "#ffffff";
  const safe = (v: string) => /^#[0-9a-f]{6}$/i.test(v) ? v : "#101820";
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="p" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><rect width="90" height="180" fill="${safe(p)}"/><path d="M90 0h45L90 180H45z" fill="${safe(s)}"/></pattern></defs><rect width="1000" height="1000" fill="url(#p)"/><path d="M120 780C260 600 370 540 500 540s240 60 380 240" fill="none" stroke="${safe(a)}" stroke-width="44" stroke-linecap="round" opacity=".82"/><circle cx="500" cy="500" r="260" fill="none" stroke="${safe(a)}" stroke-width="35" opacity=".75"/></svg>`, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } });
}
