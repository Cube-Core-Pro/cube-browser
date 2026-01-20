'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CRMDashboard');

import React, { useState, useEffect, useCallback } from 'react';
import { CRMService, Activity as CRMActivity, Deal as CRMDeal } from '@/lib/services/crm-service';
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare,
  Target,
  Activity,
  BarChart3,
  Plus,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Brain,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import './CRMDashboard.css';

interface DashboardStats {
  total_contacts: number;
  total_companies: number;
  total_deals: number;
  open_deals: number;
  total_pipeline_value: number;
  won_deals: number;
  won_value: number;
  lost_deals: number;
  lost_value: number;
  win_rate: number;
  contacts_this_month: number;
  deals_this_month: number;
  avg_deal_size: number;
  avg_sales_cycle_days: number;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  contact_id?: string;
  contact_name?: string;
  company_id?: string;
  deal_id?: string;
  assigned_to: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  contact_id?: string;
  contact_name: string;
  company_id?: string;
  company_name: string;
  assigned_to: string;
  expected_close: string;
  actual_close?: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  impact: string;
  actionable: boolean;
  action?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

const CRMDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [pipelineData, setPipelineData] = useState<Map<string, Deal[]>>(new Map());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load stats, deals, activities, and insights in parallel using CRMService
      const [statsResult, dealsResult, activitiesResult, insightsResult, pipelinesResult] = await Promise.all([
        CRMService.analytics.getStats(),
        CRMService.deals.getAll(),
        CRMService.activities.getAll(),
        CRMService.analytics.getInsights(),
        CRMService.pipelines.getAll(),
      ]);
      
      // Map CRM types to local display types
      const mappedStats: DashboardStats = {
        total_contacts: statsResult.total_contacts,
        total_companies: statsResult.total_companies,
        total_deals: statsResult.total_deals,
        open_deals: statsResult.active_deals,
        total_pipeline_value: statsResult.total_value,
        won_deals: statsResult.won_deals,
        won_value: statsResult.won_value,
        lost_deals: statsResult.lost_deals,
        lost_value: 0, // Not in CRMStats, default to 0
        win_rate: statsResult.conversion_rate,
        contacts_this_month: 0, // Not in CRMStats, default to 0
        deals_this_month: 0, // Not in CRMStats, default to 0
        avg_deal_size: statsResult.avg_deal_size,
        avg_sales_cycle_days: 0, // Not in CRMStats, default to 0
      };
      
      // Map CRM deals to local Deal type (limit to 5 for dashboard)
      const mappedDeals: Deal[] = dealsResult.slice(0, 5).map((d: CRMDeal) => ({
        id: d.id,
        name: d.title,
        value: d.value,
        stage: d.stage,
        probability: d.probability,
        contact_id: d.contact_id ?? undefined,
        contact_name: '',
        company_id: d.company_id ?? undefined,
        company_name: '',
        assigned_to: '',
        expected_close: d.expected_close_date ?? '',
        actual_close: undefined,
        notes: d.notes,
        tags: d.tags,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));
      
      // Map CRM activities to local Activity type (limit to 10 for dashboard)
      const mappedActivities: Activity[] = activitiesResult.slice(0, 10).map((a: CRMActivity) => ({
        id: a.id,
        activity_type: a.activity_type,
        title: a.title,
        description: a.description,
        contact_id: a.contact_id ?? undefined,
        contact_name: undefined,
        company_id: undefined,
        deal_id: a.deal_id ?? undefined,
        assigned_to: '',
        due_date: a.scheduled_at ?? undefined,
        completed: a.status === 'Completed',
        completed_at: a.completed_at ?? undefined,
        priority: 'normal',
        created_at: a.created_at,
        updated_at: a.created_at,
      }));
      
      // Map insights to local AIInsight type
      const mappedInsights: AIInsight[] = insightsResult.trends?.map((t, idx) => ({
        id: `trend-${idx}`,
        insight_type: 'recommendation',
        title: `Trend: ${t.date}`,
        description: `${t.deals} deals worth $${t.revenue}`,
        impact: 'medium',
        actionable: false,
        created_at: t.date,
      })) || [];
      
      setStats(mappedStats);
      setTopDeals(mappedDeals);
      setActivities(mappedActivities);
      setAiInsights(mappedInsights);
      
      // Build pipeline data from pipelines result
      const pipelineMap = new Map<string, Deal[]>();
      for (const pipeline of pipelinesResult) {
        try {
          const pipelineDealsResult = await CRMService.pipelines.getDeals(pipeline.id);
          // Ensure pipelineDeals is an array
          const pipelineDeals = Array.isArray(pipelineDealsResult) ? pipelineDealsResult : [];
          const mappedPipelineDeals: Deal[] = pipelineDeals.map((d: CRMDeal) => ({
          id: d.id,
          name: d.title,
          value: d.value,
          stage: d.stage,
          probability: d.probability,
          contact_id: d.contact_id ?? undefined,
          contact_name: '',
          company_id: d.company_id ?? undefined,
          company_name: '',
          assigned_to: '',
          expected_close: d.expected_close_date ?? '',
          actual_close: undefined,
          notes: d.notes,
          tags: d.tags,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
        pipelineMap.set(pipeline.name, mappedPipelineDeals);
        } catch (pipelineErr) {
          log.warn(`Failed to load deals for pipeline ${pipeline.id}:`, pipelineErr);
          pipelineMap.set(pipeline.name, []);
        }
      }
      setPipelineData(pipelineMap);
      
    } catch (err) {
      log.error('Failed to load CRM data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      
      // Fallback to demo data if backend not available
      setStats({
        total_contacts: 2847,
        total_companies: 482,
        total_deals: 127,
        open_deals: 93,
        total_pipeline_value: 2450000,
        won_deals: 34,
        won_value: 892000,
        lost_deals: 12,
        lost_value: 156000,
        win_rate: 73.9,
        contacts_this_month: 156,
        deals_this_month: 23,
        avg_deal_size: 26200,
        avg_sales_cycle_days: 32,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diff / (1000 * 60));

    if (diffMinutes > -60 && diffMinutes < 0) {
      return `${Math.abs(diffMinutes)} min ago`;
    } else if (diffHours > -24 && diffHours < 0) {
      return `${Math.abs(diffHours)} hours ago`;
    } else if (diffDays > -7 && diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffMinutes >= 0 && diffMinutes < 60) {
      return `in ${diffMinutes} min`;
    } else if (diffHours >= 0 && diffHours < 24) {
      return `in ${diffHours} hours`;
    } else if (diffDays >= 0 && diffDays < 7) {
      return `in ${diffDays} days`;
    }
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call': return <Phone className="activity-icon call" />;
      case 'email': return <Mail className="activity-icon email" />;
      case 'meeting': return <Calendar className="activity-icon meeting" />;
      case 'task': return <CheckCircle2 className="activity-icon task" />;
      case 'note': return <MessageSquare className="activity-icon note" />;
      case 'deal': return <DollarSign className="activity-icon deal" />;
      default: return <Activity className="activity-icon" />;
    }
  };

  const getStatusIcon = (completed: boolean, dueDate?: string) => {
    if (completed) {
      return <CheckCircle2 className="status-icon completed" />;
    }
    if (dueDate && new Date(dueDate) < new Date()) {
      return <AlertCircle className="status-icon overdue" />;
    }
    return <Clock className="status-icon pending" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'opportunity': return <TrendingUp className="insight-icon opportunity" />;
      case 'risk': return <AlertCircle className="insight-icon risk" />;
      case 'recommendation': return <Sparkles className="insight-icon recommendation" />;
      case 'prediction': return <Brain className="insight-icon prediction" />;
      default: return <Zap className="insight-icon" />;
    }
  };

  const handleAIAction = useCallback(async (insight: AIInsight) => {
    log.debug('Executing AI action:', insight.action);
    // Future: Execute the recommended action through backend
  }, []);

  const handleCompleteActivity = useCallback(async (activityId: string) => {
    try {
      await CRMService.activities.complete(activityId);
      // Refresh activities
      const activitiesResult = await CRMService.activities.getAll();
      const mappedActivities: Activity[] = activitiesResult.slice(0, 10).map((a: CRMActivity) => ({
        id: a.id,
        activity_type: a.activity_type,
        title: a.title,
        description: a.description,
        contact_id: a.contact_id ?? undefined,
        contact_name: undefined,
        company_id: undefined,
        deal_id: a.deal_id ?? undefined,
        assigned_to: '',
        due_date: a.scheduled_at ?? undefined,
        completed: a.status === 'Completed',
        completed_at: a.completed_at ?? undefined,
        priority: 'normal',
        created_at: a.created_at,
        updated_at: a.created_at,
      }));
      setActivities(mappedActivities);
    } catch (err) {
      log.error('Failed to complete activity:', err);
    }
  }, []);

  if (loading) {
    return (
      <div className="crm-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="spin" size={32} />
          <p>Loading CRM Dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate pipeline totals from data
  const pipelineTotals = Array.from(pipelineData.entries()).map(([stage, deals]) => ({
    stage: stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: deals.length,
    value: deals.reduce((sum, d) => sum + d.value, 0)
  }));

  return (
    <div className="crm-dashboard">
      <header className="crm-header">
        <div className="header-left">
          <h1>CRM Dashboard</h1>
          <p className="header-subtitle">Customer Relationship Management</p>
        </div>
        <div className="header-center">
          <div className="time-range-selector">
            <button 
              className={selectedTimeRange === 'today' ? 'active' : ''}
              onClick={() => setSelectedTimeRange('today')}
            >
              Today
            </button>
            <button 
              className={selectedTimeRange === 'week' ? 'active' : ''}
              onClick={() => setSelectedTimeRange('week')}
            >
              This Week
            </button>
            <button 
              className={selectedTimeRange === 'month' ? 'active' : ''}
              onClick={() => setSelectedTimeRange('month')}
            >
              This Month
            </button>
            <button 
              className={selectedTimeRange === 'quarter' ? 'active' : ''}
              onClick={() => setSelectedTimeRange('quarter')}
            >
              Quarter
            </button>
          </div>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={loadDashboardData} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="btn-ai" onClick={() => setShowAIPanel(!showAIPanel)}>
            <Brain size={18} />
            AI Insights
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Quick Add
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          {error}
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="main-content">
          {/* Key Metrics */}
          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon contacts">
                  <Users size={20} />
                </div>
                <span className="metric-label">Total Contacts</span>
              </div>
              <div className="metric-value">{(stats?.total_contacts || 0).toLocaleString()}</div>
              <div className="metric-subtext">+{stats?.contacts_this_month || 0} this month</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon companies">
                  <Building2 size={20} />
                </div>
                <span className="metric-label">Companies</span>
              </div>
              <div className="metric-value">{(stats?.total_companies || 0).toLocaleString()}</div>
            </div>

            <div className="metric-card highlight">
              <div className="metric-header">
                <div className="metric-icon pipeline">
                  <Target size={20} />
                </div>
                <span className="metric-label">Open Pipeline</span>
              </div>
              <div className="metric-value">{formatCurrency(stats?.total_pipeline_value || 0)}</div>
              <div className="metric-subtext">{stats?.open_deals || 0} active deals</div>
            </div>

            <div className="metric-card success">
              <div className="metric-header">
                <div className="metric-icon won">
                  <DollarSign size={20} />
                </div>
                <span className="metric-label">Won Deals</span>
              </div>
              <div className="metric-value">{formatCurrency(stats?.won_value || 0)}</div>
              <div className="metric-subtext">{stats?.won_deals || 0} deals closed</div>
              <div className="metric-winrate">
                <span className="winrate-label">Win Rate:</span>
                <span className="winrate-value">{(stats?.win_rate || 0).toFixed(1)}%</span>
              </div>
            </div>
          </section>

          {/* Pipeline Overview */}
          <section className="pipeline-section">
            <div className="section-header">
              <h2>
                <BarChart3 size={20} />
                Pipeline Overview
              </h2>
              <button className="btn-text">View All Deals →</button>
            </div>
            <div className="pipeline-stages">
              {pipelineTotals.length > 0 ? pipelineTotals.map((stage, index) => (
                <div key={stage.stage} className="pipeline-stage">
                  <div className="stage-header">
                    <span className="stage-name">{stage.stage}</span>
                    <span className="stage-count">{stage.count}</span>
                  </div>
                  <div className="stage-value">{formatCurrency(stage.value)}</div>
                  <div className="stage-bar">
                    <div 
                      className="stage-fill" 
                      style={{ 
                        width: `${pipelineTotals.length > 0 ? (stage.value / Math.max(...pipelineTotals.map(s => s.value), 1)) * 100 : 0}%`,
                        backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`
                      }} 
                    />
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <Target size={24} />
                  <p>No deals in pipeline yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Top Deals */}
          <section className="deals-section">
            <div className="section-header">
              <h2>
                <Target size={20} />
                Top Deals
              </h2>
              <button className="btn-text">View Pipeline →</button>
            </div>
            <div className="deals-list">
              {topDeals.length > 0 ? topDeals.map((deal) => (
                <div key={deal.id} className="deal-card">
                  <div className="deal-main">
                    <div className="deal-info">
                      <h3 className="deal-name">{deal.name}</h3>
                      <div className="deal-meta">
                        <span className="deal-company">{deal.company_name}</span>
                        <span className="deal-contact">
                          <Users size={12} /> {deal.contact_name}
                        </span>
                      </div>
                    </div>
                    <div className="deal-value">{formatCurrency(deal.value)}</div>
                  </div>
                  <div className="deal-footer">
                    <div className="deal-stage">
                      <span className={`stage-badge ${deal.stage.toLowerCase()}`}>
                        {deal.stage.replace('_', ' ')}
                      </span>
                      <span className="deal-probability">{deal.probability}% likely</span>
                    </div>
                    <div className="deal-dates">
                      <span className="deal-close">
                        <Calendar size={12} />
                        Close: {formatDate(deal.expected_close)}
                      </span>
                      <span className="deal-activity">
                        <Activity size={12} />
                        {formatDate(deal.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className="deal-actions">
                    <button className="btn-icon" title="Call">
                      <Phone size={14} />
                    </button>
                    <button className="btn-icon" title="Email">
                      <Mail size={14} />
                    </button>
                    <button className="btn-icon" title="More">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <DollarSign size={24} />
                  <p>No deals yet. Create your first deal!</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activities */}
          <section className="activities-section">
            <div className="section-header">
              <h2>
                <Activity size={20} />
                Recent Activities
              </h2>
              <div className="section-actions">
                <button className="btn-icon">
                  <Filter size={16} />
                </button>
                <button className="btn-text">View All →</button>
              </div>
            </div>
            <div className="activities-timeline">
              {activities.length > 0 ? activities.map((activity) => (
                <div key={activity.id} className={`activity-item ${activity.completed ? 'completed' : 'pending'}`}>
                  <div className="activity-indicator">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <h4 className="activity-title">{activity.title}</h4>
                      {getStatusIcon(activity.completed, activity.due_date)}
                    </div>
                    <p className="activity-description">{activity.description}</p>
                    <div className="activity-footer">
                      {activity.contact_name && (
                        <span className="activity-contact">
                          <Users size={12} /> {activity.contact_name}
                        </span>
                      )}
                      <span className="activity-time">{formatDate(activity.created_at)}</span>
                    </div>
                  </div>
                  <div className="activity-actions">
                    {!activity.completed && (
                      <button 
                        className="btn-icon complete"
                        onClick={() => handleCompleteActivity(activity.id)}
                        title="Mark as complete"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                    <button className="btn-icon">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <Activity size={24} />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* AI Insights Panel */}
        {showAIPanel && (
          <aside className="ai-panel">
            <div className="ai-panel-header">
              <div className="ai-title">
                <Brain size={20} />
                <span>AI Insights</span>
              </div>
              <button className="btn-icon" onClick={() => setShowAIPanel(false)}>×</button>
            </div>
            <div className="ai-insights-list">
              {aiInsights.length > 0 ? aiInsights.map((insight) => (
                <div key={insight.id} className={`ai-insight-card ${insight.insight_type} ${insight.impact}`}>
                  <div className="insight-header">
                    {getInsightIcon(insight.insight_type)}
                    <span className={`impact-badge ${insight.impact}`}>{insight.impact}</span>
                  </div>
                  <h4 className="insight-title">{insight.title}</h4>
                  <p className="insight-description">{insight.description}</p>
                  {insight.actionable && insight.action && (
                    <button 
                      className="btn-insight-action"
                      onClick={() => handleAIAction(insight)}
                    >
                      <Zap size={14} />
                      {insight.action}
                    </button>
                  )}
                </div>
              )) : (
                <div className="empty-state">
                  <Sparkles size={24} />
                  <p>AI is analyzing your data...</p>
                </div>
              )}
            </div>
            <div className="ai-panel-footer">
              <button className="btn-ai-chat">
                <MessageSquare size={16} />
                Ask AI Assistant
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CRMDashboard;
