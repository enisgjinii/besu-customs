"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PillToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function PillToggle({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: PillToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-all duration-300 ease-in-out",
        checked
          ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25"
          : "bg-gray-200 dark:bg-gray-700",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer hover:scale-105 active:scale-95",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out",
          checked ? "translate-x-7" : "translate-x-1"
        )}
      />
    </button>
  );
}
