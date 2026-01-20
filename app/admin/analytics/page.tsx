'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Globe,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  MousePointer,
  Eye,
  ShoppingCart,
  Target,
  Percent
} from 'lucide-react';
import './analytics.css';

interface AnalyticsMetric {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface TimeSeriesData {
  date: string;
  users: number;
  revenue: number;
  actions: number;
  sessions: number;
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgDuration: string;
  bounceRate: number;
}

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropOff: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
  conversion: number;
}

interface DeviceBreakdown {
  device: string;
  sessions: number;
  percentage: number;
}

const MOCK_METRICS: AnalyticsMetric[] = [
  { label: 'Total Users', value: '156,847', change: 12.4, changeLabel: 'vs last month', icon: <Users size={22} />, color: 'primary' },
  { label: 'Monthly Revenue', value: '$456,890', change: 18.7, changeLabel: 'vs last month', icon: <DollarSign size={22} />, color: 'success' },
  { label: 'Active Sessions', value: '42,356', change: 8.2, changeLabel: 'vs last week', icon: <Activity size={22} />, color: 'info' },
  { label: 'Actions Executed', value: '12.4M', change: 24.5, changeLabel: 'vs last month', icon: <Zap size={22} />, color: 'warning' },
  { label: 'Conversion Rate', value: '4.82%', change: 0.8, changeLabel: 'vs last month', icon: <Target size={22} />, color: 'purple' },
  { label: 'Avg Session Duration', value: '24m 35s', change: 5.3, changeLabel: 'vs last month', icon: <Clock size={22} />, color: 'cyan' }
];

const MOCK_TIMESERIES: TimeSeriesData[] = [
  { date: '2025-01-01', users: 145230, revenue: 412500, actions: 11200000, sessions: 38400 },
  { date: '2025-01-02', users: 146890, revenue: 418900, actions: 11450000, sessions: 39100 },
  { date: '2025-01-03', users: 148450, revenue: 425600, actions: 11680000, sessions: 39800 },
  { date: '2025-01-04', users: 149200, revenue: 428900, actions: 11750000, sessions: 40200 },
  { date: '2025-01-05', users: 151340, revenue: 435400, actions: 11980000, sessions: 41000 },
  { date: '2025-01-06', users: 153890, revenue: 445600, actions: 12150000, sessions: 41800 },
  { date: '2025-01-07', users: 155420, revenue: 452300, actions: 12320000, sessions: 42100 },
  { date: '2025-01-08', users: 156847, revenue: 456890, actions: 12400000, sessions: 42356 }
];

const MOCK_TOP_PAGES: TopPage[] = [
  { path: '/dashboard', views: 245680, uniqueVisitors: 89450, avgDuration: '8m 45s', bounceRate: 12.3 },
  { path: '/automation', views: 189340, uniqueVisitors: 67230, avgDuration: '15m 20s', bounceRate: 8.5 },
  { path: '/browser', views: 156780, uniqueVisitors: 54320, avgDuration: '12m 10s', bounceRate: 15.2 },
  { path: '/pricing', views: 134560, uniqueVisitors: 98760, avgDuration: '3m 45s', bounceRate: 45.6 },
  { path: '/templates', views: 98450, uniqueVisitors: 45670, avgDuration: '6m 30s', bounceRate: 22.1 }
];

const MOCK_FUNNEL: ConversionFunnel[] = [
  { stage: 'Landing Page', count: 250000, percentage: 100, dropOff: 0 },
  { stage: 'Sign Up Started', count: 87500, percentage: 35, dropOff: 65 },
  { stage: 'Email Verified', count: 61250, percentage: 24.5, dropOff: 30 },
  { stage: 'Onboarding Complete', count: 45940, percentage: 18.4, dropOff: 25 },
  { stage: 'First Action', count: 36750, percentage: 14.7, dropOff: 20 },
  { stage: 'Paid Subscription', count: 12050, percentage: 4.82, dropOff: 67.2 }
];

const MOCK_TRAFFIC: TrafficSource[] = [
  { source: 'Organic Search', sessions: 145600, percentage: 38.5, conversion: 5.2 },
  { source: 'Direct', sessions: 98400, percentage: 26.0, conversion: 6.8 },
  { source: 'Referral', sessions: 67800, percentage: 17.9, conversion: 4.5 },
  { source: 'Social Media', sessions: 45200, percentage: 12.0, conversion: 3.2 },
  { source: 'Paid Ads', sessions: 21000, percentage: 5.6, conversion: 8.9 }
];

const MOCK_DEVICES: DeviceBreakdown[] = [
  { device: 'Desktop', sessions: 245600, percentage: 65 },
  { device: 'Mobile', sessions: 98240, percentage: 26 },
  { device: 'Tablet', sessions: 34160, percentage: 9 }
];

export default function AdminAnalyticsPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [metrics] = useState<AnalyticsMetric[]>(MOCK_METRICS);
  const [timeSeries] = useState<TimeSeriesData[]>(MOCK_TIMESERIES);
  const [topPages] = useState<TopPage[]>(MOCK_TOP_PAGES);
  const [funnel] = useState<ConversionFunnel[]>(MOCK_FUNNEL);
  const [traffic] = useState<TrafficSource[]>(MOCK_TRAFFIC);
  const [devices] = useState<DeviceBreakdown[]>(MOCK_DEVICES);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 700));
      setLoading(false);
    };
    loadData();
  }, [timeRange]);

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div className="header-left">
          <div className="header-title">
            <BarChart3 size={28} />
            <div>
              <h1>Analytics</h1>
              <p>Platform performance and user insights</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <div className="date-range-picker">
            <Calendar size={18} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="12m">Last 12 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <button className="btn-secondary">
            <Filter size={18} />
            Filters
          </button>
          <button className="btn-secondary">
            <Download size={18} />
            Export
          </button>
          <button className="btn-icon">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className={`metric-card ${metric.color}`}>
            <div className="metric-icon">
              {metric.icon}
            </div>
            <div className="metric-content">
              <span className="metric-value">{metric.value}</span>
              <span className="metric-label">{metric.label}</span>
              <div className={`metric-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                {metric.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{Math.abs(metric.change)}% {metric.changeLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Main Charts Grid */}
      <div className="analytics-grid">
        {/* Growth Chart */}
        <section className="chart-card growth-chart">
          <div className="card-header">
            <h3><TrendingUp size={20} /> Growth Trends</h3>
            <div className="chart-legend">
              <span className="legend-item users"><span className="dot"></span> Users</span>
              <span className="legend-item revenue"><span className="dot"></span> Revenue</span>
              <span className="legend-item actions"><span className="dot"></span> Actions</span>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder">
              <div className="chart-bars">
                {timeSeries.map((data, i) => (
                  <div key={i} className="chart-bar-group">
                    <div 
                      className="chart-bar users" 
                      style={{ height: `${(data.users / 160000) * 100}%` }}
                      title={`Users: ${formatNumber(data.users)}`}
                    />
                    <div 
                      className="chart-bar revenue" 
                      style={{ height: `${(data.revenue / 500000) * 100}%` }}
                      title={`Revenue: ${formatCurrency(data.revenue)}`}
                    />
                    <div 
                      className="chart-bar actions" 
                      style={{ height: `${(data.actions / 15000000) * 100}%` }}
                      title={`Actions: ${formatNumber(data.actions)}`}
                    />
                    <span className="chart-label">{data.date.split('-')[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Conversion Funnel */}
        <section className="chart-card funnel-chart">
          <div className="card-header">
            <h3><Target size={20} /> Conversion Funnel</h3>
            <a href="/admin/analytics/funnel" className="view-more">Details <ChevronRight size={16} /></a>
          </div>
          <div className="funnel-container">
            {funnel.map((stage, i) => (
              <div key={i} className="funnel-stage">
                <div className="funnel-bar-wrapper">
                  <div 
                    className="funnel-bar" 
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
                <div className="funnel-info">
                  <span className="funnel-name">{stage.stage}</span>
                  <div className="funnel-metrics">
                    <span className="funnel-count">{formatNumber(stage.count)}</span>
                    <span className="funnel-percentage">{stage.percentage}%</span>
                    {stage.dropOff > 0 && (
                      <span className="funnel-dropoff">-{stage.dropOff}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Pages */}
        <section className="chart-card top-pages">
          <div className="card-header">
            <h3><Eye size={20} /> Top Pages</h3>
            <a href="/admin/analytics/pages" className="view-more">View All <ChevronRight size={16} /></a>
          </div>
          <div className="pages-table">
            <div className="table-header">
              <span>Page</span>
              <span>Views</span>
              <span>Duration</span>
              <span>Bounce</span>
            </div>
            {topPages.map((page, i) => (
              <div key={i} className="table-row">
                <span className="page-path">{page.path}</span>
                <span className="page-views">{formatNumber(page.views)}</span>
                <span className="page-duration">{page.avgDuration}</span>
                <span className={`page-bounce ${page.bounceRate > 30 ? 'high' : 'low'}`}>
                  {page.bounceRate}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Traffic Sources */}
        <section className="chart-card traffic-sources">
          <div className="card-header">
            <h3><Globe size={20} /> Traffic Sources</h3>
          </div>
          <div className="traffic-list">
            {traffic.map((source, i) => (
              <div key={i} className="traffic-item">
                <div className="traffic-bar-container">
                  <div 
                    className="traffic-bar" 
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
                <div className="traffic-info">
                  <span className="traffic-name">{source.source}</span>
                  <div className="traffic-metrics">
                    <span className="traffic-sessions">{formatNumber(source.sessions)} sessions</span>
                    <span className="traffic-percentage">{source.percentage}%</span>
                    <span className="traffic-conversion">{source.conversion}% conv</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Device Breakdown */}
        <section className="chart-card device-breakdown">
          <div className="card-header">
            <h3><MousePointer size={20} /> Device Breakdown</h3>
          </div>
          <div className="devices-list">
            {devices.map((device, i) => (
              <div key={i} className="device-item">
                <div className="device-info">
                  <span className="device-name">{device.device}</span>
                  <span className="device-percentage">{device.percentage}%</span>
                </div>
                <div className="device-bar-container">
                  <div 
                    className={`device-bar ${device.device.toLowerCase()}`} 
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
                <span className="device-sessions">{formatNumber(device.sessions)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Real-time Stats */}
        <section className="chart-card realtime-stats">
          <div className="card-header">
            <h3><Activity size={20} /> Real-time Activity</h3>
            <span className="live-indicator">
              <span className="pulse"></span> Live
            </span>
          </div>
          <div className="realtime-content">
            <div className="realtime-metric">
              <span className="realtime-value">42,356</span>
              <span className="realtime-label">Active Users</span>
            </div>
            <div className="realtime-grid">
              <div className="realtime-stat">
                <span className="stat-value">1,847</span>
                <span className="stat-label">Actions/min</span>
              </div>
              <div className="realtime-stat">
                <span className="stat-value">$24.5K</span>
                <span className="stat-label">Revenue Today</span>
              </div>
              <div className="realtime-stat">
                <span className="stat-value">847</span>
                <span className="stat-label">New Users</span>
              </div>
              <div className="realtime-stat">
                <span className="stat-value">23</span>
                <span className="stat-label">Support Tickets</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
