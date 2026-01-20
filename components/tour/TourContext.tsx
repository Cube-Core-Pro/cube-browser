'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import {
  TourContextType,
  TourSection,
  TourStep,
  TourProgress,
  TourSettings,
  DEFAULT_TOUR_SETTINGS,
  DEFAULT_TOUR_PROGRESS,
  getTourStorageKey,
  getTourSettingsKey,
} from './types';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('TourContext');

// Create context with undefined default
const TourContext = createContext<TourContextType | undefined>(undefined);

// Props for the provider
interface TourProviderProps {
  children: ReactNode;
  sections: TourSection[];
  steps?: TourStep[];
  tourId?: string;
  /** @deprecated Use tourId instead */
  storageKey?: string;
  /** @deprecated Kept for backwards compatibility */
  moduleName?: string;
  onComplete?: () => void;
  onStepChange?: (step: TourStep, index: number) => void;
}

/**
 * TourProvider - Provides tour state and actions to all children
 * Now supports unique tourId for independent tour instances
 */
export const TourProvider: React.FC<TourProviderProps> = ({
  children,
  sections,
  steps: _steps,
  tourId,
  storageKey: legacyStorageKey,
  moduleName: _moduleName,
  onComplete,
  onStepChange,
}) => {
  // Storage keys based on tourId or legacy storageKey
  // Priority: tourId > legacyStorageKey > default
  const effectiveTourId = tourId || (legacyStorageKey ? legacyStorageKey.replace('cube-', '').replace('-tour', '') : undefined);
  const storageKey = getTourStorageKey(effectiveTourId);
  const settingsKey = getTourSettingsKey(effectiveTourId);
  
  // State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState<TourProgress>(DEFAULT_TOUR_PROGRESS);
  const [settings, setSettings] = useState<TourSettings>(DEFAULT_TOUR_SETTINGS);
  
  // Refs for tracking time
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Load saved progress and settings on mount
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(storageKey);
      const savedSettings = localStorage.getItem(settingsKey);
      
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress) as TourProgress;
        setProgress(parsed);
        if (parsed.completedSections.length === sections.length) {
          setIsCompleted(true);
        }
      }
      
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings) as TourSettings);
      }
    } catch (error) {
      log.error('Error loading tour progress:', error);
    }
  }, [sections.length, storageKey, settingsKey]);

  // Save progress when it changes
  useEffect(() => {
    if (progress.startedAt) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (error) {
        log.error('Error saving tour progress:', error);
      }
    }
  }, [progress, storageKey]);

  // Save settings when they change
  useEffect(() => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch (error) {
      log.error('Error saving tour settings:', error);
    }
  }, [settings, settingsKey]);

  // Get current section and step
  const getCurrentSection = useCallback((): TourSection | null => {
    return sections[progress.currentSectionIndex] || null;
  }, [sections, progress.currentSectionIndex]);

  const getCurrentStep = useCallback((): TourStep | null => {
    const section = getCurrentSection();
    if (!section) return null;
    return section.steps[progress.currentStepIndex] || null;
  }, [getCurrentSection, progress.currentStepIndex]);

  // Get total steps count
  const getTotalSteps = useCallback((): number => {
    return sections.reduce((total, section) => total + section.steps.length, 0);
  }, [sections]);

  // Get current global step index (0-based position across all sections)
  const getGlobalStepIndex = useCallback((): number => {
    let index = 0;
    for (let i = 0; i < progress.currentSectionIndex; i++) {
      index += sections[i].steps.length;
    }
    return index + progress.currentStepIndex;
  }, [sections, progress.currentSectionIndex, progress.currentStepIndex]);

  // Start the tour
  const startTour = useCallback((sectionId?: string) => {
    const sectionIndex = sectionId 
      ? sections.findIndex(s => s.id === sectionId) 
      : 0;
    
    if (sectionIndex === -1) return;

    startTimeRef.current = Date.now();
    
    setProgress(prev => ({
      ...prev,
      currentSectionIndex: sectionIndex,
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }));
    
    setIsActive(true);
    setIsPaused(false);
    setIsCompleted(false);

    // Call beforeShow for first step
    const firstStep = sections[sectionIndex]?.steps[0];
    if (firstStep?.beforeShow) {
      firstStep.beforeShow();
    }
  }, [sections]);

  // Pause the tour
  const pauseTour = useCallback(() => {
    pauseTimeRef.current = Date.now();
    setIsPaused(true);
  }, []);

  // Resume the tour
  const resumeTour = useCallback(() => {
    // Adjust start time to account for pause duration
    if (pauseTimeRef.current > 0) {
      const pauseDuration = Date.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      pauseTimeRef.current = 0;
    }
    setIsPaused(false);
  }, []);

  // End the tour
  const endTour = useCallback(() => {
    const currentStep = getCurrentStep();
    if (currentStep?.afterHide) {
      currentStep.afterHide();
    }

    // Calculate total time spent
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    setProgress(prev => ({
      ...prev,
      totalTimeSpent: prev.totalTimeSpent + totalTime,
      lastActiveAt: new Date().toISOString(),
    }));
    
    setIsActive(false);
    setIsPaused(false);
  }, [getCurrentStep]);

  // Go to next step
  const nextStep = useCallback(async () => {
    const currentSection = getCurrentSection();
    const currentStep = getCurrentStep();
    
    if (!currentSection || !currentStep) return;

    // Call afterHide for current step
    if (currentStep.afterHide) {
      await currentStep.afterHide();
    }

    // Mark current step as completed
    setProgress(prev => ({
      ...prev,
      completedSteps: Array.from(new Set([...prev.completedSteps, currentStep.id])),
      lastActiveAt: new Date().toISOString(),
    }));

    // Check if there are more steps in current section
    if (progress.currentStepIndex < currentSection.steps.length - 1) {
      const nextStepIndex = progress.currentStepIndex + 1;
      const nextStepObj = currentSection.steps[nextStepIndex];
      
      // Call beforeShow for next step
      if (nextStepObj?.beforeShow) {
        await nextStepObj.beforeShow();
      }

      setProgress(prev => ({ ...prev, currentStepIndex: nextStepIndex }));
      onStepChange?.(nextStepObj, nextStepIndex);
    } 
    // Move to next section
    else if (progress.currentSectionIndex < sections.length - 1) {
      // Mark current section as completed
      setProgress(prev => ({
        ...prev,
        completedSections: Array.from(new Set([...prev.completedSections, currentSection.id])),
        currentSectionIndex: prev.currentSectionIndex + 1,
        currentStepIndex: 0,
      }));

      const nextSection = sections[progress.currentSectionIndex + 1];
      const firstStep = nextSection?.steps[0];
      
      if (firstStep?.beforeShow) {
        await firstStep.beforeShow();
      }

      onStepChange?.(firstStep, 0);
    } 
    // Tour completed
    else {
      setProgress(prev => ({
        ...prev,
        completedSections: Array.from(new Set([...prev.completedSections, currentSection.id])),
      }));
      
      setIsCompleted(true);
      setIsActive(false);
      onComplete?.();
    }
  }, [getCurrentSection, getCurrentStep, progress, sections, onStepChange, onComplete]);

  // Go to previous step
  const prevStep = useCallback(async () => {
    const currentStep = getCurrentStep();
    
    if (currentStep?.afterHide) {
      await currentStep.afterHide();
    }

    // Go to previous step in current section
    if (progress.currentStepIndex > 0) {
      const prevStepIndex = progress.currentStepIndex - 1;
      const section = getCurrentSection();
      const prevStepObj = section?.steps[prevStepIndex];
      
      if (prevStepObj?.beforeShow) {
        await prevStepObj.beforeShow();
      }

      setProgress(prev => ({ ...prev, currentStepIndex: prevStepIndex }));
      onStepChange?.(prevStepObj!, prevStepIndex);
    } 
    // Go to last step of previous section
    else if (progress.currentSectionIndex > 0) {
      const prevSectionIndex = progress.currentSectionIndex - 1;
      const prevSection = sections[prevSectionIndex];
      const lastStepIndex = prevSection.steps.length - 1;
      const lastStep = prevSection.steps[lastStepIndex];
      
      if (lastStep?.beforeShow) {
        await lastStep.beforeShow();
      }

      setProgress(prev => ({
        ...prev,
        currentSectionIndex: prevSectionIndex,
        currentStepIndex: lastStepIndex,
      }));
      
      onStepChange?.(lastStep, lastStepIndex);
    }
  }, [getCurrentSection, getCurrentStep, progress, sections, onStepChange]);

  // Go to specific step by ID
  const goToStep = useCallback(async (stepId: string) => {
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      const stepIndex = section.steps.findIndex(s => s.id === stepId);
      
      if (stepIndex !== -1) {
        const currentStep = getCurrentStep();
        if (currentStep?.afterHide) {
          await currentStep.afterHide();
        }

        const targetStep = section.steps[stepIndex];
        if (targetStep?.beforeShow) {
          await targetStep.beforeShow();
        }

        setProgress(prev => ({
          ...prev,
          currentSectionIndex: sectionIndex,
          currentStepIndex: stepIndex,
          lastActiveAt: new Date().toISOString(),
        }));
        
        onStepChange?.(targetStep, stepIndex);
        break;
      }
    }
  }, [sections, getCurrentStep, onStepChange]);

  // Go to specific section by ID
  const goToSection = useCallback(async (sectionId: string) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const currentStep = getCurrentStep();
    if (currentStep?.afterHide) {
      await currentStep.afterHide();
    }

    const targetSection = sections[sectionIndex];
    const firstStep = targetSection.steps[0];
    
    if (firstStep?.beforeShow) {
      await firstStep.beforeShow();
    }

    setProgress(prev => ({
      ...prev,
      currentSectionIndex: sectionIndex,
      currentStepIndex: 0,
      lastActiveAt: new Date().toISOString(),
    }));
    
    onStepChange?.(firstStep, 0);
  }, [sections, getCurrentStep, onStepChange]);

  // Skip current step
  const skipStep = useCallback(() => {
    const currentStep = getCurrentStep();
    if (currentStep) {
      setProgress(prev => ({
        ...prev,
        skippedSteps: Array.from(new Set([...prev.skippedSteps, currentStep.id])),
      }));
    }
    nextStep();
  }, [getCurrentStep, nextStep]);

  // Complete a specific step manually
  const completeStep = useCallback((stepId: string) => {
    setProgress(prev => ({
      ...prev,
      completedSteps: Array.from(new Set([...prev.completedSteps, stepId])),
    }));
  }, []);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_TOUR_PROGRESS);
    setIsCompleted(false);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      log.error('Error resetting tour progress:', error);
    }
  }, [storageKey]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TourSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive || !settings.enableKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStep();
          break;
        case 'Escape':
          e.preventDefault();
          endTour();
          break;
        case ' ':
          e.preventDefault();
          if (isPaused) {
            resumeTour();
          } else {
            pauseTour();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPaused, settings.enableKeyboardNavigation, nextStep, prevStep, endTour, pauseTour, resumeTour]);

  // Compute tour stats from sections
  const tourStats = {
    totalSections: sections.length,
    totalSteps: getTotalSteps(),
    totalEstimatedTime: sections.reduce((total, section) => total + (section.estimatedTime ?? section.estimatedMinutes ?? 0), 0),
    globalStepIndex: getGlobalStepIndex(),
  };

  // Context value
  const contextValue: TourContextType = {
    isActive,
    isPaused,
    isCompleted,
    sections,
    progress,
    settings,
    tourStats,
    startTour,
    pauseTour,
    resumeTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    goToSection,
    skipStep,
    completeStep,
    resetProgress,
    updateSettings,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
};

/**
 * Custom hook to use tour context
 */
export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

/**
 * Custom hook to get current step info
 */
export const useTourStep = () => {
  const { sections, progress, isActive } = useTour();
  
  const currentSection = sections[progress.currentSectionIndex] || null;
  const currentStep = currentSection?.steps[progress.currentStepIndex] || null;
  
  const totalSteps = sections.reduce((total, section) => total + section.steps.length, 0);
  
  let globalStepIndex = 0;
  for (let i = 0; i < progress.currentSectionIndex; i++) {
    globalStepIndex += sections[i].steps.length;
  }
  globalStepIndex += progress.currentStepIndex;

  const isFirstStep = progress.currentSectionIndex === 0 && progress.currentStepIndex === 0;
  const isLastStep = progress.currentSectionIndex === sections.length - 1 && 
                     progress.currentStepIndex === (currentSection?.steps.length || 1) - 1;

  return {
    currentSection,
    currentStep,
    globalStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    isActive,
  };
};

/**
 * Custom hook to get tour progress statistics
 */
export const useTourProgress = () => {
  const { sections, progress, isCompleted } = useTour();
  
  const totalSteps = sections.reduce((total, section) => total + section.steps.length, 0);
  const completedCount = progress.completedSteps.length;
  const skippedCount = progress.skippedSteps.length;
  const remainingCount = totalSteps - completedCount - skippedCount;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);
  
  const estimatedTotalTime = sections.reduce((total, section) => total + (section.estimatedTime ?? 0), 0);
  const timeSpentMinutes = Math.round(progress.totalTimeSpent / 60);

  return {
    totalSteps,
    completedCount,
    skippedCount,
    remainingCount,
    progressPercentage,
    estimatedTotalTime,
    timeSpentMinutes,
    isCompleted,
  };
};

export { TourContext };
