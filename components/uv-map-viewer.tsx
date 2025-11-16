"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UVMapViewerProps {
  uvMapUrl: string | null;
  sectionName?: string;
  onClose: () => void;
}

export function UVMapViewer({
  uvMapUrl,
  sectionName,
  onClose,
}: UVMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    if (!uvMapUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Store the image data for download
      setImageData(canvas.toDataURL("image/png"));
      setIsLoading(false);
    };

    img.src = uvMapUrl;
  }, [uvMapUrl]);

  const handleDownload = () => {
    if (!imageData) return;

    const link = document.createElement("a");
    const fileName = sectionName
      ? `uv-map-${sectionName.toLowerCase().replace(/\s+/g, "-")}.png`
      : "uv-map.png";

    link.href = imageData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!uvMapUrl) return null;

  return (
    <Dialog open={!!uvMapUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>UV Map {sectionName ? `- ${sectionName}` : ""}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative border rounded-md overflow-hidden bg-gray-50">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full border border-gray-200"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            onClick={handleDownload}
            disabled={isLoading || !imageData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download UV Map
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
