'use client';

import React, { useState } from 'react';
import { 
  Key, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FolderKey,
  FileKey,
  Settings,
  MoreVertical,
  RotateCcw,
  Activity,
  Unlock,
  Ban,
  BarChart3,
  Tag,
  Layers
} from 'lucide-react';
import './secret-management.css';

interface Secret {
  id: string;
  name: string;
  path: string;
  type: 'api-key' | 'password' | 'certificate' | 'ssh-key' | 'token' | 'connection-string' | 'encryption-key';
  environment: 'production' | 'staging' | 'development' | 'all';
  version: number;
  status: 'active' | 'expired' | 'revoked' | 'rotating';
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  rotationPolicy: string | null;
  lastAccessed: string;
  accessCount: number;
  owner: string;
  tags: string[];
}

interface SecretAccess {
  id: string;
  secretId: string;
  secretName: string;
  action: 'read' | 'write' | 'delete' | 'rotate';
  user: string;
  service: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
}

interface RotationPolicy {
  id: string;
  name: string;
  interval: string;
  lastRotation: string;
  nextRotation: string;
  secretsCount: number;
  status: 'active' | 'paused';
}

interface Vault {
  id: string;
  name: string;
  provider: string;
  region: string;
  secretsCount: number;
  status: 'healthy' | 'degraded' | 'offline';
  lastSync: string;
}

const SECRETS: Secret[] = [
  {
    id: 'sec-001',
    name: 'OPENAI_API_KEY',
    path: '/production/ai/openai',
    type: 'api-key',
    environment: 'production',
    version: 3,
    status: 'active',
    createdAt: '2024-06-15',
    updatedAt: '2025-01-10',
    expiresAt: null,
    rotationPolicy: '90 days',
    lastAccessed: '2025-01-15 14:32',
    accessCount: 15420,
    owner: 'AI Team',
    tags: ['ai', 'openai', 'critical']
  },
  {
    id: 'sec-002',
    name: 'DATABASE_URL',
    path: '/production/database/postgres',
    type: 'connection-string',
    environment: 'production',
    version: 2,
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-12-01',
    expiresAt: null,
    rotationPolicy: '180 days',
    lastAccessed: '2025-01-15 14:45',
    accessCount: 892450,
    owner: 'Platform Team',
    tags: ['database', 'postgres', 'critical']
  },
  {
    id: 'sec-003',
    name: 'STRIPE_SECRET_KEY',
    path: '/production/payments/stripe',
    type: 'api-key',
    environment: 'production',
    version: 4,
    status: 'active',
    createdAt: '2024-03-20',
    updatedAt: '2025-01-05',
    expiresAt: null,
    rotationPolicy: '30 days',
    lastAccessed: '2025-01-15 14:28',
    accessCount: 45890,
    owner: 'Payments Team',
    tags: ['payments', 'stripe', 'critical', 'pci']
  },
  {
    id: 'sec-004',
    name: 'JWT_SIGNING_KEY',
    path: '/production/auth/jwt',
    type: 'encryption-key',
    environment: 'production',
    version: 2,
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-08-15',
    expiresAt: '2025-02-15',
    rotationPolicy: '365 days',
    lastAccessed: '2025-01-15 14:50',
    accessCount: 2456780,
    owner: 'Security Team',
    tags: ['auth', 'jwt', 'critical', 'encryption']
  },
  {
    id: 'sec-005',
    name: 'SSH_DEPLOY_KEY',
    path: '/ci-cd/deploy/ssh',
    type: 'ssh-key',
    environment: 'all',
    version: 1,
    status: 'active',
    createdAt: '2024-05-01',
    updatedAt: '2024-05-01',
    expiresAt: null,
    rotationPolicy: null,
    lastAccessed: '2025-01-15 12:00',
    accessCount: 3450,
    owner: 'DevOps Team',
    tags: ['ci-cd', 'deployment', 'ssh']
  },
  {
    id: 'sec-006',
    name: 'AWS_ACCESS_KEY',
    path: '/production/cloud/aws',
    type: 'api-key',
    environment: 'production',
    version: 5,
    status: 'rotating',
    createdAt: '2024-01-15',
    updatedAt: '2025-01-15',
    expiresAt: null,
    rotationPolicy: '90 days',
    lastAccessed: '2025-01-15 14:55',
    accessCount: 128900,
    owner: 'Platform Team',
    tags: ['aws', 'cloud', 'iam']
  },
  {
    id: 'sec-007',
    name: 'REDIS_PASSWORD',
    path: '/production/cache/redis',
    type: 'password',
    environment: 'production',
    version: 2,
    status: 'active',
    createdAt: '2024-04-01',
    updatedAt: '2024-10-01',
    expiresAt: null,
    rotationPolicy: '180 days',
    lastAccessed: '2025-01-15 14:48',
    accessCount: 456780,
    owner: 'Platform Team',
    tags: ['cache', 'redis', 'database']
  },
  {
    id: 'sec-008',
    name: 'TLS_CERTIFICATE',
    path: '/production/ssl/wildcard',
    type: 'certificate',
    environment: 'production',
    version: 3,
    status: 'active',
    createdAt: '2024-09-01',
    updatedAt: '2024-09-01',
    expiresAt: '2025-09-01',
    rotationPolicy: 'Auto-renew',
    lastAccessed: '2025-01-15 00:00',
    accessCount: 1,
    owner: 'Security Team',
    tags: ['ssl', 'tls', 'certificate']
  },
  {
    id: 'sec-009',
    name: 'STAGING_DB_PASSWORD',
    path: '/staging/database/postgres',
    type: 'password',
    environment: 'staging',
    version: 1,
    status: 'expired',
    createdAt: '2024-06-01',
    updatedAt: '2024-06-01',
    expiresAt: '2024-12-01',
    rotationPolicy: '180 days',
    lastAccessed: '2024-11-30 15:00',
    accessCount: 8920,
    owner: 'Platform Team',
    tags: ['database', 'staging']
  },
  {
    id: 'sec-010',
    name: 'OLD_API_TOKEN',
    path: '/legacy/api/token',
    type: 'token',
    environment: 'production',
    version: 1,
    status: 'revoked',
    createdAt: '2023-01-01',
    updatedAt: '2024-06-15',
    expiresAt: null,
    rotationPolicy: null,
    lastAccessed: '2024-06-15 10:00',
    accessCount: 125000,
    owner: 'Platform Team',
    tags: ['legacy', 'deprecated']
  }
];

const SECRET_ACCESS_LOG: SecretAccess[] = [
  {
    id: 'log-001',
    secretId: 'sec-001',
    secretName: 'OPENAI_API_KEY',
    action: 'read',
    user: 'api-service',
    service: 'AI Assistant',
    timestamp: '2025-01-15 14:32:15',
    ipAddress: '10.0.1.45',
    success: true
  },
  {
    id: 'log-002',
    secretId: 'sec-002',
    secretName: 'DATABASE_URL',
    action: 'read',
    user: 'backend-api',
    service: 'User Service',
    timestamp: '2025-01-15 14:45:22',
    ipAddress: '10.0.2.12',
    success: true
  },
  {
    id: 'log-003',
    secretId: 'sec-006',
    secretName: 'AWS_ACCESS_KEY',
    action: 'rotate',
    user: 'rotation-service',
    service: 'Key Rotation',
    timestamp: '2025-01-15 14:00:00',
    ipAddress: '10.0.0.5',
    success: true
  },
  {
    id: 'log-004',
    secretId: 'sec-003',
    secretName: 'STRIPE_SECRET_KEY',
    action: 'read',
    user: 'payment-service',
    service: 'Payment Gateway',
    timestamp: '2025-01-15 14:28:45',
    ipAddress: '10.0.3.8',
    success: true
  },
  {
    id: 'log-005',
    secretId: 'sec-010',
    secretName: 'OLD_API_TOKEN',
    action: 'read',
    user: 'unknown',
    service: 'External',
    timestamp: '2025-01-15 13:15:00',
    ipAddress: '203.45.67.89',
    success: false
  }
];

const ROTATION_POLICIES: RotationPolicy[] = [
  {
    id: 'pol-001',
    name: '30-Day Critical Keys',
    interval: '30 days',
    lastRotation: '2025-01-05',
    nextRotation: '2025-02-04',
    secretsCount: 3,
    status: 'active'
  },
  {
    id: 'pol-002',
    name: '90-Day Standard Keys',
    interval: '90 days',
    lastRotation: '2024-12-15',
    nextRotation: '2025-03-15',
    secretsCount: 8,
    status: 'active'
  },
  {
    id: 'pol-003',
    name: '180-Day Database Credentials',
    interval: '180 days',
    lastRotation: '2024-10-01',
    nextRotation: '2025-03-30',
    secretsCount: 5,
    status: 'active'
  },
  {
    id: 'pol-004',
    name: 'Annual Encryption Keys',
    interval: '365 days',
    lastRotation: '2024-08-15',
    nextRotation: '2025-08-15',
    secretsCount: 2,
    status: 'active'
  }
];

const VAULTS: Vault[] = [
  {
    id: 'vault-001',
    name: 'Production Vault',
    provider: 'HashiCorp Vault',
    region: 'us-east-1',
    secretsCount: 45,
    status: 'healthy',
    lastSync: '2025-01-15 14:55'
  },
  {
    id: 'vault-002',
    name: 'AWS Secrets Manager',
    provider: 'AWS',
    region: 'us-east-1',
    secretsCount: 28,
    status: 'healthy',
    lastSync: '2025-01-15 14:50'
  },
  {
    id: 'vault-003',
    name: 'Azure Key Vault',
    provider: 'Azure',
    region: 'eastus',
    secretsCount: 15,
    status: 'healthy',
    lastSync: '2025-01-15 14:45'
  }
];

const TYPE_CONFIG: Record<Secret['type'], { color: string; bg: string; icon: React.ElementType }> = {
  'api-key': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Key },
  'password': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: Lock },
  'certificate': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: Shield },
  'ssh-key': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: FileKey },
  'token': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: Key },
  'connection-string': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: Layers },
  'encryption-key': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: FolderKey }
};

const STATUS_CONFIG: Record<Secret['status'], { color: string; bg: string; icon: React.ElementType }> = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle },
  expired: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock },
  revoked: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: Ban },
  rotating: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: RefreshCw }
};

const ENV_CONFIG: Record<Secret['environment'], { color: string; bg: string }> = {
  production: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  staging: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  development: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  all: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
};

export default function SecretManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'secrets' | 'access' | 'rotation' | 'vaults'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});

  const filteredSecrets = SECRETS.filter(secret => {
    const matchesSearch = secret.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      secret.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || secret.type === filterType;
    const matchesStatus = filterStatus === 'all' || secret.status === filterStatus;
    const matchesEnv = filterEnv === 'all' || secret.environment === filterEnv;
    return matchesSearch && matchesType && matchesStatus && matchesEnv;
  });

  const activeSecrets = SECRETS.filter(s => s.status === 'active').length;
  const expiredSecrets = SECRETS.filter(s => s.status === 'expired').length;
  const rotatingSecrets = SECRETS.filter(s => s.status === 'rotating').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'secrets', label: 'Secrets', icon: Key, count: SECRETS.length },
    { id: 'access', label: 'Access Log', icon: History },
    { id: 'rotation', label: 'Rotation', icon: RefreshCw },
    { id: 'vaults', label: 'Vaults', icon: FolderKey }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-cards">
        <div className="overview-card vaults">
          <h3>Vault Status</h3>
          <div className="vault-list">
            {VAULTS.map(vault => (
              <div key={vault.id} className={`vault-item ${vault.status}`}>
                <div className="vault-icon">
                  <FolderKey size={18} />
                </div>
                <div className="vault-info">
                  <span className="vault-name">{vault.name}</span>
                  <span className="vault-meta">{vault.provider} • {vault.region}</span>
                </div>
                <div className="vault-stats">
                  <span className="vault-count">{vault.secretsCount}</span>
                  <span className="vault-status">{vault.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card types">
          <h3>Secrets by Type</h3>
          <div className="types-chart">
            {Object.entries(TYPE_CONFIG).map(([type, config]) => {
              const count = SECRETS.filter(s => s.type === type).length;
              const IconComponent = config.icon;
              return (
                <div key={type} className="type-item">
                  <div 
                    className="type-icon"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <IconComponent size={16} />
                  </div>
                  <span className="type-name">{type.replace('-', ' ')}</span>
                  <span className="type-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overview-card activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {SECRET_ACCESS_LOG.slice(0, 4).map(log => (
              <div key={log.id} className={`activity-item ${log.success ? 'success' : 'failed'}`}>
                <div className={`activity-icon ${log.action}`}>
                  {log.action === 'read' && <Eye size={14} />}
                  {log.action === 'write' && <Settings size={14} />}
                  {log.action === 'rotate' && <RefreshCw size={14} />}
                  {log.action === 'delete' && <Trash2 size={14} />}
                </div>
                <div className="activity-info">
                  <span className="activity-action">{log.action} • {log.secretName}</span>
                  <span className="activity-meta">{log.user} • {log.timestamp}</span>
                </div>
                {!log.success && (
                  <AlertTriangle size={14} className="activity-warning" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overview-alerts">
        <h3>Alerts & Recommendations</h3>
        <div className="alerts-list">
          {expiredSecrets > 0 && (
            <div className="alert-item warning">
              <AlertTriangle size={18} />
              <div className="alert-content">
                <span className="alert-title">{expiredSecrets} Expired Secret{expiredSecrets > 1 ? 's' : ''}</span>
                <span className="alert-desc">Review and rotate or remove expired secrets</span>
              </div>
              <button className="alert-action">Review</button>
            </div>
          )}
          <div className="alert-item info">
            <Clock size={18} />
            <div className="alert-content">
              <span className="alert-title">3 Secrets Expiring Soon</span>
              <span className="alert-desc">JWT_SIGNING_KEY expires in 30 days</span>
            </div>
            <button className="alert-action">View</button>
          </div>
          {rotatingSecrets > 0 && (
            <div className="alert-item rotating">
              <RefreshCw size={18} />
              <div className="alert-content">
                <span className="alert-title">{rotatingSecrets} Secret{rotatingSecrets > 1 ? 's' : ''} Rotating</span>
                <span className="alert-desc">Automatic rotation in progress</span>
              </div>
              <button className="alert-action">Monitor</button>
            </div>
          )}
        </div>
      </div>

      <div className="overview-rotation">
        <h3>Upcoming Rotations</h3>
        <div className="rotation-timeline">
          {ROTATION_POLICIES.map(policy => (
            <div key={policy.id} className="rotation-item">
              <div className="rotation-date">
                <span className="date-month">{new Date(policy.nextRotation).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="date-day">{new Date(policy.nextRotation).getDate()}</span>
              </div>
              <div className="rotation-info">
                <span className="rotation-name">{policy.name}</span>
                <span className="rotation-meta">{policy.secretsCount} secrets • {policy.interval}</span>
              </div>
              <span className={`rotation-status ${policy.status}`}>{policy.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecrets = () => (
    <div className="secrets-section">
      <div className="secrets-toolbar">
        <div className="search-filters">
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="api-key">API Key</option>
            <option value="password">Password</option>
            <option value="certificate">Certificate</option>
            <option value="ssh-key">SSH Key</option>
            <option value="token">Token</option>
            <option value="connection-string">Connection String</option>
            <option value="encryption-key">Encryption Key</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
            <option value="rotating">Rotating</option>
          </select>
          <select
            value={filterEnv}
            onChange={(e) => setFilterEnv(e.target.value)}
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Secret
          </button>
        </div>
      </div>

      <div className="secrets-list">
        {filteredSecrets.map(secret => {
          const typeConfig = TYPE_CONFIG[secret.type];
          const statusConfig = STATUS_CONFIG[secret.status];
          const envConfig = ENV_CONFIG[secret.environment];
          const TypeIcon = typeConfig.icon;
          const StatusIcon = statusConfig.icon;
          return (
            <div 
              key={secret.id} 
              className={`secret-card ${secret.status}`}
              onClick={() => setSelectedSecret(secret)}
            >
              <div className="secret-main">
                <div 
                  className="secret-type-icon"
                  style={{ background: typeConfig.bg, color: typeConfig.color }}
                >
                  <TypeIcon size={20} />
                </div>
                <div className="secret-info">
                  <div className="secret-header">
                    <h4>{secret.name}</h4>
                    <div className="secret-badges">
                      <span 
                        className="status-badge"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        <StatusIcon size={12} className={secret.status === 'rotating' ? 'spin' : ''} />
                        {secret.status}
                      </span>
                      <span 
                        className="env-badge"
                        style={{ background: envConfig.bg, color: envConfig.color }}
                      >
                        {secret.environment}
                      </span>
                    </div>
                  </div>
                  <span className="secret-path">{secret.path}</span>
                  <div className="secret-meta">
                    <span className="meta-item">
                      <User size={12} />
                      {secret.owner}
                    </span>
                    <span className="meta-item">
                      <Activity size={12} />
                      {secret.accessCount.toLocaleString()} accesses
                    </span>
                    <span className="meta-item">
                      <Clock size={12} />
                      v{secret.version}
                    </span>
                  </div>
                </div>
              </div>
              <div className="secret-details">
                <div className="detail-item">
                  <span className="detail-label">Last Accessed</span>
                  <span className="detail-value">{secret.lastAccessed}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Rotation</span>
                  <span className="detail-value">{secret.rotationPolicy || 'Manual'}</span>
                </div>
                {secret.expiresAt && (
                  <div className="detail-item">
                    <span className="detail-label">Expires</span>
                    <span className="detail-value warning">{secret.expiresAt}</span>
                  </div>
                )}
              </div>
              <div className="secret-tags">
                {secret.tags.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
              <div className="secret-actions">
                <button 
                  className="action-btn" 
                  title={showValue[secret.id] ? "Hide Value" : "Show Value"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowValue(prev => ({ ...prev, [secret.id]: !prev[secret.id] }));
                  }}
                >
                  {showValue[secret.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button className="action-btn" title="Copy" onClick={(e) => e.stopPropagation()}>
                  <Copy size={14} />
                </button>
                <button className="action-btn" title="Rotate" onClick={(e) => e.stopPropagation()}>
                  <RefreshCw size={14} />
                </button>
                <button className="action-btn" title="More" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSecret && (
        <div className="secret-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div 
                className="panel-icon"
                style={{ 
                  background: TYPE_CONFIG[selectedSecret.type].bg, 
                  color: TYPE_CONFIG[selectedSecret.type].color 
                }}
              >
                {React.createElement(TYPE_CONFIG[selectedSecret.type].icon, { size: 20 })}
              </div>
              <div>
                <h3>{selectedSecret.name}</h3>
                <span className="panel-path">{selectedSecret.path}</span>
              </div>
            </div>
            <button 
              className="close-btn"
              onClick={() => setSelectedSecret(null)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="panel-status-row">
              <span 
                className="status-badge large"
                style={{ 
                  background: STATUS_CONFIG[selectedSecret.status].bg, 
                  color: STATUS_CONFIG[selectedSecret.status].color 
                }}
              >
                {selectedSecret.status}
              </span>
              <span 
                className="env-badge large"
                style={{ 
                  background: ENV_CONFIG[selectedSecret.environment].bg, 
                  color: ENV_CONFIG[selectedSecret.environment].color 
                }}
              >
                {selectedSecret.environment}
              </span>
            </div>

            <div className="panel-section">
              <h4>Value</h4>
              <div className="value-display">
                <span className="value-text">
                  {showValue[selectedSecret.id] ? '••••••••••••••••••••••••••••' : '••••••••••••••••••••••••••••'}
                </span>
                <div className="value-actions">
                  <button 
                    className="icon-btn"
                    onClick={() => setShowValue(prev => ({ ...prev, [selectedSecret.id]: !prev[selectedSecret.id] }))}
                  >
                    {showValue[selectedSecret.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button className="icon-btn">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedSecret.type.replace('-', ' ')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Version</span>
                  <span className="detail-value">{selectedSecret.version}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Owner</span>
                  <span className="detail-value">{selectedSecret.owner}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Access Count</span>
                  <span className="detail-value">{selectedSecret.accessCount.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{selectedSecret.createdAt}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Updated</span>
                  <span className="detail-value">{selectedSecret.updatedAt}</span>
                </div>
                {selectedSecret.expiresAt && (
                  <div className="detail-item">
                    <span className="detail-label">Expires</span>
                    <span className="detail-value warning">{selectedSecret.expiresAt}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Rotation Policy</span>
                  <span className="detail-value">{selectedSecret.rotationPolicy || 'Manual'}</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Tags</h4>
              <div className="tags-list">
                {selectedSecret.tags.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <RefreshCw size={16} />
                Rotate Now
              </button>
              <button className="btn-outline">
                <History size={16} />
                View History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccess = () => (
    <div className="access-section">
      <div className="access-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search access logs..."
          />
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="access-table">
        <table>
          <thead>
            <tr>
              <th>Secret</th>
              <th>Action</th>
              <th>User / Service</th>
              <th>Timestamp</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {SECRET_ACCESS_LOG.map(log => (
              <tr key={log.id} className={log.success ? '' : 'failed'}>
                <td>
                  <div className="log-secret">
                    <Key size={14} />
                    <span>{log.secretName}</span>
                  </div>
                </td>
                <td>
                  <span className={`action-badge ${log.action}`}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <div className="log-user">
                    <span className="user-name">{log.user}</span>
                    <span className="user-service">{log.service}</span>
                  </div>
                </td>
                <td>{log.timestamp}</td>
                <td className="ip-cell">{log.ipAddress}</td>
                <td>
                  {log.success ? (
                    <span className="status-success">
                      <CheckCircle size={14} />
                      Success
                    </span>
                  ) : (
                    <span className="status-failed">
                      <XCircle size={14} />
                      Failed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRotation = () => (
    <div className="rotation-section">
      <div className="rotation-header">
        <h3>Rotation Policies</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Policy
        </button>
      </div>

      <div className="policies-grid">
        {ROTATION_POLICIES.map(policy => (
          <div key={policy.id} className={`policy-card ${policy.status}`}>
            <div className="policy-header">
              <div className="policy-icon">
                <RotateCcw size={20} />
              </div>
              <div className="policy-info">
                <h4>{policy.name}</h4>
                <span className="policy-id">{policy.id}</span>
              </div>
              <span className={`policy-status ${policy.status}`}>{policy.status}</span>
            </div>

            <div className="policy-stats">
              <div className="stat-item">
                <span className="stat-value">{policy.interval}</span>
                <span className="stat-label">Interval</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{policy.secretsCount}</span>
                <span className="stat-label">Secrets</span>
              </div>
            </div>

            <div className="policy-dates">
              <div className="date-item">
                <Clock size={14} />
                <span>Last: {policy.lastRotation}</span>
              </div>
              <div className="date-item">
                <Calendar size={14} />
                <span>Next: {policy.nextRotation}</span>
              </div>
            </div>

            <div className="policy-actions">
              <button className="btn-outline small">
                <RefreshCw size={14} />
                Rotate Now
              </button>
              <button className="btn-outline small">
                <Settings size={14} />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVaults = () => (
    <div className="vaults-section">
      <div className="vaults-header">
        <h3>Connected Vaults</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Connect Vault
        </button>
      </div>

      <div className="vaults-grid">
        {VAULTS.map(vault => (
          <div key={vault.id} className={`vault-card ${vault.status}`}>
            <div className="vault-card-header">
              <div className="vault-card-icon">
                <FolderKey size={24} />
              </div>
              <span className={`vault-status-badge ${vault.status}`}>{vault.status}</span>
            </div>

            <h4>{vault.name}</h4>
            <span className="vault-provider">{vault.provider}</span>

            <div className="vault-details">
              <div className="vault-detail">
                <span className="detail-label">Region</span>
                <span className="detail-value">{vault.region}</span>
              </div>
              <div className="vault-detail">
                <span className="detail-label">Secrets</span>
                <span className="detail-value">{vault.secretsCount}</span>
              </div>
              <div className="vault-detail">
                <span className="detail-label">Last Sync</span>
                <span className="detail-value">{vault.lastSync}</span>
              </div>
            </div>

            <div className="vault-actions">
              <button className="btn-outline small">
                <RefreshCw size={14} />
                Sync
              </button>
              <button className="btn-outline small">
                <Settings size={14} />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="secret-management">
      <header className="sec__header">
        <div className="sec__title-section">
          <div className="sec__icon">
            <Key size={28} />
          </div>
          <div>
            <h1>Secret Management</h1>
            <p>Centralized secrets and credentials management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync All
          </button>
          <button className="btn-outline">
            <Shield size={16} />
            Audit
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Secret
          </button>
        </div>
      </header>

      <div className="sec__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Key size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{SECRETS.length}</span>
            <span className="stat-label">Total Secrets</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeSecrets}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{expiredSecrets}</span>
            <span className="stat-label">Expired</span>
          </div>
          {expiredSecrets > 0 && (
            <span className="stat-badge warning">Needs Attention</span>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon vaults">
            <FolderKey size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{VAULTS.length}</span>
            <span className="stat-label">Vaults</span>
          </div>
        </div>
      </div>

      <nav className="sec__tabs">
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

      <main className="sec__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'secrets' && renderSecrets()}
        {activeTab === 'access' && renderAccess()}
        {activeTab === 'rotation' && renderRotation()}
        {activeTab === 'vaults' && renderVaults()}
      </main>
    </div>
  );
}
