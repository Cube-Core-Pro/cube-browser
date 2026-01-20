'use client';

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Search,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  MoreVertical,
  Filter,
  Download,
  Activity,
  Globe,
  Lock,
  Unlock,
  Zap,
  Code,
  Database,
  ExternalLink,
  Info,
  ChevronDown,
  Check
} from 'lucide-react';
import './api-keys.css';

interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  status: 'active' | 'revoked' | 'expired';
  environment: 'production' | 'development' | 'staging';
  permissions: string[];
  lastUsed: string | null;
  usageCount: number;
  rateLimit: number;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
  ipRestrictions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const apiKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'sk_live_PLACEHOLDER',
    prefix: 'sk_live_PLACEHOLDER',
    status: 'active',
    environment: 'production',
    permissions: ['read:data', 'write:data', 'read:analytics', 'execute:automations'],
    lastUsed: '2 minutes ago',
    usageCount: 15420,
    rateLimit: 10000,
    expiresAt: '2026-01-28',
    createdAt: '2025-01-01',
    createdBy: 'John Doe',
    ipRestrictions: ['192.168.1.0/24', '10.0.0.0/8']
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'sk_test_PLACEHOLDER',
    prefix: 'sk_test_PLACEHOLDER',
    status: 'active',
    environment: 'development',
    permissions: ['read:data', 'write:data'],
    lastUsed: '1 hour ago',
    usageCount: 3421,
    rateLimit: 1000,
    expiresAt: null,
    createdAt: '2025-01-15',
    createdBy: 'Jane Smith',
    ipRestrictions: []
  },
  {
    id: '3',
    name: 'Staging Environment',
    key: 'sk_staging_mno345pqr678stu901vwx234yz',
    prefix: 'sk_staging_',
    status: 'active',
    environment: 'staging',
    permissions: ['read:data', 'write:data', 'read:analytics'],
    lastUsed: '3 days ago',
    usageCount: 892,
    rateLimit: 5000,
    expiresAt: '2025-06-01',
    createdAt: '2025-01-10',
    createdBy: 'John Doe',
    ipRestrictions: ['172.16.0.0/12']
  },
  {
    id: '4',
    name: 'Legacy Integration',
    key: 'sk_live_PLACEHOLDER',
    prefix: 'sk_live_PLACEHOLDER',
    status: 'expired',
    environment: 'production',
    permissions: ['read:data'],
    lastUsed: '30 days ago',
    usageCount: 45000,
    rateLimit: 5000,
    expiresAt: '2024-12-31',
    createdAt: '2024-06-15',
    createdBy: 'Admin',
    ipRestrictions: []
  },
  {
    id: '5',
    name: 'Deprecated Service',
    key: 'sk_test_PLACEHOLDER',
    prefix: 'sk_test_PLACEHOLDER',
    status: 'revoked',
    environment: 'development',
    permissions: ['read:data'],
    lastUsed: null,
    usageCount: 0,
    rateLimit: 1000,
    expiresAt: null,
    createdAt: '2024-11-01',
    createdBy: 'Jane Smith',
    ipRestrictions: []
  }
];

const availablePermissions: Permission[] = [
  { id: 'read:data', name: 'Read Data', description: 'Read access to all data endpoints', category: 'Data' },
  { id: 'write:data', name: 'Write Data', description: 'Create and update data', category: 'Data' },
  { id: 'delete:data', name: 'Delete Data', description: 'Delete data records', category: 'Data' },
  { id: 'read:analytics', name: 'Read Analytics', description: 'Access analytics and reports', category: 'Analytics' },
  { id: 'execute:automations', name: 'Execute Automations', description: 'Run automation workflows', category: 'Automations' },
  { id: 'manage:webhooks', name: 'Manage Webhooks', description: 'Create and manage webhooks', category: 'Webhooks' },
  { id: 'admin:users', name: 'Admin Users', description: 'Manage user accounts', category: 'Admin' },
  { id: 'admin:billing', name: 'Admin Billing', description: 'Access billing information', category: 'Admin' }
];

export default function APIKeysPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Create form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'production' | 'development' | 'staging'>('development');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [newKeyIpRestrictions, setNewKeyIpRestrictions] = useState('');

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || key.status === statusFilter;
    const matchesEnv = envFilter === 'all' || key.environment === envFilter;
    return matchesSearch && matchesStatus && matchesEnv;
  });

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.status === 'active').length,
    totalUsage: apiKeys.reduce((sum, k) => sum + k.usageCount, 0),
    expiringSoon: apiKeys.filter(k => {
      if (!k.expiresAt) return false;
      const expiry = new Date(k.expiresAt);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
    }).length
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '••••••••••••••••••••••••';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'expired': return <Clock size={14} />;
      case 'revoked': return <XCircle size={14} />;
      default: return null;
    }
  };

  const getEnvBadgeClass = (env: string) => {
    switch (env) {
      case 'production': return 'env-production';
      case 'staging': return 'env-staging';
      case 'development': return 'env-development';
      default: return '';
    }
  };

  const togglePermission = (permId: string) => {
    if (newKeyPermissions.includes(permId)) {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permId));
    } else {
      setNewKeyPermissions([...newKeyPermissions, permId]);
    }
  };

  return (
    <div className="api-keys">
      {/* Header */}
      <div className="api-keys__header">
        <div className="api-keys__title-section">
          <div className="api-keys__icon">
            <Key size={28} />
          </div>
          <div>
            <h1>API Keys</h1>
            <p>Manage your API keys for programmatic access</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Code size={18} />
            API Documentation
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Create API Key
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="api-keys__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Key size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Keys</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active Keys</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon usage">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalUsage.toLocaleString()}</span>
            <span className="stat-label">Total API Calls</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.expiringSoon}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <Shield size={20} />
        <div className="notice-content">
          <strong>Security Best Practices</strong>
          <p>Never share your API keys publicly. Use environment-specific keys and rotate them regularly.</p>
        </div>
        <button className="notice-action">
          Learn More <ExternalLink size={14} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="keys-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search API keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Environment:</label>
            <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="keys-list">
        {filteredKeys.map(apiKey => (
          <div key={apiKey.id} className={`key-card ${apiKey.status}`}>
            <div className="key-header">
              <div className="key-info">
                <div className="key-title">
                  <h3>{apiKey.name}</h3>
                  <span className={`status-badge ${apiKey.status}`}>
                    {getStatusIcon(apiKey.status)}
                    {apiKey.status}
                  </span>
                  <span className={`env-badge ${getEnvBadgeClass(apiKey.environment)}`}>
                    {apiKey.environment}
                  </span>
                </div>
                <div className="key-display">
                  <code>{visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}</code>
                  <button 
                    className="icon-btn" 
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    title={visibleKeys.has(apiKey.id) ? 'Hide' : 'Show'}
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    title="Copy"
                  >
                    {copiedKey === apiKey.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="key-actions">
                {apiKey.status === 'active' && (
                  <>
                    <button className="action-btn" title="Regenerate">
                      <RefreshCw size={16} />
                    </button>
                    <button className="action-btn" title="Settings" onClick={() => setSelectedKey(apiKey)}>
                      <Settings size={16} />
                    </button>
                  </>
                )}
                <button className="action-btn danger" title="Revoke">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="key-permissions">
              <span className="permissions-label">Permissions:</span>
              <div className="permissions-tags">
                {apiKey.permissions.map(perm => (
                  <span key={perm} className="permission-tag">{perm}</span>
                ))}
              </div>
            </div>

            <div className="key-stats">
              <div className="stat">
                <span className="stat-label">Last Used</span>
                <span className="stat-value">{apiKey.lastUsed || 'Never'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Calls</span>
                <span className="stat-value">{apiKey.usageCount.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Rate Limit</span>
                <span className="stat-value">{apiKey.rateLimit.toLocaleString()}/hr</span>
              </div>
              <div className="stat">
                <span className="stat-label">Expires</span>
                <span className={`stat-value ${apiKey.status === 'expired' ? 'error' : ''}`}>
                  {apiKey.expiresAt || 'Never'}
                </span>
              </div>
            </div>

            <div className="key-footer">
              <div className="key-meta">
                <span>Created by {apiKey.createdBy}</span>
                <span>•</span>
                <span>{apiKey.createdAt}</span>
              </div>
              {apiKey.ipRestrictions.length > 0 && (
                <div className="ip-restrictions">
                  <Lock size={12} />
                  <span>{apiKey.ipRestrictions.length} IP restriction{apiKey.ipRestrictions.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredKeys.length === 0 && (
        <div className="empty-state">
          <Key size={48} />
          <h3>No API keys found</h3>
          <p>Create your first API key to get started</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Create API Key
          </button>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal create-key-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New API Key</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Key Name</label>
                <input
                  type="text"
                  placeholder="e.g., Production Backend"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Environment</label>
                <div className="env-options">
                  {(['development', 'staging', 'production'] as const).map(env => (
                    <button
                      key={env}
                      className={`env-option ${newKeyEnv === env ? 'selected' : ''}`}
                      onClick={() => setNewKeyEnv(env)}
                    >
                      <span className={`env-dot ${env}`}></span>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-grid">
                  {availablePermissions.map(perm => (
                    <label key={perm.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <span className="checkbox-custom"></span>
                      <div className="permission-info">
                        <span className="permission-name">{perm.name}</span>
                        <span className="permission-desc">{perm.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiration (Optional)</label>
                  <input
                    type="date"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>IP Restrictions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 192.168.1.0/24"
                    value={newKeyIpRestrictions}
                    onChange={(e) => setNewKeyIpRestrictions(e.target.value)}
                  />
                </div>
              </div>

              <div className="security-warning">
                <AlertTriangle size={16} />
                <span>Your API key will only be shown once. Make sure to copy and store it securely.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Key size={16} />
                Generate API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Details Modal */}
      {selectedKey && (
        <div className="modal-overlay" onClick={() => setSelectedKey(null)}>
          <div className="modal key-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>{selectedKey.name}</h2>
                <span className={`status-badge ${selectedKey.status}`}>
                  {getStatusIcon(selectedKey.status)}
                  {selectedKey.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedKey(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Key Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Environment</span>
                    <span className={`env-badge ${getEnvBadgeClass(selectedKey.environment)}`}>
                      {selectedKey.environment}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{selectedKey.createdAt}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created By</span>
                    <span className="detail-value">{selectedKey.createdBy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expires</span>
                    <span className="detail-value">{selectedKey.expiresAt || 'Never'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Usage Statistics</h3>
                <div className="usage-stats">
                  <div className="usage-stat">
                    <span className="usage-value">{selectedKey.usageCount.toLocaleString()}</span>
                    <span className="usage-label">Total Calls</span>
                  </div>
                  <div className="usage-stat">
                    <span className="usage-value">{selectedKey.rateLimit.toLocaleString()}</span>
                    <span className="usage-label">Rate Limit/hr</span>
                  </div>
                  <div className="usage-stat">
                    <span className="usage-value">{selectedKey.lastUsed || 'Never'}</span>
                    <span className="usage-label">Last Used</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Permissions</h3>
                <div className="permissions-list">
                  {selectedKey.permissions.map(perm => (
                    <div key={perm} className="permission-item">
                      <CheckCircle size={14} />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedKey.ipRestrictions.length > 0 && (
                <div className="detail-section">
                  <h3>IP Restrictions</h3>
                  <div className="ip-list">
                    {selectedKey.ipRestrictions.map((ip, idx) => (
                      <div key={idx} className="ip-item">
                        <Globe size={14} />
                        <code>{ip}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline">
                <RefreshCw size={16} />
                Regenerate
              </button>
              <button className="btn-danger">
                <Trash2 size={16} />
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
