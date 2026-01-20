/**
 * CUBE Nexum - Onboarding Service
 * 
 * Interactive onboarding experience:
 * - Multi-step wizard
 * - Progress tracking
 * - Feature tours
 * - Personalization
 * - First-time user detection
 * - Full i18n support
 */

import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type OnboardingStepId =
  | 'welcome'
  | 'profile'
  | 'use-case'
  | 'features'
  | 'browser-setup'
  | 'extension'
  | 'security'
  | 'notifications'
  | 'tour'
  | 'complete';

export type UseCase =
  | 'personal'
  | 'business'
  | 'developer'
  | 'data-analyst'
  | 'marketing'
  | 'research';

// Translation function type for i18n integration
export type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

// Internal step structure with translation keys
export interface OnboardingStep {
  id: OnboardingStepId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  required: boolean;
  order: number;
  component?: string;
}

// Translated step for component consumption
export interface TranslatedOnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  order: number;
  component?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  company?: string;
  role?: string;
}

export interface OnboardingPreferences {
  useCase: UseCase;
  features: string[];
  importFrom?: string;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  enableAI: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface OnboardingProgress {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  startedAt: number;
  completedAt?: number;
  profile?: UserProfile;
  preferences?: OnboardingPreferences;
  skipped: boolean;
}

// Internal tour structure with translation keys
export interface FeatureTourStep {
  id: string;
  target: string;
  titleKey: string;
  descriptionKey: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'input' | 'observe';
  highlight?: boolean;
}

export interface FeatureTour {
  id: string;
  nameKey: string;
  descriptionKey: string;
  steps: FeatureTourStep[];
  targetRoute?: string;
  completed: boolean;
}

// Translated structures for component consumption
export interface TranslatedTourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'input' | 'observe';
  highlight?: boolean;
}

export interface TranslatedFeatureTour {
  id: string;
  name: string;
  description: string;
  steps: TranslatedTourStep[];
  targetRoute?: string;
  completed: boolean;
}

// Internal use case config with translation keys
export interface UseCaseConfig {
  titleKey: string;
  descriptionKey: string;
  icon: string;
  recommendedFeatures: string[];
}

// Translated use case config for component consumption
export interface TranslatedUseCaseConfig {
  title: string;
  description: string;
  icon: string;
  recommendedFeatures: string[];
}

// Legacy types for backward compatibility
export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'input' | 'observe';
  highlight?: boolean;
}

// ============================================================================
// STEP DEFINITIONS (with i18n keys)
// ============================================================================

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    titleKey: 'onboarding.steps.welcome.title',
    descriptionKey: 'onboarding.steps.welcome.description',
    icon: '👋',
    required: true,
    order: 1,
  },
  {
    id: 'profile',
    titleKey: 'onboarding.steps.profile.title',
    descriptionKey: 'onboarding.steps.profile.description',
    icon: '👤',
    required: true,
    order: 2,
  },
  {
    id: 'use-case',
    titleKey: 'onboarding.steps.useCase.title',
    descriptionKey: 'onboarding.steps.useCase.description',
    icon: '🎯',
    required: true,
    order: 3,
  },
  {
    id: 'features',
    titleKey: 'onboarding.steps.features.title',
    descriptionKey: 'onboarding.steps.features.description',
    icon: '✨',
    required: true,
    order: 4,
  },
  {
    id: 'browser-setup',
    titleKey: 'onboarding.steps.browserSetup.title',
    descriptionKey: 'onboarding.steps.browserSetup.description',
    icon: '🌐',
    required: false,
    order: 5,
  },
  {
    id: 'extension',
    titleKey: 'onboarding.steps.extension.title',
    descriptionKey: 'onboarding.steps.extension.description',
    icon: '🧩',
    required: false,
    order: 6,
  },
  {
    id: 'security',
    titleKey: 'onboarding.steps.security.title',
    descriptionKey: 'onboarding.steps.security.description',
    icon: '🔐',
    required: true,
    order: 7,
  },
  {
    id: 'notifications',
    titleKey: 'onboarding.steps.notifications.title',
    descriptionKey: 'onboarding.steps.notifications.description',
    icon: '🔔',
    required: false,
    order: 8,
  },
  {
    id: 'tour',
    titleKey: 'onboarding.steps.tour.title',
    descriptionKey: 'onboarding.steps.tour.description',
    icon: '🗺️',
    required: false,
    order: 9,
  },
  {
    id: 'complete',
    titleKey: 'onboarding.steps.complete.title',
    descriptionKey: 'onboarding.steps.complete.description',
    icon: '🚀',
    required: true,
    order: 10,
  },
];

// ============================================================================
// USE CASE CONFIGS (with i18n keys)
// ============================================================================

export const USE_CASE_CONFIG: Record<UseCase, UseCaseConfig> = {
  personal: {
    titleKey: 'onboarding.useCases.personal.title',
    descriptionKey: 'onboarding.useCases.personal.description',
    icon: '🏠',
    recommendedFeatures: ['autofill', 'passwords', 'automation'],
  },
  business: {
    titleKey: 'onboarding.useCases.business.title',
    descriptionKey: 'onboarding.useCases.business.description',
    icon: '💼',
    recommendedFeatures: ['autofill', 'passwords', 'automation', 'crm', 'team'],
  },
  developer: {
    titleKey: 'onboarding.useCases.developer.title',
    descriptionKey: 'onboarding.useCases.developer.description',
    icon: '💻',
    recommendedFeatures: ['automation', 'api', 'scraping', 'terminal'],
  },
  'data-analyst': {
    titleKey: 'onboarding.useCases.dataAnalyst.title',
    descriptionKey: 'onboarding.useCases.dataAnalyst.description',
    icon: '📊',
    recommendedFeatures: ['scraping', 'extraction', 'automation', 'exports'],
  },
  marketing: {
    titleKey: 'onboarding.useCases.marketing.title',
    descriptionKey: 'onboarding.useCases.marketing.description',
    icon: '📈',
    recommendedFeatures: ['automation', 'social', 'crm', 'analytics'],
  },
  research: {
    titleKey: 'onboarding.useCases.research.title',
    descriptionKey: 'onboarding.useCases.research.description',
    icon: '🔬',
    recommendedFeatures: ['scraping', 'extraction', 'archive', 'ai'],
  },
};

// ============================================================================
// FEATURE TOURS (with i18n keys)
// ============================================================================

export const FEATURE_TOURS: FeatureTour[] = [
  {
    id: 'autofill-basics',
    nameKey: 'onboarding.featureTours.autofillBasics.name',
    descriptionKey: 'onboarding.featureTours.autofillBasics.description',
    targetRoute: '/autofill',
    completed: false,
    steps: [
      {
        id: 'autofill-1',
        target: '[data-tour="new-profile-btn"]',
        titleKey: 'onboarding.featureTours.autofillBasics.steps.createProfile.title',
        descriptionKey: 'onboarding.featureTours.autofillBasics.steps.createProfile.description',
        placement: 'bottom',
        action: 'click',
        highlight: true,
      },
      {
        id: 'autofill-2',
        target: '[data-tour="profile-form"]',
        titleKey: 'onboarding.featureTours.autofillBasics.steps.fillDetails.title',
        descriptionKey: 'onboarding.featureTours.autofillBasics.steps.fillDetails.description',
        placement: 'right',
        action: 'input',
      },
      {
        id: 'autofill-3',
        target: '[data-tour="save-profile-btn"]',
        titleKey: 'onboarding.featureTours.autofillBasics.steps.saveProfile.title',
        descriptionKey: 'onboarding.featureTours.autofillBasics.steps.saveProfile.description',
        placement: 'top',
        action: 'click',
      },
    ],
  },
  {
    id: 'automation-basics',
    nameKey: 'onboarding.featureTours.automationBasics.name',
    descriptionKey: 'onboarding.featureTours.automationBasics.description',
    targetRoute: '/automation',
    completed: false,
    steps: [
      {
        id: 'auto-1',
        target: '[data-tour="new-workflow-btn"]',
        titleKey: 'onboarding.featureTours.automationBasics.steps.createWorkflow.title',
        descriptionKey: 'onboarding.featureTours.automationBasics.steps.createWorkflow.description',
        placement: 'bottom',
        action: 'click',
        highlight: true,
      },
      {
        id: 'auto-2',
        target: '[data-tour="node-palette"]',
        titleKey: 'onboarding.featureTours.automationBasics.steps.addNodes.title',
        descriptionKey: 'onboarding.featureTours.automationBasics.steps.addNodes.description',
        placement: 'right',
        action: 'observe',
      },
      {
        id: 'auto-3',
        target: '[data-tour="canvas"]',
        titleKey: 'onboarding.featureTours.automationBasics.steps.connectNodes.title',
        descriptionKey: 'onboarding.featureTours.automationBasics.steps.connectNodes.description',
        placement: 'left',
        action: 'observe',
      },
      {
        id: 'auto-4',
        target: '[data-tour="run-btn"]',
        titleKey: 'onboarding.featureTours.automationBasics.steps.runWorkflow.title',
        descriptionKey: 'onboarding.featureTours.automationBasics.steps.runWorkflow.description',
        placement: 'bottom',
        action: 'click',
      },
    ],
  },
  {
    id: 'password-vault',
    nameKey: 'onboarding.featureTours.passwordVault.name',
    descriptionKey: 'onboarding.featureTours.passwordVault.description',
    targetRoute: '/password-manager',
    completed: false,
    steps: [
      {
        id: 'pwd-1',
        target: '[data-tour="add-credential"]',
        titleKey: 'onboarding.featureTours.passwordVault.steps.addCredential.title',
        descriptionKey: 'onboarding.featureTours.passwordVault.steps.addCredential.description',
        placement: 'bottom',
        action: 'click',
        highlight: true,
      },
      {
        id: 'pwd-2',
        target: '[data-tour="generate-password"]',
        titleKey: 'onboarding.featureTours.passwordVault.steps.generatePassword.title',
        descriptionKey: 'onboarding.featureTours.passwordVault.steps.generatePassword.description',
        placement: 'left',
        action: 'click',
      },
      {
        id: 'pwd-3',
        target: '[data-tour="security-settings"]',
        titleKey: 'onboarding.featureTours.passwordVault.steps.securitySettings.title',
        descriptionKey: 'onboarding.featureTours.passwordVault.steps.securitySettings.description',
        placement: 'top',
        action: 'observe',
      },
    ],
  },
  {
    id: 'ai-assistant',
    nameKey: 'onboarding.featureTours.aiAssistant.name',
    descriptionKey: 'onboarding.featureTours.aiAssistant.description',
    targetRoute: '/ai',
    completed: false,
    steps: [
      {
        id: 'ai-1',
        target: '[data-tour="ai-input"]',
        titleKey: 'onboarding.featureTours.aiAssistant.steps.askAI.title',
        descriptionKey: 'onboarding.featureTours.aiAssistant.steps.askAI.description',
        placement: 'bottom',
        action: 'input',
        highlight: true,
      },
      {
        id: 'ai-2',
        target: '[data-tour="ai-suggestions"]',
        titleKey: 'onboarding.featureTours.aiAssistant.steps.suggestions.title',
        descriptionKey: 'onboarding.featureTours.aiAssistant.steps.suggestions.description',
        placement: 'right',
        action: 'observe',
      },
      {
        id: 'ai-3',
        target: '[data-tour="ai-apply"]',
        titleKey: 'onboarding.featureTours.aiAssistant.steps.apply.title',
        descriptionKey: 'onboarding.featureTours.aiAssistant.steps.apply.description',
        placement: 'top',
        action: 'click',
      },
    ],
  },
];

// ============================================================================
// TRANSLATION HELPERS
// ============================================================================

/**
 * Get translated onboarding steps
 * @param t - Translation function from useI18n or useTranslations
 */
export function getTranslatedSteps(t: TranslationFn): TranslatedOnboardingStep[] {
  return ONBOARDING_STEPS.map(step => ({
    id: step.id,
    title: t(step.titleKey),
    description: t(step.descriptionKey),
    icon: step.icon,
    required: step.required,
    order: step.order,
    component: step.component,
  }));
}

/**
 * Get translated use case configs
 * @param t - Translation function from useI18n or useTranslations
 */
export function getTranslatedUseCases(t: TranslationFn): Record<UseCase, TranslatedUseCaseConfig> {
  const result: Record<string, TranslatedUseCaseConfig> = {};
  for (const [key, config] of Object.entries(USE_CASE_CONFIG)) {
    result[key] = {
      title: t(config.titleKey),
      description: t(config.descriptionKey),
      icon: config.icon,
      recommendedFeatures: config.recommendedFeatures,
    };
  }
  return result as Record<UseCase, TranslatedUseCaseConfig>;
}

/**
 * Get translated feature tours
 * @param t - Translation function from useI18n or useTranslations
 */
export function getTranslatedTours(t: TranslationFn): TranslatedFeatureTour[] {
  return FEATURE_TOURS.map(tour => ({
    id: tour.id,
    name: t(tour.nameKey),
    description: t(tour.descriptionKey),
    targetRoute: tour.targetRoute,
    completed: tour.completed,
    steps: tour.steps.map(step => ({
      id: step.id,
      target: step.target,
      title: t(step.titleKey),
      description: t(step.descriptionKey),
      placement: step.placement,
      action: step.action,
      highlight: step.highlight,
    })),
  }));
}

/**
 * Get a single translated step by ID
 * @param stepId - The step ID to translate
 * @param t - Translation function from useI18n or useTranslations
 */
export function getTranslatedStep(stepId: OnboardingStepId, t: TranslationFn): TranslatedOnboardingStep | null {
  const step = ONBOARDING_STEPS.find(s => s.id === stepId);
  if (!step) return null;
  return {
    id: step.id,
    title: t(step.titleKey),
    description: t(step.descriptionKey),
    icon: step.icon,
    required: step.required,
    order: step.order,
    component: step.component,
  };
}

/**
 * Get a single translated tour by ID
 * @param tourId - The tour ID to translate
 * @param t - Translation function from useI18n or useTranslations
 */
export function getTranslatedTour(tourId: string, t: TranslationFn): TranslatedFeatureTour | null {
  const tour = FEATURE_TOURS.find(tour => tour.id === tourId);
  if (!tour) return null;
  return {
    id: tour.id,
    name: t(tour.nameKey),
    description: t(tour.descriptionKey),
    targetRoute: tour.targetRoute,
    completed: tour.completed,
    steps: tour.steps.map(step => ({
      id: step.id,
      target: step.target,
      title: t(step.titleKey),
      description: t(step.descriptionKey),
      placement: step.placement,
      action: step.action,
      highlight: step.highlight,
    })),
  };
}

// ============================================================================
// ONBOARDING SERVICE
// ============================================================================

class OnboardingServiceClass {
  private progress: OnboardingProgress | null = null;
  private listeners: Set<(progress: OnboardingProgress | null) => void> = new Set();

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  async init(): Promise<void> {
    await this.loadProgress();
  }

  async loadProgress(): Promise<OnboardingProgress | null> {
    try {
      this.progress = await invoke<OnboardingProgress>('onboarding_get_progress');
      this.notifyListeners();
      return this.progress;
    } catch {
      // Check localStorage (browser only)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cube_onboarding_progress');
        if (stored) {
          this.progress = JSON.parse(stored);
          this.notifyListeners();
          return this.progress;
        }
      }
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Progress Management
  // -------------------------------------------------------------------------

  async startOnboarding(): Promise<OnboardingProgress> {
    this.progress = {
      currentStep: 'welcome',
      completedSteps: [],
      startedAt: Date.now(),
      skipped: false,
    };
    await this.saveProgress();
    return this.progress;
  }

  async completeStep(stepId: OnboardingStepId, data?: Record<string, unknown>): Promise<void> {
    if (!this.progress) return;

    if (!this.progress.completedSteps.includes(stepId)) {
      this.progress.completedSteps.push(stepId);
    }

    // Handle step-specific data
    if (stepId === 'profile' && data) {
      this.progress.profile = data as unknown as UserProfile;
    }
    if (stepId === 'use-case' && data) {
      this.progress.preferences = {
        ...this.progress.preferences,
        useCase: data.useCase as UseCase,
      } as OnboardingPreferences;
    }
    if (stepId === 'features' && data) {
      this.progress.preferences = {
        ...this.progress.preferences,
        features: data.features as string[],
      } as OnboardingPreferences;
    }

    // Move to next step
    const nextStep = this.getNextStep(stepId);
    if (nextStep) {
      this.progress.currentStep = nextStep.id;
    }

    if (stepId === 'complete') {
      this.progress.completedAt = Date.now();
    }

    await this.saveProgress();
  }

  async skipStep(stepId: OnboardingStepId): Promise<void> {
    if (!this.progress) return;

    const step = ONBOARDING_STEPS.find(s => s.id === stepId);
    if (step?.required) {
      throw new Error('Cannot skip required step');
    }

    const nextStep = this.getNextStep(stepId);
    if (nextStep) {
      this.progress.currentStep = nextStep.id;
    }

    await this.saveProgress();
  }

  async skipOnboarding(): Promise<void> {
    if (!this.progress) {
      await this.startOnboarding();
    }
    this.progress!.skipped = true;
    this.progress!.completedAt = Date.now();
    await this.saveProgress();
  }

  async resetOnboarding(): Promise<void> {
    this.progress = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cube_onboarding_progress');
    }
    try {
      await invoke('onboarding_reset');
    } catch {
      // Ignore backend errors
    }
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Step Navigation
  // -------------------------------------------------------------------------

  getNextStep(currentId: OnboardingStepId): OnboardingStep | null {
    const currentStep = ONBOARDING_STEPS.find(s => s.id === currentId);
    if (!currentStep) return null;

    const nextSteps = ONBOARDING_STEPS
      .filter(s => s.order > currentStep.order)
      .sort((a, b) => a.order - b.order);

    return nextSteps[0] || null;
  }

  getPreviousStep(currentId: OnboardingStepId): OnboardingStep | null {
    const currentStep = ONBOARDING_STEPS.find(s => s.id === currentId);
    if (!currentStep) return null;

    const prevSteps = ONBOARDING_STEPS
      .filter(s => s.order < currentStep.order)
      .sort((a, b) => b.order - a.order);

    return prevSteps[0] || null;
  }

  getCurrentStep(): OnboardingStep | null {
    if (!this.progress) return null;
    return ONBOARDING_STEPS.find(s => s.id === this.progress!.currentStep) || null;
  }

  getCompletionPercentage(): number {
    if (!this.progress) return 0;
    const totalRequired = ONBOARDING_STEPS.filter(s => s.required).length;
    const completedRequired = this.progress.completedSteps.filter(id => 
      ONBOARDING_STEPS.find(s => s.id === id)?.required
    ).length;
    return Math.round((completedRequired / totalRequired) * 100);
  }

  // -------------------------------------------------------------------------
  // State Checks
  // -------------------------------------------------------------------------

  isOnboardingComplete(): boolean {
    return this.progress?.completedAt !== undefined;
  }

  isOnboardingSkipped(): boolean {
    return this.progress?.skipped === true;
  }

  needsOnboarding(): boolean {
    return !this.progress || (!this.isOnboardingComplete() && !this.isOnboardingSkipped());
  }

  isFirstTimeUser(): boolean {
    return !this.progress;
  }

  // -------------------------------------------------------------------------
  // Feature Tours
  // -------------------------------------------------------------------------

  async getFeatureTours(): Promise<FeatureTour[]> {
    try {
      return await invoke<FeatureTour[]>('onboarding_get_tours');
    } catch {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cube_feature_tours');
        if (stored) {
          return JSON.parse(stored);
        }
      }
      return FEATURE_TOURS;
    }
  }

  async completeTour(tourId: string): Promise<void> {
    try {
      await invoke('onboarding_complete_tour', { tourId });
    } catch {
      if (typeof window !== 'undefined') {
        const tours = await this.getFeatureTours();
        const updated = tours.map(t => 
          t.id === tourId ? { ...t, completed: true } : t
        );
        localStorage.setItem('cube_feature_tours', JSON.stringify(updated));
      }
    }
  }

  async resetTours(): Promise<void> {
    try {
      await invoke('onboarding_reset_tours');
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cube_feature_tours', JSON.stringify(FEATURE_TOURS));
      }
    }
  }

  // -------------------------------------------------------------------------
  // Personalization
  // -------------------------------------------------------------------------

  getRecommendedFeatures(): string[] {
    if (!this.progress?.preferences?.useCase) return [];
    return USE_CASE_CONFIG[this.progress.preferences.useCase].recommendedFeatures;
  }

  async applyPersonalization(): Promise<void> {
    if (!this.progress?.preferences) return;

    try {
      await invoke('onboarding_apply_personalization', {
        preferences: this.progress.preferences,
      });
    } catch {
      // Store preferences locally (browser only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cube_preferences', JSON.stringify(this.progress.preferences));
      }
    }
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  private async saveProgress(): Promise<void> {
    if (!this.progress) return;

    try {
      await invoke('onboarding_save_progress', { progress: this.progress });
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cube_onboarding_progress', JSON.stringify(this.progress));
      }
    }
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------------------

  subscribe(listener: (progress: OnboardingProgress | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.progress);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.progress));
  }

  getProgress(): OnboardingProgress | null {
    return this.progress;
  }
}

export const OnboardingService = new OnboardingServiceClass();

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    OnboardingService.init().then(() => {
      setLoading(false);
    });
    return OnboardingService.subscribe(setProgress);
  }, []);

  const startOnboarding = useCallback(async () => {
    return OnboardingService.startOnboarding();
  }, []);

  const completeStep = useCallback(async (stepId: OnboardingStepId, data?: Record<string, unknown>) => {
    await OnboardingService.completeStep(stepId, data);
  }, []);

  const skipStep = useCallback(async (stepId: OnboardingStepId) => {
    await OnboardingService.skipStep(stepId);
  }, []);

  const skipOnboarding = useCallback(async () => {
    await OnboardingService.skipOnboarding();
  }, []);

  const resetOnboarding = useCallback(async () => {
    await OnboardingService.resetOnboarding();
  }, []);

  return {
    progress,
    loading,
    currentStep: OnboardingService.getCurrentStep(),
    completionPercentage: OnboardingService.getCompletionPercentage(),
    isComplete: OnboardingService.isOnboardingComplete(),
    needsOnboarding: OnboardingService.needsOnboarding(),
    isFirstTimeUser: OnboardingService.isFirstTimeUser(),
    startOnboarding,
    completeStep,
    skipStep,
    skipOnboarding,
    resetOnboarding,
    getNextStep: OnboardingService.getNextStep.bind(OnboardingService),
    getPreviousStep: OnboardingService.getPreviousStep.bind(OnboardingService),
    recommendedFeatures: OnboardingService.getRecommendedFeatures(),
  };
}

export function useFeatureTours() {
  const [tours, setTours] = useState<FeatureTour[]>([]);
  const [activeTour, setActiveTour] = useState<FeatureTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    OnboardingService.getFeatureTours().then(setTours);
  }, []);

  const startTour = useCallback((tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    if (tour && !tour.completed) {
      setActiveTour(tour);
      setCurrentStepIndex(0);
    }
  }, [tours]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    if (currentStepIndex < activeTour.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTour, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const completeTour = useCallback(async () => {
    if (!activeTour) return;
    await OnboardingService.completeTour(activeTour.id);
    setTours(prev => prev.map(t => 
      t.id === activeTour.id ? { ...t, completed: true } : t
    ));
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, [activeTour]);

  const cancelTour = useCallback(() => {
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, []);

  return {
    tours,
    activeTour,
    currentStep: activeTour?.steps[currentStepIndex] || null,
    currentStepIndex,
    totalSteps: activeTour?.steps.length || 0,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    cancelTour,
  };
}

/**
 * Hook for translated onboarding data
 * Use this hook when you need the onboarding steps with translated text
 * @param t - Translation function from useI18n or useTranslations
 * 
 * @example
 * ```tsx
 * const { t } = useI18n();
 * const { steps, useCases, currentTranslatedStep } = useTranslatedOnboarding(t);
 * ```
 */
export function useTranslatedOnboarding(t: TranslationFn) {
  const onboarding = useOnboarding();
  
  const translatedSteps = getTranslatedSteps(t);
  const translatedUseCases = getTranslatedUseCases(t);
  
  const currentTranslatedStep = onboarding.currentStep 
    ? getTranslatedStep(onboarding.currentStep.id, t)
    : null;

  return {
    ...onboarding,
    steps: translatedSteps,
    useCases: translatedUseCases,
    currentTranslatedStep,
  };
}

/**
 * Hook for translated feature tours
 * Use this hook when you need the feature tours with translated text
 * @param t - Translation function from useI18n or useTranslations
 * 
 * @example
 * ```tsx
 * const { t } = useI18n();
 * const { tours, activeTour, currentStep } = useTranslatedFeatureTours(t);
 * ```
 */
export function useTranslatedFeatureTours(t: TranslationFn) {
  const tourHook = useFeatureTours();
  
  const translatedTours = getTranslatedTours(t);
  
  const translatedActiveTour = tourHook.activeTour 
    ? getTranslatedTour(tourHook.activeTour.id, t)
    : null;

  const translatedCurrentStep = translatedActiveTour?.steps[tourHook.currentStepIndex] || null;

  return {
    ...tourHook,
    tours: translatedTours,
    activeTour: translatedActiveTour,
    currentStep: translatedCurrentStep,
  };
}

export default OnboardingService;
