'use client';

import React, { useState } from 'react';
import {
  GitPullRequest,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  ArrowRight,
  Users,
  Shield,
  FileText,
  MessageSquare,
  History,
  Target,
  Workflow,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Building,
  Server,
  Database,
  Globe,
  Zap,
  MoreVertical,
  Copy,
  ExternalLink,
  Bell,
  Timer,
  Activity,
  TrendingUp,
  AlertCircle,
  Link2
} from 'lucide-react';
import './change-management.css';

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'standard' | 'normal' | 'emergency' | 'expedited';
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  risk: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  service: string;
  environment: 'production' | 'staging' | 'development';
  requestedBy: string;
  assignedTo: string;
  createdAt: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  approvals: Approval[];
  impact: string;
  rollbackPlan: string;
  testPlan: string;
  linkedIncidents: string[];
  linkedProblems: string[];
  tags: string[];
}

interface Approval {
  id: string;
  approver: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comment?: string;
}

interface ChangeCalendarEvent {
  id: string;
  changeId: string;
  title: string;
  start: string;
  end: string;
  type: ChangeRequest['type'];
  status: ChangeRequest['status'];
  service: string;
}

interface ChangeMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

const CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 'CHG-001',
    title: 'Database Schema Migration - Users Table',
    description: 'Add new columns for enhanced user profiles including avatar_url, bio, and social_links JSONB field. Includes index optimization.',
    type: 'normal',
    status: 'approved',
    priority: 'high',
    risk: 'medium',
    category: 'Database',
    service: 'PostgreSQL Primary',
    environment: 'production',
    requestedBy: 'Sarah Chen',
    assignedTo: 'Michael Torres',
    createdAt: '2025-01-27T10:00:00Z',
    scheduledStart: '2025-01-30T02:00:00Z',
    scheduledEnd: '2025-01-30T04:00:00Z',
    approvals: [
      { id: 'apr-1', approver: 'Tech Lead', role: 'technical', status: 'approved', timestamp: '2025-01-27T14:00:00Z', comment: 'Migration script reviewed and approved' },
      { id: 'apr-2', approver: 'DBA Team', role: 'database', status: 'approved', timestamp: '2025-01-27T16:30:00Z', comment: 'Performance impact acceptable' },
      { id: 'apr-3', approver: 'CAB', role: 'cab', status: 'approved', timestamp: '2025-01-28T09:00:00Z' }
    ],
    impact: 'Brief read-only mode during migration (est. 15 minutes). User-facing features requiring write access will show maintenance message.',
    rollbackPlan: 'Automated rollback script prepared. Can restore previous schema within 5 minutes if issues detected.',
    testPlan: 'Migration tested on staging with production data snapshot. All API tests passed.',
    linkedIncidents: [],
    linkedProblems: ['PRB-045'],
    tags: ['database', 'schema', 'users', 'migration']
  },
  {
    id: 'CHG-002',
    title: 'Kubernetes Node Pool Expansion',
    description: 'Add 3 additional worker nodes to production cluster to handle increased traffic. Nodes will be m5.2xlarge instances.',
    type: 'standard',
    status: 'scheduled',
    priority: 'medium',
    risk: 'low',
    category: 'Infrastructure',
    service: 'Kubernetes Cluster',
    environment: 'production',
    requestedBy: 'DevOps Team',
    assignedTo: 'Alex Kim',
    createdAt: '2025-01-26T08:00:00Z',
    scheduledStart: '2025-01-29T14:00:00Z',
    scheduledEnd: '2025-01-29T15:00:00Z',
    approvals: [
      { id: 'apr-4', approver: 'Infrastructure Lead', role: 'technical', status: 'approved', timestamp: '2025-01-26T10:00:00Z' },
      { id: 'apr-5', approver: 'Finance', role: 'financial', status: 'approved', timestamp: '2025-01-26T14:00:00Z', comment: 'Budget approved: $2,400/month additional' }
    ],
    impact: 'No service impact. Nodes will be added to cluster without downtime.',
    rollbackPlan: 'Drain and remove nodes if issues detected. Cluster will continue operating normally.',
    testPlan: 'Node template tested in staging. Workload scheduling verified.',
    linkedIncidents: ['INC-892'],
    linkedProblems: [],
    tags: ['kubernetes', 'scaling', 'infrastructure']
  },
  {
    id: 'CHG-003',
    title: 'Emergency Security Patch - CVE-2025-1234',
    description: 'Critical security vulnerability in OpenSSL requires immediate patching across all application servers.',
    type: 'emergency',
    status: 'in_progress',
    priority: 'critical',
    risk: 'high',
    category: 'Security',
    service: 'All Services',
    environment: 'production',
    requestedBy: 'Security Team',
    assignedTo: 'Security Team',
    createdAt: '2025-01-28T18:00:00Z',
    actualStart: '2025-01-28T18:30:00Z',
    approvals: [
      { id: 'apr-6', approver: 'CISO', role: 'security', status: 'approved', timestamp: '2025-01-28T18:15:00Z', comment: 'Emergency approval granted' }
    ],
    impact: 'Rolling restarts of application pods. Brief connection drops during pod restarts (< 5 seconds each).',
    rollbackPlan: 'Revert to previous container images if patch causes issues.',
    testPlan: 'Patch verified on staging. No functionality impact observed.',
    linkedIncidents: [],
    linkedProblems: [],
    tags: ['security', 'emergency', 'patching', 'cve']
  },
  {
    id: 'CHG-004',
    title: 'API Gateway Rate Limit Configuration Update',
    description: 'Increase rate limits for premium tier customers and add new endpoint-specific limits.',
    type: 'standard',
    status: 'pending_approval',
    priority: 'medium',
    risk: 'low',
    category: 'Configuration',
    service: 'API Gateway',
    environment: 'production',
    requestedBy: 'Product Team',
    assignedTo: 'Platform Team',
    createdAt: '2025-01-28T09:00:00Z',
    approvals: [
      { id: 'apr-7', approver: 'Tech Lead', role: 'technical', status: 'approved', timestamp: '2025-01-28T11:00:00Z' },
      { id: 'apr-8', approver: 'CAB', role: 'cab', status: 'pending' }
    ],
    impact: 'No service impact. Configuration change applied via hot reload.',
    rollbackPlan: 'Revert to previous configuration file version.',
    testPlan: 'Rate limit changes tested on staging with load tests.',
    linkedIncidents: [],
    linkedProblems: [],
    tags: ['api', 'rate-limiting', 'configuration']
  },
  {
    id: 'CHG-005',
    title: 'CDN Provider Migration - Phase 1',
    description: 'Migrate static assets from CloudFront to Cloudflare CDN. Phase 1 covers CSS/JS bundles.',
    type: 'normal',
    status: 'completed',
    priority: 'high',
    risk: 'medium',
    category: 'Infrastructure',
    service: 'CDN',
    environment: 'production',
    requestedBy: 'Platform Team',
    assignedTo: 'Infrastructure Team',
    createdAt: '2025-01-20T10:00:00Z',
    scheduledStart: '2025-01-25T03:00:00Z',
    scheduledEnd: '2025-01-25T05:00:00Z',
    actualStart: '2025-01-25T03:00:00Z',
    actualEnd: '2025-01-25T04:30:00Z',
    approvals: [
      { id: 'apr-9', approver: 'Tech Lead', role: 'technical', status: 'approved', timestamp: '2025-01-21T10:00:00Z' },
      { id: 'apr-10', approver: 'CAB', role: 'cab', status: 'approved', timestamp: '2025-01-22T09:00:00Z' }
    ],
    impact: 'Minimal. DNS TTL reduced prior to migration. Fallback to CloudFront available.',
    rollbackPlan: 'Revert DNS records to CloudFront distribution.',
    testPlan: 'Parallel deployment tested with synthetic monitoring.',
    linkedIncidents: [],
    linkedProblems: [],
    tags: ['cdn', 'migration', 'cloudflare', 'infrastructure']
  },
  {
    id: 'CHG-006',
    title: 'Redis Cluster Version Upgrade',
    description: 'Upgrade Redis cluster from 7.0 to 7.2. Includes new features and performance improvements.',
    type: 'normal',
    status: 'draft',
    priority: 'low',
    risk: 'medium',
    category: 'Database',
    service: 'Redis Cluster',
    environment: 'production',
    requestedBy: 'Backend Team',
    assignedTo: 'DBA Team',
    createdAt: '2025-01-28T14:00:00Z',
    approvals: [],
    impact: 'Requires cluster failover. Expected 2-3 seconds of connection drops.',
    rollbackPlan: 'Failback to previous version nodes.',
    testPlan: 'Version upgrade tested on staging cluster with production workload simulation.',
    linkedIncidents: [],
    linkedProblems: [],
    tags: ['redis', 'upgrade', 'database']
  }
];

const CHANGE_METRICS: ChangeMetric[] = [
  { label: 'Changes This Month', value: 47, change: 12, changeType: 'increase' },
  { label: 'Success Rate', value: 94.2, change: 2.1, changeType: 'increase' },
  { label: 'Avg Lead Time', value: 3.2, change: -0.8, changeType: 'decrease' },
  { label: 'Emergency Changes', value: 3, change: -2, changeType: 'decrease' }
];

const TYPE_CONFIG: Record<ChangeRequest['type'], { label: string; color: string; bg: string }> = {
  standard: { label: 'Standard', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
  normal: { label: 'Normal', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)' },
  emergency: { label: 'Emergency', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
  expedited: { label: 'Expedited', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' }
};

const STATUS_CONFIG: Record<ChangeRequest['status'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', icon: FileText },
  pending_approval: { label: 'Pending Approval', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', icon: Clock },
  approved: { label: 'Approved', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle2 },
  scheduled: { label: 'Scheduled', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', icon: Calendar },
  in_progress: { label: 'In Progress', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)', icon: PlayCircle },
  completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle2 },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
  rolled_back: { label: 'Rolled Back', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: History },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: XCircle }
};

const PRIORITY_CONFIG: Record<ChangeRequest['priority'], { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low: { label: 'Low', color: '#64748b' }
};

const RISK_CONFIG: Record<ChangeRequest['risk'], { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical Risk', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  high: { label: 'High Risk', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  medium: { label: 'Medium Risk', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  low: { label: 'Low Risk', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' }
};

export default function ChangeManagementPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'approvals' | 'analytics'>('requests');
  const [expandedChange, setExpandedChange] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChanges = CHANGE_REQUESTS.filter(change => {
    if (filterType !== 'all' && change.type !== filterType) return false;
    if (filterStatus !== 'all' && change.status !== filterStatus) return false;
    if (searchQuery && !change.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !change.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingApprovals = CHANGE_REQUESTS.filter(c => 
    c.status === 'pending_approval' || 
    c.approvals.some(a => a.status === 'pending')
  );

  const scheduledChanges = CHANGE_REQUESTS.filter(c => 
    c.status === 'scheduled' || c.status === 'approved'
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedChange(expandedChange === id ? null : id);
  };

  return (
    <div className="change-management">
      {/* Header */}
      <header className="cm__header">
        <div className="cm__title-section">
          <div className="cm__icon">
            <GitPullRequest size={28} />
          </div>
          <div>
            <h1>Change Management</h1>
            <p>Enterprise change advisory board and deployment coordination</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Calendar size={16} />
            Change Calendar
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Change Request
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="cm__metrics">
        {CHANGE_METRICS.map((metric, index) => (
          <div key={index} className={`metric-card ${index === 0 ? 'primary' : ''}`}>
            <div className="metric-icon">
              {index === 0 && <GitPullRequest size={20} />}
              {index === 1 && <CheckCircle2 size={20} />}
              {index === 2 && <Timer size={20} />}
              {index === 3 && <AlertTriangle size={20} />}
            </div>
            <div className="metric-content">
              <span className="metric-value">
                {metric.label.includes('Rate') ? `${metric.value}%` : 
                 metric.label.includes('Time') ? `${metric.value}d` : metric.value}
              </span>
              <span className="metric-label">{metric.label}</span>
            </div>
            <span className={`metric-change ${metric.changeType}`}>
              {metric.change > 0 ? '+' : ''}{metric.change}
              {metric.label.includes('Rate') ? '%' : metric.label.includes('Time') ? 'd' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="cm__tabs">
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <FileText size={16} />
          Change Requests
          <span className="tab-badge">{CHANGE_REQUESTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          Schedule
          <span className="tab-badge">{scheduledChanges.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <UserCheck size={16} />
          Pending Approvals
          {pendingApprovals.length > 0 && (
            <span className="tab-badge alert">{pendingApprovals.length}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          Analytics
        </button>
      </div>

      {/* Content */}
      <div className="cm__content">
        {activeTab === 'requests' && (
          <div className="requests-section">
            {/* Toolbar */}
            <div className="section-toolbar">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search changes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="standard">Standard</option>
                  <option value="normal">Normal</option>
                  <option value="emergency">Emergency</option>
                  <option value="expedited">Expedited</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="rolled_back">Rolled Back</option>
                </select>
              </div>
            </div>

            {/* Change Requests List */}
            <div className="changes-list">
              {filteredChanges.map(change => {
                const typeConfig = TYPE_CONFIG[change.type];
                const statusConfig = STATUS_CONFIG[change.status];
                const priorityConfig = PRIORITY_CONFIG[change.priority];
                const riskConfig = RISK_CONFIG[change.risk];
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedChange === change.id;
                const approvedCount = change.approvals.filter(a => a.status === 'approved').length;
                const totalApprovals = change.approvals.length;

                return (
                  <div key={change.id} className={`change-card ${change.type}`}>
                    <div className="change-header" onClick={() => toggleExpand(change.id)}>
                      <div className="change-type-indicator" style={{ background: typeConfig.color }} />
                      
                      <div className="change-main">
                        <div className="change-title-row">
                          <span className="change-id">{change.id}</span>
                          <h4>{change.title}</h4>
                        </div>
                        <div className="change-meta">
                          <span className="service-badge">
                            <Server size={12} />
                            {change.service}
                          </span>
                          <span className="env-badge" data-env={change.environment}>
                            {change.environment}
                          </span>
                          <span className="category">{change.category}</span>
                          <span className="requester">
                            <Users size={12} />
                            {change.requestedBy}
                          </span>
                        </div>
                      </div>

                      <div className="change-schedule">
                        {change.scheduledStart && (
                          <div className="schedule-item">
                            <Calendar size={14} />
                            <span>{formatDate(change.scheduledStart)}</span>
                          </div>
                        )}
                        {change.status === 'in_progress' && change.actualStart && (
                          <div className="schedule-item active">
                            <PlayCircle size={14} />
                            <span>Started {formatDate(change.actualStart)}</span>
                          </div>
                        )}
                      </div>

                      <div className="change-approvals-preview">
                        <div className="approval-progress">
                          <div className="approval-bar">
                            <div 
                              className="approval-fill" 
                              style={{ width: `${(approvedCount / Math.max(totalApprovals, 1)) * 100}%` }}
                            />
                          </div>
                          <span>{approvedCount}/{totalApprovals || '?'} approvals</span>
                        </div>
                      </div>

                      <div className="change-badges">
                        <span 
                          className="type-badge"
                          style={{ background: typeConfig.bg, color: typeConfig.color }}
                        >
                          {typeConfig.label}
                        </span>
                        <span 
                          className="status-badge"
                          style={{ background: statusConfig.bg, color: statusConfig.color }}
                        >
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                        <span 
                          className="risk-badge"
                          style={{ background: riskConfig.bg, color: riskConfig.color }}
                        >
                          <Shield size={12} />
                          {riskConfig.label}
                        </span>
                      </div>

                      <button className="expand-btn">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="change-details">
                        <div className="details-description">
                          <h5>Description</h5>
                          <p>{change.description}</p>
                        </div>

                        <div className="details-grid">
                          <div className="detail-section">
                            <h5>Impact Assessment</h5>
                            <p>{change.impact}</p>
                          </div>
                          <div className="detail-section">
                            <h5>Rollback Plan</h5>
                            <p>{change.rollbackPlan}</p>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h5>Test Plan</h5>
                          <p>{change.testPlan}</p>
                        </div>

                        <div className="approvals-section">
                          <h5>Approvals</h5>
                          <div className="approvals-list">
                            {change.approvals.map(approval => (
                              <div key={approval.id} className={`approval-item ${approval.status}`}>
                                <div className="approval-icon">
                                  {approval.status === 'approved' && <ThumbsUp size={14} />}
                                  {approval.status === 'rejected' && <ThumbsDown size={14} />}
                                  {approval.status === 'pending' && <Clock size={14} />}
                                </div>
                                <div className="approval-info">
                                  <span className="approver-name">{approval.approver}</span>
                                  <span className="approver-role">{approval.role}</span>
                                </div>
                                <span className={`approval-status ${approval.status}`}>
                                  {approval.status === 'approved' ? 'Approved' : 
                                   approval.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                                {approval.timestamp && (
                                  <span className="approval-time">{formatDate(approval.timestamp)}</span>
                                )}
                              </div>
                            ))}
                            {change.approvals.length === 0 && (
                              <p className="no-approvals">No approvals configured yet</p>
                            )}
                          </div>
                        </div>

                        <div className="links-section">
                          {change.linkedIncidents.length > 0 && (
                            <div className="linked-items">
                              <span className="link-label">
                                <AlertCircle size={14} />
                                Linked Incidents:
                              </span>
                              {change.linkedIncidents.map(inc => (
                                <span key={inc} className="link-badge incident">{inc}</span>
                              ))}
                            </div>
                          )}
                          {change.linkedProblems.length > 0 && (
                            <div className="linked-items">
                              <span className="link-label">
                                <Target size={14} />
                                Linked Problems:
                              </span>
                              {change.linkedProblems.map(prb => (
                                <span key={prb} className="link-badge problem">{prb}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="change-tags">
                          {change.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>

                        <div className="change-actions">
                          <button className="action-btn">
                            <Eye size={14} />
                            View Full Details
                          </button>
                          <button className="action-btn">
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button className="action-btn">
                            <MessageSquare size={14} />
                            Comments
                          </button>
                          <button className="action-btn">
                            <History size={14} />
                            History
                          </button>
                          {change.status === 'approved' && (
                            <button className="action-btn primary">
                              <PlayCircle size={14} />
                              Start Implementation
                            </button>
                          )}
                          {change.status === 'in_progress' && (
                            <>
                              <button className="action-btn success">
                                <CheckCircle2 size={14} />
                                Mark Complete
                              </button>
                              <button className="action-btn danger">
                                <History size={14} />
                                Rollback
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-section">
            <div className="calendar-header">
              <h3>Change Schedule</h3>
              <div className="calendar-nav">
                <button className="nav-btn">&lt; Previous Week</button>
                <span className="current-week">January 27 - February 2, 2025</span>
                <button className="nav-btn">Next Week &gt;</button>
              </div>
            </div>

            <div className="freeze-windows">
              <div className="freeze-notice">
                <AlertTriangle size={16} />
                <span>Change Freeze: Feb 14-16 (Valentine's Weekend) - No non-emergency changes</span>
              </div>
            </div>

            <div className="scheduled-changes">
              <h4>Upcoming Scheduled Changes</h4>
              <div className="schedule-list">
                {scheduledChanges.map(change => (
                  <div key={change.id} className="schedule-item-card">
                    <div className="schedule-time">
                      <Calendar size={16} />
                      <div>
                        <span className="date">{change.scheduledStart ? formatDate(change.scheduledStart) : 'TBD'}</span>
                        {change.scheduledEnd && (
                          <span className="duration">
                            Duration: {Math.round((new Date(change.scheduledEnd).getTime() - new Date(change.scheduledStart!).getTime()) / (1000 * 60 * 60))}h
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-title">
                        <span className="change-id">{change.id}</span>
                        <h5>{change.title}</h5>
                      </div>
                      <div className="schedule-meta">
                        <span>{change.service}</span>
                        <span className="env-badge" data-env={change.environment}>{change.environment}</span>
                        <span>Assigned: {change.assignedTo}</span>
                      </div>
                    </div>
                    <div className="schedule-badges">
                      <span 
                        className="type-badge"
                        style={{ 
                          background: TYPE_CONFIG[change.type].bg, 
                          color: TYPE_CONFIG[change.type].color 
                        }}
                      >
                        {TYPE_CONFIG[change.type].label}
                      </span>
                      <span 
                        className="risk-badge"
                        style={{ 
                          background: RISK_CONFIG[change.risk].bg, 
                          color: RISK_CONFIG[change.risk].color 
                        }}
                      >
                        {RISK_CONFIG[change.risk].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="maintenance-windows">
              <h4>Regular Maintenance Windows</h4>
              <div className="windows-grid">
                <div className="window-card">
                  <div className="window-icon">
                    <Server size={20} />
                  </div>
                  <div className="window-info">
                    <h5>Infrastructure Changes</h5>
                    <p>Tuesdays & Thursdays, 02:00-06:00 UTC</p>
                  </div>
                </div>
                <div className="window-card">
                  <div className="window-icon">
                    <Database size={20} />
                  </div>
                  <div className="window-info">
                    <h5>Database Maintenance</h5>
                    <p>Sundays, 03:00-07:00 UTC</p>
                  </div>
                </div>
                <div className="window-card">
                  <div className="window-icon">
                    <Globe size={20} />
                  </div>
                  <div className="window-info">
                    <h5>Application Deployments</h5>
                    <p>Weekdays, 10:00-18:00 UTC (Business Hours)</p>
                  </div>
                </div>
                <div className="window-card">
                  <div className="window-icon">
                    <Shield size={20} />
                  </div>
                  <div className="window-info">
                    <h5>Security Patches</h5>
                    <p>Emergency: Anytime | Standard: Wednesdays</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="approvals-section-tab">
            <div className="approvals-header">
              <h3>Changes Awaiting Your Approval</h3>
              <p>Review and approve pending change requests</p>
            </div>

            <div className="pending-list">
              {pendingApprovals.map(change => (
                <div key={change.id} className="pending-card">
                  <div className="pending-main">
                    <div className="pending-title">
                      <span className="change-id">{change.id}</span>
                      <h4>{change.title}</h4>
                    </div>
                    <p className="pending-description">{change.description}</p>
                    <div className="pending-meta">
                      <span><Users size={14} /> Requested by: {change.requestedBy}</span>
                      <span><Calendar size={14} /> Created: {formatDate(change.createdAt)}</span>
                      <span><Server size={14} /> {change.service}</span>
                    </div>
                  </div>

                  <div className="pending-risk">
                    <div className="risk-assessment">
                      <h5>Risk Assessment</h5>
                      <span 
                        className="risk-level"
                        style={{ 
                          background: RISK_CONFIG[change.risk].bg, 
                          color: RISK_CONFIG[change.risk].color 
                        }}
                      >
                        <Shield size={14} />
                        {RISK_CONFIG[change.risk].label}
                      </span>
                    </div>
                    <div className="impact-preview">
                      <h5>Impact</h5>
                      <p>{change.impact.substring(0, 100)}...</p>
                    </div>
                  </div>

                  <div className="pending-actions">
                    <button className="approve-btn">
                      <ThumbsUp size={16} />
                      Approve
                    </button>
                    <button className="reject-btn">
                      <ThumbsDown size={16} />
                      Reject
                    </button>
                    <button className="details-btn">
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <div className="no-pending">
                  <CheckCircle2 size={48} />
                  <h4>All caught up!</h4>
                  <p>No changes are currently awaiting your approval.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-header">
              <h3>Change Analytics</h3>
              <div className="period-selector">
                <button className="period-btn active">30 Days</button>
                <button className="period-btn">90 Days</button>
                <button className="period-btn">1 Year</button>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Changes by Type</h4>
                <div className="type-breakdown">
                  <div className="type-item">
                    <div className="type-bar">
                      <div className="type-fill standard" style={{ width: '45%' }} />
                    </div>
                    <span className="type-label">Standard</span>
                    <span className="type-value">21</span>
                  </div>
                  <div className="type-item">
                    <div className="type-bar">
                      <div className="type-fill normal" style={{ width: '35%' }} />
                    </div>
                    <span className="type-label">Normal</span>
                    <span className="type-value">16</span>
                  </div>
                  <div className="type-item">
                    <div className="type-bar">
                      <div className="type-fill emergency" style={{ width: '7%' }} />
                    </div>
                    <span className="type-label">Emergency</span>
                    <span className="type-value">3</span>
                  </div>
                  <div className="type-item">
                    <div className="type-bar">
                      <div className="type-fill expedited" style={{ width: '15%' }} />
                    </div>
                    <span className="type-label">Expedited</span>
                    <span className="type-value">7</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>Success vs Failed</h4>
                <div className="success-chart">
                  <div className="donut-container">
                    <svg viewBox="0 0 100 100" className="donut">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="12" />
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke="url(#successGradient)" strokeWidth="12"
                        strokeDasharray="236.8 251.2"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#4ade80" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="donut-center">
                      <span className="donut-value">94.2%</span>
                      <span className="donut-label">Success Rate</span>
                    </div>
                  </div>
                  <div className="success-legend">
                    <div className="legend-item">
                      <span className="dot success"></span>
                      <span>Successful: 44</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot failed"></span>
                      <span>Failed: 2</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot rollback"></span>
                      <span>Rolled Back: 1</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-card wide">
                <h4>Lead Time Trend</h4>
                <div className="lead-time-chart">
                  <div className="chart-bars">
                    {[4.2, 3.8, 4.5, 3.2, 3.0, 2.8, 3.2].map((value, i) => (
                      <div key={i} className="bar-container">
                        <div 
                          className="bar" 
                          style={{ height: `${(value / 5) * 100}%` }}
                        />
                        <span className="bar-label">W{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-info">
                    <div className="info-item">
                      <span className="info-label">Average Lead Time</span>
                      <span className="info-value">3.5 days</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Target</span>
                      <span className="info-value">≤ 4 days</span>
                    </div>
                    <div className="info-item trend positive">
                      <TrendingUp size={16} />
                      <span>12% improvement</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>Top Change Categories</h4>
                <div className="categories-list">
                  <div className="category-item">
                    <span className="category-name">Infrastructure</span>
                    <span className="category-count">18</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Database</span>
                    <span className="category-count">12</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Security</span>
                    <span className="category-count">8</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Configuration</span>
                    <span className="category-count">6</span>
                  </div>
                  <div className="category-item">
                    <span className="category-name">Application</span>
                    <span className="category-count">3</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>Approval Metrics</h4>
                <div className="approval-metrics">
                  <div className="approval-metric">
                    <span className="metric-value">2.1h</span>
                    <span className="metric-label">Avg. Approval Time</span>
                  </div>
                  <div className="approval-metric">
                    <span className="metric-value">98%</span>
                    <span className="metric-label">First-Pass Approval</span>
                  </div>
                  <div className="approval-metric">
                    <span className="metric-value">1.8</span>
                    <span className="metric-label">Avg. Approvers/Change</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
