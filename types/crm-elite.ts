// ============================================================================
// CRM ELITE - Type Definitions
// Advanced CRM features with AI-powered sales assistance
// ============================================================================

// ============================================================================
// AI SALES ASSISTANT TYPES
// ============================================================================

export type AssistantMode = 'chat' | 'analysis' | 'recommendations' | 'coaching';
export type InsightType = 'opportunity' | 'risk' | 'action' | 'trend' | 'milestone';
export type SentimentScore = 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AISalesInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  urgency: UrgencyLevel;
  relatedEntities: {
    type: 'lead' | 'contact' | 'deal' | 'company';
    id: string;
    name: string;
  }[];
  suggestedActions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface ConversationAnalysis {
  id: string;
  conversationType: 'email' | 'call' | 'meeting' | 'chat';
  sentiment: SentimentScore;
  keyTopics: string[];
  actionItems: string[];
  objections: string[];
  buyingSignals: string[];
  nextSteps: string[];
  summary: string;
  analyzedAt: Date;
}

export interface SalesCoaching {
  id: string;
  category: 'objection-handling' | 'closing' | 'discovery' | 'presentation' | 'negotiation';
  tip: string;
  context: string;
  examples: string[];
  relevance: number;
}

export interface AISalesConfig {
  enabled: boolean;
  autoAnalyze: boolean;
  insightFrequency: 'realtime' | 'hourly' | 'daily';
  enableCoaching: boolean;
  personalizedInsights: boolean;
  integrations: {
    email: boolean;
    calendar: boolean;
    calls: boolean;
    documents: boolean;
  };
}

// ============================================================================
// EMAIL WRITER TYPES
// ============================================================================

export type EmailTone = 'professional' | 'friendly' | 'persuasive' | 'formal' | 'casual';
export type EmailType = 'intro' | 'follow-up' | 'proposal' | 'thank-you' | 'meeting-request' | 'custom';
export type EmailLength = 'short' | 'medium' | 'long';

export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailType;
  subject: string;
  body: string;
  variables: string[];
  tone: EmailTone;
  isDefault: boolean;
  usageCount: number;
  successRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailDraft {
  id: string;
  recipient: {
    name: string;
    email: string;
    company?: string;
    role?: string;
  };
  subject: string;
  body: string;
  tone: EmailTone;
  type: EmailType;
  variables: Record<string, string>;
  aiSuggestions: {
    subjectAlternatives: string[];
    toneAdjustments: string[];
    callToAction: string[];
  };
  readabilityScore: number;
  sentimentScore: SentimentScore;
  createdAt: Date;
}

export interface EmailWriterConfig {
  defaultTone: EmailTone;
  defaultLength: EmailLength;
  includeSignature: boolean;
  signature: string;
  useCompanyBranding: boolean;
  enableAISuggestions: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  followUpReminders: boolean;
  reminderDays: number;
}

// ============================================================================
// LEAD SCORING TYPES
// ============================================================================

export type ScoreCategory = 'demographic' | 'behavioral' | 'engagement' | 'firmographic';
export type ScoreTrend = 'rising' | 'stable' | 'falling';

export interface ScoringRule {
  id: string;
  name: string;
  category: ScoreCategory;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'exists';
    value: string | number | boolean | [number, number];
  };
  points: number;
  isActive: boolean;
  description: string;
}

export interface LeadScore {
  id: string;
  leadId: string;
  totalScore: number;
  maxPossibleScore: number;
  percentile: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend: ScoreTrend;
  breakdown: {
    category: ScoreCategory;
    score: number;
    maxScore: number;
    rules: {
      ruleId: string;
      ruleName: string;
      points: number;
      triggered: boolean;
    }[];
  }[];
  lastUpdated: Date;
  history: {
    date: Date;
    score: number;
    change: number;
    reason: string;
  }[];
}

export interface ScoringModel {
  id: string;
  name: string;
  description: string;
  rules: ScoringRule[];
  weights: Record<ScoreCategory, number>;
  thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadScoringConfig {
  enabled: boolean;
  activeModelId: string;
  autoRefresh: boolean;
  refreshInterval: 'hourly' | 'daily' | 'weekly';
  notifyOnHotLead: boolean;
  notifyThreshold: number;
  includeHistoricalData: boolean;
  decayEnabled: boolean;
  decayRate: number;
  decayPeriod: number;
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export type PipelineType = 'sales' | 'support' | 'recruitment' | 'custom';
export type StageType = 'open' | 'working' | 'closed-won' | 'closed-lost';
export type DealStatus = 'active' | 'stalled' | 'at-risk' | 'won' | 'lost';

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  order: number;
  probability: number;
  color: string;
  rottenAfterDays: number;
  requiredFields: string[];
  automations: {
    onEnter: string[];
    onExit: string[];
  };
}

export interface Pipeline {
  id: string;
  name: string;
  type: PipelineType;
  stages: PipelineStage[];
  currency: string;
  isDefault: boolean;
  permissions: {
    view: string[];
    edit: string[];
    delete: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  name: string;
  pipelineId: string;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate: Date;
  status: DealStatus;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  company: {
    id: string;
    name: string;
  };
  contacts: {
    id: string;
    name: string;
    email: string;
    role: string;
    isPrimary: boolean;
  }[];
  products: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  activities: {
    id: string;
    type: 'note' | 'call' | 'email' | 'meeting' | 'task';
    description: string;
    createdAt: Date;
  }[];
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  lostReason?: string;
}

export interface PipelineMetrics {
  pipelineId: string;
  totalValue: number;
  totalDeals: number;
  averageDealSize: number;
  weightedValue: number;
  conversionRate: number;
  averageSalesCycle: number;
  stageMetrics: {
    stageId: string;
    stageName: string;
    count: number;
    value: number;
    avgTimeInStage: number;
    conversionToNext: number;
  }[];
  velocity: number;
  forecastedRevenue: number;
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    percentChange: number;
  };
}

export interface PipelineConfig {
  defaultPipelineId: string;
  showProbability: boolean;
  showWeightedValue: boolean;
  enableDragDrop: boolean;
  rottenDealAlerts: boolean;
  autoArchiveClosedDeals: boolean;
  archiveAfterDays: number;
  dealCardFields: string[];
  sortBy: 'value' | 'created' | 'updated' | 'close-date';
  sortDirection: 'asc' | 'desc';
  viewMode: 'kanban' | 'list' | 'forecast';
}

// ============================================================================
// CRM ANALYTICS TYPES
// ============================================================================

export interface SalesReport {
  id: string;
  name: string;
  type: 'pipeline' | 'performance' | 'forecast' | 'activity' | 'conversion';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: Record<string, unknown>;
  metrics: Record<string, number>;
  charts: {
    type: 'bar' | 'line' | 'pie' | 'funnel' | 'gauge';
    data: unknown;
  }[];
  createdAt: Date;
}

export interface TeamPerformance {
  userId: string;
  userName: string;
  metrics: {
    dealsWon: number;
    dealsClosed: number;
    revenue: number;
    quota: number;
    quotaAttainment: number;
    avgDealSize: number;
    avgSalesCycle: number;
    activitiesCompleted: number;
    pipelineValue: number;
  };
  trend: ScoreTrend;
  ranking: number;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface CRMIntegration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'voip' | 'linkedin' | 'enrichment' | 'document';
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, unknown>;
  lastSync?: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
}

export interface ActivitySync {
  id: string;
  integrationId: string;
  type: 'email' | 'call' | 'meeting' | 'task';
  externalId: string;
  linkedTo: {
    type: 'lead' | 'contact' | 'deal';
    id: string;
  }[];
  data: Record<string, unknown>;
  syncedAt: Date;
}
