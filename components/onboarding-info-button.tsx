"use client";

import React, { useState, useEffect } from "react";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { OnboardingPreferencesModal } from "@/components/onboarding-preferences";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  HelpCircle,
  RotateCcw,
  Play,
  X,
  Settings,
  BookOpen,
  Zap,
  Users,
  MessageCircle,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

export function OnboardingInfoButton() {
  const {
    isCompleted,
    startOnboarding,
    restartOnboarding,
    getProgress,
    analytics,
    bookmarks,
  } = useOnboardingStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeTab, setActiveTab] = useState<"help" | "progress" | "resources">(
    "help",
  );

  // Show tooltip on first visit if not completed
  useEffect(() => {
    if (!isCompleted) {
      const timer = setTimeout(() => {
        // setShowTooltip(true);
        setTimeout(() => {}, 3000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  const handleRestartTour = () => {
    setIsExpanded(false);
    // setShowTooltip(false);
    // Use the new restart function that properly handles completed state
    restartOnboarding();
  };

  const handleStartTour = () => {
    setIsExpanded(false);
    // setShowTooltip(false);
    startOnboarding();
  };

  const progress = getProgress();
  const quickTips = [
    "Use Ctrl+B to toggle the sidebar",
    "Right-click models for context menus",
    "Drag and drop textures onto materials",
    "Use mousewheel to zoom in the 3D scene",
    "Save your work frequently with Ctrl+S",
  ];

  const resources = [
    {
      title: "Video Tutorials",
      icon: Play,
      url: "/tutorials",
      desc: "Step-by-step video guides",
    },
    {
      title: "Documentation",
      icon: BookOpen,
      url: "/docs",
      desc: "Comprehensive user manual",
    },
    {
      title: "Community Forum",
      icon: Users,
      url: "/community",
      desc: "Get help from other users",
    },
    {
      title: "Feature Requests",
      icon: MessageCircle,
      url: "/feedback",
      desc: "Suggest new features",
    },
    {
      title: "Keyboard Shortcuts",
      icon: Zap,
      url: "/shortcuts",
      desc: "Speed up your workflow",
    },
  ];

  return (
    <>
      {/* Preferences Modal */}
      <OnboardingPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* Compact Help Button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-8 w-8 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-all duration-200 ${
            isExpanded
              ? "bg-primary text-primary-foreground border-primary"
              : ""
          } ${!isCompleted ? "animate-pulse" : ""}`}
        >
          <Info
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Notification Badge */}
        {bookmarks.length > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {bookmarks.length}
          </div>
        )}

        {/* Compact Expanded Menu */}
        {isExpanded && (
          <Card className="absolute top-10 right-0 w-72 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200 shadow-lg border-primary/20 z-50">
            {/* Compact Header */}
            <div className="p-2 bg-gradient-to-r from-primary/5 to-primary/10 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                  <Info className="w-2.5 h-2.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-xs">Help</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Quick access
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                  className="h-5 w-5 p-0"
                >
                  <Settings className="w-2.5 h-2.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-5 w-5 p-0"
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>

            {/* Compact Tab Navigation */}
            <div className="flex border-b bg-secondary/20">
              {[
                { id: "help", label: "Help", icon: HelpCircle },
                { id: "progress", label: "Progress", icon: CheckCircle },
                { id: "resources", label: "Links", icon: BookOpen },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as "help" | "progress" | "resources")
                  }
                  className={`flex-1 flex items-center justify-center gap-1 p-1.5 text-[10px] font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-primary bg-background border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <tab.icon className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Compact Tab Content */}
            <div className="p-2 max-h-56 overflow-y-auto">
              {/* Quick Help Tab */}
              {activeTab === "help" && (
                <div className="space-y-2">
                  {/* Main Actions */}
                  <div className="space-y-1">
                    {isCompleted ? (
                      <Button
                        onClick={handleRestartTour}
                        size="sm"
                        className="w-full justify-start h-7 text-xs"
                      >
                        <RotateCcw className="w-2.5 h-2.5 mr-1.5" />
                        <span className="text-xs">Restart Tour</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStartTour}
                        size="sm"
                        className="w-full justify-start h-7 text-xs"
                      >
                        <Play className="w-2.5 h-2.5 mr-1.5" />
                        <span className="text-xs">Start Tour</span>
                      </Button>
                    )}
                  </div>

                  {/* Quick Tips */}
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-medium flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      Tips
                    </h4>
                    <div className="space-y-0.5">
                      {quickTips.slice(0, 2).map((tip, index) => (
                        <div
                          key={index}
                          className="text-[10px] p-1.5 bg-secondary/30 rounded"
                        >
                          <div className="w-1 h-1 bg-primary rounded-full mr-1.5 inline-block" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === "progress" && (
                <div className="space-y-2">
                  <div className="text-center p-2 bg-secondary/20 rounded">
                    <div className="text-sm font-bold text-primary">
                      {progress.percentage}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Complete
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {progress.completed}/{progress.total}
                    </div>
                  </div>

                  {/* Tour Stats */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <div className="text-xs font-semibold text-blue-600">
                        {analytics.tourStarted}
                      </div>
                      <div className="text-[10px] text-blue-600/80">
                        Started
                      </div>
                    </div>
                    <div className="text-center p-1.5 bg-green-50 dark:bg-green-950/20 rounded">
                      <div className="text-xs font-semibold text-green-600">
                        {analytics.tourCompleted}
                      </div>
                      <div className="text-[10px] text-green-600/80">Done</div>
                    </div>
                  </div>

                  {/* Bookmarks */}
                  {bookmarks.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-medium flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Bookmarks ({bookmarks.length})
                      </h4>
                      <div className="space-y-0.5">
                        {bookmarks.slice(0, 2).map((stepIndex, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setIsExpanded(false);
                              // You could implement goToStep here
                            }}
                            className="w-full text-left p-1 text-[10px] bg-secondary/30 hover:bg-secondary/50 rounded transition-colors"
                          >
                            Step {stepIndex + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === "resources" && (
                <div className="space-y-1">
                  {resources.slice(0, 3).map((resource, index) => (
                    <button
                      key={index}
                      onClick={() => window.open(resource.url, "_blank")}
                      className="w-full flex items-center gap-2 p-1.5 text-left hover:bg-secondary/30 rounded transition-colors group"
                    >
                      <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <resource.icon className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-medium">
                          {resource.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {resource.desc}
                        </div>
                      </div>
                      <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compact Footer */}
            <div className="p-1.5 bg-secondary/10 border-t text-center">
              <div className="text-[10px] text-muted-foreground">
                 Use{" "}
                <Badge variant="outline" className="text-[10px] mx-0.5">
                  ?
                </Badge>{" "}
                key for help
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
