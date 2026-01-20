'use client';

import React, { useState } from 'react';
import {
  Activity,
  Globe,
  Server,
  Clock,
  Zap,
  Search,
  Filter,
  RefreshCw,
  Download,
  Settings,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Users,
  Map,
  MapPin,
  Layers,
  Target,
  Smartphone,
  Monitor,
  Tablet,
  Code,
  Terminal,
  FileJson,
  Lock,
  Unlock,
  Shield,
  Key,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Calendar,
  Timer,
  Gauge,
  Hash,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';
import './api-analytics.css';

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  requests: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  successRate: number;
  trending: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface APIConsumer {
  id: string;
  name: string;
  apiKey: string;
  requests: number;
  quotaUsed: number;
  quotaLimit: number;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'rate-limited' | 'suspended';
  topEndpoints: string[];
  avgLatency: number;
  errorRate: number;
}

interface ErrorBreakdown {
  code: number;
  message: string;
  count: number;
  percent: number;
  trending: 'up' | 'down' | 'stable';
}

interface GeoDistribution {
  region: string;
  country: string;
  requests: number;
  percent: number;
  avgLatency: number;
}

interface RateLimitEvent {
  id: string;
  consumer: string;
  endpoint: string;
  timestamp: string;
  currentRate: number;
  limit: number;
  exceeded: number;
}

const API_ENDPOINTS: APIEndpoint[] = [
  {
    id: 'ep-1',
    path: '/api/v1/users',
    method: 'GET',
    service: 'user-service',
    requests: 1245890,
    avgLatency: 45,
    p95Latency: 125,
    p99Latency: 245,
    errorRate: 0.8,
    successRate: 99.2,
    trending: 'up',
    trendPercent: 12.5
  },
  {
    id: 'ep-2',
    path: '/api/v1/orders',
    method: 'POST',
    service: 'order-service',
    requests: 456780,
    avgLatency: 156,
    p95Latency: 340,
    p99Latency: 580,
    errorRate: 2.4,
    successRate: 97.6,
    trending: 'down',
    trendPercent: 5.2
  },
  {
    id: 'ep-3',
    path: '/api/v1/payments',
    method: 'POST',
    service: 'payment-service',
    requests: 234560,
    avgLatency: 245,
    p95Latency: 520,
    p99Latency: 890,
    errorRate: 3.8,
    successRate: 96.2,
    trending: 'up',
    trendPercent: 8.3
  },
  {
    id: 'ep-4',
    path: '/api/v1/products/:id',
    method: 'GET',
    service: 'product-service',
    requests: 2345670,
    avgLatency: 32,
    p95Latency: 85,
    p99Latency: 145,
    errorRate: 0.3,
    successRate: 99.7,
    trending: 'stable',
    trendPercent: 0.5
  },
  {
    id: 'ep-5',
    path: '/api/v1/auth/login',
    method: 'POST',
    service: 'auth-service',
    requests: 567890,
    avgLatency: 89,
    p95Latency: 180,
    p99Latency: 320,
    errorRate: 1.2,
    successRate: 98.8,
    trending: 'up',
    trendPercent: 25.6
  },
  {
    id: 'ep-6',
    path: '/api/v1/search',
    method: 'GET',
    service: 'search-service',
    requests: 890450,
    avgLatency: 78,
    p95Latency: 190,
    p99Latency: 380,
    errorRate: 0.5,
    successRate: 99.5,
    trending: 'up',
    trendPercent: 45.2
  },
  {
    id: 'ep-7',
    path: '/api/v1/inventory',
    method: 'PUT',
    service: 'inventory-service',
    requests: 123450,
    avgLatency: 134,
    p95Latency: 290,
    p99Latency: 450,
    errorRate: 1.8,
    successRate: 98.2,
    trending: 'down',
    trendPercent: 3.4
  },
  {
    id: 'ep-8',
    path: '/api/v1/notifications',
    method: 'POST',
    service: 'notification-service',
    requests: 345670,
    avgLatency: 45,
    p95Latency: 110,
    p99Latency: 180,
    errorRate: 0.2,
    successRate: 99.8,
    trending: 'stable',
    trendPercent: 1.2
  }
];

const API_CONSUMERS: APIConsumer[] = [
  {
    id: 'consumer-1',
    name: 'Mobile App iOS',
    apiKey: 'mob_ios_****k2f9',
    requests: 4567890,
    quotaUsed: 85,
    quotaLimit: 100,
    plan: 'enterprise',
    status: 'active',
    topEndpoints: ['/api/v1/products', '/api/v1/users', '/api/v1/orders'],
    avgLatency: 65,
    errorRate: 0.8
  },
  {
    id: 'consumer-2',
    name: 'Mobile App Android',
    apiKey: 'mob_and_****h7j3',
    requests: 3890450,
    quotaUsed: 72,
    quotaLimit: 100,
    plan: 'enterprise',
    status: 'active',
    topEndpoints: ['/api/v1/products', '/api/v1/search', '/api/v1/auth'],
    avgLatency: 78,
    errorRate: 1.1
  },
  {
    id: 'consumer-3',
    name: 'Web Application',
    apiKey: 'web_app_****p4m8',
    requests: 2345670,
    quotaUsed: 65,
    quotaLimit: 100,
    plan: 'pro',
    status: 'active',
    topEndpoints: ['/api/v1/users', '/api/v1/orders', '/api/v1/payments'],
    avgLatency: 45,
    errorRate: 0.5
  },
  {
    id: 'consumer-4',
    name: 'Partner Integration A',
    apiKey: 'prt_int_****w2n5',
    requests: 890450,
    quotaUsed: 92,
    quotaLimit: 100,
    plan: 'pro',
    status: 'rate-limited',
    topEndpoints: ['/api/v1/orders', '/api/v1/inventory'],
    avgLatency: 156,
    errorRate: 2.3
  },
  {
    id: 'consumer-5',
    name: 'Internal Tools',
    apiKey: 'int_tls_****x8v1',
    requests: 567890,
    quotaUsed: 35,
    quotaLimit: 100,
    plan: 'enterprise',
    status: 'active',
    topEndpoints: ['/api/v1/users', '/api/v1/notifications'],
    avgLatency: 32,
    errorRate: 0.2
  },
  {
    id: 'consumer-6',
    name: 'Third Party Vendor',
    apiKey: 'thp_vnd_****r3c7',
    requests: 123450,
    quotaUsed: 15,
    quotaLimit: 50,
    plan: 'starter',
    status: 'active',
    topEndpoints: ['/api/v1/products'],
    avgLatency: 89,
    errorRate: 0.8
  }
];

const ERROR_BREAKDOWN: ErrorBreakdown[] = [
  { code: 400, message: 'Bad Request', count: 12450, percent: 35.2, trending: 'up' },
  { code: 401, message: 'Unauthorized', count: 8920, percent: 25.2, trending: 'down' },
  { code: 403, message: 'Forbidden', count: 4560, percent: 12.9, trending: 'stable' },
  { code: 404, message: 'Not Found', count: 5670, percent: 16.0, trending: 'up' },
  { code: 429, message: 'Too Many Requests', count: 2340, percent: 6.6, trending: 'up' },
  { code: 500, message: 'Internal Server Error', count: 890, percent: 2.5, trending: 'down' },
  { code: 502, message: 'Bad Gateway', count: 340, percent: 1.0, trending: 'stable' },
  { code: 503, message: 'Service Unavailable', count: 220, percent: 0.6, trending: 'down' }
];

const GEO_DISTRIBUTION: GeoDistribution[] = [
  { region: 'North America', country: 'United States', requests: 4567890, percent: 38.5, avgLatency: 45 },
  { region: 'Europe', country: 'Germany', requests: 2345670, percent: 19.8, avgLatency: 78 },
  { region: 'Europe', country: 'United Kingdom', requests: 1890450, percent: 15.9, avgLatency: 82 },
  { region: 'Asia Pacific', country: 'Japan', requests: 1234560, percent: 10.4, avgLatency: 125 },
  { region: 'Asia Pacific', country: 'Singapore', requests: 890450, percent: 7.5, avgLatency: 145 },
  { region: 'South America', country: 'Brazil', requests: 567890, percent: 4.8, avgLatency: 180 },
  { region: 'Other', country: 'Various', requests: 370200, percent: 3.1, avgLatency: 156 }
];

const RATE_LIMIT_EVENTS: RateLimitEvent[] = [
  { id: 'rl-1', consumer: 'Partner Integration A', endpoint: '/api/v1/orders', timestamp: '2 min ago', currentRate: 1250, limit: 1000, exceeded: 250 },
  { id: 'rl-2', consumer: 'Partner Integration A', endpoint: '/api/v1/inventory', timestamp: '5 min ago', currentRate: 1180, limit: 1000, exceeded: 180 },
  { id: 'rl-3', consumer: 'Mobile App Android', endpoint: '/api/v1/search', timestamp: '12 min ago', currentRate: 5200, limit: 5000, exceeded: 200 }
];

const METHOD_CONFIG: Record<string, { color: string; bg: string }> = {
  GET: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  POST: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  PUT: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  DELETE: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  PATCH: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
};

const PLAN_CONFIG: Record<string, { color: string; bg: string }> = {
  free: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  starter: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  pro: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  enterprise: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
};

export default function APIAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'consumers' | 'errors' | 'geography'>('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalRequests = API_ENDPOINTS.reduce((sum, ep) => sum + ep.requests, 0);
  const avgLatency = Math.round(API_ENDPOINTS.reduce((sum, ep) => sum + ep.avgLatency, 0) / API_ENDPOINTS.length);
  const avgErrorRate = (API_ENDPOINTS.reduce((sum, ep) => sum + ep.errorRate, 0) / API_ENDPOINTS.length).toFixed(2);

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-charts">
        <div className="chart-card large">
          <div className="chart-header">
            <h4>Request Volume (24h)</h4>
            <div className="chart-actions">
              <button className="btn-icon small"><RefreshCw size={14} /></button>
              <button className="btn-icon small"><Download size={14} /></button>
            </div>
          </div>
          <div className="volume-chart">
            {[65, 78, 85, 72, 90, 95, 88, 92, 100, 85, 78, 82, 75, 68, 72, 80, 88, 95, 102, 98, 92, 88, 85, 78].map((val, idx) => (
              <div key={idx} className="volume-bar">
                <div className="bar-fill" style={{ height: `${val}%` }} />
                {idx % 4 === 0 && <span className="bar-label">{idx}:00</span>}
              </div>
            ))}
          </div>
          <div className="chart-stats">
            <div className="chart-stat">
              <span className="stat-label">Peak</span>
              <span className="stat-value">245K req/h</span>
            </div>
            <div className="chart-stat">
              <span className="stat-label">Average</span>
              <span className="stat-value">178K req/h</span>
            </div>
            <div className="chart-stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">{formatNumber(totalRequests)}</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Response Time Distribution</h4>
          </div>
          <div className="latency-distribution">
            {[
              { range: '0-50ms', percent: 45, color: '#10b981' },
              { range: '50-100ms', percent: 28, color: '#3b82f6' },
              { range: '100-200ms', percent: 15, color: '#f59e0b' },
              { range: '200-500ms', percent: 8, color: '#f97316' },
              { range: '500ms+', percent: 4, color: '#ef4444' }
            ].map(item => (
              <div key={item.range} className="latency-row">
                <span className="latency-range">{item.range}</span>
                <div className="latency-bar">
                  <div 
                    className="latency-bar-fill"
                    style={{ width: `${item.percent}%`, background: item.color }}
                  />
                </div>
                <span className="latency-percent">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Success vs Error Rate</h4>
          </div>
          <div className="success-error-chart">
            <div className="pie-chart-placeholder">
              <div className="donut-ring">
                <svg viewBox="0 0 36 36">
                  <path
                    className="donut-segment success"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray="98.5, 100"
                  />
                  <path
                    className="donut-segment error"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray="1.5, 100"
                    strokeDashoffset="-98.5"
                  />
                </svg>
                <div className="donut-center">
                  <span className="donut-value">98.5%</span>
                  <span className="donut-label">Success</span>
                </div>
              </div>
            </div>
            <div className="success-error-legend">
              <div className="legend-item">
                <span className="legend-dot success" />
                <span className="legend-label">Success (2xx)</span>
                <span className="legend-value">11.5M</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot error" />
                <span className="legend-label">Errors (4xx/5xx)</span>
                <span className="legend-value">175K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overview-tables">
        <div className="table-card">
          <div className="table-header">
            <h4>Top Endpoints by Traffic</h4>
            <button className="btn-outline small">View All</button>
          </div>
          <div className="mini-table">
            {API_ENDPOINTS.slice(0, 5).sort((a, b) => b.requests - a.requests).map((ep, idx) => (
              <div key={ep.id} className="mini-table-row">
                <span className="rank">{idx + 1}</span>
                <div className="endpoint-info">
                  <span 
                    className="method-badge small"
                    style={{ 
                      background: METHOD_CONFIG[ep.method].bg,
                      color: METHOD_CONFIG[ep.method].color
                    }}
                  >
                    {ep.method}
                  </span>
                  <span className="endpoint-path">{ep.path}</span>
                </div>
                <span className="endpoint-requests">{formatNumber(ep.requests)}</span>
                <div className={`trend ${ep.trending}`}>
                  {ep.trending === 'up' && <TrendingUp size={14} />}
                  {ep.trending === 'down' && <TrendingDown size={14} />}
                  {ep.trending === 'stable' && <ArrowRight size={14} />}
                  {ep.trendPercent}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h4>Slowest Endpoints</h4>
            <button className="btn-outline small">View All</button>
          </div>
          <div className="mini-table">
            {API_ENDPOINTS.slice(0).sort((a, b) => b.avgLatency - a.avgLatency).slice(0, 5).map((ep, idx) => (
              <div key={ep.id} className="mini-table-row">
                <span className="rank">{idx + 1}</span>
                <div className="endpoint-info">
                  <span 
                    className="method-badge small"
                    style={{ 
                      background: METHOD_CONFIG[ep.method].bg,
                      color: METHOD_CONFIG[ep.method].color
                    }}
                  >
                    {ep.method}
                  </span>
                  <span className="endpoint-path">{ep.path}</span>
                </div>
                <span className={`endpoint-latency ${ep.avgLatency > 150 ? 'slow' : ''}`}>
                  {ep.avgLatency}ms
                </span>
                <span className="endpoint-p95">p95: {ep.p95Latency}ms</span>
              </div>
            ))}
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h4>Recent Rate Limit Events</h4>
            <button className="btn-outline small">View All</button>
          </div>
          <div className="rate-limit-list">
            {RATE_LIMIT_EVENTS.map(event => (
              <div key={event.id} className="rate-limit-item">
                <div className="rate-limit-icon">
                  <AlertTriangle size={16} />
                </div>
                <div className="rate-limit-info">
                  <span className="rate-limit-consumer">{event.consumer}</span>
                  <span className="rate-limit-endpoint">{event.endpoint}</span>
                </div>
                <div className="rate-limit-stats">
                  <span className="exceeded">+{event.exceeded} over limit</span>
                  <span className="timestamp">{event.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEndpoints = () => (
    <div className="endpoints-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search endpoints..." />
          </div>
          <select>
            <option>All Methods</option>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
          <select>
            <option>All Services</option>
            <option>user-service</option>
            <option>order-service</option>
            <option>payment-service</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline small">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="endpoints-table">
        <div className="table-head">
          <span>Endpoint</span>
          <span>Service</span>
          <span>Requests</span>
          <span>Avg Latency</span>
          <span>P95</span>
          <span>P99</span>
          <span>Error Rate</span>
          <span>Trend</span>
        </div>
        {API_ENDPOINTS.map(ep => (
          <div 
            key={ep.id} 
            className="table-row"
            onClick={() => setSelectedEndpoint(ep)}
          >
            <div className="endpoint-cell">
              <span 
                className="method-badge"
                style={{ 
                  background: METHOD_CONFIG[ep.method].bg,
                  color: METHOD_CONFIG[ep.method].color
                }}
              >
                {ep.method}
              </span>
              <span className="endpoint-path">{ep.path}</span>
            </div>
            <span className="service-cell">{ep.service}</span>
            <span className="requests-cell">{formatNumber(ep.requests)}</span>
            <span className={`latency-cell ${ep.avgLatency > 150 ? 'slow' : ''}`}>{ep.avgLatency}ms</span>
            <span className={`latency-cell ${ep.p95Latency > 300 ? 'slow' : ''}`}>{ep.p95Latency}ms</span>
            <span className={`latency-cell ${ep.p99Latency > 500 ? 'slow' : ''}`}>{ep.p99Latency}ms</span>
            <span className={`error-cell ${ep.errorRate > 2 ? 'high' : ''}`}>{ep.errorRate}%</span>
            <div className={`trend-cell ${ep.trending}`}>
              {ep.trending === 'up' && <TrendingUp size={14} />}
              {ep.trending === 'down' && <TrendingDown size={14} />}
              {ep.trending === 'stable' && <ArrowRight size={14} />}
              {ep.trendPercent}%
            </div>
          </div>
        ))}
      </div>

      {selectedEndpoint && (
        <div className="endpoint-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span 
                className="method-badge"
                style={{ 
                  background: METHOD_CONFIG[selectedEndpoint.method].bg,
                  color: METHOD_CONFIG[selectedEndpoint.method].color
                }}
              >
                {selectedEndpoint.method}
              </span>
              <h3>{selectedEndpoint.path}</h3>
            </div>
            <button className="close-btn" onClick={() => setSelectedEndpoint(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="panel-metrics">
              <div className="metric-card">
                <Activity size={20} />
                <span className="metric-value">{formatNumber(selectedEndpoint.requests)}</span>
                <span className="metric-label">Requests</span>
              </div>
              <div className="metric-card">
                <Clock size={20} />
                <span className="metric-value">{selectedEndpoint.avgLatency}ms</span>
                <span className="metric-label">Avg Latency</span>
              </div>
              <div className="metric-card">
                <CheckCircle size={20} />
                <span className="metric-value success">{selectedEndpoint.successRate}%</span>
                <span className="metric-label">Success Rate</span>
              </div>
              <div className="metric-card">
                <XCircle size={20} />
                <span className={`metric-value ${selectedEndpoint.errorRate > 2 ? 'error' : ''}`}>
                  {selectedEndpoint.errorRate}%
                </span>
                <span className="metric-label">Error Rate</span>
              </div>
            </div>
            <div className="panel-chart">
              <h4>Latency Percentiles</h4>
              <div className="percentile-bars">
                <div className="percentile-bar">
                  <span className="percentile-label">Avg</span>
                  <div className="percentile-fill" style={{ width: `${(selectedEndpoint.avgLatency / 1000) * 100}%` }} />
                  <span className="percentile-value">{selectedEndpoint.avgLatency}ms</span>
                </div>
                <div className="percentile-bar">
                  <span className="percentile-label">P95</span>
                  <div className="percentile-fill p95" style={{ width: `${(selectedEndpoint.p95Latency / 1000) * 100}%` }} />
                  <span className="percentile-value">{selectedEndpoint.p95Latency}ms</span>
                </div>
                <div className="percentile-bar">
                  <span className="percentile-label">P99</span>
                  <div className="percentile-fill p99" style={{ width: `${(selectedEndpoint.p99Latency / 1000) * 100}%` }} />
                  <span className="percentile-value">{selectedEndpoint.p99Latency}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConsumers = () => (
    <div className="consumers-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search consumers..." />
          </div>
          <select>
            <option>All Plans</option>
            <option>Enterprise</option>
            <option>Pro</option>
            <option>Starter</option>
            <option>Free</option>
          </select>
          <select>
            <option>All Status</option>
            <option>Active</option>
            <option>Rate Limited</option>
            <option>Suspended</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary small">
            <Key size={14} />
            Create API Key
          </button>
        </div>
      </div>

      <div className="consumers-grid">
        {API_CONSUMERS.map(consumer => (
          <div key={consumer.id} className={`consumer-card ${consumer.status}`}>
            <div className="consumer-header">
              <div className="consumer-icon">
                {consumer.name.includes('Mobile') ? <Smartphone size={20} /> : 
                 consumer.name.includes('Web') ? <Monitor size={20} /> : 
                 consumer.name.includes('Internal') ? <Terminal size={20} /> : 
                 <Globe size={20} />}
              </div>
              <div className={`consumer-status ${consumer.status}`}>
                {consumer.status === 'active' && <><CheckCircle size={12} /> Active</>}
                {consumer.status === 'rate-limited' && <><AlertTriangle size={12} /> Rate Limited</>}
                {consumer.status === 'suspended' && <><XCircle size={12} /> Suspended</>}
              </div>
            </div>
            <h4>{consumer.name}</h4>
            <p className="consumer-key">
              <Key size={12} />
              {consumer.apiKey}
            </p>
            <div 
              className="consumer-plan"
              style={{ 
                background: PLAN_CONFIG[consumer.plan].bg,
                color: PLAN_CONFIG[consumer.plan].color
              }}
            >
              {consumer.plan.toUpperCase()}
            </div>
            <div className="consumer-quota">
              <div className="quota-header">
                <span>Quota Usage</span>
                <span>{consumer.quotaUsed}%</span>
              </div>
              <div className="quota-bar">
                <div 
                  className={`quota-fill ${consumer.quotaUsed > 90 ? 'critical' : consumer.quotaUsed > 75 ? 'warning' : ''}`}
                  style={{ width: `${consumer.quotaUsed}%` }}
                />
              </div>
            </div>
            <div className="consumer-stats">
              <div className="consumer-stat">
                <Activity size={14} />
                <span>{formatNumber(consumer.requests)}</span>
              </div>
              <div className="consumer-stat">
                <Clock size={14} />
                <span>{consumer.avgLatency}ms</span>
              </div>
              <div className={`consumer-stat ${consumer.errorRate > 2 ? 'error' : ''}`}>
                <AlertCircle size={14} />
                <span>{consumer.errorRate}%</span>
              </div>
            </div>
            <div className="consumer-endpoints">
              <span className="endpoints-label">Top Endpoints:</span>
              {consumer.topEndpoints.slice(0, 2).map((ep, idx) => (
                <span key={idx} className="endpoint-tag">{ep}</span>
              ))}
            </div>
            <div className="consumer-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                Details
              </button>
              <button className="btn-outline small">
                <Settings size={14} />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderErrors = () => (
    <div className="errors-section">
      <div className="errors-overview">
        <div className="errors-summary">
          <h3>Error Breakdown</h3>
          <p className="summary-total">
            Total Errors: <strong>35,390</strong> (1.5% of all requests)
          </p>
        </div>
        <div className="errors-chart">
          {ERROR_BREAKDOWN.map(err => (
            <div key={err.code} className="error-row">
              <div className="error-code-info">
                <span className={`error-code ${err.code >= 500 ? 'server' : 'client'}`}>
                  {err.code}
                </span>
                <span className="error-message">{err.message}</span>
              </div>
              <div className="error-bar-container">
                <div className="error-bar">
                  <div 
                    className={`error-bar-fill ${err.code >= 500 ? 'server' : 'client'}`}
                    style={{ width: `${err.percent}%` }}
                  />
                </div>
                <span className="error-percent">{err.percent}%</span>
              </div>
              <span className="error-count">{formatNumber(err.count)}</span>
              <div className={`error-trend ${err.trending}`}>
                {err.trending === 'up' && <TrendingUp size={14} />}
                {err.trending === 'down' && <TrendingDown size={14} />}
                {err.trending === 'stable' && <ArrowRight size={14} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="errors-details">
        <div className="error-detail-card">
          <h4>Most Affected Endpoints</h4>
          <div className="affected-list">
            {[
              { path: '/api/v1/payments', method: 'POST', errors: 8920, rate: 3.8 },
              { path: '/api/v1/orders', method: 'POST', errors: 5670, rate: 2.4 },
              { path: '/api/v1/inventory', method: 'PUT', errors: 2340, rate: 1.8 },
              { path: '/api/v1/auth/login', method: 'POST', errors: 1890, rate: 1.2 }
            ].map((item, idx) => (
              <div key={idx} className="affected-item">
                <span className="affected-rank">{idx + 1}</span>
                <div className="affected-endpoint">
                  <span 
                    className="method-badge small"
                    style={{ 
                      background: METHOD_CONFIG[item.method].bg,
                      color: METHOD_CONFIG[item.method].color
                    }}
                  >
                    {item.method}
                  </span>
                  <span>{item.path}</span>
                </div>
                <span className="affected-errors">{formatNumber(item.errors)}</span>
                <span className="affected-rate">{item.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="error-detail-card">
          <h4>Error Trends (Last 24h)</h4>
          <div className="error-trends-chart">
            <div className="trends-placeholder">
              <LineChart size={48} />
              <p>Error rate trend visualization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeography = () => (
    <div className="geography-section">
      <div className="geo-map">
        <h3>Global Request Distribution</h3>
        <div className="map-placeholder">
          <Map size={64} />
          <p>Interactive world map showing request origins</p>
        </div>
      </div>

      <div className="geo-table">
        <h4>Traffic by Region</h4>
        <div className="geo-table-content">
          <div className="geo-header">
            <span>Region / Country</span>
            <span>Requests</span>
            <span>% Traffic</span>
            <span>Avg Latency</span>
          </div>
          {GEO_DISTRIBUTION.map((geo, idx) => (
            <div key={idx} className="geo-row">
              <div className="geo-location">
                <MapPin size={14} />
                <div>
                  <span className="geo-country">{geo.country}</span>
                  <span className="geo-region">{geo.region}</span>
                </div>
              </div>
              <span className="geo-requests">{formatNumber(geo.requests)}</span>
              <div className="geo-percent">
                <div className="geo-bar">
                  <div className="geo-bar-fill" style={{ width: `${geo.percent}%` }} />
                </div>
                <span>{geo.percent}%</span>
              </div>
              <span className={`geo-latency ${geo.avgLatency > 150 ? 'high' : ''}`}>
                {geo.avgLatency}ms
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="geo-insights">
        <h4>Regional Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <Globe size={24} />
            <div className="insight-content">
              <span className="insight-value">45ms</span>
              <span className="insight-label">Fastest Region: North America</span>
            </div>
          </div>
          <div className="insight-card warning">
            <AlertTriangle size={24} />
            <div className="insight-content">
              <span className="insight-value">180ms</span>
              <span className="insight-label">Slowest Region: South America</span>
            </div>
          </div>
          <div className="insight-card">
            <TrendingUp size={24} />
            <div className="insight-content">
              <span className="insight-value">+25%</span>
              <span className="insight-label">Fastest Growing: Asia Pacific</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="api-analytics">
      <header className="aa__header">
        <div className="aa__title-section">
          <div className="aa__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>API Analytics</h1>
            <p>Monitor API performance, usage, and health metrics</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="time-selector">
            {['1h', '6h', '24h', '7d', '30d'].map(range => (
              <button 
                key={range}
                className={`time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      <div className="aa__stats">
        <div className="stat-card primary">
          <div className="stat-icon requests-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalRequests)}</span>
            <span className="stat-label">Total Requests</span>
          </div>
          <div className="stat-trend up">
            <TrendingUp size={14} />
            +15.2%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgLatency}ms</span>
            <span className="stat-label">Avg Latency</span>
          </div>
          <div className="stat-trend down">
            <TrendingDown size={14} />
            -8.5%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value success">98.5%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-trend up">
            <TrendingUp size={14} />
            +0.5%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon error-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className={`stat-value ${parseFloat(avgErrorRate) > 2 ? 'error' : ''}`}>{avgErrorRate}%</span>
            <span className="stat-label">Error Rate</span>
          </div>
          <div className="stat-trend down">
            <TrendingDown size={14} />
            -12.3%
          </div>
        </div>
      </div>

      <div className="aa__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'endpoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('endpoints')}
        >
          <Target size={16} />
          Endpoints
          <span className="tab-badge">{API_ENDPOINTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'consumers' ? 'active' : ''}`}
          onClick={() => setActiveTab('consumers')}
        >
          <Users size={16} />
          Consumers
          <span className="tab-badge">{API_CONSUMERS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          <AlertCircle size={16} />
          Errors
        </button>
        <button 
          className={`tab-btn ${activeTab === 'geography' ? 'active' : ''}`}
          onClick={() => setActiveTab('geography')}
        >
          <Globe size={16} />
          Geography
        </button>
      </div>

      <div className="aa__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'endpoints' && renderEndpoints()}
        {activeTab === 'consumers' && renderConsumers()}
        {activeTab === 'errors' && renderErrors()}
        {activeTab === 'geography' && renderGeography()}
      </div>
    </div>
  );
}
