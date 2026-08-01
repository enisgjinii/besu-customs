"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingKeyboardHandler } from "@/components/onboarding-keyboard-handler";

export function LegacyGlobalUi() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <><Toaster /><OnboardingTour /><OnboardingKeyboardHandler /></>;
}
