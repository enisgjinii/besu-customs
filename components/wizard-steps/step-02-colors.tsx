"use client";
import { useConfiguratorStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";

export function Step02Colors() {
  const sections = useConfiguratorStore((state) => state.sections);
  const modelLoading = useConfiguratorStore((state) => state.modelLoading);
  const sectionsLoading = useConfiguratorStore(
    (state) => state.sectionsLoading,
  );
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const updateAllSections = useConfiguratorStore(
    (state) => state.updateAllSections,
  );
  const openSectionColorPicker = useConfiguratorStore(
    (state) => state.openSectionColorPicker,
  );

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const { isMobile, screenWidth } = useIsMobile();

  // Reset active section when model changes
  useEffect(() => {
    setActiveSectionId(null);
  }, [currentModelUrl]);

  // Auto-select first section when sections load
  useEffect(() => {
    if (!activeSectionId && sections.length > 0) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  /* New state for tracking the color to revert to after hover */
  const [previewRevertColor, setPreviewRevertColor] = useState<string | null>(
    null,
  );

  const handleColorChange = (color: string) => {
    if (activeSectionId) {
      updateSection(activeSectionId, { color });
      // If we confirm a selection, we don't want to revert anymore
      setPreviewRevertColor(null);
    }
  };

  const handleMouseEnter = (color: string) => {
    if (activeSectionId && activeSection) {
      // If we aren't already previewing, save the current color
      if (!previewRevertColor) {
        setPreviewRevertColor(activeSection.color);
      }
      // Apply the preview color
      updateSection(activeSectionId, { color });
    }
  };

  const handleMouseLeave = () => {
    if (activeSectionId && previewRevertColor) {
      // Revert to the original color
      updateSection(activeSectionId, { color: previewRevertColor });
      setPreviewRevertColor(null);
    }
  };

  const handleApplyToAll = () => {
    if (activeSectionId) {
      const activeSection = sections.find((s) => s.id === activeSectionId);
      if (activeSection) {
        updateAllSections({ color: activeSection.color });
      }
    }
  };

  const activeSection = sections.find((s) => s.id === activeSectionId);

  // Full color palette
  const PRESET_COLORS = [
    "#FFFFFF",
    "#F5F5F5",
    "#E0E0E0",
    "#C0C0C0",
    "#808080",
    "#404040",
    "#1C1C1C",
    "#000000",
    "#E3F2FD",
    "#90CAF9",
    "#42A5F5",
    "#1E88E5",
    "#1565C0",
    "#0D47A1",
    "#00274C",
    "#001529",
    "#FFEBEE",
    "#EF9A9A",
    "#EF5350",
    "#E53935",
    "#C62828",
    "#B71C1C",
    "#8B0000",
    "#5C0000",
    "#E8F5E9",
    "#A5D6A7",
    "#66BB6A",
    "#43A047",
    "#2E7D32",
    "#1B5E20",
    "#004D00",
    "#003300",
    "#FFF8E1",
    "#FFE082",
    "#FFD54F",
    "#FFC107",
    "#FF9800",
    "#F57C00",
    "#E65100",
    "#BF360C",
    "#F3E5F5",
    "#CE93D8",
    "#AB47BC",
    "#8E24AA",
    "#6A1B9A",
    "#4A148C",
    "#FF4081",
    "#C51162",
  ];

  // Dynamic grid columns based on screen width
  const getGridCols = () => {
    if (!isMobile) return 8;
    if (screenWidth < 320) return 6;
    if (screenWidth < 375) return 7;
    return 8;
  };

  // Show loading state
  if (modelLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading model...</span>
      </div>
    );
  }

  // Show empty state if no model selected
  if (!currentModelUrl) {
    return (
      <div className="text-center py-4 text-muted-foreground text-xs">
        Select a model first to customize colors
      </div>
    );
  }

  // Show loading state if sections are being fetched
  if (sectionsLoading || sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading color sections...</span>
      </div>
    );
  }

  // Scroll handlers (Must be unconditional)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Mobile layout - horizontal parts pills, then color grid below
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* TOP: Horizontal parts selector */}
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
          <div className="inline-flex gap-1.5 pb-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0",
                  activeSectionId === section.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/80 text-foreground hover:bg-muted",
                )}
              >
                <div
                  className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0"
                  style={{ backgroundColor: section.color }}
                />
                <span>{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color grid - 8 columns for compact display */}
        <div className="grid grid-cols-8 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              onMouseEnter={() => handleMouseEnter(color)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "aspect-square rounded-full border",
                activeSection?.color?.toUpperCase() === color.toUpperCase()
                  ? "ring-2 ring-primary ring-offset-1 border-primary"
                  : "border-border/20 hover:border-primary/50",
              )}
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
        </div>

        {/* Bottom row - custom color only (more compact) */}
        <div className="flex items-center gap-2 pt-1">
          <div
            className="w-8 h-8 rounded-lg border border-border flex-shrink-0 shadow-sm"
            style={{ backgroundColor: activeSection?.color || "#ffffff" }}
            title="Color preview"
          />
          <Input
            type="text"
            value={activeSection?.color || "#ffffff"}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                handleColorChange(val);
              }
            }}
            className="h-8 text-[11px] font-mono uppercase flex-1 px-2"
            placeholder="#000000"
          />
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="space-y-3 w-full h-full flex flex-col">
      {/* Section pills with navigation - Clean & Visible */}
      <div className="relative group shrink-0">
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background shadow-sm border rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide mx-6"
        >
          <div className="inline-flex gap-2 pb-1 px-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all",
                  activeSectionId === section.id
                    ? "bg-primary/10 text-primary border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:border-primary/30",
                )}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: section.color }}
                />
                <span className="max-w-[120px] truncate">{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background shadow-sm border rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 h-full min-h-0">
        {/* Left: Color Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                onMouseEnter={() => handleMouseEnter(color)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "aspect-square rounded-full border transition-all relative group",
                  activeSection?.color?.toUpperCase() === color.toUpperCase()
                    ? "ring-2 ring-primary ring-offset-2 border-primary z-10"
                    : "border-border/30 hover:border-primary/50 hover:scale-110",
                )}
                style={{ backgroundColor: color }}
                title={color}
              >
                {activeSection?.color?.toUpperCase() ===
                  color.toUpperCase() && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Compact Actions Panel */}
        <div className="w-48 shrink-0 flex flex-col gap-3">
          {/* Custom Color Input - Simplified */}
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <div
                className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                style={{ backgroundColor: activeSection?.color || "#ffffff" }}
                title="Color preview"
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={activeSection?.color || "#ffffff"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      handleColorChange(val);
                    }
                  }}
                  className="h-8 text-xs font-mono uppercase"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
