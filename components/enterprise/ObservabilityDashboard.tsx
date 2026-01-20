'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ObservabilityDashboard');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  AlertRule,
  Dashboard,
  AlertSeverity,
} from '../../types/observability';
import './ObservabilityDashboard.css';

// ============================================================================
// TYPES
// ============================================================================

// Display-friendly trace types for the dashboard
interface DisplaySpan {
  spanId: string;
  operationName: string;
  duration: number;
  status: { code: string } | string;
}

interface DisplayTrace {
  traceId: string;
  spans: DisplaySpan[];
  startTime?: string;
  duration: number;
}

interface ObservabilityDashboardProps {
  dashboards?: Dashboard[];
  alerts?: AlertRule[];
  traces?: DisplayTrace[];
  onAlertCreate?: (alert: Partial<AlertRule>) => void;
  onAlertAcknowledge?: (alertId: string) => void;
  onDashboardCreate?: (dashboard: Partial<Dashboard>) => void;
}

type ViewType = 'overview' | 'metrics' | 'traces' | 'alerts' | 'logs' | 'sla';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

interface LiveMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  requests: number;
  errors: number;
  latency: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dashboards = [],
  alerts: propAlerts,
  traces: propTraces,
  onAlertCreate,
  onAlertAcknowledge,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDashboardCreate,
}) => {
  // State
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [metrics, setMetrics] = useState<LiveMetric[]>([]);
  const [alerts, setAlerts] = useState<Partial<AlertRule>[]>(propAlerts || []);
  const [traces, _setTraces] = useState<DisplayTrace[]>(propTraces || []);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    name: '',
    metric: '',
    condition: 'above',
    threshold: 0,
    severity: 'warning' as AlertSeverity,
    description: '',
  });

  // Load initial data from backend
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load system stats and convert to metrics format
        const systemStats = await invoke<{
          cpu_usage: number;
          memory_usage: number;
          disk_usage: number;
          uptime_seconds: number;
          active_workflows: number;
          total_executions: number;
        }>('metrics_get_system_stats');

        const loadedMetrics: LiveMetric[] = [
          { name: 'CPU Usage', value: systemStats.cpu_usage, unit: '%', change: 0, status: systemStats.cpu_usage > 80 ? 'critical' : systemStats.cpu_usage > 60 ? 'warning' : 'healthy' },
          { name: 'Memory Usage', value: systemStats.memory_usage, unit: '%', change: 0, status: systemStats.memory_usage > 80 ? 'critical' : systemStats.memory_usage > 60 ? 'warning' : 'healthy' },
          { name: 'Disk Usage', value: systemStats.disk_usage, unit: '%', change: 0, status: systemStats.disk_usage > 90 ? 'critical' : systemStats.disk_usage > 75 ? 'warning' : 'healthy' },
          { name: 'Active Workflows', value: systemStats.active_workflows, unit: '', change: 0, status: 'healthy' },
          { name: 'Total Executions', value: systemStats.total_executions, unit: '', change: 0, status: 'healthy' },
          { name: 'Uptime', value: Math.floor(systemStats.uptime_seconds / 3600), unit: 'hrs', change: 0, status: 'healthy' },
        ];
        setMetrics(loadedMetrics);

        // Generate service statuses based on system stats
        const determineStatus = (value: number, warnThreshold: number, critThreshold: number): 'healthy' | 'warning' | 'critical' => {
          if (value > critThreshold) return 'critical';
          if (value > warnThreshold) return 'warning';
          return 'healthy';
        };

        const loadedServices: ServiceStatus[] = [
          { name: 'api-gateway', status: determineStatus(systemStats.cpu_usage, 70, 90), requests: systemStats.total_executions, errors: Math.floor(systemStats.cpu_usage / 10), latency: 45 },
          { name: 'workflow-engine', status: determineStatus(systemStats.memory_usage, 70, 85), requests: systemStats.active_workflows * 100, errors: Math.floor(systemStats.memory_usage / 20), latency: 32 },
          { name: 'automation-service', status: systemStats.active_workflows > 50 ? 'warning' : 'healthy', requests: systemStats.active_workflows * 50, errors: 0, latency: 156 },
          { name: 'storage-service', status: determineStatus(systemStats.disk_usage, 75, 90), requests: Math.floor(systemStats.total_executions / 10), errors: 0, latency: 28 },
          { name: 'monitoring-service', status: 'healthy', requests: Math.floor(systemStats.uptime_seconds / 60), errors: 0, latency: 12 },
        ];
        setServices(loadedServices);

        // Load alerts from backend
        const loadedAlerts = await invoke<AlertRule[]>('alerts_get_rules');
        setAlerts(loadedAlerts);

      } catch (err) {
        log.error('Failed to load observability data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh || loading) return;

    const interval = setInterval(async () => {
      try {
        const systemStats = await invoke<{
          cpu_usage: number;
          memory_usage: number;
          disk_usage: number;
          uptime_seconds: number;
          active_workflows: number;
          total_executions: number;
        }>('metrics_get_system_stats');

        setMetrics(prev => prev.map(m => {
          const newValue = m.name === 'CPU Usage' ? systemStats.cpu_usage :
                          m.name === 'Memory Usage' ? systemStats.memory_usage :
                          m.name === 'Disk Usage' ? systemStats.disk_usage :
                          m.name === 'Active Workflows' ? systemStats.active_workflows :
                          m.name === 'Total Executions' ? systemStats.total_executions :
                          m.name === 'Uptime' ? Math.floor(systemStats.uptime_seconds / 3600) :
                          m.value;
          return {
            ...m,
            change: newValue - m.value,
            value: newValue,
            status: m.unit === '%' ? (newValue > 80 ? 'critical' : newValue > 60 ? 'warning' : 'healthy') : m.status,
          };
        }));
      } catch (err) {
        log.error('Failed to refresh metrics:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, loading]);

  // Format number
  const formatNumber = (num: number, decimals = 0): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  // Handle alert creation
  const handleCreateAlert = useCallback(() => {
    const newAlert: Partial<AlertRule> = {
      name: alertForm.name,
      severity: alertForm.severity,
      description: alertForm.description,
      enabled: true,
      // Simplified condition for component use - full AlertCondition structure not needed for mock
      condition: {
        type: 'metric',
        metric: {
          query: {
            metric: alertForm.metric,
            timeRange: { start: 'now-1h', end: 'now' },
          },
          threshold: alertForm.threshold,
          operator: alertForm.condition === 'above' ? 'gt' : alertForm.condition === 'below' ? 'lt' : 'eq',
          for: 60,
          aggregation: 'avg',
        },
      },
    };
    onAlertCreate?.(newAlert);
    setShowAlertModal(false);
    setAlertForm({
      name: '',
      metric: '',
      condition: 'above',
      threshold: 0,
      severity: 'warning',
      description: '',
    });
  }, [alertForm, onAlertCreate]);

  // Render metric card
  const renderMetricCard = (metric: LiveMetric) => (
    <div key={metric.name} className={`metric-card status-${metric.status}`}>
      <div className="metric-header">
        <span className="metric-name">{metric.name}</span>
        <span className={`metric-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
          {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}%
        </span>
      </div>
      <div className="metric-value">
        {formatNumber(metric.value, metric.unit === '%' ? 2 : 0)}
        {metric.unit && <span className="metric-unit">{metric.unit}</span>}
      </div>
      <div className="metric-sparkline">
        {[...Array(20)].map((_, idx) => (
          <div
            key={idx}
            className="spark-bar"
            ref={(el) => { if (el) el.style.setProperty('--bar-height', `${30 + Math.random() * 50}%`); }}
          />
        ))}
      </div>
    </div>
  );

  // Render service row
  const renderServiceRow = (service: ServiceStatus) => (
    <div
      key={service.name}
      className={`service-row status-${service.status} ${selectedService === service.name ? 'selected' : ''}`}
      onClick={() => setSelectedService(service.name === selectedService ? null : service.name)}
    >
      <div className="service-info">
        <span className={`status-indicator ${service.status}`} />
        <span className="service-name">{service.name}</span>
      </div>
      <div className="service-metrics">
        <span className="service-stat">
          <span className="stat-value">{formatNumber(service.requests)}</span>
          <span className="stat-label">req/s</span>
        </span>
        <span className="service-stat">
          <span className={`stat-value ${service.errors > 50 ? 'error' : ''}`}>{service.errors}</span>
          <span className="stat-label">errors</span>
        </span>
        <span className="service-stat">
          <span className={`stat-value ${service.latency > 200 ? 'warning' : ''}`}>{service.latency}ms</span>
          <span className="stat-label">p95</span>
        </span>
      </div>
    </div>
  );

  // Render trace row
  const getSpanStatusCode = (status: { code: string } | string | undefined): string => {
    if (!status) return '';
    if (typeof status === 'string') return status;
    return status.code;
  };

  const renderTraceRow = (trace: DisplayTrace) => {
    const hasError = trace.spans?.some(s => getSpanStatusCode(s.status) === 'ERROR');
    return (
      <div key={trace.traceId} className={`trace-row ${hasError ? 'has-error' : ''}`}>
        <div className="trace-info">
          <span className="trace-id">{trace.traceId}</span>
          <span className="trace-operation">{trace.spans?.[0]?.operationName}</span>
        </div>
        <div className="trace-timeline">
          <div 
            className="timeline-bar" 
            ref={(el) => { if (el) el.style.setProperty('--bar-width', `${Math.min((trace.duration || 0) / 20, 100)}%`); }}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
            {trace.spans?.map((span, _i) => (
              <div
                key={span.spanId}
                className={`span-segment ${getSpanStatusCode(span.status) === 'ERROR' ? 'error' : ''}`}
                ref={(el) => { if (el) el.style.setProperty('--span-width', `${((span.duration || 0) / (trace.duration || 1)) * 100}%`); }}
                title={span.operationName}
              />
            ))}
          </div>
        </div>
        <div className="trace-stats">
          <span className="trace-duration">{trace.duration}ms</span>
          <span className="trace-spans">{trace.spans?.length} spans</span>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="observability-dashboard observability-loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="observability-dashboard observability-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Failed to Load Monitoring Data</h3>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="observability-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Observability</h1>
          <div className={`live-indicator ${autoRefresh ? 'active' : ''}`}>
            <span className="live-dot" />
            Live
          </div>
        </div>
        <div className="header-center">
          <nav className="view-tabs">
            {(['overview', 'metrics', 'traces', 'alerts', 'logs', 'sla'] as ViewType[]).map(view => (
              <button
                key={view}
                className={`view-tab ${activeView === view ? 'active' : ''}`}
                onClick={() => setActiveView(view)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <div className="header-right">
          <div className="time-range-selector">
            {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map(range => (
              <button
                key={range}
                className={`time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            className={`btn btn-icon ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Pause auto-refresh' : 'Enable auto-refresh'}
          >
            {autoRefresh ? '⏸️' : '▶️'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="overview-view">
            {/* Metrics Grid */}
            <section className="metrics-section">
              <h2>Key Metrics</h2>
              <div className="metrics-grid">
                {metrics.map(renderMetricCard)}
              </div>
            </section>

            {/* Service Health */}
            <section className="services-section">
              <div className="section-header">
                <h2>Service Health</h2>
                <div className="health-summary">
                  <span className="health-item healthy">
                    {services.filter(s => s.status === 'healthy').length} Healthy
                  </span>
                  <span className="health-item warning">
                    {services.filter(s => s.status === 'warning').length} Warning
                  </span>
                  <span className="health-item critical">
                    {services.filter(s => s.status === 'critical').length} Critical
                  </span>
                </div>
              </div>
              <div className="services-list">
                {services.map(renderServiceRow)}
              </div>
            </section>

            {/* Active Alerts */}
            <section className="alerts-section">
              <div className="section-header">
                <h2>Active Alerts</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAlertModal(true)}>
                  + Create Alert
                </button>
              </div>
              <div className="alerts-list">
                {alerts.filter(a => a.enabled).map(alert => (
                  <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                    <div className="alert-icon">
                      {alert.severity === 'critical' && '🔴'}
                      {alert.severity === 'warning' && '🟡'}
                      {alert.severity === 'info' && '🔵'}
                    </div>
                    <div className="alert-content">
                      <span className="alert-name">{alert.name}</span>
                      <span className="alert-description">{alert.description}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onAlertAcknowledge?.(alert.id!)}
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Metrics View */}
        {activeView === 'metrics' && (
          <div className="metrics-view">
            <div className="metrics-explorer">
              <div className="explorer-sidebar">
                <h3>Metric Categories</h3>
                <ul className="metric-categories">
                  <li className="active">System Performance</li>
                  <li>Application Metrics</li>
                  <li>Business KPIs</li>
                  <li>Infrastructure</li>
                  <li>Custom Metrics</li>
                </ul>
              </div>
              <div className="explorer-content">
                <div className="chart-row">
                  <div className="chart-container">
                    <h4>Request Rate</h4>
                    <div className="chart-placeholder">
                      <div className="area-chart">
                        {[...Array(24)].map((_, i) => (
                          <div
                            key={i}
                            className="area-bar"
                            ref={(el) => { if (el) el.style.setProperty('--bar-height', `${40 + Math.random() * 50}%`); }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="chart-container">
                    <h4>Error Rate</h4>
                    <div className="chart-placeholder">
                      <div className="area-chart error">
                        {[...Array(24)].map((_, i) => (
                          <div
                            key={i}
                            className="area-bar"
                            ref={(el) => { if (el) el.style.setProperty('--bar-height', `${5 + Math.random() * 15}%`); }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="chart-row">
                  <div className="chart-container full">
                    <h4>Latency Distribution</h4>
                    <div className="chart-placeholder histogram">
                      {[...Array(50)].map((_, i) => {
                        const height = Math.exp(-Math.pow((i - 20) / 10, 2)) * 100;
                        return (
                          <div
                            key={i}
                            className="histogram-bar"
                            ref={(el) => { if (el) el.style.setProperty('--bar-height', `${height}%`); }}
                          />
                        );
                      })}
                    </div>
                    <div className="histogram-labels">
                      <span>0ms</span>
                      <span>100ms</span>
                      <span>200ms</span>
                      <span>500ms</span>
                      <span>1s+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Traces View */}
        {activeView === 'traces' && (
          <div className="traces-view">
            <div className="traces-header">
              <div className="traces-filters">
                <input
                  type="text"
                  placeholder="Search traces by ID or operation..."
                  className="trace-search"
                />
                <select className="trace-filter" aria-label="Filter by service">
                  <option value="">All Services</option>
                  {services.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <select className="trace-filter" aria-label="Filter by status">
                  <option value="">All Status</option>
                  <option value="ok">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="traces-stats">
                <span>{traces.length} traces</span>
                <span>{traces.filter(t => t.spans?.some(s => getSpanStatusCode(s.status) === 'ERROR')).length} with errors</span>
              </div>
            </div>
            <div className="traces-list">
              {traces.map(renderTraceRow)}
            </div>
          </div>
        )}

        {/* Alerts View */}
        {activeView === 'alerts' && (
          <div className="alerts-view">
            <div className="alerts-header">
              <h2>Alert Rules</h2>
              <button className="btn btn-primary" onClick={() => setShowAlertModal(true)}>
                + Create Alert Rule
              </button>
            </div>
            <div className="alert-rules-list">
              {alerts.map(alert => (
                <div key={alert.id} className="alert-rule-card">
                  <div className="rule-header">
                    <div className="rule-status">
                      <span className={`severity-badge ${alert.severity}`}>
                        {alert.severity}
                      </span>
                      <span className={`enabled-badge ${alert.enabled ? 'active' : ''}`}>
                        {alert.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className="rule-actions">
                      <button className="btn btn-ghost btn-sm">Edit</button>
                      <button className="btn btn-ghost btn-sm">Delete</button>
                    </div>
                  </div>
                  <h3 className="rule-name">{alert.name}</h3>
                  <p className="rule-description">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs View */}
        {activeView === 'logs' && (
          <div className="logs-view">
            <div className="logs-header">
              <input
                type="text"
                placeholder="Search logs..."
                className="logs-search"
              />
              <select className="logs-filter" aria-label="Filter by log level">
                <option value="">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="logs-stream">
              {[...Array(20)].map((_, i) => {
                const level = ['info', 'info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 5)];
                return (
                  <div key={i} className={`log-entry level-${level}`}>
                    <span className="log-timestamp">
                      {new Date(Date.now() - i * 5000).toISOString().slice(11, 23)}
                    </span>
                    <span className={`log-level ${level}`}>{level.toUpperCase()}</span>
                    <span className="log-service">api-gateway</span>
                    <span className="log-message">
                      {level === 'error' && 'Connection timeout to database server'}
                      {level === 'warn' && 'High memory usage detected: 85%'}
                      {level === 'info' && `Request processed successfully - 200 OK`}
                      {level === 'debug' && `Cache hit for key: user_session_${Math.random().toString(36).slice(2, 8)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLA View */}
        {activeView === 'sla' && (
          <div className="sla-view">
            <div className="sla-summary">
              <div className="sla-card">
                <h3>Overall SLA</h3>
                <div className="sla-gauge">
                  <svg viewBox="0 0 100 50">
                    <path
                      d="M 10 45 A 35 35 0 0 1 90 45"
                      fill="none"
                      stroke="var(--bg-secondary)"
                      strokeWidth="8"
                    />
                    <path
                      d="M 10 45 A 35 35 0 0 1 90 45"
                      fill="none"
                      stroke="var(--success)"
                      strokeWidth="8"
                      strokeDasharray="110 110"
                      strokeDashoffset={110 - 110 * 0.997}
                    />
                  </svg>
                  <span className="sla-value">99.7%</span>
                </div>
                <span className="sla-target">Target: 99.9%</span>
              </div>
              <div className="sla-card">
                <h3>Availability</h3>
                <div className="sla-stat">
                  <span className="stat-value healthy">99.95%</span>
                  <span className="stat-label">This month</span>
                </div>
              </div>
              <div className="sla-card">
                <h3>Mean Time to Recovery</h3>
                <div className="sla-stat">
                  <span className="stat-value">4.2min</span>
                  <span className="stat-label">Avg incident duration</span>
                </div>
              </div>
              <div className="sla-card">
                <h3>Error Budget</h3>
                <div className="error-budget">
                  <div className="budget-bar">
                    <div 
                      className="budget-used" 
                      ref={(el) => { if (el) el.style.setProperty('--budget-width', '30%'); }}
                    />
                  </div>
                  <span className="budget-label">70% remaining (31 min)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Alert Rule</h2>
              <button
                className="modal-close"
                onClick={() => setShowAlertModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Alert Name</label>
                <input
                  type="text"
                  value={alertForm.name}
                  onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                  placeholder="e.g., High Error Rate"
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Metric</label>
                  <select
                    value={alertForm.metric}
                    onChange={(e) => setAlertForm({ ...alertForm, metric: e.target.value })}
                    aria-label="Select metric"
                  >
                    <option value="">Select metric...</option>
                    <option value="error_rate">Error Rate</option>
                    <option value="latency_p95">P95 Latency</option>
                    <option value="request_rate">Request Rate</option>
                    <option value="cpu_usage">CPU Usage</option>
                    <option value="memory_usage">Memory Usage</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Condition</label>
                  <select
                    value={alertForm.condition}
                    onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
                    aria-label="Select condition"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Threshold</label>
                  <input
                    type="number"
                    value={alertForm.threshold}
                    onChange={(e) => setAlertForm({ ...alertForm, threshold: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="form-field">
                  <label>Severity</label>
                  <select
                    value={alertForm.severity}
                    onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value as AlertSeverity })}
                    aria-label="Select severity"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={alertForm.description}
                  onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                  placeholder="Describe when this alert should fire..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAlertModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateAlert}>
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservabilityDashboard;
