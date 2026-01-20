'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  ChevronDown,
  RefreshCw,
  UserPlus,
  UserMinus,
  Edit2,
  Trash2,
  Crown,
  Star,
  Check,
  X,
  Send,
  Copy,
  ExternalLink,
  AlertTriangle,
  Activity,
  Calendar,
  Building,
  Briefcase,
  Key
} from 'lucide-react';
import './team.css';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  department: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  lastActive: string | null;
  permissions: string[];
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  departments: number;
}

interface Invitation {
  id: string;
  email: string;
  role: TeamMember['role'];
  sentAt: string;
  expiresAt: string;
  status: 'pending' | 'expired';
}

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'tm_1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    avatar: null,
    role: 'owner',
    department: 'Engineering',
    status: 'active',
    joinedAt: '2024-01-15T10:00:00Z',
    lastActive: '2025-01-27T14:30:00Z',
    permissions: ['all']
  },
  {
    id: 'tm_2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    avatar: null,
    role: 'admin',
    department: 'Engineering',
    status: 'active',
    joinedAt: '2024-03-20T08:00:00Z',
    lastActive: '2025-01-27T12:15:00Z',
    permissions: ['manage_team', 'manage_billing', 'manage_integrations']
  },
  {
    id: 'tm_3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    avatar: null,
    role: 'member',
    department: 'Marketing',
    status: 'active',
    joinedAt: '2024-06-10T14:00:00Z',
    lastActive: '2025-01-27T09:45:00Z',
    permissions: ['create_automations', 'view_analytics']
  },
  {
    id: 'tm_4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    avatar: null,
    role: 'member',
    department: 'Sales',
    status: 'active',
    joinedAt: '2024-08-05T11:00:00Z',
    lastActive: '2025-01-26T16:20:00Z',
    permissions: ['create_automations', 'view_analytics']
  },
  {
    id: 'tm_5',
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    avatar: null,
    role: 'viewer',
    department: 'Finance',
    status: 'active',
    joinedAt: '2024-10-12T09:00:00Z',
    lastActive: '2025-01-25T11:30:00Z',
    permissions: ['view_analytics']
  },
  {
    id: 'tm_6',
    name: 'James Thompson',
    email: 'james.thompson@company.com',
    avatar: null,
    role: 'member',
    department: 'Engineering',
    status: 'suspended',
    joinedAt: '2024-04-18T13:00:00Z',
    lastActive: '2025-01-10T08:00:00Z',
    permissions: []
  }
];

const MOCK_INVITATIONS: Invitation[] = [
  {
    id: 'inv_1',
    email: 'alex.morgan@company.com',
    role: 'member',
    sentAt: '2025-01-25T10:00:00Z',
    expiresAt: '2025-02-01T10:00:00Z',
    status: 'pending'
  },
  {
    id: 'inv_2',
    email: 'jessica.lee@company.com',
    role: 'admin',
    sentAt: '2025-01-20T14:00:00Z',
    expiresAt: '2025-01-27T14:00:00Z',
    status: 'expired'
  }
];

const MOCK_STATS: TeamStats = {
  totalMembers: 6,
  activeMembers: 5,
  pendingInvites: 2,
  departments: 4
};

const ROLE_COLORS: Record<TeamMember['role'], string> = {
  owner: 'gold',
  admin: 'purple',
  member: 'blue',
  viewer: 'gray'
};

const ROLE_ICONS: Record<TeamMember['role'], React.ReactNode> = {
  owner: <Crown size={12} />,
  admin: <Shield size={12} />,
  member: <Users size={12} />,
  viewer: <Activity size={12} />
};

export default function TeamManagementPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS);
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [stats, setStats] = useState<TeamStats>(MOCK_STATS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('members');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    loadData();
  }, []);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const departments = Array.from(new Set(members.map(m => m.department)));

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="team-management-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-management-page">
      {/* Header */}
      <header className="team-header">
        <div className="header-title">
          <Users size={28} />
          <div>
            <h1>Team Management</h1>
            <p>Manage members, roles, and permissions</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={18} />
          Invite Member
        </button>
      </header>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalMembers}</span>
            <span className="stat-label">Total Members</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeMembers}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Mail size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingInvites}</span>
            <span className="stat-label">Pending Invites</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon departments">
            <Building size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.departments}</span>
            <span className="stat-label">Departments</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs-nav">
        <button 
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18} />
          Members ({members.length})
        </button>
        <button 
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          <Mail size={18} />
          Invitations ({invitations.length})
        </button>
        <button 
          className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} />
          Roles & Permissions
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <>
          {/* Filters */}
          <section className="filters-section">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
            <div className="filter-group">
              <select 
                value={filterDepartment} 
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </section>

          {/* Members Grid */}
          <section className="members-grid">
            {filteredMembers.map((member) => (
              <div key={member.id} className={`member-card ${member.status}`}>
                <div className="member-header">
                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <span>{getInitials(member.name)}</span>
                    )}
                    <span className={`status-dot ${member.status}`}></span>
                  </div>
                  <div className="member-actions">
                    <button 
                      className="action-btn"
                      onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === member.id && (
                      <div className="action-menu">
                        <button>
                          <Edit2 size={14} />
                          Edit Member
                        </button>
                        <button>
                          <Key size={14} />
                          Manage Permissions
                        </button>
                        <button>
                          <Mail size={14} />
                          Send Message
                        </button>
                        {member.role !== 'owner' && (
                          <button className="danger">
                            <UserMinus size={14} />
                            Remove Member
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <span className="member-email">{member.email}</span>
                </div>
                <div className="member-badges">
                  <span className={`role-badge ${ROLE_COLORS[member.role]}`}>
                    {ROLE_ICONS[member.role]}
                    {member.role}
                  </span>
                  <span className="department-badge">
                    <Briefcase size={12} />
                    {member.department}
                  </span>
                </div>
                <div className="member-meta">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>Joined {formatDate(member.joinedAt)}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={14} />
                    <span>Active {getTimeAgo(member.lastActive)}</span>
                  </div>
                </div>
                {member.status === 'suspended' && (
                  <div className="suspended-notice">
                    <AlertTriangle size={14} />
                    Account suspended
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <section className="invitations-section">
          {invitations.length === 0 ? (
            <div className="empty-state">
              <Mail size={48} />
              <h3>No Pending Invitations</h3>
              <p>All invitations have been accepted or expired</p>
            </div>
          ) : (
            <div className="invitations-list">
              {invitations.map((invitation) => (
                <div key={invitation.id} className={`invitation-card ${invitation.status}`}>
                  <div className="invitation-icon">
                    <Mail size={20} />
                  </div>
                  <div className="invitation-info">
                    <span className="invitation-email">{invitation.email}</span>
                    <div className="invitation-meta">
                      <span className={`role-badge ${ROLE_COLORS[invitation.role]}`}>
                        {ROLE_ICONS[invitation.role]}
                        {invitation.role}
                      </span>
                      <span className="sent-date">Sent {formatDate(invitation.sentAt)}</span>
                    </div>
                  </div>
                  <div className="invitation-status">
                    <span className={`status-badge ${invitation.status}`}>
                      {invitation.status === 'pending' ? (
                        <>
                          <Clock size={12} />
                          Expires {formatDate(invitation.expiresAt)}
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={12} />
                          Expired
                        </>
                      )}
                    </span>
                  </div>
                  <div className="invitation-actions">
                    {invitation.status === 'pending' && (
                      <>
                        <button className="icon-btn" title="Copy Invite Link">
                          <Copy size={16} />
                        </button>
                        <button className="icon-btn" title="Resend Invitation">
                          <Send size={16} />
                        </button>
                      </>
                    )}
                    <button className="icon-btn danger" title="Cancel Invitation">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <section className="roles-section">
          <div className="roles-grid">
            <div className="role-card owner">
              <div className="role-header">
                <div className="role-icon">
                  <Crown size={24} />
                </div>
                <div className="role-title">
                  <h3>Owner</h3>
                  <span>Full access to all features</span>
                </div>
              </div>
              <ul className="permissions-list">
                <li><Check size={14} /> Manage team members</li>
                <li><Check size={14} /> Manage billing & subscriptions</li>
                <li><Check size={14} /> Access all integrations</li>
                <li><Check size={14} /> Delete organization</li>
                <li><Check size={14} /> Transfer ownership</li>
              </ul>
              <div className="role-members">
                <span>1 member with this role</span>
              </div>
            </div>

            <div className="role-card admin">
              <div className="role-header">
                <div className="role-icon">
                  <Shield size={24} />
                </div>
                <div className="role-title">
                  <h3>Admin</h3>
                  <span>Manage team and settings</span>
                </div>
              </div>
              <ul className="permissions-list">
                <li><Check size={14} /> Manage team members</li>
                <li><Check size={14} /> Manage billing & subscriptions</li>
                <li><Check size={14} /> Access all integrations</li>
                <li><X size={14} /> Delete organization</li>
                <li><X size={14} /> Transfer ownership</li>
              </ul>
              <div className="role-members">
                <span>1 member with this role</span>
              </div>
            </div>

            <div className="role-card member">
              <div className="role-header">
                <div className="role-icon">
                  <Users size={24} />
                </div>
                <div className="role-title">
                  <h3>Member</h3>
                  <span>Create and manage automations</span>
                </div>
              </div>
              <ul className="permissions-list">
                <li><Check size={14} /> Create automations</li>
                <li><Check size={14} /> View analytics</li>
                <li><Check size={14} /> Use integrations</li>
                <li><X size={14} /> Manage team members</li>
                <li><X size={14} /> Manage billing</li>
              </ul>
              <div className="role-members">
                <span>3 members with this role</span>
              </div>
            </div>

            <div className="role-card viewer">
              <div className="role-header">
                <div className="role-icon">
                  <Activity size={24} />
                </div>
                <div className="role-title">
                  <h3>Viewer</h3>
                  <span>Read-only access</span>
                </div>
              </div>
              <ul className="permissions-list">
                <li><Check size={14} /> View automations</li>
                <li><Check size={14} /> View analytics</li>
                <li><X size={14} /> Create automations</li>
                <li><X size={14} /> Manage team members</li>
                <li><X size={14} /> Manage billing</li>
              </ul>
              <div className="role-members">
                <span>1 member with this role</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Team Member</h2>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="colleague@company.com" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select>
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="new">+ Add new department</option>
                </select>
              </div>
              <div className="form-group">
                <label>Personal Message (optional)</label>
                <textarea placeholder="Add a personal welcome message..."></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <Send size={18} />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
