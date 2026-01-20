/**
 * Research Components
 * CUBE Elite v6 - Intelligence Center
 */

export { IntelligenceCenter } from './IntelligenceCenter';

// Research Services - Backend Integration
export {
  ResearchService,
  ProjectService,
  SourceService,
  CompetitorService,
  ReportService,
  TrendsService,
  ResearchAnalyticsService,
} from '@/lib/services/research-service';

// Research Types
export type {
  ResearchProject,
  ResearchSource,
  Competitor,
  ResearchReport,
  MarketTrend,
  ResearchStats,
} from '@/lib/services/research-service';
