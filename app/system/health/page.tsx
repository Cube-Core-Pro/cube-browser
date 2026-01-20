'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  BarChart3,
  ChevronRight,
  AlertCircle,
  Settings,
  Bell,
  Circle
} from 'lucide-react';
import './health.css';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  latency: number;
  uptime: number;
  lastCheck: string;
  region?: string;
  description?: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startedAt: string;
  updatedAt: string;
  affectedServices: string[];
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  time: string;
  status: string;
  message: string;
}

interface MetricData {
  time: string;
  value: number;
}

const services: ServiceStatus[] = [
  { name: 'API Gateway', status: 'operational', latency: 45, uptime: 99.99, lastCheck: '30s ago', region: 'Global', description: 'Main API endpoint' },
  { name: 'Web Application', status: 'operational', latency: 120, uptime: 99.98, lastCheck: '30s ago', region: 'Global', description: 'Dashboard and UI' },
  { name: 'Database Cluster', status: 'operational', latency: 12, uptime: 99.99, lastCheck: '30s ago', region: 'US-East', description: 'Primary data storage' },
  { name: 'Authentication', status: 'operational', latency: 67, uptime: 99.97, lastCheck: '30s ago', region: 'Global', description: 'OAuth and SSO' },
  { name: 'File Storage', status: 'degraded', latency: 234, uptime: 99.85, lastCheck: '30s ago', region: 'Multi-region', description: 'Media and documents' },
  { name: 'Email Service', status: 'operational', latency: 890, uptime: 99.92, lastCheck: '30s ago', region: 'Global', description: 'Transactional emails' },
  { name: 'Webhook Delivery', status: 'operational', latency: 156, uptime: 99.94, lastCheck: '30s ago', region: 'Global', description: 'Event notifications' },
  { name: 'AI Processing', status: 'operational', latency: 2340, uptime: 99.89, lastCheck: '30s ago', region: 'US-West', description: 'ML inference' },
  { name: 'Search Index', status: 'maintenance', latency: 0, uptime: 99.95, lastCheck: '30s ago', region: 'Global', description: 'Full-text search' },
  { name: 'CDN', status: 'operational', latency: 23, uptime: 99.99, lastCheck: '30s ago', region: 'Global', description: 'Static assets' }
];

const incidents: Incident[] = [
  {
    id: '1',
    title: 'File Storage Performance Degradation',
    status: 'monitoring',
    severity: 'minor',
    startedAt: '2025-01-28 14:23 UTC',
    updatedAt: '15 minutes ago',
    affectedServices: ['File Storage'],
    updates: [
      { time: '15 min ago', status: 'Monitoring', message: 'Performance has improved. Continuing to monitor.' },
      { time: '45 min ago', status: 'Identified', message: 'Identified high I/O load on storage nodes.' },
      { time: '1 hour ago', status: 'Investigating', message: 'We are investigating reports of slow file uploads.' }
    ]
  },
  {
    id: '2',
    title: 'Search Index Scheduled Maintenance',
    status: 'monitoring',
    severity: 'minor',
    startedAt: '2025-01-28 15:00 UTC',
    updatedAt: '5 minutes ago',
    affectedServices: ['Search Index'],
    updates: [
      { time: '5 min ago', status: 'In Progress', message: 'Maintenance in progress. Expected completion: 16:00 UTC' },
      { time: '30 min ago', status: 'Started', message: 'Scheduled maintenance has begun.' }
    ]
  }
];

const latencyHistory: MetricData[] = [
  { time: '00:00', value: 45 },
  { time: '04:00', value: 42 },
  { time: '08:00', value: 67 },
  { time: '12:00', value: 89 },
  { time: '16:00', value: 78 },
  { time: '20:00', value: 52 },
  { time: 'Now', value: 45 }
];

export default function SystemHealthPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusCounts = () => {
    const counts = { operational: 0, degraded: 0, outage: 0, maintenance: 0 };
    services.forEach(s => counts[s.status]++);
    return counts;
  };

  const statusCounts = getStatusCounts();
  const overallStatus = statusCounts.outage > 0 ? 'outage' : 
                       statusCounts.degraded > 0 ? 'degraded' : 
                       statusCounts.maintenance > 0 ? 'partial' : 'operational';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle size={16} />;
      case 'degraded': return <AlertTriangle size={16} />;
      case 'outage': return <XCircle size={16} />;
      case 'maintenance': return <Settings size={16} />;
      default: return <Circle size={16} />;
    }
  };

  const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2);
  const avgLatency = Math.round(services.filter(s => s.latency > 0).reduce((sum, s) => sum + s.latency, 0) / services.filter(s => s.latency > 0).length);

  return (
    <div className="system-health">
      {/* Header */}
      <div className="system-health__header">
        <div className="system-health__title-section">
          <div className="system-health__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>System Health</h1>
            <p>Real-time status and performance monitoring</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-outline">
            <Bell size={18} />
            Subscribe
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`status-banner ${overallStatus}`}>
        <div className="status-indicator">
          {overallStatus === 'operational' ? <CheckCircle size={24} /> : 
           overallStatus === 'degraded' || overallStatus === 'partial' ? <AlertTriangle size={24} /> : 
           <XCircle size={24} />}
        </div>
        <div className="status-info">
          <h2>
            {overallStatus === 'operational' ? 'All Systems Operational' :
             overallStatus === 'degraded' ? 'Partial System Degradation' :
             overallStatus === 'partial' ? 'Some Systems Under Maintenance' :
             'Major System Outage'}
          </h2>
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="status-summary">
          <span className="summary-item operational">{statusCounts.operational} Operational</span>
          {statusCounts.degraded > 0 && <span className="summary-item degraded">{statusCounts.degraded} Degraded</span>}
          {statusCounts.maintenance > 0 && <span className="summary-item maintenance">{statusCounts.maintenance} Maintenance</span>}
          {statusCounts.outage > 0 && <span className="summary-item outage">{statusCounts.outage} Outage</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="system-health__stats">
        <div className="stat-card">
          <div className="stat-icon uptime">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgUptime}%</span>
            <span className="stat-label">Avg Uptime (30d)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgLatency}ms</span>
            <span className="stat-label">Avg Latency</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon services">
            <Server size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{services.length}</span>
            <span className="stat-label">Total Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon incidents">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{incidents.length}</span>
            <span className="stat-label">Active Incidents</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="health-grid">
        {/* Services List */}
        <div className="services-section">
          <div className="section-header">
            <h2>Services</h2>
            <div className="time-range-selector">
              {['1h', '24h', '7d', '30d'].map(range => (
                <button
                  key={range}
                  className={`range-btn ${selectedTimeRange === range ? 'active' : ''}`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="services-list">
            {services.map((service, idx) => (
              <div key={idx} className={`service-card ${service.status}`}>
                <div className="service-status">
                  <span className={`status-dot ${service.status}`}></span>
                </div>
                <div className="service-info">
                  <div className="service-header">
                    <h3>{service.name}</h3>
                    <span className={`status-badge ${service.status}`}>
                      {getStatusIcon(service.status)}
                      {service.status}
                    </span>
                  </div>
                  <p className="service-description">{service.description}</p>
                  <div className="service-metrics">
                    <span className="metric">
                      <Clock size={12} />
                      {service.latency > 0 ? `${service.latency}ms` : 'N/A'}
                    </span>
                    <span className="metric">
                      <TrendingUp size={12} />
                      {service.uptime}%
                    </span>
                    <span className="metric">
                      <Globe size={12} />
                      {service.region}
                    </span>
                  </div>
                </div>
                <div className="service-uptime-bar">
                  <div className="uptime-bar">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`uptime-segment ${i >= 28 && service.status !== 'operational' ? service.status : 'operational'}`}
                        title={`Day ${i + 1}`}
                      ></div>
                    ))}
                  </div>
                  <span className="uptime-label">{service.uptime}% uptime</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="health-sidebar">
          {/* Active Incidents */}
          <div className="incidents-section">
            <div className="section-header">
              <h2>Active Incidents</h2>
              <span className="incident-count">{incidents.length}</span>
            </div>
            
            {incidents.length > 0 ? (
              <div className="incidents-list">
                {incidents.map(incident => (
                  <div 
                    key={incident.id} 
                    className={`incident-card ${incident.severity}`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="incident-header">
                      <span className={`severity-badge ${incident.severity}`}>
                        {incident.severity}
                      </span>
                      <span className={`status-tag ${incident.status}`}>
                        {incident.status}
                      </span>
                    </div>
                    <h3>{incident.title}</h3>
                    <div className="incident-meta">
                      <span>Started: {incident.startedAt}</span>
                      <span>Updated: {incident.updatedAt}</span>
                    </div>
                    <div className="affected-services">
                      {incident.affectedServices.map((s, i) => (
                        <span key={i} className="affected-tag">{s}</span>
                      ))}
                    </div>
                    <ChevronRight size={16} className="chevron" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-incidents">
                <CheckCircle size={32} />
                <p>No active incidents</p>
              </div>
            )}
          </div>

          {/* Latency Chart */}
          <div className="latency-chart-section">
            <div className="section-header">
              <h2>API Latency</h2>
            </div>
            <div className="latency-chart">
              <div className="chart-area">
                {latencyHistory.map((point, idx) => (
                  <div key={idx} className="chart-point-container">
                    <div 
                      className="chart-bar"
                      style={{ height: `${(point.value / 100) * 100}%` }}
                    >
                      <span className="chart-tooltip">{point.value}ms</span>
                    </div>
                    <span className="chart-label">{point.time}</span>
                  </div>
                ))}
              </div>
              <div className="chart-summary">
                <div className="summary-stat">
                  <span className="label">P50</span>
                  <span className="value">45ms</span>
                </div>
                <div className="summary-stat">
                  <span className="label">P95</span>
                  <span className="value">89ms</span>
                </div>
                <div className="summary-stat">
                  <span className="label">P99</span>
                  <span className="value">156ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div className="updates-section">
            <div className="section-header">
              <h2>Recent Updates</h2>
            </div>
            <div className="updates-list">
              <div className="update-item">
                <span className="update-time">15 min ago</span>
                <span className="update-text">File Storage performance improving</span>
              </div>
              <div className="update-item">
                <span className="update-time">30 min ago</span>
                <span className="update-text">Search Index maintenance started</span>
              </div>
              <div className="update-item">
                <span className="update-time">2 hours ago</span>
                <span className="update-text">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal incident-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className={`severity-badge ${selectedIncident.severity}`}>
                  {selectedIncident.severity}
                </span>
                <h2>{selectedIncident.title}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedIncident(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="incident-info">
                <div className="info-row">
                  <span className="label">Status</span>
                  <span className={`status-tag ${selectedIncident.status}`}>{selectedIncident.status}</span>
                </div>
                <div className="info-row">
                  <span className="label">Started</span>
                  <span>{selectedIncident.startedAt}</span>
                </div>
                <div className="info-row">
                  <span className="label">Affected Services</span>
                  <div className="affected-list">
                    {selectedIncident.affectedServices.map((s, i) => (
                      <span key={i} className="affected-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="incident-timeline">
                <h3>Timeline</h3>
                {selectedIncident.updates.map((update, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-marker">
                      <div className="marker-dot"></div>
                      {idx < selectedIncident.updates.length - 1 && <div className="marker-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="update-status">{update.status}</span>
                        <span className="update-time">{update.time}</span>
                      </div>
                      <p className="update-message">{update.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setSelectedIncident(null)}>
                Close
              </button>
              <button className="btn-primary">
                <Bell size={16} />
                Subscribe to Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
