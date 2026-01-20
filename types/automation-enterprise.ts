/**
 * Enterprise Automation Engine
 * CUBE Nexum Platform v2.0 - Enterprise Grade
 * 
 * Advanced automation orchestration with:
 * - Multi-workflow parallel execution
 * - Conditional branching with AI decisions
 * - Error recovery and retry strategies
 * - Real-time monitoring and analytics
 * - Enterprise audit logging
 * - Rate limiting and throttling
 * - Distributed execution support
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type WorkflowStatus = 
  | 'idle' 
  | 'queued' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'
  | 'waiting_approval';

export type TriggerType = 
  | 'manual' 
  | 'schedule' 
  | 'webhook' 
  | 'event' 
  | 'condition' 
  | 'api'
  | 'file_change'
  | 'email'
  | 'database'
  | 'cron';

export type ActionType =
  | 'navigate'
  | 'click'
  | 'type'
  | 'extract'
  | 'screenshot'
  | 'wait'
  | 'condition'
  | 'loop'
  | 'script'
  | 'api_call'
  | 'database_query'
  | 'file_operation'
  | 'email_send'
  | 'notification'
  | 'ai_decision'
  | 'human_approval'
  | 'subprocess'
  | 'browser'
  | 'data_transform'
  | 'db_query'
  | 'email'
  | 'file'
  | 'code'
  | 'integration';

export type RetryStrategy = 'none' | 'fixed' | 'exponential' | 'linear';

export interface RetryConfig {
  strategy: RetryStrategy;
  maxAttempts: number;
  initialDelay: number;  // ms
  maxDelay: number;      // ms
  backoffMultiplier: number;
  retryOn: string[];     // error codes to retry on
}

export interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  name?: string;
  config: Record<string, unknown>;
  enabled: boolean;
  lastTriggered?: string;
  nextScheduled?: string;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  enabled: boolean;
  timeout: number;         // ms
  retryConfig: RetryConfig;
  onSuccess?: string[];    // action IDs to execute on success
  onFailure?: string[];    // action IDs to execute on failure
  condition?: string;      // JavaScript expression for conditional execution
  variables?: Record<string, string>;  // input/output variable mappings
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: unknown;
  value?: unknown;
  required: boolean;
  sensitive: boolean;      // mask in logs
  description?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  variables: WorkflowVariable[];
  settings: WorkflowSettings;
  metadata: WorkflowMetadata;
  // Component compatibility fields
  status?: WorkflowStatus;
}

export interface WorkflowSettings {
  enabled?: boolean;
  timeout?: number;          // overall workflow timeout (ms)
  maxConcurrentActions?: number;
  rateLimitConfig?: RateLimitConfig;
  notifications?: NotificationConfig | ComponentNotificationConfig;
  logging?: LoggingConfig | ComponentLoggingConfig;
  security?: SecurityConfig | ComponentSecurityConfig;
  // Component compatibility fields
  maxRetries?: number;
  continueOnError?: boolean;
}

// Simplified configs for component use
export interface ComponentNotificationConfig {
  onSuccess?: boolean;
  onFailure?: boolean;
  channels?: string[];
}

export interface ComponentLoggingConfig {
  enabled?: boolean;
  level?: string;
  destination?: string;
}

export interface ComponentSecurityConfig {
  requireAuth?: boolean;
  allowedRoles?: string[];
  encryption?: boolean;
}

export interface NotificationConfig {
  onStart: boolean;
  onComplete: boolean;
  onFailure: boolean;
  onApprovalRequired: boolean;
  channels: ('email' | 'slack' | 'webhook' | 'sms')[];
  recipients: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeScreenshots: boolean;
  includeNetworkLogs: boolean;
  retentionDays: number;
  sensitiveFields: string[];  // fields to mask
}

export interface SecurityConfig {
  requireApproval: boolean;
  approvers: string[];
  allowedDomains: string[];
  blockedDomains: string[];
  maxDataSize: number;       // bytes
  encryptionEnabled: boolean;
}

export interface WorkflowMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastRunAt?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  averageRunTime: number;    // ms
  // Component compatibility fields
  tags?: string[];
  category?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
  triggerType: TriggerType;
  variables: Record<string, unknown>;
  actionResults: ActionResult[];
  error?: WorkflowError;
  metrics: ExecutionMetrics;
  // Component compatibility field
  executionId?: string;
}

export interface ActionResult {
  actionId: string;
  actionName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  attempts: number;
  output?: unknown;
  error?: string;
  screenshots?: string[];
  logs?: string[];
}

export interface WorkflowError {
  code: string;
  message: string;
  actionId?: string;
  stack?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface ExecutionMetrics {
  totalActions: number;
  completedActions: number;
  failedActions: number;
  skippedActions: number;
  totalDuration: number;
  networkRequests: number;
  dataExtracted: number;     // bytes
  screenshotsTaken: number;
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export interface WorkflowAnalytics {
  workflowId: string;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  executions: ExecutionSummary[];
  aggregates: AggregateMetrics;
  trends: TrendData[];
  anomalies: Anomaly[];
}

export interface ExecutionSummary {
  date: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  totalDataProcessed: number;
}

export interface AggregateMetrics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  totalDataProcessed: number;
  totalErrors: number;
  mostCommonErrors: ErrorFrequency[];
  actionPerformance: ActionPerformance[];
}

export interface ErrorFrequency {
  errorCode: string;
  message: string;
  count: number;
  percentage: number;
  lastOccurred: string;
}

export interface ActionPerformance {
  actionId: string;
  actionName: string;
  executionCount: number;
  successRate: number;
  averageDuration: number;
  errorRate: number;
}

export interface TrendData {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  significance: 'high' | 'medium' | 'low';
}

export interface Anomaly {
  timestamp: string;
  type: 'duration' | 'error_rate' | 'volume' | 'pattern';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  affectedExecutions: string[];
}

// ============================================================================
// TEMPLATES & PRESETS
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedSetupTime: number;  // minutes
  definition: Partial<WorkflowDefinition>;
  requiredIntegrations: string[];
  documentation: string;
  examples: TemplateExample[];
  popularity: number;
  rating: number;
  reviews: number;
}

export interface TemplateExample {
  name: string;
  description: string;
  useCase: string;
  configuration: Record<string, unknown>;
}

// ============================================================================
// ENTERPRISE INTEGRATIONS
// ============================================================================

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  lastSyncAt?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export type IntegrationType =
  | 'salesforce'
  | 'hubspot'
  | 'slack'
  | 'teams'
  | 'jira'
  | 'asana'
  | 'notion'
  | 'airtable'
  | 'google_sheets'
  | 'google_drive'
  | 'dropbox'
  | 'aws_s3'
  | 'azure_blob'
  | 'postgresql'
  | 'mysql'
  | 'mongodb'
  | 'redis'
  | 'elasticsearch'
  | 'zapier'
  | 'make'
  | 'n8n'
  | 'custom_api';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique workflow execution ID
 */
export function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate retry delay based on strategy
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  switch (config.strategy) {
    case 'fixed':
      return config.initialDelay;
    
    case 'linear':
      return Math.min(
        config.initialDelay * attempt,
        config.maxDelay
      );
    
    case 'exponential':
      return Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );
    
    default:
      return 0;
  }
}

/**
 * Check if error should trigger retry
 */
export function shouldRetry(
  error: WorkflowError,
  attempt: number,
  config: RetryConfig
): boolean {
  if (config.strategy === 'none') return false;
  if (attempt >= config.maxAttempts) return false;
  if (!error.recoverable) return false;
  if (config.retryOn.length > 0 && !config.retryOn.includes(error.code)) {
    return false;
  }
  return true;
}

/**
 * Check rate limit compliance
 */
export function checkRateLimit(
  config: RateLimitConfig,
  recentRequests: { timestamp: number }[]
): { allowed: boolean; waitTime: number } {
  if (!config.enabled) return { allowed: true, waitTime: 0 };

  const now = Date.now();
  const oneSecondAgo = now - 1000;
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;

  const requestsLastSecond = recentRequests.filter(r => r.timestamp > oneSecondAgo).length;
  const requestsLastMinute = recentRequests.filter(r => r.timestamp > oneMinuteAgo).length;
  const requestsLastHour = recentRequests.filter(r => r.timestamp > oneHourAgo).length;

  if (requestsLastSecond >= config.requestsPerSecond) {
    return { allowed: false, waitTime: 1000 };
  }
  if (requestsLastMinute >= config.requestsPerMinute) {
    return { allowed: false, waitTime: 60000 - (now - oneMinuteAgo) };
  }
  if (requestsLastHour >= config.requestsPerHour) {
    return { allowed: false, waitTime: 3600000 - (now - oneHourAgo) };
  }

  return { allowed: true, waitTime: 0 };
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(
  data: Record<string, unknown>,
  sensitiveFields: string[]
): Record<string, unknown> {
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      const value = masked[field];
      if (typeof value === 'string') {
        masked[field] = value.length > 4 
          ? `${'*'.repeat(value.length - 4)}${value.slice(-4)}`
          : '****';
      } else {
        masked[field] = '****';
      }
    }
  }
  
  return masked;
}

/**
 * Validate workflow definition
 */
export function validateWorkflowDefinition(
  definition: WorkflowDefinition
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!definition.id) errors.push('Workflow ID is required');
  if (!definition.name) errors.push('Workflow name is required');
  if (definition.actions.length === 0) errors.push('At least one action is required');
  
  // Check for circular dependencies
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  function hasCycle(actionId: string): boolean {
    if (visiting.has(actionId)) return true;
    if (visited.has(actionId)) return false;
    
    visiting.add(actionId);
    const action = definition.actions.find(a => a.id === actionId);
    
    if (action) {
      for (const nextId of [...(action.onSuccess || []), ...(action.onFailure || [])]) {
        if (hasCycle(nextId)) return true;
      }
    }
    
    visiting.delete(actionId);
    visited.add(actionId);
    return false;
  }
  
  for (const action of definition.actions) {
    if (hasCycle(action.id)) {
      errors.push(`Circular dependency detected in action: ${action.name}`);
      break;
    }
  }

  // Validate action references
  const actionIds = new Set(definition.actions.map(a => a.id));
  for (const action of definition.actions) {
    for (const refId of [...(action.onSuccess || []), ...(action.onFailure || [])]) {
      if (!actionIds.has(refId)) {
        errors.push(`Action "${action.name}" references non-existent action: ${refId}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get default retry config
 */
export function getDefaultRetryConfig(): RetryConfig {
  return {
    strategy: 'exponential',
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryOn: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED'],
  };
}

/**
 * Get default rate limit config
 */
export function getDefaultRateLimitConfig(): RateLimitConfig {
  return {
    enabled: true,
    requestsPerSecond: 10,
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    burstLimit: 20,
  };
}

/**
 * Get default workflow settings
 */
export function getDefaultWorkflowSettings(): WorkflowSettings {
  return {
    enabled: true,
    timeout: 3600000,  // 1 hour
    maxConcurrentActions: 5,
    rateLimitConfig: getDefaultRateLimitConfig(),
    notifications: {
      onStart: false,
      onComplete: true,
      onFailure: true,
      onApprovalRequired: true,
      channels: ['email'],
      recipients: [],
    },
    logging: {
      level: 'info',
      includeScreenshots: true,
      includeNetworkLogs: false,
      retentionDays: 30,
      sensitiveFields: ['password', 'apiKey', 'token', 'secret'],
    },
    security: {
      requireApproval: false,
      approvers: [],
      allowedDomains: [],
      blockedDomains: [],
      maxDataSize: 104857600,  // 100MB
      encryptionEnabled: true,
    },
  };
}

// ============================================================================
// PREDEFINED TEMPLATES
// ============================================================================

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl_web_scraping',
    name: 'Web Scraping Pipeline',
    description: 'Extract structured data from websites with pagination support',
    category: 'Data Extraction',
    tags: ['scraping', 'data', 'extraction', 'pagination'],
    difficulty: 'intermediate',
    estimatedSetupTime: 15,
    definition: {
      name: 'Web Scraping Pipeline',
      description: 'Automated web data extraction',
      category: 'Data Extraction',
    },
    requiredIntegrations: [],
    documentation: 'https://docs.cube.nexum/templates/web-scraping',
    examples: [
      {
        name: 'E-commerce Product Scraping',
        description: 'Extract product data from online stores',
        useCase: 'Price monitoring, competitive analysis',
        configuration: { paginationEnabled: true, maxPages: 100 },
      },
    ],
    popularity: 9500,
    rating: 4.8,
    reviews: 342,
  },
  {
    id: 'tpl_form_automation',
    name: 'Form Automation',
    description: 'Automate repetitive form filling with data validation',
    category: 'Process Automation',
    tags: ['forms', 'automation', 'data-entry'],
    difficulty: 'beginner',
    estimatedSetupTime: 10,
    definition: {
      name: 'Form Automation',
      description: 'Automated form submission',
      category: 'Process Automation',
    },
    requiredIntegrations: [],
    documentation: 'https://docs.cube.nexum/templates/form-automation',
    examples: [],
    popularity: 8200,
    rating: 4.7,
    reviews: 256,
  },
  {
    id: 'tpl_api_orchestration',
    name: 'API Orchestration',
    description: 'Chain multiple API calls with data transformation',
    category: 'Integration',
    tags: ['api', 'integration', 'orchestration'],
    difficulty: 'advanced',
    estimatedSetupTime: 30,
    definition: {
      name: 'API Orchestration',
      description: 'Multi-API workflow orchestration',
      category: 'Integration',
    },
    requiredIntegrations: ['custom_api'],
    documentation: 'https://docs.cube.nexum/templates/api-orchestration',
    examples: [],
    popularity: 6800,
    rating: 4.9,
    reviews: 189,
  },
  {
    id: 'tpl_report_generation',
    name: 'Automated Report Generation',
    description: 'Generate reports from multiple data sources',
    category: 'Reporting',
    tags: ['reports', 'analytics', 'export'],
    difficulty: 'intermediate',
    estimatedSetupTime: 20,
    definition: {
      name: 'Report Generation',
      description: 'Automated report creation and distribution',
      category: 'Reporting',
    },
    requiredIntegrations: ['google_sheets'],
    documentation: 'https://docs.cube.nexum/templates/report-generation',
    examples: [],
    popularity: 7500,
    rating: 4.6,
    reviews: 201,
  },
  {
    id: 'tpl_monitoring_alerts',
    name: 'Website Monitoring & Alerts',
    description: 'Monitor websites for changes and send notifications',
    category: 'Monitoring',
    tags: ['monitoring', 'alerts', 'notifications'],
    difficulty: 'beginner',
    estimatedSetupTime: 10,
    definition: {
      name: 'Website Monitoring',
      description: 'Real-time website change detection',
      category: 'Monitoring',
    },
    requiredIntegrations: ['slack'],
    documentation: 'https://docs.cube.nexum/templates/monitoring-alerts',
    examples: [],
    popularity: 8900,
    rating: 4.8,
    reviews: 412,
  },
];
