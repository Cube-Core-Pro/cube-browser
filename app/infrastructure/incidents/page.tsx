'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  Users,
  MessageSquare,
  Activity,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  Link2,
  ExternalLink,
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  FileText,
  ArrowUpRight,
  Timer,
  Target,
  Flame,
  ThermometerSun
} from 'lucide-react';
import './incidents.css';

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  status: 'triggered' | 'acknowledged' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  service: string;
  team: string;
  assignee?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  duration?: string;
  impact: string;
  description: string;
  updates: IncidentUpdate[];
  relatedIncidents?: string[];
}

interface IncidentUpdate {
  id: string;
  timestamp: string;
  author: string;
  message: string;
  type: 'status' | 'update' | 'action' | 'resolution';
}

interface OnCallSchedule {
  team: string;
  current: string;
  next: string;
  rotationEnd: string;
}

interface IncidentMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
}

const INCIDENTS: Incident[] = [
  {
    id: 'INC-2025-0142',
    title: 'Database connection pool exhausted',
    severity: 'critical',
    status: 'investigating',
    priority: 'P1',
    service: 'postgres-primary',
    team: 'Database',
    assignee: 'Sarah Chen',
    createdAt: '2025-01-15T14:30:00Z',
    acknowledgedAt: '2025-01-15T14:32:00Z',
    impact: 'All API requests failing with 500 errors',
    description: 'Connection pool exhaustion causing cascading failures across all services.',
    updates: [
      { id: 'u1', timestamp: '2025-01-15T14:45:00Z', author: 'Sarah Chen', message: 'Identified high number of long-running queries. Killing stale connections.', type: 'update' },
      { id: 'u2', timestamp: '2025-01-15T14:35:00Z', author: 'System', message: 'Incident escalated to P1', type: 'status' },
      { id: 'u3', timestamp: '2025-01-15T14:32:00Z', author: 'Sarah Chen', message: 'Incident acknowledged. Beginning investigation.', type: 'action' }
    ],
    relatedIncidents: ['INC-2025-0139', 'INC-2025-0138']
  },
  {
    id: 'INC-2025-0141',
    title: 'API Gateway latency spike',
    severity: 'major',
    status: 'monitoring',
    priority: 'P2',
    service: 'api-gateway',
    team: 'Platform',
    assignee: 'Mike Johnson',
    createdAt: '2025-01-15T12:15:00Z',
    acknowledgedAt: '2025-01-15T12:18:00Z',
    impact: 'P99 latency increased to 2.5s (normal: 200ms)',
    description: 'Sudden increase in API latency affecting user experience.',
    updates: [
      { id: 'u1', timestamp: '2025-01-15T13:00:00Z', author: 'Mike Johnson', message: 'Root cause identified: Kubernetes node resource pressure. Scaling up cluster.', type: 'update' },
      { id: 'u2', timestamp: '2025-01-15T12:45:00Z', author: 'Mike Johnson', message: 'Latency starting to stabilize. Monitoring.', type: 'update' }
    ]
  },
  {
    id: 'INC-2025-0140',
    title: 'Payment processing failures',
    severity: 'critical',
    status: 'resolved',
    priority: 'P1',
    service: 'payment-service',
    team: 'Payments',
    assignee: 'Alex Rivera',
    createdAt: '2025-01-15T09:00:00Z',
    acknowledgedAt: '2025-01-15T09:02:00Z',
    resolvedAt: '2025-01-15T10:30:00Z',
    duration: '1h 30m',
    impact: 'All payment transactions failing',
    description: 'Stripe API integration experiencing intermittent failures.',
    updates: [
      { id: 'u1', timestamp: '2025-01-15T10:30:00Z', author: 'Alex Rivera', message: 'Issue resolved. Stripe confirmed API degradation on their end is fixed.', type: 'resolution' },
      { id: 'u2', timestamp: '2025-01-15T09:45:00Z', author: 'Alex Rivera', message: 'Stripe confirming API degradation. Implementing failover to backup processor.', type: 'update' }
    ]
  },
  {
    id: 'INC-2025-0139',
    title: 'SSL certificate expiry warning',
    severity: 'warning',
    status: 'acknowledged',
    priority: 'P3',
    service: 'cdn-edge',
    team: 'Infrastructure',
    createdAt: '2025-01-15T08:00:00Z',
    acknowledgedAt: '2025-01-15T08:30:00Z',
    impact: 'Certificate expires in 7 days',
    description: 'SSL certificate for *.cube.io approaching expiration.',
    updates: [
      { id: 'u1', timestamp: '2025-01-15T08:30:00Z', author: 'Infrastructure Bot', message: 'Auto-renewal scheduled for 2025-01-17', type: 'action' }
    ]
  },
  {
    id: 'INC-2025-0138',
    title: 'Memory leak in worker service',
    severity: 'minor',
    status: 'identified',
    priority: 'P3',
    service: 'worker-service',
    team: 'Backend',
    assignee: 'Emily Park',
    createdAt: '2025-01-14T16:00:00Z',
    acknowledgedAt: '2025-01-14T16:15:00Z',
    impact: 'Worker pods restarting every 4 hours',
    description: 'Gradual memory increase leading to OOM kills.',
    updates: [
      { id: 'u1', timestamp: '2025-01-15T10:00:00Z', author: 'Emily Park', message: 'Memory leak traced to connection caching bug. Fix in progress.', type: 'update' }
    ]
  }
];

const ON_CALL: OnCallSchedule[] = [
  { team: 'Platform', current: 'Mike Johnson', next: 'Sarah Chen', rotationEnd: '2025-01-19' },
  { team: 'Database', current: 'Sarah Chen', next: 'Alex Rivera', rotationEnd: '2025-01-17' },
  { team: 'Backend', current: 'Emily Park', next: 'Chris Lee', rotationEnd: '2025-01-18' },
  { team: 'Infrastructure', current: 'DevOps Bot', next: 'Mike Johnson', rotationEnd: '2025-01-20' }
];

const METRICS: IncidentMetric[] = [
  { label: 'MTTA', value: '2m 45s', change: -15, trend: 'down' },
  { label: 'MTTR', value: '45m', change: -22, trend: 'down' },
  { label: 'Incidents (24h)', value: 8, change: 3, trend: 'up' },
  { label: 'Uptime', value: '99.94%', change: 0.02, trend: 'up' }
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', icon: AlertOctagon, color: 'critical' },
  major: { label: 'Major', icon: AlertTriangle, color: 'major' },
  minor: { label: 'Minor', icon: AlertCircle, color: 'minor' },
  warning: { label: 'Warning', icon: Bell, color: 'warning' }
};

const STATUS_CONFIG = {
  triggered: { label: 'Triggered', color: 'triggered' },
  acknowledged: { label: 'Acknowledged', color: 'acknowledged' },
  investigating: { label: 'Investigating', color: 'investigating' },
  identified: { label: 'Identified', color: 'identified' },
  monitoring: { label: 'Monitoring', color: 'monitoring' },
  resolved: { label: 'Resolved', color: 'resolved' }
};

const PRIORITY_CONFIG = {
  P1: { label: 'P1 - Critical', color: 'p1' },
  P2: { label: 'P2 - High', color: 'p2' },
  P3: { label: 'P3 - Medium', color: 'p3' },
  P4: { label: 'P4 - Low', color: 'p4' }
};

const UPDATE_TYPE_CONFIG = {
  status: { icon: Activity, color: 'status' },
  update: { icon: MessageSquare, color: 'update' },
  action: { icon: Zap, color: 'action' },
  resolution: { icon: CheckCircle2, color: 'resolution' }
};

export default function IncidentManagement() {
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'timeline' | 'oncall'>('active');
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const activeIncidents = INCIDENTS.filter(i => i.status !== 'resolved');
  const criticalCount = activeIncidents.filter(i => i.severity === 'critical').length;

  const filteredIncidents = INCIDENTS.filter(incident => {
    if (activeTab === 'active' && incident.status === 'resolved') return false;
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
    if (severityFilter !== 'all' && incident.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="incident-management">
      <div className="incident-management__header">
        <div className="incident-management__title-section">
          <div className="incident-management__icon">
            <AlertOctagon size={28} />
          </div>
          <div>
            <h1>Incident Management</h1>
            <p>Real-time incident response and coordination</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Incident
          </button>
        </div>
      </div>

      <div className="incident-management__stats">
        <div className="stat-card primary">
          <div className="stat-icon active-incidents">
            <Flame size={22} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeIncidents.length}</div>
            <div className="stat-label">Active Incidents</div>
          </div>
          {criticalCount > 0 && (
            <div className="critical-badge pulse">
              {criticalCount} Critical
            </div>
          )}
        </div>
        {METRICS.map((metric, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{metric.value}</div>
              <div className="stat-label">{metric.label}</div>
            </div>
            {metric.change !== undefined && (
              <div className={`stat-trend ${metric.trend}`}>
                {metric.trend === 'down' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span>{metric.trend === 'down' ? '-' : '+'}{Math.abs(metric.change)}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="incident-management__tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Flame size={16} />
          Active
          {activeIncidents.length > 0 && (
            <span className={`tab-badge ${criticalCount > 0 ? 'critical' : ''}`}>
              {activeIncidents.length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <BarChart3 size={16} />
          All Incidents
          <span className="tab-badge">{INCIDENTS.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Activity size={16} />
          Timeline
        </button>
        <button
          className={`tab-btn ${activeTab === 'oncall' ? 'active' : ''}`}
          onClick={() => setActiveTab('oncall')}
        >
          <Users size={16} />
          On-Call
        </button>
      </div>

      <div className="incident-management__content">
        {(activeTab === 'active' || activeTab === 'all') && (
          <div className="incidents-section">
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search incidents..." />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="triggered">Triggered</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="investigating">Investigating</option>
                <option value="identified">Identified</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            <div className="incidents-list">
              {filteredIncidents.map(incident => {
                const severityConfig = SEVERITY_CONFIG[incident.severity];
                const SeverityIcon = severityConfig.icon;
                const statusConfig = STATUS_CONFIG[incident.status];
                const priorityConfig = PRIORITY_CONFIG[incident.priority];
                const isExpanded = expandedIncident === incident.id;
                
                return (
                  <div
                    key={incident.id}
                    className={`incident-card ${incident.severity} ${incident.status} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="incident-header"
                      onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                    >
                      <div className={`incident-severity-icon ${severityConfig.color}`}>
                        <SeverityIcon size={20} />
                      </div>
                      <div className="incident-info">
                        <div className="incident-title-row">
                          <span className="incident-id">{incident.id}</span>
                          <h4>{incident.title}</h4>
                        </div>
                        <div className="incident-meta">
                          <span className="incident-service">
                            <Server size={12} />
                            {incident.service}
                          </span>
                          <span className="incident-team">{incident.team}</span>
                          {incident.assignee && (
                            <span className="incident-assignee">
                              <Users size={12} />
                              {incident.assignee}
                            </span>
                          )}
                          <span className="incident-time">
                            <Clock size={12} />
                            {getTimeSince(incident.createdAt)} ago
                          </span>
                        </div>
                      </div>
                      <div className="incident-badges">
                        <span className={`priority-badge ${priorityConfig.color}`}>
                          {incident.priority}
                        </span>
                        <span className={`status-badge ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="incident-expand">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="incident-details">
                        <div className="details-grid">
                          <div className="detail-section">
                            <h5>Impact</h5>
                            <p className="impact-text">{incident.impact}</p>
                          </div>
                          <div className="detail-section">
                            <h5>Description</h5>
                            <p>{incident.description}</p>
                          </div>
                        </div>
                        
                        <div className="detail-section">
                          <h5>Timeline</h5>
                          <div className="updates-timeline">
                            {incident.updates.map(update => {
                              const updateConfig = UPDATE_TYPE_CONFIG[update.type];
                              const UpdateIcon = updateConfig.icon;
                              
                              return (
                                <div key={update.id} className={`update-item ${updateConfig.color}`}>
                                  <div className="update-icon">
                                    <UpdateIcon size={14} />
                                  </div>
                                  <div className="update-content">
                                    <div className="update-header">
                                      <span className="update-author">{update.author}</span>
                                      <span className="update-time">{formatDateTime(update.timestamp)}</span>
                                    </div>
                                    <p className="update-message">{update.message}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {incident.relatedIncidents && incident.relatedIncidents.length > 0 && (
                          <div className="detail-section">
                            <h5>Related Incidents</h5>
                            <div className="related-incidents">
                              {incident.relatedIncidents.map(relId => (
                                <span key={relId} className="related-badge">
                                  <Link2 size={12} />
                                  {relId}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="incident-actions">
                          <button className="action-btn">
                            <MessageSquare size={14} />
                            Add Update
                          </button>
                          <button className="action-btn">
                            <Users size={14} />
                            Reassign
                          </button>
                          <button className="action-btn">
                            <GitBranch size={14} />
                            Create Postmortem
                          </button>
                          {incident.status !== 'resolved' ? (
                            <button className="action-btn primary">
                              <CheckCircle2 size={14} />
                              Resolve
                            </button>
                          ) : (
                            <button className="action-btn">
                              <RotateCcw size={14} />
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-section">
            <div className="timeline-header">
              <h3>Incident Timeline</h3>
              <div className="timeline-legend">
                {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                  <span key={key} className={`legend-item ${config.color}`}>
                    <span className="legend-dot" />
                    {config.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="timeline-container">
              {INCIDENTS.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(incident => {
                const severityConfig = SEVERITY_CONFIG[incident.severity];
                const SeverityIcon = severityConfig.icon;
                const statusConfig = STATUS_CONFIG[incident.status];
                
                return (
                  <div key={incident.id} className={`timeline-item ${severityConfig.color}`}>
                    <div className="timeline-marker">
                      <div className={`marker-icon ${severityConfig.color}`}>
                        <SeverityIcon size={14} />
                      </div>
                      <div className="marker-line" />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <span className="timeline-time">{formatDateTime(incident.createdAt)}</span>
                          <span className={`status-tag ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                        <h4>{incident.title}</h4>
                        <p className="timeline-impact">{incident.impact}</p>
                        <div className="timeline-meta">
                          <span>{incident.id}</span>
                          <span>{incident.service}</span>
                          {incident.duration && <span className="duration">Duration: {incident.duration}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'oncall' && (
          <div className="oncall-section">
            <div className="oncall-grid">
              {ON_CALL.map(schedule => (
                <div key={schedule.team} className="oncall-card">
                  <div className="oncall-header">
                    <h4>{schedule.team}</h4>
                    <span className="rotation-end">
                      <Calendar size={12} />
                      Until {formatDate(schedule.rotationEnd)}
                    </span>
                  </div>
                  <div className="oncall-current">
                    <div className="oncall-badge current">
                      <span className="badge-label">On-Call</span>
                      <div className="oncall-user">
                        <div className="user-avatar">{schedule.current.charAt(0)}</div>
                        <span className="user-name">{schedule.current}</span>
                      </div>
                    </div>
                  </div>
                  <div className="oncall-next">
                    <span className="next-label">Next:</span>
                    <span className="next-user">{schedule.next}</span>
                  </div>
                  <div className="oncall-actions">
                    <button className="oncall-btn">
                      <Bell size={14} />
                      Page
                    </button>
                    <button className="oncall-btn">
                      <Users size={14} />
                      Override
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="escalation-policy">
              <h3>Escalation Policy</h3>
              <div className="escalation-steps">
                <div className="escalation-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h5>Primary On-Call</h5>
                    <p>Immediately notify primary on-call for the affected service</p>
                    <span className="step-timing">0 min</span>
                  </div>
                </div>
                <div className="escalation-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h5>Secondary On-Call</h5>
                    <p>If no acknowledgment, escalate to secondary on-call</p>
                    <span className="step-timing">5 min</span>
                  </div>
                </div>
                <div className="escalation-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h5>Team Lead</h5>
                    <p>Escalate to team lead for P1/P2 incidents</p>
                    <span className="step-timing">15 min</span>
                  </div>
                </div>
                <div className="escalation-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h5>Engineering Manager</h5>
                    <p>Escalate to management for extended P1 incidents</p>
                    <span className="step-timing">30 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
