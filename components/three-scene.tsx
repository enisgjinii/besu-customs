"use client";

import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, useProgress } from "@react-three/drei";
import { useConfiguratorStore } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import { ClearCacheButton } from "@/components/clear-cache-button";
import { detectConnectionSpeed, getBestModelUrl, type LoadingProgress } from "@/lib/model-loader-optimized";
import { extractSectionsFromThreeModel, applyMaterialsToThreeModel, extractUVMapFromThreeModel } from "@/lib/three-material-utils";
import * as THREE from "three";

// Loading progress component
function LoadingProgress({ onProgress }: { onProgress: (progress: LoadingProgress) => void }) {
  const { progress, active } = useProgress();
  const speed = detectConnectionSpeed();
  
  useEffect(() => {
    if (active) {
      onProgress({
        stage: progress < 50 ? 'loading-low' : 'loading-high',
        percent: progress,
        bytesLoaded: 0,
        bytesTotal: 0,
        connectionSpeed: speed,
      });
    }
  }, [progress, active, onProgress, speed]);
  
  return null;
}

// Model component that loads and displays the 3D model
function Model({ 
  url, 
  onLoad, 
  onError,
  onSectionsExtracted,
  onUVMapExtracted,
}: { 
  url: string; 
  onLoad?: () => void; 
  onError?: (error: Error) => void;
  onSectionsExtracted?: (sections: any[]) => void;
  onUVMapExtracted?: (uvMap: string | null) => void;
}) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const clonedScene = useRef<THREE.Group | null>(null);
  
  const sections = useConfiguratorStore((s) => s.sections);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const globalCustomTexture = useConfiguratorStore((s) => s.globalCustomTexture);
  const perfConfig = useMobilePerformance();
  
  // Clone scene on first load to avoid modifying the cached original
  useEffect(() => {
    if (!scene) return;
    
    // Clone the scene
    clonedScene.current = scene.clone(true);
    
    // Extract sections from the model
    const extractedSections = extractSectionsFromThreeModel(clonedScene.current, url);
    onSectionsExtracted?.(extractedSections);
    
    // Extract UV map
    const uvMap = extractUVMapFromThreeModel(clonedScene.current, 2048, 2048);
    onUVMapExtracted?.(uvMap);
    
    console.log("✅ Model cloned and sections extracted");
  }, [scene, url, onSectionsExtracted, onUVMapExtracted]);
  
  // Auto-center and scale model
  useEffect(() => {
    if (!modelRef.current || !clonedScene.current) return;
    
    // Clear previous children
    while (modelRef.current.children.length > 0) {
      modelRef.current.remove(modelRef.current.children[0]);
    }
    
    // Add cloned scene
    modelRef.current.add(clonedScene.current);
    
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center the model
    modelRef.current.position.sub(center);
    
    // Scale to fit - adaptive based on model size
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 3.5;
    const scale = targetSize / maxDim;
    modelRef.current.scale.setScalar(scale);
    
    // Position camera
    const distance = targetSize * 2;
    camera.position.set(distance, distance * 0.5, distance);
    camera.lookAt(0, 0, 0);
    
    console.log(`📐 Model scaled: ${scale.toFixed(3)}, size: ${maxDim.toFixed(2)}`);
    
    onLoad?.();
  }, [scene, camera, onLoad]);
  
  // Apply materials from sections
  useEffect(() => {
    if (!clonedScene.current || sections.length === 0) return;
    
    console.log(`🎨 Applying ${sections.length} material sections`);
    applyMaterialsToThreeModel(clonedScene.current, sections);
  }, [sections]);
  
  // Apply global custom texture
  useEffect(() => {
    if (!clonedScene.current || !globalCustomTexture) return;
    
    console.log("🌍 Applying global texture");
    
    const loader = new THREE.TextureLoader();
    const texture = loader.load(globalCustomTexture);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = perfConfig.isLowEndDevice ? 4 : 16;
    
    clonedScene.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.map = texture;
            material.color = new THREE.Color(0xffffff);
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [globalCustomTexture, perfConfig.isLowEndDevice]);
  
  // Auto-rotation
  useFrame(() => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });
  
  return (
    <group ref={modelRef}>
      {showBoundingBox && modelRef.current && <BoundingBoxHelper object={modelRef.current} />}
    </group>
  );
}

// Bounding box helper
function BoundingBoxHelper({ object }: { object: THREE.Object3D }) {
  const boxRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (!boxRef.current || !object) return;
    
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    boxRef.current.position.copy(center);
    boxRef.current.scale.set(size.x, size.y, size.z);
  }, [object]);
  
  return (
    <mesh ref={boxRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// Scene setup component
function SceneSetup() {
  const { gl, scene } = useThree();
  const { theme } = useTheme();
  const backgroundColor = useConfiguratorStore((s) => s.backgroundColor);
  const perfConfig = useMobilePerformance();
  
  useEffect(() => {
    // Set background color - force white for product display
    scene.background = new THREE.Color("#ffffff");
    
    // Configure renderer for mobile
    gl.setPixelRatio(Math.min(window.devicePixelRatio, perfConfig.pixelRatio));
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    
    // Enable shadows on capable devices
    if (!perfConfig.isLowEndDevice && perfConfig.shadowsEnabled) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }, [gl, scene, theme, backgroundColor, perfConfig]);
  
  return null;
}

// Camera controls ref handler
function CameraControlsHandler() {
  const { camera } = useThree();
  const setCameraControlsRef = useConfiguratorStore((s) => s.setCameraControlsRef);
  
  useEffect(() => {
    // Store camera reference for external control
    setCameraControlsRef(camera as any);
  }, [camera, setCameraControlsRef]);
  
  return null;
}

// Error boundary for model loading
function ModelErrorBoundary({ 
  children, 
  onError 
}: { 
  children: React.ReactNode; 
  onError: (error: Error) => void;
}) {
  return (
    <React.Suspense fallback={null}>
      {children}
    </React.Suspense>
  );
}

// Main Three.js Scene Component
export function ThreeScene() {
  const [initError, setInitError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const modelLoading = useConfiguratorStore((s) => s.modelLoading);
  const modelError = useConfiguratorStore((s) => s.modelError);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const setSections = useConfiguratorStore((s) => s.setSections);
  const setCompleteUVMap = useConfiguratorStore((s) => s.setCompleteUVMap);
  const forceLowPerformance = useConfiguratorStore((s) => s.forceLowPerformance);
  
  const perfConfig = useMobilePerformance();
  
  // Handle model URL changes - find best quality version
  useEffect(() => {
    if (!currentModelUrl) {
      setModelUrl(null);
      return;
    }
    
    setModelLoading(true);
    setModelError(null);
    setLoadingProgress({
      stage: 'detecting',
      percent: 0,
      bytesLoaded: 0,
      bytesTotal: 0,
      connectionSpeed: detectConnectionSpeed(),
    });
    
    // Find best model URL based on connection
    getBestModelUrl(currentModelUrl, forceLowPerformance ? 'low' : 'auto')
      .then(({ url, quality }) => {
        console.log(`📦 Loading ${quality} quality: ${url}`);
        setModelUrl(url);
      })
      .catch((error) => {
        console.error("Failed to determine model URL:", error);
        setModelUrl(currentModelUrl); // Fallback to original
      });
  }, [currentModelUrl, forceLowPerformance, setModelLoading, setModelError]);
  
  const handleModelLoad = useCallback(() => {
    setModelLoading(false);
    setLoadingProgress(null);
    console.log("✅ Model loaded successfully");
  }, [setModelLoading]);
  
  const handleModelError = useCallback((error: Error) => {
    setModelError(error.message);
    setModelLoading(false);
    setLoadingProgress(null);
    console.error("❌ Model loading error:", error);
  }, [setModelError, setModelLoading]);
  
  const handleSectionsExtracted = useCallback((extractedSections: any[]) => {
    // Try to fetch precomputed sections from API first
    if (currentModelUrl) {
      fetch(`/api/materials?model=${encodeURIComponent(currentModelUrl)}`)
        .then((resp) => resp.json())
        .then((data) => {
          if (data?.sections && data.sections.length > 0) {
            console.log("📋 Using API sections:", data.sections.length);
            setSections(data.sections);
          } else {
            console.log("📋 Using extracted sections:", extractedSections.length);
            setSections(extractedSections);
          }
        })
        .catch(() => {
          console.log("📋 Using extracted sections (API failed):", extractedSections.length);
          setSections(extractedSections);
        });
    } else {
      setSections(extractedSections);
    }
  }, [currentModelUrl, setSections]);
  
  const handleUVMapExtracted = useCallback((uvMap: string | null) => {
    setCompleteUVMap(uvMap);
    if (uvMap) {
      console.log("🗺️ UV map extracted successfully");
    }
  }, [setCompleteUVMap]);
  
  const handleProgress = useCallback((progress: LoadingProgress) => {
    setLoadingProgress(progress);
  }, []);
  
  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      canvas.remove();
      if (!gl) {
        setInitError("WebGL is not supported on this device. Please try a different browser or device.");
      }
    } catch (e) {
      setInitError("Failed to initialize 3D graphics. Please try a different browser.");
    }
  }, []);
  
  if (initError) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="max-w-md p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">3D Graphics Error</h2>
            <p className="text-muted-foreground mb-4">{initError}</p>
            <ClearCacheButton className="mb-2" />
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={!perfConfig.isLowEndDevice && perfConfig.shadowsEnabled}
        dpr={[1, Math.min(perfConfig.pixelRatio, 2)]}
        gl={{
          antialias: perfConfig.antialias,
          alpha: true,
          powerPreference: perfConfig.isLowEndDevice ? "low-power" : "high-performance",
          preserveDrawingBuffer: true, // For screenshots
        }}
        style={{ touchAction: "none" }}
      >
        <SceneSetup />
        <CameraControlsHandler />
        <LoadingProgress onProgress={handleProgress} />
        
        {/* Lighting - optimized for product display */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          castShadow={perfConfig.shadowsEnabled && !perfConfig.isLowEndDevice}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <directionalLight position={[0, -5, 0]} intensity={0.2} />
        
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={45} near={0.1} far={1000} />
        
        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={50}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
        
        {/* Model */}
        {modelUrl && (
          <Suspense fallback={null}>
            <Model 
              url={modelUrl} 
              onLoad={handleModelLoad}
              onError={handleModelError}
              onSectionsExtracted={handleSectionsExtracted}
              onUVMapExtracted={handleUVMapExtracted}
            />
          </Suspense>
        )}
        
        {/* Environment for better reflections (only on capable devices) */}
        {!perfConfig.isLowEndDevice && <Environment preset="studio" />}
      </Canvas>
      
      {/* Empty state */}
      {!currentModelUrl && !modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 pointer-events-none">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">Select a Model</h2>
            <p className="text-muted-foreground text-sm">
              Choose a 3D model from the dropdown menu to get started with customization
            </p>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-6 max-w-sm px-6">
            <Spinner className="size-12 text-primary" />
            <div className="text-center w-full">
              <p className="text-lg font-semibold text-foreground mb-2">
                {loadingProgress?.stage === 'detecting' && 'Detecting Connection...'}
                {loadingProgress?.stage === 'loading-low' && 'Loading Preview...'}
                {loadingProgress?.stage === 'loading-high' && 'Loading Full Quality...'}
                {!loadingProgress && 'Loading 3D Model'}
              </p>
              
              {loadingProgress && loadingProgress.percent > 0 && (
                <div className="w-full mb-3">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {loadingProgress.percent.toFixed(0)}%
                    {loadingProgress.connectionSpeed && ` • ${loadingProgress.connectionSpeed} connection`}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {modelError && (
        <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-sm shadow-lg border border-red-400/20 max-w-sm z-20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span className="font-medium">Model Loading Error</span>
          </div>
          <p className="mt-1 text-red-100">{modelError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Reload page
          </button>
        </div>
      )}
      
      {/* Performance indicator */}
      {(perfConfig.isLowEndDevice || forceLowPerformance) && (
        <div className="absolute top-4 left-4 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs shadow-md border border-yellow-400/20 z-20">
          <div className="flex items-center gap-2">
            <span className="font-medium">Reduced performance mode</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Preload hook for useGLTF
useGLTF.preload;
