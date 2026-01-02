"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Palette,
  Check,
  ChevronLeft,
  Upload,
  Loader2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PANTONE_COLORS,
  findNearestPantone,
  type PantoneColor,
} from "@/lib/pantone";
import { extractColors } from "@/lib/color-extractor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
  recentColors?: string[];
  onAddRecentColor?: (color: string) => void;
  title?: string;
  footer?: React.ReactNode;
}

// Group Pantones by category
const CATEGORIZED_PANTONES = PANTONE_COLORS.reduce(
  (acc, color) => {
    const cat =
      color.category === "coated"
        ? "Standard"
        : color.category === "metallic"
          ? "Metallic"
          : "Other";

    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(color);
    return acc;
  },
  {} as Record<string, PantoneColor[]>,
);

export function ColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  onColorChange,
  disabled = false,
  recentColors = [],
  onAddRecentColor,
  title = "Choose Color",
  footer,
}: ColorPickerModalProps) {
  const [tempColor, setTempColor] = useState(currentColor);
  const [selectedPantone, setSelectedPantone] = useState<PantoneColor | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

  // AI Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [suggestedColors, setSuggestedColors] = useState<PantoneColor[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync temp color
  useEffect(() => {
    if (isOpen) {
      setTempColor(currentColor);
      const match = findNearestPantone(currentColor);
      // Only set if it's a very close match to avoid snapping generic colors unexpectedly
      setSelectedPantone(match);
    }
  }, [isOpen, currentColor]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen && !isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
  }, [isOpen, isMobile]);

  const handleColorSelect = useCallback((color: string) => {
    setTempColor(color);
    // Auto-identify nearest Pantone
    const pantone = findNearestPantone(color);
    setSelectedPantone(pantone);
    // Commit the change so we don't revert
    setPreviewRevertColor(null);
  }, []);

  /* New state for preview revert */
  const [previewRevertColor, setPreviewRevertColor] = useState<string | null>(null);

  const handleMouseEnter = (color: string) => {
    if (!previewRevertColor) {
      setPreviewRevertColor(tempColor);
    }
    setTempColor(color);
    // Update the parent immediately for preview
    onColorChange(color);
  };

  const handleMouseLeave = () => {
    if (previewRevertColor) {
      setTempColor(previewRevertColor);
      onColorChange(previewRevertColor);
      setPreviewRevertColor(null);
    }
  };

  const handlePantoneSelect = useCallback((pantone: PantoneColor) => {
    setTempColor(pantone.hex);
    setSelectedPantone(pantone);
  }, []);

  const handleApplyColor = useCallback(() => {
    onColorChange(tempColor);
    onAddRecentColor?.(tempColor);
    onClose();
  }, [tempColor, onColorChange, onAddRecentColor, onClose]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      const imageUrl = URL.createObjectURL(file);

      // Extract simplified colors
      const extractedHexes = await extractColors(imageUrl, 5);

      // Match to Pantones
      const matches = extractedHexes.map((hex) => findNearestPantone(hex));

      // Filter out duplicate Pantones
      const uniqueMatches = matches.filter(
        (p, index, self) => index === self.findIndex((t) => t.code === p.code),
      );

      setSuggestedColors(uniqueMatches);
      toast.success("Found matching Pantone colors!");

      // Cleanup
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("Color extraction failed:", error);
      toast.error("Failed to analyze image colors.");
    } finally {
      setIsExtracting(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const Content = (
    <div className="flex flex-col h-full">
      {/* Current Selection Header - Compact */}
      <div className="flex items-center gap-3 p-3 border-b bg-muted/20">
        <div
          className="w-12 h-12 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
          style={{ backgroundColor: tempColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-bold font-mono">
              {tempColor.toUpperCase()}
            </h3>
          </div>
          {selectedPantone && (
            <p className="text-xs font-medium text-primary truncate">
              {selectedPantone.code}
            </p>
          )}
        </div>
        <Button
          onClick={handleApplyColor}
          disabled={disabled}
          size="sm"
          className="shrink-0 h-9"
        >
          Apply
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Smart Match Section - Compact */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                <Wand2 className="w-3 h-3" />
                Smart Match
              </h4>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 bg-background text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                Upload
              </Button>
            </div>

            {suggestedColors.length > 0 ? (
              <div className="grid grid-cols-6 gap-1.5">
                {suggestedColors.map((pantone) => (
                  <button
                    key={pantone.code}
                    onClick={() => handlePantoneSelect(pantone)}
                    onMouseEnter={() => handleMouseEnter(pantone.hex)}
                    onMouseLeave={handleMouseLeave}
                    className={`group relative aspect-square rounded border-2 transition-all overflow-hidden ${selectedPantone?.code === pantone.code
                      ? "border-primary ring-1 ring-primary"
                      : "border-transparent hover:border-primary/50"
                      }`}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: pantone.hex }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Upload logo to find Pantone matches
              </p>
            )}
          </div>

          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="w-full mb-3 h-8">
              <TabsTrigger value="standard" className="flex-1 text-xs h-7">
                Standard
              </TabsTrigger>
              <TabsTrigger value="metallic" className="flex-1 text-xs h-7">
                Metallic
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex-1 text-xs h-7">
                Custom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="mt-0">
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIZED_PANTONES["Standard"].map((pantone) => (
                  <button
                    key={pantone.code}
                    onClick={() => handlePantoneSelect(pantone)}
                    onMouseEnter={() => handleMouseEnter(pantone.hex)}
                    onMouseLeave={handleMouseLeave}
                    className={`flex items-center gap-1.5 p-1.5 rounded border text-left transition-all ${selectedPantone?.code === pantone.code
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted"
                      }`}
                  >
                    <div
                      className="w-6 h-6 rounded border shadow-sm shrink-0"
                      style={{ backgroundColor: pantone.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold truncate">
                        {pantone.code}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="metallic" className="mt-0">
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIZED_PANTONES["Metallic"]?.map((pantone) => (
                  <button
                    key={pantone.code}
                    onClick={() => handlePantoneSelect(pantone)}
                    onMouseEnter={() => handleMouseEnter(pantone.hex)}
                    onMouseLeave={handleMouseLeave}
                    className={`flex items-center gap-1.5 p-1.5 rounded border text-left transition-all ${selectedPantone?.code === pantone.code
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted"
                      }`}
                  >
                    <div
                      className="w-6 h-6 rounded border shadow-sm shrink-0"
                      style={{ backgroundColor: pantone.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold truncate">
                        {pantone.code}
                      </div>
                    </div>
                  </button>
                )) || (
                    <div className="text-xs text-muted-foreground text-center py-3">
                      No metallic colors
                    </div>
                  )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-3">
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    Hex Color Code
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                        #
                      </div>
                      <input
                        type="text"
                        value={tempColor.replace("#", "")}
                        onChange={(e) => {
                          const val = "#" + e.target.value.replace("#", "");
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val))
                            setTempColor(val);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 rounded border text-sm font-mono uppercase h-9"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <div
                      className="w-9 h-9 rounded border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: tempColor }}
                      title="Color preview"
                    />
                  </div>
                </div>

                {/* RGB Input Fields */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    RGB Values
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">R</span>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={parseInt(tempColor.slice(1, 3), 16) || 0}
                        onChange={(e) => {
                          const r = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                          const g = parseInt(tempColor.slice(3, 5), 16) || 0;
                          const b = parseInt(tempColor.slice(5, 7), 16) || 0;
                          setTempColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
                          setSelectedPantone(null);
                        }}
                        className="w-full py-1.5 px-2 rounded border text-sm font-mono h-9 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">G</span>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={parseInt(tempColor.slice(3, 5), 16) || 0}
                        onChange={(e) => {
                          const r = parseInt(tempColor.slice(1, 3), 16) || 0;
                          const g = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                          const b = parseInt(tempColor.slice(5, 7), 16) || 0;
                          setTempColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
                          setSelectedPantone(null);
                        }}
                        className="w-full py-1.5 px-2 rounded border text-sm font-mono h-9 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">B</span>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={parseInt(tempColor.slice(5, 7), 16) || 0}
                        onChange={(e) => {
                          const r = parseInt(tempColor.slice(1, 3), 16) || 0;
                          const g = parseInt(tempColor.slice(3, 5), 16) || 0;
                          const b = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                          setTempColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
                          setSelectedPantone(null);
                        }}
                        className="w-full py-1.5 px-2 rounded border text-sm font-mono h-9 text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {recentColors.length > 0 && (
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">
                      Recent
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {recentColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          onMouseEnter={() => handleMouseEnter(color)}
                          onMouseLeave={handleMouseLeave}
                          className="w-7 h-7 rounded border shadow-sm hover:scale-105 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {footer && <div className="p-3 border-t bg-muted/10">{footer}</div>}
    </div>
  );

  // Mobile Bottom Sheet
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-background rounded-t-xl shadow-xl h-[70vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 text-sm"
            >
              Cancel
            </Button>
            <h3 className="font-medium text-sm">{title}</h3>
            <div className="w-12" /> {/* Spacer */}
          </div>

          <div className="flex-1 overflow-hidden relative">{Content}</div>
        </div>
      </div>,
      document.body,
    );
  }

  // Desktop Modal
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            {title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden relative">{Content}</div>
      </div>
    </div>,
    document.body,
  );
}
