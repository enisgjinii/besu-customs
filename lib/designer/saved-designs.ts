import type { DesignerState } from "./types";

export interface SavedDesign {
  id: string;
  name: string;
  savedAt: string;
  snapshot: DesignerState;
}

const STORAGE_KEY = "besu-saved-designs-v1";

function readAll(): SavedDesign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(designs: SavedDesign[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  } catch {
    // Storage full or unavailable; ignore.
  }
}

export function listSavedDesigns(): SavedDesign[] {
  return readAll().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function saveDesign(
  name: string,
  snapshot: DesignerState,
): SavedDesign {
  const id = `sd_${Date.now().toString(36)}`;
  const designs = readAll();
  const record: SavedDesign = {
    id,
    name: name.trim() || `Design ${designs.length + 1}`,
    savedAt: new Date().toISOString(),
    snapshot,
  };
  writeAll([record, ...designs].slice(0, 8));
  return record;
}

export function deleteSavedDesign(id: string) {
  writeAll(readAll().filter((d) => d.id !== id));
}

export function getSavedDesign(id: string): SavedDesign | undefined {
  return readAll().find((d) => d.id === id);
}

// A "restore" candidate must keep artwork references so the user can order
// the saved design again. Inline data URLs are preserved so nothing is lost.
export function restoreable(snapshot: DesignerState): boolean {
  return Boolean(snapshot.artwork.front || snapshot.artwork.back || snapshot.designId);
}
