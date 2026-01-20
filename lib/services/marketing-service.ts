/**
 * Marketing Service - Enterprise Integration Layer
 * 
 * Complete backend integration for all Marketing Tauri commands.
 * Provides typed interfaces and service methods for campaigns,
 * funnels, leads, templates, segments, and analytics.
 * 
 * @module lib/services/marketing-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  subject: string;
  content: string;
  template_id: Option<string>;
  audience: CampaignAudience;
  scheduled_at: Option<string>;
  sent_at: Option<string>;
  metrics: CampaignMetrics;
  created_at: string;
  updated_at: string;
}

export type CampaignType = 'Email' | 'SMS' | 'Push' | 'Social' | 'Ads';
export type CampaignStatus = 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed';

export interface CampaignAudience {
  total: number;
  segments: string[];
  filters: Record<string, string>;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
}

export interface MarketingFunnel {
  id: string;
  name: string;
  description: string;
  stages: FunnelStage[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  order: number;
  conversion_goal: number;
  leads_count: number;
  actions: FunnelAction[];
}

export interface FunnelAction {
  action_type: string;
  config: Record<string, string>;
}

export interface Lead {
  id: string;
  email: string;
  name: string;
  phone: Option<string>;
  company: Option<string>;
  source: LeadSource;
  score: number;
  stage: LeadStage;
  tags: string[];
  custom_fields: Record<string, string>;
  last_activity: Option<string>;
  created_at: string;
  updated_at: string;
}

export type LeadSource = 'Organic' | 'Paid' | 'Social' | 'Referral' | 'Direct' | 'Email';
export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_type: TemplateType;
  variables: string[];
  preview_text: string;
  created_at: string;
  updated_at: string;
}

export type TemplateType = 'Newsletter' | 'Promotional' | 'Transactional' | 'Automated' | 'Welcome';

export interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  member_count: number;
  created_at: string;
}

export interface SegmentCriteria {
  field: string;
  operator: string;
  value: string;
}

export interface MarketingAnalytics {
  period: string;
  campaigns: CampaignAnalytics;
  leads: LeadAnalytics;
  funnels: FunnelAnalytics;
  channels: ChannelAnalytics[];
  trends: TrendPoint[];
}

export interface CampaignAnalytics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  avg_open_rate: number;
  avg_click_rate: number;
  avg_conversion_rate: number;
}

export interface LeadAnalytics {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  converted_leads: number;
  avg_score: number;
}

export interface FunnelAnalytics {
  total_funnels: number;
  active_funnels: number;
  avg_conversion_rate: number;
  total_conversions: number;
}

export interface ChannelAnalytics {
  channel: string;
  leads: number;
  conversions: number;
  revenue: number;
}

export interface TrendPoint {
  date: string;
  leads: number;
  conversions: number;
  revenue: number;
}

export interface MarketingStats {
  total_campaigns: number;
  active_campaigns: number;
  total_leads: number;
  total_funnels: number;
  conversion_rate: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
}

export interface MarketingNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

type Option<T> = T | null;

// ============================================================================
// Campaign Service
// ============================================================================

export const CampaignService = {
  /**
   * Create a new campaign
   */
  async create(params: {
    name: string;
    campaignType: CampaignType;
    subject: string;
    content: string;
    templateId?: string;
  }): Promise<Campaign> {
    return invoke<Campaign>('marketing_create_campaign', {
      name: params.name,
      campaignType: params.campaignType,
      subject: params.subject,
      content: params.content,
      templateId: params.templateId,
    });
  },

  /**
   * Get all campaigns with optional filters
   */
  async getAll(params?: {
    status?: CampaignStatus;
    campaignType?: CampaignType;
  }): Promise<Campaign[]> {
    return invoke<Campaign[]>('marketing_get_campaigns', {
      status: params?.status,
      campaignType: params?.campaignType,
    });
  },

  /**
   * Get a single campaign by ID
   */
  async getById(id: string): Promise<Campaign | null> {
    return invoke<Campaign | null>('marketing_get_campaign', { id });
  },

  /**
   * Update a campaign
   */
  async update(params: {
    id: string;
    name?: string;
    subject?: string;
    content?: string;
    status?: CampaignStatus;
  }): Promise<Campaign> {
    return invoke<Campaign>('marketing_update_campaign', params);
  },

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('marketing_delete_campaign', { id });
  },

  /**
   * Send a campaign immediately
   */
  async send(id: string): Promise<Campaign> {
    return invoke<Campaign>('marketing_send_campaign', { campaignId: id });
  },

  /**
   * Schedule a campaign for later
   */
  async schedule(params: {
    campaignId: string;
    scheduledAt: string;
  }): Promise<Campaign> {
    return invoke<Campaign>('marketing_schedule_campaign', params);
  },
};

// ============================================================================
// Funnel Service
// ============================================================================

export const FunnelService = {
  /**
   * Create a new funnel
   */
  async create(params: {
    name: string;
    description?: string;
    stages: Array<{
      name: string;
      conversionGoal: number;
    }>;
  }): Promise<MarketingFunnel> {
    return invoke<MarketingFunnel>('marketing_create_funnel', {
      name: params.name,
      description: params.description || '',
      stages: params.stages,
    });
  },

  /**
   * Get all funnels
   */
  async getAll(): Promise<MarketingFunnel[]> {
    return invoke<MarketingFunnel[]>('marketing_get_funnels');
  },

  /**
   * Get a single funnel by ID
   */
  async getById(id: string): Promise<MarketingFunnel | null> {
    return invoke<MarketingFunnel | null>('marketing_get_funnel', { id });
  },

  /**
   * Update a funnel
   */
  async update(params: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<MarketingFunnel> {
    return invoke<MarketingFunnel>('marketing_update_funnel', params);
  },

  /**
   * Delete a funnel
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('marketing_delete_funnel', { id });
  },

  /**
   * Add a stage to a funnel
   */
  async addStage(params: {
    funnelId: string;
    name: string;
    conversionGoal: number;
  }): Promise<MarketingFunnel> {
    return invoke<MarketingFunnel>('marketing_add_funnel_stage', params);
  },
};

// ============================================================================
// Lead Service
// ============================================================================

export const LeadService = {
  /**
   * Create a new lead
   */
  async create(params: {
    email: string;
    name: string;
    phone?: string;
    company?: string;
    source?: LeadSource;
    tags?: string[];
  }): Promise<Lead> {
    return invoke<Lead>('marketing_create_lead', {
      email: params.email,
      name: params.name,
      phone: params.phone,
      company: params.company,
      source: params.source || 'Direct',
      tags: params.tags || [],
    });
  },

  /**
   * Get all leads with optional filters
   */
  async getAll(params?: {
    stage?: LeadStage;
    source?: LeadSource;
    minScore?: number;
  }): Promise<Lead[]> {
    return invoke<Lead[]>('marketing_get_leads', {
      stage: params?.stage,
      source: params?.source,
      minScore: params?.minScore,
    });
  },

  /**
   * Update lead score
   */
  async updateScore(params: {
    leadId: string;
    newScore: number;
  }): Promise<Lead> {
    return invoke<Lead>('marketing_update_lead_score', params);
  },

  /**
   * Move lead to a different stage
   */
  async moveStage(params: {
    leadId: string;
    newStage: LeadStage;
  }): Promise<Lead> {
    return invoke<Lead>('marketing_move_lead_stage', params);
  },
};

// ============================================================================
// Template Service
// ============================================================================

export const TemplateService = {
  /**
   * Create a new email template
   */
  async create(params: {
    name: string;
    subject: string;
    content: string;
    templateType: TemplateType;
    previewText?: string;
  }): Promise<EmailTemplate> {
    return invoke<EmailTemplate>('marketing_create_template', {
      name: params.name,
      subject: params.subject,
      content: params.content,
      templateType: params.templateType,
      previewText: params.previewText || '',
    });
  },

  /**
   * Get all templates
   */
  async getAll(params?: {
    templateType?: TemplateType;
  }): Promise<EmailTemplate[]> {
    return invoke<EmailTemplate[]>('marketing_get_templates', {
      templateType: params?.templateType,
    });
  },

  /**
   * Delete a template
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('marketing_delete_template', { id });
  },
};

// ============================================================================
// Segment Service
// ============================================================================

export const SegmentService = {
  /**
   * Create a new segment
   */
  async create(params: {
    name: string;
    description?: string;
    criteria: SegmentCriteria[];
  }): Promise<Segment> {
    return invoke<Segment>('marketing_create_segment', {
      name: params.name,
      description: params.description || '',
      criteria: params.criteria,
    });
  },

  /**
   * Get all segments
   */
  async getAll(): Promise<Segment[]> {
    return invoke<Segment[]>('marketing_get_segments');
  },

  /**
   * Delete a segment
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('marketing_delete_segment', { id });
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

export const MarketingAnalyticsService = {
  /**
   * Get marketing analytics for a period
   */
  async getAnalytics(period: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<MarketingAnalytics> {
    return invoke<MarketingAnalytics>('marketing_get_analytics', { period });
  },

  /**
   * Get marketing statistics
   */
  async getStats(): Promise<MarketingStats> {
    return invoke<MarketingStats>('marketing_get_stats');
  },

  /**
   * Get notifications
   */
  async getNotifications(): Promise<MarketingNotification[]> {
    return invoke<MarketingNotification[]>('marketing_get_notifications');
  },
};

// ============================================================================
// Unified Marketing Service Export
// ============================================================================

export const MarketingService = {
  campaigns: CampaignService,
  funnels: FunnelService,
  leads: LeadService,
  templates: TemplateService,
  segments: SegmentService,
  analytics: MarketingAnalyticsService,
};

export default MarketingService;
