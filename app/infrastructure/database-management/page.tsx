'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Square,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  MoreVertical,
  Copy,
  Terminal,
  FileText,
  Download,
  Upload,
  Trash2,
  Zap,
  Users,
  Lock,
  Unlock,
  Table,
  Layers,
  GitBranch,
  RotateCcw,
  History,
  MapPin
} from 'lucide-react';
import './database-management.css';

interface DatabaseInstance {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'elasticsearch' | 'cassandra';
  version: string;
  role: 'primary' | 'replica' | 'standalone';
  status: 'running' | 'stopped' | 'maintenance' | 'degraded' | 'creating';
  host: string;
  port: number;
  region: string;
  environment: 'production' | 'staging' | 'development';
  size: string;
  storage: {
    used: number;
    total: number;
    unit: string;
  };
  connections: {
    active: number;
    max: number;
  };
  cpu: number;
  memory: number;
  iops: number;
  replicationLag?: number;
  uptime: string;
  lastBackup: string;
  tags: string[];
}

interface QueryMetric {
  id: string;
  query: string;
  avgTime: number;
  calls: number;
  totalTime: number;
  rowsProcessed: number;
}

interface DatabaseEvent {
  id: string;
  databaseId: string;
  databaseName: string;
  type: 'failover' | 'backup' | 'maintenance' | 'alert' | 'scale';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const DATABASE_INSTANCES: DatabaseInstance[] = [
  {
    id: 'db-001',
    name: 'cube-postgres-primary',
    type: 'postgresql',
    version: '15.4',
    role: 'primary',
    status: 'running',
    host: 'db-primary.cube.internal',
    port: 5432,
    region: 'us-east-1',
    environment: 'production',
    size: 'db.r6g.2xlarge',
    storage: { used: 245, total: 500, unit: 'GB' },
    connections: { active: 142, max: 500 },
    cpu: 45,
    memory: 68,
    iops: 8500,
    uptime: '45d 12h 34m',
    lastBackup: '2025-01-15 03:00',
    tags: ['production', 'critical', 'postgres']
  },
  {
    id: 'db-002',
    name: 'cube-postgres-replica-1',
    type: 'postgresql',
    version: '15.4',
    role: 'replica',
    status: 'running',
    host: 'db-replica-1.cube.internal',
    port: 5432,
    region: 'us-east-1',
    environment: 'production',
    size: 'db.r6g.2xlarge',
    storage: { used: 243, total: 500, unit: 'GB' },
    connections: { active: 85, max: 500 },
    cpu: 32,
    memory: 55,
    iops: 4200,
    replicationLag: 0.2,
    uptime: '45d 12h 34m',
    lastBackup: '2025-01-15 03:00',
    tags: ['production', 'replica', 'postgres']
  },
  {
    id: 'db-003',
    name: 'cube-postgres-replica-2',
    type: 'postgresql',
    version: '15.4',
    role: 'replica',
    status: 'running',
    host: 'db-replica-2.cube.internal',
    port: 5432,
    region: 'us-west-2',
    environment: 'production',
    size: 'db.r6g.xlarge',
    storage: { used: 241, total: 500, unit: 'GB' },
    connections: { active: 45, max: 300 },
    cpu: 28,
    memory: 48,
    iops: 2800,
    replicationLag: 1.5,
    uptime: '30d 8h 12m',
    lastBackup: '2025-01-15 03:00',
    tags: ['production', 'replica', 'dr', 'postgres']
  },
  {
    id: 'db-004',
    name: 'cube-redis-cache',
    type: 'redis',
    version: '7.2',
    role: 'primary',
    status: 'running',
    host: 'redis-cache.cube.internal',
    port: 6379,
    region: 'us-east-1',
    environment: 'production',
    size: 'cache.r6g.large',
    storage: { used: 12, total: 64, unit: 'GB' },
    connections: { active: 450, max: 10000 },
    cpu: 22,
    memory: 75,
    iops: 125000,
    uptime: '90d 4h 22m',
    lastBackup: '2025-01-15 04:00',
    tags: ['production', 'cache', 'redis']
  },
  {
    id: 'db-005',
    name: 'cube-mongodb-analytics',
    type: 'mongodb',
    version: '7.0',
    role: 'primary',
    status: 'running',
    host: 'mongodb-analytics.cube.internal',
    port: 27017,
    region: 'us-east-1',
    environment: 'production',
    size: 'db.m6g.2xlarge',
    storage: { used: 890, total: 2000, unit: 'GB' },
    connections: { active: 65, max: 200 },
    cpu: 55,
    memory: 72,
    iops: 15000,
    uptime: '22d 18h 45m',
    lastBackup: '2025-01-15 02:00',
    tags: ['production', 'analytics', 'mongodb']
  },
  {
    id: 'db-006',
    name: 'cube-elasticsearch',
    type: 'elasticsearch',
    version: '8.11',
    role: 'standalone',
    status: 'running',
    host: 'es-cluster.cube.internal',
    port: 9200,
    region: 'us-east-1',
    environment: 'production',
    size: 'c6g.2xlarge',
    storage: { used: 1250, total: 3000, unit: 'GB' },
    connections: { active: 25, max: 100 },
    cpu: 62,
    memory: 85,
    iops: 45000,
    uptime: '15d 6h 33m',
    lastBackup: '2025-01-15 01:00',
    tags: ['production', 'search', 'elasticsearch']
  },
  {
    id: 'db-007',
    name: 'cube-postgres-staging',
    type: 'postgresql',
    version: '15.4',
    role: 'standalone',
    status: 'running',
    host: 'db-staging.cube.internal',
    port: 5432,
    region: 'us-east-1',
    environment: 'staging',
    size: 'db.t4g.medium',
    storage: { used: 45, total: 100, unit: 'GB' },
    connections: { active: 12, max: 100 },
    cpu: 15,
    memory: 42,
    iops: 1200,
    uptime: '7d 3h 15m',
    lastBackup: '2025-01-14 23:00',
    tags: ['staging', 'postgres']
  },
  {
    id: 'db-008',
    name: 'cube-mysql-legacy',
    type: 'mysql',
    version: '8.0',
    role: 'primary',
    status: 'maintenance',
    host: 'mysql-legacy.cube.internal',
    port: 3306,
    region: 'us-east-1',
    environment: 'production',
    size: 'db.m5.large',
    storage: { used: 78, total: 200, unit: 'GB' },
    connections: { active: 0, max: 150 },
    cpu: 0,
    memory: 35,
    iops: 0,
    uptime: '0d 0h 0m',
    lastBackup: '2025-01-15 00:00',
    tags: ['production', 'legacy', 'mysql', 'migration']
  }
];

const SLOW_QUERIES: QueryMetric[] = [
  {
    id: 'q-001',
    query: 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE o.created_at > $1',
    avgTime: 245.8,
    calls: 15420,
    totalTime: 3791400,
    rowsProcessed: 8945000
  },
  {
    id: 'q-002',
    query: 'UPDATE analytics SET last_seen = NOW() WHERE user_id = $1',
    avgTime: 128.5,
    calls: 89450,
    totalTime: 11497200,
    rowsProcessed: 89450
  },
  {
    id: 'q-003',
    query: 'SELECT p.*, c.name FROM products p LEFT JOIN categories c ON p.category_id = c.id',
    avgTime: 95.2,
    calls: 45890,
    totalTime: 4368700,
    rowsProcessed: 2850000
  },
  {
    id: 'q-004',
    query: 'DELETE FROM sessions WHERE expires_at < NOW()',
    avgTime: 78.4,
    calls: 1440,
    totalTime: 112896,
    rowsProcessed: 125000
  }
];

const DATABASE_EVENTS: DatabaseEvent[] = [
  {
    id: 'evt-001',
    databaseId: 'db-001',
    databaseName: 'cube-postgres-primary',
    type: 'backup',
    message: 'Automated backup completed successfully',
    timestamp: '2025-01-15 03:00:00',
    severity: 'success'
  },
  {
    id: 'evt-002',
    databaseId: 'db-006',
    databaseName: 'cube-elasticsearch',
    type: 'alert',
    message: 'Memory usage exceeded 80% threshold',
    timestamp: '2025-01-15 10:45:00',
    severity: 'warning'
  },
  {
    id: 'evt-003',
    databaseId: 'db-008',
    databaseName: 'cube-mysql-legacy',
    type: 'maintenance',
    message: 'Scheduled maintenance window started',
    timestamp: '2025-01-15 12:00:00',
    severity: 'info'
  },
  {
    id: 'evt-004',
    databaseId: 'db-003',
    databaseName: 'cube-postgres-replica-2',
    type: 'alert',
    message: 'Replication lag increased to 1.5 seconds',
    timestamp: '2025-01-15 11:30:00',
    severity: 'warning'
  },
  {
    id: 'evt-005',
    databaseId: 'db-004',
    databaseName: 'cube-redis-cache',
    type: 'scale',
    message: 'Auto-scaling triggered: connections threshold reached',
    timestamp: '2025-01-15 09:15:00',
    severity: 'info'
  }
];

const TYPE_CONFIG: Record<DatabaseInstance['type'], { color: string; bg: string; icon: string }> = {
  postgresql: { color: '#336791', bg: 'rgba(51, 103, 145, 0.15)', icon: '🐘' },
  mysql: { color: '#00758F', bg: 'rgba(0, 117, 143, 0.15)', icon: '🐬' },
  mongodb: { color: '#47A248', bg: 'rgba(71, 162, 72, 0.15)', icon: '🍃' },
  redis: { color: '#DC382D', bg: 'rgba(220, 56, 45, 0.15)', icon: '⚡' },
  elasticsearch: { color: '#FEC514', bg: 'rgba(254, 197, 20, 0.15)', icon: '🔍' },
  cassandra: { color: '#1287B1', bg: 'rgba(18, 135, 177, 0.15)', icon: '👁️' }
};

const STATUS_CONFIG: Record<DatabaseInstance['status'], { color: string; bg: string; icon: React.ElementType }> = {
  running: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle },
  stopped: { color: '#71717a', bg: 'rgba(113, 113, 122, 0.15)', icon: Square },
  maintenance: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Settings },
  degraded: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: AlertTriangle },
  creating: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: RefreshCw }
};

const ROLE_CONFIG: Record<DatabaseInstance['role'], { color: string; bg: string }> = {
  primary: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  replica: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  standalone: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' }
};

const ENV_CONFIG: Record<DatabaseInstance['environment'], { color: string; bg: string }> = {
  production: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  staging: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  development: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' }
};

export default function DatabaseManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'instances' | 'queries' | 'backups' | 'events'>('overview');
  const [selectedDB, setSelectedDB] = useState<DatabaseInstance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnv, setFilterEnv] = useState<string>('all');

  const filteredDatabases = DATABASE_INSTANCES.filter(db => {
    const matchesSearch = db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.host.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || db.type === filterType;
    const matchesStatus = filterStatus === 'all' || db.status === filterStatus;
    const matchesEnv = filterEnv === 'all' || db.environment === filterEnv;
    return matchesSearch && matchesType && matchesStatus && matchesEnv;
  });

  const runningDBs = DATABASE_INSTANCES.filter(d => d.status === 'running').length;
  const totalStorage = DATABASE_INSTANCES.reduce((sum, d) => sum + d.storage.used, 0);
  const totalConnections = DATABASE_INSTANCES.reduce((sum, d) => sum + d.connections.active, 0);
  const avgCPU = Math.round(DATABASE_INSTANCES.reduce((sum, d) => sum + d.cpu, 0) / DATABASE_INSTANCES.length);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'instances', label: 'Instances', icon: Database, count: DATABASE_INSTANCES.length },
    { id: 'queries', label: 'Queries', icon: Terminal },
    { id: 'backups', label: 'Backups', icon: Download },
    { id: 'events', label: 'Events', icon: History }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-metrics">
        <div className="metric-card large">
          <div className="metric-header">
            <h3>Total Queries/sec</h3>
            <span className="trend positive">
              <ArrowUpRight size={14} />
              +8.2%
            </span>
          </div>
          <div className="metric-value">
            <span className="value">42,580</span>
            <span className="unit">q/s</span>
          </div>
          <div className="metric-sparkline">
            <div className="sparkline-bar" style={{ height: '40%' }} />
            <div className="sparkline-bar" style={{ height: '55%' }} />
            <div className="sparkline-bar" style={{ height: '45%' }} />
            <div className="sparkline-bar" style={{ height: '70%' }} />
            <div className="sparkline-bar" style={{ height: '85%' }} />
            <div className="sparkline-bar" style={{ height: '75%' }} />
            <div className="sparkline-bar active" style={{ height: '90%' }} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Avg Response Time</h3>
            <span className="trend negative">
              <ArrowDownRight size={14} />
              -2.1ms
            </span>
          </div>
          <div className="metric-value">
            <span className="value">4.2</span>
            <span className="unit">ms</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Cache Hit Rate</h3>
          </div>
          <div className="metric-value">
            <span className="value">94.8</span>
            <span className="unit">%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Replication Health</h3>
          </div>
          <div className="metric-value">
            <span className="value healthy">Healthy</span>
          </div>
          <div className="metric-label">All replicas in sync</div>
        </div>
      </div>

      <div className="overview-panels">
        <div className="panel instances-overview">
          <h3>Database Instances</h3>
          <div className="instances-list">
            {DATABASE_INSTANCES.slice(0, 5).map(db => {
              const typeConfig = TYPE_CONFIG[db.type];
              const statusConfig = STATUS_CONFIG[db.status];
              const StatusIcon = statusConfig.icon;
              return (
                <div 
                  key={db.id} 
                  className={`instance-item ${db.status}`}
                  onClick={() => setSelectedDB(db)}
                >
                  <div className="instance-info">
                    <div 
                      className="instance-type-icon"
                      style={{ background: typeConfig.bg }}
                    >
                      <span>{typeConfig.icon}</span>
                    </div>
                    <div className="instance-details">
                      <span className="instance-name">{db.name}</span>
                      <span className="instance-meta">{db.type} {db.version} • {db.role}</span>
                    </div>
                  </div>
                  <div className="instance-stats">
                    <div className="usage-bars">
                      <div className="usage-bar-mini">
                        <span className="bar-label">CPU</span>
                        <div className="bar-track">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${db.cpu}%`,
                              background: db.cpu > 80 ? '#ef4444' : db.cpu > 60 ? '#f59e0b' : '#22c55e'
                            }}
                          />
                        </div>
                        <span className="bar-value">{db.cpu}%</span>
                      </div>
                      <div className="usage-bar-mini">
                        <span className="bar-label">MEM</span>
                        <div className="bar-track">
                          <div 
                            className="bar-fill"
                            style={{ 
                              width: `${db.memory}%`,
                              background: db.memory > 80 ? '#ef4444' : db.memory > 60 ? '#f59e0b' : '#22c55e'
                            }}
                          />
                        </div>
                        <span className="bar-value">{db.memory}%</span>
                      </div>
                    </div>
                    <span 
                      className="instance-status"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      <StatusIcon size={12} className={db.status === 'creating' ? 'spin' : ''} />
                      {db.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel events-overview">
          <h3>Recent Events</h3>
          <div className="events-list">
            {DATABASE_EVENTS.map(event => (
              <div key={event.id} className={`event-item ${event.severity}`}>
                <div className={`event-icon ${event.severity}`}>
                  {event.severity === 'success' && <CheckCircle size={14} />}
                  {event.severity === 'warning' && <AlertTriangle size={14} />}
                  {event.severity === 'error' && <XCircle size={14} />}
                  {event.severity === 'info' && <Activity size={14} />}
                </div>
                <div className="event-content">
                  <span className="event-message">{event.message}</span>
                  <span className="event-meta">{event.databaseName} • {event.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overview-storage">
        <h3>Storage Distribution</h3>
        <div className="storage-chart">
          {DATABASE_INSTANCES.map(db => {
            const typeConfig = TYPE_CONFIG[db.type];
            const percentage = (db.storage.used / totalStorage) * 100;
            return (
              <div 
                key={db.id}
                className="storage-bar"
                style={{ 
                  width: `${percentage}%`,
                  background: typeConfig.color,
                  minWidth: '30px'
                }}
                title={`${db.name}: ${db.storage.used} ${db.storage.unit}`}
              />
            );
          })}
        </div>
        <div className="storage-legend">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => {
            const dbs = DATABASE_INSTANCES.filter(d => d.type === type);
            if (dbs.length === 0) return null;
            const storage = dbs.reduce((sum, d) => sum + d.storage.used, 0);
            return (
              <div key={type} className="legend-item">
                <span className="legend-dot" style={{ background: config.color }} />
                <span className="legend-label">{type}</span>
                <span className="legend-value">{storage} GB</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderInstances = () => (
    <div className="instances-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search databases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
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
            <option value="maintenance">Maintenance</option>
            <option value="degraded">Degraded</option>
          </select>
          <select value={filterEnv} onChange={(e) => setFilterEnv(e.target.value)}>
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Database
          </button>
        </div>
      </div>

      <div className="db-cards">
        {filteredDatabases.map(db => {
          const typeConfig = TYPE_CONFIG[db.type];
          const statusConfig = STATUS_CONFIG[db.status];
          const roleConfig = ROLE_CONFIG[db.role];
          const envConfig = ENV_CONFIG[db.environment];
          const StatusIcon = statusConfig.icon;
          const storagePercent = (db.storage.used / db.storage.total) * 100;
          const connectionPercent = (db.connections.active / db.connections.max) * 100;
          
          return (
            <div 
              key={db.id} 
              className={`db-card ${db.status}`}
              onClick={() => setSelectedDB(db)}
            >
              <div className="db-card-header">
                <div 
                  className="db-type-icon"
                  style={{ background: typeConfig.bg }}
                >
                  <span className="type-emoji">{typeConfig.icon}</span>
                </div>
                <div className="db-card-info">
                  <h4>{db.name}</h4>
                  <span className="db-version">{db.type} v{db.version}</span>
                </div>
                <div className="db-badges">
                  <span 
                    className="status-badge"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}
                  >
                    <StatusIcon size={12} className={db.status === 'creating' ? 'spin' : ''} />
                    {db.status}
                  </span>
                </div>
              </div>

              <div className="db-card-tags">
                <span 
                  className="role-badge"
                  style={{ background: roleConfig.bg, color: roleConfig.color }}
                >
                  {db.role}
                </span>
                <span 
                  className="env-badge"
                  style={{ background: envConfig.bg, color: envConfig.color }}
                >
                  {db.environment}
                </span>
                <span className="region-badge">
                  <MapPin size={10} />
                  {db.region}
                </span>
              </div>

              <div className="db-card-metrics">
                <div className="metric-row">
                  <div className="metric-item">
                    <Cpu size={14} />
                    <span className="metric-label">CPU</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${db.cpu}%`,
                          background: db.cpu > 80 ? '#ef4444' : db.cpu > 60 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className="metric-value">{db.cpu}%</span>
                  </div>
                  <div className="metric-item">
                    <MemoryStick size={14} />
                    <span className="metric-label">Memory</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${db.memory}%`,
                          background: db.memory > 80 ? '#ef4444' : db.memory > 60 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <span className="metric-value">{db.memory}%</span>
                  </div>
                </div>
                <div className="metric-row">
                  <div className="metric-item">
                    <HardDrive size={14} />
                    <span className="metric-label">Storage</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${storagePercent}%`,
                          background: storagePercent > 80 ? '#ef4444' : storagePercent > 60 ? '#f59e0b' : '#3b82f6'
                        }}
                      />
                    </div>
                    <span className="metric-value">{db.storage.used}/{db.storage.total} {db.storage.unit}</span>
                  </div>
                  <div className="metric-item">
                    <Users size={14} />
                    <span className="metric-label">Connections</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill"
                        style={{ 
                          width: `${connectionPercent}%`,
                          background: connectionPercent > 80 ? '#ef4444' : connectionPercent > 60 ? '#f59e0b' : '#8b5cf6'
                        }}
                      />
                    </div>
                    <span className="metric-value">{db.connections.active}/{db.connections.max}</span>
                  </div>
                </div>
              </div>

              <div className="db-card-footer">
                <div className="footer-item">
                  <Clock size={12} />
                  <span>Uptime: {db.uptime}</span>
                </div>
                {db.replicationLag !== undefined && (
                  <div className={`footer-item ${db.replicationLag > 1 ? 'warning' : ''}`}>
                    <GitBranch size={12} />
                    <span>Lag: {db.replicationLag}s</span>
                  </div>
                )}
                <div className="footer-item">
                  <Zap size={12} />
                  <span>{db.iops.toLocaleString()} IOPS</span>
                </div>
              </div>

              <div className="db-card-actions">
                <button className="action-btn" title="Connect">
                  <Terminal size={14} />
                </button>
                <button className="action-btn" title="Logs">
                  <FileText size={14} />
                </button>
                <button className="action-btn" title="Settings">
                  <Settings size={14} />
                </button>
                <button className="action-btn" title="More">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDB && (
        <div className="db-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div 
                className="panel-icon"
                style={{ background: TYPE_CONFIG[selectedDB.type].bg }}
              >
                <span>{TYPE_CONFIG[selectedDB.type].icon}</span>
              </div>
              <div>
                <h3>{selectedDB.name}</h3>
                <span className="panel-subtitle">{selectedDB.type} v{selectedDB.version}</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setSelectedDB(null)}>×</button>
          </div>

          <div className="panel-content">
            <div className="panel-section">
              <h4>Connection Details</h4>
              <div className="connection-info">
                <div className="connection-item">
                  <span className="conn-label">Host</span>
                  <div className="conn-value-row">
                    <span className="conn-value">{selectedDB.host}</span>
                    <button className="copy-btn"><Copy size={12} /></button>
                  </div>
                </div>
                <div className="connection-item">
                  <span className="conn-label">Port</span>
                  <span className="conn-value">{selectedDB.port}</span>
                </div>
                <div className="connection-item">
                  <span className="conn-label">Size</span>
                  <span className="conn-value">{selectedDB.size}</span>
                </div>
                <div className="connection-item">
                  <span className="conn-label">Region</span>
                  <span className="conn-value">{selectedDB.region}</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Performance Metrics</h4>
              <div className="perf-metrics">
                <div className="perf-item">
                  <div className="perf-header">
                    <span className="perf-label">CPU Usage</span>
                    <span className="perf-value">{selectedDB.cpu}%</span>
                  </div>
                  <div className="perf-bar">
                    <div 
                      className="perf-fill"
                      style={{ 
                        width: `${selectedDB.cpu}%`,
                        background: selectedDB.cpu > 80 ? '#ef4444' : selectedDB.cpu > 60 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-header">
                    <span className="perf-label">Memory Usage</span>
                    <span className="perf-value">{selectedDB.memory}%</span>
                  </div>
                  <div className="perf-bar">
                    <div 
                      className="perf-fill"
                      style={{ 
                        width: `${selectedDB.memory}%`,
                        background: selectedDB.memory > 80 ? '#ef4444' : selectedDB.memory > 60 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                  </div>
                </div>
                <div className="perf-item">
                  <div className="perf-header">
                    <span className="perf-label">Storage</span>
                    <span className="perf-value">{selectedDB.storage.used}/{selectedDB.storage.total} {selectedDB.storage.unit}</span>
                  </div>
                  <div className="perf-bar">
                    <div 
                      className="perf-fill"
                      style={{ 
                        width: `${(selectedDB.storage.used / selectedDB.storage.total) * 100}%`,
                        background: '#3b82f6'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Tags</h4>
              <div className="tags-list">
                {selectedDB.tags.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <Terminal size={16} />
                Connect
              </button>
              <button className="btn-outline">
                <RotateCcw size={16} />
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderQueries = () => (
    <div className="queries-section">
      <div className="queries-header">
        <h3>Slow Query Analysis</h3>
        <div className="header-actions">
          <select defaultValue="1h">
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="queries-table">
        <table>
          <thead>
            <tr>
              <th>Query</th>
              <th>Avg Time</th>
              <th>Calls</th>
              <th>Total Time</th>
              <th>Rows</th>
            </tr>
          </thead>
          <tbody>
            {SLOW_QUERIES.map(query => (
              <tr key={query.id}>
                <td>
                  <div className="query-cell">
                    <code className="query-text">{query.query}</code>
                  </div>
                </td>
                <td className="time-cell">
                  <span className={`time-value ${query.avgTime > 100 ? 'slow' : ''}`}>
                    {query.avgTime.toFixed(1)} ms
                  </span>
                </td>
                <td>{query.calls.toLocaleString()}</td>
                <td>{(query.totalTime / 1000).toFixed(1)}s</td>
                <td>{query.rowsProcessed.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBackups = () => (
    <div className="backups-section">
      <div className="backups-header">
        <h3>Database Backups</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Backup
        </button>
      </div>

      <div className="backups-grid">
        {DATABASE_INSTANCES.filter(db => db.status === 'running').map(db => {
          const typeConfig = TYPE_CONFIG[db.type];
          return (
            <div key={db.id} className="backup-card">
              <div className="backup-header">
                <div 
                  className="backup-icon"
                  style={{ background: typeConfig.bg }}
                >
                  <span>{typeConfig.icon}</span>
                </div>
                <div className="backup-info">
                  <h4>{db.name}</h4>
                  <span className="backup-type">{db.type}</span>
                </div>
              </div>
              <div className="backup-details">
                <div className="backup-detail">
                  <span className="detail-label">Last Backup</span>
                  <span className="detail-value">{db.lastBackup}</span>
                </div>
                <div className="backup-detail">
                  <span className="detail-label">Size</span>
                  <span className="detail-value">{db.storage.used} {db.storage.unit}</span>
                </div>
                <div className="backup-detail">
                  <span className="detail-label">Status</span>
                  <span className="detail-value success">
                    <CheckCircle size={12} />
                    Completed
                  </span>
                </div>
              </div>
              <div className="backup-actions">
                <button className="btn-outline small">
                  <Download size={14} />
                  Download
                </button>
                <button className="btn-outline small">
                  <RotateCcw size={14} />
                  Restore
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <div className="events-header">
        <h3>Database Events</h3>
        <div className="header-actions">
          <button className="btn-outline">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <div className="events-timeline">
        {DATABASE_EVENTS.map(event => (
          <div key={event.id} className={`timeline-item ${event.severity}`}>
            <div className={`timeline-icon ${event.severity}`}>
              {event.severity === 'success' && <CheckCircle size={16} />}
              {event.severity === 'warning' && <AlertTriangle size={16} />}
              {event.severity === 'error' && <XCircle size={16} />}
              {event.severity === 'info' && <Activity size={16} />}
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-title">{event.message}</span>
                <span className="timeline-type">{event.type}</span>
              </div>
              <div className="timeline-meta">
                <span className="timeline-db">{event.databaseName}</span>
                <span className="timeline-time">{event.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="database-management">
      <header className="dbm__header">
        <div className="dbm__title-section">
          <div className="dbm__icon">
            <Database size={28} />
          </div>
          <div>
            <h1>Database Management</h1>
            <p>Monitor and manage all database instances</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Database
          </button>
        </div>
      </header>

      <div className="dbm__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Database size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{DATABASE_INSTANCES.length}</span>
            <span className="stat-label">Total Databases</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon running">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningDBs}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon storage">
            <HardDrive size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStorage}</span>
            <span className="stat-label">GB Used</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon connections">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalConnections}</span>
            <span className="stat-label">Connections</span>
          </div>
        </div>
      </div>

      <nav className="dbm__tabs">
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

      <main className="dbm__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'instances' && renderInstances()}
        {activeTab === 'queries' && renderQueries()}
        {activeTab === 'backups' && renderBackups()}
        {activeTab === 'events' && renderEvents()}
      </main>
    </div>
  );
}
