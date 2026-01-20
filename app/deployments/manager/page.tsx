'use client';

import React, { useState } from 'react';
import { 
  Rocket, 
  GitBranch, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Server,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreVertical,
  Plus,
  Filter,
  Loader2,
  Box,
  Layers,
  Activity,
  Terminal,
  ExternalLink
} from 'lucide-react';
import './deployment-manager.css';

interface Deployment {
  id: string;
  name: string;
  version: string;
  environment: 'production' | 'staging' | 'development' | 'preview';
  status: 'success' | 'failed' | 'in-progress' | 'pending' | 'rolled-back';
  branch: string;
  commit: string;
  commitMessage: string;
  author: {
    name: string;
    avatar: string;
  };
  startedAt: string;
  completedAt?: string;
  duration?: string;
  url?: string;
  changes: {
    additions: number;
    deletions: number;
    files: number;
  };
}

interface Pipeline {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  stages: {
    name: string;
    status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
    duration?: string;
  }[];
}

const DEPLOYMENTS: Deployment[] = [
  {
    id: 'dep-001',
    name: 'CUBE Elite Frontend',
    version: 'v2.4.0',
    environment: 'production',
    status: 'success',
    branch: 'main',
    commit: 'a1b2c3d',
    commitMessage: 'feat: Add AI-powered workflow builder',
    author: { name: 'Sarah Chen', avatar: 'SC' },
    startedAt: '2024-01-27T10:30:00Z',
    completedAt: '2024-01-27T10:35:22Z',
    duration: '5m 22s',
    url: 'https://cube-elite.com',
    changes: { additions: 1250, deletions: 340, files: 28 }
  },
  {
    id: 'dep-002',
    name: 'API Gateway v3',
    version: 'v3.1.2',
    environment: 'staging',
    status: 'in-progress',
    branch: 'develop',
    commit: 'e4f5g6h',
    commitMessage: 'fix: Rate limiting improvements',
    author: { name: 'Mike Johnson', avatar: 'MJ' },
    startedAt: '2024-01-27T11:15:00Z',
    changes: { additions: 89, deletions: 45, files: 6 }
  },
  {
    id: 'dep-003',
    name: 'Authentication Service',
    version: 'v1.8.0',
    environment: 'production',
    status: 'failed',
    branch: 'main',
    commit: 'i7j8k9l',
    commitMessage: 'feat: OAuth2 integration',
    author: { name: 'Alex Rodriguez', avatar: 'AR' },
    startedAt: '2024-01-27T09:00:00Z',
    completedAt: '2024-01-27T09:08:45Z',
    duration: '8m 45s',
    changes: { additions: 560, deletions: 120, files: 15 }
  },
  {
    id: 'dep-004',
    name: 'Worker Service',
    version: 'v2.0.1',
    environment: 'development',
    status: 'pending',
    branch: 'feature/queue-optimization',
    commit: 'm1n2o3p',
    commitMessage: 'perf: Optimize queue processing',
    author: { name: 'Emma Wilson', avatar: 'EW' },
    startedAt: '2024-01-27T11:30:00Z',
    changes: { additions: 234, deletions: 78, files: 8 }
  },
  {
    id: 'dep-005',
    name: 'Analytics Dashboard',
    version: 'v1.2.3',
    environment: 'preview',
    status: 'success',
    branch: 'feature/new-charts',
    commit: 'q4r5s6t',
    commitMessage: 'feat: Add real-time charts',
    author: { name: 'David Park', avatar: 'DP' },
    startedAt: '2024-01-27T10:00:00Z',
    completedAt: '2024-01-27T10:04:12Z',
    duration: '4m 12s',
    url: 'https://preview-analytics.cube-elite.com',
    changes: { additions: 890, deletions: 210, files: 18 }
  },
  {
    id: 'dep-006',
    name: 'Database Migration',
    version: 'v5.0.0',
    environment: 'staging',
    status: 'rolled-back',
    branch: 'main',
    commit: 'u7v8w9x',
    commitMessage: 'chore: Schema migration for v5',
    author: { name: 'Lisa Kim', avatar: 'LK' },
    startedAt: '2024-01-26T23:00:00Z',
    completedAt: '2024-01-26T23:25:00Z',
    duration: '25m 00s',
    changes: { additions: 45, deletions: 12, files: 5 }
  }
];

const PIPELINES: Pipeline[] = [
  {
    id: 'pipe-001',
    name: 'Production Deploy',
    status: 'running',
    stages: [
      { name: 'Build', status: 'success', duration: '2m 15s' },
      { name: 'Test', status: 'success', duration: '4m 32s' },
      { name: 'Security Scan', status: 'running' },
      { name: 'Deploy', status: 'pending' },
      { name: 'Verify', status: 'pending' }
    ]
  },
  {
    id: 'pipe-002',
    name: 'Staging Deploy',
    status: 'success',
    stages: [
      { name: 'Build', status: 'success', duration: '1m 45s' },
      { name: 'Test', status: 'success', duration: '3m 20s' },
      { name: 'Deploy', status: 'success', duration: '45s' },
      { name: 'Integration', status: 'success', duration: '2m 10s' }
    ]
  },
  {
    id: 'pipe-003',
    name: 'Preview Build',
    status: 'failed',
    stages: [
      { name: 'Build', status: 'success', duration: '1m 30s' },
      { name: 'Test', status: 'failed', duration: '5m 12s' },
      { name: 'Deploy', status: 'skipped' }
    ]
  }
];

const STATUS_CONFIG = {
  'success': { icon: CheckCircle2, color: 'success', label: 'Success' },
  'failed': { icon: XCircle, color: 'danger', label: 'Failed' },
  'in-progress': { icon: Loader2, color: 'info', label: 'In Progress' },
  'pending': { icon: Clock, color: 'warning', label: 'Pending' },
  'rolled-back': { icon: RotateCcw, color: 'muted', label: 'Rolled Back' },
  'running': { icon: Loader2, color: 'info', label: 'Running' },
  'skipped': { icon: AlertTriangle, color: 'muted', label: 'Skipped' }
};

const ENV_CONFIG = {
  'production': { color: 'production', label: 'Production' },
  'staging': { color: 'staging', label: 'Staging' },
  'development': { color: 'development', label: 'Development' },
  'preview': { color: 'preview', label: 'Preview' }
};

export default function DeploymentManagerPage() {
  const [activeTab, setActiveTab] = useState<'deployments' | 'pipelines' | 'rollbacks'>('deployments');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');

  const filteredDeployments = selectedEnv === 'all' 
    ? DEPLOYMENTS 
    : DEPLOYMENTS.filter(d => d.environment === selectedEnv);

  const stats = {
    total: DEPLOYMENTS.length,
    success: DEPLOYMENTS.filter(d => d.status === 'success').length,
    failed: DEPLOYMENTS.filter(d => d.status === 'failed').length,
    inProgress: DEPLOYMENTS.filter(d => d.status === 'in-progress' || d.status === 'pending').length
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
    <div className="deployment-manager">
      <header className="deployment-manager__header">
        <div className="deployment-manager__title-section">
          <div className="deployment-manager__icon">
            <Rocket size={28} />
          </div>
          <div>
            <h1>Deployment Manager</h1>
            <p>Monitor and manage deployments across all environments</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Deployment
          </button>
        </div>
      </header>

      <div className="deployment-manager__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Deployments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.success}</span>
            <span className="stat-label">Successful</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
      </div>

      <div className="deployment-manager__tabs">
        <button 
          className={`tab-btn ${activeTab === 'deployments' ? 'active' : ''}`}
          onClick={() => setActiveTab('deployments')}
        >
          <Box size={16} />
          Deployments
          <span className="tab-badge">{DEPLOYMENTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          <Activity size={16} />
          Pipelines
          <span className="tab-badge">{PIPELINES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rollbacks' ? 'active' : ''}`}
          onClick={() => setActiveTab('rollbacks')}
        >
          <RotateCcw size={16} />
          Rollback History
        </button>
      </div>

      {activeTab === 'deployments' && (
        <>
          <div className="deployment-manager__filters">
            <div className="env-filter">
              {['all', 'production', 'staging', 'development', 'preview'].map(env => (
                <button
                  key={env}
                  className={`env-btn ${selectedEnv === env ? 'active' : ''} ${env !== 'all' ? env : ''}`}
                  onClick={() => setSelectedEnv(env)}
                >
                  {env === 'all' ? 'All Environments' : ENV_CONFIG[env as keyof typeof ENV_CONFIG].label}
                </button>
              ))}
            </div>
            <button className="btn-outline">
              <Filter size={16} />
              More Filters
            </button>
          </div>

          <div className="deployments-list">
            {filteredDeployments.map(deployment => {
              const StatusIcon = STATUS_CONFIG[deployment.status].icon;
              const statusColor = STATUS_CONFIG[deployment.status].color;
              const envConfig = ENV_CONFIG[deployment.environment];

              return (
                <div key={deployment.id} className="deployment-card">
                  <div className="deployment-status">
                    <div className={`status-icon ${statusColor}`}>
                      <StatusIcon size={18} className={deployment.status === 'in-progress' ? 'spin' : ''} />
                    </div>
                  </div>

                  <div className="deployment-main">
                    <div className="deployment-header">
                      <div className="deployment-info">
                        <h3>{deployment.name}</h3>
                        <div className="deployment-badges">
                          <span className={`env-badge ${envConfig.color}`}>
                            {envConfig.label}
                          </span>
                          <span className="version-badge">{deployment.version}</span>
                        </div>
                      </div>
                      <div className="deployment-actions">
                        {deployment.url && (
                          <a href={deployment.url} target="_blank" rel="noopener noreferrer" className="action-btn">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button className="action-btn">
                          <Eye size={16} />
                        </button>
                        <button className="action-btn">
                          <Terminal size={16} />
                        </button>
                        <button className="action-btn">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="deployment-commit">
                      <GitBranch size={14} />
                      <span className="branch-name">{deployment.branch}</span>
                      <span className="commit-hash">{deployment.commit}</span>
                      <span className="commit-message">{deployment.commitMessage}</span>
                    </div>

                    <div className="deployment-meta">
                      <div className="author">
                        <div className="avatar">{deployment.author.avatar}</div>
                        <span>{deployment.author.name}</span>
                      </div>
                      <div className="timing">
                        <Clock size={14} />
                        <span>{formatDate(deployment.startedAt)}</span>
                        {deployment.duration && (
                          <span className="duration">• {deployment.duration}</span>
                        )}
                      </div>
                      <div className="changes">
                        <span className="additions">
                          <ArrowUpRight size={12} />
                          +{deployment.changes.additions}
                        </span>
                        <span className="deletions">
                          <ArrowDownRight size={12} />
                          -{deployment.changes.deletions}
                        </span>
                        <span className="files">{deployment.changes.files} files</span>
                      </div>
                    </div>
                  </div>

                  <div className="deployment-quick-actions">
                    {deployment.status === 'success' && (
                      <button className="rollback-btn">
                        <RotateCcw size={14} />
                        Rollback
                      </button>
                    )}
                    {deployment.status === 'failed' && (
                      <button className="retry-btn">
                        <RefreshCw size={14} />
                        Retry
                      </button>
                    )}
                    {deployment.status === 'in-progress' && (
                      <button className="cancel-btn">
                        <Pause size={14} />
                        Cancel
                      </button>
                    )}
                    {deployment.status === 'pending' && (
                      <button className="start-btn">
                        <Play size={14} />
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'pipelines' && (
        <div className="pipelines-section">
          <div className="pipelines-list">
            {PIPELINES.map(pipeline => {
              const PipelineIcon = STATUS_CONFIG[pipeline.status].icon;
              const pipelineColor = STATUS_CONFIG[pipeline.status].color;

              return (
                <div key={pipeline.id} className="pipeline-card">
                  <div className="pipeline-header">
                    <div className="pipeline-info">
                      <div className={`pipeline-status-icon ${pipelineColor}`}>
                        <PipelineIcon size={18} className={pipeline.status === 'running' ? 'spin' : ''} />
                      </div>
                      <div>
                        <h3>{pipeline.name}</h3>
                        <span className={`status-label ${pipelineColor}`}>
                          {STATUS_CONFIG[pipeline.status].label}
                        </span>
                      </div>
                    </div>
                    <button className="action-btn">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="pipeline-stages">
                    {pipeline.stages.map((stage, index) => {
                      const StageIcon = STATUS_CONFIG[stage.status].icon;
                      const stageColor = STATUS_CONFIG[stage.status].color;

                      return (
                        <React.Fragment key={stage.name}>
                          <div className={`stage ${stageColor}`}>
                            <div className={`stage-icon ${stageColor}`}>
                              <StageIcon size={14} className={stage.status === 'running' ? 'spin' : ''} />
                            </div>
                            <span className="stage-name">{stage.name}</span>
                            {stage.duration && (
                              <span className="stage-duration">{stage.duration}</span>
                            )}
                          </div>
                          {index < pipeline.stages.length - 1 && (
                            <div className={`stage-connector ${
                              stage.status === 'success' ? 'success' : 
                              stage.status === 'running' ? 'running' : ''
                            }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'rollbacks' && (
        <div className="rollbacks-section">
          <div className="empty-state">
            <RotateCcw size={48} />
            <h3>No Recent Rollbacks</h3>
            <p>Rollback history will appear here when deployments are reverted</p>
          </div>
        </div>
      )}
    </div>
  );
}
