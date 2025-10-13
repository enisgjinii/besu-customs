"use client";

import { Scene } from "@/components/scene";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { 
  PanelLeft, 
  Camera, 
  Download, 
  Video, 
  Square, 
  Save, 
  Share2 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useConfiguratorStore } from "@/lib/store";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const glRef = useConfiguratorStore((state) => state.glRef);
  const currentModelUrl = useConfiguratorStore((state) => state.currentModelUrl);
  const exportPreset = useConfiguratorStore((state) => state.exportPreset);
  const setAutoRotate = useConfiguratorStore((state) => state.setAutoRotate);
  
  // For testing purposes - add a button to trigger the tour

  // Handle mouse events for resizing
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth > 300 && newWidth < 800) { // Min 300px, max 800px
        setSidebarWidth(newWidth);
      }
    }
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    }
    
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const handleScreenshot = () => {
    // Use the canvas element directly instead of calling renderer.render()
    const canvas = document.querySelector('canvas');
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
      let fileExtension = "webm";

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
      navigator.clipboard?.writeText(shareUrl).then(() => {
        alert("Share link copied to clipboard!");
      }).catch(() => {
        // Fallback: show in alert
        alert(`Share this link:\n${shareUrl}`);
      });
    } catch (error) {
      console.error("Failed to generate share link:", error);
      alert("Failed to generate share link");
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden">
      {/* Desktop: Unified Left Sidebar with Resizable Handle */}
      <div className="hidden md:flex h-full" ref={sidebarRef}>
        <aside
          className={`flex-col h-full border-r border-border/50 bg-card transition-all duration-300 ease-in-out ${
            sidebarOpen ? "opacity-100" : "opacity-0 w-0"
          }`}
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
          data-tour="sidebar"
        >
          <div className={`h-full ${sidebarOpen ? "block" : "hidden"}`}>
            <UnifiedSidebar sidebarOpen={sidebarOpen} onToggleSidebar={setSidebarOpen} />
          </div>
        </aside>
        
        {/* Resizable Handle */}
        {sidebarOpen && (
          <div
            className="w-2 cursor-col-resize bg-border/30 hover:bg-primary/30 transition-colors flex items-center justify-center"
            onMouseDown={startResizing}
          >
            <div className="w-0.5 h-8 bg-border/50 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Expand sidebar button when collapsed */}
      {!sidebarOpen && (
        <div className="hidden md:flex flex-col absolute top-4 left-4 z-50 gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
            title="Show sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          
          {/* Additional buttons when sidebar is collapsed */}
          <button
            onClick={handleScreenshot}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
            title="Take screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleExportModel}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
            title="Export model"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
              title="Start recording"
            >
              <Video className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center h-8 w-8 rounded-md bg-red-500/80 backdrop-blur-sm border border-red-500 text-white hover:bg-red-600"
              title="Stop recording"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleSaveAsJSON}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
            title="Save as JSON"
          >
            <Save className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleShareLink}
            className="flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background"
            title="Share link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 3D Viewer */}
      <main className="flex-1 relative min-w-0 pb-20 md:pb-0">
        <Scene />
      </main>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Navigation Tour Target */}

    </div>
  );
}