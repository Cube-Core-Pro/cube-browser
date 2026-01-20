/**
 * TenantSettings Component
 * 
 * Comprehensive multi-tenant management interface for enterprise customers.
 * Provides tenant configuration, user management, invitations, usage metrics,
 * and white-label customization.
 * 
 * @component
 * @example
 * ```tsx
 * <TenantSettings
 *   tenantId={currentTenantId}
 *   onClose={() => setShowTenantSettings(false)}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './TenantSettings.css';

// ============================================
// Types & Interfaces
// ============================================

interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  settings: TenantSettings;
  limits: TenantLimits;
  created_at: string;
  updated_at: string;
}

interface TenantSettings {
  allow_member_invites: boolean;
  default_member_role: string;
  require_2fa: boolean;
  session_timeout_minutes: number;
  allowed_domains: string[];
  custom_branding: CustomBranding;
}

interface CustomBranding {
  logo_url: string;
  primary_color: string;
  accent_color: string;
  company_name: string;
}

interface TenantLimits {
  max_users: number;
  max_workflows: number;
  max_profiles: number;
  max_storage_gb: number;
}

interface TenantMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  joined_at: string;
  last_active: string | null;
  avatar_url: string | null;
}

interface TenantInvitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}

interface UsageMetrics {
  current_users: number;
  current_workflows: number;
  current_profiles: number;
  storage_used_gb: number;
  api_calls_today: number;
  api_calls_month: number;
}

interface TenantSettingsProps {
  tenantId: string;
  onClose?: () => void;
  onTenantUpdated?: (tenant: Tenant) => void;
}

type TabType = 'overview' | 'members' | 'invitations' | 'branding' | 'limits';

// ============================================
// Component
// ============================================

export const TenantSettingsPanel: React.FC<TenantSettingsProps> = ({
  tenantId,
  onClose = () => {},
  onTenantUpdated = () => {}
}) => {
  // State
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editedSettings, setEditedSettings] = useState<TenantSettings | null>(null);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Load data
  const loadTenantData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tenantData, membersData, invitationsData, usageData] = await Promise.all([
        invoke<Tenant>('get_tenant', { tenantId }),
        invoke<TenantMember[]>('get_tenant_members', { tenantId }),
        invoke<TenantInvitation[]>('get_tenant_invitations', { tenantId }),
        invoke<UsageMetrics>('get_tenant_usage', { tenantId })
      ]);
      
      setTenant(tenantData);
      setMembers(membersData);
      setInvitations(invitationsData.filter(i => i.status === 'pending'));
      setUsage(usageData);
      setEditedSettings(tenantData.settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tenant data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  // Actions
  const handleSaveSettings = async () => {
    if (!editedSettings || !tenant) return;
    
    setSaving(true);
    try {
      const updated = await invoke<Tenant>('update_tenant_settings', {
        tenantId,
        settings: editedSettings
      });
      setTenant(updated);
      setEditMode(false);
      onTenantUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!newInviteEmail.trim()) return;
    
    setSaving(true);
    try {
      const invitation = await invoke<TenantInvitation>('invite_user', {
        tenantId,
        email: newInviteEmail.trim(),
        role: newInviteRole
      });
      setInvitations(prev => [...prev, invitation]);
      setNewInviteEmail('');
      setShowInviteForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      await invoke('revoke_invitation', { tenantId, invitationId });
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await invoke('update_member_role', { tenantId, memberId, role: newRole });
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole as TenantMember['role'] } : m
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await invoke('remove_tenant_member', { tenantId, memberId });
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleUpdateBranding = async (branding: CustomBranding) => {
    if (!editedSettings) return;
    
    setSaving(true);
    try {
      const newSettings = { ...editedSettings, custom_branding: branding };
      const updated = await invoke<Tenant>('update_tenant_settings', {
        tenantId,
        settings: newSettings
      });
      setTenant(updated);
      setEditedSettings(newSettings);
      onTenantUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branding');
    } finally {
      setSaving(false);
    }
  };

  // Computed values
  const usagePercentages = useMemo(() => {
    if (!usage || !tenant) return null;
    return {
      users: (usage.current_users / tenant.limits.max_users) * 100,
      workflows: (usage.current_workflows / tenant.limits.max_workflows) * 100,
      profiles: (usage.current_profiles / tenant.limits.max_profiles) * 100,
      storage: (usage.storage_used_gb / tenant.limits.max_storage_gb) * 100
    };
  }, [usage, tenant]);

  // Loading state
  if (loading) {
    return (
      <div className="tenant-settings">
        <div className="tenant-loading">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span>Loading tenant settings...</span>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="tenant-settings">
        <div className="tenant-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <h3>Tenant Not Found</h3>
          <p>The requested tenant could not be loaded.</p>
          <button className="btn-primary" onClick={onClose}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-settings">
      {/* Header */}
      <header className="tenant-header">
        <div className="tenant-header-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1"/>
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
          </svg>
          <div>
            <h2>{tenant.name}</h2>
            <span className="tenant-slug">/{tenant.slug}</span>
          </div>
          <span className={`tenant-plan-badge ${tenant.plan}`}>{tenant.plan}</span>
          <span className={`tenant-status-badge ${tenant.status}`}>{tenant.status}</span>
        </div>
        <div className="tenant-header-actions">
          {editMode ? (
            <>
              <button className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button className="btn-secondary" onClick={() => setEditMode(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Settings
            </button>
          )}
          <button className="btn-ghost" onClick={onClose} title="Close">✕</button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="tenant-error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <nav className="tenant-tabs">
        <button 
          className={`tenant-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          Overview
        </button>
        <button 
          className={`tenant-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Members ({members.length})
        </button>
        <button 
          className={`tenant-tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Invitations ({invitations.length})
        </button>
        <button 
          className={`tenant-tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          Branding
        </button>
        <button 
          className={`tenant-tab ${activeTab === 'limits' ? 'active' : ''}`}
          onClick={() => setActiveTab('limits')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20V10"/>
            <path d="M18 20V4"/>
            <path d="M6 20v-4"/>
          </svg>
          Usage & Limits
        </button>
      </nav>

      {/* Content */}
      <div className="tenant-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tenant-overview">
            <div className="overview-grid">
              <div className="overview-card">
                <h4>Organization Settings</h4>
                <div className="settings-list">
                  <div className="setting-row">
                    <label>Allow Member Invites</label>
                    <input 
                      type="checkbox"
                      checked={editedSettings?.allow_member_invites ?? false}
                      onChange={e => editedSettings && setEditedSettings({
                        ...editedSettings,
                        allow_member_invites: e.target.checked
                      })}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="setting-row">
                    <label>Default Member Role</label>
                    <select 
                      value={editedSettings?.default_member_role ?? 'member'}
                      onChange={e => editedSettings && setEditedSettings({
                        ...editedSettings,
                        default_member_role: e.target.value
                      })}
                      disabled={!editMode}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="setting-row">
                    <label>Require 2FA</label>
                    <input 
                      type="checkbox"
                      checked={editedSettings?.require_2fa ?? false}
                      onChange={e => editedSettings && setEditedSettings({
                        ...editedSettings,
                        require_2fa: e.target.checked
                      })}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="setting-row">
                    <label>Session Timeout (minutes)</label>
                    <input 
                      type="number"
                      value={editedSettings?.session_timeout_minutes ?? 60}
                      onChange={e => editedSettings && setEditedSettings({
                        ...editedSettings,
                        session_timeout_minutes: parseInt(e.target.value) || 60
                      })}
                      disabled={!editMode}
                      min={15}
                      max={1440}
                    />
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h4>Quick Stats</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{usage?.current_users ?? 0}</span>
                    <span className="stat-label">Users</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{usage?.current_workflows ?? 0}</span>
                    <span className="stat-label">Workflows</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{usage?.current_profiles ?? 0}</span>
                    <span className="stat-label">Profiles</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{usage?.api_calls_today ?? 0}</span>
                    <span className="stat-label">API Calls Today</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h4>Allowed Email Domains</h4>
                <p className="setting-description">
                  Users with these email domains can join automatically
                </p>
                <div className="domain-list">
                  {editedSettings?.allowed_domains.length === 0 ? (
                    <span className="empty-domains">No domains configured</span>
                  ) : (
                    editedSettings?.allowed_domains.map((domain, idx) => (
                      <div key={idx} className="domain-tag">
                        @{domain}
                        {editMode && (
                          <button 
                            className="remove-domain"
                            onClick={() => {
                              if (editedSettings) {
                                setEditedSettings({
                                  ...editedSettings,
                                  allowed_domains: editedSettings.allowed_domains.filter((_, i) => i !== idx)
                                });
                              }
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  {editMode && (
                    <button 
                      className="add-domain-btn"
                      onClick={() => {
                        const domain = prompt('Enter email domain (e.g., company.com):');
                        if (domain && editedSettings) {
                          setEditedSettings({
                            ...editedSettings,
                            allowed_domains: [...editedSettings.allowed_domains, domain.toLowerCase()]
                          });
                        }
                      }}
                    >
                      + Add Domain
                    </button>
                  )}
                </div>
              </div>

              <div className="overview-card">
                <h4>Tenant Information</h4>
                <div className="info-list">
                  <div className="info-row">
                    <span>Tenant ID</span>
                    <code>{tenant.id}</code>
                  </div>
                  <div className="info-row">
                    <span>Owner</span>
                    <span>{tenant.owner_id}</span>
                  </div>
                  <div className="info-row">
                    <span>Created</span>
                    <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span>Last Updated</span>
                    <span>{new Date(tenant.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="tenant-members">
            <div className="members-header">
              <h3>Team Members</h3>
              <button className="btn-primary" onClick={() => {
                setShowInviteForm(true);
                setActiveTab('invitations');
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Invite Member
              </button>
            </div>

            <div className="members-list">
              {members.map(member => (
                <div key={member.id} className={`member-card ${member.status}`}>
                  <div className="member-avatar">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} />
                    ) : (
                      <span>{member.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.name}
                      {member.role === 'owner' && <span className="owner-badge">Owner</span>}
                    </div>
                    <div className="member-email">{member.email}</div>
                    <div className="member-meta">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                      {member.last_active && (
                        <> · Last active {new Date(member.last_active).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <div className="member-actions">
                    <select 
                      value={member.role}
                      onChange={e => handleUpdateMemberRole(member.id, e.target.value)}
                      disabled={member.role === 'owner'}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {member.role !== 'owner' && (
                      <button 
                        className="btn-icon danger"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove member"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="tenant-invitations">
            <div className="invitations-header">
              <h3>Pending Invitations</h3>
              {!showInviteForm && (
                <button className="btn-primary" onClick={() => setShowInviteForm(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  New Invitation
                </button>
              )}
            </div>

            {showInviteForm && (
              <div className="invite-form">
                <h4>Invite New Member</h4>
                <div className="invite-fields">
                  <div className="field">
                    <label>Email Address</label>
                    <input 
                      type="email"
                      value={newInviteEmail}
                      onChange={e => setNewInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                    />
                  </div>
                  <div className="field">
                    <label>Role</label>
                    <select 
                      value={newInviteRole}
                      onChange={e => setNewInviteRole(e.target.value as typeof newInviteRole)}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <div className="invite-actions">
                  <button className="btn-secondary" onClick={() => {
                    setShowInviteForm(false);
                    setNewInviteEmail('');
                  }}>
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleInviteUser}
                    disabled={!newInviteEmail.trim() || saving}
                  >
                    {saving ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            )}

            {invitations.length === 0 ? (
              <div className="invitations-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <h4>No Pending Invitations</h4>
                <p>Invite team members to collaborate on your organization.</p>
              </div>
            ) : (
              <div className="invitations-list">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="invitation-card">
                    <div className="invitation-info">
                      <div className="invitation-email">{invitation.email}</div>
                      <div className="invitation-meta">
                        <span className={`role-badge ${invitation.role}`}>{invitation.role}</span>
                        <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="invitation-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => navigator.clipboard.writeText(`https://cube.app/invite/${invitation.id}`)}
                        title="Copy invite link"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy Link
                      </button>
                      <button 
                        className="btn-icon danger"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        title="Revoke invitation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && editedSettings && (
          <div className="tenant-branding">
            <div className="branding-header">
              <h3>White-Label Branding</h3>
              <p>Customize the appearance for your organization</p>
            </div>

            <div className="branding-form">
              <div className="branding-preview">
                <div 
                  className="preview-card"
                  style={{ 
                    '--brand-primary': editedSettings.custom_branding.primary_color,
                    '--brand-accent': editedSettings.custom_branding.accent_color
                  } as React.CSSProperties}
                >
                  {editedSettings.custom_branding.logo_url ? (
                    <img 
                      src={editedSettings.custom_branding.logo_url} 
                      alt="Logo" 
                      className="preview-logo"
                    />
                  ) : (
                    <div className="preview-logo-placeholder">
                      {editedSettings.custom_branding.company_name.charAt(0) || 'C'}
                    </div>
                  )}
                  <h4>{editedSettings.custom_branding.company_name || 'Your Company'}</h4>
                  <div className="preview-colors">
                    <div className="color-swatch primary" />
                    <div className="color-swatch accent" />
                  </div>
                </div>
              </div>

              <div className="branding-fields">
                <div className="field">
                  <label>Company Name</label>
                  <input 
                    type="text"
                    value={editedSettings.custom_branding.company_name}
                    onChange={e => setEditedSettings({
                      ...editedSettings,
                      custom_branding: {
                        ...editedSettings.custom_branding,
                        company_name: e.target.value
                      }
                    })}
                    placeholder="Your Company Name"
                  />
                </div>

                <div className="field">
                  <label>Logo URL</label>
                  <input 
                    type="url"
                    value={editedSettings.custom_branding.logo_url}
                    onChange={e => setEditedSettings({
                      ...editedSettings,
                      custom_branding: {
                        ...editedSettings.custom_branding,
                        logo_url: e.target.value
                      }
                    })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Primary Color</label>
                    <div className="color-input">
                      <input 
                        type="color"
                        value={editedSettings.custom_branding.primary_color}
                        onChange={e => setEditedSettings({
                          ...editedSettings,
                          custom_branding: {
                            ...editedSettings.custom_branding,
                            primary_color: e.target.value
                          }
                        })}
                      />
                      <input 
                        type="text"
                        value={editedSettings.custom_branding.primary_color}
                        onChange={e => setEditedSettings({
                          ...editedSettings,
                          custom_branding: {
                            ...editedSettings.custom_branding,
                            primary_color: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Accent Color</label>
                    <div className="color-input">
                      <input 
                        type="color"
                        value={editedSettings.custom_branding.accent_color}
                        onChange={e => setEditedSettings({
                          ...editedSettings,
                          custom_branding: {
                            ...editedSettings.custom_branding,
                            accent_color: e.target.value
                          }
                        })}
                      />
                      <input 
                        type="text"
                        value={editedSettings.custom_branding.accent_color}
                        onChange={e => setEditedSettings({
                          ...editedSettings,
                          custom_branding: {
                            ...editedSettings.custom_branding,
                            accent_color: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  className="btn-primary"
                  onClick={() => handleUpdateBranding(editedSettings.custom_branding)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Branding'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && usagePercentages && (
          <div className="tenant-limits">
            <div className="limits-header">
              <h3>Usage & Limits</h3>
              <span className={`plan-badge ${tenant.plan}`}>
                {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} Plan
              </span>
            </div>

            <div className="usage-grid">
              <div className="usage-card">
                <div className="usage-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                  <h4>Users</h4>
                </div>
                <div className="usage-value">
                  {usage?.current_users ?? 0} / {tenant.limits.max_users}
                </div>
                <div className="usage-bar">
                  <div 
                    className={`usage-fill ${usagePercentages.users > 80 ? 'warning' : ''} ${usagePercentages.users > 95 ? 'critical' : ''}`}
                    style={{ width: `${Math.min(usagePercentages.users, 100)}%` }}
                  />
                </div>
              </div>

              <div className="usage-card">
                <div className="usage-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <h4>Workflows</h4>
                </div>
                <div className="usage-value">
                  {usage?.current_workflows ?? 0} / {tenant.limits.max_workflows}
                </div>
                <div className="usage-bar">
                  <div 
                    className={`usage-fill ${usagePercentages.workflows > 80 ? 'warning' : ''} ${usagePercentages.workflows > 95 ? 'critical' : ''}`}
                    style={{ width: `${Math.min(usagePercentages.workflows, 100)}%` }}
                  />
                </div>
              </div>

              <div className="usage-card">
                <div className="usage-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <h4>Browser Profiles</h4>
                </div>
                <div className="usage-value">
                  {usage?.current_profiles ?? 0} / {tenant.limits.max_profiles}
                </div>
                <div className="usage-bar">
                  <div 
                    className={`usage-fill ${usagePercentages.profiles > 80 ? 'warning' : ''} ${usagePercentages.profiles > 95 ? 'critical' : ''}`}
                    style={{ width: `${Math.min(usagePercentages.profiles, 100)}%` }}
                  />
                </div>
              </div>

              <div className="usage-card">
                <div className="usage-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                  </svg>
                  <h4>Storage</h4>
                </div>
                <div className="usage-value">
                  {(usage?.storage_used_gb ?? 0).toFixed(2)} GB / {tenant.limits.max_storage_gb} GB
                </div>
                <div className="usage-bar">
                  <div 
                    className={`usage-fill ${usagePercentages.storage > 80 ? 'warning' : ''} ${usagePercentages.storage > 95 ? 'critical' : ''}`}
                    style={{ width: `${Math.min(usagePercentages.storage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="api-usage">
              <h4>API Usage</h4>
              <div className="api-stats">
                <div className="api-stat">
                  <span className="api-value">{usage?.api_calls_today ?? 0}</span>
                  <span className="api-label">Calls Today</span>
                </div>
                <div className="api-stat">
                  <span className="api-value">{usage?.api_calls_month ?? 0}</span>
                  <span className="api-label">Calls This Month</span>
                </div>
              </div>
            </div>

            {tenant.plan !== 'enterprise' && (
              <div className="upgrade-cta">
                <div className="upgrade-info">
                  <h4>Need more resources?</h4>
                  <p>Upgrade your plan to increase limits and unlock enterprise features.</p>
                </div>
                <button className="btn-primary">Upgrade Plan</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantSettingsPanel;
