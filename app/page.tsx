"use client"

import { Scene } from "@/components/scene"
import { ProductSidebar } from "@/components/product-sidebar"
import { ControlsPanel } from "@/components/controls-panel"
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop: Left sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full border-r border-border/50 bg-card transition-all duration-300 ease-in-out ${
          leftOpen ? "w-64 opacity-100" : "w-0 opacity-0"
        }`}
        style={{ minWidth: leftOpen ? "256px" : "0px" }}
      >
        <div className={`w-64 h-full ${leftOpen ? "block" : "hidden"}`}>
          <ProductSidebar />
        </div>
      </aside>

      {/* Left toggle button */}
      <button
        onClick={() => setLeftOpen(!leftOpen)}
        className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/50 rounded-r-lg p-2.5 hover:bg-secondary/80 transition-all duration-300 shadow-lg hover:shadow-xl group"
        style={{ 
          left: leftOpen ? "256px" : "0px",
          transition: "left 300ms ease-in-out"
        }}
        title={leftOpen ? "Hide models panel" : "Show models panel"}
      >
        {leftOpen ? (
          <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Main viewer */}
      <main className="flex-1 h-full relative min-w-0">
        <Scene />
      </main>

      {/* Right toggle button */}
      <button
        onClick={() => setRightOpen(!rightOpen)}
        className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/50 rounded-l-lg p-2.5 hover:bg-secondary/80 transition-all duration-300 shadow-lg hover:shadow-xl group"
        style={{ 
          right: rightOpen ? "384px" : "0px",
          transition: "right 300ms ease-in-out"
        }}
        title={rightOpen ? "Hide controls panel" : "Show controls panel"}
      >
        {rightOpen ? (
          <PanelRightClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Desktop: Right controls */}
      <aside
        className={`hidden md:flex flex-col h-full border-l border-border/50 bg-card transition-all duration-300 ease-in-out ${
          rightOpen ? "w-96 opacity-100" : "w-0 opacity-0"
        }`}
        style={{ minWidth: rightOpen ? "384px" : "0px" }}
      >
        <div className={`w-96 h-full ${rightOpen ? "block" : "hidden"}`}>
          <ControlsPanel />
        </div>
      </aside>

      {/* Mobile: Bottom drawer */}
      <div className="md:hidden border-t border-border/50 bg-card p-4">
        <p className="text-sm text-muted-foreground text-center">Use desktop for full controls</p>
      </div>
    </div>
  )
}
