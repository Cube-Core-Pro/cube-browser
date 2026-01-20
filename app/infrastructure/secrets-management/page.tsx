'use client';

import React, { useState } from 'react';
import { 
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Shield,
  Clock,
  RefreshCw,
  Search,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Folder,
  File,
  Settings,
  History,
  Users,
  Activity,
  Database,
  Server,
  Cloud,
  Terminal,
  Code,
  Link,
  RotateCcw
} from 'lucide-react';
import './secrets-management.css';

interface Secret {
  id: string;
  name: string;
  path: string;
  type: 'api-key' | 'password' | 'certificate' | 'token' | 'connection-string' | 'ssh-key' | 'generic';
  engine: 'kv-v2' | 'transit' | 'pki' | 'database' | 'aws' | 'azure';
  version: number;
  created: string;
  updated: string;
  expiresAt: string | null;
  rotationEnabled: boolean;
  rotationPeriod: number | null;
  lastRotated: string | null;
  accessCount: number;
  lastAccessed: string | null;
  tags: string[];
  metadata: Record<string, string>;
}

interface SecretVersion {
  version: number;
  created: string;
  createdBy: string;
  destroyed: boolean;
  deletedAt: string | null;
}

interface AccessPolicy {
  id: string;
  name: string;
  path: string;
  capabilities: ('create' | 'read' | 'update' | 'delete' | 'list')[];
  principals: string[];
  enabled: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: 'read' | 'write' | 'delete' | 'rotate' | 'policy-change';
  secretPath: string;
  principal: string;
  sourceIP: string;
  success: boolean;
  details: string;
}

interface SecretsEngine {
  id: string;
  name: string;
  type: 'kv-v2' | 'transit' | 'pki' | 'database' | 'aws' | 'azure' | 'ssh';
  path: string;
  description: string;
  secrets: number;
  version: string;
  status: 'active' | 'sealed' | 'standby';
}

const SECRETS: Secret[] = [
  {
    id: 'sec-1',
    name: 'openai-api-key',
    path: '/production/ai/openai-api-key',
    type: 'api-key',
    engine: 'kv-v2',
    version: 3,
    created: '2024-06-15T08:00:00Z',
    updated: '2025-01-28T10:00:00Z',
    expiresAt: '2025-06-15T08:00:00Z',
    rotationEnabled: true,
    rotationPeriod: 90,
    lastRotated: '2025-01-28T10:00:00Z',
    accessCount: 15420,
    lastAccessed: '2025-01-28T14:30:00Z',
    tags: ['ai', 'production', 'critical'],
    metadata: { owner: 'ai-team', environment: 'production' }
  },
  {
    id: 'sec-2',
    name: 'database-postgres-main',
    path: '/production/database/postgres-main',
    type: 'connection-string',
    engine: 'database',
    version: 12,
    created: '2024-06-15T08:00:00Z',
    updated: '2025-01-27T06:00:00Z',
    expiresAt: null,
    rotationEnabled: true,
    rotationPeriod: 30,
    lastRotated: '2025-01-27T06:00:00Z',
    accessCount: 89450,
    lastAccessed: '2025-01-28T14:32:00Z',
    tags: ['database', 'production', 'postgresql'],
    metadata: { owner: 'platform-team', database: 'cube_production' }
  },
  {
    id: 'sec-3',
    name: 'stripe-secret-key',
    path: '/production/payments/stripe-secret',
    type: 'api-key',
    engine: 'kv-v2',
    version: 2,
    created: '2024-07-20T10:00:00Z',
    updated: '2024-12-01T08:00:00Z',
    expiresAt: null,
    rotationEnabled: false,
    rotationPeriod: null,
    lastRotated: null,
    accessCount: 45230,
    lastAccessed: '2025-01-28T14:28:00Z',
    tags: ['payments', 'production', 'stripe'],
    metadata: { owner: 'payments-team', service: 'billing' }
  },
  {
    id: 'sec-4',
    name: 'jwt-signing-key',
    path: '/production/auth/jwt-signing-key',
    type: 'token',
    engine: 'transit',
    version: 5,
    created: '2024-06-15T08:00:00Z',
    updated: '2025-01-15T04:00:00Z',
    expiresAt: null,
    rotationEnabled: true,
    rotationPeriod: 180,
    lastRotated: '2025-01-15T04:00:00Z',
    accessCount: 234560,
    lastAccessed: '2025-01-28T14:33:00Z',
    tags: ['auth', 'production', 'jwt'],
    metadata: { owner: 'auth-team', algorithm: 'RS256' }
  },
  {
    id: 'sec-5',
    name: 'tls-wildcard-cert',
    path: '/production/certs/wildcard-cube-io',
    type: 'certificate',
    engine: 'pki',
    version: 1,
    created: '2024-11-01T00:00:00Z',
    updated: '2024-11-01T00:00:00Z',
    expiresAt: '2025-11-01T00:00:00Z',
    rotationEnabled: true,
    rotationPeriod: 365,
    lastRotated: '2024-11-01T00:00:00Z',
    accessCount: 12890,
    lastAccessed: '2025-01-28T12:00:00Z',
    tags: ['ssl', 'production', 'certificate'],
    metadata: { owner: 'platform-team', domain: '*.cube.io' }
  },
  {
    id: 'sec-6',
    name: 'aws-iam-credentials',
    path: '/production/cloud/aws-credentials',
    type: 'api-key',
    engine: 'aws',
    version: 8,
    created: '2024-06-15T08:00:00Z',
    updated: '2025-01-20T02:00:00Z',
    expiresAt: '2025-02-20T02:00:00Z',
    rotationEnabled: true,
    rotationPeriod: 30,
    lastRotated: '2025-01-20T02:00:00Z',
    accessCount: 67890,
    lastAccessed: '2025-01-28T14:25:00Z',
    tags: ['aws', 'production', 'cloud'],
    metadata: { owner: 'infra-team', account: 'cube-production' }
  }
];

const SECRET_VERSIONS: SecretVersion[] = [
  { version: 3, created: '2025-01-28T10:00:00Z', createdBy: 'rotation-service', destroyed: false, deletedAt: null },
  { version: 2, created: '2024-10-28T10:00:00Z', createdBy: 'rotation-service', destroyed: false, deletedAt: null },
  { version: 1, created: '2024-06-15T08:00:00Z', createdBy: 'admin@cube.io', destroyed: true, deletedAt: '2024-10-30T00:00:00Z' }
];

const ACCESS_POLICIES: AccessPolicy[] = [
  {
    id: 'pol-1',
    name: 'production-read',
    path: '/production/*',
    capabilities: ['read', 'list'],
    principals: ['role:production-services', 'team:platform'],
    enabled: true
  },
  {
    id: 'pol-2',
    name: 'database-admin',
    path: '/production/database/*',
    capabilities: ['create', 'read', 'update', 'delete', 'list'],
    principals: ['team:dba', 'user:admin@cube.io'],
    enabled: true
  },
  {
    id: 'pol-3',
    name: 'ci-cd-deploy',
    path: '/staging/*',
    capabilities: ['read', 'list'],
    principals: ['service:github-actions', 'service:argocd'],
    enabled: true
  },
  {
    id: 'pol-4',
    name: 'security-audit',
    path: '/*',
    capabilities: ['read', 'list'],
    principals: ['team:security'],
    enabled: true
  }
];

const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2025-01-28T14:33:00Z',
    action: 'read',
    secretPath: '/production/auth/jwt-signing-key',
    principal: 'service:auth-service',
    sourceIP: '10.0.1.45',
    success: true,
    details: 'Secret read for JWT token signing'
  },
  {
    id: 'log-2',
    timestamp: '2025-01-28T14:30:00Z',
    action: 'read',
    secretPath: '/production/ai/openai-api-key',
    principal: 'service:ai-worker',
    sourceIP: '10.0.2.12',
    success: true,
    details: 'API key retrieved for AI processing'
  },
  {
    id: 'log-3',
    timestamp: '2025-01-28T10:00:00Z',
    action: 'rotate',
    secretPath: '/production/ai/openai-api-key',
    principal: 'service:rotation-service',
    sourceIP: '10.0.0.5',
    success: true,
    details: 'Automatic rotation completed'
  },
  {
    id: 'log-4',
    timestamp: '2025-01-28T09:45:00Z',
    action: 'read',
    secretPath: '/production/payments/stripe-secret',
    principal: 'service:billing-service',
    sourceIP: '10.0.3.22',
    success: true,
    details: 'Payment processing credentials retrieved'
  },
  {
    id: 'log-5',
    timestamp: '2025-01-28T08:00:00Z',
    action: 'policy-change',
    secretPath: '/production/*',
    principal: 'user:admin@cube.io',
    sourceIP: '192.168.1.100',
    success: true,
    details: 'Updated production-read policy capabilities'
  }
];

const SECRETS_ENGINES: SecretsEngine[] = [
  {
    id: 'eng-1',
    name: 'Key-Value v2',
    type: 'kv-v2',
    path: 'secret/',
    description: 'Versioned key-value secrets storage',
    secrets: 156,
    version: '2.0',
    status: 'active'
  },
  {
    id: 'eng-2',
    name: 'Transit',
    type: 'transit',
    path: 'transit/',
    description: 'Encryption as a service',
    secrets: 12,
    version: '1.0',
    status: 'active'
  },
  {
    id: 'eng-3',
    name: 'PKI',
    type: 'pki',
    path: 'pki/',
    description: 'Certificate authority and issuance',
    secrets: 24,
    version: '1.0',
    status: 'active'
  },
  {
    id: 'eng-4',
    name: 'Database',
    type: 'database',
    path: 'database/',
    description: 'Dynamic database credentials',
    secrets: 8,
    version: '1.0',
    status: 'active'
  },
  {
    id: 'eng-5',
    name: 'AWS',
    type: 'aws',
    path: 'aws/',
    description: 'Dynamic AWS credentials',
    secrets: 15,
    version: '1.0',
    status: 'active'
  }
];

const SECRET_TYPE_CONFIG = {
  'api-key': { color: 'primary', icon: Key, label: 'API Key' },
  'password': { color: 'danger', icon: Lock, label: 'Password' },
  'certificate': { color: 'success', icon: Shield, label: 'Certificate' },
  'token': { color: 'purple', icon: Code, label: 'Token' },
  'connection-string': { color: 'info', icon: Database, label: 'Connection' },
  'ssh-key': { color: 'warning', icon: Terminal, label: 'SSH Key' },
  'generic': { color: 'muted', icon: File, label: 'Generic' }
};

const ENGINE_CONFIG = {
  'kv-v2': { color: 'primary', icon: Database },
  'transit': { color: 'purple', icon: Shield },
  'pki': { color: 'success', icon: Shield },
  'database': { color: 'info', icon: Database },
  'aws': { color: 'warning', icon: Cloud },
  'azure': { color: 'info', icon: Cloud },
  'ssh': { color: 'danger', icon: Terminal }
};

const ACTION_CONFIG = {
  'read': { color: 'info', label: 'Read' },
  'write': { color: 'success', label: 'Write' },
  'delete': { color: 'danger', label: 'Delete' },
  'rotate': { color: 'purple', label: 'Rotate' },
  'policy-change': { color: 'warning', label: 'Policy' }
};

export default function SecretsManagementPage() {
  const [activeTab, setActiveTab] = useState<'secrets' | 'engines' | 'policies' | 'audit'>('secrets');
  const [expandedSecret, setExpandedSecret] = useState<string | null>('sec-1');
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDaysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
  };

  const totalSecrets = SECRETS.length;
  const expiringSecrets = SECRETS.filter(s => {
    const days = getDaysUntilExpiry(s.expiresAt);
    return days !== null && days <= 30;
  }).length;
  const totalAccesses = SECRETS.reduce((acc, s) => acc + s.accessCount, 0);
  const rotationEnabled = SECRETS.filter(s => s.rotationEnabled).length;

  return (
    <div className="secrets-management">
      <div className="secrets-management__header">
        <div className="secrets-management__title-section">
          <div className="secrets-management__icon">
            <Key size={28} />
          </div>
          <div>
            <h1>Secrets Management</h1>
            <p>Secure storage and management of sensitive data</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Secret
          </button>
        </div>
      </div>

      <div className="secrets-management__stats">
        <div className="stat-card">
          <div className="stat-icon secrets">
            <Key size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalSecrets}</span>
            <span className="stat-label">Total Secrets</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expiring">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{expiringSecrets}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accesses">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(totalAccesses)}</span>
            <span className="stat-label">Total Accesses</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rotation">
            <RotateCcw size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{rotationEnabled}</span>
            <span className="stat-label">Auto-Rotation</span>
          </div>
        </div>
      </div>

      <div className="secrets-management__tabs">
        <button 
          className={`tab-btn ${activeTab === 'secrets' ? 'active' : ''}`}
          onClick={() => setActiveTab('secrets')}
        >
          <Key size={16} />
          Secrets
        </button>
        <button 
          className={`tab-btn ${activeTab === 'engines' ? 'active' : ''}`}
          onClick={() => setActiveTab('engines')}
        >
          <Database size={16} />
          Engines
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Shield size={16} />
          Policies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={16} />
          Audit Log
        </button>
      </div>

      {activeTab === 'secrets' && (
        <div className="secrets-section">
          <div className="secrets-header">
            <h3>Secrets ({SECRETS.length})</h3>
            <div className="secrets-filters">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search secrets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="api-key">API Keys</option>
                <option value="password">Passwords</option>
                <option value="certificate">Certificates</option>
                <option value="token">Tokens</option>
                <option value="connection-string">Connections</option>
              </select>
            </div>
          </div>

          <div className="secrets-list">
            {SECRETS.filter(s => 
              (typeFilter === 'all' || s.type === typeFilter) &&
              (searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               s.path.toLowerCase().includes(searchQuery.toLowerCase()))
            ).map(secret => {
              const TypeConfig = SECRET_TYPE_CONFIG[secret.type];
              const TypeIcon = TypeConfig.icon;
              const EngineConfig = ENGINE_CONFIG[secret.engine];
              const daysUntilExpiry = getDaysUntilExpiry(secret.expiresAt);
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;
              
              return (
                <div 
                  key={secret.id}
                  className={`secret-card ${isExpiringSoon ? 'expiring' : ''}`}
                >
                  <div className="secret-main">
                    <div className={`secret-icon ${TypeConfig.color}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div className="secret-info">
                      <div className="secret-header">
                        <h4>{secret.name}</h4>
                        <span className={`type-badge ${TypeConfig.color}`}>
                          {TypeConfig.label}
                        </span>
                        <span className={`engine-badge ${EngineConfig.color}`}>
                          {secret.engine}
                        </span>
                        {secret.rotationEnabled && (
                          <span className="rotation-badge">
                            <RotateCcw size={10} />
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="secret-path">
                        <Folder size={12} />
                        <code>{secret.path}</code>
                      </div>
                      <div className="secret-meta">
                        <span><Clock size={12} /> v{secret.version}</span>
                        <span>Updated {formatDate(secret.updated)}</span>
                        <span><Activity size={12} /> {formatNumber(secret.accessCount)} accesses</span>
                        {daysUntilExpiry !== null && (
                          <span className={isExpiringSoon ? 'expiring-text' : ''}>
                            <AlertTriangle size={12} />
                            Expires in {daysUntilExpiry}d
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="secret-tags">
                      {secret.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                    <div className="secret-actions">
                      <button 
                        className="action-btn" 
                        title={showSecret[secret.id] ? "Hide" : "Show"}
                        onClick={() => setShowSecret(prev => ({ ...prev, [secret.id]: !prev[secret.id] }))}
                      >
                        {showSecret[secret.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="action-btn" title="Copy">
                        <Copy size={14} />
                      </button>
                      <button className="action-btn" title="Rotate">
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedSecret(expandedSecret === secret.id ? null : secret.id)}
                      >
                        {expandedSecret === secret.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedSecret === secret.id && (
                    <div className="secret-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>Version History</h5>
                          <div className="versions-list">
                            {SECRET_VERSIONS.map(version => (
                              <div 
                                key={version.version} 
                                className={`version-item ${version.destroyed ? 'destroyed' : ''}`}
                              >
                                <div className="version-info">
                                  <span className="version-num">v{version.version}</span>
                                  <span className="version-date">{formatDate(version.created)}</span>
                                  <span className="version-by">{version.createdBy}</span>
                                </div>
                                {version.destroyed ? (
                                  <span className="version-status destroyed">Destroyed</span>
                                ) : (
                                  <div className="version-actions">
                                    <button className="version-btn" title="View">
                                      <Eye size={12} />
                                    </button>
                                    <button className="version-btn" title="Rollback">
                                      <RotateCcw size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Metadata</h5>
                          <div className="metadata-list">
                            {Object.entries(secret.metadata).map(([key, value]) => (
                              <div key={key} className="metadata-item">
                                <span className="meta-key">{key}</span>
                                <span className="meta-value">{value}</span>
                              </div>
                            ))}
                            <div className="metadata-item">
                              <span className="meta-key">lastAccessed</span>
                              <span className="meta-value">
                                {secret.lastAccessed ? formatDate(secret.lastAccessed) : 'Never'}
                              </span>
                            </div>
                            {secret.rotationEnabled && (
                              <>
                                <div className="metadata-item">
                                  <span className="meta-key">rotationPeriod</span>
                                  <span className="meta-value">{secret.rotationPeriod} days</span>
                                </div>
                                <div className="metadata-item">
                                  <span className="meta-key">lastRotated</span>
                                  <span className="meta-value">
                                    {secret.lastRotated ? formatDate(secret.lastRotated) : 'Never'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm">
                          <Edit size={14} />
                          Edit Secret
                        </button>
                        <button className="btn-sm">
                          <RefreshCw size={14} />
                          Force Rotation
                        </button>
                        <button className="btn-sm">
                          <History size={14} />
                          View Access Log
                        </button>
                        <button className="btn-sm danger">
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'engines' && (
        <div className="engines-section">
          <div className="engines-header">
            <h3>Secrets Engines ({SECRETS_ENGINES.length})</h3>
            <button className="btn-primary">
              <Plus size={16} />
              Enable Engine
            </button>
          </div>

          <div className="engines-grid">
            {SECRETS_ENGINES.map(engine => {
              const Config = ENGINE_CONFIG[engine.type];
              const EngineIcon = Config.icon;
              
              return (
                <div key={engine.id} className={`engine-card ${engine.status}`}>
                  <div className="engine-header">
                    <div className={`engine-icon ${Config.color}`}>
                      <EngineIcon size={24} />
                    </div>
                    <div className="engine-title">
                      <h4>{engine.name}</h4>
                      <span className={`status-badge ${engine.status}`}>
                        {engine.status === 'active' && <CheckCircle size={12} />}
                        {engine.status === 'sealed' && <Lock size={12} />}
                        {engine.status}
                      </span>
                    </div>
                    <button className="action-btn">
                      <Settings size={16} />
                    </button>
                  </div>
                  <p className="engine-description">{engine.description}</p>
                  <div className="engine-details">
                    <div className="engine-detail">
                      <span className="label">Path</span>
                      <code className="value">{engine.path}</code>
                    </div>
                    <div className="engine-detail">
                      <span className="label">Secrets</span>
                      <span className="value">{engine.secrets}</span>
                    </div>
                    <div className="engine-detail">
                      <span className="label">Version</span>
                      <span className="value">{engine.version}</span>
                    </div>
                  </div>
                  <div className="engine-footer">
                    <button className="btn-sm">
                      <Eye size={14} />
                      View Secrets
                    </button>
                    <button className="btn-sm">
                      <Settings size={14} />
                      Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="policies-section">
          <div className="policies-header">
            <h3>Access Policies ({ACCESS_POLICIES.length})</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Policy
            </button>
          </div>

          <div className="policies-table">
            <div className="pt-header">
              <span className="pt-th">Policy</span>
              <span className="pt-th">Path</span>
              <span className="pt-th">Capabilities</span>
              <span className="pt-th">Principals</span>
              <span className="pt-th">Status</span>
              <span className="pt-th">Actions</span>
            </div>
            <div className="pt-body">
              {ACCESS_POLICIES.map(policy => (
                <div key={policy.id} className="pt-row">
                  <span className="pt-td name">
                    <Shield size={14} />
                    {policy.name}
                  </span>
                  <span className="pt-td path">
                    <code>{policy.path}</code>
                  </span>
                  <span className="pt-td capabilities">
                    {policy.capabilities.map((cap, idx) => (
                      <span key={idx} className={`cap-badge ${cap}`}>{cap}</span>
                    ))}
                  </span>
                  <span className="pt-td principals">
                    <div className="principals-mini">
                      {policy.principals.slice(0, 2).map((p, idx) => (
                        <span key={idx} className="principal-chip">{p}</span>
                      ))}
                      {policy.principals.length > 2 && (
                        <span className="principal-more">+{policy.principals.length - 2}</span>
                      )}
                    </div>
                  </span>
                  <span className={`pt-td status ${policy.enabled ? 'enabled' : 'disabled'}`}>
                    {policy.enabled ? (
                      <>
                        <CheckCircle size={14} />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Disabled
                      </>
                    )}
                  </span>
                  <span className="pt-td actions">
                    <button className="action-btn-sm" title="Edit">
                      <Edit size={12} />
                    </button>
                    <button className="action-btn-sm" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="audit-section">
          <div className="audit-header">
            <h3>Audit Log</h3>
            <div className="audit-filters">
              <select defaultValue="all">
                <option value="all">All Actions</option>
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="delete">Delete</option>
                <option value="rotate">Rotate</option>
              </select>
              <button className="btn-outline">
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          <div className="audit-table">
            <div className="at-header">
              <span className="at-th">Time</span>
              <span className="at-th">Action</span>
              <span className="at-th">Secret Path</span>
              <span className="at-th">Principal</span>
              <span className="at-th">Source IP</span>
              <span className="at-th">Status</span>
              <span className="at-th">Details</span>
            </div>
            <div className="at-body">
              {AUDIT_LOGS.map(log => {
                const ActionConfig = ACTION_CONFIG[log.action];
                
                return (
                  <div key={log.id} className="at-row">
                    <span className="at-td time">
                      {formatDate(log.timestamp)}
                    </span>
                    <span className={`at-td action ${ActionConfig.color}`}>
                      {ActionConfig.label}
                    </span>
                    <span className="at-td path">
                      <code>{log.secretPath}</code>
                    </span>
                    <span className="at-td principal">
                      {log.principal}
                    </span>
                    <span className="at-td ip">
                      {log.sourceIP}
                    </span>
                    <span className={`at-td status ${log.success ? 'success' : 'failed'}`}>
                      {log.success ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </span>
                    <span className="at-td details">
                      {log.details}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
