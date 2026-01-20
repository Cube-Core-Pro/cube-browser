/**
 * Browser Elite Tour - Index
 * 
 * Exports all tour components and utilities for the CUBE Nexum module.
 * 
 * @module BrowserTour
 */

export {
  welcomeSteps,
  profilesSpacesSteps,
  tabManagementSteps,
  navigationToolsSteps,
  privacySecuritySteps,
  devToolsSteps,
  allBrowserTourSteps,
  allBrowserTourSections,
  browserTourStats,
} from './browserTourSteps';

// Re-export core tour components for convenience
export { TourProvider, useTour } from '@/components/tour';
export { TourLauncher } from '@/components/tour';
export type { TourStep, TourSection } from '@/components/tour';
