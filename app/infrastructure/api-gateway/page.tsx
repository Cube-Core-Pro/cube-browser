'use client';

import React, { useState } from 'react';
import {
  Globe,
  Server,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Download,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Zap,
  Lock,
  Unlock,
  Key,
  BarChart3,
  TrendingUp,
  Users,
  FileCode,
  Layers,
  Link2,
  ExternalLink,
  Code,
  Terminal,
  Database,
  Cpu,
  HardDrive,
  Gauge,
  Timer,
  ShieldCheck,
  ShieldOff,
  Route,
  GitBranch,
  Box,
  Boxes,
  Network,
  Webhook
} from 'lucide-react';
import './api-gateway.css';

interface APIRoute {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  name: string;
  service: string;
  version: string;
  status: 'active' | 'deprecated' | 'disabled' | 'beta';
  authentication: 'required' | 'optional' | 'none';
  rateLimit: {
    requests: number;
    window: string;
  };
  caching: {
    enabled: boolean;
    ttl?: number;
  };
  requestsToday: number;
  avgLatency: number;
  errorRate: number;
  lastUpdated: string;
}

interface APIService {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'healthy' | 'degraded' | 'down';
  routes: number;
  uptime: number;
  requestsPerMin: number;
  avgResponseTime: number;
  instances: number;
  endpoint: string;
}

interface RateLimitPolicy {
  id: string;
  name: string;
  description: string;
  type: 'global' | 'per-user' | 'per-ip' | 'per-key';
  limit: number;
  window: string;
  burstLimit?: number;
  applied: number;
  status: 'active' | 'inactive';
}

interface SecurityPolicy {
  id: string;
  name: string;
  type: 'cors' | 'jwt' | 'oauth' | 'api-key' | 'ip-whitelist' | 'waf';
  status: 'enabled' | 'disabled';
  lastTriggered?: string;
  blockCount: number;
}

interface APIMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

const API_ROUTES: APIRoute[] = [
  {
    id: 'route-001',
    path: '/api/v2/users',
    method: 'GET',
    name: 'List Users',
    service: 'User Service',
    version: 'v2',
    status: 'active',
    authentication: 'required',
    rateLimit: { requests: 1000, window: '1min' },
    caching: { enabled: true, ttl: 300 },
    requestsToday: 245680,
    avgLatency: 45,
    errorRate: 0.02,
    lastUpdated: '2025-01-25T14:00:00Z'
  },
  {
    id: 'route-002',
    path: '/api/v2/users/:id',
    method: 'GET',
    name: 'Get User by ID',
    service: 'User Service',
    version: 'v2',
    status: 'active',
    authentication: 'required',
    rateLimit: { requests: 2000, window: '1min' },
    caching: { enabled: true, ttl: 60 },
    requestsToday: 189450,
    avgLatency: 32,
    errorRate: 0.01,
    lastUpdated: '2025-01-25T14:00:00Z'
  },
  {
    id: 'route-003',
    path: '/api/v2/auth/login',
    method: 'POST',
    name: 'User Login',
    service: 'Auth Service',
    version: 'v2',
    status: 'active',
    authentication: 'none',
    rateLimit: { requests: 100, window: '1min' },
    caching: { enabled: false },
    requestsToday: 56780,
    avgLatency: 125,
    errorRate: 0.5,
    lastUpdated: '2025-01-24T10:30:00Z'
  },
  {
    id: 'route-004',
    path: '/api/v2/payments',
    method: 'POST',
    name: 'Create Payment',
    service: 'Payment Gateway',
    version: 'v2',
    status: 'active',
    authentication: 'required',
    rateLimit: { requests: 500, window: '1min' },
    caching: { enabled: false },
    requestsToday: 34520,
    avgLatency: 245,
    errorRate: 0.08,
    lastUpdated: '2025-01-26T09:00:00Z'
  },
  {
    id: 'route-005',
    path: '/api/v2/search',
    method: 'GET',
    name: 'Global Search',
    service: 'Search Engine',
    version: 'v2',
    status: 'active',
    authentication: 'optional',
    rateLimit: { requests: 300, window: '1min' },
    caching: { enabled: true, ttl: 30 },
    requestsToday: 128900,
    avgLatency: 89,
    errorRate: 0.03,
    lastUpdated: '2025-01-27T16:45:00Z'
  },
  {
    id: 'route-006',
    path: '/api/v1/users',
    method: 'GET',
    name: 'List Users (Legacy)',
    service: 'User Service',
    version: 'v1',
    status: 'deprecated',
    authentication: 'required',
    rateLimit: { requests: 500, window: '1min' },
    caching: { enabled: true, ttl: 300 },
    requestsToday: 12340,
    avgLatency: 78,
    errorRate: 0.15,
    lastUpdated: '2024-06-15T00:00:00Z'
  },
  {
    id: 'route-007',
    path: '/api/v3/analytics',
    method: 'GET',
    name: 'Analytics Data',
    service: 'Analytics Service',
    version: 'v3',
    status: 'beta',
    authentication: 'required',
    rateLimit: { requests: 200, window: '1min' },
    caching: { enabled: true, ttl: 120 },
    requestsToday: 8920,
    avgLatency: 156,
    errorRate: 0.25,
    lastUpdated: '2025-01-28T08:00:00Z'
  }
];

const API_SERVICES: APIService[] = [
  {
    id: 'svc-001',
    name: 'User Service',
    version: '2.4.1',
    description: 'User management and profile operations',
    status: 'healthy',
    routes: 12,
    uptime: 99.98,
    requestsPerMin: 8450,
    avgResponseTime: 42,
    instances: 6,
    endpoint: 'user-service.internal:8080'
  },
  {
    id: 'svc-002',
    name: 'Auth Service',
    version: '3.1.0',
    description: 'Authentication and authorization',
    status: 'healthy',
    routes: 8,
    uptime: 99.99,
    requestsPerMin: 3200,
    avgResponseTime: 95,
    instances: 4,
    endpoint: 'auth-service.internal:8080'
  },
  {
    id: 'svc-003',
    name: 'Payment Gateway',
    version: '2.0.5',
    description: 'Payment processing and transactions',
    status: 'healthy',
    routes: 6,
    uptime: 99.95,
    requestsPerMin: 1250,
    avgResponseTime: 185,
    instances: 4,
    endpoint: 'payment-gateway.internal:8080'
  },
  {
    id: 'svc-004',
    name: 'Search Engine',
    version: '4.2.0',
    description: 'Full-text search and indexing',
    status: 'degraded',
    routes: 4,
    uptime: 98.75,
    requestsPerMin: 5680,
    avgResponseTime: 125,
    instances: 8,
    endpoint: 'search-engine.internal:9200'
  },
  {
    id: 'svc-005',
    name: 'Analytics Service',
    version: '3.0.0-beta',
    description: 'Real-time analytics and reporting',
    status: 'healthy',
    routes: 5,
    uptime: 99.45,
    requestsPerMin: 890,
    avgResponseTime: 210,
    instances: 3,
    endpoint: 'analytics-service.internal:8080'
  }
];

const RATE_LIMIT_POLICIES: RateLimitPolicy[] = [
  {
    id: 'rl-001',
    name: 'Standard Rate Limit',
    description: 'Default rate limit for authenticated users',
    type: 'per-user',
    limit: 1000,
    window: '1 minute',
    burstLimit: 50,
    applied: 45,
    status: 'active'
  },
  {
    id: 'rl-002',
    name: 'Premium Rate Limit',
    description: 'Elevated rate limit for premium subscribers',
    type: 'per-key',
    limit: 5000,
    window: '1 minute',
    burstLimit: 200,
    applied: 12,
    status: 'active'
  },
  {
    id: 'rl-003',
    name: 'Anonymous Rate Limit',
    description: 'Restrictive limit for unauthenticated requests',
    type: 'per-ip',
    limit: 100,
    window: '1 minute',
    burstLimit: 10,
    applied: 28,
    status: 'active'
  },
  {
    id: 'rl-004',
    name: 'Global Emergency Limit',
    description: 'Emergency throttling for high load situations',
    type: 'global',
    limit: 50000,
    window: '1 minute',
    applied: 1,
    status: 'inactive'
  }
];

const SECURITY_POLICIES: SecurityPolicy[] = [
  {
    id: 'sec-001',
    name: 'CORS Policy',
    type: 'cors',
    status: 'enabled',
    blockCount: 1250
  },
  {
    id: 'sec-002',
    name: 'JWT Authentication',
    type: 'jwt',
    status: 'enabled',
    lastTriggered: '2025-01-28T19:45:00Z',
    blockCount: 8420
  },
  {
    id: 'sec-003',
    name: 'OAuth 2.0 Provider',
    type: 'oauth',
    status: 'enabled',
    blockCount: 0
  },
  {
    id: 'sec-004',
    name: 'API Key Validation',
    type: 'api-key',
    status: 'enabled',
    lastTriggered: '2025-01-28T18:30:00Z',
    blockCount: 3450
  },
  {
    id: 'sec-005',
    name: 'IP Whitelist',
    type: 'ip-whitelist',
    status: 'disabled',
    blockCount: 0
  },
  {
    id: 'sec-006',
    name: 'Web Application Firewall',
    type: 'waf',
    status: 'enabled',
    lastTriggered: '2025-01-28T19:55:00Z',
    blockCount: 12680
  }
];

const METHOD_COLORS: Record<string, { color: string; bg: string }> = {
  GET: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  POST: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  PUT: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  PATCH: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  DELETE: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  OPTIONS: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
  HEAD: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' }
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Active' },
  deprecated: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Deprecated' },
  disabled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Disabled' },
  beta: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', label: 'Beta' },
  healthy: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Healthy' },
  degraded: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Degraded' },
  down: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Down' },
  enabled: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Enabled' },
  inactive: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', label: 'Inactive' }
};

export default function APIGatewayPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'services' | 'policies' | 'security'>('overview');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const totalRequests = API_ROUTES.reduce((acc, r) => acc + r.requestsToday, 0);
  const avgLatency = Math.round(API_ROUTES.reduce((acc, r) => acc + r.avgLatency, 0) / API_ROUTES.length);
  const activeRoutes = API_ROUTES.filter(r => r.status === 'active').length;
  const healthyServices = API_SERVICES.filter(s => s.status === 'healthy').length;

  const metrics: APIMetric[] = [
    { label: 'Total Requests Today', value: (totalRequests / 1000).toFixed(1) + 'K', change: 12.5, trend: 'up', icon: <BarChart3 size={20} /> },
    { label: 'Avg Response Time', value: avgLatency + 'ms', change: -8.2, trend: 'down', icon: <Timer size={20} /> },
    { label: 'Active Routes', value: activeRoutes.toString(), change: 2, trend: 'up', icon: <Route size={20} /> },
    { label: 'Healthy Services', value: `${healthyServices}/${API_SERVICES.length}`, change: 0, trend: 'stable', icon: <Server size={20} /> }
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const filteredRoutes = API_ROUTES.filter(route => {
    const matchesSearch = route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         route.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVersion = selectedVersion === 'all' || route.version === selectedVersion;
    return matchesSearch && matchesVersion;
  });

  return (
    <div className="api-gateway">
      {/* Header */}
      <header className="apigw__header">
        <div className="apigw__title-section">
          <div className="apigw__icon">
            <Globe size={28} />
          </div>
          <div>
            <h1>API Gateway</h1>
            <p>Route management, rate limiting, and API security</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export OpenAPI
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Gateway Settings
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Route
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="apigw__stats">
        {metrics.map((metric, index) => (
          <div key={index} className={`stat-card ${index === 0 ? 'primary' : ''}`}>
            <div className="stat-icon">
              {metric.icon}
            </div>
            <div className="stat-content">
              <span className="stat-value">{metric.value}</span>
              <span className="stat-label">{metric.label}</span>
            </div>
            <span className={`stat-change ${metric.trend}`}>
              {metric.trend === 'up' && <ArrowUpRight size={14} />}
              {metric.trend === 'down' && <ArrowDownRight size={14} />}
              {metric.change !== 0 ? `${metric.change > 0 ? '+' : ''}${metric.change}%` : 'Stable'}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="apigw__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <Route size={16} />
          Routes
          <span className="tab-badge">{API_ROUTES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Server size={16} />
          Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Gauge size={16} />
          Rate Limits
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={16} />
          Security
        </button>
      </div>

      {/* Content */}
      <div className="apigw__content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Traffic Overview */}
            <div className="traffic-overview">
              <h3>API Traffic Overview</h3>
              <div className="traffic-chart">
                <div className="chart-header">
                  <span className="chart-title">Requests per Hour</span>
                  <div className="chart-legend">
                    <span className="legend-item success"><span className="dot"></span>Success</span>
                    <span className="legend-item error"><span className="dot"></span>Errors</span>
                  </div>
                </div>
                <div className="chart-bars">
                  {[85, 92, 78, 95, 88, 91, 85, 97, 89, 93, 87, 94, 90, 88, 95, 92, 89, 91, 86, 94, 90, 88, 93, 96].map((val, idx) => (
                    <div key={idx} className="bar-group">
                      <div className="bar success" style={{ height: `${val}%` }}></div>
                      <div className="bar error" style={{ height: `${100 - val}%` }}></div>
                    </div>
                  ))}
                </div>
                <div className="chart-labels">
                  <span>12:00</span>
                  <span>6:00</span>
                  <span>12:00</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* Top Endpoints */}
            <div className="top-endpoints">
              <h3>Top Endpoints by Traffic</h3>
              <div className="endpoints-list">
                {API_ROUTES.slice(0, 5).sort((a, b) => b.requestsToday - a.requestsToday).map((route, index) => (
                  <div key={route.id} className="endpoint-item">
                    <span className="endpoint-rank">#{index + 1}</span>
                    <span 
                      className="endpoint-method"
                      style={{ 
                        background: METHOD_COLORS[route.method].bg,
                        color: METHOD_COLORS[route.method].color 
                      }}
                    >
                      {route.method}
                    </span>
                    <span className="endpoint-path">{route.path}</span>
                    <span className="endpoint-requests">{formatNumber(route.requestsToday)} req</span>
                    <span className="endpoint-latency">{route.avgLatency}ms</span>
                    <span className={`endpoint-error ${route.errorRate > 0.1 ? 'high' : ''}`}>
                      {route.errorRate}% err
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Health */}
            <div className="services-health">
              <h3>Backend Services Health</h3>
              <div className="services-grid">
                {API_SERVICES.map(service => (
                  <div key={service.id} className={`service-health-card ${service.status}`}>
                    <div className="service-header">
                      <h4>{service.name}</h4>
                      <span 
                        className="service-status"
                        style={{ 
                          background: STATUS_CONFIG[service.status].bg,
                          color: STATUS_CONFIG[service.status].color
                        }}
                      >
                        {STATUS_CONFIG[service.status].label}
                      </span>
                    </div>
                    <div className="service-metrics">
                      <div className="metric">
                        <span className="metric-value">{service.uptime}%</span>
                        <span className="metric-label">Uptime</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{service.avgResponseTime}ms</span>
                        <span className="metric-label">Latency</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{service.instances}</span>
                        <span className="metric-label">Instances</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="routes-section">
            <div className="routes-toolbar">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text"
                  placeholder="Search routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select 
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                >
                  <option value="all">All Versions</option>
                  <option value="v1">v1</option>
                  <option value="v2">v2</option>
                  <option value="v3">v3</option>
                </select>
                <button className="btn-outline">
                  <Filter size={16} />
                  Filters
                </button>
              </div>
            </div>

            <div className="routes-list">
              {filteredRoutes.map(route => {
                const isExpanded = expandedRoute === route.id;
                const methodStyle = METHOD_COLORS[route.method];
                const statusConfig = STATUS_CONFIG[route.status];

                return (
                  <div key={route.id} className={`route-card ${route.status}`}>
                    <div className="route-header" onClick={() => setExpandedRoute(isExpanded ? null : route.id)}>
                      <div className="route-method-path">
                        <span 
                          className="route-method"
                          style={{ background: methodStyle.bg, color: methodStyle.color }}
                        >
                          {route.method}
                        </span>
                        <span className="route-path">{route.path}</span>
                        <span className="route-version">{route.version}</span>
                      </div>
                      <div className="route-name">{route.name}</div>
                      <div className="route-stats">
                        <span className="stat-item">
                          <BarChart3 size={12} />
                          {formatNumber(route.requestsToday)}
                        </span>
                        <span className="stat-item">
                          <Timer size={12} />
                          {route.avgLatency}ms
                        </span>
                        <span className={`stat-item error ${route.errorRate > 0.1 ? 'high' : ''}`}>
                          <AlertTriangle size={12} />
                          {route.errorRate}%
                        </span>
                      </div>
                      <div className="route-badges">
                        <span 
                          className="status-badge"
                          style={{ background: statusConfig.bg, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                        {route.authentication === 'required' && (
                          <span className="auth-badge required">
                            <Lock size={10} />
                            Auth
                          </span>
                        )}
                        {route.caching.enabled && (
                          <span className="cache-badge">
                            <Database size={10} />
                            Cached
                          </span>
                        )}
                      </div>
                      <button className="expand-btn">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="route-details">
                        <div className="details-grid">
                          <div className="detail-group">
                            <h5>Configuration</h5>
                            <div className="detail-items">
                              <div className="detail-item">
                                <span className="detail-label">Backend Service</span>
                                <span className="detail-value">{route.service}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Authentication</span>
                                <span className={`detail-value auth-${route.authentication}`}>
                                  {route.authentication === 'required' && <Lock size={12} />}
                                  {route.authentication === 'optional' && <Unlock size={12} />}
                                  {route.authentication === 'none' && <Unlock size={12} />}
                                  {route.authentication}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Rate Limit</span>
                                <span className="detail-value">{route.rateLimit.requests} req/{route.rateLimit.window}</span>
                              </div>
                              {route.caching.enabled && (
                                <div className="detail-item">
                                  <span className="detail-label">Cache TTL</span>
                                  <span className="detail-value">{route.caching.ttl}s</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="detail-group">
                            <h5>Performance</h5>
                            <div className="performance-metrics">
                              <div className="perf-metric">
                                <span className="perf-label">Requests Today</span>
                                <span className="perf-value">{formatNumber(route.requestsToday)}</span>
                              </div>
                              <div className="perf-metric">
                                <span className="perf-label">Avg Latency</span>
                                <span className="perf-value">{route.avgLatency}ms</span>
                              </div>
                              <div className="perf-metric">
                                <span className="perf-label">Error Rate</span>
                                <span className={`perf-value ${route.errorRate > 0.1 ? 'error' : ''}`}>{route.errorRate}%</span>
                              </div>
                              <div className="perf-metric">
                                <span className="perf-label">Last Updated</span>
                                <span className="perf-value">{formatDate(route.lastUpdated)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="route-actions">
                          <button className="action-btn">
                            <Eye size={14} />
                            View Logs
                          </button>
                          <button className="action-btn">
                            <Terminal size={14} />
                            Test Endpoint
                          </button>
                          <button className="action-btn">
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button className="action-btn">
                            <Copy size={14} />
                            Duplicate
                          </button>
                          {route.status === 'active' && (
                            <button className="action-btn warning">
                              <Pause size={14} />
                              Disable
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

        {activeTab === 'services' && (
          <div className="services-section">
            <div className="services-list">
              {API_SERVICES.map(service => {
                const statusConfig = STATUS_CONFIG[service.status];
                return (
                  <div key={service.id} className={`service-card ${service.status}`}>
                    <div className="service-main">
                      <div className="service-icon">
                        <Server size={24} />
                      </div>
                      <div className="service-info">
                        <div className="service-title-row">
                          <h4>{service.name}</h4>
                          <span className="service-version">{service.version}</span>
                          <span 
                            className="service-status"
                            style={{ background: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="service-description">{service.description}</p>
                        <div className="service-endpoint">
                          <Link2 size={12} />
                          {service.endpoint}
                        </div>
                      </div>
                    </div>
                    <div className="service-stats">
                      <div className="stat-item">
                        <span className="stat-value">{service.routes}</span>
                        <span className="stat-label">Routes</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{service.uptime}%</span>
                        <span className="stat-label">Uptime</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{service.requestsPerMin}</span>
                        <span className="stat-label">Req/min</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{service.avgResponseTime}ms</span>
                        <span className="stat-label">Latency</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{service.instances}</span>
                        <span className="stat-label">Instances</span>
                      </div>
                    </div>
                    <div className="service-actions">
                      <button className="icon-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button className="icon-btn" title="View Routes">
                        <Route size={16} />
                      </button>
                      <button className="icon-btn" title="Settings">
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="policies-section">
            <div className="policies-header">
              <h3>Rate Limiting Policies</h3>
              <button className="btn-primary">
                <Plus size={16} />
                New Policy
              </button>
            </div>
            <div className="policies-list">
              {RATE_LIMIT_POLICIES.map(policy => {
                const statusConfig = STATUS_CONFIG[policy.status];
                return (
                  <div key={policy.id} className={`policy-card ${policy.status}`}>
                    <div className="policy-main">
                      <div className={`policy-icon ${policy.type}`}>
                        <Gauge size={20} />
                      </div>
                      <div className="policy-info">
                        <div className="policy-title-row">
                          <h4>{policy.name}</h4>
                          <span className={`policy-type ${policy.type}`}>{policy.type}</span>
                          <span 
                            className="policy-status"
                            style={{ background: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="policy-description">{policy.description}</p>
                      </div>
                    </div>
                    <div className="policy-limits">
                      <div className="limit-item">
                        <span className="limit-value">{policy.limit}</span>
                        <span className="limit-label">Requests</span>
                      </div>
                      <div className="limit-item">
                        <span className="limit-value">{policy.window}</span>
                        <span className="limit-label">Window</span>
                      </div>
                      {policy.burstLimit && (
                        <div className="limit-item">
                          <span className="limit-value">{policy.burstLimit}</span>
                          <span className="limit-label">Burst</span>
                        </div>
                      )}
                      <div className="limit-item">
                        <span className="limit-value">{policy.applied}</span>
                        <span className="limit-label">Routes</span>
                      </div>
                    </div>
                    <div className="policy-actions">
                      <button className="icon-btn" title="Edit">
                        <Edit3 size={16} />
                      </button>
                      {policy.status === 'active' ? (
                        <button className="icon-btn" title="Deactivate">
                          <Pause size={16} />
                        </button>
                      ) : (
                        <button className="icon-btn" title="Activate">
                          <Play size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-section">
            <div className="security-header">
              <h3>Security Policies</h3>
              <button className="btn-outline">
                <Settings size={16} />
                Global Settings
              </button>
            </div>
            <div className="security-grid">
              {SECURITY_POLICIES.map(policy => {
                const isEnabled = policy.status === 'enabled';
                return (
                  <div key={policy.id} className={`security-card ${policy.status}`}>
                    <div className="security-header-row">
                      <div className={`security-icon ${policy.type}`}>
                        {policy.type === 'cors' && <Globe size={20} />}
                        {policy.type === 'jwt' && <Key size={20} />}
                        {policy.type === 'oauth' && <Lock size={20} />}
                        {policy.type === 'api-key' && <Key size={20} />}
                        {policy.type === 'ip-whitelist' && <ShieldCheck size={20} />}
                        {policy.type === 'waf' && <Shield size={20} />}
                      </div>
                      <div className="security-toggle">
                        <button className={`toggle-btn ${isEnabled ? 'on' : 'off'}`}>
                          {isEnabled ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </button>
                      </div>
                    </div>
                    <h4>{policy.name}</h4>
                    <span className={`security-type ${policy.type}`}>{policy.type.toUpperCase()}</span>
                    <div className="security-stats">
                      {policy.blockCount > 0 && (
                        <div className="security-stat">
                          <span className="stat-label">Blocked</span>
                          <span className="stat-value">{formatNumber(policy.blockCount)}</span>
                        </div>
                      )}
                      {policy.lastTriggered && (
                        <div className="security-stat">
                          <span className="stat-label">Last Triggered</span>
                          <span className="stat-value">{formatDate(policy.lastTriggered)}</span>
                        </div>
                      )}
                    </div>
                    <button className="configure-btn">
                      <Settings size={14} />
                      Configure
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
