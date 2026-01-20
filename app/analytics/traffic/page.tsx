'use client';

import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Globe,
  Clock,
  RefreshCw,
  Settings,
  Filter,
  Download,
  Search,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Server,
  MapPin,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Layers,
  GitBranch,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Monitor,
  Smartphone,
  Tablet,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import './traffic-analysis.css';

interface TrafficSource {
  id: string;
  name: string;
  type: 'direct' | 'organic' | 'referral' | 'social' | 'paid' | 'email';
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: string;
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface GeographicData {
  country: string;
  code: string;
  visitors: number;
  sessions: number;
  percentage: number;
  avgLatency: number;
  trend: 'up' | 'down' | 'stable';
}

interface EndpointMetric {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requests: number;
  avgResponseTime: number;
  errorRate: number;
  p95Latency: number;
  throughput: string;
  status: 'healthy' | 'degraded' | 'critical';
}

interface DeviceBreakdown {
  type: 'desktop' | 'mobile' | 'tablet';
  percentage: number;
  sessions: number;
  bounceRate: number;
  conversionRate: number;
}

interface RealTimeMetric {
  label: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  sparkline: number[];
}

const TRAFFIC_SOURCES: TrafficSource[] = [
  {
    id: '1',
    name: 'Direct',
    type: 'direct',
    sessions: 45234,
    pageViews: 123456,
    bounceRate: 32.5,
    avgSessionDuration: '4m 23s',
    conversionRate: 4.8,
    trend: 'up',
    trendValue: 12.3
  },
  {
    id: '2',
    name: 'Google Organic',
    type: 'organic',
    sessions: 38921,
    pageViews: 98234,
    bounceRate: 41.2,
    avgSessionDuration: '3m 45s',
    conversionRate: 3.2,
    trend: 'up',
    trendValue: 8.7
  },
  {
    id: '3',
    name: 'Social Media',
    type: 'social',
    sessions: 12456,
    pageViews: 34567,
    bounceRate: 52.8,
    avgSessionDuration: '2m 12s',
    conversionRate: 1.8,
    trend: 'down',
    trendValue: -5.4
  },
  {
    id: '4',
    name: 'Referral Traffic',
    type: 'referral',
    sessions: 8923,
    pageViews: 21345,
    bounceRate: 38.9,
    avgSessionDuration: '3m 56s',
    conversionRate: 4.1,
    trend: 'stable',
    trendValue: 0.3
  },
  {
    id: '5',
    name: 'Paid Campaigns',
    type: 'paid',
    sessions: 15678,
    pageViews: 45678,
    bounceRate: 28.3,
    avgSessionDuration: '5m 12s',
    conversionRate: 6.2,
    trend: 'up',
    trendValue: 18.5
  },
  {
    id: '6',
    name: 'Email Marketing',
    type: 'email',
    sessions: 5432,
    pageViews: 12345,
    bounceRate: 24.6,
    avgSessionDuration: '6m 34s',
    conversionRate: 8.9,
    trend: 'up',
    trendValue: 7.2
  }
];

const GEOGRAPHIC_DATA: GeographicData[] = [
  { country: 'United States', code: 'US', visitors: 89234, sessions: 145678, percentage: 42.3, avgLatency: 45, trend: 'up' },
  { country: 'United Kingdom', code: 'GB', visitors: 23456, sessions: 38921, percentage: 11.3, avgLatency: 78, trend: 'up' },
  { country: 'Germany', code: 'DE', visitors: 18934, sessions: 31245, percentage: 9.1, avgLatency: 82, trend: 'stable' },
  { country: 'Canada', code: 'CA', visitors: 15678, sessions: 26789, percentage: 7.8, avgLatency: 52, trend: 'up' },
  { country: 'Australia', code: 'AU', visitors: 12345, sessions: 21098, percentage: 6.1, avgLatency: 156, trend: 'down' },
  { country: 'France', code: 'FR', visitors: 9876, sessions: 16789, percentage: 4.9, avgLatency: 85, trend: 'stable' },
  { country: 'Japan', code: 'JP', visitors: 8234, sessions: 14567, percentage: 4.2, avgLatency: 142, trend: 'up' },
  { country: 'Brazil', code: 'BR', visitors: 6789, sessions: 11234, percentage: 3.3, avgLatency: 178, trend: 'up' }
];

const ENDPOINT_METRICS: EndpointMetric[] = [
  { endpoint: '/api/v1/users', method: 'GET', requests: 234567, avgResponseTime: 45, errorRate: 0.02, p95Latency: 89, throughput: '1.2K/s', status: 'healthy' },
  { endpoint: '/api/v1/auth/login', method: 'POST', requests: 145678, avgResponseTime: 123, errorRate: 0.15, p95Latency: 245, throughput: '890/s', status: 'healthy' },
  { endpoint: '/api/v1/products', method: 'GET', requests: 189234, avgResponseTime: 67, errorRate: 0.08, p95Latency: 134, throughput: '1.5K/s', status: 'healthy' },
  { endpoint: '/api/v1/orders', method: 'POST', requests: 78923, avgResponseTime: 189, errorRate: 0.32, p95Latency: 456, throughput: '450/s', status: 'degraded' },
  { endpoint: '/api/v1/search', method: 'GET', requests: 567890, avgResponseTime: 234, errorRate: 1.2, p95Latency: 678, throughput: '2.1K/s', status: 'critical' },
  { endpoint: '/api/v1/analytics', method: 'GET', requests: 45678, avgResponseTime: 89, errorRate: 0.05, p95Latency: 167, throughput: '320/s', status: 'healthy' }
];

const DEVICE_BREAKDOWN: DeviceBreakdown[] = [
  { type: 'desktop', percentage: 52.3, sessions: 89234, bounceRate: 31.2, conversionRate: 5.4 },
  { type: 'mobile', percentage: 38.9, sessions: 66456, bounceRate: 45.8, conversionRate: 2.8 },
  { type: 'tablet', percentage: 8.8, sessions: 15034, bounceRate: 38.4, conversionRate: 3.9 }
];

const REAL_TIME_METRICS: RealTimeMetric[] = [
  { label: 'Active Users', value: '2,847', change: 12.3, changeType: 'positive', sparkline: [45, 52, 48, 61, 55, 67, 72, 68, 75, 82] },
  { label: 'Requests/min', value: '12,456', change: -3.2, changeType: 'negative', sparkline: [120, 115, 125, 118, 122, 108, 112, 105, 110, 108] },
  { label: 'Avg Response', value: '89ms', change: 0, changeType: 'neutral', sparkline: [85, 88, 92, 87, 89, 90, 88, 89, 91, 89] },
  { label: 'Error Rate', value: '0.08%', change: -45.2, changeType: 'positive', sparkline: [0.15, 0.12, 0.1, 0.09, 0.08, 0.09, 0.07, 0.08, 0.08, 0.08] }
];

const SOURCE_TYPE_CONFIG = {
  direct: { color: 'primary', icon: Target },
  organic: { color: 'success', icon: Search },
  social: { color: 'info', icon: Users },
  referral: { color: 'purple', icon: GitBranch },
  paid: { color: 'warning', icon: Zap },
  email: { color: 'cyan', icon: Wifi }
};

const METHOD_CONFIG = {
  GET: { color: 'success' },
  POST: { color: 'info' },
  PUT: { color: 'warning' },
  DELETE: { color: 'danger' },
  PATCH: { color: 'purple' }
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet
};

export default function TrafficAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'realtime' | 'sources' | 'geographic' | 'endpoints' | 'devices'>('realtime');
  const [timeRange, setTimeRange] = useState('24h');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const totalSessions = TRAFFIC_SOURCES.reduce((acc, s) => acc + s.sessions, 0);
  const totalPageViews = TRAFFIC_SOURCES.reduce((acc, s) => acc + s.pageViews, 0);
  const avgBounceRate = (TRAFFIC_SOURCES.reduce((acc, s) => acc + s.bounceRate, 0) / TRAFFIC_SOURCES.length).toFixed(1);
  const avgConversion = (TRAFFIC_SOURCES.reduce((acc, s) => acc + s.conversionRate, 0) / TRAFFIC_SOURCES.length).toFixed(1);

  const renderRealTime = () => (
    <div className="realtime-section">
      <div className="realtime-metrics">
        {REAL_TIME_METRICS.map((metric, i) => (
          <div key={i} className="realtime-card">
            <div className="realtime-header">
              <span className="realtime-label">{metric.label}</span>
              <span className={`realtime-change ${metric.changeType}`}>
                {metric.changeType === 'positive' && <ArrowUpRight size={14} />}
                {metric.changeType === 'negative' && <ArrowDownRight size={14} />}
                {metric.changeType === 'neutral' && <Minus size={14} />}
                {Math.abs(metric.change)}%
              </span>
            </div>
            <div className="realtime-value">{metric.value}</div>
            <div className="sparkline">
              {metric.sparkline.map((val, idx) => {
                const max = Math.max(...metric.sparkline);
                const min = Math.min(...metric.sparkline);
                const height = ((val - min) / (max - min)) * 100 || 50;
                return (
                  <div 
                    key={idx} 
                    className="sparkline-bar"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="realtime-charts">
        <div className="chart-card large">
          <div className="chart-header">
            <h4>Live Traffic Flow</h4>
            <div className="chart-actions">
              <span className="live-indicator">
                <span className="live-dot"></span>
                Live
              </span>
              <button className="btn-icon">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="chart-placeholder">
            <LineChart size={64} />
            <p>Real-time traffic visualization</p>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Request Distribution</h4>
          </div>
          <div className="chart-placeholder small">
            <PieChart size={48} />
            <p>By endpoint</p>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Response Times</h4>
          </div>
          <div className="chart-placeholder small">
            <BarChart3 size={48} />
            <p>Percentile distribution</p>
          </div>
        </div>
      </div>

      <div className="active-connections">
        <h4>Active Connections by Region</h4>
        <div className="connections-list">
          {GEOGRAPHIC_DATA.slice(0, 5).map((geo, i) => (
            <div key={i} className="connection-item">
              <span className="connection-rank">{i + 1}</span>
              <span className="connection-country">{geo.country}</span>
              <div className="connection-bar">
                <div 
                  className="connection-fill"
                  style={{ width: `${geo.percentage}%` }}
                />
              </div>
              <span className="connection-value">{geo.visitors.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="sources-section">
      <div className="sources-header">
        <h3>Traffic Sources</h3>
        <div className="sources-filters">
          <select defaultValue="all">
            <option value="all">All Sources</option>
            <option value="direct">Direct</option>
            <option value="organic">Organic</option>
            <option value="social">Social</option>
            <option value="paid">Paid</option>
          </select>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="sources-summary">
        <div className="summary-chart">
          <PieChart size={120} />
          <div className="chart-legend">
            {TRAFFIC_SOURCES.slice(0, 4).map((source, i) => {
              const config = SOURCE_TYPE_CONFIG[source.type];
              return (
                <div key={i} className="legend-item">
                  <span className={`legend-dot ${config.color}`}></span>
                  <span className="legend-name">{source.name}</span>
                  <span className="legend-value">
                    {((source.sessions / totalSessions) * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sources-list">
        {TRAFFIC_SOURCES.map(source => {
          const config = SOURCE_TYPE_CONFIG[source.type];
          const SourceIcon = config.icon;
          const isExpanded = expandedSource === source.id;

          return (
            <div key={source.id} className={`source-card ${config.color}`}>
              <div className="source-main">
                <div className={`source-icon ${config.color}`}>
                  <SourceIcon size={20} />
                </div>

                <div className="source-info">
                  <div className="source-header">
                    <h4>{source.name}</h4>
                    <span className={`source-trend ${source.trend}`}>
                      {source.trend === 'up' && <TrendingUp size={14} />}
                      {source.trend === 'down' && <TrendingDown size={14} />}
                      {source.trend === 'stable' && <Minus size={14} />}
                      {source.trendValue > 0 ? '+' : ''}{source.trendValue}%
                    </span>
                  </div>
                  <div className="source-type">{source.type}</div>
                </div>

                <div className="source-metrics">
                  <div className="source-metric">
                    <span className="metric-value">{source.sessions.toLocaleString()}</span>
                    <span className="metric-label">Sessions</span>
                  </div>
                  <div className="source-metric">
                    <span className="metric-value">{source.pageViews.toLocaleString()}</span>
                    <span className="metric-label">Page Views</span>
                  </div>
                  <div className="source-metric">
                    <span className="metric-value">{source.bounceRate}%</span>
                    <span className="metric-label">Bounce Rate</span>
                  </div>
                  <div className="source-metric">
                    <span className="metric-value">{source.conversionRate}%</span>
                    <span className="metric-label">Conversion</span>
                  </div>
                </div>

                <button 
                  className="expand-btn"
                  onClick={() => setExpandedSource(isExpanded ? null : source.id)}
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {isExpanded && (
                <div className="source-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-stat">
                      <span className="stat-label">Avg Session Duration</span>
                      <span className="stat-value">{source.avgSessionDuration}</span>
                    </div>
                    <div className="expanded-stat">
                      <span className="stat-label">Pages/Session</span>
                      <span className="stat-value">
                        {(source.pageViews / source.sessions).toFixed(1)}
                      </span>
                    </div>
                    <div className="expanded-stat">
                      <span className="stat-label">New Users</span>
                      <span className="stat-value">
                        {Math.round(source.sessions * 0.65).toLocaleString()}
                      </span>
                    </div>
                    <div className="expanded-stat">
                      <span className="stat-label">Revenue</span>
                      <span className="stat-value">
                        ${Math.round(source.sessions * source.conversionRate * 45).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGeographic = () => (
    <div className="geographic-section">
      <div className="geo-header">
        <h3>Geographic Distribution</h3>
        <select defaultValue="visitors">
          <option value="visitors">By Visitors</option>
          <option value="sessions">By Sessions</option>
          <option value="revenue">By Revenue</option>
        </select>
      </div>

      <div className="geo-map">
        <div className="map-placeholder">
          <Globe size={80} />
          <p>Interactive world map visualization</p>
        </div>
      </div>

      <div className="geo-table">
        <div className="table-header">
          <span className="th-rank">#</span>
          <span className="th-country">Country</span>
          <span className="th-visitors">Visitors</span>
          <span className="th-sessions">Sessions</span>
          <span className="th-percentage">Share</span>
          <span className="th-latency">Avg Latency</span>
          <span className="th-trend">Trend</span>
        </div>
        <div className="table-body">
          {GEOGRAPHIC_DATA.map((geo, i) => (
            <div key={i} className="table-row">
              <span className="td-rank">{i + 1}</span>
              <span className="td-country">
                <span className="country-flag">{geo.code}</span>
                {geo.country}
              </span>
              <span className="td-visitors">{geo.visitors.toLocaleString()}</span>
              <span className="td-sessions">{geo.sessions.toLocaleString()}</span>
              <span className="td-percentage">
                <div className="percentage-bar">
                  <div 
                    className="percentage-fill"
                    style={{ width: `${geo.percentage}%` }}
                  />
                </div>
                {geo.percentage}%
              </span>
              <span className={`td-latency ${geo.avgLatency > 100 ? 'high' : ''}`}>
                {geo.avgLatency}ms
              </span>
              <span className={`td-trend ${geo.trend}`}>
                {geo.trend === 'up' && <TrendingUp size={14} />}
                {geo.trend === 'down' && <TrendingDown size={14} />}
                {geo.trend === 'stable' && <Minus size={14} />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEndpoints = () => (
    <div className="endpoints-section">
      <div className="endpoints-header">
        <h3>API Endpoints Performance</h3>
        <div className="endpoints-filters">
          <select defaultValue="all">
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select defaultValue="all-status">
            <option value="all-status">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="endpoints-table">
        <div className="ep-table-header">
          <span className="ep-th method">Method</span>
          <span className="ep-th endpoint">Endpoint</span>
          <span className="ep-th requests">Requests</span>
          <span className="ep-th response">Avg Response</span>
          <span className="ep-th p95">P95 Latency</span>
          <span className="ep-th error">Error Rate</span>
          <span className="ep-th throughput">Throughput</span>
          <span className="ep-th status">Status</span>
        </div>
        <div className="ep-table-body">
          {ENDPOINT_METRICS.map((ep, i) => {
            const methodConfig = METHOD_CONFIG[ep.method];
            
            return (
              <div key={i} className={`ep-table-row ${ep.status}`}>
                <span className={`ep-td method ${methodConfig.color}`}>
                  {ep.method}
                </span>
                <span className="ep-td endpoint">
                  <code>{ep.endpoint}</code>
                </span>
                <span className="ep-td requests">{ep.requests.toLocaleString()}</span>
                <span className={`ep-td response ${ep.avgResponseTime > 150 ? 'warning' : ''}`}>
                  {ep.avgResponseTime}ms
                </span>
                <span className={`ep-td p95 ${ep.p95Latency > 300 ? 'warning' : ''}`}>
                  {ep.p95Latency}ms
                </span>
                <span className={`ep-td error ${ep.errorRate > 0.5 ? 'danger' : ''}`}>
                  {ep.errorRate}%
                </span>
                <span className="ep-td throughput">{ep.throughput}</span>
                <span className={`ep-td status ${ep.status}`}>
                  {ep.status === 'healthy' && <CheckCircle size={14} />}
                  {ep.status === 'degraded' && <AlertTriangle size={14} />}
                  {ep.status === 'critical' && <XCircle size={14} />}
                  {ep.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="endpoints-summary">
        <div className="ep-summary-card">
          <div className="ep-summary-icon healthy">
            <CheckCircle size={24} />
          </div>
          <div className="ep-summary-info">
            <span className="ep-summary-value">
              {ENDPOINT_METRICS.filter(e => e.status === 'healthy').length}
            </span>
            <span className="ep-summary-label">Healthy</span>
          </div>
        </div>
        <div className="ep-summary-card">
          <div className="ep-summary-icon degraded">
            <AlertTriangle size={24} />
          </div>
          <div className="ep-summary-info">
            <span className="ep-summary-value">
              {ENDPOINT_METRICS.filter(e => e.status === 'degraded').length}
            </span>
            <span className="ep-summary-label">Degraded</span>
          </div>
        </div>
        <div className="ep-summary-card">
          <div className="ep-summary-icon critical">
            <XCircle size={24} />
          </div>
          <div className="ep-summary-info">
            <span className="ep-summary-value">
              {ENDPOINT_METRICS.filter(e => e.status === 'critical').length}
            </span>
            <span className="ep-summary-label">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDevices = () => (
    <div className="devices-section">
      <div className="devices-header">
        <h3>Device Analytics</h3>
      </div>

      <div className="devices-overview">
        {DEVICE_BREAKDOWN.map((device, i) => {
          const DeviceIcon = DEVICE_ICONS[device.type];
          
          return (
            <div key={i} className="device-card">
              <div className="device-icon">
                <DeviceIcon size={32} />
              </div>
              <div className="device-info">
                <h4 className="capitalize">{device.type}</h4>
                <div className="device-percentage">{device.percentage}%</div>
              </div>
              <div className="device-stats">
                <div className="device-stat">
                  <span className="stat-value">{device.sessions.toLocaleString()}</span>
                  <span className="stat-label">Sessions</span>
                </div>
                <div className="device-stat">
                  <span className="stat-value">{device.bounceRate}%</span>
                  <span className="stat-label">Bounce Rate</span>
                </div>
                <div className="device-stat">
                  <span className="stat-value">{device.conversionRate}%</span>
                  <span className="stat-label">Conversion</span>
                </div>
              </div>
              <div className="device-bar">
                <div 
                  className="device-bar-fill"
                  style={{ width: `${device.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="browser-breakdown">
        <h4>Browser Distribution</h4>
        <div className="browser-list">
          {[
            { name: 'Chrome', percentage: 64.2, version: '121.0' },
            { name: 'Safari', percentage: 18.7, version: '17.2' },
            { name: 'Firefox', percentage: 8.3, version: '122.0' },
            { name: 'Edge', percentage: 6.1, version: '121.0' },
            { name: 'Other', percentage: 2.7, version: '-' }
          ].map((browser, i) => (
            <div key={i} className="browser-item">
              <span className="browser-rank">{i + 1}</span>
              <span className="browser-name">{browser.name}</span>
              <span className="browser-version">v{browser.version}</span>
              <div className="browser-bar">
                <div 
                  className="browser-fill"
                  style={{ width: `${browser.percentage}%` }}
                />
              </div>
              <span className="browser-percentage">{browser.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="os-breakdown">
        <h4>Operating System</h4>
        <div className="os-list">
          {[
            { name: 'Windows', percentage: 45.8 },
            { name: 'macOS', percentage: 24.3 },
            { name: 'iOS', percentage: 15.2 },
            { name: 'Android', percentage: 12.4 },
            { name: 'Linux', percentage: 2.3 }
          ].map((os, i) => (
            <div key={i} className="os-item">
              <span className="os-name">{os.name}</span>
              <div className="os-bar">
                <div 
                  className="os-fill"
                  style={{ width: `${os.percentage}%` }}
                />
              </div>
              <span className="os-percentage">{os.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="traffic-analysis">
      <div className="traffic-analysis__header">
        <div className="traffic-analysis__title-section">
          <div className="traffic-analysis__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Traffic Analysis</h1>
            <p>Real-time traffic monitoring and insights</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="traffic-analysis__stats">
        <div className="stat-card">
          <div className="stat-icon sessions">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalSessions.toLocaleString()}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={14} />
            +8.5%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pageviews">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalPageViews.toLocaleString()}</span>
            <span className="stat-label">Page Views</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={14} />
            +12.3%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bounce">
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgBounceRate}%</span>
            <span className="stat-label">Avg Bounce Rate</span>
          </div>
          <div className="stat-trend positive">
            <TrendingDown size={14} />
            -2.1%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon conversion">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgConversion}%</span>
            <span className="stat-label">Conversion Rate</span>
          </div>
          <div className="stat-trend positive">
            <TrendingUp size={14} />
            +1.8%
          </div>
        </div>
      </div>

      <div className="traffic-analysis__tabs">
        <button
          className={`tab-btn ${activeTab === 'realtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('realtime')}
        >
          <Activity size={16} />
          Real-time
        </button>
        <button
          className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <Layers size={16} />
          Sources
        </button>
        <button
          className={`tab-btn ${activeTab === 'geographic' ? 'active' : ''}`}
          onClick={() => setActiveTab('geographic')}
        >
          <Globe size={16} />
          Geographic
        </button>
        <button
          className={`tab-btn ${activeTab === 'endpoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('endpoints')}
        >
          <Server size={16} />
          Endpoints
        </button>
        <button
          className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          <Monitor size={16} />
          Devices
        </button>
      </div>

      <div className="traffic-analysis__content">
        {activeTab === 'realtime' && renderRealTime()}
        {activeTab === 'sources' && renderSources()}
        {activeTab === 'geographic' && renderGeographic()}
        {activeTab === 'endpoints' && renderEndpoints()}
        {activeTab === 'devices' && renderDevices()}
      </div>
    </div>
  );
}
