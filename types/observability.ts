/**
 * Enterprise Observability & Monitoring System
 * CUBE Nexum Platform v2.0 - Enterprise Grade
 * 
 * Features:
 * - Real-time metrics collection
 * - Distributed tracing
 * - Log aggregation & analysis
 * - Alerting & incident management
 * - Performance profiling
 * - Resource monitoring
 * - SLA tracking
 * - Compliance dashboards
 */

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary' | 'timer';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'warning';

export type AlertState = 'pending' | 'firing' | 'resolved' | 'acknowledged' | 'suppressed';

export type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';

export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export type TraceStatus = 'ok' | 'error' | 'unset';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// ============================================================================
// METRICS SYSTEM
// ============================================================================

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  labels: string[];
  aggregations: AggregationType[];
  retention: number;  // days
  enabled: boolean;
  alertThresholds?: MetricThreshold[];
}

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p90' | 'p95' | 'p99' | 'rate';

export interface MetricThreshold {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number;
  duration: number;  // seconds
  severity: AlertSeverity;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  labels: Record<string, string>;
}

export interface MetricSeries {
  metric: string;
  labels: Record<string, string>;
  dataPoints: MetricDataPoint[];
  aggregation?: AggregationType;
}

export interface MetricQuery {
  metric: string;
  filters?: LabelFilter[];
  aggregations?: AggregationType[];
  groupBy?: string[];
  timeRange: TimeRange;
  interval?: number;  // seconds
}

export interface LabelFilter {
  label: string;
  operator: 'eq' | 'neq' | 'regex' | 'in' | 'not_in';
  value: string | string[];
}

export interface TimeRange {
  start: string;
  end: string;
  timezone?: string;
}

// ============================================================================
// SYSTEM METRICS
// ============================================================================

export interface SystemMetrics {
  timestamp: string;
  host: HostMetrics;
  process: ProcessMetrics;
  network: NetworkMetrics;
  storage: StorageMetrics;
  application: ApplicationMetrics;
}

export interface HostMetrics {
  hostname: string;
  os: string;
  arch: string;
  cpuCount: number;
  cpuUsage: number;
  cpuLoadAvg: [number, number, number];
  memoryTotal: number;
  memoryUsed: number;
  memoryFree: number;
  memoryUsagePercent: number;
  swapTotal: number;
  swapUsed: number;
  uptime: number;
}

export interface ProcessMetrics {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryRss: number;
  memoryHeap: number;
  memoryExternal: number;
  threadCount: number;
  openFiles: number;
  openSockets: number;
  uptime: number;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  errorsIn: number;
  errorsOut: number;
  droppedIn: number;
  droppedOut: number;
  activeConnections: number;
  interfaces: NetworkInterface[];
}

export interface NetworkInterface {
  name: string;
  address: string;
  mac: string;
  speed: number;
  status: 'up' | 'down';
  bytesIn: number;
  bytesOut: number;
}

export interface StorageMetrics {
  volumes: VolumeMetrics[];
  totalCapacity: number;
  totalUsed: number;
  totalFree: number;
  iops: number;
  throughput: number;
  latency: number;
}

export interface VolumeMetrics {
  path: string;
  type: string;
  capacity: number;
  used: number;
  free: number;
  usagePercent: number;
  inodesTotal?: number;
  inodesUsed?: number;
}

export interface ApplicationMetrics {
  requestsTotal: number;
  requestsPerSecond: number;
  responseTimeAvg: number;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;
  activeUsers: number;
  activeSessions: number;
  queueDepth: number;
  workerUtilization: number;
  cacheHitRate: number;
  cacheMissRate: number;
  databasePoolActive: number;
  databasePoolIdle: number;
  databaseQueryAvg: number;
}

// ============================================================================
// DISTRIBUTED TRACING
// ============================================================================

export interface Trace {
  traceId: string;
  rootSpan: Span;
  spans: Span[];
  services: string[];
  duration: number;
  status: TraceStatus;
  startTime?: string;
  error?: string;
  metadata: TraceMetadata;
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  operationName: string;
  service: string;
  kind: SpanKind;
  status: TraceStatus;
  startTime: string;
  endTime: string;
  duration: number;
  attributes: Record<string, SpanAttributeValue>;
  events: SpanEvent[];
  links: SpanLink[];
  resource: SpanResource;
  error?: SpanError;
}

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export type SpanAttributeValue = string | number | boolean | string[] | number[] | boolean[];

export interface SpanEvent {
  name: string;
  timestamp: string;
  attributes: Record<string, SpanAttributeValue>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, SpanAttributeValue>;
}

export interface SpanResource {
  service: string;
  version?: string;
  instance?: string;
  environment?: string;
  region?: string;
  cluster?: string;
  namespace?: string;
}

export interface SpanError {
  message: string;
  type: string;
  stack?: string;
}

export interface TraceMetadata {
  source: string;
  samplingRate: number;
  tags: string[];
  baggage: Record<string, string>;
}

export interface TraceQuery {
  service?: string;
  operation?: string;
  minDuration?: number;
  maxDuration?: number;
  status?: TraceStatus;
  tags?: Record<string, string>;
  timeRange: TimeRange;
  limit?: number;
}

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  source: LogSource;
  context: LogContext;
  metadata: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
}

export interface LogSource {
  file?: string;
  line?: number;
  function?: string;
  class?: string;
  module?: string;
}

export interface LogContext {
  environment: string;
  version: string;
  host: string;
  pod?: string;
  container?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
}

export interface LogQuery {
  search?: string;
  level?: LogLevel[];
  service?: string[];
  timeRange: TimeRange;
  filters?: LogFilter[];
  sort?: LogSort;
  limit?: number;
  offset?: number;
}

export interface LogFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'regex' | 'exists' | 'gt' | 'lt';
  value: unknown;
}

export interface LogSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface LogAggregation {
  groupBy: string;
  buckets: LogBucket[];
  total: number;
}

export interface LogBucket {
  key: string;
  count: number;
  percentage: number;
  samples?: LogEntry[];
}

export interface LogStream {
  id: string;
  name: string;
  query: LogQuery;
  filters: LogFilter[];
  subscribers: string[];
  retention: number;
  archiveEnabled: boolean;
  archiveDestination?: string;
}

// ============================================================================
// ALERTING SYSTEM
// ============================================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity?: AlertSeverity;
  condition: AlertCondition;
  evaluation: AlertEvaluation;
  actions: AlertAction[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  silences: AlertSilence[];
  history: AlertHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface AlertCondition {
  type: 'metric' | 'log' | 'trace' | 'composite' | 'custom';
  metric?: MetricCondition;
  log?: LogCondition;
  trace?: TraceCondition;
  composite?: CompositeCondition;
  custom?: CustomCondition;
}

export interface MetricCondition {
  query: MetricQuery;
  threshold: number;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  for: number;  // seconds
  aggregation: AggregationType;
}

export interface LogCondition {
  query: LogQuery;
  threshold: number;
  window: number;  // seconds
  operator: 'gt' | 'gte' | 'lt' | 'lte';
}

export interface TraceCondition {
  query: TraceQuery;
  type: 'error_rate' | 'latency' | 'throughput';
  threshold: number;
  window: number;
}

export interface CompositeCondition {
  operator: 'and' | 'or';
  conditions: AlertCondition[];
}

export interface CustomCondition {
  type: string;
  config: Record<string, unknown>;
}

export interface AlertEvaluation {
  interval: number;  // seconds
  timeout: number;  // seconds
  pendingPeriod: number;  // seconds before firing
  resolvePeriod: number;  // seconds before resolving
}

export interface AlertAction {
  type: AlertActionType;
  config: AlertActionConfig;
  delay?: number;  // seconds
  repeatInterval?: number;  // seconds
  conditions?: ActionCondition[];
}

export type AlertActionType =
  | 'email'
  | 'slack'
  | 'pagerduty'
  | 'webhook'
  | 'sms'
  | 'opsgenie'
  | 'teams'
  | 'jira'
  | 'custom';

export interface AlertActionConfig {
  // Email
  recipients?: string[];
  subject?: string;
  template?: string;
  
  // Slack
  channel?: string;
  webhookUrl?: string;
  
  // PagerDuty
  serviceKey?: string;
  severity?: string;
  
  // Webhook
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  payload?: string;
  
  // SMS
  phoneNumbers?: string[];
  
  // Generic
  apiKey?: string;
  customFields?: Record<string, unknown>;
}

export interface ActionCondition {
  type: 'severity' | 'label' | 'time' | 'count';
  config: Record<string, unknown>;
}

export interface AlertSilence {
  id: string;
  matchers: LabelFilter[];
  startTime: string;
  endTime: string;
  createdBy: string;
  comment: string;
}

export interface AlertHistory {
  timestamp: string;
  state: AlertState;
  value?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  state: AlertState;
  severity: AlertSeverity;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  value: number;
  startsAt: string;
  endsAt?: string;
  updatedAt: string;
  fingerprint: string;
  generatorURL?: string;
  silencedBy?: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// ============================================================================
// INCIDENT MANAGEMENT
// ============================================================================

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  severity: AlertSeverity;
  service: string;
  impactedServices: string[];
  commander?: string;
  responders: Responder[];
  timeline: IncidentEvent[];
  alerts: Alert[];
  metrics: IncidentMetrics;
  postmortem?: Postmortem;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  duration?: number;
}

export interface Responder {
  userId: string;
  name: string;
  role: 'commander' | 'lead' | 'responder' | 'observer';
  assignedAt: string;
  acknowledgedAt?: string;
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  type: IncidentEventType;
  message: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

export type IncidentEventType =
  | 'created'
  | 'acknowledged'
  | 'escalated'
  | 'status_changed'
  | 'priority_changed'
  | 'responder_added'
  | 'responder_removed'
  | 'comment'
  | 'action_taken'
  | 'resolved'
  | 'reopened';

export interface IncidentMetrics {
  timeToDetect: number;  // seconds
  timeToAcknowledge: number;
  timeToMitigate: number;
  timeToResolve: number;
  customerImpact: CustomerImpact;
  alerts: number;
  services: number;
  responders: number;
}

export interface CustomerImpact {
  affected: number;
  severity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  type: 'availability' | 'performance' | 'functionality' | 'security';
}

export interface Postmortem {
  id: string;
  incidentId: string;
  title: string;
  summary: string;
  timeline: PostmortemEvent[];
  rootCauses: RootCause[];
  contributingFactors: string[];
  impactAnalysis: string;
  lessonsLearned: string[];
  actionItems: ActionItem[];
  participants: string[];
  status: 'draft' | 'review' | 'approved' | 'published';
  createdAt: string;
  publishedAt?: string;
}

export interface PostmortemEvent {
  timestamp: string;
  description: string;
  type: 'detection' | 'response' | 'mitigation' | 'resolution' | 'other';
}

export interface RootCause {
  category: 'code' | 'infrastructure' | 'process' | 'external' | 'unknown';
  description: string;
  evidence: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'completed';
  dueDate: string;
  completedAt?: string;
}

// ============================================================================
// SLA TRACKING
// ============================================================================

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  service: string;
  objectives: SLO[];
  targets: SLATarget[];
  penalties?: SLAPenalty[];
  reportingPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  createdAt: string;
  updatedAt: string;
}

export interface SLO {
  id: string;
  name: string;
  description: string;
  type: SLOType;
  target: number;
  window: number;  // days
  metric: MetricQuery;
  calculation: SLOCalculation;
}

export type SLOType = 'availability' | 'latency' | 'error_rate' | 'throughput' | 'custom';

export interface SLOCalculation {
  type: 'ratio' | 'threshold' | 'average' | 'percentile';
  goodEvents?: MetricQuery;
  totalEvents?: MetricQuery;
  threshold?: number;
  percentile?: number;
}

export interface SLATarget {
  period: string;
  target: number;
  actual?: number;
  met?: boolean;
  errorBudget?: number;
  errorBudgetUsed?: number;
}

export interface SLAPenalty {
  threshold: number;  // percentage below target
  type: 'credit' | 'refund' | 'extension';
  amount: number;
  description: string;
}

export interface SLAReport {
  slaId: string;
  period: string;
  objectives: SLOReport[];
  overallCompliance: number;
  incidents: IncidentSummary[];
  downtimeMinutes: number;
  credits?: number;
}

export interface SLOReport {
  sloId: string;
  name: string;
  target: number;
  actual: number;
  met: boolean;
  errorBudget: number;
  errorBudgetUsed: number;
  errorBudgetRemaining: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface IncidentSummary {
  id: string;
  title: string;
  duration: number;
  impact: string;
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export interface HealthCheck {
  id: string;
  name: string;
  description: string;
  type: HealthCheckType;
  target: HealthCheckTarget;
  interval: number;  // seconds
  timeout: number;  // seconds
  enabled: boolean;
  retries: number;
  successThreshold: number;
  failureThreshold: number;
  alerts: AlertRule[];
  history: HealthCheckResult[];
}

export type HealthCheckType = 'http' | 'tcp' | 'dns' | 'script' | 'database' | 'custom';

export interface HealthCheckTarget {
  // HTTP
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  expectedStatus?: number[];
  expectedBody?: string;
  
  // TCP
  host?: string;
  port?: number;
  
  // DNS
  hostname?: string;
  recordType?: string;
  expectedRecords?: string[];
  
  // Script
  command?: string;
  args?: string[];
  expectedExitCode?: number;
  
  // Database
  connectionString?: string;
  query?: string;
  
  // Custom
  customType?: string;
  config?: Record<string, unknown>;
}

export interface HealthCheckResult {
  timestamp: string;
  status: HealthStatus;
  latency: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  checks: HealthCheckSummary[];
  dependencies: DependencyHealth[];
  lastCheck: string;
  uptime: number;  // percentage over last 30 days
}

export interface HealthCheckSummary {
  checkId: string;
  name: string;
  status: HealthStatus;
  latency: number;
  lastSuccess: string;
  lastFailure?: string;
  consecutiveFailures: number;
}

export interface DependencyHealth {
  service: string;
  type: 'upstream' | 'downstream';
  status: HealthStatus;
  latency: number;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// DASHBOARDS
// ============================================================================

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  panels: DashboardPanel[];
  variables: DashboardVariable[];
  timeRange: TimeRange;
  refreshInterval: number;
  tags: string[];
  permissions: DashboardPermission[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DashboardLayout {
  type: 'grid' | 'flow';
  columns: number;
  rowHeight: number;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: PanelType;
  position: PanelPosition;
  config: PanelConfig;
  queries: PanelQuery[];
  thresholds?: PanelThreshold[];
  links?: PanelLink[];
}

export type PanelType =
  | 'timeseries'
  | 'stat'
  | 'gauge'
  | 'bar'
  | 'pie'
  | 'table'
  | 'heatmap'
  | 'logs'
  | 'traces'
  | 'map'
  | 'text'
  | 'alert_list'
  | 'service_map';

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelConfig {
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  axes?: AxesConfig;
  colors?: string[];
  unit?: string;
  decimals?: number;
  noDataMessage?: string;
  customOptions?: Record<string, unknown>;
}

export interface LegendConfig {
  show: boolean;
  position: 'bottom' | 'right';
  values: ('current' | 'min' | 'max' | 'avg' | 'total')[];
}

export interface TooltipConfig {
  mode: 'single' | 'all' | 'none';
  sort: 'none' | 'asc' | 'desc';
}

export interface AxesConfig {
  x?: AxisConfig;
  y?: AxisConfig;
}

export interface AxisConfig {
  show: boolean;
  label?: string;
  min?: number;
  max?: number;
  scale: 'linear' | 'log';
}

export interface PanelQuery {
  id: string;
  type: 'metric' | 'log' | 'trace';
  query: MetricQuery | LogQuery | TraceQuery;
  legend?: string;
  hidden?: boolean;
}

export interface PanelThreshold {
  value: number;
  color: string;
  label?: string;
}

export interface PanelLink {
  title: string;
  url: string;
  targetBlank?: boolean;
}

export interface DashboardVariable {
  name: string;
  label: string;
  type: 'query' | 'constant' | 'custom' | 'interval';
  query?: string;
  options?: string[];
  current: string;
  multi?: boolean;
  includeAll?: boolean;
}

export interface DashboardPermission {
  type: 'user' | 'team' | 'role';
  id: string;
  permission: 'view' | 'edit' | 'admin';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate SLO compliance percentage
 */
export function calculateSLOCompliance(slo: SLO, metrics: MetricDataPoint[]): number {
  if (metrics.length === 0) return 100;
  
  const totalEvents = metrics.length;
  const goodEvents = metrics.filter(m => {
    switch (slo.type) {
      case 'availability':
        return m.value >= slo.target;
      case 'latency':
        return m.value <= slo.target;
      case 'error_rate':
        return m.value <= slo.target;
      case 'throughput':
        return m.value >= slo.target;
      default:
        return m.value >= slo.target;
    }
  }).length;
  
  return (goodEvents / totalEvents) * 100;
}

/**
 * Calculate error budget remaining
 */
export function calculateErrorBudget(sloTarget: number, currentCompliance: number, windowDays: number): {
  total: number;
  used: number;
  remaining: number;
  remainingMinutes: number;
} {
  const totalBudget = 100 - sloTarget;
  const usedBudget = Math.max(0, sloTarget - currentCompliance);
  const remainingBudget = Math.max(0, totalBudget - usedBudget);
  const totalMinutes = windowDays * 24 * 60;
  const remainingMinutes = (remainingBudget / 100) * totalMinutes;
  
  return {
    total: totalBudget,
    used: usedBudget,
    remaining: remainingBudget,
    remainingMinutes: Math.round(remainingMinutes),
  };
}

/**
 * Determine health status from checks
 */
export function determineHealthStatus(checks: HealthCheckResult[]): HealthStatus {
  if (checks.length === 0) return 'unknown';
  
  const statuses = checks.map(c => c.status);
  
  if (statuses.every(s => s === 'healthy')) return 'healthy';
  if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
  if (statuses.some(s => s === 'degraded')) return 'degraded';
  
  return 'unknown';
}

/**
 * Format metric value with unit
 */
export function formatMetricValue(value: number, unit: string): string {
  switch (unit) {
    case 'bytes':
      return formatBytes(value);
    case 'seconds':
      return formatDuration(value * 1000);
    case 'milliseconds':
      return formatDuration(value);
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'requests/s':
      return `${value.toFixed(2)} req/s`;
    default:
      return value.toFixed(2);
  }
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Get alert severity color
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#2563eb',
    info: '#6b7280',
    warning: '#f59e0b',
  };
  return colors[severity];
}

/**
 * Get health status color
 */
export function getHealthStatusColor(status: HealthStatus): string {
  const colors: Record<HealthStatus, string> = {
    healthy: '#16a34a',
    degraded: '#d97706',
    unhealthy: '#dc2626',
    unknown: '#6b7280',
  };
  return colors[status];
}

/**
 * Generate incident ID
 */
export function generateIncidentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `INC-${timestamp}-${random}`.toUpperCase();
}

/**
 * Calculate MTTR (Mean Time To Resolve)
 */
export function calculateMTTR(incidents: Incident[]): number {
  const resolved = incidents.filter(i => i.resolvedAt && i.duration);
  if (resolved.length === 0) return 0;
  
  const totalDuration = resolved.reduce((sum, i) => sum + (i.duration || 0), 0);
  return totalDuration / resolved.length;
}

/**
 * Calculate MTBF (Mean Time Between Failures)
 */
export function calculateMTBF(incidents: Incident[], periodDays: number): number {
  if (incidents.length < 2) return periodDays * 24 * 60 * 60 * 1000;
  
  const sortedIncidents = [...incidents].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  let totalTimeBetween = 0;
  for (let i = 1; i < sortedIncidents.length; i++) {
    const prev = new Date(sortedIncidents[i - 1].resolvedAt || sortedIncidents[i - 1].createdAt).getTime();
    const curr = new Date(sortedIncidents[i].createdAt).getTime();
    totalTimeBetween += curr - prev;
  }
  
  return totalTimeBetween / (sortedIncidents.length - 1);
}

/**
 * Create default dashboard
 */
export function createDefaultDashboard(service: string): Dashboard {
  return {
    id: `dashboard_${service}_${Date.now()}`,
    name: `${service} Overview`,
    description: `Monitoring dashboard for ${service}`,
    layout: {
      type: 'grid',
      columns: 24,
      rowHeight: 30,
    },
    panels: [],
    variables: [],
    timeRange: {
      start: 'now-1h',
      end: 'now',
    },
    refreshInterval: 30,
    tags: [service, 'auto-generated'],
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}

// ============================================================================
// COMPONENT COMPATIBILITY TYPES
// Used by enterprise dashboard components
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'gauge' | 'table' | 'stat' | 'log' | 'trace' | 'alert';
  title: string;
  query: MetricQuery | LogQuery | TraceQuery;
  visualization: VisualizationConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'table' | 'stat';
  colors?: string[];
  thresholds?: { value: number; color: string }[];
  legend?: boolean;
  labels?: boolean;
}

export interface TimeSeriesData {
  metric: string;
  values: { timestamp: string; value: number }[];
  labels?: Record<string, string>;
}

/** Extended AlertRule with severity for components */
export interface ComponentAlertRule extends AlertRule {
  severity?: AlertSeverity;
}

/** Extended Trace with startTime for components */
export interface ComponentTrace extends Trace {
  startTime?: string;
}

/** Extended Span with component-friendly status */
export interface ComponentSpan extends Omit<Span, 'status'> {
  status: TraceStatus | { code: string };
}
