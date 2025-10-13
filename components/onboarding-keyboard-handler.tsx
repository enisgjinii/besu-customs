"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "@/lib/onboarding-store";

export function OnboardingKeyboardHandler() {
  const { isActive, startOnboarding, skipOnboarding } = useOnboardingStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.hasAttribute("contenteditable");

      if (isInputFocused) return;

      // Global shortcuts when tour is not active
      if (!isActive) {
        if (e.key === "?" || (e.key === "h" && e.ctrlKey)) {
          e.preventDefault();
          startOnboarding();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isActive, startOnboarding, skipOnboarding]);

  return null; // This is just a logic component
}
