"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  ChevronLeft,
  Lock,
  RotateCcw,
  GripHorizontal,
} from "lucide-react";
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
import { Step04SchoolLogo } from "./wizard-steps/step-04-school-logo";
import { Step05Patterns } from "./wizard-steps/step-05-patterns";
import { Step06Text } from "./wizard-steps/step-06-text";
import { Step07Images } from "./wizard-steps/step-07-images";
import { Step08AIImages } from "./wizard-steps/step-08-ai-images";
import { Step09View } from "./wizard-steps/step-09-view";

const STEPS = [
  { id: 1, title: "APPAREL", component: Step01Apparel },
  { id: 2, title: "AI DESIGN", component: Step08AIImages }, // Moved early for base design generation
  { id: 3, title: "COLORS", component: Step02Colors },
  { id: 4, title: "STYLE", component: Step03Style },
  { id: 5, title: "LOGO", component: Step04SchoolLogo },
  { id: 6, title: "PATTERNS", component: Step05Patterns },
  { id: 7, title: "TEXT", component: Step06Text },
  { id: 8, title: "IMAGES", component: Step07Images },
  { id: 9, title: "REVIEW", component: Step09View },
];

export function ConfiguratorWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Desktop drag-to-resize state
  const [panelHeight, setPanelHeight] = useState(320); // pixels
  const isDraggingRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(320);

  const lockedView = useConfiguratorStore((s) => s.lockedView);
  const setLockedView = useConfiguratorStore((s) => s.setLockedView);
  const resetAllCustomizations = useConfiguratorStore(
    (s) => s.resetAllCustomizations,
  );
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

  // Desktop drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      dragStartY.current = e.clientY;
      dragStartHeight.current = panelHeight;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [panelHeight],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = dragStartY.current - e.clientY;
      const newHeight = Math.min(
        600,
        Math.max(200, dragStartHeight.current + deltaY),
      );
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
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

  const showViewLock = [6, 8, 9].includes(currentStep); // LOGO, TEXT, IMAGES steps

  return (
    <div
      className={cn(
        "bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 flex flex-col",
        // Mobile: relative positioning within flex container, Desktop: absolute with dynamic height
        isMobile
          ? "relative flex-1 min-h-0"
          : "absolute bottom-0 left-0 right-0",
      )}
      style={!isMobile ? { height: `${panelHeight}px` } : undefined}
    >
      {/* Desktop Drag Handle */}
      {!isMobile && (
        <div
          className="w-full h-3 cursor-ns-resize flex items-center justify-center bg-gray-100 dark:bg-gray-900 hover:bg-primary/10 transition-colors group flex-shrink-0 select-none"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-1">
            <GripHorizontal className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary/70" />
            <span className="text-[9px] text-muted-foreground/50 group-hover:text-primary/70 uppercase tracking-wider hidden group-hover:inline">
              Drag to resize
            </span>
          </div>
        </div>
      )}

      {/* Texture Layer Selector - Compact on mobile */}
      {textureLayers.length > 0 && (
        <div className="border-b border-border/30 flex-shrink-0">
          <TextureLayerSelector />
        </div>
      )}

      {/* Header: Steps + Nav */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 flex-shrink-0">
        {/* Current step indicator for mobile */}
        {isMobile && (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex flex-col items-center">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30">
                {currentStep}
              </span>
              <div className="w-0.5 h-1 bg-primary/30 rounded-full mt-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {STEPS[currentStep - 1].title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {currentStep}/{STEPS.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step pills - Desktop only */}
        {!isMobile && (
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              {STEPS.map((s) => {
                const isDisabled = !isModelSelected && s.id !== 1;
                const isActive = currentStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => !isDisabled && setCurrentStep(s.id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isDisabled
                          ? "text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                          : "text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">
                      {s.id}
                    </span>
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

          {/* Nav buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Reset Button - In Header */}
            {isMobile && isModelSelected && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowResetDialog(true)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="h-10 w-10 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={
                  currentStep === STEPS.length ||
                  (currentStep === 1 && !isModelSelected)
                }
                className="h-10 px-5 rounded-full text-sm font-semibold shadow-lg"
              >
                {currentStep === STEPS.length ? (
                  "Done"
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
      </div>

      {/* View Lock Bar - only on specific steps */}
      {showViewLock && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 dark:bg-gray-800/80 border-b border-border/30 flex-shrink-0">
          <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground mr-1">Lock:</span>
          <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1">
            {[
              "Front",
              "Back",
              "Left",
              "Right",
              "Top",
              "Bottom",
              "Front-Left",
              "Front-Right",
              "Back-Left",
              "Back-Right",
            ].map((view) => (
              <button
                key={view}
                onClick={() =>
                  setLockedView(view === lockedView ? null : (view as any))
                }
                className={cn(
                  "text-xs px-2 py-1.5 rounded-full transition-all flex-shrink-0 font-medium whitespace-nowrap",
                  lockedView === view
                    ? "bg-primary text-primary-foreground"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600",
                )}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div
          className="h-full overflow-y-auto overscroll-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="p-4 max-w-3xl mx-auto pb-32">
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

      {/* Reset button - fixed bottom right (Desktop Only) */}
      {!isMobile && isModelSelected && (
        <Button
          onClick={() => setShowResetDialog(true)}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-10 bg-white dark:bg-gray-800 border overflow-hidden"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
        </Button>
      )}

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="mx-4 max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-red-500 to-orange-500" />
          <AlertDialogHeader className="space-y-3 px-6 pb-2 pt-5 text-left">
            <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              <RotateCcw className="h-4 w-4 text-destructive" />
              Reset All?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              This will clear all colors, patterns, logos, and text. Cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 px-6 pb-5 pt-3 sm:justify-end">
            <AlertDialogCancel className="h-10 min-w-[96px] rounded-xl border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAllCustomizations();
                setShowResetDialog(false);
              }}
              className="h-10 min-w-[96px] rounded-xl bg-destructive font-semibold text-white hover:bg-destructive/90"
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
