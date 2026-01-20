/**
 * Research Service - Enterprise Integration Layer
 * 
 * Complete backend integration for all Research/Intelligence Tauri commands.
 * Provides typed interfaces and service methods for projects,
 * competitors, sources, reports, trends, and analytics.
 * 
 * @module lib/services/research-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ResearchProject {
  id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  status: ProjectStatus;
  sources: ResearchSource[];
  competitors: Competitor[];
  findings: Finding[];
  created_at: string;
  updated_at: string;
}

export type ProjectType = 'MarketResearch' | 'CompetitorAnalysis' | 'TrendAnalysis' | 'CustomerResearch' | 'IndustryReport';
export type ProjectStatus = 'Planning' | 'InProgress' | 'Analyzing' | 'Completed' | 'Archived';

export interface ResearchSource {
  id: string;
  source_type: SourceType;
  name: string;
  url: Option<string>;
  credibility_score: number;
  last_checked: Option<string>;
  data: Record<string, unknown>;
}

export type SourceType = 'Website' | 'API' | 'Database' | 'Document' | 'Survey' | 'Interview';

export interface Competitor {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: CompetitorSize;
  market_share: Option<number>;
  strengths: string[];
  weaknesses: string[];
  products: CompetitorProduct[];
  social_presence: SocialPresence;
  last_updated: string;
}

export type CompetitorSize = 'Startup' | 'Small' | 'Medium' | 'Large' | 'Enterprise';

export interface CompetitorProduct {
  name: string;
  pricing: Option<number>;
  features: string[];
}

export interface SocialPresence {
  twitter_followers: number;
  linkedin_followers: number;
  facebook_followers: number;
  instagram_followers: number;
}

export interface Finding {
  id: string;
  finding_type: string;
  title: string;
  description: string;
  confidence: number;
  sources: string[];
  created_at: string;
}

export interface ResearchReport {
  id: string;
  project_id: string;
  title: string;
  report_type: ReportType;
  sections: ReportSection[];
  summary: string;
  recommendations: string[];
  status: ReportStatus;
  created_at: string;
}

export type ReportType = 'Executive' | 'Detailed' | 'Competitive' | 'Market' | 'Custom';
export type ReportStatus = 'Draft' | 'Review' | 'Final' | 'Archived';

export interface ReportSection {
  title: string;
  content: string;
  order: number;
  charts: ChartData[];
}

export interface ChartData {
  chart_type: string;
  title: string;
  data: Record<string, unknown>;
}

export interface MarketTrend {
  id: string;
  topic: string;
  category: string;
  sentiment: Sentiment;
  volume: number;
  growth_rate: number;
  time_series: TrendPoint[];
  related_topics: string[];
  sources: string[];
}

export type Sentiment = 'Positive' | 'Neutral' | 'Negative' | 'Mixed';

export interface TrendPoint {
  date: string;
  value: number;
}

export interface ResearchStats {
  total_projects: number;
  active_projects: number;
  total_competitors: number;
  total_sources: number;
  total_reports: number;
  avg_confidence: number;
}

export interface ResearchQuickStats {
  projects: number;
  competitors: number;
  reports: number;
  alerts: number;
}

export interface ResearchNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  relevance_score: number;
  published_at: Option<string>;
}

type Option<T> = T | null;

// ============================================================================
// Project Service
// ============================================================================

export const ProjectService = {
  /**
   * Create a new research project
   */
  async create(params: {
    name: string;
    description?: string;
    projectType: ProjectType;
  }): Promise<ResearchProject> {
    return invoke<ResearchProject>('research_create_project', {
      name: params.name,
      description: params.description || '',
      projectType: params.projectType,
    });
  },

  /**
   * Get all projects with optional filters
   */
  async getAll(params?: {
    status?: ProjectStatus;
    projectType?: ProjectType;
  }): Promise<ResearchProject[]> {
    return invoke<ResearchProject[]>('research_get_projects', {
      status: params?.status,
      projectType: params?.projectType,
    });
  },

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<ResearchProject | null> {
    return invoke<ResearchProject | null>('research_get_project', { id });
  },

  /**
   * Update a project
   */
  async update(params: {
    id: string;
    name?: string;
    description?: string;
    status?: ProjectStatus;
  }): Promise<ResearchProject> {
    return invoke<ResearchProject>('research_update_project', params);
  },

  /**
   * Delete a project
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('research_delete_project', { id });
  },

  /**
   * Run analysis on a project
   */
  async run(projectId: string): Promise<ResearchProject> {
    return invoke<ResearchProject>('research_run_project', { projectId });
  },
};

// ============================================================================
// Source Service
// ============================================================================

export const SourceService = {
  /**
   * Add a source to a project
   */
  async add(params: {
    projectId: string;
    sourceType: SourceType;
    name: string;
    url?: string;
  }): Promise<ResearchProject> {
    return invoke<ResearchProject>('research_add_source', {
      projectId: params.projectId,
      sourceType: params.sourceType,
      name: params.name,
      url: params.url,
    });
  },

  /**
   * Remove a source from a project
   */
  async remove(params: {
    projectId: string;
    sourceId: string;
  }): Promise<ResearchProject> {
    return invoke<ResearchProject>('research_remove_source', params);
  },
};

// ============================================================================
// Competitor Service
// ============================================================================

export const CompetitorService = {
  /**
   * Add a competitor to a project
   */
  async add(params: {
    projectId: string;
    name: string;
    website?: string;
    industry?: string;
  }): Promise<Competitor> {
    return invoke<Competitor>('research_add_competitor', {
      projectId: params.projectId,
      name: params.name,
      website: params.website || '',
      industry: params.industry || '',
    });
  },

  /**
   * Get all competitors for a project
   */
  async getAll(projectId: string): Promise<Competitor[]> {
    return invoke<Competitor[]>('research_get_competitors', { projectId });
  },

  /**
   * Analyze a competitor
   */
  async analyze(competitorId: string): Promise<Competitor> {
    return invoke<Competitor>('research_analyze_competitor', { competitorId });
  },

  /**
   * Remove a competitor from a project
   */
  async remove(params: {
    projectId: string;
    competitorId: string;
  }): Promise<boolean> {
    return invoke<boolean>('research_remove_competitor', params);
  },
};

// ============================================================================
// Report Service
// ============================================================================

export const ReportService = {
  /**
   * Generate a report from project findings
   */
  async generate(params: {
    projectId: string;
    reportType: ReportType;
    title?: string;
  }): Promise<ResearchReport> {
    return invoke<ResearchReport>('research_generate_report', {
      projectId: params.projectId,
      reportType: params.reportType,
      title: params.title,
    });
  },

  /**
   * Get all reports with optional filters
   */
  async getAll(params?: {
    projectId?: string;
    reportType?: ReportType;
  }): Promise<ResearchReport[]> {
    return invoke<ResearchReport[]>('research_get_reports', {
      projectId: params?.projectId,
      reportType: params?.reportType,
    });
  },
};

// ============================================================================
// Trends Service
// ============================================================================

export const TrendsService = {
  /**
   * Get market trends
   */
  async get(params?: {
    category?: string;
    limit?: number;
  }): Promise<MarketTrend[]> {
    return invoke<MarketTrend[]>('research_get_trends', {
      category: params?.category,
      limit: params?.limit || 10,
    });
  },

  /**
   * Search for specific topics
   */
  async search(params: {
    query: string;
    sources?: string[];
    limit?: number;
  }): Promise<SearchResult[]> {
    return invoke<SearchResult[]>('research_search', {
      query: params.query,
      sources: params.sources,
      limit: params.limit || 20,
    });
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

export const ResearchAnalyticsService = {
  /**
   * Get research statistics
   */
  async getStats(): Promise<ResearchStats> {
    return invoke<ResearchStats>('research_get_stats');
  },

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(): Promise<ResearchQuickStats> {
    return invoke<ResearchQuickStats>('research_get_quick_stats');
  },

  /**
   * Get notifications
   */
  async getNotifications(): Promise<ResearchNotification[]> {
    return invoke<ResearchNotification[]>('research_get_notifications');
  },
};

// ============================================================================
// Unified Research Service Export
// ============================================================================

export const ResearchService = {
  projects: ProjectService,
  sources: SourceService,
  competitors: CompetitorService,
  reports: ReportService,
  trends: TrendsService,
  analytics: ResearchAnalyticsService,
};

export default ResearchService;
