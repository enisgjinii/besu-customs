"use client";

import { useState } from "react";
import { X, Palette } from "lucide-react";
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
  "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  "#FFA500", "#800080", "#FFC0CB", "#A52A2A", "#808080", "#000080",
  "#008000", "#FF4500", "#FFD700", "#C0C0C0", "#800000", "#808000",
  "#008080", "#ADFF2F", "#FF69B4"
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

  if (!isOpen) return null;

  const handleApplyColor = () => {
    onColorChange(tempColor);
    onClose();
  };

  const handleColorSelect = (color: string) => {
    setTempColor(color);
    onColorChange(color);
    onAddRecentColor?.(color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                      currentColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-primary' : ''
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
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
            <div className="grid grid-cols-6 gap-2">
              {BASIC_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={disabled}
                  className={`w-10 h-10 rounded-lg border-2 border-border/50 hover:border-primary transition-all ${
                    currentColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-primary' : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
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
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
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
    </div>
  );
}
