/**
 * Email Marketing Tour - All Steps Index
 * Combina todas las secciones del tour
 */

// Import all sections
export { welcomeSection, settingsSection } from './welcomeSettingsSteps';
export { contactsSection } from './contactSteps';
export { campaignsSection } from './campaignSteps';
export { analyticsSection, advancedTipsSection } from './analyticsSteps';

// Import steps arrays
import { welcomeSection, settingsSection } from './welcomeSettingsSteps';
import { contactsSection } from './contactSteps';
import { campaignsSection } from './campaignSteps';
import { analyticsSection, advancedTipsSection } from './analyticsSteps';

import { TourSection, TourStep } from '../types';

// ============================================================================
// COMBINED TOUR DATA
// ============================================================================

/**
 * All tour sections in order
 */
export const allTourSections: TourSection[] = [
  welcomeSection,
  settingsSection,
  contactsSection,
  campaignsSection,
  analyticsSection,
  advancedTipsSection
];

/**
 * All tour steps in order (flattened)
 */
export const allTourSteps: TourStep[] = allTourSections.flatMap(section => section.steps);

/**
 * Total number of steps
 */
export const totalSteps: number = allTourSteps.length;

/**
 * Total estimated time in minutes
 */
export const totalEstimatedTime: number = allTourSections.reduce(
  (total, section) => total + (section.estimatedTime ?? 0),
  0
);

/**
 * Get section by ID
 */
export const getSectionById = (id: string): TourSection | undefined => {
  return allTourSections.find(section => section.id === id);
};

/**
 * Get step by ID
 */
export const getStepById = (id: string): TourStep | undefined => {
  return allTourSteps.find(step => step.id === id);
};

/**
 * Get step index by ID
 */
export const getStepIndex = (id: string): number => {
  return allTourSteps.findIndex(step => step.id === id);
};

/**
 * Get section for a step
 */
export const getSectionForStep = (stepId: string): TourSection | undefined => {
  return allTourSections.find(section => 
    section.steps.some(step => step.id === stepId)
  );
};

/**
 * Get steps by category
 */
export const getStepsByCategory = (category: string): TourStep[] => {
  return allTourSteps.filter(step => step.category === category);
};

/**
 * Get sections by difficulty
 */
export const getSectionsByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): TourSection[] => {
  return allTourSections.filter(section => section.difficulty === difficulty);
};

/**
 * Tour statistics
 */
export const tourStats = {
  totalSections: allTourSections.length,
  totalSteps: allTourSteps.length,
  totalEstimatedTime: totalEstimatedTime,
  byDifficulty: {
    beginner: getSectionsByDifficulty('beginner').length,
    intermediate: getSectionsByDifficulty('intermediate').length,
    advanced: getSectionsByDifficulty('advanced').length
  },
  sections: allTourSections.map(s => ({
    id: s.id,
    title: s.title,
    steps: s.steps.length,
    time: s.estimatedTime,
    difficulty: s.difficulty
  }))
};

// Debug log (remove in production)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[Tour] Stats:', tourStats);
}
