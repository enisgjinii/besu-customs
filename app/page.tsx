import { Scene } from "@/components/scene"
import { ProductSidebar } from "@/components/product-sidebar"
import { ControlsPanel } from "@/components/controls-panel"

export default function Home() {
  return (
    <div className="h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop: Left sidebar */}
      <aside className="hidden md:block w-64 h-full border-r border-border/50">
        <ProductSidebar />
      </aside>

      {/* Main viewer */}
      <main className="flex-1 h-full md:h-screen">
        <Scene />
      </main>

      {/* Desktop: Right controls */}
      <aside className="hidden md:block w-96 h-full border-l border-border/50">
        <ControlsPanel />
      </aside>

      {/* Mobile: Bottom drawer */}
      <div className="md:hidden border-t border-border/50 bg-card p-4">
        <p className="text-sm text-muted-foreground text-center">Use desktop for full controls</p>
      </div>
    </div>
  )
}
