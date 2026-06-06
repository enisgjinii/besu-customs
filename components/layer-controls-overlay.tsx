"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  RotateCcw,
  Trash2,
  Maximize2,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Video,
  Loader2,
  Pin,
  PinOff,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

/**
 * LayerControlsOverlay - Floating control buttons that appear on the 3D viewer
 * when a text/image layer is selected. Provides quick access to:
 * - Duplicate: Clone the selected layer
 * - Arrange: Bring Forward/Back, Front/Back
 * - Rotate: Toggle rotation mode (future)
 * - Delete: Remove the selected layer
 * - Resize: Toggle resize mode (future)
 */
export function LayerControlsOverlay() {
  const { isMobile } = useBreakpoint();
  const selectedTextureLayerId = useConfiguratorStore(
    (s) => s.selectedTextureLayerId,
  );
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const duplicateTextureLayer = useConfiguratorStore(
    (s) => s.duplicateTextureLayer,
  );
  const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (s) => s.setSelectedTextureLayerId,
  );
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
  const moveLayer = useConfiguratorStore((s) => s.moveLayer);
  const autoRotate = useConfiguratorStore((s) => s.autoRotate);
  const setAutoRotate = useConfiguratorStore((s) => s.setAutoRotate);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<null | "webm" | "mp4">(null);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Find the selected layer
  const selectedLayer = textureLayers.find(
    (l) => l.id === selectedTextureLayerId,
  );

  // Don't render if no layer is selected
  if (!selectedLayer) return null;

  const isExpanded = isPinnedOpen || isHovered;
  const isExporting = isGeneratingGif || !!isGeneratingVideo;
  const selectedLayerName = selectedLayer.name || selectedLayer.type;
  const selectedLayerLabel =
    selectedLayer.type === "text"
      ? selectedLayerName.startsWith("Text:") ||
        selectedLayerName.startsWith("Team Name:")
        ? selectedLayerName
        : `Text: ${selectedLayerName}`
      : `Layer: ${selectedLayerName}`;

  const handleDuplicate = () => {
    if (selectedTextureLayerId) {
      duplicateTextureLayer(selectedTextureLayerId);
    }
  };

  const handleDelete = () => {
    if (selectedTextureLayerId) {
      removeTextureLayer(selectedTextureLayerId);
    }
  };

  const handleRotateLeft = () => {
    if (selectedTextureLayerId && selectedLayer) {
      const currentRotation = selectedLayer.rotation?.[2] || 0;
      updateTextureLayer(selectedTextureLayerId, {
        rotation: [0, 0, currentRotation - Math.PI / 12], // Rotate -15 degrees
      });
    }
  };

  const handleFlipX = () => {
    if (selectedTextureLayerId && selectedLayer) {
      updateTextureLayer(selectedTextureLayerId, {
        flipX: !selectedLayer.flipX,
      });
    }
  };

  const handleDeselect = () => {
    setSelectedTextureLayerId(null);
  };

  const handleMove = (direction: "forward" | "backward" | "front" | "back") => {
    if (selectedTextureLayerId) {
      moveLayer(selectedTextureLayerId, direction);
    }
  };

  const waitForRender = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

  const handleExport360Gif = async () => {
    if (isGeneratingGif || isGeneratingVideo) return;

    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error("Canvas not found");
      return;
    }

    const modelApi = (window as any).__besuModelExportApi as
      | { getRotationY: () => number; setRotationY: (value: number) => void }
      | undefined;

    if (!modelApi?.getRotationY || !modelApi?.setRotationY) {
      toast.error("Model is not ready for GIF export");
      return;
    }

    const originalAutoRotate = autoRotate;
    const originalRotation = modelApi.getRotationY();

    setIsGeneratingGif(true);
    toast.info("Exporting 360° GIF...");

    try {
      setAutoRotate(false);
      await waitForRender();

      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
      const frameCount = 72;
      const fps = 18;
      const delay = Math.max(20, Math.round(1000 / fps));
      const sourceWidth = Math.max(1, canvas.width);
      const sourceHeight = Math.max(1, canvas.height);
      const maxCaptureSide = 1024;
      const scale = Math.min(1, maxCaptureSide / Math.max(sourceWidth, sourceHeight));
      const captureWidth = Math.max(1, Math.round(sourceWidth * scale));
      const captureHeight = Math.max(1, Math.round(sourceHeight * scale));

      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = captureWidth;
      captureCanvas.height = captureHeight;
      const captureCtx = captureCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!captureCtx) {
        throw new Error("Failed to create GIF canvas");
      }
      captureCtx.imageSmoothingEnabled = true;
      captureCtx.imageSmoothingQuality = "high";

      const gif = GIFEncoder();

      for (let i = 0; i < frameCount; i++) {
        const t = frameCount > 1 ? i / (frameCount - 1) : 1;
        modelApi.setRotationY(originalRotation + t * Math.PI * 2);
        await waitForRender();

        captureCtx.clearRect(0, 0, captureWidth, captureHeight);
        captureCtx.drawImage(canvas, 0, 0, captureWidth, captureHeight);

        const rgba = captureCtx.getImageData(0, 0, captureWidth, captureHeight).data;
        const palette = quantize(rgba, 256);
        const index = applyPalette(rgba, palette);
        gif.writeFrame(index, captureWidth, captureHeight, {
          palette,
          delay,
          repeat: 0,
        });
      }

      gif.finish();
      const bytes = gif.bytes();
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `model-360-${Date.now()}.gif`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("360° GIF exported");
    } catch (error) {
      console.error("GIF export failed:", error);
      toast.error(
        `GIF export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      modelApi.setRotationY(originalRotation);
      setAutoRotate(originalAutoRotate);
      setIsGeneratingGif(false);
    }
  };

  const handleExport360Video = async (format: "webm" | "mp4") => {
    if (isGeneratingGif || isGeneratingVideo) return;

    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error("Canvas not found");
      return;
    }

    if (!canvas.captureStream) {
      toast.error("Video export is not supported in this browser");
      return;
    }

    const modelApi = (window as any).__besuModelExportApi as
      | { getRotationY: () => number; setRotationY: (value: number) => void }
      | undefined;

    if (!modelApi?.getRotationY || !modelApi?.setRotationY) {
      toast.error("Model is not ready for video export");
      return;
    }

    const pickMimeType = (target: "webm" | "mp4") => {
      const candidates =
        target === "webm"
          ? [
              "video/webm;codecs=vp9",
              "video/webm;codecs=vp8",
              "video/webm",
            ]
          : [
              "video/mp4;codecs=h264",
              "video/mp4;codecs=avc1.42E01E",
              "video/mp4",
            ];

      return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || null;
    };

    const mimeType = pickMimeType(format);
    if (!mimeType) {
      toast.error(
        format === "mp4"
          ? "MP4 export is not supported in this browser. Try WebM."
          : "WebM export is not supported in this browser.",
      );
      return;
    }

    const originalAutoRotate = autoRotate;
    const originalRotation = modelApi.getRotationY();

    setIsGeneratingVideo(format);
    toast.info(`Exporting 360° ${format.toUpperCase()}...`);

    try {
      setAutoRotate(false);
      await waitForRender();

      const fps = 30;
      const durationMs = 5000;
      const stream = canvas.captureStream(fps);
      const chunks: BlobPart[] = [];

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const recorderStopped = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = (event) => {
          reject((event as any)?.error || new Error("Recorder failed"));
        };
      });

      recorder.start(100);

      await new Promise<void>((resolve) => {
        const start = performance.now();

        const step = (now: number) => {
          const t = Math.min((now - start) / durationMs, 1);
          modelApi.setRotationY(originalRotation + t * Math.PI * 2);

          if (t < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(step);
      });

      recorder.stop();
      await recorderStopped;
      stream.getTracks().forEach((track) => track.stop());

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `model-360-${Date.now()}.${format}`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`360° ${format.toUpperCase()} exported`);
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      toast.error(
        `${format.toUpperCase()} export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      modelApi.setRotationY(originalRotation);
      setAutoRotate(originalAutoRotate);
      setIsGeneratingVideo(null);
    }
  };

  return (
    <div
      className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] -translate-x-1/2 z-50 pointer-events-auto max-w-[calc(100%-1rem)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider delayDuration={120}>
      <AnimatePresence mode="wait" initial={false}>
        {!isExpanded ? (
          <motion.div
            key="collapsed-toolbar"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="bg-white/95 dark:bg-gray-900/95 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="px-1 text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[140px] truncate">
              {selectedLayerLabel}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsPinnedOpen(true)}
                  title="Pin controls open"
                >
                  <Pin className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Pin controls open</TooltipContent>
            </Tooltip>
          </motion.div>
        ) : (
          <motion.div
            key="expanded-toolbar"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-2 flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar"
          >
        {/* Layer name indicator */}
        <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
          {selectedLayer.name || selectedLayer.type}
        </span>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Arrange Controls */}
        <div className="flex gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-md rounded-r-none",
                  isMobile ? "h-9 w-9" : "h-10 w-8",
                )}
                onClick={() => handleMove("front")}
                title="Bring to Front"
                aria-label="Bring selected layer to front"
              >
                <ChevronsUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Bring to Front</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-none border-l border-r border-gray-100 dark:border-gray-800",
                  isMobile ? "h-9 w-9" : "h-10 w-8",
                )}
                onClick={() => handleMove("forward")}
                title="Bring Forward"
                aria-label="Bring selected layer forward"
              >
                <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Bring Forward</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-none border-r border-gray-100 dark:border-gray-800",
                  isMobile ? "h-9 w-9" : "h-10 w-8",
                )}
                onClick={() => handleMove("backward")}
                title="Send Backward"
                aria-label="Send selected layer backward"
              >
                <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Send Backward</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-md rounded-l-none",
                  isMobile ? "h-9 w-9" : "h-10 w-8",
                )}
                onClick={() => handleMove("back")}
                title="Send to Back"
                aria-label="Send selected layer to back"
              >
                <ChevronsDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Send to Back</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Duplicate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 active:scale-95 transition-transform"
              onClick={handleDuplicate}
              title="Duplicate"
              aria-label="Duplicate selected layer"
            >
              <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>Duplicate</TooltipContent>
        </Tooltip>

        {/* Rotate Left */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-transform"
              onClick={handleRotateLeft}
              title="Rotate"
              aria-label="Rotate selected layer left"
            >
              <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>Rotate -15°</TooltipContent>
        </Tooltip>

        {/* Flip/Resize */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-transform"
              onClick={handleFlipX}
              title="Flip Horizontal"
              aria-label="Flip selected layer horizontally"
            >
              <Maximize2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>Flip Horizontal</TooltipContent>
        </Tooltip>

        {/* Export Dropdown (GIF/WebM/MP4) */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 active:scale-95 transition-transform"
                  title="Export 360"
                  disabled={isExporting}
                  aria-label="Open 360 export options"
                >
                  {isExporting ? (
                    <Loader2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  ) : (
                    <Film className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              {isExporting ? "Exporting..." : "Export 360"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="center" sideOffset={8} className="min-w-[170px]">
            <DropdownMenuItem onClick={handleExport360Gif} disabled={isExporting}>
              <Video className="mr-2 h-4 w-4 text-emerald-600" />
              Export GIF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport360Video("webm")}
              disabled={isExporting}
            >
              <Film className="mr-2 h-4 w-4 text-cyan-600" />
              Export WebM
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport360Video("mp4")}
              disabled={isExporting}
            >
              <Video className="mr-2 h-4 w-4 text-indigo-600" />
              Export MP4
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-transform"
              onClick={handleDelete}
              title="Delete"
              aria-label="Delete selected layer"
            >
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>Delete Layer</TooltipContent>
        </Tooltip>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Pin / Unpin */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform"
              onClick={() => setIsPinnedOpen((prev) => !prev)}
              title={isPinnedOpen ? "Unpin" : "Pin open"}
              aria-label={isPinnedOpen ? "Unpin overlay controls" : "Pin overlay controls"}
            >
              {isPinnedOpen ? (
                <PinOff className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Pin className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>{isPinnedOpen ? "Unpin" : "Pin Open"}</TooltipContent>
        </Tooltip>

        {/* Close/Deselect */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform"
              onClick={handleDeselect}
              title="Deselect"
              aria-label="Deselect active layer"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>Deselect</TooltipContent>
        </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
      </TooltipProvider>
    </div>
  );
}
