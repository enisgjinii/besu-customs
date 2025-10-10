"use client"

import { Scene } from "@/components/scene"
import { UnifiedSidebar } from "@/components/unified-sidebar"
import { ChevronRight, PanelLeftClose } from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Unified Left Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full border-r border-border/50 bg-card transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[420px] opacity-100" : "w-0 opacity-0"
          }`}
        style={{ minWidth: sidebarOpen ? "420px" : "0px" }}
      >
        <div className={`w-[420px] h-full ${sidebarOpen ? "block" : "hidden"}`}>
          <UnifiedSidebar />
        </div>
      </aside>

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/50 rounded-r-lg p-2.5 hover:bg-secondary/80 transition-all duration-300 shadow-lg hover:shadow-xl group"
        style={{
          left: sidebarOpen ? "420px" : "0px",
          transition: "left 300ms ease-in-out",
        }}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Main 3D Viewer */}
      <main className="flex-1 h-full relative min-w-0">
        <Scene />
      </main>

      {/* Mobile: Bottom drawer */}
      <div className="md:hidden border-t border-border/50 bg-card p-4">
        <p className="text-sm text-muted-foreground text-center">Use desktop for full controls</p>
      </div>
    </div>
  )
}
