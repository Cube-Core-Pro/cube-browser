'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Activity,
  Clock,
  Database,
  Zap,
  Download,
  Calendar,
  ChevronDown,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointer,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  FileText
} from 'lucide-react';
import './usage-analytics.css';

interface UsageMetric {
  label: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface DailyUsage {
  date: string;
  apiCalls: number;
  pageViews: number;
  activeUsers: number;
  dataTransfer: number;
  automations: number;
}

interface EndpointUsage {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  calls: number;
  avgLatency: number;
  errorRate: number;
  trend: number;
}

interface DeviceBreakdown {
  device: string;
  percentage: number;
  sessions: number;
}

interface GeoData {
  country: string;
  code: string;
  users: number;
  percentage: number;
}

const METRICS: UsageMetric[] = [
  { label: 'API Calls', value: 2847562, unit: 'calls', change: 12.5, trend: 'up' },
  { label: 'Active Users', value: 8432, unit: 'users', change: 8.2, trend: 'up' },
  { label: 'Data Transfer', value: 456.8, unit: 'GB', change: -3.4, trend: 'down' },
  { label: 'Avg Response Time', value: 127, unit: 'ms', change: -15.2, trend: 'up' },
];

const DAILY_USAGE: DailyUsage[] = [
  { date: '2025-01-23', apiCalls: 385420, pageViews: 142300, activeUsers: 7840, dataTransfer: 62.4, automations: 2340 },
  { date: '2025-01-24', apiCalls: 412300, pageViews: 156800, activeUsers: 8120, dataTransfer: 71.2, automations: 2580 },
  { date: '2025-01-25', apiCalls: 398700, pageViews: 148200, activeUsers: 7920, dataTransfer: 65.8, automations: 2420 },
  { date: '2025-01-26', apiCalls: 345600, pageViews: 128400, activeUsers: 6840, dataTransfer: 54.2, automations: 1980 },
  { date: '2025-01-27', apiCalls: 328900, pageViews: 118600, activeUsers: 6520, dataTransfer: 48.6, automations: 1820 },
  { date: '2025-01-28', apiCalls: 456200, pageViews: 168400, activeUsers: 8640, dataTransfer: 78.4, automations: 2840 },
  { date: '2025-01-29', apiCalls: 520442, pageViews: 184200, activeUsers: 8950, dataTransfer: 85.2, automations: 3120 },
];

const ENDPOINT_USAGE: EndpointUsage[] = [
  { endpoint: '/api/v1/automations', method: 'GET', calls: 524800, avgLatency: 45, errorRate: 0.02, trend: 15.4 },
  { endpoint: '/api/v1/automations', method: 'POST', calls: 245600, avgLatency: 125, errorRate: 0.08, trend: 22.1 },
  { endpoint: '/api/v1/data/extract', method: 'POST', calls: 428300, avgLatency: 340, errorRate: 0.15, trend: 8.7 },
  { endpoint: '/api/v1/users', method: 'GET', calls: 312400, avgLatency: 28, errorRate: 0.01, trend: -2.3 },
  { endpoint: '/api/v1/workflows', method: 'GET', calls: 286500, avgLatency: 52, errorRate: 0.03, trend: 5.6 },
  { endpoint: '/api/v1/workflows', method: 'PUT', calls: 124800, avgLatency: 98, errorRate: 0.05, trend: 12.8 },
  { endpoint: '/api/v1/exports', method: 'POST', calls: 98600, avgLatency: 1250, errorRate: 0.12, trend: 35.2 },
  { endpoint: '/api/v1/analytics', method: 'GET', calls: 186400, avgLatency: 180, errorRate: 0.04, trend: 18.9 },
];

const DEVICE_BREAKDOWN: DeviceBreakdown[] = [
  { device: 'Desktop', percentage: 68.4, sessions: 142800 },
  { device: 'Mobile', percentage: 22.8, sessions: 47600 },
  { device: 'Tablet', percentage: 8.8, sessions: 18400 },
];

const GEO_DATA: GeoData[] = [
  { country: 'United States', code: 'US', users: 3245, percentage: 38.5 },
  { country: 'United Kingdom', code: 'GB', users: 1124, percentage: 13.3 },
  { country: 'Germany', code: 'DE', users: 842, percentage: 10.0 },
  { country: 'France', code: 'FR', users: 628, percentage: 7.5 },
  { country: 'Canada', code: 'CA', users: 524, percentage: 6.2 },
  { country: 'Australia', code: 'AU', users: 412, percentage: 4.9 },
  { country: 'Netherlands', code: 'NL', users: 324, percentage: 3.8 },
  { country: 'Spain', code: 'ES', users: 286, percentage: 3.4 },
];

const RESOURCE_USAGE = [
  { name: 'CPU Usage', value: 42, limit: 100, unit: '%', icon: Cpu },
  { name: 'Memory', value: 12.4, limit: 32, unit: 'GB', icon: HardDrive },
  { name: 'Storage', value: 245, limit: 500, unit: 'GB', icon: Database },
  { name: 'Bandwidth', value: 856, limit: 2000, unit: 'GB', icon: Wifi },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDeviceIcon = (device: string) => {
  switch (device) {
    case 'Desktop': return Monitor;
    case 'Mobile': return Smartphone;
    case 'Tablet': return Tablet;
    default: return Monitor;
  }
};

export default function UsageAnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('apiCalls');

  const maxApiCalls = Math.max(...DAILY_USAGE.map(d => d.apiCalls));
  const maxPageViews = Math.max(...DAILY_USAGE.map(d => d.pageViews));

  return (
    <div className="usage-analytics">
      {/* Header */}
      <header className="usage-analytics__header">
        <div className="usage-analytics__title-section">
          <div className="usage-analytics__icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1>Usage Analytics</h1>
            <p>Monitor platform usage and resource consumption</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="date-dropdown">
            <button className="dropdown-btn">
              <Calendar size={18} />
              <span>Last 7 Days</span>
              <ChevronDown size={16} />
            </button>
          </div>
          <button className="btn-outline">
            <Download size={18} />
            Export
          </button>
          <button className="btn-primary">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="usage-analytics__metrics">
        {METRICS.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{metric.label}</span>
              <span className={`metric-change ${metric.trend}`}>
                {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(metric.change)}%
              </span>
            </div>
            <div className="metric-value">
              {formatNumber(metric.value)}
              <span className="metric-unit">{metric.unit}</span>
            </div>
            <div className="metric-spark">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className="spark-bar"
                  style={{ height: `${40 + Math.random() * 60}%` }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="usage-analytics__grid">
        {/* Usage Chart */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Usage Over Time</h2>
            <div className="metric-tabs">
              <button 
                className={`metric-tab ${selectedMetric === 'apiCalls' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('apiCalls')}
              >
                <Zap size={14} />
                API Calls
              </button>
              <button 
                className={`metric-tab ${selectedMetric === 'pageViews' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('pageViews')}
              >
                <Eye size={14} />
                Page Views
              </button>
              <button 
                className={`metric-tab ${selectedMetric === 'activeUsers' ? 'active' : ''}`}
                onClick={() => setSelectedMetric('activeUsers')}
              >
                <Users size={14} />
                Users
              </button>
            </div>
          </div>
          <div className="usage-chart">
            <div className="chart-bars">
              {DAILY_USAGE.map((day, index) => {
                const value = day[selectedMetric as keyof DailyUsage] as number;
                const max = selectedMetric === 'apiCalls' ? maxApiCalls : 
                           selectedMetric === 'pageViews' ? maxPageViews : 10000;
                const height = (value / max) * 100;

                return (
                  <div key={index} className="chart-column">
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar"
                        style={{ height: `${height}%` }}
                      >
                        <div className="bar-tooltip">
                          {formatNumber(value)}
                        </div>
                      </div>
                    </div>
                    <span className="chart-label">{formatDate(day.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="analytics-sidebar">
          {/* Device Breakdown */}
          <div className="device-section">
            <h3>Device Breakdown</h3>
            <div className="device-list">
              {DEVICE_BREAKDOWN.map((device, index) => {
                const DeviceIcon = getDeviceIcon(device.device);
                return (
                  <div key={index} className="device-item">
                    <div className="device-icon">
                      <DeviceIcon size={18} />
                    </div>
                    <div className="device-info">
                      <div className="device-header">
                        <span className="device-name">{device.device}</span>
                        <span className="device-percentage">{device.percentage}%</span>
                      </div>
                      <div className="device-bar">
                        <div 
                          className="device-progress"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                      <span className="device-sessions">{formatNumber(device.sessions)} sessions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geographic Distribution */}
          <div className="geo-section">
            <h3>Top Countries</h3>
            <div className="geo-list">
              {GEO_DATA.slice(0, 6).map((country, index) => (
                <div key={index} className="geo-item">
                  <span className="geo-flag">{country.code}</span>
                  <div className="geo-info">
                    <span className="geo-country">{country.country}</span>
                    <div className="geo-bar">
                      <div 
                        className="geo-progress"
                        style={{ width: `${country.percentage * 2.5}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="geo-users">{formatNumber(country.users)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="resource-section">
        <div className="section-header">
          <h2>Resource Usage</h2>
          <span className="billing-cycle">Current billing cycle</span>
        </div>
        <div className="resource-grid">
          {RESOURCE_USAGE.map((resource, index) => {
            const percentage = (resource.value / resource.limit) * 100;
            const ResourceIcon = resource.icon;
            return (
              <div key={index} className="resource-card">
                <div className="resource-header">
                  <div className="resource-icon">
                    <ResourceIcon size={20} />
                  </div>
                  <span className="resource-name">{resource.name}</span>
                </div>
                <div className="resource-value">
                  <span className="current">{resource.value}</span>
                  <span className="separator">/</span>
                  <span className="limit">{resource.limit} {resource.unit}</span>
                </div>
                <div className="resource-bar">
                  <div 
                    className={`resource-progress ${percentage > 80 ? 'warning' : ''} ${percentage > 95 ? 'danger' : ''}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <span className="resource-percentage">{percentage.toFixed(1)}% used</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Endpoint Usage Table */}
      <div className="endpoints-section">
        <div className="section-header">
          <h2>API Endpoint Usage</h2>
          <button className="btn-outline small">
            <Filter size={16} />
            Filter
          </button>
        </div>
        <div className="endpoints-table">
          <div className="table-header">
            <div className="col-endpoint">Endpoint</div>
            <div className="col-method">Method</div>
            <div className="col-calls">Calls</div>
            <div className="col-latency">Avg Latency</div>
            <div className="col-errors">Error Rate</div>
            <div className="col-trend">Trend</div>
          </div>
          <div className="table-body">
            {ENDPOINT_USAGE.map((endpoint, index) => (
              <div key={index} className="table-row">
                <div className="col-endpoint">
                  <code>{endpoint.endpoint}</code>
                </div>
                <div className="col-method">
                  <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                </div>
                <div className="col-calls">
                  {formatNumber(endpoint.calls)}
                </div>
                <div className="col-latency">
                  <span className={endpoint.avgLatency > 500 ? 'warning' : ''}>
                    {endpoint.avgLatency}ms
                  </span>
                </div>
                <div className="col-errors">
                  <span className={endpoint.errorRate > 0.1 ? 'warning' : ''}>
                    {(endpoint.errorRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="col-trend">
                  <span className={`trend ${endpoint.trend >= 0 ? 'positive' : 'negative'}`}>
                    {endpoint.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(endpoint.trend)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <Activity size={20} />
          <div className="stat-info">
            <span className="stat-value">99.97%</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
        <div className="quick-stat">
          <Clock size={20} />
          <div className="stat-info">
            <span className="stat-value">127ms</span>
            <span className="stat-label">Avg Response</span>
          </div>
        </div>
        <div className="quick-stat">
          <Server size={20} />
          <div className="stat-info">
            <span className="stat-value">24</span>
            <span className="stat-label">Active Servers</span>
          </div>
        </div>
        <div className="quick-stat">
          <FileText size={20} />
          <div className="stat-info">
            <span className="stat-value">156K</span>
            <span className="stat-label">Automations Run</span>
          </div>
        </div>
      </div>
    </div>
  );
}
