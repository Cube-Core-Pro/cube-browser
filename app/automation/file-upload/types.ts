/**
 * 📁 FILE UPLOAD AUTOMATION - TYPES
 * 
 * Type definitions for the file upload automation system
 * that supports PDF, TXT, DOCX, Excel, and CSV files.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTED FILE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SupportedFileType = 
  | 'pdf'
  | 'txt'
  | 'docx'
  | 'xlsx'
  | 'xls'
  | 'csv';

export const SUPPORTED_EXTENSIONS: Record<SupportedFileType, string[]> = {
  pdf: ['.pdf'],
  txt: ['.txt', '.text'],
  docx: ['.docx', '.doc'],
  xlsx: ['.xlsx'],
  xls: ['.xls'],
  csv: ['.csv']
};

export const SUPPORTED_MIME_TYPES: Record<SupportedFileType, string[]> = {
  pdf: ['application/pdf'],
  txt: ['text/plain'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  xls: ['application/vnd.ms-excel'],
  csv: ['text/csv', 'application/csv']
};

export const FILE_TYPE_ICONS: Record<SupportedFileType, string> = {
  pdf: '📄',
  txt: '📝',
  docx: '📘',
  xlsx: '📊',
  xls: '📊',
  csv: '📋'
};

// ═══════════════════════════════════════════════════════════════════════════
// PARSING RESULT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ParsedInstruction {
  id: string;
  order: number;
  action: InstructionAction;
  target?: string;
  value?: string;
  selector?: string;
  description: string;
  conditions?: InstructionCondition[];
  isOptional?: boolean;
  waitTime?: number;
  confidence: number;
}

export type InstructionAction =
  | 'navigate'
  | 'click'
  | 'type'
  | 'select'
  | 'upload'
  | 'download'
  | 'wait'
  | 'verify'
  | 'scroll'
  | 'hover'
  | 'extract'
  | 'loop'
  | 'condition';

export interface InstructionCondition {
  type: 'element_exists' | 'element_visible' | 'text_contains' | 'value_equals';
  target: string;
  value?: string;
  negated?: boolean;
}

export interface ParsedFile {
  id: string;
  fileName: string;
  fileType: SupportedFileType;
  fileSize: number;
  uploadedAt: string;
  parsedAt?: string;
  status: 'pending' | 'parsing' | 'parsed' | 'error';
  instructions: ParsedInstruction[];
  metadata: FileMetadata;
  rawContent?: string;
  error?: string;
}

export interface FileMetadata {
  title?: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  pageCount?: number;
  wordCount?: number;
  rowCount?: number;
  columnCount?: number;
  sheets?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSING OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface ParsingOptions {
  useAI: boolean;
  detectSelectors: boolean;
  detectActions: boolean;
  language: 'en' | 'es';
  confidenceThreshold: number;
  maxInstructions: number;
}

export const DEFAULT_PARSING_OPTIONS: ParsingOptions = {
  useAI: true,
  detectSelectors: true,
  detectActions: true,
  language: 'en',
  confidenceThreshold: 0.7,
  maxInstructions: 100
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export interface GeneratedWorkflow {
  id: string;
  name: string;
  description: string;
  sourceFile: string;
  createdAt: string;
  steps: ParsedInstruction[];
  totalSteps: number;
  estimatedTime: number;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface FileUploadState {
  files: ParsedFile[];
  selectedFile: string | null;
  isUploading: boolean;
  isParsing: boolean;
  parsingOptions: ParsingOptions;
  generatedWorkflows: GeneratedWorkflow[];
  error: string | null;
}

export const INITIAL_UPLOAD_STATE: FileUploadState = {
  files: [],
  selectedFile: null,
  isUploading: false,
  isParsing: false,
  parsingOptions: DEFAULT_PARSING_OPTIONS,
  generatedWorkflows: [],
  error: null
};
