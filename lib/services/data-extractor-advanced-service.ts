/**
 * Data Extractor Advanced Service - Enterprise Data Pipeline
 *
 * Enterprise-grade data extraction, transformation, and pipeline
 * management with anti-ban measures, schema validation, and ETL.
 *
 * M5 Features:
 * - Schema validation (JSON Schema)
 * - Anti-ban measures (rate limiting, fingerprint rotation)
 * - Data pipelines (ETL)
 * - Export formats (JSON, CSV, Excel, Parquet)
 * - Data quality scoring
 * - Deduplication
 * - Data transformation
 * - Scheduling
 *
 * @module DataExtractorAdvancedService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// Schema Validation Types
// ============================================================================

export interface DataSchema {
  /**
   * Schema ID
   */
  id: string;

  /**
   * Schema name
   */
  name: string;

  /**
   * Schema description
   */
  description?: string;

  /**
   * Schema version
   */
  version: string;

  /**
   * JSON Schema definition
   */
  schema: JSONSchema;

  /**
   * Field definitions
   */
  fields: SchemaField[];

  /**
   * Validation rules
   */
  validationRules: ValidationRule[];

  /**
   * Transformation rules
   */
  transformations: TransformationRule[];

  /**
   * Is active
   */
  isActive: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;

  /**
   * Usage count
   */
  usageCount: number;
}

export interface JSONSchema {
  $schema?: string;
  $id?: string;
  type: 'object' | 'array';
  title?: string;
  description?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JSONSchemaProperty;
  definitions?: Record<string, JSONSchemaProperty>;
}

export interface JSONSchemaProperty {
  type: JSONSchemaType | JSONSchemaType[];
  title?: string;
  description?: string;
  format?: string;
  pattern?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  properties?: Record<string, JSONSchemaProperty>;
  items?: JSONSchemaProperty | JSONSchemaProperty[];
  required?: string[];
  additionalProperties?: boolean;
  oneOf?: JSONSchemaProperty[];
  anyOf?: JSONSchemaProperty[];
  allOf?: JSONSchemaProperty[];
  not?: JSONSchemaProperty;
  $ref?: string;
}

export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface SchemaField {
  /**
   * Field name
   */
  name: string;

  /**
   * Field path (dot notation)
   */
  path: string;

  /**
   * Field type
   */
  type: FieldType;

  /**
   * Is required
   */
  required: boolean;

  /**
   * Default value
   */
  defaultValue?: unknown;

  /**
   * Description
   */
  description?: string;

  /**
   * Validation pattern
   */
  pattern?: string;

  /**
   * Allowed values
   */
  allowedValues?: unknown[];

  /**
   * Is array
   */
  isArray: boolean;

  /**
   * Nested fields (for objects)
   */
  nestedFields?: SchemaField[];

  /**
   * Display order
   */
  order: number;

  /**
   * Is primary key
   */
  isPrimaryKey: boolean;

  /**
   * Is unique
   */
  isUnique: boolean;

  /**
   * Is indexed
   */
  isIndexed: boolean;
}

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'phone'
  | 'currency'
  | 'percentage'
  | 'uuid'
  | 'object'
  | 'array'
  | 'binary'
  | 'json';

export interface ValidationRule {
  /**
   * Rule ID
   */
  id: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Target field path
   */
  fieldPath: string;

  /**
   * Rule type
   */
  type: ValidationRuleType;

  /**
   * Rule configuration
   */
  config: Record<string, unknown>;

  /**
   * Error message
   */
  errorMessage: string;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Severity
   */
  severity: 'error' | 'warning' | 'info';
}

export type ValidationRuleType =
  | 'required'
  | 'type'
  | 'pattern'
  | 'range'
  | 'length'
  | 'enum'
  | 'unique'
  | 'custom'
  | 'dependency'
  | 'conditional';

export interface TransformationRule {
  /**
   * Rule ID
   */
  id: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Source field path
   */
  sourcePath: string;

  /**
   * Target field path
   */
  targetPath: string;

  /**
   * Transformation type
   */
  type: TransformationType;

  /**
   * Transformation configuration
   */
  config: Record<string, unknown>;

  /**
   * Order of execution
   */
  order: number;

  /**
   * Is enabled
   */
  isEnabled: boolean;
}

export type TransformationType =
  | 'copy'
  | 'rename'
  | 'map'
  | 'format'
  | 'calculate'
  | 'split'
  | 'join'
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'replace'
  | 'regex'
  | 'date-format'
  | 'number-format'
  | 'currency-format'
  | 'json-parse'
  | 'json-stringify'
  | 'base64-encode'
  | 'base64-decode'
  | 'hash'
  | 'encrypt'
  | 'custom';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRecords: number;
  invalidRecords: number;
  fieldStats: Record<string, FieldValidationStats>;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value?: unknown;
  rowIndex?: number;
  severity: 'error' | 'warning' | 'info';
}

export interface FieldValidationStats {
  total: number;
  valid: number;
  invalid: number;
  missing: number;
  uniqueValues: number;
  nullCount: number;
}

// ============================================================================
// Anti-Ban Types
// ============================================================================

export interface AntiBanConfig {
  /**
   * Config ID
   */
  id: string;

  /**
   * Config name
   */
  name: string;

  /**
   * Rate limiting
   */
  rateLimiting: RateLimitConfig;

  /**
   * Request delays
   */
  delays: DelayConfig;

  /**
   * Fingerprint rotation
   */
  fingerprintRotation: FingerprintRotationConfig;

  /**
   * Proxy rotation
   */
  proxyRotation: ProxyRotationConfig;

  /**
   * User agent rotation
   */
  userAgentRotation: UserAgentRotationConfig;

  /**
   * Captcha handling
   */
  captchaHandling: CaptchaConfig;

  /**
   * Error handling
   */
  errorHandling: ErrorHandlingConfig;

  /**
   * Human behavior simulation
   */
  humanBehavior: HumanBehaviorConfig;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface RateLimitConfig {
  /**
   * Enable rate limiting
   */
  enabled: boolean;

  /**
   * Requests per minute
   */
  requestsPerMinute: number;

  /**
   * Requests per hour
   */
  requestsPerHour: number;

  /**
   * Requests per day
   */
  requestsPerDay: number;

  /**
   * Concurrent requests
   */
  concurrentRequests: number;

  /**
   * Burst limit
   */
  burstLimit: number;

  /**
   * Domain-specific limits
   */
  domainLimits: Record<string, { rpm: number; rph: number }>;
}

export interface DelayConfig {
  /**
   * Minimum delay between requests (ms)
   */
  minDelay: number;

  /**
   * Maximum delay between requests (ms)
   */
  maxDelay: number;

  /**
   * Delay variance (randomization)
   */
  variance: number;

  /**
   * Progressive delay on consecutive requests
   */
  progressiveDelay: boolean;

  /**
   * Delay multiplier
   */
  multiplier: number;
}

export interface FingerprintRotationConfig {
  /**
   * Enable fingerprint rotation
   */
  enabled: boolean;

  /**
   * Rotation interval (requests)
   */
  rotationInterval: number;

  /**
   * Fingerprint pool IDs
   */
  fingerprintPoolIds: string[];

  /**
   * Rotate on error
   */
  rotateOnError: boolean;

  /**
   * Rotate on status codes
   */
  rotateOnStatusCodes: number[];
}

export interface ProxyRotationConfig {
  /**
   * Enable proxy rotation
   */
  enabled: boolean;

  /**
   * Proxy pool ID
   */
  proxyPoolId: string;

  /**
   * Rotation strategy
   */
  strategy: 'round-robin' | 'random' | 'weighted' | 'geographic';

  /**
   * Rotation interval (requests)
   */
  rotationInterval: number;

  /**
   * Sticky session duration (seconds)
   */
  stickySessionDuration: number;

  /**
   * Rotate on error
   */
  rotateOnError: boolean;

  /**
   * Rotate on ban detection
   */
  rotateOnBan: boolean;
}

export interface UserAgentRotationConfig {
  /**
   * Enable user agent rotation
   */
  enabled: boolean;

  /**
   * User agent pool
   */
  userAgents: string[];

  /**
   * Rotation interval (requests)
   */
  rotationInterval: number;

  /**
   * Browser distribution
   */
  browserDistribution: Record<string, number>;

  /**
   * Platform distribution
   */
  platformDistribution: Record<string, number>;
}

export interface CaptchaConfig {
  /**
   * Enable captcha handling
   */
  enabled: boolean;

  /**
   * Auto-solve captchas
   */
  autoSolve: boolean;

  /**
   * Captcha service
   */
  service: 'manual' | '2captcha' | 'anticaptcha' | 'capmonster';

  /**
   * API key
   */
  apiKey?: string;

  /**
   * Max retries
   */
  maxRetries: number;

  /**
   * Timeout (seconds)
   */
  timeout: number;
}

export interface ErrorHandlingConfig {
  /**
   * Max retries
   */
  maxRetries: number;

  /**
   * Retry delay (ms)
   */
  retryDelay: number;

  /**
   * Exponential backoff
   */
  exponentialBackoff: boolean;

  /**
   * Backoff multiplier
   */
  backoffMultiplier: number;

  /**
   * Max backoff (ms)
   */
  maxBackoff: number;

  /**
   * Retry on status codes
   */
  retryOnStatusCodes: number[];

  /**
   * Abort on status codes
   */
  abortOnStatusCodes: number[];
}

export interface HumanBehaviorConfig {
  /**
   * Enable human behavior simulation
   */
  enabled: boolean;

  /**
   * Mouse movement simulation
   */
  mouseMovement: boolean;

  /**
   * Scroll simulation
   */
  scrollSimulation: boolean;

  /**
   * Typing simulation (with random delays)
   */
  typingSimulation: boolean;

  /**
   * Random pauses
   */
  randomPauses: boolean;

  /**
   * Activity patterns
   */
  activityPatterns: {
    morningActivity: number;
    afternoonActivity: number;
    eveningActivity: number;
    nightActivity: number;
  };
}

// ============================================================================
// Data Pipeline Types
// ============================================================================

export interface DataPipeline {
  /**
   * Pipeline ID
   */
  id: string;

  /**
   * Pipeline name
   */
  name: string;

  /**
   * Pipeline description
   */
  description?: string;

  /**
   * Source configuration
   */
  source: PipelineSource;

  /**
   * Transformation steps
   */
  transformations: PipelineTransformation[];

  /**
   * Destination configuration
   */
  destination: PipelineDestination;

  /**
   * Schema ID for validation
   */
  schemaId?: string;

  /**
   * Anti-ban config ID
   */
  antiBanConfigId?: string;

  /**
   * Schedule
   */
  schedule?: PipelineSchedule;

  /**
   * Error handling
   */
  errorHandling: PipelineErrorHandling;

  /**
   * Notifications
   */
  notifications: PipelineNotifications;

  /**
   * Status
   */
  status: PipelineStatus;

  /**
   * Last run
   */
  lastRun?: PipelineRun;

  /**
   * Statistics
   */
  stats: PipelineStats;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export type PipelineStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'scheduled';

export interface PipelineSource {
  /**
   * Source type
   */
  type: 'scraper' | 'api' | 'file' | 'database' | 'webhook';

  /**
   * Source configuration
   */
  config: Record<string, unknown>;

  /**
   * Scraper ID (if scraper source)
   */
  scraperId?: string;

  /**
   * API endpoint (if API source)
   */
  apiEndpoint?: string;

  /**
   * File path (if file source)
   */
  filePath?: string;

  /**
   * Database connection (if database source)
   */
  databaseConnection?: string;

  /**
   * Pagination settings
   */
  pagination?: {
    type: 'page' | 'cursor' | 'offset';
    pageSize: number;
    maxPages?: number;
  };

  /**
   * Incremental extraction settings
   */
  incremental?: {
    enabled: boolean;
    field: string;
    lastValue?: unknown;
  };
}

export interface PipelineTransformation {
  /**
   * Transformation ID
   */
  id: string;

  /**
   * Transformation name
   */
  name: string;

  /**
   * Transformation type
   */
  type: PipelineTransformationType;

  /**
   * Configuration
   */
  config: Record<string, unknown>;

  /**
   * Order
   */
  order: number;

  /**
   * Is enabled
   */
  isEnabled: boolean;
}

export type PipelineTransformationType =
  | 'filter'
  | 'map'
  | 'reduce'
  | 'sort'
  | 'deduplicate'
  | 'enrich'
  | 'validate'
  | 'transform'
  | 'split'
  | 'merge'
  | 'aggregate'
  | 'lookup'
  | 'custom';

export interface PipelineDestination {
  /**
   * Destination type
   */
  type: 'file' | 'database' | 'api' | 'webhook' | 'storage';

  /**
   * Destination configuration
   */
  config: Record<string, unknown>;

  /**
   * Output format
   */
  format?: ExportFormat;

  /**
   * Write mode
   */
  writeMode: 'append' | 'overwrite' | 'merge' | 'upsert';

  /**
   * Batch size
   */
  batchSize: number;

  /**
   * Compression
   */
  compression?: 'none' | 'gzip' | 'zip' | 'lz4';
}

export type ExportFormat =
  | 'json'
  | 'jsonl'
  | 'csv'
  | 'excel'
  | 'parquet'
  | 'xml'
  | 'yaml'
  | 'sql';

export interface PipelineSchedule {
  /**
   * Schedule type
   */
  type: 'cron' | 'interval' | 'once';

  /**
   * Cron expression (if cron type)
   */
  cron?: string;

  /**
   * Interval (seconds, if interval type)
   */
  interval?: number;

  /**
   * Scheduled time (if once type)
   */
  scheduledAt?: number;

  /**
   * Timezone
   */
  timezone: string;

  /**
   * Next run time
   */
  nextRun?: number;

  /**
   * Is active
   */
  isActive: boolean;
}

export interface PipelineErrorHandling {
  /**
   * Max errors before stopping
   */
  maxErrors: number;

  /**
   * Continue on error
   */
  continueOnError: boolean;

  /**
   * Error log path
   */
  errorLogPath?: string;

  /**
   * Dead letter queue
   */
  deadLetterQueue?: {
    enabled: boolean;
    destination: string;
  };

  /**
   * Retry policy
   */
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoff: number;
  };
}

export interface PipelineNotifications {
  /**
   * Notify on success
   */
  onSuccess: boolean;

  /**
   * Notify on failure
   */
  onFailure: boolean;

  /**
   * Notify on warning
   */
  onWarning: boolean;

  /**
   * Email recipients
   */
  emailRecipients: string[];

  /**
   * Slack webhook
   */
  slackWebhook?: string;

  /**
   * Custom webhook
   */
  customWebhook?: string;
}

export interface PipelineRun {
  /**
   * Run ID
   */
  id: string;

  /**
   * Pipeline ID
   */
  pipelineId: string;

  /**
   * Start time
   */
  startedAt: number;

  /**
   * End time
   */
  endedAt?: number;

  /**
   * Duration (ms)
   */
  duration?: number;

  /**
   * Status
   */
  status: 'running' | 'completed' | 'failed' | 'cancelled';

  /**
   * Records processed
   */
  recordsProcessed: number;

  /**
   * Records succeeded
   */
  recordsSucceeded: number;

  /**
   * Records failed
   */
  recordsFailed: number;

  /**
   * Bytes processed
   */
  bytesProcessed: number;

  /**
   * Errors
   */
  errors: PipelineError[];

  /**
   * Trigger type
   */
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'api';

  /**
   * Triggered by
   */
  triggeredBy?: string;
}

export interface PipelineError {
  timestamp: number;
  stage: string;
  message: string;
  recordIndex?: number;
  data?: unknown;
  stack?: string;
}

export interface PipelineStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalRecordsProcessed: number;
  totalBytesProcessed: number;
  averageDuration: number;
  lastSuccessfulRun?: number;
}

// ============================================================================
// Data Quality Types
// ============================================================================

export interface DataQualityReport {
  /**
   * Report ID
   */
  id: string;

  /**
   * Overall quality score (0-100)
   */
  overallScore: number;

  /**
   * Completeness score
   */
  completenessScore: number;

  /**
   * Accuracy score
   */
  accuracyScore: number;

  /**
   * Consistency score
   */
  consistencyScore: number;

  /**
   * Uniqueness score
   */
  uniquenessScore: number;

  /**
   * Timeliness score
   */
  timelinessScore: number;

  /**
   * Total records
   */
  totalRecords: number;

  /**
   * Field quality
   */
  fieldQuality: FieldQuality[];

  /**
   * Issues found
   */
  issues: DataQualityIssue[];

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Generated timestamp
   */
  generatedAt: number;
}

export interface FieldQuality {
  field: string;
  completeness: number;
  accuracy: number;
  consistency: number;
  uniqueness: number;
  nullCount: number;
  errorCount: number;
  distinctValues: number;
  sampleValues: unknown[];
}

export interface DataQualityIssue {
  type: 'missing' | 'invalid' | 'duplicate' | 'inconsistent' | 'outlier';
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  description: string;
  affectedRecords: number;
  sampleRecords?: number[];
  recommendation: string;
}

// ============================================================================
// Schema Validation Service
// ============================================================================

export const SchemaValidationService = {
  /**
   * Create a schema
   */
  createSchema: async (
    schema: Omit<DataSchema, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<DataSchema> => {
    TelemetryService.trackEvent('data_schema_created');

    return invoke<DataSchema>('schema_create', { schema });
  },

  /**
   * Get all schemas
   */
  getSchemas: async (): Promise<DataSchema[]> => {
    return invoke<DataSchema[]>('schema_get_all');
  },

  /**
   * Get schema by ID
   */
  getSchema: async (schemaId: string): Promise<DataSchema | null> => {
    return invoke<DataSchema | null>('schema_get', { schemaId });
  },

  /**
   * Update schema
   */
  updateSchema: async (
    schemaId: string,
    updates: Partial<DataSchema>
  ): Promise<DataSchema> => {
    return invoke<DataSchema>('schema_update', { schemaId, updates });
  },

  /**
   * Delete schema
   */
  deleteSchema: async (schemaId: string): Promise<void> => {
    return invoke('schema_delete', { schemaId });
  },

  /**
   * Validate data against schema
   */
  validateData: async (
    schemaId: string,
    data: unknown[]
  ): Promise<ValidationResult> => {
    return invoke<ValidationResult>('schema_validate_data', { schemaId, data });
  },

  /**
   * Generate schema from sample data
   */
  generateFromData: async (
    data: unknown[],
    name: string
  ): Promise<DataSchema> => {
    return invoke<DataSchema>('schema_generate_from_data', { data, name });
  },

  /**
   * Export schema
   */
  exportSchema: async (
    schemaId: string,
    format: 'json-schema' | 'typescript' | 'graphql'
  ): Promise<string> => {
    return invoke<string>('schema_export', { schemaId, format });
  },

  /**
   * Import schema
   */
  importSchema: async (
    data: string,
    format: 'json-schema' | 'typescript'
  ): Promise<DataSchema> => {
    return invoke<DataSchema>('schema_import', { data, format });
  },

  /**
   * Clone schema
   */
  cloneSchema: async (schemaId: string, name: string): Promise<DataSchema> => {
    return invoke<DataSchema>('schema_clone', { schemaId, name });
  },
};

// ============================================================================
// Anti-Ban Service
// ============================================================================

export const AntiBanService = {
  /**
   * Create anti-ban config
   */
  createConfig: async (
    config: Omit<AntiBanConfig, 'id' | 'createdAt'>
  ): Promise<AntiBanConfig> => {
    TelemetryService.trackEvent('antiban_config_created');

    return invoke<AntiBanConfig>('antiban_create_config', { config });
  },

  /**
   * Get all configs
   */
  getConfigs: async (): Promise<AntiBanConfig[]> => {
    return invoke<AntiBanConfig[]>('antiban_get_configs');
  },

  /**
   * Get config by ID
   */
  getConfig: async (configId: string): Promise<AntiBanConfig | null> => {
    return invoke<AntiBanConfig | null>('antiban_get_config', { configId });
  },

  /**
   * Update config
   */
  updateConfig: async (
    configId: string,
    updates: Partial<AntiBanConfig>
  ): Promise<AntiBanConfig> => {
    return invoke<AntiBanConfig>('antiban_update_config', { configId, updates });
  },

  /**
   * Delete config
   */
  deleteConfig: async (configId: string): Promise<void> => {
    return invoke('antiban_delete_config', { configId });
  },

  /**
   * Apply config to session
   */
  applyConfig: async (
    configId: string,
    sessionId: string
  ): Promise<void> => {
    return invoke('antiban_apply_config', { configId, sessionId });
  },

  /**
   * Get rate limit status
   */
  getRateLimitStatus: async (
    domain: string
  ): Promise<{
    remaining: number;
    resetAt: number;
    isLimited: boolean;
  }> => {
    return invoke('antiban_get_rate_limit_status', { domain });
  },

  /**
   * Report ban detection
   */
  reportBan: async (
    domain: string,
    details: { statusCode: number; message?: string }
  ): Promise<void> => {
    TelemetryService.trackEvent('ban_detected', { domain });

    return invoke('antiban_report_ban', { domain, details });
  },
};

// ============================================================================
// Data Pipeline Service
// ============================================================================

export const DataPipelineService = {
  /**
   * Create a pipeline
   */
  createPipeline: async (
    pipeline: Omit<DataPipeline, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'stats'>
  ): Promise<DataPipeline> => {
    TelemetryService.trackEvent('data_pipeline_created');

    return invoke<DataPipeline>('pipeline_create', { pipeline });
  },

  /**
   * Get all pipelines
   */
  getPipelines: async (): Promise<DataPipeline[]> => {
    return invoke<DataPipeline[]>('pipeline_get_all');
  },

  /**
   * Get pipeline by ID
   */
  getPipeline: async (pipelineId: string): Promise<DataPipeline | null> => {
    return invoke<DataPipeline | null>('pipeline_get', { pipelineId });
  },

  /**
   * Update pipeline
   */
  updatePipeline: async (
    pipelineId: string,
    updates: Partial<DataPipeline>
  ): Promise<DataPipeline> => {
    return invoke<DataPipeline>('pipeline_update', { pipelineId, updates });
  },

  /**
   * Delete pipeline
   */
  deletePipeline: async (pipelineId: string): Promise<void> => {
    return invoke('pipeline_delete', { pipelineId });
  },

  /**
   * Run pipeline
   */
  runPipeline: async (pipelineId: string): Promise<PipelineRun> => {
    const spanId = TelemetryService.startSpan('pipeline.run', {
      kind: SpanKind.CLIENT,
    });

    try {
      const run = await invoke<PipelineRun>('pipeline_run', { pipelineId });
      TelemetryService.endSpan(spanId);
      return run;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Stop pipeline
   */
  stopPipeline: async (pipelineId: string): Promise<void> => {
    return invoke('pipeline_stop', { pipelineId });
  },

  /**
   * Pause pipeline
   */
  pausePipeline: async (pipelineId: string): Promise<void> => {
    return invoke('pipeline_pause', { pipelineId });
  },

  /**
   * Resume pipeline
   */
  resumePipeline: async (pipelineId: string): Promise<void> => {
    return invoke('pipeline_resume', { pipelineId });
  },

  /**
   * Get pipeline runs
   */
  getRuns: async (
    pipelineId: string,
    limit?: number
  ): Promise<PipelineRun[]> => {
    return invoke<PipelineRun[]>('pipeline_get_runs', { pipelineId, limit });
  },

  /**
   * Get run details
   */
  getRunDetails: async (runId: string): Promise<PipelineRun | null> => {
    return invoke<PipelineRun | null>('pipeline_get_run_details', { runId });
  },

  /**
   * Clone pipeline
   */
  clonePipeline: async (
    pipelineId: string,
    name: string
  ): Promise<DataPipeline> => {
    return invoke<DataPipeline>('pipeline_clone', { pipelineId, name });
  },

  /**
   * Export pipeline
   */
  exportPipeline: async (pipelineId: string): Promise<string> => {
    return invoke<string>('pipeline_export', { pipelineId });
  },

  /**
   * Import pipeline
   */
  importPipeline: async (data: string): Promise<DataPipeline> => {
    return invoke<DataPipeline>('pipeline_import', { data });
  },

  /**
   * Test pipeline
   */
  testPipeline: async (
    pipelineId: string,
    sampleSize?: number
  ): Promise<{
    success: boolean;
    sampleOutput: unknown[];
    errors: string[];
  }> => {
    return invoke('pipeline_test', { pipelineId, sampleSize });
  },
};

// ============================================================================
// Data Quality Service
// ============================================================================

export const DataQualityService = {
  /**
   * Generate quality report
   */
  generateReport: async (
    data: unknown[],
    schemaId?: string
  ): Promise<DataQualityReport> => {
    TelemetryService.trackEvent('data_quality_report_generated');

    return invoke<DataQualityReport>('quality_generate_report', {
      data,
      schemaId,
    });
  },

  /**
   * Check data completeness
   */
  checkCompleteness: async (
    data: unknown[],
    requiredFields: string[]
  ): Promise<{
    score: number;
    missingFields: { field: string; missingCount: number }[];
  }> => {
    return invoke('quality_check_completeness', { data, requiredFields });
  },

  /**
   * Find duplicates
   */
  findDuplicates: async (
    data: unknown[],
    keys: string[]
  ): Promise<{
    duplicateCount: number;
    duplicateGroups: { key: unknown; indices: number[] }[];
  }> => {
    return invoke('quality_find_duplicates', { data, keys });
  },

  /**
   * Remove duplicates
   */
  removeDuplicates: async (
    data: unknown[],
    keys: string[],
    strategy: 'first' | 'last' | 'merge'
  ): Promise<unknown[]> => {
    return invoke<unknown[]>('quality_remove_duplicates', {
      data,
      keys,
      strategy,
    });
  },

  /**
   * Detect outliers
   */
  detectOutliers: async (
    data: unknown[],
    field: string,
    method: 'zscore' | 'iqr' | 'isolation-forest'
  ): Promise<{
    outliers: number[];
    stats: { mean: number; std: number; min: number; max: number };
  }> => {
    return invoke('quality_detect_outliers', { data, field, method });
  },

  /**
   * Profile data
   */
  profileData: async (
    data: unknown[]
  ): Promise<{
    rowCount: number;
    columnCount: number;
    columns: {
      name: string;
      type: string;
      nullCount: number;
      uniqueCount: number;
      min?: unknown;
      max?: unknown;
      mean?: number;
      median?: number;
      mode?: unknown;
      topValues: { value: unknown; count: number }[];
    }[];
  }> => {
    return invoke('quality_profile_data', { data });
  },
};

// ============================================================================
// Data Export Service
// ============================================================================

export const DataExportService = {
  /**
   * Export data
   */
  exportData: async (
    data: unknown[],
    format: ExportFormat,
    options?: {
      filename?: string;
      schema?: DataSchema;
      compression?: 'none' | 'gzip' | 'zip';
      includeHeaders?: boolean;
      dateFormat?: string;
      numberFormat?: string;
    }
  ): Promise<string | Blob> => {
    TelemetryService.trackEvent('data_exported', { format });

    return invoke<string>('export_data', { data, format, options });
  },

  /**
   * Export to JSON
   */
  toJSON: async (
    data: unknown[],
    options?: { pretty?: boolean; includeMetadata?: boolean }
  ): Promise<string> => {
    return invoke<string>('export_to_json', { data, options });
  },

  /**
   * Export to CSV
   */
  toCSV: async (
    data: unknown[],
    options?: {
      delimiter?: string;
      includeHeaders?: boolean;
      escapeQuotes?: boolean;
    }
  ): Promise<string> => {
    return invoke<string>('export_to_csv', { data, options });
  },

  /**
   * Export to Excel
   */
  toExcel: async (
    data: unknown[],
    options?: {
      sheetName?: string;
      includeHeaders?: boolean;
      autoWidth?: boolean;
    }
  ): Promise<Blob> => {
    return invoke<Blob>('export_to_excel', { data, options });
  },

  /**
   * Export to Parquet
   */
  toParquet: async (
    data: unknown[],
    schema?: DataSchema
  ): Promise<Blob> => {
    return invoke<Blob>('export_to_parquet', { data, schema });
  },

  /**
   * Export to SQL
   */
  toSQL: async (
    data: unknown[],
    tableName: string,
    options?: {
      dialect?: 'mysql' | 'postgres' | 'sqlite' | 'mssql';
      createTable?: boolean;
      batchSize?: number;
    }
  ): Promise<string> => {
    return invoke<string>('export_to_sql', { data, tableName, options });
  },
};

// ============================================================================
// Export
// ============================================================================

export const DataExtractorAdvancedServices = {
  Schema: SchemaValidationService,
  AntiBan: AntiBanService,
  Pipeline: DataPipelineService,
  Quality: DataQualityService,
  Export: DataExportService,
};

export default DataExtractorAdvancedServices;
