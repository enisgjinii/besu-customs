"use strict";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Predefined trim line patterns
const TRIM_PATTERNS = [
  { id: "solid", name: "Solid Line", description: "Single solid color line" },
  { id: "dashed", name: "Dashed", description: "Dashed line pattern" },
  { id: "dotted", name: "Dotted", description: "Dotted line pattern" },
  { id: "wave", name: "Wave", description: "Wavy decorative line" },
  { id: "double", name: "Double Line", description: "Double parallel lines" },
  { id: "gradient", name: "Gradient", description: "Color gradient line" },
  { id: "embossed", name: "Embossed", description: "3D embossed effect" },
  { id: "shadow", name: "Shadow", description: "Subtle shadow effect" },
];

// Trim locations on jersey - including sides for jersey top/bottom
const TRIM_LOCATIONS = [
  { id: "collar", name: "Collar" },
  { id: "sleeves", name: "Sleeves" },
  { id: "armholes", name: "Arm Holes" },
  { id: "waist", name: "Waist" },
  { id: "bottom", name: "Bottom Hem" },
  { id: "placket", name: "Button Placket" },
  { id: "sides", name: "Side Panels" },
  { id: "left-side", name: "Left Side" },
  { id: "right-side", name: "Right Side" },
  { id: "custom", name: "Custom Position" },
];

export function Step03bTrimLines() {
  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);

  const [trimPattern, setTrimPattern] = useState("solid");
  const [trimColor, setTrimColor] = useState("#000000");
  const [trimWidth, setTrimWidth] = useState(10); // pixels
  const [trimLocation, setTrimLocation] = useState("collar");

  const handleAddTrim = () => {
    // Validate inputs
    if (!trimPattern) {
      toast.error("Please select a trim pattern");
      return;
    }
    
    if (!trimColor) {
      toast.error("Please select a trim color");
      return;
    }

    // Find sections that match the trim location
    const sectionsToUpdate = sections.filter((s) => {
      const sectionName = s.name.toLowerCase();
      return (
        sectionName.includes(trimLocation) ||
        (trimLocation === "collar" && sectionName.includes("collar")) ||
        (trimLocation === "sleeves" && sectionName.includes("sleeve")) ||
        (trimLocation === "armholes" && sectionName.includes("arm")) ||
        (trimLocation === "waist" && sectionName.includes("waist")) ||
        (trimLocation === "bottom" && sectionName.includes("bottom")) ||
        (trimLocation === "placket" && sectionName.includes("placket")) ||
        (trimLocation === "sides" && (sectionName.includes("side") || sectionName.includes("panel"))) ||
        (trimLocation === "left-side" && (sectionName.includes("left") && sectionName.includes("side"))) ||
        (trimLocation === "right-side" && (sectionName.includes("right") && sectionName.includes("side"))) ||
        // Also match trim/piping sections for jersey top/bottom
        (sectionName.includes("trim") || sectionName.includes("piping"))
      );
    });

    if (sectionsToUpdate.length === 0) {
      toast.error(
        `No sections found matching "${TRIM_LOCATIONS.find(l => l.id === trimLocation)?.name}". Try a different location or apply to specific sections in the Colors tab.`,
      );
      return;
    }

    try {
      sectionsToUpdate.forEach((section) => {
        console.log(`🎨 Applying trim to section: "${section.name}" (${section.id})`);
        updateSection(section.id, {
          trimDesign: trimPattern,
          trimColor: trimColor,
        });
      });

      console.log(`✅ Trim applied to ${sectionsToUpdate.length} sections:`, sectionsToUpdate.map(s => s.name));
      toast.success(`Trim applied to ${sectionsToUpdate.length} section(s): ${sectionsToUpdate.map(s => s.name).join(", ")}`);
    } catch (error) {
      console.error("❌ Failed to apply trim:", error);
      toast.error("Failed to apply trim. Please try again.");
    }
  };

  // Show which sections have trims
  const sectionsWithTrims = sections.filter((s) => s.trimDesign);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Add Trim Lines</h2>
        <p className="text-sm text-muted-foreground">
          Add decorative trim lines to collar, sleeves, cuffs, and other areas
        </p>
      </div>

      {/* Trim Preview */}
      <div className="p-4 bg-muted/20 rounded-lg border space-y-2">
        <Label className="text-xs font-semibold">Preview</Label>
        <div className="h-20 bg-white rounded border flex items-center justify-center relative overflow-hidden">
          <div
            style={{
              height: `${trimWidth}px`,
              backgroundColor: trimColor,
              width: "80%",
              borderRadius: trimPattern === "wave" ? "50% 50%" : "0",
              boxShadow:
                trimPattern === "shadow" ? "0 2px 4px rgba(0,0,0,0.2)" : 
                trimPattern === "embossed" ? "inset 0 2px 4px rgba(0,0,0,0.3)" : "",
              backgroundImage:
                trimPattern === "dashed"
                  ? `repeating-linear-gradient(90deg, ${trimColor} 0, ${trimColor} 10px, transparent 10px, transparent 20px)`
                  : trimPattern === "dotted"
                    ? `radial-gradient(circle, ${trimColor} 30%, transparent 30%)`
                    : trimPattern === "gradient"
                      ? `linear-gradient(90deg, transparent 0%, ${trimColor} 50%, transparent 100%)`
                      : trimPattern === "double"
                        ? `repeating-linear-gradient(0deg, ${trimColor} 0, ${trimColor} 2px, transparent 2px, transparent 8px, ${trimColor} 8px, ${trimColor} 10px, transparent 10px, transparent 16px)`
                        : undefined,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {TRIM_PATTERNS.find(p => p.id === trimPattern)?.description}
        </p>
      </div>

      {/* Trim Pattern Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Trim Style</Label>
        <Select value={trimPattern} onValueChange={setTrimPattern}>
          <SelectTrigger>
            <SelectValue placeholder="Select trim pattern" />
          </SelectTrigger>
          <SelectContent>
            {TRIM_PATTERNS.map((pattern) => (
              <SelectItem key={pattern.id} value={pattern.id}>
                <div>
                  <span className="font-medium">{pattern.name}</span>
                  <span className="text-xs text-muted-foreground block">
                    {pattern.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color & Width Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Trim Color & Width</Label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={trimColor}
            onChange={(e) => setTrimColor(e.target.value)}
            className="w-12 h-12 border rounded cursor-pointer touch-manipulation md:w-10 md:h-10"
          />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Width</span>
              <span className="text-xs font-medium">{trimWidth}px</span>
            </div>
            <Slider
              value={[trimWidth]}
              onValueChange={(v) => setTrimWidth(v[0])}
              min={2}
              max={30}
              step={1}
              className="touch-manipulation"
            />
          </div>
        </div>
      </div>

      {/* Location Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Apply To</Label>
        <Select value={trimLocation} onValueChange={setTrimLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {TRIM_LOCATIONS.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Apply Button */}
      <Button onClick={handleAddTrim} className="w-full h-12 touch-manipulation">
        <Plus className="w-4 h-4 mr-2" />
        Add Trim to {TRIM_LOCATIONS.find(l => l.id === trimLocation)?.name}
      </Button>

      {/* Show Applied Trims */}
      {sectionsWithTrims.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Applied Trims ({sectionsWithTrims.length})
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sectionsWithTrims.forEach((section) => {
                  updateSection(section.id, {
                    trimDesign: undefined,
                    trimColor: undefined,
                  });
                });
                toast.success("All trims removed");
              }}
              className="h-8 text-xs touch-manipulation"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sectionsWithTrims.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border text-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-6 h-6 rounded border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: section.trimColor || "#000" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{section.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {section.trimDesign} pattern
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 hover:bg-destructive/10 touch-manipulation mobile-delete-btn"
                  onClick={() => {
                    updateSection(section.id, {
                      trimDesign: undefined,
                      trimColor: undefined,
                    });
                    toast.success("Trim removed");
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded text-xs text-blue-900 dark:text-blue-200">
        <strong>💡 Tip:</strong> Trim lines are applied to the selected location
        on your jersey. Use multiple trims to create complex designs!
      </div>
    </div>
  );
}
