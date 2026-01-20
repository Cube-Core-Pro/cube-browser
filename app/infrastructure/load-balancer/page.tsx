'use client';

import React, { useState } from 'react';
import {
  Scale,
  Server,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Plus,
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Clock,
  Percent,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Heart,
  Target,
  BarChart3,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import './load-balancer.css';

interface Backend {
  id: string;
  name: string;
  address: string;
  port: number;
  weight: number;
  status: 'healthy' | 'unhealthy' | 'draining' | 'maintenance';
  healthCheck: 'passing' | 'failing' | 'unknown';
  connections: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  cpu: number;
  memory: number;
  region: string;
}

interface LoadBalancerRule {
  id: string;
  name: string;
  type: 'http' | 'https' | 'tcp' | 'udp';
  listenPort: number;
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted' | 'random';
  backends: string[];
  status: 'active' | 'inactive' | 'error';
  sslEnabled: boolean;
  healthCheck: {
    enabled: boolean;
    path: string;
    interval: number;
    timeout: number;
    threshold: number;
  };
  stickySession: boolean;
  connectionLimit: number;
  requestsPerSecond24h: string;
}

interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'https' | 'tcp';
  target: string;
  path: string;
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;
  successRate: number;
}

const BACKENDS: Backend[] = [
  {
    id: '1',
    name: 'api-server-1',
    address: '10.0.1.10',
    port: 8080,
    weight: 100,
    status: 'healthy',
    healthCheck: 'passing',
    connections: 245,
    requestsPerSecond: 1250,
    avgResponseTime: 23,
    cpu: 45,
    memory: 62,
    region: 'us-east-1'
  },
  {
    id: '2',
    name: 'api-server-2',
    address: '10.0.1.11',
    port: 8080,
    weight: 100,
    status: 'healthy',
    healthCheck: 'passing',
    connections: 198,
    requestsPerSecond: 1180,
    avgResponseTime: 25,
    cpu: 52,
    memory: 58,
    region: 'us-east-1'
  },
  {
    id: '3',
    name: 'api-server-3',
    address: '10.0.2.10',
    port: 8080,
    weight: 80,
    status: 'healthy',
    healthCheck: 'passing',
    connections: 156,
    requestsPerSecond: 890,
    avgResponseTime: 28,
    cpu: 38,
    memory: 45,
    region: 'us-west-1'
  },
  {
    id: '4',
    name: 'api-server-4',
    address: '10.0.2.11',
    port: 8080,
    weight: 50,
    status: 'draining',
    healthCheck: 'passing',
    connections: 12,
    requestsPerSecond: 45,
    avgResponseTime: 31,
    cpu: 15,
    memory: 32,
    region: 'us-west-1'
  },
  {
    id: '5',
    name: 'api-server-5',
    address: '10.0.3.10',
    port: 8080,
    weight: 0,
    status: 'maintenance',
    healthCheck: 'unknown',
    connections: 0,
    requestsPerSecond: 0,
    avgResponseTime: 0,
    cpu: 0,
    memory: 0,
    region: 'eu-west-1'
  },
  {
    id: '6',
    name: 'api-server-6',
    address: '10.0.3.11',
    port: 8080,
    weight: 100,
    status: 'unhealthy',
    healthCheck: 'failing',
    connections: 0,
    requestsPerSecond: 0,
    avgResponseTime: 0,
    cpu: 98,
    memory: 95,
    region: 'eu-west-1'
  }
];

const RULES: LoadBalancerRule[] = [
  {
    id: '1',
    name: 'API Gateway',
    type: 'https',
    listenPort: 443,
    algorithm: 'least-connections',
    backends: ['1', '2', '3', '4'],
    status: 'active',
    sslEnabled: true,
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 10,
      timeout: 5,
      threshold: 3
    },
    stickySession: false,
    connectionLimit: 10000,
    requestsPerSecond24h: '12.4M'
  },
  {
    id: '2',
    name: 'WebSocket Gateway',
    type: 'https',
    listenPort: 8443,
    algorithm: 'ip-hash',
    backends: ['1', '2'],
    status: 'active',
    sslEnabled: true,
    healthCheck: {
      enabled: true,
      path: '/ws/health',
      interval: 5,
      timeout: 3,
      threshold: 2
    },
    stickySession: true,
    connectionLimit: 5000,
    requestsPerSecond24h: '2.1M'
  },
  {
    id: '3',
    name: 'Internal Services',
    type: 'tcp',
    listenPort: 9000,
    algorithm: 'round-robin',
    backends: ['3', '4'],
    status: 'active',
    sslEnabled: false,
    healthCheck: {
      enabled: true,
      path: '',
      interval: 15,
      timeout: 5,
      threshold: 3
    },
    stickySession: false,
    connectionLimit: 2000,
    requestsPerSecond24h: '890K'
  }
];

const HEALTH_CHECKS: HealthCheck[] = [
  {
    id: '1',
    name: 'API Health Check',
    type: 'https',
    target: 'api.cube-elite.com',
    path: '/health',
    interval: 10,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    status: 'healthy',
    lastCheck: '2 sec ago',
    successRate: 99.97
  },
  {
    id: '2',
    name: 'WebSocket Health',
    type: 'https',
    target: 'ws.cube-elite.com',
    path: '/ws/health',
    interval: 5,
    timeout: 3,
    healthyThreshold: 2,
    unhealthyThreshold: 2,
    status: 'healthy',
    lastCheck: '1 sec ago',
    successRate: 100
  },
  {
    id: '3',
    name: 'Database Check',
    type: 'tcp',
    target: 'db.internal',
    path: '',
    interval: 30,
    timeout: 10,
    healthyThreshold: 3,
    unhealthyThreshold: 3,
    status: 'healthy',
    lastCheck: '15 sec ago',
    successRate: 99.99
  },
  {
    id: '4',
    name: 'EU Region Check',
    type: 'https',
    target: 'eu.cube-elite.com',
    path: '/health',
    interval: 10,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    status: 'unhealthy',
    lastCheck: '5 sec ago',
    successRate: 78.5
  }
];

const STATUS_CONFIG = {
  healthy: { color: 'success', label: 'Healthy', icon: CheckCircle },
  unhealthy: { color: 'danger', label: 'Unhealthy', icon: XCircle },
  draining: { color: 'warning', label: 'Draining', icon: Clock },
  maintenance: { color: 'info', label: 'Maintenance', icon: Settings }
};

const ALGORITHM_CONFIG = {
  'round-robin': { label: 'Round Robin', description: 'Requests distributed sequentially' },
  'least-connections': { label: 'Least Connections', description: 'Routes to server with fewest connections' },
  'ip-hash': { label: 'IP Hash', description: 'Consistent routing based on client IP' },
  'weighted': { label: 'Weighted', description: 'Distribution based on server weights' },
  'random': { label: 'Random', description: 'Random server selection' }
};

export default function LoadBalancerPage() {
  const [activeTab, setActiveTab] = useState<'backends' | 'rules' | 'health' | 'analytics'>('backends');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedBackend, setExpandedBackend] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const healthyBackends = BACKENDS.filter(b => b.status === 'healthy').length;
  const totalConnections = BACKENDS.reduce((sum, b) => sum + b.connections, 0);
  const avgResponseTime = Math.round(
    BACKENDS.filter(b => b.status === 'healthy')
      .reduce((sum, b) => sum + b.avgResponseTime, 0) / 
    BACKENDS.filter(b => b.status === 'healthy').length
  );
  const totalRPS = BACKENDS.reduce((sum, b) => sum + b.requestsPerSecond, 0);

  const filteredBackends = BACKENDS.filter(backend => {
    const matchesSearch = backend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         backend.address.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || backend.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderBackends = () => (
    <div className="backends-section">
      <div className="backends-filters">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search backends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="status-filter">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`filter-btn ${statusFilter === key ? 'active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="backends-table">
        <div className="table-header">
          <div className="col-status">Status</div>
          <div className="col-name">Server</div>
          <div className="col-address">Address</div>
          <div className="col-weight">Weight</div>
          <div className="col-connections">Connections</div>
          <div className="col-rps">RPS</div>
          <div className="col-response">Response</div>
          <div className="col-resources">Resources</div>
          <div className="col-actions">Actions</div>
        </div>
        {filteredBackends.map(backend => {
          const statusConfig = STATUS_CONFIG[backend.status];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedBackend === backend.id;

          return (
            <div key={backend.id} className={`backend-row ${backend.status}`}>
              <div className="backend-main">
                <div className="col-status">
                  <div className={`status-indicator ${statusConfig.color}`}>
                    <StatusIcon size={16} />
                  </div>
                </div>
                <div className="col-name">
                  <span className="backend-name">{backend.name}</span>
                  <span className="backend-region">{backend.region}</span>
                </div>
                <div className="col-address">
                  <code>{backend.address}:{backend.port}</code>
                </div>
                <div className="col-weight">
                  <span className="weight-value">{backend.weight}</span>
                </div>
                <div className="col-connections">
                  <span className="connections-value">{backend.connections.toLocaleString()}</span>
                </div>
                <div className="col-rps">
                  <span className="rps-value">{backend.requestsPerSecond.toLocaleString()}</span>
                </div>
                <div className="col-response">
                  <span className={`response-value ${backend.avgResponseTime > 50 ? 'slow' : ''}`}>
                    {backend.avgResponseTime}ms
                  </span>
                </div>
                <div className="col-resources">
                  <div className="resource-bars">
                    <div className="resource-bar" title={`CPU: ${backend.cpu}%`}>
                      <Cpu size={12} />
                      <div className="bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${backend.cpu}%`,
                            background: backend.cpu > 80 ? '#ef4444' : backend.cpu > 60 ? '#f59e0b' : '#22c55e'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="resource-bar" title={`Memory: ${backend.memory}%`}>
                      <HardDrive size={12} />
                      <div className="bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${backend.memory}%`,
                            background: backend.memory > 80 ? '#ef4444' : backend.memory > 60 ? '#f59e0b' : '#22c55e'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-actions">
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedBackend(isExpanded ? null : backend.id)}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button className="action-btn">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="backend-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h4>Health Check</h4>
                      <div className={`health-status ${backend.healthCheck}`}>
                        {backend.healthCheck === 'passing' ? (
                          <CheckCircle size={16} />
                        ) : backend.healthCheck === 'failing' ? (
                          <XCircle size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        <span>{backend.healthCheck.charAt(0).toUpperCase() + backend.healthCheck.slice(1)}</span>
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h4>Connection Details</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Active</span>
                          <span className="detail-value">{backend.connections}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Max</span>
                          <span className="detail-value">1000</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Idle</span>
                          <span className="detail-value">45</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    {backend.status === 'healthy' && (
                      <button className="btn-sm warning">
                        <Pause size={14} />
                        Drain
                      </button>
                    )}
                    {backend.status === 'draining' && (
                      <button className="btn-sm success">
                        <Play size={14} />
                        Resume
                      </button>
                    )}
                    {backend.status === 'maintenance' && (
                      <button className="btn-sm success">
                        <RotateCcw size={14} />
                        Bring Online
                      </button>
                    )}
                    <button className="btn-sm">
                      <Edit size={14} />
                      Edit Weight
                    </button>
                    <button className="btn-sm danger">
                      <Trash2 size={14} />
                      Remove
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

  const renderRules = () => (
    <div className="rules-section">
      <div className="rules-header">
        <h3>Load Balancing Rules</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      <div className="rules-list">
        {RULES.map(rule => (
          <div key={rule.id} className={`rule-card ${rule.status}`}>
            <div className="rule-header">
              <div className="rule-info">
                <h4>{rule.name}</h4>
                <div className="rule-badges">
                  <span className={`type-badge ${rule.type}`}>{rule.type.toUpperCase()}</span>
                  <span className="port-badge">:{rule.listenPort}</span>
                  {rule.sslEnabled && <span className="ssl-badge">SSL</span>}
                  {rule.stickySession && <span className="sticky-badge">Sticky</span>}
                </div>
              </div>
              <div className={`rule-status ${rule.status}`}>
                {rule.status === 'active' ? (
                  <CheckCircle size={16} />
                ) : rule.status === 'inactive' ? (
                  <Pause size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{rule.status}</span>
              </div>
            </div>

            <div className="rule-details">
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">Algorithm</span>
                  <span className="detail-value">{ALGORITHM_CONFIG[rule.algorithm].label}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Backends</span>
                  <span className="detail-value">{rule.backends.length} servers</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Connection Limit</span>
                  <span className="detail-value">{rule.connectionLimit.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">24h Requests</span>
                  <span className="detail-value">{rule.requestsPerSecond24h}</span>
                </div>
              </div>

              {rule.healthCheck.enabled && (
                <div className="health-check-info">
                  <Heart size={14} />
                  <span>Health check: {rule.healthCheck.path || 'TCP'} every {rule.healthCheck.interval}s</span>
                </div>
              )}
            </div>

            <div className="rule-actions">
              <button className="btn-sm">
                <Edit size={14} />
                Edit
              </button>
              <button className="btn-sm">
                <Server size={14} />
                Backends
              </button>
              <button className="btn-sm danger">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHealthChecks = () => (
    <div className="health-section">
      <div className="health-header">
        <h3>Health Checks</h3>
        <button className="btn-outline">
          <RefreshCw size={16} />
          Refresh All
        </button>
      </div>

      <div className="health-grid">
        {HEALTH_CHECKS.map(check => (
          <div key={check.id} className={`health-card ${check.status}`}>
            <div className="health-card-header">
              <div className="health-card-icon">
                {check.status === 'healthy' ? (
                  <CheckCircle size={20} />
                ) : check.status === 'unhealthy' ? (
                  <XCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>
              <div className="health-card-info">
                <h4>{check.name}</h4>
                <span className="health-target">{check.target}{check.path}</span>
              </div>
              <span className={`type-badge ${check.type}`}>{check.type.toUpperCase()}</span>
            </div>

            <div className="health-card-stats">
              <div className="health-stat">
                <span className="health-stat-value">{check.successRate}%</span>
                <span className="health-stat-label">Success Rate</span>
              </div>
              <div className="health-stat">
                <span className="health-stat-value">{check.interval}s</span>
                <span className="health-stat-label">Interval</span>
              </div>
              <div className="health-stat">
                <span className="health-stat-value">{check.timeout}s</span>
                <span className="health-stat-label">Timeout</span>
              </div>
            </div>

            <div className="health-card-footer">
              <span className="last-check">Last check: {check.lastCheck}</span>
              <button className="btn-sm">
                <Settings size={14} />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="analytics-header">
            <h3>Traffic Distribution</h3>
            <select defaultValue="24h">
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          <div className="analytics-chart-placeholder">
            <BarChart3 size={48} />
            <p>Traffic distribution chart</p>
          </div>
          <div className="distribution-breakdown">
            {BACKENDS.filter(b => b.status === 'healthy').map(backend => (
              <div key={backend.id} className="distribution-item">
                <span className="distribution-name">{backend.name}</span>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill"
                    style={{ width: `${(backend.requestsPerSecond / totalRPS) * 100}%` }}
                  ></div>
                </div>
                <span className="distribution-percent">
                  {((backend.requestsPerSecond / totalRPS) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <h3>Response Time</h3>
            <select defaultValue="24h">
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          <div className="analytics-chart-placeholder">
            <Activity size={48} />
            <p>Response time chart</p>
          </div>
          <div className="response-stats">
            <div className="response-stat">
              <span className="response-label">p50</span>
              <span className="response-value">18ms</span>
            </div>
            <div className="response-stat">
              <span className="response-label">p95</span>
              <span className="response-value">45ms</span>
            </div>
            <div className="response-stat">
              <span className="response-label">p99</span>
              <span className="response-value">89ms</span>
            </div>
            <div className="response-stat">
              <span className="response-label">Max</span>
              <span className="response-value warning">234ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="realtime-metrics">
        <h3>Real-time Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-icon requests">
              <Zap size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{totalRPS.toLocaleString()}</span>
              <span className="metric-label">Requests/sec</span>
            </div>
            <div className="metric-trend positive">
              <TrendingUp size={14} />
              +5.2%
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-icon connections">
              <Wifi size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{totalConnections.toLocaleString()}</span>
              <span className="metric-label">Active Connections</span>
            </div>
            <div className="metric-trend positive">
              <TrendingUp size={14} />
              +2.8%
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-icon latency">
              <Clock size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{avgResponseTime}ms</span>
              <span className="metric-label">Avg Response Time</span>
            </div>
            <div className="metric-trend negative">
              <TrendingDown size={14} />
              -1.2%
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-icon errors">
              <AlertCircle size={20} />
            </div>
            <div className="metric-info">
              <span className="metric-value">0.02%</span>
              <span className="metric-label">Error Rate</span>
            </div>
            <div className="metric-trend neutral">
              —
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="load-balancer">
      <div className="load-balancer__header">
        <div className="load-balancer__title-section">
          <div className="load-balancer__icon">
            <Scale size={28} />
          </div>
          <div>
            <h1>Load Balancer</h1>
            <p>Traffic distribution, health checks, and backend management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync Config
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Add Backend
          </button>
        </div>
      </div>

      <div className="load-balancer__stats">
        <div className="stat-card">
          <div className="stat-icon healthy">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyBackends}/{BACKENDS.length}</span>
            <span className="stat-label">Healthy Backends</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon connections">
            <Wifi size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalConnections.toLocaleString()}</span>
            <span className="stat-label">Active Connections</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rps">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalRPS.toLocaleString()}</span>
            <span className="stat-label">Requests/Second</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgResponseTime}ms</span>
            <span className="stat-label">Avg Response Time</span>
          </div>
        </div>
      </div>

      <div className="load-balancer__tabs">
        <button
          className={`tab-btn ${activeTab === 'backends' ? 'active' : ''}`}
          onClick={() => setActiveTab('backends')}
        >
          <Server size={16} />
          Backends
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <ArrowUpDown size={16} />
          Rules
        </button>
        <button
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <Heart size={16} />
          Health Checks
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      <div className="load-balancer__content">
        {activeTab === 'backends' && renderBackends()}
        {activeTab === 'rules' && renderRules()}
        {activeTab === 'health' && renderHealthChecks()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Backend Server</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Server Name</label>
                <input type="text" placeholder="e.g., api-server-7" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>IP Address</label>
                  <input type="text" placeholder="e.g., 10.0.1.12" />
                </div>
                <div className="form-group">
                  <label>Port</label>
                  <input type="number" placeholder="8080" defaultValue={8080} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight</label>
                  <input type="number" placeholder="100" defaultValue={100} />
                </div>
                <div className="form-group">
                  <label>Region</label>
                  <select defaultValue="">
                    <option value="" disabled>Select region</option>
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-1">US West (N. California)</option>
                    <option value="eu-west-1">EU (Ireland)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Enable health checks</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Start in maintenance mode</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                Add Backend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
