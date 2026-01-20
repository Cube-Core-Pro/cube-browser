'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('APIGatewayDashboard');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  APIEndpoint,
  AuthenticationConfig,
  APIMetrics,
} from '../../types/api-gateway';
import './APIGatewayDashboard.css';

// ============================================================================
// TYPES
// ============================================================================

interface APIGatewayDashboardProps {
  endpoints?: APIEndpoint[];
  metrics?: APIMetrics;
  onCreateEndpoint?: (endpoint: Partial<APIEndpoint>) => void;
  onUpdateEndpoint?: (id: string, updates: Partial<APIEndpoint>) => void;
  onDeleteEndpoint?: (id: string) => void;
  onTestEndpoint?: (id: string) => void;
}

type TabType = 'endpoints' | 'routes' | 'auth' | 'rate-limits' | 'analytics' | 'logs';
type ModalType = 'create' | 'edit' | 'test' | null;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const APIGatewayDashboard: React.FC<APIGatewayDashboardProps> = ({
  endpoints: propEndpoints,
  metrics: propMetrics,
  onCreateEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onTestEndpoint,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>(propEndpoints || []);
  const [metrics, setMetrics] = useState<APIMetrics | null>(propMetrics || null);
  const [serverStatus, setServerStatus] = useState<{ running: boolean; port?: number; url?: string } | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    version: 'v1',
    basePath: '',
    description: '',
    authentication: 'api_key' as AuthenticationConfig['type'],
    rateLimit: 1000,
    rateLimitWindow: 60,
  });

  // Load API Gateway data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get API server status
        const status = await invoke<{ running: boolean; port: number | null; url: string | null }>('api_server_get_status');
        setServerStatus({
          running: status.running,
          port: status.port || undefined,
          url: status.url || undefined
        });

        // Generate endpoints based on server status
        const loadedEndpoints: APIEndpoint[] = [
          {
            id: 'ep-webhooks',
            name: 'Webhooks API',
            version: 'v1',
            basePath: '/api/webhooks',
            status: status.running ? 'active' : 'inactive',
            routes: [],
            description: 'External webhook callbacks',
            authentication: { type: 'api_key' },
            rateLimit: { enabled: true, requestsPerWindow: 1000, windowSize: 60, windowUnit: 'minute', strategy: 'fixed_window' }
          },
          {
            id: 'ep-workflows',
            name: 'Workflows API',
            version: 'v1',
            basePath: '/api/workflows',
            status: status.running ? 'active' : 'inactive',
            routes: [],
            description: 'Workflow triggering and management',
            authentication: { type: 'bearer' },
            rateLimit: { enabled: true, requestsPerWindow: 500, windowSize: 60, windowUnit: 'minute', strategy: 'fixed_window' }
          },
          {
            id: 'ep-health',
            name: 'Health Check API',
            version: 'v1',
            basePath: '/api/health',
            status: status.running ? 'active' : 'inactive',
            routes: [],
            description: 'Health check endpoints for monitoring',
            authentication: { type: 'none' },
            rateLimit: { enabled: false, requestsPerWindow: 0, windowSize: 60, windowUnit: 'minute', strategy: 'fixed_window' }
          }
        ];
        setEndpoints(loadedEndpoints);

        // Generate metrics based on server status
        const loadedMetrics: APIMetrics = {
          totalRequests: status.running ? 0 : 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
          p95Latency: 0,
          p99Latency: 0,
          requestsPerSecond: 0,
          activeConnections: status.running ? 1 : 0,
          bandwidthUsed: 0
        };
        setMetrics(loadedMetrics);

      } catch (err) {
        log.error('Failed to load API gateway data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API gateway data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      const matchesSearch = ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.basePath.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ep.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [endpoints, searchQuery, filterStatus]);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
  };

  // Handle form submit
  const handleFormSubmit = useCallback(() => {
    const newEndpoint: Partial<APIEndpoint> = {
      name: formData.name,
      version: formData.version,
      basePath: formData.basePath,
      description: formData.description,
      status: 'inactive',
      routes: [],
      authentication: {
        type: formData.authentication,
        config: {},
      } as AuthenticationConfig,
      rateLimit: {
        enabled: true,
        requestsPerWindow: formData.rateLimit,
        windowSize: formData.rateLimitWindow,
        windowUnit: 'second',
        strategy: 'sliding_window',
      },
    };

    if (modalType === 'create') {
      onCreateEndpoint?.(newEndpoint);
    } else if (modalType === 'edit' && selectedEndpoint) {
      onUpdateEndpoint?.(selectedEndpoint, newEndpoint);
    }

    setModalType(null);
    setFormData({
      name: '',
      version: 'v1',
      basePath: '',
      description: '',
      authentication: 'api_key',
      rateLimit: 1000,
      rateLimitWindow: 60,
    });
  }, [formData, modalType, selectedEndpoint, onCreateEndpoint, onUpdateEndpoint]);

  // Open edit modal
  const handleEdit = useCallback((endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint.id);
    setFormData({
      name: endpoint.name,
      version: endpoint.version,
      basePath: endpoint.basePath,
      description: endpoint.description || '',
      authentication: endpoint.authentication?.type || 'api_key',
      rateLimit: endpoint.rateLimit?.requestsPerWindow || 1000,
      rateLimitWindow: endpoint.rateLimit?.windowSize || 60,
    });
    setModalType('edit');
  }, []);

  // Render metric card
  const renderMetricCard = (label: string, value: string | number, change?: number, icon?: string) => (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <span className="metric-value">{typeof value === 'number' ? formatNumber(value) : value}</span>
        <span className="metric-label">{label}</span>
        {change !== undefined && (
          <span className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );

  // Render endpoint row
  const renderEndpointRow = (endpoint: APIEndpoint) => (
    <div key={endpoint.id} className="endpoint-row">
      <div className="endpoint-info">
        <div className="endpoint-name">
          <span className={`status-dot status-${endpoint.status}`} />
          {endpoint.name}
        </div>
        <span className="endpoint-version">{endpoint.version}</span>
        <code className="endpoint-path">{endpoint.basePath}</code>
      </div>
      <div className="endpoint-stats">
        <span className="stat">
          <span className="stat-label">Routes:</span>
          <span className="stat-value">{endpoint.routes?.length || 0}</span>
        </span>
        <span className="stat">
          <span className="stat-label">Rate Limit:</span>
          <span className="stat-value">{endpoint.rateLimit?.requestsPerWindow || 'N/A'}/s</span>
        </span>
      </div>
      <div className="endpoint-actions">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onTestEndpoint?.(endpoint.id)}
          title="Test endpoint"
        >
          🧪
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => handleEdit(endpoint)}
          title="Edit endpoint"
        >
          ✏️
        </button>
        <button
          className="btn btn-ghost btn-sm btn-danger"
          onClick={() => onDeleteEndpoint?.(endpoint.id)}
          title="Delete endpoint"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="api-gateway-dashboard api-gateway-loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading API gateway data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="api-gateway-dashboard api-gateway-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Failed to Load API Gateway</h3>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="api-gateway-dashboard">
      {/* Server Status Banner */}
      {serverStatus && (
        <div className={`server-status-banner ${serverStatus.running ? 'running' : 'stopped'}`}>
          <span className="status-indicator" />
          <span>API Server: {serverStatus.running ? `Running on ${serverStatus.url}` : 'Stopped'}</span>
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>API Gateway</h1>
          <span className="endpoint-count">{endpoints.length} endpoints configured</span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setModalType('create')}
          >
            + New Endpoint
          </button>
        </div>
      </header>

      {/* Metrics Overview */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {renderMetricCard('Total Requests', metrics?.totalRequests || 0, 12.5, '📊')}
          {renderMetricCard('Success Rate', `${((metrics?.successfulRequests || 0) / (metrics?.totalRequests || 1) * 100).toFixed(2)}%`, 2.3, '✅')}
          {renderMetricCard('Avg Latency', `${metrics?.averageLatency || 0}ms`, -8.1, '⚡')}
          {renderMetricCard('Requests/sec', metrics?.requestsPerSecond || 0, 5.2, '🚀')}
          {renderMetricCard('Active Connections', metrics?.activeConnections || 0, undefined, '🔗')}
          {renderMetricCard('Bandwidth', formatBytes(metrics?.bandwidthUsed || 0), 15.3, '📡')}
        </div>
      </section>

      {/* Tabs */}
      <nav className="dashboard-tabs">
        {(['endpoints', 'routes', 'auth', 'rate-limits', 'analytics', 'logs'] as TabType[]).map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="dashboard-content">
        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="endpoints-section">
            <div className="section-header">
              <div className="search-filter">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search endpoints..."
                    className="search-input"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  className="filter-select"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="endpoints-list">
              {filteredEndpoints.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔌</span>
                  <h3>No endpoints found</h3>
                  <p>Create your first API endpoint to get started</p>
                </div>
              ) : (
                filteredEndpoints.map(ep => renderEndpointRow(ep))
              )}
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="routes-section">
            <div className="routes-header">
              <h2>API Routes</h2>
              <button className="btn btn-primary btn-sm">+ Add Route</button>
            </div>
            <div className="routes-table">
              <div className="table-header">
                <span>Method</span>
                <span>Path</span>
                <span>Handler</span>
                <span>Auth</span>
                <span>Rate Limit</span>
                <span>Actions</span>
              </div>
              <div className="table-row">
                <span className="method method-get">GET</span>
                <code>/users</code>
                <span>listUsers</span>
                <span className="badge">API Key</span>
                <span>100/min</span>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm">✏️</button>
                  <button className="btn btn-ghost btn-sm">🗑️</button>
                </div>
              </div>
              <div className="table-row">
                <span className="method method-post">POST</span>
                <code>/users</code>
                <span>createUser</span>
                <span className="badge">JWT</span>
                <span>50/min</span>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm">✏️</button>
                  <button className="btn btn-ghost btn-sm">🗑️</button>
                </div>
              </div>
              <div className="table-row">
                <span className="method method-get">GET</span>
                <code>/users/:id</code>
                <span>getUser</span>
                <span className="badge">API Key</span>
                <span>200/min</span>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm">✏️</button>
                  <button className="btn btn-ghost btn-sm">🗑️</button>
                </div>
              </div>
              <div className="table-row">
                <span className="method method-put">PUT</span>
                <code>/users/:id</code>
                <span>updateUser</span>
                <span className="badge">JWT</span>
                <span>50/min</span>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm">✏️</button>
                  <button className="btn btn-ghost btn-sm">🗑️</button>
                </div>
              </div>
              <div className="table-row">
                <span className="method method-delete">DELETE</span>
                <code>/users/:id</code>
                <span>deleteUser</span>
                <span className="badge">JWT + RBAC</span>
                <span>10/min</span>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm">✏️</button>
                  <button className="btn btn-ghost btn-sm">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <div className="auth-section">
            <div className="auth-methods">
              <h2>Authentication Methods</h2>
              <div className="auth-grid">
                <div className="auth-card active">
                  <div className="auth-icon">🔑</div>
                  <h3>API Key</h3>
                  <p>Simple key-based authentication for service-to-service calls</p>
                  <span className="auth-status">Active</span>
                </div>
                <div className="auth-card active">
                  <div className="auth-icon">🎫</div>
                  <h3>JWT (Bearer)</h3>
                  <p>Token-based authentication with expiration and claims</p>
                  <span className="auth-status">Active</span>
                </div>
                <div className="auth-card">
                  <div className="auth-icon">🔐</div>
                  <h3>OAuth 2.0</h3>
                  <p>Industry-standard authorization framework</p>
                  <span className="auth-status">Configure</span>
                </div>
                <div className="auth-card">
                  <div className="auth-icon">🏢</div>
                  <h3>SAML SSO</h3>
                  <p>Enterprise single sign-on integration</p>
                  <span className="auth-status">Configure</span>
                </div>
              </div>
            </div>
            <div className="api-keys-section">
              <h2>API Keys</h2>
              <div className="api-keys-list">
                <div className="api-key-row">
                  <div className="key-info">
                    <span className="key-name">Production Key</span>
                    <code className="key-value">sk-prod-****-****-****-abc123</code>
                  </div>
                  <span className="key-created">Created: Nov 15, 2025</span>
                  <span className="key-usage">42,567 requests</span>
                  <div className="key-actions">
                    <button className="btn btn-ghost btn-sm">👁️</button>
                    <button className="btn btn-ghost btn-sm">📋</button>
                    <button className="btn btn-ghost btn-sm btn-danger">🗑️</button>
                  </div>
                </div>
                <div className="api-key-row">
                  <div className="key-info">
                    <span className="key-name">Development Key</span>
                    <code className="key-value">sk-dev-****-****-****-xyz789</code>
                  </div>
                  <span className="key-created">Created: Dec 1, 2025</span>
                  <span className="key-usage">1,234 requests</span>
                  <div className="key-actions">
                    <button className="btn btn-ghost btn-sm">👁️</button>
                    <button className="btn btn-ghost btn-sm">📋</button>
                    <button className="btn btn-ghost btn-sm btn-danger">🗑️</button>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary">+ Generate New Key</button>
            </div>
          </div>
        )}

        {/* Rate Limits Tab */}
        {activeTab === 'rate-limits' && (
          <div className="rate-limits-section">
            <div className="rate-limit-policies">
              <h2>Rate Limit Policies</h2>
              <div className="policies-grid">
                <div className="policy-card">
                  <h3>Default Policy</h3>
                  <div className="policy-stats">
                    <div className="policy-stat">
                      <span className="stat-value">1,000</span>
                      <span className="stat-label">requests/minute</span>
                    </div>
                    <div className="policy-stat">
                      <span className="stat-value">10,000</span>
                      <span className="stat-label">requests/hour</span>
                    </div>
                  </div>
                  <div className="policy-config">
                    <span>Strategy: Sliding Window</span>
                    <span>Burst: 50 requests</span>
                  </div>
                </div>
                <div className="policy-card">
                  <h3>Premium Policy</h3>
                  <div className="policy-stats">
                    <div className="policy-stat">
                      <span className="stat-value">10,000</span>
                      <span className="stat-label">requests/minute</span>
                    </div>
                    <div className="policy-stat">
                      <span className="stat-value">100,000</span>
                      <span className="stat-label">requests/hour</span>
                    </div>
                  </div>
                  <div className="policy-config">
                    <span>Strategy: Token Bucket</span>
                    <span>Burst: 500 requests</span>
                  </div>
                </div>
                <div className="policy-card">
                  <h3>Enterprise Policy</h3>
                  <div className="policy-stats">
                    <div className="policy-stat">
                      <span className="stat-value">Unlimited</span>
                      <span className="stat-label">requests/minute</span>
                    </div>
                    <div className="policy-stat">
                      <span className="stat-value">Custom</span>
                      <span className="stat-label">SLA guaranteed</span>
                    </div>
                  </div>
                  <div className="policy-config">
                    <span>Strategy: Custom</span>
                    <span>Priority: High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-header">
              <h2>API Analytics</h2>
              <div className="time-range">
                <button className="active">24h</button>
                <button>7d</button>
                <button>30d</button>
                <button>90d</button>
              </div>
            </div>
            <div className="analytics-charts">
              <div className="chart-card">
                <h3>Request Volume</h3>
                <div className="chart-placeholder">
                  <div className="mini-chart">
                    {[40, 55, 60, 45, 70, 85, 75, 90, 85, 95, 88, 92].map((h, i) => (
                      <div key={i} className="bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <h3>Response Time (p95)</h3>
                <div className="chart-placeholder">
                  <div className="mini-chart line">
                    {[120, 135, 128, 142, 138, 125, 130, 145, 140, 132, 128, 135].map((h, i) => (
                      <div key={i} className="point" style={{ bottom: `${(h - 100) * 2}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <h3>Error Rate</h3>
                <div className="chart-placeholder">
                  <div className="mini-chart">
                    {[2, 3, 2.5, 4, 3, 2, 2.5, 3.5, 3, 2.5, 2, 2.5].map((h, i) => (
                      <div key={i} className="bar error" style={{ height: `${h * 15}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="top-endpoints">
              <h3>Top Endpoints by Traffic</h3>
              <div className="endpoint-bars">
                <div className="endpoint-bar">
                  <span className="ep-name">GET /api/v1/users</span>
                  <div className="ep-bar-container">
                    <div className="ep-bar-fill" style={{ width: '85%' }} />
                  </div>
                  <span className="ep-count">425K</span>
                </div>
                <div className="endpoint-bar">
                  <span className="ep-name">POST /api/v2/automation/execute</span>
                  <div className="ep-bar-container">
                    <div className="ep-bar-fill" style={{ width: '62%' }} />
                  </div>
                  <span className="ep-count">312K</span>
                </div>
                <div className="endpoint-bar">
                  <span className="ep-name">GET /api/v1/export/data</span>
                  <div className="ep-bar-container">
                    <div className="ep-bar-fill" style={{ width: '45%' }} />
                  </div>
                  <span className="ep-count">228K</span>
                </div>
                <div className="endpoint-bar">
                  <span className="ep-name">PUT /api/v1/users/:id</span>
                  <div className="ep-bar-container">
                    <div className="ep-bar-fill" style={{ width: '28%' }} />
                  </div>
                  <span className="ep-count">142K</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="logs-header">
              <h2>Request Logs</h2>
              <div className="logs-filters">
                <select aria-label="Filter by status code">
                  <option value="all">All Status</option>
                  <option value="2xx">2xx Success</option>
                  <option value="4xx">4xx Client Error</option>
                  <option value="5xx">5xx Server Error</option>
                </select>
                <select aria-label="Filter by method">
                  <option value="all">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <button className="btn btn-secondary btn-sm">Export Logs</button>
              </div>
            </div>
            <div className="logs-list">
              <div className="log-entry">
                <span className="log-time">12:45:32.123</span>
                <span className="log-method method-get">GET</span>
                <span className="log-path">/api/v1/users</span>
                <span className="log-status status-200">200</span>
                <span className="log-latency">45ms</span>
                <span className="log-ip">192.168.1.100</span>
              </div>
              <div className="log-entry">
                <span className="log-time">12:45:31.987</span>
                <span className="log-method method-post">POST</span>
                <span className="log-path">/api/v2/automation/execute</span>
                <span className="log-status status-201">201</span>
                <span className="log-latency">234ms</span>
                <span className="log-ip">10.0.0.50</span>
              </div>
              <div className="log-entry">
                <span className="log-time">12:45:31.654</span>
                <span className="log-method method-get">GET</span>
                <span className="log-path">/api/v1/users/123</span>
                <span className="log-status status-404">404</span>
                <span className="log-latency">12ms</span>
                <span className="log-ip">172.16.0.25</span>
              </div>
              <div className="log-entry">
                <span className="log-time">12:45:30.321</span>
                <span className="log-method method-put">PUT</span>
                <span className="log-path">/api/v1/users/456</span>
                <span className="log-status status-200">200</span>
                <span className="log-latency">89ms</span>
                <span className="log-ip">192.168.1.101</span>
              </div>
              <div className="log-entry error">
                <span className="log-time">12:45:29.876</span>
                <span className="log-method method-post">POST</span>
                <span className="log-path">/api/v1/export/bulk</span>
                <span className="log-status status-500">500</span>
                <span className="log-latency">1234ms</span>
                <span className="log-ip">10.0.0.75</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {modalType && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === 'create' ? 'Create New Endpoint' : 'Edit Endpoint'}</h2>
              <button
                className="modal-close"
                onClick={() => setModalType(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Endpoint Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., User API"
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Version</label>
                  <select
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    aria-label="API version"
                  >
                    <option value="v1">v1</option>
                    <option value="v2">v2</option>
                    <option value="v3">v3</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Base Path</label>
                  <input
                    type="text"
                    value={formData.basePath}
                    onChange={(e) => setFormData({ ...formData, basePath: e.target.value })}
                    placeholder="/api/v1/resource"
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this API endpoint"
                  rows={3}
                />
              </div>
              <div className="form-field">
                <label>Authentication</label>
                <select
                  value={formData.authentication}
                  onChange={(e) => setFormData({ ...formData, authentication: e.target.value as AuthenticationConfig['type'] })}
                  aria-label="Authentication type"
                >
                  <option value="api_key">API Key</option>
                  <option value="jwt">JWT (Bearer Token)</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Rate Limit</label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                    placeholder="1000"
                  />
                </div>
                <div className="form-field">
                  <label>Window (seconds)</label>
                  <input
                    type="number"
                    value={formData.rateLimitWindow}
                    onChange={(e) => setFormData({ ...formData, rateLimitWindow: parseInt(e.target.value) })}
                    placeholder="60"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalType(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {modalType === 'create' ? 'Create Endpoint' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIGatewayDashboard;
