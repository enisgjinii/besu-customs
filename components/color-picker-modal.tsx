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
  title?: string;
  footer?: React.ReactNode;
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
  "#FF0000",
  "#FF4500",
  "#FFA500",
  "#FFD700",
  "#FFFF00",
  "#ADFF2F",
  "#00FF00",
  "#008000",
  "#00FFFF",
  "#008080",
  "#0000FF",
  "#000080",
  "#800080",
  "#FF00FF",
  "#FF69B4",
  "#FFC0CB",
  "#A52A2A",
  "#800000",
  "#808080",
  "#000000",
];

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

  const handleColorSelect = useCallback(
    (color: string) => {
      setTempColor(color);
      onColorChange(color);
      onAddRecentColor?.(color);
    },
    [onColorChange, onAddRecentColor],
  );

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
        {/* Backdrop for better focus */}
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative mx-2 mb-safe bg-card rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden">
          {/* Drag Handle */}
          <div className="w-full py-3 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />
          </div>

          {/* Header - Enhanced */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-gradient-to-b from-background/50 to-transparent">
            <div className="flex items-center gap-3">
              {activeSection === "custom" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("main")}
                  className="h-11 px-3 rounded-xl"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-11 px-3 rounded-xl"
                >
                  Cancel
                </Button>
              )}
            </div>
            <h2 className="font-bold text-lg tracking-tight">{title}</h2>
            <div>
              <Button
                size="sm"
                onClick={handleApplyColor}
                disabled={disabled}
                className="h-11 px-4 rounded-xl font-semibold"
              >
                Done
              </Button>
            </div>
          </div>

          {/* Content - Enhanced scrolling */}
          <div
            className="overflow-y-auto thin-scrollbar"
            style={{ maxHeight: "calc(80vh - 120px)" }}
          >
            <div className="p-5 pb-8">
              {activeSection === "main" ? (
                <div className="space-y-6">
                  {/* Current Color Preview - Enhanced */}
                  <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-muted/30 to-muted/10 rounded-2xl border border-border/30">
                    <div
                      className="w-20 h-20 rounded-2xl border-3 border-border shadow-lg flex-shrink-0"
                      style={{ backgroundColor: tempColor }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">
                        Selected Color
                      </p>
                      <p className="font-mono text-xl font-bold tracking-wider">
                        {tempColor.toUpperCase()}
                      </p>
                    </div>
                    {tempColor !== currentColor && (
                      <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-2 rounded-xl">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-semibold">Changed</span>
                      </div>
                    )}
                  </div>

                  {/* Recent Colors - Enhanced */}
                  {recentColors.length > 0 && (
                    <div>
                      <h3 className="section-header-mobile mb-4 text-base">
                        Recent Colors
                      </h3>
                      <div className="grid grid-cols-6 gap-3">
                        {recentColors.slice(0, 12).map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorSelect(color)}
                            disabled={disabled}
                            className={`aspect-square rounded-2xl border-3 transition-all duration-200 min-h-[56px] ${
                              tempColor.toLowerCase() === color.toLowerCase()
                                ? "border-primary shadow-lg shadow-primary/30 scale-105"
                                : "border-border/50 hover:border-primary/50 active:scale-95"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          >
                            {tempColor.toLowerCase() ===
                              color.toLowerCase() && (
                              <Check className="w-6 h-6 text-white drop-shadow-lg mx-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Colors - Enhanced */}
                  <div>
                    <h3 className="section-header-mobile mb-4 text-base">
                      Team Colors
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {TEAM_COLORS.map(({ name, color }) => (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          disabled={disabled}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 min-h-[68px] ${
                            tempColor.toLowerCase() === color.toLowerCase()
                              ? "border-primary bg-primary/8 shadow-md"
                              : "border-border/50 active:border-primary/50 active:bg-secondary/30 hover:bg-secondary/20"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-xl border-2 border-border/30 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-base font-semibold flex-1 text-left">
                            {name}
                          </span>
                          {tempColor.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-6 h-6 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Colors - Enhanced */}
                  <div>
                    <h3 className="section-header-mobile mb-4 text-base">
                      Basic Colors
                    </h3>
                    <div className="grid grid-cols-5 gap-3">
                      {BASIC_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          disabled={disabled}
                          className={`aspect-square rounded-2xl border-3 transition-all duration-200 min-h-[60px] ${
                            tempColor.toLowerCase() === color.toLowerCase()
                              ? "border-primary shadow-lg shadow-primary/30 scale-105"
                              : "border-border/50 hover:border-primary/50 active:scale-95"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        >
                          {tempColor.toLowerCase() === color.toLowerCase() && (
                            <Check
                              className={`w-6 h-6 mx-auto drop-shadow-lg ${
                                color === "#FFFFFF" ||
                                color === "#FFD700" ||
                                color === "#FFFF00"
                                  ? "text-gray-800"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Button - Enhanced */}
                  <Button
                    variant="outline"
                    className="w-full h-16 text-base font-semibold rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all duration-200"
                    onClick={() => setActiveSection("custom")}
                  >
                    <Palette className="w-6 h-6 mr-3" />
                    <span>Create Custom Color</span>
                  </Button>
                </div>
              ) : (
                /* Custom Color Section - Enhanced */
                <div className="space-y-6">
                  {/* Large Color Preview - Enhanced */}
                  <div className="flex flex-col items-center gap-5 p-6 bg-gradient-to-b from-muted/20 to-transparent rounded-2xl">
                    <div
                      className="w-40 h-40 rounded-3xl border-4 border-border shadow-2xl"
                      style={{ backgroundColor: tempColor }}
                    />
                    <p className="font-mono text-2xl font-bold tracking-wider">
                      {tempColor.toUpperCase()}
                    </p>
                  </div>

                  {/* Color Picker - Enhanced */}
                  <div className="space-y-4">
                    <label className="section-header-mobile block text-base">
                      Pick a Color
                    </label>
                    <input
                      type="color"
                      value={tempColor}
                      onChange={(e) => setTempColor(e.target.value)}
                      disabled={disabled}
                      className="w-full h-24 rounded-2xl border-3 border-border cursor-pointer shadow-md"
                    />
                  </div>

                  {/* Hex Input - Enhanced */}
                  <div className="space-y-3">
                    <label className="section-header-mobile block text-base">
                      Hex Code
                    </label>
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
                      className="w-full h-16 px-5 text-xl font-mono rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                      placeholder="#000000"
                    />
                  </div>

                  {/* Apply Button - Enhanced */}
                  <Button
                    className="w-full h-16 text-base font-semibold rounded-2xl shadow-lg"
                    onClick={handleApplyColor}
                    disabled={disabled}
                  >
                    <Check className="w-6 h-6 mr-3" />
                    <span>Apply This Color</span>
                  </Button>
                </div>
              )}

              {footer && <div className="mt-6">{footer}</div>}
            </div>
          </div>
        </div>
      </div>,
      // portal target: body
      document.body,
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
              {title}
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

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>,
    // portal target: body
    document.body,
  );
}
