/**
 * Enterprise Data Pipeline System
 * CUBE Nexum Platform v2.0 - Enterprise Grade
 * 
 * Features:
 * - ETL (Extract, Transform, Load) workflows
 * - Data validation & cleansing
 * - Schema mapping & transformation
 * - Multi-source data aggregation
 * - Real-time streaming support
 * - Data quality monitoring
 * - Compliance & auditing
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DataSourceType =
  | 'web_scraping'
  | 'api'
  | 'database'
  | 'file'
  | 'stream'
  | 'webhook'
  | 'queue'
  | 'email'
  | 'form';

export type DataDestinationType =
  | 'database'
  | 'file'
  | 'api'
  | 'stream'
  | 'queue'
  | 'email'
  | 'webhook'
  | 'data_warehouse';

export type TransformationType =
  | 'map'
  | 'filter'
  | 'aggregate'
  | 'join'
  | 'split'
  | 'merge'
  | 'deduplicate'
  | 'enrich'
  | 'validate'
  | 'cleanse'
  | 'normalize'
  | 'convert'
  | 'custom';

export type DataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'array'
  | 'object'
  | 'binary'
  | 'json';

export type PipelineStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// ============================================================================
// DATA SOURCE CONFIGURATION
// ============================================================================

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  description: string;
  config: DataSourceConfig;
  schema: DataSchema;
  credentials?: CredentialReference;
  sampling: SamplingConfig;
  incremental: IncrementalConfig;
  validation: SourceValidation;
  metadata: SourceMetadata;
}

export interface DataSourceConfig {
  // Web scraping
  url?: string;
  selector?: string;
  pagination?: PaginationConfig;
  
  // API
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  
  // Database
  connectionString?: string;
  query?: string;
  table?: string;
  
  // File
  path?: string;
  format?: 'csv' | 'json' | 'xml' | 'excel' | 'parquet' | 'avro';
  delimiter?: string;
  encoding?: string;
  
  // Stream
  streamUrl?: string;
  protocol?: 'kafka' | 'rabbitmq' | 'kinesis' | 'pubsub' | 'websocket';
  topic?: string;
  
  // Common
  batchSize?: number;
  timeout?: number;
  retries?: number;
}

export interface PaginationConfig {
  type: 'page_number' | 'offset' | 'cursor' | 'token' | 'link';
  pageParam?: string;
  offsetParam?: string;
  limitParam?: string;
  cursorParam?: string;
  maxPages?: number;
  itemsPerPage?: number;
}

export interface IncrementalConfig {
  enabled: boolean;
  strategy: 'timestamp' | 'id' | 'checksum' | 'version';
  field: string;
  lastValue?: unknown;
  watermark?: string;
}

export interface SamplingConfig {
  enabled: boolean;
  strategy: 'random' | 'systematic' | 'stratified' | 'first_n' | 'last_n';
  sampleSize?: number;
  sampleRate?: number;
  stratifyBy?: string;
}

export interface SourceValidation {
  enabled: boolean;
  rules: ValidationRule[];
  onFailure: 'skip' | 'fail' | 'quarantine';
  quarantineDestination?: string;
}

export interface SourceMetadata {
  createdAt: string;
  updatedAt: string;
  lastExtractedAt?: string;
  recordsExtracted?: number;
  avgExtractionTime?: number;
  errorRate?: number;
}

// ============================================================================
// DATA SCHEMA
// ============================================================================

export interface DataSchema {
  id: string;
  name: string;
  version: string;
  fields: SchemaField[];
  primaryKey?: string[];
  indexes?: SchemaIndex[];
  constraints?: SchemaConstraint[];
  documentation?: string;
}

export interface SchemaField {
  name: string;
  type: DataType;
  nullable: boolean;
  defaultValue?: unknown;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  description?: string;
  tags?: string[];
  sensitive?: boolean;
  pii?: boolean;
}

export interface SchemaIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface SchemaConstraint {
  name: string;
  type: 'unique' | 'check' | 'foreign_key' | 'not_null';
  fields: string[];
  expression?: string;
  reference?: {
    schema: string;
    field: string;
  };
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

export interface DataTransformation {
  id: string;
  name: string;
  type: TransformationType;
  description: string;
  config: TransformationConfig;
  inputSchema: DataSchema;
  outputSchema: DataSchema;
  validation: TransformationValidation;
  performance: TransformationPerformance;
}

export interface TransformationConfig {
  // Map transformation
  mappings?: FieldMapping[];
  
  // Filter transformation
  condition?: string;
  filterType?: 'include' | 'exclude';
  
  // Aggregate transformation
  groupBy?: string[];
  aggregations?: AggregationConfig[];
  
  // Join transformation
  joinType?: 'inner' | 'left' | 'right' | 'full' | 'cross';
  joinSource?: string;
  joinCondition?: string;
  
  // Split transformation
  splitField?: string;
  delimiter?: string;
  
  // Merge transformation
  mergeSources?: string[];
  mergeStrategy?: 'union' | 'intersect' | 'concat';
  
  // Deduplicate transformation
  dedupeFields?: string[];
  dedupeStrategy?: 'first' | 'last' | 'all';
  
  // Enrich transformation
  enrichSource?: string;
  enrichMapping?: Record<string, string>;
  
  // Cleanse transformation
  cleanseRules?: CleanseRule[];
  
  // Normalize transformation
  normalizeFields?: NormalizeConfig[];
  
  // Convert transformation
  conversions?: ConversionConfig[];
  
  // Custom transformation
  script?: string;
  language?: 'javascript' | 'python' | 'sql';
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: string;
  defaultValue?: unknown;
  required?: boolean;
}

export interface AggregationConfig {
  field: string;
  function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last' | 'array';
  alias: string;
  filter?: string;
}

export interface CleanseRule {
  field: string;
  type: 'trim' | 'lowercase' | 'uppercase' | 'remove_special' | 'remove_html' | 'regex_replace';
  pattern?: string;
  replacement?: string;
}

export interface NormalizeConfig {
  field: string;
  type: 'min_max' | 'z_score' | 'decimal_scaling' | 'log';
  min?: number;
  max?: number;
}

export interface ConversionConfig {
  field: string;
  fromType: DataType;
  toType: DataType;
  format?: string;
  timezone?: string;
  onError: 'null' | 'default' | 'fail';
  defaultValue?: unknown;
}

export interface TransformationValidation {
  preValidation: ValidationRule[];
  postValidation: ValidationRule[];
  qualityChecks: QualityCheck[];
}

export interface TransformationPerformance {
  avgProcessingTime: number;
  throughput: number;  // records per second
  memoryUsage: number;
  cpuUsage: number;
}

// ============================================================================
// VALIDATION & QUALITY
// ============================================================================

export interface ValidationRule {
  id: string;
  name: string;
  field?: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'unique' | 'reference' | 'custom';
  config: Record<string, unknown>;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface QualityCheck {
  id: string;
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'uniqueness' | 'validity';
  field?: string;
  threshold: number;
  config: Record<string, unknown>;
}

export interface QualityReport {
  pipelineId: string;
  executionId: string;
  timestamp: string;
  overallScore: number;
  level: QualityLevel;
  dimensions: QualityDimension[];
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityDimension {
  name: string;
  score: number;
  weight: number;
  details: QualityDetail[];
}

export interface QualityDetail {
  metric: string;
  value: number;
  threshold: number;
  passed: boolean;
  message?: string;
}

export interface QualityIssue {
  id: string;
  field?: string;
  type: string;
  severity: 'critical' | 'major' | 'minor';
  count: number;
  samples: unknown[];
  suggestedFix?: string;
}

// ============================================================================
// DATA DESTINATION
// ============================================================================

export interface DataDestination {
  id: string;
  name: string;
  type: DataDestinationType;
  description: string;
  config: DestinationConfig;
  schema: DataSchema;
  credentials?: CredentialReference;
  writeMode: WriteMode;
  errorHandling: ErrorHandlingConfig;
  metadata: DestinationMetadata;
}

export interface DestinationConfig {
  // Database
  connectionString?: string;
  table?: string;
  schema?: string;
  
  // File
  path?: string;
  format?: 'csv' | 'json' | 'xml' | 'excel' | 'parquet' | 'avro';
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
  partitionBy?: string[];
  
  // API
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  batchSize?: number;
  
  // Stream/Queue
  streamUrl?: string;
  topic?: string;
  protocol?: string;
  
  // Email
  recipients?: string[];
  subject?: string;
  template?: string;
  
  // Common
  timeout?: number;
  retries?: number;
}

export interface WriteMode {
  type: 'append' | 'overwrite' | 'upsert' | 'merge' | 'delete_insert';
  keyFields?: string[];
  updateFields?: string[];
  deleteCondition?: string;
  conflictResolution?: 'ignore' | 'update' | 'fail';
}

export interface ErrorHandlingConfig {
  onError: 'stop' | 'skip' | 'retry' | 'dead_letter';
  maxErrors?: number;
  retryAttempts?: number;
  retryDelay?: number;
  deadLetterDestination?: string;
}

export interface DestinationMetadata {
  createdAt: string;
  updatedAt: string;
  lastWrittenAt?: string;
  recordsWritten?: number;
  avgWriteTime?: number;
  errorRate?: number;
}

export interface CredentialReference {
  type: 'vault' | 'env' | 'file' | 'inline';
  reference: string;
  encrypted: boolean;
}

// ============================================================================
// DATA PIPELINE
// ============================================================================

export interface DataPipeline {
  id: string;
  name: string;
  description: string;
  version: string;
  status: PipelineStatus;
  sources: DataSource[];
  transformations: DataTransformation[];
  destinations: DataDestination[];
  flow: PipelineFlow;
  schedule: ScheduleConfig;
  monitoring: MonitoringConfig;
  alerting: AlertingConfig;
  compliance: ComplianceConfig;
  metadata: PipelineMetadata;
  // Component compatibility fields for visual builder
  nodes?: PipelineNode[];
  connections?: PipelineConnection[];
}

export interface PipelineFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
  errorHandlers: ErrorHandler[];
}

export interface FlowNode {
  id: string;
  type: 'source' | 'transform' | 'destination' | 'branch' | 'merge' | 'filter';
  referenceId: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface ErrorHandler {
  id: string;
  nodeId: string;
  errorTypes: string[];
  action: 'retry' | 'skip' | 'route' | 'fail';
  config: Record<string, unknown>;
}

export interface ScheduleConfig {
  enabled: boolean;
  type: 'cron' | 'interval' | 'event' | 'manual';
  cron?: string;
  interval?: number;  // seconds
  timezone?: string;
  startDate?: string;
  endDate?: string;
  maxConcurrent?: number;
  catchUp?: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number;  // seconds
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  tracing: boolean;
  profiling: boolean;
  customMetrics: MetricDefinition[];
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels: string[];
  description: string;
}

export interface AlertingConfig {
  enabled: boolean;
  rules: AlertRule[];
  channels: AlertChannel[];
  escalation: EscalationPolicy;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold?: number;
  window?: number;  // seconds
  severity: 'critical' | 'warning' | 'info';
  message: string;
  cooldown: number;  // seconds between alerts
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  config: Record<string, string>;
  enabled: boolean;
}

export interface EscalationPolicy {
  enabled: boolean;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  delayMinutes: number;
  channels: string[];
  recipients: string[];
}

export interface ComplianceConfig {
  enabled: boolean;
  dataRetention: {
    enabled: boolean;
    days: number;
    archiveDestination?: string;
  };
  dataLineage: {
    enabled: boolean;
    trackChanges: boolean;
  };
  piiHandling: {
    enabled: boolean;
    maskFields: string[];
    encryptFields: string[];
    anonymizeFields: string[];
  };
  auditLog: {
    enabled: boolean;
    logAccess: boolean;
    logChanges: boolean;
    retention: number;  // days
  };
}

export interface PipelineMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  tags: string[];
  category: string;
  labels?: Record<string, string>;
}

// ============================================================================
// PIPELINE EXECUTION
// ============================================================================

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  pipelineVersion: string;
  status: PipelineStatus;
  trigger: ExecutionTrigger;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  // Component compatibility fields
  startTime?: string;
  endTime?: string;
  recordsProcessed?: number;
  stages: StageExecution[];
  metrics: ExecutionMetrics;
  logs: ExecutionLog[];
  artifacts: ExecutionArtifact[];
  error?: ExecutionError;
}

export interface ExecutionTrigger {
  type: 'manual' | 'schedule' | 'api' | 'event' | 'dependency';
  triggeredBy?: string;
  triggerData?: Record<string, unknown>;
}

export interface StageExecution {
  nodeId: string;
  nodeName: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  recordsProcessed: number;
  recordsOutput: number;
  recordsError: number;
  metrics: Record<string, number>;
  error?: string;
}

export interface ExecutionMetrics {
  recordsRead: number;
  recordsWritten: number;
  recordsError: number;
  recordsSkipped: number;
  bytesRead: number;
  bytesWritten: number;
  transformationTime: number;
  networkTime: number;
  totalTime: number;
  throughput: number;
  qualityScore?: number;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  stage?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ExecutionArtifact {
  id: string;
  name: string;
  type: 'data' | 'report' | 'log' | 'screenshot' | 'schema';
  path: string;
  size: number;
  createdAt: string;
}

export interface ExecutionError {
  code: string;
  message: string;
  stage?: string;
  recordIndex?: number;
  stack?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique pipeline execution ID
 */
export function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate quality score from dimensions
 */
export function calculateQualityScore(dimensions: QualityDimension[]): number {
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const weightedSum = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Get quality level from score
 */
export function getQualityLevel(score: number): QualityLevel {
  if (score >= 95) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

/**
 * Validate field value against schema
 */
export function validateFieldValue(
  value: unknown,
  field: SchemaField
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Null check
  if (value === null || value === undefined) {
    if (!field.nullable) {
      errors.push(`Field "${field.name}" cannot be null`);
    }
    return { valid: errors.length === 0, errors };
  }

  // Type check
  const actualType = typeof value;
  const expectedType = field.type;
  
  if (expectedType === 'string' && actualType !== 'string') {
    errors.push(`Field "${field.name}" expected string, got ${actualType}`);
  }
  if ((expectedType === 'number' || expectedType === 'integer' || expectedType === 'float') && actualType !== 'number') {
    errors.push(`Field "${field.name}" expected number, got ${actualType}`);
  }
  if (expectedType === 'boolean' && actualType !== 'boolean') {
    errors.push(`Field "${field.name}" expected boolean, got ${actualType}`);
  }

  // String validations
  if (actualType === 'string') {
    const strValue = value as string;
    if (field.minLength && strValue.length < field.minLength) {
      errors.push(`Field "${field.name}" is shorter than minimum length ${field.minLength}`);
    }
    if (field.maxLength && strValue.length > field.maxLength) {
      errors.push(`Field "${field.name}" exceeds maximum length ${field.maxLength}`);
    }
    if (field.pattern && !new RegExp(field.pattern).test(strValue)) {
      errors.push(`Field "${field.name}" does not match pattern ${field.pattern}`);
    }
  }

  // Number validations
  if (actualType === 'number') {
    const numValue = value as number;
    if (field.minimum !== undefined && numValue < field.minimum) {
      errors.push(`Field "${field.name}" is less than minimum ${field.minimum}`);
    }
    if (field.maximum !== undefined && numValue > field.maximum) {
      errors.push(`Field "${field.name}" exceeds maximum ${field.maximum}`);
    }
  }

  // Enum validation
  if (field.enum && !field.enum.includes(value)) {
    errors.push(`Field "${field.name}" must be one of: ${field.enum.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Parse cron expression to next execution time
 */
export function getNextCronExecution(cron: string, from: Date = new Date()): Date | null {
  // Simplified cron parser - in production use a library like 'cron-parser'
  const parts = cron.split(' ');
  if (parts.length !== 5) return null;
  
  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);
  next.setMinutes(next.getMinutes() + 1);
  
  return next;
}

/**
 * Get default pipeline configuration
 */
export function getDefaultPipelineConfig(): Partial<DataPipeline> {
  return {
    status: 'draft',
    schedule: {
      enabled: false,
      type: 'manual',
      timezone: 'UTC',
      maxConcurrent: 1,
      catchUp: false,
    },
    monitoring: {
      enabled: true,
      metricsInterval: 60,
      logLevel: 'info',
      tracing: true,
      profiling: false,
      customMetrics: [],
    },
    alerting: {
      enabled: true,
      rules: [],
      channels: [],
      escalation: {
        enabled: false,
        levels: [],
      },
    },
    compliance: {
      enabled: true,
      dataRetention: {
        enabled: true,
        days: 90,
      },
      dataLineage: {
        enabled: true,
        trackChanges: true,
      },
      piiHandling: {
        enabled: true,
        maskFields: [],
        encryptFields: [],
        anonymizeFields: [],
      },
      auditLog: {
        enabled: true,
        logAccess: true,
        logChanges: true,
        retention: 365,
      },
    },
  };
}

// ============================================================================
// COMPONENT COMPATIBILITY TYPES
// Used by enterprise dashboard components
// ============================================================================

export type PipelineNodeType = 
  | 'source'
  | 'transform'
  | 'destination'
  | 'filter'
  | 'aggregate'
  | 'join'
  | 'branch'
  | 'merge'
  | 'loop'
  | 'error_handler';

export interface PipelineNode {
  id: string;
  type: PipelineNodeType;
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  status?: 'idle' | 'running' | 'completed' | 'failed';
  inputs?: PipelinePort[];
  outputs?: PipelinePort[];
}

export interface PipelinePort {
  id: string;
  name: string;
  type: string;
}

export interface PipelineConnection {
  id: string;
  sourceId: string;
  sourceNodeId?: string;
  sourcePort?: string;
  targetId: string;
  targetNodeId?: string;
  targetPort?: string;
  label?: string;
}

/** Extended DataPipeline with nodes/connections for visual builder */
export interface VisualDataPipeline extends DataPipeline {
  nodes?: PipelineNode[];
  connections?: PipelineConnection[];
}

/** Extended PipelineExecution with timing for components */
export interface ComponentPipelineExecution extends PipelineExecution {
  startTime?: string;
  endTime?: string;
  recordsProcessed?: number;
}
