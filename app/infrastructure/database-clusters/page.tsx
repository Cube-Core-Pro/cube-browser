'use client';

import React, { useState } from 'react';
import {
  Database,
  Server,
  Activity,
  HardDrive,
  RefreshCw,
  Settings,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Globe,
  Layers,
  Cpu,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Eye,
  Shield,
  Lock,
  Key,
  Network,
  Zap,
  GitBranch
} from 'lucide-react';
import './database-clusters.css';

interface DatabaseCluster {
  id: string;
  name: string;
  engine: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'elasticsearch';
  version: string;
  status: 'running' | 'stopped' | 'maintenance' | 'degraded' | 'creating';
  region: string;
  nodes: { primary: number; replica: number };
  storage: { used: number; total: number };
  connections: { current: number; max: number };
  cpu: number;
  memory: number;
  iops: number;
  latency: number;
  replicationLag?: number;
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  backupEnabled: boolean;
  encryptionEnabled: boolean;
  lastBackup?: string;
}

interface DatabaseNode {
  id: string;
  clusterId: string;
  role: 'primary' | 'replica' | 'arbiter';
  status: 'healthy' | 'unhealthy' | 'syncing' | 'lagging';
  region: string;
  cpu: number;
  memory: number;
  connections: number;
  replicationLag?: number;
}

interface QueryStats {
  id: string;
  clusterId: string;
  queriesPerSecond: number;
  avgResponseTime: number;
  slowQueries: number;
  activeConnections: number;
  cacheHitRatio: number;
}

interface BackupRecord {
  id: string;
  clusterId: string;
  clusterName: string;
  type: 'automatic' | 'manual' | 'point-in-time';
  status: 'completed' | 'in-progress' | 'failed';
  size: number;
  createdAt: string;
  retentionDays: number;
}

const DATABASE_CLUSTERS: DatabaseCluster[] = [
  {
    id: '1',
    name: 'cube-production-pg',
    engine: 'postgresql',
    version: '16.1',
    status: 'running',
    region: 'us-east-1',
    nodes: { primary: 1, replica: 2 },
    storage: { used: 456, total: 1000 },
    connections: { current: 234, max: 500 },
    cpu: 45,
    memory: 68,
    iops: 12500,
    latency: 2.3,
    replicationLag: 0.5,
    tier: 'enterprise',
    backupEnabled: true,
    encryptionEnabled: true,
    lastBackup: '2025-01-27T14:30:00Z'
  },
  {
    id: '2',
    name: 'cube-analytics-mongo',
    engine: 'mongodb',
    version: '7.0',
    status: 'running',
    region: 'eu-west-1',
    nodes: { primary: 1, replica: 2 },
    storage: { used: 892, total: 2000 },
    connections: { current: 156, max: 300 },
    cpu: 62,
    memory: 75,
    iops: 8900,
    latency: 4.5,
    replicationLag: 1.2,
    tier: 'premium',
    backupEnabled: true,
    encryptionEnabled: true,
    lastBackup: '2025-01-27T12:00:00Z'
  },
  {
    id: '3',
    name: 'cube-cache-redis',
    engine: 'redis',
    version: '7.2',
    status: 'running',
    region: 'us-east-1',
    nodes: { primary: 1, replica: 1 },
    storage: { used: 32, total: 64 },
    connections: { current: 1234, max: 5000 },
    cpu: 28,
    memory: 89,
    iops: 45000,
    latency: 0.3,
    tier: 'standard',
    backupEnabled: true,
    encryptionEnabled: true,
    lastBackup: '2025-01-27T15:00:00Z'
  },
  {
    id: '4',
    name: 'cube-search-es',
    engine: 'elasticsearch',
    version: '8.11',
    status: 'degraded',
    region: 'us-west-2',
    nodes: { primary: 3, replica: 0 },
    storage: { used: 567, total: 1000 },
    connections: { current: 89, max: 200 },
    cpu: 78,
    memory: 82,
    iops: 6700,
    latency: 12.4,
    tier: 'premium',
    backupEnabled: true,
    encryptionEnabled: true,
    lastBackup: '2025-01-27T10:00:00Z'
  },
  {
    id: '5',
    name: 'cube-staging-mysql',
    engine: 'mysql',
    version: '8.0',
    status: 'stopped',
    region: 'ap-southeast-1',
    nodes: { primary: 1, replica: 0 },
    storage: { used: 45, total: 100 },
    connections: { current: 0, max: 100 },
    cpu: 0,
    memory: 0,
    iops: 0,
    latency: 0,
    tier: 'basic',
    backupEnabled: false,
    encryptionEnabled: false
  }
];

const DATABASE_NODES: DatabaseNode[] = [
  { id: '1', clusterId: '1', role: 'primary', status: 'healthy', region: 'us-east-1a', cpu: 45, memory: 68, connections: 200, replicationLag: 0 },
  { id: '2', clusterId: '1', role: 'replica', status: 'healthy', region: 'us-east-1b', cpu: 32, memory: 55, connections: 24, replicationLag: 0.5 },
  { id: '3', clusterId: '1', role: 'replica', status: 'syncing', region: 'us-east-1c', cpu: 89, memory: 78, connections: 10, replicationLag: 2.1 }
];

const BACKUP_RECORDS: BackupRecord[] = [
  { id: '1', clusterId: '1', clusterName: 'cube-production-pg', type: 'automatic', status: 'completed', size: 45.6, createdAt: '2025-01-27T14:30:00Z', retentionDays: 30 },
  { id: '2', clusterId: '2', clusterName: 'cube-analytics-mongo', type: 'automatic', status: 'completed', size: 123.4, createdAt: '2025-01-27T12:00:00Z', retentionDays: 30 },
  { id: '3', clusterId: '3', clusterName: 'cube-cache-redis', type: 'manual', status: 'completed', size: 8.2, createdAt: '2025-01-27T15:00:00Z', retentionDays: 90 },
  { id: '4', clusterId: '1', clusterName: 'cube-production-pg', type: 'point-in-time', status: 'in-progress', size: 0, createdAt: '2025-01-27T16:00:00Z', retentionDays: 7 },
  { id: '5', clusterId: '4', clusterName: 'cube-search-es', type: 'automatic', status: 'failed', size: 0, createdAt: '2025-01-27T10:00:00Z', retentionDays: 30 }
];

const ENGINE_CONFIG = {
  postgresql: { color: 'blue', label: 'PostgreSQL', icon: '🐘' },
  mysql: { color: 'orange', label: 'MySQL', icon: '🐬' },
  mongodb: { color: 'green', label: 'MongoDB', icon: '🍃' },
  redis: { color: 'red', label: 'Redis', icon: '⚡' },
  elasticsearch: { color: 'yellow', label: 'Elasticsearch', icon: '🔍' }
};

const STATUS_CONFIG = {
  running: { color: 'success', label: 'Running', icon: CheckCircle },
  stopped: { color: 'muted', label: 'Stopped', icon: Pause },
  maintenance: { color: 'info', label: 'Maintenance', icon: Settings },
  degraded: { color: 'warning', label: 'Degraded', icon: AlertTriangle },
  creating: { color: 'info', label: 'Creating', icon: RefreshCw }
};

const TIER_CONFIG = {
  basic: { color: 'muted', label: 'Basic' },
  standard: { color: 'info', label: 'Standard' },
  premium: { color: 'purple', label: 'Premium' },
  enterprise: { color: 'gold', label: 'Enterprise' }
};

export default function DatabaseClustersPage() {
  const [activeTab, setActiveTab] = useState<'clusters' | 'nodes' | 'backups' | 'metrics'>('clusters');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [filterEngine, setFilterEngine] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const runningClusters = DATABASE_CLUSTERS.filter(c => c.status === 'running').length;
  const totalStorage = DATABASE_CLUSTERS.reduce((acc, c) => acc + c.storage.used, 0);
  const totalConnections = DATABASE_CLUSTERS.reduce((acc, c) => acc + c.connections.current, 0);
  const avgLatency = (DATABASE_CLUSTERS.filter(c => c.status === 'running').reduce((acc, c) => acc + c.latency, 0) / DATABASE_CLUSTERS.filter(c => c.status === 'running').length).toFixed(1);

  const filteredClusters = DATABASE_CLUSTERS.filter(c => {
    const matchesEngine = filterEngine === 'all' || c.engine === filterEngine;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesEngine && matchesStatus;
  });

  const renderClusters = () => (
    <div className="clusters-section">
      <div className="clusters-header">
        <div className="clusters-filters">
          <select value={filterEngine} onChange={(e) => setFilterEngine(e.target.value)}>
            <option value="all">All Engines</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mongodb">MongoDB</option>
            <option value="redis">Redis</option>
            <option value="elasticsearch">Elasticsearch</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="degraded">Degraded</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Create Cluster
        </button>
      </div>

      <div className="clusters-list">
        {filteredClusters.map(cluster => {
          const engineConfig = ENGINE_CONFIG[cluster.engine];
          const statusConfig = STATUS_CONFIG[cluster.status];
          const tierConfig = TIER_CONFIG[cluster.tier];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedCluster === cluster.id;

          return (
            <div key={cluster.id} className={`cluster-card ${cluster.status}`}>
              <div className="cluster-main">
                <div className={`cluster-engine ${engineConfig.color}`}>
                  <span className="engine-icon">{engineConfig.icon}</span>
                </div>

                <div className="cluster-info">
                  <div className="cluster-header">
                    <h4>{cluster.name}</h4>
                    <span className={`engine-badge ${engineConfig.color}`}>
                      {engineConfig.label} {cluster.version}
                    </span>
                    <span className={`tier-badge ${tierConfig.color}`}>
                      {tierConfig.label}
                    </span>
                    <div className={`cluster-status ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </div>
                  </div>
                  <div className="cluster-meta">
                    <span className="region">
                      <Globe size={12} />
                      {cluster.region}
                    </span>
                    <span className="nodes">
                      <Server size={12} />
                      {cluster.nodes.primary}P + {cluster.nodes.replica}R
                    </span>
                    {cluster.encryptionEnabled && (
                      <span className="encrypted">
                        <Lock size={12} />
                        Encrypted
                      </span>
                    )}
                  </div>
                </div>

                <div className="cluster-metrics">
                  <div className="cl-metric">
                    <span className="metric-value">{cluster.storage.used}GB</span>
                    <span className="metric-label">Storage</span>
                    <div className="metric-bar">
                      <div 
                        className={`metric-fill ${(cluster.storage.used / cluster.storage.total) > 0.8 ? 'warning' : ''}`}
                        style={{ width: `${(cluster.storage.used / cluster.storage.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="cl-metric">
                    <span className="metric-value">{cluster.connections.current}</span>
                    <span className="metric-label">Connections</span>
                    <div className="metric-bar">
                      <div 
                        className={`metric-fill ${(cluster.connections.current / cluster.connections.max) > 0.8 ? 'warning' : ''}`}
                        style={{ width: `${(cluster.connections.current / cluster.connections.max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="cl-metric">
                    <span className={`metric-value ${cluster.latency > 10 ? 'warning' : ''}`}>
                      {cluster.latency}ms
                    </span>
                    <span className="metric-label">Latency</span>
                  </div>
                </div>

                <div className="cluster-actions">
                  {cluster.status === 'running' ? (
                    <button className="action-btn" title="Stop">
                      <Pause size={16} />
                    </button>
                  ) : (
                    <button className="action-btn" title="Start">
                      <Play size={16} />
                    </button>
                  )}
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedCluster(isExpanded ? null : cluster.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="cluster-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h5>Resource Utilization</h5>
                      <div className="resource-bars">
                        <div className="resource-item">
                          <span className="resource-label">CPU</span>
                          <div className="resource-bar">
                            <div 
                              className={`resource-fill ${cluster.cpu > 80 ? 'danger' : cluster.cpu > 60 ? 'warning' : ''}`}
                              style={{ width: `${cluster.cpu}%` }}
                            />
                          </div>
                          <span className="resource-value">{cluster.cpu}%</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-label">Memory</span>
                          <div className="resource-bar">
                            <div 
                              className={`resource-fill ${cluster.memory > 80 ? 'danger' : cluster.memory > 60 ? 'warning' : ''}`}
                              style={{ width: `${cluster.memory}%` }}
                            />
                          </div>
                          <span className="resource-value">{cluster.memory}%</span>
                        </div>
                        <div className="resource-item">
                          <span className="resource-label">IOPS</span>
                          <div className="resource-bar">
                            <div className="resource-fill" style={{ width: `${Math.min((cluster.iops / 50000) * 100, 100)}%` }} />
                          </div>
                          <span className="resource-value">{cluster.iops.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h5>Cluster Details</h5>
                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Backup Status</span>
                          <span className={`detail-value ${cluster.backupEnabled ? 'success' : 'muted'}`}>
                            {cluster.backupEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        {cluster.lastBackup && (
                          <div className="detail-item">
                            <span className="detail-label">Last Backup</span>
                            <span className="detail-value">
                              {new Date(cluster.lastBackup).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {cluster.replicationLag !== undefined && (
                          <div className="detail-item">
                            <span className="detail-label">Replication Lag</span>
                            <span className={`detail-value ${cluster.replicationLag > 1 ? 'warning' : ''}`}>
                              {cluster.replicationLag}s
                            </span>
                          </div>
                        )}
                        <div className="detail-item">
                          <span className="detail-label">Storage</span>
                          <span className="detail-value">
                            {cluster.storage.used}GB / {cluster.storage.total}GB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <Eye size={14} />
                      View Logs
                    </button>
                    <button className="btn-sm">
                      <RotateCcw size={14} />
                      Backup Now
                    </button>
                    <button className="btn-sm">
                      <Settings size={14} />
                      Configure
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
  );

  const renderNodes = () => (
    <div className="nodes-section">
      <div className="nodes-header">
        <h3>Database Nodes</h3>
      </div>

      <div className="nodes-table">
        <div className="nt-header">
          <span className="nt-th node">Node ID</span>
          <span className="nt-th cluster">Cluster</span>
          <span className="nt-th role">Role</span>
          <span className="nt-th status">Status</span>
          <span className="nt-th region">Region</span>
          <span className="nt-th cpu">CPU</span>
          <span className="nt-th memory">Memory</span>
          <span className="nt-th lag">Rep. Lag</span>
        </div>
        <div className="nt-body">
          {DATABASE_NODES.map(node => {
            const cluster = DATABASE_CLUSTERS.find(c => c.id === node.clusterId);
            
            return (
              <div key={node.id} className={`nt-row ${node.status}`}>
                <span className="nt-td node">
                  <Server size={14} />
                  {node.id}
                </span>
                <span className="nt-td cluster">{cluster?.name || 'Unknown'}</span>
                <span className="nt-td role">
                  <span className={`role-badge ${node.role}`}>
                    {node.role}
                  </span>
                </span>
                <span className={`nt-td status ${node.status}`}>
                  {node.status === 'healthy' && <CheckCircle size={14} />}
                  {node.status === 'unhealthy' && <XCircle size={14} />}
                  {node.status === 'syncing' && <RefreshCw size={14} />}
                  {node.status === 'lagging' && <AlertTriangle size={14} />}
                  {node.status}
                </span>
                <span className="nt-td region">{node.region}</span>
                <span className={`nt-td cpu ${node.cpu > 80 ? 'danger' : node.cpu > 60 ? 'warning' : ''}`}>
                  {node.cpu}%
                </span>
                <span className={`nt-td memory ${node.memory > 80 ? 'danger' : node.memory > 60 ? 'warning' : ''}`}>
                  {node.memory}%
                </span>
                <span className={`nt-td lag ${node.replicationLag && node.replicationLag > 1 ? 'warning' : ''}`}>
                  {node.replicationLag !== undefined ? `${node.replicationLag}s` : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderBackups = () => (
    <div className="backups-section">
      <div className="backups-header">
        <h3>Backup History</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Manual Backup
        </button>
      </div>

      <div className="backups-list">
        {BACKUP_RECORDS.map(backup => (
          <div key={backup.id} className={`backup-card ${backup.status}`}>
            <div className="backup-main">
              <div className={`backup-icon ${backup.status}`}>
                {backup.status === 'completed' && <CheckCircle size={20} />}
                {backup.status === 'in-progress' && <RefreshCw size={20} className="spinning" />}
                {backup.status === 'failed' && <XCircle size={20} />}
              </div>

              <div className="backup-info">
                <h4>{backup.clusterName}</h4>
                <div className="backup-meta">
                  <span className={`backup-type ${backup.type}`}>
                    {backup.type}
                  </span>
                  <span className="backup-date">
                    <Clock size={12} />
                    {new Date(backup.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="backup-details">
                <div className="backup-detail">
                  <span className="detail-label">Size</span>
                  <span className="detail-value">
                    {backup.size > 0 ? `${backup.size}GB` : '-'}
                  </span>
                </div>
                <div className="backup-detail">
                  <span className="detail-label">Retention</span>
                  <span className="detail-value">{backup.retentionDays} days</span>
                </div>
              </div>

              <div className={`backup-status ${backup.status}`}>
                {backup.status}
              </div>

              <div className="backup-actions">
                {backup.status === 'completed' && (
                  <>
                    <button className="action-btn" title="Restore">
                      <RotateCcw size={16} />
                    </button>
                    <button className="action-btn" title="Download">
                      <HardDrive size={16} />
                    </button>
                  </>
                )}
                <button className="action-btn" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="metrics-section">
      <div className="metrics-header">
        <h3>Performance Metrics</h3>
        <div className="metrics-controls">
          <select>
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h4>Queries per Second</h4>
            <span className="metric-trend up">
              <TrendingUp size={14} />
              +12%
            </span>
          </div>
          <div className="metric-value-large">4,567</div>
          <div className="metric-chart-placeholder">
            <Activity size={40} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Average Response Time</h4>
            <span className="metric-trend down">
              <TrendingDown size={14} />
              -8%
            </span>
          </div>
          <div className="metric-value-large">3.2ms</div>
          <div className="metric-chart-placeholder">
            <Clock size={40} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Cache Hit Ratio</h4>
            <span className="metric-trend up">
              <TrendingUp size={14} />
              +2%
            </span>
          </div>
          <div className="metric-value-large">94.7%</div>
          <div className="metric-chart-placeholder">
            <Zap size={40} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h4>Slow Queries</h4>
            <span className="metric-trend down">
              <TrendingDown size={14} />
              -15%
            </span>
          </div>
          <div className="metric-value-large">23</div>
          <div className="metric-chart-placeholder">
            <AlertTriangle size={40} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="database-clusters">
      <div className="database-clusters__header">
        <div className="database-clusters__title-section">
          <div className="database-clusters__icon">
            <Database size={28} />
          </div>
          <div>
            <h1>Database Clusters</h1>
            <p>Manage and monitor your database infrastructure</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div className="database-clusters__stats">
        <div className="stat-card">
          <div className="stat-icon running">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningClusters}/{DATABASE_CLUSTERS.length}</span>
            <span className="stat-label">Running Clusters</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon storage">
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStorage}GB</span>
            <span className="stat-label">Total Storage Used</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon connections">
            <Network size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalConnections.toLocaleString()}</span>
            <span className="stat-label">Active Connections</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgLatency}ms</span>
            <span className="stat-label">Avg Latency</span>
          </div>
        </div>
      </div>

      <div className="database-clusters__tabs">
        <button
          className={`tab-btn ${activeTab === 'clusters' ? 'active' : ''}`}
          onClick={() => setActiveTab('clusters')}
        >
          <Database size={16} />
          Clusters
        </button>
        <button
          className={`tab-btn ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
        >
          <Server size={16} />
          Nodes
        </button>
        <button
          className={`tab-btn ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          <HardDrive size={16} />
          Backups
        </button>
        <button
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <Activity size={16} />
          Metrics
        </button>
      </div>

      <div className="database-clusters__content">
        {activeTab === 'clusters' && renderClusters()}
        {activeTab === 'nodes' && renderNodes()}
        {activeTab === 'backups' && renderBackups()}
        {activeTab === 'metrics' && renderMetrics()}
      </div>
    </div>
  );
}
