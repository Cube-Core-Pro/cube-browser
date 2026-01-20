/**
 * Telemetry Service - OpenTelemetry Integration for CUBE Elite v6
 *
 * Now integrated with Tauri backend for:
 * - Real-time execution metrics
 * - Workflow statistics
 * - System-wide monitoring stats
 * - Log management (add, get, export, clear)
 * - Alert rules and history
 * 
 * Provides comprehensive observability including:
 * - Distributed tracing (frontend ↔ Tauri ↔ backend)
 * - Real User Monitoring (RUM)
 * - Performance metrics
 * - Error tracking
 * - Custom events and spans
 *
 * @module TelemetryService
 * @version 2.0.0
 * @date 2025-01-27
 */

import { logger } from './logger-service';

const log = logger.scope('Service');

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Backend Integration Types
// ============================================================================

interface BackendExecutionMetrics {
  execution_id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  nodes_executed: number;
  nodes_failed: number;
  data_processed_bytes: number;
  error?: string;
}

interface BackendWorkflowStats {
  workflow_id: string;
  workflow_name: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_duration_ms: number;
  last_execution?: string;
  total_data_processed_bytes: number;
}

interface BackendSystemStats {
  total_workflows: number;
  active_executions: number;
  completed_today: number;
  failed_today: number;
  avg_execution_time_ms: number;
  uptime_seconds: number;
  memory_usage_bytes: number;
  cpu_usage_percent: number;
}

interface BackendLogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  workflow_id?: string;
  execution_id?: string;
  node_id?: string;
  metadata: Record<string, string>;
}

interface BackendLogFilter {
  level?: string;
  workflow_id?: string;
  execution_id?: string;
  start_time?: string;
  end_time?: string;
  search?: string;
  limit?: number;
}

interface BackendLogStats {
  total_logs: number;
  debug_count: number;
  info_count: number;
  warn_count: number;
  error_count: number;
  oldest_log?: string;
  newest_log?: string;
}

interface BackendAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  workflow_id?: string;
  condition_type: string;
  threshold?: number;
  duration_seconds?: number;
  severity: string;
  channels: Array<{
    channel_type: string;
    config: Record<string, string>;
  }>;
}

interface BackendAlertEvent {
  id: string;
  rule_id: string;
  workflow_id: string;
  workflow_name: string;
  execution_id: string;
  timestamp: string;
  message: string;
  severity: string;
  metadata: Record<string, string>;
}

const BackendMonitoringAPI = {
  // Metrics
  async getExecution(executionId: string): Promise<BackendExecutionMetrics | null> {
    try {
      return await invoke<BackendExecutionMetrics | null>('metrics_get_execution', { executionId });
    } catch (error) {
      log.warn('Backend metrics_get_execution failed:', error);
      return null;
    }
  },

  async getActiveExecutions(): Promise<BackendExecutionMetrics[]> {
    try {
      return await invoke<BackendExecutionMetrics[]>('metrics_get_active_executions');
    } catch (error) {
      log.warn('Backend metrics_get_active_executions failed:', error);
      return [];
    }
  },

  async getWorkflowStats(workflowId: string): Promise<BackendWorkflowStats | null> {
    try {
      return await invoke<BackendWorkflowStats | null>('metrics_get_workflow_stats', { workflowId });
    } catch (error) {
      log.warn('Backend metrics_get_workflow_stats failed:', error);
      return null;
    }
  },

  async getSystemStats(): Promise<BackendSystemStats | null> {
    try {
      return await invoke<BackendSystemStats>('metrics_get_system_stats');
    } catch (error) {
      log.warn('Backend metrics_get_system_stats failed:', error);
      return null;
    }
  },

  async cleanupMetrics(): Promise<void> {
    try {
      await invoke<void>('metrics_cleanup');
    } catch (error) {
      log.warn('Backend metrics_cleanup failed:', error);
    }
  },

  // Logs
  async addLog(
    level: string,
    message: string,
    workflowId?: string,
    executionId?: string,
    nodeId?: string
  ): Promise<string> {
    try {
      return await invoke<string>('logs_add', { level, message, workflowId, executionId, nodeId });
    } catch (error) {
      log.warn('Backend logs_add failed:', error);
      return '';
    }
  },

  async getLogs(filter: BackendLogFilter): Promise<BackendLogEntry[]> {
    try {
      return await invoke<BackendLogEntry[]>('logs_get', { filter });
    } catch (error) {
      log.warn('Backend logs_get failed:', error);
      return [];
    }
  },

  async getRecentLogs(count: number): Promise<BackendLogEntry[]> {
    try {
      return await invoke<BackendLogEntry[]>('logs_get_recent', { count });
    } catch (error) {
      log.warn('Backend logs_get_recent failed:', error);
      return [];
    }
  },

  async exportLogsJson(filter: BackendLogFilter, path: string): Promise<string> {
    try {
      return await invoke<string>('logs_export_json', { filter, path });
    } catch (error) {
      log.warn('Backend logs_export_json failed:', error);
      return '';
    }
  },

  async exportLogsCsv(filter: BackendLogFilter, path: string): Promise<string> {
    try {
      return await invoke<string>('logs_export_csv', { filter, path });
    } catch (error) {
      log.warn('Backend logs_export_csv failed:', error);
      return '';
    }
  },

  async exportLogsTxt(filter: BackendLogFilter, path: string): Promise<string> {
    try {
      return await invoke<string>('logs_export_txt', { filter, path });
    } catch (error) {
      log.warn('Backend logs_export_txt failed:', error);
      return '';
    }
  },

  async clearLogs(): Promise<number> {
    try {
      return await invoke<number>('logs_clear');
    } catch (error) {
      log.warn('Backend logs_clear failed:', error);
      return 0;
    }
  },

  async getLogStats(): Promise<BackendLogStats | null> {
    try {
      return await invoke<BackendLogStats>('logs_get_stats');
    } catch (error) {
      log.warn('Backend logs_get_stats failed:', error);
      return null;
    }
  },

  // Alerts
  async addAlertRule(rule: BackendAlertRule): Promise<void> {
    try {
      await invoke<void>('alerts_add_rule', { rule });
    } catch (error) {
      log.warn('Backend alerts_add_rule failed:', error);
      throw error;
    }
  },

  async removeAlertRule(ruleId: string): Promise<void> {
    try {
      await invoke<void>('alerts_remove_rule', { ruleId });
    } catch (error) {
      log.warn('Backend alerts_remove_rule failed:', error);
      throw error;
    }
  },

  async toggleAlertRule(ruleId: string, enabled: boolean): Promise<void> {
    try {
      await invoke<void>('alerts_toggle_rule', { ruleId, enabled });
    } catch (error) {
      log.warn('Backend alerts_toggle_rule failed:', error);
      throw error;
    }
  },

  async getAlertRules(): Promise<BackendAlertRule[]> {
    try {
      return await invoke<BackendAlertRule[]>('alerts_get_rules');
    } catch (error) {
      log.warn('Backend alerts_get_rules failed:', error);
      return [];
    }
  },

  async getAlertHistory(limit?: number): Promise<BackendAlertEvent[]> {
    try {
      return await invoke<BackendAlertEvent[]>('alerts_get_history', { limit });
    } catch (error) {
      log.warn('Backend alerts_get_history failed:', error);
      return [];
    }
  },

  async clearAlertHistory(): Promise<number> {
    try {
      return await invoke<number>('alerts_clear_history');
    } catch (error) {
      log.warn('Backend alerts_clear_history failed:', error);
      return 0;
    }
  },

  async testAlertChannel(channel: BackendAlertRule['channels'][0]): Promise<void> {
    try {
      await invoke<void>('alerts_test_channel', { channel });
    } catch (error) {
      log.warn('Backend alerts_test_channel failed:', error);
      throw error;
    }
  },
};

// Export backend API
export { BackendMonitoringAPI };
export type {
  BackendExecutionMetrics,
  BackendWorkflowStats,
  BackendSystemStats,
  BackendLogEntry,
  BackendLogFilter,
  BackendLogStats,
  BackendAlertRule,
  BackendAlertEvent,
};

// ============================================================================
// Types for OpenTelemetry-compatible telemetry
// ============================================================================
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean | string[] | number[] | boolean[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTime: number;
  endTime?: number;
  attributes: SpanAttributes;
  events: SpanEvent[];
  status: SpanStatus;
}

export enum SpanKind {
  INTERNAL = 'INTERNAL',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER',
}

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface MetricValue {
  name: string;
  value: number;
  unit?: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

export interface RUMMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint

  // Navigation timing
  domContentLoaded: number | null;
  loadComplete: number | null;
  domInteractive: number | null;

  // Resource timing
  resourceCount: number;
  totalTransferSize: number;
  totalDecodedSize: number;

  // Memory (if available)
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;

  // Custom metrics
  customMetrics: Record<string, number>;
}

export interface TelemetryErrorEvent {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  type: ErrorType;
  severity: ErrorSeverity;
  context: ErrorContext;
  handled: boolean;
  traceId?: string;
  spanId?: string;
}

export enum ErrorType {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  TAURI_COMMAND = 'tauri_command',
  REACT = 'react',
  UNHANDLED_REJECTION = 'unhandled_rejection',
  RESOURCE = 'resource',
  CUSTOM = 'custom',
}

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  url?: string;
  userAgent?: string;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  extra?: Record<string, unknown>;
}

export interface TelemetryConfig {
  enabled: boolean;
  serviceName: string;
  serviceVersion: string;
  environment: 'development' | 'staging' | 'production';
  sampleRate: number; // 0.0 - 1.0
  maxSpansPerTrace: number;
  maxEventsPerSpan: number;
  flushInterval: number; // ms
  batchSize: number;
  endpoint?: string;
  apiKey?: string;
  enableRUM: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMetrics: boolean;
  debug: boolean;
}

export interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
  plan?: string;
  traits?: Record<string, unknown>;
}

// Default configuration
const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: true,
  serviceName: 'cube-elite-v6',
  serviceVersion: '6.0.0',
  environment: 'development',
  sampleRate: 1.0,
  maxSpansPerTrace: 1000,
  maxEventsPerSpan: 128,
  flushInterval: 30000,
  batchSize: 100,
  enableRUM: true,
  enableErrorTracking: true,
  enablePerformanceMetrics: true,
  debug: false,
};

/**
 * Generate a random ID for spans and traces
 */
function generateId(length: number = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % 16];
  }
  return result;
}

/**
 * Get high-resolution timestamp
 */
function hrTime(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * TelemetryService - Singleton service for application observability
 */
class TelemetryServiceImpl {
  private config: TelemetryConfig;
  private spans: Map<string, Span>;
  private activeSpans: string[];
  private metrics: MetricValue[];
  private errors: TelemetryErrorEvent[];
  private rumMetrics: RUMMetrics;
  private sessionId: string;
  private user: UserInfo | null;
  private flushTimer: ReturnType<typeof setInterval> | null;
  private initialized: boolean;
  private currentTraceId: string | null;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.spans = new Map();
    this.activeSpans = [];
    this.metrics = [];
    this.errors = [];
    this.rumMetrics = this.createEmptyRUMMetrics();
    this.sessionId = generateId(32);
    this.user = null;
    this.flushTimer = null;
    this.initialized = false;
    this.currentTraceId = null;
  }

  /**
   * Initialize the telemetry service
   */
  init(config: Partial<TelemetryConfig> = {}): void {
    if (this.initialized) {
      this.log('TelemetryService already initialized');
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.enabled) {
      this.log('Telemetry is disabled');
      return;
    }

    // Set up error tracking
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Set up RUM
    if (this.config.enableRUM) {
      this.setupRUM();
    }

    // Set up performance metrics
    if (this.config.enablePerformanceMetrics) {
      this.setupPerformanceMetrics();
    }

    // Start flush timer
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    this.initialized = true;
    this.log('TelemetryService initialized', this.config);
  }

  /**
   * Shutdown the telemetry service
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining data
    this.flush();

    // Remove error listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }

    this.initialized = false;
    this.log('TelemetryService shutdown');
  }

  /**
   * Set user information
   */
  setUser(user: UserInfo | null): void {
    this.user = user;
    this.log('User set', user);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current trace ID
   */
  getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }

  // ============================================
  // TRACING
  // ============================================

  /**
   * Start a new trace
   */
  startTrace(name: string): string {
    this.currentTraceId = generateId(32);
    this.startSpan(name, { kind: SpanKind.INTERNAL });
    return this.currentTraceId;
  }

  /**
   * End the current trace
   */
  endTrace(): void {
    if (this.activeSpans.length > 0) {
      const rootSpanId = this.activeSpans[0];
      this.endSpan(rootSpanId);
    }
    this.currentTraceId = null;
  }

  /**
   * Start a new span
   */
  startSpan(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: SpanAttributes;
      parentSpanId?: string;
    } = {}
  ): string {
    if (!this.shouldSample()) {
      return '';
    }

    const spanId = generateId(16);
    const traceId = this.currentTraceId || generateId(32);

    if (!this.currentTraceId) {
      this.currentTraceId = traceId;
    }

    const parentSpanId =
      options.parentSpanId ||
      (this.activeSpans.length > 0 ? this.activeSpans[this.activeSpans.length - 1] : undefined);

    const span: Span = {
      spanId,
      traceId,
      parentSpanId,
      name,
      kind: options.kind || SpanKind.INTERNAL,
      startTime: hrTime(),
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'session.id': this.sessionId,
        ...options.attributes,
      },
      events: [],
      status: { code: SpanStatusCode.UNSET },
    };

    if (this.user?.id) {
      span.attributes['user.id'] = this.user.id;
    }

    this.spans.set(spanId, span);
    this.activeSpans.push(spanId);

    this.log('Span started', { spanId, name, traceId });

    return spanId;
  }

  /**
   * End a span
   */
  endSpan(spanId: string, status?: SpanStatus): void {
    const span = this.spans.get(spanId);
    if (!span) {
      this.log('Span not found', spanId);
      return;
    }

    span.endTime = hrTime();
    if (status) {
      span.status = status;
    } else if (span.status.code === SpanStatusCode.UNSET) {
      span.status = { code: SpanStatusCode.OK };
    }

    // Remove from active spans
    const index = this.activeSpans.indexOf(spanId);
    if (index > -1) {
      this.activeSpans.splice(index, 1);
    }

    this.log('Span ended', { spanId, duration: span.endTime - span.startTime });
  }

  /**
   * Add an event to the current span
   */
  addSpanEvent(name: string, attributes?: SpanAttributes): void {
    const currentSpanId = this.activeSpans[this.activeSpans.length - 1];
    if (!currentSpanId) {
      return;
    }

    const span = this.spans.get(currentSpanId);
    if (!span) {
      return;
    }

    if (span.events.length >= this.config.maxEventsPerSpan) {
      return;
    }

    span.events.push({
      name,
      timestamp: hrTime(),
      attributes,
    });
  }

  /**
   * Set span attributes
   */
  setSpanAttributes(spanId: string, attributes: SpanAttributes): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    Object.assign(span.attributes, attributes);
  }

  /**
   * Set span status
   */
  setSpanStatus(spanId: string, code: SpanStatusCode, message?: string): void {
    const span = this.spans.get(spanId);
    if (!span) {
      return;
    }

    span.status = { code, message };
  }

  /**
   * Instrument an async function
   */
  async trace<T>(name: string, fn: () => Promise<T>, attributes?: SpanAttributes): Promise<T> {
    const spanId = this.startSpan(name, { attributes });

    try {
      const result = await fn();
      this.endSpan(spanId, { code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setSpanStatus(spanId, SpanStatusCode.ERROR, errorMessage);
      this.addSpanEvent('exception', {
        'exception.message': errorMessage,
        'exception.type': error instanceof Error ? error.name : 'Error',
      });
      this.endSpan(spanId);
      throw error;
    }
  }

  /**
   * Instrument a Tauri command call
   */
  async traceTauriCommand<T>(
    commandName: string,
    args: Record<string, unknown>,
    invokeFn: () => Promise<T>
  ): Promise<T> {
    const spanId = this.startSpan(`tauri.${commandName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'rpc.system': 'tauri',
        'rpc.method': commandName,
        'rpc.args': JSON.stringify(args).substring(0, 1000),
      },
    });

    try {
      const result = await invokeFn();
      this.endSpan(spanId, { code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setSpanStatus(spanId, SpanStatusCode.ERROR, errorMessage);
      this.addSpanEvent('tauri_error', {
        'error.message': errorMessage,
        'error.command': commandName,
      });
      this.endSpan(spanId);

      // Also track as error
      this.trackError(error instanceof Error ? error : new Error(errorMessage), {
        type: ErrorType.TAURI_COMMAND,
        context: { action: commandName, extra: args },
      });

      throw error;
    }
  }

  // ============================================
  // METRICS
  // ============================================

  /**
   * Record a metric value
   */
  recordMetric(
    name: string,
    value: number,
    unit?: string,
    attributes?: SpanAttributes
  ): void {
    if (!this.config.enabled || !this.config.enablePerformanceMetrics) {
      return;
    }

    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      attributes: {
        'service.name': this.config.serviceName,
        'session.id': this.sessionId,
        ...attributes,
      },
    });

    this.log('Metric recorded', { name, value, unit });
  }

  /**
   * Record a counter increment
   */
  incrementCounter(name: string, delta: number = 1, attributes?: SpanAttributes): void {
    this.recordMetric(`counter.${name}`, delta, 'count', attributes);
  }

  /**
   * Record a timing metric
   */
  recordTiming(name: string, durationMs: number, attributes?: SpanAttributes): void {
    this.recordMetric(`timing.${name}`, durationMs, 'ms', attributes);
  }

  /**
   * Record a gauge value
   */
  recordGauge(name: string, value: number, unit?: string, attributes?: SpanAttributes): void {
    this.recordMetric(`gauge.${name}`, value, unit, attributes);
  }

  /**
   * Create a timer for measuring duration
   */
  startTimer(): () => number {
    const startTime = hrTime();
    return () => {
      return hrTime() - startTime;
    };
  }

  // ============================================
  // ERROR TRACKING
  // ============================================

  /**
   * Track an error
   */
  trackError(
    error: Error | string,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      context?: Partial<ErrorContext>;
      handled?: boolean;
    } = {}
  ): string {
    if (!this.config.enabled || !this.config.enableErrorTracking) {
      return '';
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error;

    const errorEvent: TelemetryErrorEvent = {
      id: generateId(16),
      timestamp: Date.now(),
      message: errorObj.message,
      stack: errorObj.stack,
      type: options.type || ErrorType.JAVASCRIPT,
      severity: options.severity || ErrorSeverity.ERROR,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        userId: this.user?.id,
        sessionId: this.sessionId,
        ...options.context,
      },
      handled: options.handled ?? true,
      traceId: this.currentTraceId || undefined,
      spanId:
        this.activeSpans.length > 0
          ? this.activeSpans[this.activeSpans.length - 1]
          : undefined,
    };

    this.errors.push(errorEvent);

    this.log('Error tracked', errorEvent);

    // Trigger immediate flush for critical errors
    if (options.severity === ErrorSeverity.CRITICAL) {
      this.flush();
    }

    return errorEvent.id;
  }

  /**
   * Track a React error boundary catch
   */
  trackReactError(error: Error, errorInfo: { componentStack?: string }): string {
    return this.trackError(error, {
      type: ErrorType.REACT,
      severity: ErrorSeverity.ERROR,
      context: {
        component: errorInfo.componentStack?.split('\n')[1]?.trim(),
        extra: { componentStack: errorInfo.componentStack },
      },
      handled: true,
    });
  }

  // ============================================
  // RUM (Real User Monitoring)
  // ============================================

  /**
   * Get current RUM metrics
   */
  getRUMMetrics(): RUMMetrics {
    this.collectRUMMetrics();
    return { ...this.rumMetrics };
  }

  /**
   * Record a custom RUM metric
   */
  recordCustomMetric(name: string, value: number): void {
    this.rumMetrics.customMetrics[name] = value;
  }

  /**
   * Record user interaction
   */
  recordInteraction(
    type: 'click' | 'input' | 'scroll' | 'navigation',
    target: string,
    duration?: number
  ): void {
    this.recordMetric(`rum.interaction.${type}`, duration || 0, 'ms', {
      'interaction.target': target,
    });
  }

  /**
   * Record page view
   */
  recordPageView(path: string, title?: string): void {
    const spanId = this.startSpan('page_view', {
      attributes: {
        'page.path': path,
        'page.title': title || '',
      },
    });
    this.endSpan(spanId, { code: SpanStatusCode.OK });

    this.incrementCounter('page_views', 1, { 'page.path': path });
  }

  // ============================================
  // CUSTOM EVENTS
  // ============================================

  /**
   * Track a custom event
   */
  trackEvent(
    name: string,
    properties?: Record<string, string | number | boolean>
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const spanId = this.startSpan(`event.${name}`, {
      attributes: properties as SpanAttributes,
    });
    this.endSpan(spanId, { code: SpanStatusCode.OK });

    this.incrementCounter('custom_events', 1, { 'event.name': name });

    this.log('Event tracked', { name, properties });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, module: string): void {
    this.trackEvent('feature_usage', {
      feature,
      module,
    });
  }

  /**
   * Track API call
   */
  trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): void {
    this.recordMetric('api.duration', duration, 'ms', {
      'http.url': endpoint,
      'http.method': method,
      'http.status_code': statusCode,
    });

    this.incrementCounter('api_calls', 1, {
      'http.url': endpoint,
      'http.method': method,
      'http.status_code': statusCode,
      'http.success': statusCode >= 200 && statusCode < 400,
    });
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  /**
   * Flush all collected data
   */
  flush(): void {
    if (!this.config.enabled) {
      return;
    }

    const data = this.collectFlushData();

    if (
      data.spans.length === 0 &&
      data.metrics.length === 0 &&
      data.errors.length === 0
    ) {
      return;
    }

    this.log('Flushing telemetry data', {
      spans: data.spans.length,
      metrics: data.metrics.length,
      errors: data.errors.length,
    });

    // Send to endpoint if configured
    if (this.config.endpoint) {
      this.sendToEndpoint(data);
    }

    // Also log to console in debug mode
    if (this.config.debug) {
      console.group('📊 Telemetry Flush');
      log.debug('Spans:', data.spans);
      log.debug('Metrics:', data.metrics);
      log.debug('Errors:', data.errors);
      log.debug('RUM:', data.rum);
      console.groupEnd();
    }

    // Clear sent data
    this.clearFlushData(data);
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data = {
      config: this.config,
      sessionId: this.sessionId,
      user: this.user,
      spans: Array.from(this.spans.values()),
      metrics: this.metrics,
      errors: this.errors,
      rum: this.rumMetrics,
      timestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Get telemetry summary
   */
  getSummary(): {
    sessionId: string;
    totalSpans: number;
    totalMetrics: number;
    totalErrors: number;
    rum: RUMMetrics;
  } {
    return {
      sessionId: this.sessionId,
      totalSpans: this.spans.size,
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      rum: this.getRUMMetrics(),
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private setupErrorTracking(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Global error handler
    window.addEventListener('error', this.handleGlobalError);

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    this.log('Error tracking setup complete');
  }

  private handleGlobalError = (event: globalThis.ErrorEvent): void => {
    this.trackError(event.error || new Error(event.message), {
      type: ErrorType.JAVASCRIPT,
      severity: ErrorSeverity.ERROR,
      context: {
        url: event.filename,
        extra: {
          lineno: event.lineno,
          colno: event.colno,
        },
      },
      handled: false,
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    this.trackError(error, {
      type: ErrorType.UNHANDLED_REJECTION,
      severity: ErrorSeverity.ERROR,
      handled: false,
    });
  };

  private setupRUM(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.rumMetrics.fcp = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (_error) {
      this.log('Paint observer not supported');
    }

    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.rumMetrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (_error) {
      this.log('LCP observer not supported');
    }

    // Observe FID
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const firstEntry = entries[0] as PerformanceEventTiming;
          this.rumMetrics.fid = firstEntry.processingStart - firstEntry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (_error) {
      this.log('FID observer not supported');
    }

    // Observe CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
        this.rumMetrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (_error) {
      this.log('CLS observer not supported');
    }

    this.log('RUM setup complete');
  }

  private setupPerformanceMetrics(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Collect initial metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectRUMMetrics();
      }, 0);
    });

    this.log('Performance metrics setup complete');
  }

  private collectRUMMetrics(): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }

    // Navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navTiming) {
      this.rumMetrics.ttfb = navTiming.responseStart - navTiming.requestStart;
      this.rumMetrics.domContentLoaded = navTiming.domContentLoadedEventEnd;
      this.rumMetrics.loadComplete = navTiming.loadEventEnd;
      this.rumMetrics.domInteractive = navTiming.domInteractive;
    }

    // Resource timing
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.rumMetrics.resourceCount = resources.length;
    this.rumMetrics.totalTransferSize = resources.reduce(
      (sum, r) => sum + (r.transferSize || 0),
      0
    );
    this.rumMetrics.totalDecodedSize = resources.reduce(
      (sum, r) => sum + (r.decodedBodySize || 0),
      0
    );

    // Memory (Chrome only)
    const performanceMemory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (performanceMemory) {
      this.rumMetrics.usedJSHeapSize = performanceMemory.usedJSHeapSize;
      this.rumMetrics.totalJSHeapSize = performanceMemory.totalJSHeapSize;
      this.rumMetrics.jsHeapSizeLimit = performanceMemory.jsHeapSizeLimit;
    }
  }

  private createEmptyRUMMetrics(): RUMMetrics {
    return {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      inp: null,
      domContentLoaded: null,
      loadComplete: null,
      domInteractive: null,
      resourceCount: 0,
      totalTransferSize: 0,
      totalDecodedSize: 0,
      customMetrics: {},
    };
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private collectFlushData(): {
    spans: Span[];
    metrics: MetricValue[];
    errors: TelemetryErrorEvent[];
    rum: RUMMetrics;
  } {
    // Get completed spans
    const completedSpans = Array.from(this.spans.values()).filter(
      (span) => span.endTime !== undefined
    );

    return {
      spans: completedSpans,
      metrics: [...this.metrics],
      errors: [...this.errors],
      rum: this.getRUMMetrics(),
    };
  }

  private clearFlushData(data: {
    spans: Span[];
    metrics: MetricValue[];
    errors: TelemetryErrorEvent[];
    rum: RUMMetrics;
  }): void {
    // Remove flushed spans
    for (const span of data.spans) {
      this.spans.delete(span.spanId);
    }

    // Clear metrics and errors
    this.metrics = [];
    this.errors = [];
  }

  private async sendToEndpoint(data: unknown): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        this.log('Failed to send telemetry', response.status);
      }
    } catch (error) {
      this.log('Error sending telemetry', error);
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      log.debug('[Telemetry]', ...args);
    }
  }
}

// Singleton instance
export const TelemetryService = new TelemetryServiceImpl();

// Export convenience functions
export const initTelemetry = (config?: Partial<TelemetryConfig>) =>
  TelemetryService.init(config);

export const shutdownTelemetry = () => TelemetryService.shutdown();

export const startSpan = (
  name: string,
  options?: { kind?: SpanKind; attributes?: SpanAttributes; parentSpanId?: string }
) => TelemetryService.startSpan(name, options);

export const endSpan = (spanId: string, status?: SpanStatus) =>
  TelemetryService.endSpan(spanId, status);

export const trace = <T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: SpanAttributes
) => TelemetryService.trace(name, fn, attributes);

export const traceTauriCommand = <T>(
  commandName: string,
  args: Record<string, unknown>,
  invokeFn: () => Promise<T>
) => TelemetryService.traceTauriCommand(commandName, args, invokeFn);

export const trackError = (
  error: Error | string,
  options?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    context?: Partial<ErrorContext>;
    handled?: boolean;
  }
) => TelemetryService.trackError(error, options);

export const trackEvent = (
  name: string,
  properties?: Record<string, string | number | boolean>
) => TelemetryService.trackEvent(name, properties);

export const recordMetric = (
  name: string,
  value: number,
  unit?: string,
  attributes?: SpanAttributes
) => TelemetryService.recordMetric(name, value, unit, attributes);

export const recordPageView = (path: string, title?: string) =>
  TelemetryService.recordPageView(path, title);

export default TelemetryService;
