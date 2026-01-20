'use client';

import React, { useState } from 'react';
import { 
  Download, 
  FileJson,
  FileSpreadsheet,
  FileText,
  Database,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  Settings,
  Filter,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  HardDrive,
  Archive,
  FolderOpen,
  Users,
  Activity,
  Shield,
  X,
  Info,
  Zap,
  Package
} from 'lucide-react';
import './data-export.css';

interface ExportJob {
  id: string;
  name: string;
  type: 'full' | 'partial' | 'scheduled';
  format: 'json' | 'csv' | 'xlsx' | 'xml';
  status: 'completed' | 'processing' | 'failed' | 'scheduled' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  scheduledAt?: string;
  fileSize?: string;
  recordCount?: number;
  downloadUrl?: string;
  error?: string;
  dataTypes: string[];
  progress?: number;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  lastUpdated: string;
  icon: React.ReactNode;
  selected: boolean;
}

const EXPORT_JOBS: ExportJob[] = [
  {
    id: 'exp-001',
    name: 'Full Account Export',
    type: 'full',
    format: 'json',
    status: 'completed',
    createdAt: '2025-01-29T10:30:00Z',
    completedAt: '2025-01-29T10:45:00Z',
    fileSize: '245 MB',
    recordCount: 156420,
    downloadUrl: '/exports/full-export-001.json',
    dataTypes: ['Users', 'Automations', 'Workflows', 'API Logs', 'Settings'],
  },
  {
    id: 'exp-002',
    name: 'Automation History Export',
    type: 'partial',
    format: 'csv',
    status: 'processing',
    createdAt: '2025-01-29T14:20:00Z',
    dataTypes: ['Automations', 'Execution Logs'],
    progress: 67,
  },
  {
    id: 'exp-003',
    name: 'Monthly User Data',
    type: 'scheduled',
    format: 'xlsx',
    status: 'scheduled',
    createdAt: '2025-01-15T00:00:00Z',
    scheduledAt: '2025-02-01T00:00:00Z',
    dataTypes: ['Users', 'Activity Logs'],
  },
  {
    id: 'exp-004',
    name: 'API Usage Report',
    type: 'partial',
    format: 'csv',
    status: 'completed',
    createdAt: '2025-01-28T16:00:00Z',
    completedAt: '2025-01-28T16:12:00Z',
    fileSize: '18 MB',
    recordCount: 42800,
    downloadUrl: '/exports/api-usage-004.csv',
    dataTypes: ['API Logs', 'Rate Limits'],
  },
  {
    id: 'exp-005',
    name: 'Failed Security Audit',
    type: 'partial',
    format: 'json',
    status: 'failed',
    createdAt: '2025-01-27T09:00:00Z',
    error: 'Timeout error: Export exceeded maximum duration',
    dataTypes: ['Security Logs', 'Audit Trail'],
  },
  {
    id: 'exp-006',
    name: 'Compliance Data Export',
    type: 'full',
    format: 'xml',
    status: 'completed',
    createdAt: '2025-01-25T11:30:00Z',
    completedAt: '2025-01-25T12:15:00Z',
    fileSize: '512 MB',
    recordCount: 285600,
    downloadUrl: '/exports/compliance-006.xml',
    dataTypes: ['All Data'],
  },
];

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'users',
    name: 'Users & Teams',
    description: 'User accounts, team memberships, roles and permissions',
    recordCount: 8432,
    lastUpdated: '2025-01-29T14:30:00Z',
    icon: <Users size={20} />,
    selected: false,
  },
  {
    id: 'automations',
    name: 'Automations',
    description: 'All automation workflows, triggers, and configurations',
    recordCount: 12450,
    lastUpdated: '2025-01-29T14:15:00Z',
    icon: <Zap size={20} />,
    selected: false,
  },
  {
    id: 'executions',
    name: 'Execution History',
    description: 'Automation run history and execution logs',
    recordCount: 456800,
    lastUpdated: '2025-01-29T14:35:00Z',
    icon: <Activity size={20} />,
    selected: false,
  },
  {
    id: 'api-logs',
    name: 'API Logs',
    description: 'API request and response logs',
    recordCount: 2847562,
    lastUpdated: '2025-01-29T14:35:00Z',
    icon: <Database size={20} />,
    selected: false,
  },
  {
    id: 'security',
    name: 'Security & Audit',
    description: 'Security events, audit logs, and compliance data',
    recordCount: 84200,
    lastUpdated: '2025-01-29T14:30:00Z',
    icon: <Shield size={20} />,
    selected: false,
  },
  {
    id: 'settings',
    name: 'Settings & Config',
    description: 'Account settings, integrations, and configurations',
    recordCount: 1250,
    lastUpdated: '2025-01-28T16:00:00Z',
    icon: <Settings size={20} />,
    selected: false,
  },
];

const FORMAT_OPTIONS = [
  { id: 'json', label: 'JSON', icon: FileJson, description: 'Structured data format' },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet compatible' },
  { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
  { id: 'xml', label: 'XML', icon: FileText, description: 'XML format' },
];

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function DataExportPage() {
  const [jobs] = useState<ExportJob[]>(EXPORT_JOBS);
  const [categories, setCategories] = useState<DataCategory[]>(DATA_CATEGORIES);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [showNewExportModal, setShowNewExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'exports' | 'schedule'>('exports');
  const [dateRange, setDateRange] = useState('all');

  const toggleCategory = (id: string) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, selected: !cat.selected } : cat
    ));
  };

  const selectAll = () => {
    setCategories(categories.map(cat => ({ ...cat, selected: true })));
  };

  const deselectAll = () => {
    setCategories(categories.map(cat => ({ ...cat, selected: false })));
  };

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const processingJobs = jobs.filter(j => j.status === 'processing');
  const scheduledJobs = jobs.filter(j => j.status === 'scheduled');

  return (
    <div className="data-export">
      {/* Header */}
      <header className="data-export__header">
        <div className="data-export__title-section">
          <div className="data-export__icon">
            <Download size={28} />
          </div>
          <div>
            <h1>Data Export</h1>
            <p>Export your data in various formats</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Settings size={18} />
            Settings
          </button>
          <button className="btn-primary" onClick={() => setShowNewExportModal(true)}>
            <Package size={18} />
            New Export
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="data-export__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Archive size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{jobs.length}</span>
            <span className="stat-label">Total Exports</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{completedJobs.length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon processing">
            <Loader2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{processingJobs.length}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon scheduled">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{scheduledJobs.length}</span>
            <span className="stat-label">Scheduled</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="data-export__tabs">
        <button 
          className={`tab-btn ${activeTab === 'exports' ? 'active' : ''}`}
          onClick={() => setActiveTab('exports')}
        >
          <Archive size={18} />
          Export History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={18} />
          Scheduled Exports
          <span className="tab-badge">{scheduledJobs.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="data-export__content">
        {activeTab === 'exports' && (
          <div className="exports-section">
            <div className="section-header">
              <h2>Export History</h2>
              <div className="filter-buttons">
                <button className="filter-btn active">All</button>
                <button className="filter-btn success">Completed</button>
                <button className="filter-btn warning">Processing</button>
                <button className="filter-btn danger">Failed</button>
              </div>
            </div>
            <div className="exports-list">
              {jobs.map(job => (
                <div key={job.id} className={`export-card ${job.status}`}>
                  <div className="export-main">
                    <div className={`export-icon ${job.format}`}>
                      {job.format === 'json' && <FileJson size={24} />}
                      {job.format === 'csv' && <FileSpreadsheet size={24} />}
                      {job.format === 'xlsx' && <FileSpreadsheet size={24} />}
                      {job.format === 'xml' && <FileText size={24} />}
                    </div>
                    <div className="export-info">
                      <div className="export-header">
                        <span className="export-name">{job.name}</span>
                        <span className={`status-badge ${job.status}`}>
                          {job.status === 'completed' && <CheckCircle size={12} />}
                          {job.status === 'processing' && <Loader2 size={12} className="spinning" />}
                          {job.status === 'failed' && <XCircle size={12} />}
                          {job.status === 'scheduled' && <Clock size={12} />}
                          {job.status === 'cancelled' && <XCircle size={12} />}
                          {job.status}
                        </span>
                      </div>
                      <div className="export-meta">
                        <span className="format-badge">{job.format.toUpperCase()}</span>
                        <span className="type-badge">{job.type}</span>
                        <span className="data-types">
                          {job.dataTypes.slice(0, 3).join(', ')}
                          {job.dataTypes.length > 3 && ` +${job.dataTypes.length - 3} more`}
                        </span>
                      </div>
                      {job.status === 'processing' && job.progress !== undefined && (
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                          <span className="progress-text">{job.progress}%</span>
                        </div>
                      )}
                      {job.status === 'failed' && job.error && (
                        <div className="error-message">
                          <AlertCircle size={14} />
                          {job.error}
                        </div>
                      )}
                      <div className="export-dates">
                        <span>Created {formatDate(job.createdAt)}</span>
                        {job.completedAt && (
                          <span>Completed {formatDate(job.completedAt)}</span>
                        )}
                        {job.scheduledAt && (
                          <span>Scheduled for {formatDate(job.scheduledAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="export-stats">
                    {job.fileSize && (
                      <div className="stat-item">
                        <HardDrive size={14} />
                        <span>{job.fileSize}</span>
                      </div>
                    )}
                    {job.recordCount && (
                      <div className="stat-item">
                        <Database size={14} />
                        <span>{formatNumber(job.recordCount)} records</span>
                      </div>
                    )}
                  </div>
                  <div className="export-actions">
                    {job.status === 'completed' && job.downloadUrl && (
                      <button className="action-btn primary">
                        <Download size={18} />
                      </button>
                    )}
                    {job.status === 'processing' && (
                      <button className="action-btn">
                        <Pause size={18} />
                      </button>
                    )}
                    {job.status === 'failed' && (
                      <button className="action-btn">
                        <RotateCcw size={18} />
                      </button>
                    )}
                    <button className="action-btn">
                      <Eye size={18} />
                    </button>
                    <button className="action-btn danger">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-section">
            <div className="section-header">
              <h2>Scheduled Exports</h2>
              <button className="btn-outline small">
                <Calendar size={16} />
                Create Schedule
              </button>
            </div>
            <div className="scheduled-list">
              {scheduledJobs.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>No Scheduled Exports</h3>
                  <p>Set up automated exports on a recurring schedule</p>
                  <button className="btn-primary">
                    <Calendar size={18} />
                    Create Schedule
                  </button>
                </div>
              ) : (
                scheduledJobs.map(job => (
                  <div key={job.id} className="schedule-card">
                    <div className="schedule-main">
                      <div className="schedule-icon">
                        <Calendar size={24} />
                      </div>
                      <div className="schedule-info">
                        <span className="schedule-name">{job.name}</span>
                        <span className="schedule-next">
                          Next run: {job.scheduledAt && formatDate(job.scheduledAt)}
                        </span>
                        <div className="schedule-meta">
                          <span>{job.format.toUpperCase()}</span>
                          <span>{job.dataTypes.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="schedule-actions">
                      <button className="action-btn">
                        <Play size={18} />
                      </button>
                      <button className="action-btn">
                        <Settings size={18} />
                      </button>
                      <button className="action-btn danger">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="storage-section">
        <div className="storage-header">
          <h2>Export Storage</h2>
          <button className="btn-text">
            Manage Storage
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="storage-info">
          <div className="storage-bar">
            <div className="storage-used" style={{ width: '35%' }}></div>
          </div>
          <div className="storage-stats">
            <span>1.2 GB used of 5 GB</span>
            <span>3.8 GB available</span>
          </div>
        </div>
        <div className="storage-tip">
          <Info size={14} />
          <span>Exports are automatically deleted after 30 days. Download important exports to keep them.</span>
        </div>
      </div>

      {/* New Export Modal */}
      {showNewExportModal && (
        <div className="modal-overlay" onClick={() => setShowNewExportModal(false)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <Package size={24} />
                </div>
                <h2>Create New Export</h2>
              </div>
              <button className="close-btn" onClick={() => setShowNewExportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Export Name */}
              <div className="form-group">
                <label>Export Name</label>
                <input 
                  type="text" 
                  placeholder="My Data Export"
                  defaultValue=""
                />
              </div>

              {/* Data Selection */}
              <div className="form-group">
                <div className="label-row">
                  <label>Select Data to Export</label>
                  <div className="selection-actions">
                    <button className="btn-text small" onClick={selectAll}>Select All</button>
                    <span>|</span>
                    <button className="btn-text small" onClick={deselectAll}>Deselect All</button>
                  </div>
                </div>
                <div className="data-categories">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`category-card ${category.selected ? 'selected' : ''}`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="category-icon">{category.icon}</div>
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <span className="category-desc">{category.description}</span>
                        <span className="category-count">{formatNumber(category.recordCount)} records</span>
                      </div>
                      <div className="category-checkbox">
                        {category.selected && <CheckCircle size={20} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div className="form-group">
                <label>Export Format</label>
                <div className="format-options">
                  {FORMAT_OPTIONS.map(format => (
                    <button
                      key={format.id}
                      className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <format.icon size={24} />
                      <span className="format-label">{format.label}</span>
                      <span className="format-desc">{format.description}</span>
                      {selectedFormat === format.id && <CheckCircle size={16} className="check" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="form-group">
                <label>Date Range</label>
                <div className="date-options">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: '90d', label: 'Last 90 Days' },
                    { id: '1y', label: 'Last Year' },
                    { id: 'custom', label: 'Custom Range' },
                  ].map(option => (
                    <button
                      key={option.id}
                      className={`date-option ${dateRange === option.id ? 'selected' : ''}`}
                      onClick={() => setDateRange(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="export-summary">
                <h3>Export Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Selected Categories</span>
                    <span className="summary-value">{categories.filter(c => c.selected).length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Estimated Records</span>
                    <span className="summary-value">
                      {formatNumber(categories.filter(c => c.selected).reduce((acc, c) => acc + c.recordCount, 0))}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Format</span>
                    <span className="summary-value">{selectedFormat.toUpperCase()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Estimated Size</span>
                    <span className="summary-value">~125 MB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowNewExportModal(false)}>
                Cancel
              </button>
              <button className="btn-outline">
                <Calendar size={18} />
                Schedule Export
              </button>
              <button 
                className="btn-primary"
                disabled={categories.filter(c => c.selected).length === 0}
              >
                <Download size={18} />
                Start Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
