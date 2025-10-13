'use client';

import React, { useState } from 'react';
import { useOnboardingStore, OnboardingPreferences } from '@/lib/onboarding-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Volume2,
  VolumeX,
  Zap,
  Eye,
  Lightbulb,
  Gauge,
  Users,
  X,
  Save,
  RotateCcw
} from 'lucide-react';

interface OnboardingPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingPreferencesModal({ isOpen, onClose }: OnboardingPreferencesModalProps) {
  const { preferences, updatePreferences, analytics, resetOnboarding } = useOnboardingStore();
  const [localPreferences, setLocalPreferences] = useState<OnboardingPreferences>(preferences);

  if (!isOpen) return null;

  const handleSave = () => {
    updatePreferences(localPreferences);
    onClose();
  };

  const handleReset = () => {
    const defaultPreferences: OnboardingPreferences = {
      userType: 'beginner',
      tourMode: 'guided',
      showAnimations: true,
      autoAdvance: false,
      showTips: true,
      voiceOver: false,
      reduceMotion: false,
      prefersDarkMode: false,
    };
    setLocalPreferences(defaultPreferences);
  };

  const updateLocalPreference = <K extends keyof OnboardingPreferences>(
    key: K,
    value: OnboardingPreferences[K]
  ) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="max-w-2xl mx-4 p-6 space-y-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Onboarding Preferences</h2>
              <p className="text-sm text-muted-foreground">Customize your learning experience</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{analytics.tourStarted}</div>
            <div className="text-xs text-muted-foreground">Tours Started</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.tourCompleted}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(analytics.completionRate)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(analytics.averageStepTime / 1000)}s</div>
            <div className="text-xs text-muted-foreground">Avg Step Time</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>User Type</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'beginner', label: 'Beginner', desc: 'New to 3D customization' },
                { value: 'designer', label: 'Designer', desc: 'Creative professional' },
                { value: 'business', label: 'Business', desc: 'Business user' },
                { value: 'developer', label: 'Developer', desc: 'Technical user' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateLocalPreference('userType', type.value as any)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    localPreferences.userType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tour Mode */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Gauge className="w-4 h-4" />
              <span>Tour Mode</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'guided', label: 'Guided', desc: 'Step-by-step guidance' },
                { value: 'free', label: 'Free Explore', desc: 'Explore at your own pace' },
                { value: 'interactive', label: 'Interactive', desc: 'Hands-on practice' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updateLocalPreference('tourMode', mode.value as any)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    localPreferences.tourMode === mode.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs text-muted-foreground">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Preferences */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Visual Preferences</span>
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="animations">Show Animations</Label>
                  <p className="text-xs text-muted-foreground">Enhanced visual transitions</p>
                </div>
                <Switch
                  id="animations"
                  checked={localPreferences.showAnimations}
                  onCheckedChange={(checked) => updateLocalPreference('showAnimations', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="reduce-motion">Reduce Motion</Label>
                  <p className="text-xs text-muted-foreground">Minimize movement effects</p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={localPreferences.reduceMotion}
                  onCheckedChange={(checked) => updateLocalPreference('reduceMotion', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="show-tips">Show Pro Tips</Label>
                  <p className="text-xs text-muted-foreground">Display helpful hints</p>
                </div>
                <Switch
                  id="show-tips"
                  checked={localPreferences.showTips}
                  onCheckedChange={(checked) => updateLocalPreference('showTips', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="auto-advance">Auto Advance</Label>
                  <p className="text-xs text-muted-foreground">Automatically progress steps</p>
                </div>
                <Switch
                  id="auto-advance"
                  checked={localPreferences.autoAdvance}
                  onCheckedChange={(checked) => updateLocalPreference('autoAdvance', checked)}
                />
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>Accessibility</span>
            </Label>
            
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="voice-over" className="flex items-center space-x-2">
                  {localPreferences.voiceOver ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>Voice Narration</span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Label>
                <p className="text-xs text-muted-foreground">Audio narration for each step</p>
              </div>
              <Switch
                id="voice-over"
                checked={localPreferences.voiceOver}
                onCheckedChange={(checked) => updateLocalPreference('voiceOver', checked)}
                disabled
              />
            </div>
          </div>

          {/* Recent Feedback */}
          {analytics.userFeedback.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Recent Feedback</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {analytics.userFeedback.slice(-3).map((feedback, index) => (
                  <div key={index} className="p-2 bg-secondary/20 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{feedback.stepId}</div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < feedback.rating ? 'bg-yellow-400' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-xs text-muted-foreground mt-1">{feedback.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}