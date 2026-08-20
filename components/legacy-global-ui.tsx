"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingKeyboardHandler } from "@/components/onboarding-keyboard-handler";

export function LegacyGlobalUi() {
  const pathname = usePathname();
  // Always show toasts (designer lives on "/"). Keep onboarding off the 2D designer home.
  if (pathname === "/") return <Toaster position="top-center" richColors closeButton />;
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <OnboardingTour />
      <OnboardingKeyboardHandler />
    </>
  );
}
