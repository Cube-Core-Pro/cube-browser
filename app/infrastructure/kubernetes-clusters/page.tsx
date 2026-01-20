'use client';

import React, { useState } from 'react';
import {
  Box,
  Server,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Clock,
  RefreshCw,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Activity,
  Layers,
  Container,
  Play,
  Pause,
  Square,
  RotateCcw,
  Terminal,
  FileText,
  Database,
  Lock,
  Globe,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  GitBranch,
  Cloud,
  Webhook
} from 'lucide-react';
import './kubernetes-clusters.css';

interface Cluster {
  id: string;
  name: string;
  status: 'running' | 'provisioning' | 'updating' | 'error' | 'stopped';
  version: string;
  region: string;
  provider: 'aws' | 'gcp' | 'azure' | 'on-premise';
  nodeCount: number;
  nodesReady: number;
  cpu: { used: number; total: number };
  memory: { used: number; total: number };
  pods: { running: number; pending: number; failed: number; total: number };
  services: number;
  deployments: number;
  created: string;
  lastUpdated: string;
}

interface Node {
  id: string;
  clusterId: string;
  name: string;
  status: 'Ready' | 'NotReady' | 'Unknown' | 'SchedulingDisabled';
  role: 'master' | 'worker';
  instanceType: string;
  cpu: { used: number; total: number };
  memory: { used: number; total: number };
  pods: number;
  maxPods: number;
  age: string;
  zone: string;
  kubeletVersion: string;
}

interface Deployment {
  id: string;
  clusterId: string;
  name: string;
  namespace: string;
  replicas: { available: number; desired: number; ready: number };
  status: 'running' | 'progressing' | 'failed' | 'paused';
  image: string;
  strategy: 'RollingUpdate' | 'Recreate';
  cpu: string;
  memory: string;
  created: string;
  lastUpdated: string;
}

interface Service {
  id: string;
  clusterId: string;
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
  clusterIP: string;
  externalIP?: string;
  ports: { port: number; targetPort: number; protocol: string }[];
  selector: string;
  created: string;
}

interface Namespace {
  id: string;
  clusterId: string;
  name: string;
  status: 'Active' | 'Terminating';
  pods: number;
  services: number;
  deployments: number;
  resourceQuota: boolean;
  created: string;
}

const CLUSTERS: Cluster[] = [
  {
    id: 'cluster-1',
    name: 'production-us-east',
    status: 'running',
    version: '1.29.2',
    region: 'us-east-1',
    provider: 'aws',
    nodeCount: 12,
    nodesReady: 12,
    cpu: { used: 78, total: 96 },
    memory: { used: 245, total: 384 },
    pods: { running: 156, pending: 3, failed: 0, total: 200 },
    services: 48,
    deployments: 32,
    created: '2024-01-15T08:00:00Z',
    lastUpdated: '2025-01-28T14:30:00Z'
  },
  {
    id: 'cluster-2',
    name: 'production-eu-west',
    status: 'running',
    version: '1.29.2',
    region: 'eu-west-1',
    provider: 'aws',
    nodeCount: 8,
    nodesReady: 8,
    cpu: { used: 52, total: 64 },
    memory: { used: 168, total: 256 },
    pods: { running: 98, pending: 2, failed: 1, total: 150 },
    services: 36,
    deployments: 24,
    created: '2024-02-20T10:00:00Z',
    lastUpdated: '2025-01-28T12:00:00Z'
  },
  {
    id: 'cluster-3',
    name: 'staging-central',
    status: 'running',
    version: '1.30.0',
    region: 'us-central1',
    provider: 'gcp',
    nodeCount: 4,
    nodesReady: 4,
    cpu: { used: 12, total: 32 },
    memory: { used: 48, total: 128 },
    pods: { running: 45, pending: 0, failed: 0, total: 80 },
    services: 18,
    deployments: 12,
    created: '2024-06-01T14:00:00Z',
    lastUpdated: '2025-01-28T10:00:00Z'
  },
  {
    id: 'cluster-4',
    name: 'dev-cluster',
    status: 'updating',
    version: '1.29.2',
    region: 'eastus2',
    provider: 'azure',
    nodeCount: 3,
    nodesReady: 2,
    cpu: { used: 8, total: 24 },
    memory: { used: 32, total: 96 },
    pods: { running: 28, pending: 5, failed: 2, total: 60 },
    services: 12,
    deployments: 8,
    created: '2024-08-15T09:00:00Z',
    lastUpdated: '2025-01-28T14:00:00Z'
  },
  {
    id: 'cluster-5',
    name: 'ml-inference',
    status: 'running',
    version: '1.29.2',
    region: 'us-west-2',
    provider: 'aws',
    nodeCount: 6,
    nodesReady: 6,
    cpu: { used: 180, total: 192 },
    memory: { used: 720, total: 768 },
    pods: { running: 24, pending: 0, failed: 0, total: 30 },
    services: 8,
    deployments: 6,
    created: '2024-09-01T11:00:00Z',
    lastUpdated: '2025-01-27T16:00:00Z'
  }
];

const NODES: Node[] = [
  { id: 'node-1', clusterId: 'cluster-1', name: 'ip-10-0-1-101', status: 'Ready', role: 'master', instanceType: 'm6i.2xlarge', cpu: { used: 4.2, total: 8 }, memory: { used: 24, total: 32 }, pods: 12, maxPods: 20, age: '379d', zone: 'us-east-1a', kubeletVersion: '1.29.2' },
  { id: 'node-2', clusterId: 'cluster-1', name: 'ip-10-0-1-102', status: 'Ready', role: 'worker', instanceType: 'm6i.4xlarge', cpu: { used: 12.5, total: 16 }, memory: { used: 48, total: 64 }, pods: 28, maxPods: 58, age: '379d', zone: 'us-east-1a', kubeletVersion: '1.29.2' },
  { id: 'node-3', clusterId: 'cluster-1', name: 'ip-10-0-2-103', status: 'Ready', role: 'worker', instanceType: 'm6i.4xlarge', cpu: { used: 14.8, total: 16 }, memory: { used: 52, total: 64 }, pods: 32, maxPods: 58, age: '320d', zone: 'us-east-1b', kubeletVersion: '1.29.2' },
  { id: 'node-4', clusterId: 'cluster-1', name: 'ip-10-0-2-104', status: 'Ready', role: 'worker', instanceType: 'm6i.4xlarge', cpu: { used: 11.2, total: 16 }, memory: { used: 45, total: 64 }, pods: 26, maxPods: 58, age: '320d', zone: 'us-east-1b', kubeletVersion: '1.29.2' },
  { id: 'node-5', clusterId: 'cluster-1', name: 'ip-10-0-3-105', status: 'Ready', role: 'worker', instanceType: 'r6i.2xlarge', cpu: { used: 6.5, total: 8 }, memory: { used: 48, total: 64 }, pods: 18, maxPods: 58, age: '180d', zone: 'us-east-1c', kubeletVersion: '1.29.2' },
  { id: 'node-6', clusterId: 'cluster-4', name: 'dev-node-001', status: 'Ready', role: 'worker', instanceType: 'Standard_D4s_v3', cpu: { used: 3.2, total: 8 }, memory: { used: 14, total: 32 }, pods: 14, maxPods: 30, age: '165d', zone: 'eastus2-1', kubeletVersion: '1.29.2' },
  { id: 'node-7', clusterId: 'cluster-4', name: 'dev-node-002', status: 'NotReady', role: 'worker', instanceType: 'Standard_D4s_v3', cpu: { used: 0, total: 8 }, memory: { used: 0, total: 32 }, pods: 0, maxPods: 30, age: '165d', zone: 'eastus2-2', kubeletVersion: '1.29.2' }
];

const DEPLOYMENTS: Deployment[] = [
  { id: 'dep-1', clusterId: 'cluster-1', name: 'cube-frontend', namespace: 'production', replicas: { available: 6, desired: 6, ready: 6 }, status: 'running', image: 'cube-elite/frontend:v2.8.3', strategy: 'RollingUpdate', cpu: '500m', memory: '512Mi', created: '2024-01-15T08:00:00Z', lastUpdated: '2025-01-28T10:00:00Z' },
  { id: 'dep-2', clusterId: 'cluster-1', name: 'cube-backend', namespace: 'production', replicas: { available: 8, desired: 8, ready: 8 }, status: 'running', image: 'cube-elite/backend:v2.8.3', strategy: 'RollingUpdate', cpu: '1000m', memory: '2Gi', created: '2024-01-15T08:00:00Z', lastUpdated: '2025-01-28T10:00:00Z' },
  { id: 'dep-3', clusterId: 'cluster-1', name: 'cube-ai-service', namespace: 'production', replicas: { available: 4, desired: 4, ready: 4 }, status: 'running', image: 'cube-elite/ai-service:v1.5.2', strategy: 'RollingUpdate', cpu: '2000m', memory: '8Gi', created: '2024-06-01T10:00:00Z', lastUpdated: '2025-01-27T14:00:00Z' },
  { id: 'dep-4', clusterId: 'cluster-1', name: 'cube-worker', namespace: 'production', replicas: { available: 12, desired: 12, ready: 12 }, status: 'running', image: 'cube-elite/worker:v2.8.3', strategy: 'RollingUpdate', cpu: '500m', memory: '1Gi', created: '2024-01-15T08:00:00Z', lastUpdated: '2025-01-28T10:00:00Z' },
  { id: 'dep-5', clusterId: 'cluster-1', name: 'redis-cluster', namespace: 'cache', replicas: { available: 3, desired: 3, ready: 3 }, status: 'running', image: 'redis:7.2-alpine', strategy: 'RollingUpdate', cpu: '500m', memory: '2Gi', created: '2024-01-15T08:00:00Z', lastUpdated: '2024-12-01T10:00:00Z' },
  { id: 'dep-6', clusterId: 'cluster-4', name: 'cube-frontend', namespace: 'dev', replicas: { available: 1, desired: 2, ready: 1 }, status: 'progressing', image: 'cube-elite/frontend:v2.9.0-beta', strategy: 'RollingUpdate', cpu: '250m', memory: '256Mi', created: '2024-08-15T09:00:00Z', lastUpdated: '2025-01-28T14:00:00Z' }
];

const SERVICES: Service[] = [
  { id: 'svc-1', clusterId: 'cluster-1', name: 'cube-frontend', namespace: 'production', type: 'LoadBalancer', clusterIP: '10.100.45.120', externalIP: '52.86.123.45', ports: [{ port: 443, targetPort: 8080, protocol: 'TCP' }], selector: 'app=cube-frontend', created: '2024-01-15T08:00:00Z' },
  { id: 'svc-2', clusterId: 'cluster-1', name: 'cube-backend', namespace: 'production', type: 'ClusterIP', clusterIP: '10.100.45.121', ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP' }], selector: 'app=cube-backend', created: '2024-01-15T08:00:00Z' },
  { id: 'svc-3', clusterId: 'cluster-1', name: 'cube-ai-service', namespace: 'production', type: 'ClusterIP', clusterIP: '10.100.45.122', ports: [{ port: 8081, targetPort: 8081, protocol: 'TCP' }], selector: 'app=cube-ai-service', created: '2024-06-01T10:00:00Z' },
  { id: 'svc-4', clusterId: 'cluster-1', name: 'redis-master', namespace: 'cache', type: 'ClusterIP', clusterIP: '10.100.50.10', ports: [{ port: 6379, targetPort: 6379, protocol: 'TCP' }], selector: 'app=redis,role=master', created: '2024-01-15T08:00:00Z' },
  { id: 'svc-5', clusterId: 'cluster-1', name: 'postgres-primary', namespace: 'database', type: 'ClusterIP', clusterIP: '10.100.55.10', ports: [{ port: 5432, targetPort: 5432, protocol: 'TCP' }], selector: 'app=postgres,role=primary', created: '2024-01-15T08:00:00Z' }
];

const NAMESPACES: Namespace[] = [
  { id: 'ns-1', clusterId: 'cluster-1', name: 'production', status: 'Active', pods: 45, services: 12, deployments: 8, resourceQuota: true, created: '2024-01-15T08:00:00Z' },
  { id: 'ns-2', clusterId: 'cluster-1', name: 'staging', status: 'Active', pods: 22, services: 8, deployments: 5, resourceQuota: true, created: '2024-01-15T08:00:00Z' },
  { id: 'ns-3', clusterId: 'cluster-1', name: 'cache', status: 'Active', pods: 6, services: 3, deployments: 2, resourceQuota: true, created: '2024-01-15T08:00:00Z' },
  { id: 'ns-4', clusterId: 'cluster-1', name: 'database', status: 'Active', pods: 12, services: 4, deployments: 3, resourceQuota: true, created: '2024-01-15T08:00:00Z' },
  { id: 'ns-5', clusterId: 'cluster-1', name: 'monitoring', status: 'Active', pods: 18, services: 6, deployments: 4, resourceQuota: false, created: '2024-02-01T10:00:00Z' },
  { id: 'ns-6', clusterId: 'cluster-1', name: 'kube-system', status: 'Active', pods: 28, services: 8, deployments: 6, resourceQuota: false, created: '2024-01-15T08:00:00Z' }
];

const CLUSTER_STATUS_CONFIG = {
  running: { color: 'success', icon: CheckCircle, label: 'Running' },
  provisioning: { color: 'info', icon: Clock, label: 'Provisioning' },
  updating: { color: 'warning', icon: RefreshCw, label: 'Updating' },
  error: { color: 'danger', icon: XCircle, label: 'Error' },
  stopped: { color: 'muted', icon: Square, label: 'Stopped' }
};

const PROVIDER_CONFIG = {
  aws: { color: 'warning', label: 'AWS' },
  gcp: { color: 'info', label: 'GCP' },
  azure: { color: 'primary', label: 'Azure' },
  'on-premise': { color: 'muted', label: 'On-Premise' }
};

const NODE_STATUS_CONFIG = {
  Ready: { color: 'success', icon: CheckCircle },
  NotReady: { color: 'danger', icon: XCircle },
  Unknown: { color: 'warning', icon: AlertTriangle },
  SchedulingDisabled: { color: 'muted', icon: Pause }
};

const DEPLOYMENT_STATUS_CONFIG = {
  running: { color: 'success', icon: CheckCircle, label: 'Running' },
  progressing: { color: 'info', icon: RefreshCw, label: 'Progressing' },
  failed: { color: 'danger', icon: XCircle, label: 'Failed' },
  paused: { color: 'warning', icon: Pause, label: 'Paused' }
};

export default function KubernetesClustersPage() {
  const [activeTab, setActiveTab] = useState<'clusters' | 'nodes' | 'workloads' | 'services' | 'namespaces'>('clusters');
  const [expandedCluster, setExpandedCluster] = useState<string | null>('cluster-1');
  const [selectedCluster, setSelectedCluster] = useState<string>('cluster-1');
  const [searchQuery, setSearchQuery] = useState('');

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

  const totalClusters = CLUSTERS.length;
  const runningClusters = CLUSTERS.filter(c => c.status === 'running').length;
  const totalNodes = CLUSTERS.reduce((acc, c) => acc + c.nodeCount, 0);
  const readyNodes = CLUSTERS.reduce((acc, c) => acc + c.nodesReady, 0);
  const totalPods = CLUSTERS.reduce((acc, c) => acc + c.pods.running, 0);
  const totalDeployments = CLUSTERS.reduce((acc, c) => acc + c.deployments, 0);

  return (
    <div className="kubernetes-clusters">
      <div className="kubernetes-clusters__header">
        <div className="kubernetes-clusters__title-section">
          <div className="kubernetes-clusters__icon">
            <Box size={28} />
          </div>
          <div>
            <h1>Kubernetes Clusters</h1>
            <p>Container orchestration and workload management</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Cluster
          </button>
        </div>
      </div>

      <div className="kubernetes-clusters__stats">
        <div className="stat-card">
          <div className="stat-icon clusters">
            <Box size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningClusters}/{totalClusters}</span>
            <span className="stat-label">Clusters Running</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon nodes">
            <Server size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{readyNodes}/{totalNodes}</span>
            <span className="stat-label">Nodes Ready</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pods">
            <Container size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalPods}</span>
            <span className="stat-label">Running Pods</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon deployments">
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalDeployments}</span>
            <span className="stat-label">Deployments</span>
          </div>
        </div>
      </div>

      <div className="kubernetes-clusters__tabs">
        <button 
          className={`tab-btn ${activeTab === 'clusters' ? 'active' : ''}`}
          onClick={() => setActiveTab('clusters')}
        >
          <Box size={16} />
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
          className={`tab-btn ${activeTab === 'workloads' ? 'active' : ''}`}
          onClick={() => setActiveTab('workloads')}
        >
          <Layers size={16} />
          Workloads
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Network size={16} />
          Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'namespaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('namespaces')}
        >
          <Package size={16} />
          Namespaces
        </button>
      </div>

      {activeTab === 'clusters' && (
        <div className="clusters-section">
          <div className="section-header">
            <h3>Clusters ({CLUSTERS.length})</h3>
            <div className="section-filters">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search clusters..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="clusters-list">
            {CLUSTERS.filter(c =>
              searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(cluster => {
              const StatusConfig = CLUSTER_STATUS_CONFIG[cluster.status];
              const StatusIcon = StatusConfig.icon;
              const ProviderConfig = PROVIDER_CONFIG[cluster.provider];
              const cpuPercent = Math.round((cluster.cpu.used / cluster.cpu.total) * 100);
              const memoryPercent = Math.round((cluster.memory.used / cluster.memory.total) * 100);
              
              return (
                <div 
                  key={cluster.id}
                  className={`cluster-card ${cluster.status}`}
                >
                  <div className="cluster-main">
                    <div className={`cluster-icon ${StatusConfig.color}`}>
                      <Box size={20} />
                    </div>
                    <div className="cluster-info">
                      <div className="cluster-header">
                        <h4>{cluster.name}</h4>
                        <span className={`status-badge ${StatusConfig.color}`}>
                          <StatusIcon size={12} />
                          {StatusConfig.label}
                        </span>
                        <span className={`provider-badge ${ProviderConfig.color}`}>
                          <Cloud size={10} />
                          {ProviderConfig.label}
                        </span>
                        <span className="version-badge">v{cluster.version}</span>
                      </div>
                      <div className="cluster-meta">
                        <span><Globe size={12} /> {cluster.region}</span>
                        <span><Server size={12} /> {cluster.nodesReady}/{cluster.nodeCount} nodes</span>
                        <span><Container size={12} /> {cluster.pods.running} pods</span>
                        <span><Layers size={12} /> {cluster.deployments} deployments</span>
                      </div>
                    </div>
                    <div className="cluster-resources">
                      <div className="resource-bar">
                        <span className="resource-label">CPU</span>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${cpuPercent > 80 ? 'high' : cpuPercent > 60 ? 'medium' : 'low'}`}
                            style={{ width: `${cpuPercent}%` }}
                          ></div>
                        </div>
                        <span className="resource-value">{cpuPercent}%</span>
                      </div>
                      <div className="resource-bar">
                        <span className="resource-label">MEM</span>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${memoryPercent > 80 ? 'high' : memoryPercent > 60 ? 'medium' : 'low'}`}
                            style={{ width: `${memoryPercent}%` }}
                          ></div>
                        </div>
                        <span className="resource-value">{memoryPercent}%</span>
                      </div>
                    </div>
                    <div className="cluster-actions">
                      <button className="action-btn" title="Terminal">
                        <Terminal size={14} />
                      </button>
                      <button className="action-btn" title="Settings">
                        <Settings size={14} />
                      </button>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
                      >
                        {expandedCluster === cluster.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {expandedCluster === cluster.id && (
                    <div className="cluster-expanded">
                      <div className="expanded-grid">
                        <div className="expanded-section">
                          <h5>Pod Status</h5>
                          <div className="pod-status-grid">
                            <div className="pod-stat running">
                              <span className="pod-value">{cluster.pods.running}</span>
                              <span className="pod-label">Running</span>
                            </div>
                            <div className="pod-stat pending">
                              <span className="pod-value">{cluster.pods.pending}</span>
                              <span className="pod-label">Pending</span>
                            </div>
                            <div className="pod-stat failed">
                              <span className="pod-value">{cluster.pods.failed}</span>
                              <span className="pod-label">Failed</span>
                            </div>
                            <div className="pod-stat total">
                              <span className="pod-value">{cluster.pods.total}</span>
                              <span className="pod-label">Total Limit</span>
                            </div>
                          </div>
                        </div>
                        <div className="expanded-section">
                          <h5>Cluster Info</h5>
                          <div className="info-grid">
                            <div className="info-item">
                              <span className="info-label">Created</span>
                              <span className="info-value">{formatDate(cluster.created)}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Updated</span>
                              <span className="info-value">{formatDate(cluster.lastUpdated)}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Services</span>
                              <span className="info-value">{cluster.services}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Deployments</span>
                              <span className="info-value">{cluster.deployments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="expanded-actions">
                        <button className="btn-sm" onClick={() => { setSelectedCluster(cluster.id); setActiveTab('nodes'); }}>
                          <Server size={14} />
                          View Nodes
                        </button>
                        <button className="btn-sm" onClick={() => { setSelectedCluster(cluster.id); setActiveTab('workloads'); }}>
                          <Layers size={14} />
                          View Workloads
                        </button>
                        <button className="btn-sm">
                          <FileText size={14} />
                          View Logs
                        </button>
                        <button className="btn-sm">
                          <Activity size={14} />
                          Metrics
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
      )}

      {activeTab === 'nodes' && (
        <div className="nodes-section">
          <div className="section-header">
            <h3>Cluster Nodes</h3>
            <div className="section-filters">
              <select 
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
              >
                {CLUSTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="nodes-table">
            <div className="nt-header">
              <span className="nt-th">Node</span>
              <span className="nt-th">Status</span>
              <span className="nt-th">Role</span>
              <span className="nt-th">Type</span>
              <span className="nt-th">CPU</span>
              <span className="nt-th">Memory</span>
              <span className="nt-th">Pods</span>
              <span className="nt-th">Zone</span>
              <span className="nt-th">Actions</span>
            </div>
            <div className="nt-body">
              {NODES.filter(n => n.clusterId === selectedCluster).map(node => {
                const StatusConfig = NODE_STATUS_CONFIG[node.status];
                const StatusIcon = StatusConfig.icon;
                const cpuPercent = Math.round((node.cpu.used / node.cpu.total) * 100);
                const memPercent = Math.round((node.memory.used / node.memory.total) * 100);
                
                return (
                  <div key={node.id} className="nt-row">
                    <span className="nt-td name">
                      <Server size={14} className="node-icon" />
                      <div>
                        <code>{node.name}</code>
                        <span className="kubelet">kubelet {node.kubeletVersion}</span>
                      </div>
                    </span>
                    <span className="nt-td status">
                      <span className={`status-chip ${StatusConfig.color}`}>
                        <StatusIcon size={12} />
                        {node.status}
                      </span>
                    </span>
                    <span className="nt-td role">
                      <span className={`role-badge ${node.role}`}>{node.role}</span>
                    </span>
                    <span className="nt-td type">{node.instanceType}</span>
                    <span className="nt-td cpu">
                      <div className="mini-bar">
                        <div className="mini-fill" style={{ width: `${cpuPercent}%` }}></div>
                      </div>
                      <span>{cpuPercent}%</span>
                    </span>
                    <span className="nt-td memory">
                      <div className="mini-bar">
                        <div className="mini-fill" style={{ width: `${memPercent}%` }}></div>
                      </div>
                      <span>{memPercent}%</span>
                    </span>
                    <span className="nt-td pods">{node.pods}/{node.maxPods}</span>
                    <span className="nt-td zone">{node.zone}</span>
                    <span className="nt-td actions">
                      <button className="action-btn-sm" title="Shell">
                        <Terminal size={12} />
                      </button>
                      <button className="action-btn-sm" title="Cordon">
                        <Pause size={12} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workloads' && (
        <div className="workloads-section">
          <div className="section-header">
            <h3>Deployments</h3>
            <div className="section-filters">
              <select 
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
              >
                {CLUSTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="btn-primary">
                <Plus size={16} />
                New Deployment
              </button>
            </div>
          </div>

          <div className="deployments-grid">
            {DEPLOYMENTS.filter(d => d.clusterId === selectedCluster).map(deployment => {
              const StatusConfig = DEPLOYMENT_STATUS_CONFIG[deployment.status];
              const StatusIcon = StatusConfig.icon;
              
              return (
                <div key={deployment.id} className={`deployment-card ${deployment.status}`}>
                  <div className="deployment-header">
                    <div className={`deployment-icon ${StatusConfig.color}`}>
                      <Layers size={18} />
                    </div>
                    <div className="deployment-title">
                      <h4>{deployment.name}</h4>
                      <span className="namespace">{deployment.namespace}</span>
                    </div>
                    <span className={`status-badge ${StatusConfig.color}`}>
                      <StatusIcon size={12} />
                      {StatusConfig.label}
                    </span>
                  </div>
                  <div className="deployment-image">
                    <Package size={12} />
                    <code>{deployment.image}</code>
                  </div>
                  <div className="deployment-replicas">
                    <div className="replica-bar">
                      <div 
                        className="replica-fill ready"
                        style={{ width: `${(deployment.replicas.ready / deployment.replicas.desired) * 100}%` }}
                      ></div>
                    </div>
                    <span className="replica-text">
                      {deployment.replicas.ready}/{deployment.replicas.desired} replicas ready
                    </span>
                  </div>
                  <div className="deployment-resources">
                    <span><Cpu size={12} /> {deployment.cpu}</span>
                    <span><HardDrive size={12} /> {deployment.memory}</span>
                    <span className="strategy">{deployment.strategy}</span>
                  </div>
                  <div className="deployment-footer">
                    <span className="updated">Updated {formatDate(deployment.lastUpdated)}</span>
                    <div className="deployment-actions">
                      <button className="action-btn-sm" title="Scale">
                        <TrendingUp size={12} />
                      </button>
                      <button className="action-btn-sm" title="Restart">
                        <RotateCcw size={12} />
                      </button>
                      <button className="action-btn-sm" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="services-section">
          <div className="section-header">
            <h3>Services</h3>
            <div className="section-filters">
              <select 
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
              >
                {CLUSTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="btn-primary">
                <Plus size={16} />
                New Service
              </button>
            </div>
          </div>

          <div className="services-table">
            <div className="st-header">
              <span className="st-th">Name</span>
              <span className="st-th">Namespace</span>
              <span className="st-th">Type</span>
              <span className="st-th">Cluster IP</span>
              <span className="st-th">External IP</span>
              <span className="st-th">Ports</span>
              <span className="st-th">Actions</span>
            </div>
            <div className="st-body">
              {SERVICES.filter(s => s.clusterId === selectedCluster).map(service => (
                <div key={service.id} className="st-row">
                  <span className="st-td name">
                    <Network size={14} className="service-icon" />
                    <code>{service.name}</code>
                  </span>
                  <span className="st-td namespace">{service.namespace}</span>
                  <span className="st-td type">
                    <span className={`type-badge ${service.type.toLowerCase()}`}>{service.type}</span>
                  </span>
                  <span className="st-td cluster-ip"><code>{service.clusterIP}</code></span>
                  <span className="st-td external-ip">
                    {service.externalIP ? <code>{service.externalIP}</code> : <span className="none">-</span>}
                  </span>
                  <span className="st-td ports">
                    {service.ports.map((p, idx) => (
                      <span key={idx} className="port-badge">{p.port}:{p.targetPort}/{p.protocol}</span>
                    ))}
                  </span>
                  <span className="st-td actions">
                    <button className="action-btn-sm" title="Edit">
                      <Settings size={12} />
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

      {activeTab === 'namespaces' && (
        <div className="namespaces-section">
          <div className="section-header">
            <h3>Namespaces</h3>
            <div className="section-filters">
              <select 
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
              >
                {CLUSTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button className="btn-primary">
                <Plus size={16} />
                New Namespace
              </button>
            </div>
          </div>

          <div className="namespaces-grid">
            {NAMESPACES.filter(n => n.clusterId === selectedCluster).map(namespace => (
              <div key={namespace.id} className={`namespace-card ${namespace.status.toLowerCase()}`}>
                <div className="namespace-header">
                  <div className="namespace-icon">
                    <Package size={20} />
                  </div>
                  <div className="namespace-title">
                    <h4>{namespace.name}</h4>
                    <span className={`status-badge ${namespace.status === 'Active' ? 'success' : 'warning'}`}>
                      {namespace.status}
                    </span>
                  </div>
                  {namespace.resourceQuota && (
                    <span className="quota-badge" title="Resource Quota Enabled">
                      <Shield size={12} />
                    </span>
                  )}
                </div>
                <div className="namespace-stats">
                  <div className="ns-stat">
                    <Container size={14} />
                    <span className="ns-value">{namespace.pods}</span>
                    <span className="ns-label">Pods</span>
                  </div>
                  <div className="ns-stat">
                    <Network size={14} />
                    <span className="ns-value">{namespace.services}</span>
                    <span className="ns-label">Services</span>
                  </div>
                  <div className="ns-stat">
                    <Layers size={14} />
                    <span className="ns-value">{namespace.deployments}</span>
                    <span className="ns-label">Deployments</span>
                  </div>
                </div>
                <div className="namespace-footer">
                  <span className="created">Created {formatDate(namespace.created)}</span>
                  <div className="namespace-actions">
                    <button className="action-btn-sm">
                      <Settings size={12} />
                    </button>
                    <button className="action-btn-sm">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
