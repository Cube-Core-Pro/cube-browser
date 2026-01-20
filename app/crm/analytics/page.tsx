'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  PieChart,
  LineChart,
  Zap,
  Award,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MousePointer,
  ShoppingCart,
  Percent,
  Building2,
  UserPlus,
  Repeat,
  Timer
} from 'lucide-react';
import './analytics.css';

interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: string;
  description: string;
  previousValue: string;
}

interface SalesData {
  period: string;
  revenue: number;
  target: number;
  deals: number;
}

interface LeadSource {
  source: string;
  leads: number;
  converted: number;
  conversionRate: number;
  revenue: number;
  color: string;
}

interface TeamPerformance {
  name: string;
  avatar: string;
  deals: number;
  revenue: number;
  target: number;
  conversionRate: number;
  activities: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  avgDays: number;
  conversionRate: number;
}

interface ActivityMetric {
  type: string;
  icon: string;
  count: number;
  change: number;
  avgPerDay: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  avgDealSize: number;
  retention: number;
}

export default function CRMAnalyticsPage(): React.JSX.Element {
  const [dateRange, setDateRange] = useState<string>('30d');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [loading, setLoading] = useState<boolean>(false);

  const metrics: MetricCard[] = [
    {
      id: '1',
      title: 'Total Revenue',
      value: '$2,847,395',
      change: 23.5,
      trend: 'up',
      icon: 'dollar',
      description: 'Total closed won revenue',
      previousValue: '$2,305,620'
    },
    {
      id: '2',
      title: 'New Deals',
      value: '342',
      change: 18.2,
      trend: 'up',
      icon: 'target',
      description: 'Deals created this period',
      previousValue: '289'
    },
    {
      id: '3',
      title: 'Conversion Rate',
      value: '32.4%',
      change: 5.8,
      trend: 'up',
      icon: 'percent',
      description: 'Lead to deal conversion',
      previousValue: '30.6%'
    },
    {
      id: '4',
      title: 'Avg Deal Size',
      value: '$48,520',
      change: -2.3,
      trend: 'down',
      icon: 'chart',
      description: 'Average closed deal value',
      previousValue: '$49,664'
    },
    {
      id: '5',
      title: 'Sales Cycle',
      value: '28 days',
      change: -12.5,
      trend: 'up',
      icon: 'clock',
      description: 'Average time to close',
      previousValue: '32 days'
    },
    {
      id: '6',
      title: 'Active Leads',
      value: '1,247',
      change: 34.2,
      trend: 'up',
      icon: 'users',
      description: 'Leads in pipeline',
      previousValue: '929'
    }
  ];

  const salesData: SalesData[] = [
    { period: 'Jan', revenue: 285000, target: 300000, deals: 28 },
    { period: 'Feb', revenue: 312000, target: 300000, deals: 31 },
    { period: 'Mar', revenue: 298000, target: 320000, deals: 29 },
    { period: 'Apr', revenue: 345000, target: 320000, deals: 35 },
    { period: 'May', revenue: 378000, target: 350000, deals: 38 },
    { period: 'Jun', revenue: 356000, target: 350000, deals: 36 },
    { period: 'Jul', revenue: 412000, target: 380000, deals: 42 },
    { period: 'Aug', revenue: 389000, target: 380000, deals: 39 },
    { period: 'Sep', revenue: 445000, target: 400000, deals: 45 },
    { period: 'Oct', revenue: 478000, target: 420000, deals: 48 },
    { period: 'Nov', revenue: 512000, target: 450000, deals: 52 },
    { period: 'Dec', revenue: 537000, target: 480000, deals: 54 }
  ];

  const leadSources: LeadSource[] = [
    { source: 'Organic Search', leads: 485, converted: 162, conversionRate: 33.4, revenue: 892450, color: '#10b981' },
    { source: 'Paid Ads', leads: 356, converted: 98, conversionRate: 27.5, revenue: 654320, color: '#3b82f6' },
    { source: 'Social Media', leads: 298, converted: 89, conversionRate: 29.9, revenue: 445680, color: '#8b5cf6' },
    { source: 'Email Campaign', leads: 267, converted: 94, conversionRate: 35.2, revenue: 523450, color: '#f59e0b' },
    { source: 'Referral', leads: 189, converted: 78, conversionRate: 41.3, revenue: 489230, color: '#ef4444' },
    { source: 'Direct', leads: 145, converted: 52, conversionRate: 35.9, revenue: 298400, color: '#06b6d4' },
    { source: 'Events', leads: 98, converted: 45, conversionRate: 45.9, revenue: 378950, color: '#ec4899' }
  ];

  const teamPerformance: TeamPerformance[] = [
    { name: 'Sarah Mitchell', avatar: 'SM', deals: 54, revenue: 687500, target: 600000, conversionRate: 38.2, activities: 234 },
    { name: 'James Wilson', avatar: 'JW', deals: 48, revenue: 592000, target: 550000, conversionRate: 35.8, activities: 198 },
    { name: 'Emily Chen', avatar: 'EC', deals: 45, revenue: 534200, target: 500000, conversionRate: 34.1, activities: 212 },
    { name: 'Michael Brown', avatar: 'MB', deals: 42, revenue: 498700, target: 500000, conversionRate: 31.5, activities: 187 },
    { name: 'Lisa Anderson', avatar: 'LA', deals: 39, revenue: 456800, target: 450000, conversionRate: 33.2, activities: 176 },
    { name: 'David Kim', avatar: 'DK', deals: 36, revenue: 412300, target: 400000, conversionRate: 29.8, activities: 154 }
  ];

  const pipelineStages: PipelineStage[] = [
    { stage: 'Prospecting', count: 486, value: 4860000, avgDays: 7, conversionRate: 68 },
    { stage: 'Qualification', count: 330, value: 3960000, avgDays: 5, conversionRate: 72 },
    { stage: 'Proposal', count: 238, value: 3332000, avgDays: 8, conversionRate: 65 },
    { stage: 'Negotiation', count: 155, value: 2635000, avgDays: 6, conversionRate: 78 },
    { stage: 'Closed Won', count: 121, value: 2420000, avgDays: 2, conversionRate: 100 }
  ];

  const activityMetrics: ActivityMetric[] = [
    { type: 'Calls Made', icon: 'phone', count: 1247, change: 12.3, avgPerDay: 41.6 },
    { type: 'Emails Sent', icon: 'mail', count: 3842, change: 8.7, avgPerDay: 128.1 },
    { type: 'Meetings Held', icon: 'calendar', count: 234, change: 15.2, avgPerDay: 7.8 },
    { type: 'Tasks Completed', icon: 'check', count: 892, change: -3.4, avgPerDay: 29.7 },
    { type: 'Notes Added', icon: 'message', count: 1456, change: 22.1, avgPerDay: 48.5 },
    { type: 'Proposals Sent', icon: 'file', count: 178, change: 28.4, avgPerDay: 5.9 }
  ];

  const funnelStages: FunnelStage[] = [
    { stage: 'Website Visitors', count: 45820, percentage: 100, dropoff: 0 },
    { stage: 'Landing Page Views', count: 12450, percentage: 27.2, dropoff: 72.8 },
    { stage: 'Form Submissions', count: 3245, percentage: 7.1, dropoff: 73.9 },
    { stage: 'Qualified Leads', count: 1837, percentage: 4.0, dropoff: 43.4 },
    { stage: 'Opportunities', count: 486, percentage: 1.1, dropoff: 73.5 },
    { stage: 'Customers', count: 121, percentage: 0.26, dropoff: 75.1 }
  ];

  const customerSegments: CustomerSegment[] = [
    { segment: 'Enterprise', count: 45, revenue: 1245000, avgDealSize: 27667, retention: 94 },
    { segment: 'Mid-Market', count: 128, revenue: 892000, avgDealSize: 6969, retention: 87 },
    { segment: 'SMB', count: 456, revenue: 548000, avgDealSize: 1202, retention: 78 },
    { segment: 'Startup', count: 234, revenue: 162395, avgDealSize: 694, retention: 65 }
  ];

  const handleRefresh = (): void => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getIconComponent = (iconName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      dollar: <DollarSign size={20} />,
      target: <Target size={20} />,
      percent: <Percent size={20} />,
      chart: <BarChart3 size={20} />,
      clock: <Clock size={20} />,
      users: <Users size={20} />,
      phone: <Phone size={16} />,
      mail: <Mail size={16} />,
      calendar: <Calendar size={16} />,
      check: <CheckCircle size={16} />,
      message: <MessageSquare size={16} />,
      file: <Activity size={16} />
    };
    return iconMap[iconName] || <Activity size={20} />;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const maxRevenue = Math.max(...salesData.map(d => Math.max(d.revenue, d.target)));
  const totalLeads = leadSources.reduce((sum, s) => sum + s.leads, 0);

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1>CRM Analytics</h1>
              <p>Sales performance, pipeline insights and team metrics</p>
            </div>
          </div>
          
          <div className="header-actions">
            <div className="date-selector">
              <Calendar size={18} />
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
                <option value="custom">Custom Range</option>
              </select>
              <ChevronDown size={16} />
            </div>
            
            <button 
              className={`compare-btn ${compareMode ? 'active' : ''}`}
              onClick={() => setCompareMode(!compareMode)}
            >
              <Repeat size={18} />
              Compare
            </button>
            
            <button className="btn-secondary" onClick={handleRefresh}>
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            
            <button className="btn-primary">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <div 
              key={metric.id} 
              className={`metric-card ${selectedMetric === metric.id ? 'selected' : ''}`}
              onClick={() => setSelectedMetric(metric.id)}
            >
              <div className="metric-icon">
                {getIconComponent(metric.icon)}
              </div>
              <div className="metric-content">
                <span className="metric-label">{metric.title}</span>
                <div className="metric-row">
                  <span className="metric-value">{metric.value}</span>
                  <span className={`metric-change ${metric.trend}`}>
                    {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(metric.change)}%
                  </span>
                </div>
                {compareMode && (
                  <span className="previous-value">vs {metric.previousValue}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Chart & Pipeline */}
      <div className="charts-row">
        <section className="chart-card revenue-chart">
          <div className="chart-header">
            <div>
              <h2>Revenue Performance</h2>
              <p>Monthly revenue vs targets</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot revenue"></span>
                Revenue
              </span>
              <span className="legend-item">
                <span className="legend-dot target"></span>
                Target
              </span>
            </div>
          </div>
          <div className="chart-body">
            <div className="bar-chart">
              {salesData.map((item, index) => (
                <div key={index} className="bar-group">
                  <div className="bars">
                    <div 
                      className="bar revenue"
                      style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                      title={`Revenue: ${formatCurrency(item.revenue)}`}
                    >
                      <span className="bar-tooltip">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div 
                      className="bar target"
                      style={{ height: `${(item.target / maxRevenue) * 100}%` }}
                      title={`Target: ${formatCurrency(item.target)}`}
                    />
                  </div>
                  <span className="bar-label">{item.period}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="chart-card pipeline-chart">
          <div className="chart-header">
            <div>
              <h2>Pipeline Stages</h2>
              <p>Deals by stage with conversion rates</p>
            </div>
          </div>
          <div className="chart-body">
            <div className="pipeline-stages">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="pipeline-stage">
                  <div className="stage-info">
                    <span className="stage-name">{stage.stage}</span>
                    <span className="stage-value">{formatCurrency(stage.value)}</span>
                  </div>
                  <div className="stage-bar-container">
                    <div 
                      className="stage-bar"
                      style={{ width: `${(stage.count / pipelineStages[0].count) * 100}%` }}
                    >
                      <span className="stage-count">{stage.count} deals</span>
                    </div>
                  </div>
                  <div className="stage-metrics">
                    <span className="avg-days">
                      <Timer size={12} />
                      {stage.avgDays}d avg
                    </span>
                    <span className="conversion">
                      {stage.conversionRate}% conv
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Lead Sources & Funnel */}
      <div className="charts-row">
        <section className="chart-card sources-chart">
          <div className="chart-header">
            <div>
              <h2>Lead Sources</h2>
              <p>Performance by acquisition channel</p>
            </div>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="chart-body">
            <div className="sources-distribution">
              <div className="donut-chart">
                <svg viewBox="0 0 100 100">
                  {leadSources.reduce((acc: React.ReactNode[], source, index) => {
                    const percentage = (source.leads / totalLeads) * 100;
                    const prevPercentages = leadSources
                      .slice(0, index)
                      .reduce((sum, s) => sum + (s.leads / totalLeads) * 100, 0);
                    const strokeDasharray = `${percentage * 2.51} ${251.2 - percentage * 2.51}`;
                    const strokeDashoffset = -prevPercentages * 2.51;
                    
                    acc.push(
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={source.color}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 50 50)"
                      />
                    );
                    return acc;
                  }, [])}
                </svg>
                <div className="donut-center">
                  <span className="total-leads">{formatNumber(totalLeads)}</span>
                  <span className="total-label">Total Leads</span>
                </div>
              </div>
            </div>
            <div className="sources-list">
              {leadSources.map((source, index) => (
                <div key={index} className="source-item">
                  <div className="source-indicator" style={{ background: source.color }}></div>
                  <div className="source-info">
                    <span className="source-name">{source.source}</span>
                    <div className="source-stats">
                      <span>{source.leads} leads</span>
                      <span>{source.conversionRate}% conv</span>
                    </div>
                  </div>
                  <span className="source-revenue">{formatCurrency(source.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="chart-card funnel-chart">
          <div className="chart-header">
            <div>
              <h2>Conversion Funnel</h2>
              <p>Customer journey analysis</p>
            </div>
          </div>
          <div className="chart-body">
            <div className="funnel-stages">
              {funnelStages.map((stage, index) => (
                <div key={index} className="funnel-stage">
                  <div 
                    className="funnel-bar"
                    style={{ width: `${Math.max(stage.percentage, 5) + 40}%` }}
                  >
                    <span className="funnel-label">{stage.stage}</span>
                    <span className="funnel-count">{formatNumber(stage.count)}</span>
                  </div>
                  {index < funnelStages.length - 1 && (
                    <div className="dropoff-indicator">
                      <ArrowDownRight size={14} />
                      <span>-{stage.dropoff}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="funnel-summary">
              <div className="summary-item">
                <span className="summary-label">Overall Conversion</span>
                <span className="summary-value">0.26%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Biggest Drop</span>
                <span className="summary-value">Visitors → Landing (72.8%)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Team Performance */}
      <section className="team-section">
        <div className="section-header">
          <div>
            <h2>Team Performance</h2>
            <p>Sales rep metrics and rankings</p>
          </div>
          <div className="section-actions">
            <select className="sort-select">
              <option value="revenue">Sort by Revenue</option>
              <option value="deals">Sort by Deals</option>
              <option value="conversion">Sort by Conversion</option>
              <option value="activities">Sort by Activities</option>
            </select>
          </div>
        </div>
        <div className="team-grid">
          {teamPerformance.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-rank">{index + 1}</div>
              <div className="team-header">
                <div className="member-avatar">{member.avatar}</div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <span className="member-role">Sales Representative</span>
                </div>
                {index === 0 && (
                  <div className="top-badge">
                    <Award size={16} />
                    Top Performer
                  </div>
                )}
              </div>
              <div className="team-metrics">
                <div className="team-metric">
                  <span className="tm-label">Revenue</span>
                  <span className="tm-value">{formatCurrency(member.revenue)}</span>
                  <div className="tm-progress">
                    <div 
                      className="tm-bar"
                      style={{ width: `${(member.revenue / member.target) * 100}%` }}
                    />
                  </div>
                  <span className="tm-target">{Math.round((member.revenue / member.target) * 100)}% of {formatCurrency(member.target)}</span>
                </div>
                <div className="team-stats-row">
                  <div className="team-stat">
                    <Target size={14} />
                    <span>{member.deals} Deals</span>
                  </div>
                  <div className="team-stat">
                    <Percent size={14} />
                    <span>{member.conversionRate}% Conv</span>
                  </div>
                  <div className="team-stat">
                    <Activity size={14} />
                    <span>{member.activities} Acts</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity Metrics */}
      <section className="activities-section">
        <div className="section-header">
          <div>
            <h2>Activity Metrics</h2>
            <p>Team engagement and productivity</p>
          </div>
        </div>
        <div className="activities-grid">
          {activityMetrics.map((activity, index) => (
            <div key={index} className="activity-card">
              <div className="activity-icon">
                {getIconComponent(activity.icon)}
              </div>
              <div className="activity-info">
                <span className="activity-type">{activity.type}</span>
                <div className="activity-row">
                  <span className="activity-count">{formatNumber(activity.count)}</span>
                  <span className={`activity-change ${activity.change >= 0 ? 'up' : 'down'}`}>
                    {activity.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(activity.change)}%
                  </span>
                </div>
                <span className="activity-avg">{activity.avgPerDay}/day avg</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Segments */}
      <section className="segments-section">
        <div className="section-header">
          <div>
            <h2>Customer Segments</h2>
            <p>Revenue breakdown by customer type</p>
          </div>
        </div>
        <div className="segments-table">
          <div className="table-header">
            <span>Segment</span>
            <span>Customers</span>
            <span>Revenue</span>
            <span>Avg Deal Size</span>
            <span>Retention</span>
          </div>
          {customerSegments.map((segment, index) => (
            <div key={index} className="table-row">
              <div className="segment-info">
                <Building2 size={16} />
                <span>{segment.segment}</span>
              </div>
              <span className="segment-count">{segment.count}</span>
              <span className="segment-revenue">{formatCurrency(segment.revenue)}</span>
              <span className="segment-deal">{formatCurrency(segment.avgDealSize)}</span>
              <div className="retention-cell">
                <div className="retention-bar">
                  <div 
                    className="retention-fill"
                    style={{ 
                      width: `${segment.retention}%`,
                      background: segment.retention >= 90 ? '#10b981' : 
                                 segment.retention >= 80 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
                <span>{segment.retention}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insights & Recommendations */}
      <section className="insights-section">
        <div className="section-header">
          <div>
            <h2>AI Insights & Recommendations</h2>
            <p>Data-driven suggestions to improve performance</p>
          </div>
        </div>
        <div className="insights-grid">
          <div className="insight-card positive">
            <div className="insight-icon">
              <TrendingUp size={20} />
            </div>
            <div className="insight-content">
              <h4>Strong Referral Performance</h4>
              <p>Referral leads have a 41.3% conversion rate - highest among all sources. Consider expanding your referral program with additional incentives.</p>
              <button className="insight-action">View Referral Program</button>
            </div>
          </div>
          
          <div className="insight-card warning">
            <div className="insight-icon">
              <AlertCircle size={20} />
            </div>
            <div className="insight-content">
              <h4>High Landing Page Dropoff</h4>
              <p>72.8% of website visitors leave without viewing landing pages. A/B testing different CTAs and page layouts could improve engagement.</p>
              <button className="insight-action">Optimize Landing Pages</button>
            </div>
          </div>
          
          <div className="insight-card info">
            <div className="insight-icon">
              <Zap size={20} />
            </div>
            <div className="insight-content">
              <h4>Enterprise Segment Opportunity</h4>
              <p>Enterprise customers have 94% retention and $27,667 avg deal size. Shifting more sales focus to enterprise could increase revenue by 35%.</p>
              <button className="insight-action">View Enterprise Strategy</button>
            </div>
          </div>
          
          <div className="insight-card positive">
            <div className="insight-icon">
              <CheckCircle size={20} />
            </div>
            <div className="insight-content">
              <h4>Sales Cycle Improvement</h4>
              <p>Average sales cycle decreased from 32 to 28 days (12.5% improvement). Current proposal templates and negotiation strategies are working well.</p>
              <button className="insight-action">View Best Practices</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
