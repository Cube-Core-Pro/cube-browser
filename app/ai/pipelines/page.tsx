'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Database,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Calendar,
  User,
  ArrowRight,
  Box,
  Cpu,
  Activity,
  BarChart3,
  FileCode,
  Workflow,
  Timer,
  Layers,
  Link2,
  Download,
  Upload
} from 'lucide-react';
import './data-pipeline.css';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'success' | 'failed' | 'paused' | 'scheduled' | 'draft';
  schedule: string;
  lastRun: string;
  nextRun?: string;
  duration: string;
  owner: string;
  team: string;
  tags: string[];
  nodes: PipelineNode[];
  stats: {
    totalRuns: number;
    successRate: number;
    avgDuration: string;
    dataProcessed: string;
  };
}

interface PipelineNode {
  id: string;
  name: string;
  type: 'source' | 'transform' | 'sink' | 'ml' | 'validation' | 'branch';
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped';
  duration?: string;
  records?: number;
  icon: string;
}

interface PipelineRun {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration: string;
  triggeredBy: string;
  recordsProcessed: number;
  errorMessage?: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 's3' | 'kafka' | 'api' | 'file' | 'bigquery';
  connection: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  schema?: string;
}

const PIPELINES: Pipeline[] = [
  {
    id: 'pipe-001',
    name: 'user-events-etl',
    description: 'Extract user events from Kafka, transform, and load to BigQuery',
    status: 'running',
    schedule: '*/15 * * * *',
    lastRun: '2024-01-15T16:30:00Z',
    nextRun: '2024-01-15T16:45:00Z',
    duration: '5m 23s',
    owner: 'data-team',
    team: 'Data Engineering',
    tags: ['etl', 'events', 'real-time'],
    nodes: [
      { id: 'n1', name: 'Kafka Source', type: 'source', status: 'success', duration: '45s', records: 125000, icon: '📨' },
      { id: 'n2', name: 'Parse JSON', type: 'transform', status: 'success', duration: '1m 12s', records: 125000, icon: '🔄' },
      { id: 'n3', name: 'Filter Events', type: 'transform', status: 'success', duration: '32s', records: 98500, icon: '🔍' },
      { id: 'n4', name: 'Enrich User Data', type: 'transform', status: 'running', records: 45000, icon: '✨' },
      { id: 'n5', name: 'BigQuery Sink', type: 'sink', status: 'pending', icon: '💾' }
    ],
    stats: { totalRuns: 2456, successRate: 99.2, avgDuration: '5m 30s', dataProcessed: '1.2 TB' }
  },
  {
    id: 'pipe-002',
    name: 'ml-feature-pipeline',
    description: 'Generate ML features from raw transaction data',
    status: 'success',
    schedule: '0 */4 * * *',
    lastRun: '2024-01-15T16:00:00Z',
    nextRun: '2024-01-15T20:00:00Z',
    duration: '23m 45s',
    owner: 'ml-team',
    team: 'Machine Learning',
    tags: ['ml', 'features', 'batch'],
    nodes: [
      { id: 'n1', name: 'PostgreSQL Source', type: 'source', status: 'success', duration: '2m 15s', records: 5000000, icon: '🐘' },
      { id: 'n2', name: 'Window Aggregations', type: 'transform', status: 'success', duration: '8m 32s', records: 5000000, icon: '📊' },
      { id: 'n3', name: 'Feature Engineering', type: 'ml', status: 'success', duration: '10m 45s', records: 5000000, icon: '🧠' },
      { id: 'n4', name: 'Data Validation', type: 'validation', status: 'success', duration: '1m 23s', records: 5000000, icon: '✅' },
      { id: 'n5', name: 'Feature Store Sink', type: 'sink', status: 'success', duration: '50s', records: 5000000, icon: '🗄️' }
    ],
    stats: { totalRuns: 892, successRate: 98.5, avgDuration: '25m', dataProcessed: '45 TB' }
  },
  {
    id: 'pipe-003',
    name: 'daily-reports-generation',
    description: 'Generate daily business reports and send to stakeholders',
    status: 'scheduled',
    schedule: '0 6 * * *',
    lastRun: '2024-01-15T06:00:00Z',
    nextRun: '2024-01-16T06:00:00Z',
    duration: '12m 10s',
    owner: 'analytics-team',
    team: 'Analytics',
    tags: ['reports', 'daily', 'email'],
    nodes: [
      { id: 'n1', name: 'Data Warehouse', type: 'source', status: 'success', duration: '3m 20s', records: 150000, icon: '🏢' },
      { id: 'n2', name: 'Calculate KPIs', type: 'transform', status: 'success', duration: '4m 15s', records: 150000, icon: '📈' },
      { id: 'n3', name: 'Generate Charts', type: 'transform', status: 'success', duration: '2m 45s', records: 24, icon: '📊' },
      { id: 'n4', name: 'Create PDF Reports', type: 'transform', status: 'success', duration: '1m 30s', records: 12, icon: '📄' },
      { id: 'n5', name: 'Email Distribution', type: 'sink', status: 'success', duration: '20s', records: 48, icon: '📧' }
    ],
    stats: { totalRuns: 365, successRate: 99.7, avgDuration: '12m', dataProcessed: '500 GB' }
  },
  {
    id: 'pipe-004',
    name: 'fraud-detection-scoring',
    description: 'Real-time fraud scoring pipeline with ML inference',
    status: 'running',
    schedule: 'continuous',
    lastRun: '2024-01-15T16:42:00Z',
    duration: 'continuous',
    owner: 'fraud-team',
    team: 'Risk & Fraud',
    tags: ['real-time', 'ml', 'fraud', 'critical'],
    nodes: [
      { id: 'n1', name: 'Transaction Stream', type: 'source', status: 'running', records: 8450, icon: '🌊' },
      { id: 'n2', name: 'Feature Lookup', type: 'transform', status: 'running', records: 8450, icon: '🔎' },
      { id: 'n3', name: 'ML Inference', type: 'ml', status: 'running', records: 8450, icon: '🤖' },
      { id: 'n4', name: 'Rule Engine', type: 'branch', status: 'running', records: 8450, icon: '⚖️' },
      { id: 'n5', name: 'Alert Sink', type: 'sink', status: 'running', records: 23, icon: '🚨' },
      { id: 'n6', name: 'Audit Log', type: 'sink', status: 'running', records: 8450, icon: '📝' }
    ],
    stats: { totalRuns: 1, successRate: 100, avgDuration: 'N/A', dataProcessed: '89 TB' }
  },
  {
    id: 'pipe-005',
    name: 'data-quality-checks',
    description: 'Automated data quality validation across all sources',
    status: 'failed',
    schedule: '0 */6 * * *',
    lastRun: '2024-01-15T12:00:00Z',
    nextRun: '2024-01-15T18:00:00Z',
    duration: '8m 45s',
    owner: 'data-team',
    team: 'Data Engineering',
    tags: ['quality', 'validation', 'monitoring'],
    nodes: [
      { id: 'n1', name: 'All Sources Scan', type: 'source', status: 'success', duration: '2m 30s', records: 45, icon: '🔍' },
      { id: 'n2', name: 'Schema Validation', type: 'validation', status: 'success', duration: '3m 15s', records: 45, icon: '📋' },
      { id: 'n3', name: 'Completeness Check', type: 'validation', status: 'failed', duration: '2m 45s', records: 42, icon: '❌' },
      { id: 'n4', name: 'Freshness Check', type: 'validation', status: 'skipped', icon: '⏰' },
      { id: 'n5', name: 'Alert on Failure', type: 'sink', status: 'success', records: 3, icon: '🔔' }
    ],
    stats: { totalRuns: 730, successRate: 92.1, avgDuration: '9m', dataProcessed: '1 GB' }
  },
  {
    id: 'pipe-006',
    name: 'customer-360-sync',
    description: 'Synchronize customer data across all systems',
    status: 'paused',
    schedule: '0 2 * * *',
    lastRun: '2024-01-14T02:00:00Z',
    nextRun: 'Paused',
    duration: '45m 30s',
    owner: 'platform-team',
    team: 'Platform',
    tags: ['sync', 'customer', 'integration'],
    nodes: [
      { id: 'n1', name: 'CRM Extract', type: 'source', status: 'success', duration: '5m', records: 2000000, icon: '👥' },
      { id: 'n2', name: 'Support Tickets', type: 'source', status: 'success', duration: '3m', records: 500000, icon: '🎫' },
      { id: 'n3', name: 'Merge & Dedupe', type: 'transform', status: 'success', duration: '15m', records: 1800000, icon: '🔀' },
      { id: 'n4', name: 'Enrich Profiles', type: 'transform', status: 'success', duration: '12m', records: 1800000, icon: '✨' },
      { id: 'n5', name: 'Data Warehouse', type: 'sink', status: 'success', duration: '8m', records: 1800000, icon: '🏢' },
      { id: 'n6', name: 'Elasticsearch', type: 'sink', status: 'success', duration: '2m', records: 1800000, icon: '🔎' }
    ],
    stats: { totalRuns: 180, successRate: 97.8, avgDuration: '48m', dataProcessed: '12 TB' }
  }
];

const RECENT_RUNS: PipelineRun[] = [
  { id: 'run-001', pipelineId: 'pipe-001', pipelineName: 'user-events-etl', status: 'running', startTime: '2024-01-15T16:30:00Z', duration: '5m 23s', triggeredBy: 'schedule', recordsProcessed: 125000 },
  { id: 'run-002', pipelineId: 'pipe-002', pipelineName: 'ml-feature-pipeline', status: 'success', startTime: '2024-01-15T16:00:00Z', endTime: '2024-01-15T16:23:45Z', duration: '23m 45s', triggeredBy: 'schedule', recordsProcessed: 5000000 },
  { id: 'run-003', pipelineId: 'pipe-005', pipelineName: 'data-quality-checks', status: 'failed', startTime: '2024-01-15T12:00:00Z', endTime: '2024-01-15T12:08:45Z', duration: '8m 45s', triggeredBy: 'schedule', recordsProcessed: 42, errorMessage: 'Completeness check failed: 3 tables have >5% null values' },
  { id: 'run-004', pipelineId: 'pipe-003', pipelineName: 'daily-reports-generation', status: 'success', startTime: '2024-01-15T06:00:00Z', endTime: '2024-01-15T06:12:10Z', duration: '12m 10s', triggeredBy: 'schedule', recordsProcessed: 150000 },
  { id: 'run-005', pipelineId: 'pipe-001', pipelineName: 'user-events-etl', status: 'success', startTime: '2024-01-15T16:15:00Z', endTime: '2024-01-15T16:20:15Z', duration: '5m 15s', triggeredBy: 'schedule', recordsProcessed: 118000 }
];

const DATA_SOURCES: DataSource[] = [
  { id: 'ds-001', name: 'Production PostgreSQL', type: 'database', connection: 'postgres://prod-db.cube.io:5432', status: 'connected', lastSync: '2024-01-15T16:45:00Z', schema: 'public' },
  { id: 'ds-002', name: 'Analytics BigQuery', type: 'bigquery', connection: 'cube-analytics.prod', status: 'connected', lastSync: '2024-01-15T16:40:00Z' },
  { id: 'ds-003', name: 'Events Kafka', type: 'kafka', connection: 'kafka://events.cube.io:9092', status: 'connected', lastSync: '2024-01-15T16:45:30Z' },
  { id: 'ds-004', name: 'Data Lake S3', type: 's3', connection: 's3://cube-data-lake', status: 'connected', lastSync: '2024-01-15T16:30:00Z' },
  { id: 'ds-005', name: 'External API', type: 'api', connection: 'https://api.partner.com/v2', status: 'error', lastSync: '2024-01-15T14:00:00Z' },
  { id: 'ds-006', name: 'File Uploads', type: 'file', connection: '/data/uploads/', status: 'connected', lastSync: '2024-01-15T16:00:00Z' }
];

export default function DataPipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(PIPELINES);
  const [activeTab, setActiveTab] = useState<'pipelines' | 'runs' | 'sources' | 'monitoring'>('pipelines');
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPipelines, setExpandedPipelines] = useState<string[]>([]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 size={14} className="status-icon running" />;
      case 'success': return <CheckCircle size={14} className="status-icon success" />;
      case 'failed': return <XCircle size={14} className="status-icon failed" />;
      case 'paused': return <Pause size={14} className="status-icon paused" />;
      case 'scheduled': return <Clock size={14} className="status-icon scheduled" />;
      case 'draft': return <FileCode size={14} className="status-icon draft" />;
      case 'pending': return <Clock size={14} className="status-icon pending" />;
      case 'skipped': return <ChevronRight size={14} className="status-icon skipped" />;
      case 'cancelled': return <Square size={14} className="status-icon cancelled" />;
      default: return null;
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'database': return '🐘';
      case 's3': return '☁️';
      case 'kafka': return '📨';
      case 'api': return '🔌';
      case 'file': return '📁';
      case 'bigquery': return '📊';
      default: return '💾';
    }
  };

  const togglePipeline = (id: string) => {
    setExpandedPipelines(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const filteredPipelines = pipelines.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const runningPipelines = pipelines.filter(p => p.status === 'running').length;
  const failedPipelines = pipelines.filter(p => p.status === 'failed').length;
  const connectedSources = DATA_SOURCES.filter(s => s.status === 'connected').length;

  const renderPipelinesSection = () => (
    <div className="pipelines-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search pipelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Upload size={16} />
            Import
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Pipeline
          </button>
        </div>
      </div>

      <div className="pipelines-list">
        {filteredPipelines.map(pipeline => (
          <div key={pipeline.id} className={`pipeline-card ${pipeline.status}`}>
            <div 
              className="pipeline-header"
              onClick={() => togglePipeline(pipeline.id)}
            >
              <div className="pipeline-info">
                <button className="expand-btn">
                  {expandedPipelines.includes(pipeline.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <Workflow size={20} />
                <div>
                  <h4>{pipeline.name}</h4>
                  <p>{pipeline.description}</p>
                </div>
              </div>
              <div className="pipeline-status">
                {getStatusIcon(pipeline.status)}
                <span className={`status-text ${pipeline.status}`}>{pipeline.status}</span>
              </div>
            </div>

            <div className="pipeline-meta">
              <div className="meta-item">
                <Clock size={14} />
                <span>{pipeline.schedule === 'continuous' ? 'Continuous' : pipeline.schedule}</span>
              </div>
              <div className="meta-item">
                <Timer size={14} />
                <span>{pipeline.duration}</span>
              </div>
              <div className="meta-item">
                <User size={14} />
                <span>{pipeline.owner}</span>
              </div>
              <div className="meta-item">
                <Activity size={14} />
                <span>{pipeline.stats.successRate}% success</span>
              </div>
            </div>

            {expandedPipelines.includes(pipeline.id) && (
              <div className="pipeline-details">
                <div className="pipeline-flow">
                  <h5>Pipeline Flow</h5>
                  <div className="nodes-container">
                    {pipeline.nodes.map((node, index) => (
                      <React.Fragment key={node.id}>
                        <div className={`pipeline-node ${node.type} ${node.status}`}>
                          <div className="node-icon">{node.icon}</div>
                          <div className="node-info">
                            <span className="node-name">{node.name}</span>
                            <span className="node-type">{node.type}</span>
                          </div>
                          <div className="node-status">
                            {getStatusIcon(node.status)}
                          </div>
                          {node.records !== undefined && (
                            <div className="node-records">
                              {node.records.toLocaleString()} records
                            </div>
                          )}
                          {node.duration && (
                            <div className="node-duration">{node.duration}</div>
                          )}
                        </div>
                        {index < pipeline.nodes.length - 1 && (
                          <div className="node-connector">
                            <ArrowRight size={16} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="pipeline-stats">
                  <div className="stat">
                    <span className="stat-value">{pipeline.stats.totalRuns.toLocaleString()}</span>
                    <span className="stat-label">Total Runs</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{pipeline.stats.successRate}%</span>
                    <span className="stat-label">Success Rate</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{pipeline.stats.avgDuration}</span>
                    <span className="stat-label">Avg Duration</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{pipeline.stats.dataProcessed}</span>
                    <span className="stat-label">Data Processed</span>
                  </div>
                </div>

                <div className="pipeline-tags">
                  {pipeline.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                <div className="pipeline-actions">
                  {pipeline.status === 'running' && (
                    <button className="btn-outline small">
                      <Pause size={14} />
                      Pause
                    </button>
                  )}
                  {pipeline.status === 'paused' && (
                    <button className="btn-outline small">
                      <Play size={14} />
                      Resume
                    </button>
                  )}
                  {pipeline.status !== 'running' && (
                    <button className="btn-primary small">
                      <Play size={14} />
                      Run Now
                    </button>
                  )}
                  <button className="btn-outline small">
                    <Eye size={14} />
                    View Logs
                  </button>
                  <button className="btn-outline small">
                    <Edit size={14} />
                    Edit
                  </button>
                  <button className="btn-outline small">
                    <Settings size={14} />
                    Configure
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRunsSection = () => (
    <div className="runs-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search runs..." />
          </div>
          <select defaultValue="all">
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="runs-table">
        <div className="table-header">
          <span>Pipeline</span>
          <span>Status</span>
          <span>Started</span>
          <span>Duration</span>
          <span>Triggered By</span>
          <span>Records</span>
          <span>Actions</span>
        </div>
        {RECENT_RUNS.map(run => (
          <div key={run.id} className={`table-row ${run.status}`}>
            <div className="pipeline-cell">
              <Workflow size={16} />
              <span>{run.pipelineName}</span>
            </div>
            <div className={`status-cell ${run.status}`}>
              {getStatusIcon(run.status)}
              <span>{run.status}</span>
            </div>
            <span className="time-cell">{new Date(run.startTime).toLocaleString()}</span>
            <span className="duration-cell">{run.duration}</span>
            <span className="trigger-cell">{run.triggeredBy}</span>
            <span className="records-cell">{run.recordsProcessed.toLocaleString()}</span>
            <div className="actions-cell">
              <button className="btn-icon small" title="View Logs">
                <Eye size={14} />
              </button>
              {run.status === 'running' && (
                <button className="btn-icon small" title="Cancel">
                  <Square size={14} />
                </button>
              )}
              {run.status === 'failed' && (
                <button className="btn-icon small" title="Retry">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {RECENT_RUNS.some(r => r.errorMessage) && (
        <div className="error-details">
          <h4><AlertCircle size={16} /> Recent Errors</h4>
          {RECENT_RUNS.filter(r => r.errorMessage).map(run => (
            <div key={run.id} className="error-item">
              <span className="error-pipeline">{run.pipelineName}</span>
              <span className="error-message">{run.errorMessage}</span>
              <span className="error-time">{new Date(run.startTime).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSourcesSection = () => (
    <div className="sources-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search data sources..." />
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary">
            <Plus size={16} />
            Add Source
          </button>
        </div>
      </div>

      <div className="sources-grid">
        {DATA_SOURCES.map(source => (
          <div key={source.id} className={`source-card ${source.status}`}>
            <div className="source-header">
              <span className="source-icon">{getSourceIcon(source.type)}</span>
              <div className="source-info">
                <h4>{source.name}</h4>
                <span className="source-type">{source.type}</span>
              </div>
              <div className={`source-status ${source.status}`}>
                {source.status === 'connected' && <CheckCircle size={14} />}
                {source.status === 'disconnected' && <XCircle size={14} />}
                {source.status === 'error' && <AlertCircle size={14} />}
                <span>{source.status}</span>
              </div>
            </div>

            <div className="source-connection">
              <Link2 size={14} />
              <span>{source.connection}</span>
              <button className="btn-icon small">
                <Copy size={12} />
              </button>
            </div>

            {source.schema && (
              <div className="source-schema">
                <Database size={14} />
                <span>Schema: {source.schema}</span>
              </div>
            )}

            <div className="source-footer">
              <span className="last-sync">
                <RefreshCw size={12} />
                Last sync: {new Date(source.lastSync).toLocaleString()}
              </span>
              <div className="source-actions">
                <button className="btn-icon small" title="Test Connection">
                  <Zap size={14} />
                </button>
                <button className="btn-icon small" title="Settings">
                  <Settings size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonitoringSection = () => (
    <div className="monitoring-section">
      <div className="monitoring-cards">
        <div className="monitor-card">
          <div className="monitor-header">
            <h4>Pipeline Health</h4>
            <span className="time-range">Last 24 hours</span>
          </div>
          <div className="health-chart">
            <div className="health-bar">
              <div className="health-segment success" style={{ width: '85%' }}></div>
              <div className="health-segment failed" style={{ width: '8%' }}></div>
              <div className="health-segment pending" style={{ width: '7%' }}></div>
            </div>
            <div className="health-legend">
              <span><span className="dot success"></span> Success (85%)</span>
              <span><span className="dot failed"></span> Failed (8%)</span>
              <span><span className="dot pending"></span> Running (7%)</span>
            </div>
          </div>
        </div>

        <div className="monitor-card">
          <div className="monitor-header">
            <h4>Data Volume</h4>
            <span className="time-range">Last 7 days</span>
          </div>
          <div className="volume-chart">
            {[65, 78, 45, 89, 92, 76, 85].map((value, i) => (
              <div key={i} className="volume-bar">
                <div className="bar-fill" style={{ height: `${value}%` }}></div>
                <span className="bar-label">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
              </div>
            ))}
          </div>
          <div className="volume-total">
            <span className="big-number">2.4 TB</span>
            <span className="label">processed this week</span>
          </div>
        </div>

        <div className="monitor-card">
          <div className="monitor-header">
            <h4>Active Alerts</h4>
          </div>
          <div className="alerts-list">
            <div className="alert-item critical">
              <AlertCircle size={16} />
              <div className="alert-info">
                <span className="alert-title">Data Quality Check Failed</span>
                <span className="alert-desc">3 tables have &gt;5% null values</span>
              </div>
              <span className="alert-time">2h ago</span>
            </div>
            <div className="alert-item warning">
              <AlertCircle size={16} />
              <div className="alert-info">
                <span className="alert-title">Slow Pipeline Execution</span>
                <span className="alert-desc">ml-feature-pipeline took 45% longer</span>
              </div>
              <span className="alert-time">5h ago</span>
            </div>
            <div className="alert-item info">
              <AlertCircle size={16} />
              <div className="alert-info">
                <span className="alert-title">Source Connection Restored</span>
                <span className="alert-desc">External API back online</span>
              </div>
              <span className="alert-time">12h ago</span>
            </div>
          </div>
        </div>

        <div className="monitor-card">
          <div className="monitor-header">
            <h4>Resource Usage</h4>
          </div>
          <div className="resource-meters">
            <div className="meter">
              <div className="meter-label">
                <Cpu size={14} />
                <span>CPU</span>
              </div>
              <div className="meter-bar">
                <div className="meter-fill" style={{ width: '67%' }}></div>
              </div>
              <span className="meter-value">67%</span>
            </div>
            <div className="meter">
              <div className="meter-label">
                <Box size={14} />
                <span>Memory</span>
              </div>
              <div className="meter-bar">
                <div className="meter-fill" style={{ width: '54%' }}></div>
              </div>
              <span className="meter-value">54%</span>
            </div>
            <div className="meter">
              <div className="meter-label">
                <Database size={14} />
                <span>Storage</span>
              </div>
              <div className="meter-bar">
                <div className="meter-fill high" style={{ width: '82%' }}></div>
              </div>
              <span className="meter-value">82%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="data-pipeline">
      <div className="dp__header">
        <div className="dp__title-section">
          <div className="dp__icon">
            <GitBranch size={28} />
          </div>
          <div>
            <h1>Data Pipeline Manager</h1>
            <p>Orchestrate and monitor your data workflows</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Create Pipeline
          </button>
        </div>
      </div>

      <div className="dp__stats">
        <div className="stat-card">
          <div className="stat-icon pipelines-icon">
            <Workflow size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{pipelines.length}</span>
            <span className="stat-label">Total Pipelines</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon running-icon">
            <Loader2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningPipelines}</span>
            <span className="stat-label">Running Now</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{failedPipelines}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sources-icon">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{connectedSources}/{DATA_SOURCES.length}</span>
            <span className="stat-label">Sources Connected</span>
          </div>
        </div>
      </div>

      <div className="dp__tabs">
        <button 
          className={`tab-btn ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          <Workflow size={16} />
          Pipelines
          <span className="tab-badge">{pipelines.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => setActiveTab('runs')}
        >
          <Activity size={16} />
          Recent Runs
          <span className="tab-badge">{RECENT_RUNS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <Database size={16} />
          Data Sources
          <span className="tab-badge">{DATA_SOURCES.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <BarChart3 size={16} />
          Monitoring
        </button>
      </div>

      <div className="dp__content">
        {activeTab === 'pipelines' && renderPipelinesSection()}
        {activeTab === 'runs' && renderRunsSection()}
        {activeTab === 'sources' && renderSourcesSection()}
        {activeTab === 'monitoring' && renderMonitoringSection()}
      </div>
    </div>
  );
}
