/**
 * CRM Service - Enterprise Integration Layer
 * 
 * Complete backend integration for all CRM Tauri commands.
 * Provides typed interfaces and service methods for contacts,
 * companies, deals, activities, pipelines, and analytics.
 * 
 * @module lib/services/crm-service
 * @version 1.0.0
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('CRM');

// ============================================================================
// Type Definitions
// ============================================================================

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: Option<string>;
  title: string;
  tags: string[];
  notes: string;
  source: ContactSource;
  status: ContactStatus;
  is_favorite: boolean;
  last_contacted: Option<string>;
  created_at: string;
  updated_at: string;
}

export type ContactSource = 'Manual' | 'Import' | 'WebForm' | 'Referral' | 'LinkedIn' | 'Marketing';
export type ContactStatus = 'Active' | 'Inactive' | 'Lead' | 'Customer' | 'Churned';

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  size: CompanySize;
  revenue: Option<number>;
  address: string;
  contacts: string[];
  deals: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export type CompanySize = 'Startup' | 'Small' | 'Medium' | 'Enterprise';

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  contact_id: Option<string>;
  company_id: Option<string>;
  expected_close_date: Option<string>;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type DealStage = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'ClosedWon' | 'ClosedLost';

export interface Activity {
  id: string;
  activity_type: ActivityType;
  title: string;
  description: string;
  contact_id: Option<string>;
  deal_id: Option<string>;
  scheduled_at: Option<string>;
  completed_at: Option<string>;
  status: ActivityStatus;
  created_at: string;
}

export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note' | 'Demo';
export type ActivityStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  is_default: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

export interface CRMStats {
  total_contacts: number;
  total_companies: number;
  total_deals: number;
  active_deals: number;
  won_deals: number;
  lost_deals: number;
  total_value: number;
  won_value: number;
  conversion_rate: number;
  avg_deal_size: number;
}

export interface CRMInsights {
  top_performers: TopPerformer[];
  deal_velocity: DealVelocity;
  conversion_funnel: ConversionFunnel[];
  activity_summary: ActivitySummary;
  trends: TrendData[];
}

export interface TopPerformer {
  name: string;
  deals_won: number;
  revenue: number;
}

export interface DealVelocity {
  avg_days_to_close: number;
  fastest_deal: number;
  slowest_deal: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  value: number;
  conversion_rate: number;
}

export interface ActivitySummary {
  calls: number;
  emails: number;
  meetings: number;
  tasks: number;
}

export interface TrendData {
  date: string;
  deals: number;
  revenue: number;
}

export interface CRMQuickStats {
  contacts: number;
  deals: number;
  revenue: number;
  tasks: number;
}

export interface CRMNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ContactLog {
  log_type: string;
  notes: string;
}

type Option<T> = T | null;

// ============================================================================
// Contact Service
// ============================================================================

export const ContactService = {
  /**
   * Create a new contact
   */
  async create(params: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyId?: string;
    title?: string;
    source?: ContactSource;
  }): Promise<Contact> {
    return invoke<Contact>('crm_create_contact', {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone || '',
      companyId: params.companyId,
      title: params.title || '',
      source: params.source || 'Manual',
    });
  },

  /**
   * Get all contacts with optional filters
   */
  async getAll(params?: {
    status?: ContactStatus;
    tags?: string[];
    search?: string;
  }): Promise<Contact[]> {
    return invoke<Contact[]>('crm_get_contacts', {
      status: params?.status,
      tags: params?.tags,
      search: params?.search,
    });
  },

  /**
   * Get a single contact by ID
   */
  async getById(id: string): Promise<Contact | null> {
    return invoke<Contact | null>('crm_get_contact', { id });
  },

  /**
   * Update a contact
   */
  async update(params: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    title?: string;
    notes?: string;
    tags?: string[];
    status?: ContactStatus;
  }): Promise<Contact> {
    return invoke<Contact>('crm_update_contact', params);
  },

  /**
   * Delete a contact
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('crm_delete_contact', { id });
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    return invoke<boolean>('crm_toggle_favorite', { id });
  },

  /**
   * Log an interaction with a contact
   */
  async logInteraction(params: {
    contactId: string;
    logType: string;
    notes: string;
  }): Promise<Contact> {
    return invoke<Contact>('crm_log_contact', {
      contactId: params.contactId,
      logType: params.logType,
      notes: params.notes,
    });
  },

  /**
   * Export contacts to CSV/JSON
   */
  async export(format: 'csv' | 'json'): Promise<string> {
    return invoke<string>('crm_export_contacts', { format });
  },
};

// ============================================================================
// Company Service
// ============================================================================

export const CompanyService = {
  /**
   * Create a new company
   */
  async create(params: {
    name: string;
    industry?: string;
    website?: string;
    size?: CompanySize;
    address?: string;
  }): Promise<Company> {
    return invoke<Company>('crm_create_company', {
      name: params.name,
      industry: params.industry || '',
      website: params.website || '',
      size: params.size || 'Small',
      address: params.address || '',
    });
  },

  /**
   * Get all companies with optional filters
   */
  async getAll(params?: {
    industry?: string;
    size?: CompanySize;
    search?: string;
  }): Promise<Company[]> {
    return invoke<Company[]>('crm_get_companies', {
      industry: params?.industry,
      size: params?.size,
      search: params?.search,
    });
  },

  /**
   * Get a single company by ID
   */
  async getById(id: string): Promise<Company | null> {
    return invoke<Company | null>('crm_get_company', { id });
  },

  /**
   * Delete a company
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('crm_delete_company', { id });
  },
};

// ============================================================================
// Deal Service
// ============================================================================

export const DealService = {
  /**
   * Create a new deal
   */
  async create(params: {
    title: string;
    value: number;
    contactId?: string;
    companyId?: string;
    stage?: DealStage;
    probability?: number;
    expectedCloseDate?: string;
    notes?: string;
  }): Promise<Deal> {
    return invoke<Deal>('crm_create_deal', {
      title: params.title,
      value: params.value,
      contactId: params.contactId,
      companyId: params.companyId,
      stage: params.stage || 'Lead',
      probability: params.probability || 10,
      expectedCloseDate: params.expectedCloseDate,
      notes: params.notes || '',
    });
  },

  /**
   * Get all deals with optional filters
   */
  async getAll(params?: {
    stage?: DealStage;
    minValue?: number;
    maxValue?: number;
  }): Promise<Deal[]> {
    return invoke<Deal[]>('crm_get_deals', {
      stage: params?.stage,
      minValue: params?.minValue,
      maxValue: params?.maxValue,
    });
  },

  /**
   * Get a single deal by ID
   */
  async getById(id: string): Promise<Deal | null> {
    return invoke<Deal | null>('crm_get_deal', { id });
  },

  /**
   * Update deal stage
   */
  async updateStage(params: {
    dealId: string;
    newStage: DealStage;
    probability?: number;
  }): Promise<Deal> {
    return invoke<Deal>('crm_update_deal_stage', {
      dealId: params.dealId,
      newStage: params.newStage,
      probability: params.probability,
    });
  },

  /**
   * Delete a deal
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('crm_delete_deal', { id });
  },

  /**
   * Export deals to CSV/JSON
   */
  async export(format: 'csv' | 'json'): Promise<string> {
    return invoke<string>('crm_export_deals', { format });
  },
};

// ============================================================================
// Activity Service
// ============================================================================

export const ActivityService = {
  /**
   * Create a new activity
   */
  async create(params: {
    activityType: ActivityType;
    title: string;
    description?: string;
    contactId?: string;
    dealId?: string;
    scheduledAt?: string;
  }): Promise<Activity> {
    return invoke<Activity>('crm_create_activity', {
      activityType: params.activityType,
      title: params.title,
      description: params.description || '',
      contactId: params.contactId,
      dealId: params.dealId,
      scheduledAt: params.scheduledAt,
    });
  },

  /**
   * Get all activities with optional filters
   */
  async getAll(params?: {
    activityType?: ActivityType;
    status?: ActivityStatus;
    contactId?: string;
    dealId?: string;
  }): Promise<Activity[]> {
    return invoke<Activity[]>('crm_get_activities', {
      activityType: params?.activityType,
      status: params?.status,
      contactId: params?.contactId,
      dealId: params?.dealId,
    });
  },

  /**
   * Mark activity as complete
   */
  async complete(id: string): Promise<Activity> {
    return invoke<Activity>('crm_complete_activity', { activityId: id });
  },

  /**
   * Delete an activity
   */
  async delete(id: string): Promise<boolean> {
    return invoke<boolean>('crm_delete_activity', { id });
  },
};

// ============================================================================
// Pipeline Service
// ============================================================================

export const PipelineService = {
  /**
   * Get all pipelines
   */
  async getAll(): Promise<Pipeline[]> {
    return invoke<Pipeline[]>('crm_get_pipelines');
  },

  /**
   * Get deals in a specific pipeline
   */
  async getDeals(pipelineId: string): Promise<Deal[]> {
    return invoke<Deal[]>('crm_get_pipeline_deals', { pipelineId });
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

export interface GlobalSearchResult {
  type: 'contact' | 'company' | 'deal' | 'activity';
  id: string;
  title: string;
  subtitle: string;
  score: number;
}

export const CRMAnalyticsService = {
  /**
   * Get CRM statistics
   */
  async getStats(): Promise<CRMStats> {
    return invoke<CRMStats>('crm_get_stats');
  },

  /**
   * Get CRM insights and analytics
   */
  async getInsights(): Promise<CRMInsights> {
    return invoke<CRMInsights>('crm_get_insights');
  },

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(): Promise<CRMQuickStats> {
    return invoke<CRMQuickStats>('crm_get_quick_stats');
  },

  /**
   * Get notifications
   */
  async getNotifications(): Promise<CRMNotification[]> {
    return invoke<CRMNotification[]>('crm_get_notifications');
  },

  /**
   * Global search across all CRM entities
   */
  async globalSearch(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results: GlobalSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search contacts
    try {
      const contacts = await ContactService.getAll({ search: query });
      contacts.forEach(contact => {
        const fullName = `${contact.first_name} ${contact.last_name}`;
        if (fullName.toLowerCase().includes(lowerQuery) || 
            contact.email?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'contact',
            id: contact.id,
            title: fullName,
            subtitle: contact.email || contact.phone || '',
            score: fullName.toLowerCase().startsWith(lowerQuery) ? 100 : 50,
          });
        }
      });
    } catch (_e) {
      log.warn('Contact search failed');
    }

    // Search companies
    try {
      const companies = await CompanyService.getAll({ search: query });
      companies.forEach(company => {
        if (company.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'company',
            id: company.id,
            title: company.name,
            subtitle: company.industry || company.website || '',
            score: company.name.toLowerCase().startsWith(lowerQuery) ? 100 : 50,
          });
        }
      });
    } catch (_e) {
      log.warn('Company search failed');
    }

    // Search deals
    try {
      const deals = await DealService.getAll({});
      deals.forEach(deal => {
        if (deal.title.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'deal',
            id: deal.id,
            title: deal.title,
            subtitle: `$${deal.value.toLocaleString()} - ${deal.stage}`,
            score: deal.title.toLowerCase().startsWith(lowerQuery) ? 100 : 50,
          });
        }
      });
    } catch (_e) {
      log.warn('Deal search failed');
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    // Limit results
    return results.slice(0, 20);
  },
};

// ============================================================================
// Unified CRM Service Export
// ============================================================================

export const CRMService = {
  contacts: ContactService,
  companies: CompanyService,
  deals: DealService,
  activities: ActivityService,
  pipelines: PipelineService,
  analytics: CRMAnalyticsService,
};

export default CRMService;
