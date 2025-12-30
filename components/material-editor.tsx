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
  Plus,
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

  const allSections = useConfiguratorStore((state) => state.sections);
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );

  // Filter out unwanted sections
  const sections = allSections.filter((section) => {
    // Hide "Sleeves" for Volleyball Long Sleeve Tops
    if (
      currentModelUrl?.includes("volleyball-long-sleeve-tops") &&
      section.name === "Sleeves"
    ) {
      return false;
    }
    return true;
  });

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
    <div className="space-y-3 md:space-y-6" data-tour="material-editor">
      <div>
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h3 className="text-sm md:text-sm font-semibold flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            {isVolleyballModel ? "Colors" : "Parts"}
          </h3>
          {linkedSections.size > 0 && (
            <button
              onClick={clearSectionLinks}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[32px] px-2 rounded-lg hover:bg-accent/50"
            >
              <Unlink className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Linked sections info - Compact */}
        {selectedSectionId && linkedSections.size > 0 && (
          <div className="mb-2 md:mb-4 p-2 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg md:rounded-2xl">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                {linkedSections.size} linked
              </p>
            </div>
          </div>
        )}

        {/* Mobile horizontal parts selector - Compact */}
        <div className="md:hidden mb-3">
          <div className="relative">
            <div
              className="overflow-x-auto overflow-y-hidden scrollbar-hide mobile-horizontal-scroll"
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
                scrollBehavior: "smooth",
              }}
            >
              <div className="inline-flex gap-1.5 pb-2 pr-4 pl-0.5">
                {sections.map((section) => {
                  const isSelected = selectedSectionId === section.id;
                  const isLinked = linkedSections.has(section.id);
                  const badge = getSectionBadge(section);

                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setSelectedSection(section.id);
                        setHighlightedSection(section.id);
                      }}
                      onMouseEnter={() => setHighlightedSection(section.id)}
                      onMouseLeave={() => setHighlightedSection(null)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border transition-all whitespace-nowrap text-xs font-medium touch-manipulation min-h-[40px] flex-shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border/50 active:scale-95"
                      } ${isLinked ? "ring-1 ring-blue-500/50" : ""}`}
                      style={{ touchAction: "manipulation" }}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-white/30 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: section.color }}
                      />
                      <span className="max-w-[80px] truncate">
                        {section.name}
                      </span>
                      {badge && (
                        <span className="text-[10px] opacity-70">
                          {badge.text}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Remove mobile hint - too verbose */}

        <div className="space-y-2 md:space-y-4">
          {Object.entries(groupedSections).map(
            ([category, categorySections]) => (
              <div key={category}>
                {/* Category Header - Compact for mobile */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-2.5 md:p-4 text-left rounded-lg md:rounded-2xl hover:bg-secondary/50 active:bg-secondary/70 transition-all duration-150 mb-1.5 md:mb-3 min-h-[44px] md:min-h-[56px] bg-secondary/20 border border-border/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-5 bg-primary rounded-full" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {category}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {categorySections.length}
                    </span>
                    {expandedCategories[category] ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Category Sections - Compact */}
                {expandedCategories[category] && (
                  <div className="space-y-1.5 md:space-y-3 md:ml-2 md:pl-4 md:border-l-2 border-border/50">
                    {categorySections.map((section) => {
                      const isSelected = selectedSectionId === section.id;
                      const isLinked = linkedSections.has(section.id);
                      const badge = getSectionBadge(section);

                      return (
                        <div
                          key={section.id}
                          className={`group relative rounded-lg md:rounded-2xl transition-all duration-150 ${
                            isLinked ? "ring-1 ring-blue-500/50" : ""
                          }`}
                          onMouseEnter={() => setHighlightedSection(section.id)}
                          onMouseLeave={() => setHighlightedSection(null)}
                        >
                          <button
                            onClick={() => {
                              setSelectedSection(section.id);
                              setHighlightedSection(section.id);
                            }}
                            className={`w-full text-left px-3 py-2.5 md:px-4 md:py-4 text-sm rounded-lg md:rounded-2xl transition-all duration-150 min-h-[48px] md:min-h-[48px] ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-secondary/20 hover:bg-secondary/40 active:bg-secondary/60"
                            }`}
                          >
                            <div className="flex items-center justify-start gap-3 md:gap-4">
                              <div
                                className="w-8 h-8 md:w-6 md:h-6 rounded-lg md:rounded-lg flex-shrink-0 ring-1 ring-border/50 shadow-sm"
                                style={{ backgroundColor: section.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium text-sm">
                                    {section.name}
                                  </span>
                                  {badge && (
                                    <Badge
                                      variant={badge.variant}
                                      className="text-[10px] px-1.5 py-0 flex-shrink-0"
                                    >
                                      {badge.text}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isLinked && (
                                <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                          {selectedSectionId &&
                            selectedSectionId !== section.id && (
                              <button
                                onClick={() => toggleSectionLink(section.id)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
                                  isLinked
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "bg-background/80 text-muted-foreground hover:text-foreground md:opacity-60 md:group-hover:opacity-100"
                                }`}
                                title={
                                  isLinked ? "Click to unlink" : "Click to link"
                                }
                              >
                                <Link2 className="w-4 h-4" />
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
        <div className="border-t border-border/30 pt-3 md:pt-6">
          <div className="mb-2 md:mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              {selectedSection.name}
            </h3>
          </div>

          <div className="space-y-3 md:space-y-5">
            {!isVolleyballModel && selectedSection.customTexture && (
              <div className="p-2.5 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  Custom texture applied
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateSection(selectedSection.id, {
                      customTexture: undefined,
                    })
                  }
                  className="w-full min-h-[40px] text-sm rounded-lg"
                >
                  Remove Texture
                </Button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-2 md:mb-4 text-muted-foreground">
                Base Color
              </label>

              {/* Color Preview and Picker Button - Compact */}
              <div className="flex items-center gap-3 mb-2 p-2 bg-secondary/20 rounded-lg">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
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
                    className="w-full justify-start min-h-[44px] text-sm font-medium rounded-lg border hover:border-primary/50"
                    data-tour="color-picker"
                  >
                    <Palette className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">Choose Color</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {selectedSection.color.toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Status messages - Compact */}
              {selectedSection.customTexture && (
                <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Color disabled with texture
                  </p>
                </div>
              )}
              {selectedSection.gradient?.enabled && (
                <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Color disabled with gradient
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
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-9"
                        onClick={() => {
                          // Generate a simple white stripe for tinting (or just a colored stripe)
                          // For now, let's just make a solid color stripe based on current trim color
                          const canvas = document.createElement("canvas");
                          canvas.width = 512;
                          canvas.height = 32; // Thin stripe
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            ctx.fillStyle =
                              selectedSection.trimColor || "#000000";
                            ctx.fillRect(0, 0, 512, 32);
                            const dataUrl = canvas.toDataURL();

                            useConfiguratorStore.getState().addTextureLayer({
                              id: crypto.randomUUID(),
                              name: `Trim Line`,
                              type: "image",
                              visible: true,
                              locked: false,
                              opacity: 1,
                              blendMode: "normal",
                              imageUrl: dataUrl,
                              position: [0.5, 0.5, 0],
                              scale: [1, 0.05, 1], // Full width, thin height default
                              rotation: [0, 0, 0],
                              order:
                                useConfiguratorStore.getState().textureLayers
                                  .length,
                            });
                          }
                        }}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add Movable Trim Line
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        Adds a stripe layer you can drag and resize freely on
                        the model.
                      </p>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or use preset
                          </span>
                        </div>
                      </div>

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
                        <option value="none">No Preset Trim</option>
                        <option value="single-line">Single Line (Auto)</option>
                        <option value="double-line">Double Line (Auto)</option>
                        <option value="triple-line">Triple Line (Auto)</option>
                        <option value="dashed-line">Dashed Line</option>
                        <option value="dotted-line">Dotted Line</option>
                        <option value="zigzag">Zigzag Pattern</option>
                        <option value="wave">Wave Pattern</option>
                      </select>
                    </div>
                  </div>

                  {/* Trim Color - only show if a trim design is selected */}
                  {selectedSection.trimDesign &&
                    selectedSection.trimDesign !== "none" && (
                      <div className="mt-4">
                        <label className="block text-xs font-medium mb-3">
                          Preset Trim Color
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
