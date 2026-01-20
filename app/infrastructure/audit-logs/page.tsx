'use client';

import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Globe,
  Shield,
  Settings,
  Key,
  Database,
  Server,
  Code,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  FileText,
  RefreshCw,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  Upload,
  MoreHorizontal,
  Activity,
  Zap
} from 'lucide-react';
import './audit-logs.css';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'system' | 'api' | 'service';
    ip?: string;
    userAgent?: string;
  };
  action: string;
  actionType: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'permission' | 'config' | 'security';
  resource: {
    type: string;
    id: string;
    name: string;
  };
  status: 'success' | 'failure' | 'warning';
  details: Record<string, string | number | boolean>;
  location?: {
    country: string;
    city: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'evt-001', timestamp: '2025-01-28T14:35:22Z', actor: { id: 'user-1', name: 'John Smith', email: 'john.smith@cube.io', type: 'user', ip: '192.168.1.105', userAgent: 'Mozilla/5.0' }, action: 'user.login', actionType: 'login', resource: { type: 'session', id: 'sess-abc123', name: 'Web Session' }, status: 'success', details: { mfa_used: true, method: 'password' }, location: { country: 'United States', city: 'New York' }, severity: 'low' },
  { id: 'evt-002', timestamp: '2025-01-28T14:33:15Z', actor: { id: 'user-2', name: 'Sarah Johnson', email: 'sarah.johnson@cube.io', type: 'user', ip: '192.168.1.110' }, action: 'workflow.created', actionType: 'create', resource: { type: 'workflow', id: 'wf-789', name: 'Data Export Pipeline' }, status: 'success', details: { nodes_count: 8, trigger: 'manual' }, severity: 'low' },
  { id: 'evt-003', timestamp: '2025-01-28T14:30:45Z', actor: { id: 'system', name: 'CUBE System', email: 'system@cube.io', type: 'system' }, action: 'backup.completed', actionType: 'config', resource: { type: 'database', id: 'db-primary', name: 'PostgreSQL Primary' }, status: 'success', details: { size_gb: 45.2, duration_seconds: 180 }, severity: 'low' },
  { id: 'evt-004', timestamp: '2025-01-28T14:28:10Z', actor: { id: 'api-key-1', name: 'Production API Key', email: 'api@cube.io', type: 'api', ip: '10.0.1.50' }, action: 'api.rate_limit_exceeded', actionType: 'security', resource: { type: 'api_endpoint', id: '/api/v2/workflows', name: 'Workflows API' }, status: 'warning', details: { requests_per_minute: 150, limit: 100 }, severity: 'medium' },
  { id: 'evt-005', timestamp: '2025-01-28T14:25:30Z', actor: { id: 'user-3', name: 'Mike Wilson', email: 'mike.wilson@cube.io', type: 'user', ip: '192.168.1.115' }, action: 'user.permission_changed', actionType: 'permission', resource: { type: 'user', id: 'user-4', name: 'Emma Brown' }, status: 'success', details: { role_from: 'viewer', role_to: 'editor', changed_by: 'admin' }, location: { country: 'United States', city: 'San Francisco' }, severity: 'high' },
  { id: 'evt-006', timestamp: '2025-01-28T14:22:00Z', actor: { id: 'user-1', name: 'John Smith', email: 'john.smith@cube.io', type: 'user', ip: '192.168.1.105' }, action: 'secret.accessed', actionType: 'read', resource: { type: 'secret', id: 'secret-openai', name: 'OPENAI_API_KEY' }, status: 'success', details: { purpose: 'ai_service_config' }, severity: 'high' },
  { id: 'evt-007', timestamp: '2025-01-28T14:18:45Z', actor: { id: 'ci-service', name: 'CI/CD Pipeline', email: 'ci@cube.io', type: 'service' }, action: 'deployment.started', actionType: 'config', resource: { type: 'deployment', id: 'deploy-456', name: 'cube-frontend v2.5.0' }, status: 'success', details: { environment: 'production', version: '2.5.0' }, severity: 'medium' },
  { id: 'evt-008', timestamp: '2025-01-28T14:15:20Z', actor: { id: 'user-5', name: 'Unknown Actor', email: 'unknown@suspicious.com', type: 'user', ip: '203.0.113.42' }, action: 'user.login_failed', actionType: 'login', resource: { type: 'session', id: 'sess-failed', name: 'Login Attempt' }, status: 'failure', details: { reason: 'invalid_credentials', attempts: 5 }, location: { country: 'Unknown', city: 'Unknown' }, severity: 'critical' },
  { id: 'evt-009', timestamp: '2025-01-28T14:12:00Z', actor: { id: 'user-2', name: 'Sarah Johnson', email: 'sarah.johnson@cube.io', type: 'user', ip: '192.168.1.110' }, action: 'workflow.deleted', actionType: 'delete', resource: { type: 'workflow', id: 'wf-old-123', name: 'Legacy Import Flow' }, status: 'success', details: { reason: 'deprecated' }, severity: 'medium' },
  { id: 'evt-010', timestamp: '2025-01-28T14:08:30Z', actor: { id: 'system', name: 'CUBE System', email: 'system@cube.io', type: 'system' }, action: 'ssl.certificate_renewed', actionType: 'security', resource: { type: 'certificate', id: 'cert-api', name: 'api.cube.io SSL' }, status: 'success', details: { issuer: 'letsencrypt', valid_days: 90 }, severity: 'low' },
  { id: 'evt-011', timestamp: '2025-01-28T14:05:15Z', actor: { id: 'user-6', name: 'David Chen', email: 'david.chen@cube.io', type: 'user', ip: '192.168.1.120' }, action: 'api_key.created', actionType: 'create', resource: { type: 'api_key', id: 'key-new-789', name: 'Mobile App Integration' }, status: 'success', details: { permissions: 'read_only', expires_in_days: 365 }, severity: 'high' },
  { id: 'evt-012', timestamp: '2025-01-28T14:00:00Z', actor: { id: 'user-1', name: 'John Smith', email: 'john.smith@cube.io', type: 'user', ip: '192.168.1.105' }, action: 'settings.updated', actionType: 'update', resource: { type: 'organization', id: 'org-cube', name: 'CUBE Organization' }, status: 'success', details: { setting: 'mfa_required', value: true }, location: { country: 'United States', city: 'New York' }, severity: 'high' }
];

const ACTION_TYPE_CONFIG = {
  create: { color: 'success', icon: Plus, label: 'Create' },
  read: { color: 'info', icon: Eye, label: 'Read' },
  update: { color: 'warning', icon: Edit, label: 'Update' },
  delete: { color: 'danger', icon: Trash2, label: 'Delete' },
  login: { color: 'primary', icon: LogIn, label: 'Login' },
  logout: { color: 'muted', icon: LogOut, label: 'Logout' },
  permission: { color: 'purple', icon: Shield, label: 'Permission' },
  config: { color: 'teal', icon: Settings, label: 'Config' },
  security: { color: 'orange', icon: Lock, label: 'Security' }
};

const STATUS_CONFIG = {
  success: { color: 'success', icon: CheckCircle },
  failure: { color: 'danger', icon: XCircle },
  warning: { color: 'warning', icon: AlertTriangle }
};

const SEVERITY_CONFIG = {
  low: { color: 'muted', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'orange', label: 'High' },
  critical: { color: 'danger', label: 'Critical' }
};

const ACTOR_TYPE_CONFIG = {
  user: { color: 'primary', icon: User },
  system: { color: 'teal', icon: Server },
  api: { color: 'purple', icon: Code },
  service: { color: 'info', icon: Zap }
};

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEvents(newExpanded);
  };

  const filteredEvents = AUDIT_EVENTS.filter(event => {
    const matchesSearch = 
      event.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActionType = actionTypeFilter === 'all' || event.actionType === actionTypeFilter;
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesActionType && matchesSeverity && matchesStatus;
  });

  const totalEvents = AUDIT_EVENTS.length;
  const securityEvents = AUDIT_EVENTS.filter(e => e.actionType === 'security' || e.severity === 'critical' || e.severity === 'high').length;
  const failedEvents = AUDIT_EVENTS.filter(e => e.status === 'failure').length;
  const todayEvents = AUDIT_EVENTS.filter(e => {
    const date = new Date(e.timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="audit-logs">
      <div className="audit-logs__header">
        <div className="audit-logs__title-section">
          <div className="audit-logs__icon">
            <ScrollText size={28} />
          </div>
          <div>
            <h1>Audit Logs</h1>
            <p>Security and compliance event tracking</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="audit-logs__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <ScrollText size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalEvents}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon today">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{todayEvents}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
        <div className="stat-card security">
          <div className="stat-icon security">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{securityEvents}</span>
            <span className="stat-label">Security Events</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{failedEvents}</span>
            <span className="stat-label">Failed Actions</span>
          </div>
        </div>
      </div>

      <div className="audit-logs__filters">
        <div className="search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search events, actors, resources..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          value={actionTypeFilter}
          onChange={(e) => setActionTypeFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="read">Read</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="permission">Permission</option>
          <option value="config">Config</option>
          <option value="security">Security</option>
        </select>
        <select 
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      <div className="events-list">
        {filteredEvents.map(event => {
          const ActionConfig = ACTION_TYPE_CONFIG[event.actionType];
          const ActionIcon = ActionConfig.icon;
          const StatusConfig = STATUS_CONFIG[event.status];
          const StatusIcon = StatusConfig.icon;
          const SeverityConfig = SEVERITY_CONFIG[event.severity];
          const ActorConfig = ACTOR_TYPE_CONFIG[event.actor.type];
          const ActorIcon = ActorConfig.icon;
          const isExpanded = expandedEvents.has(event.id);

          return (
            <div key={event.id} className={`event-card ${event.status} ${event.severity === 'critical' ? 'critical' : ''}`}>
              <div className="event-main" onClick={() => toggleExpanded(event.id)}>
                <div className="event-time">
                  <span className="time-relative">{formatRelativeTime(event.timestamp)}</span>
                  <span className="time-absolute">{formatDate(event.timestamp)}</span>
                </div>

                <div className={`event-status-icon ${StatusConfig.color}`}>
                  <StatusIcon size={18} />
                </div>

                <div className="event-content">
                  <div className="event-header">
                    <div className="event-actor">
                      <span className={`actor-icon ${ActorConfig.color}`}>
                        <ActorIcon size={14} />
                      </span>
                      <span className="actor-name">{event.actor.name}</span>
                    </div>
                    <div className="event-badges">
                      <span className={`action-badge ${ActionConfig.color}`}>
                        <ActionIcon size={12} />
                        {event.action.replace('.', ' → ')}
                      </span>
                      <span className={`severity-badge ${SeverityConfig.color}`}>
                        {SeverityConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="event-resource">
                    <span className="resource-type">{event.resource.type}</span>
                    <span className="resource-name">{event.resource.name}</span>
                    <code className="resource-id">{event.resource.id}</code>
                  </div>
                </div>

                <div className="event-expand">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {isExpanded && (
                <div className="event-details">
                  <div className="details-grid">
                    <div className="detail-section">
                      <h5>Actor Details</h5>
                      <div className="detail-items">
                        <div className="detail-item">
                          <span className="detail-label">Name:</span>
                          <span className="detail-value">{event.actor.name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Email:</span>
                          <span className="detail-value">{event.actor.email}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Type:</span>
                          <span className={`actor-type-chip ${ActorConfig.color}`}>
                            <ActorIcon size={12} />
                            {event.actor.type}
                          </span>
                        </div>
                        {event.actor.ip && (
                          <div className="detail-item">
                            <span className="detail-label">IP Address:</span>
                            <code className="detail-value">{event.actor.ip}</code>
                          </div>
                        )}
                        {event.location && (
                          <div className="detail-item">
                            <span className="detail-label">Location:</span>
                            <span className="detail-value">
                              <Globe size={12} />
                              {event.location.city}, {event.location.country}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h5>Event Details</h5>
                      <div className="detail-items">
                        <div className="detail-item">
                          <span className="detail-label">Event ID:</span>
                          <code className="detail-value">{event.id}</code>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Timestamp:</span>
                          <span className="detail-value">{new Date(event.timestamp).toISOString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span className={`status-chip ${StatusConfig.color}`}>
                            <StatusIcon size={12} />
                            {event.status}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Severity:</span>
                          <span className={`severity-chip ${SeverityConfig.color}`}>
                            {SeverityConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section full-width">
                      <h5>Additional Details</h5>
                      <div className="json-block">
                        <pre>{JSON.stringify(event.details, null, 2)}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="event-actions">
                    <button className="action-btn" title="Copy Event ID">
                      <Copy size={14} />
                      Copy ID
                    </button>
                    <button className="action-btn" title="View Raw JSON">
                      <Code size={14} />
                      Raw JSON
                    </button>
                    <button className="action-btn" title="Create Alert Rule">
                      <AlertTriangle size={14} />
                      Create Alert
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pagination">
        <span className="pagination-info">Showing {filteredEvents.length} of {AUDIT_EVENTS.length} events</span>
        <div className="pagination-controls">
          <button className="pagination-btn" disabled>Previous</button>
          <span className="pagination-page">Page 1 of 1</span>
          <button className="pagination-btn" disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
