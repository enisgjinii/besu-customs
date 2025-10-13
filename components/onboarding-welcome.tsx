'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useOnboardingStore, UserType } from '@/lib/onboarding-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Play,
  X,
  Clock,
  MousePointer,
  Smartphone,
  Users,
  Paintbrush,
  Code,
  Building,
  Star,
  ChevronRight,
  Zap,
  Heart,
  Trophy
} from 'lucide-react';

export function OnboardingWelcome() {
  const { isCompleted, startOnboarding, skipOnboarding } = useOnboardingStore();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('beginner');
  const [step, setStep] = useState<'welcome' | 'userType' | 'preview'>('welcome');
  const [showFeaturePreview, setShowFeaturePreview] = useState(false);

  const handleStartTour = useCallback(() => {
    setHasInteracted(true);
    setIsVisible(false);
    // Small delay to allow modal to close before starting tour
    setTimeout(() => {
      startOnboarding(selectedUserType);
      // Store user preference
      localStorage.setItem('besu-user-type', selectedUserType);
    }, 150);
  }, [startOnboarding, selectedUserType]);

  const handleUserTypeSelect = useCallback((userType: UserType) => {
    setSelectedUserType(userType);
    setStep('preview');
    setShowFeaturePreview(true);
  }, []);

  const handleBackToUserType = useCallback(() => {
    setStep('userType');
    setShowFeaturePreview(false);
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
      if (e.key === 'Escape' && isVisible && !hasInteracted) {
        handleSkip();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isVisible && !target.closest('.onboarding-welcome-modal') && !hasInteracted) {
        handleSkip();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isVisible, hasInteracted, handleSkip]);

  useEffect(() => {
    // Check if this is likely a first-time user (no localStorage data)
    const hasVisited = localStorage.getItem('besu-onboarding');
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
      type: 'beginner' as UserType,
      icon: Users,
      title: 'First Time User',
      description: 'New to 3D customization',
      features: ['Basic tour', 'Step-by-step guidance', 'Essential features'],
      color: 'bg-blue-500',
      estimatedTime: '5-7 min'
    },
    {
      type: 'designer' as UserType,
      icon: Paintbrush,
      title: 'Designer/Creator',
      description: 'Focus on creative tools',
      features: ['AI texture generator', 'Advanced materials', 'Export options'],
      color: 'bg-purple-500',
      estimatedTime: '8-10 min'
    },
    {
      type: 'business' as UserType,
      icon: Building,
      title: 'Business User',
      description: 'Product customization for business',
      features: ['Bulk operations', 'Brand integration', 'Team features'],
      color: 'bg-green-500',
      estimatedTime: '6-8 min'
    },
    {
      type: 'developer' as UserType,
      icon: Code,
      title: 'Developer/Tech',
      description: 'Technical implementation focus',
      features: ['API integration', 'Advanced settings', 'Technical details'],
      color: 'bg-orange-500',
      estimatedTime: '10-12 min'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="onboarding-welcome-modal max-w-2xl mx-4 p-8 text-center space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl">
        
        {/* Welcome Step */}
        {step === 'welcome' && (
          <>
            <div className="space-y-6">
              <div className="relative">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Star className="w-6 h-6 text-yellow-500 animate-bounce" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Welcome to Besu Customs! 
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  Ready to master the art of 3D customization? Let's create a personalized tour just for you!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">5-12 min tour</div>
              </div>
              <div className="space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">Personalized</div>
              </div>
              <div className="space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">Interactive</div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => setStep('userType')} 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-3" />
                Get My Personal Tour
                <ChevronRight className="w-5 h-5 ml-3" />
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSkip} className="flex-1 hover:bg-secondary/50">
                  Maybe Later
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1 hover:bg-secondary/50">
                  <X className="w-4 h-4 mr-2" />
                  Not Now
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-secondary/30 px-4 py-3 rounded-lg">
              💡 <strong>Pro tip:</strong> You can restart this tour anytime from the help menu
            </div>
          </>
        )}

        {/* User Type Selection */}
        {step === 'userType' && (
          <>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">What describes you best?</h2>
              <p className="text-muted-foreground">
                This helps us customize the tour to show you the most relevant features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTypes.map((userType) => {
                const Icon = userType.icon;
                const isSelected = selectedUserType === userType.type;
                return (
                  <button
                    key={userType.type}
                    onClick={() => handleUserTypeSelect(userType.type)}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${userType.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{userType.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {userType.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{userType.description}</p>
                        <div className="space-y-1">
                          {userType.features.map((feature, index) => (
                            <div key={index} className="text-xs text-muted-foreground flex items-center">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1">
                Back
              </Button>
            </div>
          </>
        )}

        {/* Feature Preview */}
        {step === 'preview' && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h2 className="text-2xl font-bold">Perfect Choice!</h2>
              </div>
              <p className="text-muted-foreground">
                Your personalized tour is ready. Here's what we'll cover based on your selection:
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const selectedType = userTypes.find(ut => ut.type === selectedUserType);
                  if (!selectedType) return null;
                  const Icon = selectedType.icon;
                  return (
                    <>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedType.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedType.title} Tour</h3>
                        <p className="text-sm text-muted-foreground">Estimated: {selectedType.estimatedTime}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {userTypes.find(ut => ut.type === selectedUserType)?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleStartTour} 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-200"
              >
                <Play className="w-5 h-5 mr-3" />
                Start My Personalized Tour
                <Sparkles className="w-5 h-5 ml-3" />
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBackToUserType} className="flex-1">
                  Change Selection
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip Tour
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
