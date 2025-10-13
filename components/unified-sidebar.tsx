"use client";

import { useState, useRef } from "react";
import { useConfiguratorStore } from "@/lib/store";
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
} from "lucide-react";
import { MaterialEditor } from "./material-editor";
import { AIImageGenerator } from "./ai-image-generator";
import { OnboardingInfoButton } from "./onboarding-info-button";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function UnifiedSidebar() {
  const [activeTab, setActiveTab] = useState<"materials" | "texture" | "view">(
    "materials",
  );
  const [isRecording, setIsRecording] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(true);
  const [sceneOpen, setSceneOpen] = useState(true);
  const [imageOpen, setImageOpen] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiImageOpen, setAiImageOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
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

  return (
    <div className="h-full flex flex-col bg-card w-full">
      {/* Header with Model Selector */}
      <div className="p-4 border-b border-border/50 space-y-3 bg-gradient-to-b from-card to-card/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">3D Configurator</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Customize your model
            </p>
          </div>
          <OnboardingInfoButton />
        </div>

        {/* Model Dropdown */}
        <div data-tour="model-loader">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Select Model
          </label>
          <Select
            value={selectedProductId || undefined}
            onValueChange={setSelectedProduct}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a model..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant={activeTab === "materials" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("materials")}
            className="w-full transition-all flex-col h-auto py-2"
          >
            <Palette className="w-4 h-4 mb-1" />
            <span className="text-xs">Materials</span>
          </Button>
          <Button
            variant={activeTab === "texture" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("texture")}
            className="w-full transition-all flex-col h-auto py-2"
          >
            <Paintbrush className="w-4 h-4 mb-1" />
            <span className="text-xs">Texture</span>
          </Button>
          <Button
            variant={activeTab === "view" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("view")}
            className="w-full transition-all flex-col h-auto py-2"
          >
            <Camera className="w-4 h-4 mb-1" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "materials" && (
          <div className="p-4">
            <MaterialEditor />
          </div>
        )}
        {activeTab === "texture" && (
          <div className="p-4 space-y-4">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                BETA - Phase 2
              </div>
              <h3 className="font-semibold text-lg">UV Map Export</h3>
              <p className="text-sm text-muted-foreground">
                Download the complete UV map of your 3D model
              </p>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Paintbrush className="w-4 h-4" />
                <span>UV texture mapping will be available in Phase 2</span>
              </div>
              <Button
                onClick={handleDownloadUVMap}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download UV Map
              </Button>
            </div>

            <div className="border border-border/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Coming in Phase 2:</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Custom texture painting</li>
                <li>Logo and text placement</li>
                <li>Pattern overlays</li>
                <li>Advanced UV editing tools</li>
              </ul>
            </div>
          </div>
        )}
        {activeTab === "view" && (
          <div className="p-4 space-y-3">
            {/* Camera Controls */}
            <Collapsible open={cameraOpen} onOpenChange={setCameraOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/50 rounded-md transition-colors">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Camera Controls
                </h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${cameraOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2" data-tour="camera-angles">
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
                <ResetCameraButton />
                <Button
                  variant={autoRotate ? "default" : "outline"}
                  size="sm"
                  onClick={handleAutoRotate}
                  className="w-full justify-start"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {autoRotate ? "Stop Auto-Rotate" : "Start Auto-Rotate"}
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Scene Options */}
            <Collapsible open={sceneOpen} onOpenChange={setSceneOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/50 rounded-md transition-colors">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Scene Options
                </h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${sceneOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
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
                <div className="text-[10px] text-muted-foreground px-2 py-1 bg-yellow-500/5 rounded">
                  More scene options coming in Phase 2
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* AI Image Generator */}
            <Collapsible open={aiImageOpen} onOpenChange={setAiImageOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/50 rounded-md transition-colors">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Image Generator
                </h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${aiImageOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <AIImageGenerator />
              </CollapsibleContent>
            </Collapsible>

            {/* Image Export */}
            <Collapsible open={imageOpen} onOpenChange={setImageOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/50 rounded-md transition-colors">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  Export Images
                </h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${imageOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
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
              </CollapsibleContent>
            </Collapsible>

            {/* Video Export */}
            <Collapsible open={videoOpen} onOpenChange={setVideoOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/50 rounded-md transition-colors">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Export Video
                </h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${videoOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {!isRecording ? (
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
              </CollapsibleContent>
            </Collapsible>

            {/* Model Export */}
            <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/50 rounded-md transition-colors">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package2 className="w-4 h-4" />
                  Export Model & Presets
                </h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${exportOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="w-full justify-start"
                  data-tour="export-options"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Preset (JSON)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportModel}
                  className="w-full justify-start"
                >
                  <Package2 className="w-4 h-4 mr-2" />
                  Export Model (GLB)
                </Button>
                <label className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Import Preset
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                <div className="text-[10px] text-muted-foreground px-2 py-1 bg-yellow-500/5 rounded">
                  Additional formats (OBJ, FBX, GLTF) coming in Phase 2
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
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
