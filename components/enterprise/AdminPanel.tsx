// ============================================
// CUBE Elite v6 - Admin Panel Component
// Fortune 500 Ready - React Component
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useEnterprise } from '../../hooks/useEnterpriseServices';
import type { Tenant, TenantMember, TenantSettings, AuditEvent } from '../../hooks/useEnterpriseServices';
import './AdminPanel.css';

// ============================================
// Types
// ============================================

type AdminSection = 'overview' | 'users' | 'billing' | 'security' | 'audit' | 'settings';

interface AdminPanelProps {
  tenantId: string;
  userId: string;
  onClose?: () => void;
}

// ============================================
// Sub-Components
// ============================================

interface SidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  tenant?: Tenant | null;
}

const AdminSidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, tenant }) => {
  const sections: { id: AdminSection; icon: string; label: string }[] = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'users', icon: '👥', label: 'Team Members' },
    { id: 'billing', icon: '💳', label: 'Billing' },
    { id: 'security', icon: '🔒', label: 'Security' },
    { id: 'audit', icon: '📋', label: 'Audit Logs' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <h2 className="admin-sidebar__title">Admin Panel</h2>
        {tenant && (
          <span className={`plan-indicator plan-indicator--${tenant.plan}`}>
            {tenant.plan.toUpperCase()}
          </span>
        )}
      </div>
      <nav className="admin-sidebar__nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'nav-item--active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="nav-item__icon">{section.icon}</span>
            <span className="nav-item__label">{section.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

// ============================================
// Overview Section
// ============================================

interface OverviewSectionProps {
  tenant: Tenant | null;
  members: TenantMember[];
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ tenant, members }) => {
  if (!tenant) return <div className="section-loading">Loading tenant data...</div>;

  const activeMembers = members.filter(m => m.status === 'active').length;
  const pendingMembers = members.filter(m => m.status === 'pending').length;

  return (
    <div className="admin-section overview-section">
      <h2 className="section-title">Organization Overview</h2>
      
      <div className="overview-cards">
        <div className="overview-card">
          <div className="overview-card__header">
            <span className="overview-card__icon">🏢</span>
            <h3>Organization</h3>
          </div>
          <div className="overview-card__content">
            <p><strong>Name:</strong> {tenant.name}</p>
            <p><strong>Slug:</strong> {tenant.slug}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge status-badge--${tenant.status}`}>
                {tenant.status}
              </span>
            </p>
            <p><strong>Created:</strong> {new Date(tenant.created_at * 1000).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card__header">
            <span className="overview-card__icon">👥</span>
            <h3>Team</h3>
          </div>
          <div className="overview-card__content">
            <p><strong>Total Members:</strong> {members.length}</p>
            <p><strong>Active:</strong> {activeMembers}</p>
            <p><strong>Pending:</strong> {pendingMembers}</p>
            <p><strong>Limit:</strong> {tenant.limits.max_users === -1 ? 'Unlimited' : tenant.limits.max_users}</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card__header">
            <span className="overview-card__icon">📦</span>
            <h3>Plan Limits</h3>
          </div>
          <div className="overview-card__content">
            <p><strong>Storage:</strong> {tenant.limits.max_storage_gb === -1 ? 'Unlimited' : `${tenant.limits.max_storage_gb} GB`}</p>
            <p><strong>API Calls:</strong> {tenant.limits.max_api_calls_per_month === -1 ? 'Unlimited' : tenant.limits.max_api_calls_per_month.toLocaleString()}/mo</p>
            <p><strong>Workflows:</strong> {tenant.limits.max_workflows === -1 ? 'Unlimited' : tenant.limits.max_workflows}</p>
            <p><strong>Automations:</strong> {tenant.limits.max_automations === -1 ? 'Unlimited' : tenant.limits.max_automations}</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card__header">
            <span className="overview-card__icon">🔐</span>
            <h3>Security</h3>
          </div>
          <div className="overview-card__content">
            <p><strong>SSO:</strong> {tenant.settings.sso_enabled ? '✅ Enabled' : '❌ Disabled'}</p>
            <p><strong>MFA Required:</strong> {tenant.settings.mfa_required ? '✅ Yes' : '❌ No'}</p>
            <p><strong>IP Whitelist:</strong> {tenant.settings.ip_whitelist.length > 0 ? `${tenant.settings.ip_whitelist.length} IPs` : 'None'}</p>
            <p><strong>Domain Restriction:</strong> {tenant.settings.allowed_email_domains.length > 0 ? `${tenant.settings.allowed_email_domains.length} domains` : 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Users Section
// ============================================

interface UsersSectionProps {
  tenantId: string;
  members: TenantMember[];
  onInvite: (email: string, role: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  loading: boolean;
}

const UsersSection: React.FC<UsersSectionProps> = ({ 
  tenantId, 
  members, 
  onInvite, 
  onRemove,
  loading 
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await onInvite(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite user:', error);
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'role-badge--owner';
      case 'admin': return 'role-badge--admin';
      case 'member': return 'role-badge--member';
      case 'viewer': return 'role-badge--viewer';
      default: return '';
    }
  };

  return (
    <div className="admin-section users-section">
      <div className="section-header">
        <h2 className="section-title">Team Members</h2>
        <button 
          className="btn btn--primary"
          onClick={() => setShowInviteModal(true)}
        >
          + Invite Member
        </button>
      </div>

      {loading ? (
        <div className="section-loading">Loading members...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{member.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${member.status}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>{new Date(member.joined_at * 1000).toLocaleDateString()}</td>
                  <td>
                    {member.role !== 'owner' && (
                      <button 
                        className="btn btn--danger btn--small"
                        onClick={() => onRemove(member.user_id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Invite Team Member</h3>
              <button 
                className="modal__close"
                onClick={() => setShowInviteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="form-select"
                >
                  <option value="viewer">Viewer - Can view data</option>
                  <option value="member">Member - Can create & edit</option>
                  <option value="admin">Admin - Full access</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button 
                className="btn btn--secondary"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn--primary"
                onClick={handleInvite}
                disabled={!inviteEmail || inviting}
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Security Section
// ============================================

interface SecuritySectionProps {
  tenant: Tenant | null;
  onUpdateSettings: (settings: Partial<TenantSettings>) => Promise<void>;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ tenant, onUpdateSettings }) => {
  const [ssoEnabled, setSsoEnabled] = useState(tenant?.settings.sso_enabled || false);
  const [mfaRequired, setMfaRequired] = useState(tenant?.settings.mfa_required || false);
  const [ipWhitelist, setIpWhitelist] = useState(tenant?.settings.ip_whitelist.join(', ') || '');
  const [emailDomains, setEmailDomains] = useState(tenant?.settings.allowed_email_domains.join(', ') || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setSsoEnabled(tenant.settings.sso_enabled);
      setMfaRequired(tenant.settings.mfa_required);
      setIpWhitelist(tenant.settings.ip_whitelist.join(', '));
      setEmailDomains(tenant.settings.allowed_email_domains.join(', '));
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      await onUpdateSettings({
        ...tenant.settings,
        sso_enabled: ssoEnabled,
        mfa_required: mfaRequired,
        ip_whitelist: ipWhitelist.split(',').map(ip => ip.trim()).filter(Boolean),
        allowed_email_domains: emailDomains.split(',').map(d => d.trim()).filter(Boolean),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) return <div className="section-loading">Loading security settings...</div>;

  return (
    <div className="admin-section security-section">
      <div className="section-header">
        <h2 className="section-title">Security Settings</h2>
        <button 
          className="btn btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card__header">
            <h3>🔐 Single Sign-On (SSO)</h3>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={ssoEnabled}
                onChange={e => setSsoEnabled(e.target.checked)}
                disabled={tenant.plan === 'starter'}
              />
              <span className="toggle__slider"></span>
            </label>
          </div>
          <p className="settings-card__description">
            Enable SSO to allow team members to sign in using your identity provider (SAML, OIDC).
          </p>
          {tenant.plan === 'starter' && (
            <p className="settings-card__upgrade">
              🔒 Upgrade to Professional or Enterprise to enable SSO
            </p>
          )}
        </div>

        <div className="settings-card">
          <div className="settings-card__header">
            <h3>🔑 Require MFA</h3>
            <label className="toggle">
              <input 
                type="checkbox" 
                checked={mfaRequired}
                onChange={e => setMfaRequired(e.target.checked)}
              />
              <span className="toggle__slider"></span>
            </label>
          </div>
          <p className="settings-card__description">
            Require all team members to set up multi-factor authentication.
          </p>
        </div>

        <div className="settings-card settings-card--full">
          <h3>🌐 IP Whitelist</h3>
          <p className="settings-card__description">
            Restrict access to specific IP addresses (comma-separated).
          </p>
          <textarea
            className="form-textarea"
            value={ipWhitelist}
            onChange={e => setIpWhitelist(e.target.value)}
            placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
            rows={3}
          />
        </div>

        <div className="settings-card settings-card--full">
          <h3>📧 Email Domain Restriction</h3>
          <p className="settings-card__description">
            Only allow users with these email domains to join (comma-separated).
          </p>
          <textarea
            className="form-textarea"
            value={emailDomains}
            onChange={e => setEmailDomains(e.target.value)}
            placeholder="e.g., company.com, subsidiary.com"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Audit Section
// ============================================

interface AuditSectionProps {
  events: AuditEvent[];
  onQuery: (query: { category?: string; severity?: string }) => Promise<void>;
  onExport: (format: 'json' | 'csv') => Promise<void>;
  loading: boolean;
}

const AuditSection: React.FC<AuditSectionProps> = ({ 
  events, 
  onQuery, 
  onExport,
  loading 
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const handleFilter = () => {
    onQuery({ 
      category: categoryFilter || undefined, 
      severity: severityFilter || undefined 
    });
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'severity--critical';
      case 'warning': return 'severity--warning';
      default: return 'severity--info';
    }
  };

  return (
    <div className="admin-section audit-section">
      <div className="section-header">
        <h2 className="section-title">Audit Logs</h2>
        <div className="header-actions">
          <button 
            className="btn btn--secondary"
            onClick={() => onExport('csv')}
          >
            📤 Export CSV
          </button>
          <button 
            className="btn btn--secondary"
            onClick={() => onExport('json')}
          >
            📤 Export JSON
          </button>
        </div>
      </div>

      <div className="audit-filters">
        <select
          className="form-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="authentication">Authentication</option>
          <option value="data_access">Data Access</option>
          <option value="security">Security</option>
          <option value="admin">Admin</option>
          <option value="billing">Billing</option>
        </select>
        <select
          className="form-select"
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button className="btn btn--primary" onClick={handleFilter}>
          Apply Filters
        </button>
      </div>

      {loading ? (
        <div className="section-loading">Loading audit logs...</div>
      ) : (
        <div className="audit-table-container">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No audit events found
                  </td>
                </tr>
              ) : (
                events.map(event => (
                  <tr key={event.id}>
                    <td>{new Date(event.created_at * 1000).toLocaleString()}</td>
                    <td>{event.action}</td>
                    <td>{event.user_id}</td>
                    <td>
                      <span className="category-badge">{event.category}</span>
                    </td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(event.severity)}`}>
                        {event.severity}
                      </span>
                    </td>
                    <td>{event.resource_type} {event.resource_id || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================
// Settings Section
// ============================================

interface SettingsSectionProps {
  tenant: Tenant | null;
  onUpdateSettings: (settings: Partial<TenantSettings>) => Promise<void>;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ tenant, onUpdateSettings }) => {
  const [customDomain, setCustomDomain] = useState(tenant?.settings.custom_domain || '');
  const [logoUrl, setLogoUrl] = useState(tenant?.settings.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(tenant?.settings.primary_color || '#3b82f6');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setCustomDomain(tenant.settings.custom_domain || '');
      setLogoUrl(tenant.settings.logo_url || '');
      setPrimaryColor(tenant.settings.primary_color || '#3b82f6');
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      await onUpdateSettings({
        ...tenant.settings,
        custom_domain: customDomain || undefined,
        logo_url: logoUrl || undefined,
        primary_color: primaryColor || undefined,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) return <div className="section-loading">Loading settings...</div>;

  return (
    <div className="admin-section settings-section">
      <div className="section-header">
        <h2 className="section-title">Organization Settings</h2>
        <button 
          className="btn btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-card settings-card--full">
          <h3>🌐 Custom Domain</h3>
          <p className="settings-card__description">
            Use your own domain for accessing the platform (e.g., app.yourcompany.com).
          </p>
          <input
            type="text"
            className="form-input"
            value={customDomain}
            onChange={e => setCustomDomain(e.target.value)}
            placeholder="app.yourcompany.com"
            disabled={tenant.plan !== 'enterprise' && tenant.plan !== 'unlimited'}
          />
          {tenant.plan !== 'enterprise' && tenant.plan !== 'unlimited' && (
            <p className="settings-card__upgrade">
              🔒 Upgrade to Enterprise to use custom domains
            </p>
          )}
        </div>

        <div className="settings-card">
          <h3>🖼️ Logo URL</h3>
          <p className="settings-card__description">
            URL to your organization's logo.
          </p>
          <input
            type="url"
            className="form-input"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://yourcompany.com/logo.png"
          />
        </div>

        <div className="settings-card">
          <h3>🎨 Primary Color</h3>
          <p className="settings-card__description">
            Brand color for the interface.
          </p>
          <div className="color-picker">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              placeholder="#3b82f6"
            />
          </div>
        </div>

        <div className="settings-card settings-card--full danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <p className="settings-card__description">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="danger-actions">
            <button className="btn btn--danger">
              Export All Data
            </button>
            <button className="btn btn--danger">
              Delete Organization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const AdminPanel: React.FC<AdminPanelProps> = ({
  tenantId,
  userId,
  onClose = () => {},
}) => {
  const { multiTenant, payment, audit } = useEnterprise();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const loadData = useCallback(async () => {
    try {
      await multiTenant.getTenant(tenantId);
      await multiTenant.listMembers(tenantId);
      await audit.queryEvents({ tenant_id: tenantId, limit: 100 });
      
      try {
        await payment.getCustomer(userId);
      } catch {
        // Customer might not exist
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  }, [tenantId, userId, multiTenant, payment, audit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInviteUser = async (email: string, role: string) => {
    await multiTenant.inviteUser(tenantId, email, role);
    await audit.logEvent(
      userId,
      'user.invited',
      'user',
      'admin',
      'info',
      { tenantId, details: { email, role } }
    );
  };

  const handleRemoveUser = async (memberUserId: string) => {
    await multiTenant.removeMember(tenantId, memberUserId);
    await multiTenant.listMembers(tenantId);
    await audit.logEvent(
      userId,
      'user.removed',
      'user',
      'admin',
      'warning',
      { tenantId, resourceId: memberUserId }
    );
  };

  const handleUpdateSettings = async (settings: Partial<TenantSettings>) => {
    const currentSettings = multiTenant.currentTenant?.settings;
    if (!currentSettings) return;
    
    await multiTenant.updateSettings(tenantId, { ...currentSettings, ...settings });
    await audit.logEvent(
      userId,
      'settings.updated',
      'tenant',
      'admin',
      'info',
      { tenantId, details: { changes: Object.keys(settings) } }
    );
  };

  const handleAuditQuery = async (query: { category?: string; severity?: string }) => {
    await audit.queryEvents({
      tenant_id: tenantId,
      ...query,
      limit: 100,
    });
  };

  const handleAuditExport = async (format: 'json' | 'csv') => {
    await audit.downloadExport(
      { tenant_id: tenantId },
      format,
      `audit-logs-${new Date().toISOString().split('T')[0]}`
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            tenant={multiTenant.currentTenant} 
            members={multiTenant.members}
          />
        );
      case 'users':
        return (
          <UsersSection
            tenantId={tenantId}
            members={multiTenant.members}
            onInvite={handleInviteUser}
            onRemove={handleRemoveUser}
            loading={multiTenant.loading}
          />
        );
      case 'billing':
        return (
          <div className="admin-section">
            <h2 className="section-title">Billing & Subscription</h2>
            <p>Billing management coming soon...</p>
          </div>
        );
      case 'security':
        return (
          <SecuritySection
            tenant={multiTenant.currentTenant}
            onUpdateSettings={handleUpdateSettings}
          />
        );
      case 'audit':
        return (
          <AuditSection
            events={audit.events}
            onQuery={handleAuditQuery}
            onExport={handleAuditExport}
            loading={audit.loading}
          />
        );
      case 'settings':
        return (
          <SettingsSection
            tenant={multiTenant.currentTenant}
            onUpdateSettings={handleUpdateSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-panel">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        tenant={multiTenant.currentTenant}
      />
      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Panel - {multiTenant.currentTenant?.name || 'Loading...'}</h1>
          <button className="btn btn--ghost" onClick={onClose}>
            ✕ Close
          </button>
        </header>
        <div className="admin-content">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
