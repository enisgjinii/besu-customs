"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Palette, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
  recentColors?: string[];
  onAddRecentColor?: (color: string) => void;
}

const TEAM_COLORS = [
  { name: "Navy Blue", color: "#000080" },
  { name: "Royal Blue", color: "#4169E1" },
  { name: "Forest Green", color: "#228B22" },
  { name: "Maroon", color: "#800000" },
  { name: "Cardinal Red", color: "#C41E3A" },
  { name: "Orange", color: "#FF8C00" },
  { name: "Purple", color: "#800080" },
  { name: "Gold", color: "#FFD700" },
  { name: "Black", color: "#000000" },
  { name: "White", color: "#FFFFFF" },
  { name: "Gray", color: "#808080" },
  { name: "Silver", color: "#C0C0C0" },
];

const BASIC_COLORS = [
  "#FF0000", "#FF4500", "#FFA500", "#FFD700",
  "#FFFF00", "#ADFF2F", "#00FF00", "#008000",
  "#00FFFF", "#008080", "#0000FF", "#000080",
  "#800080", "#FF00FF", "#FF69B4", "#FFC0CB",
  "#A52A2A", "#800000", "#808080", "#000000",
];

export function ColorPickerModal({
  isOpen,
  onClose,
  currentColor,
  onColorChange,
  disabled = false,
  recentColors = [],
  onAddRecentColor,
}: ColorPickerModalProps) {
  const [tempColor, setTempColor] = useState(currentColor);
  const [activeSection, setActiveSection] = useState<"main" | "custom">("main");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync temp color with current color when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempColor(currentColor);
      setActiveSection("main");
    }
  }, [isOpen, currentColor]);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    // Only lock body scroll for desktop (full-screen modal).
    if (isOpen && !isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return;
  }, [isOpen, isMobile]);

  const handleColorSelect = useCallback((color: string) => {
    setTempColor(color);
    onColorChange(color);
    onAddRecentColor?.(color);
  }, [onColorChange, onAddRecentColor]);

  const handleApplyColor = useCallback(() => {
    onColorChange(tempColor);
    onAddRecentColor?.(tempColor);
    onClose();
  }, [tempColor, onColorChange, onAddRecentColor, onClose]);

  if (!isOpen) return null;

  // Mobile bottom sheet (non-blocking) rendered via portal so 3D view remains visible
  if (isMobile) {
    return createPortal(
      <div className="fixed left-0 right-0 bottom-0 z-50">
        <div className="mx-4 mb-safe bg-card rounded-t-2xl shadow-xl max-h-[50vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              {activeSection === "custom" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("main")}
                  className="h-9 px-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-9 px-2"
                >
                  Cancel
                </Button>
              )}
            </div>
            <h2 className="font-semibold text-sm">Choose Color</h2>
            <div>
              <Button
                size="sm"
                onClick={handleApplyColor}
                disabled={disabled}
                className="h-9"
              >
                Done
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeSection === "main" ? (
              <div className="space-y-4">
              {/* Current Color Preview */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div
                  className="w-16 h-16 rounded-xl border-2 border-border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: tempColor }}
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Selected Color</p>
                  <p className="font-mono text-lg font-medium">{tempColor.toUpperCase()}</p>
                </div>
                {tempColor !== currentColor && (
                  <div className="flex items-center gap-1 text-primary">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Changed</span>
                  </div>
                )}
              </div>

              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div>
                  <h3 className="section-header-mobile mb-3">Recent Colors</h3>
                  <div className="color-grid-mobile">
                    {recentColors.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        disabled={disabled}
                        className={`color-swatch-mobile ${
                          tempColor.toLowerCase() === color.toLowerCase() ? "selected" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      >
                        {tempColor.toLowerCase() === color.toLowerCase() && (
                          <Check className="w-5 h-5 text-white drop-shadow-md mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Colors */}
              <div>
                <h3 className="section-header-mobile mb-3">Team Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {TEAM_COLORS.map(({ name, color }) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      disabled={disabled}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        tempColor.toLowerCase() === color.toLowerCase()
                          ? "border-primary bg-primary/5"
                          : "border-border active:border-primary/50 active:bg-secondary/50"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg border border-border/50 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Colors */}
              <div>
                <h3 className="section-header-mobile mb-3">Basic Colors</h3>
                <div className="color-grid-mobile grid-cols-5">
                  {BASIC_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      disabled={disabled}
                      className={`color-swatch-mobile ${
                        tempColor.toLowerCase() === color.toLowerCase() ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {tempColor.toLowerCase() === color.toLowerCase() && (
                        <Check className={`w-5 h-5 mx-auto drop-shadow-md ${
                          color === "#FFFFFF" || color === "#FFD700" || color === "#FFFF00" 
                            ? "text-gray-800" 
                            : "text-white"
                        }`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Button */}
              <Button
                variant="outline"
                className="w-full btn-mobile"
                onClick={() => setActiveSection("custom")}
              >
                <Palette className="w-5 h-5" />
                <span>Custom Color</span>
              </Button>
              </div>
            ) : (
              /* Custom Color Section */
              <div className="space-y-4">
              {/* Large Color Preview */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-32 h-32 rounded-2xl border-4 border-border shadow-lg"
                  style={{ backgroundColor: tempColor }}
                />
                <p className="font-mono text-xl font-medium">{tempColor.toUpperCase()}</p>
              </div>

              {/* Color Picker */}
              <div className="space-y-4">
                <label className="section-header-mobile block">Pick a Color</label>
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  disabled={disabled}
                  className="w-full h-20 rounded-xl border-2 border-border cursor-pointer"
                />
              </div>

              {/* Hex Input */}
              <div className="space-y-2">
                <label className="section-header-mobile block">Hex Code</label>
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setTempColor(val);
                    }
                  }}
                  disabled={disabled}
                  className="w-full h-14 px-4 text-lg font-mono rounded-xl border-2 border-border bg-background"
                  placeholder="#000000"
                />
              </div>

              {/* Apply Button */}
              <Button
                className="w-full btn-mobile"
                onClick={handleApplyColor}
                disabled={disabled}
              >
                <Check className="w-5 h-5" />
                <span>Apply Color</span>
              </Button>
              </div>
            )}
          </div>
        </div>
      </div>,
      // portal target: body
      document.body
    );
  }

  // Desktop modal (original design with improvements) rendered via portal
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Choose Color
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Color Preview */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">Current:</div>
              <div
                className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                style={{ backgroundColor: currentColor }}
              />
              <div className="text-sm text-muted-foreground font-mono">
                {currentColor.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Team Colors */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Team Colors</h4>
            <div className="grid grid-cols-2 gap-3">
              {TEAM_COLORS.map(({ name, color }) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={disabled}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    currentColor.toLowerCase() === color.toLowerCase()
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div
                    className="w-8 h-8 rounded-md border border-border/50 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Recent Colors</h4>
              <div className="grid grid-cols-8 gap-2">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    disabled={disabled}
                    className={`w-8 h-8 rounded-md border-2 border-border/50 hover:border-primary transition-all ${
                      currentColor.toLowerCase() === color.toLowerCase()
                        ? "ring-2 ring-primary"
                        : ""
                    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Basic Colors */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Basic Colors</h4>
            <div className="grid grid-cols-10 gap-2">
              {BASIC_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={disabled}
                  className={`w-8 h-8 rounded-md border-2 border-border/50 hover:border-primary transition-all ${
                    currentColor.toLowerCase() === color.toLowerCase()
                      ? "ring-2 ring-primary"
                      : ""
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Custom Color</h4>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={tempColor}
                onChange={(e) => setTempColor(e.target.value)}
                disabled={disabled}
                className="w-12 h-12 rounded-lg border border-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2 text-sm font-mono rounded-md border border-input bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleApplyColor}
              disabled={disabled}
              className="flex-1"
            >
              Apply Color
            </Button>
          </div>
        </div>
      </div>
    </div>,
    // portal target: body
    document.body
  );
}
