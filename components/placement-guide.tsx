"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, Pin, Trash2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Position {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

interface Size {
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

interface PlacementGuideProps {
  id: string;
  position: Position;
  size: Size;
  rotation: number;
  isSelected: boolean;
  isCompact?: boolean;
  onSelect: () => void;
  onPositionChange: (position: Position) => void;
  onSizeChange: (size: Size) => void;
  onRotationChange: (rotation: number) => void;
  onDelete: () => void;
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function PlacementGuide({
  id,
  position,
  size,
  rotation,
  isSelected,
  isCompact = false,
  onSelect,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  onDelete,
  children,
  containerRef,
}: PlacementGuideProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const rotateStartRef = useRef({ angle: 0, startAngle: 0 });

  // Control sizes
  const controlSize = isCompact ? 24 : 32;
  const iconSize = isCompact ? 12 : 16;

  // Convert percentage to pixels
  const getPixelPosition = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (position.x / 100) * rect.width,
      y: (position.y / 100) * rect.height,
      width: (size.width / 100) * rect.width,
      height: (size.height / 100) * rect.height,
    };
  }, [position, size, containerRef]);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isPinned) return;
      e.stopPropagation();
      onSelect();
      setIsDragging(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      dragStartRef.current = {
        x: clientX,
        y: clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [isPinned, onSelect, position],
  );

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current!.getBoundingClientRect();
      const deltaX = ((clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((clientY - dragStartRef.current.y) / rect.height) * 100;

      const newX = Math.max(
        0,
        Math.min(100 - size.width, dragStartRef.current.posX + deltaX),
      );
      const newY = Math.max(
        0,
        Math.min(100 - size.height, dragStartRef.current.posY + deltaY),
      );

      onPositionChange({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, containerRef, size, onPositionChange]);

  // Handle resize
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setIsResizing(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      resizeStartRef.current = {
        x: clientX,
        y: clientY,
        width: size.width,
        height: size.height,
      };
    },
    [size],
  );

  useEffect(() => {
    if (!isResizing || !containerRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current!.getBoundingClientRect();
      const deltaX = ((clientX - resizeStartRef.current.x) / rect.width) * 100;
      const deltaY = ((clientY - resizeStartRef.current.y) / rect.height) * 100;

      // Maintain aspect ratio
      const delta = Math.max(deltaX, deltaY);
      const newWidth = Math.max(
        5,
        Math.min(100 - position.x, resizeStartRef.current.width + delta),
      );
      const newHeight = Math.max(
        5,
        Math.min(100 - position.y, resizeStartRef.current.height + delta),
      );

      onSizeChange({ width: newWidth, height: newHeight });
    };

    const handleEnd = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isResizing, containerRef, position, onSizeChange]);

  // Handle rotation
  const handleRotateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setIsRotating(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (!elementRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const startAngle =
        Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

      rotateStartRef.current = {
        angle: rotation,
        startAngle,
      };
    },
    [rotation],
  );

  useEffect(() => {
    if (!isRotating || !elementRef.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = elementRef.current!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle =
        Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      const deltaAngle = currentAngle - rotateStartRef.current.startAngle;

      let newRotation = (rotateStartRef.current.angle + deltaAngle) % 360;
      if (newRotation < 0) newRotation += 360;

      onRotationChange(newRotation);
    };

    const handleEnd = () => {
      setIsRotating(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isRotating, onRotationChange]);

  const pixelPos = getPixelPosition();

  return (
    <div
      ref={elementRef}
      className={cn("absolute cursor-move", isSelected && "z-10")}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${size.width}%`,
        height: `${size.height}%`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Content */}
      <div className="w-full h-full">{children}</div>

      {/* Selection border */}
      {isSelected && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: "2px dashed #3b82f6",
              borderRadius: "4px",
            }}
          />

          {/* Top-left: Rotate */}
          <button
            className="control-handle absolute flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-blue-500 hover:bg-blue-50 transition-colors"
            style={{
              width: `${controlSize}px`,
              height: `${controlSize}px`,
              top: `-${controlSize / 2 + 8}px`,
              left: `-${controlSize / 2 + 8}px`,
              transform: `rotate(${-rotation}deg)`,
            }}
            onMouseDown={handleRotateStart}
            onTouchStart={handleRotateStart}
            title="Rotate"
          >
            <RotateCw size={iconSize} className="text-blue-500" />
          </button>

          {/* Top-right: Pin */}
          <button
            className={cn(
              "control-handle absolute flex items-center justify-center bg-white rounded-full shadow-lg border-2 hover:bg-gray-50 transition-colors",
              isPinned ? "border-blue-500 bg-blue-50" : "border-gray-400",
            )}
            style={{
              width: `${controlSize}px`,
              height: `${controlSize}px`,
              top: `-${controlSize / 2 + 8}px`,
              right: `-${controlSize / 2 + 8}px`,
              transform: `rotate(${-rotation}deg)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsPinned(!isPinned);
            }}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Pin
              size={iconSize}
              className={isPinned ? "text-blue-500" : "text-gray-600"}
            />
          </button>

          {/* Bottom-left: Delete */}
          <button
            className="control-handle absolute flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-red-500 hover:bg-red-50 transition-colors"
            style={{
              width: `${controlSize}px`,
              height: `${controlSize}px`,
              bottom: `-${controlSize / 2 + 8}px`,
              left: `-${controlSize / 2 + 8}px`,
              transform: `rotate(${-rotation}deg)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 size={iconSize} className="text-red-500" />
          </button>

          {/* Bottom-right: Resize */}
          <button
            className="control-handle absolute flex items-center justify-center bg-white rounded-full shadow-lg border-2 border-blue-500 hover:bg-blue-50 transition-colors cursor-nwse-resize"
            style={{
              width: `${controlSize}px`,
              height: `${controlSize}px`,
              bottom: `-${controlSize / 2 + 8}px`,
              right: `-${controlSize / 2 + 8}px`,
              transform: `rotate(${-rotation}deg)`,
            }}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            title="Resize"
          >
            <Maximize2 size={iconSize} className="text-blue-500" />
          </button>
        </>
      )}
    </div>
  );
}
