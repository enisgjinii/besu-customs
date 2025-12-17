"use client";

import type React from "react";

declare global {
  interface Window {
    mediaRecorder?: MediaRecorder;
  }
}

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import {
  Grid3x3,
  Save,
  UploadIcon,
  Download,
  Palette,
  Paintbrush,
  Camera,
  Package2,
  RotateCcw,
  FileJson,
  Image,
  Video,
  Bot,
  Aperture,
  Box,
} from "lucide-react";
import { MaterialEditor } from "./material-editor";
import { UploadPanel } from "./upload-panel";
import { UVTextureEditor } from "./uv-texture-editor";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { AIImageGenerator } from "./ai-image-generator";

export function ControlsPanel() {
  const [activeTab, setActiveTab] = useState<
    "upload" | "materials" | "texture" | "view" | "export"
  >("upload");
  const [exportSubTab, setExportSubTab] = useState<
    "camera" | "scene" | "ai" | "images" | "video" | "model"
  >("camera");
  const [textureSubTab, setTextureSubTab] = useState<"uv" | "ai">("uv");
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
  const showBoundingBox = useConfiguratorStore(
    (state) => state.showBoundingBox,
  );
  const toggleBoundingBox = useConfiguratorStore(
    (state) => state.toggleBoundingBox,
  );
  const exportPreset = useConfiguratorStore((state) => state.exportPreset);
  const importPreset = useConfiguratorStore((state) => state.importPreset);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);

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
    // Export the modified model with textures
    const link = document.createElement("a");
    link.download = "configured-model.glb";
    link.href = currentModelUrl;
    link.click();
  };

  const handleScreenshot = () => {
    // Trigger screenshot from the 3D scene
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "screenshot.png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleStartRecording = async () => {
    // Enable auto-rotation when recording starts
    setAutoRotate(true);

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
      const fileExtension = "webm";

      // Try WebM format
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

      const mediaRecorder = new MediaRecorder(stream, options);
      const recordedChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, {
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
        // Disable auto-rotation when recording stops
        setAutoRotate(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording failed");
        // Disable auto-rotation if recording fails
        setAutoRotate(false);
      };

      mediaRecorder.start(100);
      // Store reference to stop recording later
      window.mediaRecorder = mediaRecorder;
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert(
        `Video recording failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Disable auto-rotation if recording fails
      setAutoRotate(false);
    }
  };

  const handleStopRecording = () => {
    const mediaRecorder = window.mediaRecorder;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card w-full">
      <div className="p-4 border-b border-border/50 space-y-3 bg-gradient-to-b from-card to-card/50 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Controls</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Customize your 3D model
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activeTab === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("upload")}
            className="w-full transition-all"
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant={activeTab === "materials" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("materials")}
            className="w-full justify-start gap-2 transition-all"
          >
            <Palette className="w-4 h-4" />
            Materials
          </Button>
          <Button
            variant={activeTab === "texture" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("texture")}
            className="w-full justify-start gap-2 transition-all"
          >
            <Paintbrush className="w-4 h-4" />
            Texture
          </Button>
          <Button
            variant={activeTab === "view" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("view")}
            className="w-full transition-all"
          >
            <Camera className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant={activeTab === "export" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("export")}
            className="w-full justify-start gap-2 transition-all col-span-2"
          >
            <Package2 className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "upload" && (
          <div className="p-4">
            <UploadPanel />
          </div>
        )}
        {activeTab === "materials" && (
          <div className="p-4">
            <MaterialEditor />
          </div>
        )}
        {activeTab === "texture" && (
          <div className="p-4">
            <Tabs
              value={textureSubTab}
              onValueChange={(v) => setTextureSubTab(v as "uv" | "ai")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="uv"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Image className="w-4 h-4" />
                  <span>UV</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Gen</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="uv" className="mt-4">
                <UVTextureEditor />
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <h3 className="font-semibold mb-3">AI Texture Generator</h3>
                <AIImageGenerator />
              </TabsContent>
            </Tabs>
          </div>
        )}
        {activeTab === "export" && (
          <div className="p-4">
            {/* Nested Tabs for Export Options */}
            <Tabs
              value={exportSubTab}
              onValueChange={(value) =>
                setExportSubTab(
                  value as
                    | "camera"
                    | "scene"
                    | "ai"
                    | "images"
                    | "video"
                    | "model",
                )
              }
            >
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger
                  value="camera"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera</span>
                </TabsTrigger>
                <TabsTrigger
                  value="scene"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span>Scene</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Bot className="w-4 h-4" />
                  <span>AI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Image className="w-4 h-4" />
                  <span>Images</span>
                </TabsTrigger>
                <TabsTrigger
                  value="video"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </TabsTrigger>
                <TabsTrigger
                  value="model"
                  className="flex flex-col items-center gap-1 text-xs py-3"
                >
                  <Package2 className="w-4 h-4" />
                  <span>Model</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-4 space-y-2">
                <h3 className="font-semibold mb-3">Camera Controls</h3>
                <div className="space-y-2">
                  <ResetCameraButton />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScreenshot}
                    className="w-full justify-start bg-transparent"
                  >
                    <Aperture className="w-4 h-4 mr-2" />
                    Take Screenshot
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="scene" className="mt-4 space-y-2">
                <h3 className="font-semibold mb-3">Scene Options</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleGrid}
                    className="w-full justify-start bg-transparent"
                  >
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    {showGrid ? "Hide Grid" : "Show Grid"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleBoundingBox}
                    className="w-full justify-start bg-transparent"
                  >
                    <Box className="w-4 h-4 mr-2" />
                    {showBoundingBox
                      ? "Hide Bounding Box"
                      : "Show Bounding Box"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRotate(true)}
                    className="w-full justify-start bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Enable Auto-Rotate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRotate(false)}
                    className="w-full justify-start bg-transparent"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Disable Auto-Rotate
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <h3 className="font-semibold mb-3">AI Image Generator</h3>
                <AIImageGenerator />
              </TabsContent>

              <TabsContent value="images" className="mt-4 space-y-2">
                <h3 className="font-semibold mb-3">Export Images</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScreenshot}
                    className="w-full justify-start bg-transparent"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Export PNG Screenshot
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-4 space-y-2">
                <h3 className="font-semibold mb-3">Export Video</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartRecording}
                    className="w-full justify-start bg-transparent"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopRecording}
                    className="w-full justify-start bg-transparent"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="model" className="mt-4 space-y-2">
                <h3 className="font-semibold mb-3">Export Model & Presets</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Export your configured 3D model and presets. Model export will
                  be disabled until a model is loaded.
                </p>

                <div className="space-y-2">
                  <Button
                    variant={currentModelUrl ? "outline" : "ghost"}
                    size="sm"
                    onClick={handleExportModel}
                    className="w-full justify-start bg-transparent"
                    disabled={!currentModelUrl}
                    title={
                      currentModelUrl
                        ? "Download configured model"
                        : "No model loaded"
                    }
                  >
                    <Package2 className="w-4 h-4 mr-2" />
                    Export Model (GLB)
                  </Button>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="w-full justify-center"
                    >
                      <FileJson className="w-4 h-4 mr-2" />
                      Export Preset
                    </Button>

                    <label className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center cursor-pointer"
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
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

function ResetCameraButton() {
  const cameraControlsRef = useConfiguratorStore(
    (state) => state.cameraControlsRef,
  ) as { reset: () => void } | null;

  const handleReset = () => {
    if (cameraControlsRef) {
      cameraControlsRef.reset();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      className="w-full justify-start bg-transparent"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset Camera
    </Button>
  );
}
