'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Server,
  Cpu,
  HardDrive,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Download,
  BarChart2,
  Layers,
  Cloud,
  Database,
  Globe,
  Zap,
  Bell,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Layout,
  GitBranch,
  Box,
  Target
} from 'lucide-react';
import './resource-scheduling.css';

interface ScheduledResource {
  id: string;
  name: string;
  type: 'compute' | 'database' | 'storage' | 'network' | 'kubernetes' | 'serverless';
  provider: string;
  region: string;
  schedule: {
    timezone: string;
    startTime: string;
    endTime: string;
    days: string[];
    enabled: boolean;
  };
  currentState: 'running' | 'stopped' | 'starting' | 'stopping' | 'scheduled';
  nextAction: {
    action: 'start' | 'stop';
    time: string;
  };
  monthlySavings: number;
  tags: string[];
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
    timezone: string;
  };
  resourceCount: number;
  estimatedSavings: number;
}

interface CapacityForecast {
  date: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface ResourceUtilization {
  resourceId: string;
  name: string;
  type: string;
  avgCpu: number;
  avgMemory: number;
  avgNetwork: number;
  peakCpu: number;
  peakMemory: number;
  recommendation: 'upsize' | 'downsize' | 'optimal' | 'terminate';
  potentialSavings?: number;
}

const ResourceSchedulingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'templates' | 'calendar' | 'utilization' | 'forecast'>('schedules');
  const [selectedResource, setSelectedResource] = useState<ScheduledResource | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const scheduledResources: ScheduledResource[] = [
    {
      id: '1',
      name: 'dev-api-cluster',
      type: 'kubernetes',
      provider: 'AWS EKS',
      region: 'us-east-1',
      schedule: {
        timezone: 'America/New_York',
        startTime: '08:00',
        endTime: '20:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        enabled: true
      },
      currentState: 'running',
      nextAction: { action: 'stop', time: '2025-02-18T20:00:00' },
      monthlySavings: 2450,
      tags: ['development', 'api', 'team-platform']
    },
    {
      id: '2',
      name: 'staging-database-primary',
      type: 'database',
      provider: 'AWS RDS',
      region: 'us-east-1',
      schedule: {
        timezone: 'America/New_York',
        startTime: '07:00',
        endTime: '22:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        enabled: true
      },
      currentState: 'running',
      nextAction: { action: 'stop', time: '2025-02-18T22:00:00' },
      monthlySavings: 1890,
      tags: ['staging', 'database', 'team-backend']
    },
    {
      id: '3',
      name: 'qa-compute-pool',
      type: 'compute',
      provider: 'Azure VMs',
      region: 'eastus2',
      schedule: {
        timezone: 'America/Chicago',
        startTime: '09:00',
        endTime: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        enabled: true
      },
      currentState: 'stopped',
      nextAction: { action: 'start', time: '2025-02-19T09:00:00' },
      monthlySavings: 1650,
      tags: ['qa', 'testing', 'team-qa']
    },
    {
      id: '4',
      name: 'ml-training-gpu',
      type: 'compute',
      provider: 'GCP',
      region: 'us-central1',
      schedule: {
        timezone: 'America/Los_Angeles',
        startTime: '06:00',
        endTime: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        enabled: true
      },
      currentState: 'running',
      nextAction: { action: 'stop', time: '2025-02-18T18:00:00' },
      monthlySavings: 4200,
      tags: ['ml', 'gpu', 'team-data']
    },
    {
      id: '5',
      name: 'dev-storage-bucket',
      type: 'storage',
      provider: 'AWS S3',
      region: 'us-west-2',
      schedule: {
        timezone: 'UTC',
        startTime: '00:00',
        endTime: '23:59',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        enabled: false
      },
      currentState: 'running',
      nextAction: { action: 'stop', time: '2025-02-21T23:59:00' },
      monthlySavings: 320,
      tags: ['development', 'storage']
    },
    {
      id: '6',
      name: 'sandbox-lambda-pool',
      type: 'serverless',
      provider: 'AWS Lambda',
      region: 'eu-west-1',
      schedule: {
        timezone: 'Europe/London',
        startTime: '09:00',
        endTime: '17:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        enabled: true
      },
      currentState: 'scheduled',
      nextAction: { action: 'start', time: '2025-02-19T09:00:00' },
      monthlySavings: 560,
      tags: ['sandbox', 'serverless', 'team-frontend']
    }
  ];

  const scheduleTemplates: ScheduleTemplate[] = [
    {
      id: '1',
      name: 'Business Hours (US East)',
      description: 'Standard business hours for US East Coast teams',
      schedule: {
        startTime: '08:00',
        endTime: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezone: 'America/New_York'
      },
      resourceCount: 12,
      estimatedSavings: 8500
    },
    {
      id: '2',
      name: 'Extended Development',
      description: 'Extended hours for development environments',
      schedule: {
        startTime: '07:00',
        endTime: '22:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezone: 'America/New_York'
      },
      resourceCount: 8,
      estimatedSavings: 4200
    },
    {
      id: '3',
      name: 'EU Business Hours',
      description: 'Standard business hours for European teams',
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezone: 'Europe/London'
      },
      resourceCount: 5,
      estimatedSavings: 3100
    },
    {
      id: '4',
      name: 'Weekend Off',
      description: '24/7 weekdays, off on weekends',
      schedule: {
        startTime: '00:00',
        endTime: '23:59',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezone: 'UTC'
      },
      resourceCount: 3,
      estimatedSavings: 2800
    }
  ];

  const utilizationData: ResourceUtilization[] = [
    { resourceId: '1', name: 'prod-api-server-1', type: 'compute', avgCpu: 12, avgMemory: 34, avgNetwork: 45, peakCpu: 45, peakMemory: 68, recommendation: 'downsize', potentialSavings: 450 },
    { resourceId: '2', name: 'prod-api-server-2', type: 'compute', avgCpu: 78, avgMemory: 82, avgNetwork: 67, peakCpu: 95, peakMemory: 94, recommendation: 'upsize' },
    { resourceId: '3', name: 'prod-db-replica', type: 'database', avgCpu: 45, avgMemory: 58, avgNetwork: 32, peakCpu: 72, peakMemory: 78, recommendation: 'optimal' },
    { resourceId: '4', name: 'staging-cache', type: 'database', avgCpu: 8, avgMemory: 15, avgNetwork: 12, peakCpu: 25, peakMemory: 30, recommendation: 'downsize', potentialSavings: 280 },
    { resourceId: '5', name: 'dev-worker-pool', type: 'compute', avgCpu: 3, avgMemory: 8, avgNetwork: 5, peakCpu: 12, peakMemory: 18, recommendation: 'terminate', potentialSavings: 890 },
    { resourceId: '6', name: 'prod-worker-1', type: 'compute', avgCpu: 55, avgMemory: 62, avgNetwork: 48, peakCpu: 78, peakMemory: 85, recommendation: 'optimal' }
  ];

  const forecastData: CapacityForecast[] = [
    { date: '2025-02-18', predicted: 72, actual: 70, confidence: 95 },
    { date: '2025-02-19', predicted: 75, actual: 73, confidence: 94 },
    { date: '2025-02-20', predicted: 78, confidence: 92 },
    { date: '2025-02-21', predicted: 76, confidence: 90 },
    { date: '2025-02-22', predicted: 45, confidence: 88 },
    { date: '2025-02-23', predicted: 42, confidence: 86 },
    { date: '2025-02-24', predicted: 74, confidence: 85 },
    { date: '2025-02-25', predicted: 79, confidence: 82 },
    { date: '2025-02-26', predicted: 82, confidence: 80 },
    { date: '2025-02-27', predicted: 85, confidence: 78 }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'compute': return <Cpu size={18} />;
      case 'database': return <Database size={18} />;
      case 'storage': return <HardDrive size={18} />;
      case 'network': return <Globe size={18} />;
      case 'kubernetes': return <Box size={18} />;
      case 'serverless': return <Zap size={18} />;
      default: return <Server size={18} />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'running';
      case 'stopped': return 'stopped';
      case 'starting': return 'starting';
      case 'stopping': return 'stopping';
      case 'scheduled': return 'scheduled';
      default: return '';
    }
  };

  const totalSavings = scheduledResources.reduce((sum, r) => sum + r.monthlySavings, 0);
  const activeSchedules = scheduledResources.filter(r => r.schedule.enabled).length;
  const runningResources = scheduledResources.filter(r => r.currentState === 'running').length;

  const filteredResources = scheduledResources
    .filter(r => filterType === 'all' || r.type === filterType)
    .filter(r => filterState === 'all' || r.currentState === filterState)
    .filter(r => searchQuery === '' || r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="resource-scheduling">
      <header className="rs__header">
        <div className="rs__title-section">
          <div className="rs__icon">
            <Calendar size={28} />
          </div>
          <div>
            <h1>Resource Scheduling</h1>
            <p>Optimize costs with automated resource scheduling</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Schedule
          </button>
        </div>
      </header>

      <div className="savings-banner">
        <div className="savings-content">
          <div className="savings-icon">
            <TrendingDown size={24} />
          </div>
          <div className="savings-info">
            <span className="savings-label">Estimated Monthly Savings</span>
            <span className="savings-value">${totalSavings.toLocaleString()}</span>
          </div>
        </div>
        <div className="savings-stats">
          <div className="savings-stat">
            <span className="stat-value">{activeSchedules}</span>
            <span className="stat-label">Active Schedules</span>
          </div>
          <div className="savings-stat">
            <span className="stat-value">{runningResources}</span>
            <span className="stat-label">Running Now</span>
          </div>
          <div className="savings-stat">
            <span className="stat-value">{scheduledResources.length}</span>
            <span className="stat-label">Total Resources</span>
          </div>
        </div>
      </div>

      <nav className="rs__tabs">
        <button 
          className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <Clock size={16} />
          Schedules
          <span className="tab-badge">{scheduledResources.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Layout size={16} />
          Templates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          Calendar View
        </button>
        <button 
          className={`tab-btn ${activeTab === 'utilization' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilization')}
        >
          <Activity size={16} />
          Utilization
        </button>
        <button 
          className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <TrendingUp size={16} />
          Forecast
        </button>
      </nav>

      <main className="rs__content">
        {activeTab === 'schedules' && (
          <div className="schedules-tab">
            <div className="schedules-toolbar">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="compute">Compute</option>
                  <option value="database">Database</option>
                  <option value="storage">Storage</option>
                  <option value="kubernetes">Kubernetes</option>
                  <option value="serverless">Serverless</option>
                </select>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                  <option value="all">All States</option>
                  <option value="running">Running</option>
                  <option value="stopped">Stopped</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div className="schedules-list">
              {filteredResources.map(resource => (
                <div 
                  key={resource.id} 
                  className={`schedule-card ${resource.currentState} ${!resource.schedule.enabled ? 'disabled' : ''}`}
                >
                  <div className="schedule-header">
                    <div className={`resource-icon ${resource.type}`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="resource-info">
                      <h4>{resource.name}</h4>
                      <div className="resource-meta">
                        <span className="provider">{resource.provider}</span>
                        <span className="region">{resource.region}</span>
                      </div>
                    </div>
                    <div className="schedule-status">
                      <span className={`state-badge ${getStateColor(resource.currentState)}`}>
                        {resource.currentState === 'running' && <Play size={12} />}
                        {resource.currentState === 'stopped' && <Pause size={12} />}
                        {resource.currentState === 'starting' && <RotateCcw size={12} />}
                        {resource.currentState === 'stopping' && <RotateCcw size={12} />}
                        {resource.currentState === 'scheduled' && <Clock size={12} />}
                        {resource.currentState}
                      </span>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={resource.schedule.enabled}
                          onChange={() => {}}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="schedule-details">
                    <div className="schedule-time">
                      <Clock size={14} />
                      <span>{resource.schedule.startTime} - {resource.schedule.endTime}</span>
                      <span className="timezone">{resource.schedule.timezone}</span>
                    </div>
                    <div className="schedule-days">
                      {daysOfWeek.map(day => (
                        <span 
                          key={day} 
                          className={`day-badge ${resource.schedule.days.includes(day) ? 'active' : ''}`}
                        >
                          {day.charAt(0)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="schedule-footer">
                    <div className="next-action">
                      <span className="action-label">Next:</span>
                      <span className={`action-value ${resource.nextAction.action}`}>
                        {resource.nextAction.action === 'start' ? <Play size={12} /> : <Pause size={12} />}
                        {resource.nextAction.action} at {new Date(resource.nextAction.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="savings-indicator">
                      <TrendingDown size={14} />
                      <span>${resource.monthlySavings}/mo</span>
                    </div>
                    <div className="schedule-actions">
                      <button className="action-btn" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button className="action-btn" title="Force Action">
                        {resource.currentState === 'running' ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button className="action-btn delete" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="schedule-tags">
                    {resource.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-tab">
            <div className="templates-header">
              <h3>Schedule Templates</h3>
              <button className="btn-primary">
                <Plus size={16} />
                Create Template
              </button>
            </div>

            <div className="templates-grid">
              {scheduleTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <h4>{template.name}</h4>
                    <button className="btn-outline small">
                      <Copy size={14} />
                      Apply
                    </button>
                  </div>
                  <p className="template-desc">{template.description}</p>
                  
                  <div className="template-schedule">
                    <div className="schedule-row">
                      <Clock size={14} />
                      <span>{template.schedule.startTime} - {template.schedule.endTime}</span>
                    </div>
                    <div className="schedule-row">
                      <Calendar size={14} />
                      <span>{template.schedule.days.join(', ')}</span>
                    </div>
                    <div className="schedule-row">
                      <Globe size={14} />
                      <span>{template.schedule.timezone}</span>
                    </div>
                  </div>

                  <div className="template-stats">
                    <div className="template-stat">
                      <span className="stat-value">{template.resourceCount}</span>
                      <span className="stat-label">Resources</span>
                    </div>
                    <div className="template-stat savings">
                      <span className="stat-value">${template.estimatedSavings.toLocaleString()}</span>
                      <span className="stat-label">Est. Savings/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-tab">
            <div className="calendar-header">
              <button className="btn-outline small" onClick={() => {
                const prev = new Date(currentWeek);
                prev.setDate(prev.getDate() - 7);
                setCurrentWeek(prev);
              }}>
                <ChevronLeft size={16} />
              </button>
              <h3>
                Week of {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h3>
              <button className="btn-outline small" onClick={() => {
                const next = new Date(currentWeek);
                next.setDate(next.getDate() + 7);
                setCurrentWeek(next);
              }}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-sidebar">
                <div className="time-slot header"></div>
                {scheduledResources.slice(0, 5).map(resource => (
                  <div key={resource.id} className="resource-row">
                    <div className={`resource-icon small ${resource.type}`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    <span className="resource-name">{resource.name}</span>
                  </div>
                ))}
              </div>
              <div className="calendar-content">
                <div className="day-headers">
                  {daysOfWeek.map((day, idx) => {
                    const date = new Date(currentWeek);
                    date.setDate(date.getDate() - date.getDay() + idx);
                    return (
                      <div key={day} className={`day-header ${idx === 0 || idx === 6 ? 'weekend' : ''}`}>
                        <span className="day-name">{day}</span>
                        <span className="day-date">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="schedule-grid">
                  {scheduledResources.slice(0, 5).map(resource => (
                    <div key={resource.id} className="schedule-row">
                      {daysOfWeek.map((day, idx) => {
                        const isActive = resource.schedule.days.includes(day);
                        return (
                          <div key={`${resource.id}-${day}`} className={`schedule-cell ${idx === 0 || idx === 6 ? 'weekend' : ''}`}>
                            {isActive && resource.schedule.enabled && (
                              <div className={`schedule-block ${resource.type}`}>
                                <span className="block-time">{resource.schedule.startTime}</span>
                                <span className="block-time">{resource.schedule.endTime}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilization' && (
          <div className="utilization-tab">
            <div className="utilization-header">
              <h3>Resource Utilization Analysis</h3>
              <div className="time-selector">
                <select defaultValue="7d">
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>

            <div className="utilization-summary">
              <div className="summary-card">
                <div className="summary-icon downsize">
                  <TrendingDown size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{utilizationData.filter(u => u.recommendation === 'downsize').length}</span>
                  <span className="summary-label">Rightsizing Opportunities</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon terminate">
                  <XCircle size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{utilizationData.filter(u => u.recommendation === 'terminate').length}</span>
                  <span className="summary-label">Idle Resources</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon upsize">
                  <TrendingUp size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">{utilizationData.filter(u => u.recommendation === 'upsize').length}</span>
                  <span className="summary-label">Need Scaling Up</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon savings">
                  <Target size={20} />
                </div>
                <div className="summary-info">
                  <span className="summary-value">${utilizationData.reduce((sum, u) => sum + (u.potentialSavings || 0), 0).toLocaleString()}</span>
                  <span className="summary-label">Potential Savings</span>
                </div>
              </div>
            </div>

            <div className="utilization-table">
              <div className="table-header">
                <span>Resource</span>
                <span>Type</span>
                <span>Avg CPU</span>
                <span>Avg Memory</span>
                <span>Peak CPU</span>
                <span>Recommendation</span>
                <span>Savings</span>
              </div>
              {utilizationData.map(resource => (
                <div key={resource.resourceId} className="table-row">
                  <span className="resource-cell">
                    <div className={`resource-icon small ${resource.type}`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    {resource.name}
                  </span>
                  <span className="type-cell">{resource.type}</span>
                  <span className="metric-cell">
                    <div className="metric-bar">
                      <div 
                        className={`metric-fill ${resource.avgCpu < 20 ? 'low' : resource.avgCpu > 70 ? 'high' : 'medium'}`} 
                        style={{ width: `${resource.avgCpu}%` }}
                      />
                    </div>
                    <span>{resource.avgCpu}%</span>
                  </span>
                  <span className="metric-cell">
                    <div className="metric-bar">
                      <div 
                        className={`metric-fill ${resource.avgMemory < 20 ? 'low' : resource.avgMemory > 70 ? 'high' : 'medium'}`} 
                        style={{ width: `${resource.avgMemory}%` }}
                      />
                    </div>
                    <span>{resource.avgMemory}%</span>
                  </span>
                  <span className="peak-cell">{resource.peakCpu}%</span>
                  <span className={`recommendation-cell ${resource.recommendation}`}>
                    {resource.recommendation === 'downsize' && <TrendingDown size={14} />}
                    {resource.recommendation === 'upsize' && <TrendingUp size={14} />}
                    {resource.recommendation === 'terminate' && <XCircle size={14} />}
                    {resource.recommendation === 'optimal' && <CheckCircle2 size={14} />}
                    {resource.recommendation}
                  </span>
                  <span className="savings-cell">
                    {resource.potentialSavings ? `$${resource.potentialSavings}/mo` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="forecast-tab">
            <div className="forecast-header">
              <h3>Capacity Forecast</h3>
              <div className="forecast-legend">
                <span className="legend-item predicted"><span className="dot" /> Predicted</span>
                <span className="legend-item actual"><span className="dot" /> Actual</span>
                <span className="legend-item confidence">Confidence Range</span>
              </div>
            </div>

            <div className="forecast-chart">
              <div className="chart-y-axis">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              <div className="chart-content">
                <div className="chart-bars">
                  {forecastData.map((data, idx) => (
                    <div key={idx} className="forecast-bar-container">
                      <div 
                        className="forecast-bar predicted" 
                        style={{ height: `${data.predicted}%` }}
                      >
                        <div 
                          className="confidence-range" 
                          style={{ 
                            height: `${(100 - data.confidence) * 2}%`,
                            top: `-${(100 - data.confidence)}%`
                          }}
                        />
                      </div>
                      {data.actual && (
                        <div 
                          className="forecast-bar actual" 
                          style={{ height: `${data.actual}%` }}
                        />
                      )}
                      <span className="bar-label">{new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="forecast-insights">
              <h4>Insights</h4>
              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-icon peak">
                    <TrendingUp size={18} />
                  </div>
                  <div className="insight-content">
                    <span className="insight-title">Peak Capacity Expected</span>
                    <span className="insight-value">Feb 27 - 85% utilization</span>
                    <span className="insight-action">Consider scaling up before Thursday</span>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-icon low">
                    <TrendingDown size={18} />
                  </div>
                  <div className="insight-content">
                    <span className="insight-title">Low Utilization Weekend</span>
                    <span className="insight-value">Feb 22-23 - ~43% utilization</span>
                    <span className="insight-action">Consider scheduling downtime</span>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-icon cost">
                    <Target size={18} />
                  </div>
                  <div className="insight-content">
                    <span className="insight-title">Optimization Opportunity</span>
                    <span className="insight-value">$1,240 potential savings</span>
                    <span className="insight-action">Enable weekend scheduling for dev resources</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResourceSchedulingSystem;
