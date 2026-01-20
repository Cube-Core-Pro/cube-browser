// browser-tab-groups-service.ts
// CUBE Elite v6 - Tab Groups TypeScript Service
// AI-powered tab management superior to Chrome/Opera/Vivaldi

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Browser');

// ============ Types ============

export type GroupColor = 
  | 'grey' 
  | 'blue' 
  | 'red' 
  | 'yellow' 
  | 'green' 
  | 'pink' 
  | 'purple' 
  | 'cyan' 
  | 'orange' 
  | 'teal' 
  | 'indigo' 
  | 'amber' 
  | 'lime' 
  | 'rose' 
  | 'violet';

export interface GroupColorCustom {
  custom: string;
}

export type GroupColorValue = GroupColor | GroupColorCustom;

export interface TabStack {
  id: string;
  tab_ids: string[];
  active_tab_index: number;
  created_at: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: GroupColorValue;
  tab_ids: string[];
  collapsed: boolean;
  pinned: boolean;
  created_at: number;
  updated_at: number;
  auto_generated: boolean;
  category: string | null;
  icon: string | null;
  stacks: TabStack[];
}

export interface TabMetadata {
  id: string;
  url: string;
  title: string;
  domain: string;
  favicon: string | null;
  group_id: string | null;
  stack_id: string | null;
  position: number;
  pinned: boolean;
  muted: boolean;
  playing_audio: boolean;
  created_at: number;
  last_accessed: number;
}

export interface GroupSuggestion {
  id: string;
  name: string;
  color: GroupColorValue;
  tab_ids: string[];
  confidence: number;
  reason: string;
  category: string;
}

export type GroupingRuleType = 'domain' | 'url_pattern' | 'title_pattern' | 'category';

export interface GroupingRule {
  id: string;
  name: string;
  enabled: boolean;
  rule_type: GroupingRuleType;
  pattern: string;
  group_name: string;
  group_color: GroupColorValue;
  priority: number;
}

export interface TabGroupsConfig {
  enabled: boolean;
  auto_group_enabled: boolean;
  auto_group_by_domain: boolean;
  auto_collapse_inactive: boolean;
  show_group_names: boolean;
  show_tab_count: boolean;
  sync_across_windows: boolean;
  ai_suggestions_enabled: boolean;
  vertical_tabs_enabled: boolean;
  stacking_enabled: boolean;
  grouping_rules: GroupingRule[];
}

export interface TabGroupsStats {
  total_tabs: number;
  total_groups: number;
  ungrouped_count: number;
  stacked_tabs: number;
  auto_generated_groups: number;
  collapsed_groups: number;
  pinned_groups: number;
}

// ============ Helper Functions ============

const GROUP_COLOR_HEX_MAP: Record<GroupColor, string> = {
  grey: '#6b7280',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  pink: '#ec4899',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
  teal: '#14b8a6',
  indigo: '#6366f1',
  amber: '#f59e0b',
  lime: '#84cc16',
  rose: '#f43f5e',
  violet: '#8b5cf6',
};

export function getColorHex(color: GroupColorValue): string {
  if (typeof color === 'string') {
    return GROUP_COLOR_HEX_MAP[color] || GROUP_COLOR_HEX_MAP.blue;
  }
  return color.custom || GROUP_COLOR_HEX_MAP.blue;
}

export function getColorName(color: GroupColorValue): string {
  if (typeof color === 'string') {
    return color;
  }
  return 'custom';
}

// ============ Service Class ============

class TabGroupsService {
  // ============ Configuration ============

  async getConfig(): Promise<TabGroupsConfig> {
    try {
      return await invoke<TabGroupsConfig>('tab_groups_get_config');
    } catch (error) {
      log.error('Failed to get tab groups config:', error);
      throw new Error(`Failed to get tab groups config: ${error}`);
    }
  }

  async setConfig(config: TabGroupsConfig): Promise<void> {
    try {
      await invoke('tab_groups_set_config', { config });
    } catch (error) {
      log.error('Failed to set tab groups config:', error);
      throw new Error(`Failed to set tab groups config: ${error}`);
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    try {
      await invoke('tab_groups_set_enabled', { enabled });
    } catch (error) {
      log.error('Failed to set tab groups enabled:', error);
      throw new Error(`Failed to set enabled: ${error}`);
    }
  }

  async setAutoGroup(enabled: boolean): Promise<void> {
    try {
      await invoke('tab_groups_set_auto_group', { enabled });
    } catch (error) {
      log.error('Failed to set auto group:', error);
      throw new Error(`Failed to set auto group: ${error}`);
    }
  }

  async setVerticalTabs(enabled: boolean): Promise<void> {
    try {
      await invoke('tab_groups_set_vertical_tabs', { enabled });
    } catch (error) {
      log.error('Failed to set vertical tabs:', error);
      throw new Error(`Failed to set vertical tabs: ${error}`);
    }
  }

  async setStacking(enabled: boolean): Promise<void> {
    try {
      await invoke('tab_groups_set_stacking', { enabled });
    } catch (error) {
      log.error('Failed to set stacking:', error);
      throw new Error(`Failed to set stacking: ${error}`);
    }
  }

  // ============ Group Management ============

  async createGroup(name: string, color: GroupColor = 'blue'): Promise<TabGroup> {
    try {
      return await invoke<TabGroup>('tab_groups_create', { name, color });
    } catch (error) {
      log.error('Failed to create group:', error);
      throw new Error(`Failed to create group: ${error}`);
    }
  }

  async getGroup(groupId: string): Promise<TabGroup | null> {
    try {
      return await invoke<TabGroup | null>('tab_groups_get', { groupId });
    } catch (error) {
      log.error('Failed to get group:', error);
      throw new Error(`Failed to get group: ${error}`);
    }
  }

  async getAllGroups(): Promise<TabGroup[]> {
    try {
      return await invoke<TabGroup[]>('tab_groups_get_all');
    } catch (error) {
      log.error('Failed to get all groups:', error);
      throw new Error(`Failed to get all groups: ${error}`);
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_delete', { groupId });
    } catch (error) {
      log.error('Failed to delete group:', error);
      throw new Error(`Failed to delete group: ${error}`);
    }
  }

  async renameGroup(groupId: string, newName: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_rename', { groupId, newName });
    } catch (error) {
      log.error('Failed to rename group:', error);
      throw new Error(`Failed to rename group: ${error}`);
    }
  }

  async setGroupColor(groupId: string, color: GroupColor): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_set_color', { groupId, color });
    } catch (error) {
      log.error('Failed to set group color:', error);
      throw new Error(`Failed to set group color: ${error}`);
    }
  }

  async toggleCollapsed(groupId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_toggle_collapsed', { groupId });
    } catch (error) {
      log.error('Failed to toggle collapsed:', error);
      throw new Error(`Failed to toggle collapsed: ${error}`);
    }
  }

  async pinGroup(groupId: string, pinned: boolean): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_pin', { groupId, pinned });
    } catch (error) {
      log.error('Failed to pin group:', error);
      throw new Error(`Failed to pin group: ${error}`);
    }
  }

  // ============ Tab Management ============

  async registerTab(id: string, url: string, title: string): Promise<string> {
    try {
      return await invoke<string>('tab_groups_register_tab', { id, url, title });
    } catch (error) {
      log.error('Failed to register tab:', error);
      throw new Error(`Failed to register tab: ${error}`);
    }
  }

  async unregisterTab(tabId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_unregister_tab', { tabId });
    } catch (error) {
      log.error('Failed to unregister tab:', error);
      throw new Error(`Failed to unregister tab: ${error}`);
    }
  }

  async getTab(tabId: string): Promise<TabMetadata | null> {
    try {
      return await invoke<TabMetadata | null>('tab_groups_get_tab', { tabId });
    } catch (error) {
      log.error('Failed to get tab:', error);
      throw new Error(`Failed to get tab: ${error}`);
    }
  }

  async updateTab(tabId: string, url?: string, title?: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_update_tab', { tabId, url, title });
    } catch (error) {
      log.error('Failed to update tab:', error);
      throw new Error(`Failed to update tab: ${error}`);
    }
  }

  async moveTabToGroup(tabId: string, groupId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_move_tab', { tabId, groupId });
    } catch (error) {
      log.error('Failed to move tab:', error);
      throw new Error(`Failed to move tab: ${error}`);
    }
  }

  async ungroupTab(tabId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_ungroup_tab', { tabId });
    } catch (error) {
      log.error('Failed to ungroup tab:', error);
      throw new Error(`Failed to ungroup tab: ${error}`);
    }
  }

  async getUngroupedTabs(): Promise<TabMetadata[]> {
    try {
      return await invoke<TabMetadata[]>('tab_groups_get_ungrouped');
    } catch (error) {
      log.error('Failed to get ungrouped tabs:', error);
      throw new Error(`Failed to get ungrouped tabs: ${error}`);
    }
  }

  // ============ Tab Stacking (Vivaldi-style) ============

  async stackTabs(tabIds: string[], groupId: string): Promise<string | null> {
    try {
      return await invoke<string | null>('tab_groups_stack_tabs', { tabIds, groupId });
    } catch (error) {
      log.error('Failed to stack tabs:', error);
      throw new Error(`Failed to stack tabs: ${error}`);
    }
  }

  async unstackTabs(stackId: string, groupId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_unstack_tabs', { stackId, groupId });
    } catch (error) {
      log.error('Failed to unstack tabs:', error);
      throw new Error(`Failed to unstack tabs: ${error}`);
    }
  }

  async addTabToStack(tabId: string, stackId: string, groupId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_add_to_stack', { tabId, stackId, groupId });
    } catch (error) {
      log.error('Failed to add tab to stack:', error);
      throw new Error(`Failed to add tab to stack: ${error}`);
    }
  }

  // ============ AI Suggestions ============

  async getSuggestions(): Promise<GroupSuggestion[]> {
    try {
      return await invoke<GroupSuggestion[]>('tab_groups_get_suggestions');
    } catch (error) {
      log.error('Failed to get suggestions:', error);
      throw new Error(`Failed to get suggestions: ${error}`);
    }
  }

  async applySuggestion(suggestion: GroupSuggestion): Promise<string | null> {
    try {
      return await invoke<string | null>('tab_groups_apply_suggestion', { suggestion });
    } catch (error) {
      log.error('Failed to apply suggestion:', error);
      throw new Error(`Failed to apply suggestion: ${error}`);
    }
  }

  // ============ Grouping Rules ============

  async addRule(rule: Omit<GroupingRule, 'id'>): Promise<string> {
    try {
      const fullRule: GroupingRule = {
        ...rule,
        id: crypto.randomUUID(),
      };
      return await invoke<string>('tab_groups_add_rule', { rule: fullRule });
    } catch (error) {
      log.error('Failed to add rule:', error);
      throw new Error(`Failed to add rule: ${error}`);
    }
  }

  async removeRule(ruleId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_remove_rule', { ruleId });
    } catch (error) {
      log.error('Failed to remove rule:', error);
      throw new Error(`Failed to remove rule: ${error}`);
    }
  }

  async updateRule(ruleId: string, rule: GroupingRule): Promise<boolean> {
    try {
      return await invoke<boolean>('tab_groups_update_rule', { ruleId, rule });
    } catch (error) {
      log.error('Failed to update rule:', error);
      throw new Error(`Failed to update rule: ${error}`);
    }
  }

  // ============ Statistics ============

  async getStats(): Promise<TabGroupsStats> {
    try {
      return await invoke<TabGroupsStats>('tab_groups_get_stats');
    } catch (error) {
      log.error('Failed to get stats:', error);
      throw new Error(`Failed to get stats: ${error}`);
    }
  }

  // ============ Utility Methods ============

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Get color options for UI
   */
  getColorOptions(): Array<{ value: GroupColor; label: string; hex: string }> {
    return [
      { value: 'grey', label: 'Grey', hex: '#6b7280' },
      { value: 'blue', label: 'Blue', hex: '#3b82f6' },
      { value: 'red', label: 'Red', hex: '#ef4444' },
      { value: 'yellow', label: 'Yellow', hex: '#eab308' },
      { value: 'green', label: 'Green', hex: '#22c55e' },
      { value: 'pink', label: 'Pink', hex: '#ec4899' },
      { value: 'purple', label: 'Purple', hex: '#a855f7' },
      { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
      { value: 'orange', label: 'Orange', hex: '#f97316' },
      { value: 'teal', label: 'Teal', hex: '#14b8a6' },
      { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
      { value: 'amber', label: 'Amber', hex: '#f59e0b' },
      { value: 'lime', label: 'Lime', hex: '#84cc16' },
      { value: 'rose', label: 'Rose', hex: '#f43f5e' },
      { value: 'violet', label: 'Violet', hex: '#8b5cf6' },
    ];
  }

  /**
   * Format tab count for display
   */
  formatTabCount(count: number): string {
    if (count === 0) return 'No tabs';
    if (count === 1) return '1 tab';
    return `${count} tabs`;
  }

  /**
   * Sort groups by priority
   */
  sortGroups(groups: TabGroup[]): TabGroup[] {
    return [...groups].sort((a, b) => {
      // Pinned groups first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      // Then by creation date
      return a.created_at - b.created_at;
    });
  }
}

// Export singleton instance
export const CubeTabGroupsService = new TabGroupsService();
export default CubeTabGroupsService;
