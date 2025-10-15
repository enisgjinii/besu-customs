"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Palette, Sliders, Link2, Unlink, ChevronDown, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColorPickerModal } from "./color-picker-modal";

function getSectionBadge(section: { name: string; originalName?: string }) {
  // Use the user-friendly name instead of original name for badge detection
  const name =
    section.originalName?.toLowerCase() || section.name.toLowerCase();

  if (name.includes("front") && !name.includes("back")) {
    return { text: "Front", variant: "default" as const };
  }
  if (name.includes("back") && !name.includes("front")) {
    return { text: "Back", variant: "secondary" as const };
  }
  if (name.includes("left") && !name.includes("right")) {
    return { text: "Left", variant: "outline" as const };
  }
  if (name.includes("right") && !name.includes("left")) {
    return { text: "Right", variant: "outline" as const };
  }

  return null;
}

export function MaterialEditor() {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [extractingNames, setExtractingNames] = useState(false);
  const [extractNamesMessage, setExtractNamesMessage] = useState("");

  const sections = useConfiguratorStore((state) => state.sections);
  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
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

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

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
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Initialize all categories as expanded by default
  if (Object.keys(expandedCategories).length === 0 && Object.keys(groupedSections).length > 0) {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(groupedSections).forEach(category => {
      initialExpanded[category] = true;
    });
    setExpandedCategories(initialExpanded);
  }

  const handleExtractMaterialNames = async () => {
    setExtractingNames(true);
    setExtractNamesMessage("Extracting material names...");
    
    try {
      // Call the API endpoint to extract material names
      const response = await fetch('/api/extract-material-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setExtractNamesMessage("Material names extracted successfully!");
        // Optionally, you could refresh the page or update the UI
        setTimeout(() => setExtractNamesMessage(""), 3000);
      } else {
        setExtractNamesMessage(`Error: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error("Error extracting material names:", error);
      if (error instanceof Error) {
        setExtractNamesMessage(`Error: ${error.message}`);
      } else {
        setExtractNamesMessage("Error: Unknown error occurred");
      }
    } finally {
      setExtractingNames(false);
    }
  };

  return (
    <div className="space-y-6" data-tour="material-editor">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Material Sections
          </h3>
          {linkedSections.size > 0 && (
            <button
              onClick={clearSectionLinks}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Unlink className="w-3 h-3" />
              Clear Links
            </button>
          )}
        </div>

        {/* Extract Material Names Button */}
        <div className="mb-4">
          <Button 
            onClick={handleExtractMaterialNames} 
            disabled={extractingNames}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            {extractingNames ? "Extracting..." : "Extract Material Names"}
          </Button>
          {extractNamesMessage && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {extractNamesMessage}
            </p>
          )}
        </div>

        {selectedSectionId && linkedSections.size > 0 && (
          <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">
                  {linkedSections.size} linked
                </span>{" "}
                - edits apply to all
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(groupedSections).map(
            ([category, categorySections]) => (
              <div key={category}>
                {/* Category Header with Expand/Collapse */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-2 text-left rounded-lg hover:bg-secondary/50 transition-colors mb-2"
                >
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </h4>
                  {expandedCategories[category] ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {/* Category Sections - Only show if expanded */}
                {expandedCategories[category] && (
                  <div className="space-y-1.5 ml-2 pl-2 border-l border-border/50">
                    {categorySections.map((section) => {
                      const isSelected = selectedSectionId === section.id;
                      const isLinked = linkedSections.has(section.id);
                      const badge = getSectionBadge(section);

                      return (
                        <div
                          key={section.id}
                          className={`group relative rounded-lg transition-all ${
                            isLinked ? "ring-2 ring-blue-500/50" : ""
                          }`}
                        >
                          <button
                            onClick={() => setSelectedSection(section.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all ${
                              isSelected
                                ? "bg-accent text-accent-foreground shadow-sm"
                                : "bg-secondary/30 hover:bg-secondary/50"
                            }`}
                          >
                            <div className="flex items-center justify-start gap-2.5">
                              <div
                                className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-border/50 shadow-sm"
                                style={{ backgroundColor: section.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium">
                                    {section.name}
                                  </span>
                                  {badge && (
                                    <Badge
                                      variant={badge.variant}
                                      className="text-xs px-1.5 py-0.5 flex-shrink-0"
                                    >
                                      {badge.text}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isLinked && (
                                <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                          {selectedSectionId &&
                            selectedSectionId !== section.id && (
                              <button
                                onClick={() => toggleSectionLink(section.id)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
                                  isLinked
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100"
                                }`}
                                title={
                                  isLinked
                                    ? "Click to unlink"
                                    : "Click to link with selected"
                                }
                              >
                                {isLinked ? (
                                  <Link2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Link2 className="w-3.5 h-3.5" />
                                )}
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
        <div className="border-t border-border/50 pt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Editing: {selectedSection.name}
            </h3>
          </div>

          <div className="space-y-4">
            {selectedSection.customTexture && (
              <div className="p-3 bg-secondary/30 rounded-md">
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
                  className="w-full"
                >
                  Remove Texture
                </Button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-3">
                Base Color
              </label>

              {/* Color Preview and Picker Button */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: selectedSection.color }}
                />
                <Button
                  onClick={() => setColorPickerOpen(true)}
                  disabled={
                    !!selectedSection.customTexture ||
                    !!selectedSection.gradient?.enabled
                  }
                  variant="outline"
                  className="flex-1 justify-start"
                  data-tour="color-picker"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Choose Color
                </Button>
              </div>

              <div className="text-sm text-muted-foreground font-mono bg-secondary/30 px-3 py-2 rounded-md">
                {selectedSection.color.toUpperCase()}
              </div>

              {selectedSection.customTexture && (
                <p className="text-xs text-muted-foreground mt-2">
                  Color picker disabled when texture is applied
                </p>
              )}
              {selectedSection.gradient?.enabled && (
                <p className="text-xs text-muted-foreground mt-2">
                  Color picker disabled when gradient is enabled
                </p>
              )}
            </div>

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
                        const newColors = [...selectedSection.gradient!.colors];
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
                        const newColors = [...selectedSection.gradient!.colors];
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
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {selectedSection && (
        <ColorPickerModal
          isOpen={colorPickerOpen}
          onClose={() => setColorPickerOpen(false)}
          currentColor={selectedSection.color}
          onColorChange={(color) =>
            updateSection(selectedSection.id, { color })
          }
          disabled={
            !!selectedSection.customTexture ||
            !!selectedSection.gradient?.enabled
          }
          recentColors={recentColors}
          onAddRecentColor={addRecentColor}
        />
      )}
    </div>
  );
}