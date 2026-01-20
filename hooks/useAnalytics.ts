/**
 * CUBE Elite v7 - useAnalytics Hook
 * 
 * Centralized React hook for Analytics functionality.
 * Provides state management for dashboards, reports, metrics, and alerts.
 * 
 * Features:
 * - Dashboard CRUD with widget management
 * - Report generation and scheduling
 * - Metric tracking and visualization
 * - Alert configuration and monitoring
 * - Real-time data updates
 * 
 * @module hooks/useAnalytics
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { logger } from '@/lib/services/logger-service';
import {
  DashboardService,
  ReportService,
  MetricService,
  MetricAlertService,
  Dashboard,
  DashboardWidget,
  WidgetPosition,
  Report,
  ReportSchedule,
  ReportFormat,
  Metric,
  MetricQuery,
  MetricSeries,
  MetricAlert,
  MetricCategory,
  MetricType,
  AlertEvent,
  TimeRange,
} from '@/lib/services/analytics-service';

const log = logger.scope('useAnalytics');

// =============================================================================
// Types
// =============================================================================

export interface UseAnalyticsOptions {
  /** Auto-refresh interval in milliseconds */
  autoRefresh?: number;
  /** Enable real-time updates */
  realtime?: boolean;
  /** Default dashboard ID to load */
  defaultDashboardId?: string;
}

export interface AnalyticsState {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  reports: Report[];
  metrics: Metric[];
  metricCategories: string[];
  alerts: MetricAlert[];
  alertEvents: AlertEvent[];
}

export interface AnalyticsLoadingState {
  dashboards: boolean;
  reports: boolean;
  metrics: boolean;
  alerts: boolean;
  global: boolean;
}

export interface AnalyticsErrorState {
  dashboards: string | null;
  reports: string | null;
  metrics: string | null;
  alerts: string | null;
}

export interface UseAnalyticsReturn {
  // State
  data: AnalyticsState;
  loading: AnalyticsLoadingState;
  errors: AnalyticsErrorState;
  
  // Dashboard Actions
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Dashboard>;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => Promise<Dashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  loadDashboard: (id: string) => Promise<Dashboard | null>;
  setDefaultDashboard: (id: string) => Promise<void>;
  
  // Widget Actions
  addWidget: (dashboardId: string, widget: Omit<DashboardWidget, 'id'>, position: Omit<WidgetPosition, 'widgetId'>) => Promise<DashboardWidget>;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>) => Promise<DashboardWidget>;
  removeWidget: (dashboardId: string, widgetId: string) => Promise<void>;
  getWidgetData: (dashboardId: string, widgetId: string, timeRange?: TimeRange) => Promise<unknown>;
  refreshWidget: (dashboardId: string, widgetId: string) => Promise<unknown>;
  
  // Report Actions
  createReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'lastRun'>) => Promise<Report>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
  runReport: (id: string, options?: { timeRange?: TimeRange; format?: ReportFormat; recipients?: string[] }) => Promise<unknown>;
  scheduleReport: (id: string, schedule: ReportSchedule) => Promise<void>;
  
  // Metric Actions
  recordMetric: (name: string, value: number, tags?: Record<string, string>) => Promise<void>;
  queryMetrics: (query: MetricQuery) => Promise<MetricSeries[]>;
  getMetricHistory: (metricName: string, timeRange: TimeRange, interval?: string) => Promise<MetricSeries>;
  defineMetric: (metric: { name: string; displayName: string; description?: string; category: MetricCategory; type: MetricType; unit?: string }) => Promise<void>;
  
  // Alert Actions
  createAlert: (alert: Omit<MetricAlert, 'id' | 'createdAt' | 'status' | 'lastTriggeredAt' | 'lastValue'>) => Promise<MetricAlert>;
  updateAlert: (id: string, updates: Partial<MetricAlert>) => Promise<MetricAlert>;
  deleteAlert: (id: string) => Promise<void>;
  acknowledgeAlertEvent: (eventId: string) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
  refreshDashboards: () => Promise<void>;
  refreshReports: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  
  // Computed
  activeDashboards: Dashboard[];
  scheduledReports: Report[];
  activeAlerts: MetricAlert[];
  unacknowledgedEvents: AlertEvent[];
}

// =============================================================================
// Cache
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 30000; // 30 seconds for analytics (more fresh data)
const cache: Map<string, CacheEntry<unknown>> = new Map();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { autoRefresh, realtime = true, defaultDashboardId } = options;
  
  // State
  const [data, setData] = useState<AnalyticsState>({
    dashboards: [],
    currentDashboard: null,
    reports: [],
    metrics: [],
    metricCategories: [],
    alerts: [],
    alertEvents: [],
  });
  
  const [loading, setLoading] = useState<AnalyticsLoadingState>({
    dashboards: false,
    reports: false,
    metrics: false,
    alerts: false,
    global: true,
  });
  
  const [errors, setErrors] = useState<AnalyticsErrorState>({
    dashboards: null,
    reports: null,
    metrics: null,
    alerts: null,
  });
  
  // Refs
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ==========================================================================
  // Data Fetching
  // ==========================================================================
  
  const fetchDashboards = useCallback(async () => {
    const cached = getCached<Dashboard[]>('dashboards');
    
    if (cached) {
      setData(prev => ({ ...prev, dashboards: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, dashboards: true }));
    setErrors(prev => ({ ...prev, dashboards: null }));
    
    try {
      const dashboards = await DashboardService.getAll();
      setData(prev => ({ ...prev, dashboards }));
      setCache('dashboards', dashboards);
      
      // Load default dashboard if specified
      if (defaultDashboardId && !data.currentDashboard) {
        const defaultDash = dashboards.find(d => d.id === defaultDashboardId);
        if (defaultDash) {
          setData(prev => ({ ...prev, currentDashboard: defaultDash }));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboards';
      setErrors(prev => ({ ...prev, dashboards: message }));
      log.error('useAnalytics: Failed to fetch dashboards:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboards: false }));
    }
  }, [defaultDashboardId, data.currentDashboard]);
  
  const fetchReports = useCallback(async () => {
    const cached = getCached<Report[]>('reports');
    
    if (cached) {
      setData(prev => ({ ...prev, reports: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, reports: true }));
    setErrors(prev => ({ ...prev, reports: null }));
    
    try {
      const reports = await ReportService.getAll();
      setData(prev => ({ ...prev, reports }));
      setCache('reports', reports);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch reports';
      setErrors(prev => ({ ...prev, reports: message }));
      log.error('useAnalytics: Failed to fetch reports:', error);
    } finally {
      setLoading(prev => ({ ...prev, reports: false }));
    }
  }, []);
  
  const fetchMetrics = useCallback(async () => {
    const cached = getCached<Metric[]>('metrics');
    
    if (cached) {
      setData(prev => ({ ...prev, metrics: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, metrics: true }));
    setErrors(prev => ({ ...prev, metrics: null }));
    
    try {
      const metrics = await MetricService.getCurrent();
      setData(prev => ({ ...prev, metrics }));
      setCache('metrics', metrics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch metrics';
      setErrors(prev => ({ ...prev, metrics: message }));
      log.error('useAnalytics: Failed to fetch metrics:', error);
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  }, []);
  
  const fetchAlerts = useCallback(async () => {
    const cached = getCached<MetricAlert[]>('alerts');
    
    if (cached) {
      setData(prev => ({ ...prev, alerts: cached }));
      return;
    }
    
    setLoading(prev => ({ ...prev, alerts: true }));
    setErrors(prev => ({ ...prev, alerts: null }));
    
    try {
      const alerts = await MetricAlertService.getAll();
      setData(prev => ({ ...prev, alerts }));
      setCache('alerts', alerts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch alerts';
      setErrors(prev => ({ ...prev, alerts: message }));
      log.error('useAnalytics: Failed to fetch alerts:', error);
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);
  
  // ==========================================================================
  // Refresh Functions
  // ==========================================================================
  
  const refresh = useCallback(async () => {
    invalidateCache();
    setLoading(prev => ({ ...prev, global: true }));
    
    await Promise.all([
      fetchDashboards(),
      fetchReports(),
      fetchMetrics(),
      fetchAlerts(),
    ]);
    
    setLoading(prev => ({ ...prev, global: false }));
  }, [fetchDashboards, fetchReports, fetchMetrics, fetchAlerts]);
  
  const refreshDashboards = useCallback(async () => {
    invalidateCache('dashboards');
    await fetchDashboards();
  }, [fetchDashboards]);
  
  const refreshReports = useCallback(async () => {
    invalidateCache('reports');
    await fetchReports();
  }, [fetchReports]);
  
  const refreshMetrics = useCallback(async () => {
    invalidateCache('metrics');
    await fetchMetrics();
  }, [fetchMetrics]);
  
  const refreshAlerts = useCallback(async () => {
    invalidateCache('alerts');
    await fetchAlerts();
  }, [fetchAlerts]);
  
  // ==========================================================================
  // Dashboard Actions
  // ==========================================================================
  
  const createDashboard = useCallback(async (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDashboard = await DashboardService.create(dashboard);
    
    setData(prev => ({
      ...prev,
      dashboards: [newDashboard, ...prev.dashboards],
    }));
    
    invalidateCache('dashboards');
    return newDashboard;
  }, []);
  
  const updateDashboard = useCallback(async (id: string, updates: Partial<Dashboard>) => {
    const dashboard = await DashboardService.update(id, updates);
    
    setData(prev => ({
      ...prev,
      dashboards: prev.dashboards.map(d => d.id === id ? dashboard : d),
      currentDashboard: prev.currentDashboard?.id === id ? dashboard : prev.currentDashboard,
    }));
    
    invalidateCache('dashboards');
    return dashboard;
  }, []);
  
  const deleteDashboard = useCallback(async (id: string) => {
    await DashboardService.delete(id);
    
    setData(prev => ({
      ...prev,
      dashboards: prev.dashboards.filter(d => d.id !== id),
      currentDashboard: prev.currentDashboard?.id === id ? null : prev.currentDashboard,
    }));
    invalidateCache('dashboards');
  }, []);
  
  const loadDashboard = useCallback(async (id: string) => {
    const dashboard = await DashboardService.get(id);
    
    if (dashboard) {
      setData(prev => ({ ...prev, currentDashboard: dashboard }));
    }
    
    return dashboard;
  }, []);
  
  const setDefaultDashboard = useCallback(async (id: string) => {
    await DashboardService.setDefault(id);
    
    setData(prev => ({
      ...prev,
      dashboards: prev.dashboards.map(d => ({
        ...d,
        isDefault: d.id === id,
      })),
    }));
    invalidateCache('dashboards');
  }, []);
  
  // ==========================================================================
  // Widget Actions
  // ==========================================================================
  
  const addWidget = useCallback(async (dashboardId: string, widget: Omit<DashboardWidget, 'id'>, position: Omit<WidgetPosition, 'widgetId'>) => {
    const newWidget = await DashboardService.addWidget(dashboardId, widget, position);
    
    setData(prev => ({
      ...prev,
      currentDashboard: prev.currentDashboard?.id === dashboardId
        ? {
            ...prev.currentDashboard,
            widgets: [...prev.currentDashboard.widgets, newWidget],
          }
        : prev.currentDashboard,
    }));
    
    invalidateCache('dashboards');
    return newWidget;
  }, []);
  
  const updateWidget = useCallback(async (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>) => {
    const widget = await DashboardService.updateWidget(dashboardId, widgetId, updates);
    
    setData(prev => ({
      ...prev,
      currentDashboard: prev.currentDashboard?.id === dashboardId
        ? {
            ...prev.currentDashboard,
            widgets: prev.currentDashboard.widgets.map(w => 
              w.id === widgetId ? widget : w
            ),
          }
        : prev.currentDashboard,
    }));
    
    return widget;
  }, []);
  
  const removeWidget = useCallback(async (dashboardId: string, widgetId: string) => {
    await DashboardService.removeWidget(dashboardId, widgetId);
    
    setData(prev => ({
      ...prev,
      currentDashboard: prev.currentDashboard?.id === dashboardId
        ? {
            ...prev.currentDashboard,
            widgets: prev.currentDashboard.widgets.filter(w => w.id !== widgetId),
          }
        : prev.currentDashboard,
    }));
  }, []);
  
  const getWidgetData = useCallback(async (dashboardId: string, widgetId: string, timeRange?: TimeRange) => {
    return DashboardService.getWidgetData(dashboardId, widgetId, timeRange);
  }, []);
  
  const refreshWidget = useCallback(async (dashboardId: string, widgetId: string) => {
    return DashboardService.refreshWidget(dashboardId, widgetId);
  }, []);
  
  // ==========================================================================
  // Report Actions
  // ==========================================================================
  
  const createReport = useCallback(async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'lastRun'>) => {
    const newReport = await ReportService.create(report);
    
    setData(prev => ({
      ...prev,
      reports: [newReport, ...prev.reports],
    }));
    
    invalidateCache('reports');
    return newReport;
  }, []);
  
  const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
    const report = await ReportService.update(id, updates);
    
    setData(prev => ({
      ...prev,
      reports: prev.reports.map(r => r.id === id ? report : r),
    }));
    
    invalidateCache('reports');
    return report;
  }, []);
  
  const deleteReport = useCallback(async (id: string) => {
    await ReportService.delete(id);
    
    setData(prev => ({
      ...prev,
      reports: prev.reports.filter(r => r.id !== id),
    }));
    invalidateCache('reports');
  }, []);
  
  const runReport = useCallback(async (id: string, options?: { timeRange?: TimeRange; format?: ReportFormat; recipients?: string[] }) => {
    return ReportService.run(id, options);
  }, []);
  
  const scheduleReport = useCallback(async (id: string, schedule: ReportSchedule) => {
    await ReportService.updateSchedule(id, schedule);
  }, []);
  
  // ==========================================================================
  // Metric Actions
  // ==========================================================================
  
  const recordMetric = useCallback(async (name: string, value: number, tags?: Record<string, string>) => {
    await MetricService.record(name, value, tags);
  }, []);
  
  const queryMetrics = useCallback(async (query: MetricQuery) => {
    return MetricService.query(query);
  }, []);
  
  const getMetricHistory = useCallback(async (metricName: string, timeRange: TimeRange, interval?: string) => {
    return MetricService.getHistory(metricName, timeRange, interval);
  }, []);
  
  const defineMetric = useCallback(async (metric: {
    name: string;
    displayName: string;
    description?: string;
    category: MetricCategory;
    type: MetricType;
    unit?: string;
  }) => {
    await MetricService.define(metric);
    invalidateCache('metrics');
  }, []);
  
  // ==========================================================================
  // Alert Actions
  // ==========================================================================
  
  const createAlert = useCallback(async (alert: Omit<MetricAlert, 'id' | 'createdAt' | 'status' | 'lastTriggeredAt' | 'lastValue'>) => {
    const newAlert = await MetricAlertService.create(alert);
    
    setData(prev => ({
      ...prev,
      alerts: [newAlert, ...prev.alerts],
    }));
    
    invalidateCache('alerts');
    return newAlert;
  }, []);
  
  const updateAlert = useCallback(async (id: string, updates: Partial<MetricAlert>) => {
    const alert = await MetricAlertService.update(id, updates);
    
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === id ? alert : a),
    }));
    
    invalidateCache('alerts');
    return alert;
  }, []);
  
  const deleteAlert = useCallback(async (id: string) => {
    await MetricAlertService.delete(id);
    
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== id),
    }));
    invalidateCache('alerts');
  }, []);
  
  const acknowledgeAlertEvent = useCallback(async (eventId: string) => {
    await MetricAlertService.acknowledgeEvent(eventId);
  }, []);
  
  // ==========================================================================
  // Computed Values
  // ==========================================================================
  
  const activeDashboards = useMemo(() => 
    data.dashboards.filter(d => d.widgets.length > 0),
    [data.dashboards]
  );
  
  const scheduledReports = useMemo(() => 
    data.reports.filter(r => r.schedule?.enabled),
    [data.reports]
  );
  
  const activeAlerts = useMemo(() => 
    data.alerts.filter(a => a.isEnabled),
    [data.alerts]
  );
  
  const unacknowledgedEvents = useMemo(() => 
    data.alertEvents.filter(e => e.status === 'triggered'),
    [data.alertEvents]
  );
  
  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && autoRefresh > 0) {
      refreshIntervalRef.current = setInterval(refresh, autoRefresh);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refresh]);
  
  // Real-time updates
  useEffect(() => {
    if (!realtime) return;
    
    const setupListeners = async () => {
      try {
        const unlistenDashboard = await listen<Dashboard>('analytics:dashboard:updated', (event) => {
          setData(prev => ({
            ...prev,
            dashboards: prev.dashboards.map(d => d.id === event.payload.id ? event.payload : d),
            currentDashboard: prev.currentDashboard?.id === event.payload.id ? event.payload : prev.currentDashboard,
          }));
        });
        
        const unlistenAlert = await listen<AlertEvent>('analytics:alert:triggered', (event) => {
          setData(prev => ({
            ...prev,
            alertEvents: [event.payload, ...prev.alertEvents],
          }));
        });
        
        const unlistenRefresh = await listen('analytics:refresh', () => {
          refresh();
        });
        
        unlistenRefs.current = [unlistenDashboard, unlistenAlert, unlistenRefresh];
      } catch (error) {
        log.warn('useAnalytics: Failed to setup Tauri event listeners:', error);
      }
    };
    
    setupListeners();
    
    return () => {
      unlistenRefs.current.forEach(unlisten => unlisten());
      unlistenRefs.current = [];
    };
  }, [realtime, refresh]);
  
  // ==========================================================================
  // Return
  // ==========================================================================
  
  return {
    // State
    data,
    loading,
    errors,
    
    // Dashboard Actions
    createDashboard,
    updateDashboard,
    deleteDashboard,
    loadDashboard,
    setDefaultDashboard,
    
    // Widget Actions
    addWidget,
    updateWidget,
    removeWidget,
    getWidgetData,
    refreshWidget,
    
    // Report Actions
    createReport,
    updateReport,
    deleteReport,
    runReport,
    scheduleReport,
    
    // Metric Actions
    recordMetric,
    queryMetrics,
    getMetricHistory,
    defineMetric,
    
    // Alert Actions
    createAlert,
    updateAlert,
    deleteAlert,
    acknowledgeAlertEvent,
    
    // Refresh
    refresh,
    refreshDashboards,
    refreshReports,
    refreshMetrics,
    refreshAlerts,
    
    // Computed
    activeDashboards,
    scheduledReports,
    activeAlerts,
    unacknowledgedEvents,
  };
}

export default useAnalytics;
