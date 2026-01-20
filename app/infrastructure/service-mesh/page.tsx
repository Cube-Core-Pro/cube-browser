'use client';

import React, { useState } from 'react';
import {
  Network,
  Server,
  Globe,
  Activity,
  Shield,
  Clock,
  RefreshCw,
  Settings,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Layers,
  GitBranch,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Cpu,
  Zap,
  Lock,
  Unlock,
  ArrowRight,
  ArrowLeftRight,
  Radio,
  Wifi,
  Link2,
  Unlink,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import './service-mesh.css';

interface Service {
  id: string;
  name: string;
  namespace: string;
  version: string;
  replicas: { ready: number; total: number };
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  protocol: 'HTTP' | 'gRPC' | 'TCP';
  mtls: boolean;
  ingressRate: number;
  egressRate: number;
  errorRate: number;
  p99Latency: number;
  cpu: number;
  memory: number;
}

interface TrafficPolicy {
  id: string;
  name: string;
  type: 'load-balancer' | 'circuit-breaker' | 'retry' | 'timeout' | 'rate-limit';
  target: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, string | number>;
}

interface ServiceConnection {
  source: string;
  destination: string;
  requestsPerSecond: number;
  errorRate: number;
  latency: number;
  encrypted: boolean;
}

interface GatewayConfig {
  id: string;
  name: string;
  type: 'ingress' | 'egress';
  hosts: string[];
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP';
  status: 'active' | 'inactive';
  tlsMode: 'SIMPLE' | 'MUTUAL' | 'PASSTHROUGH' | 'DISABLED';
}

const SERVICES: Service[] = [
  {
    id: '1',
    name: 'api-gateway',
    namespace: 'production',
    version: 'v2.3.1',
    replicas: { ready: 5, total: 5 },
    status: 'healthy',
    protocol: 'HTTP',
    mtls: true,
    ingressRate: 12456,
    egressRate: 34567,
    errorRate: 0.02,
    p99Latency: 45,
    cpu: 35,
    memory: 512
  },
  {
    id: '2',
    name: 'user-service',
    namespace: 'production',
    version: 'v1.8.4',
    replicas: { ready: 3, total: 3 },
    status: 'healthy',
    protocol: 'gRPC',
    mtls: true,
    ingressRate: 8923,
    egressRate: 4567,
    errorRate: 0.01,
    p99Latency: 23,
    cpu: 28,
    memory: 384
  },
  {
    id: '3',
    name: 'order-service',
    namespace: 'production',
    version: 'v3.1.0',
    replicas: { ready: 4, total: 4 },
    status: 'healthy',
    protocol: 'gRPC',
    mtls: true,
    ingressRate: 5678,
    egressRate: 12345,
    errorRate: 0.08,
    p99Latency: 89,
    cpu: 52,
    memory: 640
  },
  {
    id: '4',
    name: 'payment-service',
    namespace: 'production',
    version: 'v2.0.5',
    replicas: { ready: 2, total: 3 },
    status: 'degraded',
    protocol: 'HTTP',
    mtls: true,
    ingressRate: 2345,
    egressRate: 1234,
    errorRate: 1.2,
    p99Latency: 234,
    cpu: 78,
    memory: 890
  },
  {
    id: '5',
    name: 'notification-service',
    namespace: 'production',
    version: 'v1.2.0',
    replicas: { ready: 2, total: 2 },
    status: 'healthy',
    protocol: 'HTTP',
    mtls: true,
    ingressRate: 1234,
    egressRate: 5678,
    errorRate: 0.05,
    p99Latency: 56,
    cpu: 22,
    memory: 256
  },
  {
    id: '6',
    name: 'inventory-service',
    namespace: 'production',
    version: 'v1.5.2',
    replicas: { ready: 0, total: 2 },
    status: 'unhealthy',
    protocol: 'gRPC',
    mtls: false,
    ingressRate: 0,
    egressRate: 0,
    errorRate: 100,
    p99Latency: 0,
    cpu: 0,
    memory: 0
  }
];

const TRAFFIC_POLICIES: TrafficPolicy[] = [
  {
    id: '1',
    name: 'api-gateway-lb',
    type: 'load-balancer',
    target: 'api-gateway',
    status: 'active',
    config: { algorithm: 'round-robin', healthCheck: 'enabled' }
  },
  {
    id: '2',
    name: 'payment-circuit-breaker',
    type: 'circuit-breaker',
    target: 'payment-service',
    status: 'active',
    config: { threshold: 5, timeout: 30, halfOpenRequests: 3 }
  },
  {
    id: '3',
    name: 'order-retry-policy',
    type: 'retry',
    target: 'order-service',
    status: 'active',
    config: { attempts: 3, perTryTimeout: '5s', retryOn: '5xx,reset' }
  },
  {
    id: '4',
    name: 'user-service-timeout',
    type: 'timeout',
    target: 'user-service',
    status: 'active',
    config: { timeout: '10s', idleTimeout: '60s' }
  },
  {
    id: '5',
    name: 'api-rate-limit',
    type: 'rate-limit',
    target: 'api-gateway',
    status: 'active',
    config: { requestsPerUnit: 1000, unit: 'minute' }
  }
];

const SERVICE_CONNECTIONS: ServiceConnection[] = [
  { source: 'api-gateway', destination: 'user-service', requestsPerSecond: 2500, errorRate: 0.01, latency: 23, encrypted: true },
  { source: 'api-gateway', destination: 'order-service', requestsPerSecond: 1800, errorRate: 0.08, latency: 89, encrypted: true },
  { source: 'api-gateway', destination: 'payment-service', requestsPerSecond: 1200, errorRate: 1.2, latency: 234, encrypted: true },
  { source: 'order-service', destination: 'inventory-service', requestsPerSecond: 0, errorRate: 100, latency: 0, encrypted: false },
  { source: 'order-service', destination: 'payment-service', requestsPerSecond: 800, errorRate: 1.5, latency: 256, encrypted: true },
  { source: 'payment-service', destination: 'notification-service', requestsPerSecond: 400, errorRate: 0.05, latency: 45, encrypted: true }
];

const GATEWAYS: GatewayConfig[] = [
  { id: '1', name: 'main-ingress', type: 'ingress', hosts: ['api.cube-elite.com', 'www.cube-elite.com'], port: 443, protocol: 'HTTPS', status: 'active', tlsMode: 'SIMPLE' },
  { id: '2', name: 'admin-ingress', type: 'ingress', hosts: ['admin.cube-elite.com'], port: 443, protocol: 'HTTPS', status: 'active', tlsMode: 'MUTUAL' },
  { id: '3', name: 'external-egress', type: 'egress', hosts: ['*.stripe.com', '*.twilio.com'], port: 443, protocol: 'HTTPS', status: 'active', tlsMode: 'SIMPLE' }
];

const STATUS_CONFIG = {
  healthy: { color: 'success', label: 'Healthy', icon: CheckCircle },
  degraded: { color: 'warning', label: 'Degraded', icon: AlertTriangle },
  unhealthy: { color: 'danger', label: 'Unhealthy', icon: XCircle },
  unknown: { color: 'muted', label: 'Unknown', icon: AlertTriangle }
};

const POLICY_TYPE_CONFIG = {
  'load-balancer': { color: 'info', label: 'Load Balancer', icon: Layers },
  'circuit-breaker': { color: 'danger', label: 'Circuit Breaker', icon: Zap },
  'retry': { color: 'warning', label: 'Retry', icon: RotateCcw },
  'timeout': { color: 'purple', label: 'Timeout', icon: Clock },
  'rate-limit': { color: 'cyan', label: 'Rate Limit', icon: Activity }
};

export default function ServiceMeshPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'topology' | 'policies' | 'gateways'>('services');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [filterNamespace, setFilterNamespace] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const healthyServices = SERVICES.filter(s => s.status === 'healthy').length;
  const totalReplicas = SERVICES.reduce((acc, s) => acc + s.replicas.ready, 0);
  const avgErrorRate = (SERVICES.filter(s => s.status !== 'unhealthy').reduce((acc, s) => acc + s.errorRate, 0) / SERVICES.filter(s => s.status !== 'unhealthy').length).toFixed(2);
  const mtlsEnabled = SERVICES.filter(s => s.mtls).length;

  const filteredServices = SERVICES.filter(s => {
    const matchesNamespace = filterNamespace === 'all' || s.namespace === filterNamespace;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesNamespace && matchesStatus;
  });

  const renderServices = () => (
    <div className="services-section">
      <div className="services-header">
        <div className="services-filters">
          <select value={filterNamespace} onChange={(e) => setFilterNamespace(e.target.value)}>
            <option value="all">All Namespaces</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="unhealthy">Unhealthy</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Add Service
        </button>
      </div>

      <div className="services-list">
        {filteredServices.map(service => {
          const statusConfig = STATUS_CONFIG[service.status];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedService === service.id;

          return (
            <div key={service.id} className={`service-card ${service.status}`}>
              <div className="service-main">
                <div className="service-status">
                  <div className={`status-indicator ${statusConfig.color}`}>
                    <StatusIcon size={18} />
                  </div>
                </div>

                <div className="service-info">
                  <div className="service-header">
                    <h4>{service.name}</h4>
                    <span className="version-badge">{service.version}</span>
                    <span className="protocol-badge">{service.protocol}</span>
                    {service.mtls && (
                      <span className="mtls-badge">
                        <Lock size={10} />
                        mTLS
                      </span>
                    )}
                  </div>
                  <div className="service-meta">
                    <span className="namespace">{service.namespace}</span>
                    <span className="replicas">
                      {service.replicas.ready}/{service.replicas.total} replicas
                    </span>
                  </div>
                </div>

                <div className="service-metrics">
                  <div className="svc-metric">
                    <span className="metric-value">{service.ingressRate.toLocaleString()}</span>
                    <span className="metric-label">req/s in</span>
                  </div>
                  <div className="svc-metric">
                    <span className="metric-value">{service.egressRate.toLocaleString()}</span>
                    <span className="metric-label">req/s out</span>
                  </div>
                  <div className="svc-metric">
                    <span className={`metric-value ${service.errorRate > 1 ? 'danger' : service.errorRate > 0.1 ? 'warning' : ''}`}>
                      {service.errorRate}%
                    </span>
                    <span className="metric-label">error rate</span>
                  </div>
                  <div className="svc-metric">
                    <span className={`metric-value ${service.p99Latency > 200 ? 'warning' : ''}`}>
                      {service.p99Latency}ms
                    </span>
                    <span className="metric-label">p99 latency</span>
                  </div>
                </div>

                <div className="service-actions">
                  <button className="action-btn" title="View Metrics">
                    <BarChart3 size={16} />
                  </button>
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedService(isExpanded ? null : service.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="service-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h5>Resource Usage</h5>
                      <div className="resource-bars">
                        <div className="resource-item">
                          <span className="resource-label">CPU</span>
                          <div className="resource-bar">
                            <div 
                              className={`resource-fill ${service.cpu > 80 ? 'danger' : service.cpu > 60 ? 'warning' : ''}`}
                              style={{ width: `${service.cpu}%` }}
                            />
                          </div>
                          <span className="resource-value">{service.cpu}%</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-label">Memory</span>
                          <div className="resource-bar">
                            <div 
                              className={`resource-fill ${service.memory > 800 ? 'danger' : service.memory > 600 ? 'warning' : ''}`}
                              style={{ width: `${(service.memory / 1024) * 100}%` }}
                            />
                          </div>
                          <span className="resource-value">{service.memory}MB</span>
                        </div>
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h5>Connected Services</h5>
                      <div className="connections-list">
                        {SERVICE_CONNECTIONS.filter(c => c.source === service.name || c.destination === service.name)
                          .slice(0, 3)
                          .map((conn, i) => (
                            <div key={i} className="connection-item">
                              <span className="conn-service">
                                {conn.source === service.name ? conn.destination : conn.source}
                              </span>
                              <span className="conn-direction">
                                {conn.source === service.name ? '→' : '←'}
                              </span>
                              <span className={`conn-rate ${conn.errorRate > 1 ? 'danger' : ''}`}>
                                {conn.requestsPerSecond} req/s
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <Eye size={14} />
                      View Logs
                    </button>
                    <button className="btn-sm">
                      <BarChart3 size={14} />
                      Metrics
                    </button>
                    <button className="btn-sm">
                      <Settings size={14} />
                      Configure
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

  const renderTopology = () => (
    <div className="topology-section">
      <div className="topology-header">
        <h3>Service Topology</h3>
        <div className="topology-controls">
          <button className="btn-sm active">
            <Network size={14} />
            Graph View
          </button>
          <button className="btn-sm">
            <Layers size={14} />
            List View
          </button>
        </div>
      </div>

      <div className="topology-graph">
        <div className="graph-placeholder">
          <Network size={80} />
          <p>Interactive service mesh topology visualization</p>
        </div>
      </div>

      <div className="connections-table">
        <h4>Service Connections</h4>
        <div className="ct-header">
          <span className="ct-th source">Source</span>
          <span className="ct-th"></span>
          <span className="ct-th destination">Destination</span>
          <span className="ct-th rate">Req/s</span>
          <span className="ct-th error">Error Rate</span>
          <span className="ct-th latency">Latency</span>
          <span className="ct-th encrypted">Encrypted</span>
        </div>
        <div className="ct-body">
          {SERVICE_CONNECTIONS.map((conn, i) => (
            <div key={i} className={`ct-row ${conn.errorRate > 1 ? 'error' : ''}`}>
              <span className="ct-td source">{conn.source}</span>
              <span className="ct-td arrow">
                <ArrowRight size={14} />
              </span>
              <span className="ct-td destination">{conn.destination}</span>
              <span className="ct-td rate">{conn.requestsPerSecond.toLocaleString()}</span>
              <span className={`ct-td error ${conn.errorRate > 1 ? 'danger' : conn.errorRate > 0.1 ? 'warning' : ''}`}>
                {conn.errorRate}%
              </span>
              <span className={`ct-td latency ${conn.latency > 200 ? 'warning' : ''}`}>
                {conn.latency}ms
              </span>
              <span className={`ct-td encrypted ${conn.encrypted ? 'yes' : 'no'}`}>
                {conn.encrypted ? <Lock size={14} /> : <Unlock size={14} />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="policies-section">
      <div className="policies-header">
        <h3>Traffic Policies</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Policy
        </button>
      </div>

      <div className="policies-grid">
        {TRAFFIC_POLICIES.map(policy => {
          const typeConfig = POLICY_TYPE_CONFIG[policy.type];
          const TypeIcon = typeConfig.icon;

          return (
            <div key={policy.id} className={`policy-card ${policy.status}`}>
              <div className="policy-header">
                <div className={`policy-icon ${typeConfig.color}`}>
                  <TypeIcon size={20} />
                </div>
                <div className="policy-info">
                  <h4>{policy.name}</h4>
                  <span className={`type-badge ${typeConfig.color}`}>{typeConfig.label}</span>
                </div>
                <div className={`policy-status ${policy.status}`}>
                  {policy.status === 'active' && <CheckCircle size={14} />}
                  {policy.status === 'inactive' && <Pause size={14} />}
                  {policy.status === 'error' && <XCircle size={14} />}
                  {policy.status}
                </div>
              </div>

              <div className="policy-target">
                <span className="target-label">Target:</span>
                <span className="target-value">{policy.target}</span>
              </div>

              <div className="policy-config">
                {Object.entries(policy.config).map(([key, value]) => (
                  <div key={key} className="config-item">
                    <span className="config-key">{key}</span>
                    <span className="config-value">{value}</span>
                  </div>
                ))}
              </div>

              <div className="policy-actions">
                <button className="btn-sm">
                  <Settings size={14} />
                  Edit
                </button>
                <button className="btn-sm">
                  {policy.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                  {policy.status === 'active' ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGateways = () => (
    <div className="gateways-section">
      <div className="gateways-header">
        <h3>Gateways</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Gateway
        </button>
      </div>

      <div className="gateways-list">
        {GATEWAYS.map(gateway => (
          <div key={gateway.id} className={`gateway-card ${gateway.status}`}>
            <div className="gateway-main">
              <div className={`gateway-icon ${gateway.type}`}>
                {gateway.type === 'ingress' ? <ArrowRight size={20} /> : <ArrowLeftRight size={20} />}
              </div>

              <div className="gateway-info">
                <div className="gateway-header">
                  <h4>{gateway.name}</h4>
                  <span className={`gateway-type ${gateway.type}`}>{gateway.type}</span>
                  <span className={`gateway-status ${gateway.status}`}>
                    {gateway.status === 'active' ? <CheckCircle size={12} /> : <Pause size={12} />}
                    {gateway.status}
                  </span>
                </div>
                <div className="gateway-hosts">
                  {gateway.hosts.map((host, i) => (
                    <span key={i} className="host-tag">{host}</span>
                  ))}
                </div>
              </div>

              <div className="gateway-config">
                <div className="gw-config-item">
                  <span className="gw-config-label">Port</span>
                  <span className="gw-config-value">{gateway.port}</span>
                </div>
                <div className="gw-config-item">
                  <span className="gw-config-label">Protocol</span>
                  <span className="gw-config-value">{gateway.protocol}</span>
                </div>
                <div className="gw-config-item">
                  <span className="gw-config-label">TLS Mode</span>
                  <span className="gw-config-value">{gateway.tlsMode}</span>
                </div>
              </div>

              <div className="gateway-actions">
                <button className="action-btn">
                  <Settings size={16} />
                </button>
                <button className="action-btn">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="service-mesh">
      <div className="service-mesh__header">
        <div className="service-mesh__title-section">
          <div className="service-mesh__icon">
            <Network size={28} />
          </div>
          <div>
            <h1>Service Mesh</h1>
            <p>Microservices networking and traffic management</p>
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

      <div className="service-mesh__stats">
        <div className="stat-card">
          <div className="stat-icon services">
            <Server size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyServices}/{SERVICES.length}</span>
            <span className="stat-label">Healthy Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon replicas">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalReplicas}</span>
            <span className="stat-label">Running Replicas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon errors">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgErrorRate}%</span>
            <span className="stat-label">Avg Error Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon mtls">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{mtlsEnabled}/{SERVICES.length}</span>
            <span className="stat-label">mTLS Enabled</span>
          </div>
        </div>
      </div>

      <div className="service-mesh__tabs">
        <button
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Server size={16} />
          Services
        </button>
        <button
          className={`tab-btn ${activeTab === 'topology' ? 'active' : ''}`}
          onClick={() => setActiveTab('topology')}
        >
          <Network size={16} />
          Topology
        </button>
        <button
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <GitBranch size={16} />
          Policies
        </button>
        <button
          className={`tab-btn ${activeTab === 'gateways' ? 'active' : ''}`}
          onClick={() => setActiveTab('gateways')}
        >
          <Globe size={16} />
          Gateways
        </button>
      </div>

      <div className="service-mesh__content">
        {activeTab === 'services' && renderServices()}
        {activeTab === 'topology' && renderTopology()}
        {activeTab === 'policies' && renderPolicies()}
        {activeTab === 'gateways' && renderGateways()}
      </div>
    </div>
  );
}
