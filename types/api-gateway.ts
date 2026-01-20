/**
 * Enterprise API Gateway & Management System
 * CUBE Nexum Platform v2.0 - Enterprise Grade
 * 
 * Features:
 * - Unified API management
 * - OAuth 2.0 / OIDC support
 * - API versioning
 * - Request/Response transformation
 * - Caching strategies
 * - Circuit breaker pattern
 * - Health checks
 * - API documentation generation
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type AuthType = 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2' | 'custom';
export type ContentType = 'json' | 'xml' | 'form' | 'multipart' | 'text' | 'binary';
export type CacheStrategy = 'none' | 'memory' | 'redis' | 'hybrid';
export type CircuitState = 'closed' | 'open' | 'half_open';

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  path: string;
  method: HttpMethod;
  version: string;
  category: string;
  tags: string[];
  authentication: AuthenticationConfig;
  headers: HeaderConfig[];
  queryParams: ParamConfig[];
  pathParams: ParamConfig[];
  requestBody?: RequestBodyConfig;
  responseSchema?: ResponseSchema;
  rateLimiting: RateLimitingConfig;
  caching: CachingConfig;
  circuitBreaker: CircuitBreakerConfig;
  timeout: number;
  retryPolicy: RetryPolicy;
  transformations: TransformationConfig;
  validation: ValidationConfig;
  documentation: DocumentationConfig;
  monitoring: MonitoringConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticationConfig {
  type: AuthType;
  apiKey?: {
    headerName: string;
    prefix?: string;
  };
  bearer?: {
    token: string;
    refreshToken?: string;
    expiresAt?: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  oauth2?: OAuth2Config;
  custom?: {
    handler: string;
    config: Record<string, unknown>;
  };
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
  grantType: 'authorization_code' | 'client_credentials' | 'password' | 'refresh_token';
  redirectUri?: string;
  pkceEnabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface HeaderConfig {
  name: string;
  value: string;
  required: boolean;
  sensitive: boolean;
  description?: string;
}

export interface ParamConfig {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: unknown;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: string[];
  };
  description?: string;
}

export interface RequestBodyConfig {
  contentType: ContentType;
  schema: JsonSchema;
  examples: Record<string, unknown>[];
  required: boolean;
}

export interface ResponseSchema {
  successCodes: number[];
  errorCodes: number[];
  schema: JsonSchema;
  examples: ResponseExample[];
}

export interface ResponseExample {
  name: string;
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
  example?: unknown;
}

export interface RateLimitingConfig {
  enabled: boolean;
  strategy: 'fixed_window' | 'sliding_window' | 'token_bucket' | 'leaky_bucket';
  limit: number;
  window: number;  // seconds
  burstLimit?: number;
  keyExtractor?: string;  // expression to extract rate limit key
  onLimitExceeded: 'reject' | 'queue' | 'throttle';
}

export interface CachingConfig {
  enabled: boolean;
  strategy: CacheStrategy;
  ttl: number;  // seconds
  maxSize: number;  // entries or bytes
  keyGenerator?: string;
  invalidateOn?: string[];  // events that invalidate cache
  compression: boolean;
  warmup: boolean;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  successThreshold: number;
  timeout: number;  // ms
  halfOpenRequests: number;
  monitoredErrors: string[];
  fallbackResponse?: unknown;
}

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

export interface TransformationConfig {
  request: {
    headers?: TransformRule[];
    body?: TransformRule[];
    queryParams?: TransformRule[];
  };
  response: {
    headers?: TransformRule[];
    body?: TransformRule[];
    statusCode?: TransformRule[];
  };
}

export interface TransformRule {
  type: 'set' | 'remove' | 'rename' | 'map' | 'filter' | 'template' | 'script';
  path?: string;
  value?: unknown;
  expression?: string;
  condition?: string;
}

export interface ValidationConfig {
  requestValidation: boolean;
  responseValidation: boolean;
  strictMode: boolean;
  customValidators: CustomValidator[];
}

export interface CustomValidator {
  name: string;
  type: 'header' | 'body' | 'param';
  expression: string;
  errorMessage: string;
}

export interface DocumentationConfig {
  summary: string;
  longDescription: string;
  externalDocs?: {
    url: string;
    description: string;
  };
  deprecated: boolean;
  deprecationMessage?: string;
}

export interface MonitoringConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logHeaders: boolean;
  logBody: boolean;
  maskFields: string[];
  alertOnError: boolean;
  alertOnSlowResponse: number;  // ms threshold
  customMetrics: MetricConfig[];
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  labels: string[];
  expression?: string;
}

// ============================================================================
// API COLLECTION & ORGANIZATION
// ============================================================================

export interface ApiCollection {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  version: string;
  authentication: AuthenticationConfig;
  defaultHeaders: HeaderConfig[];
  endpoints: ApiEndpoint[];
  environments: ApiEnvironment[];
  variables: ApiVariable[];
  documentation: CollectionDocumentation;
  settings: CollectionSettings;
  metadata: CollectionMetadata;
}

export interface ApiEnvironment {
  id: string;
  name: string;
  baseUrl: string;
  variables: Record<string, string>;
  isDefault: boolean;
}

export interface ApiVariable {
  name: string;
  value: string;
  type: 'string' | 'secret' | 'file';
  scope: 'collection' | 'environment' | 'global';
  description?: string;
}

export interface CollectionDocumentation {
  title: string;
  description: string;
  version: string;
  contact: {
    name: string;
    email: string;
    url: string;
  };
  license: {
    name: string;
    url: string;
  };
  servers: ApiServer[];
  tags: ApiTag[];
}

export interface ApiServer {
  url: string;
  description: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  enum?: string[];
  description?: string;
}

export interface ApiTag {
  name: string;
  description: string;
  externalDocs?: {
    url: string;
    description: string;
  };
}

export interface CollectionSettings {
  defaultTimeout: number;
  defaultRetryPolicy: RetryPolicy;
  defaultRateLimiting: RateLimitingConfig;
  proxySettings?: ProxyConfig;
  sslSettings?: SslConfig;
  loggingLevel: 'none' | 'basic' | 'full' | 'debug';
}

export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks5';
  authentication?: {
    username: string;
    password: string;
  };
  bypassList: string[];
}

export interface SslConfig {
  rejectUnauthorized: boolean;
  certificate?: string;
  privateKey?: string;
  ca?: string[];
  passphrase?: string;
}

export interface CollectionMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  importedFrom?: 'openapi' | 'postman' | 'insomnia' | 'curl';
  originalFile?: string;
}

// ============================================================================
// REQUEST/RESPONSE HANDLING
// ============================================================================

export interface ApiRequest {
  id: string;
  endpointId: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: unknown;
  timestamp: string;
  context: RequestContext;
}

export interface RequestContext {
  userId?: string;
  sessionId?: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  environment: string;
  source: 'manual' | 'automation' | 'schedule' | 'webhook';
}

export interface ApiResponse {
  requestId: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  size: number;
  timing: ResponseTiming;
  metadata: ResponseMetadata;
}

export interface ResponseTiming {
  dnsLookup: number;
  tcpConnection: number;
  tlsHandshake: number;
  ttfb: number;  // time to first byte
  contentDownload: number;
  total: number;
}

export interface ResponseMetadata {
  cached: boolean;
  cacheAge?: number;
  retryCount: number;
  circuitState: CircuitState;
  transformationsApplied: string[];
  validationPassed: boolean;
  validationErrors?: string[];
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface ApiAnalytics {
  endpointId: string;
  period: AnalyticsPeriod;
  metrics: EndpointMetrics;
  trends: MetricTrend[];
  errors: ErrorAnalytics;
  performance: PerformanceAnalytics;
}

export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface EndpointMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;  // requests per second
  dataTransferred: number;  // bytes
  cacheHitRate: number;
  errorRate: number;
}

export interface MetricTrend {
  metric: string;
  values: { timestamp: string; value: number }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCode: Record<number, number>;
  errorsByType: Record<string, number>;
  topErrors: ErrorSummary[];
  errorTimeline: { timestamp: string; count: number }[];
}

export interface ErrorSummary {
  code: number;
  message: string;
  count: number;
  lastOccurred: string;
  affectedEndpoints: string[];
}

export interface PerformanceAnalytics {
  latencyDistribution: LatencyBucket[];
  slowestEndpoints: EndpointLatency[];
  latencyByRegion: Record<string, number>;
  latencyByTime: { timestamp: string; p50: number; p95: number; p99: number }[];
}

export interface LatencyBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface EndpointLatency {
  endpointId: string;
  name: string;
  averageLatency: number;
  p99Latency: number;
  requestCount: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate trace ID for distributed tracing
 */
export function generateTraceId(): string {
  return `trace_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Build URL with path and query parameters
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>
): string {
  // Replace path parameters
  let url = `${baseUrl}${path}`;
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`{${key}}`, encodeURIComponent(value));
  }

  // Add query parameters
  const queryString = Object.entries(queryParams)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Parse response headers
 */
export function parseResponseHeaders(headerString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = headerString.split('\n');
  
  for (const line of lines) {
    const index = line.indexOf(':');
    if (index > 0) {
      const key = line.substring(0, index).trim().toLowerCase();
      const value = line.substring(index + 1).trim();
      headers[key] = value;
    }
  }
  
  return headers;
}

/**
 * Calculate cache key
 */
export function calculateCacheKey(
  endpoint: ApiEndpoint,
  request: ApiRequest
): string {
  const components = [
    endpoint.id,
    request.method,
    request.url,
    JSON.stringify(request.queryParams),
  ];
  
  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `cache_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if response should be cached
 */
export function shouldCacheResponse(
  config: CachingConfig,
  statusCode: number,
  method: HttpMethod
): boolean {
  if (!config.enabled) return false;
  if (method !== 'GET') return false;
  if (statusCode < 200 || statusCode >= 400) return false;
  return true;
}

/**
 * Evaluate circuit breaker state
 */
export function evaluateCircuitState(
  config: CircuitBreakerConfig,
  recentFailures: number,
  recentSuccesses: number,
  lastStateChange: number
): CircuitState {
  const now = Date.now();
  
  if (recentFailures >= config.failureThreshold) {
    if (now - lastStateChange > config.timeout) {
      return 'half_open';
    }
    return 'open';
  }
  
  if (recentSuccesses >= config.successThreshold) {
    return 'closed';
  }
  
  return 'closed';
}

/**
 * Format API response for display
 */
export function formatApiResponse(response: ApiResponse): string {
  const lines: string[] = [
    `HTTP ${response.statusCode} ${response.statusText}`,
    '',
    '--- Headers ---',
    ...Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`),
    '',
    '--- Body ---',
  ];

  if (typeof response.body === 'object') {
    lines.push(JSON.stringify(response.body, null, 2));
  } else {
    lines.push(String(response.body));
  }

  lines.push('', '--- Timing ---');
  lines.push(`Total: ${response.timing.total}ms`);
  lines.push(`TTFB: ${response.timing.ttfb}ms`);
  lines.push(`Download: ${response.timing.contentDownload}ms`);

  return lines.join('\n');
}

/**
 * Generate OpenAPI spec from collection
 */
export function generateOpenApiSpec(collection: ApiCollection): Record<string, unknown> {
  const spec: Record<string, unknown> = {
    openapi: '3.0.3',
    info: {
      title: collection.documentation.title,
      description: collection.documentation.description,
      version: collection.documentation.version,
      contact: collection.documentation.contact,
      license: collection.documentation.license,
    },
    servers: collection.documentation.servers,
    tags: collection.documentation.tags,
    paths: {},
    components: {
      securitySchemes: {},
      schemas: {},
    },
  };

  // Add security schemes based on authentication config
  if (collection.authentication.type === 'api_key') {
    (spec.components as Record<string, unknown>).securitySchemes = {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: collection.authentication.apiKey?.headerName || 'X-API-Key',
      },
    };
  } else if (collection.authentication.type === 'bearer') {
    (spec.components as Record<string, unknown>).securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    };
  } else if (collection.authentication.type === 'oauth2') {
    (spec.components as Record<string, unknown>).securitySchemes = {
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: collection.authentication.oauth2?.authorizationUrl,
            tokenUrl: collection.authentication.oauth2?.tokenUrl,
            scopes: Object.fromEntries(
              (collection.authentication.oauth2?.scope || []).map(s => [s, s])
            ),
          },
        },
      },
    };
  }

  // Add paths from endpoints
  for (const endpoint of collection.endpoints) {
    const path = endpoint.path;
    if (!(spec.paths as Record<string, unknown>)[path]) {
      (spec.paths as Record<string, unknown>)[path] = {};
    }

    const operation: Record<string, unknown> = {
      summary: endpoint.documentation.summary,
      description: endpoint.documentation.longDescription,
      operationId: endpoint.id,
      tags: endpoint.tags,
      deprecated: endpoint.documentation.deprecated,
      parameters: [
        ...endpoint.pathParams.map(p => ({
          name: p.name,
          in: 'path',
          required: p.required,
          schema: { type: p.type },
          description: p.description,
        })),
        ...endpoint.queryParams.map(p => ({
          name: p.name,
          in: 'query',
          required: p.required,
          schema: { type: p.type },
          description: p.description,
        })),
        ...endpoint.headers.map(h => ({
          name: h.name,
          in: 'header',
          required: h.required,
          schema: { type: 'string' },
          description: h.description,
        })),
      ],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: endpoint.responseSchema?.schema,
            },
          },
        },
      },
    };

    if (endpoint.requestBody) {
      operation.requestBody = {
        required: endpoint.requestBody.required,
        content: {
          'application/json': {
            schema: endpoint.requestBody.schema,
            examples: endpoint.requestBody.examples,
          },
        },
      };
    }

    ((spec.paths as Record<string, unknown>)[path] as Record<string, unknown>)[
      endpoint.method.toLowerCase()
    ] = operation;
  }

  return spec;
}

/**
 * Get default endpoint configuration
 */
export function getDefaultEndpointConfig(): Partial<ApiEndpoint> {
  return {
    enabled: true,
    timeout: 30000,
    authentication: { type: 'none' },
    headers: [],
    queryParams: [],
    pathParams: [],
    rateLimiting: {
      enabled: false,
      strategy: 'fixed_window',
      limit: 100,
      window: 60,
      onLimitExceeded: 'reject',
    },
    caching: {
      enabled: false,
      strategy: 'memory',
      ttl: 300,
      maxSize: 1000,
      compression: false,
      warmup: false,
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 30000,
      halfOpenRequests: 1,
      monitoredErrors: ['NETWORK_ERROR', 'TIMEOUT'],
    },
    retryPolicy: {
      enabled: true,
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      multiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT'],
    },
    transformations: {
      request: {},
      response: {},
    },
    validation: {
      requestValidation: true,
      responseValidation: false,
      strictMode: false,
      customValidators: [],
    },
    monitoring: {
      enabled: true,
      logRequests: true,
      logResponses: true,
      logHeaders: false,
      logBody: false,
      maskFields: ['password', 'token', 'apiKey', 'secret'],
      alertOnError: true,
      alertOnSlowResponse: 5000,
      customMetrics: [],
    },
  };
}

// ============================================================================
// COMPONENT COMPATIBILITY TYPES
// Used by enterprise dashboard components
// ============================================================================

export interface APIEndpoint {
  id: string;
  name: string;
  description?: string;
  version: string;
  basePath: string;
  status: 'active' | 'inactive' | 'deprecated';
  routes: APIRoute[];
  authentication?: ComponentAuthConfig;
  rateLimit?: ComponentRateLimitConfig;
  baseUrl?: string;
  path?: string;
  method?: HttpMethod;
  category?: string;
  tags?: string[];
  headers?: HeaderConfig[];
  queryParams?: ParamConfig[];
  pathParams?: ParamConfig[];
  requestBody?: RequestBodyConfig;
  responseSchema?: ResponseSchema;
  rateLimiting?: RateLimitingConfig;
  caching?: CachingConfig;
  circuitBreaker?: CircuitBreakerConfig;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  transformations?: TransformationConfig;
  validation?: ValidationConfig;
  documentation?: DocumentationConfig;
  monitoring?: MonitoringConfig;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComponentAuthConfig {
  type: AuthType;
  config?: Record<string, unknown>;
  apiKey?: {
    headerName: string;
    prefix?: string;
  };
  bearer?: {
    token: string;
    refreshToken?: string;
    expiresAt?: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  oauth2?: OAuth2Config;
  custom?: {
    handler: string;
    config: Record<string, unknown>;
  };
}

export interface ComponentRateLimitConfig {
  enabled: boolean;
  requestsPerWindow: number;
  windowSize: number;
  windowUnit: 'second' | 'minute' | 'hour' | 'day';
  strategy: 'fixed_window' | 'sliding_window' | 'token_bucket' | 'leaky_bucket';
}

export interface APIRoute {
  id: string;
  path: string;
  method: HttpMethod;
  handler: string;
  middleware?: string[];
  rateLimit?: number;
  auth?: boolean;
  description?: string;
}

/** @deprecated Use RateLimitingConfig instead */
export type RateLimitConfig = RateLimitingConfig;

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  requestsPerSecond: number;
  activeConnections: number;
  bandwidthUsed: number;
}

/** @deprecated Use ApiRequest instead */
export interface APIRequest {
  id: string;
  timestamp: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  clientIp: string;
  userAgent: string;
}

/** @deprecated Use ApiResponse instead */
export interface APIResponse {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body?: unknown;
  latency: number;
  cached: boolean;
}
