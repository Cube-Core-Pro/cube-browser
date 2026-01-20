'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Cloud,
  Server,
  Database,
  HardDrive,
  Cpu,
  Globe,
  Zap,
  Users,
  Building,
  Tag,
  CreditCard,
  Receipt,
  Wallet,
  Target,
  Bell,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Eye
} from 'lucide-react';
import './cost-management.css';

interface CostByService {
  service: string;
  provider: string;
  cost: number;
  previousCost: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  category: string;
}

interface CostByTeam {
  team: string;
  budget: number;
  spent: number;
  forecast: number;
  projects: number;
  status: 'on-track' | 'warning' | 'over-budget';
}

interface CostAnomaly {
  id: string;
  service: string;
  type: 'spike' | 'unusual' | 'new-resource';
  description: string;
  impact: number;
  detectedAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface Budget {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  spent: number;
  forecast: number;
  alerts: number[];
  owner: string;
}

interface ResourceRecommendation {
  id: string;
  resource: string;
  type: 'right-size' | 'unused' | 'reserved' | 'spot';
  currentCost: number;
  projectedSavings: number;
  effort: 'low' | 'medium' | 'high';
  description: string;
}

const COST_BY_SERVICE: CostByService[] = [
  { service: 'Amazon EKS', provider: 'AWS', cost: 12450, previousCost: 11200, trend: 'up', percentage: 28.4, category: 'Compute' },
  { service: 'Amazon RDS', provider: 'AWS', cost: 8920, previousCost: 8750, trend: 'up', percentage: 20.3, category: 'Database' },
  { service: 'Amazon S3', provider: 'AWS', cost: 4560, previousCost: 4890, trend: 'down', percentage: 10.4, category: 'Storage' },
  { service: 'CloudFront', provider: 'AWS', cost: 3240, previousCost: 2980, trend: 'up', percentage: 7.4, category: 'Network' },
  { service: 'Lambda', provider: 'AWS', cost: 2890, previousCost: 2450, trend: 'up', percentage: 6.6, category: 'Serverless' },
  { service: 'OpenAI API', provider: 'OpenAI', cost: 4200, previousCost: 3100, trend: 'up', percentage: 9.6, category: 'AI/ML' },
  { service: 'Datadog', provider: 'Datadog', cost: 2100, previousCost: 2100, trend: 'stable', percentage: 4.8, category: 'Monitoring' },
  { service: 'Other Services', provider: 'Various', cost: 5500, previousCost: 5200, trend: 'up', percentage: 12.5, category: 'Other' },
];

const COST_BY_TEAM: CostByTeam[] = [
  { team: 'Platform Engineering', budget: 25000, spent: 18500, forecast: 24200, projects: 8, status: 'on-track' },
  { team: 'AI/ML Team', budget: 15000, spent: 14200, forecast: 18500, projects: 5, status: 'warning' },
  { team: 'Frontend Team', budget: 8000, spent: 5200, forecast: 6800, projects: 3, status: 'on-track' },
  { team: 'Backend Services', budget: 20000, spent: 21500, forecast: 28000, projects: 12, status: 'over-budget' },
  { team: 'Data Engineering', budget: 18000, spent: 12800, forecast: 16500, projects: 6, status: 'on-track' },
];

const COST_ANOMALIES: CostAnomaly[] = [
  { id: 'a1', service: 'Amazon EKS', type: 'spike', description: 'Unexpected 45% increase in compute costs over 24h', impact: 1250, detectedAt: '2h ago', status: 'active' },
  { id: 'a2', service: 'OpenAI API', type: 'unusual', description: 'API call volume 3x higher than baseline', impact: 890, detectedAt: '6h ago', status: 'acknowledged' },
  { id: 'a3', service: 'Amazon RDS', type: 'new-resource', description: 'New db.r5.2xlarge instance provisioned', impact: 450, detectedAt: '1d ago', status: 'resolved' },
];

const BUDGETS: Budget[] = [
  { id: 'b1', name: 'Production Infrastructure', type: 'monthly', amount: 50000, spent: 38500, forecast: 48200, alerts: [80, 90, 100], owner: 'Platform Team' },
  { id: 'b2', name: 'Development & Staging', type: 'monthly', amount: 15000, spent: 11200, forecast: 14500, alerts: [75, 90], owner: 'DevOps Team' },
  { id: 'b3', name: 'AI/ML Services', type: 'monthly', amount: 20000, spent: 17800, forecast: 23000, alerts: [80, 95], owner: 'ML Team' },
  { id: 'b4', name: 'Q1 2025 Total', type: 'quarterly', amount: 200000, spent: 142500, forecast: 185000, alerts: [75, 90, 100], owner: 'Finance' },
];

const RECOMMENDATIONS: ResourceRecommendation[] = [
  { id: 'r1', resource: 'prod-api-cluster', type: 'right-size', currentCost: 4200, projectedSavings: 1260, effort: 'medium', description: 'Reduce node size from m5.2xlarge to m5.xlarge based on utilization' },
  { id: 'r2', resource: 'staging-db-replica', type: 'unused', currentCost: 890, projectedSavings: 890, effort: 'low', description: 'Unused read replica - no queries in 30 days' },
  { id: 'r3', resource: 'ml-inference-fleet', type: 'spot', currentCost: 3500, projectedSavings: 2450, effort: 'high', description: 'Switch to Spot instances for fault-tolerant ML workloads' },
  { id: 'r4', resource: 'prod-database', type: 'reserved', currentCost: 5600, projectedSavings: 2240, effort: 'low', description: 'Purchase 1-year reserved instance for production RDS' },
  { id: 'r5', resource: 'old-log-buckets', type: 'unused', currentCost: 340, projectedSavings: 340, effort: 'low', description: 'S3 buckets with no access in 90 days' },
];

export default function CostManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'budgets' | 'anomalies' | 'optimize'>('overview');
  const [dateRange, setDateRange] = useState('month');
  const [expandedBudget, setExpandedBudget] = useState<string | null>('b1');

  const totalCost = COST_BY_SERVICE.reduce((sum, s) => sum + s.cost, 0);
  const previousTotal = COST_BY_SERVICE.reduce((sum, s) => sum + s.previousCost, 0);
  const costChange = ((totalCost - previousTotal) / previousTotal * 100).toFixed(1);
  const totalSavings = RECOMMENDATIONS.reduce((sum, r) => sum + r.projectedSavings, 0);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="overview-summary">
        <div className="summary-card total">
          <div className="card-header">
            <DollarSign size={20} />
            <span>Current Month</span>
          </div>
          <div className="card-value">{formatCurrency(totalCost)}</div>
          <div className={`card-change ${Number(costChange) > 0 ? 'up' : 'down'}`}>
            {Number(costChange) > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(Number(costChange))}% vs last month
          </div>
        </div>

        <div className="summary-card forecast">
          <div className="card-header">
            <TrendingUp size={20} />
            <span>Forecasted</span>
          </div>
          <div className="card-value">{formatCurrency(52400)}</div>
          <div className="card-sublabel">End of month projection</div>
        </div>

        <div className="summary-card budget">
          <div className="card-header">
            <Target size={20} />
            <span>Budget Status</span>
          </div>
          <div className="card-value">{formatCurrency(85000)}</div>
          <div className="budget-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(totalCost / 85000) * 100}%` }} />
            </div>
            <span>{((totalCost / 85000) * 100).toFixed(0)}% used</span>
          </div>
        </div>

        <div className="summary-card savings">
          <div className="card-header">
            <Wallet size={20} />
            <span>Potential Savings</span>
          </div>
          <div className="card-value savings-value">{formatCurrency(totalSavings)}</div>
          <div className="card-sublabel">{RECOMMENDATIONS.length} recommendations</div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card cost-trend">
          <div className="card-title">
            <BarChart3 size={18} />
            <h4>Cost Trend (6 Months)</h4>
          </div>
          <div className="trend-chart">
            {[32400, 35600, 38200, 41500, 40800, 43860].map((cost, idx) => (
              <div key={idx} className="trend-bar-container">
                <div
                  className="trend-bar"
                  style={{ height: `${(cost / 50000) * 100}%` }}
                />
                <span className="trend-label">{['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card cost-distribution">
          <div className="card-title">
            <PieChart size={18} />
            <h4>Cost by Category</h4>
          </div>
          <div className="distribution-chart">
            <div className="pie-visual">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="75 25" strokeDashoffset="25" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" strokeDasharray="50 50" strokeDashoffset="-50" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="30 70" strokeDashoffset="-100" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="20 80" strokeDashoffset="-130" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray="25 75" strokeDashoffset="-150" />
              </svg>
            </div>
            <div className="distribution-legend">
              {[
                { label: 'Compute', value: 35, color: '#3b82f6' },
                { label: 'Database', value: 25, color: '#8b5cf6' },
                { label: 'AI/ML', value: 15, color: '#10b981' },
                { label: 'Storage', value: 12, color: '#f59e0b' },
                { label: 'Other', value: 13, color: '#ef4444' },
              ].map((item) => (
                <div key={item.label} className="legend-item">
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-label">{item.label}</span>
                  <span className="legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overview-card top-services">
          <div className="card-title">
            <Cloud size={18} />
            <h4>Top Services</h4>
          </div>
          <div className="services-list">
            {COST_BY_SERVICE.slice(0, 5).map((service) => (
              <div key={service.service} className="service-item">
                <div className="service-info">
                  <span className="service-name">{service.service}</span>
                  <span className="service-provider">{service.provider}</span>
                </div>
                <div className="service-cost">
                  <span className="cost-value">{formatCurrency(service.cost)}</span>
                  <span className={`cost-trend ${service.trend}`}>
                    {service.trend === 'up' ? <ArrowUp size={10} /> : service.trend === 'down' ? <ArrowDown size={10} /> : null}
                    {service.trend !== 'stable' && `${Math.abs(((service.cost - service.previousCost) / service.previousCost) * 100).toFixed(0)}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card active-alerts">
          <div className="card-title">
            <Bell size={18} />
            <h4>Active Alerts</h4>
          </div>
          <div className="alerts-list">
            {COST_ANOMALIES.filter(a => a.status === 'active').map((anomaly) => (
              <div key={anomaly.id} className="alert-item">
                <AlertTriangle size={16} className="alert-icon" />
                <div className="alert-content">
                  <span className="alert-service">{anomaly.service}</span>
                  <span className="alert-desc">{anomaly.description}</span>
                </div>
                <span className="alert-impact">+{formatCurrency(anomaly.impact)}</span>
              </div>
            ))}
            {COST_ANOMALIES.filter(a => a.status === 'active').length === 0 && (
              <div className="no-alerts">
                <CheckCircle size={24} />
                <span>No active cost alerts</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBreakdown = () => (
    <div className="breakdown-content">
      <div className="breakdown-toolbar">
        <div className="filter-group">
          <select>
            <option>All Providers</option>
            <option>AWS</option>
            <option>GCP</option>
            <option>Azure</option>
            <option>Other</option>
          </select>
          <select>
            <option>All Categories</option>
            <option>Compute</option>
            <option>Database</option>
            <option>Storage</option>
            <option>Network</option>
            <option>AI/ML</option>
          </select>
        </div>
        <button className="btn-outline">
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="breakdown-table">
        <div className="table-header">
          <span>Service</span>
          <span>Provider</span>
          <span>Category</span>
          <span>Current Cost</span>
          <span>vs Previous</span>
          <span>% of Total</span>
        </div>
        {COST_BY_SERVICE.map((service) => (
          <div key={service.service} className="table-row">
            <div className="service-cell">
              <Cloud size={14} />
              <span>{service.service}</span>
            </div>
            <div className="provider-cell">{service.provider}</div>
            <div className="category-cell">
              <span className={`category-badge ${service.category.toLowerCase()}`}>
                {service.category}
              </span>
            </div>
            <div className="cost-cell">{formatCurrency(service.cost)}</div>
            <div className={`trend-cell ${service.trend}`}>
              {service.trend === 'up' && <ArrowUp size={12} />}
              {service.trend === 'down' && <ArrowDown size={12} />}
              {service.trend !== 'stable' && (
                <span>
                  {service.trend === 'up' ? '+' : '-'}
                  {formatCurrency(Math.abs(service.cost - service.previousCost))}
                </span>
              )}
              {service.trend === 'stable' && <span>-</span>}
            </div>
            <div className="percentage-cell">
              <div className="pct-bar">
                <div className="pct-fill" style={{ width: `${service.percentage * 3}%` }} />
              </div>
              <span>{service.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="breakdown-footer">
        <div className="total-row">
          <span>Total</span>
          <span className="total-value">{formatCurrency(totalCost)}</span>
        </div>
      </div>
    </div>
  );

  const renderBudgets = () => (
    <div className="budgets-content">
      <div className="budgets-toolbar">
        <h3>Budget Tracking</h3>
        <button className="btn-primary">
          <Plus size={14} />
          Create Budget
        </button>
      </div>

      <div className="budgets-list">
        {BUDGETS.map((budget) => {
          const percentUsed = (budget.spent / budget.amount) * 100;
          const forecastPercent = (budget.forecast / budget.amount) * 100;
          const status = percentUsed > 100 ? 'over' : forecastPercent > 100 ? 'warning' : 'on-track';

          return (
            <div key={budget.id} className={`budget-card ${status}`}>
              <div
                className="budget-header"
                onClick={() => setExpandedBudget(expandedBudget === budget.id ? null : budget.id)}
              >
                <div className="budget-info">
                  <button className="expand-btn">
                    {expandedBudget === budget.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div>
                    <h4>{budget.name}</h4>
                    <span className="budget-meta">{budget.type} • {budget.owner}</span>
                  </div>
                </div>
                <div className="budget-status">
                  <span className={`status-badge ${status}`}>
                    {status === 'over' ? 'Over Budget' : status === 'warning' ? 'At Risk' : 'On Track'}
                  </span>
                </div>
              </div>

              <div className="budget-progress-section">
                <div className="progress-header">
                  <span>Spent: {formatCurrency(budget.spent)}</span>
                  <span>Budget: {formatCurrency(budget.amount)}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${status}`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                  <div
                    className="forecast-marker"
                    style={{ left: `${Math.min(forecastPercent, 100)}%` }}
                    title={`Forecast: ${formatCurrency(budget.forecast)}`}
                  />
                </div>
                <div className="progress-footer">
                  <span>{percentUsed.toFixed(0)}% used</span>
                  <span>Forecast: {formatCurrency(budget.forecast)}</span>
                </div>
              </div>

              {expandedBudget === budget.id && (
                <div className="budget-details">
                  <div className="detail-section">
                    <h5>Alert Thresholds</h5>
                    <div className="thresholds">
                      {budget.alerts.map((threshold) => (
                        <div
                          key={threshold}
                          className={`threshold-item ${percentUsed >= threshold ? 'triggered' : ''}`}
                        >
                          <Bell size={12} />
                          <span>{threshold}%</span>
                          {percentUsed >= threshold && <CheckCircle size={12} className="triggered-icon" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="budget-actions">
                    <button className="btn-outline small">
                      <Settings size={12} />
                      Edit Budget
                    </button>
                    <button className="btn-outline small">
                      <Eye size={12} />
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="team-budgets">
        <h3>Cost by Team</h3>
        <div className="team-table">
          <div className="table-header">
            <span>Team</span>
            <span>Budget</span>
            <span>Spent</span>
            <span>Forecast</span>
            <span>Projects</span>
            <span>Status</span>
          </div>
          {COST_BY_TEAM.map((team) => (
            <div key={team.team} className="table-row">
              <div className="team-cell">
                <Building size={14} />
                <span>{team.team}</span>
              </div>
              <div className="budget-cell">{formatCurrency(team.budget)}</div>
              <div className="spent-cell">{formatCurrency(team.spent)}</div>
              <div className={`forecast-cell ${team.forecast > team.budget ? 'over' : ''}`}>
                {formatCurrency(team.forecast)}
              </div>
              <div className="projects-cell">{team.projects}</div>
              <div className={`status-cell ${team.status}`}>
                <span className="status-dot" />
                {team.status.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnomalies = () => (
    <div className="anomalies-content">
      <div className="anomalies-summary">
        <div className="anomaly-stat active">
          <AlertTriangle size={20} />
          <div>
            <span className="stat-value">{COST_ANOMALIES.filter(a => a.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="anomaly-stat acknowledged">
          <Eye size={20} />
          <div>
            <span className="stat-value">{COST_ANOMALIES.filter(a => a.status === 'acknowledged').length}</span>
            <span className="stat-label">Acknowledged</span>
          </div>
        </div>
        <div className="anomaly-stat resolved">
          <CheckCircle size={20} />
          <div>
            <span className="stat-value">{COST_ANOMALIES.filter(a => a.status === 'resolved').length}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
        <div className="anomaly-stat impact">
          <DollarSign size={20} />
          <div>
            <span className="stat-value">{formatCurrency(COST_ANOMALIES.reduce((sum, a) => sum + a.impact, 0))}</span>
            <span className="stat-label">Total Impact</span>
          </div>
        </div>
      </div>

      <div className="anomalies-list">
        {COST_ANOMALIES.map((anomaly) => (
          <div key={anomaly.id} className={`anomaly-card ${anomaly.status}`}>
            <div className="anomaly-icon">
              {anomaly.type === 'spike' && <TrendingUp size={20} />}
              {anomaly.type === 'unusual' && <AlertTriangle size={20} />}
              {anomaly.type === 'new-resource' && <Server size={20} />}
            </div>
            <div className="anomaly-content">
              <div className="anomaly-header">
                <h4>{anomaly.service}</h4>
                <span className={`type-badge ${anomaly.type}`}>{anomaly.type.replace('-', ' ')}</span>
              </div>
              <p className="anomaly-desc">{anomaly.description}</p>
              <div className="anomaly-meta">
                <span className="detected">Detected {anomaly.detectedAt}</span>
                <span className="impact">Impact: +{formatCurrency(anomaly.impact)}</span>
              </div>
            </div>
            <div className="anomaly-actions">
              {anomaly.status === 'active' && (
                <>
                  <button className="btn-outline small">Acknowledge</button>
                  <button className="btn-primary small">Investigate</button>
                </>
              )}
              {anomaly.status === 'acknowledged' && (
                <button className="btn-outline small">Mark Resolved</button>
              )}
              {anomaly.status === 'resolved' && (
                <span className="resolved-badge">
                  <CheckCircle size={14} />
                  Resolved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOptimize = () => (
    <div className="optimize-content">
      <div className="optimize-summary">
        <div className="savings-card">
          <Wallet size={24} />
          <div>
            <span className="label">Total Potential Savings</span>
            <span className="value">{formatCurrency(totalSavings)}</span>
            <span className="sublabel">/month</span>
          </div>
        </div>
        <div className="savings-breakdown">
          {[
            { type: 'right-size', label: 'Right-sizing', savings: 1260 },
            { type: 'unused', label: 'Unused Resources', savings: 1230 },
            { type: 'reserved', label: 'Reserved Instances', savings: 2240 },
            { type: 'spot', label: 'Spot Instances', savings: 2450 },
          ].map((item) => (
            <div key={item.type} className={`breakdown-item ${item.type}`}>
              <span className="breakdown-label">{item.label}</span>
              <span className="breakdown-value">{formatCurrency(item.savings)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="recommendations-list">
        {RECOMMENDATIONS.map((rec) => (
          <div key={rec.id} className={`recommendation-card ${rec.type}`}>
            <div className="rec-header">
              <div className={`rec-type-badge ${rec.type}`}>
                {rec.type === 'right-size' && <Cpu size={14} />}
                {rec.type === 'unused' && <HardDrive size={14} />}
                {rec.type === 'reserved' && <Tag size={14} />}
                {rec.type === 'spot' && <Zap size={14} />}
                {rec.type.replace('-', ' ')}
              </div>
              <span className={`effort-badge ${rec.effort}`}>{rec.effort} effort</span>
            </div>

            <h4 className="rec-resource">{rec.resource}</h4>
            <p className="rec-description">{rec.description}</p>

            <div className="rec-metrics">
              <div className="metric">
                <span className="metric-label">Current Cost</span>
                <span className="metric-value">{formatCurrency(rec.currentCost)}/mo</span>
              </div>
              <div className="metric savings">
                <span className="metric-label">Projected Savings</span>
                <span className="metric-value">{formatCurrency(rec.projectedSavings)}/mo</span>
              </div>
            </div>

            <div className="rec-actions">
              <button className="btn-outline small">View Details</button>
              <button className="btn-primary small">Apply Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="cost-management">
      <header className="cm__header">
        <div className="cm__title-section">
          <div className="cm__icon">
            <DollarSign size={28} />
          </div>
          <div>
            <h1>Cost Management Center</h1>
            <p>Cloud cost visibility, optimization, and governance</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="date-selector">
            <Calendar size={16} />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="week">Last 7 days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button className="btn-outline">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </header>

      <nav className="cm__tabs">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'breakdown', label: 'Cost Breakdown', icon: BarChart3 },
          { id: 'budgets', label: 'Budgets', icon: Target },
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, count: COST_ANOMALIES.filter(a => a.status === 'active').length },
          { id: 'optimize', label: 'Optimize', icon: Wallet },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tab-badge warning">{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="cm__content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'breakdown' && renderBreakdown()}
        {activeTab === 'budgets' && renderBudgets()}
        {activeTab === 'anomalies' && renderAnomalies()}
        {activeTab === 'optimize' && renderOptimize()}
      </main>
    </div>
  );
}

function Plus(props: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
