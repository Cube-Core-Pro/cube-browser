/**
 * Document Services - Document extraction and file detection
 * 
 * @module documentService
 */

import { invoke } from '@tauri-apps/api/core';

// Document Extraction
export interface ExtractionSchema {
  name: string;
  fields: Record<string, FieldDefinition>;
}

export interface FieldDefinition {
  selector: string;
  type: 'text' | 'number' | 'date' | 'url' | 'array';
  required: boolean;
  transform?: string;
}

export interface ExtractedData {
  schema: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export async function extractData(url: string, schema: ExtractionSchema): Promise<ExtractedData> {
  return await invoke<ExtractedData>('extract_data_from_page', { url, schema });
}

export async function detectStructure(url: string): Promise<ExtractionSchema> {
  return await invoke<ExtractionSchema>('detect_page_structure', { url });
}

// File Detection
export interface DetectedFile {
  url: string;
  filename: string;
  type: string;
  size?: number;
  downloadable: boolean;
}

export async function detectFiles(url: string): Promise<DetectedFile[]> {
  return await invoke<DetectedFile[]>('detect_files_on_page', { url });
}

export async function downloadDetectedFile(fileUrl: string, savePath: string): Promise<void> {
  await invoke<void>('download_detected_file', { fileUrl, savePath });
}

export const documentService = {
  extractData,
  detectStructure,
  detectFiles,
  downloadDetectedFile,
};

export default documentService;
