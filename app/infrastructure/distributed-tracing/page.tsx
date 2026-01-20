'use client';

import React, { useState } from 'react';
import { 
  GitBranch,
  Network,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Settings,
  Download,
  Zap,
  Database,
  Server,
  Globe,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Eye,
  Copy,
  Share2,
  MoreVertical,
  Calendar,
  Target,
  Activity,
  Timer,
  Layers,
  Box,
  ExternalLink,
  Tag,
  MapPin
} from 'lucide-react';
import './distributed-tracing.css';

interface Trace {
  id: string;
  traceId: string;
  name: string;
  service: string;
  duration: number;
  spanCount: number;
  status: 'success' | 'error' | 'timeout';
  startTime: string;
  endTime: string;
  tags: Record<string, string>;
  errorRate: number;
}

interface Span {
  id: string;
  name: string;
  service: string;
  duration: number;
  startOffset: number;
  status: 'success' | 'error' | 'timeout';
  parentId: string | null;
  children: string[];
  tags: Record<string, string>;
  logs: SpanLog[];
}

interface SpanLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface Service {
  id: string;
  name: string;
  type: 'api' | 'database' | 'cache' | 'queue' | 'external';
  requests: number;
  avgLatency: number;
  errorRate: number;
  p99Latency: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

interface ServiceEdge {
  source: string;
  target: string;
  requests: number;
  avgLatency: number;
  errorRate: number;
}

const TRACES: Trace[] = [
  {
    id: 'trace-1',
    traceId: 'abc123def456789',
    name: 'POST /api/v1/orders',
    service: 'api-gateway',
    duration: 245,
    spanCount: 12,
    status: 'success',
    startTime: '2025-01-27T14:32:15.123Z',
    endTime: '2025-01-27T14:32:15.368Z',
    tags: { 'http.method': 'POST', 'http.status_code': '201', 'user.id': 'usr_12345' },
    errorRate: 0
  },
  {
    id: 'trace-2',
    traceId: 'def789abc012345',
    name: 'GET /api/v1/products',
    service: 'api-gateway',
    duration: 89,
    spanCount: 6,
    status: 'success',
    startTime: '2025-01-27T14:32:14.856Z',
    endTime: '2025-01-27T14:32:14.945Z',
    tags: { 'http.method': 'GET', 'http.status_code': '200', 'cache.hit': 'true' },
    errorRate: 0
  },
  {
    id: 'trace-3',
    traceId: 'ghi456jkl789012',
    name: 'POST /api/v1/payments',
    service: 'api-gateway',
    duration: 1250,
    spanCount: 18,
    status: 'error',
    startTime: '2025-01-27T14:32:13.234Z',
    endTime: '2025-01-27T14:32:14.484Z',
    tags: { 'http.method': 'POST', 'http.status_code': '500', 'error': 'true' },
    errorRate: 100
  },
  {
    id: 'trace-4',
    traceId: 'mno345pqr678901',
    name: 'GET /api/v1/users/:id',
    service: 'api-gateway',
    duration: 156,
    spanCount: 8,
    status: 'success',
    startTime: '2025-01-27T14:32:12.789Z',
    endTime: '2025-01-27T14:32:12.945Z',
    tags: { 'http.method': 'GET', 'http.status_code': '200' },
    errorRate: 0
  },
  {
    id: 'trace-5',
    traceId: 'stu234vwx567890',
    name: 'POST /api/v1/auth/login',
    service: 'auth-service',
    duration: 2100,
    spanCount: 5,
    status: 'timeout',
    startTime: '2025-01-27T14:32:11.123Z',
    endTime: '2025-01-27T14:32:13.223Z',
    tags: { 'http.method': 'POST', 'timeout': 'true' },
    errorRate: 100
  },
  {
    id: 'trace-6',
    traceId: 'yza890bcd123456',
    name: 'PUT /api/v1/inventory',
    service: 'api-gateway',
    duration: 312,
    spanCount: 14,
    status: 'success',
    startTime: '2025-01-27T14:32:10.456Z',
    endTime: '2025-01-27T14:32:10.768Z',
    tags: { 'http.method': 'PUT', 'http.status_code': '200' },
    errorRate: 0
  }
];

const SELECTED_TRACE_SPANS: Span[] = [
  {
    id: 'span-1',
    name: 'POST /api/v1/orders',
    service: 'api-gateway',
    duration: 245,
    startOffset: 0,
    status: 'success',
    parentId: null,
    children: ['span-2', 'span-8'],
    tags: { 'http.method': 'POST', 'http.url': '/api/v1/orders' },
    logs: []
  },
  {
    id: 'span-2',
    name: 'validateToken',
    service: 'auth-service',
    duration: 25,
    startOffset: 5,
    status: 'success',
    parentId: 'span-1',
    children: ['span-3'],
    tags: { 'token.type': 'jwt' },
    logs: []
  },
  {
    id: 'span-3',
    name: 'Redis GET',
    service: 'redis-cache',
    duration: 3,
    startOffset: 8,
    status: 'success',
    parentId: 'span-2',
    children: [],
    tags: { 'cache.hit': 'true' },
    logs: []
  },
  {
    id: 'span-4',
    name: 'createOrder',
    service: 'order-service',
    duration: 120,
    startOffset: 35,
    status: 'success',
    parentId: 'span-1',
    children: ['span-5', 'span-6', 'span-7'],
    tags: { 'order.id': 'ord_789456' },
    logs: [
      { timestamp: '14:32:15.045', level: 'info', message: 'Order created successfully' }
    ]
  },
  {
    id: 'span-5',
    name: 'PostgreSQL INSERT',
    service: 'postgres-primary',
    duration: 45,
    startOffset: 40,
    status: 'success',
    parentId: 'span-4',
    children: [],
    tags: { 'db.statement': 'INSERT INTO orders...' },
    logs: []
  },
  {
    id: 'span-6',
    name: 'Redis SET',
    service: 'redis-cache',
    duration: 5,
    startOffset: 90,
    status: 'success',
    parentId: 'span-4',
    children: [],
    tags: { 'cache.key': 'order:789456' },
    logs: []
  },
  {
    id: 'span-7',
    name: 'RabbitMQ publish',
    service: 'rabbitmq',
    duration: 8,
    startOffset: 100,
    status: 'success',
    parentId: 'span-4',
    children: [],
    tags: { 'queue': 'order-events' },
    logs: []
  },
  {
    id: 'span-8',
    name: 'sendConfirmation',
    service: 'notification-service',
    duration: 85,
    startOffset: 160,
    status: 'success',
    parentId: 'span-1',
    children: ['span-9'],
    tags: { 'notification.type': 'email' },
    logs: []
  },
  {
    id: 'span-9',
    name: 'HTTP POST smtp.sendgrid.com',
    service: 'external-api',
    duration: 65,
    startOffset: 170,
    status: 'success',
    parentId: 'span-8',
    children: [],
    tags: { 'http.host': 'smtp.sendgrid.com' },
    logs: []
  }
];

const SERVICES: Service[] = [
  {
    id: 'svc-1',
    name: 'api-gateway',
    type: 'api',
    requests: 125450,
    avgLatency: 45,
    errorRate: 0.8,
    p99Latency: 245,
    status: 'healthy'
  },
  {
    id: 'svc-2',
    name: 'order-service',
    type: 'api',
    requests: 45890,
    avgLatency: 78,
    errorRate: 1.2,
    p99Latency: 320,
    status: 'healthy'
  },
  {
    id: 'svc-3',
    name: 'payment-service',
    type: 'api',
    requests: 28450,
    avgLatency: 156,
    errorRate: 3.8,
    p99Latency: 890,
    status: 'degraded'
  },
  {
    id: 'svc-4',
    name: 'auth-service',
    type: 'api',
    requests: 89560,
    avgLatency: 32,
    errorRate: 0.2,
    p99Latency: 125,
    status: 'healthy'
  },
  {
    id: 'svc-5',
    name: 'postgres-primary',
    type: 'database',
    requests: 458900,
    avgLatency: 12,
    errorRate: 0.05,
    p99Latency: 45,
    status: 'healthy'
  },
  {
    id: 'svc-6',
    name: 'redis-cache',
    type: 'cache',
    requests: 890450,
    avgLatency: 2,
    errorRate: 0.01,
    p99Latency: 8,
    status: 'healthy'
  },
  {
    id: 'svc-7',
    name: 'rabbitmq',
    type: 'queue',
    requests: 156780,
    avgLatency: 5,
    errorRate: 0.1,
    p99Latency: 25,
    status: 'healthy'
  },
  {
    id: 'svc-8',
    name: 'external-payments',
    type: 'external',
    requests: 28450,
    avgLatency: 350,
    errorRate: 2.5,
    p99Latency: 1200,
    status: 'degraded'
  }
];

const SERVICE_EDGES: ServiceEdge[] = [
  { source: 'api-gateway', target: 'order-service', requests: 45890, avgLatency: 25, errorRate: 0.5 },
  { source: 'api-gateway', target: 'auth-service', requests: 89560, avgLatency: 15, errorRate: 0.1 },
  { source: 'api-gateway', target: 'payment-service', requests: 28450, avgLatency: 45, errorRate: 2.1 },
  { source: 'order-service', target: 'postgres-primary', requests: 125890, avgLatency: 8, errorRate: 0.02 },
  { source: 'order-service', target: 'redis-cache', requests: 245670, avgLatency: 1, errorRate: 0.01 },
  { source: 'order-service', target: 'rabbitmq', requests: 45890, avgLatency: 3, errorRate: 0.05 },
  { source: 'payment-service', target: 'postgres-primary', requests: 56780, avgLatency: 10, errorRate: 0.03 },
  { source: 'payment-service', target: 'external-payments', requests: 28450, avgLatency: 280, errorRate: 2.5 },
  { source: 'auth-service', target: 'redis-cache', requests: 189450, avgLatency: 1, errorRate: 0.01 },
  { source: 'auth-service', target: 'postgres-primary', requests: 89560, avgLatency: 6, errorRate: 0.02 }
];

const SERVICE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  api: { icon: <Globe size={16} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  database: { icon: <Database size={16} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  cache: { icon: <Zap size={16} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  queue: { icon: <Layers size={16} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  external: { icon: <ExternalLink size={16} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }
};

export default function DistributedTracingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'traces' | 'services' | 'dependencies' | 'compare'>('overview');
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set(['span-1', 'span-4']));
  const [timeRange, setTimeRange] = useState('1h');

  const toggleSpan = (spanId: string) => {
    const newExpanded = new Set(expandedSpans);
    if (newExpanded.has(spanId)) {
      newExpanded.delete(spanId);
    } else {
      newExpanded.add(spanId);
    }
    setExpandedSpans(newExpanded);
  };

  const formatDuration = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalTraces = TRACES.length;
  const errorTraces = TRACES.filter(t => t.status === 'error' || t.status === 'timeout').length;
  const avgDuration = TRACES.reduce((sum, t) => sum + t.duration, 0) / TRACES.length;
  const totalServices = SERVICES.length;

  const renderSpanTree = (spans: Span[], parentId: string | null = null, depth: number = 0): React.ReactNode => {
    const rootSpans = spans.filter(s => s.parentId === parentId);
    const maxDuration = spans.find(s => s.parentId === null)?.duration || 1;

    return rootSpans.map(span => {
      const hasChildren = spans.some(s => s.parentId === span.id);
      const isExpanded = expandedSpans.has(span.id);
      const barWidth = (span.duration / maxDuration) * 100;
      const barOffset = (span.startOffset / maxDuration) * 100;

      return (
        <div key={span.id} className="span-item">
          <div className="span-row" style={{ paddingLeft: depth * 24 }}>
            <div className="span-toggle">
              {hasChildren && (
                <button onClick={() => toggleSpan(span.id)}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
            <div className="span-info">
              <span className="span-service" style={{ 
                color: SERVICE_TYPE_CONFIG[SERVICES.find(s => s.name === span.service)?.type || 'api']?.color 
              }}>
                {span.service}
              </span>
              <span className="span-name">{span.name}</span>
            </div>
            <div className="span-timeline">
              <div className="timeline-track">
                <div 
                  className={`timeline-bar ${span.status}`}
                  style={{ left: `${barOffset}%`, width: `${Math.max(barWidth, 2)}%` }}
                />
              </div>
            </div>
            <div className="span-duration">{formatDuration(span.duration)}</div>
            <div className={`span-status ${span.status}`}>
              {span.status === 'success' && <CheckCircle size={14} />}
              {span.status === 'error' && <XCircle size={14} />}
              {span.status === 'timeout' && <Clock size={14} />}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="span-children">
              {renderSpanTree(spans, span.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-metrics">
        <div className="metric-card large">
          <div className="metric-header">
            <h3>Trace Volume</h3>
            <div className="time-selector">
              {['15m', '1h', '6h', '24h'].map(t => (
                <button
                  key={t}
                  className={`time-btn ${timeRange === t ? 'active' : ''}`}
                  onClick={() => setTimeRange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="trace-volume-chart">
            <div className="volume-bars">
              {[45, 52, 48, 62, 58, 72, 68, 85, 78, 92, 88, 95].map((val, idx) => (
                <div 
                  key={idx}
                  className={`volume-bar ${idx === 11 ? 'active' : ''}`}
                  style={{ height: `${val}%` }}
                >
                  <span className="bar-value">{formatNumber(val * 100)}</span>
                </div>
              ))}
            </div>
            <div className="volume-labels">
              <span>-60m</span>
              <span>-45m</span>
              <span>-30m</span>
              <span>-15m</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Activity size={20} />
          </div>
          <div className="metric-value">
            <span className="value">{formatNumber(125450)}</span>
            <span className="unit">traces/h</span>
          </div>
          <div className="metric-trend positive">
            +12.5% vs last hour
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon error-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-value">
            <span className="value error">{(errorTraces / totalTraces * 100).toFixed(1)}%</span>
            <span className="unit">error rate</span>
          </div>
          <div className="metric-trend negative">
            +0.8% vs last hour
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon latency-icon">
            <Timer size={20} />
          </div>
          <div className="metric-value">
            <span className="value">{formatDuration(avgDuration)}</span>
            <span className="unit">avg latency</span>
          </div>
          <div className="metric-trend positive">
            -5.2% vs last hour
          </div>
        </div>
      </div>

      <div className="overview-panels">
        <div className="panel">
          <div className="panel-header">
            <h3>Recent Traces</h3>
            <button className="btn-outline small" onClick={() => setActiveTab('traces')}>
              View All
            </button>
          </div>
          <div className="traces-preview">
            {TRACES.slice(0, 4).map(trace => (
              <div 
                key={trace.id} 
                className={`trace-item ${trace.status}`}
                onClick={() => setSelectedTrace(trace)}
              >
                <div className="trace-status-icon">
                  {trace.status === 'success' && <CheckCircle size={16} />}
                  {trace.status === 'error' && <XCircle size={16} />}
                  {trace.status === 'timeout' && <Clock size={16} />}
                </div>
                <div className="trace-info">
                  <span className="trace-name">{trace.name}</span>
                  <span className="trace-service">{trace.service}</span>
                </div>
                <div className="trace-metrics">
                  <span className="trace-duration">{formatDuration(trace.duration)}</span>
                  <span className="trace-spans">{trace.spanCount} spans</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Slowest Endpoints</h3>
          </div>
          <div className="slow-endpoints">
            {[
              { name: 'POST /api/v1/payments', avg: 890, p99: 2450 },
              { name: 'GET /api/v1/reports/export', avg: 650, p99: 1850 },
              { name: 'POST /api/v1/orders', avg: 245, p99: 890 },
              { name: 'GET /api/v1/users/:id/history', avg: 189, p99: 560 }
            ].map((endpoint, idx) => (
              <div key={idx} className="endpoint-item">
                <div className="endpoint-rank">{idx + 1}</div>
                <div className="endpoint-info">
                  <span className="endpoint-name">{endpoint.name}</span>
                  <div className="endpoint-metrics">
                    <span>Avg: {formatDuration(endpoint.avg)}</span>
                    <span>P99: {formatDuration(endpoint.p99)}</span>
                  </div>
                </div>
                <div className="endpoint-bar">
                  <div 
                    className="endpoint-bar-fill"
                    style={{ width: `${(endpoint.avg / 890) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overview-services">
        <div className="panel-header">
          <h3>Service Health</h3>
          <button className="btn-outline small" onClick={() => setActiveTab('services')}>
            View All
          </button>
        </div>
        <div className="services-grid">
          {SERVICES.slice(0, 6).map(service => (
            <div key={service.id} className={`service-mini ${service.status}`}>
              <div 
                className="service-icon"
                style={{ 
                  background: SERVICE_TYPE_CONFIG[service.type].bg,
                  color: SERVICE_TYPE_CONFIG[service.type].color
                }}
              >
                {SERVICE_TYPE_CONFIG[service.type].icon}
              </div>
              <div className="service-info">
                <span className="service-name">{service.name}</span>
                <div className="service-metrics">
                  <span>{formatDuration(service.avgLatency)} avg</span>
                  <span className={service.errorRate > 1 ? 'error' : ''}>{service.errorRate}% err</span>
                </div>
              </div>
              <div className={`service-status-dot ${service.status}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTraces = () => (
    <div className="traces-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box large">
            <Search size={16} />
            <input type="text" placeholder="Search traces by ID, service, or operation..." />
          </div>
          <select>
            <option>All Services</option>
            {SERVICES.map(s => (
              <option key={s.id}>{s.name}</option>
            ))}
          </select>
          <select>
            <option>All Status</option>
            <option>Success</option>
            <option>Error</option>
            <option>Timeout</option>
          </select>
          <select>
            <option>Duration: All</option>
            <option>&gt; 100ms</option>
            <option>&gt; 500ms</option>
            <option>&gt; 1s</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="traces-table-container">
        <table className="traces-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Trace ID</th>
              <th>Operation</th>
              <th>Service</th>
              <th>Duration</th>
              <th>Spans</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {TRACES.map(trace => (
              <tr 
                key={trace.id}
                className={`trace-row ${trace.status}`}
                onClick={() => setSelectedTrace(trace)}
              >
                <td className="col-status">
                  <div className={`status-indicator ${trace.status}`}>
                    {trace.status === 'success' && <CheckCircle size={16} />}
                    {trace.status === 'error' && <XCircle size={16} />}
                    {trace.status === 'timeout' && <Clock size={16} />}
                  </div>
                </td>
                <td className="col-trace-id">
                  <code>{trace.traceId.substring(0, 12)}...</code>
                </td>
                <td className="col-operation">{trace.name}</td>
                <td className="col-service">{trace.service}</td>
                <td className="col-duration">
                  <span className={trace.duration > 500 ? 'slow' : ''}>{formatDuration(trace.duration)}</span>
                </td>
                <td className="col-spans">{trace.spanCount}</td>
                <td className="col-time">{new Date(trace.startTime).toLocaleTimeString()}</td>
                <td className="col-actions">
                  <button className="btn-icon" title="View">
                    <Eye size={14} />
                  </button>
                  <button className="btn-icon" title="Copy ID">
                    <Copy size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTrace && (
        <div className="trace-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className={`status-indicator large ${selectedTrace.status}`}>
                {selectedTrace.status === 'success' && <CheckCircle size={20} />}
                {selectedTrace.status === 'error' && <XCircle size={20} />}
                {selectedTrace.status === 'timeout' && <Clock size={20} />}
              </div>
              <div>
                <h3>{selectedTrace.name}</h3>
                <span className="panel-subtitle">{selectedTrace.traceId}</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedTrace(null)}>×</button>
          </div>
          <div className="panel-content">
            <div className="panel-section">
              <h4>Overview</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{formatDuration(selectedTrace.duration)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Spans</span>
                  <span className="detail-value">{selectedTrace.spanCount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service</span>
                  <span className="detail-value">{selectedTrace.service}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value status ${selectedTrace.status}`}>{selectedTrace.status}</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Span Timeline</h4>
              <div className="spans-tree">
                {renderSpanTree(SELECTED_TRACE_SPANS)}
              </div>
            </div>

            <div className="panel-section">
              <h4>Tags</h4>
              <div className="tags-list">
                {Object.entries(selectedTrace.tags).map(([key, val]) => (
                  <div key={key} className="tag-item">
                    <span className="tag-key">{key}</span>
                    <span className="tag-value">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Share2 size={16} />
                Share Trace
              </button>
              <button className="btn-outline">
                <Download size={16} />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderServices = () => (
    <div className="services-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search services..." />
          </div>
          <select>
            <option>All Types</option>
            <option>API</option>
            <option>Database</option>
            <option>Cache</option>
            <option>Queue</option>
            <option>External</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="service-cards">
        {SERVICES.map(service => (
          <div key={service.id} className={`service-card ${service.status}`}>
            <div className="service-card-header">
              <div 
                className="service-type-icon"
                style={{ 
                  background: SERVICE_TYPE_CONFIG[service.type].bg,
                  color: SERVICE_TYPE_CONFIG[service.type].color
                }}
              >
                {SERVICE_TYPE_CONFIG[service.type].icon}
              </div>
              <div className={`status-badge ${service.status}`}>
                {service.status === 'healthy' && <><CheckCircle size={12} /> Healthy</>}
                {service.status === 'degraded' && <><AlertTriangle size={12} /> Degraded</>}
                {service.status === 'unhealthy' && <><XCircle size={12} /> Unhealthy</>}
              </div>
            </div>
            <h4>{service.name}</h4>
            <p className="service-type-label">{service.type.toUpperCase()}</p>
            <div className="service-metrics">
              <div className="metric-row">
                <span className="metric-label">Requests</span>
                <span className="metric-value">{formatNumber(service.requests)}/h</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Avg Latency</span>
                <span className="metric-value">{formatDuration(service.avgLatency)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">P99 Latency</span>
                <span className="metric-value">{formatDuration(service.p99Latency)}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Error Rate</span>
                <span className={`metric-value ${service.errorRate > 1 ? 'error' : ''}`}>{service.errorRate}%</span>
              </div>
            </div>
            <div className="service-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                View Traces
              </button>
              <button className="btn-outline small">
                <Activity size={14} />
                Metrics
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDependencies = () => (
    <div className="dependencies-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <select>
            <option>All Services</option>
            {SERVICES.map(s => (
              <option key={s.id}>{s.name}</option>
            ))}
          </select>
          <select>
            <option>Last 1 hour</option>
            <option>Last 6 hours</option>
            <option>Last 24 hours</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Graph
          </button>
        </div>
      </div>

      <div className="dependency-graph">
        <div className="graph-placeholder">
          <Network size={64} />
          <h3>Service Dependency Graph</h3>
          <p>Interactive visualization of service connections and traffic flow</p>
        </div>
      </div>

      <div className="dependency-table">
        <h3>Service Connections</h3>
        <table className="connections-table">
          <thead>
            <tr>
              <th>Source</th>
              <th></th>
              <th>Target</th>
              <th>Requests/h</th>
              <th>Avg Latency</th>
              <th>Error Rate</th>
            </tr>
          </thead>
          <tbody>
            {SERVICE_EDGES.map((edge, idx) => (
              <tr key={idx}>
                <td className="col-source">
                  <div className="service-badge">
                    {SERVICE_TYPE_CONFIG[SERVICES.find(s => s.name === edge.source)?.type || 'api']?.icon}
                    {edge.source}
                  </div>
                </td>
                <td className="col-arrow">
                  <ArrowRight size={16} />
                </td>
                <td className="col-target">
                  <div className="service-badge">
                    {SERVICE_TYPE_CONFIG[SERVICES.find(s => s.name === edge.target)?.type || 'api']?.icon}
                    {edge.target}
                  </div>
                </td>
                <td className="col-requests">{formatNumber(edge.requests)}</td>
                <td className="col-latency">{formatDuration(edge.avgLatency)}</td>
                <td className="col-error">
                  <span className={edge.errorRate > 1 ? 'error' : ''}>{edge.errorRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCompare = () => (
    <div className="compare-section">
      <div className="compare-header">
        <h3>Compare Traces</h3>
        <p>Compare two traces side-by-side to identify differences</p>
      </div>
      <div className="compare-selectors">
        <div className="trace-selector">
          <label>Trace A</label>
          <div className="selector-input">
            <Search size={16} />
            <input type="text" placeholder="Enter trace ID or search..." />
          </div>
        </div>
        <div className="compare-vs">VS</div>
        <div className="trace-selector">
          <label>Trace B</label>
          <div className="selector-input">
            <Search size={16} />
            <input type="text" placeholder="Enter trace ID or search..." />
          </div>
        </div>
        <button className="btn-primary">
          <Target size={16} />
          Compare
        </button>
      </div>
      <div className="compare-placeholder">
        <GitBranch size={64} />
        <p>Select two traces to compare their spans and timing</p>
      </div>
    </div>
  );

  return (
    <div className="distributed-tracing">
      <header className="dt__header">
        <div className="dt__title-section">
          <div className="dt__icon">
            <GitBranch size={28} />
          </div>
          <div>
            <h1>Distributed Tracing</h1>
            <p>Track requests across services and identify bottlenecks</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Calendar size={16} />
            Last 1 Hour
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Search size={16} />
            Find Trace
          </button>
        </div>
      </header>

      <div className="dt__stats">
        <div className="stat-card primary">
          <div className="stat-icon traces-icon">
            <GitBranch size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(125450)}</span>
            <span className="stat-label">Traces (1h)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon services-icon">
            <Server size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalServices}</span>
            <span className="stat-label">Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency-icon">
            <Timer size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatDuration(avgDuration)}</span>
            <span className="stat-label">Avg Duration</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon error-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className={`stat-value ${errorTraces > 0 ? 'error' : ''}`}>
              {((errorTraces / totalTraces) * 100).toFixed(1)}%
            </span>
            <span className="stat-label">Error Rate</span>
          </div>
        </div>
      </div>

      <div className="dt__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'traces' ? 'active' : ''}`}
          onClick={() => setActiveTab('traces')}
        >
          <GitBranch size={16} />
          Traces
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Server size={16} />
          Services
          <span className="tab-badge">{SERVICES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          <Network size={16} />
          Dependencies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <Target size={16} />
          Compare
        </button>
      </div>

      <div className="dt__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'traces' && renderTraces()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'dependencies' && renderDependencies()}
        {activeTab === 'compare' && renderCompare()}
      </div>
    </div>
  );
}
