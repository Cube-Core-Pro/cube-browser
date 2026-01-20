'use client';

import React, { useState } from 'react';
import { 
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Settings,
  Download,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Users,
  Mail,
  MessageSquare,
  Smartphone,
  Webhook,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  Globe,
  Pause,
  Play,
  Copy,
  MoreVertical,
  Target,
  Layers,
  Shield,
  Zap
} from 'lucide-react';
import './alert-management.css';

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'firing' | 'pending' | 'resolved' | 'silenced';
  source: string;
  service: string;
  startsAt: string;
  duration: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  fingerprint: string;
  notifiedChannels: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  duration: string;
  enabled: boolean;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  notificationChannels: string[];
  lastEvaluated: string;
  firingCount: number;
  group: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms' | 'teams';
  config: Record<string, string>;
  enabled: boolean;
  lastNotification: string;
  notificationsSent: number;
}

interface Silence {
  id: string;
  matchers: { name: string; value: string; isRegex: boolean }[];
  startsAt: string;
  endsAt: string;
  createdBy: string;
  comment: string;
  status: 'active' | 'pending' | 'expired';
}

const ALERTS: Alert[] = [
  {
    id: 'alert-1',
    name: 'HighErrorRate',
    description: 'Error rate exceeded 5% threshold for payment-service',
    severity: 'critical',
    status: 'firing',
    source: 'prometheus',
    service: 'payment-service',
    startsAt: '2025-01-27T14:15:00Z',
    duration: '45m',
    labels: { alertname: 'HighErrorRate', service: 'payment-service', env: 'production' },
    annotations: { summary: 'High error rate detected', runbook_url: 'https://wiki.internal/runbooks/high-error-rate' },
    fingerprint: 'abc123def456',
    notifiedChannels: ['slack-ops', 'pagerduty-oncall']
  },
  {
    id: 'alert-2',
    name: 'DatabaseConnectionPoolExhausted',
    description: 'PostgreSQL connection pool at 95% capacity',
    severity: 'critical',
    status: 'firing',
    source: 'prometheus',
    service: 'postgres-primary',
    startsAt: '2025-01-27T14:28:00Z',
    duration: '32m',
    labels: { alertname: 'DatabaseConnectionPoolExhausted', database: 'production', instance: 'postgres-primary' },
    annotations: { summary: 'Connection pool nearly exhausted', impact: 'New connections may fail' },
    fingerprint: 'ghi789jkl012',
    notifiedChannels: ['slack-dba', 'pagerduty-oncall', 'email-dba-team']
  },
  {
    id: 'alert-3',
    name: 'HighCPUUsage',
    description: 'CPU usage above 85% for prod-server-01',
    severity: 'high',
    status: 'firing',
    source: 'prometheus',
    service: 'prod-server-01',
    startsAt: '2025-01-27T13:45:00Z',
    duration: '1h 15m',
    labels: { alertname: 'HighCPUUsage', instance: 'prod-server-01', job: 'node-exporter' },
    annotations: { summary: 'High CPU usage detected' },
    fingerprint: 'mno345pqr678',
    notifiedChannels: ['slack-ops'],
    acknowledgedBy: 'john.doe@company.com',
    acknowledgedAt: '2025-01-27T14:00:00Z'
  },
  {
    id: 'alert-4',
    name: 'SlowQueryDetected',
    description: 'Multiple slow queries detected in last 5 minutes',
    severity: 'medium',
    status: 'pending',
    source: 'prometheus',
    service: 'postgres-primary',
    startsAt: '2025-01-27T14:55:00Z',
    duration: '5m',
    labels: { alertname: 'SlowQueryDetected', database: 'production' },
    annotations: { summary: 'Slow queries impacting performance' },
    fingerprint: 'stu901vwx234',
    notifiedChannels: []
  },
  {
    id: 'alert-5',
    name: 'CertificateExpiringSoon',
    description: 'SSL certificate expires in 7 days',
    severity: 'medium',
    status: 'firing',
    source: 'blackbox-exporter',
    service: 'api.cube-elite.io',
    startsAt: '2025-01-27T08:00:00Z',
    duration: '7h',
    labels: { alertname: 'CertificateExpiringSoon', domain: 'api.cube-elite.io' },
    annotations: { summary: 'SSL certificate renewal required' },
    fingerprint: 'yza567bcd890',
    notifiedChannels: ['email-security', 'slack-ops']
  },
  {
    id: 'alert-6',
    name: 'HighMemoryUsage',
    description: 'Memory usage above 90% for redis-cache cluster',
    severity: 'high',
    status: 'silenced',
    source: 'prometheus',
    service: 'redis-cache',
    startsAt: '2025-01-27T12:00:00Z',
    duration: '3h',
    labels: { alertname: 'HighMemoryUsage', cluster: 'redis-cache-primary' },
    annotations: { summary: 'Redis memory pressure detected' },
    fingerprint: 'cde123fgh456',
    notifiedChannels: []
  },
  {
    id: 'alert-7',
    name: 'ServiceHealthCheckFailed',
    description: 'Health check failed for notification-service',
    severity: 'high',
    status: 'resolved',
    source: 'blackbox-exporter',
    service: 'notification-service',
    startsAt: '2025-01-27T13:00:00Z',
    duration: '15m',
    labels: { alertname: 'ServiceHealthCheckFailed', service: 'notification-service' },
    annotations: { summary: 'Service health check failing' },
    fingerprint: 'ijk789lmn012',
    notifiedChannels: ['slack-ops', 'pagerduty-oncall']
  },
  {
    id: 'alert-8',
    name: 'DiskSpaceLow',
    description: 'Disk usage above 80% on log-server-01',
    severity: 'low',
    status: 'firing',
    source: 'prometheus',
    service: 'log-server-01',
    startsAt: '2025-01-27T10:00:00Z',
    duration: '5h',
    labels: { alertname: 'DiskSpaceLow', instance: 'log-server-01', mountpoint: '/var/log' },
    annotations: { summary: 'Disk space running low' },
    fingerprint: 'opq345rst678',
    notifiedChannels: ['email-ops']
  }
];

const ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-1',
    name: 'HighErrorRate',
    description: 'Alert when error rate exceeds 5%',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05',
    severity: 'critical',
    duration: '5m',
    enabled: true,
    labels: { team: 'backend', severity: 'critical' },
    annotations: { summary: 'High error rate detected', runbook_url: 'https://wiki.internal/runbooks/high-error-rate' },
    notificationChannels: ['slack-ops', 'pagerduty-oncall'],
    lastEvaluated: '10 seconds ago',
    firingCount: 2,
    group: 'application'
  },
  {
    id: 'rule-2',
    name: 'HighLatency',
    description: 'Alert when P99 latency exceeds 500ms',
    query: 'histogram_quantile(0.99, rate(request_duration_seconds_bucket[5m])) > 0.5',
    severity: 'high',
    duration: '5m',
    enabled: true,
    labels: { team: 'backend', severity: 'high' },
    annotations: { summary: 'High latency detected' },
    notificationChannels: ['slack-ops'],
    lastEvaluated: '10 seconds ago',
    firingCount: 0,
    group: 'application'
  },
  {
    id: 'rule-3',
    name: 'HighCPUUsage',
    description: 'Alert when CPU usage exceeds 85%',
    query: '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85',
    severity: 'high',
    duration: '10m',
    enabled: true,
    labels: { team: 'infrastructure', severity: 'high' },
    annotations: { summary: 'High CPU usage detected' },
    notificationChannels: ['slack-ops', 'email-ops'],
    lastEvaluated: '10 seconds ago',
    firingCount: 1,
    group: 'infrastructure'
  },
  {
    id: 'rule-4',
    name: 'HighMemoryUsage',
    description: 'Alert when memory usage exceeds 90%',
    query: '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9',
    severity: 'high',
    duration: '10m',
    enabled: true,
    labels: { team: 'infrastructure', severity: 'high' },
    annotations: { summary: 'High memory usage detected' },
    notificationChannels: ['slack-ops'],
    lastEvaluated: '10 seconds ago',
    firingCount: 1,
    group: 'infrastructure'
  },
  {
    id: 'rule-5',
    name: 'DatabaseConnectionPoolExhausted',
    description: 'Alert when connection pool usage exceeds 90%',
    query: 'pg_stat_activity_count / pg_settings_max_connections > 0.9',
    severity: 'critical',
    duration: '2m',
    enabled: true,
    labels: { team: 'dba', severity: 'critical' },
    annotations: { summary: 'Database connection pool nearly exhausted' },
    notificationChannels: ['slack-dba', 'pagerduty-oncall', 'email-dba-team'],
    lastEvaluated: '10 seconds ago',
    firingCount: 1,
    group: 'database'
  },
  {
    id: 'rule-6',
    name: 'ServiceDown',
    description: 'Alert when service is unreachable',
    query: 'up == 0',
    severity: 'critical',
    duration: '1m',
    enabled: true,
    labels: { team: 'sre', severity: 'critical' },
    annotations: { summary: 'Service is down' },
    notificationChannels: ['pagerduty-oncall', 'slack-ops'],
    lastEvaluated: '10 seconds ago',
    firingCount: 0,
    group: 'availability'
  },
  {
    id: 'rule-7',
    name: 'CertificateExpiring',
    description: 'Alert when SSL certificate expires within 14 days',
    query: 'probe_ssl_earliest_cert_expiry - time() < 86400 * 14',
    severity: 'medium',
    duration: '1h',
    enabled: false,
    labels: { team: 'security', severity: 'medium' },
    annotations: { summary: 'SSL certificate expiring soon' },
    notificationChannels: ['email-security', 'slack-ops'],
    lastEvaluated: 'Disabled',
    firingCount: 0,
    group: 'security'
  }
];

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    id: 'channel-1',
    name: 'slack-ops',
    type: 'slack',
    config: { webhook_url: 'https://hooks.slack.com/services/xxx', channel: '#ops-alerts' },
    enabled: true,
    lastNotification: '5 minutes ago',
    notificationsSent: 1245
  },
  {
    id: 'channel-2',
    name: 'pagerduty-oncall',
    type: 'pagerduty',
    config: { integration_key: 'xxxxxxxx', severity_map: 'critical=P1,high=P2' },
    enabled: true,
    lastNotification: '32 minutes ago',
    notificationsSent: 156
  },
  {
    id: 'channel-3',
    name: 'email-ops',
    type: 'email',
    config: { to: 'ops-team@company.com', smtp_server: 'smtp.company.com' },
    enabled: true,
    lastNotification: '1 hour ago',
    notificationsSent: 890
  },
  {
    id: 'channel-4',
    name: 'slack-dba',
    type: 'slack',
    config: { webhook_url: 'https://hooks.slack.com/services/yyy', channel: '#dba-alerts' },
    enabled: true,
    lastNotification: '32 minutes ago',
    notificationsSent: 245
  },
  {
    id: 'channel-5',
    name: 'email-dba-team',
    type: 'email',
    config: { to: 'dba-team@company.com' },
    enabled: true,
    lastNotification: '32 minutes ago',
    notificationsSent: 178
  },
  {
    id: 'channel-6',
    name: 'webhook-incident',
    type: 'webhook',
    config: { url: 'https://incident.internal/api/webhook', method: 'POST' },
    enabled: false,
    lastNotification: '3 days ago',
    notificationsSent: 45
  },
  {
    id: 'channel-7',
    name: 'teams-engineering',
    type: 'teams',
    config: { webhook_url: 'https://outlook.office.com/webhook/xxx' },
    enabled: true,
    lastNotification: '2 hours ago',
    notificationsSent: 320
  }
];

const SILENCES: Silence[] = [
  {
    id: 'silence-1',
    matchers: [{ name: 'alertname', value: 'HighMemoryUsage', isRegex: false }, { name: 'cluster', value: 'redis-cache-primary', isRegex: false }],
    startsAt: '2025-01-27T12:00:00Z',
    endsAt: '2025-01-27T18:00:00Z',
    createdBy: 'jane.smith@company.com',
    comment: 'Scheduled maintenance - Redis memory optimization in progress',
    status: 'active'
  },
  {
    id: 'silence-2',
    matchers: [{ name: 'service', value: 'staging.*', isRegex: true }],
    startsAt: '2025-01-27T08:00:00Z',
    endsAt: '2025-01-27T20:00:00Z',
    createdBy: 'dev-team@company.com',
    comment: 'Staging environment deployment testing',
    status: 'active'
  }
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: <AlertOctagon size={14} /> },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', icon: <AlertTriangle size={14} /> },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: <AlertCircle size={14} /> },
  low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: <Bell size={14} /> },
  info: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', icon: <Bell size={14} /> }
};

const CHANNEL_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  slack: { icon: <MessageSquare size={16} />, color: '#e01e5a' },
  pagerduty: { icon: <BellRing size={16} />, color: '#06ac38' },
  email: { icon: <Mail size={16} />, color: '#3b82f6' },
  webhook: { icon: <Webhook size={16} />, color: '#8b5cf6' },
  sms: { icon: <Smartphone size={16} />, color: '#10b981' },
  teams: { icon: <Users size={16} />, color: '#5558af' }
};

export default function AlertManagementPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'channels' | 'silences' | 'analytics'>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const firingAlerts = ALERTS.filter(a => a.status === 'firing').length;
  const pendingAlerts = ALERTS.filter(a => a.status === 'pending').length;
  const criticalAlerts = ALERTS.filter(a => a.severity === 'critical' && a.status === 'firing').length;
  const activeRules = ALERT_RULES.filter(r => r.enabled).length;

  const filteredAlerts = ALERTS.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });

  const renderAlerts = () => (
    <div className="alerts-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box large">
            <Search size={16} />
            <input type="text" placeholder="Search alerts by name, service, or label..." />
          </div>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="firing">Firing</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="silenced">Silenced</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <VolumeX size={16} />
            Silence All
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`alert-item ${alert.severity} ${alert.status}`}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="alert-severity-indicator">
              <div 
                className="severity-icon"
                style={{ 
                  background: SEVERITY_CONFIG[alert.severity].bg,
                  color: SEVERITY_CONFIG[alert.severity].color
                }}
              >
                {SEVERITY_CONFIG[alert.severity].icon}
              </div>
              {alert.status === 'firing' && <div className="pulse-ring" />}
            </div>
            <div className="alert-main">
              <div className="alert-header">
                <h4>{alert.name}</h4>
                <div className="alert-badges">
                  <span 
                    className="severity-badge"
                    style={{ 
                      background: SEVERITY_CONFIG[alert.severity].bg,
                      color: SEVERITY_CONFIG[alert.severity].color
                    }}
                  >
                    {alert.severity}
                  </span>
                  <span className={`status-badge ${alert.status}`}>
                    {alert.status === 'firing' && <BellRing size={12} />}
                    {alert.status === 'pending' && <Clock size={12} />}
                    {alert.status === 'resolved' && <CheckCircle size={12} />}
                    {alert.status === 'silenced' && <BellOff size={12} />}
                    {alert.status}
                  </span>
                </div>
              </div>
              <p className="alert-description">{alert.description}</p>
              <div className="alert-meta">
                <span className="meta-item">
                  <Server size={12} />
                  {alert.service}
                </span>
                <span className="meta-item">
                  <Clock size={12} />
                  {alert.duration}
                </span>
                <span className="meta-item">
                  <Database size={12} />
                  {alert.source}
                </span>
                {alert.acknowledgedBy && (
                  <span className="meta-item acknowledged">
                    <CheckCircle size={12} />
                    Ack by {alert.acknowledgedBy.split('@')[0]}
                  </span>
                )}
              </div>
              {alert.notifiedChannels.length > 0 && (
                <div className="alert-channels">
                  <span className="channels-label">Notified:</span>
                  {alert.notifiedChannels.map(channel => (
                    <span key={channel} className="channel-tag">{channel}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="alert-actions">
              <button className="btn-icon" title="Acknowledge">
                <CheckCircle size={16} />
              </button>
              <button className="btn-icon" title="Silence">
                <BellOff size={16} />
              </button>
              <button className="btn-icon" title="More">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedAlert && (
        <div className="alert-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div 
                className="severity-icon large"
                style={{ 
                  background: SEVERITY_CONFIG[selectedAlert.severity].bg,
                  color: SEVERITY_CONFIG[selectedAlert.severity].color
                }}
              >
                {SEVERITY_CONFIG[selectedAlert.severity].icon}
              </div>
              <div>
                <h3>{selectedAlert.name}</h3>
                <span className="panel-subtitle">{selectedAlert.fingerprint}</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedAlert(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="panel-section">
              <h4>Summary</h4>
              <p className="alert-full-description">{selectedAlert.description}</p>
            </div>

            <div className="panel-section">
              <h4>Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Severity</span>
                  <span 
                    className="detail-value"
                    style={{ color: SEVERITY_CONFIG[selectedAlert.severity].color }}
                  >
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value ${selectedAlert.status}`}>{selectedAlert.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service</span>
                  <span className="detail-value">{selectedAlert.service}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{selectedAlert.duration}</span>
                </div>
                <div className="detail-item full">
                  <span className="detail-label">Started At</span>
                  <span className="detail-value">{new Date(selectedAlert.startsAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Labels</h4>
              <div className="labels-list">
                {Object.entries(selectedAlert.labels).map(([key, val]) => (
                  <div key={key} className="label-item">
                    <span className="label-key">{key}</span>
                    <span className="label-value">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <h4>Annotations</h4>
              <div className="annotations-list">
                {Object.entries(selectedAlert.annotations).map(([key, val]) => (
                  <div key={key} className="annotation-item">
                    <span className="annotation-key">{key}</span>
                    <span className="annotation-value">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              {selectedAlert.status === 'firing' && !selectedAlert.acknowledgedBy && (
                <button className="btn-primary">
                  <CheckCircle size={16} />
                  Acknowledge
                </button>
              )}
              <button className="btn-outline">
                <BellOff size={16} />
                Create Silence
              </button>
              <button className="btn-outline">
                <Eye size={16} />
                View Runbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRules = () => (
    <div className="rules-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search rules..." />
          </div>
          <select>
            <option>All Groups</option>
            <option>application</option>
            <option>infrastructure</option>
            <option>database</option>
            <option>security</option>
            <option>availability</option>
          </select>
          <select>
            <option>All Severities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Rules
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Rule
          </button>
        </div>
      </div>

      <div className="rules-cards">
        {ALERT_RULES.map(rule => (
          <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
            <div className="rule-card-header">
              <div className="rule-status">
                {rule.enabled ? (
                  <span className="status-dot enabled" />
                ) : (
                  <span className="status-dot disabled" />
                )}
                <span className="rule-group">{rule.group}</span>
              </div>
              <div 
                className="severity-badge"
                style={{ 
                  background: SEVERITY_CONFIG[rule.severity].bg,
                  color: SEVERITY_CONFIG[rule.severity].color
                }}
              >
                {rule.severity}
              </div>
            </div>
            <h4>{rule.name}</h4>
            <p className="rule-description">{rule.description}</p>
            <div className="rule-query">
              <code>{rule.query.length > 80 ? rule.query.substring(0, 80) + '...' : rule.query}</code>
            </div>
            <div className="rule-stats">
              <div className="rule-stat">
                <Clock size={14} />
                <span>For: {rule.duration}</span>
              </div>
              <div className="rule-stat">
                <Activity size={14} />
                <span>Last: {rule.lastEvaluated}</span>
              </div>
              {rule.firingCount > 0 && (
                <div className="rule-stat firing">
                  <BellRing size={14} />
                  <span>{rule.firingCount} firing</span>
                </div>
              )}
            </div>
            <div className="rule-channels">
              <span className="channels-label">Channels:</span>
              {rule.notificationChannels.map(channel => (
                <span key={channel} className="channel-tag">{channel}</span>
              ))}
            </div>
            <div className="rule-actions">
              <button className="btn-outline small">
                <Edit2 size={14} />
                Edit
              </button>
              <button className="btn-outline small">
                {rule.enabled ? <Pause size={14} /> : <Play size={14} />}
                {rule.enabled ? 'Disable' : 'Enable'}
              </button>
              <button className="btn-icon">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChannels = () => (
    <div className="channels-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search channels..." />
          </div>
          <select>
            <option>All Types</option>
            <option>Slack</option>
            <option>PagerDuty</option>
            <option>Email</option>
            <option>Webhook</option>
            <option>Teams</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary">
            <Plus size={16} />
            Add Channel
          </button>
        </div>
      </div>

      <div className="channel-cards">
        {NOTIFICATION_CHANNELS.map(channel => (
          <div key={channel.id} className={`channel-card ${!channel.enabled ? 'disabled' : ''}`}>
            <div className="channel-card-header">
              <div 
                className="channel-type-icon"
                style={{ color: CHANNEL_TYPE_CONFIG[channel.type].color }}
              >
                {CHANNEL_TYPE_CONFIG[channel.type].icon}
              </div>
              <div className={`channel-status ${channel.enabled ? 'enabled' : 'disabled'}`}>
                {channel.enabled ? (
                  <><CheckCircle size={12} /> Enabled</>
                ) : (
                  <><XCircle size={12} /> Disabled</>
                )}
              </div>
            </div>
            <h4>{channel.name}</h4>
            <p className="channel-type">{channel.type.toUpperCase()}</p>
            <div className="channel-config">
              {Object.entries(channel.config).slice(0, 2).map(([key, val]) => (
                <div key={key} className="config-item">
                  <span className="config-key">{key}:</span>
                  <span className="config-value">{val.length > 30 ? val.substring(0, 30) + '...' : val}</span>
                </div>
              ))}
            </div>
            <div className="channel-stats">
              <div className="channel-stat">
                <Mail size={14} />
                <span>{formatNumber(channel.notificationsSent)} sent</span>
              </div>
              <div className="channel-stat">
                <Clock size={14} />
                <span>Last: {channel.lastNotification}</span>
              </div>
            </div>
            <div className="channel-actions">
              <button className="btn-outline small">
                <Settings size={14} />
                Configure
              </button>
              <button className="btn-outline small">
                <Zap size={14} />
                Test
              </button>
              <button className="btn-icon">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSilences = () => (
    <div className="silences-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search silences..." />
          </div>
          <select>
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Expired</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Silence
          </button>
        </div>
      </div>

      <div className="silences-list">
        {SILENCES.map(silence => (
          <div key={silence.id} className={`silence-item ${silence.status}`}>
            <div className="silence-header">
              <div className={`silence-status ${silence.status}`}>
                {silence.status === 'active' && <><BellOff size={14} /> Active</>}
                {silence.status === 'pending' && <><Clock size={14} /> Pending</>}
                {silence.status === 'expired' && <><XCircle size={14} /> Expired</>}
              </div>
              <div className="silence-time">
                <Calendar size={14} />
                <span>
                  {new Date(silence.startsAt).toLocaleString()} - {new Date(silence.endsAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="silence-matchers">
              <span className="matchers-label">Matchers:</span>
              {silence.matchers.map((matcher, idx) => (
                <span key={idx} className={`matcher-tag ${matcher.isRegex ? 'regex' : ''}`}>
                  {matcher.name}={matcher.isRegex ? `~${matcher.value}` : matcher.value}
                </span>
              ))}
            </div>
            <p className="silence-comment">{silence.comment}</p>
            <div className="silence-meta">
              <span className="meta-item">
                <Users size={12} />
                Created by: {silence.createdBy}
              </span>
            </div>
            <div className="silence-actions">
              <button className="btn-outline small">
                <Edit2 size={14} />
                Edit
              </button>
              <button className="btn-outline small">
                <Copy size={14} />
                Recreate
              </button>
              {silence.status === 'active' && (
                <button className="btn-outline small danger">
                  <XCircle size={14} />
                  Expire
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-header">
        <h3>Alert Analytics</h3>
        <div className="time-selector">
          <button className="time-btn">24h</button>
          <button className="time-btn active">7d</button>
          <button className="time-btn">30d</button>
        </div>
      </div>

      <div className="analytics-metrics">
        <div className="analytics-card">
          <div className="analytics-icon">
            <BellRing size={20} />
          </div>
          <div className="analytics-value">
            <span className="value">1,245</span>
            <span className="label">Total Alerts</span>
          </div>
          <div className="analytics-trend positive">
            <TrendingDown size={14} />
            -12% vs last week
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon critical">
            <AlertOctagon size={20} />
          </div>
          <div className="analytics-value">
            <span className="value error">89</span>
            <span className="label">Critical Alerts</span>
          </div>
          <div className="analytics-trend negative">
            <TrendingUp size={14} />
            +8% vs last week
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon">
            <Clock size={20} />
          </div>
          <div className="analytics-value">
            <span className="value">15m</span>
            <span className="label">Avg Resolution Time</span>
          </div>
          <div className="analytics-trend positive">
            <TrendingDown size={14} />
            -25% vs last week
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon">
            <Target size={20} />
          </div>
          <div className="analytics-value">
            <span className="value">98.5%</span>
            <span className="label">Acknowledgement Rate</span>
          </div>
          <div className="analytics-trend positive">
            <TrendingUp size={14} />
            +2% vs last week
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-panel">
          <h4>Alerts Over Time</h4>
          <div className="chart-placeholder">
            <Activity size={48} />
            <p>Alert volume trend visualization</p>
          </div>
        </div>
        <div className="chart-panel">
          <h4>Alerts by Severity</h4>
          <div className="severity-breakdown">
            {[
              { severity: 'critical', count: 89, percent: 7 },
              { severity: 'high', count: 245, percent: 20 },
              { severity: 'medium', count: 456, percent: 37 },
              { severity: 'low', count: 345, percent: 28 },
              { severity: 'info', count: 110, percent: 8 }
            ].map(item => (
              <div key={item.severity} className="severity-row">
                <div className="severity-info">
                  <span 
                    className="severity-dot"
                    style={{ background: SEVERITY_CONFIG[item.severity].color }}
                  />
                  <span className="severity-name">{item.severity}</span>
                </div>
                <div className="severity-bar">
                  <div 
                    className="severity-bar-fill"
                    style={{ 
                      width: `${item.percent}%`,
                      background: SEVERITY_CONFIG[item.severity].color
                    }}
                  />
                </div>
                <span className="severity-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="top-alerts-panel">
        <h4>Most Frequent Alerts</h4>
        <div className="top-alerts-list">
          {[
            { name: 'HighErrorRate', count: 156, service: 'payment-service' },
            { name: 'HighLatency', count: 134, service: 'api-gateway' },
            { name: 'HighCPUUsage', count: 98, service: 'prod-server-*' },
            { name: 'DatabaseConnectionPoolExhausted', count: 67, service: 'postgres-primary' },
            { name: 'QueueBacklog', count: 45, service: 'rabbitmq' }
          ].map((alert, idx) => (
            <div key={idx} className="top-alert-item">
              <span className="rank">{idx + 1}</span>
              <div className="top-alert-info">
                <span className="alert-name">{alert.name}</span>
                <span className="alert-service">{alert.service}</span>
              </div>
              <span className="alert-count">{alert.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="alert-management">
      <header className="am__header">
        <div className="am__title-section">
          <div className="am__icon">
            <Bell size={28} />
          </div>
          <div>
            <h1>Alert Management</h1>
            <p>Monitor, configure, and manage alerting rules</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Calendar size={16} />
            Last 1 Hour
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Alert
          </button>
        </div>
      </header>

      <div className="am__stats">
        <div className={`stat-card ${firingAlerts > 0 ? 'alert' : 'primary'}`}>
          <div className={`stat-icon ${firingAlerts > 0 ? 'firing-icon' : 'alerts-icon'}`}>
            <BellRing size={24} />
          </div>
          <div className="stat-content">
            <span className={`stat-value ${firingAlerts > 0 ? 'error' : ''}`}>{firingAlerts}</span>
            <span className="stat-label">Firing Alerts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{pendingAlerts}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon critical-icon">
            <AlertOctagon size={24} />
          </div>
          <div className="stat-content">
            <span className={`stat-value ${criticalAlerts > 0 ? 'error' : ''}`}>{criticalAlerts}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rules-icon">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeRules}/{ALERT_RULES.length}</span>
            <span className="stat-label">Active Rules</span>
          </div>
        </div>
      </div>

      <div className="am__tabs">
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <BellRing size={16} />
          Alerts
          {firingAlerts > 0 && <span className="tab-badge alert">{firingAlerts}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Shield size={16} />
          Rules
          <span className="tab-badge">{ALERT_RULES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          <Volume2 size={16} />
          Channels
        </button>
        <button 
          className={`tab-btn ${activeTab === 'silences' ? 'active' : ''}`}
          onClick={() => setActiveTab('silences')}
        >
          <BellOff size={16} />
          Silences
          <span className="tab-badge">{SILENCES.filter(s => s.status === 'active').length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Activity size={16} />
          Analytics
        </button>
      </div>

      <div className="am__content">
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'channels' && renderChannels()}
        {activeTab === 'silences' && renderSilences()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
