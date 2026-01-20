'use client';

import React, { useState } from 'react';
import { 
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Database,
  Server,
  Cpu,
  HardDrive,
  Globe,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  Settings,
  Download,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Layers,
  Eye,
  Edit2,
  Trash2,
  Star,
  Copy,
  Share2,
  MoreVertical,
  Calendar,
  LineChart
} from 'lucide-react';
import './metrics-dashboard.css';

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  previousValue: number;
  changePercent: number;
  status: 'healthy' | 'warning' | 'critical';
  source: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels: Record<string, string>;
  lastUpdated: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  panels: number;
  views: number;
  lastModified: string;
  starred: boolean;
  owner: string;
  tags: string[];
}

interface Panel {
  id: string;
  title: string;
  type: 'timeseries' | 'gauge' | 'stat' | 'table' | 'heatmap' | 'pie';
  query: string;
  dataSource: string;
  values: number[];
  current: number;
  min: number;
  max: number;
  avg: number;
  unit: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'prometheus' | 'influxdb' | 'elasticsearch' | 'cloudwatch' | 'datadog';
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  metricsCount: number;
  scrapeInterval: string;
  retention: string;
}

const METRICS: Metric[] = [
  {
    id: 'met-1',
    name: 'http_requests_total',
    value: 2845920,
    unit: 'requests',
    previousValue: 2654890,
    changePercent: 7.2,
    status: 'healthy',
    source: 'prometheus',
    type: 'counter',
    labels: { method: 'GET', handler: '/api/v1', status: '200' },
    lastUpdated: '2 seconds ago'
  },
  {
    id: 'met-2',
    name: 'request_duration_seconds',
    value: 0.045,
    unit: 'seconds',
    previousValue: 0.052,
    changePercent: -13.5,
    status: 'healthy',
    source: 'prometheus',
    type: 'histogram',
    labels: { quantile: 'p95', service: 'api-gateway' },
    lastUpdated: '5 seconds ago'
  },
  {
    id: 'met-3',
    name: 'cpu_usage_percent',
    value: 78.5,
    unit: '%',
    previousValue: 65.2,
    changePercent: 20.4,
    status: 'warning',
    source: 'node_exporter',
    type: 'gauge',
    labels: { instance: 'prod-server-01', cpu: '0' },
    lastUpdated: '3 seconds ago'
  },
  {
    id: 'met-4',
    name: 'memory_usage_bytes',
    value: 8589934592,
    unit: 'bytes',
    previousValue: 7516192768,
    changePercent: 14.3,
    status: 'healthy',
    source: 'node_exporter',
    type: 'gauge',
    labels: { instance: 'prod-server-01' },
    lastUpdated: '3 seconds ago'
  },
  {
    id: 'met-5',
    name: 'error_rate',
    value: 2.8,
    unit: '%',
    previousValue: 1.2,
    changePercent: 133.3,
    status: 'critical',
    source: 'prometheus',
    type: 'gauge',
    labels: { service: 'payment-service' },
    lastUpdated: '10 seconds ago'
  },
  {
    id: 'met-6',
    name: 'database_connections_active',
    value: 245,
    unit: 'connections',
    previousValue: 198,
    changePercent: 23.7,
    status: 'warning',
    source: 'postgres_exporter',
    type: 'gauge',
    labels: { database: 'production', pool: 'primary' },
    lastUpdated: '8 seconds ago'
  },
  {
    id: 'met-7',
    name: 'queue_messages_pending',
    value: 1542,
    unit: 'messages',
    previousValue: 845,
    changePercent: 82.5,
    status: 'warning',
    source: 'rabbitmq_exporter',
    type: 'gauge',
    labels: { queue: 'order-processing', vhost: 'production' },
    lastUpdated: '4 seconds ago'
  },
  {
    id: 'met-8',
    name: 'cache_hit_ratio',
    value: 94.2,
    unit: '%',
    previousValue: 95.8,
    changePercent: -1.7,
    status: 'healthy',
    source: 'redis_exporter',
    type: 'gauge',
    labels: { cluster: 'cache-primary' },
    lastUpdated: '6 seconds ago'
  }
];

const DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-1',
    name: 'Infrastructure Overview',
    description: 'High-level view of all infrastructure components',
    panels: 24,
    views: 15840,
    lastModified: '2 hours ago',
    starred: true,
    owner: 'DevOps Team',
    tags: ['infrastructure', 'overview', 'production']
  },
  {
    id: 'dash-2',
    name: 'API Performance',
    description: 'Detailed API latency and throughput metrics',
    panels: 16,
    views: 8945,
    lastModified: '30 minutes ago',
    starred: true,
    owner: 'Backend Team',
    tags: ['api', 'performance', 'latency']
  },
  {
    id: 'dash-3',
    name: 'Database Health',
    description: 'PostgreSQL and Redis monitoring',
    panels: 12,
    views: 5620,
    lastModified: '1 hour ago',
    starred: false,
    owner: 'DBA Team',
    tags: ['database', 'postgresql', 'redis']
  },
  {
    id: 'dash-4',
    name: 'Kubernetes Cluster',
    description: 'K8s pods, nodes, and resource utilization',
    panels: 20,
    views: 12350,
    lastModified: '15 minutes ago',
    starred: true,
    owner: 'Platform Team',
    tags: ['kubernetes', 'containers', 'pods']
  },
  {
    id: 'dash-5',
    name: 'Security Metrics',
    description: 'Authentication failures, blocked requests',
    panels: 8,
    views: 3240,
    lastModified: '4 hours ago',
    starred: false,
    owner: 'Security Team',
    tags: ['security', 'authentication', 'threats']
  }
];

const PANELS: Panel[] = [
  {
    id: 'panel-1',
    title: 'Request Rate',
    type: 'timeseries',
    query: 'rate(http_requests_total[5m])',
    dataSource: 'prometheus',
    values: [450, 520, 480, 590, 620, 580, 640, 710, 680, 720, 690, 750],
    current: 750,
    min: 450,
    max: 750,
    avg: 610,
    unit: 'req/s'
  },
  {
    id: 'panel-2',
    title: 'Response Time P95',
    type: 'gauge',
    query: 'histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))',
    dataSource: 'prometheus',
    values: [42, 45, 48, 52, 45, 43, 40, 38, 45, 47, 44, 45],
    current: 45,
    min: 38,
    max: 52,
    avg: 44,
    unit: 'ms'
  },
  {
    id: 'panel-3',
    title: 'CPU Usage',
    type: 'gauge',
    query: '100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    dataSource: 'prometheus',
    values: [65, 68, 72, 75, 78, 82, 79, 76, 74, 78, 80, 78],
    current: 78,
    min: 65,
    max: 82,
    avg: 75,
    unit: '%'
  },
  {
    id: 'panel-4',
    title: 'Memory Usage',
    type: 'stat',
    query: 'node_memory_Active_bytes / node_memory_MemTotal_bytes * 100',
    dataSource: 'prometheus',
    values: [58, 60, 62, 65, 68, 70, 72, 74, 76, 78, 80, 82],
    current: 82,
    min: 58,
    max: 82,
    avg: 70,
    unit: '%'
  },
  {
    id: 'panel-5',
    title: 'Error Rate',
    type: 'timeseries',
    query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100',
    dataSource: 'prometheus',
    values: [0.8, 0.9, 1.2, 1.5, 1.8, 2.2, 2.5, 2.8, 2.4, 2.2, 2.0, 2.8],
    current: 2.8,
    min: 0.8,
    max: 2.8,
    avg: 1.8,
    unit: '%'
  },
  {
    id: 'panel-6',
    title: 'Active Connections',
    type: 'stat',
    query: 'pg_stat_activity_count{state="active"}',
    dataSource: 'prometheus',
    values: [180, 195, 210, 225, 240, 250, 245, 238, 242, 248, 245, 245],
    current: 245,
    min: 180,
    max: 250,
    avg: 230,
    unit: 'conns'
  }
];

const DATA_SOURCES: DataSource[] = [
  {
    id: 'ds-1',
    name: 'Prometheus Production',
    type: 'prometheus',
    url: 'https://prometheus.cube-elite.io',
    status: 'connected',
    metricsCount: 45892,
    scrapeInterval: '15s',
    retention: '30 days'
  },
  {
    id: 'ds-2',
    name: 'InfluxDB Time Series',
    type: 'influxdb',
    url: 'https://influx.cube-elite.io',
    status: 'connected',
    metricsCount: 12450,
    scrapeInterval: '10s',
    retention: '90 days'
  },
  {
    id: 'ds-3',
    name: 'AWS CloudWatch',
    type: 'cloudwatch',
    url: 'us-east-1.cloudwatch.amazonaws.com',
    status: 'connected',
    metricsCount: 8920,
    scrapeInterval: '60s',
    retention: '15 days'
  },
  {
    id: 'ds-4',
    name: 'Datadog Integration',
    type: 'datadog',
    url: 'api.datadoghq.com',
    status: 'error',
    metricsCount: 0,
    scrapeInterval: '30s',
    retention: '15 days'
  }
];

const METRIC_TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  counter: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  gauge: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  histogram: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  summary: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
};

const DS_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  prometheus: { icon: '🔥', color: '#e6522c' },
  influxdb: { icon: '📈', color: '#22adf6' },
  elasticsearch: { icon: '🔍', color: '#00bfb3' },
  cloudwatch: { icon: '☁️', color: '#ff9900' },
  datadog: { icon: '🐕', color: '#632ca6' }
};

export default function MetricsDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboards' | 'metrics' | 'datasources' | 'explore'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [timeRange, setTimeRange] = useState('1h');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const totalMetrics = DATA_SOURCES.reduce((sum, ds) => sum + ds.metricsCount, 0);
  const healthyMetrics = METRICS.filter(m => m.status === 'healthy').length;
  const warningMetrics = METRICS.filter(m => m.status === 'warning').length;
  const criticalMetrics = METRICS.filter(m => m.status === 'critical').length;

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-panels">
        <div className="panel panel-large">
          <div className="panel-header">
            <h3>Key Metrics Overview</h3>
            <div className="time-selector">
              <button 
                className={`time-btn ${timeRange === '15m' ? 'active' : ''}`}
                onClick={() => setTimeRange('15m')}
              >
                15m
              </button>
              <button 
                className={`time-btn ${timeRange === '1h' ? 'active' : ''}`}
                onClick={() => setTimeRange('1h')}
              >
                1h
              </button>
              <button 
                className={`time-btn ${timeRange === '6h' ? 'active' : ''}`}
                onClick={() => setTimeRange('6h')}
              >
                6h
              </button>
              <button 
                className={`time-btn ${timeRange === '24h' ? 'active' : ''}`}
                onClick={() => setTimeRange('24h')}
              >
                24h
              </button>
            </div>
          </div>
          <div className="panels-grid">
            {PANELS.map(panel => (
              <div key={panel.id} className={`panel-item ${panel.type}`}>
                <div className="panel-item-header">
                  <span className="panel-title">{panel.title}</span>
                  <span className="panel-source">{panel.dataSource}</span>
                </div>
                {panel.type === 'timeseries' && (
                  <div className="timeseries-chart">
                    <div className="chart-bars">
                      {panel.values.map((val, idx) => (
                        <div 
                          key={idx}
                          className="chart-bar"
                          style={{ 
                            height: `${((val - panel.min) / (panel.max - panel.min)) * 100}%`,
                            opacity: idx === panel.values.length - 1 ? 1 : 0.6
                          }}
                        />
                      ))}
                    </div>
                    <div className="chart-value">
                      <span className="value">{panel.current}</span>
                      <span className="unit">{panel.unit}</span>
                    </div>
                    <div className="chart-range">
                      <span>Min: {panel.min}</span>
                      <span>Avg: {panel.avg.toFixed(1)}</span>
                      <span>Max: {panel.max}</span>
                    </div>
                  </div>
                )}
                {panel.type === 'gauge' && (
                  <div className="gauge-chart">
                    <div className="gauge-visual">
                      <svg viewBox="0 0 100 60">
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#2a2a35"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke={panel.current > 75 ? '#ef4444' : panel.current > 50 ? '#f59e0b' : '#10b981'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(panel.current / 100) * 126} 126`}
                        />
                      </svg>
                      <div className="gauge-center">
                        <span className="value">{panel.current}</span>
                        <span className="unit">{panel.unit}</span>
                      </div>
                    </div>
                    <div className="gauge-labels">
                      <span>0</span>
                      <span>100</span>
                    </div>
                  </div>
                )}
                {panel.type === 'stat' && (
                  <div className="stat-chart">
                    <div className="stat-value">
                      <span className={`value ${panel.current > 80 ? 'warning' : ''}`}>{panel.current}</span>
                      <span className="unit">{panel.unit}</span>
                    </div>
                    <div className="stat-sparkline">
                      {panel.values.map((val, idx) => (
                        <div 
                          key={idx}
                          className="sparkline-bar"
                          style={{ height: `${((val - panel.min) / (panel.max - panel.min)) * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="stat-range">
                      <span>Avg: {panel.avg.toFixed(1)}{panel.unit}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-side">
          <h3>Active Alerts</h3>
          <div className="alerts-list">
            <div className="alert-item critical">
              <AlertTriangle size={16} />
              <div className="alert-info">
                <span className="alert-name">High Error Rate</span>
                <span className="alert-detail">payment-service &gt; 2%</span>
              </div>
              <span className="alert-time">5m ago</span>
            </div>
            <div className="alert-item warning">
              <AlertTriangle size={16} />
              <div className="alert-info">
                <span className="alert-name">CPU Usage High</span>
                <span className="alert-detail">prod-server-01 &gt; 75%</span>
              </div>
              <span className="alert-time">12m ago</span>
            </div>
            <div className="alert-item warning">
              <AlertTriangle size={16} />
              <div className="alert-info">
                <span className="alert-name">Queue Backlog</span>
                <span className="alert-detail">order-processing &gt; 1000</span>
              </div>
              <span className="alert-time">18m ago</span>
            </div>
            <div className="alert-item warning">
              <AlertTriangle size={16} />
              <div className="alert-info">
                <span className="alert-name">DB Connections</span>
                <span className="alert-detail">primary &gt; 200</span>
              </div>
              <span className="alert-time">25m ago</span>
            </div>
          </div>
          <button className="view-all-btn">View All Alerts</button>
        </div>
      </div>

      <div className="overview-bottom">
        <div className="panel">
          <div className="panel-header">
            <h3>Data Source Status</h3>
            <button className="btn-outline small">
              <Plus size={14} />
              Add Source
            </button>
          </div>
          <div className="datasources-mini">
            {DATA_SOURCES.map(ds => (
              <div key={ds.id} className={`ds-mini-item ${ds.status}`}>
                <div className="ds-mini-icon">
                  {DS_TYPE_CONFIG[ds.type].icon}
                </div>
                <div className="ds-mini-info">
                  <span className="ds-name">{ds.name}</span>
                  <span className="ds-metrics">{formatNumber(ds.metricsCount)} metrics</span>
                </div>
                <div className={`ds-status ${ds.status}`}>
                  {ds.status === 'connected' && <CheckCircle size={14} />}
                  {ds.status === 'error' && <AlertTriangle size={14} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Starred Dashboards</h3>
            <button className="btn-outline small">
              <Layers size={14} />
              All Dashboards
            </button>
          </div>
          <div className="dashboards-mini">
            {DASHBOARDS.filter(d => d.starred).map(dash => (
              <div key={dash.id} className="dash-mini-item">
                <BarChart3 size={16} className="dash-icon" />
                <div className="dash-mini-info">
                  <span className="dash-name">{dash.name}</span>
                  <span className="dash-panels">{dash.panels} panels</span>
                </div>
                <button className="btn-icon">
                  <Eye size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboards = () => (
    <div className="dashboards-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box large">
            <Filter size={16} />
            <input type="text" placeholder="Search dashboards..." />
          </div>
          <select>
            <option>All Tags</option>
            <option>infrastructure</option>
            <option>api</option>
            <option>database</option>
            <option>kubernetes</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={16} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Dashboard
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        {DASHBOARDS.map(dash => (
          <div key={dash.id} className="dashboard-card">
            <div className="dash-card-header">
              <div className="dash-card-icon">
                <BarChart3 size={20} />
              </div>
              <button className={`star-btn ${dash.starred ? 'starred' : ''}`}>
                <Star size={16} fill={dash.starred ? '#f59e0b' : 'none'} />
              </button>
            </div>
            <h4>{dash.name}</h4>
            <p className="dash-description">{dash.description}</p>
            <div className="dash-tags">
              {dash.tags.map(tag => (
                <span key={tag} className="dash-tag">{tag}</span>
              ))}
            </div>
            <div className="dash-stats">
              <div className="dash-stat">
                <Layers size={14} />
                <span>{dash.panels} panels</span>
              </div>
              <div className="dash-stat">
                <Eye size={14} />
                <span>{formatNumber(dash.views)} views</span>
              </div>
            </div>
            <div className="dash-meta">
              <span className="dash-owner">{dash.owner}</span>
              <span className="dash-modified">{dash.lastModified}</span>
            </div>
            <div className="dash-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                View
              </button>
              <button className="btn-outline small">
                <Edit2 size={14} />
                Edit
              </button>
              <button className="btn-icon">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="metrics-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box large">
            <Filter size={16} />
            <input type="text" placeholder="Search metrics by name, label, or source..." />
          </div>
          <select>
            <option>All Types</option>
            <option>Counter</option>
            <option>Gauge</option>
            <option>Histogram</option>
            <option>Summary</option>
          </select>
          <select>
            <option>All Sources</option>
            <option>prometheus</option>
            <option>node_exporter</option>
            <option>postgres_exporter</option>
            <option>redis_exporter</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Zap size={16} />
            Create Recording Rule
          </button>
        </div>
      </div>

      <div className="metrics-table-container">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Metric Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Change</th>
              <th>Status</th>
              <th>Source</th>
              <th>Labels</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map(metric => (
              <tr 
                key={metric.id} 
                className={`metric-row ${metric.status}`}
                onClick={() => setSelectedMetric(metric)}
              >
                <td className="col-name">
                  <code>{metric.name}</code>
                </td>
                <td className="col-type">
                  <span 
                    className="type-badge"
                    style={{ 
                      color: METRIC_TYPE_CONFIG[metric.type].color,
                      background: METRIC_TYPE_CONFIG[metric.type].bg
                    }}
                  >
                    {metric.type}
                  </span>
                </td>
                <td className="col-value">
                  <span className="metric-value">
                    {metric.unit === 'bytes' ? formatBytes(metric.value) : formatNumber(metric.value)}
                  </span>
                  <span className="metric-unit">{metric.unit !== 'bytes' ? metric.unit : ''}</span>
                </td>
                <td className="col-change">
                  <span className={`change ${metric.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {metric.changePercent >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(metric.changePercent).toFixed(1)}%
                  </span>
                </td>
                <td className="col-status">
                  <span className={`status-badge ${metric.status}`}>
                    {metric.status === 'healthy' && <CheckCircle size={12} />}
                    {metric.status === 'warning' && <AlertTriangle size={12} />}
                    {metric.status === 'critical' && <AlertTriangle size={12} />}
                    {metric.status}
                  </span>
                </td>
                <td className="col-source">{metric.source}</td>
                <td className="col-labels">
                  <div className="labels-list">
                    {Object.entries(metric.labels).slice(0, 2).map(([key, val]) => (
                      <span key={key} className="label-tag">{key}={val}</span>
                    ))}
                    {Object.keys(metric.labels).length > 2 && (
                      <span className="label-more">+{Object.keys(metric.labels).length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="col-updated">{metric.lastUpdated}</td>
                <td className="col-actions">
                  <button className="btn-icon" title="Explore">
                    <LineChart size={14} />
                  </button>
                  <button className="btn-icon" title="Copy Query">
                    <Copy size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMetric && (
        <div className="metric-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <h3>{selectedMetric.name}</h3>
              <span className="panel-subtitle">{selectedMetric.source}</span>
            </div>
            <button className="close-btn" onClick={() => setSelectedMetric(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="panel-section">
              <h4>Current Value</h4>
              <div className="big-value">
                <span className={`value ${selectedMetric.status}`}>
                  {selectedMetric.unit === 'bytes' ? formatBytes(selectedMetric.value) : formatNumber(selectedMetric.value)}
                </span>
                <span className="unit">{selectedMetric.unit !== 'bytes' ? selectedMetric.unit : ''}</span>
              </div>
            </div>

            <div className="panel-section">
              <h4>Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedMetric.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value status ${selectedMetric.status}`}>{selectedMetric.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Previous</span>
                  <span className="detail-value">
                    {selectedMetric.unit === 'bytes' ? formatBytes(selectedMetric.previousValue) : formatNumber(selectedMetric.previousValue)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Change</span>
                  <span className={`detail-value ${selectedMetric.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {selectedMetric.changePercent >= 0 ? '+' : ''}{selectedMetric.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Labels</h4>
              <div className="labels-full">
                {Object.entries(selectedMetric.labels).map(([key, val]) => (
                  <div key={key} className="label-item">
                    <span className="label-key">{key}</span>
                    <span className="label-val">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <LineChart size={16} />
                Explore in Graph
              </button>
              <button className="btn-outline">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDataSources = () => (
    <div className="datasources-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Filter size={16} />
            <input type="text" placeholder="Search data sources..." />
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Test All
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Data Source
          </button>
        </div>
      </div>

      <div className="datasource-cards">
        {DATA_SOURCES.map(ds => (
          <div key={ds.id} className={`datasource-card ${ds.status}`}>
            <div className="ds-card-header">
              <div 
                className="ds-card-icon"
                style={{ background: `${DS_TYPE_CONFIG[ds.type].color}20` }}
              >
                <span style={{ fontSize: '28px' }}>{DS_TYPE_CONFIG[ds.type].icon}</span>
              </div>
              <div className={`ds-status-badge ${ds.status}`}>
                {ds.status === 'connected' && <><CheckCircle size={12} /> Connected</>}
                {ds.status === 'disconnected' && <><Clock size={12} /> Disconnected</>}
                {ds.status === 'error' && <><AlertTriangle size={12} /> Error</>}
              </div>
            </div>
            <h4>{ds.name}</h4>
            <p className="ds-type">{ds.type.toUpperCase()}</p>
            <div className="ds-url">
              <Globe size={14} />
              <code>{ds.url}</code>
            </div>
            <div className="ds-metrics-bar">
              <div className="metrics-bar-header">
                <span>Metrics</span>
                <span>{formatNumber(ds.metricsCount)}</span>
              </div>
              <div className="metrics-bar-track">
                <div 
                  className="metrics-bar-fill"
                  style={{ width: `${Math.min((ds.metricsCount / 50000) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="ds-info">
              <div className="info-item">
                <Clock size={14} />
                <span>Scrape: {ds.scrapeInterval}</span>
              </div>
              <div className="info-item">
                <Database size={14} />
                <span>Retention: {ds.retention}</span>
              </div>
            </div>
            <div className="ds-actions">
              <button className="btn-outline small">
                <Settings size={14} />
                Configure
              </button>
              <button className="btn-outline small">
                <Zap size={14} />
                Test
              </button>
              <button className="btn-icon">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExplore = () => (
    <div className="explore-section">
      <div className="explore-header">
        <h3>Metrics Explorer</h3>
        <p>Query and visualize metrics from all connected data sources</p>
      </div>
      <div className="query-builder">
        <div className="query-row">
          <select className="ds-select">
            <option>Prometheus Production</option>
            <option>InfluxDB Time Series</option>
            <option>AWS CloudWatch</option>
          </select>
          <div className="query-input">
            <code>{'>'}</code>
            <input 
              type="text" 
              placeholder="Enter PromQL query (e.g., rate(http_requests_total[5m]))"
            />
          </div>
          <button className="btn-primary">
            <Zap size={16} />
            Run Query
          </button>
        </div>
        <div className="query-options">
          <div className="option-group">
            <label>Time Range</label>
            <select>
              <option>Last 15 minutes</option>
              <option>Last 1 hour</option>
              <option>Last 6 hours</option>
              <option>Last 24 hours</option>
              <option>Last 7 days</option>
            </select>
          </div>
          <div className="option-group">
            <label>Step</label>
            <select>
              <option>Auto</option>
              <option>15s</option>
              <option>1m</option>
              <option>5m</option>
            </select>
          </div>
          <div className="option-group">
            <label>Visualization</label>
            <div className="viz-options">
              <button className="viz-btn active">
                <LineChart size={16} />
              </button>
              <button className="viz-btn">
                <BarChart3 size={16} />
              </button>
              <button className="viz-btn">
                <PieChart size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="explore-results">
        <div className="results-placeholder">
          <Activity size={48} />
          <p>Enter a query to explore your metrics</p>
          <span>Results will be displayed here</span>
        </div>
      </div>
      <div className="explore-suggestions">
        <h4>Suggested Queries</h4>
        <div className="suggestions-list">
          <button className="suggestion-item">
            <code>rate(http_requests_total[5m])</code>
            <span>Request rate per second</span>
          </button>
          <button className="suggestion-item">
            <code>histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))</code>
            <span>95th percentile latency</span>
          </button>
          <button className="suggestion-item">
            <code>100 - (avg(irate(node_cpu_seconds_total{'{mode="idle"}'}[5m])) * 100)</code>
            <span>CPU usage percentage</span>
          </button>
          <button className="suggestion-item">
            <code>sum(rate(http_requests_total{'{status=~"5.."}'}[5m])) / sum(rate(http_requests_total[5m])) * 100</code>
            <span>Error rate percentage</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="metrics-dashboard">
      <header className="md__header">
        <div className="md__title-section">
          <div className="md__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Metrics Dashboard</h1>
            <p>Monitor, query, and visualize system metrics</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Calendar size={16} />
            Last 1 Hour
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Panel
          </button>
        </div>
      </header>

      <div className="md__stats">
        <div className="stat-card primary">
          <div className="stat-icon sources-icon">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{DATA_SOURCES.filter(ds => ds.status === 'connected').length}/{DATA_SOURCES.length}</span>
            <span className="stat-label">Data Sources Connected</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon metrics-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalMetrics)}</span>
            <span className="stat-label">Total Metrics</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon dashboards-icon">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{DASHBOARDS.length}</span>
            <span className="stat-label">Dashboards</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon alerts-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className={`stat-value ${criticalMetrics > 0 ? 'error' : warningMetrics > 0 ? 'warning' : ''}`}>
              {criticalMetrics + warningMetrics}
            </span>
            <span className="stat-label">Active Alerts</span>
          </div>
        </div>
      </div>

      <div className="md__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dashboards' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboards')}
        >
          <Layers size={16} />
          Dashboards
          <span className="tab-badge">{DASHBOARDS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 size={16} />
          Metrics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'datasources' ? 'active' : ''}`}
          onClick={() => setActiveTab('datasources')}
        >
          <Database size={16} />
          Data Sources
        </button>
        <button 
          className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          <Zap size={16} />
          Explore
        </button>
      </div>

      <div className="md__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'dashboards' && renderDashboards()}
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'datasources' && renderDataSources()}
        {activeTab === 'explore' && renderExplore()}
      </div>
    </div>
  );
}
