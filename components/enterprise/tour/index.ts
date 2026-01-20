/**
 * Contact Management Tour Index
 * 
 * Exports tour configuration for the Contact/Email Management module
 */

export {
  // Individual step collections
  welcomeSteps,
  contactListSteps,
  managementSteps,
  listsSegmentsSteps,
  importExportSteps,
  
  // Combined exports
  allContactTourSteps,
  allContactTourSections,
  
  // Statistics
  contactTourStats,
} from './contactTourSteps';

// Tour ID for integration
export const CONTACT_TOUR_ID = 'contact-management-tour';

// Tour metadata
export const contactTourMeta = {
  id: CONTACT_TOUR_ID,
  name: 'Contact Management Tour',
  description: 'Master contact organization with lists, segments, import/export, and engagement tracking',
  version: '1.0.0',
  category: 'marketing',
  icon: '📧',
  estimatedMinutes: 25,
  difficulty: 'beginner' as const,
  prerequisites: [],
  features: [
    'Contact database',
    'Search and filtering',
    'Bulk operations',
    'Tags and organization',
    'List management',
    'Smart segments',
    'Import/Export',
  ],
};
