'use client';

import React, { useState } from 'react';
import { 
  Archive,
  Database,
  HardDrive,
  Cloud,
  Download,
  Upload,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  Lock,
  RefreshCw,
  Trash2,
  Eye,
  FileArchive,
  Server,
  FolderArchive,
  Activity,
  BarChart3,
  Timer,
  Zap
} from 'lucide-react';
import './backup-management.css';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential' | 'snapshot';
  source: string;
  destination: string;
  schedule: string;
  retention: string;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused' | 'failed' | 'running';
  lastBackupSize: string;
  compression: boolean;
  encryption: boolean;
  successRate: number;
}

interface BackupHistory {
  id: string;
  jobId: string;
  jobName: string;
  type: 'full' | 'incremental' | 'differential' | 'snapshot';
  startTime: string;
  endTime: string;
  duration: string;
  size: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  filesCount: number;
  errorMessage?: string;
}

interface StorageTarget {
  id: string;
  name: string;
  type: 's3' | 'gcs' | 'azure-blob' | 'local' | 'nfs';
  provider: string;
  region: string;
  capacity: string;
  used: string;
  usedPercent: number;
  status: 'healthy' | 'warning' | 'error';
  encrypted: boolean;
  versioning: boolean;
}

interface RetentionPolicy {
  id: string;
  name: string;
  dailyBackups: number;
  weeklyBackups: number;
  monthlyBackups: number;
  yearlyBackups: number;
  minRetentionDays: number;
  maxRetentionDays: number;
  targets: string[];
}

const BACKUP_JOBS: BackupJob[] = [
  {
    id: 'bkp-001',
    name: 'PostgreSQL Daily Full',
    type: 'full',
    source: 'postgres-primary',
    destination: 's3://cube-backups/postgres',
    schedule: 'Daily at 02:00 UTC',
    retention: '30 days',
    lastRun: '2025-01-15 02:00',
    nextRun: '2025-01-16 02:00',
    status: 'active',
    lastBackupSize: '45.2 GB',
    compression: true,
    encryption: true,
    successRate: 99.2
  },
  {
    id: 'bkp-002',
    name: 'PostgreSQL Hourly Incremental',
    type: 'incremental',
    source: 'postgres-primary',
    destination: 's3://cube-backups/postgres-incr',
    schedule: 'Every hour',
    retention: '7 days',
    lastRun: '2025-01-15 14:00',
    nextRun: '2025-01-15 15:00',
    status: 'active',
    lastBackupSize: '2.1 GB',
    compression: true,
    encryption: true,
    successRate: 99.8
  },
  {
    id: 'bkp-003',
    name: 'MongoDB Snapshots',
    type: 'snapshot',
    source: 'mongodb-analytics',
    destination: 's3://cube-backups/mongodb',
    schedule: 'Every 6 hours',
    retention: '14 days',
    lastRun: '2025-01-15 12:00',
    nextRun: '2025-01-15 18:00',
    status: 'running',
    lastBackupSize: '128.5 GB',
    compression: true,
    encryption: true,
    successRate: 98.5
  },
  {
    id: 'bkp-004',
    name: 'Redis Cache Backup',
    type: 'snapshot',
    source: 'redis-cluster',
    destination: 's3://cube-backups/redis',
    schedule: 'Every 4 hours',
    retention: '7 days',
    lastRun: '2025-01-15 12:00',
    nextRun: '2025-01-15 16:00',
    status: 'active',
    lastBackupSize: '8.4 GB',
    compression: true,
    encryption: true,
    successRate: 100
  },
  {
    id: 'bkp-005',
    name: 'Application Config Backup',
    type: 'full',
    source: 'config-store',
    destination: 's3://cube-backups/configs',
    schedule: 'Daily at 00:00 UTC',
    retention: '90 days',
    lastRun: '2025-01-15 00:00',
    nextRun: '2025-01-16 00:00',
    status: 'active',
    lastBackupSize: '156 MB',
    compression: true,
    encryption: true,
    successRate: 100
  },
  {
    id: 'bkp-006',
    name: 'Media Files Weekly',
    type: 'differential',
    source: 's3-media-bucket',
    destination: 'gcs://cube-dr/media',
    schedule: 'Weekly on Sunday',
    retention: '365 days',
    lastRun: '2025-01-12 03:00',
    nextRun: '2025-01-19 03:00',
    status: 'active',
    lastBackupSize: '1.2 TB',
    compression: false,
    encryption: true,
    successRate: 97.8
  },
  {
    id: 'bkp-007',
    name: 'Elasticsearch Indices',
    type: 'snapshot',
    source: 'elasticsearch-prod',
    destination: 's3://cube-backups/elastic',
    schedule: 'Daily at 04:00 UTC',
    retention: '14 days',
    lastRun: '2025-01-15 04:00',
    nextRun: '2025-01-16 04:00',
    status: 'failed',
    lastBackupSize: '0 GB',
    compression: true,
    encryption: true,
    successRate: 92.1
  },
  {
    id: 'bkp-008',
    name: 'User Uploads Sync',
    type: 'incremental',
    source: 's3-uploads',
    destination: 'azure://cube-backup/uploads',
    schedule: 'Every 30 minutes',
    retention: '30 days',
    lastRun: '2025-01-15 14:30',
    nextRun: '2025-01-15 15:00',
    status: 'paused',
    lastBackupSize: '450 MB',
    compression: true,
    encryption: true,
    successRate: 95.5
  }
];

const BACKUP_HISTORY: BackupHistory[] = [
  {
    id: 'hist-001',
    jobId: 'bkp-001',
    jobName: 'PostgreSQL Daily Full',
    type: 'full',
    startTime: '2025-01-15 02:00:00',
    endTime: '2025-01-15 02:45:32',
    duration: '45m 32s',
    size: '45.2 GB',
    status: 'completed',
    filesCount: 1
  },
  {
    id: 'hist-002',
    jobId: 'bkp-002',
    jobName: 'PostgreSQL Hourly Incremental',
    type: 'incremental',
    startTime: '2025-01-15 14:00:00',
    endTime: '2025-01-15 14:08:15',
    duration: '8m 15s',
    size: '2.1 GB',
    status: 'completed',
    filesCount: 1
  },
  {
    id: 'hist-003',
    jobId: 'bkp-003',
    jobName: 'MongoDB Snapshots',
    type: 'snapshot',
    startTime: '2025-01-15 12:00:00',
    endTime: '2025-01-15 13:15:00',
    duration: '1h 15m',
    size: '128.5 GB',
    status: 'completed',
    filesCount: 1
  },
  {
    id: 'hist-004',
    jobId: 'bkp-007',
    jobName: 'Elasticsearch Indices',
    type: 'snapshot',
    startTime: '2025-01-15 04:00:00',
    endTime: '2025-01-15 04:12:45',
    duration: '12m 45s',
    size: '0 GB',
    status: 'failed',
    filesCount: 0,
    errorMessage: 'Connection timeout to Elasticsearch cluster'
  },
  {
    id: 'hist-005',
    jobId: 'bkp-004',
    jobName: 'Redis Cache Backup',
    type: 'snapshot',
    startTime: '2025-01-15 12:00:00',
    endTime: '2025-01-15 12:05:20',
    duration: '5m 20s',
    size: '8.4 GB',
    status: 'completed',
    filesCount: 6
  },
  {
    id: 'hist-006',
    jobId: 'bkp-006',
    jobName: 'Media Files Weekly',
    type: 'differential',
    startTime: '2025-01-12 03:00:00',
    endTime: '2025-01-12 08:45:00',
    duration: '5h 45m',
    size: '1.2 TB',
    status: 'completed',
    filesCount: 284562
  }
];

const STORAGE_TARGETS: StorageTarget[] = [
  {
    id: 'stor-001',
    name: 'cube-backups',
    type: 's3',
    provider: 'AWS',
    region: 'us-east-1',
    capacity: '10 TB',
    used: '4.2 TB',
    usedPercent: 42,
    status: 'healthy',
    encrypted: true,
    versioning: true
  },
  {
    id: 'stor-002',
    name: 'cube-dr',
    type: 'gcs',
    provider: 'Google Cloud',
    region: 'us-central1',
    capacity: '5 TB',
    used: '2.8 TB',
    usedPercent: 56,
    status: 'healthy',
    encrypted: true,
    versioning: true
  },
  {
    id: 'stor-003',
    name: 'cube-backup',
    type: 'azure-blob',
    provider: 'Azure',
    region: 'eastus',
    capacity: '3 TB',
    used: '1.5 TB',
    usedPercent: 50,
    status: 'healthy',
    encrypted: true,
    versioning: false
  },
  {
    id: 'stor-004',
    name: '/backup/local',
    type: 'local',
    provider: 'On-Premise',
    region: 'DC1',
    capacity: '20 TB',
    used: '18.5 TB',
    usedPercent: 92.5,
    status: 'warning',
    encrypted: true,
    versioning: false
  }
];

const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: 'ret-001',
    name: 'Standard Database Policy',
    dailyBackups: 7,
    weeklyBackups: 4,
    monthlyBackups: 12,
    yearlyBackups: 3,
    minRetentionDays: 7,
    maxRetentionDays: 1095,
    targets: ['PostgreSQL', 'MongoDB', 'Redis']
  },
  {
    id: 'ret-002',
    name: 'Compliance Policy',
    dailyBackups: 30,
    weeklyBackups: 52,
    monthlyBackups: 24,
    yearlyBackups: 7,
    minRetentionDays: 30,
    maxRetentionDays: 2555,
    targets: ['Audit Logs', 'Financial Data', 'User Data']
  },
  {
    id: 'ret-003',
    name: 'Development Policy',
    dailyBackups: 3,
    weeklyBackups: 2,
    monthlyBackups: 0,
    yearlyBackups: 0,
    minRetentionDays: 3,
    maxRetentionDays: 14,
    targets: ['Dev Databases', 'Test Environments']
  }
];

const TYPE_CONFIG: Record<BackupJob['type'], { color: string; bg: string; label: string }> = {
  full: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Full' },
  incremental: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', label: 'Incremental' },
  differential: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Differential' },
  snapshot: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', label: 'Snapshot' }
};

const STATUS_CONFIG: Record<BackupJob['status'], { color: string; bg: string; icon: React.ElementType }> = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: CheckCircle },
  paused: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Pause },
  failed: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
  running: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: RefreshCw }
};

const HISTORY_STATUS_CONFIG: Record<BackupHistory['status'], { color: string; bg: string }> = {
  completed: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  failed: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  partial: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  cancelled: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }
};

const STORAGE_TYPE_ICONS: Record<StorageTarget['type'], React.ElementType> = {
  s3: Cloud,
  gcs: Cloud,
  'azure-blob': Cloud,
  local: HardDrive,
  nfs: Server
};

export default function BackupManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'history' | 'storage' | 'policies'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);

  const filteredJobs = BACKUP_JOBS.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || job.type === filterType;
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalBackupSize = '5.8 TB';
  const activeJobs = BACKUP_JOBS.filter(j => j.status === 'active').length;
  const failedJobs = BACKUP_JOBS.filter(j => j.status === 'failed').length;
  const avgSuccessRate = (BACKUP_JOBS.reduce((acc, j) => acc + j.successRate, 0) / BACKUP_JOBS.length).toFixed(1);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'jobs', label: 'Backup Jobs', icon: Archive, count: BACKUP_JOBS.length },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'policies', label: 'Policies', icon: Shield }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="overview-grid">
        <div className="overview-card activity">
          <h3>Today&apos;s Activity</h3>
          <div className="activity-stats">
            <div className="activity-stat">
              <span className="activity-value success">24</span>
              <span className="activity-label">Completed</span>
            </div>
            <div className="activity-stat">
              <span className="activity-value warning">2</span>
              <span className="activity-label">In Progress</span>
            </div>
            <div className="activity-stat">
              <span className="activity-value danger">1</span>
              <span className="activity-label">Failed</span>
            </div>
          </div>
          <div className="activity-timeline">
            {BACKUP_HISTORY.slice(0, 4).map(hist => (
              <div key={hist.id} className={`timeline-item ${hist.status}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-name">{hist.jobName}</span>
                  <span className="timeline-time">{hist.endTime.split(' ')[1]}</span>
                </div>
                <span 
                  className="timeline-status"
                  style={{ 
                    background: HISTORY_STATUS_CONFIG[hist.status].bg,
                    color: HISTORY_STATUS_CONFIG[hist.status].color
                  }}
                >
                  {hist.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card storage">
          <h3>Storage Usage</h3>
          <div className="storage-chart">
            {STORAGE_TARGETS.map(target => (
              <div key={target.id} className="storage-bar-item">
                <div className="storage-bar-header">
                  <span className="storage-name">{target.name}</span>
                  <span className="storage-percent">{target.usedPercent}%</span>
                </div>
                <div className="storage-bar-container">
                  <div 
                    className={`storage-bar-fill ${target.status}`}
                    style={{ width: `${target.usedPercent}%` }}
                  />
                </div>
                <div className="storage-bar-info">
                  <span>{target.used} / {target.capacity}</span>
                  <span className="storage-type">{target.type.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card schedule">
          <h3>Upcoming Backups</h3>
          <div className="schedule-list">
            {BACKUP_JOBS
              .filter(j => j.status === 'active')
              .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())
              .slice(0, 5)
              .map(job => (
                <div key={job.id} className="schedule-item">
                  <div className="schedule-icon">
                    <Archive size={16} />
                  </div>
                  <div className="schedule-info">
                    <span className="schedule-name">{job.name}</span>
                    <span className="schedule-time">{job.nextRun}</span>
                  </div>
                  <span 
                    className="schedule-type"
                    style={{ 
                      background: TYPE_CONFIG[job.type].bg,
                      color: TYPE_CONFIG[job.type].color
                    }}
                  >
                    {TYPE_CONFIG[job.type].label}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="overview-metrics">
        <div className="metric-card">
          <div className="metric-header">
            <Zap size={20} />
            <span>Success Rate</span>
          </div>
          <div className="metric-value">{avgSuccessRate}%</div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill success"
              style={{ width: `${avgSuccessRate}%` }}
            />
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <Timer size={20} />
            <span>Avg Duration</span>
          </div>
          <div className="metric-value">18m 24s</div>
          <span className="metric-trend up">-12% vs last week</span>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <HardDrive size={20} />
            <span>Total Backed Up</span>
          </div>
          <div className="metric-value">{totalBackupSize}</div>
          <span className="metric-trend">This month</span>
        </div>
        <div className="metric-card">
          <div className="metric-header">
            <Activity size={20} />
            <span>RPO Compliance</span>
          </div>
          <div className="metric-value">99.8%</div>
          <span className="metric-trend up">+0.3% improvement</span>
        </div>
      </div>
    </div>
  );

  const renderJobs = () => (
    <div className="jobs-section">
      <div className="jobs-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search backup jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="full">Full</option>
            <option value="incremental">Incremental</option>
            <option value="differential">Differential</option>
            <option value="snapshot">Snapshot</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Create Backup Job
        </button>
      </div>

      <div className="jobs-grid">
        {filteredJobs.map(job => {
          const statusConfig = STATUS_CONFIG[job.status];
          const typeConfig = TYPE_CONFIG[job.type];
          const StatusIcon = statusConfig.icon;
          return (
            <div 
              key={job.id} 
              className={`job-card ${job.status}`}
              onClick={() => setSelectedJob(job)}
            >
              <div className="job-header">
                <div className="job-title">
                  <h4>{job.name}</h4>
                  <span className="job-id">{job.id}</span>
                </div>
                <div 
                  className="job-status"
                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                >
                  <StatusIcon size={12} className={job.status === 'running' ? 'spin' : ''} />
                  {job.status}
                </div>
              </div>

              <div className="job-meta">
                <span 
                  className="job-type"
                  style={{ background: typeConfig.bg, color: typeConfig.color }}
                >
                  {typeConfig.label}
                </span>
                <span className="job-schedule">
                  <Calendar size={12} />
                  {job.schedule}
                </span>
              </div>

              <div className="job-details">
                <div className="job-detail">
                  <span className="detail-label">Source</span>
                  <span className="detail-value">{job.source}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Last Run</span>
                  <span className="detail-value">{job.lastRun}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Next Run</span>
                  <span className="detail-value">{job.nextRun}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Last Size</span>
                  <span className="detail-value">{job.lastBackupSize}</span>
                </div>
              </div>

              <div className="job-features">
                {job.compression && (
                  <span className="feature-badge">
                    <FolderArchive size={12} />
                    Compressed
                  </span>
                )}
                {job.encryption && (
                  <span className="feature-badge">
                    <Lock size={12} />
                    Encrypted
                  </span>
                )}
              </div>

              <div className="job-footer">
                <div className="success-rate">
                  <span className="rate-label">Success Rate</span>
                  <div className="rate-bar">
                    <div 
                      className="rate-fill"
                      style={{ 
                        width: `${job.successRate}%`,
                        background: job.successRate >= 95 ? '#22c55e' : job.successRate >= 80 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="rate-value">{job.successRate}%</span>
                </div>
                <div className="job-actions">
                  {job.status === 'paused' ? (
                    <button className="action-btn" title="Resume">
                      <Play size={14} />
                    </button>
                  ) : job.status === 'active' ? (
                    <button className="action-btn" title="Pause">
                      <Pause size={14} />
                    </button>
                  ) : null}
                  <button className="action-btn" title="Run Now">
                    <RefreshCw size={14} />
                  </button>
                  <button className="action-btn" title="Settings">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <div className="job-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Archive size={20} />
              <div>
                <h3>{selectedJob.name}</h3>
                <span className="panel-id">{selectedJob.id}</span>
              </div>
            </div>
            <button 
              className="close-btn"
              onClick={() => setSelectedJob(null)}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="panel-status-row">
              <span 
                className="status-badge"
                style={{ 
                  background: STATUS_CONFIG[selectedJob.status].bg,
                  color: STATUS_CONFIG[selectedJob.status].color
                }}
              >
                {selectedJob.status}
              </span>
              <span 
                className="type-badge"
                style={{ 
                  background: TYPE_CONFIG[selectedJob.type].bg,
                  color: TYPE_CONFIG[selectedJob.type].color
                }}
              >
                {TYPE_CONFIG[selectedJob.type].label}
              </span>
            </div>

            <div className="panel-section">
              <h4>Configuration</h4>
              <div className="config-grid">
                <div className="config-item">
                  <span className="config-label">Source</span>
                  <span className="config-value mono">{selectedJob.source}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Destination</span>
                  <span className="config-value mono">{selectedJob.destination}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Schedule</span>
                  <span className="config-value">{selectedJob.schedule}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Retention</span>
                  <span className="config-value">{selectedJob.retention}</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Last Run</span>
                  <span className="stat-value">{selectedJob.lastRun}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Next Run</span>
                  <span className="stat-value">{selectedJob.nextRun}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Last Backup Size</span>
                  <span className="stat-value">{selectedJob.lastBackupSize}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value">{selectedJob.successRate}%</span>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h4>Features</h4>
              <div className="features-list">
                <div className={`feature-item ${selectedJob.compression ? 'enabled' : 'disabled'}`}>
                  <FolderArchive size={16} />
                  <span>Compression</span>
                  <span className="feature-status">{selectedJob.compression ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className={`feature-item ${selectedJob.encryption ? 'enabled' : 'disabled'}`}>
                  <Lock size={16} />
                  <span>Encryption</span>
                  <span className="feature-status">{selectedJob.encryption ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-primary">
                <RefreshCw size={16} />
                Run Now
              </button>
              <button className="btn-outline">
                <Settings size={16} />
                Configure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="history-section">
      <div className="history-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search backup history..."
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

      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>Job Name</th>
              <th>Type</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {BACKUP_HISTORY.map(hist => {
              const typeConfig = TYPE_CONFIG[hist.type];
              const statusConfig = HISTORY_STATUS_CONFIG[hist.status];
              return (
                <tr key={hist.id}>
                  <td>
                    <div className="history-job">
                      <Archive size={16} />
                      <div className="history-job-info">
                        <span className="history-job-name">{hist.jobName}</span>
                        <span className="history-job-id">{hist.jobId}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="type-badge"
                      style={{ background: typeConfig.bg, color: typeConfig.color }}
                    >
                      {typeConfig.label}
                    </span>
                  </td>
                  <td>{hist.startTime}</td>
                  <td>{hist.duration}</td>
                  <td>{hist.size}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      {hist.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn" title="View Details">
                        <Eye size={14} />
                      </button>
                      <button className="icon-btn" title="Download">
                        <Download size={14} />
                      </button>
                      <button className="icon-btn" title="Restore">
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStorage = () => (
    <div className="storage-section">
      <div className="storage-header">
        <h3>Storage Targets</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Add Storage
        </button>
      </div>

      <div className="storage-grid">
        {STORAGE_TARGETS.map(target => {
          const IconComponent = STORAGE_TYPE_ICONS[target.type];
          return (
            <div key={target.id} className={`storage-card ${target.status}`}>
              <div className="storage-card-header">
                <div className={`storage-icon ${target.type}`}>
                  <IconComponent size={20} />
                </div>
                <div className="storage-info">
                  <h4>{target.name}</h4>
                  <span className="storage-meta">
                    {target.provider} • {target.region}
                  </span>
                </div>
                <span className={`storage-status ${target.status}`}>
                  {target.status}
                </span>
              </div>

              <div className="storage-usage">
                <div className="usage-header">
                  <span>Storage Usage</span>
                  <span className="usage-percent">{target.usedPercent}%</span>
                </div>
                <div className="usage-bar">
                  <div 
                    className={`usage-fill ${target.status}`}
                    style={{ width: `${target.usedPercent}%` }}
                  />
                </div>
                <div className="usage-details">
                  <span>{target.used} used</span>
                  <span>{target.capacity} total</span>
                </div>
              </div>

              <div className="storage-features">
                <div className={`storage-feature ${target.encrypted ? 'enabled' : 'disabled'}`}>
                  <Lock size={14} />
                  <span>Encryption</span>
                </div>
                <div className={`storage-feature ${target.versioning ? 'enabled' : 'disabled'}`}>
                  <Clock size={14} />
                  <span>Versioning</span>
                </div>
              </div>

              <div className="storage-actions">
                <button className="btn-outline small">
                  <Eye size={14} />
                  Browse
                </button>
                <button className="btn-outline small">
                  <Settings size={14} />
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="policies-section">
      <div className="policies-header">
        <h3>Retention Policies</h3>
        <button className="btn-primary">
          <Plus size={16} />
          Create Policy
        </button>
      </div>

      <div className="policies-list">
        {RETENTION_POLICIES.map(policy => (
          <div key={policy.id} className="policy-card">
            <div className="policy-header">
              <div className="policy-icon">
                <Shield size={20} />
              </div>
              <div className="policy-info">
                <h4>{policy.name}</h4>
                <span className="policy-id">{policy.id}</span>
              </div>
              <button className="icon-btn">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="policy-retention">
              <div className="retention-item">
                <span className="retention-value">{policy.dailyBackups}</span>
                <span className="retention-label">Daily</span>
              </div>
              <div className="retention-item">
                <span className="retention-value">{policy.weeklyBackups}</span>
                <span className="retention-label">Weekly</span>
              </div>
              <div className="retention-item">
                <span className="retention-value">{policy.monthlyBackups}</span>
                <span className="retention-label">Monthly</span>
              </div>
              <div className="retention-item">
                <span className="retention-value">{policy.yearlyBackups}</span>
                <span className="retention-label">Yearly</span>
              </div>
            </div>

            <div className="policy-range">
              <div className="range-item">
                <span className="range-label">Min Retention</span>
                <span className="range-value">{policy.minRetentionDays} days</span>
              </div>
              <div className="range-item">
                <span className="range-label">Max Retention</span>
                <span className="range-value">{policy.maxRetentionDays} days</span>
              </div>
            </div>

            <div className="policy-targets">
              <span className="targets-label">Applies to:</span>
              <div className="targets-list">
                {policy.targets.map((target, index) => (
                  <span key={index} className="target-badge">
                    {target}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="backup-management">
      <header className="bkp__header">
        <div className="bkp__title-section">
          <div className="bkp__icon">
            <Archive size={28} />
          </div>
          <div>
            <h1>Backup Management</h1>
            <p>Centralized backup orchestration and recovery</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Sync Status
          </button>
          <button className="btn-outline">
            <RotateCcw size={16} />
            Restore Wizard
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Backup
          </button>
        </div>
      </header>

      <div className="bkp__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Archive size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{BACKUP_JOBS.length}</span>
            <span className="stat-label">Backup Jobs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeJobs}</span>
            <span className="stat-label">Active Jobs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <AlertCircle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{failedJobs}</span>
            <span className="stat-label">Failed Jobs</span>
          </div>
          {failedJobs > 0 && (
            <span className="stat-badge danger">Needs Attention</span>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-icon storage">
            <HardDrive size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalBackupSize}</span>
            <span className="stat-label">Total Stored</span>
          </div>
        </div>
      </div>

      <nav className="bkp__tabs">
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

      <main className="bkp__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'storage' && renderStorage()}
        {activeTab === 'policies' && renderPolicies()}
      </main>
    </div>
  );
}
