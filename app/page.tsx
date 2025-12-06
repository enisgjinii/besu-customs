"use client";

import dynamic from "next/dynamic";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useState, useEffect } from "react";
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
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading 3D viewer...</p>
        </div>
      </div>
    ),
  },
);

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  
  // Mobile panel state from store
  const mobilePanelOpen = useConfiguratorStore((state) => state.mobilePanelOpen);
  const mobilePanelHeight = useConfiguratorStore((state) => state.mobilePanelHeight);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with 'B' key on desktop
      if (e.key === "b" && !isMobile && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== "INPUT" && activeElement?.tagName !== "TEXTAREA") {
          setSidebarCollapsed((prev) => !prev);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  // Prevent pull-to-refresh on mobile
  useEffect(() => {
    if (!isMobile) return;

    const preventPullToRefresh = (e: TouchEvent) => {
      // Only prevent if at top of page and pulling down
      if (window.scrollY === 0 && e.touches[0].clientY > 0) {
        const touch = e.touches[0];
        if (touch.clientY > 10) {
          // Allow some tolerance
          return;
        }
      }
    };

    document.addEventListener("touchmove", preventPullToRefresh, { passive: false });
    return () => document.removeEventListener("touchmove", preventPullToRefresh);
  }, [isMobile]);

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

      {/* Main 3D Viewer */}
      <main
        className={`flex-1 relative min-w-0 transition-all duration-300 ease-out ${
          // Desktop: account for sidebar width
          sidebarCollapsed ? "md:pl-[80px]" : "md:pl-[440px]"
        }`}
        style={{ 
          touchAction: 'none',
          // Mobile: shift up when panel is open
          ...(isMobile ? {
            height: mobilePanelOpen 
              ? `calc(100dvh - 72px - ${mobilePanelHeight}vh)` 
              : 'calc(100dvh - 72px)',
            transform: mobilePanelOpen 
              ? `translateY(-${mobilePanelHeight * 0.3}vh)` 
              : 'translateY(0)',
            transition: 'transform 0.3s ease-out, height 0.3s ease-out',
          } : {})
        }}
      >
        <Scene />
        
        {/* Mobile: Floating hint when no model selected */}
        {isMobile && !currentModelUrl && !mobilePanelOpen && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
              <p className="text-sm text-center text-muted-foreground">
                Tap <span className="font-medium text-foreground">Materials</span> below to select a 3D model
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
