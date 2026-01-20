'use client';

import React, { useState } from 'react';
import {
  Zap,
  Globe,
  Clock,
  RefreshCw,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Code,
  Play,
  Pause,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MoreVertical,
  Terminal,
  Server,
  MapPin,
  Activity,
  Layers,
  Box,
  GitBranch,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Cpu,
  MemoryStick,
  HardDrive,
  Edit2,
  ExternalLink
} from 'lucide-react';
import './edge-functions.css';

interface EdgeFunction {
  id: string;
  name: string;
  description: string;
  runtime: 'javascript' | 'typescript' | 'wasm';
  status: 'deployed' | 'deploying' | 'failed' | 'disabled';
  trigger: 'request' | 'scheduled' | 'event';
  regions: string[];
  invocations24h: number;
  avgDuration: number;
  errorRate: number;
  lastDeployed: string;
  codeSize: string;
  memory: number;
  timeout: number;
}

interface DeploymentLog {
  id: string;
  functionId: string;
  functionName: string;
  action: 'deploy' | 'rollback' | 'disable' | 'update';
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  user: string;
  version: string;
  duration: string;
}

interface RegionMetric {
  region: string;
  code: string;
  invocations: number;
  avgLatency: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'offline';
}

const EDGE_FUNCTIONS: EdgeFunction[] = [
  {
    id: '1',
    name: 'auth-middleware',
    description: 'JWT validation and user authentication at the edge',
    runtime: 'typescript',
    status: 'deployed',
    trigger: 'request',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
    invocations24h: 2456789,
    avgDuration: 12,
    errorRate: 0.02,
    lastDeployed: '2 hours ago',
    codeSize: '24 KB',
    memory: 128,
    timeout: 30
  },
  {
    id: '2',
    name: 'geo-redirect',
    description: 'Redirect users based on geographic location',
    runtime: 'javascript',
    status: 'deployed',
    trigger: 'request',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    invocations24h: 1234567,
    avgDuration: 5,
    errorRate: 0.01,
    lastDeployed: '1 day ago',
    codeSize: '8 KB',
    memory: 64,
    timeout: 10
  },
  {
    id: '3',
    name: 'image-optimizer',
    description: 'On-the-fly image resizing and format conversion',
    runtime: 'wasm',
    status: 'deployed',
    trigger: 'request',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1'],
    invocations24h: 567890,
    avgDuration: 145,
    errorRate: 0.15,
    lastDeployed: '5 hours ago',
    codeSize: '512 KB',
    memory: 256,
    timeout: 60
  },
  {
    id: '4',
    name: 'rate-limiter',
    description: 'Distributed rate limiting across edge locations',
    runtime: 'typescript',
    status: 'deployed',
    trigger: 'request',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'],
    invocations24h: 8923456,
    avgDuration: 3,
    errorRate: 0.005,
    lastDeployed: '3 days ago',
    codeSize: '16 KB',
    memory: 64,
    timeout: 5
  },
  {
    id: '5',
    name: 'ab-testing',
    description: 'A/B testing experiment assignment',
    runtime: 'javascript',
    status: 'deploying',
    trigger: 'request',
    regions: ['us-east-1', 'eu-west-1'],
    invocations24h: 345678,
    avgDuration: 8,
    errorRate: 0.03,
    lastDeployed: 'Deploying...',
    codeSize: '12 KB',
    memory: 64,
    timeout: 15
  },
  {
    id: '6',
    name: 'cache-purge',
    description: 'Scheduled cache invalidation job',
    runtime: 'typescript',
    status: 'deployed',
    trigger: 'scheduled',
    regions: ['us-east-1'],
    invocations24h: 24,
    avgDuration: 2500,
    errorRate: 0,
    lastDeployed: '1 week ago',
    codeSize: '6 KB',
    memory: 128,
    timeout: 300
  }
];

const DEPLOYMENT_LOGS: DeploymentLog[] = [
  { id: '1', functionId: '5', functionName: 'ab-testing', action: 'deploy', status: 'pending', timestamp: '2 min ago', user: 'john.doe', version: 'v2.3.0', duration: '-' },
  { id: '2', functionId: '1', functionName: 'auth-middleware', action: 'update', status: 'success', timestamp: '2 hours ago', user: 'jane.smith', version: 'v1.5.2', duration: '45s' },
  { id: '3', functionId: '3', functionName: 'image-optimizer', action: 'deploy', status: 'success', timestamp: '5 hours ago', user: 'john.doe', version: 'v3.0.0', duration: '1m 23s' },
  { id: '4', functionId: '2', functionName: 'geo-redirect', action: 'rollback', status: 'success', timestamp: '1 day ago', user: 'admin', version: 'v1.2.1', duration: '32s' },
  { id: '5', functionId: '4', functionName: 'rate-limiter', action: 'update', status: 'failed', timestamp: '3 days ago', user: 'jane.smith', version: 'v2.1.0', duration: '2m 15s' }
];

const REGION_METRICS: RegionMetric[] = [
  { region: 'US East (N. Virginia)', code: 'us-east-1', invocations: 4567890, avgLatency: 12, errorRate: 0.02, status: 'healthy' },
  { region: 'EU West (Ireland)', code: 'eu-west-1', invocations: 2345678, avgLatency: 18, errorRate: 0.03, status: 'healthy' },
  { region: 'Asia Pacific (Singapore)', code: 'ap-southeast-1', invocations: 1234567, avgLatency: 25, errorRate: 0.05, status: 'healthy' },
  { region: 'Asia Pacific (Tokyo)', code: 'ap-northeast-1', invocations: 987654, avgLatency: 22, errorRate: 0.04, status: 'healthy' },
  { region: 'US West (Oregon)', code: 'us-west-2', invocations: 567890, avgLatency: 15, errorRate: 0.08, status: 'degraded' },
  { region: 'EU Central (Frankfurt)', code: 'eu-central-1', invocations: 456789, avgLatency: 20, errorRate: 0.03, status: 'healthy' },
  { region: 'South America (São Paulo)', code: 'sa-east-1', invocations: 234567, avgLatency: 45, errorRate: 0.12, status: 'degraded' }
];

const RUNTIME_CONFIG = {
  javascript: { color: 'warning', label: 'JavaScript', icon: '𝐉𝐒' },
  typescript: { color: 'info', label: 'TypeScript', icon: '𝐓𝐒' },
  wasm: { color: 'purple', label: 'WebAssembly', icon: '🔮' }
};

const STATUS_CONFIG = {
  deployed: { color: 'success', label: 'Deployed', icon: CheckCircle },
  deploying: { color: 'warning', label: 'Deploying', icon: RefreshCw },
  failed: { color: 'danger', label: 'Failed', icon: XCircle },
  disabled: { color: 'muted', label: 'Disabled', icon: Pause }
};

const TRIGGER_CONFIG = {
  request: { color: 'info', label: 'HTTP Request' },
  scheduled: { color: 'purple', label: 'Scheduled' },
  event: { color: 'warning', label: 'Event' }
};

export default function EdgeFunctionsPage() {
  const [activeTab, setActiveTab] = useState<'functions' | 'deployments' | 'regions' | 'analytics'>('functions');
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRuntime, setFilterRuntime] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const totalInvocations = EDGE_FUNCTIONS.reduce((acc, f) => acc + f.invocations24h, 0);
  const avgDuration = Math.round(EDGE_FUNCTIONS.reduce((acc, f) => acc + f.avgDuration, 0) / EDGE_FUNCTIONS.length);
  const deployedFunctions = EDGE_FUNCTIONS.filter(f => f.status === 'deployed').length;
  const totalRegions = [...new Set(EDGE_FUNCTIONS.flatMap(f => f.regions))].length;

  const filteredFunctions = EDGE_FUNCTIONS.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRuntime = filterRuntime === 'all' || f.runtime === filterRuntime;
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchesSearch && matchesRuntime && matchesStatus;
  });

  const renderFunctions = () => (
    <div className="functions-section">
      <div className="functions-header">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filters">
          <select value={filterRuntime} onChange={(e) => setFilterRuntime(e.target.value)}>
            <option value="all">All Runtimes</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="wasm">WebAssembly</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="deployed">Deployed</option>
            <option value="deploying">Deploying</option>
            <option value="failed">Failed</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Function
        </button>
      </div>

      <div className="functions-list">
        {filteredFunctions.map(func => {
          const runtimeConfig = RUNTIME_CONFIG[func.runtime];
          const statusConfig = STATUS_CONFIG[func.status];
          const StatusIcon = statusConfig.icon;
          const triggerConfig = TRIGGER_CONFIG[func.trigger];
          const isExpanded = expandedFunction === func.id;

          return (
            <div key={func.id} className={`function-card ${func.status}`}>
              <div className="function-main">
                <div className="function-status">
                  <div className={`status-icon ${statusConfig.color}`}>
                    <StatusIcon size={18} />
                  </div>
                </div>

                <div className="function-info">
                  <div className="function-header">
                    <h4>{func.name}</h4>
                    <span className={`runtime-badge ${runtimeConfig.color}`}>
                      {runtimeConfig.icon} {runtimeConfig.label}
                    </span>
                    <span className={`trigger-badge ${triggerConfig.color}`}>
                      {triggerConfig.label}
                    </span>
                  </div>
                  <p className="function-description">{func.description}</p>
                  <div className="function-regions">
                    <MapPin size={12} />
                    <span>{func.regions.length} regions</span>
                    <span className="region-list">
                      {func.regions.slice(0, 3).join(', ')}
                      {func.regions.length > 3 && ` +${func.regions.length - 3} more`}
                    </span>
                  </div>
                </div>

                <div className="function-metrics">
                  <div className="func-metric">
                    <span className="metric-value">{func.invocations24h.toLocaleString()}</span>
                    <span className="metric-label">Invocations (24h)</span>
                  </div>
                  <div className="func-metric">
                    <span className="metric-value">{func.avgDuration}ms</span>
                    <span className="metric-label">Avg Duration</span>
                  </div>
                  <div className="func-metric">
                    <span className={`metric-value ${func.errorRate > 0.1 ? 'warning' : ''}`}>
                      {func.errorRate}%
                    </span>
                    <span className="metric-label">Error Rate</span>
                  </div>
                </div>

                <div className="function-actions">
                  <button className="action-btn" title="View Logs">
                    <Terminal size={16} />
                  </button>
                  <button className="action-btn" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="expand-btn"
                    onClick={() => setExpandedFunction(isExpanded ? null : func.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="function-expanded">
                  <div className="expanded-grid">
                    <div className="expanded-section">
                      <h5>Configuration</h5>
                      <div className="config-list">
                        <div className="config-item">
                          <span className="config-label">Memory</span>
                          <span className="config-value">{func.memory} MB</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Timeout</span>
                          <span className="config-value">{func.timeout}s</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Code Size</span>
                          <span className="config-value">{func.codeSize}</span>
                        </div>
                        <div className="config-item">
                          <span className="config-label">Last Deployed</span>
                          <span className="config-value">{func.lastDeployed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="expanded-section">
                      <h5>Deployed Regions</h5>
                      <div className="regions-grid">
                        {func.regions.map((region, i) => (
                          <span key={i} className="region-tag">{region}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="expanded-actions">
                    <button className="btn-sm">
                      <Code size={14} />
                      View Code
                    </button>
                    <button className="btn-sm">
                      <BarChart3 size={14} />
                      Metrics
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

  const renderDeployments = () => (
    <div className="deployments-section">
      <div className="deployments-header">
        <h3>Deployment History</h3>
        <div className="deployments-filters">
          <select defaultValue="all">
            <option value="all">All Functions</option>
            {EDGE_FUNCTIONS.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select defaultValue="7d">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="deployments-list">
        {DEPLOYMENT_LOGS.map(log => (
          <div key={log.id} className={`deployment-card ${log.status}`}>
            <div className="deployment-icon">
              {log.status === 'success' && <CheckCircle size={20} />}
              {log.status === 'failed' && <XCircle size={20} />}
              {log.status === 'pending' && <RefreshCw size={20} className="spinning" />}
            </div>

            <div className="deployment-info">
              <div className="deployment-header">
                <h4>{log.functionName}</h4>
                <span className={`action-badge ${log.action}`}>{log.action}</span>
              </div>
              <div className="deployment-meta">
                <span className="version">{log.version}</span>
                <span className="user">by {log.user}</span>
              </div>
            </div>

            <div className="deployment-time">
              <Clock size={14} />
              {log.timestamp}
            </div>

            <div className="deployment-duration">
              Duration: {log.duration}
            </div>

            <div className={`deployment-status ${log.status}`}>
              {log.status}
            </div>

            <button className="action-btn">
              <MoreVertical size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRegions = () => (
    <div className="regions-section">
      <div className="regions-header">
        <h3>Edge Regions</h3>
        <button className="btn-outline">
          <Plus size={16} />
          Add Region
        </button>
      </div>

      <div className="regions-map">
        <div className="map-placeholder">
          <Globe size={80} />
          <p>Global edge network visualization</p>
        </div>
      </div>

      <div className="regions-table">
        <div className="rt-header">
          <span className="rt-th region">Region</span>
          <span className="rt-th invocations">Invocations (24h)</span>
          <span className="rt-th latency">Avg Latency</span>
          <span className="rt-th error">Error Rate</span>
          <span className="rt-th status">Status</span>
          <span className="rt-th actions"></span>
        </div>
        <div className="rt-body">
          {REGION_METRICS.map((region, i) => (
            <div key={i} className={`rt-row ${region.status}`}>
              <span className="rt-td region">
                <div className="region-info">
                  <span className="region-code">{region.code}</span>
                  <span className="region-name">{region.region}</span>
                </div>
              </span>
              <span className="rt-td invocations">
                {region.invocations.toLocaleString()}
              </span>
              <span className={`rt-td latency ${region.avgLatency > 30 ? 'warning' : ''}`}>
                {region.avgLatency}ms
              </span>
              <span className={`rt-td error ${region.errorRate > 0.1 ? 'danger' : ''}`}>
                {region.errorRate}%
              </span>
              <span className={`rt-td status ${region.status}`}>
                {region.status === 'healthy' && <CheckCircle size={14} />}
                {region.status === 'degraded' && <AlertTriangle size={14} />}
                {region.status === 'offline' && <XCircle size={14} />}
                {region.status}
              </span>
              <span className="rt-td actions">
                <button className="action-btn small">
                  <Eye size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="analytics-header">
        <h3>Performance Analytics</h3>
        <select defaultValue="7d">
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="analytics-cards">
        <div className="analytics-card">
          <h4>Invocations Over Time</h4>
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <p>Invocation trends</p>
          </div>
        </div>
        <div className="analytics-card">
          <h4>Response Time Distribution</h4>
          <div className="chart-placeholder">
            <Activity size={48} />
            <p>Latency percentiles</p>
          </div>
        </div>
      </div>

      <div className="top-functions">
        <h4>Top Functions by Invocations</h4>
        <div className="top-list">
          {EDGE_FUNCTIONS.sort((a, b) => b.invocations24h - a.invocations24h).slice(0, 5).map((func, i) => (
            <div key={func.id} className="top-item">
              <span className="top-rank">{i + 1}</span>
              <span className="top-name">{func.name}</span>
              <div className="top-bar">
                <div 
                  className="top-fill"
                  style={{ width: `${(func.invocations24h / EDGE_FUNCTIONS[0].invocations24h) * 100}%` }}
                />
              </div>
              <span className="top-value">{func.invocations24h.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="error-breakdown">
        <h4>Error Breakdown</h4>
        <div className="error-list">
          {[
            { type: 'Timeout', count: 1234, percentage: 45 },
            { type: 'Memory Exceeded', count: 567, percentage: 21 },
            { type: 'Runtime Error', count: 456, percentage: 17 },
            { type: 'Network Error', count: 289, percentage: 11 },
            { type: 'Other', count: 167, percentage: 6 }
          ].map((error, i) => (
            <div key={i} className="error-item">
              <span className="error-type">{error.type}</span>
              <span className="error-count">{error.count.toLocaleString()}</span>
              <div className="error-bar">
                <div 
                  className="error-fill"
                  style={{ width: `${error.percentage}%` }}
                />
              </div>
              <span className="error-percentage">{error.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="edge-functions">
      <div className="edge-functions__header">
        <div className="edge-functions__title-section">
          <div className="edge-functions__icon">
            <Zap size={28} />
          </div>
          <div>
            <h1>Edge Functions</h1>
            <p>Serverless computing at the edge</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Deploy Function
          </button>
        </div>
      </div>

      <div className="edge-functions__stats">
        <div className="stat-card">
          <div className="stat-icon functions">
            <Box size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{deployedFunctions}</span>
            <span className="stat-label">Active Functions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon invocations">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(totalInvocations / 1000000).toFixed(1)}M</span>
            <span className="stat-label">Invocations (24h)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon duration">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgDuration}ms</span>
            <span className="stat-label">Avg Duration</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon regions">
            <Globe size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalRegions}</span>
            <span className="stat-label">Edge Regions</span>
          </div>
        </div>
      </div>

      <div className="edge-functions__tabs">
        <button
          className={`tab-btn ${activeTab === 'functions' ? 'active' : ''}`}
          onClick={() => setActiveTab('functions')}
        >
          <Box size={16} />
          Functions
        </button>
        <button
          className={`tab-btn ${activeTab === 'deployments' ? 'active' : ''}`}
          onClick={() => setActiveTab('deployments')}
        >
          <GitBranch size={16} />
          Deployments
        </button>
        <button
          className={`tab-btn ${activeTab === 'regions' ? 'active' : ''}`}
          onClick={() => setActiveTab('regions')}
        >
          <Globe size={16} />
          Regions
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      <div className="edge-functions__content">
        {activeTab === 'functions' && renderFunctions()}
        {activeTab === 'deployments' && renderDeployments()}
        {activeTab === 'regions' && renderRegions()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
