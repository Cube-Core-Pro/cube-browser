'use client';

import React, { useState } from 'react';
import { 
  KeyRound,
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit3,
  MoreVertical,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Folder,
  FolderOpen,
  FileKey,
  Settings,
  History,
  RotateCcw,
  Zap,
  Server,
  Database,
  Cloud,
  GitBranch,
  Tag,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink
} from 'lucide-react';
import './secrets-vault.css';

interface Secret {
  id: string;
  name: string;
  path: string;
  type: 'api-key' | 'password' | 'certificate' | 'token' | 'ssh-key' | 'generic';
  createdAt: string;
  updatedAt: string;
  version: number;
  rotationEnabled: boolean;
  rotationPeriod?: number;
  lastRotated?: string;
  nextRotation?: string;
  accessCount: number;
  metadata: Record<string, string>;
}

interface SecretFolder {
  id: string;
  name: string;
  path: string;
  secretsCount: number;
  subFolders: number;
}

interface AccessPolicy {
  id: string;
  name: string;
  path: string;
  permissions: ('read' | 'write' | 'delete' | 'admin')[];
  principals: string[];
  createdAt: string;
}

interface AccessLog {
  id: string;
  secretPath: string;
  action: 'read' | 'write' | 'delete' | 'rotate';
  principal: string;
  timestamp: string;
  success: boolean;
  sourceIp: string;
}

interface RotationSchedule {
  id: string;
  secretPath: string;
  secretName: string;
  frequency: string;
  lastRotation: string;
  nextRotation: string;
  status: 'active' | 'paused' | 'overdue';
}

const SecretsVaultDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'secrets' | 'policies' | 'rotation' | 'audit'>('secrets');
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showValue, setShowValue] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const folders: SecretFolder[] = [
    { id: 'f1', name: 'production', path: '/production', secretsCount: 24, subFolders: 3 },
    { id: 'f2', name: 'staging', path: '/staging', secretsCount: 18, subFolders: 2 },
    { id: 'f3', name: 'development', path: '/development', secretsCount: 12, subFolders: 2 },
    { id: 'f4', name: 'shared', path: '/shared', secretsCount: 8, subFolders: 1 },
    { id: 'f5', name: 'infrastructure', path: '/infrastructure', secretsCount: 15, subFolders: 4 }
  ];

  const secrets: Secret[] = [
    {
      id: 's1',
      name: 'OPENAI_API_KEY',
      path: '/production/api-keys',
      type: 'api-key',
      createdAt: '2024-06-15',
      updatedAt: '2025-01-20',
      version: 5,
      rotationEnabled: true,
      rotationPeriod: 90,
      lastRotated: '2025-01-20',
      nextRotation: '2025-04-20',
      accessCount: 1250,
      metadata: { service: 'ai-service', environment: 'production' }
    },
    {
      id: 's2',
      name: 'DATABASE_PASSWORD',
      path: '/production/database',
      type: 'password',
      createdAt: '2024-03-10',
      updatedAt: '2025-02-01',
      version: 8,
      rotationEnabled: true,
      rotationPeriod: 30,
      lastRotated: '2025-02-01',
      nextRotation: '2025-03-03',
      accessCount: 4580,
      metadata: { database: 'postgresql', instance: 'primary' }
    },
    {
      id: 's3',
      name: 'STRIPE_SECRET_KEY',
      path: '/production/payments',
      type: 'api-key',
      createdAt: '2024-08-20',
      updatedAt: '2024-12-15',
      version: 2,
      rotationEnabled: false,
      accessCount: 890,
      metadata: { service: 'payment-service', provider: 'stripe' }
    },
    {
      id: 's4',
      name: 'JWT_SIGNING_KEY',
      path: '/production/auth',
      type: 'token',
      createdAt: '2024-01-05',
      updatedAt: '2025-01-05',
      version: 4,
      rotationEnabled: true,
      rotationPeriod: 365,
      lastRotated: '2025-01-05',
      nextRotation: '2026-01-05',
      accessCount: 12500,
      metadata: { algorithm: 'RS256', service: 'auth-service' }
    },
    {
      id: 's5',
      name: 'AWS_ACCESS_KEY',
      path: '/infrastructure/aws',
      type: 'api-key',
      createdAt: '2024-04-01',
      updatedAt: '2025-02-10',
      version: 6,
      rotationEnabled: true,
      rotationPeriod: 60,
      lastRotated: '2025-02-10',
      nextRotation: '2025-04-11',
      accessCount: 3200,
      metadata: { provider: 'aws', account: 'production' }
    },
    {
      id: 's6',
      name: 'SSH_DEPLOY_KEY',
      path: '/infrastructure/ssh',
      type: 'ssh-key',
      createdAt: '2024-02-15',
      updatedAt: '2024-08-15',
      version: 3,
      rotationEnabled: false,
      accessCount: 456,
      metadata: { keyType: 'ed25519', usage: 'deployment' }
    },
    {
      id: 's7',
      name: 'REDIS_PASSWORD',
      path: '/production/cache',
      type: 'password',
      createdAt: '2024-05-20',
      updatedAt: '2025-01-25',
      version: 4,
      rotationEnabled: true,
      rotationPeriod: 45,
      lastRotated: '2025-01-25',
      nextRotation: '2025-03-11',
      accessCount: 2100,
      metadata: { service: 'redis', cluster: 'cache-prod' }
    },
    {
      id: 's8',
      name: 'GITHUB_TOKEN',
      path: '/shared/integrations',
      type: 'token',
      createdAt: '2024-07-10',
      updatedAt: '2024-11-10',
      version: 2,
      rotationEnabled: false,
      accessCount: 780,
      metadata: { scope: 'repo,workflow', owner: 'cube-elite' }
    }
  ];

  const policies: AccessPolicy[] = [
    { id: 'p1', name: 'production-read', path: '/production/*', permissions: ['read'], principals: ['api-service', 'backend-service'], createdAt: '2024-03-15' },
    { id: 'p2', name: 'production-admin', path: '/production/*', permissions: ['read', 'write', 'delete', 'admin'], principals: ['platform-admin'], createdAt: '2024-01-10' },
    { id: 'p3', name: 'infrastructure-ops', path: '/infrastructure/*', permissions: ['read', 'write'], principals: ['devops-team', 'sre-team'], createdAt: '2024-02-20' },
    { id: 'p4', name: 'shared-readonly', path: '/shared/*', permissions: ['read'], principals: ['all-services'], createdAt: '2024-04-05' },
    { id: 'p5', name: 'staging-full', path: '/staging/*', permissions: ['read', 'write', 'delete'], principals: ['dev-team'], createdAt: '2024-05-12' }
  ];

  const accessLogs: AccessLog[] = [
    { id: 'l1', secretPath: '/production/api-keys/OPENAI_API_KEY', action: 'read', principal: 'ai-service', timestamp: '2025-02-18T14:30:00Z', success: true, sourceIp: '10.0.2.15' },
    { id: 'l2', secretPath: '/production/database/DATABASE_PASSWORD', action: 'read', principal: 'backend-service', timestamp: '2025-02-18T14:28:00Z', success: true, sourceIp: '10.0.2.20' },
    { id: 'l3', secretPath: '/production/payments/STRIPE_SECRET_KEY', action: 'read', principal: 'payment-service', timestamp: '2025-02-18T14:25:00Z', success: true, sourceIp: '10.0.2.25' },
    { id: 'l4', secretPath: '/infrastructure/aws/AWS_ACCESS_KEY', action: 'rotate', principal: 'rotation-service', timestamp: '2025-02-18T14:00:00Z', success: true, sourceIp: '10.0.1.5' },
    { id: 'l5', secretPath: '/production/auth/JWT_SIGNING_KEY', action: 'read', principal: 'unknown-service', timestamp: '2025-02-18T13:45:00Z', success: false, sourceIp: '192.168.1.100' },
    { id: 'l6', secretPath: '/production/cache/REDIS_PASSWORD', action: 'write', principal: 'admin@cube-elite.com', timestamp: '2025-02-18T12:30:00Z', success: true, sourceIp: '10.0.0.5' }
  ];

  const rotationSchedules: RotationSchedule[] = [
    { id: 'r1', secretPath: '/production/database/DATABASE_PASSWORD', secretName: 'DATABASE_PASSWORD', frequency: 'Every 30 days', lastRotation: '2025-02-01', nextRotation: '2025-03-03', status: 'active' },
    { id: 'r2', secretPath: '/production/api-keys/OPENAI_API_KEY', secretName: 'OPENAI_API_KEY', frequency: 'Every 90 days', lastRotation: '2025-01-20', nextRotation: '2025-04-20', status: 'active' },
    { id: 'r3', secretPath: '/production/cache/REDIS_PASSWORD', secretName: 'REDIS_PASSWORD', frequency: 'Every 45 days', lastRotation: '2025-01-25', nextRotation: '2025-03-11', status: 'active' },
    { id: 'r4', secretPath: '/infrastructure/aws/AWS_ACCESS_KEY', secretName: 'AWS_ACCESS_KEY', frequency: 'Every 60 days', lastRotation: '2025-02-10', nextRotation: '2025-04-11', status: 'active' },
    { id: 'r5', secretPath: '/production/auth/JWT_SIGNING_KEY', secretName: 'JWT_SIGNING_KEY', frequency: 'Every 365 days', lastRotation: '2025-01-05', nextRotation: '2026-01-05', status: 'active' }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getSecretTypeIcon = (type: string) => {
    switch (type) {
      case 'api-key': return <Key size={16} />;
      case 'password': return <Lock size={16} />;
      case 'certificate': return <Shield size={16} />;
      case 'token': return <Zap size={16} />;
      case 'ssh-key': return <FileKey size={16} />;
      default: return <KeyRound size={16} />;
    }
  };

  const totalSecrets = secrets.length;
  const rotationEnabled = secrets.filter(s => s.rotationEnabled).length;
  const recentAccess = accessLogs.filter(l => l.success).length;
  const failedAccess = accessLogs.filter(l => !l.success).length;

  const filteredSecrets = secrets.filter(secret =>
    secret.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    secret.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="secrets-vault">
      <header className="sv__header">
        <div className="sv__title-section">
          <div className="sv__icon">
            <KeyRound size={28} />
          </div>
          <div>
            <h1>Secrets Vault</h1>
            <p>Secure storage and management for sensitive data</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            Sync
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Secret
          </button>
        </div>
      </header>

      <div className="vault-summary">
        <div className="summary-card total">
          <div className="summary-icon">
            <KeyRound size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{totalSecrets}</span>
            <span className="summary-label">Total Secrets</span>
          </div>
        </div>
        <div className="summary-card rotation">
          <div className="summary-icon">
            <RotateCcw size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{rotationEnabled}</span>
            <span className="summary-label">Auto-Rotation</span>
          </div>
        </div>
        <div className="summary-card access">
          <div className="summary-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{recentAccess}</span>
            <span className="summary-label">Recent Access</span>
          </div>
        </div>
        <div className="summary-card failed">
          <div className="summary-icon">
            <XCircle size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{failedAccess}</span>
            <span className="summary-label">Failed Access</span>
          </div>
        </div>
        <div className="summary-card policies">
          <div className="summary-icon">
            <Shield size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{policies.length}</span>
            <span className="summary-label">Policies</span>
          </div>
        </div>
      </div>

      <nav className="sv__tabs">
        <button 
          className={`tab-btn ${activeTab === 'secrets' ? 'active' : ''}`}
          onClick={() => setActiveTab('secrets')}
        >
          <KeyRound size={16} />
          Secrets
          <span className="tab-badge">{secrets.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Shield size={16} />
          Access Policies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rotation' ? 'active' : ''}`}
          onClick={() => setActiveTab('rotation')}
        >
          <RotateCcw size={16} />
          Rotation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={16} />
          Audit Log
        </button>
      </nav>

      <main className="sv__content">
        {activeTab === 'secrets' && (
          <div className="secrets-tab">
            <div className="secrets-layout">
              <aside className="folders-sidebar">
                <div className="sidebar-header">
                  <h4>Folders</h4>
                  <button className="btn-icon small" title="New folder">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="folders-list">
                  <div 
                    className={`folder-item ${currentPath === '/' ? 'active' : ''}`}
                    onClick={() => setCurrentPath('/')}
                  >
                    <Folder size={16} />
                    <span>Root</span>
                    <span className="folder-count">{secrets.length}</span>
                  </div>
                  {folders.map(folder => (
                    <div 
                      key={folder.id}
                      className={`folder-item ${currentPath === folder.path ? 'active' : ''}`}
                      onClick={() => setCurrentPath(folder.path)}
                    >
                      {currentPath === folder.path ? <FolderOpen size={16} /> : <Folder size={16} />}
                      <span>{folder.name}</span>
                      <span className="folder-count">{folder.secretsCount}</span>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="secrets-main">
                <div className="secrets-toolbar">
                  <div className="breadcrumb">
                    <span className="breadcrumb-item" onClick={() => setCurrentPath('/')}>Root</span>
                    {currentPath !== '/' && (
                      <>
                        <ChevronRight size={14} />
                        <span className="breadcrumb-item active">{currentPath.slice(1)}</span>
                      </>
                    )}
                  </div>
                  <div className="search-box">
                    <Search size={16} />
                    <input 
                      type="text"
                      placeholder="Search secrets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="secrets-table">
                  <div className="table-header">
                    <span>Secret Name</span>
                    <span>Type</span>
                    <span>Path</span>
                    <span>Version</span>
                    <span>Last Updated</span>
                    <span>Rotation</span>
                    <span>Actions</span>
                  </div>
                  {filteredSecrets.map(secret => (
                    <div 
                      key={secret.id} 
                      className="table-row"
                      onClick={() => setSelectedSecret(secret)}
                    >
                      <span className="secret-name-cell">
                        <div className={`secret-type-icon ${secret.type}`}>
                          {getSecretTypeIcon(secret.type)}
                        </div>
                        <div className="secret-name-info">
                          <span className="secret-name">{secret.name}</span>
                          <span className="access-count">{secret.accessCount.toLocaleString()} reads</span>
                        </div>
                      </span>
                      <span className="type-cell">
                        <span className={`type-badge ${secret.type}`}>{secret.type}</span>
                      </span>
                      <span className="path-cell code">{secret.path}</span>
                      <span className="version-cell">
                        <GitBranch size={12} />
                        v{secret.version}
                      </span>
                      <span className="date-cell">
                        <Calendar size={12} />
                        {secret.updatedAt}
                      </span>
                      <span className="rotation-cell">
                        {secret.rotationEnabled ? (
                          <span className="rotation-enabled">
                            <RotateCcw size={12} />
                            {secret.rotationPeriod}d
                          </span>
                        ) : (
                          <span className="rotation-disabled">
                            <XCircle size={12} />
                            Disabled
                          </span>
                        )}
                      </span>
                      <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn-icon small"
                          title={showValue === secret.id ? 'Hide value' : 'Show value'}
                          onClick={() => setShowValue(showValue === secret.id ? null : secret.id)}
                        >
                          {showValue === secret.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="btn-icon small" title="Copy">
                          <Copy size={14} />
                        </button>
                        <button className="btn-icon small" title="More options">
                          <MoreVertical size={14} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedSecret && (
              <div className="secret-detail-panel">
                <div className="panel-header">
                  <div className={`panel-icon ${selectedSecret.type}`}>
                    {getSecretTypeIcon(selectedSecret.type)}
                  </div>
                  <div className="panel-title">
                    <h3>{selectedSecret.name}</h3>
                    <span className="panel-path">{selectedSecret.path}</span>
                  </div>
                  <button className="btn-icon" onClick={() => setSelectedSecret(null)}>
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="panel-content">
                  <div className="detail-section">
                    <h4>Secret Value</h4>
                    <div className="secret-value-container">
                      <input 
                        type={showValue === selectedSecret.id ? 'text' : 'password'}
                        value="sk-proj-xxxxxxxxxxxxxxxxxxxx"
                        readOnly
                        className="secret-value-input"
                      />
                      <button 
                        className="btn-icon"
                        onClick={() => setShowValue(showValue === selectedSecret.id ? null : selectedSecret.id)}
                      >
                        {showValue === selectedSecret.id ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button className="btn-icon" title="Copy">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Details</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span className={`type-badge ${selectedSecret.type}`}>{selectedSecret.type}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Version</span>
                        <span className="detail-value">v{selectedSecret.version}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created</span>
                        <span className="detail-value">{selectedSecret.createdAt}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Updated</span>
                        <span className="detail-value">{selectedSecret.updatedAt}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Access Count</span>
                        <span className="detail-value">{selectedSecret.accessCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Rotation</h4>
                    {selectedSecret.rotationEnabled ? (
                      <div className="rotation-info">
                        <div className="rotation-status active">
                          <CheckCircle2 size={14} />
                          Auto-rotation enabled
                        </div>
                        <div className="rotation-details">
                          <div className="rotation-detail">
                            <span className="label">Period</span>
                            <span className="value">{selectedSecret.rotationPeriod} days</span>
                          </div>
                          <div className="rotation-detail">
                            <span className="label">Last Rotated</span>
                            <span className="value">{selectedSecret.lastRotated}</span>
                          </div>
                          <div className="rotation-detail">
                            <span className="label">Next Rotation</span>
                            <span className="value">{selectedSecret.nextRotation}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rotation-info">
                        <div className="rotation-status disabled">
                          <XCircle size={14} />
                          Auto-rotation disabled
                        </div>
                        <button className="btn-outline small">
                          <RotateCcw size={14} />
                          Enable Rotation
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h4>Metadata</h4>
                    <div className="metadata-tags">
                      {Object.entries(selectedSecret.metadata).map(([key, value]) => (
                        <span key={key} className="metadata-tag">
                          <Tag size={12} />
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="panel-actions">
                  <button className="btn-outline">
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button className="btn-outline">
                    <RotateCcw size={14} />
                    Rotate Now
                  </button>
                  <button className="btn-outline">
                    <History size={14} />
                    History
                  </button>
                  <button className="btn-outline danger">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="policies-tab">
            <div className="policies-header">
              <h3>Access Policies</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Create Policy
              </button>
            </div>

            <div className="policies-table">
              <div className="table-header">
                <span>Policy Name</span>
                <span>Path Pattern</span>
                <span>Permissions</span>
                <span>Principals</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
              {policies.map(policy => (
                <div key={policy.id} className="table-row">
                  <span className="policy-name-cell">
                    <Shield size={16} />
                    {policy.name}
                  </span>
                  <span className="path-cell code">{policy.path}</span>
                  <span className="permissions-cell">
                    {policy.permissions.map(perm => (
                      <span key={perm} className={`permission-badge ${perm}`}>{perm}</span>
                    ))}
                  </span>
                  <span className="principals-cell">
                    <Users size={14} />
                    {policy.principals.length} principals
                  </span>
                  <span className="date-cell">{policy.createdAt}</span>
                  <span className="actions-cell">
                    <button className="btn-icon small" title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button className="btn-icon small" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rotation' && (
          <div className="rotation-tab">
            <div className="rotation-header">
              <h3>Rotation Schedules</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Add Schedule
              </button>
            </div>

            <div className="rotation-cards">
              {rotationSchedules.map(schedule => (
                <div key={schedule.id} className={`rotation-card ${schedule.status}`}>
                  <div className="rotation-card-header">
                    <div className="rotation-icon">
                      <RotateCcw size={18} />
                    </div>
                    <div className="rotation-title">
                      <h4>{schedule.secretName}</h4>
                      <span className="rotation-path">{schedule.secretPath}</span>
                    </div>
                    <span className={`rotation-status-badge ${schedule.status}`}>
                      {schedule.status}
                    </span>
                  </div>

                  <div className="rotation-timeline">
                    <div className="timeline-point past">
                      <div className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="label">Last Rotation</span>
                        <span className="date">{schedule.lastRotation}</span>
                      </div>
                    </div>
                    <div className="timeline-line" />
                    <div className="timeline-point future">
                      <div className="timeline-dot" />
                      <div className="timeline-info">
                        <span className="label">Next Rotation</span>
                        <span className="date">{schedule.nextRotation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rotation-frequency">
                    <Clock size={14} />
                    {schedule.frequency}
                  </div>

                  <div className="rotation-actions">
                    <button className="btn-outline small">
                      <Zap size={14} />
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
        )}

        {activeTab === 'audit' && (
          <div className="audit-tab">
            <div className="audit-header">
              <h3>Access Audit Log</h3>
              <div className="audit-filters">
                <select className="filter-select">
                  <option value="all">All Actions</option>
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="delete">Delete</option>
                  <option value="rotate">Rotate</option>
                </select>
                <input type="date" className="date-input" />
                <button className="btn-outline">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            <div className="audit-table">
              <div className="table-header">
                <span>Timestamp</span>
                <span>Secret</span>
                <span>Action</span>
                <span>Principal</span>
                <span>Source IP</span>
                <span>Status</span>
              </div>
              {accessLogs.map(log => (
                <div key={log.id} className={`table-row ${log.success ? '' : 'failed'}`}>
                  <span className="timestamp-cell">
                    <Clock size={14} />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="secret-cell code">{log.secretPath.split('/').pop()}</span>
                  <span className="action-cell">
                    <span className={`action-badge ${log.action}`}>{log.action}</span>
                  </span>
                  <span className="principal-cell">{log.principal}</span>
                  <span className="ip-cell code">{log.sourceIp}</span>
                  <span className={`status-cell ${log.success ? 'success' : 'failed'}`}>
                    {log.success ? (
                      <>
                        <CheckCircle2 size={14} />
                        Success
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Failed
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SecretsVaultDashboard;
