"use client";

import { useLogger } from "@/hooks/useLogger";
import { useState } from "react";

/**
 * Example component showing comprehensive logging usage
 * This demonstrates how every action, error, and event gets logged to Vercel
 */
export function ExampleWithLogging() {
  const logger = useLogger({ category: "ui" });
  const [loading, setLoading] = useState(false);

  const handleButtonClick = async () => {
    // Track user action - appears in Vercel logs
    await logger.trackAction("example_button_clicked", {
      timestamp: Date.now(),
      page: window.location.pathname,
    });

    setLoading(true);

    try {
      // Simulate API call
      const startTime = performance.now();
      const response = await fetch("/api/example");
      const duration = performance.now() - startTime;

      // Track API performance
      await logger.trackPerformance("api_call_duration", duration, {
        endpoint: "/api/example",
        status: response.status,
      });

      // Track API call with full details
      await logger.trackApiCall("/api/example", "GET", response.status, {
        duration,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      // Success logging
      await logger.info("API call successful", {
        endpoint: "/api/example",
        duration,
      });
    } catch (error) {
      // Error logging - includes IP, location, browser, etc.
      await logger.error("Failed to fetch data", error as Error, {
        endpoint: "/api/example",
        userAction: "button_click",
      });

      // Critical error - shown to user AND logged to Vercel
      await logger.critical("Critical error occurred", error as Error, {
        context: "example_component",
        recoverable: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Logging Example</h2>
      <button
        onClick={handleButtonClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Test Logging"}
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Click the button to see comprehensive logging in Vercel dashboard. Check
        Vercel logs for IP, location, browser, and full error details.
      </p>
    </div>
  );
}
