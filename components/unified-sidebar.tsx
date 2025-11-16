"use client";

import { useState, useRef, useEffect } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Model } from "@/lib/models-service";
import {
  Grid3x3,
  Save,
  Download,
  Palette,
  Paintbrush,
  Camera,
  Package2,
  RotateCcw,
  RotateCw,
  Video,
  Play,
  Square,
  Maximize2,
  ChevronDown,
  FileImage,
  Film,
  Sparkles,
  PanelLeftClose,
  List,
} from "lucide-react";
import { MaterialEditor } from "./material-editor";
import type { Product } from "@/lib/store";
import { AIImageGenerator } from "./ai-image-generator";
import { OnboardingInfoButton } from "./onboarding-info-button";
import { DecalEditor } from "./decal-editor";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ColorPickerModal } from "./color-picker-modal";

interface UnifiedSidebarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
}

export function UnifiedSidebar({ onToggleSidebar }: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<"materials" | "texture" | "view">(
    "materials",
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState("");
  const [productsLoaded, setProductsLoaded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
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

  // Load active products on mount
  useEffect(() => {
    const loadActiveProducts = async () => {
      try {
        const response = await fetch("/api/models?active=true");
        if (response.ok) {
          const { models } = await response.json();
          const activeProducts = models.map((model: Model) => ({
            id: model.id,
            title: model.name,
            modelUrl: model.file_path,
            category: model.category || undefined,
          }));
          setProducts(activeProducts);

          // Auto-select the first product if none is selected
          if (activeProducts.length > 0 && !selectedProductId) {
            setSelectedProduct(activeProducts[0].id);
          }

          setProductsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load active products:", error);
        // Fallback to all products if API fails - for now, just set loaded to true
        setProductsLoaded(true);
      }
    };

    if (!productsLoaded && products.length === 0) {
      loadActiveProducts();
    }
  }, [productsLoaded, products.length, setProducts]);

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
    const json = exportPreset();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preset.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importPreset(json);
      };
      reader.readAsText(file);
    }
  };

  const handleExportModel = () => {
    if (!currentModelUrl) return;
    const link = document.createElement("a");
    link.download = "configured-model.glb";
    link.href = currentModelUrl;
    link.click();
  };

  const handleScreenshot = () => {
    const renderer = glRef as {
      domElement: HTMLCanvasElement;
      render: () => void;
    } | null;
    if (!renderer) {
      alert("WebGL renderer not available");
      return;
    }

    try {
      // Force a render and then capture
      requestAnimationFrame(() => {
        const canvas = renderer.domElement;
        if (!canvas) {
          alert("Canvas not found");
          return;
        }

        // Ensure the canvas is up to date
        renderer.render();

        const dataURL = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.download = `model-screenshot-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert("Failed to capture screenshot");
    }
  };

  const handleExportHighRes = () => {
    const renderer = glRef as {
      domElement: HTMLCanvasElement;
      render: () => void;
    } | null;
    if (!renderer) {
      alert("WebGL renderer not available");
      return;
    }

    try {
      requestAnimationFrame(() => {
        const canvas = renderer.domElement;
        if (!canvas) {
          alert("Canvas not found");
          return;
        }

        // Force render
        renderer.render();

        // Create a temporary high-res canvas
        const tempCanvas = document.createElement("canvas");
        const scale = 2; // 2x resolution
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        tempCanvas.width = originalWidth * scale;
        tempCanvas.height = originalHeight * scale;

        const ctx = tempCanvas.getContext("2d");
        if (!ctx) {
          alert("Failed to create canvas context");
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.scale(scale, scale);
        ctx.drawImage(canvas, 0, 0);

        const dataURL = tempCanvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.download = `model-2x-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (error) {
      console.error("High-res export failed:", error);
      alert("Failed to export high-res image");
    }
  };

  const handleExport4K = () => {
    const renderer = glRef as {
      domElement: HTMLCanvasElement;
      render: () => void;
    } | null;
    if (!renderer) {
      alert("WebGL renderer not available");
      return;
    }

    try {
      requestAnimationFrame(() => {
        const canvas = renderer.domElement;
        if (!canvas) {
          alert("Canvas not found");
          return;
        }

        // Force render
        renderer.render();

        // Create a 4K resolution canvas
        const tempCanvas = document.createElement("canvas");
        const scale = 4; // 4x resolution
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        tempCanvas.width = originalWidth * scale;
        tempCanvas.height = originalHeight * scale;

        const ctx = tempCanvas.getContext("2d");
        if (!ctx) {
          alert("Failed to create canvas context");
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.scale(scale, scale);
        ctx.drawImage(canvas, 0, 0);

        const dataURL = tempCanvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.download = `model-4k-${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (error) {
      console.error("4K export failed:", error);
      alert("Failed to export 4K image");
    }
  };

  const handleRotateLeft = () => {
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
      alert("Canvas not found");
      return;
    }

    try {
      if (!canvas.captureStream) {
        alert("Video recording is not supported in your browser");
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
          alert("MP4 format not supported. Using WebM instead.");
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
          alert("No supported video format found");
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
        link.download = `model-video-${Date.now()}.${fileExtension}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording failed");
        setIsRecording(false);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert(
        `Video recording failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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

  return (
    <div className="flex flex-col bg-card w-full rounded-2xl shadow-2xl border border-border/20 backdrop-blur-sm max-h-[calc(100vh-2rem)] overflow-hidden">
      {/* Header with Model Selector */}
      <div className="p-4 border-b border-border/50 space-y-3 bg-gradient-to-b from-card to-card/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">3D Configurator</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Customize your model
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSidebar?.(false)}
              className="h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <OnboardingInfoButton />
          </div>
        </div>

        {/* Model Dropdown */}
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
            value={selectedProductId || undefined}
            onValueChange={setSelectedProduct}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a model..." />
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

        {/* Materials Page Link removed per user request */}

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5">
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
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "materials" && (
          <div className="p-4">
            <MaterialEditor />
          </div>
        )}
        {activeTab === "texture" && <DecalEditor />}
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

              <TabsContent value="export" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Package2 className="w-4 h-4" />
                    Export Model & Presets
                  </h3>

                  {/* Export Presets Section */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-muted-foreground">
                      Export your current configuration. You can preview or copy
                      the preset JSON before downloading.
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            const json = exportPreset();
                            navigator.clipboard?.writeText(json);
                            alert("Preset JSON copied to clipboard");
                          } catch (err) {
                            console.error("Copy failed:", err);
                            alert("Failed to copy preset JSON");
                          }
                        }}
                        className="w-full justify-center text-xs h-8"
                      >
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
                          } catch (err) {
                            console.error("Preview failed:", err);
                            alert("Failed to open preview");
                          }
                        }}
                        className="w-full justify-center text-xs h-8"
                      >
                        Preview
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="w-full justify-center text-xs h-8"
                        data-tour="export-options"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Export Model Section */}
                  <div className="space-y-2 mb-4">
                    <Button
                      variant={currentModelUrl ? "outline" : "ghost"}
                      size="sm"
                      onClick={handleExportModel}
                      className="w-full justify-start text-xs h-8"
                      disabled={!currentModelUrl}
                      title={
                        currentModelUrl
                          ? "Download configured model"
                          : "No model loaded"
                      }
                    >
                      <Package2 className="w-3 h-3 mr-2" />
                      Export Model (GLB)
                    </Button>
                    <div className="text-[10px] text-muted-foreground px-2 py-1 bg-yellow-500/5 rounded">
                      Additional formats (OBJ, FBX) planned — contact us if you
                      need a specific export.
                    </div>
                  </div>

                  {/* Import Preset Section */}
                  <div className="space-y-2">
                    <label className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8 cursor-pointer"
                      >
                        <Save className="w-3 h-3 mr-2" />
                        Import Preset
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
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
      </div>
    </div>
  );
}

function ResetCameraButton() {
  const cameraControlsRef = useConfiguratorStore(
    (state) => state.cameraControlsRef,
  );

  const handleReset = () => {
    const controls = cameraControlsRef as {
      reset: (enableTransition: boolean) => void;
    } | null;
    if (controls) {
      // Reset to default position
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
