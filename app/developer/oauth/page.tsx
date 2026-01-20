'use client';

import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Key,
  Users,
  Lock,
  Code,
  Edit,
  MoreVertical,
  Link,
  Unlink,
  Activity,
  Calendar,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import './oauth.css';

interface OAuthApp {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientSecret: string;
  status: 'active' | 'suspended' | 'pending';
  redirectUris: string[];
  scopes: string[];
  grantTypes: string[];
  logo?: string;
  website?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  createdAt: string;
  updatedAt: string;
  authorizedUsers: number;
  totalAuthorizations: number;
  lastUsed: string | null;
}

interface Scope {
  id: string;
  name: string;
  description: string;
  category: string;
}

const oauthApps: OAuthApp[] = [
  {
    id: '1',
    name: 'Production Dashboard',
    description: 'Main production dashboard application for internal use',
    clientId: 'cube_prod_abc123def456',
    clientSecret: 'cs_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    status: 'active',
    redirectUris: ['https://dashboard.cube.io/callback', 'https://dashboard.cube.io/auth/callback'],
    scopes: ['read:profile', 'read:data', 'write:data', 'read:analytics'],
    grantTypes: ['authorization_code', 'refresh_token'],
    website: 'https://dashboard.cube.io',
    privacyPolicy: 'https://cube.io/privacy',
    termsOfService: 'https://cube.io/terms',
    createdAt: '2024-12-01',
    updatedAt: '2025-01-28',
    authorizedUsers: 342,
    totalAuthorizations: 1567,
    lastUsed: '5 minutes ago'
  },
  {
    id: '2',
    name: 'Mobile App',
    description: 'iOS and Android mobile application',
    clientId: 'cube_mobile_xyz789mno',
    clientSecret: 'cs_live_yyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
    status: 'active',
    redirectUris: ['cube://oauth/callback', 'com.cube.app://callback'],
    scopes: ['read:profile', 'read:data', 'offline_access'],
    grantTypes: ['authorization_code', 'refresh_token', 'pkce'],
    website: 'https://cube.io/mobile',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-25',
    authorizedUsers: 89,
    totalAuthorizations: 234,
    lastUsed: '2 hours ago'
  },
  {
    id: '3',
    name: 'Third-Party Integration',
    description: 'Integration with partner platform',
    clientId: 'cube_partner_qrs456tuv',
    clientSecret: 'cs_live_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
    status: 'active',
    redirectUris: ['https://partner.example.com/auth/cube/callback'],
    scopes: ['read:profile', 'read:data'],
    grantTypes: ['client_credentials'],
    website: 'https://partner.example.com',
    privacyPolicy: 'https://partner.example.com/privacy',
    createdAt: '2025-01-15',
    updatedAt: '2025-01-20',
    authorizedUsers: 0,
    totalAuthorizations: 45,
    lastUsed: '1 day ago'
  },
  {
    id: '4',
    name: 'Development App',
    description: 'Testing and development environment',
    clientId: 'cube_dev_test123',
    clientSecret: 'cs_test_aaaaaaaaaaaaaaaaaaaaaaaaaaa',
    status: 'pending',
    redirectUris: ['http://localhost:3000/callback', 'http://localhost:5173/auth'],
    scopes: ['read:profile', 'read:data', 'write:data'],
    grantTypes: ['authorization_code', 'refresh_token'],
    createdAt: '2025-01-27',
    updatedAt: '2025-01-27',
    authorizedUsers: 3,
    totalAuthorizations: 12,
    lastUsed: 'Never'
  },
  {
    id: '5',
    name: 'Legacy Integration',
    description: 'Deprecated integration - scheduled for removal',
    clientId: 'cube_legacy_old999',
    clientSecret: 'cs_live_bbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    status: 'suspended',
    redirectUris: ['https://old-app.example.com/oauth'],
    scopes: ['read:profile'],
    grantTypes: ['implicit'],
    createdAt: '2024-06-15',
    updatedAt: '2024-12-01',
    authorizedUsers: 0,
    totalAuthorizations: 890,
    lastUsed: '60 days ago'
  }
];

const availableScopes: Scope[] = [
  { id: 'read:profile', name: 'Read Profile', description: 'Access user profile information', category: 'Profile' },
  { id: 'write:profile', name: 'Write Profile', description: 'Update user profile information', category: 'Profile' },
  { id: 'read:data', name: 'Read Data', description: 'Access user data and resources', category: 'Data' },
  { id: 'write:data', name: 'Write Data', description: 'Create and update user data', category: 'Data' },
  { id: 'delete:data', name: 'Delete Data', description: 'Delete user data', category: 'Data' },
  { id: 'read:analytics', name: 'Read Analytics', description: 'Access analytics data', category: 'Analytics' },
  { id: 'offline_access', name: 'Offline Access', description: 'Access resources when user is offline', category: 'Access' },
  { id: 'openid', name: 'OpenID', description: 'OpenID Connect authentication', category: 'Auth' }
];

export default function OAuthAppsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<OAuthApp | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Create form state
  const [newAppName, setNewAppName] = useState('');
  const [newAppDescription, setNewAppDescription] = useState('');
  const [newAppRedirectUris, setNewAppRedirectUris] = useState('');
  const [newAppScopes, setNewAppScopes] = useState<string[]>([]);
  const [newAppWebsite, setNewAppWebsite] = useState('');

  const filteredApps = oauthApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: oauthApps.length,
    active: oauthApps.filter(a => a.status === 'active').length,
    totalUsers: oauthApps.reduce((sum, a) => sum + a.authorizedUsers, 0),
    totalAuths: oauthApps.reduce((sum, a) => sum + a.totalAuthorizations, 0)
  };

  const toggleSecretVisibility = (appId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(appId)) {
      newVisible.delete(appId);
    } else {
      newVisible.add(appId);
    }
    setVisibleSecrets(newVisible);
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const maskSecret = (secret: string) => {
    return secret.substring(0, 8) + '••••••••••••••••••••••••';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'suspended': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return null;
    }
  };

  const toggleScope = (scopeId: string) => {
    if (newAppScopes.includes(scopeId)) {
      setNewAppScopes(newAppScopes.filter(s => s !== scopeId));
    } else {
      setNewAppScopes([...newAppScopes, scopeId]);
    }
  };

  return (
    <div className="oauth-apps">
      {/* Header */}
      <div className="oauth-apps__header">
        <div className="oauth-apps__title-section">
          <div className="oauth-apps__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>OAuth Applications</h1>
            <p>Manage OAuth 2.0 applications and client credentials</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Code size={18} />
            OAuth Docs
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Create Application
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="oauth-apps__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Apps</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Authorized Users</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon auths">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalAuths.toLocaleString()}</span>
            <span className="stat-label">Total Authorizations</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="apps-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <div className="status-filters">
            {['all', 'active', 'pending', 'suspended'].map(status => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apps List */}
      <div className="apps-list">
        {filteredApps.map(app => (
          <div key={app.id} className={`app-card ${app.status}`}>
            <div className="app-header">
              <div className="app-info">
                <div className="app-title">
                  <div className="app-logo">
                    {app.logo ? (
                      <img src={app.logo} alt={app.name} />
                    ) : (
                      <Shield size={24} />
                    )}
                  </div>
                  <div>
                    <h3>{app.name}</h3>
                    <span className={`status-badge ${app.status}`}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </span>
                  </div>
                </div>
                <p className="app-description">{app.description}</p>
              </div>
              <div className="app-actions">
                <button className="action-btn" title="Settings" onClick={() => setSelectedApp(app)}>
                  <Settings size={16} />
                </button>
                <button className="action-btn" title="More options">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            <div className="app-credentials">
              <div className="credential">
                <span className="credential-label">Client ID</span>
                <div className="credential-value">
                  <code>{app.clientId}</code>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(app.clientId, `${app.id}-clientId`)}
                    title="Copy"
                  >
                    {copiedField === `${app.id}-clientId` ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="credential">
                <span className="credential-label">Client Secret</span>
                <div className="credential-value">
                  <code>{visibleSecrets.has(app.id) ? app.clientSecret : maskSecret(app.clientSecret)}</code>
                  <button 
                    className="toggle-btn"
                    onClick={() => toggleSecretVisibility(app.id)}
                    title={visibleSecrets.has(app.id) ? 'Hide' : 'Show'}
                  >
                    {visibleSecrets.has(app.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(app.clientSecret, `${app.id}-secret`)}
                    title="Copy"
                  >
                    {copiedField === `${app.id}-secret` ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="app-details">
              <div className="detail-section">
                <span className="detail-label">Redirect URIs</span>
                <div className="redirect-uris">
                  {app.redirectUris.slice(0, 2).map((uri, idx) => (
                    <code key={idx}>{uri}</code>
                  ))}
                  {app.redirectUris.length > 2 && (
                    <span className="more-uris">+{app.redirectUris.length - 2} more</span>
                  )}
                </div>
              </div>
              <div className="detail-section">
                <span className="detail-label">Scopes</span>
                <div className="scopes-list">
                  {app.scopes.map(scope => (
                    <span key={scope} className="scope-tag">{scope}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="app-stats">
              <div className="stat">
                <span className="stat-label">Authorized Users</span>
                <span className="stat-value">{app.authorizedUsers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Authorizations</span>
                <span className="stat-value">{app.totalAuthorizations.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Last Used</span>
                <span className="stat-value">{app.lastUsed}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Created</span>
                <span className="stat-value">{app.createdAt}</span>
              </div>
            </div>

            <div className="app-footer">
              <div className="app-links">
                {app.website && (
                  <a href={app.website} target="_blank" rel="noopener noreferrer" className="app-link">
                    <Globe size={14} />
                    Website
                  </a>
                )}
                {app.privacyPolicy && (
                  <a href={app.privacyPolicy} target="_blank" rel="noopener noreferrer" className="app-link">
                    <Lock size={14} />
                    Privacy
                  </a>
                )}
              </div>
              <div className="footer-actions">
                <button className="btn-secondary">
                  <RefreshCw size={14} />
                  Rotate Secret
                </button>
                {app.status === 'active' ? (
                  <button className="btn-danger-outline">
                    <Unlink size={14} />
                    Suspend
                  </button>
                ) : app.status === 'suspended' && (
                  <button className="btn-success-outline">
                    <Link size={14} />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="empty-state">
          <Shield size={48} />
          <h3>No OAuth applications found</h3>
          <p>Create your first OAuth application to get started</p>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Create Application
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal create-app-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create OAuth Application</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Application Name *</label>
                <input
                  type="text"
                  placeholder="e.g., My Dashboard App"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Brief description of your application..."
                  value={newAppDescription}
                  onChange={(e) => setNewAppDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newAppWebsite}
                  onChange={(e) => setNewAppWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Redirect URIs *</label>
                <p className="form-hint">One URI per line. Use http://localhost for development.</p>
                <textarea
                  placeholder="https://example.com/callback&#10;http://localhost:3000/auth/callback"
                  value={newAppRedirectUris}
                  onChange={(e) => setNewAppRedirectUris(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Scopes</label>
                <div className="scopes-selector">
                  {availableScopes.map(scope => (
                    <label key={scope.id} className="scope-checkbox">
                      <input
                        type="checkbox"
                        checked={newAppScopes.includes(scope.id)}
                        onChange={() => toggleScope(scope.id)}
                      />
                      <span className="checkbox-custom"></span>
                      <div className="scope-info">
                        <span className="scope-name">{scope.name}</span>
                        <span className="scope-desc">{scope.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="info-box">
                <Info size={16} />
                <span>After creation, your Client ID and Secret will be generated. Make sure to store the secret securely.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Shield size={16} />
                Create Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Details Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal app-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="app-logo-large">
                  <Shield size={32} />
                </div>
                <div>
                  <h2>{selectedApp.name}</h2>
                  <span className={`status-badge ${selectedApp.status}`}>
                    {getStatusIcon(selectedApp.status)}
                    {selectedApp.status}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">{selectedApp.description}</p>

              <div className="detail-section">
                <h3>Credentials</h3>
                <div className="credentials-block">
                  <div className="credential-row">
                    <label>Client ID</label>
                    <div className="credential-display">
                      <code>{selectedApp.clientId}</code>
                      <button className="copy-btn" onClick={() => copyToClipboard(selectedApp.clientId, 'modal-clientId')}>
                        {copiedField === 'modal-clientId' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="credential-row">
                    <label>Client Secret</label>
                    <div className="credential-display">
                      <code>{visibleSecrets.has(`modal-${selectedApp.id}`) ? selectedApp.clientSecret : maskSecret(selectedApp.clientSecret)}</code>
                      <button 
                        className="toggle-btn"
                        onClick={() => {
                          const key = `modal-${selectedApp.id}`;
                          const newVisible = new Set(visibleSecrets);
                          if (newVisible.has(key)) {
                            newVisible.delete(key);
                          } else {
                            newVisible.add(key);
                          }
                          setVisibleSecrets(newVisible);
                        }}
                      >
                        {visibleSecrets.has(`modal-${selectedApp.id}`) ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="copy-btn" onClick={() => copyToClipboard(selectedApp.clientSecret, 'modal-secret')}>
                        {copiedField === 'modal-secret' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Redirect URIs</h3>
                <div className="uris-list">
                  {selectedApp.redirectUris.map((uri, idx) => (
                    <div key={idx} className="uri-item">
                      <Globe size={14} />
                      <code>{uri}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Scopes</h3>
                <div className="scopes-list-detail">
                  {selectedApp.scopes.map(scope => (
                    <span key={scope} className="scope-tag">{scope}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Grant Types</h3>
                <div className="grants-list">
                  {selectedApp.grantTypes.map(grant => (
                    <span key={grant} className="grant-tag">{grant}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{selectedApp.authorizedUsers}</span>
                    <span className="stat-label">Authorized Users</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{selectedApp.totalAuthorizations.toLocaleString()}</span>
                    <span className="stat-label">Total Authorizations</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{selectedApp.lastUsed}</span>
                    <span className="stat-label">Last Used</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{selectedApp.createdAt}</span>
                    <span className="stat-label">Created</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline">
                <Edit size={16} />
                Edit
              </button>
              <button className="btn-outline">
                <RefreshCw size={16} />
                Rotate Secret
              </button>
              <button className="btn-danger">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
