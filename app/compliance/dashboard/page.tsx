'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  ChevronRight,
  Globe,
  Lock,
  Database,
  Users,
  Server,
  Eye,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Zap,
  Settings,
  ExternalLink,
  Info,
  BarChart2,
  PieChart
} from 'lucide-react';
import './compliance.css';

interface ComplianceFramework {
  id: string;
  name: string;
  fullName: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'in-progress';
  score: number;
  lastAudit: string;
  nextAudit: string;
  controls: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
  description: string;
}

interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  status: 'passed' | 'failed' | 'pending' | 'not-applicable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastChecked: string;
  evidence?: string;
}

interface ComplianceReport {
  id: string;
  name: string;
  framework: string;
  type: 'audit' | 'assessment' | 'certification';
  date: string;
  size: string;
  status: 'available' | 'generating';
}

export default function ComplianceDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'frameworks' | 'controls' | 'reports'>('overview');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const frameworks: ComplianceFramework[] = [
    {
      id: 'soc2',
      name: 'SOC 2',
      fullName: 'SOC 2 Type II',
      status: 'compliant',
      score: 98,
      lastAudit: '2026-01-15',
      nextAudit: '2026-07-15',
      controls: { total: 87, passed: 85, failed: 1, pending: 1 },
      description: 'Service Organization Control 2 - Trust Services Criteria'
    },
    {
      id: 'gdpr',
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      status: 'compliant',
      score: 95,
      lastAudit: '2026-01-10',
      nextAudit: '2026-04-10',
      controls: { total: 65, passed: 62, failed: 2, pending: 1 },
      description: 'EU data protection and privacy regulation'
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      fullName: 'Health Insurance Portability and Accountability Act',
      status: 'compliant',
      score: 92,
      lastAudit: '2026-01-05',
      nextAudit: '2026-04-05',
      controls: { total: 54, passed: 50, failed: 2, pending: 2 },
      description: 'Healthcare data privacy and security standards'
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      fullName: 'ISO/IEC 27001:2022',
      status: 'in-progress',
      score: 78,
      lastAudit: '2025-12-01',
      nextAudit: '2026-06-01',
      controls: { total: 114, passed: 89, failed: 8, pending: 17 },
      description: 'Information security management system standard'
    },
    {
      id: 'pci',
      name: 'PCI DSS',
      fullName: 'Payment Card Industry Data Security Standard',
      status: 'partial',
      score: 85,
      lastAudit: '2026-01-01',
      nextAudit: '2026-04-01',
      controls: { total: 78, passed: 66, failed: 7, pending: 5 },
      description: 'Credit card processing security requirements'
    },
    {
      id: 'ccpa',
      name: 'CCPA',
      fullName: 'California Consumer Privacy Act',
      status: 'compliant',
      score: 97,
      lastAudit: '2026-01-20',
      nextAudit: '2026-07-20',
      controls: { total: 42, passed: 41, failed: 0, pending: 1 },
      description: 'California state consumer privacy law'
    }
  ];

  const controls: ComplianceControl[] = [
    {
      id: '1',
      name: 'Data Encryption at Rest',
      description: 'All sensitive data must be encrypted using AES-256 encryption when stored',
      framework: 'SOC 2',
      category: 'Data Protection',
      status: 'passed',
      severity: 'critical',
      lastChecked: '2026-01-29',
      evidence: 'Automated encryption policy verified'
    },
    {
      id: '2',
      name: 'Access Control Reviews',
      description: 'Quarterly review of user access rights and permissions',
      framework: 'ISO 27001',
      category: 'Access Management',
      status: 'pending',
      severity: 'high',
      lastChecked: '2025-12-15'
    },
    {
      id: '3',
      name: 'Data Retention Policy',
      description: 'Personal data must not be retained longer than necessary',
      framework: 'GDPR',
      category: 'Data Governance',
      status: 'passed',
      severity: 'high',
      lastChecked: '2026-01-28',
      evidence: 'Automated retention schedules implemented'
    },
    {
      id: '4',
      name: 'Incident Response Plan',
      description: 'Documented and tested incident response procedures',
      framework: 'HIPAA',
      category: 'Security Operations',
      status: 'passed',
      severity: 'critical',
      lastChecked: '2026-01-25',
      evidence: 'Annual tabletop exercise completed'
    },
    {
      id: '5',
      name: 'Vulnerability Scanning',
      description: 'Weekly automated vulnerability scans of all systems',
      framework: 'PCI DSS',
      category: 'Vulnerability Management',
      status: 'failed',
      severity: 'critical',
      lastChecked: '2026-01-29'
    },
    {
      id: '6',
      name: 'Employee Security Training',
      description: 'Annual security awareness training for all employees',
      framework: 'SOC 2',
      category: 'Security Awareness',
      status: 'passed',
      severity: 'medium',
      lastChecked: '2026-01-20',
      evidence: '100% completion rate achieved'
    },
    {
      id: '7',
      name: 'Multi-Factor Authentication',
      description: 'MFA required for all privileged access',
      framework: 'ISO 27001',
      category: 'Access Management',
      status: 'passed',
      severity: 'critical',
      lastChecked: '2026-01-29',
      evidence: 'Enforced via identity provider'
    },
    {
      id: '8',
      name: 'Data Subject Access Rights',
      description: 'Ability to respond to data subject requests within 30 days',
      framework: 'GDPR',
      category: 'Data Subject Rights',
      status: 'passed',
      severity: 'high',
      lastChecked: '2026-01-27',
      evidence: 'Self-service portal available'
    }
  ];

  const reports: ComplianceReport[] = [
    { id: '1', name: 'SOC 2 Type II Report 2025', framework: 'SOC 2', type: 'audit', date: '2026-01-15', size: '2.4 MB', status: 'available' },
    { id: '2', name: 'GDPR Compliance Assessment', framework: 'GDPR', type: 'assessment', date: '2026-01-10', size: '1.8 MB', status: 'available' },
    { id: '3', name: 'HIPAA Security Audit', framework: 'HIPAA', type: 'audit', date: '2026-01-05', size: '3.1 MB', status: 'available' },
    { id: '4', name: 'ISO 27001 Gap Analysis', framework: 'ISO 27001', type: 'assessment', date: '2025-12-01', size: '4.2 MB', status: 'available' },
    { id: '5', name: 'PCI DSS AOC', framework: 'PCI DSS', type: 'certification', date: '2026-01-01', size: '1.2 MB', status: 'available' },
    { id: '6', name: 'Q1 2026 Compliance Summary', framework: 'All', type: 'assessment', date: '2026-01-29', size: '—', status: 'generating' }
  ];

  const overallScore = Math.round(frameworks.reduce((acc, f) => acc + f.score, 0) / frameworks.length);
  const totalControls = frameworks.reduce((acc, f) => acc + f.controls.total, 0);
  const passedControls = frameworks.reduce((acc, f) => acc + f.controls.passed, 0);
  const failedControls = frameworks.reduce((acc, f) => acc + f.controls.failed, 0);
  const pendingControls = frameworks.reduce((acc, f) => acc + f.controls.pending, 0);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'passed': return <CheckCircle size={18} />;
      case 'non-compliant':
      case 'failed': return <XCircle size={18} />;
      case 'partial':
      case 'pending': return <Clock size={18} />;
      case 'in-progress': return <RefreshCw size={18} />;
      default: return <AlertTriangle size={18} />;
    }
  };

  const filteredControls = selectedFramework === 'all' 
    ? controls 
    : controls.filter(c => c.framework.toLowerCase().includes(selectedFramework.toLowerCase()));

  return (
    <div className="compliance-dashboard">
      <header className="compliance-dashboard__header">
        <div className="compliance-dashboard__title-section">
          <div className="compliance-dashboard__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Compliance Dashboard</h1>
            <p>Monitor regulatory compliance and security frameworks</p>
          </div>
        </div>
        <div className="compliance-dashboard__actions">
          <button 
            className={`compliance-dashboard__refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
          >
            <RefreshCw size={18} />
            {refreshing ? 'Scanning...' : 'Run Assessment'}
          </button>
          <button className="compliance-dashboard__export-btn">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </header>

      <nav className="compliance-dashboard__tabs">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart2 size={18} /> },
          { id: 'frameworks', label: 'Frameworks', icon: <Award size={18} /> },
          { id: 'controls', label: 'Controls', icon: <Target size={18} /> },
          { id: 'reports', label: 'Reports', icon: <FileText size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`compliance-dashboard__tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="compliance-dashboard__content">
        {activeTab === 'overview' && (
          <div className="compliance-dashboard__overview">
            <div className="overview-score-card">
              <div className="score-visual">
                <svg viewBox="0 0 100 100" className="score-ring">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--comp-border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--comp-success)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${overallScore * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="score-value">
                  <span className="score-number">{overallScore}%</span>
                  <span className="score-label">Overall Compliance</span>
                </div>
              </div>
              <div className="score-breakdown">
                <div className="breakdown-item">
                  <CheckCircle size={18} className="success" />
                  <span>{frameworks.filter(f => f.status === 'compliant').length} Compliant</span>
                </div>
                <div className="breakdown-item">
                  <Clock size={18} className="warning" />
                  <span>{frameworks.filter(f => f.status === 'in-progress' || f.status === 'partial').length} In Progress</span>
                </div>
                <div className="breakdown-item">
                  <XCircle size={18} className="error" />
                  <span>{frameworks.filter(f => f.status === 'non-compliant').length} Non-Compliant</span>
                </div>
              </div>
            </div>

            <div className="overview-stats">
              <div className="stat-card total">
                <Target size={24} />
                <div className="stat-info">
                  <span className="stat-value">{totalControls}</span>
                  <span className="stat-label">Total Controls</span>
                </div>
              </div>
              <div className="stat-card passed">
                <CheckCircle size={24} />
                <div className="stat-info">
                  <span className="stat-value">{passedControls}</span>
                  <span className="stat-label">Passed</span>
                </div>
              </div>
              <div className="stat-card failed">
                <XCircle size={24} />
                <div className="stat-info">
                  <span className="stat-value">{failedControls}</span>
                  <span className="stat-label">Failed</span>
                </div>
              </div>
              <div className="stat-card pending">
                <Clock size={24} />
                <div className="stat-info">
                  <span className="stat-value">{pendingControls}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </div>
            </div>

            <div className="overview-frameworks">
              <h3>Framework Status</h3>
              <div className="frameworks-grid">
                {frameworks.map(framework => (
                  <div key={framework.id} className={`framework-card ${framework.status}`}>
                    <div className="framework-header">
                      <span className="framework-name">{framework.name}</span>
                      <span className={`framework-status ${framework.status}`}>
                        {getStatusIcon(framework.status)}
                        {framework.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="framework-score">
                      <div className="score-bar">
                        <div 
                          className="score-fill"
                          style={{ width: `${framework.score}%` }}
                        />
                      </div>
                      <span className="score-text">{framework.score}%</span>
                    </div>
                    <div className="framework-controls">
                      <span className="control-stat passed">{framework.controls.passed} passed</span>
                      <span className="control-stat failed">{framework.controls.failed} failed</span>
                      <span className="control-stat pending">{framework.controls.pending} pending</span>
                    </div>
                    <div className="framework-audit">
                      <Calendar size={14} />
                      <span>Next audit: {new Date(framework.nextAudit).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-alerts">
              <h3>Action Required</h3>
              <div className="alerts-list">
                <div className="alert-item critical">
                  <AlertTriangle size={20} />
                  <div className="alert-content">
                    <span className="alert-title">Critical: Vulnerability Scanning Failed</span>
                    <span className="alert-desc">PCI DSS control requires immediate attention</span>
                  </div>
                  <button className="alert-action">
                    Fix Now
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="alert-item high">
                  <Clock size={20} />
                  <div className="alert-content">
                    <span className="alert-title">Access Control Review Due</span>
                    <span className="alert-desc">ISO 27001 quarterly review pending</span>
                  </div>
                  <button className="alert-action">
                    Review
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="alert-item medium">
                  <Info size={20} />
                  <div className="alert-content">
                    <span className="alert-title">ISO 27001 Certification in Progress</span>
                    <span className="alert-desc">17 controls pending implementation</span>
                  </div>
                  <button className="alert-action">
                    View
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'frameworks' && (
          <div className="compliance-dashboard__frameworks">
            {frameworks.map(framework => (
              <div key={framework.id} className={`framework-detail-card ${framework.status}`}>
                <div className="framework-detail-header">
                  <div className="framework-identity">
                    <h3>{framework.name}</h3>
                    <span className="framework-fullname">{framework.fullName}</span>
                  </div>
                  <span className={`status-badge ${framework.status}`}>
                    {getStatusIcon(framework.status)}
                    {framework.status.replace('-', ' ')}
                  </span>
                </div>
                
                <p className="framework-description">{framework.description}</p>
                
                <div className="framework-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Compliance Score</span>
                    <div className="metric-bar-container">
                      <div className="metric-bar">
                        <div 
                          className="metric-fill"
                          style={{ 
                            width: `${framework.score}%`,
                            backgroundColor: framework.score >= 90 ? 'var(--comp-success)' : 
                                           framework.score >= 75 ? 'var(--comp-warning)' : 'var(--comp-error)'
                          }}
                        />
                      </div>
                      <span className="metric-value">{framework.score}%</span>
                    </div>
                  </div>
                </div>

                <div className="framework-controls-summary">
                  <div className="control-summary-item">
                    <CheckCircle size={18} className="success" />
                    <span className="control-count">{framework.controls.passed}</span>
                    <span className="control-label">Passed</span>
                  </div>
                  <div className="control-summary-item">
                    <XCircle size={18} className="error" />
                    <span className="control-count">{framework.controls.failed}</span>
                    <span className="control-label">Failed</span>
                  </div>
                  <div className="control-summary-item">
                    <Clock size={18} className="warning" />
                    <span className="control-count">{framework.controls.pending}</span>
                    <span className="control-label">Pending</span>
                  </div>
                  <div className="control-summary-item">
                    <Target size={18} className="total" />
                    <span className="control-count">{framework.controls.total}</span>
                    <span className="control-label">Total</span>
                  </div>
                </div>

                <div className="framework-audit-info">
                  <div className="audit-item">
                    <span className="audit-label">Last Audit</span>
                    <span className="audit-value">{new Date(framework.lastAudit).toLocaleDateString()}</span>
                  </div>
                  <div className="audit-item">
                    <span className="audit-label">Next Audit</span>
                    <span className="audit-value">{new Date(framework.nextAudit).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="framework-actions">
                  <button className="framework-action-btn primary">
                    <Eye size={16} />
                    View Controls
                  </button>
                  <button className="framework-action-btn">
                    <Download size={16} />
                    Download Report
                  </button>
                  <button className="framework-action-btn">
                    <ExternalLink size={16} />
                    Documentation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="compliance-dashboard__controls">
            <div className="controls-header">
              <div className="controls-filter">
                <label>Framework:</label>
                <select 
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                >
                  <option value="all">All Frameworks</option>
                  {frameworks.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="controls-summary">
                <span className="summary-item passed">{filteredControls.filter(c => c.status === 'passed').length} Passed</span>
                <span className="summary-item failed">{filteredControls.filter(c => c.status === 'failed').length} Failed</span>
                <span className="summary-item pending">{filteredControls.filter(c => c.status === 'pending').length} Pending</span>
              </div>
            </div>

            <div className="controls-list">
              {filteredControls.map(control => (
                <div key={control.id} className={`control-card ${control.status}`}>
                  <div className="control-status-indicator">
                    {getStatusIcon(control.status)}
                  </div>
                  <div className="control-content">
                    <div className="control-header">
                      <h4>{control.name}</h4>
                      <div className="control-badges">
                        <span className={`severity-badge ${control.severity}`}>{control.severity}</span>
                        <span className="framework-badge">{control.framework}</span>
                      </div>
                    </div>
                    <p className="control-description">{control.description}</p>
                    <div className="control-meta">
                      <span className="category">{control.category}</span>
                      <span className="last-checked">
                        <Clock size={14} />
                        Last checked: {new Date(control.lastChecked).toLocaleDateString()}
                      </span>
                    </div>
                    {control.evidence && (
                      <div className="control-evidence">
                        <CheckCircle size={14} />
                        <span>{control.evidence}</span>
                      </div>
                    )}
                  </div>
                  <button className="control-action">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="compliance-dashboard__reports">
            <div className="reports-header">
              <h3>Available Reports</h3>
              <button className="generate-report-btn">
                <FileText size={18} />
                Generate New Report
              </button>
            </div>

            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className={`report-card ${report.status}`}>
                  <div className="report-icon">
                    <FileText size={24} />
                  </div>
                  <div className="report-info">
                    <h4>{report.name}</h4>
                    <div className="report-meta">
                      <span className="report-framework">{report.framework}</span>
                      <span className="report-type">{report.type}</span>
                      <span className="report-date">{new Date(report.date).toLocaleDateString()}</span>
                      <span className="report-size">{report.size}</span>
                    </div>
                  </div>
                  {report.status === 'available' ? (
                    <button className="download-report-btn">
                      <Download size={18} />
                      Download
                    </button>
                  ) : (
                    <span className="generating-badge">
                      <RefreshCw size={16} className="spinning" />
                      Generating...
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="reports-schedule">
              <h3>Scheduled Reports</h3>
              <div className="schedule-list">
                <div className="schedule-item">
                  <Calendar size={18} />
                  <div className="schedule-info">
                    <span className="schedule-name">Weekly Compliance Summary</span>
                    <span className="schedule-frequency">Every Monday at 9:00 AM</span>
                  </div>
                  <button className="schedule-action">
                    <Settings size={16} />
                  </button>
                </div>
                <div className="schedule-item">
                  <Calendar size={18} />
                  <div className="schedule-info">
                    <span className="schedule-name">Monthly Audit Report</span>
                    <span className="schedule-frequency">1st of every month</span>
                  </div>
                  <button className="schedule-action">
                    <Settings size={16} />
                  </button>
                </div>
                <div className="schedule-item">
                  <Calendar size={18} />
                  <div className="schedule-info">
                    <span className="schedule-name">Quarterly Compliance Assessment</span>
                    <span className="schedule-frequency">Jan 1, Apr 1, Jul 1, Oct 1</span>
                  </div>
                  <button className="schedule-action">
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
