// Marketing Components Export
export { default as MarketingDashboard } from './MarketingDashboard';
export { EmailCampaigns } from './EmailCampaigns';
export { FunnelBuilder } from './FunnelBuilder';
export { MarketingTour } from './MarketingTour';
export { default as MarketingHub } from './MarketingHub';

// Re-export Marketing Service for convenience
export {
  MarketingService,
  CampaignService,
  FunnelService,
  LeadService,
  TemplateService,
  SegmentService,
  MarketingAnalyticsService,
} from '@/lib/services/marketing-service';

export type {
  Campaign,
  CampaignType,
  CampaignStatus,
  CampaignMetrics,
  MarketingFunnel,
  FunnelStage,
  Lead,
  LeadSource,
  LeadStage,
  EmailTemplate,
  TemplateType,
  Segment,
  MarketingAnalytics,
  MarketingStats,
  MarketingNotification,
} from '@/lib/services/marketing-service';
