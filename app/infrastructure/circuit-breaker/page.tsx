'use client';

import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Settings,
  Plus,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Power,
  PowerOff,
  Timer,
  Gauge,
  BarChart3,
  Layers,
  Server,
  Database,
  Globe,
  Lock,
  Unlock,
  Play,
  Pause,
  History
} from 'lucide-react';
import './circuit-breaker.css';

interface CircuitBreaker {
  id: string;
  name: string;
  service: string;
  endpoint: string;
  state: 'closed' | 'open' | 'half-open';
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  currentFailures: number;
  currentSuccesses: number;
  lastStateChange: string;
  lastFailure: string | null;
  totalRequests24h: number;
  failureRate24h: number;
  avgResponseTime: number;
  enabled: boolean;
}

interface CircuitEvent {
  id: string;
  circuitId: string;
  circuitName: string;
  event: 'opened' | 'closed' | 'half-opened' | 'failure' | 'success' | 'timeout';
  timestamp: string;
  details: string;
  duration?: number;
}

interface ServiceHealth {
  id: string;
  name: string;
  circuitBreakers: number;
  openCircuits: number;
  healthScore: number;
  avgResponseTime: number;
  totalRequests: string;
  status: 'healthy' | 'degraded' | 'critical';
}

const CIRCUIT_BREAKERS: CircuitBreaker[] = [
  {
    id: '1',
    name: 'Payment Gateway',
    service: 'payment-service',
    endpoint: '/api/v1/payments/process',
    state: 'closed',
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30,
    currentFailures: 1,
    currentSuccesses: 0,
    lastStateChange: '2 hours ago',
    lastFailure: '45 min ago',
    totalRequests24h: 125000,
    failureRate24h: 0.12,
    avgResponseTime: 245,
    enabled: true
  },
  {
    id: '2',
    name: 'User Authentication',
    service: 'auth-service',
    endpoint: '/api/v1/auth/verify',
    state: 'closed',
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 15,
    currentFailures: 0,
    currentSuccesses: 0,
    lastStateChange: '1 day ago',
    lastFailure: null,
    totalRequests24h: 890000,
    failureRate24h: 0.02,
    avgResponseTime: 89,
    enabled: true
  },
  {
    id: '3',
    name: 'Email Service',
    service: 'notification-service',
    endpoint: '/api/v1/email/send',
    state: 'open',
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60,
    currentFailures: 5,
    currentSuccesses: 0,
    lastStateChange: '5 min ago',
    lastFailure: '5 min ago',
    totalRequests24h: 45000,
    failureRate24h: 15.8,
    avgResponseTime: 0,
    enabled: true
  },
  {
    id: '4',
    name: 'SMS Gateway',
    service: 'notification-service',
    endpoint: '/api/v1/sms/send',
    state: 'half-open',
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 45,
    currentFailures: 0,
    currentSuccesses: 2,
    lastStateChange: '2 min ago',
    lastFailure: '10 min ago',
    totalRequests24h: 28000,
    failureRate24h: 8.3,
    avgResponseTime: 312,
    enabled: true
  },
  {
    id: '5',
    name: 'Database Primary',
    service: 'data-service',
    endpoint: '/internal/db/primary',
    state: 'closed',
    failureThreshold: 2,
    successThreshold: 5,
    timeout: 10,
    currentFailures: 0,
    currentSuccesses: 0,
    lastStateChange: '3 days ago',
    lastFailure: null,
    totalRequests24h: 2500000,
    failureRate24h: 0.001,
    avgResponseTime: 12,
    enabled: true
  },
  {
    id: '6',
    name: 'External API Integration',
    service: 'integration-service',
    endpoint: '/api/v1/external/sync',
    state: 'closed',
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 120,
    currentFailures: 3,
    currentSuccesses: 0,
    lastStateChange: '6 hours ago',
    lastFailure: '1 hour ago',
    totalRequests24h: 15000,
    failureRate24h: 2.1,
    avgResponseTime: 1250,
    enabled: false
  }
];

const RECENT_EVENTS: CircuitEvent[] = [
  { id: '1', circuitId: '3', circuitName: 'Email Service', event: 'opened', timestamp: '5 min ago', details: 'Failure threshold reached (5/5)', duration: undefined },
  { id: '2', circuitId: '4', circuitName: 'SMS Gateway', event: 'half-opened', timestamp: '2 min ago', details: 'Timeout expired, testing service', duration: 480 },
  { id: '3', circuitId: '4', circuitName: 'SMS Gateway', event: 'success', timestamp: '1 min ago', details: 'Test request successful (2/3 needed)', duration: undefined },
  { id: '4', circuitId: '1', circuitName: 'Payment Gateway', event: 'failure', timestamp: '45 min ago', details: 'Connection timeout after 30s', duration: 30000 },
  { id: '5', circuitId: '3', circuitName: 'Email Service', event: 'failure', timestamp: '5 min ago', details: 'SMTP server unreachable', duration: undefined },
  { id: '6', circuitId: '6', circuitName: 'External API', event: 'failure', timestamp: '1 hour ago', details: 'Rate limit exceeded (429)', duration: undefined },
  { id: '7', circuitId: '2', circuitName: 'User Authentication', event: 'closed', timestamp: '1 day ago', details: 'All systems operational', duration: undefined }
];

const SERVICE_HEALTH: ServiceHealth[] = [
  { id: '1', name: 'payment-service', circuitBreakers: 3, openCircuits: 0, healthScore: 99.8, avgResponseTime: 198, totalRequests: '245K', status: 'healthy' },
  { id: '2', name: 'auth-service', circuitBreakers: 2, openCircuits: 0, healthScore: 99.9, avgResponseTime: 76, totalRequests: '1.2M', status: 'healthy' },
  { id: '3', name: 'notification-service', circuitBreakers: 4, openCircuits: 1, healthScore: 84.2, avgResponseTime: 425, totalRequests: '89K', status: 'degraded' },
  { id: '4', name: 'data-service', circuitBreakers: 5, openCircuits: 0, healthScore: 99.99, avgResponseTime: 15, totalRequests: '3.8M', status: 'healthy' },
  { id: '5', name: 'integration-service', circuitBreakers: 2, openCircuits: 0, healthScore: 97.9, avgResponseTime: 890, totalRequests: '32K', status: 'healthy' }
];

const STATE_CONFIG = {
  closed: { color: 'success', label: 'Closed', icon: CheckCircle, description: 'Operating normally' },
  open: { color: 'danger', label: 'Open', icon: XCircle, description: 'Requests blocked' },
  'half-open': { color: 'warning', label: 'Half-Open', icon: AlertTriangle, description: 'Testing recovery' }
};

const EVENT_CONFIG = {
  opened: { color: 'danger', icon: PowerOff },
  closed: { color: 'success', icon: Power },
  'half-opened': { color: 'warning', icon: Timer },
  failure: { color: 'danger', icon: XCircle },
  success: { color: 'success', icon: CheckCircle },
  timeout: { color: 'warning', icon: Clock }
};

const HEALTH_STATUS_CONFIG = {
  healthy: { color: 'success', label: 'Healthy' },
  degraded: { color: 'warning', label: 'Degraded' },
  critical: { color: 'danger', label: 'Critical' }
};

export default function CircuitBreakerPage() {
  const [activeTab, setActiveTab] = useState<'circuits' | 'events' | 'services' | 'config'>('circuits');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [expandedCircuit, setExpandedCircuit] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCircuits = CIRCUIT_BREAKERS.filter(cb => cb.state === 'open').length;
  const halfOpenCircuits = CIRCUIT_BREAKERS.filter(cb => cb.state === 'half-open').length;
  const closedCircuits = CIRCUIT_BREAKERS.filter(cb => cb.state === 'closed').length;
  const totalCircuits = CIRCUIT_BREAKERS.length;

  const filteredCircuits = CIRCUIT_BREAKERS.filter(circuit => {
    const matchesSearch = circuit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         circuit.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = stateFilter === 'all' || circuit.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const renderCircuits = () => (
    <div className="circuits-section">
      <div className="circuits-filters">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search circuits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="state-filter">
          <button
            className={`filter-btn ${stateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStateFilter('all')}
          >
            All ({totalCircuits})
          </button>
          <button
            className={`filter-btn success ${stateFilter === 'closed' ? 'active' : ''}`}
            onClick={() => setStateFilter('closed')}
          >
            <CheckCircle size={14} />
            Closed ({closedCircuits})
          </button>
          <button
            className={`filter-btn danger ${stateFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStateFilter('open')}
          >
            <XCircle size={14} />
            Open ({openCircuits})
          </button>
          <button
            className={`filter-btn warning ${stateFilter === 'half-open' ? 'active' : ''}`}
            onClick={() => setStateFilter('half-open')}
          >
            <AlertTriangle size={14} />
            Half-Open ({halfOpenCircuits})
          </button>
        </div>
      </div>

      <div className="circuits-list">
        {filteredCircuits.map(circuit => {
          const stateConfig = STATE_CONFIG[circuit.state];
          const StateIcon = stateConfig.icon;
          const isExpanded = expandedCircuit === circuit.id;

          return (
            <div key={circuit.id} className={`circuit-card ${circuit.state} ${!circuit.enabled ? 'disabled' : ''}`}>
              <div className="circuit-main">
                <div className="circuit-state">
                  <div className={`state-indicator ${stateConfig.color}`}>
                    <StateIcon size={20} />
                  </div>
                </div>

                <div className="circuit-info">
                  <div className="circuit-header">
                    <h3>{circuit.name}</h3>
                    <span className={`state-badge ${stateConfig.color}`}>{stateConfig.label}</span>
                    {!circuit.enabled && <span className="disabled-badge">Disabled</span>}
                  </div>
                  <div className="circuit-meta">
                    <span className="service-name">
                      <Server size={12} />
                      {circuit.service}
                    </span>
                    <span className="endpoint">
                      <Globe size={12} />
                      {circuit.endpoint}
                    </span>
                  </div>
                </div>

                <div className="circuit-metrics">
                  <div className="metric">
                    <span className="metric-value">
                      {circuit.currentFailures}/{circuit.failureThreshold}
                    </span>
                    <span className="metric-label">Failures</span>
                  </div>
                  <div className="metric">
                    <span className={`metric-value ${circuit.failureRate24h > 5 ? 'danger' : circuit.failureRate24h > 1 ? 'warning' : ''}`}>
                      {circuit.failureRate24h}%
                    </span>
                    <span className="metric-label">Failure Rate</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{circuit.avgResponseTime}ms</span>
                    <span className="metric-label">Avg Response</span>
                  </div>
                </div>

                <div className="circuit-progress">
                  {circuit.state === 'closed' && (
                    <div className="progress-bar failure">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(circuit.currentFailures / circuit.failureThreshold) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  {circuit.state === 'half-open' && (
                    <div className="progress-bar success">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(circuit.currentSuccesses / circuit.successThreshold) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  {circuit.state === 'open' && (
                    <div className="timeout-display">
                      <Clock size={14} />
                      <span>{circuit.timeout}s timeout</span>
                    </div>
                  )}
                </div>

                <div className="circuit-actions">
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedCircuit(isExpanded ? null : circuit.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <button className="action-btn">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="circuit-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h4>Configuration</h4>
                      <div className="config-grid">
                        <div className="config-item">
                          <span className="config-label">Failure Threshold</span>
                          <span className="config-value">{circuit.failureThreshold}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Success Threshold</span>
                          <span className="config-value">{circuit.successThreshold}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Timeout</span>
                          <span className="config-value">{circuit.timeout}s</span>
                        </div>
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h4>Statistics (24h)</h4>
                      <div className="config-grid">
                        <div className="config-item">
                          <span className="config-label">Total Requests</span>
                          <span className="config-value">{circuit.totalRequests24h.toLocaleString()}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Last State Change</span>
                          <span className="config-value">{circuit.lastStateChange}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Last Failure</span>
                          <span className="config-value">{circuit.lastFailure || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    {circuit.state === 'open' && (
                      <button className="btn-sm warning">
                        <Play size={14} />
                        Force Half-Open
                      </button>
                    )}
                    {circuit.state === 'half-open' && (
                      <button className="btn-sm success">
                        <Unlock size={14} />
                        Force Close
                      </button>
                    )}
                    <button className="btn-sm">
                      <RefreshCw size={14} />
                      Reset Counters
                    </button>
                    <button className="btn-sm">
                      <Settings size={14} />
                      Configure
                    </button>
                    <button className="btn-sm">
                      {circuit.enabled ? <Pause size={14} /> : <Play size={14} />}
                      {circuit.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <div className="events-header">
        <h3>Recent Events</h3>
        <button className="btn-outline">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="events-timeline">
        {RECENT_EVENTS.map(event => {
          const eventConfig = EVENT_CONFIG[event.event];
          const EventIcon = eventConfig.icon;

          return (
            <div key={event.id} className={`event-item ${eventConfig.color}`}>
              <div className="event-icon">
                <EventIcon size={16} />
              </div>
              <div className="event-content">
                <div className="event-header">
                  <span className="event-circuit">{event.circuitName}</span>
                  <span className={`event-type ${eventConfig.color}`}>{event.event}</span>
                </div>
                <p className="event-details">{event.details}</p>
                {event.duration && (
                  <span className="event-duration">Duration: {event.duration}ms</span>
                )}
              </div>
              <span className="event-time">{event.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="services-section">
      <div className="services-header">
        <h3>Service Health Overview</h3>
      </div>

      <div className="services-grid">
        {SERVICE_HEALTH.map(service => {
          const statusConfig = HEALTH_STATUS_CONFIG[service.status];

          return (
            <div key={service.id} className={`service-card ${service.status}`}>
              <div className="service-header">
                <div className="service-name">
                  <Layers size={18} />
                  <h4>{service.name}</h4>
                </div>
                <span className={`status-badge ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              <div className="service-score">
                <div className={`score-circle ${service.status}`}>
                  <span className="score-value">{service.healthScore.toFixed(1)}</span>
                  <span className="score-label">%</span>
                </div>
                <span className="score-text">Health Score</span>
              </div>

              <div className="service-stats">
                <div className="service-stat">
                  <span className="stat-label">Circuit Breakers</span>
                  <span className="stat-value">{service.circuitBreakers}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label">Open Circuits</span>
                  <span className={`stat-value ${service.openCircuits > 0 ? 'danger' : ''}`}>
                    {service.openCircuits}
                  </span>
                </div>
                <div className="service-stat">
                  <span className="stat-label">Avg Response</span>
                  <span className="stat-value">{service.avgResponseTime}ms</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label">24h Requests</span>
                  <span className="stat-value">{service.totalRequests}</span>
                </div>
              </div>

              <button className="view-circuits-btn">
                View Circuits
                <ChevronDown size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="config-section">
      <div className="config-card">
        <h3>Global Settings</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Default Failure Threshold</label>
            <input type="number" defaultValue={5} min={1} max={100} />
          </div>
          <div className="setting-item">
            <label>Default Success Threshold</label>
            <input type="number" defaultValue={3} min={1} max={100} />
          </div>
          <div className="setting-item">
            <label>Default Timeout (seconds)</label>
            <input type="number" defaultValue={30} min={5} max={300} />
          </div>
          <div className="setting-item">
            <label>Health Check Interval (seconds)</label>
            <input type="number" defaultValue={10} min={1} max={60} />
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn-outline">Reset to Defaults</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="config-card">
        <h3>Alerting</h3>
        <div className="alert-settings">
          <label className="checkbox-setting">
            <input type="checkbox" defaultChecked />
            <span>Send alert when circuit opens</span>
          </label>
          <label className="checkbox-setting">
            <input type="checkbox" defaultChecked />
            <span>Send alert when circuit closes after recovery</span>
          </label>
          <label className="checkbox-setting">
            <input type="checkbox" />
            <span>Send alert on every failure</span>
          </label>
          <label className="checkbox-setting">
            <input type="checkbox" defaultChecked />
            <span>Daily health summary report</span>
          </label>
        </div>
        <div className="alert-channels">
          <h4>Notification Channels</h4>
          <div className="channels-list">
            <div className="channel-item">
              <span className="channel-name">Slack (#alerts)</span>
              <span className="channel-status active">Active</span>
            </div>
            <div className="channel-item">
              <span className="channel-name">Email (ops-team@cube.com)</span>
              <span className="channel-status active">Active</span>
            </div>
            <div className="channel-item">
              <span className="channel-name">PagerDuty</span>
              <span className="channel-status inactive">Inactive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="circuit-breaker">
      <div className="circuit-breaker__header">
        <div className="circuit-breaker__title-section">
          <div className="circuit-breaker__icon">
            <Zap size={28} />
          </div>
          <div>
            <h1>Circuit Breaker</h1>
            <p>Fault tolerance and service resilience management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <History size={16} />
            View History
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Add Circuit
          </button>
        </div>
      </div>

      <div className="circuit-breaker__stats">
        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{closedCircuits}</span>
            <span className="stat-label">Closed Circuits</span>
          </div>
          <span className="stat-description">Operating normally</span>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{openCircuits}</span>
            <span className="stat-label">Open Circuits</span>
          </div>
          <span className="stat-description">Requests blocked</span>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{halfOpenCircuits}</span>
            <span className="stat-label">Half-Open</span>
          </div>
          <span className="stat-description">Testing recovery</span>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">99.4%</span>
            <span className="stat-label">Overall Health</span>
          </div>
          <span className="stat-description">System availability</span>
        </div>
      </div>

      <div className="circuit-breaker__tabs">
        <button
          className={`tab-btn ${activeTab === 'circuits' ? 'active' : ''}`}
          onClick={() => setActiveTab('circuits')}
        >
          <Zap size={16} />
          Circuits
        </button>
        <button
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Activity size={16} />
          Events
        </button>
        <button
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Layers size={16} />
          Services
        </button>
        <button
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={16} />
          Configuration
        </button>
      </div>

      <div className="circuit-breaker__content">
        {activeTab === 'circuits' && renderCircuits()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'config' && renderConfig()}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Circuit Breaker</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Circuit Name</label>
                <input type="text" placeholder="e.g., Payment Gateway" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Service</label>
                  <select defaultValue="">
                    <option value="" disabled>Select service</option>
                    <option value="payment-service">payment-service</option>
                    <option value="auth-service">auth-service</option>
                    <option value="notification-service">notification-service</option>
                    <option value="data-service">data-service</option>
                    <option value="integration-service">integration-service</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Endpoint</label>
                  <input type="text" placeholder="/api/v1/..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Failure Threshold</label>
                  <input type="number" defaultValue={5} min={1} max={100} />
                </div>
                <div className="form-group">
                  <label>Success Threshold</label>
                  <input type="number" defaultValue={3} min={1} max={100} />
                </div>
              </div>
              <div className="form-group">
                <label>Timeout (seconds)</label>
                <input type="number" defaultValue={30} min={5} max={300} />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Enable circuit breaker immediately</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                Create Circuit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
