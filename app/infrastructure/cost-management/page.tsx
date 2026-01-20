'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Network,
  Globe,
  Zap,
  Settings,
  Filter,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  CreditCard,
  Receipt,
  Wallet
} from 'lucide-react';
import './cost-management.css';

interface CostBreakdown {
  id: string;
  category: string;
  service: string;
  provider: 'aws' | 'gcp' | 'azure' | 'other';
  currentCost: number;
  previousCost: number;
  budget: number;
  usage: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  lastUpdated: string;
}

interface CostAlert {
  id: string;
  type: 'budget' | 'anomaly' | 'forecast';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  value: number;
  threshold: number;
  service: string;
  timestamp: string;
}

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: 'compute' | 'storage' | 'network' | 'database' | 'other';
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
}

interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  provider: string;
}

const COST_BREAKDOWN: CostBreakdown[] = [
  { id: 'cost-1', category: 'Compute', service: 'EC2 Instances', provider: 'aws', currentCost: 12450, previousCost: 11200, budget: 15000, usage: 2450, unit: 'hours', trend: 'up', trendPercent: 11.2, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-2', category: 'Compute', service: 'GKE Clusters', provider: 'gcp', currentCost: 8920, previousCost: 8650, budget: 10000, usage: 720, unit: 'node-hours', trend: 'up', trendPercent: 3.1, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-3', category: 'Database', service: 'RDS PostgreSQL', provider: 'aws', currentCost: 5680, previousCost: 5450, budget: 6000, usage: 1, unit: 'cluster', trend: 'up', trendPercent: 4.2, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-4', category: 'Storage', service: 'S3 Storage', provider: 'aws', currentCost: 3240, previousCost: 3450, budget: 4000, usage: 12.5, unit: 'TB', trend: 'down', trendPercent: -6.1, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-5', category: 'Network', service: 'CloudFront CDN', provider: 'aws', currentCost: 4580, previousCost: 4100, budget: 5000, usage: 45.2, unit: 'TB transferred', trend: 'up', trendPercent: 11.7, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-6', category: 'AI/ML', service: 'OpenAI API', provider: 'other', currentCost: 8750, previousCost: 7200, budget: 10000, usage: 2500000, unit: 'tokens', trend: 'up', trendPercent: 21.5, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-7', category: 'Database', service: 'ElastiCache Redis', provider: 'aws', currentCost: 2890, previousCost: 2890, budget: 3500, usage: 3, unit: 'nodes', trend: 'stable', trendPercent: 0, lastUpdated: '2025-01-28T14:00:00Z' },
  { id: 'cost-8', category: 'Monitoring', service: 'Datadog', provider: 'other', currentCost: 1850, previousCost: 1750, budget: 2000, usage: 50, unit: 'hosts', trend: 'up', trendPercent: 5.7, lastUpdated: '2025-01-28T14:00:00Z' }
];

const COST_ALERTS: CostAlert[] = [
  { id: 'alert-1', type: 'anomaly', severity: 'warning', title: 'OpenAI API cost spike', description: 'Unusual 21.5% increase in OpenAI API costs compared to last month', value: 8750, threshold: 7500, service: 'OpenAI API', timestamp: '2025-01-28T12:00:00Z' },
  { id: 'alert-2', type: 'budget', severity: 'warning', title: 'EC2 approaching budget limit', description: 'EC2 costs at 83% of monthly budget with 3 days remaining', value: 12450, threshold: 15000, service: 'EC2 Instances', timestamp: '2025-01-28T10:00:00Z' },
  { id: 'alert-3', type: 'forecast', severity: 'info', title: 'Projected overage: CloudFront', description: 'Based on current usage, CloudFront may exceed budget by ~$580', value: 5580, threshold: 5000, service: 'CloudFront CDN', timestamp: '2025-01-28T08:00:00Z' }
];

const RECOMMENDATIONS: OptimizationRecommendation[] = [
  { id: 'rec-1', title: 'Right-size EC2 instances', description: 'Analysis shows 12 instances are consistently under 30% utilization. Consider downsizing to smaller instance types.', potentialSavings: 2840, effort: 'medium', impact: 'high', category: 'compute', status: 'pending' },
  { id: 'rec-2', title: 'Use Reserved Instances', description: 'Converting 8 on-demand instances to 1-year reserved instances could reduce costs significantly.', potentialSavings: 3200, effort: 'low', impact: 'high', category: 'compute', status: 'pending' },
  { id: 'rec-3', title: 'Enable S3 Intelligent Tiering', description: 'Move infrequently accessed data to lower-cost storage tiers automatically.', potentialSavings: 680, effort: 'low', impact: 'medium', category: 'storage', status: 'in-progress' },
  { id: 'rec-4', title: 'Optimize OpenAI prompts', description: 'Implement prompt caching and reduce token usage by optimizing system prompts.', potentialSavings: 1500, effort: 'high', impact: 'medium', category: 'other', status: 'pending' },
  { id: 'rec-5', title: 'Delete unused EBS volumes', description: 'Found 15 unattached EBS volumes totaling 2.4TB. Consider deleting or snapshotting.', potentialSavings: 340, effort: 'low', impact: 'low', category: 'storage', status: 'completed' }
];

const INVOICES: Invoice[] = [
  { id: 'inv-1', period: 'January 2025', amount: 48360, status: 'pending', dueDate: '2025-02-15', provider: 'AWS' },
  { id: 'inv-2', period: 'January 2025', amount: 8920, status: 'pending', dueDate: '2025-02-15', provider: 'GCP' },
  { id: 'inv-3', period: 'December 2024', amount: 42150, status: 'paid', dueDate: '2025-01-15', provider: 'AWS' },
  { id: 'inv-4', period: 'December 2024', amount: 8650, status: 'paid', dueDate: '2025-01-15', provider: 'GCP' }
];

const PROVIDER_CONFIG = {
  aws: { color: 'orange', label: 'AWS' },
  gcp: { color: 'blue', label: 'GCP' },
  azure: { color: 'blue', label: 'Azure' },
  other: { color: 'purple', label: 'Other' }
};

const CATEGORY_CONFIG = {
  compute: { icon: Cpu },
  storage: { icon: HardDrive },
  network: { icon: Network },
  database: { icon: Database },
  other: { icon: Cloud }
};

const EFFORT_CONFIG = {
  low: { color: 'success', label: 'Low Effort' },
  medium: { color: 'warning', label: 'Medium Effort' },
  high: { color: 'danger', label: 'High Effort' }
};

const IMPACT_CONFIG = {
  low: { color: 'muted', label: 'Low Impact' },
  medium: { color: 'warning', label: 'Medium Impact' },
  high: { color: 'success', label: 'High Impact' }
};

export default function CostManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'recommendations' | 'billing'>('overview');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const totalCurrentCost = COST_BREAKDOWN.reduce((sum, c) => sum + c.currentCost, 0);
  const totalPreviousCost = COST_BREAKDOWN.reduce((sum, c) => sum + c.previousCost, 0);
  const totalBudget = COST_BREAKDOWN.reduce((sum, c) => sum + c.budget, 0);
  const costChange = ((totalCurrentCost - totalPreviousCost) / totalPreviousCost * 100).toFixed(1);
  const budgetUsed = ((totalCurrentCost / totalBudget) * 100).toFixed(0);
  const potentialSavings = RECOMMENDATIONS.filter(r => r.status !== 'completed' && r.status !== 'dismissed')
    .reduce((sum, r) => sum + r.potentialSavings, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const costByCategory = COST_BREAKDOWN.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.currentCost;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="cost-management">
      <div className="cost-management__header">
        <div className="cost-management__title-section">
          <div className="cost-management__icon">
            <DollarSign size={28} />
          </div>
          <div>
            <h1>Cost Management</h1>
            <p>Monitor and optimize cloud spending</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="cost-management__stats">
        <div className="stat-card primary">
          <div className="stat-icon total">
            <Wallet size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(totalCurrentCost)}</span>
            <span className="stat-label">Current Month</span>
          </div>
          <div className={`stat-trend ${Number(costChange) >= 0 ? 'up' : 'down'}`}>
            {Number(costChange) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(Number(costChange))}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon budget">
            <Target size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{budgetUsed}%</span>
            <span className="stat-label">Budget Used</span>
          </div>
          <div className="budget-bar">
            <div className="budget-fill" style={{ width: `${Math.min(Number(budgetUsed), 100)}%` }} />
          </div>
        </div>
        <div className="stat-card savings">
          <div className="stat-icon savings">
            <TrendingDown size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(potentialSavings)}</span>
            <span className="stat-label">Potential Savings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon alerts">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{COST_ALERTS.length}</span>
            <span className="stat-label">Active Alerts</span>
          </div>
        </div>
      </div>

      <div className="cost-management__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
        >
          <PieChart size={16} />
          Cost Breakdown
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Zap size={16} />
          Recommendations
          <span className="tab-badge">{RECOMMENDATIONS.filter(r => r.status === 'pending').length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <Receipt size={16} />
          Billing
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="overview-grid">
            <div className="panel cost-by-category">
              <div className="panel-header">
                <h3>Cost by Category</h3>
              </div>
              <div className="category-bars">
                {Object.entries(costByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, cost]) => (
                    <div key={category} className="category-bar-item">
                      <div className="category-info">
                        <span className="category-name">{category}</span>
                        <span className="category-cost">{formatCurrency(cost)}</span>
                      </div>
                      <div className="category-bar">
                        <div 
                          className="category-fill" 
                          style={{ width: `${(cost / totalCurrentCost) * 100}%` }}
                        />
                      </div>
                      <span className="category-percent">{((cost / totalCurrentCost) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="panel cost-alerts">
              <div className="panel-header">
                <h3>Cost Alerts</h3>
              </div>
              <div className="alerts-list">
                {COST_ALERTS.map(alert => (
                  <div key={alert.id} className={`alert-item ${alert.severity}`}>
                    <div className={`alert-icon ${alert.severity}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div className="alert-content">
                      <span className="alert-title">{alert.title}</span>
                      <span className="alert-desc">{alert.description}</span>
                    </div>
                    <span className={`alert-type ${alert.type}`}>{alert.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel top-services">
              <div className="panel-header">
                <h3>Top Services by Cost</h3>
              </div>
              <div className="services-list">
                {[...COST_BREAKDOWN]
                  .sort((a, b) => b.currentCost - a.currentCost)
                  .slice(0, 5)
                  .map((service, idx) => {
                    const ProviderConfig = PROVIDER_CONFIG[service.provider];
                    return (
                      <div key={service.id} className="service-item">
                        <span className="service-rank">{idx + 1}</span>
                        <div className="service-info">
                          <span className="service-name">{service.service}</span>
                          <span className={`provider-badge ${ProviderConfig.color}`}>
                            {ProviderConfig.label}
                          </span>
                        </div>
                        <span className="service-cost">{formatCurrency(service.currentCost)}</span>
                        <span className={`service-trend ${service.trend}`}>
                          {service.trend === 'up' && <TrendingUp size={14} />}
                          {service.trend === 'down' && <TrendingDown size={14} />}
                          {service.trend === 'stable' && <Minus size={14} />}
                          {service.trendPercent !== 0 && `${Math.abs(service.trendPercent)}%`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'breakdown' && (
        <div className="breakdown-section">
          <div className="section-filters">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Compute">Compute</option>
              <option value="Database">Database</option>
              <option value="Storage">Storage</option>
              <option value="Network">Network</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Monitoring">Monitoring</option>
            </select>
          </div>

          <div className="breakdown-table">
            <div className="bt-header">
              <span className="bt-th">Service</span>
              <span className="bt-th">Provider</span>
              <span className="bt-th">Current Cost</span>
              <span className="bt-th">vs Last Period</span>
              <span className="bt-th">Budget</span>
              <span className="bt-th">Usage</span>
            </div>
            <div className="bt-body">
              {COST_BREAKDOWN
                .filter(c => categoryFilter === 'all' || c.category === categoryFilter)
                .map(cost => {
                  const ProviderConfig = PROVIDER_CONFIG[cost.provider];
                  const budgetPercent = (cost.currentCost / cost.budget) * 100;
                  
                  return (
                    <div key={cost.id} className="bt-row">
                      <span className="bt-td service">
                        <div className="service-cell">
                          <span className="service-category">{cost.category}</span>
                          <span className="service-name">{cost.service}</span>
                        </div>
                      </span>
                      <span className="bt-td provider">
                        <span className={`provider-chip ${ProviderConfig.color}`}>
                          {ProviderConfig.label}
                        </span>
                      </span>
                      <span className="bt-td cost">{formatCurrency(cost.currentCost)}</span>
                      <span className={`bt-td trend ${cost.trend}`}>
                        {cost.trend === 'up' && <TrendingUp size={14} />}
                        {cost.trend === 'down' && <TrendingDown size={14} />}
                        {cost.trend === 'stable' && <Minus size={14} />}
                        <span>{cost.trend === 'stable' ? '0%' : `${cost.trendPercent > 0 ? '+' : ''}${cost.trendPercent}%`}</span>
                      </span>
                      <span className="bt-td budget">
                        <div className="budget-cell">
                          <div className="mini-budget-bar">
                            <div 
                              className={`mini-budget-fill ${budgetPercent > 90 ? 'danger' : budgetPercent > 75 ? 'warning' : ''}`}
                              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                            />
                          </div>
                          <span className="budget-text">{budgetPercent.toFixed(0)}% of {formatCurrency(cost.budget)}</span>
                        </div>
                      </span>
                      <span className="bt-td usage">{cost.usage.toLocaleString()} {cost.unit}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="recommendations-section">
          <div className="section-header">
            <h3>Optimization Recommendations</h3>
            <div className="total-savings">
              <span>Total Potential Savings:</span>
              <strong>{formatCurrency(potentialSavings)}/month</strong>
            </div>
          </div>

          <div className="recommendations-list">
            {RECOMMENDATIONS.map(rec => {
              const CategoryIcon = CATEGORY_CONFIG[rec.category]?.icon || Cloud;
              const EffortConfig = EFFORT_CONFIG[rec.effort];
              const ImpactConfig = IMPACT_CONFIG[rec.impact];
              
              return (
                <div key={rec.id} className={`recommendation-card ${rec.status}`}>
                  <div className="rec-icon">
                    <CategoryIcon size={20} />
                  </div>
                  <div className="rec-content">
                    <div className="rec-header">
                      <h4>{rec.title}</h4>
                      <div className="rec-badges">
                        <span className={`effort-badge ${EffortConfig.color}`}>{EffortConfig.label}</span>
                        <span className={`impact-badge ${ImpactConfig.color}`}>{ImpactConfig.label}</span>
                      </div>
                    </div>
                    <p className="rec-description">{rec.description}</p>
                    <div className="rec-footer">
                      <span className="rec-savings">
                        <DollarSign size={14} />
                        Save {formatCurrency(rec.potentialSavings)}/month
                      </span>
                      <span className={`rec-status ${rec.status}`}>{rec.status}</span>
                    </div>
                  </div>
                  {rec.status === 'pending' && (
                    <div className="rec-actions">
                      <button className="action-btn primary">Apply</button>
                      <button className="action-btn">Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="billing-section">
          <div className="section-header">
            <h3>Invoices & Billing</h3>
          </div>

          <div className="invoices-table">
            <div className="it-header">
              <span className="it-th">Period</span>
              <span className="it-th">Provider</span>
              <span className="it-th">Amount</span>
              <span className="it-th">Due Date</span>
              <span className="it-th">Status</span>
              <span className="it-th">Actions</span>
            </div>
            <div className="it-body">
              {INVOICES.map(invoice => (
                <div key={invoice.id} className="it-row">
                  <span className="it-td period">{invoice.period}</span>
                  <span className="it-td provider">{invoice.provider}</span>
                  <span className="it-td amount">{formatCurrency(invoice.amount)}</span>
                  <span className="it-td due-date">{formatDate(invoice.dueDate)}</span>
                  <span className="it-td status">
                    <span className={`status-chip ${invoice.status}`}>
                      {invoice.status === 'paid' && <CheckCircle size={12} />}
                      {invoice.status === 'pending' && <Clock size={12} />}
                      {invoice.status === 'overdue' && <AlertTriangle size={12} />}
                      {invoice.status}
                    </span>
                  </span>
                  <span className="it-td actions">
                    <button className="action-btn-sm">
                      <Download size={12} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="payment-methods">
            <h3>Payment Methods</h3>
            <div className="payment-cards">
              <div className="payment-card default">
                <div className="card-icon">
                  <CreditCard size={24} />
                </div>
                <div className="card-info">
                  <span className="card-type">Visa ending in 4242</span>
                  <span className="card-expiry">Expires 12/26</span>
                </div>
                <span className="default-badge">Default</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
