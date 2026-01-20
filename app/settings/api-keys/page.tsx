'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Shield,
  Clock,
  Activity,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Globe,
  Lock,
  Unlock,
  ChevronDown,
  X,
  Settings,
  MoreVertical,
  Code,
  Zap,
  BarChart3
} from 'lucide-react';
import './api-keys.css';

interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  environment: 'production' | 'development' | 'staging';
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  rateLimit: number;
  requestsToday: number;
  ipWhitelist: string[];
}

interface APIStats {
  totalKeys: number;
  activeKeys: number;
  totalRequests: number;
  requestsToday: number;
}

interface UsageData {
  date: string;
  requests: number;
}

const MOCK_API_KEYS: APIKey[] = [
  {
    id: 'key_1',
    name: 'Production API Key',
    key: 'sk_live_PLACEHOLDER',
    prefix: 'sk_live',
    permissions: ['read', 'write', 'delete', 'admin'],
    environment: 'production',
    status: 'active',
    createdAt: '2025-01-15T10:30:00Z',
    lastUsed: '2025-01-27T14:25:00Z',
    expiresAt: '2026-01-15T10:30:00Z',
    rateLimit: 10000,
    requestsToday: 4521,
    ipWhitelist: ['192.168.1.1', '10.0.0.1']
  },
  {
    id: 'key_2',
    name: 'Development Key',
    key: 'sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    prefix: 'sk_dev',
    permissions: ['read', 'write'],
    environment: 'development',
    status: 'active',
    createdAt: '2025-01-20T08:15:00Z',
    lastUsed: '2025-01-27T12:45:00Z',
    expiresAt: null,
    rateLimit: 1000,
    requestsToday: 287,
    ipWhitelist: []
  },
  {
    id: 'key_3',
    name: 'Staging Environment',
    key: 'sk_staging_9x8y7z6a5b4c3d2e1f0g9h8i7j6k5l4m3n2o1p0',
    prefix: 'sk_staging',
    permissions: ['read', 'write', 'delete'],
    environment: 'staging',
    status: 'active',
    createdAt: '2025-01-10T14:00:00Z',
    lastUsed: '2025-01-26T18:30:00Z',
    expiresAt: '2025-07-10T14:00:00Z',
    rateLimit: 5000,
    requestsToday: 1245,
    ipWhitelist: ['172.16.0.1']
  },
  {
    id: 'key_4',
    name: 'Legacy Integration',
    key: 'sk_live_PLACEHOLDER_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    prefix: 'sk_live',
    permissions: ['read'],
    environment: 'production',
    status: 'expired',
    createdAt: '2024-06-01T09:00:00Z',
    lastUsed: '2024-12-31T23:59:00Z',
    expiresAt: '2025-01-01T00:00:00Z',
    rateLimit: 500,
    requestsToday: 0,
    ipWhitelist: []
  },
  {
    id: 'key_5',
    name: 'Mobile App Key',
    key: 'sk_live_PLACEHOLDER_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4',
    prefix: 'sk_live',
    permissions: ['read', 'write'],
    environment: 'production',
    status: 'revoked',
    createdAt: '2024-09-15T11:30:00Z',
    lastUsed: '2025-01-10T08:00:00Z',
    expiresAt: null,
    rateLimit: 2000,
    requestsToday: 0,
    ipWhitelist: []
  }
];

const MOCK_STATS: APIStats = {
  totalKeys: 5,
  activeKeys: 3,
  totalRequests: 1250000,
  requestsToday: 6053
};

const MOCK_USAGE: UsageData[] = [
  { date: 'Jan 21', requests: 4520 },
  { date: 'Jan 22', requests: 5890 },
  { date: 'Jan 23', requests: 6234 },
  { date: 'Jan 24', requests: 7012 },
  { date: 'Jan 25', requests: 5678 },
  { date: 'Jan 26', requests: 6890 },
  { date: 'Jan 27', requests: 6053 }
];

export default function APIKeysPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [apiKeys, setApiKeys] = useState<APIKey[]>(MOCK_API_KEYS);
  const [stats, setStats] = useState<APIStats>(MOCK_STATS);
  const [usage, setUsage] = useState<UsageData[]>(MOCK_USAGE);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewKeyModal, setShowNewKeyModal] = useState<boolean>(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: APIKey['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'expired': return 'error';
      case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const getEnvColor = (env: APIKey['environment']) => {
    switch (env) {
      case 'production': return 'production';
      case 'development': return 'development';
      case 'staging': return 'staging';
      default: return 'default';
    }
  };

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnv === 'all' || key.environment === filterEnv;
    const matchesStatus = filterStatus === 'all' || key.status === filterStatus;
    return matchesSearch && matchesEnv && matchesStatus;
  });

  const maxRequests = Math.max(...usage.map(d => d.requests));

  if (loading) {
    return (
      <div className="api-keys-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-keys-page">
      {/* Header */}
      <header className="api-header">
        <div className="header-title">
          <Key size={28} />
          <div>
            <h1>API Keys</h1>
            <p>Manage authentication tokens and access control</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowNewKeyModal(true)}>
          <Plus size={18} />
          Create New Key
        </button>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">
            <Key size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalKeys}</span>
            <span className="stat-label">Total Keys</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeKeys}</span>
            <span className="stat-label">Active Keys</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon requests">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalRequests.toLocaleString()}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon today">
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.requestsToday.toLocaleString()}</span>
            <span className="stat-label">Today&apos;s Requests</span>
          </div>
        </div>
      </section>

      {/* Usage Chart */}
      <section className="usage-section">
        <div className="section-header">
          <h2>API Usage (Last 7 Days)</h2>
        </div>
        <div className="usage-chart">
          {usage.map((day, index) => (
            <div key={index} className="usage-bar-wrapper">
              <div 
                className="usage-bar"
                style={{ height: `${(day.requests / maxRequests) * 100}%` }}
              >
                <span className="usage-value">{(day.requests / 1000).toFixed(1)}k</span>
              </div>
              <span className="usage-label">{day.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search API keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select 
            value={filterEnv} 
            onChange={(e) => setFilterEnv(e.target.value)}
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
          </select>
          <ChevronDown size={16} className="select-arrow" />
        </div>
        <div className="filter-group">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <ChevronDown size={16} className="select-arrow" />
        </div>
      </section>

      {/* API Keys List */}
      <section className="keys-section">
        {filteredKeys.length === 0 ? (
          <div className="empty-state">
            <Key size={48} />
            <h3>No API Keys Found</h3>
            <p>Create a new API key to get started</p>
            <button className="btn-primary" onClick={() => setShowNewKeyModal(true)}>
              <Plus size={18} />
              Create New Key
            </button>
          </div>
        ) : (
          <div className="keys-list">
            {filteredKeys.map((apiKey) => (
              <div key={apiKey.id} className={`key-card ${apiKey.status}`}>
                <div className="key-header">
                  <div className="key-name-section">
                    <h3>{apiKey.name}</h3>
                    <div className="key-badges">
                      <span className={`badge env ${getEnvColor(apiKey.environment)}`}>
                        {apiKey.environment}
                      </span>
                      <span className={`badge status ${getStatusColor(apiKey.status)}`}>
                        {apiKey.status}
                      </span>
                    </div>
                  </div>
                  <div className="key-actions">
                    <button 
                      className="action-btn"
                      onClick={() => setActiveMenu(activeMenu === apiKey.id ? null : apiKey.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === apiKey.id && (
                      <div className="action-menu">
                        <button>
                          <Edit2 size={14} />
                          Edit Key
                        </button>
                        <button>
                          <RefreshCw size={14} />
                          Regenerate
                        </button>
                        <button className="danger">
                          <Trash2 size={14} />
                          Revoke Key
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="key-value-section">
                  <div className="key-value">
                    <Code size={16} />
                    <span className="key-text">
                      {visibleKeys.has(apiKey.id) 
                        ? apiKey.key 
                        : `${apiKey.prefix}_${'•'.repeat(32)}`
                      }
                    </span>
                  </div>
                  <div className="key-value-actions">
                    <button 
                      className="icon-btn"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                    >
                      {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      className="icon-btn"
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      title="Copy key"
                    >
                      {copiedKey === apiKey.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="key-details">
                  <div className="detail-item">
                    <Shield size={14} />
                    <span className="detail-label">Permissions:</span>
                    <div className="permission-badges">
                      {apiKey.permissions.map((perm, idx) => (
                        <span key={idx} className="permission-badge">{perm}</span>
                      ))}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-item">
                      <Calendar size={14} />
                      <span className="detail-label">Created:</span>
                      <span>{formatDate(apiKey.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={14} />
                      <span className="detail-label">Last Used:</span>
                      <span>{apiKey.lastUsed ? formatDate(apiKey.lastUsed) : 'Never'}</span>
                    </div>
                    {apiKey.expiresAt && (
                      <div className="detail-item">
                        <AlertTriangle size={14} />
                        <span className="detail-label">Expires:</span>
                        <span>{formatDate(apiKey.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="key-stats">
                  <div className="stat-item">
                    <span className="stat-label">Rate Limit</span>
                    <span className="stat-value">{apiKey.rateLimit.toLocaleString()}/hr</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Today&apos;s Requests</span>
                    <div className="stat-with-bar">
                      <span className="stat-value">{apiKey.requestsToday.toLocaleString()}</span>
                      <div className="mini-progress">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min((apiKey.requestsToday / apiKey.rateLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">IP Whitelist</span>
                    <span className="stat-value">
                      {apiKey.ipWhitelist.length > 0 
                        ? `${apiKey.ipWhitelist.length} IPs` 
                        : 'Any IP'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Security Notice */}
      <section className="security-notice">
        <AlertTriangle size={20} />
        <div className="notice-content">
          <h4>Security Best Practices</h4>
          <ul>
            <li>Never share API keys in public repositories or client-side code</li>
            <li>Use environment-specific keys for development, staging, and production</li>
            <li>Enable IP whitelisting for production keys when possible</li>
            <li>Rotate keys regularly and revoke unused keys immediately</li>
          </ul>
        </div>
      </section>

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="modal-overlay" onClick={() => setShowNewKeyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New API Key</h2>
              <button className="close-btn" onClick={() => setShowNewKeyModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Key Name</label>
                <input type="text" placeholder="e.g., Production API Key" />
              </div>
              <div className="form-group">
                <label>Environment</label>
                <select>
                  <option value="production">Production</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                </select>
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Read</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Write</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Delete</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Admin</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Rate Limit (requests/hour)</label>
                <input type="number" defaultValue={1000} />
              </div>
              <div className="form-group">
                <label>Expiration (optional)</label>
                <input type="date" />
              </div>
              <div className="form-group">
                <label>IP Whitelist (optional)</label>
                <input type="text" placeholder="Comma-separated IP addresses" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewKeyModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Key size={18} />
                Generate API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
