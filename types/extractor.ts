/**
 * Data Extractor Types
 * Visual data extraction system with AI-powered selector generation
 */

// ============================================================================
// SELECTOR TYPES
// ============================================================================

export type SelectorType = 
  | 'css'           // CSS selector
  | 'xpath'         // XPath expression
  | 'text'          // Text content match
  | 'attribute'     // Attribute value
  | 'smart';        // AI-generated smart selector

export type SelectorStrategy = 
  | 'single'        // Extract single element
  | 'multiple'      // Extract multiple elements
  | 'table'         // Extract table data
  | 'list'          // Extract list items
  | 'nested';       // Extract nested structures

export interface Selector {
  id: string;
  type: SelectorType;
  value: string;
  strategy: SelectorStrategy;
  label: string;
  description?: string;
  confidence?: number;      // AI confidence score (0-1)
  fallback?: Selector;      // Fallback selector if primary fails
  validation?: SelectorValidation;
}

export interface SelectorValidation {
  required: boolean;
  minMatches?: number;
  maxMatches?: number;
  pattern?: string;         // Regex pattern for validation
  dataType?: 'string' | 'number' | 'date' | 'email' | 'url' | 'phone';
}

// ============================================================================
// EXTRACTION SCHEMA
// ============================================================================

export interface ExtractionField {
  id: string;
  name: string;
  selector: Selector;
  transform?: DataTransform[];
  validation?: FieldValidation;
  children?: ExtractionField[];  // For nested structures
}

export interface ExtractionSchema {
  id: string;
  name: string;
  description?: string;
  url: string;                    // Target URL or pattern
  fields: ExtractionField[];
  pagination?: PaginationConfig;
  schedule?: ScheduleConfig;
  created: Date;
  modified: Date;
  version: number;
}

export interface PaginationConfig {
  enabled: boolean;
  type: 'click' | 'scroll' | 'url';
  selector?: string;              // Button selector for click pagination
  urlPattern?: string;            // URL pattern for URL pagination
  maxPages?: number;
  stopCondition?: string;         // Condition to stop pagination
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
  cronExpression?: string;
  timezone?: string;
  notifications?: boolean;
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

export type TransformType =
  | 'trim'          // Remove whitespace
  | 'lowercase'     // Convert to lowercase
  | 'uppercase'     // Convert to uppercase
  | 'replace'       // Replace pattern
  | 'extract'       // Extract with regex
  | 'parse_number'  // Parse as number
  | 'parse_date'    // Parse as date
  | 'split'         // Split string
  | 'join'          // Join array
  | 'format';       // Custom format

export interface DataTransform {
  type: TransformType;
  params?: Record<string, any>;
}

export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: string;            // Custom validation function
}

// ============================================================================
// EXTRACTION EXECUTION
// ============================================================================

export interface ExtractionJob {
  id: string;
  schemaId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  progress?: ExtractionProgress;
  result?: ExtractionResult;
  error?: ExtractionError;
}

export interface ExtractionProgress {
  current: number;
  total: number;
  currentPage?: number;
  totalPages?: number;
  message?: string;
}

export interface ExtractionResult {
  schema: string;
  extractedAt: Date;
  url: string;
  data: ExtractedData[];
  stats: ExtractionStats;
  warnings?: string[];
}

export interface ExtractedData {
  [key: string]: string | number | boolean | null | Array<unknown> | Record<string, unknown>;
}

export interface ExtractionStats {
  totalRecords: number;
  totalFields: number;
  pagesProcessed: number;
  duration: number;
  successRate: number;
  failedFields: string[];
}

export interface ExtractionError {
  code: string;
  message: string;
  field?: string;
  selector?: string;
  stackTrace?: string;
}

// ============================================================================
// AI SELECTOR SUGGESTIONS
// ============================================================================

export interface SelectorSuggestion {
  selector: Selector;
  reasoning: string;
  examples: string[];
  alternatives: Selector[];
  score: number;              // 0-100
}

export interface AIAnalysis {
  pageType: string;           // 'table' | 'list' | 'article' | 'form' | 'custom'
  structure: PageStructure;
  suggestions: SelectorSuggestion[];
  confidence: number;
}

export interface PageStructure {
  hasTable: boolean;
  hasList: boolean;
  hasForm: boolean;
  hasPagination: boolean;
  repeatingElements: RepeatingElement[];
  semanticBlocks: SemanticBlock[];
}

export interface RepeatingElement {
  selector: string;
  count: number;
  fields: string[];
  confidence: number;
}

export interface SemanticBlock {
  type: 'header' | 'navigation' | 'content' | 'sidebar' | 'footer';
  selector: string;
  confidence: number;
}

// ============================================================================
// VISUAL SELECTOR UI
// ============================================================================

export interface VisualSelection {
  element: HTMLElement;
  selector: string;
  xpath: string;
  text: string;
  attributes: Record<string, string>;
  boundingBox: DOMRect;
  children?: VisualSelection[];
}

export interface SelectionMode {
  type: 'single' | 'multiple' | 'table' | 'auto';
  highlightColor: string;
  showLabels: boolean;
  showBorders: boolean;
}

export interface ExtractorState {
  mode: 'idle' | 'selecting' | 'editing' | 'previewing' | 'extracting';
  currentSchema?: ExtractionSchema;
  currentSelection?: VisualSelection;
  activeField?: string;
  previewData?: ExtractedData[];
  jobs: ExtractionJob[];
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export type ExportFormat = 'json' | 'csv' | 'excel' | 'xml' | 'sql';

export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;        // For CSV
  sheetName?: string;        // For Excel
  tableName?: string;        // For SQL
  pretty?: boolean;          // For JSON/XML
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface ExtractorTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'social' | 'news' | 'jobs' | 'real-estate' | 'custom';
  icon: string;
  schema: Partial<ExtractionSchema>;
  examples: string[];        // Example URLs
  popularity: number;
}

// ============================================================================
// STORAGE
// ============================================================================

export interface ExtractedDataset {
  id: string;
  schemaId: string;
  name: string;
  created: Date;
  updated: Date;
  recordCount: number;
  size: number;              // Bytes
  data: ExtractedData[];
}
