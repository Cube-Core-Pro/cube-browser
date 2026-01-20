'use client';

import React, { useState } from 'react';
import { 
  Layers,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Download,
  Upload,
  Settings,
  Filter,
  Search,
  RefreshCw,
  MoreHorizontal,
  X,
  Calendar,
  Users,
  Zap,
  Database,
  FileText,
  Mail,
  Tag,
  Archive,
  FolderOpen,
  CheckSquare,
  Square as SquareEmpty,
  ArrowRight,
  Boxes,
  Activity,
  Target,
  BarChart3,
  List
} from 'lucide-react';
import './batch-operations.css';

interface BatchOperation {
  id: string;
  name: string;
  type: 'automation' | 'user' | 'data' | 'workflow' | 'export';
  action: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'queued';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  estimatedTime?: string;
  createdBy: string;
}

interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  type: 'automation' | 'user' | 'data' | 'workflow';
  icon: React.ReactNode;
  estimatedTime: string;
}

interface SelectableItem {
  id: string;
  name: string;
  type: string;
  status: string;
  selected: boolean;
}

const BATCH_OPERATIONS: BatchOperation[] = [
  {
    id: 'batch-001',
    name: 'Bulk User Deactivation',
    type: 'user',
    action: 'deactivate',
    status: 'completed',
    progress: 100,
    totalItems: 150,
    processedItems: 150,
    failedItems: 2,
    startedAt: '2025-01-29T10:00:00Z',
    completedAt: '2025-01-29T10:15:00Z',
    createdBy: 'John Smith',
  },
  {
    id: 'batch-002',
    name: 'Automation Migration',
    type: 'automation',
    action: 'migrate',
    status: 'running',
    progress: 67,
    totalItems: 85,
    processedItems: 57,
    failedItems: 0,
    startedAt: '2025-01-29T14:30:00Z',
    estimatedTime: '5 min remaining',
    createdBy: 'Sarah Johnson',
  },
  {
    id: 'batch-003',
    name: 'Data Export - Q4 Reports',
    type: 'export',
    action: 'export',
    status: 'queued',
    progress: 0,
    totalItems: 12500,
    processedItems: 0,
    failedItems: 0,
    startedAt: '2025-01-29T15:00:00Z',
    estimatedTime: '~30 min',
    createdBy: 'Mike Chen',
  },
  {
    id: 'batch-004',
    name: 'Workflow Tag Update',
    type: 'workflow',
    action: 'update_tags',
    status: 'failed',
    progress: 45,
    totalItems: 200,
    processedItems: 90,
    failedItems: 15,
    startedAt: '2025-01-29T09:00:00Z',
    completedAt: '2025-01-29T09:12:00Z',
    createdBy: 'Emily Brown',
  },
  {
    id: 'batch-005',
    name: 'Data Cleanup - Orphaned Records',
    type: 'data',
    action: 'cleanup',
    status: 'paused',
    progress: 32,
    totalItems: 5000,
    processedItems: 1600,
    failedItems: 0,
    startedAt: '2025-01-28T16:00:00Z',
    estimatedTime: 'Paused',
    createdBy: 'John Smith',
  },
];

const BATCH_TEMPLATES: BatchTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Bulk User Import',
    description: 'Import multiple users from CSV file',
    type: 'user',
    icon: <Users size={24} />,
    estimatedTime: '~5 min per 100 users',
  },
  {
    id: 'tpl-002',
    name: 'Automation Clone',
    description: 'Clone selected automations with new settings',
    type: 'automation',
    icon: <Zap size={24} />,
    estimatedTime: '~2 min per 10 automations',
  },
  {
    id: 'tpl-003',
    name: 'Data Archive',
    description: 'Archive old records to cold storage',
    type: 'data',
    icon: <Archive size={24} />,
    estimatedTime: '~10 min per 10K records',
  },
  {
    id: 'tpl-004',
    name: 'Workflow Migration',
    description: 'Migrate workflows between environments',
    type: 'workflow',
    icon: <Activity size={24} />,
    estimatedTime: '~3 min per workflow',
  },
  {
    id: 'tpl-005',
    name: 'Bulk Tag Update',
    description: 'Update tags on multiple resources',
    type: 'workflow',
    icon: <Tag size={24} />,
    estimatedTime: '~1 min per 100 items',
  },
  {
    id: 'tpl-006',
    name: 'Mass Email Send',
    description: 'Send emails to multiple recipients',
    type: 'user',
    icon: <Mail size={24} />,
    estimatedTime: '~5 min per 1000 emails',
  },
];

const SELECTABLE_ITEMS: SelectableItem[] = [
  { id: 'item-001', name: 'Email Campaign Automation', type: 'automation', status: 'active', selected: false },
  { id: 'item-002', name: 'Data Pipeline Workflow', type: 'workflow', status: 'active', selected: false },
  { id: 'item-003', name: 'Slack Notification Bot', type: 'automation', status: 'active', selected: false },
  { id: 'item-004', name: 'Customer Support Triage', type: 'workflow', status: 'draft', selected: false },
  { id: 'item-005', name: 'Weekly Report Generator', type: 'automation', status: 'active', selected: false },
  { id: 'item-006', name: 'Data Sync Process', type: 'workflow', status: 'inactive', selected: false },
];

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getStatusIcon = (status: BatchOperation['status']): React.ReactNode => {
  switch (status) {
    case 'running': return <Loader2 size={16} className="spinning" />;
    case 'completed': return <CheckCircle size={16} />;
    case 'failed': return <XCircle size={16} />;
    case 'paused': return <Pause size={16} />;
    case 'queued': return <Clock size={16} />;
    default: return <Clock size={16} />;
  }
};

const getTypeIcon = (type: BatchOperation['type']): React.ReactNode => {
  switch (type) {
    case 'automation': return <Zap size={18} />;
    case 'user': return <Users size={18} />;
    case 'data': return <Database size={18} />;
    case 'workflow': return <Activity size={18} />;
    case 'export': return <Download size={18} />;
    default: return <Boxes size={18} />;
  }
};

export default function BatchOperationsPage() {
  const [operations] = useState<BatchOperation[]>(BATCH_OPERATIONS);
  const [activeTab, setActiveTab] = useState<'operations' | 'create'>('operations');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [items, setItems] = useState<SelectableItem[]>(SELECTABLE_ITEMS);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const runningCount = operations.filter(o => o.status === 'running').length;
  const completedCount = operations.filter(o => o.status === 'completed').length;
  const failedCount = operations.filter(o => o.status === 'failed').length;
  const queuedCount = operations.filter(o => o.status === 'queued').length;

  const selectedCount = items.filter(i => i.selected).length;

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const selectAll = () => {
    setItems(items.map(item => ({ ...item, selected: true })));
  };

  const deselectAll = () => {
    setItems(items.map(item => ({ ...item, selected: false })));
  };

  const filteredOperations = operations.filter(op => 
    filterStatus === 'all' || op.status === filterStatus
  );

  return (
    <div className="batch-operations">
      {/* Header */}
      <header className="batch-operations__header">
        <div className="batch-operations__title-section">
          <div className="batch-operations__icon">
            <Layers size={28} />
          </div>
          <div>
            <h1>Batch Operations</h1>
            <p>Execute bulk actions on multiple resources</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('create')}>
            <Plus size={18} />
            New Batch
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="batch-operations__stats">
        <div className="stat-card">
          <div className="stat-icon running">
            <Loader2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningCount}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon queued">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{queuedCount}</span>
            <span className="stat-label">Queued</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{failedCount}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="batch-operations__tabs">
        <button 
          className={`tab-btn ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => setActiveTab('operations')}
        >
          <List size={18} />
          Operations
          {runningCount > 0 && <span className="tab-badge running">{runningCount}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={18} />
          Create New
        </button>
      </div>

      {/* Content */}
      {activeTab === 'operations' && (
        <div className="operations-section">
          <div className="section-toolbar">
            <div className="filter-buttons">
              {['all', 'running', 'queued', 'completed', 'failed', 'paused'].map(status => (
                <button
                  key={status}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="operations-list">
            {filteredOperations.map(operation => (
              <div key={operation.id} className={`operation-card ${operation.status}`}>
                <div className="operation-main">
                  <div className={`operation-icon ${operation.type}`}>
                    {getTypeIcon(operation.type)}
                  </div>
                  <div className="operation-info">
                    <div className="operation-header">
                      <span className="operation-name">{operation.name}</span>
                      <span className={`status-badge ${operation.status}`}>
                        {getStatusIcon(operation.status)}
                        {operation.status}
                      </span>
                    </div>
                    <div className="operation-meta">
                      <span className="type-badge">{operation.type}</span>
                      <span className="action-badge">{operation.action}</span>
                      <span className="creator">
                        <Users size={12} />
                        {operation.createdBy}
                      </span>
                      <span className="date">
                        <Clock size={12} />
                        {formatDate(operation.startedAt)}
                      </span>
                    </div>
                    {(operation.status === 'running' || operation.status === 'paused') && (
                      <div className="progress-section">
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${operation.status}`}
                            style={{ width: `${operation.progress}%` }}
                          ></div>
                        </div>
                        <div className="progress-info">
                          <span>{operation.progress}%</span>
                          <span>{operation.processedItems} / {formatNumber(operation.totalItems)}</span>
                          {operation.estimatedTime && (
                            <span className="eta">{operation.estimatedTime}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {operation.status === 'completed' && (
                      <div className="completion-stats">
                        <span className="stat success">
                          <CheckCircle size={12} />
                          {operation.processedItems - operation.failedItems} succeeded
                        </span>
                        {operation.failedItems > 0 && (
                          <span className="stat failed">
                            <XCircle size={12} />
                            {operation.failedItems} failed
                          </span>
                        )}
                        <span className="stat time">
                          <Clock size={12} />
                          Completed {formatDate(operation.completedAt!)}
                        </span>
                      </div>
                    )}
                    {operation.status === 'failed' && (
                      <div className="error-info">
                        <AlertTriangle size={14} />
                        <span>{operation.failedItems} items failed to process</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="operation-actions">
                  {operation.status === 'running' && (
                    <button className="action-btn" title="Pause">
                      <Pause size={18} />
                    </button>
                  )}
                  {operation.status === 'paused' && (
                    <button className="action-btn" title="Resume">
                      <Play size={18} />
                    </button>
                  )}
                  {operation.status === 'failed' && (
                    <button className="action-btn" title="Retry">
                      <RefreshCw size={18} />
                    </button>
                  )}
                  {(operation.status === 'running' || operation.status === 'queued' || operation.status === 'paused') && (
                    <button className="action-btn danger" title="Cancel">
                      <Square size={18} />
                    </button>
                  )}
                  <button className="action-btn" title="View Details">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="create-section">
          {/* Templates */}
          <div className="templates-section">
            <h2>Choose a Template</h2>
            <div className="templates-grid">
              {BATCH_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className={`template-icon ${template.type}`}>
                    {template.icon}
                  </div>
                  <div className="template-info">
                    <span className="template-name">{template.name}</span>
                    <span className="template-desc">{template.description}</span>
                    <span className="template-time">
                      <Clock size={12} />
                      {template.estimatedTime}
                    </span>
                  </div>
                  {selectedTemplate === template.id && (
                    <CheckCircle size={20} className="check" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Item Selection */}
          {selectedTemplate && (
            <div className="selection-section">
              <div className="selection-header">
                <h2>Select Items</h2>
                <div className="selection-actions">
                  <button className="btn-text" onClick={selectAll}>Select All</button>
                  <span>|</span>
                  <button className="btn-text" onClick={deselectAll}>Deselect All</button>
                </div>
              </div>
              <div className="selection-list">
                {items.map(item => (
                  <button
                    key={item.id}
                    className={`selection-item ${item.selected ? 'selected' : ''}`}
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.selected ? (
                      <CheckSquare size={18} className="checkbox" />
                    ) : (
                      <SquareEmpty size={18} className="checkbox" />
                    )}
                    <span className="item-name">{item.name}</span>
                    <span className="item-type">{item.type}</span>
                    <span className={`item-status ${item.status}`}>{item.status}</span>
                  </button>
                ))}
              </div>
              <div className="selection-footer">
                <span className="selected-count">{selectedCount} items selected</span>
                <button 
                  className="btn-primary"
                  disabled={selectedCount === 0}
                  onClick={() => setShowConfirmModal(true)}
                >
                  <Play size={18} />
                  Start Batch Operation
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <Layers size={24} />
                </div>
                <h2>Confirm Batch Operation</h2>
              </div>
              <button className="close-btn" onClick={() => setShowConfirmModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-summary">
                <div className="summary-item">
                  <span className="summary-label">Template</span>
                  <span className="summary-value">
                    {BATCH_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Items Selected</span>
                  <span className="summary-value">{selectedCount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Estimated Time</span>
                  <span className="summary-value">~5 minutes</span>
                </div>
              </div>
              <div className="warning-box">
                <AlertTriangle size={18} />
                <div>
                  <strong>This action cannot be undone</strong>
                  <p>Please review your selection before proceeding.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Play size={18} />
                Start Operation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
