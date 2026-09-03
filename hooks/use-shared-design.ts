"use client";

import { useEffect, useRef } from "react";
import { useDesignerStore } from "@/lib/designer/store";
import { readShareUrl } from "@/lib/designer/share";

function applySharedDesign() {
  const payload = readShareUrl();
  if (!payload) return;
  const patch: Record<string, unknown> = {
    sport: payload.sport,
    garmentType: payload.garmentType,
    style: payload.style,
    teamName: payload.teamName,
    prompt: payload.prompt,
    colors: payload.colors,
    colorsEnabled: payload.colorsEnabled,
    activeStep: 1,
    concepts: [],
    selectedConceptId: undefined,
    artwork: {},
    history: [],
  };
  useDesignerStore.getState().patch(patch);
}

// Restore a shared design (?design=…) once the persisted store has rehydrated.
// Deferring until hydration stops the async rehydrate from wiping the patch.
export function useSharedDesign() {
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    if (!readShareUrl()) return;
    applied.current = true;

    const run = () => applySharedDesign();

    if (useDesignerStore.persist?.hasHydrated()) {
      run();
      return;
    }

    const unsub = useDesignerStore.persist?.onFinishHydration(() => {
      run();
      unsub?.();
    });

    return () => unsub?.();
  }, []);
}
