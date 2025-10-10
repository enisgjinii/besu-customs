"use client"

import { useRef, Suspense } from "react"
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
  if (controlsRef.current && !(useConfiguratorStore.getState() as any).cameraControlsRef) {
    setCameraControlsRef(controlsRef.current)
  }

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
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded-md text-sm backdrop-blur-sm">
          Loading model...
        </div>
      )}
      {modelError && (
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-md text-sm">
          Error: {modelError}
        </div>
      )}
    </div>
  )
}
