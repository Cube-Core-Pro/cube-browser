'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Server,
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Download,
  ZapOff,
  Zap,
  Globe,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Thermometer,
  Gauge,
  Network,
  Container
} from 'lucide-react';
import './resource-monitor.css';

interface ResourceMetric {
  id: string;
  name: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'api';
  current: number;
  max: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface ProcessInfo {
  id: string;
  name: string;
  type: string;
  cpu: number;
  memory: number;
  status: 'running' | 'idle' | 'blocked';
  uptime: string;
  pid: number;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  uptime: string;
  lastCheck: string;
  endpoint: string;
}

const RESOURCE_METRICS: ResourceMetric[] = [
  {
    id: 'cpu',
    name: 'CPU Usage',
    type: 'cpu',
    current: 45,
    max: 100,
    unit: '%',
    status: 'healthy',
    trend: 'stable',
    history: [42, 38, 45, 52, 48, 45, 43, 47, 45, 44, 46, 45]
  },
  {
    id: 'memory',
    name: 'Memory Usage',
    type: 'memory',
    current: 68,
    max: 100,
    unit: '%',
    status: 'warning',
    trend: 'up',
    history: [55, 58, 60, 62, 64, 65, 66, 67, 68, 68, 69, 68]
  },
  {
    id: 'disk',
    name: 'Disk Space',
    type: 'disk',
    current: 234,
    max: 500,
    unit: 'GB',
    status: 'healthy',
    trend: 'up',
    history: [220, 222, 224, 226, 228, 230, 231, 232, 233, 234, 234, 234]
  },
  {
    id: 'network-in',
    name: 'Network In',
    type: 'network',
    current: 125,
    max: 1000,
    unit: 'Mbps',
    status: 'healthy',
    trend: 'down',
    history: [150, 145, 140, 135, 130, 128, 126, 125, 124, 125, 126, 125]
  },
  {
    id: 'network-out',
    name: 'Network Out',
    type: 'network',
    current: 85,
    max: 1000,
    unit: 'Mbps',
    status: 'healthy',
    trend: 'stable',
    history: [82, 84, 86, 85, 84, 85, 86, 85, 84, 85, 85, 85]
  },
  {
    id: 'database',
    name: 'Database Connections',
    type: 'database',
    current: 42,
    max: 100,
    unit: 'conn',
    status: 'healthy',
    trend: 'stable',
    history: [40, 41, 42, 43, 42, 41, 42, 43, 42, 42, 42, 42]
  }
];

const PROCESSES: ProcessInfo[] = [
  { id: '1', name: 'Automation Engine', type: 'service', cpu: 12.5, memory: 450, status: 'running', uptime: '7d 14h', pid: 1234 },
  { id: '2', name: 'Web Scraper Worker', type: 'worker', cpu: 8.2, memory: 280, status: 'running', uptime: '3d 6h', pid: 2345 },
  { id: '3', name: 'AI Processing Queue', type: 'queue', cpu: 15.8, memory: 620, status: 'running', uptime: '7d 14h', pid: 3456 },
  { id: '4', name: 'API Gateway', type: 'gateway', cpu: 5.1, memory: 180, status: 'running', uptime: '14d 2h', pid: 4567 },
  { id: '5', name: 'Cache Manager', type: 'cache', cpu: 2.3, memory: 1200, status: 'running', uptime: '7d 14h', pid: 5678 },
  { id: '6', name: 'Background Jobs', type: 'worker', cpu: 4.7, memory: 220, status: 'idle', uptime: '7d 14h', pid: 6789 },
  { id: '7', name: 'Log Aggregator', type: 'service', cpu: 1.8, memory: 150, status: 'running', uptime: '14d 2h', pid: 7890 },
  { id: '8', name: 'Email Processor', type: 'worker', cpu: 0.5, memory: 90, status: 'blocked', uptime: '2d 8h', pid: 8901 }
];

const SERVICES: ServiceStatus[] = [
  { id: '1', name: 'Authentication Service', status: 'online', responseTime: 45, uptime: '99.99%', lastCheck: '10s ago', endpoint: '/api/auth' },
  { id: '2', name: 'Automation API', status: 'online', responseTime: 120, uptime: '99.95%', lastCheck: '10s ago', endpoint: '/api/automation' },
  { id: '3', name: 'AI Service', status: 'degraded', responseTime: 850, uptime: '98.50%', lastCheck: '10s ago', endpoint: '/api/ai' },
  { id: '4', name: 'Data Export', status: 'online', responseTime: 230, uptime: '99.90%', lastCheck: '10s ago', endpoint: '/api/export' },
  { id: '5', name: 'Webhook Processor', status: 'online', responseTime: 65, uptime: '99.99%', lastCheck: '10s ago', endpoint: '/api/webhooks' },
  { id: '6', name: 'Storage Service', status: 'online', responseTime: 180, uptime: '99.97%', lastCheck: '10s ago', endpoint: '/api/storage' }
];

export default function ResourceMonitorPage() {
  const [metrics, setMetrics] = useState<ResourceMetric[]>(RESOURCE_METRICS);
  const [processes, setProcesses] = useState<ProcessInfo[]>(PROCESSES);
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'services'>('overview');
  const [refreshRate, setRefreshRate] = useState('5s');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const sortedProcesses = [...processes].sort((a, b) => {
    if (sortBy === 'cpu') return b.cpu - a.cpu;
    if (sortBy === 'memory') return b.memory - a.memory;
    return a.name.localeCompare(b.name);
  });

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'cpu': return Cpu;
      case 'memory': return MemoryStick;
      case 'disk': return HardDrive;
      case 'network': return Network;
      case 'database': return Database;
      case 'api': return Globe;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'running': return 'success';
      case 'warning':
      case 'degraded':
      case 'idle': return 'warning';
      case 'critical':
      case 'offline':
      case 'blocked': return 'danger';
      default: return 'neutral';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return ArrowUpRight;
      case 'down': return ArrowDownRight;
      default: return TrendingUp;
    }
  };

  const overallHealth = metrics.every(m => m.status === 'healthy') ? 'healthy' : 
                        metrics.some(m => m.status === 'critical') ? 'critical' : 'warning';

  return (
    <div className="resource-monitor">
      <header className="resource-monitor__header">
        <div className="resource-monitor__title-section">
          <div className="resource-monitor__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Resource Monitor</h1>
            <p>Real-time system resource monitoring and performance tracking</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="refresh-control">
            <span className="refresh-label">Auto-refresh:</span>
            <select 
              value={refreshRate} 
              onChange={(e) => setRefreshRate(e.target.value)}
              className="refresh-select"
            >
              <option value="1s">1 second</option>
              <option value="5s">5 seconds</option>
              <option value="10s">10 seconds</option>
              <option value="30s">30 seconds</option>
              <option value="off">Off</option>
            </select>
          </div>
          <button 
            className={`btn-outline ${isRefreshing ? 'refreshing' : ''}`} 
            onClick={handleRefresh}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh Now
          </button>
          <button className="btn-primary">
            <Settings size={16} />
            Configure Alerts
          </button>
        </div>
      </header>

      <div className="system-status-bar">
        <div className={`status-indicator ${overallHealth}`}>
          {overallHealth === 'healthy' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>System Status: {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}</span>
        </div>
        <div className="status-stats">
          <span><strong>{services.filter(s => s.status === 'online').length}</strong> Services Online</span>
          <span><strong>{processes.filter(p => p.status === 'running').length}</strong> Processes Running</span>
          <span>Last updated: <strong>Just now</strong></span>
        </div>
      </div>

      <div className="resource-monitor__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveTab('processes')}
        >
          <Container size={16} />
          Processes
          <span className="tab-badge">{processes.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Server size={16} />
          Services
          <span className="tab-badge">{services.length}</span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="metrics-grid">
            {metrics.map(metric => {
              const Icon = getMetricIcon(metric.type);
              const TrendIcon = getTrendIcon(metric.trend);
              const percentage = (metric.current / metric.max) * 100;

              return (
                <div key={metric.id} className={`metric-card ${metric.status}`}>
                  <div className="metric-header">
                    <div className={`metric-icon ${metric.type}`}>
                      <Icon size={20} />
                    </div>
                    <div className={`metric-status ${metric.status}`}>
                      {metric.status === 'healthy' && <CheckCircle size={14} />}
                      {metric.status === 'warning' && <AlertTriangle size={14} />}
                      {metric.status === 'critical' && <ZapOff size={14} />}
                      {metric.status}
                    </div>
                  </div>

                  <div className="metric-info">
                    <h4>{metric.name}</h4>
                    <div className="metric-value">
                      <span className="value">{metric.current}</span>
                      <span className="unit">{metric.unit}</span>
                      <span className="max">/ {metric.max} {metric.unit}</span>
                    </div>
                  </div>

                  <div className="metric-progress">
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${metric.status}`} 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                    <span className="percentage">{percentage.toFixed(1)}%</span>
                  </div>

                  <div className="metric-trend">
                    <TrendIcon size={14} className={`trend-icon ${metric.trend}`} />
                    <span className={`trend-label ${metric.trend}`}>
                      {metric.trend === 'up' ? 'Increasing' : metric.trend === 'down' ? 'Decreasing' : 'Stable'}
                    </span>
                  </div>

                  <div className="metric-chart">
                    <svg viewBox="0 0 100 30" className="sparkline">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points={metric.history.map((v, i) => 
                          `${(i / (metric.history.length - 1)) * 100},${30 - (v / metric.max) * 30}`
                        ).join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overview-row">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Resource Usage Trend (24h)</h3>
                <select className="chart-select">
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
              <div className="chart-placeholder">
                <BarChart3 size={48} />
                <p>Resource usage trend chart</p>
              </div>
            </div>

            <div className="alerts-card">
              <div className="alerts-header">
                <h3>Recent Alerts</h3>
                <button className="btn-text">View All</button>
              </div>
              <div className="alerts-list">
                <div className="alert-item warning">
                  <AlertTriangle size={16} />
                  <div className="alert-content">
                    <span className="alert-title">Memory usage above 65%</span>
                    <span className="alert-time">15 minutes ago</span>
                  </div>
                </div>
                <div className="alert-item info">
                  <Activity size={16} />
                  <div className="alert-content">
                    <span className="alert-title">AI Service response time increased</span>
                    <span className="alert-time">1 hour ago</span>
                  </div>
                </div>
                <div className="alert-item success">
                  <CheckCircle size={16} />
                  <div className="alert-content">
                    <span className="alert-title">Disk cleanup completed</span>
                    <span className="alert-time">3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'processes' && (
        <div className="processes-section">
          <div className="section-toolbar">
            <div className="toolbar-left">
              <span className="process-count">{processes.length} processes</span>
            </div>
            <div className="toolbar-right">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'cpu' | 'memory' | 'name')}
                className="sort-select"
              >
                <option value="cpu">CPU Usage</option>
                <option value="memory">Memory Usage</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div className="processes-table">
            <div className="table-header">
              <span className="col-name">Process</span>
              <span className="col-type">Type</span>
              <span className="col-pid">PID</span>
              <span className="col-cpu">CPU</span>
              <span className="col-memory">Memory</span>
              <span className="col-status">Status</span>
              <span className="col-uptime">Uptime</span>
              <span className="col-actions">Actions</span>
            </div>

            {sortedProcesses.map(process => (
              <div key={process.id} className={`process-row ${process.status}`}>
                <span className="col-name">
                  <Container size={16} />
                  {process.name}
                </span>
                <span className="col-type">
                  <span className="type-badge">{process.type}</span>
                </span>
                <span className="col-pid">{process.pid}</span>
                <span className="col-cpu">
                  <div className="cpu-bar">
                    <div className="bar-fill" style={{ width: `${process.cpu}%` }} />
                  </div>
                  <span>{process.cpu.toFixed(1)}%</span>
                </span>
                <span className="col-memory">{process.memory} MB</span>
                <span className="col-status">
                  <span className={`status-badge ${getStatusColor(process.status)}`}>
                    {process.status}
                  </span>
                </span>
                <span className="col-uptime">{process.uptime}</span>
                <span className="col-actions">
                  <button className="action-btn" title="Restart">
                    <RefreshCw size={14} />
                  </button>
                  <button className="action-btn" title="Stop">
                    <ZapOff size={14} />
                  </button>
                  <button className="action-btn" title="More">
                    <MoreHorizontal size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div className="processes-summary">
            <div className="summary-item">
              <Cpu size={18} />
              <span>Total CPU: <strong>{processes.reduce((sum, p) => sum + p.cpu, 0).toFixed(1)}%</strong></span>
            </div>
            <div className="summary-item">
              <MemoryStick size={18} />
              <span>Total Memory: <strong>{(processes.reduce((sum, p) => sum + p.memory, 0) / 1024).toFixed(2)} GB</strong></span>
            </div>
            <div className="summary-item">
              <Activity size={18} />
              <span>Active: <strong>{processes.filter(p => p.status === 'running').length}</strong></span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="services-section">
          <div className="services-grid">
            {services.map(service => (
              <div key={service.id} className={`service-card ${service.status}`}>
                <div className="service-header">
                  <div className={`service-indicator ${service.status}`} />
                  <h4>{service.name}</h4>
                  <span className={`status-badge ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>

                <div className="service-metrics">
                  <div className="service-metric">
                    <span className="metric-label">Response Time</span>
                    <span className={`metric-value ${service.responseTime > 500 ? 'warning' : ''}`}>
                      {service.responseTime}ms
                    </span>
                  </div>
                  <div className="service-metric">
                    <span className="metric-label">Uptime</span>
                    <span className="metric-value">{service.uptime}</span>
                  </div>
                </div>

                <div className="service-endpoint">
                  <Globe size={14} />
                  <code>{service.endpoint}</code>
                </div>

                <div className="service-footer">
                  <span className="last-check">
                    <Clock size={12} />
                    Last check: {service.lastCheck}
                  </span>
                  <button className="btn-small">
                    <RefreshCw size={12} />
                    Check Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="services-summary">
            <div className="summary-card">
              <div className="summary-icon online">
                <CheckCircle size={24} />
              </div>
              <div className="summary-info">
                <span className="summary-value">{services.filter(s => s.status === 'online').length}</span>
                <span className="summary-label">Online</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon degraded">
                <AlertTriangle size={24} />
              </div>
              <div className="summary-info">
                <span className="summary-value">{services.filter(s => s.status === 'degraded').length}</span>
                <span className="summary-label">Degraded</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon offline">
                <ZapOff size={24} />
              </div>
              <div className="summary-info">
                <span className="summary-value">{services.filter(s => s.status === 'offline').length}</span>
                <span className="summary-label">Offline</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon avg">
                <Gauge size={24} />
              </div>
              <div className="summary-info">
                <span className="summary-value">
                  {Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length)}ms
                </span>
                <span className="summary-label">Avg Response</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="resource-monitor__footer">
        <button className="btn-outline">
          <Download size={16} />
          Export Report
        </button>
        <span className="monitoring-info">
          Monitoring {metrics.length} metrics • {processes.length} processes • {services.length} services
        </span>
      </div>
    </div>
  );
}
