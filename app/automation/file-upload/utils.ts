/**
 * 📁 FILE UPLOAD AUTOMATION - UTILITIES
 * 
 * Utility functions for parsing different file types
 * and extracting automation instructions.
 */

import {
  SupportedFileType,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  ParsedInstruction,
  InstructionAction,
  FileMetadata,
  ParsingOptions,
  DEFAULT_PARSING_OPTIONS
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// FILE TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

export function detectFileType(fileName: string, mimeType?: string): SupportedFileType | null {
  const extension = fileName.toLowerCase().split('.').pop();
  
  for (const [type, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
    if (extensions.some(ext => ext.slice(1) === extension)) {
      return type as SupportedFileType;
    }
  }
  
  if (mimeType) {
    for (const [type, mimes] of Object.entries(SUPPORTED_MIME_TYPES)) {
      if (mimes.includes(mimeType)) {
        return type as SupportedFileType;
      }
    }
  }
  
  return null;
}

export function isFileSupported(fileName: string, mimeType?: string): boolean {
  return detectFileType(fileName, mimeType) !== null;
}

export function getAcceptedFileTypes(): string {
  const allExtensions = Object.values(SUPPORTED_EXTENSIONS).flat();
  const allMimes = Object.values(SUPPORTED_MIME_TYPES).flat();
  return [...allExtensions, ...allMimes].join(',');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PARSING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const ACTION_KEYWORDS: Record<string, InstructionAction[]> = {
  // Navigation
  'go to': ['navigate'],
  'navigate': ['navigate'],
  'open': ['navigate'],
  'visit': ['navigate'],
  
  // Click actions
  'click': ['click'],
  'press': ['click'],
  'tap': ['click'],
  'select': ['click', 'select'],
  'choose': ['select'],
  
  // Type actions
  'type': ['type'],
  'enter': ['type'],
  'input': ['type'],
  'fill': ['type'],
  'write': ['type'],
  'paste': ['type'],
  
  // Upload/Download
  'upload': ['upload'],
  'download': ['download'],
  'attach': ['upload'],
  'save': ['download'],
  
  // Wait actions
  'wait': ['wait'],
  'pause': ['wait'],
  'delay': ['wait'],
  
  // Verify actions
  'verify': ['verify'],
  'check': ['verify'],
  'confirm': ['verify'],
  'ensure': ['verify'],
  
  // Scroll actions
  'scroll': ['scroll'],
  
  // Hover actions
  'hover': ['hover'],
  'mouse over': ['hover'],
  
  // Extract actions
  'extract': ['extract'],
  'copy': ['extract'],
  'get': ['extract']
};

export function detectActionFromText(text: string): InstructionAction | null {
  const lowerText = text.toLowerCase();
  
  for (const [keyword, actions] of Object.entries(ACTION_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return actions[0];
    }
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTION PARSING
// ═══════════════════════════════════════════════════════════════════════════

export function parseInstructionFromLine(
  line: string, 
  index: number,
  options: ParsingOptions = DEFAULT_PARSING_OPTIONS
): ParsedInstruction | null {
  const trimmedLine = line.trim();
  
  // Skip empty lines or comments
  if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
    return null;
  }
  
  // Try to detect action
  const action = detectActionFromText(trimmedLine);
  if (!action) {
    return null;
  }
  
  // Extract target (text in quotes or after specific keywords)
  const quotedMatch = trimmedLine.match(/"([^"]+)"|'([^']+)'/);
  const target = quotedMatch ? (quotedMatch[1] || quotedMatch[2]) : undefined;
  
  // Extract selector (CSS-like patterns)
  let selector: string | undefined;
  if (options.detectSelectors) {
    const selectorMatch = trimmedLine.match(/\[([^\]]+)\]|#[\w-]+|\.[\w-]+/);
    selector = selectorMatch ? selectorMatch[0] : undefined;
  }
  
  // Calculate confidence based on matches
  let confidence = 0.5;
  if (action) confidence += 0.2;
  if (target) confidence += 0.2;
  if (selector) confidence += 0.1;
  
  return {
    id: `inst-${index}`,
    order: index,
    action,
    target,
    selector,
    description: trimmedLine,
    confidence: Math.min(confidence, 1.0),
    isOptional: trimmedLine.toLowerCase().includes('optional')
  };
}

export function parseTextContent(
  content: string,
  options: ParsingOptions = DEFAULT_PARSING_OPTIONS
): ParsedInstruction[] {
  const lines = content.split('\n');
  const instructions: ParsedInstruction[] = [];
  
  let order = 0;
  for (const line of lines) {
    const instruction = parseInstructionFromLine(line, order, options);
    if (instruction && instruction.confidence >= options.confidenceThreshold) {
      instructions.push(instruction);
      order++;
      
      if (instructions.length >= options.maxInstructions) {
        break;
      }
    }
  }
  
  return instructions;
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV PARSING
// ═══════════════════════════════════════════════════════════════════════════

export function parseCSVContent(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function csvToInstructions(
  headers: string[],
  rows: string[][],
  options: ParsingOptions = DEFAULT_PARSING_OPTIONS
): ParsedInstruction[] {
  const instructions: ParsedInstruction[] = [];
  
  // Try to find action, target, selector columns
  const actionCol = headers.findIndex(h => 
    ['action', 'step', 'command', 'type'].includes(h.toLowerCase())
  );
  const targetCol = headers.findIndex(h => 
    ['target', 'element', 'field', 'name'].includes(h.toLowerCase())
  );
  const valueCol = headers.findIndex(h => 
    ['value', 'input', 'data', 'text'].includes(h.toLowerCase())
  );
  const selectorCol = headers.findIndex(h => 
    ['selector', 'css', 'xpath', 'locator'].includes(h.toLowerCase())
  );
  
  let order = 0;
  for (const row of rows) {
    if (row.length === 0) continue;
    
    const actionText = actionCol >= 0 ? row[actionCol] : row[0];
    const action = detectActionFromText(actionText);
    
    if (!action) continue;
    
    instructions.push({
      id: `csv-${order}`,
      order,
      action,
      target: targetCol >= 0 ? row[targetCol] : undefined,
      value: valueCol >= 0 ? row[valueCol] : undefined,
      selector: selectorCol >= 0 ? row[selectorCol] : undefined,
      description: row.join(' | '),
      confidence: 0.8
    });
    
    order++;
    if (order >= options.maxInstructions) break;
  }
  
  return instructions;
}

// ═══════════════════════════════════════════════════════════════════════════
// METADATA EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export function extractTextMetadata(content: string): FileMetadata {
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  return {
    wordCount: words.length,
    rowCount: lines.length
  };
}

export function extractCSVMetadata(headers: string[], rows: string[][]): FileMetadata {
  return {
    columnCount: headers.length,
    rowCount: rows.length
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateWorkflowId(): string {
  return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
