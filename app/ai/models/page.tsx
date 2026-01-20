'use client';

import React, { useState } from 'react';
import { 
  Brain, Box, GitBranch, Play, Pause, Clock, Activity,
  Tag, Download, Upload, Trash2, RefreshCw, Settings,
  Search, Filter, Plus, ChevronDown, ChevronRight, X,
  CheckCircle, AlertCircle, AlertTriangle, Info,
  Server, Database, Cpu, BarChart3, TrendingUp, TrendingDown,
  Eye, Edit3, Copy, MoreHorizontal, ExternalLink, Lock,
  Unlock, Archive, RotateCcw, Zap, Target, History,
  FileText, Code, Layers, Cloud, Share2, Star, Globe
} from 'lucide-react';
import './model-registry.css';

interface MLModel {
  id: string;
  name: string;
  description: string;
  framework: 'pytorch' | 'tensorflow' | 'sklearn' | 'xgboost' | 'onnx' | 'custom';
  task: string;
  version: string;
  stage: 'development' | 'staging' | 'production' | 'archived';
  status: 'ready' | 'training' | 'validating' | 'failed';
  metrics: ModelMetrics;
  artifacts: ModelArtifact[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  deployments: number;
  isRegistered: boolean;
}

interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  mse?: number;
  mae?: number;
  latency?: number;
  throughput?: number;
  customMetrics?: Record<string, number>;
}

interface ModelArtifact {
  id: string;
  name: string;
  type: 'weights' | 'config' | 'tokenizer' | 'preprocessor' | 'metadata';
  size: string;
  path: string;
}

interface ModelVersion {
  version: string;
  stage: string;
  createdAt: string;
  metrics: ModelMetrics;
  commit?: string;
  notes?: string;
}

interface Experiment {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  startedAt: string;
  duration?: string;
  metrics: ModelMetrics;
  hyperparameters: Record<string, string | number>;
  dataset: string;
}

interface Deployment {
  id: string;
  modelName: string;
  modelVersion: string;
  endpoint: string;
  environment: 'production' | 'staging' | 'development';
  status: 'running' | 'stopped' | 'deploying' | 'failed';
  replicas: number;
  traffic: number;
  latency: number;
  requestsPerSec: number;
  createdAt: string;
}

type TabType = 'models' | 'experiments' | 'deployments' | 'compare' | 'lineage';

const MODELS: MLModel[] = [
  {
    id: 'model-1',
    name: 'fraud-detection-v3',
    description: 'Real-time fraud detection model for payment transactions',
    framework: 'xgboost',
    task: 'Binary Classification',
    version: '3.2.1',
    stage: 'production',
    status: 'ready',
    metrics: {
      accuracy: 0.9847,
      precision: 0.9723,
      recall: 0.9651,
      f1Score: 0.9687,
      auc: 0.9912,
      latency: 12,
      throughput: 15000
    },
    artifacts: [
      { id: 'a1', name: 'model.pkl', type: 'weights', size: '245 MB', path: '/models/fraud/v3.2.1/model.pkl' },
      { id: 'a2', name: 'config.json', type: 'config', size: '4 KB', path: '/models/fraud/v3.2.1/config.json' },
      { id: 'a3', name: 'preprocessor.pkl', type: 'preprocessor', size: '12 MB', path: '/models/fraud/v3.2.1/preprocessor.pkl' }
    ],
    tags: ['fraud', 'payments', 'real-time', 'high-priority'],
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20',
    createdBy: 'data-science-team',
    deployments: 3,
    isRegistered: true
  },
  {
    id: 'model-2',
    name: 'customer-churn-predictor',
    description: 'Predicts customer churn probability based on behavior patterns',
    framework: 'pytorch',
    task: 'Binary Classification',
    version: '2.1.0',
    stage: 'production',
    status: 'ready',
    metrics: {
      accuracy: 0.9234,
      precision: 0.8912,
      recall: 0.9156,
      f1Score: 0.9032,
      auc: 0.9456,
      latency: 45,
      throughput: 5000
    },
    artifacts: [
      { id: 'a4', name: 'model.pt', type: 'weights', size: '156 MB', path: '/models/churn/v2.1.0/model.pt' },
      { id: 'a5', name: 'config.yaml', type: 'config', size: '2 KB', path: '/models/churn/v2.1.0/config.yaml' }
    ],
    tags: ['churn', 'customer', 'retention'],
    createdAt: '2024-02-01',
    updatedAt: '2024-03-15',
    createdBy: 'ml-platform',
    deployments: 2,
    isRegistered: true
  },
  {
    id: 'model-3',
    name: 'product-recommender-v4',
    description: 'Collaborative filtering model for personalized product recommendations',
    framework: 'tensorflow',
    task: 'Recommendation',
    version: '4.0.0',
    stage: 'staging',
    status: 'validating',
    metrics: {
      precision: 0.8234,
      recall: 0.7845,
      latency: 85,
      throughput: 2500
    },
    artifacts: [
      { id: 'a6', name: 'saved_model', type: 'weights', size: '1.2 GB', path: '/models/recommender/v4.0.0/' },
      { id: 'a7', name: 'embeddings.npy', type: 'metadata', size: '450 MB', path: '/models/recommender/v4.0.0/embeddings.npy' }
    ],
    tags: ['recommendation', 'e-commerce', 'personalization'],
    createdAt: '2024-03-10',
    updatedAt: '2024-03-22',
    createdBy: 'recommender-team',
    deployments: 1,
    isRegistered: true
  },
  {
    id: 'model-4',
    name: 'sentiment-analyzer',
    description: 'Multi-language sentiment analysis for customer reviews',
    framework: 'pytorch',
    task: 'Text Classification',
    version: '1.5.2',
    stage: 'production',
    status: 'ready',
    metrics: {
      accuracy: 0.9123,
      f1Score: 0.8956,
      latency: 120,
      throughput: 1000
    },
    artifacts: [
      { id: 'a8', name: 'model.pt', type: 'weights', size: '420 MB', path: '/models/sentiment/v1.5.2/model.pt' },
      { id: 'a9', name: 'tokenizer', type: 'tokenizer', size: '28 MB', path: '/models/sentiment/v1.5.2/tokenizer/' }
    ],
    tags: ['nlp', 'sentiment', 'multilingual'],
    createdAt: '2024-01-20',
    updatedAt: '2024-02-28',
    createdBy: 'nlp-team',
    deployments: 4,
    isRegistered: true
  },
  {
    id: 'model-5',
    name: 'demand-forecasting',
    description: 'Time series forecasting for inventory demand prediction',
    framework: 'sklearn',
    task: 'Regression',
    version: '2.0.0-beta',
    stage: 'development',
    status: 'training',
    metrics: {
      mse: 0.0234,
      mae: 0.1123,
      latency: 250
    },
    artifacts: [
      { id: 'a10', name: 'model.joblib', type: 'weights', size: '89 MB', path: '/models/forecast/v2.0.0/model.joblib' }
    ],
    tags: ['forecasting', 'inventory', 'time-series'],
    createdAt: '2024-03-18',
    updatedAt: '2024-03-23',
    createdBy: 'forecasting-team',
    deployments: 0,
    isRegistered: false
  },
  {
    id: 'model-6',
    name: 'image-classifier-resnet',
    description: 'Product image classification using ResNet architecture',
    framework: 'pytorch',
    task: 'Image Classification',
    version: '1.2.0',
    stage: 'archived',
    status: 'ready',
    metrics: {
      accuracy: 0.9456,
      precision: 0.9312,
      recall: 0.9234,
      f1Score: 0.9273,
      latency: 180,
      throughput: 500
    },
    artifacts: [
      { id: 'a11', name: 'resnet50.pt', type: 'weights', size: '98 MB', path: '/models/image/v1.2.0/resnet50.pt' }
    ],
    tags: ['vision', 'classification', 'product'],
    createdAt: '2023-11-05',
    updatedAt: '2024-01-10',
    createdBy: 'vision-team',
    deployments: 0,
    isRegistered: true
  }
];

const EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-1',
    name: 'fraud-detection-hyperopt-v3.3',
    model: 'fraud-detection-v3',
    status: 'running',
    startedAt: '2 hours ago',
    metrics: {
      accuracy: 0.9867,
      precision: 0.9756,
      recall: 0.9689,
      auc: 0.9934
    },
    hyperparameters: {
      n_estimators: 500,
      max_depth: 12,
      learning_rate: 0.05,
      subsample: 0.8
    },
    dataset: 'transactions_2024_q1'
  },
  {
    id: 'exp-2',
    name: 'churn-lstm-experiment',
    model: 'customer-churn-predictor',
    status: 'completed',
    startedAt: '1 day ago',
    duration: '4h 23m',
    metrics: {
      accuracy: 0.9312,
      precision: 0.9023,
      recall: 0.9245,
      f1Score: 0.9133
    },
    hyperparameters: {
      hidden_size: 256,
      num_layers: 3,
      dropout: 0.3,
      learning_rate: 0.001
    },
    dataset: 'customer_behavior_v2'
  },
  {
    id: 'exp-3',
    name: 'recommender-transformer-test',
    model: 'product-recommender-v4',
    status: 'failed',
    startedAt: '6 hours ago',
    duration: '1h 45m',
    metrics: {},
    hyperparameters: {
      num_heads: 8,
      embed_dim: 512,
      num_layers: 6
    },
    dataset: 'product_interactions_full'
  },
  {
    id: 'exp-4',
    name: 'sentiment-multilingual-finetune',
    model: 'sentiment-analyzer',
    status: 'queued',
    startedAt: 'Pending',
    metrics: {},
    hyperparameters: {
      base_model: 'xlm-roberta-base',
      epochs: 10,
      batch_size: 32,
      learning_rate: 2e-5
    },
    dataset: 'multilingual_reviews_v3'
  }
];

const DEPLOYMENTS: Deployment[] = [
  {
    id: 'deploy-1',
    modelName: 'fraud-detection-v3',
    modelVersion: '3.2.1',
    endpoint: '/api/v1/models/fraud/predict',
    environment: 'production',
    status: 'running',
    replicas: 5,
    traffic: 100,
    latency: 12,
    requestsPerSec: 8450,
    createdAt: '2024-02-15'
  },
  {
    id: 'deploy-2',
    modelName: 'customer-churn-predictor',
    modelVersion: '2.1.0',
    endpoint: '/api/v1/models/churn/predict',
    environment: 'production',
    status: 'running',
    replicas: 3,
    traffic: 100,
    latency: 45,
    requestsPerSec: 2340,
    createdAt: '2024-03-01'
  },
  {
    id: 'deploy-3',
    modelName: 'product-recommender-v4',
    modelVersion: '4.0.0',
    endpoint: '/api/v1/models/recommender/predict',
    environment: 'staging',
    status: 'running',
    replicas: 2,
    traffic: 20,
    latency: 92,
    requestsPerSec: 450,
    createdAt: '2024-03-20'
  },
  {
    id: 'deploy-4',
    modelName: 'sentiment-analyzer',
    modelVersion: '1.5.2',
    endpoint: '/api/v1/models/sentiment/predict',
    environment: 'production',
    status: 'running',
    replicas: 4,
    traffic: 100,
    latency: 125,
    requestsPerSec: 1890,
    createdAt: '2024-01-25'
  },
  {
    id: 'deploy-5',
    modelName: 'fraud-detection-v3',
    modelVersion: '3.1.0',
    endpoint: '/api/v1/models/fraud-legacy/predict',
    environment: 'production',
    status: 'stopped',
    replicas: 0,
    traffic: 0,
    latency: 15,
    requestsPerSec: 0,
    createdAt: '2024-01-10'
  }
];

export default function ModelRegistryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('models');
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareModels, setCompareModels] = useState<string[]>([]);

  const filteredModels = MODELS.filter(model => {
    if (stageFilter && model.stage !== stageFilter) return false;
    if (frameworkFilter && model.framework !== frameworkFilter) return false;
    if (searchQuery && !model.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case 'pytorch': return '🔥';
      case 'tensorflow': return '🧠';
      case 'sklearn': return '📊';
      case 'xgboost': return '⚡';
      case 'onnx': return '🔗';
      default: return '🤖';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'production': return 'production';
      case 'staging': return 'staging';
      case 'development': return 'development';
      case 'archived': return 'archived';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle size={14} className="status-icon ready" />;
      case 'training': return <RefreshCw size={14} className="status-icon training" />;
      case 'validating': return <AlertCircle size={14} className="status-icon validating" />;
      case 'failed': return <AlertTriangle size={14} className="status-icon failed" />;
      case 'running': return <Play size={14} className="status-icon running" />;
      case 'completed': return <CheckCircle size={14} className="status-icon completed" />;
      case 'queued': return <Clock size={14} className="status-icon queued" />;
      case 'stopped': return <Pause size={14} className="status-icon stopped" />;
      case 'deploying': return <RefreshCw size={14} className="status-icon deploying" />;
      default: return null;
    }
  };

  const formatMetric = (value: number | undefined, isPercent = true): string => {
    if (value === undefined) return 'N/A';
    return isPercent ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderModels = () => (
    <div className="models-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search models..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
            <option value="archived">Archived</option>
          </select>
          <select value={frameworkFilter} onChange={(e) => setFrameworkFilter(e.target.value)}>
            <option value="">All Frameworks</option>
            <option value="pytorch">PyTorch</option>
            <option value="tensorflow">TensorFlow</option>
            <option value="sklearn">Scikit-learn</option>
            <option value="xgboost">XGBoost</option>
            <option value="onnx">ONNX</option>
          </select>
        </div>
        <div className="toolbar-actions">
          {compareModels.length > 0 && (
            <button 
              className="btn-outline"
              onClick={() => setActiveTab('compare')}
            >
              <BarChart3 size={16} />
              Compare ({compareModels.length})
            </button>
          )}
          <button className="btn-primary">
            <Upload size={16} />
            Register Model
          </button>
        </div>
      </div>

      <div className="models-grid">
        {filteredModels.map(model => (
          <div 
            key={model.id} 
            className={`model-card ${model.stage} ${selectedModel?.id === model.id ? 'selected' : ''}`}
            onClick={() => setSelectedModel(model)}
          >
            <div className="model-card-header">
              <div className="model-framework">
                <span className="framework-icon">{getFrameworkIcon(model.framework)}</span>
                <span className="framework-name">{model.framework}</span>
              </div>
              <div className="model-actions">
                <input 
                  type="checkbox"
                  checked={compareModels.includes(model.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCompareModels([...compareModels, model.id]);
                    } else {
                      setCompareModels(compareModels.filter(id => id !== model.id));
                    }
                  }}
                />
                <button className="btn-icon small" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            <h4 className="model-name">{model.name}</h4>
            <p className="model-description">{model.description}</p>

            <div className="model-badges">
              <span className={`stage-badge ${getStageColor(model.stage)}`}>
                {model.stage}
              </span>
              <span className={`status-badge ${model.status}`}>
                {getStatusIcon(model.status)}
                {model.status}
              </span>
              <span className="version-badge">v{model.version}</span>
            </div>

            <div className="model-metrics-preview">
              {model.metrics.accuracy !== undefined && (
                <div className="metric-item">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{formatMetric(model.metrics.accuracy)}</span>
                </div>
              )}
              {model.metrics.f1Score !== undefined && (
                <div className="metric-item">
                  <span className="metric-label">F1 Score</span>
                  <span className="metric-value">{formatMetric(model.metrics.f1Score)}</span>
                </div>
              )}
              {model.metrics.latency !== undefined && (
                <div className="metric-item">
                  <span className="metric-label">Latency</span>
                  <span className="metric-value">{model.metrics.latency}ms</span>
                </div>
              )}
            </div>

            <div className="model-tags">
              {model.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
              {model.tags.length > 3 && (
                <span className="tag more">+{model.tags.length - 3}</span>
              )}
            </div>

            <div className="model-footer">
              <span className="deployments">
                <Server size={14} />
                {model.deployments} deployment{model.deployments !== 1 ? 's' : ''}
              </span>
              <span className="updated">Updated {model.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedModel && (
        <div className="model-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="framework-icon">{getFrameworkIcon(selectedModel.framework)}</span>
              <h3>{selectedModel.name}</h3>
            </div>
            <button className="close-btn" onClick={() => setSelectedModel(null)}>
              <X size={20} />
            </button>
          </div>

          <div className="panel-content">
            <div className="detail-section">
              <h4>Overview</h4>
              <p>{selectedModel.description}</p>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Task</span>
                  <span className="detail-value">{selectedModel.task}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Version</span>
                  <span className="detail-value">v{selectedModel.version}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Framework</span>
                  <span className="detail-value">{selectedModel.framework}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By</span>
                  <span className="detail-value">{selectedModel.createdBy}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Metrics</h4>
              <div className="metrics-grid">
                {Object.entries(selectedModel.metrics).map(([key, value]) => (
                  <div key={key} className="metric-card">
                    <span className="metric-label">{key}</span>
                    <span className="metric-value">
                      {typeof value === 'number' 
                        ? key.includes('latency') || key.includes('throughput') 
                          ? `${value}${key.includes('latency') ? 'ms' : '/s'}`
                          : formatMetric(value, value < 1)
                        : value
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4>Artifacts</h4>
              <div className="artifacts-list">
                {selectedModel.artifacts.map(artifact => (
                  <div key={artifact.id} className="artifact-item">
                    <FileText size={16} />
                    <div className="artifact-info">
                      <span className="artifact-name">{artifact.name}</span>
                      <span className="artifact-path">{artifact.path}</span>
                    </div>
                    <span className="artifact-size">{artifact.size}</span>
                    <button className="btn-icon small">
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn-outline">
                <History size={16} />
                View History
              </button>
              <button className="btn-outline">
                <GitBranch size={16} />
                Lineage
              </button>
              <button className="btn-primary">
                <Server size={16} />
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExperiments = () => (
    <div className="experiments-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search experiments..." />
          </div>
          <select>
            <option value="">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Experiment
        </button>
      </div>

      <div className="experiments-list">
        {EXPERIMENTS.map(exp => (
          <div key={exp.id} className={`experiment-card ${exp.status}`}>
            <div className="exp-header">
              <div className="exp-status">
                {getStatusIcon(exp.status)}
                <span className={`status-text ${exp.status}`}>{exp.status}</span>
              </div>
              <button className="btn-icon small">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <h4>{exp.name}</h4>
            <p className="exp-model">
              <Box size={14} />
              {exp.model}
            </p>

            <div className="exp-meta">
              <span className="meta-item">
                <Clock size={14} />
                Started {exp.startedAt}
              </span>
              {exp.duration && (
                <span className="meta-item">
                  <Activity size={14} />
                  Duration: {exp.duration}
                </span>
              )}
              <span className="meta-item">
                <Database size={14} />
                {exp.dataset}
              </span>
            </div>

            {Object.keys(exp.metrics).length > 0 && (
              <div className="exp-metrics">
                {Object.entries(exp.metrics).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="exp-metric">
                    <span className="metric-label">{key}</span>
                    <span className="metric-value">{formatMetric(value as number)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="exp-params">
              <span className="params-label">Hyperparameters:</span>
              <div className="params-list">
                {Object.entries(exp.hyperparameters).slice(0, 3).map(([key, value]) => (
                  <span key={key} className="param-tag">
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>

            <div className="exp-actions">
              <button className="btn-outline small">
                <Eye size={14} />
                View Details
              </button>
              {exp.status === 'running' && (
                <button className="btn-outline small danger">
                  <Pause size={14} />
                  Stop
                </button>
              )}
              {exp.status === 'completed' && (
                <button className="btn-primary small">
                  <Upload size={14} />
                  Register Model
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeployments = () => (
    <div className="deployments-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <select>
            <option value="">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
          <select>
            <option value="">All Status</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="deploying">Deploying</option>
          </select>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          New Deployment
        </button>
      </div>

      <div className="deployments-table">
        <div className="table-header">
          <span>Model</span>
          <span>Version</span>
          <span>Environment</span>
          <span>Status</span>
          <span>Replicas</span>
          <span>Traffic</span>
          <span>Latency</span>
          <span>RPS</span>
          <span>Actions</span>
        </div>
        {DEPLOYMENTS.map(deploy => (
          <div key={deploy.id} className={`table-row ${deploy.status}`}>
            <span className="model-cell">
              <Box size={16} />
              {deploy.modelName}
            </span>
            <span className="version-cell">v{deploy.modelVersion}</span>
            <span className={`env-cell ${deploy.environment}`}>
              {deploy.environment}
            </span>
            <span className={`status-cell ${deploy.status}`}>
              {getStatusIcon(deploy.status)}
              {deploy.status}
            </span>
            <span className="replicas-cell">{deploy.replicas}</span>
            <span className="traffic-cell">{deploy.traffic}%</span>
            <span className="latency-cell">{deploy.latency}ms</span>
            <span className="rps-cell">{formatNumber(deploy.requestsPerSec)}</span>
            <span className="actions-cell">
              {deploy.status === 'running' ? (
                <button className="btn-icon small" title="Stop">
                  <Pause size={14} />
                </button>
              ) : (
                <button className="btn-icon small" title="Start">
                  <Play size={14} />
                </button>
              )}
              <button className="btn-icon small" title="Scale">
                <Layers size={14} />
              </button>
              <button className="btn-icon small" title="Logs">
                <FileText size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="deployment-metrics">
        <div className="metric-card large">
          <h4>Total Requests (24h)</h4>
          <span className="big-value">{formatNumber(12450000)}</span>
          <span className="trend up">
            <TrendingUp size={16} />
            +12.5% vs yesterday
          </span>
        </div>
        <div className="metric-card large">
          <h4>Average Latency</h4>
          <span className="big-value">45ms</span>
          <span className="trend down">
            <TrendingDown size={16} />
            -8.2% vs yesterday
          </span>
        </div>
        <div className="metric-card large">
          <h4>Success Rate</h4>
          <span className="big-value success">99.97%</span>
          <span className="trend stable">
            Stable
          </span>
        </div>
        <div className="metric-card large">
          <h4>Active Deployments</h4>
          <span className="big-value">{DEPLOYMENTS.filter(d => d.status === 'running').length}</span>
          <span className="sub-value">of {DEPLOYMENTS.length} total</span>
        </div>
      </div>
    </div>
  );

  const renderCompare = () => {
    const modelsToCompare = MODELS.filter(m => compareModels.includes(m.id));
    
    return (
      <div className="compare-section">
        <div className="section-toolbar">
          <h3>Model Comparison</h3>
          <button className="btn-outline" onClick={() => setCompareModels([])}>
            <X size={16} />
            Clear Selection
          </button>
        </div>

        {modelsToCompare.length < 2 ? (
          <div className="empty-compare">
            <BarChart3 size={48} />
            <h4>Select models to compare</h4>
            <p>Choose at least 2 models from the Models tab to compare their metrics</p>
          </div>
        ) : (
          <div className="compare-table">
            <div className="compare-header">
              <div className="compare-cell header">Metric</div>
              {modelsToCompare.map(m => (
                <div key={m.id} className="compare-cell header">
                  <span className="model-name">{m.name}</span>
                  <span className="model-version">v{m.version}</span>
                </div>
              ))}
            </div>

            {['accuracy', 'precision', 'recall', 'f1Score', 'auc', 'latency', 'throughput'].map(metric => (
              <div key={metric} className="compare-row">
                <div className="compare-cell label">{metric}</div>
                {modelsToCompare.map(m => {
                  const value = m.metrics[metric as keyof ModelMetrics];
                  const isLatency = metric === 'latency';
                  const isThroughput = metric === 'throughput';
                  return (
                    <div key={m.id} className="compare-cell value">
                      {value !== undefined 
                        ? isLatency ? `${value}ms` 
                          : isThroughput ? `${formatNumber(value as number)}/s`
                          : formatMetric(value as number)
                        : 'N/A'
                      }
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLineage = () => (
    <div className="lineage-section">
      <div className="lineage-placeholder">
        <GitBranch size={48} />
        <h4>Model Lineage Visualization</h4>
        <p>Track the complete lineage of your models including data sources, transformations, and version history</p>
        <button className="btn-primary">
          <Eye size={16} />
          View Lineage Graph
        </button>
      </div>
    </div>
  );

  return (
    <div className="model-registry">
      <header className="mr__header">
        <div className="mr__title-section">
          <div className="mr__icon">
            <Brain size={28} />
          </div>
          <div>
            <h1>ML Model Registry</h1>
            <p>Centralized model management and versioning</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary">
            <Upload size={16} />
            Register Model
          </button>
        </div>
      </header>

      <div className="mr__stats">
        <div className="stat-card">
          <div className="stat-icon models-icon">
            <Box size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{MODELS.length}</span>
            <span className="stat-label">Registered Models</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon production-icon">
            <Server size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{MODELS.filter(m => m.stage === 'production').length}</span>
            <span className="stat-label">In Production</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon experiments-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{EXPERIMENTS.filter(e => e.status === 'running').length}</span>
            <span className="stat-label">Running Experiments</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon deployments-icon">
            <Cloud size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{DEPLOYMENTS.filter(d => d.status === 'running').length}</span>
            <span className="stat-label">Active Deployments</span>
          </div>
        </div>
      </div>

      <nav className="mr__tabs">
        <button 
          className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          <Box size={18} />
          Models
          <span className="tab-badge">{MODELS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'experiments' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiments')}
        >
          <Activity size={18} />
          Experiments
          <span className="tab-badge">{EXPERIMENTS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'deployments' ? 'active' : ''}`}
          onClick={() => setActiveTab('deployments')}
        >
          <Cloud size={18} />
          Deployments
          <span className="tab-badge">{DEPLOYMENTS.filter(d => d.status === 'running').length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <BarChart3 size={18} />
          Compare
          {compareModels.length > 0 && <span className="tab-badge">{compareModels.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'lineage' ? 'active' : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          <GitBranch size={18} />
          Lineage
        </button>
      </nav>

      <main className="mr__content">
        {activeTab === 'models' && renderModels()}
        {activeTab === 'experiments' && renderExperiments()}
        {activeTab === 'deployments' && renderDeployments()}
        {activeTab === 'compare' && renderCompare()}
        {activeTab === 'lineage' && renderLineage()}
      </main>
    </div>
  );
}
