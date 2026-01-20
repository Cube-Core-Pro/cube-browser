'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Server,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Settings,
  Terminal,
  BarChart3,
  Activity,
  Database,
  HardDrive,
  Layers,
  GitBranch,
  Calendar,
  User,
  Eye,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  MemoryStick,
  Timer
} from 'lucide-react';
import './training-jobs.css';

interface TrainingJob {
  id: string;
  name: string;
  model: string;
  framework: string;
  status: 'running' | 'completed' | 'failed' | 'queued' | 'stopped' | 'paused';
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  startTime: string;
  estimatedEnd?: string;
  duration: string;
  gpuType: string;
  gpuCount: number;
  gpuUtilization: number;
  memoryUsed: number;
  memoryTotal: number;
  loss: number;
  accuracy: number;
  learningRate: number;
  batchSize: number;
  dataset: string;
  datasetSize: string;
  owner: string;
  tags: string[];
  checkpoint?: string;
  logPath?: string;
  cost: number;
}

interface GPUResource {
  id: string;
  name: string;
  type: string;
  memory: string;
  status: 'available' | 'in-use' | 'reserved' | 'maintenance';
  currentJob?: string;
  utilization: number;
  temperature: number;
  powerUsage: number;
}

interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAccuracy: number;
  valAccuracy: number;
  learningRate: number;
  duration: number;
}

const TRAINING_JOBS: TrainingJob[] = [
  {
    id: 'job-001',
    name: 'fraud-detection-v4-training',
    model: 'FraudDetectionXGBoost',
    framework: 'XGBoost',
    status: 'running',
    progress: 67,
    currentEpoch: 134,
    totalEpochs: 200,
    startTime: '2024-01-15T10:30:00Z',
    estimatedEnd: '2024-01-15T18:45:00Z',
    duration: '6h 15m',
    gpuType: 'NVIDIA A100',
    gpuCount: 4,
    gpuUtilization: 94,
    memoryUsed: 76,
    memoryTotal: 80,
    loss: 0.0234,
    accuracy: 98.76,
    learningRate: 0.0001,
    batchSize: 256,
    dataset: 'transactions-2024-q1',
    datasetSize: '45.2 GB',
    owner: 'ml-team',
    tags: ['fraud', 'production', 'priority'],
    checkpoint: 'checkpoint-134.pt',
    logPath: '/logs/fraud-detection-v4/',
    cost: 124.50
  },
  {
    id: 'job-002',
    name: 'llm-finetune-customer-support',
    model: 'Llama3-8B-LoRA',
    framework: 'PyTorch',
    status: 'running',
    progress: 34,
    currentEpoch: 17,
    totalEpochs: 50,
    startTime: '2024-01-15T08:00:00Z',
    estimatedEnd: '2024-01-16T02:00:00Z',
    duration: '8h 45m',
    gpuType: 'NVIDIA H100',
    gpuCount: 8,
    gpuUtilization: 98,
    memoryUsed: 78,
    memoryTotal: 80,
    loss: 1.2456,
    accuracy: 89.34,
    learningRate: 0.00005,
    batchSize: 32,
    dataset: 'support-conversations-v3',
    datasetSize: '128 GB',
    owner: 'nlp-team',
    tags: ['llm', 'finetuning', 'customer-support'],
    checkpoint: 'checkpoint-17.safetensors',
    logPath: '/logs/llm-finetune/',
    cost: 456.80
  },
  {
    id: 'job-003',
    name: 'image-classifier-resnet-v2',
    model: 'ResNet152V2',
    framework: 'TensorFlow',
    status: 'completed',
    progress: 100,
    currentEpoch: 100,
    totalEpochs: 100,
    startTime: '2024-01-14T20:00:00Z',
    duration: '12h 30m',
    gpuType: 'NVIDIA V100',
    gpuCount: 2,
    gpuUtilization: 0,
    memoryUsed: 0,
    memoryTotal: 32,
    loss: 0.0089,
    accuracy: 99.12,
    learningRate: 0.0001,
    batchSize: 64,
    dataset: 'product-images-v5',
    datasetSize: '89.5 GB',
    owner: 'vision-team',
    tags: ['image', 'classification', 'production'],
    checkpoint: 'final-model.h5',
    logPath: '/logs/image-classifier/',
    cost: 89.20
  },
  {
    id: 'job-004',
    name: 'recommendation-engine-v3',
    model: 'NeuralCF-Transformer',
    framework: 'PyTorch',
    status: 'queued',
    progress: 0,
    currentEpoch: 0,
    totalEpochs: 150,
    startTime: '',
    duration: '-',
    gpuType: 'NVIDIA A100',
    gpuCount: 4,
    gpuUtilization: 0,
    memoryUsed: 0,
    memoryTotal: 80,
    loss: 0,
    accuracy: 0,
    learningRate: 0.001,
    batchSize: 512,
    dataset: 'user-interactions-2024',
    datasetSize: '234 GB',
    owner: 'rec-team',
    tags: ['recommendations', 'transformer'],
    cost: 0
  },
  {
    id: 'job-005',
    name: 'sentiment-multilingual-bert',
    model: 'mBERT-Large',
    framework: 'PyTorch',
    status: 'failed',
    progress: 45,
    currentEpoch: 45,
    totalEpochs: 100,
    startTime: '2024-01-15T06:00:00Z',
    duration: '4h 12m',
    gpuType: 'NVIDIA A100',
    gpuCount: 2,
    gpuUtilization: 0,
    memoryUsed: 0,
    memoryTotal: 80,
    loss: 2.3456,
    accuracy: 67.89,
    learningRate: 0.00002,
    batchSize: 16,
    dataset: 'multilingual-reviews',
    datasetSize: '56 GB',
    owner: 'nlp-team',
    tags: ['sentiment', 'multilingual', 'bert'],
    checkpoint: 'checkpoint-45.pt',
    logPath: '/logs/sentiment-multi/',
    cost: 67.30
  },
  {
    id: 'job-006',
    name: 'object-detection-yolov8',
    model: 'YOLOv8-XL',
    framework: 'PyTorch',
    status: 'paused',
    progress: 78,
    currentEpoch: 234,
    totalEpochs: 300,
    startTime: '2024-01-14T14:00:00Z',
    duration: '18h 45m',
    gpuType: 'NVIDIA V100',
    gpuCount: 4,
    gpuUtilization: 0,
    memoryUsed: 24,
    memoryTotal: 32,
    loss: 0.0567,
    accuracy: 94.56,
    learningRate: 0.0005,
    batchSize: 128,
    dataset: 'coco-custom-2024',
    datasetSize: '156 GB',
    owner: 'vision-team',
    tags: ['detection', 'yolo', 'priority'],
    checkpoint: 'checkpoint-234.pt',
    logPath: '/logs/yolo-detection/',
    cost: 145.60
  }
];

const GPU_RESOURCES: GPUResource[] = [
  { id: 'gpu-001', name: 'Node-01-GPU-0', type: 'NVIDIA H100', memory: '80GB', status: 'in-use', currentJob: 'job-002', utilization: 98, temperature: 72, powerUsage: 650 },
  { id: 'gpu-002', name: 'Node-01-GPU-1', type: 'NVIDIA H100', memory: '80GB', status: 'in-use', currentJob: 'job-002', utilization: 97, temperature: 70, powerUsage: 640 },
  { id: 'gpu-003', name: 'Node-01-GPU-2', type: 'NVIDIA H100', memory: '80GB', status: 'in-use', currentJob: 'job-002', utilization: 98, temperature: 73, powerUsage: 655 },
  { id: 'gpu-004', name: 'Node-01-GPU-3', type: 'NVIDIA H100', memory: '80GB', status: 'in-use', currentJob: 'job-002', utilization: 96, temperature: 71, powerUsage: 635 },
  { id: 'gpu-005', name: 'Node-02-GPU-0', type: 'NVIDIA A100', memory: '80GB', status: 'in-use', currentJob: 'job-001', utilization: 94, temperature: 68, powerUsage: 380 },
  { id: 'gpu-006', name: 'Node-02-GPU-1', type: 'NVIDIA A100', memory: '80GB', status: 'in-use', currentJob: 'job-001', utilization: 93, temperature: 67, powerUsage: 375 },
  { id: 'gpu-007', name: 'Node-02-GPU-2', type: 'NVIDIA A100', memory: '80GB', status: 'in-use', currentJob: 'job-001', utilization: 95, temperature: 69, powerUsage: 385 },
  { id: 'gpu-008', name: 'Node-02-GPU-3', type: 'NVIDIA A100', memory: '80GB', status: 'in-use', currentJob: 'job-001', utilization: 94, temperature: 68, powerUsage: 380 },
  { id: 'gpu-009', name: 'Node-03-GPU-0', type: 'NVIDIA V100', memory: '32GB', status: 'available', utilization: 0, temperature: 35, powerUsage: 45 },
  { id: 'gpu-010', name: 'Node-03-GPU-1', type: 'NVIDIA V100', memory: '32GB', status: 'available', utilization: 0, temperature: 34, powerUsage: 44 },
  { id: 'gpu-011', name: 'Node-03-GPU-2', type: 'NVIDIA V100', memory: '32GB', status: 'reserved', utilization: 0, temperature: 36, powerUsage: 46 },
  { id: 'gpu-012', name: 'Node-03-GPU-3', type: 'NVIDIA V100', memory: '32GB', status: 'maintenance', utilization: 0, temperature: 30, powerUsage: 20 }
];

const SAMPLE_METRICS: TrainingMetrics[] = [
  { epoch: 1, trainLoss: 2.5, valLoss: 2.6, trainAccuracy: 45, valAccuracy: 43, learningRate: 0.001, duration: 180 },
  { epoch: 20, trainLoss: 1.2, valLoss: 1.4, trainAccuracy: 72, valAccuracy: 68, learningRate: 0.001, duration: 175 },
  { epoch: 40, trainLoss: 0.6, valLoss: 0.8, trainAccuracy: 85, valAccuracy: 82, learningRate: 0.0005, duration: 172 },
  { epoch: 60, trainLoss: 0.3, valLoss: 0.45, trainAccuracy: 91, valAccuracy: 88, learningRate: 0.0005, duration: 170 },
  { epoch: 80, trainLoss: 0.15, valLoss: 0.28, trainAccuracy: 95, valAccuracy: 92, learningRate: 0.0001, duration: 168 },
  { epoch: 100, trainLoss: 0.08, valLoss: 0.18, trainAccuracy: 97.5, valAccuracy: 95, learningRate: 0.0001, duration: 165 },
  { epoch: 120, trainLoss: 0.04, valLoss: 0.12, trainAccuracy: 98.5, valAccuracy: 97, learningRate: 0.00005, duration: 163 },
  { epoch: 134, trainLoss: 0.023, valLoss: 0.09, trainAccuracy: 98.76, valAccuracy: 97.8, learningRate: 0.00005, duration: 162 }
];

export default function TrainingJobsPage() {
  const [jobs, setJobs] = useState<TrainingJob[]>(TRAINING_JOBS);
  const [gpuResources, setGpuResources] = useState<GPUResource[]>(GPU_RESOURCES);
  const [activeTab, setActiveTab] = useState<'jobs' | 'queue' | 'resources' | 'metrics' | 'history'>('jobs');
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 100) {
          const newProgress = Math.min(job.progress + 0.1, 100);
          const newEpoch = Math.floor((newProgress / 100) * job.totalEpochs);
          return {
            ...job,
            progress: newProgress,
            currentEpoch: newEpoch,
            loss: Math.max(job.loss * 0.999, 0.001),
            accuracy: Math.min(job.accuracy + 0.001, 99.99)
          };
        }
        return job;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 size={14} className="status-icon running" />;
      case 'completed': return <CheckCircle size={14} className="status-icon completed" />;
      case 'failed': return <XCircle size={14} className="status-icon failed" />;
      case 'queued': return <Clock size={14} className="status-icon queued" />;
      case 'stopped': return <Square size={14} className="status-icon stopped" />;
      case 'paused': return <Pause size={14} className="status-icon paused" />;
      default: return null;
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework.toLowerCase()) {
      case 'pytorch': return '🔥';
      case 'tensorflow': return '🧠';
      case 'xgboost': return '⚡';
      case 'sklearn': return '📊';
      default: return '🤖';
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const queuedJobs = jobs.filter(j => j.status === 'queued').length;
  const availableGpus = gpuResources.filter(g => g.status === 'available').length;
  const totalCost = jobs.reduce((acc, j) => acc + j.cost, 0);

  const renderJobsSection = () => (
    <div className="jobs-section">
      <div className="section-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button 
            className={`btn-icon ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            <RefreshCw size={16} />
          </button>
          <button className="btn-primary" onClick={() => setShowNewJobModal(true)}>
            <Plus size={16} />
            New Training Job
          </button>
        </div>
      </div>

      <div className="jobs-list">
        {filteredJobs.map(job => (
          <div 
            key={job.id} 
            className={`job-card ${job.status}`}
            onClick={() => setSelectedJob(job)}
          >
            <div className="job-header">
              <div className="job-info">
                <span className="framework-icon">{getFrameworkIcon(job.framework)}</span>
                <div>
                  <h4>{job.name}</h4>
                  <p className="job-model">{job.model} • {job.framework}</p>
                </div>
              </div>
              <div className="job-status">
                {getStatusIcon(job.status)}
                <span className={`status-text ${job.status}`}>{job.status}</span>
              </div>
            </div>

            {job.status === 'running' && (
              <div className="progress-section">
                <div className="progress-header">
                  <span>Epoch {job.currentEpoch} / {job.totalEpochs}</span>
                  <span>{job.progress.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                </div>
                <div className="progress-meta">
                  <span><Clock size={12} /> {job.duration}</span>
                  {job.estimatedEnd && <span>ETA: {new Date(job.estimatedEnd).toLocaleTimeString()}</span>}
                </div>
              </div>
            )}

            <div className="job-metrics">
              <div className="metric">
                <span className="metric-label">Loss</span>
                <span className="metric-value">{job.loss.toFixed(4)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">{job.accuracy.toFixed(2)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">GPU</span>
                <span className="metric-value">{job.gpuCount}x {job.gpuType.split(' ')[1]}</span>
              </div>
              <div className="metric">
                <span className="metric-label">GPU Util</span>
                <span className="metric-value">{job.gpuUtilization}%</span>
              </div>
            </div>

            <div className="job-footer">
              <div className="job-tags">
                {job.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="job-cost">${job.cost.toFixed(2)}</div>
            </div>

            <div className="job-actions">
              {job.status === 'running' && (
                <>
                  <button className="btn-icon small" title="Pause">
                    <Pause size={14} />
                  </button>
                  <button className="btn-icon small danger" title="Stop">
                    <Square size={14} />
                  </button>
                </>
              )}
              {job.status === 'paused' && (
                <button className="btn-icon small" title="Resume">
                  <Play size={14} />
                </button>
              )}
              {job.status === 'queued' && (
                <button className="btn-icon small danger" title="Cancel">
                  <XCircle size={14} />
                </button>
              )}
              {(job.status === 'completed' || job.status === 'failed') && (
                <button className="btn-icon small" title="Rerun">
                  <RotateCcw size={14} />
                </button>
              )}
              <button className="btn-icon small" title="View Logs">
                <Terminal size={14} />
              </button>
              <button className="btn-icon small" title="View Details">
                <Eye size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQueueSection = () => (
    <div className="queue-section">
      <div className="queue-header">
        <h3>Training Queue</h3>
        <p>Jobs waiting for resources</p>
      </div>

      <div className="queue-list">
        {jobs.filter(j => j.status === 'queued').map((job, index) => (
          <div key={job.id} className="queue-item">
            <div className="queue-position">#{index + 1}</div>
            <div className="queue-info">
              <h4>{job.name}</h4>
              <p>{job.model} • Requires {job.gpuCount}x {job.gpuType}</p>
            </div>
            <div className="queue-meta">
              <span className="dataset">{job.dataset}</span>
              <span className="epochs">{job.totalEpochs} epochs</span>
            </div>
            <div className="queue-actions">
              <button className="btn-outline small">
                <TrendingUp size={14} />
                Prioritize
              </button>
              <button className="btn-outline small danger">
                <XCircle size={14} />
                Cancel
              </button>
            </div>
          </div>
        ))}

        {jobs.filter(j => j.status === 'queued').length === 0 && (
          <div className="empty-queue">
            <CheckCircle size={48} />
            <h4>Queue is Empty</h4>
            <p>All training jobs have been scheduled</p>
          </div>
        )}
      </div>

      <div className="queue-stats">
        <div className="stat-item">
          <span className="stat-label">Estimated Wait Time</span>
          <span className="stat-value">~2h 30m</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Jobs Ahead</span>
          <span className="stat-value">{queuedJobs}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Required GPUs</span>
          <span className="stat-value">4x A100</span>
        </div>
      </div>
    </div>
  );

  const renderResourcesSection = () => (
    <div className="resources-section">
      <div className="resources-summary">
        <div className="resource-card">
          <div className="resource-icon gpu">
            <Cpu size={24} />
          </div>
          <div className="resource-info">
            <span className="resource-value">{gpuResources.length}</span>
            <span className="resource-label">Total GPUs</span>
          </div>
        </div>
        <div className="resource-card">
          <div className="resource-icon available">
            <CheckCircle size={24} />
          </div>
          <div className="resource-info">
            <span className="resource-value">{availableGpus}</span>
            <span className="resource-label">Available</span>
          </div>
        </div>
        <div className="resource-card">
          <div className="resource-icon in-use">
            <Activity size={24} />
          </div>
          <div className="resource-info">
            <span className="resource-value">{gpuResources.filter(g => g.status === 'in-use').length}</span>
            <span className="resource-label">In Use</span>
          </div>
        </div>
        <div className="resource-card">
          <div className="resource-icon power">
            <Zap size={24} />
          </div>
          <div className="resource-info">
            <span className="resource-value">{gpuResources.reduce((acc, g) => acc + g.powerUsage, 0)}W</span>
            <span className="resource-label">Power Draw</span>
          </div>
        </div>
      </div>

      <div className="gpu-grid">
        {gpuResources.map(gpu => (
          <div key={gpu.id} className={`gpu-card ${gpu.status}`}>
            <div className="gpu-header">
              <div className="gpu-name">
                <Server size={16} />
                <span>{gpu.name}</span>
              </div>
              <span className={`gpu-status ${gpu.status}`}>{gpu.status.replace('-', ' ')}</span>
            </div>
            <div className="gpu-type">{gpu.type} • {gpu.memory}</div>
            
            {gpu.currentJob && (
              <div className="gpu-job">
                <Activity size={12} />
                {jobs.find(j => j.id === gpu.currentJob)?.name}
              </div>
            )}

            <div className="gpu-metrics">
              <div className="gpu-metric">
                <span className="metric-label">Utilization</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill utilization" 
                    style={{ width: `${gpu.utilization}%` }}
                  ></div>
                </div>
                <span className="metric-value">{gpu.utilization}%</span>
              </div>
              <div className="gpu-metric">
                <span className="metric-label">Temperature</span>
                <div className="metric-bar">
                  <div 
                    className={`metric-fill temp ${gpu.temperature > 70 ? 'high' : ''}`}
                    style={{ width: `${(gpu.temperature / 100) * 100}%` }}
                  ></div>
                </div>
                <span className="metric-value">{gpu.temperature}°C</span>
              </div>
              <div className="gpu-metric">
                <span className="metric-label">Power</span>
                <span className="metric-value">{gpu.powerUsage}W</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetricsSection = () => (
    <div className="metrics-section">
      <div className="metrics-chart-container">
        <div className="chart-header">
          <h4>Training Progress - {selectedJob?.name || 'Select a Job'}</h4>
          <div className="chart-actions">
            <select defaultValue="loss">
              <option value="loss">Loss</option>
              <option value="accuracy">Accuracy</option>
              <option value="lr">Learning Rate</option>
            </select>
            <button className="btn-icon small">
              <Download size={14} />
            </button>
          </div>
        </div>

        <div className="training-chart">
          <div className="chart-y-axis">
            <span>2.5</span>
            <span>2.0</span>
            <span>1.5</span>
            <span>1.0</span>
            <span>0.5</span>
            <span>0</span>
          </div>
          <div className="chart-area">
            <svg viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trainLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                </linearGradient>
                <linearGradient id="valLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                </linearGradient>
              </defs>
              
              <path 
                d="M 0,0 L 50,52 L 100,116 L 150,148 L 200,168 L 250,180 L 300,186 L 350,190 L 400,192 L 400,200 L 0,200 Z"
                fill="url(#trainLossGradient)"
              />
              <path 
                d="M 0,0 L 50,52 L 100,116 L 150,148 L 200,168 L 250,180 L 300,186 L 350,190 L 400,192"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
              
              <path 
                d="M 0,8 L 50,60 L 100,120 L 150,156 L 200,176 L 250,188 L 300,192 L 350,194 L 400,196"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray="4,4"
              />

              {SAMPLE_METRICS.map((m, i) => (
                <circle 
                  key={i}
                  cx={i * 50}
                  cy={200 - (m.trainLoss / 2.5) * 200}
                  r="4"
                  fill="#10b981"
                />
              ))}
            </svg>
          </div>
          <div className="chart-x-axis">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
            <span>120</span>
            <span>134</span>
          </div>
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color train"></span>
            Training Loss
          </div>
          <div className="legend-item">
            <span className="legend-color val"></span>
            Validation Loss
          </div>
        </div>
      </div>

      <div className="metrics-table">
        <h4>Epoch History</h4>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Epoch</th>
                <th>Train Loss</th>
                <th>Val Loss</th>
                <th>Train Acc</th>
                <th>Val Acc</th>
                <th>LR</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_METRICS.map(m => (
                <tr key={m.epoch}>
                  <td>{m.epoch}</td>
                  <td>{m.trainLoss.toFixed(4)}</td>
                  <td>{m.valLoss.toFixed(4)}</td>
                  <td>{m.trainAccuracy.toFixed(2)}%</td>
                  <td>{m.valAccuracy.toFixed(2)}%</td>
                  <td>{m.learningRate}</td>
                  <td>{m.duration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHistorySection = () => (
    <div className="history-section">
      <div className="history-filters">
        <div className="date-range">
          <Calendar size={16} />
          <span>Last 7 days</span>
          <ChevronRight size={14} />
        </div>
        <select defaultValue="all">
          <option value="all">All Results</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>

      <div className="history-list">
        {jobs.filter(j => j.status === 'completed' || j.status === 'failed').map(job => (
          <div key={job.id} className="history-item">
            <div className={`history-status ${job.status}`}>
              {job.status === 'completed' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <div className="history-info">
              <h4>{job.name}</h4>
              <p>{job.model} • {job.totalEpochs} epochs • {job.duration}</p>
            </div>
            <div className="history-metrics">
              <div className="metric">
                <span className="label">Final Loss</span>
                <span className="value">{job.loss.toFixed(4)}</span>
              </div>
              <div className="metric">
                <span className="label">Accuracy</span>
                <span className="value">{job.accuracy.toFixed(2)}%</span>
              </div>
              <div className="metric">
                <span className="label">Cost</span>
                <span className="value">${job.cost.toFixed(2)}</span>
              </div>
            </div>
            <div className="history-actions">
              <button className="btn-icon small" title="View Details">
                <Eye size={14} />
              </button>
              <button className="btn-icon small" title="Download Model">
                <Download size={14} />
              </button>
              <button className="btn-icon small" title="Rerun">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="training-jobs">
      <div className="tj__header">
        <div className="tj__title-section">
          <div className="tj__icon">
            <Cpu size={28} />
          </div>
          <div>
            <h1>Training Jobs</h1>
            <p>Manage and monitor ML training jobs across your cluster</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Settings size={16} />
            Settings
          </button>
          <button className="btn-primary" onClick={() => setShowNewJobModal(true)}>
            <Plus size={16} />
            New Training Job
          </button>
        </div>
      </div>

      <div className="tj__stats">
        <div className="stat-card">
          <div className="stat-icon running-icon">
            <Loader2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{runningJobs}</span>
            <span className="stat-label">Running Jobs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon queued-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{queuedJobs}</span>
            <span className="stat-label">Queued</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gpu-icon">
            <Cpu size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{availableGpus}/{gpuResources.length}</span>
            <span className="stat-label">GPUs Available</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cost-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">${totalCost.toFixed(0)}</span>
            <span className="stat-label">Total Cost (24h)</span>
          </div>
        </div>
      </div>

      <div className="tj__tabs">
        <button 
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <Activity size={16} />
          Active Jobs
          <span className="tab-badge">{runningJobs}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <Clock size={16} />
          Queue
          <span className="tab-badge">{queuedJobs}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <Server size={16} />
          GPU Resources
          <span className="tab-badge">{gpuResources.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 size={16} />
          Metrics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Timer size={16} />
          History
        </button>
      </div>

      <div className="tj__content">
        {activeTab === 'jobs' && renderJobsSection()}
        {activeTab === 'queue' && renderQueueSection()}
        {activeTab === 'resources' && renderResourcesSection()}
        {activeTab === 'metrics' && renderMetricsSection()}
        {activeTab === 'history' && renderHistorySection()}
      </div>

      {selectedJob && (
        <div className="job-details-panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="framework-icon">{getFrameworkIcon(selectedJob.framework)}</span>
              <h3>{selectedJob.name}</h3>
            </div>
            <button className="close-btn" onClick={() => setSelectedJob(null)}>
              <XCircle size={18} />
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-section">
              <h4>Job Configuration</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Model</span>
                  <span className="detail-value">{selectedJob.model}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Framework</span>
                  <span className="detail-value">{selectedJob.framework}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Dataset</span>
                  <span className="detail-value">{selectedJob.dataset}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Dataset Size</span>
                  <span className="detail-value">{selectedJob.datasetSize}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Batch Size</span>
                  <span className="detail-value">{selectedJob.batchSize}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Learning Rate</span>
                  <span className="detail-value">{selectedJob.learningRate}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Resources</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">GPU Type</span>
                  <span className="detail-value">{selectedJob.gpuType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">GPU Count</span>
                  <span className="detail-value">{selectedJob.gpuCount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Memory Used</span>
                  <span className="detail-value">{selectedJob.memoryUsed}/{selectedJob.memoryTotal} GB</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">GPU Utilization</span>
                  <span className="detail-value">{selectedJob.gpuUtilization}%</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Current Metrics</h4>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">Loss</span>
                  <span className="metric-value">{selectedJob.loss.toFixed(4)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">{selectedJob.accuracy.toFixed(2)}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Epoch</span>
                  <span className="metric-value">{selectedJob.currentEpoch}/{selectedJob.totalEpochs}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Duration</span>
                  <span className="metric-value">{selectedJob.duration}</span>
                </div>
              </div>
            </div>

            {selectedJob.checkpoint && (
              <div className="detail-section">
                <h4>Latest Checkpoint</h4>
                <div className="checkpoint-info">
                  <HardDrive size={16} />
                  <span>{selectedJob.checkpoint}</span>
                  <button className="btn-icon small">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="panel-actions">
              {selectedJob.status === 'running' && (
                <>
                  <button className="btn-outline">
                    <Pause size={16} />
                    Pause
                  </button>
                  <button className="btn-outline danger">
                    <Square size={16} />
                    Stop
                  </button>
                </>
              )}
              <button className="btn-outline">
                <Terminal size={16} />
                View Logs
              </button>
              <button className="btn-primary">
                <ExternalLink size={16} />
                TensorBoard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
