"use client";

import { RotateCcw } from "lucide-react";
import { useConfiguratorStore } from "@/lib/store";
import { useState } from "react";
import { Button } from "./ui/button";
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

export function FloatingResetButton() {
  const [showDialog, setShowDialog] = useState(false);
  const resetAllCustomizations = useConfiguratorStore(
    (state) => state.resetAllCustomizations,
  );
  const currentModelUrl = useConfiguratorStore(
    (state) => state.currentModelUrl,
  );
  const sections = useConfiguratorStore((state) => state.sections);

  // Only show if there's a model loaded and sections exist
  if (!currentModelUrl || sections.length === 0) {
    return null;
  }

  const handleReset = () => {
    resetAllCustomizations();
    setShowDialog(false);
  };

  return (
    <>
      {/* Floating Button - Visible at bottom on all wizard steps */}
      <Button
        onClick={() => setShowDialog(true)}
        size="lg"
        variant="destructive"
        className="
          fixed z-50 
          shadow-2xl hover:shadow-3xl
          transition-all duration-300
          hover:scale-110 active:scale-95
          
          /* Positioned at bottom-right, above wizard */
          bottom-[300px] right-4
          h-14 w-14 rounded-full p-0
          
          /* Desktop: slightly smaller and adjusted position */
          md:bottom-[370px] md:right-6
          md:h-12 md:w-12
          
          /* Animation */
          animate-in fade-in slide-in-from-bottom-4
          
          group
        "
        title="Reset All Customizations"
      >
        <RotateCcw className="w-6 h-6 md:w-5 md:h-5 group-hover:rotate-180 transition-transform duration-500" />
        <span className="sr-only">Reset All</span>
      </Button>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-destructive" />
              Reset All Customizations?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This will clear all your changes including:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Colors</li>
                <li>Patterns and textures</li>
                <li>Logos and images</li>
                <li>Text layers</li>
                <li>All customizations</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
