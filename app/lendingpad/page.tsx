"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


/**
 * 🏦 LENDINGPAD AUTOMATION PAGE
 * 
 * Enterprise-grade LendingPad document automation:
 * - Document detection (4 methods)
 * - Batch PDF downloads
 * - OCR data extraction
 * - Auto-fill forms
 * - Data validation
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AppLayout } from '@/components/layout';
import { 
  FileBox, 
  Download, 
  FileText, 
  PenTool, 
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Square,
  Database,
  Shield,
  Loader2,
  Trash2,
  Settings,
  LogIn,
  LogOut,
  User,
  Building2
} from 'lucide-react';
import { FigureWorkflowPanel } from './figure-workflow/FigureWorkflowPanel';
import { WorkflowStep } from './figure-workflow/types';
import './lendingpad.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LendingPadDocument {
  id: string;
  name: string;
  doc_type: string;
  url?: string;
  download_url?: string;
  file_path?: string;
  detection_method: string;
  status: 'detected' | 'downloading' | 'downloaded' | 'processing' | 'extracted' | 'error';
  metadata: Record<string, string>;
}

interface DetectionResult {
  documents: LendingPadDocument[];
  total_count: number;
  methods_used: string[];
  errors: Array<{ method: string; error: string; timestamp: string }>;
  timestamp: string;
}

interface DownloadBatch {
  batch_id: string;
  documents: LendingPadDocument[];
  total: number;
  downloaded: number;
  failed: number;
  status: 'pending' | 'inprogress' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
}

interface ExtractedData {
  document_id: string;
  document_name: string;
  loan_number?: string;
  borrower_name?: string;
  property_address?: string;
  loan_amount?: string;
  interest_rate?: string;
  closing_date?: string;
  fields: Record<string, string>;
  confidence: number;
  extraction_method: string;
}

interface ValidationResult {
  is_valid: boolean;
  errors: Array<{ field: string; error_type: string; message: string }>;
  warnings: string[];
  confidence_score: number;
}

interface LendingPadSession {
  username: string;
  session_token: string;
  expires_at: number;
  company_id?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ icon, label, value, color = 'blue', trend }: StatCardProps) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      {trend && (
        <div className={`stat-trend trend-${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LendingPadPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'detect' | 'download' | 'extract' | 'autofill' | 'auth' | 'figure'>('detect');
  
  // Auth state
  const [session, setSession] = useState<LendingPadSession | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', companyId: '', rememberMe: true });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Document state
  const [documents, setDocuments] = useState<LendingPadDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  
  // Download state
  const [currentBatch, setCurrentBatch] = useState<DownloadBatch | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Extraction state
  const [extractedData, setExtractedData] = useState<Map<string, ExtractedData>>(new Map());
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [isExtracting, setIsExtracting] = useState<string | null>(null);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════
  // AUTH HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const existingSession = await invoke<LendingPadSession | null>('lendingpad_get_session');
      if (existingSession) {
        const isValid = await invoke<boolean>('lendingpad_check_session');
        if (isValid) {
          setSession(existingSession);
        }
      }
    } catch (_err) {
      log.debug('No existing session');
    }
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError('Username and password are required');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const result = await invoke<{ success: boolean; session?: LendingPadSession; error?: string }>(
        'lendingpad_login_credentials',
        {
          username: loginForm.username,
          password: loginForm.password,
          companyId: loginForm.companyId || null,
          rememberMe: loginForm.rememberMe
        }
      );

      if (result.success && result.session) {
        setSession(result.session);
        setSuccess('✅ Logged in successfully');
        setActiveTab('detect');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(`Login error: ${err}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await invoke('lendingpad_logout');
      setSession(null);
      setSuccess('Logged out successfully');
    } catch (err) {
      setError(`Logout error: ${err}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DETECTION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleDetectDocuments = async () => {
    setIsDetecting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await invoke<DetectionResult>('detect_lendingpad_documents');
      setDetectionResult(result);
      setDocuments(result.documents);
      setSuccess(`✅ Detected ${result.total_count} documents using ${result.methods_used.length} methods`);
      
      if (result.errors.length > 0) {
        log.warn('Detection errors:', result.errors);
      }
    } catch (err) {
      setError(`Detection error: ${err}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const selectAllDocuments = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DOWNLOAD HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleStartBatchDownload = async () => {
    if (selectedDocs.size === 0) {
      setError('Select at least one document to download');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const batch = await invoke<DownloadBatch>('start_batch_download', {
        documentIds: Array.from(selectedDocs)
      });
      setCurrentBatch(batch);
      setSuccess(`📥 Download started: ${batch.total} documents`);

      // Poll batch status
      const interval = setInterval(async () => {
        try {
          const status = await invoke<DownloadBatch>('get_batch_status', {
            batchId: batch.batch_id
          });
          setCurrentBatch(status);
          setDownloadProgress((status.downloaded / status.total) * 100);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            if (status.status === 'completed') {
              setSuccess(`✅ Download completed: ${status.downloaded}/${status.total} documents`);
              // Update document statuses
              const updatedDocs = documents.map(doc => 
                selectedDocs.has(doc.id) ? { ...doc, status: 'downloaded' as const } : doc
              );
              setDocuments(updatedDocs);
            } else {
              setError(`❌ Download failed: ${status.failed} errors`);
            }
          }
        } catch (err) {
          clearInterval(interval);
          log.error('Error polling batch status:', err);
        }
      }, 2000);
    } catch (err) {
      setError(`Download error: ${err}`);
    }
  };

  const handleCancelBatchDownload = async () => {
    if (!currentBatch) return;

    try {
      await invoke('cancel_batch_download', {
        batchId: currentBatch.batch_id
      });
      setSuccess('❌ Download cancelled');
      setCurrentBatch(null);
      setDownloadProgress(0);
    } catch (err) {
      setError(`Cancel error: ${err}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // EXTRACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleExtractData = async (docId: string) => {
    setIsExtracting(docId);
    setError(null);
    
    try {
      const data = await invoke<ExtractedData>('extract_document_data', {
        documentId: docId
      });
      
      const newExtractedData = new Map(extractedData);
      newExtractedData.set(docId, data);
      setExtractedData(newExtractedData);

      // Auto-validate after extraction
      await handleValidateData(docId);
      
      setSuccess(`✅ Data extracted from ${data.document_name}`);
    } catch (err) {
      setError(`Extraction error: ${err}`);
    } finally {
      setIsExtracting(null);
    }
  };

  const handleValidateData = async (docId: string) => {
    try {
      const validation = await invoke<ValidationResult>('validate_extracted_data', {
        documentId: docId
      });
      
      const newValidations = new Map(validationResults);
      newValidations.set(docId, validation);
      setValidationResults(newValidations);
    } catch (err) {
      log.error('Validation error:', err);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // AUTOFILL HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleAutofill = async (docId: string) => {
    setError(null);

    try {
      const result = await invoke('autofill_form', {
        documentId: docId,
        formSelector: '#lendingpad-form'
      });
      setSuccess(`✅ Form auto-filled successfully`);
      log.debug('Autofill result:', result);
    } catch (err) {
      setError(`Autofill error: ${err}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  const clearState = async () => {
    try {
      await invoke('clear_lendingpad_state');
      setDocuments([]);
      setSelectedDocs(new Set());
      setDetectionResult(null);
      setCurrentBatch(null);
      setExtractedData(new Map());
      setValidationResults(new Map());
      setSuccess('State cleared');
    } catch (err) {
      setError(`Clear error: ${err}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected': return <Search className="w-4 h-4 text-blue-500" />;
      case 'downloading': return <Download className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'downloaded': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />;
      case 'extracted': return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <FileBox className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, { icon: string; label: string }> = {
      download_buttons: { icon: '📥', label: 'Download Buttons' },
      angular_scope: { icon: '⚙️', label: 'Angular Scope' },
      dropdowns: { icon: '📋', label: 'Dropdowns' },
      figure: { icon: '🏢', label: 'FIGURE' }
    };
    return labels[method] || { icon: '📄', label: method };
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <AppLayout tier="elite">
      <div className="lendingpad-page">
      {/* Header */}
      <header className="lendingpad-header">
        <div className="header-left">
          <FileBox className="w-8 h-8 text-blue-500" />
          <div>
            <h1>LendingPad Automation</h1>
            <p>Enterprise Document Processing</p>
          </div>
        </div>
        <div className="header-right">
          {session ? (
            <div className="session-info">
              <User className="w-4 h-4" />
              <span>{session.username}</span>
              <button onClick={handleLogout} className="btn-icon" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setActiveTab('auth')} className="btn-secondary">
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}
          <button onClick={clearState} className="btn-icon" title="Clear State">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="btn-icon" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Stats Dashboard */}
      <section className="stats-dashboard">
        <StatCard 
          icon={<FileBox className="w-5 h-5" />} 
          label="Documents Detected" 
          value={documents.length}
          color="blue"
        />
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          label="Downloaded" 
          value={documents.filter(d => d.status === 'downloaded').length}
          color="green"
        />
        <StatCard 
          icon={<FileText className="w-5 h-5" />} 
          label="Extracted" 
          value={extractedData.size}
          color="purple"
        />
        <StatCard 
          icon={<Shield className="w-5 h-5" />} 
          label="Validated" 
          value={validationResults.size}
          color="emerald"
        />
      </section>

      {/* Messages */}
      {error && (
        <div className="message error">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="message success">
          <CheckCircle2 className="w-5 h-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <nav className="tabs-nav">
        <button
          className={`tab ${activeTab === 'detect' ? 'active' : ''}`}
          onClick={() => setActiveTab('detect')}
        >
          <Search className="w-4 h-4" />
          Detect
        </button>
        <button
          className={`tab ${activeTab === 'download' ? 'active' : ''}`}
          onClick={() => setActiveTab('download')}
          disabled={documents.length === 0}
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          className={`tab ${activeTab === 'extract' ? 'active' : ''}`}
          onClick={() => setActiveTab('extract')}
          disabled={documents.filter(d => d.status === 'downloaded').length === 0}
        >
          <FileText className="w-4 h-4" />
          Extract
        </button>
        <button
          className={`tab ${activeTab === 'autofill' ? 'active' : ''}`}
          onClick={() => setActiveTab('autofill')}
          disabled={extractedData.size === 0}
        >
          <PenTool className="w-4 h-4" />
          Auto-fill
        </button>
        <button
          className={`tab ${activeTab === 'figure' ? 'active' : ''}`}
          onClick={() => setActiveTab('figure')}
        >
          <Building2 className="w-4 h-4" />
          FIGURE
        </button>
        <button
          className={`tab ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          <User className="w-4 h-4" />
          Auth
        </button>
      </nav>

      {/* Tab Content */}
      <main className="tab-content">
        {/* AUTH TAB */}
        {activeTab === 'auth' && (
          <div className="auth-tab">
            <div className="auth-card">
              <h2>LendingPad Login</h2>
              <p>Connect to your LendingPad account for automation</p>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter username"
                  disabled={isLoggingIn}
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                  disabled={isLoggingIn}
                />
              </div>
              
              <div className="form-group">
                <label>Company ID (Optional)</label>
                <input
                  type="text"
                  value={loginForm.companyId}
                  onChange={(e) => setLoginForm({ ...loginForm, companyId: e.target.value })}
                  placeholder="Enter company ID"
                  disabled={isLoggingIn}
                />
              </div>
              
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                  disabled={isLoggingIn}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              
              <button
                className="btn-primary full-width"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Login
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* DETECT TAB */}
        {activeTab === 'detect' && (
          <div className="detect-tab">
            <div className="section-header">
              <h2>Document Detection</h2>
              <button
                className="btn-primary"
                onClick={handleDetectDocuments}
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Detect Documents
                  </>
                )}
              </button>
            </div>

            {detectionResult && (
              <div className="detection-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Total Found:</span>
                    <span className="value">{detectionResult.total_count}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Methods Used:</span>
                    <div className="methods-list">
                      {detectionResult.methods_used.map(m => {
                        const { icon, label } = getMethodLabel(m);
                        return (
                          <span key={m} className="method-badge">
                            {icon} {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {detectionResult.errors.length > 0 && (
                    <div className="info-item warning">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{detectionResult.errors.length} detection methods failed</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {documents.length > 0 && (
              <>
                <div className="documents-toolbar">
                  <button className="btn-secondary" onClick={selectAllDocuments}>
                    {selectedDocs.size === documents.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selection-count">
                    {selectedDocs.size} of {documents.length} selected
                  </span>
                </div>

                <div className="documents-grid">
                  {documents.map(doc => (
                    <div 
                      key={doc.id} 
                      className={`document-card ${selectedDocs.has(doc.id) ? 'selected' : ''}`}
                      onClick={() => toggleDocumentSelection(doc.id)}
                    >
                      <div className="doc-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleDocumentSelection(doc.id);
                          }}
                          aria-label={`Select ${doc.name}`}
                          title={`Select ${doc.name}`}
                        />
                      </div>
                      <div className="doc-icon">
                        {getStatusIcon(doc.status)}
                      </div>
                      <div className="doc-info">
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-meta">
                          <span className="doc-type">{doc.doc_type}</span>
                          <span className="doc-method">
                            {getMethodLabel(doc.detection_method).icon}
                          </span>
                        </div>
                      </div>
                      <div className="doc-status">
                        <span className={`status-badge status-${doc.status}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {documents.length === 0 && !isDetecting && (
              <div className="empty-state">
                <FileBox className="w-16 h-16 text-gray-300" />
                <h3>No Documents Detected</h3>
                <p>Click &quot;Detect Documents&quot; to scan for LendingPad documents</p>
              </div>
            )}
          </div>
        )}

        {/* DOWNLOAD TAB */}
        {activeTab === 'download' && (
          <div className="download-tab">
            <div className="section-header">
              <h2>Batch Download</h2>
              <div className="button-group">
                <button
                  className="btn-primary"
                  onClick={handleStartBatchDownload}
                  disabled={selectedDocs.size === 0 || currentBatch?.status === 'inprogress'}
                >
                  <Download className="w-4 h-4" />
                  Download ({selectedDocs.size})
                </button>
                {currentBatch?.status === 'inprogress' && (
                  <button className="btn-danger" onClick={handleCancelBatchDownload}>
                    <Square className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {currentBatch && (
              <div className="batch-status">
                <div className="status-header">
                  <h3>Download Progress</h3>
                  <span className={`status-badge status-${currentBatch.status}`}>
                    {currentBatch.status}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill progress-dynamic"
                    style={{ '--progress-width': `${downloadProgress}%` } as React.CSSProperties}
                  />
                </div>
                <div className="progress-stats">
                  <span className="stat-green">
                    <CheckCircle2 className="w-4 h-4" />
                    Downloaded: {currentBatch.downloaded}
                  </span>
                  <span className="stat-red">
                    <XCircle className="w-4 h-4" />
                    Failed: {currentBatch.failed}
                  </span>
                  <span className="stat-gray">
                    <Database className="w-4 h-4" />
                    Total: {currentBatch.total}
                  </span>
                </div>
              </div>
            )}

            <div className="selected-list">
              <h3>Selected Documents ({selectedDocs.size})</h3>
              {documents.filter(d => selectedDocs.has(d.id)).map(doc => (
                <div key={doc.id} className="selected-item">
                  {getStatusIcon(doc.status)}
                  <span>{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXTRACT TAB */}
        {activeTab === 'extract' && (
          <div className="extract-tab">
            <div className="section-header">
              <h2>Data Extraction</h2>
            </div>

            <div className="extraction-list">
              {documents.filter(d => d.status === 'downloaded').map(doc => {
                const data = extractedData.get(doc.id);
                const validation = validationResults.get(doc.id);

                return (
                  <div key={doc.id} className="extraction-card">
                    <div className="extraction-header">
                      <div className="doc-info">
                        {getStatusIcon(data ? 'extracted' : doc.status)}
                        <span className="doc-name">{doc.name}</span>
                      </div>
                      {!data ? (
                        <button
                          className="btn-primary"
                          onClick={() => handleExtractData(doc.id)}
                          disabled={isExtracting === doc.id}
                        >
                          {isExtracting === doc.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Extract Data
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="confidence-badge">
                          {Math.round(data.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>

                    {data && (
                      <div className="extracted-data">
                        <div className="data-grid">
                          {data.loan_number && (
                            <div className="data-field">
                              <label>Loan Number</label>
                              <span>{data.loan_number}</span>
                            </div>
                          )}
                          {data.borrower_name && (
                            <div className="data-field">
                              <label>Borrower</label>
                              <span>{data.borrower_name}</span>
                            </div>
                          )}
                          {data.property_address && (
                            <div className="data-field">
                              <label>Property</label>
                              <span>{data.property_address}</span>
                            </div>
                          )}
                          {data.loan_amount && (
                            <div className="data-field">
                              <label>Amount</label>
                              <span>{data.loan_amount}</span>
                            </div>
                          )}
                          {data.interest_rate && (
                            <div className="data-field">
                              <label>Interest Rate</label>
                              <span>{data.interest_rate}</span>
                            </div>
                          )}
                          {data.closing_date && (
                            <div className="data-field">
                              <label>Closing Date</label>
                              <span>{data.closing_date}</span>
                            </div>
                          )}
                        </div>

                        {validation && !validation.is_valid && (
                          <div className="validation-errors">
                            <h4>
                              <AlertTriangle className="w-4 h-4" />
                              Validation Errors
                            </h4>
                            {validation.errors.map((err, idx) => (
                              <div key={idx} className="error-item">
                                <strong>{err.field}:</strong> {err.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AUTOFILL TAB */}
        {activeTab === 'autofill' && (
          <div className="autofill-tab">
            <div className="section-header">
              <h2>Auto-fill Forms</h2>
            </div>

            <div className="autofill-list">
              {Array.from(extractedData.entries()).map(([docId, data]) => {
                const validation = validationResults.get(docId);

                return (
                  <div key={docId} className="autofill-card">
                    <div className="autofill-header">
                      <span className="doc-name">{data.document_name}</span>
                      <button
                        className="btn-primary"
                        onClick={() => handleAutofill(docId)}
                        disabled={validation && !validation.is_valid}
                      >
                        <PenTool className="w-4 h-4" />
                        Auto-fill Form
                      </button>
                    </div>

                    <div className="autofill-preview">
                      <div className="preview-row">
                        <FileBox className="w-4 h-4" />
                        <label>Loan:</label>
                        <span>{data.loan_number || 'N/A'}</span>
                      </div>
                      <div className="preview-row">
                        <User className="w-4 h-4" />
                        <label>Borrower:</label>
                        <span>{data.borrower_name || 'N/A'}</span>
                      </div>
                      <div className="preview-row">
                        <Database className="w-4 h-4" />
                        <label>Property:</label>
                        <span>{data.property_address || 'N/A'}</span>
                      </div>
                      <div className="preview-row">
                        <Shield className="w-4 h-4" />
                        <label>Amount:</label>
                        <span>{data.loan_amount || 'N/A'}</span>
                      </div>
                    </div>

                    {validation && validation.warnings.length > 0 && (
                      <div className="validation-warnings">
                        {validation.warnings.map((warning, idx) => (
                          <div key={idx} className="warning-item">
                            <AlertTriangle className="w-4 h-4" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FIGURE WORKFLOW TAB */}
        {activeTab === 'figure' && (
          <div className="figure-tab">
            <FigureWorkflowPanel
              onStepExecute={async (step: WorkflowStep) => {
                log.debug(`Executing step: ${step.id} ${step.title}`);
                // Here we would integrate with the Chrome Extension
                // to actually perform the automation steps
                return true;
              }}
              onWorkflowComplete={() => {
                setSuccess('🎉 FIGURE workflow completed! Ready for compensation request submission.');
              }}
              onError={(error: string, stepId: number) => {
                setError(`Step ${stepId} failed: ${error}`);
              }}
              initialDocuments={documents.map(d => d.doc_type)}
            />
          </div>
        )}
      </main>
    </div>
    </AppLayout>
  );
}
