'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, DollarSign,
  Users, Building2, Calendar, Download, RefreshCw, Loader2,
  PieChart, Activity, Target, ArrowUpRight, ArrowDownRight,
  Filter, ChevronDown, Globe, Clock
} from 'lucide-react';
import '../whitelabel.css';

// ============================================
// Types
// ============================================

interface AnalyticsOverview {
  totalRevenue: number;
  revenueGrowth: number;
  totalClients: number;
  clientGrowth: number;
  totalUsers: number;
  userGrowth: number;
  avgRevenuePerClient: number;
  churnRate: number;
  mrr: number;
  arr: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  clients: number;
}

interface PlanDistribution {
  plan: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface TopClient {
  id: string;
  name: string;
  revenue: number;
  users: number;
  growth: number;
  plan: string;
}

interface GrowthMetric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================
// Main Component
// ============================================

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewData, revenue, plans, clients, metrics] = await Promise.all([
        invoke<AnalyticsOverview>('get_reseller_analytics_overview', { period }),
        invoke<RevenueData[]>('get_reseller_revenue_chart', { period }),
        invoke<PlanDistribution[]>('get_reseller_plan_distribution'),
        invoke<TopClient[]>('get_reseller_top_clients', { limit: 5 }),
        invoke<GrowthMetric[]>('get_reseller_growth_metrics')
      ]);

      setOverview(overviewData);
      setRevenueData(revenue);
      setPlanDistribution(plans);
      setTopClients(clients);
      setGrowthMetrics(metrics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setOverview({
      totalRevenue: 148560,
      revenueGrowth: 23.5,
      totalClients: 47,
      clientGrowth: 12.8,
      totalUsers: 1247,
      userGrowth: 18.2,
      avgRevenuePerClient: 3161,
      churnRate: 2.1,
      mrr: 12450,
      arr: 149400
    });

    // Generate revenue data based on period
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const data: RevenueData[] = [];
    let baseRevenue = 10000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      baseRevenue += Math.random() * 200 - 50;
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(baseRevenue),
        clients: 35 + Math.floor(i * 0.1)
      });
    }
    setRevenueData(data);

    setPlanDistribution([
      { plan: 'Professional', count: 18, revenue: 4284, percentage: 38.3 },
      { plan: 'Business', count: 21, revenue: 4158, percentage: 44.7 },
      { plan: 'Enterprise', count: 8, revenue: 4008, percentage: 17.0 }
    ]);

    setTopClients([
      { id: '1', name: 'InnovateTech Labs', revenue: 1499, users: 156, growth: 15.2, plan: 'Enterprise' },
      { id: '2', name: 'GrowthMetrics Inc', revenue: 899, users: 89, growth: 8.5, plan: 'Enterprise' },
      { id: '3', name: 'CloudSync Pro', revenue: 670, users: 67, growth: 22.1, plan: 'Business' },
      { id: '4', name: 'TechFlow Solutions', revenue: 495, users: 45, growth: 5.8, plan: 'Business' },
      { id: '5', name: 'DataDriven Analytics', revenue: 237, users: 23, growth: -2.3, plan: 'Professional' }
    ]);

    setGrowthMetrics([
      { label: 'New Clients', value: 6, change: 20, trend: 'up' },
      { label: 'Churned Clients', value: 1, change: -50, trend: 'down' },
      { label: 'Upgrades', value: 3, change: 50, trend: 'up' },
      { label: 'Downgrades', value: 0, change: 0, trend: 'stable' }
    ]);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const planColors = ['#3b82f6', '#8b5cf6', '#10b981'];

  const exportReport = () => {
    // Generate and download report
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      overview,
      topClients,
      planDistribution
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reseller-analytics-${period}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="whitelabel-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/whitelabel')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h1>Reseller Analytics</h1>
              <p>Track your white-label business performance</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <button 
              className={period === '7d' ? 'active' : ''}
              onClick={() => setPeriod('7d')}
            >7D</button>
            <button 
              className={period === '30d' ? 'active' : ''}
              onClick={() => setPeriod('30d')}
            >30D</button>
            <button 
              className={period === '90d' ? 'active' : ''}
              onClick={() => setPeriod('90d')}
            >90D</button>
            <button 
              className={period === '1y' ? 'active' : ''}
              onClick={() => setPeriod('1y')}
            >1Y</button>
          </div>
          <button className="btn-secondary" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="btn-primary" onClick={exportReport}>
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Overview Stats */}
      <section className="overview-stats">
        <div className="stat-card large primary">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className={`stat-change ${overview!.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
              {overview!.revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(overview!.revenueGrowth)}%
            </div>
          </div>
          <div className="stat-value">{formatCurrency(overview!.totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-subtext">
            MRR: {formatCurrency(overview!.mrr)} · ARR: {formatCurrency(overview!.arr)}
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-header">
            <div className="stat-icon">
              <Building2 className="w-6 h-6" />
            </div>
            <div className={`stat-change ${overview!.clientGrowth >= 0 ? 'positive' : 'negative'}`}>
              {overview!.clientGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(overview!.clientGrowth)}%
            </div>
          </div>
          <div className="stat-value">{overview!.totalClients}</div>
          <div className="stat-label">Total Clients</div>
          <div className="stat-subtext">
            Avg Revenue: {formatCurrency(overview!.avgRevenuePerClient)}/client
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-header">
            <div className="stat-icon">
              <Users className="w-6 h-6" />
            </div>
            <div className={`stat-change ${overview!.userGrowth >= 0 ? 'positive' : 'negative'}`}>
              {overview!.userGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(overview!.userGrowth)}%
            </div>
          </div>
          <div className="stat-value">{formatNumber(overview!.totalUsers)}</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-subtext">
            Across all client accounts
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-header">
            <div className="stat-icon warning">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="stat-value">{overview!.churnRate}%</div>
          <div className="stat-label">Churn Rate</div>
          <div className="stat-subtext">
            Monthly client retention: {(100 - overview!.churnRate).toFixed(1)}%
          </div>
        </div>
      </section>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Revenue Chart */}
        <section className="chart-section revenue-chart">
          <div className="section-header">
            <h2>Revenue Trend</h2>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="dot blue"></span>
                Revenue
              </span>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-y-axis">
              <span>{formatCurrency(maxRevenue)}</span>
              <span>{formatCurrency(maxRevenue * 0.75)}</span>
              <span>{formatCurrency(maxRevenue * 0.5)}</span>
              <span>{formatCurrency(maxRevenue * 0.25)}</span>
              <span>$0</span>
            </div>
            <div className="chart-area">
              {revenueData.slice(-30).map((data, index) => (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className="chart-bar"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  >
                    <span className="bar-tooltip">
                      {formatCurrency(data.revenue)}
                      <br />
                      <small>{data.date}</small>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plan Distribution */}
        <section className="chart-section distribution-chart">
          <div className="section-header">
            <h2>Plan Distribution</h2>
          </div>
          <div className="pie-chart-container">
            <div className="pie-chart">
              {/* Simple CSS pie chart representation */}
              <svg viewBox="0 0 100 100" className="pie-svg">
                {planDistribution.map((plan, index) => {
                  let rotation = planDistribution
                    .slice(0, index)
                    .reduce((sum, p) => sum + p.percentage * 3.6, 0);
                  return (
                    <circle
                      key={plan.plan}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={planColors[index]}
                      strokeWidth="20"
                      strokeDasharray={`${plan.percentage * 2.51} 251.2`}
                      strokeDashoffset={-rotation * 0.697}
                      transform="rotate(-90 50 50)"
                    />
                  );
                })}
              </svg>
              <div className="pie-center">
                <span className="pie-total">{overview!.totalClients}</span>
                <span className="pie-label">Clients</span>
              </div>
            </div>
            <div className="pie-legend">
              {planDistribution.map((plan, index) => (
                <div key={plan.plan} className="legend-item">
                  <span className="legend-dot" style={{ background: planColors[index] }}></span>
                  <div className="legend-content">
                    <span className="legend-name">{plan.plan}</span>
                    <span className="legend-stats">
                      {plan.count} clients · {formatCurrency(plan.revenue)}/mo
                    </span>
                  </div>
                  <span className="legend-percentage">{plan.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        {/* Top Clients */}
        <section className="top-clients-section">
          <div className="section-header">
            <h2>Top Clients by Revenue</h2>
            <button className="btn-link" onClick={() => router.push('/whitelabel/clients')}>
              View All
            </button>
          </div>
          <div className="top-clients-list">
            {topClients.map((client, index) => (
              <div key={client.id} className="top-client-item">
                <div className="rank">#{index + 1}</div>
                <div className="client-info">
                  <div className="client-avatar">
                    {client.name.charAt(0)}
                  </div>
                  <div className="client-details">
                    <span className="client-name">{client.name}</span>
                    <span className={`plan-badge ${client.plan.toLowerCase()}`}>{client.plan}</span>
                  </div>
                </div>
                <div className="client-stats">
                  <div className="stat">
                    <span className="value">{formatCurrency(client.revenue)}</span>
                    <span className="label">Revenue/mo</span>
                  </div>
                  <div className="stat">
                    <span className="value">{client.users}</span>
                    <span className="label">Users</span>
                  </div>
                  <div className={`growth ${client.growth >= 0 ? 'positive' : 'negative'}`}>
                    {client.growth >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(client.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Growth Metrics */}
        <section className="growth-metrics-section">
          <div className="section-header">
            <h2>Growth Metrics</h2>
            <span className="period-badge">This Month</span>
          </div>
          <div className="growth-metrics-grid">
            {growthMetrics.map((metric) => (
              <div key={metric.label} className={`growth-metric ${metric.trend}`}>
                <div className="metric-header">
                  <span className="metric-label">{metric.label}</span>
                  {metric.change !== 0 && (
                    <span className={`metric-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
                  )}
                </div>
                <div className="metric-value">{metric.value}</div>
                <div className="metric-trend">
                  {metric.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {metric.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {metric.trend === 'stable' && <Activity className="w-4 h-4" />}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Insights */}
          <div className="insights-card">
            <h3>💡 Quick Insights</h3>
            <ul>
              <li>
                <Target className="w-4 h-4" />
                Revenue up <strong>23.5%</strong> compared to last period
              </li>
              <li>
                <TrendingUp className="w-4 h-4" />
                <strong>3 clients</strong> upgraded their plans this month
              </li>
              <li>
                <Clock className="w-4 h-4" />
                Average client lifetime: <strong>8.2 months</strong>
              </li>
              <li>
                <Globe className="w-4 h-4" />
                <strong>2 new</strong> custom domains configured
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
