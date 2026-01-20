// CUBE Nexum - SuperAdmin Ultimate Dashboard
// 
// Enterprise-grade admin panel with complete system control
// Competes with: Salesforce Admin, Slack Enterprise, Teams Admin Center

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  useSuperAdminDashboard,
  useUsers,
  useTeams,
  useRoles,
  useSecuritySettings,
  useAuditLogs,
  useSystemHealth,
  useRealtimeMetrics,
  useAdminAlerts,
  usePendingActions,
  superAdminService,
} from '@/lib/services/superadmin-service';
import type {
  User,
  Team,
  Role,
  AuditLog,
  AdminAlert,
  PendingAction,
  SystemHealth,
  UserStatus,
} from '@/lib/types/superadmin';
import './SuperAdminDashboard.css';

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

interface SuperAdminDashboardProps {
  onClose?: () => void;
}

type AdminSection = 
  | 'overview'
  | 'users'
  | 'teams'
  | 'roles'
  | 'billing'
  | 'security'
  | 'audit'
  | 'compliance'
  | 'branding'
  | 'api'
  | 'integrations'
  | 'analytics'
  | 'ai-chat'
  | 'settings';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const { dashboard, loading: dashboardLoading, refresh: refreshDashboard } = useSuperAdminDashboard();
  const { alerts } = useAdminAlerts();
  const { actions } = usePendingActions();

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledgedAt);
  const urgentActions = actions.filter(a => a.priority === 'urgent' || a.priority === 'high');

  return (
    <div className="superadmin-dashboard">
      {/* Header */}
      <header className="superadmin-header">
        <div className="header-left">
          <h1>
            <span className="icon">👑</span>
            SuperAdmin Control Center
          </h1>
          <span className="badge enterprise">Enterprise</span>
        </div>
        
        <div className="header-center">
          <div className="global-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search users, teams, settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd>⌘K</kbd>
          </div>
        </div>

        <div className="header-right">
          {unacknowledgedAlerts.length > 0 && (
            <button className="alert-indicator" title={`${unacknowledgedAlerts.length} alerts`}>
              <span className="icon">🔔</span>
              <span className="count">{unacknowledgedAlerts.length}</span>
            </button>
          )}
          {urgentActions.length > 0 && (
            <button className="action-indicator" title={`${urgentActions.length} pending actions`}>
              <span className="icon">⚡</span>
              <span className="count">{urgentActions.length}</span>
            </button>
          )}
          <button className="refresh-btn" onClick={refreshDashboard} title="Refresh">
            <span className="icon">🔄</span>
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose} title="Close">
              <span className="icon">✕</span>
            </button>
          )}
        </div>
      </header>

      <div className="superadmin-body">
        {/* Sidebar Navigation */}
        <nav className="superadmin-nav">
          <NavSection title="Dashboard">
            <NavItem
              icon="📊"
              label="Overview"
              active={activeSection === 'overview'}
              onClick={() => setActiveSection('overview')}
            />
          </NavSection>

          <NavSection title="User Management">
            <NavItem
              icon="👥"
              label="Users"
              active={activeSection === 'users'}
              onClick={() => setActiveSection('users')}
              badge={dashboard?.overview.totalUsers}
            />
            <NavItem
              icon="🏢"
              label="Teams"
              active={activeSection === 'teams'}
              onClick={() => setActiveSection('teams')}
              badge={dashboard?.overview.totalOrganizations}
            />
            <NavItem
              icon="🔑"
              label="Roles & Permissions"
              active={activeSection === 'roles'}
              onClick={() => setActiveSection('roles')}
            />
          </NavSection>

          <NavSection title="Business">
            <NavItem
              icon="💳"
              label="Billing"
              active={activeSection === 'billing'}
              onClick={() => setActiveSection('billing')}
            />
            <NavItem
              icon="📈"
              label="Analytics"
              active={activeSection === 'analytics'}
              onClick={() => setActiveSection('analytics')}
            />
          </NavSection>

          <NavSection title="Security & Compliance">
            <NavItem
              icon="🛡️"
              label="Security"
              active={activeSection === 'security'}
              onClick={() => setActiveSection('security')}
            />
            <NavItem
              icon="📋"
              label="Audit Logs"
              active={activeSection === 'audit'}
              onClick={() => setActiveSection('audit')}
            />
            <NavItem
              icon="✅"
              label="Compliance"
              active={activeSection === 'compliance'}
              onClick={() => setActiveSection('compliance')}
            />
          </NavSection>

          <NavSection title="Configuration">
            <NavItem
              icon="🎨"
              label="Branding"
              active={activeSection === 'branding'}
              onClick={() => setActiveSection('branding')}
            />
            <NavItem
              icon="🔌"
              label="API & Webhooks"
              active={activeSection === 'api'}
              onClick={() => setActiveSection('api')}
            />
            <NavItem
              icon="🔗"
              label="Integrations"
              active={activeSection === 'integrations'}
              onClick={() => setActiveSection('integrations')}
            />
            <NavItem
              icon="🤖"
              label="AI Chat"
              active={activeSection === 'ai-chat'}
              onClick={() => setActiveSection('ai-chat')}
            />
            <NavItem
              icon="⚙️"
              label="Settings"
              active={activeSection === 'settings'}
              onClick={() => setActiveSection('settings')}
            />
          </NavSection>
        </nav>

        {/* Main Content */}
        <main className="superadmin-content">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'users' && <UsersSection searchQuery={searchQuery} />}
          {activeSection === 'teams' && <TeamsSection searchQuery={searchQuery} />}
          {activeSection === 'roles' && <RolesSection />}
          {activeSection === 'billing' && <BillingSection />}
          {activeSection === 'security' && <SecuritySection />}
          {activeSection === 'audit' && <AuditSection />}
          {activeSection === 'compliance' && <ComplianceSection />}
          {activeSection === 'branding' && <BrandingSection />}
          {activeSection === 'api' && <APISection />}
          {activeSection === 'integrations' && <IntegrationsSection />}
          {activeSection === 'analytics' && <AnalyticsSection />}
          {activeSection === 'ai-chat' && <AIChatConfigSection />}
          {activeSection === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
};

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

const NavSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="nav-section">
    <h3 className="nav-section-title">{title}</h3>
    <ul className="nav-items">{children}</ul>
  </div>
);

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => (
  <li className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="nav-badge">{badge > 999 ? '999+' : badge}</span>
    )}
  </li>
);

// =============================================================================
// OVERVIEW SECTION
// =============================================================================

const OverviewSection: React.FC = () => {
  const { dashboard, loading } = useSuperAdminDashboard();
  const { health } = useSystemHealth();
  const { metrics } = useRealtimeMetrics();
  const { alerts, acknowledge } = useAdminAlerts();
  const { actions, approve, reject } = usePendingActions();

  if (loading || !dashboard) {
    return <div className="loading-state">Loading dashboard...</div>;
  }

  return (
    <div className="overview-section">
      <h2>System Overview</h2>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          icon="👥"
          label="Total Users"
          value={dashboard.overview.totalUsers.toLocaleString()}
          change={`${dashboard.overview.activeUsers} active`}
          trend="up"
        />
        <MetricCard
          icon="🏢"
          label="Organizations"
          value={dashboard.overview.totalOrganizations.toLocaleString()}
          change="+3 this month"
          trend="up"
        />
        <MetricCard
          icon="💰"
          label="MRR"
          value={`$${(dashboard.overview.mrr / 1000).toFixed(1)}k`}
          change="+12% growth"
          trend="up"
        />
        <MetricCard
          icon="📊"
          label="NPS Score"
          value={dashboard.overview.nps.toString()}
          change={dashboard.overview.nps >= 50 ? 'Excellent' : 'Good'}
          trend={dashboard.overview.nps >= 50 ? 'up' : 'neutral'}
        />
      </div>

      {/* System Health */}
      {health && (
        <div className="health-panel">
          <h3>System Health</h3>
          <div className="health-status">
            <span className={`status-indicator ${health.status}`}></span>
            <span className="status-text">
              {health.status === 'healthy' ? 'All Systems Operational' :
               health.status === 'degraded' ? 'Some Systems Degraded' : 'Systems Down'}
            </span>
            <span className="uptime">Uptime: {(health.uptime / 86400).toFixed(1)} days</span>
          </div>
          <div className="services-grid">
            {health.services.map(service => (
              <div key={service.name} className={`service-status ${service.status}`}>
                <span className="service-name">{service.name}</span>
                <span className="service-indicator"></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Metrics */}
      {metrics && (
        <div className="realtime-panel">
          <h3>Real-time Metrics</h3>
          <div className="realtime-grid">
            <div className="realtime-metric">
              <span className="metric-label">Active Connections</span>
              <span className="metric-value">{metrics.activeConnections}</span>
            </div>
            <div className="realtime-metric">
              <span className="metric-label">Requests/sec</span>
              <span className="metric-value">{metrics.requestsPerSecond.toFixed(1)}</span>
            </div>
            <div className="realtime-metric">
              <span className="metric-label">Avg Latency</span>
              <span className="metric-value">{metrics.averageLatency.toFixed(0)}ms</span>
            </div>
            <div className="realtime-metric">
              <span className="metric-label">Error Rate</span>
              <span className="metric-value">{(metrics.errorRate * 100).toFixed(2)}%</span>
            </div>
            <div className="realtime-metric">
              <span className="metric-label">CPU Usage</span>
              <span className="metric-value">{(metrics.cpuUsage * 100).toFixed(1)}%</span>
            </div>
            <div className="realtime-metric">
              <span className="metric-label">Memory Usage</span>
              <span className="metric-value">{(metrics.memoryUsage * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-panel">
          <h3>Active Alerts ({alerts.filter(a => !a.acknowledgedAt).length})</h3>
          <div className="alerts-list">
            {alerts.slice(0, 5).map(alert => (
              <AlertItem key={alert.id} alert={alert} onAcknowledge={acknowledge} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Actions */}
      {actions.length > 0 && (
        <div className="actions-panel">
          <h3>Pending Actions ({actions.length})</h3>
          <div className="actions-list">
            {actions.slice(0, 5).map(action => (
              <PendingActionItem 
                key={action.id} 
                action={action} 
                onApprove={approve}
                onReject={reject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="activity-panel">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {dashboard.recentActivity.slice(0, 10).map(log => (
            <ActivityItem key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, change, trend }) => (
  <div className="metric-card">
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {change && (
        <span className={`metric-change ${trend}`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {change}
        </span>
      )}
    </div>
  </div>
);

// =============================================================================
// ALERT ITEM COMPONENT
// =============================================================================

interface AlertItemProps {
  alert: AdminAlert;
  onAcknowledge: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => (
  <div className={`alert-item ${alert.severity} ${alert.acknowledgedAt ? 'acknowledged' : ''}`}>
    <div className="alert-icon">
      {alert.severity === 'critical' && '🚨'}
      {alert.severity === 'error' && '❌'}
      {alert.severity === 'warning' && '⚠️'}
      {alert.severity === 'info' && 'ℹ️'}
    </div>
    <div className="alert-content">
      <span className="alert-title">{alert.title}</span>
      <span className="alert-message">{alert.message}</span>
      <span className="alert-time">
        {new Date(alert.createdAt).toLocaleString()}
      </span>
    </div>
    {!alert.acknowledgedAt && (
      <button className="acknowledge-btn" onClick={() => onAcknowledge(alert.id)}>
        Acknowledge
      </button>
    )}
  </div>
);

// =============================================================================
// PENDING ACTION ITEM COMPONENT
// =============================================================================

interface PendingActionItemProps {
  action: PendingAction;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string, reason: string) => void;
}

const PendingActionItem: React.FC<PendingActionItemProps> = ({ action, onApprove, onReject }) => (
  <div className={`action-item ${action.priority}`}>
    <div className="action-content">
      <span className="action-title">{action.title}</span>
      <span className="action-description">{action.description}</span>
      <span className="action-meta">
        Requested by {action.requestedBy} • {new Date(action.requestedAt).toLocaleDateString()}
      </span>
    </div>
    <div className="action-buttons">
      <button className="approve-btn" onClick={() => onApprove(action.id)}>
        ✓ Approve
      </button>
      <button className="reject-btn" onClick={() => onReject(action.id, 'Rejected by admin')}>
        ✕ Reject
      </button>
    </div>
  </div>
);

// =============================================================================
// ACTIVITY ITEM COMPONENT
// =============================================================================

const ActivityItem: React.FC<{ log: AuditLog }> = ({ log }) => (
  <div className={`activity-item ${log.severity}`}>
    <span className="activity-time">
      {new Date(log.timestamp).toLocaleTimeString()}
    </span>
    <span className="activity-action">{log.action}</span>
    <span className="activity-actor">{log.actor.name || log.actor.email || 'System'}</span>
    {log.target && (
      <span className="activity-target">{log.target.name || log.target.id}</span>
    )}
  </div>
);

// =============================================================================
// USERS SECTION
// =============================================================================

interface UsersSectionProps {
  searchQuery: string;
}

const UsersSection: React.FC<UsersSectionProps> = ({ searchQuery }) => {
  const [filters, setFilters] = useState<{
    status?: UserStatus[];
    roles?: string[];
    page: number;
    limit: number;
    search?: string;
  }>({ page: 1, limit: 20 });
  const { users, total, loading, refresh } = useUsers({ ...filters, search: searchQuery || undefined });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.ceil(total / filters.limit);

  const handleStatusFilter = (status: UserStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
      page: 1,
    }));
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    if (action === 'suspend') {
      await superAdminService.bulkUpdateUsers(userIds, { status: 'suspended' });
    } else if (action === 'activate') {
      await superAdminService.bulkUpdateUsers(userIds, { status: 'active' });
    }
    refresh();
  };

  return (
    <div className="users-section">
      <div className="section-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <span className="icon">+</span> Add User
          </button>
          <button className="btn-secondary" onClick={() => {}}>
            <span className="icon">📥</span> Import Users
          </button>
          <button className="btn-secondary" onClick={() => {}}>
            <span className="icon">📤</span> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Status:</label>
          <div className="filter-chips">
            {(['active', 'suspended', 'deactivated', 'pending'] as UserStatus[]).map(status => (
              <button
                key={status}
                className={`filter-chip ${filters.status?.includes(status) ? 'active' : ''}`}
                onClick={() => handleStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>MFA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <UserRow 
                  key={user.id} 
                  user={user} 
                  onSelect={() => setSelectedUser(user)}
                  onRefresh={refresh}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <span className="pagination-info">
          Showing {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, total)} of {total}
        </span>
        <div className="pagination-controls">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span className="page-info">Page {filters.page} of {totalPages}</span>
          <button
            disabled={filters.page === totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
};

// =============================================================================
// USER ROW COMPONENT
// =============================================================================

interface UserRowProps {
  user: User;
  onSelect: () => void;
  onRefresh: () => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onSelect, onRefresh }) => {
  const handleSuspend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Suspend user ${user.displayName}?`)) {
      await superAdminService.suspendUser(user.id, 'Admin action');
      onRefresh();
    }
  };

  const handleReactivate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await superAdminService.reactivateUser(user.id);
    onRefresh();
  };

  const handleImpersonate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await superAdminService.impersonateUser(user.id);
    // In production, this would redirect to a new session with the token
    console.log('Impersonation token:', result.token);
    alert(`Impersonating ${user.displayName}. Token expires at ${result.expiresAt}`);
  };

  return (
    <tr className="user-row" onClick={onSelect}>
      <td><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
      <td>
        <div className="user-info">
          <div className="user-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName} />
            ) : (
              <span>{user.displayName.charAt(0)}</span>
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{user.displayName}</span>
            <span className="user-title">{user.jobTitle || '-'}</span>
          </div>
        </div>
      </td>
      <td>{user.email}</td>
      <td>
        <div className="role-badges">
          {user.roles.slice(0, 2).map(role => (
            <span key={role} className="role-badge">{role}</span>
          ))}
          {user.roles.length > 2 && (
            <span className="role-badge more">+{user.roles.length - 2}</span>
          )}
        </div>
      </td>
      <td>
        <span className={`status-badge ${user.status}`}>{user.status}</span>
      </td>
      <td>
        {user.lastActivityAt ? (
          new Date(user.lastActivityAt).toLocaleDateString()
        ) : (
          <span className="text-muted">Never</span>
        )}
      </td>
      <td>
        {user.mfaEnabled ? (
          <span className="mfa-enabled">✓</span>
        ) : (
          <span className="mfa-disabled">✕</span>
        )}
      </td>
      <td>
        <div className="row-actions" onClick={e => e.stopPropagation()}>
          <button className="action-btn" onClick={handleImpersonate} title="Impersonate">
            👤
          </button>
          {user.status === 'active' ? (
            <button className="action-btn danger" onClick={handleSuspend} title="Suspend">
              ⏸
            </button>
          ) : (
            <button className="action-btn success" onClick={handleReactivate} title="Reactivate">
              ▶
            </button>
          )}
          <button className="action-btn" title="More">⋮</button>
        </div>
      </td>
    </tr>
  );
};

// =============================================================================
// USER DETAIL MODAL
// =============================================================================

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onRefresh: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'activity' | 'sessions'>('details');
  const [sessions, setSessions] = useState<Array<{
    id: string;
    device: string;
    location: string;
    ipAddress: string;
    lastActive: string;
  }>>([]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      superAdminService.getUserSessions(user.id).then(setSessions);
    }
  }, [activeTab, user.id]);

  const handleForcePasswordReset = async () => {
    if (confirm('Force password reset for this user?')) {
      await superAdminService.forcePasswordReset(user.id);
      alert('Password reset email sent.');
    }
  };

  const handleTerminateAllSessions = async () => {
    if (confirm('Terminate all sessions for this user?')) {
      await superAdminService.terminateSessions(user.id);
      alert('All sessions terminated.');
      setSessions([]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="user-header">
            <div className="user-avatar large">
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} />
              ) : (
                <span>{user.displayName.charAt(0)}</span>
              )}
            </div>
            <div className="user-header-info">
              <h2>{user.displayName}</h2>
              <span className="user-email">{user.email}</span>
              <span className={`status-badge ${user.status}`}>{user.status}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeTab === 'details' ? 'active' : ''} 
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={activeTab === 'security' ? 'active' : ''} 
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={activeTab === 'activity' ? 'active' : ''} 
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button 
            className={activeTab === 'sessions' ? 'active' : ''} 
            onClick={() => setActiveTab('sessions')}
          >
            Sessions ({sessions.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'details' && (
            <div className="user-details-tab">
              <div className="detail-group">
                <label>Full Name</label>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="detail-group">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-group">
                <label>Phone</label>
                <span>{user.phone || '-'}</span>
              </div>
              <div className="detail-group">
                <label>Job Title</label>
                <span>{user.jobTitle || '-'}</span>
              </div>
              <div className="detail-group">
                <label>Department</label>
                <span>{user.department || '-'}</span>
              </div>
              <div className="detail-group">
                <label>Location</label>
                <span>{user.location || '-'}</span>
              </div>
              <div className="detail-group">
                <label>Timezone</label>
                <span>{user.timezone}</span>
              </div>
              <div className="detail-group">
                <label>Created</label>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="detail-group">
                <label>Roles</label>
                <div className="role-badges">
                  {user.roles.map(role => (
                    <span key={role} className="role-badge">{role}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="user-security-tab">
              <div className="security-item">
                <div className="security-info">
                  <span className="security-label">MFA Status</span>
                  <span className={`security-value ${user.mfaEnabled ? 'enabled' : 'disabled'}`}>
                    {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {user.mfaEnabled && (
                  <div className="mfa-methods">
                    {user.mfaMethods.filter(m => m.enabled).map(method => (
                      <span key={method.type} className="mfa-method">
                        {method.type.toUpperCase()}
                        {method.primary && ' (Primary)'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="security-item">
                <div className="security-info">
                  <span className="security-label">Password Changed</span>
                  <span className="security-value">
                    {user.passwordChangedAt 
                      ? new Date(user.passwordChangedAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <button className="btn-warning" onClick={handleForcePasswordReset}>
                  Force Reset
                </button>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <span className="security-label">Failed Login Attempts</span>
                  <span className={`security-value ${user.failedLoginAttempts > 3 ? 'warning' : ''}`}>
                    {user.failedLoginAttempts}
                  </span>
                </div>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <span className="security-label">SSO Enabled</span>
                  <span className={`security-value ${user.ssoEnabled ? 'enabled' : 'disabled'}`}>
                    {user.ssoEnabled ? `Yes (${user.ssoProvider})` : 'No'}
                  </span>
                </div>
              </div>

              <div className="security-item">
                <div className="security-info">
                  <span className="security-label">Risk Score</span>
                  <span className={`security-value ${
                    user.metadata.riskScore > 70 ? 'danger' :
                    user.metadata.riskScore > 40 ? 'warning' : 'safe'
                  }`}>
                    {user.metadata.riskScore}/100
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="user-sessions-tab">
              <div className="sessions-header">
                <span>{sessions.length} Active Sessions</span>
                {sessions.length > 0 && (
                  <button className="btn-danger" onClick={handleTerminateAllSessions}>
                    Terminate All
                  </button>
                )}
              </div>
              <div className="sessions-list">
                {sessions.map(session => (
                  <div key={session.id} className="session-item">
                    <div className="session-device">
                      <span className="device-icon">💻</span>
                      <span className="device-name">{session.device}</span>
                    </div>
                    <div className="session-location">
                      <span className="location-icon">📍</span>
                      <span>{session.location}</span>
                    </div>
                    <div className="session-ip">{session.ipAddress}</div>
                    <div className="session-time">
                      Last active: {new Date(session.lastActive).toLocaleString()}
                    </div>
                    <button
                      className="btn-danger-small"
                      onClick={() => superAdminService.terminateSessions(user.id, [session.id])}
                    >
                      Terminate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// TEAMS SECTION
// =============================================================================

interface TeamsSectionProps {
  searchQuery: string;
}

const TeamsSection: React.FC<TeamsSectionProps> = ({ searchQuery }) => {
  const { teams, total, loading, refresh } = useTeams({ search: searchQuery || undefined });

  return (
    <div className="teams-section">
      <div className="section-header">
        <h2>Team Management</h2>
        <div className="header-actions">
          <button className="btn-primary">
            <span className="icon">+</span> Create Team
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading teams...</div>
      ) : (
        <div className="teams-grid">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} onRefresh={refresh} />
          ))}
        </div>
      )}
    </div>
  );
};

const TeamCard: React.FC<{ team: Team; onRefresh: () => void }> = ({ team, onRefresh }) => (
  <div className="team-card">
    <div className="team-header">
      <h3>{team.name}</h3>
      <span className={`visibility-badge ${team.visibility}`}>{team.visibility}</span>
    </div>
    <p className="team-description">{team.description || 'No description'}</p>
    <div className="team-stats">
      <div className="stat">
        <span className="stat-value">{team.metrics.memberCount}</span>
        <span className="stat-label">Members</span>
      </div>
      <div className="stat">
        <span className="stat-value">{team.metrics.activeMembers}</span>
        <span className="stat-label">Active</span>
      </div>
      <div className="stat">
        <span className="stat-value">{(team.metrics.storageUsed / 1024 / 1024).toFixed(1)}MB</span>
        <span className="stat-label">Storage</span>
      </div>
    </div>
    <div className="team-actions">
      <button className="btn-secondary">Manage</button>
      <button className="btn-text">View Members</button>
    </div>
  </div>
);

// =============================================================================
// ROLES SECTION
// =============================================================================

const RolesSection: React.FC = () => {
  const { roles, loading, createRole, updateRole, deleteRole } = useRoles();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="roles-section">
      <div className="section-header">
        <h2>Roles & Permissions</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <span className="icon">+</span> Create Custom Role
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading roles...</div>
      ) : (
        <div className="roles-list">
          {roles.map(role => (
            <RoleCard key={role.id} role={role} onUpdate={updateRole} onDelete={deleteRole} />
          ))}
        </div>
      )}
    </div>
  );
};

interface RoleCardProps {
  role: Role;
  onUpdate: (roleId: string, updates: Partial<Role>) => Promise<Role>;
  onDelete: (roleId: string, transferTo: string) => Promise<void>;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, onUpdate, onDelete }) => (
  <div className={`role-card ${role.type}`}>
    <div className="role-header">
      <h3>{role.name}</h3>
      <span className={`type-badge ${role.type}`}>{role.type}</span>
    </div>
    <p className="role-description">{role.description}</p>
    <div className="role-permissions">
      <span className="permissions-count">{role.permissions.length} permissions</span>
    </div>
    {role.type === 'custom' && (
      <div className="role-actions">
        <button className="btn-secondary">Edit</button>
        <button className="btn-danger-text">Delete</button>
      </div>
    )}
  </div>
);

// =============================================================================
// PLACEHOLDER SECTIONS
// =============================================================================

const BillingSection: React.FC = () => (
  <div className="section-placeholder">
    <h2>💳 Billing & Subscription</h2>
    <p>Manage subscriptions, invoices, payment methods, and billing settings.</p>
    <div className="features-list">
      <div className="feature">✓ Plan management (Free/Starter/Pro/Enterprise)</div>
      <div className="feature">✓ Seat management with proration</div>
      <div className="feature">✓ Invoice history with PDF download</div>
      <div className="feature">✓ Multiple payment methods (Card, Bank, PayPal)</div>
      <div className="feature">✓ Usage-based billing tracking</div>
      <div className="feature">✓ Budget alerts and cost center allocation</div>
    </div>
  </div>
);

const SecuritySection: React.FC = () => {
  const { settings, loading, updateSettings } = useSecuritySettings();

  return (
    <div className="security-section">
      <h2>🛡️ Security Settings</h2>
      {loading ? (
        <div className="loading-state">Loading security settings...</div>
      ) : settings && (
        <div className="security-panels">
          <div className="security-panel">
            <h3>Authentication</h3>
            <div className="setting-item">
              <label>Require MFA</label>
              <input 
                type="checkbox" 
                checked={settings.authentication.mfaRequired}
                onChange={e => updateSettings({
                  authentication: { ...settings.authentication, mfaRequired: e.target.checked }
                })}
              />
            </div>
            <div className="setting-item">
              <label>SSO Enabled</label>
              <input 
                type="checkbox" 
                checked={settings.authentication.ssoEnabled}
                onChange={e => updateSettings({
                  authentication: { ...settings.authentication, ssoEnabled: e.target.checked }
                })}
              />
            </div>
            <div className="setting-item">
              <label>Session Timeout (minutes)</label>
              <input 
                type="number" 
                value={settings.authentication.sessionTimeout}
                onChange={e => updateSettings({
                  authentication: { ...settings.authentication, sessionTimeout: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <div className="security-panel">
            <h3>Access Control</h3>
            <div className="setting-item">
              <label>IP Whitelist Enabled</label>
              <input 
                type="checkbox" 
                checked={settings.accessControl.ipWhitelistEnabled}
              />
            </div>
            <div className="setting-item">
              <label>Geo Restrictions Enabled</label>
              <input 
                type="checkbox" 
                checked={settings.accessControl.geoRestrictionsEnabled}
              />
            </div>
          </div>

          <div className="security-panel">
            <h3>Data Protection</h3>
            <div className="setting-item">
              <label>Encryption at Rest</label>
              <input 
                type="checkbox" 
                checked={settings.dataProtection.encryptionAtRestEnabled}
                disabled
              />
              <span className="helper">Always enabled</span>
            </div>
            <div className="setting-item">
              <label>DLP Enabled</label>
              <input 
                type="checkbox" 
                checked={settings.dataProtection.dlpEnabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuditSection: React.FC = () => {
  const [filters, setFilters] = useState<{ page: number; limit: number }>({ page: 1, limit: 50 });
  const { logs, total, loading } = useAuditLogs(filters);

  return (
    <div className="audit-section">
      <div className="section-header">
        <h2>📋 Audit Logs</h2>
        <div className="header-actions">
          <button className="btn-secondary">
            <span className="icon">📤</span> Export
          </button>
        </div>
      </div>

      <div className="audit-filters">
        <select>
          <option value="">All Categories</option>
          <option value="authentication">Authentication</option>
          <option value="user_management">User Management</option>
          <option value="permission_change">Permission Changes</option>
          <option value="data_access">Data Access</option>
          <option value="security">Security</option>
        </select>
        <select>
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <input type="date" placeholder="Start Date" />
        <input type="date" placeholder="End Date" />
      </div>

      {loading ? (
        <div className="loading-state">Loading audit logs...</div>
      ) : (
        <div className="audit-logs-list">
          {logs.map(log => (
            <div key={log.id} className={`audit-log-item ${log.severity}`}>
              <div className="log-timestamp">
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div className="log-category">{log.category}</div>
              <div className="log-action">{log.action}</div>
              <div className="log-actor">
                {log.actor.name || log.actor.email || 'System'}
                <span className="actor-ip">{log.actor.ipAddress}</span>
              </div>
              <div className={`log-result ${log.result}`}>{log.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ComplianceSection: React.FC = () => (
  <div className="section-placeholder">
    <h2>✅ Compliance</h2>
    <p>Manage compliance frameworks, data subject rights, and legal holds.</p>
    <div className="compliance-frameworks">
      <div className="framework-card compliant">
        <span className="framework-name">GDPR</span>
        <span className="framework-status">Compliant</span>
        <span className="framework-score">95%</span>
      </div>
      <div className="framework-card partial">
        <span className="framework-name">SOC 2 Type II</span>
        <span className="framework-status">Partial</span>
        <span className="framework-score">78%</span>
      </div>
      <div className="framework-card compliant">
        <span className="framework-name">ISO 27001</span>
        <span className="framework-status">Compliant</span>
        <span className="framework-score">92%</span>
      </div>
      <div className="framework-card not-applicable">
        <span className="framework-name">HIPAA</span>
        <span className="framework-status">N/A</span>
      </div>
    </div>
  </div>
);

const BrandingSection: React.FC = () => (
  <div className="section-placeholder">
    <h2>🎨 Branding & White-Label</h2>
    <p>Customize your organization's branding and white-label settings.</p>
    <div className="features-list">
      <div className="feature">✓ Custom logo (primary, secondary, icon)</div>
      <div className="feature">✓ Color scheme customization</div>
      <div className="feature">✓ Custom domain with SSL</div>
      <div className="feature">✓ Email branding and templates</div>
      <div className="feature">✓ Full white-label (remove platform branding)</div>
      <div className="feature">✓ Custom mobile apps</div>
    </div>
  </div>
);

const APISection: React.FC = () => (
  <div className="section-placeholder">
    <h2>🔌 API & Webhooks</h2>
    <p>Manage API keys, OAuth apps, and webhook configurations.</p>
    <div className="features-list">
      <div className="feature">✓ API key generation with scopes</div>
      <div className="feature">✓ OAuth 2.0 app registration</div>
      <div className="feature">✓ Rate limiting configuration</div>
      <div className="feature">✓ Webhook endpoints with retry policies</div>
      <div className="feature">✓ API usage analytics</div>
      <div className="feature">✓ IP restrictions per key</div>
    </div>
  </div>
);

const IntegrationsSection: React.FC = () => (
  <div className="section-placeholder">
    <h2>🔗 Integrations</h2>
    <p>Manage third-party integrations and connected apps.</p>
    <div className="integrations-grid">
      <div className="integration-card installed">
        <span className="integration-icon">📧</span>
        <span className="integration-name">Salesforce</span>
        <span className="integration-status">Connected</span>
      </div>
      <div className="integration-card installed">
        <span className="integration-icon">💬</span>
        <span className="integration-name">Slack</span>
        <span className="integration-status">Connected</span>
      </div>
      <div className="integration-card available">
        <span className="integration-icon">📊</span>
        <span className="integration-name">HubSpot</span>
        <span className="integration-status">Available</span>
      </div>
      <div className="integration-card available">
        <span className="integration-icon">📞</span>
        <span className="integration-name">Twilio</span>
        <span className="integration-status">Available</span>
      </div>
    </div>
  </div>
);

const AnalyticsSection: React.FC = () => (
  <div className="section-placeholder">
    <h2>📈 Analytics & Reporting</h2>
    <p>View dashboards, create custom reports, and export data.</p>
    <div className="features-list">
      <div className="feature">✓ Real-time analytics dashboard</div>
      <div className="feature">✓ User engagement metrics</div>
      <div className="feature">✓ Call center KPIs</div>
      <div className="feature">✓ Custom report builder</div>
      <div className="feature">✓ Scheduled report delivery</div>
      <div className="feature">✓ Export to PDF, CSV, Excel</div>
    </div>
  </div>
);

// =============================================================================
// AI CHAT CONFIGURATION SECTION
// =============================================================================

interface AIChatConfig {
  openaiEnabled: boolean;
  openaiModel: string;
  openaiTemperature: number;
  openaiMaxTokens: number;
  voiceInputEnabled: boolean;
  ttsEnabled: boolean;
  ttsAutoSpeak: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
  chatContexts: {
    sales: boolean;
    support: boolean;
    general: boolean;
  };
  welcomeMessages: {
    sales: string;
    support: string;
    general: string;
  };
}

const AIChatConfigSection: React.FC = () => {
  const [config, setConfig] = useState<AIChatConfig>({
    openaiEnabled: true,
    openaiModel: 'gpt-4o',
    openaiTemperature: 0.7,
    openaiMaxTokens: 2000,
    voiceInputEnabled: true,
    ttsEnabled: true,
    ttsAutoSpeak: false,
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVolume: 1.0,
    chatContexts: {
      sales: true,
      support: true,
      general: true,
    },
    welcomeMessages: {
      sales: "👋 Hi! I'm CUBE's AI assistant. I can help you learn about our automation platform, pricing, and how CUBE can help your business. What would you like to know?",
      support: "👋 Hi! I'm here to help with any questions about CUBE. How can I assist you today?",
      general: "👋 Hello! I'm CUBE's AI assistant. How can I help you today?",
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save AI config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-chat-config-section">
      <div className="section-header">
        <h2>🤖 AI Chat Configuration</h2>
        <p>Configure AI-powered chat assistant settings including OpenAI integration, voice input/output, and chat behavior.</p>
      </div>

      {/* OpenAI Configuration */}
      <div className="config-card">
        <div className="config-card-header">
          <h3>
            <span className="icon">🧠</span>
            OpenAI Integration
          </h3>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={config.openaiEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, openaiEnabled: e.target.checked }))}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="config-card-body">
          <div className="config-row">
            <label>API Key</label>
            <div className="api-key-input">
              <input 
                type={apiKeyVisible ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                disabled={!config.openaiEnabled}
              />
              <button 
                type="button"
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
                className="toggle-visibility"
              >
                {apiKeyVisible ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="config-hint">Your OpenAI API key for GPT models</span>
          </div>
          <div className="config-row">
            <label>Model</label>
            <select 
              value={config.openaiModel}
              onChange={(e) => setConfig(prev => ({ ...prev, openaiModel: e.target.value }))}
              disabled={!config.openaiEnabled}
            >
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
            </select>
          </div>
          <div className="config-row">
            <label>Temperature: {config.openaiTemperature}</label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              value={config.openaiTemperature}
              onChange={(e) => setConfig(prev => ({ ...prev, openaiTemperature: parseFloat(e.target.value) }))}
              disabled={!config.openaiEnabled}
            />
            <span className="config-hint">Lower = more focused, Higher = more creative</span>
          </div>
          <div className="config-row">
            <label>Max Tokens: {config.openaiMaxTokens}</label>
            <input 
              type="range" 
              min="500" 
              max="4000" 
              step="100"
              value={config.openaiMaxTokens}
              onChange={(e) => setConfig(prev => ({ ...prev, openaiMaxTokens: parseInt(e.target.value) }))}
              disabled={!config.openaiEnabled}
            />
            <span className="config-hint">Maximum length of AI responses</span>
          </div>
        </div>
      </div>

      {/* Voice Input Configuration */}
      <div className="config-card">
        <div className="config-card-header">
          <h3>
            <span className="icon">🎤</span>
            Voice Input (Speech-to-Text)
          </h3>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={config.voiceInputEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, voiceInputEnabled: e.target.checked }))}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="config-card-body">
          <p className="config-info">
            Enable voice input to allow users to speak their messages instead of typing. 
            Uses the browser's Web Speech API for speech recognition.
          </p>
          <div className="config-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Real-time speech recognition</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Multiple language support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Auto-send on speech completion</span>
            </div>
          </div>
        </div>
      </div>

      {/* TTS Configuration */}
      <div className="config-card">
        <div className="config-card-header">
          <h3>
            <span className="icon">🔊</span>
            Voice Output (Text-to-Speech)
          </h3>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={config.ttsEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, ttsEnabled: e.target.checked }))}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="config-card-body">
          <div className="config-row">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={config.ttsAutoSpeak}
                onChange={(e) => setConfig(prev => ({ ...prev, ttsAutoSpeak: e.target.checked }))}
                disabled={!config.ttsEnabled}
              />
              Auto-speak AI responses
            </label>
            <span className="config-hint">Automatically read AI responses aloud</span>
          </div>
          <div className="config-row">
            <label>Speech Rate: {config.ttsRate.toFixed(1)}x</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1"
              value={config.ttsRate}
              onChange={(e) => setConfig(prev => ({ ...prev, ttsRate: parseFloat(e.target.value) }))}
              disabled={!config.ttsEnabled}
            />
          </div>
          <div className="config-row">
            <label>Pitch: {config.ttsPitch.toFixed(1)}</label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1"
              value={config.ttsPitch}
              onChange={(e) => setConfig(prev => ({ ...prev, ttsPitch: parseFloat(e.target.value) }))}
              disabled={!config.ttsEnabled}
            />
          </div>
          <div className="config-row">
            <label>Volume: {Math.round(config.ttsVolume * 100)}%</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={config.ttsVolume}
              onChange={(e) => setConfig(prev => ({ ...prev, ttsVolume: parseFloat(e.target.value) }))}
              disabled={!config.ttsEnabled}
            />
          </div>
        </div>
      </div>

      {/* Chat Contexts */}
      <div className="config-card">
        <div className="config-card-header">
          <h3>
            <span className="icon">💬</span>
            Chat Contexts
          </h3>
        </div>
        <div className="config-card-body">
          <p className="config-info">Enable or disable chat contexts for different use cases.</p>
          <div className="contexts-grid">
            <label className="context-toggle">
              <input 
                type="checkbox" 
                checked={config.chatContexts.sales}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  chatContexts: { ...prev.chatContexts, sales: e.target.checked }
                }))}
              />
              <span className="context-label">
                <span className="context-icon">💰</span>
                <span className="context-name">Sales</span>
                <span className="context-desc">Product info, pricing, demos</span>
              </span>
            </label>
            <label className="context-toggle">
              <input 
                type="checkbox" 
                checked={config.chatContexts.support}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  chatContexts: { ...prev.chatContexts, support: e.target.checked }
                }))}
              />
              <span className="context-label">
                <span className="context-icon">🛠️</span>
                <span className="context-name">Support</span>
                <span className="context-desc">Help, troubleshooting, docs</span>
              </span>
            </label>
            <label className="context-toggle">
              <input 
                type="checkbox" 
                checked={config.chatContexts.general}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  chatContexts: { ...prev.chatContexts, general: e.target.checked }
                }))}
              />
              <span className="context-label">
                <span className="context-icon">💡</span>
                <span className="context-name">General</span>
                <span className="context-desc">General inquiries</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Welcome Messages */}
      <div className="config-card">
        <div className="config-card-header">
          <h3>
            <span className="icon">👋</span>
            Welcome Messages
          </h3>
        </div>
        <div className="config-card-body">
          <p className="config-info">Customize the welcome message for each chat context.</p>
          <div className="config-row">
            <label>Sales Context</label>
            <textarea 
              value={config.welcomeMessages.sales}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                welcomeMessages: { ...prev.welcomeMessages, sales: e.target.value }
              }))}
              rows={3}
              disabled={!config.chatContexts.sales}
            />
          </div>
          <div className="config-row">
            <label>Support Context</label>
            <textarea 
              value={config.welcomeMessages.support}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                welcomeMessages: { ...prev.welcomeMessages, support: e.target.value }
              }))}
              rows={3}
              disabled={!config.chatContexts.support}
            />
          </div>
          <div className="config-row">
            <label>General Context</label>
            <textarea 
              value={config.welcomeMessages.general}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                welcomeMessages: { ...prev.welcomeMessages, general: e.target.value }
              }))}
              rows={3}
              disabled={!config.chatContexts.general}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="config-actions">
        <button 
          className={`btn-primary save-btn ${saving ? 'saving' : ''} ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : saved ? (
            <>
              <span className="icon">✓</span>
              Saved!
            </>
          ) : (
            <>
              <span className="icon">💾</span>
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SettingsSection: React.FC = () => (
  <div className="section-placeholder">
    <h2>⚙️ System Settings</h2>
    <p>Configure global system settings and preferences.</p>
    <div className="settings-groups">
      <div className="settings-group">
        <h3>General</h3>
        <div className="setting-row">
          <label>Default Timezone</label>
          <select>
            <option>UTC</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
          </select>
        </div>
        <div className="setting-row">
          <label>Default Language</label>
          <select>
            <option>English</option>
            <option>Spanish</option>
            <option>Portuguese</option>
          </select>
        </div>
      </div>
      <div className="settings-group">
        <h3>Maintenance</h3>
        <button className="btn-warning">Enable Maintenance Mode</button>
      </div>
      <div className="settings-group">
        <h3>Announcements</h3>
        <button className="btn-primary">Broadcast Announcement</button>
      </div>
    </div>
  </div>
);

export default SuperAdminDashboard;
