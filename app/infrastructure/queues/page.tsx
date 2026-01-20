'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Box,
  ArrowRight,
  MoreVertical,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  Timer,
  Database,
  Mail,
  FileText,
  Image,
  Send,
  Archive
} from 'lucide-react';
import './queue-management.css';

interface QueueItem {
  id: string;
  queueName: string;
  jobId: string;
  type: 'email' | 'export' | 'import' | 'notification' | 'processing' | 'sync';
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  priority: 'critical' | 'high' | 'normal' | 'low';
  data: {
    title: string;
    description: string;
  };
  attempts: number;
  maxAttempts: number;
  progress?: number;
  createdAt: string;
  processedAt?: string;
  duration?: string;
  error?: string;
}

interface Queue {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'draining';
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  throughput: number;
  avgProcessingTime: string;
  workers: number;
}

const QUEUES: Queue[] = [
  {
    id: 'queue-001',
    name: 'Email Queue',
    type: 'email',
    status: 'active',
    stats: { waiting: 245, active: 12, completed: 8934, failed: 23, delayed: 15 },
    throughput: 156,
    avgProcessingTime: '1.2s',
    workers: 4
  },
  {
    id: 'queue-002',
    name: 'Export Queue',
    type: 'export',
    status: 'active',
    stats: { waiting: 34, active: 3, completed: 1256, failed: 8, delayed: 2 },
    throughput: 28,
    avgProcessingTime: '4.5s',
    workers: 2
  },
  {
    id: 'queue-003',
    name: 'Notification Queue',
    type: 'notification',
    status: 'active',
    stats: { waiting: 567, active: 25, completed: 45678, failed: 12, delayed: 45 },
    throughput: 320,
    avgProcessingTime: '0.3s',
    workers: 8
  },
  {
    id: 'queue-004',
    name: 'Data Sync Queue',
    type: 'sync',
    status: 'paused',
    stats: { waiting: 89, active: 0, completed: 2345, failed: 45, delayed: 89 },
    throughput: 0,
    avgProcessingTime: '8.2s',
    workers: 3
  },
  {
    id: 'queue-005',
    name: 'Image Processing',
    type: 'processing',
    status: 'active',
    stats: { waiting: 156, active: 8, completed: 12456, failed: 34, delayed: 23 },
    throughput: 45,
    avgProcessingTime: '2.8s',
    workers: 6
  }
];

const QUEUE_ITEMS: QueueItem[] = [
  {
    id: 'job-001',
    queueName: 'Email Queue',
    jobId: 'email_12345',
    type: 'email',
    status: 'active',
    priority: 'high',
    data: {
      title: 'Welcome Email Batch',
      description: 'Send welcome emails to 150 new users'
    },
    attempts: 1,
    maxAttempts: 3,
    progress: 65,
    createdAt: '2024-01-27T10:30:00Z',
    processedAt: '2024-01-27T10:31:00Z'
  },
  {
    id: 'job-002',
    queueName: 'Export Queue',
    jobId: 'export_67890',
    type: 'export',
    status: 'waiting',
    priority: 'normal',
    data: {
      title: 'User Data Export',
      description: 'Export user analytics for Q4 2024'
    },
    attempts: 0,
    maxAttempts: 3,
    createdAt: '2024-01-27T10:25:00Z'
  },
  {
    id: 'job-003',
    queueName: 'Notification Queue',
    jobId: 'notif_11111',
    type: 'notification',
    status: 'completed',
    priority: 'normal',
    data: {
      title: 'System Alert Broadcast',
      description: 'Send maintenance notification to all users'
    },
    attempts: 1,
    maxAttempts: 3,
    createdAt: '2024-01-27T09:00:00Z',
    processedAt: '2024-01-27T09:00:30Z',
    duration: '0.5s'
  },
  {
    id: 'job-004',
    queueName: 'Data Sync Queue',
    jobId: 'sync_22222',
    type: 'sync',
    status: 'failed',
    priority: 'critical',
    data: {
      title: 'Database Sync',
      description: 'Sync user data with analytics platform'
    },
    attempts: 3,
    maxAttempts: 3,
    createdAt: '2024-01-27T08:00:00Z',
    processedAt: '2024-01-27T08:05:00Z',
    duration: '5m 00s',
    error: 'Connection timeout to analytics server'
  },
  {
    id: 'job-005',
    queueName: 'Image Processing',
    jobId: 'img_33333',
    type: 'processing',
    status: 'active',
    priority: 'normal',
    data: {
      title: 'Thumbnail Generation',
      description: 'Generate thumbnails for 500 uploaded images'
    },
    attempts: 1,
    maxAttempts: 3,
    progress: 34,
    createdAt: '2024-01-27T10:00:00Z',
    processedAt: '2024-01-27T10:02:00Z'
  },
  {
    id: 'job-006',
    queueName: 'Email Queue',
    jobId: 'email_44444',
    type: 'email',
    status: 'delayed',
    priority: 'low',
    data: {
      title: 'Newsletter Campaign',
      description: 'Send weekly newsletter to subscribers'
    },
    attempts: 0,
    maxAttempts: 3,
    createdAt: '2024-01-27T10:35:00Z'
  },
  {
    id: 'job-007',
    queueName: 'Export Queue',
    jobId: 'export_55555',
    type: 'export',
    status: 'paused',
    priority: 'high',
    data: {
      title: 'Compliance Report',
      description: 'Generate GDPR compliance report for audit'
    },
    attempts: 1,
    maxAttempts: 3,
    progress: 45,
    createdAt: '2024-01-27T09:30:00Z'
  }
];

const TYPE_ICONS = {
  email: Mail,
  export: FileText,
  import: Archive,
  notification: Send,
  processing: Image,
  sync: Database
};

const STATUS_CONFIG = {
  waiting: { icon: Clock, color: 'warning', label: 'Waiting' },
  active: { icon: Zap, color: 'info', label: 'Active' },
  completed: { icon: CheckCircle2, color: 'success', label: 'Completed' },
  failed: { icon: XCircle, color: 'danger', label: 'Failed' },
  delayed: { icon: Timer, color: 'muted', label: 'Delayed' },
  paused: { icon: Pause, color: 'purple', label: 'Paused' }
};

const PRIORITY_CONFIG = {
  critical: { color: 'danger', label: 'Critical' },
  high: { color: 'warning', label: 'High' },
  normal: { color: 'info', label: 'Normal' },
  low: { color: 'muted', label: 'Low' }
};

export default function QueueManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'dead-letter'>('overview');
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredJobs = QUEUE_ITEMS.filter(job => {
    const matchesQueue = selectedQueue === 'all' || job.queueName === selectedQueue;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    return matchesQueue && matchesStatus;
  });

  const totalStats = {
    waiting: QUEUES.reduce((sum, q) => sum + q.stats.waiting, 0),
    active: QUEUES.reduce((sum, q) => sum + q.stats.active, 0),
    completed: QUEUES.reduce((sum, q) => sum + q.stats.completed, 0),
    failed: QUEUES.reduce((sum, q) => sum + q.stats.failed, 0)
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="queue-management">
      <header className="queue-management__header">
        <div className="queue-management__title-section">
          <div className="queue-management__icon">
            <Layers size={28} />
          </div>
          <div>
            <h1>Queue Management</h1>
            <p>Monitor and manage background job queues</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Job
          </button>
        </div>
      </header>

      <div className="queue-management__stats">
        <div className="stat-card">
          <div className="stat-icon waiting">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStats.waiting.toLocaleString()}</span>
            <span className="stat-label">Waiting</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStats.active}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStats.completed.toLocaleString()}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      <div className="queue-management__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Box size={16} />
          Queues Overview
          <span className="tab-badge">{QUEUES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Layers size={16} />
          All Jobs
          <span className="tab-badge">{QUEUE_ITEMS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dead-letter' ? 'active' : ''}`}
          onClick={() => setActiveTab('dead-letter')}
        >
          <AlertTriangle size={16} />
          Dead Letter
          <span className="tab-badge danger">{totalStats.failed}</span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="queues-grid">
          {QUEUES.map(queue => {
            const TypeIcon = TYPE_ICONS[queue.type as keyof typeof TYPE_ICONS] || Box;
            const total = Object.values(queue.stats).reduce((a, b) => a + b, 0);
            const successRate = total > 0 
              ? ((queue.stats.completed / (queue.stats.completed + queue.stats.failed)) * 100).toFixed(1)
              : '100';

            return (
              <div key={queue.id} className={`queue-card ${queue.status}`}>
                <div className="queue-header">
                  <div className="queue-info">
                    <div className={`queue-type-icon ${queue.type}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div>
                      <h3>{queue.name}</h3>
                      <span className={`queue-status ${queue.status}`}>
                        {queue.status === 'active' && <span className="pulse" />}
                        {queue.status.charAt(0).toUpperCase() + queue.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="queue-actions">
                    {queue.status === 'active' ? (
                      <button className="action-btn" title="Pause Queue">
                        <Pause size={16} />
                      </button>
                    ) : (
                      <button className="action-btn" title="Resume Queue">
                        <Play size={16} />
                      </button>
                    )}
                    <button className="action-btn" title="Settings">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>

                <div className="queue-stats-grid">
                  <div className="mini-stat">
                    <span className="mini-value waiting">{queue.stats.waiting}</span>
                    <span className="mini-label">Waiting</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-value active">{queue.stats.active}</span>
                    <span className="mini-label">Active</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-value completed">{queue.stats.completed.toLocaleString()}</span>
                    <span className="mini-label">Completed</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-value failed">{queue.stats.failed}</span>
                    <span className="mini-label">Failed</span>
                  </div>
                </div>

                <div className="queue-metrics">
                  <div className="metric">
                    <TrendingUp size={14} />
                    <span>{queue.throughput}/min</span>
                  </div>
                  <div className="metric">
                    <Timer size={14} />
                    <span>{queue.avgProcessingTime}</span>
                  </div>
                  <div className="metric">
                    <Database size={14} />
                    <span>{queue.workers} workers</span>
                  </div>
                </div>

                <div className="queue-footer">
                  <div className="success-rate">
                    <span className="rate-value">{successRate}%</span>
                    <span className="rate-label">Success Rate</span>
                  </div>
                  <button className="view-jobs-btn">
                    View Jobs
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'jobs' && (
        <>
          <div className="queue-management__filters">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Search jobs..." />
            </div>
            <select 
              className="filter-select"
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
            >
              <option value="all">All Queues</option>
              {QUEUES.map(q => (
                <option key={q.id} value={q.name}>{q.name}</option>
              ))}
            </select>
            <select 
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="delayed">Delayed</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="jobs-list">
            {filteredJobs.map(job => {
              const TypeIcon = TYPE_ICONS[job.type];
              const StatusIcon = STATUS_CONFIG[job.status].icon;
              const statusColor = STATUS_CONFIG[job.status].color;
              const priorityConfig = PRIORITY_CONFIG[job.priority];

              return (
                <div key={job.id} className="job-card">
                  <div className="job-status-indicator">
                    <div className={`status-icon ${statusColor}`}>
                      <StatusIcon size={16} />
                    </div>
                  </div>

                  <div className="job-type-icon">
                    <TypeIcon size={18} />
                  </div>

                  <div className="job-info">
                    <div className="job-header">
                      <h4>{job.data.title}</h4>
                      <div className="job-badges">
                        <span className={`priority-badge ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                        <span className={`status-badge ${statusColor}`}>
                          {STATUS_CONFIG[job.status].label}
                        </span>
                      </div>
                    </div>
                    <p className="job-description">{job.data.description}</p>
                    <div className="job-meta">
                      <span className="meta-item">
                        <Box size={12} />
                        {job.queueName}
                      </span>
                      <span className="meta-item">
                        <code>{job.jobId}</code>
                      </span>
                      <span className="meta-item">
                        <Clock size={12} />
                        {formatDate(job.createdAt)}
                      </span>
                      <span className="meta-item">
                        Attempts: {job.attempts}/{job.maxAttempts}
                      </span>
                    </div>
                    {job.progress !== undefined && job.status === 'active' && (
                      <div className="job-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="progress-text">{job.progress}%</span>
                      </div>
                    )}
                    {job.error && (
                      <div className="job-error">
                        <AlertTriangle size={14} />
                        {job.error}
                      </div>
                    )}
                  </div>

                  <div className="job-actions">
                    <button className="action-btn" title="View Details">
                      <Eye size={16} />
                    </button>
                    {job.status === 'failed' && (
                      <button className="action-btn retry" title="Retry">
                        <RefreshCw size={16} />
                      </button>
                    )}
                    {(job.status === 'waiting' || job.status === 'delayed') && (
                      <button className="action-btn delete" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button className="action-btn" title="More">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'dead-letter' && (
        <div className="dead-letter-section">
          <div className="dead-letter-header">
            <div className="dead-letter-info">
              <AlertTriangle size={24} />
              <div>
                <h2>Dead Letter Queue</h2>
                <p>Jobs that have exceeded maximum retry attempts</p>
              </div>
            </div>
            <div className="dead-letter-actions">
              <button className="btn-outline">
                <RefreshCw size={16} />
                Retry All
              </button>
              <button className="btn-outline danger">
                <Trash2 size={16} />
                Purge All
              </button>
            </div>
          </div>

          <div className="jobs-list">
            {QUEUE_ITEMS.filter(job => job.status === 'failed').map(job => {
              const TypeIcon = TYPE_ICONS[job.type];

              return (
                <div key={job.id} className="job-card failed">
                  <div className="job-status-indicator">
                    <div className="status-icon danger">
                      <XCircle size={16} />
                    </div>
                  </div>

                  <div className="job-type-icon">
                    <TypeIcon size={18} />
                  </div>

                  <div className="job-info">
                    <div className="job-header">
                      <h4>{job.data.title}</h4>
                      <span className="attempts-badge">
                        {job.attempts}/{job.maxAttempts} attempts
                      </span>
                    </div>
                    <p className="job-description">{job.data.description}</p>
                    {job.error && (
                      <div className="job-error">
                        <AlertTriangle size={14} />
                        {job.error}
                      </div>
                    )}
                    <div className="job-meta">
                      <span className="meta-item">
                        <Box size={12} />
                        {job.queueName}
                      </span>
                      <span className="meta-item">
                        <Clock size={12} />
                        Failed: {job.processedAt ? formatDate(job.processedAt) : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="job-actions">
                    <button className="action-btn retry" title="Retry">
                      <RefreshCw size={16} />
                    </button>
                    <button className="action-btn delete" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
