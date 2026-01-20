'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  Search,
  Filter,
  Plus,
  Settings,
  RefreshCw,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Tag,
  Package,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Calendar,
  User,
  Zap,
  Info,
  Hash,
  Type,
  List,
  ToggleLeft,
  Binary,
  FileText,
  Link2,
  XCircle,
  History
} from 'lucide-react';
import './feature-store.css';

interface Feature {
  id: string;
  name: string;
  description: string;
  type: 'numerical' | 'categorical' | 'boolean' | 'timestamp' | 'embedding' | 'text';
  dataType: string;
  entity: string;
  featureGroup: string;
  version: number;
  status: 'active' | 'deprecated' | 'experimental' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  statistics: {
    min?: number;
    max?: number;
    mean?: number;
    stdDev?: number;
    nullPercent: number;
    uniqueValues?: number;
    distribution?: { value: string; count: number }[];
  };
  lineage: {
    sources: string[];
    transformations: string[];
  };
  usage: {
    modelsUsing: number;
    pipelinesUsing: number;
    lastAccessed: string;
    accessCount: number;
  };
}

interface FeatureGroup {
  id: string;
  name: string;
  description: string;
  entity: string;
  features: number;
  version: number;
  status: 'online' | 'offline' | 'both';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  onlineStore: boolean;
  offlineStore: boolean;
  ttl?: string;
  schema: { name: string; type: string }[];
}

interface Entity {
  id: string;
  name: string;
  description: string;
  joinKeys: string[];
  featureGroups: number;
  features: number;
}

interface FeatureService {
  id: string;
  name: string;
  description: string;
  features: string[];
  version: string;
  status: 'deployed' | 'staging' | 'development';
  endpoint?: string;
  latencyP50: number;
  latencyP99: number;
  requestsPerSecond: number;
}

const FEATURES: Feature[] = [
  {
    id: 'feat-001',
    name: 'user_transaction_count_7d',
    description: 'Total number of transactions in the last 7 days',
    type: 'numerical',
    dataType: 'INT64',
    entity: 'user',
    featureGroup: 'user_transaction_features',
    version: 3,
    status: 'active',
    createdBy: 'data-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['fraud', 'transactions', 'user-behavior'],
    statistics: {
      min: 0,
      max: 1523,
      mean: 45.7,
      stdDev: 89.3,
      nullPercent: 0.02,
      uniqueValues: 892
    },
    lineage: {
      sources: ['raw_transactions', 'user_events'],
      transformations: ['window_7d', 'count_aggregation']
    },
    usage: {
      modelsUsing: 8,
      pipelinesUsing: 3,
      lastAccessed: '2024-01-15T16:45:00Z',
      accessCount: 125000
    }
  },
  {
    id: 'feat-002',
    name: 'user_avg_transaction_amount_30d',
    description: 'Average transaction amount over the last 30 days',
    type: 'numerical',
    dataType: 'FLOAT64',
    entity: 'user',
    featureGroup: 'user_transaction_features',
    version: 2,
    status: 'active',
    createdBy: 'data-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
    tags: ['fraud', 'transactions', 'amounts'],
    statistics: {
      min: 0,
      max: 15000,
      mean: 234.56,
      stdDev: 456.78,
      nullPercent: 0.05
    },
    lineage: {
      sources: ['raw_transactions'],
      transformations: ['window_30d', 'mean_aggregation']
    },
    usage: {
      modelsUsing: 12,
      pipelinesUsing: 5,
      lastAccessed: '2024-01-15T16:30:00Z',
      accessCount: 98000
    }
  },
  {
    id: 'feat-003',
    name: 'user_is_premium',
    description: 'Flag indicating if user has premium subscription',
    type: 'boolean',
    dataType: 'BOOL',
    entity: 'user',
    featureGroup: 'user_profile_features',
    version: 1,
    status: 'active',
    createdBy: 'product-team',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    tags: ['user', 'subscription', 'premium'],
    statistics: {
      nullPercent: 0,
      distribution: [
        { value: 'true', count: 45000 },
        { value: 'false', count: 155000 }
      ]
    },
    lineage: {
      sources: ['user_subscriptions'],
      transformations: []
    },
    usage: {
      modelsUsing: 15,
      pipelinesUsing: 8,
      lastAccessed: '2024-01-15T17:00:00Z',
      accessCount: 450000
    }
  },
  {
    id: 'feat-004',
    name: 'product_category_embedding',
    description: '128-dimensional embedding of product category',
    type: 'embedding',
    dataType: 'ARRAY<FLOAT64>',
    entity: 'product',
    featureGroup: 'product_embeddings',
    version: 5,
    status: 'active',
    createdBy: 'ml-team',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
    tags: ['embedding', 'product', 'recommendations'],
    statistics: {
      nullPercent: 0.01
    },
    lineage: {
      sources: ['product_catalog', 'category_hierarchy'],
      transformations: ['word2vec_model', 'normalize']
    },
    usage: {
      modelsUsing: 6,
      pipelinesUsing: 2,
      lastAccessed: '2024-01-15T15:00:00Z',
      accessCount: 78000
    }
  },
  {
    id: 'feat-005',
    name: 'user_last_login_timestamp',
    description: 'Timestamp of the last user login',
    type: 'timestamp',
    dataType: 'TIMESTAMP',
    entity: 'user',
    featureGroup: 'user_activity_features',
    version: 1,
    status: 'active',
    createdBy: 'data-team',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    tags: ['user', 'activity', 'engagement'],
    statistics: {
      nullPercent: 0.1
    },
    lineage: {
      sources: ['user_sessions'],
      transformations: ['max_timestamp']
    },
    usage: {
      modelsUsing: 4,
      pipelinesUsing: 2,
      lastAccessed: '2024-01-15T14:00:00Z',
      accessCount: 56000
    }
  },
  {
    id: 'feat-006',
    name: 'user_preferred_category',
    description: 'Most frequently purchased product category',
    type: 'categorical',
    dataType: 'STRING',
    entity: 'user',
    featureGroup: 'user_preference_features',
    version: 2,
    status: 'experimental',
    createdBy: 'rec-team',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-14T12:00:00Z',
    tags: ['user', 'preferences', 'recommendations'],
    statistics: {
      nullPercent: 0.15,
      uniqueValues: 24,
      distribution: [
        { value: 'Electronics', count: 45000 },
        { value: 'Clothing', count: 38000 },
        { value: 'Home & Garden', count: 32000 },
        { value: 'Sports', count: 28000 },
        { value: 'Other', count: 57000 }
      ]
    },
    lineage: {
      sources: ['order_items', 'product_catalog'],
      transformations: ['mode_aggregation']
    },
    usage: {
      modelsUsing: 3,
      pipelinesUsing: 1,
      lastAccessed: '2024-01-15T11:00:00Z',
      accessCount: 23000
    }
  }
];

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'fg-001',
    name: 'user_transaction_features',
    description: 'Aggregated transaction features for users',
    entity: 'user',
    features: 12,
    version: 3,
    status: 'both',
    createdBy: 'data-team',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['transactions', 'fraud', 'core'],
    onlineStore: true,
    offlineStore: true,
    ttl: '7d',
    schema: [
      { name: 'user_id', type: 'STRING' },
      { name: 'transaction_count_7d', type: 'INT64' },
      { name: 'avg_amount_30d', type: 'FLOAT64' },
      { name: 'max_amount_30d', type: 'FLOAT64' }
    ]
  },
  {
    id: 'fg-002',
    name: 'user_profile_features',
    description: 'Static user profile attributes',
    entity: 'user',
    features: 8,
    version: 2,
    status: 'both',
    createdBy: 'product-team',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    tags: ['profile', 'user', 'static'],
    onlineStore: true,
    offlineStore: true,
    schema: [
      { name: 'user_id', type: 'STRING' },
      { name: 'is_premium', type: 'BOOL' },
      { name: 'account_age_days', type: 'INT64' },
      { name: 'verified_email', type: 'BOOL' }
    ]
  },
  {
    id: 'fg-003',
    name: 'product_embeddings',
    description: 'Vector embeddings for products',
    entity: 'product',
    features: 4,
    version: 5,
    status: 'offline',
    createdBy: 'ml-team',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
    tags: ['embeddings', 'ml', 'recommendations'],
    onlineStore: false,
    offlineStore: true,
    schema: [
      { name: 'product_id', type: 'STRING' },
      { name: 'category_embedding', type: 'ARRAY<FLOAT64>' },
      { name: 'description_embedding', type: 'ARRAY<FLOAT64>' }
    ]
  },
  {
    id: 'fg-004',
    name: 'user_activity_features',
    description: 'Real-time user activity signals',
    entity: 'user',
    features: 6,
    version: 1,
    status: 'online',
    createdBy: 'data-team',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    tags: ['activity', 'real-time', 'engagement'],
    onlineStore: true,
    offlineStore: false,
    ttl: '24h',
    schema: [
      { name: 'user_id', type: 'STRING' },
      { name: 'last_login', type: 'TIMESTAMP' },
      { name: 'session_count_today', type: 'INT64' }
    ]
  }
];

const ENTITIES: Entity[] = [
  { id: 'ent-001', name: 'user', description: 'User entity with user_id as key', joinKeys: ['user_id'], featureGroups: 4, features: 26 },
  { id: 'ent-002', name: 'product', description: 'Product entity with product_id as key', joinKeys: ['product_id'], featureGroups: 2, features: 12 },
  { id: 'ent-003', name: 'transaction', description: 'Transaction entity', joinKeys: ['transaction_id'], featureGroups: 1, features: 8 },
  { id: 'ent-004', name: 'session', description: 'User session entity', joinKeys: ['session_id', 'user_id'], featureGroups: 1, features: 5 }
];

const FEATURE_SERVICES: FeatureService[] = [
  {
    id: 'svc-001',
    name: 'fraud-detection-service',
    description: 'Feature service for real-time fraud detection',
    features: ['user_transaction_count_7d', 'user_avg_transaction_amount_30d', 'user_is_premium'],
    version: '2.1.0',
    status: 'deployed',
    endpoint: 'https://features.cube.io/fraud-detection',
    latencyP50: 12,
    latencyP99: 45,
    requestsPerSecond: 8450
  },
  {
    id: 'svc-002',
    name: 'recommendation-service',
    description: 'Feature service for product recommendations',
    features: ['product_category_embedding', 'user_preferred_category'],
    version: '1.5.0',
    status: 'deployed',
    endpoint: 'https://features.cube.io/recommendations',
    latencyP50: 18,
    latencyP99: 67,
    requestsPerSecond: 5230
  },
  {
    id: 'svc-003',
    name: 'engagement-scoring-service',
    description: 'Feature service for user engagement scoring',
    features: ['user_last_login_timestamp', 'user_is_premium'],
    version: '1.0.0-beta',
    status: 'staging',
    latencyP50: 8,
    latencyP99: 25,
    requestsPerSecond: 120
  }
];

export default function FeatureStorePage() {
  const [activeTab, setActiveTab] = useState<'features' | 'groups' | 'entities' | 'services' | 'lineage'>('features');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FeatureGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'numerical': return <Hash size={14} />;
      case 'categorical': return <List size={14} />;
      case 'boolean': return <ToggleLeft size={14} />;
      case 'timestamp': return <Clock size={14} />;
      case 'embedding': return <Binary size={14} />;
      case 'text': return <Type size={14} />;
      default: return <Database size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'deployed':
      case 'online': return 'success';
      case 'experimental':
      case 'staging': return 'warning';
      case 'deprecated':
      case 'archived':
      case 'offline': return 'muted';
      case 'both': return 'info';
      default: return 'default';
    }
  };

  const filteredFeatures = FEATURES.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const renderFeaturesSection = () => (
    <div className="features-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="numerical">Numerical</option>
            <option value="categorical">Categorical</option>
            <option value="boolean">Boolean</option>
            <option value="timestamp">Timestamp</option>
            <option value="embedding">Embedding</option>
            <option value="text">Text</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="experimental">Experimental</option>
            <option value="deprecated">Deprecated</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Feature
          </button>
        </div>
      </div>

      <div className="features-table">
        <div className="table-header">
          <span>Feature Name</span>
          <span>Type</span>
          <span>Entity</span>
          <span>Status</span>
          <span>Version</span>
          <span>Null %</span>
          <span>Models</span>
          <span>Actions</span>
        </div>
        {filteredFeatures.map(feature => (
          <div 
            key={feature.id} 
            className="table-row"
            onClick={() => setSelectedFeature(feature)}
          >
            <div className="feature-name-cell">
              {getTypeIcon(feature.type)}
              <div>
                <span className="name">{feature.name}</span>
                <span className="description">{feature.description}</span>
              </div>
            </div>
            <span className={`type-badge ${feature.type}`}>{feature.type}</span>
            <span className="entity-badge">{feature.entity}</span>
            <span className={`status-badge ${getStatusColor(feature.status)}`}>{feature.status}</span>
            <span className="version">v{feature.version}</span>
            <span className="null-percent">{feature.statistics.nullPercent}%</span>
            <span className="models-count">{feature.usage.modelsUsing}</span>
            <div className="actions-cell">
              <button className="btn-icon small" title="View">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Edit">
                <Edit size={14} />
              </button>
              <button className="btn-icon small" title="Copy Name">
                <Copy size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGroupsSection = () => (
    <div className="groups-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search feature groups..." />
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Feature Group
          </button>
        </div>
      </div>

      <div className="groups-grid">
        {FEATURE_GROUPS.map(group => (
          <div key={group.id} className="group-card">
            <div className="group-header">
              <div className="group-info">
                <Layers size={18} />
                <div>
                  <h4>{group.name}</h4>
                  <p>{group.description}</p>
                </div>
              </div>
              <span className={`store-badge ${group.status}`}>
                {group.status === 'both' ? 'Online + Offline' : group.status}
              </span>
            </div>

            <div className="group-stats">
              <div className="stat">
                <span className="stat-value">{group.features}</span>
                <span className="stat-label">Features</span>
              </div>
              <div className="stat">
                <span className="stat-value">v{group.version}</span>
                <span className="stat-label">Version</span>
              </div>
              <div className="stat">
                <span className="stat-value">{group.entity}</span>
                <span className="stat-label">Entity</span>
              </div>
              {group.ttl && (
                <div className="stat">
                  <span className="stat-value">{group.ttl}</span>
                  <span className="stat-label">TTL</span>
                </div>
              )}
            </div>

            <div className="group-stores">
              <div className={`store-indicator ${group.onlineStore ? 'active' : ''}`}>
                <Zap size={14} />
                Online Store
              </div>
              <div className={`store-indicator ${group.offlineStore ? 'active' : ''}`}>
                <Database size={14} />
                Offline Store
              </div>
            </div>

            <div className="group-schema">
              <button 
                className="schema-toggle"
                onClick={() => toggleGroup(group.id)}
              >
                {expandedGroups.includes(group.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Schema ({group.schema.length} columns)
              </button>
              {expandedGroups.includes(group.id) && (
                <div className="schema-list">
                  {group.schema.map(col => (
                    <div key={col.name} className="schema-item">
                      <span className="col-name">{col.name}</span>
                      <span className="col-type">{col.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="group-tags">
              {group.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="group-footer">
              <span className="created-by">
                <User size={12} /> {group.createdBy}
              </span>
              <span className="updated">
                <Clock size={12} /> {new Date(group.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEntitiesSection = () => (
    <div className="entities-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search entities..." />
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Entity
          </button>
        </div>
      </div>

      <div className="entities-list">
        {ENTITIES.map(entity => (
          <div key={entity.id} className="entity-card">
            <div className="entity-icon">
              <Package size={24} />
            </div>
            <div className="entity-info">
              <h4>{entity.name}</h4>
              <p>{entity.description}</p>
              <div className="join-keys">
                <span className="label">Join Keys:</span>
                {entity.joinKeys.map(key => (
                  <span key={key} className="key">{key}</span>
                ))}
              </div>
            </div>
            <div className="entity-stats">
              <div className="stat">
                <span className="value">{entity.featureGroups}</span>
                <span className="label">Groups</span>
              </div>
              <div className="stat">
                <span className="value">{entity.features}</span>
                <span className="label">Features</span>
              </div>
            </div>
            <div className="entity-actions">
              <button className="btn-icon small">
                <Eye size={14} />
              </button>
              <button className="btn-icon small">
                <Edit size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderServicesSection = () => (
    <div className="services-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search services..." />
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary">
            <Plus size={16} />
            New Service
          </button>
        </div>
      </div>

      <div className="services-grid">
        {FEATURE_SERVICES.map(service => (
          <div key={service.id} className={`service-card ${service.status}`}>
            <div className="service-header">
              <div className="service-title">
                <Zap size={18} />
                <div>
                  <h4>{service.name}</h4>
                  <p>{service.description}</p>
                </div>
              </div>
              <span className={`status-badge ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </div>

            <div className="service-features">
              <span className="label">Features ({service.features.length})</span>
              <div className="feature-list">
                {service.features.map(feat => (
                  <span key={feat} className="feature-tag">{feat}</span>
                ))}
              </div>
            </div>

            {service.endpoint && (
              <div className="service-endpoint">
                <Link2 size={14} />
                <span>{service.endpoint}</span>
                <button className="btn-icon small">
                  <Copy size={12} />
                </button>
              </div>
            )}

            <div className="service-metrics">
              <div className="metric">
                <span className="value">{service.latencyP50}ms</span>
                <span className="label">P50 Latency</span>
              </div>
              <div className="metric">
                <span className="value">{service.latencyP99}ms</span>
                <span className="label">P99 Latency</span>
              </div>
              <div className="metric">
                <span className="value">{service.requestsPerSecond.toLocaleString()}</span>
                <span className="label">RPS</span>
              </div>
            </div>

            <div className="service-footer">
              <span className="version">v{service.version}</span>
              <div className="service-actions">
                <button className="btn-outline small">
                  <ExternalLink size={14} />
                  Test
                </button>
                <button className="btn-outline small">
                  <Settings size={14} />
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLineageSection = () => (
    <div className="lineage-section">
      <div className="lineage-placeholder">
        <GitBranch size={64} />
        <h4>Feature Lineage Graph</h4>
        <p>Visualize data flow from sources through transformations to features</p>
        <button className="btn-primary">
          <Activity size={16} />
          Generate Lineage Graph
        </button>
      </div>
    </div>
  );

  return (
    <div className="feature-store">
      <div className="fs__header">
        <div className="fs__title-section">
          <div className="fs__icon">
            <Database size={28} />
          </div>
          <div>
            <h1>Feature Store</h1>
            <p>Centralized repository for ML features with versioning and lineage</p>
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
          <button className="btn-primary">
            <Plus size={16} />
            Register Feature
          </button>
        </div>
      </div>

      <div className="fs__stats">
        <div className="stat-card">
          <div className="stat-icon features-icon">
            <Tag size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{FEATURES.length}</span>
            <span className="stat-label">Total Features</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon groups-icon">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{FEATURE_GROUPS.length}</span>
            <span className="stat-label">Feature Groups</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon entities-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{ENTITIES.length}</span>
            <span className="stat-label">Entities</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon services-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{FEATURE_SERVICES.filter(s => s.status === 'deployed').length}</span>
            <span className="stat-label">Active Services</span>
          </div>
        </div>
      </div>

      <div className="fs__tabs">
        <button 
          className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <Tag size={16} />
          Features
          <span className="tab-badge">{FEATURES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Layers size={16} />
          Feature Groups
          <span className="tab-badge">{FEATURE_GROUPS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
          onClick={() => setActiveTab('entities')}
        >
          <Package size={16} />
          Entities
          <span className="tab-badge">{ENTITIES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Zap size={16} />
          Feature Services
          <span className="tab-badge">{FEATURE_SERVICES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'lineage' ? 'active' : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          <GitBranch size={16} />
          Lineage
        </button>
      </div>

      <div className="fs__content">
        {activeTab === 'features' && renderFeaturesSection()}
        {activeTab === 'groups' && renderGroupsSection()}
        {activeTab === 'entities' && renderEntitiesSection()}
        {activeTab === 'services' && renderServicesSection()}
        {activeTab === 'lineage' && renderLineageSection()}
      </div>

      {selectedFeature && (
        <div className="feature-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              {getTypeIcon(selectedFeature.type)}
              <h3>{selectedFeature.name}</h3>
            </div>
            <button className="close-btn" onClick={() => setSelectedFeature(null)}>
              <XCircle size={18} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-section">
              <h4>Overview</h4>
              <p>{selectedFeature.description}</p>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Type</span>
                  <span className="value">{selectedFeature.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Data Type</span>
                  <span className="value">{selectedFeature.dataType}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Entity</span>
                  <span className="value">{selectedFeature.entity}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Feature Group</span>
                  <span className="value">{selectedFeature.featureGroup}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Version</span>
                  <span className="value">v{selectedFeature.version}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status</span>
                  <span className={`status-badge ${getStatusColor(selectedFeature.status)}`}>
                    {selectedFeature.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Statistics</h4>
              <div className="stats-grid">
                {selectedFeature.statistics.min !== undefined && (
                  <div className="stat-item">
                    <span className="label">Min</span>
                    <span className="value">{selectedFeature.statistics.min}</span>
                  </div>
                )}
                {selectedFeature.statistics.max !== undefined && (
                  <div className="stat-item">
                    <span className="label">Max</span>
                    <span className="value">{selectedFeature.statistics.max}</span>
                  </div>
                )}
                {selectedFeature.statistics.mean !== undefined && (
                  <div className="stat-item">
                    <span className="label">Mean</span>
                    <span className="value">{selectedFeature.statistics.mean}</span>
                  </div>
                )}
                {selectedFeature.statistics.stdDev !== undefined && (
                  <div className="stat-item">
                    <span className="label">Std Dev</span>
                    <span className="value">{selectedFeature.statistics.stdDev}</span>
                  </div>
                )}
                <div className="stat-item">
                  <span className="label">Null %</span>
                  <span className="value">{selectedFeature.statistics.nullPercent}%</span>
                </div>
                {selectedFeature.statistics.uniqueValues && (
                  <div className="stat-item">
                    <span className="label">Unique Values</span>
                    <span className="value">{selectedFeature.statistics.uniqueValues}</span>
                  </div>
                )}
              </div>

              {selectedFeature.statistics.distribution && (
                <div className="distribution-chart">
                  <span className="chart-title">Value Distribution</span>
                  {selectedFeature.statistics.distribution.map(d => (
                    <div key={d.value} className="dist-bar">
                      <span className="dist-label">{d.value}</span>
                      <div className="dist-bar-bg">
                        <div 
                          className="dist-bar-fill"
                          style={{ 
                            width: `${(d.count / Math.max(...selectedFeature.statistics.distribution!.map(x => x.count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="dist-count">{d.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-section">
              <h4>Lineage</h4>
              <div className="lineage-info">
                <div className="lineage-group">
                  <span className="label">Sources</span>
                  <div className="lineage-items">
                    {selectedFeature.lineage.sources.map(src => (
                      <span key={src} className="lineage-item source">{src}</span>
                    ))}
                  </div>
                </div>
                {selectedFeature.lineage.transformations.length > 0 && (
                  <div className="lineage-group">
                    <span className="label">Transformations</span>
                    <div className="lineage-items">
                      {selectedFeature.lineage.transformations.map(t => (
                        <span key={t} className="lineage-item transform">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h4>Usage</h4>
              <div className="usage-grid">
                <div className="usage-item">
                  <Activity size={16} />
                  <span className="value">{selectedFeature.usage.modelsUsing}</span>
                  <span className="label">Models Using</span>
                </div>
                <div className="usage-item">
                  <GitBranch size={16} />
                  <span className="value">{selectedFeature.usage.pipelinesUsing}</span>
                  <span className="label">Pipelines Using</span>
                </div>
                <div className="usage-item">
                  <TrendingUp size={16} />
                  <span className="value">{selectedFeature.usage.accessCount.toLocaleString()}</span>
                  <span className="label">Total Accesses</span>
                </div>
              </div>
              <div className="last-accessed">
                <Clock size={14} />
                Last accessed: {new Date(selectedFeature.usage.lastAccessed).toLocaleString()}
              </div>
            </div>

            <div className="detail-section">
              <h4>Tags</h4>
              <div className="tags-list">
                {selectedFeature.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-outline">
                <History size={16} />
                View History
              </button>
              <button className="btn-outline">
                <Edit size={16} />
                Edit
              </button>
              <button className="btn-primary">
                <ExternalLink size={16} />
                Use in Notebook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
