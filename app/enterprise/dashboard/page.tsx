'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Server,
  Shield,
  Activity,
  Zap,
  Globe,
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  Database,
  Lock,
  Key,
  Network,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  FileText,
  Cpu,
  HardDrive,
  Wifi,
  Calendar,
  Download
} from 'lucide-react';
import './dashboard.css';

interface EnterpriseStats {
  totalTeams: number;
  totalUsers: number;
  activeWorkflows: number;
  apiCalls: number;
  dataProcessed: string;
  uptime: string;
  securityScore: number;
  complianceStatus: string;
}

interface TeamOverview {
  id: string;
  name: string;
  users: number;
  plan: string;
  usage: number;
  status: 'active' | 'warning' | 'critical';
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
}

const MOCK_STATS: EnterpriseStats = {
  totalTeams: 47,
  totalUsers: 1245,
  activeWorkflows: 892,
  apiCalls: 45678900,
  dataProcessed: '2.4 PB',
  uptime: '99.99%',
  securityScore: 98,
  complianceStatus: 'SOC2 Type II'
};

const MOCK_TEAMS: TeamOverview[] = [
  { id: '1', name: 'Engineering', users: 156, plan: 'Enterprise', usage: 78, status: 'active' },
  { id: '2', name: 'Marketing', users: 89, plan: 'Business', usage: 92, status: 'warning' },
  { id: '3', name: 'Sales', users: 234, plan: 'Enterprise', usage: 65, status: 'active' },
  { id: '4', name: 'Operations', users: 67, plan: 'Business', usage: 45, status: 'active' },
  { id: '5', name: 'Analytics', users: 45, plan: 'Enterprise', usage: 88, status: 'active' },
  { id: '6', name: 'Support', users: 123, plan: 'Business', usage: 95, status: 'critical' }
];

const MOCK_ALERTS: SystemAlert[] = [
  { id: '1', type: 'warning', title: 'High API Usage', message: 'Marketing team approaching rate limit', timestamp: '5 min ago' },
  { id: '2', type: 'success', title: 'Backup Complete', message: 'Daily backup completed successfully', timestamp: '1 hour ago' },
  { id: '3', type: 'info', title: 'Maintenance Scheduled', message: 'System maintenance on Jan 15, 2AM UTC', timestamp: '3 hours ago' },
  { id: '4', type: 'error', title: 'Support Team Overload', message: 'Usage exceeds 95% of allocation', timestamp: '30 min ago' }
];

const MOCK_USAGE: UsageMetric[] = [
  { name: 'API Calls', current: 45678900, limit: 50000000, unit: 'calls' },
  { name: 'Storage', current: 2.4, limit: 5, unit: 'PB' },
  { name: 'Workflows', current: 892, limit: 1000, unit: 'active' },
  { name: 'Users', current: 1245, limit: 1500, unit: 'seats' },
  { name: 'Data Transfer', current: 890, limit: 1000, unit: 'TB/mo' }
];

export default function EnterpriseDashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<EnterpriseStats>(MOCK_STATS);
  const [teams, setTeams] = useState<TeamOverview[]>(MOCK_TEAMS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(MOCK_ALERTS);
  const [usage, setUsage] = useState<UsageMetric[]>(MOCK_USAGE);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoading(false);
    };
    loadData();
  }, []);

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString();
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'active': return 'status-active';
      case 'warning': return 'status-warning';
      case 'critical': return 'status-critical';
      default: return '';
    }
  };

  const getAlertIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'success': return <CheckCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      case 'error': return <AlertTriangle size={18} />;
      default: return <Activity size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="enterprise-dashboard-page">
        <div className="loading-container">
          <RefreshCw size={32} className="spin" />
          <p>Loading enterprise dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-title">
            <Building2 size={28} />
            <div>
              <h1>Enterprise Dashboard</h1>
              <p>Organization-wide management and monitoring</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Calendar size={18} />
            Schedule Report
          </button>
          <button className="btn-secondary">
            <Download size={18} />
            Export Data
          </button>
          <button className="btn-primary">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="enterprise-metrics">
        <div className="metric-card teams">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.totalTeams}</span>
            <span className="metric-label">Teams</span>
          </div>
          <div className="metric-badge">
            <ArrowUpRight size={14} />
            +3
          </div>
        </div>

        <div className="metric-card users">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatNumber(stats.totalUsers)}</span>
            <span className="metric-label">Total Users</span>
          </div>
          <div className="metric-badge positive">
            <ArrowUpRight size={14} />
            +127
          </div>
        </div>

        <div className="metric-card workflows">
          <div className="metric-icon">
            <Zap size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.activeWorkflows}</span>
            <span className="metric-label">Active Workflows</span>
          </div>
        </div>

        <div className="metric-card api">
          <div className="metric-icon">
            <Globe size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{formatNumber(stats.apiCalls)}</span>
            <span className="metric-label">API Calls</span>
          </div>
        </div>

        <div className="metric-card storage">
          <div className="metric-icon">
            <Database size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.dataProcessed}</span>
            <span className="metric-label">Data Processed</span>
          </div>
        </div>

        <div className="metric-card uptime">
          <div className="metric-icon">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.uptime}</span>
            <span className="metric-label">Uptime</span>
          </div>
        </div>

        <div className="metric-card security">
          <div className="metric-icon">
            <Shield size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.securityScore}</span>
            <span className="metric-label">Security Score</span>
          </div>
        </div>

        <div className="metric-card compliance">
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.complianceStatus}</span>
            <span className="metric-label">Compliance</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Team Overview */}
        <section className="teams-overview">
          <div className="section-header">
            <h2><Users size={20} /> Team Overview</h2>
            <a href="/enterprise/teams" className="view-all">
              Manage Teams <ChevronRight size={16} />
            </a>
          </div>
          <div className="teams-list">
            {teams.map((team) => (
              <div key={team.id} className={`team-card ${getStatusClass(team.status)}`}>
                <div className="team-info">
                  <span className="team-name">{team.name}</span>
                  <span className="team-plan">{team.plan}</span>
                </div>
                <div className="team-users">
                  <Users size={14} />
                  <span>{team.users}</span>
                </div>
                <div className="team-usage">
                  <div className="usage-bar">
                    <div 
                      className="usage-fill" 
                      style={{ width: `${team.usage}%` }}
                    />
                  </div>
                  <span className="usage-text">{team.usage}%</span>
                </div>
                <div className={`team-status ${getStatusClass(team.status)}`}>
                  <span className="status-dot"></span>
                  {team.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Metrics */}
        <section className="usage-metrics">
          <div className="section-header">
            <h2><BarChart3 size={20} /> Resource Usage</h2>
          </div>
          <div className="usage-list">
            {usage.map((metric, i) => (
              <div key={i} className="usage-item">
                <div className="usage-header">
                  <span className="usage-name">{metric.name}</span>
                  <span className="usage-values">
                    {metric.name === 'API Calls' ? formatNumber(metric.current) : metric.current} / {metric.name === 'API Calls' ? formatNumber(metric.limit) : metric.limit} {metric.unit}
                  </span>
                </div>
                <div className="usage-bar-container">
                  <div 
                    className="usage-bar-fill" 
                    style={{ 
                      width: `${(metric.current / metric.limit) * 100}%`,
                      backgroundColor: (metric.current / metric.limit) > 0.9 ? '#ef4444' : 
                                       (metric.current / metric.limit) > 0.75 ? '#f59e0b' : '#22c55e'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Alerts */}
        <section className="system-alerts">
          <div className="section-header">
            <h2><AlertTriangle size={20} /> System Alerts</h2>
            <span className="alert-count">{alerts.length}</span>
          </div>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.type}`}>
                <div className={`alert-icon ${alert.type}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <span className="alert-title">{alert.title}</span>
                  <span className="alert-message">{alert.message}</span>
                </div>
                <span className="alert-time">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <div className="section-header">
            <h2><Zap size={20} /> Quick Actions</h2>
          </div>
          <div className="actions-grid">
            <a href="/enterprise/users" className="action-card">
              <Users size={24} />
              <span>Manage Users</span>
            </a>
            <a href="/enterprise/api-gateway" className="action-card">
              <Key size={24} />
              <span>API Keys</span>
            </a>
            <a href="/enterprise/security" className="action-card">
              <Shield size={24} />
              <span>Security</span>
            </a>
            <a href="/enterprise/workflows" className="action-card">
              <Network size={24} />
              <span>Workflows</span>
            </a>
            <a href="/enterprise/integrations" className="action-card">
              <Globe size={24} />
              <span>Integrations</span>
            </a>
            <a href="/enterprise/pipelines" className="action-card">
              <Server size={24} />
              <span>Pipelines</span>
            </a>
          </div>
        </section>

        {/* Infrastructure Status */}
        <section className="infrastructure-status">
          <div className="section-header">
            <h2><Server size={20} /> Infrastructure</h2>
            <span className="status-badge operational">
              <CheckCircle size={14} />
              All Systems Operational
            </span>
          </div>
          <div className="infra-grid">
            <div className="infra-item">
              <div className="infra-icon">
                <Cpu size={20} />
              </div>
              <div className="infra-info">
                <span className="infra-name">CPU Clusters</span>
                <span className="infra-status">12 nodes active</span>
              </div>
              <div className="infra-metric">34%</div>
            </div>
            <div className="infra-item">
              <div className="infra-icon">
                <HardDrive size={20} />
              </div>
              <div className="infra-info">
                <span className="infra-name">Storage</span>
                <span className="infra-status">Distributed SSD</span>
              </div>
              <div className="infra-metric">48%</div>
            </div>
            <div className="infra-item">
              <div className="infra-icon">
                <Wifi size={20} />
              </div>
              <div className="infra-info">
                <span className="infra-name">Network</span>
                <span className="infra-status">10 Gbps backbone</span>
              </div>
              <div className="infra-metric">23%</div>
            </div>
            <div className="infra-item">
              <div className="infra-icon">
                <Lock size={20} />
              </div>
              <div className="infra-info">
                <span className="infra-name">Security Layer</span>
                <span className="infra-status">WAF + DDoS</span>
              </div>
              <div className="infra-metric">Active</div>
            </div>
          </div>
        </section>

        {/* Compliance & Certifications */}
        <section className="compliance-section">
          <div className="section-header">
            <h2><Shield size={20} /> Compliance & Certifications</h2>
          </div>
          <div className="compliance-grid">
            <div className="compliance-badge">
              <span className="badge-icon">SOC2</span>
              <span className="badge-label">Type II Certified</span>
            </div>
            <div className="compliance-badge">
              <span className="badge-icon">GDPR</span>
              <span className="badge-label">Compliant</span>
            </div>
            <div className="compliance-badge">
              <span className="badge-icon">HIPAA</span>
              <span className="badge-label">Compliant</span>
            </div>
            <div className="compliance-badge">
              <span className="badge-icon">ISO</span>
              <span className="badge-label">27001</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
