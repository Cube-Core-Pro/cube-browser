/**
 * CUBE Nexum Platform v2.0 - Enterprise Type System Index
 * Enterprise Grade - Complete Type Exports
 * 
 * This file serves as the central export hub for all enterprise-grade
 * type definitions used throughout the CUBE Nexum platform.
 * 
 * Note: Enterprise modules are exported as namespaces to avoid naming conflicts
 */

// ============================================================================
// ENTERPRISE MODULE NAMESPACES
// ============================================================================

import * as AutomationEnterprise from './automation-enterprise';
import * as APIGateway from './api-gateway';
import * as DataPipeline from './data-pipeline';
import * as IntegrationHub from './integration-hub';
import * as Observability from './observability';
import * as SecurityCompliance from './security-compliance';

export {
  AutomationEnterprise,
  APIGateway,
  DataPipeline,
  IntegrationHub,
  Observability,
  SecurityCompliance,
};

// ============================================================================
// RE-EXPORT SPECIFIC TYPES (Non-conflicting)
// ============================================================================

// Automation Enterprise - Core types
export type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowVariable,
  WorkflowSettings,
  WorkflowMetadata,
  WorkflowAnalytics,
  WorkflowTemplate,
  WorkflowError,
  RetryConfig,
  RateLimitConfig,
  WorkflowStatus,
  TriggerType,
  ActionType,
} from './automation-enterprise';

// API Gateway - Core types
export type {
  ApiEndpoint,
  ApiCollection,
  ApiEnvironment,
  RateLimitingConfig,
  CachingConfig,
  TransformationConfig,
  CircuitBreakerConfig,
  ProxyConfig as ApiProxyConfig,
  MonitoringConfig as ApiMonitoringConfig,
  HttpMethod,
  AuthType,
  OAuth2Config,
} from './api-gateway';

// Data Pipeline - Core types
export type {
  DataPipeline as DataPipelineDefinition,
  DataSource,
  DataSchema,
  PipelineExecution,
  PipelineFlow,
  QualityReport,
  QualityCheck,
  ValidationRule,
  DataSourceType,
  DataDestinationType,
  TransformationType,
  PipelineStatus,
  QualityLevel,
} from './data-pipeline';

// Integration Hub - Core types
export type {
  ConnectedIntegration,
  IntegrationDefinition,
  IntegrationRegistry,
  WebhookConfiguration,
  SyncExecution,
  DataMapping,
  SyncConfiguration,
  IntegrationCategory,
  IntegrationStatus,
  SyncDirection,
  SyncMode,
} from './integration-hub';

// Observability - Core types
export type {
  SystemMetrics,
  Trace,
  Span,
  LogEntry,
  Alert,
  Dashboard,
  SLADefinition,
  SLO,
  SLAReport,
  MetricType,
  LogLevel,
  AlertSeverity,
  AlertState,
  IncidentPriority,
  HealthStatus,
} from './observability';

// Security & Compliance - Core types
export type {
  User,
  Role,
  Permission,
  ABACPolicy,
  ComplianceProgram,
  ThreatAlert,
  DataClassification,
  EncryptionKey,
  SecretEntry,
  SecurityLevel,
  ComplianceFramework,
  ThreatSeverity,
  AuthMethod,
} from './security-compliance';

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Deep partial type utility
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep required type utility
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Nullable type utility
 */
export type Nullable<T> = T | null;

/**
 * Optional type utility
 */
export type Optional<T> = T | undefined;

/**
 * Record with string keys
 */
export type StringRecord<T> = Record<string, T>;

/**
 * Async function type
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Callback function type
 */
export type Callback<T = void> = (data: T) => void;

/**
 * Error callback type
 */
export type ErrorCallback = (error: Error) => void;

/**
 * Result type for operations
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex';
  value: unknown;
}

/**
 * Query parameters
 */
export interface QueryParams {
  filters?: FilterParams[];
  sort?: SortParams[];
  pagination?: PaginationParams;
  search?: string;
  include?: string[];
  exclude?: string[];
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    duration: number;
  };
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  total: number;
  successful: number;
  failed: number;
  results: BatchResultItem<T>[];
}

export interface BatchResultItem<T> {
  index: number;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Event payload
 */
export interface EventPayload<T = unknown> {
  type: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook payload
 */
export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: string;
  signature?: string;
  data: T;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }[];
  timestamp: string;
}

/**
 * Configuration object
 */
export interface ConfigurationObject {
  [key: string]: string | number | boolean | null | ConfigurationObject | ConfigurationObject[];
}

// ============================================================================
// PLATFORM CONSTANTS
// ============================================================================

/**
 * Platform version
 */
export const PLATFORM_VERSION = '2.0.0';

/**
 * Platform name
 */
export const PLATFORM_NAME = 'CUBE Nexum';

/**
 * Platform tier
 */
export const PLATFORM_TIER = 'Enterprise Enterprise';

/**
 * Supported locales
 */
export const SUPPORTED_LOCALES = [
  'en', 'es', 'pt', 'it', 'de', 'fr', 'tr', 'zh', 'ja', 'ko', 'ar', 'ru'
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_LIMIT = 50;

/**
 * Maximum pagination limit
 */
export const MAX_PAGE_LIMIT = 1000;

/**
 * Default timeout (ms)
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Maximum retries
 */
export const MAX_RETRIES = 3;

/**
 * Rate limit defaults
 */
export const RATE_LIMIT_DEFAULTS = {
  requests: 1000,
  window: 60,  // seconds
  burst: 100,
};
