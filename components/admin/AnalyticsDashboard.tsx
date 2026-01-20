'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardService,
  ReportService,
  MetricService,
  MetricAlertService,
  DataExportService,
  UsageAnalyticsService,
} from '@/lib/services/analytics-service';
import type {
  Dashboard,
  DashboardWidget,
  Report,
  Metric,
  MetricAlert,
  TimeRange,
} from '@/lib/services/analytics-service';
import {
  BarChart3, LineChart as _LineChart, PieChart as _PieChart, Activity, TrendingUp, TrendingDown as _TrendingDown,
  Bell, AlertTriangle, CheckCircle, XCircle as _XCircle, RefreshCw, Plus, Trash2,
  Edit, Settings, Download, Calendar as _Calendar, Filter as _Filter, Clock, Eye as _Eye, Play,
  Pause, MoreHorizontal, Maximize2, Grid, List as _List, Search as _Search,
} from 'lucide-react';
import './AnalyticsDashboard.css';

// ============================================================================
// Types
// ============================================================================

type AnalyticsTab = 'dashboards' | 'reports' | 'metrics' | 'alerts' | 'usage';

interface WidgetData {
  labels: string[];
  values: number[];
  series?: { name: string; data: number[] }[];
}

// ============================================================================
// Component
// ============================================================================

export const AnalyticsDashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboards');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboards State
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [widgetData, _setWidgetData] = useState<Record<string, WidgetData>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Reports State
  const [reports, setReports] = useState<Report[]>([]);
  const [_selectedReport, _setSelectedReport] = useState<Report | null>(null);
  const [reportRunning, setReportRunning] = useState<string | null>(null);

  // Metrics State
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [_metricData, _setMetricData] = useState<{ labels: string[]; values: number[] } | null>(null);

  // Alerts State
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<MetricAlert[]>([]);

  // Usage State
  const [usageData, setUsageData] = useState<{
    activeUsers: number;
    totalSessions: number;
    avgDuration: number;
    topFeatures: { feature: string; count: number }[];
  } | null>(null);

  // Time Range
  const [timeRange, setTimeRange] = useState<TimeRange>({
    type: 'relative',
    relative: { value: 7, unit: 'days' },
    start: Date.now() - 7 * 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadDashboards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DashboardService.list({});
      setDashboards(data);
      if (data.length > 0 && !selectedDashboard) {
        setSelectedDashboard(data[0]);
      }
    } catch (_err) {
      setError('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  }, [selectedDashboard]);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ReportService.list({});
      setReports(data);
    } catch (_err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await MetricService.list();
      setMetrics(data);
    } catch (_err) {
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [all, active] = await Promise.all([
        MetricAlertService.list({}),
        MetricAlertService.getActive(),
      ]);
      setAlerts(all);
      setActiveAlerts(active);
    } catch (_err) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsageData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UsageAnalyticsService.getUsage(timeRange);
      setUsageData({
        activeUsers: data.activeUsers,
        totalSessions: data.totalSessions,
        avgDuration: data.averageSessionDuration,
        topFeatures: data.topFeatures,
      });
    } catch (_err) {
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Initial load based on tab
  useEffect(() => {
    switch (activeTab) {
      case 'dashboards':
        loadDashboards();
        break;
      case 'reports':
        loadReports();
        break;
      case 'metrics':
        loadMetrics();
        break;
      case 'alerts':
        loadAlerts();
        break;
      case 'usage':
        loadUsageData();
        break;
    }
  }, [activeTab, loadDashboards, loadReports, loadMetrics, loadAlerts, loadUsageData]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCreateDashboard = async () => {
    try {
      setLoading(true);
      const newDashboard = await DashboardService.create({
        name: 'New Dashboard',
        description: 'A new analytics dashboard',
        ownerId: 'current-user',
        isDefault: false,
        isPublic: false,
        layout: { columns: 12, rowHeight: 80, spacing: 16, type: 'grid', positions: [] },
        widgets: [],
        timeRange: { type: 'relative', relative: { value: 7, unit: 'days' } },
        tags: [],
      });
      setDashboards([...dashboards, newDashboard]);
      setSelectedDashboard(newDashboard);
      setSuccess('Dashboard created');
    } catch (_err) {
      setError('Failed to create dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      setLoading(true);
      await DashboardService.delete(dashboardId);
      setDashboards(dashboards.filter(d => d.id !== dashboardId));
      if (selectedDashboard?.id === dashboardId) {
        setSelectedDashboard(dashboards[0] || null);
      }
      setSuccess('Dashboard deleted');
    } catch (_err) {
      setError('Failed to delete dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRunReport = async (reportId: string) => {
    try {
      setReportRunning(reportId);
      const run = await ReportService.run(reportId);
      setSuccess(`Report started: ${run.id}`);
    } catch (_err) {
      setError('Failed to run report');
    } finally {
      setReportRunning(null);
    }
  };

  const handleToggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      await MetricAlertService.setEnabled(alertId, enabled);
      await loadAlerts();
      setSuccess(`Alert ${enabled ? 'enabled' : 'disabled'}`);
    } catch (_err) {
      setError('Failed to toggle alert');
    }
  };

  const handleExportData = async (type: string) => {
    try {
      setLoading(true);
      const exportUrl = await DataExportService.export(
        {
          metrics: [type],
          timeRange: timeRange,
        },
        'csv'
      );
      setSuccess(`Export complete: ${exportUrl}`);
    } catch (_err) {
      setError('Failed to create export');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderDashboardsTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Dashboards</h3>
          <span className="count">{dashboards.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setIsEditMode(!isEditMode)}>
            <Settings size={16} />
            {isEditMode ? 'Done' : 'Edit'}
          </button>
          <button className="btn-primary" onClick={handleCreateDashboard}>
            <Plus size={16} />
            New Dashboard
          </button>
        </div>
      </div>

      <div className="dashboards-layout">
        {/* Dashboard Sidebar */}
        <div className="dashboard-list">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className={`dashboard-item ${selectedDashboard?.id === dashboard.id ? 'active' : ''}`}
              onClick={() => setSelectedDashboard(dashboard)}
            >
              <div className="dashboard-info">
                <span className="dashboard-name">{dashboard.name}</span>
                <span className="dashboard-widgets">{dashboard.widgets.length} widgets</span>
              </div>
              {isEditMode && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDashboard(dashboard.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {dashboards.length === 0 && (
            <div className="empty-list">
              <BarChart3 size={32} />
              <p>No dashboards yet</p>
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {selectedDashboard ? (
            <>
              <div className="dashboard-header">
                <h4>{selectedDashboard.name}</h4>
                <div className="dashboard-actions">
                  <select
                    value={`${timeRange.relative?.value}_${timeRange.relative?.unit}` || 'custom'}
                    onChange={(e) => {
                      const presets: Record<string, { value: number; unit: 'minutes' | 'hours' | 'days' }> = {
                        '1_hours': { value: 1, unit: 'hours' },
                        '24_hours': { value: 24, unit: 'hours' },
                        '7_days': { value: 7, unit: 'days' },
                        '30_days': { value: 30, unit: 'days' },
                      };
                      const preset = presets[e.target.value];
                      if (preset) {
                        const durationMs = preset.value * (preset.unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
                        setTimeRange({
                          type: 'relative',
                          relative: preset,
                          start: Date.now() - durationMs,
                          end: Date.now(),
                        });
                      }
                    }}
                  >
                    <option value="1_hours">Last Hour</option>
                    <option value="24_hours">Last 24 Hours</option>
                    <option value="7_days">Last 7 Days</option>
                    <option value="30_days">Last 30 Days</option>
                  </select>
                  <button className="btn-icon" onClick={loadDashboards}>
                    <RefreshCw size={16} />
                  </button>
                  <button className="btn-icon">
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>

              <div className="widgets-grid">
                {selectedDashboard.widgets.length > 0 ? (
                  selectedDashboard.widgets.map((widget) => {
                    const position = selectedDashboard.layout.positions.find(p => p.widgetId === widget.id);
                    return (
                      <div
                        key={widget.id}
                        className="widget-card"
                        style={{
                          gridColumn: `span ${position?.width || 4}`,
                          gridRow: `span ${Math.ceil((position?.height || 200) / 80)}`,
                        }}
                      >
                        <div className="widget-header">
                          <span className="widget-title">{widget.title}</span>
                          <button className="widget-menu">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                        <div className="widget-content">
                          {renderWidgetContent(widget)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-dashboard">
                    <Grid size={48} />
                    <h4>No widgets yet</h4>
                    <p>Add widgets to visualize your data</p>
                    <button className="btn-primary">
                      <Plus size={16} />
                      Add Widget
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <BarChart3 size={48} />
              <h4>Select a dashboard</h4>
              <p>Choose a dashboard from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderWidgetContent = (widget: DashboardWidget) => {
    // Placeholder visualization based on widget type
    const data = widgetData[widget.id] || {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [65, 78, 90, 81, 56, 55, 40],
    };

    switch (widget.type) {
      case 'line-chart':
        return (
          <div className="chart-placeholder line">
            <svg viewBox="0 0 200 80" className="chart-svg">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={data.values.map((v, i) => `${i * 30 + 10},${80 - v * 0.8}`).join(' ')}
              />
            </svg>
          </div>
        );

      case 'bar-chart':
        return (
          <div className="chart-placeholder bar">
            <div className="bars">
              {data.values.map((v, i) => (
                <div key={i} className="bar" style={{ height: `${v}%` }}>
                  <span className="bar-label">{data.labels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'metric':
        return (
          <div className="number-widget">
            <span className="number-value">1,234</span>
            <span className="number-change positive">
              <TrendingUp size={14} />
              +12.5%
            </span>
          </div>
        );

      case 'gauge':
        return (
          <div className="gauge-widget">
            <div className="gauge-circle">
              <span className="gauge-value">78%</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="widget-placeholder">
            <Activity size={24} />
            <span>{widget.type}</span>
          </div>
        );
    }
  };

  const renderReportsTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Reports</h3>
          <span className="count">{reports.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Report
          </button>
        </div>
      </div>

      <div className="reports-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Schedule</th>
              <th>Last Run</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <div className="report-name">
                    <FileText size={16} />
                    <span>{report.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`type-badge ${report.type}`}>{report.type}</span>
                </td>
                <td>
                  {report.schedule ? (
                    <span className="schedule">
                      <Clock size={14} />
                      {report.schedule.frequency} at {report.schedule.time}
                    </span>
                  ) : (
                    <span className="no-schedule">Manual</span>
                  )}
                </td>
                <td>
                  {report.lastRun?.completedAt
                    ? new Date(report.lastRun.completedAt).toLocaleString()
                    : 'Never'}
                </td>
                <td>
                  <span className="status-badge">Ready</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => handleRunReport(report.id)}
                      disabled={reportRunning === report.id}
                    >
                      {reportRunning === report.id ? (
                        <RefreshCw className="spin" size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                    </button>
                    <button className="btn-icon">
                      <Edit size={14} />
                    </button>
                    <button className="btn-icon">
                      <Download size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  <FileText size={32} />
                  <p>No reports created yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Metrics</h3>
          <span className="count">{metrics.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => handleExportData('metrics')}>
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Metric
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className={`metric-card ${selectedMetric?.name === metric.name ? 'selected' : ''}`}
            onClick={() => setSelectedMetric(metric)}
          >
            <div className="metric-header">
              <span className="metric-name">{metric.displayName}</span>
              <span className={`metric-type ${metric.type}`}>{metric.type}</span>
            </div>
            <div className="metric-value">
              <span className="value">{metric.value?.toLocaleString() ?? '--'}</span>
              {metric.unit && <span className="unit">{metric.unit}</span>}
            </div>
            <div className="metric-sparkline">
              <svg viewBox="0 0 100 30" className="sparkline">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 100,8"
                />
              </svg>
            </div>
            <div className="metric-footer">
              <span className="category">{metric.category}</span>
              <span className="trend">{metric.trend || 'stable'}</span>
            </div>
          </div>
        ))}
        {metrics.length === 0 && (
          <div className="empty-metrics">
            <Activity size={48} />
            <h4>No metrics defined</h4>
            <p>Create metrics to track your KPIs</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Alerts</h3>
          <span className="count">{alerts.length}</span>
          {activeAlerts.length > 0 && (
            <span className="active-count">{activeAlerts.length} active</span>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Alert
          </button>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div className="active-alerts">
          <h4>
            <AlertTriangle size={18} />
            Active Alerts
          </h4>
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="alert-item active">
              <div className="alert-icon">
                <Bell size={16} />
              </div>
              <div className="alert-info">
                <span className="alert-name">{alert.name}</span>
                <span className="alert-condition">
                  Metric {alert.condition.operator} {alert.condition.threshold}
                </span>
              </div>
              <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
              <button
                className="btn-icon"
                onClick={() => handleToggleAlert(alert.id, false)}
              >
                <Pause size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="alerts-list">
        <h4>All Alerts</h4>
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item ${alert.isEnabled ? '' : 'disabled'}`}>
            <div className="alert-icon">
              {alert.isEnabled ? <Bell size={16} /> : <Bell size={16} className="muted" />}
            </div>
            <div className="alert-info">
              <span className="alert-name">{alert.name}</span>
              <span className="alert-metric">{alert.metricName}</span>
            </div>
            <span className={`status-badge ${alert.status}`}>{alert.status}</span>
            <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
            <div className="alert-actions">
              <button
                className="btn-icon"
                onClick={() => handleToggleAlert(alert.id, !alert.isEnabled)}
              >
                {alert.isEnabled ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="btn-icon">
                <Edit size={14} />
              </button>
              <button className="btn-icon danger">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="empty-alerts">
            <Bell size={48} />
            <h4>No alerts configured</h4>
            <p>Create alerts to monitor your metrics</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsageTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <div className="header-left">
          <h3>Usage Analytics</h3>
        </div>
        <div className="header-actions">
          <select
            value={`${timeRange.relative?.value}_${timeRange.relative?.unit}` || 'custom'}
            onChange={(e) => {
              const presets: Record<string, { value: number; unit: 'days' }> = {
                '7_days': { value: 7, unit: 'days' },
                '30_days': { value: 30, unit: 'days' },
                '90_days': { value: 90, unit: 'days' },
              };
              const preset = presets[e.target.value];
              if (preset) {
                const durationMs = preset.value * 24 * 60 * 60 * 1000;
                setTimeRange({
                  type: 'relative',
                  relative: preset,
                  start: Date.now() - durationMs,
                  end: Date.now(),
                });
              }
            }}
          >
            <option value="7_days">Last 7 Days</option>
            <option value="30_days">Last 30 Days</option>
            <option value="90_days">Last 90 Days</option>
          </select>
          <button className="btn-icon" onClick={loadUsageData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {usageData && (
        <>
          <div className="usage-overview">
            <div className="usage-card">
              <div className="usage-icon">
                <Users size={24} />
              </div>
              <div className="usage-info">
                <span className="usage-value">{usageData.activeUsers.toLocaleString()}</span>
                <span className="usage-label">Active Users</span>
              </div>
            </div>
            <div className="usage-card">
              <div className="usage-icon">
                <Activity size={24} />
              </div>
              <div className="usage-info">
                <span className="usage-value">{usageData.totalSessions.toLocaleString()}</span>
                <span className="usage-label">Total Sessions</span>
              </div>
            </div>
            <div className="usage-card">
              <div className="usage-icon">
                <Clock size={24} />
              </div>
              <div className="usage-info">
                <span className="usage-value">{Math.round(usageData.avgDuration / 60)}m</span>
                <span className="usage-label">Avg. Session Duration</span>
              </div>
            </div>
          </div>

          <div className="usage-details">
            <div className="top-features">
              <h4>Top Features</h4>
              <div className="features-list">
                {usageData.topFeatures.map((feature, index) => (
                  <div key={feature.feature} className="feature-item">
                    <span className="feature-rank">#{index + 1}</span>
                    <span className="feature-name">{feature.feature}</span>
                    <span className="feature-count">{feature.count.toLocaleString()}</span>
                    <div className="feature-bar">
                      <div
                        className="feature-fill"
                        style={{
                          width: `${(feature.count / usageData.topFeatures[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {usageData.topFeatures.length === 0 && (
                  <p className="no-data">No feature usage data yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboards':
        return renderDashboardsTab();
      case 'reports':
        return renderReportsTab();
      case 'metrics':
        return renderMetricsTab();
      case 'alerts':
        return renderAlertsTab();
      case 'usage':
        return renderUsageTab();
      default:
        return renderDashboardsTab();
    }
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  const FileText = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );

  const Users = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <BarChart3 size={32} />
          <div>
            <h2>Analytics & Reports</h2>
            <p>Monitor metrics, create dashboards, and generate reports</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notification error">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="notification success">
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        {[
          { id: 'dashboards' as const, label: 'Dashboards', icon: <Grid size={16} /> },
          { id: 'reports' as const, label: 'Reports', icon: <FileText size={16} /> },
          { id: 'metrics' as const, label: 'Metrics', icon: <Activity size={16} /> },
          { id: 'alerts' as const, label: 'Alerts', icon: <Bell size={16} /> },
          { id: 'usage' as const, label: 'Usage', icon: <TrendingUp size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="analytics-content">
        {loading && (
          <div className="loading-overlay">
            <RefreshCw className="spin" size={24} />
            Loading...
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
