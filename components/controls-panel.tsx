"use client";

import type React from "react";

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
} from "lucide-react";
import { MaterialEditor } from "./material-editor";
import { UploadPanel } from "./upload-panel";
import { UVEditor } from "./uv-editor";
import { Button } from "./ui/button";

export function ControlsPanel() {
  const [activeTab, setActiveTab] = useState<
    "upload" | "materials" | "texture" | "view" | "export"
  >("upload");
  const showGrid = useConfiguratorStore((state) => state.showGrid);
  const toggleGrid = useConfiguratorStore((state) => state.toggleGrid);
  const exportPreset = useConfiguratorStore((state) => state.exportPreset);
  const importPreset = useConfiguratorStore((state) => state.importPreset);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );

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
            className="w-full transition-all"
          >
            <Palette className="w-4 h-4 mr-2" />
            Materials
          </Button>
          <Button
            variant={activeTab === "texture" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("texture")}
            className="w-full transition-all"
          >
            <Paintbrush className="w-4 h-4 mr-2" />
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
            className="w-full transition-all col-span-2"
          >
            <Package2 className="w-4 h-4 mr-2" />
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
        {activeTab === "texture" && <UVEditor />}
        {activeTab === "export" && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Scene Controls</h3>
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
                <ResetCameraButton />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScreenshot}
                  className="w-full justify-start bg-transparent"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Screenshot
                </Button>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <h3 className="font-semibold mb-3">Export Options</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Preview or copy your preset JSON before downloading. Model export
                  will be disabled until a model is loaded.
                </p>

                <div className="grid grid-cols-3 gap-2">
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
                    className="w-full justify-center col-span-1"
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
                    className="w-full justify-center col-span-1"
                  >
                    Preview
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="w-full justify-center col-span-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button
                  variant={currentModelUrl ? "outline" : "ghost"}
                  size="sm"
                  onClick={handleExportModel}
                  className="w-full justify-start bg-transparent"
                  disabled={!currentModelUrl}
                  title={currentModelUrl ? "Download configured model" : "No model loaded"}
                >
                  <Package2 className="w-4 h-4 mr-2" />
                  Export Model (GLB)
                </Button>

                <label className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start cursor-pointer bg-transparent"
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
