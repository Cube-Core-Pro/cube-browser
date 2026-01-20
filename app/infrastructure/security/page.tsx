'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Globe,
  Users,
  FileWarning,
  Bug,
  Zap,
  BarChart3,
  PieChart,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Bell,
  Settings,
  Scan,
  Network,
  Database,
  Cloud,
  Terminal,
  FileCode,
  Fingerprint
} from 'lucide-react';
import './security.css';

interface SecurityScore {
  category: string;
  score: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  criticalIssues: number;
  highIssues: number;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'accepted';
  category: string;
  asset: string;
  cveId?: string;
  cvss: number;
  discoveredAt: string;
  dueDate?: string;
  assignee?: string;
  description: string;
  remediation: string;
}

interface ThreatEvent {
  id: string;
  type: 'intrusion' | 'malware' | 'ddos' | 'phishing' | 'bruteforce' | 'data-exfil';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  target: string;
  timestamp: string;
  status: 'active' | 'mitigated' | 'investigating';
  description: string;
  indicators: string[];
}

interface SecurityPolicy {
  id: string;
  name: string;
  category: string;
  status: 'enabled' | 'disabled' | 'partial';
  compliance: number;
  lastUpdated: string;
  violations: number;
}

interface AccessAudit {
  id: string;
  user: string;
  action: string;
  resource: string;
  result: 'success' | 'denied' | 'failed';
  ip: string;
  timestamp: string;
  riskLevel: 'high' | 'medium' | 'low';
}

const SECURITY_SCORES: SecurityScore[] = [
  { category: 'Overall Security', score: 87, previousScore: 82, trend: 'up', criticalIssues: 2, highIssues: 8 },
  { category: 'Infrastructure', score: 92, previousScore: 90, trend: 'up', criticalIssues: 0, highIssues: 3 },
  { category: 'Application', score: 78, previousScore: 75, trend: 'up', criticalIssues: 2, highIssues: 5 },
  { category: 'Data Protection', score: 95, previousScore: 95, trend: 'stable', criticalIssues: 0, highIssues: 1 },
  { category: 'Access Control', score: 84, previousScore: 88, trend: 'down', criticalIssues: 1, highIssues: 4 },
  { category: 'Network Security', score: 89, previousScore: 85, trend: 'up', criticalIssues: 0, highIssues: 2 }
];

const VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-1',
    title: 'SQL Injection in User Authentication',
    severity: 'critical',
    status: 'in-progress',
    category: 'Application',
    asset: 'auth-service',
    cveId: 'CVE-2024-1234',
    cvss: 9.8,
    discoveredAt: '2025-01-10T08:00:00Z',
    dueDate: '2025-01-20',
    assignee: 'Alex Rivera',
    description: 'SQL injection vulnerability in login endpoint allows authentication bypass.',
    remediation: 'Implement parameterized queries and input validation.'
  },
  {
    id: 'vuln-2',
    title: 'Outdated OpenSSL Library',
    severity: 'critical',
    status: 'open',
    category: 'Infrastructure',
    asset: 'api-gateway',
    cveId: 'CVE-2024-5678',
    cvss: 9.1,
    discoveredAt: '2025-01-14T10:30:00Z',
    dueDate: '2025-01-25',
    assignee: 'Security Team',
    description: 'OpenSSL 1.1.1k has known vulnerabilities that could allow remote code execution.',
    remediation: 'Upgrade to OpenSSL 3.0.x or later.'
  },
  {
    id: 'vuln-3',
    title: 'Cross-Site Scripting (XSS) in Dashboard',
    severity: 'high',
    status: 'open',
    category: 'Application',
    asset: 'web-dashboard',
    cvss: 7.5,
    discoveredAt: '2025-01-12T14:00:00Z',
    dueDate: '2025-02-01',
    assignee: 'Frontend Team',
    description: 'Stored XSS vulnerability in user profile fields.',
    remediation: 'Implement output encoding and Content Security Policy.'
  },
  {
    id: 'vuln-4',
    title: 'Insecure Direct Object Reference',
    severity: 'high',
    status: 'resolved',
    category: 'Application',
    asset: 'api-service',
    cvss: 7.2,
    discoveredAt: '2025-01-05T09:00:00Z',
    assignee: 'Backend Team',
    description: 'Users can access other users data by manipulating resource IDs.',
    remediation: 'Implement proper authorization checks for all resource access.'
  },
  {
    id: 'vuln-5',
    title: 'Missing Rate Limiting on API',
    severity: 'medium',
    status: 'in-progress',
    category: 'Application',
    asset: 'public-api',
    cvss: 5.3,
    discoveredAt: '2025-01-08T11:00:00Z',
    dueDate: '2025-02-10',
    assignee: 'Platform Team',
    description: 'API endpoints lack rate limiting, susceptible to abuse.',
    remediation: 'Implement rate limiting at API gateway level.'
  },
  {
    id: 'vuln-6',
    title: 'Weak Password Policy',
    severity: 'medium',
    status: 'accepted',
    category: 'Access Control',
    asset: 'identity-service',
    cvss: 4.8,
    discoveredAt: '2025-01-01T08:00:00Z',
    description: 'Password policy allows weak passwords (min 6 characters).',
    remediation: 'Enforce minimum 12 characters with complexity requirements.'
  }
];

const THREAT_EVENTS: ThreatEvent[] = [
  {
    id: 'threat-1',
    type: 'bruteforce',
    severity: 'high',
    source: '45.33.32.156',
    target: 'auth-service',
    timestamp: '2025-01-15T14:30:00Z',
    status: 'mitigated',
    description: 'Brute force attack detected on admin login endpoint.',
    indicators: ['1000+ failed login attempts', 'Single source IP', 'Common password list']
  },
  {
    id: 'threat-2',
    type: 'ddos',
    severity: 'critical',
    source: 'Multiple (Botnet)',
    target: 'api-gateway',
    timestamp: '2025-01-15T12:00:00Z',
    status: 'active',
    description: 'DDoS attack in progress targeting API gateway.',
    indicators: ['10x normal traffic', 'Geographic dispersion', 'Application layer attack']
  },
  {
    id: 'threat-3',
    type: 'phishing',
    severity: 'medium',
    source: 'External Email',
    target: 'Engineering Team',
    timestamp: '2025-01-14T09:15:00Z',
    status: 'investigating',
    description: 'Phishing campaign targeting engineering team credentials.',
    indicators: ['Spoofed sender domain', '5 users clicked', '2 submitted credentials']
  },
  {
    id: 'threat-4',
    type: 'intrusion',
    severity: 'high',
    source: '103.21.244.0',
    target: 'staging-server',
    timestamp: '2025-01-13T22:45:00Z',
    status: 'mitigated',
    description: 'Unauthorized SSH access attempt on staging environment.',
    indicators: ['SSH key brute force', 'Non-standard port scan', 'Tor exit node']
  }
];

const SECURITY_POLICIES: SecurityPolicy[] = [
  { id: 'pol-1', name: 'Multi-Factor Authentication', category: 'Access Control', status: 'enabled', compliance: 98, lastUpdated: '2025-01-10', violations: 12 },
  { id: 'pol-2', name: 'Data Encryption at Rest', category: 'Data Protection', status: 'enabled', compliance: 100, lastUpdated: '2025-01-05', violations: 0 },
  { id: 'pol-3', name: 'TLS 1.3 Enforcement', category: 'Network', status: 'partial', compliance: 85, lastUpdated: '2025-01-12', violations: 34 },
  { id: 'pol-4', name: 'Privileged Access Management', category: 'Access Control', status: 'enabled', compliance: 92, lastUpdated: '2025-01-08', violations: 8 },
  { id: 'pol-5', name: 'Vulnerability Scanning', category: 'Security Operations', status: 'enabled', compliance: 100, lastUpdated: '2025-01-15', violations: 0 },
  { id: 'pol-6', name: 'Data Loss Prevention', category: 'Data Protection', status: 'disabled', compliance: 0, lastUpdated: '2025-01-01', violations: 0 }
];

const ACCESS_AUDITS: AccessAudit[] = [
  { id: 'audit-1', user: 'admin@cube.io', action: 'DELETE_USER', resource: '/api/users/456', result: 'success', ip: '10.0.1.50', timestamp: '2025-01-15T15:30:00Z', riskLevel: 'high' },
  { id: 'audit-2', user: 'sarah@cube.io', action: 'EXPORT_DATA', resource: '/api/reports/export', result: 'success', ip: '10.0.1.23', timestamp: '2025-01-15T15:25:00Z', riskLevel: 'medium' },
  { id: 'audit-3', user: 'unknown', action: 'LOGIN', resource: '/api/auth/login', result: 'denied', ip: '45.33.32.156', timestamp: '2025-01-15T15:20:00Z', riskLevel: 'high' },
  { id: 'audit-4', user: 'mike@cube.io', action: 'CONFIG_CHANGE', resource: '/api/settings/security', result: 'success', ip: '10.0.1.89', timestamp: '2025-01-15T15:15:00Z', riskLevel: 'high' },
  { id: 'audit-5', user: 'api-service', action: 'READ', resource: '/api/users', result: 'success', ip: '10.0.2.100', timestamp: '2025-01-15T15:10:00Z', riskLevel: 'low' },
  { id: 'audit-6', user: 'guest@cube.io', action: 'ACCESS', resource: '/admin/dashboard', result: 'denied', ip: '192.168.1.100', timestamp: '2025-01-15T15:05:00Z', riskLevel: 'medium' }
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'danger', icon: ShieldX },
  high: { label: 'High', color: 'warning', icon: ShieldAlert },
  medium: { label: 'Medium', color: 'info', icon: Shield },
  low: { label: 'Low', color: 'muted', icon: ShieldCheck }
};

const VULN_STATUS_CONFIG = {
  open: { label: 'Open', color: 'danger' },
  'in-progress': { label: 'In Progress', color: 'info' },
  resolved: { label: 'Resolved', color: 'success' },
  accepted: { label: 'Accepted Risk', color: 'warning' }
};

const THREAT_TYPE_CONFIG = {
  intrusion: { label: 'Intrusion Attempt', icon: Terminal, color: 'danger' },
  malware: { label: 'Malware Detected', icon: Bug, color: 'danger' },
  ddos: { label: 'DDoS Attack', icon: Zap, color: 'critical' },
  phishing: { label: 'Phishing', icon: FileWarning, color: 'warning' },
  bruteforce: { label: 'Brute Force', icon: Key, color: 'warning' },
  'data-exfil': { label: 'Data Exfiltration', icon: Database, color: 'critical' }
};

const THREAT_STATUS_CONFIG = {
  active: { label: 'Active', color: 'danger' },
  mitigated: { label: 'Mitigated', color: 'success' },
  investigating: { label: 'Investigating', color: 'warning' }
};

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vulnerabilities' | 'threats' | 'policies' | 'access'>('overview');
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);
  const [vulnFilter, setVulnFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const overallScore = SECURITY_SCORES[0];
  const criticalVulns = VULNERABILITIES.filter(v => v.severity === 'critical' && v.status !== 'resolved').length;
  const activeThreats = THREAT_EVENTS.filter(t => t.status === 'active').length;

  const filteredVulns = VULNERABILITIES.filter(vuln => {
    if (vulnFilter !== 'all' && vuln.status !== vulnFilter) return false;
    if (severityFilter !== 'all' && vuln.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="security-dashboard">
      <div className="security-dashboard__header">
        <div className="security-dashboard__title-section">
          <div className="security-dashboard__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Security Dashboard</h1>
            <p>Real-time security monitoring and threat intelligence</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Scan size={16} />
            Run Scan
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-primary">
            <Bell size={16} />
            Alert Settings
          </button>
        </div>
      </div>

      <div className="security-dashboard__stats">
        <div className="stat-card primary">
          <div className="score-display">
            <svg viewBox="0 0 120 120" className="score-ring">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(51, 65, 85, 0.3)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={`url(#scoreGrad-${getScoreColor(overallScore.score)})`}
                strokeWidth="8"
                strokeDasharray={`${(overallScore.score / 100) * 339.3} 339.3`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="scoreGrad-excellent" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="scoreGrad-good" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="scoreGrad-warning" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="scoreGrad-danger" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </svg>
            <div className="score-value">
              <span className="score-number">{overallScore.score}</span>
              <span className="score-label">Security Score</span>
            </div>
          </div>
          <div className="score-trend">
            {overallScore.trend === 'up' ? (
              <TrendingUp size={16} className="up" />
            ) : overallScore.trend === 'down' ? (
              <TrendingDown size={16} className="down" />
            ) : (
              <Activity size={16} className="stable" />
            )}
            <span className={overallScore.trend}>
              {overallScore.trend === 'up' ? '+' : overallScore.trend === 'down' ? '-' : ''}
              {Math.abs(overallScore.score - overallScore.previousScore)} pts
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon critical">
            <ShieldX size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{criticalVulns}</div>
            <div className="stat-label">Critical Vulnerabilities</div>
          </div>
          {criticalVulns > 0 && (
            <div className="stat-alert pulse">
              <AlertTriangle size={14} />
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon threats">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeThreats}</div>
            <div className="stat-label">Active Threats</div>
          </div>
          {activeThreats > 0 && (
            <div className="stat-alert danger pulse">
              <Activity size={14} />
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon policies">
            <Lock size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{SECURITY_POLICIES.filter(p => p.status === 'enabled').length}/{SECURITY_POLICIES.length}</div>
            <div className="stat-label">Policies Enabled</div>
          </div>
        </div>
      </div>

      <div className="security-dashboard__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'vulnerabilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('vulnerabilities')}
        >
          <Bug size={16} />
          Vulnerabilities
          <span className="tab-badge danger">{VULNERABILITIES.filter(v => v.status !== 'resolved').length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'threats' ? 'active' : ''}`}
          onClick={() => setActiveTab('threats')}
        >
          <ShieldAlert size={16} />
          Threat Intel
          <span className={`tab-badge ${activeThreats > 0 ? 'danger' : ''}`}>{THREAT_EVENTS.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <FileCode size={16} />
          Policies
        </button>
        <button
          className={`tab-btn ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => setActiveTab('access')}
        >
          <Fingerprint size={16} />
          Access Audit
        </button>
      </div>

      <div className="security-dashboard__content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="overview-grid">
              <div className="panel score-breakdown">
                <div className="panel-header">
                  <h3>Security Score Breakdown</h3>
                  <button className="btn-text">View Details</button>
                </div>
                <div className="scores-list">
                  {SECURITY_SCORES.slice(1).map(score => (
                    <div key={score.category} className="score-item">
                      <div className="score-info">
                        <span className="score-category">{score.category}</span>
                        <div className="score-meta">
                          {score.criticalIssues > 0 && (
                            <span className="issue-badge critical">{score.criticalIssues} critical</span>
                          )}
                          {score.highIssues > 0 && (
                            <span className="issue-badge high">{score.highIssues} high</span>
                          )}
                        </div>
                      </div>
                      <div className="score-bar-container">
                        <div className="score-bar">
                          <div
                            className={`score-fill ${getScoreColor(score.score)}`}
                            style={{ width: `${score.score}%` }}
                          />
                        </div>
                        <div className="score-value-sm">
                          <span className={getScoreColor(score.score)}>{score.score}%</span>
                          <span className={`trend ${score.trend}`}>
                            {score.trend === 'up' ? <TrendingUp size={12} /> : score.trend === 'down' ? <TrendingDown size={12} /> : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel recent-threats">
                <div className="panel-header">
                  <h3>Recent Threats</h3>
                  <span className={`live-indicator ${activeThreats > 0 ? 'active' : ''}`}>
                    <span className="pulse-dot" />
                    {activeThreats > 0 ? 'Active' : 'All Clear'}
                  </span>
                </div>
                <div className="threats-list">
                  {THREAT_EVENTS.slice(0, 4).map(threat => {
                    const typeConfig = THREAT_TYPE_CONFIG[threat.type];
                    const TypeIcon = typeConfig.icon;
                    const statusConfig = THREAT_STATUS_CONFIG[threat.status];
                    const severityConfig = SEVERITY_CONFIG[threat.severity];
                    
                    return (
                      <div key={threat.id} className={`threat-item ${threat.status}`}>
                        <div className={`threat-icon ${typeConfig.color}`}>
                          <TypeIcon size={18} />
                        </div>
                        <div className="threat-info">
                          <h4>{typeConfig.label}</h4>
                          <p className="threat-target">Target: {threat.target}</p>
                          <span className="threat-time">{formatDateTime(threat.timestamp)}</span>
                        </div>
                        <div className="threat-meta">
                          <span className={`severity-tag ${severityConfig.color}`}>
                            {severityConfig.label}
                          </span>
                          <span className={`status-tag ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel critical-vulns">
                <div className="panel-header">
                  <h3>Critical Vulnerabilities</h3>
                  <span className="vuln-count">{criticalVulns} open</span>
                </div>
                <div className="vulns-preview">
                  {VULNERABILITIES.filter(v => v.severity === 'critical' && v.status !== 'resolved').slice(0, 3).map(vuln => (
                    <div key={vuln.id} className="vuln-preview-item">
                      <div className="vuln-header">
                        <ShieldX size={16} className="critical" />
                        <span className="cvss-badge">{vuln.cvss}</span>
                      </div>
                      <h4>{vuln.title}</h4>
                      <div className="vuln-details">
                        <span className="vuln-asset">{vuln.asset}</span>
                        {vuln.cveId && <span className="cve-id">{vuln.cveId}</span>}
                      </div>
                      {vuln.dueDate && (
                        <div className="vuln-due">
                          <Clock size={12} />
                          <span>Due: {formatDate(vuln.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel policy-status">
                <div className="panel-header">
                  <h3>Policy Compliance</h3>
                  <button className="btn-text">Manage</button>
                </div>
                <div className="policies-preview">
                  {SECURITY_POLICIES.slice(0, 4).map(policy => (
                    <div key={policy.id} className={`policy-item ${policy.status}`}>
                      <div className="policy-indicator">
                        {policy.status === 'enabled' ? (
                          <CheckCircle2 size={16} className="enabled" />
                        ) : policy.status === 'partial' ? (
                          <AlertTriangle size={16} className="partial" />
                        ) : (
                          <XCircle size={16} className="disabled" />
                        )}
                      </div>
                      <div className="policy-info">
                        <span className="policy-name">{policy.name}</span>
                        <span className="policy-category">{policy.category}</span>
                      </div>
                      <div className="policy-compliance">
                        <span className={`compliance-value ${getScoreColor(policy.compliance)}`}>
                          {policy.compliance}%
                        </span>
                        {policy.violations > 0 && (
                          <span className="violations">{policy.violations} violations</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="vulnerabilities-section">
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search vulnerabilities..." />
              </div>
              <select
                value={vulnFilter}
                onChange={(e) => setVulnFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="accepted">Accepted Risk</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="vulns-list">
              {filteredVulns.map(vuln => {
                const severityConfig = SEVERITY_CONFIG[vuln.severity];
                const SeverityIcon = severityConfig.icon;
                const statusConfig = VULN_STATUS_CONFIG[vuln.status];
                const isExpanded = expandedVuln === vuln.id;
                
                return (
                  <div
                    key={vuln.id}
                    className={`vuln-card ${vuln.severity} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="vuln-header"
                      onClick={() => setExpandedVuln(isExpanded ? null : vuln.id)}
                    >
                      <div className={`vuln-severity-icon ${severityConfig.color}`}>
                        <SeverityIcon size={20} />
                      </div>
                      <div className="vuln-info">
                        <div className="vuln-title-row">
                          <h4>{vuln.title}</h4>
                          <span className="cvss-score">{vuln.cvss}</span>
                        </div>
                        <div className="vuln-meta">
                          <span className="vuln-asset">
                            <Server size={12} />
                            {vuln.asset}
                          </span>
                          {vuln.cveId && (
                            <span className="cve-tag">{vuln.cveId}</span>
                          )}
                          <span className="vuln-category">{vuln.category}</span>
                        </div>
                      </div>
                      <div className="vuln-badges">
                        <span className={`severity-badge ${severityConfig.color}`}>
                          {severityConfig.label}
                        </span>
                        <span className={`status-badge ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="vuln-expand">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="vuln-details">
                        <div className="detail-grid">
                          <div className="detail-section">
                            <h5>Description</h5>
                            <p>{vuln.description}</p>
                          </div>
                          <div className="detail-section">
                            <h5>Remediation</h5>
                            <p>{vuln.remediation}</p>
                          </div>
                        </div>
                        <div className="detail-footer">
                          <div className="footer-info">
                            <span>
                              <Clock size={14} />
                              Discovered: {formatDateTime(vuln.discoveredAt)}
                            </span>
                            {vuln.assignee && (
                              <span>
                                <Users size={14} />
                                Assigned: {vuln.assignee}
                              </span>
                            )}
                            {vuln.dueDate && (
                              <span className="due-date">
                                <AlertTriangle size={14} />
                                Due: {formatDate(vuln.dueDate)}
                              </span>
                            )}
                          </div>
                          <div className="footer-actions">
                            <button className="action-btn">View Details</button>
                            <button className="action-btn primary">
                              {vuln.status === 'open' ? 'Start Fix' : 'Update Status'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="threats-section">
            <div className="threats-table">
              <div className="tt-header">
                <div className="tt-th">Threat Type</div>
                <div className="tt-th">Severity</div>
                <div className="tt-th">Source</div>
                <div className="tt-th">Target</div>
                <div className="tt-th">Time</div>
                <div className="tt-th">Status</div>
                <div className="tt-th">Actions</div>
              </div>
              <div className="tt-body">
                {THREAT_EVENTS.map(threat => {
                  const typeConfig = THREAT_TYPE_CONFIG[threat.type];
                  const TypeIcon = typeConfig.icon;
                  const severityConfig = SEVERITY_CONFIG[threat.severity];
                  const statusConfig = THREAT_STATUS_CONFIG[threat.status];
                  
                  return (
                    <div key={threat.id} className={`tt-row ${threat.status}`}>
                      <div className="tt-td type">
                        <div className={`type-icon ${typeConfig.color}`}>
                          <TypeIcon size={16} />
                        </div>
                        <span>{typeConfig.label}</span>
                      </div>
                      <div className="tt-td severity">
                        <span className={`severity-chip ${severityConfig.color}`}>
                          {severityConfig.label}
                        </span>
                      </div>
                      <div className="tt-td source">
                        <Globe size={14} />
                        <span>{threat.source}</span>
                      </div>
                      <div className="tt-td target">
                        <Server size={14} />
                        <span>{threat.target}</span>
                      </div>
                      <div className="tt-td time">{formatDateTime(threat.timestamp)}</div>
                      <div className="tt-td status">
                        <span className={`status-chip ${statusConfig.color}`}>
                          {threat.status === 'active' && <span className="pulse-dot" />}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="tt-td actions">
                        <button className="action-btn-sm" title="Investigate">
                          <Eye size={14} />
                        </button>
                        <button className="action-btn-sm" title="Block">
                          <ShieldX size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="policies-section">
            <div className="policies-table">
              <div className="pt-header">
                <div className="pt-th">Policy Name</div>
                <div className="pt-th">Category</div>
                <div className="pt-th">Status</div>
                <div className="pt-th">Compliance</div>
                <div className="pt-th">Violations</div>
                <div className="pt-th">Last Updated</div>
                <div className="pt-th">Actions</div>
              </div>
              <div className="pt-body">
                {SECURITY_POLICIES.map(policy => (
                  <div key={policy.id} className={`pt-row ${policy.status}`}>
                    <div className="pt-td name">
                      <Lock size={16} />
                      <span>{policy.name}</span>
                    </div>
                    <div className="pt-td category">
                      <span className="category-chip">{policy.category}</span>
                    </div>
                    <div className="pt-td status">
                      <span className={`status-indicator ${policy.status}`}>
                        {policy.status === 'enabled' && <CheckCircle2 size={14} />}
                        {policy.status === 'partial' && <AlertTriangle size={14} />}
                        {policy.status === 'disabled' && <XCircle size={14} />}
                        {policy.status}
                      </span>
                    </div>
                    <div className="pt-td compliance">
                      <div className="compliance-bar">
                        <div
                          className={`compliance-fill ${getScoreColor(policy.compliance)}`}
                          style={{ width: `${policy.compliance}%` }}
                        />
                      </div>
                      <span className={getScoreColor(policy.compliance)}>{policy.compliance}%</span>
                    </div>
                    <div className="pt-td violations">
                      {policy.violations > 0 ? (
                        <span className="violations-badge">{policy.violations}</span>
                      ) : (
                        <span className="no-violations">0</span>
                      )}
                    </div>
                    <div className="pt-td updated">{formatDate(policy.lastUpdated)}</div>
                    <div className="pt-td actions">
                      <button className="action-btn-sm" title="Configure">
                        <Settings size={14} />
                      </button>
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

        {activeTab === 'access' && (
          <div className="access-section">
            <div className="access-table">
              <div className="at-header">
                <div className="at-th">User</div>
                <div className="at-th">Action</div>
                <div className="at-th">Resource</div>
                <div className="at-th">Result</div>
                <div className="at-th">IP Address</div>
                <div className="at-th">Time</div>
                <div className="at-th">Risk</div>
              </div>
              <div className="at-body">
                {ACCESS_AUDITS.map(audit => (
                  <div key={audit.id} className={`at-row ${audit.result} ${audit.riskLevel}`}>
                    <div className="at-td user">
                      <Users size={14} />
                      <span>{audit.user}</span>
                    </div>
                    <div className="at-td action">
                      <span className="action-chip">{audit.action}</span>
                    </div>
                    <div className="at-td resource">{audit.resource}</div>
                    <div className="at-td result">
                      <span className={`result-chip ${audit.result}`}>
                        {audit.result === 'success' && <CheckCircle2 size={12} />}
                        {audit.result === 'denied' && <XCircle size={12} />}
                        {audit.result === 'failed' && <AlertTriangle size={12} />}
                        {audit.result}
                      </span>
                    </div>
                    <div className="at-td ip">
                      <Network size={14} />
                      <span>{audit.ip}</span>
                    </div>
                    <div className="at-td time">{formatDateTime(audit.timestamp)}</div>
                    <div className="at-td risk">
                      <span className={`risk-badge ${audit.riskLevel}`}>
                        {audit.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
