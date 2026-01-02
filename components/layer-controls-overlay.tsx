"use client";

import { useConfiguratorStore } from "@/lib/store";
import {
  Copy,
  RotateCcw,
  Trash2,
  Maximize2,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LayerControlsOverlay - Floating control buttons that appear on the 3D viewer
 * when a text/image layer is selected. Provides quick access to:
 * - Duplicate: Clone the selected layer
 * - Arrange: Bring Forward/Back, Front/Back
 * - Rotate: Toggle rotation mode (future)
 * - Delete: Remove the selected layer
 * - Resize: Toggle resize mode (future)
 */
export function LayerControlsOverlay() {
  const selectedTextureLayerId = useConfiguratorStore(
    (s) => s.selectedTextureLayerId,
  );
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const duplicateTextureLayer = useConfiguratorStore(
    (s) => s.duplicateTextureLayer,
  );
  const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
  const setSelectedTextureLayerId = useConfiguratorStore(
    (s) => s.setSelectedTextureLayerId,
  );
  const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
  const moveLayer = useConfiguratorStore((s) => s.moveLayer);

  // Find the selected layer
  const selectedLayer = textureLayers.find(
    (l) => l.id === selectedTextureLayerId,
  );

  // Debug logging
  console.log("🎛️ LayerControlsOverlay:", {
    selectedTextureLayerId,
    selectedLayer: selectedLayer?.name,
    layerCount: textureLayers.length,
  });

  // Don't render if no layer is selected
  if (!selectedLayer) return null;

  const handleDuplicate = () => {
    if (selectedTextureLayerId) {
      duplicateTextureLayer(selectedTextureLayerId);
    }
  };

  const handleDelete = () => {
    if (selectedTextureLayerId) {
      removeTextureLayer(selectedTextureLayerId);
    }
  };

  const handleRotateLeft = () => {
    if (selectedTextureLayerId && selectedLayer) {
      const currentRotation = selectedLayer.rotation?.[2] || 0;
      updateTextureLayer(selectedTextureLayerId, {
        rotation: [0, 0, currentRotation - Math.PI / 12], // Rotate -15 degrees
      });
    }
  };

  const handleFlipX = () => {
    if (selectedTextureLayerId && selectedLayer) {
      updateTextureLayer(selectedTextureLayerId, {
        flipX: !selectedLayer.flipX,
      });
    }
  };

  const handleDeselect = () => {
    setSelectedTextureLayerId(null);
  };

  const handleMove = (direction: "forward" | "backward" | "front" | "back") => {
    if (selectedTextureLayerId) {
      moveLayer(selectedTextureLayerId, direction);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-1.5">
        {/* Layer name indicator */}
        <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
          {selectedLayer.name || selectedLayer.type}
        </span>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Arrange Controls */}
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-md rounded-r-none"
            onClick={() => handleMove("front")}
            title="Bring to Front"
          >
            <ChevronsUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-none border-l border-r border-gray-100 dark:border-gray-800"
            onClick={() => handleMove("forward")}
            title="Bring Forward"
          >
            <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-none border-r border-gray-100 dark:border-gray-800"
            onClick={() => handleMove("backward")}
            title="Send Backward"
          >
            <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-md rounded-l-none"
            onClick={() => handleMove("back")}
            title="Send to Back"
          >
            <ChevronsDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Duplicate */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 active:scale-95 transition-transform"
          onClick={handleDuplicate}
          title="Duplicate"
        >
          <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </Button>

        {/* Rotate Left */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-transform"
          onClick={handleRotateLeft}
          title="Rotate"
        >
          <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </Button>

        {/* Flip/Resize */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-transform"
          onClick={handleFlipX}
          title="Flip Horizontal"
        >
          <Maximize2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-transform"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
        </Button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Close/Deselect */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform"
          onClick={handleDeselect}
          title="Deselect"
        >
          <X className="h-5 w-5 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}
