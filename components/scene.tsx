"use client"

import { useRef, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei"
import { ModelLoader } from "./model-loader"
import { useConfiguratorStore } from "@/lib/store"

export function Scene() {
  const showGrid = useConfiguratorStore((state) => state.showGrid)
  const controlsRef = useRef<any>(null)

  return (
    <div className="w-full h-full relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 2, 5]} />
        <OrbitControls ref={controlsRef} makeDefault />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        <Environment preset="studio" />

        {showGrid && <Grid args={[20, 20]} cellColor="#6b7280" sectionColor="#374151" />}

        <Suspense fallback={null}>
          <ModelLoader />
        </Suspense>
      </Canvas>

      <ResetCameraButton controlsRef={controlsRef} />
    </div>
  )
}

function ResetCameraButton({ controlsRef }: { controlsRef: any }) {
  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <button
      onClick={handleReset}
      className="absolute bottom-4 left-4 px-3 py-2 bg-card border-2 border-primary text-card-foreground text-sm font-medium hover:bg-secondary transition-colors"
    >
      Reset Camera
    </button>
  )
}
