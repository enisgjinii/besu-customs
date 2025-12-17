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

// Trim locations on jersey
const TRIM_LOCATIONS = [
  { id: "collar", name: "Collar" },
  { id: "sleeves", name: "Sleeves" },
  { id: "armholes", name: "Arm Holes" },
  { id: "waist", name: "Waist" },
  { id: "bottom", name: "Bottom Hem" },
  { id: "placket", name: "Button Placket" },
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
        (trimLocation === "placket" && sectionName.includes("placket"))
      );
    });

    if (sectionsToUpdate.length === 0) {
      toast.error(
        `No sections found matching "${trimLocation}". Apply to specific section instead.`,
      );
      return;
    }

    sectionsToUpdate.forEach((section) => {
      updateSection(section.id, {
        trimDesign: trimPattern,
        trimColor: trimColor,
      });
    });

    toast.success(`Trim applied to ${sectionsToUpdate.length} section(s)`);
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
                trimPattern === "shadow" ? "0 2px 4px rgba(0,0,0,0.2)" : "",
              backgroundImage:
                trimPattern === "dashed"
                  ? `repeating-linear-gradient(90deg, ${trimColor} 0, ${trimColor} 10px, transparent 10px, transparent 20px)`
                  : trimPattern === "dotted"
                    ? `radial-gradient(circle, ${trimColor} 30%, transparent 30%)`
                    : undefined,
            }}
          />
        </div>
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
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Trim Color</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={trimColor}
            onChange={(e) => setTrimColor(e.target.value)}
            className="w-12 h-10 border rounded cursor-pointer"
          />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">
              Trim Width: {trimWidth}px
            </p>
            <Slider
              value={[trimWidth]}
              onValueChange={(v) => setTrimWidth(v[0])}
              min={2}
              max={30}
              step={1}
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
      <Button onClick={handleAddTrim} className="w-full h-10">
        <Plus className="w-4 h-4 mr-2" />
        Add Trim
      </Button>

      {/* Show Applied Trims */}
      {sectionsWithTrims.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Applied Trims ({sectionsWithTrims.length})
          </Label>
          <div className="space-y-2">
            {sectionsWithTrims.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded border text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: section.trimColor || "#000" }}
                  />
                  <span>{section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({section.trimDesign})
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => {
                    updateSection(section.id, {
                      trimDesign: undefined,
                      trimColor: undefined,
                    });
                    toast.success("Trim removed");
                  }}
                >
                  <Trash2 className="w-3 h-3" />
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
