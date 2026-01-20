/**
 * Social Command Center Tour Index
 * 
 * Exports tour configuration for the Social Media Management module
 */

export {
  // Individual step collections
  welcomeSteps,
  accountSteps,
  contentCreationSteps,
  videoEditorSteps,
  schedulingAnalyticsSteps,
  aiTrendsSteps,
  
  // Combined exports
  allSocialTourSteps,
  allSocialTourSections,
  
  // Statistics
  socialTourStats,
} from './socialTourSteps';

// Tour ID for integration
export const SOCIAL_TOUR_ID = 'social-command-center-tour';

// Tour metadata
export const socialTourMeta = {
  id: SOCIAL_TOUR_ID,
  name: 'Social Command Center Tour',
  description: 'Master social media management with multi-platform posting, AI content creation, and analytics',
  version: '1.0.0',
  category: 'marketing',
  icon: '📱',
  estimatedMinutes: 35,
  difficulty: 'beginner' as const,
  prerequisites: [],
  features: [
    'Social account management',
    'Content creation tools',
    'Video editing studio',
    'Content scheduling',
    'Analytics dashboard',
    'AI-powered features',
    'Trend monitoring',
  ],
};
