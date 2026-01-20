/**
 * Intelligence Center Tour Index
 * 
 * Exports tour configuration for the OSINT/Research module
 */

export {
  // Individual step collections
  welcomeSteps,
  searchSteps,
  dataSourcesSteps,
  investigationsSteps,
  riskSteps,
  reportsSteps,
  
  // Combined exports
  allIntelligenceTourSteps,
  allIntelligenceTourSections,
  
  // Statistics
  intelligenceTourStats,
} from './intelligenceTourSteps';

// Tour ID for integration
export const INTELLIGENCE_TOUR_ID = 'intelligence-center-tour';

// Tour metadata
export const intelligenceTourMeta = {
  id: INTELLIGENCE_TOUR_ID,
  name: 'Intelligence Center Tour',
  description: 'Master OSINT research with person/company profiling, risk assessment, and AI-powered analysis',
  version: '1.0.0',
  category: 'research',
  icon: '🔍',
  estimatedMinutes: 30,
  difficulty: 'intermediate' as const,
  prerequisites: [],
  features: [
    'Person search',
    'Company research',
    'Multi-source intelligence',
    'Investigation management',
    'Risk assessment',
    'AI analysis',
    'Report generation',
  ],
};
