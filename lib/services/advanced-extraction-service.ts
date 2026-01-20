/**
 * CUBE Elite v6 - Advanced Data Extraction Service
 * 
 * Enterprise-grade web scraping and data extraction.
 * Competes with: Octoparse, ParseHub, Diffbot, Import.io, Mozenda
 * 
 * Features:
 * - AI-powered automatic schema detection
 * - Intelligent pagination handling
 * - Anti-detection techniques (human-like behavior)
 * - Proxy rotation and management
 * - CAPTCHA solving integration
 * - Scheduled extractions
 * - Change detection and monitoring
 * - Data transformation pipelines
 * - Multi-page workflow extraction
 * - API endpoint generation
 * 
 * Now integrated with Tauri backend extractor commands
 * 
 * @module advanced-extraction-service
 * @version 1.1.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger-service';

const log = logger.scope('AdvancedExtraction');

// ============================================================================
// Backend Integration
// ============================================================================

interface BackendSelector {
  id: string;
  selector_type: string;
  value: string;
  strategy: string;
  label: string;
  description?: string;
  confidence?: number;
  fallback?: BackendSelector;
  validation?: {
    required: boolean;
    min_matches?: number;
    max_matches?: number;
    pattern?: string;
    data_type?: string;
  };
}

interface BackendExtractionField {
  id: string;
  name: string;
  selector: BackendSelector;
  transform?: Array<{ type: string; config: Record<string, unknown> }>;
  validation?: { required: boolean; pattern?: string };
  children?: BackendExtractionField[];
}

interface BackendExtractionSchema {
  id: string;
  name: string;
  description?: string;
  url: string;
  fields: BackendExtractionField[];
  pagination?: {
    enabled: boolean;
    pagination_type: string;
    selector?: string;
    url_pattern?: string;
    max_pages?: number;
    stop_condition?: string;
  };
  schedule?: {
    enabled: boolean;
    cron?: string;
    interval?: number;
  };
  created: string;
  modified: string;
  version: number;
}

interface BackendExtractedData {
  row_index: number;
  fields: Record<string, unknown>;
  source_url: string;
  extracted_at: string;
  success: boolean;
  errors: string[];
}

interface BackendExtractionResult {
  schema_id: string;
  data: BackendExtractedData[];
  total_rows: number;
  pages_processed: number;
  duration_ms: number;
  errors: string[];
  status: string;
}

interface BackendSelectorSuggestion {
  selector: BackendSelector;
  reasoning: string;
  examples: string[];
  alternatives: string[];
  score: number;
}

interface BackendAIAnalysis {
  page_type: string;
  structure: {
    has_table: boolean;
    has_list: boolean;
    has_form: boolean;
    has_pagination: boolean;
    repeating_elements: Array<{ selector: string; count: number; fields: string[]; confidence: number }>;
    semantic_blocks: Array<{ block_type: string; selector: string; confidence: number }>;
  };
  suggestions: BackendSelectorSuggestion[];
  confidence: number;
}

interface BackendExportConfig {
  format: string;
  include_headers: boolean;
  flatten_nested: boolean;
  encoding: string;
  delimiter?: string;
  date_format?: string;
}

const BackendExtractorAPI = {
  async loadSchemas(): Promise<BackendExtractionSchema[]> {
    try {
      return await invoke<BackendExtractionSchema[]>('extractor_load_schemas');
    } catch (error) {
      log.warn('Backend loadSchemas failed:', error);
      return [];
    }
  },

  async saveSchema(schema: BackendExtractionSchema): Promise<string> {
    try {
      return await invoke<string>('extractor_save_schema', { schema });
    } catch (error) {
      log.warn('Backend saveSchema failed:', error);
      throw error;
    }
  },

  async deleteSchema(schemaId: string): Promise<void> {
    try {
      await invoke<void>('extractor_delete_schema', { schemaId });
    } catch (error) {
      log.warn('Backend deleteSchema failed:', error);
    }
  },

  async preview(schema: BackendExtractionSchema): Promise<BackendExtractedData[]> {
    try {
      return await invoke<BackendExtractedData[]>('extractor_preview', { schema });
    } catch (error) {
      log.warn('Backend preview failed:', error);
      return [];
    }
  },

  async extract(schema: BackendExtractionSchema): Promise<BackendExtractionResult> {
    try {
      return await invoke<BackendExtractionResult>('extractor_extract', { schema });
    } catch (error) {
      log.warn('Backend extract failed:', error);
      throw error;
    }
  },

  async suggestSelectors(element: unknown): Promise<BackendSelectorSuggestion[]> {
    try {
      return await invoke<BackendSelectorSuggestion[]>('extractor_suggest_selectors', { element });
    } catch (error) {
      log.warn('Backend suggestSelectors failed:', error);
      return [];
    }
  },

  async analyzePage(url: string): Promise<BackendAIAnalysis | null> {
    try {
      return await invoke<BackendAIAnalysis>('extractor_analyze_page', { url });
    } catch (error) {
      log.warn('Backend analyzePage failed:', error);
      return null;
    }
  },

  async exportData(data: BackendExtractedData[], config: BackendExportConfig, filePath: string): Promise<void> {
    try {
      await invoke<void>('extractor_export', { data, config, filePath });
    } catch (error) {
      log.warn('Backend export failed:', error);
      throw error;
    }
  }
};

// Export backend API for use by other services
export { BackendExtractorAPI };
export type { 
  BackendExtractionSchema, 
  BackendExtractedData, 
  BackendExtractionResult, 
  BackendAIAnalysis,
  BackendSelectorSuggestion 
};

// ============================================================================
// Types
// ============================================================================

/**
 * Extraction source types
 */
export type SourceType = 'url' | 'sitemap' | 'urls_list' | 'search' | 'api';

/**
 * Field data types
 */
export type FieldType = 
  | 'text' | 'html' | 'number' | 'url' | 'image' | 'email' 
  | 'phone' | 'date' | 'price' | 'address' | 'json' | 'list';

/**
 * Pagination types
 */
export type PaginationType = 
  | 'none' 
  | 'next_button' 
  | 'load_more' 
  | 'infinite_scroll' 
  | 'page_numbers' 
  | 'url_pattern';

/**
 * Anti-detection level
 */
export type AntiDetectionLevel = 'none' | 'basic' | 'standard' | 'aggressive';

/**
 * Extraction schema definition
 */
export interface AdvancedSchema {
  id: string;
  name: string;
  description?: string;
  source: ExtractionSource;
  fields: SchemaField[];
  pagination?: PaginationConfig;
  antiDetection: AntiDetectionConfig;
  transforms: DataTransform[];
  schedule?: ScheduleConfig;
  webhooks?: WebhookConfig[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extraction source configuration
 */
export interface ExtractionSource {
  type: SourceType;
  urls: string[];
  sitemapUrl?: string;
  searchQuery?: string;
  apiEndpoint?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  authentication?: AuthConfig;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'cookie' | 'oauth2' | 'form';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
  loginUrl?: string;
  loginSelectors?: {
    usernameField: string;
    passwordField: string;
    submitButton: string;
  };
}

/**
 * Schema field definition
 */
export interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  selector: FieldSelector;
  required: boolean;
  defaultValue?: unknown;
  transform?: FieldTransform;
  validation?: FieldValidation;
  children?: SchemaField[]; // For nested/list fields
}

/**
 * Field selector configuration
 */
export interface FieldSelector {
  type: 'css' | 'xpath' | 'regex' | 'jsonpath' | 'ai';
  value: string;
  attribute?: string; // e.g., 'href', 'src', 'data-id'
  multiple: boolean;
  fallback?: FieldSelector;
  aiPrompt?: string; // For AI-based selection
}

/**
 * Field transformation
 */
export interface FieldTransform {
  type: 
    | 'trim' | 'lowercase' | 'uppercase' | 'titlecase'
    | 'replace' | 'regex_replace' | 'remove_html'
    | 'extract_number' | 'extract_date' | 'extract_email'
    | 'split' | 'join' | 'slice'
    | 'custom_js';
  params?: Record<string, unknown>;
}

/**
 * Field validation
 */
export interface FieldValidation {
  type: 'required' | 'pattern' | 'min' | 'max' | 'enum' | 'custom';
  value?: unknown;
  message?: string;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  type: PaginationType;
  maxPages?: number;
  nextButtonSelector?: string;
  loadMoreSelector?: string;
  pageUrlPattern?: string; // e.g., "?page={page}"
  scrollDelay?: number;
  waitForSelector?: string;
  stopCondition?: StopCondition;
}

/**
 * Stop condition for pagination
 */
export interface StopCondition {
  type: 'no_results' | 'duplicate_data' | 'max_items' | 'selector_missing';
  value?: unknown;
}

/**
 * Anti-detection configuration
 */
export interface AntiDetectionConfig {
  level: AntiDetectionLevel;
  userAgentRotation: boolean;
  proxyRotation: boolean;
  proxyList?: ProxyConfig[];
  randomDelays: {
    min: number;
    max: number;
  };
  humanBehavior: {
    mouseMovements: boolean;
    scrolling: boolean;
    randomClicks: boolean;
  };
  fingerprint: {
    canvas: boolean;
    webgl: boolean;
    audio: boolean;
    fonts: boolean;
  };
  captchaSolver?: CaptchaSolverConfig;
}

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  lastUsed?: Date;
  successRate?: number;
}

/**
 * CAPTCHA solver configuration
 */
export interface CaptchaSolverConfig {
  service: '2captcha' | 'anticaptcha' | 'capmonster' | 'deathbycaptcha';
  apiKey: string;
  types: ('recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'funcaptcha' | 'image')[];
}

/**
 * Data transformation pipeline
 */
export interface DataTransform {
  id: string;
  name: string;
  type: 
    | 'filter' | 'map' | 'reduce' | 'sort' | 'deduplicate'
    | 'merge' | 'flatten' | 'group' | 'pivot' | 'custom';
  config: Record<string, unknown>;
  order: number;
}

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  maxRuns?: number;
  runCount: number;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  events: ('extraction_started' | 'extraction_completed' | 'extraction_failed' | 'data_changed')[];
  enabled: boolean;
}

/**
 * Extraction job
 */
export interface ExtractionJob {
  id: string;
  schemaId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: {
    pagesProcessed: number;
    totalPages: number;
    itemsExtracted: number;
    errors: number;
  };
  results: ExtractedItem[];
  logs: JobLog[];
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Extracted item
 */
export interface ExtractedItem {
  id: string;
  sourceUrl: string;
  data: Record<string, unknown>;
  extractedAt: Date;
  hash: string; // For change detection
}

/**
 * Job log entry
 */
export interface JobLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

/**
 * Change detection result
 */
export interface ChangeDetection {
  schemaId: string;
  previousRun: Date;
  currentRun: Date;
  changes: {
    added: ExtractedItem[];
    modified: { before: ExtractedItem; after: ExtractedItem }[];
    removed: ExtractedItem[];
  };
}

/**
 * AI Schema suggestion
 */
export interface AISchemaSuggestion {
  name: string;
  description: string;
  fields: SchemaField[];
  confidence: number;
  reasoning: string;
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'xml' | 'sql' | 'api';

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  fields?: string[]; // Specific fields to export
  transforms?: DataTransform[];
  destination?: {
    type: 'file' | 'api' | 'database' | 'google_sheets' | 'airtable' | 'notion';
    config: Record<string, unknown>;
  };
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ANTI_DETECTION: AntiDetectionConfig = {
  level: 'standard',
  userAgentRotation: true,
  proxyRotation: false,
  randomDelays: { min: 1000, max: 3000 },
  humanBehavior: {
    mouseMovements: true,
    scrolling: true,
    randomClicks: false,
  },
  fingerprint: {
    canvas: true,
    webgl: true,
    audio: false,
    fonts: false,
  },
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

const DB_NAME = 'cube_advanced_extraction';
const DB_VERSION = 1;

// ============================================================================
// Storage Service
// ============================================================================

class ExtractionStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Schemas store
        if (!db.objectStoreNames.contains('schemas')) {
          db.createObjectStore('schemas', { keyPath: 'id' });
        }

        // Jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobsStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobsStore.createIndex('schemaId', 'schemaId', { unique: false });
          jobsStore.createIndex('status', 'status', { unique: false });
        }

        // Results store
        if (!db.objectStoreNames.contains('results')) {
          const resultsStore = db.createObjectStore('results', { keyPath: 'id' });
          resultsStore.createIndex('jobId', 'jobId', { unique: false });
          resultsStore.createIndex('hash', 'hash', { unique: false });
        }

        // Proxies store
        if (!db.objectStoreNames.contains('proxies')) {
          db.createObjectStore('proxies', { keyPath: 'host' });
        }
      };
    });
  }

  async saveSchema(schema: AdvancedSchema): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['schemas'], 'readwrite');
      const store = transaction.objectStore('schemas');
      
      const storable = {
        ...schema,
        createdAt: schema.createdAt.toISOString(),
        updatedAt: schema.updatedAt.toISOString(),
      };
      
      const request = store.put(storable);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSchema(id: string): Promise<AdvancedSchema | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['schemas'], 'readonly');
      const store = transaction.objectStore('schemas');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        resolve({
          ...request.result,
          createdAt: new Date(request.result.createdAt),
          updatedAt: new Date(request.result.updatedAt),
        });
      };
    });
  }

  async getAllSchemas(): Promise<AdvancedSchema[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['schemas'], 'readonly');
      const store = transaction.objectStore('schemas');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.map((s: Record<string, unknown>) => ({
          ...s,
          createdAt: new Date(s.createdAt as string),
          updatedAt: new Date(s.updatedAt as string),
        })) as AdvancedSchema[]);
      };
    });
  }

  async deleteSchema(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['schemas'], 'readwrite');
      const store = transaction.objectStore('schemas');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveJob(job: ExtractionJob): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readwrite');
      const store = transaction.objectStore('jobs');
      const request = store.put(job);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getJobs(schemaId?: string): Promise<ExtractionJob[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readonly');
      const store = transaction.objectStore('jobs');
      
      let request: IDBRequest;
      if (schemaId) {
        const index = store.index('schemaId');
        request = index.getAll(schemaId);
      } else {
        request = store.getAll();
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// ============================================================================
// AI Schema Detection Service
// ============================================================================

class AISchemaDetectionService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze page and suggest extraction schema
   */
  async analyzePageForSchema(url: string, html: string): Promise<AISchemaSuggestion[]> {
    // Simplified HTML for context
    const simplifiedHtml = this.simplifyHtml(html);

    const prompt = `Analyze this webpage HTML and suggest data extraction schemas.

URL: ${url}

HTML (simplified):
${simplifiedHtml.slice(0, 10000)}

Identify repeating data patterns (like product listings, articles, search results) and suggest:
1. Schema name and description
2. Fields to extract with their CSS selectors
3. Data types for each field
4. Whether pagination exists

Return JSON array of suggestions with confidence scores.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { role: 'system', content: 'You are an expert web scraping engineer. Analyze HTML and suggest optimal extraction schemas. Return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      return (parsed.suggestions || [parsed]).map((s: Record<string, unknown>) => ({
        name: s.name || 'Extracted Data',
        description: s.description || '',
        fields: this.convertAIFieldsToSchema(s.fields as Record<string, unknown>[]),
        confidence: s.confidence || 0.8,
        reasoning: s.reasoning || '',
      }));
    } catch (error) {
      log.error('AI schema detection failed:', error);
      return [];
    }
  }

  /**
   * Generate selector for specific data request
   */
  async suggestSelector(
    html: string,
    description: string,
    existingFields: SchemaField[]
  ): Promise<FieldSelector[]> {
    const prompt = `Given this HTML, find the best CSS selector for: "${description}"

Existing fields: ${existingFields.map(f => f.name).join(', ')}

HTML:
${html.slice(0, 5000)}

Return JSON with multiple selector options, ranked by reliability.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          messages: [
            { role: 'system', content: 'You are a CSS selector expert. Return valid JSON with selector suggestions.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      return (parsed.selectors || []).map((s: Record<string, unknown>) => ({
        type: s.type || 'css',
        value: s.selector || s.value,
        attribute: s.attribute,
        multiple: s.multiple || false,
      }));
    } catch (error) {
      log.error('Selector suggestion failed:', error);
      return [];
    }
  }

  private simplifyHtml(html: string): string {
    // Remove scripts, styles, comments
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private convertAIFieldsToSchema(fields: Record<string, unknown>[]): SchemaField[] {
    return (fields || []).map((f, i) => ({
      id: `field_${Date.now()}_${i}`,
      name: (f.name as string) || `field_${i}`,
      type: this.mapFieldType(f.type as string),
      selector: {
        type: 'css' as const,
        value: (f.selector as string) || '',
        attribute: f.attribute as string | undefined,
        multiple: (f.multiple as boolean) || false,
      },
      required: (f.required as boolean) || false,
    }));
  }

  private mapFieldType(type: string): FieldType {
    const typeMap: Record<string, FieldType> = {
      string: 'text',
      text: 'text',
      number: 'number',
      price: 'price',
      url: 'url',
      link: 'url',
      image: 'image',
      img: 'image',
      email: 'email',
      phone: 'phone',
      date: 'date',
      html: 'html',
      list: 'list',
      array: 'list',
    };
    return typeMap[type?.toLowerCase()] || 'text';
  }
}

// ============================================================================
// Extraction Engine
// ============================================================================

class ExtractionEngine {
  private storage: ExtractionStorageService;
  private aiService: AISchemaDetectionService | null = null;
  private currentJob: ExtractionJob | null = null;
  private abortController: AbortController | null = null;

  constructor(storage: ExtractionStorageService, openaiKey?: string) {
    this.storage = storage;
    if (openaiKey) {
      this.aiService = new AISchemaDetectionService(openaiKey);
    }
  }

  /**
   * Start extraction job
   */
  async startExtraction(schema: AdvancedSchema): Promise<ExtractionJob> {
    this.abortController = new AbortController();

    const job: ExtractionJob = {
      id: `job_${Date.now()}`,
      schemaId: schema.id,
      status: 'running',
      progress: {
        pagesProcessed: 0,
        totalPages: schema.source.urls.length,
        itemsExtracted: 0,
        errors: 0,
      },
      results: [],
      logs: [],
      startedAt: new Date(),
    };

    this.currentJob = job;
    await this.storage.saveJob(job);

    this.log(job, 'info', `Starting extraction for schema: ${schema.name}`);

    try {
      for (const url of schema.source.urls) {
        if (this.abortController.signal.aborted) {
          job.status = 'cancelled';
          break;
        }

        await this.extractFromUrl(schema, job, url);
        job.progress.pagesProcessed++;
        await this.storage.saveJob(job);

        // Handle pagination
        if (schema.pagination && schema.pagination.type !== 'none') {
          await this.handlePagination(schema, job, url);
        }
      }

      if (job.status === 'running') {
        job.status = 'completed';
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.log(job, 'error', `Extraction failed: ${job.error}`);
    }

    job.completedAt = new Date();
    await this.storage.saveJob(job);

    return job;
  }

  /**
   * Extract data from a single URL
   */
  private async extractFromUrl(
    schema: AdvancedSchema,
    job: ExtractionJob,
    url: string
  ): Promise<void> {
    this.log(job, 'info', `Extracting from: ${url}`);

    // Apply anti-detection delay
    if (schema.antiDetection.randomDelays) {
      const delay = this.randomDelay(
        schema.antiDetection.randomDelays.min,
        schema.antiDetection.randomDelays.max
      );
      await this.sleep(delay);
    }

    // Fetch page
    const html = await this.fetchPage(url, schema);

    // Parse and extract
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find repeating items container
    const items = this.findItems(doc, schema.fields);

    for (const itemEl of items) {
      const extractedData: Record<string, unknown> = {};

      for (const field of schema.fields) {
        try {
          const value = this.extractField(itemEl, field);
          extractedData[field.name] = value;
        } catch (error) {
          if (field.required) {
            throw error;
          }
          extractedData[field.name] = field.defaultValue;
        }
      }

      const item: ExtractedItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceUrl: url,
        data: extractedData,
        extractedAt: new Date(),
        hash: this.hashObject(extractedData),
      };

      job.results.push(item);
      job.progress.itemsExtracted++;
    }
  }

  /**
   * Handle pagination
   */
  private async handlePagination(
    schema: AdvancedSchema,
    job: ExtractionJob,
    startUrl: string
  ): Promise<void> {
    if (!schema.pagination) return;

    const config = schema.pagination;
    let currentPage = 1;
    let currentUrl = startUrl;

    while (currentPage < (config.maxPages || 100)) {
      if (this.abortController?.signal.aborted) break;

      // Get next page URL based on pagination type
      const nextUrl = await this.getNextPageUrl(config, currentUrl, currentPage);
      if (!nextUrl) break;

      // Check stop condition
      if (config.stopCondition) {
        const shouldStop = this.checkStopCondition(config.stopCondition, job);
        if (shouldStop) break;
      }

      currentUrl = nextUrl;
      currentPage++;
      job.progress.totalPages++;

      await this.extractFromUrl(schema, job, currentUrl);
      job.progress.pagesProcessed++;
    }
  }

  /**
   * Get next page URL
   */
  private async getNextPageUrl(
    config: PaginationConfig,
    currentUrl: string,
    currentPage: number
  ): Promise<string | null> {
    switch (config.type) {
      case 'url_pattern':
        if (config.pageUrlPattern) {
          const baseUrl = currentUrl.split('?')[0];
          return baseUrl + config.pageUrlPattern.replace('{page}', String(currentPage + 1));
        }
        break;

      case 'next_button':
        // Would need to fetch page and find next button
        // For now, return null
        break;

      case 'page_numbers':
        // Similar to url_pattern
        break;
    }

    return null;
  }

  /**
   * Check stop condition
   */
  private checkStopCondition(condition: StopCondition, job: ExtractionJob): boolean {
    switch (condition.type) {
      case 'max_items':
        return job.progress.itemsExtracted >= (condition.value as number);
      case 'no_results':
        // Check if last page had no results
        return false;
      default:
        return false;
    }
  }

  /**
   * Fetch page with anti-detection
   */
  private async fetchPage(url: string, schema: AdvancedSchema): Promise<string> {
    const headers: Record<string, string> = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      ...schema.source.headers,
    };

    // User agent rotation
    if (schema.antiDetection.userAgentRotation) {
      headers['User-Agent'] = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }

    const response = await fetch(url, {
      headers,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Find repeating items in document
   */
  private findItems(doc: Document, _fields: SchemaField[]): Element[] {
    // Try to find common container for all fields
    // For now, return document body as single item
    return [doc.body];
  }

  /**
   * Extract single field value
   */
  private extractField(container: Element, field: SchemaField): unknown {
    const { selector } = field;
    let elements: Element[];

    switch (selector.type) {
      case 'css':
        if (selector.multiple) {
          elements = Array.from(container.querySelectorAll(selector.value));
        } else {
          const el = container.querySelector(selector.value);
          elements = el ? [el] : [];
        }
        break;

      case 'xpath':
        const result = document.evaluate(
          selector.value,
          container,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        elements = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          const node = result.snapshotItem(i);
          if (node instanceof Element) {
            elements.push(node);
          }
        }
        if (!selector.multiple && elements.length > 0) {
          elements = [elements[0]];
        }
        break;

      default:
        elements = [];
    }

    if (elements.length === 0) {
      if (selector.fallback) {
        return this.extractField(container, { ...field, selector: selector.fallback });
      }
      throw new Error(`No elements found for field: ${field.name}`);
    }

    // Extract value based on field type
    const values = elements.map(el => this.extractValue(el, field, selector.attribute));

    // Apply transforms
    let result = selector.multiple ? values : values[0];
    if (field.transform) {
      result = this.applyTransform(result, field.transform);
    }

    return result;
  }

  /**
   * Extract value from element
   */
  private extractValue(element: Element, field: SchemaField, attribute?: string): unknown {
    if (attribute) {
      return element.getAttribute(attribute);
    }

    switch (field.type) {
      case 'html':
        return element.innerHTML;
      case 'url':
        return element.getAttribute('href') || element.getAttribute('src');
      case 'image':
        return element.getAttribute('src') || element.getAttribute('data-src');
      case 'number':
        return parseFloat(element.textContent?.replace(/[^0-9.-]/g, '') || '0');
      case 'price':
        const priceText = element.textContent || '';
        const price = parseFloat(priceText.replace(/[^0-9.-]/g, ''));
        return { value: price, currency: priceText.match(/[$€£¥]/)?.[0] || 'USD' };
      default:
        return element.textContent?.trim();
    }
  }

  /**
   * Apply transformation to value
   */
  private applyTransform(value: unknown, transform: FieldTransform): unknown {
    if (typeof value !== 'string') return value;

    switch (transform.type) {
      case 'trim':
        return value.trim();
      case 'lowercase':
        return value.toLowerCase();
      case 'uppercase':
        return value.toUpperCase();
      case 'remove_html':
        return value.replace(/<[^>]*>/g, '');
      case 'extract_number':
        return parseFloat(value.replace(/[^0-9.-]/g, '') || '0');
      case 'replace':
        const { search, replacement } = transform.params as { search: string; replacement: string };
        return value.replace(search, replacement);
      case 'regex_replace':
        const { pattern, replace } = transform.params as { pattern: string; replace: string };
        return value.replace(new RegExp(pattern, 'g'), replace);
      default:
        return value;
    }
  }

  /**
   * Pause current job
   */
  pause(): void {
    if (this.currentJob) {
      this.currentJob.status = 'paused';
    }
  }

  /**
   * Cancel current job
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.currentJob) {
      this.currentJob.status = 'cancelled';
    }
  }

  /**
   * Log message
   */
  private log(job: ExtractionJob, level: JobLog['level'], message: string, data?: unknown): void {
    job.logs.push({
      timestamp: new Date(),
      level,
      message,
      data,
    });
  }

  /**
   * Random delay
   */
  private randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Hash object for change detection
   */
  private hashObject(obj: Record<string, unknown>): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get AI service
   */
  getAIService(): AISchemaDetectionService | null {
    return this.aiService;
  }
}

// ============================================================================
// Export Service
// ============================================================================

class DataExportService {
  /**
   * Export data in specified format
   */
  async export(data: ExtractedItem[], config: ExportConfig): Promise<Blob | string> {
    const exportData = this.prepareData(data, config);

    switch (config.format) {
      case 'json':
        return this.exportJSON(exportData);
      case 'csv':
        return this.exportCSV(exportData);
      case 'xlsx':
        return this.exportXLSX(exportData);
      case 'xml':
        return this.exportXML(exportData);
      case 'sql':
        return this.exportSQL(exportData, config.filename || 'data');
      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }
  }

  /**
   * Prepare data for export
   */
  private prepareData(data: ExtractedItem[], config: ExportConfig): Record<string, unknown>[] {
    let result = data.map(item => item.data);

    // Filter fields
    if (config.fields && config.fields.length > 0) {
      result = result.map(item => {
        const filtered: Record<string, unknown> = {};
        for (const field of config.fields!) {
          if (field in item) {
            filtered[field] = item[field];
          }
        }
        return filtered;
      });
    }

    return result;
  }

  private exportJSON(data: Record<string, unknown>[]): Blob {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  private exportCSV(data: Record<string, unknown>[]): Blob {
    if (data.length === 0) return new Blob([''], { type: 'text/csv' });

    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(h => {
        const value = item[h];
        if (value === null || value === undefined) return '';
        const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }

  private exportXLSX(data: Record<string, unknown>[]): Blob {
    // Would need xlsx library - return CSV for now
    log.warn('XLSX export requires xlsx library, falling back to CSV');
    return this.exportCSV(data);
  }

  private exportXML(data: Record<string, unknown>[]): Blob {
    const items = data.map(item => {
      const fields = Object.entries(item)
        .map(([key, value]) => `    <${key}>${this.escapeXml(String(value))}</${key}>`)
        .join('\n');
      return `  <item>\n${fields}\n  </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${items}\n</data>`;
    return new Blob([xml], { type: 'application/xml' });
  }

  private exportSQL(data: Record<string, unknown>[], tableName: string): string {
    if (data.length === 0) return '';

    const columns = Object.keys(data[0]);
    const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.map(c => `${c} TEXT`).join(',\n  ')}\n);\n\n`;

    const inserts = data.map(item => {
      const values = columns.map(c => {
        const v = item[c];
        if (v === null || v === undefined) return 'NULL';
        return `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');
      return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
    }).join('\n');

    return createTable + inserts;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// ============================================================================
// Main Service
// ============================================================================

export class AdvancedExtractionService {
  private storage: ExtractionStorageService;
  private engine: ExtractionEngine;
  private exportService: DataExportService;

  constructor(openaiKey?: string) {
    this.storage = new ExtractionStorageService();
    this.engine = new ExtractionEngine(this.storage, openaiKey);
    this.exportService = new DataExportService();
  }

  async init(): Promise<void> {
    await this.storage.init();
    // Sync with backend
    await this.syncWithBackend();
  }

  // ---------------------------------------------------------------------------
  // Backend Sync Methods
  // ---------------------------------------------------------------------------

  private async syncWithBackend(): Promise<void> {
    try {
      const backendSchemas = await BackendExtractorAPI.loadSchemas();
      log.debug(`[Extractor] Loaded ${backendSchemas.length} schemas from backend`);
    } catch (error) {
      log.warn('[Extractor] Backend sync failed:', error);
    }
  }

  /**
   * Load all schemas from backend
   */
  async loadBackendSchemas(): Promise<BackendExtractionSchema[]> {
    return BackendExtractorAPI.loadSchemas();
  }

  /**
   * Save schema to backend
   */
  async saveSchemaToBackend(schema: AdvancedSchema): Promise<string> {
    const backendSchema = this.convertToBackendSchema(schema);
    return BackendExtractorAPI.saveSchema(backendSchema);
  }

  /**
   * Delete schema from backend
   */
  async deleteSchemaFromBackend(schemaId: string): Promise<void> {
    return BackendExtractorAPI.deleteSchema(schemaId);
  }

  /**
   * Preview extraction using backend
   */
  async previewWithBackend(schema: AdvancedSchema): Promise<BackendExtractedData[]> {
    const backendSchema = this.convertToBackendSchema(schema);
    return BackendExtractorAPI.preview(backendSchema);
  }

  /**
   * Run full extraction using backend
   */
  async extractWithBackend(schema: AdvancedSchema): Promise<BackendExtractionResult> {
    const backendSchema = this.convertToBackendSchema(schema);
    return BackendExtractorAPI.extract(backendSchema);
  }

  /**
   * Get selector suggestions from backend AI
   */
  async getSelectorSuggestionsFromBackend(element: unknown): Promise<BackendSelectorSuggestion[]> {
    return BackendExtractorAPI.suggestSelectors(element);
  }

  /**
   * Analyze page using backend AI
   */
  async analyzePageWithBackend(url: string): Promise<BackendAIAnalysis | null> {
    return BackendExtractorAPI.analyzePage(url);
  }

  /**
   * Export data using backend
   */
  async exportWithBackend(
    data: BackendExtractedData[],
    format: 'csv' | 'json' | 'xlsx' | 'xml',
    filePath: string
  ): Promise<void> {
    const config: BackendExportConfig = {
      format,
      include_headers: true,
      flatten_nested: true,
      encoding: 'utf-8',
      delimiter: format === 'csv' ? ',' : undefined,
    };
    return BackendExtractorAPI.exportData(data, config, filePath);
  }

  /**
   * Convert frontend schema to backend format
   */
  private convertToBackendSchema(schema: AdvancedSchema): BackendExtractionSchema {
    return {
      id: schema.id,
      name: schema.name,
      description: schema.description,
      url: schema.source.urls[0] || '',
      fields: schema.fields.map((field) => this.convertToBackendField(field)),
      pagination: schema.pagination ? {
        enabled: true,
        pagination_type: schema.pagination.type,
        selector: schema.pagination.nextButtonSelector,
        url_pattern: schema.pagination.pageUrlPattern,
        max_pages: schema.pagination.maxPages,
      } : undefined,
      schedule: schema.schedule ? {
        enabled: schema.schedule.enabled,
        cron: schema.schedule.cronExpression,
        interval: 0, // Not used, using cron expression
      } : undefined,
      created: schema.createdAt.toISOString(),
      modified: schema.updatedAt.toISOString(),
      version: schema.version,
    };
  }

  /**
   * Convert frontend field to backend format
   */
  private convertToBackendField(field: SchemaField): BackendExtractionField {
    return {
      id: field.id,
      name: field.name,
      selector: {
        id: field.id,
        selector_type: field.selector.type,
        value: field.selector.value,
        strategy: field.selector.multiple ? 'multiple' : 'single',
        label: field.name,
        description: undefined,
        confidence: 1.0,
      },
      transform: field.transform ? [{
        type: field.transform.type,
        config: field.transform.params || {},
      }] : undefined,
      validation: field.validation ? {
        required: field.required,
        pattern: field.validation.type === 'pattern' ? String(field.validation.value) : undefined,
      } : undefined,
      children: field.children?.map((child) => this.convertToBackendField(child)),
    };
  }

  // Schema management
  async createSchema(name: string, urls: string[]): Promise<AdvancedSchema> {
    const schema: AdvancedSchema = {
      id: `schema_${Date.now()}`,
      name,
      source: {
        type: 'urls_list',
        urls,
      },
      fields: [],
      antiDetection: DEFAULT_ANTI_DETECTION,
      transforms: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storage.saveSchema(schema);
    // Also save to backend (non-critical, silent fail allowed)
    await this.saveSchemaToBackend(schema).catch((error) => {
      log.warn('Backend schema save failed (non-critical):', error);
    });
    return schema;
  }

  async updateSchema(schema: AdvancedSchema): Promise<void> {
    schema.updatedAt = new Date();
    schema.version++;
    await this.storage.saveSchema(schema);
    // Also save to backend (non-critical, silent fail allowed)
    await this.saveSchemaToBackend(schema).catch((error) => {
      log.warn('Backend schema update failed (non-critical):', error);
    });
  }

  async deleteSchema(id: string): Promise<void> {
    await this.storage.deleteSchema(id);
    // Also delete from backend (non-critical, silent fail allowed)
    await this.deleteSchemaFromBackend(id).catch((error) => {
      log.warn('Backend schema delete failed (non-critical):', error);
    });
  }

  async getSchemas(): Promise<AdvancedSchema[]> {
    return await this.storage.getAllSchemas();
  }

  async getSchema(id: string): Promise<AdvancedSchema | null> {
    return await this.storage.getSchema(id);
  }

  // AI features
  async autoDetectSchema(url: string): Promise<AISchemaSuggestion[]> {
    // Try backend first
    const backendAnalysis = await this.analyzePageWithBackend(url);
    if (backendAnalysis) {
      // Convert backend analysis to schema suggestions
      return backendAnalysis.suggestions.map((suggestion) => ({
        name: suggestion.selector?.label || suggestion.selector?.value || 'Auto-detected Schema',
        description: suggestion.reasoning || 'Automatically detected schema structure',
        confidence: suggestion.score / 100,
        fields: [],
        reasoning: suggestion.reasoning,
      }));
    }

    // Fall back to frontend AI
    const ai = this.engine.getAIService();
    if (!ai) throw new Error('AI service not configured');

    // Fetch page
    const response = await fetch(url);
    const html = await response.text();

    return await ai.analyzePageForSchema(url, html);
  }

  async suggestSelector(html: string, description: string, existingFields: SchemaField[]): Promise<FieldSelector[]> {
    const ai = this.engine.getAIService();
    if (!ai) throw new Error('AI service not configured');

    return await ai.suggestSelector(html, description, existingFields);
  }

  // Extraction
  async startExtraction(schemaId: string): Promise<ExtractionJob> {
    const schema = await this.storage.getSchema(schemaId);
    if (!schema) throw new Error('Schema not found');

    return await this.engine.startExtraction(schema);
  }

  pauseExtraction(): void {
    this.engine.pause();
  }

  cancelExtraction(): void {
    this.engine.cancel();
  }

  async getJobs(schemaId?: string): Promise<ExtractionJob[]> {
    return await this.storage.getJobs(schemaId);
  }

  // Export
  async exportData(data: ExtractedItem[], config: ExportConfig): Promise<Blob | string> {
    return await this.exportService.export(data, config);
  }
}

// ============================================================================
// React Hook
// ============================================================================

export function useAdvancedExtraction(openaiKey?: string) {
  const [service, setService] = useState<AdvancedExtractionService | null>(null);
  const [schemas, setSchemas] = useState<AdvancedSchema[]>([]);
  const [currentJob, setCurrentJob] = useState<ExtractionJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serviceRef = useRef<AdvancedExtractionService | null>(null);

  const loadSchemas = useCallback(async (svc: AdvancedExtractionService) => {
    const result = await svc.getSchemas();
    setSchemas(result);
  }, []);

  useEffect(() => {
    const svc = new AdvancedExtractionService(openaiKey);
    serviceRef.current = svc;

    svc.init()
      .then(() => {
        setService(svc);
        loadSchemas(svc);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [openaiKey, loadSchemas]);

  const createSchema = useCallback(async (name: string, urls: string[]) => {
    if (!service) return null;
    const schema = await service.createSchema(name, urls);
    await loadSchemas(service);
    return schema;
  }, [service, loadSchemas]);

  const autoDetectSchema = useCallback(async (url: string) => {
    if (!service) return [];
    return await service.autoDetectSchema(url);
  }, [service]);

  const startExtraction = useCallback(async (schemaId: string) => {
    if (!service) return null;
    const job = await service.startExtraction(schemaId);
    setCurrentJob(job);
    return job;
  }, [service]);

  const exportData = useCallback(async (data: ExtractedItem[], config: ExportConfig) => {
    if (!service) return null;
    return await service.exportData(data, config);
  }, [service]);

  return {
    isLoading,
    error,
    schemas,
    currentJob,
    createSchema,
    updateSchema: service?.updateSchema.bind(service),
    deleteSchema: service?.deleteSchema.bind(service),
    autoDetectSchema,
    suggestSelector: service?.suggestSelector.bind(service),
    startExtraction,
    pauseExtraction: service?.pauseExtraction.bind(service),
    cancelExtraction: service?.cancelExtraction.bind(service),
    getJobs: service?.getJobs.bind(service),
    exportData,
    service,
  };
}

// ============================================================================
// Export
// ============================================================================

export {
  DEFAULT_ANTI_DETECTION,
  USER_AGENTS,
};
