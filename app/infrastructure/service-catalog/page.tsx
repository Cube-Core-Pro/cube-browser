'use client';

import React, { useState } from 'react';
import { 
  Package, 
  Search,
  Filter,
  Plus,
  Star,
  Clock,
  Users,
  Tag,
  ExternalLink,
  Code,
  Database,
  Globe,
  Shield,
  Zap,
  Server,
  Cloud,
  Lock,
  MessageSquare,
  CreditCard,
  Mail,
  Bell,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Layers,
  GitBranch,
  Activity,
  BarChart3,
  FileText,
  Heart,
  BookOpen
} from 'lucide-react';
import './service-catalog.css';

interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  owner: string;
  team: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  tier: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  version: string;
  documentation: string;
  repository: string;
  dependencies: string[];
  dependents: string[];
  sla: {
    uptime: number;
    responseTime: string;
    supportHours: string;
  };
  metrics: {
    requests: string;
    latency: string;
    errorRate: string;
    uptime: string;
  };
  contacts: {
    primary: string;
    secondary: string;
    slack: string;
  };
  lastIncident: string | null;
  lastDeployment: string;
  rating: number;
  users: number;
  icon: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'compute', name: 'Compute', description: 'Virtual machines and containers', icon: Server, count: 8, color: '#3b82f6' },
  { id: 'database', name: 'Database', description: 'Data storage and analytics', icon: Database, count: 6, color: '#8b5cf6' },
  { id: 'networking', name: 'Networking', description: 'Load balancers and CDN', icon: Globe, count: 5, color: '#06b6d4' },
  { id: 'security', name: 'Security', description: 'Identity and access', icon: Shield, count: 7, color: '#ef4444' },
  { id: 'messaging', name: 'Messaging', description: 'Queues and notifications', icon: MessageSquare, count: 4, color: '#f59e0b' },
  { id: 'integration', name: 'Integration', description: 'APIs and webhooks', icon: Zap, count: 5, color: '#10b981' }
];

const SERVICES: Service[] = [
  {
    id: 'svc-001',
    name: 'Core API Gateway',
    description: 'Central API gateway that handles all external traffic, rate limiting, authentication, and request routing to downstream services. Provides a unified entry point for all client applications.',
    shortDescription: 'Central API gateway for all external traffic',
    category: 'integration',
    owner: 'Alex Chen',
    team: 'Platform Engineering',
    status: 'operational',
    tier: 'critical',
    tags: ['api', 'gateway', 'routing', 'rate-limiting'],
    version: '3.2.1',
    documentation: 'https://docs.cube.io/api-gateway',
    repository: 'github.com/cube/api-gateway',
    dependencies: ['svc-003', 'svc-005'],
    dependents: ['svc-002', 'svc-004', 'svc-006'],
    sla: { uptime: 99.99, responseTime: '< 50ms', supportHours: '24/7' },
    metrics: { requests: '2.4M/day', latency: '32ms p99', errorRate: '0.01%', uptime: '99.998%' },
    contacts: { primary: 'alex.chen@cube.io', secondary: 'platform-team@cube.io', slack: '#api-gateway' },
    lastIncident: '2025-01-15',
    lastDeployment: '2025-01-28',
    rating: 4.8,
    users: 1250,
    icon: 'Zap'
  },
  {
    id: 'svc-002',
    name: 'User Authentication Service',
    description: 'Handles all authentication flows including OAuth2, SAML, MFA, and SSO integration. Manages user sessions, tokens, and identity federation with external providers.',
    shortDescription: 'Authentication, SSO, and MFA management',
    category: 'security',
    owner: 'Sarah Johnson',
    team: 'Security Engineering',
    status: 'operational',
    tier: 'critical',
    tags: ['auth', 'sso', 'mfa', 'oauth', 'security'],
    version: '2.8.0',
    documentation: 'https://docs.cube.io/auth',
    repository: 'github.com/cube/auth-service',
    dependencies: ['svc-003', 'svc-007'],
    dependents: ['svc-001', 'svc-004', 'svc-006'],
    sla: { uptime: 99.99, responseTime: '< 100ms', supportHours: '24/7' },
    metrics: { requests: '850K/day', latency: '45ms p99', errorRate: '0.005%', uptime: '99.999%' },
    contacts: { primary: 'sarah.johnson@cube.io', secondary: 'security-team@cube.io', slack: '#auth-service' },
    lastIncident: null,
    lastDeployment: '2025-01-27',
    rating: 4.9,
    users: 2100,
    icon: 'Lock'
  },
  {
    id: 'svc-003',
    name: 'PostgreSQL Cluster',
    description: 'Primary relational database cluster with automated failover, read replicas, and point-in-time recovery. Stores user data, configurations, and transactional data.',
    shortDescription: 'Primary relational database with HA',
    category: 'database',
    owner: 'Mike Peters',
    team: 'Data Platform',
    status: 'operational',
    tier: 'critical',
    tags: ['database', 'postgresql', 'rdbms', 'ha'],
    version: '15.4',
    documentation: 'https://docs.cube.io/postgres',
    repository: 'github.com/cube/db-configs',
    dependencies: [],
    dependents: ['svc-001', 'svc-002', 'svc-004'],
    sla: { uptime: 99.95, responseTime: '< 10ms', supportHours: '24/7' },
    metrics: { requests: '15M queries/day', latency: '5ms avg', errorRate: '0.001%', uptime: '99.99%' },
    contacts: { primary: 'mike.peters@cube.io', secondary: 'data-team@cube.io', slack: '#database' },
    lastIncident: '2025-01-10',
    lastDeployment: '2025-01-20',
    rating: 4.7,
    users: 450,
    icon: 'Database'
  },
  {
    id: 'svc-004',
    name: 'Payment Processing',
    description: 'Handles all payment transactions including credit cards, ACH, wire transfers, and cryptocurrency. PCI-DSS compliant with built-in fraud detection.',
    shortDescription: 'PCI-compliant payment processing',
    category: 'integration',
    owner: 'Lisa Wong',
    team: 'Financial Engineering',
    status: 'operational',
    tier: 'critical',
    tags: ['payments', 'pci', 'stripe', 'fraud'],
    version: '4.1.2',
    documentation: 'https://docs.cube.io/payments',
    repository: 'github.com/cube/payment-service',
    dependencies: ['svc-001', 'svc-002', 'svc-003'],
    dependents: ['svc-006'],
    sla: { uptime: 99.99, responseTime: '< 500ms', supportHours: '24/7' },
    metrics: { requests: '125K/day', latency: '320ms p99', errorRate: '0.02%', uptime: '99.997%' },
    contacts: { primary: 'lisa.wong@cube.io', secondary: 'payments-team@cube.io', slack: '#payments' },
    lastIncident: '2025-01-22',
    lastDeployment: '2025-01-26',
    rating: 4.6,
    users: 890,
    icon: 'CreditCard'
  },
  {
    id: 'svc-005',
    name: 'Redis Cache Cluster',
    description: 'Distributed caching layer for session management, rate limiting, and application-level caching. High-availability setup with automatic failover.',
    shortDescription: 'Distributed caching and session store',
    category: 'database',
    owner: 'David Kim',
    team: 'Platform Engineering',
    status: 'degraded',
    tier: 'high',
    tags: ['cache', 'redis', 'session', 'rate-limiting'],
    version: '7.2',
    documentation: 'https://docs.cube.io/redis',
    repository: 'github.com/cube/redis-configs',
    dependencies: [],
    dependents: ['svc-001', 'svc-002'],
    sla: { uptime: 99.9, responseTime: '< 5ms', supportHours: 'Business Hours' },
    metrics: { requests: '50M ops/day', latency: '2ms avg', errorRate: '0.1%', uptime: '99.85%' },
    contacts: { primary: 'david.kim@cube.io', secondary: 'platform-team@cube.io', slack: '#redis' },
    lastIncident: '2025-01-29',
    lastDeployment: '2025-01-25',
    rating: 4.4,
    users: 320,
    icon: 'Zap'
  },
  {
    id: 'svc-006',
    name: 'Email Delivery Service',
    description: 'Transactional and marketing email delivery with template management, bounce handling, and analytics. Integrates with SendGrid and Amazon SES.',
    shortDescription: 'Transactional email delivery',
    category: 'messaging',
    owner: 'Emma Davis',
    team: 'Communications',
    status: 'operational',
    tier: 'high',
    tags: ['email', 'notifications', 'sendgrid', 'marketing'],
    version: '2.3.0',
    documentation: 'https://docs.cube.io/email',
    repository: 'github.com/cube/email-service',
    dependencies: ['svc-001', 'svc-002'],
    dependents: [],
    sla: { uptime: 99.9, responseTime: '< 1s', supportHours: 'Business Hours' },
    metrics: { requests: '500K emails/day', latency: '450ms avg', errorRate: '0.5%', uptime: '99.95%' },
    contacts: { primary: 'emma.davis@cube.io', secondary: 'comms-team@cube.io', slack: '#email-service' },
    lastIncident: null,
    lastDeployment: '2025-01-24',
    rating: 4.5,
    users: 1100,
    icon: 'Mail'
  },
  {
    id: 'svc-007',
    name: 'Kubernetes Cluster',
    description: 'Production Kubernetes cluster running on AWS EKS. Hosts all containerized workloads with auto-scaling, self-healing, and rolling deployments.',
    shortDescription: 'Production container orchestration',
    category: 'compute',
    owner: 'Tom Anderson',
    team: 'Infrastructure',
    status: 'operational',
    tier: 'critical',
    tags: ['kubernetes', 'eks', 'containers', 'orchestration'],
    version: '1.28',
    documentation: 'https://docs.cube.io/k8s',
    repository: 'github.com/cube/k8s-configs',
    dependencies: [],
    dependents: ['svc-001', 'svc-002', 'svc-004', 'svc-006'],
    sla: { uptime: 99.95, responseTime: 'N/A', supportHours: '24/7' },
    metrics: { requests: '150 pods', latency: 'N/A', errorRate: '0.001%', uptime: '99.98%' },
    contacts: { primary: 'tom.anderson@cube.io', secondary: 'infra-team@cube.io', slack: '#kubernetes' },
    lastIncident: '2025-01-05',
    lastDeployment: '2025-01-28',
    rating: 4.7,
    users: 85,
    icon: 'Cloud'
  },
  {
    id: 'svc-008',
    name: 'Global CDN',
    description: 'Content delivery network for static assets, media files, and edge caching. Provides low-latency access from 200+ edge locations worldwide.',
    shortDescription: 'Global content delivery network',
    category: 'networking',
    owner: 'Rachel Green',
    team: 'Infrastructure',
    status: 'maintenance',
    tier: 'high',
    tags: ['cdn', 'cloudfront', 'caching', 'static'],
    version: 'N/A',
    documentation: 'https://docs.cube.io/cdn',
    repository: 'github.com/cube/cdn-configs',
    dependencies: [],
    dependents: [],
    sla: { uptime: 99.9, responseTime: '< 100ms global', supportHours: 'Business Hours' },
    metrics: { requests: '10TB/day', latency: '25ms avg', errorRate: '0.01%', uptime: '99.85%' },
    contacts: { primary: 'rachel.green@cube.io', secondary: 'infra-team@cube.io', slack: '#cdn' },
    lastIncident: '2025-01-25',
    lastDeployment: '2025-01-29',
    rating: 4.3,
    users: 2500,
    icon: 'Globe'
  }
];

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: '#22c55e', icon: CheckCircle },
  degraded: { label: 'Degraded', color: '#f59e0b', icon: AlertTriangle },
  outage: { label: 'Outage', color: '#ef4444', icon: AlertTriangle },
  maintenance: { label: 'Maintenance', color: '#3b82f6', icon: Settings }
};

const TIER_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low: { label: 'Low', color: '#64748b' }
};

const ICON_MAP: Record<string, React.ElementType> = {
  Zap: Zap,
  Lock: Lock,
  Database: Database,
  CreditCard: CreditCard,
  Mail: Mail,
  Cloud: Cloud,
  Globe: Globe,
  Server: Server
};

export default function ServiceCatalogPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'categories' | 'dependencies' | 'requests'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredServices = SERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const operationalCount = SERVICES.filter(s => s.status === 'operational').length;
  const degradedCount = SERVICES.filter(s => s.status === 'degraded').length;
  const criticalCount = SERVICES.filter(s => s.tier === 'critical').length;

  const renderStars = (rating: number): React.ReactNode => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={12} 
            className={star <= Math.round(rating) ? 'star filled' : 'star'} 
          />
        ))}
        <span className="rating-value">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="service-catalog">
      <div className="service-catalog__header">
        <div className="service-catalog__title-section">
          <div className="service-catalog__icon">
            <Package size={28} />
          </div>
          <div>
            <h1>Service Catalog</h1>
            <p>Discover and manage enterprise services and APIs</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <BookOpen size={16} />
            Documentation
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Register Service
          </button>
        </div>
      </div>

      <div className="service-catalog__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Package size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{SERVICES.length}</span>
            <span className="stat-label">Total Services</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon operational">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{operationalCount}</span>
            <span className="stat-label">Operational</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon degraded">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{degradedCount}</span>
            <span className="stat-label">Degraded</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon critical">
            <Shield size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{criticalCount}</span>
            <span className="stat-label">Critical Tier</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon categories">
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{SERVICE_CATEGORIES.length}</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>
      </div>

      <div className="service-catalog__tabs">
        <button 
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Package size={16} />
          Service Catalog
          <span className="tab-badge">{SERVICES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} />
          Categories
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          <GitBranch size={16} />
          Dependencies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Bell size={16} />
          Service Requests
          <span className="tab-badge">3</span>
        </button>
      </div>

      {activeTab === 'catalog' && (
        <div className="catalog-section">
          <div className="section-toolbar">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search services, tags, or descriptions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="operational">Operational</option>
                <option value="degraded">Degraded</option>
                <option value="maintenance">Maintenance</option>
                <option value="outage">Outage</option>
              </select>
              <div className="view-toggle">
                <button 
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Layers size={16} />
                </button>
                <button 
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <BarChart3 size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className={`services-grid ${viewMode}`}>
            {filteredServices.map(service => {
              const StatusIcon = STATUS_CONFIG[service.status].icon;
              const ServiceIcon = ICON_MAP[service.icon] || Package;
              
              return (
                <div 
                  key={service.id} 
                  className={`service-card ${service.status}`}
                  onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
                >
                  <div className="service-header">
                    <div className="service-icon-wrapper" style={{ background: `${TIER_CONFIG[service.tier].color}20` }}>
                      <ServiceIcon size={20} style={{ color: TIER_CONFIG[service.tier].color }} />
                    </div>
                    <div className="service-title-section">
                      <h4>{service.name}</h4>
                      <span className="service-version">v{service.version}</span>
                    </div>
                    <div className={`status-indicator ${service.status}`}>
                      <StatusIcon size={14} />
                      {STATUS_CONFIG[service.status].label}
                    </div>
                  </div>

                  <p className="service-description">{service.shortDescription}</p>

                  <div className="service-tags">
                    {service.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {service.tags.length > 3 && (
                      <span className="tag more">+{service.tags.length - 3}</span>
                    )}
                  </div>

                  <div className="service-meta">
                    <div className="meta-item">
                      <Users size={12} />
                      <span>{service.team}</span>
                    </div>
                    <div className="meta-item">
                      <Activity size={12} />
                      <span>{service.metrics.uptime}</span>
                    </div>
                  </div>

                  <div className="service-footer">
                    <div className="rating-section">
                      {renderStars(service.rating)}
                    </div>
                    <div className="tier-badge" style={{ 
                      backgroundColor: `${TIER_CONFIG[service.tier].color}20`,
                      color: TIER_CONFIG[service.tier].color
                    }}>
                      {TIER_CONFIG[service.tier].label}
                    </div>
                  </div>

                  {selectedService?.id === service.id && (
                    <div className="service-expanded">
                      <div className="expanded-section">
                        <h5>Description</h5>
                        <p>{service.description}</p>
                      </div>

                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>SLA Targets</h5>
                          <div className="sla-items">
                            <div className="sla-item">
                              <span className="sla-label">Uptime</span>
                              <span className="sla-value">{service.sla.uptime}%</span>
                            </div>
                            <div className="sla-item">
                              <span className="sla-label">Response Time</span>
                              <span className="sla-value">{service.sla.responseTime}</span>
                            </div>
                            <div className="sla-item">
                              <span className="sla-label">Support</span>
                              <span className="sla-value">{service.sla.supportHours}</span>
                            </div>
                          </div>
                        </div>

                        <div className="expanded-section">
                          <h5>Current Metrics</h5>
                          <div className="metrics-items">
                            <div className="metric-item">
                              <span className="metric-label">Traffic</span>
                              <span className="metric-value">{service.metrics.requests}</span>
                            </div>
                            <div className="metric-item">
                              <span className="metric-label">Latency</span>
                              <span className="metric-value">{service.metrics.latency}</span>
                            </div>
                            <div className="metric-item">
                              <span className="metric-label">Error Rate</span>
                              <span className="metric-value">{service.metrics.errorRate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="expanded-section">
                        <h5>Dependencies</h5>
                        <div className="dependency-chips">
                          {service.dependencies.length > 0 ? (
                            service.dependencies.map(depId => {
                              const dep = SERVICES.find(s => s.id === depId);
                              return dep ? (
                                <span key={depId} className="dep-chip">
                                  <ArrowUpRight size={12} />
                                  {dep.name}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="no-deps">No dependencies</span>
                          )}
                        </div>
                      </div>

                      <div className="expanded-section">
                        <h5>Contact & Links</h5>
                        <div className="contact-row">
                          <a href={`mailto:${service.contacts.primary}`} className="contact-link">
                            <Mail size={14} />
                            {service.contacts.primary}
                          </a>
                          <a href={service.documentation} className="contact-link" target="_blank" rel="noopener noreferrer">
                            <BookOpen size={14} />
                            Documentation
                          </a>
                          <a href={`https://${service.repository}`} className="contact-link" target="_blank" rel="noopener noreferrer">
                            <Code size={14} />
                            Repository
                          </a>
                        </div>
                      </div>

                      <div className="expanded-footer">
                        <div className="footer-info">
                          <span>Last Incident: {formatDate(service.lastIncident)}</span>
                          <span>Last Deploy: {formatDate(service.lastDeployment)}</span>
                        </div>
                        <div className="footer-actions">
                          <button className="action-btn">
                            <Activity size={14} />
                            Metrics
                          </button>
                          <button className="action-btn">
                            <FileText size={14} />
                            Runbook
                          </button>
                          <button className="action-btn primary">
                            <ExternalLink size={14} />
                            Open Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="categories-section">
          <div className="categories-grid">
            {SERVICE_CATEGORIES.map(category => {
              const CategoryIcon = category.icon;
              const categoryServices = SERVICES.filter(s => s.category === category.id);
              
              return (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <div 
                      className="category-icon"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <CategoryIcon size={24} />
                    </div>
                    <div className="category-title">
                      <h4>{category.name}</h4>
                      <p>{category.description}</p>
                    </div>
                    <span className="category-count">{categoryServices.length}</span>
                  </div>
                  <div className="category-services">
                    {categoryServices.slice(0, 3).map(service => (
                      <div key={service.id} className="mini-service">
                        <span className={`mini-status ${service.status}`}></span>
                        <span className="mini-name">{service.name}</span>
                        <ChevronRight size={14} />
                      </div>
                    ))}
                    {categoryServices.length > 3 && (
                      <button className="view-all-btn">
                        View all {categoryServices.length} services
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div className="dependencies-section">
          <div className="dep-header">
            <h3>Service Dependency Map</h3>
            <p>Visualize relationships between services</p>
          </div>
          <div className="dependency-matrix">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Tier</th>
                  <th>Depends On</th>
                  <th>Used By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map(service => (
                  <tr key={service.id}>
                    <td className="service-name-cell">
                      <div className="service-name-row">
                        <span className={`status-dot ${service.status}`}></span>
                        {service.name}
                      </div>
                    </td>
                    <td>
                      <span 
                        className="tier-tag"
                        style={{ 
                          backgroundColor: `${TIER_CONFIG[service.tier].color}20`,
                          color: TIER_CONFIG[service.tier].color
                        }}
                      >
                        {TIER_CONFIG[service.tier].label}
                      </span>
                    </td>
                    <td className="deps-cell">
                      {service.dependencies.length > 0 ? (
                        <div className="deps-list">
                          {service.dependencies.map(depId => {
                            const dep = SERVICES.find(s => s.id === depId);
                            return dep ? (
                              <span key={depId} className="dep-tag">{dep.name}</span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="no-deps">None</span>
                      )}
                    </td>
                    <td className="deps-cell">
                      {service.dependents.length > 0 ? (
                        <div className="deps-list">
                          {service.dependents.slice(0, 2).map(depId => {
                            const dep = SERVICES.find(s => s.id === depId);
                            return dep ? (
                              <span key={depId} className="dep-tag dependent">{dep.name}</span>
                            ) : null;
                          })}
                          {service.dependents.length > 2 && (
                            <span className="dep-tag more">+{service.dependents.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="no-deps">None</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${service.status}`}>
                        {STATUS_CONFIG[service.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-section">
          <div className="requests-header">
            <h3>Service Requests</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Request
            </button>
          </div>
          <div className="requests-list">
            <div className="request-card pending">
              <div className="request-icon">
                <Plus size={20} />
              </div>
              <div className="request-info">
                <h4>New Elasticsearch Cluster</h4>
                <p>Requesting dedicated ES cluster for log aggregation and search functionality</p>
                <div className="request-meta">
                  <span className="requester">Requested by John Smith</span>
                  <span className="request-date">Jan 28, 2025</span>
                </div>
              </div>
              <span className="request-status pending">Pending Review</span>
            </div>
            <div className="request-card in-progress">
              <div className="request-icon">
                <Settings size={20} />
              </div>
              <div className="request-info">
                <h4>API Gateway Rate Limit Increase</h4>
                <p>Increase rate limits from 1000 to 5000 req/min for enterprise tier</p>
                <div className="request-meta">
                  <span className="requester">Requested by Lisa Wong</span>
                  <span className="request-date">Jan 25, 2025</span>
                </div>
              </div>
              <span className="request-status in-progress">In Progress</span>
            </div>
            <div className="request-card approved">
              <div className="request-icon">
                <Shield size={20} />
              </div>
              <div className="request-info">
                <h4>SOC2 Compliance Audit Access</h4>
                <p>Access to compliance dashboards for upcoming SOC2 audit preparation</p>
                <div className="request-meta">
                  <span className="requester">Requested by Sarah Johnson</span>
                  <span className="request-date">Jan 22, 2025</span>
                </div>
              </div>
              <span className="request-status approved">Approved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
