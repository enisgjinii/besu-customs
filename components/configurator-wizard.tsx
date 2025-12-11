"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
    { id: 1, title: "SELECT APPAREL", shortTitle: "APPAREL", component: Step01Apparel },
    { id: 2, title: "COLORS", shortTitle: "COLORS", component: Step02Colors },
    { id: 3, title: "STYLE", shortTitle: "STYLE", component: Step03Style },
    { id: 4, title: "SCHOOL LOGOS", shortTitle: "LOGOS", component: Step04SchoolLogo },
    { id: 5, title: "PATTERNS", shortTitle: "PATTERNS", component: Step05Patterns },
    { id: 6, title: "TEXT", shortTitle: "TEXT", component: Step06Text },
    { id: 7, title: "IMAGES", shortTitle: "IMAGES", component: Step07Images },
    { id: 8, title: "AI GEN", shortTitle: "AI", component: Step08AIImages },
    { id: 9, title: "REVIEW", shortTitle: "REVIEW", component: Step09View },
];

export function ConfiguratorWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Store integration for View Locking
    const lockedView = useConfiguratorStore((s) => s.lockedView);
    const setLockedView = useConfiguratorStore((s) => s.setLockedView);
    
    // Check if model is selected
    const currentModelUrl = useConfiguratorStore((s) => s.currentModelUrl);
    const selectedProductId = useConfiguratorStore((s) => s.selectedProductId);
    const isModelSelected = !!(currentModelUrl || selectedProductId);

    // Responsive check and Mount check
    useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleNext = () => {
        // Prevent going to next step if on step 1 without model selected
        if (currentStep === 1 && !isModelSelected) {
            return;
        }
        if (currentStep < STEPS.length) setCurrentStep(c => c + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    const CurrentComponent = STEPS[currentStep - 1].component;

    // Prevent hydration mismatch
    if (!isMounted) return null;

    // Render View Lock Controls for relevant steps (Logo, Text, Images)
    // Step 4, 6, 7 benefit from locking view
    const showViewLock = [4, 6, 7].includes(currentStep);

    return (
        <div className={cn(
            "absolute bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 z-40 flex flex-col",
            isMobile ? "h-[280px]" : "h-[350px]" // Compact on mobile
        )}>

            {/* Header: Steps Indicator - More compact on mobile */}
            <div className="flex items-center justify-between px-2 md:px-6 py-1.5 md:py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                <div className="flex items-center gap-1 md:gap-3 overflow-x-auto no-scrollbar flex-1 pr-2">
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => {
                                // Prevent navigation to other steps if no model selected
                                if (!isModelSelected && s.id !== 1) {
                                    return;
                                }
                                setCurrentStep(s.id);
                            }}
                            className={cn(
                                "flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-colors whitespace-nowrap flex-shrink-0",
                                currentStep === s.id
                                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                                    : (!isModelSelected && s.id !== 1)
                                    ? "text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50"
                                    : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold",
                                currentStep === s.id ? "bg-white text-black dark:bg-black dark:text-white" : "bg-gray-300 text-white"
                            )}>
                                {s.id}
                            </div>
                            <span className="text-[9px] md:text-xs font-semibold tracking-wide">
                                {isMobile ? s.shortTitle : s.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Navigation Buttons - Compact */}
                <div className="flex items-center gap-1 pl-2 border-l flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentStep === 1} className="h-6 w-6 md:h-8 md:w-8 p-0">
                        <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={handleNext} 
                        disabled={currentStep === STEPS.length || (currentStep === 1 && !isModelSelected)} 
                        className={cn(
                            "h-6 text-[10px] px-2 md:h-8 md:text-xs md:px-3", 
                            currentStep === STEPS.length && "bg-green-600"
                        )}
                    >
                        Next <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* View Lock Panel - Hidden on mobile, shown on desktop */}
                {showViewLock && !isMobile && (
                    <div className="w-32 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 p-2 flex flex-col gap-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/10">
                        <div className="flex items-center gap-1 mb-1 text-[10px] font-semibold text-muted-foreground">
                            <Lock className="w-3 h-3" /> View Lock
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            {["Front", "Back", "Left", "Right", "Top"].map(view => (
                                <button
                                    key={view}
                                    onClick={() => setLockedView(view === lockedView ? null : view as any)}
                                    className={cn(
                                        "text-[10px] px-2 py-1.5 rounded border transition-all text-left",
                                        lockedView === view
                                            ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                            : "bg-white dark:bg-black text-gray-600 border-gray-200 hover:border-gray-400"
                                    )}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile View Lock - Horizontal buttons at top */}
                {showViewLock && isMobile && (
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1 px-2 py-1 bg-gray-50/90 dark:bg-gray-900/90 border-b">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        {["Front", "Back", "Left", "Right"].map(view => (
                            <button
                                key={view}
                                onClick={() => setLockedView(view === lockedView ? null : view as any)}
                                className={cn(
                                    "text-[9px] px-2 py-1 rounded transition-all",
                                    lockedView === view
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200"
                                )}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Step Content - Compact padding on mobile */}
                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div className={cn(
                            "max-w-3xl mx-auto",
                            isMobile ? "p-2 pt-8" : "p-4", // Extra top padding on mobile for view lock buttons
                            showViewLock && isMobile && "pt-10"
                        )}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {CurrentComponent ? <CurrentComponent /> : <div>Loading...</div>}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
