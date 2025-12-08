"use client";

import dynamic from "next/dynamic";
import { ConfiguratorHeader } from "@/components/configurator-header";
import { ConfiguratorBottomBar } from "@/components/configurator-bottom-bar";
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
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
  const sections = useConfiguratorStore((state) => state.sections);
  const setSelectedSection = useConfiguratorStore((state) => state.setSelectedSection);

  // Auto-select first section when sections are loaded
  useEffect(() => {
    if (sections.length > 0 && !useConfiguratorStore.getState().selectedSectionId) {
      setSelectedSection(sections[0].id);
    }
  }, [sections, setSelectedSection]);

  return (
    <div className="h-screen w-screen bg-white overflow-hidden flex flex-col">
      {/* Header - Fixed at top */}
      <ConfiguratorHeader />

      {/* 3D Viewer - Full screen with padding for header/footer */}
      <main
        className="flex-1 relative"
        style={{
          paddingTop: '60px', // Header height
          paddingBottom: '140px', // Bottom bar height
        }}
      >
        <Scene />

        {/* Empty State Overlay */}
        {!currentModelUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '60px', bottom: '140px' }}>
            <div className="text-center px-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">Select a Product</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Choose a 3D model to start customizing your design
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar - Fixed at bottom */}
      <ConfiguratorBottomBar />
    </div>
  );
}
