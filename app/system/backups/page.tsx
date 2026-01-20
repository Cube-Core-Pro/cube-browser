'use client';

import React, { useState } from 'react';
import {
  HardDrive,
  Cloud,
  Calendar,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  FolderArchive,
  Server,
  Database,
  Shield,
  ChevronDown,
  Search,
  Filter,
  Plus,
  History,
  Lock,
  Unlock,
  Eye,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import './backup-management.css';

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  source: string;
  destination: 'local' | 'cloud' | 's3' | 'azure' | 'gcs';
  size: string;
  status: 'completed' | 'running' | 'failed' | 'scheduled' | 'cancelled';
  progress?: number;
  createdAt: string;
  completedAt?: string;
  duration?: string;
  retentionDays: number;
  encrypted: boolean;
  compression: boolean;
  items: number;
}

interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time: string;
  destination: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  retention: number;
}

interface StorageLocation {
  id: string;
  name: string;
  type: 'local' | 'cloud' | 's3' | 'azure' | 'gcs';
  path: string;
  used: string;
  total: string;
  usedPercentage: number;
  status: 'connected' | 'disconnected' | 'error';
}

const BACKUPS: Backup[] = [
  {
    id: '1',
    name: 'Full System Backup',
    type: 'full',
    source: 'All Data',
    destination: 'cloud',
    size: '12.8 GB',
    status: 'completed',
    createdAt: 'Today at 03:00 AM',
    completedAt: 'Today at 03:45 AM',
    duration: '45 min',
    retentionDays: 30,
    encrypted: true,
    compression: true,
    items: 156432
  },
  {
    id: '2',
    name: 'Database Incremental',
    type: 'incremental',
    source: 'Database',
    destination: 's3',
    size: '890 MB',
    status: 'running',
    progress: 68,
    createdAt: 'Just now',
    retentionDays: 14,
    encrypted: true,
    compression: true,
    items: 45678
  },
  {
    id: '3',
    name: 'Automation Scripts',
    type: 'differential',
    source: 'Automations',
    destination: 'local',
    size: '2.4 GB',
    status: 'completed',
    createdAt: 'Yesterday at 11:30 PM',
    completedAt: 'Yesterday at 11:38 PM',
    duration: '8 min',
    retentionDays: 7,
    encrypted: false,
    compression: true,
    items: 8934
  },
  {
    id: '4',
    name: 'User Data Export',
    type: 'full',
    source: 'Users & Settings',
    destination: 'azure',
    size: '5.6 GB',
    status: 'failed',
    createdAt: 'Yesterday at 06:00 AM',
    retentionDays: 30,
    encrypted: true,
    compression: true,
    items: 0
  },
  {
    id: '5',
    name: 'Logs Archive',
    type: 'incremental',
    source: 'Logs',
    destination: 'gcs',
    size: '1.2 GB',
    status: 'scheduled',
    createdAt: 'Tomorrow at 02:00 AM',
    retentionDays: 90,
    encrypted: true,
    compression: true,
    items: 0
  }
];

const SCHEDULES: BackupSchedule[] = [
  {
    id: '1',
    name: 'Nightly Full Backup',
    type: 'full',
    frequency: 'daily',
    time: '03:00 AM',
    destination: 'AWS S3',
    enabled: true,
    lastRun: 'Today at 03:00 AM',
    nextRun: 'Tomorrow at 03:00 AM',
    retention: 30
  },
  {
    id: '2',
    name: 'Hourly Incremental',
    type: 'incremental',
    frequency: 'hourly',
    time: 'Every hour',
    destination: 'Local Storage',
    enabled: true,
    lastRun: '45 minutes ago',
    nextRun: 'In 15 minutes',
    retention: 7
  },
  {
    id: '3',
    name: 'Weekly Archive',
    type: 'full',
    frequency: 'weekly',
    time: 'Sunday 00:00',
    destination: 'Azure Blob',
    enabled: true,
    lastRun: '5 days ago',
    nextRun: 'In 2 days',
    retention: 90
  },
  {
    id: '4',
    name: 'Monthly Cold Storage',
    type: 'full',
    frequency: 'monthly',
    time: '1st at 01:00 AM',
    destination: 'Google Cloud',
    enabled: false,
    lastRun: '25 days ago',
    nextRun: 'In 5 days',
    retention: 365
  }
];

const STORAGE_LOCATIONS: StorageLocation[] = [
  { id: '1', name: 'Local NVMe Storage', type: 'local', path: '/data/backups', used: '234 GB', total: '1 TB', usedPercentage: 23.4, status: 'connected' },
  { id: '2', name: 'AWS S3 Bucket', type: 's3', path: 's3://cube-backups', used: '1.8 TB', total: '5 TB', usedPercentage: 36, status: 'connected' },
  { id: '3', name: 'Azure Blob Storage', type: 'azure', path: 'cube-archive', used: '890 GB', total: '2 TB', usedPercentage: 44.5, status: 'connected' },
  { id: '4', name: 'Google Cloud Storage', type: 'gcs', path: 'gs://cube-cold', used: '450 GB', total: '1 TB', usedPercentage: 45, status: 'disconnected' }
];

export default function BackupManagementPage() {
  const [activeTab, setActiveTab] = useState<'backups' | 'schedules' | 'storage'>('backups');
  const [backups, setBackups] = useState<Backup[]>(BACKUPS);
  const [schedules, setSchedules] = useState<BackupSchedule[]>(SCHEDULES);
  const [storageLocations] = useState<StorageLocation[]>(STORAGE_LOCATIONS);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredBackups = backups.filter(backup => {
    const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;
    const matchesSearch = backup.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSchedule = (id: string) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const getDestinationIcon = (dest: string) => {
    switch (dest) {
      case 'cloud':
      case 's3':
      case 'azure':
      case 'gcs': return Cloud;
      case 'local': return HardDrive;
      default: return Server;
    }
  };

  const totalBackupSize = '23.5 TB';
  const completedBackups = backups.filter(b => b.status === 'completed').length;
  const runningBackups = backups.filter(b => b.status === 'running').length;

  return (
    <div className="backup-management">
      <header className="backup-management__header">
        <div className="backup-management__title-section">
          <div className="backup-management__icon">
            <FolderArchive size={28} />
          </div>
          <div>
            <h1>Backup Management</h1>
            <p>Automated backup scheduling, retention, and disaster recovery</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-outline">
            <History size={16} />
            Restore
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Backup
          </button>
        </div>
      </header>

      <div className="backup-management__stats">
        <div className="stat-card">
          <div className="stat-icon storage">
            <HardDrive size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalBackupSize}</span>
            <span className="stat-label">Total Backup Size</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{completedBackups}</span>
            <span className="stat-label">Completed Backups</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon running">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningBackups}</span>
            <span className="stat-label">Running Now</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon schedules">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{schedules.filter(s => s.enabled).length}</span>
            <span className="stat-label">Active Schedules</span>
          </div>
        </div>
      </div>

      <div className="backup-management__tabs">
        <button 
          className={`tab-btn ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          <FolderArchive size={16} />
          Backups
          <span className="tab-badge">{backups.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <Calendar size={16} />
          Schedules
          <span className="tab-badge">{schedules.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <Cloud size={16} />
          Storage
          <span className="tab-badge">{storageLocations.length}</span>
        </button>
      </div>

      {activeTab === 'backups' && (
        <div className="backups-section">
          <div className="section-toolbar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search backups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-buttons">
              {['all', 'completed', 'running', 'failed', 'scheduled'].map(status => (
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

          <div className="backups-list">
            {filteredBackups.map(backup => {
              const DestIcon = getDestinationIcon(backup.destination);

              return (
                <div key={backup.id} className={`backup-card ${backup.status}`}>
                  <div className="backup-main">
                    <div className={`backup-icon ${backup.type}`}>
                      <FolderArchive size={22} />
                    </div>

                    <div className="backup-info">
                      <div className="backup-header">
                        <h4 className="backup-name">{backup.name}</h4>
                        <span className={`status-badge ${backup.status}`}>
                          {backup.status === 'completed' && <CheckCircle size={12} />}
                          {backup.status === 'running' && <RefreshCw size={12} className="spinning" />}
                          {backup.status === 'failed' && <XCircle size={12} />}
                          {backup.status === 'scheduled' && <Clock size={12} />}
                          {backup.status}
                        </span>
                      </div>

                      <div className="backup-meta">
                        <span className={`type-badge ${backup.type}`}>{backup.type}</span>
                        <span className="source">{backup.source}</span>
                        <span className="destination">
                          <DestIcon size={14} />
                          {backup.destination.toUpperCase()}
                        </span>
                        <span className="date">
                          <Calendar size={14} />
                          {backup.createdAt}
                        </span>
                      </div>

                      {backup.status === 'running' && backup.progress !== undefined && (
                        <div className="progress-section">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${backup.progress}%` }} 
                            />
                          </div>
                          <span className="progress-text">{backup.progress}% complete</span>
                        </div>
                      )}

                      {backup.status === 'completed' && (
                        <div className="completion-stats">
                          <span className="stat">
                            <HardDrive size={14} />
                            {backup.size}
                          </span>
                          <span className="stat">
                            <Clock size={14} />
                            {backup.duration}
                          </span>
                          <span className="stat">
                            <Database size={14} />
                            {backup.items.toLocaleString()} items
                          </span>
                          {backup.encrypted && (
                            <span className="stat encrypted">
                              <Lock size={14} />
                              Encrypted
                            </span>
                          )}
                        </div>
                      )}

                      {backup.status === 'failed' && (
                        <div className="error-info">
                          <AlertTriangle size={16} />
                          <span>Connection timeout - storage unavailable</span>
                          <button className="btn-text">Retry</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="backup-actions">
                    {backup.status === 'completed' && (
                      <>
                        <button className="action-btn" title="Download">
                          <Download size={16} />
                        </button>
                        <button className="action-btn" title="Restore">
                          <History size={16} />
                        </button>
                      </>
                    )}
                    {backup.status === 'running' && (
                      <button className="action-btn" title="Cancel">
                        <Pause size={16} />
                      </button>
                    )}
                    {backup.status === 'scheduled' && (
                      <button className="action-btn" title="Run Now">
                        <Play size={16} />
                      </button>
                    )}
                    <button className="action-btn" title="View Details">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn danger" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="schedules-section">
          <div className="section-header">
            <h2>Backup Schedules</h2>
            <button className="btn-outline">
              <Plus size={16} />
              New Schedule
            </button>
          </div>

          <div className="schedules-grid">
            {schedules.map(schedule => (
              <div key={schedule.id} className={`schedule-card ${schedule.enabled ? '' : 'disabled'}`}>
                <div className="schedule-header">
                  <div className="schedule-info">
                    <h4>{schedule.name}</h4>
                    <span className={`type-badge ${schedule.type}`}>{schedule.type}</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={schedule.enabled} 
                      onChange={() => toggleSchedule(schedule.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="schedule-details">
                  <div className="detail-row">
                    <span className="detail-label">
                      <Clock size={14} />
                      Frequency
                    </span>
                    <span className="detail-value">{schedule.frequency} - {schedule.time}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <Cloud size={14} />
                      Destination
                    </span>
                    <span className="detail-value">{schedule.destination}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <Calendar size={14} />
                      Retention
                    </span>
                    <span className="detail-value">{schedule.retention} days</span>
                  </div>
                </div>

                <div className="schedule-timing">
                  {schedule.lastRun && (
                    <span className="last-run">
                      Last: {schedule.lastRun}
                    </span>
                  )}
                  <span className="next-run">
                    <Zap size={12} />
                    Next: {schedule.nextRun}
                  </span>
                </div>

                <div className="schedule-actions">
                  <button className="btn-small">
                    <Play size={12} />
                    Run Now
                  </button>
                  <button className="btn-small outline">
                    <Settings size={12} />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="storage-section">
          <div className="section-header">
            <h2>Storage Locations</h2>
            <button className="btn-outline">
              <Plus size={16} />
              Add Storage
            </button>
          </div>

          <div className="storage-grid">
            {storageLocations.map(storage => {
              const Icon = getDestinationIcon(storage.type);

              return (
                <div key={storage.id} className={`storage-card ${storage.status}`}>
                  <div className="storage-header">
                    <div className={`storage-icon ${storage.type}`}>
                      <Icon size={24} />
                    </div>
                    <div className="storage-info">
                      <h4>{storage.name}</h4>
                      <code className="storage-path">{storage.path}</code>
                    </div>
                    <span className={`status-indicator ${storage.status}`}>
                      {storage.status === 'connected' && <CheckCircle size={14} />}
                      {storage.status === 'disconnected' && <XCircle size={14} />}
                      {storage.status}
                    </span>
                  </div>

                  <div className="storage-usage">
                    <div className="usage-header">
                      <span>{storage.used} used of {storage.total}</span>
                      <span className="percentage">{storage.usedPercentage}%</span>
                    </div>
                    <div className="usage-bar">
                      <div 
                        className={`usage-fill ${storage.usedPercentage > 80 ? 'warning' : storage.usedPercentage > 90 ? 'danger' : ''}`}
                        style={{ width: `${storage.usedPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="storage-actions">
                    <button className="btn-small">
                      <RefreshCw size={12} />
                      Test Connection
                    </button>
                    <button className="btn-small outline">
                      <Settings size={12} />
                      Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="storage-tips">
            <h3>
              <Shield size={18} />
              Best Practices
            </h3>
            <ul>
              <li>Maintain backups in at least 2 different locations (3-2-1 rule)</li>
              <li>Enable encryption for all cloud-based backups</li>
              <li>Test restore procedures regularly</li>
              <li>Set appropriate retention policies based on compliance requirements</li>
            </ul>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <FolderArchive size={22} />
                </div>
                <h2>Create New Backup</h2>
              </div>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Backup Name</label>
                <input type="text" placeholder="Enter backup name" className="form-input" />
              </div>

              <div className="form-group">
                <label>Backup Type</label>
                <div className="type-options">
                  <button className="type-option active">
                    <strong>Full</strong>
                    <span>Complete backup of all data</span>
                  </button>
                  <button className="type-option">
                    <strong>Incremental</strong>
                    <span>Only changes since last backup</span>
                  </button>
                  <button className="type-option">
                    <strong>Differential</strong>
                    <span>Changes since last full backup</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Data Source</label>
                <select className="form-select">
                  <option>All Data</option>
                  <option>Database Only</option>
                  <option>Automations</option>
                  <option>Users & Settings</option>
                  <option>Logs</option>
                </select>
              </div>

              <div className="form-group">
                <label>Destination</label>
                <select className="form-select">
                  <option>AWS S3</option>
                  <option>Azure Blob Storage</option>
                  <option>Google Cloud Storage</option>
                  <option>Local Storage</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Retention (days)</label>
                  <input type="number" defaultValue={30} className="form-input" />
                </div>
                <div className="form-group half">
                  <label>Compression</label>
                  <select className="form-select">
                    <option>Enabled (gzip)</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Enable AES-256 encryption</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Play size={16} />
                Start Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
