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
import { v4 as uuidv4 } from "uuid";

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

  // Draw stripes at multiple positions to cover different UV layouts
  // Jersey/pants models map side panels to various UV positions
  // We'll draw at multiple locations to ensure visibility on most models
  if (side === "left" || side === "both") {
    // Left edge positions
    drawStripe(0);
    drawStripe(Math.round(SIZE * 0.05));
    drawStripe(Math.round(SIZE * 0.1));
    drawStripe(Math.round(SIZE * 0.15));
    // Mid-left positions (some models map sides here)
    drawStripe(Math.round(SIZE * 0.25));
    drawStripe(Math.round(SIZE * 0.3));
    drawStripe(Math.round(SIZE * 0.35));
  }
  if (side === "right" || side === "both") {
    // Right edge positions
    drawStripe(SIZE - stripeWidth);
    drawStripe(Math.round(SIZE * 0.95) - stripeWidth);
    drawStripe(Math.round(SIZE * 0.9) - stripeWidth);
    drawStripe(Math.round(SIZE * 0.85) - stripeWidth);
    // Mid-right positions
    drawStripe(Math.round(SIZE * 0.75) - stripeWidth);
    drawStripe(Math.round(SIZE * 0.7) - stripeWidth);
    drawStripe(Math.round(SIZE * 0.65) - stripeWidth);
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

    // Handle side stripe locations as texture layers
    if (
      trimLocation === "left-side-stripe" ||
      trimLocation === "right-side-stripe" ||
      trimLocation === "both-side-stripes"
    ) {
      const side =
        trimLocation === "left-side-stripe"
          ? "left"
          : trimLocation === "right-side-stripe"
            ? "right"
            : "both";

      const stripeTexture = generateStripeTexture(
        trimColor,
        trimPattern,
        trimWidth,
        side,
      );

      const layerId = `side-stripe-${side}-${uuidv4().slice(0, 8)}`;
      addTextureLayer({
        id: layerId,
        name: `Side Stripe (${side})`,
        type: "pattern",
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: "normal", // Use normal blend so transparent areas stay transparent
        order: textureLayers.length,
        imageUrl: stripeTexture,
        position: [0.5, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      toast.success(
        `Side stripe added! Visible on ${side === "both" ? "both sides" : side + " side"} of jersey/pants.`,
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
          `🎨 Applying trim to section: "${section.name}" (${section.id})`,
        );
        updateSection(section.id, {
          trimDesign: trimPattern,
          trimColor: trimColor,
        });
      });

      console.log(
        `✅ Trim applied to ${sectionsToUpdate.length} sections:`,
        sectionsToUpdate.map((s) => s.name),
      );
      toast.success(
        `Trim applied to ${sectionsToUpdate.length} section(s): ${sectionsToUpdate.map((s) => s.name).join(", ")}`,
      );
    } catch (error) {
      console.error("❌ Failed to apply trim:", error);
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
                trimPattern === "shadow"
                  ? "0 2px 4px rgba(0,0,0,0.2)"
                  : trimPattern === "embossed"
                    ? "inset 0 2px 4px rgba(0,0,0,0.3)"
                    : "",
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
          {TRIM_PATTERNS.find((p) => p.id === trimPattern)?.description}
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
      <Button
        onClick={handleAddTrim}
        className="w-full h-12 touch-manipulation"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Trim to {TRIM_LOCATIONS.find((l) => l.id === trimLocation)?.name}
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

      {/* Show Side Stripe Layers */}
      {sideStripeLayers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Side Stripes ({sideStripeLayers.length})
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sideStripeLayers.forEach((layer) => {
                  removeTextureLayer(layer.id);
                });
                toast.success("All side stripes removed");
              }}
              className="h-8 text-xs touch-manipulation"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {sideStripeLayers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 text-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {layer.imageUrl && (
                    <img
                      src={layer.imageUrl}
                      alt={layer.name}
                      className="w-8 h-8 object-contain rounded bg-white"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{layer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Texture layer stripe
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 hover:bg-destructive/10 touch-manipulation"
                  onClick={() => {
                    removeTextureLayer(layer.id);
                    toast.success("Side stripe removed");
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
        <strong>💡 Tip:</strong> Use "Side Stripes" options to add vertical
        stripes on the sides of jerseys and pants. These appear as texture
        overlays on the garment.
      </div>
    </div>
  );
}
