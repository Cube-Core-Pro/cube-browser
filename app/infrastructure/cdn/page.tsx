'use client';

import React, { useState } from 'react';
import {
  Globe,
  Server,
  Activity,
  Zap,
  MapPin,
  Clock,
  RefreshCw,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  BarChart3,
  TrendingUp,
  Database,
  HardDrive,
  Wifi,
  Shield,
  ArrowRight,
  ExternalLink,
  Copy,
  Download,
  Upload,
  RefreshCcw
} from 'lucide-react';
import './cdn-management.css';

interface CDNEndpoint {
  id: string;
  name: string;
  origin: string;
  cdnUrl: string;
  status: 'active' | 'inactive' | 'provisioning' | 'error';
  provider: 'cloudflare' | 'fastly' | 'akamai' | 'cloudfront' | 'custom';
  cacheHitRatio: number;
  bandwidth24h: string;
  requests24h: string;
  avgLatency: number;
  regions: string[];
  ssl: boolean;
  http2: boolean;
  http3: boolean;
  compression: boolean;
  minification: boolean;
  cacheRules: number;
  createdAt: string;
}

interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
  load: number;
  connections: number;
  cacheSize: string;
}

interface CacheRule {
  id: string;
  pattern: string;
  cacheType: 'standard' | 'aggressive' | 'bypass' | 'custom';
  ttl: number;
  ttlUnit: 'seconds' | 'minutes' | 'hours' | 'days';
  respectOrigin: boolean;
  queryString: 'ignore' | 'include' | 'exclude-specific';
  enabled: boolean;
}

const CDN_ENDPOINTS: CDNEndpoint[] = [
  {
    id: '1',
    name: 'Production Assets',
    origin: 'assets.cube-elite.com',
    cdnUrl: 'cdn.cube-elite.com',
    status: 'active',
    provider: 'cloudflare',
    cacheHitRatio: 94.7,
    bandwidth24h: '2.4 TB',
    requests24h: '12.5M',
    avgLatency: 23,
    regions: ['North America', 'Europe', 'Asia Pacific'],
    ssl: true,
    http2: true,
    http3: true,
    compression: true,
    minification: true,
    cacheRules: 8,
    createdAt: '2024-08-15'
  },
  {
    id: '2',
    name: 'API Gateway CDN',
    origin: 'api.cube-elite.com',
    cdnUrl: 'api-cdn.cube-elite.com',
    status: 'active',
    provider: 'fastly',
    cacheHitRatio: 78.3,
    bandwidth24h: '890 GB',
    requests24h: '8.2M',
    avgLatency: 18,
    regions: ['North America', 'Europe'],
    ssl: true,
    http2: true,
    http3: false,
    compression: true,
    minification: false,
    cacheRules: 5,
    createdAt: '2024-09-20'
  },
  {
    id: '3',
    name: 'Media Streaming',
    origin: 'media.cube-elite.com',
    cdnUrl: 'stream.cube-elite.com',
    status: 'active',
    provider: 'cloudfront',
    cacheHitRatio: 98.2,
    bandwidth24h: '8.7 TB',
    requests24h: '3.1M',
    avgLatency: 31,
    regions: ['Global'],
    ssl: true,
    http2: true,
    http3: true,
    compression: false,
    minification: false,
    cacheRules: 3,
    createdAt: '2024-07-10'
  },
  {
    id: '4',
    name: 'Staging Environment',
    origin: 'staging.cube-elite.com',
    cdnUrl: 'staging-cdn.cube-elite.com',
    status: 'provisioning',
    provider: 'cloudflare',
    cacheHitRatio: 0,
    bandwidth24h: '0 GB',
    requests24h: '0',
    avgLatency: 0,
    regions: ['North America'],
    ssl: true,
    http2: true,
    http3: false,
    compression: true,
    minification: true,
    cacheRules: 2,
    createdAt: '2025-01-28'
  }
];

const EDGE_LOCATIONS: EdgeLocation[] = [
  { id: '1', name: 'New York', region: 'us-east-1', country: 'US', status: 'healthy', latency: 12, load: 67, connections: 45230, cacheSize: '256 GB' },
  { id: '2', name: 'San Francisco', region: 'us-west-1', country: 'US', status: 'healthy', latency: 8, load: 54, connections: 38450, cacheSize: '256 GB' },
  { id: '3', name: 'London', region: 'eu-west-2', country: 'UK', status: 'healthy', latency: 15, load: 72, connections: 52100, cacheSize: '512 GB' },
  { id: '4', name: 'Frankfurt', region: 'eu-central-1', country: 'DE', status: 'healthy', latency: 18, load: 61, connections: 41200, cacheSize: '256 GB' },
  { id: '5', name: 'Singapore', region: 'ap-southeast-1', country: 'SG', status: 'degraded', latency: 45, load: 89, connections: 67800, cacheSize: '512 GB' },
  { id: '6', name: 'Tokyo', region: 'ap-northeast-1', country: 'JP', status: 'healthy', latency: 22, load: 58, connections: 35600, cacheSize: '256 GB' },
  { id: '7', name: 'Sydney', region: 'ap-southeast-2', country: 'AU', status: 'healthy', latency: 35, load: 42, connections: 18900, cacheSize: '128 GB' },
  { id: '8', name: 'São Paulo', region: 'sa-east-1', country: 'BR', status: 'offline', latency: 0, load: 0, connections: 0, cacheSize: '128 GB' }
];

const CACHE_RULES: CacheRule[] = [
  { id: '1', pattern: '*.js', cacheType: 'aggressive', ttl: 30, ttlUnit: 'days', respectOrigin: false, queryString: 'ignore', enabled: true },
  { id: '2', pattern: '*.css', cacheType: 'aggressive', ttl: 30, ttlUnit: 'days', respectOrigin: false, queryString: 'ignore', enabled: true },
  { id: '3', pattern: '*.png,*.jpg,*.gif,*.webp', cacheType: 'aggressive', ttl: 90, ttlUnit: 'days', respectOrigin: false, queryString: 'ignore', enabled: true },
  { id: '4', pattern: '/api/*', cacheType: 'bypass', ttl: 0, ttlUnit: 'seconds', respectOrigin: true, queryString: 'include', enabled: true },
  { id: '5', pattern: '*.html', cacheType: 'standard', ttl: 1, ttlUnit: 'hours', respectOrigin: true, queryString: 'ignore', enabled: true }
];

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active', icon: CheckCircle },
  inactive: { color: 'muted', label: 'Inactive', icon: XCircle },
  provisioning: { color: 'warning', label: 'Provisioning', icon: RefreshCw },
  error: { color: 'danger', label: 'Error', icon: AlertCircle }
};

const PROVIDER_CONFIG = {
  cloudflare: { label: 'Cloudflare', color: '#f38020' },
  fastly: { label: 'Fastly', color: '#ff282d' },
  akamai: { label: 'Akamai', color: '#0096d6' },
  cloudfront: { label: 'CloudFront', color: '#ff9900' },
  custom: { label: 'Custom', color: '#8b5cf6' }
};

const EDGE_STATUS_CONFIG = {
  healthy: { color: 'success', label: 'Healthy' },
  degraded: { color: 'warning', label: 'Degraded' },
  offline: { color: 'danger', label: 'Offline' }
};

export default function CDNManagementPage() {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'edges' | 'cache' | 'analytics'>('endpoints');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalBandwidth = '12.0 TB';
  const totalRequests = '23.8M';
  const avgCacheHitRatio = 90.4;
  const healthyEdges = EDGE_LOCATIONS.filter(e => e.status === 'healthy').length;
  const totalEdges = EDGE_LOCATIONS.length;

  const filteredEndpoints = CDN_ENDPOINTS.filter(endpoint => {
    const matchesSearch = endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         endpoint.origin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || endpoint.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const renderEndpoints = () => (
    <div className="endpoints-section">
      <div className="endpoints-filters">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="provider-filter">
          <button
            className={`provider-btn ${selectedProvider === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedProvider('all')}
          >
            All
          </button>
          {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`provider-btn ${selectedProvider === key ? 'active' : ''}`}
              onClick={() => setSelectedProvider(key)}
              style={{ '--provider-color': config.color } as React.CSSProperties}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="endpoints-list">
        {filteredEndpoints.map(endpoint => {
          const statusConfig = STATUS_CONFIG[endpoint.status];
          const StatusIcon = statusConfig.icon;
          const providerConfig = PROVIDER_CONFIG[endpoint.provider];
          const isExpanded = expandedEndpoint === endpoint.id;

          return (
            <div key={endpoint.id} className={`endpoint-card ${endpoint.status}`}>
              <div className="endpoint-main">
                <div className="endpoint-status">
                  <StatusIcon size={20} />
                </div>

                <div className="endpoint-info">
                  <div className="endpoint-header">
                    <h3>{endpoint.name}</h3>
                    <span 
                      className="provider-badge"
                      style={{ background: `${providerConfig.color}20`, color: providerConfig.color }}
                    >
                      {providerConfig.label}
                    </span>
                    <span className={`status-badge ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="endpoint-urls">
                    <span className="origin">
                      <Server size={12} />
                      {endpoint.origin}
                    </span>
                    <ArrowRight size={12} className="arrow" />
                    <span className="cdn-url">
                      <Globe size={12} />
                      {endpoint.cdnUrl}
                    </span>
                  </div>
                </div>

                <div className="endpoint-metrics">
                  <div className="metric">
                    <span className="metric-value">{endpoint.cacheHitRatio}%</span>
                    <span className="metric-label">Cache Hit</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{endpoint.bandwidth24h}</span>
                    <span className="metric-label">Bandwidth</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{endpoint.avgLatency}ms</span>
                    <span className="metric-label">Latency</span>
                  </div>
                </div>

                <div className="endpoint-features">
                  {endpoint.ssl && <span className="feature-badge" title="SSL/TLS">SSL</span>}
                  {endpoint.http2 && <span className="feature-badge" title="HTTP/2">H2</span>}
                  {endpoint.http3 && <span className="feature-badge" title="HTTP/3">H3</span>}
                  {endpoint.compression && <span className="feature-badge" title="Compression">GZ</span>}
                </div>

                <div className="endpoint-actions">
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedEndpoint(isExpanded ? null : endpoint.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <button className="action-btn">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="endpoint-expanded">
                  <div className="expanded-sections">
                    <div className="expanded-section">
                      <h4>Regions</h4>
                      <div className="region-tags">
                        {endpoint.regions.map(region => (
                          <span key={region} className="region-tag">
                            <MapPin size={12} />
                            {region}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h4>Configuration</h4>
                      <div className="config-grid">
                        <div className="config-item">
                          <span className="config-label">Cache Rules</span>
                          <span className="config-value">{endpoint.cacheRules}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Minification</span>
                          <span className={`config-value ${endpoint.minification ? 'enabled' : 'disabled'}`}>
                            {endpoint.minification ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Created</span>
                          <span className="config-value">{endpoint.createdAt}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">24h Requests</span>
                          <span className="config-value">{endpoint.requests24h}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <Settings size={14} />
                      Configure
                    </button>
                    <button className="btn-sm">
                      <RefreshCcw size={14} />
                      Purge Cache
                    </button>
                    <button className="btn-sm">
                      <BarChart3 size={14} />
                      View Analytics
                    </button>
                    <button className="btn-sm danger">
                      <Trash2 size={14} />
                      Delete
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

  const renderEdgeLocations = () => (
    <div className="edges-section">
      <div className="edges-header">
        <div className="edges-summary">
          <div className="summary-item">
            <span className="summary-value">{healthyEdges}/{totalEdges}</span>
            <span className="summary-label">Healthy Nodes</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">18ms</span>
            <span className="summary-label">Avg Latency</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">2.3 TB</span>
            <span className="summary-label">Total Cache</span>
          </div>
        </div>
        <button className="btn-outline">
          <RefreshCw size={16} />
          Refresh Status
        </button>
      </div>

      <div className="edges-grid">
        {EDGE_LOCATIONS.map(location => {
          const statusConfig = EDGE_STATUS_CONFIG[location.status];
          
          return (
            <div key={location.id} className={`edge-card ${location.status}`}>
              <div className="edge-header">
                <div className="edge-location">
                  <MapPin size={18} />
                  <div>
                    <h4>{location.name}</h4>
                    <span className="edge-region">{location.region}</span>
                  </div>
                </div>
                <span className={`status-dot ${statusConfig.color}`} title={statusConfig.label}></span>
              </div>

              {location.status !== 'offline' ? (
                <div className="edge-metrics">
                  <div className="edge-metric">
                    <span className="edge-metric-label">Latency</span>
                    <span className="edge-metric-value">{location.latency}ms</span>
                  </div>
                  <div className="edge-metric">
                    <span className="edge-metric-label">Load</span>
                    <div className="load-bar">
                      <div 
                        className="load-fill"
                        style={{ 
                          width: `${location.load}%`,
                          background: location.load > 80 ? '#ef4444' : location.load > 60 ? '#f59e0b' : '#22c55e'
                        }}
                      ></div>
                    </div>
                    <span className="edge-metric-value">{location.load}%</span>
                  </div>
                  <div className="edge-metric">
                    <span className="edge-metric-label">Connections</span>
                    <span className="edge-metric-value">{location.connections.toLocaleString()}</span>
                  </div>
                  <div className="edge-metric">
                    <span className="edge-metric-label">Cache</span>
                    <span className="edge-metric-value">{location.cacheSize}</span>
                  </div>
                </div>
              ) : (
                <div className="edge-offline">
                  <AlertCircle size={24} />
                  <p>Node offline - maintenance</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCacheRules = () => (
    <div className="cache-section">
      <div className="cache-header">
        <h3>Cache Rules</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      <div className="cache-rules-list">
        {CACHE_RULES.map((rule, index) => (
          <div key={rule.id} className={`cache-rule ${!rule.enabled ? 'disabled' : ''}`}>
            <div className="rule-order">{index + 1}</div>
            <div className="rule-info">
              <code className="rule-pattern">{rule.pattern}</code>
              <div className="rule-settings">
                <span className={`cache-type-badge ${rule.cacheType}`}>
                  {rule.cacheType}
                </span>
                {rule.cacheType !== 'bypass' && (
                  <span className="ttl-badge">
                    <Clock size={12} />
                    {rule.ttl} {rule.ttlUnit}
                  </span>
                )}
                {rule.respectOrigin && (
                  <span className="origin-badge">Respect Origin</span>
                )}
                <span className="query-badge">
                  Query: {rule.queryString}
                </span>
              </div>
            </div>
            <div className="rule-toggle">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={rule.enabled}
                  onChange={() => {}}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="rule-actions">
              <button className="action-btn" title="Edit">
                <Edit size={16} />
              </button>
              <button className="action-btn danger" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cache-defaults">
        <h3>Default Cache Behavior</h3>
        <div className="defaults-grid">
          <div className="default-item">
            <label>Default TTL</label>
            <select defaultValue="86400">
              <option value="3600">1 hour</option>
              <option value="86400">24 hours</option>
              <option value="604800">7 days</option>
              <option value="2592000">30 days</option>
            </select>
          </div>
          <div className="default-item">
            <label>Browser Cache TTL</label>
            <select defaultValue="14400">
              <option value="0">Respect Origin</option>
              <option value="14400">4 hours</option>
              <option value="86400">1 day</option>
              <option value="604800">7 days</option>
            </select>
          </div>
          <div className="default-item">
            <label>Cache Level</label>
            <select defaultValue="aggressive">
              <option value="bypass">No Query String</option>
              <option value="standard">Standard</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="analytics-header">
            <h3>Bandwidth Usage</h3>
            <select defaultValue="24h">
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="analytics-chart-placeholder">
            <BarChart3 size={48} />
            <p>Bandwidth chart visualization</p>
          </div>
          <div className="analytics-stats">
            <div className="analytics-stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">12.0 TB</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Peak</span>
              <span className="stat-value">890 GB/hr</span>
            </div>
            <div className="analytics-stat positive">
              <span className="stat-label">vs Previous</span>
              <span className="stat-value">
                <TrendingUp size={14} />
                +12.3%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-header">
            <h3>Request Distribution</h3>
            <select defaultValue="24h">
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          <div className="analytics-chart-placeholder">
            <Activity size={48} />
            <p>Request distribution chart</p>
          </div>
          <div className="analytics-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-color" style={{ background: '#22c55e' }}></span>
              <span className="breakdown-label">Cache Hit</span>
              <span className="breakdown-value">90.4%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-color" style={{ background: '#f59e0b' }}></span>
              <span className="breakdown-label">Cache Miss</span>
              <span className="breakdown-value">7.2%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-color" style={{ background: '#ef4444' }}></span>
              <span className="breakdown-label">Bypass</span>
              <span className="breakdown-value">2.4%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="top-content">
        <div className="top-card">
          <h3>Top Cached Content</h3>
          <div className="content-list">
            {[
              { path: '/static/js/main.js', hits: '2.4M', size: '245 KB' },
              { path: '/static/css/app.css', hits: '2.1M', size: '89 KB' },
              { path: '/images/logo.svg', hits: '1.8M', size: '12 KB' },
              { path: '/fonts/inter.woff2', hits: '1.5M', size: '156 KB' },
              { path: '/api/v1/config', hits: '890K', size: '2.1 KB' }
            ].map((content, i) => (
              <div key={i} className="content-item">
                <span className="content-rank">{i + 1}</span>
                <code className="content-path">{content.path}</code>
                <span className="content-hits">{content.hits} hits</span>
                <span className="content-size">{content.size}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="top-card">
          <h3>Geographic Distribution</h3>
          <div className="geo-list">
            {[
              { country: 'United States', percentage: 42.3, requests: '10.1M' },
              { country: 'Germany', percentage: 18.7, requests: '4.5M' },
              { country: 'United Kingdom', percentage: 12.4, requests: '3.0M' },
              { country: 'Japan', percentage: 8.9, requests: '2.1M' },
              { country: 'Australia', percentage: 5.2, requests: '1.2M' }
            ].map((geo, i) => (
              <div key={i} className="geo-item">
                <span className="geo-rank">{i + 1}</span>
                <span className="geo-country">{geo.country}</span>
                <div className="geo-bar">
                  <div className="geo-fill" style={{ width: `${geo.percentage}%` }}></div>
                </div>
                <span className="geo-requests">{geo.requests}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cdn-management">
      <div className="cdn-management__header">
        <div className="cdn-management__title-section">
          <div className="cdn-management__icon">
            <Globe size={28} />
          </div>
          <div>
            <h1>CDN Management</h1>
            <p>Global content delivery network configuration and analytics</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Config
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Add Endpoint
          </button>
        </div>
      </div>

      <div className="cdn-management__stats">
        <div className="stat-card">
          <div className="stat-icon bandwidth">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalBandwidth}</span>
            <span className="stat-label">24h Bandwidth</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon requests">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalRequests}</span>
            <span className="stat-label">24h Requests</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cache">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgCacheHitRatio}%</span>
            <span className="stat-label">Cache Hit Ratio</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon edges">
            <MapPin size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyEdges}/{totalEdges}</span>
            <span className="stat-label">Edge Locations</span>
          </div>
        </div>
      </div>

      <div className="cdn-management__tabs">
        <button
          className={`tab-btn ${activeTab === 'endpoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('endpoints')}
        >
          <Server size={16} />
          Endpoints
        </button>
        <button
          className={`tab-btn ${activeTab === 'edges' ? 'active' : ''}`}
          onClick={() => setActiveTab('edges')}
        >
          <MapPin size={16} />
          Edge Locations
        </button>
        <button
          className={`tab-btn ${activeTab === 'cache' ? 'active' : ''}`}
          onClick={() => setActiveTab('cache')}
        >
          <HardDrive size={16} />
          Cache Rules
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      <div className="cdn-management__content">
        {activeTab === 'endpoints' && renderEndpoints()}
        {activeTab === 'edges' && renderEdgeLocations()}
        {activeTab === 'cache' && renderCacheRules()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add CDN Endpoint</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Endpoint Name</label>
                <input type="text" placeholder="e.g., Production Assets" />
              </div>
              <div className="form-group">
                <label>Origin Server</label>
                <input type="text" placeholder="e.g., origin.example.com" />
              </div>
              <div className="form-group">
                <label>CDN Provider</label>
                <select defaultValue="">
                  <option value="" disabled>Select provider</option>
                  <option value="cloudflare">Cloudflare</option>
                  <option value="fastly">Fastly</option>
                  <option value="akamai">Akamai</option>
                  <option value="cloudfront">AWS CloudFront</option>
                  <option value="custom">Custom CDN</option>
                </select>
              </div>
              <div className="form-group">
                <label>Regions</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>North America</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Europe</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Asia Pacific</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>South America</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Features</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>SSL/TLS</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>HTTP/2</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>HTTP/3 (QUIC)</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Brotli Compression</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                Create Endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
