/**
 * Extractor Components - Barrel Export
 * 
 * Data Extraction Pro with:
 * - Schema Builder for defining extraction schemas
 * - Visual Selector for point-and-click element selection
 * - Preview Panel for real-time extraction preview
 * - Export Dialog for multi-format exports
 * - AI Auto Detector for intelligent field detection
 * - Multi-Page Extractor for pagination handling
 * - Self-Healing Selectors for resilient extraction
 * - Extraction Templates for reusable patterns
 * - Captcha Handler for automated bypass
 */

export { SchemaBuilder } from './SchemaBuilder';
export { VisualSelector } from './VisualSelector';
export { PreviewPanel } from './PreviewPanel';
export { ExportDialog } from './ExportDialog';

// Data Extraction Pro Components
export { AIAutoDetector } from './AIAutoDetector';
export { MultiPageExtractor } from './MultiPageExtractor';
export { SelfHealingSelectors } from './SelfHealingSelectors';
export { ExtractionTemplates } from './ExtractionTemplates';
export { CaptchaHandler } from './CaptchaHandler';

// Research Services - Backend Integration (used by Intelligence/Research features)
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
