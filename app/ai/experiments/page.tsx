'use client';

import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  GitBranch, 
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  RefreshCw,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  StarOff,
  GitCompare,
  Tag,
  User,
  Calendar,
  Activity,
  Zap,
  Settings,
  Eye,
  Copy,
  Archive,
  Trash2,
  LineChart,
  Table,
  Grid3X3,
  FileJson
} from 'lucide-react';
import './experiment-tracking.css';

// Interfaces
interface ExperimentMetric {
  name: string;
  value: number;
  baseline?: number;
  unit?: string;
  higherIsBetter: boolean;
}

interface ExperimentParameter {
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
}

interface ExperimentArtifact {
  name: string;
  type: 'model' | 'plot' | 'data' | 'config';
  size: string;
  path: string;
}

interface ExperimentRun {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: string;
  endTime?: string;
  duration: string;
  metrics: ExperimentMetric[];
  parameters: ExperimentParameter[];
  artifacts: ExperimentArtifact[];
  tags: string[];
  author: string;
  notes?: string;
  parentRunId?: string;
  isBaseline?: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  projectId: string;
  status: 'active' | 'completed' | 'archived';
  runs: ExperimentRun[];
  baselineRunId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  owner: string;
}

// Sample Data
const SAMPLE_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-001',
    name: 'fraud-detection-hyperparameter-sweep',
    description: 'Hyperparameter optimization for fraud detection model using grid search and Bayesian optimization',
    projectId: 'fraud-detection',
    status: 'active',
    baselineRunId: 'run-003',
    tags: ['hyperparameter-tuning', 'xgboost', 'production'],
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-28T14:22:00Z',
    owner: 'Maria Chen',
    runs: [
      {
        id: 'run-001',
        name: 'xgb-lr-0.1-depth-6',
        status: 'running',
        startTime: '2025-01-28T14:20:00Z',
        duration: '2h 15m',
        author: 'Maria Chen',
        tags: ['grid-search', 'v4'],
        metrics: [
          { name: 'auc_roc', value: 0.9542, baseline: 0.9487, higherIsBetter: true },
          { name: 'precision', value: 0.923, baseline: 0.918, higherIsBetter: true },
          { name: 'recall', value: 0.891, baseline: 0.885, higherIsBetter: true },
          { name: 'f1_score', value: 0.907, baseline: 0.901, higherIsBetter: true },
          { name: 'training_time', value: 45.2, baseline: 52.1, unit: 'min', higherIsBetter: false }
        ],
        parameters: [
          { name: 'learning_rate', value: 0.1, type: 'number' },
          { name: 'max_depth', value: 6, type: 'number' },
          { name: 'n_estimators', value: 500, type: 'number' },
          { name: 'subsample', value: 0.8, type: 'number' },
          { name: 'colsample_bytree', value: 0.8, type: 'number' }
        ],
        artifacts: [
          { name: 'model.pkl', type: 'model', size: '245 MB', path: '/artifacts/run-001/model.pkl' },
          { name: 'roc_curve.png', type: 'plot', size: '156 KB', path: '/artifacts/run-001/roc_curve.png' },
          { name: 'confusion_matrix.png', type: 'plot', size: '89 KB', path: '/artifacts/run-001/confusion_matrix.png' }
        ]
      },
      {
        id: 'run-002',
        name: 'xgb-lr-0.05-depth-8',
        status: 'completed',
        startTime: '2025-01-28T10:00:00Z',
        endTime: '2025-01-28T12:45:00Z',
        duration: '2h 45m',
        author: 'Maria Chen',
        tags: ['grid-search', 'v4'],
        metrics: [
          { name: 'auc_roc', value: 0.9512, baseline: 0.9487, higherIsBetter: true },
          { name: 'precision', value: 0.919, baseline: 0.918, higherIsBetter: true },
          { name: 'recall', value: 0.887, baseline: 0.885, higherIsBetter: true },
          { name: 'f1_score', value: 0.903, baseline: 0.901, higherIsBetter: true },
          { name: 'training_time', value: 68.3, baseline: 52.1, unit: 'min', higherIsBetter: false }
        ],
        parameters: [
          { name: 'learning_rate', value: 0.05, type: 'number' },
          { name: 'max_depth', value: 8, type: 'number' },
          { name: 'n_estimators', value: 800, type: 'number' },
          { name: 'subsample', value: 0.85, type: 'number' },
          { name: 'colsample_bytree', value: 0.75, type: 'number' }
        ],
        artifacts: [
          { name: 'model.pkl', type: 'model', size: '312 MB', path: '/artifacts/run-002/model.pkl' },
          { name: 'feature_importance.png', type: 'plot', size: '124 KB', path: '/artifacts/run-002/feature_importance.png' }
        ]
      },
      {
        id: 'run-003',
        name: 'xgb-baseline-v3-prod',
        status: 'completed',
        startTime: '2025-01-20T08:00:00Z',
        endTime: '2025-01-20T09:30:00Z',
        duration: '1h 30m',
        author: 'James Wilson',
        tags: ['baseline', 'production', 'v3'],
        isBaseline: true,
        notes: 'Current production baseline model',
        metrics: [
          { name: 'auc_roc', value: 0.9487, higherIsBetter: true },
          { name: 'precision', value: 0.918, higherIsBetter: true },
          { name: 'recall', value: 0.885, higherIsBetter: true },
          { name: 'f1_score', value: 0.901, higherIsBetter: true },
          { name: 'training_time', value: 52.1, unit: 'min', higherIsBetter: false }
        ],
        parameters: [
          { name: 'learning_rate', value: 0.08, type: 'number' },
          { name: 'max_depth', value: 7, type: 'number' },
          { name: 'n_estimators', value: 600, type: 'number' },
          { name: 'subsample', value: 0.8, type: 'number' },
          { name: 'colsample_bytree', value: 0.8, type: 'number' }
        ],
        artifacts: [
          { name: 'model.pkl', type: 'model', size: '278 MB', path: '/artifacts/run-003/model.pkl' },
          { name: 'config.yaml', type: 'config', size: '2 KB', path: '/artifacts/run-003/config.yaml' }
        ]
      },
      {
        id: 'run-004',
        name: 'xgb-lr-0.15-depth-5',
        status: 'failed',
        startTime: '2025-01-28T08:00:00Z',
        endTime: '2025-01-28T08:15:00Z',
        duration: '15m',
        author: 'Maria Chen',
        tags: ['grid-search', 'v4'],
        notes: 'Failed due to OOM error on validation step',
        metrics: [
          { name: 'auc_roc', value: 0.0, higherIsBetter: true },
          { name: 'precision', value: 0.0, higherIsBetter: true }
        ],
        parameters: [
          { name: 'learning_rate', value: 0.15, type: 'number' },
          { name: 'max_depth', value: 5, type: 'number' },
          { name: 'n_estimators', value: 1000, type: 'number' }
        ],
        artifacts: []
      }
    ]
  },
  {
    id: 'exp-002',
    name: 'recommendation-model-architecture',
    description: 'Comparing different neural network architectures for product recommendation system',
    projectId: 'recommendation-engine',
    status: 'active',
    tags: ['architecture-search', 'neural-network', 'A/B-test'],
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-27T16:45:00Z',
    owner: 'Alex Thompson',
    runs: [
      {
        id: 'run-005',
        name: 'transformer-base',
        status: 'completed',
        startTime: '2025-01-27T10:00:00Z',
        endTime: '2025-01-27T16:30:00Z',
        duration: '6h 30m',
        author: 'Alex Thompson',
        tags: ['transformer', 'attention'],
        metrics: [
          { name: 'ndcg@10', value: 0.412, higherIsBetter: true },
          { name: 'hit_rate@10', value: 0.285, higherIsBetter: true },
          { name: 'mrr', value: 0.178, higherIsBetter: true },
          { name: 'latency_p99', value: 45, unit: 'ms', higherIsBetter: false }
        ],
        parameters: [
          { name: 'model_type', value: 'transformer', type: 'string' },
          { name: 'embedding_dim', value: 256, type: 'number' },
          { name: 'num_heads', value: 8, type: 'number' },
          { name: 'num_layers', value: 4, type: 'number' }
        ],
        artifacts: [
          { name: 'model.pt', type: 'model', size: '1.2 GB', path: '/artifacts/run-005/model.pt' }
        ]
      },
      {
        id: 'run-006',
        name: 'two-tower-large',
        status: 'completed',
        startTime: '2025-01-26T14:00:00Z',
        endTime: '2025-01-26T20:00:00Z',
        duration: '6h',
        author: 'Alex Thompson',
        tags: ['two-tower', 'embedding'],
        metrics: [
          { name: 'ndcg@10', value: 0.398, higherIsBetter: true },
          { name: 'hit_rate@10', value: 0.271, higherIsBetter: true },
          { name: 'mrr', value: 0.165, higherIsBetter: true },
          { name: 'latency_p99', value: 12, unit: 'ms', higherIsBetter: false }
        ],
        parameters: [
          { name: 'model_type', value: 'two-tower', type: 'string' },
          { name: 'embedding_dim', value: 512, type: 'number' },
          { name: 'hidden_layers', value: '512,256,128', type: 'string' }
        ],
        artifacts: [
          { name: 'user_tower.pt', type: 'model', size: '456 MB', path: '/artifacts/run-006/user_tower.pt' },
          { name: 'item_tower.pt', type: 'model', size: '312 MB', path: '/artifacts/run-006/item_tower.pt' }
        ]
      }
    ]
  },
  {
    id: 'exp-003',
    name: 'sentiment-model-finetuning',
    description: 'Fine-tuning BERT variants for multilingual sentiment analysis',
    projectId: 'nlp-sentiment',
    status: 'completed',
    baselineRunId: 'run-007',
    tags: ['nlp', 'bert', 'multilingual', 'fine-tuning'],
    createdAt: '2025-01-05T11:00:00Z',
    updatedAt: '2025-01-25T09:30:00Z',
    owner: 'Sophie Martin',
    runs: [
      {
        id: 'run-007',
        name: 'mbert-base-multilingual',
        status: 'completed',
        startTime: '2025-01-24T08:00:00Z',
        endTime: '2025-01-25T02:00:00Z',
        duration: '18h',
        author: 'Sophie Martin',
        tags: ['mbert', 'winner'],
        isBaseline: true,
        metrics: [
          { name: 'accuracy', value: 0.892, higherIsBetter: true },
          { name: 'macro_f1', value: 0.878, higherIsBetter: true },
          { name: 'cross_lingual_acc', value: 0.845, higherIsBetter: true }
        ],
        parameters: [
          { name: 'model_name', value: 'bert-base-multilingual-cased', type: 'string' },
          { name: 'learning_rate', value: 2e-5, type: 'number' },
          { name: 'batch_size', value: 32, type: 'number' },
          { name: 'epochs', value: 5, type: 'number' }
        ],
        artifacts: [
          { name: 'model/', type: 'model', size: '680 MB', path: '/artifacts/run-007/model/' }
        ]
      },
      {
        id: 'run-008',
        name: 'xlm-roberta-base',
        status: 'completed',
        startTime: '2025-01-22T10:00:00Z',
        endTime: '2025-01-23T08:00:00Z',
        duration: '22h',
        author: 'Sophie Martin',
        tags: ['xlm-roberta'],
        metrics: [
          { name: 'accuracy', value: 0.905, higherIsBetter: true },
          { name: 'macro_f1', value: 0.891, higherIsBetter: true },
          { name: 'cross_lingual_acc', value: 0.867, higherIsBetter: true }
        ],
        parameters: [
          { name: 'model_name', value: 'xlm-roberta-base', type: 'string' },
          { name: 'learning_rate', value: 1e-5, type: 'number' },
          { name: 'batch_size', value: 16, type: 'number' },
          { name: 'epochs', value: 8, type: 'number' }
        ],
        artifacts: [
          { name: 'model/', type: 'model', size: '1.1 GB', path: '/artifacts/run-008/model/' }
        ]
      }
    ]
  }
];

export default function ExperimentTrackingPage() {
  const [experiments, setExperiments] = useState<Experiment[]>(SAMPLE_EXPERIMENTS);
  const [activeTab, setActiveTab] = useState<'experiments' | 'runs' | 'compare' | 'artifacts'>('experiments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedExperiments, setExpandedExperiments] = useState<Set<string>>(new Set(['exp-001']));
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const toggleExperiment = (expId: string) => {
    const newExpanded = new Set(expandedExperiments);
    if (newExpanded.has(expId)) {
      newExpanded.delete(expId);
    } else {
      newExpanded.add(expId);
    }
    setExpandedExperiments(newExpanded);
  };

  const toggleRunSelection = (runId: string) => {
    const newSelected = new Set(selectedRuns);
    if (newSelected.has(runId)) {
      newSelected.delete(runId);
    } else {
      newSelected.add(runId);
    }
    setSelectedRuns(newSelected);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw size={14} className="status-icon running" />;
      case 'completed': return <CheckCircle size={14} className="status-icon completed" />;
      case 'failed': return <XCircle size={14} className="status-icon failed" />;
      case 'stopped': return <Pause size={14} className="status-icon stopped" />;
      case 'active': return <Activity size={14} className="status-icon active" />;
      case 'archived': return <Archive size={14} className="status-icon archived" />;
      default: return <Clock size={14} className="status-icon" />;
    }
  };

  const getMetricDiff = (metric: ExperimentMetric) => {
    if (!metric.baseline) return null;
    const diff = metric.value - metric.baseline;
    const pctDiff = ((diff / metric.baseline) * 100).toFixed(1);
    const isImproved = metric.higherIsBetter ? diff > 0 : diff < 0;
    const isWorse = metric.higherIsBetter ? diff < 0 : diff > 0;
    
    return {
      diff: diff.toFixed(4),
      pctDiff,
      isImproved,
      isWorse,
      isNeutral: diff === 0
    };
  };

  const stats = {
    totalExperiments: experiments.length,
    activeExperiments: experiments.filter(e => e.status === 'active').length,
    totalRuns: experiments.reduce((sum, e) => sum + e.runs.length, 0),
    runningRuns: experiments.reduce((sum, e) => sum + e.runs.filter(r => r.status === 'running').length, 0),
    completedRuns: experiments.reduce((sum, e) => sum + e.runs.filter(r => r.status === 'completed').length, 0),
    failedRuns: experiments.reduce((sum, e) => sum + e.runs.filter(r => r.status === 'failed').length, 0)
  };

  const allRuns = experiments.flatMap(e => 
    e.runs.map(r => ({ ...r, experimentId: e.id, experimentName: e.name }))
  );

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="experiment-tracking">
      {/* Header */}
      <header className="et__header">
        <div className="et__title-section">
          <div className="et__icon">
            <FlaskConical size={28} />
          </div>
          <div>
            <h1>Experiment Tracking</h1>
            <p>Track, compare, and analyze ML experiments</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            New Experiment
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="et__stats">
        <div className="stat-card">
          <div className="stat-icon experiments-icon">
            <FlaskConical size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalExperiments}</span>
            <span className="stat-label">Total Experiments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeExperiments}</span>
            <span className="stat-label">Active Experiments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon runs-icon">
            <Play size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalRuns}</span>
            <span className="stat-label">Total Runs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon running-icon">
            <RefreshCw size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.runningRuns}</span>
            <span className="stat-label">Running Now</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="et__tabs">
        <button
          className={`tab-btn ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          <FlaskConical size={16} />
          Experiments
          <span className="tab-badge">{stats.totalExperiments}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => setActiveTab('runs')}
        >
          <Play size={16} />
          All Runs
          <span className="tab-badge">{stats.totalRuns}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <GitCompare size={16} />
          Compare
          {selectedRuns.size > 0 && <span className="tab-badge">{selectedRuns.size}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'artifacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('artifacts')}
        >
          <FileJson size={16} />
          Artifacts
        </button>
      </div>

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="experiments-section">
          <div className="section-toolbar">
            <div className="search-filters">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search experiments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="toolbar-actions">
              <button
                className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <Table size={16} />
              </button>
              <button
                className={`btn-icon ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 size={16} />
              </button>
            </div>
          </div>

          <div className="experiments-list">
            {filteredExperiments.map(experiment => (
              <div key={experiment.id} className={`experiment-card ${experiment.status}`}>
                <div 
                  className="experiment-header"
                  onClick={() => toggleExperiment(experiment.id)}
                >
                  <div className="experiment-info">
                    <button className="expand-btn">
                      {expandedExperiments.has(experiment.id) 
                        ? <ChevronDown size={16} />
                        : <ChevronRight size={16} />
                      }
                    </button>
                    <FlaskConical size={20} />
                    <div>
                      <h4>{experiment.name}</h4>
                      <p>{experiment.description}</p>
                    </div>
                  </div>
                  <div className="experiment-status">
                    {getStatusIcon(experiment.status)}
                    <span className={`status-text ${experiment.status}`}>{experiment.status}</span>
                  </div>
                </div>

                <div className="experiment-meta">
                  <div className="meta-item">
                    <Play size={14} />
                    <span>{experiment.runs.length} runs</span>
                  </div>
                  <div className="meta-item">
                    <User size={14} />
                    <span>{experiment.owner}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>Updated {new Date(experiment.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="experiment-tags">
                    {experiment.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {experiment.tags.length > 3 && (
                      <span className="tag-more">+{experiment.tags.length - 3}</span>
                    )}
                  </div>
                </div>

                {expandedExperiments.has(experiment.id) && (
                  <div className="experiment-runs">
                    <div className="runs-header">
                      <span className="col-select"></span>
                      <span className="col-name">Run Name</span>
                      <span className="col-status">Status</span>
                      <span className="col-duration">Duration</span>
                      <span className="col-metrics">Key Metrics</span>
                      <span className="col-actions">Actions</span>
                    </div>
                    {experiment.runs.map(run => (
                      <div 
                        key={run.id} 
                        className={`run-row ${run.status} ${run.isBaseline ? 'baseline' : ''}`}
                      >
                        <div className="col-select">
                          <input
                            type="checkbox"
                            checked={selectedRuns.has(run.id)}
                            onChange={() => toggleRunSelection(run.id)}
                          />
                        </div>
                        <div className="col-name">
                          <div className="run-name">
                            {run.isBaseline && <Star size={14} className="baseline-star" />}
                            <span>{run.name}</span>
                          </div>
                          <div className="run-meta">
                            <span>{run.author}</span>
                            <span>•</span>
                            <span>{new Date(run.startTime).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="col-status">
                          {getStatusIcon(run.status)}
                          <span className={`status-text ${run.status}`}>{run.status}</span>
                        </div>
                        <div className="col-duration">
                          <Clock size={14} />
                          <span>{run.duration}</span>
                        </div>
                        <div className="col-metrics">
                          {run.metrics.slice(0, 3).map(metric => {
                            const diff = getMetricDiff(metric);
                            return (
                              <div key={metric.name} className="metric-item">
                                <span className="metric-name">{metric.name}</span>
                                <span className="metric-value">
                                  {typeof metric.value === 'number' 
                                    ? metric.value.toFixed(metric.value < 1 ? 4 : 2) 
                                    : metric.value}
                                  {metric.unit && <span className="metric-unit">{metric.unit}</span>}
                                </span>
                                {diff && (
                                  <span className={`metric-diff ${diff.isImproved ? 'improved' : diff.isWorse ? 'worse' : ''}`}>
                                    {diff.isImproved ? <ArrowUpRight size={12} /> : diff.isWorse ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                                    {diff.pctDiff}%
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="col-actions">
                          <button className="btn-icon small" title="View details">
                            <Eye size={14} />
                          </button>
                          <button className="btn-icon small" title="Set as baseline">
                            {run.isBaseline ? <Star size={14} /> : <StarOff size={14} />}
                          </button>
                          <button className="btn-icon small" title="More actions">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runs Tab */}
      {activeTab === 'runs' && (
        <div className="runs-section">
          <div className="section-toolbar">
            <div className="search-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search runs..." />
              </div>
              <select>
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
          </div>

          <div className="runs-table">
            <div className="table-header">
              <span>Run Name</span>
              <span>Experiment</span>
              <span>Status</span>
              <span>Started</span>
              <span>Duration</span>
              <span>Author</span>
              <span>Actions</span>
            </div>
            {allRuns.map(run => (
              <div key={run.id} className="table-row">
                <div className="run-cell">
                  <input
                    type="checkbox"
                    checked={selectedRuns.has(run.id)}
                    onChange={() => toggleRunSelection(run.id)}
                  />
                  <span className="run-name-text">
                    {run.isBaseline && <Star size={12} className="baseline-star" />}
                    {run.name}
                  </span>
                </div>
                <div className="experiment-cell">{run.experimentName}</div>
                <div className={`status-cell ${run.status}`}>
                  {getStatusIcon(run.status)}
                  <span>{run.status}</span>
                </div>
                <div className="time-cell">{new Date(run.startTime).toLocaleString()}</div>
                <div className="duration-cell">{run.duration}</div>
                <div className="author-cell">{run.author}</div>
                <div className="actions-cell">
                  <button className="btn-icon small"><Eye size={14} /></button>
                  <button className="btn-icon small"><Copy size={14} /></button>
                  <button className="btn-icon small"><MoreVertical size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="compare-section">
          {selectedRuns.size < 2 ? (
            <div className="compare-empty">
              <GitCompare size={48} />
              <h3>Select runs to compare</h3>
              <p>Select at least 2 runs from the Experiments or Runs tab to compare their metrics and parameters</p>
            </div>
          ) : (
            <div className="compare-content">
              <div className="compare-header">
                <h3>
                  <GitCompare size={20} />
                  Comparing {selectedRuns.size} Runs
                </h3>
                <button 
                  className="btn-outline small"
                  onClick={() => setSelectedRuns(new Set())}
                >
                  Clear Selection
                </button>
              </div>

              <div className="compare-table">
                <div className="compare-row header">
                  <div className="compare-cell label">Metric</div>
                  {Array.from(selectedRuns).map(runId => {
                    const run = allRuns.find(r => r.id === runId);
                    return (
                      <div key={runId} className="compare-cell run-header">
                        <span className="run-name">{run?.name}</span>
                        <span className={`run-status ${run?.status}`}>{run?.status}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Metrics Comparison */}
                {(() => {
                  const selectedRunData = Array.from(selectedRuns).map(id => allRuns.find(r => r.id === id)).filter(Boolean);
                  const allMetricNames = [...new Set(selectedRunData.flatMap(r => r?.metrics.map(m => m.name) || []))];
                  
                  return allMetricNames.map(metricName => (
                    <div key={metricName} className="compare-row">
                      <div className="compare-cell label">{metricName}</div>
                      {selectedRunData.map(run => {
                        const metric = run?.metrics.find(m => m.name === metricName);
                        return (
                          <div key={run?.id} className="compare-cell value">
                            {metric ? (
                              <>
                                <span className="metric-value">
                                  {metric.value.toFixed(metric.value < 1 ? 4 : 2)}
                                  {metric.unit && <span className="unit">{metric.unit}</span>}
                                </span>
                              </>
                            ) : (
                              <span className="no-value">N/A</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>

              {/* Parameters Comparison */}
              <h4 className="compare-section-title">Parameters</h4>
              <div className="compare-table">
                {(() => {
                  const selectedRunData = Array.from(selectedRuns).map(id => allRuns.find(r => r.id === id)).filter(Boolean);
                  const allParamNames = [...new Set(selectedRunData.flatMap(r => r?.parameters.map(p => p.name) || []))];
                  
                  return allParamNames.map(paramName => (
                    <div key={paramName} className="compare-row">
                      <div className="compare-cell label">{paramName}</div>
                      {selectedRunData.map(run => {
                        const param = run?.parameters.find(p => p.name === paramName);
                        return (
                          <div key={run?.id} className="compare-cell value param">
                            {param ? String(param.value) : <span className="no-value">N/A</span>}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Artifacts Tab */}
      {activeTab === 'artifacts' && (
        <div className="artifacts-section">
          <div className="section-toolbar">
            <div className="search-filters">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search artifacts..." />
              </div>
              <select>
                <option value="all">All Types</option>
                <option value="model">Models</option>
                <option value="plot">Plots</option>
                <option value="data">Data</option>
                <option value="config">Configs</option>
              </select>
            </div>
          </div>

          <div className="artifacts-grid">
            {allRuns.flatMap(run => 
              run.artifacts.map(artifact => (
                <div key={`${run.id}-${artifact.name}`} className="artifact-card">
                  <div className="artifact-icon">
                    {artifact.type === 'model' && '🤖'}
                    {artifact.type === 'plot' && '📊'}
                    {artifact.type === 'data' && '📁'}
                    {artifact.type === 'config' && '⚙️'}
                  </div>
                  <div className="artifact-info">
                    <h5>{artifact.name}</h5>
                    <p>{run.name}</p>
                    <div className="artifact-meta">
                      <span className="artifact-type">{artifact.type}</span>
                      <span className="artifact-size">{artifact.size}</span>
                    </div>
                  </div>
                  <div className="artifact-actions">
                    <button className="btn-icon small" title="Download">
                      <Download size={14} />
                    </button>
                    <button className="btn-icon small" title="Preview">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
