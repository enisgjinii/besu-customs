"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import {
  Palette,
  Sliders,
  Link2,
  Unlink,
  ChevronDown,
  ChevronRight,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColorPickerModal } from "./color-picker-modal";

function getSectionBadge(section: { name: string; originalName?: string }) {
  // Use the user-friendly name instead of original name for badge detection
  const name =
    section.originalName?.toLowerCase() || section.name.toLowerCase();

  // Remove front/back badges as requested - only show left/right
  if (name.includes("left") && !name.includes("right")) {
    return { text: "Left", variant: "outline" as const };
  }
  if (name.includes("right") && !name.includes("left")) {
    return { text: "Right", variant: "outline" as const };
  }

  return null;
}

export function MaterialEditor() {
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  // Extraction UI removed — we rely on precomputed API files

  const sections = useConfiguratorStore((state) => state.sections);
  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );
  const setHighlightedSection = useConfiguratorStore(
    (state) => state.setHighlightedSection,
  );
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const linkedSections = useConfiguratorStore((state) => state.linkedSections);
  const toggleSectionLink = useConfiguratorStore(
    (state) => state.toggleSectionLink,
  );
  const clearSectionLinks = useConfiguratorStore(
    (state) => state.clearSectionLinks,
  );
  const recentColors = useConfiguratorStore((state) => state.recentColors);
  const addRecentColor = useConfiguratorStore((state) => state.addRecentColor);
  const openSectionColorPicker = useConfiguratorStore(
    (s) => s.openSectionColorPicker,
  );
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // Check if this is a volleyball model
  const isVolleyballModel = currentModelUrl?.includes("Volleyball");

  // Group sections by category
  const groupedSections = sections.reduce(
    (acc, section) => {
      if (!acc[section.category]) {
        acc[section.category] = [];
      }
      acc[section.category].push(section);
      return acc;
    },
    {} as Record<string, typeof sections>,
  );

  // Toggle category expanded state
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Initialize all categories as expanded by default
  if (
    Object.keys(expandedCategories).length === 0 &&
    Object.keys(groupedSections).length > 0
  ) {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(groupedSections).forEach((category) => {
      initialExpanded[category] = true;
    });
    setExpandedCategories(initialExpanded);
  }

  return (
    <div className="space-y-5 md:space-y-6" data-tour="material-editor">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-sm font-bold flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {isVolleyballModel ? "Colors" : "Material Sections"}
          </h3>
          {linkedSections.size > 0 && (
            <button
              onClick={clearSectionLinks}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg hover:bg-accent/50"
            >
              <Unlink className="w-4 h-4" />
              Clear Links
            </button>
          )}
        </div>

        {/* Linked sections info */}
        {selectedSectionId && linkedSections.size > 0 && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {linkedSections.size} linked - edits apply to all
              </p>
            </div>
          </div>
        )}

        {/* Mobile-friendly hint */}
        <div className="md:hidden mb-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <Palette className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Quick Tip
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Tap any section below to select it, then use "Choose Color" to
                change its color. Link sections together to change multiple
                parts at once.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 md:space-y-4">
          {Object.entries(groupedSections).map(
            ([category, categorySections]) => (
              <div key={category}>
                {/* Category Header with Expand/Collapse - Enhanced for mobile */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-5 md:p-4 text-left rounded-2xl hover:bg-secondary/50 active:bg-secondary/70 transition-all duration-200 mb-4 md:mb-3 min-h-[68px] md:min-h-[56px] bg-gradient-to-r from-secondary/20 to-transparent border border-border/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-primary rounded-full" />
                    <h4 className="text-sm md:text-xs font-bold text-foreground md:text-muted-foreground uppercase tracking-wider">
                      {category}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {categorySections.length} item
                      {categorySections.length !== 1 ? "s" : ""}
                    </span>
                    {expandedCategories[category] ? (
                      <ChevronDown className="w-6 h-6 md:w-5 md:h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-6 h-6 md:w-5 md:h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Category Sections - Only show if expanded */}
                {expandedCategories[category] && (
                  <div className="space-y-3 md:ml-2 md:pl-4 md:border-l-2 border-border/50">
                    {categorySections.map((section) => {
                      const isSelected = selectedSectionId === section.id;
                      const isLinked = linkedSections.has(section.id);
                      const badge = getSectionBadge(section);

                      return (
                        <div
                          key={section.id}
                          className={`group relative rounded-2xl transition-all duration-200 ${
                            isLinked ? "ring-2 ring-blue-500/50" : ""
                          }`}
                          onMouseEnter={() => setHighlightedSection(section.id)}
                          onMouseLeave={() => setHighlightedSection(null)}
                        >
                          <button
                            onClick={() => {
                              setSelectedSection(section.id);
                              setHighlightedSection(section.id);
                            }}
                            className={`w-full text-left px-5 py-5 md:px-4 md:py-4 text-base rounded-2xl transition-all duration-200 min-h-[72px] md:min-h-[48px] ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02] md:scale-100"
                                : "bg-secondary/30 hover:bg-secondary/50 active:bg-secondary/70 active:scale-[0.98]"
                            }`}
                          >
                            <div className="flex items-center justify-start gap-5 md:gap-4">
                              <div
                                className="w-12 h-12 md:w-6 md:h-6 rounded-xl md:rounded-lg flex-shrink-0 ring-2 md:ring-1.5 ring-border/50 shadow-md md:shadow-sm transition-all duration-200"
                                style={{ backgroundColor: section.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 md:gap-2.5">
                                  <span className="truncate font-bold md:font-semibold text-lg md:text-sm tracking-tight">
                                    {section.name}
                                  </span>
                                  {badge && (
                                    <Badge
                                      variant={badge.variant}
                                      className="text-xs px-2.5 py-1 md:px-2 md:py-0.5 flex-shrink-0 font-medium"
                                    >
                                      {badge.text}
                                    </Badge>
                                  )}
                                </div>
                                {/* Show color code on mobile for quick reference */}
                                <div className="md:hidden mt-1">
                                  <span className="text-sm font-mono opacity-70">
                                    {section.color.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              {isLinked && (
                                <Link2 className="w-6 h-6 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              )}
                              {isSelected && (
                                <div className="w-3 h-3 bg-current rounded-full flex-shrink-0 md:hidden" />
                              )}
                            </div>
                          </button>
                          {selectedSectionId &&
                            selectedSectionId !== section.id && (
                              <button
                                onClick={() => toggleSectionLink(section.id)}
                                className={`absolute right-4 md:right-3 top-1/2 -translate-y-1/2 p-3 md:p-2.5 rounded-xl transition-all min-w-[52px] min-h-[52px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center ${
                                  isLinked
                                    ? "bg-blue-500 text-white shadow-lg"
                                    : "bg-background/90 text-muted-foreground hover:text-foreground hover:bg-background md:opacity-0 md:group-hover:opacity-100"
                                }`}
                                title={
                                  isLinked
                                    ? "Click to unlink"
                                    : "Click to link with selected"
                                }
                              >
                                <Link2 className="w-6 h-6 md:w-5 md:h-5" />
                              </button>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      </div>

      {selectedSection && (
        <div className="border-t border-border/50 pt-5 md:pt-6">
          <div className="mb-5">
            <h3 className="text-base md:text-sm font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Editing: {selectedSection.name}
            </h3>
          </div>

          <div className="space-y-5">
            {!isVolleyballModel && selectedSection.customTexture && (
              <div className="p-4 bg-secondary/30 rounded-2xl">
                <p className="text-sm text-muted-foreground mb-3">
                  Custom texture applied
                </p>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() =>
                    updateSection(selectedSection.id, {
                      customTexture: undefined,
                    })
                  }
                  className="w-full min-h-[56px] text-base rounded-xl font-medium"
                >
                  Remove Texture
                </Button>
              </div>
            )}

            <div>
              <label className="block text-lg md:text-sm font-bold mb-5 md:mb-4">
                Base Color
              </label>

              {/* Color Preview and Picker Button - Enhanced for mobile */}
              <div className="flex items-center gap-5 mb-5 p-4 md:p-0 bg-gradient-to-r from-muted/20 to-transparent rounded-2xl md:bg-none">
                <div
                  className="w-20 h-20 md:w-14 md:h-14 rounded-2xl border-3 border-border shadow-lg flex-shrink-0 transition-all duration-200"
                  style={{ backgroundColor: selectedSection.color }}
                />
                <div className="flex-1">
                  <Button
                    onClick={() => openSectionColorPicker(selectedSection.id)}
                    disabled={
                      !!selectedSection.customTexture ||
                      !!selectedSection.gradient?.enabled
                    }
                    variant="outline"
                    className="w-full justify-start min-h-[64px] md:min-h-[48px] text-lg md:text-sm font-semibold rounded-2xl md:rounded-xl border-2 hover:border-primary/50 transition-all duration-200"
                    data-tour="color-picker"
                  >
                    <Palette className="w-6 h-6 md:w-5 md:h-5 mr-4 md:mr-3 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-base md:text-sm">Choose Color</span>
                      <span className="text-sm md:text-xs text-muted-foreground font-mono">
                        {selectedSection.color.toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Color code display - Enhanced */}
              <div className="bg-gradient-to-r from-secondary/40 to-secondary/20 px-5 py-4 rounded-2xl border border-border/30 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Current Color:
                  </span>
                  <span className="text-lg md:text-sm font-mono font-bold tracking-wider">
                    {selectedSection.color.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status messages - Enhanced */}
              {selectedSection.customTexture && (
                <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    Color picker disabled when texture is applied
                  </p>
                </div>
              )}
              {selectedSection.gradient?.enabled && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Color picker disabled when gradient is enabled
                  </p>
                </div>
              )}
            </div>

            {/* Trim Design Options - for jerseys and trim sections */}
            {!isVolleyballModel &&
              (selectedSection.category === "Trim Options DEMO" ||
                selectedSection.category === "Jersey" ||
                selectedSection.category === "Piping/Trim") && (
                <div className="border-t border-border/50 pt-4">
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-3">
                      Trim / Piping Design
                    </label>
                    <select
                      value={selectedSection.trimDesign || "none"}
                      onChange={(e) =>
                        updateSection(selectedSection.id, {
                          trimDesign:
                            e.target.value === "none"
                              ? undefined
                              : e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      <option value="none">No Trim</option>
                      <option value="single-line">Single Line</option>
                      <option value="double-line">Double Line</option>
                      <option value="triple-line">Triple Line</option>
                      <option value="dashed-line">Dashed Line</option>
                      <option value="dotted-line">Dotted Line</option>
                      <option value="zigzag">Zigzag Pattern</option>
                      <option value="wave">Wave Pattern</option>
                    </select>
                  </div>

                  {/* Trim Color - only show if a trim design is selected */}
                  {selectedSection.trimDesign &&
                    selectedSection.trimDesign !== "none" && (
                      <div className="mt-4">
                        <label className="block text-xs font-medium mb-3">
                          Trim Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={selectedSection.trimColor || "#000000"}
                            onChange={(e) =>
                              updateSection(selectedSection.id, {
                                trimColor: e.target.value,
                              })
                            }
                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={selectedSection.trimColor || "#000000"}
                              onChange={(e) =>
                                updateSection(selectedSection.id, {
                                  trimColor: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background font-mono"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

            {/* Gradient section - only for non-volleyball models */}
            {!isVolleyballModel && (
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium">Gradient</label>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selectedSection.gradient?.enabled || false}
                    onClick={(e) => {
                      e.preventDefault();
                      const enabled = !selectedSection.gradient?.enabled;
                      updateSection(selectedSection.id, {
                        gradient: enabled
                          ? {
                              enabled: true,
                              type: "linear",
                              colors: [selectedSection.color, "#ffffff"],
                              angle: 90,
                              stops: [0, 1],
                            }
                          : undefined,
                      });
                    }}
                    disabled={!!selectedSection.customTexture}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      selectedSection.gradient?.enabled
                        ? "bg-primary"
                        : "bg-input"
                    } ${
                      selectedSection.customTexture
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        selectedSection.gradient?.enabled
                          ? "translate-x-4"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {selectedSection.gradient?.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-2">
                        Gradient Type
                      </label>
                      <select
                        value={selectedSection.gradient.type}
                        onChange={(e) =>
                          updateSection(selectedSection.id, {
                            gradient: {
                              ...selectedSection.gradient!,
                              type: e.target.value as "linear" | "radial",
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </div>

                    {selectedSection.gradient.type === "linear" && (
                      <div>
                        <label className="block text-xs font-medium mb-2">
                          Angle: {selectedSection.gradient.angle || 90}°
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={selectedSection.gradient.angle || 90}
                          onChange={(e) =>
                            updateSection(selectedSection.id, {
                              gradient: {
                                ...selectedSection.gradient!,
                                angle: Number.parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-primary"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-2">
                        Color 1
                      </label>
                      <input
                        type="color"
                        value={selectedSection.gradient.colors[0]}
                        onChange={(e) => {
                          const newColors = [
                            ...selectedSection.gradient!.colors,
                          ];
                          newColors[0] = e.target.value;
                          updateSection(selectedSection.id, {
                            gradient: {
                              ...selectedSection.gradient!,
                              colors: newColors,
                            },
                          });
                        }}
                        className="w-full h-10 rounded-md border border-input cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-2">
                        Color 2
                      </label>
                      <input
                        type="color"
                        value={selectedSection.gradient.colors[1]}
                        onChange={(e) => {
                          const newColors = [
                            ...selectedSection.gradient!.colors,
                          ];
                          newColors[1] = e.target.value;
                          updateSection(selectedSection.id, {
                            gradient: {
                              ...selectedSection.gradient!,
                              colors: newColors,
                            },
                          });
                        }}
                        className="w-full h-10 rounded-md border border-input cursor-pointer"
                      />
                    </div>

                    {selectedSection.gradient.colors.length > 2 && (
                      <div>
                        <label className="block text-xs font-medium mb-2">
                          Color 3
                        </label>
                        <input
                          type="color"
                          value={selectedSection.gradient.colors[2]}
                          onChange={(e) => {
                            const newColors = [
                              ...selectedSection.gradient!.colors,
                            ];
                            newColors[2] = e.target.value;
                            updateSection(selectedSection.id, {
                              gradient: {
                                ...selectedSection.gradient!,
                                colors: newColors,
                              },
                            });
                          }}
                          className="w-full h-10 rounded-md border border-input cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      {selectedSection.gradient.colors.length < 4 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newColors = [
                              ...selectedSection.gradient!.colors,
                              "#ffffff",
                            ];
                            const newStops = [
                              ...(selectedSection.gradient!.stops || []),
                            ];
                            newStops.push(1);
                            updateSection(selectedSection.id, {
                              gradient: {
                                ...selectedSection.gradient!,
                                colors: newColors,
                                stops: newStops,
                              },
                            });
                          }}
                          className="flex-1"
                        >
                          Add Color
                        </Button>
                      )}
                      {selectedSection.gradient.colors.length > 2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newColors =
                              selectedSection.gradient!.colors.slice(0, -1);
                            const newStops =
                              selectedSection.gradient!.stops?.slice(0, -1);
                            updateSection(selectedSection.id, {
                              gradient: {
                                ...selectedSection.gradient!,
                                colors: newColors,
                                stops: newStops,
                              },
                            });
                          }}
                          className="flex-1"
                        >
                          Remove Color
                        </Button>
                      )}
                    </div>

                    <div className="p-3 rounded-md border border-border/50 bg-secondary/20">
                      <p className="text-xs font-medium mb-2">Preview</p>
                      <div
                        className="w-full h-16 rounded-md"
                        style={{
                          background:
                            selectedSection.gradient.type === "linear"
                              ? `linear-gradient(${selectedSection.gradient.angle || 90}deg, ${selectedSection.gradient.colors.join(", ")})`
                              : `radial-gradient(circle, ${selectedSection.gradient.colors.join(", ")})`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Color picker is rendered at top-level (app/page) via global store control */}
    </div>
  );
}
