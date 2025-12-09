"use client";

import { Html } from "@react-three/drei";
import { Copy, Trash2, Lock, Unlock, RotateCw, X } from "lucide-react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TextureContextMenuProps {
    layerId: string;
    onClose: () => void;
    // Position is handled by parent group or HTML transform
}

export function TextureContextMenu({ layerId, onClose }: TextureContextMenuProps) {
    const layer = useConfiguratorStore((s) => s.textureLayers.find((l) => l.id === layerId));
    const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
    const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
    const duplicateTextureLayer = useConfiguratorStore((s) => s.duplicateTextureLayer);

    if (!layer) return null;

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateTextureLayer(layerId);
        onClose();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeTextureLayer(layerId);
        onClose();
    };

    const handleToggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateTextureLayer(layerId, { locked: !layer.locked });
    };

    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Simple 45 deg rotation increment
        // Logic: if existing rotation is number[], update z (2 index)
        const currentRotation = layer.rotation?.[2] || 0;
        const newRotation = currentRotation + (Math.PI / 4); // +45deg
        updateTextureLayer(layerId, {
            rotation: [0, 0, newRotation]
        });
    };

    return (
        <Html
            position={[0, 0, 0.1]} // Slight offset towards camera
            center // Center the div on the position
            style={{ pointerEvents: 'none' }} // Let container ignore events for pass-through? No, buttons need events.
            zIndexRange={[100, 0]}
        >
            <div
                className="flex items-center gap-1 p-1.5 rounded-xl bg-background/90 backdrop-blur-md border shadow-xl animate-in fade-in zoom-in-95 duration-200"
                style={{ pointerEvents: 'auto' }}
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on container
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-accent hover:text-accent-foreground"
                    onClick={handleToggleLock}
                    title={layer.locked ? "Unlock" : "Lock"}
                >
                    {layer.locked ? <Lock className="w-4 h-4 text-orange-500" /> : <Unlock className="w-4 h-4" />}
                </Button>

                <div className="w-px h-4 bg-border/50 mx-0.5" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-accent hover:text-accent-foreground"
                    onClick={handleRotate}
                    title="Rotate 45°"
                >
                    <RotateCw className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-accent hover:text-accent-foreground"
                    onClick={handleDuplicate}
                    title="Duplicate"
                >
                    <Copy className="w-4 h-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>

                <div className="w-px h-4 bg-border/50 mx-0.5" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted text-muted-foreground ml-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>

            {/* Little arrow pointing down */}
            <div className="w-3 h-3 bg-background/90 backdrop-blur-md border-r border-b rotate-45 absolute left-1/2 -bottom-1.5 -translate-x-1/2" />
        </Html>
    );
}
