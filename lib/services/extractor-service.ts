/**
 * Extractor Service - Data Extraction & Web Scraping Integration Layer
 * CUBE Nexum v7 - Complete Data Extraction Operations Service
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface ExtractionSchema {
  id: string;
  name: string;
  url: string;
  fields: ExtractionField[];
  created: Date;
  modified: Date;
  version: number;
}

export interface ExtractionField {
  id: string;
  name: string;
  selector: Selector;
  type?: 'text' | 'number' | 'date' | 'url' | 'image' | 'html';
  transform?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface Selector {
  id: string;
  type: 'css' | 'xpath' | 'regex';
  value: string;
  strategy: 'single' | 'multiple' | 'first' | 'last';
  label?: string;
  alternatives?: string[];
}

export interface ExtractedData {
  [key: string]: string | number | null;
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedData[];
  metadata: {
    url: string;
    extractedAt: string;
    recordCount: number;
    duration: number;
  };
  errors?: string[];
}

export interface SelectorSuggestion {
  selector: string;
  type: 'css' | 'xpath';
  confidence: number;
  description: string;
}

export interface VisualSelection {
  selector: string;
  xpath: string;
  text: string;
  attributes: Record<string, string>;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type ExportFormat = 'json' | 'csv' | 'excel' | 'xml' | 'sql';

export interface ExportConfig {
  format: ExportFormat;
  filename: string;
  includeHeaders: boolean;
  pretty?: boolean;
}

export interface PageAnalysis {
  url: string;
  title: string;
  suggestedFields: ExtractionField[];
  dataPatterns: {
    type: string;
    selector: string;
    count: number;
  }[];
}

// ============================================================================
// Schema Service
// ============================================================================

export const SchemaService = {
  /**
   * Load all saved schemas
   */
  loadSchemas: async (): Promise<ExtractionSchema[]> => {
    return invoke<ExtractionSchema[]>('extractor_load_schemas');
  },

  /**
   * Save a schema
   */
  saveSchema: async (schema: ExtractionSchema): Promise<void> => {
    return invoke('extractor_save_schema', { schema });
  },

  /**
   * Delete a schema
   */
  deleteSchema: async (schemaId: string): Promise<void> => {
    return invoke('extractor_delete_schema', { schemaId });
  },

  /**
   * Duplicate a schema
   */
  duplicateSchema: async (schemaId: string): Promise<ExtractionSchema> => {
    return invoke<ExtractionSchema>('extractor_duplicate_schema', { schemaId });
  },

  /**
   * Import schema from JSON
   */
  importSchema: async (json: string): Promise<ExtractionSchema> => {
    return invoke<ExtractionSchema>('extractor_import_schema', { json });
  },

  /**
   * Export schema to JSON
   */
  exportSchema: async (schemaId: string): Promise<string> => {
    return invoke<string>('extractor_export_schema', { schemaId });
  },
};

// ============================================================================
// Extraction Service
// ============================================================================

export const ExtractionService = {
  /**
   * Preview extraction results
   */
  preview: async (schema: ExtractionSchema): Promise<ExtractedData[]> => {
    return invoke<ExtractedData[]>('extractor_preview', { schema });
  },

  /**
   * Run full extraction
   */
  extract: async (schema: ExtractionSchema): Promise<ExtractionResult> => {
    return invoke<ExtractionResult>('extractor_extract', { schema });
  },

  /**
   * Extract from multiple URLs
   */
  extractBatch: async (
    schema: ExtractionSchema, 
    urls: string[]
  ): Promise<ExtractionResult[]> => {
    return invoke<ExtractionResult[]>('extractor_extract_batch', { schema, urls });
  },

  /**
   * Test a selector
   */
  testSelector: async (
    url: string, 
    selector: string, 
    type: 'css' | 'xpath'
  ): Promise<string[]> => {
    return invoke<string[]>('extractor_test_selector', { url, selector, type });
  },
};

// ============================================================================
// AI Suggestion Service
// ============================================================================

export const AISuggestionService = {
  /**
   * Get AI-powered selector suggestions for an element
   */
  suggestSelectors: async (element: {
    selector: string;
    xpath: string;
    text: string;
    attributes: Record<string, string>;
  }): Promise<SelectorSuggestion[]> => {
    return invoke<SelectorSuggestion[]>('extractor_suggest_selectors', { element });
  },

  /**
   * Analyze page structure with AI
   */
  analyzePage: async (url: string): Promise<PageAnalysis> => {
    return invoke<PageAnalysis>('extractor_analyze_page', { url });
  },

  /**
   * Generate schema from natural language description
   */
  generateSchema: async (description: string, url?: string): Promise<ExtractionSchema> => {
    return invoke<ExtractionSchema>('extractor_generate_schema', { description, url });
  },

  /**
   * Improve an existing selector
   */
  improveSelector: async (
    selector: string, 
    context?: string
  ): Promise<SelectorSuggestion[]> => {
    return invoke<SelectorSuggestion[]>('extractor_improve_selector', { selector, context });
  },
};

// ============================================================================
// Export Service
// ============================================================================

export const DataExportService = {
  /**
   * Export extracted data
   */
  export: async (data: ExtractedData[], config: ExportConfig): Promise<void> => {
    return invoke('extractor_export', { data, config });
  },

  /**
   * Export to JSON string
   */
  toJson: async (data: ExtractedData[], pretty?: boolean): Promise<string> => {
    return invoke<string>('extractor_to_json', { data, pretty });
  },

  /**
   * Export to CSV string
   */
  toCsv: async (data: ExtractedData[], includeHeaders?: boolean): Promise<string> => {
    return invoke<string>('extractor_to_csv', { data, includeHeaders });
  },

  /**
   * Save to file with dialog
   */
  saveToFile: async (
    data: ExtractedData[], 
    format: ExportFormat, 
    filename?: string
  ): Promise<string> => {
    return invoke<string>('extractor_save_to_file', { data, format, filename });
  },
};

// ============================================================================
// Visual Selection Service
// ============================================================================

export const VisualSelectionService = {
  /**
   * Start visual selection mode in browser
   */
  startSelection: async (webviewId: string): Promise<void> => {
    return invoke('extractor_start_selection', { webviewId });
  },

  /**
   * Stop visual selection mode
   */
  stopSelection: async (webviewId: string): Promise<void> => {
    return invoke('extractor_stop_selection', { webviewId });
  },

  /**
   * Get current selection
   */
  getCurrentSelection: async (webviewId: string): Promise<VisualSelection | null> => {
    return invoke<VisualSelection | null>('extractor_get_selection', { webviewId });
  },

  /**
   * Highlight elements matching selector
   */
  highlightElements: async (
    webviewId: string, 
    selector: string
  ): Promise<number> => {
    return invoke<number>('extractor_highlight_elements', { webviewId, selector });
  },

  /**
   * Clear highlights
   */
  clearHighlights: async (webviewId: string): Promise<void> => {
    return invoke('extractor_clear_highlights', { webviewId });
  },
};

// ============================================================================
// Main Extractor Service Export
// ============================================================================

export const ExtractorService = {
  Schema: SchemaService,
  Extraction: ExtractionService,
  AI: AISuggestionService,
  Export: DataExportService,
  Visual: VisualSelectionService,
};

export default ExtractorService;
