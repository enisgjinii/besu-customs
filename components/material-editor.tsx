"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Palette, Sliders, Link2, Unlink, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getSectionBadge(section: any) {
  const name = section.originalName?.toLowerCase() || section.name.toLowerCase();

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
  const sections = useConfiguratorStore((state) => state.sections);
  const selectedSectionId = useConfiguratorStore(
    (state) => state.selectedSectionId,
  );
  const setSelectedSection = useConfiguratorStore(
    (state) => state.setSelectedSection,
  );
  const updateSection = useConfiguratorStore((state) => state.updateSection);
  const linkedSections = useConfiguratorStore((state) => state.linkedSections);
  const toggleSectionLink = useConfiguratorStore((state) => state.toggleSectionLink);
  const clearSectionLinks = useConfiguratorStore((state) => state.clearSectionLinks);

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

  // Get front/back sections for quick toggle
  const frontSections = sections.filter(section =>
    (section.originalName?.toLowerCase() || section.name.toLowerCase()).includes("front") &&
    !(section.originalName?.toLowerCase() || section.name.toLowerCase()).includes("back")
  );
  const backSections = sections.filter(section =>
    (section.originalName?.toLowerCase() || section.name.toLowerCase()).includes("back") &&
    !(section.originalName?.toLowerCase() || section.name.toLowerCase()).includes("front")
  );

  return (
    <div className="space-y-6">
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

        {/* Front/Back Quick Toggle */}
        {(frontSections.length > 0 || backSections.length > 0) && (
          <div className="mb-4 p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Quick Select:</span>
            </div>
            <div className="flex gap-2">
              {frontSections.length > 0 && (
                <Button
                  size="sm"
                  variant={frontSections.some(s => s.id === selectedSectionId) ? "default" : "outline"}
                  onClick={() => {
                    // Select the first front section if multiple
                    const frontSection = frontSections[0];
                    if (frontSection) setSelectedSection(frontSection.id);
                  }}
                  className="flex-1 text-xs"
                >
                  Front Panel
                </Button>
              )}
              {backSections.length > 0 && (
                <Button
                  size="sm"
                  variant={backSections.some(s => s.id === selectedSectionId) ? "default" : "outline"}
                  onClick={() => {
                    // Select the first back section if multiple
                    const backSection = backSections[0];
                    if (backSection) setSelectedSection(backSection.id);
                  }}
                  className="flex-1 text-xs"
                >
                  Back Panel
                </Button>
              )}
            </div>
          </div>
        )}

        {selectedSectionId && linkedSections.size > 0 && (
          <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">{linkedSections.size} linked</span> - edits apply to all
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(groupedSections).map(
            ([category, categorySections]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  {category}
                </h4>
                <div className="space-y-1.5">
                  {categorySections.map((section) => {
                    const isSelected = selectedSectionId === section.id;
                    const isLinked = linkedSections.has(section.id);
                    const badge = getSectionBadge(section);

                    return (
                      <div
                        key={section.id}
                        className={`group relative rounded-lg transition-all ${isLinked ? "ring-2 ring-blue-500/50" : ""
                          }`}
                      >
                        <button
                          onClick={() => setSelectedSection(section.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all ${isSelected
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
                              {section.originalName !== section.name && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {section.originalName}
                                </div>
                              )}
                            </div>
                            {isLinked && (
                              <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        {selectedSectionId && selectedSectionId !== section.id && (
                          <button
                            onClick={() => toggleSectionLink(section.id)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${isLinked
                                ? "bg-blue-500 text-white shadow-sm"
                                : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background opacity-0 group-hover:opacity-100"
                              }`}
                            title={isLinked ? "Click to unlink" : "Click to link with selected"}
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
            {selectedSection.originalName !== selectedSection.name && (
              <p className="text-xs text-muted-foreground mt-1">
                Original material: {selectedSection.originalName}
              </p>
            )}
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
              <label className="block text-xs font-medium mb-2">
                Base Color
              </label>
              <input
                type="color"
                value={selectedSection.color}
                onChange={(e) =>
                  updateSection(selectedSection.id, { color: e.target.value })
                }
                className="w-full h-10 rounded-md border border-input cursor-pointer"
                disabled={!!selectedSection.customTexture || !!selectedSection.gradient?.enabled}
              />
              {selectedSection.customTexture && (
                <p className="text-xs text-muted-foreground mt-1">
                  Disabled when texture is applied
                </p>
              )}
              {selectedSection.gradient?.enabled && (
                <p className="text-xs text-muted-foreground mt-1">
                  Disabled when gradient is enabled
                </p>
              )}
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium">Gradient</label>
                <input
                  type="checkbox"
                  checked={selectedSection.gradient?.enabled || false}
                  onChange={(e) => {
                    const enabled = e.target.checked;
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
                  className="w-4 h-4 rounded border-input"
                  disabled={!!selectedSection.customTexture}
                />
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
                          const newColors = [...selectedSection.gradient!.colors];
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
                          const newColors = [...selectedSection.gradient!.colors, "#ffffff"];
                          const newStops = [...(selectedSection.gradient!.stops || [])];
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
                          const newColors = selectedSection.gradient!.colors.slice(0, -1);
                          const newStops = selectedSection.gradient!.stops?.slice(0, -1);
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

            <div>
              <label className="block text-xs font-medium mb-2">
                Roughness: {selectedSection.roughness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedSection.roughness}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    roughness: Number.parseFloat(e.target.value),
                  })
                }
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2">
                Metalness: {selectedSection.metalness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedSection.metalness}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    metalness: Number.parseFloat(e.target.value),
                  })
                }
                className="w-full accent-primary"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="wireframe"
                checked={selectedSection.wireframe}
                onChange={(e) =>
                  updateSection(selectedSection.id, {
                    wireframe: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-input"
              />
              <label
                htmlFor="wireframe"
                className="text-xs font-medium cursor-pointer"
              >
                Wireframe Mode
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="border-t border-border/50 pt-4">
        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
            💡 How to Use
          </h4>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Click on any material section to select and edit it</li>
            <li>• Use the "Front Panel" / "Back Panel" buttons for quick switching</li>
            <li>• Front/Back badges show which side each section controls</li>
            <li>• Link sections together to edit them simultaneously</li>
            <li>• Upload custom textures in the UV Editor tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
