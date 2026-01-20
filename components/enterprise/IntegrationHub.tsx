'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ConnectedIntegration,
  IntegrationDefinition,
  IntegrationCategory,
  INTEGRATION_CATALOG,
  getCategoryCounts,
} from '../../types/integration-hub';
import './IntegrationHub.css';

// ============================================================================
// TYPES
// ============================================================================

interface IntegrationHubProps {
  connectedIntegrations?: ConnectedIntegration[];
  onConnect?: (integrationId: string) => void;
  onDisconnect?: (connectionId: string) => void;
  onSync?: (connectionId: string) => void;
  onConfigure?: (connectionId: string) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'popularity' | 'category' | 'status';

// ============================================================================
// CATEGORY INFO
// ============================================================================

const CATEGORY_INFO: Record<IntegrationCategory, { name: string; icon: string; color: string }> = {
  crm: { name: 'CRM', icon: '👥', color: '#3b82f6' },
  erp: { name: 'ERP', icon: '🏢', color: '#8b5cf6' },
  marketing: { name: 'Marketing', icon: '📢', color: '#ec4899' },
  sales: { name: 'Sales', icon: '💰', color: '#10b981' },
  finance: { name: 'Finance', icon: '💵', color: '#059669' },
  hr: { name: 'HR', icon: '👔', color: '#6366f1' },
  project_management: { name: 'Project Management', icon: '📋', color: '#f59e0b' },
  communication: { name: 'Communication', icon: '💬', color: '#06b6d4' },
  cloud_storage: { name: 'Cloud Storage', icon: '☁️', color: '#64748b' },
  database: { name: 'Database', icon: '🗄️', color: '#84cc16' },
  ecommerce: { name: 'E-commerce', icon: '🛒', color: '#f97316' },
  analytics: { name: 'Analytics', icon: '📊', color: '#a855f7' },
  social_media: { name: 'Social Media', icon: '📱', color: '#14b8a6' },
  productivity: { name: 'Productivity', icon: '⚡', color: '#eab308' },
  security: { name: 'Security', icon: '🔒', color: '#ef4444' },
  devops: { name: 'DevOps', icon: '🔧', color: '#22c55e' },
  ai_ml: { name: 'AI & ML', icon: '🤖', color: '#8b5cf6' },
  iot: { name: 'IoT', icon: '📡', color: '#0ea5e9' },
  custom: { name: 'Custom', icon: '🔌', color: '#71717a' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IntegrationHub: React.FC<IntegrationHubProps> = ({
  connectedIntegrations = [],
  onConnect,
  onDisconnect,
  onSync,
  onConfigure,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [showEnterpriseOnly, setShowEnterpriseOnly] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Partial<IntegrationDefinition> | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'connected' | 'activity'>('catalog');

  // Category counts
  const categoryCounts = useMemo(() => getCategoryCounts(), []);

  // Filtered integrations
  const filteredIntegrations = useMemo(() => {
    let results = [...INTEGRATION_CATALOG];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(i =>
        i.name?.toLowerCase().includes(query) ||
        i.vendor?.toLowerCase().includes(query) ||
        i.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter(i => i.category === selectedCategory);
    }

    // Enterprise filter
    if (showEnterpriseOnly) {
      results = results.filter(i => i.enterprise);
    }

    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });

    return results;
  }, [searchQuery, selectedCategory, showEnterpriseOnly, sortBy]);

  // Check if integration is connected
  const isConnected = useCallback((integrationId: string) => {
    return connectedIntegrations.some(c => c.integrationId === integrationId);
  }, [connectedIntegrations]);

  // Get connection for integration
  const getConnection = useCallback((integrationId: string) => {
    return connectedIntegrations.find(c => c.integrationId === integrationId);
  }, [connectedIntegrations]);

  // Handle connect
  const handleConnect = useCallback((integration: Partial<IntegrationDefinition>) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  }, []);

  // Render integration card
  const renderIntegrationCard = (integration: Partial<IntegrationDefinition>) => {
    const connected = isConnected(integration.id || '');
    const connection = getConnection(integration.id || '');
    const categoryInfo = CATEGORY_INFO[integration.category || 'custom'];

    return (
      <div
        key={integration.id}
        className={`integration-card ${connected ? 'connected' : ''} ${viewMode}`}
        onClick={() => setSelectedIntegration(integration)}
      >
        <div className="card-header">
          <div
            className="integration-icon"
            style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
          >
            {categoryInfo.icon}
          </div>
          <div className="integration-info">
            <h3 className="integration-name">{integration.name}</h3>
            <span className="integration-vendor">{integration.vendor}</span>
          </div>
          {integration.enterprise && (
            <span className="enterprise-badge">Enterprise</span>
          )}
        </div>
        <div className="card-body">
          <span
            className="category-tag"
            style={{ backgroundColor: `${categoryInfo.color}15`, color: categoryInfo.color }}
          >
            {categoryInfo.name}
          </span>
          {connected && connection && (
            <span className={`status-badge status-${connection.status}`}>
              {connection.status}
            </span>
          )}
        </div>
        <div className="card-actions">
          {connected ? (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure?.(connection?.id || '');
                }}
              >
                Configure
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSync?.(connection?.id || '');
                }}
              >
                Sync
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleConnect(integration);
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render connected integration row
  const renderConnectedRow = (connection: ConnectedIntegration) => {
    const integration = INTEGRATION_CATALOG.find(i => i.id === connection.integrationId);
    const categoryInfo = CATEGORY_INFO[integration?.category || 'custom'];

    return (
      <div key={connection.id} className="connected-row">
        <div className="row-icon" style={{ backgroundColor: `${categoryInfo.color}20` }}>
          {categoryInfo.icon}
        </div>
        <div className="row-info">
          <span className="row-name">{connection.name}</span>
          <span className="row-type">{integration?.name}</span>
        </div>
        <span className={`status-badge status-${connection.status}`}>
          {connection.status}
        </span>
        <div className="row-health">
          <span className={`health-indicator health-${connection.health.status}`} />
          <span className="health-text">{connection.health.status}</span>
        </div>
        <span className="row-sync">
          {connection.metadata.lastSyncAt
            ? `Last sync: ${new Date(connection.metadata.lastSyncAt).toLocaleString()}`
            : 'Never synced'}
        </span>
        <div className="row-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onSync?.(connection.id)}
            aria-label="Sync integration"
          >
            🔄
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onConfigure?.(connection.id)}
            aria-label="Configure integration"
          >
            ⚙️
          </button>
          <button
            className="btn btn-ghost btn-sm btn-danger"
            onClick={() => onDisconnect?.(connection.id)}
            aria-label="Disconnect integration"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="integration-hub">
      {/* Header */}
      <header className="hub-header">
        <div className="header-left">
          <h1>Integration Hub</h1>
          <span className="integration-count">
            {INTEGRATION_CATALOG.length} integrations available
          </span>
        </div>
        <div className="header-tabs">
          <button
            className={`tab ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Catalog
          </button>
          <button
            className={`tab ${activeTab === 'connected' ? 'active' : ''}`}
            onClick={() => setActiveTab('connected')}
          >
            Connected ({connectedIntegrations.length})
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>
      </header>

      {/* Catalog View */}
      {activeTab === 'catalog' && (
        <div className="catalog-view">
          {/* Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="search-input"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as IntegrationCategory | 'all')}
              className="filter-select"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icon} {info.name} ({categoryCounts[key as IntegrationCategory] || 0})
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="filter-select"
              aria-label="Sort by"
            >
              <option value="popularity">Most Popular</option>
              <option value="name">Name (A-Z)</option>
              <option value="category">Category</option>
            </select>
            <label className="checkbox-filter">
              <input
                type="checkbox"
                checked={showEnterpriseOnly}
                onChange={(e) => setShowEnterpriseOnly(e.target.checked)}
              />
              Enterprise only
            </label>
            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                ⊞
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                ☰
              </button>
            </div>
          </div>

          {/* Category Sidebar */}
          <div className="catalog-content">
            <aside className="category-sidebar">
              <div
                className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span className="category-icon">📦</span>
                <span className="category-name">All Integrations</span>
                <span className="category-count">{INTEGRATION_CATALOG.length}</span>
              </div>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <div
                  key={key}
                  className={`category-item ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(key as IntegrationCategory)}
                  style={{ '--category-color': info.color } as React.CSSProperties}
                >
                  <span className="category-icon">{info.icon}</span>
                  <span className="category-name">{info.name}</span>
                  <span className="category-count">
                    {categoryCounts[key as IntegrationCategory] || 0}
                  </span>
                </div>
              ))}
            </aside>

            {/* Integrations Grid/List */}
            <main className={`integrations-container ${viewMode}`}>
              {filteredIntegrations.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <h3>No integrations found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className={`integrations-${viewMode}`}>
                  {filteredIntegrations.map(renderIntegrationCard)}
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Connected View */}
      {activeTab === 'connected' && (
        <div className="connected-view">
          {connectedIntegrations.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔌</span>
              <h3>No integrations connected</h3>
              <p>Browse the catalog to connect your first integration</p>
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab('catalog')}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="connected-list">
              {connectedIntegrations.map(renderConnectedRow)}
            </div>
          )}
        </div>
      )}

      {/* Activity View */}
      {activeTab === 'activity' && (
        <div className="activity-view">
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <h3>Activity Log</h3>
            <p>Sync history and activity will appear here</p>
          </div>
        </div>
      )}

      {/* Integration Detail Modal */}
      {selectedIntegration && !showConnectModal && (
        <div className="modal-overlay" onClick={() => setSelectedIntegration(null)}>
          <div className="modal integration-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-area">
                <div
                  className="integration-icon large"
                  style={{
                    backgroundColor: `${CATEGORY_INFO[selectedIntegration.category || 'custom'].color}20`,
                    color: CATEGORY_INFO[selectedIntegration.category || 'custom'].color,
                  }}
                >
                  {CATEGORY_INFO[selectedIntegration.category || 'custom'].icon}
                </div>
                <div>
                  <h2>{selectedIntegration.name}</h2>
                  <span className="vendor">{selectedIntegration.vendor}</span>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedIntegration(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>About</h3>
                <p>
                  Connect {selectedIntegration.name} to automate data synchronization,
                  trigger workflows, and enhance your automation capabilities.
                </p>
              </div>
              <div className="detail-section">
                <h3>Category</h3>
                <span
                  className="category-tag large"
                  style={{
                    backgroundColor: `${CATEGORY_INFO[selectedIntegration.category || 'custom'].color}15`,
                    color: CATEGORY_INFO[selectedIntegration.category || 'custom'].color,
                  }}
                >
                  {CATEGORY_INFO[selectedIntegration.category || 'custom'].name}
                </span>
              </div>
              <div className="detail-section">
                <h3>Features</h3>
                <ul className="feature-list">
                  <li>✓ Bi-directional data sync</li>
                  <li>✓ Real-time webhooks</li>
                  <li>✓ Custom field mapping</li>
                  <li>✓ Automatic retry handling</li>
                  <li>✓ Audit logging</li>
                </ul>
              </div>
              {selectedIntegration.enterprise && (
                <div className="enterprise-notice">
                  <span className="notice-icon">⭐</span>
                  <span>This is an Enterprise integration with advanced features and dedicated support.</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedIntegration(null)}
              >
                Cancel
              </button>
              {isConnected(selectedIntegration.id || '') ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const conn = getConnection(selectedIntegration.id || '');
                    if (conn) onConfigure?.(conn.id);
                    setSelectedIntegration(null);
                  }}
                >
                  Configure
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onConnect?.(selectedIntegration.id || '');
                    setSelectedIntegration(null);
                  }}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationHub;
