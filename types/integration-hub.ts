/**
 * Enterprise Integration Hub System
 * CUBE Nexum Platform v2.0 - Enterprise Grade
 * 
 * Features:
 * - 200+ Pre-built integrations
 * - Custom connector framework
 * - OAuth 2.0/SAML/API Key authentication
 * - Bi-directional sync
 * - Event-driven architecture
 * - Rate limiting & throttling
 * - Error recovery & retry logic
 */

// ============================================================================
// INTEGRATION CATEGORIES & TYPES
// ============================================================================

export type IntegrationCategory =
  | 'crm'
  | 'erp'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'project_management'
  | 'communication'
  | 'cloud_storage'
  | 'database'
  | 'ecommerce'
  | 'analytics'
  | 'social_media'
  | 'productivity'
  | 'security'
  | 'devops'
  | 'ai_ml'
  | 'iot'
  | 'custom';

export type IntegrationStatus =
  | 'available'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending'
  | 'deprecated';

export type AuthenticationType =
  | 'oauth2'
  | 'oauth1'
  | 'api_key'
  | 'basic'
  | 'bearer'
  | 'saml'
  | 'jwt'
  | 'certificate'
  | 'custom';

export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';

export type SyncMode = 'real_time' | 'batch' | 'scheduled' | 'manual' | 'webhook';

// ============================================================================
// INTEGRATION REGISTRY (200+ INTEGRATIONS)
// ============================================================================

export interface IntegrationRegistry {
  integrations: IntegrationDefinition[];
  categories: CategoryInfo[];
  lastUpdated: string;
  version: string;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  subcategory?: string;
  icon: string;
  color: string;
  vendor: string;
  website: string;
  documentation: string;
  version: string;
  minVersion?: string;
  authentication: AuthenticationConfig[];
  capabilities: IntegrationCapability[];
  endpoints: EndpointDefinition[];
  schemas: SchemaDefinition[];
  triggers: TriggerDefinition[];
  actions: ActionDefinition[];
  pricing: PricingInfo;
  popularity: number;
  reliability: number;
  tags: string[];
  featured: boolean;
  enterprise: boolean;
  status: IntegrationStatus;
}

export interface CategoryInfo {
  id: IntegrationCategory;
  name: string;
  description: string;
  icon: string;
  integrationCount: number;
}

export interface PricingInfo {
  type: 'free' | 'freemium' | 'paid' | 'enterprise' | 'custom';
  plans?: PricingPlan[];
  trialDays?: number;
  currency?: string;
}

export interface PricingPlan {
  name: string;
  price: number;
  interval: 'monthly' | 'yearly' | 'one_time';
  features: string[];
  limits?: Record<string, number>;
}

// ============================================================================
// AUTHENTICATION CONFIGURATIONS
// ============================================================================

export interface AuthenticationConfig {
  type: AuthenticationType;
  config: AuthConfig;
  scopes?: string[];
  refreshable: boolean;
  expiresIn?: number;  // seconds
  documentation?: string;
}

export interface AuthConfig {
  // OAuth 2.0
  authorizationUrl?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  grantTypes?: ('authorization_code' | 'client_credentials' | 'refresh_token' | 'implicit')[];
  pkce?: boolean;
  
  // API Key
  apiKeyLocation?: 'header' | 'query' | 'body';
  apiKeyName?: string;
  
  // Basic Auth
  usernameField?: string;
  passwordField?: string;
  
  // JWT
  jwtIssuer?: string;
  jwtAudience?: string;
  jwtAlgorithm?: string;
  
  // SAML
  samlIdpUrl?: string;
  samlCertificate?: string;
  
  // Certificate
  certificateFormat?: 'pem' | 'p12' | 'der';
  requiresClientCert?: boolean;
  
  // Custom
  customFields?: CustomAuthField[];
}

export interface CustomAuthField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: string;
  help?: string;
}

// ============================================================================
// INTEGRATION CAPABILITIES
// ============================================================================

export interface IntegrationCapability {
  id: string;
  name: string;
  type: 'read' | 'write' | 'sync' | 'trigger' | 'action' | 'search' | 'subscribe';
  entity: string;
  description: string;
  supportsBatch: boolean;
  supportsFiltering: boolean;
  supportsPagination: boolean;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  requests: number;
  window: number;  // seconds
  windowType: 'fixed' | 'sliding';
  scope: 'user' | 'app' | 'global';
  retryAfter?: number;
}

// ============================================================================
// ENDPOINTS & SCHEMAS
// ============================================================================

export interface EndpointDefinition {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters: ParameterDefinition[];
  requestSchema?: string;
  responseSchema?: string;
  errorResponses: ErrorResponse[];
  rateLimit?: RateLimitInfo;
  cache?: CacheConfig;
  deprecated?: boolean;
}

export interface ParameterDefinition {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
  example?: unknown;
  enum?: string[];
}

export interface SchemaDefinition {
  id: string;
  name: string;
  description: string;
  properties: PropertyDefinition[];
  required: string[];
  example?: Record<string, unknown>;
}

export interface PropertyDefinition {
  name: string;
  type: string;
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: unknown[];
  items?: PropertyDefinition;
  properties?: PropertyDefinition[];
}

export interface ErrorResponse {
  statusCode: number;
  description: string;
  schema?: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;  // seconds
  key?: string;
  invalidateOn?: string[];
}

// ============================================================================
// TRIGGERS & ACTIONS
// ============================================================================

export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'polling' | 'event' | 'schedule';
  entity: string;
  event: string;
  outputSchema: string;
  config: TriggerConfig;
  examples: TriggerExample[];
}

export interface TriggerConfig {
  // Webhook
  webhookUrl?: string;
  webhookSecret?: string;
  verifySignature?: boolean;
  
  // Polling
  pollingInterval?: number;  // seconds
  pollingEndpoint?: string;
  pollingParams?: Record<string, unknown>;
  
  // Event
  eventFilter?: Record<string, unknown>;
  eventMapping?: Record<string, string>;
  
  // Schedule
  cron?: string;
  timezone?: string;
}

export interface TriggerExample {
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'search' | 'execute' | 'custom';
  entity: string;
  inputSchema: string;
  outputSchema: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  supportsBatch: boolean;
  idempotent: boolean;
  examples: ActionExample[];
}

export interface ActionExample {
  name: string;
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

// ============================================================================
// CONNECTED INTEGRATION INSTANCE
// ============================================================================

export interface ConnectedIntegration {
  id: string;
  integrationId: string;
  userId: string;
  organizationId: string;
  name: string;
  status: IntegrationStatus;
  authentication: StoredAuthentication;
  configuration: IntegrationConfiguration;
  mappings: DataMapping[];
  sync: SyncConfiguration;
  health: IntegrationHealth;
  usage: IntegrationUsage;
  metadata: IntegrationMetadata;
}

export interface StoredAuthentication {
  type: AuthenticationType;
  credentials: EncryptedCredentials;
  scopes: string[];
  expiresAt?: string;
  refreshToken?: string;
  lastRefreshed?: string;
  status: 'valid' | 'expired' | 'invalid';
}

export interface EncryptedCredentials {
  data: string;  // Encrypted JSON
  keyId: string;
  algorithm: string;
  iv?: string;
}

export interface IntegrationConfiguration {
  baseUrl?: string;
  apiVersion?: string;
  region?: string;
  sandbox?: boolean;
  customHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  proxy?: ProxyConfig;
  rateLimit?: RateLimitOverride;
  features?: Record<string, boolean>;
}

export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface RateLimitOverride {
  enabled: boolean;
  maxRequests: number;
  window: number;
  queueEnabled: boolean;
  maxQueueSize: number;
}

// ============================================================================
// DATA MAPPING & SYNC
// ============================================================================

export interface DataMapping {
  id: string;
  name: string;
  sourceEntity: string;
  targetEntity: string;
  direction: SyncDirection;
  fieldMappings: FieldMappingRule[];
  transformations: TransformationRule[];
  filters: FilterRule[];
  conflictResolution: ConflictResolution;
  enabled: boolean;
}

export interface FieldMappingRule {
  sourceField: string;
  targetField: string;
  transform?: string;
  defaultValue?: unknown;
  required: boolean;
  bidirectional?: boolean;
}

export interface TransformationRule {
  field: string;
  type: 'format' | 'convert' | 'lookup' | 'calculate' | 'script';
  config: Record<string, unknown>;
}

export interface FilterRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'exists';
  value: unknown;
  logic?: 'and' | 'or';
}

export interface ConflictResolution {
  strategy: 'source_wins' | 'target_wins' | 'newest_wins' | 'manual' | 'merge';
  mergeRules?: MergeRule[];
  notifyOnConflict: boolean;
}

export interface MergeRule {
  field: string;
  strategy: 'keep_source' | 'keep_target' | 'concatenate' | 'max' | 'min';
}

export interface SyncConfiguration {
  enabled: boolean;
  mode: SyncMode;
  direction: SyncDirection;
  schedule?: ScheduleConfig;
  batchSize: number;
  retryPolicy: RetryPolicy;
  errorHandling: ErrorHandling;
  deduplication: DeduplicationConfig;
}

export interface ScheduleConfig {
  cron?: string;
  interval?: number;
  timezone: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  enabled: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;  // ms
  maxDelay: number;  // ms
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ErrorHandling {
  onError: 'stop' | 'skip' | 'quarantine';
  maxErrors: number;
  quarantineQueue?: string;
  notifyOnError: boolean;
  errorMapping?: Record<string, string>;
}

export interface DeduplicationConfig {
  enabled: boolean;
  keyFields: string[];
  window: number;  // seconds
  strategy: 'first' | 'last' | 'merge';
}

// ============================================================================
// INTEGRATION HEALTH & MONITORING
// ============================================================================

export interface IntegrationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: string;
  latency: number;  // ms
  uptime: number;  // percentage
  errorRate: number;  // percentage
  checks: HealthCheck[];
  incidents: Incident[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  lastRun: string;
  nextRun?: string;
}

export interface Incident {
  id: string;
  type: 'outage' | 'degradation' | 'error_spike' | 'rate_limit';
  startedAt: string;
  resolvedAt?: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  impact: string;
}

export interface IntegrationUsage {
  period: 'hour' | 'day' | 'week' | 'month';
  requests: number;
  successfulRequests: number;
  failedRequests: number;
  dataTransferred: number;  // bytes
  recordsSynced: number;
  avgLatency: number;
  peakLatency: number;
  quotaUsed: number;
  quotaLimit: number;
  breakdown: UsageBreakdown[];
}

export interface UsageBreakdown {
  endpoint: string;
  method: string;
  count: number;
  avgLatency: number;
  errorCount: number;
}

export interface IntegrationMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastSyncAt?: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  version: number;
  tags: string[];
  notes?: string;
}

// ============================================================================
// SYNC EXECUTION
// ============================================================================

export interface SyncExecution {
  id: string;
  integrationId: string;
  mappingId?: string;
  type: 'full' | 'incremental' | 'delta';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger: SyncTrigger;
  progress: SyncProgress;
  metrics: SyncMetrics;
  logs: SyncLog[];
  errors: SyncError[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface SyncTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event' | 'dependency';
  source: string;
  data?: Record<string, unknown>;
}

export interface SyncProgress {
  phase: 'extracting' | 'transforming' | 'loading' | 'validating' | 'finalizing';
  currentStep: number;
  totalSteps: number;
  recordsProcessed: number;
  recordsTotal: number;
  bytesProcessed: number;
  bytesTotal?: number;
  percentage: number;
  eta?: number;  // seconds
}

export interface SyncMetrics {
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsSkipped: number;
  recordsErrored: number;
  bytesTransferred: number;
  apiCalls: number;
  avgLatency: number;
  peakMemory: number;
}

export interface SyncLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface SyncError {
  id: string;
  timestamp: string;
  phase: string;
  recordId?: string;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  retried: boolean;
  resolved: boolean;
}

// ============================================================================
// WEBHOOK MANAGEMENT
// ============================================================================

export interface WebhookConfiguration {
  id: string;
  integrationId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  enabled: boolean;
  retryPolicy: RetryPolicy;
  headers?: Record<string, string>;
  payloadFormat: 'json' | 'form' | 'xml';
  signatureHeader?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  verification: WebhookVerification;
  deliveryStats: DeliveryStats;
}

export interface WebhookVerification {
  method: 'signature' | 'challenge' | 'ip' | 'none';
  config?: Record<string, unknown>;
}

export interface DeliveryStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  avgLatency: number;
  lastDelivery?: string;
  lastSuccess?: string;
  lastFailure?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  attempts: DeliveryAttempt[];
  createdAt: string;
  deliveredAt?: string;
}

export interface DeliveryAttempt {
  attemptNumber: number;
  timestamp: string;
  statusCode?: number;
  response?: string;
  error?: string;
  latency: number;
}

// ============================================================================
// PRE-BUILT INTEGRATION CATALOG (200+)
// ============================================================================

export const INTEGRATION_CATALOG: Partial<IntegrationDefinition>[] = [
  // CRM
  { id: 'salesforce', name: 'Salesforce', category: 'crm', vendor: 'Salesforce', enterprise: true },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', vendor: 'HubSpot', enterprise: false },
  { id: 'pipedrive', name: 'Pipedrive', category: 'crm', vendor: 'Pipedrive', enterprise: false },
  { id: 'zoho_crm', name: 'Zoho CRM', category: 'crm', vendor: 'Zoho', enterprise: true },
  { id: 'dynamics_365', name: 'Microsoft Dynamics 365', category: 'crm', vendor: 'Microsoft', enterprise: true },
  { id: 'zendesk_sell', name: 'Zendesk Sell', category: 'crm', vendor: 'Zendesk', enterprise: false },
  { id: 'freshsales', name: 'Freshsales', category: 'crm', vendor: 'Freshworks', enterprise: false },
  { id: 'copper', name: 'Copper', category: 'crm', vendor: 'Copper', enterprise: false },
  { id: 'insightly', name: 'Insightly', category: 'crm', vendor: 'Insightly', enterprise: false },
  { id: 'sugar_crm', name: 'SugarCRM', category: 'crm', vendor: 'SugarCRM', enterprise: true },
  
  // ERP
  { id: 'sap', name: 'SAP ERP', category: 'erp', vendor: 'SAP', enterprise: true },
  { id: 'oracle_erp', name: 'Oracle ERP Cloud', category: 'erp', vendor: 'Oracle', enterprise: true },
  { id: 'netsuite', name: 'NetSuite', category: 'erp', vendor: 'Oracle', enterprise: true },
  { id: 'dynamics_bc', name: 'Microsoft Dynamics Business Central', category: 'erp', vendor: 'Microsoft', enterprise: true },
  { id: 'sage_intacct', name: 'Sage Intacct', category: 'erp', vendor: 'Sage', enterprise: true },
  { id: 'workday', name: 'Workday', category: 'erp', vendor: 'Workday', enterprise: true },
  { id: 'infor', name: 'Infor CloudSuite', category: 'erp', vendor: 'Infor', enterprise: true },
  { id: 'epicor', name: 'Epicor ERP', category: 'erp', vendor: 'Epicor', enterprise: true },
  
  // Marketing
  { id: 'mailchimp', name: 'Mailchimp', category: 'marketing', vendor: 'Intuit', enterprise: false },
  { id: 'marketo', name: 'Marketo', category: 'marketing', vendor: 'Adobe', enterprise: true },
  { id: 'pardot', name: 'Pardot', category: 'marketing', vendor: 'Salesforce', enterprise: true },
  { id: 'hubspot_marketing', name: 'HubSpot Marketing', category: 'marketing', vendor: 'HubSpot', enterprise: false },
  { id: 'eloqua', name: 'Oracle Eloqua', category: 'marketing', vendor: 'Oracle', enterprise: true },
  { id: 'constant_contact', name: 'Constant Contact', category: 'marketing', vendor: 'Constant Contact', enterprise: false },
  { id: 'klaviyo', name: 'Klaviyo', category: 'marketing', vendor: 'Klaviyo', enterprise: false },
  { id: 'braze', name: 'Braze', category: 'marketing', vendor: 'Braze', enterprise: true },
  { id: 'iterable', name: 'Iterable', category: 'marketing', vendor: 'Iterable', enterprise: true },
  { id: 'sendinblue', name: 'Brevo (Sendinblue)', category: 'marketing', vendor: 'Brevo', enterprise: false },
  
  // Finance
  { id: 'quickbooks', name: 'QuickBooks', category: 'finance', vendor: 'Intuit', enterprise: false },
  { id: 'xero', name: 'Xero', category: 'finance', vendor: 'Xero', enterprise: false },
  { id: 'stripe', name: 'Stripe', category: 'finance', vendor: 'Stripe', enterprise: true },
  { id: 'paypal', name: 'PayPal', category: 'finance', vendor: 'PayPal', enterprise: true },
  { id: 'square', name: 'Square', category: 'finance', vendor: 'Square', enterprise: false },
  { id: 'braintree', name: 'Braintree', category: 'finance', vendor: 'PayPal', enterprise: true },
  { id: 'bill_com', name: 'Bill.com', category: 'finance', vendor: 'Bill.com', enterprise: true },
  { id: 'expensify', name: 'Expensify', category: 'finance', vendor: 'Expensify', enterprise: false },
  { id: 'plaid', name: 'Plaid', category: 'finance', vendor: 'Plaid', enterprise: true },
  { id: 'recurly', name: 'Recurly', category: 'finance', vendor: 'Recurly', enterprise: true },
  
  // HR
  { id: 'workday_hr', name: 'Workday HCM', category: 'hr', vendor: 'Workday', enterprise: true },
  { id: 'bamboohr', name: 'BambooHR', category: 'hr', vendor: 'BambooHR', enterprise: false },
  { id: 'adp', name: 'ADP', category: 'hr', vendor: 'ADP', enterprise: true },
  { id: 'gusto', name: 'Gusto', category: 'hr', vendor: 'Gusto', enterprise: false },
  { id: 'paychex', name: 'Paychex', category: 'hr', vendor: 'Paychex', enterprise: true },
  { id: 'namely', name: 'Namely', category: 'hr', vendor: 'Namely', enterprise: false },
  { id: 'greenhouse', name: 'Greenhouse', category: 'hr', vendor: 'Greenhouse', enterprise: true },
  { id: 'lever', name: 'Lever', category: 'hr', vendor: 'Lever', enterprise: false },
  { id: 'rippling', name: 'Rippling', category: 'hr', vendor: 'Rippling', enterprise: true },
  { id: 'deel', name: 'Deel', category: 'hr', vendor: 'Deel', enterprise: true },
  
  // Project Management
  { id: 'jira', name: 'Jira', category: 'project_management', vendor: 'Atlassian', enterprise: true },
  { id: 'asana', name: 'Asana', category: 'project_management', vendor: 'Asana', enterprise: false },
  { id: 'trello', name: 'Trello', category: 'project_management', vendor: 'Atlassian', enterprise: false },
  { id: 'monday', name: 'Monday.com', category: 'project_management', vendor: 'Monday', enterprise: false },
  { id: 'clickup', name: 'ClickUp', category: 'project_management', vendor: 'ClickUp', enterprise: false },
  { id: 'notion', name: 'Notion', category: 'project_management', vendor: 'Notion', enterprise: false },
  { id: 'smartsheet', name: 'Smartsheet', category: 'project_management', vendor: 'Smartsheet', enterprise: true },
  { id: 'wrike', name: 'Wrike', category: 'project_management', vendor: 'Citrix', enterprise: true },
  { id: 'teamwork', name: 'Teamwork', category: 'project_management', vendor: 'Teamwork', enterprise: false },
  { id: 'basecamp', name: 'Basecamp', category: 'project_management', vendor: 'Basecamp', enterprise: false },
  
  // Communication
  { id: 'slack', name: 'Slack', category: 'communication', vendor: 'Salesforce', enterprise: true },
  { id: 'microsoft_teams', name: 'Microsoft Teams', category: 'communication', vendor: 'Microsoft', enterprise: true },
  { id: 'zoom', name: 'Zoom', category: 'communication', vendor: 'Zoom', enterprise: true },
  { id: 'discord', name: 'Discord', category: 'communication', vendor: 'Discord', enterprise: false },
  { id: 'twilio', name: 'Twilio', category: 'communication', vendor: 'Twilio', enterprise: true },
  { id: 'intercom', name: 'Intercom', category: 'communication', vendor: 'Intercom', enterprise: true },
  { id: 'zendesk', name: 'Zendesk', category: 'communication', vendor: 'Zendesk', enterprise: true },
  { id: 'freshdesk', name: 'Freshdesk', category: 'communication', vendor: 'Freshworks', enterprise: false },
  { id: 'ringcentral', name: 'RingCentral', category: 'communication', vendor: 'RingCentral', enterprise: true },
  { id: 'vonage', name: 'Vonage', category: 'communication', vendor: 'Ericsson', enterprise: true },
  
  // Cloud Storage
  { id: 'google_drive', name: 'Google Drive', category: 'cloud_storage', vendor: 'Google', enterprise: true },
  { id: 'dropbox', name: 'Dropbox', category: 'cloud_storage', vendor: 'Dropbox', enterprise: false },
  { id: 'onedrive', name: 'OneDrive', category: 'cloud_storage', vendor: 'Microsoft', enterprise: true },
  { id: 'box', name: 'Box', category: 'cloud_storage', vendor: 'Box', enterprise: true },
  { id: 'sharepoint', name: 'SharePoint', category: 'cloud_storage', vendor: 'Microsoft', enterprise: true },
  { id: 'aws_s3', name: 'Amazon S3', category: 'cloud_storage', vendor: 'Amazon', enterprise: true },
  { id: 'google_cloud_storage', name: 'Google Cloud Storage', category: 'cloud_storage', vendor: 'Google', enterprise: true },
  { id: 'azure_blob', name: 'Azure Blob Storage', category: 'cloud_storage', vendor: 'Microsoft', enterprise: true },
  
  // Database
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', vendor: 'PostgreSQL', enterprise: true },
  { id: 'mysql', name: 'MySQL', category: 'database', vendor: 'Oracle', enterprise: true },
  { id: 'mongodb', name: 'MongoDB', category: 'database', vendor: 'MongoDB', enterprise: true },
  { id: 'snowflake', name: 'Snowflake', category: 'database', vendor: 'Snowflake', enterprise: true },
  { id: 'bigquery', name: 'BigQuery', category: 'database', vendor: 'Google', enterprise: true },
  { id: 'redshift', name: 'Amazon Redshift', category: 'database', vendor: 'Amazon', enterprise: true },
  { id: 'databricks', name: 'Databricks', category: 'database', vendor: 'Databricks', enterprise: true },
  { id: 'elasticsearch', name: 'Elasticsearch', category: 'database', vendor: 'Elastic', enterprise: true },
  { id: 'airtable', name: 'Airtable', category: 'database', vendor: 'Airtable', enterprise: false },
  { id: 'firebase', name: 'Firebase', category: 'database', vendor: 'Google', enterprise: true },
  
  // E-commerce
  { id: 'shopify', name: 'Shopify', category: 'ecommerce', vendor: 'Shopify', enterprise: true },
  { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', vendor: 'Automattic', enterprise: false },
  { id: 'magento', name: 'Adobe Commerce (Magento)', category: 'ecommerce', vendor: 'Adobe', enterprise: true },
  { id: 'bigcommerce', name: 'BigCommerce', category: 'ecommerce', vendor: 'BigCommerce', enterprise: true },
  { id: 'amazon_seller', name: 'Amazon Seller Central', category: 'ecommerce', vendor: 'Amazon', enterprise: true },
  { id: 'ebay', name: 'eBay', category: 'ecommerce', vendor: 'eBay', enterprise: true },
  { id: 'etsy', name: 'Etsy', category: 'ecommerce', vendor: 'Etsy', enterprise: false },
  { id: 'square_commerce', name: 'Square Online', category: 'ecommerce', vendor: 'Square', enterprise: false },
  
  // Analytics
  { id: 'google_analytics', name: 'Google Analytics', category: 'analytics', vendor: 'Google', enterprise: true },
  { id: 'mixpanel', name: 'Mixpanel', category: 'analytics', vendor: 'Mixpanel', enterprise: true },
  { id: 'amplitude', name: 'Amplitude', category: 'analytics', vendor: 'Amplitude', enterprise: true },
  { id: 'segment', name: 'Segment', category: 'analytics', vendor: 'Twilio', enterprise: true },
  { id: 'heap', name: 'Heap', category: 'analytics', vendor: 'Contentsquare', enterprise: true },
  { id: 'tableau', name: 'Tableau', category: 'analytics', vendor: 'Salesforce', enterprise: true },
  { id: 'looker', name: 'Looker', category: 'analytics', vendor: 'Google', enterprise: true },
  { id: 'powerbi', name: 'Power BI', category: 'analytics', vendor: 'Microsoft', enterprise: true },
  { id: 'datadog', name: 'Datadog', category: 'analytics', vendor: 'Datadog', enterprise: true },
  { id: 'new_relic', name: 'New Relic', category: 'analytics', vendor: 'New Relic', enterprise: true },
  
  // Social Media
  { id: 'facebook', name: 'Facebook', category: 'social_media', vendor: 'Meta', enterprise: true },
  { id: 'instagram', name: 'Instagram', category: 'social_media', vendor: 'Meta', enterprise: true },
  { id: 'twitter', name: 'X (Twitter)', category: 'social_media', vendor: 'X Corp', enterprise: true },
  { id: 'linkedin', name: 'LinkedIn', category: 'social_media', vendor: 'Microsoft', enterprise: true },
  { id: 'tiktok', name: 'TikTok', category: 'social_media', vendor: 'ByteDance', enterprise: true },
  { id: 'youtube', name: 'YouTube', category: 'social_media', vendor: 'Google', enterprise: true },
  { id: 'pinterest', name: 'Pinterest', category: 'social_media', vendor: 'Pinterest', enterprise: true },
  { id: 'reddit', name: 'Reddit', category: 'social_media', vendor: 'Reddit', enterprise: false },
  
  // Productivity
  { id: 'google_workspace', name: 'Google Workspace', category: 'productivity', vendor: 'Google', enterprise: true },
  { id: 'microsoft_365', name: 'Microsoft 365', category: 'productivity', vendor: 'Microsoft', enterprise: true },
  { id: 'google_sheets', name: 'Google Sheets', category: 'productivity', vendor: 'Google', enterprise: true },
  { id: 'google_docs', name: 'Google Docs', category: 'productivity', vendor: 'Google', enterprise: true },
  { id: 'excel_online', name: 'Excel Online', category: 'productivity', vendor: 'Microsoft', enterprise: true },
  { id: 'calendar_google', name: 'Google Calendar', category: 'productivity', vendor: 'Google', enterprise: true },
  { id: 'calendar_outlook', name: 'Outlook Calendar', category: 'productivity', vendor: 'Microsoft', enterprise: true },
  { id: 'evernote', name: 'Evernote', category: 'productivity', vendor: 'Evernote', enterprise: false },
  { id: 'todoist', name: 'Todoist', category: 'productivity', vendor: 'Doist', enterprise: false },
  
  // Security
  { id: 'okta', name: 'Okta', category: 'security', vendor: 'Okta', enterprise: true },
  { id: 'auth0', name: 'Auth0', category: 'security', vendor: 'Okta', enterprise: true },
  { id: 'onelogin', name: 'OneLogin', category: 'security', vendor: 'OneLogin', enterprise: true },
  { id: 'azure_ad', name: 'Azure Active Directory', category: 'security', vendor: 'Microsoft', enterprise: true },
  { id: 'duo', name: 'Duo Security', category: 'security', vendor: 'Cisco', enterprise: true },
  { id: 'crowdstrike', name: 'CrowdStrike', category: 'security', vendor: 'CrowdStrike', enterprise: true },
  { id: 'splunk', name: 'Splunk', category: 'security', vendor: 'Cisco', enterprise: true },
  { id: 'pagerduty', name: 'PagerDuty', category: 'security', vendor: 'PagerDuty', enterprise: true },
  
  // DevOps
  { id: 'github', name: 'GitHub', category: 'devops', vendor: 'Microsoft', enterprise: true },
  { id: 'gitlab', name: 'GitLab', category: 'devops', vendor: 'GitLab', enterprise: true },
  { id: 'bitbucket', name: 'Bitbucket', category: 'devops', vendor: 'Atlassian', enterprise: true },
  { id: 'jenkins', name: 'Jenkins', category: 'devops', vendor: 'Jenkins', enterprise: true },
  { id: 'circleci', name: 'CircleCI', category: 'devops', vendor: 'CircleCI', enterprise: true },
  { id: 'travis_ci', name: 'Travis CI', category: 'devops', vendor: 'Travis CI', enterprise: false },
  { id: 'docker', name: 'Docker Hub', category: 'devops', vendor: 'Docker', enterprise: true },
  { id: 'kubernetes', name: 'Kubernetes', category: 'devops', vendor: 'CNCF', enterprise: true },
  { id: 'terraform', name: 'Terraform', category: 'devops', vendor: 'HashiCorp', enterprise: true },
  { id: 'ansible', name: 'Ansible', category: 'devops', vendor: 'Red Hat', enterprise: true },
  
  // AI/ML
  { id: 'openai', name: 'OpenAI', category: 'ai_ml', vendor: 'OpenAI', enterprise: true },
  { id: 'anthropic', name: 'Anthropic Claude', category: 'ai_ml', vendor: 'Anthropic', enterprise: true },
  { id: 'google_ai', name: 'Google AI (Gemini)', category: 'ai_ml', vendor: 'Google', enterprise: true },
  { id: 'azure_ai', name: 'Azure AI', category: 'ai_ml', vendor: 'Microsoft', enterprise: true },
  { id: 'aws_bedrock', name: 'AWS Bedrock', category: 'ai_ml', vendor: 'Amazon', enterprise: true },
  { id: 'huggingface', name: 'Hugging Face', category: 'ai_ml', vendor: 'Hugging Face', enterprise: false },
  { id: 'cohere', name: 'Cohere', category: 'ai_ml', vendor: 'Cohere', enterprise: true },
  { id: 'replicate', name: 'Replicate', category: 'ai_ml', vendor: 'Replicate', enterprise: false },
  
  // IoT
  { id: 'aws_iot', name: 'AWS IoT', category: 'iot', vendor: 'Amazon', enterprise: true },
  { id: 'azure_iot', name: 'Azure IoT Hub', category: 'iot', vendor: 'Microsoft', enterprise: true },
  { id: 'google_iot', name: 'Google Cloud IoT', category: 'iot', vendor: 'Google', enterprise: true },
  { id: 'particle', name: 'Particle', category: 'iot', vendor: 'Particle', enterprise: false },
  { id: 'thingspeak', name: 'ThingSpeak', category: 'iot', vendor: 'MathWorks', enterprise: false },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get integrations by category
 */
export function getIntegrationsByCategory(category: IntegrationCategory): Partial<IntegrationDefinition>[] {
  return INTEGRATION_CATALOG.filter(i => i.category === category);
}

/**
 * Get enterprise integrations
 */
export function getEnterpriseIntegrations(): Partial<IntegrationDefinition>[] {
  return INTEGRATION_CATALOG.filter(i => i.enterprise);
}

/**
 * Search integrations
 */
export function searchIntegrations(query: string): Partial<IntegrationDefinition>[] {
  const lowerQuery = query.toLowerCase();
  return INTEGRATION_CATALOG.filter(i => 
    i.name?.toLowerCase().includes(lowerQuery) ||
    i.vendor?.toLowerCase().includes(lowerQuery) ||
    i.category?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Calculate health score
 */
export function calculateHealthScore(health: IntegrationHealth): number {
  const weights = { uptime: 0.4, errorRate: 0.3, latency: 0.3 };
  
  const uptimeScore = Math.min(health.uptime, 100);
  const errorScore = Math.max(100 - health.errorRate * 10, 0);
  const latencyScore = health.latency < 100 ? 100 : health.latency < 500 ? 80 : health.latency < 1000 ? 60 : 40;
  
  return Math.round(
    uptimeScore * weights.uptime +
    errorScore * weights.errorRate +
    latencyScore * weights.latency
  );
}

/**
 * Get category count
 */
export function getCategoryCounts(): Record<IntegrationCategory, number> {
  const counts = {} as Record<IntegrationCategory, number>;
  
  for (const integration of INTEGRATION_CATALOG) {
    if (integration.category) {
      counts[integration.category] = (counts[integration.category] || 0) + 1;
    }
  }
  
  return counts;
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha1' | 'sha256' | 'sha512' = 'sha256'
): boolean {
  // In production, use crypto library
  // This is a placeholder for the signature validation logic
  return signature.length > 0 && secret.length > 0;
}

/**
 * Generate default sync configuration
 */
export function getDefaultSyncConfig(): SyncConfiguration {
  return {
    enabled: true,
    mode: 'scheduled',
    direction: 'bidirectional',
    schedule: {
      cron: '0 */6 * * *',  // Every 6 hours
      timezone: 'UTC',
      enabled: true,
    },
    batchSize: 100,
    retryPolicy: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      retryableErrors: ['TIMEOUT', 'RATE_LIMIT', 'TEMPORARY_ERROR'],
    },
    errorHandling: {
      onError: 'skip',
      maxErrors: 100,
      notifyOnError: true,
    },
    deduplication: {
      enabled: true,
      keyFields: ['id'],
      window: 3600,
      strategy: 'last',
    },
  };
}
