"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  const isWebGLError = error.message?.toLowerCase().includes("webgl") ||
    error.message?.toLowerCase().includes("context") ||
    error.message?.toLowerCase().includes("gpu");

  const handleReset = () => {
    // Clear potentially corrupted cached state
    try {
      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.includes("configurator") || key.includes("zustand")
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error("Failed to clear cache:", e);
    }
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-foreground mb-2">
          {isWebGLError ? "3D Rendering Error" : "Something went wrong"}
        </h1>
        
        <p className="text-muted-foreground mb-4">
          {isWebGLError 
            ? "Your device had trouble rendering the 3D model. This can happen on devices with limited graphics capabilities."
            : "The application encountered an unexpected error. Please try refreshing the page."}
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-muted rounded text-left text-xs overflow-auto max-h-32">
            <p className="font-mono text-destructive">{error.message}</p>
            {error.digest && (
              <p className="font-mono text-muted-foreground mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>

        {isWebGLError && (
          <p className="mt-4 text-xs text-muted-foreground">
            Tip: Try closing other apps or browser tabs to free up memory.
          </p>
        )}
      </div>
    </div>
  );
}
