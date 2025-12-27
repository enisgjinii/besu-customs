"use client";

import dynamic from "next/dynamic";
import { ConfiguratorHeader } from "@/components/configurator-header";
import { ConfiguratorWizard } from "@/components/configurator-wizard";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useEffect } from "react";
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
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-sm text-gray-500">Loading 3D viewer...</p>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const sections = useConfiguratorStore((state) => state.sections);
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );

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
      {/* 3D Viewer - Account for both wizard and mobile nav with generous padding */}
      <main className="flex-1 relative w-full h-full pb-[420px] md:pb-[300px]">
        <Scene />
      </main>

      {/* Wizard Bottom Bar */}
      <ConfiguratorWizard />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
