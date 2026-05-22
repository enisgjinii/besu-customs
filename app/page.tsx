"use client";

import dynamic from "next/dynamic";
import { ConfiguratorWizard } from "@/components/configurator-wizard";
import { LayerControlsOverlay } from "@/components/layer-controls-overlay";
import { useEffect, useRef, useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

// Dynamic import for Three.js Scene component
const Scene = dynamic(
  () =>
    import("@/components/three-scene").then((mod) => ({
      default: mod.ThreeScene,
    })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full" />,
  },
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isMobile } = useBreakpoint();
  const sections = useConfiguratorStore((state) => state.sections);
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
  const setCurrentModelUrl = useConfiguratorStore(
    (state) => state.setCurrentModelUrl,
  );
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );
  const didRefreshPersistedModelRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select first section when sections are loaded
  useEffect(() => {
    if (
      sections.length > 0 &&
      !useConfiguratorStore.getState().selectedSectionId
    ) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, setSelectedSection]);

  // Refresh persisted model sections once on first mount so names/categories come
  // from the latest API mappings instead of stale persisted section data.
  useEffect(() => {
    if (!mounted || didRefreshPersistedModelRef.current) return;

    didRefreshPersistedModelRef.current = true;
    if (currentModelUrl) {
      setCurrentModelUrl(currentModelUrl);
    }
  }, [mounted, currentModelUrl, setCurrentModelUrl]);

  // Prevent flash during hydration
  if (!mounted) {
    return <div className="h-screen w-screen bg-white dark:bg-black" />;
  }

  return (
    <div className="h-[100dvh] w-screen bg-white dark:bg-black overflow-x-hidden overflow-y-hidden flex flex-col">
      <main
        className={cn(
          "relative w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black",
          isMobile
            ? "h-[clamp(210px,42dvh,480px)] min-h-[190px] max-h-[58svh] flex-none"
            : "flex-1 min-h-0",
        )}
      >
        <Scene />
        <LayerControlsOverlay />
      </main>

      <div
        className={cn(
          isMobile
            ? "flex-1 min-h-0"
            : "flex-none",
        )}
      >
        <ConfiguratorWizard />
      </div>
    </div>
  );
}
