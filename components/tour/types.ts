/**
 * Email Marketing Tour Types
 * Sistema de tour interactivo para el módulo de Email Campaigns
 */

// Tour step positions relative to target element
export type TourStepPosition = 
  | 'top' 
  | 'top-start' 
  | 'top-end' 
  | 'bottom' 
  | 'bottom-start' 
  | 'bottom-end' 
  | 'left' 
  | 'left-start' 
  | 'left-end' 
  | 'right' 
  | 'right-start' 
  | 'right-end' 
  | 'center';

// Tour step highlight type
export type HighlightType = 
  | 'border' 
  | 'spotlight' 
  | 'pulse' 
  | 'glow' 
  | 'box'
  | 'none';

// Categories for organizing tour steps
export type TourCategory = 
  | 'welcome'
  | 'settings'
  | 'contacts'
  | 'campaigns'
  | 'analytics'
  | 'advanced'
  | 'tips'
  // Automation module categories
  | 'palette'
  | 'building'
  | 'toolbar'
  | 'execution'
  // Extractor module categories
  | 'schema'
  | 'selector'
  | 'preview'
  | 'export'
  // Password module categories
  | 'organization'
  | 'management'
  | 'security'
  | 'autofill'
  | 'premium'
  // Video module categories
  | 'participants'
  | 'controls'
  | 'recording'
  | 'complete'
  // VoIP module categories
  | 'calls'
  | 'history'
  // FTP module categories
  | 'connection'
  | 'browser'
  | 'transfers'
  | 'server'
  // Notes module categories
  | 'sidebar'
  | 'editor'
  | 'kanban'
  | 'views'
  | 'stats'
  // Download module categories
  | 'add'
  | 'list'
  | 'queue'
  | 'filter'
  // Collections & Reading List categories
  | 'card'
  | 'pages'
  | 'sharing'
  | 'items'
  | 'tags'
  // Monitoring & Dashboard categories
  | 'dashboard'
  | 'executions'
  | 'logs'
  | 'alerts'
  // Chat categories
  | 'messages'
  | 'rooms'
  | 'typing'
  // Workflow categories
  | 'canvas'
  | 'nodes'
  | 'connections'
  | 'config'
  | 'save'
  // Admin categories
  | 'users'
  | 'licenses'
  | 'api'
  | 'sales'
  | 'downloads'
  | 'metrics'
  // Media player categories
  | 'video'
  | 'audio'
  | 'playlist'
  | 'equalizer'
  | 'shortcuts'
  // Collections extended categories
  | 'create'
  | 'cards'
  // Reading list extended categories
  | 'actions'
  // Settings extended categories
  | 'account'
  | 'email'
  | 'updates'
  | 'cloud'
  // Monitoring extended categories
  | 'website'
  // Chat extended categories
  | 'ai';

// Tour step action types
export type TourActionType = 
  | 'click'
  | 'input'
  | 'select'
  | 'scroll'
  | 'navigate'
  | 'wait'
  | 'none';

// Single tour step definition
export interface TourStep {
  id: string;
  title: string;
  content: string;
  category: TourCategory;
  targetSelector?: string;
  /** Alternative alias for targetSelector using data-tour attribute selector */
  target?: string;
  position: TourStepPosition;
  /** Alternative alias for position */
  placement?: TourStepPosition;
  highlightType?: HighlightType;
  /** Section identifier for grouping steps */
  section?: string;
  /** Mark step as required for tour completion */
  isRequired?: boolean;
  /** Show progress indicator during step */
  showProgress?: boolean;
  /** Highlight clicks during step */
  highlightClicks?: boolean;
  action?: {
    type: TourActionType;
    label?: string;
    handler?: () => void | Promise<void>;
  };
  tips?: string[];
  competitiveAdvantage?: string;
  /** AI prompt that users can say to trigger this feature via AI assistant */
  aiPrompt?: string;
  videoUrl?: string;
  imageUrl?: string;
  isOptional?: boolean;
  skipCondition?: () => boolean;
  beforeShow?: () => void | Promise<void>;
  afterHide?: () => void | Promise<void>;
  waitForElement?: boolean;
  delay?: number;
}

// Tour section grouping multiple steps
export interface TourSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category?: TourCategory;
  steps: TourStep[];
  estimatedTime?: number; // in minutes (alias for legacy)
  estimatedMinutes?: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Tour progress state
export interface TourProgress {
  currentStepIndex: number;
  currentSectionIndex: number;
  completedSteps: string[];
  completedSections: string[];
  skippedSteps: string[];
  startedAt: string;
  lastActiveAt: string;
  totalTimeSpent: number; // in seconds
}

// Tour settings
export interface TourSettings {
  autoAdvance: boolean;
  showProgress: boolean;
  showTips: boolean;
  showCompetitiveAdvantages: boolean;
  playbackSpeed: 'slow' | 'normal' | 'fast';
  highlightIntensity: 'subtle' | 'normal' | 'prominent';
  enableKeyboardNavigation: boolean;
  enableSoundEffects: boolean;
  language: 'en' | 'es' | 'pt' | 'fr' | 'de';
}

// Tour context state
export interface TourState {
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  sections: TourSection[];
  progress: TourProgress;
  settings: TourSettings;
  tourStats?: {
    totalSections: number;
    totalSteps: number;
    totalEstimatedTime: number;
    globalStepIndex: number;
  };
}

// Tour context actions
export interface TourActions {
  startTour: (sectionId?: string) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepId: string) => void;
  goToSection: (sectionId: string) => void;
  skipStep: () => void;
  completeStep: (stepId: string) => void;
  resetProgress: () => void;
  updateSettings: (settings: Partial<TourSettings>) => void;
}

// Full tour context type
export interface TourContextType extends TourState, TourActions {}

// Tour tooltip props
export interface TourTooltipProps {
  step: TourStep;
  position: { top: number; left: number };
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  currentIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  settings: TourSettings;
}

// Tour overlay props
export interface TourOverlayProps {
  isActive: boolean;
  targetRect?: DOMRect | null;
  highlightType: HighlightType;
  highlightIntensity: TourSettings['highlightIntensity'];
}

// Tour welcome modal props
export interface TourWelcomeModalProps {
  isOpen: boolean;
  onStart: (sectionId?: string) => void;
  onClose: () => void;
  sections: TourSection[];
  progress: TourProgress;
}

// Tour completion modal props
export interface TourCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  progress: TourProgress;
  sections: TourSection[];
}

// Storage key functions for persisting tour progress
export const getTourStorageKey = (tourId?: string): string => 
  tourId ? `cube_${tourId}_tour_progress` : 'cube_tour_progress';
export const getTourSettingsKey = (tourId?: string): string => 
  tourId ? `cube_${tourId}_tour_settings` : 'cube_tour_settings';

// Legacy keys (for backwards compatibility)
export const TOUR_STORAGE_KEY = 'cube_email_tour_progress';
export const TOUR_SETTINGS_KEY = 'cube_email_tour_settings';

// Default tour settings
export const DEFAULT_TOUR_SETTINGS: TourSettings = {
  autoAdvance: false,
  showProgress: true,
  showTips: true,
  showCompetitiveAdvantages: true,
  playbackSpeed: 'normal',
  highlightIntensity: 'normal',
  enableKeyboardNavigation: true,
  enableSoundEffects: false,
  language: 'es',
};

// Default tour progress
export const DEFAULT_TOUR_PROGRESS: TourProgress = {
  currentStepIndex: 0,
  currentSectionIndex: 0,
  completedSteps: [],
  completedSections: [],
  skippedSteps: [],
  startedAt: '',
  lastActiveAt: '',
  totalTimeSpent: 0,
};
