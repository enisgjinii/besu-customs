'use client';

import React, { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { OnboardingPreferencesModal } from '@/components/onboarding-preferences';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Clock,
  Star,
  Download,
  Share
} from 'lucide-react';

export function OnboardingInfoButton() {
  const { 
    isCompleted, 
    startOnboarding, 
    resetOnboarding, 
    restartOnboarding, 
    getProgress,
    analytics,
    bookmarks
  } = useOnboardingStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeTab, setActiveTab] = useState<'help' | 'progress' | 'resources'>('help');

  // Show tooltip on first visit if not completed
  useEffect(() => {
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  const handleRestartTour = () => {
    setIsExpanded(false);
    setShowTooltip(false);
    // Use the new restart function that properly handles completed state
    restartOnboarding();
  };

  const handleStartTour = () => {
    setIsExpanded(false);
    setShowTooltip(false);
    startOnboarding();
  };

  const progress = getProgress();
  const quickTips = [
    "Use Ctrl+B to toggle the sidebar",
    "Right-click models for context menus",
    "Drag and drop textures onto materials",
    "Use mousewheel to zoom in the 3D scene",
    "Save your work frequently with Ctrl+S"
  ];

  const resources = [
    { title: "Video Tutorials", icon: Play, url: "/tutorials", desc: "Step-by-step video guides" },
    { title: "Documentation", icon: BookOpen, url: "/docs", desc: "Comprehensive user manual" },
    { title: "Community Forum", icon: Users, url: "/community", desc: "Get help from other users" },
    { title: "Feature Requests", icon: MessageCircle, url: "/feedback", desc: "Suggest new features" },
    { title: "Keyboard Shortcuts", icon: Zap, url: "/shortcuts", desc: "Speed up your workflow" }
  ];

  return (
    <>
      {/* Preferences Modal */}
      <OnboardingPreferencesModal 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />

      {/* Floating Help System */}
      <div className="fixed bottom-6 right-6 z-30">
        <div className="relative">
          {/* Smart Tooltip */}
          {showTooltip && !isExpanded && (
            <Card className="absolute bottom-16 right-0 mb-2 p-4 max-w-80 animate-in slide-in-from-bottom-2 fade-in duration-500 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-semibold text-sm">🎯 Ready to become a pro?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Take our interactive tour and master 3D customization in just 5 minutes!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleStartTour} className="text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Start Tour
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowTooltip(false)} className="text-xs">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute top-full right-8 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card"></div>
            </Card>
          )}

          {/* Enhanced Main Button */}
          <div className="relative group">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`h-14 w-14 rounded-full shadow-lg hover:shadow-2xl transition-all duration-500 ${
                isExpanded ? 'rotate-180 scale-110' : 'hover:scale-105'
              } ${!isCompleted ? 'animate-pulse' : ''} bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary/60`}
              size="sm"
            >
              <Info className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>

            {/* Progress Ring for completed users */}
            {isCompleted && (
              <div className="absolute inset-0 rounded-full">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.2"
                    className="text-primary"
                  />
                  <path
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${progress.percentage}, 100`}
                    className="text-green-500"
                  />
                </svg>
              </div>
            )}

            {/* Notification Badge */}
            {bookmarks.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                {bookmarks.length}
              </div>
            )}

            {/* Pulsing ring for new users */}
            {!isCompleted && (
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            )}
          </div>

          {/* Advanced Expanded Menu */}
          {isExpanded && (
            <Card className="absolute bottom-16 right-0 mb-2 p-0 w-96 max-w-[90vw] animate-in slide-in-from-bottom-2 fade-in duration-500 shadow-2xl border-primary/20">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Info className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Help Center</h3>
                      <p className="text-xs text-muted-foreground">Everything you need to know</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreferences(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Display */}
                {isCompleted && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Tour Completed! 🎉
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                      You've mastered {progress.completed} out of {progress.total} features
                    </div>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b bg-secondary/20">
                {[
                  { id: 'help', label: 'Quick Help', icon: HelpCircle },
                  { id: 'progress', label: 'Progress', icon: CheckCircle },
                  { id: 'resources', label: 'Resources', icon: BookOpen }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary bg-background border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {/* Quick Help Tab */}
                {activeTab === 'help' && (
                  <div className="space-y-4">
                    {/* Main Actions */}
                    <div className="grid grid-cols-1 gap-2">
                      {isCompleted ? (
                        <Button onClick={handleRestartTour} className="w-full justify-start h-auto p-3">
                          <RotateCcw className="w-4 h-4 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Restart Tour</div>
                            <div className="text-xs text-muted-foreground">Review all features again</div>
                          </div>
                        </Button>
                      ) : (
                        <Button onClick={handleStartTour} className="w-full justify-start h-auto p-3">
                          <Play className="w-4 h-4 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Start Interactive Tour</div>
                            <div className="text-xs text-muted-foreground">Learn in 5-10 minutes</div>
                          </div>
                        </Button>
                      )}
                    </div>

                    {/* Quick Tips */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Quick Tips
                      </h4>
                      <div className="space-y-2">
                        {quickTips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs p-2 bg-secondary/30 rounded">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Tab */}
                {activeTab === 'progress' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-secondary/20 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{progress.percentage}%</div>
                      <div className="text-sm text-muted-foreground">Features Mastered</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {progress.completed} of {progress.total} completed
                      </div>
                    </div>

                    {/* Tour Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">{analytics.tourStarted}</div>
                        <div className="text-xs text-blue-600/80">Tours Started</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-lg font-semibold text-green-600">{analytics.tourCompleted}</div>
                        <div className="text-xs text-green-600/80">Completed</div>
                      </div>
                    </div>

                    {/* Bookmarks */}
                    {bookmarks.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Bookmarked Steps ({bookmarks.length})
                        </h4>
                        <div className="space-y-1">
                          {bookmarks.map((stepIndex, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setIsExpanded(false);
                                // You could implement goToStep here
                              }}
                              className="w-full text-left p-2 text-xs bg-secondary/30 hover:bg-secondary/50 rounded transition-colors"
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
                {activeTab === 'resources' && (
                  <div className="space-y-3">
                    {resources.map((resource, index) => (
                      <button
                        key={index}
                        onClick={() => window.open(resource.url, '_blank')}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/30 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <resource.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{resource.title}</div>
                          <div className="text-xs text-muted-foreground">{resource.desc}</div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      </button>
                    ))}

                    {/* Additional Actions */}
                    <div className="pt-3 border-t space-y-2">
                      <button
                        onClick={() => {
                          // Implement export functionality
                          console.log('Export tour progress...');
                        }}
                        className="w-full flex items-center gap-3 p-2 text-sm hover:bg-secondary/30 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export Progress
                      </button>
                      <button
                        onClick={() => {
                          // Implement share functionality
                          console.log('Share tour...');
                        }}
                        className="w-full flex items-center gap-3 p-2 text-sm hover:bg-secondary/30 rounded transition-colors"
                      >
                        <Share className="w-4 h-4" />
                        Share with Team
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-secondary/10 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Pro tip:</strong> Use <Badge variant="outline" className="text-xs mx-1">?</Badge> key anytime for help
                </p>
              </div>

              {/* Arrow pointer */}
              <div className="absolute top-full right-8 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card"></div>
            </Card>
          )}
        </div>
      </div>

      {/* Backdrop for expanded menu */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-20 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
