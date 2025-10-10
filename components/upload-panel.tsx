"use client";

import type React from "react";

import { useCallback, useState } from "react";
import { useConfiguratorStore } from "@/lib/store";
import { Upload, AlertCircle } from "lucide-react";

export function UploadPanel() {
  const setCurrentModelUrl = useConfiguratorStore(
    (state) => state.setCurrentModelUrl,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    const validExtensions = [".glb", ".gltf"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(extension)) {
      setError("Please upload a .glb or .gltf file");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        const url = URL.createObjectURL(file);
        setCurrentModelUrl(url);
      }
    },
    [setCurrentModelUrl],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border/50 bg-secondary/20"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-foreground mb-2 font-medium">
          Drag & Drop a file here
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          or click to browse (.glb, .gltf)
        </p>
        <label className="inline-block px-4 py-2 bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors rounded-md">
          Upload File
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/50 rounded-md text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
