"use client";

import { useConfiguratorStore } from "@/lib/store";
import { Copy, RotateCcw, Trash2, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LayerControlsOverlay - Floating control buttons that appear on the 3D viewer
 * when a text/image layer is selected. Provides quick access to:
 * - Duplicate: Clone the selected layer
 * - Rotate: Toggle rotation mode (future)
 * - Delete: Remove the selected layer
 * - Resize: Toggle resize mode (future)
 */
export function LayerControlsOverlay() {
    const selectedTextureLayerId = useConfiguratorStore(
        (s) => s.selectedTextureLayerId
    );
    const textureLayers = useConfiguratorStore((s) => s.textureLayers);
    const duplicateTextureLayer = useConfiguratorStore(
        (s) => s.duplicateTextureLayer
    );
    const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
    const setSelectedTextureLayerId = useConfiguratorStore(
        (s) => s.setSelectedTextureLayerId
    );
    const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);

    // Find the selected layer
    const selectedLayer = textureLayers.find(
        (l) => l.id === selectedTextureLayerId
    );

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

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 flex items-center gap-1">
                {/* Layer name indicator */}
                <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {selectedLayer.name || selectedLayer.type}
                </span>

                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                {/* Duplicate */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    onClick={handleDuplicate}
                    title="Duplicate"
                >
                    <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </Button>

                {/* Rotate Left */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    onClick={handleRotateLeft}
                    title="Rotate"
                >
                    <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>

                {/* Flip/Resize */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    onClick={handleFlipX}
                    title="Flip Horizontal"
                >
                    <Maximize2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>

                {/* Delete */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={handleDelete}
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </Button>

                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                {/* Close/Deselect */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleDeselect}
                    title="Deselect"
                >
                    <X className="h-4 w-4 text-gray-500" />
                </Button>
            </div>
        </div>
    );
}
