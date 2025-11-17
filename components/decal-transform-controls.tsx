"use client";

import { useEffect, useState, useCallback } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  RotateCw,
  Maximize2,
  Copy,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";

export function DecalTransformControls() {
  const selectedDecalId = useConfiguratorStore((s) => s.selectedDecalId);
  const decals = useConfiguratorStore((s) => s.decals);
  const updateDecal = useConfiguratorStore((s) => s.updateDecal);
  const duplicateDecal = useConfiguratorStore((s) => s.duplicateDecal);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const selectedDecal = decals.find((d) => d.id === selectedDecalId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDecalId) return;

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          )
            return;
          handleDelete();
          break;
        case "Escape":
          setSelectedDecal(null);
          break;
        case "d":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleDuplicate();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDecalId]);

  const handleRotate = useCallback(
    (angle: number) => {
      if (!selectedDecalId || !selectedDecal) return;
      const currentZ = selectedDecal.rotation?.z || 0;
      updateDecal(selectedDecalId, {
        rotation: {
          ...selectedDecal.rotation,
          z: currentZ + angle,
        },
      });
      toast.success("Rotated", { description: `${angle > 0 ? "+" : ""}${Math.round(angle * (180 / Math.PI))}°` });
    },
    [selectedDecalId, selectedDecal, updateDecal]
  );

  const handleScale = useCallback(
    (factor: number) => {
      if (!selectedDecalId || !selectedDecal) return;
      const newScale = {
        x: Math.max(0.1, selectedDecal.scale.x * factor),
        y: Math.max(0.1, selectedDecal.scale.y * factor),
        z: selectedDecal.scale.z,
      };
      updateDecal(selectedDecalId, { scale: newScale });
      toast.success("Resized", { description: `${factor > 1 ? "Increased" : "Decreased"} size` });
    },
    [selectedDecalId, selectedDecal, updateDecal]
  );

  const handleDuplicate = useCallback(() => {
    if (!selectedDecalId) return;
    duplicateDecal(selectedDecalId);
    toast.success("Duplicated", { description: "New copy created" });
  }, [selectedDecalId, duplicateDecal]);

  const handleDelete = useCallback(() => {
    if (!selectedDecalId) return;
    removeDecal(selectedDecalId);
    toast.success("Deleted", { description: "Decal removed" });
  }, [selectedDecalId, removeDecal]);

  const handleMove = useCallback(
    (dx: number, dy: number) => {
      if (!selectedDecalId || !selectedDecal) return;
      updateDecal(selectedDecalId, {
        position: {
          x: selectedDecal.position.x + dx,
          y: selectedDecal.position.y + dy,
          z: selectedDecal.position.z,
        },
      });
    },
    [selectedDecalId, selectedDecal, updateDecal]
  );

  if (!selectedDecalId || !selectedDecal) return null;

  return (
    <>
      {/* Floating control panel */}
      <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <Card className="p-3 shadow-2xl border-2 border-primary/20 backdrop-blur-md bg-card/95">
          <div className="flex items-center gap-2">
            {/* Close/Deselect */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDecal(null)}
              className="h-10 w-10 p-0"
              title="Deselect (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-border" />

            {/* Rotation Controls */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRotate(-Math.PI / 12)}
                className="h-10 w-10 p-0"
                title="Rotate Left (-15°)"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRotate(Math.PI / 12)}
                className="h-10 w-10 p-0"
                title="Rotate Right (+15°)"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Scale Controls */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleScale(0.9)}
                className="h-10 w-10 p-0"
                title="Shrink (-10%)"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleScale(1.1)}
                className="h-10 w-10 p-0"
                title="Grow (+10%)"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Action Controls */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDuplicate}
                className="h-10 w-10 p-0"
                title="Duplicate (Cmd+D / Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="h-10 w-10 p-0"
                title="Delete (Delete / Backspace)"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Info text */}
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Keyboard: Delete to remove • Cmd+D to duplicate • Esc to deselect
            </p>
          </div>
        </Card>
      </div>

      {/* Visual indicator on canvas */}
      <style jsx global>{`
        .decal-selected {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
          animation: pulse-outline 2s infinite;
        }
        @keyframes pulse-outline {
          0%,
          100% {
            outline-color: hsl(var(--primary));
          }
          50% {
            outline-color: hsl(var(--primary) / 0.5);
          }
        }
      `}</style>
    </>
  );
}
