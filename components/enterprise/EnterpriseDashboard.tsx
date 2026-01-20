// ============================================
// CUBE Elite v6 - Enterprise Dashboard Component
// Fortune 500 Ready - React Component
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useEnterprise } from '../../hooks/useEnterpriseServices';
import './EnterpriseDashboard.css';

// ============================================
// Types
// ============================================

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkflows: number;
  apiCallsThisMonth: number;
  storageUsedGB: number;
  subscriptionStatus: string;
  nextBillingDate: number;
  monthlySpend: number;
}

interface ActivityItem {
  id: string;
  type: 'user' | 'workflow' | 'security' | 'billing';
  title: string;
  description: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
}

// ============================================
// Sub-Components
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return '↑';
    if (trend.direction === 'down') return '↓';
    return '→';
  };

  const getTrendClass = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return 'trend-up';
    if (trend.direction === 'down') return 'trend-down';
    return 'trend-neutral';
  };

  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <h3 className="stat-card__title">{title}</h3>
        <div className="stat-card__value">{value}</div>
        {subtitle && <p className="stat-card__subtitle">{subtitle}</p>}
        {trend && (
          <div className={`stat-card__trend ${getTrendClass()}`}>
            <span className="trend-icon">{getTrendIcon()}</span>
            <span className="trend-value">{Math.abs(trend.value)}%</span>
            <span className="trend-label">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface UsageMeterProps {
  label: string;
  current: number;
  max: number;
  unit?: string;
}

const UsageMeter: React.FC<UsageMeterProps> = ({ label, current, max, unit = '' }) => {
  const percentage = max === -1 ? 0 : Math.min((current / max) * 100, 100);
  const isUnlimited = max === -1;
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="usage-meter">
      <div className="usage-meter__header">
        <span className="usage-meter__label">{label}</span>
        <span className="usage-meter__value">
          {current.toLocaleString()} {unit}
          {!isUnlimited && ` / ${max.toLocaleString()} ${unit}`}
          {isUnlimited && ' (Unlimited)'}
        </span>
      </div>
      <div className="usage-meter__bar">
        <div
          className={`usage-meter__fill ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
          style={{ width: isUnlimited ? '10%' : `${percentage}%` }}
        />
      </div>
      {!isUnlimited && (
        <div className="usage-meter__percentage">
          {percentage.toFixed(1)}% used
        </div>
      )}
    </div>
  );
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user': return '👤';
      case 'workflow': return '⚙️';
      case 'security': return '🔒';
      case 'billing': return '💳';
      default: return '📋';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="activity-feed">
      <h3 className="activity-feed__title">Recent Activity</h3>
      <div className="activity-feed__list">
        {activities.map(activity => (
          <div 
            key={activity.id} 
            className={`activity-item activity-item--${activity.severity}`}
          >
            <span className="activity-item__icon">
              {getActivityIcon(activity.type)}
            </span>
            <div className="activity-item__content">
              <div className="activity-item__title">{activity.title}</div>
              <div className="activity-item__description">{activity.description}</div>
            </div>
            <span className="activity-item__time">
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    { id: 'invite_user', icon: '👥', label: 'Invite User', color: 'blue' },
    { id: 'create_workflow', icon: '⚙️', label: 'New Workflow', color: 'green' },
    { id: 'view_reports', icon: '📊', label: 'View Reports', color: 'purple' },
    { id: 'manage_billing', icon: '💳', label: 'Manage Billing', color: 'orange' },
    { id: 'security_settings', icon: '🔒', label: 'Security', color: 'red' },
    { id: 'export_data', icon: '📤', label: 'Export Data', color: 'teal' },
  ];

  return (
    <div className="quick-actions">
      <h3 className="quick-actions__title">Quick Actions</h3>
      <div className="quick-actions__grid">
        {actions.map(action => (
          <button
            key={action.id}
            className={`quick-action quick-action--${action.color}`}
            onClick={() => onAction(action.id)}
          >
            <span className="quick-action__icon">{action.icon}</span>
            <span className="quick-action__label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

interface EnterpriseDashboardProps {
  tenantId?: string;
  userId?: string;
  onNavigate?: (section: string) => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
  tenantId,
  userId,
  onNavigate = () => {},
}) => {
  const { multiTenant, payment, audit, isEnterprise, getFeatureAccess, checkLimits } = useEnterprise();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load tenant data
      if (tenantId) {
        await multiTenant.getTenant(tenantId);
        await multiTenant.listMembers(tenantId);
      }

      // Load payment data
      if (userId) {
        try {
          await payment.getCustomer(userId);
          const customer = payment.customer;
          if (customer) {
            await payment.getSubscription(customer.id);
            await payment.listInvoices(customer.id);
          }
        } catch {
          // Customer might not exist yet
        }
      }

      // Load audit data
      const timeRangeDays = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const startDate = Math.floor(Date.now() / 1000) - (timeRangeDays * 86400);
      
      await audit.queryEvents({
        tenant_id: tenantId,
        start_date: startDate,
        limit: 50,
      });

      // Calculate stats from loaded data
      const tenant = multiTenant.currentTenant;
      const members = multiTenant.members;
      const subscription = payment.subscription;
      const invoices = payment.invoices;

      if (tenant) {
        setStats({
          totalUsers: members.length,
          activeUsers: members.filter(m => m.status === 'active').length,
          totalWorkflows: 42, // Would come from workflow service
          apiCallsThisMonth: 15234, // Would come from usage tracking
          storageUsedGB: 24.5, // Would come from storage service
          subscriptionStatus: subscription?.status || 'none',
          nextBillingDate: subscription?.current_period_end || 0,
          monthlySpend: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) / 100,
        });
      }

      // Convert audit events to activity items
      const activityItems: ActivityItem[] = audit.events.slice(0, 10).map(event => ({
        id: event.id,
        type: event.category === 'authentication' ? 'user' 
            : event.category === 'billing' ? 'billing'
            : event.category === 'security' ? 'security'
            : 'workflow',
        title: event.action,
        description: `${event.resource_type} ${event.resource_id || ''}`.trim(),
        timestamp: event.created_at,
        severity: event.severity,
      }));

      setActivities(activityItems);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId, selectedTimeRange, multiTenant, payment, audit]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'invite_user':
        onNavigate('team');
        break;
      case 'create_workflow':
        onNavigate('workflows');
        break;
      case 'view_reports':
        onNavigate('reports');
        break;
      case 'manage_billing':
        onNavigate('billing');
        break;
      case 'security_settings':
        onNavigate('security');
        break;
      case 'export_data':
        onNavigate('exports');
        break;
      default:
        break;
    }
  };

  const handleUpgrade = () => {
    onNavigate('billing');
  };

  if (loading) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enterprise-dashboard enterprise-dashboard--error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tenant = multiTenant.currentTenant;

  return (
    <div className="enterprise-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <h1 className="dashboard-title">
            {tenant?.name || 'Enterprise Dashboard'}
          </h1>
          <span className={`plan-badge plan-badge--${tenant?.plan || 'starter'}`}>
            {tenant?.plan?.toUpperCase() || 'STARTER'} Plan
          </span>
        </div>
        <div className="dashboard-header__right">
          <select
            className="time-range-select"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="refresh-button" onClick={loadDashboardData}>
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Upgrade Banner (for non-enterprise) */}
      {!isEnterprise() && (
        <div className="upgrade-banner">
          <div className="upgrade-banner__content">
            <span className="upgrade-banner__icon">🚀</span>
            <div className="upgrade-banner__text">
              <strong>Unlock Enterprise Features</strong>
              <p>Get SSO, advanced audit logs, custom integrations, and priority support.</p>
            </div>
          </div>
          <button className="upgrade-banner__button" onClick={handleUpgrade}>
            Upgrade Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.activeUsers || 0} active`}
            icon="👥"
            trend={{ value: 12, direction: 'up' }}
            color="blue"
          />
          <StatCard
            title="Workflows"
            value={stats?.totalWorkflows || 0}
            subtitle="Active automations"
            icon="⚙️"
            trend={{ value: 8, direction: 'up' }}
            color="green"
          />
          <StatCard
            title="API Calls"
            value={stats?.apiCallsThisMonth?.toLocaleString() || 0}
            subtitle="This month"
            icon="📡"
            trend={{ value: 5, direction: 'up' }}
            color="purple"
          />
          <StatCard
            title="Monthly Spend"
            value={`$${stats?.monthlySpend?.toFixed(2) || '0.00'}`}
            subtitle={stats?.subscriptionStatus === 'active' ? 'Active subscription' : 'No subscription'}
            icon="💳"
            color="orange"
          />
        </div>
      </section>

      {/* Usage Section */}
      <section className="usage-section">
        <h2 className="section-title">Resource Usage</h2>
        <div className="usage-grid">
          <UsageMeter
            label="Team Members"
            current={stats?.totalUsers || 0}
            max={tenant?.limits.max_users || 5}
            unit="users"
          />
          <UsageMeter
            label="Storage"
            current={stats?.storageUsedGB || 0}
            max={tenant?.limits.max_storage_gb || 10}
            unit="GB"
          />
          <UsageMeter
            label="API Calls"
            current={stats?.apiCallsThisMonth || 0}
            max={tenant?.limits.max_api_calls_per_month || 10000}
            unit="calls"
          />
          <UsageMeter
            label="Workflows"
            current={stats?.totalWorkflows || 0}
            max={tenant?.limits.max_workflows || 10}
            unit="workflows"
          />
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Activity Feed */}
        <div className="dashboard-content__main">
          <ActivityFeed activities={activities} />
        </div>

        {/* Sidebar */}
        <div className="dashboard-content__sidebar">
          <QuickActions onAction={handleQuickAction} />

          {/* Feature Access */}
          <div className="feature-access">
            <h3 className="feature-access__title">Feature Access</h3>
            <ul className="feature-access__list">
              <li className={getFeatureAccess('basic_automation') ? 'enabled' : 'disabled'}>
                <span className="feature-icon">✓</span>
                Basic Automation
              </li>
              <li className={getFeatureAccess('advanced_automation') ? 'enabled' : 'disabled'}>
                <span className="feature-icon">{getFeatureAccess('advanced_automation') ? '✓' : '🔒'}</span>
                Advanced Automation
              </li>
              <li className={getFeatureAccess('sso') ? 'enabled' : 'disabled'}>
                <span className="feature-icon">{getFeatureAccess('sso') ? '✓' : '🔒'}</span>
                SSO Integration
              </li>
              <li className={getFeatureAccess('audit_logs') ? 'enabled' : 'disabled'}>
                <span className="feature-icon">{getFeatureAccess('audit_logs') ? '✓' : '🔒'}</span>
                Audit Logs
              </li>
              <li className={getFeatureAccess('custom_integrations') ? 'enabled' : 'disabled'}>
                <span className="feature-icon">{getFeatureAccess('custom_integrations') ? '✓' : '🔒'}</span>
                Custom Integrations
              </li>
              <li className={getFeatureAccess('white_label') ? 'enabled' : 'disabled'}>
                <span className="feature-icon">{getFeatureAccess('white_label') ? '✓' : '🔒'}</span>
                White Label
              </li>
            </ul>
          </div>

          {/* Compliance Status */}
          {isEnterprise() && (
            <div className="compliance-status">
              <h3 className="compliance-status__title">Compliance</h3>
              <div className="compliance-badges">
                <span className="compliance-badge compliance-badge--active">SOC2</span>
                <span className="compliance-badge compliance-badge--active">GDPR</span>
                <span className="compliance-badge compliance-badge--active">HIPAA</span>
                <span className="compliance-badge compliance-badge--pending">ISO27001</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-info">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Tenant ID: {tenant?.id || 'N/A'}</span>
        </div>
        <div className="footer-links">
          <button onClick={() => onNavigate('documentation')}>Documentation</button>
          <button onClick={() => onNavigate('support')}>Support</button>
          <button onClick={() => onNavigate('status')}>System Status</button>
        </div>
      </footer>
    </div>
  );
};

export default EnterpriseDashboard;
