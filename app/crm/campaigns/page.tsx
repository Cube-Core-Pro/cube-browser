'use client';

import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Users,
  Mail,
  Target,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Edit,
  Copy,
  Trash2,
  Eye,
  Send,
  MousePointer,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Zap,
  Globe,
  MessageSquare,
  Phone,
  Share2,
  Layers,
  RefreshCw,
  Settings,
  ChevronRight,
  AlertCircle,
  Star
} from 'lucide-react';
import './campaigns.css';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ads' | 'sms' | 'multichannel' | 'event';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  channel: string[];
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  audience: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  owner: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
}

interface CampaignMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  enrolled: number;
  completed: number;
  conversionRate: number;
}

interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  variants: { name: string; traffic: number; conversions: number }[];
  status: 'running' | 'completed' | 'draft';
  winner?: string;
  confidence: number;
}

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'email' | 'social' | 'ads' | 'automations' | 'ab-tests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const campaigns: Campaign[] = [
    {
      id: 'camp-001',
      name: 'Q1 Product Launch',
      type: 'multichannel',
      status: 'active',
      channel: ['email', 'social', 'ads'],
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      budget: 50000,
      spent: 32450,
      audience: 125000,
      reach: 98500,
      impressions: 450000,
      clicks: 18750,
      conversions: 2340,
      revenue: 187200,
      owner: 'Sarah Johnson',
      tags: ['product', 'launch', 'Q1'],
      priority: 'high'
    },
    {
      id: 'camp-002',
      name: 'Customer Retention Program',
      type: 'email',
      status: 'active',
      channel: ['email'],
      startDate: '2026-01-05',
      endDate: '2026-06-30',
      budget: 15000,
      spent: 4200,
      audience: 45000,
      reach: 42300,
      impressions: 85000,
      clicks: 12600,
      conversions: 890,
      revenue: 53400,
      owner: 'Mike Chen',
      tags: ['retention', 'loyalty'],
      priority: 'high'
    },
    {
      id: 'camp-003',
      name: 'Social Media Awareness',
      type: 'social',
      status: 'active',
      channel: ['instagram', 'linkedin', 'twitter'],
      startDate: '2026-01-10',
      endDate: '2026-04-10',
      budget: 25000,
      spent: 8900,
      audience: 500000,
      reach: 320000,
      impressions: 1250000,
      clicks: 45000,
      conversions: 1200,
      revenue: 72000,
      owner: 'Emily Davis',
      tags: ['brand', 'awareness', 'social'],
      priority: 'medium'
    },
    {
      id: 'camp-004',
      name: 'PPC Lead Generation',
      type: 'ads',
      status: 'paused',
      channel: ['google', 'linkedin'],
      startDate: '2025-12-01',
      endDate: '2026-02-28',
      budget: 35000,
      spent: 28700,
      audience: 200000,
      reach: 156000,
      impressions: 890000,
      clicks: 32400,
      conversions: 1850,
      revenue: 148000,
      owner: 'James Wilson',
      tags: ['ppc', 'leads', 'B2B'],
      priority: 'high'
    },
    {
      id: 'camp-005',
      name: 'Holiday Special Offers',
      type: 'multichannel',
      status: 'completed',
      channel: ['email', 'sms', 'social'],
      startDate: '2025-11-15',
      endDate: '2025-12-31',
      budget: 40000,
      spent: 38500,
      audience: 180000,
      reach: 165000,
      impressions: 720000,
      clicks: 54000,
      conversions: 4500,
      revenue: 315000,
      owner: 'Lisa Brown',
      tags: ['holiday', 'promotion', 'seasonal'],
      priority: 'high'
    },
    {
      id: 'camp-006',
      name: 'Webinar Registration Drive',
      type: 'email',
      status: 'scheduled',
      channel: ['email', 'linkedin'],
      startDate: '2026-01-20',
      endDate: '2026-02-15',
      budget: 8000,
      spent: 0,
      audience: 35000,
      reach: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      owner: 'David Martinez',
      tags: ['webinar', 'education', 'leads'],
      priority: 'medium'
    },
    {
      id: 'camp-007',
      name: 'Re-engagement Campaign',
      type: 'email',
      status: 'draft',
      channel: ['email'],
      startDate: '',
      endDate: '',
      budget: 5000,
      spent: 0,
      audience: 28000,
      reach: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      owner: 'Anna Kim',
      tags: ['re-engagement', 'win-back'],
      priority: 'low'
    }
  ];

  const automations: Automation[] = [
    {
      id: 'auto-001',
      name: 'Welcome Series',
      trigger: 'New signup',
      status: 'active',
      enrolled: 12500,
      completed: 9800,
      conversionRate: 34.5
    },
    {
      id: 'auto-002',
      name: 'Abandoned Cart Recovery',
      trigger: 'Cart abandoned',
      status: 'active',
      enrolled: 8400,
      completed: 6200,
      conversionRate: 28.3
    },
    {
      id: 'auto-003',
      name: 'Post-Purchase Follow-up',
      trigger: 'Order completed',
      status: 'active',
      enrolled: 15600,
      completed: 14200,
      conversionRate: 45.2
    },
    {
      id: 'auto-004',
      name: 'Birthday Rewards',
      trigger: 'Birthday approaching',
      status: 'active',
      enrolled: 3200,
      completed: 2800,
      conversionRate: 52.1
    },
    {
      id: 'auto-005',
      name: 'Inactivity Re-engagement',
      trigger: '30 days inactive',
      status: 'paused',
      enrolled: 5600,
      completed: 2100,
      conversionRate: 12.8
    }
  ];

  const abTests: ABTest[] = [
    {
      id: 'ab-001',
      campaignId: 'camp-001',
      name: 'Subject Line Test - Q1 Launch',
      variants: [
        { name: 'Variant A: Urgency', traffic: 50, conversions: 245 },
        { name: 'Variant B: Benefit', traffic: 50, conversions: 312 }
      ],
      status: 'completed',
      winner: 'Variant B: Benefit',
      confidence: 95.2
    },
    {
      id: 'ab-002',
      campaignId: 'camp-002',
      name: 'CTA Button Color',
      variants: [
        { name: 'Green CTA', traffic: 33, conversions: 89 },
        { name: 'Blue CTA', traffic: 33, conversions: 102 },
        { name: 'Orange CTA', traffic: 34, conversions: 78 }
      ],
      status: 'running',
      confidence: 78.5
    },
    {
      id: 'ab-003',
      campaignId: 'camp-003',
      name: 'Ad Creative Test',
      variants: [
        { name: 'Image A: Product Focus', traffic: 50, conversions: 156 },
        { name: 'Image B: Lifestyle', traffic: 50, conversions: 189 }
      ],
      status: 'running',
      confidence: 82.3
    }
  ];

  const metrics: CampaignMetric[] = [
    { label: 'Active Campaigns', value: '12', change: 20, trend: 'up' },
    { label: 'Total Reach', value: '1.2M', change: 15.4, trend: 'up' },
    { label: 'Avg. CTR', value: '4.8%', change: 0.6, trend: 'up' },
    { label: 'Conversion Rate', value: '3.2%', change: -0.3, trend: 'down' },
    { label: 'Total Revenue', value: '$775.6K', change: 28.5, trend: 'up' },
    { label: 'ROI', value: '386%', change: 12.2, trend: 'up' }
  ];

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'social': return <Share2 className="w-4 h-4" />;
      case 'ads': return <Target className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'multichannel': return <Layers className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'email' && campaign.type === 'email') ||
                      (activeTab === 'social' && campaign.type === 'social') ||
                      (activeTab === 'ads' && campaign.type === 'ads');
    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="campaigns-container">
      {/* Header */}
      <header className="campaigns-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon">
              <Megaphone className="w-8 h-8" />
            </div>
            <div>
              <h1>Campaign Management</h1>
              <p>Create, manage, and optimize your marketing campaigns</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <RefreshCw className="w-4 h-4" />
              Sync Data
            </button>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </header>

      {/* Metrics Overview */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{metric.label}</span>
                <span className={`metric-change ${metric.trend}`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(metric.change)}%
                </span>
              </div>
              <div className="metric-value">{metric.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className="campaigns-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Layers className="w-4 h-4" />
          All Campaigns
        </button>
        <button 
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button 
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <Share2 className="w-4 h-4" />
          Social Media
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
          onClick={() => setActiveTab('ads')}
        >
          <Target className="w-4 h-4" />
          Paid Ads
        </button>
        <button 
          className={`tab-btn ${activeTab === 'automations' ? 'active' : ''}`}
          onClick={() => setActiveTab('automations')}
        >
          <Zap className="w-4 h-4" />
          Automations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ab-tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('ab-tests')}
        >
          <BarChart3 className="w-4 h-4" />
          A/B Tests
        </button>
      </nav>

      {/* Filters */}
      {activeTab !== 'automations' && activeTab !== 'ab-tests' && (
        <div className="campaigns-filters">
          <div className="search-box">
            <Search className="w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Filter className="w-4 h-4" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <button className="btn-filter">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
        </div>
      )}

      {/* Campaigns List */}
      {activeTab !== 'automations' && activeTab !== 'ab-tests' && (
        <section className="campaigns-list">
          <div className="campaigns-table">
            <div className="table-header">
              <div className="col-campaign">Campaign</div>
              <div className="col-status">Status</div>
              <div className="col-budget">Budget</div>
              <div className="col-performance">Performance</div>
              <div className="col-roi">ROI</div>
              <div className="col-actions">Actions</div>
            </div>
            {filteredCampaigns.map(campaign => (
              <div key={campaign.id} className={`campaign-row priority-${campaign.priority}`}>
                <div className="col-campaign">
                  <div className="campaign-info">
                    <div className={`campaign-type-icon type-${campaign.type}`}>
                      {getTypeIcon(campaign.type)}
                    </div>
                    <div className="campaign-details">
                      <h3 className="campaign-name">{campaign.name}</h3>
                      <div className="campaign-meta">
                        <span className="campaign-owner">
                          <Users className="w-3 h-3" />
                          {campaign.owner}
                        </span>
                        <span className="campaign-dates">
                          <Calendar className="w-3 h-3" />
                          {campaign.startDate ? `${campaign.startDate} - ${campaign.endDate}` : 'Not scheduled'}
                        </span>
                      </div>
                      <div className="campaign-tags">
                        {campaign.tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-status">
                  <span className={`status-badge status-${campaign.status}`}>
                    {getStatusIcon(campaign.status)}
                    {campaign.status}
                  </span>
                  {campaign.priority === 'high' && (
                    <span className="priority-badge">
                      <Star className="w-3 h-3" />
                      High Priority
                    </span>
                  )}
                </div>
                <div className="col-budget">
                  <div className="budget-info">
                    <div className="budget-amount">
                      <span className="spent">{formatCurrency(campaign.spent)}</span>
                      <span className="total">/ {formatCurrency(campaign.budget)}</span>
                    </div>
                    <div className="budget-bar">
                      <div 
                        className="budget-progress" 
                        style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                      />
                    </div>
                    <span className="budget-percent">
                      {((campaign.spent / campaign.budget) * 100).toFixed(0)}% used
                    </span>
                  </div>
                </div>
                <div className="col-performance">
                  <div className="performance-metrics">
                    <div className="perf-item">
                      <Eye className="w-3 h-3" />
                      <span>{formatNumber(campaign.impressions)}</span>
                      <small>Impressions</small>
                    </div>
                    <div className="perf-item">
                      <MousePointer className="w-3 h-3" />
                      <span>{formatNumber(campaign.clicks)}</span>
                      <small>Clicks</small>
                    </div>
                    <div className="perf-item">
                      <UserPlus className="w-3 h-3" />
                      <span>{formatNumber(campaign.conversions)}</span>
                      <small>Conversions</small>
                    </div>
                  </div>
                </div>
                <div className="col-roi">
                  <div className="roi-info">
                    <span className="revenue">{formatCurrency(campaign.revenue)}</span>
                    <span className={`roi-value ${campaign.spent > 0 ? (campaign.revenue / campaign.spent > 1 ? 'positive' : 'negative') : ''}`}>
                      {campaign.spent > 0 ? `${((campaign.revenue / campaign.spent) * 100).toFixed(0)}% ROI` : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="col-actions">
                  <div className="action-buttons">
                    <button className="action-btn" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="action-btn" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="action-btn" title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    {campaign.status === 'active' && (
                      <button className="action-btn pause" title="Pause">
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button className="action-btn play" title="Resume">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button className="action-btn more" title="More">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <section className="automations-section">
          <div className="section-header">
            <h2>Marketing Automations</h2>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Automation
            </button>
          </div>
          <div className="automations-grid">
            {automations.map(automation => (
              <div key={automation.id} className={`automation-card status-${automation.status}`}>
                <div className="automation-header">
                  <div className="automation-icon">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="automation-info">
                    <h3>{automation.name}</h3>
                    <p className="trigger">
                      <AlertCircle className="w-3 h-3" />
                      Trigger: {automation.trigger}
                    </p>
                  </div>
                  <span className={`status-indicator ${automation.status}`}>
                    {automation.status === 'active' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {automation.status}
                  </span>
                </div>
                <div className="automation-stats">
                  <div className="stat">
                    <span className="stat-value">{formatNumber(automation.enrolled)}</span>
                    <span className="stat-label">Enrolled</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{formatNumber(automation.completed)}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{automation.conversionRate}%</span>
                    <span className="stat-label">Conversion</span>
                  </div>
                </div>
                <div className="automation-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(automation.completed / automation.enrolled) * 100}%` }}
                    />
                  </div>
                  <span className="progress-label">
                    {((automation.completed / automation.enrolled) * 100).toFixed(0)}% completion rate
                  </span>
                </div>
                <div className="automation-actions">
                  <button className="btn-edit">
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                  <button className="btn-view">
                    <Eye className="w-4 h-4" />
                    View Flow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* A/B Tests Tab */}
      {activeTab === 'ab-tests' && (
        <section className="ab-tests-section">
          <div className="section-header">
            <h2>A/B Testing</h2>
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              New Test
            </button>
          </div>
          <div className="ab-tests-list">
            {abTests.map(test => (
              <div key={test.id} className={`ab-test-card status-${test.status}`}>
                <div className="test-header">
                  <div className="test-info">
                    <h3>{test.name}</h3>
                    <span className="campaign-link">
                      <Megaphone className="w-3 h-3" />
                      {campaigns.find(c => c.id === test.campaignId)?.name}
                    </span>
                  </div>
                  <span className={`test-status ${test.status}`}>
                    {test.status === 'running' && <RefreshCw className="w-3 h-3 spinning" />}
                    {test.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {test.status}
                  </span>
                </div>
                <div className="test-variants">
                  {test.variants.map((variant, i) => (
                    <div key={i} className={`variant ${test.winner === variant.name ? 'winner' : ''}`}>
                      <div className="variant-header">
                        <span className="variant-name">
                          {test.winner === variant.name && <Star className="w-3 h-3" />}
                          {variant.name}
                        </span>
                        <span className="variant-traffic">{variant.traffic}% traffic</span>
                      </div>
                      <div className="variant-bar">
                        <div 
                          className="variant-fill" 
                          style={{ 
                            width: `${(variant.conversions / Math.max(...test.variants.map(v => v.conversions))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="variant-conversions">{variant.conversions} conversions</span>
                    </div>
                  ))}
                </div>
                <div className="test-footer">
                  <div className="confidence">
                    <span className="confidence-label">Statistical Confidence</span>
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{ width: `${test.confidence}%` }} />
                    </div>
                    <span className="confidence-value">{test.confidence}%</span>
                  </div>
                  {test.winner && (
                    <div className="winner-badge">
                      <CheckCircle2 className="w-4 h-4" />
                      Winner: {test.winner}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions Panel */}
      <aside className="quick-actions-panel">
        <h3>Quick Actions</h3>
        <div className="quick-actions-list">
          <button className="quick-action">
            <Mail className="w-5 h-5" />
            <span>Send Test Email</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="quick-action">
            <Users className="w-5 h-5" />
            <span>Import Audience</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="quick-action">
            <BarChart3 className="w-5 h-5" />
            <span>Export Reports</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="quick-action">
            <Globe className="w-5 h-5" />
            <span>UTM Builder</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="quick-action">
            <Phone className="w-5 h-5" />
            <span>SMS Credits</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </div>
  );
}
