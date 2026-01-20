/**
 * Monitoring Service - CUBE Nexum
 * 
 * Unified service layer for monitoring operations including:
 * - Website monitoring
 * - System metrics
 * - Log management
 * - Alert configuration and history
 * 
 * @module MonitoringService
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================
// Types - Website Monitor
// ============================================

export interface MonitoredSite {
  id: string;
  name: string;
  url: string;
  selector?: string;
  schedule: 'hourly' | 'daily' | 'weekly' | 'custom';
  customCron?: string;
  enabled: boolean;
  lastCheck?: string;
  lastChange?: string;
  changeCount: number;
  status: 'active' | 'paused' | 'error';
  notifications: NotificationChannel[];
  sensitivity: 'low' | 'medium' | 'high';
  ignorePatterns?: string[];
  createdAt: string;
}

export interface NotificationChannel {
  type: 'slack' | 'discord' | 'email' | 'webhook';
  config: Record<string, string>;
  enabled: boolean;
}

export interface ChangeRecord {
  id: string;
  siteId: string;
  siteName: string;
  timestamp: string;
  changeType: 'content' | 'element' | 'structure' | 'removed' | 'added';
  severity: 'minor' | 'moderate' | 'major';
  previousContent?: string;
  newContent?: string;
  diff?: string;
  screenshot?: string;
}

export interface MonitorStats {
  totalSites: number;
  activeSites: number;
  totalChecks: number;
  changesDetected: number;
  lastHourChecks: number;
}

// ============================================
// Types - System Metrics
// ============================================

export interface SystemStats {
  total_executions: number;
  active_executions: number;
  executions_today: number;
  executions_this_week: number;
  average_execution_time_ms: number;
  success_rate: number;
  uptime_seconds: number;
}

export interface ExecutionMetrics {
  execution_id: string;
  workflow_id: string;
  workflow_name: string;
  start_time: string;
  end_time?: string;
  duration_ms: number;
  status: 'Running' | 'Completed' | 'Failed' | 'Cancelled' | 'Paused';
  nodes_executed: number;
  nodes_total: number;
  nodes_failed: number;
  current_node?: string;
  error?: string;
  resource_usage: {
    cpu_percent: number;
    memory_mb: number;
    network_kb: number;
    disk_io_kb: number;
  };
}

// ============================================
// Types - Logs
// ============================================

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'Debug' | 'Info' | 'Warn' | 'Error';
  workflow_id?: string;
  execution_id?: string;
  node_id?: string;
  message: string;
}

export interface LogFilter {
  workflow_id?: string;
  execution_id?: string;
  level?: 'Debug' | 'Info' | 'Warn' | 'Error';
  start_time?: string;
  end_time?: string;
  keyword?: string;
  limit?: number;
}

export interface LogStats {
  total: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
}

// ============================================
// Types - Alerts
// ============================================

export interface AlertRule {
  id: string;
  name: string;
  workflow_id?: string;
  trigger: AlertTrigger;
  channels: AlertChannel[];
  enabled: boolean;
  cooldown_minutes: number;
  last_triggered?: string;
}

export type AlertTrigger =
  | { OnFailure: null }
  | { OnSuccess: null }
  | { OnDurationExceeds: { seconds: number } }
  | { OnErrorPattern: { regex: string } }
  | { OnNodeFailure: { node_type: string } }
  | { OnResourceThreshold: { cpu_percent?: number; memory_mb?: number } };

export type AlertChannel =
  | { Slack: { webhook_url: string } }
  | { Discord: { webhook_url: string } }
  | { Webhook: { url: string; method: string; headers: Record<string, string> } };

export interface AlertEvent {
  id: string;
  rule_id: string;
  workflow_id: string;
  workflow_name: string;
  execution_id: string;
  timestamp: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
}

// ============================================
// Website Monitor Service
// ============================================

export const WebsiteMonitorService = {
  /**
   * Get all monitored sites
   */
  async getSites(): Promise<MonitoredSite[]> {
    return invoke<MonitoredSite[]>('monitor_get_sites');
  },

  /**
   * Get recent change records
   */
  async getChanges(limit: number = 50): Promise<ChangeRecord[]> {
    return invoke<ChangeRecord[]>('monitor_get_changes', { limit });
  },

  /**
   * Get monitoring statistics
   */
  async getStats(): Promise<MonitorStats> {
    return invoke<MonitorStats>('monitor_get_stats');
  },

  /**
   * Add a new site to monitor
   */
  async addSite(site: MonitoredSite): Promise<void> {
    return invoke<void>('monitor_add_site', { site });
  },

  /**
   * Toggle site monitoring status
   */
  async toggleSite(siteId: string, enabled: boolean): Promise<void> {
    return invoke<void>('monitor_toggle_site', { siteId, enabled });
  },

  /**
   * Delete a monitored site
   */
  async deleteSite(siteId: string): Promise<void> {
    return invoke<void>('monitor_delete_site', { siteId });
  },

  /**
   * Trigger immediate check for a site
   */
  async checkNow(siteId: string): Promise<void> {
    return invoke<void>('monitor_check_now', { siteId });
  },
};

// ============================================
// Metrics Service
// ============================================

export const MetricsService = {
  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    return invoke<SystemStats>('metrics_get_system_stats');
  },

  /**
   * Get active workflow executions
   */
  async getActiveExecutions(): Promise<ExecutionMetrics[]> {
    return invoke<ExecutionMetrics[]>('metrics_get_active_executions');
  },
};

// ============================================
// Logs Service
// ============================================

export const LogsService = {
  /**
   * Get logs with filters
   */
  async get(filter: LogFilter): Promise<LogEntry[]> {
    return invoke<LogEntry[]>('logs_get', { filter });
  },

  /**
   * Get recent logs
   */
  async getRecent(count: number = 50): Promise<LogEntry[]> {
    return invoke<LogEntry[]>('logs_get_recent', { count });
  },

  /**
   * Get log statistics
   */
  async getStats(): Promise<LogStats> {
    return invoke<LogStats>('logs_get_stats');
  },

  /**
   * Export logs to JSON file
   */
  async exportJson(filter: LogFilter, path: string): Promise<string> {
    return invoke<string>('logs_export_json', { filter, path });
  },

  /**
   * Export logs to CSV file
   */
  async exportCsv(filter: LogFilter, path: string): Promise<string> {
    return invoke<string>('logs_export_csv', { filter, path });
  },

  /**
   * Export logs to TXT file
   */
  async exportTxt(filter: LogFilter, path: string): Promise<string> {
    return invoke<string>('logs_export_txt', { filter, path });
  },
};

// ============================================
// Alerts Service
// ============================================

export const AlertsService = {
  /**
   * Get all alert rules
   */
  async getRules(): Promise<AlertRule[]> {
    return invoke<AlertRule[]>('alerts_get_rules');
  },

  /**
   * Get alert history
   */
  async getHistory(limit: number = 50): Promise<AlertEvent[]> {
    return invoke<AlertEvent[]>('alerts_get_history', { limit });
  },

  /**
   * Create a new alert rule
   */
  async createRule(rule: AlertRule): Promise<void> {
    return invoke<void>('alerts_create_rule', { rule });
  },

  /**
   * Update an existing alert rule
   */
  async updateRule(ruleId: string, rule: AlertRule): Promise<void> {
    return invoke<void>('alerts_update_rule', { ruleId, rule });
  },

  /**
   * Delete an alert rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    return invoke<void>('alerts_delete_rule', { ruleId });
  },

  /**
   * Test notification channel
   */
  async testChannel(channel: AlertChannel): Promise<void> {
    return invoke<void>('alerts_test_channel', { channel });
  },

  /**
   * Toggle alert rule status
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    return invoke<void>('alerts_toggle_rule', { ruleId, enabled });
  },
};

// ============================================
// Combined Monitoring Service Export
// ============================================

export const MonitoringService = {
  Website: WebsiteMonitorService,
  Metrics: MetricsService,
  Logs: LogsService,
  Alerts: AlertsService,
};

export default MonitoringService;
