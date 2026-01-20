'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Server, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreVertical,
  Layers,
  Calendar,
  HardDrive,
  ExternalLink,
  Copy,
  Terminal,
  Database,
  Cloud,
  AlertCircle,
  Bug,
  Info,
  Trash2,
  Archive,
  Bookmark,
  PlayCircle,
  PauseCircle,
  Sliders,
  Zap,
  Hash
} from 'lucide-react';
import './log-aggregation.css';

interface LogSource {
  id: string;
  name: string;
  type: 'kubernetes' | 'application' | 'system' | 'cloud' | 'database' | 'security';
  status: 'active' | 'paused' | 'error';
  host: string;
  logsPerMinute: number;
  bytesPerDay: number;
  retentionDays: number;
  lastReceived: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  source: string;
  service: string;
  message: string;
  traceId?: string;
  spanId?: string;
  metadata: Record<string, string>;
}

interface LogStream {
  id: string;
  name: string;
  query: string;
  sources: string[];
  status: 'active' | 'paused';
  eventsPerSec: number;
  alertsEnabled: boolean;
}

interface LogAlert {
  id: string;
  name: string;
  query: string;
  condition: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'firing' | 'resolved' | 'muted';
  lastTriggered: string | null;
  notificationChannels: string[];
}

const LOG_SOURCES: LogSource[] = [
  {
    id: 'src-001',
    name: 'Kubernetes Cluster',
    type: 'kubernetes',
    status: 'active',
    host: 'k8s.cube.internal',
    logsPerMinute: 125000,
    bytesPerDay: 45000000000,
    retentionDays: 30,
    lastReceived: '2025-01-15 14:55:32'
  },
  {
    id: 'src-002',
    name: 'API Gateway',
    type: 'application',
    status: 'active',
    host: 'api-gateway-*',
    logsPerMinute: 45000,
    bytesPerDay: 18000000000,
    retentionDays: 90,
    lastReceived: '2025-01-15 14:55:35'
  },
  {
    id: 'src-003',
    name: 'PostgreSQL Primary',
    type: 'database',
    status: 'active',
    host: 'postgres-primary.cube.internal',
    logsPerMinute: 8500,
    bytesPerDay: 2500000000,
    retentionDays: 60,
    lastReceived: '2025-01-15 14:55:30'
  },
  {
    id: 'src-004',
    name: 'AWS CloudWatch',
    type: 'cloud',
    status: 'active',
    host: 'cloudwatch.us-east-1',
    logsPerMinute: 32000,
    bytesPerDay: 12000000000,
    retentionDays: 14,
    lastReceived: '2025-01-15 14:55:28'
  },
  {
    id: 'src-005',
    name: 'Security Audit',
    type: 'security',
    status: 'active',
    host: 'audit.cube.internal',
    logsPerMinute: 2500,
    bytesPerDay: 850000000,
    retentionDays: 365,
    lastReceived: '2025-01-15 14:55:25'
  },
  {
    id: 'src-006',
    name: 'Legacy System',
    type: 'system',
    status: 'error',
    host: 'legacy.cube.internal',
    logsPerMinute: 0,
    bytesPerDay: 0,
    retentionDays: 7,
    lastReceived: '2025-01-15 10:30:00'
  }
];

const LOG_ENTRIES: LogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2025-01-15T14:55:35.123Z',
    level: 'error',
    source: 'api-gateway',
    service: 'cube-api-gateway',
    message: 'Connection refused to upstream service: payment-service:8080',
    traceId: 'abc123def456',
    spanId: 'span789',
    metadata: { method: 'POST', path: '/api/v1/payments', status_code: '503' }
  },
  {
    id: 'log-002',
    timestamp: '2025-01-15T14:55:34.892Z',
    level: 'warn',
    source: 'user-service',
    service: 'cube-user-service',
    message: 'Rate limit exceeded for client: 192.168.1.100',
    traceId: 'def456ghi789',
    metadata: { client_ip: '192.168.1.100', rate_limit: '1000/min' }
  },
  {
    id: 'log-003',
    timestamp: '2025-01-15T14:55:34.456Z',
    level: 'info',
    source: 'order-service',
    service: 'cube-order-service',
    message: 'Order created successfully: ORD-2025-45892',
    traceId: 'ghi789jkl012',
    metadata: { order_id: 'ORD-2025-45892', user_id: 'USR-12345', amount: '299.99' }
  },
  {
    id: 'log-004',
    timestamp: '2025-01-15T14:55:33.789Z',
    level: 'debug',
    source: 'auth-service',
    service: 'cube-auth-service',
    message: 'Token validation successful for user: john.doe@example.com',
    traceId: 'jkl012mno345',
    metadata: { user_email: 'john.doe@example.com', token_type: 'JWT' }
  },
  {
    id: 'log-005',
    timestamp: '2025-01-15T14:55:32.567Z',
    level: 'fatal',
    source: 'payment-service',
    service: 'cube-payment-service',
    message: 'Critical: Database connection pool exhausted. All connections in use.',
    traceId: 'mno345pqr678',
    metadata: { pool_size: '100', active_connections: '100', waiting: '45' }
  },
  {
    id: 'log-006',
    timestamp: '2025-01-15T14:55:31.234Z',
    level: 'info',
    source: 'kubernetes',
    service: 'kube-scheduler',
    message: 'Successfully assigned cube-production/api-gateway-7f8d9c6b5-x2k9p to node-3',
    metadata: { namespace: 'cube-production', pod: 'api-gateway-7f8d9c6b5-x2k9p', node: 'node-3' }
  },
  {
    id: 'log-007',
    timestamp: '2025-01-15T14:55:30.890Z',
    level: 'warn',
    source: 'postgres',
    service: 'postgresql',
    message: 'Slow query detected: SELECT * FROM orders WHERE created_at > ... (2450ms)',
    metadata: { query_time: '2450ms', affected_rows: '15420', table: 'orders' }
  },
  {
    id: 'log-008',
    timestamp: '2025-01-15T14:55:29.456Z',
    level: 'error',
    source: 'security',
    service: 'cube-security',
    message: 'Authentication failure: Invalid credentials for user admin@cube.io',
    traceId: 'pqr678stu901',
    metadata: { username: 'admin@cube.io', attempt: '3', ip: '203.0.113.50' }
  }
];

const LOG_STREAMS: LogStream[] = [
  {
    id: 'stream-001',
    name: 'Production Errors',
    query: 'level:error OR level:fatal',
    sources: ['api-gateway', 'user-service', 'order-service', 'payment-service'],
    status: 'active',
    eventsPerSec: 12,
    alertsEnabled: true
  },
  {
    id: 'stream-002',
    name: 'Security Events',
    query: 'source:security OR message:*authentication*',
    sources: ['security', 'auth-service'],
    status: 'active',
    eventsPerSec: 45,
    alertsEnabled: true
  },
  {
    id: 'stream-003',
    name: 'Database Performance',
    query: 'source:postgres AND (message:*slow* OR message:*timeout*)',
    sources: ['postgres'],
    status: 'active',
    eventsPerSec: 3,
    alertsEnabled: true
  },
  {
    id: 'stream-004',
    name: 'Kubernetes Events',
    query: 'source:kubernetes',
    sources: ['kubernetes'],
    status: 'active',
    eventsPerSec: 85,
    alertsEnabled: false
  }
];

const LOG_ALERTS: LogAlert[] = [
  {
    id: 'alert-001',
    name: 'High Error Rate',
    query: 'level:error | stats count() as errors by service | where errors > 100',
    condition: 'errors > 100 in 5m',
    severity: 'critical',
    status: 'firing',
    lastTriggered: '2025-01-15 14:50:00',
    notificationChannels: ['slack-ops', 'pagerduty', 'email-oncall']
  },
  {
    id: 'alert-002',
    name: 'Database Connection Issues',
    query: 'message:*connection* AND (level:error OR level:fatal)',
    condition: 'count > 5 in 1m',
    severity: 'critical',
    status: 'firing',
    lastTriggered: '2025-01-15 14:55:00',
    notificationChannels: ['slack-dba', 'pagerduty']
  },
  {
    id: 'alert-003',
    name: 'Authentication Failures',
    query: 'source:security AND message:*failure*',
    condition: 'count > 10 in 5m',
    severity: 'high',
    status: 'active',
    lastTriggered: null,
    notificationChannels: ['slack-security', 'email-security']
  },
  {
    id: 'alert-004',
    name: 'Slow Queries',
    query: 'source:postgres AND message:*slow*',
    condition: 'count > 20 in 10m',
    severity: 'medium',
    status: 'muted',
    lastTriggered: '2025-01-15 12:00:00',
    notificationChannels: ['slack-dba']
  }
];

const SOURCE_TYPE_CONFIG: Record<LogSource['type'], { color: string; bg: string; icon: React.ElementType }> = {
  kubernetes: { color: '#326CE5', bg: 'rgba(50, 108, 229, 0.15)', icon: Layers },
  application: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: Terminal },
  system: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', icon: Server },
  cloud: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Cloud },
  database: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: Database },
  security: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertCircle }
};

const LEVEL_CONFIG: Record<LogEntry['level'], { color: string; bg: string; icon: React.ElementType }> = {
  debug: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', icon: Bug },
  info: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Info },
  warn: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle },
  error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
  fatal: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.25)', icon: AlertCircle }
};

const SEVERITY_CONFIG: Record<LogAlert['severity'], { color: string; bg: string }> = {
  critical: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }
};

const ALERT_STATUS_CONFIG: Record<LogAlert['status'], { color: string; bg: string }> = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  firing: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  resolved: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  muted: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
};

export default function LogAggregationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'sources' | 'streams' | 'alerts'>('overview');
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [liveMode, setLiveMode] = useState(true);

  const filteredLogs = LOG_ENTRIES.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const totalLogsPerMin = LOG_SOURCES.reduce((sum, s) => sum + s.logsPerMinute, 0);
  const totalBytesPerDay = LOG_SOURCES.reduce((sum, s) => sum + s.bytesPerDay, 0);
  const errorLogs = LOG_ENTRIES.filter(l => l.level === 'error' || l.level === 'fatal').length;
  const firingAlerts = LOG_ALERTS.filter(a => a.status === 'firing').length;

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1000000000000) return `${(bytes / 1000000000000).toFixed(1)} TB`;
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(1)} KB`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'sources', label: 'Sources', icon: Server, count: LOG_SOURCES.length },
    { id: 'streams', label: 'Streams', icon: Activity, count: LOG_STREAMS.length },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: firingAlerts > 0 ? firingAlerts : undefined }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-metrics">
        <div className="metric-card large">
          <div className="metric-header">
            <h3>Log Volume</h3>
            <span className="trend positive">
              <ArrowUpRight size={14} />
              +12%
            </span>
          </div>
          <div className="volume-chart">
            <div className="volume-bars">
              <div className="volume-bar" style={{ height: '45%' }}><span>Mon</span></div>
              <div className="volume-bar" style={{ height: '62%' }}><span>Tue</span></div>
              <div className="volume-bar" style={{ height: '78%' }}><span>Wed</span></div>
              <div className="volume-bar" style={{ height: '55%' }}><span>Thu</span></div>
              <div className="volume-bar" style={{ height: '88%' }}><span>Fri</span></div>
              <div className="volume-bar" style={{ height: '42%' }}><span>Sat</span></div>
              <div className="volume-bar active" style={{ height: '95%' }}><span>Sun</span></div>
            </div>
          </div>
          <div className="metric-footer">
            <span>{formatBytes(totalBytesPerDay)}/day</span>
            <span>{formatNumber(totalLogsPerMin)}/min</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Ingestion Rate</h3>
          </div>
          <div className="metric-value">
            <span className="value">{formatNumber(totalLogsPerMin)}</span>
            <span className="unit">/min</span>
          </div>
          <div className="metric-label">Events per minute</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Error Events</h3>
            {errorLogs > 0 && (
              <span className="trend negative">
                <ArrowUpRight size={14} />
                +{errorLogs}
              </span>
            )}
          </div>
          <div className="metric-value">
            <span className={`value ${errorLogs > 5 ? 'warning' : ''}`}>{errorLogs}</span>
          </div>
          <div className="metric-label">In last 5 minutes</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Active Alerts</h3>
          </div>
          <div className="metric-value">
            <span className={`value ${firingAlerts > 0 ? 'error' : 'healthy'}`}>{firingAlerts}</span>
          </div>
          <div className="metric-label">Alerts firing</div>
        </div>
      </div>

      <div className="overview-panels">
        <div className="panel recent-logs">
          <div className="panel-header">
            <h3>Recent Events</h3>
            <div className="live-toggle">
              <button 
                className={`live-btn ${liveMode ? 'active' : ''}`}
                onClick={() => setLiveMode(!liveMode)}
              >
                {liveMode ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                {liveMode ? 'Live' : 'Paused'}
              </button>
            </div>
          </div>
          <div className="logs-preview">
            {LOG_ENTRIES.slice(0, 5).map(log => {
              const levelConfig = LEVEL_CONFIG[log.level];
              const LevelIcon = levelConfig.icon;
              return (
                <div 
                  key={log.id} 
                  className={`log-item ${log.level}`}
                  onClick={() => setSelectedEntry(log)}
                >
                  <span 
                    className="log-level"
                    style={{ background: levelConfig.bg, color: levelConfig.color }}
                  >
                    <LevelIcon size={12} />
                  </span>
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="log-source">{log.service}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              );
            })}
          </div>
          <button className="view-all-btn">View All Logs</button>
        </div>

        <div className="panel log-levels">
          <h3>Log Levels Distribution</h3>
          <div className="levels-chart">
            {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
              const count = LOG_ENTRIES.filter(l => l.level === level).length;
              const percentage = (count / LOG_ENTRIES.length) * 100;
              return (
                <div key={level} className="level-bar-item">
                  <span className="level-name" style={{ color: config.color }}>{level}</span>
                  <div className="level-bar-track">
                    <div 
                      className="level-bar-fill"
                      style={{ width: `${percentage}%`, background: config.color }}
                    />
                  </div>
                  <span className="level-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {firingAlerts > 0 && (
        <div className="alerts-banner">
          <AlertTriangle size={20} />
          <div className="alert-content">
            <span className="alert-title">{firingAlerts} Alert{firingAlerts > 1 ? 's' : ''} Firing</span>
            <span className="alert-desc">
              {LOG_ALERTS.filter(a => a.status === 'firing').map(a => a.name).join(', ')}
            </span>
          </div>
          <button className="btn-outline small">View Alerts</button>
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="logs-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box large">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search logs... (e.g., level:error service:api-gateway)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="fatal">Fatal</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <select defaultValue="1h">
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button 
            className={`btn-outline ${liveMode ? 'active' : ''}`}
            onClick={() => setLiveMode(!liveMode)}
          >
            {liveMode ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
            {liveMode ? 'Pause' : 'Live'}
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th className="col-level">Level</th>
              <th className="col-time">Timestamp</th>
              <th className="col-source">Service</th>
              <th className="col-message">Message</th>
              <th className="col-trace">Trace ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const levelConfig = LEVEL_CONFIG[log.level];
              const LevelIcon = levelConfig.icon;
              return (
                <tr 
                  key={log.id} 
                  className={`log-row ${log.level}`}
                  onClick={() => setSelectedEntry(log)}
                >
                  <td className="col-level">
                    <span 
                      className="level-badge"
                      style={{ background: levelConfig.bg, color: levelConfig.color }}
                    >
                      <LevelIcon size={12} />
                      {log.level}
                    </span>
                  </td>
                  <td className="col-time">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="col-source">{log.service}</td>
                  <td className="col-message">{log.message}</td>
                  <td className="col-trace">
                    {log.traceId && (
                      <span className="trace-id">{log.traceId.slice(0, 8)}...</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedEntry && (
        <div className="log-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span 
                className="level-indicator"
                style={{ background: LEVEL_CONFIG[selectedEntry.level].color }}
              />
              <div>
                <h3>Log Details</h3>
                <span className="panel-subtitle">{selectedEntry.service}</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedEntry(null)}>×</button>
          </div>

          <div className="panel-content">
            <div className="panel-section">
              <h4>Message</h4>
              <div className="message-box">
                <code>{selectedEntry.message}</code>
              </div>
            </div>

            <div className="panel-section">
              <h4>Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Level</span>
                  <span 
                    className="detail-value level"
                    style={{ color: LEVEL_CONFIG[selectedEntry.level].color }}
                  >
                    {selectedEntry.level.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Timestamp</span>
                  <span className="detail-value">{new Date(selectedEntry.timestamp).toISOString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Source</span>
                  <span className="detail-value">{selectedEntry.source}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service</span>
                  <span className="detail-value">{selectedEntry.service}</span>
                </div>
                {selectedEntry.traceId && (
                  <div className="detail-item full">
                    <span className="detail-label">Trace ID</span>
                    <span className="detail-value code">{selectedEntry.traceId}</span>
                  </div>
                )}
                {selectedEntry.spanId && (
                  <div className="detail-item">
                    <span className="detail-label">Span ID</span>
                    <span className="detail-value code">{selectedEntry.spanId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="panel-section">
              <h4>Metadata</h4>
              <div className="metadata-list">
                {Object.entries(selectedEntry.metadata).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <span className="metadata-key">{key}</span>
                    <span className="metadata-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Hash size={16} />
                Find Similar
              </button>
              <button className="btn-outline">
                <Bookmark size={16} />
                Bookmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSources = () => (
    <div className="sources-section">
      <div className="section-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search sources..." />
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Add Source
        </button>
      </div>

      <div className="source-cards">
        {LOG_SOURCES.map(source => {
          const typeConfig = SOURCE_TYPE_CONFIG[source.type];
          const TypeIcon = typeConfig.icon;
          return (
            <div key={source.id} className={`source-card ${source.status}`}>
              <div className="source-card-header">
                <div 
                  className="source-icon"
                  style={{ background: typeConfig.bg, color: typeConfig.color }}
                >
                  <TypeIcon size={22} />
                </div>
                <span className={`status-badge ${source.status}`}>
                  {source.status === 'active' ? <CheckCircle size={12} /> :
                   source.status === 'paused' ? <PauseCircle size={12} /> :
                   <XCircle size={12} />}
                  {source.status}
                </span>
              </div>

              <h4>{source.name}</h4>
              <span className="source-host">{source.host}</span>

              <div className="source-metrics">
                <div className="source-metric">
                  <Activity size={14} />
                  <span className="metric-value">{formatNumber(source.logsPerMinute)}</span>
                  <span className="metric-label">/min</span>
                </div>
                <div className="source-metric">
                  <HardDrive size={14} />
                  <span className="metric-value">{formatBytes(source.bytesPerDay)}</span>
                  <span className="metric-label">/day</span>
                </div>
              </div>

              <div className="source-info">
                <div className="info-item">
                  <span className="info-label">Retention</span>
                  <span className="info-value">{source.retentionDays} days</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last received</span>
                  <span className="info-value">{source.lastReceived}</span>
                </div>
              </div>

              <div className="source-actions">
                <button className="btn-outline small">
                  <Settings size={14} />
                  Configure
                </button>
                {source.status === 'active' ? (
                  <button className="btn-outline small">
                    <PauseCircle size={14} />
                    Pause
                  </button>
                ) : (
                  <button className="btn-outline small">
                    <PlayCircle size={14} />
                    Resume
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStreams = () => (
    <div className="streams-section">
      <div className="streams-header">
        <h3>Log Streams</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Stream
        </button>
      </div>

      <div className="stream-cards">
        {LOG_STREAMS.map(stream => (
          <div key={stream.id} className={`stream-card ${stream.status}`}>
            <div className="stream-card-header">
              <Activity size={20} />
              <span className={`status-badge ${stream.status}`}>{stream.status}</span>
            </div>

            <h4>{stream.name}</h4>

            <div className="stream-query">
              <code>{stream.query}</code>
            </div>

            <div className="stream-sources">
              <span className="sources-label">Sources:</span>
              <div className="sources-list">
                {stream.sources.map(src => (
                  <span key={src} className="source-tag">{src}</span>
                ))}
              </div>
            </div>

            <div className="stream-stats">
              <div className="stream-stat">
                <Zap size={14} />
                <span>{stream.eventsPerSec}/s</span>
              </div>
              {stream.alertsEnabled && (
                <div className="stream-stat alert">
                  <AlertTriangle size={14} />
                  <span>Alerts enabled</span>
                </div>
              )}
            </div>

            <div className="stream-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                View
              </button>
              <button className="btn-outline small">
                <Settings size={14} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-section">
      <div className="alerts-header">
        <h3>Log Alerts</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Alert
        </button>
      </div>

      <div className="alert-cards">
        {LOG_ALERTS.map(alert => {
          const severityConfig = SEVERITY_CONFIG[alert.severity];
          const statusConfig = ALERT_STATUS_CONFIG[alert.status];
          return (
            <div key={alert.id} className={`alert-card ${alert.status}`}>
              <div className="alert-card-header">
                <span 
                  className="severity-badge"
                  style={{ background: severityConfig.bg, color: severityConfig.color }}
                >
                  {alert.severity}
                </span>
                <span 
                  className="status-badge"
                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                >
                  {alert.status === 'firing' && <AlertCircle size={12} className="pulse" />}
                  {alert.status}
                </span>
              </div>

              <h4>{alert.name}</h4>

              <div className="alert-query">
                <code>{alert.query}</code>
              </div>

              <div className="alert-condition">
                <Clock size={14} />
                <span>{alert.condition}</span>
              </div>

              {alert.lastTriggered && (
                <div className="alert-triggered">
                  <span className="triggered-label">Last triggered:</span>
                  <span className="triggered-time">{alert.lastTriggered}</span>
                </div>
              )}

              <div className="alert-channels">
                <span className="channels-label">Notify:</span>
                <div className="channels-list">
                  {alert.notificationChannels.slice(0, 2).map(ch => (
                    <span key={ch} className="channel-tag">{ch}</span>
                  ))}
                  {alert.notificationChannels.length > 2 && (
                    <span className="channel-more">+{alert.notificationChannels.length - 2}</span>
                  )}
                </div>
              </div>

              <div className="alert-actions">
                <button className="btn-outline small">
                  <Settings size={14} />
                  Edit
                </button>
                {alert.status === 'muted' ? (
                  <button className="btn-outline small">
                    <PlayCircle size={14} />
                    Unmute
                  </button>
                ) : (
                  <button className="btn-outline small">
                    <PauseCircle size={14} />
                    Mute
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="log-aggregation">
      <header className="la__header">
        <div className="la__title-section">
          <div className="la__icon">
            <FileText size={28} />
          </div>
          <div>
            <h1>Log Aggregation</h1>
            <p>Centralized log management and analysis</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Search size={16} />
            Search Logs
          </button>
        </div>
      </header>

      <div className="la__stats">
        <div className="stat-card primary">
          <div className="stat-icon sources-icon">
            <Server size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{LOG_SOURCES.filter(s => s.status === 'active').length}</span>
            <span className="stat-label">Active Sources</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rate-icon">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalLogsPerMin)}</span>
            <span className="stat-label">Logs/min</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon storage-icon">
            <HardDrive size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatBytes(totalBytesPerDay)}</span>
            <span className="stat-label">Daily Volume</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon alerts-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-content">
            <span className={`stat-value ${firingAlerts > 0 ? 'error' : ''}`}>{firingAlerts}</span>
            <span className="stat-label">Firing Alerts</span>
          </div>
        </div>
      </div>

      <nav className="la__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`tab-badge ${tab.id === 'alerts' && firingAlerts > 0 ? 'alert' : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="la__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'sources' && renderSources()}
        {activeTab === 'streams' && renderStreams()}
        {activeTab === 'alerts' && renderAlerts()}
      </main>
    </div>
  );
}
