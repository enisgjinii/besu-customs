"use client";
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
import { ColorPickerModal } from "@/components/color-picker-modal";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Predefined trim line patterns with advanced options
const TRIM_PATTERNS = [
  {
    id: "solid",
    name: "Solid Line",
    description: "Single solid color line",
    icon: "━━━━━━━━━━",
  },
  {
    id: "double",
    name: "Double Line",
    description: "Double parallel lines with customizable gap",
    icon: "═══════════",
  },
];

// Edge styles for solid lines
const EDGE_STYLES = [
  { id: "sharp", name: "Sharp", description: "Clean sharp edges" },
  { id: "rounded", name: "Rounded", description: "Soft rounded edges" },
  { id: "beveled", name: "Beveled", description: "Angled beveled edges" },
  {
    id: "gradient-fade",
    name: "Gradient Fade",
    description: "Fades at the edges",
  },
];

// Double line variations
const DOUBLE_LINE_STYLES = [
  { id: "equal", name: "Equal", description: "Both lines same thickness" },
  {
    id: "thick-thin",
    name: "Thick-Thin",
    description: "Outer thick, inner thin",
  },
  {
    id: "thin-thick",
    name: "Thin-Thick",
    description: "Outer thin, inner thick",
  },
  {
    id: "outlined",
    name: "Outlined",
    description: "Lines with center gap color",
  },
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
  { id: "left-side-stripe", name: "Left Side Stripe (Jersey/Pants)" },
  { id: "right-side-stripe", name: "Right Side Stripe (Jersey/Pants)" },
  { id: "both-side-stripes", name: "Both Side Stripes (Jersey/Pants)" },
  { id: "custom", name: "Custom Position" },
];

// Generate a stripe texture as data URL
// This creates vertical stripes that will appear on the sides of jerseys/pants
// The stripes are semi-opaque so they blend with the underlying material color
function generateStripeTexture(
  color: string,
  pattern: string,
  width: number,
  side: "left" | "right" | "both",
): string {
  const SIZE = 1024; // Higher resolution for better quality
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // Start with fully transparent canvas
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Stripe width as percentage of canvas (width slider is 2-30, map to 2-8% of canvas)
  const stripeWidthPercent = 0.02 + (width / 30) * 0.06;
  const stripeWidth = Math.round(SIZE * stripeWidthPercent);

  // Parse the color and create a semi-transparent version for better blending
  const drawStripe = (x: number) => {
    // Use full opacity for the stripe color
    ctx.fillStyle = color;

    switch (pattern) {
      case "solid":
        ctx.fillRect(x, 0, stripeWidth, SIZE);
        break;
      case "dashed":
        const dashHeight = SIZE * 0.05;
        const dashGap = SIZE * 0.03;
        for (let y = 0; y < SIZE; y += dashHeight + dashGap) {
          ctx.fillRect(x, y, stripeWidth, dashHeight);
        }
        break;
      case "dotted":
        const dotSpacing = SIZE * 0.04;
        const dotRadius = stripeWidth * 0.4;
        for (let y = dotSpacing; y < SIZE; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x + stripeWidth / 2, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "double":
        const lineWidth = stripeWidth * 0.35;
        const gap = stripeWidth * 0.3;
        ctx.fillRect(x, 0, lineWidth, SIZE);
        ctx.fillRect(x + lineWidth + gap, 0, lineWidth, SIZE);
        break;
      case "wave":
        ctx.beginPath();
        const amplitude = stripeWidth * 0.3;
        const frequency = SIZE / 80;
        ctx.moveTo(x + stripeWidth / 2, 0);
        for (let y = 0; y <= SIZE; y += 2) {
          const waveX =
            x + stripeWidth / 2 + Math.sin(y / frequency) * amplitude;
          ctx.lineTo(waveX, y);
        }
        ctx.lineTo(x + stripeWidth, SIZE);
        ctx.lineTo(x, SIZE);
        ctx.lineTo(x, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case "gradient":
        const gradient = ctx.createLinearGradient(x, 0, x + stripeWidth, 0);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.8, color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, stripeWidth, SIZE);
        break;
      case "embossed":
        const embossGradient = ctx.createLinearGradient(
          x,
          0,
          x + stripeWidth,
          0,
        );
        embossGradient.addColorStop(0, "rgba(255,255,255,0.3)");
        embossGradient.addColorStop(0.5, color);
        embossGradient.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = embossGradient;
        ctx.fillRect(x, 0, stripeWidth, SIZE);
        break;
      case "shadow":
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = stripeWidth * 0.3;
        ctx.shadowOffsetX = stripeWidth * 0.1;
        ctx.fillRect(x, 0, stripeWidth, SIZE);
        ctx.shadowColor = "transparent";
        break;
      default:
        ctx.fillRect(x, 0, stripeWidth, SIZE);
    }
  };

  // Draw stripes only at the very edges of the UV map
  // Most UV layouts have side panels at the far edges
  // Being conservative to avoid stripes appearing on unintended areas
  if (side === "left" || side === "both") {
    // Only draw at the leftmost edge
    drawStripe(0);
  }
  if (side === "right" || side === "both") {
    // Only draw at the rightmost edge
    drawStripe(SIZE - stripeWidth);
  }

  return canvas.toDataURL("image/png");
}

export function Step03bTrimLines() {
  const sections = useConfiguratorStore((state) => state.sections);
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const addTextureLayer = useConfiguratorStore(
    (state) => state.addTextureLayer,
  );
  const textureLayers = useConfiguratorStore((state) => state.textureLayers);
  const removeTextureLayer = useConfiguratorStore(
    (state) => state.removeTextureLayer,
  );

  const [trimPattern, setTrimPattern] = useState("solid");
  const [trimColor, setTrimColor] = useState("#000000");
  const [trimSecondaryColor, setTrimSecondaryColor] = useState("#FFFFFF"); // For double line gap or outline
  const [trimWidth, setTrimWidth] = useState(10); // pixels
  const [trimLocation, setTrimLocation] = useState("collar");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [secondaryColorPickerOpen, setSecondaryColorPickerOpen] =
    useState(false);

  // Advanced options for Solid Line
  const [edgeStyle, setEdgeStyle] = useState("sharp");

  // Advanced options for Double Line
  const [doubleLineStyle, setDoubleLineStyle] = useState("equal");
  const [lineGap, setLineGap] = useState(4); // Gap between double lines

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

    // Handle side stripe locations by finding and coloring side panel sections
    // (Using texture overlays was causing the entire model to get striped)
    if (
      trimLocation === "left-side-stripe" ||
      trimLocation === "right-side-stripe" ||
      trimLocation === "both-side-stripes"
    ) {
      // Find sections that are related to side panels
      const sideSections = sections.filter((s) => {
        const name = s.name.toLowerCase();
        return (
          name.includes("side") ||
          name.includes("panel") ||
          name.includes("stripe")
        );
      });

      if (sideSections.length === 0) {
        toast.error(
          "No side panel sections found on this model. Side stripes may not be available for this garment type.",
        );
        return;
      }

      // Apply the trim color to side panel sections
      sideSections.forEach((section) => {
        console.log(` Applying side stripe color to: "${section.name}"`);
        updateSection(section.id, {
          color: trimColor,
          trimDesign: trimPattern,
          trimColor: trimColor,
        });
      });

      toast.success(
        `Side stripe color applied to ${sideSections.length} panel(s): ${sideSections.map((s) => s.name).join(", ")}`,
      );
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
        (trimLocation === "sides" &&
          (sectionName.includes("side") || sectionName.includes("panel"))) ||
        // Also match trim/piping sections for jersey top/bottom
        sectionName.includes("trim") ||
        sectionName.includes("piping")
      );
    });

    if (sectionsToUpdate.length === 0) {
      toast.error(
        `No sections found matching "${TRIM_LOCATIONS.find((l) => l.id === trimLocation)?.name}". Try "Side Stripes" for jersey/pants side lines.`,
      );
      return;
    }

    try {
      sectionsToUpdate.forEach((section) => {
        console.log(
          ` Applying trim to section: "${section.name}" (${section.id})`,
        );
        updateSection(section.id, {
          trimDesign: trimPattern,
          trimColor: trimColor,
        });
      });

      console.log(
        ` Trim applied to ${sectionsToUpdate.length} sections:`,
        sectionsToUpdate.map((s) => s.name),
      );
      toast.success(
        `Trim applied to ${sectionsToUpdate.length} section(s): ${sectionsToUpdate.map((s) => s.name).join(", ")}`,
      );
    } catch (error) {
      console.error(" Failed to apply trim:", error);
      toast.error("Failed to apply trim. Please try again.");
    }
  };

  // Show which sections have trims
  const sectionsWithTrims = sections.filter((s) => s.trimDesign);

  // Show side stripe layers
  const sideStripeLayers = textureLayers.filter((l) =>
    l.name.includes("Side Stripe"),
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="space-y-1 shrink-0">
        <h2 className="text-sm font-semibold">Trim Lines</h2>
        <p className="text-xs text-muted-foreground">
          Add decorative lines to edges
        </p>
      </div>

      {/* Main Content Area - Split for Desktop */}
      <div className="flex-1 min-h-0 md:grid md:grid-cols-2 md:gap-6 overflow-y-auto">
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-4">
          {/* Grid for Pattern and Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Style</Label>
              <Select value={trimPattern} onValueChange={setTrimPattern}>
                <SelectTrigger className="h-9 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/20" />
                    <SelectValue placeholder="Pattern" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TRIM_PATTERNS.map((pattern) => (
                    <SelectItem
                      key={pattern.id}
                      value={pattern.id}
                      className="text-xs"
                    >
                      {pattern.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Location</Label>
              <Select value={trimLocation} onValueChange={setTrimLocation}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Apply to..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIM_LOCATIONS.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="text-xs">
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color & Width Controls */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Appearance</Label>
            <div className="flex gap-3 items-center p-2 border rounded-lg bg-card shadow-sm">
              <div className="shrink-0">
                <div
                  className="w-9 h-9 rounded-lg border cursor-pointer shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: trimColor }}
                  onClick={() => setColorPickerOpen(true)}
                />
              </div>

              <div className="h-8 w-px bg-border mx-1" />

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span>Width</span>
                  <span>{trimWidth}px</span>
                </div>
                <Slider
                  value={[trimWidth]}
                  onValueChange={(v) => setTrimWidth(v[0])}
                  min={2}
                  max={30}
                  step={1}
                  className="touch-manipulation py-1"
                />
              </div>
            </div>
          </div>

          {/* Advanced Options - Pattern-specific */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
            <Label className="text-xs font-semibold text-primary">
              Advanced Options
            </Label>

            {/* Solid Line Options */}
            {trimPattern === "solid" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Edge Style
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {EDGE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setEdgeStyle(style.id)}
                        className={`p-2 text-[10px] rounded border transition-all ${
                          edgeStyle === style.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Double Line Options */}
            {trimPattern === "double" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Line Style
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DOUBLE_LINE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setDoubleLineStyle(style.id)}
                        className={`p-2 text-[10px] rounded border transition-all ${
                          doubleLineStyle === style.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
                    <span>Gap Between Lines</span>
                    <span>{lineGap}px</span>
                  </div>
                  <Slider
                    value={[lineGap]}
                    onValueChange={(v) => setLineGap(v[0])}
                    min={1}
                    max={15}
                    step={1}
                    className="touch-manipulation"
                  />
                </div>

                {/* Secondary Color for outlined style */}
                {doubleLineStyle === "outlined" && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Center Gap Color
                    </Label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-8 h-8 rounded border cursor-pointer shadow-sm"
                        style={{ backgroundColor: trimSecondaryColor }}
                        onClick={() => setSecondaryColorPickerOpen(true)}
                      />
                      <span className="text-xs font-mono">
                        {trimSecondaryColor}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleAddTrim}
            className="w-full h-10 touch-manipulation text-sm font-semibold"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply to{" "}
            {
              TRIM_LOCATIONS.find((l) => l.id === trimLocation)?.name.split(
                " ",
              )[0]
            }
          </Button>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded text-xs text-blue-900 dark:text-blue-200 mt-2">
            <strong> Tip:</strong> Use "Side Stripes" options to add vertical
            stripes on the sides of jerseys and pants.
          </div>
        </div>

        {/* RIGHT COLUMN: Preview & Lists */}
        <div className="space-y-4 mt-6 md:mt-0">
          {/* Preview Card */}
          <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold">Preview</Label>
              <span className="text-[10px] text-muted-foreground uppercase">
                {TRIM_PATTERNS.find((p) => p.id === trimPattern)?.name}
              </span>
            </div>
            <div className="h-16 bg-background rounded border flex items-center justify-center relative overflow-hidden shadow-sm">
              {/* Enhanced Preview */}
              {trimPattern === "solid" && (
                <div
                  style={{
                    height: `${trimWidth}px`,
                    backgroundColor: trimColor,
                    width: "100%",
                    borderRadius:
                      edgeStyle === "rounded"
                        ? `${trimWidth / 2}px`
                        : edgeStyle === "beveled"
                          ? "2px"
                          : "0",
                    background:
                      edgeStyle === "gradient-fade"
                        ? `linear-gradient(90deg, transparent 0%, ${trimColor} 15%, ${trimColor} 85%, transparent 100%)`
                        : trimColor,
                  }}
                />
              )}
              {trimPattern === "double" && (
                <div
                  className="flex flex-col justify-center gap-[2px] w-full"
                  style={{ gap: `${lineGap}px` }}
                >
                  <div
                    style={{
                      height: `${doubleLineStyle === "thick-thin" ? trimWidth * 0.6 : doubleLineStyle === "thin-thick" ? trimWidth * 0.4 : trimWidth * 0.5}px`,
                      backgroundColor: trimColor,
                      width: "100%",
                    }}
                  />
                  {doubleLineStyle === "outlined" && (
                    <div
                      style={{
                        height: `${lineGap}px`,
                        backgroundColor: trimSecondaryColor,
                        width: "100%",
                      }}
                    />
                  )}
                  <div
                    style={{
                      height: `${doubleLineStyle === "thick-thin" ? trimWidth * 0.4 : doubleLineStyle === "thin-thick" ? trimWidth * 0.6 : trimWidth * 0.5}px`,
                      backgroundColor: trimColor,
                      width: "100%",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Applied Trims List */}
          {(sectionsWithTrims.length > 0 || sideStripeLayers.length > 0) && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Trims
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // Clear all regular trims
                    sectionsWithTrims.forEach((section) => {
                      updateSection(section.id, {
                        trimDesign: undefined,
                        trimColor: undefined,
                      });
                    });

                    // Clear all side stripes
                    sideStripeLayers.forEach((layer) => {
                      removeTextureLayer(layer.id);
                    });

                    toast.success("Removed all trim lines");
                  }}
                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {/* Regular Trims */}
                {sectionsWithTrims.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-2 bg-card rounded-lg border text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-5 h-5 rounded border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: section.trimColor || "#000" }}
                      />
                      <span className="truncate font-medium">
                        {section.name}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 hover:bg-destructive/10"
                      onClick={() =>
                        updateSection(section.id, {
                          trimDesign: undefined,
                          trimColor: undefined,
                        })
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}

                {/* Side Stripes */}
                {sideStripeLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900 text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[10px]">
                        S
                      </div>
                      <span className="truncate font-medium">{layer.name}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeTextureLayer(layer.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-blue-900 dark:text-blue-300" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ColorPickerModal
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        currentColor={trimColor}
        onColorChange={setTrimColor}
        title="Trim Color"
      />

      <ColorPickerModal
        isOpen={secondaryColorPickerOpen}
        onClose={() => setSecondaryColorPickerOpen(false)}
        currentColor={trimSecondaryColor}
        onColorChange={setTrimSecondaryColor}
        title="Secondary Color"
      />
    </div>
  );
}
