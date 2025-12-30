"use client";

import dynamic from "next/dynamic";
import { ConfiguratorHeader } from "@/components/configurator-header";
import { ConfiguratorWizard } from "@/components/configurator-wizard";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
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
      <div className="flex items-center justify-center h-full bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
          <p className="text-sm text-gray-500">Loading 3D viewer...</p>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const sections = useConfiguratorStore((state) => state.sections);
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );

  // Detect mobile viewport
  useEffect(() => {
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

  return (
    <div className="h-screen w-screen bg-white dark:bg-black overflow-hidden flex flex-col">
      {/* 3D Viewer - Mobile: fixed 50vh top area, Desktop: flexible with padding */}
      <main 
        className={`
          relative w-full
          ${isMobile 
            ? 'h-[50vh] min-h-[280px] flex-shrink-0' 
            : 'flex-1 pb-[300px]'
          }
        `}
      >
        <Scene />
      </main>

      {/* Controls Area - Mobile: scrollable bottom 50%, Desktop: fixed bottom bar */}
      <div 
        className={`
          ${isMobile 
            ? 'flex-1 overflow-y-auto overflow-x-hidden' 
            : ''
          }
        `}
      >
        {/* Wizard Bottom Bar */}
        <ConfiguratorWizard />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}

