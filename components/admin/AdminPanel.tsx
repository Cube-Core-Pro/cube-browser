'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserManagementService,
  LicenseManagementService,
  ApiKeyManagementService,
  SalesManagementService,
  DownloadsService,
  AdminMetricsService,
  AdminExportService,
} from '@/lib/services/admin-service';
import {
  Server, Users, Activity, Shield, Globe,
  Settings, BarChart3, AlertTriangle, CheckCircle, XCircle,
  Clock, Cpu, HardDrive, Lock, RefreshCw,
  Download, Zap, Terminal, FileText, Search,
  Plus, Trash2,
  Edit, Copy, ExternalLink, Bell, Calendar,
  TrendingUp, TrendingDown, Minus, Play,
  Upload, UserPlus, HeadphonesIcon, FolderOpen
} from 'lucide-react';
import { UpdateManager } from './UpdateManager';
import { AffiliateManager } from './AffiliateManager';
import { HelpdeskManager } from './HelpdeskManager';
import { FileManager } from './FileManager';
import { logger } from '@/lib/services/logger-service';
import './AdminPanel.css';

const log = logger.scope('AdminPanel');

// ===== Types =====
interface ServerStats {
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  uptime: number;
  requests: number;
  errors: number;
  latency: number;
}

interface UserAccount {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  created: Date;
  lastLogin: Date;
  apiCalls: number;
  features: string[];
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  permissions: string[];
  created: Date;
  lastUsed: Date;
  requests: number;
  status: 'active' | 'revoked';
  rateLimit?: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: Date;
}

interface SaleRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  plan: 'pro' | 'elite' | 'enterprise';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  date: Date;
  paymentMethod: string;
  invoiceId: string;
}

interface DownloadRecord {
  id: string;
  userId: string;
  userName: string;
  platform: 'windows' | 'macos' | 'linux';
  version: string;
  date: Date;
  ipAddress: string;
  country: string;
}

interface LicenseRecord {
  id: string;
  key: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'pro' | 'elite' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  activatedAt: Date;
  expiresAt: Date;
  devicesUsed: number;
  maxDevices: number;
}

interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalSales: number;
  monthlySales: number;
  totalDownloads: number;
  monthlyDownloads: number;
  activeLicenses: number;
  churnRate: number;
  avgRevenuePerUser: number;
  conversionRate: number;
  mrr?: number;
  arr?: number;
}

// Modal state interfaces
interface CreateUserModalState {
  isOpen: boolean;
  email: string;
  name: string;
  plan: string;
}

interface CreateLicenseModalState {
  isOpen: boolean;
  userId: string;
  plan: string;
  durationDays: number;
  maxDevices: number;
}

interface CreateApiKeyModalState {
  isOpen: boolean;
  userId: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  newKeyValue?: string;
}

// Helper to convert backend dates to Date objects
const parseDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
};

// ===== Component =====
export const AdminPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [serverStats, setServerStats] = useState<ServerStats>({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: { in: 1250, out: 890 },
    uptime: 99.97,
    requests: 1250000,
    errors: 127,
    latency: 45
  });
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalSales: 0,
    monthlySales: 0,
    totalDownloads: 0,
    monthlyDownloads: 0,
    activeLicenses: 0,
    churnRate: 0,
    avgRevenuePerUser: 0,
    conversionRate: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  // Modal states
  const [createUserModal, setCreateUserModal] = useState<CreateUserModalState>({
    isOpen: false,
    email: '',
    name: '',
    plan: 'pro'
  });
  const [createLicenseModal, setCreateLicenseModal] = useState<CreateLicenseModalState>({
    isOpen: false,
    userId: '',
    plan: 'pro',
    durationDays: 365,
    maxDevices: 3
  });
  const [createApiKeyModal, setCreateApiKeyModal] = useState<CreateApiKeyModalState>({
    isOpen: false,
    userId: '',
    name: '',
    permissions: ['read'],
    rateLimit: 1000
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Load data from backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel using AdminService
      const [
        usersData,
        licensesData,
        salesData,
        downloadsData,
        apiKeysData,
        metricsData,
        serverStatsData,
        servicesData
      ] = await Promise.all([
        UserManagementService.getUsers(null, null, null).catch(() => []),
        LicenseManagementService.getLicenses(null, null, null).catch(() => []),
        SalesManagementService.getSales(null, null, null, null).catch(() => []),
        DownloadsService.getDownloads(null, null, null).catch(() => []),
        ApiKeyManagementService.getApiKeys(null).catch(() => []),
        AdminMetricsService.getMetrics().catch(() => null),
        AdminMetricsService.getServerStats().catch(() => null),
        AdminMetricsService.getServices().catch(() => [])
      ]);

      // Transform backend data to frontend format (handle date conversions)
      setUsers(usersData.map(u => ({
        ...u,
        created: parseDate(u.created_at || u.created),
        lastLogin: u.last_login ? parseDate(u.last_login) : (u.lastLogin ? parseDate(u.lastLogin) : new Date()),
        apiCalls: u.api_calls ?? u.apiCalls ?? 0
      })));

      setLicenses(licensesData.map(l => ({
        ...l,
        activatedAt: parseDate(l.activated_at || l.activatedAt),
        expiresAt: parseDate(l.expires_at || l.expiresAt),
        devicesUsed: l.devices_used ?? l.devicesUsed ?? 0,
        maxDevices: l.max_devices ?? l.maxDevices ?? 1,
        userName: l.user_name || l.userName || '',
        userEmail: l.user_email || l.userEmail || ''
      })));

      setSales(salesData.map(s => ({
        ...s,
        date: parseDate(s.date),
        customerId: s.customer_id || s.customerId || '',
        customerName: s.customer_name || s.customerName || '',
        customerEmail: s.customer_email || s.customerEmail || '',
        paymentMethod: s.payment_method || s.paymentMethod || '',
        invoiceId: s.invoice_id || s.invoiceId || ''
      })));

      setDownloads(downloadsData.map(d => ({
        ...d,
        date: parseDate(d.date),
        userId: d.user_id || d.userId || '',
        userName: d.user_name || d.userName || '',
        ipAddress: d.ip_address || d.ipAddress || '',
        userAgent: d.user_agent || ''
      })));

      setApiKeys(apiKeysData.map(k => ({
        ...k,
        key: k.key_preview || k.key || '',
        userId: k.user_id || k.userId || '',
        created: parseDate(k.created_at || k.created),
        lastUsed: k.last_used ? parseDate(k.last_used) : (k.lastUsed ? parseDate(k.lastUsed) : new Date()),
        rateLimit: k.rate_limit ?? 1000
      })));

      if (metricsData) {
        setBusinessMetrics({
          totalRevenue: metricsData.total_revenue ?? metricsData.totalRevenue ?? 0,
          monthlyRevenue: metricsData.monthly_revenue ?? metricsData.monthlyRevenue ?? 0,
          totalSales: metricsData.total_sales ?? metricsData.totalSales ?? 0,
          monthlySales: metricsData.monthly_sales ?? metricsData.monthlySales ?? 0,
          totalDownloads: metricsData.total_downloads ?? metricsData.totalDownloads ?? 0,
          monthlyDownloads: metricsData.monthly_downloads ?? metricsData.monthlyDownloads ?? 0,
          activeLicenses: metricsData.active_licenses ?? metricsData.activeLicenses ?? 0,
          churnRate: metricsData.churn_rate ?? metricsData.churnRate ?? 0,
          avgRevenuePerUser: metricsData.avg_revenue_per_user ?? metricsData.avgRevenuePerUser ?? 0,
          conversionRate: metricsData.conversion_rate ?? metricsData.conversionRate ?? 0,
          mrr: metricsData.mrr ?? 0,
          arr: metricsData.arr ?? 0
        });
      }

      if (serverStatsData) {
        setServerStats({
          cpu: serverStatsData.cpu_usage ?? serverStatsData.cpu ?? 0,
          memory: serverStatsData.memory_usage ?? serverStatsData.memory ?? 0,
          disk: serverStatsData.disk_usage ?? serverStatsData.disk ?? 0,
          network: { 
            in: serverStatsData.network_in ?? serverStatsData.network?.in ?? 0, 
            out: serverStatsData.network_out ?? serverStatsData.network?.out ?? 0 
          },
          uptime: serverStatsData.uptime_percent ?? serverStatsData.uptime ?? 99.9,
          requests: serverStatsData.total_requests ?? serverStatsData.requests ?? 0,
          errors: serverStatsData.error_count ?? serverStatsData.errors ?? 0,
          latency: serverStatsData.avg_latency_ms ?? serverStatsData.latency ?? 0
        });
      }

      setServices(servicesData.map(s => ({
        name: s.name,
        status: (s.status || 'healthy').toLowerCase() as 'healthy' | 'degraded' | 'down',
        latency: s.latency_ms ?? s.latency ?? 0,
        uptime: s.uptime_percent ?? s.uptime ?? 99.9,
        lastCheck: parseDate(s.last_check || s.lastCheck || new Date())
      })));

    } catch (err) {
      log.error('Failed to load admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // User Management Functions
  const handleCreateUser = async (userData: { email: string; name: string; plan: string; features: string[] }) => {
    try {
      await UserManagementService.createUser({
        email: userData.email,
        name: userData.name,
        plan: userData.plan,
        features: userData.features
      });
      await loadData();
    } catch (err) {
      log.error('Failed to create user:', err);
      throw err;
    }
  };

  const handleSuspendUser = async (userId: string, reason?: string) => {
    try {
      await UserManagementService.suspendUser(userId, reason);
      await loadData();
    } catch (err) {
      log.error('Failed to suspend user:', err);
      throw err;
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      await UserManagementService.reactivateUser(userId);
      await loadData();
    } catch (err) {
      log.error('Failed to reactivate user:', err);
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await UserManagementService.deleteUser(userId);
      await loadData();
    } catch (err) {
      log.error('Failed to delete user:', err);
      throw err;
    }
  };

  // License Management Functions
  const handleCreateLicense = async (licenseData: { userId: string; plan: string; durationDays: number; maxDevices: number }) => {
    try {
      await LicenseManagementService.createLicense({
        user_id: licenseData.userId,
        plan: licenseData.plan,
        duration_days: licenseData.durationDays,
        max_devices: licenseData.maxDevices
      });
      await loadData();
    } catch (err) {
      log.error('Failed to create license:', err);
      throw err;
    }
  };

  const handleRevokeLicense = async (licenseId: string, reason?: string) => {
    try {
      await LicenseManagementService.revokeLicense(licenseId, reason);
      await loadData();
    } catch (err) {
      log.error('Failed to revoke license:', err);
      throw err;
    }
  };

  const handleExtendLicense = async (licenseId: string, additionalDays: number) => {
    try {
      await LicenseManagementService.extendLicense(licenseId, additionalDays);
      await loadData();
    } catch (err) {
      log.error('Failed to extend license:', err);
      throw err;
    }
  };

  // API Key Management Functions
  const handleCreateApiKey = async (keyData: { userId: string; name: string; permissions: string[]; rateLimit: number }) => {
    try {
      const result = await ApiKeyManagementService.createApiKey({
        user_id: keyData.userId,
        name: keyData.name,
        permissions: keyData.permissions,
        rate_limit: keyData.rateLimit,
        expires_in_days: null
      });
      await loadData();
      // Return the raw key (only shown once)
      return result[1];
    } catch (err) {
      log.error('Failed to create API key:', err);
      throw err;
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      await ApiKeyManagementService.revokeApiKey(keyId);
      await loadData();
    } catch (err) {
      log.error('Failed to revoke API key:', err);
      throw err;
    }
  };

  // Sales Management Functions
  const handleRefundSale = async (saleId: string, reason?: string) => {
    try {
      await SalesManagementService.refundSale(saleId, reason);
      await loadData();
    } catch (err) {
      log.error('Failed to refund sale:', err);
      throw err;
    }
  };

  // Export Data Function
  const handleExportData = async (dataType: string, format: string) => {
    try {
      const data = await AdminExportService.exportData(dataType, format);
      // Create download
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      log.error('Failed to export data:', err);
      throw err;
    }
  };

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'sales', label: 'Sales', icon: <TrendingUp size={18} /> },
    { id: 'licenses', label: 'Licenses', icon: <Shield size={18} /> },
    { id: 'downloads', label: 'Downloads', icon: <Download size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'api-keys', label: 'API Keys', icon: <Lock size={18} /> },
    { id: 'services', label: 'Services', icon: <Server size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity size={18} /> },
    { id: 'updates', label: 'Updates', icon: <Upload size={18} /> },
    { id: 'affiliates', label: 'Affiliates', icon: <UserPlus size={18} /> },
    { id: 'helpdesk', label: 'Helpdesk', icon: <HeadphonesIcon size={18} /> },
    { id: 'files', label: 'Files', icon: <FolderOpen size={18} /> },
    { id: 'logs', label: 'Logs', icon: <Terminal size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="admin-panel">
      {/* Loading State */}
      {loading && (
        <div className="admin-loading-overlay">
          <div className="loading-spinner">
            <RefreshCw size={32} className="spin" />
            <span>Loading admin data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="admin-error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={loadData} className="retry-btn">Retry</button>
          <button onClick={() => setError(null)} className="dismiss-btn" title="Dismiss error">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <Shield size={24} />
            <span>CUBE Admin</span>
          </div>
          <span className="version">v1.0.0</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="https://docs.cubeai.tools" target="_blank" rel="noopener noreferrer">
            <FileText size={16} />
            Documentation
          </a>
          <a href="https://cubeai.tools" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            Main Site
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1>{navItems.find(i => i.id === activeSection)?.label}</h1>
            <span className="last-updated">
              Last updated: {formatRelativeTime(new Date())}
            </span>
          </div>
          <div className="header-right">
            <button 
              className="refresh-btn"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
              Refresh
            </button>
            <button className="notifications-btn">
              <Bell size={18} />
              <span className="badge">3</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="overview-section">
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon cpu">
                    <Cpu size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{serverStats.cpu.toFixed(1)}%</span>
                    <span className="stat-label">CPU Usage</span>
                  </div>
                  <div className={`stat-trend ${serverStats.cpu > 70 ? 'warning' : 'good'}`}>
                    {serverStats.cpu > 70 ? <TrendingUp size={16} /> : <Minus size={16} />}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon memory">
                    <HardDrive size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{serverStats.memory.toFixed(1)}%</span>
                    <span className="stat-label">Memory</span>
                  </div>
                  <div className={`stat-trend ${serverStats.memory > 80 ? 'warning' : 'good'}`}>
                    {serverStats.memory > 80 ? <TrendingUp size={16} /> : <Minus size={16} />}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon requests">
                    <Zap size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{formatNumber(serverStats.requests)}</span>
                    <span className="stat-label">Total Requests</span>
                  </div>
                  <div className="stat-trend good">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon latency">
                    <Clock size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{serverStats.latency.toFixed(0)}ms</span>
                    <span className="stat-label">Avg Latency</span>
                  </div>
                  <div className={`stat-trend ${serverStats.latency > 100 ? 'warning' : 'good'}`}>
                    {serverStats.latency > 100 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Services Status */}
              <div className="card services-status">
                <div className="card-header">
                  <h3>Service Status</h3>
                  <span className="uptime-badge">
                    {serverStats.uptime}% Uptime
                  </span>
                </div>
                <div className="services-grid">
                  {services.map((service, idx) => (
                    <div key={idx} className={`service-item ${service.status}`}>
                      <div className="service-status-dot"></div>
                      <span className="service-name">{service.name}</span>
                      <span className="service-latency">{service.latency}ms</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card recent-activity">
                <div className="card-header">
                  <h3>Recent Activity</h3>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="activity-list">
                  {[
                    { type: 'user', message: 'New user registered: john@example.com', time: '5m ago' },
                    { type: 'api', message: 'API key created for Production', time: '15m ago' },
                    { type: 'error', message: 'Rate limit exceeded for key cube_test_sk_***', time: '32m ago' },
                    { type: 'success', message: 'Database backup completed successfully', time: '1h ago' },
                    { type: 'warning', message: 'High memory usage detected on worker-3', time: '2h ago' }
                  ].map((item, idx) => (
                    <div key={idx} className={`activity-item ${item.type}`}>
                      <div className="activity-icon">
                        {item.type === 'user' && <Users size={16} />}
                        {item.type === 'api' && <Lock size={16} />}
                        {item.type === 'error' && <XCircle size={16} />}
                        {item.type === 'success' && <CheckCircle size={16} />}
                        {item.type === 'warning' && <AlertTriangle size={16} />}
                      </div>
                      <span className="activity-message">{item.message}</span>
                      <span className="activity-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sales Section */}
          {activeSection === 'sales' && (
            <div className="sales-section">
              {/* Business KPIs */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon revenue">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">${(businessMetrics.totalRevenue / 100).toLocaleString()}</span>
                    <span className="stat-label">Total Revenue</span>
                  </div>
                  <div className="stat-trend good">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon monthly">
                    <Calendar size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">${(businessMetrics.monthlyRevenue / 100).toLocaleString()}</span>
                    <span className="stat-label">Monthly Revenue</span>
                  </div>
                  <div className="stat-trend good">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon users-stat">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.totalSales.toLocaleString()}</span>
                    <span className="stat-label">Total Sales</span>
                  </div>
                  <div className="stat-trend good">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon conversion">
                    <Zap size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.conversionRate}%</span>
                    <span className="stat-label">Conversion Rate</span>
                  </div>
                  <div className="stat-trend good">
                    <TrendingUp size={16} />
                  </div>
                </div>
              </div>

              {/* Recent Sales */}
              <div className="card">
                <div className="card-header">
                  <h3>Recent Sales</h3>
                  <button 
                    className="view-all-btn"
                    onClick={() => handleExportData('sales', 'csv')}
                  >
                    Export CSV
                  </button>
                </div>
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Payment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map(sale => (
                        <tr key={sale.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {sale.customerName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="user-info">
                                <span className="user-name">{sale.customerName}</span>
                                <span className="user-email">{sale.customerEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`plan-badge ${sale.plan}`}>
                              {sale.plan.charAt(0).toUpperCase() + sale.plan.slice(1)}
                            </span>
                          </td>
                          <td className="amount-cell">
                            ${(sale.amount / 100).toFixed(2)}
                          </td>
                          <td>
                            <span className={`status-badge ${sale.status}`}>
                              {sale.status === 'completed' && <CheckCircle size={14} />}
                              {sale.status === 'pending' && <Clock size={14} />}
                              {sale.status === 'refunded' && <RefreshCw size={14} />}
                              {sale.status === 'failed' && <XCircle size={14} />}
                              {sale.status}
                            </span>
                          </td>
                          <td>{formatDate(sale.date)}</td>
                          <td>{sale.paymentMethod}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="action-btn" title="View Invoice">
                                <FileText size={16} />
                              </button>
                              <button 
                                className="action-btn" 
                                title="Refund"
                                disabled={sale.status === 'refunded'}
                                onClick={() => setConfirmDialog({
                                  isOpen: true,
                                  title: 'Refund Sale',
                                  message: `Are you sure you want to refund $${(sale.amount / 100).toFixed(2)} to ${sale.customerName}?`,
                                  onConfirm: () => handleRefundSale(sale.id, 'Customer request')
                                })}
                              >
                                <RefreshCw size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Licenses Section */}
          {activeSection === 'licenses' && (
            <div className="licenses-section">
              {/* License Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon licenses">
                    <Shield size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.activeLicenses.toLocaleString()}</span>
                    <span className="stat-label">Active Licenses</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon churn">
                    <TrendingDown size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.churnRate}%</span>
                    <span className="stat-label">Churn Rate</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon arpu">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">${businessMetrics.avgRevenuePerUser.toFixed(2)}</span>
                    <span className="stat-label">ARPU</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon users-stat">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.monthlySales}</span>
                    <span className="stat-label">New This Month</span>
                  </div>
                </div>
              </div>

              {/* License Management */}
              <div className="section-toolbar">
                <div className="search-bar">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search licenses by key, user, or email..."
                  />
                </div>
                <div className="filters">
                  <select defaultValue="all" title="Filter by status">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
                <button 
                  className="add-btn"
                  onClick={() => setCreateLicenseModal({ ...createLicenseModal, isOpen: true })}
                >
                  <Plus size={18} />
                  Generate License
                </button>
              </div>

              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>License Key</th>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Devices</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map(license => (
                      <tr key={license.id}>
                        <td>
                          <code className="license-key-code">
                            {license.key}
                          </code>
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {license.userName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{license.userName}</span>
                              <span className="user-email">{license.userEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`plan-badge ${license.plan}`}>
                            {license.plan.charAt(0).toUpperCase() + license.plan.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${license.status}`}>
                            {license.status === 'active' && <CheckCircle size={14} />}
                            {license.status === 'expired' && <Clock size={14} />}
                            {license.status === 'revoked' && <XCircle size={14} />}
                            {license.status === 'suspended' && <AlertTriangle size={14} />}
                            {license.status}
                          </span>
                        </td>
                        <td>
                          <span className={`device-count ${license.devicesUsed >= license.maxDevices ? 'warning' : 'ok'}`}>
                            {license.devicesUsed} / {license.maxDevices}
                          </span>
                        </td>
                        <td>{formatDate(license.expiresAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn" 
                              title="Copy Key"
                              onClick={() => navigator.clipboard.writeText(license.key)}
                            >
                              <Copy size={16} />
                            </button>
                            <button 
                              className="action-btn" 
                              title="Extend 30 Days"
                              onClick={() => handleExtendLicense(license.id, 30)}
                            >
                              <Calendar size={16} />
                            </button>
                            <button 
                              className="action-btn danger" 
                              title="Revoke"
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: 'Revoke License',
                                message: `Are you sure you want to revoke license ${license.key}?`,
                                onConfirm: () => handleRevokeLicense(license.id, 'Admin action')
                              })}
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Downloads Section */}
          {activeSection === 'downloads' && (
            <div className="downloads-section">
              {/* Download Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon downloads">
                    <Download size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.totalDownloads.toLocaleString()}</span>
                    <span className="stat-label">Total Downloads</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon revenue">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{businessMetrics.monthlyDownloads.toLocaleString()}</span>
                    <span className="stat-label">This Month</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon countries">
                    <Globe size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">45</span>
                    <span className="stat-label">Countries</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon version">
                    <Zap size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">v6.2.1</span>
                    <span className="stat-label">Latest Version</span>
                  </div>
                </div>
              </div>

              {/* Platform Distribution */}
              <div className="card mb-24">
                <div className="card-header">
                  <h3>Platform Distribution</h3>
                </div>
                <div className="platform-distribution">
                  <div className="platform-card">
                    <div className="platform-icon">🪟</div>
                    <div className="platform-percent">52%</div>
                    <div className="platform-label">Windows</div>
                  </div>
                  <div className="platform-card">
                    <div className="platform-icon">🍎</div>
                    <div className="platform-percent">38%</div>
                    <div className="platform-label">macOS</div>
                  </div>
                  <div className="platform-card">
                    <div className="platform-icon">🐧</div>
                    <div className="platform-percent">10%</div>
                    <div className="platform-label">Linux</div>
                  </div>
                </div>
              </div>

              {/* Recent Downloads */}
              <div className="card">
                <div className="card-header">
                  <h3>Recent Downloads</h3>
                  <button className="view-all-btn">Export Report</button>
                </div>
                <div className="users-table-wrapper">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Platform</th>
                        <th>Version</th>
                        <th>Date</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloads.map(dl => (
                        <tr key={dl.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {dl.userName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="user-info">
                                <span className="user-name">{dl.userName}</span>
                                <span className="user-email">{dl.ipAddress}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`plan-badge ${dl.platform}`}>
                              {dl.platform === 'windows' ? '🪟 Windows' :
                               dl.platform === 'macos' ? '🍎 macOS' :
                               '🐧 Linux'}
                            </span>
                          </td>
                          <td>
                            <code className="version-code">{dl.version}</code>
                          </td>
                          <td>{formatRelativeTime(dl.date)}</td>
                          <td>{dl.country}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Section */}
          {activeSection === 'users' && (
            <div className="users-section">
              <div className="section-toolbar">
                <div className="search-bar">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="filters">
                  <select 
                    value={selectedPlan} 
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    title="Filter by plan"
                  >
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <button 
                  className="add-btn"
                  onClick={() => setCreateUserModal({ ...createUserModal, isOpen: true })}
                >
                  <Plus size={18} />
                  Add User
                </button>
              </div>

              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>API Calls</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{user.name}</span>
                              <span className="user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`plan-badge ${user.plan}`}>
                            {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.status}`}>
                            {user.status === 'active' && <CheckCircle size={14} />}
                            {user.status === 'suspended' && <XCircle size={14} />}
                            {user.status === 'pending' && <Clock size={14} />}
                            {user.status}
                          </span>
                        </td>
                        <td>{formatNumber(user.apiCalls)}</td>
                        <td>{formatRelativeTime(user.lastLogin)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn" title="Edit">
                              <Edit size={16} />
                            </button>
                            {user.status === 'suspended' ? (
                              <button 
                                className="action-btn" 
                                title="Reactivate"
                                onClick={() => handleReactivateUser(user.id)}
                              >
                                <CheckCircle size={16} />
                              </button>
                            ) : (
                              <button 
                                className="action-btn warning" 
                                title="Suspend"
                                onClick={() => setConfirmDialog({
                                  isOpen: true,
                                  title: 'Suspend User',
                                  message: `Are you sure you want to suspend ${user.name}?`,
                                  onConfirm: () => handleSuspendUser(user.id, 'Admin action')
                                })}
                              >
                                <AlertTriangle size={16} />
                              </button>
                            )}
                            <button 
                              className="action-btn danger" 
                              title="Delete"
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                title: 'Delete User',
                                message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
                                onConfirm: () => handleDeleteUser(user.id)
                              })}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          {activeSection === 'api-keys' && (
            <div className="api-keys-section">
              <div className="section-toolbar">
                <div className="search-bar">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search API keys..."
                  />
                </div>
                <button 
                  className="add-btn"
                  onClick={() => setCreateApiKeyModal({ ...createApiKeyModal, isOpen: true })}
                >
                  <Plus size={18} />
                  Create Key
                </button>
              </div>

              <div className="api-keys-list">
                {apiKeys.map(key => (
                  <div key={key.id} className="api-key-card">
                    <div className="key-header">
                      <div className="key-info">
                        <Lock size={20} />
                        <div>
                          <span className="key-name">{key.name}</span>
                          <span className="key-value">{key.key}</span>
                        </div>
                      </div>
                      <span className={`status-badge ${key.status}`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="key-details">
                      <div className="key-stat">
                        <span className="stat-label">Requests</span>
                        <span className="stat-value">{formatNumber(key.requests)}</span>
                      </div>
                      <div className="key-stat">
                        <span className="stat-label">Created</span>
                        <span className="stat-value">{formatDate(key.created)}</span>
                      </div>
                      <div className="key-stat">
                        <span className="stat-label">Last Used</span>
                        <span className="stat-value">{formatRelativeTime(key.lastUsed)}</span>
                      </div>
                    </div>
                    <div className="key-permissions">
                      {key.permissions.map((perm, idx) => (
                        <span key={idx} className="permission-badge">{perm}</span>
                      ))}
                    </div>
                    <div className="key-actions">
                      <button 
                        className="action-btn"
                        onClick={() => navigator.clipboard.writeText(key.key)}
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                      <button className="action-btn" disabled>
                        <RefreshCw size={16} />
                        Rotate
                      </button>
                      <button 
                        className="action-btn danger"
                        onClick={() => setConfirmDialog({
                          isOpen: true,
                          title: 'Revoke API Key',
                          message: `Are you sure you want to revoke API key "${key.name}"? Applications using this key will stop working.`,
                          onConfirm: () => handleRevokeApiKey(key.id)
                        })}
                      >
                        <Trash2 size={16} />
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services Section */}
          {activeSection === 'services' && (
            <div className="services-section">
              <div className="services-overview">
                <div className="services-summary">
                  <div className="summary-item healthy">
                    <CheckCircle size={24} />
                    <span className="count">{services.filter(s => s.status === 'healthy').length}</span>
                    <span className="label">Healthy</span>
                  </div>
                  <div className="summary-item degraded">
                    <AlertTriangle size={24} />
                    <span className="count">{services.filter(s => s.status === 'degraded').length}</span>
                    <span className="label">Degraded</span>
                  </div>
                  <div className="summary-item down">
                    <XCircle size={24} />
                    <span className="count">{services.filter(s => s.status === 'down').length}</span>
                    <span className="label">Down</span>
                  </div>
                </div>
              </div>

              <div className="services-list">
                {services.map((service, idx) => (
                  <div key={idx} className={`service-card ${service.status}`}>
                    <div className="service-header">
                      <div className="service-status-indicator"></div>
                      <span className="service-name">{service.name}</span>
                      <span className={`status-badge ${service.status}`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="service-metrics">
                      <div className="metric">
                        <Clock size={14} />
                        <span>{service.latency}ms</span>
                      </div>
                      <div className="metric">
                        <TrendingUp size={14} />
                        <span>{service.uptime}%</span>
                      </div>
                      <div className="metric">
                        <RefreshCw size={14} />
                        <span>{formatRelativeTime(service.lastCheck)}</span>
                      </div>
                    </div>
                    <div className="service-actions">
                      <button className="action-btn">
                        <Play size={14} />
                        Restart
                      </button>
                      <button className="action-btn">
                        <Terminal size={14} />
                        Logs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updates Section */}
          {activeSection === 'updates' && (
            <UpdateManager />
          )}

          {/* Affiliates Section */}
          {activeSection === 'affiliates' && (
            <AffiliateManager />
          )}

          {/* Helpdesk Section */}
          {activeSection === 'helpdesk' && (
            <HelpdeskManager />
          )}

          {/* Files Section */}
          {activeSection === 'files' && (
            <FileManager />
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="settings-section">
              <div className="settings-group">
                <h3>API Configuration</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">API Base URL</span>
                    <span className="setting-description">The base URL for all API requests</span>
                  </div>
                  <input type="text" value="https://api.cubeai.tools" readOnly title="API Base URL (read-only)" />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Rate Limit</span>
                    <span className="setting-description">Maximum requests per minute</span>
                  </div>
                  <input type="number" defaultValue={1000} title="Rate limit - requests per minute" />
                </div>
              </div>

              <div className="settings-group">
                <h3>Security</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Two-Factor Authentication</span>
                    <span className="setting-description">Require 2FA for admin access</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked title="Toggle two-factor authentication" />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">IP Whitelist</span>
                    <span className="setting-description">Only allow access from specific IPs</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" title="Toggle IP whitelist" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <h3>Notifications</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Email Alerts</span>
                    <span className="setting-description">Send alerts for critical events</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked title="Toggle email alerts" />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Slack Integration</span>
                    <span className="setting-description">Post notifications to Slack</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" title="Toggle Slack integration" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {createUserModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCreateUserModal({ ...createUserModal, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button onClick={() => setCreateUserModal({ ...createUserModal, isOpen: false })} title="Close modal">
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={createUserModal.name}
                  onChange={e => setCreateUserModal({ ...createUserModal, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={createUserModal.email}
                  onChange={e => setCreateUserModal({ ...createUserModal, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select
                  value={createUserModal.plan}
                  onChange={e => setCreateUserModal({ ...createUserModal, plan: e.target.value })}
                  title="Select user plan"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setCreateUserModal({ ...createUserModal, isOpen: false })}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={async () => {
                  await handleCreateUser({
                    name: createUserModal.name,
                    email: createUserModal.email,
                    plan: createUserModal.plan,
                    features: []
                  });
                  setCreateUserModal({ isOpen: false, name: '', email: '', plan: 'pro' });
                }}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create License Modal */}
      {createLicenseModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCreateLicenseModal({ ...createLicenseModal, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate New License</h2>
              <button onClick={() => setCreateLicenseModal({ ...createLicenseModal, isOpen: false })} title="Close modal">
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={createLicenseModal.userId}
                  onChange={e => setCreateLicenseModal({ ...createLicenseModal, userId: e.target.value })}
                  placeholder="user_xxx"
                />
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select
                  value={createLicenseModal.plan}
                  onChange={e => setCreateLicenseModal({ ...createLicenseModal, plan: e.target.value })}
                  title="Select license plan"
                >
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration (days)</label>
                <input
                  type="number"
                  value={createLicenseModal.durationDays}
                  onChange={e => setCreateLicenseModal({ ...createLicenseModal, durationDays: parseInt(e.target.value) })}
                  min={1}
                  max={3650}
                  title="License duration in days"
                />
              </div>
              <div className="form-group">
                <label>Max Devices</label>
                <input
                  type="number"
                  value={createLicenseModal.maxDevices}
                  onChange={e => setCreateLicenseModal({ ...createLicenseModal, maxDevices: parseInt(e.target.value) })}
                  min={1}
                  max={100}
                  title="Maximum allowed devices"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setCreateLicenseModal({ ...createLicenseModal, isOpen: false })}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={async () => {
                  await handleCreateLicense({
                    userId: createLicenseModal.userId,
                    plan: createLicenseModal.plan,
                    durationDays: createLicenseModal.durationDays,
                    maxDevices: createLicenseModal.maxDevices
                  });
                  setCreateLicenseModal({ isOpen: false, userId: '', plan: 'pro', durationDays: 365, maxDevices: 3 });
                }}
              >
                Generate License
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {createApiKeyModal.isOpen && (
        <div className="modal-overlay" onClick={() => setCreateApiKeyModal({ ...createApiKeyModal, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create API Key</h2>
              <button onClick={() => setCreateApiKeyModal({ ...createApiKeyModal, isOpen: false })} title="Close modal">
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              {createApiKeyModal.newKeyValue ? (
                <div className="new-key-display">
                  <p>Your new API key (copy now, it will not be shown again):</p>
                  <code>{createApiKeyModal.newKeyValue}</code>
                  <button onClick={() => navigator.clipboard.writeText(createApiKeyModal.newKeyValue || '')} title="Copy API key to clipboard">
                    <Copy size={16} /> Copy
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Key Name</label>
                    <input
                      type="text"
                      value={createApiKeyModal.name}
                      onChange={e => setCreateApiKeyModal({ ...createApiKeyModal, name: e.target.value })}
                      placeholder="Production Key"
                    />
                  </div>
                  <div className="form-group">
                    <label>User ID</label>
                    <input
                      type="text"
                      value={createApiKeyModal.userId}
                      onChange={e => setCreateApiKeyModal({ ...createApiKeyModal, userId: e.target.value })}
                      placeholder="user_xxx"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rate Limit (requests/min)</label>
                    <input
                      type="number"
                      value={createApiKeyModal.rateLimit}
                      onChange={e => setCreateApiKeyModal({ ...createApiKeyModal, rateLimit: parseInt(e.target.value) })}
                      min={10}
                      max={10000}
                      title="API rate limit - requests per minute"
                    />
                  </div>
                  <div className="form-group">
                    <label>Permissions</label>
                    <div className="checkbox-group">
                      {['read', 'write', 'delete', 'admin'].map(perm => (
                        <label key={perm} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={createApiKeyModal.permissions.includes(perm)}
                            onChange={e => {
                              const perms = e.target.checked
                                ? [...createApiKeyModal.permissions, perm]
                                : createApiKeyModal.permissions.filter(p => p !== perm);
                              setCreateApiKeyModal({ ...createApiKeyModal, permissions: perms });
                            }}
                            title={`Toggle ${perm} permission`}
                          />
                          {perm}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setCreateApiKeyModal({ isOpen: false, userId: '', name: '', permissions: ['read'], rateLimit: 1000, newKeyValue: undefined })}
              >
                {createApiKeyModal.newKeyValue ? 'Done' : 'Cancel'}
              </button>
              {!createApiKeyModal.newKeyValue && (
                <button 
                  className="btn-primary"
                  onClick={async () => {
                    const rawKey = await handleCreateApiKey({
                      userId: createApiKeyModal.userId,
                      name: createApiKeyModal.name,
                      permissions: createApiKeyModal.permissions,
                      rateLimit: createApiKeyModal.rateLimit
                    });
                    setCreateApiKeyModal({ ...createApiKeyModal, newKeyValue: rawKey });
                  }}
                >
                  Create Key
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
          <div className="modal-content confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{confirmDialog.title}</h2>
            </div>
            <div className="modal-body">
              <p>{confirmDialog.message}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
