"use client"

import { useRef, Suspense, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Environment, PerspectiveCamera } from "@react-three/drei"
import { ModelLoader } from "./model-loader"
import { useConfiguratorStore } from "@/lib/store"

export function Scene() {
  const showGrid = useConfiguratorStore((state) => state.showGrid)
  const setCameraControlsRef = useConfiguratorStore((state) => (state as any).setCameraControlsRef)
  const controlsRef = useRef<any>(null)
  const modelLoading = useConfiguratorStore((state) => (state as any).modelLoading)
  const modelError = useConfiguratorStore((state) => (state as any).modelError)

  // Store controls ref in global state
  useEffect(() => {
    if (controlsRef.current) {
      setCameraControlsRef(controlsRef.current)
    }
  }, [setCameraControlsRef])

  return (
    <div className="w-full h-full relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 2, 5]} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0, 0]}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          maxDistance={8}
          minDistance={0.5}
          maxPolarAngle={Math.PI * 0.95}
          minPolarAngle={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        <Environment preset="studio" />

        {showGrid && <Grid args={[20, 20]} cellColor="#6b7280" sectionColor="#374151" />}

        <Suspense fallback={null}>
          <ModelLoader controlsRef={controlsRef} />
        </Suspense>
      </Canvas>

      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}
      {modelError && (
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-md text-sm shadow-lg">
          Error: {modelError}
        </div>
      )}
    </div>
  )
}
