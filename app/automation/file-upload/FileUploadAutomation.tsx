"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');

/**
 * 📁 FILE UPLOAD AUTOMATION - COMPONENT
 * 
 * React component for uploading files with automation instructions
 * (PDF, TXT, DOCX, Excel, CSV).
 */


import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  List,
  Zap,
  X
} from 'lucide-react';
import {
  ParsedFile,
  ParsedInstruction,
  ParsingOptions,
  DEFAULT_PARSING_OPTIONS,
  FILE_TYPE_ICONS,
  InstructionAction
} from './types';
import {
  detectFileType,
  getAcceptedFileTypes,
  parseTextContent,
  parseCSVContent,
  csvToInstructions,
  extractTextMetadata,
  extractCSVMetadata,
  generateFileId,
  formatFileSize,
  formatConfidence
} from './utils';
import './FileUploadAutomation.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface FileUploadAutomationProps {
  onWorkflowGenerated?: (instructions: ParsedInstruction[], fileName: string) => void;
  onError?: (error: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const FileUploadAutomation: React.FC<FileUploadAutomationProps> = ({
  onWorkflowGenerated,
  onError
}) => {
  // State
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [options, setOptions] = useState<ParsingOptions>(DEFAULT_PARSING_OPTIONS);
  const [showOptions, setShowOptions] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get selected file
  const selectedFile = files.find(f => f.id === selectedFileId);

  // Handle file selection
  const handleFileSelect = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: ParsedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileType = detectFileType(file.name, file.type);

      if (!fileType) {
        onError?.(`Unsupported file type: ${file.name}`);
        continue;
      }

      const parsedFile: ParsedFile = {
        id: generateFileId(),
        fileName: file.name,
        fileType,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        instructions: [],
        metadata: {}
      };

      newFiles.push(parsedFile);

      // Read file content
      try {
        const content = await readFileContent(file);
        parsedFile.rawContent = content;
        
        // Parse based on file type
        await parseFileContent(parsedFile, content);
      } catch (error) {
        parsedFile.status = 'error';
        parsedFile.error = error instanceof Error ? error.message : 'Failed to read file';
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0 && !selectedFileId) {
      setSelectedFileId(newFiles[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileId, onError]);

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Parse file content
  const parseFileContent = async (parsedFile: ParsedFile, content: string) => {
    parsedFile.status = 'parsing';
    
    try {
      switch (parsedFile.fileType) {
        case 'txt':
          parsedFile.instructions = parseTextContent(content, options);
          parsedFile.metadata = extractTextMetadata(content);
          break;
          
        case 'csv':
          const { headers, rows } = parseCSVContent(content);
          parsedFile.instructions = csvToInstructions(headers, rows, options);
          parsedFile.metadata = extractCSVMetadata(headers, rows);
          break;
          
        case 'pdf':
        case 'docx':
        case 'xlsx':
        case 'xls':
          // Backend document processing via Tauri
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const documentResult = await invoke<{ text: string; metadata: Record<string, unknown> }>('parse_document', {
              content: content,
              fileType: parsedFile.fileType,
              fileName: parsedFile.fileName
            });
            
            // Parse extracted text into instructions
            const lines = documentResult.text.split('\n').filter((line: string) => line.trim());
            parsedFile.instructions = lines.map((line: string, index: number): ParsedInstruction => ({
              id: `inst-${Date.now()}-${index}`,
              order: index + 1,
              action: 'type' as InstructionAction,
              target: '',
              value: line.trim(),
              description: `Line ${index + 1}: ${line.trim().substring(0, 50)}${line.length > 50 ? '...' : ''}`,
              confidence: 0.8
            }));
            
            const metaPageCount = typeof documentResult.metadata.pageCount === 'number' 
              ? documentResult.metadata.pageCount : 1;
            const metaAuthor = typeof documentResult.metadata.author === 'string'
              ? documentResult.metadata.author : undefined;
            
            parsedFile.metadata = {
              wordCount: documentResult.text.split(/\s+/).length,
              pageCount: metaPageCount,
              author: metaAuthor
            };
          } catch (backendError) {
            // Fallback: Extract basic text if backend unavailable
            log.warn('Backend parsing unavailable, using fallback:', backendError);
            const textContent = content || '';
            parsedFile.instructions = textContent.split('\n')
              .filter((line: string) => line.trim())
              .slice(0, 100)
              .map((line: string, index: number): ParsedInstruction => ({
                id: `inst-${Date.now()}-${index}`,
                order: index + 1,
                action: 'type' as InstructionAction,
                target: '',
                value: line.trim(),
                description: `Extracted line ${index + 1}`,
                confidence: 0.6
              }));
            parsedFile.metadata = { wordCount: textContent.split(/\s+/).length };
          }
          break;
      }
      
      parsedFile.status = 'parsed';
      parsedFile.parsedAt = new Date().toISOString();
    } catch (error) {
      parsedFile.status = 'error';
      parsedFile.error = error instanceof Error ? error.message : 'Parsing failed';
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
  }, [selectedFileId]);

  // Generate workflow from selected file
  const generateWorkflow = useCallback(() => {
    if (!selectedFile || selectedFile.instructions.length === 0) return;
    onWorkflowGenerated?.(selectedFile.instructions, selectedFile.fileName);
  }, [selectedFile, onWorkflowGenerated]);

  // Toggle option
  const toggleOption = useCallback((key: keyof ParsingOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="file-upload-automation">
      {/* Header */}
      <div className="file-upload-header">
        <div>
          <h2>📁 File Upload Automation</h2>
          <p>Upload instructions in PDF, TXT, DOCX, Excel, or CSV</p>
        </div>
        <button 
          className="btn-upload secondary"
          onClick={() => setShowOptions(!showOptions)}
          title="Toggle parsing options"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="options-panel">
          <div className="options-row">
            <div className="option-item">
              <span className="option-label">Use AI</span>
              <div 
                className={`option-toggle ${options.useAI ? 'active' : ''}`}
                onClick={() => toggleOption('useAI')}
              />
            </div>
            <div className="option-item">
              <span className="option-label">Detect Selectors</span>
              <div 
                className={`option-toggle ${options.detectSelectors ? 'active' : ''}`}
                onClick={() => toggleOption('detectSelectors')}
              />
            </div>
            <div className="option-item">
              <span className="option-label">Detect Actions</span>
              <div 
                className={`option-toggle ${options.detectActions ? 'active' : ''}`}
                onClick={() => toggleOption('detectActions')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="drop-zone-icon" />
        <div className="drop-zone-title">
          Drop files here or click to upload
        </div>
        <div className="drop-zone-subtitle">
          Supports automation instructions in multiple formats
        </div>
        <div className="drop-zone-formats">
          {Object.entries(FILE_TYPE_ICONS).map(([type, icon]) => (
            <span key={type} className="format-badge">
              <span className="format-badge-icon">{icon}</span>
              {type.toUpperCase()}
            </span>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptedFileTypes()}
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
          aria-label="Upload automation files"
        />
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="files-section">
          <div className="files-section-header">
            <span className="files-section-title">
              <FileText className="w-4 h-4" />
              Uploaded Files ({files.length})
            </span>
          </div>
          <div className="files-list">
            {files.map(file => (
              <div
                key={file.id}
                className={`file-item ${selectedFileId === file.id ? 'selected' : ''} ${file.status}`}
                onClick={() => setSelectedFileId(file.id)}
              >
                <div className="file-icon">
                  {FILE_TYPE_ICONS[file.fileType]}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.fileName}</div>
                  <div className="file-meta">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>{file.fileType.toUpperCase()}</span>
                    {file.instructions.length > 0 && (
                      <span>{file.instructions.length} instructions</span>
                    )}
                  </div>
                  <div className={`file-status ${file.status}`}>
                    {file.status === 'pending' && <><AlertCircle className="w-3 h-3" /> Pending</>}
                    {file.status === 'parsing' && <><Loader2 className="w-3 h-3 animate-spin" /> Parsing...</>}
                    {file.status === 'parsed' && <><CheckCircle className="w-3 h-3" /> Parsed</>}
                    {file.status === 'error' && <><X className="w-3 h-3" /> {file.error}</>}
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="file-action-btn danger"
                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions Panel */}
      {selectedFile && selectedFile.instructions.length > 0 && (
        <div className="instructions-panel">
          <div className="instructions-header">
            <span className="instructions-title">
              <List className="w-4 h-4" />
              Parsed Instructions
            </span>
            <span className="instructions-count">
              {selectedFile.instructions.length} steps
            </span>
          </div>
          <div className="instructions-list">
            {selectedFile.instructions.map((inst, idx) => (
              <div key={inst.id} className="instruction-item">
                <div className="instruction-number">{idx + 1}</div>
                <div className="instruction-content">
                  <span className="instruction-action">{inst.action}</span>
                  <div className="instruction-desc">{inst.description}</div>
                  <div className="instruction-confidence">
                    Confidence: {formatConfidence(inst.confidence)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No files uploaded</div>
          <div className="empty-state-desc">
            Upload a file with automation instructions to get started
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="upload-actions">
          <button
            className="btn-upload secondary"
            onClick={() => setFiles([])}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <button
            className="btn-upload success"
            onClick={generateWorkflow}
            disabled={!selectedFile || selectedFile.instructions.length === 0}
          >
            <Zap className="w-4 h-4" />
            Generate Workflow
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadAutomation;
