"use client";
import { useConfiguratorStore } from "@/lib/store";
import { PatternSelector } from "@/components/pattern-selector";

export function Step05Patterns() {
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold">Design Patterns</h2>
        <p className="text-xs text-muted-foreground">
          Select a pattern to apply
        </p>
      </div>
      <PatternSelector />
    </div>
  );
}
