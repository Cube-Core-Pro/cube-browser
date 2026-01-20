'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  Trash2,
  Eye,
  ExternalLink,
  Terminal,
  FileText,
  Box,
  Zap,
  Activity,
  Shield,
  Lock,
  Unlock,
  Copy,
  MoreHorizontal,
  Timer,
  Package,
  Cloud,
  Server,
  Layers,
  ArrowRight,
  RotateCcw,
  Flag,
  Tag,
  Users,
  Calendar
} from 'lucide-react';
import './ci-cd-pipelines.css';

interface Pipeline {
  id: string;
  name: string;
  repository: string;
  branch: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'cancelled' | 'skipped';
  trigger: 'push' | 'pull_request' | 'schedule' | 'manual' | 'webhook';
  stages: Stage[];
  duration: number;
  startedAt: string;
  finishedAt?: string;
  triggeredBy: string;
  commit: {
    sha: string;
    message: string;
    author: string;
  };
}

interface Stage {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped';
  duration?: number;
  jobs: Job[];
}

interface Job {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped';
  duration?: number;
  runner?: string;
}

interface Environment {
  id: string;
  name: string;
  type: 'production' | 'staging' | 'development' | 'preview';
  status: 'active' | 'deploying' | 'failed' | 'inactive';
  lastDeployment: string;
  url: string;
  branch: string;
  protected: boolean;
  approvers?: string[];
}

interface PipelineConfig {
  id: string;
  name: string;
  repository: string;
  triggers: string[];
  stages: string[];
  enabled: boolean;
  lastRun: string;
  runCount: number;
  successRate: number;
}

interface Artifact {
  id: string;
  pipelineId: string;
  name: string;
  type: 'docker' | 'npm' | 'binary' | 'archive';
  size: number;
  created: string;
  downloadCount: number;
}

const PIPELINES: Pipeline[] = [
  {
    id: 'run-1',
    name: 'cube-frontend-deploy',
    repository: 'cube-elite/frontend',
    branch: 'main',
    status: 'running',
    trigger: 'push',
    stages: [
      { id: 's1', name: 'Install', status: 'success', duration: 45, jobs: [{ id: 'j1', name: 'npm install', status: 'success', duration: 45, runner: 'ubuntu-latest' }] },
      { id: 's2', name: 'Lint', status: 'success', duration: 23, jobs: [{ id: 'j2', name: 'eslint', status: 'success', duration: 23, runner: 'ubuntu-latest' }] },
      { id: 's3', name: 'Test', status: 'success', duration: 156, jobs: [{ id: 'j3', name: 'unit tests', status: 'success', duration: 98, runner: 'ubuntu-latest' }, { id: 'j4', name: 'e2e tests', status: 'success', duration: 58, runner: 'ubuntu-latest' }] },
      { id: 's4', name: 'Build', status: 'running', duration: 0, jobs: [{ id: 'j5', name: 'vite build', status: 'running', runner: 'ubuntu-latest' }] },
      { id: 's5', name: 'Deploy', status: 'pending', jobs: [{ id: 'j6', name: 'deploy to production', status: 'pending' }] }
    ],
    duration: 224,
    startedAt: '2025-01-28T14:30:00Z',
    triggeredBy: 'john.dev',
    commit: { sha: 'a7b3c9d', message: 'feat: Add new AI chat component', author: 'John Developer' }
  },
  {
    id: 'run-2',
    name: 'cube-backend-deploy',
    repository: 'cube-elite/backend',
    branch: 'main',
    status: 'success',
    trigger: 'push',
    stages: [
      { id: 's1', name: 'Build', status: 'success', duration: 78, jobs: [{ id: 'j1', name: 'cargo build', status: 'success', duration: 78, runner: 'ubuntu-latest' }] },
      { id: 's2', name: 'Test', status: 'success', duration: 234, jobs: [{ id: 'j2', name: 'cargo test', status: 'success', duration: 234, runner: 'ubuntu-latest' }] },
      { id: 's3', name: 'Security', status: 'success', duration: 45, jobs: [{ id: 'j3', name: 'cargo audit', status: 'success', duration: 45, runner: 'ubuntu-latest' }] },
      { id: 's4', name: 'Deploy', status: 'success', duration: 89, jobs: [{ id: 'j4', name: 'deploy to k8s', status: 'success', duration: 89, runner: 'self-hosted' }] }
    ],
    duration: 446,
    startedAt: '2025-01-28T14:00:00Z',
    finishedAt: '2025-01-28T14:07:26Z',
    triggeredBy: 'jane.eng',
    commit: { sha: 'b8c4d0e', message: 'fix: Optimize database queries for better performance', author: 'Jane Engineer' }
  },
  {
    id: 'run-3',
    name: 'cube-ai-service-deploy',
    repository: 'cube-elite/ai-service',
    branch: 'feature/gpt-5-integration',
    status: 'failed',
    trigger: 'pull_request',
    stages: [
      { id: 's1', name: 'Build', status: 'success', duration: 156, jobs: [{ id: 'j1', name: 'docker build', status: 'success', duration: 156, runner: 'ubuntu-latest' }] },
      { id: 's2', name: 'Test', status: 'failed', duration: 89, jobs: [{ id: 'j2', name: 'pytest', status: 'failed', duration: 89, runner: 'ubuntu-latest' }] },
      { id: 's3', name: 'Deploy', status: 'skipped', jobs: [{ id: 'j3', name: 'deploy to staging', status: 'skipped' }] }
    ],
    duration: 245,
    startedAt: '2025-01-28T13:45:00Z',
    finishedAt: '2025-01-28T13:49:05Z',
    triggeredBy: 'alex.ml',
    commit: { sha: 'c9d5e1f', message: 'feat: Integrate GPT-5.2 API for enhanced reasoning', author: 'Alex ML' }
  },
  {
    id: 'run-4',
    name: 'cube-infra-deploy',
    repository: 'cube-elite/infrastructure',
    branch: 'main',
    status: 'success',
    trigger: 'manual',
    stages: [
      { id: 's1', name: 'Validate', status: 'success', duration: 34, jobs: [{ id: 'j1', name: 'terraform validate', status: 'success', duration: 34, runner: 'self-hosted' }] },
      { id: 's2', name: 'Plan', status: 'success', duration: 67, jobs: [{ id: 'j2', name: 'terraform plan', status: 'success', duration: 67, runner: 'self-hosted' }] },
      { id: 's3', name: 'Apply', status: 'success', duration: 245, jobs: [{ id: 'j3', name: 'terraform apply', status: 'success', duration: 245, runner: 'self-hosted' }] }
    ],
    duration: 346,
    startedAt: '2025-01-28T12:00:00Z',
    finishedAt: '2025-01-28T12:05:46Z',
    triggeredBy: 'ops.team',
    commit: { sha: 'd0e6f2g', message: 'chore: Scale production cluster to 12 nodes', author: 'Ops Team' }
  },
  {
    id: 'run-5',
    name: 'cube-worker-deploy',
    repository: 'cube-elite/worker',
    branch: 'main',
    status: 'pending',
    trigger: 'schedule',
    stages: [
      { id: 's1', name: 'Build', status: 'pending', jobs: [{ id: 'j1', name: 'docker build', status: 'pending' }] },
      { id: 's2', name: 'Test', status: 'pending', jobs: [{ id: 'j2', name: 'integration tests', status: 'pending' }] },
      { id: 's3', name: 'Deploy', status: 'pending', jobs: [{ id: 'j3', name: 'rolling update', status: 'pending' }] }
    ],
    duration: 0,
    startedAt: '2025-01-28T15:00:00Z',
    triggeredBy: 'scheduler',
    commit: { sha: 'e1f7g3h', message: 'Scheduled nightly build', author: 'CI Bot' }
  }
];

const ENVIRONMENTS: Environment[] = [
  { id: 'env-1', name: 'Production', type: 'production', status: 'active', lastDeployment: '2025-01-28T14:07:26Z', url: 'https://cube.io', branch: 'main', protected: true, approvers: ['lead.dev', 'ops.lead'] },
  { id: 'env-2', name: 'Staging', type: 'staging', status: 'active', lastDeployment: '2025-01-28T13:30:00Z', url: 'https://staging.cube.io', branch: 'develop', protected: true, approvers: ['dev.lead'] },
  { id: 'env-3', name: 'Development', type: 'development', status: 'active', lastDeployment: '2025-01-28T14:25:00Z', url: 'https://dev.cube.io', branch: 'develop', protected: false },
  { id: 'env-4', name: 'Preview PR-432', type: 'preview', status: 'deploying', lastDeployment: '2025-01-28T14:30:00Z', url: 'https://pr-432.preview.cube.io', branch: 'feature/gpt-5-integration', protected: false },
  { id: 'env-5', name: 'QA', type: 'staging', status: 'active', lastDeployment: '2025-01-27T16:00:00Z', url: 'https://qa.cube.io', branch: 'release/v2.9', protected: true, approvers: ['qa.lead'] }
];

const PIPELINE_CONFIGS: PipelineConfig[] = [
  { id: 'cfg-1', name: 'cube-frontend-deploy', repository: 'cube-elite/frontend', triggers: ['push', 'pull_request'], stages: ['Install', 'Lint', 'Test', 'Build', 'Deploy'], enabled: true, lastRun: '2025-01-28T14:30:00Z', runCount: 1247, successRate: 94.5 },
  { id: 'cfg-2', name: 'cube-backend-deploy', repository: 'cube-elite/backend', triggers: ['push', 'pull_request'], stages: ['Build', 'Test', 'Security', 'Deploy'], enabled: true, lastRun: '2025-01-28T14:00:00Z', runCount: 2156, successRate: 97.2 },
  { id: 'cfg-3', name: 'cube-ai-service-deploy', repository: 'cube-elite/ai-service', triggers: ['push', 'pull_request', 'manual'], stages: ['Build', 'Test', 'Deploy'], enabled: true, lastRun: '2025-01-28T13:45:00Z', runCount: 892, successRate: 89.8 },
  { id: 'cfg-4', name: 'cube-infra-deploy', repository: 'cube-elite/infrastructure', triggers: ['manual'], stages: ['Validate', 'Plan', 'Apply'], enabled: true, lastRun: '2025-01-28T12:00:00Z', runCount: 456, successRate: 99.1 },
  { id: 'cfg-5', name: 'cube-worker-deploy', repository: 'cube-elite/worker', triggers: ['push', 'schedule'], stages: ['Build', 'Test', 'Deploy'], enabled: true, lastRun: '2025-01-27T03:00:00Z', runCount: 1034, successRate: 96.8 }
];

const ARTIFACTS: Artifact[] = [
  { id: 'art-1', pipelineId: 'run-2', name: 'cube-backend:v2.8.3', type: 'docker', size: 245000000, created: '2025-01-28T14:07:26Z', downloadCount: 156 },
  { id: 'art-2', pipelineId: 'run-2', name: 'backend-coverage-report', type: 'archive', size: 2400000, created: '2025-01-28T14:05:00Z', downloadCount: 12 },
  { id: 'art-3', pipelineId: 'run-4', name: 'terraform-plan.json', type: 'archive', size: 450000, created: '2025-01-28T12:03:00Z', downloadCount: 5 },
  { id: 'art-4', pipelineId: 'run-1', name: 'cube-frontend:v2.8.4-alpha', type: 'docker', size: 180000000, created: '2025-01-28T14:34:00Z', downloadCount: 3 }
];

const PIPELINE_STATUS_CONFIG = {
  running: { color: 'info', icon: RefreshCw, label: 'Running' },
  success: { color: 'success', icon: CheckCircle, label: 'Success' },
  failed: { color: 'danger', icon: XCircle, label: 'Failed' },
  pending: { color: 'warning', icon: Clock, label: 'Pending' },
  cancelled: { color: 'muted', icon: Square, label: 'Cancelled' },
  skipped: { color: 'muted', icon: ArrowRight, label: 'Skipped' }
};

const TRIGGER_CONFIG = {
  push: { icon: GitCommit, label: 'Push' },
  pull_request: { icon: GitPullRequest, label: 'PR' },
  schedule: { icon: Clock, label: 'Schedule' },
  manual: { icon: Play, label: 'Manual' },
  webhook: { icon: Zap, label: 'Webhook' }
};

const ENV_TYPE_CONFIG = {
  production: { color: 'success', icon: Shield },
  staging: { color: 'warning', icon: Layers },
  development: { color: 'info', icon: GitBranch },
  preview: { color: 'purple', icon: Eye }
};

const ENV_STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  deploying: { color: 'info', label: 'Deploying' },
  failed: { color: 'danger', label: 'Failed' },
  inactive: { color: 'muted', label: 'Inactive' }
};

export default function CICDPipelinesPage() {
  const [activeTab, setActiveTab] = useState<'runs' | 'pipelines' | 'environments' | 'artifacts'>('runs');
  const [expandedRun, setExpandedRun] = useState<string | null>('run-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

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

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const totalRuns = PIPELINES.length;
  const runningRuns = PIPELINES.filter(p => p.status === 'running').length;
  const successRuns = PIPELINES.filter(p => p.status === 'success').length;
  const failedRuns = PIPELINES.filter(p => p.status === 'failed').length;

  return (
    <div className="cicd-pipelines">
      <div className="cicd-pipelines__header">
        <div className="cicd-pipelines__title-section">
          <div className="cicd-pipelines__icon">
            <GitBranch size={28} />
          </div>
          <div>
            <h1>CI/CD Pipelines</h1>
            <p>Continuous integration and deployment automation</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Pipeline
          </button>
        </div>
      </div>

      <div className="cicd-pipelines__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Activity size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalRuns}</span>
            <span className="stat-label">Recent Runs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon running">
            <RefreshCw size={22} className="spinning" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningRuns}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{successRuns}</span>
            <span className="stat-label">Successful</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{failedRuns}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      <div className="cicd-pipelines__tabs">
        <button 
          className={`tab-btn ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => setActiveTab('runs')}
        >
          <Activity size={16} />
          Pipeline Runs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          <GitBranch size={16} />
          Pipelines
        </button>
        <button 
          className={`tab-btn ${activeTab === 'environments' ? 'active' : ''}`}
          onClick={() => setActiveTab('environments')}
        >
          <Cloud size={16} />
          Environments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'artifacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('artifacts')}
        >
          <Package size={16} />
          Artifacts
        </button>
      </div>

      {activeTab === 'runs' && (
        <div className="runs-section">
          <div className="section-header">
            <h3>Recent Pipeline Runs</h3>
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search runs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="runs-list">
            {PIPELINES.filter(p => 
              (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
              (statusFilter === 'all' || p.status === statusFilter)
            ).map(pipeline => {
              const StatusConfig = PIPELINE_STATUS_CONFIG[pipeline.status];
              const StatusIcon = StatusConfig.icon;
              const TriggerConfig = TRIGGER_CONFIG[pipeline.trigger];
              const TriggerIcon = TriggerConfig.icon;
              
              return (
                <div 
                  key={pipeline.id}
                  className={`run-card ${pipeline.status}`}
                >
                  <div className="run-main">
                    <div className={`run-status-icon ${StatusConfig.color}`}>
                      <StatusIcon size={20} className={pipeline.status === 'running' ? 'spinning' : ''} />
                    </div>
                    <div className="run-info">
                      <div className="run-header">
                        <h4>{pipeline.name}</h4>
                        <span className={`status-badge ${StatusConfig.color}`}>
                          {StatusConfig.label}
                        </span>
                        <span className="trigger-badge">
                          <TriggerIcon size={12} />
                          {TriggerConfig.label}
                        </span>
                      </div>
                      <div className="run-meta">
                        <span><GitBranch size={12} /> {pipeline.branch}</span>
                        <span><GitCommit size={12} /> {pipeline.commit.sha}</span>
                        <span><Users size={12} /> {pipeline.triggeredBy}</span>
                        <span><Timer size={12} /> {formatDuration(pipeline.duration)}</span>
                      </div>
                    </div>
                    <div className="stages-preview">
                      {pipeline.stages.map(stage => {
                        const StageStatus = PIPELINE_STATUS_CONFIG[stage.status];
                        return (
                          <div 
                            key={stage.id} 
                            className={`stage-dot ${StageStatus.color}`}
                            title={`${stage.name}: ${StageStatus.label}`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="run-timing">
                      <span className="started">{formatDate(pipeline.startedAt)}</span>
                    </div>
                    <div className="run-actions">
                      <button className="action-btn" title="View Logs">
                        <Terminal size={14} />
                      </button>
                      <button className="action-btn" title="Restart">
                        <RotateCcw size={14} />
                      </button>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedRun(expandedRun === pipeline.id ? null : pipeline.id)}
                      >
                        {expandedRun === pipeline.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedRun === pipeline.id && (
                    <div className="run-expanded">
                      <div className="commit-info">
                        <GitCommit size={16} />
                        <div className="commit-details">
                          <span className="commit-message">{pipeline.commit.message}</span>
                          <span className="commit-author">by {pipeline.commit.author}</span>
                        </div>
                      </div>
                      <div className="stages-detail">
                        {pipeline.stages.map((stage, idx) => {
                          const StageConfig = PIPELINE_STATUS_CONFIG[stage.status];
                          const StageIcon = StageConfig.icon;
                          
                          return (
                            <React.Fragment key={stage.id}>
                              <div className={`stage-card ${stage.status}`}>
                                <div className="stage-header">
                                  <span className={`stage-icon ${StageConfig.color}`}>
                                    <StageIcon size={14} className={stage.status === 'running' ? 'spinning' : ''} />
                                  </span>
                                  <span className="stage-name">{stage.name}</span>
                                  <span className="stage-duration">
                                    {stage.duration ? formatDuration(stage.duration) : '-'}
                                  </span>
                                </div>
                                <div className="stage-jobs">
                                  {stage.jobs.map(job => {
                                    const JobConfig = PIPELINE_STATUS_CONFIG[job.status];
                                    const JobIcon = JobConfig.icon;
                                    
                                    return (
                                      <div key={job.id} className={`job-item ${job.status}`}>
                                        <JobIcon size={12} className={job.status === 'running' ? 'spinning' : ''} />
                                        <span className="job-name">{job.name}</span>
                                        {job.runner && <span className="job-runner">{job.runner}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              {idx < pipeline.stages.length - 1 && (
                                <div className="stage-connector">
                                  <ArrowRight size={16} />
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm">
                          <Terminal size={14} />
                          View Full Logs
                        </button>
                        <button className="btn-sm">
                          <Package size={14} />
                          View Artifacts
                        </button>
                        <button className="btn-sm">
                          <Eye size={14} />
                          View Changes
                        </button>
                        <button className="btn-sm danger">
                          <Square size={14} />
                          Cancel
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

      {activeTab === 'pipelines' && (
        <div className="pipelines-section">
          <div className="section-header">
            <h3>Pipeline Configurations</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Pipeline
            </button>
          </div>

          <div className="configs-grid">
            {PIPELINE_CONFIGS.map(config => (
              <div key={config.id} className={`config-card ${!config.enabled ? 'disabled' : ''}`}>
                <div className="config-header">
                  <div className="config-icon">
                    <GitBranch size={20} />
                  </div>
                  <div className="config-title">
                    <h4>{config.name}</h4>
                    <span className="config-repo">{config.repository}</span>
                  </div>
                  <div className="config-toggle">
                    <label className="switch">
                      <input type="checkbox" checked={config.enabled} readOnly />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <div className="config-triggers">
                  {config.triggers.map(trigger => {
                    const TriggerCfg = TRIGGER_CONFIG[trigger as keyof typeof TRIGGER_CONFIG];
                    const Icon = TriggerCfg.icon;
                    return (
                      <span key={trigger} className="trigger-chip">
                        <Icon size={12} />
                        {TriggerCfg.label}
                      </span>
                    );
                  })}
                </div>
                <div className="config-stages">
                  {config.stages.map((stage, idx) => (
                    <React.Fragment key={stage}>
                      <span className="stage-chip">{stage}</span>
                      {idx < config.stages.length - 1 && <ArrowRight size={12} className="stage-arrow" />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="config-stats">
                  <div className="config-stat">
                    <span className="stat-value">{config.runCount}</span>
                    <span className="stat-label">Total Runs</span>
                  </div>
                  <div className="config-stat">
                    <span className={`stat-value ${config.successRate >= 95 ? 'success' : config.successRate >= 80 ? 'warning' : 'danger'}`}>
                      {config.successRate}%
                    </span>
                    <span className="stat-label">Success Rate</span>
                  </div>
                </div>
                <div className="config-footer">
                  <span className="last-run">Last run: {formatDate(config.lastRun)}</span>
                  <div className="config-actions">
                    <button className="action-btn-sm" title="Run Now">
                      <Play size={12} />
                    </button>
                    <button className="action-btn-sm" title="Settings">
                      <Settings size={12} />
                    </button>
                    <button className="action-btn-sm" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'environments' && (
        <div className="environments-section">
          <div className="section-header">
            <h3>Deployment Environments</h3>
            <button className="btn-primary">
              <Plus size={16} />
              New Environment
            </button>
          </div>

          <div className="environments-grid">
            {ENVIRONMENTS.map(env => {
              const TypeConfig = ENV_TYPE_CONFIG[env.type];
              const TypeIcon = TypeConfig.icon;
              const StatusConfig = ENV_STATUS_CONFIG[env.status];
              
              return (
                <div key={env.id} className={`env-card ${env.type}`}>
                  <div className="env-header">
                    <div className={`env-type-icon ${TypeConfig.color}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div className="env-title">
                      <h4>{env.name}</h4>
                      <span className={`env-status ${StatusConfig.color}`}>
                        {StatusConfig.label}
                      </span>
                    </div>
                    {env.protected && (
                      <span className="protected-badge" title="Protected Environment">
                        <Lock size={12} />
                      </span>
                    )}
                  </div>
                  <div className="env-details">
                    <div className="env-detail">
                      <span className="detail-label">URL</span>
                      <a href={env.url} target="_blank" rel="noopener noreferrer" className="env-url">
                        {env.url}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="env-detail">
                      <span className="detail-label">Branch</span>
                      <span className="env-branch">
                        <GitBranch size={12} />
                        {env.branch}
                      </span>
                    </div>
                  </div>
                  {env.approvers && env.approvers.length > 0 && (
                    <div className="env-approvers">
                      <span className="approvers-label">Approvers:</span>
                      <div className="approvers-list">
                        {env.approvers.map(approver => (
                          <span key={approver} className="approver-badge">{approver}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="env-footer">
                    <span className="last-deploy">Deployed {formatDate(env.lastDeployment)}</span>
                    <div className="env-actions">
                      <button className="action-btn-sm" title="Deploy">
                        <Play size={12} />
                      </button>
                      <button className="action-btn-sm" title="Rollback">
                        <RotateCcw size={12} />
                      </button>
                      <button className="action-btn-sm" title="Settings">
                        <Settings size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'artifacts' && (
        <div className="artifacts-section">
          <div className="section-header">
            <h3>Build Artifacts</h3>
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search artifacts..." />
              </div>
            </div>
          </div>

          <div className="artifacts-table">
            <div className="at-header">
              <span className="at-th">Name</span>
              <span className="at-th">Type</span>
              <span className="at-th">Size</span>
              <span className="at-th">Pipeline</span>
              <span className="at-th">Created</span>
              <span className="at-th">Downloads</span>
              <span className="at-th">Actions</span>
            </div>
            <div className="at-body">
              {ARTIFACTS.map(artifact => (
                <div key={artifact.id} className="at-row">
                  <span className="at-td name">
                    <Package size={14} className="artifact-icon" />
                    <code>{artifact.name}</code>
                  </span>
                  <span className="at-td type">
                    <span className={`type-badge ${artifact.type}`}>{artifact.type}</span>
                  </span>
                  <span className="at-td size">{formatBytes(artifact.size)}</span>
                  <span className="at-td pipeline">
                    {PIPELINES.find(p => p.id === artifact.pipelineId)?.name || '-'}
                  </span>
                  <span className="at-td created">{formatDate(artifact.created)}</span>
                  <span className="at-td downloads">{artifact.downloadCount}</span>
                  <span className="at-td actions">
                    <button className="action-btn-sm" title="Download">
                      <ArrowRight size={12} />
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
    </div>
  );
}
