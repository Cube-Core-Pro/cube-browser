/**
 * CUBE Tour System
 * Complete interactive tour for teaching modules
 * Now supports multiple independent tours via tourId
 */

// Types
export * from './types';

// Context and hooks
export {
  TourProvider,
  useTour,
  useTourStep,
  useTourProgress
} from './TourContext';

// Components
export { TourTooltip, TourOverlay } from './TourTooltip';
export { 
  TourLauncher, 
  TourWelcomeModal, 
  TourCompletionModal,
  type TourFeature,
  type TourNextStep
} from './TourLauncher';

// Steps and sections
export {
  allTourSections,
  allTourSteps,
  totalSteps,
  totalEstimatedTime,
  tourStats,
  getSectionById,
  getStepById,
  getStepIndex,
  getSectionForStep,
  getStepsByCategory,
  getSectionsByDifficulty,
  welcomeSection,
  settingsSection,
  contactsSection,
  campaignsSection,
  analyticsSection,
  advancedTipsSection
} from './steps';

// Styles (import in components that use tour)
import './Tour.css';
