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
  DynamicTexture,
  PointerEventTypes,
  MeshBuilder,
  LinesMesh,
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
import { DecalPreviewIndicator } from "./decal-preview-indicator";

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
  const showBoundingBox = useConfiguratorStore((s) => s.showBoundingBox);
  const modelLoading = useConfiguratorStore((s) => s.modelLoading);
  const modelError = useConfiguratorStore((s) => s.modelError);
  const setModelLoading = useConfiguratorStore((s) => s.setModelLoading);
  const setModelError = useConfiguratorStore((s) => s.setModelError);
  const setCameraControlsRef = useConfiguratorStore(
    (s) => s.setCameraControlsRef,
  );
  const sections = useConfiguratorStore((s) => s.sections);
  const setSections = useConfiguratorStore((s) => s.setSections);
  const highlightedSectionId = useConfiguratorStore(
    (s) => s.highlightedSectionId,
  );
  const selectedSectionId = useConfiguratorStore((s) => s.selectedSectionId);
  const globalCustomTexture = useConfiguratorStore(
    (s) => s.globalCustomTexture,
  );
  const clearGlobalCustomTexture = useConfiguratorStore(
    (s) => s.setGlobalCustomTexture,
  );

  // Track applied global texture to dispose when replaced
  const appliedGlobalTextureRef = useRef<Texture | null>(null);
  
  // Track bounding box mesh
  const boundingBoxRef = useRef<Mesh | null>(null);

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
      -Math.PI / 2, // Alpha: rotated to show front of model
      Math.PI / 2.5, // Beta: vertical angle (eye-level view)
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

  // Handle bounding box visibility toggle
  useEffect(() => {
    if (boundingBoxRef.current) {
      boundingBoxRef.current.setEnabled(showBoundingBox);
      console.log(`📦 Bounding box ${showBoundingBox ? 'shown' : 'hidden'}`);
    }
  }, [showBoundingBox]);

  // Apply materials when sections or global texture change
  useEffect(() => {
    if (!currentMeshRef.current || !sceneRef.current || sections.length === 0) {
      console.log("⚠️ Cannot apply materials:", {
        hasMesh: !!currentMeshRef.current,
        hasScene: !!sceneRef.current,
        sectionsCount: sections.length,
      });
      return;
    }

    console.log(`🔄 Babylon Scene: Sections changed, count=${sections.length}`);

    const sectionsWithTextures = sections.filter((s) => s.customTexture);
    console.log(
      `🖼️ Babylon Scene: ${sectionsWithTextures.length} sections have custom textures`,
    );

    const scene = sceneRef.current;
    const rootMesh = currentMeshRef.current;

    try {
      // Get all meshes
      const meshes = rootMesh.getChildMeshes(false);
      meshes.push(rootMesh);

      // Build material map by original name
      const materialsByOriginalName = new Map<string, StandardMaterial | any>();
      meshes.forEach((mesh) => {
        if (!(mesh instanceof Mesh)) return;
        const material = mesh.material as any;
        if (material && material.name) {
          materialsByOriginalName.set(material.name, material);
        }
      });

      console.log(
        `🎭 Babylon Scene: Found ${materialsByOriginalName.size} materials in scene`,
      );
      console.log(
        `   Material names:`,
        Array.from(materialsByOriginalName.keys()),
      );
      console.log(
        `   Section originalNames:`,
        sections.map((s) => s.originalName),
      );
      console.log(
        `   Section ids:`,
        sections.map((s) => s.id),
      );

      // Apply global texture first if present
      const globalTexture = globalCustomTexture;
      if (globalTexture) {
        console.log("🌍 Applying GLOBAL texture to all materials");
        const tex = new Texture(
          globalTexture,
          scene,
          false,
          true,
          Texture.TRILINEAR_SAMPLINGMODE,
        );
        tex.hasAlpha = true;

        materialsByOriginalName.forEach((material) => {
          // Dispose previous base textures if any
          if (material.albedoTexture) {
            try {
              material.albedoTexture.dispose();
            } catch {}
            material.albedoTexture = null;
          }
          if (material.diffuseTexture) {
            try {
              material.diffuseTexture.dispose();
            } catch {}
            material.diffuseTexture = null;
          }
          if (material.albedoColor !== undefined) {
            material.albedoTexture = tex;
            material.albedoColor = new Color3(1, 1, 1);
            // For full-surface textures, ignore alpha for transparency to avoid holes
            material.useAlphaFromAlbedoTexture = false;
          } else {
            material.diffuseTexture = tex;
            material.diffuseColor = new Color3(1, 1, 1);
          }
          material.emissiveColor = new Color3(0, 0, 0);
          material.markDirty();
        });

        // Force renders and early return to avoid per-section overrides
        scene.render();
        requestAnimationFrame(() => scene.render());
        setTimeout(() => scene.render(), 10);
        setTimeout(() => scene.render(), 50);
        return;
      }

      // Apply material properties from sections to actual Babylon materials when no global texture
      let appliedCount = 0;
      let notFoundCount = 0;

      sections.forEach((section) => {
        // Try to find material by originalName
        let material = materialsByOriginalName.get(section.originalName);

        // If not found, try by id
        if (!material) {
          material = materialsByOriginalName.get(section.id);
        }

        // If still not found, try partial matching
        if (!material) {
          const originalNameLower = section.originalName.toLowerCase();
          for (const [matName, mat] of materialsByOriginalName.entries()) {
            if (
              matName.toLowerCase().includes(originalNameLower) ||
              originalNameLower.includes(matName.toLowerCase())
            ) {
              material = mat;
              console.log(
                `✓ Found material via partial match: "${matName}" for section "${section.originalName}"`,
              );
              break;
            }
          }
        }

        if (!material) {
          console.warn(
            `⚠️ Babylon Scene: No material found for section "${section.name}" (originalName: "${section.originalName}", id: "${section.id}")`,
          );
          console.warn(
            `   Available materials:`,
            Array.from(materialsByOriginalName.keys()).slice(0, 5),
          );
          notFoundCount++;
          return;
        }

        appliedCount++;

        // Remove highlight behavior: always use neutral emissive
        material.emissiveColor = new Color3(0, 0, 0);

        // Apply color if no custom texture or gradient is enabled
        if (
          section.color &&
          !section.customTexture &&
          !section.gradient?.enabled
        ) {
          // Remove any existing base texture first
          if (material.albedoTexture) {
            try {
              material.albedoTexture.dispose();
            } catch {}
            material.albedoTexture = null;
          }
          if (material.diffuseTexture) {
            try {
              material.diffuseTexture.dispose();
            } catch {}
            material.diffuseTexture = null;
          }

          const color = hexToColor3(section.color);
          if (material.albedoColor !== undefined) {
            // PBR
            material.albedoColor = new Color3(color.r, color.g, color.b);
            material.alpha = 1.0;
          } else {
            // Standard
            material.diffuseColor = new Color3(color.r, color.g, color.b);
            material.alpha = 1.0;
            material.backFaceCulling = true;
          }
          console.log(
            `🎨 Applied color ${section.color} to material ${section.originalName}`,
          );
        }

        // Apply gradient if enabled
        if (section.gradient?.enabled && !section.customTexture) {
          // Dispose old texture if exists
          if (material.albedoTexture) {
            try {
              material.albedoTexture.dispose();
            } catch {}
            material.albedoTexture = null;
          }
          if (material.diffuseTexture) {
            try {
              material.diffuseTexture.dispose();
            } catch {}
            material.diffuseTexture = null;
          }

          // Create gradient texture
          const size = 512;
          const dynamicTexture = new DynamicTexture(
            `gradient_${section.id}`,
            { width: size, height: size },
            scene,
            false,
          );

          const ctx = dynamicTexture.getContext();
          let gradientObj: CanvasGradient;

          if (section.gradient.type === "radial") {
            gradientObj = ctx.createRadialGradient(
              size / 2,
              size / 2,
              0,
              size / 2,
              size / 2,
              size / 2,
            );
          } else {
            // Linear gradient
            const angle = (section.gradient.angle || 90) * (Math.PI / 180);
            const x1 = size / 2 - (Math.cos(angle) * size) / 2;
            const y1 = size / 2 - (Math.sin(angle) * size) / 2;
            const x2 = size / 2 + (Math.cos(angle) * size) / 2;
            const y2 = size / 2 + (Math.sin(angle) * size) / 2;
            gradientObj = ctx.createLinearGradient(x1, y1, x2, y2);
          }

          const stops =
            section.gradient.stops ||
            section.gradient.colors.map(
              (_, i) => i / (section.gradient!.colors.length - 1),
            );

          section.gradient.colors.forEach((color, i) => {
            gradientObj.addColorStop(
              stops[i] || i / (section.gradient!.colors.length - 1),
              color,
            );
          });

          ctx.fillStyle = gradientObj;
          ctx.fillRect(0, 0, size, size);
          dynamicTexture.update();

          if (material.albedoColor !== undefined) {
            material.albedoTexture = dynamicTexture;
            material.albedoColor = new Color3(1, 1, 1);
          } else {
            material.diffuseTexture = dynamicTexture;
            material.diffuseColor = new Color3(1, 1, 1);
          }
          console.log(
            `🌈 Applied gradient to material ${section.originalName}`,
          );
        }

        // Apply custom texture if available
        if (section.customTexture) {
          // Dispose old texture if exists
          if (material.albedoTexture) {
            try {
              material.albedoTexture.dispose();
            } catch {}
            material.albedoTexture = null;
          }
          if (material.diffuseTexture) {
            try {
              material.diffuseTexture.dispose();
            } catch {}
            material.diffuseTexture = null;
          }

          const texture = new Texture(
            section.customTexture,
            scene,
            false,
            true,
            Texture.TRILINEAR_SAMPLINGMODE,
            () => {
              console.log(`✅ Custom texture loaded for ${section.name}`);
            },
            (message) => {
              console.error(
                `❌ Failed to load texture for ${section.name}:`,
                message,
              );
            },
          );

          texture.hasAlpha = true;
          if (material.albedoColor !== undefined) {
            material.albedoTexture = texture;
            material.albedoColor = new Color3(1, 1, 1);
            material.useAlphaFromAlbedoTexture = true;
          } else {
            material.diffuseTexture = texture;
            material.diffuseColor = new Color3(1, 1, 1);
          }
          console.log(
            `🖼️ Applied custom texture to material ${section.originalName}`,
          );
        }

        // Apply other material properties
        if (material.albedoColor !== undefined) {
          // PBR
          if (section.roughness !== undefined)
            material.roughness = section.roughness;
          if (section.metalness !== undefined)
            material.metallic = section.metalness;
        } else {
          // Standard
          if (section.roughness !== undefined) {
            material.specularPower = (1 - section.roughness) * 128;
          }
          if (section.metalness !== undefined) {
            material.specularColor = new Color3(
              section.metalness,
              section.metalness,
              section.metalness,
            );
          }
        }
        if (section.wireframe !== undefined) {
          material.wireframe = section.wireframe;
        }

        // Mark material as needing update
        material.markDirty();
      });

      console.log(
        `✅ Material update complete: ${appliedCount} applied, ${notFoundCount} not found`,
      );

      // Force scene to re-render multiple times
      scene.render();
      requestAnimationFrame(() => scene.render());
      setTimeout(() => scene.render(), 10);
      setTimeout(() => scene.render(), 50);
    } catch (e) {
      console.error("❌ Babylon Scene: Material update error:", e);
    }
  }, [sections, highlightedSectionId, selectedSectionId, globalCustomTexture]);

  // Dedicated effect to apply ONLY the global texture (simpler trigger path)
  useEffect(() => {
    if (!globalCustomTexture) return;
    if (!sceneRef.current || !currentMeshRef.current) return;
    const scene = sceneRef.current;
    const rootMesh = currentMeshRef.current;
    console.log("🌍 Global texture effect triggered");

    try {
      // Dispose previous global texture
      if (appliedGlobalTextureRef.current) {
        try {
          appliedGlobalTextureRef.current.dispose();
        } catch {}
        appliedGlobalTextureRef.current = null;
      }

      const tex = new Texture(
        globalCustomTexture,
        scene,
        true, // generate mipmaps for smoother scaling
        false, // do not invert Y for data URL
        Texture.TRILINEAR_SAMPLINGMODE,
        () => console.log("✅ Global overlay texture loaded"),
        (msg) => console.error("❌ Global overlay texture load failed", msg),
      );
      // Keep alpha so transparent areas reveal base garment
      tex.hasAlpha = true;
      appliedGlobalTextureRef.current = tex;

      const meshes = rootMesh.getChildMeshes(false);
      meshes.push(rootMesh);
      let applied = 0;
      meshes.forEach((m) => {
        const material: any = m.material;
        if (!material) return;
        // Apply as emissive overlay; preserve base colors & textures
        material.emissiveTexture = tex;
        material.emissiveColor = new Color3(1, 1, 1); // ensure overlay visible
        // For PBR, avoid altering albedoColor; for Standard, leave diffuseColor
        material.markDirty();
        applied++;
      });
      console.log(
        `🌍 Global overlay texture applied (emissive) to ${applied} meshes`,
      );
      scene.render();
      requestAnimationFrame(() => scene.render());
    } catch (e) {
      console.error("❌ Error applying global texture", e);
    }
  }, [globalCustomTexture]);

  // Click-to-place decals in Babylon scene when a lastDecalTexture exists
  const addDecal = useConfiguratorStore((s) => s.addDecal);
  const lastDecalTexture = useConfiguratorStore((s) => s.lastDecalTexture);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);
  const decalPlacementAngle = useConfiguratorStore((s) => s.decalPlacementAngle);
  const decalPlacementSize = useConfiguratorStore((s) => s.decalPlacementSize);

  const ensureOutwardNormal = (
    sourceNormal: Vector3,
    targetMesh: AbstractMesh | null,
    surfacePoint: Vector3,
  ) => {
    let adjustedNormal = sourceNormal.clone();

    if (targetMesh?.getBoundingInfo()) {
      const center =
        targetMesh.getBoundingInfo().boundingSphere.centerWorld ?? null;
      if (center) {
        const centerToPoint = surfacePoint.subtract(center);
        if (centerToPoint.lengthSquared() > 0) {
          const dot = Vector3.Dot(adjustedNormal, centerToPoint);
          if (dot < 0) {
            adjustedNormal = adjustedNormal.negate();
          }
        }
      }
    }

    return adjustedNormal.normalize();
  };
  useEffect(() => {
    if (!sceneRef.current || !currentMeshRef.current) return;
    const scene = sceneRef.current;
    const rootMesh = currentMeshRef.current;
    
    // Get valid target meshes (same as preview)
    const validMeshes = rootMesh.getChildMeshes(false).filter(
      (m) => m instanceof Mesh && m.getTotalVertices() > 0
    ) as Mesh[];
    validMeshes.push(rootMesh as Mesh);
    
    const observer = scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERDOWN) return;
      if (!lastDecalTexture) return;
      
      // Pick using same filter as preview
      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => {
          return validMeshes.includes(mesh as Mesh) && 
                 !mesh.name?.startsWith("decal_") && 
                 mesh.name !== "decalPreview";
        }
      );
      
      if (!pick?.hit || !pick.pickedPoint || !pick.pickedMesh) return;
      
      let normal = pick.getNormal(true);
      if (!normal) return; // Don't create decal if we can't get normal
      
      normal = ensureOutwardNormal(normal, pick.pickedMesh, pick.pickedPoint);
      
      // Offset position slightly along the outward normal so decal sits on surface
      const pos = pick.pickedPoint.add(normal.scale(0.003));

      // Use separate depth value so decal does not project through garment
      const decalDepth = Math.max(0.01, decalPlacementSize * 0.12);
      const scale = new Vector3(
        decalPlacementSize,
        decalPlacementSize,
        decalDepth,
      );
      
      console.log('🎯 Creating decal with normal:', normal, 'at position:', pos);
      
      addDecal({
        id: `decal-${Date.now()}`,
        textureUrl: lastDecalTexture,
        meshUuid: String((pick.pickedMesh as any).uniqueId ?? ""),
        position: { x: pos.x, y: pos.y, z: pos.z },
        normal: { x: normal.x, y: normal.y, z: normal.z },
        rotation: { x: 0, y: 0, z: decalPlacementAngle },
        scale: { x: scale.x, y: scale.y, z: scale.z },
      });
    });
    return () => {
      if (observer) scene.onPointerObservable.remove(observer);
    };
  }, [lastDecalTexture, addDecal, decalPlacementAngle, decalPlacementSize]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const observer = scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERDOWN) return;
      if (lastDecalTexture) return;
      const pick = scene.pick(scene.pointerX, scene.pointerY);
      if (pick?.hit && pick.pickedMesh?.name?.startsWith("decal_")) {
        return;
      }
      setSelectedDecal(null);
    });
    return () => {
      if (observer) scene.onPointerObservable.remove(observer);
    };
  }, [lastDecalTexture, setSelectedDecal]);

  // Optional: expose clear function for future UI
  const clearGlobalTexture = () => {
    if (appliedGlobalTextureRef.current) {
      try {
        appliedGlobalTextureRef.current.dispose();
      } catch {}
      appliedGlobalTextureRef.current = null;
    }
    clearGlobalCustomTexture(null);
    console.log("🧹 Cleared global texture");
  };

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

        // ═══════════════════════════════════════════════════════════════
        // ADVANCED AUTO-CENTER & AUTO-SIZE ALGORITHM
        // ═══════════════════════════════════════════════════════════════
        console.log("🚀 Starting advanced model normalization...");

        // ───────────────────────────────────────────────────────────────
        // STEP 1: Precise Bounding Box Calculation (Tight Fit)
        // ───────────────────────────────────────────────────────────────
        const calculatePreciseBounds = () => {
          let min = new Vector3(Infinity, Infinity, Infinity);
          let max = new Vector3(-Infinity, -Infinity, -Infinity);
          let validMeshCount = 0;
          
          meshes.forEach((mesh) => {
            // Skip invisible or non-renderable meshes
            if (!mesh.isVisible || !mesh.isEnabled()) {
              return;
            }
            
            mesh.computeWorldMatrix(true);
            
            // Use getTotalVertices to check if mesh has geometry
            if (mesh instanceof Mesh && mesh.getTotalVertices() === 0) {
              return;
            }
            
            if (mesh.getBoundingInfo) {
              try {
                const boundingInfo = mesh.getBoundingInfo();
                const meshMin = boundingInfo.boundingBox.minimumWorld;
                const meshMax = boundingInfo.boundingBox.maximumWorld;
                
                // Validate bounds are finite and not zero-sized
                const size = meshMax.subtract(meshMin);
                if (isFinite(meshMin.x) && isFinite(meshMax.x) &&
                    isFinite(meshMin.y) && isFinite(meshMax.y) &&
                    isFinite(meshMin.z) && isFinite(meshMax.z) &&
                    size.length() > 0.0001) { // Ignore tiny/empty meshes
                  min = Vector3.Minimize(min, meshMin);
                  max = Vector3.Maximize(max, meshMax);
                  validMeshCount++;
                }
              } catch (e) {
                console.warn(`⚠️ Skipping mesh ${mesh.name}:`, e);
              }
            }
          });
          
          const size = max.subtract(min);
          const center = Vector3.Center(min, max);
          const dimensions = {
            x: size.x,
            y: size.y,
            z: size.z,
            max: Math.max(size.x, size.y, size.z),
            min: Math.min(size.x, size.y, size.z),
            avg: (size.x + size.y + size.z) / 3
          };
          
          return { min, max, size, center, dimensions, validMeshCount };
        };

        // ───────────────────────────────────────────────────────────────
        // STEP 2: Analyze Original Model Characteristics
        // ───────────────────────────────────────────────────────────────
        const original = calculatePreciseBounds();
        
        console.log(`📊 Analyzed ${original.validMeshCount}/${meshes.length} meshes`);
        
        // Log individual mesh bounds for debugging
        console.log("🔍 Mesh details:");
        meshes.forEach((mesh, i) => {
          if (mesh.getBoundingInfo && mesh.isVisible && mesh.isEnabled()) {
            const bounds = mesh.getBoundingInfo().boundingBox;
            const meshSize = bounds.maximumWorld.subtract(bounds.minimumWorld);
            console.log(`  [${i}] ${mesh.name}: ${meshSize.x.toFixed(3)} × ${meshSize.y.toFixed(3)} × ${meshSize.z.toFixed(3)}`);
          }
        });
        
        console.log("📐 Original dimensions:", {
          size: `${original.dimensions.x.toFixed(3)} × ${original.dimensions.y.toFixed(3)} × ${original.dimensions.z.toFixed(3)}`,
          center: `(${original.center.x.toFixed(3)}, ${original.center.y.toFixed(3)}, ${original.center.z.toFixed(3)})`,
          maxDim: original.dimensions.max.toFixed(3),
          aspectRatio: (original.dimensions.max / original.dimensions.min).toFixed(2)
        });

        // ───────────────────────────────────────────────────────────────
        // STEP 3: FULLY AUTOMATIC Advanced Size Calculation Algorithm
        // ───────────────────────────────────────────────────────────────
        const aspectRatio = original.dimensions.max / (original.dimensions.min || 1);
        const volume = original.dimensions.x * original.dimensions.y * original.dimensions.z;
        const normalizedVolume = volume / Math.pow(original.dimensions.max, 3);
        
        // Calculate surface area to volume ratio (indicates complexity)
        const surfaceArea = 2 * (original.dimensions.x * original.dimensions.y + 
                                  original.dimensions.y * original.dimensions.z + 
                                  original.dimensions.z * original.dimensions.x);
        const saToVolRatio = surfaceArea / (volume || 1);
        
        // ═══════════════════════════════════════════════════════════════
        // ADVANCED AUTOMATIC TARGET SIZE CALCULATION
        // ═══════════════════════════════════════════════════════════════
        
        // Get viewport dimensions for viewport-aware sizing
        const canvas = canvasRef.current;
        const viewportWidth = canvas?.clientWidth || 1920;
        const viewportHeight = canvas?.clientHeight || 1080;
        const viewportAspect = viewportWidth / viewportHeight;
        const viewportDiagonal = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
        
        console.log(`📺 Viewport: ${viewportWidth}×${viewportHeight} (aspect: ${viewportAspect.toFixed(2)})`);
        
        // Calculate model's visual footprint (how much screen space it should occupy)
        const modelAspect = original.dimensions.x / original.dimensions.y;
        const aspectDifference = Math.abs(modelAspect - viewportAspect);
        
        // Base target using advanced logarithmic + exponential hybrid scaling
        const logSize = Math.log10(original.dimensions.max + 0.001);
        const expFactor = Math.exp(-logSize * 0.5); // Exponential decay for large models
        
        let targetSize: number;
        
        // Multi-tier adaptive sizing with smooth transitions
        if (logSize < -3) {
          // Ultra-microscopic (< 0.001)
          targetSize = 4.5 + expFactor * 0.5;
        } else if (logSize < -2) {
          // Microscopic (0.001 - 0.01)
          targetSize = 4.2 + expFactor * 0.4;
        } else if (logSize < -1) {
          // Tiny (0.01 - 0.1)
          targetSize = 4.0 + expFactor * 0.3;
        } else if (logSize < 0) {
          // Small (0.1 - 1)
          targetSize = 3.8 - logSize * 0.4;
        } else if (logSize < 1) {
          // Medium (1 - 10)
          targetSize = 3.5 - logSize * 0.35;
        } else if (logSize < 2) {
          // Large (10 - 100)
          targetSize = 3.2 - logSize * 0.3;
        } else if (logSize < 3) {
          // Very large (100 - 1000)
          targetSize = 2.9 - (logSize - 2) * 0.25;
        } else {
          // Massive (> 1000)
          targetSize = 2.6 - (logSize - 3) * 0.2;
        }
        
        // Viewport-aware adjustment
        const viewportScale = Math.min(viewportWidth, viewportHeight) / 1000; // Normalize to 1000px
        targetSize *= (0.8 + viewportScale * 0.4); // Scale based on viewport size
        
        // Ensure reasonable range with tighter bounds
        targetSize = Math.max(2.0, Math.min(targetSize, 5.0));
        
        console.log(`📊 Base target: ${targetSize.toFixed(2)} (log: ${logSize.toFixed(2)}, exp: ${expFactor.toFixed(3)})`);
        
        // ═══════════════════════════════════════════════════════════════
        // ADVANCED ASPECT RATIO COMPENSATION WITH VIEWPORT AWARENESS
        // ═══════════════════════════════════════════════════════════════
        
        // Calculate aspect ratio in all three planes
        const aspectXY = original.dimensions.x / original.dimensions.y;
        const aspectYZ = original.dimensions.y / original.dimensions.z;
        const aspectXZ = original.dimensions.x / original.dimensions.z;
        const avgAspect = (aspectXY + aspectYZ + aspectXZ) / 3;
        
        // Use sigmoid function for smooth aspect ratio compensation
        const aspectSigmoid = (ratio: number) => {
          const normalized = (ratio - 1) / 10; // Normalize around 1
          return 1 / (1 + Math.exp(-normalized * 2));
        };
        
        let aspectMultiplier = 1.0;
        
        // Extreme elongation (needle-like objects)
        if (aspectRatio > 50) {
          aspectMultiplier = 0.55 + aspectSigmoid(aspectRatio) * 0.1;
        } else if (aspectRatio > 20) {
          aspectMultiplier = 0.65 + aspectSigmoid(aspectRatio) * 0.05;
        } else if (aspectRatio > 10) {
          aspectMultiplier = 0.72 + aspectSigmoid(aspectRatio) * 0.03;
        } else if (aspectRatio > 5) {
          aspectMultiplier = 0.82 + aspectSigmoid(aspectRatio) * 0.03;
        } else if (aspectRatio > 3) {
          aspectMultiplier = 0.90 + aspectSigmoid(aspectRatio) * 0.02;
        } else if (aspectRatio > 2) {
          aspectMultiplier = 0.96 + aspectSigmoid(aspectRatio) * 0.02;
        } else if (aspectRatio < 1.15) {
          // Nearly perfect cube/sphere
          aspectMultiplier = 1.08;
        } else if (aspectRatio < 1.3) {
          aspectMultiplier = 1.04;
        } else if (aspectRatio < 1.5) {
          aspectMultiplier = 1.02;
        }
        
        // Viewport aspect compensation
        if (aspectDifference > 1) {
          aspectMultiplier *= 0.95; // Model aspect very different from viewport
        }
        
        targetSize *= aspectMultiplier;
        console.log(`📐 Aspect ${aspectRatio.toFixed(2)} (avg: ${avgAspect.toFixed(2)}) → ×${aspectMultiplier.toFixed(3)}`);
        
        // ═══════════════════════════════════════════════════════════════
        // ADVANCED VOLUME DENSITY & SHAPE ANALYSIS
        // ═══════════════════════════════════════════════════════════════
        
        // Calculate shape factor (sphere = 1, other shapes < 1)
        const sphereVolume = (4/3) * Math.PI * Math.pow(original.dimensions.max / 2, 3);
        const shapeFactor = volume / sphereVolume;
        
        // Calculate compactness (how close to a sphere)
        const compactness = Math.pow(36 * Math.PI * volume * volume, 1/3) / surfaceArea;
        
        let volumeMultiplier = 1.0;
        
        // Ultra-thin objects (paper-like)
        if (normalizedVolume < 0.01) {
          volumeMultiplier = 1.25;
        } else if (normalizedVolume < 0.05) {
          volumeMultiplier = 1.18; // Extremely flat/thin
        } else if (normalizedVolume < 0.1) {
          volumeMultiplier = 1.12; // Very flat
        } else if (normalizedVolume < 0.15) {
          volumeMultiplier = 1.08; // Flat
        } else if (normalizedVolume < 0.25) {
          volumeMultiplier = 1.04; // Somewhat flat
        } else if (normalizedVolume < 0.35) {
          volumeMultiplier = 1.02; // Slightly flat
        } else if (normalizedVolume > 0.8) {
          volumeMultiplier = 0.96; // Very bulky/solid
        } else if (normalizedVolume > 0.7) {
          volumeMultiplier = 0.98; // Bulky
        }
        
        // Shape factor adjustment
        if (shapeFactor < 0.1) {
          volumeMultiplier *= 1.08; // Very irregular shape
        } else if (shapeFactor > 0.8) {
          volumeMultiplier *= 0.96; // Nearly spherical
        }
        
        // Compactness adjustment
        if (compactness < 0.3) {
          volumeMultiplier *= 1.05; // Very spread out
        }
        
        targetSize *= volumeMultiplier;
        console.log(`📦 Volume: ${normalizedVolume.toFixed(3)}, Shape: ${shapeFactor.toFixed(3)}, Compact: ${compactness.toFixed(3)} → ×${volumeMultiplier.toFixed(3)}`);
        
        // ═══════════════════════════════════════════════════════════════
        // ADVANCED COMPLEXITY & DETAIL ANALYSIS
        // ═══════════════════════════════════════════════════════════════
        
        // Count total vertices for detail level
        let totalVertices = 0;
        let totalFaces = 0;
        meshes.forEach((mesh) => {
          if (mesh instanceof Mesh) {
            totalVertices += mesh.getTotalVertices();
            totalFaces += mesh.getTotalIndices() / 3;
          }
        });
        
        // Calculate detail density (vertices per unit volume)
        const detailDensity = totalVertices / (volume || 1);
        const faceToVertexRatio = totalFaces / (totalVertices || 1);
        
        let complexityMultiplier = 1.0;
        
        // Surface area to volume ratio (complexity indicator)
        if (saToVolRatio > 200) {
          complexityMultiplier = 1.12; // Extremely complex
        } else if (saToVolRatio > 100) {
          complexityMultiplier = 1.08; // Very complex
        } else if (saToVolRatio > 50) {
          complexityMultiplier = 1.05; // Complex
        } else if (saToVolRatio > 25) {
          complexityMultiplier = 1.03; // Moderately complex
        } else if (saToVolRatio < 5) {
          complexityMultiplier = 0.97; // Very simple
        }
        
        // Detail density adjustment
        if (detailDensity > 10000) {
          complexityMultiplier *= 1.06; // High detail model
        } else if (detailDensity > 5000) {
          complexityMultiplier *= 1.03;
        } else if (detailDensity < 100) {
          complexityMultiplier *= 0.98; // Low poly model
        }
        
        // Mesh count consideration
        if (original.validMeshCount > 50) {
          complexityMultiplier *= 1.04; // Many parts
        } else if (original.validMeshCount > 20) {
          complexityMultiplier *= 1.02;
        }
        
        targetSize *= complexityMultiplier;
        console.log(`🔬 SA/V: ${saToVolRatio.toFixed(1)}, Verts: ${totalVertices}, Faces: ${totalFaces}, Density: ${detailDensity.toFixed(1)} → ×${complexityMultiplier.toFixed(3)}`);
        
        // ═══════════════════════════════════════════════════════════════
        // ADVANCED DIMENSIONAL BALANCE & ORIENTATION ANALYSIS
        // ═══════════════════════════════════════════════════════════════
        
        // Calculate all dimensional ratios
        const dimRatios = [
          original.dimensions.x / original.dimensions.y,
          original.dimensions.y / original.dimensions.z,
          original.dimensions.z / original.dimensions.x
        ];
        const maxDimRatio = Math.max(...dimRatios);
        const minDimRatio = Math.min(...dimRatios);
        
        // Calculate dimensional variance (how unbalanced the dimensions are)
        const dimArray = [original.dimensions.x, original.dimensions.y, original.dimensions.z];
        const dimMean = dimArray.reduce((a, b) => a + b) / 3;
        const dimVariance = dimArray.reduce((sum, dim) => sum + Math.pow(dim - dimMean, 2), 0) / 3;
        const dimStdDev = Math.sqrt(dimVariance);
        const coefficientOfVariation = dimStdDev / dimMean;
        
        let dimensionalMultiplier = 1.0;
        
        // Extreme imbalance (stick-like or blade-like)
        if (maxDimRatio > 50) {
          dimensionalMultiplier = 1.10;
        } else if (maxDimRatio > 20) {
          dimensionalMultiplier = 1.07;
        } else if (maxDimRatio > 10) {
          dimensionalMultiplier = 1.05;
        } else if (maxDimRatio > 5) {
          dimensionalMultiplier = 1.03;
        } else if (maxDimRatio > 3) {
          dimensionalMultiplier = 1.01;
        }
        
        // Coefficient of variation adjustment
        if (coefficientOfVariation > 0.8) {
          dimensionalMultiplier *= 1.04; // Very unbalanced
        } else if (coefficientOfVariation < 0.2) {
          dimensionalMultiplier *= 0.98; // Very balanced (cube-like)
        }
        
        targetSize *= dimensionalMultiplier;
        console.log(`📏 Dim ratios: ${maxDimRatio.toFixed(2)}:1, CoV: ${coefficientOfVariation.toFixed(3)} → ×${dimensionalMultiplier.toFixed(3)}`);
        
        // ═══════════════════════════════════════════════════════════════
        // FINAL TARGET SIZE WITH ADAPTIVE CLAMPING
        // ═══════════════════════════════════════════════════════════════
        
        // Adaptive min/max based on original size
        let minTarget = 1.8;
        let maxTarget = 4.5;
        
        if (original.dimensions.max < 0.1) {
          minTarget = 2.5; // Tiny models need minimum size
          maxTarget = 5.0;
        } else if (original.dimensions.max > 100) {
          minTarget = 1.5; // Huge models can be smaller
          maxTarget = 3.5;
        }
        
        targetSize = Math.max(minTarget, Math.min(targetSize, maxTarget));
        
        // Generate automatic category description
        let sizeCategory = "";
        if (original.dimensions.max < 0.01) sizeCategory = "Microscopic";
        else if (original.dimensions.max < 0.1) sizeCategory = "Tiny";
        else if (original.dimensions.max < 1) sizeCategory = "Small";
        else if (original.dimensions.max < 10) sizeCategory = "Medium";
        else if (original.dimensions.max < 100) sizeCategory = "Large";
        else sizeCategory = "Massive";
        
        if (aspectRatio > 5) sizeCategory += " Elongated";
        else if (aspectRatio < 1.5) sizeCategory += " Compact";
        
        if (normalizedVolume < 0.1) sizeCategory += " Flat";
        else if (normalizedVolume > 0.7) sizeCategory += " Solid";
        
        // ═══════════════════════════════════════════════════════════════
        // FINAL OPTIMIZATION PASS
        // ═══════════════════════════════════════════════════════════════
        
        // Apply viewport-based final adjustment
        const viewportFactor = Math.min(1.2, Math.max(0.8, viewportDiagonal / 2000));
        targetSize *= viewportFactor;
        
        // Ensure model fits comfortably in viewport
        const estimatedScreenSize = targetSize * 100; // Rough pixel estimate
        if (estimatedScreenSize > Math.min(viewportWidth, viewportHeight) * 0.9) {
          const correction = (Math.min(viewportWidth, viewportHeight) * 0.8) / estimatedScreenSize;
          targetSize *= correction;
          console.log(`⚠️ Viewport overflow correction: ×${correction.toFixed(3)}`);
        }
        
        console.log(`🎯 Auto-classified: ${sizeCategory}`);
        console.log(`✨ FINAL TARGET SIZE: ${targetSize.toFixed(3)} units (viewport factor: ${viewportFactor.toFixed(3)})`);

        // ───────────────────────────────────────────────────────────────
        // STEP 4: Apply Uniform Scaling
        // ───────────────────────────────────────────────────────────────
        const scaleFactor = targetSize / original.dimensions.max;
        rootMesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
        
        console.log(`🔧 Applied scale factor: ${scaleFactor.toFixed(6)}`);

        // Force update after scaling
        rootMesh.computeWorldMatrix(true);
        meshes.forEach(m => m.computeWorldMatrix(true));

        // ───────────────────────────────────────────────────────────────
        // STEP 5: Precise Centering at World Origin
        // ───────────────────────────────────────────────────────────────
        const scaled = calculatePreciseBounds();
        
        console.log("📊 Before centering:", {
          center: `(${scaled.center.x.toFixed(4)}, ${scaled.center.y.toFixed(4)}, ${scaled.center.z.toFixed(4)})`,
          size: `${scaled.size.x.toFixed(3)} × ${scaled.size.y.toFixed(3)} × ${scaled.size.z.toFixed(3)}`
        });
        
        // Calculate offset needed to center at (0, 0, 0)
        const centerOffset = scaled.center.negate();
        rootMesh.position = centerOffset;
        
        console.log("🎯 Centering offset applied:", {
          x: centerOffset.x.toFixed(4),
          y: centerOffset.y.toFixed(4),
          z: centerOffset.z.toFixed(4)
        });

        // Force final update after positioning
        rootMesh.computeWorldMatrix(true);
        meshes.forEach(m => m.computeWorldMatrix(true));

        // ───────────────────────────────────────────────────────────────
        // STEP 6: Verification & Final Measurements
        // ───────────────────────────────────────────────────────────────
        const final = calculatePreciseBounds();
        
        console.log("✅ Final model state:", {
          size: `${final.dimensions.x.toFixed(3)} × ${final.dimensions.y.toFixed(3)} × ${final.dimensions.z.toFixed(3)}`,
          center: `(${final.center.x.toFixed(4)}, ${final.center.y.toFixed(4)}, ${final.center.z.toFixed(4)})`,
          maxDim: final.dimensions.max.toFixed(3),
          centeringError: final.center.length().toFixed(6)
        });

        // Warn if centering is off
        if (final.center.length() > 0.01) {
          console.warn("⚠️ Model not perfectly centered, error:", final.center.length().toFixed(6));
        } else {
          console.log("✨ Model perfectly centered!");
        }

        // ───────────────────────────────────────────────────────────────
        // STEP 6.5: Create Visual Bounding Box (Centered at Origin)
        // ───────────────────────────────────────────────────────────────
        if (sceneRef.current) {
          // Remove any existing bounding box
          if (boundingBoxRef.current) {
            boundingBoxRef.current.dispose();
            boundingBoxRef.current = null;
          }

          // Create bounding box visualization using final bounds
          const boxSize = final.size;

          // Create a box mesh for the bounding box
          const boundingBox = MeshBuilder.CreateBox(
            "boundingBoxHelper",
            {
              width: boxSize.x,
              height: boxSize.y,
              depth: boxSize.z,
            },
            sceneRef.current
          );

          // Position at world origin (0, 0, 0) since model is centered there
          boundingBox.position = Vector3.Zero();

          // Create wireframe material
          const boxMaterial = new StandardMaterial("boundingBoxMaterial", sceneRef.current);
          boxMaterial.wireframe = true;
          boxMaterial.emissiveColor = new Color3(0, 1, 0.5); // Cyan-green color
          boxMaterial.alpha = 0.7;
          boxMaterial.disableLighting = true;
          
          boundingBox.material = boxMaterial;
          boundingBox.isPickable = false; // Don't interfere with model interaction
          boundingBox.setEnabled(showBoundingBox); // Set initial visibility

          // Store reference
          boundingBoxRef.current = boundingBox;

          console.log("📦 Bounding box created at origin:", {
            size: `${boxSize.x.toFixed(3)} × ${boxSize.y.toFixed(3)} × ${boxSize.z.toFixed(3)}`,
            position: "(0, 0, 0)"
          });
        }

        // ───────────────────────────────────────────────────────────────
        // STEP 7: FULLY AUTOMATIC Camera Distance Calculation
        // ───────────────────────────────────────────────────────────────
        const fov = Math.PI / 3; // 60 degrees
        const fovFactor = 1 / Math.tan(fov / 2);
        
        // ═══════════════════════════════════════════════════════════════
        // AUTOMATIC PADDING CALCULATION
        // ═══════════════════════════════════════════════════════════════
        let paddingFactor = 1.5; // Base padding - increased for better fit
        
        // Adjust padding based on aspect ratio
        if (aspectRatio > 10) {
          paddingFactor = 1.8; // Elongated needs more padding
        } else if (aspectRatio > 5) {
          paddingFactor = 1.7;
        } else if (aspectRatio > 3) {
          paddingFactor = 1.6;
        } else if (aspectRatio < 1.3) {
          paddingFactor = 1.4; // Compact can be tighter
        }
        
        // Adjust padding based on volume density
        if (normalizedVolume < 0.1) {
          paddingFactor *= 1.15; // Flat models need more padding to see properly
        }
        
        // Adjust padding based on model size
        if (final.dimensions.max > 6) {
          paddingFactor *= 1.05; // Larger models need more space
        } else if (final.dimensions.max < 3) {
          paddingFactor *= 1.1; // Small models need more space
        }
        
        console.log(`📐 Auto padding factor: ${paddingFactor.toFixed(2)}`);
        
        // ═══════════════════════════════════════════════════════════════
        // AUTOMATIC DISTANCE CALCULATION
        // ═══════════════════════════════════════════════════════════════
        const baseDistance = (final.dimensions.max / 2) * fovFactor * paddingFactor;
        
        // Calculate optimal viewing angle adjustment
        let angleMultiplier = 1.0;
        
        // For elongated models, adjust viewing distance
        if (aspectRatio > 8) {
          angleMultiplier = 1.25;
        } else if (aspectRatio > 5) {
          angleMultiplier = 1.15;
        } else if (aspectRatio > 3) {
          angleMultiplier = 1.08;
        }
        
        let cameraDistance = baseDistance * angleMultiplier;
        
        // ═══════════════════════════════════════════════════════════════
        // AUTOMATIC RANGE LIMITS
        // ═══════════════════════════════════════════════════════════════
        // Calculate dynamic min/max based on model size
        const minDistance = Math.max(2, final.dimensions.max * 0.3);
        const maxDistance = Math.max(30, final.dimensions.max * 5);
        
        const optimalCameraDistance = Math.max(minDistance, Math.min(cameraDistance, maxDistance));
        
        // ═══════════════════════════════════════════════════════════════
        // AUTOMATIC ZOOM LIMITS
        // ═══════════════════════════════════════════════════════════════
        const zoomInLimit = optimalCameraDistance * 0.15; // Can zoom to 15%
        const zoomOutLimit = optimalCameraDistance * 5; // Can zoom to 500%
        
        console.log("📷 Auto camera config:", {
          baseDistance: baseDistance.toFixed(2),
          angleAdjustment: `×${angleMultiplier.toFixed(2)}`,
          finalDistance: optimalCameraDistance.toFixed(2),
          zoomRange: `${zoomInLimit.toFixed(2)} - ${zoomOutLimit.toFixed(2)}`
        });

        // ───────────────────────────────────────────────────────────────
        // STEP 9: Smooth Entrance Animation
        // ───────────────────────────────────────────────────────────────
        const finalScale = rootMesh.scaling.x;
        const finalPosition = rootMesh.position.clone(); // Preserve centered position
        
        // Start invisible and scaled down
        rootMesh.scaling = Vector3.Zero();
        rootMesh.visibility = 0;

        const animationDuration = 60; // frames (~1 second at 60fps)
        let frame = 0;

        const animateEntrance = () => {
          if (!rootMesh || frame >= animationDuration) {
            if (rootMesh) {
              // Ensure final state is exact
              rootMesh.visibility = 1;
              rootMesh.scaling = new Vector3(finalScale, finalScale, finalScale);
              rootMesh.position = finalPosition;
              rootMesh.computeWorldMatrix(true);
            }
            console.log("🎬 Entrance animation complete");
            return;
          }

          frame++;
          const progress = frame / animationDuration;
          
          // Ease-out cubic for smooth deceleration
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          // Animate scale and visibility
          const scale = finalScale * easeProgress;
          rootMesh.scaling = new Vector3(scale, scale, scale);
          rootMesh.visibility = easeProgress;
          
          // CRITICAL: Maintain centered position throughout animation
          rootMesh.position = finalPosition;

          requestAnimationFrame(animateEntrance);
        };

        console.log("🎬 Starting entrance animation...");
        animateEntrance();

        // ───────────────────────────────────────────────────────────────
        // STEP 8: AUTOMATIC Camera Configuration
        // ───────────────────────────────────────────────────────────────
        if (cameraRef.current) {
          const camera = cameraRef.current;
          
          // Target the world origin where model is centered
          camera.setTarget(Vector3.Zero());
          
          // ═══════════════════════════════════════════════════════════════
          // AUTOMATIC VIEWING ANGLE
          // ═══════════════════════════════════════════════════════════════
          camera.alpha = -Math.PI / 2; // Front view (0 degrees)
          
          // Adjust beta (vertical angle) based on model shape
          let betaAngle = Math.PI / 2.5; // Default: ~72 degrees
          
          if (aspectRatio > 5) {
            // Elongated models - view more from side
            betaAngle = Math.PI / 2.3; // ~78 degrees (more horizontal)
          } else if (normalizedVolume < 0.1) {
            // Flat models - view more from above
            betaAngle = Math.PI / 2.8; // ~64 degrees (more from top)
          }
          
          camera.beta = betaAngle;
          camera.radius = optimalCameraDistance;
          
          // ═══════════════════════════════════════════════════════════════
          // AUTOMATIC ZOOM LIMITS (from Step 7)
          // ═══════════════════════════════════════════════════════════════
          camera.lowerRadiusLimit = zoomInLimit;
          camera.upperRadiusLimit = zoomOutLimit;
          
          // ═══════════════════════════════════════════════════════════════
          // AUTOMATIC CONTROL SENSITIVITY
          // ═══════════════════════════════════════════════════════════════
          // Adjust sensitivity based on model size
          const wheelSensitivity = Math.max(20, Math.min(100, 50 / (final.dimensions.max / 5)));
          camera.wheelPrecision = wheelSensitivity;
          camera.pinchPrecision = wheelSensitivity;
          
          // Panning sensitivity based on distance
          camera.panningSensibility = 1000 / optimalCameraDistance;
          
          // ═══════════════════════════════════════════════════════════════
          // SMOOTH MOVEMENT SETTINGS
          // ═══════════════════════════════════════════════════════════════
          camera.inertia = 0.9; // Smooth deceleration
          camera.angularSensibilityX = 1000;
          camera.angularSensibilityY = 1000;
          
          console.log("📷 Auto camera ready:", {
            distance: optimalCameraDistance.toFixed(2),
            angle: `${(betaAngle * 180 / Math.PI).toFixed(1)}°`,
            target: "(0, 0, 0)",
            zoomLimits: `${zoomInLimit.toFixed(2)} - ${zoomOutLimit.toFixed(2)}`,
            sensitivity: wheelSensitivity.toFixed(0)
          });
        }

        // Model is centered at origin - no offset needed

        // Extract material sections from the actual model
        const extractedSections = extractSectionsFromModel(
          rootMesh,
          currentModelUrl,
        );

        console.log(
          "📋 Extracted sections from model:",
          extractedSections.map((s) => ({
            name: s.name,
            originalName: s.originalName,
            id: s.id,
          })),
        );

        // Try to fetch precomputed sections from API
        fetch(`/api/materials?model=${encodeURIComponent(currentModelUrl)}`)
          .then((resp) => resp.json())
          .then((data) => {
            if (data?.sections && data.sections.length > 0) {
              console.log(
                "📋 API returned sections:",
                data.sections.map((s: any) => ({
                  name: s.name,
                  originalName: s.originalName,
                })),
              );

              // Map API sections to extracted sections by matching originalName
              const mappedSections = data.sections.map((apiSection: any) => {
                // Find matching extracted section
                const match = extractedSections.find(
                  (extracted) =>
                    extracted.originalName === apiSection.originalName ||
                    extracted.name === apiSection.originalName,
                );

                if (match) {
                  console.log(
                    `✓ Mapped "${apiSection.name}" to material "${match.originalName}"`,
                  );
                  // Use API section data but with extracted material ID
                  return {
                    ...apiSection,
                    id: match.id, // Use the actual material name as ID
                    originalName: match.originalName, // Use actual material name
                  };
                } else {
                  console.warn(
                    `⚠️ No match found for API section "${apiSection.name}" (${apiSection.originalName})`,
                  );
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
        const errorMsg =
          message || exception?.message || "Failed to load model";
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
        <>
          <BabylonDecals
            scene={sceneRef.current}
            rootMesh={currentMeshRef.current}
          />
          <DecalPreviewIndicator
            scene={sceneRef.current}
            rootMesh={currentMeshRef.current as Mesh}
          />
        </>
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
