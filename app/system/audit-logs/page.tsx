'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Shield,
  Database,
  Settings,
  Eye,
  ChevronRight,
  Clock,
  MapPin,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  RefreshCw,
  ChevronDown,
  FileJson,
  FilePen,
  Trash2,
  LogIn,
  LogOut,
  Key,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  Globe,
  Mail
} from 'lucide-react';
import './audit-logs.css';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'authentication' | 'user' | 'data' | 'security' | 'system' | 'api' | 'settings';
  severity: 'info' | 'warning' | 'critical';
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  target?: {
    type: string;
    id: string;
    name: string;
  };
  details: Record<string, string | number | boolean>;
  location: {
    ip: string;
    city: string;
    country: string;
  };
  userAgent: string;
  result: 'success' | 'failure' | 'blocked';
}

const SAMPLE_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2025-01-29T14:32:18Z',
    action: 'user.login.success',
    category: 'authentication',
    severity: 'info',
    actor: {
      id: 'usr-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      role: 'Admin',
    },
    details: {
      method: 'password',
      mfaUsed: true,
      sessionDuration: '8h',
    },
    location: {
      ip: '192.168.1.105',
      city: 'San Francisco',
      country: 'United States',
    },
    userAgent: 'Chrome 120.0 / macOS 14.2',
    result: 'success',
  },
  {
    id: 'log-002',
    timestamp: '2025-01-29T14:28:45Z',
    action: 'api.key.created',
    category: 'security',
    severity: 'warning',
    actor: {
      id: 'usr-002',
      name: 'Michael Chen',
      email: 'michael.c@techcorp.com',
      role: 'Developer',
    },
    target: {
      type: 'api_key',
      id: 'key-prod-abc123',
      name: 'Production API Key',
    },
    details: {
      scopes: 'read,write',
      environment: 'production',
      expiresIn: '90 days',
    },
    location: {
      ip: '10.0.0.55',
      city: 'New York',
      country: 'United States',
    },
    userAgent: 'Firefox 121.0 / Windows 11',
    result: 'success',
  },
  {
    id: 'log-003',
    timestamp: '2025-01-29T14:15:22Z',
    action: 'user.login.failed',
    category: 'authentication',
    severity: 'critical',
    actor: {
      id: 'unknown',
      name: 'Unknown',
      email: 'admin@techcorp.com',
      role: 'Unknown',
    },
    details: {
      reason: 'Invalid password',
      attempts: 5,
      accountLocked: true,
    },
    location: {
      ip: '45.33.32.156',
      city: 'Berlin',
      country: 'Germany',
    },
    userAgent: 'Unknown Browser / Linux',
    result: 'blocked',
  },
  {
    id: 'log-004',
    timestamp: '2025-01-29T13:58:11Z',
    action: 'data.export.completed',
    category: 'data',
    severity: 'info',
    actor: {
      id: 'usr-003',
      name: 'Emily Davis',
      email: 'emily.d@techcorp.com',
      role: 'Manager',
    },
    target: {
      type: 'export',
      id: 'exp-001',
      name: 'Monthly Report Q4 2024',
    },
    details: {
      format: 'CSV',
      records: 15420,
      fileSize: '2.4 MB',
    },
    location: {
      ip: '192.168.1.78',
      city: 'San Francisco',
      country: 'United States',
    },
    userAgent: 'Safari 17.2 / macOS 14.2',
    result: 'success',
  },
  {
    id: 'log-005',
    timestamp: '2025-01-29T13:42:55Z',
    action: 'settings.security.updated',
    category: 'settings',
    severity: 'warning',
    actor: {
      id: 'usr-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      role: 'Admin',
    },
    target: {
      type: 'setting',
      id: 'mfa-policy',
      name: 'MFA Requirements',
    },
    details: {
      oldValue: 'optional',
      newValue: 'required',
      affectedUsers: 156,
    },
    location: {
      ip: '192.168.1.105',
      city: 'San Francisco',
      country: 'United States',
    },
    userAgent: 'Chrome 120.0 / macOS 14.2',
    result: 'success',
  },
  {
    id: 'log-006',
    timestamp: '2025-01-29T13:30:08Z',
    action: 'user.role.changed',
    category: 'user',
    severity: 'warning',
    actor: {
      id: 'usr-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      role: 'Admin',
    },
    target: {
      type: 'user',
      id: 'usr-004',
      name: 'David Wilson',
    },
    details: {
      oldRole: 'Viewer',
      newRole: 'Developer',
      department: 'Engineering',
    },
    location: {
      ip: '192.168.1.105',
      city: 'San Francisco',
      country: 'United States',
    },
    userAgent: 'Chrome 120.0 / macOS 14.2',
    result: 'success',
  },
  {
    id: 'log-007',
    timestamp: '2025-01-29T12:55:33Z',
    action: 'api.request.rate_limited',
    category: 'api',
    severity: 'warning',
    actor: {
      id: 'app-002',
      name: 'Mobile App',
      email: 'system@techcorp.com',
      role: 'Service',
    },
    target: {
      type: 'endpoint',
      id: '/api/v1/data',
      name: 'Data Sync Endpoint',
    },
    details: {
      limit: 1000,
      requests: 1250,
      window: '1 minute',
    },
    location: {
      ip: '34.102.136.180',
      city: 'Los Angeles',
      country: 'United States',
    },
    userAgent: 'CUBE-SDK/2.0.1',
    result: 'blocked',
  },
  {
    id: 'log-008',
    timestamp: '2025-01-29T12:22:17Z',
    action: 'user.created',
    category: 'user',
    severity: 'info',
    actor: {
      id: 'usr-001',
      name: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      role: 'Admin',
    },
    target: {
      type: 'user',
      id: 'usr-005',
      name: 'Jessica Martinez',
    },
    details: {
      email: 'jessica.m@techcorp.com',
      role: 'Developer',
      invitedVia: 'Email',
    },
    location: {
      ip: '192.168.1.105',
      city: 'San Francisco',
      country: 'United States',
    },
    userAgent: 'Chrome 120.0 / macOS 14.2',
    result: 'success',
  },
  {
    id: 'log-009',
    timestamp: '2025-01-29T11:48:42Z',
    action: 'data.deleted',
    category: 'data',
    severity: 'critical',
    actor: {
      id: 'usr-003',
      name: 'Emily Davis',
      email: 'emily.d@techcorp.com',
      role: 'Manager',
    },
    target: {
      type: 'dataset',
      id: 'ds-legacy-001',
      name: 'Legacy Customer Data 2019',
    },
    details: {
      records: 8500,
      retention: 'Compliance: 5 years',
      approvedBy: 'Legal Department',
    },
    location: {
      ip: '192.168.1.78',
      city: 'San Francisco',
      country: 'United States',
    },
    userAgent: 'Safari 17.2 / macOS 14.2',
    result: 'success',
  },
  {
    id: 'log-010',
    timestamp: '2025-01-29T11:15:09Z',
    action: 'system.backup.completed',
    category: 'system',
    severity: 'info',
    actor: {
      id: 'system',
      name: 'System',
      email: 'system@cube.io',
      role: 'System',
    },
    target: {
      type: 'backup',
      id: 'bkp-20250129',
      name: 'Daily Backup',
    },
    details: {
      size: '145 GB',
      duration: '23 minutes',
      destination: 'AWS S3',
    },
    location: {
      ip: '172.16.0.1',
      city: 'AWS us-east-1',
      country: 'United States',
    },
    userAgent: 'CUBE-Backup-Agent/1.0',
    result: 'success',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: FileText },
  { id: 'authentication', label: 'Authentication', icon: LogIn },
  { id: 'user', label: 'User Management', icon: User },
  { id: 'data', label: 'Data Operations', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Settings },
  { id: 'api', label: 'API', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const getActionIcon = (action: string): React.ReactNode => {
  if (action.includes('login.success')) return <LogIn size={16} />;
  if (action.includes('login.failed')) return <LogOut size={16} />;
  if (action.includes('logout')) return <LogOut size={16} />;
  if (action.includes('created') && action.includes('user')) return <UserPlus size={16} />;
  if (action.includes('deleted') && action.includes('user')) return <UserMinus size={16} />;
  if (action.includes('role')) return <Shield size={16} />;
  if (action.includes('key')) return <Key size={16} />;
  if (action.includes('export')) return <Download size={16} />;
  if (action.includes('deleted')) return <Trash2 size={16} />;
  if (action.includes('updated')) return <FilePen size={16} />;
  if (action.includes('rate_limited')) return <AlertTriangle size={16} />;
  if (action.includes('backup')) return <Database size={16} />;
  if (action.includes('locked')) return <Lock size={16} />;
  if (action.includes('unlocked')) return <Unlock size={16} />;
  if (action.includes('email')) return <Mail size={16} />;
  return <FileText size={16} />;
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(SAMPLE_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('7d');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.target?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSeverity = !selectedSeverity || log.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const severityStats = {
    info: logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    critical: logs.filter(l => l.severity === 'critical').length,
  };

  const resultStats = {
    success: logs.filter(l => l.result === 'success').length,
    failure: logs.filter(l => l.result === 'failure').length,
    blocked: logs.filter(l => l.result === 'blocked').length,
  };

  return (
    <div className="audit-logs">
      {/* Header */}
      <header className="audit-logs__header">
        <div className="audit-logs__title-section">
          <div className="audit-logs__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Audit Logs</h1>
            <p>Track all system activities and security events</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Calendar size={18} />
            <span>Date Range</span>
            <ChevronDown size={16} />
          </button>
          <button className="btn-outline">
            <Download size={18} />
            Export
          </button>
          <button className="btn-primary">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="audit-logs__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{logs.length.toLocaleString()}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <Info size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{severityStats.info}</span>
            <span className="stat-label">Info Events</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{severityStats.warning}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon critical">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{severityStats.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="audit-logs__toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by action, user, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <div className="date-selector">
            {['1h', '24h', '7d', '30d', '90d'].map(range => (
              <button
                key={range}
                className={`date-btn ${dateRange === range ? 'active' : ''}`}
                onClick={() => setDateRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Category</label>
            <div className="filter-options">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-option ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Severity</label>
            <div className="filter-options">
              <button
                className={`filter-option ${!selectedSeverity ? 'active' : ''}`}
                onClick={() => setSelectedSeverity(null)}
              >
                All
              </button>
              <button
                className={`filter-option info ${selectedSeverity === 'info' ? 'active' : ''}`}
                onClick={() => setSelectedSeverity('info')}
              >
                <Info size={14} />
                Info
              </button>
              <button
                className={`filter-option warning ${selectedSeverity === 'warning' ? 'active' : ''}`}
                onClick={() => setSelectedSeverity('warning')}
              >
                <AlertTriangle size={14} />
                Warning
              </button>
              <button
                className={`filter-option critical ${selectedSeverity === 'critical' ? 'active' : ''}`}
                onClick={() => setSelectedSeverity('critical')}
              >
                <Shield size={14} />
                Critical
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Result</label>
            <div className="filter-options">
              <button className="filter-option">All ({logs.length})</button>
              <button className="filter-option success">
                <CheckCircle size={14} />
                Success ({resultStats.success})
              </button>
              <button className="filter-option blocked">
                <X size={14} />
                Blocked ({resultStats.blocked})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="audit-logs__grid">
        {/* Logs List */}
        <div className="logs-section">
          <div className="section-header">
            <h2>Event Log</h2>
            <span className="log-count">{filteredLogs.length} events</span>
          </div>
          <div className="logs-table">
            <div className="table-header">
              <div className="col-timestamp">Timestamp</div>
              <div className="col-action">Action</div>
              <div className="col-actor">Actor</div>
              <div className="col-target">Target</div>
              <div className="col-result">Result</div>
              <div className="col-actions"></div>
            </div>
            <div className="table-body">
              {filteredLogs.map(log => (
                <div 
                  key={log.id} 
                  className={`log-row ${log.severity}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="col-timestamp">
                    <span className="timestamp">{formatTimestamp(log.timestamp)}</span>
                    <span className="relative-time">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                  <div className="col-action">
                    <div className="action-info">
                      <span className={`action-icon ${log.category}`}>
                        {getActionIcon(log.action)}
                      </span>
                      <div>
                        <span className="action-name">{log.action.replace(/\./g, ' › ')}</span>
                        <span className={`severity-badge ${log.severity}`}>
                          {log.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-actor">
                    <div className="actor-info">
                      <div className="actor-avatar">
                        {log.actor.name.charAt(0)}
                      </div>
                      <div>
                        <span className="actor-name">{log.actor.name}</span>
                        <span className="actor-email">{log.actor.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-target">
                    {log.target ? (
                      <div className="target-info">
                        <span className="target-type">{log.target.type}</span>
                        <span className="target-name">{log.target.name}</span>
                      </div>
                    ) : (
                      <span className="no-target">—</span>
                    )}
                  </div>
                  <div className="col-result">
                    <span className={`result-badge ${log.result}`}>
                      {log.result === 'success' && <CheckCircle size={14} />}
                      {log.result === 'failure' && <X size={14} />}
                      {log.result === 'blocked' && <Shield size={14} />}
                      {log.result}
                    </span>
                  </div>
                  <div className="col-actions">
                    <ChevronRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="audit-logs__sidebar">
          {/* Quick Filters */}
          <div className="quick-filters">
            <h3>Quick Filters</h3>
            <div className="quick-filter-list">
              <button className="quick-filter-item">
                <LogIn size={16} />
                <span>Login Attempts</span>
                <span className="count">24</span>
              </button>
              <button className="quick-filter-item">
                <Shield size={16} />
                <span>Security Events</span>
                <span className="count">8</span>
              </button>
              <button className="quick-filter-item">
                <Database size={16} />
                <span>Data Changes</span>
                <span className="count">12</span>
              </button>
              <button className="quick-filter-item">
                <User size={16} />
                <span>User Actions</span>
                <span className="count">45</span>
              </button>
              <button className="quick-filter-item warning">
                <AlertTriangle size={16} />
                <span>Failed Actions</span>
                <span className="count">3</span>
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="activity-timeline">
            <h3>Recent Activity</h3>
            <div className="timeline-list">
              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-dot ${log.severity}`}></div>
                  <div className="timeline-content">
                    <span className="timeline-action">{log.action.split('.').pop()}</span>
                    <span className="timeline-time">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="export-section">
            <h3>Export Logs</h3>
            <div className="export-options">
              <button className="export-btn">
                <FileJson size={18} />
                <span>Export as JSON</span>
              </button>
              <button className="export-btn">
                <FileText size={18} />
                <span>Export as CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>Event Details</h2>
                <span className={`severity-badge ${selectedLog.severity}`}>
                  {selectedLog.severity}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedLog(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Event Info */}
              <div className="detail-section">
                <h3>Event Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Event ID</span>
                    <span className="value mono">{selectedLog.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Action</span>
                    <span className="value">{selectedLog.action}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Category</span>
                    <span className={`category-badge ${selectedLog.category}`}>
                      {selectedLog.category}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Result</span>
                    <span className={`result-badge ${selectedLog.result}`}>
                      {selectedLog.result}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Timestamp</span>
                    <span className="value">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actor Info */}
              <div className="detail-section">
                <h3>Actor</h3>
                <div className="actor-detail">
                  <div className="actor-avatar large">
                    {selectedLog.actor.name.charAt(0)}
                  </div>
                  <div className="actor-info">
                    <span className="name">{selectedLog.actor.name}</span>
                    <span className="email">{selectedLog.actor.email}</span>
                    <span className="role">{selectedLog.actor.role}</span>
                  </div>
                </div>
              </div>

              {/* Target Info */}
              {selectedLog.target && (
                <div className="detail-section">
                  <h3>Target</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Type</span>
                      <span className="value">{selectedLog.target.type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">ID</span>
                      <span className="value mono">{selectedLog.target.id}</span>
                    </div>
                    <div className="detail-item full">
                      <span className="label">Name</span>
                      <span className="value">{selectedLog.target.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="detail-section">
                <h3>Additional Details</h3>
                <div className="details-list">
                  {Object.entries(selectedLog.details).map(([key, value]) => (
                    <div key={key} className="detail-row">
                      <span className="key">{key}</span>
                      <span className="value">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="detail-section">
                <h3>Location &amp; Device</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">
                      <MapPin size={14} />
                      IP Address
                    </span>
                    <span className="value mono">{selectedLog.location.ip}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">
                      <Globe size={14} />
                      Location
                    </span>
                    <span className="value">
                      {selectedLog.location.city}, {selectedLog.location.country}
                    </span>
                  </div>
                  <div className="detail-item full">
                    <span className="label">
                      <Monitor size={14} />
                      User Agent
                    </span>
                    <span className="value">{selectedLog.userAgent}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline">
                <Download size={18} />
                Export Event
              </button>
              <button className="btn-primary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
