'use client';

import React, { useState } from 'react';
import {
  Puzzle,
  Search,
  Plus,
  Check,
  ExternalLink,
  Settings,
  Trash2,
  RefreshCw,
  Star,
  Download,
  Filter,
  Grid,
  List,
  Zap,
  Database,
  Cloud,
  MessageSquare,
  CreditCard,
  Mail,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Users,
  Code,
  Globe,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import './integrations.css';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  popular: boolean;
  featured: boolean;
  connectedAt?: string;
  lastSync?: string;
  syncStatus?: 'success' | 'error' | 'syncing';
  features: string[];
  docsUrl: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

const categories: Category[] = [
  { id: 'all', name: 'All Integrations', icon: <Puzzle size={18} />, count: 48 },
  { id: 'crm', name: 'CRM & Sales', icon: <Users size={18} />, count: 8 },
  { id: 'communication', name: 'Communication', icon: <MessageSquare size={18} />, count: 7 },
  { id: 'storage', name: 'Cloud Storage', icon: <Cloud size={18} />, count: 6 },
  { id: 'database', name: 'Databases', icon: <Database size={18} />, count: 5 },
  { id: 'analytics', name: 'Analytics', icon: <BarChart3 size={18} />, count: 6 },
  { id: 'payment', name: 'Payments', icon: <CreditCard size={18} />, count: 4 },
  { id: 'email', name: 'Email Marketing', icon: <Mail size={18} />, count: 5 },
  { id: 'productivity', name: 'Productivity', icon: <Calendar size={18} />, count: 7 }
];

const integrations: Integration[] = [
  {
    id: '1',
    name: 'Salesforce',
    description: 'Sync leads, contacts, and opportunities with Salesforce CRM',
    icon: '☁️',
    category: 'crm',
    status: 'connected',
    popular: true,
    featured: true,
    connectedAt: '2025-01-15',
    lastSync: '2 minutes ago',
    syncStatus: 'success',
    features: ['Contact Sync', 'Lead Import', 'Opportunity Tracking', 'Custom Fields'],
    docsUrl: '/docs/integrations/salesforce'
  },
  {
    id: '2',
    name: 'HubSpot',
    description: 'Connect your HubSpot CRM for seamless contact management',
    icon: '🧡',
    category: 'crm',
    status: 'connected',
    popular: true,
    featured: false,
    connectedAt: '2025-01-10',
    lastSync: '15 minutes ago',
    syncStatus: 'syncing',
    features: ['Contact Sync', 'Deal Pipeline', 'Email Tracking', 'Forms'],
    docsUrl: '/docs/integrations/hubspot'
  },
  {
    id: '3',
    name: 'Slack',
    description: 'Send notifications and updates to your Slack channels',
    icon: '💬',
    category: 'communication',
    status: 'connected',
    popular: true,
    featured: true,
    connectedAt: '2025-01-01',
    lastSync: '1 hour ago',
    syncStatus: 'success',
    features: ['Notifications', 'Alerts', 'Commands', 'Workflows'],
    docsUrl: '/docs/integrations/slack'
  },
  {
    id: '4',
    name: 'Google Drive',
    description: 'Store and access files directly from Google Drive',
    icon: '📁',
    category: 'storage',
    status: 'available',
    popular: true,
    featured: false,
    features: ['File Sync', 'Folder Access', 'Sharing', 'Export'],
    docsUrl: '/docs/integrations/google-drive'
  },
  {
    id: '5',
    name: 'Stripe',
    description: 'Process payments and manage subscriptions with Stripe',
    icon: '💳',
    category: 'payment',
    status: 'connected',
    popular: true,
    featured: false,
    connectedAt: '2025-01-05',
    lastSync: '5 minutes ago',
    syncStatus: 'success',
    features: ['Payments', 'Subscriptions', 'Invoices', 'Webhooks'],
    docsUrl: '/docs/integrations/stripe'
  },
  {
    id: '6',
    name: 'PostgreSQL',
    description: 'Connect to PostgreSQL databases for data extraction',
    icon: '🐘',
    category: 'database',
    status: 'available',
    popular: false,
    featured: false,
    features: ['Query Builder', 'Data Export', 'Scheduled Syncs', 'SSL Support'],
    docsUrl: '/docs/integrations/postgresql'
  },
  {
    id: '7',
    name: 'MongoDB',
    description: 'Extract and sync data from MongoDB collections',
    icon: '🍃',
    category: 'database',
    status: 'available',
    popular: false,
    featured: false,
    features: ['Collection Sync', 'Aggregation', 'Real-time Updates', 'Atlas Support'],
    docsUrl: '/docs/integrations/mongodb'
  },
  {
    id: '8',
    name: 'Google Analytics',
    description: 'Track and analyze your website traffic and conversions',
    icon: '📊',
    category: 'analytics',
    status: 'connected',
    popular: true,
    featured: false,
    connectedAt: '2025-01-08',
    lastSync: '30 minutes ago',
    syncStatus: 'error',
    features: ['Traffic Reports', 'Conversions', 'Goals', 'Real-time'],
    docsUrl: '/docs/integrations/google-analytics'
  },
  {
    id: '9',
    name: 'Mailchimp',
    description: 'Sync contacts and manage email campaigns',
    icon: '🐵',
    category: 'email',
    status: 'available',
    popular: true,
    featured: false,
    features: ['List Sync', 'Campaign Analytics', 'Automation', 'Templates'],
    docsUrl: '/docs/integrations/mailchimp'
  },
  {
    id: '10',
    name: 'Notion',
    description: 'Sync tasks, databases, and documents with Notion',
    icon: '📝',
    category: 'productivity',
    status: 'available',
    popular: true,
    featured: true,
    features: ['Database Sync', 'Page Export', 'Blocks API', 'Search'],
    docsUrl: '/docs/integrations/notion'
  },
  {
    id: '11',
    name: 'Airtable',
    description: 'Connect your Airtable bases for powerful data automation',
    icon: '📋',
    category: 'productivity',
    status: 'available',
    popular: true,
    featured: false,
    features: ['Base Sync', 'Records', 'Automations', 'Views'],
    docsUrl: '/docs/integrations/airtable'
  },
  {
    id: '12',
    name: 'Twilio',
    description: 'Send SMS and WhatsApp messages via Twilio',
    icon: '📱',
    category: 'communication',
    status: 'coming_soon',
    popular: false,
    featured: false,
    features: ['SMS', 'WhatsApp', 'Voice', 'Video'],
    docsUrl: '/docs/integrations/twilio'
  },
  {
    id: '13',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams for collaboration',
    icon: '👥',
    category: 'communication',
    status: 'available',
    popular: true,
    featured: false,
    features: ['Notifications', 'Channels', 'Meetings', 'Files'],
    docsUrl: '/docs/integrations/microsoft-teams'
  },
  {
    id: '14',
    name: 'Zapier',
    description: 'Connect with 5000+ apps through Zapier automation',
    icon: '⚡',
    category: 'productivity',
    status: 'available',
    popular: true,
    featured: true,
    features: ['Zaps', 'Multi-step', 'Filters', 'Paths'],
    docsUrl: '/docs/integrations/zapier'
  },
  {
    id: '15',
    name: 'AWS S3',
    description: 'Store files and backups in Amazon S3 buckets',
    icon: '🪣',
    category: 'storage',
    status: 'available',
    popular: false,
    featured: false,
    features: ['File Upload', 'Presigned URLs', 'Versioning', 'Lifecycle'],
    docsUrl: '/docs/integrations/aws-s3'
  },
  {
    id: '16',
    name: 'Shopify',
    description: 'Sync products, orders, and customers from Shopify',
    icon: '🛍️',
    category: 'crm',
    status: 'available',
    popular: true,
    featured: false,
    features: ['Products', 'Orders', 'Customers', 'Inventory'],
    docsUrl: '/docs/integrations/shopify'
  }
];

export default function IntegrationsHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConnected = !showConnectedOnly || integration.status === 'connected';
    return matchesCategory && matchesSearch && matchesConnected;
  });

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const featuredIntegrations = integrations.filter(i => i.featured);

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} className="sync-success" />;
      case 'error':
        return <XCircle size={14} className="sync-error" />;
      case 'syncing':
        return <RefreshCw size={14} className="sync-syncing" />;
      default:
        return null;
    }
  };

  return (
    <div className="integrations-hub">
      {/* Header */}
      <div className="integrations-hub__header">
        <div className="integrations-hub__title-section">
          <div className="integrations-hub__icon">
            <Puzzle size={28} />
          </div>
          <div>
            <h1>Integrations Hub</h1>
            <p>Connect your favorite tools and services</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Code size={18} />
            API Docs
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Request Integration
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="integrations-hub__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Puzzle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{integrations.length}</span>
            <span className="stat-label">Total Integrations</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon connected">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{connectedCount}</span>
            <span className="stat-label">Connected</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon available">
            <Download size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{integrations.filter(i => i.status === 'available').length}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon featured">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{featuredIntegrations.length}</span>
            <span className="stat-label">Featured</span>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="featured-section">
        <div className="section-header">
          <h2>
            <Sparkles size={20} />
            Featured Integrations
          </h2>
          <span className="section-badge">Popular</span>
        </div>
        <div className="featured-grid">
          {featuredIntegrations.map(integration => (
            <div 
              key={integration.id} 
              className={`featured-card ${integration.status}`}
              onClick={() => setSelectedIntegration(integration)}
            >
              <div className="featured-icon">{integration.icon}</div>
              <div className="featured-content">
                <h3>{integration.name}</h3>
                <p>{integration.description}</p>
                <div className="featured-features">
                  {integration.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="feature-tag">{feature}</span>
                  ))}
                </div>
              </div>
              <div className="featured-status">
                {integration.status === 'connected' ? (
                  <span className="status-connected">
                    <Check size={14} /> Connected
                  </span>
                ) : (
                  <button className="connect-btn">Connect</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="integrations-hub__main">
        {/* Sidebar */}
        <aside className="categories-sidebar">
          <div className="sidebar-header">
            <h3>Categories</h3>
          </div>
          <nav className="categories-nav">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="integrations-content">
          {/* Toolbar */}
          <div className="content-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="toolbar-actions">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={showConnectedOnly}
                  onChange={(e) => setShowConnectedOnly(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                Connected only
              </label>
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Integrations Grid/List */}
          <div className={`integrations-${viewMode}`}>
            {filteredIntegrations.map(integration => (
              <div 
                key={integration.id} 
                className={`integration-card ${integration.status}`}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="integration-header">
                  <div className="integration-icon">{integration.icon}</div>
                  {integration.popular && (
                    <span className="popular-badge">
                      <Star size={10} /> Popular
                    </span>
                  )}
                </div>
                <div className="integration-body">
                  <h3>{integration.name}</h3>
                  <p>{integration.description}</p>
                  {integration.status === 'connected' && (
                    <div className="sync-info">
                      {getSyncStatusIcon(integration.syncStatus)}
                      <span>Last sync: {integration.lastSync}</span>
                    </div>
                  )}
                </div>
                <div className="integration-footer">
                  {integration.status === 'connected' ? (
                    <div className="connected-actions">
                      <span className="status-indicator connected">
                        <Check size={12} /> Connected
                      </span>
                      <button className="settings-btn">
                        <Settings size={14} />
                      </button>
                    </div>
                  ) : integration.status === 'available' ? (
                    <button className="connect-btn">
                      <Plus size={14} /> Connect
                    </button>
                  ) : (
                    <span className="status-indicator coming-soon">
                      <Clock size={12} /> Coming Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="empty-state">
              <Puzzle size={48} />
              <h3>No integrations found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Integration Detail Modal */}
      {selectedIntegration && (
        <div className="modal-overlay" onClick={() => setSelectedIntegration(null)}>
          <div className="modal integration-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">{selectedIntegration.icon}</span>
                <div>
                  <h2>{selectedIntegration.name}</h2>
                  <span className={`modal-status ${selectedIntegration.status}`}>
                    {selectedIntegration.status === 'connected' && <Check size={14} />}
                    {selectedIntegration.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedIntegration(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">{selectedIntegration.description}</p>
              
              {selectedIntegration.status === 'connected' && (
                <div className="connection-info">
                  <div className="info-row">
                    <span className="info-label">Connected</span>
                    <span className="info-value">{selectedIntegration.connectedAt}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Sync</span>
                    <span className="info-value">
                      {getSyncStatusIcon(selectedIntegration.syncStatus)}
                      {selectedIntegration.lastSync}
                    </span>
                  </div>
                </div>
              )}

              <div className="features-section">
                <h3>Features</h3>
                <div className="features-grid">
                  {selectedIntegration.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <Check size={16} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="docs-link">
                <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer">
                  <FileText size={16} />
                  View Documentation
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <div className="modal-footer">
              {selectedIntegration.status === 'connected' ? (
                <>
                  <button className="btn-outline">
                    <RefreshCw size={16} />
                    Sync Now
                  </button>
                  <button className="btn-outline">
                    <Settings size={16} />
                    Configure
                  </button>
                  <button className="btn-danger">
                    <Trash2 size={16} />
                    Disconnect
                  </button>
                </>
              ) : selectedIntegration.status === 'available' ? (
                <button className="btn-primary full-width">
                  <Zap size={16} />
                  Connect {selectedIntegration.name}
                </button>
              ) : (
                <button className="btn-outline full-width" disabled>
                  <Clock size={16} />
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
