"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Copy, RotateCw, Trash2, ZoomIn, ZoomOut, X } from "lucide-react";
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
  const duplicateDecal = useConfiguratorStore((s) => s.duplicateDecal);
  const removeDecal = useConfiguratorStore((s) => s.removeDecal);
  const setSelectedDecal = useConfiguratorStore((s) => s.setSelectedDecal);
  const cameraControlsRef = useConfiguratorStore((s) => s.cameraControlsRef);

  const selectedDecal = useMemo(
    () => decals.find((decal) => decal.id === selectedDecalId),
    [decals, selectedDecalId],
  );

  const [overlayBox, setOverlayBox] = useState<OverlayBox | null>(null);
  const rafRef = useRef<number | null>(null);

  const updateOverlay = useCallback(() => {
    if (!selectedDecalId || !cameraControlsRef) {
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
      (mesh: any) => mesh.name === `decal_${selectedDecalId}`,
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

    const corners: Vector3[] =
      decalMesh.getBoundingInfo().boundingBox.vectorsWorld;
    const projected = corners.map((corner) =>
      Vector3.Project(corner, Matrix.Identity(), transformMatrix, viewport),
    );

    if (
      projected.some(
        (p) =>
          !p ||
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          Number.isNaN(p.x) ||
          Number.isNaN(p.y) ||
          p.z < 0 ||
          p.z > 1,
      )
    ) {
      setOverlayBox(null);
      return;
    }

    const minX = Math.min(...projected.map((p) => p.x));
    const maxX = Math.max(...projected.map((p) => p.x));
    const minY = Math.min(...projected.map((p) => p.y));
    const maxY = Math.max(...projected.map((p) => p.y));

    setOverlayBox({
      left: minX,
      top: minY,
      width: Math.max(48, maxX - minX),
      height: Math.max(48, maxY - minY),
    });
  }, [cameraControlsRef, selectedDecalId]);

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

  const handleRotate = useCallback(
    (angle: number) => {
      if (!selectedDecalId || !selectedDecal) return;
      const current = selectedDecal.rotation?.z || 0;
      updateDecal(selectedDecalId, {
        rotation: { ...selectedDecal.rotation, z: current + angle },
      });
      toast.success("Rotated", {
        description: `${angle > 0 ? "+" : ""}${Math.round(angle * (180 / Math.PI))}°`,
        duration: 1100,
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
      toast.success("Resized", {
        description: `${factor > 1 ? "+" : ""}${Math.round((factor - 1) * 100)}%`,
        duration: 1100,
      });
    },
    [selectedDecalId, selectedDecal, updateDecal],
  );

  const handleDuplicate = useCallback(() => {
    if (!selectedDecalId) return;
    duplicateDecal(selectedDecalId);
    toast.success("Duplicated", { description: "Copy created" });
  }, [duplicateDecal, selectedDecalId]);

  const handleDelete = useCallback(() => {
    if (!selectedDecalId) return;
    removeDecal(selectedDecalId);
    toast.success("Deleted", { description: "Decal removed" });
  }, [removeDecal, selectedDecalId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedDecalId) return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (event.key) {
        case "Escape":
          setSelectedDecal(null);
          break;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          handleDelete();
          break;
        default:
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
            event.preventDefault();
            handleDuplicate();
          }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete, handleDuplicate, selectedDecalId, setSelectedDecal]);

  if (!selectedDecalId || !selectedDecal || !overlayBox) {
    return null;
  }

  const buttonClass =
    "pointer-events-auto h-9 w-9 rounded-full border border-white/70 bg-background/95 text-foreground shadow-lg flex items-center justify-center transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none">
      <div
        className="absolute pointer-events-none"
        style={{
          left: overlayBox.left,
          top: overlayBox.top,
          width: overlayBox.width,
          height: overlayBox.height,
        }}
      >
        <div className="absolute inset-0 rounded-sm border-2 border-white shadow-[0_0_18px_rgba(0,0,0,0.35)] bg-primary/5" />

        {/* Deselect */}
        <button
          className={`${buttonClass} absolute -top-12 left-1/2 -translate-x-1/2`}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedDecal(null);
          }}
          aria-label="Deselect decal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Duplicate */}
        <button
          className={`${buttonClass} absolute -top-5 -left-5`}
          onClick={(event) => {
            event.stopPropagation();
            handleDuplicate();
          }}
          aria-label="Duplicate decal"
        >
          <Copy className="h-4 w-4" />
        </button>

        {/* Delete */}
        <button
          className={`${buttonClass} absolute -bottom-5 -left-5 bg-destructive text-destructive-foreground border-destructive/40`}
          onClick={(event) => {
            event.stopPropagation();
            handleDelete();
          }}
          aria-label="Delete decal"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Rotate */}
        <button
          className={`${buttonClass} absolute -top-5 -right-5`}
          onClick={(event) => {
            event.stopPropagation();
            handleRotate(Math.PI / 12);
          }}
          aria-label="Rotate decal"
        >
          <RotateCw className="h-4 w-4" />
        </button>

        {/* Scale Up */}
        <button
          className={`${buttonClass} absolute -bottom-5 -right-5`}
          onClick={(event) => {
            event.stopPropagation();
            handleScale(1.1);
          }}
          aria-label="Scale decal up"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Scale Down */}
        <button
          className={`${buttonClass} absolute -bottom-16 left-1/2 -translate-x-1/2`}
          onClick={(event) => {
            event.stopPropagation();
            handleScale(0.9);
          }}
          aria-label="Scale decal down"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
