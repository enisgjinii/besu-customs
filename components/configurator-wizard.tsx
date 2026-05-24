"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
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
import { useBreakpoint } from "@/hooks/use-breakpoint";
import {
  CONFIGURATOR_STEPS,
  formatProductCategoryTitle,
} from "@/components/configurator-steps";

export function ConfiguratorWizard() {
  const [isMounted, setIsMounted] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { isMobile } = useBreakpoint();

  // Desktop drag-to-resize state
  const [panelHeight, setPanelHeight] = useState(320); // pixels, desktop only
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(320);
  const panelRef = useRef<HTMLDivElement>(null);

  const lockedView = useConfiguratorStore((s) => s.lockedView);
  const setLockedView = useConfiguratorStore((s) => s.setLockedView);
  const currentStep = useConfiguratorStore((s) => s.currentStep);
  const setStep = useConfiguratorStore((s) => s.setStep);
  const resetAllCustomizations = useConfiguratorStore(
    (s) => s.resetAllCustomizations,
  );
  const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
  const selectedProductId = useConfiguratorStore((s) => s.selectedProductId);
  const products = useConfiguratorStore((s) => s.products);
  const textureLayers = useConfiguratorStore((s) => s.textureLayers);
  const isModelSelected = !!(currentModelUrl || selectedProductId);
  const currentStepNumber = currentStep + 1;
  const selectedProduct = products.find(
    (product) =>
      product.id === selectedProductId ||
      (!!currentModelUrl && product.modelUrl === currentModelUrl),
  );
  const currentStepTitle =
    currentStep === 0
      ? formatProductCategoryTitle(selectedProduct?.category)
      : CONFIGURATOR_STEPS[currentStep]?.title;

  const clampPanelHeight = useCallback((rawHeight: number) => {
    if (typeof window === "undefined") return Math.min(600, Math.max(220, rawHeight));
    const dynamicMin = Math.max(220, Math.round(window.innerHeight * 0.24));
    const dynamicPreferred = Math.round(window.innerHeight * 0.32);
    const dynamicMax = Math.min(600, Math.round(window.innerHeight * 0.72));
    return Math.min(dynamicMax, Math.max(dynamicMin, rawHeight || dynamicPreferred));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setPanelHeight(clampPanelHeight(Math.round(window.innerHeight * 0.32)));
    }
  }, [clampPanelHeight]);

  useEffect(() => {
    if (currentStep < 0) setStep(0);
    if (currentStep >= CONFIGURATOR_STEPS.length) {
      setStep(CONFIGURATOR_STEPS.length - 1);
    }
  }, [currentStep, setStep]);

  useEffect(() => {
    if (isMobile || currentStepNumber !== 9) return;
    setPanelHeight(clampPanelHeight(Math.round(window.innerHeight * 0.72)));
  }, [clampPanelHeight, currentStepNumber, isMobile]);

  // Desktop pointer-drag handlers
  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isMobile) return;
      isDraggingRef.current = true;
      dragStartYRef.current = e.clientY;
      dragStartHeightRef.current = panelHeight;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [isMobile, panelHeight],
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = dragStartYRef.current - e.clientY;
      setPanelHeight(clampPanelHeight(dragStartHeightRef.current + deltaY));
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [clampPanelHeight]);

  useEffect(() => {
    if (isMobile) return;

    const handleResize = () => setPanelHeight((prev) => clampPanelHeight(prev));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPanelHeight, isMobile]);

  useEffect(() => {
    if (!panelRef.current) return;

    if (isMobile) {
      panelRef.current.style.removeProperty("height");
      return;
    }

    panelRef.current.style.height = `${panelHeight}px`;
  }, [isMobile, panelHeight]);

  const handleNext = () => {
    if (currentStep === 0 && !isModelSelected) return;
    if (currentStep < CONFIGURATOR_STEPS.length - 1) setStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setStep(currentStep - 1);
  };

  const CurrentComponent = CONFIGURATOR_STEPS[currentStep]?.component;
  if (!isMounted) return null;

  const showViewLock = [6, 8, 9].includes(currentStepNumber);

  return (
    <div
      ref={panelRef}
      className={cn(
        "bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 flex flex-col w-full overflow-x-hidden",
        isMobile ? "relative h-full min-h-0" : "relative",
      )}
    >
      {/* Desktop Drag Handle */}
      {!isMobile && (
        <div
          className="w-full h-4 cursor-ns-resize touch-none flex items-center justify-center bg-gray-100 dark:bg-gray-900 hover:bg-primary/10 transition-colors group flex-shrink-0 select-none"
          onPointerDown={handleDragStart}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize configurator panel"
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
                {currentStep + 1}
              </span>
              <div className="w-0.5 h-1 bg-primary/30 rounded-full mt-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {currentStepTitle}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <progress
                  className="flex-1 h-1.5 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-primary [&::-webkit-progress-value]:to-primary/70 [&::-moz-progress-bar]:bg-primary"
                  max={CONFIGURATOR_STEPS.length}
                  value={currentStep + 1}
                  aria-label="Step progress"
                />
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {currentStep + 1}/{CONFIGURATOR_STEPS.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step pills - Desktop only */}
        {!isMobile && (
          <div className="relative flex-1 min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-gray-50/95 to-transparent dark:from-gray-900/95" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-gray-50/95 to-transparent dark:from-gray-900/95" />
            <div className="flex-1 overflow-x-auto no-scrollbar px-2">
              <div className="flex items-center gap-1.5 w-max min-w-full">
                {CONFIGURATOR_STEPS.map((s, idx) => {
                const isDisabled = !isModelSelected && s.id !== 1;
                const isActive = currentStep === idx;
                const stepTitle =
                  idx === 0
                    ? formatProductCategoryTitle(selectedProduct?.category)
                    : s.title;
                return (
                  <button
                    key={s.id}
                    onClick={() => !isDisabled && setStep(idx)}
                    disabled={isDisabled}
                    title={isDisabled ? "Select a product first to unlock this step" : stepTitle}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-11",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isDisabled
                          ? "text-gray-300 dark:text-gray-700 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                          : "text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
                    )}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">
                      {s.id}
                    </span>
                    <span>{stepTitle}</span>
                  </button>
                );
              })}
              </div>
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
                className="h-11 w-11 text-muted-foreground hover:text-destructive"
                title="Reset"
                aria-label="Reset all customization"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            <div className={cn("items-center gap-2", isMobile ? "hidden" : "flex") }>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="h-11 w-11 rounded-full"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={
                  currentStep === CONFIGURATOR_STEPS.length - 1 ||
                  (currentStep === 0 && !isModelSelected)
                }
                className="h-11 px-5 rounded-full text-sm font-semibold shadow-lg"
              >
                {currentStep === CONFIGURATOR_STEPS.length - 1 ? (
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

      {!isModelSelected && currentStep > 0 && (
        <div className="px-3 py-2 border-b border-border/40 bg-amber-50/80 dark:bg-amber-900/20 text-[11px] text-amber-700 dark:text-amber-300">
          Select an apparel model in step 1 to unlock all customization steps.
        </div>
      )}

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
        <div className="h-full overflow-y-auto overscroll-y-auto wizard-content-scroll">
          <div
            className={cn(
              "p-3 sm:p-4 mx-auto pb-6 md:pb-8",
              currentStepNumber === 9 ? "max-w-7xl" : "max-w-4xl",
            )}
          >
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

      {isMobile && (
        <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 dark:bg-black/95 backdrop-blur px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="h-11 w-11 rounded-full"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                currentStep === CONFIGURATOR_STEPS.length - 1 ||
                (currentStep === 0 && !isModelSelected)
              }
              className="h-11 flex-1 rounded-full text-sm font-semibold"
            >
              {currentStep === CONFIGURATOR_STEPS.length - 1 ? "Done" : "Next Step"}
              {currentStep < CONFIGURATOR_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Reset button - fixed bottom right (Desktop Only) */}
      {!isMobile && isModelSelected && (
        <Button
          onClick={() => setShowResetDialog(true)}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-10 bg-white dark:bg-gray-800 border overflow-hidden"
          title="Reset"
          aria-label="Reset all customization"
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
