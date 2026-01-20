'use client';

import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Search, 
  RefreshCw,
  Server,
  Globe,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Settings,
  Eye,
  MoreVertical,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  Network,
  Zap,
  Shield,
  Tag,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2
} from 'lucide-react';
import './service-discovery.css';

interface ServiceInstance {
  id: string;
  instanceId: string;
  address: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'draining' | 'starting';
  zone: string;
  weight: number;
  metadata: {
    version: string;
    region: string;
    tags: string[];
  };
  health: {
    cpu: number;
    memory: number;
    latency: number;
    uptime: string;
  };
  lastHealthCheck: string;
}

interface Service {
  id: string;
  name: string;
  namespace: string;
  type: 'api' | 'web' | 'worker' | 'database' | 'cache' | 'gateway';
  protocol: 'http' | 'https' | 'grpc' | 'tcp';
  instances: ServiceInstance[];
  loadBalancer: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted';
  healthCheck: {
    enabled: boolean;
    interval: string;
    timeout: string;
    path?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const SERVICES: Service[] = [
  {
    id: 'svc-001',
    name: 'api-gateway',
    namespace: 'production',
    type: 'gateway',
    protocol: 'https',
    loadBalancer: 'round-robin',
    healthCheck: {
      enabled: true,
      interval: '10s',
      timeout: '3s',
      path: '/health'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-27T10:00:00Z',
    instances: [
      {
        id: 'inst-001',
        instanceId: 'api-gateway-abc123',
        address: '10.0.1.10',
        port: 443,
        status: 'healthy',
        zone: 'us-east-1a',
        weight: 100,
        metadata: {
          version: 'v2.4.0',
          region: 'us-east-1',
          tags: ['production', 'primary']
        },
        health: {
          cpu: 45,
          memory: 62,
          latency: 12,
          uptime: '15d 4h 32m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      },
      {
        id: 'inst-002',
        instanceId: 'api-gateway-def456',
        address: '10.0.1.11',
        port: 443,
        status: 'healthy',
        zone: 'us-east-1b',
        weight: 100,
        metadata: {
          version: 'v2.4.0',
          region: 'us-east-1',
          tags: ['production', 'secondary']
        },
        health: {
          cpu: 38,
          memory: 58,
          latency: 14,
          uptime: '15d 4h 32m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      }
    ]
  },
  {
    id: 'svc-002',
    name: 'user-service',
    namespace: 'production',
    type: 'api',
    protocol: 'grpc',
    loadBalancer: 'least-connections',
    healthCheck: {
      enabled: true,
      interval: '15s',
      timeout: '5s',
      path: '/grpc.health.v1.Health/Check'
    },
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-27T09:00:00Z',
    instances: [
      {
        id: 'inst-003',
        instanceId: 'user-svc-xyz789',
        address: '10.0.2.20',
        port: 50051,
        status: 'healthy',
        zone: 'us-east-1a',
        weight: 100,
        metadata: {
          version: 'v1.8.2',
          region: 'us-east-1',
          tags: ['production', 'core']
        },
        health: {
          cpu: 28,
          memory: 45,
          latency: 8,
          uptime: '7d 12h 15m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      },
      {
        id: 'inst-004',
        instanceId: 'user-svc-uvw012',
        address: '10.0.2.21',
        port: 50051,
        status: 'unhealthy',
        zone: 'us-east-1b',
        weight: 0,
        metadata: {
          version: 'v1.8.2',
          region: 'us-east-1',
          tags: ['production', 'core']
        },
        health: {
          cpu: 95,
          memory: 92,
          latency: 450,
          uptime: '0d 0h 5m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      },
      {
        id: 'inst-005',
        instanceId: 'user-svc-rst345',
        address: '10.0.2.22',
        port: 50051,
        status: 'healthy',
        zone: 'us-east-1c',
        weight: 100,
        metadata: {
          version: 'v1.8.2',
          region: 'us-east-1',
          tags: ['production', 'core']
        },
        health: {
          cpu: 35,
          memory: 52,
          latency: 10,
          uptime: '7d 12h 15m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      }
    ]
  },
  {
    id: 'svc-003',
    name: 'redis-cache',
    namespace: 'production',
    type: 'cache',
    protocol: 'tcp',
    loadBalancer: 'ip-hash',
    healthCheck: {
      enabled: true,
      interval: '5s',
      timeout: '2s'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-27T08:00:00Z',
    instances: [
      {
        id: 'inst-006',
        instanceId: 'redis-master-001',
        address: '10.0.3.30',
        port: 6379,
        status: 'healthy',
        zone: 'us-east-1a',
        weight: 100,
        metadata: {
          version: '7.2.0',
          region: 'us-east-1',
          tags: ['production', 'master']
        },
        health: {
          cpu: 15,
          memory: 78,
          latency: 1,
          uptime: '30d 8h 45m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      }
    ]
  },
  {
    id: 'svc-004',
    name: 'notification-worker',
    namespace: 'production',
    type: 'worker',
    protocol: 'tcp',
    loadBalancer: 'weighted',
    healthCheck: {
      enabled: true,
      interval: '30s',
      timeout: '10s'
    },
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-27T07:00:00Z',
    instances: [
      {
        id: 'inst-007',
        instanceId: 'notif-worker-001',
        address: '10.0.4.40',
        port: 8080,
        status: 'healthy',
        zone: 'us-east-1a',
        weight: 50,
        metadata: {
          version: 'v2.1.0',
          region: 'us-east-1',
          tags: ['production', 'notifications']
        },
        health: {
          cpu: 55,
          memory: 65,
          latency: 0,
          uptime: '3d 6h 20m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      },
      {
        id: 'inst-008',
        instanceId: 'notif-worker-002',
        address: '10.0.4.41',
        port: 8080,
        status: 'draining',
        zone: 'us-east-1b',
        weight: 0,
        metadata: {
          version: 'v2.0.5',
          region: 'us-east-1',
          tags: ['production', 'notifications', 'upgrading']
        },
        health: {
          cpu: 20,
          memory: 40,
          latency: 0,
          uptime: '10d 2h 15m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      }
    ]
  },
  {
    id: 'svc-005',
    name: 'web-frontend',
    namespace: 'production',
    type: 'web',
    protocol: 'https',
    loadBalancer: 'round-robin',
    healthCheck: {
      enabled: true,
      interval: '10s',
      timeout: '3s',
      path: '/'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-27T11:00:00Z',
    instances: [
      {
        id: 'inst-009',
        instanceId: 'web-frontend-001',
        address: '10.0.5.50',
        port: 3000,
        status: 'starting',
        zone: 'us-east-1a',
        weight: 0,
        metadata: {
          version: 'v3.0.0-beta',
          region: 'us-east-1',
          tags: ['production', 'frontend', 'canary']
        },
        health: {
          cpu: 10,
          memory: 25,
          latency: 0,
          uptime: '0d 0h 2m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      },
      {
        id: 'inst-010',
        instanceId: 'web-frontend-002',
        address: '10.0.5.51',
        port: 3000,
        status: 'healthy',
        zone: 'us-east-1b',
        weight: 100,
        metadata: {
          version: 'v2.9.5',
          region: 'us-east-1',
          tags: ['production', 'frontend', 'stable']
        },
        health: {
          cpu: 42,
          memory: 55,
          latency: 45,
          uptime: '5d 18h 30m'
        },
        lastHealthCheck: '2024-01-27T11:30:00Z'
      }
    ]
  }
];

const TYPE_CONFIG = {
  api: { icon: Zap, color: 'primary' },
  web: { icon: Globe, color: 'info' },
  worker: { icon: Cpu, color: 'warning' },
  database: { icon: HardDrive, color: 'success' },
  cache: { icon: Server, color: 'purple' },
  gateway: { icon: Shield, color: 'cyan' }
};

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, color: 'success', label: 'Healthy' },
  unhealthy: { icon: XCircle, color: 'danger', label: 'Unhealthy' },
  draining: { icon: AlertTriangle, color: 'warning', label: 'Draining' },
  starting: { icon: Clock, color: 'info', label: 'Starting' }
};

export default function ServiceDiscoveryPage() {
  const [expandedServices, setExpandedServices] = useState<string[]>(['svc-001', 'svc-002']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

  const toggleService = (serviceId: string) => {
    setExpandedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const filteredServices = SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNamespace = selectedNamespace === 'all' || service.namespace === selectedNamespace;
    return matchesSearch && matchesNamespace;
  });

  const totalInstances = SERVICES.reduce((sum, s) => sum + s.instances.length, 0);
  const healthyInstances = SERVICES.reduce((sum, s) => 
    sum + s.instances.filter(i => i.status === 'healthy').length, 0
  );
  const unhealthyInstances = SERVICES.reduce((sum, s) => 
    sum + s.instances.filter(i => i.status === 'unhealthy').length, 0
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <div className="service-discovery">
      <header className="service-discovery__header">
        <div className="service-discovery__title-section">
          <div className="service-discovery__icon">
            <Compass size={28} />
          </div>
          <div>
            <h1>Service Discovery</h1>
            <p>Monitor and manage service registry and instances</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync Registry
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Register Service
          </button>
        </div>
      </header>

      <div className="service-discovery__stats">
        <div className="stat-card">
          <div className="stat-icon services">
            <Compass size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{SERVICES.length}</span>
            <span className="stat-label">Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon instances">
            <Server size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalInstances}</span>
            <span className="stat-label">Total Instances</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon healthy">
            <Wifi size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{healthyInstances}</span>
            <span className="stat-label">Healthy</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon unhealthy">
            <WifiOff size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{unhealthyInstances}</span>
            <span className="stat-label">Unhealthy</span>
          </div>
        </div>
      </div>

      <div className="service-discovery__filters">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={selectedNamespace}
          onChange={(e) => setSelectedNamespace(e.target.value)}
        >
          <option value="all">All Namespaces</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
        <button className="btn-outline">
          <Activity size={16} />
          Health Dashboard
        </button>
      </div>

      <div className="services-list">
        {filteredServices.map(service => {
          const TypeIcon = TYPE_CONFIG[service.type].icon;
          const typeColor = TYPE_CONFIG[service.type].color;
          const isExpanded = expandedServices.includes(service.id);
          const healthyCount = service.instances.filter(i => i.status === 'healthy').length;

          return (
            <div key={service.id} className="service-card">
              <div 
                className="service-header"
                onClick={() => toggleService(service.id)}
              >
                <button className="expand-btn">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className={`service-type-icon ${typeColor}`}>
                  <TypeIcon size={20} />
                </div>

                <div className="service-info">
                  <div className="service-name">
                    <h3>{service.name}</h3>
                    <span className="namespace-badge">{service.namespace}</span>
                    <span className="protocol-badge">{service.protocol.toUpperCase()}</span>
                  </div>
                  <div className="service-meta">
                    <span className="meta-item">
                      <Server size={12} />
                      {service.instances.length} instances
                    </span>
                    <span className="meta-item">
                      <Network size={12} />
                      {service.loadBalancer}
                    </span>
                    <span className="meta-item health">
                      <CheckCircle2 size={12} />
                      {healthyCount}/{service.instances.length} healthy
                    </span>
                  </div>
                </div>

                <div className="service-health-indicator">
                  {healthyCount === service.instances.length ? (
                    <span className="health-status healthy">
                      <CheckCircle2 size={16} />
                      All Healthy
                    </span>
                  ) : healthyCount === 0 ? (
                    <span className="health-status critical">
                      <XCircle size={16} />
                      Critical
                    </span>
                  ) : (
                    <span className="health-status degraded">
                      <AlertTriangle size={16} />
                      Degraded
                    </span>
                  )}
                </div>

                <div className="service-actions">
                  <button className="action-btn" title="Settings">
                    <Settings size={16} />
                  </button>
                  <button className="action-btn" title="More">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="service-instances">
                  <div className="instances-header">
                    <h4>Instances</h4>
                    <div className="health-check-info">
                      <Clock size={14} />
                      Health Check: {service.healthCheck.interval}
                      {service.healthCheck.path && (
                        <code>{service.healthCheck.path}</code>
                      )}
                    </div>
                  </div>

                  <div className="instances-list">
                    {service.instances.map(instance => {
                      const StatusIcon = STATUS_CONFIG[instance.status].icon;
                      const statusColor = STATUS_CONFIG[instance.status].color;

                      return (
                        <div key={instance.id} className={`instance-card ${instance.status}`}>
                          <div className="instance-status">
                            <div className={`status-indicator ${statusColor}`}>
                              <StatusIcon size={16} />
                            </div>
                          </div>

                          <div className="instance-info">
                            <div className="instance-header">
                              <code className="instance-id">{instance.instanceId}</code>
                              <span className={`status-badge ${statusColor}`}>
                                {STATUS_CONFIG[instance.status].label}
                              </span>
                            </div>

                            <div className="instance-address">
                              <span className="address">
                                {instance.address}:{instance.port}
                              </span>
                              <button className="copy-btn" title="Copy address">
                                <Copy size={12} />
                              </button>
                              <span className="zone">
                                <MapPin size={12} />
                                {instance.zone}
                              </span>
                            </div>

                            <div className="instance-tags">
                              <Tag size={12} />
                              {instance.metadata.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                              <span className="version">{instance.metadata.version}</span>
                            </div>
                          </div>

                          <div className="instance-metrics">
                            <div className="metric">
                              <span className="metric-label">CPU</span>
                              <div className="metric-bar">
                                <div 
                                  className={`metric-fill ${instance.health.cpu > 80 ? 'danger' : instance.health.cpu > 60 ? 'warning' : 'success'}`}
                                  style={{ width: `${instance.health.cpu}%` }}
                                />
                              </div>
                              <span className="metric-value">{instance.health.cpu}%</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">MEM</span>
                              <div className="metric-bar">
                                <div 
                                  className={`metric-fill ${instance.health.memory > 80 ? 'danger' : instance.health.memory > 60 ? 'warning' : 'success'}`}
                                  style={{ width: `${instance.health.memory}%` }}
                                />
                              </div>
                              <span className="metric-value">{instance.health.memory}%</span>
                            </div>
                            <div className="latency">
                              <span className="latency-label">Latency</span>
                              <span className={`latency-value ${instance.health.latency > 100 ? 'danger' : instance.health.latency > 50 ? 'warning' : ''}`}>
                                {instance.health.latency}ms
                              </span>
                            </div>
                          </div>

                          <div className="instance-footer">
                            <span className="uptime">
                              Uptime: {instance.health.uptime}
                            </span>
                            <span className="last-check">
                              Last check: {formatDate(instance.lastHealthCheck)}
                            </span>
                          </div>

                          <div className="instance-actions">
                            <button className="action-btn" title="View Details">
                              <Eye size={14} />
                            </button>
                            <button className="action-btn" title="Drain">
                              <AlertTriangle size={14} />
                            </button>
                            <button className="action-btn danger" title="Deregister">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="empty-state">
          <Compass size={48} />
          <h3>No Services Found</h3>
          <p>No services match your search criteria</p>
        </div>
      )}
    </div>
  );
}
