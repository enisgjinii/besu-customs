import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserType = "beginner" | "designer" | "developer" | "business";
export type TourMode = "guided" | "free" | "interactive";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: () => void; // Optional action to trigger
  waitFor?: string; // Wait for specific element or condition
  autoAdvance?: boolean;
  delay?: number;
  prerequisites?: string[]; // Required completed steps
  userTypes?: UserType[]; // Show only for specific user types
  isOptional?: boolean;
  estimatedTime?: number; // In seconds
  category?: "basic" | "advanced" | "pro";
  mediaUrl?: string; // Optional video or image
  tips?: string[]; // Additional tips
  shortcuts?: { key: string; description: string }[];
}

export interface OnboardingPreferences {
  userType: UserType;
  tourMode: TourMode;
  showAnimations: boolean;
  autoAdvance: boolean;
  showTips: boolean;
  voiceOver: boolean;
  reduceMotion: boolean;
  prefersDarkMode: boolean;
}

export interface OnboardingAnalytics {
  tourStarted: number;
  tourCompleted: number;
  stepsCompleted: number;
  averageStepTime: number;
  skipRate: number;
  completionRate: number;
  commonDropOffPoints: string[];
  userFeedback: { stepId: string; rating: number; comment?: string }[];
}

export interface OnboardingState {
  currentStep: number;
  isActive: boolean;
  completedSteps: Set<string>;
  isCompleted: boolean;
  steps: OnboardingStep[];
  isTransitioning: boolean;
  hasModalConflict: boolean;
  preferences: OnboardingPreferences;
  analytics: OnboardingAnalytics;
  startTime: number | null;
  stepStartTime: number | null;
  isPaused: boolean;
  bookmarks: number[];
  customSteps: OnboardingStep[];
  currentStepTime: number;
  totalEstimatedTime: number;

  // Actions
  startOnboarding: (userType?: UserType) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  restartOnboarding: () => void;
  markStepCompleted: (stepId: string) => void;
  setTransitioning: (transitioning: boolean) => void;
  checkModalConflicts: () => void;
  updatePreferences: (preferences: Partial<OnboardingPreferences>) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  addBookmark: (stepIndex: number) => void;
  removeBookmark: (stepIndex: number) => void;
  addCustomStep: (step: OnboardingStep) => void;
  trackStepTime: () => void;
  submitFeedback: (stepId: string, rating: number, comment?: string) => void;
  getFilteredSteps: () => OnboardingStep[];
  getProgress: () => { completed: number; total: number; percentage: number };
  getEstimatedTimeRemaining: () => number;

  // New automatic functions
  autoCompleteSteps: () => void;
  autoSwitchTabs: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      isActive: false,
      completedSteps: new Set(),
      isCompleted: false,
      isTransitioning: false,
      hasModalConflict: false,
      preferences: {
        userType: "beginner",
        tourMode: "guided",
        showAnimations: true,
        autoAdvance: false,
        showTips: true,
        voiceOver: false,
        reduceMotion: false,
        prefersDarkMode: false,
      },
      analytics: {
        tourStarted: 0,
        tourCompleted: 0,
        stepsCompleted: 0,
        averageStepTime: 0,
        skipRate: 0,
        completionRate: 0,
        commonDropOffPoints: [],
        userFeedback: [],
      },
      startTime: null,
      stepStartTime: null,
      isPaused: false,
      bookmarks: [],
      customSteps: [],
      currentStepTime: 0,
      totalEstimatedTime: 0,

      // Add a new function to automatically complete steps 8-19
      autoCompleteSteps: async () => {
        const { steps, goToStep, nextStep } = get();

        // Start from step 8 (index 7) and go through step 19 (index 18)
        for (let i = 7; i <= 18 && i < steps.length; i++) {
          // Go to the step
          goToStep(i);

          // Execute the step's action if it exists
          if (steps[i].action) {
            steps[i].action!();
          }

          // Wait for the step to complete
          await new Promise((resolve) =>
            setTimeout(resolve, steps[i].delay || 2000),
          );

          // Move to next step
          nextStep();
        }
      },

      // Add a function to automatically switch tabs
      autoSwitchTabs: async () => {
        const tabs = ["materials", "texture", "view"];

        for (const tab of tabs) {
          // Find and click the tab button
          const tabButton = document.querySelector(`[data-tab="${tab}"]`);
          if (tabButton) {
            (tabButton as HTMLElement).click();
          }

          // Wait before switching to next tab
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      },

      steps: [
        {
          id: "welcome",
          title: "🎉 Welcome to Besu Customs!",
          description:
            "Let's take a personalized tour to help you master our 3D customization platform. This will take about 5-10 minutes.",
          position: "center",
          autoAdvance: true,
          delay: 3000,
          category: "basic",
          estimatedTime: 10,
          tips: [
            "You can pause anytime by pressing Space",
            "Use arrow keys to navigate",
            "Click the dots below to jump to any step",
          ],
          shortcuts: [
            { key: "←/→", description: "Navigate steps" },
            { key: "ESC", description: "Exit tour" },
            { key: "SPACE", description: "Pause/Resume" },
          ],
        },
        {
          id: "sidebar",
          title: "🧭 Navigation Sidebar",
          description:
            "Your command center! This sidebar contains all the essential tools and sections. Pro tip: You can collapse it for more workspace.",
          target: '[data-tour="sidebar"]',
          position: "right",
          category: "basic",
          estimatedTime: 15,
          tips: [
            "Use Ctrl+B to toggle sidebar quickly",
            "Sections are organized by workflow",
          ],
          userTypes: ["beginner", "designer", "business"],
        },
        {
          id: "model-loader",
          title: "🎽 3D Model Gallery",
          description:
            "Start your creativity here! Browse our extensive collection of 3D models including apparel, accessories, and sports equipment.",
          target: '[data-tour="model-loader"]',
          position: "right",
          category: "basic",
          estimatedTime: 20,
          tips: [
            "Models are categorized by type",
            "Use search to find specific items quickly",
            "Preview models before loading",
          ],
          action: () => {
            // Expand model section if collapsed
            const modelSection = document.querySelector(
              '[data-tour="model-loader"]',
            );
            if (modelSection) {
              modelSection.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          },
        },
        {
          id: "material-editor",
          title: "🎨 Material Studio",
          description:
            "Transform your model with materials! Customize colors, textures, and finishes for each part of your 3D model.",
          target: '[data-tour="material-editor"]',
          position: "right",
          category: "basic",
          estimatedTime: 30,
          tips: [
            "Each material part can be customized independently",
            "Use the color picker for precise colors",
            "Save your favorite materials",
          ],
          userTypes: ["beginner", "designer", "business"],
          action: () => {
            // Switch to materials tab and select the first material
            setTimeout(() => {
              // Find and click the materials tab
              const materialsTab = document.querySelector(
                '[data-tab="materials"]',
              );
              if (materialsTab) {
                (materialsTab as HTMLElement).click();
              }

              // Wait for tab to switch and then select first material
              setTimeout(() => {
                const materialButtons = document.querySelectorAll(
                  '[data-tour="material-editor"] button',
                );
                if (materialButtons.length > 0) {
                  // Click the first material section button
                  const firstMaterialButton = Array.from(materialButtons).find(
                    (button) =>
                      button.textContent &&
                      !button.textContent.includes("Panel"),
                  );
                  if (firstMaterialButton) {
                    (firstMaterialButton as HTMLElement).click();
                  }
                }
              }, 500);
            }, 500);
          },
        },
        {
          id: "color-picker",
          title: "Color Selection",
          description:
            "Pick colors from the palette or use the color picker for precise color matching.",
          target: '[data-tour="color-picker"]',
          position: "top",
          action: () => {
            // Automatically open the color picker, select a color, and close the modal
            setTimeout(() => {
              const colorPickerButton = document.querySelector(
                '[data-tour="color-picker"]',
              );
              if (colorPickerButton) {
                (colorPickerButton as HTMLElement).click();

                // Wait for the color picker modal to open and select a random color
                setTimeout(() => {
                  // Try to select a team color first
                  const teamColorButtons = document.querySelectorAll(
                    '.team-colors button, [data-tour="color-picker-modal"] .grid button',
                  );
                  if (teamColorButtons.length > 0) {
                    // Select a random team color
                    const randomIndex = Math.floor(
                      Math.random() * Math.min(3, teamColorButtons.length),
                    );
                    (teamColorButtons[randomIndex] as HTMLElement).click();
                  } else {
                    // Fallback to basic colors
                    const basicColorButtons = document.querySelectorAll(
                      ".basic-colors button, .grid button",
                    );
                    if (basicColorButtons.length > 0) {
                      const randomIndex = Math.floor(
                        Math.random() * Math.min(5, basicColorButtons.length),
                      );
                      (basicColorButtons[randomIndex] as HTMLElement).click();
                    }
                  }

                  // The modal should close automatically after color selection
                  // But just in case, try to close it explicitly
                  setTimeout(() => {
                    const closeButtons = document.querySelectorAll(
                      '[data-tour="color-picker-modal"] .close-button, [data-tour="color-picker-modal"] .h-8.w-8, [aria-label="Close"]',
                    );
                    if (closeButtons.length > 0) {
                      (closeButtons[0] as HTMLElement).click();
                    }
                  }, 300);
                }, 500);
              }
            }, 500);
          },
        },
        {
          id: "texture-upload",
          title: "Texture Upload",
          description:
            "Upload your own textures and images to apply custom designs to your models.",
          target: '[data-tour="texture-upload"]',
          position: "top",
          action: () => {
            // Switch to the texture tab
            setTimeout(() => {
              const textureTab = document.querySelector('[data-tab="texture"]');
              if (textureTab) {
                (textureTab as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "ai-generator",
          title: "🤖 AI Texture Creator",
          description:
            "Unleash AI creativity! Generate unlimited unique textures by describing what you envision. Perfect for one-of-a-kind designs.",
          target: '[data-tour="ai-generator"]',
          position: "left",
          category: "advanced",
          estimatedTime: 45,
          tips: [
            "Be descriptive in your prompts",
            'Try different styles like "watercolor", "metallic", "fabric"',
            "Generated images can be saved for later use",
          ],
          userTypes: ["designer", "business"],
          action: () => {
            // Switch to the texture tab for AI generator
            setTimeout(() => {
              const textureTab = document.querySelector('[data-tab="texture"]');
              if (textureTab) {
                (textureTab as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "link-materials",
          title: "🔗 Link Materials",
          description:
            "Link multiple material sections to apply the same changes to all of them simultaneously.",
          target: '[data-tour="material-editor"] .absolute.right-2.top-1\\/2',
          position: "top",
          action: () => {
            // Automatically link materials
            setTimeout(() => {
              // Find the first link button and click it
              const linkButtons = document.querySelectorAll(
                '[data-tour="material-editor"] .absolute.right-2.top-1\\/2',
              );
              if (linkButtons.length > 0) {
                (linkButtons[0] as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "save-preset",
          title: "💾 Save Your Work",
          description:
            "Save your current configuration as a preset for future use or sharing.",
          target: '[data-tour="export-options"] .save-preset-button',
          position: "top",
          action: () => {
            // Automatically open save preset modal
            setTimeout(() => {
              const saveButton = document.querySelector(
                '[data-tour="export-options"] .save-preset-button',
              );
              if (saveButton) {
                (saveButton as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "export-model",
          title: "📤 Export Your Creation",
          description:
            "Export your customized model in various formats for 3D printing or further editing.",
          target: '[data-tour="export-options"] .export-button',
          position: "top",
          action: () => {
            // Automatically show export options
            setTimeout(() => {
              const exportButton = document.querySelector(
                '[data-tour="export-options"] .export-button',
              );
              if (exportButton) {
                (exportButton as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "export-options",
          title: "Export & Download",
          description:
            "Save your configuration or export images of your customized model.",
          target: '[data-tour="export-options"]',
          position: "top",
          action: () => {
            // Switch to the view tab for export options
            setTimeout(() => {
              const viewTab = document.querySelector('[data-tab="view"]');
              if (viewTab) {
                (viewTab as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "scene-controls",
          title: "3D Scene Controls",
          description:
            "Use these controls to rotate, zoom, and pan around your 3D model.",
          target: '[data-tour="scene-controls"]',
          position: "bottom",
          action: () => {
            // Switch to the view tab for scene controls
            setTimeout(() => {
              const viewTab = document.querySelector('[data-tab="view"]');
              if (viewTab) {
                (viewTab as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "camera-angles",
          title: "Camera Presets",
          description:
            "Quick camera angles to view your model from different perspectives.",
          target: '[data-tour="camera-angles"]',
          position: "left",
          action: () => {
            // Switch to the view tab for camera angles
            setTimeout(() => {
              const viewTab = document.querySelector('[data-tab="view"]');
              if (viewTab) {
                (viewTab as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "lighting-controls",
          title: "Lighting Settings",
          description:
            "Adjust lighting intensity, color, and environment for better visualization.",
          target: '[data-tour="lighting-controls"]',
          position: "top",
          action: () => {
            // Switch to the view tab for lighting controls
            setTimeout(() => {
              const viewTab = document.querySelector('[data-tab="view"]');
              if (viewTab) {
                (viewTab as HTMLElement).click();
              }
            }, 500);
          },
        },
        {
          id: "export-options",
          title: "Export & Download",
          description:
            "Save your configuration or export images of your customized model.",
          target: '[data-tour="export-options"]',
          position: "top",
        },
        {
          id: "mobile-nav",
          title: "Mobile Navigation",
          description:
            "On mobile devices, use this bottom navigation to quickly access main features.",
          target: '[data-tour="mobile-nav"]',
          position: "top",
          action: () => {
            // Show mobile navigation (no tab switching needed)
            console.log("Showing mobile navigation");
          },
        },
        {
          id: "responsive-design",
          title: "Responsive Design",
          description:
            "The interface adapts to different screen sizes. Try resizing your browser window!",
          position: "center",
          autoAdvance: true,
          delay: 1500,
        },
        {
          id: "auto-complete",
          title: "Auto Complete Tour",
          description:
            "Automatically complete the remaining steps of the tour.",
          position: "center",
          action: () => {
            // Automatically complete steps 8-19
            setTimeout(() => {
              const state = useOnboardingStore.getState();
              state.autoCompleteSteps();
            }, 500);
          },
        },
        {
          id: "auto-tabs",
          title: "Auto Tab Switching",
          description:
            "Automatically switch between different tabs to explore the interface.",
          position: "center",
          action: () => {
            // Automatically switch tabs
            setTimeout(() => {
              const state = useOnboardingStore.getState();
              state.autoSwitchTabs();
            }, 500);
          },
        },
        {
          id: "final-tips",
          title: "🚀 You're Ready to Create!",
          description:
            "Congratulations! You've mastered the essentials of Besu Customs. Time to bring your creative visions to life. Remember: save early, save often!",
          position: "center",
          autoAdvance: true,
          delay: 4000,
          category: "basic",
          estimatedTime: 15,
          tips: [
            "Use Ctrl+S to save your work",
            "Export high-resolution images for presentations",
            "Join our community for inspiration and tips",
            "Check the help center for advanced tutorials",
          ],
          shortcuts: [
            { key: "Ctrl+S", description: "Save project" },
            { key: "Ctrl+E", description: "Export image" },
          ],
          action: () => {
            // Automatically complete the onboarding when this step is reached
            setTimeout(() => {
              const state = useOnboardingStore.getState();
              state.completeOnboarding();
            }, 3500);
          },
        },
      ],

      startOnboarding: (userType?: UserType) => {
        const state = get();
        const now = Date.now();
        set({
          isActive: true,
          currentStep: 0,
          completedSteps: new Set(),
          startTime: now,
          stepStartTime: now,
          isPaused: false,
          preferences: userType
            ? { ...state.preferences, userType }
            : state.preferences,
          analytics: {
            ...state.analytics,
            tourStarted: state.analytics.tourStarted + 1,
          },
        });
      },

      nextStep: () => {
        const { currentStep, steps, completedSteps } = get();
        if (currentStep < steps.length - 1) {
          const nextStepIndex = currentStep + 1;
          set({
            currentStep: nextStepIndex,
            completedSteps: new Set([...completedSteps, steps[currentStep].id]),
          });
        } else {
          get().completeOnboarding();
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      goToStep: (stepIndex: number) => {
        const { steps, completedSteps } = get();
        if (stepIndex >= 0 && stepIndex < steps.length) {
          set({ currentStep: stepIndex });
          // Mark all previous steps as completed
          const newCompleted = new Set(completedSteps);
          for (let i = 0; i < stepIndex; i++) {
            newCompleted.add(steps[i].id);
          }
          set({ completedSteps: newCompleted });
        }
      },

      completeOnboarding: () => {
        const { steps, completedSteps } = get();
        const allCompleted = new Set([...completedSteps]);
        steps.forEach((step) => allCompleted.add(step.id));

        set({
          isActive: false,
          isCompleted: true,
          completedSteps: allCompleted,
          currentStep: 0,
        });
      },

      skipOnboarding: () => {
        set({ isActive: false, currentStep: 0 });
      },

      resetOnboarding: () => {
        set({
          isActive: false,
          currentStep: 0,
          completedSteps: new Set(),
          isCompleted: false,
          isTransitioning: false,
          hasModalConflict: false,
        });
      },

      restartOnboarding: () => {
        // Reset to initial state but keep completion status for persistence
        set({
          isActive: true,
          currentStep: 0,
          completedSteps: new Set(),
          isTransitioning: false,
          hasModalConflict: false,
        });
      },

      markStepCompleted: (stepId: string) => {
        const { completedSteps } = get();
        set({ completedSteps: new Set([...completedSteps, stepId]) });
      },

      setTransitioning: (transitioning: boolean) => {
        set({ isTransitioning: transitioning });
      },

      checkModalConflicts: () => {
        // Check for existing modals/dialogs that might conflict
        const conflictingElements = [
          ".modal",
          ".dialog",
          '[role="dialog"]',
          ".dropdown-menu",
          ".popover",
          ".tooltip",
        ];

        const hasConflicts = conflictingElements.some((selector) => {
          return document.querySelector(selector) !== null;
        });

        set({ hasModalConflict: hasConflicts });

        // If conflicts exist, pause the tour
        if (hasConflicts) {
          console.warn("Onboarding tour paused due to modal conflicts");
        }
      },

      updatePreferences: (newPreferences: Partial<OnboardingPreferences>) => {
        const { preferences } = get();
        set({ preferences: { ...preferences, ...newPreferences } });
      },

      pauseTour: () => {
        const state = get();
        if (state.isActive && !state.isPaused) {
          set({ isPaused: true });
        }
      },

      resumeTour: () => {
        const state = get();
        if (state.isActive && state.isPaused) {
          set({ isPaused: false, stepStartTime: Date.now() });
        }
      },

      addBookmark: (stepIndex: number) => {
        const { bookmarks } = get();
        if (!bookmarks.includes(stepIndex)) {
          set({ bookmarks: [...bookmarks, stepIndex] });
        }
      },

      removeBookmark: (stepIndex: number) => {
        const { bookmarks } = get();
        set({ bookmarks: bookmarks.filter((b) => b !== stepIndex) });
      },

      addCustomStep: (step: OnboardingStep) => {
        const { customSteps } = get();
        set({ customSteps: [...customSteps, step] });
      },

      trackStepTime: () => {
        const state = get();
        if (state.stepStartTime) {
          const stepTime = Date.now() - state.stepStartTime;
          set({
            currentStepTime: stepTime,
            stepStartTime: Date.now(),
            analytics: {
              ...state.analytics,
              averageStepTime: (state.analytics.averageStepTime + stepTime) / 2,
            },
          });
        }
      },

      submitFeedback: (stepId: string, rating: number, comment?: string) => {
        const { analytics } = get();
        const newFeedback = { stepId, rating, comment };
        set({
          analytics: {
            ...analytics,
            userFeedback: [...analytics.userFeedback, newFeedback],
          },
        });
      },

      getFilteredSteps: () => {
        const { steps, preferences } = get();
        return steps.filter((step) => {
          // Filter by user type if specified
          if (
            step.userTypes &&
            !step.userTypes.includes(preferences.userType)
          ) {
            return false;
          }
          return true;
        });
      },

      getProgress: () => {
        const { completedSteps } = get();
        const filteredSteps = get().getFilteredSteps();
        const completed = Array.from(completedSteps).filter((stepId) =>
          filteredSteps.some((step) => step.id === stepId),
        ).length;
        const total = filteredSteps.length;
        const percentage =
          total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
      },

      getEstimatedTimeRemaining: () => {
        const { currentStep } = get();
        const filteredSteps = get().getFilteredSteps();
        const remainingSteps = filteredSteps.slice(currentStep);
        return remainingSteps.reduce(
          (total, step) => total + (step.estimatedTime || 30),
          0,
        );
      },
    }),
    {
      name: "besu-onboarding",
      // Only persist completion status and completed steps, not active state
      partialize: (state) => ({
        isCompleted: state.isCompleted,
        completedSteps: Array.from(state.completedSteps),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Set from array
          state.completedSteps = new Set(
            state.completedSteps as unknown as string[],
          );
        }
      },
    },
  ),
);
