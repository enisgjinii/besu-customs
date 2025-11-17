"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "./ui/button";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Matrix, Vector3 } from "@babylonjs/core";

type OverlayBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function DecalOverlayControls() {
  const selectedDecalId = useConfiguratorStore((s) => s.selectedDecalId);
  const decals = useConfiguratorStore((s) => s.decals);
  const updateDecal = useConfiguratorStore((s) => s.updateDecal);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);
  const cameraControlsRef = useConfiguratorStore((s) => s.cameraControlsRef);

  const [overlayBox, setOverlayBox] = useState<OverlayBox | null>(null);
  const rafRef = useRef<number | null>(null);

  const selectedDecal = useMemo(
    () => decals.find((decal) => decal.id === selectedDecalId),
    [decals, selectedDecalId],
  );

  const updateOverlay = useCallback(() => {
    if (!selectedDecal || !cameraControlsRef) {
      setOverlayBox(null);
      return;
    }

    const camera = cameraControlsRef as any;
    const scene = camera?.getScene?.();
    if (!scene) {
      setOverlayBox(null);
      return;
    }

    const decalMesh = scene.meshes.find(
      (mesh: any) => mesh.name === `decal_${selectedDecal.id}`,
    );
    if (!decalMesh) {
      setOverlayBox(null);
      return;
    }

    const engine = scene.getEngine();
    const transformMatrix = scene.getTransformMatrix();
    const viewport = camera.viewport.toGlobal(
      engine.getRenderWidth(),
      engine.getRenderHeight(),
    );

    const corners = decalMesh.getBoundingInfo().boundingBox.vectorsWorld;
    const projected: Vector3[] = corners.map((corner: Vector3) =>
      Vector3.Project(corner, Matrix.Identity(), transformMatrix, viewport),
    );

    if (
      projected.some((p: Vector3) =>
          !p ||
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          p.z < 0 ||
          p.z > 1,
      )
    ) {
      setOverlayBox(null);
      return;
    }

    const minX = Math.min(...projected.map((p: Vector3) => p.x));
    const maxX = Math.max(...projected.map((p: Vector3) => p.x));
    const minY = Math.min(...projected.map((p: Vector3) => p.y));
    const maxY = Math.max(...projected.map((p: Vector3) => p.y));

    setOverlayBox({
      left: minX,
      top: minY,
      width: Math.max(32, maxX - minX),
      height: Math.max(32, maxY - minY),
    });
  }, [cameraControlsRef, selectedDecal]);

  useEffect(() => {
    if (!selectedDecalId) {
      setOverlayBox(null);
      return;
    }

    const loop = () => {
      updateOverlay();
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [selectedDecalId, updateOverlay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedDecalId) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "Delete":
        case "Backspace":
          event.preventDefault();
          handleDelete();
          break;
        case "Escape":
          setSelectedDecal(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDecalId, setSelectedDecal]);

  const handleRotate = useCallback(
    (angle: number) => {
      if (!selectedDecalId || !selectedDecal) return;
      const current = selectedDecal.rotation?.z || 0;
      updateDecal(selectedDecalId, {
        rotation: { ...selectedDecal.rotation, z: current + angle },
      });
      toast.success("Rotated", {
        description: `${angle > 0 ? "+" : ""}${Math.round(angle * (180 / Math.PI))}°`,
        duration: 1200,
      });
    },
    [selectedDecalId, selectedDecal, updateDecal],
  );

  const handleScale = useCallback(
    (factor: number) => {
      if (!selectedDecalId || !selectedDecal) return;
      const scaled = {
        x: Math.max(0.1, selectedDecal.scale.x * factor),
        y: Math.max(0.1, selectedDecal.scale.y * factor),
        z: selectedDecal.scale.z,
      };
      updateDecal(selectedDecalId, { scale: scaled });
      toast.success("Scaled", {
        description: `${factor > 1 ? "+" : "-"}10%`,
        duration: 1200,
      });
    },
    [selectedDecalId, selectedDecal, updateDecal],
  );

  const handleDelete = useCallback(() => {
    if (!selectedDecalId) return;
    removeDecal(selectedDecalId);
    toast.success("Deleted", {
      description: "Decal removed",
      duration: 1200,
    });
  }, [removeDecal, selectedDecalId]);

  if (!selectedDecalId || !selectedDecal || !overlayBox) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 select-none">
      <div
        className="absolute pointer-events-none"
        style={{
          left: overlayBox.left,
          top: overlayBox.top,
          width: overlayBox.width,
          height: overlayBox.height,
        }}
      >
        {/* Bounding box */}
        <div className="absolute inset-0 border border-dashed border-primary/80 bg-primary/5" />

        {/* Close control */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-auto">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedDecal(null);
            }}
            title="Deselect"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Rotate left */}
        <div className="absolute -top-3 -left-3 pointer-events-auto">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow"
            onClick={(event) => {
              event.stopPropagation();
              handleRotate(-Math.PI / 12);
            }}
            title="Rotate -15°"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Rotate right */}
        <div className="absolute -top-3 -right-3 pointer-events-auto">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow"
            onClick={(event) => {
              event.stopPropagation();
              handleRotate(Math.PI / 12);
            }}
            title="Rotate +15°"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Scale up */}
        <div className="absolute -bottom-3 -right-3 pointer-events-auto">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow"
            onClick={(event) => {
              event.stopPropagation();
              handleScale(1.1);
            }}
            title="Scale up"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Scale down */}
        <div className="absolute -bottom-3 -left-3 pointer-events-auto">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow"
            onClick={(event) => {
              event.stopPropagation();
              handleScale(0.9);
            }}
            title="Scale down"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Delete */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
          <Button
            size="icon"
            variant="destructive"
            className="h-9 w-9 rounded-full shadow"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            title="Delete decal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
