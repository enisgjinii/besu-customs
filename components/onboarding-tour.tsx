'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TooltipProps {
  step: { target?: string; position?: string; category?: string; title: string; description: string; tips?: string[]; shortcuts?: { key: string; description: string }[]; delay?: number; autoAdvance?: boolean; action?: () => void; id?: string };
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onRestart: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

function Tooltip({
  step,
  onNext,
  onPrevious,
  onSkip,
  onRestart,
  isFirst,
  isLast,
  currentStep,
  totalSteps
}: TooltipProps) {
  // For desktop only, position at bottom right
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Move hooks outside conditional to comply with React rules
  const [position, setPosition] = useState({ top: 0, left: 0, transform: '' });
  const [arrowPosition, setArrowPosition] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (isMobile && step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const tooltipHeight = 220; // Approximate tooltip height
        const tooltipWidth = 320; // Approximate tooltip width
        const margin = 16; // Margin from viewport edges

        let top = 0;
        let left = 0;
        let transform = '';
        let arrowPos = '';

        switch (step.position) {
          case 'top':
            top = rect.top - tooltipHeight - margin;
            left = rect.left + rect.width / 2;
            transform = 'translateX(-50%)';
            arrowPos = 'bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-card border-l-transparent border-r-transparent border-b-transparent';
            break;
          case 'bottom':
            top = rect.bottom + margin;
            left = rect.left + rect.width / 2;
            transform = 'translateX(-50%)';
            arrowPos = 'top-[-6px] left-1/2 transform -translate-x-1/2 border-b-card border-l-transparent border-r-transparent border-t-transparent';
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - tooltipWidth - margin;
            transform = 'translateY(-50%)';
            arrowPos = 'right-[-6px] top-1/2 transform -translate-y-1/2 border-l-card border-t-transparent border-b-transparent border-r-transparent';
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + margin;
            transform = 'translateY(-50%)';
            arrowPos = 'left-[-6px] top-1/2 transform -translate-y-1/2 border-r-card border-t-transparent border-b-transparent border-l-transparent';
            break;
          case 'center':
          default:
            top = window.innerHeight / 2;
            left = window.innerWidth / 2;
            transform = 'translate(-50%, -50%)';
            arrowPos = '';
            break;
        }

        // Keep tooltip within viewport bounds with better calculations
        const actualTop = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
        const actualLeft = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

        setPosition({ top: actualTop, left: actualLeft, transform });
        setArrowPosition(arrowPos);
      }
    } else if (isMobile) {
      // Center position for non-target steps
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        transform: 'translate(-50%, -50%)'
      });
      setArrowPosition('');
    }
  }, [step, isMobile]);

  if (isMobile) {
      <div
        className="fixed z-50 animate-in zoom-in-95 duration-500"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: position.transform,
          width: '420px',
          maxWidth: '90vw'
        }}
      >
        {/* Arrow pointer */}
        {arrowPosition && (
          <div
            className={`absolute w-0 h-0 border-4 ${arrowPosition}`}
            style={{ borderColor: 'inherit' }}
          />
        )}
        
        <Card className="shadow-2xl border border-primary/20 bg-background/98 backdrop-blur-xl overflow-hidden">
          {/* Elegant progress indicator */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/60 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="p-6 space-y-5">
            {/* Minimalist header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground tracking-wide">
                    {currentStep + 1}/{totalSteps}
                  </span>
                </div>
                                {step.category && (
                  <span className="text-xs px-2 py-0.5 border border-primary/30 text-primary/80 font-medium rounded">
                    {step.category}
                  </span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Refined title and description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg leading-tight text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Advanced tips section - only show if there are tips */}
            {step.tips && step.tips.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center space-x-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                >
                                    <ChevronRight className="w-3 h-3 group-hover:text-primary transition-colors" />
                  <span className="font-medium">Advanced Tips</span>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showTips ? 'rotate-90' : ''}`} />
                </button>
                
                {showTips && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    {step.tips.map((tip: string, index: number) => (
                      <div key={index} className="text-xs text-muted-foreground/80 bg-muted/30 px-3 py-2.5 rounded-lg border border-muted/50 flex items-start space-x-3">
                        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Keyboard shortcuts - only show if there are shortcuts */}
            {step.shortcuts && step.shortcuts.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="flex items-center space-x-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 group"
                >
                                    <ChevronRight className="w-3 h-3 group-hover:text-primary transition-colors" />
                  <span className="font-medium">Shortcuts</span>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showShortcuts ? 'rotate-90' : ''}`} />
                </button>
                
                {showShortcuts && (
                  <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-300">
                    {step.shortcuts.map((shortcut: { key: string; description: string }, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-muted/20 px-3 py-2.5 rounded-lg border border-muted/40">
                        <span className="text-muted-foreground/80">{shortcut.description}</span>
                        <span className="text-xs font-mono border border-primary/30 text-primary/80 px-1.5 py-0.5 rounded">
                          {shortcut.key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Refined navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-muted/30">
              <div className="flex gap-2">
                {!isFirst && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onPrevious} 
                    className="hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 group"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRestart} 
                  className="hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Reset
                </Button>

                {!isLast ? (
                  <Button 
                    onClick={onNext} 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 group min-w-[80px]"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                ) : (
                  <Button 
                    onClick={onNext} 
                    size="sm" 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[100px]"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
  }

  // Simplified desktop version - bottom right
  // State variables are now declared at the top to comply with React rules

  // Function to switch tabs
  const switchTab = (tab: string) => {
    // Find and click the tab button
    const tabButton = document.querySelector(`[data-tab="${tab}"]`);
    if (tabButton) {
      (tabButton as HTMLElement).click();
    }
  };

  // Function to select a model
  const selectModel = () => {
    // Find and click the first model in the dropdown
    const modelSelector = document.querySelector('[data-tour="model-loader"] select');
    if (modelSelector) {
      const selectElement = modelSelector as HTMLSelectElement;
      if (selectElement.options.length > 1) {
        // Select the second option (first is usually a placeholder)
        selectElement.selectedIndex = 1;
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        selectElement.dispatchEvent(event);
      }
    }
  };

  // Function to automatically select a material
  const selectMaterial = () => {
    // Wait a bit for the model to load and materials to be available
    setTimeout(() => {
      // Try to find the first material section button
      const materialButtons = document.querySelectorAll('[data-tour="material-editor"] button');
      if (materialButtons.length > 0) {
        // Click the first material section button (not the quick select buttons)
        const firstMaterialButton = Array.from(materialButtons).find(button => 
          button.textContent && !button.textContent.includes('Panel')
        );
        if (firstMaterialButton) {
          (firstMaterialButton as HTMLElement).click();
        } else {
          // Fallback: click the first button if no specific one found
          (materialButtons[0] as HTMLElement).click();
        }
      }
    }, 1000);
  };

  // Function to apply a sample texture
  const applySampleTexture = () => {
    // This would simulate applying a sample texture
    console.log('Applying sample texture...');
    
    // In a real implementation, this would:
    // 1. Open the texture upload panel
    // 2. Select a sample texture
    // 3. Apply it to the selected material
    
    // For now, we'll just show a message
    alert('In a real implementation, this would apply a sample texture to the selected material.');
  };

  // Function to automatically select a color and close the modal
  const autoSelectColor = () => {
    // Open the color picker modal
    const colorPickerButton = document.querySelector('[data-tour="color-picker"]');
    if (colorPickerButton) {
      (colorPickerButton as HTMLElement).click();
      
      // Wait for modal to open and select a color
      setTimeout(() => {
        // Try to select a team color first
        const teamColorButtons = document.querySelectorAll('.team-colors button, [data-tour="color-picker-modal"] .grid button');
        if (teamColorButtons.length > 0) {
          // Select a random team color
          const randomIndex = Math.floor(Math.random() * Math.min(3, teamColorButtons.length));
          (teamColorButtons[randomIndex] as HTMLElement).click();
        } else {
          // Fallback to basic colors
          const basicColorButtons = document.querySelectorAll('.basic-colors button, .grid button');
          if (basicColorButtons.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(5, basicColorButtons.length));
            (basicColorButtons[randomIndex] as HTMLElement).click();
          }
        }
        
        // The modal should close automatically after color selection
        // But just in case, try to close it explicitly
        setTimeout(() => {
          const closeButtons = document.querySelectorAll(
            '[data-tour="color-picker-modal"] .close-button, [data-tour="color-picker-modal"] .h-8.w-8, [aria-label="Close"]'
          );
          if (closeButtons.length > 0) {
            (closeButtons[0] as HTMLElement).click();
          }
        }, 300);
      }, 500);
    }
  };

  // Function to automatically switch tabs
  const autoSwitchTabs = () => {
    const tabs = ['materials', 'texture', 'view'];
    
    tabs.forEach((tab, index) => {
      setTimeout(() => {
        const tabButton = document.querySelector(`[data-tab="${tab}"]`);
        if (tabButton) {
          (tabButton as HTMLElement).click();
        }
      }, index * 1500);
    });
  };

  // Function to automatically complete steps 8-19
  const autoCompleteSteps = () => {
    const store = useOnboardingStore.getState();
    store.autoCompleteSteps();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-lg border border-primary/20 bg-background/95 backdrop-blur-lg overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-6 w-6 p-0 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm leading-tight">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Action buttons for specific steps */}
          {step.id === 'sidebar' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 px-2"
                onClick={() => switchTab('materials')}
              >
                Materials
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 px-2"
                onClick={() => switchTab('texture')}
              >
                Texture
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7 px-2"
                onClick={() => switchTab('view')}
              >
                Export
              </Button>
            </div>
          )}

          {step.id === 'model-loader' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={selectModel}
            >
              Load Sample Model
            </Button>
          )}

          {step.id === 'material-editor' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={selectMaterial}
            >
              Select First Material
            </Button>
          )}

          {step.id === 'color-picker' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1 text-xs h-7"
                onClick={autoSelectColor}
              >
                Auto Select Color
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs h-7"
                onClick={() => {
                  // Just open the color picker modal
                  const colorPickerButton = document.querySelector('[data-tour="color-picker"]');
                  if (colorPickerButton) {
                    (colorPickerButton as HTMLElement).click();
                  }
                }}
              >
                Open Picker
              </Button>
            </div>
          )}

          {step.id === 'texture-upload' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={applySampleTexture}
            >
              Apply Sample Texture
            </Button>
          )}

          {step.id === 'link-materials' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => {
                // Link materials
                // Fixed the CSS selector by escaping the forward slash or using a different approach
                const linkButtons = document.querySelectorAll('[data-tour="material-editor"] .absolute.right-2.top-1\\/2');
                if (linkButtons.length > 0) {
                  (linkButtons[0] as HTMLElement).click();
                }
              }}
            >
              Link First Two Materials
            </Button>
          )}

          {step.id === 'auto-complete' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={autoCompleteSteps}
            >
              Auto Complete Steps 8-19
            </Button>
          )}

          {step.id === 'auto-tabs' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={autoSwitchTabs}
            >
              Auto Switch Tabs
            </Button>
          )}

          {step.id === 'save-preset' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => {
                // Save preset
                const saveButton = document.querySelector('[data-tour="export-options"] .save-preset-button');
                if (saveButton) {
                  (saveButton as HTMLElement).click();
                }
              }}
            >
              Save Preset
            </Button>
          )}

          {step.id === 'export-model' && (
            <Button 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => {
                // Export model
                const exportButton = document.querySelector('[data-tour="export-options"] .export-button');
                if (exportButton) {
                  (exportButton as HTMLElement).click();
                }
              }}
            >
              Export Model
            </Button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {!isFirst && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onPrevious} 
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!isLast ? (
                <Button 
                  onClick={onNext} 
                  size="sm" 
                  className="h-7 text-xs px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={onNext} 
                  size="sm" 
                  className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface HighlightOverlayProps {
  target?: string;
}

function HighlightOverlay({ target }: HighlightOverlayProps) {
  const [highlight, setHighlight] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (target) {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlight(rect);
      }
    } else {
      setHighlight(null);
    }
  }, [target]);

  if (!highlight) return null;

  return (
    <>
      {/* Elegant highlight border with glow effect */}
      <div
        className="fixed z-45 pointer-events-none rounded-xl shadow-2xl"
        style={{
          top: `${highlight.top - 6}px`,
          left: `${highlight.left - 6}px`,
          width: `${highlight.width + 12}px`,
          height: `${highlight.height + 12}px`,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
          border: '2px solid rgba(59, 130, 246, 0.6)',
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1), 0 0 20px rgba(59, 130, 246, 0.3)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />
      
      {/* Subtle corner indicators */}
      <div className="fixed z-45 pointer-events-none">
        {[
          { top: highlight.top - 6, left: highlight.left - 6 },
          { top: highlight.top - 6, left: highlight.right + 6, transform: 'rotate(90deg)' },
          { top: highlight.bottom + 6, left: highlight.right + 6, transform: 'rotate(180deg)' },
          { top: highlight.bottom + 6, left: highlight.left - 6, transform: 'rotate(270deg)' }
        ].map((corner, index) => (
          <div
            key={index}
            className="absolute w-3 h-3 border-2 border-primary/80 bg-background rounded-sm"
            style={{
              top: `${corner.top}px`,
              left: `${corner.left}px`,
              transform: corner.transform || 'none'
            }}
          />
        ))}
      </div>
    </>
  );
}

export function OnboardingTour() {
  const {
    currentStep,
    isActive,
    isCompleted,
    steps,
    nextStep,
    previousStep,
    skipOnboarding,
    resetOnboarding,
    goToStep,
    isTransitioning,
    hasModalConflict,
    checkModalConflicts,
    setTransitioning
  } = useOnboardingStore();

  const [autoPlay, setAutoPlay] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Move state declarations to the top to comply with React rules
  const [showTips, setShowTips] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentStepData = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    // Restore body scroll
    document.body.style.overflow = '';
  }, []);

  // Enhanced modal opening/closing logic with conflict detection
  useEffect(() => {
    if (isActive && !isCompleted) {
      // Check for modal conflicts before starting
      checkModalConflicts();

      if (hasModalConflict) {
        console.warn('Cannot start onboarding tour due to modal conflicts');
        return;
      }

      setTransitioning(true);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Show tour UI
      setTimeout(() => {
        setIsVisible(true);
        setTransitioning(false);
      }, 50);

    } else {
      setTransitioning(true);
      setIsVisible(false);

      // Delay cleanup to allow animations
      setTimeout(() => {
        cleanup();
        setTransitioning(false);
      }, 300);
    }

    return cleanup;
  }, [isActive, isCompleted, hasModalConflict, checkModalConflicts, setTransitioning, cleanup]);

  // Auto-advance logic with proper cleanup
  useEffect(() => {
    if (!isActive || !autoPlay || !currentStepData || isTransitioning) return;

    const delay = currentStepData.delay || 3000;

    autoPlayTimerRef.current = setTimeout(() => {
      if (currentStepData.autoAdvance !== false && isActive) {
        nextStep();
      }
    }, delay);

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [currentStep, autoPlay, currentStepData, isActive, nextStep, isTransitioning]);

  // Periodic conflict checking during active tour
  useEffect(() => {
    if (!isActive || isTransitioning) return;

    const conflictCheckInterval = setInterval(() => {
      checkModalConflicts();

      if (hasModalConflict) {
        console.warn('Modal conflict detected during tour, pausing...');
        // Could add pause/resume logic here
      }
    }, 1000); // Check every second

    return () => clearInterval(conflictCheckInterval);
  }, [ isActive, isTransitioning, checkModalConflicts, hasModalConflict]);

  // Enhanced keyboard and interaction handling
  useEffect(() => {
    if (!isActive || isTransitioning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for tour navigation
      if (['ArrowLeft', 'ArrowRight', 'Escape', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (!isFirst) previousStep();
          break;
        case 'ArrowRight':
        case ' ':
          if (!isLast) {
            nextStep();
          } else {
            // Complete tour on last step
            nextStep();
          }
          break;
        case 'Escape':
          skipOnboarding();
          break;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Prevent page scrolling during tour
      e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isActive, isFirst, isLast, previousStep, nextStep, skipOnboarding, isTransitioning]);

  // Handle automatic actions for specific steps
  useEffect(() => {
    if (currentStepData?.action && isActive && isVisible && !isTransitioning) {
      const timer = setTimeout(() => {
        currentStepData.action?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStepData, isActive, isVisible, isTransitioning]);

  // Wait for target elements with better error handling
  useEffect(() => {
    if (currentStepData?.target && isActive && !isTransitioning) {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      const checkElement = () => {
        attempts++;
        const element = document.querySelector(currentStepData.target!);

        if (element) {
          // Element found, ensure it's visible and properly positioned
          setTimeout(() => {
            if (isActive) setIsVisible(true);
          }, 100);
        } else if (attempts < maxAttempts) {
          const timer = setTimeout(checkElement, 100);
          return () => clearTimeout(timer);
        } else {
          // Element not found after max attempts, still show tooltip
          console.warn(`Tour target not found: ${currentStepData.target}`);
          setIsVisible(true);
        }
      };

      checkElement();
    }
  }, [currentStepData, isActive, isTransitioning]);

  // Don't render if not active or not visible
  if (!isActive || !isVisible || isTransitioning) return null;

  return (
    <div className={`fixed inset-0 z-40 ${isTransitioning ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      {/* Modal conflict notification */}
      {hasModalConflict && isActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 font-medium">Tour paused - modal detected</span>
              <Button 
                onClick={skipOnboarding} 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-6 px-2 text-xs text-amber-700 hover:bg-amber-500/20"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Highlight overlay for target elements */}
      {currentStepData?.target && (
        <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <HighlightOverlay target={currentStepData.target} />
        </div>
      )}

      {/* Main tooltip with enhanced animations */}
      <div className={`transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
        <Tooltip
          step={currentStepData}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipOnboarding}
          onRestart={resetOnboarding}
          isFirst={isFirst}
          isLast={isLast}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      </div>

      {/* Minimalist Control Panel */}
      <div className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
        <div className="bg-background/95 backdrop-blur-xl rounded-xl p-2 shadow-xl border border-muted/30 flex items-center gap-2">
          {/* Auto-play toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`h-8 w-8 p-0 transition-all duration-200 ${
              autoPlay 
                ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            disabled={isTransitioning}
          >
            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          {/* Bookmark current step */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const state = useOnboardingStore.getState();
              state.addBookmark(currentStep);
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            disabled={isTransitioning}
            title="Bookmark step"
          >
                                    <CheckCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Progress Navigator */}
      {/* Step text - Moved outside and made bigger */}
      <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          {currentStepData?.title && (
            <div className="text-sm text-muted-foreground mt-1 max-w-md">
              {currentStepData.title}
            </div>
          )}
        </div>
      </div>
      
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-background/95 backdrop-blur-xl rounded-xl px-4 py-3 shadow-xl border border-muted/30">
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {currentStep + 1}/{steps.length}
              </span>
              <div className="w-16 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <button
                    key={index}
                    onClick={() => !isTransitioning && goToStep?.(index)}
                    className={`relative transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isCurrent
                        ? 'w-2.5 h-2.5 bg-primary shadow-md scale-125'
                      : isCompleted
                        ? 'w-2 h-2 bg-emerald-500 hover:scale-110'
                        : 'w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/60 hover:scale-110'
                    } ${
                      isTransitioning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                    disabled={isTransitioning}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
