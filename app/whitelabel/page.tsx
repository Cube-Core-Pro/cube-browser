'use client';

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, DollarSign, Palette,
  Globe, Settings, BarChart3, HelpCircle,
  Plus, Search, ChevronRight, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Shield,
  Loader2, ExternalLink, Copy, RefreshCw,
  Eye, MoreVertical, Edit, Trash2, Power
} from 'lucide-react';
import './whitelabel.css';

// ============================================
// Types
// ============================================

interface ResellerStats {
  activeClients: number;
  monthlyRevenue: number;
  mrrGrowth: number;
  customDomains: number;
  pendingSetups: number;
  supportTickets: number;
  totalUsers: number;
  apiCalls: number;
}

interface Client {
  id: string;
  companyName: string;
  domain: string;
  customDomain: string | null;
  status: 'active' | 'pending' | 'suspended';
  plan: string;
  userCount: number;
  monthlyRevenue: number;
  createdAt: string;
  lastActive: string;
  logo: string | null;
}

interface RecentActivity {
  id: string;
  type: 'client_created' | 'domain_verified' | 'payment_received' | 'support_ticket' | 'user_added';
  description: string;
  clientName: string;
  timestamp: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  clients: number;
}

// ============================================
// Main Component
// ============================================

export default function WhiteLabelDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, clientsData, activityData, revenueHistory] = await Promise.all([
        invoke<ResellerStats>('get_reseller_stats'),
        invoke<Client[]>('get_reseller_clients', { limit: 10 }),
        invoke<RecentActivity[]>('get_reseller_activity', { limit: 5 }),
        invoke<RevenueData[]>('get_reseller_revenue_history', { months: 6 })
      ]);

      setStats(statsData);
      setClients(clientsData);
      setRecentActivity(activityData);
      setRevenueData(revenueHistory);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Load mock data for development
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setStats({
      activeClients: 47,
      monthlyRevenue: 12450,
      mrrGrowth: 23.5,
      customDomains: 12,
      pendingSetups: 3,
      supportTickets: 8,
      totalUsers: 342,
      apiCalls: 1250000
    });

    setClients([
      {
        id: '1',
        companyName: 'TechFlow Solutions',
        domain: 'techflow.cubeai.tools',
        customDomain: 'app.techflow.io',
        status: 'active',
        plan: 'Business',
        userCount: 45,
        monthlyRevenue: 495,
        createdAt: '2025-09-15',
        lastActive: '2026-01-08',
        logo: null
      },
      {
        id: '2',
        companyName: 'DataDriven Analytics',
        domain: 'datadriven.cubeai.tools',
        customDomain: null,
        status: 'active',
        plan: 'Professional',
        userCount: 23,
        monthlyRevenue: 237,
        createdAt: '2025-10-20',
        lastActive: '2026-01-07',
        logo: null
      },
      {
        id: '3',
        companyName: 'GrowthMetrics Inc',
        domain: 'growthmetrics.cubeai.tools',
        customDomain: 'dashboard.growthmetrics.com',
        status: 'active',
        plan: 'Enterprise',
        userCount: 89,
        monthlyRevenue: 899,
        createdAt: '2025-08-01',
        lastActive: '2026-01-08',
        logo: null
      },
      {
        id: '4',
        companyName: 'StartupHub',
        domain: 'startuphub.cubeai.tools',
        customDomain: null,
        status: 'pending',
        plan: 'Business',
        userCount: 0,
        monthlyRevenue: 0,
        createdAt: '2026-01-05',
        lastActive: '2026-01-05',
        logo: null
      },
      {
        id: '5',
        companyName: 'CloudSync Pro',
        domain: 'cloudsync.cubeai.tools',
        customDomain: 'platform.cloudsync.pro',
        status: 'active',
        plan: 'Business',
        userCount: 67,
        monthlyRevenue: 670,
        createdAt: '2025-11-10',
        lastActive: '2026-01-08',
        logo: null
      }
    ]);

    setRecentActivity([
      {
        id: '1',
        type: 'client_created',
        description: 'New client provisioned',
        clientName: 'StartupHub',
        timestamp: '2026-01-05T14:30:00Z'
      },
      {
        id: '2',
        type: 'domain_verified',
        description: 'Custom domain verified',
        clientName: 'CloudSync Pro',
        timestamp: '2026-01-04T10:15:00Z'
      },
      {
        id: '3',
        type: 'payment_received',
        description: 'Monthly payment processed',
        clientName: 'GrowthMetrics Inc',
        timestamp: '2026-01-01T00:00:00Z'
      },
      {
        id: '4',
        type: 'user_added',
        description: '5 new users added',
        clientName: 'TechFlow Solutions',
        timestamp: '2025-12-28T16:45:00Z'
      },
      {
        id: '5',
        type: 'support_ticket',
        description: 'Support ticket resolved',
        clientName: 'DataDriven Analytics',
        timestamp: '2025-12-27T09:20:00Z'
      }
    ]);

    setRevenueData([
      { month: 'Aug', revenue: 8500, clients: 32 },
      { month: 'Sep', revenue: 9200, clients: 36 },
      { month: 'Oct', revenue: 10100, clients: 40 },
      { month: 'Nov', revenue: 10800, clients: 43 },
      { month: 'Dec', revenue: 11600, clients: 45 },
      { month: 'Jan', revenue: 12450, clients: 47 }
    ]);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_created':
        return <Building2 className="w-4 h-4" />;
      case 'domain_verified':
        return <Globe className="w-4 h-4" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4" />;
      case 'support_ticket':
        return <HelpCircle className="w-4 h-4" />;
      case 'user_added':
        return <Users className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active"><CheckCircle2 className="w-3 h-3" /> Active</span>;
      case 'pending':
        return <span className="status-badge pending"><Clock className="w-3 h-3" /> Pending</span>;
      case 'suspended':
        return <span className="status-badge suspended"><AlertCircle className="w-3 h-3" /> Suspended</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  if (loading) {
    return (
      <div className="whitelabel-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading reseller dashboard...</p>
      </div>
    );
  }

  return (
    <div className="whitelabel-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Building2 className="w-8 h-8" />
            <div>
              <h1>White-Label Reseller Portal</h1>
              <p>Manage your CUBE AI deployment and clients</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={loadDashboardData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="btn-primary" onClick={() => router.push('/whitelabel/clients/new')}>
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <Users className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.activeClients}</span>
              <span className="stat-label">Active Clients</span>
            </div>
            <div className="stat-change positive">
              <TrendingUp className="w-3 h-3" />
              +4 this month
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(stats?.monthlyRevenue || 0)}</span>
              <span className="stat-label">Monthly Revenue</span>
            </div>
            <div className="stat-change positive">
              <TrendingUp className="w-3 h-3" />
              +{stats?.mrrGrowth}% MRR
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <Globe className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.customDomains}</span>
              <span className="stat-label">Custom Domains</span>
            </div>
            <div className="stat-badge">
              <Shield className="w-3 h-3" />
              SSL Active
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(stats?.apiCalls || 0)}</span>
              <span className="stat-label">API Calls/Month</span>
            </div>
            <div className="stat-badge">
              <CheckCircle2 className="w-3 h-3" />
              Under Limit
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => router.push('/whitelabel/clients/new')}>
            <div className="action-icon">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="action-content">
              <h3>Add Client</h3>
              <p>Provision new tenant</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button className="action-card" onClick={() => router.push('/whitelabel/branding')}>
            <div className="action-icon">
              <Palette className="w-6 h-6" />
            </div>
            <div className="action-content">
              <h3>Branding</h3>
              <p>Customize appearance</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button className="action-card" onClick={() => router.push('/whitelabel/domains')}>
            <div className="action-icon">
              <Globe className="w-6 h-6" />
            </div>
            <div className="action-content">
              <h3>Domains</h3>
              <p>Manage custom domains</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button className="action-card" onClick={() => router.push('/whitelabel/analytics')}>
            <div className="action-icon">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="action-content">
              <h3>Analytics</h3>
              <p>View performance</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button className="action-card" onClick={() => router.push('/whitelabel/clients')}>
            <div className="action-icon">
              <Users className="w-6 h-6" />
            </div>
            <div className="action-content">
              <h3>All Clients</h3>
              <p>Manage clients</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>

          <button className="action-card" onClick={() => router.push('/whitelabel/settings')}>
            <div className="action-icon">
              <Settings className="w-6 h-6" />
            </div>
            <div className="action-content">
              <h3>Settings</h3>
              <p>Configure platform</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Client List */}
        <section className="clients-section">
          <div className="section-header">
            <h2>Your Clients</h2>
            <div className="search-box">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="clients-table">
            <div className="table-header">
              <span>Company</span>
              <span>Domain</span>
              <span>Status</span>
              <span>Plan</span>
              <span>Users</span>
              <span>Revenue</span>
              <span></span>
            </div>

            {filteredClients.map((client) => (
              <div key={client.id} className="table-row">
                <div className="client-info">
                  <div className="client-avatar">
                    {client.companyName.charAt(0)}
                  </div>
                  <div className="client-name">
                    <span>{client.companyName}</span>
                    <small>Active {formatDate(client.lastActive)}</small>
                  </div>
                </div>

                <div className="client-domain">
                  <span className="subdomain">{client.domain}</span>
                  {client.customDomain && (
                    <span className="custom-domain">
                      <Globe className="w-3 h-3" />
                      {client.customDomain}
                    </span>
                  )}
                </div>

                <div className="client-status">
                  {getStatusBadge(client.status)}
                </div>

                <div className="client-plan">
                  <span className={`plan-badge ${client.plan.toLowerCase()}`}>
                    {client.plan}
                  </span>
                </div>

                <div className="client-users">
                  <Users className="w-4 h-4" />
                  {client.userCount}
                </div>

                <div className="client-revenue">
                  {formatCurrency(client.monthlyRevenue)}/mo
                </div>

                <div className="client-actions">
                  <button className="action-btn" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="action-btn" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="action-btn more">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="view-all-btn" onClick={() => router.push('/whitelabel/clients')}>
            View All Clients
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Revenue Chart */}
          <div className="chart-card">
            <h3>Revenue Trend</h3>
            <div className="mini-chart">
              {revenueData.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  >
                    <span className="bar-tooltip">{formatCurrency(data.revenue)}</span>
                  </div>
                  <span className="chart-label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <span className="activity-description">{activity.description}</span>
                    <span className="activity-client">{activity.clientName}</span>
                  </div>
                  <span className="activity-time">{formatDate(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats-card">
            <h3>Overview</h3>
            <div className="quick-stat-item">
              <span className="label">Total Users</span>
              <span className="value">{stats?.totalUsers}</span>
            </div>
            <div className="quick-stat-item">
              <span className="label">Pending Setups</span>
              <span className="value warning">{stats?.pendingSetups}</span>
            </div>
            <div className="quick-stat-item">
              <span className="label">Open Tickets</span>
              <span className="value">{stats?.supportTickets}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Support Banner */}
      <section className="support-banner">
        <div className="banner-content">
          <HelpCircle className="w-6 h-6" />
          <div>
            <h3>Need Help with White-Label Setup?</h3>
            <p>Our team is here to help you configure and customize your deployment.</p>
          </div>
        </div>
        <button className="btn-outline">
          Contact Support
          <ExternalLink className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
