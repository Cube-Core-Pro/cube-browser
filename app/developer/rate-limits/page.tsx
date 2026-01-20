'use client';

import React, { useState } from 'react';
import {
  Gauge,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Settings,
  Info,
  Check,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  Server,
  Database,
  Globe,
  Calendar,
  Filter
} from 'lucide-react';
import './rate-limits.css';

interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  burstLimit: number;
  color: string;
}

interface EndpointLimit {
  endpoint: string;
  method: string;
  category: string;
  limitPerMinute: number;
  limitPerDay: number;
  currentUsage: number;
  percentUsed: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastReset: string;
}

interface UsageRecord {
  time: string;
  requests: number;
  blocked: number;
  avgLatency: number;
}

const tiers: RateLimitTier[] = [
  { name: 'Free', requestsPerMinute: 60, requestsPerDay: 1000, burstLimit: 10, color: '#6b7280' },
  { name: 'Starter', requestsPerMinute: 300, requestsPerDay: 10000, burstLimit: 50, color: '#3b82f6' },
  { name: 'Professional', requestsPerMinute: 1000, requestsPerDay: 100000, burstLimit: 200, color: '#8b5cf6' },
  { name: 'Enterprise', requestsPerMinute: 5000, requestsPerDay: 1000000, burstLimit: 1000, color: '#f59e0b' }
];

const endpointLimits: EndpointLimit[] = [
  {
    endpoint: '/api/v2/data',
    method: 'GET',
    category: 'Data',
    limitPerMinute: 1000,
    limitPerDay: 100000,
    currentUsage: 743,
    percentUsed: 74.3,
    status: 'warning',
    trend: 'up',
    lastReset: '2 min ago'
  },
  {
    endpoint: '/api/v2/automations',
    method: 'POST',
    category: 'Automation',
    limitPerMinute: 500,
    limitPerDay: 50000,
    currentUsage: 234,
    percentUsed: 46.8,
    status: 'healthy',
    trend: 'stable',
    lastReset: '2 min ago'
  },
  {
    endpoint: '/api/v2/users',
    method: 'GET',
    category: 'Users',
    limitPerMinute: 300,
    limitPerDay: 30000,
    currentUsage: 89,
    percentUsed: 29.7,
    status: 'healthy',
    trend: 'down',
    lastReset: '2 min ago'
  },
  {
    endpoint: '/api/v2/webhooks',
    method: 'POST',
    category: 'Webhooks',
    limitPerMinute: 200,
    limitPerDay: 20000,
    currentUsage: 187,
    percentUsed: 93.5,
    status: 'critical',
    trend: 'up',
    lastReset: '2 min ago'
  },
  {
    endpoint: '/api/v2/ai/analyze',
    method: 'POST',
    category: 'AI',
    limitPerMinute: 100,
    limitPerDay: 5000,
    currentUsage: 45,
    percentUsed: 45,
    status: 'healthy',
    trend: 'stable',
    lastReset: '2 min ago'
  },
  {
    endpoint: '/api/v2/exports',
    method: 'POST',
    category: 'Export',
    limitPerMinute: 50,
    limitPerDay: 1000,
    currentUsage: 12,
    percentUsed: 24,
    status: 'healthy',
    trend: 'down',
    lastReset: '2 min ago'
  }
];

const usageHistory: UsageRecord[] = [
  { time: '00:00', requests: 2340, blocked: 12, avgLatency: 145 },
  { time: '04:00', requests: 1230, blocked: 3, avgLatency: 132 },
  { time: '08:00', requests: 4560, blocked: 45, avgLatency: 178 },
  { time: '12:00', requests: 6780, blocked: 89, avgLatency: 201 },
  { time: '16:00', requests: 5430, blocked: 67, avgLatency: 189 },
  { time: '20:00', requests: 3210, blocked: 23, avgLatency: 156 },
  { time: 'Now', requests: 4120, blocked: 34, avgLatency: 167 }
];

export default function RateLimitsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentTier] = useState('Professional');

  const currentTierData = tiers.find(t => t.name === currentTier) || tiers[2];

  const stats = {
    totalRequests: 24567,
    blockedRequests: 234,
    successRate: 99.05,
    avgLatency: 167
  };

  const categories = ['all', ...new Set(endpointLimits.map(e => e.category))];

  const filteredEndpoints = endpointLimits.filter(
    e => categoryFilter === 'all' || e.category === categoryFilter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Check size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'critical': return <X size={14} />;
      default: return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight size={14} />;
      case 'down': return <ArrowDownRight size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const maxBarHeight = Math.max(...usageHistory.map(u => u.requests));

  return (
    <div className="rate-limits">
      {/* Header */}
      <div className="rate-limits__header">
        <div className="rate-limits__title-section">
          <div className="rate-limits__icon">
            <Gauge size={28} />
          </div>
          <div>
            <h1>Rate Limits</h1>
            <p>Monitor API usage and rate limit status</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="current-tier">
            <span className="tier-label">Current Plan:</span>
            <span className="tier-badge" style={{ background: currentTierData.color }}>
              {currentTier}
            </span>
          </div>
          <button className="btn-outline">
            <Settings size={18} />
            Configure
          </button>
          <button className="btn-primary">
            <ArrowUpRight size={18} />
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="rate-limits__stats">
        <div className="stat-card">
          <div className="stat-icon requests">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalRequests.toLocaleString()}</span>
            <span className="stat-label">Requests Today</span>
          </div>
          <div className="stat-trend up">
            <TrendingUp size={16} />
            <span>+12.5%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blocked">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.blockedRequests}</span>
            <span className="stat-label">Blocked Requests</span>
          </div>
          <div className="stat-trend down">
            <TrendingDown size={16} />
            <span>-8.3%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <Check size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.successRate}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon latency">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgLatency}ms</span>
            <span className="stat-label">Avg Latency</span>
          </div>
        </div>
      </div>

      {/* Plan Limits */}
      <div className="plan-limits-section">
        <div className="section-header">
          <h2>Plan Limits</h2>
          <div className="time-range-selector">
            {['1h', '24h', '7d', '30d'].map(range => (
              <button
                key={range}
                className={`range-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div className="limits-overview">
          <div className="limit-card">
            <div className="limit-header">
              <span className="limit-title">Requests per Minute</span>
              <span className="limit-value">{currentTierData.requestsPerMinute.toLocaleString()}</span>
            </div>
            <div className="limit-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: '67%', background: 'linear-gradient(90deg, #22c55e, #f59e0b)' }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>670 / {currentTierData.requestsPerMinute.toLocaleString()}</span>
                <span>67%</span>
              </div>
            </div>
          </div>
          
          <div className="limit-card">
            <div className="limit-header">
              <span className="limit-title">Requests per Day</span>
              <span className="limit-value">{currentTierData.requestsPerDay.toLocaleString()}</span>
            </div>
            <div className="limit-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: '24.5%', background: 'linear-gradient(90deg, #22c55e, #3b82f6)' }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>24,567 / {currentTierData.requestsPerDay.toLocaleString()}</span>
                <span>24.5%</span>
              </div>
            </div>
          </div>
          
          <div className="limit-card">
            <div className="limit-header">
              <span className="limit-title">Burst Limit</span>
              <span className="limit-value">{currentTierData.burstLimit}</span>
            </div>
            <div className="limit-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: '45%', background: 'linear-gradient(90deg, #22c55e, #8b5cf6)' }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>90 / {currentTierData.burstLimit}</span>
                <span>45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="usage-chart-section">
        <div className="section-header">
          <h2>Usage Over Time</h2>
          <button className="btn-icon">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="chart-container">
          <div className="chart-bars">
            {usageHistory.map((record, idx) => (
              <div key={idx} className="bar-group">
                <div className="bar-container">
                  <div 
                    className="bar requests-bar"
                    style={{ height: `${(record.requests / maxBarHeight) * 100}%` }}
                  >
                    <span className="bar-tooltip">{record.requests.toLocaleString()} requests</span>
                  </div>
                  <div 
                    className="bar blocked-bar"
                    style={{ height: `${(record.blocked / maxBarHeight) * 100}%` }}
                  >
                    <span className="bar-tooltip">{record.blocked} blocked</span>
                  </div>
                </div>
                <span className="bar-label">{record.time}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color requests"></span>
              <span>Requests</span>
            </div>
            <div className="legend-item">
              <span className="legend-color blocked"></span>
              <span>Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Limits */}
      <div className="endpoint-limits-section">
        <div className="section-header">
          <h2>Endpoint Limits</h2>
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="endpoints-table">
          <div className="table-header">
            <span className="col-endpoint">Endpoint</span>
            <span className="col-limit">Limit/min</span>
            <span className="col-usage">Current Usage</span>
            <span className="col-status">Status</span>
            <span className="col-trend">Trend</span>
            <span className="col-reset">Reset</span>
          </div>
          
          {filteredEndpoints.map((endpoint, idx) => (
            <div key={idx} className={`table-row ${endpoint.status}`}>
              <div className="col-endpoint">
                <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                  {endpoint.method}
                </span>
                <span className="endpoint-path">{endpoint.endpoint}</span>
              </div>
              <div className="col-limit">
                {endpoint.limitPerMinute.toLocaleString()}
              </div>
              <div className="col-usage">
                <div className="usage-bar-container">
                  <div 
                    className={`usage-bar ${endpoint.status}`}
                    style={{ width: `${endpoint.percentUsed}%` }}
                  ></div>
                </div>
                <span className="usage-text">
                  {endpoint.currentUsage.toLocaleString()} ({endpoint.percentUsed}%)
                </span>
              </div>
              <div className="col-status">
                <span className={`status-badge ${endpoint.status}`}>
                  {getStatusIcon(endpoint.status)}
                  {endpoint.status}
                </span>
              </div>
              <div className="col-trend">
                <span className={`trend-indicator ${endpoint.trend}`}>
                  {getTrendIcon(endpoint.trend)}
                </span>
              </div>
              <div className="col-reset">
                <Clock size={12} />
                {endpoint.lastReset}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Comparison */}
      <div className="tier-comparison-section">
        <div className="section-header">
          <h2>Plan Comparison</h2>
        </div>
        <div className="tiers-grid">
          {tiers.map(tier => (
            <div 
              key={tier.name} 
              className={`tier-card ${tier.name === currentTier ? 'current' : ''}`}
              style={{ borderColor: tier.name === currentTier ? tier.color : undefined }}
            >
              {tier.name === currentTier && (
                <span className="current-badge" style={{ background: tier.color }}>Current</span>
              )}
              <h3 style={{ color: tier.color }}>{tier.name}</h3>
              <div className="tier-limits">
                <div className="tier-limit">
                  <span className="limit-label">Requests/min</span>
                  <span className="limit-value">{tier.requestsPerMinute.toLocaleString()}</span>
                </div>
                <div className="tier-limit">
                  <span className="limit-label">Requests/day</span>
                  <span className="limit-value">{tier.requestsPerDay.toLocaleString()}</span>
                </div>
                <div className="tier-limit">
                  <span className="limit-label">Burst limit</span>
                  <span className="limit-value">{tier.burstLimit}</span>
                </div>
              </div>
              {tier.name !== currentTier && (
                <button className="btn-tier" style={{ borderColor: tier.color, color: tier.color }}>
                  {tiers.indexOf(tier) > tiers.findIndex(t => t.name === currentTier) ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <Info size={20} />
        <div className="info-content">
          <h4>About Rate Limits</h4>
          <p>Rate limits are applied per API key and reset every minute. If you exceed your limits, requests will receive a 429 status code. Consider upgrading your plan for higher limits or implementing request queuing in your application.</p>
          <a href="/docs/rate-limits" className="info-link">
            Learn more about rate limits <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
