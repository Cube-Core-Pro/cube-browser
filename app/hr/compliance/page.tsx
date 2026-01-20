'use client';

import React, { useState } from 'react';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Building2,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  Bell,
  Settings,
  RefreshCw,
  ExternalLink,
  CheckSquare,
  Square,
  Flag,
  Zap,
  Lock,
  Unlock,
  Scale,
  Gavel,
  Clipboard,
  FileBadge,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ListChecks
} from 'lucide-react';
import './compliance.css';

interface CompliancePolicy {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'draft' | 'archived' | 'pending-review';
  version: string;
  lastUpdated: string;
  nextReview: string;
  owner: string;
  department: string;
  completionRate: number;
}

interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  relatedPolicy: string;
}

interface AuditRecord {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'regulatory';
  status: 'scheduled' | 'in-progress' | 'completed' | 'findings';
  date: string;
  auditor: string;
  findings: number;
  criticalIssues: number;
  score: number;
}

interface Certificate {
  id: string;
  name: string;
  issuingBody: string;
  status: 'valid' | 'expiring-soon' | 'expired' | 'pending';
  issueDate: string;
  expiryDate: string;
  category: string;
}

interface ComplianceMetrics {
  overallScore: number;
  policiesCompliant: number;
  totalPolicies: number;
  openTasks: number;
  overdueItems: number;
  upcomingDeadlines: number;
  auditsPassed: number;
  totalAudits: number;
}

type TabType = 'overview' | 'policies' | 'tasks' | 'audits' | 'certifications' | 'training';

const compliancePolicies: CompliancePolicy[] = [
  {
    id: 'POL-001',
    name: 'Information Security Policy',
    category: 'Security',
    status: 'active',
    version: '3.2',
    lastUpdated: '2025-01-15',
    nextReview: '2025-07-15',
    owner: 'Sarah Chen',
    department: 'IT Security',
    completionRate: 94
  },
  {
    id: 'POL-002',
    name: 'Data Privacy Policy',
    category: 'Privacy',
    status: 'active',
    version: '2.1',
    lastUpdated: '2025-01-10',
    nextReview: '2025-07-10',
    owner: 'Michael Brown',
    department: 'Legal',
    completionRate: 88
  },
  {
    id: 'POL-003',
    name: 'Anti-Harassment Policy',
    category: 'HR',
    status: 'active',
    version: '4.0',
    lastUpdated: '2024-12-01',
    nextReview: '2025-06-01',
    owner: 'Lisa Johnson',
    department: 'HR',
    completionRate: 96
  },
  {
    id: 'POL-004',
    name: 'Code of Conduct',
    category: 'Ethics',
    status: 'active',
    version: '2.5',
    lastUpdated: '2024-11-15',
    nextReview: '2025-05-15',
    owner: 'James Wilson',
    department: 'Legal',
    completionRate: 98
  },
  {
    id: 'POL-005',
    name: 'Environmental Policy',
    category: 'ESG',
    status: 'pending-review',
    version: '1.8',
    lastUpdated: '2024-10-20',
    nextReview: '2025-01-20',
    owner: 'Emily Davis',
    department: 'Operations',
    completionRate: 72
  },
  {
    id: 'POL-006',
    name: 'Remote Work Policy',
    category: 'HR',
    status: 'active',
    version: '3.0',
    lastUpdated: '2025-01-05',
    nextReview: '2025-07-05',
    owner: 'Robert Taylor',
    department: 'HR',
    completionRate: 91
  },
  {
    id: 'POL-007',
    name: 'Vendor Management Policy',
    category: 'Operations',
    status: 'draft',
    version: '1.0',
    lastUpdated: '2025-01-28',
    nextReview: '2025-02-28',
    owner: 'Anna Martinez',
    department: 'Procurement',
    completionRate: 45
  },
  {
    id: 'POL-008',
    name: 'Business Continuity Plan',
    category: 'Operations',
    status: 'active',
    version: '2.3',
    lastUpdated: '2024-12-15',
    nextReview: '2025-06-15',
    owner: 'David Anderson',
    department: 'Operations',
    completionRate: 85
  }
];

const complianceTasks: ComplianceTask[] = [
  {
    id: 'TASK-001',
    title: 'Complete Annual Security Training',
    description: 'All employees must complete the annual information security awareness training',
    assignee: 'All Employees',
    dueDate: '2025-02-28',
    status: 'in-progress',
    priority: 'high',
    category: 'Training',
    relatedPolicy: 'POL-001'
  },
  {
    id: 'TASK-002',
    title: 'Review Data Retention Schedules',
    description: 'Annual review of data retention policies and procedures',
    assignee: 'Legal Team',
    dueDate: '2025-02-15',
    status: 'pending',
    priority: 'medium',
    category: 'Audit',
    relatedPolicy: 'POL-002'
  },
  {
    id: 'TASK-003',
    title: 'Update Privacy Notices',
    description: 'Update all customer-facing privacy notices to reflect GDPR changes',
    assignee: 'Privacy Team',
    dueDate: '2025-01-20',
    status: 'overdue',
    priority: 'critical',
    category: 'Documentation',
    relatedPolicy: 'POL-002'
  },
  {
    id: 'TASK-004',
    title: 'Conduct Access Reviews',
    description: 'Quarterly review of system access permissions',
    assignee: 'IT Security',
    dueDate: '2025-03-31',
    status: 'pending',
    priority: 'high',
    category: 'Security',
    relatedPolicy: 'POL-001'
  },
  {
    id: 'TASK-005',
    title: 'SOC 2 Evidence Collection',
    description: 'Gather evidence for upcoming SOC 2 Type II audit',
    assignee: 'Compliance Team',
    dueDate: '2025-02-10',
    status: 'in-progress',
    priority: 'critical',
    category: 'Audit',
    relatedPolicy: 'POL-001'
  },
  {
    id: 'TASK-006',
    title: 'Harassment Training Rollout',
    description: 'Complete rollout of updated anti-harassment training',
    assignee: 'HR Team',
    dueDate: '2025-03-15',
    status: 'pending',
    priority: 'medium',
    category: 'Training',
    relatedPolicy: 'POL-003'
  }
];

const auditRecords: AuditRecord[] = [
  {
    id: 'AUD-001',
    name: 'SOC 2 Type II Audit',
    type: 'external',
    status: 'in-progress',
    date: '2025-03-01',
    auditor: 'Deloitte',
    findings: 0,
    criticalIssues: 0,
    score: 0
  },
  {
    id: 'AUD-002',
    name: 'Internal Security Audit',
    type: 'internal',
    status: 'completed',
    date: '2025-01-15',
    auditor: 'Internal Audit Team',
    findings: 12,
    criticalIssues: 1,
    score: 87
  },
  {
    id: 'AUD-003',
    name: 'GDPR Compliance Audit',
    type: 'regulatory',
    status: 'findings',
    date: '2024-12-10',
    auditor: 'EU Data Authority',
    findings: 5,
    criticalIssues: 0,
    score: 92
  },
  {
    id: 'AUD-004',
    name: 'ISO 27001 Surveillance',
    type: 'external',
    status: 'scheduled',
    date: '2025-04-15',
    auditor: 'BSI',
    findings: 0,
    criticalIssues: 0,
    score: 0
  },
  {
    id: 'AUD-005',
    name: 'Financial Controls Audit',
    type: 'internal',
    status: 'completed',
    date: '2024-11-20',
    auditor: 'Internal Audit Team',
    findings: 8,
    criticalIssues: 0,
    score: 94
  }
];

const certificates: Certificate[] = [
  {
    id: 'CERT-001',
    name: 'ISO 27001:2022',
    issuingBody: 'BSI',
    status: 'valid',
    issueDate: '2024-03-15',
    expiryDate: '2027-03-15',
    category: 'Security'
  },
  {
    id: 'CERT-002',
    name: 'SOC 2 Type II',
    issuingBody: 'AICPA',
    status: 'valid',
    issueDate: '2024-06-01',
    expiryDate: '2025-05-31',
    category: 'Security'
  },
  {
    id: 'CERT-003',
    name: 'PCI DSS Level 1',
    issuingBody: 'PCI SSC',
    status: 'expiring-soon',
    issueDate: '2024-02-01',
    expiryDate: '2025-02-01',
    category: 'Security'
  },
  {
    id: 'CERT-004',
    name: 'HIPAA Compliance',
    issuingBody: 'HHS',
    status: 'valid',
    issueDate: '2024-08-10',
    expiryDate: '2025-08-10',
    category: 'Privacy'
  },
  {
    id: 'CERT-005',
    name: 'ISO 14001',
    issuingBody: 'DNV',
    status: 'pending',
    issueDate: '',
    expiryDate: '',
    category: 'Environmental'
  }
];

const metrics: ComplianceMetrics = {
  overallScore: 91,
  policiesCompliant: 42,
  totalPolicies: 48,
  openTasks: 24,
  overdueItems: 3,
  upcomingDeadlines: 8,
  auditsPassed: 12,
  totalAudits: 14
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysUntil = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function ComplianceManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'active': { color: 'success', icon: <CheckCircle2 size={12} /> },
      'draft': { color: 'warning', icon: <Edit size={12} /> },
      'archived': { color: 'muted', icon: <FileText size={12} /> },
      'pending-review': { color: 'info', icon: <Clock size={12} /> },
      'pending': { color: 'warning', icon: <Clock size={12} /> },
      'in-progress': { color: 'info', icon: <RefreshCw size={12} /> },
      'completed': { color: 'success', icon: <CheckCircle2 size={12} /> },
      'overdue': { color: 'danger', icon: <AlertTriangle size={12} /> },
      'scheduled': { color: 'info', icon: <Calendar size={12} /> },
      'findings': { color: 'warning', icon: <AlertCircle size={12} /> },
      'valid': { color: 'success', icon: <CheckCircle2 size={12} /> },
      'expiring-soon': { color: 'warning', icon: <AlertTriangle size={12} /> },
      'expired': { color: 'danger', icon: <XCircle size={12} /> }
    };
    const config = statusConfig[status] || { color: 'muted', icon: null };
    return (
      <span className={`status-badge ${config.color}`}>
        {config.icon}
        {status.replace('-', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    return <span className={`priority-badge ${colors[priority]}`}>{priority}</span>;
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="metrics-grid">
        <div className="metric-card large">
          <div className="metric-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a24" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="8"
                strokeDasharray={`${metrics.overallScore * 2.64} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="ring-center">
              <span className="ring-value">{metrics.overallScore}</span>
              <span className="ring-label">Score</span>
            </div>
          </div>
          <div className="metric-info">
            <h3>Overall Compliance Score</h3>
            <p>Based on 48 active policies and controls</p>
            <div className="metric-trend">
              <ArrowUpRight size={14} />
              <span>+3 from last quarter</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon policies">
            <FileCheck size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.policiesCompliant}/{metrics.totalPolicies}</span>
            <span className="metric-label">Policies Compliant</span>
          </div>
          <div className="metric-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill success"
                style={{ width: `${(metrics.policiesCompliant / metrics.totalPolicies) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon tasks">
            <ListChecks size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.openTasks}</span>
            <span className="metric-label">Open Tasks</span>
          </div>
          <div className="metric-sub">
            <span className="sub-item danger">{metrics.overdueItems} overdue</span>
            <span className="sub-item warning">{metrics.upcomingDeadlines} due soon</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon audits">
            <Clipboard size={24} />
          </div>
          <div className="metric-data">
            <span className="metric-value">{metrics.auditsPassed}/{metrics.totalAudits}</span>
            <span className="metric-label">Audits Passed</span>
          </div>
          <div className="metric-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill info"
                style={{ width: `${(metrics.auditsPassed / metrics.totalAudits) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3><AlertTriangle size={18} /> Action Required</h3>
            <button className="view-all-btn">View All <ChevronRight size={14} /></button>
          </div>
          <div className="action-list">
            {complianceTasks
              .filter(t => t.status === 'overdue' || t.priority === 'critical')
              .slice(0, 4)
              .map(task => (
                <div key={task.id} className="action-item">
                  <div className="action-icon critical">
                    <Flag size={14} />
                  </div>
                  <div className="action-content">
                    <span className="action-title">{task.title}</span>
                    <span className="action-meta">
                      Due: {formatDate(task.dueDate)} • {task.assignee}
                    </span>
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
              ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><Calendar size={18} /> Upcoming Deadlines</h3>
            <button className="view-all-btn">View All <ChevronRight size={14} /></button>
          </div>
          <div className="deadline-list">
            {complianceTasks
              .filter(t => t.status !== 'completed' && t.status !== 'overdue')
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 4)
              .map(task => {
                const daysUntil = getDaysUntil(task.dueDate);
                return (
                  <div key={task.id} className="deadline-item">
                    <div className="deadline-date">
                      <span className="date-day">{new Date(task.dueDate).getDate()}</span>
                      <span className="date-month">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="deadline-content">
                      <span className="deadline-title">{task.title}</span>
                      <span className="deadline-meta">{task.category} • {task.assignee}</span>
                    </div>
                    <span className={`days-badge ${daysUntil <= 7 ? 'urgent' : daysUntil <= 14 ? 'soon' : ''}`}>
                      {daysUntil}d
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><Shield size={18} /> Certificate Status</h3>
            <button className="view-all-btn">View All <ChevronRight size={14} /></button>
          </div>
          <div className="cert-list">
            {certificates.slice(0, 4).map(cert => (
              <div key={cert.id} className="cert-item">
                <div className="cert-icon">
                  <Award size={18} />
                </div>
                <div className="cert-content">
                  <span className="cert-name">{cert.name}</span>
                  <span className="cert-meta">{cert.issuingBody}</span>
                </div>
                {getStatusBadge(cert.status)}
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><BarChart3 size={18} /> Compliance by Category</h3>
          </div>
          <div className="category-chart">
            {[
              { name: 'Security', compliance: 94, total: 12 },
              { name: 'Privacy', compliance: 88, total: 8 },
              { name: 'HR', compliance: 96, total: 10 },
              { name: 'Operations', compliance: 82, total: 9 },
              { name: 'Ethics', compliance: 98, total: 5 },
              { name: 'ESG', compliance: 72, total: 4 }
            ].map(cat => (
              <div key={cat.name} className="category-row">
                <span className="cat-name">{cat.name}</span>
                <div className="cat-bar-container">
                  <div 
                    className={`cat-bar ${cat.compliance >= 90 ? 'good' : cat.compliance >= 80 ? 'warning' : 'danger'}`}
                    style={{ width: `${cat.compliance}%` }}
                  />
                </div>
                <span className="cat-percent">{cat.compliance}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="policies-content">
      <div className="content-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Security">Security</option>
            <option value="Privacy">Privacy</option>
            <option value="HR">HR</option>
            <option value="Operations">Operations</option>
            <option value="Ethics">Ethics</option>
            <option value="ESG">ESG</option>
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="pending-review">Pending Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Policy
        </button>
      </div>

      <div className="policies-table">
        <div className="table-header">
          <span className="col-policy">Policy Name</span>
          <span className="col-category">Category</span>
          <span className="col-status">Status</span>
          <span className="col-version">Version</span>
          <span className="col-owner">Owner</span>
          <span className="col-completion">Completion</span>
          <span className="col-review">Next Review</span>
          <span className="col-actions">Actions</span>
        </div>
        {compliancePolicies
          .filter(p => 
            (filterCategory === 'all' || p.category === filterCategory) &&
            (filterStatus === 'all' || p.status === filterStatus) &&
            (searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(policy => (
            <div key={policy.id} className="table-row">
              <div className="col-policy">
                <div className="policy-info">
                  <span className="policy-id">{policy.id}</span>
                  <span className="policy-name">{policy.name}</span>
                </div>
              </div>
              <span className="col-category">
                <span className={`category-tag ${policy.category.toLowerCase()}`}>
                  {policy.category}
                </span>
              </span>
              <span className="col-status">{getStatusBadge(policy.status)}</span>
              <span className="col-version">v{policy.version}</span>
              <span className="col-owner">
                <div className="owner-info">
                  <span className="owner-name">{policy.owner}</span>
                  <span className="owner-dept">{policy.department}</span>
                </div>
              </span>
              <span className="col-completion">
                <div className="completion-indicator">
                  <div className="completion-bar">
                    <div 
                      className={`completion-fill ${policy.completionRate >= 90 ? 'good' : policy.completionRate >= 70 ? 'warning' : 'danger'}`}
                      style={{ width: `${policy.completionRate}%` }}
                    />
                  </div>
                  <span className="completion-text">{policy.completionRate}%</span>
                </div>
              </span>
              <span className="col-review">
                {formatDate(policy.nextReview)}
              </span>
              <span className="col-actions">
                <button className="action-btn"><Eye size={14} /></button>
                <button className="action-btn"><Edit size={14} /></button>
                <button className="action-btn"><Download size={14} /></button>
              </span>
            </div>
          ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="tasks-content">
      <div className="tasks-header">
        <div className="task-stats">
          <div className="task-stat">
            <span className="stat-value">{complianceTasks.filter(t => t.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="task-stat">
            <span className="stat-value">{complianceTasks.filter(t => t.status === 'in-progress').length}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="task-stat danger">
            <span className="stat-value">{complianceTasks.filter(t => t.status === 'overdue').length}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="task-stat success">
            <span className="stat-value">{complianceTasks.filter(t => t.status === 'completed').length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div className="tasks-board">
        <div className="task-column">
          <div className="column-header pending">
            <Clock size={16} />
            <span>Pending</span>
            <span className="count">{complianceTasks.filter(t => t.status === 'pending').length}</span>
          </div>
          <div className="column-tasks">
            {complianceTasks
              .filter(t => t.status === 'pending')
              .map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <span className="task-id">{task.id}</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description}</p>
                  <div className="task-meta">
                    <span className="task-category">{task.category}</span>
                    <span className="task-due">Due: {formatDate(task.dueDate)}</span>
                  </div>
                  <div className="task-assignee">
                    <Users size={12} />
                    {task.assignee}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="task-column">
          <div className="column-header in-progress">
            <RefreshCw size={16} />
            <span>In Progress</span>
            <span className="count">{complianceTasks.filter(t => t.status === 'in-progress').length}</span>
          </div>
          <div className="column-tasks">
            {complianceTasks
              .filter(t => t.status === 'in-progress')
              .map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <span className="task-id">{task.id}</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description}</p>
                  <div className="task-meta">
                    <span className="task-category">{task.category}</span>
                    <span className="task-due">Due: {formatDate(task.dueDate)}</span>
                  </div>
                  <div className="task-assignee">
                    <Users size={12} />
                    {task.assignee}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="task-column">
          <div className="column-header overdue">
            <AlertTriangle size={16} />
            <span>Overdue</span>
            <span className="count">{complianceTasks.filter(t => t.status === 'overdue').length}</span>
          </div>
          <div className="column-tasks">
            {complianceTasks
              .filter(t => t.status === 'overdue')
              .map(task => (
                <div key={task.id} className="task-card overdue">
                  <div className="task-header">
                    <span className="task-id">{task.id}</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description}</p>
                  <div className="task-meta">
                    <span className="task-category">{task.category}</span>
                    <span className="task-due overdue">Due: {formatDate(task.dueDate)}</span>
                  </div>
                  <div className="task-assignee">
                    <Users size={12} />
                    {task.assignee}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="task-column">
          <div className="column-header completed">
            <CheckCircle2 size={16} />
            <span>Completed</span>
            <span className="count">{complianceTasks.filter(t => t.status === 'completed').length}</span>
          </div>
          <div className="column-tasks">
            {complianceTasks
              .filter(t => t.status === 'completed')
              .map(task => (
                <div key={task.id} className="task-card completed">
                  <div className="task-header">
                    <span className="task-id">{task.id}</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description}</p>
                  <div className="task-meta">
                    <span className="task-category">{task.category}</span>
                    <span className="task-due">Completed</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAudits = () => (
    <div className="audits-content">
      <div className="content-toolbar">
        <div className="audit-filters">
          <select className="filter-select">
            <option value="all">All Types</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="regulatory">Regulatory</option>
          </select>
          <select className="filter-select">
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="findings">With Findings</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Schedule Audit
        </button>
      </div>

      <div className="audits-grid">
        {auditRecords.map(audit => (
          <div key={audit.id} className="audit-card">
            <div className="audit-header">
              <div className="audit-type-badge">
                {audit.type === 'internal' ? <Building2 size={14} /> :
                 audit.type === 'external' ? <ExternalLink size={14} /> :
                 <Gavel size={14} />}
                {audit.type}
              </div>
              {getStatusBadge(audit.status)}
            </div>
            
            <h4 className="audit-name">{audit.name}</h4>
            
            <div className="audit-details">
              <div className="detail-item">
                <Calendar size={14} />
                <span>{formatDate(audit.date)}</span>
              </div>
              <div className="detail-item">
                <Users size={14} />
                <span>{audit.auditor}</span>
              </div>
            </div>

            {audit.status === 'completed' || audit.status === 'findings' ? (
              <div className="audit-results">
                <div className="result-item">
                  <span className="result-label">Score</span>
                  <span className={`result-value ${audit.score >= 90 ? 'good' : audit.score >= 80 ? 'warning' : 'danger'}`}>
                    {audit.score}%
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Findings</span>
                  <span className="result-value">{audit.findings}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Critical</span>
                  <span className={`result-value ${audit.criticalIssues > 0 ? 'danger' : ''}`}>
                    {audit.criticalIssues}
                  </span>
                </div>
              </div>
            ) : (
              <div className="audit-pending">
                <span>{audit.status === 'scheduled' ? 'Upcoming audit' : 'Audit in progress'}</span>
              </div>
            )}

            <div className="audit-actions">
              <button className="audit-btn">
                <Eye size={14} />
                View Details
              </button>
              <button className="audit-btn">
                <Download size={14} />
                Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCertifications = () => (
    <div className="certs-content">
      <div className="certs-header">
        <div className="cert-stats">
          <div className="cert-stat valid">
            <CheckCircle2 size={20} />
            <div className="stat-data">
              <span className="stat-value">{certificates.filter(c => c.status === 'valid').length}</span>
              <span className="stat-label">Valid</span>
            </div>
          </div>
          <div className="cert-stat warning">
            <AlertTriangle size={20} />
            <div className="stat-data">
              <span className="stat-value">{certificates.filter(c => c.status === 'expiring-soon').length}</span>
              <span className="stat-label">Expiring Soon</span>
            </div>
          </div>
          <div className="cert-stat danger">
            <XCircle size={20} />
            <div className="stat-data">
              <span className="stat-value">{certificates.filter(c => c.status === 'expired').length}</span>
              <span className="stat-label">Expired</span>
            </div>
          </div>
          <div className="cert-stat pending">
            <Clock size={20} />
            <div className="stat-data">
              <span className="stat-value">{certificates.filter(c => c.status === 'pending').length}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Add Certificate
        </button>
      </div>

      <div className="certs-grid">
        {certificates.map(cert => (
          <div key={cert.id} className={`cert-card ${cert.status}`}>
            <div className="cert-badge">
              <FileBadge size={32} />
            </div>
            <div className="cert-info">
              <h4 className="cert-name">{cert.name}</h4>
              <span className="cert-issuer">{cert.issuingBody}</span>
              <span className="cert-category">{cert.category}</span>
            </div>
            <div className="cert-dates">
              {cert.issueDate && (
                <div className="date-row">
                  <span className="date-label">Issued:</span>
                  <span className="date-value">{formatDate(cert.issueDate)}</span>
                </div>
              )}
              {cert.expiryDate && (
                <div className="date-row">
                  <span className="date-label">Expires:</span>
                  <span className={`date-value ${cert.status === 'expiring-soon' ? 'warning' : cert.status === 'expired' ? 'danger' : ''}`}>
                    {formatDate(cert.expiryDate)}
                  </span>
                </div>
              )}
            </div>
            <div className="cert-status-section">
              {getStatusBadge(cert.status)}
            </div>
            <div className="cert-actions">
              <button className="cert-btn"><Eye size={14} /> View</button>
              <button className="cert-btn"><Download size={14} /> Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="training-content">
      <div className="training-stats">
        <div className="training-stat-card">
          <BookOpen size={24} />
          <div className="stat-info">
            <span className="stat-value">12</span>
            <span className="stat-label">Active Courses</span>
          </div>
        </div>
        <div className="training-stat-card">
          <UserCheck size={24} />
          <div className="stat-info">
            <span className="stat-value">89%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
        </div>
        <div className="training-stat-card">
          <Target size={24} />
          <div className="stat-info">
            <span className="stat-value">3</span>
            <span className="stat-label">Due This Month</span>
          </div>
        </div>
        <div className="training-stat-card">
          <Award size={24} />
          <div className="stat-info">
            <span className="stat-value">847</span>
            <span className="stat-label">Certifications Earned</span>
          </div>
        </div>
      </div>

      <div className="training-grid">
        {[
          { name: 'Information Security Awareness', category: 'Security', completion: 94, employees: 1247, dueDate: '2025-02-28', mandatory: true },
          { name: 'Data Privacy Fundamentals', category: 'Privacy', completion: 88, employees: 1247, dueDate: '2025-03-15', mandatory: true },
          { name: 'Anti-Harassment Training', category: 'HR', completion: 96, employees: 1247, dueDate: '2025-03-31', mandatory: true },
          { name: 'Code of Conduct Review', category: 'Ethics', completion: 78, employees: 1247, dueDate: '2025-04-15', mandatory: true },
          { name: 'GDPR Compliance', category: 'Privacy', completion: 65, employees: 312, dueDate: '2025-02-20', mandatory: false },
          { name: 'Insider Threat Awareness', category: 'Security', completion: 42, employees: 486, dueDate: '2025-05-01', mandatory: false }
        ].map((course, index) => (
          <div key={index} className="training-card">
            <div className="training-header">
              <span className={`training-category ${course.category.toLowerCase()}`}>
                {course.category}
              </span>
              {course.mandatory && (
                <span className="mandatory-badge">Mandatory</span>
              )}
            </div>
            <h4 className="training-name">{course.name}</h4>
            <div className="training-progress">
              <div className="progress-header">
                <span>Completion</span>
                <span>{course.completion}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${course.completion >= 90 ? 'good' : course.completion >= 70 ? 'warning' : 'danger'}`}
                  style={{ width: `${course.completion}%` }}
                />
              </div>
            </div>
            <div className="training-meta">
              <span><Users size={12} /> {course.employees} enrolled</span>
              <span><Calendar size={12} /> Due: {formatDate(course.dueDate)}</span>
            </div>
            <div className="training-actions">
              <button className="training-btn">View Details</button>
              <button className="training-btn primary">Send Reminder</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'policies': return renderPolicies();
      case 'tasks': return renderTasks();
      case 'audits': return renderAudits();
      case 'certifications': return renderCertifications();
      case 'training': return renderTraining();
      default: return renderOverview();
    }
  };

  return (
    <div className="compliance-page">
      <div className="compliance__header">
        <div className="compliance__title-section">
          <div className="compliance__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Compliance Management</h1>
            <p>Monitor policies, audits, certifications and compliance training</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-outline">
            <Bell size={16} />
            Notifications
          </button>
          <button className="btn-primary">
            <RefreshCw size={16} />
            Sync Data
          </button>
        </div>
      </div>

      <div className="compliance__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <FileText size={16} />
          Policies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <ListChecks size={16} />
          Tasks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audits' ? 'active' : ''}`}
          onClick={() => setActiveTab('audits')}
        >
          <Clipboard size={16} />
          Audits
        </button>
        <button 
          className={`tab-btn ${activeTab === 'certifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('certifications')}
        >
          <Award size={16} />
          Certifications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          <BookOpen size={16} />
          Training
        </button>
      </div>

      <div className="compliance__content">
        {renderContent()}
      </div>
    </div>
  );
}
