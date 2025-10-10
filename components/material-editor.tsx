"use client"

import { useConfiguratorStore } from "@/lib/store"
import { Palette, Sliders } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MaterialEditor() {
  const sections = useConfiguratorStore((state) => state.sections)
  const selectedSectionId = useConfiguratorStore((state) => state.selectedSectionId)
  const setSelectedSection = useConfiguratorStore((state) => state.setSelectedSection)
  const updateSection = useConfiguratorStore((state) => state.updateSection)

  const selectedSection = sections.find((s) => s.id === selectedSectionId)

  // Group sections by category
  const groupedSections = sections.reduce(
    (acc, section) => {
      if (!acc[section.category]) {
        acc[section.category] = []
      }
      acc[section.category].push(section)
      return acc
    },
    {} as Record<string, typeof sections>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Material Sections
        </h3>

        <div className="space-y-4">
          {Object.entries(groupedSections).map(([category, categorySections]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{category}</h4>
              <div className="space-y-1">
                {categorySections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-all ${
                      selectedSectionId === section.id
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded flex-shrink-0 ring-1 ring-border/50"
                        style={{ backgroundColor: section.color }}
                      />
                      <span className="truncate font-medium">{section.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSection && (
        <div className="border-t border-border/50 pt-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Edit: {selectedSection.name}
          </h3>

          <div className="space-y-4">
            {selectedSection.customTexture && (
              <div className="p-3 bg-secondary/30 rounded-md">
                <p className="text-xs text-muted-foreground mb-2">Custom texture applied</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSection(selectedSection.id, { customTexture: undefined })}
                  className="w-full"
                >
                  Remove Texture
                </Button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-2">Base Color</label>
              <input
                type="color"
                value={selectedSection.color}
                onChange={(e) => updateSection(selectedSection.id, { color: e.target.value })}
                className="w-full h-10 rounded-md border border-input cursor-pointer"
                disabled={!!selectedSection.customTexture}
              />
              {selectedSection.customTexture && (
                <p className="text-xs text-muted-foreground mt-1">Disabled when texture is applied</p>
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
                onChange={(e) => updateSection(selectedSection.id, { roughness: Number.parseFloat(e.target.value) })}
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
                onChange={(e) => updateSection(selectedSection.id, { metalness: Number.parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="wireframe"
                checked={selectedSection.wireframe}
                onChange={(e) => updateSection(selectedSection.id, { wireframe: e.target.checked })}
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="wireframe" className="text-xs font-medium cursor-pointer">
                Wireframe Mode
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
