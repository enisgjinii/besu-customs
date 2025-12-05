"use client";

import dynamic from "next/dynamic";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

// Dynamic import for Three.js Scene component (migrated from Babylon.js)
const Scene = dynamic(
  () =>
    import("@/components/three-scene").then((mod) => ({
      default: mod.ThreeScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
  },
);
import { useState, useEffect } from "react";
import { useConfiguratorStore } from "@/lib/store";

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Removed setSidebarOpen(false) as sidebarOpen state is removed
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden overscroll-none">
      {/* Desktop: Unified Left Sidebar */}
      <div
        className={`hidden md:block fixed top-4 left-4 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-[60px]" : "w-[420px]"
        }`}
      >
        <UnifiedSidebar
          sidebarOpen={!sidebarCollapsed}
          onToggleSidebar={(open) => setSidebarCollapsed(!open)}
        />
      </div>

      {/* Main 3D Viewer - Account for sidebar width on desktop */}
      <main
        className={`flex-1 relative min-w-0 pb-20 md:pb-0 transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[80px]" : "md:pl-[440px]"
        }`}
        style={{ touchAction: 'none' }} /* Prevent default touch actions on 3D canvas area */
      >
        <Scene />
      </main>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Navigation Tour Target */}
    </div>
  );
}
