'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Search,
  Play,
  Pause,
  Trash2,
  Copy,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  ChevronRight,
  Zap,
  GitBranch,
  Filter,
  Calendar,
  ArrowRight,
  Code,
  Database,
  Mail,
  Bell,
  Cloud,
  FileText,
  Users,
  RefreshCw,
  Edit,
  Eye,
  Grid,
  List,
  Sparkles,
  Timer,
  Activity,
  TrendingUp,
  Box,
  Layers,
  Target,
  Repeat
} from 'lucide-react';
import './workflows.css';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  name: string;
  app: string;
  config: Record<string, unknown>;
}

interface CustomWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'error';
  trigger: string;
  triggerIcon: React.ReactNode;
  steps: WorkflowStep[];
  lastRun?: string;
  nextRun?: string;
  runs: number;
  successRate: number;
  avgDuration: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  steps: number;
  users: number;
}

const workflows: CustomWorkflow[] = [
  {
    id: '1',
    name: 'Lead Enrichment Pipeline',
    description: 'Automatically enrich new leads with company data and assign to sales reps',
    status: 'active',
    trigger: 'New Lead Created',
    triggerIcon: <Users size={16} />,
    steps: [
      { id: '1', type: 'trigger', name: 'New Lead', app: 'CRM', config: {} },
      { id: '2', type: 'action', name: 'Enrich Data', app: 'Clearbit', config: {} },
      { id: '3', type: 'condition', name: 'Check Score', app: 'Logic', config: {} },
      { id: '4', type: 'action', name: 'Assign Rep', app: 'CRM', config: {} },
      { id: '5', type: 'action', name: 'Send Email', app: 'Gmail', config: {} }
    ],
    lastRun: '2 minutes ago',
    nextRun: 'On trigger',
    runs: 1247,
    successRate: 98.5,
    avgDuration: '3.2s',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-28',
    tags: ['sales', 'automation', 'leads']
  },
  {
    id: '2',
    name: 'Daily Report Generator',
    description: 'Generate and distribute daily performance reports to stakeholders',
    status: 'active',
    trigger: 'Schedule: 8:00 AM',
    triggerIcon: <Clock size={16} />,
    steps: [
      { id: '1', type: 'trigger', name: 'Schedule', app: 'Timer', config: {} },
      { id: '2', type: 'action', name: 'Query Data', app: 'Database', config: {} },
      { id: '3', type: 'action', name: 'Generate PDF', app: 'Reports', config: {} },
      { id: '4', type: 'action', name: 'Send Email', app: 'Gmail', config: {} }
    ],
    lastRun: '6 hours ago',
    nextRun: 'Tomorrow 8:00 AM',
    runs: 342,
    successRate: 100,
    avgDuration: '45s',
    createdAt: '2024-12-15',
    updatedAt: '2025-01-25',
    tags: ['reports', 'scheduled']
  },
  {
    id: '3',
    name: 'Customer Onboarding',
    description: 'Automated onboarding sequence for new customers with welcome emails',
    status: 'paused',
    trigger: 'New Customer Signup',
    triggerIcon: <Users size={16} />,
    steps: [
      { id: '1', type: 'trigger', name: 'New Customer', app: 'Auth', config: {} },
      { id: '2', type: 'action', name: 'Create Profile', app: 'Database', config: {} },
      { id: '3', type: 'delay', name: 'Wait 1 hour', app: 'Timer', config: {} },
      { id: '4', type: 'action', name: 'Welcome Email', app: 'SendGrid', config: {} },
      { id: '5', type: 'delay', name: 'Wait 1 day', app: 'Timer', config: {} },
      { id: '6', type: 'action', name: 'Tips Email', app: 'SendGrid', config: {} }
    ],
    lastRun: '3 days ago',
    runs: 89,
    successRate: 95.5,
    avgDuration: '24h 15m',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-20',
    tags: ['onboarding', 'email']
  },
  {
    id: '4',
    name: 'Error Alert System',
    description: 'Monitor application errors and notify the dev team via Slack',
    status: 'active',
    trigger: 'Error Detected',
    triggerIcon: <AlertTriangle size={16} />,
    steps: [
      { id: '1', type: 'trigger', name: 'Error Event', app: 'Monitoring', config: {} },
      { id: '2', type: 'condition', name: 'Check Severity', app: 'Logic', config: {} },
      { id: '3', type: 'action', name: 'Slack Alert', app: 'Slack', config: {} },
      { id: '4', type: 'action', name: 'Create Ticket', app: 'Jira', config: {} }
    ],
    lastRun: '15 minutes ago',
    nextRun: 'On trigger',
    runs: 567,
    successRate: 100,
    avgDuration: '1.5s',
    createdAt: '2024-11-20',
    updatedAt: '2025-01-28',
    tags: ['monitoring', 'alerts', 'devops']
  },
  {
    id: '5',
    name: 'Invoice Processing',
    description: 'Extract data from invoices and update accounting system',
    status: 'error',
    trigger: 'New File in Dropbox',
    triggerIcon: <FileText size={16} />,
    steps: [
      { id: '1', type: 'trigger', name: 'New File', app: 'Dropbox', config: {} },
      { id: '2', type: 'action', name: 'OCR Extract', app: 'AI', config: {} },
      { id: '3', type: 'action', name: 'Update System', app: 'QuickBooks', config: {} }
    ],
    lastRun: '1 hour ago',
    runs: 234,
    successRate: 87.2,
    avgDuration: '12s',
    createdAt: '2025-01-05',
    updatedAt: '2025-01-28',
    tags: ['finance', 'ocr']
  },
  {
    id: '6',
    name: 'Social Media Scheduler',
    description: 'Schedule and post content across multiple social platforms',
    status: 'draft',
    trigger: 'Manual or Scheduled',
    triggerIcon: <Calendar size={16} />,
    steps: [
      { id: '1', type: 'trigger', name: 'Schedule', app: 'Timer', config: {} },
      { id: '2', type: 'action', name: 'Fetch Content', app: 'CMS', config: {} },
      { id: '3', type: 'action', name: 'Post Twitter', app: 'Twitter', config: {} },
      { id: '4', type: 'action', name: 'Post LinkedIn', app: 'LinkedIn', config: {} }
    ],
    runs: 0,
    successRate: 0,
    avgDuration: '-',
    createdAt: '2025-01-27',
    updatedAt: '2025-01-27',
    tags: ['social', 'marketing']
  }
];

const templates: WorkflowTemplate[] = [
  { id: '1', name: 'Email Campaign Automation', description: 'Send targeted emails based on user behavior', category: 'Marketing', icon: <Mail size={20} />, steps: 5, users: 2340 },
  { id: '2', name: 'Data Sync Pipeline', description: 'Keep databases in sync across platforms', category: 'Data', icon: <Database size={20} />, steps: 4, users: 1890 },
  { id: '3', name: 'Slack Notifications', description: 'Send custom notifications to Slack channels', category: 'Communication', icon: <Bell size={20} />, steps: 3, users: 3120 },
  { id: '4', name: 'File Backup Automation', description: 'Automatically backup files to cloud storage', category: 'Storage', icon: <Cloud size={20} />, steps: 3, users: 1560 }
];

export default function CustomWorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<CustomWorkflow | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    totalRuns: workflows.reduce((sum, w) => sum + w.runs, 0),
    avgSuccess: workflows.filter(w => w.runs > 0).reduce((sum, w) => sum + w.successRate, 0) / 
                workflows.filter(w => w.runs > 0).length || 0
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'paused': return <Pause size={14} />;
      case 'draft': return <Edit size={14} />;
      case 'error': return <XCircle size={14} />;
      default: return null;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <Zap size={14} />;
      case 'action': return <Play size={14} />;
      case 'condition': return <GitBranch size={14} />;
      case 'delay': return <Timer size={14} />;
      default: return <Box size={14} />;
    }
  };

  return (
    <div className="custom-workflows">
      {/* Header */}
      <div className="custom-workflows__header">
        <div className="custom-workflows__title-section">
          <div className="custom-workflows__icon">
            <Workflow size={28} />
          </div>
          <div>
            <h1>Custom Workflows</h1>
            <p>Automate your processes with powerful workflow builder</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => setShowTemplates(true)}>
            <Layers size={18} />
            Templates
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Create Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="custom-workflows__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Workflow size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Workflows</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon runs">
            <Repeat size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalRuns.toLocaleString()}</span>
            <span className="stat-label">Total Runs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgSuccess.toFixed(1)}%</span>
            <span className="stat-label">Avg Success</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="workflows-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="status-filters">
            {['all', 'active', 'paused', 'draft', 'error'].map(status => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className={`workflows-${viewMode}`}>
        {filteredWorkflows.map(workflow => (
          <div 
            key={workflow.id} 
            className={`workflow-card ${workflow.status}`}
            onClick={() => setSelectedWorkflow(workflow)}
          >
            <div className="workflow-header">
              <div className="workflow-info">
                <div className="workflow-title">
                  <h3>{workflow.name}</h3>
                  <span className={`status-badge ${workflow.status}`}>
                    {getStatusIcon(workflow.status)}
                    {workflow.status}
                  </span>
                </div>
                <p className="workflow-description">{workflow.description}</p>
              </div>
              <div className="workflow-actions">
                {workflow.status === 'active' ? (
                  <button className="action-btn pause" title="Pause">
                    <Pause size={16} />
                  </button>
                ) : workflow.status !== 'error' && (
                  <button className="action-btn play" title="Activate">
                    <Play size={16} />
                  </button>
                )}
                <button className="action-btn" title="More options">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            <div className="workflow-trigger">
              <span className="trigger-icon">{workflow.triggerIcon}</span>
              <span className="trigger-text">{workflow.trigger}</span>
            </div>

            <div className="workflow-steps">
              <div className="steps-preview">
                {workflow.steps.slice(0, 5).map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className={`step-node ${step.type}`} title={step.name}>
                      {getStepIcon(step.type)}
                    </div>
                    {idx < Math.min(workflow.steps.length - 1, 4) && (
                      <ArrowRight size={12} className="step-arrow" />
                    )}
                  </React.Fragment>
                ))}
                {workflow.steps.length > 5 && (
                  <span className="more-steps">+{workflow.steps.length - 5} more</span>
                )}
              </div>
              <span className="steps-count">{workflow.steps.length} steps</span>
            </div>

            <div className="workflow-stats">
              <div className="stat">
                <span className="stat-label">Last Run</span>
                <span className="stat-value">{workflow.lastRun || 'Never'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Runs</span>
                <span className="stat-value">{workflow.runs.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Success Rate</span>
                <span className={`stat-value ${workflow.successRate >= 95 ? 'success' : workflow.successRate >= 80 ? 'warning' : 'error'}`}>
                  {workflow.successRate > 0 ? `${workflow.successRate}%` : '-'}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Avg Duration</span>
                <span className="stat-value">{workflow.avgDuration}</span>
              </div>
            </div>

            <div className="workflow-footer">
              <div className="workflow-tags">
                {workflow.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="workflow-meta">
                <span>Updated {workflow.updatedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="empty-state">
          <Workflow size={48} />
          <h3>No workflows found</h3>
          <p>Create your first workflow or adjust your filters</p>
          <button className="btn-primary">
            <Plus size={18} />
            Create Workflow
          </button>
        </div>
      )}

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="modal-overlay" onClick={() => setSelectedWorkflow(null)}>
          <div className="modal workflow-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>{selectedWorkflow.name}</h2>
                <span className={`status-badge ${selectedWorkflow.status}`}>
                  {getStatusIcon(selectedWorkflow.status)}
                  {selectedWorkflow.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedWorkflow(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">{selectedWorkflow.description}</p>

              <div className="detail-section">
                <h3>Workflow Steps</h3>
                <div className="steps-timeline">
                  {selectedWorkflow.steps.map((step, idx) => (
                    <div key={step.id} className={`timeline-step ${step.type}`}>
                      <div className="step-indicator">
                        {getStepIcon(step.type)}
                      </div>
                      <div className="step-content">
                        <span className="step-type">{step.type}</span>
                        <span className="step-name">{step.name}</span>
                        <span className="step-app">{step.app}</span>
                      </div>
                      {idx < selectedWorkflow.steps.length - 1 && (
                        <div className="step-connector"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Runs</span>
                    <span className="stat-value">{selectedWorkflow.runs.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Success Rate</span>
                    <span className="stat-value success">{selectedWorkflow.successRate}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg Duration</span>
                    <span className="stat-value">{selectedWorkflow.avgDuration}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Run</span>
                    <span className="stat-value">{selectedWorkflow.lastRun || 'Never'}</span>
                  </div>
                </div>
              </div>

              <div className="workflow-tags-section">
                <h4>Tags</h4>
                <div className="tags-list">
                  {selectedWorkflow.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline">
                <Eye size={16} />
                View Logs
              </button>
              <button className="btn-outline">
                <Copy size={16} />
                Duplicate
              </button>
              <button className="btn-primary">
                <Edit size={16} />
                Edit Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal templates-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sparkles size={24} />
                <h2>Workflow Templates</h2>
              </div>
              <button className="close-btn" onClick={() => setShowTemplates(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="templates-intro">Start quickly with pre-built workflow templates</p>
              <div className="templates-grid">
                {templates.map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-content">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <div className="template-meta">
                        <span><Box size={12} /> {template.steps} steps</span>
                        <span><Users size={12} /> {template.users.toLocaleString()} users</span>
                      </div>
                    </div>
                    <button className="use-template-btn">
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
