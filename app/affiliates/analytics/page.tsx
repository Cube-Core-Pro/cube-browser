'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Link2,
  MousePointerClick,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Eye,
  ShoppingCart,
  Percent,
  Award,
  Share2,
  ExternalLink,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import './analytics.css';

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface DailyStats {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface LinkPerformance {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface TrafficSource {
  source: string;
  clicks: number;
  conversions: number;
  percentage: number;
  color: string;
}

interface DeviceStats {
  device: string;
  clicks: number;
  percentage: number;
  icon: React.ReactNode;
}

const MOCK_METRICS: PerformanceMetric[] = [
  { label: 'Total Earnings', value: '$12,847.50', change: 18.5, trend: 'up', icon: <DollarSign size={20} /> },
  { label: 'Total Clicks', value: '45,892', change: 12.3, trend: 'up', icon: <MousePointerClick size={20} /> },
  { label: 'Conversions', value: '1,247', change: 8.7, trend: 'up', icon: <ShoppingCart size={20} /> },
  { label: 'Conversion Rate', value: '2.72%', change: -0.3, trend: 'down', icon: <Percent size={20} /> },
  { label: 'Avg. Commission', value: '$10.30', change: 5.2, trend: 'up', icon: <Award size={20} /> },
  { label: 'Active Links', value: '24', change: 4, trend: 'up', icon: <Link2 size={20} /> }
];

const MOCK_DAILY_STATS: DailyStats[] = [
  { date: 'Jan 20', clicks: 1520, conversions: 42, revenue: 420.50 },
  { date: 'Jan 21', clicks: 1780, conversions: 51, revenue: 510.00 },
  { date: 'Jan 22', clicks: 1950, conversions: 48, revenue: 480.00 },
  { date: 'Jan 23', clicks: 2100, conversions: 62, revenue: 620.00 },
  { date: 'Jan 24', clicks: 2350, conversions: 71, revenue: 710.00 },
  { date: 'Jan 25', clicks: 1890, conversions: 55, revenue: 550.00 },
  { date: 'Jan 26', clicks: 2200, conversions: 68, revenue: 680.00 }
];

const MOCK_LINKS: LinkPerformance[] = [
  { id: 'lnk_1', name: 'Homepage Banner', url: 'cube.io/ref/abc123', clicks: 12450, conversions: 387, revenue: 3870.00, conversionRate: 3.11 },
  { id: 'lnk_2', name: 'Blog Review', url: 'cube.io/ref/blog456', clicks: 8920, conversions: 245, revenue: 2450.00, conversionRate: 2.75 },
  { id: 'lnk_3', name: 'YouTube Tutorial', url: 'cube.io/ref/yt789', clicks: 15780, conversions: 412, revenue: 4120.00, conversionRate: 2.61 },
  { id: 'lnk_4', name: 'Twitter Campaign', url: 'cube.io/ref/tw012', clicks: 5430, conversions: 128, revenue: 1280.00, conversionRate: 2.36 },
  { id: 'lnk_5', name: 'Newsletter', url: 'cube.io/ref/nl345', clicks: 3312, conversions: 75, revenue: 750.00, conversionRate: 2.26 }
];

const MOCK_TRAFFIC: TrafficSource[] = [
  { source: 'Direct', clicks: 15420, conversions: 425, percentage: 33.6, color: '#6366f1' },
  { source: 'Social Media', clicks: 12350, conversions: 312, percentage: 26.9, color: '#ec4899' },
  { source: 'Email', clicks: 8920, conversions: 289, percentage: 19.4, color: '#f59e0b' },
  { source: 'Organic Search', clicks: 6120, conversions: 145, percentage: 13.3, color: '#22c55e' },
  { source: 'Referral', clicks: 3082, conversions: 76, percentage: 6.7, color: '#06b6d4' }
];

const MOCK_DEVICES: DeviceStats[] = [
  { device: 'Desktop', clicks: 23450, percentage: 51.1, icon: <Monitor size={18} /> },
  { device: 'Mobile', clicks: 18920, percentage: 41.2, icon: <Smartphone size={18} /> },
  { device: 'Tablet', clicks: 3522, percentage: 7.7, icon: <Globe size={18} /> }
];

export default function AffiliateAnalyticsPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>(MOCK_METRICS);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>(MOCK_DAILY_STATS);
  const [links, setLinks] = useState<LinkPerformance[]>(MOCK_LINKS);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>(MOCK_TRAFFIC);
  const [devices, setDevices] = useState<DeviceStats[]>(MOCK_DEVICES);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    loadData();
  }, [timeRange]);

  const maxClicks = Math.max(...dailyStats.map(d => d.clicks));
  const maxConversions = Math.max(...dailyStats.map(d => d.conversions));

  if (loading) {
    return (
      <div className="affiliate-analytics-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="affiliate-analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div className="header-title">
          <BarChart3 size={28} />
          <div>
            <h1>Affiliate Analytics</h1>
            <p>Track your performance and optimize campaigns</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="time-filter">
            <Calendar size={18} />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <ChevronDown size={16} />
          </div>
          <button className="btn-secondary">
            <Filter size={18} />
            Filters
          </button>
          <button className="btn-primary">
            <Download size={18} />
            Export
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-icon" data-trend={metric.trend}>
                {metric.icon}
              </div>
              <div className="metric-content">
                <span className="metric-label">{metric.label}</span>
                <span className="metric-value">{metric.value}</span>
              </div>
              <div className={`metric-change ${metric.trend}`}>
                {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(metric.change)}%
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Chart */}
      <section className="chart-section">
        <div className="section-header">
          <h2>Performance Overview</h2>
          <div className="chart-legend">
            <span className="legend-item clicks"><span className="dot"></span>Clicks</span>
            <span className="legend-item conversions"><span className="dot"></span>Conversions</span>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-y-axis">
            <span>{maxClicks.toLocaleString()}</span>
            <span>{(maxClicks * 0.75).toFixed(0)}</span>
            <span>{(maxClicks * 0.5).toFixed(0)}</span>
            <span>{(maxClicks * 0.25).toFixed(0)}</span>
            <span>0</span>
          </div>
          <div className="chart-bars">
            {dailyStats.map((day, index) => (
              <div key={index} className="bar-group">
                <div className="bars">
                  <div 
                    className="bar clicks" 
                    style={{ height: `${(day.clicks / maxClicks) * 100}%` }}
                    title={`${day.clicks.toLocaleString()} clicks`}
                  >
                    <span className="bar-value">{(day.clicks / 1000).toFixed(1)}k</span>
                  </div>
                  <div 
                    className="bar conversions" 
                    style={{ height: `${(day.conversions / maxConversions) * 40}%` }}
                    title={`${day.conversions} conversions`}
                  >
                    <span className="bar-value">{day.conversions}</span>
                  </div>
                </div>
                <span className="bar-label">{day.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Top Performing Links */}
        <section className="links-section">
          <div className="section-header">
            <h2>Top Performing Links</h2>
            <button className="btn-link">
              View All <ExternalLink size={14} />
            </button>
          </div>
          <div className="links-table">
            <div className="table-header">
              <span>Link Name</span>
              <span>Clicks</span>
              <span>Conv.</span>
              <span>Rate</span>
              <span>Revenue</span>
            </div>
            {links.map((link) => (
              <div key={link.id} className="table-row">
                <div className="link-info">
                  <span className="link-name">{link.name}</span>
                  <span className="link-url">{link.url}</span>
                </div>
                <span className="stat clicks">{link.clicks.toLocaleString()}</span>
                <span className="stat conversions">{link.conversions}</span>
                <span className="stat rate">{link.conversionRate}%</span>
                <span className="stat revenue">${link.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Traffic & Device Stats */}
        <div className="stats-sidebar">
          {/* Traffic Sources */}
          <div className="traffic-card">
            <h3><Share2 size={18} /> Traffic Sources</h3>
            <div className="traffic-list">
              {trafficSources.map((source, index) => (
                <div key={index} className="traffic-item">
                  <div className="source-info">
                    <span 
                      className="source-dot" 
                      style={{ backgroundColor: source.color }}
                    ></span>
                    <span className="source-name">{source.source}</span>
                  </div>
                  <div className="source-stats">
                    <span className="source-clicks">{source.clicks.toLocaleString()}</span>
                    <span className="source-percent">{source.percentage}%</span>
                  </div>
                  <div className="source-bar">
                    <div 
                      className="source-progress"
                      style={{ 
                        width: `${source.percentage}%`,
                        backgroundColor: source.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="device-card">
            <h3><Monitor size={18} /> Device Breakdown</h3>
            <div className="device-chart">
              <div className="donut-chart">
                <svg viewBox="0 0 100 100">
                  <circle className="donut-segment desktop" cx="50" cy="50" r="35" 
                    strokeDasharray="51.1 48.9" strokeDashoffset="0" />
                  <circle className="donut-segment mobile" cx="50" cy="50" r="35" 
                    strokeDasharray="41.2 58.8" strokeDashoffset="-51.1" />
                  <circle className="donut-segment tablet" cx="50" cy="50" r="35" 
                    strokeDasharray="7.7 92.3" strokeDashoffset="-92.3" />
                </svg>
                <div className="donut-center">
                  <span className="total-clicks">{(45892).toLocaleString()}</span>
                  <span className="label">Total Clicks</span>
                </div>
              </div>
            </div>
            <div className="device-legend">
              {devices.map((device, index) => (
                <div key={index} className="device-item">
                  <div className="device-info">
                    {device.icon}
                    <span>{device.device}</span>
                  </div>
                  <div className="device-stats">
                    <span className="device-clicks">{device.clicks.toLocaleString()}</span>
                    <span className="device-percent">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats-card">
            <h3><Target size={18} /> Quick Stats</h3>
            <div className="quick-stats-list">
              <div className="quick-stat">
                <span className="stat-label">Best Day</span>
                <span className="stat-value">Thursday</span>
              </div>
              <div className="quick-stat">
                <span className="stat-label">Peak Hour</span>
                <span className="stat-value">2:00 PM</span>
              </div>
              <div className="quick-stat">
                <span className="stat-label">Avg. Session</span>
                <span className="stat-value">4m 32s</span>
              </div>
              <div className="quick-stat">
                <span className="stat-label">Bounce Rate</span>
                <span className="stat-value">42.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <section className="insights-section">
        <div className="section-header">
          <h2>AI Insights</h2>
        </div>
        <div className="insights-grid">
          <div className="insight-card positive">
            <div className="insight-icon">
              <TrendingUp size={20} />
            </div>
            <div className="insight-content">
              <h4>Strong Performance</h4>
              <p>Your YouTube Tutorial link has 3.11% conversion rate, 15% above average. Consider creating more video content.</p>
            </div>
          </div>
          <div className="insight-card warning">
            <div className="insight-icon">
              <Target size={20} />
            </div>
            <div className="insight-content">
              <h4>Optimization Opportunity</h4>
              <p>Mobile traffic is growing but has 18% lower conversion rate. Optimize landing pages for mobile users.</p>
            </div>
          </div>
          <div className="insight-card info">
            <div className="insight-icon">
              <Calendar size={20} />
            </div>
            <div className="insight-content">
              <h4>Timing Matters</h4>
              <p>Your best performing hours are 2-4 PM EST. Schedule promotions during these peak times for better results.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
