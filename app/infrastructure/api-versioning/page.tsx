'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Code,
  Server,
  History,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Globe,
  Layers,
  Tag,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Zap,
  Lock
} from 'lucide-react';
import './api-versioning.css';

interface APIVersion {
  id: string;
  version: string;
  status: 'stable' | 'beta' | 'deprecated' | 'sunset';
  releaseDate: string;
  sunsetDate?: string;
  endpoints: number;
  activeUsers: number;
  requestsPerDay: number;
  breakingChanges: number;
  changelog: string[];
  documentation: string;
}

interface Endpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  description: string;
  deprecated: boolean;
  rateLimit: number;
  auth: 'public' | 'api-key' | 'oauth' | 'jwt';
  latency: number;
  successRate: number;
}

interface MigrationGuide {
  id: string;
  fromVersion: string;
  toVersion: string;
  changes: number;
  breakingChanges: number;
  status: 'draft' | 'published';
  createdAt: string;
}

interface VersionPolicy {
  id: string;
  name: string;
  type: 'deprecation' | 'sunset' | 'header' | 'routing';
  enabled: boolean;
  config: Record<string, string | number | boolean>;
}

const API_VERSIONS: APIVersion[] = [
  {
    id: '1',
    version: 'v3',
    status: 'stable',
    releaseDate: '2024-09-15',
    endpoints: 156,
    activeUsers: 12456,
    requestsPerDay: 2456789,
    breakingChanges: 0,
    changelog: ['New pagination system', 'GraphQL support', 'Rate limiting improvements', 'WebSocket endpoints'],
    documentation: 'https://docs.cube-elite.com/api/v3'
  },
  {
    id: '2',
    version: 'v3.1-beta',
    status: 'beta',
    releaseDate: '2025-01-10',
    endpoints: 168,
    activeUsers: 234,
    requestsPerDay: 45678,
    breakingChanges: 2,
    changelog: ['AI-powered endpoints', 'Batch operations', 'New auth flow', 'Performance improvements'],
    documentation: 'https://docs.cube-elite.com/api/v3.1-beta'
  },
  {
    id: '3',
    version: 'v2',
    status: 'deprecated',
    releaseDate: '2023-03-20',
    sunsetDate: '2025-06-30',
    endpoints: 142,
    activeUsers: 5678,
    requestsPerDay: 876543,
    breakingChanges: 0,
    changelog: ['REST API improvements', 'New authentication', 'Webhook support'],
    documentation: 'https://docs.cube-elite.com/api/v2'
  },
  {
    id: '4',
    version: 'v1',
    status: 'sunset',
    releaseDate: '2022-01-15',
    sunsetDate: '2024-06-30',
    endpoints: 98,
    activeUsers: 123,
    requestsPerDay: 12345,
    breakingChanges: 0,
    changelog: ['Initial release', 'Basic CRUD operations'],
    documentation: 'https://docs.cube-elite.com/api/v1'
  }
];

const ENDPOINTS: Endpoint[] = [
  { id: '1', path: '/users', method: 'GET', version: 'v3', description: 'List all users', deprecated: false, rateLimit: 1000, auth: 'jwt', latency: 45, successRate: 99.8 },
  { id: '2', path: '/users/{id}', method: 'GET', version: 'v3', description: 'Get user by ID', deprecated: false, rateLimit: 2000, auth: 'jwt', latency: 23, successRate: 99.9 },
  { id: '3', path: '/users', method: 'POST', version: 'v3', description: 'Create new user', deprecated: false, rateLimit: 500, auth: 'jwt', latency: 89, successRate: 99.5 },
  { id: '4', path: '/auth/token', method: 'POST', version: 'v3', description: 'Generate auth token', deprecated: false, rateLimit: 100, auth: 'api-key', latency: 156, successRate: 98.7 },
  { id: '5', path: '/workflows', method: 'GET', version: 'v3', description: 'List workflows', deprecated: false, rateLimit: 500, auth: 'jwt', latency: 67, successRate: 99.6 },
  { id: '6', path: '/webhooks', method: 'POST', version: 'v3', description: 'Register webhook', deprecated: false, rateLimit: 200, auth: 'oauth', latency: 234, successRate: 99.1 },
  { id: '7', path: '/legacy/export', method: 'GET', version: 'v2', description: 'Export data (legacy)', deprecated: true, rateLimit: 50, auth: 'api-key', latency: 456, successRate: 97.2 },
  { id: '8', path: '/ai/analyze', method: 'POST', version: 'v3.1-beta', description: 'AI analysis endpoint', deprecated: false, rateLimit: 100, auth: 'jwt', latency: 1234, successRate: 95.4 }
];

const MIGRATION_GUIDES: MigrationGuide[] = [
  { id: '1', fromVersion: 'v2', toVersion: 'v3', changes: 45, breakingChanges: 8, status: 'published', createdAt: '2024-08-01' },
  { id: '2', fromVersion: 'v3', toVersion: 'v3.1-beta', changes: 12, breakingChanges: 2, status: 'draft', createdAt: '2025-01-05' },
  { id: '3', fromVersion: 'v1', toVersion: 'v2', changes: 67, breakingChanges: 23, status: 'published', createdAt: '2023-02-15' }
];

const VERSION_POLICIES: VersionPolicy[] = [
  { id: '1', name: 'Deprecation Notice', type: 'deprecation', enabled: true, config: { warningPeriod: 90, headerName: 'X-API-Deprecation' } },
  { id: '2', name: 'Sunset Policy', type: 'sunset', enabled: true, config: { minimumNotice: 180, gracePeriod: 30 } },
  { id: '3', name: 'Version Header', type: 'header', enabled: true, config: { headerName: 'X-API-Version', defaultVersion: 'v3' } },
  { id: '4', name: 'URL Routing', type: 'routing', enabled: true, config: { pattern: '/api/{version}/', fallback: 'v3' } }
];

const STATUS_CONFIG = {
  stable: { color: 'success', label: 'Stable', icon: CheckCircle },
  beta: { color: 'info', label: 'Beta', icon: Zap },
  deprecated: { color: 'warning', label: 'Deprecated', icon: AlertTriangle },
  sunset: { color: 'danger', label: 'Sunset', icon: XCircle }
};

const METHOD_CONFIG = {
  GET: { color: 'info' },
  POST: { color: 'success' },
  PUT: { color: 'warning' },
  DELETE: { color: 'danger' },
  PATCH: { color: 'purple' }
};

const AUTH_CONFIG = {
  'public': { label: 'Public', icon: Globe },
  'api-key': { label: 'API Key', icon: Lock },
  'oauth': { label: 'OAuth', icon: Users },
  'jwt': { label: 'JWT', icon: Lock }
};

export default function APIVersioningPage() {
  const [activeTab, setActiveTab] = useState<'versions' | 'endpoints' | 'migrations' | 'policies'>('versions');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [filterVersion, setFilterVersion] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stableVersions = API_VERSIONS.filter(v => v.status === 'stable').length;
  const totalEndpoints = API_VERSIONS.reduce((acc, v) => acc + v.endpoints, 0);
  const totalRequests = API_VERSIONS.reduce((acc, v) => acc + v.requestsPerDay, 0);
  const deprecatedVersions = API_VERSIONS.filter(v => v.status === 'deprecated' || v.status === 'sunset').length;

  const filteredEndpoints = ENDPOINTS.filter(e => {
    const matchesVersion = filterVersion === 'all' || e.version === filterVersion;
    const matchesMethod = filterMethod === 'all' || e.method === filterMethod;
    const matchesSearch = searchQuery === '' || 
      e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVersion && matchesMethod && matchesSearch;
  });

  const renderVersions = () => (
    <div className="versions-section">
      <div className="versions-header">
        <h3>API Versions</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Version
        </button>
      </div>

      <div className="versions-list">
        {API_VERSIONS.map(version => {
          const statusConfig = STATUS_CONFIG[version.status];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedVersion === version.id;

          return (
            <div key={version.id} className={`version-card ${version.status}`}>
              <div className="version-main">
                <div className="version-badge-container">
                  <span className={`version-badge ${statusConfig.color}`}>
                    {version.version}
                  </span>
                </div>

                <div className="version-info">
                  <div className="version-header">
                    <div className={`version-status ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </div>
                    <span className="release-date">
                      <Calendar size={12} />
                      Released {version.releaseDate}
                    </span>
                    {version.sunsetDate && (
                      <span className="sunset-date">
                        <Clock size={12} />
                        Sunset {version.sunsetDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="version-metrics">
                  <div className="v-metric">
                    <span className="metric-value">{version.endpoints}</span>
                    <span className="metric-label">Endpoints</span>
                  </div>
                  <div className="v-metric">
                    <span className="metric-value">{version.activeUsers.toLocaleString()}</span>
                    <span className="metric-label">Active Users</span>
                  </div>
                  <div className="v-metric">
                    <span className="metric-value">{(version.requestsPerDay / 1000000).toFixed(2)}M</span>
                    <span className="metric-label">Req/Day</span>
                  </div>
                </div>

                <div className="version-actions">
                  <a href={version.documentation} className="action-btn" title="Documentation" target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                  </a>
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="version-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h5>Changelog</h5>
                      <ul className="changelog-list">
                        {version.changelog.map((change, i) => (
                          <li key={i}>
                            <CheckCircle size={12} />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="expanded-section">
                      <h5>Version Stats</h5>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-label">Breaking Changes</span>
                          <span className={`stat-value ${version.breakingChanges > 0 ? 'warning' : ''}`}>
                            {version.breakingChanges}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Endpoints</span>
                          <span className="stat-value">{version.endpoints}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Documentation</span>
                          <a href={version.documentation} target="_blank" rel="noreferrer" className="stat-link">
                            View Docs <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <Eye size={14} />
                      View Endpoints
                    </button>
                    <button className="btn-sm">
                      <Edit size={14} />
                      Edit Version
                    </button>
                    {version.status === 'stable' && (
                      <button className="btn-sm warning">
                        <AlertTriangle size={14} />
                        Deprecate
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
  );

  const renderEndpoints = () => (
    <div className="endpoints-section">
      <div className="endpoints-header">
        <div className="endpoints-filters">
          <div className="search-input">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={filterVersion} onChange={(e) => setFilterVersion(e.target.value)}>
            <option value="all">All Versions</option>
            {API_VERSIONS.map(v => (
              <option key={v.id} value={v.version}>{v.version}</option>
            ))}
          </select>
          <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Add Endpoint
        </button>
      </div>

      <div className="endpoints-table">
        <div className="et-header">
          <span className="et-th method">Method</span>
          <span className="et-th path">Path</span>
          <span className="et-th version">Version</span>
          <span className="et-th auth">Auth</span>
          <span className="et-th rate">Rate Limit</span>
          <span className="et-th latency">Latency</span>
          <span className="et-th success">Success Rate</span>
          <span className="et-th actions"></span>
        </div>
        <div className="et-body">
          {filteredEndpoints.map(endpoint => {
            const methodConfig = METHOD_CONFIG[endpoint.method];
            const authConfig = AUTH_CONFIG[endpoint.auth];
            const AuthIcon = authConfig.icon;

            return (
              <div key={endpoint.id} className={`et-row ${endpoint.deprecated ? 'deprecated' : ''}`}>
                <span className="et-td method">
                  <span className={`method-badge ${methodConfig.color}`}>
                    {endpoint.method}
                  </span>
                </span>
                <span className="et-td path">
                  <code>{endpoint.path}</code>
                  {endpoint.deprecated && (
                    <span className="deprecated-badge">Deprecated</span>
                  )}
                </span>
                <span className="et-td version">
                  <span className="version-tag">{endpoint.version}</span>
                </span>
                <span className="et-td auth">
                  <AuthIcon size={14} />
                  {authConfig.label}
                </span>
                <span className="et-td rate">{endpoint.rateLimit}/min</span>
                <span className={`et-td latency ${endpoint.latency > 200 ? 'warning' : endpoint.latency > 500 ? 'danger' : ''}`}>
                  {endpoint.latency}ms
                </span>
                <span className={`et-td success ${endpoint.successRate < 99 ? 'warning' : ''}`}>
                  {endpoint.successRate}%
                </span>
                <span className="et-td actions">
                  <button className="action-btn-sm" title="Copy">
                    <Copy size={14} />
                  </button>
                  <button className="action-btn-sm" title="Edit">
                    <Edit size={14} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMigrations = () => (
    <div className="migrations-section">
      <div className="migrations-header">
        <h3>Migration Guides</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Guide
        </button>
      </div>

      <div className="migrations-grid">
        {MIGRATION_GUIDES.map(guide => (
          <div key={guide.id} className={`migration-card ${guide.status}`}>
            <div className="migration-header">
              <div className="migration-versions">
                <span className="from-version">{guide.fromVersion}</span>
                <ArrowRight size={16} />
                <span className="to-version">{guide.toVersion}</span>
              </div>
              <span className={`migration-status ${guide.status}`}>
                {guide.status}
              </span>
            </div>

            <div className="migration-stats">
              <div className="mig-stat">
                <span className="mig-stat-value">{guide.changes}</span>
                <span className="mig-stat-label">Total Changes</span>
              </div>
              <div className="mig-stat breaking">
                <span className="mig-stat-value">{guide.breakingChanges}</span>
                <span className="mig-stat-label">Breaking Changes</span>
              </div>
            </div>

            <div className="migration-meta">
              <span className="created-date">
                <Calendar size={12} />
                Created {guide.createdAt}
              </span>
            </div>

            <div className="migration-actions">
              <button className="btn-sm">
                <Eye size={14} />
                View Guide
              </button>
              <button className="btn-sm">
                <Edit size={14} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="policies-section">
      <div className="policies-header">
        <h3>Versioning Policies</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Policy
        </button>
      </div>

      <div className="policies-list">
        {VERSION_POLICIES.map(policy => (
          <div key={policy.id} className={`policy-card ${policy.enabled ? 'enabled' : 'disabled'}`}>
            <div className="policy-main">
              <div className={`policy-icon ${policy.type}`}>
                {policy.type === 'deprecation' && <AlertTriangle size={20} />}
                {policy.type === 'sunset' && <Clock size={20} />}
                {policy.type === 'header' && <Code size={20} />}
                {policy.type === 'routing' && <GitBranch size={20} />}
              </div>

              <div className="policy-info">
                <h4>{policy.name}</h4>
                <span className="policy-type">{policy.type}</span>
              </div>

              <div className="policy-config">
                {Object.entries(policy.config).map(([key, value]) => (
                  <div key={key} className="config-item">
                    <span className="config-key">{key}:</span>
                    <span className="config-value">{String(value)}</span>
                  </div>
                ))}
              </div>

              <div className="policy-toggle">
                <label className="toggle-switch">
                  <input type="checkbox" checked={policy.enabled} readOnly />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="policy-actions">
                <button className="action-btn">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="api-versioning">
      <div className="api-versioning__header">
        <div className="api-versioning__title-section">
          <div className="api-versioning__icon">
            <GitBranch size={28} />
          </div>
          <div>
            <h1>API Versioning</h1>
            <p>Manage API versions, endpoints, and migration guides</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div className="api-versioning__stats">
        <div className="stat-card">
          <div className="stat-icon stable">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stableVersions}</span>
            <span className="stat-label">Stable Versions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon endpoints">
            <Code size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalEndpoints}</span>
            <span className="stat-label">Total Endpoints</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon requests">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(totalRequests / 1000000).toFixed(1)}M</span>
            <span className="stat-label">Daily Requests</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon deprecated">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{deprecatedVersions}</span>
            <span className="stat-label">Deprecated/Sunset</span>
          </div>
        </div>
      </div>

      <div className="api-versioning__tabs">
        <button
          className={`tab-btn ${activeTab === 'versions' ? 'active' : ''}`}
          onClick={() => setActiveTab('versions')}
        >
          <Tag size={16} />
          Versions
        </button>
        <button
          className={`tab-btn ${activeTab === 'endpoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('endpoints')}
        >
          <Code size={16} />
          Endpoints
        </button>
        <button
          className={`tab-btn ${activeTab === 'migrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('migrations')}
        >
          <ArrowRight size={16} />
          Migrations
        </button>
        <button
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Settings size={16} />
          Policies
        </button>
      </div>

      <div className="api-versioning__content">
        {activeTab === 'versions' && renderVersions()}
        {activeTab === 'endpoints' && renderEndpoints()}
        {activeTab === 'migrations' && renderMigrations()}
        {activeTab === 'policies' && renderPolicies()}
      </div>
    </div>
  );
}
