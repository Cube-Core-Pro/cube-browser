'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Table,
  Layers,
  Link,
  FileText,
  Clock,
  Tag,
  User,
  Calendar,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Upload,
  Star,
  StarOff,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BarChart3,
  GitBranch,
  ExternalLink,
  Copy,
  History,
  Settings,
  Lock,
  Unlock,
  Folder,
  FolderOpen,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import './data-catalog.css';

// Interfaces
interface DataColumn {
  name: string;
  type: string;
  description: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  stats?: {
    nullCount: number;
    uniqueCount: number;
    minValue?: string | number;
    maxValue?: string | number;
  };
}

interface DataLineage {
  upstreamSources: string[];
  downstreamConsumers: string[];
}

interface DataQuality {
  score: number;
  completeness: number;
  accuracy: number;
  freshness: number;
  lastChecked: string;
  issues: number;
}

interface DataAsset {
  id: string;
  name: string;
  displayName: string;
  type: 'table' | 'view' | 'file' | 'stream' | 'api';
  format?: 'parquet' | 'csv' | 'json' | 'avro' | 'delta';
  database: string;
  schema: string;
  description: string;
  owner: string;
  domain: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  tags: string[];
  columns: DataColumn[];
  lineage: DataLineage;
  quality: DataQuality;
  rowCount: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  usageCount: number;
  isFavorite?: boolean;
  documentation?: string;
}

interface DataDomain {
  id: string;
  name: string;
  description: string;
  owner: string;
  assetCount: number;
  color: string;
}

// Sample Data
const SAMPLE_DOMAINS: DataDomain[] = [
  { id: 'dom-001', name: 'Customer Data', description: 'All customer-related data assets', owner: 'Data Team', assetCount: 45, color: '#3b82f6' },
  { id: 'dom-002', name: 'Transactions', description: 'Financial and transaction data', owner: 'Finance Team', assetCount: 32, color: '#10b981' },
  { id: 'dom-003', name: 'Product', description: 'Product catalog and inventory', owner: 'Product Team', assetCount: 28, color: '#f59e0b' },
  { id: 'dom-004', name: 'Analytics', description: 'Derived analytics and ML datasets', owner: 'Analytics Team', assetCount: 56, color: '#8b5cf6' },
  { id: 'dom-005', name: 'Marketing', description: 'Marketing campaigns and attribution', owner: 'Marketing Team', assetCount: 21, color: '#ec4899' }
];

const SAMPLE_ASSETS: DataAsset[] = [
  {
    id: 'asset-001',
    name: 'dim_customers',
    displayName: 'Customer Dimension Table',
    type: 'table',
    database: 'data_warehouse',
    schema: 'dimensions',
    description: 'Master customer dimension table with demographic and behavioral attributes. Updated daily from CRM and transaction systems.',
    owner: 'Maria Chen',
    domain: 'Customer Data',
    classification: 'confidential',
    tags: ['pii', 'master-data', 'dimension', 'daily-refresh'],
    columns: [
      { name: 'customer_id', type: 'STRING', description: 'Unique customer identifier', nullable: false, isPrimaryKey: true, stats: { nullCount: 0, uniqueCount: 2450000 } },
      { name: 'email', type: 'STRING', description: 'Customer email address', nullable: true, stats: { nullCount: 12500, uniqueCount: 2430000 } },
      { name: 'full_name', type: 'STRING', description: 'Customer full name', nullable: false, stats: { nullCount: 0, uniqueCount: 2380000 } },
      { name: 'country_code', type: 'STRING', description: 'ISO country code', nullable: false, stats: { nullCount: 0, uniqueCount: 195 } },
      { name: 'customer_since', type: 'DATE', description: 'Date customer was acquired', nullable: false, stats: { nullCount: 0, uniqueCount: 3650, minValue: '2018-01-01', maxValue: '2025-01-28' } },
      { name: 'lifetime_value', type: 'DECIMAL(12,2)', description: 'Customer lifetime value in USD', nullable: true, stats: { nullCount: 50000, uniqueCount: 1850000, minValue: 0, maxValue: 245000 } },
      { name: 'segment', type: 'STRING', description: 'Customer segment classification', nullable: false, stats: { nullCount: 0, uniqueCount: 5 } },
      { name: 'is_active', type: 'BOOLEAN', description: 'Whether customer is active', nullable: false, stats: { nullCount: 0, uniqueCount: 2 } }
    ],
    lineage: {
      upstreamSources: ['crm.salesforce_contacts', 'raw.payment_profiles', 'analytics.customer_segments'],
      downstreamConsumers: ['analytics.customer_360', 'ml.churn_features', 'reports.customer_dashboard']
    },
    quality: {
      score: 94,
      completeness: 97,
      accuracy: 98,
      freshness: 100,
      lastChecked: '2025-01-28T06:00:00Z',
      issues: 2
    },
    rowCount: 2450000,
    sizeBytes: 1560000000,
    createdAt: '2022-03-15T10:00:00Z',
    updatedAt: '2025-01-28T05:30:00Z',
    lastAccessedAt: '2025-01-28T14:22:00Z',
    usageCount: 1250,
    isFavorite: true,
    documentation: 'https://docs.internal/data/dim_customers'
  },
  {
    id: 'asset-002',
    name: 'fact_transactions',
    displayName: 'Transaction Fact Table',
    type: 'table',
    database: 'data_warehouse',
    schema: 'facts',
    description: 'Transactional fact table containing all payment and order transactions. Partitioned by transaction date.',
    owner: 'James Wilson',
    domain: 'Transactions',
    classification: 'restricted',
    tags: ['pci', 'financial', 'fact-table', 'partitioned', 'streaming'],
    columns: [
      { name: 'transaction_id', type: 'STRING', description: 'Unique transaction identifier', nullable: false, isPrimaryKey: true, stats: { nullCount: 0, uniqueCount: 125000000 } },
      { name: 'customer_id', type: 'STRING', description: 'Reference to customer', nullable: false, isForeignKey: true, stats: { nullCount: 0, uniqueCount: 2100000 } },
      { name: 'transaction_date', type: 'TIMESTAMP', description: 'Transaction timestamp', nullable: false, stats: { nullCount: 0, uniqueCount: 85000000 } },
      { name: 'amount', type: 'DECIMAL(12,2)', description: 'Transaction amount in USD', nullable: false, stats: { nullCount: 0, uniqueCount: 45000, minValue: 0.01, maxValue: 99999.99 } },
      { name: 'currency', type: 'STRING', description: 'Original transaction currency', nullable: false, stats: { nullCount: 0, uniqueCount: 45 } },
      { name: 'status', type: 'STRING', description: 'Transaction status', nullable: false, stats: { nullCount: 0, uniqueCount: 6 } }
    ],
    lineage: {
      upstreamSources: ['kafka.payment_events', 'raw.stripe_charges', 'raw.paypal_transactions'],
      downstreamConsumers: ['analytics.revenue_metrics', 'ml.fraud_detection', 'reports.finance_dashboard']
    },
    quality: {
      score: 99,
      completeness: 100,
      accuracy: 99,
      freshness: 100,
      lastChecked: '2025-01-28T14:00:00Z',
      issues: 0
    },
    rowCount: 125000000,
    sizeBytes: 45000000000,
    createdAt: '2021-06-01T10:00:00Z',
    updatedAt: '2025-01-28T14:15:00Z',
    lastAccessedAt: '2025-01-28T14:30:00Z',
    usageCount: 3420,
    isFavorite: true
  },
  {
    id: 'asset-003',
    name: 'product_embeddings',
    displayName: 'Product Embeddings Dataset',
    type: 'file',
    format: 'parquet',
    database: 's3://ml-features',
    schema: 'embeddings',
    description: 'Pre-computed product embeddings from the recommendation model. Updated weekly after model retraining.',
    owner: 'Alex Thompson',
    domain: 'Analytics',
    classification: 'internal',
    tags: ['ml', 'embeddings', 'recommendation', 'weekly-refresh'],
    columns: [
      { name: 'product_id', type: 'STRING', description: 'Product identifier', nullable: false, isPrimaryKey: true, stats: { nullCount: 0, uniqueCount: 450000 } },
      { name: 'embedding', type: 'ARRAY<FLOAT>', description: '256-dimensional embedding vector', nullable: false, stats: { nullCount: 0, uniqueCount: 450000 } },
      { name: 'model_version', type: 'STRING', description: 'Model version used', nullable: false, stats: { nullCount: 0, uniqueCount: 12 } },
      { name: 'created_at', type: 'TIMESTAMP', description: 'Embedding creation timestamp', nullable: false, stats: { nullCount: 0, uniqueCount: 52 } }
    ],
    lineage: {
      upstreamSources: ['data_warehouse.dim_products', 'data_warehouse.fact_interactions'],
      downstreamConsumers: ['ml.recommendation_service', 'search.semantic_search']
    },
    quality: {
      score: 92,
      completeness: 100,
      accuracy: 95,
      freshness: 85,
      lastChecked: '2025-01-27T10:00:00Z',
      issues: 1
    },
    rowCount: 450000,
    sizeBytes: 2800000000,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2025-01-25T08:00:00Z',
    lastAccessedAt: '2025-01-28T12:00:00Z',
    usageCount: 856
  },
  {
    id: 'asset-004',
    name: 'user_events_stream',
    displayName: 'Real-time User Events Stream',
    type: 'stream',
    database: 'kafka',
    schema: 'events',
    description: 'Real-time stream of user interaction events from web and mobile applications.',
    owner: 'Sophie Martin',
    domain: 'Analytics',
    classification: 'internal',
    tags: ['streaming', 'events', 'real-time', 'clickstream'],
    columns: [
      { name: 'event_id', type: 'STRING', description: 'Unique event identifier', nullable: false, stats: { nullCount: 0, uniqueCount: 0 } },
      { name: 'user_id', type: 'STRING', description: 'User identifier', nullable: true, stats: { nullCount: 0, uniqueCount: 0 } },
      { name: 'session_id', type: 'STRING', description: 'Session identifier', nullable: false, stats: { nullCount: 0, uniqueCount: 0 } },
      { name: 'event_type', type: 'STRING', description: 'Type of event', nullable: false, stats: { nullCount: 0, uniqueCount: 45 } },
      { name: 'event_timestamp', type: 'TIMESTAMP', description: 'Event timestamp', nullable: false, stats: { nullCount: 0, uniqueCount: 0 } },
      { name: 'properties', type: 'JSON', description: 'Event properties', nullable: true, stats: { nullCount: 0, uniqueCount: 0 } }
    ],
    lineage: {
      upstreamSources: ['web.tracking_sdk', 'mobile.analytics_sdk'],
      downstreamConsumers: ['flink.session_aggregator', 'spark.event_processor', 'ml.real_time_features']
    },
    quality: {
      score: 98,
      completeness: 99,
      accuracy: 97,
      freshness: 100,
      lastChecked: '2025-01-28T14:30:00Z',
      issues: 0
    },
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2023-08-01T10:00:00Z',
    updatedAt: '2025-01-28T14:30:00Z',
    lastAccessedAt: '2025-01-28T14:30:00Z',
    usageCount: 2100
  },
  {
    id: 'asset-005',
    name: 'marketing_attribution',
    displayName: 'Marketing Attribution Report',
    type: 'view',
    database: 'data_warehouse',
    schema: 'marketing',
    description: 'Multi-touch attribution view combining campaign data with conversion events. Refreshed hourly.',
    owner: 'David Kim',
    domain: 'Marketing',
    classification: 'internal',
    tags: ['attribution', 'marketing', 'view', 'hourly-refresh'],
    columns: [
      { name: 'attribution_id', type: 'STRING', description: 'Attribution record ID', nullable: false, isPrimaryKey: true, stats: { nullCount: 0, uniqueCount: 8500000 } },
      { name: 'campaign_id', type: 'STRING', description: 'Marketing campaign ID', nullable: false, isForeignKey: true, stats: { nullCount: 0, uniqueCount: 1250 } },
      { name: 'conversion_id', type: 'STRING', description: 'Conversion event ID', nullable: false, stats: { nullCount: 0, uniqueCount: 3200000 } },
      { name: 'touchpoint_type', type: 'STRING', description: 'Type of marketing touchpoint', nullable: false, stats: { nullCount: 0, uniqueCount: 12 } },
      { name: 'attribution_weight', type: 'DECIMAL(5,4)', description: 'Attribution weight (0-1)', nullable: false, stats: { nullCount: 0, uniqueCount: 100, minValue: 0, maxValue: 1 } }
    ],
    lineage: {
      upstreamSources: ['marketing.campaigns', 'events.conversions', 'events.touchpoints'],
      downstreamConsumers: ['reports.marketing_roi', 'analytics.channel_performance']
    },
    quality: {
      score: 88,
      completeness: 95,
      accuracy: 92,
      freshness: 100,
      lastChecked: '2025-01-28T13:00:00Z',
      issues: 3
    },
    rowCount: 8500000,
    sizeBytes: 0,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2025-01-28T13:00:00Z',
    lastAccessedAt: '2025-01-28T14:00:00Z',
    usageCount: 456
  }
];

export default function DataCatalogPage() {
  const [assets, setAssets] = useState<DataAsset[]>(SAMPLE_ASSETS);
  const [domains, setDomains] = useState<DataDomain[]>(SAMPLE_DOMAINS);
  const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'lineage' | 'quality'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['Customer Data']));

  const toggleDomain = (domain: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedDomains(newExpanded);
  };

  const toggleFavorite = (assetId: string) => {
    setAssets(assets.map(a => 
      a.id === assetId ? { ...a, isFavorite: !a.isFavorite } : a
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'table': return <Table size={16} />;
      case 'view': return <Eye size={16} />;
      case 'file': return <FileText size={16} />;
      case 'stream': return <Activity size={16} />;
      case 'api': return <Zap size={16} />;
      default: return <Database size={16} />;
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'public': return <Unlock size={14} className="classification-icon public" />;
      case 'internal': return <Shield size={14} className="classification-icon internal" />;
      case 'confidential': return <Lock size={14} className="classification-icon confidential" />;
      case 'restricted': return <AlertTriangle size={14} className="classification-icon restricted" />;
      default: return <Shield size={14} />;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    if (num === 0) return 'Streaming';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === 'all' || asset.domain === domainFilter;
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesClassification = classificationFilter === 'all' || asset.classification === classificationFilter;
    return matchesSearch && matchesDomain && matchesType && matchesClassification;
  });

  const groupedAssets = domains.map(domain => ({
    ...domain,
    assets: filteredAssets.filter(a => a.domain === domain.name)
  }));

  const stats = {
    totalAssets: assets.length,
    totalDomains: domains.length,
    tablesCount: assets.filter(a => a.type === 'table').length,
    avgQuality: Math.round(assets.reduce((sum, a) => sum + a.quality.score, 0) / assets.length),
    issuesCount: assets.reduce((sum, a) => sum + a.quality.issues, 0)
  };

  return (
    <div className="data-catalog">
      {/* Header */}
      <header className="dc__header">
        <div className="dc__title-section">
          <div className="dc__icon">
            <Database size={28} />
          </div>
          <div>
            <h1>Data Catalog</h1>
            <p>Discover, understand, and govern your data assets</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import Metadata
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Register Asset
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="dc__stats">
        <div className="stat-card">
          <div className="stat-icon assets-icon">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalAssets}</span>
            <span className="stat-label">Data Assets</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon domains-icon">
            <Folder size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalDomains}</span>
            <span className="stat-label">Data Domains</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon tables-icon">
            <Table size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.tablesCount}</span>
            <span className="stat-label">Tables</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon quality-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgQuality}%</span>
            <span className="stat-label">Avg. Quality Score</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dc__tabs">
        <button
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <Folder size={16} />
          Browse
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={16} />
          Search
        </button>
        <button
          className={`tab-btn ${activeTab === 'lineage' ? 'active' : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          <GitBranch size={16} />
          Lineage
        </button>
        <button
          className={`tab-btn ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          <Shield size={16} />
          Quality
          {stats.issuesCount > 0 && <span className="tab-badge warning">{stats.issuesCount}</span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="dc__content">
        {/* Sidebar */}
        <aside className="dc__sidebar">
          <div className="sidebar-header">
            <h3>Data Domains</h3>
          </div>
          <div className="domains-list">
            {domains.map(domain => (
              <div 
                key={domain.id}
                className={`domain-item ${domainFilter === domain.name ? 'active' : ''}`}
                onClick={() => setDomainFilter(domainFilter === domain.name ? 'all' : domain.name)}
              >
                <div className="domain-color" style={{ background: domain.color }}></div>
                <span className="domain-name">{domain.name}</span>
                <span className="domain-count">{domain.assetCount}</span>
              </div>
            ))}
            {domainFilter !== 'all' && (
              <button className="clear-filter" onClick={() => setDomainFilter('all')}>
                Clear filter
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <h4>Classifications</h4>
            <div className="classification-filters">
              <label className="filter-checkbox">
                <input 
                  type="checkbox" 
                  checked={classificationFilter === 'all' || classificationFilter === 'public'}
                  onChange={() => setClassificationFilter(classificationFilter === 'public' ? 'all' : 'public')}
                />
                <Unlock size={14} className="public" />
                <span>Public</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="checkbox"
                  checked={classificationFilter === 'all' || classificationFilter === 'internal'}
                  onChange={() => setClassificationFilter(classificationFilter === 'internal' ? 'all' : 'internal')}
                />
                <Shield size={14} className="internal" />
                <span>Internal</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="checkbox"
                  checked={classificationFilter === 'all' || classificationFilter === 'confidential'}
                  onChange={() => setClassificationFilter(classificationFilter === 'confidential' ? 'all' : 'confidential')}
                />
                <Lock size={14} className="confidential" />
                <span>Confidential</span>
              </label>
              <label className="filter-checkbox">
                <input 
                  type="checkbox"
                  checked={classificationFilter === 'all' || classificationFilter === 'restricted'}
                  onChange={() => setClassificationFilter(classificationFilter === 'restricted' ? 'all' : 'restricted')}
                />
                <AlertTriangle size={14} className="restricted" />
                <span>Restricted</span>
              </label>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Asset Types</h4>
            <div className="type-filters">
              {['table', 'view', 'file', 'stream', 'api'].map(type => (
                <label key={type} className="filter-checkbox">
                  <input 
                    type="checkbox"
                    checked={typeFilter === 'all' || typeFilter === type}
                    onChange={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                  />
                  {getTypeIcon(type)}
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="dc__main">
          {/* Search & Filters */}
          <div className="main-toolbar">
            <div className="search-box large">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search data assets by name, description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="toolbar-actions">
              <button className="btn-outline small">
                <Download size={14} />
                Export
              </button>
              <button className="btn-icon">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <div className="browse-section">
              {groupedAssets.filter(g => g.assets.length > 0).map(group => (
                <div key={group.id} className="domain-group">
                  <div 
                    className="group-header"
                    onClick={() => toggleDomain(group.name)}
                  >
                    <div className="group-title">
                      {expandedDomains.has(group.name) 
                        ? <ChevronDown size={16} />
                        : <ChevronRight size={16} />
                      }
                      <div className="domain-badge" style={{ background: group.color }}></div>
                      <h4>{group.name}</h4>
                      <span className="asset-count">{group.assets.length} assets</span>
                    </div>
                  </div>

                  {expandedDomains.has(group.name) && (
                    <div className="assets-grid">
                      {group.assets.map(asset => (
                        <div 
                          key={asset.id} 
                          className="asset-card"
                          onClick={() => setSelectedAsset(asset)}
                        >
                          <div className="asset-header">
                            <div className="asset-type">
                              {getTypeIcon(asset.type)}
                              <span>{asset.type}</span>
                            </div>
                            <div className="asset-actions">
                              <button 
                                className={`btn-icon small ${asset.isFavorite ? 'favorite' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}
                              >
                                {asset.isFavorite ? <Star size={14} /> : <StarOff size={14} />}
                              </button>
                              {getClassificationIcon(asset.classification)}
                            </div>
                          </div>
                          <h5 className="asset-name">{asset.name}</h5>
                          <p className="asset-display-name">{asset.displayName}</p>
                          <p className="asset-description">{asset.description}</p>
                          <div className="asset-meta">
                            <span className="meta-item">
                              <Table size={12} />
                              {asset.columns.length} columns
                            </span>
                            <span className="meta-item">
                              <BarChart3 size={12} />
                              {formatNumber(asset.rowCount)} rows
                            </span>
                          </div>
                          <div className="asset-quality">
                            <div className="quality-bar">
                              <div 
                                className={`quality-fill ${getQualityColor(asset.quality.score)}`}
                                style={{ width: `${asset.quality.score}%` }}
                              ></div>
                            </div>
                            <span className={`quality-score ${getQualityColor(asset.quality.score)}`}>
                              {asset.quality.score}%
                            </span>
                          </div>
                          <div className="asset-tags">
                            {asset.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                            {asset.tags.length > 3 && (
                              <span className="tag-more">+{asset.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="search-section">
              <div className="search-results">
                <div className="results-header">
                  <span>{filteredAssets.length} results found</span>
                </div>
                <div className="results-table">
                  <div className="table-header">
                    <span>Asset Name</span>
                    <span>Type</span>
                    <span>Domain</span>
                    <span>Owner</span>
                    <span>Quality</span>
                    <span>Updated</span>
                  </div>
                  {filteredAssets.map(asset => (
                    <div 
                      key={asset.id} 
                      className="table-row"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="name-cell">
                        <div className="asset-name-row">
                          {getTypeIcon(asset.type)}
                          <span>{asset.name}</span>
                          {getClassificationIcon(asset.classification)}
                        </div>
                        <span className="asset-path">{asset.database}.{asset.schema}</span>
                      </div>
                      <div className="type-cell">
                        <span className={`type-badge ${asset.type}`}>{asset.type}</span>
                      </div>
                      <div className="domain-cell">{asset.domain}</div>
                      <div className="owner-cell">{asset.owner}</div>
                      <div className="quality-cell">
                        <span className={`quality-badge ${getQualityColor(asset.quality.score)}`}>
                          {asset.quality.score}%
                        </span>
                      </div>
                      <div className="updated-cell">
                        {new Date(asset.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lineage Tab */}
          {activeTab === 'lineage' && (
            <div className="lineage-section">
              <div className="lineage-placeholder">
                <GitBranch size={48} />
                <h3>Data Lineage Explorer</h3>
                <p>Select a data asset to view its upstream and downstream dependencies</p>
                {selectedAsset && (
                  <div className="lineage-preview">
                    <h4>{selectedAsset.name}</h4>
                    <div className="lineage-flow">
                      <div className="lineage-column">
                        <h5>Upstream Sources</h5>
                        {selectedAsset.lineage.upstreamSources.map(source => (
                          <div key={source} className="lineage-node upstream">
                            <Database size={14} />
                            <span>{source}</span>
                          </div>
                        ))}
                      </div>
                      <div className="lineage-center">
                        <div className="current-asset">
                          {getTypeIcon(selectedAsset.type)}
                          <span>{selectedAsset.name}</span>
                        </div>
                      </div>
                      <div className="lineage-column">
                        <h5>Downstream Consumers</h5>
                        {selectedAsset.lineage.downstreamConsumers.map(consumer => (
                          <div key={consumer} className="lineage-node downstream">
                            <Database size={14} />
                            <span>{consumer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quality Tab */}
          {activeTab === 'quality' && (
            <div className="quality-section">
              <div className="quality-overview">
                <div className="quality-chart">
                  <h4>Quality Distribution</h4>
                  <div className="quality-bars">
                    <div className="quality-bar-item">
                      <span className="bar-label">Excellent (90+)</span>
                      <div className="bar-track">
                        <div className="bar-fill excellent" style={{ width: `${(assets.filter(a => a.quality.score >= 90).length / assets.length) * 100}%` }}></div>
                      </div>
                      <span className="bar-count">{assets.filter(a => a.quality.score >= 90).length}</span>
                    </div>
                    <div className="quality-bar-item">
                      <span className="bar-label">Good (70-89)</span>
                      <div className="bar-track">
                        <div className="bar-fill good" style={{ width: `${(assets.filter(a => a.quality.score >= 70 && a.quality.score < 90).length / assets.length) * 100}%` }}></div>
                      </div>
                      <span className="bar-count">{assets.filter(a => a.quality.score >= 70 && a.quality.score < 90).length}</span>
                    </div>
                    <div className="quality-bar-item">
                      <span className="bar-label">Fair (50-69)</span>
                      <div className="bar-track">
                        <div className="bar-fill fair" style={{ width: `${(assets.filter(a => a.quality.score >= 50 && a.quality.score < 70).length / assets.length) * 100}%` }}></div>
                      </div>
                      <span className="bar-count">{assets.filter(a => a.quality.score >= 50 && a.quality.score < 70).length}</span>
                    </div>
                    <div className="quality-bar-item">
                      <span className="bar-label">Poor (&lt;50)</span>
                      <div className="bar-track">
                        <div className="bar-fill poor" style={{ width: `${(assets.filter(a => a.quality.score < 50).length / assets.length) * 100}%` }}></div>
                      </div>
                      <span className="bar-count">{assets.filter(a => a.quality.score < 50).length}</span>
                    </div>
                  </div>
                </div>
                <div className="quality-issues">
                  <h4>Quality Issues</h4>
                  {assets.filter(a => a.quality.issues > 0).map(asset => (
                    <div key={asset.id} className="issue-item">
                      <div className="issue-info">
                        <AlertTriangle size={14} className="issue-icon" />
                        <div>
                          <span className="issue-asset">{asset.name}</span>
                          <span className="issue-count">{asset.quality.issues} issue(s)</span>
                        </div>
                      </div>
                      <button className="btn-outline small">View</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Detail Panel */}
        {selectedAsset && (
          <aside className="dc__detail-panel">
            <div className="detail-header">
              <div className="detail-title">
                {getTypeIcon(selectedAsset.type)}
                <div>
                  <h3>{selectedAsset.name}</h3>
                  <p>{selectedAsset.displayName}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedAsset(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="detail-section">
              <div className="classification-badge" data-level={selectedAsset.classification}>
                {getClassificationIcon(selectedAsset.classification)}
                <span>{selectedAsset.classification}</span>
              </div>
            </div>

            <div className="detail-section">
              <p className="description">{selectedAsset.description}</p>
            </div>

            <div className="detail-section">
              <h4>Properties</h4>
              <div className="properties-grid">
                <div className="property">
                  <span className="property-label">Database</span>
                  <span className="property-value">{selectedAsset.database}</span>
                </div>
                <div className="property">
                  <span className="property-label">Schema</span>
                  <span className="property-value">{selectedAsset.schema}</span>
                </div>
                <div className="property">
                  <span className="property-label">Owner</span>
                  <span className="property-value">{selectedAsset.owner}</span>
                </div>
                <div className="property">
                  <span className="property-label">Domain</span>
                  <span className="property-value">{selectedAsset.domain}</span>
                </div>
                <div className="property">
                  <span className="property-label">Row Count</span>
                  <span className="property-value">{formatNumber(selectedAsset.rowCount)}</span>
                </div>
                <div className="property">
                  <span className="property-label">Size</span>
                  <span className="property-value">{formatBytes(selectedAsset.sizeBytes)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Quality Score</h4>
              <div className="quality-breakdown">
                <div className="quality-overall">
                  <span className={`score ${getQualityColor(selectedAsset.quality.score)}`}>
                    {selectedAsset.quality.score}%
                  </span>
                </div>
                <div className="quality-metrics">
                  <div className="quality-metric">
                    <span>Completeness</span>
                    <div className="metric-bar">
                      <div className="metric-fill" style={{ width: `${selectedAsset.quality.completeness}%` }}></div>
                    </div>
                    <span>{selectedAsset.quality.completeness}%</span>
                  </div>
                  <div className="quality-metric">
                    <span>Accuracy</span>
                    <div className="metric-bar">
                      <div className="metric-fill" style={{ width: `${selectedAsset.quality.accuracy}%` }}></div>
                    </div>
                    <span>{selectedAsset.quality.accuracy}%</span>
                  </div>
                  <div className="quality-metric">
                    <span>Freshness</span>
                    <div className="metric-bar">
                      <div className="metric-fill" style={{ width: `${selectedAsset.quality.freshness}%` }}></div>
                    </div>
                    <span>{selectedAsset.quality.freshness}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Schema ({selectedAsset.columns.length} columns)</h4>
              <div className="schema-table">
                {selectedAsset.columns.slice(0, 5).map(col => (
                  <div key={col.name} className="schema-row">
                    <div className="column-name">
                      {col.isPrimaryKey && <span className="key-badge pk">PK</span>}
                      {col.isForeignKey && <span className="key-badge fk">FK</span>}
                      {col.name}
                    </div>
                    <div className="column-type">{col.type}</div>
                  </div>
                ))}
                {selectedAsset.columns.length > 5 && (
                  <button className="view-all-btn">
                    View all {selectedAsset.columns.length} columns
                  </button>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h4>Tags</h4>
              <div className="tags-list">
                {selectedAsset.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn-primary">
                <Eye size={14} />
                Preview Data
              </button>
              <button className="btn-outline">
                <Copy size={14} />
                Copy Query
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
