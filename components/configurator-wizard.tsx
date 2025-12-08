"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfiguratorStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronLeft, Check, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

// Import Steps
import { Step01Apparel } from "./wizard-steps/step-01-apparel";
import { Step02Colors } from "./wizard-steps/step-02-colors";
import { Step03Style } from "./wizard-steps/step-03-style"; // Ensure this exists or placeholder
import { Step04SchoolLogo } from "./wizard-steps/step-04-school-logo";
import { Step05Patterns } from "./wizard-steps/step-05-patterns";
import { Step06Text } from "./wizard-steps/step-06-text";
import { Step07Images } from "./wizard-steps/step-07-images";
import { Step08AIImages } from "./wizard-steps/step-08-ai-images";
import { Step09View } from "./wizard-steps/step-09-view";

const STEPS = [
    { id: 1, title: "Select Apparel", component: Step01Apparel },
    { id: 2, title: "Colors", component: Step02Colors },
    { id: 3, title: "Style", component: Step03Style },
    { id: 4, title: "School Logos", component: Step04SchoolLogo },
    { id: 5, title: "Patterns", component: Step05Patterns },
    { id: 6, title: "Text", component: Step06Text },
    { id: 7, title: "Images", component: Step07Images },
    { id: 8, title: "AI Gen", component: Step08AIImages },
    { id: 9, title: "Review", component: Step09View },
];

export function ConfiguratorWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Store integration for View Locking
    const lockedView = useConfiguratorStore((s) => s.lockedView);
    const setLockedView = useConfiguratorStore((s) => s.setLockedView);

    // Responsive check and Mount check
    useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleNext = () => {
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
            "h-[350px] lg:h-[350px]" // Fixed height for bottom bar style
        )}>

            {/* Header: Steps Indicator (Horizontal Scroll) */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar mask-gradient w-full pr-4">
                    {STEPS.map((s, i) => (
                        <div
                            key={s.id}
                            onClick={() => setCurrentStep(s.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap flex-shrink-0",
                                currentStep === s.id
                                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                                    : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                currentStep === s.id ? "bg-white text-black dark:bg-black dark:text-white" : "bg-gray-300 text-white"
                            )}>
                                {s.id}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide hidden md:inline">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Navigation Buttons (Top Right for easy access) */}
                <div className="flex items-center gap-2 pl-4 border-l ml-auto flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentStep === 1}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleNext} disabled={currentStep === STEPS.length} className={cn(currentStep === STEPS.length && "bg-green-600")}>
                        {currentStep === STEPS.length ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content Area - Horizontal Layout */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Control Panel (View Lock) - Left Sidebar within Bottom Bar */}
                {showViewLock && (
                    <div className="w-48 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 p-4 hidden md:flex flex-col gap-2 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/10">
                        <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-muted-foreground">
                            <Lock className="w-3 h-3" /> View Lock
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {["Front", "Back", "Left", "Right", "Top"].map(view => (
                                <button
                                    key={view}
                                    onClick={() => setLockedView(view === lockedView ? null : view as any)}
                                    className={cn(
                                        "text-xs px-3 py-2 rounded-md border transition-all text-left",
                                        lockedView === view
                                            ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm"
                                            : "bg-white dark:bg-black text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                    )}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                        <div className="mt-auto pt-2 text-[10px] text-muted-foreground leading-tight">
                            Lock view to drag & drop logos precisely.
                        </div>
                    </div>
                )}

                {/* Main Step Content */}
                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full w-full">
                        <div className="max-w-3xl mx-auto p-3 md:p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
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
