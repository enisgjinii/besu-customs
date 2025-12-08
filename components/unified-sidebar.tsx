"use client";

import { useState, useEffect } from "react";
import { useConfiguratorStore } from "@/lib/store";
import NextImage from "next/image";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { PanelLeftClose, ChevronLeft, ChevronRight } from "lucide-react";

// Import Wizard Steps
import { Step01Apparel } from "./wizard-steps/step-01-apparel";
import { Step02Colors } from "./wizard-steps/step-02-colors";
import { Step03Style } from "./wizard-steps/step-03-style";
import { Step04SchoolLogo } from "./wizard-steps/step-04-school-logo";
import { Step05Patterns } from "./wizard-steps/step-05-patterns";
import { Step06Text } from "./wizard-steps/step-06-text";
import { Step07Images } from "./wizard-steps/step-07-images";
import { Step08AIImages } from "./wizard-steps/step-08-ai-images";
import { Step09View } from "./wizard-steps/step-09-view";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UnifiedSidebarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  isColorPickerOpen?: boolean; // Kept for prop compatibility
  onColorPickerOpen?: () => void;
  onColorPickerClose?: () => void;
}

const STEPS = [
  { id: 0, title: "1. Apparel", component: Step01Apparel },
  { id: 1, title: "2. Colors", component: Step02Colors },
  { id: 2, title: "3. Style", component: Step03Style },
  { id: 3, title: "4. School Logo", component: Step04SchoolLogo },
  { id: 4, title: "5. Patterns", component: Step05Patterns },
  { id: 5, title: "6. Text", component: Step06Text },
  { id: 6, title: "7. Images", component: Step07Images },
  { id: 7, title: "8. AI Images", component: Step08AIImages },
  { id: 8, title: "9. View", component: Step09View },
];

export function UnifiedSidebar({ sidebarOpen, onToggleSidebar }: UnifiedSidebarProps) {
  const currentStep = useConfiguratorStore((state) => state.currentStep);
  const setStep = useConfiguratorStore((state) => state.setStep);
  const isCollapsed = sidebarOpen === false;

  // Ensure step is within bounds
  useEffect(() => {
    if (currentStep < 0) setStep(0);
    if (currentStep >= STEPS.length) setStep(STEPS.length - 1);
  }, [currentStep, setStep]);

  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  return (
    <div className="flex flex-col bg-card w-full rounded-2xl border border-border/20 backdrop-blur-sm h-[calc(100vh-2rem)] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-b from-card to-card/50 flex-shrink-0 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-black p-1.5 shadow-md">
              <NextImage
                src="/LOGO-gg.png"
                alt="gg logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Besu Customs</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Configurator</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isCollapsed && <ThemeToggle />}
          <button
            onClick={() => onToggleSidebar?.(!sidebarOpen)}
            className="h-8 w-8 rounded-md bg-background/80 hover:bg-accent border border-border/50 flex items-center justify-center transition-colors"
          >
            <PanelLeftClose className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Step Navigation Bar (Horizontal or compact if collapsed, but really this UI assumes expanded) */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress Indicator */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleBack} disabled={currentStep === 0}>
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={handleNext} disabled={currentStep === STEPS.length - 1}>
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Step Content */}
          <ScrollArea className="flex-1 p-4">
            <CurrentStepComponent />
          </ScrollArea>

          {/* Bottom Navigation Actions */}
          <div className="p-4 border-t bg-card mt-auto space-y-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === STEPS.length - 1}
                className="flex-1"
              >
                {currentStep === STEPS.length - 1 ? "Finish" : "Next Step"}
              </Button>
            </div>

            {/* Horizontal Step Dots */}
            <div className="flex justify-center gap-1 pt-2">
              {STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  onClick={() => setStep(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-primary/50"
                    }`}
                  title={step.title}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed State View */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center py-4 gap-4">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => {
                setStep(idx);
                onToggleSidebar?.(true);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all border ${idx === currentStep
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:border-primary/50"
                }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
