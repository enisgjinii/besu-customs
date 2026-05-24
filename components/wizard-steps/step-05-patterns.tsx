"use client";
import { useConfiguratorStore } from "@/lib/store";
import { PatternSelector } from "@/components/pattern-selector";
import { WizardStepShell } from "@/components/wizard-step-layout";

export function Step05Patterns() {
  return (
    <WizardStepShell
      title="Patterns"
      description="Select one to apply across the product."
    >
      <PatternSelector />
    </WizardStepShell>
  );
}
