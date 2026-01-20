'use client';

import React, { useState, useEffect } from 'react';
import { 
  Gauge,
  TrendingUp,
  TrendingDown,
  Server,
  Cpu,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Database,
  Cloud,
  Layers,
  Target,
  BarChart2,
  RefreshCw,
  Download,
  Filter,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  Box,
  GitBranch,
  AlertOctagon,
  Info,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import './capacity-planning.css';

interface ResourceCapacity {
  id: string;
  name: string;
  type: 'compute' | 'memory' | 'storage' | 'network' | 'database' | 'kubernetes';
  region: string;
  currentUsage: number;
  allocatedCapacity: number;
  maxCapacity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  projectedExhaustion?: string;
  recommendations: string[];
}

interface GrowthForecast {
  period: string;
  computeGrowth: number;
  storageGrowth: number;
  networkGrowth: number;
  databaseGrowth: number;
  confidence: number;
}

interface CapacityAlert {
  id: string;
  resource: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  acknowledged: boolean;
}

interface ScalingEvent {
  id: string;
  resource: string;
  action: 'scale-up' | 'scale-down' | 'provision' | 'decommission';
  from: string;
  to: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'scheduled' | 'failed';
  triggeredBy: 'auto' | 'manual' | 'forecast';
}

interface TeamAllocation {
  team: string;
  computeAllocation: number;
  computeUsed: number;
  storageAllocation: number;
  storageUsed: number;
  budget: number;
  budgetUsed: number;
}

const CapacityPlanningDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'forecast' | 'alerts' | 'teams'>('overview');
  const [selectedResource, setSelectedResource] = useState<ResourceCapacity | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const resources: ResourceCapacity[] = [
    {
      id: '1',
      name: 'Production Cluster',
      type: 'kubernetes',
      region: 'us-east-1',
      currentUsage: 78,
      allocatedCapacity: 85,
      maxCapacity: 100,
      trend: 'increasing',
      trendPercentage: 5.2,
      projectedExhaustion: '2025-04-15',
      recommendations: ['Add 2 more nodes', 'Enable horizontal pod autoscaler', 'Review resource requests']
    },
    {
      id: '2',
      name: 'Primary Database',
      type: 'database',
      region: 'us-east-1',
      currentUsage: 82,
      allocatedCapacity: 90,
      maxCapacity: 100,
      trend: 'increasing',
      trendPercentage: 8.1,
      projectedExhaustion: '2025-03-20',
      recommendations: ['Upgrade to larger instance', 'Enable read replicas', 'Archive old data']
    },
    {
      id: '3',
      name: 'Object Storage',
      type: 'storage',
      region: 'us-east-1',
      currentUsage: 45,
      allocatedCapacity: 60,
      maxCapacity: 100,
      trend: 'stable',
      trendPercentage: 1.2,
      recommendations: ['Implement lifecycle policies', 'Enable intelligent tiering']
    },
    {
      id: '4',
      name: 'CDN Bandwidth',
      type: 'network',
      region: 'global',
      currentUsage: 62,
      allocatedCapacity: 75,
      maxCapacity: 100,
      trend: 'increasing',
      trendPercentage: 3.5,
      projectedExhaustion: '2025-06-01',
      recommendations: ['Enable compression', 'Review cache hit rates']
    },
    {
      id: '5',
      name: 'API Compute',
      type: 'compute',
      region: 'us-west-2',
      currentUsage: 55,
      allocatedCapacity: 70,
      maxCapacity: 100,
      trend: 'decreasing',
      trendPercentage: -2.3,
      recommendations: ['Consider downscaling during off-peak', 'Optimize instance types']
    },
    {
      id: '6',
      name: 'Memory Cache',
      type: 'memory',
      region: 'us-east-1',
      currentUsage: 71,
      allocatedCapacity: 80,
      maxCapacity: 100,
      trend: 'stable',
      trendPercentage: 0.8,
      recommendations: ['Review eviction policies', 'Consider cluster mode']
    }
  ];

  const growthForecasts: GrowthForecast[] = [
    { period: 'Q1 2025', computeGrowth: 15, storageGrowth: 22, networkGrowth: 18, databaseGrowth: 12, confidence: 92 },
    { period: 'Q2 2025', computeGrowth: 18, storageGrowth: 28, networkGrowth: 22, databaseGrowth: 16, confidence: 85 },
    { period: 'Q3 2025', computeGrowth: 22, storageGrowth: 35, networkGrowth: 28, databaseGrowth: 20, confidence: 78 },
    { period: 'Q4 2025', computeGrowth: 28, storageGrowth: 42, networkGrowth: 35, databaseGrowth: 25, confidence: 70 }
  ];

  const alerts: CapacityAlert[] = [
    {
      id: '1',
      resource: 'Primary Database',
      type: 'critical',
      message: 'Storage capacity at 82%, projected to exceed 90% in 30 days',
      threshold: 90,
      currentValue: 82,
      timestamp: '2025-02-18T10:30:00Z',
      acknowledged: false
    },
    {
      id: '2',
      resource: 'Production Cluster',
      type: 'warning',
      message: 'CPU utilization trending upward, may need additional nodes',
      threshold: 85,
      currentValue: 78,
      timestamp: '2025-02-18T09:15:00Z',
      acknowledged: true
    },
    {
      id: '3',
      resource: 'Memory Cache',
      type: 'warning',
      message: 'Memory usage at 71%, approaching soft limit',
      threshold: 80,
      currentValue: 71,
      timestamp: '2025-02-17T16:45:00Z',
      acknowledged: true
    },
    {
      id: '4',
      resource: 'CDN Bandwidth',
      type: 'info',
      message: 'Bandwidth usage increased 3.5% this month',
      threshold: 75,
      currentValue: 62,
      timestamp: '2025-02-17T08:00:00Z',
      acknowledged: true
    }
  ];

  const scalingEvents: ScalingEvent[] = [
    { id: '1', resource: 'Production Cluster', action: 'scale-up', from: '8 nodes', to: '10 nodes', timestamp: '2025-02-18T14:00:00Z', status: 'completed', triggeredBy: 'auto' },
    { id: '2', resource: 'API Compute', action: 'scale-down', from: '6 instances', to: '4 instances', timestamp: '2025-02-18T03:00:00Z', status: 'completed', triggeredBy: 'auto' },
    { id: '3', resource: 'Primary Database', action: 'provision', from: 'db.r5.xlarge', to: 'db.r5.2xlarge', timestamp: '2025-02-19T02:00:00Z', status: 'scheduled', triggeredBy: 'forecast' },
    { id: '4', resource: 'Object Storage', action: 'provision', from: '5TB', to: '8TB', timestamp: '2025-02-17T10:00:00Z', status: 'completed', triggeredBy: 'manual' },
    { id: '5', resource: 'Memory Cache', action: 'scale-up', from: '2 nodes', to: '3 nodes', timestamp: '2025-02-16T22:00:00Z', status: 'completed', triggeredBy: 'auto' }
  ];

  const teamAllocations: TeamAllocation[] = [
    { team: 'Platform Engineering', computeAllocation: 40, computeUsed: 35, storageAllocation: 30, storageUsed: 22, budget: 25000, budgetUsed: 21500 },
    { team: 'Backend Services', computeAllocation: 30, computeUsed: 28, storageAllocation: 25, storageUsed: 20, budget: 18000, budgetUsed: 16200 },
    { team: 'Data Engineering', computeAllocation: 15, computeUsed: 12, storageAllocation: 35, storageUsed: 32, budget: 15000, budgetUsed: 14100 },
    { team: 'Frontend', computeAllocation: 10, computeUsed: 8, storageAllocation: 5, storageUsed: 3, budget: 8000, budgetUsed: 6500 },
    { team: 'ML/AI', computeAllocation: 5, computeUsed: 5, storageAllocation: 5, storageUsed: 4, budget: 12000, budgetUsed: 11800 }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'compute': return <Cpu size={18} />;
      case 'memory': return <Activity size={18} />;
      case 'storage': return <HardDrive size={18} />;
      case 'network': return <Globe size={18} />;
      case 'database': return <Database size={18} />;
      case 'kubernetes': return <Box size={18} />;
      default: return <Server size={18} />;
    }
  };

  const overallCapacity = Math.round(resources.reduce((sum, r) => sum + r.currentUsage, 0) / resources.length);
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length;
  const upcomingExhaustions = resources.filter(r => r.projectedExhaustion).length;

  return (
    <div className="capacity-planning">
      <header className="cp__header">
        <div className="cp__title-section">
          <div className="cp__icon">
            <Gauge size={28} />
          </div>
          <div>
            <h1>Capacity Planning</h1>
            <p>Monitor, forecast, and optimize infrastructure capacity</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="time-selector">
            <Calendar size={16} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </header>

      <div className="capacity-summary">
        <div className="summary-card main">
          <div className="gauge-container">
            <svg viewBox="0 0 100 50" className="gauge-svg">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="var(--cp-bg-elevated)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${overallCapacity * 1.26} 126`}
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="gauge-value">
              <span className="value">{overallCapacity}%</span>
              <span className="label">Avg Usage</span>
            </div>
          </div>
          <div className="gauge-info">
            <h4>Overall Capacity</h4>
            <p>Across all resource types</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon critical">
            <AlertOctagon size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{criticalAlerts}</span>
            <span className="summary-label">Critical Alerts</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon warning">
            <Clock size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{upcomingExhaustions}</span>
            <span className="summary-label">Capacity Risks</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon success">
            <TrendingUp size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">+18%</span>
            <span className="summary-label">Projected Growth</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon info">
            <Layers size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-value">{resources.length}</span>
            <span className="summary-label">Monitored Resources</span>
          </div>
        </div>
      </div>

      <nav className="cp__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Gauge size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <Server size={16} />
          Resources
          <span className="tab-badge">{resources.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <TrendingUp size={16} />
          Forecast
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <AlertTriangle size={16} />
          Alerts
          {criticalAlerts > 0 && <span className="tab-badge critical">{criticalAlerts}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={16} />
          Team Allocations
        </button>
      </nav>

      <main className="cp__content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-card resources-overview">
                <div className="card-title">
                  <Server size={18} />
                  <h4>Resource Utilization</h4>
                </div>
                <div className="resources-bars">
                  {resources.map(resource => (
                    <div key={resource.id} className="resource-bar-row">
                      <div className="resource-bar-info">
                        <div className={`resource-icon ${resource.type}`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <span className="resource-name">{resource.name}</span>
                      </div>
                      <div className="resource-bar-container">
                        <div className="resource-bar-bg">
                          <div 
                            className={`resource-bar-fill ${resource.currentUsage > 80 ? 'critical' : resource.currentUsage > 60 ? 'warning' : 'healthy'}`}
                            style={{ width: `${resource.currentUsage}%` }}
                          />
                          <div 
                            className="allocated-marker"
                            style={{ left: `${resource.allocatedCapacity}%` }}
                          />
                        </div>
                        <span className="resource-percentage">{resource.currentUsage}%</span>
                      </div>
                      <div className={`resource-trend ${resource.trend}`}>
                        {resource.trend === 'increasing' && <TrendingUp size={14} />}
                        {resource.trend === 'decreasing' && <TrendingDown size={14} />}
                        {resource.trend === 'stable' && <Minus size={14} />}
                        <span>{resource.trend === 'stable' ? '0' : resource.trend === 'increasing' ? '+' : ''}{resource.trendPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overview-card capacity-risks">
                <div className="card-title">
                  <AlertTriangle size={18} />
                  <h4>Capacity Risks</h4>
                </div>
                <div className="risks-list">
                  {resources.filter(r => r.projectedExhaustion).map(resource => (
                    <div key={resource.id} className="risk-item">
                      <div className={`risk-icon ${resource.currentUsage > 80 ? 'critical' : 'warning'}`}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="risk-info">
                        <span className="risk-name">{resource.name}</span>
                        <span className="risk-detail">
                          Projected exhaustion: {new Date(resource.projectedExhaustion!).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="risk-usage">{resource.currentUsage}%</span>
                    </div>
                  ))}
                  {resources.filter(r => r.projectedExhaustion).length === 0 && (
                    <div className="no-risks">
                      <CheckCircle2 size={24} />
                      <span>No capacity risks detected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="overview-card scaling-activity">
                <div className="card-title">
                  <GitBranch size={18} />
                  <h4>Recent Scaling Events</h4>
                </div>
                <div className="scaling-list">
                  {scalingEvents.slice(0, 5).map(event => (
                    <div key={event.id} className={`scaling-item ${event.action}`}>
                      <div className={`scaling-icon ${event.action}`}>
                        {event.action === 'scale-up' || event.action === 'provision' ? <Plus size={14} /> : <Minus size={14} />}
                      </div>
                      <div className="scaling-info">
                        <span className="scaling-resource">{event.resource}</span>
                        <span className="scaling-detail">{event.from} → {event.to}</span>
                      </div>
                      <div className="scaling-meta">
                        <span className={`scaling-status ${event.status}`}>{event.status}</span>
                        <span className="scaling-trigger">{event.triggeredBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overview-card growth-preview">
                <div className="card-title">
                  <TrendingUp size={18} />
                  <h4>Growth Forecast</h4>
                </div>
                <div className="growth-chart">
                  {growthForecasts.map((forecast, idx) => (
                    <div key={idx} className="growth-bar-group">
                      <div className="growth-bars">
                        <div 
                          className="growth-bar compute" 
                          style={{ height: `${forecast.computeGrowth * 2}px` }}
                          title={`Compute: +${forecast.computeGrowth}%`}
                        />
                        <div 
                          className="growth-bar storage" 
                          style={{ height: `${forecast.storageGrowth * 2}px` }}
                          title={`Storage: +${forecast.storageGrowth}%`}
                        />
                        <div 
                          className="growth-bar network" 
                          style={{ height: `${forecast.networkGrowth * 2}px` }}
                          title={`Network: +${forecast.networkGrowth}%`}
                        />
                      </div>
                      <span className="growth-label">{forecast.period}</span>
                    </div>
                  ))}
                </div>
                <div className="growth-legend">
                  <span className="legend-item"><span className="dot compute" /> Compute</span>
                  <span className="legend-item"><span className="dot storage" /> Storage</span>
                  <span className="legend-item"><span className="dot network" /> Network</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resources-tab">
            <div className="resources-grid">
              {resources.map(resource => (
                <div 
                  key={resource.id} 
                  className={`resource-card ${resource.currentUsage > 80 ? 'critical' : resource.currentUsage > 60 ? 'warning' : 'healthy'}`}
                  onClick={() => setSelectedResource(resource)}
                >
                  <div className="resource-header">
                    <div className={`resource-type-icon ${resource.type}`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="resource-title">
                      <h4>{resource.name}</h4>
                      <span className="resource-region">{resource.region}</span>
                    </div>
                    <div className={`trend-badge ${resource.trend}`}>
                      {resource.trend === 'increasing' && <ArrowUpRight size={14} />}
                      {resource.trend === 'decreasing' && <ArrowDownRight size={14} />}
                      {resource.trend === 'stable' && <Minus size={14} />}
                      {Math.abs(resource.trendPercentage)}%
                    </div>
                  </div>

                  <div className="capacity-gauge">
                    <div className="gauge-track">
                      <div 
                        className={`gauge-fill ${resource.currentUsage > 80 ? 'critical' : resource.currentUsage > 60 ? 'warning' : 'healthy'}`}
                        style={{ width: `${resource.currentUsage}%` }}
                      />
                      <div 
                        className="allocated-line"
                        style={{ left: `${resource.allocatedCapacity}%` }}
                      />
                    </div>
                    <div className="gauge-labels">
                      <span>0%</span>
                      <span className="current-label">{resource.currentUsage}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="capacity-stats">
                    <div className="stat">
                      <span className="stat-label">Current</span>
                      <span className="stat-value">{resource.currentUsage}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Allocated</span>
                      <span className="stat-value">{resource.allocatedCapacity}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Available</span>
                      <span className="stat-value">{resource.maxCapacity - resource.currentUsage}%</span>
                    </div>
                  </div>

                  {resource.projectedExhaustion && (
                    <div className="exhaustion-warning">
                      <AlertTriangle size={14} />
                      <span>Projected exhaustion: {new Date(resource.projectedExhaustion).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="resource-recommendations">
                    <span className="rec-label">Recommendations:</span>
                    <ul>
                      {resource.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="forecast-tab">
            <div className="forecast-header">
              <h3>Capacity Growth Forecast</h3>
              <div className="forecast-controls">
                <select defaultValue="quarterly">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="forecast-table">
              <div className="table-header">
                <span>Period</span>
                <span>Compute Growth</span>
                <span>Storage Growth</span>
                <span>Network Growth</span>
                <span>Database Growth</span>
                <span>Confidence</span>
              </div>
              {growthForecasts.map((forecast, idx) => (
                <div key={idx} className="table-row">
                  <span className="period-cell">{forecast.period}</span>
                  <span className="growth-cell">
                    <TrendingUp size={14} />
                    +{forecast.computeGrowth}%
                  </span>
                  <span className="growth-cell">
                    <TrendingUp size={14} />
                    +{forecast.storageGrowth}%
                  </span>
                  <span className="growth-cell">
                    <TrendingUp size={14} />
                    +{forecast.networkGrowth}%
                  </span>
                  <span className="growth-cell">
                    <TrendingUp size={14} />
                    +{forecast.databaseGrowth}%
                  </span>
                  <span className="confidence-cell">
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{ width: `${forecast.confidence}%` }} />
                    </div>
                    {forecast.confidence}%
                  </span>
                </div>
              ))}
            </div>

            <div className="forecast-recommendations">
              <h4>Capacity Planning Recommendations</h4>
              <div className="recommendations-grid">
                <div className="recommendation-card">
                  <div className="rec-icon compute">
                    <Cpu size={20} />
                  </div>
                  <div className="rec-content">
                    <h5>Compute Capacity</h5>
                    <p>Based on projected 18% growth, consider provisioning 4 additional compute nodes by Q2 2025.</p>
                    <span className="rec-action">Estimated cost: $2,400/mo</span>
                  </div>
                </div>
                <div className="recommendation-card">
                  <div className="rec-icon storage">
                    <HardDrive size={20} />
                  </div>
                  <div className="rec-content">
                    <h5>Storage Expansion</h5>
                    <p>Storage growth trending at 28% quarterly. Plan for 50TB additional capacity.</p>
                    <span className="rec-action">Estimated cost: $1,800/mo</span>
                  </div>
                </div>
                <div className="recommendation-card">
                  <div className="rec-icon database">
                    <Database size={20} />
                  </div>
                  <div className="rec-content">
                    <h5>Database Upgrade</h5>
                    <p>Primary database at 82%. Schedule upgrade to next instance tier within 30 days.</p>
                    <span className="rec-action critical">Priority: High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-tab">
            <div className="alerts-summary">
              <div className="alert-stat critical">
                <AlertOctagon size={20} />
                <span className="stat-value">{alerts.filter(a => a.type === 'critical').length}</span>
                <span className="stat-label">Critical</span>
              </div>
              <div className="alert-stat warning">
                <AlertTriangle size={20} />
                <span className="stat-value">{alerts.filter(a => a.type === 'warning').length}</span>
                <span className="stat-label">Warning</span>
              </div>
              <div className="alert-stat info">
                <Info size={20} />
                <span className="stat-value">{alerts.filter(a => a.type === 'info').length}</span>
                <span className="stat-label">Info</span>
              </div>
              <div className="alert-stat acknowledged">
                <CheckCircle2 size={20} />
                <span className="stat-value">{alerts.filter(a => a.acknowledged).length}</span>
                <span className="stat-label">Acknowledged</span>
              </div>
            </div>

            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-card ${alert.type} ${alert.acknowledged ? 'acknowledged' : ''}`}>
                  <div className="alert-icon">
                    {alert.type === 'critical' && <AlertOctagon size={20} />}
                    {alert.type === 'warning' && <AlertTriangle size={20} />}
                    {alert.type === 'info' && <Info size={20} />}
                  </div>
                  <div className="alert-content">
                    <div className="alert-header">
                      <span className="alert-resource">{alert.resource}</span>
                      <span className={`alert-type ${alert.type}`}>{alert.type}</span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${alert.type}`}
                          style={{ width: `${alert.currentValue}%` }}
                        />
                        <div 
                          className="threshold-marker"
                          style={{ left: `${alert.threshold}%` }}
                        />
                      </div>
                      <span className="progress-label">{alert.currentValue}% / {alert.threshold}% threshold</span>
                    </div>
                    <div className="alert-footer">
                      <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
                      {!alert.acknowledged && (
                        <button className="btn-outline small">Acknowledge</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="teams-tab">
            <div className="teams-header">
              <h3>Team Resource Allocations</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Adjust Quotas
              </button>
            </div>

            <div className="teams-table">
              <div className="table-header">
                <span>Team</span>
                <span>Compute</span>
                <span>Storage</span>
                <span>Budget</span>
                <span>Status</span>
              </div>
              {teamAllocations.map((team, idx) => {
                const computeUsage = (team.computeUsed / team.computeAllocation) * 100;
                const storageUsage = (team.storageUsed / team.storageAllocation) * 100;
                const budgetUsage = (team.budgetUsed / team.budget) * 100;
                return (
                  <div key={idx} className="table-row">
                    <span className="team-cell">
                      <Users size={16} />
                      {team.team}
                    </span>
                    <span className="allocation-cell">
                      <div className="allocation-bar">
                        <div 
                          className={`allocation-fill ${computeUsage > 90 ? 'critical' : computeUsage > 70 ? 'warning' : 'healthy'}`}
                          style={{ width: `${computeUsage}%` }}
                        />
                      </div>
                      <span>{team.computeUsed}/{team.computeAllocation}%</span>
                    </span>
                    <span className="allocation-cell">
                      <div className="allocation-bar">
                        <div 
                          className={`allocation-fill ${storageUsage > 90 ? 'critical' : storageUsage > 70 ? 'warning' : 'healthy'}`}
                          style={{ width: `${storageUsage}%` }}
                        />
                      </div>
                      <span>{team.storageUsed}/{team.storageAllocation}%</span>
                    </span>
                    <span className="budget-cell">
                      <div className="budget-bar">
                        <div 
                          className={`budget-fill ${budgetUsage > 90 ? 'critical' : budgetUsage > 70 ? 'warning' : 'healthy'}`}
                          style={{ width: `${budgetUsage}%` }}
                        />
                      </div>
                      <span>${team.budgetUsed.toLocaleString()} / ${team.budget.toLocaleString()}</span>
                    </span>
                    <span className={`status-cell ${budgetUsage > 90 ? 'critical' : budgetUsage > 70 ? 'warning' : 'healthy'}`}>
                      {budgetUsage > 90 ? 'Over Limit' : budgetUsage > 70 ? 'Near Limit' : 'On Track'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CapacityPlanningDashboard;
