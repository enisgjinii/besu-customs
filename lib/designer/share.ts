import type { DesignerState } from "./types";

// A shareable design link encodes the essential design inputs (not heavy artwork)
// so a teammate can re-open the brief, colors and team name on load and re-generate.
export interface SharePayload {
  sport: string;
  garmentType: DesignerState["garmentType"];
  style: DesignerState["style"];
  teamName: string;
  prompt: string;
  colors: DesignerState["colors"];
  colorsEnabled: boolean;
}

export function toSharePayload(state: DesignerState): SharePayload {
  return {
    sport: state.sport,
    garmentType: state.garmentType,
    style: state.style,
    teamName: state.teamName,
    prompt: state.prompt,
    colors: state.colors,
    colorsEnabled: state.colorsEnabled,
  };
}

export function encodeSharePayload(payload: SharePayload): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch {
    return "";
  }
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const value = JSON.parse(json);
    if (!value || typeof value !== "object") return null;
    return value as SharePayload;
  } catch {
    return null;
  }
}

const QUERY_KEY = "design";

export function buildShareUrl(payload: SharePayload): string {
  const encoded = encodeSharePayload(payload);
  if (!encoded) return "";
  const base = `${window.location.origin}${window.location.pathname}`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${QUERY_KEY}=${encodeURIComponent(encoded)}`;
}

export function readShareUrl(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get(QUERY_KEY);
  if (!value) return null;
  return decodeSharePayload(value);
}

export async function copyShareLink(payload: SharePayload): Promise<boolean> {
  const url = buildShareUrl(payload);
  if (!url) return false;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
