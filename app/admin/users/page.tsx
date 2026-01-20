'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Crown,
  Star,
  Building,
  X,
  Check,
  Copy
} from 'lucide-react';
import './users.css';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'user' | 'admin' | 'super_admin' | 'support';
  tier: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  company?: string;
  createdAt: string;
  lastLogin: string;
  totalSpent: number;
  actionsUsed: number;
  actionsLimit: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newThisMonth: number;
  suspendedUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
}

const MOCK_STATS: UserStats = {
  totalUsers: 156847,
  activeUsers: 142356,
  newThisMonth: 4847,
  suspendedUsers: 234,
  premiumUsers: 45670,
  enterpriseUsers: 1240
};

const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    email: 'john.doe@enterprise.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    tier: 'enterprise',
    status: 'active',
    company: 'Enterprise Corp',
    createdAt: '2024-03-15',
    lastLogin: '2 hours ago',
    totalSpent: 45890,
    actionsUsed: 185420,
    actionsLimit: 500000
  },
  {
    id: 'usr_2',
    email: 'sarah.wilson@techstart.io',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'user',
    tier: 'business',
    status: 'active',
    company: 'TechStart Inc',
    createdAt: '2024-06-22',
    lastLogin: '15 minutes ago',
    totalSpent: 8940,
    actionsUsed: 78450,
    actionsLimit: 200000
  },
  {
    id: 'usr_3',
    email: 'mike.chen@startup.co',
    firstName: 'Mike',
    lastName: 'Chen',
    role: 'user',
    tier: 'professional',
    status: 'active',
    company: 'Startup Co',
    createdAt: '2024-09-10',
    lastLogin: '1 day ago',
    totalSpent: 2340,
    actionsUsed: 34560,
    actionsLimit: 100000
  },
  {
    id: 'usr_4',
    email: 'emily.jones@agency.com',
    firstName: 'Emily',
    lastName: 'Jones',
    role: 'user',
    tier: 'starter',
    status: 'pending',
    company: 'Digital Agency',
    createdAt: '2025-01-05',
    lastLogin: 'Never',
    totalSpent: 0,
    actionsUsed: 0,
    actionsLimit: 10000
  },
  {
    id: 'usr_5',
    email: 'alex.smith@freelance.dev',
    firstName: 'Alex',
    lastName: 'Smith',
    role: 'user',
    tier: 'free',
    status: 'active',
    createdAt: '2024-12-01',
    lastLogin: '3 days ago',
    totalSpent: 0,
    actionsUsed: 890,
    actionsLimit: 1000
  },
  {
    id: 'usr_6',
    email: 'admin@cubeai.tools',
    firstName: 'System',
    lastName: 'Admin',
    role: 'super_admin',
    tier: 'enterprise',
    status: 'active',
    company: 'CUBE AI',
    createdAt: '2023-01-01',
    lastLogin: '5 minutes ago',
    totalSpent: 0,
    actionsUsed: 0,
    actionsLimit: -1
  },
  {
    id: 'usr_7',
    email: 'support@cubeai.tools',
    firstName: 'Support',
    lastName: 'Team',
    role: 'support',
    tier: 'enterprise',
    status: 'active',
    company: 'CUBE AI',
    createdAt: '2023-06-15',
    lastLogin: '30 minutes ago',
    totalSpent: 0,
    actionsUsed: 0,
    actionsLimit: -1
  },
  {
    id: 'usr_8',
    email: 'banned.user@spam.com',
    firstName: 'Banned',
    lastName: 'User',
    role: 'user',
    tier: 'free',
    status: 'suspended',
    createdAt: '2024-11-20',
    lastLogin: '30 days ago',
    totalSpent: 0,
    actionsUsed: 15000,
    actionsLimit: 1000
  }
];

export default function AdminUsersPage(): React.ReactElement {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [stats, setStats] = useState<UserStats>(MOCK_STATS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTier = filterTier === 'all' || user.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesTier && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTierBadgeClass = (tier: string): string => {
    switch (tier) {
      case 'enterprise': return 'tier-enterprise';
      case 'business': return 'tier-business';
      case 'professional': return 'tier-professional';
      case 'starter': return 'tier-starter';
      default: return 'tier-free';
    }
  };

  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'super_admin': return 'role-super-admin';
      case 'admin': return 'role-admin';
      case 'support': return 'role-support';
      default: return 'role-user';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleUserAction = (action: string, user: User) => {
    switch (action) {
      case 'view':
        console.log('View user:', user);
        break;
      case 'edit':
        setEditingUser(user);
        setShowUserModal(true);
        break;
      case 'suspend':
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, status: 'suspended' as const } : u
        ));
        break;
      case 'activate':
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, status: 'active' as const } : u
        ));
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this user?')) {
          setUsers(prev => prev.filter(u => u.id !== user.id));
        }
        break;
    }
    setShowActionMenu(null);
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <div className="header-title">
            <Users size={28} />
            <div>
              <h1>User Management</h1>
              <p>Manage platform users, roles, and permissions</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Export
          </button>
          <button className="btn-primary" onClick={() => setShowUserModal(true)}>
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="user-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(stats.totalUsers)}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(stats.activeUsers)}</span>
            <span className="stat-label">Active Users</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <UserPlus size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">+{formatNumber(stats.newThisMonth)}</span>
            <span className="stat-label">New This Month</span>
          </div>
        </div>
        <div className="stat-card premium">
          <div className="stat-icon">
            <Crown size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(stats.premiumUsers)}</span>
            <span className="stat-label">Premium Users</span>
          </div>
        </div>
        <div className="stat-card enterprise">
          <div className="stat-icon">
            <Building size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(stats.enterpriseUsers)}</span>
            <span className="stat-label">Enterprise</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <Ban size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatNumber(stats.suspendedUsers)}</span>
            <span className="stat-label">Suspended</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="support">Support</option>
          </select>
        </div>

        <div className="filter-group">
          <Star size={16} />
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="filter-group">
          <Shield size={16} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedUsers.length} selected</span>
            <button className="btn-small">Send Email</button>
            <button className="btn-small warning">Suspend</button>
          </div>
        )}
      </section>

      {/* Users Table */}
      <section className="users-table-section">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Total Spent</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="user-col">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{user.firstName} {user.lastName}</span>
                        <span className="user-email">{user.email}</span>
                        {user.company && <span className="user-company">{user.company}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getTierBadgeClass(user.tier)}`}>
                      {user.tier}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="usage-cell">
                      <div className="usage-bar">
                        <div 
                          className="usage-fill" 
                          style={{ 
                            width: user.actionsLimit === -1 ? '0%' : `${Math.min(100, (user.actionsUsed / user.actionsLimit) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="usage-text">
                        {user.actionsLimit === -1 ? 'Unlimited' : `${formatNumber(user.actionsUsed)} / ${formatNumber(user.actionsLimit)}`}
                      </span>
                    </div>
                  </td>
                  <td className="spent-col">{formatCurrency(user.totalSpent)}</td>
                  <td className="login-col">{user.lastLogin}</td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      <button 
                        className="action-btn"
                        onClick={() => handleUserAction('view', user)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleUserAction('edit', user)}
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <div className="action-menu-wrapper">
                        <button 
                          className="action-btn"
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {showActionMenu === user.id && (
                          <div className="action-menu">
                            <button onClick={() => handleUserAction('view', user)}>
                              <Eye size={14} /> View Profile
                            </button>
                            <button onClick={() => handleUserAction('edit', user)}>
                              <Edit size={14} /> Edit User
                            </button>
                            <button>
                              <Mail size={14} /> Send Email
                            </button>
                            {user.status === 'active' ? (
                              <button className="warning" onClick={() => handleUserAction('suspend', user)}>
                                <Ban size={14} /> Suspend
                              </button>
                            ) : (
                              <button className="success" onClick={() => handleUserAction('activate', user)}>
                                <CheckCircle size={14} /> Activate
                              </button>
                            )}
                            <button className="danger" onClick={() => handleUserAction('delete', user)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </span>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && <span className="pagination-ellipsis">...</span>}
            <button 
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" defaultValue={editingUser?.firstName || ''} placeholder="John" />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" defaultValue={editingUser?.lastName || ''} placeholder="Doe" />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" defaultValue={editingUser?.email || ''} placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label>Company (Optional)</label>
                <input type="text" defaultValue={editingUser?.company || ''} placeholder="Company Name" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select defaultValue={editingUser?.role || 'user'}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="support">Support</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tier</label>
                  <select defaultValue={editingUser?.tier || 'free'}>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select defaultValue={editingUser?.status || 'active'}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="btn-primary">
                <Check size={18} />
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
