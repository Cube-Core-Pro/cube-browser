'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Trash2,
  RefreshCw,
  Send,
  Filter,
  Search,
  MoreVertical,
  Shield,
  Crown,
  Eye,
  Edit,
  Settings,
  X,
  Calendar,
  Link2,
  ChevronDown,
  ExternalLink,
  Check
} from 'lucide-react';
import './invitations.css';

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'developer' | 'manager' | 'viewer';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token: string;
  team?: string;
  permissions: string[];
  lastReminderSent?: string;
  reminderCount: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'manager' | 'viewer';
  avatar?: string;
  joinedAt: string;
  status: 'active' | 'inactive';
  lastActive: string;
  invitedBy: string;
  team?: string;
}

const SAMPLE_INVITATIONS: Invitation[] = [
  {
    id: 'inv-001',
    email: 'john.doe@techcorp.com',
    role: 'developer',
    status: 'pending',
    invitedBy: { name: 'Sarah Johnson', email: 'sarah.j@cube.io' },
    createdAt: '2025-01-28T10:30:00Z',
    expiresAt: '2025-02-04T10:30:00Z',
    token: 'inv_tok_abc123xyz789',
    team: 'Engineering',
    permissions: ['read', 'write', 'api'],
    lastReminderSent: '2025-01-29T08:00:00Z',
    reminderCount: 1,
  },
  {
    id: 'inv-002',
    email: 'emily.wilson@startup.io',
    role: 'manager',
    status: 'pending',
    invitedBy: { name: 'Sarah Johnson', email: 'sarah.j@cube.io' },
    createdAt: '2025-01-27T14:15:00Z',
    expiresAt: '2025-02-03T14:15:00Z',
    token: 'inv_tok_def456uvw012',
    team: 'Product',
    permissions: ['read', 'write', 'admin', 'reports'],
    reminderCount: 0,
  },
  {
    id: 'inv-003',
    email: 'mike.chen@agency.com',
    role: 'viewer',
    status: 'accepted',
    invitedBy: { name: 'Emily Davis', email: 'emily.d@cube.io' },
    createdAt: '2025-01-25T09:00:00Z',
    expiresAt: '2025-02-01T09:00:00Z',
    acceptedAt: '2025-01-26T11:30:00Z',
    token: 'inv_tok_ghi789rst345',
    team: 'Marketing',
    permissions: ['read'],
    reminderCount: 0,
  },
  {
    id: 'inv-004',
    email: 'alex.martinez@contractor.net',
    role: 'developer',
    status: 'expired',
    invitedBy: { name: 'Michael Chen', email: 'michael.c@cube.io' },
    createdAt: '2025-01-10T16:45:00Z',
    expiresAt: '2025-01-17T16:45:00Z',
    token: 'inv_tok_jkl012mno678',
    team: 'Engineering',
    permissions: ['read', 'write'],
    lastReminderSent: '2025-01-14T10:00:00Z',
    reminderCount: 2,
  },
  {
    id: 'inv-005',
    email: 'jessica.brown@partner.org',
    role: 'admin',
    status: 'revoked',
    invitedBy: { name: 'Sarah Johnson', email: 'sarah.j@cube.io' },
    createdAt: '2025-01-20T11:00:00Z',
    expiresAt: '2025-01-27T11:00:00Z',
    token: 'inv_tok_pqr345stu901',
    permissions: ['read', 'write', 'admin', 'billing'],
    reminderCount: 0,
  },
];

const SAMPLE_MEMBERS: TeamMember[] = [
  {
    id: 'mem-001',
    name: 'Sarah Johnson',
    email: 'sarah.j@cube.io',
    role: 'admin',
    joinedAt: '2024-06-15T00:00:00Z',
    status: 'active',
    lastActive: '2025-01-29T14:30:00Z',
    invitedBy: 'System',
    team: 'Leadership',
  },
  {
    id: 'mem-002',
    name: 'Michael Chen',
    email: 'michael.c@cube.io',
    role: 'developer',
    joinedAt: '2024-08-22T00:00:00Z',
    status: 'active',
    lastActive: '2025-01-29T13:45:00Z',
    invitedBy: 'Sarah Johnson',
    team: 'Engineering',
  },
  {
    id: 'mem-003',
    name: 'Emily Davis',
    email: 'emily.d@cube.io',
    role: 'manager',
    joinedAt: '2024-09-10T00:00:00Z',
    status: 'active',
    lastActive: '2025-01-29T12:00:00Z',
    invitedBy: 'Sarah Johnson',
    team: 'Product',
  },
  {
    id: 'mem-004',
    name: 'David Wilson',
    email: 'david.w@cube.io',
    role: 'developer',
    joinedAt: '2024-10-05T00:00:00Z',
    status: 'active',
    lastActive: '2025-01-28T18:30:00Z',
    invitedBy: 'Michael Chen',
    team: 'Engineering',
  },
  {
    id: 'mem-005',
    name: 'Lisa Thompson',
    email: 'lisa.t@cube.io',
    role: 'viewer',
    joinedAt: '2024-11-20T00:00:00Z',
    status: 'inactive',
    lastActive: '2025-01-15T09:00:00Z',
    invitedBy: 'Emily Davis',
    team: 'Marketing',
  },
];

const ROLES = [
  { id: 'admin', label: 'Admin', icon: Crown, color: '#f59e0b', description: 'Full access to all features' },
  { id: 'manager', label: 'Manager', icon: Shield, color: '#8b5cf6', description: 'Manage team and projects' },
  { id: 'developer', label: 'Developer', icon: Edit, color: '#3b82f6', description: 'API and development access' },
  { id: 'viewer', label: 'Viewer', icon: Eye, color: '#6b7280', description: 'Read-only access' },
];

const PERMISSIONS = [
  { id: 'read', label: 'Read', description: 'View data and dashboards' },
  { id: 'write', label: 'Write', description: 'Create and edit content' },
  { id: 'admin', label: 'Admin', description: 'Manage users and settings' },
  { id: 'api', label: 'API Access', description: 'Use API endpoints' },
  { id: 'billing', label: 'Billing', description: 'View and manage billing' },
  { id: 'reports', label: 'Reports', description: 'Generate and export reports' },
];

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

const getDaysUntilExpiry = (expiresAt: string): number => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export default function InvitationsPage() {
  const [invitations] = useState<Invitation[]>(SAMPLE_INVITATIONS);
  const [members] = useState<TeamMember[]>(SAMPLE_MEMBERS);
  const [activeTab, setActiveTab] = useState<'invitations' | 'members'>('invitations');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New invitation form state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('developer');
  const [newTeam, setNewTeam] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read', 'write']);

  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const acceptedCount = invitations.filter(i => i.status === 'accepted').length;
  const expiredCount = invitations.filter(i => i.status === 'expired').length;

  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = searchQuery === '' || 
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.team?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMembers = members.filter(mem => {
    return searchQuery === '' || 
      mem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.team?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const copyInviteLink = (token: string) => {
    const link = `https://cube.io/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getRoleConfig = (role: string) => {
    return ROLES.find(r => r.id === role) || ROLES[3];
  };

  const handleCreateInvitation = () => {
    // In a real app, this would call an API
    console.log('Creating invitation:', {
      email: newEmail,
      role: newRole,
      team: newTeam,
      permissions: selectedPermissions,
    });
    setShowInviteModal(false);
    setNewEmail('');
    setNewRole('developer');
    setNewTeam('');
    setSelectedPermissions(['read', 'write']);
  };

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  return (
    <div className="invitations">
      {/* Header */}
      <header className="invitations__header">
        <div className="invitations__title-section">
          <div className="invitations__icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Team Invitations</h1>
            <p>Manage invitations and team members</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Settings size={18} />
            Settings
          </button>
          <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={18} />
            Invite Member
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="invitations__stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{members.length}</span>
            <span className="stat-label">Team Members</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending Invites</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accepted">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{acceptedCount}</span>
            <span className="stat-label">Accepted</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expired">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{expiredCount}</span>
            <span className="stat-label">Expired</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="invitations__tabs">
        <button 
          className={`tab-btn ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          <Mail size={18} />
          Invitations
          <span className="tab-count">{invitations.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18} />
          Team Members
          <span className="tab-count">{members.length}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="invitations__toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={activeTab === 'invitations' ? 'Search invitations...' : 'Search members...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        {activeTab === 'invitations' && (
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${!statusFilter ? 'active' : ''}`}
              onClick={() => setStatusFilter(null)}
            >
              All
            </button>
            <button 
              className={`filter-btn pending ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <Clock size={16} />
              Pending
            </button>
            <button 
              className={`filter-btn accepted ${statusFilter === 'accepted' ? 'active' : ''}`}
              onClick={() => setStatusFilter('accepted')}
            >
              <CheckCircle size={16} />
              Accepted
            </button>
            <button 
              className={`filter-btn expired ${statusFilter === 'expired' ? 'active' : ''}`}
              onClick={() => setStatusFilter('expired')}
            >
              <AlertCircle size={16} />
              Expired
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="invitations__content">
        {activeTab === 'invitations' ? (
          <div className="invitations-list">
            {filteredInvitations.length === 0 ? (
              <div className="empty-state">
                <Mail size={48} />
                <h3>No Invitations Found</h3>
                <p>No invitations match your current filters.</p>
              </div>
            ) : (
              filteredInvitations.map(invitation => {
                const roleConfig = getRoleConfig(invitation.role);
                const daysLeft = getDaysUntilExpiry(invitation.expiresAt);

                return (
                  <div 
                    key={invitation.id} 
                    className={`invitation-card ${invitation.status}`}
                    onClick={() => setSelectedInvitation(invitation)}
                  >
                    <div className="invitation-main">
                      <div className="invitation-avatar">
                        {invitation.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="invitation-info">
                        <div className="invitation-header">
                          <span className="invitation-email">{invitation.email}</span>
                          <span className={`status-badge ${invitation.status}`}>
                            {invitation.status === 'pending' && <Clock size={12} />}
                            {invitation.status === 'accepted' && <CheckCircle size={12} />}
                            {invitation.status === 'expired' && <AlertCircle size={12} />}
                            {invitation.status === 'revoked' && <XCircle size={12} />}
                            {invitation.status}
                          </span>
                        </div>
                        <div className="invitation-meta">
                          <span className="role-badge" style={{ color: roleConfig.color }}>
                            <roleConfig.icon size={14} />
                            {roleConfig.label}
                          </span>
                          {invitation.team && (
                            <span className="team-badge">{invitation.team}</span>
                          )}
                          <span className="invited-by">
                            Invited by {invitation.invitedBy.name}
                          </span>
                        </div>
                        <div className="invitation-dates">
                          <span>
                            <Calendar size={12} />
                            Created {formatDate(invitation.createdAt)}
                          </span>
                          {invitation.status === 'pending' && daysLeft > 0 && (
                            <span className={`expiry ${daysLeft <= 2 ? 'warning' : ''}`}>
                              Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                            </span>
                          )}
                          {invitation.status === 'accepted' && invitation.acceptedAt && (
                            <span className="accepted-date">
                              <CheckCircle size={12} />
                              Accepted {formatDate(invitation.acceptedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="invitation-actions">
                      {invitation.status === 'pending' && (
                        <>
                          <button 
                            className="action-btn copy"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyInviteLink(invitation.token);
                            }}
                            title="Copy invite link"
                          >
                            {copiedToken === invitation.token ? (
                              <Check size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                          <button 
                            className="action-btn resend"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            title="Resend invitation"
                          >
                            <Send size={16} />
                          </button>
                          <button 
                            className="action-btn revoke"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            title="Revoke invitation"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      {invitation.status === 'expired' && (
                        <button 
                          className="action-btn resend"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          title="Resend invitation"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      <button className="action-btn more">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="members-list">
            {filteredMembers.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>No Members Found</h3>
                <p>No team members match your search.</p>
              </div>
            ) : (
              filteredMembers.map(member => {
                const roleConfig = getRoleConfig(member.role);

                return (
                  <div key={member.id} className={`member-card ${member.status}`}>
                    <div className="member-main">
                      <div className="member-avatar">
                        {member.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                      <div className="member-info">
                        <div className="member-header">
                          <span className="member-name">{member.name}</span>
                          <span className={`status-dot ${member.status}`}></span>
                        </div>
                        <span className="member-email">{member.email}</span>
                        <div className="member-meta">
                          <span className="role-badge" style={{ color: roleConfig.color }}>
                            <roleConfig.icon size={14} />
                            {roleConfig.label}
                          </span>
                          {member.team && (
                            <span className="team-badge">{member.team}</span>
                          )}
                          <span className="last-active">
                            Last active {formatRelativeTime(member.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="member-actions">
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn more">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-icon">
                  <UserPlus size={24} />
                </div>
                <h2>Invite Team Member</h2>
              </div>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Email */}
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label>Role</label>
                <div className="role-selector">
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      className={`role-option ${newRole === role.id ? 'selected' : ''}`}
                      onClick={() => setNewRole(role.id)}
                    >
                      <div className="role-icon" style={{ color: role.color }}>
                        <role.icon size={20} />
                      </div>
                      <div className="role-info">
                        <span className="role-label">{role.label}</span>
                        <span className="role-desc">{role.description}</span>
                      </div>
                      {newRole === role.id && (
                        <CheckCircle size={18} className="check-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team */}
              <div className="form-group">
                <label>Team (Optional)</label>
                <div className="select-wrapper">
                  <select 
                    value={newTeam} 
                    onChange={(e) => setNewTeam(e.target.value)}
                  >
                    <option value="">Select a team</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>

              {/* Permissions */}
              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-grid">
                  {PERMISSIONS.map(perm => (
                    <button
                      key={perm.id}
                      className={`permission-option ${selectedPermissions.includes(perm.id) ? 'selected' : ''}`}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <div className="perm-checkbox">
                        {selectedPermissions.includes(perm.id) && <Check size={12} />}
                      </div>
                      <div className="perm-info">
                        <span className="perm-label">{perm.label}</span>
                        <span className="perm-desc">{perm.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Invite Link Option */}
              <div className="invite-options">
                <div className="option-box">
                  <Link2 size={20} />
                  <div className="option-info">
                    <span className="option-title">Generate Invite Link</span>
                    <span className="option-desc">Share a link instead of sending email</span>
                  </div>
                  <button className="btn-small">Generate</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateInvitation}
                disabled={!newEmail}
              >
                <Send size={18} />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Detail Modal */}
      {selectedInvitation && (
        <div className="modal-overlay" onClick={() => setSelectedInvitation(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>Invitation Details</h2>
                <span className={`status-badge ${selectedInvitation.status}`}>
                  {selectedInvitation.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedInvitation(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Invitee Information</h3>
                <div className="detail-card">
                  <div className="detail-avatar">
                    {selectedInvitation.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="detail-info">
                    <span className="detail-email">{selectedInvitation.email}</span>
                    <span className="detail-role">
                      {getRoleConfig(selectedInvitation.role).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Team</span>
                    <span className="value">{selectedInvitation.team || 'None'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Invited By</span>
                    <span className="value">{selectedInvitation.invitedBy.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created</span>
                    <span className="value">{formatDate(selectedInvitation.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Expires</span>
                    <span className="value">{formatDate(selectedInvitation.expiresAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Reminders Sent</span>
                    <span className="value">{selectedInvitation.reminderCount}</span>
                  </div>
                  {selectedInvitation.lastReminderSent && (
                    <div className="detail-item">
                      <span className="label">Last Reminder</span>
                      <span className="value">{formatDate(selectedInvitation.lastReminderSent)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Permissions</h3>
                <div className="permissions-list">
                  {selectedInvitation.permissions.map(perm => {
                    const permConfig = PERMISSIONS.find(p => p.id === perm);
                    return (
                      <div key={perm} className="permission-tag">
                        <CheckCircle size={12} />
                        {permConfig?.label || perm}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedInvitation.status === 'pending' && (
                <div className="detail-section">
                  <h3>Invite Link</h3>
                  <div className="invite-link-box">
                    <input 
                      type="text" 
                      value={`https://cube.io/invite/${selectedInvitation.token}`}
                      readOnly 
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => copyInviteLink(selectedInvitation.token)}
                    >
                      {copiedToken === selectedInvitation.token ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    <button className="external-btn">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedInvitation.status === 'pending' && (
                <>
                  <button className="btn-danger">
                    <XCircle size={18} />
                    Revoke
                  </button>
                  <button className="btn-primary">
                    <Send size={18} />
                    Resend
                  </button>
                </>
              )}
              {selectedInvitation.status === 'expired' && (
                <button className="btn-primary">
                  <RefreshCw size={18} />
                  Resend Invitation
                </button>
              )}
              <button className="btn-outline" onClick={() => setSelectedInvitation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
