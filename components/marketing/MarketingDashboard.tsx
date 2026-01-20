'use client';

import React, { useState, useEffect } from 'react';
import { MarketingService } from '@/lib/services/marketing-service';
import {
  Megaphone,
  Mail,
  MessageSquare,
  FileText,
  GitBranch,
  Users,
  TrendingUp,
  ArrowUpRight,
  Target,
  Zap,
  Send,
  Eye,
  MousePointer,
  UserPlus,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Brain,
  Sparkles,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import './MarketingDashboard.css';

const log = logger.scope('MarketingDashboard');

interface CampaignStats {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: number;
  clickRate: number;
  unsubscribes: number;
  leadsGenerated: number;
  conversions: number;
  revenue: number;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'ads' | 'automation';
  status: 'active' | 'paused' | 'draft' | 'completed' | 'scheduled';
  startDate: Date;
  endDate?: Date;
  sent: number;
  opened: number;
  clicked: number;
  conversions: number;
  revenue: number;
  budget?: number;
  spent?: number;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  enrolled: number;
  completed: number;
  inProgress: number;
  conversions: number;
}

interface LandingPage {
  id: string;
  name: string;
  url: string;
  status: 'published' | 'draft';
  views: number;
  submissions: number;
  conversionRate: number;
}

const MarketingDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [showAIInsights, setShowAIInsights] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<CampaignStats>({
    emailsSent: 0,
    emailsOpened: 0,
    emailsClicked: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribes: 0,
    leadsGenerated: 0,
    conversions: 0,
    revenue: 0
  });

  // Load data from backend on mount
  useEffect(() => {
    loadMarketingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      // Load campaigns from backend
      const backendCampaigns = await MarketingService.campaigns.getAll();
      if (backendCampaigns && backendCampaigns.length > 0) {
        setCampaigns(backendCampaigns.map((c: { id: string; name: string; campaign_type: string; status: string; scheduled_at?: string | null; sent_at?: string | null; metrics: { sent: number; opened: number; clicked: number; converted: number; }; }) => ({
          id: c.id,
          name: c.name,
          type: c.campaign_type.toLowerCase() as 'email' | 'sms' | 'social' | 'ads' | 'automation',
          status: c.status.toLowerCase() as 'active' | 'paused' | 'draft' | 'completed' | 'scheduled',
          startDate: c.scheduled_at ? new Date(c.scheduled_at) : new Date(),
          endDate: c.sent_at ? new Date(c.sent_at) : undefined,
          sent: c.metrics.sent,
          opened: c.metrics.opened,
          clicked: c.metrics.clicked,
          conversions: c.metrics.converted,
          revenue: 0
        })));
      }
      
      // Load analytics
      const analytics = await MarketingService.analytics.getAnalytics('month');
      if (analytics) {
        setStats({
          emailsSent: analytics.campaigns.total_sent,
          emailsOpened: analytics.campaigns.total_opened,
          emailsClicked: analytics.campaigns.total_clicked,
          openRate: analytics.campaigns.avg_open_rate,
          clickRate: analytics.campaigns.avg_click_rate,
          unsubscribes: 0,
          leadsGenerated: analytics.leads.new_leads,
          conversions: analytics.leads.converted_leads,
          revenue: analytics.channels.reduce((sum, ch) => sum + ch.revenue, 0)
        });
      }
      
      // Load leads
      const leads = await MarketingService.leads.getAll();
      log.debug('Leads loaded:', leads?.length || 0);
      
      // Load funnels
      const funnels = await MarketingService.funnels.getAll();
      log.debug('Funnels loaded:', funnels?.length || 0);
    } catch (error) {
      log.error('Failed to load marketing data:', error);
      // Initialize with mock data on error
      initializeMockData();
    } finally {
      setLoading(false);
    }
  };

  const initializeMockData = () => {
    setStats({
      emailsSent: 45892,
      emailsOpened: 18357,
      emailsClicked: 5508,
      openRate: 40.0,
      clickRate: 12.0,
      unsubscribes: 124,
      leadsGenerated: 1847,
      conversions: 312,
      revenue: 156780
    });
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Q4 Product Launch',
      type: 'email',
      status: 'active',
      startDate: new Date('2024-10-01'),
      sent: 15420,
      opened: 6168,
      clicked: 1850,
      conversions: 92,
      revenue: 45600
    },
    {
      id: '2',
      name: 'Black Friday Sale',
      type: 'email',
      status: 'scheduled',
      startDate: new Date('2024-11-29'),
      sent: 0,
      opened: 0,
      clicked: 0,
      conversions: 0,
      revenue: 0,
      budget: 5000
    },
    {
      id: '3',
      name: 'Newsletter Weekly',
      type: 'email',
      status: 'active',
      startDate: new Date('2024-01-01'),
      sent: 25000,
      opened: 10000,
      clicked: 3000,
      conversions: 150,
      revenue: 75000
    },
    {
      id: '4',
      name: 'Abandoned Cart',
      type: 'automation',
      status: 'active',
      startDate: new Date('2024-06-15'),
      sent: 4872,
      opened: 2924,
      clicked: 1461,
      conversions: 58,
      revenue: 28900
    },
    {
      id: '5',
      name: 'SMS Flash Sale',
      type: 'sms',
      status: 'completed',
      startDate: new Date('2024-09-15'),
      endDate: new Date('2024-09-16'),
      sent: 8500,
      opened: 0,
      clicked: 2125,
      conversions: 85,
      revenue: 12500
    }
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Welcome Series',
      trigger: 'New subscriber',
      status: 'active',
      enrolled: 4250,
      completed: 3825,
      inProgress: 425,
      conversions: 638
    },
    {
      id: '2',
      name: 'Abandoned Cart Recovery',
      trigger: 'Cart abandoned',
      status: 'active',
      enrolled: 1892,
      completed: 1513,
      inProgress: 379,
      conversions: 227
    },
    {
      id: '3',
      name: 'Re-engagement',
      trigger: '30 days inactive',
      status: 'active',
      enrolled: 3120,
      completed: 2808,
      inProgress: 312,
      conversions: 156
    },
    {
      id: '4',
      name: 'Post-Purchase',
      trigger: 'Order completed',
      status: 'paused',
      enrolled: 5600,
      completed: 5040,
      inProgress: 560,
      conversions: 392
    }
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [landingPages, setLandingPages] = useState<LandingPage[]>([
    {
      id: '1',
      name: 'Free Trial Signup',
      url: '/trial',
      status: 'published',
      views: 12450,
      submissions: 1868,
      conversionRate: 15.0
    },
    {
      id: '2',
      name: 'Webinar Registration',
      url: '/webinar',
      status: 'published',
      views: 8920,
      submissions: 1159,
      conversionRate: 13.0
    },
    {
      id: '3',
      name: 'Black Friday',
      url: '/black-friday',
      status: 'draft',
      views: 0,
      submissions: 0,
      conversionRate: 0
    }
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aiInsights, setAiInsights] = useState([
    {
      type: 'opportunity',
      title: 'Best time to send',
      message: 'Your audience engages 43% more on Tuesdays at 10 AM',
      action: 'Schedule campaign'
    },
    {
      type: 'warning',
      title: 'High unsubscribe rate',
      message: 'The "Daily Tips" campaign has 2.3x higher unsubscribes',
      action: 'Review campaign'
    },
    {
      type: 'recommendation',
      title: 'A/B test suggestion',
      message: 'Subject lines with emojis perform 28% better',
      action: 'Create test'
    }
  ]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'status-active';
      case 'paused': return 'status-paused';
      case 'draft': return 'status-draft';
      case 'completed': return 'status-completed';
      case 'scheduled': return 'status-scheduled';
      case 'published': return 'status-active';
      default: return '';
    }
  };

  const getCampaignIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return <Mail size={16} />;
      case 'sms': return <MessageSquare size={16} />;
      case 'social': return <Users size={16} />;
      case 'ads': return <Target size={16} />;
      case 'automation': return <Zap size={16} />;
      default: return <Megaphone size={16} />;
    }
  };

  return (
    <div className="marketing-dashboard">
      <header className="marketing-header">
        <div className="header-left">
          <h1>
            <Megaphone size={24} />
            Marketing Hub
          </h1>
          <p className="header-subtitle">All-in-one Marketing Automation</p>
        </div>
        <div className="header-center">
          <div className="period-selector">
            {['7d', '30d', '90d', 'year'].map((period) => (
              <button
                key={period}
                className={selectedPeriod === period ? 'active' : ''}
                onClick={() => setSelectedPeriod(period as '7d' | '30d' | '90d' | 'year')}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : 'Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <button className="btn-ai" onClick={() => setShowAIInsights(!showAIInsights)}>
            <Brain size={18} />
            AI Insights
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            New Campaign
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="main-content">
          {/* Key Metrics */}
          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon emails">
                  <Send size={20} />
                </div>
                <span className="metric-label">Emails Sent</span>
              </div>
              <div className="metric-value">{formatNumber(stats.emailsSent)}</div>
              <div className="metric-change positive">
                <ArrowUpRight size={14} />
                12.5% vs last period
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon opens">
                  <Eye size={20} />
                </div>
                <span className="metric-label">Open Rate</span>
              </div>
              <div className="metric-value">{stats.openRate}%</div>
              <div className="metric-subtext">{formatNumber(stats.emailsOpened)} opened</div>
              <div className="metric-change positive">
                <ArrowUpRight size={14} />
                3.2% vs last period
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon clicks">
                  <MousePointer size={20} />
                </div>
                <span className="metric-label">Click Rate</span>
              </div>
              <div className="metric-value">{stats.clickRate}%</div>
              <div className="metric-subtext">{formatNumber(stats.emailsClicked)} clicks</div>
              <div className="metric-change positive">
                <ArrowUpRight size={14} />
                1.8% vs last period
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon leads">
                  <UserPlus size={20} />
                </div>
                <span className="metric-label">Leads Generated</span>
              </div>
              <div className="metric-value">{formatNumber(stats.leadsGenerated)}</div>
              <div className="metric-change positive">
                <ArrowUpRight size={14} />
                18.3% vs last period
              </div>
            </div>

            <div className="metric-card highlight">
              <div className="metric-header">
                <div className="metric-icon conversions">
                  <Target size={20} />
                </div>
                <span className="metric-label">Conversions</span>
              </div>
              <div className="metric-value">{stats.conversions}</div>
              <div className="metric-change positive">
                <ArrowUpRight size={14} />
                24.1% vs last period
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-header">
                <div className="metric-icon revenue">
                  <DollarSign size={20} />
                </div>
                <span className="metric-label">Revenue</span>
              </div>
              <div className="metric-value">{formatCurrency(stats.revenue)}</div>
              <div className="metric-change positive">
                <ArrowUpRight size={14} />
                31.2% vs last period
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="quick-actions">
            <button className="action-card email">
              <Mail size={24} />
              <span>Email Campaign</span>
            </button>
            <button className="action-card sms">
              <MessageSquare size={24} />
              <span>SMS Campaign</span>
            </button>
            <button className="action-card landing">
              <FileText size={24} />
              <span>Landing Page</span>
            </button>
            <button className="action-card funnel">
              <GitBranch size={24} />
              <span>Funnel</span>
            </button>
            <button className="action-card automation">
              <Zap size={24} />
              <span>Automation</span>
            </button>
            <button className="action-card form">
              <Target size={24} />
              <span>Form</span>
            </button>
          </section>

          {/* Active Campaigns */}
          <section className="campaigns-section">
            <div className="section-header">
              <h2>
                <Megaphone size={20} />
                Active Campaigns
              </h2>
              <button className="btn-text">View All →</button>
            </div>
            <div className="campaigns-table">
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Open Rate</th>
                    <th>Click Rate</th>
                    <th>Conversions</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(campaign => (
                    <tr key={campaign.id}>
                      <td className="campaign-name">
                        <div className="campaign-info">
                          <span className={`campaign-icon ${campaign.type}`}>
                            {getCampaignIcon(campaign.type)}
                          </span>
                          <div>
                            <span className="name">{campaign.name}</span>
                            <span className="type">{campaign.type}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td>{formatNumber(campaign.sent)}</td>
                      <td>{campaign.sent > 0 ? `${((campaign.opened / campaign.sent) * 100).toFixed(1)}%` : '-'}</td>
                      <td>{campaign.opened > 0 ? `${((campaign.clicked / campaign.opened) * 100).toFixed(1)}%` : '-'}</td>
                      <td>{campaign.conversions}</td>
                      <td className="revenue-cell">{formatCurrency(campaign.revenue)}</td>
                      <td className="actions-cell">
                        <button className="btn-icon" title={campaign.status === 'active' ? 'Pause' : 'Start'}>
                          {campaign.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button className="btn-icon" title="View">
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon" title="Settings">
                          <Settings size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Automations */}
          <section className="automations-section">
            <div className="section-header">
              <h2>
                <Zap size={20} />
                Automations
              </h2>
              <button className="btn-text">View All →</button>
            </div>
            <div className="automations-grid">
              {automations.map(automation => (
                <div key={automation.id} className="automation-card">
                  <div className="automation-header">
                    <div className="automation-info">
                      <h4>{automation.name}</h4>
                      <span className="trigger">{automation.trigger}</span>
                    </div>
                    <span className={`status-badge ${getStatusColor(automation.status)}`}>
                      {automation.status}
                    </span>
                  </div>
                  <div className="automation-stats">
                    <div className="stat">
                      <span className="stat-value">{formatNumber(automation.enrolled)}</span>
                      <span className="stat-label">Enrolled</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{formatNumber(automation.inProgress)}</span>
                      <span className="stat-label">In Progress</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{formatNumber(automation.conversions)}</span>
                      <span className="stat-label">Conversions</span>
                    </div>
                  </div>
                  <div className="automation-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(automation.completed / automation.enrolled) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {((automation.completed / automation.enrolled) * 100).toFixed(0)}% completion
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Landing Pages */}
          <section className="pages-section">
            <div className="section-header">
              <h2>
                <FileText size={20} />
                Landing Pages
              </h2>
              <button className="btn-text">View All →</button>
            </div>
            <div className="pages-grid">
              {landingPages.map(page => (
                <div key={page.id} className="page-card">
                  <div className="page-header">
                    <h4>{page.name}</h4>
                    <span className={`status-badge ${getStatusColor(page.status)}`}>
                      {page.status}
                    </span>
                  </div>
                  <div className="page-url">{page.url}</div>
                  <div className="page-stats">
                    <div className="stat">
                      <Eye size={14} />
                      <span>{formatNumber(page.views)} views</span>
                    </div>
                    <div className="stat">
                      <CheckCircle2 size={14} />
                      <span>{formatNumber(page.submissions)} submissions</span>
                    </div>
                    <div className="stat highlight">
                      <Target size={14} />
                      <span>{page.conversionRate}% conversion</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* AI Insights Panel */}
        {showAIInsights && (
          <aside className="ai-panel">
            <div className="ai-panel-header">
              <div className="ai-title">
                <Brain size={20} />
                <span>AI Insights</span>
              </div>
              <button className="btn-icon" onClick={() => setShowAIInsights(false)}>×</button>
            </div>
            <div className="ai-insights-list">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`ai-insight ${insight.type}`}>
                  <div className="insight-header">
                    {insight.type === 'opportunity' && <TrendingUp size={16} />}
                    {insight.type === 'warning' && <AlertCircle size={16} />}
                    {insight.type === 'recommendation' && <Sparkles size={16} />}
                    <span className="insight-type">{insight.type}</span>
                  </div>
                  <h4>{insight.title}</h4>
                  <p>{insight.message}</p>
                  <button className="insight-action">{insight.action}</button>
                </div>
              ))}
            </div>
            <div className="ai-panel-footer">
              <button className="btn-ai-full">
                <Sparkles size={16} />
                Generate Campaign Ideas
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default MarketingDashboard;
