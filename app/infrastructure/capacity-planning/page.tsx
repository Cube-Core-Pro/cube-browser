'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Target,
  Zap,
  Database,
  Globe,
  Cloud,
  Container,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Layers,
  GitBranch,
  Box,
  Workflow,
  ChevronDown,
  ChevronRight,
  Info,
  DollarSign,
  Users,
  Building,
  MapPin
} from 'lucide-react';
import './capacity-planning.css';

interface ResourceUtilization {
  current: number;
  average: number;
  peak: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercent: number;
}

interface ClusterCapacity {
  id: string;
  name: string;
  region: string;
  provider: 'aws' | 'gcp' | 'azure' | 'on-prem';
  nodes: {
    current: number;
    max: number;
    recommended: number;
  };
  cpu: ResourceUtilization;
  memory: ResourceUtilization;
  storage: ResourceUtilization;
  network: ResourceUtilization;
  status: 'healthy' | 'warning' | 'critical';
  costPerMonth: number;
  efficiency: number;
}

interface ForecastData {
  date: string;
  predicted: number;
  upper: number;
  lower: number;
  actual?: number;
}

interface CapacityRecommendation {
  id: string;
  type: 'scale-up' | 'scale-down' | 'optimize' | 'migrate';
  severity: 'critical' | 'high' | 'medium' | 'low';
  resource: string;
  cluster: string;
  description: string;
  impact: string;
  savings?: number;
  effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'implemented' | 'dismissed';
}

interface ServiceDemand {
  service: string;
  currentRPS: number;
  peakRPS: number;
  avgLatency: number;
  instances: number;
  recommendedInstances: number;
  costPerInstance: number;
}

const CLUSTERS: ClusterCapacity[] = [
  {
    id: 'cluster-1',
    name: 'Production US-East',
    region: 'us-east-1',
    provider: 'aws',
    nodes: { current: 24, max: 50, recommended: 28 },
    cpu: { current: 72, average: 68, peak: 89, trend: 'increasing', trendPercent: 5.2 },
    memory: { current: 81, average: 76, peak: 94, trend: 'increasing', trendPercent: 3.8 },
    storage: { current: 45, average: 42, peak: 52, trend: 'stable', trendPercent: 0.5 },
    network: { current: 38, average: 35, peak: 67, trend: 'increasing', trendPercent: 12.4 },
    status: 'warning',
    costPerMonth: 42500,
    efficiency: 78
  },
  {
    id: 'cluster-2',
    name: 'Production EU-West',
    region: 'eu-west-1',
    provider: 'aws',
    nodes: { current: 16, max: 30, recommended: 16 },
    cpu: { current: 58, average: 54, peak: 72, trend: 'stable', trendPercent: 1.1 },
    memory: { current: 64, average: 60, peak: 78, trend: 'stable', trendPercent: 0.8 },
    storage: { current: 52, average: 48, peak: 58, trend: 'increasing', trendPercent: 2.3 },
    network: { current: 42, average: 38, peak: 55, trend: 'stable', trendPercent: 0.4 },
    status: 'healthy',
    costPerMonth: 28400,
    efficiency: 85
  },
  {
    id: 'cluster-3',
    name: 'Production APAC',
    region: 'ap-southeast-1',
    provider: 'gcp',
    nodes: { current: 12, max: 20, recommended: 14 },
    cpu: { current: 68, average: 62, peak: 85, trend: 'increasing', trendPercent: 8.5 },
    memory: { current: 72, average: 68, peak: 88, trend: 'increasing', trendPercent: 6.2 },
    storage: { current: 38, average: 35, peak: 45, trend: 'stable', trendPercent: 1.5 },
    network: { current: 55, average: 48, peak: 72, trend: 'increasing', trendPercent: 15.3 },
    status: 'warning',
    costPerMonth: 21200,
    efficiency: 74
  },
  {
    id: 'cluster-4',
    name: 'Staging Cluster',
    region: 'us-west-2',
    provider: 'aws',
    nodes: { current: 8, max: 15, recommended: 6 },
    cpu: { current: 32, average: 28, peak: 45, trend: 'decreasing', trendPercent: -8.2 },
    memory: { current: 38, average: 34, peak: 52, trend: 'decreasing', trendPercent: -5.4 },
    storage: { current: 25, average: 22, peak: 30, trend: 'stable', trendPercent: 0.2 },
    network: { current: 18, average: 15, peak: 28, trend: 'stable', trendPercent: -1.2 },
    status: 'healthy',
    costPerMonth: 8900,
    efficiency: 45
  }
];

const RECOMMENDATIONS: CapacityRecommendation[] = [
  {
    id: 'rec-001',
    type: 'scale-up',
    severity: 'high',
    resource: 'Worker Nodes',
    cluster: 'Production US-East',
    description: 'Add 4 worker nodes to handle increasing traffic load and maintain SLA compliance',
    impact: 'Prevent potential service degradation during peak hours',
    effort: 'low',
    status: 'pending'
  },
  {
    id: 'rec-002',
    type: 'scale-down',
    severity: 'medium',
    resource: 'Staging Nodes',
    cluster: 'Staging Cluster',
    description: 'Reduce staging cluster from 8 to 6 nodes based on actual utilization',
    impact: 'Cost optimization without affecting development workflow',
    savings: 2200,
    effort: 'low',
    status: 'approved'
  },
  {
    id: 'rec-003',
    type: 'optimize',
    severity: 'medium',
    resource: 'Memory Allocation',
    cluster: 'Production APAC',
    description: 'Optimize pod memory requests/limits based on actual usage patterns',
    impact: 'Improve cluster efficiency by 12% and reduce OOM incidents',
    savings: 3500,
    effort: 'medium',
    status: 'pending'
  },
  {
    id: 'rec-004',
    type: 'migrate',
    severity: 'low',
    resource: 'Cold Storage',
    cluster: 'Production EU-West',
    description: 'Migrate infrequently accessed data to S3 Glacier for cost optimization',
    impact: 'Reduce storage costs by 60% for archival data',
    savings: 1800,
    effort: 'high',
    status: 'pending'
  }
];

const SERVICE_DEMANDS: ServiceDemand[] = [
  { service: 'Core API', currentRPS: 12500, peakRPS: 28000, avgLatency: 45, instances: 12, recommendedInstances: 14, costPerInstance: 185 },
  { service: 'Auth Service', currentRPS: 8200, peakRPS: 18500, avgLatency: 32, instances: 6, recommendedInstances: 6, costPerInstance: 145 },
  { service: 'Payment Gateway', currentRPS: 2800, peakRPS: 8500, avgLatency: 125, instances: 4, recommendedInstances: 5, costPerInstance: 220 },
  { service: 'Search Engine', currentRPS: 5400, peakRPS: 15000, avgLatency: 85, instances: 8, recommendedInstances: 8, costPerInstance: 195 },
  { service: 'Media Processing', currentRPS: 1200, peakRPS: 4500, avgLatency: 450, instances: 6, recommendedInstances: 8, costPerInstance: 310 },
  { service: 'Notification Hub', currentRPS: 18000, peakRPS: 45000, avgLatency: 18, instances: 4, recommendedInstances: 5, costPerInstance: 125 }
];

const CPU_FORECAST: ForecastData[] = [
  { date: 'Week 1', predicted: 72, upper: 78, lower: 66, actual: 72 },
  { date: 'Week 2', predicted: 74, upper: 81, lower: 67, actual: 75 },
  { date: 'Week 3', predicted: 76, upper: 84, lower: 68, actual: 74 },
  { date: 'Week 4', predicted: 78, upper: 86, lower: 70, actual: 79 },
  { date: 'Week 5', predicted: 80, upper: 88, lower: 72 },
  { date: 'Week 6', predicted: 82, upper: 90, lower: 74 },
  { date: 'Week 7', predicted: 84, upper: 92, lower: 76 },
  { date: 'Week 8', predicted: 85, upper: 94, lower: 76 }
];

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  aws: Cloud,
  gcp: Cloud,
  azure: Cloud,
  'on-prem': Server
};

export default function CapacityPlanningPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clusters' | 'forecast' | 'recommendations' | 'costs'>('overview');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const totalNodes = CLUSTERS.reduce((acc, c) => acc + c.nodes.current, 0);
  const totalCost = CLUSTERS.reduce((acc, c) => acc + c.costPerMonth, 0);
  const avgEfficiency = Math.round(CLUSTERS.reduce((acc, c) => acc + c.efficiency, 0) / CLUSTERS.length);
  const criticalRecommendations = RECOMMENDATIONS.filter(r => r.severity === 'critical' || r.severity === 'high').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 85) return '#ef4444';
    if (percent >= 70) return '#f59e0b';
    return '#22c55e';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp size={14} className="trend-icon up" />;
      case 'decreasing': return <TrendingDown size={14} className="trend-icon down" />;
      default: return <Activity size={14} className="trend-icon stable" />;
    }
  };

  return (
    <div className="capacity-planning">
      {/* Header */}
      <header className="cap__header">
        <div className="cap__title-section">
          <div className="cap__icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1>Capacity Planning</h1>
            <p>Infrastructure forecasting, resource optimization, and cost management</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="time-range-selector">
            <button 
              className={timeRange === '7d' ? 'active' : ''}
              onClick={() => setTimeRange('7d')}
            >7D</button>
            <button 
              className={timeRange === '30d' ? 'active' : ''}
              onClick={() => setTimeRange('30d')}
            >30D</button>
            <button 
              className={timeRange === '90d' ? 'active' : ''}
              onClick={() => setTimeRange('90d')}
            >90D</button>
          </div>
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-primary">
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="cap__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Server size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalNodes}</span>
            <span className="stat-label">Total Nodes</span>
          </div>
          <span className="stat-trend up">+4 this month</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon efficiency">
            <Gauge size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{avgEfficiency}%</span>
            <span className="stat-label">Avg Efficiency</span>
          </div>
          <span className="stat-trend up">+3.2%</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon cost">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">${(totalCost / 1000).toFixed(1)}K</span>
            <span className="stat-label">Monthly Cost</span>
          </div>
          <span className="stat-trend down">-$2.1K</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon alerts">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{criticalRecommendations}</span>
            <span className="stat-label">Action Items</span>
          </div>
          <span className="stat-badge high">High Priority</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon clusters">
            <Layers size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{CLUSTERS.length}</span>
            <span className="stat-label">Active Clusters</span>
          </div>
          <span className="stat-badge healthy">All Operational</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="cap__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clusters' ? 'active' : ''}`}
          onClick={() => setActiveTab('clusters')}
        >
          <Server size={16} />
          Clusters
          <span className="tab-badge">{CLUSTERS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <TrendingUp size={16} />
          Forecast
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Target size={16} />
          Recommendations
          <span className="tab-badge alert">{criticalRecommendations}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'costs' ? 'active' : ''}`}
          onClick={() => setActiveTab('costs')}
        >
          <DollarSign size={16} />
          Cost Analysis
        </button>
      </div>

      {/* Content */}
      <div className="cap__content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Resource Utilization Grid */}
            <div className="utilization-grid">
              {CLUSTERS.filter(c => c.status !== 'healthy' || c.nodes.current > 10).slice(0, 3).map(cluster => (
                <div key={cluster.id} className="cluster-overview-card">
                  <div className="cluster-header">
                    <div className="cluster-info">
                      <span 
                        className="status-dot"
                        style={{ background: getStatusColor(cluster.status) }}
                      />
                      <h4>{cluster.name}</h4>
                    </div>
                    <span className="region-badge">
                      <MapPin size={12} />
                      {cluster.region}
                    </span>
                  </div>

                  <div className="resource-meters">
                    <div className="meter-item">
                      <div className="meter-header">
                        <span><Cpu size={14} /> CPU</span>
                        <span style={{ color: getUtilizationColor(cluster.cpu.current) }}>
                          {cluster.cpu.current}%
                        </span>
                      </div>
                      <div className="meter-bar">
                        <div 
                          className="meter-fill"
                          style={{ 
                            width: `${cluster.cpu.current}%`,
                            background: getUtilizationColor(cluster.cpu.current)
                          }}
                        />
                        <div 
                          className="meter-peak"
                          style={{ left: `${cluster.cpu.peak}%` }}
                        />
                      </div>
                      <div className="meter-trend">
                        {getTrendIcon(cluster.cpu.trend)}
                        <span className={cluster.cpu.trend}>
                          {cluster.cpu.trendPercent > 0 ? '+' : ''}{cluster.cpu.trendPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="meter-item">
                      <div className="meter-header">
                        <span><MemoryStick size={14} /> Memory</span>
                        <span style={{ color: getUtilizationColor(cluster.memory.current) }}>
                          {cluster.memory.current}%
                        </span>
                      </div>
                      <div className="meter-bar">
                        <div 
                          className="meter-fill"
                          style={{ 
                            width: `${cluster.memory.current}%`,
                            background: getUtilizationColor(cluster.memory.current)
                          }}
                        />
                        <div 
                          className="meter-peak"
                          style={{ left: `${cluster.memory.peak}%` }}
                        />
                      </div>
                      <div className="meter-trend">
                        {getTrendIcon(cluster.memory.trend)}
                        <span className={cluster.memory.trend}>
                          {cluster.memory.trendPercent > 0 ? '+' : ''}{cluster.memory.trendPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="meter-item">
                      <div className="meter-header">
                        <span><HardDrive size={14} /> Storage</span>
                        <span style={{ color: getUtilizationColor(cluster.storage.current) }}>
                          {cluster.storage.current}%
                        </span>
                      </div>
                      <div className="meter-bar">
                        <div 
                          className="meter-fill"
                          style={{ 
                            width: `${cluster.storage.current}%`,
                            background: getUtilizationColor(cluster.storage.current)
                          }}
                        />
                      </div>
                    </div>

                    <div className="meter-item">
                      <div className="meter-header">
                        <span><Network size={14} /> Network</span>
                        <span style={{ color: getUtilizationColor(cluster.network.current) }}>
                          {cluster.network.current}%
                        </span>
                      </div>
                      <div className="meter-bar">
                        <div 
                          className="meter-fill"
                          style={{ 
                            width: `${cluster.network.current}%`,
                            background: getUtilizationColor(cluster.network.current)
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="cluster-footer">
                    <div className="nodes-info">
                      <span>{cluster.nodes.current}/{cluster.nodes.max} nodes</span>
                      {cluster.nodes.recommended !== cluster.nodes.current && (
                        <span className={`recommendation ${cluster.nodes.recommended > cluster.nodes.current ? 'scale-up' : 'scale-down'}`}>
                          Recommended: {cluster.nodes.recommended}
                        </span>
                      )}
                    </div>
                    <button className="view-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Demand Table */}
            <div className="service-demand-section">
              <div className="section-header">
                <h3>Service Demand Analysis</h3>
                <p>Real-time traffic and capacity requirements per service</p>
              </div>
              <div className="demand-table">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Current RPS</th>
                      <th>Peak RPS</th>
                      <th>Latency (P99)</th>
                      <th>Instances</th>
                      <th>Recommended</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICE_DEMANDS.map(service => (
                      <tr key={service.service}>
                        <td className="service-name">{service.service}</td>
                        <td>{service.currentRPS.toLocaleString()}</td>
                        <td>{service.peakRPS.toLocaleString()}</td>
                        <td>{service.avgLatency}ms</td>
                        <td>{service.instances}</td>
                        <td className={service.recommendedInstances !== service.instances ? 'highlight' : ''}>
                          {service.recommendedInstances}
                          {service.recommendedInstances > service.instances && (
                            <ArrowUpRight size={12} className="scale-up-icon" />
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${service.recommendedInstances === service.instances ? 'optimal' : 'needs-action'}`}>
                            {service.recommendedInstances === service.instances ? 'Optimal' : 'Scale Needed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Pending Recommendations</h3>
              <div className="recommendations-preview">
                {RECOMMENDATIONS.filter(r => r.status === 'pending').slice(0, 3).map(rec => (
                  <div key={rec.id} className={`rec-preview-card ${rec.severity}`}>
                    <div className="rec-type-icon">
                      {rec.type === 'scale-up' && <ArrowUpRight size={18} />}
                      {rec.type === 'scale-down' && <ArrowDownRight size={18} />}
                      {rec.type === 'optimize' && <Settings size={18} />}
                      {rec.type === 'migrate' && <GitBranch size={18} />}
                    </div>
                    <div className="rec-content">
                      <h4>{rec.resource}</h4>
                      <p>{rec.description}</p>
                      <span className="rec-cluster">{rec.cluster}</span>
                    </div>
                    <div className="rec-actions">
                      {rec.savings && (
                        <span className="savings-badge">Save ${rec.savings}/mo</span>
                      )}
                      <button className="approve-btn">Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="clusters-section">
            <div className="clusters-grid">
              {CLUSTERS.map(cluster => {
                const ProviderIcon = PROVIDER_ICONS[cluster.provider];
                return (
                  <div key={cluster.id} className={`cluster-card ${cluster.status}`}>
                    <div className="cluster-card-header">
                      <div className="cluster-identity">
                        <div className="provider-icon">
                          <ProviderIcon size={20} />
                        </div>
                        <div>
                          <h4>{cluster.name}</h4>
                          <span className="cluster-region">
                            <MapPin size={12} />
                            {cluster.region}
                          </span>
                        </div>
                      </div>
                      <div className="cluster-status">
                        <span 
                          className="status-indicator"
                          style={{ background: getStatusColor(cluster.status) }}
                        />
                        <span className="status-text">{cluster.status}</span>
                      </div>
                    </div>

                    <div className="cluster-metrics">
                      <div className="metric-row">
                        <div className="metric">
                          <Cpu size={16} />
                          <div className="metric-details">
                            <span className="metric-label">CPU</span>
                            <div className="metric-bar-container">
                              <div 
                                className="metric-bar-fill"
                                style={{ 
                                  width: `${cluster.cpu.current}%`,
                                  background: getUtilizationColor(cluster.cpu.current)
                                }}
                              />
                            </div>
                            <span 
                              className="metric-value"
                              style={{ color: getUtilizationColor(cluster.cpu.current) }}
                            >
                              {cluster.cpu.current}%
                            </span>
                          </div>
                        </div>
                        <div className="metric">
                          <MemoryStick size={16} />
                          <div className="metric-details">
                            <span className="metric-label">Memory</span>
                            <div className="metric-bar-container">
                              <div 
                                className="metric-bar-fill"
                                style={{ 
                                  width: `${cluster.memory.current}%`,
                                  background: getUtilizationColor(cluster.memory.current)
                                }}
                              />
                            </div>
                            <span 
                              className="metric-value"
                              style={{ color: getUtilizationColor(cluster.memory.current) }}
                            >
                              {cluster.memory.current}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="metric-row">
                        <div className="metric">
                          <HardDrive size={16} />
                          <div className="metric-details">
                            <span className="metric-label">Storage</span>
                            <div className="metric-bar-container">
                              <div 
                                className="metric-bar-fill"
                                style={{ 
                                  width: `${cluster.storage.current}%`,
                                  background: getUtilizationColor(cluster.storage.current)
                                }}
                              />
                            </div>
                            <span className="metric-value">{cluster.storage.current}%</span>
                          </div>
                        </div>
                        <div className="metric">
                          <Network size={16} />
                          <div className="metric-details">
                            <span className="metric-label">Network</span>
                            <div className="metric-bar-container">
                              <div 
                                className="metric-bar-fill"
                                style={{ 
                                  width: `${cluster.network.current}%`,
                                  background: getUtilizationColor(cluster.network.current)
                                }}
                              />
                            </div>
                            <span className="metric-value">{cluster.network.current}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="cluster-info-grid">
                      <div className="info-item">
                        <span className="info-label">Nodes</span>
                        <span className="info-value">{cluster.nodes.current}/{cluster.nodes.max}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Efficiency</span>
                        <span className="info-value">{cluster.efficiency}%</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Cost/Month</span>
                        <span className="info-value">${cluster.costPerMonth.toLocaleString()}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Provider</span>
                        <span className="info-value">{cluster.provider.toUpperCase()}</span>
                      </div>
                    </div>

                    {cluster.nodes.recommended !== cluster.nodes.current && (
                      <div className="cluster-recommendation">
                        <Info size={14} />
                        <span>
                          Recommended: {cluster.nodes.recommended} nodes 
                          ({cluster.nodes.recommended > cluster.nodes.current ? '+' : ''}
                          {cluster.nodes.recommended - cluster.nodes.current})
                        </span>
                      </div>
                    )}

                    <div className="cluster-actions">
                      <button className="action-btn">
                        <Eye size={14} />
                        Details
                      </button>
                      <button className="action-btn">
                        <Settings size={14} />
                        Configure
                      </button>
                      <button className="action-btn scale">
                        <Layers size={14} />
                        Scale
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="forecast-section">
            <div className="forecast-header">
              <h3>Resource Demand Forecast</h3>
              <p>ML-powered predictions for the next 8 weeks based on historical trends</p>
            </div>

            <div className="forecast-chart-container">
              <div className="forecast-chart">
                <div className="chart-header">
                  <h4>CPU Utilization Forecast - Production US-East</h4>
                  <div className="chart-legend">
                    <span className="legend-item">
                      <span className="dot actual"></span> Actual
                    </span>
                    <span className="legend-item">
                      <span className="dot predicted"></span> Predicted
                    </span>
                    <span className="legend-item">
                      <span className="dot confidence"></span> 90% Confidence
                    </span>
                  </div>
                </div>
                <div className="chart-area">
                  <div className="chart-y-axis">
                    <span>100%</span>
                    <span>80%</span>
                    <span>60%</span>
                    <span>40%</span>
                    <span>20%</span>
                    <span>0%</span>
                  </div>
                  <div className="chart-content">
                    <div className="threshold-line critical" style={{ bottom: '85%' }}>
                      <span>Critical: 85%</span>
                    </div>
                    <div className="threshold-line warning" style={{ bottom: '70%' }}>
                      <span>Warning: 70%</span>
                    </div>
                    <div className="chart-bars">
                      {CPU_FORECAST.map((point, i) => (
                        <div key={i} className="bar-group">
                          <div 
                            className="confidence-range"
                            style={{ 
                              bottom: `${point.lower}%`,
                              height: `${point.upper - point.lower}%`
                            }}
                          />
                          {point.actual && (
                            <div 
                              className="actual-bar"
                              style={{ height: `${point.actual}%` }}
                            />
                          )}
                          <div 
                            className="predicted-bar"
                            style={{ height: `${point.predicted}%` }}
                          />
                          <span className="bar-label">{point.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="forecast-insights">
              <div className="insight-card warning">
                <AlertTriangle size={20} />
                <div className="insight-content">
                  <h4>Capacity Threshold Alert</h4>
                  <p>CPU utilization projected to exceed 85% threshold in Week 7. Consider scaling up by 4 nodes before then.</p>
                </div>
                <button className="insight-action">Plan Scaling</button>
              </div>
              <div className="insight-card info">
                <Info size={20} />
                <div className="insight-content">
                  <h4>Seasonal Pattern Detected</h4>
                  <p>Historical data shows 30% traffic increase during Q1 marketing campaigns. Account for this in planning.</p>
                </div>
                <button className="insight-action">View Pattern</button>
              </div>
            </div>

            <div className="forecast-scenarios">
              <h4>What-If Scenarios</h4>
              <div className="scenarios-grid">
                <div className="scenario-card">
                  <h5>Growth Scenario (+20% Traffic)</h5>
                  <div className="scenario-impact">
                    <div className="impact-item">
                      <span>Additional Nodes Needed</span>
                      <span className="value">+8</span>
                    </div>
                    <div className="impact-item">
                      <span>Estimated Cost Increase</span>
                      <span className="value">+$12,400/mo</span>
                    </div>
                    <div className="impact-item">
                      <span>Time to Scale</span>
                      <span className="value">~15 min</span>
                    </div>
                  </div>
                </div>
                <div className="scenario-card">
                  <h5>Optimization Scenario (Right-sizing)</h5>
                  <div className="scenario-impact">
                    <div className="impact-item">
                      <span>Nodes to Remove</span>
                      <span className="value">-3</span>
                    </div>
                    <div className="impact-item">
                      <span>Estimated Savings</span>
                      <span className="value success">-$5,100/mo</span>
                    </div>
                    <div className="impact-item">
                      <span>Risk Level</span>
                      <span className="value">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div className="rec-header">
              <h3>Capacity Recommendations</h3>
              <div className="rec-filters">
                <select>
                  <option>All Severities</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <select>
                  <option>All Types</option>
                  <option>Scale Up</option>
                  <option>Scale Down</option>
                  <option>Optimize</option>
                  <option>Migrate</option>
                </select>
              </div>
            </div>

            <div className="rec-list">
              {RECOMMENDATIONS.map(rec => (
                <div key={rec.id} className={`recommendation-card ${rec.severity} ${rec.status}`}>
                  <div className="rec-severity-bar" />
                  <div className="rec-icon">
                    {rec.type === 'scale-up' && <ArrowUpRight size={20} />}
                    {rec.type === 'scale-down' && <ArrowDownRight size={20} />}
                    {rec.type === 'optimize' && <Settings size={20} />}
                    {rec.type === 'migrate' && <GitBranch size={20} />}
                  </div>
                  <div className="rec-main">
                    <div className="rec-title-row">
                      <h4>{rec.resource}</h4>
                      <div className="rec-badges">
                        <span className={`severity-badge ${rec.severity}`}>{rec.severity}</span>
                        <span className={`type-badge ${rec.type}`}>{rec.type.replace('-', ' ')}</span>
                        <span className={`status-badge ${rec.status}`}>{rec.status}</span>
                      </div>
                    </div>
                    <p className="rec-description">{rec.description}</p>
                    <div className="rec-meta">
                      <span><Server size={12} /> {rec.cluster}</span>
                      <span><Target size={12} /> {rec.impact}</span>
                      <span className="effort">Effort: {rec.effort}</span>
                    </div>
                  </div>
                  <div className="rec-actions-col">
                    {rec.savings && (
                      <div className="savings-display">
                        <span className="savings-amount">${rec.savings}</span>
                        <span className="savings-label">/month savings</span>
                      </div>
                    )}
                    <div className="rec-buttons">
                      {rec.status === 'pending' && (
                        <>
                          <button className="btn-approve">Approve</button>
                          <button className="btn-dismiss">Dismiss</button>
                        </>
                      )}
                      {rec.status === 'approved' && (
                        <button className="btn-implement">Implement</button>
                      )}
                      {rec.status === 'implemented' && (
                        <span className="implemented-badge">
                          <CheckCircle2 size={14} /> Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="costs-section">
            <div className="cost-overview">
              <div className="cost-card total">
                <h4>Total Monthly Cost</h4>
                <span className="cost-value">${totalCost.toLocaleString()}</span>
                <span className="cost-trend down">-$2,100 vs last month</span>
              </div>
              <div className="cost-card projected">
                <h4>Projected (Next Month)</h4>
                <span className="cost-value">${(totalCost * 1.05).toLocaleString()}</span>
                <span className="cost-trend up">+5% expected growth</span>
              </div>
              <div className="cost-card savings">
                <h4>Potential Savings</h4>
                <span className="cost-value success">${RECOMMENDATIONS.reduce((acc, r) => acc + (r.savings || 0), 0).toLocaleString()}</span>
                <span className="cost-trend">From {RECOMMENDATIONS.filter(r => r.savings).length} recommendations</span>
              </div>
            </div>

            <div className="cost-breakdown">
              <h4>Cost by Cluster</h4>
              <div className="breakdown-chart">
                {CLUSTERS.map(cluster => {
                  const percent = (cluster.costPerMonth / totalCost) * 100;
                  return (
                    <div key={cluster.id} className="breakdown-item">
                      <div className="breakdown-label">
                        <span className="cluster-name">{cluster.name}</span>
                        <span className="cluster-cost">${cluster.costPerMonth.toLocaleString()}</span>
                      </div>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="breakdown-percent">{percent.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cost-per-service">
              <h4>Cost per Service Instance</h4>
              <div className="service-costs-grid">
                {SERVICE_DEMANDS.map(service => (
                  <div key={service.service} className="service-cost-card">
                    <h5>{service.service}</h5>
                    <div className="cost-details">
                      <div className="cost-row">
                        <span>Instances</span>
                        <span>{service.instances}</span>
                      </div>
                      <div className="cost-row">
                        <span>Cost/Instance</span>
                        <span>${service.costPerInstance}</span>
                      </div>
                      <div className="cost-row total">
                        <span>Total</span>
                        <span>${(service.instances * service.costPerInstance).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
