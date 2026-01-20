'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Server,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Bell,
  Search,
  Download,
  Filter
} from 'lucide-react';
import './dashboard.css';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  uptime: string;
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  totalTransactions: number;
  avgSessionDuration: string;
  conversionRate: number;
  churnRate: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'payment' | 'support_ticket' | 'system_alert' | 'deployment';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: number;
  latency: number;
}

const MOCK_STATS: PlatformStats = {
  totalUsers: 156847,
  activeUsers: 42356,
  newUsersToday: 847,
  totalRevenue: 8456720,
  mrr: 456890,
  arr: 5482680,
  totalTransactions: 89456,
  avgSessionDuration: '24m 35s',
  conversionRate: 4.8,
  churnRate: 1.2
};

const MOCK_METRICS: SystemMetrics = {
  cpuUsage: 34,
  memoryUsage: 67,
  diskUsage: 45,
  networkIn: 245.8,
  networkOut: 189.3,
  activeConnections: 15847,
  uptime: '99.99%'
};

const MOCK_SERVICES: ServiceStatus[] = [
  { name: 'API Gateway', status: 'operational', uptime: 99.99, latency: 45 },
  { name: 'Authentication', status: 'operational', uptime: 99.98, latency: 32 },
  { name: 'Database Cluster', status: 'operational', uptime: 99.97, latency: 12 },
  { name: 'CDN', status: 'operational', uptime: 100, latency: 8 },
  { name: 'Payment Gateway', status: 'operational', uptime: 99.99, latency: 156 },
  { name: 'Email Service', status: 'degraded', uptime: 98.5, latency: 890 },
  { name: 'WebSocket Server', status: 'operational', uptime: 99.95, latency: 23 },
  { name: 'AI Processing', status: 'operational', uptime: 99.92, latency: 245 }
];

const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Enterprise Plan Upgrade',
    description: 'Acme Corp upgraded to Enterprise ($2,499/mo)',
    timestamp: '2 minutes ago',
    status: 'success'
  },
  {
    id: '2',
    type: 'user_signup',
    title: 'New Team Registration',
    description: '15 users joined from TechStart Inc.',
    timestamp: '8 minutes ago',
    status: 'success'
  },
  {
    id: '3',
    type: 'system_alert',
    title: 'High Memory Usage',
    description: 'Worker node-3 memory at 85%',
    timestamp: '15 minutes ago',
    status: 'warning'
  },
  {
    id: '4',
    type: 'deployment',
    title: 'Production Deployment',
    description: 'v2.4.1 deployed successfully',
    timestamp: '1 hour ago',
    status: 'success'
  },
  {
    id: '5',
    type: 'support_ticket',
    title: 'Priority Support Ticket',
    description: 'Enterprise client billing issue',
    timestamp: '2 hours ago',
    status: 'info'
  }
];

const GEOGRAPHIC_DATA = [
  { country: 'United States', users: 45230, revenue: 2845600, growth: 12.5 },
  { country: 'United Kingdom', users: 18940, revenue: 1245800, growth: 8.3 },
  { country: 'Germany', users: 15670, revenue: 987400, growth: 15.2 },
  { country: 'Japan', users: 12450, revenue: 856200, growth: 22.1 },
  { country: 'Australia', users: 9870, revenue: 654300, growth: 18.7 }
];

export default function AdminDashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<PlatformStats>(MOCK_STATS);
  const [metrics, setMetrics] = useState<SystemMetrics>(MOCK_METRICS);
  const [services, setServices] = useState<ServiceStatus[]>(MOCK_SERVICES);
  const [activities, setActivities] = useState<RecentActivity[]>(MOCK_ACTIVITIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
      setLastUpdated(new Date());
    };
    loadData();

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(20, prev.cpuUsage + (Math.random() * 10 - 5))),
        memoryUsage: Math.min(100, Math.max(40, prev.memoryUsage + (Math.random() * 6 - 3))),
        networkIn: Math.max(100, prev.networkIn + (Math.random() * 50 - 25)),
        networkOut: Math.max(80, prev.networkOut + (Math.random() * 40 - 20)),
        activeConnections: Math.max(10000, prev.activeConnections + Math.floor(Math.random() * 200 - 100))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return 'status-operational';
      case 'degraded': return 'status-degraded';
      case 'outage': return 'status-outage';
      default: return '';
    }
  };

  const getActivityIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'user_signup': return <Users size={16} />;
      case 'payment': return <DollarSign size={16} />;
      case 'support_ticket': return <Bell size={16} />;
      case 'system_alert': return <AlertTriangle size={16} />;
      case 'deployment': return <Server size={16} />;
      default: return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-title">
            <LayoutDashboard size={28} />
            <div>
              <h1>Admin Dashboard</h1>
              <p>Platform overview and system monitoring</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search..." />
          </div>
          <div className="time-filter">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <button className="btn-icon" title="Export Data">
            <Download size={18} />
          </button>
          <button className="btn-icon" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="key-metrics">
        <div className="metric-card highlight">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatNumber(stats.totalUsers)}</span>
            <span className="metric-label">Total Users</span>
            <div className="metric-change positive">
              <ArrowUpRight size={14} />
              <span>+{stats.newUsersToday} today</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon active">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatNumber(stats.activeUsers)}</span>
            <span className="metric-label">Active Now</span>
            <div className="metric-change positive">
              <ArrowUpRight size={14} />
              <span>+8.4%</span>
            </div>
          </div>
        </div>

        <div className="metric-card revenue">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatCurrency(stats.mrr)}</span>
            <span className="metric-label">Monthly Revenue</span>
            <div className="metric-change positive">
              <ArrowUpRight size={14} />
              <span>+12.3%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatCurrency(stats.arr)}</span>
            <span className="metric-label">ARR</span>
            <div className="metric-change positive">
              <ArrowUpRight size={14} />
              <span>+24.7%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.avgSessionDuration}</span>
            <span className="metric-label">Avg Session</span>
            <div className="metric-change positive">
              <ArrowUpRight size={14} />
              <span>+3.2%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon warn">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.churnRate}%</span>
            <span className="metric-label">Churn Rate</span>
            <div className="metric-change negative">
              <ArrowDownRight size={14} />
              <span>-0.3%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* System Health */}
        <section className="system-health">
          <div className="section-header">
            <h2><Server size={20} /> System Health</h2>
            <span className="uptime-badge">
              <CheckCircle size={14} />
              {metrics.uptime} uptime
            </span>
          </div>

          <div className="health-metrics">
            <div className="health-metric">
              <div className="health-label">
                <Cpu size={16} />
                <span>CPU Usage</span>
              </div>
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ 
                    width: `${metrics.cpuUsage}%`,
                    backgroundColor: metrics.cpuUsage > 80 ? '#ef4444' : metrics.cpuUsage > 60 ? '#f59e0b' : '#22c55e'
                  }} 
                />
              </div>
              <span className="health-value">{metrics.cpuUsage.toFixed(1)}%</span>
            </div>

            <div className="health-metric">
              <div className="health-label">
                <HardDrive size={16} />
                <span>Memory</span>
              </div>
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ 
                    width: `${metrics.memoryUsage}%`,
                    backgroundColor: metrics.memoryUsage > 80 ? '#ef4444' : metrics.memoryUsage > 60 ? '#f59e0b' : '#22c55e'
                  }} 
                />
              </div>
              <span className="health-value">{metrics.memoryUsage.toFixed(1)}%</span>
            </div>

            <div className="health-metric">
              <div className="health-label">
                <HardDrive size={16} />
                <span>Disk</span>
              </div>
              <div className="health-bar">
                <div 
                  className="health-fill" 
                  style={{ 
                    width: `${metrics.diskUsage}%`,
                    backgroundColor: metrics.diskUsage > 80 ? '#ef4444' : metrics.diskUsage > 60 ? '#f59e0b' : '#22c55e'
                  }} 
                />
              </div>
              <span className="health-value">{metrics.diskUsage}%</span>
            </div>

            <div className="health-metric">
              <div className="health-label">
                <Wifi size={16} />
                <span>Network I/O</span>
              </div>
              <div className="network-stats">
                <span className="net-in">↓ {metrics.networkIn.toFixed(1)} MB/s</span>
                <span className="net-out">↑ {metrics.networkOut.toFixed(1)} MB/s</span>
              </div>
            </div>

            <div className="health-metric">
              <div className="health-label">
                <Globe size={16} />
                <span>Active Connections</span>
              </div>
              <span className="connections-value">{formatNumber(metrics.activeConnections)}</span>
            </div>
          </div>
        </section>

        {/* Service Status */}
        <section className="service-status">
          <div className="section-header">
            <h2><Shield size={20} /> Service Status</h2>
            <a href="/admin/status" className="view-all">
              View Status Page <ChevronRight size={16} />
            </a>
          </div>

          <div className="services-list">
            {services.map((service) => (
              <div key={service.name} className={`service-item ${getStatusColor(service.status)}`}>
                <div className="service-indicator" />
                <div className="service-info">
                  <span className="service-name">{service.name}</span>
                  <span className="service-uptime">{service.uptime}% uptime</span>
                </div>
                <span className="service-latency">{service.latency}ms</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity">
          <div className="section-header">
            <h2><Activity size={20} /> Recent Activity</h2>
            <a href="/admin/activity" className="view-all">
              View All <ChevronRight size={16} />
            </a>
          </div>

          <div className="activity-list">
            {activities.map((activity) => (
              <div key={activity.id} className={`activity-item ${activity.status}`}>
                <div className={`activity-icon ${activity.status}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-description">{activity.description}</span>
                </div>
                <span className="activity-time">{activity.timestamp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Geographic Distribution */}
        <section className="geographic-stats">
          <div className="section-header">
            <h2><Globe size={20} /> Geographic Distribution</h2>
            <button className="btn-icon">
              <Filter size={16} />
            </button>
          </div>

          <div className="geo-table">
            <div className="geo-header">
              <span>Country</span>
              <span>Users</span>
              <span>Revenue</span>
              <span>Growth</span>
            </div>
            {GEOGRAPHIC_DATA.map((geo) => (
              <div key={geo.country} className="geo-row">
                <span className="geo-country">{geo.country}</span>
                <span className="geo-users">{formatNumber(geo.users)}</span>
                <span className="geo-revenue">{formatCurrency(geo.revenue)}</span>
                <span className={`geo-growth ${geo.growth > 0 ? 'positive' : 'negative'}`}>
                  {geo.growth > 0 ? '+' : ''}{geo.growth}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <div className="section-header">
            <h2><LayoutDashboard size={20} /> Quick Actions</h2>
          </div>

          <div className="actions-grid">
            <a href="/admin/users" className="action-card">
              <Users size={24} />
              <span>Manage Users</span>
            </a>
            <a href="/admin/billing" className="action-card">
              <DollarSign size={24} />
              <span>Billing</span>
            </a>
            <a href="/admin/analytics" className="action-card">
              <TrendingUp size={24} />
              <span>Analytics</span>
            </a>
            <a href="/admin/security" className="action-card">
              <Shield size={24} />
              <span>Security</span>
            </a>
            <a href="/admin/deployments" className="action-card">
              <Server size={24} />
              <span>Deployments</span>
            </a>
            <a href="/admin/support" className="action-card">
              <Bell size={24} />
              <span>Support</span>
            </a>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        <span>CUBE Elite Admin v2.4.1</span>
      </footer>
    </div>
  );
}
