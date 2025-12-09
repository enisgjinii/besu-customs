"use client";

import React, { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useConfiguratorStore } from "@/lib/store";
import { useThree } from "@react-three/fiber";

interface Texture3DControlsProps {
    layerId: string;
    onClose: () => void;
}

// Helper to create canvas icon texture
function createIconTexture(
    icon: "lock" | "unlock" | "rotate" | "duplicate" | "delete" | "close",
    size: number = 64
): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Background circle
    const bgColors: Record<string, string> = {
        lock: "#f59e0b",
        unlock: "#22c55e",
        rotate: "#3b82f6",
        duplicate: "#8b5cf6",
        delete: "#ef4444",
        close: "#6b7280",
    };

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = bgColors[icon] || "#666";
    ctx.fill();

    // Draw icon symbol
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const c = size / 2; // center
    const s = size * 0.25; // symbol size

    switch (icon) {
        case "lock":
            // Padlock shape
            ctx.beginPath();
            ctx.rect(c - s * 0.7, c - s * 0.2, s * 1.4, s * 1.2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(c, c - s * 0.3, s * 0.5, Math.PI, 0);
            ctx.stroke();
            break;

        case "unlock":
            // Open padlock
            ctx.beginPath();
            ctx.rect(c - s * 0.7, c - s * 0.2, s * 1.4, s * 1.2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(c + s * 0.5, c - s * 0.3, s * 0.5, Math.PI, 0);
            ctx.stroke();
            break;

        case "rotate":
            // Circular arrow
            ctx.beginPath();
            ctx.arc(c, c, s * 0.7, -Math.PI * 0.7, Math.PI * 0.5, false);
            ctx.stroke();
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(c + s * 0.7, c + s * 0.3);
            ctx.lineTo(c + s * 0.5, c + s * 0.7);
            ctx.lineTo(c + s, c + s * 0.6);
            ctx.fill();
            break;

        case "duplicate":
            // Two overlapping squares
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(c - s * 0.6, c - s * 0.6, s * 0.9, s * 0.9);
            ctx.fillRect(c - s * 0.1, c - s * 0.1, s * 0.9, s * 0.9);
            break;

        case "delete":
            // X mark
            ctx.beginPath();
            ctx.moveTo(c - s * 0.5, c - s * 0.5);
            ctx.lineTo(c + s * 0.5, c + s * 0.5);
            ctx.moveTo(c + s * 0.5, c - s * 0.5);
            ctx.lineTo(c - s * 0.5, c + s * 0.5);
            ctx.stroke();
            break;

        case "close":
            // Small X
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(c - s * 0.3, c - s * 0.3);
            ctx.lineTo(c + s * 0.3, c + s * 0.3);
            ctx.moveTo(c + s * 0.3, c - s * 0.3);
            ctx.lineTo(c - s * 0.3, c + s * 0.3);
            ctx.stroke();
            break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Individual control sprite
function ControlSprite({
    icon,
    position,
    onClick,
    scale = 0.15,
}: {
    icon: "lock" | "unlock" | "rotate" | "duplicate" | "delete" | "close";
    position: [number, number, number];
    onClick: () => void;
    scale?: number;
}) {
    const spriteRef = useRef<THREE.Sprite>(null);
    const texture = useMemo(() => createIconTexture(icon), [icon]);

    return (
        <sprite
            ref={spriteRef}
            position={position}
            scale={[scale, scale, 1]}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <spriteMaterial map={texture} transparent depthTest={false} />
        </sprite>
    );
}

export function Texture3DControls({ layerId, onClose }: Texture3DControlsProps) {
    const layer = useConfiguratorStore((s) =>
        s.textureLayers.find((l) => l.id === layerId)
    );
    const updateTextureLayer = useConfiguratorStore((s) => s.updateTextureLayer);
    const removeTextureLayer = useConfiguratorStore((s) => s.removeTextureLayer);
    const duplicateTextureLayer = useConfiguratorStore((s) => s.duplicateTextureLayer);

    const handleDuplicate = useCallback(() => {
        duplicateTextureLayer(layerId);
        onClose();
    }, [duplicateTextureLayer, layerId, onClose]);

    const handleDelete = useCallback(() => {
        removeTextureLayer(layerId);
        onClose();
    }, [removeTextureLayer, layerId, onClose]);

    const handleToggleLock = useCallback(() => {
        if (layer) {
            updateTextureLayer(layerId, { locked: !layer.locked });
        }
    }, [updateTextureLayer, layerId, layer]);

    const handleRotate = useCallback(() => {
        if (layer) {
            const currentRotation = layer.rotation?.[2] || 0;
            updateTextureLayer(layerId, {
                rotation: [0, 0, currentRotation + Math.PI / 4],
            });
        }
    }, [updateTextureLayer, layerId, layer]);

    if (!layer) return null;

    // Arrange sprites in a horizontal row
    const spacing = 0.18;
    const yOffset = 0.25; // Above the selection point

    return (
        <group>
            {/* Lock/Unlock */}
            <ControlSprite
                icon={layer.locked ? "lock" : "unlock"}
                position={[-spacing * 1.5, yOffset, 0]}
                onClick={handleToggleLock}
            />

            {/* Rotate */}
            <ControlSprite
                icon="rotate"
                position={[-spacing * 0.5, yOffset, 0]}
                onClick={handleRotate}
            />

            {/* Duplicate */}
            <ControlSprite
                icon="duplicate"
                position={[spacing * 0.5, yOffset, 0]}
                onClick={handleDuplicate}
            />

            {/* Delete */}
            <ControlSprite
                icon="delete"
                position={[spacing * 1.5, yOffset, 0]}
                onClick={handleDelete}
            />

            {/* Close button - smaller, above */}
            <ControlSprite
                icon="close"
                position={[spacing * 2.5, yOffset, 0]}
                onClick={onClose}
                scale={0.1}
            />
        </group>
    );
}
