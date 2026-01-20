'use client';

import React, { useState } from 'react';
import {
  Shield,
  Ban,
  CheckCircle,
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit2,
  Globe,
  Server,
  User,
  Clock,
  AlertTriangle,
  Activity,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw,
  Lock,
  Unlock,
  Hash
} from 'lucide-react';
import './ip-access-control.css';

interface IPEntry {
  id: string;
  ip: string;
  type: 'allowlist' | 'blocklist';
  label: string;
  description: string;
  source: 'manual' | 'auto-detected' | 'imported' | 'api';
  status: 'active' | 'expired' | 'pending';
  scope: 'global' | 'api' | 'admin' | 'webhook';
  expiresAt: string | null;
  hitCount24h: number;
  lastSeen: string | null;
  createdAt: string;
  createdBy: string;
  tags: string[];
}

interface IPRange {
  id: string;
  cidr: string;
  type: 'allowlist' | 'blocklist';
  label: string;
  description: string;
  ipCount: number;
  hitCount24h: number;
  createdAt: string;
}

const IP_ENTRIES: IPEntry[] = [
  {
    id: 'ip-1',
    ip: '192.168.1.100',
    type: 'allowlist',
    label: 'Office Network',
    description: 'Main office static IP for admin access',
    source: 'manual',
    status: 'active',
    scope: 'admin',
    expiresAt: null,
    hitCount24h: 1247,
    lastSeen: '2 minutes ago',
    createdAt: '2024-01-15',
    createdBy: 'admin@cube-elite.io',
    tags: ['office', 'trusted']
  },
  {
    id: 'ip-2',
    ip: '203.0.113.50',
    type: 'allowlist',
    label: 'CI/CD Pipeline',
    description: 'GitHub Actions runner IP for deployments',
    source: 'api',
    status: 'active',
    scope: 'api',
    expiresAt: '2025-06-01',
    hitCount24h: 892,
    lastSeen: '15 minutes ago',
    createdAt: '2024-02-20',
    createdBy: 'devops@cube-elite.io',
    tags: ['ci-cd', 'automation']
  },
  {
    id: 'ip-3',
    ip: '198.51.100.23',
    type: 'blocklist',
    label: 'Suspicious Actor',
    description: 'Multiple failed auth attempts detected',
    source: 'auto-detected',
    status: 'active',
    scope: 'global',
    expiresAt: '2025-01-30',
    hitCount24h: 0,
    lastSeen: '3 days ago',
    createdAt: '2024-12-28',
    createdBy: 'system',
    tags: ['threat', 'brute-force']
  },
  {
    id: 'ip-4',
    ip: '10.0.0.1',
    type: 'allowlist',
    label: 'VPN Gateway',
    description: 'Corporate VPN exit node',
    source: 'manual',
    status: 'active',
    scope: 'global',
    expiresAt: null,
    hitCount24h: 3456,
    lastSeen: '1 minute ago',
    createdAt: '2024-01-01',
    createdBy: 'admin@cube-elite.io',
    tags: ['vpn', 'internal']
  },
  {
    id: 'ip-5',
    ip: '45.33.32.156',
    type: 'blocklist',
    label: 'Known Malicious',
    description: 'Part of known botnet infrastructure',
    source: 'imported',
    status: 'active',
    scope: 'global',
    expiresAt: null,
    hitCount24h: 0,
    lastSeen: null,
    createdAt: '2024-11-15',
    createdBy: 'threat-intel@cube-elite.io',
    tags: ['botnet', 'threat-intel']
  },
  {
    id: 'ip-6',
    ip: '172.16.0.100',
    type: 'allowlist',
    label: 'Monitoring Server',
    description: 'Internal monitoring and health checks',
    source: 'manual',
    status: 'active',
    scope: 'api',
    expiresAt: null,
    hitCount24h: 8920,
    lastSeen: '30 seconds ago',
    createdAt: '2024-03-10',
    createdBy: 'ops@cube-elite.io',
    tags: ['monitoring', 'internal']
  }
];

const IP_RANGES: IPRange[] = [
  {
    id: 'range-1',
    cidr: '10.0.0.0/8',
    type: 'allowlist',
    label: 'Internal Network',
    description: 'Private network range for internal services',
    ipCount: 16777216,
    hitCount24h: 45230,
    createdAt: '2024-01-01'
  },
  {
    id: 'range-2',
    cidr: '192.168.0.0/16',
    type: 'allowlist',
    label: 'Office Network Range',
    description: 'All office locations',
    ipCount: 65536,
    hitCount24h: 12890,
    createdAt: '2024-01-15'
  },
  {
    id: 'range-3',
    cidr: '185.220.100.0/24',
    type: 'blocklist',
    label: 'Tor Exit Nodes',
    description: 'Known Tor exit node range',
    ipCount: 256,
    hitCount24h: 0,
    createdAt: '2024-06-01'
  }
];

const SOURCE_CONFIG: Record<string, { color: string; label: string }> = {
  'manual': { color: 'primary', label: 'Manual' },
  'auto-detected': { color: 'warning', label: 'Auto-Detected' },
  'imported': { color: 'info', label: 'Imported' },
  'api': { color: 'purple', label: 'API' }
};

const SCOPE_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  'global': { color: 'primary', label: 'Global', icon: Globe },
  'api': { color: 'cyan', label: 'API', icon: Server },
  'admin': { color: 'warning', label: 'Admin', icon: Lock },
  'webhook': { color: 'purple', label: 'Webhook', icon: RefreshCw }
};

export default function IPAccessControlPage() {
  const [activeTab, setActiveTab] = useState<'allowlist' | 'blocklist' | 'ranges'>('allowlist');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const allowlistEntries = IP_ENTRIES.filter(e => e.type === 'allowlist');
  const blocklistEntries = IP_ENTRIES.filter(e => e.type === 'blocklist');
  const totalAllowed24h = allowlistEntries.reduce((acc, e) => acc + e.hitCount24h, 0);
  const totalBlocked24h = blocklistEntries.reduce((acc, e) => acc + e.hitCount24h, 0);

  const filteredEntries = IP_ENTRIES.filter(entry => {
    const matchesType = activeTab === 'allowlist' ? entry.type === 'allowlist' : entry.type === 'blocklist';
    const matchesSearch = entry.ip.includes(searchQuery) ||
                         entry.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = selectedScope === 'all' || entry.scope === selectedScope;
    const matchesSource = selectedSource === 'all' || entry.source === selectedSource;
    return matchesType && matchesSearch && matchesScope && matchesSource;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="ip-access-control">
      <header className="ip-access-control__header">
        <div className="ip-access-control__title-section">
          <div className="ip-access-control__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>IP Access Control</h1>
            <p>Manage IP allowlists, blocklists, and CIDR ranges</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Entry
          </button>
        </div>
      </header>

      <div className="ip-access-control__stats">
        <div className="stat-card">
          <div className="stat-icon allow">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{allowlistEntries.length}</span>
            <span className="stat-label">Allowlist Entries</span>
          </div>
          <span className="stat-secondary">{IP_RANGES.filter(r => r.type === 'allowlist').length} ranges</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon block">
            <Ban size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{blocklistEntries.length}</span>
            <span className="stat-label">Blocklist Entries</span>
          </div>
          <span className="stat-secondary">{IP_RANGES.filter(r => r.type === 'blocklist').length} ranges</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon allowed">
            <Unlock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalAllowed24h)}</span>
            <span className="stat-label">Allowed Requests (24h)</span>
          </div>
          <span className="stat-trend up">+5.2%</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon blocked">
            <Lock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalBlocked24h)}</span>
            <span className="stat-label">Blocked Requests (24h)</span>
          </div>
          <span className="stat-trend down">-12.3%</span>
        </div>
      </div>

      <div className="ip-access-control__tabs">
        <button
          className={`tab-btn ${activeTab === 'allowlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('allowlist')}
        >
          <CheckCircle size={16} />
          Allowlist
          <span className="tab-count">{allowlistEntries.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'blocklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocklist')}
        >
          <Ban size={16} />
          Blocklist
          <span className="tab-count">{blocklistEntries.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'ranges' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranges')}
        >
          <Hash size={16} />
          CIDR Ranges
          <span className="tab-count">{IP_RANGES.length}</span>
        </button>
      </div>

      {(activeTab === 'allowlist' || activeTab === 'blocklist') && (
        <>
          <div className="ip-access-control__filters">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by IP or label..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <Filter size={14} />
              <select
                value={selectedScope}
                onChange={e => setSelectedScope(e.target.value)}
              >
                <option value="all">All Scopes</option>
                <option value="global">Global</option>
                <option value="api">API</option>
                <option value="admin">Admin</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <div className="filter-group">
              <select
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual</option>
                <option value="auto-detected">Auto-Detected</option>
                <option value="imported">Imported</option>
                <option value="api">API</option>
              </select>
            </div>
          </div>

          <div className="entries-list">
            {filteredEntries.length > 0 ? (
              filteredEntries.map(entry => {
                const ScopeIcon = SCOPE_CONFIG[entry.scope].icon;
                return (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-main">
                      <div className={`entry-type-icon ${entry.type}`}>
                        {entry.type === 'allowlist' ? <CheckCircle size={20} /> : <Ban size={20} />}
                      </div>
                      <div className="entry-ip-section">
                        <div className="ip-display">
                          <code>{entry.ip}</code>
                          <button className="copy-btn" title="Copy IP">
                            <Copy size={14} />
                          </button>
                        </div>
                        <span className="entry-label">{entry.label}</span>
                      </div>
                      <div className="entry-badges">
                        <span className={`scope-badge ${SCOPE_CONFIG[entry.scope].color}`}>
                          <ScopeIcon size={12} />
                          {SCOPE_CONFIG[entry.scope].label}
                        </span>
                        <span className={`source-badge ${SOURCE_CONFIG[entry.source].color}`}>
                          {SOURCE_CONFIG[entry.source].label}
                        </span>
                        {entry.expiresAt && (
                          <span className="expires-badge">
                            <Clock size={12} />
                            Expires {entry.expiresAt}
                          </span>
                        )}
                      </div>
                      <div className="entry-stats">
                        <div className="stat-item">
                          <span className="stat-value">{formatNumber(entry.hitCount24h)}</span>
                          <span className="stat-label">hits/24h</span>
                        </div>
                      </div>
                      <div className="entry-last-seen">
                        <span className="last-seen-label">Last seen</span>
                        <span className="last-seen-value">{entry.lastSeen || 'Never'}</span>
                      </div>
                      <div className="entry-actions">
                        <button
                          className="expand-btn"
                          onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                        >
                          {expandedEntry === entry.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <button className="action-btn" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn danger" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {expandedEntry === entry.id && (
                      <div className="entry-expanded">
                        <div className="expanded-grid">
                          <div className="expanded-section">
                            <h4>Description</h4>
                            <p>{entry.description}</p>
                          </div>
                          <div className="expanded-section">
                            <h4>Tags</h4>
                            <div className="tag-list">
                              {entry.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                          </div>
                          <div className="expanded-section">
                            <h4>Created</h4>
                            <p>{entry.createdAt} by {entry.createdBy}</p>
                          </div>
                          <div className="expanded-section">
                            <h4>Status</h4>
                            <span className={`status-badge ${entry.status}`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Search size={48} />
                <h3>No entries found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'ranges' && (
        <div className="ranges-section">
          <div className="ranges-grid">
            {IP_RANGES.map(range => (
              <div key={range.id} className={`range-card ${range.type}`}>
                <div className="range-header">
                  <div className={`range-icon ${range.type}`}>
                    {range.type === 'allowlist' ? <CheckCircle size={20} /> : <Ban size={20} />}
                  </div>
                  <div>
                    <h3>{range.label}</h3>
                    <code className="cidr-display">{range.cidr}</code>
                  </div>
                </div>
                <p className="range-description">{range.description}</p>
                <div className="range-stats">
                  <div className="range-stat">
                    <span className="range-stat-value">{formatNumber(range.ipCount)}</span>
                    <span className="range-stat-label">IPs in range</span>
                  </div>
                  <div className="range-stat">
                    <span className="range-stat-value">{formatNumber(range.hitCount24h)}</span>
                    <span className="range-stat-label">Hits (24h)</span>
                  </div>
                </div>
                <div className="range-footer">
                  <span className="created-date">Created {range.createdAt}</span>
                  <div className="range-actions">
                    <button className="action-btn small">
                      <Edit2 size={14} />
                    </button>
                    <button className="action-btn small danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="range-card add-card" onClick={() => setShowAddModal(true)}>
              <div className="add-content">
                <Plus size={32} />
                <h3>Add CIDR Range</h3>
                <p>Define a new IP address range</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add IP Entry</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="entry-type-selector">
                <button className="type-btn active allowlist">
                  <CheckCircle size={18} />
                  Allowlist
                </button>
                <button className="type-btn blocklist">
                  <Ban size={18} />
                  Blocklist
                </button>
              </div>
              <div className="form-group">
                <label>IP Address or CIDR Range</label>
                <input type="text" placeholder="e.g., 192.168.1.100 or 10.0.0.0/8" />
              </div>
              <div className="form-group">
                <label>Label</label>
                <input type="text" placeholder="e.g., Office Network" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe the purpose of this entry..." rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Scope</label>
                  <select>
                    <option value="global">Global</option>
                    <option value="api">API Only</option>
                    <option value="admin">Admin Panel</option>
                    <option value="webhook">Webhooks</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expiration</label>
                  <select>
                    <option value="">Never expires</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                    <option value="custom">Custom date</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tags (Optional)</label>
                <input type="text" placeholder="Comma-separated tags (e.g., office, trusted)" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Plus size={16} />
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
