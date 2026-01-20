// ============================================================================
// DATA EXTRACTION PRO - ELITE TYPE DEFINITIONS
// ============================================================================
// Advanced data extraction with AI auto-detect, self-healing selectors,
// CAPTCHA handling, and multi-page extraction capabilities
// ============================================================================

// ============================================================================
// SELECTOR TYPES
// ============================================================================

export type SelectorStrategy = 
  | 'css'
  | 'xpath'
  | 'ai-visual'
  | 'semantic'
  | 'hybrid'
  | 'text-match'
  | 'position-relative';

export type SelectorConfidence = 'high' | 'medium' | 'low' | 'uncertain';

export interface SmartSelector {
  id: string;
  primary: string;
  strategy: SelectorStrategy;
  fallbacks: SelectorFallback[];
  confidence: number;
  lastValidated: Date;
  healingHistory: HealingRecord[];
  aiSuggestions: string[];
}

export interface SelectorFallback {
  selector: string;
  strategy: SelectorStrategy;
  priority: number;
  successRate: number;
}

export interface HealingRecord {
  timestamp: Date;
  originalSelector: string;
  healedSelector: string;
  healingMethod: 'ai' | 'fallback' | 'pattern' | 'manual';
  success: boolean;
}

// ============================================================================
// EXTRACTION TEMPLATE TYPES
// ============================================================================

export interface ExtractionTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: TemplateCategory;
  sourceUrl?: string;
  sourcePattern?: RegExp;
  fields: ExtractionField[];
  pagination?: PaginationConfig;
  captchaHandling?: CaptchaConfig;
  scheduling?: ScheduleConfig;
  outputFormat: OutputFormat;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  successRate: number;
  isPublic: boolean;
  author?: string;
}

export type TemplateCategory =
  | 'ecommerce'
  | 'social-media'
  | 'news'
  | 'jobs'
  | 'real-estate'
  | 'finance'
  | 'travel'
  | 'government'
  | 'healthcare'
  | 'custom';

export interface ExtractionField {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  selector: SmartSelector;
  isRequired: boolean;
  defaultValue?: string;
  transform?: TransformConfig;
  validation?: ValidationRule[];
  subFields?: ExtractionField[];
}

export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'url'
  | 'image'
  | 'email'
  | 'phone'
  | 'html'
  | 'json'
  | 'list'
  | 'table'
  | 'object';

export interface TransformConfig {
  type: TransformType;
  params?: Record<string, unknown>;
  customScript?: string;
}

export type TransformType =
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'regex-extract'
  | 'regex-replace'
  | 'split'
  | 'join'
  | 'date-format'
  | 'number-format'
  | 'currency-parse'
  | 'html-to-text'
  | 'custom';

export interface ValidationRule {
  type: ValidationType;
  params?: Record<string, unknown>;
  message: string;
}

export type ValidationType =
  | 'required'
  | 'min-length'
  | 'max-length'
  | 'regex'
  | 'email'
  | 'url'
  | 'number-range'
  | 'date-range'
  | 'custom';

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationConfig {
  type: PaginationType;
  maxPages?: number;
  delay?: number;
  nextSelector?: SmartSelector;
  pageNumberSelector?: SmartSelector;
  infiniteScrollConfig?: InfiniteScrollConfig;
  urlPattern?: string;
}

export type PaginationType =
  | 'next-button'
  | 'numbered'
  | 'infinite-scroll'
  | 'url-parameter'
  | 'load-more'
  | 'api-cursor';

export interface InfiniteScrollConfig {
  scrollElement?: string;
  scrollDelay: number;
  maxScrolls: number;
  endIndicator?: string;
  loadingIndicator?: string;
}

// ============================================================================
// CAPTCHA HANDLING TYPES
// ============================================================================

export interface CaptchaConfig {
  enabled: boolean;
  detectionSelectors: string[];
  handlingMethod: CaptchaMethod;
  maxRetries: number;
  timeout: number;
  fallbackAction: 'skip' | 'pause' | 'abort' | 'notify';
}

export type CaptchaMethod =
  | 'manual'
  | '2captcha'
  | 'anticaptcha'
  | 'capsolver'
  | 'ai-solve'
  | 'browser-automation';

export interface CaptchaEvent {
  id: string;
  timestamp: Date;
  captchaType: string;
  method: CaptchaMethod;
  success: boolean;
  timeToSolve?: number;
  cost?: number;
}

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

export interface ScheduleConfig {
  enabled: boolean;
  cronExpression?: string;
  frequency: ScheduleFrequency;
  customInterval?: number;
  timezone: string;
  maxRuns?: number;
  startDate?: Date;
  endDate?: Date;
  notifyOnComplete: boolean;
  notifyOnError: boolean;
}

export type ScheduleFrequency =
  | 'once'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom-cron';

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface OutputFormat {
  type: OutputType;
  options: OutputOptions;
  destination: OutputDestination;
}

export type OutputType = 'json' | 'csv' | 'excel' | 'xml' | 'html' | 'google-sheets' | 'database';

export interface OutputOptions {
  includeMetadata: boolean;
  flattenNested: boolean;
  nullValue: string;
  dateFormat: string;
  encoding: 'utf-8' | 'utf-16' | 'ascii';
  delimiter?: string;
  headers?: boolean;
}

export interface OutputDestination {
  type: DestinationType;
  path?: string;
  url?: string;
  credentials?: Record<string, string>;
}

export type DestinationType = 'local' | 'cloud' | 'api' | 'email' | 'webhook';

// ============================================================================
// EXTRACTION JOB TYPES
// ============================================================================

export interface ExtractionJob {
  id: string;
  templateId: string;
  name: string;
  status: JobStatus;
  progress: JobProgress;
  startedAt?: Date;
  completedAt?: Date;
  sourceUrls: string[];
  config: JobConfig;
  results: ExtractionResult[];
  errors: ExtractionError[];
  metrics: JobMetrics;
}

export type JobStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'scheduled';

export interface JobProgress {
  currentUrl: string;
  currentPage: number;
  totalPages: number;
  itemsExtracted: number;
  estimatedRemaining: number;
  percentage: number;
}

export interface JobConfig {
  concurrency: number;
  retryAttempts: number;
  requestDelay: number;
  timeout: number;
  respectRobotsTxt: boolean;
  userAgent: string;
  proxyConfig?: ProxyConfig;
  headless: boolean;
  javascript: boolean;
}

export interface ProxyConfig {
  enabled: boolean;
  type: 'http' | 'socks5' | 'rotating';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  rotationInterval?: number;
}

export interface ExtractionResult {
  id: string;
  sourceUrl: string;
  pageNumber: number;
  data: Record<string, unknown>;
  extractedAt: Date;
  confidence: number;
  healedFields: string[];
}

export interface ExtractionError {
  id: string;
  timestamp: Date;
  url: string;
  field?: string;
  errorType: ErrorType;
  message: string;
  stackTrace?: string;
  recovered: boolean;
}

export type ErrorType =
  | 'selector-not-found'
  | 'timeout'
  | 'network'
  | 'captcha'
  | 'blocked'
  | 'parse'
  | 'validation'
  | 'rate-limit'
  | 'unknown';

export interface JobMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalItems: number;
  avgExtractionTime: number;
  avgPageLoadTime: number;
  healingEvents: number;
  captchasSolved: number;
  dataSize: number;
}

// ============================================================================
// AI AUTO-DETECT TYPES
// ============================================================================

export interface AIDetectionResult {
  id: string;
  url: string;
  detectedAt: Date;
  pageType: PageType;
  confidence: number;
  suggestedTemplate?: string;
  detectedFields: DetectedField[];
  structureAnalysis: StructureAnalysis;
}

export type PageType =
  | 'product-listing'
  | 'product-detail'
  | 'article'
  | 'search-results'
  | 'profile'
  | 'directory'
  | 'table'
  | 'form'
  | 'unknown';

export interface DetectedField {
  name: string;
  type: FieldType;
  selector: string;
  confidence: number;
  sampleValue?: string;
  suggestedTransform?: TransformType;
}

export interface StructureAnalysis {
  hasRepeatingElements: boolean;
  repeatingContainerSelector?: string;
  hasPagination: boolean;
  paginationType?: PaginationType;
  hasInfiniteScroll: boolean;
  dynamicContent: boolean;
  loginRequired: boolean;
}

// ============================================================================
// SELF-HEALING TYPES
// ============================================================================

export interface SelfHealingConfig {
  enabled: boolean;
  strategies: HealingStrategy[];
  maxAttempts: number;
  learningEnabled: boolean;
  notifyOnHeal: boolean;
  autoApprove: boolean;
  confidenceThreshold: number;
}

export type HealingStrategy =
  | 'fallback-chain'
  | 'ai-regenerate'
  | 'pattern-match'
  | 'visual-match'
  | 'text-match'
  | 'sibling-traverse';

export interface HealingEvent {
  id: string;
  timestamp: Date;
  jobId: string;
  fieldId: string;
  originalSelector: string;
  healedSelector: string;
  strategy: HealingStrategy;
  success: boolean;
  confidence: number;
  approved: boolean;
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number;
  changeDetection: ChangeDetectionConfig;
  alerts: AlertConfig[];
}

export interface ChangeDetectionConfig {
  enabled: boolean;
  type: 'content' | 'structure' | 'visual' | 'hash';
  threshold: number;
  ignoreSelectors: string[];
}

export interface AlertConfig {
  type: AlertType;
  destination: string;
  conditions: AlertCondition[];
}

export type AlertType = 'email' | 'webhook' | 'slack' | 'discord' | 'sms';

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'changed' | 'missing';
  value?: unknown;
}

export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  type: 'check' | 'change' | 'alert' | 'error';
  url: string;
  details: Record<string, unknown>;
}
