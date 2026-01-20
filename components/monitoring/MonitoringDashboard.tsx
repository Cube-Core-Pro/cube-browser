/**
 * MonitoringDashboard Component
 * 
 * Enterprise monitoring dashboard with:
 * - Real-time system statistics
 * - Active executions display
 * - Recent logs viewer
 * - Alert history
 * - Performance metrics charts
 * 
 * @component
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('MonitoringDashboard');

import React, { useState, useEffect } from 'react';
import { MetricsService, LogsService, AlertsService } from '@/lib/services/monitoring-service';
import type { SystemStats, ExecutionMetrics, LogEntry, LogStats, AlertEvent } from '@/lib/services/monitoring-service';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Database,
  Zap,
  RefreshCw
} from 'lucide-react';
import './MonitoringDashboard.css';

export const MonitoringDashboard: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [activeExecutions, setActiveExecutions] = useState<ExecutionMetrics[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    try {
      const [stats, executions, logs, logStatsData, alerts] = await Promise.all([
        MetricsService.getSystemStats(),
        MetricsService.getActiveExecutions(),
        LogsService.getRecent(50),
        LogsService.getStats(),
        AlertsService.getHistory(20),
      ]);

      setSystemStats(stats);
      setActiveExecutions(executions);
      setRecentLogs(logs);
      setLogStats(logStatsData);
      setAlertHistory(alerts);
      setLoading(false);
    } catch (error) {
      log.error('Failed to load monitoring data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: ExecutionMetrics['status']): string => {
    switch (status) {
      case 'Running': return '#f59e0b';
      case 'Completed': return '#10b981';
      case 'Failed': return '#ef4444';
      case 'Cancelled': return '#6b7280';
      case 'Paused': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getLogLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'Debug': return '#6b7280';
      case 'Info': return '#3b82f6';
      case 'Warn': return '#f59e0b';
      case 'Error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAlertColor = (severity: AlertEvent['severity']): string => {
    switch (severity) {
      case 'Info': return '#3b82f6';
      case 'Warning': return '#f59e0b';
      case 'Error': return '#ef4444';
      case 'Critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="monitoring-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="spinning" />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h1>
          <Activity className="header-icon" />
          Monitoring Dashboard
        </h1>
        <div className="header-actions">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button onClick={loadData} className="refresh-button">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* System Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">
            <Database className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Executions</div>
            <div className="stat-value">{systemStats?.total_executions || 0}</div>
            <div className="stat-detail">
              Today: {systemStats?.executions_today || 0} | Week: {systemStats?.executions_this_week || 0}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">
            <Zap className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Executions</div>
            <div className="stat-value">{systemStats?.active_executions || 0}</div>
            <div className="stat-detail">Currently running</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">{systemStats?.success_rate.toFixed(1) || 0}%</div>
            <div className="stat-detail">All time average</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <Clock className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Avg Duration</div>
            <div className="stat-value">{formatDuration(systemStats?.average_execution_time_ms || 0)}</div>
            <div className="stat-detail">Uptime: {formatUptime(systemStats?.uptime_seconds || 0)}</div>
          </div>
        </div>
      </div>

      {/* Active Executions */}
      <div className="dashboard-section">
        <h2>
          <TrendingUp className="section-icon" />
          Active Executions
        </h2>
        {activeExecutions.length === 0 ? (
          <div className="empty-state">No active executions</div>
        ) : (
          <div className="executions-list">
            {activeExecutions.map((execution) => (
              <div key={execution.execution_id} className="execution-card">
                <div className="execution-header">
                  <div className="execution-title">
                    <span className="execution-name">{execution.workflow_name}</span>
                    <span
                      className="execution-status"
                      ref={(el) => { if (el) el.style.background = getStatusColor(execution.status); }}
                    >
                      {execution.status}
                    </span>
                  </div>
                  <div className="execution-time">
                    {formatDuration(execution.duration_ms)}
                  </div>
                </div>
                <div className="execution-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      ref={(el) => { if (el) el.style.width = `${(execution.nodes_executed / execution.nodes_total) * 100}%`; }}
                    />
                  </div>
                  <div className="progress-text">
                    {execution.nodes_executed} / {execution.nodes_total} nodes
                    {execution.nodes_failed > 0 && (
                      <span className="failed-nodes"> ({execution.nodes_failed} failed)</span>
                    )}
                  </div>
                </div>
                {execution.current_node && (
                  <div className="current-node">Current: {execution.current_node}</div>
                )}
                <div className="execution-resources">
                  <span>CPU: {execution.resource_usage.cpu_percent.toFixed(1)}%</span>
                  <span>RAM: {execution.resource_usage.memory_mb}MB</span>
                  <span>Network: {execution.resource_usage.network_kb}KB</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Summary */}
      <div className="dashboard-section">
        <h2>
          <Database className="section-icon" />
          Recent Logs
        </h2>
        {logStats && (
          <div className="logs-stats">
            <span className="log-stat debug">Debug: {logStats.debug}</span>
            <span className="log-stat info">Info: {logStats.info}</span>
            <span className="log-stat warn">Warn: {logStats.warn}</span>
            <span className="log-stat error">Error: {logStats.error}</span>
          </div>
        )}
        <div className="logs-list">
          {recentLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="log-entry">
              <span
                className="log-level"
                ref={(el) => { if (el) el.style.background = getLogLevelColor(log.level); }}
              >
                {log.level}
              </span>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert History */}
      <div className="dashboard-section">
        <h2>
          <AlertTriangle className="section-icon" />
          Recent Alerts
        </h2>
        {alertHistory.length === 0 ? (
          <div className="empty-state">No alerts</div>
        ) : (
          <div className="alerts-list">
            {alertHistory.slice(0, 5).map((alert) => (
              <div key={alert.id} className="alert-card">
                <div
                  className="alert-severity"
                  ref={(el) => { if (el) el.style.background = getAlertColor(alert.severity); }}
                >
                  {alert.severity}
                </div>
                <div className="alert-content">
                  <div className="alert-workflow">{alert.workflow_name}</div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
