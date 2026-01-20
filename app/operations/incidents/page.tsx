'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Bell, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Users,
  MessageSquare,
  PhoneCall,
  Mail,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Filter,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowUpRight,
  BarChart2,
  Play,
  Pause,
  Settings,
  ExternalLink,
  History,
  GitBranch,
  Link2,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Send,
  Flag,
  Timer,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import './incident-management.css';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  priority: 1 | 2 | 3 | 4;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  service: string;
  environment: 'production' | 'staging' | 'development';
  impactedUsers: number;
  assignee: string;
  responders: string[];
  source: string;
  alertCount: number;
  tags: string[];
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'status_change' | 'comment' | 'assignment' | 'notification' | 'action' | 'resolution';
  user: string;
  content: string;
  metadata?: {
    from?: string;
    to?: string;
  };
}

interface OnCallSchedule {
  id: string;
  team: string;
  primary: { name: string; since: string; until: string };
  secondary: { name: string; since: string; until: string };
  escalation: string[];
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance';
  uptime: number;
  activeIncidents: number;
  lastIncident?: string;
}

interface IncidentMetrics {
  mttr: number;
  mtta: number;
  mtbf: number;
  totalIncidents: number;
  resolvedToday: number;
  openIncidents: number;
  criticalOpen: number;
}

const IncidentManagementSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'oncall' | 'services' | 'postmortems' | 'analytics'>('incidents');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const incidents: Incident[] = [
    {
      id: 'INC-2025-0127',
      title: 'Database Connection Pool Exhaustion',
      description: 'Primary database experiencing connection pool saturation causing increased latency and timeouts.',
      severity: 'critical',
      status: 'investigating',
      priority: 1,
      createdAt: '2025-02-18T14:30:00Z',
      updatedAt: '2025-02-18T15:45:00Z',
      service: 'Core API',
      environment: 'production',
      impactedUsers: 15420,
      assignee: 'Sarah Chen',
      responders: ['Sarah Chen', 'Mike Johnson', 'Alex Rivera'],
      source: 'DataDog',
      alertCount: 47,
      tags: ['database', 'performance', 'p1'],
      timeline: [
        { id: '1', timestamp: '2025-02-18T14:30:00Z', type: 'notification', user: 'System', content: 'Alert triggered: Database connection pool at 95% capacity' },
        { id: '2', timestamp: '2025-02-18T14:32:00Z', type: 'status_change', user: 'PagerDuty', content: 'Incident acknowledged automatically', metadata: { from: 'open', to: 'acknowledged' } },
        { id: '3', timestamp: '2025-02-18T14:35:00Z', type: 'assignment', user: 'System', content: 'Assigned to Sarah Chen (on-call primary)' },
        { id: '4', timestamp: '2025-02-18T14:40:00Z', type: 'status_change', user: 'Sarah Chen', content: 'Starting investigation', metadata: { from: 'acknowledged', to: 'investigating' } },
        { id: '5', timestamp: '2025-02-18T15:00:00Z', type: 'comment', user: 'Mike Johnson', content: 'Identified potential root cause: batch job consuming excess connections' },
        { id: '6', timestamp: '2025-02-18T15:30:00Z', type: 'action', user: 'Sarah Chen', content: 'Scaled connection pool from 100 to 200 connections' }
      ]
    },
    {
      id: 'INC-2025-0126',
      title: 'Payment Gateway Timeout Errors',
      description: 'Intermittent timeout errors when processing payments through Stripe integration.',
      severity: 'high',
      status: 'identified',
      priority: 2,
      createdAt: '2025-02-18T12:15:00Z',
      updatedAt: '2025-02-18T14:00:00Z',
      service: 'Payment Service',
      environment: 'production',
      impactedUsers: 2340,
      assignee: 'James Wilson',
      responders: ['James Wilson', 'Emily Brown'],
      source: 'Sentry',
      alertCount: 23,
      tags: ['payments', 'stripe', 'timeout'],
      timeline: [
        { id: '1', timestamp: '2025-02-18T12:15:00Z', type: 'notification', user: 'System', content: 'Error rate spike detected in payment processing' },
        { id: '2', timestamp: '2025-02-18T12:20:00Z', type: 'status_change', user: 'James Wilson', content: 'Acknowledged incident', metadata: { from: 'open', to: 'acknowledged' } },
        { id: '3', timestamp: '2025-02-18T13:30:00Z', type: 'comment', user: 'James Wilson', content: 'Root cause identified: Stripe API rate limiting due to retry storms' }
      ]
    },
    {
      id: 'INC-2025-0125',
      title: 'CDN Cache Invalidation Failure',
      description: 'Static assets not being properly invalidated after deployment.',
      severity: 'medium',
      status: 'monitoring',
      priority: 3,
      createdAt: '2025-02-18T10:00:00Z',
      updatedAt: '2025-02-18T13:30:00Z',
      service: 'CDN',
      environment: 'production',
      impactedUsers: 890,
      assignee: 'Alex Rivera',
      responders: ['Alex Rivera'],
      source: 'Internal',
      alertCount: 5,
      tags: ['cdn', 'cache', 'deployment'],
      timeline: [
        { id: '1', timestamp: '2025-02-18T10:00:00Z', type: 'notification', user: 'Deploy Bot', content: 'Cache invalidation job failed during deployment' }
      ]
    },
    {
      id: 'INC-2025-0124',
      title: 'Email Delivery Delays',
      description: 'Transactional emails experiencing 15-30 minute delays.',
      severity: 'low',
      status: 'resolved',
      priority: 4,
      createdAt: '2025-02-17T16:00:00Z',
      updatedAt: '2025-02-17T18:30:00Z',
      resolvedAt: '2025-02-17T18:30:00Z',
      service: 'Email Service',
      environment: 'production',
      impactedUsers: 450,
      assignee: 'Emily Brown',
      responders: ['Emily Brown'],
      source: 'Customer Report',
      alertCount: 2,
      tags: ['email', 'sendgrid', 'delay'],
      timeline: [
        { id: '1', timestamp: '2025-02-17T16:00:00Z', type: 'notification', user: 'Support', content: 'Customer reported delayed email notifications' },
        { id: '2', timestamp: '2025-02-17T18:30:00Z', type: 'resolution', user: 'Emily Brown', content: 'SendGrid queue cleared, delivery times back to normal' }
      ]
    },
    {
      id: 'INC-2025-0123',
      title: 'Authentication Service High Latency',
      description: 'Login requests taking 3-5 seconds instead of normal 200ms.',
      severity: 'high',
      status: 'resolved',
      priority: 2,
      createdAt: '2025-02-17T09:00:00Z',
      updatedAt: '2025-02-17T11:45:00Z',
      resolvedAt: '2025-02-17T11:45:00Z',
      service: 'Auth Service',
      environment: 'production',
      impactedUsers: 8920,
      assignee: 'Sarah Chen',
      responders: ['Sarah Chen', 'Mike Johnson'],
      source: 'New Relic',
      alertCount: 31,
      tags: ['auth', 'performance', 'redis'],
      timeline: []
    }
  ];

  const onCallSchedules: OnCallSchedule[] = [
    {
      id: '1',
      team: 'Platform Engineering',
      primary: { name: 'Sarah Chen', since: '2025-02-17T00:00:00Z', until: '2025-02-24T00:00:00Z' },
      secondary: { name: 'Mike Johnson', since: '2025-02-17T00:00:00Z', until: '2025-02-24T00:00:00Z' },
      escalation: ['James Wilson', 'Emily Brown', 'Alex Rivera']
    },
    {
      id: '2',
      team: 'Backend Services',
      primary: { name: 'Alex Rivera', since: '2025-02-17T00:00:00Z', until: '2025-02-24T00:00:00Z' },
      secondary: { name: 'Emily Brown', since: '2025-02-17T00:00:00Z', until: '2025-02-24T00:00:00Z' },
      escalation: ['Sarah Chen', 'Mike Johnson']
    },
    {
      id: '3',
      team: 'Frontend',
      primary: { name: 'James Wilson', since: '2025-02-17T00:00:00Z', until: '2025-02-24T00:00:00Z' },
      secondary: { name: 'Maria Garcia', since: '2025-02-17T00:00:00Z', until: '2025-02-24T00:00:00Z' },
      escalation: ['Alex Rivera', 'Sarah Chen']
    }
  ];

  const services: ServiceStatus[] = [
    { id: '1', name: 'Core API', status: 'degraded', uptime: 99.94, activeIncidents: 1, lastIncident: '2025-02-18T14:30:00Z' },
    { id: '2', name: 'Payment Service', status: 'partial', uptime: 99.89, activeIncidents: 1, lastIncident: '2025-02-18T12:15:00Z' },
    { id: '3', name: 'Auth Service', status: 'operational', uptime: 99.99, activeIncidents: 0, lastIncident: '2025-02-17T09:00:00Z' },
    { id: '4', name: 'CDN', status: 'operational', uptime: 99.98, activeIncidents: 0 },
    { id: '5', name: 'Email Service', status: 'operational', uptime: 99.95, activeIncidents: 0 },
    { id: '6', name: 'Database', status: 'degraded', uptime: 99.91, activeIncidents: 1 },
    { id: '7', name: 'Cache (Redis)', status: 'operational', uptime: 99.99, activeIncidents: 0 },
    { id: '8', name: 'Search Service', status: 'operational', uptime: 99.97, activeIncidents: 0 }
  ];

  const metrics: IncidentMetrics = {
    mttr: 47,
    mtta: 3.2,
    mtbf: 168,
    totalIncidents: 127,
    resolvedToday: 8,
    openIncidents: 3,
    criticalOpen: 1
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon size={16} />;
      case 'high': return <AlertTriangle size={16} />;
      case 'medium': return <Bell size={16} />;
      case 'low': return <Bell size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertOctagon size={14} />;
      case 'acknowledged': return <Eye size={14} />;
      case 'investigating': return <Activity size={14} />;
      case 'identified': return <Target size={14} />;
      case 'monitoring': return <BarChart2 size={14} />;
      case 'resolved': return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <GitBranch size={14} />;
      case 'comment': return <MessageSquare size={14} />;
      case 'assignment': return <UserPlus size={14} />;
      case 'notification': return <Bell size={14} />;
      case 'action': return <Zap size={14} />;
      case 'resolution': return <CheckCircle2 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredIncidents = incidents
    .filter(i => filterSeverity === 'all' || i.severity === filterSeverity)
    .filter(i => filterStatus === 'all' || i.status === filterStatus)
    .filter(i => searchQuery === '' || i.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="incident-management">
      <header className="im__header">
        <div className="im__title-section">
          <div className="im__icon">
            <AlertOctagon size={28} />
          </div>
          <div>
            <h1>Incident Management</h1>
            <p>Monitor, respond, and resolve incidents in real-time</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Declare Incident
          </button>
        </div>
      </header>

      <div className="status-banner">
        {metrics.criticalOpen > 0 ? (
          <div className="banner critical">
            <AlertOctagon size={18} />
            <span><strong>{metrics.criticalOpen} Critical</strong> incident requires immediate attention</span>
            <button className="btn-outline small">View Critical</button>
          </div>
        ) : (
          <div className="banner healthy">
            <CheckCircle2 size={18} />
            <span>No critical incidents • All systems operational</span>
          </div>
        )}
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertOctagon size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{metrics.openIncidents}</span>
            <span className="stat-label">Open Incidents</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{metrics.resolvedToday}</span>
            <span className="stat-label">Resolved Today</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Timer size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{metrics.mttr}m</span>
            <span className="stat-label">Avg MTTR</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{metrics.mtta}m</span>
            <span className="stat-label">Avg MTTA</span>
          </div>
        </div>
      </div>

      <nav className="im__tabs">
        <button 
          className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <AlertTriangle size={16} />
          Incidents
          <span className="tab-badge">{metrics.openIncidents}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'oncall' ? 'active' : ''}`}
          onClick={() => setActiveTab('oncall')}
        >
          <Users size={16} />
          On-Call
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Activity size={16} />
          Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'postmortems' ? 'active' : ''}`}
          onClick={() => setActiveTab('postmortems')}
        >
          <History size={16} />
          Post-Mortems
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={16} />
          Analytics
        </button>
      </nav>

      <main className="im__content">
        {activeTab === 'incidents' && (
          <div className="incidents-tab">
            <div className="incidents-toolbar">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="incidents-layout">
              <div className="incidents-list">
                {filteredIncidents.map(incident => (
                  <div 
                    key={incident.id} 
                    className={`incident-card ${incident.severity} ${incident.status} ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="incident-header">
                      <div className={`severity-indicator ${incident.severity}`}>
                        {getSeverityIcon(incident.severity)}
                      </div>
                      <div className="incident-info">
                        <div className="incident-id-row">
                          <span className="incident-id">{incident.id}</span>
                          <span className={`priority-badge p${incident.priority}`}>P{incident.priority}</span>
                          <span className={`status-badge ${incident.status}`}>
                            {getStatusIcon(incident.status)}
                            {incident.status}
                          </span>
                        </div>
                        <h4 className="incident-title">{incident.title}</h4>
                      </div>
                      <ChevronRight size={18} className="incident-arrow" />
                    </div>
                    
                    <p className="incident-description">{incident.description}</p>
                    
                    <div className="incident-meta">
                      <span className="meta-item">
                        <Activity size={12} />
                        {incident.service}
                      </span>
                      <span className="meta-item">
                        <Users size={12} />
                        {incident.impactedUsers.toLocaleString()} impacted
                      </span>
                      <span className="meta-item">
                        <Bell size={12} />
                        {incident.alertCount} alerts
                      </span>
                      <span className="meta-item">
                        <Clock size={12} />
                        {getTimeSince(incident.createdAt)}
                      </span>
                    </div>

                    <div className="incident-footer">
                      <div className="responders">
                        {incident.responders.slice(0, 3).map((responder, idx) => (
                          <div key={idx} className="responder-avatar" title={responder}>
                            {responder.charAt(0)}
                          </div>
                        ))}
                        {incident.responders.length > 3 && (
                          <div className="responder-avatar more">+{incident.responders.length - 3}</div>
                        )}
                      </div>
                      <div className="incident-tags">
                        {incident.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedIncident && (
                <div className="incident-detail-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <span className={`severity-dot ${selectedIncident.severity}`} />
                      <h3>{selectedIncident.id}</h3>
                    </div>
                    <button className="close-btn" onClick={() => setSelectedIncident(null)}>
                      <XCircle size={20} />
                    </button>
                  </div>

                  <div className="panel-content">
                    <h2>{selectedIncident.title}</h2>
                    <p className="incident-desc">{selectedIncident.description}</p>

                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className={`status-badge ${selectedIncident.status}`}>
                          {getStatusIcon(selectedIncident.status)}
                          {selectedIncident.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Severity</span>
                        <span className={`severity-badge ${selectedIncident.severity}`}>
                          {getSeverityIcon(selectedIncident.severity)}
                          {selectedIncident.severity}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Assignee</span>
                        <span className="detail-value">{selectedIncident.assignee}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Service</span>
                        <span className="detail-value">{selectedIncident.service}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Environment</span>
                        <span className={`env-badge ${selectedIncident.environment}`}>{selectedIncident.environment}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Source</span>
                        <span className="detail-value">{selectedIncident.source}</span>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <button className="btn-primary">
                        <Play size={14} />
                        Update Status
                      </button>
                      <button className="btn-outline">
                        <UserPlus size={14} />
                        Add Responder
                      </button>
                      <button className="btn-outline">
                        <Link2 size={14} />
                        Link Runbook
                      </button>
                    </div>

                    <div className="timeline-section">
                      <h4>Timeline</h4>
                      <div className="timeline">
                        {selectedIncident.timeline.map((event, idx) => (
                          <div key={event.id} className={`timeline-item ${event.type}`}>
                            <div className="timeline-icon">
                              {getTimelineIcon(event.type)}
                            </div>
                            <div className="timeline-content">
                              <span className="timeline-time">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="timeline-user">{event.user}</span>
                              <p className="timeline-text">{event.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="comment-section">
                      <h4>Add Comment</h4>
                      <div className="comment-input">
                        <textarea placeholder="Add a comment or update..." rows={3} />
                        <button className="btn-primary">
                          <Send size={14} />
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'oncall' && (
          <div className="oncall-tab">
            <div className="oncall-grid">
              {onCallSchedules.map(schedule => (
                <div key={schedule.id} className="oncall-card">
                  <div className="oncall-header">
                    <h3>{schedule.team}</h3>
                    <span className="schedule-badge">This Week</span>
                  </div>
                  
                  <div className="oncall-slots">
                    <div className="slot primary">
                      <div className="slot-label">
                        <Flag size={14} />
                        Primary
                      </div>
                      <div className="slot-person">
                        <div className="person-avatar">{schedule.primary.name.charAt(0)}</div>
                        <div className="person-info">
                          <span className="person-name">{schedule.primary.name}</span>
                          <span className="person-schedule">
                            Until {new Date(schedule.primary.until).toLocaleDateString()}
                          </span>
                        </div>
                        <button className="btn-outline small">
                          <PhoneCall size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="slot secondary">
                      <div className="slot-label">
                        <Users size={14} />
                        Secondary
                      </div>
                      <div className="slot-person">
                        <div className="person-avatar">{schedule.secondary.name.charAt(0)}</div>
                        <div className="person-info">
                          <span className="person-name">{schedule.secondary.name}</span>
                          <span className="person-schedule">
                            Until {new Date(schedule.secondary.until).toLocaleDateString()}
                          </span>
                        </div>
                        <button className="btn-outline small">
                          <PhoneCall size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="escalation-path">
                    <span className="escalation-label">Escalation Path</span>
                    <div className="escalation-chain">
                      {schedule.escalation.map((person, idx) => (
                        <React.Fragment key={idx}>
                          <span className="escalation-person">{person}</span>
                          {idx < schedule.escalation.length - 1 && <ArrowRight size={14} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="services-tab">
            <div className="services-header">
              <h3>Service Status Overview</h3>
              <div className="status-legend">
                <span className="legend-item operational"><span className="dot" /> Operational</span>
                <span className="legend-item degraded"><span className="dot" /> Degraded</span>
                <span className="legend-item partial"><span className="dot" /> Partial Outage</span>
                <span className="legend-item major"><span className="dot" /> Major Outage</span>
              </div>
            </div>

            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className={`service-card ${service.status}`}>
                  <div className="service-header">
                    <div className={`status-dot ${service.status}`} />
                    <h4>{service.name}</h4>
                    <span className={`status-label ${service.status}`}>{service.status}</span>
                  </div>
                  <div className="service-metrics">
                    <div className="metric">
                      <span className="metric-label">Uptime (30d)</span>
                      <span className="metric-value">{service.uptime}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Active Incidents</span>
                      <span className={`metric-value ${service.activeIncidents > 0 ? 'has-incidents' : ''}`}>
                        {service.activeIncidents}
                      </span>
                    </div>
                  </div>
                  {service.lastIncident && (
                    <div className="last-incident">
                      Last incident: {getTimeSince(service.lastIncident)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'postmortems' && (
          <div className="postmortems-tab">
            <div className="postmortems-header">
              <h3>Post-Mortem Reports</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Create Post-Mortem
              </button>
            </div>

            <div className="postmortems-list">
              <div className="postmortem-card">
                <div className="pm-header">
                  <span className="pm-date">Feb 17, 2025</span>
                  <span className="pm-severity high">High</span>
                </div>
                <h4>Authentication Service Latency Spike</h4>
                <p>Root cause: Redis connection pool exhaustion due to missing connection limits in new deployment.</p>
                <div className="pm-meta">
                  <span className="pm-incident">INC-2025-0123</span>
                  <span className="pm-duration">Duration: 2h 45m</span>
                  <span className="pm-author">Sarah Chen</span>
                </div>
                <div className="pm-actions">
                  <button className="btn-outline small">
                    <Eye size={14} />
                    View Report
                  </button>
                  <span className="action-items">3 action items remaining</span>
                </div>
              </div>

              <div className="postmortem-card">
                <div className="pm-header">
                  <span className="pm-date">Feb 15, 2025</span>
                  <span className="pm-severity critical">Critical</span>
                </div>
                <h4>Database Failover Incident</h4>
                <p>Primary database failed over to replica causing 12 minutes of write unavailability.</p>
                <div className="pm-meta">
                  <span className="pm-incident">INC-2025-0118</span>
                  <span className="pm-duration">Duration: 45m</span>
                  <span className="pm-author">Mike Johnson</span>
                </div>
                <div className="pm-actions">
                  <button className="btn-outline small">
                    <Eye size={14} />
                    View Report
                  </button>
                  <span className="action-items completed">All action items completed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              <div className="analytics-card large">
                <h4>Incident Trend (Last 30 Days)</h4>
                <div className="trend-chart">
                  {[12, 8, 15, 6, 10, 14, 9, 7, 11, 5, 8, 13].map((value, idx) => (
                    <div key={idx} className="trend-bar-container">
                      <div className="trend-bar" style={{ height: `${(value / 15) * 100}%` }} />
                      <span className="trend-label">{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <h4>By Severity</h4>
                <div className="severity-breakdown">
                  <div className="severity-row">
                    <span className="sev-label critical">Critical</span>
                    <div className="sev-bar-bg"><div className="sev-bar critical" style={{ width: '15%' }} /></div>
                    <span className="sev-count">8</span>
                  </div>
                  <div className="severity-row">
                    <span className="sev-label high">High</span>
                    <div className="sev-bar-bg"><div className="sev-bar high" style={{ width: '30%' }} /></div>
                    <span className="sev-count">24</span>
                  </div>
                  <div className="severity-row">
                    <span className="sev-label medium">Medium</span>
                    <div className="sev-bar-bg"><div className="sev-bar medium" style={{ width: '45%' }} /></div>
                    <span className="sev-count">52</span>
                  </div>
                  <div className="severity-row">
                    <span className="sev-label low">Low</span>
                    <div className="sev-bar-bg"><div className="sev-bar low" style={{ width: '35%' }} /></div>
                    <span className="sev-count">43</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>MTTR Trend</h4>
                <div className="metric-trend">
                  <div className="trend-header">
                    <span className="trend-value">47m</span>
                    <span className="trend-change down">
                      <TrendingDown size={14} />
                      -12% vs last month
                    </span>
                  </div>
                  <div className="mini-chart">
                    {[62, 58, 55, 51, 49, 47].map((val, idx) => (
                      <div key={idx} className="mini-bar" style={{ height: `${(val / 70) * 100}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>Top Impacted Services</h4>
                <div className="services-rank">
                  {[
                    { name: 'Core API', count: 23 },
                    { name: 'Payment Service', count: 18 },
                    { name: 'Auth Service', count: 15 },
                    { name: 'Database', count: 12 },
                    { name: 'CDN', count: 8 }
                  ].map((svc, idx) => (
                    <div key={idx} className="rank-row">
                      <span className="rank-num">{idx + 1}</span>
                      <span className="rank-name">{svc.name}</span>
                      <span className="rank-count">{svc.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IncidentManagementSystem;
