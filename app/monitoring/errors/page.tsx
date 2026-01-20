'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bug,
  Search,
  Filter,
  RefreshCw,
  Download,
  Settings,
  Clock,
  ChevronDown,
  ChevronRight,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Server,
  Globe,
  Database,
  Code,
  Terminal,
  Copy,
  ExternalLink,
  Eye,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Bot,
  Cpu,
  CheckCircle,
  Trash2,
  Bell,
  Archive
} from 'lucide-react';
import './error-tracking.css';

interface ErrorEvent {
  id: string;
  type: 'error' | 'warning' | 'exception' | 'crash';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  source: 'frontend' | 'backend' | 'api' | 'database' | 'automation' | 'ai';
  file?: string;
  line?: number;
  stackTrace?: string[];
  timestamp: string;
  count: number;
  affectedUsers: number;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  firstSeen: string;
  lastSeen: string;
  browser?: string;
  os?: string;
  tags: string[];
}

interface ErrorStats {
  total: number;
  critical: number;
  resolved: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

const ERROR_EVENTS: ErrorEvent[] = [
  {
    id: '1',
    type: 'exception',
    severity: 'critical',
    title: 'Uncaught TypeError: Cannot read property of undefined',
    message: 'Cannot read property \'automation\' of undefined at AutomationEngine.js:245',
    source: 'frontend',
    file: 'AutomationEngine.tsx',
    line: 245,
    stackTrace: [
      'at AutomationEngine.execute (AutomationEngine.tsx:245:15)',
      'at WorkflowRunner.run (WorkflowRunner.tsx:128:8)',
      'at async handleStart (page.tsx:89:3)'
    ],
    timestamp: '2 minutes ago',
    count: 156,
    affectedUsers: 45,
    status: 'investigating',
    firstSeen: 'Today at 10:15 AM',
    lastSeen: '2 minutes ago',
    browser: 'Chrome 120',
    os: 'Windows 11',
    tags: ['automation', 'critical-path']
  },
  {
    id: '2',
    type: 'error',
    severity: 'high',
    title: 'Database connection pool exhausted',
    message: 'POOL_EXHAUSTED: All database connections are in use',
    source: 'database',
    stackTrace: [
      'at ConnectionPool.acquire (pool.rs:156)',
      'at DatabaseService.query (database.rs:89)',
      'at UserRepository.findById (users.rs:45)'
    ],
    timestamp: '15 minutes ago',
    count: 89,
    affectedUsers: 120,
    status: 'investigating',
    firstSeen: 'Today at 09:30 AM',
    lastSeen: '15 minutes ago',
    tags: ['database', 'performance']
  },
  {
    id: '3',
    type: 'warning',
    severity: 'medium',
    title: 'API rate limit approaching threshold',
    message: 'External API rate limit at 85% (8,500/10,000 requests)',
    source: 'api',
    timestamp: '32 minutes ago',
    count: 12,
    affectedUsers: 0,
    status: 'new',
    firstSeen: 'Today at 11:00 AM',
    lastSeen: '32 minutes ago',
    tags: ['api', 'rate-limit']
  },
  {
    id: '4',
    type: 'exception',
    severity: 'high',
    title: 'AI Model inference timeout',
    message: 'Request timeout after 30000ms waiting for model response',
    source: 'ai',
    file: 'AIService.rs',
    line: 178,
    stackTrace: [
      'at AIService.infer (AIService.rs:178)',
      'at SelectorGenerator.generate (selectors.rs:92)',
      'at async handleAIRequest (api.rs:45)'
    ],
    timestamp: '1 hour ago',
    count: 34,
    affectedUsers: 28,
    status: 'resolved',
    firstSeen: 'Yesterday at 04:30 PM',
    lastSeen: '1 hour ago',
    tags: ['ai', 'timeout', 'performance']
  },
  {
    id: '5',
    type: 'crash',
    severity: 'critical',
    title: 'Application crash on automation execution',
    message: 'SIGABRT: Process terminated unexpectedly',
    source: 'backend',
    stackTrace: [
      'at BrowserEngine.navigate (browser.rs:234)',
      'at AutomationWorker.execute (worker.rs:156)',
      'at main (main.rs:45)'
    ],
    timestamp: '2 hours ago',
    count: 8,
    affectedUsers: 8,
    status: 'resolved',
    firstSeen: 'Yesterday at 02:15 PM',
    lastSeen: '2 hours ago',
    os: 'Ubuntu 22.04',
    tags: ['crash', 'browser-engine', 'critical']
  },
  {
    id: '6',
    type: 'error',
    severity: 'low',
    title: 'Missing translation key',
    message: 'Translation not found for key: automation.advanced.retry_config',
    source: 'frontend',
    file: 'i18n.ts',
    line: 89,
    timestamp: '3 hours ago',
    count: 234,
    affectedUsers: 0,
    status: 'ignored',
    firstSeen: '3 days ago',
    lastSeen: '3 hours ago',
    browser: 'Firefox 121',
    tags: ['i18n', 'minor']
  }
];

const SOURCE_ICONS: { [key: string]: React.ElementType } = {
  frontend: Globe,
  backend: Server,
  api: Zap,
  database: Database,
  automation: Bot,
  ai: Cpu
};

export default function ErrorTrackingPage() {
  const [errors, setErrors] = useState<ErrorEvent[]>(ERROR_EVENTS);
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const stats: ErrorStats = {
    total: errors.length,
    critical: errors.filter(e => e.severity === 'critical').length,
    resolved: errors.filter(e => e.status === 'resolved').length,
    trend: 'down',
    changePercent: 15
  };

  const filteredErrors = errors.filter(error => {
    const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter;
    const matchesSource = sourceFilter === 'all' || error.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || error.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      error.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      error.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSource && matchesStatus && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedErrors(newExpanded);
  };

  const updateStatus = (id: string, status: ErrorEvent['status']) => {
    setErrors(errors.map(e => 
      e.id === id ? { ...e, status } : e
    ));
    if (selectedError?.id === id) {
      setSelectedError({ ...selectedError, status });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return XCircle;
      case 'high': return AlertTriangle;
      case 'medium': return AlertCircle;
      case 'low': return Info;
      default: return AlertCircle;
    }
  };

  const getSourceIcon = (source: string) => {
    return SOURCE_ICONS[source] || Server;
  };

  return (
    <div className="error-tracking">
      <header className="error-tracking__header">
        <div className="error-tracking__title-section">
          <div className="error-tracking__icon">
            <Bug size={28} />
          </div>
          <div>
            <h1>Error Tracking</h1>
            <p>Monitor, debug, and resolve application errors in real-time</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-outline">
            <Bell size={16} />
            Alert Rules
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="error-tracking__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Bug size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Errors</span>
          </div>
          <div className={`stat-trend ${stats.trend}`}>
            {stats.trend === 'down' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            <span>{stats.changePercent}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon critical">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon investigating">
            <Eye size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{errors.filter(e => e.status === 'investigating').length}</span>
            <span className="stat-label">Investigating</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      </div>

      <div className="error-tracking__filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select 
            value={sourceFilter} 
            onChange={(e) => setSourceFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sources</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="api">API</option>
            <option value="database">Database</option>
            <option value="automation">Automation</option>
            <option value="ai">AI</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
      </div>

      <div className="error-tracking__content">
        <div className="errors-list">
          {filteredErrors.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} />
              <h3>No errors found</h3>
              <p>All systems are running smoothly</p>
            </div>
          ) : (
            filteredErrors.map(error => {
              const SeverityIcon = getSeverityIcon(error.severity);
              const SourceIcon = getSourceIcon(error.source);
              const isExpanded = expandedErrors.has(error.id);

              return (
                <div 
                  key={error.id} 
                  className={`error-card ${error.severity} ${error.status} ${selectedError?.id === error.id ? 'selected' : ''}`}
                  onClick={() => setSelectedError(error)}
                >
                  <div className="error-main">
                    <button 
                      className="expand-btn"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(error.id); }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className={`severity-icon ${error.severity}`}>
                      <SeverityIcon size={18} />
                    </div>

                    <div className="error-info">
                      <div className="error-header">
                        <h4 className="error-title">{error.title}</h4>
                        <div className="error-badges">
                          <span className={`severity-badge ${error.severity}`}>{error.severity}</span>
                          <span className={`status-badge ${error.status}`}>{error.status}</span>
                        </div>
                      </div>

                      <p className="error-message">{error.message}</p>

                      <div className="error-meta">
                        <span className="source">
                          <SourceIcon size={14} />
                          {error.source}
                        </span>
                        {error.file && (
                          <span className="file">
                            <Code size={14} />
                            {error.file}:{error.line}
                          </span>
                        )}
                        <span className="count">
                          <BarChart3 size={14} />
                          {error.count} occurrences
                        </span>
                        <span className="users">
                          <Users size={14} />
                          {error.affectedUsers} users
                        </span>
                        <span className="timestamp">
                          <Clock size={14} />
                          {error.timestamp}
                        </span>
                      </div>

                      {error.tags.length > 0 && (
                        <div className="error-tags">
                          {error.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="error-actions">
                      <button 
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); updateStatus(error.id, 'resolved'); }}
                        title="Mark Resolved"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); updateStatus(error.id, 'ignored'); }}
                        title="Ignore"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && error.stackTrace && (
                    <div className="error-expanded">
                      <div className="stack-trace">
                        <div className="trace-header">
                          <Terminal size={16} />
                          <span>Stack Trace</span>
                          <button className="copy-btn">
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                        <pre className="trace-content">
                          {error.stackTrace.map((line, i) => (
                            <code key={i}>{line}</code>
                          ))}
                        </pre>
                      </div>

                      <div className="error-details-grid">
                        <div className="detail-item">
                          <span className="label">First Seen</span>
                          <span className="value">{error.firstSeen}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Last Seen</span>
                          <span className="value">{error.lastSeen}</span>
                        </div>
                        {error.browser && (
                          <div className="detail-item">
                            <span className="label">Browser</span>
                            <span className="value">{error.browser}</span>
                          </div>
                        )}
                        {error.os && (
                          <div className="detail-item">
                            <span className="label">OS</span>
                            <span className="value">{error.os}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {selectedError && (
          <aside className="error-sidebar">
            <div className="sidebar-header">
              <h3>Error Details</h3>
              <button className="close-sidebar" onClick={() => setSelectedError(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="sidebar-content">
              <div className="sidebar-section">
                <h4>Status</h4>
                <div className="status-buttons">
                  {['new', 'investigating', 'resolved', 'ignored'].map(status => (
                    <button
                      key={status}
                      className={`status-btn ${selectedError.status === status ? 'active' : ''}`}
                      onClick={() => updateStatus(selectedError.id, status as ErrorEvent['status'])}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h4>Impact</h4>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <span className="impact-value">{selectedError.count}</span>
                    <span className="impact-label">Occurrences</span>
                  </div>
                  <div className="impact-stat">
                    <span className="impact-value">{selectedError.affectedUsers}</span>
                    <span className="impact-label">Users Affected</span>
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h4>Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <span className="timeline-title">First Occurrence</span>
                      <span className="timeline-time">{selectedError.firstSeen}</span>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <span className="timeline-title">Last Occurrence</span>
                      <span className="timeline-time">{selectedError.lastSeen}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h4>Actions</h4>
                <div className="sidebar-actions">
                  <button className="sidebar-action-btn">
                    <ExternalLink size={16} />
                    View in Source
                  </button>
                  <button className="sidebar-action-btn">
                    <Copy size={16} />
                    Copy Error ID
                  </button>
                  <button className="sidebar-action-btn danger">
                    <Trash2 size={16} />
                    Delete Error
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
