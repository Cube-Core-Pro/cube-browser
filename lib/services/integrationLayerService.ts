/**
 * Integration Layer Service - Cross-Module Communication Hub
 * CUBE Elite v6 - Enterprise Integration Layer
 * 
 * Connects all major modules:
 * - CRM ↔ Marketing
 * - Social ↔ CRM
 * - Research ↔ Marketing
 * - Search ↔ All
 * - Automation ↔ All
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Integration');

// ============================================================================
// Types and Interfaces
// ============================================================================

export type DataSource = 'crm' | 'marketing' | 'social' | 'research' | 'search' | 'manual' | 'import';

export type EventType = 
  | 'lead_created'
  | 'lead_updated'
  | 'lead_scored'
  | 'contact_merged'
  | 'campaign_launched'
  | 'campaign_completed'
  | 'social_post_published'
  | 'social_engagement'
  | 'research_completed'
  | 'competitor_alert'
  | 'search_insight'
  | 'workflow_triggered'
  | 'data_synced';

export interface SocialProfile {
  platform: string;
  username: string;
  url: string;
  followers?: number;
  verified: boolean;
}

export interface UnifiedContact {
  id: string;
  source: DataSource;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  social_profiles: SocialProfile[];
  tags: string[];
  score: number;
  last_interaction?: string;
  metadata: Record<string, string>;
}

export interface CrossModuleEvent {
  id: string;
  event_type: EventType;
  source_module: string;
  target_modules: string[];
  payload: unknown;
  timestamp: string;
  processed: boolean;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface RuleAction {
  action_type: string;
  target_module: string;
  parameters: Record<string, string>;
}

export interface IntegrationRule {
  id: string;
  name: string;
  source_module: string;
  target_module: string;
  trigger_event: EventType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  created_at: string;
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  required: boolean;
  default_value?: string;
}

export interface DataMapping {
  id: string;
  source_module: string;
  target_module: string;
  field_mappings: FieldMapping[];
  transform_rules: TransformRule[];
}

export interface TransformRule {
  field: string;
  transform_type: string;
  parameters: Record<string, string>;
}

export interface SyncStatus {
  module: string;
  last_sync?: string;
  records_synced: number;
  status: string;
  errors: string[];
}

export interface DashboardStats {
  overview: {
    total_events: number;
    active_rules: number;
    total_rules: number;
    unified_contacts: number;
    total_records_synced: number;
  };
  modules: Record<string, {
    status: string;
    last_sync?: string;
    records: number;
  }>;
  recent_activity: {
    events_24h: number;
    syncs_24h: number;
    automations_triggered: number;
  };
}

export interface IntegrationAutomation {
  id: string;
  name: string;
  trigger: EventType;
  source: string;
  target: string;
  enabled: boolean;
}

export interface UnifiedSearchResult {
  query: string;
  modules_searched: string[];
  results: Record<string, Record<string, number>>;
  total_results: number;
}

// ============================================================================
// Integration Layer Service
// ============================================================================

class IntegrationLayerService {
  // ---------------------------------------------------------------------------
  // Event Management
  // ---------------------------------------------------------------------------

  /**
   * Emit a cross-module event
   */
  async emitEvent(
    eventType: EventType,
    sourceModule: string,
    targetModules: string[],
    payload: unknown
  ): Promise<CrossModuleEvent> {
    try {
      return await invoke<CrossModuleEvent>('integration_emit_event', {
        event_type: eventType,
        source_module: sourceModule,
        target_modules: targetModules,
        payload
      });
    } catch (error) {
      log.error('Failed to emit event:', error);
      throw error;
    }
  }

  /**
   * Get recent cross-module events
   */
  async getEvents(limit?: number, sourceModule?: string): Promise<CrossModuleEvent[]> {
    try {
      return await invoke<CrossModuleEvent[]>('integration_get_events', {
        limit,
        source_module: sourceModule
      });
    } catch (error) {
      log.error('Failed to get events:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Rule Management
  // ---------------------------------------------------------------------------

  /**
   * Get all integration rules
   */
  async getRules(): Promise<IntegrationRule[]> {
    try {
      return await invoke<IntegrationRule[]>('integration_get_rules');
    } catch (error) {
      log.error('Failed to get rules:', error);
      return [];
    }
  }

  /**
   * Create a new integration rule
   */
  async createRule(
    name: string,
    sourceModule: string,
    targetModule: string,
    triggerEvent: EventType,
    conditions: RuleCondition[],
    actions: RuleAction[]
  ): Promise<IntegrationRule> {
    try {
      return await invoke<IntegrationRule>('integration_create_rule', {
        name,
        source_module: sourceModule,
        target_module: targetModule,
        trigger_event: triggerEvent,
        conditions,
        actions
      });
    } catch (error) {
      log.error('Failed to create rule:', error);
      throw error;
    }
  }

  /**
   * Update an integration rule
   */
  async updateRule(
    ruleId: string,
    updates: { enabled?: boolean; name?: string }
  ): Promise<IntegrationRule> {
    try {
      return await invoke<IntegrationRule>('integration_update_rule', {
        rule_id: ruleId,
        ...updates
      });
    } catch (error) {
      log.error('Failed to update rule:', error);
      throw error;
    }
  }

  /**
   * Delete an integration rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    try {
      await invoke('integration_delete_rule', { rule_id: ruleId });
    } catch (error) {
      log.error('Failed to delete rule:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Data Mapping
  // ---------------------------------------------------------------------------

  /**
   * Get data mappings between modules
   */
  async getMappings(): Promise<DataMapping[]> {
    try {
      return await invoke<DataMapping[]>('integration_get_mappings');
    } catch (error) {
      log.error('Failed to get mappings:', error);
      return [];
    }
  }

  /**
   * Create a data mapping
   */
  async createMapping(
    sourceModule: string,
    targetModule: string,
    fieldMappings: FieldMapping[]
  ): Promise<DataMapping> {
    try {
      return await invoke<DataMapping>('integration_create_mapping', {
        source_module: sourceModule,
        target_module: targetModule,
        field_mappings: fieldMappings
      });
    } catch (error) {
      log.error('Failed to create mapping:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Sync Management
  // ---------------------------------------------------------------------------

  /**
   * Get sync status for all modules
   */
  async getSyncStatus(): Promise<Record<string, SyncStatus>> {
    try {
      return await invoke<Record<string, SyncStatus>>('integration_get_sync_status');
    } catch (error) {
      log.error('Failed to get sync status:', error);
      return {};
    }
  }

  /**
   * Sync data between modules
   */
  async syncModules(sourceModule: string, targetModule: string): Promise<SyncStatus> {
    try {
      return await invoke<SyncStatus>('integration_sync_modules', {
        source_module: sourceModule,
        target_module: targetModule
      });
    } catch (error) {
      log.error('Failed to sync modules:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Unified Contact Management
  // ---------------------------------------------------------------------------

  /**
   * Get unified contacts across all modules
   */
  async getUnifiedContacts(limit?: number, search?: string): Promise<UnifiedContact[]> {
    try {
      return await invoke<UnifiedContact[]>('integration_get_unified_contacts', {
        limit,
        search
      });
    } catch (error) {
      log.error('Failed to get unified contacts:', error);
      return [];
    }
  }

  /**
   * Create or update a unified contact
   */
  async upsertUnifiedContact(contact: Partial<UnifiedContact>): Promise<UnifiedContact> {
    try {
      const fullContact: UnifiedContact = {
        id: contact.id || '',
        source: contact.source || 'manual',
        name: contact.name || '',
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        title: contact.title,
        social_profiles: contact.social_profiles || [],
        tags: contact.tags || [],
        score: contact.score || 0,
        last_interaction: contact.last_interaction,
        metadata: contact.metadata || {}
      };
      
      return await invoke<UnifiedContact>('integration_upsert_unified_contact', {
        contact: fullContact
      });
    } catch (error) {
      log.error('Failed to upsert contact:', error);
      throw error;
    }
  }

  /**
   * Merge two unified contacts
   */
  async mergeContacts(primaryId: string, secondaryId: string): Promise<UnifiedContact> {
    try {
      return await invoke<UnifiedContact>('integration_merge_contacts', {
        primary_id: primaryId,
        secondary_id: secondaryId
      });
    } catch (error) {
      log.error('Failed to merge contacts:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // CRM ↔ Marketing Integration
  // ---------------------------------------------------------------------------

  /**
   * Push CRM leads to Marketing campaigns
   */
  async pushLeadsToCampaign(leadIds: string[], campaignId: string): Promise<{
    success: boolean;
    leads_added: number;
    campaign_id: string;
    message: string;
  }> {
    try {
      return await invoke('integration_crm_to_marketing', {
        lead_ids: leadIds,
        campaign_id: campaignId
      });
    } catch (error) {
      log.error('Failed to push leads to campaign:', error);
      throw error;
    }
  }

  /**
   * Sync Marketing engagement back to CRM
   */
  async syncEngagementToCRM(engagementData: Record<string, unknown>): Promise<{
    success: boolean;
    records_updated: number;
    message: string;
  }> {
    try {
      return await invoke('integration_marketing_to_crm', {
        engagement_data: engagementData
      });
    } catch (error) {
      log.error('Failed to sync engagement to CRM:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Social ↔ CRM Integration
  // ---------------------------------------------------------------------------

  /**
   * Import social followers as CRM leads
   */
  async importFollowersAsLeads(platform: string, followers: unknown[]): Promise<{
    success: boolean;
    platform: string;
    leads_created: number;
    message: string;
  }> {
    try {
      return await invoke('integration_social_to_crm', {
        platform,
        followers
      });
    } catch (error) {
      log.error('Failed to import followers:', error);
      throw error;
    }
  }

  /**
   * Enrich CRM contacts with social data
   */
  async enrichContactsWithSocial(contactIds: string[]): Promise<{
    success: boolean;
    contacts_enriched: number;
    social_profiles_found: number;
    message: string;
  }> {
    try {
      return await invoke('integration_enrich_with_social', {
        contact_ids: contactIds
      });
    } catch (error) {
      log.error('Failed to enrich contacts:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Research ↔ CRM/Marketing Integration
  // ---------------------------------------------------------------------------

  /**
   * Push research insights to CRM
   */
  async pushInsightsToCRM(insights: unknown[]): Promise<{
    success: boolean;
    insights_synced: number;
    crm_records_updated: number;
    message: string;
  }> {
    try {
      return await invoke('integration_research_to_crm', { insights });
    } catch (error) {
      log.error('Failed to push insights to CRM:', error);
      throw error;
    }
  }

  /**
   * Generate marketing strategy from research
   */
  async generateMarketingStrategy(competitorData: unknown): Promise<{
    success: boolean;
    strategy_generated: boolean;
    recommendations: string[];
    message: string;
  }> {
    try {
      return await invoke('integration_research_to_marketing', {
        competitor_data: competitorData
      });
    } catch (error) {
      log.error('Failed to generate strategy:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Unified Search
  // ---------------------------------------------------------------------------

  /**
   * Search across all integrated modules
   */
  async unifiedSearch(query: string, modules?: string[]): Promise<UnifiedSearchResult> {
    try {
      return await invoke<UnifiedSearchResult>('integration_unified_search', {
        query,
        modules
      });
    } catch (error) {
      log.error('Failed to perform unified search:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Automation Integration
  // ---------------------------------------------------------------------------

  /**
   * Trigger automation workflow from integration event
   */
  async triggerWorkflow(workflowId: string, triggerData: unknown): Promise<{
    success: boolean;
    workflow_id: string;
    execution_id: string;
    status: string;
    message: string;
  }> {
    try {
      return await invoke('integration_trigger_workflow', {
        workflow_id: workflowId,
        trigger_data: triggerData
      });
    } catch (error) {
      log.error('Failed to trigger workflow:', error);
      throw error;
    }
  }

  /**
   * Get available integration automations
   */
  async getAutomations(): Promise<IntegrationAutomation[]> {
    try {
      return await invoke<IntegrationAutomation[]>('integration_get_automations');
    } catch (error) {
      log.error('Failed to get automations:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Dashboard & Analytics
  // ---------------------------------------------------------------------------

  /**
   * Get integration dashboard stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await invoke<DashboardStats>('integration_get_dashboard_stats');
    } catch (error) {
      log.error('Failed to get dashboard stats:', error);
      return {
        overview: {
          total_events: 0,
          active_rules: 0,
          total_rules: 0,
          unified_contacts: 0,
          total_records_synced: 0
        },
        modules: {},
        recent_activity: {
          events_24h: 0,
          syncs_24h: 0,
          automations_triggered: 0
        }
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  /**
   * Check if a module is connected
   */
  async isModuleConnected(module: string): Promise<boolean> {
    const status = await this.getSyncStatus();
    return status[module]?.status === 'completed' || status[module]?.status === 'idle';
  }

  /**
   * Get all connected modules
   */
  async getConnectedModules(): Promise<string[]> {
    const status = await this.getSyncStatus();
    return Object.entries(status)
      .filter(([_, s]) => s.status === 'completed' || s.status === 'idle')
      .map(([m]) => m);
  }

  /**
   * Sync all modules
   */
  async syncAllModules(): Promise<Record<string, SyncStatus>> {
    const modules = ['crm', 'marketing', 'social', 'research', 'search'];
    const results: Record<string, SyncStatus> = {};
    
    for (let i = 0; i < modules.length - 1; i++) {
      try {
        results[modules[i]] = await this.syncModules(modules[i], modules[i + 1]);
      } catch (error) {
        log.error(`Failed to sync ${modules[i]}:`, error);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const integrationLayerService = new IntegrationLayerService();

// Default export
export default integrationLayerService;
