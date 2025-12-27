"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronLeft, Lock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ColorPickerModal } from "./color-picker-modal";
import { TextureLayerSelector } from "@/components/texture-layer-selector";

// Import Steps
import { Step01Apparel } from "./wizard-steps/step-01-apparel";
import { Step02Colors } from "./wizard-steps/step-02-colors";
import { Step03Style } from "./wizard-steps/step-03-style";
import { Step03bTrimLines } from "./wizard-steps/step-03b-trim-lines";
import { Step04SchoolLogo } from "./wizard-steps/step-04-school-logo";
import { Step05Patterns } from "./wizard-steps/step-05-patterns";
import { Step06Text } from "./wizard-steps/step-06-text";
import { Step07Images } from "./wizard-steps/step-07-images";
import { Step08AIImages } from "./wizard-steps/step-08-ai-images";
import { Step09View } from "./wizard-steps/step-09-view";

const STEPS = [
  { id: 1, title: "APPAREL", component: Step01Apparel },
  { id: 2, title: "COLORS", component: Step02Colors },
  { id: 3, title: "STYLE", component: Step03Style },
  { id: 4, title: "TRIM", component: Step03bTrimLines },
  { id: 5, title: "LOGO", component: Step04SchoolLogo },
  { id: 6, title: "PATTERNS", component: Step05Patterns },
  { id: 7, title: "TEXT", component: Step06Text },
  { id: 8, title: "IMAGES", component: Step07Images },
  { id: 9, title: "AI", component: Step08AIImages },
  { id: 10, title: "REVIEW", component: Step09View },
];

export function ConfiguratorWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const lockedView = useConfiguratorStore((s) => s.lockedView);
  const setLockedView = useConfiguratorStore((s) => s.setLockedView);
  const resetAllCustomizations = useConfiguratorStore((s) => s.resetAllCustomizations);
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const selectedProductId = useConfiguratorStore((s) => s.selectedProductId);
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const isModelSelected = !!(currentModelUrl || selectedProductId);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNext = () => {
    if (currentStep === 1 && !isModelSelected) return;
    if (currentStep < STEPS.length) setCurrentStep((c) => c + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((c) => c - 1);
  };

  const CurrentComponent = STEPS[currentStep - 1].component;
  if (!isMounted) return null;

  const showViewLock = [5, 7, 8].includes(currentStep);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 flex flex-col",
        isMobile ? "h-[42vh] max-h-[320px]" : "h-[280px]",
      )}
    >
      {/* Texture Layer Selector - Compact on mobile */}
      {textureLayers.length > 0 && (
        <div className="border-b border-border/30 flex-shrink-0">
          <TextureLayerSelector />
        </div>
      )}

      {/* Header: Steps + Nav */}
      <div className="flex items-center gap-1 px-2 py-1.5 sm:py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
        {/* Steps - scrollable */}
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {STEPS.map((s) => {
              const isDisabled = !isModelSelected && s.id !== 1;
              const isActive = currentStep === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => !isDisabled && setCurrentStep(s.id)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[32px] sm:min-h-[28px]",
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : isDisabled
                        ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300",
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <span className={cn(
                    "w-4 h-4 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold",
                    isActive ? "bg-white text-black dark:bg-black dark:text-white" : "bg-gray-300 text-white",
                  )}>
                    {s.id}
                  </span>
                  <span className="hidden xs:inline sm:inline">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-border/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="h-8 w-8 sm:h-7 sm:w-7 rounded-full active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={currentStep === STEPS.length || (currentStep === 1 && !isModelSelected)}
            className="h-8 sm:h-7 px-3 sm:px-3 rounded-full text-[10px] sm:text-[10px] font-semibold active:scale-95"
          >
            Next <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* View Lock Bar - only on specific steps */}
      {showViewLock && (
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100/80 dark:bg-gray-800/80 border-b border-border/30 flex-shrink-0">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground mr-1">Lock:</span>
          {["Front", "Back", "Left", "Right"].map((view) => (
            <button
              key={view}
              onClick={() => setLockedView(view === lockedView ? null : (view as any))}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded transition-all",
                lockedView === view
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600",
              )}
            >
              {view}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto overscroll-contain wizard-content-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-3 md:p-4 max-w-3xl mx-auto pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {CurrentComponent && <CurrentComponent />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reset button - fixed bottom right */}
      {isModelSelected && (
        <Button
          onClick={() => setShowResetDialog(true)}
          variant="destructive"
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-lg z-10"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="w-4 h-4 text-destructive" />
              Reset All?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will clear all colors, patterns, logos, and text. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAllCustomizations();
                setShowResetDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90 h-9"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfiguratorColorPicker />
    </div>
  );
}

function ConfiguratorColorPicker() {
  const isOpen = useConfiguratorStore((s) => s.sectionColorPickerOpen);
  const sectionId = useConfiguratorStore((s) => s.sectionColorPickerSectionId);
  const closePicker = useConfiguratorStore((s) => s.closeSectionColorPicker);
  const sections = useConfiguratorStore((s) => s.sections);
  const updateSection = useConfiguratorStore((s) => s.updateSection);
  const recentColors = useConfiguratorStore((s) => s.recentColors);
  const addRecentColor = useConfiguratorStore((s) => s.addRecentColor);

  const activeSection = sections.find((s) => s.id === sectionId);

  if (!activeSection) return null;

  return (
    <ColorPickerModal
      isOpen={isOpen}
      onClose={closePicker}
      currentColor={activeSection.color}
      onColorChange={(color) => {
        if (sectionId) updateSection(sectionId, { color });
      }}
      recentColors={recentColors}
      onAddRecentColor={addRecentColor}
      title={`Color: ${activeSection.name}`}
    />
  );
}
