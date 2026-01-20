// CRM Components Export
export { default as CRMDashboard } from './CRMDashboard';
export { default as ContactsManager } from './ContactsManager';
export { default as DealsManager } from './DealsManager';
export { default as PipelineKanban } from './PipelineKanban';
export { default as CompaniesManager } from './CompaniesManager';
export { default as ActivitiesManager } from './ActivitiesManager';
export { CRMTour } from './CRMTour';
export { default as CRMHub } from './CRMHub';

// CRM Elite Components
export { AISalesAssistant } from './AISalesAssistant';
export { EmailWriter } from './EmailWriter';
export { LeadScoring } from './LeadScoring';
export { PipelineView as PipelineComponent } from './Pipeline';
export { default as PipelineDefault } from './Pipeline';

// Re-export CRM Service for convenience
export { 
  CRMService,
  ContactService,
  CompanyService,
  DealService,
  ActivityService,
  PipelineService,
  CRMAnalyticsService,
} from '@/lib/services/crm-service';

export type {
  Contact,
  ContactSource,
  ContactStatus,
  Company,
  CompanySize,
  Deal,
  DealStage,
  Activity,
  ActivityType,
  ActivityStatus,
  Pipeline,
  PipelineStage,
  CRMStats,
  CRMInsights,
  CRMQuickStats,
  CRMNotification,
} from '@/lib/services/crm-service';
