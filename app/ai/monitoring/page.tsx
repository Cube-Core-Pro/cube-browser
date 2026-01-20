'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Layers,
  RefreshCw,
  Download,
  Settings,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Bell,
  BellOff,
  Zap,
  Cpu,
  Database,
  Globe,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  User,
  FileText,
  GitBranch,
  Box,
  Gauge,
  Thermometer,
  HardDrive,
  Network,
  Timer,
  Percent
} from 'lucide-react';
import './ml-monitoring.css';

// Interfaces
interface ModelMetric {
  name: string;
  value: number;
  threshold: number;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface DataDrift {
  feature: string;
  driftScore: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  baseline: number;
  current: number;
}

interface ModelEndpoint {
  id: string;
  name: string;
  modelName: string;
  modelVersion: string;
  status: 'healthy' | 'degraded' | 'down' | 'deploying';
  environment: 'production' | 'staging' | 'development';
  metrics: ModelMetric[];
  dataDrift: DataDrift[];
  latencyP50: number;
  latencyP99: number;
  requestsPerSecond: number;
  errorRate: number;
  lastUpdated: string;
  uptime: string;
  alerts: Alert[];
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  modelId: string;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  gpu: number;
  disk: number;
  network: number;
}

// Sample Data
const SAMPLE_ENDPOINTS: ModelEndpoint[] = [
  {
    id: 'ep-001',
    name: 'fraud-detection-v4',
    modelName: 'Fraud Detection XGBoost',
    modelVersion: 'v4.2.1',
    status: 'healthy',
    environment: 'production',
    metrics: [
      { name: 'AUC-ROC', value: 0.9542, threshold: 0.90, status: 'healthy', trend: 'up', trendValue: 0.5 },
      { name: 'Precision', value: 0.923, threshold: 0.85, status: 'healthy', trend: 'stable', trendValue: 0 },
      { name: 'Recall', value: 0.891, threshold: 0.80, status: 'healthy', trend: 'up', trendValue: 0.3 },
      { name: 'F1 Score', value: 0.907, threshold: 0.85, status: 'healthy', trend: 'stable', trendValue: 0.1 }
    ],
    dataDrift: [
      { feature: 'transaction_amount', driftScore: 0.05, threshold: 0.15, status: 'healthy', baseline: 245.50, current: 258.20 },
      { feature: 'merchant_category', driftScore: 0.08, threshold: 0.15, status: 'healthy', baseline: 0.42, current: 0.45 },
      { feature: 'user_age_group', driftScore: 0.12, threshold: 0.15, status: 'warning', baseline: 35.2, current: 38.1 },
      { feature: 'transaction_frequency', driftScore: 0.03, threshold: 0.15, status: 'healthy', baseline: 12.5, current: 12.8 }
    ],
    latencyP50: 12,
    latencyP99: 45,
    requestsPerSecond: 8420,
    errorRate: 0.02,
    lastUpdated: '2025-01-28T14:30:00Z',
    uptime: '99.99%',
    alerts: []
  },
  {
    id: 'ep-002',
    name: 'recommendation-engine-v3',
    modelName: 'Product Recommendation Transformer',
    modelVersion: 'v3.1.0',
    status: 'degraded',
    environment: 'production',
    metrics: [
      { name: 'NDCG@10', value: 0.385, threshold: 0.40, status: 'warning', trend: 'down', trendValue: -2.5 },
      { name: 'Hit Rate@10', value: 0.271, threshold: 0.28, status: 'warning', trend: 'down', trendValue: -1.8 },
      { name: 'MRR', value: 0.165, threshold: 0.15, status: 'healthy', trend: 'down', trendValue: -0.5 },
      { name: 'Coverage', value: 0.89, threshold: 0.85, status: 'healthy', trend: 'stable', trendValue: 0 }
    ],
    dataDrift: [
      { feature: 'user_embedding', driftScore: 0.18, threshold: 0.15, status: 'critical', baseline: 0.0, current: 0.18 },
      { feature: 'item_popularity', driftScore: 0.22, threshold: 0.15, status: 'critical', baseline: 125.0, current: 98.5 },
      { feature: 'interaction_recency', driftScore: 0.09, threshold: 0.15, status: 'healthy', baseline: 7.2, current: 8.1 }
    ],
    latencyP50: 25,
    latencyP99: 89,
    requestsPerSecond: 4250,
    errorRate: 0.15,
    lastUpdated: '2025-01-28T14:25:00Z',
    uptime: '99.85%',
    alerts: [
      { id: 'alert-001', severity: 'warning', title: 'NDCG below threshold', message: 'NDCG@10 dropped below 0.40 threshold for 15 minutes', timestamp: '2025-01-28T14:15:00Z', acknowledged: false, modelId: 'ep-002' },
      { id: 'alert-002', severity: 'critical', title: 'Data drift detected', message: 'Significant drift detected in user_embedding feature (18%)', timestamp: '2025-01-28T14:10:00Z', acknowledged: false, modelId: 'ep-002' }
    ]
  },
  {
    id: 'ep-003',
    name: 'sentiment-analyzer-v2',
    modelName: 'Multilingual BERT Sentiment',
    modelVersion: 'v2.0.5',
    status: 'healthy',
    environment: 'production',
    metrics: [
      { name: 'Accuracy', value: 0.892, threshold: 0.85, status: 'healthy', trend: 'stable', trendValue: 0.1 },
      { name: 'Macro F1', value: 0.878, threshold: 0.82, status: 'healthy', trend: 'up', trendValue: 0.4 },
      { name: 'Cross-lingual Acc', value: 0.845, threshold: 0.80, status: 'healthy', trend: 'stable', trendValue: 0 }
    ],
    dataDrift: [
      { feature: 'text_length', driftScore: 0.04, threshold: 0.15, status: 'healthy', baseline: 128.5, current: 132.1 },
      { feature: 'language_distribution', driftScore: 0.07, threshold: 0.15, status: 'healthy', baseline: 0.0, current: 0.07 }
    ],
    latencyP50: 35,
    latencyP99: 120,
    requestsPerSecond: 2150,
    errorRate: 0.05,
    lastUpdated: '2025-01-28T14:28:00Z',
    uptime: '99.95%',
    alerts: []
  },
  {
    id: 'ep-004',
    name: 'churn-predictor-v1',
    modelName: 'Customer Churn GBM',
    modelVersion: 'v1.5.2',
    status: 'down',
    environment: 'production',
    metrics: [
      { name: 'AUC-ROC', value: 0.0, threshold: 0.85, status: 'critical', trend: 'down', trendValue: -100 },
      { name: 'Precision', value: 0.0, threshold: 0.80, status: 'critical', trend: 'down', trendValue: -100 }
    ],
    dataDrift: [],
    latencyP50: 0,
    latencyP99: 0,
    requestsPerSecond: 0,
    errorRate: 100,
    lastUpdated: '2025-01-28T14:00:00Z',
    uptime: '95.50%',
    alerts: [
      { id: 'alert-003', severity: 'critical', title: 'Model endpoint down', message: 'Endpoint not responding. Last successful request 30 minutes ago.', timestamp: '2025-01-28T14:00:00Z', acknowledged: true, modelId: 'ep-004' }
    ]
  },
  {
    id: 'ep-005',
    name: 'image-classifier-staging',
    modelName: 'ResNet Image Classifier',
    modelVersion: 'v2.1.0-beta',
    status: 'deploying',
    environment: 'staging',
    metrics: [
      { name: 'Top-1 Accuracy', value: 0.912, threshold: 0.90, status: 'healthy', trend: 'up', trendValue: 1.2 },
      { name: 'Top-5 Accuracy', value: 0.985, threshold: 0.97, status: 'healthy', trend: 'stable', trendValue: 0.1 }
    ],
    dataDrift: [],
    latencyP50: 45,
    latencyP99: 150,
    requestsPerSecond: 120,
    errorRate: 0.5,
    lastUpdated: '2025-01-28T14:20:00Z',
    uptime: '98.50%',
    alerts: []
  }
];

const SAMPLE_SYSTEM_HEALTH: SystemHealth = {
  cpu: 45,
  memory: 62,
  gpu: 78,
  disk: 34,
  network: 28
};

export default function MLMonitoringPage() {
  const [endpoints, setEndpoints] = useState<ModelEndpoint[]>(SAMPLE_ENDPOINTS);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(SAMPLE_SYSTEM_HEALTH);
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'alerts' | 'drift' | 'performance'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ModelEndpoint | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const allAlerts = endpoints.flatMap(ep => ep.alerts);
  const criticalAlerts = allAlerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const warningAlerts = allAlerts.filter(a => a.severity === 'warning' && !a.acknowledged);

  const stats = {
    totalModels: endpoints.length,
    healthyModels: endpoints.filter(e => e.status === 'healthy').length,
    degradedModels: endpoints.filter(e => e.status === 'degraded').length,
    downModels: endpoints.filter(e => e.status === 'down').length,
    criticalAlerts: criticalAlerts.length,
    warningAlerts: warningAlerts.length,
    avgLatency: Math.round(endpoints.filter(e => e.latencyP50 > 0).reduce((sum, e) => sum + e.latencyP50, 0) / endpoints.filter(e => e.latencyP50 > 0).length),
    totalRPS: endpoints.reduce((sum, e) => sum + e.requestsPerSecond, 0)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={14} className="status-icon healthy" />;
      case 'degraded': return <AlertTriangle size={14} className="status-icon degraded" />;
      case 'down': return <XCircle size={14} className="status-icon down" />;
      case 'deploying': return <RefreshCw size={14} className="status-icon deploying" />;
      default: return <Clock size={14} className="status-icon" />;
    }
  };

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') return <ArrowUpRight size={12} className={`trend-icon ${value >= 0 ? 'positive' : 'negative'}`} />;
    if (trend === 'down') return <ArrowDownRight size={12} className={`trend-icon ${value <= 0 ? 'negative' : 'positive'}`} />;
    return <Minus size={12} className="trend-icon stable" />;
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const matchesSearch = ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ep.modelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ep.status === statusFilter;
    const matchesEnvironment = environmentFilter === 'all' || ep.environment === environmentFilter;
    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const getHealthColor = (value: number) => {
    if (value < 50) return 'healthy';
    if (value < 80) return 'warning';
    return 'critical';
  };

  return (
    <div className="ml-monitoring">
      {/* Header */}
      <header className="mlm__header">
        <div className="mlm__title-section">
          <div className="mlm__icon">
            <Activity size={28} />
          </div>
          <div>
            <h1>ML Monitoring</h1>
            <p>Model observability and performance tracking</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`btn-outline ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Configure
          </button>
          <button className="btn-primary">
            <Plus size={16} />
            Add Monitor
          </button>
        </div>
      </header>

      {/* Alert Banner */}
      {criticalAlerts.length > 0 && (
        <div className="alert-banner critical">
          <AlertTriangle size={18} />
          <span>{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require attention</span>
          <button className="btn-outline small" onClick={() => setActiveTab('alerts')}>View Alerts</button>
        </div>
      )}

      {/* Stats */}
      <div className="mlm__stats">
        <div className="stat-card">
          <div className="stat-icon models-icon">
            <Box size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalModels}</span>
            <span className="stat-label">Total Models</span>
          </div>
        </div>
        <div className="stat-card healthy">
          <div className="stat-icon healthy-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.healthyModels}</span>
            <span className="stat-label">Healthy</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon degraded-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.degradedModels}</span>
            <span className="stat-label">Degraded</span>
          </div>
        </div>
        <div className="stat-card error">
          <div className="stat-icon down-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.downModels}</span>
            <span className="stat-label">Down</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency-icon">
            <Timer size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgLatency}<span className="unit">ms</span></span>
            <span className="stat-label">Avg Latency (P50)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rps-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats.totalRPS / 1000).toFixed(1)}<span className="unit">K</span></span>
            <span className="stat-label">Total RPS</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mlm__tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Gauge size={16} />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          <Box size={16} />
          Models
          <span className="tab-badge">{stats.totalModels}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={16} />
          Alerts
          {allAlerts.filter(a => !a.acknowledged).length > 0 && (
            <span className="tab-badge warning">{allAlerts.filter(a => !a.acknowledged).length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'drift' ? 'active' : ''}`}
          onClick={() => setActiveTab('drift')}
        >
          <TrendingDown size={16} />
          Data Drift
        </button>
        <button
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <BarChart3 size={16} />
          Performance
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="overview-grid">
            {/* System Health */}
            <div className="overview-card system-health">
              <h4>
                <Server size={18} />
                System Health
              </h4>
              <div className="health-meters">
                <div className="health-meter">
                  <div className="meter-header">
                    <Cpu size={14} />
                    <span>CPU</span>
                    <span className={`meter-value ${getHealthColor(systemHealth.cpu)}`}>{systemHealth.cpu}%</span>
                  </div>
                  <div className="meter-bar">
                    <div 
                      className={`meter-fill ${getHealthColor(systemHealth.cpu)}`} 
                      style={{ width: `${systemHealth.cpu}%` }}
                    ></div>
                  </div>
                </div>
                <div className="health-meter">
                  <div className="meter-header">
                    <HardDrive size={14} />
                    <span>Memory</span>
                    <span className={`meter-value ${getHealthColor(systemHealth.memory)}`}>{systemHealth.memory}%</span>
                  </div>
                  <div className="meter-bar">
                    <div 
                      className={`meter-fill ${getHealthColor(systemHealth.memory)}`} 
                      style={{ width: `${systemHealth.memory}%` }}
                    ></div>
                  </div>
                </div>
                <div className="health-meter">
                  <div className="meter-header">
                    <Zap size={14} />
                    <span>GPU</span>
                    <span className={`meter-value ${getHealthColor(systemHealth.gpu)}`}>{systemHealth.gpu}%</span>
                  </div>
                  <div className="meter-bar">
                    <div 
                      className={`meter-fill ${getHealthColor(systemHealth.gpu)}`} 
                      style={{ width: `${systemHealth.gpu}%` }}
                    ></div>
                  </div>
                </div>
                <div className="health-meter">
                  <div className="meter-header">
                    <Database size={14} />
                    <span>Disk</span>
                    <span className={`meter-value ${getHealthColor(systemHealth.disk)}`}>{systemHealth.disk}%</span>
                  </div>
                  <div className="meter-bar">
                    <div 
                      className={`meter-fill ${getHealthColor(systemHealth.disk)}`} 
                      style={{ width: `${systemHealth.disk}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Status Distribution */}
            <div className="overview-card status-distribution">
              <h4>
                <Target size={18} />
                Model Status
              </h4>
              <div className="status-chart">
                <div className="status-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a24" strokeWidth="12" />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="#10b981" strokeWidth="12"
                      strokeDasharray={`${(stats.healthyModels / stats.totalModels) * 251.2} 251.2`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="#f59e0b" strokeWidth="12"
                      strokeDasharray={`${(stats.degradedModels / stats.totalModels) * 251.2} 251.2`}
                      strokeDashoffset={`${-(stats.healthyModels / stats.totalModels) * 251.2}`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="#ef4444" strokeWidth="12"
                      strokeDasharray={`${(stats.downModels / stats.totalModels) * 251.2} 251.2`}
                      strokeDashoffset={`${-((stats.healthyModels + stats.degradedModels) / stats.totalModels) * 251.2}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="ring-center">
                    <span className="ring-value">{stats.totalModels}</span>
                    <span className="ring-label">Total</span>
                  </div>
                </div>
                <div className="status-legend">
                  <div className="legend-item">
                    <span className="dot healthy"></span>
                    <span>Healthy ({stats.healthyModels})</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot degraded"></span>
                    <span>Degraded ({stats.degradedModels})</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot down"></span>
                    <span>Down ({stats.downModels})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="overview-card recent-alerts">
              <h4>
                <Bell size={18} />
                Recent Alerts
              </h4>
              <div className="alerts-mini-list">
                {allAlerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className={`alert-mini ${alert.severity}`}>
                    {alert.severity === 'critical' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                    <div className="alert-mini-content">
                      <span className="alert-mini-title">{alert.title}</span>
                      <span className="alert-mini-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {allAlerts.length === 0 && (
                  <div className="no-alerts">
                    <CheckCircle size={24} />
                    <span>No active alerts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Models by Traffic */}
            <div className="overview-card top-models">
              <h4>
                <TrendingUp size={18} />
                Top Models by Traffic
              </h4>
              <div className="top-models-list">
                {endpoints
                  .filter(e => e.requestsPerSecond > 0)
                  .sort((a, b) => b.requestsPerSecond - a.requestsPerSecond)
                  .slice(0, 4)
                  .map((ep, index) => (
                    <div key={ep.id} className="top-model-item">
                      <span className="rank">#{index + 1}</span>
                      <div className="model-info">
                        <span className="model-name">{ep.name}</span>
                        <span className="model-rps">{ep.requestsPerSecond.toLocaleString()} RPS</span>
                      </div>
                      <div className="traffic-bar">
                        <div 
                          className="traffic-fill" 
                          style={{ width: `${(ep.requestsPerSecond / stats.totalRPS) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="models-section">
          <div className="section-toolbar">
            <div className="search-filters">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="down">Down</option>
                <option value="deploying">Deploying</option>
              </select>
              <select
                value={environmentFilter}
                onChange={(e) => setEnvironmentFilter(e.target.value)}
              >
                <option value="all">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          <div className="models-grid">
            {filteredEndpoints.map(endpoint => (
              <div 
                key={endpoint.id} 
                className={`model-card ${endpoint.status}`}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div className="model-header">
                  <div className="model-status">
                    {getStatusIcon(endpoint.status)}
                    <span className={`status-text ${endpoint.status}`}>{endpoint.status}</span>
                  </div>
                  <span className={`env-badge ${endpoint.environment}`}>{endpoint.environment}</span>
                </div>
                <h4 className="model-name">{endpoint.name}</h4>
                <p className="model-version">{endpoint.modelName} • {endpoint.modelVersion}</p>
                
                <div className="model-metrics">
                  {endpoint.metrics.slice(0, 2).map(metric => (
                    <div key={metric.name} className="metric-mini">
                      <span className="metric-label">{metric.name}</span>
                      <div className="metric-value-row">
                        <span className={`metric-value ${metric.status}`}>
                          {metric.value.toFixed(metric.value < 1 ? 3 : 1)}
                        </span>
                        <span className={`metric-trend ${metric.trend}`}>
                          {getTrendIcon(metric.trend, metric.trendValue)}
                          {Math.abs(metric.trendValue)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="model-stats">
                  <div className="stat-mini">
                    <Timer size={12} />
                    <span>{endpoint.latencyP50}ms</span>
                  </div>
                  <div className="stat-mini">
                    <Zap size={12} />
                    <span>{endpoint.requestsPerSecond.toLocaleString()} RPS</span>
                  </div>
                  <div className="stat-mini">
                    <Percent size={12} />
                    <span className={endpoint.errorRate > 1 ? 'error' : ''}>{endpoint.errorRate}% err</span>
                  </div>
                </div>

                {endpoint.alerts.length > 0 && (
                  <div className="model-alerts">
                    <Bell size={12} />
                    <span>{endpoint.alerts.filter(a => !a.acknowledged).length} active alerts</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="alerts-section">
          <div className="alerts-list">
            {allAlerts.length === 0 ? (
              <div className="no-alerts-full">
                <CheckCircle size={48} />
                <h3>All Clear</h3>
                <p>No active alerts at this time</p>
              </div>
            ) : (
              allAlerts.map(alert => (
                <div key={alert.id} className={`alert-card ${alert.severity} ${alert.acknowledged ? 'acknowledged' : ''}`}>
                  <div className="alert-icon">
                    {alert.severity === 'critical' ? <XCircle size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div className="alert-content">
                    <div className="alert-header">
                      <h4>{alert.title}</h4>
                      <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-meta">
                      <span className="alert-model">Model: {endpoints.find(e => e.id === alert.modelId)?.name}</span>
                    </div>
                  </div>
                  <div className="alert-actions">
                    {!alert.acknowledged && (
                      <button className="btn-outline small">Acknowledge</button>
                    )}
                    <button className="btn-icon small">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Data Drift Tab */}
      {activeTab === 'drift' && (
        <div className="drift-section">
          <div className="drift-overview">
            {endpoints.map(endpoint => (
              endpoint.dataDrift.length > 0 && (
                <div key={endpoint.id} className="drift-card">
                  <div className="drift-header">
                    <h4>{endpoint.name}</h4>
                    {getStatusIcon(endpoint.status)}
                  </div>
                  <div className="drift-features">
                    {endpoint.dataDrift.map(drift => (
                      <div key={drift.feature} className={`drift-feature ${drift.status}`}>
                        <div className="feature-info">
                          <span className="feature-name">{drift.feature}</span>
                          <span className={`drift-score ${drift.status}`}>
                            {(drift.driftScore * 100).toFixed(0)}% drift
                          </span>
                        </div>
                        <div className="drift-bar">
                          <div className="threshold-marker" style={{ left: `${drift.threshold * 100 * 2}%` }}></div>
                          <div 
                            className={`drift-fill ${drift.status}`} 
                            style={{ width: `${Math.min(drift.driftScore * 100 * 2, 100)}%` }}
                          ></div>
                        </div>
                        <div className="drift-values">
                          <span>Baseline: {drift.baseline}</span>
                          <span>Current: {drift.current}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="performance-section">
          <div className="perf-table">
            <div className="table-header">
              <span>Model</span>
              <span>Status</span>
              <span>Latency P50</span>
              <span>Latency P99</span>
              <span>RPS</span>
              <span>Error Rate</span>
              <span>Uptime</span>
            </div>
            {endpoints.map(endpoint => (
              <div key={endpoint.id} className="table-row">
                <div className="model-cell">
                  <span className="name">{endpoint.name}</span>
                  <span className="version">{endpoint.modelVersion}</span>
                </div>
                <div className={`status-cell ${endpoint.status}`}>
                  {getStatusIcon(endpoint.status)}
                  <span>{endpoint.status}</span>
                </div>
                <div className="latency-cell">
                  {endpoint.latencyP50 > 0 ? `${endpoint.latencyP50}ms` : 'N/A'}
                </div>
                <div className="latency-cell">
                  {endpoint.latencyP99 > 0 ? `${endpoint.latencyP99}ms` : 'N/A'}
                </div>
                <div className="rps-cell">{endpoint.requestsPerSecond.toLocaleString()}</div>
                <div className={`error-cell ${endpoint.errorRate > 1 ? 'high' : endpoint.errorRate > 0.1 ? 'medium' : ''}`}>
                  {endpoint.errorRate}%
                </div>
                <div className="uptime-cell">{endpoint.uptime}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedEndpoint && (
        <div className="detail-overlay" onClick={() => setSelectedEndpoint(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div className="detail-title">
                {getStatusIcon(selectedEndpoint.status)}
                <div>
                  <h3>{selectedEndpoint.name}</h3>
                  <p>{selectedEndpoint.modelName} • {selectedEndpoint.modelVersion}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedEndpoint(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="detail-section">
              <h4>Performance Metrics</h4>
              <div className="metrics-detail-grid">
                {selectedEndpoint.metrics.map(metric => (
                  <div key={metric.name} className={`metric-detail ${metric.status}`}>
                    <div className="metric-detail-header">
                      <span className="metric-name">{metric.name}</span>
                      <span className={`metric-status ${metric.status}`}>{metric.status}</span>
                    </div>
                    <div className="metric-detail-value">
                      <span className="value">{metric.value.toFixed(metric.value < 1 ? 4 : 2)}</span>
                      <span className={`trend ${metric.trend}`}>
                        {getTrendIcon(metric.trend, metric.trendValue)}
                        {Math.abs(metric.trendValue)}%
                      </span>
                    </div>
                    <div className="metric-threshold">
                      Threshold: {metric.threshold}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEndpoint.dataDrift.length > 0 && (
              <div className="detail-section">
                <h4>Data Drift</h4>
                <div className="drift-detail-list">
                  {selectedEndpoint.dataDrift.map(drift => (
                    <div key={drift.feature} className={`drift-detail-item ${drift.status}`}>
                      <span className="feature">{drift.feature}</span>
                      <span className={`score ${drift.status}`}>{(drift.driftScore * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-actions">
              <button className="btn-primary">
                <Eye size={14} />
                View Full Dashboard
              </button>
              <button className="btn-outline">
                <RotateCcw size={14} />
                Retrain Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
