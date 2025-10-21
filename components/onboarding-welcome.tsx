"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useOnboardingStore, UserType } from "@/lib/onboarding-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Play,
  X,
  Clock,
  Users,
  Paintbrush,
  Code,
  Building,
  Zap,
  Heart,
} from "lucide-react";

export function OnboardingWelcome() {
  const { isCompleted, startOnboarding, skipOnboarding } = useOnboardingStore();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedUserType, setSelectedUserType] =
    useState<UserType>("beginner");
  const [step, setStep] = useState<"welcome" | "userType" | "preview">(
    "welcome",
  );

  const handleStartTour = useCallback(() => {
    setHasInteracted(true);
    setIsVisible(false);
    // Small delay to allow modal to close before starting tour
    setTimeout(() => {
      startOnboarding(selectedUserType);
      // Store user preference
      localStorage.setItem("besu-user-type", selectedUserType);
    }, 150);
  }, [startOnboarding, selectedUserType]);

  const handleUserTypeSelect = useCallback((userType: UserType) => {
    setSelectedUserType(userType);
    setStep("preview");
  }, []);

  const handleBackToUserType = useCallback(() => {
    setStep("userType");
  }, []);

  const handleSkip = useCallback(() => {
    setHasInteracted(true);
    setIsVisible(false);
    setTimeout(() => {
      skipOnboarding();
    }, 150);
  }, [skipOnboarding]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible && !hasInteracted) {
        handleSkip();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        isVisible &&
        !target.closest(".onboarding-welcome-modal") &&
        !hasInteracted
      ) {
        handleSkip();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isVisible, hasInteracted, handleSkip]);

  useEffect(() => {
    // Check if this is likely a first-time user (no localStorage data)
    const hasVisited = localStorage.getItem("besu-onboarding");
    const shouldShow = !hasVisited && !hasInteracted;

    if (shouldShow) {
      // Show modal after a delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  // Don't show if user has completed onboarding or not visible
  if (isCompleted || !isVisible) return null;

  const userTypes = [
    {
      type: "beginner" as UserType,
      icon: Users,
      title: "First Time User",
      description: "New to 3D customization",
      features: ["Basic tour", "Step-by-step guidance", "Essential features"],
      color: "bg-blue-500",
      estimatedTime: "5-7 min",
    },
    {
      type: "designer" as UserType,
      icon: Paintbrush,
      title: "Designer/Creator",
      description: "Focus on creative tools",
      features: [
        "AI texture generator",
        "Advanced materials",
        "Export options",
      ],
      color: "bg-purple-500",
      estimatedTime: "8-10 min",
    },
    {
      type: "business" as UserType,
      icon: Building,
      title: "Business User",
      description: "Product customization for business",
      features: ["Bulk operations", "Brand integration", "Team features"],
      color: "bg-green-500",
      estimatedTime: "6-8 min",
    },
    {
      type: "developer" as UserType,
      icon: Code,
      title: "Developer/Tech",
      description: "Technical implementation focus",
      features: ["API integration", "Advanced settings", "Technical details"],
      color: "bg-orange-500",
      estimatedTime: "10-12 min",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500 p-4">
      <Card className="onboarding-welcome-modal w-full max-w-2xl mx-auto p-6 text-center space-y-6 animate-in zoom-in-95 duration-500 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Welcome Step */}
        {step === "welcome" && (
          <>
            <div className="space-y-5">
              <div className="relative">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold">Welcome to Besu Customs!</h1>
                <p className="text-muted-foreground text-sm">
                  Ready to master 3D customization? Let&apos;s create a
                  personalized tour for you.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="space-y-2 text-center">
                <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-xs text-muted-foreground">5-12 min</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Personalized
                </div>
              </div>
              <div className="space-y-2 text-center">
                <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="text-xs text-muted-foreground">Interactive</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setStep("userType")}
                className="w-full font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                Get Personal Tour
              </Button>

              <div className="flex gap-2 flex-col sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 text-sm"
                >
                  Later
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 text-sm"
                >
                  <X className="w-3 h-3 mr-1" />
                  Skip
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded">
              &#128161; Pro tip: Restart tour anytime from help menu
            </div>
          </>
        )}

        {/* User Type Selection */}
        {step === "userType" && (
          <>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">What describes you best?</h2>
              <p className="text-muted-foreground text-sm">
                This helps us customize the tour to show you the most relevant
                features.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userTypes.map((userType) => {
                const Icon = userType.icon;
                const isSelected = selectedUserType === userType.type;
                return (
                  <button
                    key={userType.type}
                    onClick={() => handleUserTypeSelect(userType.type)}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 hover:scale-[1.02] ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center bg-muted text-foreground flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {userType.title}
                          </h3>
                          <span className="text-xs text-muted-foreground ml-2">
                            {userType.estimatedTime}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {userType.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {userType.features.map((feature, index) => (
                            <span
                              key={index}
                              className="text-xs bg-secondary/50 px-2 py-1 rounded whitespace-nowrap"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("welcome")}
                className="flex-1 text-sm"
              >
                Back
              </Button>
            </div>
          </>
        )}

        {/* Feature Preview */}
        {step === "preview" && (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold">Perfect Choice!</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Your personalized tour is ready
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  {(() => {
                    const selectedType = userTypes.find(
                      (ut) => ut.type === selectedUserType,
                    );
                    if (!selectedType) return null;
                    const Icon = selectedType.icon;
                    return (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {selectedType.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {selectedType.estimatedTime}
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mt-4 space-y-2">
                  {userTypes
                    .find((ut) => ut.type === selectedUserType)
                    ?.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleStartTour} className="w-full font-medium">
                Start Tour
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToUserType}
                  className="flex-1 text-sm"
                >
                  Change
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 text-sm"
                >
                  Skip
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
