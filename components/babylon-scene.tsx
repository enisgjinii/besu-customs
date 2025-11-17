"use client";

import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color4,
  Color3,
  SceneLoader,
  AbstractMesh,
  Mesh,
  StandardMaterial,
  Texture,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useConfiguratorStore } from "@/lib/store";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "next-themes";
import {
  applyMaterialsToModel,
  extractSectionsFromModel,
} from "@/lib/babylon-material-utils";
import { BabylonDecals } from "./babylon-decals";

// Helper function to get theme-aware background color
const getThemeBackgroundColor = (
  theme: string | undefined,
  backgroundColor: string,
) => {
  if (
    backgroundColor &&
    backgroundColor !== "#ffffff" &&
    backgroundColor !== "#000000"
  ) {
    return backgroundColor;
  }
  return theme === "dark" ? "#0f0f0f" : "#f0f0f0";
};

// Convert hex color to Babylon Color3
function hexToColor3(hex: string): Color3 {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return new Color3(1, 1, 1);
  return new Color3(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  );
}

// Convert hex color to Babylon Color4
function hexToColor4(hex: string): Color4 {
  const color3 = hexToColor3(hex);
  return new Color4(color3.r, color3.g, color3.b, 1);
}

export function BabylonScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const currentMeshRef = useRef<AbstractMesh | null>(null);

  const { theme } = useTheme();
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const backgroundColor = useConfiguratorStore((s) => s.backgroundColor);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const modelLoading = useConfiguratorStore((s) => s.modelLoading);
  const modelError = useConfiguratorStore((s) => s.modelError);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const setCameraControlsRef = useConfiguratorStore(
    (s) => s.setCameraControlsRef,
  );
  const sections = useConfiguratorStore((s) => s.sections);
  const setSections = useConfiguratorStore((s) => s.setSections);
  const highlightedSectionId = useConfiguratorStore((s) => s.highlightedSectionId);

  // Initialize Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("🎮 Initializing Babylon.js engine...");

    // Create engine with optimized settings
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: false, // Disabled for performance
      powerPreference: "high-performance",
      doNotHandleContextLost: false,
    });

    engineRef.current = engine;

    // Create scene
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Set background color
    const bgColor = getThemeBackgroundColor(theme, backgroundColor);
    scene.clearColor = hexToColor4(bgColor);
    scene.ambientColor = new Color3(0.25, 0.25, 0.25); // Balanced ambient lighting

    // Create camera
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 3,
      5,
      Vector3.Zero(),
      scene,
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 0.5;
    camera.upperRadiusLimit = 8;
    camera.wheelPrecision = 50;
    camera.pinchPrecision = 50;
    cameraRef.current = camera;

    // Store camera ref for external control
    setCameraControlsRef(camera);

    // Create lights - balanced for realistic and visible colors
    const hemisphericLight = new HemisphericLight(
      "hemisphericLight",
      new Vector3(0, 1, 0),
      scene,
    );
    hemisphericLight.intensity = 0.9; // Balanced
    hemisphericLight.diffuse = new Color3(1, 1, 1);
    hemisphericLight.specular = new Color3(0.3, 0.3, 0.3);

    const directionalLight = new DirectionalLight(
      "directionalLight",
      new Vector3(-1, -2, -1),
      scene,
    );
    directionalLight.intensity = 1.0; // Balanced
    directionalLight.diffuse = new Color3(1, 1, 1);

    const directionalLight2 = new DirectionalLight(
      "directionalLight2",
      new Vector3(1, 1, 1),
      scene,
    );
    directionalLight2.intensity = 0.5; // Balanced
    directionalLight2.diffuse = new Color3(1, 1, 1);

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    console.log("✅ Babylon.js engine initialized");

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [setCameraControlsRef]);

  // Handle background color changes without recreating the scene
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const bgColor = getThemeBackgroundColor(theme, backgroundColor);
    sceneRef.current.clearColor = hexToColor4(bgColor);
  }, [theme, backgroundColor]);

  // Handle auto-rotation
  useEffect(() => {
    if (!cameraRef.current) return;
    
    if (autoRotate) {
      cameraRef.current.useAutoRotationBehavior = true;
      if (cameraRef.current.autoRotationBehavior) {
        cameraRef.current.autoRotationBehavior.idleRotationSpeed = 0.5;
      }
    } else {
      cameraRef.current.useAutoRotationBehavior = false;
    }
  }, [autoRotate]);

  // Apply materials when sections change OR when highlight changes
  useEffect(() => {
    if (!currentMeshRef.current || !sceneRef.current || sections.length === 0) {
      console.log("⚠️ Cannot apply materials:", {
        hasMesh: !!currentMeshRef.current,
        hasScene: !!sceneRef.current,
        sectionsCount: sections.length,
      });
      return;
    }

    console.log("🎨 Applying materials and highlights...", {
      sectionsCount: sections.length,
      highlightedId: highlightedSectionId,
      sampleSections: sections.slice(0, 3).map(s => ({
        id: s.id,
        name: s.name,
        originalName: s.originalName,
        color: s.color
      }))
    });
    
    // Apply materials first
    applyMaterialsToModel(currentMeshRef.current, sections, sceneRef.current);
    
    // Then apply highlight effect on top
    if (highlightedSectionId) {
      const scene = sceneRef.current;
      const rootMesh = currentMeshRef.current;
      
      // Get all meshes
      const meshes = rootMesh.getChildMeshes(false);
      meshes.push(rootMesh);

      // Create section map for quick lookup
      const sectionMap = new Map<string, typeof sections[0]>();
      sections.forEach((section) => {
        sectionMap.set(section.originalName, section);
        sectionMap.set(section.id, section);
        sectionMap.set(section.name, section);
      });

      // Apply highlight to the hovered section
      meshes.forEach((mesh) => {
        if (!(mesh instanceof Mesh)) return;

        const material = mesh.material as StandardMaterial;
        if (!material) return;

        // Find matching section
        let section = sectionMap.get(material.name) || sectionMap.get(mesh.name);
        
        if (!section) {
          for (const [, sectionData] of sectionMap.entries()) {
            if (sectionData.originalName === material.name || sectionData.originalName === mesh.name) {
              section = sectionData;
              break;
            }
          }
        }

        if (!section) {
          for (const [, sectionData] of sectionMap.entries()) {
            if (
              sectionData.combinedOriginalNames &&
              (sectionData.combinedOriginalNames.includes(material.name) ||
                sectionData.combinedOriginalNames.includes(mesh.name))
            ) {
              section = sectionData;
              break;
            }
          }
        }

        if (!section) return;

        // Apply highlight if this section is hovered
        if (highlightedSectionId === section.id) {
          // Add emissive glow for highlight
          material.emissiveColor = new Color3(0.3, 0.3, 0.3);
        }
      });
    }
    
    // Force scene to re-render
    if (sceneRef.current) {
      sceneRef.current.render();
    }
  }, [sections, highlightedSectionId]);

  // Load 3D model
  useEffect(() => {
    if (!currentModelUrl || !sceneRef.current || !cameraRef.current) return;

    console.log("📦 Loading model:", currentModelUrl);
    setModelLoading(true);
    setModelError(null);

    // Remove previous mesh
    if (currentMeshRef.current) {
      currentMeshRef.current.dispose();
      currentMeshRef.current = null;
    }

    // Load new model
    SceneLoader.ImportMesh(
      "",
      "",
      currentModelUrl,
      sceneRef.current,
      (meshes) => {
        console.log("✅ Model loaded, meshes:", meshes.length);

        if (meshes.length === 0) {
          setModelError("No meshes found in model");
          setModelLoading(false);
          return;
        }

        // Get root mesh
        const rootMesh = meshes[0];
        currentMeshRef.current = rootMesh;

        // Advanced centering and auto-sizing algorithm
        console.log("📐 Starting advanced model normalization...");
        
        // Step 1: Force update all mesh world matrices
        rootMesh.computeWorldMatrix(true);
        meshes.forEach((mesh) => {
          mesh.computeWorldMatrix(true);
        });

        // Step 2: Calculate accurate bounding box for ALL meshes
        let globalMin = new Vector3(Infinity, Infinity, Infinity);
        let globalMax = new Vector3(-Infinity, -Infinity, -Infinity);
        let validMeshCount = 0;
        
        meshes.forEach((mesh) => {
          if (mesh.getBoundingInfo) {
            try {
              const boundingInfo = mesh.getBoundingInfo();
              const meshMin = boundingInfo.boundingBox.minimumWorld;
              const meshMax = boundingInfo.boundingBox.maximumWorld;
              
              // Validate bounds (skip invalid meshes)
              if (isFinite(meshMin.x) && isFinite(meshMax.x)) {
                globalMin = Vector3.Minimize(globalMin, meshMin);
                globalMax = Vector3.Maximize(globalMax, meshMax);
                validMeshCount++;
              }
            } catch (e) {
              console.warn(`Could not get bounds for mesh: ${mesh.name}`);
            }
          }
        });

        console.log(`📊 Analyzed ${validMeshCount} valid meshes out of ${meshes.length}`);

        // Step 3: Calculate original dimensions
        const originalSize = globalMax.subtract(globalMin);
        const originalCenter = Vector3.Center(globalMin, globalMax);
        const maxDimension = Math.max(originalSize.x, originalSize.y, originalSize.z);
        const minDimension = Math.min(originalSize.x, originalSize.y, originalSize.z);
        const aspectRatio = maxDimension / (minDimension || 1);
        
        console.log("📐 Original model metrics:", {
          size: { 
            x: originalSize.x.toFixed(3), 
            y: originalSize.y.toFixed(3), 
            z: originalSize.z.toFixed(3) 
          },
          center: { 
            x: originalCenter.x.toFixed(3), 
            y: originalCenter.y.toFixed(3), 
            z: originalCenter.z.toFixed(3) 
          },
          maxDim: maxDimension.toFixed(3),
          minDim: minDimension.toFixed(3),
          aspectRatio: aspectRatio.toFixed(2)
        });
        
        // Step 4: Intelligent scaling based on model characteristics
        let targetSize: number;
        
        if (maxDimension < 0.1) {
          // Very small model - scale up significantly
          targetSize = 3.5;
          console.log("🔍 Detected very small model, using large target size");
        } else if (maxDimension < 1) {
          // Small model - scale up moderately
          targetSize = 3.2;
          console.log("📏 Detected small model, using moderate target size");
        } else if (maxDimension > 100) {
          // Very large model - scale down significantly
          targetSize = 2.5;
          console.log("🏔️ Detected very large model, using small target size");
        } else if (aspectRatio > 5) {
          // Elongated model - use smaller target to fit better
          targetSize = 2.8;
          console.log("📏 Detected elongated model, adjusting target size");
        } else {
          // Normal sized model
          targetSize = 3.0;
          console.log("✅ Normal model size detected");
        }
        
        // Step 5: Apply uniform scaling
        if (maxDimension > 0) {
          const scaleFactor = targetSize / maxDimension;
          rootMesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
          
          console.log("📏 Applied scale factor:", scaleFactor.toFixed(4));
          
          // Step 6: Recalculate bounds after scaling
          rootMesh.computeWorldMatrix(true);
          meshes.forEach((mesh) => {
            mesh.computeWorldMatrix(true);
          });
          
          // Recalculate global bounds
          globalMin = new Vector3(Infinity, Infinity, Infinity);
          globalMax = new Vector3(-Infinity, -Infinity, -Infinity);
          
          meshes.forEach((mesh) => {
            if (mesh.getBoundingInfo) {
              try {
                const boundingInfo = mesh.getBoundingInfo();
                const meshMin = boundingInfo.boundingBox.minimumWorld;
                const meshMax = boundingInfo.boundingBox.maximumWorld;
                
                if (isFinite(meshMin.x) && isFinite(meshMax.x)) {
                  globalMin = Vector3.Minimize(globalMin, meshMin);
                  globalMax = Vector3.Maximize(globalMax, meshMax);
                }
              } catch (e) {
                // Skip invalid meshes
              }
            }
          });
          
          // Step 7: Center the model perfectly at world origin
          const scaledCenter = Vector3.Center(globalMin, globalMax);
          rootMesh.position = scaledCenter.negate();
          
          console.log("🎯 Centered model at origin with offset:", {
            x: scaledCenter.x.toFixed(3),
            y: scaledCenter.y.toFixed(3),
            z: scaledCenter.z.toFixed(3)
          });
          
          // Step 8: Final world matrix update
          rootMesh.computeWorldMatrix(true);
          meshes.forEach((mesh) => {
            mesh.computeWorldMatrix(true);
          });
          
          // Step 9: Verify final position
          const finalSize = globalMax.subtract(globalMin);
          const finalMaxDim = Math.max(finalSize.x, finalSize.y, finalSize.z);
          console.log("✅ Final model size:", finalMaxDim.toFixed(3));
        }

        // Step 10: Calculate optimal camera distance with intelligent positioning
        const finalSize = globalMax.subtract(globalMin);
        const finalMaxDim = Math.max(finalSize.x, finalSize.y, finalSize.z);
        
        // Use field of view and model size to calculate perfect camera distance
        const fov = Math.PI / 3; // 60 degrees default
        const optimalDistance = (finalMaxDim / 2) / Math.tan(fov / 2) * 1.5;
        const optimalCameraDistance = Math.max(4, Math.min(optimalDistance, 12));
        
        console.log("📷 Optimal camera distance:", optimalCameraDistance.toFixed(2));

        // Entrance animation - zoom in with fade
        const finalScale = rootMesh.scaling.x; // Use the already calculated scale
        rootMesh.scaling = Vector3.Zero();
        rootMesh.visibility = 0;
        
        const animationDuration = 60; // frames
        let frame = 0;
        
        const animateEntrance = () => {
          if (!rootMesh || frame >= animationDuration) {
            if (rootMesh) {
              rootMesh.visibility = 1;
              rootMesh.scaling = new Vector3(finalScale, finalScale, finalScale);
            }
            return;
          }
          
          frame++;
          const progress = frame / animationDuration;
          const easeProgress = 1 - Math.pow(1 - progress, 3); // ease out cubic
          
          const scale = finalScale * easeProgress;
          rootMesh.scaling = new Vector3(scale, scale, scale);
          rootMesh.visibility = easeProgress;
          
          requestAnimationFrame(animateEntrance);
        };
        
        animateEntrance();

        // Reset camera to look at center with optimal distance
        if (cameraRef.current) {
          cameraRef.current.setTarget(Vector3.Zero());
          cameraRef.current.alpha = Math.PI / 2;
          cameraRef.current.beta = Math.PI / 3;
          cameraRef.current.radius = optimalCameraDistance;
          
          // Update camera limits based on model size
          cameraRef.current.lowerRadiusLimit = optimalCameraDistance * 0.3;
          cameraRef.current.upperRadiusLimit = optimalCameraDistance * 2.5;
        }

        // Extract material sections from the actual model
        const extractedSections = extractSectionsFromModel(rootMesh, currentModelUrl);
        
        console.log("📋 Extracted sections from model:", extractedSections.map(s => ({
          name: s.name,
          originalName: s.originalName,
          id: s.id,
        })));
        
        // Try to fetch precomputed sections from API
        fetch(`/api/materials?model=${encodeURIComponent(currentModelUrl)}`)
          .then((resp) => resp.json())
          .then((data) => {
            if (data?.sections && data.sections.length > 0) {
              console.log("📋 API returned sections:", data.sections.map((s: any) => ({
                name: s.name,
                originalName: s.originalName,
              })));
              
              // Map API sections to extracted sections by matching originalName
              const mappedSections = data.sections.map((apiSection: any) => {
                // Find matching extracted section
                const match = extractedSections.find(
                  (extracted) => 
                    extracted.originalName === apiSection.originalName ||
                    extracted.name === apiSection.originalName
                );
                
                if (match) {
                  console.log(`✓ Mapped "${apiSection.name}" to material "${match.originalName}"`);
                  // Use API section data but with extracted material ID
                  return {
                    ...apiSection,
                    id: match.id, // Use the actual material name as ID
                    originalName: match.originalName, // Use actual material name
                  };
                } else {
                  console.warn(`⚠️ No match found for API section "${apiSection.name}" (${apiSection.originalName})`);
                  return apiSection;
                }
              });
              
              console.log("📋 Using mapped sections from API");
              setSections(mappedSections);
            } else {
              console.log("📋 Using extracted sections (no API data)");
              setSections(extractedSections);
            }
          })
          .catch((err) => {
            console.log("📋 Using extracted sections (API failed):", err);
            setSections(extractedSections);
          });

        setModelLoading(false);
        console.log("🎨 Model ready with entrance animation");
      },
      (progress) => {
        // Progress callback
        if (progress.lengthComputable) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading: ${percent.toFixed(0)}%`);
        }
      },
      (scene, message, exception) => {
        console.error("❌ Model loading error:", { message, exception });
        const errorMsg = message || exception?.message || "Failed to load model";
        setModelError(errorMsg);
        setModelLoading(false);
      },
    );
  }, [currentModelUrl, setModelLoading, setModelError]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full outline-none"
        style={{ touchAction: "none" }}
      />
      
      {/* Render decals */}
      {sceneRef.current && currentMeshRef.current && (
        <BabylonDecals
          scene={sceneRef.current}
          rootMesh={currentMeshRef.current}
        />
      )}

      {modelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-6">
            <Spinner className="size-12 text-primary" />
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
