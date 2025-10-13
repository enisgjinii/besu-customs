"use client";

import { useRef, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { ModelLoader } from "./model-loader";
import { useConfiguratorStore } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";

// Loading fallback component for Suspense
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        transparent 
        opacity={0.3}
        wireframe 
      />
    </mesh>
  );
}

export function Scene() {
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const setCameraControlsRef = useConfiguratorStore(
    (state) => state.setCameraControlsRef,
  );
  const setGlRef = useConfiguratorStore((state) => state.setGlRef);
  const autoRotate = useConfiguratorStore((state) => state.autoRotate);
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  const controlsRef = useRef(null);
  const modelLoading = useConfiguratorStore((state) => state.modelLoading);
  const modelError = useConfiguratorStore((state) => state.modelError);

  // Store controls ref in global state
  useEffect(() => {
    if (controlsRef.current) {
      setCameraControlsRef(controlsRef.current);
    }
  }, [setCameraControlsRef]);

  // Ensure auto-rotation is disabled on initial load
  useEffect(() => {
    // Explicitly disable auto-rotation on component mount to ensure default behavior
    setAutoRotate(false);
  }, [setAutoRotate]);

  return (
    <div className="w-full h-full relative" data-tour="scene-controls">
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onCreated={({ gl }) => setGlRef(gl)}
      >
        <PerspectiveCamera makeDefault position={[3, 2, 5]} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0, 0]}
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.05}
          maxDistance={8}
          minDistance={0.5}
          maxPolarAngle={Math.PI * 0.95}
          minPolarAngle={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          autoRotate={autoRotate}
          autoRotateSpeed={2.0}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        <Environment preset="studio" />

        {showGrid && (
          <Grid args={[20, 20]} cellColor="#6b7280" sectionColor="#374151" />
        )}

        <Suspense fallback={<LoadingFallback />}>
          <ModelLoader controlsRef={controlsRef} />
        </Suspense>
      </Canvas>

      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-6">
            {/* Shadcn spinner */}
            <Spinner className="size-12 text-primary" />
            
            {/* Loading text with animation */}
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                Loading 3D Model
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {modelError && (
        <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-sm shadow-lg border border-red-400/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span className="font-medium">Model Loading Error</span>
          </div>
          <p className="mt-1 text-red-100">{modelError}</p>
        </div>
      )}
    </div>
  );
}