"use client";

import dynamic from "next/dynamic";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

// Dynamic import for BabylonScene component to prevent static generation issues
const Scene = dynamic(
  () =>
    import("@/components/babylon-scene").then((mod) => ({
      default: mod.BabylonScene,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
  },
);
import {
  Camera,
  Download,
  Video,
  Square,
  Save,
  Upload,
  Settings,
  List,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const exportPreset = useConfiguratorStore((state) => state.exportPreset);
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Removed setSidebarOpen(false) as sidebarOpen state is removed
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleScreenshot = () => {
    // Use the canvas element directly instead of calling renderer.render()
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("Canvas not found");
      return;
    }

    try {
      const dataURL = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `model-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert("Failed to capture screenshot");
    }
  };

  const handleExportModel = () => {
    if (!currentModelUrl) {
      alert("No model loaded");
      return;
    }
    const link = document.createElement("a");
    link.download = "configured-model.glb";
    link.href = currentModelUrl;
    link.click();
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
        // Disable auto-rotation when recording stops
        setAutoRotate(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        alert("Recording failed");
        setIsRecording(false);
        // Disable auto-rotation if recording fails
        setAutoRotate(false);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSaveAsJSON = () => {
    try {
      const json = exportPreset();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "model-preset.json";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save preset:", error);
      alert("Failed to save preset");
    }
  };

  const handleShareLink = () => {
    try {
      const json = exportPreset();
      const base64 = btoa(encodeURIComponent(json));
      const shareUrl = `${window.location.origin}?preset=${base64}`;

      // Copy to clipboard
      navigator.clipboard
        ?.writeText(shareUrl)
        .then(() => {
          alert("Share link copied to clipboard!");
        })
        .catch(() => {
          // Fallback: show in alert
          alert(`Share this link:\n${shareUrl}`);
        });
    } catch (error) {
      console.error("Failed to generate share link:", error);
      alert("Failed to generate share link");
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden overscroll-none">
      {/* Desktop: Unified Left Sidebar */}
      <div
        className={`hidden md:block fixed top-4 left-4 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-[60px]" : "w-[420px]"
        }`}
      >
        <UnifiedSidebar
          sidebarOpen={!sidebarCollapsed}
          onToggleSidebar={(open) => setSidebarCollapsed(!open)}
        />
      </div>

      {/* Main 3D Viewer - Account for sidebar width on desktop */}
      <main
        className={`flex-1 relative min-w-0 pb-20 md:pb-0 transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-[80px]" : "md:pl-[440px]"
        }`}
        style={{ touchAction: 'none' }} /* Prevent default touch actions on 3D canvas area */
      >
        <Scene />
      </main>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Navigation Tour Target */}
    </div>
  );
}
