"use client";

import { useState, useRef, useEffect } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Model } from "@/lib/models-service";
import {
  Grid3x3,
  Save,
  Download,
  Upload,
  FileText,
  Video,
  Play,
  Pause,
  RotateCcw,
  Package2,
  Sparkles,
  PanelLeftClose,
  List,
  Palette,
  Paintbrush,
  Camera,
  FileImage,
  RotateCw,
  Film,
  Square,
  Maximize2,
  Copy,
  Eye,
  FileJson,
  Settings,
  Box,
} from "lucide-react";
import { MaterialEditor } from "./material-editor";
import type { Product } from "@/lib/store";
import { AIImageGenerator } from "./ai-image-generator";
import { ThemeToggle } from "./theme-toggle";
import { UVTextureEditor } from "./uv-texture-editor";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import NextImage from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ColorPickerModal } from "./color-picker-modal";
import { toast } from "sonner";

interface UnifiedSidebarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
}

export function UnifiedSidebar({ sidebarOpen, onToggleSidebar }: UnifiedSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"materials" | "texture" | "view">(
    "materials",
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState("");
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [exportFileName, setExportFileName] = useState("model-export");
  const [imageQuality, setImageQuality] = useState<"standard" | "high" | "ultra">("high");
  const [videoFormat, setVideoFormat] = useState<"webm" | "mp4">("webm");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  
  // Prevent hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
  const showBoundingBox = useConfiguratorStore((state) => state.showBoundingBox);
  const toggleBoundingBox = useConfiguratorStore((state) => state.toggleBoundingBox);
  const backgroundColor = useConfiguratorStore(
    (state) => state.backgroundColor,
  );
  const setBackgroundColor = useConfiguratorStore(
    (state) => state.setBackgroundColor,
  );
  const backgroundImage = useConfiguratorStore(
    (state) => state.backgroundImage,
  );
  const setBackgroundImage = useConfiguratorStore(
    (state) => state.setBackgroundImage,
  );
  const backgroundVideo = useConfiguratorStore(
    (state) => state.backgroundVideo,
  );
  const setBackgroundVideo = useConfiguratorStore(
    (state) => state.setBackgroundVideo,
  );
  const isVideoPlaying = useConfiguratorStore((state) => state.isVideoPlaying);
  const setIsVideoPlaying = useConfiguratorStore(
    (state) => state.setIsVideoPlaying,
  );
  const exportPreset = useConfiguratorStore((state) => state.exportPreset);
  const importPreset = useConfiguratorStore((state) => state.importPreset);

  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const products = useConfiguratorStore((state) => state.products);
  const selectedProductId = useConfiguratorStore(
    (state) => state.selectedProductId,
  );
  const setSelectedProduct = useConfiguratorStore(
    (state) => state.setSelectedProduct,
  );
  const setProducts = useConfiguratorStore((state) => state.setProducts);
  const sections = useConfiguratorStore((state) => state.sections);
  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const entranceAnimation = useConfiguratorStore(
    (state) => state.entranceAnimation,
  );
  const setEntranceAnimation = useConfiguratorStore(
    (state) => state.setEntranceAnimation,
  );
  const enableEntranceAnimation = useConfiguratorStore(
    (state) => state.enableEntranceAnimation,
  );
  const setEnableEntranceAnimation = useConfiguratorStore(
    (state) => state.setEnableEntranceAnimation,
  );

  // Load active products on mount
  useEffect(() => {
    const loadActiveProducts = async () => {
      try {
        const response = await fetch("/api/models?active=true");
        if (response.ok) {
          const { models } = await response.json();
          if (models && models.length > 0) {
            const activeProducts = models.map((model: Model) => ({
              id: model.id,
              title: model.name,
              modelUrl: model.file_path,
              category: model.category || undefined,
            }));
            setProducts(activeProducts);

            // Don't auto-select any product - let user choose from dropdown
          }
        }
        setProductsLoaded(true);
      } catch (error) {
        console.error("Failed to load active products:", error);
        // Fallback to all products if API fails - for now, just set loaded to true
        setProductsLoaded(true);
      }
    };

    if (!productsLoaded && products.length === 0) {
      loadActiveProducts();
    }
  }, [productsLoaded, products.length, setProducts, selectedProductId, setSelectedProduct]);

  // When switching to the Texture tab, default to the COMPLETE UV MAP
  // by clearing any selected section. This shows the full UV but does NOT
  // automatically apply a blank texture (user adds text/image first).
  // Also clear any existing customTexture so the model shows original materials.
  useEffect(() => {
    if (activeTab !== "texture") return;
    setSelectedSection(null);

    // Clear any existing custom textures so model shows original appearance
    sections.forEach((section) => {
      if (section.customTexture) {
        updateSection(section.id, { customTexture: undefined });
      }
    });
  }, [activeTab, sections, setSelectedSection, updateSection]);

  // Group products by category for the model selector
  const groupedProducts = (products as Product[])
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .reduce(
      (map: Record<string, Product[]>, p: Product) => {
        const key = p.category || "Other";
        if (!map[key]) map[key] = [];
        map[key].push(p);
        return map;
      },
      {} as Record<string, Product[]>,
    );
  const cameraControlsRef = useConfiguratorStore(
    (state) => state.cameraControlsRef,
  );
  const autoRotate = useConfiguratorStore((state) => state.autoRotate);
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  const glRef = useConfiguratorStore((state) => state.glRef);

  const handleExport = () => {
    try {
      const json = exportPreset();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName || "preset"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Preset exported successfully", {
        description: `Saved as ${exportFileName}.json`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export preset", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          importPreset(json);
          toast.success("Preset imported successfully", {
            description: `Loaded from ${file.name}`,
          });
        } catch (error) {
          console.error("Import failed:", error);
          toast.error("Failed to import preset", {
            description: "Invalid preset file format",
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleExportModel = () => {
    if (!currentModelUrl) {
      toast.error("No model loaded", {
        description: "Please load a model before exporting",
      });
      return;
    }
    try {
      const link = document.createElement("a");
      link.download = `${exportFileName || "configured-model"}.glb`;
      link.href = currentModelUrl;
      link.click();
      toast.success("Model exported successfully", {
        description: `Saved as ${exportFileName}.glb`,
      });
    } catch (error) {
      console.error("Model export failed:", error);
      toast.error("Failed to export model", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleScreenshot = () => {
    // Use the canvas element directly for Babylon.js
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Canvas not found", {
        description: "3D scene is not ready yet",
      });
      return;
    }

    try {
      const toastId = toast.loading("Capturing screenshot...");
      
      requestAnimationFrame(() => {
        try {
          const quality = imageQuality === "standard" ? 0.8 : imageQuality === "high" ? 0.95 : 1.0;
          const dataURL = canvas.toDataURL("image/png", quality);
          const link = document.createElement("a");
          link.download = `${exportFileName || "screenshot"}.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.dismiss(toastId);
          toast.success("Screenshot captured", {
            description: `Saved as ${exportFileName}.png (${imageQuality} quality)`,
          });
        } catch (error) {
          toast.dismiss(toastId);
          console.error("Screenshot capture failed:", error);
          toast.error("Screenshot failed", {
            description: "Could not capture the canvas",
          });
        }
      });
    } catch (error) {
      console.error("Screenshot failed:", error);
      toast.error("Screenshot failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleExportHighRes = () => {
    // Use the canvas element directly for Babylon.js
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Canvas not found", {
        description: "3D scene is not ready yet",
      });
      return;
    }

    try {
      const toastId = toast.loading("Exporting high-resolution image...");
      requestAnimationFrame(() => {
        try {
          // Create a temporary high-res canvas
          const tempCanvas = document.createElement("canvas");
          const scale = 2; // 2x resolution
          const originalWidth = canvas.width;
          const originalHeight = canvas.height;

          tempCanvas.width = originalWidth * scale;
          tempCanvas.height = originalHeight * scale;

          const ctx = tempCanvas.getContext("2d");
          if (!ctx) {
            toast.dismiss(toastId);
            toast.error("Failed to create canvas context");
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.scale(scale, scale);
          ctx.drawImage(canvas, 0, 0);

          const quality = imageQuality === "standard" ? 0.8 : imageQuality === "high" ? 0.95 : 1.0;
          const dataURL = tempCanvas.toDataURL("image/png", quality);
          const link = document.createElement("a");
          link.download = `${exportFileName || "model"}-2x.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.dismiss(toastId);
          toast.success("High-res image exported", {
            description: `Saved as ${exportFileName}-2x.png (${tempCanvas.width}x${tempCanvas.height})`,
          });
        } catch (error) {
          toast.dismiss(toastId);
          console.error("High-res capture failed:", error);
          toast.error("High-res export failed", {
            description: "Could not process the image",
          });
        }
      });
    } catch (error) {
      console.error("High-res export failed:", error);
      toast.error("High-res export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleExport4K = () => {
    // Use the canvas element directly for Babylon.js
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Canvas not found", {
        description: "3D scene is not ready yet",
      });
      return;
    }

    try {
      const toastId = toast.loading("Exporting 4K image (this may take a moment)...");
      requestAnimationFrame(() => {
        try {
          // Create a 4K resolution canvas
          const tempCanvas = document.createElement("canvas");
          const scale = 4; // 4x resolution
          const originalWidth = canvas.width;
          const originalHeight = canvas.height;

          tempCanvas.width = originalWidth * scale;
          tempCanvas.height = originalHeight * scale;

          const ctx = tempCanvas.getContext("2d");
          if (!ctx) {
            toast.dismiss(toastId);
            toast.error("Failed to create canvas context");
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.scale(scale, scale);
          ctx.drawImage(canvas, 0, 0);

          const quality = imageQuality === "standard" ? 0.8 : imageQuality === "high" ? 0.95 : 1.0;
          const dataURL = tempCanvas.toDataURL("image/png", quality);
          const link = document.createElement("a");
          link.download = `${exportFileName || "model"}-4x.png`;
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.dismiss(toastId);
          toast.success("4K image exported", {
            description: `Saved as ${exportFileName}-4x.png (${tempCanvas.width}x${tempCanvas.height})`,
          });
        } catch (error) {
          toast.dismiss(toastId);
          console.error("4K capture failed:", error);
          toast.error("4K export failed", {
            description: "Could not process the image",
          });
        }
      });
    } catch (error) {
      console.error("4K export failed:", error);
      toast.error("4K export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleRotateLeft = () => {
    // Check if it's a Babylon.js ArcRotateCamera
    const babylonCamera = cameraControlsRef as {
      alpha?: number;
    } | null;

    if (babylonCamera && typeof babylonCamera.alpha === "number") {
      // Babylon.js camera - rotate left (decrease alpha)
      babylonCamera.alpha -= Math.PI / 4;
      return;
    }

    // Three.js camera controls
    const controls = cameraControlsRef as {
      object?: unknown;
      getAzimuthalAngle: () => number;
      setAzimuthalAngle: (angle: number, enableTransition: boolean) => void;
    } | null;
    if (!controls?.object) return;
    const currentAzimuth = controls.getAzimuthalAngle();
    controls.setAzimuthalAngle(currentAzimuth - Math.PI / 4, true);
  };

  const handleRotateRight = () => {
    // Check if it's a Babylon.js ArcRotateCamera
    const babylonCamera = cameraControlsRef as {
      alpha?: number;
    } | null;

    if (babylonCamera && typeof babylonCamera.alpha === "number") {
      // Babylon.js camera - rotate right (increase alpha)
      babylonCamera.alpha += Math.PI / 4;
      return;
    }

    // Three.js camera controls
    const controls = cameraControlsRef as {
      object?: unknown;
      getAzimuthalAngle: () => number;
      setAzimuthalAngle: (angle: number, enableTransition: boolean) => void;
    } | null;
    if (!controls?.object) return;
    const currentAzimuth = controls.getAzimuthalAngle();
    controls.setAzimuthalAngle(currentAzimuth + Math.PI / 4, true);
  };

  const handleAutoRotate = () => {
    setAutoRotate(!autoRotate);
  };

  const handleStartRecording = async (format: "webm" | "mp4") => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Canvas not found", {
        description: "Unable to start recording",
      });
      return;
    }

    try {
      if (!canvas.captureStream) {
        toast.error("Video recording not supported", {
          description: "Your browser doesn't support video capture",
        });
        return;
      }

      const stream = canvas.captureStream(30); // 30 FPS
      const options: MediaRecorderOptions = { videoBitsPerSecond: 2500000 };
      let fileExtension = "webm";

      if (format === "mp4") {
        // Try MP4 formats
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          options.mimeType = "video/mp4";
          fileExtension = "mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
          options.mimeType = "video/webm;codecs=h264";
          fileExtension = "mp4";
        } else {
          toast.warning("MP4 not supported, using WebM", {
            description: "Your browser doesn't support MP4 recording",
          });
          format = "webm";
        }
      }

      if (format === "webm") {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          options.mimeType = "video/webm;codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          options.mimeType = "video/webm;codecs=vp8";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          options.mimeType = "video/webm";
        } else {
          toast.error("No supported video format", {
            description: "Your browser doesn't support video recording",
          });
          return;
        }
        fileExtension = "webm";
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: options.mimeType || "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${exportFileName || "model-video"}.${fileExtension}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast.success("Video exported successfully", {
          description: `Saved as ${exportFileName}.${fileExtension}`,
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording failed", {
          description: "An error occurred during recording",
        });
        setIsRecording(false);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started", {
        description: `Recording in ${format.toUpperCase()} format`,
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Video recording failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      toast.info("Stopping recording...", {
        description: "Processing video...",
      });
    }
  };

  const handleDownloadUVMap = () => {
    const completeUVMap = useConfiguratorStore.getState().completeUVMap;
    if (!completeUVMap) {
      alert("UV Map not available yet");
      return;
    }

    const link = document.createElement("a");
    link.download = `uv-map-${Date.now()}.png`;
    link.href = completeUVMap;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackgroundImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundVideoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBackgroundVideo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundImageUrlChange = () => {
    const url = prompt("Enter image URL:", backgroundImageUrl);
    if (url !== null) {
      setBackgroundImageUrl(url);
      setBackgroundImage(url);
    }
  };

  const handleBackgroundVideoUrlChange = () => {
    const url = prompt("Enter video URL:", backgroundVideoUrl);
    if (url !== null) {
      setBackgroundVideoUrl(url);
      setBackgroundVideo(url);
    }
  };

  const handleApplyBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    setIsColorPickerOpen(false);
  };

  const isCollapsed = sidebarOpen === false;

  return (
    <div className="flex flex-col bg-card w-full rounded-2xl border border-border/20 backdrop-blur-sm max-h-[calc(100vh-2rem)] overflow-hidden">
      {/* Header with Model Selector */}
      <div className="p-4 border-b border-border/50 space-y-3 bg-gradient-to-b from-card to-card/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-black p-2">
                <NextImage
                  src="/LOGO-gg.png"
                  alt="gg logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className={`flex items-center gap-2 ${isCollapsed ? "mx-auto" : ""}`}>
            <button
              onClick={() => onToggleSidebar?.(!sidebarOpen)}
              className="h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose
                className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""
                  }`}
              />
            </button>
            {!isCollapsed && <ThemeToggle />}
          </div>
        </div>

        {/* Model Dropdown */}
        {!isCollapsed && mounted && (
          <div data-tour="model-loader">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              <div className="flex items-baseline justify-between">
                <span>Select Model</span>
                <span className="text-xs text-muted-foreground">
                  {products.length} active models
                </span>
              </div>
            </label>
            <Select
              value={selectedProductId || ""}
              onValueChange={setSelectedProduct}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a 3D model to begin..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedProducts).map(([category, items]) => (
                  <div key={category} className="py-1">
                    <div className="px-3 py-1 text-xs text-muted-foreground font-semibold">
                      {category}
                    </div>
                    {items.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Materials Page Link removed per user request */}

        {/* Tab Navigation */}
        {!isCollapsed && <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant={activeTab === "materials" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("materials")}
            className="w-full transition-all flex-col h-auto py-2"
            data-tab="materials"
          >
            <Palette className="w-4 h-4 mb-1" />
            <span className="text-xs">Materials</span>
          </Button>
          <Button
            variant={activeTab === "texture" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("texture")}
            className="w-full transition-all flex-col h-auto py-2"
            data-tab="texture"
          >
            <Paintbrush className="w-4 h-4 mb-1" />
            <span className="text-xs">Texture</span>
          </Button>
          <Button
            variant={activeTab === "view" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("view")}
            className="w-full transition-all flex-col h-auto py-2"
            data-tab="view"
          >
            <Camera className="w-4 h-4 mb-1" />
            <span className="text-xs">Export</span>
          </Button>
        </div>}

        {/* Collapsed Quick Access Icons */}
        {isCollapsed && (
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant={activeTab === "materials" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab("materials");
                onToggleSidebar?.(true);
              }}
              className="w-full aspect-square p-2"
              title="Materials"
            >
              <Palette className="w-5 h-5" />
            </Button>
            <Button
              variant={activeTab === "texture" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab("texture");
                onToggleSidebar?.(true);
              }}
              className="w-full aspect-square p-2"
              title="Texture"
            >
              <Paintbrush className="w-5 h-5" />
            </Button>
            <Button
              variant={activeTab === "view" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab("view");
                onToggleSidebar?.(true);
              }}
              className="w-full aspect-square p-2"
              title="Export"
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {!isCollapsed && <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "materials" && (
          <div className="p-4">
            <MaterialEditor />
          </div>
        )}
        {activeTab === "texture" && (
          <div className="p-4 space-y-3">
            <UVTextureEditor />
          </div>
        )}
        {activeTab === "view" && (
          <div className="p-4 space-y-3">
            <Tabs defaultValue="view">
              <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger
                  value="view"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Camera className="w-4 h-4" />
                  <span>View</span>
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <FileImage className="w-4 h-4" />
                  <span>Media</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Package2 className="w-4 h-4" />
                  <span>Export</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="view" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4" />
                    Camera Controls
                  </h3>
                  <div
                    className="grid grid-cols-2 gap-2"
                    data-tour="camera-angles"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotateLeft}
                      className="w-full justify-center"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Left
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotateRight}
                      className="w-full justify-center"
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      Right
                    </Button>
                  </div>
                  <div className="mt-2">
                    <ResetCameraButton />
                  </div>
                  <div className="mt-2">
                    <Button
                      variant={autoRotate ? "default" : "outline"}
                      size="sm"
                      onClick={handleAutoRotate}
                      className="w-full justify-start"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {autoRotate ? "Stop Auto-Rotate" : "Start Auto-Rotate"}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Grid3x3 className="w-4 h-4" />
                    Scene Options
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleGrid}
                      className="w-full justify-start"
                      data-tour="lighting-controls"
                    >
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      {showGrid ? "Hide Grid" : "Show Grid"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleBoundingBox}
                      className="w-full justify-start"
                    >
                      <Box className="w-4 h-4 mr-2" />
                      {showBoundingBox ? "Hide Bounding Box" : "Show Bounding Box"}
                    </Button>

                    {/* Background Environment Options */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Background Environment
                      </h4>

                      {/* Background Color Picker */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-border"
                          style={{ backgroundColor: backgroundColor }}
                        ></div>
                        <span className="text-xs">Background Color</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto text-xs h-6 px-2"
                          onClick={() => setIsColorPickerOpen(true)}
                        >
                          Change
                        </Button>
                      </div>

                      {/* Background Image Options */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-border bg-gray-200 flex items-center justify-center">
                            <FileImage className="w-2 h-2" />
                          </div>
                          <span className="text-xs">Background Image</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 ml-6">
                          <label className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 w-full"
                            >
                              Upload
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBackgroundImageUpload}
                              className="hidden"
                            />
                          </label>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={handleBackgroundImageUrlChange}
                          >
                            URL
                          </Button>
                        </div>
                      </div>

                      {/* Background Video Options */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-border bg-gray-200 flex items-center justify-center">
                            <Film className="w-2 h-2" />
                          </div>
                          <span className="text-xs">Background Video</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 ml-6">
                          <label className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 w-full"
                            >
                              Upload
                            </Button>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleBackgroundVideoUpload}
                              className="hidden"
                            />
                          </label>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={handleBackgroundVideoUrlChange}
                          >
                            URL
                          </Button>
                        </div>
                      </div>

                      {/* Video Controls */}
                      {backgroundVideo && (
                        <div className="flex gap-1 mt-1 ml-6">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2 flex-1"
                            onClick={() => setIsVideoPlaying(true)}
                            disabled={isVideoPlaying}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2 flex-1"
                            onClick={() => setIsVideoPlaying(false)}
                            disabled={!isVideoPlaying}
                          >
                            <Square className="w-3 h-3 mr-1" />
                            Stop
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground px-2 py-1 bg-yellow-500/5 rounded mt-2">
                    More scene options coming in Phase 2
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <FileImage className="w-4 h-4" />
                    Export Images
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScreenshot}
                      className="w-full justify-start"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Screenshot (PNG)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportHighRes}
                      className="w-full justify-start"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      High-Res (2x)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport4K}
                      className="w-full justify-start"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Ultra HD (4x)
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Film className="w-4 h-4" />
                    Export Video
                  </h3>
                  <div className="space-y-2">
                    {!!isRecording ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartRecording("webm")}
                          className="w-full justify-start"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Record WebM
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartRecording("mp4")}
                          className="w-full justify-start"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Record MP4
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStopRecording}
                        className="w-full justify-start"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                    {isRecording && (
                      <div className="text-xs text-muted-foreground p-2 bg-red-500/10 rounded-md">
                        🔴 Recording in progress...
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" />
                  AI Image Generator
                </h3>
                <div className="bg-secondary/20 rounded-lg p-3">
                  <AIImageGenerator />
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-4 space-y-3">
                {/* Export Settings Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Export Settings
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure export options and file naming
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* File Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor="export-filename" className="text-xs">
                        File Name
                      </Label>
                      <Input
                        id="export-filename"
                        value={exportFileName}
                        onChange={(e) => setExportFileName(e.target.value)}
                        placeholder="model-export"
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Image Quality */}
                    <div className="space-y-2">
                      <Label htmlFor="image-quality" className="text-xs">
                        Image Quality
                      </Label>
                      <Select value={imageQuality} onValueChange={(value: "standard" | "high" | "ultra") => setImageQuality(value)}>
                        <SelectTrigger id="image-quality" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (80%)</SelectItem>
                          <SelectItem value="high">High (95%)</SelectItem>
                          <SelectItem value="ultra">Ultra (100%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Video Format */}
                    <div className="space-y-2">
                      <Label htmlFor="video-format" className="text-xs">
                        Video Format
                      </Label>
                      <Select value={videoFormat} onValueChange={(value: "webm" | "mp4") => setVideoFormat(value)}>
                        <SelectTrigger id="video-format" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webm">WebM</SelectItem>
                          <SelectItem value="mp4">MP4 (if supported)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Include Metadata Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="metadata" className="text-xs">Include Metadata</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Add configuration data to exports
                        </p>
                      </div>
                      <Switch
                        id="metadata"
                        checked={includeMetadata}
                        onCheckedChange={setIncludeMetadata}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Entrance Animation Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Entrance Animation
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure model loading animation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-animation" className="text-xs">
                        Enable Animation
                      </Label>
                      <Switch
                        id="enable-animation"
                        checked={enableEntranceAnimation}
                        onCheckedChange={setEnableEntranceAnimation}
                      />
                    </div>

                    {enableEntranceAnimation && (
                      <div className="space-y-2">
                        <Label htmlFor="animation-type" className="text-xs">
                          Animation Type
                        </Label>
                        <Select
                          value={entranceAnimation}
                          onValueChange={(value) =>
                            setEntranceAnimation(
                              value as
                              | "fadeIn"
                              | "scaleUp"
                              | "rotateIn"
                              | "zoomRotate"
                              | "dropIn"
                              | "bounce"
                            )
                          }
                        >
                          <SelectTrigger id="animation-type" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fadeIn">Fade In</SelectItem>
                            <SelectItem value="scaleUp">Scale Up</SelectItem>
                            <SelectItem value="rotateIn">Rotate In</SelectItem>
                            <SelectItem value="slideIn">Slide In</SelectItem>
                            <SelectItem value="bounce">Bounce</SelectItem>
                            <SelectItem value="spin">Spin</SelectItem>
                            <SelectItem value="dropIn">Drop In</SelectItem>
                            <SelectItem value="zoomRotate">Zoom Rotate</SelectItem>
                            <SelectItem value="glow">Glow</SelectItem>
                            <SelectItem value="particleReveal">Particle Reveal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Export Presets Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      Configuration Presets
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Save and load your configurations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            const json = exportPreset();
                            navigator.clipboard?.writeText(json);
                            toast.success("Copied to clipboard", {
                              description: "Preset JSON copied successfully",
                            });
                          } catch (err) {
                            console.error("Copy failed:", err);
                            toast.error("Failed to copy", {
                              description: "Unable to copy to clipboard",
                            });
                          }
                        }}
                        className="justify-center text-xs h-8"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            const json = exportPreset();
                            const preview = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
                            window.open(preview, "_blank");
                            toast.success("Preview opened", {
                              description: "Preset opened in new tab",
                            });
                          } catch (err) {
                            console.error("Preview failed:", err);
                            toast.error("Failed to preview", {
                              description: "Unable to open preview",
                            });
                          }
                        }}
                        className="justify-center text-xs h-8"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleExport}
                        className="justify-center text-xs h-8"
                        data-tour="export-options"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>

                    <Separator />

                    <label className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 mr-2" />
                        Import Preset
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </CardContent>
                </Card>

                {/* Export Model Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package2 className="w-4 h-4" />
                      3D Model Export
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Download configured 3D model
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant={currentModelUrl ? "default" : "outline"}
                      size="sm"
                      onClick={handleExportModel}
                      className="w-full justify-start text-xs h-9"
                      disabled={!currentModelUrl}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Export Model (GLB)
                      {!currentModelUrl && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          No Model
                        </Badge>
                      )}
                    </Button>
                    <p className="text-[10px] text-muted-foreground px-2 py-1.5 bg-muted/50 rounded-md">
                      <strong>Note:</strong> Additional formats (OBJ, FBX, USDZ) are planned for future releases.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        <ColorPickerModal
          isOpen={isColorPickerOpen}
          onClose={() => setIsColorPickerOpen(false)}
          currentColor={backgroundColor}
          onColorChange={handleApplyBackgroundColor}
        />
      </div>}
    </div>
  );
}

function ResetCameraButton() {
  const cameraControlsRef = useConfiguratorStore(
    (state) => state.cameraControlsRef,
  );

  const handleReset = () => {
    // Check if it's a Babylon.js ArcRotateCamera
    const babylonCamera = cameraControlsRef as {
      alpha?: number;
      beta?: number;
      radius?: number;
      setTarget?: (target: { x: number; y: number; z: number }) => void;
    } | null;

    if (babylonCamera && typeof babylonCamera.alpha === "number") {
      // Babylon.js camera - reset to front view
      babylonCamera.alpha = -Math.PI / 2; // Front view
      babylonCamera.beta = Math.PI / 2.5; // Eye-level view
      babylonCamera.radius = 5;
      if (babylonCamera.setTarget) {
        babylonCamera.setTarget({ x: 0, y: 0, z: 0 });
      }
      return;
    }

    // Three.js camera controls
    const controls = cameraControlsRef as {
      reset?: (enableTransition: boolean) => void;
    } | null;
    if (controls?.reset) {
      controls.reset(true);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      className="w-full justify-start"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset View
    </Button>
  );
}
