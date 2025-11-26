"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Type, 
  Image as ImageIcon, 
  Trash2, 
  Download, 
  Map, 
  Copy, 
  Palette,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Strikethrough,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMobilePerformance } from "@/hooks/use-mobile-performance";
import { PatternSelector } from "@/components/pattern-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";

// Font options
const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
  { value: "Impact", label: "Impact" },
  { value: "Comic Sans MS", label: "Comic Sans" },
  { value: "Trebuchet MS", label: "Trebuchet" },
  { value: "Arial Black", label: "Arial Black" },
  { value: "Palatino Linotype", label: "Palatino" },
  { value: "Lucida Console", label: "Lucida Console" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Century Gothic", label: "Century Gothic" },
  { value: "Copperplate", label: "Copperplate" },
  { value: "Brush Script MT", label: "Brush Script" },
];

const FONT_WEIGHTS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "100", label: "Thin" },
  { value: "300", label: "Light" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
  { value: "900", label: "Black" },
];

export function UVTextureEditor() {
  const completeUVMap = useConfiguratorStore((s) => s.completeUVMap);
  const setGlobalCustomTexture = useConfiguratorStore(
    (s) => s.setGlobalCustomTexture,
  );
  const setFabricCanvas = useConfiguratorStore((s) => s.setFabricCanvas);
  
  // Mobile performance configuration
  const perfConfig = useMobilePerformance();
  const canvasSize = perfConfig.uvCanvasSize;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const customControlsRef = useRef<any>(null);

  // Text controls - basic
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(perfConfig.isMobile ? 80 : 120);
  const [hasSelection, setHasSelection] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Text controls - advanced
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("normal");
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textShadow, setTextShadow] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("");
  const [textRotation, setTextRotation] = useState(0);

  // Real-time update to 3D model with mobile-optimized debouncing
  const updateTexture = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Skip updates during 3D drag to prevent flickering
    if ((canvas as any)._suppress3DDrag) {
      return;
    }

    // Clear previous timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    // Use longer debounce on mobile for better performance
    const debounceTime = perfConfig.debounceMs;

    updateTimerRef.current = setTimeout(() => {
      // Create a temporary canvas for the flipped export
      const tempCanvas = document.createElement('canvas');
      const exportSize = perfConfig.isMobile ? Math.min(canvasSize, 2048) : canvasSize;
      tempCanvas.width = exportSize;
      tempCanvas.height = exportSize;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Save current background
      const originalBg = canvas.backgroundImage;

      // Temporarily replace UV wireframe with white background for clean export
      canvas.backgroundImage = null;
      canvas.backgroundColor = 'white';
      canvas.renderAll();

      // Flip both X and Y axes before export
      tempCtx.translate(tempCanvas.width, tempCanvas.height);
      tempCtx.scale(-1, -1);

      // Draw the Fabric canvas content (scaled if necessary)
      if (canvas.width !== exportSize) {
        tempCtx.drawImage(canvas.getElement(), 0, 0, exportSize, exportSize);
      } else {
        tempCtx.drawImage(canvas.getElement(), 0, 0);
      }

      // Use lower quality on mobile
      const quality = perfConfig.isMobile ? 0.8 : 1;
      const dataUrl = tempCanvas.toDataURL('image/png', quality);

      // Restore UV wireframe background for editing view
      canvas.backgroundImage = originalBg;
      canvas.renderAll();

      setGlobalCustomTexture(dataUrl);
      console.log("🔄 UV texture updated and flipped for 3D (text & images on white background)");
    }, debounceTime);
  }, [setGlobalCustomTexture, perfConfig.debounceMs, perfConfig.isMobile, canvasSize]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasContainerRef.current || !completeUVMap) return;

    // Prevent double initialization (React Strict Mode issue)
    if (isInitializingRef.current || fabricCanvasRef.current) {
      console.log("⚠️ Skipping duplicate initialization");
      return;
    }

    // Clear any existing canvas elements first
    const container = canvasContainerRef.current;
    const existingCanvas = container.querySelector('#fabric-canvas');
    if (existingCanvas) {
      console.log("🧹 Removing existing canvas element");
      existingCanvas.remove();
    }

    isInitializingRef.current = true;
    let mounted = true;

    const loadFabric = async () => {
      if (!mounted || fabricCanvasRef.current) return;
      console.log("🎨 Initializing Fabric.js canvas with UV map:", completeUVMap);

      // Dynamic import to avoid SSR issues
      const { Canvas, FabricImage } = await import("fabric");

      // Calculate container width to fit canvas proportionally
      const containerWidth = canvasContainerRef.current!.clientWidth - 32; // Account for padding
      // Use smaller display size on mobile for better performance
      const maxDisplaySize = perfConfig.isMobile ? 400 : 800;
      const displaySize = Math.min(containerWidth, maxDisplaySize);

      // Create canvas element
      const canvasEl = document.createElement("canvas");
      canvasEl.id = "fabric-canvas";
      canvasContainerRef.current!.appendChild(canvasEl);

      // Initialize Fabric canvas at resolution based on device capability
      const canvas = new Canvas(canvasEl, {
        width: canvasSize,
        height: canvasSize,
        backgroundColor: "#ffffff",
        // Mobile optimizations
        enableRetinaScaling: !perfConfig.isMobile,
        renderOnAddRemove: !perfConfig.isMobile, // Batch render on mobile
        skipOffscreen: true, // Don't render objects outside viewport
      });

      // Set CSS dimensions for display
      canvas.setDimensions({
        width: displaySize,
        height: displaySize
      }, {
        cssOnly: true
      });

      fabricCanvasRef.current = canvas;
      setFabricCanvas(canvas);
      console.log(`✅ Fabric canvas initialized at ${canvasSize}x${canvasSize}, displayed at`, displaySize, "px");

      // Configure custom 4-corner controls with Lucide React icons
      const fabric = await import("fabric");
      const { Control, controlsUtils } = fabric;
      
      // Calculate scale factor for controls - smaller size
      const scaleFactor = canvasSize / displaySize;
      const baseCornerSize = 26; // Slightly smaller
      const scaledCornerSize = Math.round(baseCornerSize * scaleFactor);
      const iconLineWidth = Math.max(2, Math.round(2 * scaleFactor));
      
      console.log(`📐 Control scale factor: ${scaleFactor.toFixed(2)}, corner size: ${scaledCornerSize}px`);
      
      // Create SVG strings for Lucide icons (using actual Lucide SVG markup)
      const createLucideSvg = (pathD: string, color: string) => {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`;
      };
      
      // Lucide icon paths (exact paths from lucide-react)
      const lucideIconPaths = {
        rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
        pin: '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-6 0v4.76c0 .73-.4 1.4-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
        resize: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
      };
      
      const iconColors = {
        rotate: '#3b82f6',
        pin: '#6b7280',
        trash: '#ef4444',
        resize: '#3b82f6',
      };
      
      // Create Image objects for each icon
      const iconImages: Record<string, HTMLImageElement> = {};
      Object.entries(lucideIconPaths).forEach(([key, pathD]) => {
        const color = iconColors[key as keyof typeof iconColors];
        const svgString = createLucideSvg(pathD, color);
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
        iconImages[key] = img;
      });
      
      // Render function using pre-rendered Lucide icon images
      const renderIconControl = (iconKey: 'rotate' | 'pin' | 'trash' | 'resize', borderColor: string) => {
        return (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) => {
          const size = scaledCornerSize;
          ctx.save();
          ctx.translate(left, top);
          
          // White circle background with subtle shadow
          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = size * 0.15;
          ctx.shadowOffsetY = size * 0.05;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // Border
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = iconLineWidth;
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
          ctx.stroke();
          
          // Draw the Lucide icon image centered
          const img = iconImages[iconKey];
          if (img && img.complete) {
            const iconSize = size * 0.55;
            ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
          }
          
          ctx.restore();
        };
      };
      
      // Delete handler
      const deleteHandler = (eventData: any, transform: any) => {
        const target = transform.target;
        const canvasObj = target.canvas;
        canvasObj.remove(target);
        canvasObj.requestRenderAll();
        return true;
      };
      
      // Create custom controls - only 4 corners with Lucide icons
      const customControls = {
        tl: new Control({
          x: -0.5,
          y: -0.5,
          cursorStyle: 'grab',
          actionHandler: controlsUtils.rotationWithSnapping,
          actionName: 'rotate',
          render: renderIconControl('rotate', '#3b82f6'),
          sizeX: scaledCornerSize,
          sizeY: scaledCornerSize,
        }),
        tr: new Control({
          x: 0.5,
          y: -0.5,
          cursorStyle: 'pointer',
          actionHandler: controlsUtils.scalingEqually,
          actionName: 'scale',
          render: renderIconControl('pin', '#6b7280'),
          sizeX: scaledCornerSize,
          sizeY: scaledCornerSize,
        }),
        bl: new Control({
          x: -0.5,
          y: 0.5,
          cursorStyle: 'pointer',
          mouseUpHandler: deleteHandler,
          render: renderIconControl('trash', '#ef4444'),
          sizeX: scaledCornerSize,
          sizeY: scaledCornerSize,
        }),
        br: new Control({
          x: 0.5,
          y: 0.5,
          cursorStyle: 'nwse-resize',
          actionHandler: controlsUtils.scalingEqually,
          actionName: 'scale',
          render: renderIconControl('resize', '#3b82f6'),
          sizeX: scaledCornerSize,
          sizeY: scaledCornerSize,
        }),
      };
      
      // Control settings
      const controlSettings = {
        controls: customControls,
        cornerSize: scaledCornerSize,
        cornerColor: '#3b82f6',
        cornerStrokeColor: '#ffffff',
        transparentCorners: false,
        borderColor: '#3b82f6',
        borderDashArray: [Math.round(8 * scaleFactor), Math.round(6 * scaleFactor)],
        borderScaleFactor: Math.max(2, scaleFactor),
        padding: Math.round(15 * scaleFactor),
      };
      
      // Store for later use
      customControlsRef.current = controlSettings;
      
      // Apply to prototypes
      try {
        if (fabric.FabricObject && fabric.FabricObject.prototype) {
          fabric.FabricObject.prototype.controls = customControls;
        }
        if (fabric.InteractiveFabricObject && fabric.InteractiveFabricObject.prototype) {
          fabric.InteractiveFabricObject.prototype.controls = customControls;
        }
      } catch (e) {
        console.log("Could not set fabric defaults, will apply per-object");
      }

      // Load UV map as background
      try {
        const img = await FabricImage.fromURL(completeUVMap);
        console.log("✅ UV map image loaded:", img.width, "x", img.height);

        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );

        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        });

        canvas.backgroundImage = img;
        canvas.renderAll();
        setIsLoaded(true);
        console.log("✅ UV map set as background");
        updateTexture();
      } catch (error) {
        console.error("❌ Failed to load UV map:", error);
      }

      // Handle selection changes
      canvas.on("selection:created", () => setHasSelection(true));
      canvas.on("selection:updated", () => setHasSelection(true));
      canvas.on("selection:cleared", () => setHasSelection(false));

      // Apply custom 4-corner controls to any newly added object
      canvas.on("object:added", (e: any) => {
        if (e.target && e.target.selectable !== false && customControlsRef.current) {
          e.target.controls = customControlsRef.current.controls;
          e.target.set({
            cornerSize: customControlsRef.current.cornerSize,
            cornerColor: customControlsRef.current.cornerColor,
            cornerStrokeColor: customControlsRef.current.cornerStrokeColor,
            transparentCorners: customControlsRef.current.transparentCorners,
            borderColor: customControlsRef.current.borderColor,
            borderDashArray: customControlsRef.current.borderDashArray,
            borderScaleFactor: customControlsRef.current.borderScaleFactor,
            padding: customControlsRef.current.padding,
          });
          canvas.requestRenderAll();
        }
        updateTexture();
      });

      // Real-time updates on any change
      canvas.on("object:modified", updateTexture);
      canvas.on("object:moving", updateTexture);
      canvas.on("object:scaling", updateTexture);
      canvas.on("object:rotating", updateTexture);
      canvas.on("object:removed", updateTexture);
    };

    loadFabric();

    // Cleanup
    return () => {
      mounted = false;
      console.log("🧹 Cleaning up Fabric canvas");
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.log("Canvas already disposed");
        }
        fabricCanvasRef.current = null;
        setFabricCanvas(null);
      }
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      if (canvasContainerRef.current) {
        const canvasEl = canvasContainerRef.current.querySelector('#fabric-canvas');
        if (canvasEl) {
          canvasEl.remove();
        }
      }
      setIsLoaded(false);
      // Reset initialization flag after cleanup
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    };
  }, [completeUVMap, updateTexture]);

  const handleAddText = useCallback(async () => {
    if (!newText.trim() || !fabricCanvasRef.current) return;

    const { IText } = await import("fabric");
    const canvas = fabricCanvasRef.current;

    const textOptions: any = {
      left: canvas.width! / 2 - 200,
      top: canvas.height! / 2 - 100,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      fontStyle: isItalic ? "italic" : "normal",
      underline: isUnderline,
      linethrough: isStrikethrough,
      textAlign: textAlign,
      editable: true,
      charSpacing: letterSpacing * 10, // Fabric uses different scale
      lineHeight: lineHeight,
      angle: textRotation,
    };

    // Add stroke if width > 0
    if (strokeWidth > 0) {
      textOptions.stroke = strokeColor;
      textOptions.strokeWidth = strokeWidth;
    }

    // Add background color if set
    if (backgroundColor) {
      textOptions.backgroundColor = backgroundColor;
    }

    // Add shadow if enabled
    if (textShadow) {
      textOptions.shadow = {
        color: 'rgba(0,0,0,0.5)',
        blur: 5,
        offsetX: 3,
        offsetY: 3,
      };
    }

    const text = new IText(newText, textOptions);
    
    // Apply custom 4-corner controls to the new text object
    if (customControlsRef.current) {
      text.controls = customControlsRef.current.controls;
      text.set({
        cornerSize: customControlsRef.current.cornerSize,
        borderColor: customControlsRef.current.borderColor,
        borderDashArray: customControlsRef.current.borderDashArray,
        borderScaleFactor: customControlsRef.current.borderScaleFactor,
        padding: customControlsRef.current.padding,
      });
    }

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setNewText("");
    updateTexture();
  }, [newText, fontSize, textColor, fontFamily, fontWeight, isItalic, isUnderline, isStrikethrough, textAlign, strokeColor, strokeWidth, letterSpacing, lineHeight, textShadow, backgroundColor, textRotation, updateTexture]);

  // Function to update selected text properties
  const updateSelectedText = useCallback((property: string, value: any) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();
    
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set(property, value);
      canvas.renderAll();
      updateTexture();
    }
  }, [updateTexture]);

  // Reset text styling to defaults
  const resetTextStyling = useCallback(() => {
    setFontFamily("Arial");
    setFontWeight("normal");
    setIsItalic(false);
    setIsUnderline(false);
    setIsStrikethrough(false);
    setTextAlign("center");
    setStrokeColor("#ffffff");
    setStrokeWidth(0);
    setLetterSpacing(0);
    setLineHeight(1.2);
    setTextShadow(false);
    setBackgroundColor("");
    setTextRotation(0);
  }, []);

  const handleAddImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const { FabricImage } = await import("fabric");
    const canvas = fabricCanvasRef.current;

    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target?.result as string).then((img) => {
        // Calculate scale to make image larger but fit within canvas
        const maxSize = canvas.width! * 0.4; // 40% of canvas width
        const scale = Math.min(
          maxSize / img.width!,
          maxSize / img.height!
        );

        img.set({
          left: canvas.width! / 2 - (img.width! * scale) / 2,
          top: canvas.height! / 2 - (img.height! * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        });
        
        // Apply custom 4-corner controls to the new image object
        if (customControlsRef.current) {
          img.controls = customControlsRef.current.controls;
          img.set({
            cornerSize: customControlsRef.current.cornerSize,
            borderColor: customControlsRef.current.borderColor,
            borderDashArray: customControlsRef.current.borderDashArray,
            borderScaleFactor: customControlsRef.current.borderScaleFactor,
            padding: customControlsRef.current.padding,
          });
        }
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        updateTexture();
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  }, [updateTexture]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const activeObjects = canvas.getActiveObjects();

    if (activeObjects.length > 0) {
      activeObjects.forEach((obj: any) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      updateTexture();
    }
  }, [updateTexture]);

  const handleDuplicate = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      activeObject.clone((cloned: any) => {
        cloned.set({
          left: activeObject.left + 20,
          top: activeObject.top + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        updateTexture();
      });
    }
  }, [updateTexture]);

  const handleDownload = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Temporarily remove UV wireframe but keep white background
    const originalBg = canvas.backgroundImage;

    canvas.backgroundImage = undefined;
    canvas.renderAll();

    // Export flipped version for correct 3D texture orientation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width!;
    tempCanvas.height = canvas.height!;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Flip the canvas both horizontally (X) and vertically (Y)
    tempCtx.translate(tempCanvas.width, tempCanvas.height);
    tempCtx.scale(-1, -1);

    // Draw the Fabric canvas content
    tempCtx.drawImage(canvas.getElement(), 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png', 1);

    // Restore UV wireframe for editing view
    canvas.backgroundImage = originalBg;
    canvas.renderAll();

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "uv-texture.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleClear = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    // Remove all objects except background
    canvas.getObjects().forEach((obj: any) => {
      canvas.remove(obj);
    });
    canvas.renderAll();
    updateTexture();
  }, [updateTexture]);

  if (!completeUVMap) {
    return (
      <Card className="p-8 text-center">
        <Map className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          No UV map available
        </p>
        <p className="text-xs text-muted-foreground">
          Load a 3D model to extract UV maps
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs for different tools */}
      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="patterns" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-1">
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Text</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
        </TabsList>

        {/* Pattern Library Tab */}
        <TabsContent value="patterns" className="mt-4">
          <PatternSelector />
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="mt-4">
          <Card className="p-4">
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-4">
                {/* Text Input */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Add Text
                  </h3>
                  <Input
                    placeholder="Enter your text..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                    className="mb-3"
                  />
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem 
                          key={font.value} 
                          value={font.value}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(v) => setFontSize(v[0])}
                      min={12}
                      max={300}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Select value={fontWeight} onValueChange={setFontWeight}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map((weight) => (
                          <SelectItem key={weight.value} value={weight.value}>
                            {weight.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Text Style Toggles */}
                <div className="space-y-2">
                  <Label>Style</Label>
                  <div className="flex gap-1 flex-wrap">
                    <Toggle
                      size="sm"
                      pressed={isItalic}
                      onPressedChange={setIsItalic}
                      aria-label="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      pressed={isUnderline}
                      onPressedChange={setIsUnderline}
                      aria-label="Underline"
                    >
                      <Underline className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      pressed={isStrikethrough}
                      onPressedChange={setIsStrikethrough}
                      aria-label="Strikethrough"
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      pressed={textShadow}
                      onPressedChange={setTextShadow}
                      aria-label="Shadow"
                      className="px-2"
                    >
                      Shadow
                    </Toggle>
                  </div>
                </div>

                {/* Text Alignment */}
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <div className="flex gap-1">
                    <Toggle
                      size="sm"
                      pressed={textAlign === "left"}
                      onPressedChange={() => setTextAlign("left")}
                      aria-label="Align left"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      pressed={textAlign === "center"}
                      onPressedChange={() => setTextAlign("center")}
                      aria-label="Align center"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      pressed={textAlign === "right"}
                      onPressedChange={() => setTextAlign("right")}
                      aria-label="Align right"
                    >
                      <AlignRight className="h-4 w-4" />
                    </Toggle>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 font-mono text-xs"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={backgroundColor || "#ffffff"}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBackgroundColor("")}
                        className="text-xs"
                      >
                        None
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stroke */}
                <div className="space-y-2">
                  <Label>Stroke / Outline</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Slider
                        value={[strokeWidth]}
                        onValueChange={(v) => setStrokeWidth(v[0])}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{strokeWidth}px</span>
                  </div>
                </div>

                {/* Letter Spacing & Line Height */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Letter Spacing: {letterSpacing}</Label>
                    <Slider
                      value={[letterSpacing]}
                      onValueChange={(v) => setLetterSpacing(v[0])}
                      min={-50}
                      max={200}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Line Height: {lineHeight.toFixed(1)}</Label>
                    <Slider
                      value={[lineHeight * 10]}
                      onValueChange={(v) => setLineHeight(v[0] / 10)}
                      min={5}
                      max={30}
                      step={1}
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <Label>Rotation: {textRotation}°</Label>
                  <div className="flex gap-2 items-center">
                    <Slider
                      value={[textRotation]}
                      onValueChange={(v) => setTextRotation(v[0])}
                      min={-180}
                      max={180}
                      step={1}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setTextRotation(0)}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddText} className="flex-1" disabled={!isLoaded || !newText.trim()}>
                    <Type className="h-4 w-4 mr-2" />
                    Add Text
                  </Button>
                  <Button variant="outline" onClick={resetTextStyling} size="icon">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview */}
                {newText && (
                  <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                    <div 
                      className="text-center p-2 rounded overflow-hidden"
                      style={{
                        fontFamily: fontFamily,
                        fontSize: Math.min(fontSize, 48),
                        fontWeight: fontWeight as any,
                        fontStyle: isItalic ? "italic" : "normal",
                        textDecoration: `${isUnderline ? "underline" : ""} ${isStrikethrough ? "line-through" : ""}`.trim() || "none",
                        color: textColor,
                        backgroundColor: backgroundColor || "transparent",
                        textAlign: textAlign,
                        letterSpacing: `${letterSpacing}px`,
                        lineHeight: lineHeight,
                        textShadow: textShadow ? "2px 2px 4px rgba(0,0,0,0.5)" : "none",
                        WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : undefined,
                        transform: `rotate(${textRotation}deg)`,
                      }}
                    >
                      {newText}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Image Tab */}
        <TabsContent value="image" className="mt-4">
          <Card className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Add Image
              </h3>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAddImage}
                className="cursor-pointer"
                disabled={!isLoaded}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload logos, graphics, or photos to add to your design
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selection Tools - shown when object is selected */}
      {hasSelection && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold mb-3">Selected Object</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDuplicate}
              variant="outline"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" className="flex-1" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleClear} variant="outline" className="flex-1" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </Card>

      {/* Fabric.js Canvas */}
      <Card className="p-4">
        <div
          ref={canvasContainerRef}
          className="relative border rounded-md bg-gray-50 w-full flex items-center justify-center overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🎨 Drag, resize, rotate objects • Double-click text to edit • Real-time 3D preview
        </p>
      </Card>
    </div>
  );
}
