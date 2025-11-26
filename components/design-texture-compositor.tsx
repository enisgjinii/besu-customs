"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlacementGuide } from "@/components/placement-guide";
import { 
  Type, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  Plus,
  Palette,
} from "lucide-react";

// Design element types
interface TextDesign {
  id: string;
  type: 'text';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  textStyle: {
    font: string;
    size: number;
    color: string;
    weight: string;
  };
}

interface ImageDesign {
  id: string;
  type: 'image';
  src: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
}

type Design = TextDesign | ImageDesign;

interface DesignTextureCompositorProps {
  textureWidth?: number;
  textureHeight?: number;
}

export function DesignTextureCompositor({
  textureWidth = 2048,
  textureHeight = 2048,
}: DesignTextureCompositorProps) {
  const completeUVMap = useConfiguratorStore((s) => s.completeUVMap);
  const setGlobalCustomTexture = useConfiguratorStore((s) => s.setGlobalCustomTexture);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uvImage, setUvImage] = useState<HTMLImageElement | null>(null);
  
  // Text input state
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Arial");

  // Load UV map image
  useEffect(() => {
    if (!completeUVMap) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setUvImage(img);
    };
    img.src = completeUVMap;
  }, [completeUVMap]);

  // Render texture to canvas and update 3D model
  const renderTexture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = textureWidth;
    canvas.height = textureHeight;
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw each design element
    designs.forEach((design) => {
      ctx.save();
      
      // Convert percentage position to canvas coordinates
      const centerX = (design.position.x / 100) * canvas.width + (design.size.width / 100) * canvas.width / 2;
      const centerY = (design.position.y / 100) * canvas.height + (design.size.height / 100) * canvas.height / 2;
      
      // Apply transformations
      ctx.translate(centerX, centerY);
      ctx.rotate((design.rotation * Math.PI) / 180);
      
      if (design.type === 'text') {
        // Render text
        const textDesign = design as TextDesign;
        const scaledFontSize = (textDesign.textStyle.size / 100) * canvas.height * 0.1;
        
        ctx.font = `${textDesign.textStyle.weight} ${scaledFontSize}px ${textDesign.textStyle.font}`;
        ctx.fillStyle = textDesign.textStyle.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textDesign.content, 0, 0);
      } else if (design.type === 'image') {
        // Render image
        const imageDesign = design as ImageDesign;
        const img = new Image();
        img.src = imageDesign.src;
        
        if (img.complete) {
          const scaledWidth = (imageDesign.size.width / 100) * canvas.width;
          const scaledHeight = (imageDesign.size.height / 100) * canvas.height;
          
          ctx.drawImage(
            img,
            -scaledWidth / 2,
            -scaledHeight / 2,
            scaledWidth,
            scaledHeight
          );
        }
      }
      
      ctx.restore();
    });
    
    // Export as data URL and update 3D model
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setGlobalCustomTexture(dataUrl);
  }, [designs, textureWidth, textureHeight, setGlobalCustomTexture]);

  // Re-render when designs change
  useEffect(() => {
    renderTexture();
  }, [designs, renderTexture]);

  // Add text design
  const handleAddText = useCallback(() => {
    if (!newText.trim()) return;
    
    const newDesign: TextDesign = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: newText,
      position: { x: 35, y: 35 },
      size: { width: 30, height: 15 },
      rotation: 0,
      textStyle: {
        font: fontFamily,
        size: fontSize,
        color: textColor,
        weight: 'normal',
      },
    };
    
    setDesigns((prev) => [...prev, newDesign]);
    setSelectedId(newDesign.id);
    setNewText("");
  }, [newText, fontFamily, fontSize, textColor]);

  // Add image design
  const handleAddImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newDesign: ImageDesign = {
        id: `image-${Date.now()}`,
        type: 'image',
        src: event.target?.result as string,
        position: { x: 30, y: 30 },
        size: { width: 40, height: 40 },
        rotation: 0,
      };
      
      setDesigns((prev) => [...prev, newDesign]);
      setSelectedId(newDesign.id);
    };
    reader.readAsDataURL(file);
    
    e.target.value = "";
  }, []);

  // Update design position
  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setDesigns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, position } : d))
    );
  }, []);

  // Update design size
  const handleSizeChange = useCallback((id: string, size: { width: number; height: number }) => {
    setDesigns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, size } : d))
    );
  }, []);

  // Update design rotation
  const handleRotationChange = useCallback((id: string, rotation: number) => {
    setDesigns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, rotation } : d))
    );
  }, []);

  // Delete design
  const handleDelete = useCallback((id: string) => {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // Download texture
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'uv-texture.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Clear all designs
  const handleClearAll = useCallback(() => {
    setDesigns([]);
    setSelectedId(null);
  }, []);

  if (!completeUVMap) {
    return (
      <Card className="p-8 text-center">
        <Palette className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">No UV map available</p>
        <p className="text-xs text-muted-foreground">Load a 3D model to start designing</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-1">
            <Type className="w-4 h-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>Add Text</Label>
              <Input
                placeholder="Enter your text..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                className="mt-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Size: {fontSize}px</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={(v) => setFontSize(v[0])}
                  min={12}
                  max={200}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="mt-2 h-10 cursor-pointer"
                />
              </div>
            </div>
            
            <Button onClick={handleAddText} className="w-full" disabled={!newText.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Text
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="mt-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAddImage}
                className="mt-2 cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload logos, graphics, or photos to add to your design
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" className="flex-1" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleClearAll} variant="outline" className="flex-1" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </Card>

      {/* Design canvas with UV map background */}
      <Card className="p-4">
        <div
          ref={containerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
          style={{ 
            aspectRatio: '1/1',
            backgroundImage: uvImage ? `url(${completeUVMap})` : undefined,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Design elements */}
          {designs.map((design) => (
            <PlacementGuide
              key={design.id}
              id={design.id}
              position={design.position}
              size={design.size}
              rotation={design.rotation}
              isSelected={selectedId === design.id}
              onSelect={() => setSelectedId(design.id)}
              onPositionChange={(pos) => handlePositionChange(design.id, pos)}
              onSizeChange={(size) => handleSizeChange(design.id, size)}
              onRotationChange={(rot) => handleRotationChange(design.id, rot)}
              onDelete={() => handleDelete(design.id)}
              containerRef={containerRef}
            >
              {design.type === 'text' ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    fontFamily: (design as TextDesign).textStyle.font,
                    fontSize: `${(design as TextDesign).textStyle.size}px`,
                    color: (design as TextDesign).textStyle.color,
                    fontWeight: (design as TextDesign).textStyle.weight,
                  }}
                >
                  {(design as TextDesign).content}
                </div>
              ) : (
                <img
                  src={(design as ImageDesign).src}
                  alt="Design"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              )}
            </PlacementGuide>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🎨 Drag to move • Corner controls to rotate, resize, delete • Real-time 3D preview
        </p>
      </Card>

      {/* Hidden canvas for texture generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
