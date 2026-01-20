'use client';

import React, { useState } from 'react';
import {
  Shield,
  Server,
  Database,
  Cloud,
  Globe,
  HardDrive,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Target,
  Zap,
  Activity,
  TrendingUp,
  Download,
  Upload,
  Copy,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Building,
  FileText,
  Link2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Timer,
  Users,
  AlertCircle,
  History,
  RotateCcw,
  Boxes,
  Network,
  Container,
  GitBranch,
  Lock,
  Unlock,
  Power,
  PowerOff,
  MoreVertical
} from 'lucide-react';
import './disaster-recovery.css';

interface DRPlan {
  id: string;
  name: string;
  description: string;
  type: 'active-active' | 'active-passive' | 'pilot-light' | 'warm-standby' | 'backup-restore';
  status: 'active' | 'testing' | 'degraded' | 'failed';
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  actualRTO?: number;
  actualRPO?: number;
  primaryRegion: string;
  secondaryRegion: string;
  lastTested: string;
  nextTest: string;
  services: string[];
  owner: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface FailoverRecord {
  id: string;
  planId: string;
  planName: string;
  type: 'planned' | 'unplanned' | 'test';
  status: 'completed' | 'in_progress' | 'failed' | 'rolled_back';
  startTime: string;
  endTime?: string;
  duration?: number;
  initiatedBy: string;
  reason: string;
  affectedServices: number;
  dataLoss: boolean;
}

interface ReplicationStatus {
  id: string;
  source: string;
  destination: string;
  type: 'database' | 'storage' | 'application';
  status: 'synced' | 'syncing' | 'lagging' | 'failed';
  lag: number; // in seconds
  lastSync: string;
  throughput: string;
  method: 'synchronous' | 'asynchronous';
}

interface BackupStatus {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  size: string;
  duration: number;
  lastBackup: string;
  nextBackup: string;
  retention: string;
  location: string;
}

const DR_PLANS: DRPlan[] = [
  {
    id: 'drp-001',
    name: 'Core Platform DR',
    description: 'Primary disaster recovery plan for core API and database services',
    type: 'active-passive',
    status: 'active',
    rto: 15,
    rpo: 5,
    actualRTO: 12,
    actualRPO: 3,
    primaryRegion: 'us-east-1',
    secondaryRegion: 'us-west-2',
    lastTested: '2025-01-15T10:00:00Z',
    nextTest: '2025-02-15T10:00:00Z',
    services: ['Core API', 'User Service', 'Auth Service', 'PostgreSQL Primary'],
    owner: 'Platform Team',
    priority: 'critical'
  },
  {
    id: 'drp-002',
    name: 'Payment Systems DR',
    description: 'High-availability disaster recovery for payment processing infrastructure',
    type: 'active-active',
    status: 'active',
    rto: 5,
    rpo: 0,
    actualRTO: 4,
    actualRPO: 0,
    primaryRegion: 'us-east-1',
    secondaryRegion: 'eu-west-1',
    lastTested: '2025-01-20T06:00:00Z',
    nextTest: '2025-02-20T06:00:00Z',
    services: ['Payment Gateway', 'Transaction Processor', 'Fraud Detection'],
    owner: 'Payment Team',
    priority: 'critical'
  },
  {
    id: 'drp-003',
    name: 'Data Analytics DR',
    description: 'Warm standby for analytics and reporting infrastructure',
    type: 'warm-standby',
    status: 'active',
    rto: 60,
    rpo: 15,
    actualRTO: 45,
    actualRPO: 12,
    primaryRegion: 'us-east-1',
    secondaryRegion: 'us-west-2',
    lastTested: '2025-01-10T14:00:00Z',
    nextTest: '2025-02-10T14:00:00Z',
    services: ['Analytics Engine', 'Report Generator', 'Data Warehouse'],
    owner: 'Data Team',
    priority: 'high'
  },
  {
    id: 'drp-004',
    name: 'Media Services DR',
    description: 'Pilot light configuration for media processing and CDN',
    type: 'pilot-light',
    status: 'testing',
    rto: 120,
    rpo: 30,
    primaryRegion: 'us-east-1',
    secondaryRegion: 'ap-southeast-1',
    lastTested: '2025-01-25T08:00:00Z',
    nextTest: '2025-02-25T08:00:00Z',
    services: ['Media Processor', 'CDN Origin', 'Image Optimizer'],
    owner: 'Media Team',
    priority: 'medium'
  }
];

const FAILOVER_HISTORY: FailoverRecord[] = [
  {
    id: 'fo-001',
    planId: 'drp-001',
    planName: 'Core Platform DR',
    type: 'test',
    status: 'completed',
    startTime: '2025-01-15T10:00:00Z',
    endTime: '2025-01-15T10:12:00Z',
    duration: 12,
    initiatedBy: 'Platform Team',
    reason: 'Scheduled DR test',
    affectedServices: 4,
    dataLoss: false
  },
  {
    id: 'fo-002',
    planId: 'drp-002',
    planName: 'Payment Systems DR',
    type: 'unplanned',
    status: 'completed',
    startTime: '2025-01-18T03:45:00Z',
    endTime: '2025-01-18T03:49:00Z',
    duration: 4,
    initiatedBy: 'Auto-Failover',
    reason: 'Primary region network degradation detected',
    affectedServices: 3,
    dataLoss: false
  },
  {
    id: 'fo-003',
    planId: 'drp-003',
    planName: 'Data Analytics DR',
    type: 'test',
    status: 'completed',
    startTime: '2025-01-10T14:00:00Z',
    endTime: '2025-01-10T14:45:00Z',
    duration: 45,
    initiatedBy: 'Data Team',
    reason: 'Quarterly DR validation',
    affectedServices: 3,
    dataLoss: false
  }
];

const REPLICATION_STATUS: ReplicationStatus[] = [
  {
    id: 'rep-001',
    source: 'PostgreSQL Primary (us-east-1)',
    destination: 'PostgreSQL Replica (us-west-2)',
    type: 'database',
    status: 'synced',
    lag: 0.5,
    lastSync: '2025-01-28T19:59:58Z',
    throughput: '125 MB/s',
    method: 'synchronous'
  },
  {
    id: 'rep-002',
    source: 'Redis Cluster (us-east-1)',
    destination: 'Redis Cluster (us-west-2)',
    type: 'database',
    status: 'synced',
    lag: 0.2,
    lastSync: '2025-01-28T19:59:59Z',
    throughput: '45 MB/s',
    method: 'asynchronous'
  },
  {
    id: 'rep-003',
    source: 'S3 Primary (us-east-1)',
    destination: 'S3 Replica (us-west-2)',
    type: 'storage',
    status: 'syncing',
    lag: 15,
    lastSync: '2025-01-28T19:59:45Z',
    throughput: '850 MB/s',
    method: 'asynchronous'
  },
  {
    id: 'rep-004',
    source: 'MongoDB Atlas (us-east)',
    destination: 'MongoDB Atlas (eu-west)',
    type: 'database',
    status: 'lagging',
    lag: 45,
    lastSync: '2025-01-28T19:59:15Z',
    throughput: '78 MB/s',
    method: 'asynchronous'
  }
];

const BACKUP_STATUS: BackupStatus[] = [
  {
    id: 'bkp-001',
    name: 'PostgreSQL Full Backup',
    type: 'full',
    status: 'completed',
    size: '2.4 TB',
    duration: 45,
    lastBackup: '2025-01-28T02:00:00Z',
    nextBackup: '2025-01-29T02:00:00Z',
    retention: '30 days',
    location: 'S3 Glacier'
  },
  {
    id: 'bkp-002',
    name: 'PostgreSQL Incremental',
    type: 'incremental',
    status: 'completed',
    size: '125 GB',
    duration: 8,
    lastBackup: '2025-01-28T18:00:00Z',
    nextBackup: '2025-01-28T22:00:00Z',
    retention: '7 days',
    location: 'S3 Standard'
  },
  {
    id: 'bkp-003',
    name: 'MongoDB Daily Snapshot',
    type: 'full',
    status: 'in_progress',
    size: '890 GB',
    duration: 0,
    lastBackup: '2025-01-27T03:00:00Z',
    nextBackup: '2025-01-29T03:00:00Z',
    retention: '14 days',
    location: 'Atlas Backup'
  },
  {
    id: 'bkp-004',
    name: 'Application Config Backup',
    type: 'full',
    status: 'completed',
    size: '45 MB',
    duration: 1,
    lastBackup: '2025-01-28T00:00:00Z',
    nextBackup: '2025-01-29T00:00:00Z',
    retention: '90 days',
    location: 'S3 Standard'
  }
];

const TYPE_CONFIG: Record<DRPlan['type'], { label: string; color: string; bg: string }> = {
  'active-active': { label: 'Active-Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  'active-passive': { label: 'Active-Passive', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  'pilot-light': { label: 'Pilot Light', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
  'warm-standby': { label: 'Warm Standby', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  'backup-restore': { label: 'Backup & Restore', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  testing: { label: 'Testing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  degraded: { label: 'Degraded', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  synced: { label: 'Synced', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  syncing: { label: 'Syncing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  lagging: { label: 'Lagging', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  scheduled: { label: 'Scheduled', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
};

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  critical: { color: '#ef4444' },
  high: { color: '#f59e0b' },
  medium: { color: '#3b82f6' },
  low: { color: '#64748b' }
};

export default function DisasterRecoveryPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'replication' | 'backups' | 'history'>('overview');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activePlans = DR_PLANS.filter(p => p.status === 'active').length;
  const totalServices = DR_PLANS.reduce((acc, p) => acc + p.services.length, 0);
  const avgRTO = Math.round(DR_PLANS.reduce((acc, p) => acc + p.rto, 0) / DR_PLANS.length);
  const syncedReplications = REPLICATION_STATUS.filter(r => r.status === 'synced').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="disaster-recovery">
      {/* Header */}
      <header className="dr__header">
        <div className="dr__title-section">
          <div className="dr__icon">
            <Shield size={28} />
          </div>
          <div>
            <h1>Disaster Recovery</h1>
            <p>Business continuity, failover management, and data protection</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <FileText size={16} />
            DR Runbook
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-primary">
            <PlayCircle size={16} />
            Initiate Failover
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="dr__stats">
        <div className="stat-card primary">
          <div className="stat-icon plans">
            <Shield size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activePlans}/{DR_PLANS.length}</span>
            <span className="stat-label">Active DR Plans</span>
          </div>
          <span className="stat-badge healthy">All Protected</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon services">
            <Server size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalServices}</span>
            <span className="stat-label">Protected Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rto">
            <Timer size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgRTO}m</span>
            <span className="stat-label">Avg RTO Target</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon replication">
            <RefreshCw size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{syncedReplications}/{REPLICATION_STATUS.length}</span>
            <span className="stat-label">Replications Synced</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon backups">
            <HardDrive size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{BACKUP_STATUS.filter(b => b.status === 'completed').length}</span>
            <span className="stat-label">Backups Current</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dr__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <Shield size={16} />
          DR Plans
          <span className="tab-badge">{DR_PLANS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'replication' ? 'active' : ''}`}
          onClick={() => setActiveTab('replication')}
        >
          <RefreshCw size={16} />
          Replication
        </button>
        <button 
          className={`tab-btn ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          <HardDrive size={16} />
          Backups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          Failover History
        </button>
      </div>

      {/* Content */}
      <div className="dr__content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Regional Status */}
            <div className="regional-status">
              <h3>Regional Infrastructure Status</h3>
              <div className="regions-grid">
                <div className="region-card primary">
                  <div className="region-header">
                    <div className="region-info">
                      <MapPin size={16} />
                      <span>US-East-1 (Primary)</span>
                    </div>
                    <span className="region-status healthy">Healthy</span>
                  </div>
                  <div className="region-metrics">
                    <div className="metric">
                      <span className="metric-label">Services</span>
                      <span className="metric-value">24 running</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Load</span>
                      <span className="metric-value">72%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Latency</span>
                      <span className="metric-value">45ms</span>
                    </div>
                  </div>
                </div>
                <div className="region-arrow">
                  <ArrowRight size={24} />
                  <span>Replicating</span>
                </div>
                <div className="region-card secondary">
                  <div className="region-header">
                    <div className="region-info">
                      <MapPin size={16} />
                      <span>US-West-2 (Secondary)</span>
                    </div>
                    <span className="region-status standby">Standby</span>
                  </div>
                  <div className="region-metrics">
                    <div className="metric">
                      <span className="metric-label">Services</span>
                      <span className="metric-value">24 ready</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Sync Lag</span>
                      <span className="metric-value">&lt;1s</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Test</span>
                      <span className="metric-value">13d ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RTO/RPO Summary */}
            <div className="rto-rpo-section">
              <h3>Recovery Objectives Summary</h3>
              <div className="objectives-grid">
                {DR_PLANS.map(plan => (
                  <div key={plan.id} className="objective-card">
                    <div className="objective-header">
                      <h4>{plan.name}</h4>
                      <span 
                        className="priority-dot"
                        style={{ background: PRIORITY_CONFIG[plan.priority].color }}
                      />
                    </div>
                    <div className="objective-metrics">
                      <div className="objective-item">
                        <span className="objective-label">RTO Target</span>
                        <span className="objective-value">{formatDuration(plan.rto)}</span>
                        {plan.actualRTO && (
                          <span className={`objective-actual ${plan.actualRTO <= plan.rto ? 'success' : 'warning'}`}>
                            Actual: {formatDuration(plan.actualRTO)}
                          </span>
                        )}
                      </div>
                      <div className="objective-item">
                        <span className="objective-label">RPO Target</span>
                        <span className="objective-value">{formatDuration(plan.rpo)}</span>
                        {plan.actualRPO !== undefined && (
                          <span className={`objective-actual ${plan.actualRPO <= plan.rpo ? 'success' : 'warning'}`}>
                            Actual: {formatDuration(plan.actualRPO)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="objective-footer">
                      <span 
                        className="type-badge"
                        style={{ 
                          background: TYPE_CONFIG[plan.type].bg,
                          color: TYPE_CONFIG[plan.type].color
                        }}
                      >
                        {TYPE_CONFIG[plan.type].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Failover Activity</h3>
              <div className="activity-list">
                {FAILOVER_HISTORY.slice(0, 3).map(record => (
                  <div key={record.id} className={`activity-item ${record.type}`}>
                    <div className="activity-icon">
                      {record.type === 'test' && <Target size={18} />}
                      {record.type === 'planned' && <Calendar size={18} />}
                      {record.type === 'unplanned' && <AlertTriangle size={18} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <h4>{record.planName}</h4>
                        <span 
                          className="activity-status"
                          style={{ 
                            background: STATUS_CONFIG[record.status]?.bg,
                            color: STATUS_CONFIG[record.status]?.color
                          }}
                        >
                          {STATUS_CONFIG[record.status]?.label}
                        </span>
                      </div>
                      <p>{record.reason}</p>
                      <div className="activity-meta">
                        <span><Clock size={12} /> {formatDate(record.startTime)}</span>
                        <span><Timer size={12} /> Duration: {record.duration}min</span>
                        <span><Users size={12} /> {record.initiatedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card">
                  <div className="action-icon test">
                    <Target size={24} />
                  </div>
                  <div className="action-content">
                    <h4>Run DR Test</h4>
                    <p>Execute scheduled failover test</p>
                  </div>
                </button>
                <button className="action-card">
                  <div className="action-icon failover">
                    <RotateCcw size={24} />
                  </div>
                  <div className="action-content">
                    <h4>Manual Failover</h4>
                    <p>Initiate controlled failover</p>
                  </div>
                </button>
                <button className="action-card">
                  <div className="action-icon backup">
                    <Upload size={24} />
                  </div>
                  <div className="action-content">
                    <h4>Force Backup</h4>
                    <p>Trigger immediate backup</p>
                  </div>
                </button>
                <button className="action-card">
                  <div className="action-icon verify">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="action-content">
                    <h4>Verify Replicas</h4>
                    <p>Check all replica health</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="plans-section">
            <div className="plans-list">
              {DR_PLANS.map(plan => {
                const isExpanded = expandedPlan === plan.id;
                const typeConfig = TYPE_CONFIG[plan.type];
                const statusConfig = STATUS_CONFIG[plan.status];

                return (
                  <div key={plan.id} className={`plan-card ${plan.priority}`}>
                    <div className="plan-header" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                      <div className="plan-priority-bar" style={{ background: PRIORITY_CONFIG[plan.priority].color }} />
                      
                      <div className="plan-main">
                        <div className="plan-title-row">
                          <h4>{plan.name}</h4>
                          <span 
                            className="status-badge"
                            style={{ background: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="plan-description">{plan.description}</p>
                        <div className="plan-meta">
                          <span>
                            <MapPin size={12} />
                            {plan.primaryRegion} → {plan.secondaryRegion}
                          </span>
                          <span>
                            <Server size={12} />
                            {plan.services.length} services
                          </span>
                          <span>
                            <Users size={12} />
                            {plan.owner}
                          </span>
                        </div>
                      </div>

                      <div className="plan-objectives">
                        <div className="objective">
                          <span className="objective-label">RTO</span>
                          <span className="objective-value">{formatDuration(plan.rto)}</span>
                        </div>
                        <div className="objective">
                          <span className="objective-label">RPO</span>
                          <span className="objective-value">{formatDuration(plan.rpo)}</span>
                        </div>
                      </div>

                      <div className="plan-badges">
                        <span 
                          className="type-badge"
                          style={{ background: typeConfig.bg, color: typeConfig.color }}
                        >
                          {typeConfig.label}
                        </span>
                      </div>

                      <button className="expand-btn">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="plan-details">
                        <div className="details-grid">
                          <div className="detail-section">
                            <h5>Protected Services</h5>
                            <div className="services-list">
                              {plan.services.map(service => (
                                <span key={service} className="service-tag">
                                  <Server size={12} />
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="detail-section">
                            <h5>Test Schedule</h5>
                            <div className="schedule-info">
                              <div className="schedule-item">
                                <span className="schedule-label">Last Tested</span>
                                <span className="schedule-value">{formatDate(plan.lastTested)}</span>
                              </div>
                              <div className="schedule-item">
                                <span className="schedule-label">Next Test</span>
                                <span className="schedule-value">{formatDate(plan.nextTest)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {plan.actualRTO && plan.actualRPO !== undefined && (
                          <div className="actual-metrics">
                            <h5>Last Test Results</h5>
                            <div className="metrics-row">
                              <div className={`metric-item ${plan.actualRTO <= plan.rto ? 'success' : 'warning'}`}>
                                <span className="metric-label">Actual RTO</span>
                                <span className="metric-value">{formatDuration(plan.actualRTO)}</span>
                                <span className="metric-target">Target: {formatDuration(plan.rto)}</span>
                              </div>
                              <div className={`metric-item ${plan.actualRPO <= plan.rpo ? 'success' : 'warning'}`}>
                                <span className="metric-label">Actual RPO</span>
                                <span className="metric-value">{formatDuration(plan.actualRPO)}</span>
                                <span className="metric-target">Target: {formatDuration(plan.rpo)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="plan-actions">
                          <button className="action-btn">
                            <Eye size={14} />
                            View Runbook
                          </button>
                          <button className="action-btn">
                            <Edit3 size={14} />
                            Edit Plan
                          </button>
                          <button className="action-btn">
                            <History size={14} />
                            View History
                          </button>
                          <button className="action-btn primary">
                            <Target size={14} />
                            Run Test
                          </button>
                          <button className="action-btn danger">
                            <RotateCcw size={14} />
                            Initiate Failover
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

        {activeTab === 'replication' && (
          <div className="replication-section">
            <div className="replication-header">
              <h3>Data Replication Status</h3>
              <button className="btn-outline">
                <RefreshCw size={16} />
                Refresh All
              </button>
            </div>

            <div className="replication-list">
              {REPLICATION_STATUS.map(rep => {
                const statusConfig = STATUS_CONFIG[rep.status];
                return (
                  <div key={rep.id} className={`replication-card ${rep.status}`}>
                    <div className="rep-icon">
                      {rep.type === 'database' && <Database size={20} />}
                      {rep.type === 'storage' && <HardDrive size={20} />}
                      {rep.type === 'application' && <Container size={20} />}
                    </div>
                    <div className="rep-main">
                      <div className="rep-title">
                        <h4>{rep.source}</h4>
                        <ArrowRight size={16} className="rep-arrow" />
                        <h4>{rep.destination}</h4>
                      </div>
                      <div className="rep-meta">
                        <span className="rep-method">{rep.method}</span>
                        <span>Last sync: {formatDate(rep.lastSync)}</span>
                        <span>Throughput: {rep.throughput}</span>
                      </div>
                    </div>
                    <div className="rep-status">
                      <span 
                        className="status-badge"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                      <span className={`lag-indicator ${rep.lag > 30 ? 'warning' : rep.lag > 60 ? 'critical' : ''}`}>
                        Lag: {rep.lag}s
                      </span>
                    </div>
                    <div className="rep-actions">
                      <button className="icon-btn" title="Force Sync">
                        <RefreshCw size={16} />
                      </button>
                      <button className="icon-btn" title="View Details">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="backups-section">
            <div className="backups-header">
              <h3>Backup Status</h3>
              <button className="btn-primary">
                <Plus size={16} />
                New Backup Job
              </button>
            </div>

            <div className="backups-table">
              <table>
                <thead>
                  <tr>
                    <th>Backup Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Duration</th>
                    <th>Last Backup</th>
                    <th>Next Backup</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {BACKUP_STATUS.map(backup => {
                    const statusConfig = STATUS_CONFIG[backup.status];
                    return (
                      <tr key={backup.id}>
                        <td className="backup-name">{backup.name}</td>
                        <td>
                          <span className={`type-pill ${backup.type}`}>{backup.type}</span>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ background: statusConfig.bg, color: statusConfig.color }}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td>{backup.size}</td>
                        <td>{backup.duration > 0 ? `${backup.duration}min` : '-'}</td>
                        <td>{formatDate(backup.lastBackup)}</td>
                        <td>{formatDate(backup.nextBackup)}</td>
                        <td>{backup.location}</td>
                        <td>
                          <div className="table-actions">
                            <button className="icon-btn" title="Run Now">
                              <PlayCircle size={14} />
                            </button>
                            <button className="icon-btn" title="Restore">
                              <Download size={14} />
                            </button>
                            <button className="icon-btn" title="Settings">
                              <Settings size={14} />
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
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="history-header">
              <h3>Failover History</h3>
              <div className="history-filters">
                <select>
                  <option>All Types</option>
                  <option>Planned</option>
                  <option>Unplanned</option>
                  <option>Test</option>
                </select>
                <select>
                  <option>All Plans</option>
                  {DR_PLANS.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="history-list">
              {FAILOVER_HISTORY.map(record => {
                const statusConfig = STATUS_CONFIG[record.status];
                return (
                  <div key={record.id} className={`history-card ${record.type}`}>
                    <div className="history-type-indicator">
                      {record.type === 'test' && <Target size={20} />}
                      {record.type === 'planned' && <Calendar size={20} />}
                      {record.type === 'unplanned' && <AlertTriangle size={20} />}
                    </div>
                    <div className="history-main">
                      <div className="history-title-row">
                        <h4>{record.planName}</h4>
                        <span className={`type-tag ${record.type}`}>{record.type}</span>
                        <span 
                          className="status-badge"
                          style={{ background: statusConfig.bg, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="history-reason">{record.reason}</p>
                      <div className="history-meta">
                        <span><Clock size={12} /> {formatDate(record.startTime)}</span>
                        {record.duration && <span><Timer size={12} /> {record.duration}min</span>}
                        <span><Users size={12} /> {record.initiatedBy}</span>
                        <span><Server size={12} /> {record.affectedServices} services</span>
                        <span className={record.dataLoss ? 'data-loss' : 'no-data-loss'}>
                          {record.dataLoss ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                          {record.dataLoss ? 'Data Loss' : 'No Data Loss'}
                        </span>
                      </div>
                    </div>
                    <div className="history-actions">
                      <button className="action-btn">
                        <FileText size={14} />
                        View Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
