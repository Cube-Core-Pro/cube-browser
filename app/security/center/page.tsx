'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Download,
  Settings,
  ChevronRight,
  MapPin,
  Clock,
  Zap,
  FileText,
  Users,
  Server,
  Database,
  Wifi,
  HardDrive
} from 'lucide-react';
import './center.css';

interface SecurityScore {
  overall: number;
  categories: {
    name: string;
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    items: number;
    passed: number;
  }[];
}

interface ThreatEvent {
  id: string;
  type: 'blocked' | 'warning' | 'info';
  title: string;
  description: string;
  source: string;
  timestamp: string;
  location?: string;
}

interface ActiveSession {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

export default function SecurityCenterPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'sessions' | 'settings' | 'compliance'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const securityScore: SecurityScore = {
    overall: 87,
    categories: [
      { name: 'Account Security', score: 95, status: 'excellent', items: 8, passed: 8 },
      { name: 'Data Protection', score: 88, status: 'good', items: 12, passed: 11 },
      { name: 'Access Control', score: 82, status: 'good', items: 10, passed: 8 },
      { name: 'Network Security', score: 75, status: 'warning', items: 6, passed: 4 },
      { name: 'Compliance', score: 92, status: 'excellent', items: 15, passed: 14 }
    ]
  };

  const threats: ThreatEvent[] = [
    {
      id: '1',
      type: 'blocked',
      title: 'Suspicious Login Attempt Blocked',
      description: 'Login attempt from unrecognized device was blocked',
      source: '192.168.1.105',
      timestamp: '2 minutes ago',
      location: 'Moscow, Russia'
    },
    {
      id: '2',
      type: 'blocked',
      title: 'Brute Force Attack Prevented',
      description: '15 failed login attempts detected and blocked',
      source: '10.0.0.45',
      timestamp: '15 minutes ago',
      location: 'Beijing, China'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Unusual API Activity Detected',
      description: 'Higher than normal API request rate from your account',
      source: 'API Key: prod_***xyz',
      timestamp: '1 hour ago'
    },
    {
      id: '4',
      type: 'info',
      title: 'New Device Login',
      description: 'New device successfully authenticated',
      source: 'MacBook Pro - Safari',
      timestamp: '3 hours ago',
      location: 'San Francisco, USA'
    },
    {
      id: '5',
      type: 'blocked',
      title: 'SQL Injection Attempt Blocked',
      description: 'Malicious query pattern detected in form submission',
      source: '203.0.113.42',
      timestamp: '5 hours ago',
      location: 'Unknown'
    }
  ];

  const sessions: ActiveSession[] = [
    {
      id: '1',
      device: 'MacBook Pro',
      deviceType: 'desktop',
      browser: 'Chrome 120',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      lastActive: 'Now',
      isCurrent: true
    },
    {
      id: '2',
      device: 'iPhone 15 Pro',
      deviceType: 'mobile',
      browser: 'Safari Mobile',
      location: 'San Francisco, CA',
      ip: '192.168.1.101',
      lastActive: '2 hours ago',
      isCurrent: false
    },
    {
      id: '3',
      device: 'Windows Desktop',
      deviceType: 'desktop',
      browser: 'Firefox 121',
      location: 'New York, NY',
      ip: '10.0.0.55',
      lastActive: '1 day ago',
      isCurrent: false
    },
    {
      id: '4',
      device: 'iPad Pro',
      deviceType: 'tablet',
      browser: 'Safari',
      location: 'Los Angeles, CA',
      ip: '172.16.0.22',
      lastActive: '3 days ago',
      isCurrent: false
    }
  ];

  const securitySettings: SecuritySetting[] = [
    { id: '1', name: 'Two-Factor Authentication', description: 'Require 2FA for all logins', enabled: true, category: 'authentication' },
    { id: '2', name: 'Biometric Login', description: 'Allow fingerprint and face recognition', enabled: true, category: 'authentication' },
    { id: '3', name: 'Login Notifications', description: 'Get notified of new device logins', enabled: true, category: 'notifications' },
    { id: '4', name: 'Suspicious Activity Alerts', description: 'Real-time alerts for threats', enabled: true, category: 'notifications' },
    { id: '5', name: 'Session Timeout', description: 'Auto-logout after 30 minutes of inactivity', enabled: false, category: 'session' },
    { id: '6', name: 'IP Whitelisting', description: 'Only allow access from approved IPs', enabled: false, category: 'access' },
    { id: '7', name: 'API Rate Limiting', description: 'Limit API requests per minute', enabled: true, category: 'api' },
    { id: '8', name: 'Data Encryption', description: 'Encrypt all data at rest', enabled: true, category: 'data' },
    { id: '9', name: 'Audit Logging', description: 'Log all security-related events', enabled: true, category: 'compliance' },
    { id: '10', name: 'Password Expiry', description: 'Require password change every 90 days', enabled: false, category: 'authentication' }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleToggleSetting = (settingId: string) => {
    console.log('Toggle setting:', settingId);
  };

  const handleRevokeSession = (sessionId: string) => {
    console.log('Revoke session:', sessionId);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'var(--sec-success)';
    if (score >= 75) return 'var(--sec-primary)';
    if (score >= 50) return 'var(--sec-warning)';
    return 'var(--sec-danger)';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone size={20} />;
      case 'tablet': return <Monitor size={20} />;
      default: return <Monitor size={20} />;
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'blocked': return <XCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Activity size={18} />;
    }
  };

  return (
    <div className="security-center">
      <header className="security-center__header">
        <div className="security-center__title-section">
          <div className="security-center__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Security Center</h1>
            <p>Monitor and manage your account security</p>
          </div>
        </div>
        <div className="security-center__actions">
          <button 
            className={`security-center__refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
          >
            <RefreshCw size={18} />
            {refreshing ? 'Scanning...' : 'Security Scan'}
          </button>
          <button className="security-center__report-btn">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </header>

      <nav className="security-center__tabs">
        {[
          { id: 'overview', label: 'Overview', icon: <Shield size={18} /> },
          { id: 'threats', label: 'Threats', icon: <AlertTriangle size={18} /> },
          { id: 'sessions', label: 'Sessions', icon: <Monitor size={18} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
          { id: 'compliance', label: 'Compliance', icon: <FileText size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`security-center__tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="security-center__content">
        {activeTab === 'overview' && (
          <div className="security-center__overview">
            <div className="security-center__score-card">
              <div className="security-center__score-visual">
                <svg viewBox="0 0 100 100" className="security-center__score-ring">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--sec-border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getScoreColor(securityScore.overall)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${securityScore.overall * 2.83} 283`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="security-center__score-value">
                  <span className="score-number">{securityScore.overall}</span>
                  <span className="score-label">Security Score</span>
                </div>
              </div>
              <div className="security-center__score-status">
                <ShieldCheck size={24} className="status-icon" />
                <span>Your account is well protected</span>
              </div>
              <p className="security-center__score-desc">
                Your security score is based on multiple factors including authentication settings,
                active sessions, and recent security events.
              </p>
            </div>

            <div className="security-center__categories">
              <h3>Security Categories</h3>
              <div className="security-center__category-list">
                {securityScore.categories.map(category => (
                  <div key={category.name} className="security-center__category-item">
                    <div className="category-header">
                      <span className="category-name">{category.name}</span>
                      <span className={`category-badge ${category.status}`}>
                        {category.status}
                      </span>
                    </div>
                    <div className="category-progress">
                      <div 
                        className="category-progress-bar"
                        style={{ 
                          width: `${category.score}%`,
                          backgroundColor: getScoreColor(category.score)
                        }}
                      />
                    </div>
                    <div className="category-stats">
                      <span>{category.passed}/{category.items} checks passed</span>
                      <span className="category-score">{category.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="security-center__quick-actions">
              <h3>Quick Actions</h3>
              <div className="security-center__action-grid">
                <button className="security-center__quick-action">
                  <Key size={24} />
                  <span>Change Password</span>
                  <ChevronRight size={18} />
                </button>
                <button className="security-center__quick-action">
                  <Fingerprint size={24} />
                  <span>Manage 2FA</span>
                  <ChevronRight size={18} />
                </button>
                <button className="security-center__quick-action">
                  <Monitor size={24} />
                  <span>Active Sessions</span>
                  <ChevronRight size={18} />
                </button>
                <button className="security-center__quick-action">
                  <FileText size={24} />
                  <span>Security Log</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="security-center__recent-activity">
              <h3>Recent Security Events</h3>
              <div className="security-center__event-list">
                {threats.slice(0, 3).map(threat => (
                  <div key={threat.id} className={`security-center__event ${threat.type}`}>
                    <div className="event-icon">
                      {getThreatIcon(threat.type)}
                    </div>
                    <div className="event-content">
                      <span className="event-title">{threat.title}</span>
                      <span className="event-desc">{threat.description}</span>
                    </div>
                    <span className="event-time">{threat.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="security-center__threats">
            <div className="security-center__threat-stats">
              <div className="threat-stat-card blocked">
                <XCircle size={24} />
                <div className="stat-content">
                  <span className="stat-value">156</span>
                  <span className="stat-label">Threats Blocked</span>
                </div>
                <span className="stat-period">Last 30 days</span>
              </div>
              <div className="threat-stat-card warning">
                <AlertTriangle size={24} />
                <div className="stat-content">
                  <span className="stat-value">12</span>
                  <span className="stat-label">Warnings</span>
                </div>
                <span className="stat-period">Last 30 days</span>
              </div>
              <div className="threat-stat-card info">
                <Activity size={24} />
                <div className="stat-content">
                  <span className="stat-value">847</span>
                  <span className="stat-label">Events Logged</span>
                </div>
                <span className="stat-period">Last 30 days</span>
              </div>
              <div className="threat-stat-card success">
                <ShieldCheck size={24} />
                <div className="stat-content">
                  <span className="stat-value">99.8%</span>
                  <span className="stat-label">Protection Rate</span>
                </div>
                <span className="stat-period">All time</span>
              </div>
            </div>

            <div className="security-center__threat-list">
              <div className="threat-list-header">
                <h3>Recent Threat Activity</h3>
                <select className="threat-filter">
                  <option value="all">All Events</option>
                  <option value="blocked">Blocked</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div className="threat-list-content">
                {threats.map(threat => (
                  <div key={threat.id} className={`threat-item ${threat.type}`}>
                    <div className="threat-icon">
                      {getThreatIcon(threat.type)}
                    </div>
                    <div className="threat-details">
                      <div className="threat-header">
                        <span className="threat-title">{threat.title}</span>
                        <span className={`threat-badge ${threat.type}`}>{threat.type}</span>
                      </div>
                      <p className="threat-description">{threat.description}</p>
                      <div className="threat-meta">
                        <span className="threat-source">
                          <Globe size={14} />
                          {threat.source}
                        </span>
                        {threat.location && (
                          <span className="threat-location">
                            <MapPin size={14} />
                            {threat.location}
                          </span>
                        )}
                        <span className="threat-time">
                          <Clock size={14} />
                          {threat.timestamp}
                        </span>
                      </div>
                    </div>
                    <button className="threat-action-btn">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="security-center__sessions">
            <div className="sessions-header">
              <div className="sessions-info">
                <h3>Active Sessions</h3>
                <p>{sessions.length} devices currently logged in</p>
              </div>
              <button className="revoke-all-btn">
                <XCircle size={18} />
                Revoke All Other Sessions
              </button>
            </div>

            <div className="sessions-list">
              {sessions.map(session => (
                <div key={session.id} className={`session-card ${session.isCurrent ? 'current' : ''}`}>
                  <div className="session-device-icon">
                    {getDeviceIcon(session.deviceType)}
                  </div>
                  <div className="session-details">
                    <div className="session-header">
                      <span className="session-device">{session.device}</span>
                      {session.isCurrent && (
                        <span className="current-badge">Current Session</span>
                      )}
                    </div>
                    <span className="session-browser">{session.browser}</span>
                    <div className="session-meta">
                      <span className="session-location">
                        <MapPin size={14} />
                        {session.location}
                      </span>
                      <span className="session-ip">
                        <Globe size={14} />
                        {session.ip}
                      </span>
                      <span className="session-time">
                        <Clock size={14} />
                        {session.lastActive}
                      </span>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button 
                      className="revoke-session-btn"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="sessions-security-tips">
              <h4>
                <Zap size={18} />
                Security Tips
              </h4>
              <ul>
                <li>Regularly review your active sessions and revoke any you don't recognize</li>
                <li>Enable two-factor authentication for additional security</li>
                <li>Use a unique, strong password for your account</li>
                <li>Be cautious when logging in from public computers or networks</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="security-center__settings">
            {['authentication', 'notifications', 'session', 'access', 'api', 'data', 'compliance'].map(category => {
              const categorySettings = securitySettings.filter(s => s.category === category);
              if (categorySettings.length === 0) return null;
              
              return (
                <div key={category} className="settings-category">
                  <h3 className="settings-category-title">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div className="settings-list">
                    {categorySettings.map(setting => (
                      <div key={setting.id} className="setting-item">
                        <div className="setting-info">
                          <span className="setting-name">{setting.name}</span>
                          <span className="setting-description">{setting.description}</span>
                        </div>
                        <label className="setting-toggle">
                          <input
                            type="checkbox"
                            checked={setting.enabled}
                            onChange={() => handleToggleSetting(setting.id)}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="security-center__compliance">
            <div className="compliance-header">
              <h3>Compliance Status</h3>
              <p>Your account meets industry security standards</p>
            </div>

            <div className="compliance-badges">
              <div className="compliance-badge active">
                <ShieldCheck size={32} />
                <span className="badge-name">SOC 2</span>
                <span className="badge-status">Compliant</span>
              </div>
              <div className="compliance-badge active">
                <ShieldCheck size={32} />
                <span className="badge-name">GDPR</span>
                <span className="badge-status">Compliant</span>
              </div>
              <div className="compliance-badge active">
                <ShieldCheck size={32} />
                <span className="badge-name">HIPAA</span>
                <span className="badge-status">Compliant</span>
              </div>
              <div className="compliance-badge pending">
                <ShieldAlert size={32} />
                <span className="badge-name">ISO 27001</span>
                <span className="badge-status">In Progress</span>
              </div>
            </div>

            <div className="compliance-checklist">
              <h4>Security Checklist</h4>
              <div className="checklist-items">
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Data encryption at rest and in transit</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Multi-factor authentication enabled</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Regular security audits conducted</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Access controls implemented</span>
                </div>
                <div className="checklist-item passed">
                  <CheckCircle size={20} />
                  <span>Audit logging enabled</span>
                </div>
                <div className="checklist-item pending">
                  <Clock size={20} />
                  <span>Annual penetration testing scheduled</span>
                </div>
                <div className="checklist-item failed">
                  <XCircle size={20} />
                  <span>IP whitelisting not configured</span>
                </div>
              </div>
            </div>

            <div className="compliance-reports">
              <h4>Compliance Reports</h4>
              <div className="report-list">
                <div className="report-item">
                  <FileText size={20} />
                  <div className="report-info">
                    <span className="report-name">SOC 2 Type II Report</span>
                    <span className="report-date">Generated Jan 15, 2026</span>
                  </div>
                  <button className="download-btn">
                    <Download size={16} />
                  </button>
                </div>
                <div className="report-item">
                  <FileText size={20} />
                  <div className="report-info">
                    <span className="report-name">GDPR Compliance Report</span>
                    <span className="report-date">Generated Jan 10, 2026</span>
                  </div>
                  <button className="download-btn">
                    <Download size={16} />
                  </button>
                </div>
                <div className="report-item">
                  <FileText size={20} />
                  <div className="report-info">
                    <span className="report-name">Security Audit Summary</span>
                    <span className="report-date">Generated Jan 5, 2026</span>
                  </div>
                  <button className="download-btn">
                    <Download size={16} />
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
