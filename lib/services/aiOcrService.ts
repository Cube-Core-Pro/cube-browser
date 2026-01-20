/**
 * AI & OCR Services - AI training and OCR
 * 
 * @module aiOcrService
 */

import { invoke } from '@tauri-apps/api/core';

// AI Training
export interface TrainingData {
  id: string;
  type: 'click' | 'fill' | 'extract';
  selector: string;
  context: string;
  label: string;
  timestamp: number;
}

export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  dataCount: number;
  createdAt: number;
}

export async function captureTrainingData(type: string, selector: string, context: string, label: string): Promise<string> {
  return await invoke<string>('capture_training_data', { actionType: type, selector, context, label });
}

export async function getTrainingData(limit?: number): Promise<TrainingData[]> {
  return await invoke<TrainingData[]>('get_training_data', { limit });
}

export async function exportDataset(datasetId: string, format: 'json' | 'csv', outputPath: string): Promise<void> {
  await invoke<void>('export_training_dataset', { datasetId, format, outputPath });
}

export async function clearTrainingData(): Promise<void> {
  await invoke<void>('clear_training_data');
}

// OCR
export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export async function performOCR(imagePath: string, language?: string): Promise<OCRResult> {
  return await invoke<OCRResult>('perform_ocr', { imagePath, language });
}

export async function performOCRRegion(imagePath: string, x: number, y: number, width: number, height: number): Promise<string> {
  return await invoke<string>('perform_ocr_region', { imagePath, x, y, width, height });
}

export async function detectText(imagePath: string): Promise<OCRBlock[]> {
  return await invoke<OCRBlock[]>('detect_text_blocks', { imagePath });
}

export const aiOcrService = {
  captureTrainingData,
  getTrainingData,
  exportDataset,
  clearTrainingData,
  performOCR,
  performOCRRegion,
  detectText,
};

export default aiOcrService;
