'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Plus, Search, Filter, Download,
  Users, Globe, DollarSign, Calendar, MoreVertical,
  Eye, Edit, Trash2, Power, ChevronDown, CheckCircle2,
  Clock, AlertCircle, XCircle, Mail, Phone, RefreshCw,
  Loader2, ArrowUpDown, ChevronLeft, ChevronRight,
  ExternalLink, Copy, Settings, Shield
} from 'lucide-react';
import '../whitelabel.css';

// ============================================
// Types
// ============================================

interface Client {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  domain: string;
  customDomain: string | null;
  status: 'active' | 'pending' | 'suspended' | 'cancelled';
  plan: string;
  userCount: number;
  userLimit: number;
  monthlyRevenue: number;
  storageUsedGb: number;
  storageLimitGb: number;
  createdAt: string;
  lastActive: string;
  logo: string | null;
  notes: string;
  billingEmail: string;
}

interface ClientFilter {
  status: string;
  plan: string;
  search: string;
}

// ============================================
// Main Component
// ============================================

export default function ClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [filters, setFilters] = useState<ClientFilter>({
    status: 'all',
    plan: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'users' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadClients();
  }, [filters, sortBy, sortOrder, currentPage]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await invoke<{ clients: Client[]; total: number }>('get_reseller_clients', {
        filters,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage
      });
      setClients(response.clients);
      setTotalClients(response.total);
    } catch (error) {
      console.error('Failed to load clients:', error);
      loadMockClients();
    } finally {
      setLoading(false);
    }
  };

  const loadMockClients = () => {
    const mockClients: Client[] = [
      {
        id: '1',
        companyName: 'TechFlow Solutions',
        email: 'admin@techflow.io',
        phone: '+1 (555) 123-4567',
        domain: 'techflow.cubeai.tools',
        customDomain: 'app.techflow.io',
        status: 'active',
        plan: 'Business',
        userCount: 45,
        userLimit: 50,
        monthlyRevenue: 495,
        storageUsedGb: 23,
        storageLimitGb: 50,
        createdAt: '2025-09-15T10:30:00Z',
        lastActive: '2026-01-08T14:22:00Z',
        logo: null,
        notes: 'Key client, considering upgrade to Enterprise',
        billingEmail: 'billing@techflow.io'
      },
      {
        id: '2',
        companyName: 'DataDriven Analytics',
        email: 'contact@datadriven.com',
        phone: '+1 (555) 234-5678',
        domain: 'datadriven.cubeai.tools',
        customDomain: null,
        status: 'active',
        plan: 'Professional',
        userCount: 23,
        userLimit: 25,
        monthlyRevenue: 237,
        storageUsedGb: 12,
        storageLimitGb: 25,
        createdAt: '2025-10-20T09:15:00Z',
        lastActive: '2026-01-07T11:45:00Z',
        logo: null,
        notes: '',
        billingEmail: 'finance@datadriven.com'
      },
      {
        id: '3',
        companyName: 'GrowthMetrics Inc',
        email: 'hello@growthmetrics.com',
        phone: '+1 (555) 345-6789',
        domain: 'growthmetrics.cubeai.tools',
        customDomain: 'dashboard.growthmetrics.com',
        status: 'active',
        plan: 'Enterprise',
        userCount: 89,
        userLimit: 200,
        monthlyRevenue: 899,
        storageUsedGb: 67,
        storageLimitGb: 200,
        createdAt: '2025-08-01T08:00:00Z',
        lastActive: '2026-01-08T16:30:00Z',
        logo: null,
        notes: 'VIP client, dedicated support',
        billingEmail: 'accounts@growthmetrics.com'
      },
      {
        id: '4',
        companyName: 'StartupHub',
        email: 'team@startuphub.co',
        phone: '+1 (555) 456-7890',
        domain: 'startuphub.cubeai.tools',
        customDomain: null,
        status: 'pending',
        plan: 'Business',
        userCount: 0,
        userLimit: 50,
        monthlyRevenue: 0,
        storageUsedGb: 0,
        storageLimitGb: 50,
        createdAt: '2026-01-05T14:30:00Z',
        lastActive: '2026-01-05T14:30:00Z',
        logo: null,
        notes: 'Waiting for initial setup',
        billingEmail: 'team@startuphub.co'
      },
      {
        id: '5',
        companyName: 'CloudSync Pro',
        email: 'info@cloudsync.pro',
        phone: '+1 (555) 567-8901',
        domain: 'cloudsync.cubeai.tools',
        customDomain: 'platform.cloudsync.pro',
        status: 'active',
        plan: 'Business',
        userCount: 67,
        userLimit: 100,
        monthlyRevenue: 670,
        storageUsedGb: 45,
        storageLimitGb: 100,
        createdAt: '2025-11-10T11:20:00Z',
        lastActive: '2026-01-08T09:15:00Z',
        logo: null,
        notes: 'Upgraded from Professional last month',
        billingEmail: 'billing@cloudsync.pro'
      },
      {
        id: '6',
        companyName: 'Marketing Wizards',
        email: 'hello@marketingwizards.io',
        phone: '+1 (555) 678-9012',
        domain: 'mwizards.cubeai.tools',
        customDomain: null,
        status: 'suspended',
        plan: 'Professional',
        userCount: 15,
        userLimit: 25,
        monthlyRevenue: 0,
        storageUsedGb: 8,
        storageLimitGb: 25,
        createdAt: '2025-07-22T13:45:00Z',
        lastActive: '2025-12-15T10:00:00Z',
        logo: null,
        notes: 'Payment failed, account suspended',
        billingEmail: 'finance@marketingwizards.io'
      },
      {
        id: '7',
        companyName: 'InnovateTech Labs',
        email: 'contact@innovatetech.dev',
        phone: '+1 (555) 789-0123',
        domain: 'innovatetech.cubeai.tools',
        customDomain: 'suite.innovatetech.dev',
        status: 'active',
        plan: 'Enterprise',
        userCount: 156,
        userLimit: 500,
        monthlyRevenue: 1499,
        storageUsedGb: 234,
        storageLimitGb: 500,
        createdAt: '2025-06-15T07:30:00Z',
        lastActive: '2026-01-08T17:45:00Z',
        logo: null,
        notes: 'Largest client, annual contract',
        billingEmail: 'ap@innovatetech.dev'
      },
      {
        id: '8',
        companyName: 'Digital Nomads Co',
        email: 'team@digitalnomads.co',
        phone: '+1 (555) 890-1234',
        domain: 'nomads.cubeai.tools',
        customDomain: null,
        status: 'active',
        plan: 'Professional',
        userCount: 18,
        userLimit: 25,
        monthlyRevenue: 198,
        storageUsedGb: 7,
        storageLimitGb: 25,
        createdAt: '2025-12-01T15:00:00Z',
        lastActive: '2026-01-06T12:30:00Z',
        logo: null,
        notes: '',
        billingEmail: 'team@digitalnomads.co'
      }
    ];
    
    let filtered = mockClients;
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.plan !== 'all') {
      filtered = filtered.filter(c => c.plan.toLowerCase() === filters.plan.toLowerCase());
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.companyName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.domain.toLowerCase().includes(search)
      );
    }
    
    setClients(filtered);
    setTotalClients(filtered.length);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      active: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Active', className: 'active' },
      pending: { icon: <Clock className="w-3 h-3" />, label: 'Pending', className: 'pending' },
      suspended: { icon: <AlertCircle className="w-3 h-3" />, label: 'Suspended', className: 'suspended' },
      cancelled: { icon: <XCircle className="w-3 h-3" />, label: 'Cancelled', className: 'cancelled' }
    };
    const config = configs[status] || configs.pending;
    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    return (
      <span className={`plan-badge ${plan.toLowerCase()}`}>
        {plan}
      </span>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map(c => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, id]);
    } else {
      setSelectedClients(selectedClients.filter(cid => cid !== id));
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await invoke('delete_tenant', { tenantId: id });
      setClients(clients.filter(c => c.id !== id));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client');
    }
  };

  const handleSuspendClient = async (id: string) => {
    try {
      await invoke('suspend_tenant', { tenantId: id });
      setClients(clients.map(c => 
        c.id === id ? { ...c, status: 'suspended' as const } : c
      ));
    } catch (error) {
      console.error('Failed to suspend client:', error);
    }
  };

  const handleReactivateClient = async (id: string) => {
    try {
      await invoke('reactivate_tenant', { tenantId: id });
      setClients(clients.map(c => 
        c.id === id ? { ...c, status: 'active' as const } : c
      ));
    } catch (error) {
      console.error('Failed to reactivate client:', error);
    }
  };

  const totalPages = Math.ceil(totalClients / itemsPerPage);

  const exportClients = () => {
    const csv = [
      ['Company', 'Email', 'Domain', 'Status', 'Plan', 'Users', 'Revenue', 'Created'].join(','),
      ...clients.map(c => [
        c.companyName,
        c.email,
        c.domain,
        c.status,
        c.plan,
        c.userCount,
        c.monthlyRevenue,
        c.createdAt
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients-export.csv';
    a.click();
  };

  return (
    <div className="clients-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => router.push('/whitelabel')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="header-title">
            <Building2 className="w-6 h-6" />
            <div>
              <h1>Client Management</h1>
              <p>{totalClients} total clients</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={exportClients}>
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-primary" onClick={() => router.push('/whitelabel/clients/new')}>
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box large">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients by name, email, or domain..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
          >
            <option value="all">All Plans</option>
            <option value="professional">Professional</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button 
            className="btn-icon"
            onClick={() => loadClients()}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedClients.length} selected</span>
          <button className="btn-text" onClick={() => setSelectedClients([])}>
            Clear selection
          </button>
          <div className="bulk-buttons">
            <button className="btn-secondary small">
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button className="btn-secondary small danger">
              <Power className="w-4 h-4" />
              Suspend
            </button>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="clients-table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p>Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <Building2 className="w-12 h-12" />
            <h3>No clients found</h3>
            <p>Try adjusting your filters or add a new client</p>
            <button className="btn-primary" onClick={() => router.push('/whitelabel/clients/new')}>
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        ) : (
          <table className="clients-table-full">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Company
                  {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
                </th>
                <th>Domain</th>
                <th>Status</th>
                <th>Plan</th>
                <th className="sortable" onClick={() => handleSort('users')}>
                  Users
                  {sortBy === 'users' && <ArrowUpDown className="w-3 h-3" />}
                </th>
                <th className="sortable" onClick={() => handleSort('revenue')}>
                  Revenue
                  {sortBy === 'revenue' && <ArrowUpDown className="w-3 h-3" />}
                </th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className={selectedClients.includes(client.id) ? 'selected' : ''}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={(e) => handleSelectClient(client.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <div className="client-cell">
                      <div className="client-avatar">
                        {client.companyName.charAt(0)}
                      </div>
                      <div className="client-info">
                        <span className="company-name">{client.companyName}</span>
                        <span className="company-email">{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="domain-cell">
                      <span className="subdomain">{client.domain}</span>
                      {client.customDomain && (
                        <span className="custom-domain">
                          <Globe className="w-3 h-3" />
                          {client.customDomain}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(client.status)}</td>
                  <td>{getPlanBadge(client.plan)}</td>
                  <td>
                    <div className="users-cell">
                      <span>{client.userCount}</span>
                      <span className="limit">/ {client.userLimit}</span>
                    </div>
                  </td>
                  <td>
                    <span className="revenue-cell">{formatCurrency(client.monthlyRevenue)}/mo</span>
                  </td>
                  <td>
                    <span className="time-cell">{formatRelativeTime(client.lastActive)}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="action-btn"
                        title="View"
                        onClick={() => router.push(`/whitelabel/clients/${client.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="action-btn"
                        title="Edit"
                        onClick={() => router.push(`/whitelabel/clients/${client.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="action-menu-container">
                        <button 
                          className="action-btn"
                          onClick={() => setActionMenuId(actionMenuId === client.id ? null : client.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenuId === client.id && (
                          <div className="action-menu">
                            <button onClick={() => router.push(`/whitelabel/clients/${client.id}/settings`)}>
                              <Settings className="w-4 h-4" />
                              Settings
                            </button>
                            <button onClick={() => window.open(`https://${client.domain}`, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                              Open Portal
                            </button>
                            <button onClick={() => navigator.clipboard.writeText(client.domain)}>
                              <Copy className="w-4 h-4" />
                              Copy Domain
                            </button>
                            <hr />
                            {client.status === 'active' ? (
                              <button className="warning" onClick={() => handleSuspendClient(client.id)}>
                                <Power className="w-4 h-4" />
                                Suspend
                              </button>
                            ) : client.status === 'suspended' ? (
                              <button className="success" onClick={() => handleReactivateClient(client.id)}>
                                <Shield className="w-4 h-4" />
                                Reactivate
                              </button>
                            ) : null}
                            <button className="danger" onClick={() => setShowDeleteModal(client.id)}>
                              <Trash2 className="w-4 h-4" />
                              Delete
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalClients)} of {totalClients}
            </span>
            <div className="pagination-controls">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={page === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon danger">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3>Delete Client?</h3>
            <p>This action cannot be undone. All data associated with this client will be permanently deleted.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeleteClient(showDeleteModal)}>
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
