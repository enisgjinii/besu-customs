"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, X, Type, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface UVMapViewerProps {
  uvMapUrl: string | null;
  sectionName?: string;
  onClose: () => void;
  onApply?: (editedTextureUrl: string) => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

interface ImageElement {
  id: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function UVMapViewer({
  uvMapUrl,
  sectionName,
  onClose,
  onApply,
}: UVMapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

  // Text controls
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(48);

  // Load base UV map
  useEffect(() => {
    if (!uvMapUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setBaseImage(img);
      setIsLoading(false);
      renderCanvas();
    };
    img.onerror = () => {
      console.error("Failed to load UV map");
      setIsLoading(false);
    };
    img.src = uvMapUrl;
  }, [uvMapUrl]);

  // Render canvas with base image + text + images
  const renderCanvas = () => {
    if (!canvasRef.current || !baseImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match base image
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;

    // Clear and draw base UV map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);

    // Draw all images
    imageElements.forEach((elem) => {
      ctx.drawImage(elem.img, elem.x, elem.y, elem.width, elem.height);
    });

    // Draw all text
    textElements.forEach((elem) => {
      ctx.font = `${elem.fontSize}px Arial`;
      ctx.fillStyle = elem.color;
      ctx.fillText(elem.text, elem.x, elem.y);
    });
  };

  // Re-render when elements change
  useEffect(() => {
    renderCanvas();
  }, [baseImage, textElements, imageElements]);

  const handleAddText = () => {
    if (!newText.trim()) return;

    const id = `text-${Date.now()}`;
    setTextElements([
      ...textElements,
      {
        id,
        text: newText,
        x: 100,
        y: 100,
        fontSize,
        color: textColor,
      },
    ]);
    setNewText("");
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const id = `image-${Date.now()}`;
        setImageElements([
          ...imageElements,
          {
            id,
            img,
            x: 100,
            y: 100,
            width: img.width,
            height: img.height,
          },
        ]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    setTextElements(textElements.filter((el) => el.id !== selectedElementId));
    setImageElements(imageElements.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on any text element
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    for (const elem of textElements) {
      ctx.font = `${elem.fontSize}px Arial`;
      const metrics = ctx.measureText(elem.text);
      if (
        x >= elem.x &&
        x <= elem.x + metrics.width &&
        y >= elem.y - elem.fontSize &&
        y <= elem.y
      ) {
        setSelectedElementId(elem.id);
        return;
      }
    }

    // Check if clicked on any image element
    for (const elem of imageElements) {
      if (
        x >= elem.x &&
        x <= elem.x + elem.width &&
        y >= elem.y &&
        y <= elem.y + elem.height
      ) {
        setSelectedElementId(elem.id);
        return;
      }
    }

    setSelectedElementId(null);
  };

  const handleApplyTexture = () => {
    if (!canvasRef.current) return;
    // Export flipped horizontally and vertically for Babylon
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.save();
      tempCtx.scale(-1, -1);
      tempCtx.drawImage(
        canvas,
        -canvas.width,
        -canvas.height,
        canvas.width,
        canvas.height,
      );
      tempCtx.restore();
      const dataUrl = tempCanvas.toDataURL("image/png");
      onApply?.(dataUrl);
      onClose();
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    const fileName = sectionName
      ? `uv-map-${sectionName.toLowerCase().replace(/\s+/g, "-")}.png`
      : "uv-map.png";

    // Export flipped horizontally and vertically for Babylon
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.save();
      tempCtx.scale(-1, -1);
      tempCtx.drawImage(
        canvas,
        -canvas.width,
        -canvas.height,
        canvas.width,
        canvas.height,
      );
      tempCtx.restore();
      link.href = tempCanvas.toDataURL("image/png");
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!uvMapUrl) return null;

  return (
    <Dialog open={!!uvMapUrl} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>UV Map Editor {sectionName ? `- ${sectionName}` : ""}</span>
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

        <div className="flex-1 flex gap-4">
          {/* Left Panel - Controls */}
          <div className="w-80 space-y-4 overflow-auto border rounded-md p-4 bg-gray-50">
            <div className="space-y-2">
              <h3 className="font-semibold">Add Text</h3>
              <Input
                placeholder="Enter text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddText()}
              />
              <div className="space-y-2">
                <Label>Font Size: {fontSize}px</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={(v) => setFontSize(v[0])}
                  min={12}
                  max={200}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
              <Button onClick={handleAddText} className="w-full gap-2">
                <Type className="h-4 w-4" />
                Add Text
              </Button>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">Add Image</h3>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAddImage}
                className="cursor-pointer"
              />
            </div>

            {selectedElementId && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold">Selected Element</h3>
                <Button
                  onClick={handleDeleteElement}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">Elements</h3>
              <div className="text-sm text-gray-600">
                {textElements.length} text, {imageElements.length} images
              </div>
            </div>
          </div>

          {/* Right Panel - Canvas */}
          <div className="flex-1 relative border rounded-md overflow-hidden bg-gray-50">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="max-w-full max-h-full border border-gray-200 cursor-crosshair"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Click on elements to select them
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            {onApply && (
              <Button onClick={handleApplyTexture} className="gap-2">
                Apply to Model
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
