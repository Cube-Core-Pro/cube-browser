'use client';

import React, { useState } from 'react';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  Users,
  Lock,
  Eye,
  Globe,
  Server,
  Database,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Award,
  Target,
  TrendingUp,
  BarChart3,
  Building2,
  Briefcase
} from 'lucide-react';
import './compliance.css';

interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'in-progress';
  score: number;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  lastAudit: string;
  nextAudit: string;
  certExpiry?: string;
  category: 'security' | 'privacy' | 'industry' | 'regional';
}

interface ComplianceControl {
  id: string;
  framework: string;
  controlId: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'not-applicable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastChecked: string;
  evidence: string[];
  remediation?: string;
  assignee?: string;
  dueDate?: string;
}

interface AuditReport {
  id: string;
  name: string;
  framework: string;
  auditor: string;
  date: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  findings: number;
  criticalFindings: number;
  downloadUrl?: string;
}

interface ComplianceTask {
  id: string;
  title: string;
  framework: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'completed' | 'overdue';
  assignee: string;
  dueDate: string;
  description: string;
}

const FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    shortName: 'SOC2',
    description: 'Service Organization Control 2 - Security, Availability, Confidentiality',
    status: 'compliant',
    score: 98,
    totalControls: 116,
    passedControls: 114,
    failedControls: 2,
    lastAudit: '2024-11-15',
    nextAudit: '2025-11-15',
    certExpiry: '2025-11-15',
    category: 'security'
  },
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation',
    shortName: 'GDPR',
    description: 'European Union data protection and privacy regulation',
    status: 'compliant',
    score: 96,
    totalControls: 89,
    passedControls: 85,
    failedControls: 4,
    lastAudit: '2024-10-20',
    nextAudit: '2025-04-20',
    category: 'privacy'
  },
  {
    id: 'hipaa',
    name: 'Health Insurance Portability and Accountability Act',
    shortName: 'HIPAA',
    description: 'US healthcare data protection standard',
    status: 'partial',
    score: 87,
    totalControls: 75,
    passedControls: 65,
    failedControls: 10,
    lastAudit: '2024-09-10',
    nextAudit: '2025-03-10',
    category: 'industry'
  },
  {
    id: 'iso27001',
    name: 'ISO/IEC 27001:2022',
    shortName: 'ISO 27001',
    description: 'International information security management standard',
    status: 'compliant',
    score: 94,
    totalControls: 93,
    passedControls: 87,
    failedControls: 6,
    lastAudit: '2024-12-01',
    nextAudit: '2025-12-01',
    certExpiry: '2026-12-01',
    category: 'security'
  },
  {
    id: 'pci-dss',
    name: 'Payment Card Industry Data Security Standard',
    shortName: 'PCI DSS',
    description: 'Security standard for payment card processing',
    status: 'in-progress',
    score: 78,
    totalControls: 264,
    passedControls: 206,
    failedControls: 58,
    lastAudit: '2024-08-15',
    nextAudit: '2025-02-15',
    category: 'industry'
  },
  {
    id: 'ccpa',
    name: 'California Consumer Privacy Act',
    shortName: 'CCPA',
    description: 'California state privacy law for consumer data',
    status: 'compliant',
    score: 100,
    totalControls: 42,
    passedControls: 42,
    failedControls: 0,
    lastAudit: '2024-11-30',
    nextAudit: '2025-05-30',
    category: 'regional'
  }
];

const CONTROLS: ComplianceControl[] = [
  {
    id: 'ctrl-1',
    framework: 'SOC2',
    controlId: 'CC6.1',
    name: 'Logical Access Security',
    description: 'Entity implements logical access security software, infrastructure, and architectures.',
    status: 'passed',
    severity: 'critical',
    lastChecked: '2025-01-15T10:30:00Z',
    evidence: ['Access control policies', 'MFA enforcement logs', 'RBAC configuration']
  },
  {
    id: 'ctrl-2',
    framework: 'SOC2',
    controlId: 'CC7.2',
    name: 'Security Incident Response',
    description: 'The entity monitors system components and events to detect anomalies.',
    status: 'passed',
    severity: 'high',
    lastChecked: '2025-01-15T10:30:00Z',
    evidence: ['Incident response plan', 'SIEM alerts', 'Incident logs']
  },
  {
    id: 'ctrl-3',
    framework: 'GDPR',
    controlId: 'Art.32',
    name: 'Security of Processing',
    description: 'Implement appropriate technical and organizational measures.',
    status: 'passed',
    severity: 'critical',
    lastChecked: '2025-01-14T08:00:00Z',
    evidence: ['Encryption certificates', 'Data flow diagrams', 'DPIAs']
  },
  {
    id: 'ctrl-4',
    framework: 'GDPR',
    controlId: 'Art.17',
    name: 'Right to Erasure',
    description: 'Data subjects have the right to have personal data erased.',
    status: 'warning',
    severity: 'high',
    lastChecked: '2025-01-14T08:00:00Z',
    evidence: ['Data deletion workflow'],
    remediation: 'Implement automated data deletion pipeline for backup systems',
    assignee: 'Sarah Chen',
    dueDate: '2025-02-15'
  },
  {
    id: 'ctrl-5',
    framework: 'HIPAA',
    controlId: '164.312(a)',
    name: 'Access Control',
    description: 'Implement technical policies for electronic access to ePHI.',
    status: 'failed',
    severity: 'critical',
    lastChecked: '2025-01-13T14:00:00Z',
    evidence: [],
    remediation: 'Implement role-based access controls for PHI data stores',
    assignee: 'Mike Johnson',
    dueDate: '2025-01-30'
  },
  {
    id: 'ctrl-6',
    framework: 'PCI DSS',
    controlId: '3.4',
    name: 'Render PAN Unreadable',
    description: 'Render PAN unreadable anywhere it is stored.',
    status: 'passed',
    severity: 'critical',
    lastChecked: '2025-01-15T12:00:00Z',
    evidence: ['Tokenization config', 'Encryption certificates', 'Key management policy']
  },
  {
    id: 'ctrl-7',
    framework: 'ISO 27001',
    controlId: 'A.8.2',
    name: 'Privileged Access Rights',
    description: 'The allocation of privileged access rights shall be restricted and managed.',
    status: 'passed',
    severity: 'high',
    lastChecked: '2025-01-15T09:00:00Z',
    evidence: ['PAM configuration', 'Access review logs', 'Admin role matrix']
  },
  {
    id: 'ctrl-8',
    framework: 'CCPA',
    controlId: '1798.100',
    name: 'Right to Know',
    description: 'Consumers have the right to know what personal information is collected.',
    status: 'passed',
    severity: 'medium',
    lastChecked: '2025-01-14T16:00:00Z',
    evidence: ['Privacy notice', 'Data inventory', 'Consumer request portal']
  }
];

const AUDIT_REPORTS: AuditReport[] = [
  {
    id: 'audit-1',
    name: 'SOC 2 Type II Annual Audit 2024',
    framework: 'SOC2',
    auditor: 'Deloitte',
    date: '2024-11-15',
    status: 'completed',
    findings: 3,
    criticalFindings: 0,
    downloadUrl: '#'
  },
  {
    id: 'audit-2',
    name: 'GDPR Compliance Assessment Q4 2024',
    framework: 'GDPR',
    auditor: 'Internal Audit',
    date: '2024-10-20',
    status: 'completed',
    findings: 5,
    criticalFindings: 1,
    downloadUrl: '#'
  },
  {
    id: 'audit-3',
    name: 'ISO 27001 Surveillance Audit',
    framework: 'ISO 27001',
    auditor: 'BSI Group',
    date: '2024-12-01',
    status: 'completed',
    findings: 2,
    criticalFindings: 0,
    downloadUrl: '#'
  },
  {
    id: 'audit-4',
    name: 'PCI DSS Compliance Audit 2025',
    framework: 'PCI DSS',
    auditor: 'SecurityMetrics',
    date: '2025-02-15',
    status: 'scheduled',
    findings: 0,
    criticalFindings: 0
  }
];

const COMPLIANCE_TASKS: ComplianceTask[] = [
  {
    id: 'task-1',
    title: 'Implement data deletion pipeline for backups',
    framework: 'GDPR',
    priority: 'high',
    status: 'in-progress',
    assignee: 'Sarah Chen',
    dueDate: '2025-02-15',
    description: 'Create automated process to delete personal data from backup systems upon GDPR erasure requests.'
  },
  {
    id: 'task-2',
    title: 'Deploy RBAC for PHI data stores',
    framework: 'HIPAA',
    priority: 'critical',
    status: 'open',
    assignee: 'Mike Johnson',
    dueDate: '2025-01-30',
    description: 'Implement role-based access controls for all systems storing Protected Health Information.'
  },
  {
    id: 'task-3',
    title: 'Update network segmentation documentation',
    framework: 'PCI DSS',
    priority: 'medium',
    status: 'completed',
    assignee: 'Alex Rivera',
    dueDate: '2025-01-20',
    description: 'Document all network segments and update cardholder data environment scope.'
  },
  {
    id: 'task-4',
    title: 'Annual security awareness training',
    framework: 'SOC2',
    priority: 'medium',
    status: 'in-progress',
    assignee: 'HR Team',
    dueDate: '2025-02-28',
    description: 'Complete annual security awareness training for all employees.'
  },
  {
    id: 'task-5',
    title: 'Vulnerability scan remediation',
    framework: 'ISO 27001',
    priority: 'high',
    status: 'overdue',
    assignee: 'Security Team',
    dueDate: '2025-01-10',
    description: 'Remediate high and critical vulnerabilities from Q4 penetration test.'
  }
];

const STATUS_CONFIG = {
  compliant: { label: 'Compliant', icon: CheckCircle2, color: 'success' },
  partial: { label: 'Partial', icon: AlertTriangle, color: 'warning' },
  'non-compliant': { label: 'Non-Compliant', icon: XCircle, color: 'danger' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'info' }
};

const CONTROL_STATUS_CONFIG = {
  passed: { label: 'Passed', icon: CheckCircle2, color: 'success' },
  failed: { label: 'Failed', icon: XCircle, color: 'danger' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'warning' },
  'not-applicable': { label: 'N/A', icon: Eye, color: 'muted' }
};

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'danger' },
  high: { label: 'High', color: 'warning' },
  medium: { label: 'Medium', color: 'info' },
  low: { label: 'Low', color: 'muted' }
};

const CATEGORY_CONFIG = {
  security: { label: 'Security', icon: Shield, color: 'purple' },
  privacy: { label: 'Privacy', icon: Lock, color: 'blue' },
  industry: { label: 'Industry', icon: Briefcase, color: 'orange' },
  regional: { label: 'Regional', icon: Globe, color: 'teal' }
};

const TASK_STATUS_CONFIG = {
  open: { label: 'Open', color: 'muted' },
  'in-progress': { label: 'In Progress', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  overdue: { label: 'Overdue', color: 'danger' }
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'danger' },
  high: { label: 'High', color: 'warning' },
  medium: { label: 'Medium', color: 'info' },
  low: { label: 'Low', color: 'muted' }
};

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'controls' | 'reports' | 'tasks'>('overview');
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [controlFilter, setControlFilter] = useState<string>('all');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOverallScore = () => {
    const total = FRAMEWORKS.reduce((acc, f) => acc + f.score, 0);
    return Math.round(total / FRAMEWORKS.length);
  };

  const getControlStats = () => {
    const passed = CONTROLS.filter(c => c.status === 'passed').length;
    const failed = CONTROLS.filter(c => c.status === 'failed').length;
    const warning = CONTROLS.filter(c => c.status === 'warning').length;
    return { passed, failed, warning, total: CONTROLS.length };
  };

  const filteredControls = CONTROLS.filter(control => {
    if (controlFilter === 'all') return true;
    return control.status === controlFilter;
  });

  const controlStats = getControlStats();
  const overallScore = getOverallScore();

  return (
    <div className="compliance-dashboard">
      <div className="compliance-dashboard__header">
        <div className="compliance-dashboard__title-section">
          <div className="compliance-dashboard__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Compliance Dashboard</h1>
            <p>Regulatory compliance monitoring and audit management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync Controls
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-primary">
            <FileCheck size={16} />
            Run Assessment
          </button>
        </div>
      </div>

      <div className="compliance-dashboard__stats">
        <div className="stat-card primary">
          <div className="stat-icon compliance">
            <Target size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{overallScore}%</div>
            <div className="stat-label">Overall Compliance</div>
          </div>
          <div className="score-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(51, 65, 85, 0.3)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="3"
                strokeDasharray={`${overallScore} 100`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon frameworks">
            <FileCheck size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{FRAMEWORKS.filter(f => f.status === 'compliant').length}/{FRAMEWORKS.length}</div>
            <div className="stat-label">Frameworks Compliant</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon controls">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{controlStats.passed}/{controlStats.total}</div>
            <div className="stat-label">Controls Passed</div>
          </div>
          <div className="stat-detail">
            <span className="detail-warning">{controlStats.warning} warnings</span>
            <span className="detail-failed">{controlStats.failed} failed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tasks">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{COMPLIANCE_TASKS.filter(t => t.status !== 'completed').length}</div>
            <div className="stat-label">Open Tasks</div>
          </div>
          <div className="stat-trend danger">
            {COMPLIANCE_TASKS.filter(t => t.status === 'overdue').length} overdue
          </div>
        </div>
      </div>

      <div className="compliance-dashboard__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          <Shield size={16} />
          Controls
          <span className="tab-badge">{CONTROLS.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} />
          Audit Reports
          <span className="tab-badge">{AUDIT_REPORTS.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Target size={16} />
          Tasks
          <span className="tab-badge warning">{COMPLIANCE_TASKS.filter(t => t.status !== 'completed').length}</span>
        </button>
      </div>

      <div className="compliance-dashboard__content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="frameworks-grid">
              {FRAMEWORKS.map(framework => {
                const statusConfig = STATUS_CONFIG[framework.status];
                const StatusIcon = statusConfig.icon;
                const categoryConfig = CATEGORY_CONFIG[framework.category];
                const CategoryIcon = categoryConfig.icon;
                
                return (
                  <div
                    key={framework.id}
                    className={`framework-card ${framework.status}`}
                    onClick={() => setSelectedFramework(selectedFramework === framework.id ? null : framework.id)}
                  >
                    <div className="framework-header">
                      <div className="framework-badge">
                        <span className={`category-tag ${categoryConfig.color}`}>
                          <CategoryIcon size={12} />
                          {categoryConfig.label}
                        </span>
                      </div>
                      <span className={`status-badge ${statusConfig.color}`}>
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="framework-info">
                      <h3>{framework.shortName}</h3>
                      <p className="framework-name">{framework.name}</p>
                      <p className="framework-desc">{framework.description}</p>
                    </div>
                    <div className="framework-score">
                      <div className="score-bar">
                        <div
                          className={`score-fill ${framework.score >= 90 ? 'success' : framework.score >= 70 ? 'warning' : 'danger'}`}
                          style={{ width: `${framework.score}%` }}
                        />
                      </div>
                      <div className="score-details">
                        <span className="score-value">{framework.score}%</span>
                        <span className="controls-count">
                          {framework.passedControls}/{framework.totalControls} controls
                        </span>
                      </div>
                    </div>
                    <div className="framework-meta">
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>Last: {formatDate(framework.lastAudit)}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>Next: {formatDate(framework.nextAudit)}</span>
                      </div>
                    </div>
                    {framework.certExpiry && (
                      <div className="cert-expiry">
                        <Award size={14} />
                        <span>Cert expires: {formatDate(framework.certExpiry)}</span>
                      </div>
                    )}
                    <div className="framework-expand">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overview-panels">
              <div className="panel upcoming-audits">
                <div className="panel-header">
                  <h3>Upcoming Audits</h3>
                  <button className="btn-text">View All</button>
                </div>
                <div className="audits-list">
                  {AUDIT_REPORTS.filter(a => a.status === 'scheduled').map(audit => (
                    <div key={audit.id} className="audit-item scheduled">
                      <div className="audit-icon">
                        <Calendar size={18} />
                      </div>
                      <div className="audit-info">
                        <h4>{audit.name}</h4>
                        <p>{audit.auditor}</p>
                      </div>
                      <div className="audit-date">
                        <span className="date-badge">{formatDate(audit.date)}</span>
                      </div>
                    </div>
                  ))}
                  {FRAMEWORKS.slice(0, 2).map(framework => (
                    <div key={framework.id} className="audit-item upcoming">
                      <div className="audit-icon">
                        <Clock size={18} />
                      </div>
                      <div className="audit-info">
                        <h4>{framework.shortName} Next Audit</h4>
                        <p>Scheduled assessment</p>
                      </div>
                      <div className="audit-date">
                        <span className="date-badge muted">{formatDate(framework.nextAudit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel critical-findings">
                <div className="panel-header">
                  <h3>Critical Findings</h3>
                  <span className="findings-count">{CONTROLS.filter(c => c.status === 'failed' && c.severity === 'critical').length}</span>
                </div>
                <div className="findings-list">
                  {CONTROLS.filter(c => c.status === 'failed' || c.status === 'warning').slice(0, 3).map(control => {
                    const statusConfig = CONTROL_STATUS_CONFIG[control.status];
                    const StatusIcon = statusConfig.icon;
                    const severityConfig = SEVERITY_CONFIG[control.severity];
                    
                    return (
                      <div key={control.id} className={`finding-item ${control.status}`}>
                        <div className="finding-header">
                          <StatusIcon size={16} className={statusConfig.color} />
                          <span className="finding-framework">{control.framework}</span>
                          <span className={`severity-tag ${severityConfig.color}`}>{severityConfig.label}</span>
                        </div>
                        <h4>{control.controlId}: {control.name}</h4>
                        {control.remediation && (
                          <p className="finding-remediation">{control.remediation}</p>
                        )}
                        {control.dueDate && (
                          <div className="finding-due">
                            <Clock size={12} />
                            <span>Due: {formatDate(control.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="controls-section">
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search controls..." />
              </div>
              <select
                value={controlFilter}
                onChange={(e) => setControlFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
              </select>
              <select>
                <option value="">All Frameworks</option>
                {FRAMEWORKS.map(f => (
                  <option key={f.id} value={f.shortName}>{f.shortName}</option>
                ))}
              </select>
            </div>

            <div className="controls-list">
              {filteredControls.map(control => {
                const statusConfig = CONTROL_STATUS_CONFIG[control.status];
                const StatusIcon = statusConfig.icon;
                const severityConfig = SEVERITY_CONFIG[control.severity];
                const isExpanded = expandedControl === control.id;
                
                return (
                  <div
                    key={control.id}
                    className={`control-card ${control.status} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="control-header"
                      onClick={() => setExpandedControl(isExpanded ? null : control.id)}
                    >
                      <div className="control-status-icon">
                        <StatusIcon size={20} />
                      </div>
                      <div className="control-info">
                        <div className="control-title">
                          <span className="control-id">{control.controlId}</span>
                          <h4>{control.name}</h4>
                        </div>
                        <p className="control-framework">{control.framework}</p>
                      </div>
                      <div className="control-meta">
                        <span className={`severity-badge ${severityConfig.color}`}>
                          {severityConfig.label}
                        </span>
                        <span className={`status-badge ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="control-expand">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="control-details">
                        <div className="detail-section">
                          <h5>Description</h5>
                          <p>{control.description}</p>
                        </div>
                        <div className="detail-section">
                          <h5>Last Checked</h5>
                          <p>{formatDateTime(control.lastChecked)}</p>
                        </div>
                        {control.evidence.length > 0 && (
                          <div className="detail-section">
                            <h5>Evidence</h5>
                            <div className="evidence-list">
                              {control.evidence.map((item, idx) => (
                                <span key={idx} className="evidence-tag">
                                  <FileText size={12} />
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {control.remediation && (
                          <div className="detail-section remediation">
                            <h5>Remediation Required</h5>
                            <p>{control.remediation}</p>
                            {control.assignee && (
                              <div className="assignee-info">
                                <Users size={14} />
                                <span>Assigned to: {control.assignee}</span>
                                {control.dueDate && (
                                  <>
                                    <Clock size={14} />
                                    <span>Due: {formatDate(control.dueDate)}</span>
                                  </>
                                )}
                              </div>
                            )}
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

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="reports-table">
              <div className="rt-header">
                <div className="rt-th">Report Name</div>
                <div className="rt-th">Framework</div>
                <div className="rt-th">Auditor</div>
                <div className="rt-th">Date</div>
                <div className="rt-th">Status</div>
                <div className="rt-th">Findings</div>
                <div className="rt-th">Actions</div>
              </div>
              <div className="rt-body">
                {AUDIT_REPORTS.map(report => (
                  <div key={report.id} className="rt-row">
                    <div className="rt-td name">
                      <FileText size={16} />
                      <span>{report.name}</span>
                    </div>
                    <div className="rt-td framework">
                      <span className="framework-chip">{report.framework}</span>
                    </div>
                    <div className="rt-td auditor">
                      <Building2 size={14} />
                      <span>{report.auditor}</span>
                    </div>
                    <div className="rt-td date">{formatDate(report.date)}</div>
                    <div className="rt-td status">
                      <span className={`status-chip ${report.status}`}>
                        {report.status === 'completed' && <CheckCircle2 size={12} />}
                        {report.status === 'in-progress' && <Clock size={12} />}
                        {report.status === 'scheduled' && <Calendar size={12} />}
                        {report.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="rt-td findings">
                      {report.status === 'completed' ? (
                        <div className="findings-info">
                          <span className="total-findings">{report.findings}</span>
                          {report.criticalFindings > 0 && (
                            <span className="critical-findings">{report.criticalFindings} critical</span>
                          )}
                        </div>
                      ) : (
                        <span className="no-findings">—</span>
                      )}
                    </div>
                    <div className="rt-td actions">
                      {report.downloadUrl && (
                        <button className="action-btn-sm" title="Download Report">
                          <Download size={14} />
                        </button>
                      )}
                      <button className="action-btn-sm" title="View Details">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-section">
            <div className="section-header">
              <h3>Compliance Tasks</h3>
              <button className="btn-primary">
                <Target size={16} />
                Create Task
              </button>
            </div>
            <div className="tasks-list">
              {COMPLIANCE_TASKS.map(task => {
                const statusConfig = TASK_STATUS_CONFIG[task.status];
                const priorityConfig = PRIORITY_CONFIG[task.priority];
                
                return (
                  <div key={task.id} className={`task-card ${task.status}`}>
                    <div className="task-priority">
                      <span className={`priority-indicator ${priorityConfig.color}`} />
                    </div>
                    <div className="task-content">
                      <div className="task-header">
                        <h4>{task.title}</h4>
                        <div className="task-badges">
                          <span className={`priority-badge ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                          <span className={`status-badge ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      <p className="task-description">{task.description}</p>
                      <div className="task-meta">
                        <span className="framework-tag">{task.framework}</span>
                        <span className="assignee">
                          <Users size={14} />
                          {task.assignee}
                        </span>
                        <span className={`due-date ${task.status === 'overdue' ? 'overdue' : ''}`}>
                          <Calendar size={14} />
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className="action-btn">View</button>
                      {task.status !== 'completed' && (
                        <button className="action-btn primary">
                          {task.status === 'open' ? 'Start' : 'Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
