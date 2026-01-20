'use client';

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  User,
  Globe,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Key,
  UserX,
  UserCheck,
  Activity,
  MapPin,
  Monitor,
  Smartphone,
  Server,
  LogIn,
  LogOut,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Settings,
  Bell,
  FileText,
  Database,
  Wifi,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Fingerprint,
  Cpu
} from 'lucide-react';
import './security-events.css';

interface SecurityEvent {
  id: string;
  type: 'auth' | 'access' | 'permission' | 'threat' | 'data' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  action: string;
  title: string;
  description: string;
  actor: {
    name: string;
    email?: string;
    ip?: string;
    type: 'user' | 'system' | 'unknown' | 'bot';
  };
  resource?: {
    type: string;
    name: string;
  };
  location?: {
    city: string;
    country: string;
    coordinates?: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'server' | 'unknown';
    browser?: string;
    os?: string;
  };
  status: 'blocked' | 'allowed' | 'flagged' | 'review';
  timestamp: string;
  metadata?: { [key: string]: string | number | boolean };
}

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'email' | 'pattern' | 'behavior';
  value: string;
  severity: 'critical' | 'high' | 'medium';
  reason: string;
  occurrences: number;
  blocked: boolean;
}

const SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: '1',
    type: 'auth',
    severity: 'critical',
    action: 'failed_login',
    title: 'Multiple Failed Login Attempts',
    description: '15 failed login attempts in the last 5 minutes from the same IP',
    actor: { name: 'Unknown', ip: '185.173.xx.xx', type: 'unknown' },
    location: { city: 'Moscow', country: 'Russia' },
    device: { type: 'unknown', browser: 'curl/7.68.0' },
    status: 'blocked',
    timestamp: '2 minutes ago',
    metadata: { attempts: 15, timeframe: '5 minutes', account: 'admin@cube.io' }
  },
  {
    id: '2',
    type: 'threat',
    severity: 'high',
    action: 'suspicious_activity',
    title: 'Suspicious API Access Pattern',
    description: 'Unusual API request pattern detected - possible enumeration attack',
    actor: { name: 'API Client', ip: '45.129.xx.xx', type: 'bot' },
    resource: { type: 'api', name: '/api/users' },
    location: { city: 'Unknown', country: 'Unknown' },
    status: 'flagged',
    timestamp: '15 minutes ago',
    metadata: { requests: 2500, timeframe: '1 minute', endpoints: 45 }
  },
  {
    id: '3',
    type: 'auth',
    severity: 'medium',
    action: 'new_device_login',
    title: 'Login from New Device',
    description: 'User logged in from a previously unseen device and location',
    actor: { name: 'Sarah Chen', email: 'sarah@company.com', ip: '73.189.xx.xx', type: 'user' },
    location: { city: 'San Francisco', country: 'United States' },
    device: { type: 'mobile', browser: 'Safari', os: 'iOS 17' },
    status: 'flagged',
    timestamp: '32 minutes ago',
    metadata: { mfa_used: true }
  },
  {
    id: '4',
    type: 'permission',
    severity: 'high',
    action: 'privilege_escalation',
    title: 'Admin Role Assigned',
    description: 'User role elevated to administrator by system admin',
    actor: { name: 'John Admin', email: 'john@cube.io', type: 'user' },
    resource: { type: 'user', name: 'new.developer@cube.io' },
    status: 'allowed',
    timestamp: '1 hour ago',
    metadata: { previous_role: 'editor', new_role: 'admin', approved_by: 'john@cube.io' }
  },
  {
    id: '5',
    type: 'data',
    severity: 'medium',
    action: 'bulk_export',
    title: 'Large Data Export',
    description: 'User exported 50,000+ records from the system',
    actor: { name: 'Mike Johnson', email: 'mike@company.com', type: 'user' },
    resource: { type: 'data', name: 'User Analytics' },
    device: { type: 'desktop', browser: 'Chrome 120', os: 'Windows 11' },
    status: 'allowed',
    timestamp: '2 hours ago',
    metadata: { records: 52340, format: 'CSV', size: '45MB' }
  },
  {
    id: '6',
    type: 'access',
    severity: 'low',
    action: 'api_key_used',
    title: 'API Key Authentication',
    description: 'Production API key used from new IP address',
    actor: { name: 'API Service', ip: '52.14.xx.xx', type: 'system' },
    resource: { type: 'api', name: 'Automation API' },
    location: { city: 'Columbus', country: 'United States' },
    status: 'allowed',
    timestamp: '3 hours ago',
    metadata: { key_name: 'prod-automation-key', scopes: 'read,write' }
  },
  {
    id: '7',
    type: 'system',
    severity: 'info',
    action: 'security_scan',
    title: 'Security Scan Completed',
    description: 'Automated security vulnerability scan completed successfully',
    actor: { name: 'Security Scanner', type: 'system' },
    status: 'allowed',
    timestamp: '4 hours ago',
    metadata: { vulnerabilities: 0, scanned_files: 12456, duration: '45 minutes' }
  },
  {
    id: '8',
    type: 'auth',
    severity: 'critical',
    action: 'session_hijack_attempt',
    title: 'Possible Session Hijacking',
    description: 'Session used from different IP and device than originally created',
    actor: { name: 'Unknown', ip: '91.234.xx.xx', type: 'unknown' },
    resource: { type: 'session', name: 'user_session_a1b2c3' },
    location: { city: 'Beijing', country: 'China' },
    status: 'blocked',
    timestamp: '5 hours ago',
    metadata: { original_ip: '73.189.xx.xx', original_location: 'San Francisco' }
  }
];

const THREAT_INDICATORS: ThreatIndicator[] = [
  { id: '1', type: 'ip', value: '185.173.xx.xx', severity: 'critical', reason: 'Known malicious IP', occurrences: 156, blocked: true },
  { id: '2', type: 'ip', value: '91.234.xx.xx', severity: 'high', reason: 'Session hijacking attempt', occurrences: 3, blocked: true },
  { id: '3', type: 'pattern', value: 'API enumeration', severity: 'high', reason: 'Automated scanning pattern', occurrences: 12, blocked: true },
  { id: '4', type: 'email', value: 'fake@spam.domain', severity: 'medium', reason: 'Disposable email domain', occurrences: 45, blocked: false }
];

const TYPE_ICONS: { [key: string]: React.ElementType } = {
  auth: Key,
  access: Lock,
  permission: UserCheck,
  threat: ShieldAlert,
  data: Database,
  system: Server
};

const ACTION_ICONS: { [key: string]: React.ElementType } = {
  failed_login: LogIn,
  successful_login: LogIn,
  logout: LogOut,
  new_device_login: Smartphone,
  suspicious_activity: AlertTriangle,
  privilege_escalation: UserCheck,
  bulk_export: Download,
  api_key_used: Key,
  security_scan: Shield,
  session_hijack_attempt: ShieldOff
};

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>(SECURITY_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'threats' | 'rules'>('events');

  const filteredEvents = events.filter(event => {
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesType && matchesStatus && matchesSearch;
  });

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const blockedCount = events.filter(e => e.status === 'blocked').length;
  const flaggedCount = events.filter(e => e.status === 'flagged').length;

  const getTypeIcon = (type: string) => TYPE_ICONS[type] || Shield;
  const getActionIcon = (action: string) => ACTION_ICONS[action] || Activity;

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone;
      case 'desktop': return Monitor;
      case 'server': return Server;
      default: return Cpu;
    }
  };

  return (
    <div className="security-events">
      <header className="security-events__header">
        <div className="security-events__title-section">
          <div className="security-events__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Security Events</h1>
            <p>Monitor, investigate, and respond to security incidents</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-outline">
            <Bell size={16} />
            Alert Rules
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export Log
          </button>
          <button className="btn-primary">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="security-events__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{events.length}</span>
            <span className="stat-label">Total Events (24h)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon critical">
            <ShieldAlert size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{criticalCount}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blocked">
            <Ban size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{blockedCount}</span>
            <span className="stat-label">Blocked</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon flagged">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{flaggedCount}</span>
            <span className="stat-label">Flagged</span>
          </div>
        </div>
      </div>

      <div className="security-events__tabs">
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Activity size={16} />
          Events
          <span className="tab-badge">{events.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'threats' ? 'active' : ''}`}
          onClick={() => setActiveTab('threats')}
        >
          <ShieldAlert size={16} />
          Threat Indicators
          <span className="tab-badge danger">{THREAT_INDICATORS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Settings size={16} />
          Rules & Policies
        </button>
      </div>

      {activeTab === 'events' && (
        <>
          <div className="security-events__filters">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search events..."
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
                <option value="info">Info</option>
              </select>

              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="auth">Authentication</option>
                <option value="access">Access</option>
                <option value="permission">Permission</option>
                <option value="threat">Threat</option>
                <option value="data">Data</option>
                <option value="system">System</option>
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="blocked">Blocked</option>
                <option value="allowed">Allowed</option>
                <option value="flagged">Flagged</option>
                <option value="review">Under Review</option>
              </select>
            </div>
          </div>

          <div className="events-list">
            {filteredEvents.map(event => {
              const TypeIcon = getTypeIcon(event.type);
              const ActionIcon = getActionIcon(event.action);
              const DeviceIcon = getDeviceIcon(event.device?.type);

              return (
                <div 
                  key={event.id} 
                  className={`event-card ${event.severity} ${event.status}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={`severity-indicator ${event.severity}`} />

                  <div className="event-main">
                    <div className={`event-icon ${event.type}`}>
                      <TypeIcon size={20} />
                    </div>

                    <div className="event-info">
                      <div className="event-header">
                        <h4 className="event-title">{event.title}</h4>
                        <div className="event-badges">
                          <span className={`severity-badge ${event.severity}`}>{event.severity}</span>
                          <span className={`status-badge ${event.status}`}>
                            {event.status === 'blocked' && <Ban size={10} />}
                            {event.status === 'allowed' && <CheckCircle size={10} />}
                            {event.status === 'flagged' && <AlertTriangle size={10} />}
                            {event.status}
                          </span>
                        </div>
                      </div>

                      <p className="event-description">{event.description}</p>

                      <div className="event-meta">
                        <span className="meta-item">
                          <ActionIcon size={14} />
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        {event.actor.ip && (
                          <span className="meta-item">
                            <Globe size={14} />
                            {event.actor.ip}
                          </span>
                        )}
                        {event.location && (
                          <span className="meta-item">
                            <MapPin size={14} />
                            {event.location.city}, {event.location.country}
                          </span>
                        )}
                        {event.device && (
                          <span className="meta-item">
                            <DeviceIcon size={14} />
                            {event.device.browser || event.device.type}
                          </span>
                        )}
                        <span className="meta-item">
                          <Clock size={14} />
                          {event.timestamp}
                        </span>
                      </div>

                      {event.actor.name !== 'Unknown' && (
                        <div className="actor-info">
                          <User size={14} />
                          <span className="actor-name">{event.actor.name}</span>
                          {event.actor.email && (
                            <span className="actor-email">{event.actor.email}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="event-actions">
                    <button className="action-btn" title="View Details">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="More Actions">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'threats' && (
        <div className="threats-section">
          <div className="section-header">
            <h2>Active Threat Indicators</h2>
            <button className="btn-outline">
              <Plus size={16} />
              Add Indicator
            </button>
          </div>

          <div className="threats-grid">
            {THREAT_INDICATORS.map(threat => (
              <div key={threat.id} className={`threat-card ${threat.severity}`}>
                <div className="threat-header">
                  <div className={`threat-type ${threat.type}`}>
                    {threat.type === 'ip' && <Globe size={18} />}
                    {threat.type === 'email' && <User size={18} />}
                    {threat.type === 'pattern' && <Activity size={18} />}
                    {threat.type === 'behavior' && <Fingerprint size={18} />}
                    <span>{threat.type.toUpperCase()}</span>
                  </div>
                  <span className={`threat-severity ${threat.severity}`}>
                    {threat.severity}
                  </span>
                </div>

                <div className="threat-value">
                  <code>{threat.value}</code>
                </div>

                <p className="threat-reason">{threat.reason}</p>

                <div className="threat-footer">
                  <span className="occurrences">
                    <Activity size={14} />
                    {threat.occurrences} occurrences
                  </span>
                  <div className={`block-status ${threat.blocked ? 'blocked' : 'monitoring'}`}>
                    {threat.blocked ? <Ban size={14} /> : <Eye size={14} />}
                    {threat.blocked ? 'Blocked' : 'Monitoring'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="rules-section">
          <div className="rules-grid">
            <div className="rule-card">
              <div className="rule-icon">
                <Lock size={24} />
              </div>
              <div className="rule-info">
                <h4>Failed Login Lockout</h4>
                <p>Lock account after 5 failed login attempts</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="rule-card">
              <div className="rule-icon">
                <Globe size={24} />
              </div>
              <div className="rule-info">
                <h4>Geo-blocking</h4>
                <p>Block access from restricted countries</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="rule-card">
              <div className="rule-icon">
                <Smartphone size={24} />
              </div>
              <div className="rule-info">
                <h4>New Device Alert</h4>
                <p>Alert on login from unrecognized device</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="rule-card">
              <div className="rule-icon">
                <Activity size={24} />
              </div>
              <div className="rule-info">
                <h4>Rate Limiting</h4>
                <p>Limit API requests to 1000/minute per key</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="rule-card">
              <div className="rule-icon">
                <Database size={24} />
              </div>
              <div className="rule-info">
                <h4>Bulk Export Alert</h4>
                <p>Alert when &gt;10,000 records exported</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="rule-card">
              <div className="rule-icon">
                <Key size={24} />
              </div>
              <div className="rule-info">
                <h4>Session Timeout</h4>
                <p>Auto-logout after 30 minutes of inactivity</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Plus(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
