'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  Clock,
  DollarSign,
  Target,
  Award,
  Calendar,
  PieChart,
  Activity,
  Briefcase,
  Building2,
  MapPin,
  Globe,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Maximize2,
  MoreVertical,
  FileText,
  Layers,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Percent,
  Heart,
  GraduationCap,
  Star,
  ThumbsUp,
  Share2,
  Bookmark,
  CalendarDays
} from 'lucide-react';
import './analytics.css';

interface WorkforceMetric {
  id: string;
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  period: string;
}

interface DepartmentData {
  name: string;
  headcount: number;
  budget: number;
  utilization: number;
  turnover: number;
  avgTenure: number;
  color: string;
}

interface TurnoverData {
  month: string;
  voluntary: number;
  involuntary: number;
  total: number;
}

interface DiversityMetric {
  category: string;
  segments: { label: string; value: number; color: string }[];
}

interface TenureData {
  range: string;
  count: number;
  percentage: number;
}

interface PerformanceDistribution {
  rating: string;
  count: number;
  percentage: number;
  color: string;
}

interface HeadcountTrend {
  month: string;
  total: number;
  hires: number;
  departures: number;
}

type TabType = 'overview' | 'headcount' | 'turnover' | 'diversity' | 'compensation' | 'engagement';

const workforceMetrics: WorkforceMetric[] = [
  { id: 'total-headcount', label: 'Total Headcount', value: 1247, change: 5.2, trend: 'up', period: 'vs last quarter' },
  { id: 'turnover-rate', label: 'Turnover Rate', value: '12.4%', change: -1.8, trend: 'down', period: 'vs last year' },
  { id: 'avg-tenure', label: 'Avg Tenure', value: '3.2 yrs', change: 0.4, trend: 'up', period: 'vs last year' },
  { id: 'open-positions', label: 'Open Positions', value: 47, change: 12, trend: 'up', period: 'vs last month' },
  { id: 'time-to-fill', label: 'Time to Fill', value: '32 days', change: -5, trend: 'down', period: 'vs avg' },
  { id: 'engagement-score', label: 'Engagement Score', value: '78%', change: 3, trend: 'up', period: 'vs last survey' }
];

const departmentData: DepartmentData[] = [
  { name: 'Engineering', headcount: 412, budget: 48500000, utilization: 94, turnover: 8.2, avgTenure: 2.8, color: '#ec4899' },
  { name: 'Sales', headcount: 286, budget: 32000000, utilization: 88, turnover: 18.5, avgTenure: 2.1, color: '#8b5cf6' },
  { name: 'Marketing', headcount: 145, budget: 15200000, utilization: 91, turnover: 11.3, avgTenure: 3.4, color: '#06b6d4' },
  { name: 'Operations', headcount: 178, budget: 12800000, utilization: 96, turnover: 9.8, avgTenure: 4.2, color: '#10b981' },
  { name: 'HR', headcount: 52, budget: 4200000, utilization: 89, turnover: 6.5, avgTenure: 5.1, color: '#f59e0b' },
  { name: 'Finance', headcount: 68, budget: 6100000, utilization: 92, turnover: 7.2, avgTenure: 4.8, color: '#3b82f6' },
  { name: 'Product', headcount: 76, budget: 9800000, utilization: 95, turnover: 10.1, avgTenure: 2.6, color: '#ef4444' },
  { name: 'Customer Success', headcount: 30, budget: 2800000, utilization: 87, turnover: 15.2, avgTenure: 1.9, color: '#84cc16' }
];

const turnoverData: TurnoverData[] = [
  { month: 'Jan', voluntary: 12, involuntary: 3, total: 15 },
  { month: 'Feb', voluntary: 8, involuntary: 2, total: 10 },
  { month: 'Mar', voluntary: 15, involuntary: 4, total: 19 },
  { month: 'Apr', voluntary: 10, involuntary: 2, total: 12 },
  { month: 'May', voluntary: 14, involuntary: 5, total: 19 },
  { month: 'Jun', voluntary: 18, involuntary: 3, total: 21 },
  { month: 'Jul', voluntary: 11, involuntary: 4, total: 15 },
  { month: 'Aug', voluntary: 9, involuntary: 2, total: 11 },
  { month: 'Sep', voluntary: 13, involuntary: 3, total: 16 },
  { month: 'Oct', voluntary: 16, involuntary: 4, total: 20 },
  { month: 'Nov', voluntary: 7, involuntary: 2, total: 9 },
  { month: 'Dec', voluntary: 5, involuntary: 1, total: 6 }
];

const diversityMetrics: DiversityMetric[] = [
  {
    category: 'Gender',
    segments: [
      { label: 'Male', value: 58, color: '#3b82f6' },
      { label: 'Female', value: 39, color: '#ec4899' },
      { label: 'Non-binary', value: 3, color: '#8b5cf6' }
    ]
  },
  {
    category: 'Age Distribution',
    segments: [
      { label: '18-25', value: 15, color: '#10b981' },
      { label: '26-35', value: 42, color: '#06b6d4' },
      { label: '36-45', value: 28, color: '#f59e0b' },
      { label: '46+', value: 15, color: '#ef4444' }
    ]
  },
  {
    category: 'Ethnicity',
    segments: [
      { label: 'White', value: 52, color: '#94a3b8' },
      { label: 'Asian', value: 24, color: '#f97316' },
      { label: 'Hispanic', value: 12, color: '#84cc16' },
      { label: 'Black', value: 8, color: '#8b5cf6' },
      { label: 'Other', value: 4, color: '#06b6d4' }
    ]
  }
];

const tenureData: TenureData[] = [
  { range: '< 1 year', count: 298, percentage: 24 },
  { range: '1-2 years', count: 312, percentage: 25 },
  { range: '2-5 years', count: 398, percentage: 32 },
  { range: '5-10 years', count: 186, percentage: 15 },
  { range: '10+ years', count: 53, percentage: 4 }
];

const performanceDistribution: PerformanceDistribution[] = [
  { rating: 'Exceptional', count: 125, percentage: 10, color: '#10b981' },
  { rating: 'Exceeds', count: 312, percentage: 25, color: '#22c55e' },
  { rating: 'Meets', count: 623, percentage: 50, color: '#3b82f6' },
  { rating: 'Developing', count: 150, percentage: 12, color: '#f59e0b' },
  { rating: 'Needs Improvement', count: 37, percentage: 3, color: '#ef4444' }
];

const headcountTrend: HeadcountTrend[] = [
  { month: 'Jan', total: 1180, hires: 25, departures: 15 },
  { month: 'Feb', total: 1190, hires: 20, departures: 10 },
  { month: 'Mar', total: 1195, hires: 24, departures: 19 },
  { month: 'Apr', total: 1207, hires: 24, departures: 12 },
  { month: 'May', total: 1212, hires: 24, departures: 19 },
  { month: 'Jun', total: 1218, hires: 27, departures: 21 },
  { month: 'Jul', total: 1230, hires: 27, departures: 15 },
  { month: 'Aug', total: 1238, hires: 19, departures: 11 },
  { month: 'Sep', total: 1241, hires: 19, departures: 16 },
  { month: 'Oct', total: 1240, hires: 19, departures: 20 },
  { month: 'Nov', total: 1245, hires: 14, departures: 9 },
  { month: 'Dec', total: 1247, hires: 8, departures: 6 }
];

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${(amount / 1000).toFixed(0)}K`;
};

export default function WorkforceAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeRange, setTimeRange] = useState<string>('12m');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const maxHeadcount = Math.max(...departmentData.map(d => d.headcount));
  const totalHeadcount = departmentData.reduce((sum, d) => sum + d.headcount, 0);
  const maxTurnover = Math.max(...turnoverData.map(d => d.total));

  const renderOverview = () => (
    <div className="overview-content">
      <div className="metrics-row">
        {workforceMetrics.map(metric => (
          <div key={metric.id} className={`metric-card ${metric.trend}`}>
            <div className="metric-header">
              <span className="metric-label">{metric.label}</span>
              <span className={`metric-trend ${metric.trend}`}>
                {metric.trend === 'up' ? <ArrowUpRight size={14} /> : 
                 metric.trend === 'down' ? <ArrowDownRight size={14} /> : null}
                {metric.change > 0 ? '+' : ''}{metric.change}
                {metric.label.includes('%') || metric.label.includes('Rate') || metric.label.includes('Score') ? 'pp' : ''}
              </span>
            </div>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-period">{metric.period}</span>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <div className="analytics-card wide">
          <div className="card-header">
            <h3><Activity size={18} /> Headcount Trend</h3>
            <div className="card-actions">
              <select className="mini-select" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="3m">3 months</option>
                <option value="6m">6 months</option>
                <option value="12m">12 months</option>
              </select>
              <button className="icon-btn"><Maximize2 size={14} /></button>
            </div>
          </div>
          <div className="headcount-chart">
            <div className="chart-area">
              {headcountTrend.map((data, index) => (
                <div key={data.month} className="chart-column">
                  <div className="column-bar-container">
                    <div 
                      className="column-bar total"
                      style={{ height: `${((data.total - 1150) / 100) * 100}%` }}
                    />
                  </div>
                  <span className="column-label">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot total" />
                <span>Total Headcount</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><PieChart size={18} /> By Department</h3>
            <button className="icon-btn"><MoreVertical size={14} /></button>
          </div>
          <div className="department-breakdown">
            <div className="dept-donut">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a24" strokeWidth="16" />
                {departmentData.reduce((acc, dept, index) => {
                  const percentage = (dept.headcount / totalHeadcount) * 100;
                  const dashArray = (percentage / 100) * 251.2;
                  const dashOffset = -acc.offset;
                  acc.elements.push(
                    <circle
                      key={dept.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={dept.color}
                      strokeWidth="16"
                      strokeDasharray={`${dashArray} 251.2`}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 50 50)"
                    />
                  );
                  acc.offset += dashArray;
                  return acc;
                }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
              </svg>
              <div className="donut-center">
                <span className="donut-value">{totalHeadcount}</span>
                <span className="donut-label">Total</span>
              </div>
            </div>
            <div className="dept-list">
              {departmentData.slice(0, 5).map(dept => (
                <div key={dept.name} className="dept-item">
                  <span className="dept-color" style={{ backgroundColor: dept.color }} />
                  <span className="dept-name">{dept.name}</span>
                  <span className="dept-count">{dept.headcount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><UserMinus size={18} /> Turnover Analysis</h3>
            <button className="icon-btn"><MoreVertical size={14} /></button>
          </div>
          <div className="turnover-summary">
            <div className="turnover-stat main">
              <span className="stat-value">12.4%</span>
              <span className="stat-label">Annual Rate</span>
            </div>
            <div className="turnover-breakdown">
              <div className="turnover-item">
                <span className="item-label">Voluntary</span>
                <span className="item-value">9.8%</span>
                <div className="item-bar">
                  <div className="bar-fill voluntary" style={{ width: '79%' }} />
                </div>
              </div>
              <div className="turnover-item">
                <span className="item-label">Involuntary</span>
                <span className="item-value">2.6%</span>
                <div className="item-bar">
                  <div className="bar-fill involuntary" style={{ width: '21%' }} />
                </div>
              </div>
            </div>
            <div className="turnover-trend">
              <span className="trend-label">vs Industry Avg (15.2%)</span>
              <span className="trend-badge good">-2.8pp below</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Star size={18} /> Performance Distribution</h3>
            <button className="icon-btn"><MoreVertical size={14} /></button>
          </div>
          <div className="performance-chart">
            {performanceDistribution.map(item => (
              <div key={item.rating} className="perf-bar-group">
                <div className="perf-label">
                  <span className="perf-rating">{item.rating}</span>
                  <span className="perf-count">{item.count}</span>
                </div>
                <div className="perf-bar-container">
                  <div 
                    className="perf-bar"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="perf-percent">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Clock size={18} /> Tenure Distribution</h3>
            <button className="icon-btn"><MoreVertical size={14} /></button>
          </div>
          <div className="tenure-chart">
            {tenureData.map((item, index) => (
              <div key={item.range} className="tenure-bar-group">
                <span className="tenure-range">{item.range}</span>
                <div className="tenure-bar-container">
                  <div 
                    className="tenure-bar"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="tenure-stats">
                  <span className="tenure-count">{item.count}</span>
                  <span className="tenure-percent">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="tenure-average">
            <span>Average Tenure:</span>
            <strong>3.2 years</strong>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Target size={18} /> Hiring Pipeline</h3>
            <button className="icon-btn"><MoreVertical size={14} /></button>
          </div>
          <div className="pipeline-funnel">
            <div className="funnel-stage">
              <div className="stage-bar" style={{ width: '100%' }}>
                <span className="stage-label">Applications</span>
                <span className="stage-count">2,847</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="stage-bar" style={{ width: '42%' }}>
                <span className="stage-label">Screened</span>
                <span className="stage-count">1,196</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="stage-bar" style={{ width: '18%' }}>
                <span className="stage-label">Interviewed</span>
                <span className="stage-count">512</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="stage-bar" style={{ width: '7%' }}>
                <span className="stage-label">Offered</span>
                <span className="stage-count">199</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="stage-bar filled" style={{ width: '5%' }}>
                <span className="stage-label">Hired</span>
                <span className="stage-count">142</span>
              </div>
            </div>
          </div>
          <div className="pipeline-metrics">
            <div className="pipe-metric">
              <span className="metric-val">5.0%</span>
              <span className="metric-lbl">Conversion Rate</span>
            </div>
            <div className="pipe-metric">
              <span className="metric-val">32 days</span>
              <span className="metric-lbl">Avg Time to Fill</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeadcount = () => (
    <div className="headcount-content">
      <div className="content-toolbar">
        <div className="toolbar-left">
          <select 
            className="filter-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departmentData.map(dept => (
              <option key={dept.name} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          <select className="filter-select">
            <option value="all">All Locations</option>
            <option value="us">United States</option>
            <option value="eu">Europe</option>
            <option value="apac">Asia Pacific</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="dept-cards-grid">
        {departmentData.map(dept => (
          <div key={dept.name} className="dept-card">
            <div className="dept-card-header">
              <div className="dept-icon" style={{ backgroundColor: dept.color }}>
                <Building2 size={18} />
              </div>
              <div className="dept-title">
                <h4>{dept.name}</h4>
                <span className="dept-subtitle">{dept.headcount} employees</span>
              </div>
            </div>
            
            <div className="dept-metrics">
              <div className="dept-metric">
                <span className="metric-label">Budget</span>
                <span className="metric-value">{formatCurrency(dept.budget)}</span>
              </div>
              <div className="dept-metric">
                <span className="metric-label">Utilization</span>
                <span className="metric-value">{dept.utilization}%</span>
              </div>
              <div className="dept-metric">
                <span className="metric-label">Turnover</span>
                <span className={`metric-value ${dept.turnover > 15 ? 'warning' : 'good'}`}>
                  {dept.turnover}%
                </span>
              </div>
              <div className="dept-metric">
                <span className="metric-label">Avg Tenure</span>
                <span className="metric-value">{dept.avgTenure} yrs</span>
              </div>
            </div>

            <div className="dept-progress">
              <div className="progress-header">
                <span>Headcount vs Capacity</span>
                <span>{dept.utilization}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${dept.utilization}%`,
                    backgroundColor: dept.color 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTurnover = () => (
    <div className="turnover-content">
      <div className="turnover-header-stats">
        <div className="turnover-stat-card">
          <UserMinus size={24} />
          <div className="stat-info">
            <span className="stat-value">12.4%</span>
            <span className="stat-label">Annual Turnover</span>
          </div>
          <span className="stat-trend down">
            <ArrowDownRight size={14} />
            -1.8pp
          </span>
        </div>
        <div className="turnover-stat-card">
          <XCircle size={24} />
          <div className="stat-info">
            <span className="stat-value">9.8%</span>
            <span className="stat-label">Voluntary</span>
          </div>
        </div>
        <div className="turnover-stat-card">
          <AlertCircle size={24} />
          <div className="stat-info">
            <span className="stat-value">2.6%</span>
            <span className="stat-label">Involuntary</span>
          </div>
        </div>
        <div className="turnover-stat-card">
          <DollarSign size={24} />
          <div className="stat-info">
            <span className="stat-value">$2.4M</span>
            <span className="stat-label">Est. Turnover Cost</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card wide">
          <div className="card-header">
            <h3><BarChart3 size={18} /> Monthly Turnover</h3>
            <div className="card-actions">
              <select className="mini-select">
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>
          <div className="turnover-chart-area">
            {turnoverData.map((data, index) => (
              <div key={data.month} className="turnover-bar-group">
                <div className="stacked-bar-container">
                  <div 
                    className="stacked-bar voluntary"
                    style={{ height: `${(data.voluntary / maxTurnover) * 100}%` }}
                  />
                  <div 
                    className="stacked-bar involuntary"
                    style={{ height: `${(data.involuntary / maxTurnover) * 100}%` }}
                  />
                </div>
                <span className="bar-label">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot voluntary" />
              <span>Voluntary</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot involuntary" />
              <span>Involuntary</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Building2 size={18} /> By Department</h3>
          </div>
          <div className="dept-turnover-list">
            {departmentData
              .sort((a, b) => b.turnover - a.turnover)
              .map(dept => (
                <div key={dept.name} className="dept-turnover-item">
                  <div className="dept-info">
                    <span className="dept-color-dot" style={{ backgroundColor: dept.color }} />
                    <span className="dept-name">{dept.name}</span>
                  </div>
                  <div className="turnover-bar-sm">
                    <div 
                      className="bar-fill-sm"
                      style={{ 
                        width: `${(dept.turnover / 20) * 100}%`,
                        backgroundColor: dept.turnover > 15 ? '#ef4444' : dept.turnover > 10 ? '#f59e0b' : '#10b981'
                      }}
                    />
                  </div>
                  <span className={`turnover-rate ${dept.turnover > 15 ? 'high' : dept.turnover > 10 ? 'medium' : 'low'}`}>
                    {dept.turnover}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><FileText size={18} /> Exit Reasons</h3>
          </div>
          <div className="exit-reasons">
            <div className="reason-item">
              <div className="reason-info">
                <span className="reason-name">Better Compensation</span>
                <span className="reason-percent">28%</span>
              </div>
              <div className="reason-bar">
                <div className="reason-fill" style={{ width: '28%' }} />
              </div>
            </div>
            <div className="reason-item">
              <div className="reason-info">
                <span className="reason-name">Career Growth</span>
                <span className="reason-percent">24%</span>
              </div>
              <div className="reason-bar">
                <div className="reason-fill" style={{ width: '24%' }} />
              </div>
            </div>
            <div className="reason-item">
              <div className="reason-info">
                <span className="reason-name">Work-Life Balance</span>
                <span className="reason-percent">18%</span>
              </div>
              <div className="reason-bar">
                <div className="reason-fill" style={{ width: '18%' }} />
              </div>
            </div>
            <div className="reason-item">
              <div className="reason-info">
                <span className="reason-name">Management Issues</span>
                <span className="reason-percent">15%</span>
              </div>
              <div className="reason-bar">
                <div className="reason-fill" style={{ width: '15%' }} />
              </div>
            </div>
            <div className="reason-item">
              <div className="reason-info">
                <span className="reason-name">Relocation</span>
                <span className="reason-percent">10%</span>
              </div>
              <div className="reason-bar">
                <div className="reason-fill" style={{ width: '10%' }} />
              </div>
            </div>
            <div className="reason-item">
              <div className="reason-info">
                <span className="reason-name">Other</span>
                <span className="reason-percent">5%</span>
              </div>
              <div className="reason-bar">
                <div className="reason-fill" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiversity = () => (
    <div className="diversity-content">
      <div className="diversity-grid">
        {diversityMetrics.map(metric => (
          <div key={metric.category} className="diversity-card">
            <h3>{metric.category}</h3>
            <div className="diversity-chart">
              <div className="diversity-donut">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a24" strokeWidth="12" />
                  {metric.segments.reduce((acc, segment, index) => {
                    const dashArray = (segment.value / 100) * 251.2;
                    const dashOffset = -acc.offset;
                    acc.elements.push(
                      <circle
                        key={segment.label}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="12"
                        strokeDasharray={`${dashArray} 251.2`}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 50 50)"
                      />
                    );
                    acc.offset += dashArray;
                    return acc;
                  }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                </svg>
              </div>
              <div className="diversity-legend">
                {metric.segments.map(segment => (
                  <div key={segment.label} className="div-legend-item">
                    <span className="div-color" style={{ backgroundColor: segment.color }} />
                    <span className="div-label">{segment.label}</span>
                    <span className="div-value">{segment.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="diversity-card wide">
          <h3>Diversity Goals Progress</h3>
          <div className="goals-grid">
            <div className="goal-item">
              <div className="goal-header">
                <span className="goal-title">Women in Leadership</span>
                <span className="goal-target">Target: 40%</span>
              </div>
              <div className="goal-progress">
                <div className="goal-bar">
                  <div className="goal-fill" style={{ width: '35%' }} />
                  <div className="goal-marker" style={{ left: '40%' }} />
                </div>
                <span className="goal-current">Current: 35%</span>
              </div>
            </div>
            <div className="goal-item">
              <div className="goal-header">
                <span className="goal-title">Underrepresented Groups</span>
                <span className="goal-target">Target: 30%</span>
              </div>
              <div className="goal-progress">
                <div className="goal-bar">
                  <div className="goal-fill achieved" style={{ width: '32%' }} />
                  <div className="goal-marker" style={{ left: '30%' }} />
                </div>
                <span className="goal-current achieved">Current: 32% ✓</span>
              </div>
            </div>
            <div className="goal-item">
              <div className="goal-header">
                <span className="goal-title">Pay Equity Gap</span>
                <span className="goal-target">Target: &lt;3%</span>
              </div>
              <div className="goal-progress">
                <div className="goal-bar inverted">
                  <div className="goal-fill" style={{ width: '45%' }} />
                  <div className="goal-marker" style={{ left: '30%' }} />
                </div>
                <span className="goal-current">Current: 4.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompensation = () => (
    <div className="compensation-content">
      <div className="comp-stats-row">
        <div className="comp-stat-card">
          <DollarSign size={24} />
          <div className="stat-info">
            <span className="stat-value">$95,420</span>
            <span className="stat-label">Average Salary</span>
          </div>
        </div>
        <div className="comp-stat-card">
          <TrendingUp size={24} />
          <div className="stat-info">
            <span className="stat-value">4.2%</span>
            <span className="stat-label">Avg Merit Increase</span>
          </div>
        </div>
        <div className="comp-stat-card">
          <Percent size={24} />
          <div className="stat-info">
            <span className="stat-value">98%</span>
            <span className="stat-label">Compa-Ratio</span>
          </div>
        </div>
        <div className="comp-stat-card">
          <Award size={24} />
          <div className="stat-info">
            <span className="stat-value">$1.85M</span>
            <span className="stat-label">Total Bonus Pool</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card wide">
          <div className="card-header">
            <h3><BarChart3 size={18} /> Salary Distribution by Level</h3>
          </div>
          <div className="salary-dist-chart">
            {[
              { level: 'L2 Junior', min: 65, mid: 80, max: 95, avg: 78 },
              { level: 'L3 Mid', min: 85, mid: 105, max: 125, avg: 102 },
              { level: 'L4 Senior', min: 115, mid: 140, max: 165, avg: 138 },
              { level: 'L5 Staff', min: 150, mid: 180, max: 210, avg: 175 },
              { level: 'L6 Principal', min: 190, mid: 230, max: 270, avg: 225 },
              { level: 'M2 Manager', min: 110, mid: 135, max: 160, avg: 132 },
              { level: 'M3 Sr Manager', min: 145, mid: 175, max: 205, avg: 172 },
              { level: 'D2 Director', min: 160, mid: 195, max: 230, avg: 192 }
            ].map(level => (
              <div key={level.level} className="salary-level-row">
                <span className="level-name">{level.level}</span>
                <div className="salary-range-bar">
                  <div 
                    className="range-track"
                    style={{ 
                      left: `${(level.min / 280) * 100}%`,
                      width: `${((level.max - level.min) / 280) * 100}%`
                    }}
                  />
                  <div 
                    className="range-avg"
                    style={{ left: `${(level.avg / 280) * 100}%` }}
                  />
                </div>
                <span className="level-range">${level.min}K - ${level.max}K</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Building2 size={18} /> By Department</h3>
          </div>
          <div className="dept-salary-list">
            {departmentData.map(dept => (
              <div key={dept.name} className="dept-salary-item">
                <span className="dept-dot" style={{ backgroundColor: dept.color }} />
                <span className="dept-name">{dept.name}</span>
                <span className="dept-budget">{formatCurrency(dept.budget)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Globe size={18} /> By Location</h3>
          </div>
          <div className="location-salary-list">
            {[
              { location: 'San Francisco', avg: 142000, employees: 312 },
              { location: 'New York', avg: 135000, employees: 248 },
              { location: 'Seattle', avg: 128000, employees: 186 },
              { location: 'Austin', avg: 112000, employees: 145 },
              { location: 'Chicago', avg: 105000, employees: 98 },
              { location: 'Remote', avg: 98000, employees: 258 }
            ].map(loc => (
              <div key={loc.location} className="loc-item">
                <div className="loc-info">
                  <MapPin size={14} />
                  <span className="loc-name">{loc.location}</span>
                </div>
                <div className="loc-stats">
                  <span className="loc-avg">${(loc.avg / 1000).toFixed(0)}K</span>
                  <span className="loc-count">{loc.employees} emp</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEngagement = () => (
    <div className="engagement-content">
      <div className="engagement-header">
        <div className="engagement-score-card">
          <div className="score-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a24" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#f97316"
                strokeWidth="8"
                strokeDasharray={`${78 * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-center">
              <span className="score-value">78</span>
              <span className="score-label">out of 100</span>
            </div>
          </div>
          <div className="score-info">
            <h3>Employee Engagement Score</h3>
            <p>Based on latest pulse survey (Jan 2025)</p>
            <div className="score-trend">
              <span className="trend-badge positive">
                <ArrowUpRight size={14} />
                +3 points vs last quarter
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card wide">
          <div className="card-header">
            <h3><Activity size={18} /> Engagement Dimensions</h3>
          </div>
          <div className="dimensions-chart">
            {[
              { name: 'Job Satisfaction', score: 82, benchmark: 75 },
              { name: 'Manager Relationship', score: 79, benchmark: 72 },
              { name: 'Growth Opportunities', score: 68, benchmark: 70 },
              { name: 'Work-Life Balance', score: 74, benchmark: 68 },
              { name: 'Company Culture', score: 85, benchmark: 76 },
              { name: 'Communication', score: 71, benchmark: 69 },
              { name: 'Recognition', score: 76, benchmark: 71 },
              { name: 'Benefits', score: 81, benchmark: 74 }
            ].map(dim => (
              <div key={dim.name} className="dimension-row">
                <span className="dim-name">{dim.name}</span>
                <div className="dim-bar-container">
                  <div 
                    className="dim-bar"
                    style={{ width: `${dim.score}%` }}
                  />
                  <div 
                    className="dim-benchmark"
                    style={{ left: `${dim.benchmark}%` }}
                  />
                </div>
                <div className="dim-scores">
                  <span className="dim-score">{dim.score}</span>
                  <span className={`dim-diff ${dim.score >= dim.benchmark ? 'positive' : 'negative'}`}>
                    {dim.score >= dim.benchmark ? '+' : ''}{dim.score - dim.benchmark}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-bar" />
              <span>Score</span>
            </div>
            <div className="legend-item">
              <span className="legend-line" />
              <span>Industry Benchmark</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><Building2 size={18} /> By Department</h3>
          </div>
          <div className="dept-engagement">
            {departmentData
              .map(dept => ({
                ...dept,
                engagement: 65 + Math.floor(Math.random() * 25)
              }))
              .sort((a, b) => b.engagement - a.engagement)
              .map(dept => (
                <div key={dept.name} className="dept-eng-item">
                  <span className="dept-dot" style={{ backgroundColor: dept.color }} />
                  <span className="dept-name">{dept.name}</span>
                  <div className="eng-mini-bar">
                    <div 
                      className="eng-fill"
                      style={{ 
                        width: `${dept.engagement}%`,
                        backgroundColor: dept.color
                      }}
                    />
                  </div>
                  <span className="eng-score">{dept.engagement}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3><ThumbsUp size={18} /> eNPS Score</h3>
          </div>
          <div className="enps-display">
            <div className="enps-score">
              <span className="enps-value">+42</span>
              <span className="enps-label">Employee Net Promoter Score</span>
            </div>
            <div className="enps-breakdown">
              <div className="enps-segment promoters">
                <span className="segment-percent">58%</span>
                <span className="segment-label">Promoters</span>
              </div>
              <div className="enps-segment passives">
                <span className="segment-percent">26%</span>
                <span className="segment-label">Passives</span>
              </div>
              <div className="enps-segment detractors">
                <span className="segment-percent">16%</span>
                <span className="segment-label">Detractors</span>
              </div>
            </div>
            <div className="enps-scale">
              <div className="scale-bar">
                <div className="scale-fill" style={{ width: '71%' }} />
              </div>
              <div className="scale-labels">
                <span>-100</span>
                <span>0</span>
                <span>+100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'headcount': return renderHeadcount();
      case 'turnover': return renderTurnover();
      case 'diversity': return renderDiversity();
      case 'compensation': return renderCompensation();
      case 'engagement': return renderEngagement();
      default: return renderOverview();
    }
  };

  return (
    <div className="analytics-page">
      <div className="analytics__header">
        <div className="analytics__title-section">
          <div className="analytics__icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1>Workforce Analytics</h1>
            <p>Comprehensive insights into your workforce metrics and trends</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={16} />
            Export Report
          </button>
          <button className="btn-outline">
            <Settings size={16} />
            Configure
          </button>
          <button className="btn-primary">
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="analytics__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Layers size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'headcount' ? 'active' : ''}`}
          onClick={() => setActiveTab('headcount')}
        >
          <Users size={16} />
          Headcount
        </button>
        <button 
          className={`tab-btn ${activeTab === 'turnover' ? 'active' : ''}`}
          onClick={() => setActiveTab('turnover')}
        >
          <UserMinus size={16} />
          Turnover
        </button>
        <button 
          className={`tab-btn ${activeTab === 'diversity' ? 'active' : ''}`}
          onClick={() => setActiveTab('diversity')}
        >
          <Globe size={16} />
          Diversity
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compensation' ? 'active' : ''}`}
          onClick={() => setActiveTab('compensation')}
        >
          <DollarSign size={16} />
          Compensation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          <Heart size={16} />
          Engagement
        </button>
      </div>

      <div className="analytics__content">
        {renderContent()}
      </div>
    </div>
  );
}
