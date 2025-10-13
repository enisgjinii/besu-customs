"use client";

import { Scene } from "@/components/scene";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden">
      {/* Desktop: Unified Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full border-r border-border/50 bg-card transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-[420px] opacity-100" : "w-0 opacity-0"
        }`}
        style={{ minWidth: sidebarOpen ? "420px" : "0px" }}
        data-tour="sidebar"
      >
        <div className={`w-[420px] h-full ${sidebarOpen ? "block" : "hidden"}`}>
          <UnifiedSidebar sidebarOpen={sidebarOpen} onToggleSidebar={setSidebarOpen} />
        </div>
      </aside>

      {/* Expand sidebar button when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex items-center justify-center absolute top-4 left-4 z-50 h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
          title="Show sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* Main 3D Viewer */}
      <main className="flex-1 relative min-w-0 pb-20 md:pb-0">
        <Scene />
      </main>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Navigation Tour Target */}

    </div>
  );
}
