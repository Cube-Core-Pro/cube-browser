'use client';

import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Bell,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Globe,
  Database,
  Server,
  Wifi,
  ArrowRight,
  DollarSign,
  Users,
  Award,
  FileText,
  Settings
} from 'lucide-react';
import './sla.css';

interface SLADefinition {
  id: string;
  name: string;
  service: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  period: string;
  status: 'met' | 'at_risk' | 'breached';
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  credits: number;
  creditsUsed: number;
  lastUpdated: string;
  history: { date: string; value: number }[];
}

interface SLABreach {
  id: string;
  slaId: string;
  slaName: string;
  service: string;
  occurredAt: string;
  duration: string;
  impact: string;
  rootCause: string;
  creditsIssued: number;
  status: 'open' | 'acknowledged' | 'resolved' | 'credited';
}

interface ServiceTier {
  id: string;
  name: string;
  description: string;
  monthlyFee: number;
  uptimeTarget: number;
  responseTime: string;
  supportLevel: string;
  features: string[];
  customers: number;
}

interface SLAReport {
  id: string;
  period: string;
  generatedAt: string;
  overallCompliance: number;
  totalSLAs: number;
  metSLAs: number;
  atRiskSLAs: number;
  breachedSLAs: number;
  creditsIssued: number;
  status: 'generated' | 'reviewed' | 'sent';
}

const SLA_DEFINITIONS: SLADefinition[] = [
  {
    id: 'sla-001',
    name: 'API Availability',
    service: 'Core API',
    metric: 'Uptime',
    target: 99.99,
    current: 99.97,
    unit: '%',
    period: 'Monthly',
    status: 'at_risk',
    trend: 'down',
    trendValue: 0.02,
    credits: 10000,
    creditsUsed: 2500,
    lastUpdated: '2025-01-29T14:30:00Z',
    history: [
      { date: '2025-01-23', value: 99.99 },
      { date: '2025-01-24', value: 99.98 },
      { date: '2025-01-25', value: 99.99 },
      { date: '2025-01-26', value: 99.96 },
      { date: '2025-01-27', value: 99.95 },
      { date: '2025-01-28', value: 99.97 },
      { date: '2025-01-29', value: 99.97 }
    ]
  },
  {
    id: 'sla-002',
    name: 'Response Time P99',
    service: 'Core API',
    metric: 'Latency',
    target: 200,
    current: 145,
    unit: 'ms',
    period: 'Monthly',
    status: 'met',
    trend: 'down',
    trendValue: 15,
    credits: 5000,
    creditsUsed: 0,
    lastUpdated: '2025-01-29T14:30:00Z',
    history: [
      { date: '2025-01-23', value: 180 },
      { date: '2025-01-24', value: 165 },
      { date: '2025-01-25', value: 155 },
      { date: '2025-01-26', value: 150 },
      { date: '2025-01-27', value: 148 },
      { date: '2025-01-28', value: 142 },
      { date: '2025-01-29', value: 145 }
    ]
  },
  {
    id: 'sla-003',
    name: 'Database Availability',
    service: 'PostgreSQL Cluster',
    metric: 'Uptime',
    target: 99.95,
    current: 99.99,
    unit: '%',
    period: 'Monthly',
    status: 'met',
    trend: 'up',
    trendValue: 0.01,
    credits: 8000,
    creditsUsed: 0,
    lastUpdated: '2025-01-29T14:30:00Z',
    history: [
      { date: '2025-01-23', value: 99.98 },
      { date: '2025-01-24', value: 99.99 },
      { date: '2025-01-25', value: 99.99 },
      { date: '2025-01-26', value: 99.98 },
      { date: '2025-01-27', value: 99.99 },
      { date: '2025-01-28', value: 99.99 },
      { date: '2025-01-29', value: 99.99 }
    ]
  },
  {
    id: 'sla-004',
    name: 'CDN Availability',
    service: 'Global CDN',
    metric: 'Uptime',
    target: 99.9,
    current: 99.85,
    unit: '%',
    period: 'Monthly',
    status: 'breached',
    trend: 'down',
    trendValue: 0.1,
    credits: 6000,
    creditsUsed: 4500,
    lastUpdated: '2025-01-29T14:30:00Z',
    history: [
      { date: '2025-01-23', value: 99.92 },
      { date: '2025-01-24', value: 99.88 },
      { date: '2025-01-25', value: 99.82 },
      { date: '2025-01-26', value: 99.80 },
      { date: '2025-01-27', value: 99.83 },
      { date: '2025-01-28', value: 99.85 },
      { date: '2025-01-29', value: 99.85 }
    ]
  },
  {
    id: 'sla-005',
    name: 'Support Response',
    service: 'Customer Support',
    metric: 'First Response',
    target: 15,
    current: 8,
    unit: 'min',
    period: 'Monthly',
    status: 'met',
    trend: 'down',
    trendValue: 3,
    credits: 3000,
    creditsUsed: 0,
    lastUpdated: '2025-01-29T14:30:00Z',
    history: [
      { date: '2025-01-23', value: 12 },
      { date: '2025-01-24', value: 11 },
      { date: '2025-01-25', value: 10 },
      { date: '2025-01-26', value: 9 },
      { date: '2025-01-27', value: 9 },
      { date: '2025-01-28', value: 8 },
      { date: '2025-01-29', value: 8 }
    ]
  },
  {
    id: 'sla-006',
    name: 'Data Processing',
    service: 'ETL Pipeline',
    metric: 'Throughput',
    target: 1000000,
    current: 1250000,
    unit: 'records/hr',
    period: 'Daily',
    status: 'met',
    trend: 'up',
    trendValue: 50000,
    credits: 4000,
    creditsUsed: 0,
    lastUpdated: '2025-01-29T14:30:00Z',
    history: [
      { date: '2025-01-23', value: 1100000 },
      { date: '2025-01-24', value: 1150000 },
      { date: '2025-01-25', value: 1180000 },
      { date: '2025-01-26', value: 1200000 },
      { date: '2025-01-27', value: 1220000 },
      { date: '2025-01-28', value: 1240000 },
      { date: '2025-01-29', value: 1250000 }
    ]
  }
];

const SLA_BREACHES: SLABreach[] = [
  {
    id: 'breach-001',
    slaId: 'sla-004',
    slaName: 'CDN Availability',
    service: 'Global CDN',
    occurredAt: '2025-01-25T03:15:00Z',
    duration: '47 minutes',
    impact: 'Asia-Pacific region affected, 15% traffic impacted',
    rootCause: 'BGP route leak from upstream provider',
    creditsIssued: 4500,
    status: 'credited'
  },
  {
    id: 'breach-002',
    slaId: 'sla-001',
    slaName: 'API Availability',
    service: 'Core API',
    occurredAt: '2025-01-27T08:22:00Z',
    duration: '12 minutes',
    impact: 'Authentication service degraded, 8% requests failed',
    rootCause: 'Memory leak in auth service container',
    creditsIssued: 2500,
    status: 'credited'
  },
  {
    id: 'breach-003',
    slaId: 'sla-001',
    slaName: 'API Availability',
    service: 'Core API',
    occurredAt: '2025-01-29T11:45:00Z',
    duration: '3 minutes',
    impact: 'Payment processing delayed',
    rootCause: 'Under investigation',
    creditsIssued: 0,
    status: 'open'
  }
];

const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'tier-basic',
    name: 'Basic',
    description: 'For small teams and startups',
    monthlyFee: 99,
    uptimeTarget: 99.5,
    responseTime: '24 hours',
    supportLevel: 'Email',
    features: ['Standard API', 'Community Support', '100GB Storage'],
    customers: 1250
  },
  {
    id: 'tier-pro',
    name: 'Professional',
    description: 'For growing businesses',
    monthlyFee: 499,
    uptimeTarget: 99.9,
    responseTime: '4 hours',
    supportLevel: 'Email + Chat',
    features: ['Advanced API', 'Priority Support', '1TB Storage', 'Analytics'],
    customers: 580
  },
  {
    id: 'tier-enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyFee: 2499,
    uptimeTarget: 99.99,
    responseTime: '15 minutes',
    supportLevel: '24/7 Phone',
    features: ['Full API', 'Dedicated Support', 'Unlimited Storage', 'Custom SLAs', 'SSO'],
    customers: 145
  },
  {
    id: 'tier-elite',
    name: 'Elite',
    description: 'Mission-critical deployments',
    monthlyFee: 9999,
    uptimeTarget: 99.999,
    responseTime: 'Immediate',
    supportLevel: 'Dedicated TAM',
    features: ['Full API', 'White-glove Support', 'Unlimited Storage', 'Custom Everything', 'On-premise Option'],
    customers: 28
  }
];

const SLA_REPORTS: SLAReport[] = [
  {
    id: 'report-001',
    period: 'January 2025',
    generatedAt: '2025-01-29T00:00:00Z',
    overallCompliance: 94.2,
    totalSLAs: 6,
    metSLAs: 4,
    atRiskSLAs: 1,
    breachedSLAs: 1,
    creditsIssued: 7000,
    status: 'generated'
  },
  {
    id: 'report-002',
    period: 'December 2024',
    generatedAt: '2025-01-01T00:00:00Z',
    overallCompliance: 98.5,
    totalSLAs: 6,
    metSLAs: 6,
    atRiskSLAs: 0,
    breachedSLAs: 0,
    creditsIssued: 0,
    status: 'sent'
  },
  {
    id: 'report-003',
    period: 'November 2024',
    generatedAt: '2024-12-01T00:00:00Z',
    overallCompliance: 97.8,
    totalSLAs: 6,
    metSLAs: 5,
    atRiskSLAs: 1,
    breachedSLAs: 0,
    creditsIssued: 0,
    status: 'sent'
  },
  {
    id: 'report-004',
    period: 'October 2024',
    generatedAt: '2024-11-01T00:00:00Z',
    overallCompliance: 99.1,
    totalSLAs: 6,
    metSLAs: 6,
    atRiskSLAs: 0,
    breachedSLAs: 0,
    creditsIssued: 0,
    status: 'sent'
  }
];

const STATUS_CONFIG = {
  met: { label: 'Met', color: '#22c55e', icon: CheckCircle },
  at_risk: { label: 'At Risk', color: '#f59e0b', icon: AlertTriangle },
  breached: { label: 'Breached', color: '#ef4444', icon: XCircle }
};

const BREACH_STATUS_CONFIG = {
  open: { label: 'Open', color: '#ef4444' },
  acknowledged: { label: 'Acknowledged', color: '#f59e0b' },
  resolved: { label: 'Resolved', color: '#3b82f6' },
  credited: { label: 'Credited', color: '#22c55e' }
};

export default function SLAManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'slas' | 'breaches' | 'tiers' | 'reports'>('overview');
  const [expandedSLA, setExpandedSLA] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getComplianceScore = (): number => {
    const met = SLA_DEFINITIONS.filter(s => s.status === 'met').length;
    return Math.round((met / SLA_DEFINITIONS.length) * 100);
  };

  const getTotalCredits = (): number => {
    return SLA_DEFINITIONS.reduce((sum, sla) => sum + sla.creditsUsed, 0);
  };

  const filteredSLAs = statusFilter === 'all' 
    ? SLA_DEFINITIONS 
    : SLA_DEFINITIONS.filter(s => s.status === statusFilter);

  const activeSLAs = SLA_DEFINITIONS.filter(s => s.status === 'met').length;
  const atRiskSLAs = SLA_DEFINITIONS.filter(s => s.status === 'at_risk').length;
  const breachedSLAs = SLA_DEFINITIONS.filter(s => s.status === 'breached').length;

  const renderSparkline = (history: { date: string; value: number }[], target: number, isLowerBetter: boolean): React.ReactNode => {
    const maxVal = Math.max(...history.map(h => h.value), target);
    const minVal = Math.min(...history.map(h => h.value), target * 0.9);
    const range = maxVal - minVal;
    
    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 100 - ((h.value - minVal) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    const targetY = 100 - ((target - minVal) / range) * 100;

    return (
      <svg className="sparkline" viewBox="0 0 100 50" preserveAspectRatio="none">
        <line 
          x1="0" y1={targetY} 
          x2="100" y2={targetY} 
          stroke="rgba(34, 197, 94, 0.3)" 
          strokeWidth="1" 
          strokeDasharray="4,2"
        />
        <polyline
          fill="none"
          stroke="var(--sla-primary)"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="sla-management">
      <div className="sla-management__header">
        <div className="sla-management__title-section">
          <div className="sla-management__icon">
            <Target size={28} />
          </div>
          <div>
            <h1>SLA Management</h1>
            <p>Monitor service level agreements and compliance metrics</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Calendar size={16} />
            This Month
          </button>
          <button className="btn-outline">
            <Download size={16} />
            Export
          </button>
          <button className="btn-primary">
            <Target size={16} />
            Create SLA
          </button>
        </div>
      </div>

      <div className="sla-management__stats">
        <div className="stat-card primary">
          <div className="stat-icon compliance">
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{getComplianceScore()}%</span>
            <span className="stat-label">Overall Compliance</span>
          </div>
          <div className="stat-trend down">
            <TrendingDown size={14} />
            <span>4.3%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon met">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{activeSLAs}</span>
            <span className="stat-label">SLAs Met</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon at-risk">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{atRiskSLAs}</span>
            <span className="stat-label">At Risk</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon breached">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{breachedSLAs}</span>
            <span className="stat-label">Breached</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon credits">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">${formatNumber(getTotalCredits())}</span>
            <span className="stat-label">Credits Issued</span>
          </div>
        </div>
      </div>

      <div className="sla-management__tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'slas' ? 'active' : ''}`}
          onClick={() => setActiveTab('slas')}
        >
          <Target size={16} />
          SLA Definitions
          <span className="tab-badge">{SLA_DEFINITIONS.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'breaches' ? 'active' : ''}`}
          onClick={() => setActiveTab('breaches')}
        >
          <AlertTriangle size={16} />
          Breaches
          {SLA_BREACHES.filter(b => b.status === 'open').length > 0 && (
            <span className="tab-badge warning">{SLA_BREACHES.filter(b => b.status === 'open').length}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          <Shield size={16} />
          Service Tiers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText size={16} />
          Reports
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="overview-grid">
            <div className="sla-summary-card">
              <h3>SLA Performance Summary</h3>
              <div className="summary-chart">
                <div className="donut-chart">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="12" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="12"
                      strokeDasharray={`${(activeSLAs / SLA_DEFINITIONS.length) * 251.2} 251.2`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="12"
                      strokeDasharray={`${(atRiskSLAs / SLA_DEFINITIONS.length) * 251.2} 251.2`}
                      strokeDashoffset={`-${(activeSLAs / SLA_DEFINITIONS.length) * 251.2}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <circle 
                      cx="50" cy="50" r="40" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="12"
                      strokeDasharray={`${(breachedSLAs / SLA_DEFINITIONS.length) * 251.2} 251.2`}
                      strokeDashoffset={`-${((activeSLAs + atRiskSLAs) / SLA_DEFINITIONS.length) * 251.2}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="donut-center">
                    <span className="donut-value">{SLA_DEFINITIONS.length}</span>
                    <span className="donut-label">Total SLAs</span>
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot met"></span>
                    <span className="legend-label">Met</span>
                    <span className="legend-value">{activeSLAs}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot at-risk"></span>
                    <span className="legend-label">At Risk</span>
                    <span className="legend-value">{atRiskSLAs}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot breached"></span>
                    <span className="legend-label">Breached</span>
                    <span className="legend-value">{breachedSLAs}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-metrics-card">
              <h3>Quick Metrics</h3>
              <div className="metrics-grid">
                {SLA_DEFINITIONS.slice(0, 4).map(sla => (
                  <div key={sla.id} className="metric-item">
                    <div className="metric-header">
                      <span className="metric-name">{sla.name}</span>
                      <span className={`metric-status ${sla.status}`}>
                        {STATUS_CONFIG[sla.status].label}
                      </span>
                    </div>
                    <div className="metric-value-row">
                      <span className="metric-current">{sla.current}{sla.unit}</span>
                      <span className="metric-target">/ {sla.target}{sla.unit}</span>
                    </div>
                    <div className="metric-bar">
                      <div 
                        className={`metric-fill ${sla.status}`}
                        style={{ width: `${Math.min((sla.current / sla.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="recent-breaches-section">
            <h3>Recent Breaches & Incidents</h3>
            <div className="breaches-table">
              <table>
                <thead>
                  <tr>
                    <th>SLA</th>
                    <th>Service</th>
                    <th>Occurred</th>
                    <th>Duration</th>
                    <th>Impact</th>
                    <th>Credits</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SLA_BREACHES.map(breach => (
                    <tr key={breach.id}>
                      <td className="sla-cell">{breach.slaName}</td>
                      <td>{breach.service}</td>
                      <td>{formatDate(breach.occurredAt)}</td>
                      <td>{breach.duration}</td>
                      <td className="impact-cell">{breach.impact}</td>
                      <td className="credits-cell">
                        {breach.creditsIssued > 0 ? `$${formatNumber(breach.creditsIssued)}` : '-'}
                      </td>
                      <td>
                        <span 
                          className="breach-status-badge"
                          style={{ 
                            backgroundColor: `${BREACH_STATUS_CONFIG[breach.status].color}20`,
                            color: BREACH_STATUS_CONFIG[breach.status].color
                          }}
                        >
                          {BREACH_STATUS_CONFIG[breach.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'slas' && (
        <div className="slas-section">
          <div className="section-filters">
            <div className="search-box">
              <Target size={16} />
              <input type="text" placeholder="Search SLAs..." />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="met">Met</option>
              <option value="at_risk">At Risk</option>
              <option value="breached">Breached</option>
            </select>
          </div>

          <div className="slas-list">
            {filteredSLAs.map(sla => {
              const StatusIcon = STATUS_CONFIG[sla.status].icon;
              return (
                <div 
                  key={sla.id} 
                  className={`sla-card ${sla.status}`}
                >
                  <div 
                    className="sla-header"
                    onClick={() => setExpandedSLA(expandedSLA === sla.id ? null : sla.id)}
                  >
                    <div className={`sla-status-icon ${sla.status}`}>
                      <StatusIcon size={20} />
                    </div>
                    <div className="sla-info">
                      <div className="sla-title-row">
                        <h4>{sla.name}</h4>
                        <span className="sla-service">{sla.service}</span>
                      </div>
                      <div className="sla-metric-row">
                        <span className="metric-label">{sla.metric}:</span>
                        <span className="metric-current">{sla.current}{sla.unit}</span>
                        <span className="metric-target">/ {sla.target}{sla.unit} target</span>
                        <span className={`trend-badge ${sla.trend}`}>
                          {sla.trend === 'up' ? <TrendingUp size={12} /> : sla.trend === 'down' ? <TrendingDown size={12} /> : null}
                          {sla.trendValue}{sla.unit}
                        </span>
                      </div>
                    </div>
                    <div className="sla-sparkline">
                      {renderSparkline(sla.history, sla.target, sla.metric === 'Latency')}
                    </div>
                    <div className={`sla-status-badge ${sla.status}`}>
                      {STATUS_CONFIG[sla.status].label}
                    </div>
                    <div className="sla-expand">
                      {expandedSLA === sla.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  
                  {expandedSLA === sla.id && (
                    <div className="sla-details">
                      <div className="details-grid">
                        <div className="detail-section">
                          <h5>SLA Details</h5>
                          <div className="detail-items">
                            <div className="detail-item">
                              <span className="detail-label">Measurement Period</span>
                              <span className="detail-value">{sla.period}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Last Updated</span>
                              <span className="detail-value">{formatDate(sla.lastUpdated)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Credit Pool</span>
                              <span className="detail-value">${formatNumber(sla.credits)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Credits Used</span>
                              <span className="detail-value credits-used">${formatNumber(sla.creditsUsed)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="detail-section">
                          <h5>7-Day History</h5>
                          <div className="history-chart">
                            <div className="history-bars">
                              {sla.history.map((h, i) => (
                                <div key={i} className="history-bar-container">
                                  <div 
                                    className={`history-bar ${h.value >= sla.target ? 'met' : 'missed'}`}
                                    style={{ height: `${(h.value / Math.max(...sla.history.map(x => x.value))) * 100}%` }}
                                  ></div>
                                  <span className="history-label">
                                    {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="sla-actions">
                        <button className="action-btn">
                          <Settings size={14} />
                          Configure
                        </button>
                        <button className="action-btn">
                          <Bell size={14} />
                          Alerts
                        </button>
                        <button className="action-btn">
                          <FileText size={14} />
                          View Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'breaches' && (
        <div className="breaches-section">
          <div className="breaches-header">
            <h3>SLA Breach History</h3>
            <div className="breach-filters">
              <select>
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="credited">Credited</option>
              </select>
            </div>
          </div>

          <div className="breaches-list">
            {SLA_BREACHES.map(breach => (
              <div key={breach.id} className={`breach-card ${breach.status}`}>
                <div className="breach-header">
                  <div className="breach-icon">
                    <XCircle size={20} />
                  </div>
                  <div className="breach-info">
                    <div className="breach-title-row">
                      <h4>{breach.slaName}</h4>
                      <span className="breach-service">{breach.service}</span>
                    </div>
                    <div className="breach-meta">
                      <span className="breach-time">
                        <Clock size={14} />
                        {formatDate(breach.occurredAt)}
                      </span>
                      <span className="breach-duration">
                        Duration: {breach.duration}
                      </span>
                    </div>
                  </div>
                  <span 
                    className="breach-status-badge"
                    style={{ 
                      backgroundColor: `${BREACH_STATUS_CONFIG[breach.status].color}20`,
                      color: BREACH_STATUS_CONFIG[breach.status].color
                    }}
                  >
                    {BREACH_STATUS_CONFIG[breach.status].label}
                  </span>
                </div>
                <div className="breach-details">
                  <div className="detail-row">
                    <span className="detail-label">Impact:</span>
                    <span className="detail-value">{breach.impact}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Root Cause:</span>
                    <span className="detail-value">{breach.rootCause}</span>
                  </div>
                  {breach.creditsIssued > 0 && (
                    <div className="detail-row credits">
                      <span className="detail-label">Credits Issued:</span>
                      <span className="detail-value">${formatNumber(breach.creditsIssued)}</span>
                    </div>
                  )}
                </div>
                {breach.status === 'open' && (
                  <div className="breach-actions">
                    <button className="action-btn primary">
                      <CheckCircle size={14} />
                      Acknowledge
                    </button>
                    <button className="action-btn">
                      <FileText size={14} />
                      Create Postmortem
                    </button>
                    <button className="action-btn">
                      <DollarSign size={14} />
                      Issue Credits
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tiers' && (
        <div className="tiers-section">
          <div className="tiers-header">
            <h3>Service Level Tiers</h3>
            <p>Define and manage SLA tiers for different customer segments</p>
          </div>

          <div className="tiers-grid">
            {SERVICE_TIERS.map(tier => (
              <div key={tier.id} className={`tier-card ${tier.id}`}>
                <div className="tier-header">
                  <h4>{tier.name}</h4>
                  <span className="tier-price">${formatNumber(tier.monthlyFee)}<span>/mo</span></span>
                </div>
                <p className="tier-description">{tier.description}</p>
                
                <div className="tier-sla">
                  <div className="sla-metric">
                    <Shield size={16} />
                    <span className="sla-label">Uptime Target</span>
                    <span className="sla-value">{tier.uptimeTarget}%</span>
                  </div>
                  <div className="sla-metric">
                    <Zap size={16} />
                    <span className="sla-label">Response Time</span>
                    <span className="sla-value">{tier.responseTime}</span>
                  </div>
                  <div className="sla-metric">
                    <Users size={16} />
                    <span className="sla-label">Support Level</span>
                    <span className="sla-value">{tier.supportLevel}</span>
                  </div>
                </div>

                <div className="tier-features">
                  <h5>Features</h5>
                  <ul>
                    {tier.features.map((feature, i) => (
                      <li key={i}>
                        <CheckCircle size={14} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tier-stats">
                  <div className="tier-customers">
                    <Users size={14} />
                    <span>{tier.customers} customers</span>
                  </div>
                </div>

                <button className="tier-edit-btn">
                  <Settings size={14} />
                  Configure Tier
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="reports-section">
          <div className="reports-header">
            <h3>SLA Compliance Reports</h3>
            <button className="btn-primary">
              <FileText size={16} />
              Generate Report
            </button>
          </div>

          <div className="reports-table">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Generated</th>
                  <th>Compliance</th>
                  <th>Met</th>
                  <th>At Risk</th>
                  <th>Breached</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {SLA_REPORTS.map(report => (
                  <tr key={report.id}>
                    <td className="period-cell">{report.period}</td>
                    <td>{formatDate(report.generatedAt)}</td>
                    <td>
                      <span className={`compliance-badge ${report.overallCompliance >= 95 ? 'good' : report.overallCompliance >= 90 ? 'warning' : 'bad'}`}>
                        {report.overallCompliance}%
                      </span>
                    </td>
                    <td className="met-cell">{report.metSLAs}</td>
                    <td className="risk-cell">{report.atRiskSLAs}</td>
                    <td className="breached-cell">{report.breachedSLAs}</td>
                    <td className="credits-cell">
                      {report.creditsIssued > 0 ? `$${formatNumber(report.creditsIssued)}` : '-'}
                    </td>
                    <td>
                      <span className={`report-status ${report.status}`}>
                        {report.status === 'generated' ? 'Generated' : report.status === 'reviewed' ? 'Reviewed' : 'Sent'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn" title="Download">
                        <Download size={14} />
                      </button>
                      <button className="icon-btn" title="Send">
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
