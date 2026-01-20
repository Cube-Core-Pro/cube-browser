'use client';

import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Cloud, 
  Cpu, 
  MemoryStick, 
  Network, 
  Box,
  Package,
  Tag,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  DollarSign,
  MapPin,
  RefreshCw,
  BarChart3,
  Grid,
  List,
  Eye,
  Edit,
  Trash2,
  Activity
} from 'lucide-react';
import './inventory.css';

interface InventoryItem {
  id: string;
  name: string;
  type: 'server' | 'database' | 'storage' | 'network' | 'compute' | 'container' | 'service' | 'other';
  provider: string;
  region: string;
  status: 'running' | 'stopped' | 'pending' | 'error' | 'terminated';
  specs: {
    cpu?: string;
    memory?: string;
    storage?: string;
    network?: string;
  };
  tags: { key: string; value: string }[];
  costPerMonth: number;
  createdAt: string;
  lastUpdated: string;
  owner: string;
  environment: 'production' | 'staging' | 'development' | 'test';
}

interface InventorySummary {
  totalResources: number;
  runningResources: number;
  totalMonthlyCost: number;
  resourcesByType: { type: string; count: number }[];
  resourcesByProvider: { provider: string; count: number }[];
  resourcesByEnvironment: { environment: string; count: number }[];
}

const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'srv-001',
    name: 'api-server-prod-01',
    type: 'server',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      cpu: '8 vCPU',
      memory: '32 GB',
      storage: '500 GB SSD',
      network: '10 Gbps'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'platform' },
      { key: 'app', value: 'api' }
    ],
    costPerMonth: 850,
    createdAt: '2024-06-15',
    lastUpdated: '2025-01-15',
    owner: 'Platform Team',
    environment: 'production'
  },
  {
    id: 'db-001',
    name: 'postgres-primary',
    type: 'database',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      cpu: '16 vCPU',
      memory: '64 GB',
      storage: '2 TB SSD',
      network: '25 Gbps'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'data' },
      { key: 'role', value: 'primary' }
    ],
    costPerMonth: 2400,
    createdAt: '2024-03-10',
    lastUpdated: '2025-01-14',
    owner: 'Data Team',
    environment: 'production'
  },
  {
    id: 'stg-001',
    name: 's3-media-bucket',
    type: 'storage',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      storage: '15 TB',
      network: 'High throughput'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'media' },
      { key: 'retention', value: '365d' }
    ],
    costPerMonth: 450,
    createdAt: '2024-01-20',
    lastUpdated: '2025-01-15',
    owner: 'Media Team',
    environment: 'production'
  },
  {
    id: 'k8s-001',
    name: 'eks-cluster-prod',
    type: 'compute',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      cpu: '96 vCPU',
      memory: '384 GB',
      network: '100 Gbps'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'platform' },
      { key: 'orchestrator', value: 'kubernetes' }
    ],
    costPerMonth: 4500,
    createdAt: '2024-02-01',
    lastUpdated: '2025-01-15',
    owner: 'Platform Team',
    environment: 'production'
  },
  {
    id: 'net-001',
    name: 'vpc-production',
    type: 'network',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      network: '10.0.0.0/16'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'type', value: 'vpc' }
    ],
    costPerMonth: 150,
    createdAt: '2024-01-01',
    lastUpdated: '2025-01-10',
    owner: 'Network Team',
    environment: 'production'
  },
  {
    id: 'srv-002',
    name: 'web-server-prod-01',
    type: 'server',
    provider: 'GCP',
    region: 'europe-west1',
    status: 'running',
    specs: {
      cpu: '4 vCPU',
      memory: '16 GB',
      storage: '200 GB SSD',
      network: '5 Gbps'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'frontend' },
      { key: 'app', value: 'web' }
    ],
    costPerMonth: 420,
    createdAt: '2024-08-20',
    lastUpdated: '2025-01-14',
    owner: 'Frontend Team',
    environment: 'production'
  },
  {
    id: 'db-002',
    name: 'redis-cache-cluster',
    type: 'database',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      cpu: '4 vCPU',
      memory: '26 GB',
      network: '10 Gbps'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'platform' },
      { key: 'type', value: 'cache' }
    ],
    costPerMonth: 680,
    createdAt: '2024-04-15',
    lastUpdated: '2025-01-15',
    owner: 'Platform Team',
    environment: 'production'
  },
  {
    id: 'srv-003',
    name: 'api-server-staging-01',
    type: 'server',
    provider: 'AWS',
    region: 'us-west-2',
    status: 'running',
    specs: {
      cpu: '4 vCPU',
      memory: '16 GB',
      storage: '200 GB SSD',
      network: '5 Gbps'
    },
    tags: [
      { key: 'env', value: 'staging' },
      { key: 'team', value: 'platform' },
      { key: 'app', value: 'api' }
    ],
    costPerMonth: 320,
    createdAt: '2024-09-01',
    lastUpdated: '2025-01-15',
    owner: 'Platform Team',
    environment: 'staging'
  },
  {
    id: 'cnt-001',
    name: 'nginx-ingress',
    type: 'container',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    specs: {
      cpu: '2 vCPU',
      memory: '4 GB'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'platform' },
      { key: 'role', value: 'ingress' }
    ],
    costPerMonth: 85,
    createdAt: '2024-07-01',
    lastUpdated: '2025-01-15',
    owner: 'Platform Team',
    environment: 'production'
  },
  {
    id: 'svc-001',
    name: 'cloudflare-cdn',
    type: 'service',
    provider: 'Cloudflare',
    region: 'global',
    status: 'running',
    specs: {
      network: 'Enterprise CDN'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'platform' },
      { key: 'type', value: 'cdn' }
    ],
    costPerMonth: 1200,
    createdAt: '2024-01-01',
    lastUpdated: '2025-01-01',
    owner: 'Platform Team',
    environment: 'production'
  },
  {
    id: 'db-003',
    name: 'mongodb-analytics',
    type: 'database',
    provider: 'MongoDB Atlas',
    region: 'us-east-1',
    status: 'running',
    specs: {
      cpu: '8 vCPU',
      memory: '32 GB',
      storage: '1 TB NVMe'
    },
    tags: [
      { key: 'env', value: 'production' },
      { key: 'team', value: 'analytics' },
      { key: 'type', value: 'document' }
    ],
    costPerMonth: 1650,
    createdAt: '2024-05-01',
    lastUpdated: '2025-01-14',
    owner: 'Analytics Team',
    environment: 'production'
  },
  {
    id: 'srv-004',
    name: 'dev-server-01',
    type: 'server',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'stopped',
    specs: {
      cpu: '2 vCPU',
      memory: '8 GB',
      storage: '100 GB SSD',
      network: '1 Gbps'
    },
    tags: [
      { key: 'env', value: 'development' },
      { key: 'team', value: 'engineering' }
    ],
    costPerMonth: 65,
    createdAt: '2024-10-15',
    lastUpdated: '2025-01-10',
    owner: 'Engineering Team',
    environment: 'development'
  }
];

const INVENTORY_SUMMARY: InventorySummary = {
  totalResources: 12,
  runningResources: 11,
  totalMonthlyCost: 12770,
  resourcesByType: [
    { type: 'server', count: 4 },
    { type: 'database', count: 3 },
    { type: 'compute', count: 1 },
    { type: 'storage', count: 1 },
    { type: 'network', count: 1 },
    { type: 'container', count: 1 },
    { type: 'service', count: 1 }
  ],
  resourcesByProvider: [
    { provider: 'AWS', count: 9 },
    { provider: 'GCP', count: 1 },
    { provider: 'Cloudflare', count: 1 },
    { provider: 'MongoDB Atlas', count: 1 }
  ],
  resourcesByEnvironment: [
    { environment: 'production', count: 10 },
    { environment: 'staging', count: 1 },
    { environment: 'development', count: 1 }
  ]
};

const TYPE_ICONS: Record<InventoryItem['type'], React.ElementType> = {
  server: Server,
  database: Database,
  storage: HardDrive,
  network: Network,
  compute: Cpu,
  container: Box,
  service: Cloud,
  other: Package
};

const TYPE_COLORS: Record<InventoryItem['type'], string> = {
  server: 'cyan',
  database: 'orange',
  storage: 'purple',
  network: 'blue',
  compute: 'green',
  container: 'pink',
  service: 'yellow',
  other: 'gray'
};

const STATUS_CONFIG: Record<InventoryItem['status'], { color: string; bg: string }> = {
  running: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  stopped: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  error: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  terminated: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }
};

const ENV_CONFIG: Record<InventoryItem['environment'], { color: string; bg: string }> = {
  production: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  staging: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  development: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  test: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
};

export default function InfrastructureInventoryPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'tags' | 'costs'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filteredItems = INVENTORY_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesProvider = filterProvider === 'all' || item.provider === filterProvider;
    const matchesEnv = filterEnvironment === 'all' || item.environment === filterEnvironment;
    return matchesSearch && matchesType && matchesProvider && matchesEnv;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: Server, count: INVENTORY_ITEMS.length },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'costs', label: 'Costs', icon: DollarSign }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-charts">
        <div className="chart-card">
          <h3>Resources by Type</h3>
          <div className="type-chart">
            {INVENTORY_SUMMARY.resourcesByType.map(item => {
              const IconComponent = TYPE_ICONS[item.type as InventoryItem['type']] || Package;
              const color = TYPE_COLORS[item.type as InventoryItem['type']] || 'gray';
              return (
                <div key={item.type} className="type-bar">
                  <div className="type-label">
                    <span className={`type-icon ${color}`}>
                      <IconComponent size={14} />
                    </span>
                    <span>{item.type}</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className={`bar-fill ${color}`}
                      style={{ width: `${(item.count / INVENTORY_SUMMARY.totalResources) * 100}%` }}
                    />
                  </div>
                  <span className="type-count">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <h3>Resources by Provider</h3>
          <div className="provider-chart">
            {INVENTORY_SUMMARY.resourcesByProvider.map((item, index) => {
              const colors = ['#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6'];
              return (
                <div key={item.provider} className="provider-item">
                  <div className="provider-info">
                    <span 
                      className="provider-dot"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <span className="provider-name">{item.provider}</span>
                  </div>
                  <div className="provider-stats">
                    <span className="provider-count">{item.count}</span>
                    <span className="provider-percent">
                      {Math.round((item.count / INVENTORY_SUMMARY.totalResources) * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <h3>Resources by Environment</h3>
          <div className="env-chart">
            {INVENTORY_SUMMARY.resourcesByEnvironment.map(item => {
              const config = ENV_CONFIG[item.environment as InventoryItem['environment']];
              return (
                <div key={item.environment} className="env-item">
                  <div 
                    className="env-badge"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {item.environment}
                  </div>
                  <div className="env-bar-container">
                    <div 
                      className="env-bar-fill"
                      style={{ 
                        width: `${(item.count / INVENTORY_SUMMARY.totalResources) * 100}%`,
                        background: config.color
                      }}
                    />
                  </div>
                  <span className="env-count">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="recent-resources">
        <div className="section-header">
          <h3>Recently Updated Resources</h3>
          <button className="btn-link">View All</button>
        </div>
        <div className="recent-list">
          {INVENTORY_ITEMS.slice(0, 5).map(item => {
            const IconComponent = TYPE_ICONS[item.type];
            const statusConfig = STATUS_CONFIG[item.status];
            return (
              <div key={item.id} className="recent-item">
                <div className={`recent-icon ${TYPE_COLORS[item.type]}`}>
                  <IconComponent size={18} />
                </div>
                <div className="recent-info">
                  <span className="recent-name">{item.name}</span>
                  <span className="recent-meta">
                    {item.provider} • {item.region}
                  </span>
                </div>
                <div 
                  className="recent-status"
                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                >
                  {item.status}
                </div>
                <span className="recent-time">Updated {item.lastUpdated}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="resources-section">
      <div className="resources-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="server">Servers</option>
            <option value="database">Databases</option>
            <option value="storage">Storage</option>
            <option value="network">Network</option>
            <option value="compute">Compute</option>
            <option value="container">Containers</option>
            <option value="service">Services</option>
          </select>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="all">All Providers</option>
            <option value="AWS">AWS</option>
            <option value="GCP">GCP</option>
            <option value="Azure">Azure</option>
            <option value="Cloudflare">Cloudflare</option>
          </select>
          <select
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value)}
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="resources-grid">
          {filteredItems.map(item => {
            const IconComponent = TYPE_ICONS[item.type];
            const statusConfig = STATUS_CONFIG[item.status];
            const envConfig = ENV_CONFIG[item.environment];
            return (
              <div 
                key={item.id} 
                className={`resource-card ${item.status}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="resource-header">
                  <div className={`resource-icon ${TYPE_COLORS[item.type]}`}>
                    <IconComponent size={20} />
                  </div>
                  <div 
                    className="resource-status"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}
                  >
                    {item.status}
                  </div>
                </div>
                <h4 className="resource-name">{item.name}</h4>
                <span className="resource-id">{item.id}</span>
                <div className="resource-meta">
                  <span className="meta-item">
                    <Cloud size={12} />
                    {item.provider}
                  </span>
                  <span className="meta-item">
                    <MapPin size={12} />
                    {item.region}
                  </span>
                </div>
                <div className="resource-specs">
                  {item.specs.cpu && (
                    <div className="spec-item">
                      <Cpu size={12} />
                      {item.specs.cpu}
                    </div>
                  )}
                  {item.specs.memory && (
                    <div className="spec-item">
                      <MemoryStick size={12} />
                      {item.specs.memory}
                    </div>
                  )}
                  {item.specs.storage && (
                    <div className="spec-item">
                      <HardDrive size={12} />
                      {item.specs.storage}
                    </div>
                  )}
                </div>
                <div className="resource-footer">
                  <div 
                    className="env-badge"
                    style={{ background: envConfig.bg, color: envConfig.color }}
                  >
                    {item.environment}
                  </div>
                  <span className="resource-cost">${item.costPerMonth}/mo</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="resources-table">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Region</th>
                <th>Status</th>
                <th>Environment</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const IconComponent = TYPE_ICONS[item.type];
                const statusConfig = STATUS_CONFIG[item.status];
                const envConfig = ENV_CONFIG[item.environment];
                return (
                  <tr key={item.id} onClick={() => setSelectedItem(item)}>
                    <td>
                      <div className="table-resource">
                        <div className={`table-icon ${TYPE_COLORS[item.type]}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="table-info">
                          <span className="table-name">{item.name}</span>
                          <span className="table-id">{item.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="type-label-badge">{item.type}</span>
                    </td>
                    <td>{item.provider}</td>
                    <td>{item.region}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="env-badge"
                        style={{ background: envConfig.bg, color: envConfig.color }}
                      >
                        {item.environment}
                      </span>
                    </td>
                    <td className="cost-cell">${item.costPerMonth}/mo</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn">
                          <Eye size={14} />
                        </button>
                        <button className="icon-btn">
                          <Edit size={14} />
                        </button>
                        <button className="icon-btn danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedItem && (
        <div className="resource-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className={`panel-icon ${TYPE_COLORS[selectedItem.type]}`}>
                {React.createElement(TYPE_ICONS[selectedItem.type], { size: 20 })}
              </div>
              <div>
                <h3>{selectedItem.name}</h3>
                <span className="panel-id">{selectedItem.id}</span>
              </div>
            </div>
            <button 
              className="close-btn"
              onClick={() => setSelectedItem(null)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="panel-status-row">
              <span 
                className="status-badge large"
                style={{ 
                  background: STATUS_CONFIG[selectedItem.status].bg, 
                  color: STATUS_CONFIG[selectedItem.status].color 
                }}
              >
                {selectedItem.status}
              </span>
              <span 
                className="env-badge large"
                style={{ 
                  background: ENV_CONFIG[selectedItem.environment].bg, 
                  color: ENV_CONFIG[selectedItem.environment].color 
                }}
              >
                {selectedItem.environment}
              </span>
            </div>

            <div className="panel-section">
              <h4>Details</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Provider</span>
                  <span className="detail-value">{selectedItem.provider}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Region</span>
                  <span className="detail-value">{selectedItem.region}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Owner</span>
                  <span className="detail-value">{selectedItem.owner}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{selectedItem.createdAt}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">{selectedItem.lastUpdated}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Monthly Cost</span>
                  <span className="detail-value cost">${selectedItem.costPerMonth}</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Specifications</h4>
              <div className="specs-list">
                {Object.entries(selectedItem.specs).map(([key, value]) => (
                  <div key={key} className="spec-row">
                    <span className="spec-key">{key}</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <h4>Tags</h4>
              <div className="tags-list">
                {selectedItem.tags.map((tag, index) => (
                  <div key={index} className="tag-item">
                    <span className="tag-key">{tag.key}</span>
                    <span className="tag-value">{tag.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Activity size={16} />
                View Metrics
              </button>
              <button className="btn-outline">
                <Edit size={16} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTags = () => {
    const allTags = INVENTORY_ITEMS.reduce((acc, item) => {
      item.tags.forEach(tag => {
        const key = tag.key;
        if (!acc[key]) {
          acc[key] = [];
        }
        if (!acc[key].includes(tag.value)) {
          acc[key].push(tag.value);
        }
      });
      return acc;
    }, {} as Record<string, string[]>);

    return (
      <div className="tags-section">
        <div className="tags-header">
          <h3>Tag Management</h3>
          <button className="btn-primary">
            <Plus size={16} />
            Add Tag Policy
          </button>
        </div>
        <div className="tags-grid">
          {Object.entries(allTags).map(([key, values]) => (
            <div key={key} className="tag-card">
              <div className="tag-card-header">
                <Tag size={16} />
                <span className="tag-card-key">{key}</span>
                <span className="tag-count">{values.length} values</span>
              </div>
              <div className="tag-values">
                {values.map(value => (
                  <span key={value} className="tag-value-badge">
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCosts = () => {
    const costByProvider = INVENTORY_ITEMS.reduce((acc, item) => {
      acc[item.provider] = (acc[item.provider] || 0) + item.costPerMonth;
      return acc;
    }, {} as Record<string, number>);

    const costByType = INVENTORY_ITEMS.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.costPerMonth;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="costs-section">
        <div className="cost-summary-cards">
          <div className="cost-card total">
            <div className="cost-card-icon">
              <DollarSign size={24} />
            </div>
            <div className="cost-card-content">
              <span className="cost-label">Total Monthly Cost</span>
              <span className="cost-value">${INVENTORY_SUMMARY.totalMonthlyCost.toLocaleString()}</span>
            </div>
          </div>
          <div className="cost-card">
            <div className="cost-card-icon projected">
              <BarChart3 size={24} />
            </div>
            <div className="cost-card-content">
              <span className="cost-label">Projected Annual</span>
              <span className="cost-value">${(INVENTORY_SUMMARY.totalMonthlyCost * 12).toLocaleString()}</span>
            </div>
          </div>
          <div className="cost-card">
            <div className="cost-card-icon change">
              <Activity size={24} />
            </div>
            <div className="cost-card-content">
              <span className="cost-label">Month over Month</span>
              <span className="cost-value change">+4.2%</span>
            </div>
          </div>
        </div>

        <div className="cost-breakdown">
          <div className="breakdown-card">
            <h3>Cost by Provider</h3>
            <div className="breakdown-list">
              {Object.entries(costByProvider)
                .sort((a, b) => b[1] - a[1])
                .map(([provider, cost]) => (
                  <div key={provider} className="breakdown-item">
                    <div className="breakdown-info">
                      <span className="breakdown-name">{provider}</span>
                      <div className="breakdown-bar-container">
                        <div 
                          className="breakdown-bar"
                          style={{ 
                            width: `${(cost / INVENTORY_SUMMARY.totalMonthlyCost) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="breakdown-cost">${cost.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="breakdown-card">
            <h3>Cost by Resource Type</h3>
            <div className="breakdown-list">
              {Object.entries(costByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, cost]) => {
                  const IconComponent = TYPE_ICONS[type as InventoryItem['type']] || Package;
                  return (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-info">
                        <div className="breakdown-type">
                          <IconComponent size={14} />
                          <span className="breakdown-name">{type}</span>
                        </div>
                        <div className="breakdown-bar-container">
                          <div 
                            className="breakdown-bar"
                            style={{ 
                              width: `${(cost / INVENTORY_SUMMARY.totalMonthlyCost) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                      <span className="breakdown-cost">${cost.toLocaleString()}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="top-resources">
          <h3>Top 5 Most Expensive Resources</h3>
          <div className="top-list">
            {INVENTORY_ITEMS
              .sort((a, b) => b.costPerMonth - a.costPerMonth)
              .slice(0, 5)
              .map((item, index) => {
                const IconComponent = TYPE_ICONS[item.type];
                return (
                  <div key={item.id} className="top-item">
                    <span className="top-rank">#{index + 1}</span>
                    <div className={`top-icon ${TYPE_COLORS[item.type]}`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="top-info">
                      <span className="top-name">{item.name}</span>
                      <span className="top-meta">{item.provider} • {item.region}</span>
                    </div>
                    <span className="top-cost">${item.costPerMonth.toLocaleString()}/mo</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="infrastructure-inventory">
      <header className="inv__header">
        <div className="inv__title-section">
          <div className="inv__icon">
            <Package size={28} />
          </div>
          <div>
            <h1>Infrastructure Inventory</h1>
            <p>Complete visibility into all infrastructure resources</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync
          </button>
          <button className="btn-outline">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Resource
          </button>
        </div>
      </header>

      <div className="inv__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{INVENTORY_SUMMARY.totalResources}</span>
            <span className="stat-label">Total Resources</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon running">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{INVENTORY_SUMMARY.runningResources}</span>
            <span className="stat-label">Running</span>
          </div>
          <span className="stat-badge healthy">
            {Math.round((INVENTORY_SUMMARY.runningResources / INVENTORY_SUMMARY.totalResources) * 100)}%
          </span>
        </div>
        <div className="stat-card">
          <div className="stat-icon providers">
            <Cloud size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{INVENTORY_SUMMARY.resourcesByProvider.length}</span>
            <span className="stat-label">Providers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cost">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">${INVENTORY_SUMMARY.totalMonthlyCost.toLocaleString()}</span>
            <span className="stat-label">Monthly Cost</span>
          </div>
        </div>
      </div>

      <nav className="inv__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="inv__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'tags' && renderTags()}
        {activeTab === 'costs' && renderCosts()}
      </main>
    </div>
  );
}
