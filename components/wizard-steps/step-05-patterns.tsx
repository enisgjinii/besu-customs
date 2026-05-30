"use client";
import { useConfiguratorStore } from "@/lib/store";
import { PatternSelector } from "@/components/pattern-selector";
import { WizardSection, WizardStepShell } from "@/components/wizard-step-layout";

export function Step05Patterns() {
  return (
    <WizardStepShell
      title="Patterns"
      description="Select one to apply across the product."
    >
      <WizardSection
        title="Pattern Library"
        description="Choose a pattern category, then tap any swatch to apply instantly."
      >
        <PatternSelector />
      </WizardSection>
    </WizardStepShell>
  );
}
