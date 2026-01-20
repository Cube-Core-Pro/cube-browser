/**
 * Monitoring Service
 * CUBE Elite v6 - System Monitoring and Metrics
 * 
 * Provides real-time metrics, logging, and alerting functionality
 * for monitoring system health and workflow execution.
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('Monitoring');

// ==================== TYPES ====================

export interface ExecutionMetrics {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  nodes_executed: number;
  nodes_total: number;
  current_node?: string;
  error?: string;
  memory_usage?: number;
  cpu_usage?: number;
}

export interface WorkflowStats {
  workflow_id: string;
  workflow_name: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_duration_ms: number;
  last_execution?: string;
  success_rate: number;
}

export interface SystemStats {
  total_workflows: number;
  active_workflows: number;
  total_executions_today: number;
  successful_today: number;
  failed_today: number;
  average_response_time_ms: number;
  memory_usage_percent: number;
  cpu_usage_percent: number;
  disk_usage_percent: number;
  uptime_seconds: number;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  workflow_id?: string;
  execution_id?: string;
  node_id?: string;
  metadata: Record<string, string>;
}

export interface LogFilter {
  level?: LogLevel;
  workflow_id?: string;
  execution_id?: string;
  node_id?: string;
  start_time?: string;
  end_time?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total_logs: number;
  debug_count: number;
  info_count: number;
  warn_count: number;
  error_count: number;
  logs_today: number;
  oldest_log?: string;
  newest_log?: string;
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AlertCondition = 
  | { type: 'execution_failed' }
  | { type: 'execution_time_exceeded'; threshold_ms: number }
  | { type: 'error_rate_exceeded'; threshold_percent: number; window_minutes: number }
  | { type: 'consecutive_failures'; count: number }
  | { type: 'custom'; expression: string };

export type AlertChannel = 
  | { type: 'email'; address: string }
  | { type: 'slack'; webhook_url: string; channel?: string }
  | { type: 'discord'; webhook_url: string }
  | { type: 'webhook'; url: string; headers?: Record<string, string> }
  | { type: 'in_app' };

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  workflow_id?: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  channels: AlertChannel[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
  cooldown_minutes?: number;
  last_triggered?: string;
}

export interface AlertEvent {
  id: string;
  rule_id: string;
  workflow_id: string;
  workflow_name: string;
  execution_id: string;
  timestamp: string;
  message: string;
  severity: AlertSeverity;
  metadata: Record<string, string>;
}

// ==================== SERVICE CLASS ====================

class MonitoringService {
  private static instance: MonitoringService;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // ==================== METRICS ====================

  /**
   * Get metrics for a specific execution
   */
  async getExecution(executionId: string): Promise<ExecutionMetrics | null> {
    try {
      return await invoke<ExecutionMetrics | null>('metrics_get_execution', { executionId });
    } catch (error) {
      log.error('Failed to get execution metrics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get execution metrics');
    }
  }

  /**
   * Get all active executions
   */
  async getActiveExecutions(): Promise<ExecutionMetrics[]> {
    try {
      return await invoke<ExecutionMetrics[]>('metrics_get_active_executions');
    } catch (error) {
      log.error('Failed to get active executions:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get active executions');
    }
  }

  /**
   * Get statistics for a specific workflow
   */
  async getWorkflowStats(workflowId: string): Promise<WorkflowStats | null> {
    try {
      return await invoke<WorkflowStats | null>('metrics_get_workflow_stats', { workflowId });
    } catch (error) {
      log.error('Failed to get workflow stats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get workflow stats');
    }
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      return await invoke<SystemStats>('metrics_get_system_stats');
    } catch (error) {
      log.error('Failed to get system stats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get system stats');
    }
  }

  /**
   * Cleanup old metrics data
   */
  async cleanupMetrics(): Promise<void> {
    try {
      await invoke('metrics_cleanup');
    } catch (error) {
      log.error('Failed to cleanup metrics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cleanup metrics');
    }
  }

  // ==================== LOGS ====================

  /**
   * Add a log entry
   */
  async addLog(
    level: LogLevel,
    message: string,
    options?: {
      workflowId?: string;
      executionId?: string;
      nodeId?: string;
    }
  ): Promise<string> {
    try {
      return await invoke<string>('logs_add', {
        level,
        message,
        workflowId: options?.workflowId,
        executionId: options?.executionId,
        nodeId: options?.nodeId,
      });
    } catch (error) {
      log.error('Failed to add log:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add log');
    }
  }

  /**
   * Get logs with optional filtering
   */
  async getLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
    try {
      return await invoke<LogEntry[]>('logs_get', { filter });
    } catch (error) {
      log.error('Failed to get logs:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get logs');
    }
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(count: number = 100): Promise<LogEntry[]> {
    try {
      return await invoke<LogEntry[]>('logs_get_recent', { count });
    } catch (error) {
      log.error('Failed to get recent logs:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get recent logs');
    }
  }

  /**
   * Export logs to JSON file
   */
  async exportLogsToJson(filter: LogFilter, path: string): Promise<string> {
    try {
      return await invoke<string>('logs_export_json', { filter, path });
    } catch (error) {
      log.error('Failed to export logs to JSON:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to export logs');
    }
  }

  /**
   * Export logs to CSV file
   */
  async exportLogsToCsv(filter: LogFilter, path: string): Promise<string> {
    try {
      return await invoke<string>('logs_export_csv', { filter, path });
    } catch (error) {
      log.error('Failed to export logs to CSV:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to export logs');
    }
  }

  /**
   * Export logs to TXT file
   */
  async exportLogsToTxt(filter: LogFilter, path: string): Promise<string> {
    try {
      return await invoke<string>('logs_export_txt', { filter, path });
    } catch (error) {
      log.error('Failed to export logs to TXT:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to export logs');
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<number> {
    try {
      return await invoke<number>('logs_clear');
    } catch (error) {
      log.error('Failed to clear logs:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to clear logs');
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<LogStats> {
    try {
      return await invoke<LogStats>('logs_get_stats');
    } catch (error) {
      log.error('Failed to get log stats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get log stats');
    }
  }

  // ==================== ALERTS ====================

  /**
   * Add a new alert rule
   */
  async addAlertRule(rule: AlertRule): Promise<void> {
    try {
      await invoke('alerts_add_rule', { rule });
    } catch (error) {
      log.error('Failed to add alert rule:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add alert rule');
    }
  }

  /**
   * Remove an alert rule
   */
  async removeAlertRule(ruleId: string): Promise<void> {
    try {
      await invoke('alerts_remove_rule', { ruleId });
    } catch (error) {
      log.error('Failed to remove alert rule:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to remove alert rule');
    }
  }

  /**
   * Toggle alert rule enabled/disabled
   */
  async toggleAlertRule(ruleId: string, enabled: boolean): Promise<void> {
    try {
      await invoke('alerts_toggle_rule', { ruleId, enabled });
    } catch (error) {
      log.error('Failed to toggle alert rule:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to toggle alert rule');
    }
  }

  /**
   * Get all alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      return await invoke<AlertRule[]>('alerts_get_rules');
    } catch (error) {
      log.error('Failed to get alert rules:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get alert rules');
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(limit?: number): Promise<AlertEvent[]> {
    try {
      return await invoke<AlertEvent[]>('alerts_get_history', { limit });
    } catch (error) {
      log.error('Failed to get alert history:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get alert history');
    }
  }

  /**
   * Clear alert history
   */
  async clearAlertHistory(): Promise<number> {
    try {
      return await invoke<number>('alerts_clear_history');
    } catch (error) {
      log.error('Failed to clear alert history:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to clear alert history');
    }
  }

  /**
   * Test an alert channel
   */
  async testAlertChannel(channel: AlertChannel): Promise<void> {
    try {
      await invoke('alerts_test_channel', { channel });
    } catch (error) {
      log.error('Failed to test alert channel:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to test alert channel');
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Create a new alert rule with defaults
   */
  createAlertRule(params: {
    name: string;
    condition: AlertCondition;
    channels: AlertChannel[];
    workflowId?: string;
    severity?: AlertSeverity;
    description?: string;
    cooldownMinutes?: number;
  }): AlertRule {
    const now = new Date().toISOString();
    return {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      workflow_id: params.workflowId,
      condition: params.condition,
      severity: params.severity || 'warning',
      channels: params.channels,
      enabled: true,
      created_at: now,
      updated_at: now,
      cooldown_minutes: params.cooldownMinutes,
    };
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  /**
   * Format bytes in human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  }

  /**
   * Get log level color
   */
  getLogLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '#9ca3af';
      case 'info': return '#3b82f6';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
export default monitoringService;
