"use client";

import dynamic from "next/dynamic";
import { ConfiguratorWizard } from "@/components/configurator-wizard";
import { useEffect, useState } from "react";
import { useConfiguratorStore } from "@/lib/store";

// Dynamic import for Three.js Scene component
const Scene = dynamic(
  () =>
    import("@/components/three-scene").then((mod) => ({
      default: mod.ThreeScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Loading 3D viewer...</p>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sections = useConfiguratorStore((state) => state.sections);
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );

  // Detect mobile viewport
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  // Prevent flash during hydration
  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // Mobile Layout: 3D viewer on top (40%), controls below (60%)
  if (isMobile) {
    return (
      <div className="h-[100dvh] w-screen bg-white dark:bg-black flex flex-col overflow-hidden">
        {/* 3D Viewer - 40% of viewport height */}
        <div className="h-[40dvh] min-h-[200px] flex-shrink-0 relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
          <Scene />
        </div>

        {/* Controls Area - 60% of viewport, scrollable */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ConfiguratorWizard />
        </div>
      </div>
    );
  }

  // Desktop Layout: Full height with fixed bottom wizard
  return (
    <div className="h-screen w-screen bg-white dark:bg-black overflow-hidden flex flex-col">
      {/* 3D Viewer - Takes remaining space above wizard */}
      <main className="flex-1 relative w-full pb-[280px]">
        <Scene />
      </main>

      {/* Wizard - Fixed at bottom */}
      <ConfiguratorWizard />
    </div>
  );
}
