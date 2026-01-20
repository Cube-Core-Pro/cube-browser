'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Server,
  Container,
  Cloud,
  GitBranch,
  Shield,
  Cpu,
  HardDrive,
  Database,
  Network,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Scale,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Layers,
  Box,
  Globe,
  Lock,
  Unlock,
  Download,
  Upload,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Trash2,
  Eye,
  Edit,
  ArrowUp,
  ArrowDown,
  Workflow,
  GitCommit,
  Webhook,
  Key
} from 'lucide-react';
import './devops-command.css';

interface Deployment {
  id: string;
  name: string;
  environment: 'production' | 'staging' | 'development';
  status: 'running' | 'deploying' | 'failed' | 'stopped';
  version: string;
  replicas: { current: number; desired: number };
  cpu: number;
  memory: number;
  lastDeploy: string;
  region: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
}

interface Pipeline {
  id: string;
  name: string;
  branch: string;
  status: 'success' | 'running' | 'failed' | 'pending';
  stages: PipelineStage[];
  duration: number;
  triggeredBy: string;
  startTime: string;
}

interface PipelineStage {
  name: string;
  status: 'success' | 'running' | 'failed' | 'pending' | 'skipped';
  duration?: number;
}

interface KubernetesCluster {
  id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure' | 'on-prem';
  status: 'healthy' | 'warning' | 'critical';
  nodes: number;
  pods: { running: number; pending: number; failed: number };
  version: string;
  region: string;
}

interface Secret {
  id: string;
  name: string;
  type: 'opaque' | 'docker-registry' | 'tls' | 'ssh-auth';
  namespace: string;
  lastUpdated: string;
  keys: number;
}

interface InfraResource {
  id: string;
  name: string;
  type: 'ec2' | 'rds' | 's3' | 'lambda' | 'eks' | 'elb' | 'cloudfront';
  provider: string;
  status: 'active' | 'pending' | 'error';
  cost: number;
  region: string;
}

const SAMPLE_DEPLOYMENTS: Deployment[] = [
  { id: 'd1', name: 'cube-api-gateway', environment: 'production', status: 'running', version: 'v2.4.1', replicas: { current: 5, desired: 5 }, cpu: 45, memory: 62, lastDeploy: '2h ago', region: 'us-east-1', health: 'healthy' },
  { id: 'd2', name: 'cube-frontend', environment: 'production', status: 'deploying', version: 'v3.1.0', replicas: { current: 3, desired: 4 }, cpu: 78, memory: 54, lastDeploy: '5m ago', region: 'us-east-1', health: 'degraded' },
  { id: 'd3', name: 'cube-ml-service', environment: 'production', status: 'running', version: 'v1.8.2', replicas: { current: 3, desired: 3 }, cpu: 89, memory: 78, lastDeploy: '1d ago', region: 'us-west-2', health: 'healthy' },
  { id: 'd4', name: 'cube-auth-service', environment: 'staging', status: 'running', version: 'v2.5.0-rc1', replicas: { current: 2, desired: 2 }, cpu: 23, memory: 41, lastDeploy: '3h ago', region: 'eu-west-1', health: 'healthy' },
  { id: 'd5', name: 'cube-analytics', environment: 'staging', status: 'failed', version: 'v1.2.0', replicas: { current: 0, desired: 2 }, cpu: 0, memory: 0, lastDeploy: '30m ago', region: 'eu-west-1', health: 'unhealthy' },
  { id: 'd6', name: 'cube-notification', environment: 'development', status: 'stopped', version: 'v0.9.5', replicas: { current: 0, desired: 1 }, cpu: 0, memory: 0, lastDeploy: '2d ago', region: 'us-east-1', health: 'unhealthy' },
];

const SAMPLE_PIPELINES: Pipeline[] = [
  { 
    id: 'p1', name: 'Deploy to Production', branch: 'main', status: 'running', 
    stages: [
      { name: 'Build', status: 'success', duration: 145 },
      { name: 'Test', status: 'success', duration: 234 },
      { name: 'Security Scan', status: 'running' },
      { name: 'Deploy', status: 'pending' },
    ],
    duration: 0, triggeredBy: 'sarah.dev', startTime: '5m ago'
  },
  { 
    id: 'p2', name: 'CI Pipeline', branch: 'feature/auth-v2', status: 'success',
    stages: [
      { name: 'Build', status: 'success', duration: 98 },
      { name: 'Lint', status: 'success', duration: 45 },
      { name: 'Test', status: 'success', duration: 312 },
      { name: 'Coverage', status: 'success', duration: 67 },
    ],
    duration: 522, triggeredBy: 'john.smith', startTime: '15m ago'
  },
  { 
    id: 'p3', name: 'Staging Deploy', branch: 'develop', status: 'failed',
    stages: [
      { name: 'Build', status: 'success', duration: 123 },
      { name: 'Test', status: 'success', duration: 267 },
      { name: 'Deploy', status: 'failed', duration: 45 },
    ],
    duration: 435, triggeredBy: 'mike.ops', startTime: '1h ago'
  },
  { 
    id: 'p4', name: 'Security Audit', branch: 'main', status: 'success',
    stages: [
      { name: 'SAST', status: 'success', duration: 156 },
      { name: 'DAST', status: 'success', duration: 423 },
      { name: 'Dependency Scan', status: 'success', duration: 89 },
    ],
    duration: 668, triggeredBy: 'scheduled', startTime: '3h ago'
  },
];

const SAMPLE_CLUSTERS: KubernetesCluster[] = [
  { id: 'c1', name: 'prod-us-east', provider: 'aws', status: 'healthy', nodes: 12, pods: { running: 156, pending: 2, failed: 0 }, version: '1.28.3', region: 'us-east-1' },
  { id: 'c2', name: 'prod-eu-west', provider: 'aws', status: 'warning', nodes: 8, pods: { running: 98, pending: 5, failed: 2 }, version: '1.28.3', region: 'eu-west-1' },
  { id: 'c3', name: 'staging-central', provider: 'gcp', status: 'healthy', nodes: 4, pods: { running: 45, pending: 1, failed: 0 }, version: '1.29.0', region: 'us-central1' },
  { id: 'c4', name: 'dev-local', provider: 'on-prem', status: 'critical', nodes: 2, pods: { running: 12, pending: 0, failed: 5 }, version: '1.27.6', region: 'local' },
];

const SAMPLE_SECRETS: Secret[] = [
  { id: 's1', name: 'prod-database-credentials', type: 'opaque', namespace: 'production', lastUpdated: '2 weeks ago', keys: 4 },
  { id: 's2', name: 'docker-registry-auth', type: 'docker-registry', namespace: 'default', lastUpdated: '1 month ago', keys: 3 },
  { id: 's3', name: 'api-tls-cert', type: 'tls', namespace: 'production', lastUpdated: '3 days ago', keys: 2 },
  { id: 's4', name: 'github-deploy-key', type: 'ssh-auth', namespace: 'ci-cd', lastUpdated: '1 week ago', keys: 1 },
  { id: 's5', name: 'openai-api-key', type: 'opaque', namespace: 'ai-services', lastUpdated: '5 days ago', keys: 1 },
];

const SAMPLE_INFRA: InfraResource[] = [
  { id: 'i1', name: 'prod-api-cluster', type: 'eks', provider: 'AWS', status: 'active', cost: 2450, region: 'us-east-1' },
  { id: 'i2', name: 'main-database', type: 'rds', provider: 'AWS', status: 'active', cost: 890, region: 'us-east-1' },
  { id: 'i3', name: 'static-assets', type: 's3', provider: 'AWS', status: 'active', cost: 125, region: 'us-east-1' },
  { id: 'i4', name: 'ml-inference', type: 'lambda', provider: 'AWS', status: 'active', cost: 345, region: 'us-west-2' },
  { id: 'i5', name: 'cdn-distribution', type: 'cloudfront', provider: 'AWS', status: 'active', cost: 567, region: 'global' },
  { id: 'i6', name: 'load-balancer', type: 'elb', provider: 'AWS', status: 'pending', cost: 234, region: 'us-east-1' },
];

export default function DevOpsCommandPage() {
  const [activeTab, setActiveTab] = useState<'deployments' | 'pipelines' | 'clusters' | 'secrets' | 'infra'>('deployments');
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>('p1');
  const [showTerminal, setShowTerminal] = useState(false);

  const stats = {
    totalDeployments: SAMPLE_DEPLOYMENTS.length,
    healthyDeployments: SAMPLE_DEPLOYMENTS.filter(d => d.health === 'healthy').length,
    activePipelines: SAMPLE_PIPELINES.filter(p => p.status === 'running').length,
    failedPipelines: SAMPLE_PIPELINES.filter(p => p.status === 'failed').length,
    totalClusters: SAMPLE_CLUSTERS.length,
    totalSecrets: SAMPLE_SECRETS.length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'success':
      case 'healthy':
      case 'active':
        return <CheckCircle size={14} />;
      case 'deploying':
      case 'pending':
        return <Clock size={14} />;
      case 'failed':
      case 'critical':
      case 'error':
      case 'unhealthy':
        return <XCircle size={14} />;
      case 'stopped':
        return <Pause size={14} />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'aws':
        return <Cloud size={14} />;
      case 'gcp':
        return <Cloud size={14} />;
      case 'azure':
        return <Cloud size={14} />;
      default:
        return <Server size={14} />;
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderDeployments = () => (
    <div className="deployments-content">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search deployments..." />
          </div>
          <select>
            <option>All Environments</option>
            <option>Production</option>
            <option>Staging</option>
            <option>Development</option>
          </select>
          <select>
            <option>All Statuses</option>
            <option>Running</option>
            <option>Deploying</option>
            <option>Failed</option>
            <option>Stopped</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={14} />
            New Deployment
          </button>
        </div>
      </div>

      <div className="deployments-grid">
        {SAMPLE_DEPLOYMENTS.map((deployment) => (
          <div
            key={deployment.id}
            className={`deployment-card ${deployment.status} ${deployment.health}`}
            onClick={() => setSelectedDeployment(deployment)}
          >
            <div className="deployment-header">
              <div className={`status-indicator ${deployment.status}`}>
                {getStatusIcon(deployment.status)}
                <span>{deployment.status}</span>
              </div>
              <span className={`env-badge ${deployment.environment}`}>
                {deployment.environment}
              </span>
            </div>

            <h4 className="deployment-name">{deployment.name}</h4>
            <p className="deployment-version">
              <GitCommit size={12} />
              {deployment.version}
            </p>

            <div className="deployment-metrics">
              <div className="metric">
                <span className="metric-label">CPU</span>
                <div className="metric-bar">
                  <div
                    className={`metric-fill ${deployment.cpu > 80 ? 'critical' : deployment.cpu > 60 ? 'warning' : 'healthy'}`}
                    style={{ width: `${deployment.cpu}%` }}
                  />
                </div>
                <span className="metric-value">{deployment.cpu}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Memory</span>
                <div className="metric-bar">
                  <div
                    className={`metric-fill ${deployment.memory > 80 ? 'critical' : deployment.memory > 60 ? 'warning' : 'healthy'}`}
                    style={{ width: `${deployment.memory}%` }}
                  />
                </div>
                <span className="metric-value">{deployment.memory}%</span>
              </div>
            </div>

            <div className="deployment-info">
              <div className="info-item">
                <Layers size={12} />
                <span>{deployment.replicas.current}/{deployment.replicas.desired} replicas</span>
              </div>
              <div className="info-item">
                <Globe size={12} />
                <span>{deployment.region}</span>
              </div>
              <div className="info-item">
                <Clock size={12} />
                <span>{deployment.lastDeploy}</span>
              </div>
            </div>

            <div className="deployment-actions">
              {deployment.status === 'running' ? (
                <>
                  <button className="action-btn" title="Restart">
                    <RotateCcw size={14} />
                  </button>
                  <button className="action-btn" title="Scale">
                    <Scale size={14} />
                  </button>
                  <button className="action-btn" title="Logs">
                    <Terminal size={14} />
                  </button>
                </>
              ) : deployment.status === 'stopped' ? (
                <button className="action-btn" title="Start">
                  <Play size={14} />
                </button>
              ) : deployment.status === 'failed' ? (
                <>
                  <button className="action-btn" title="Retry">
                    <RefreshCw size={14} />
                  </button>
                  <button className="action-btn" title="View Logs">
                    <Terminal size={14} />
                  </button>
                </>
              ) : null}
              <button className="action-btn" title="Settings">
                <Settings size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPipelines = () => (
    <div className="pipelines-content">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search pipelines..." />
          </div>
          <select>
            <option>All Branches</option>
            <option>main</option>
            <option>develop</option>
            <option>feature/*</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Webhook size={14} />
            Webhooks
          </button>
          <button className="btn-primary">
            <Play size={14} />
            Run Pipeline
          </button>
        </div>
      </div>

      <div className="pipelines-list">
        {SAMPLE_PIPELINES.map((pipeline) => (
          <div key={pipeline.id} className={`pipeline-card ${pipeline.status}`}>
            <div
              className="pipeline-header"
              onClick={() => setExpandedPipeline(expandedPipeline === pipeline.id ? null : pipeline.id)}
            >
              <div className="pipeline-info">
                <button className="expand-btn">
                  {expandedPipeline === pipeline.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className={`pipeline-status ${pipeline.status}`}>
                  {getStatusIcon(pipeline.status)}
                </div>
                <div className="pipeline-details">
                  <h4>{pipeline.name}</h4>
                  <div className="pipeline-meta">
                    <span className="branch">
                      <GitBranch size={12} />
                      {pipeline.branch}
                    </span>
                    <span className="trigger">by {pipeline.triggeredBy}</span>
                    <span className="time">{pipeline.startTime}</span>
                  </div>
                </div>
              </div>
              <div className="pipeline-summary">
                <div className="stages-preview">
                  {pipeline.stages.map((stage, idx) => (
                    <div key={idx} className={`stage-dot ${stage.status}`} title={stage.name} />
                  ))}
                </div>
                {pipeline.duration > 0 && (
                  <span className="duration">{formatDuration(pipeline.duration)}</span>
                )}
              </div>
            </div>

            {expandedPipeline === pipeline.id && (
              <div className="pipeline-stages">
                {pipeline.stages.map((stage, idx) => (
                  <div key={idx} className={`stage-item ${stage.status}`}>
                    <div className="stage-connector">
                      <div className={`stage-icon ${stage.status}`}>
                        {getStatusIcon(stage.status)}
                      </div>
                      {idx < pipeline.stages.length - 1 && <div className="connector-line" />}
                    </div>
                    <div className="stage-content">
                      <span className="stage-name">{stage.name}</span>
                      {stage.duration && (
                        <span className="stage-duration">{formatDuration(stage.duration)}</span>
                      )}
                    </div>
                    <div className="stage-actions">
                      <button className="btn-icon small" title="View Logs">
                        <Terminal size={12} />
                      </button>
                      {stage.status === 'failed' && (
                        <button className="btn-icon small" title="Retry">
                          <RefreshCw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderClusters = () => (
    <div className="clusters-content">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search clusters..." />
          </div>
          <select>
            <option>All Providers</option>
            <option>AWS</option>
            <option>GCP</option>
            <option>Azure</option>
            <option>On-Premise</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={14} />
            Export Kubeconfig
          </button>
          <button className="btn-primary">
            <Plus size={14} />
            Add Cluster
          </button>
        </div>
      </div>

      <div className="clusters-grid">
        {SAMPLE_CLUSTERS.map((cluster) => (
          <div key={cluster.id} className={`cluster-card ${cluster.status}`}>
            <div className="cluster-header">
              <div className={`cluster-status ${cluster.status}`}>
                {getStatusIcon(cluster.status)}
                <span>{cluster.status}</span>
              </div>
              <div className="cluster-provider">
                {getProviderIcon(cluster.provider)}
                <span>{cluster.provider.toUpperCase()}</span>
              </div>
            </div>

            <h4 className="cluster-name">{cluster.name}</h4>
            <p className="cluster-version">Kubernetes {cluster.version}</p>

            <div className="cluster-stats">
              <div className="stat">
                <Server size={14} />
                <span>{cluster.nodes} nodes</span>
              </div>
              <div className="stat">
                <Box size={14} />
                <span>{cluster.pods.running} pods</span>
              </div>
              <div className="stat">
                <Globe size={14} />
                <span>{cluster.region}</span>
              </div>
            </div>

            <div className="pods-breakdown">
              <div className="pods-bar">
                <div
                  className="pods-segment running"
                  style={{ width: `${(cluster.pods.running / (cluster.pods.running + cluster.pods.pending + cluster.pods.failed)) * 100}%` }}
                  title={`${cluster.pods.running} running`}
                />
                <div
                  className="pods-segment pending"
                  style={{ width: `${(cluster.pods.pending / (cluster.pods.running + cluster.pods.pending + cluster.pods.failed)) * 100}%` }}
                  title={`${cluster.pods.pending} pending`}
                />
                <div
                  className="pods-segment failed"
                  style={{ width: `${(cluster.pods.failed / (cluster.pods.running + cluster.pods.pending + cluster.pods.failed)) * 100}%` }}
                  title={`${cluster.pods.failed} failed`}
                />
              </div>
              <div className="pods-legend">
                <span className="legend-item running">{cluster.pods.running} running</span>
                <span className="legend-item pending">{cluster.pods.pending} pending</span>
                <span className="legend-item failed">{cluster.pods.failed} failed</span>
              </div>
            </div>

            <div className="cluster-actions">
              <button className="btn-outline small">
                <Terminal size={12} />
                kubectl
              </button>
              <button className="btn-outline small">
                <Eye size={12} />
                Dashboard
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecrets = () => (
    <div className="secrets-content">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search secrets..." />
          </div>
          <select>
            <option>All Namespaces</option>
            <option>production</option>
            <option>staging</option>
            <option>default</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Upload size={14} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={14} />
            Create Secret
          </button>
        </div>
      </div>

      <div className="secrets-table">
        <div className="table-header">
          <span>Name</span>
          <span>Type</span>
          <span>Namespace</span>
          <span>Keys</span>
          <span>Last Updated</span>
          <span>Actions</span>
        </div>
        {SAMPLE_SECRETS.map((secret) => (
          <div key={secret.id} className="table-row">
            <div className="secret-name">
              <Lock size={14} />
              <span>{secret.name}</span>
            </div>
            <div className="secret-type">
              <span className={`type-badge ${secret.type}`}>{secret.type}</span>
            </div>
            <div className="secret-namespace">{secret.namespace}</div>
            <div className="secret-keys">
              <Key size={12} />
              {secret.keys}
            </div>
            <div className="secret-updated">{secret.lastUpdated}</div>
            <div className="secret-actions">
              <button className="btn-icon small" title="View">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Edit">
                <Edit size={14} />
              </button>
              <button className="btn-icon small" title="Copy">
                <Copy size={14} />
              </button>
              <button className="btn-icon small danger" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInfra = () => (
    <div className="infra-content">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search resources..." />
          </div>
          <select>
            <option>All Types</option>
            <option>Compute (EC2/EKS)</option>
            <option>Database (RDS)</option>
            <option>Storage (S3)</option>
            <option>Serverless (Lambda)</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Workflow size={14} />
            Terraform
          </button>
          <button className="btn-primary">
            <Plus size={14} />
            Provision
          </button>
        </div>
      </div>

      <div className="infra-summary">
        <div className="summary-card">
          <span className="summary-label">Total Resources</span>
          <span className="summary-value">{SAMPLE_INFRA.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Monthly Cost</span>
          <span className="summary-value cost">
            ${SAMPLE_INFRA.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active</span>
          <span className="summary-value healthy">{SAMPLE_INFRA.filter(r => r.status === 'active').length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Pending</span>
          <span className="summary-value warning">{SAMPLE_INFRA.filter(r => r.status === 'pending').length}</span>
        </div>
      </div>

      <div className="infra-table">
        <div className="table-header">
          <span>Resource</span>
          <span>Type</span>
          <span>Provider</span>
          <span>Region</span>
          <span>Status</span>
          <span>Monthly Cost</span>
          <span>Actions</span>
        </div>
        {SAMPLE_INFRA.map((resource) => (
          <div key={resource.id} className="table-row">
            <div className="resource-name">
              {resource.type === 'eks' && <Container size={14} />}
              {resource.type === 'rds' && <Database size={14} />}
              {resource.type === 's3' && <HardDrive size={14} />}
              {resource.type === 'lambda' && <Zap size={14} />}
              {resource.type === 'cloudfront' && <Globe size={14} />}
              {resource.type === 'elb' && <Network size={14} />}
              <span>{resource.name}</span>
            </div>
            <div className="resource-type">
              <span className="type-label">{resource.type.toUpperCase()}</span>
            </div>
            <div className="resource-provider">
              <Cloud size={12} />
              {resource.provider}
            </div>
            <div className="resource-region">{resource.region}</div>
            <div className={`resource-status ${resource.status}`}>
              {getStatusIcon(resource.status)}
              <span>{resource.status}</span>
            </div>
            <div className="resource-cost">${resource.cost}/mo</div>
            <div className="resource-actions">
              <button className="btn-icon small" title="View Details">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Open Console">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="devops-command">
      <header className="dc__header">
        <div className="dc__title-section">
          <div className="dc__icon">
            <Terminal size={28} />
          </div>
          <div>
            <h1>DevOps Command Center</h1>
            <p>Unified infrastructure and deployment management</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`btn-outline ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <Terminal size={16} />
            Terminal
          </button>
          <button className="btn-outline">
            <Activity size={16} />
            Metrics
          </button>
          <button className="btn-primary">
            <Shield size={16} />
            Security Scan
          </button>
        </div>
      </header>

      <div className="dc__stats">
        <div className="stat-card">
          <div className="stat-icon deployments">
            <Container size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalDeployments}</span>
            <span className="stat-label">Deployments</span>
          </div>
          <span className="stat-badge healthy">{stats.healthyDeployments} healthy</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon pipelines">
            <Workflow size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{SAMPLE_PIPELINES.length}</span>
            <span className="stat-label">Pipelines</span>
          </div>
          <span className="stat-badge active">{stats.activePipelines} running</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon clusters">
            <Server size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalClusters}</span>
            <span className="stat-label">Clusters</span>
          </div>
          <span className="stat-badge">{SAMPLE_CLUSTERS.reduce((sum, c) => sum + c.nodes, 0)} nodes</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon secrets">
            <Lock size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalSecrets}</span>
            <span className="stat-label">Secrets</span>
          </div>
          <span className="stat-badge">{SAMPLE_SECRETS.reduce((sum, s) => sum + s.keys, 0)} keys</span>
        </div>
      </div>

      <nav className="dc__tabs">
        {[
          { id: 'deployments', label: 'Deployments', icon: Container },
          { id: 'pipelines', label: 'Pipelines', icon: Workflow },
          { id: 'clusters', label: 'Clusters', icon: Server },
          { id: 'secrets', label: 'Secrets', icon: Lock },
          { id: 'infra', label: 'Infrastructure', icon: Cloud },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dc__content">
        {activeTab === 'deployments' && renderDeployments()}
        {activeTab === 'pipelines' && renderPipelines()}
        {activeTab === 'clusters' && renderClusters()}
        {activeTab === 'secrets' && renderSecrets()}
        {activeTab === 'infra' && renderInfra()}
      </main>

      {showTerminal && (
        <div className="terminal-panel">
          <div className="terminal-header">
            <span>Terminal</span>
            <div className="terminal-actions">
              <button className="btn-icon small">
                <Plus size={14} />
              </button>
              <button className="btn-icon small" onClick={() => setShowTerminal(false)}>
                <XCircle size={14} />
              </button>
            </div>
          </div>
          <div className="terminal-content">
            <div className="terminal-line">
              <span className="prompt">cube@devops:~$</span>
              <span className="command">kubectl get pods -n production</span>
            </div>
            <div className="terminal-output">
              NAME                            READY   STATUS    RESTARTS   AGE<br />
              cube-api-gateway-5d4f6b8-x7p2r  1/1     Running   0          2h<br />
              cube-api-gateway-5d4f6b8-k9m3s  1/1     Running   0          2h<br />
              cube-frontend-7b9c4d2-j4n8t    1/1     Running   0          5m<br />
              cube-ml-service-3a7e5f1-m2k6p  1/1     Running   0          1d
            </div>
            <div className="terminal-line active">
              <span className="prompt">cube@devops:~$</span>
              <span className="cursor">|</span>
            </div>
          </div>
        </div>
      )}

      {selectedDeployment && (
        <div className="detail-overlay" onClick={() => setSelectedDeployment(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div className="detail-title">
                <div className={`status-icon ${selectedDeployment.status}`}>
                  {getStatusIcon(selectedDeployment.status)}
                </div>
                <div>
                  <h3>{selectedDeployment.name}</h3>
                  <p>{selectedDeployment.version} • {selectedDeployment.environment}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDeployment(null)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="detail-section">
              <h4>Resource Usage</h4>
              <div className="usage-meters">
                <div className="usage-meter">
                  <div className="meter-header">
                    <Cpu size={14} />
                    <span>CPU</span>
                    <span className={`value ${selectedDeployment.cpu > 80 ? 'critical' : ''}`}>{selectedDeployment.cpu}%</span>
                  </div>
                  <div className="meter-bar">
                    <div
                      className={`meter-fill ${selectedDeployment.cpu > 80 ? 'critical' : selectedDeployment.cpu > 60 ? 'warning' : 'healthy'}`}
                      style={{ width: `${selectedDeployment.cpu}%` }}
                    />
                  </div>
                </div>
                <div className="usage-meter">
                  <div className="meter-header">
                    <HardDrive size={14} />
                    <span>Memory</span>
                    <span className={`value ${selectedDeployment.memory > 80 ? 'critical' : ''}`}>{selectedDeployment.memory}%</span>
                  </div>
                  <div className="meter-bar">
                    <div
                      className={`meter-fill ${selectedDeployment.memory > 80 ? 'critical' : selectedDeployment.memory > 60 ? 'warning' : 'healthy'}`}
                      style={{ width: `${selectedDeployment.memory}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Replicas</h4>
              <div className="replicas-visual">
                {Array.from({ length: selectedDeployment.replicas.desired }, (_, i) => (
                  <div
                    key={i}
                    className={`replica-box ${i < selectedDeployment.replicas.current ? 'active' : 'inactive'}`}
                  >
                    <Box size={16} />
                  </div>
                ))}
              </div>
              <p className="replicas-text">
                {selectedDeployment.replicas.current} of {selectedDeployment.replicas.desired} replicas running
              </p>
            </div>

            <div className="detail-actions">
              <button className="btn-outline">
                <Terminal size={14} />
                View Logs
              </button>
              <button className="btn-outline">
                <Scale size={14} />
                Scale
              </button>
              <button className="btn-primary">
                <RotateCcw size={14} />
                Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
