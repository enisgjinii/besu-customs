"use client";

import { useRef, Suspense, useEffect } from "react";
import { Canvas, useThree, useLoader, extend } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { 
  Color, 
  Texture, 
  TextureLoader, 
  SRGBColorSpace, 
  LinearFilter, 
  VideoTexture,
  TOUCH 
} from "three";
import { ModelLoader } from "./model-loader";
import { DecalPlacer } from "./decal-placer";
import { useConfiguratorStore } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";

// Helper function to get theme-aware background color
const getThemeBackgroundColor = (theme: string | undefined, backgroundColor: string) => {
  // If user has set a custom background color, use it
  if (backgroundColor && backgroundColor !== "#ffffff" && backgroundColor !== "#000000") {
    return backgroundColor;
  }
  // Otherwise use theme-based background
  return theme === "dark" ? "#0f0f0f" : "#f0f0f0";
};

// Background component that handles color, image, and video backgrounds
function Background() {
  const { theme } = useTheme();
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
  const textureRef = useRef<Texture | null>(null);

  // Handle background color
  useEffect(() => {
    if (!backgroundImage && !backgroundVideo) {
      scene.background = new Color(getThemeBackgroundColor(theme, backgroundColor));
    }
  }, [backgroundColor, backgroundImage, backgroundVideo, scene, theme]);

  // Handle background image with performance optimizations
  useEffect(() => {
    if (!backgroundImage) return;

    // Clean up previous texture
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    const loader = new TextureLoader();
    const texture = loader.load(
      backgroundImage,
      (loadedTexture: Texture) => {
        loadedTexture.colorSpace = SRGBColorSpace;
        // Improve image quality with performance considerations
        loadedTexture.minFilter = LinearFilter;
        loadedTexture.magFilter = LinearFilter;
        loadedTexture.generateMipmaps = false;
        scene.background = loadedTexture;
      },
      undefined,
      (err: unknown) => {
        console.warn(
          "Background image loading error (possibly CORS related):",
          err,
        );
        // Fallback to solid color background
        scene.background = new Color(getThemeBackgroundColor(theme, backgroundColor));
      },
    );

    textureRef.current = texture;

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [backgroundImage, backgroundColor, scene, theme]);

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
    const texture = new VideoTexture(video);
    textureRef.current = texture;
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    scene.background = texture;

    if (isVideoPlaying) {
      // Start playing after a small delay to ensure proper initialization
      const playPromise = setTimeout(() => {
        video.play().catch((e) => {
          console.warn("Video play failed:", e);
          // Fallback to solid color on play failure
          scene.background = new Color(getThemeBackgroundColor(theme, backgroundColor));
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
  }, [backgroundVideo, isVideoPlaying, scene, backgroundColor, theme]);

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
        shadows={false} // Disabled to reduce GPU load
        gl={{
          preserveDrawingBuffer: false, // Changed to false - reduces memory usage
          antialias: false, // Disabled for better performance
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl, scene: threeScene }) => {
          setGlRef(gl);
          
          // Optimize renderer settings
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1));
          
          // Handle context loss
          const canvas = gl.domElement;
          const handleContextLoss = (e: Event) => {
            e.preventDefault();
            console.warn('WebGL context lost, attempting to restore...');
          };
          
          const handleContextRestored = () => {
            console.log('WebGL context restored');
            // Force re-render after restoration
            gl.render(threeScene, gl.xr.getCamera());
          };
          
          canvas.addEventListener('webglcontextlost', handleContextLoss);
          canvas.addEventListener('webglcontextrestored', handleContextRestored);
          
          // Periodic cleanup to prevent memory buildup
          const cleanupInterval = setInterval(() => {
            if (gl.info.programs) {
              console.log('GPU Memory:', {
                geometries: gl.info.memory.geometries,
                textures: gl.info.memory.textures,
                programs: gl.info.programs.length
              });
            }
          }, 10000);
          
          return () => {
            clearInterval(cleanupInterval);
          };
        }}
        frameloop="demand" // Only render when needed - saves GPU resources
        dpr={1} // Fixed DPR to reduce memory usage
        performance={{ min: 0.5 }} // Allow quality reduction under load
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
          touches={{ ONE: TOUCH.ROTATE }}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow={false} />

        <Environment preset="city" environmentIntensity={0.5} />

        {/* Background handler */}
        <Background />

        <Suspense fallback={<LoadingFallback />}>
          <ModelLoader controlsRef={controlsRef} />
          <DecalPlacer />
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
