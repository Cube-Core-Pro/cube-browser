'use client';

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  Bell,
  BellOff,
  Filter,
  Zap,
  Cpu,
  HardDrive,
  Network,
  Database,
  Server,
  Globe,
  Shield,
  Users,
  Timer,
  Target,
  Gauge,
  Layers,
  Box,
  MoreHorizontal,
  ExternalLink,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import './observability.css';

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  sparkline: number[];
}

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  source: string;
  status: 'firing' | 'resolved' | 'silenced';
  startedAt: string;
  resolvedAt?: string;
  labels: Record<string, string>;
}

interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  latency: number;
  errorRate: number;
  requestsPerSec: number;
  instances: number;
  lastCheck: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  message: string;
  traceId?: string;
}

interface Trace {
  id: string;
  traceId: string;
  service: string;
  operation: string;
  duration: number;
  status: 'ok' | 'error';
  timestamp: string;
  spans: number;
}

const METRICS: Metric[] = [
  { id: 'm1', name: 'Request Rate', value: 15420, unit: 'req/s', change: 12.5, changeType: 'increase', status: 'healthy', sparkline: [12, 14, 13, 15, 14, 16, 15, 17, 16, 15, 14, 15] },
  { id: 'm2', name: 'Error Rate', value: 0.12, unit: '%', change: -0.08, changeType: 'decrease', status: 'healthy', sparkline: [0.2, 0.18, 0.15, 0.14, 0.13, 0.12, 0.11, 0.12, 0.13, 0.12, 0.11, 0.12] },
  { id: 'm3', name: 'P99 Latency', value: 245, unit: 'ms', change: 18, changeType: 'increase', status: 'warning', sparkline: [220, 225, 230, 235, 228, 240, 245, 250, 248, 245, 242, 245] },
  { id: 'm4', name: 'CPU Usage', value: 68, unit: '%', change: 5, changeType: 'increase', status: 'healthy', sparkline: [62, 64, 65, 63, 66, 68, 67, 69, 68, 70, 68, 68] },
  { id: 'm5', name: 'Memory Usage', value: 74, unit: '%', change: 2, changeType: 'increase', status: 'healthy', sparkline: [70, 71, 72, 71, 73, 72, 74, 73, 74, 75, 74, 74] },
  { id: 'm6', name: 'Disk I/O', value: 342, unit: 'MB/s', change: -15, changeType: 'decrease', status: 'healthy', sparkline: [360, 355, 350, 348, 345, 340, 342, 345, 343, 340, 342, 342] },
  { id: 'm7', name: 'Network In', value: 1.24, unit: 'Gbps', change: 8, changeType: 'increase', status: 'healthy', sparkline: [1.1, 1.12, 1.15, 1.18, 1.2, 1.22, 1.24, 1.25, 1.23, 1.24, 1.25, 1.24] },
  { id: 'm8', name: 'Active Users', value: 24580, unit: 'users', change: 1250, changeType: 'increase', status: 'healthy', sparkline: [22000, 22500, 23000, 23200, 23800, 24000, 24200, 24400, 24300, 24500, 24600, 24580] }
];

const ALERTS: Alert[] = [
  { id: 'alert-1', title: 'High P99 Latency', description: 'P99 latency has exceeded 200ms threshold for cube-backend service', severity: 'warning', source: 'prometheus', status: 'firing', startedAt: '2025-01-28T14:25:00Z', labels: { service: 'cube-backend', env: 'production', region: 'us-east-1' } },
  { id: 'alert-2', title: 'Pod Restart Loop', description: 'Pod cube-worker-7f8d9 has restarted 5 times in the last 10 minutes', severity: 'critical', source: 'kubernetes', status: 'firing', startedAt: '2025-01-28T14:20:00Z', labels: { pod: 'cube-worker-7f8d9', namespace: 'production', cluster: 'production-us-east' } },
  { id: 'alert-3', title: 'Database Connection Pool Exhausted', description: 'PostgreSQL connection pool at 95% capacity', severity: 'warning', source: 'postgres', status: 'firing', startedAt: '2025-01-28T14:15:00Z', labels: { database: 'postgres-main', pool: 'primary' } },
  { id: 'alert-4', title: 'SSL Certificate Expiring', description: 'SSL certificate for api.cube.io expires in 14 days', severity: 'info', source: 'cert-manager', status: 'firing', startedAt: '2025-01-28T10:00:00Z', labels: { domain: 'api.cube.io', issuer: 'letsencrypt' } },
  { id: 'alert-5', title: 'Memory Pressure', description: 'Node ip-10-0-1-105 experiencing memory pressure', severity: 'warning', source: 'kubernetes', status: 'resolved', startedAt: '2025-01-28T12:00:00Z', resolvedAt: '2025-01-28T12:45:00Z', labels: { node: 'ip-10-0-1-105', cluster: 'production-us-east' } },
  { id: 'alert-6', title: 'Disk Space Low', description: 'Disk usage on /data volume exceeded 85%', severity: 'warning', source: 'node-exporter', status: 'silenced', startedAt: '2025-01-28T08:00:00Z', labels: { node: 'ip-10-0-2-103', mount: '/data' } }
];

const SERVICES: Service[] = [
  { id: 'svc-1', name: 'cube-frontend', status: 'healthy', uptime: 99.99, latency: 45, errorRate: 0.02, requestsPerSec: 8500, instances: 6, lastCheck: '2025-01-28T14:33:00Z' },
  { id: 'svc-2', name: 'cube-backend', status: 'degraded', uptime: 99.85, latency: 245, errorRate: 0.15, requestsPerSec: 12400, instances: 8, lastCheck: '2025-01-28T14:33:00Z' },
  { id: 'svc-3', name: 'cube-ai-service', status: 'healthy', uptime: 99.95, latency: 520, errorRate: 0.08, requestsPerSec: 2100, instances: 4, lastCheck: '2025-01-28T14:33:00Z' },
  { id: 'svc-4', name: 'cube-worker', status: 'unhealthy', uptime: 98.50, latency: 0, errorRate: 2.5, requestsPerSec: 5600, instances: 10, lastCheck: '2025-01-28T14:33:00Z' },
  { id: 'svc-5', name: 'postgres-primary', status: 'healthy', uptime: 99.99, latency: 12, errorRate: 0.01, requestsPerSec: 45000, instances: 1, lastCheck: '2025-01-28T14:33:00Z' },
  { id: 'svc-6', name: 'redis-cluster', status: 'healthy', uptime: 99.99, latency: 2, errorRate: 0.001, requestsPerSec: 125000, instances: 3, lastCheck: '2025-01-28T14:33:00Z' }
];

const LOGS: LogEntry[] = [
  { id: 'log-1', timestamp: '2025-01-28T14:33:15Z', level: 'error', service: 'cube-worker', message: 'Failed to process job: timeout after 30s', traceId: 'abc123def456' },
  { id: 'log-2', timestamp: '2025-01-28T14:33:10Z', level: 'warn', service: 'cube-backend', message: 'Slow query detected: SELECT * FROM users took 2.5s', traceId: 'xyz789ghi012' },
  { id: 'log-3', timestamp: '2025-01-28T14:33:05Z', level: 'info', service: 'cube-frontend', message: 'User authentication successful', traceId: 'jkl345mno678' },
  { id: 'log-4', timestamp: '2025-01-28T14:33:00Z', level: 'error', service: 'cube-ai-service', message: 'OpenAI API rate limit exceeded', traceId: 'pqr901stu234' },
  { id: 'log-5', timestamp: '2025-01-28T14:32:55Z', level: 'debug', service: 'cube-backend', message: 'Cache hit for user preferences: user_12345' },
  { id: 'log-6', timestamp: '2025-01-28T14:32:50Z', level: 'info', service: 'cube-worker', message: 'Job completed successfully: export_report_456', traceId: 'vwx567yza890' },
  { id: 'log-7', timestamp: '2025-01-28T14:32:45Z', level: 'warn', service: 'postgres-primary', message: 'Connection pool utilization at 95%' },
  { id: 'log-8', timestamp: '2025-01-28T14:32:40Z', level: 'info', service: 'redis-cluster', message: 'Replica sync completed with master' }
];

const TRACES: Trace[] = [
  { id: 'trace-1', traceId: 'abc123def456', service: 'cube-frontend', operation: 'POST /api/workflows', duration: 1250, status: 'ok', timestamp: '2025-01-28T14:33:00Z', spans: 12 },
  { id: 'trace-2', traceId: 'xyz789ghi012', service: 'cube-backend', operation: 'GET /api/users', duration: 2580, status: 'ok', timestamp: '2025-01-28T14:32:55Z', spans: 8 },
  { id: 'trace-3', traceId: 'pqr901stu234', service: 'cube-ai-service', operation: 'POST /api/ai/analyze', duration: 4500, status: 'error', timestamp: '2025-01-28T14:32:50Z', spans: 15 },
  { id: 'trace-4', traceId: 'jkl345mno678', service: 'cube-frontend', operation: 'GET /api/dashboard', duration: 380, status: 'ok', timestamp: '2025-01-28T14:32:45Z', spans: 6 },
  { id: 'trace-5', traceId: 'vwx567yza890', service: 'cube-worker', operation: 'ProcessJob', duration: 15600, status: 'ok', timestamp: '2025-01-28T14:32:40Z', spans: 24 }
];

const METRIC_STATUS_CONFIG = {
  healthy: { color: 'success', icon: CheckCircle },
  warning: { color: 'warning', icon: AlertTriangle },
  critical: { color: 'danger', icon: XCircle }
};

const ALERT_SEVERITY_CONFIG = {
  critical: { color: 'danger', icon: XCircle },
  warning: { color: 'warning', icon: AlertTriangle },
  info: { color: 'info', icon: Bell }
};

const ALERT_STATUS_CONFIG = {
  firing: { color: 'danger', label: 'Firing' },
  resolved: { color: 'success', label: 'Resolved' },
  silenced: { color: 'muted', label: 'Silenced' }
};

const SERVICE_STATUS_CONFIG = {
  healthy: { color: 'success', icon: CheckCircle, label: 'Healthy' },
  degraded: { color: 'warning', icon: AlertTriangle, label: 'Degraded' },
  unhealthy: { color: 'danger', icon: XCircle, label: 'Unhealthy' }
};

const LOG_LEVEL_CONFIG = {
  error: { color: 'danger' },
  warn: { color: 'warning' },
  info: { color: 'info' },
  debug: { color: 'muted' }
};

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'services' | 'logs' | 'traces'>('overview');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1h');

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const firingAlerts = ALERTS.filter(a => a.status === 'firing').length;
  const criticalAlerts = ALERTS.filter(a => a.severity === 'critical' && a.status === 'firing').length;
  const healthyServices = SERVICES.filter(s => s.status === 'healthy').length;

  return (
    <div className="observability">
      <div className="observability__header">
        <div className="observability__title-section">
          <div className="observability__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>Observability Dashboard</h1>
            <p>Metrics, logs, traces, and alerts in one place</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Widget
          </button>
        </div>
      </div>

      <div className="observability__stats">
        <div className="stat-card alerts-stat">
          <div className="stat-icon alerts">
            <Bell size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{firingAlerts}</span>
            <span className="stat-label">Active Alerts</span>
          </div>
          {criticalAlerts > 0 && (
            <span className="critical-badge">{criticalAlerts} critical</span>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon services">
            <Server size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyServices}/{SERVICES.length}</span>
            <span className="stat-label">Services Healthy</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon requests">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">15.4K</span>
            <span className="stat-label">Requests/sec</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency">
            <Timer size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">245ms</span>
            <span className="stat-label">P99 Latency</span>
          </div>
        </div>
      </div>

      <div className="observability__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={16} />
          Alerts
          {firingAlerts > 0 && <span className="tab-badge">{firingAlerts}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Layers size={16} />
          Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} />
          Logs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'traces' ? 'active' : ''}`}
          onClick={() => setActiveTab('traces')}
        >
          <Activity size={16} />
          Traces
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="metrics-grid">
            {METRICS.map(metric => {
              const StatusConfig = METRIC_STATUS_CONFIG[metric.status];
              const StatusIcon = StatusConfig.icon;
              const isUp = metric.changeType === 'increase';
              const isDown = metric.changeType === 'decrease';
              
              return (
                <div key={metric.id} className={`metric-card ${metric.status}`}>
                  <div className="metric-header">
                    <span className="metric-name">{metric.name}</span>
                    <span className={`metric-status ${StatusConfig.color}`}>
                      <StatusIcon size={14} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">{metric.value.toLocaleString()}</span>
                    <span className="metric-unit">{metric.unit}</span>
                  </div>
                  <div className="metric-change">
                    {isUp && <ArrowUp size={14} className="change-up" />}
                    {isDown && <ArrowDown size={14} className="change-down" />}
                    {metric.changeType === 'stable' && <Minus size={14} className="change-stable" />}
                    <span className={`change-value ${isUp ? 'up' : isDown ? 'down' : 'stable'}`}>
                      {Math.abs(metric.change)}{metric.unit === '%' ? 'pp' : metric.unit}
                    </span>
                  </div>
                  <div className="sparkline">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points={metric.sparkline.map((v, i) => {
                          const max = Math.max(...metric.sparkline);
                          const min = Math.min(...metric.sparkline);
                          const range = max - min || 1;
                          const x = (i / (metric.sparkline.length - 1)) * 100;
                          const y = 30 - ((v - min) / range) * 28;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overview-panels">
            <div className="panel recent-alerts">
              <div className="panel-header">
                <h3>Recent Alerts</h3>
                <button className="view-all-btn" onClick={() => setActiveTab('alerts')}>
                  View All <ChevronDown size={14} />
                </button>
              </div>
              <div className="alerts-list-compact">
                {ALERTS.filter(a => a.status === 'firing').slice(0, 4).map(alert => {
                  const SeverityConfig = ALERT_SEVERITY_CONFIG[alert.severity];
                  const SeverityIcon = SeverityConfig.icon;
                  
                  return (
                    <div key={alert.id} className={`alert-item-compact ${alert.severity}`}>
                      <span className={`alert-icon ${SeverityConfig.color}`}>
                        <SeverityIcon size={14} />
                      </span>
                      <div className="alert-content">
                        <span className="alert-title">{alert.title}</span>
                        <span className="alert-time">{formatDate(alert.startedAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel service-health">
              <div className="panel-header">
                <h3>Service Health</h3>
                <button className="view-all-btn" onClick={() => setActiveTab('services')}>
                  View All <ChevronDown size={14} />
                </button>
              </div>
              <div className="services-list-compact">
                {SERVICES.slice(0, 5).map(service => {
                  const StatusConfig = SERVICE_STATUS_CONFIG[service.status];
                  const StatusIcon = StatusConfig.icon;
                  
                  return (
                    <div key={service.id} className={`service-item-compact ${service.status}`}>
                      <span className={`service-status ${StatusConfig.color}`}>
                        <StatusIcon size={14} />
                      </span>
                      <span className="service-name">{service.name}</span>
                      <span className="service-latency">{service.latency}ms</span>
                      <span className="service-uptime">{service.uptime}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="alerts-section">
          <div className="section-header">
            <h3>Alerts ({ALERTS.filter(a => alertFilter === 'all' || a.status === alertFilter).length})</h3>
            <div className="section-filters">
              <select 
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="firing">Firing</option>
                <option value="resolved">Resolved</option>
                <option value="silenced">Silenced</option>
              </select>
            </div>
          </div>

          <div className="alerts-list">
            {ALERTS.filter(a => alertFilter === 'all' || a.status === alertFilter).map(alert => {
              const SeverityConfig = ALERT_SEVERITY_CONFIG[alert.severity];
              const SeverityIcon = SeverityConfig.icon;
              const StatusConfig = ALERT_STATUS_CONFIG[alert.status];
              
              return (
                <div key={alert.id} className={`alert-card ${alert.severity} ${alert.status}`}>
                  <div className="alert-main">
                    <div className={`alert-severity-icon ${SeverityConfig.color}`}>
                      <SeverityIcon size={20} />
                    </div>
                    <div className="alert-info">
                      <div className="alert-header">
                        <h4>{alert.title}</h4>
                        <span className={`status-badge ${StatusConfig.color}`}>
                          {StatusConfig.label}
                        </span>
                        <span className={`severity-badge ${SeverityConfig.color}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="alert-description">{alert.description}</p>
                      <div className="alert-meta">
                        <span><Clock size={12} /> Started {formatDate(alert.startedAt)}</span>
                        <span><Server size={12} /> {alert.source}</span>
                        {alert.resolvedAt && (
                          <span><CheckCircle size={12} /> Resolved {formatDate(alert.resolvedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="alert-actions">
                      {alert.status === 'firing' && (
                        <>
                          <button className="action-btn" title="Acknowledge">
                            <Eye size={14} />
                          </button>
                          <button className="action-btn" title="Silence">
                            <BellOff size={14} />
                          </button>
                        </>
                      )}
                      <button className="action-btn" title="View Details">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="alert-labels">
                    {Object.entries(alert.labels).map(([key, value]) => (
                      <span key={key} className="label-chip">{key}={value}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="services-section">
          <div className="section-header">
            <h3>Services ({SERVICES.length})</h3>
          </div>

          <div className="services-table">
            <div className="st-header">
              <span className="st-th">Service</span>
              <span className="st-th">Status</span>
              <span className="st-th">Uptime</span>
              <span className="st-th">Latency</span>
              <span className="st-th">Error Rate</span>
              <span className="st-th">Req/s</span>
              <span className="st-th">Instances</span>
              <span className="st-th">Actions</span>
            </div>
            <div className="st-body">
              {SERVICES.map(service => {
                const StatusConfig = SERVICE_STATUS_CONFIG[service.status];
                const StatusIcon = StatusConfig.icon;
                
                return (
                  <div key={service.id} className="st-row">
                    <span className="st-td name">
                      <Server size={14} className="service-icon" />
                      <code>{service.name}</code>
                    </span>
                    <span className="st-td status">
                      <span className={`status-chip ${StatusConfig.color}`}>
                        <StatusIcon size={12} />
                        {StatusConfig.label}
                      </span>
                    </span>
                    <span className={`st-td uptime ${service.uptime < 99.9 ? 'warning' : ''}`}>
                      {service.uptime}%
                    </span>
                    <span className={`st-td latency ${service.latency > 200 ? 'warning' : ''}`}>
                      {service.latency}ms
                    </span>
                    <span className={`st-td error-rate ${service.errorRate > 1 ? 'danger' : service.errorRate > 0.1 ? 'warning' : ''}`}>
                      {service.errorRate}%
                    </span>
                    <span className="st-td requests">{service.requestsPerSec.toLocaleString()}</span>
                    <span className="st-td instances">{service.instances}</span>
                    <span className="st-td actions">
                      <button className="action-btn-sm" title="View Dashboard">
                        <BarChart3 size={12} />
                      </button>
                      <button className="action-btn-sm" title="View Logs">
                        <FileText size={12} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="logs-section">
          <div className="section-header">
            <h3>Logs</h3>
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search logs..." />
              </div>
              <select 
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>

          <div className="logs-table">
            {LOGS.filter(l => logLevel === 'all' || l.level === logLevel).map(log => {
              const LevelConfig = LOG_LEVEL_CONFIG[log.level];
              
              return (
                <div key={log.id} className={`log-row ${log.level}`}>
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                  <span className={`log-level ${LevelConfig.color}`}>{log.level.toUpperCase()}</span>
                  <span className="log-service">{log.service}</span>
                  <span className="log-message">{log.message}</span>
                  {log.traceId && (
                    <span className="log-trace">
                      <Activity size={12} />
                      {log.traceId.slice(0, 8)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'traces' && (
        <div className="traces-section">
          <div className="section-header">
            <h3>Distributed Traces</h3>
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search by trace ID..." />
              </div>
            </div>
          </div>

          <div className="traces-table">
            <div className="tt-header">
              <span className="tt-th">Trace ID</span>
              <span className="tt-th">Service</span>
              <span className="tt-th">Operation</span>
              <span className="tt-th">Duration</span>
              <span className="tt-th">Status</span>
              <span className="tt-th">Spans</span>
              <span className="tt-th">Time</span>
              <span className="tt-th">Actions</span>
            </div>
            <div className="tt-body">
              {TRACES.map(trace => (
                <div key={trace.id} className={`tt-row ${trace.status}`}>
                  <span className="tt-td trace-id">
                    <code>{trace.traceId}</code>
                  </span>
                  <span className="tt-td service">{trace.service}</span>
                  <span className="tt-td operation">{trace.operation}</span>
                  <span className={`tt-td duration ${trace.duration > 2000 ? 'slow' : ''}`}>
                    {trace.duration >= 1000 ? `${(trace.duration / 1000).toFixed(2)}s` : `${trace.duration}ms`}
                  </span>
                  <span className="tt-td status">
                    <span className={`status-chip ${trace.status === 'ok' ? 'success' : 'danger'}`}>
                      {trace.status === 'ok' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {trace.status}
                    </span>
                  </span>
                  <span className="tt-td spans">{trace.spans}</span>
                  <span className="tt-td time">{formatDate(trace.timestamp)}</span>
                  <span className="tt-td actions">
                    <button className="action-btn-sm" title="View Trace">
                      <Eye size={12} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FileText = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
    <line x1="10" x2="8" y1="9" y2="9"/>
  </svg>
);
