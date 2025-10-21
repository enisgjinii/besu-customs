"use client";

import { useRef, Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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

// Background component that handles color, image, and video backgrounds
function Background() {
  const backgroundColor = useConfiguratorStore(
    (state) => state.backgroundColor,
  );
  const backgroundImage = useConfiguratorStore(
    (state) => state.backgroundImage,
  );
  const backgroundVideo = useConfiguratorStore(
    (state) => state.backgroundVideo,
  );
  const isVideoPlaying = useConfiguratorStore((state) => state.isVideoPlaying);

  const { scene } = useThree();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | THREE.Texture | null>(null);

  // Handle background color
  useEffect(() => {
    if (!backgroundImage && !backgroundVideo) {
      scene.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor, backgroundImage, backgroundVideo, scene]);

  // Handle background image with performance optimizations
  useEffect(() => {
    if (!backgroundImage) return;

    // Clean up previous texture
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      backgroundImage,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        // Improve image quality with performance considerations
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        scene.background = loadedTexture;
      },
      undefined,
      (error) => {
        console.warn(
          "Background image loading error (possibly CORS related):",
          error,
        );
        // Fallback to solid color background
        scene.background = new THREE.Color(backgroundColor);
      },
    );

    textureRef.current = texture;

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [backgroundImage, backgroundColor, scene]);

  // Handle background video with performance optimizations
  useEffect(() => {
    // Clean up previous video and texture
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.remove();
      videoRef.current = null;
    }

    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    if (!backgroundVideo) return;

    const video = document.createElement("video");
    videoRef.current = video;

    video.src = backgroundVideo;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    // Mobile optimization attributes
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("playsinline", "true");

    // Create texture with optimized settings
    const texture = new THREE.VideoTexture(video);
    textureRef.current = texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    scene.background = texture;

    if (isVideoPlaying) {
      // Start playing after a small delay to ensure proper initialization
      const playPromise = setTimeout(() => {
        video.play().catch((e) => {
          console.warn("Video play failed:", e);
          // Fallback to solid color on play failure
          scene.background = new THREE.Color(backgroundColor);
        });
      }, 50);

      return () => {
        clearTimeout(playPromise);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.remove();
          videoRef.current = null;
        }
        if (textureRef.current) {
          textureRef.current.dispose();
          textureRef.current = null;
        }
      };
    } else {
      // For paused video, just load the first frame
      video.addEventListener(
        "loadeddata",
        () => {
          texture.needsUpdate = true;
        },
        { once: true },
      );

      return () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.remove();
          videoRef.current = null;
        }
        if (textureRef.current) {
          textureRef.current.dispose();
          textureRef.current = null;
        }
      };
    }
  }, [backgroundVideo, isVideoPlaying, scene, backgroundColor]);

  return null;
}

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
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false, // Disable alpha for better performance
          stencil: false, // Disable stencil for better performance
          depth: true,
          powerPreference: "high-performance", // Request high-performance GPU
        }}
        onCreated={({ gl }) => {
          setGlRef(gl);
          // Enable Draco loader for compressed models
          gl.capabilities.maxTextures = 16;
        }}
        frameloop="always" // Ensure consistent frame updates
        dpr={[1, 2]} // Limit device pixel ratio for performance
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

        {/* Background handler */}
        <Background />

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
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
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
