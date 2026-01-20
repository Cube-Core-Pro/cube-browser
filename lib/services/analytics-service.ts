/**
 * Analytics Service - Dashboards & Reporting
 *
 * Enterprise-grade analytics with dashboards, custom reports,
 * data visualization, and export capabilities.
 *
 * M5 Features:
 * - Dashboard builder
 * - Custom reports
 * - Data visualization
 * - Real-time metrics
 * - Export capabilities
 * - Scheduled reports
 * - Alerts & thresholds
 * - Data aggregation
 *
 * @module AnalyticsService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';

// ============================================================================
// Dashboard Types
// ============================================================================

export interface Dashboard {
  /**
   * Dashboard ID
   */
  id: string;

  /**
   * Dashboard name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Layout configuration
   */
  layout: DashboardLayout;

  /**
   * Widgets
   */
  widgets: DashboardWidget[];

  /**
   * Time range
   */
  timeRange: TimeRange;

  /**
   * Auto-refresh interval (seconds)
   */
  refreshInterval?: number;

  /**
   * Is default dashboard
   */
  isDefault: boolean;

  /**
   * Is public
   */
  isPublic: boolean;

  /**
   * Owner
   */
  ownerId: string;

  /**
   * Tags
   */
  tags: string[];

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export interface DashboardLayout {
  /**
   * Layout type
   */
  type: 'grid' | 'freeform';

  /**
   * Columns (for grid)
   */
  columns: number;

  /**
   * Row height (pixels)
   */
  rowHeight: number;

  /**
   * Widget positions
   */
  positions: WidgetPosition[];

  /**
   * Spacing between widgets
   */
  spacing?: number;
}

export interface WidgetPosition {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  /**
   * Widget ID
   */
  id: string;

  /**
   * Widget type
   */
  type: WidgetType;

  /**
   * Title
   */
  title: string;

  /**
   * Subtitle
   */
  subtitle?: string;

  /**
   * Data source
   */
  dataSource: WidgetDataSource;

  /**
   * Visualization config
   */
  visualization: VisualizationConfig;

  /**
   * Filters
   */
  filters?: WidgetFilter[];

  /**
   * Custom styles
   */
  styles?: Record<string, unknown>;
}

export type WidgetType =
  | 'metric'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'area-chart'
  | 'scatter-plot'
  | 'heatmap'
  | 'table'
  | 'list'
  | 'text'
  | 'map'
  | 'gauge'
  | 'sparkline'
  | 'funnel'
  | 'sankey'
  | 'treemap'
  | 'custom';

export interface WidgetDataSource {
  /**
   * Data source type
   */
  type: 'query' | 'metric' | 'static' | 'realtime';

  /**
   * Query (for query type)
   */
  query?: string;

  /**
   * Metric name (for metric type)
   */
  metricName?: string;

  /**
   * Static data (for static type)
   */
  staticData?: unknown;

  /**
   * Aggregation
   */
  aggregation?: AggregationType;

  /**
   * Group by
   */
  groupBy?: string[];

  /**
   * Order by
   */
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };

  /**
   * Limit
   */
  limit?: number;
}

export type AggregationType =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'median'
  | 'percentile'
  | 'rate'
  | 'cardinality';

export interface VisualizationConfig {
  /**
   * Chart options
   */
  chartOptions?: {
    showLegend?: boolean;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right';
    showGrid?: boolean;
    showTooltip?: boolean;
    stacked?: boolean;
    smooth?: boolean;
  };

  /**
   * Color scheme
   */
  colorScheme?: string | string[];

  /**
   * X-axis config
   */
  xAxis?: {
    field: string;
    label?: string;
    format?: string;
  };

  /**
   * Y-axis config
   */
  yAxis?: {
    field: string;
    label?: string;
    format?: string;
    min?: number;
    max?: number;
  };

  /**
   * Thresholds
   */
  thresholds?: {
    value: number;
    color: string;
    label?: string;
  }[];

  /**
   * Format options
   */
  format?: {
    type: 'number' | 'currency' | 'percent' | 'duration' | 'bytes' | 'date';
    precision?: number;
    prefix?: string;
    suffix?: string;
  };
}

export interface WidgetFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex';
  value: unknown;
}

export interface TimeRange {
  /**
   * Type
   */
  type: 'relative' | 'absolute';

  /**
   * Relative (for relative type)
   */
  relative?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  };

  /**
   * Absolute (for absolute type)
   */
  absolute?: {
    start: number;
    end: number;
  };

  /**
   * Direct start/end (for backwards compatibility)
   */
  start?: number | Date;
  end?: number | Date;
}

// ============================================================================
// Report Types
// ============================================================================

export interface Report {
  /**
   * Report ID
   */
  id: string;

  /**
   * Report name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Report type
   */
  type: ReportType;

  /**
   * Configuration
   */
  config: ReportConfig;

  /**
   * Schedule
   */
  schedule?: ReportSchedule;

  /**
   * Recipients
   */
  recipients: ReportRecipient[];

  /**
   * Format
   */
  format: ReportFormat;

  /**
   * Owner
   */
  ownerId: string;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Last run
   */
  lastRun?: ReportRun;

  /**
   * Tags
   */
  tags: string[];

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export type ReportType =
  | 'summary'
  | 'detailed'
  | 'comparison'
  | 'trend'
  | 'custom';

export interface ReportConfig {
  /**
   * Data sources
   */
  dataSources: ReportDataSource[];

  /**
   * Sections
   */
  sections: ReportSection[];

  /**
   * Time range
   */
  timeRange: TimeRange;

  /**
   * Filters
   */
  filters?: WidgetFilter[];

  /**
   * Compare with previous period
   */
  comparePrevious?: boolean;

  /**
   * Branding
   */
  branding?: {
    logo?: string;
    primaryColor?: string;
    footerText?: string;
  };
}

export interface ReportDataSource {
  id: string;
  name: string;
  type: 'metric' | 'query' | 'dashboard';
  config: Record<string, unknown>;
}

export interface ReportSection {
  /**
   * Section ID
   */
  id: string;

  /**
   * Section title
   */
  title: string;

  /**
   * Section type
   */
  type: 'summary' | 'chart' | 'table' | 'text' | 'metric';

  /**
   * Content config
   */
  content: Record<string, unknown>;

  /**
   * Order
   */
  order: number;
}

export interface ReportSchedule {
  /**
   * Is enabled
   */
  enabled: boolean;

  /**
   * Frequency
   */
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  /**
   * Day of week (for weekly)
   */
  dayOfWeek?: number;

  /**
   * Day of month (for monthly)
   */
  dayOfMonth?: number;

  /**
   * Time (HH:mm)
   */
  time: string;

  /**
   * Timezone
   */
  timezone: string;
}

export interface ReportRecipient {
  email: string;
  name?: string;
  includeAttachment: boolean;
}

export type ReportFormat =
  | 'pdf'
  | 'html'
  | 'csv'
  | 'xlsx'
  | 'json';

export interface ReportRun {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  outputUrl?: string;
  error?: string;
}

// ============================================================================
// Metric Types
// ============================================================================

export interface Metric {
  /**
   * Metric name
   */
  name: string;

  /**
   * Display name
   */
  displayName: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Category
   */
  category: MetricCategory;

  /**
   * Type
   */
  type: MetricType;

  /**
   * Unit
   */
  unit?: string;

  /**
   * Current value
   */
  value: number;

  /**
   * Previous value (for comparison)
   */
  previousValue?: number;

  /**
   * Change percentage
   */
  changePercent?: number;

  /**
   * Trend direction
   */
  trend?: 'up' | 'down' | 'stable';

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Tags
   */
  tags?: Record<string, string>;
}

export type MetricCategory =
  | 'performance'
  | 'usage'
  | 'errors'
  | 'business'
  | 'security'
  | 'automation'
  | 'custom';

export type MetricType =
  | 'counter'
  | 'gauge'
  | 'histogram'
  | 'summary'
  | 'rate';

export interface MetricSeries {
  name: string;
  points: MetricPoint[];
  tags?: Record<string, string>;
}

export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface MetricQuery {
  /**
   * Metric name(s)
   */
  metrics: string[];

  /**
   * Time range
   */
  timeRange: TimeRange;

  /**
   * Aggregation
   */
  aggregation?: AggregationType;

  /**
   * Interval
   */
  interval?: string;

  /**
   * Group by
   */
  groupBy?: string[];

  /**
   * Filters
   */
  filters?: MetricFilter[];
}

export interface MetricFilter {
  tag: string;
  operator: 'eq' | 'neq' | 'regex';
  value: string;
}

// ============================================================================
// Alert Types
// ============================================================================

export interface MetricAlert {
  /**
   * Alert ID
   */
  id: string;

  /**
   * Alert name
   */
  name: string;

  /**
   * Metric name
   */
  metricName: string;

  /**
   * Condition
   */
  condition: AlertCondition;

  /**
   * Severity
   */
  severity: AlertSeverity;

  /**
   * Notification channels
   */
  channels: NotificationChannelConfig[];

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Status
   */
  status: 'ok' | 'warning' | 'critical' | 'unknown';

  /**
   * Last triggered
   */
  lastTriggeredAt?: number;

  /**
   * Last value
   */
  lastValue?: number;

  /**
   * Creation time
   */
  createdAt: number;
}

export interface AlertCondition {
  /**
   * Operator
   */
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

  /**
   * Threshold
   */
  threshold: number;

  /**
   * Duration (seconds) - how long condition must be true
   */
  duration?: number;

  /**
   * Aggregation over duration
   */
  aggregation?: AggregationType;
}

export type AlertSeverity =
  | 'info'
  | 'warning'
  | 'critical';

export interface NotificationChannelConfig {
  type: 'email' | 'slack' | 'webhook' | 'push';
  config: Record<string, unknown>;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  alertName: string;
  severity: AlertSeverity;
  status: 'triggered' | 'resolved';
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolvedAt?: number;
}

// ============================================================================
// Dashboard Service
// ============================================================================

export const DashboardService = {
  /**
   * Create dashboard
   */
  create: async (
    dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Dashboard> => {
    TelemetryService.trackEvent('dashboard_created');

    return invoke<Dashboard>('dashboard_create', { dashboard });
  },

  /**
   * Get all dashboards
   */
  getAll: async (filters?: {
    isPublic?: boolean;
    tags?: string[];
  }): Promise<Dashboard[]> => {
    return invoke<Dashboard[]>('dashboard_get_all', { filters });
  },

  /**
   * Get dashboard by ID
   */
  get: async (dashboardId: string): Promise<Dashboard | null> => {
    return invoke<Dashboard | null>('dashboard_get', { dashboardId });
  },

  /**
   * Update dashboard
   */
  update: async (
    dashboardId: string,
    updates: Partial<Dashboard>
  ): Promise<Dashboard> => {
    return invoke<Dashboard>('dashboard_update', { dashboardId, updates });
  },

  /**
   * Delete dashboard
   */
  delete: async (dashboardId: string): Promise<void> => {
    return invoke('dashboard_delete', { dashboardId });
  },

  /**
   * Add widget
   */
  addWidget: async (
    dashboardId: string,
    widget: Omit<DashboardWidget, 'id'>,
    position: Omit<WidgetPosition, 'widgetId'>
  ): Promise<DashboardWidget> => {
    return invoke<DashboardWidget>('dashboard_add_widget', {
      dashboardId,
      widget,
      position,
    });
  },

  /**
   * Update widget
   */
  updateWidget: async (
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<DashboardWidget> => {
    return invoke<DashboardWidget>('dashboard_update_widget', {
      dashboardId,
      widgetId,
      updates,
    });
  },

  /**
   * Remove widget
   */
  removeWidget: async (
    dashboardId: string,
    widgetId: string
  ): Promise<void> => {
    return invoke('dashboard_remove_widget', { dashboardId, widgetId });
  },

  /**
   * Update layout
   */
  updateLayout: async (
    dashboardId: string,
    layout: DashboardLayout
  ): Promise<void> => {
    return invoke('dashboard_update_layout', { dashboardId, layout });
  },

  /**
   * Set as default
   */
  setDefault: async (dashboardId: string): Promise<void> => {
    return invoke('dashboard_set_default', { dashboardId });
  },

  /**
   * Duplicate dashboard
   */
  duplicate: async (
    dashboardId: string,
    newName: string
  ): Promise<Dashboard> => {
    return invoke<Dashboard>('dashboard_duplicate', { dashboardId, newName });
  },

  /**
   * Export dashboard
   */
  export: async (
    dashboardId: string,
    format: 'json' | 'pdf' | 'png'
  ): Promise<string> => {
    return invoke<string>('dashboard_export', { dashboardId, format });
  },

  /**
   * Import dashboard
   */
  import: async (data: string): Promise<Dashboard> => {
    return invoke<Dashboard>('dashboard_import', { data });
  },

  /**
   * Get widget data
   */
  getWidgetData: async (
    dashboardId: string,
    widgetId: string,
    timeRange?: TimeRange
  ): Promise<unknown> => {
    return invoke('dashboard_get_widget_data', {
      dashboardId,
      widgetId,
      timeRange,
    });
  },

  /**
   * Refresh widget
   */
  refreshWidget: async (
    dashboardId: string,
    widgetId: string
  ): Promise<unknown> => {
    return invoke('dashboard_refresh_widget', { dashboardId, widgetId });
  },

  /**
   * List dashboards (alias for getAll)
   */
  get list() {
    return this.getAll;
  },
};

// ============================================================================
// Report Service
// ============================================================================

export const ReportService = {
  /**
   * Create report
   */
  create: async (
    report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'lastRun'>
  ): Promise<Report> => {
    TelemetryService.trackEvent('report_created', { type: report.type });

    return invoke<Report>('report_create', { report });
  },

  /**
   * Get all reports
   */
  getAll: async (filters?: {
    type?: ReportType;
    tags?: string[];
    isEnabled?: boolean;
  }): Promise<Report[]> => {
    return invoke<Report[]>('report_get_all', { filters });
  },

  /**
   * Get report by ID
   */
  get: async (reportId: string): Promise<Report | null> => {
    return invoke<Report | null>('report_get', { reportId });
  },

  /**
   * Update report
   */
  update: async (
    reportId: string,
    updates: Partial<Report>
  ): Promise<Report> => {
    return invoke<Report>('report_update', { reportId, updates });
  },

  /**
   * Delete report
   */
  delete: async (reportId: string): Promise<void> => {
    return invoke('report_delete', { reportId });
  },

  /**
   * Run report
   */
  run: async (
    reportId: string,
    options?: {
      timeRange?: TimeRange;
      format?: ReportFormat;
      recipients?: string[];
    }
  ): Promise<ReportRun> => {
    TelemetryService.trackEvent('report_run');

    return invoke<ReportRun>('report_run', { reportId, options });
  },

  /**
   * Get run status
   */
  getRunStatus: async (runId: string): Promise<ReportRun> => {
    return invoke<ReportRun>('report_get_run_status', { runId });
  },

  /**
   * Get run history
   */
  getRunHistory: async (
    reportId: string,
    limit?: number
  ): Promise<ReportRun[]> => {
    return invoke<ReportRun[]>('report_get_run_history', { reportId, limit });
  },

  /**
   * Download report
   */
  download: async (runId: string): Promise<string> => {
    return invoke<string>('report_download', { runId });
  },

  /**
   * Preview report
   */
  preview: async (
    reportId: string,
    timeRange?: TimeRange
  ): Promise<string> => {
    return invoke<string>('report_preview', { reportId, timeRange });
  },

  /**
   * Enable/Disable schedule
   */
  setScheduleEnabled: async (
    reportId: string,
    enabled: boolean
  ): Promise<void> => {
    return invoke('report_set_schedule_enabled', { reportId, enabled });
  },

  /**
   * Update schedule
   */
  updateSchedule: async (
    reportId: string,
    schedule: ReportSchedule
  ): Promise<void> => {
    return invoke('report_update_schedule', { reportId, schedule });
  },

  /**
   * Duplicate report
   */
  duplicate: async (
    reportId: string,
    newName: string
  ): Promise<Report> => {
    return invoke<Report>('report_duplicate', { reportId, newName });
  },

  /**
   * List reports (alias for getAll)
   */
  get list() {
    return this.getAll;
  },
};

// ============================================================================
// Metric Service
// ============================================================================

export const MetricService = {
  /**
   * Get current metrics
   */
  getCurrent: async (
    metricNames?: string[]
  ): Promise<Metric[]> => {
    return invoke<Metric[]>('metric_get_current', { metricNames });
  },

  /**
   * Query metrics
   */
  query: async (query: MetricQuery): Promise<MetricSeries[]> => {
    return invoke<MetricSeries[]>('metric_query', { query });
  },

  /**
   * Get metric history
   */
  getHistory: async (
    metricName: string,
    timeRange: TimeRange,
    interval?: string
  ): Promise<MetricSeries> => {
    return invoke<MetricSeries>('metric_get_history', {
      metricName,
      timeRange,
      interval,
    });
  },

  /**
   * Get metric categories
   */
  getCategories: async (): Promise<{
    category: MetricCategory;
    count: number;
    metrics: string[];
  }[]> => {
    return invoke('metric_get_categories');
  },

  /**
   * Record custom metric
   */
  record: async (
    name: string,
    value: number,
    tags?: Record<string, string>
  ): Promise<void> => {
    return invoke('metric_record', { name, value, tags });
  },

  /**
   * Define custom metric
   */
  define: async (metric: {
    name: string;
    displayName: string;
    description?: string;
    category: MetricCategory;
    type: MetricType;
    unit?: string;
  }): Promise<void> => {
    return invoke('metric_define', { metric });
  },

  /**
   * Get metric metadata
   */
  getMetadata: async (metricName: string): Promise<{
    name: string;
    displayName: string;
    description?: string;
    category: MetricCategory;
    type: MetricType;
    unit?: string;
  } | null> => {
    return invoke('metric_get_metadata', { metricName });
  },

  /**
   * Get aggregate
   */
  getAggregate: async (
    metricName: string,
    aggregation: AggregationType,
    timeRange: TimeRange
  ): Promise<number> => {
    return invoke<number>('metric_get_aggregate', {
      metricName,
      aggregation,
      timeRange,
    });
  },

  /**
   * Compare periods
   */
  comparePeriods: async (
    metricName: string,
    period1: TimeRange,
    period2: TimeRange,
    aggregation?: AggregationType
  ): Promise<{
    period1Value: number;
    period2Value: number;
    changePercent: number;
    changeAbsolute: number;
  }> => {
    return invoke('metric_compare_periods', {
      metricName,
      period1,
      period2,
      aggregation,
    });
  },

  /**
   * List metrics (alias for getCurrent)
   */
  get list() {
    return this.getCurrent;
  },
};

// ============================================================================
// Alert Service
// ============================================================================

export const MetricAlertService = {
  /**
   * Create alert
   */
  create: async (
    alert: Omit<MetricAlert, 'id' | 'createdAt' | 'status' | 'lastTriggeredAt' | 'lastValue'>
  ): Promise<MetricAlert> => {
    return invoke<MetricAlert>('metric_alert_create', { alert });
  },

  /**
   * Get all alerts
   */
  getAll: async (filters?: {
    severity?: AlertSeverity;
    status?: string;
    isEnabled?: boolean;
  }): Promise<MetricAlert[]> => {
    return invoke<MetricAlert[]>('metric_alert_get_all', { filters });
  },

  /**
   * Get alert by ID
   */
  get: async (alertId: string): Promise<MetricAlert | null> => {
    return invoke<MetricAlert | null>('metric_alert_get', { alertId });
  },

  /**
   * Update alert
   */
  update: async (
    alertId: string,
    updates: Partial<MetricAlert>
  ): Promise<MetricAlert> => {
    return invoke<MetricAlert>('metric_alert_update', { alertId, updates });
  },

  /**
   * Delete alert
   */
  delete: async (alertId: string): Promise<void> => {
    return invoke('metric_alert_delete', { alertId });
  },

  /**
   * Enable/Disable
   */
  setEnabled: async (alertId: string, enabled: boolean): Promise<void> => {
    return invoke('metric_alert_set_enabled', { alertId, enabled });
  },

  /**
   * Get events
   */
  getEvents: async (
    alertId?: string,
    options?: {
      status?: 'triggered' | 'resolved';
      startDate?: number;
      endDate?: number;
      limit?: number;
    }
  ): Promise<AlertEvent[]> => {
    return invoke<AlertEvent[]>('metric_alert_get_events', {
      alertId,
      options,
    });
  },

  /**
   * Acknowledge event
   */
  acknowledgeEvent: async (eventId: string): Promise<void> => {
    return invoke('metric_alert_acknowledge', { eventId });
  },

  /**
   * Test alert
   */
  test: async (alertId: string): Promise<{
    wouldTrigger: boolean;
    currentValue: number;
    threshold: number;
  }> => {
    return invoke('metric_alert_test', { alertId });
  },

  /**
   * List alerts (alias for getAll)
   */
  get list() {
    return this.getAll;
  },

  /**
   * Get active alerts
   */
  getActive: async (): Promise<MetricAlert[]> => {
    const all = await invoke<MetricAlert[]>('metric_alert_get_all', {});
    return all.filter(a => a.isEnabled && a.status !== 'unknown');
  },
};

// ============================================================================
// Data Export Service
// ============================================================================

export const DataExportService = {
  /**
   * Export data
   */
  export: async (
    query: MetricQuery,
    format: 'csv' | 'json' | 'xlsx' | 'parquet'
  ): Promise<string> => {
    return invoke<string>('data_export', { query, format });
  },

  /**
   * Schedule export
   */
  scheduleExport: async (
    query: MetricQuery,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      timezone: string;
      format: 'csv' | 'json' | 'xlsx' | 'parquet';
      destination: 'email' | 's3' | 'gcs' | 'azure-blob' | 'webhook';
      destinationConfig: Record<string, unknown>;
    }
  ): Promise<{ id: string }> => {
    return invoke('data_export_schedule', { query, schedule });
  },

  /**
   * Get scheduled exports
   */
  getScheduled: async (): Promise<{
    id: string;
    query: MetricQuery;
    schedule: Record<string, unknown>;
    isEnabled: boolean;
    lastRun?: number;
  }[]> => {
    return invoke('data_export_get_scheduled');
  },

  /**
   * Delete scheduled export
   */
  deleteScheduled: async (exportId: string): Promise<void> => {
    return invoke('data_export_delete_scheduled', { exportId });
  },
};

// ============================================================================
// Usage Analytics Service
// ============================================================================

export const UsageAnalyticsService = {
  /**
   * Get usage summary
   */
  getSummary: async (
    timeRange: TimeRange
  ): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    topFeatures: { feature: string; count: number }[];
    topPages: { page: string; views: number }[];
  }> => {
    return invoke('usage_get_summary', { timeRange });
  },

  /**
   * Get user activity
   */
  getUserActivity: async (
    userId: string,
    timeRange: TimeRange
  ): Promise<{
    sessions: { startedAt: number; duration: number; pages: string[] }[];
    actions: { action: string; count: number }[];
    lastActive: number;
  }> => {
    return invoke('usage_get_user_activity', { userId, timeRange });
  },

  /**
   * Get feature usage
   */
  getFeatureUsage: async (
    feature: string,
    timeRange: TimeRange
  ): Promise<{
    totalUses: number;
    uniqueUsers: number;
    trend: { date: string; count: number }[];
  }> => {
    return invoke('usage_get_feature', { feature, timeRange });
  },

  /**
   * Get retention
   */
  getRetention: async (
    cohortType: 'day' | 'week' | 'month',
    periods: number
  ): Promise<{
    cohort: string;
    size: number;
    retention: number[];
  }[]> => {
    return invoke('usage_get_retention', { cohortType, periods });
  },

  /**
   * Get funnel
   */
  getFunnel: async (
    steps: string[],
    timeRange: TimeRange
  ): Promise<{
    step: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }[]> => {
    return invoke('usage_get_funnel', { steps, timeRange });
  },

  /**
   * Get usage (alias for getSummary)
   */
  get getUsage() {
    return this.getSummary;
  },
};

// ============================================================================
// Export
// ============================================================================

export const AnalyticsServices = {
  Dashboard: DashboardService,
  Report: ReportService,
  Metric: MetricService,
  Alert: MetricAlertService,
  DataExport: DataExportService,
  Usage: UsageAnalyticsService,
};

export default AnalyticsServices;
